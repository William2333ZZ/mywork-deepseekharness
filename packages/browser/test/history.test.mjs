import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { HistoryStore, looksLikeUrl, prettyUrl, resolveOmni, searchUrl } from '../src/history.js'

test('looksLikeUrl follows Chrome: hosts with a dot, localhost, IPs and schemes are addresses; words and phrases are searches', () => {
  for (const s of ['github.com', 'https://x.y', 'localhost:3090', '127.0.0.1:9333/json', 'docs.python.org/3/', 'a-b.co:8080']) assert.equal(looksLikeUrl(s), true, s)
  for (const s of ['github', 'react hooks', 'what is dsh', 'foo.', '.bar', '']) assert.equal(looksLikeUrl(s), false, s)
})

test('resolveOmni: url > bookmark name > search', () => {
  const bookmarks = [{ name: 'GitHub', url: 'https://github.com/' }]
  assert.deepEqual(resolveOmni('github.com', { bookmarks }), { kind: 'url', url: 'https://github.com/' })
  assert.equal(resolveOmni('github', { bookmarks }).kind, 'bookmark')
  const s = resolveOmni('react hooks', { engine: 'google', bookmarks })
  assert.equal(s.kind, 'search'); assert.equal(s.url, 'https://www.google.com/search?q=react%20hooks')
  assert.equal(resolveOmni('x', { engine: 'nope' }).engine, 'bing')
  assert.equal(resolveOmni('   '), null)
  assert.equal(searchUrl('a b', 'baidu'), 'https://www.baidu.com/s?wd=a%20b')
})

test('prettyUrl strips scheme, www and the trailing slash', () => {
  assert.equal(prettyUrl('https://www.github.com/foo/'), 'github.com/foo')
  assert.equal(prettyUrl('http://localhost:3090/'), 'localhost:3090')
})

test('HistoryStore records, ranks prefix matches first, dedupes bursts, persists and clears', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mwb-hist-'))
  const h = new HistoryStore(join(dir, 'h.json'), { saveDelayMs: 1 })
  const t0 = 1_000_000
  assert.equal(h.record('about:blank', '', t0), false)
  assert.equal(h.record('https://127.0.0.1:3090/?token=abc', 'DSH', t0), false)
  h.record('https://github.com/', 'GitHub', t0)
  h.record('https://github.com/', 'GitHub · Home', t0 + 100) // same navigation burst: title only
  assert.equal(h.load().get('https://github.com/').count, 1)
  h.record('https://github.com/', 'GitHub', t0 + 60_000)
  assert.equal(h.load().get('https://github.com/').count, 2)
  h.record('https://docs.github.com/en', 'GitHub Docs', t0 + 70_000)
  h.record('https://news.ycombinator.com/', 'Hacker News: github week', t0 + 80_000)
  const r = h.search('git', 8, t0 + 90_000)
  assert.equal(r[0].url, 'https://github.com/'); assert.equal(r[0].prefix, true)
  assert.ok(r.some((x) => x.url === 'https://news.ycombinator.com/' && x.prefix === false))
  assert.equal(h.search('', 8).length, 0)
  h.setEngine('google'); h.save()
  const h2 = new HistoryStore(join(dir, 'h.json'))
  assert.equal(h2.size(), 3); assert.equal(h2.engine, 'google')
  assert.throws(() => h2.setEngine('altavista'))
  h2.clear(); assert.equal(h2.size(), 0)
})
