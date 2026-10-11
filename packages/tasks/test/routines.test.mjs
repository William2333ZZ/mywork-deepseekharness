/**
 * Routines that look after themselves (PROACTIVE.md §11): a task routine that failed three runs in a row pauses and
 * says so; the 200-routine cap never drops a routine that still runs.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FAIL_PAUSE, failStreak, RoutineStore } from '../src/routines.js'

const daily = { type: 'daily', time: '09:00' }
const store = () => new RoutineStore('') // in memory
/** One run of the routine, settled with this outcome (newest first, as the engine keeps them). */
const settle = (s, id, patch) => { const taskId = 't' + Math.random().toString(36).slice(2); s.ran(id, { taskId }); s.markRun(id, '', { taskId, ...patch }) }

test('three failures in a row pause a task routine, with why; a success in between resets the count', () => {
  const s = store()
  const r = s.create({ mateId: 'm1', input: '每天 9 点给我一份简报', schedule: daily })
  settle(s, r.id, { error: 'x.com 打不开' })
  settle(s, r.id, { error: 'x.com 打不开' })
  assert.equal(s.pauseIfFailing(r.id), null)
  settle(s, r.id, { changed: true, error: '' }) // a good run breaks the streak
  settle(s, r.id, { error: 'x.com 打不开' })
  settle(s, r.id, { error: 'x.com 打不开' })
  assert.equal(failStreak(s.get(r.id)), 2); assert.equal(s.pauseIfFailing(r.id), null); assert.equal(s.get(r.id).enabled, true)
  settle(s, r.id, { error: '模型调用失败。' })
  const paused = s.pauseIfFailing(r.id)
  assert.equal(FAIL_PAUSE, 3)
  assert.equal(paused.enabled, false)
  assert.deepEqual([paused.pausedFor.failures, paused.pausedFor.error], [3, '模型调用失败。'])
  assert.equal(s.due(new Date(Date.now() + 2 * 86400000)).length, 0) // a paused routine does not run
  assert.equal(s.pauseIfFailing(r.id), null) // already paused: said once
  // Resuming is the person's call, and clears the reason.
  const back = s.setEnabled(r.id, true)
  assert.equal(back.enabled, true); assert.equal(back.pausedFor, undefined)
})

test('a run you stopped or a restart cut short is not a failure and does not break the streak; reminders never pause', () => {
  const s = store()
  const r = s.create({ mateId: 'm1', input: '每天 9 点给我一份简报', schedule: daily })
  settle(s, r.id, { error: '源站 500' })
  settle(s, r.id, { error: '已停止。' })
  settle(s, r.id, { error: '源站 500' })
  settle(s, r.id, { error: '服务重启，这一轮中断。' })
  assert.equal(failStreak(s.get(r.id)), 2); assert.equal(s.pauseIfFailing(r.id), null)
  s.ran(r.id, { taskId: 'still-going' }) // a run still going is passed over
  assert.equal(failStreak(s.get(r.id)), 2)
  settle(s, r.id, { error: '源站 500' })
  assert.ok(s.pauseIfFailing(r.id))

  const remind = s.create({ mateId: 'm1', kind: 'remind', input: '每天 8 点提醒我喝水', schedule: daily })
  for (let i = 0; i < 4; i++) settle(s, remind.id, { error: 'boom' })
  assert.equal(s.pauseIfFailing(remind.id), null)
})

test('editing the schedule of a paused routine turns it back on and clears the reason', () => {
  const s = store()
  const r = s.create({ mateId: 'm1', input: '每天 9 点给我一份简报', schedule: daily })
  for (let i = 0; i < 3; i++) settle(s, r.id, { error: 'boom' })
  s.pauseIfFailing(r.id)
  const e = s.edit(r.id, { schedule: { type: 'daily', time: '10:00' } })
  assert.equal(e.enabled, true); assert.equal(e.pausedFor, undefined)
})

test('at the cap the oldest routine that no longer runs makes room; one that still runs is never dropped', () => {
  const s = new RoutineStore('')
  s.max = 3
  const brief = s.create({ mateId: 'm1', input: '每天 8 点晨报', schedule: daily })
  const once = s.create({ mateId: 'm1', input: '明天 9 点看一下', schedule: { type: 'once', at: new Date(Date.now() + 3600000).toISOString() } })
  s.ran(once.id, { taskId: 't' }) // spent
  const third = s.create({ mateId: 'm1', input: '每周一 9 点周报', schedule: { type: 'weekly', weekday: 1, time: '09:00' } })
  const fourth = s.create({ mateId: 'm1', input: '每天 18 点日报', schedule: daily })
  assert.deepEqual(s.items.map((r) => r.id), [brief.id, third.id, fourth.id]) // the spent one-off went, the morning brief stayed
  assert.throws(() => s.create({ mateId: 'm1', input: '每天 20 点再来一份', schedule: daily }), /例行已满 3 条/)
  assert.equal(s.items.length, 3); assert.ok(s.get(brief.id))
})
