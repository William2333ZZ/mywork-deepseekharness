/**
 * dsh-mywork-kit — Web Push to the phone (设置 on the phone → 通知).
 *
 * The phone's web version (apps/mobile, served by the relay) subscribes with the browser's own push service (FCM on
 * Android Chrome, Apple's on an iPhone that added MyWork to its home screen) and hands the subscription to this
 * computer through the encrypted relay. When a teammate has something for you, this computer posts the notification
 * straight to that push service: nothing new runs in the cloud, and the relay is not involved.
 *
 *   - VAPID (RFC 8292): this computer keeps a P-256 key pair in $DSH_HOME/mywork/push.json; the phone subscribes with
 *     its public key, and every push is signed with a short ES256 JWT, so only this computer can push to that phone;
 *   - the payload is encrypted for the phone (RFC 8291, aes128gcm) with the keys in its subscription: the push service
 *     carries it and cannot read it;
 *   - a subscription the push service no longer knows (404 / 410) is forgotten.
 *
 * What goes out is the same set the IM notifier sends (a reminder, a question, a routine run with news, a failed run,
 * a long run that finished), each a short title and one line. During 免打扰 (the IM 通知 setting's quiet window,
 * 22:00–07:30 unless changed) a notification still arrives but makes no sound; a reminder you set for that time rings.
 *
 * push.json: { vapid: { publicKey (base64url, 65-byte point), privateKey (PKCS#8 PEM) }, subject,
 *              subscriptions: [{ endpoint, keys: { p256dh, auth }, label, at }] }
 */
import { createECDH, createPrivateKey, createPublicKey, generateKeyPairSync, hkdfSync, randomBytes, sign, createCipheriv } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

/** At most this many phones / browsers receive pushes; the oldest subscription makes room. */
export const MAX_SUBSCRIPTIONS = 8
const DEFAULT_SUBJECT = 'mailto:mywork@localhost'
const TTL = 24 * 3600

const b64url = (buf) => Buffer.from(buf).toString('base64url')
const unb64url = (s) => Buffer.from(String(s || ''), 'base64url')

/** A new VAPID key pair: the public key as the uncompressed point (what PushManager.subscribe wants), the private as PEM. */
export function newVapidKeys() {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  const jwk = publicKey.export({ format: 'jwk' })
  const point = Buffer.concat([Buffer.from([4]), unb64url(jwk.x), unb64url(jwk.y)])
  return { publicKey: b64url(point), privateKey: privateKey.export({ format: 'pem', type: 'pkcs8' }) }
}

/** `Authorization: vapid t=<JWT>, k=<public key>` for one push service (its origin is the JWT's audience). */
export function vapidAuthorization(endpoint, vapid, subject = DEFAULT_SUBJECT, now = Date.now()) {
  const aud = new URL(endpoint).origin
  const header = b64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
  const claims = b64url(JSON.stringify({ aud, exp: Math.floor(now / 1000) + 12 * 3600, sub: subject }))
  const sig = sign('sha256', Buffer.from(header + '.' + claims), { key: createPrivateKey(vapid.privateKey), dsaEncoding: 'ieee-p1363' })
  return `vapid t=${header}.${claims}.${b64url(sig)}, k=${vapid.publicKey}`
}

/**
 * The payload encrypted for one subscription (RFC 8291 + RFC 8188 aes128gcm, one record): salt ‖ record size ‖ the
 * sender's ephemeral public key ‖ ciphertext. `salt` and `ephemeral` are only passed in by tests.
 */
export function encryptPayload(plaintext, keys, { salt = randomBytes(16), ephemeral = null } = {}) {
  const uaPublic = unb64url(keys.p256dh)
  const authSecret = unb64url(keys.auth)
  if (uaPublic.length !== 65 || authSecret.length < 16) throw new Error('bad subscription keys')
  const ecdh = createECDH('prime256v1')
  if (ephemeral) ecdh.setPrivateKey(ephemeral); else ecdh.generateKeys()
  const asPublic = ecdh.getPublicKey()
  const shared = ecdh.computeSecret(uaPublic)
  const ikm = Buffer.from(hkdfSync('sha256', shared, authSecret, Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic]), 32))
  const cek = Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16))
  const nonce = Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12))
  const cipher = createCipheriv('aes-128-gcm', cek, nonce)
  const body = Buffer.concat([cipher.update(Buffer.concat([Buffer.from(plaintext), Buffer.from([2])])), cipher.final(), cipher.getAuthTag()])
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096)
  return Buffer.concat([salt, rs, Buffer.from([asPublic.length]), asPublic, body])
}

/** A subscription as the phone sent it (PushSubscription.toJSON()), checked; null when it is not one. */
export function normalizeSubscription(s) {
  if (!s || typeof s !== 'object') return null
  let url
  try { url = new URL(String(s.endpoint || '')) } catch { return null }
  if (url.protocol !== 'https:') return null
  const keys = s.keys && typeof s.keys === 'object' ? s.keys : {}
  const p256dh = String(keys.p256dh || ''); const auth = String(keys.auth || '')
  if (unb64url(p256dh).length !== 65 || unb64url(auth).length < 16) return null
  return { endpoint: url.href, keys: { p256dh, auth }, label: String(s.label || '').slice(0, 40), at: new Date().toISOString() }
}

// 免打扰, read from the IM 通知 setting ($DSH_HOME/mywork/im-notify.json `quiet`): missing → 22:00–07:30, null → off.
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/
export function quietOf(config) {
  const q = config && typeof config === 'object' ? config.quiet : undefined
  if (q === null || q === false) return null
  if (q && HHMM.test(String(q.from)) && HHMM.test(String(q.to)) && q.from !== q.to) return { from: q.from, to: q.to }
  return { from: '22:00', to: '07:30' }
}
const minutes = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))
export function inQuiet(now, quiet) {
  if (!quiet) return false
  const m = now.getHours() * 60 + now.getMinutes(); const a = minutes(quiet.from); const b = minutes(quiet.to)
  return a < b ? m >= a && m < b : m >= a || m < b
}

const LONG_RUN_MS = 2 * 60000
const line = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t }
/**
 * What a `mywork/task` event becomes on the phone: { title, body, tag, mateId, runId, urgent } or null. The same set
 * the IM notifier sends; chat replies you are looking at, the intro and quiet routine runs never do.
 */
export function noticeFor(payload) {
  if (!payload || !payload.run) return null
  const mate = payload.mate || null
  if (mate && mate.notify === false) return null
  const who = mate && mate.name ? mate.name : 'MyWork'
  const run = payload.run
  const base = { mateId: run.mateId || (mate && mate.id) || '', runId: run.id || '', tag: 'run-' + (run.id || '') }
  if (payload.kind === 'remind') {
    const r = payload.routine || { title: run.routineTitle, input: run.input }
    return { ...base, title: `${who} · 提醒`, body: line(r.title, 80) + (r.input && r.input !== r.title ? '\n' + line(r.input, 120) : ''), urgent: true }
  }
  if (payload.kind === 'waiting') {
    const q = run.ask && run.ask.question ? String(run.ask.question) : ''
    return { ...base, title: `${who} · 等你答`, body: line(q || '有个问题要你定', 140), urgent: false }
  }
  if (payload.kind !== 'done' || run.remind || run.trigger === 'system') return null
  const failed = !!run.error
  if (failed && run.error === '已停止。') return null
  if (run.quiet && !failed) return null
  const took = Date.parse(run.finishedAt) - Date.parse(run.startedAt || run.createdAt)
  if (run.trigger === 'user' && !failed && !(took >= LONG_RUN_MS)) return null
  const reply = [...(run.activity || [])].reverse().find((a) => a && a.kind === 'text')
  const body = failed ? run.error : (reply ? reply.text : run.deliverables && run.deliverables[0] ? run.deliverables[0].title : run.summary)
  const what = run.trigger === 'routine' ? (run.routineTitle || '例行') : line(run.input, 30)
  return { ...base, title: `${who} · ${what} · ${failed ? '失败' : '完成'}`, body: line(body || '', 160), urgent: false }
}

/**
 * The push sender over push.json. `fetchImpl` and `now` are for tests.
 * @param {{ file: string, readQuiet?: () => any, log?: (m: string) => void, fetchImpl?: typeof fetch, now?: () => Date }} opts
 */
export function createPusher({ file, readQuiet = () => ({ quiet: null }), log = () => {}, fetchImpl = globalThis.fetch, now = () => new Date() }) {
  let data = null
  const load = () => {
    if (data) return data
    try { data = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {} } catch { data = {} }
    if (!Array.isArray(data.subscriptions)) data.subscriptions = []
    return data
  }
  const save = () => {
    mkdirSync(dirname(file), { recursive: true })
    const tmp = file + '.tmp-' + process.pid
    writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 })
    renameSync(tmp, file)
  }
  const vapid = () => {
    const d = load()
    let ok = false
    try { ok = !!(d.vapid && d.vapid.publicKey && createPublicKey(createPrivateKey(d.vapid.privateKey))) } catch { ok = false }
    if (!ok) { d.vapid = newVapidKeys(); save() }
    return d.vapid
  }
  const forget = (endpoint) => {
    const d = load()
    const before = d.subscriptions.length
    d.subscriptions = d.subscriptions.filter((s) => s.endpoint !== endpoint)
    if (d.subscriptions.length !== before) save()
    return d.subscriptions.length !== before
  }
  /** Post one message to one subscription; 'sent' | 'gone' (forgotten) | 'failed'. */
  const deliver = async (sub, message, { urgent = false } = {}) => {
    try {
      const v = vapid()
      const res = await fetchImpl(sub.endpoint, {
        method: 'POST',
        headers: { authorization: vapidAuthorization(sub.endpoint, v, load().subject || DEFAULT_SUBJECT, now().getTime()), 'content-encoding': 'aes128gcm', 'content-type': 'application/octet-stream', ttl: String(TTL), urgency: urgent ? 'high' : 'normal' },
        body: encryptPayload(JSON.stringify(message), sub.keys),
      })
      if (res.status === 404 || res.status === 410) { forget(sub.endpoint); log(`push: ${sub.label || 'a phone'} unsubscribed (${res.status}), forgotten`); return 'gone' }
      if (res.status >= 200 && res.status < 300) return 'sent'
      log(`push: ${sub.label || 'a phone'} → HTTP ${res.status}`)
      return 'failed'
    } catch (e) { log('push failed: ' + ((e && e.message) || e)); return 'failed' }
  }
  return {
    publicKey: () => vapid().publicKey,
    list: () => load().subscriptions.map((s) => ({ endpoint: s.endpoint, label: s.label, at: s.at })),
    has: (endpoint) => load().subscriptions.some((s) => s.endpoint === endpoint),
    subscribe(input) {
      const s = normalizeSubscription(input)
      if (!s) throw Object.assign(new Error('这不是一个推送订阅'), { status: 400 })
      const d = load()
      d.subscriptions = d.subscriptions.filter((x) => x.endpoint !== s.endpoint)
      d.subscriptions.push(s)
      while (d.subscriptions.length > MAX_SUBSCRIPTIONS) d.subscriptions.shift()
      save()
      return s
    },
    unsubscribe: (endpoint) => forget(String(endpoint || '')),
    /** A new pairing: every phone subscribes again once it has scanned the new code. */
    clear() { const d = load(); if (d.subscriptions.length) { d.subscriptions = []; save() } },
    deliver,
    /** One message to one subscribed phone (its 发一条试试); 'unknown' when it is not subscribed. */
    async test(endpoint, message) {
      const sub = load().subscriptions.find((s) => s.endpoint === String(endpoint || ''))
      return sub ? deliver(sub, message, { urgent: true }) : 'unknown'
    },
    /** A teammate notice to every subscribed phone; resolves to how many took it. Quiet hours: no sound, unless urgent. */
    async notify(n) {
      const subs = load().subscriptions.slice()
      if (!n || !subs.length) return 0
      const silent = !n.urgent && inQuiet(now(), quietOf(readQuiet()))
      const message = { title: n.title, body: n.body, tag: n.tag, mateId: n.mateId, runId: n.runId, silent }
      const results = await Promise.all(subs.map((s) => deliver(s, message, { urgent: !!n.urgent })))
      return results.filter((r) => r === 'sent').length
    },
  }
}
