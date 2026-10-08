/**
 * Open a teammate's folder file in another app on the phone (web pages, PDFs, Office files): through the relay its bytes
 * come down the encrypted line into the app's cache under the file's own name; Android then asks the system to open it
 * (VIEW — the browser takes a web page, a PDF viewer a PDF), falling back to the share sheet when no app opens that kind;
 * iOS gets the share sheet, which has 「用其他应用打开」. An older pairing on the computer's Wi-Fi hands the signed link
 * to the browser instead.
 */
import { Linking, Platform } from 'react-native'
import * as FileSystem from 'expo-file-system'
import * as IntentLauncher from 'expo-intent-launcher'
import * as Sharing from 'expo-sharing'
import type { Api } from './api'

const FLAG_GRANT_READ_URI_PERMISSION = 1
const BY_EXT: Record<string, string> = {
  html: 'text/html', htm: 'text/html', pdf: 'application/pdf', svg: 'image/svg+xml',
  doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip', mp4: 'video/mp4', mp3: 'audio/mpeg',
}

/** The kind to announce: what the computer said, unless that is generic and the name says more. */
function mimeOf(name: string, contentType: string) {
  const said = contentType.split(';')[0].trim().toLowerCase()
  const byName = BY_EXT[(name.split('.').pop() || '').toLowerCase()]
  return !said || said === 'application/octet-stream' || (said === 'text/plain' && byName) ? byName || said || '*/*' : said
}

export async function openElsewhere(api: Api, base: string, mateId: string, path: string, download: boolean): Promise<void> {
  const link = await api.fileLink(mateId, path)
  if (api.via !== 'relay') { await Linking.openURL(base + link.url + (download ? '&dl=1' : '')); return }
  const file = await api.raw(link.url)
  const name = (path.split('/').pop() || 'file').replace(/[\\/:*?"<>|]+/g, '_')
  const dir = (FileSystem.cacheDirectory || '') + 'open/' + Date.now().toString(36) + '/'
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true })
  const uri = dir + name
  await FileSystem.writeAsStringAsync(uri, file.b64, { encoding: FileSystem.EncodingType.Base64 })
  const type = mimeOf(name, file.contentType)
  if (Platform.OS === 'android') {
    try {
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', { data: await FileSystem.getContentUriAsync(uri), type, flags: FLAG_GRANT_READ_URI_PERMISSION })
      return
    } catch { /* no app opens this kind: offer the share sheet */ }
  }
  if (!(await Sharing.isAvailableAsync())) throw new Error('这台手机上没有能打开它的应用')
  await Sharing.shareAsync(uri, { mimeType: type, dialogTitle: '用其他应用打开' })
}
