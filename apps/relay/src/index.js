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
 */
const ID = /^[A-Za-z0-9_-]{16,64}$/
const MAX_FRAME = 1_000_000

export default {
  async fetch(req, env) {
    const url = new URL(req.url)
    if (url.pathname === '/' || url.pathname === '/health') return new Response('mywork relay\n', { headers: { 'content-type': 'text/plain' } })
    if (url.pathname !== '/v1/computer' && url.pathname !== '/v1/phone') return new Response('not found', { status: 404 })
    const id = url.searchParams.get('id') || ''
    if (!ID.test(id)) return new Response('bad id', { status: 400 })
    if ((req.headers.get('upgrade') || '').toLowerCase() !== 'websocket') return new Response('websocket only', { status: 426 })
    return env.RELAY.get(env.RELAY.idFromName(id)).fetch(req)
  },
}

export class Relay {
  constructor(ctx) {
    this.ctx = ctx
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'))
  }

  async fetch(req) {
    const role = new URL(req.url).pathname.endsWith('/computer') ? 'computer' : 'phone'
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
      if (a && a.pid) this.toComputer({ from: a.pid, c: f.c })
    }
  }

  async webSocketClose(ws, code) { this.gone(ws); try { ws.close(code === 1005 ? 1000 : code, 'bye') } catch {} }
  async webSocketError(ws) { this.gone(ws) }
  gone(ws) {
    if (this.ctx.getTags(ws).includes('computer')) { if (!this.ctx.getWebSockets('computer').some((c) => c !== ws)) this.toPhones({ ev: 'computer', up: false }) }
    else { const a = ws.deserializeAttachment(); if (a && a.pid) this.toComputer({ ev: 'close', from: a.pid }) }
  }
}
