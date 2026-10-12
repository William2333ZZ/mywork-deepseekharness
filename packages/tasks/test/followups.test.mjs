/** 跟进 (PROACTIVE.md §4): the ledger, the day it comes back, what the tick does. Code only, no model. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { dayLabel, dueAt, dueNow, FollowupStore, MINE_MAX } from '../src/followups.js'

const now = new Date(2026, 9, 12, 10, 0) // Monday 10/12 10:00

test('the day it comes back: a date at the 读的时间, a date and time, or days from today; never in the past', () => {
  assert.equal(dueAt({ when: '2026-10-19', clock: '08:30', now }).getTime(), new Date(2026, 9, 19, 8, 30).getTime())
  assert.equal(dueAt({ when: '2026-10-12 17:00', now }).getTime(), new Date(2026, 9, 12, 17, 0).getTime())
  assert.equal(dueAt({ days: 3, clock: '09:00', now }).getTime(), new Date(2026, 9, 15, 9, 0).getTime())
  assert.equal(dueAt({ when: '2026-10-12', clock: '08:30', now }), null) // today's 08:30 is gone
  assert.equal(dueAt({ when: '下周', now }), null)
  assert.equal(dueAt({ days: 0, now }), null)
  assert.equal(dayLabel(new Date(2026, 9, 19, 8, 30).toISOString()), '10/19 周一 08:30')
})

test('the ledger is append-only in the folder, the newest line wins, and it reloads', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mywork-fu-'))
  const mate = { id: 'm1', dir }
  const s = new FollowupStore()
  const { followup: f } = s.add(mate, { kind: 'yours', text: '细看那篇论文', quote: '先放着，下周再细看', runId: 'r1', due: new Date(2026, 9, 19, 8, 30), fallback: '对照留在成稿/' })
  assert.equal(f.state, 'open'); assert.equal(f.latest, new Date(2026, 9, 26, 8, 30).toISOString()) // 7 days after
  s.brought(mate, f.id)
  s.settle(mate, f.id, 'closed', '你看过了')
  assert.equal(s.settle(mate, f.id, 'dropped', 'again'), null) // only open ones settle
  const lines = readFileSync(join(dir, '.mywork', '跟进.jsonl'), 'utf8').trim().split('\n')
  assert.equal(lines.length, 3)
  const again = new FollowupStore().get(mate, f.id)
  assert.deepEqual([again.state, again.count, again.note], ['closed', 1, '你看过了'])
  assert.throws(() => s.add(mate, { kind: 'other', text: 'x', due: new Date() }), /kind/)
  assert.throws(() => s.add(mate, { kind: 'mine', text: ' ', due: new Date() }), /text/)
  rmSync(dir, { recursive: true, force: true })
})

test('its own are capped: the oldest is let go to make room; yours are not capped', () => {
  const mate = { id: 'm2', dir: '' }
  const s = new FollowupStore()
  for (let i = 0; i < MINE_MAX; i++) s.add(mate, { kind: 'mine', text: '第 ' + i, due: new Date(2026, 9, 20) })
  for (let i = 0; i < 12; i++) s.add(mate, { kind: 'yours', text: '你的 ' + i, due: new Date(2026, 9, 20) })
  const { dropped } = s.add(mate, { kind: 'mine', text: '再一件', due: new Date(2026, 9, 20) })
  assert.equal(dropped.text, '第 0'); assert.equal(dropped.state, 'dropped')
  assert.equal(s.open(mate).filter((f) => f.kind === 'mine').length, MINE_MAX)
  assert.equal(s.open(mate).filter((f) => f.kind === 'yours').length, 12)
})

test('the tick: due ones come back once; one of yours brought back and not answered by its latest day lapses', () => {
  const mate = { id: 'm3', dir: '' }
  const s = new FollowupStore()
  const { followup: a } = s.add(mate, { kind: 'yours', text: 'a', due: new Date(2026, 9, 13, 8, 30) })
  const { followup: b } = s.add(mate, { kind: 'mine', text: 'b', due: new Date(2026, 9, 14, 9, 0) })
  assert.deepEqual(dueNow(s.open(mate), now), { bring: [], lapse: [] })
  const t1 = new Date(2026, 9, 14, 9, 1)
  assert.deepEqual(dueNow(s.open(mate), t1).bring.map((f) => f.id), [a.id, b.id])
  s.brought(mate, a.id); s.brought(mate, b.id)
  assert.deepEqual(dueNow(s.open(mate), t1), { bring: [], lapse: [] }) // brought once only
  assert.deepEqual(dueNow(s.open(mate), new Date(2026, 9, 20, 8, 30)).lapse.map((f) => f.id), [a.id]) // 7 days after its day
})
