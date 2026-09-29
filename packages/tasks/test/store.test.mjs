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
  const rr = createScenarioRegistry(); rr.register(GENERAL); rr.register({ id: 'trade', label: '交易', compose: () => 'p', match: (x) => /黄金|美债/.test(x) })
  assert.equal(rr.route('黄金未来一个月').id, 'trade'); assert.equal(rr.route('写个周报').id, 'general')
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

test('activity stream is capped and trimmed for old tasks', async () => {
  const { ACTIVITY_MAX } = await import('../src/store.js')
  const s = new TaskStore(null)
  const t = s.create({ input: 'x' })
  for (let i = 0; i < ACTIVITY_MAX + 10; i += 1) s.activity(t.id, { kind: 'tool', name: 'read_file', detail: 'p=' + i })
  assert.equal(s.get(t.id).activity.length, ACTIVITY_MAX)
  s.activityResult(t.id, false, 'boom')
  const last = s.get(t.id).activity[ACTIVITY_MAX - 1]
  assert.equal(last.ok, false); assert.equal(last.result, 'boom')
  for (let i = 0; i < 65; i += 1) { const x = s.create({ input: 'y' + i }); s.activity(x.id, { kind: 'text', text: 'hi' }); s.setStatus(x.id, 'done') }
  s.setStatus(t.id, 'done')
  assert.equal(s.get(t.id).activity.length, 0)
  assert.ok(s.items[s.items.length - 1].activity.length > 0)
})

test('verification prompt and verdict parsing', async () => {
  const { defaultVerifyPrompt, parseVerdict, BUILTIN_SCENARIOS } = await import('../src/scenarios.js')
  const { argsPreview, resultPreview } = await import('../src/engine.js')
  assert.deepEqual(BUILTIN_SCENARIOS.map((s) => s.id), ['general'])
  assert.equal(BUILTIN_SCENARIOS[0].deliverable, 'auto')
  assert.match(BUILTIN_SCENARIOS[0].compose('x', { capabilities: { browser: true, office: false } }), /open_url[\s\S]*Markdown 表格/)
  assert.match(BUILTIN_SCENARIOS[0].compose('x', { capabilities: {} }), /没有浏览器工具/)
  const p = defaultVerifyPrompt({ input: '做一张表' }, [{ title: 'T', markdown: '| a |' }], [{ kind: 'tool', name: 'open_url', detail: 'url=x', ok: false }])
  assert.match(p, /做一张表/); assert.match(p, /open_url（失败）/); assert.match(p, /"passed"/)
  assert.deepEqual(parseVerdict('结论如下：\n{"passed": true, "checked": 3, "issues": 0, "notes": "ok"}'), { passed: true, checked: 3, issues: 0, notes: 'ok' })
  assert.equal(parseVerdict('no json here'), null)
  assert.equal(parseVerdict('{"foo":1}'), null)
  assert.equal(argsPreview({ path: '/a/b', content: 'x'.repeat(200), empty: '' }), 'path=/a/b content=' + 'x'.repeat(79) + '…')
  assert.equal(resultPreview({ data: { message: { content: [{ type: 'text', text: ' a  b ' }] } } }), 'a b')
})
