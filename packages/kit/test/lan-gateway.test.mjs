import { test } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { startLanGateway } from '../src/lan-gateway.js'

const LAUNCH = 'launch-token-only-on-this-computer'
const PHONE = 'phone-token-kept-in-lan-json-xxxx'

// A stand-in for dsh: records what it received; `/?token=<LAUNCH>` answers with a session cookie.
function upstream() {
  const seen = []
  const server = http.createServer((req, res) => {
    seen.push({ url: req.url, host: req.headers.host, cookie: req.headers.cookie || '', authorization: req.headers.authorization || '' })
    const u = new URL(req.url, 'http://x')
    if (u.searchParams.get('token') === LAUNCH) { res.writeHead(303, { 'set-cookie': 'dsh_session=abc; HttpOnly; SameSite=Strict', location: '/' }); res.end(); return }
    if (u.searchParams.has('token')) { res.writeHead(401); res.end('bad launch token'); return }
    if (u.pathname.startsWith('/api') && req.headers.cookie !== 'dsh_session=abc') { res.writeHead(401); res.end(); return }
    res.writeHead(200, { 'content-type': 'text/plain' }); res.end('ok')
  })
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port, seen })))
}

const get = (port, path, headers = {}) => new Promise((resolve, reject) => {
  http.get({ host: '127.0.0.1', port, path, headers }, (res) => { let body = ''; res.on('data', (c) => { body += c }); res.on('end', () => resolve({ status: res.statusCode, body })) }).on('error', reject)
})

test('gateway: phone token is the only secret a phone may present; the launch token never leaves the computer', async () => {
  const up = await upstream()
  const gw = startLanGateway({ targetPort: up.port, listenPort: 0, launchToken: () => LAUNCH, phoneToken: () => PHONE })
  await new Promise((r) => gw.once('listening', r))
  const port = gw.address().port
  try {
    // plain request: forwarded with Host rewritten to the loopback authority
    assert.equal((await get(port, '/')).status, 200)
    assert.equal(up.seen.at(-1).host, `127.0.0.1:${up.port}`)

    // bearer = phone token → the gateway exchanges the launch token once and forwards with its own cookie
    up.seen.length = 0
    const ok = await get(port, '/api/x', { authorization: `Bearer ${PHONE}` })
    assert.equal(ok.status, 200)
    assert.equal(up.seen[0].url, `/?token=${encodeURIComponent(LAUNCH)}`)
    assert.equal(up.seen[1].cookie, 'dsh_session=abc')
    assert.equal(up.seen[1].authorization, '')

    // second bearer call reuses the session (no new exchange)
    up.seen.length = 0
    assert.equal((await get(port, '/api/y', { authorization: `Bearer ${PHONE}` })).status, 200)
    assert.equal(up.seen.length, 1)

    // wrong token and the launch token itself are both refused before anything is forwarded
    up.seen.length = 0
    assert.equal((await get(port, '/api/x', { authorization: 'Bearer nope' })).status, 401)
    assert.equal((await get(port, '/api/x', { authorization: `Bearer ${LAUNCH}` })).status, 401)
    assert.equal(up.seen.length, 0)

    // a phone browser opening the QR: ?token=<phone token> is swapped for the launch token
    up.seen.length = 0
    const login = await get(port, `/?token=${encodeURIComponent(PHONE)}`)
    assert.equal(login.status, 303)
    assert.equal(up.seen[0].url, `/?token=${encodeURIComponent(LAUNCH)}`)

    // any other token is forwarded untouched (dsh rejects it)
    up.seen.length = 0
    assert.equal((await get(port, '/?token=other')).status, 401)
    assert.equal(up.seen[0].url, '/?token=other')

    // cross-site origin is refused here, never forwarded
    up.seen.length = 0
    assert.equal((await get(port, '/', { origin: 'http://evil.example' })).status, 403)
    assert.equal(up.seen.length, 0)
  } finally {
    gw.close(); up.server.close()
  }
})
