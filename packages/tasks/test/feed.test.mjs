/**
 * 今日's line across days (GET /feed, §8.3): what goes in, in what order, what never does, how it pages; the client's
 * merge / separator helpers; and what the day's assistant is told about earlier days.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assistantMemory, buildFeed, localDay, plainText, statusWord } from '../src/feed.js'
import { DeliverableStore, TaskStore } from '../src/store.js'
import { RoutineStore } from '../src/routines.js'
import { ASSISTANT } from '../src/scenarios.js'
import { dayStartIso, feedKey, feedRows, mergeFeed, olderDayOf, shiftDay } from '../src/client/thread.cjs'

const T0 = new Date('2026-09-30T01:00:00.000Z').getTime()
const at = (min) => new Date(T0 + min * 60000).toISOString()
const DAY = 24 * 60
const kinds = (list) => list.map((e) => e.kind)
const stamp = (s, id, i, iso) => { s.get(id).activity[i].at = iso }

/** A day's assistant thread with its lines stamped at fixed minutes from T0. */
function thread(s, day, lines) {
  const t = s.create({ input: lines[0][1], scenario: 'assistant', title: '今天的对话', source: 'today' })
  s.update(t.id, { dayKey: day, createdAt: at(lines[0][2]) })
  lines.forEach(([kind, text, min, extra], i) => { s.activity(t.id, { kind, text, ...(extra || {}) }); stamp(s, t.id, i, at(min)) })
  return t
}

test('feed: user / text / handoff of every day, reminders and routine changes, merged ascending; tools never', () => {
  const s = new TaskStore(null); const rs = new RoutineStore(null); const d = new DeliverableStore(null)
  const yesterday = thread(s, '2026-09-29', [['user', '昨天问的', -DAY + 60], ['tool', 'x', -DAY + 61, { name: 'mywork_task_create', detail: '{}' }], ['handoff', '', -DAY + 62, { target: 'task', id: 'task-a', title: 'A' }], ['text', '交给后台了', -DAY + 63]])
  const today = thread(s, '2026-09-30', [['user', '今天问的', 10], ['text', '答', 11], ['user', '再短一点', 30], ['handoff', '', 31, { target: 'task', id: 'task-a', title: 'A', followup: true }], ['text', '已经让它接着改', 32], ['verify', 'v', 33], ['ask', 'q', 34]])
  const brief = rs.create({ kind: 'task', input: '给我一份简报', title: '简报', schedule: { type: 'daily', time: '09:00' } })
  const run1 = s.create({ input: '简报', routineId: brief.id }); s.setStatus(run1.id, 'done', { finishedAt: at(20), quiet: true })
  rs.ran(brief.id, { taskId: run1.id }); rs.markRun(brief.id, '', { taskId: run1.id, deliverableId: '', changed: false, error: '' }); rs.get(brief.id).runs[0].settledAt = at(20)
  const run2 = s.create({ input: '简报', routineId: brief.id }); s.setStatus(run2.id, 'done', { finishedAt: at(25) })
  rs.ran(brief.id, { taskId: run2.id }); rs.markRun(brief.id, '', { taskId: run2.id, deliverableId: '', changed: true, error: '' }); rs.get(brief.id).runs[0].settledAt = at(25)
  const water = rs.create({ kind: 'remind', input: '喝水', schedule: { type: 'daily', time: '10:00' } })
  rs.fire(water.id); rs.ran(water.id, { fired: true }); rs.get(water.id).fired[0].at = at(15); rs.get(water.id).runs[0].at = at(15)
  const feed = buildFeed({ store: s, deliverables: d, routines: rs, today: '2026-09-30' })
  assert.equal(feed.today, '2026-09-30'); assert.equal(feed.nextBefore, null)
  assert.deepEqual(kinds(feed.entries), ['user', 'handoff', 'text', 'user', 'text', 'remind', 'change', 'user', 'handoff', 'text'])
  for (let i = 1; i < feed.entries.length; i += 1) assert.ok(Date.parse(feed.entries[i].at) >= Date.parse(feed.entries[i - 1].at), 'ascending')
  assert.ok(!feed.entries.some((e) => e.kind === 'tool' || e.kind === 'verify' || e.kind === 'ask'))
  assert.deepEqual(feed.entries[0], { kind: 'user', at: at(-DAY + 60), text: '昨天问的', taskId: yesterday.id })
  assert.deepEqual(feed.entries[1], { kind: 'handoff', at: at(-DAY + 62), target: 'task', id: 'task-a', title: 'A', taskId: yesterday.id })
  assert.deepEqual(feed.entries[5], { kind: 'remind', at: at(15), routineId: water.id, title: '喝水', acked: false })
  assert.deepEqual(feed.entries[6], { kind: 'change', at: at(25), routineId: brief.id, taskId: run2.id, title: '简报', report: false })
  assert.equal(feed.entries[8].followup, true); assert.equal(feed.entries[8].taskId, today.id)
  assert.ok(!feed.entries.some((e) => e.kind === 'change' && e.taskId === run1.id), 'the quiet run is not in the line')
  // 知道了 flips acked in place; a firing the fired[] list lost (only its run receipt is left) reads as acknowledged.
  rs.ack(water.id, at(15))
  rs.ran(water.id, { fired: true }); rs.get(water.id).runs[0].at = at(-3 * DAY)
  const again = buildFeed({ store: s, routines: rs, today: '2026-09-30' }).entries.filter((e) => e.kind === 'remind')
  assert.deepEqual(again.map((e) => [e.at, e.acked]), [[at(-3 * DAY), true], [at(15), true]])
})

test('feed: reports are always in, no-verdict / failed / in-flight runs are not; a routine run without its task is skipped', () => {
  const s = new TaskStore(null); const rs = new RoutineStore(null)
  const daily = rs.create({ kind: 'task', input: '根据我一天的问题写日报', title: '日报', schedule: { type: 'daily', time: '19:00' } })
  const quietReport = s.create({ input: '日报', routineId: daily.id }); s.setStatus(quietReport.id, 'done', { finishedAt: at(1), quiet: true, report: true })
  rs.ran(daily.id, { taskId: quietReport.id }); rs.markRun(daily.id, '', { taskId: quietReport.id, deliverableId: 'd1', changed: false, error: '' })
  const other = rs.create({ kind: 'task', input: '盯着这个页面', title: '盯页面', schedule: { type: 'interval', everyMinutes: 30 } })
  const noVerdict = s.create({ input: 'x', routineId: other.id }); s.setStatus(noVerdict.id, 'done', { finishedAt: at(2) })
  rs.ran(other.id, { taskId: noVerdict.id }); rs.markRun(other.id, '', { taskId: noVerdict.id, deliverableId: '', changed: null, error: '' })
  const failed = s.create({ input: 'x', routineId: other.id }); s.setStatus(failed.id, 'done', { finishedAt: at(3), error: '超时' })
  rs.ran(other.id, { taskId: failed.id }); rs.markRun(other.id, '', { taskId: failed.id, deliverableId: '', changed: null, error: '超时' })
  const running = s.create({ input: 'x', routineId: other.id }); s.setStatus(running.id, 'running')
  rs.ran(other.id, { taskId: running.id })
  rs.ran(other.id, { taskId: 'task-gone' }); rs.markRun(other.id, '', { taskId: 'task-gone', deliverableId: '', changed: true, error: '' })
  const feed = buildFeed({ store: s, routines: rs, today: '2026-09-30' })
  assert.deepEqual(feed.entries.map((e) => [e.kind, e.taskId, e.report]), [['change', quietReport.id, true]])
})

test('feed: paging by before / limit, newest first page, nextBefore, entries sharing a stamp never split', () => {
  const s = new TaskStore(null)
  const lines = []
  for (let i = 0; i < 25; i += 1) lines.push([i % 2 ? 'text' : 'user', 'm' + i, i])
  thread(s, '2026-09-30', lines)
  const p1 = buildFeed({ store: s, today: '2026-09-30', limit: 10 })
  assert.equal(p1.entries.length, 10); assert.equal(p1.entries[0].text, 'm15'); assert.equal(p1.entries[9].text, 'm24'); assert.equal(p1.nextBefore, at(15))
  const p2 = buildFeed({ store: s, today: '2026-09-30', limit: 10, before: p1.nextBefore })
  assert.deepEqual(p2.entries.map((e) => e.text), ['m5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12', 'm13', 'm14']); assert.equal(p2.nextBefore, at(5))
  const p3 = buildFeed({ store: s, today: '2026-09-30', limit: 10, before: p2.nextBefore })
  assert.deepEqual(p3.entries.map((e) => e.text), ['m0', 'm1', 'm2', 'm3', 'm4']); assert.equal(p3.nextBefore, null)
  assert.equal(buildFeed({ store: s, today: '2026-09-30', before: at(0) }).entries.length, 0)
  // Defaults and clamps: 60 by default, at most 200, at least 1.
  assert.equal(buildFeed({ store: s, today: 'x' }).entries.length, 25)
  assert.equal(buildFeed({ store: s, today: 'x', limit: 0 }).entries.length, 25); assert.equal(buildFeed({ store: s, today: 'x', limit: 1 }).entries.length, 1)
  assert.equal(buildFeed({ store: s, today: 'x', limit: 999 }).entries.length, 25)
  // Two entries on the same millisecond stay on one page, so paging by `at` skips nothing.
  const t = s.items[0]; t.activity[10].at = t.activity[9].at
  const tie = buildFeed({ store: s, today: 'x', limit: 15 })
  assert.equal(tie.entries.length, 16); assert.equal(tie.entries[0].text, 'm9'); assert.equal(tie.nextBefore, at(9))
  assert.equal(buildFeed({ store: s, today: 'x', before: tie.nextBefore }).entries.length, 9)
  // An empty store: nothing, and nothing older.
  assert.deepEqual(buildFeed({ store: new TaskStore(null), today: 'x' }), { entries: [], nextBefore: null, today: 'x' })
})

test('feed: an old thread whose first line is not in its activity shows its input at createdAt', () => {
  const s = new TaskStore(null)
  const t = s.create({ input: '第一句', scenario: 'assistant' }); s.update(t.id, { dayKey: '2026-09-28', createdAt: at(-2 * DAY) })
  s.activity(t.id, { kind: 'text', text: '答' }); stamp(s, t.id, 0, at(-2 * DAY + 1))
  const feed = buildFeed({ store: s, today: '2026-09-30' })
  assert.deepEqual(feed.entries.map((e) => [e.kind, e.text, e.at]), [['user', '第一句', at(-2 * DAY)], ['text', '答', at(-2 * DAY + 1)]])
  const normal = new TaskStore(null); const n = normal.create({ input: 'hi', scenario: 'assistant' }); normal.activity(n.id, { kind: 'user', text: 'hi' })
  assert.equal(buildFeed({ store: normal, today: 'x' }).entries.length, 1)
})

test('client helpers: keys, merge without doubles, separators only before earlier days, the next day to reveal', () => {
  const today = localDay(at(120))
  const yesterday = shiftDay(today, -1)
  const before = shiftDay(today, -2)
  const e = (kind, iso, extra) => ({ kind, at: iso, ...(extra || {}) })
  assert.equal(feedKey(e('remind', at(1), { routineId: 'r1' })), 'remind|' + at(1) + '|r1')
  assert.equal(feedKey(e('handoff', at(1), { id: 'task-a', taskId: 'day' })), 'handoff|' + at(1) + '|task-a')
  const a = [e('user', at(-DAY), { text: 'y', taskId: 'd1' }), e('remind', at(10), { routineId: 'r1', acked: false })]
  const merged = mergeFeed(a, [e('remind', at(10), { routineId: 'r1', acked: true }), e('text', at(5), { text: 'r', taskId: 'd2' })])
  assert.deepEqual(merged.map((x) => [x.kind, x.at]), [['user', at(-DAY)], ['text', at(5)], ['remind', at(10)]])
  assert.equal(merged[2].acked, true)
  const from = dayStartIso(today)
  const rows = feedRows(merged, from, today, '昨天')
  assert.deepEqual(rows.map((x) => x.kind), ['text', 'remind']); assert.ok(rows.every((x) => x.today && x.key))
  assert.equal(olderDayOf(merged, from), yesterday)
  const all = feedRows(mergeFeed(merged, [e('user', at(-2 * DAY), { text: 'b', taskId: 'd0' })]), dayStartIso(before), today, '昨天')
  assert.deepEqual(all.map((x) => x.kind), ['date', 'user', 'date', 'user', 'text', 'remind'])
  const [m, d] = yesterday.split('-').slice(1).map(Number)
  assert.equal(all[2].label, '昨天 · ' + m + '/' + d); assert.ok(!/昨天/.test(all[0].label)); assert.ok(all[0].key.startsWith('date|'))
  assert.ok(!all[1].today && all[4].today)
  assert.equal(olderDayOf(merged, dayStartIso(before)), '')
})

test('assistant memory: the newest five user tasks with a status word, earlier days\' lines (≤20, ≤2000 chars, oldest first), last three results', () => {
  const s = new TaskStore(null); const d = new DeliverableStore(null)
  thread(s, '2026-09-28', [['user', '前天问的 **加粗**', -2 * DAY], ['text', '# 标题\n\n前天答的', -2 * DAY + 1]])
  const y = thread(s, '2026-09-29', [['user', '昨天问的', -DAY + 60], ['handoff', '', -DAY + 61, { target: 'task', id: 'x', title: 'X' }], ['text', '交给后台了', -DAY + 62], ['tool', 'x', -DAY + 63, { name: 'x' }]])
  thread(s, '2026-09-30', [['user', '今天问的', 10], ['text', '今天答的', 11]])
  const tasks = []
  for (let i = 0; i < 7; i += 1) { const t = s.create({ input: '任务 ' + i, title: '任务 ' + i }); t.createdAt = at(i); tasks.push(t) }
  s.setStatus(tasks[0].id, 'done', { finishedAt: at(100) }); d.create({ taskId: tasks[0].id, title: '结果零', markdown: 'x' }).createdAt = at(101)
  s.setStatus(tasks[1].id, 'done', { finishedAt: at(50), error: '超时' })
  s.setStatus(tasks[2].id, 'running', { startedAt: at(52) }); s.step(tasks[2].id, '查阅', 'open_url')
  s.setStatus(tasks[3].id, 'done', { finishedAt: at(53) })
  const quiet = s.create({ input: '安静的例行', routineId: 'rt-1' }); s.setStatus(quiet.id, 'done', { finishedAt: at(200), quiet: true }); d.create({ taskId: quiet.id, title: '没有变化的简报', markdown: 'x' }).createdAt = at(201)
  d.create({ taskId: tasks[3].id, title: '结果三', markdown: 'x' }).createdAt = at(102); d.create({ taskId: tasks[2].id, title: '结果二', markdown: 'x' }).createdAt = at(103)
  const m = assistantMemory({ store: s, deliverables: d, today: '2026-09-30' })
  // Newest by last activity (a deliverable, a finish, a creation), five of them; status words; never a quiet run or a day's thread.
  assert.deepEqual(m.recent.map((x) => x.id), [tasks[2].id, tasks[3].id, tasks[0].id, tasks[1].id, tasks[6].id])
  assert.deepEqual(m.recent.map((x) => x.status), ['执行', '已交付', '已交付', '失败', '排队'])
  assert.ok(m.recent.every((x) => x.id !== quiet.id && !x.title.includes('对话')))
  assert.equal(m.history, ['9/28 用户：前天问的 加粗', '9/28 你：标题 前天答的', '9/29 用户：昨天问的', '9/29 你：交给后台了'].join('\n'))
  assert.ok(!m.history.includes('今天'), 'today is the session itself')
  assert.deepEqual(m.results, ['结果二', '结果三', '结果零'])
  // Bounds: twenty lines, two thousand characters, the oldest dropped first.
  const big = new TaskStore(null)
  const many = big.create({ input: 'x', scenario: 'assistant' }); big.update(many.id, { dayKey: '2026-09-20' })
  for (let i = 0; i < 30; i += 1) { big.activity(many.id, { kind: 'user', text: 'l' + i + ' ' + 'a'.repeat(150) }); stamp(big, many.id, i, at(-10 * DAY + i)) }
  const h = assistantMemory({ store: big, today: '2026-09-30' }).history.split('\n')
  assert.ok(h.length < 20 && h.length >= 12); assert.ok(h.join('\n').length <= 2000); assert.ok(h[h.length - 1].includes('l29'))
  assert.deepEqual(assistantMemory({ store: new TaskStore(null), today: '2026-09-30' }), { recent: [], history: '', results: [] })
  assert.equal(statusWord({ status: 'waiting' }), '等你答'); assert.equal(statusWord({ status: 'done' }, []), '已完成'); assert.equal(plainText('- **a**\n\n> b'), 'a b')
  assert.equal(plainText('x'.repeat(300)).length, 200)
})

test('assistant compose: the memory goes in as facts, the four ways are named, and nothing apologises for memory', () => {
  const memory = { recent: [{ id: 'task-1', title: 'Node 简报', status: '已交付' }], history: '9/29 用户：昨天问的\n9/29 你：交给后台了', results: ['Node 简报', '周报'] }
  const p = ASSISTANT.compose('再短一点', { date: '2026-09-30', today: { summary: '在跑：X' }, memory })
  assert.match(p, /四种处理/); assert.match(p, /mywork_task_say/); assert.match(p, /最近的任务（追问时用它的 id）：\n- task-1 · Node 简报 · 已交付/)
  assert.match(p, /前几天的对话：\n9\/29 用户：昨天问的\n9\/29 你：交给后台了/); assert.match(p, /最近的结果：《Node 简报》《周报》/)
  assert.match(p, /今天的情况：在跑：X/); assert.ok(p.endsWith('用户说：\n再短一点'))
  assert.doesNotMatch(p, /看不到|不记得|记不得|失忆|抱歉|无法看到/)
  const bare = ASSISTANT.compose('hi', { date: '2026-09-30' })
  assert.doesNotMatch(bare, /最近的任务（|前几天的对话：|最近的结果：/) // no memory, no empty blocks; rule 4 still names the list
  assert.equal(ASSISTANT.toolStepMap.mywork_task_say, '追问')
})
