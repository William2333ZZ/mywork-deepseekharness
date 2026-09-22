import { test } from 'node:test'
import assert from 'node:assert/strict'
import { composeRunMessage, createAutomationWatcher, normalizeNotifyConfig } from '../src/notify.js'

test('composeRunMessage respects when/failed and truncates', () => {
  assert.equal(composeRunMessage({ title: 'T', text: 'ok', reason: { kind: 'ok' }, when: 'failed', maxChars: 500 }), null)
  assert.match(composeRunMessage({ title: 'T', text: 'ok', reason: { kind: 'ok' }, when: 'always', maxChars: 500 }), /【定时任务】T · 完成\n\nok/)
  assert.match(composeRunMessage({ title: '', text: '', reason: { kind: 'error', error: { message: 'boom' } }, when: 'always', maxChars: 500 }), /未命名任务 · 失败\n\nboom/)
  assert.ok(composeRunMessage({ title: 'T', text: 'x'.repeat(900), reason: { kind: 'ok' }, when: 'always', maxChars: 200 }).endsWith('…（已截断）'))
})
test('watcher only reacts to automation sessions and sends once per turn', async () => {
  const sent = []
  const handler = createAutomationWatcher({ getConfig: () => normalizeNotifyConfig({ automation: { enabled: true, target: 'im:x' } }), send: async (t, m) => { sent.push([t, m]) }, log: () => {} })
  const ev = (type, data) => ({ type, data })
  handler({ id: 'session-other' }, ev('assistant/message', { message: { content: [{ type: 'text', text: 'no' }] } }))
  handler({ id: 'session-other' }, ev('turn/end', { reason: { kind: 'ok' } }))
  const id = 'dsh-automation-session-1'
  handler({ id }, ev('session/title', { title: '每日巡检' }))
  handler({ id }, ev('assistant/message', { message: { content: [{ type: 'text', text: '一切正常' }] } }))
  handler({ id }, ev('turn/end', { reason: { kind: 'ok' } }))
  await new Promise((r) => setTimeout(r, 10))
  assert.equal(sent.length, 1)
  assert.equal(sent[0][0], 'im:x')
  assert.match(sent[0][1], /每日巡检 · 完成\n\n一切正常/)
})
