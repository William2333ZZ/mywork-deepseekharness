import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { shrink } from '../src/index.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const RUNNER = join(HERE, '..', 'src', 'runner.py')
const py = (mode, input, extra = []) => {
  const r = spawnSync('python3', [RUNNER, mode, ...extra], { input, encoding: 'utf8', timeout: 60000 })
  assert.equal(r.status, 0, r.stderr)
  return JSON.parse(r.stdout)
}

test('status reports python and the vendored providers', () => {
  const s = py('status')
  assert.match(s.python, /^3\.\d+/)
  assert.ok(s.providers.includes('PolymarketProvider') && s.providers.includes('EastmoneyProvider'))
  assert.ok(s.providers.length >= 13)
})

test('describe exposes methods with query fields', () => {
  const d = py('describe', undefined, ['PolymarketProvider'])
  assert.equal(d.length, 1)
  const m = d[0].methods.find((x) => x.name === 'list_events')
  assert.ok(m, 'list_events listed')
  assert.equal(m.params[0].query, 'PolymarketEventQuery')
  assert.ok(m.params[0].fields.some((f) => f.name === 'slug_contains'))
})

test('call reports per-call errors without aborting the batch', () => {
  const r = py('call', JSON.stringify({ calls: [
    { id: 'a', provider: 'NopeProvider', method: 'x', args: {} },
    { id: 'b', provider: 'PolymarketProvider', method: 'list_events', args: { bogus_field: 1 } },
    { id: 'c', provider: 'KalshiProvider', method: 'get_market', args: { nope: 1 } },
  ] }))
  assert.match(r.errors.a, /unknown provider/)
  assert.match(r.errors.b, /fields of PolymarketEventQuery: .*slug_contains/)
  assert.match(r.errors.c, /does not take/)
  assert.deepEqual(r.results, {})
})

test('shrink trims long arrays before cutting text', () => {
  const big = { bars: Array.from({ length: 500 }, (_, i) => ({ i, close: i * 1.5 })) }
  const s = shrink(big, 2000)
  assert.equal(s.truncated, true)
  assert.ok(Array.isArray(s.value.bars) && s.value.bars.length <= 51)
  assert.ok(JSON.stringify(s.value).length <= 2000)
  assert.deepEqual(shrink({ a: 1 }, 100), { value: { a: 1 }, truncated: false })
  const prose = [{ title: 'x', description: 'y'.repeat(50000) }, { title: 'z', description: 'w'.repeat(50000) }]
  const p = shrink(prose, 3000)
  assert.ok(Array.isArray(p.value) && p.value.length === 2 && p.value[0].title === 'x', 'array structure survives long strings')
  assert.ok(JSON.stringify(p.value).length <= 3000)
})
