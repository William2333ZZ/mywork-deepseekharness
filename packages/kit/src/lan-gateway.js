/**
 * dsh-mywork-kit — the LAN gateway behind 设置 → MyWork → 手机.
 *
 * dsh serves the web GUI on loopback only and its CLI refuses `--host 0.0.0.0` on purpose (the GUI is
 * shell access to this machine). MyWork does not override that. Instead, when the user turns the
 * phone switch on, this small proxy listens on every interface and forwards to the loopback server:
 *
 *   phone ──http://<lan ip>:<gateway port>──▶ gateway ──http://127.0.0.1:<dsh port>──▶ dsh
 *
 * dsh's /api fence requires Host to be loopback and any Origin to equal it, so the gateway rewrites
 * both — after enforcing the same rule one hop earlier: a request whose Origin is not the gateway's
 * own authority is refused here (403), never forwarded. Cookies are host-only, so the browser scopes
 * dsh's session cookie to the gateway authority and sends it back on every request; dsh sees the
 * rewritten loopback Host it signed the cookie for. WebSocket upgrades (the RPC mux) are piped raw.
 *
 * Login stays dsh's own: the QR carries the process launch token on `GET /?token=…`, exactly like
 * the URL the desktop opens. A native app may instead present that same token as
 * `Authorization: Bearer <token>`; the gateway then attaches its own dsh session cookie (obtained once
 * with the token) to the forwarded request, so the phone never depends on the platform's cookie jar
 * (Android's store drops dsh's SameSite=Strict cookie between requests). Turning the switch off closes
 * the listener; nothing else changes.
 */
import http from 'node:http'
import net from 'node:net'
import { timingSafeEqual } from 'node:crypto'

const sameSecret = (a, b) => { const x = Buffer.from(String(a || '')); const y = Buffer.from(String(b || '')); return x.length > 0 && x.length === y.length && timingSafeEqual(x, y) }

const originHost = (origin) => { try { return new URL(origin).host } catch { return null } }

/**
 * Start the gateway. Returns the server; `close()` stops it.
 * @param {{ targetPort: number, listenPort: number, log?: (m: string) => void }} opts
 */
export function startLanGateway({ targetPort, listenPort, log = () => {}, launchToken = () => '' }) {
  const targetHost = '127.0.0.1'
  const targetAuthority = `${targetHost}:${targetPort}`
  const targetOrigin = `http://${targetAuthority}`
  const rewrite = (headers, sessionCookie) => {
    const out = {}
    for (const [k, v] of Object.entries(headers)) {
      const key = k.toLowerCase()
      if (key === 'host') out[k] = targetAuthority
      else if (key === 'origin') out[k] = targetOrigin
      else if (key === 'referer') out[k] = String(v).replace(/^https?:\/\/[^/]+/, targetOrigin)
      else if (sessionCookie && (key === 'authorization' || key === 'cookie')) continue // the gateway's own session replaces both
      else out[k] = v
    }
    if (sessionCookie) out.cookie = sessionCookie
    return out
  }
  // The gateway's own dsh session for bearer clients: one token exchange against loopback, cached, redone on 401.
  let session = ''
  const obtainSession = () => new Promise((resolve) => {
    const token = launchToken()
    if (!token) return resolve('')
    const r = http.get({ host: targetHost, port: targetPort, path: `/?token=${encodeURIComponent(token)}`, headers: { host: targetAuthority } }, (res) => {
      const set = res.headers['set-cookie'] || []
      res.resume()
      const first = Array.isArray(set) ? set[0] : set
      resolve(first ? String(first).split(';')[0] : '')
    })
    r.on('error', () => resolve(''))
  })
  const bearerOf = (req) => { const m = /^Bearer\s+(.+)$/i.exec(String(req.headers.authorization || '')); return m ? m[1].trim() : '' }
  const sessionFor = async (req) => {
    const bearer = bearerOf(req)
    if (!bearer) return { ok: true, cookie: '' }
    if (!sameSecret(bearer, launchToken())) { const want = launchToken(); log(`bearer mismatch: got ${bearer.length} chars starting ${JSON.stringify(bearer.slice(0, 6))} ending ${JSON.stringify(bearer.slice(-4))}, want ${want.length} chars starting ${JSON.stringify(want.slice(0, 6))} ending ${JSON.stringify(want.slice(-4))}`); return { ok: false, cookie: '' } }
    if (!session) session = await obtainSession()
    return { ok: !!session, cookie: session }
  }
  const crossSite = (req) => {
    const origin = req.headers.origin
    if (origin === undefined) return false
    return originHost(origin) !== (req.headers.host || '')
  }

  const server = http.createServer(async (req, res) => {
    if (crossSite(req)) { res.writeHead(403, { 'content-type': 'text/plain' }); res.end('cross-site request rejected'); return }
    const auth = await sessionFor(req)
    if (!auth.ok) { res.writeHead(401, { 'content-type': 'text/plain' }); res.end('bad token'); return }
    const send = (cookie, body, retry) => {
      const up = http.request({ host: targetHost, port: targetPort, method: req.method, path: req.url, headers: rewrite(req.headers, cookie) }, (ur) => {
        if (cookie && ur.statusCode === 401 && retry) { ur.resume(); session = ''; obtainSession().then((c) => { session = c; send(c, body, false) }); return }
        res.writeHead(ur.statusCode || 502, ur.headers)
        ur.pipe(res)
      })
      up.on('error', (e) => { log(`gateway upstream error: ${e && e.message}`); if (!res.headersSent) res.writeHead(502); res.end() })
      if (body !== null) up.end(body); else req.pipe(up)
    }
    if (auth.cookie) { const chunks = []; req.on('data', (c) => chunks.push(c)); req.on('end', () => send(auth.cookie, Buffer.concat(chunks), true)) }
    else send('', null, false)
  })

  server.on('upgrade', (req, socket, head) => {
    if (crossSite(req)) { socket.destroy(); return }
    const up = net.connect(targetPort, targetHost, () => {
      const lines = [`${req.method} ${req.url} HTTP/1.1`]
      for (const [k, v] of Object.entries(rewrite(req.headers))) lines.push(`${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      up.write(lines.join('\r\n') + '\r\n\r\n')
      if (head && head.length) up.write(head)
      socket.pipe(up)
      up.pipe(socket)
    })
    up.on('error', () => socket.destroy())
    socket.on('error', () => up.destroy())
  })

  server.on('error', (e) => log(`gateway listen error: ${e && e.message}`))
  server.listen(listenPort, '0.0.0.0', () => log(`phone gateway listening on 0.0.0.0:${listenPort} → ${targetAuthority}`))
  return server
}
