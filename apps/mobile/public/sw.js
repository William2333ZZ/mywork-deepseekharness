/*
 * MyWork — the web version's service worker: only notifications (no offline cache; the app needs the computer anyway).
 *
 * The computer pushes `{ title, body, tag, mateId, runId, silent }`, encrypted for this browser (packages/kit/src/
 * webpush.js); the browser hands it here decrypted. Tapping the notification opens MyWork at that teammate's
 * conversation: an open window is focused and told where to go, otherwise a new one opens at /?mate=…&run=….
 */
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let m = {}
  try { m = event.data ? event.data.json() : {} } catch { m = { body: event.data ? event.data.text() : '' } }
  const title = m.title || 'MyWork'
  event.waitUntil((async () => {
    await self.registration.showNotification(title, {
      body: m.body || '',
      tag: m.tag || undefined,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      silent: !!m.silent,
      data: { mateId: m.mateId || '', runId: m.runId || '' },
    })
    // An open window polls now instead of in 30 s.
    for (const c of await self.clients.matchAll({ type: 'window' })) c.postMessage({ mywork: 'push' })
  })())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const { mateId = '', runId = '' } = event.notification.data || {}
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const win = wins[0]
    if (win) {
      await win.focus()
      if (mateId) win.postMessage({ mywork: 'open', mateId, runId })
      return
    }
    const q = mateId ? '?mate=' + encodeURIComponent(mateId) + (runId ? '&run=' + encodeURIComponent(runId) : '') : ''
    await self.clients.openWindow('/' + q)
  })())
})
