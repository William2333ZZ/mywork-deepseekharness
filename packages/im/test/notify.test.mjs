import { test } from 'node:test'
import assert from 'node:assert/strict'
import { composeRunMessage, createAutomationWatcher, normalizeNotifyConfig, resolveTask, taskForSession, listAutomationTasks } from '../src/notify.js'

const store = { definitions: { a1: { id: 'a1', name: '每日巡检', status: 'active', schedule: { kind: 'daily' }, updatedAt: '2026-09-22' } }, runs: { r1: { id: 'r1', automationId: 'a1', sessionId: 'dsh-automation-session-1', status: 'running' } } }

test('config: per-task rules; legacy global fields are ignored (no silent default)', () => {
  const c = normalizeNotifyConfig({ automation: { enabled: true, target: 'im:x', when: 'failed', tasks: { a1: { target: 'im:y' }, bad: { target: '' } } } })
  assert.deepEqual(c.automation.tasks, { a1: { target: 'im:y', when: 'always' } })
  assert.equal(c.automation.default, null)
})
test('tasks: list / resolve / run lookup', () => {
  assert.equal(listAutomationTasks(store)[0].name, '每日巡检')
  assert.equal(resolveTask('巡检', listAutomationTasks(store)).task.id, 'a1')
  assert.match(resolveTask('nope', listAutomationTasks(store)).error, /no scheduled task/)
  assert.equal(taskForSession('dsh-automation-session-1', store).name, '每日巡检')
  assert.equal(taskForSession('other', store), null)
})
test('composeRunMessage respects when/failed and truncates', () => {
  assert.equal(composeRunMessage({ title: 'T', text: 'ok', reason: { kind: 'ok' }, when: 'failed', maxChars: 500 }), null)
  assert.match(composeRunMessage({ title: 'T', text: 'ok', reason: { kind: 'ok' }, when: 'always', maxChars: 500 }), /【定时任务】T · 完成\n\nok/)
  assert.ok(composeRunMessage({ title: 'T', text: 'x'.repeat(900), reason: { kind: 'ok' }, when: 'always', maxChars: 200 }).endsWith('…（已截断）'))
})
test('watcher uses the task rule and ignores tasks without one', async () => {
  const sent = []
  const cfg = normalizeNotifyConfig({ automation: { tasks: { a1: { target: 'im:y' } } } })
  const handler = createAutomationWatcher({ getConfig: () => cfg, send: async (t, m) => { sent.push([t, m]) }, log: () => {}, store: () => store })
  const ev = (type, data) => ({ type, data })
  handler({ id: 'dsh-automation-session-1' }, ev('assistant/message', { message: { content: [{ type: 'text', text: '一切正常' }] } }))
  handler({ id: 'dsh-automation-session-1' }, ev('turn/end', { reason: { kind: 'ok' } }))
  handler({ id: 'dsh-automation-session-9' }, ev('assistant/message', { message: { content: [{ type: 'text', text: 'x' }] } }))
  handler({ id: 'dsh-automation-session-9' }, ev('turn/end', { reason: { kind: 'ok' } }))
  await new Promise((r) => setTimeout(r, 10))
  assert.equal(sent.length, 1)
  assert.deepEqual(sent[0], ['im:y', '【定时任务】每日巡检 · 完成\n\n一切正常'])
})

import { createQuietGate, inQuiet, normalizeQuiet } from '../src/notify.js'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const local = (h, m = 0) => { const d = new Date(2026, 9, 11, h, m); return d }

test('免打扰: on by default 22:00–07:30, wraps midnight, can be turned off or moved', () => {
  assert.deepEqual(normalizeNotifyConfig({}).quiet, { from: '22:00', to: '07:30' })
  assert.equal(normalizeNotifyConfig({ quiet: null }).quiet, null)
  assert.deepEqual(normalizeQuiet({ from: '23:00', to: '06:00' }), { from: '23:00', to: '06:00' })
  assert.deepEqual(normalizeQuiet({ from: '25:00', to: 'x' }), { from: '22:00', to: '07:30' }) // unreadable → default
  const q = { from: '22:00', to: '07:30' }
  assert.deepEqual([local(21, 59), local(22), local(3), local(7, 29), local(7, 30), local(12)].map((d) => inQuiet(d, q)), [false, true, true, true, false, false])
  assert.deepEqual([local(12, 30), local(14)].map((d) => inQuiet(d, { from: '12:00', to: '13:00' })), [true, false])
  assert.equal(inQuiet(local(3), null), false)
})

test('免打扰: held messages survive a restart and go out as one message per chat when it ends; timed reminders go now', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mywork-im-'))
  const file = join(dir, 'held.json')
  const sent = []
  let clock = local(23, 10)
  const cfg = normalizeNotifyConfig({})
  const make = () => createQuietGate({ getConfig: () => cfg, send: async (t, m) => { sent.push([t, m]) }, file, now: () => clock })
  const g = make()
  assert.equal(await g.push('im:a', '【简报】例行 · 失败\n\n源站 500'), 'held')
  clock = local(23, 40)
  assert.equal(await g.push('im:a', '【简报】等你答 · 发给谁？'), 'held')
  assert.equal(await g.push('im:a', '【MyWork】提醒 · 喝水', { urgent: true }), 'sent')
  assert.deepEqual(sent.map((x) => x[1]), ['【MyWork】提醒 · 喝水'])
  assert.equal(await g.flush(), 0) // still quiet
  // Restart: the held ones come back from disk.
  const g2 = make()
  assert.equal(g2.held.length, 2)
  clock = local(7, 31)
  assert.equal(await g2.flush(), 1)
  assert.equal(sent[1][0], 'im:a')
  assert.match(sent[1][1], /^【MyWork】免打扰期间 2 条：\n23:10 【简报】例行 · 失败\n23:40 【简报】等你答 · 发给谁？$/)
  assert.equal(make().held.length, 0) // flushed on disk too
  assert.equal(await g2.push('im:a', '白天的'), 'sent')
  rmSync(dir, { recursive: true, force: true })
})

test('免打扰: a failed send keeps the held messages for the next try; one held message goes as it was', async () => {
  let fail = true
  const sent = []
  let clock = local(1)
  const cfg = normalizeNotifyConfig({})
  const g = createQuietGate({ getConfig: () => cfg, send: async (t, m) => { if (fail) throw new Error('offline'); sent.push(m) }, now: () => clock })
  await g.push('im:a', '只有一条')
  clock = local(9)
  assert.equal(await g.flush(), 0); assert.equal(g.held.length, 1)
  fail = false
  assert.equal(await g.flush(), 1); assert.deepEqual(sent, ['只有一条'])
})
