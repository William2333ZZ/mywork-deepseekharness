/**
 * Open a teammate's folder file in another app on the phone (web pages, PDFs, Office files): through the relay its bytes
 * come down the encrypted line into the app's cache and the system's 「用其他应用打开」 chooser takes it from there; an
 * older pairing on the computer's Wi-Fi hands the signed link to the browser instead.
 */
import { Linking } from 'react-native'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import type { Api } from './api'

export async function openElsewhere(api: Api, base: string, mateId: string, path: string, download: boolean): Promise<void> {
  const link = await api.fileLink(mateId, path)
  if (api.via !== 'relay') { await Linking.openURL(base + link.url + (download ? '&dl=1' : '')); return }
  const file = await api.raw(link.url)
  const name = (path.split('/').pop() || 'file').replace(/[\\/:*?"<>|\s]+/g, '_')
  const uri = (FileSystem.cacheDirectory || '') + 'open-' + Date.now().toString(36) + '-' + name
  await FileSystem.writeAsStringAsync(uri, file.b64, { encoding: FileSystem.EncodingType.Base64 })
  if (!(await Sharing.isAvailableAsync())) throw new Error('这台手机打不开「用其他应用打开」')
  await Sharing.shareAsync(uri, { mimeType: file.contentType.split(';')[0].trim() || undefined, dialogTitle: '用其他应用打开' })
}
