// The computer's end of the encrypted relay, against a fake WebSocket standing in for the relay; the test plays the
// phone with tweetnacl, the way apps/mobile/src/relay.ts does.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import nacl from 'tweetnacl'
import { newKeyPair, newSignKeyPair, relaySocketUrl, seal, signedClaim, startRelayClient, unseal } from '../src/relay-client.js'

class FakeSocket {
  static last = null
  constructor(url) { this.url = url; this.readyState = 0; this.sent = []; FakeSocket.last = this; queueMicrotask(() => { this.readyState = 1; this.onopen && this.onopen() }) }
  send(data) { this.sent.push(data) }
  close() { this.readyState = 3 }
  /** The relay delivering a phone's frame to the computer. */
  deliver(obj) { this.onmessage && this.onmessage({ data: JSON.stringify(obj) }) }
  /** The frames the computer sent to one phone, opened with its key. */
  repliesTo(pid, key) { return this.sent.filter((s) => s !== 'ping').map((s) => JSON.parse(s)).filter((f) => f.to === pid).map((f) => unseal(key, f.c.slice(3))) }
}

const tick = () => new Promise((r) => setTimeout(r, 5))
/** A phone: an ephemeral key pair, the key it shares with the computer, and its hello frame. */
function phone(computerPk, token) {
  const k = nacl.box.keyPair()
  const key = nacl.box.before(new Uint8Array(Buffer.from(computerPk, 'base64url')), k.secretKey)
  return { key, hello: 'h1.' + Buffer.from(k.publicKey).toString('base64url') + '.' + seal(key, { t: token }), req: (obj) => 'd1.' + seal(key, obj) }
}
function start(over = {}) {
  const keys = newKeyPair()
  const calls = []
  const client = startRelayClient({
    relayUrl: 'https://relay.example', id: 'pairing-id-0123456789', secretKey: keys.secretKey, signKey: over.signKey,
    authorize: (t) => t === 'phone-token', allowed: (p) => p.startsWith('/mywork-tasks/'),
    forward: async (method, path, body) => { calls.push({ method, path, body }); return over.reply ? over.reply(path) : { status: 200, contentType: 'application/json', body: Buffer.from(JSON.stringify({ items: [{ id: 'mywork' }] })) } },
    WebSocketImpl: FakeSocket, pingMs: over.pingMs,
  })
  return { keys, calls, client }
}

test('the computer dials the relay as the pairing\'s computer', async () => {
  const { client } = start()
  await tick()
  assert.equal(FakeSocket.last.url, 'wss://relay.example/v1/computer?id=pairing-id-0123456789')
  assert.equal(relaySocketUrl('http://10.0.2.2:8787/', 'phone', 'x'), 'ws://10.0.2.2:8787/v1/phone?id=x')
  assert.equal(client.status().connected, true)
  client.close()
})

test('a phone with the pairing token gets in; its request reaches the gateway and the answer comes back sealed', async () => {
  const { keys, calls, client } = start()
  await tick()
  const ws = FakeSocket.last
  const p = phone(keys.publicKey, 'phone-token')
  ws.deliver({ ev: 'open', from: 'p1' })
  ws.deliver({ from: 'p1', c: p.hello })
  assert.deepEqual(ws.repliesTo('p1', p.key)[0], { ok: true })
  assert.equal(client.status().phones, 1)
  ws.deliver({ from: 'p1', c: p.req({ id: 'r1', m: 'post', p: '/mywork-tasks/api/mates/say', b: '{"id":"mywork","text":"hi"}' }) })
  await tick()
  assert.deepEqual(calls[0], { method: 'POST', path: '/mywork-tasks/api/mates/say', body: '{"id":"mywork","text":"hi"}' })
  const r = ws.repliesTo('p1', p.key)[1]
  assert.equal(r.id, 'r1'); assert.equal(r.s, 200); assert.equal(r.enc, 'utf8'); assert.equal(r.of, 1)
  assert.deepEqual(JSON.parse(r.d), { items: [{ id: 'mywork' }] })
  client.close()
})

test('a wrong token is refused and its requests go nowhere; a frame sealed with another key is ignored', async () => {
  const { keys, calls, client } = start()
  await tick()
  const ws = FakeSocket.last
  const bad = phone(keys.publicKey, 'not-the-token')
  ws.deliver({ ev: 'open', from: 'p2' })
  ws.deliver({ from: 'p2', c: bad.hello })
  assert.equal(ws.repliesTo('p2', bad.key)[0].ok, false)
  ws.deliver({ from: 'p2', c: bad.req({ id: 'r1', m: 'GET', p: '/mywork-tasks/api/mates' }) })
  const good = phone(keys.publicKey, 'phone-token')
  ws.deliver({ ev: 'open', from: 'p3' })
  ws.deliver({ from: 'p3', c: good.hello })
  const stranger = phone(newKeyPair().publicKey, 'phone-token') // sealed for some other computer
  ws.deliver({ from: 'p3', c: stranger.req({ id: 'r2', m: 'GET', p: '/mywork-tasks/api/mates' }) })
  await tick()
  assert.equal(calls.length, 0)
  client.close()
})

test('only MyWork\'s API and file links pass; a large file comes back in chunks that reassemble', async () => {
  const big = Buffer.from(Array.from({ length: 400 * 1024 }, (_, i) => i % 251))
  const { keys, calls, client } = start({ reply: () => ({ status: 200, contentType: 'image/png', body: big }) })
  await tick()
  const ws = FakeSocket.last
  const p = phone(keys.publicKey, 'phone-token')
  ws.deliver({ ev: 'open', from: 'p4' })
  ws.deliver({ from: 'p4', c: p.hello })
  ws.deliver({ from: 'p4', c: p.req({ id: 'x', m: 'GET', p: '/api/sessions' }) })
  ws.deliver({ from: 'p4', c: p.req({ id: 'img', m: 'GET', p: '/mywork-tasks/files/raw?id=a&path=b.png' }) })
  await tick()
  const replies = ws.repliesTo('p4', p.key)
  assert.equal(replies.find((r) => r.id === 'x').s, 403)
  assert.equal(calls.length, 1)
  const parts = replies.filter((r) => r.id === 'img').sort((a, b) => a.part - b.part)
  assert.ok(parts.length > 1)
  assert.equal(parts[0].enc, 'b64'); assert.equal(parts[0].of, parts.length)
  assert.deepEqual(Buffer.from(parts.map((r) => r.d).join(''), 'base64'), big)
  for (const s of ws.sent) assert.ok(s.length < 1_000_000, 'every frame fits under the relay limit')
  client.close()
})

test('on the shared relay the computer signs its claim on the pairing at every dial; a refused claim says why', async () => {
  const sign = newSignKeyPair()
  const { client } = start({ signKey: sign.secretKey })
  await tick()
  const first = new URL(FakeSocket.last.url.replace(/^wss:/, 'https:'))
  const ts = first.searchParams.get('ts')
  assert.equal(first.searchParams.get('id'), 'pairing-id-0123456789')
  assert.equal(first.searchParams.get('pk'), sign.publicKey)
  const msg = new TextEncoder().encode(`mywork-relay-v1|computer|pairing-id-0123456789|${ts}`)
  assert.ok(nacl.sign.detached.verify(msg, new Uint8Array(Buffer.from(first.searchParams.get('sig'), 'base64url')), new Uint8Array(Buffer.from(sign.publicKey, 'base64url'))))
  assert.ok(!nacl.sign.detached.verify(new TextEncoder().encode('mywork-relay-v1|computer|another-id-0123456789|' + ts), new Uint8Array(Buffer.from(first.searchParams.get('sig'), 'base64url')), new Uint8Array(Buffer.from(sign.publicKey, 'base64url'))))
  FakeSocket.last.onclose({ code: 4403 })
  assert.match(client.status().error, /另一台电脑/)
  client.close()
  // Each claim carries its own time, so a copied URL is stale on the next dial.
  assert.notEqual(signedClaim('pairing-id-0123456789', sign.secretKey, 1), signedClaim('pairing-id-0123456789', sign.secretKey, 2))
})

test('a relay connection that stops answering heartbeats is dropped and dialled again', async () => {
  const { client } = start({ pingMs: 10 })
  try {
    await tick()
    const first = FakeSocket.last
    assert.equal(client.status().connected, true)
    // Nothing comes back (no pong): after two heartbeats and a grace the client gives up on this socket and redials.
    await new Promise((r) => setTimeout(r, 1300))
    assert.ok(first.sent.includes('ping'))
    assert.notEqual(FakeSocket.last, first)
  } finally { client.close() }
})
