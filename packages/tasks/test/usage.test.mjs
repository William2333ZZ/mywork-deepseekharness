/** The usage ledger (PROACTIVE.md §14): per day, teammate and bucket; kept 62 days; sums over a window. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { dayKey, isUsage, usageBucket, UsageStore, usageTokens } from '../src/store.js'

test('buckets: what you said, a routine, or something it started itself', () => {
  assert.deepEqual([{ trigger: 'user' }, { trigger: 'routine' }, { trigger: 'system' }, null].map(usageBucket), ['user', 'routine', 'self', 'self'])
  assert.equal(isUsage({ inputTokens: 0, outputTokens: 0 }), false); assert.equal(isUsage(null), false); assert.equal(isUsage({ outputTokens: 3 }), true)
})

test('the ledger sums a window, splits by teammate, survives a reload and forgets days past 62', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mywork-usage-'))
  const file = join(dir, 'usage.json')
  const s = new UsageStore(file)
  const day = (n) => new Date(2026, 9, 11 - n, 12)
  s.add('a', 'user', { inputTokens: 100, outputTokens: 10 }, day(0))
  s.add('a', 'user', { inputTokens: 100, outputTokens: 10, cacheReadTokens: 800 }, day(0))
  s.add('a', 'routine', { inputTokens: 50, outputTokens: 5 }, day(3))
  s.add('b', 'self', { inputTokens: 7, outputTokens: 1 }, day(40))
  assert.equal(s.add('a', 'user', { inputTokens: 0 }, day(0)), false) // nothing to count
  assert.equal(s.add('a', 'nope', { inputTokens: 5 }, day(0)), false)
  const now = day(0)
  const today = s.sum('a', 1, now)
  assert.deepEqual(today.user, { calls: 2, input: 200, output: 20, cacheRead: 800, cacheWrite: 0 })
  assert.equal(usageTokens(today.routine), 0)
  assert.equal(usageTokens(s.sum('a', 30, now).routine), 55)
  assert.equal(usageTokens(s.sum('', 30, now).self), 0) // day 40 is outside 30 days
  assert.equal(usageTokens(s.sum('', 62, now).self), 8)
  const again = new UsageStore(file)
  assert.deepEqual(again.sum('a', 1, now), today)
  // Older than 62 kept days: dropped on the next save.
  for (let i = 0; i < 65; i++) again.add('c', 'user', { inputTokens: 1 }, day(100 + i))
  assert.equal(Object.keys(again.days).length, 62)
  assert.ok(!again.days[dayKey(day(164))])
  rmSync(dir, { recursive: true, force: true })
})
