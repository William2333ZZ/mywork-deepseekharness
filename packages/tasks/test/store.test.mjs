import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DeliverableStore, TaskStore, taskView, titleOf } from '../src/store.js'
import { createScenarioRegistry, GENERAL, stepNameFor } from '../src/scenarios.js'
import { assistantText, reasonError, userMessage } from '../src/engine.js'
import { render } from '../src/md.cjs'

test('task lifecycle: create → steps → done', () => {
  const s = new TaskStore(null)
  const t = s.create({ input: '把 README 整理成一页介绍' })
  assert.equal(t.status, 'queued'); assert.equal(t.scenario, 'general'); assert.equal(t.title, '把 README 整理成一页介绍')
  s.setStatus(t.id, 'running', { startedAt: 'x' })
  s.step(t.id, '读取', 'read_file'); s.step(t.id, '读取', 'read_file'); s.step(t.id, '整理', 'write_file')
  assert.deepEqual(s.get(t.id).steps.map((x) => [x.name, x.count, !!x.endedAt]), [['读取', 2, true], ['整理', 1, false]])
  s.endSteps(t.id)
  assert.ok(s.get(t.id).steps.every((x) => x.endedAt))
  assert.throws(() => s.setStatus(t.id, 'bogus'))
  assert.throws(() => s.create({ input: '   ' }))
})

test('deliverables attach to tasks and show in the view', () => {
  const s = new TaskStore(null); const d = new DeliverableStore(null)
  const t = s.create({ input: 'x', title: '标题' })
  const dd = d.create({ taskId: t.id, markdown: '# 结论\n\n正文', kind: 'report' })
  s.update(t.id, (x) => { x.deliverableIds.push(dd.id) })
  assert.equal(dd.title, '结论')
  const v = taskView(s.get(t.id), d)
  assert.equal(v.deliverables.length, 1); assert.equal(v.statusLabel, '排队'); assert.equal(v.currentStep, '')
  assert.equal(s.bySession('nope'), null)
})

test('scenario registry resolves and validates', () => {
  const r = createScenarioRegistry()
  r.register(GENERAL)
  assert.throws(() => r.register({ id: 'x' }))
  const off = r.register({ id: 'trade', label: '交易', compose: () => 'p', toolStepMap: { oracle_fetch: '取数' } })
  assert.deepEqual(r.list().map((s) => s.id), ['general', 'trade'])
  assert.equal(r.resolve('missing').id, 'general')
  off(); assert.equal(r.get('trade'), null)
  assert.equal(stepNameFor('oracle_fetch', { oracle_fetch: '取数' }), '取数')
  assert.equal(stepNameFor('browser_navigate'), '查阅'); assert.equal(stepNameFor('deliver'), '交付'); assert.equal(stepNameFor('weird_tool'), '工具 weird_tool')
  assert.match(GENERAL.compose('要一份清单', { date: '2026-09-29', cwd: '/w' }), /要一份清单[\s\S]*deliver[\s\S]*2026-09-29/)
})

test('engine helpers', () => {
  const m = userMessage('hi', { kind: 'mywork-task', taskId: 't1' })
  assert.equal(m.role, 'user'); assert.ok(m.id); assert.equal(m.content[0].text, 'hi'); assert.ok(Object.isFrozen(m))
  assert.equal(assistantText({ data: { message: { content: [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }] } } }), 'a\nb')
  assert.equal(reasonError({ kind: 'completed' }), ''); assert.match(reasonError({ kind: 'error', error: { message: 'boom' } }), /boom/); assert.match(reasonError(undefined), /完整/)
  assert.equal(titleOf('## 标题很长'.padEnd(80, '啊')).length, 60)
})

test('markdown renderer escapes and structures', () => {
  const html = render('# A\n\ntext <b>x</b> **bold**\n\n- one\n- two\n\n| h | k |\n|---|---|\n| 1 | 2 |')
  assert.match(html, /<h2>A<\/h2>/); assert.match(html, /&lt;b&gt;x&lt;\/b&gt; <strong>bold<\/strong>/); assert.match(html, /<ul><li>one<\/li><li>two<\/li><\/ul>/); assert.match(html, /<table>/)
  assert.doesNotMatch(html, /<b>/)
})
