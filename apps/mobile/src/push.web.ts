/**
 * Phone notifications on the web version: Web Push. The browser subscribes with its own push service (FCM on Android
 * Chrome; Apple's on an iPhone, only once MyWork is on the home screen, iOS 16.4+) using the computer's VAPID key, and
 * the subscription goes to the computer through the encrypted relay (/mywork-kit/api/push/*). The computer then pushes
 * to it directly, encrypted for this browser; public/sw.js shows the notification and opens the conversation on a tap.
 */
import type { Api } from './api'

export type PushState = 'off' | 'on' | 'denied' | 'install' | 'unsupported'

const supported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
const ios = () => typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
const standalone = () => { try { return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true } catch { return false } }

let registering: Promise<ServiceWorkerRegistration> | null = null
const registration = () => (registering ||= navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready))

const keyBytes = (b64url: string) => {
  const s = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
const label = () => (ios() ? 'iPhone' : /Android/.test(navigator.userAgent) ? 'Android' : '浏览器')
const current = async () => { try { return await (await registration()).pushManager.getSubscription() } catch { return null } }

export async function pushState(): Promise<PushState> {
  if (!supported()) return ios() && !standalone() ? 'install' : 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.permission === 'granted' && (await current()) ? 'on' : 'off'
}

/** Ask the browser (it shows its own prompt; must follow a tap), subscribe, hand the subscription to the computer. */
export async function pushEnable(api: Api): Promise<PushState> {
  if (!supported()) return pushState()
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return perm === 'denied' ? 'denied' : 'off'
  const { key } = await api.pushKey()
  const reg = await registration()
  let sub = await reg.pushManager.getSubscription()
  // A subscription made with another computer's key (paired again with a different one) cannot be reused.
  const same = sub && sub.options && sub.options.applicationServerKey
    ? new Uint8Array(sub.options.applicationServerKey).join(',') === keyBytes(key).join(',') : !!sub
  if (sub && !same) { await sub.unsubscribe().catch(() => {}); sub = null }
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) })
  await api.pushSubscribe({ ...sub.toJSON(), label: label() })
  return 'on'
}

export async function pushDisable(api: Api): Promise<PushState> {
  const sub = await current()
  if (sub) { await api.pushUnsubscribe(sub.endpoint).catch(() => {}); await sub.unsubscribe().catch(() => {}) }
  return pushState()
}

export async function pushTest(api: Api): Promise<void> {
  const sub = await current()
  if (!sub) throw new Error('这台手机还没开通知')
  await api.pushTest(sub.endpoint)
}

export async function pushResync(api: Api): Promise<void> {
  if (!supported() || Notification.permission !== 'granted') return
  const sub = await current()
  if (sub) await api.pushSubscribe({ ...sub.toJSON(), label: label() }).catch(() => {})
}

export function onPushMessages(open: (mateId: string, runId?: string) => void, onPush: () => void): () => void {
  if (!supported()) return () => {}
  const fn = (e: MessageEvent) => {
    const d = e.data || {}
    if (d.mywork === 'open' && typeof d.mateId === 'string' && d.mateId) open(d.mateId, typeof d.runId === 'string' && d.runId ? d.runId : undefined)
    else if (d.mywork === 'push') onPush()
  }
  navigator.serviceWorker.addEventListener('message', fn)
  return () => navigator.serviceWorker.removeEventListener('message', fn)
}

export function openedFor(): { mateId: string; runId?: string } | null {
  if (typeof window === 'undefined') return null
  const q = new URLSearchParams(window.location.search)
  const mateId = q.get('mate') || ''
  if (!mateId) return null
  const runId = q.get('run') || undefined
  try { window.history.replaceState(null, '', window.location.pathname + window.location.hash) } catch { /* the address keeps it */ }
  return { mateId, runId }
}
