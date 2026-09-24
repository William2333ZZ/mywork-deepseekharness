import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseCookies, summarize, groupByDomain, domainMatches } from '../src/cookies.js'

test('raw Cookie header needs a domain and splits pairs', () => {
  assert.equal(parseCookies('web_session=abc; a1=xyz').error !== undefined, true)
  const r = parseCookies('Cookie: web_session=abc; a1=x=y', 'https://www.xiaohongshu.com/explore')
  assert.equal(r.format, 'header')
  assert.deepEqual(r.cookies.map((c) => [c.name, c.value, c.domain, c.path]), [['web_session', 'abc', 'www.xiaohongshu.com', '/'], ['a1', 'x=y', 'www.xiaohongshu.com', '/']])
})

test('Cookie-Editor JSON export maps expirationDate / sameSite and forces secure for None', () => {
  const r = parseCookies(JSON.stringify([{ name: 'web_session', value: 'v', domain: '.xiaohongshu.com', path: '/', expirationDate: 1790000000.5, httpOnly: true, secure: false, sameSite: 'no_restriction' }, { name: 'bad' }]))
  assert.equal(r.format, 'json')
  assert.equal(r.cookies.length, 1)
  assert.deepEqual(r.cookies[0], { name: 'web_session', value: 'v', domain: '.xiaohongshu.com', path: '/', secure: true, httpOnly: true, expires: 1790000000, sameSite: 'None' })
})

test('Netscape cookies.txt lines parse, HttpOnly prefix honoured', () => {
  const txt = '# Netscape HTTP Cookie File\n.example.com\tTRUE\t/\tTRUE\t1790000000\tsid\tabc\n#HttpOnly_.example.com\tTRUE\t/\tFALSE\t0\tflag\t1\n'
  const r = parseCookies(txt)
  assert.equal(r.format, 'netscape')
  assert.equal(r.cookies.length, 2)
  assert.equal(r.cookies[0].secure, true)
  assert.equal(r.cookies[1].httpOnly, true)
  assert.equal(r.cookies[1].expires, undefined)
})

test('summaries never carry values; grouping counts per domain; domain matching is suffix-based', () => {
  const r = parseCookies('a=1; b=2', 'x.example.com')
  assert.deepEqual(Object.keys(summarize(r.cookies)[0]), ['name', 'domain', 'path', 'expires', 'secure', 'httpOnly'])
  assert.deepEqual(groupByDomain([{ domain: '.a.com', name: 'x' }, { domain: 'a.com', name: 'y' }, { domain: 'b.com', name: 'z' }]).map((g) => [g.domain, g.count]), [['a.com', 2], ['b.com', 1]])
  assert.equal(domainMatches('.xiaohongshu.com', 'https://www.xiaohongshu.com/'), true)
  assert.equal(domainMatches('.example.com', 'xiaohongshu.com'), false)
})
