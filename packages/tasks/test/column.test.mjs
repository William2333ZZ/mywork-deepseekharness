/**
 * The sidebar's rules at run level: when a run was last noticed (lastAt), when it asks for attention (unread via
 * seen.json, keyed by teammate), the last line said, routine rows, and the trimming rule that keeps old threads readable.
 * The teammate-level view (preview / state / unread / order) is exercised end to end in mates.test.mjs.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  ACTIVITY_MAX, ACTIVITY_TEXT_MAX, ACTIVITY_THREAD_MAX, attentionOf, lastAtOf, lastLineOf, plainLine, SeenStore, stripMarkdown, TaskStore, ts,
} from '../src/store.js'
import { lastRunSummary, routineLastAt, routinePreview, RoutineStore, routineView } from '../src/routines.js'

const iso = (msAgo) => new Date(Date.now() - msAgo).toISOString()
const DAY = 86400000
const task = (over) => ({ id: 't', mateId: 'mywork', trigger: 'user', title: '标题', input: 'x', status: 'done', steps: [], activity: [], deliverableIds: [], quiet: false, createdAt: iso(3600000), startedAt: '', finishedAt: iso(60000), error: '', summary: '', ...over })
const dlv = (over) => ({ id: 'd', taskId: 't', title: '交付', kind: 'markdown', markdown: '正文', summary: null, verification: null, createdAt: iso(30000), ...over })

test('plain lines: markdown marks are stripped, empty rules are not lines', () => {
  assert.equal(stripMarkdown('## **结论**：`x` 是 [链接](http://a) 和 *强调*'), '结论：x 是 链接 和 强调')
  assert.equal(stripMarkdown('> - 1. 引用里的列表'), '1. 引用里的列表')
  assert.equal(stripMarkdown('| 包 | 8 个 |'), '包 · 8 个')
  assert.equal(stripMarkdown('|---|---|'), ''); assert.equal(stripMarkdown('---'), ''); assert.equal(stripMarkdown('   '), '')
  assert.equal(plainLine('\n\n---\n# 第一行\n第二行'), '第一行')
  assert.equal(stripMarkdown('![图](x.png) 之后'), '图 之后')
})

test('lastLineOf: the last thing said — 你： lines are the user\'s, replies and reminders the teammate\'s; a failure with no reply', () => {
  assert.equal(lastLineOf([]), null)
  const runs = [
    task({ id: 'a', input: '**明天**开会吗', createdAt: iso(50), activity: [{ kind: 'tool', at: iso(45) }, { kind: 'text', text: '## 开\n\n十点', at: iso(40) }] }),
    task({ id: 'b', trigger: 'routine', quiet: true, input: '简报', createdAt: iso(30), activity: [{ kind: 'text', text: '安静的', at: iso(20) }] }),
  ]
  assert.deepEqual(lastLineOf(runs), { at: runs[0].activity[1].at, text: '开', you: false })
  runs.push(task({ id: 'c', input: '再问一句', createdAt: iso(10), status: 'running', finishedAt: '' }))
  assert.deepEqual(lastLineOf(runs).text, '再问一句'); assert.equal(lastLineOf(runs).you, true)
  runs.push(task({ id: 'd', input: 'q', createdAt: iso(8), error: '模型调用失败。', finishedAt: iso(5) }))
  assert.deepEqual([lastLineOf(runs).text, lastLineOf(runs).you], ['失败 · 模型调用失败。', false])
  runs.push(task({ id: 'e', trigger: 'routine', input: '喝水', remind: true, createdAt: iso(3), activity: [{ kind: 'remind', title: '喝水', at: iso(3) }] }))
  assert.equal(lastLineOf(runs).text, '提醒 · 喝水')
  runs.push(task({ id: 'f', trigger: 'system', input: '', createdAt: iso(2), activity: [{ kind: 'text', text: '我是新来的', at: iso(1) }] }))
  assert.equal(lastLineOf(runs).text, '我是新来的')
  // A failure after a reply is not the last word: the reply is.
  assert.equal(lastLineOf([task({ input: 'q', createdAt: iso(9), activity: [{ kind: 'text', text: '答', at: iso(5) }], error: '后来的错', finishedAt: iso(1) })]).text, '答')
})

test('lastAt moves with the thread, deliverables, verdicts and the end; never with tool calls or steps', () => {
  const t = task({ createdAt: iso(10 * DAY), finishedAt: '', steps: [{ name: 'x', startedAt: iso(0), endedAt: '' }], activity: [{ kind: 'tool', at: iso(0) }] })
  assert.equal(lastAtOf(t, []), t.createdAt)
  t.activity.push({ kind: 'user', text: 'x', at: iso(5 * DAY) }); assert.equal(lastAtOf(t, []), t.activity[1].at)
  const d = dlv({ createdAt: iso(4 * DAY) }); assert.equal(lastAtOf(t, [d]), d.createdAt)
  t.verification = { passed: true, at: iso(3 * DAY) }; assert.equal(lastAtOf(t, [d]), t.verification.at)
  t.finishedAt = iso(2 * DAY); assert.equal(lastAtOf(t, [d]), t.finishedAt)
  assert.equal(ts('garbage'), -Infinity); assert.equal(lastAtOf(task({ createdAt: 'x', finishedAt: '' }), []), 'x')
  assert.equal(lastAtOf(task({ trigger: 'system', status: 'running', createdAt: iso(10), finishedAt: '' }), []), '') // the hidden intro line is not a moment
})

test('attention: a finished run, a verification with issues, a pending ask; never while running, never quiet runs', () => {
  assert.equal(attentionOf(task({ status: 'running', finishedAt: iso(0) })), '')
  assert.equal(attentionOf(task({ status: 'queued' })), '')
  assert.equal(attentionOf(task({ trigger: 'routine', quiet: true })), '')
  const t = task({ finishedAt: iso(50000), verification: { passed: true, at: iso(40000) } })
  assert.equal(attentionOf(t), t.finishedAt) // a clean verdict is not news
  t.verification = { passed: false, at: iso(40000) }; assert.equal(attentionOf(t), t.verification.at)
  const w = task({ status: 'waiting', finishedAt: '', activity: [{ kind: 'ask', status: 'pending', question: 'q', at: iso(1000) }] })
  assert.equal(attentionOf(w), w.activity[0].at)
  const a = task({ finishedAt: iso(9000), activity: [{ kind: 'text', text: 'r', at: iso(8000) }, { kind: 'user', text: 'u', at: iso(100) }] })
  assert.equal(attentionOf(a), a.finishedAt) // the user's own later line is not attention
})

test('unread: seen.json keyed by teammate, $since baseline, cleared by /seen and lit again by the next event', () => {
  const seen = new SeenStore(null)
  const now = Date.now()
  assert.equal(seen.unread('mywork', ''), false)
  const done = new Date(now + 10).toISOString()
  assert.equal(seen.unread('mywork', done), true)
  seen.mark('mywork', new Date(now + 20).toISOString()); assert.equal(seen.unread('mywork', done), false)
  assert.equal(seen.unread('mywork', new Date(now + 30).toISOString()), true)
  assert.equal(seen.unread('other', iso(30 * DAY)), false) // before the file was born: an upgrade does not light every row
  seen.forget('mywork'); assert.equal(seen.get('mywork'), '')
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
  const day = s.create({ input: 'hi' })
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
