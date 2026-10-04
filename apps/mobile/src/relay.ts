/**
 * MyWork mobile — the phone's end of the encrypted relay (packages/kit/src/relay-client.js is the computer's).
 *
 * The phone reaches its computer only through the relay, from any network: the pairing QR is the relay's address with,
 * after `#`, this pairing's id, the computer's public key and the phone token; the computer dials the same relay and
 * answers there. The relay only moves frames; the two ends encrypt everything (X25519 + XSalsa20-Poly1305 via
 * tweetnacl, the same as Paseo):
 *   hello    `h1.<this connection's public key>.<sealed { t: phone token }>` → the computer answers `{ ok }`
 *   request  `d1.<sealed { id, m, p, b }>`  → the answer comes as `d1.<sealed { id, s, ct, enc, part, of, d }>` chunks
 * A new key pair per connection; the relay cannot read, and without the computer's secret key cannot answer for it.
 */
import nacl from 'tweetnacl'
import * as Crypto from 'expo-crypto'

nacl.setPRNG((x: Uint8Array, n: number) => { const b = Crypto.getRandomBytes(n); for (let i = 0; i < n; i++) x[i] = b[i] })

/** What the pairing QR says about the relay. */
export type RelayInfo = { url: string; id: string; pk: string }
export type RelayResponse = { status: number; contentType: string; text: string; b64: string }

const HELLO_MS = 10000
const REQUEST_MS = 30000
const PING_MS = 25000

// ---- bytes: base64 (standard and url) and UTF-8, without relying on the JS engine's optional globals ----
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const LOOKUP: Record<string, number> = {}
for (let i = 0; i < ALPHA.length; i++) LOOKUP[ALPHA[i]] = i
LOOKUP['-'] = 62; LOOKUP['_'] = 63
export function toB64(u8: Uint8Array, url = false): string {
  let out = ''
  for (let i = 0; i < u8.length; i += 3) {
    const n = (u8[i] << 16) | ((u8[i + 1] || 0) << 8) | (u8[i + 2] || 0)
    out += ALPHA[(n >> 18) & 63] + ALPHA[(n >> 12) & 63] + (i + 1 < u8.length ? ALPHA[(n >> 6) & 63] : '=') + (i + 2 < u8.length ? ALPHA[n & 63] : '=')
  }
  return url ? out.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : out
}
export function fromB64(s: string): Uint8Array {
  const clean = String(s || '').replace(/[^A-Za-z0-9+/\-_]/g, '')
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4))
  let o = 0
  for (let i = 0; i < clean.length; i += 4) {
    const n = (LOOKUP[clean[i]] << 18) | (LOOKUP[clean[i + 1]] << 12) | ((LOOKUP[clean[i + 2]] || 0) << 6) | (LOOKUP[clean[i + 3]] || 0)
    if (o < out.length) out[o++] = (n >> 16) & 255
    if (o < out.length && i + 2 < clean.length) out[o++] = (n >> 8) & 255
    if (o < out.length && i + 3 < clean.length) out[o++] = n & 255
  }
  return out.subarray(0, o)
}
function utf8(s: string): Uint8Array {
  const out: number[] = []
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i)
    if (c >= 0xd800 && c < 0xdc00 && i + 1 < s.length) { const d = s.charCodeAt(i + 1); if (d >= 0xdc00 && d < 0xe000) { c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00); i++ } }
    if (c < 0x80) out.push(c)
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63))
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
  }
  return new Uint8Array(out)
}
function fromUtf8(u: Uint8Array): string {
  let s = ''
  for (let i = 0; i < u.length;) {
    const a = u[i++]
    let c = a
    if (a >= 0xf0) c = ((a & 7) << 18) | ((u[i++] & 63) << 12) | ((u[i++] & 63) << 6) | (u[i++] & 63)
    else if (a >= 0xe0) c = ((a & 15) << 12) | ((u[i++] & 63) << 6) | (u[i++] & 63)
    else if (a >= 0xc0) c = ((a & 31) << 6) | (u[i++] & 63)
    if (c >= 0x10000) { c -= 0x10000; s += String.fromCharCode(0xd800 + (c >> 10), 0xdc00 + (c & 1023)) } else s += String.fromCharCode(c)
  }
  return s
}
/** Text as base64 of its UTF-8 bytes (a text answer saved as a file). */
export const textToB64 = (text: string) => toB64(utf8(text))
function seal(key: Uint8Array, obj: unknown): string {
  const nonce = nacl.randomBytes(nacl.box.nonceLength)
  const box = nacl.box.after(utf8(JSON.stringify(obj)), nonce, key)
  const out = new Uint8Array(nonce.length + box.length)
  out.set(nonce); out.set(box, nonce.length)
  return toB64(out)
}
function unseal(key: Uint8Array, s: string): any {
  const all = fromB64(s)
  if (all.length < nacl.box.nonceLength + nacl.box.overheadLength) return null
  const m = nacl.box.open.after(all.subarray(nacl.box.nonceLength), all.subarray(0, nacl.box.nonceLength), key)
  if (!m) return null
  try { return JSON.parse(fromUtf8(m)) } catch { return null }
}

/** One encrypted line to the paired computer through the relay; reconnects on the next request after it drops. */
export class Relay {
  private ws: WebSocket | null = null
  private key: Uint8Array | null = null
  private opening: Promise<void> | null = null
  private ping: ReturnType<typeof setInterval> | null = null
  private seq = 0
  private pending = new Map<string, { parts: string[]; got: number; resolve: (r: RelayResponse) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>()
  constructor(private info: RelayInfo, private token: string) {}

  /** Open the line (once): the relay socket, then the hello; resolves when the computer accepted the phone token. */
  connect(): Promise<void> {
    if (this.ws && this.key && this.ws.readyState === 1) return Promise.resolve()
    if (this.opening) return this.opening
    this.opening = new Promise<void>((resolve, reject) => {
      const url = String(this.info.url).replace(/^http/i, 'ws').replace(/\/+$/, '') + '/v1/phone?id=' + encodeURIComponent(this.info.id)
      const mine = nacl.box.keyPair()
      let key: Uint8Array
      try { key = nacl.box.before(fromB64(this.info.pk), mine.secretKey) } catch { reject(new Error('配对信息不完整，重新扫码')); return }
      let done = false
      const finish = (e?: Error) => { if (done) return; done = true; clearTimeout(t); this.opening = null; if (e) { this.drop(); reject(e) } else resolve() }
      const t = setTimeout(() => finish(new Error('中继没有回应')), HELLO_MS)
      const ws = new WebSocket(url)
      this.ws = ws
      ws.onopen = () => { ws.send(JSON.stringify({ c: 'h1.' + toB64(mine.publicKey, true) + '.' + seal(key, { t: this.token }) })) }
      ws.onmessage = (ev) => {
        const data = typeof ev.data === 'string' ? ev.data : ''
        if (!data || data === 'pong') return
        let f: any
        try { f = JSON.parse(data) } catch { return }
        if (f.ev === 'computer') {
          if (f.up) return
          // The computer left (or restarted): its end of this line is gone, so the next request says hello again.
          if (!done) finish(new Error('电脑不在线（MyWork 没开，或「允许手机连接」关了）'))
          else { this.drop(); this.failAll(new Error('电脑断开了')) }
          return
        }
        if (typeof f.c !== 'string' || !f.c.startsWith('d1.')) return
        const o = unseal(key, f.c.slice(3))
        if (!o) return
        if (!done && 'ok' in o) { if (o.ok) { this.key = key; this.ping = setInterval(() => { try { ws.send('ping') } catch { /* closing */ } }, PING_MS); finish() } else finish(new Error(o.error || '电脑拒绝了这台手机')); return }
        this.onAnswer(o)
      }
      ws.onerror = () => finish(new Error('连不上中继'))
      ws.onclose = () => { finish(new Error('中继断开了')); this.drop(); this.failAll(new Error('中继断开了')) }
    })
    return this.opening
  }

  /** One HTTP-shaped request through the line: the computer runs it against MyWork and answers in chunks. */
  async request(method: string, path: string, body?: string): Promise<RelayResponse> {
    await this.connect()
    const key = this.key
    const ws = this.ws
    if (!key || !ws) throw new Error('中继断开了')
    const id = String(++this.seq) + '-' + Date.now().toString(36)
    return new Promise<RelayResponse>((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('电脑没有回应')) }, REQUEST_MS)
      this.pending.set(id, { parts: [], got: 0, resolve, reject, timer })
      ws.send(JSON.stringify({ c: 'd1.' + seal(key, { id, m: method, p: path, ...(body !== undefined ? { b: body } : {}) }) }))
    })
  }

  close() { this.drop(); this.failAll(new Error('已关闭')) }

  private onAnswer(o: any) {
    const w = o && typeof o.id === 'string' ? this.pending.get(o.id) : undefined
    if (!w || typeof o.part !== 'number' || typeof o.of !== 'number') return
    if (w.parts[o.part] === undefined) { w.parts[o.part] = String(o.d || ''); w.got++ }
    if (w.got < o.of) return
    clearTimeout(w.timer)
    this.pending.delete(o.id)
    const all = w.parts.join('')
    w.resolve({ status: Number(o.s) || 0, contentType: String(o.ct || ''), text: o.enc === 'utf8' ? all : '', b64: o.enc === 'b64' ? all : '' })
  }
  private drop() {
    if (this.ping) { clearInterval(this.ping); this.ping = null }
    const ws = this.ws
    this.ws = null; this.key = null
    if (ws) { ws.onclose = null; ws.onmessage = null; ws.onerror = null; try { ws.close() } catch { /* closed */ } }
  }
  private failAll(e: Error) { for (const [id, w] of this.pending) { clearTimeout(w.timer); w.reject(e); this.pending.delete(id) } }
}
