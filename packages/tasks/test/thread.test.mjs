/**
 * The teammate thread's client logic (thread.cjs): one run → its entries, and the helpers the page and the column use.
 * Runs follow the §9.8 contract: { id, mateId, trigger, routineId?, routineTitle?, status, input, activity[],
 * deliverables[], verification, ask, error, quiet, step, createdAt, startedAt, finishedAt }.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { foldedRunIds, threadOf, verifyState, isLive, isQueued, isStopped, remindOf, mergeRuns, activeRun, textAskOf, mateOrder, routineRunKind, initialOf, fileKindOf, openKindOf } from '../src/client/thread.cjs'

const T0 = '2026-09-30T09:00:00.000Z'
const at = (s) => new Date(new Date(T0).getTime() + s * 1000).toISOString()
const kinds = (list) => list.map((e) => e.kind)
const run = (over) => ({ id: 'r1', mateId: 'm1', trigger: 'user', input: '把 README 整理成一页', status: 'done', createdAt: T0, startedAt: T0, finishedAt: at(60), error: '', summary: '', step: '', activity: [], deliverables: [], verification: null, ask: null, quiet: false, ...over })

test('text before a deliverable stays out of the thread; the reply after it joins the delivery in one bubble', () => {
  const r = run({
    activity: [
      { kind: 'text', at: at(5), text: '我先看看仓库。' },
      { kind: 'tool', at: at(6), name: 'read_file', detail: '{}' },
      { kind: 'text', at: at(8), text: '（还在整理）' },
      { kind: 'tool', at: at(9), name: 'deliver', detail: '{}' },
      { kind: 'text', at: at(12), text: '整理好了，见上。' },
    ],
    deliverables: [{ id: 'd1', title: '一页介绍', markdown: '# 一页介绍', createdAt: at(10) }],
    verification: { passed: true, checked: 4, issues: 0, notes: '核对了四处。' },
  })
  const th = threadOf(r)
  assert.deepEqual(kinds(th), ['user', 'deliver'])
  assert.equal(th[0].text, '把 README 整理成一页')
  assert.equal(th[1].d.id, 'd1')
  assert.deepEqual(th[1].ds.map((d) => d.id), ['d1'])
  assert.equal(th[1].verify.kind, 'passed')
  assert.equal(th[1].text, '整理好了，见上。')
  assert.equal(th[1].at, at(12))
  // No reply after the file: the bubble has no text (the client quotes the excerpt).
  const quiet = threadOf(run({ deliverables: [{ id: 'd1', createdAt: at(10) }], activity: [{ kind: 'text', at: at(5), text: '先看看' }] }))
  assert.deepEqual(kinds(quiet), ['user', 'deliver'])
  assert.equal(quiet[1].text, '')
  assert.ok(!th.some((e) => e.kind === 'text' && /先看看|还在整理/.test(e.text)))
})

test('a run with no deliverable renders only its final text; a steer opens a new segment with its own bubble', () => {
  const r = run({
    activity: [
      { kind: 'text', at: at(3), text: '第一句' },
      { kind: 'text', at: at(6), text: '最终回答' },
      { kind: 'user', at: at(20), text: '再展开一点' },
      { kind: 'tool', at: at(21), name: 'web_search', detail: '{}' },
      { kind: 'text', at: at(25), text: '展开后的回答' },
    ],
  })
  const th = threadOf(r)
  assert.deepEqual(kinds(th), ['user', 'text', 'user', 'text'])
  assert.deepEqual(th.map((e) => e.text), ['把 README 整理成一页', '最终回答', '再展开一点', '展开后的回答'])
})

test('while running: a working line closes the run and the unfinished segment shows no text yet', () => {
  const r = run({ status: 'running', finishedAt: '', step: '查阅', activity: [{ kind: 'text', at: at(2), text: '我先看看' }] })
  const th = threadOf(r)
  assert.deepEqual(kinds(th), ['user', 'thinking'])
  assert.equal(th[1].step, '查阅')
  assert.equal(isLive(r), true)
  // A deliverable that lands mid-run shows; the working line stays last. Nothing verifies until the run is done, so
  // the meta line has no verification word yet.
  const mid = threadOf(run({ status: 'running', finishedAt: '', deliverables: [{ id: 'd1', createdAt: at(5) }] }))
  assert.deepEqual(kinds(mid), ['user', 'deliver', 'thinking'])
  assert.equal(mid[1].verify.kind, '')
})

test('a queued run (waiting behind a routine run) is one 排队 line, not a second working line', () => {
  // The server sends a queued run as status 'running' with queued: true.
  const q = run({ status: 'running', queued: true, finishedAt: '', step: '' })
  assert.equal(isQueued(q), true)
  assert.deepEqual(kinds(threadOf(q)), ['user', 'queued'])
  assert.deepEqual(kinds(threadOf(run({ status: 'queued', finishedAt: '' }))), ['user', 'queued'])
  assert.equal(isQueued(run({ status: 'running' })), false)
  assert.equal(isQueued(run({ status: 'done', queued: true })), false)
})

test('a stopped run ends on a neutral 已停止 entry, not a failure', () => {
  const th = threadOf(run({ error: '已停止。', activity: [{ kind: 'text', at: at(2), text: '开始' }] }))
  assert.deepEqual(kinds(th), ['user', 'text', 'stopped'])
  assert.equal(th[2].at, at(60))
  assert.ok(!th.some((e) => e.kind === 'failed'))
  assert.deepEqual(kinds(threadOf(run({ status: 'done', error: '已停止。', ask: null, activity: [{ kind: 'ask', id: 'q1', at: at(3), status: 'expired', question: '哪天？' }] }))), ['user', 'ask', 'stopped'])
  assert.equal(isStopped('已取消'), true)
  assert.equal(isStopped('超过最长运行时间。'), false)
})

test('a failed run ends with one failed entry', () => {
  const th = threadOf(run({ error: '超过最长运行时间。', activity: [{ kind: 'text', at: at(2), text: '开始' }] }))
  assert.deepEqual(kinds(th), ['user', 'text', 'failed'])
  assert.equal(th[2].reason, '超过最长运行时间。')
})

test('a migrated task whose activity was trimmed still shows the bubble, its deliverables, or its summary', () => {
  const th = threadOf(run({ deliverables: [{ id: 'd1', title: '周报', createdAt: at(40) }, { id: 'd0', title: '草稿', createdAt: at(30) }], verification: { passed: true, checked: 2, issues: 0 } }))
  assert.deepEqual(kinds(th), ['user', 'deliver'])
  assert.deepEqual(th[1].ds.map((d) => d.id), ['d0', 'd1'])
  assert.equal(th[1].d.id, 'd0')
  const answered = threadOf(run({ summary: '仓库有三个包。' }))
  assert.deepEqual(kinds(answered), ['user', 'text'])
  assert.equal(answered[1].text, '仓库有三个包。')
})

test('verification is read from the run, live, and runs in the background after done', () => {
  // Nothing verifies while the run works; after done the server flags verifying until the stamp lands.
  assert.equal(verifyState({ status: 'running', verification: null }).kind, '')
  assert.equal(verifyState({ status: 'running', verification: null, verifying: false }).kind, '')
  assert.equal(verifyState({ status: 'done', verification: null }).kind, '')
  assert.equal(verifyState({ status: 'done', verification: null, verifying: true }).kind, 'verifying')
  assert.equal(verifyState({ verifying: true, verification: { passed: true, checked: 1, issues: 0 } }).kind, 'verifying')
  assert.equal(threadOf(run({ verifying: true, deliverables: [{ id: 'd1', createdAt: at(10) }] }))[1].verify.kind, 'verifying')
  assert.equal(verifyState({ status: 'done', verification: { status: 'verifying' } }).kind, 'verifying')
  assert.equal(verifyState({ status: 'done', verification: { pending: true } }).kind, 'verifying')
  assert.deepEqual(verifyState({ status: 'done', verification: { passed: true, checked: 5, issues: 1, notes: 'n' } }), { kind: 'passed', checked: 5, issues: 1, notes: 'n' })
  assert.equal(verifyState({ status: 'done', verification: { passed: false, checked: 3, issues: 2 } }).kind, 'issues')
  assert.equal(verifyState({ status: 'done', verification: { passed: null, checked: 0, issues: 0, notes: '核验失败：超时' } }).kind, 'none')
  // A deliverable never reads 已核验 from its own stale copy: the run decides.
  const th = threadOf(run({ status: 'done', verification: { status: 'verifying' } }), [{ id: 'd1', createdAt: at(10), verification: { passed: true, checked: 9, issues: 0 } }])
  assert.equal(th[1].verify.kind, 'verifying')
})

// ---- triggers: routine, system ---------------------------------------------------------------------------------------

test('a routine run opens with its centred line and no bubble; its result is an ordinary reply', () => {
  const r = run({ trigger: 'routine', routineId: 'rt1', routineTitle: '每日日报', input: '写今天的日报', activity: [{ kind: 'text', at: at(30), text: '今天完成了三件事。' }] })
  const th = threadOf(r)
  assert.deepEqual(kinds(th), ['routine', 'text'])
  assert.equal(th[0].title, '每日日报')
  assert.equal(th[0].at, T0)
  assert.equal(th[0].routineId, 'rt1')
  assert.ok(!th.some((e) => e.kind === 'user'))
})

test('the hidden intro run (trigger system) shows no user line, only what the teammate said', () => {
  const r = run({ trigger: 'system', input: '介绍一下你理解的职责', activity: [
    { kind: 'tool', at: at(2), name: 'mywork_mate_update', detail: '{"name":"竞品哨兵"}' },
    { kind: 'text', at: at(5), text: '我是竞品哨兵，每天盯三家竞品的价格。' },
  ] })
  const th = threadOf(r)
  assert.deepEqual(kinds(th), ['text'])
  assert.match(th[0].text, /竞品哨兵/)
  // …but a message that steered it while it worked is still your bubble.
  const steered = threadOf(run({ trigger: 'system', status: 'running', finishedAt: '', activity: [{ kind: 'user', at: at(3), text: '价格变动超过 5% 才说' }] }))
  assert.deepEqual(kinds(steered), ['user', 'thinking'])
})

test('mywork_routine_create lands as a 已安排 line at its time, and it is not narration', () => {
  const r = run({ activity: [
    { kind: 'text', at: at(2), text: '好的，我来安排。' },
    { kind: 'tool', at: at(3), name: 'mywork_routine_create', detail: '{}' },
    { kind: 'routine', action: 'created', routineId: 'rt9', title: '写日报', scheduleLabel: '每天 19:00', at: at(4) },
    { kind: 'text', at: at(6), text: '已安排，每天 19:00 给你日报。' },
  ] })
  const th = threadOf(r)
  assert.deepEqual(kinds(th), ['user', 'scheduled', 'text'])
  assert.deepEqual({ id: th[1].routineId, title: th[1].title, label: th[1].scheduleLabel }, { id: 'rt9', title: '写日报', label: '每天 19:00' })
  assert.equal(th[2].text, '已安排，每天 19:00 给你日报。')
})

test('a reminder: a remind entry inside a run is a card; a synthetic remind run is only the card', () => {
  const inRun = threadOf(run({ trigger: 'routine', routineTitle: '喝水', activity: [{ kind: 'remind', routineId: 'rt2', title: '喝水', at: at(1) }] }))
  assert.deepEqual(kinds(inRun), ['routine', 'remind'])
  assert.deepEqual({ id: inRun[1].routineId, title: inRun[1].title, acked: inRun[1].acked }, { id: 'rt2', title: '喝水', acked: false })
  const synthetic = run({ kind: 'remind', trigger: 'routine', routineId: 'rt2', routineTitle: '喝水', status: 'done', acked: true })
  assert.ok(remindOf(synthetic))
  const th = threadOf(synthetic)
  assert.deepEqual(kinds(th), ['remind'])
  assert.equal(th[0].acked, true)
  assert.equal(th[0].at, T0)
  // Also as { remind: { routineId, title, at } } on the run.
  assert.equal(threadOf(run({ remind: { routineId: 'rt3', title: '交房租', at: at(9) } }))[0].title, '交房租')
  assert.equal(remindOf(run()), null)
})

// ---- 找人: questions in the thread -----------------------------------------------------------------------------------
const ask = (s, over) => ({ kind: 'ask', id: 'ask-' + s, at: at(s), status: 'pending', question: '发给谁？', askKind: 'text', ...over })

test('a waiting run ends on its open question: no working line, the narration before it stays in 过程', () => {
  const r = run({ status: 'waiting', finishedAt: '', activity: [
    { kind: 'text', at: at(2), text: '我需要确认收件人。' },
    { kind: 'tool', at: at(3), name: 'mywork_ask', detail: '{}' },
    ask(4, { askKind: 'choice', options: ['王总', '李总'], detail: '正文' }),
  ] })
  const th = threadOf(r)
  assert.deepEqual(kinds(th), ['user', 'ask'])
  const q = th[1]
  assert.equal(q.status, 'pending')
  assert.equal(q.answerable, true)
  assert.deepEqual(q.options, ['王总', '李总'])
  assert.equal(q.detail, '正文')
  assert.ok(!th.some((e) => e.kind === 'text' || e.kind === 'thinking'))
  assert.equal(isLive(r), false)
})

test('the answer line is not a bubble: the question shows the answer and the run goes on', () => {
  const activity = [
    { kind: 'text', at: at(2), text: '我需要确认收件人。' },
    ask(4, { status: 'answered', answer: '王总', answeredAt: at(20) }),
    { kind: 'user', at: at(20), text: '王总', askId: 'ask-4' },
  ]
  const running = threadOf(run({ status: 'running', finishedAt: '', step: '发送', activity }))
  assert.deepEqual(kinds(running), ['user', 'ask', 'thinking'])
  assert.equal(running[1].answer, '王总')
  assert.equal(running[1].answerable, false)
  const done = threadOf(run({ activity: activity.concat([{ kind: 'text', at: at(30), text: '已写好，见上。' }]), deliverables: [{ id: 'd1', createdAt: at(25) }] }))
  assert.deepEqual(kinds(done), ['user', 'ask', 'deliver'])
  assert.equal(done[2].text, '已写好，见上。')
  assert.ok(!done.some((e) => e.kind === 'user' && e.text === '王总'))
})

test('only the newest pending question is answerable; older ones read as no longer waiting', () => {
  const r = run({ status: 'waiting', finishedAt: '', activity: [
    ask(3, { status: 'superseded' }),
    { kind: 'ask', id: 'ask-legacy', at: at(6), question: '旧的', askKind: 'text' },
    ask(8, { question: '新的' }),
  ] })
  const qs = threadOf(r).filter((e) => e.kind === 'ask')
  assert.deepEqual(qs.map((q) => q.status), ['superseded', 'superseded', 'pending'])
  assert.deepEqual(qs.map((q) => q.answerable), [false, false, true])
})

test('the 24 h resume is one muted line after the expired question, and the reply follows', () => {
  const th = threadOf(run({ activity: [
    ask(4, { status: 'expired' }),
    { kind: 'user', at: at(86410), text: '用户 24 小时没有回答…', auto: true, askId: 'ask-4' },
    { kind: 'text', at: at(86420), text: '按王总处理，已发送。' },
  ] }))
  assert.deepEqual(kinds(th), ['user', 'ask', 'auto', 'text'])
})

// ---- the thread as a whole -------------------------------------------------------------------------------------------

test('mergeRuns: a newer copy replaces, older pages join, ascending by createdAt', () => {
  const a = run({ id: 'a', createdAt: at(10), status: 'running' })
  const b = run({ id: 'b', createdAt: at(20) })
  const older = run({ id: 'o', createdAt: at(1) })
  const merged = mergeRuns([a, b], [older, { ...a, status: 'done' }])
  assert.deepEqual(merged.map((r) => r.id), ['o', 'a', 'b'])
  assert.equal(merged[1].status, 'done')
})

test('activeRun and textAskOf: the dock answers only a text question the newest run waits on', () => {
  const done = run({ id: 'a', createdAt: at(1) })
  const waiting = run({ id: 'b', createdAt: at(2), status: 'waiting', ask: { id: 'q1', askKind: 'text', question: '哪个时间段？' } })
  assert.equal(activeRun([done]), null)
  assert.equal(activeRun([done, waiting]).id, 'b')
  // A message queued behind a routine run: the routine run is the one working (电脑 and the ring follow it).
  const routine = run({ id: 'rt', createdAt: at(3), trigger: 'routine', status: 'running' })
  const queued = run({ id: 'q', createdAt: at(4), status: 'running', queued: true })
  assert.equal(activeRun([done, routine, queued]).id, 'rt')
  assert.equal(activeRun([done, waiting, queued]).id, 'b')
  assert.equal(activeRun([done, queued]).id, 'q')
  assert.equal(textAskOf([done, waiting]).id, 'q1')
  assert.equal(textAskOf([done, { ...waiting, ask: { id: 'q2', askKind: 'choice' } }]), null)
  assert.equal(textAskOf([waiting, done]), null)
  assert.equal(textAskOf([]), null)
})

test('mateOrder: pinned first (MyWork pinned by default), the rest by lastAt; state never moves a row', () => {
  const mates = [
    { id: 'x', name: '周报', lastAt: at(50), state: 'idle' },
    { id: 'mw', name: 'MyWork', isDefault: true, lastAt: at(1), state: 'idle' },
    { id: 'y', name: '竞品', lastAt: at(90), state: 'working' },
    { id: 'p', name: '置顶', pinned: true, lastAt: at(2), state: 'idle' },
    { id: 'z', name: '旧的', lastAt: at(10), state: 'waiting' },
  ]
  assert.deepEqual(mateOrder(mates).map((m) => m.id), ['mw', 'p', 'y', 'x', 'z'])
  // The same data with different states orders the same.
  assert.deepEqual(mateOrder(mates.map((m) => ({ ...m, state: 'idle' }))).map((m) => m.id), ['mw', 'p', 'y', 'x', 'z'])
  // Unpinning MyWork puts it back among the rest.
  assert.deepEqual(mateOrder(mates.map((m) => (m.isDefault ? { ...m, pinned: false } : m))).map((m) => m.id), ['p', 'y', 'x', 'z', 'mw'])
})

test('routineRunKind and initialOf', () => {
  assert.equal(routineRunKind({ at: at(1), taskId: 'r', changed: true, settledAt: at(9) }), 'result')
  assert.equal(routineRunKind({ at: at(1), taskId: 'r', changed: null, settledAt: at(9) }), 'result')
  // A receipt not settled yet ({ at, taskId }) is a run still going.
  assert.equal(routineRunKind({ at: at(1), taskId: 'r' }), 'running')
  assert.equal(routineRunKind({ at: at(1), fired: true, runId: 'r' }), 'fired')
  assert.equal(routineRunKind({ changed: false }), 'quiet')
  assert.equal(routineRunKind({ quiet: true }), 'quiet')
  assert.equal(routineRunKind({ error: 'x' }), 'failed')
  assert.equal(routineRunKind({ fired: true }), 'fired')
  assert.equal(initialOf('竞品哨兵'), '竞')
  assert.equal(initialOf('mywork'), 'M')
  assert.equal(initialOf(''), '·')
})

test('foldedRunIds: migrated runs and finished runs older than the newest five fold; live runs never do', () => {
  const runs = Array.from({ length: 8 }, (_, i) => ({ id: 'r' + i, status: 'done', migrated: i === 6 }))
  runs.push({ id: 'live', status: 'running' })
  const f = foldedRunIds(runs, 5)
  assert.deepEqual([...f].sort(), ['r0', 'r1', 'r2', 'r6'])
})

test('openKindOf: every folder file opens — text read in place, images shown, HTML / PDF in the live browser, the rest downloaded', () => {
  for (const n of ['日程表.CSV', 'a.tsv', 'n.md', 'x.txt', 'x.json']) { assert.ok(fileKindOf(n)); assert.equal(openKindOf(n), 'text') }
  for (const n of ['radar.png', 'a.JPG', 'b.jpeg', 'c.gif', 'd/e.webp']) assert.equal(openKindOf(n), 'image')
  for (const n of ['report.html', 'old.HTM', 'paper.pdf']) assert.equal(openKindOf(n), 'page')
  for (const n of ['plan.docx', 'sheet.xlsx', 'deck.pptx', 'archive.zip', 'Makefile', '', 'x.svg']) assert.equal(openKindOf(n), 'download')
})
