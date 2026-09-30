import { test } from 'node:test'
import assert from 'node:assert/strict'
import { threadOf, verifyState } from '../src/client/thread.cjs'

const T0 = '2026-09-30T09:00:00.000Z'
const at = (s) => new Date(new Date(T0).getTime() + s * 1000).toISOString()
const kinds = (list) => list.map((e) => e.kind)
const task = (over) => ({ id: 't1', input: '把 README 整理成一页', status: 'done', createdAt: T0, finishedAt: at(60), error: '', summary: '', activity: [], deliverables: [], verification: null, ...over })

test('text before a deliverable stays out of the thread, text after it is the reply', () => {
  const t = task({
    activity: [
      { kind: 'text', at: at(5), text: '我先看看仓库。' },
      { kind: 'tool', at: at(6), name: 'read_file', detail: '{}' },
      { kind: 'text', at: at(8), text: '（还在整理）' },
      { kind: 'tool', at: at(9), name: 'deliver', detail: '{}' },
      { kind: 'text', at: at(12), text: '整理好了，见上。' },
    ],
    verification: { passed: true, checked: 4, issues: 0, notes: '核对了四处。' },
  })
  const docs = [{ id: 'd1', title: '一页介绍', markdown: '# 一页介绍', createdAt: at(10) }]
  const th = threadOf(t, docs)
  assert.deepEqual(kinds(th), ['user', 'deliver', 'text'])
  assert.equal(th[0].text, '把 README 整理成一页')
  assert.equal(th[1].d.id, 'd1')
  assert.equal(th[2].text, '整理好了，见上。')
  assert.ok(!th.some((e) => e.kind === 'text' && /先看看|还在整理/.test(e.text)))
})

test('a run with no deliverable renders only its final text; follow-ups open new runs', () => {
  const t = task({
    activity: [
      { kind: 'text', at: at(3), text: '第一句' },
      { kind: 'text', at: at(6), text: '最终回答' },
      { kind: 'user', at: at(20), text: '再展开一点' },
      { kind: 'tool', at: at(21), name: 'web_search', detail: '{}' },
      { kind: 'text', at: at(25), text: '展开后的回答' },
    ],
  })
  const th = threadOf(t, [])
  assert.deepEqual(kinds(th), ['user', 'text', 'user', 'text'])
  assert.deepEqual(th.map((e) => e.text), ['把 README 整理成一页', '最终回答', '再展开一点', '展开后的回答'])
})

test('a follow-up that delivers puts the deliverable in its own run, after the earlier reply', () => {
  const t = task({
    activity: [
      { kind: 'text', at: at(6), text: '回答一' },
      { kind: 'user', at: at(20), text: '整理成文档' },
      { kind: 'text', at: at(22), text: '整理中…' },
      { kind: 'text', at: at(30), text: '已交付。' },
    ],
  })
  const docs = [{ id: 'd1', createdAt: at(28), markdown: 'x' }]
  const th = threadOf(t, docs)
  assert.deepEqual(kinds(th), ['user', 'text', 'user', 'deliver', 'text'])
  assert.equal(th[4].text, '已交付。')
})

test('while running: a thinking line closes the thread and the unfinished run shows no text yet', () => {
  const t = task({ status: 'running', finishedAt: '', currentStep: '查阅', statusLabel: '执行', activity: [{ kind: 'text', at: at(2), text: '我先看看' }] })
  const th = threadOf(t, [])
  assert.deepEqual(kinds(th), ['user', 'thinking'])
  assert.equal(th[1].step, '查阅')
  // After a deliverable lands mid-run, the deliverable shows and the thinking line stays last.
  const mid = threadOf(task({ status: 'delivering', finishedAt: '', statusLabel: '交付', activity: [{ kind: 'text', at: at(2), text: '我先看看' }] }), [{ id: 'd1', createdAt: at(5) }])
  assert.deepEqual(kinds(mid), ['user', 'deliver', 'thinking'])
  assert.equal(mid[1].verify.kind, 'verifying')
})

test('a failed task ends with one failed entry', () => {
  const th = threadOf(task({ error: '超过最长运行时间。', activity: [{ kind: 'text', at: at(2), text: '开始' }] }), [])
  assert.deepEqual(kinds(th), ['user', 'text', 'failed'])
  assert.equal(th[2].reason, '超过最长运行时间。')
})

test('old tasks whose activity was trimmed still show the bubble and their deliverables', () => {
  const t = task({ activity: [], deliverables: [{ id: 'd1', title: '周报', createdAt: at(40) }, { id: 'd0', title: '草稿', createdAt: at(30) }], verification: { passed: true, checked: 2, issues: 0 } })
  const th = threadOf(t, [])
  assert.deepEqual(kinds(th), ['user', 'deliver', 'deliver'])
  assert.deepEqual(th.slice(1).map((e) => e.d.id), ['d0', 'd1'])
  // Trimmed, answered, no deliverable: the summary is what is left of the answer.
  const answered = threadOf(task({ activity: [], summary: '仓库有三个包。' }), [])
  assert.deepEqual(kinds(answered), ['user', 'text'])
  assert.equal(answered[1].text, '仓库有三个包。')
})

test('verification states are read from the task, live', () => {
  assert.equal(verifyState({ status: 'verifying', verification: null }).kind, 'verifying')
  assert.equal(verifyState({ status: 'running', verification: null }).kind, 'verifying')
  assert.equal(verifyState({ status: 'done', verification: null }).kind, '')
  assert.deepEqual(verifyState({ status: 'done', verification: { passed: true, checked: 5, issues: 1, notes: 'n' } }), { kind: 'passed', checked: 5, issues: 1, notes: 'n' })
  assert.equal(verifyState({ status: 'done', verification: { passed: false, checked: 3, issues: 2 } }).kind, 'issues')
  assert.equal(verifyState({ status: 'done', verification: { passed: null, checked: 0, issues: 0, notes: '核验失败：超时' } }).kind, 'none')
  // A deliverable never reads 已核验 before the stamp: the stale copy on the deliverable is ignored.
  const t = task({ status: 'verifying', finishedAt: '', verification: null })
  const th = threadOf(t, [{ id: 'd1', createdAt: at(10), verification: { passed: true, checked: 9, issues: 0 } }])
  assert.equal(th[1].verify.kind, 'verifying')
  // Re-verifying a finished task: the old verdict gives way to 核验中.
  assert.equal(threadOf(task({ status: 'verifying', verification: { passed: true, checked: 1, issues: 0 } }), [{ id: 'd1', createdAt: at(10) }])[1].verify.kind, 'verifying')
})

// ---- 找人 (§2.7): questions in the thread ------------------------------------------------------------------------------
const ask = (s, over) => ({ kind: 'ask', id: 'ask-' + s, at: at(s), status: 'pending', question: '发给谁？', askKind: 'text', ...over })

test('a waiting task ends on its open question: no 在做 line, the narration before it stays in 过程', () => {
  const t = task({ status: 'waiting', finishedAt: '', statusLabel: '等你答', activity: [
    { kind: 'text', at: at(2), text: '我需要确认收件人。' },
    { kind: 'tool', at: at(3), name: 'mywork_ask', detail: '{}' },
    ask(4, { askKind: 'choice', options: ['王总', '李总'], detail: '正文' }),
  ] })
  const th = threadOf(t, [])
  assert.deepEqual(kinds(th), ['user', 'ask'])
  const q = th[1]
  assert.equal(q.status, 'pending')
  assert.equal(q.answerable, true)
  assert.equal(q.askKind, 'choice')
  assert.deepEqual(q.options, ['王总', '李总'])
  assert.equal(q.detail, '正文')
  assert.equal(q.id, 'ask-4')
  assert.ok(!th.some((e) => e.kind === 'text' || e.kind === 'thinking'))
})

test('the answer line is not a bubble: the question shows the answer and the run goes on', () => {
  const activity = [
    { kind: 'text', at: at(2), text: '我需要确认收件人。' },
    ask(4, { status: 'answered', answer: '王总', answeredAt: at(20) }),
    { kind: 'user', at: at(20), text: '回答：王总', askId: 'ask-4' },
  ]
  // Resumed and working: the question (answered), then the working line.
  const running = threadOf(task({ status: 'running', finishedAt: '', currentStep: '发送', activity }), [])
  assert.deepEqual(kinds(running), ['user', 'ask', 'thinking'])
  assert.equal(running[1].status, 'answered')
  assert.equal(running[1].answer, '王总')
  assert.equal(running[1].answerable, false)
  // Done with a deliverable after the answer: it stays in the same run, under the question, and the reply follows.
  const done = threadOf(task({ activity: activity.concat([{ kind: 'text', at: at(30), text: '已写好，见上。' }]) }), [{ id: 'd1', createdAt: at(25) }])
  assert.deepEqual(kinds(done), ['user', 'ask', 'deliver', 'text'])
  assert.equal(done[3].text, '已写好，见上。')
  assert.ok(!done.some((e) => e.kind === 'user' && /回答：/.test(e.text)))
  // Done without a deliverable: the final text after the question is the reply; the text before it is not.
  const answered = threadOf(task({ activity: activity.concat([{ kind: 'text', at: at(30), text: '发好了。' }]) }), [])
  assert.deepEqual(kinds(answered), ['user', 'ask', 'text'])
  assert.equal(answered[2].text, '发好了。')
})

test('a follow-up after an answered question still opens its own run', () => {
  const t = task({ activity: [
    ask(4, { status: 'answered', answer: '王总' }),
    { kind: 'user', at: at(10), text: '回答：王总', askId: 'ask-4' },
    { kind: 'text', at: at(15), text: '发好了。' },
    { kind: 'user', at: at(40), text: '再抄送李总' },
    { kind: 'text', at: at(45), text: '已抄送。' },
  ] })
  const th = threadOf(t, [])
  assert.deepEqual(kinds(th), ['user', 'ask', 'text', 'user', 'text'])
  assert.deepEqual(th.filter((e) => e.kind === 'user').map((e) => e.text), ['把 README 整理成一页', '再抄送李总'])
})

test('only the newest pending question is answerable; older ones read as no longer waiting', () => {
  const t = task({ status: 'waiting', finishedAt: '', activity: [
    ask(3, { status: 'superseded' }),
    { kind: 'text', at: at(5), text: '换个问法。' },
    { kind: 'ask', id: 'ask-legacy', at: at(6), question: '旧的', askKind: 'text' }, // legacy entry without a status: open
    ask(8, { question: '新的' }),
  ] })
  const qs = threadOf(t, []).filter((e) => e.kind === 'ask')
  assert.deepEqual(qs.map((q) => q.status), ['superseded', 'superseded', 'pending'])
  assert.deepEqual(qs.map((q) => q.answerable), [false, false, true])
  // A question just written while the turn is still ending (status not yet waiting) cannot be answered yet.
  const ending = threadOf(task({ status: 'running', finishedAt: '', activity: [ask(4)] }), [])
  assert.deepEqual(kinds(ending), ['user', 'ask', 'thinking'])
  assert.equal(ending[1].answerable, false)
})

test('the 24 h resume is one muted line after the expired question, and the reply follows', () => {
  const t = task({ activity: [
    ask(4, { status: 'expired' }),
    { kind: 'user', at: at(86410), text: '用户 24 小时没有回答，按合理假设继续，并在结果里写明假设', auto: true, askId: 'ask-4' },
    { kind: 'text', at: at(86420), text: '按王总处理，已发送。' },
  ] })
  const th = threadOf(t, [])
  assert.deepEqual(kinds(th), ['user', 'ask', 'auto', 'text'])
  assert.equal(th[1].status, 'expired')
  assert.equal(th[3].text, '按王总处理，已发送。')
  assert.ok(!th.some((e) => e.kind === 'user' && /24 小时/.test(e.text)))
})
