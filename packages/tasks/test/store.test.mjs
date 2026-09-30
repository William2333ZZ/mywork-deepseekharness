import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deliverableSummary, DeliverableStore, MateStore, TaskStore, titleOf } from '../src/store.js'
import { createScenarioRegistry, GENERAL, stepNameFor } from '../src/scenarios.js'
import { assistantText, reasonError, userMessage } from '../src/engine.js'
import { render } from '../src/md.cjs'

test('run lifecycle: create → steps → done', () => {
  const s = new TaskStore(null)
  const t = s.create({ input: '把 README 整理成一页介绍' })
  assert.equal(t.status, 'queued'); assert.equal(t.title, '把 README 整理成一页介绍')
  assert.deepEqual([t.mateId, t.trigger, t.dispatched, t.verifying, t.verification], ['mywork', 'user', false, false, null])
  assert.equal(s.create({ mateId: 'm', trigger: 'system', input: '' }).input, '') // intro and routine runs may start without a line
  assert.equal(s.create({ input: 'r', routineId: 'rt-1' }).trigger, 'routine')
  s.setStatus(t.id, 'running', { startedAt: 'x' })
  s.step(t.id, '读取', 'read_file'); s.step(t.id, '读取', 'read_file'); s.step(t.id, '整理', 'write_file')
  assert.deepEqual(s.get(t.id).steps.map((x) => [x.name, x.count, !!x.endedAt]), [['读取', 2, true], ['整理', 1, false]])
  s.endSteps(t.id)
  assert.ok(s.get(t.id).steps.every((x) => x.endedAt))
  assert.throws(() => s.setStatus(t.id, 'bogus'))
  assert.throws(() => s.create({ input: '   ' }))
})

test('deliverables belong to a teammate and a run; teammates resolve by session id', () => {
  const s = new TaskStore(null); const d = new DeliverableStore(null)
  const t = s.create({ mateId: 'mate-1', input: 'x', title: '标题' })
  const dd = d.create({ mateId: 'mate-1', runId: t.id, markdown: '# 结论\n\n正文', kind: 'report', summary: [{ label: '行', value: 3 }, { value: 'no label' }] })
  assert.equal(dd.title, '结论'); assert.deepEqual(d.forTask(t.id).map((x) => x.id), [dd.id])
  assert.deepEqual(deliverableSummary(dd), { id: dd.id, mateId: 'mate-1', runId: t.id, title: '结论', kind: 'report', createdAt: dd.createdAt, rating: null, verification: null, summary: [{ label: '行', value: '3' }] })
  const mates = new MateStore(null, { matesDir: '/tmp/mates' })
  const def = mates.ensureDefault(); assert.equal(mates.ensureDefault(), def); assert.equal(mates.items.length, 1)
  const m = mates.create({ name: '  小  二  ', description: '跑腿' })
  assert.deepEqual([m.name, m.glyph, m.dir, m.isDefault, m.pinned, m.notify], ['小 二', '小', '/tmp/mates/' + m.id, false, false, true])
  assert.equal(mates.bySession('mywork-mate-' + m.id), m); assert.equal(mates.bySession('mywork-mate-mywork'), def); assert.equal(mates.bySession('mywork-task-x'), null)
  assert.throws(() => mates.create({ description: ' ' }))
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
  assert.match(p, /做一张表/); assert.match(p, /open_url（失败）/); assert.match(p, /"passed"/); assert.match(p, /同事/)
  assert.deepEqual(parseVerdict('结论如下：\n{"passed": true, "checked": 3, "issues": 0, "notes": "ok"}'), { passed: true, checked: 3, issues: 0, notes: 'ok' })
  assert.equal(parseVerdict('no json here'), null)
  assert.equal(parseVerdict('{"foo":1}'), null)
  assert.equal(argsPreview({ path: '/a/b', content: 'x'.repeat(200), empty: '' }), 'path=/a/b content=' + 'x'.repeat(79) + '…')
  assert.equal(resultPreview({ data: { message: { content: [{ type: 'text', text: ' a  b ' }] } } }), 'a b')
})

test('routines: schedule parsing, next run, store', async () => {
  const { parseSchedule, nextRun, describeSchedule, RoutineStore, changedVerdict, routinePrompt, wantsRecord, recordDays } = await import('../src/routines.js')
  const report = { title: '每日日报', input: '根据我一天的问题写日报', schedule: { type: 'daily', time: '19:00' } }
  assert.equal(wantsRecord(report), true); assert.equal(recordDays(report), 1); assert.equal(recordDays({ input: '写周报', schedule: { type: 'weekly' } }), 7)
  const rp = routinePrompt(report, null, '- 10:00 问：x'); assert.ok(rp.includes('- 10:00 问：x')); assert.ok(!rp.includes('变化：有'))
  assert.ok(routinePrompt({ title: '简报', input: '给我一份简报', schedule: { type: 'daily', time: '09:00' } }, null, '').includes('变化：有'))
  const daily = parseSchedule('每天 9 点给我一份 Node 生态简报')
  assert.equal(daily.kind, 'task'); assert.deepEqual(daily.schedule, { type: 'daily', time: '09:00' }); assert.equal(daily.text, '给我一份 Node 生态简报')
  const weekly = parseSchedule('每周一 8:30 汇总上周的交付物'); assert.deepEqual(weekly.schedule, { type: 'weekly', weekday: 1, time: '08:30' })
  const remind = parseSchedule('明天 8 点提醒我交周报'); assert.equal(remind.kind, 'remind'); assert.equal(remind.schedule.type, 'once'); assert.equal(remind.text, '交周报')
  const doable = parseSchedule('每周五下午 5 点提醒我写周报'); assert.equal(doable.kind, 'task'); assert.equal(doable.text, '写周报'); assert.deepEqual(doable.schedule, { type: 'weekly', weekday: 5, time: '17:00' })
  assert.equal(parseSchedule('工作日 18 点提醒我整理今天的会议记录').kind, 'task')
  assert.equal(parseSchedule('每天 8 点提醒我开会').kind, 'remind')
  const dailyReport = parseSchedule('工作日晚上 7 点提醒我根据今天的问题写日报'); assert.equal(dailyReport.kind, 'task'); assert.deepEqual(dailyReport.schedule, { type: 'workdays', time: '19:00' })
  assert.equal(parseSchedule('明天 8 点提醒我交周报').kind, 'remind')
  const soon = parseSchedule('30 分钟后提醒我喝水'); assert.ok(new Date(soon.schedule.at) - Date.now() > 29 * 60000)
  assert.equal(parseSchedule('写一份周报'), null)
  assert.equal(describeSchedule({ type: 'workdays', time: '18:00' }), '工作日 18:00')
  const from = new Date('2026-09-29T10:00:00') // a Tuesday
  assert.equal(nextRun({ type: 'daily', time: '09:00' }, from).toISOString(), new Date('2026-09-30T09:00:00').toISOString())
  assert.equal(nextRun({ type: 'weekly', weekday: 1, time: '08:30' }, from).getDay(), 1)
  assert.equal(nextRun({ type: 'workdays', time: '18:00' }, new Date('2026-10-02T19:00:00')).getDay(), 1) // Friday evening → Monday
  assert.equal(nextRun({ type: 'once', at: '2020-01-01T00:00:00Z' }, from), null)
  const s = new RoutineStore(null)
  const r = s.create({ kind: 'task', input: '简报', schedule: { type: 'daily', time: '09:00' } })
  assert.ok(r.nextRunAt); assert.equal(s.due(new Date(r.nextRunAt)).length, 1)
  s.ran(r.id, { taskId: 't1' }); assert.equal(s.get(r.id).runs[0].taskId, 't1'); assert.ok(new Date(s.get(r.id).nextRunAt) > new Date())
  const once = s.create({ kind: 'remind', input: '喝水', schedule: { type: 'once', at: new Date(Date.now() + 1000).toISOString() } })
  s.fire(once.id); s.ran(once.id, { fired: true }); assert.equal(s.get(once.id).enabled, false); assert.equal(s.pending().length, 1)
  s.ack(once.id); assert.equal(s.pending().length, 0)
  assert.equal(changedVerdict('内容\n变化：无'), false); assert.equal(changedVerdict('变化：有'), true); assert.equal(changedVerdict('nothing'), null)
  assert.match(routinePrompt(r, { markdown: '上次' }), /上一次的交付物[\s\S]*上次[\s\S]*变化：有/)
})
