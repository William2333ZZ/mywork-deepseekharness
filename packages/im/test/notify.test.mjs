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
