/**
 * dsh-mywork-kit — the computer's end of the encrypted relay (设置 → MyWork → 手机 → 在外面也能连).
 *
 * The LAN gateway (lan-gateway.js) reaches only phones on the same Wi-Fi: a home router does not let the internet dial
 * in. With the relay on, the computer dials out instead — a WebSocket to the relay (apps/relay, a Cloudflare Durable
 * Object per pairing) — and a phone anywhere dials the same relay. The relay only moves frames; everything inside is
 * end-to-end encrypted here and on the phone:
 *
 *   - the computer keeps an X25519 key pair (in $DSH_HOME/mywork/lan.json) and puts its public key on the pairing QR,
 *     after `#`, so it never travels to any server;
 *   - a phone opens with `h1.<its ephemeral public key>.<sealed { t: phone token }>`; both sides derive the same key
 *     (nacl.box.before) and every later frame is `d1.<sealed JSON>` — XSalsa20-Poly1305 with a random 24-byte nonce;
 *   - the relay cannot read or forge frames: it lacks the computer's secret key, and the phone token inside the
 *     hello is checked here like the gateway's bearer.
 *
 * A request from the phone, `{ id, m, p, b }`, goes to this computer's own LAN gateway on loopback with the phone
 * token as its bearer — the same path a phone on the Wi-Fi takes — and only for MyWork's API and signed file links.
 * The response comes back as `{ id, s, ct, enc, part, of, d }` chunks (text as is, anything else base64), so a large
 * file stays under the relay's frame limit.
 */
import nacl from 'tweetnacl'

const NONCE = nacl.box.nonceLength
const CHUNK = 160 * 1024
const MAX_BODY = 20 * 1024 * 1024
const PING_MS = 25000

const b64 = (u8) => Buffer.from(u8).toString('base64')
const unb64 = (s) => new Uint8Array(Buffer.from(String(s || ''), 'base64'))
const b64url = (u8) => Buffer.from(u8).toString('base64url')
const unb64url = (s) => new Uint8Array(Buffer.from(String(s || ''), 'base64url'))

/** A new key pair for this computer: the public key as base64url (it goes on the QR), the secret as base64. */
export function newKeyPair() { const k = nacl.box.keyPair(); return { publicKey: b64url(k.publicKey), secretKey: b64(k.secretKey) } }

/** JSON sealed with a shared key: base64(nonce ‖ box). */
export function seal(key, obj) {
  const nonce = nacl.randomBytes(NONCE)
  const box = nacl.box.after(new TextEncoder().encode(JSON.stringify(obj)), nonce, key)
  const out = new Uint8Array(NONCE + box.length)
  out.set(nonce); out.set(box, NONCE)
  return b64(out)
}
/** The JSON inside a sealed string, or null when it does not open (wrong key, tampered, malformed). */
export function unseal(key, s) {
  const all = unb64(s)
  if (all.length < NONCE + nacl.box.overheadLength) return null
  const m = nacl.box.open.after(all.subarray(NONCE), all.subarray(0, NONCE), key)
  if (!m) return null
  try { return JSON.parse(new TextDecoder().decode(m)) } catch { return null }
}
/** The key a phone and this computer share (the phone's ephemeral public key, base64url, and this computer's secret). */
export const sharedKey = (peerPublicB64url, secretB64) => nacl.box.before(unb64url(peerPublicB64url), unb64(secretB64))

/** The relay's WebSocket address for a role: https://x → wss://x/v1/<role>?id=<id>. */
export const relaySocketUrl = (relayUrl, role, id) => String(relayUrl).replace(/^http/i, 'ws').replace(/\/+$/, '') + '/v1/' + role + '?id=' + encodeURIComponent(id)

/**
 * Connect this computer to the relay; reconnects with backoff until close().
 * @param {{
 *   relayUrl: string, id: string, secretKey: string,
 *   authorize: (token: string) => boolean,
 *   forward: (method: string, path: string, body?: string) => Promise<{ status: number, contentType: string, body: Buffer }>,
 *   allowed?: (path: string) => boolean, log?: (m: string) => void, WebSocketImpl?: typeof WebSocket,
 * }} opts
 */
export function startRelayClient({ relayUrl, id, secretKey, authorize, forward, allowed = () => true, log = () => {}, WebSocketImpl = globalThis.WebSocket }) {
  const url = relaySocketUrl(relayUrl, 'computer', id)
  /** pid → the shared key once the phone's hello checked out (null until then). */
  const sessions = new Map()
  const state = { connected: false, error: '', since: '' }
  let ws = null
  let stopped = false
  let timer = null
  let ping = null
  let backoff = 1000

  const raw = (obj) => { try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj)) } catch { /* the socket went; the reconnect resends nothing */ } }
  const to = (pid, key, obj) => raw({ to: pid, c: 'd1.' + seal(key, obj) })

  const hello = (pid, c) => {
    const [, epk, sealed] = c.split('.')
    let key
    try { key = sharedKey(epk, secretKey) } catch { return }
    const h = unseal(key, sealed)
    if (!h || typeof h.t !== 'string' || !authorize(h.t)) { log('relay: a phone presented a wrong token'); to(pid, key, { ok: false, error: '配对已失效，重新扫码' }); sessions.delete(pid); return }
    sessions.set(pid, key)
    to(pid, key, { ok: true })
  }
  const request = async (pid, key, r) => {
    const reply = (s, ct, text, d) => {
      const of = Math.max(1, Math.ceil(d.length / CHUNK))
      for (let i = 0; i < of; i++) to(pid, key, { id: r.id, s, ct, enc: text ? 'utf8' : 'b64', part: i, of, d: d.slice(i * CHUNK, (i + 1) * CHUNK) })
    }
    const path = String(r.p || '')
    if (!path.startsWith('/') || !allowed(path)) return reply(403, 'text/plain', true, 'not allowed through the relay')
    let res
    try { res = await forward(String(r.m || 'GET').toUpperCase(), path, typeof r.b === 'string' ? r.b : undefined) } catch (e) { return reply(502, 'text/plain', true, String((e && e.message) || e)) }
    if (res.body.length > MAX_BODY) return reply(413, 'text/plain', true, 'too large for the relay')
    const ct = String(res.contentType || '')
    const text = /json|^text\/|xml|javascript|csv|markdown/i.test(ct)
    reply(res.status, ct, text, text ? res.body.toString('utf8') : res.body.toString('base64'))
  }
  const onFrame = (pid, c) => {
    if (c.startsWith('h1.')) return hello(pid, c)
    if (!c.startsWith('d1.')) return
    const key = sessions.get(pid)
    if (!key) return
    const r = unseal(key, c.slice(3))
    if (!r || typeof r.id !== 'string') return
    request(pid, key, r).catch((e) => log('relay: request failed: ' + ((e && e.message) || e)))
  }

  const schedule = () => {
    if (stopped) return
    clearTimeout(timer)
    timer = setTimeout(connect, backoff)
    backoff = Math.min(backoff * 2, 60000)
  }
  const connect = () => {
    if (stopped) return
    try { ws = new WebSocketImpl(url) } catch (e) { state.error = String((e && e.message) || e); schedule(); return }
    ws.onopen = () => {
      state.connected = true; state.error = ''; state.since = new Date().toISOString(); backoff = 1000
      log('relay: connected to ' + relayUrl)
      clearInterval(ping)
      ping = setInterval(() => { try { ws.send('ping') } catch { /* closing */ } }, PING_MS)
    }
    ws.onmessage = (ev) => {
      const data = typeof ev.data === 'string' ? ev.data : ''
      if (!data || data === 'pong') return
      let f
      try { f = JSON.parse(data) } catch { return }
      if (f.ev === 'open' && typeof f.from === 'string') sessions.set(f.from, null)
      else if (f.ev === 'close' && typeof f.from === 'string') sessions.delete(f.from)
      else if (typeof f.from === 'string' && typeof f.c === 'string') onFrame(f.from, f.c)
    }
    ws.onerror = () => { state.error = '连不上中继' }
    ws.onclose = (ev) => {
      const was = state.connected
      state.connected = false
      clearInterval(ping)
      sessions.clear()
      if (ev && ev.code === 4000) state.error = '另一处用同一配对连上了中继'
      if (was) log('relay: disconnected')
      schedule()
    }
  }
  connect()
  return {
    close() { stopped = true; clearTimeout(timer); clearInterval(ping); try { if (ws) ws.close() } catch { /* already closed */ } },
    status: () => ({ connected: state.connected, error: state.error, since: state.since, phones: [...sessions.values()].filter(Boolean).length }),
  }
}
