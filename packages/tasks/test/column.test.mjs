/**
 * The conversation column: what every row shows (preview, lastAt), when it carries a dot (attentionAt,
 * unread via seen.json), search, and the trimming rule that keeps old threads readable.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  ACTIVITY_MAX, ACTIVITY_TEXT_MAX, ACTIVITY_THREAD_MAX, PREVIEW_MAX,
  attentionOf, DeliverableStore, lastAtOf, plainLine, previewOf, searchAll, SeenStore, stripMarkdown, TaskStore, taskView, ts,
} from '../src/store.js'
import { lastRunSummary, routineLastAt, routinePreview, RoutineStore, routineView } from '../src/routines.js'

const iso = (msAgo) => new Date(Date.now() - msAgo).toISOString()
const DAY = 86400000
const task = (over) => ({ id: 't', title: '标题', scenario: 'general', input: 'x', status: 'done', steps: [], activity: [], deliverableIds: [], quiet: false, createdAt: iso(3600000), startedAt: '', finishedAt: iso(60000), error: '', summary: '', ...over })
const dlv = (over) => ({ id: 'd', taskId: 't', title: '交付', kind: 'markdown', markdown: '正文', summary: null, verification: null, createdAt: iso(30000), ...over })

test('plain lines: markdown marks are stripped, empty rules are not lines', () => {
  assert.equal(stripMarkdown('## **结论**：`x` 是 [链接](http://a) 和 *强调*'), '结论：x 是 链接 和 强调')
  assert.equal(stripMarkdown('> - 1. 引用里的列表'), '1. 引用里的列表')
  assert.equal(stripMarkdown('| 包 | 8 个 |'), '包 · 8 个')
  assert.equal(stripMarkdown('|---|---|'), ''); assert.equal(stripMarkdown('---'), ''); assert.equal(stripMarkdown('   '), '')
  assert.equal(plainLine('\n\n---\n# 第一行\n第二行'), '第一行')
  assert.equal(stripMarkdown('![图](x.png) 之后'), '图 之后')
})

test('previewOf: in flight rows say the step, else the status word; verifying never claims 已核验', () => {
  assert.equal(previewOf(task({ status: 'queued' }), []), '排队')
  assert.equal(previewOf(task({ status: 'running' }), []), '执行')
  assert.equal(previewOf(task({ status: 'running', steps: [{ name: '查阅', endedAt: '' }] }), []), '查阅')
  assert.equal(previewOf(task({ status: 'delivering', steps: [{ name: '交付', endedAt: '' }] }), []), '交付')
  assert.equal(previewOf(task({ status: 'verifying', steps: [{ name: '交付', endedAt: 'x' }], verification: { passed: true, at: iso(0) } }), [dlv()]), '核验')
})

test('previewOf: failure, waiting, delivered (summary row / live verdict), answered', () => {
  assert.equal(previewOf(task({ error: '# 模型 **调用** 失败\n第二行' }), [dlv()]), '失败 · 模型 调用 失败')
  const long = previewOf(task({ error: 'e'.repeat(200) }), [])
  assert.equal(long, '失败 · ' + 'e'.repeat(59) + '…'); assert.ok(long.length <= PREVIEW_MAX)
  assert.equal(previewOf(task({ status: 'waiting', activity: [{ kind: 'ask', status: 'pending', question: '要 **哪个** 版本？', at: iso(0) }] }), []), '要 哪个 版本？')
  assert.equal(previewOf(task({ status: 'waiting', activity: [{ kind: 'ask', status: 'answered', question: 'q', at: iso(0) }] }), []), '等你答')
  assert.equal(previewOf(task(), [dlv({ summary: [{ label: '包', value: '8 个' }, { label: 'x', value: 'y' }] })]), '包 8 个')
  assert.equal(previewOf(task(), [dlv()]), '已交付')
  assert.equal(previewOf(task({ verification: { passed: true, at: iso(0) } }), [dlv()]), '已交付 · 已核验')
  assert.equal(previewOf(task({ verification: { passed: false, at: iso(0) } }), [dlv()]), '已交付 · 核验发现问题')
  assert.equal(previewOf(task({ verification: { passed: null, notes: '核验失败', at: iso(0) } }), [dlv()]), '已交付')
  assert.equal(previewOf(task(), [dlv({ verification: { passed: true, at: iso(0) } })]), '已交付 · 已核验') // the deliverable's stamp when the task has none
  // The newest deliverable decides, not the last in the list.
  assert.equal(previewOf(task(), [dlv({ id: 'new', createdAt: iso(1000), summary: [{ label: '新', value: '1' }] }), dlv({ id: 'old', createdAt: iso(90000), summary: [{ label: '旧', value: '0' }] })]), '新 1')
  assert.equal(previewOf(task({ activity: [{ kind: 'text', text: '早', at: iso(9) }, { kind: 'tool', name: 'x', at: iso(5) }, { kind: 'text', text: '## **结论**：可以\n\n细节', at: iso(1) }] }), []), '结论：可以')
  assert.equal(previewOf(task({ activity: [{ kind: 'tool', name: 'x', at: iso(5) }] }), []), '')
})

test('previewOf: never the title twice, never a deliverable title, never more than 80 chars or a second line', () => {
  const t = task({ title: 'Node 简报' })
  assert.equal(previewOf(t, [dlv({ title: 'Node 简报', summary: [{ label: '包', value: '8 个' }] })]), '包 8 个')
  assert.ok(!previewOf(t, [dlv({ title: 'node 简报 · 9 月' })]).toLowerCase().includes('node 简报'))
  assert.ok(!previewOf(t, [dlv({ title: '完全不同的标题' })]).includes('完全不同的标题'))
  assert.equal(previewOf(task({ title: 'Node 简报', activity: [{ kind: 'text', text: '# node 简报\n\n本周三个包升级', at: iso(1) }] }), []), '本周三个包升级')
  assert.equal(previewOf(task({ title: 'Node 简报', activity: [{ kind: 'text', text: 'Node 简报已写好', at: iso(1) }] }), []), 'Node 简报已写好') // every line repeats it: keep the first
  const p = previewOf(task({ activity: [{ kind: 'text', text: '很长'.repeat(100) + '\n第二行', at: iso(1) }] }), [])
  assert.equal(p.length, PREVIEW_MAX); assert.ok(p.endsWith('…')); assert.ok(!p.includes('\n'))
})

test('previewOf: 今日 shows the last thing said, 你： for the user, and a failed turn that got no reply', () => {
  const a = (activity, over) => task({ scenario: 'assistant', activity, ...over })
  assert.equal(previewOf(a([{ kind: 'user', text: '**明天**开会吗', at: iso(2) }], { status: 'running' }), []), '你：明天开会吗')
  assert.equal(previewOf(a([{ kind: 'user', text: 'q', at: iso(3) }, { kind: 'handoff', title: 'x', at: iso(2) }, { kind: 'text', text: '交给后台了\n第二行', at: iso(1) }]), []), '交给后台了')
  assert.equal(previewOf(a([{ kind: 'user', text: 'q', at: iso(2) }], { error: '模型调用失败。' }), []), '失败 · 模型调用失败。')
  assert.equal(previewOf(a([{ kind: 'user', text: 'q', at: iso(2) }, { kind: 'text', text: '答', at: iso(1) }], { error: '后来的错' }), []), '答')
  assert.equal(previewOf(a([]), []), '')
})

test('lastAt moves with the thread, deliverables, verdicts and the end; never with tool calls or steps', () => {
  const t = task({ createdAt: iso(10 * DAY), finishedAt: '', steps: [{ name: 'x', startedAt: iso(0), endedAt: '' }], activity: [{ kind: 'tool', at: iso(0) }] })
  assert.equal(lastAtOf(t, []), t.createdAt)
  t.activity.push({ kind: 'user', text: 'x', at: iso(5 * DAY) }); assert.equal(lastAtOf(t, []), t.activity[1].at)
  const d = dlv({ createdAt: iso(4 * DAY) }); assert.equal(lastAtOf(t, [d]), d.createdAt)
  t.verification = { passed: true, at: iso(3 * DAY) }; assert.equal(lastAtOf(t, [d]), t.verification.at)
  t.finishedAt = iso(2 * DAY); assert.equal(lastAtOf(t, [d]), t.finishedAt)
  assert.equal(ts('garbage'), -Infinity); assert.equal(lastAtOf(task({ createdAt: 'x', finishedAt: '' }), []), 'x')
})

test('attention: only what arrives unasked, never while running, never for quiet runs', () => {
  assert.equal(attentionOf(task({ status: 'running', finishedAt: iso(0) })), '')
  assert.equal(attentionOf(task({ quiet: true })), '')
  const t = task({ finishedAt: iso(50000), verification: { passed: true, at: iso(40000) } })
  assert.equal(attentionOf(t), t.verification.at)
  const w = task({ status: 'waiting', finishedAt: '', activity: [{ kind: 'ask', status: 'pending', question: 'q', at: iso(1000) }] })
  assert.equal(attentionOf(w), w.activity[0].at)
  const a = task({ scenario: 'assistant', finishedAt: iso(9000), activity: [{ kind: 'text', text: 'r', at: iso(8000) }, { kind: 'user', text: 'u', at: iso(100) }] })
  assert.equal(attentionOf(a), a.activity[0].at) // the user's own line is not attention
})

test('unread: seen.json keyed by id, $since baseline, cleared by /seen and lit again by the next event', () => {
  const seen = new SeenStore(null)
  const s = new TaskStore(null); const d = new DeliverableStore(null)
  const t = s.create({ input: '做一件事' })
  assert.equal(taskView(s.get(t.id), d, seen).unread, false) // queued
  s.setStatus(t.id, 'done', { finishedAt: new Date().toISOString() })
  let v = taskView(s.get(t.id), d, seen)
  assert.equal(v.unread, true); assert.equal(v.attentionAt, s.get(t.id).finishedAt); assert.equal(v.preview, '')
  seen.mark([t.id]); assert.equal(taskView(s.get(t.id), d, seen).unread, false)
  const seenAt = seen.get(t.id); assert.ok(seenAt)
  s.update(t.id, { verification: { passed: true, at: new Date(ts(seenAt) + 5000).toISOString() } })
  assert.equal(taskView(s.get(t.id), d, seen).unread, true) // a verdict stamped after the last look
  seen.mark(t.id) // a single id works too
  s.setStatus(t.id, 'running'); assert.equal(taskView(s.get(t.id), d, seen).unread, false) // a follow-up turn: running again
  s.setStatus(t.id, 'done', { finishedAt: new Date(ts(seen.get(t.id)) + 9000).toISOString() }); assert.equal(taskView(s.get(t.id), d, seen).unread, true)
  // Before the file was born nothing is unread: an upgrade does not light up the whole column.
  const old = s.create({ input: '旧任务' }); s.setStatus(old.id, 'done', { finishedAt: iso(30 * DAY) })
  assert.equal(taskView(s.get(old.id), d, seen).unread, false)
  // Quiet routine runs never.
  const q = s.create({ input: '例行', routineId: 'rt-1' }); s.setStatus(q.id, 'done', { finishedAt: new Date(Date.now() + 10).toISOString(), quiet: true })
  assert.equal(taskView(s.get(q.id), d, seen).unread, false)
  // Without a seen store, anything with an attentionAt counts as unread (event payloads in tests).
  assert.equal(taskView(s.get(t.id), d).unread, true)
  seen.forget(t.id); assert.equal(seen.get(t.id), '')
})

test('unread on 今日: the reply lights it, the user\'s own line does not', () => {
  const seen = new SeenStore(null); seen.since = '2000-01-01T00:00:00.000Z'
  const s = new TaskStore(null)
  const t = s.create({ input: 'hi', scenario: 'assistant' })
  s.activity(t.id, { kind: 'user', text: 'hi' }); s.setStatus(t.id, 'done', { finishedAt: iso(0) })
  assert.equal(taskView(s.get(t.id), null, seen).preview, '你：hi')
  seen.mark([t.id], new Date(Date.now() + 1000).toISOString())
  s.activity(t.id, { kind: 'user', text: 'again' }); s.get(t.id).activity[1].at = new Date(Date.now() + 2000).toISOString()
  assert.equal(taskView(s.get(t.id), null, seen).unread, false)
  s.activity(t.id, { kind: 'text', text: '**回答**' }); s.get(t.id).activity[2].at = new Date(Date.now() + 3000).toISOString()
  const v = taskView(s.get(t.id), null, seen)
  assert.equal(v.unread, true); assert.equal(v.preview, '回答'); assert.equal(v.lastAt, s.get(t.id).activity[2].at)
})

test('seen.json round-trips through disk with its $since', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mywork-seen-'))
  try {
    const file = join(dir, 'seen.json')
    const a = new SeenStore(file)
    assert.ok(a.since); a.mark(['task-1', 'rt-2'])
    const raw = JSON.parse(readFileSync(file, 'utf8'))
    assert.equal(raw.$since, a.since); assert.equal(raw['task-1'], a.get('task-1')); assert.equal(Object.keys(raw).length, 3)
    const b = new SeenStore(file)
    assert.equal(b.since, a.since); assert.equal(b.get('rt-2'), a.get('rt-2')); assert.equal(b.items.$since, undefined)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('routine rows: schedule · state, lastAt from notable runs only, unread never from quiet runs', () => {
  const seen = new SeenStore(null); seen.since = '2000-01-01T00:00:00.000Z'
  const rs = new RoutineStore(null)
  const r = rs.create({ kind: 'task', input: '给我一份简报', schedule: { type: 'daily', time: '19:00' } })
  let v = routineView(rs.get(r.id), seen)
  assert.equal(v.preview, '每天 19:00 · 还没跑过'); assert.equal(v.lastRunSummary, null); assert.equal(v.lastAt, r.nextRunAt); assert.equal(v.unread, false); assert.equal(v.attentionAt, '')
  rs.ran(r.id, { taskId: 't1' })
  v = routineView(rs.get(r.id), seen)
  assert.equal(v.preview, '每天 19:00 · 在跑'); assert.equal(v.lastRunSummary.running, true); assert.equal(v.lastRunSummary.changed, null); assert.equal(v.unread, false)
  assert.equal(v.lastAt, rs.get(r.id).nextRunAt) // a run in flight is not yet news
  rs.markRun(r.id, '', { taskId: 't1', deliverableId: 'd1', changed: false, error: '' })
  v = routineView(rs.get(r.id), seen)
  assert.equal(v.preview, '每天 19:00 · 没有变化'); assert.deepEqual({ ...v.lastRunSummary, at: '' }, { at: '', taskId: 't1', changed: false, quiet: true, error: '', report: false, fired: false, running: false })
  assert.equal(v.unread, false); assert.equal(v.lastAt, rs.get(r.id).nextRunAt)
  rs.ran(r.id, { taskId: 't2' }); rs.markRun(r.id, '', { taskId: 't2', deliverableId: 'd2', changed: true, error: '' })
  v = routineView(rs.get(r.id), seen)
  const run = rs.get(r.id).runs[0]; assert.ok(run.settledAt)
  assert.equal(v.preview, '每天 19:00 · 有变化'); assert.equal(v.unread, true); assert.equal(v.lastAt, run.settledAt); assert.equal(v.attentionAt, run.settledAt)
  seen.mark([r.id]); assert.equal(routineView(rs.get(r.id), seen).unread, false)
  rs.ran(r.id, { taskId: 't3' }); rs.markRun(r.id, '', { taskId: 't3', deliverableId: '', changed: null, error: '超时' })
  rs.get(r.id).runs[0].settledAt = new Date(Date.now() + 1000).toISOString()
  v = routineView(rs.get(r.id), seen)
  assert.equal(v.preview, '每天 19:00 · 失败'); assert.equal(v.unread, true); assert.equal(v.lastRunSummary.error, '超时')
  // A settled run without a verdict is finished, not "never ran".
  rs.ran(r.id, { taskId: 't4' }); rs.markRun(r.id, '', { taskId: 't4', deliverableId: 'd4', changed: null, error: '' })
  assert.equal(routinePreview(rs.get(r.id)), '每天 19:00 · 已完成')
  // Report routines: 已出报告, and every report is news.
  const rep = rs.create({ kind: 'task', title: '每日日报', input: '根据我一天的问题写日报', schedule: { type: 'workdays', time: '19:00' } })
  rs.ran(rep.id, { taskId: 't5' }); rs.markRun(rep.id, '', { taskId: 't5', deliverableId: 'd5', changed: true, error: '' })
  v = routineView(rs.get(rep.id), seen)
  assert.equal(v.preview, '工作日 19:00 · 已出报告'); assert.equal(lastRunSummary(rs.get(rep.id)).report, true); assert.equal(v.unread, true)
  // Reminders: schedule · 提醒, lit by firing.
  const rem = rs.create({ kind: 'remind', input: '喝水', schedule: { type: 'daily', time: '08:00' } })
  v = routineView(rs.get(rem.id), seen)
  assert.equal(v.preview, '每天 08:00 · 提醒'); assert.equal(v.unread, false); assert.equal(routineLastAt(rs.get(rem.id)), rem.nextRunAt)
  rs.fire(rem.id); rs.ran(rem.id, { fired: true })
  v = routineView(rs.get(rem.id), seen)
  assert.equal(v.unread, true); assert.equal(v.lastAt, rs.get(rem.id).fired[0].at); assert.equal(v.lastRunSummary.fired, true); assert.equal(v.preview, '每天 08:00 · 提醒')
  assert.equal(routineView(rs.get(rem.id)).unread, true) // without a seen store
})

test('search: case-insensitive substring over titles, inputs and deliverable bodies; capped, newest first, empty for empty', () => {
  const s = new TaskStore(null); const d = new DeliverableStore(null); const rs = new RoutineStore(null)
  const a = s.create({ input: '比较三种 Node 定时任务方案', title: 'Node 定时任务' })
  const b = s.create({ input: '整理 README', title: '产品介绍' })
  const c = s.create({ input: '无关', title: '无关' })
  const dd = d.create({ taskId: b.id, title: '一页介绍', markdown: '# 介绍\n\n这里提到 node 生态\n' + 'x'.repeat(3000) + ' 深处的词' })
  d.create({ taskId: c.id, title: '别的', markdown: '别的正文' })
  rs.create({ kind: 'task', input: '给我一份 node 简报', schedule: { type: 'daily', time: '09:00' } })
  rs.create({ kind: 'remind', input: '喝水', schedule: { type: 'daily', time: '08:00' } })
  assert.deepEqual(searchAll('', { tasks: s.items, deliverables: d.items, routines: rs.items }), { tasks: [], routines: [], deliverables: [] })
  assert.deepEqual(searchAll('   ', { tasks: s.items, deliverables: d.items, routines: rs.items }), { tasks: [], routines: [], deliverables: [] })
  const r = searchAll('NODE', { tasks: s.items, deliverables: d.items, routines: rs.items })
  assert.deepEqual(r.tasks.map((t) => t.id).sort(), [a.id, b.id].sort()) // b through its deliverable's body
  assert.deepEqual(r.routines.map((x) => x.input), ['给我一份 node 简报'])
  assert.deepEqual(r.deliverables, [{ id: dd.id, taskId: b.id, title: dd.title, createdAt: dd.createdAt, kind: 'markdown' }])
  assert.equal(searchAll('深处的词', { deliverables: d.items }).deliverables.length, 0) // only the first 2000 chars of a body
  assert.equal(searchAll('一页', { deliverables: d.items }).deliverables.length, 1)
  assert.equal(searchAll('产品', { tasks: s.items }).tasks[0].id, b.id)
  for (let i = 0; i < 25; i += 1) { const t = s.create({ input: 'many ' + i }); t.createdAt = new Date(Date.now() + i * 1000).toISOString() }
  const many = searchAll('many', { tasks: s.items })
  assert.equal(many.tasks.length, 20); assert.equal(many.tasks[0].input, 'many 24'); assert.equal(many.tasks[19].input, 'many 5')
  const routineAt = (x) => x.kind === 'remind' ? '2030-01-01T00:00:00.000Z' : x.createdAt
  assert.equal(searchAll('水', { routines: rs.items }, { routineAt }).routines[0].kind, 'remind')
})

test('trimming keeps old threads: 200 done tasks + 100 quiet runs later, a 30-day-old task still has its user / text entries', () => {
  const s = new TaskStore(null)
  const old = s.create({ input: '三十天前的任务' })
  s.activity(old.id, { kind: 'user', text: '三十天前的任务' }); s.activity(old.id, { kind: 'tool', name: 'read_file', detail: 'p' }); s.activity(old.id, { kind: 'handoff', target: 'task', id: 'x', title: 'x' }); s.activity(old.id, { kind: 'text', text: '做完了' })
  s.setStatus(old.id, 'done', { finishedAt: iso(30 * DAY) }); s.get(old.id).createdAt = iso(30 * DAY)
  const users = []
  for (let i = 0; i < 200; i += 1) { const t = s.create({ input: 'u' + i }); s.activity(t.id, { kind: 'tool', name: 'x' }); s.activity(t.id, { kind: 'text', text: 'r' + i }); s.setStatus(t.id, 'done'); users.push(t.id) }
  for (let i = 0; i < 100; i += 1) { const t = s.create({ input: 'q' + i, routineId: 'rt-1' }); s.activity(t.id, { kind: 'tool', name: 'x' }); s.activity(t.id, { kind: 'text', text: '变化：无' }); s.setStatus(t.id, 'done', { quiet: true }) }
  const fresh = []
  for (let i = 0; i < 10; i += 1) { const t = s.create({ input: 'n' + i }); s.activity(t.id, { kind: 'tool', name: 'x' }); s.activity(t.id, { kind: 'text', text: 'r' }); s.setStatus(t.id, 'done'); fresh.push(t.id) }
  s.save()
  assert.deepEqual(s.get(old.id).activity.map((a) => a.kind), ['user', 'handoff', 'text'])
  assert.equal(s.get(old.id).activity[2].text, '做完了')
  // The keep window is 60 user-visible tasks: the 10 fresh ones plus the newest 50 of the 200. The 100 quiet runs in between did not eat into it.
  const kinds = (id) => s.get(id).activity.map((a) => a.kind)
  for (const id of fresh) assert.deepEqual(kinds(id), ['tool', 'text'])
  assert.deepEqual(kinds(users[150]), ['tool', 'text']); assert.deepEqual(kinds(users[199]), ['tool', 'text'])
  assert.deepEqual(kinds(users[149]), ['text']); assert.deepEqual(kinds(users[0]), ['text'])
  for (const t of s.items) assert.ok(t.activity.some((a) => a.kind === 'text'), 'every task keeps its thread')
})

test('trimming budgets: tool calls go first, the thread has its own cap, text is bounded', () => {
  const s = new TaskStore(null)
  const t = s.create({ input: 'x' })
  for (let i = 0; i < 10; i += 1) s.activity(t.id, { kind: 'text', text: 't' + i })
  for (let i = 0; i < 200; i += 1) s.activity(t.id, { kind: 'tool', name: 'x', detail: 'd' + i })
  let list = s.get(t.id).activity
  assert.equal(list.length, ACTIVITY_MAX); assert.equal(list.filter((a) => a.kind === 'text').length, 10); assert.equal(list[list.length - 1].detail, 'd199')
  const day = s.create({ input: 'hi', scenario: 'assistant' })
  for (let i = 0; i < 120; i += 1) s.activity(day.id, { kind: i % 2 ? 'text' : 'user', text: 'm' + i })
  list = s.get(day.id).activity
  assert.equal(list.length, ACTIVITY_THREAD_MAX); assert.equal(list[0].text, 'm' + (120 - ACTIVITY_THREAD_MAX)); assert.equal(list[list.length - 1].text, 'm119')
  s.activity(day.id, { kind: 'user', text: 'x'.repeat(ACTIVITY_TEXT_MAX * 3), detail: 'y'.repeat(1000) })
  const last = s.get(day.id).activity[s.get(day.id).activity.length - 1]
  assert.equal(last.text.length, ACTIVITY_TEXT_MAX); assert.ok(last.text.endsWith('…')); assert.equal(last.detail.length, 240)
  // A running task outside the window keeps everything until it is done.
  const run = s.create({ input: 'running' }); s.activity(run.id, { kind: 'tool', name: 'x' }); s.setStatus(run.id, 'running')
  for (let i = 0; i < 70; i += 1) { const x = s.create({ input: 'later' }); s.setStatus(x.id, 'done') }
  assert.equal(s.get(run.id).activity.length, 1)
})
