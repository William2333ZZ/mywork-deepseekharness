// Web Push from the computer to the phone: the test plays the phone's browser (it decrypts what the computer sends,
// the way a push service hands it to the browser) and the push service (a fake fetch).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createDecipheriv, createECDH, createPublicKey, hkdfSync, randomBytes, verify } from 'node:crypto'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MAX_SUBSCRIPTIONS, createPusher, encryptPayload, inQuiet, newVapidKeys, noticeFor, normalizeSubscription, quietOf, vapidAuthorization } from '../src/webpush.js'

/** A browser's push subscription: its P-256 key pair and auth secret, and how it opens a message (RFC 8291). */
function browser(endpoint = 'https://fcm.googleapis.com/fcm/send/abc123') {
  const ecdh = createECDH('prime256v1'); ecdh.generateKeys()
  const auth = randomBytes(16)
  const sub = { endpoint, keys: { p256dh: ecdh.getPublicKey().toString('base64url'), auth: auth.toString('base64url') } }
  const open = (buf) => {
    const salt = buf.subarray(0, 16); const idlen = buf[20]; const asPublic = buf.subarray(21, 21 + idlen); const body = buf.subarray(21 + idlen)
    const shared = ecdh.computeSecret(asPublic)
    const ikm = Buffer.from(hkdfSync('sha256', shared, auth, Buffer.concat([Buffer.from('WebPush: info\0'), ecdh.getPublicKey(), asPublic]), 32))
    const cek = Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16))
    const nonce = Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12))
    const d = createDecipheriv('aes-128-gcm', cek, nonce)
    d.setAuthTag(body.subarray(body.length - 16))
    const plain = Buffer.concat([d.update(body.subarray(0, body.length - 16)), d.final()])
    assert.equal(plain[plain.length - 1], 2, 'last record delimiter')
    return JSON.parse(plain.subarray(0, plain.length - 1).toString('utf8'))
  }
  return { sub, open }
}

/** A push service: records what it got, answers with `status(endpoint)`. */
function service(status = () => 201) {
  const got = []
  const fetchImpl = async (url, init) => { got.push({ url, headers: init.headers, body: init.body }); return { status: status(url) } }
  return { got, fetchImpl }
}

const tmpFile = () => join(mkdtempSync(join(tmpdir(), 'mywork-push-')), 'push.json')

test('the payload opens only with the subscription’s keys (RFC 8291 aes128gcm)', () => {
  const b = browser()
  const buf = encryptPayload(JSON.stringify({ title: '张三 · 完成', body: '写好了' }), b.sub.keys)
  assert.equal(buf.readUInt32BE(16), 4096)
  assert.equal(buf[20], 65)
  assert.deepEqual(b.open(buf), { title: '张三 · 完成', body: '写好了' })
  assert.throws(() => browser().open(buf))
})

test('the encryption matches RFC 8291 Appendix A byte for byte', () => {
  const u = (s) => Buffer.from(s, 'base64url')
  const buf = encryptPayload('When I grow up, I want to be a watermelon', { p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', auth: 'BTBZMqHH6r4Tts7J_aSIgg' }, { salt: u('DGv6ra1nlYgDCS1FRnbzlw'), ephemeral: u('yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw') })
  assert.equal(buf.toString('base64url'), 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN')
})

test('every push carries a VAPID JWT signed by this computer for that push service', () => {
  const v = newVapidKeys()
  const h = vapidAuthorization('https://web.push.apple.com/QGuQyavXutnMb', v, 'mailto:me@example.com', Date.parse('2026-10-12T00:00:00Z'))
  const m = h.match(/^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/)
  assert.ok(m)
  assert.equal(m[4], v.publicKey)
  const claims = JSON.parse(Buffer.from(m[2], 'base64url').toString())
  assert.equal(claims.aud, 'https://web.push.apple.com')
  assert.equal(claims.sub, 'mailto:me@example.com')
  assert.ok(claims.exp > Date.parse('2026-10-12T00:00:00Z') / 1000)
  const point = Buffer.from(v.publicKey, 'base64url')
  const key = createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: point.subarray(1, 33).toString('base64url'), y: point.subarray(33).toString('base64url') }, format: 'jwk' })
  assert.ok(verify('sha256', Buffer.from(m[1] + '.' + m[2]), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(m[3], 'base64url')))
})

test('only an https subscription with real keys is taken', () => {
  const b = browser()
  assert.ok(normalizeSubscription(b.sub))
  assert.equal(normalizeSubscription({ ...b.sub, endpoint: 'http://127.0.0.1:8080/x' }), null)
  assert.equal(normalizeSubscription({ ...b.sub, keys: { p256dh: 'abc', auth: b.sub.keys.auth } }), null)
  assert.equal(normalizeSubscription(null), null)
})

test('a subscribed phone gets the notice; one the push service forgot is dropped', async () => {
  const file = tmpFile()
  const a = browser('https://fcm.googleapis.com/fcm/send/a'); const gone = browser('https://fcm.googleapis.com/fcm/send/gone')
  const s = service((url) => (url.endsWith('/gone') ? 410 : 201))
  const p = createPusher({ file, fetchImpl: s.fetchImpl, now: () => new Date(2026, 9, 12, 14, 0) })
  const key = p.publicKey()
  assert.equal(Buffer.from(key, 'base64url').length, 65)
  p.subscribe({ ...a.sub, label: 'Pixel' }); p.subscribe(gone.sub)
  assert.equal(p.list().length, 2)
  const n = await p.notify({ title: '张三 · 周报 · 完成', body: '三条要你看', tag: 'run-1', mateId: 'm1', runId: 'r1' })
  assert.equal(n, 1)
  assert.deepEqual(p.list().map((x) => x.label), ['Pixel'])
  const sent = s.got.find((g) => g.url.endsWith('/a'))
  assert.equal(sent.headers['content-encoding'], 'aes128gcm')
  assert.equal(sent.headers.urgency, 'normal')
  assert.deepEqual(a.open(sent.body), { title: '张三 · 周报 · 完成', body: '三条要你看', tag: 'run-1', mateId: 'm1', runId: 'r1', silent: false })
  // The key and the subscription survive a restart; the same key, not a new one.
  const again = createPusher({ file, fetchImpl: s.fetchImpl })
  assert.equal(again.publicKey(), key)
  assert.equal(again.list().length, 1)
  assert.equal(JSON.parse(readFileSync(file, 'utf8')).subscriptions.length, 1)
})

test('during 免打扰 a notice comes without sound; a reminder still rings', async () => {
  const b = browser()
  const s = service()
  const p = createPusher({ file: tmpFile(), fetchImpl: s.fetchImpl, readQuiet: () => ({}), now: () => new Date(2026, 9, 12, 23, 10) })
  p.subscribe(b.sub)
  await p.notify({ title: 't', body: 'b', tag: 'x' })
  await p.notify({ title: '提醒', body: '吃药', tag: 'y', urgent: true })
  assert.equal(b.open(s.got[0].body).silent, true)
  assert.equal(b.open(s.got[1].body).silent, false)
  assert.equal(s.got[1].headers.urgency, 'high')
  // 免打扰 turned off in the IM 通知 setting: nothing is silenced.
  const off = createPusher({ file: tmpFile(), fetchImpl: s.fetchImpl, readQuiet: () => ({ quiet: null }), now: () => new Date(2026, 9, 12, 23, 10) })
  off.subscribe(b.sub)
  await off.notify({ title: 't', body: 'b', tag: 'z' })
  assert.equal(b.open(s.got[2].body).silent, false)
})

test('quiet window: default 22:00–07:30, wraps midnight, null is off', () => {
  assert.deepEqual(quietOf({}), { from: '22:00', to: '07:30' })
  assert.deepEqual(quietOf({ quiet: { from: '13:00', to: '14:00' } }), { from: '13:00', to: '14:00' })
  assert.equal(quietOf({ quiet: null }), null)
  const q = quietOf({})
  assert.equal(inQuiet(new Date(2026, 0, 1, 23, 0), q), true)
  assert.equal(inQuiet(new Date(2026, 0, 1, 7, 29), q), true)
  assert.equal(inQuiet(new Date(2026, 0, 1, 7, 30), q), false)
  assert.equal(inQuiet(new Date(2026, 0, 1, 12, 0), q), false)
})

test(`at most ${MAX_SUBSCRIPTIONS} phones; the same phone again replaces itself; the test push reaches one phone`, async () => {
  const s = service()
  const p = createPusher({ file: tmpFile(), fetchImpl: s.fetchImpl })
  const bs = Array.from({ length: MAX_SUBSCRIPTIONS + 1 }, (_, i) => browser('https://fcm.googleapis.com/fcm/send/' + i))
  for (const b of bs) p.subscribe(b.sub)
  p.subscribe(bs[3].sub)
  assert.equal(p.list().length, MAX_SUBSCRIPTIONS)
  assert.ok(!p.has(bs[0].sub.endpoint))
  assert.equal(p.list()[MAX_SUBSCRIPTIONS - 1].endpoint, bs[3].sub.endpoint)
  assert.equal(await p.test(bs[5].sub.endpoint, { title: 'MyWork', body: 'hi' }), 'sent')
  assert.equal(s.got.length, 1)
  assert.equal(bs[5].open(s.got[0].body).body, 'hi')
  assert.equal(await p.test('https://nope.example/x', { title: 'x' }), 'unknown')
  assert.equal(p.unsubscribe(bs[5].sub.endpoint), true)
  assert.equal(p.list().length, MAX_SUBSCRIPTIONS - 1)
  p.clear()
  assert.equal(p.list().length, 0)
})

test('what reaches the phone: the IM notifier’s set, nothing you are already looking at', () => {
  const mate = { id: 'm1', name: '张三', notify: true }
  const t0 = '2026-10-12T01:00:00Z'
  const done = (over) => ({ kind: 'done', mate, run: { id: 'r1', mateId: 'm1', trigger: 'routine', routineTitle: '周报', createdAt: t0, startedAt: t0, finishedAt: '2026-10-12T01:00:30Z', activity: [{ kind: 'text', text: '三条要你看' }], ...over } })
  assert.deepEqual(noticeFor(done({})), { mateId: 'm1', runId: 'r1', tag: 'run-r1', title: '张三 · 周报 · 完成', body: '三条要你看', urgent: false })
  assert.equal(noticeFor(done({ quiet: true })), null)
  assert.equal(noticeFor(done({ error: '网页打不开' })).title, '张三 · 周报 · 失败')
  assert.equal(noticeFor(done({ error: '已停止。' })), null)
  assert.equal(noticeFor(done({ trigger: 'system' })), null)
  // A chat reply arrives while you look at it; a long one (you walked away) is pushed.
  assert.equal(noticeFor(done({ trigger: 'user', input: '查一下' })), null)
  assert.equal(noticeFor(done({ trigger: 'user', input: '查一下', finishedAt: '2026-10-12T01:05:00Z' })).title, '张三 · 查一下 · 完成')
  assert.equal(noticeFor({ ...done({}), mate: { ...mate, notify: false } }), null)
  const remind = noticeFor({ kind: 'remind', mate, run: { id: 'r2', mateId: 'm1' }, routine: { title: '吃药', input: '饭后' } })
  assert.equal(remind.title, '张三 · 提醒'); assert.equal(remind.body, '吃药\n饭后'); assert.equal(remind.urgent, true)
  assert.equal(noticeFor({ kind: 'waiting', mate, run: { id: 'r3', mateId: 'm1', ask: { question: '发给谁？' } } }).body, '发给谁？')
  assert.equal(noticeFor({ kind: 'queued', mate, run: { id: 'r4' } }), null)
})
