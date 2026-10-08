/**
 * The web version's 「用其他应用打开」: the file comes down the encrypted line and is saved through the browser's download,
 * from where the phone opens it with whatever handles it. It is never opened in this page's own origin: a teammate's web
 * page running here could read the pairing kept in this browser.
 */
import type { Api } from './api'
import { fromB64 } from './relay'

export async function openElsewhere(api: Api, _base: string, mateId: string, path: string, _download: boolean): Promise<void> {
  const link = await api.fileLink(mateId, path)
  const file = await api.raw(link.url)
  const name = (path.split('/').pop() || 'file').replace(/[\\/:*?"<>|]+/g, '_')
  const bytes = fromB64(file.b64)
  const url = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: 'application/octet-stream' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
