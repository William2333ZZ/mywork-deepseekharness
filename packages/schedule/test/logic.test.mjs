import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const logic = require('../src/logic.cjs')

test('parseDuration', () => {
  assert.equal(logic.parseDuration('10m'), 600000)
  assert.equal(logic.parseDuration('1h30m'), 5400000)
  assert.equal(logic.parseDuration('2天'), 2 * 86400000)
  assert.equal(logic.parseDuration('abc'), null)
})

test('normalize validates kinds', () => {
  assert.equal(logic.normalize({ title: '', kind: 'once' }).ok, false)
  assert.equal(logic.normalize({ title: 'x', kind: 'daily', time: '25:00' }).ok, false)
  const w = logic.normalize({ title: 'x', kind: 'weekly', time: '9:05', weekdays: [5, 1, 1] })
  assert.equal(w.ok, true)
  assert.deepEqual(w.value.weekdays, [1, 5])
  assert.equal(w.value.time, '09:05')
})

test('nextOccurrence daily/weekly/interval/once', () => {
  const now = new Date(2026, 8, 21, 10, 0, 0) // Monday 2026-09-21 10:00 local
  const daily = { kind: 'daily', time: '09:00', enabled: true }
  assert.equal(logic.nextOccurrence(daily, now).getTime(), new Date(2026, 8, 22, 9, 0).getTime())
  const weekly = { kind: 'weekly', time: '11:00', weekdays: [1, 3], enabled: true }
  assert.equal(logic.nextOccurrence(weekly, now).getTime(), new Date(2026, 8, 21, 11, 0).getTime())
  const interval = { kind: 'interval', everyMinutes: 30, createdAt: new Date(2026, 8, 21, 9, 50).toISOString(), enabled: true }
  assert.equal(logic.nextOccurrence(interval, now).getTime(), new Date(2026, 8, 21, 10, 20).getTime())
  const once = { kind: 'once', at: new Date(2026, 8, 21, 9, 0).toISOString(), enabled: true }
  assert.equal(logic.nextOccurrence(once, now), null)
})

test('dueOccurrence fires once and respects grace', () => {
  const now = new Date(2026, 8, 21, 10, 0, 0)
  const r = { kind: 'once', at: new Date(2026, 8, 21, 9, 55).toISOString(), enabled: true, createdAt: new Date(2026, 8, 21, 9, 0).toISOString() }
  const due = logic.dueOccurrence(r, now)
  assert.equal(due.stale, false)
  assert.equal(due.at.getTime(), new Date(2026, 8, 21, 9, 55).getTime())
  const fired = { ...r, lastFiredAt: due.at.toISOString() }
  assert.equal(logic.dueOccurrence(fired, now), null)
  const old = { ...r, at: new Date(2026, 8, 19, 9, 55).toISOString(), createdAt: new Date(2026, 8, 18, 9, 0).toISOString() }
  assert.equal(logic.dueOccurrence(old, now).stale, true)
})

test('parseCommand forms', () => {
  const now = new Date(2026, 8, 21, 10, 0, 0)
  const rel = logic.parseCommand('10m 喝水', now)
  assert.equal(rel.ok, true)
  assert.equal(rel.value.title, '喝水')
  assert.equal(new Date(rel.value.at).getTime(), now.getTime() + 600000)
  const abs = logic.parseCommand('09:30 早会', now)
  assert.equal(new Date(abs.value.at).getTime(), new Date(2026, 8, 22, 9, 30).getTime())
  const daily = logic.parseCommand('daily 09:00 站会', now)
  assert.equal(daily.value.kind, 'daily')
  const weekly = logic.parseCommand('weekly 1,3,5 10:00 周会', now)
  assert.deepEqual(weekly.value.weekdays, [1, 3, 5])
  const every = logic.parseCommand('every 45m 喝水', now)
  assert.equal(every.value.everyMinutes, 45)
  assert.equal(logic.parseCommand('nonsense', now).ok, false)
})
