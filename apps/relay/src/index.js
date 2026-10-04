/**
 * MyWork relay — lets a paired phone reach its computer from any network (4G, another Wi-Fi), without opening a port
 * at home and without anything leaving the computer in the clear.
 *
 *   computer gateway ── wss://<relay>/v1/computer?id=<id> ──┐
 *   phone            ── wss://<relay>/v1/phone?id=<id>    ──┴─▶ Durable Object <id>
 *
 * Both ends dial out (a home router lets outbound connections through), and the Durable Object named by the pairing id
 * moves frames between them. Everything inside a frame is end-to-end encrypted by the two ends (X25519 + XSalsa20-
 * Poly1305; the phone learns the computer's public key from the pairing QR): the relay stores nothing and can read
 * nothing — it sees which pairing id is busy and how many bytes pass.
 *
 * Frames are JSON text. phone → relay `{ c }` → computer `{ from, c }`; computer → relay `{ to, c }` → that phone `{ c }`.
 * Control: the computer hears `{ ev: 'open' | 'close', from }` as phones come and go; a phone hears `{ ev: 'computer',
 * up }` when it connects and whenever the computer comes or goes. A text 'ping' is answered 'pong' without waking the
 * object (hibernation keeps idle connections free). A newer computer connection replaces an older one.
 *
 * Many computers share one relay, so a room belongs to the computer that first claimed it. A computer dials with its
 * Ed25519 public key, a timestamp and its signature over `mywork-relay-v1|computer|<id>|<ts>`: the first verified key
 * owns the room (kept in the object's storage), any other key is turned away (4403), and a timestamp not newer than the
 * last one or off by more than ten minutes is a replay (4401). Whoever sees a pairing code can still not knock its
 * computer off the relay. Phones need no key here (they prove themselves to the computer inside the encryption); a
 * room takes at most 8 phones (4029), a phone at most 60 frames in 10 s, and one address 60 connections a minute.
 */
const ID = /^[A-Za-z0-9_-]{16,64}$/
const MAX_FRAME = 1_000_000
const MAX_PHONES = 8
const SKEW_MS = 10 * 60 * 1000
const PHONE_BURST = 60
const PHONE_WINDOW_MS = 10_000

const fromB64url = (s) => {
  const t = String(s || '').replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(t + '='.repeat((4 - (t.length % 4)) % 4))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
/** Whether `sig` is the signature of `msg` by the Ed25519 public key `pk` (both base64url). */
async function signedBy(pk, msg, sig) {
  try {
    const key = await crypto.subtle.importKey('raw', fromB64url(pk), { name: 'Ed25519' }, false, ['verify'])
    return await crypto.subtle.verify({ name: 'Ed25519' }, key, fromB64url(sig), new TextEncoder().encode(msg))
  } catch { return false }
}
const PAIR_PAGE = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MyWork 配对码</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#12100e;color:#efebe2;font:16px/1.7 -apple-system,"PingFang SC","Hiragino Sans GB",sans-serif}main{max-width:320px;padding:24px}h1{font-size:20px;font-weight:600;margin:0 0 8px}p{margin:0;color:rgba(239,235,226,.68)}</style></head>
<body><main><h1>这是 MyWork 的配对码</h1><p>请打开 MyWork 手机 App，在「扫码」里扫它。这个页面不会收到配对信息。</p></main></body></html>`

export default {
  async fetch(req, env) {
    const url = new URL(req.url)
    if (url.pathname === '/health') return new Response('mywork relay\n', { headers: { 'content-type': 'text/plain' } })
    // The pairing QR is this address with the pairing after `#` (browsers never send it): a camera app that opens it
    // lands here and is told to use the MyWork app instead.
    if (url.pathname === '/') return new Response(PAIR_PAGE, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' } })
    if (url.pathname !== '/v1/computer' && url.pathname !== '/v1/phone') return new Response('not found', { status: 404 })
    const id = url.searchParams.get('id') || ''
    if (!ID.test(id)) return new Response('bad id', { status: 400 })
    if ((req.headers.get('upgrade') || '').toLowerCase() !== 'websocket') return new Response('websocket only', { status: 426 })
    if (env.CONNECT_LIMIT) {
      const { success } = await env.CONNECT_LIMIT.limit({ key: req.headers.get('cf-connecting-ip') || 'unknown' })
      if (!success) return new Response('too many connections', { status: 429 })
    }
    return env.RELAY.get(env.RELAY.idFromName(id)).fetch(req)
  },
}

export class Relay {
  constructor(ctx) {
    this.ctx = ctx
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'))
    this.rate = new Map() // phone pid → { start, n }: frames in the current 10 s window (forgotten on hibernation, which is fine)
  }

  /** Turn a connection away with a close code the client can read (an HTTP error status never reaches a WebSocket client). */
  refuse(code, reason) {
    const [client, server] = Object.values(new WebSocketPair())
    server.accept()
    server.close(code, reason)
    return new Response(null, { status: 101, webSocket: client })
  }

  /** The computer's claim on this room: 'ok', or the close code to refuse it with. */
  async claim(url) {
    const id = url.searchParams.get('id') || ''
    const pk = url.searchParams.get('pk') || ''
    const ts = Number(url.searchParams.get('ts'))
    const sig = url.searchParams.get('sig') || ''
    if (!pk || !sig || !Number.isFinite(ts)) return 4401
    if (Math.abs(Date.now() - ts) > SKEW_MS) return 4401
    if (!(await signedBy(pk, `mywork-relay-v1|computer|${id}|${ts}`, sig))) return 4401
    const owner = await this.ctx.storage.get('owner')
    if (owner && owner !== pk) return 4403
    const last = (await this.ctx.storage.get('ts')) || 0
    if (ts <= last) return 4401
    await this.ctx.storage.put(owner ? { ts } : { owner: pk, ts })
    return 'ok'
  }

  async fetch(req) {
    const url = new URL(req.url)
    const role = url.pathname.endsWith('/computer') ? 'computer' : 'phone'
    if (role === 'computer') {
      const ok = await this.claim(url)
      if (ok !== 'ok') return this.refuse(ok, ok === 4403 ? 'this pairing belongs to another computer' : 'signature, clock or replay')
    } else if (this.ctx.getWebSockets('phone').length >= MAX_PHONES) return this.refuse(4029, 'too many phones')
    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)
    if (role === 'computer') {
      for (const old of this.ctx.getWebSockets('computer')) { try { old.close(4000, 'replaced') } catch {} }
      this.ctx.acceptWebSocket(server, ['computer'])
      this.toPhones({ ev: 'computer', up: true })
      // The phones already here: the new computer connection learns of them.
      for (const p of this.ctx.getWebSockets('phone')) { const a = p.deserializeAttachment(); if (a && a.pid) this.send(server, { ev: 'open', from: a.pid }) }
    } else {
      const pid = crypto.randomUUID()
      this.ctx.acceptWebSocket(server, ['phone', 'p:' + pid])
      server.serializeAttachment({ pid })
      this.send(server, { ev: 'computer', up: !!this.computer() })
      this.toComputer({ ev: 'open', from: pid })
    }
    return new Response(null, { status: 101, webSocket: client })
  }

  computer() { return this.ctx.getWebSockets('computer')[0] || null }
  send(ws, obj) { try { ws.send(JSON.stringify(obj)) } catch {} }
  toComputer(obj) { const c = this.computer(); if (c) this.send(c, obj) }
  toPhones(obj) { for (const p of this.ctx.getWebSockets('phone')) this.send(p, obj) }

  async webSocketMessage(ws, msg) {
    if (typeof msg !== 'string' || msg.length > MAX_FRAME) return
    let f
    try { f = JSON.parse(msg) } catch { return }
    if (!f || typeof f.c !== 'string') return
    if (this.ctx.getTags(ws).includes('computer')) {
      if (typeof f.to !== 'string') return
      const p = this.ctx.getWebSockets('p:' + f.to)[0]
      if (p) this.send(p, { c: f.c })
    } else {
      const a = ws.deserializeAttachment()
      if (!a || !a.pid) return
      const now = Date.now()
      const r = this.rate.get(a.pid)
      if (!r || now - r.start > PHONE_WINDOW_MS) this.rate.set(a.pid, { start: now, n: 1 })
      else if (++r.n > PHONE_BURST) { try { ws.close(4029, 'too fast') } catch {} return }
      this.toComputer({ from: a.pid, c: f.c })
    }
  }

  async webSocketClose(ws, code) { this.gone(ws); try { ws.close(code === 1005 ? 1000 : code, 'bye') } catch {} }
  async webSocketError(ws) { this.gone(ws) }
  gone(ws) {
    if (this.ctx.getTags(ws).includes('computer')) { if (!this.ctx.getWebSockets('computer').some((c) => c !== ws)) this.toPhones({ ev: 'computer', up: false }) }
    else { const a = ws.deserializeAttachment(); if (a && a.pid) { this.rate.delete(a.pid); this.toComputer({ ev: 'close', from: a.pid }) } }
  }
}
