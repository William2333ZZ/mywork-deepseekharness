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
