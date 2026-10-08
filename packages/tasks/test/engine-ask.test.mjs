/**
 * 找人 (design/v2/TEAMMATES.md §2.7): the pure parts — argument normalisation, answer words, the ask entry in the
 * activity stream, the verifier prompt. The flows (a run stops on a question, the answer continues it, the ≤2 rule,
 * routine / intro refusals, 24 h expiry, POST /answer) run against the fake dsh host in mates.test.mjs.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ACTIVITY_THREAD_MAX, ASK_DETAIL_MAX, ASK_KINDS, capActivity, pendingAsk, STATUSES, STATUS_LABELS, TaskStore } from '../src/store.js'
import { stepNameFor } from '../src/scenarios.js'
import { answerText, normalizeAsk } from '../src/engine.js'

test('status waiting exists, labelled 等你答, ordered before done; mywork_ask is the 提问 step', () => {
  assert.ok(STATUSES.includes('waiting')); assert.equal(STATUS_LABELS.waiting, '等你答')
  assert.ok(STATUSES.indexOf('running') < STATUSES.indexOf('waiting')); assert.ok(STATUSES.indexOf('waiting') < STATUSES.indexOf('done'))
  assert.deepEqual(ASK_KINDS, ['text', 'choice', 'approval', 'takeover'])
  const s = new TaskStore(null); const t = s.create({ input: 'x' })
  assert.equal(s.setStatus(t.id, 'waiting').status, 'waiting')
  assert.equal(stepNameFor('mywork_ask'), '提问'); assert.equal(stepNameFor('mywork_routine_create'), '安排例行'); assert.equal(stepNameFor('mywork_remember'), '记住')
})

test('store asks: a new ask supersedes the pending one; settle, reopen, count', () => {
  const s = new TaskStore(null); const t = s.create({ input: 'x' })
  const a = s.ask(t.id, { question: '一', askKind: 'text' })
  const b = s.ask(t.id, { question: '二', askKind: 'choice', options: ['A', 'B'] })
  assert.deepEqual(s.get(t.id).activity.map((x) => x.status), ['superseded', 'pending'])
  assert.equal(pendingAsk(s.get(t.id)).id, b.id); assert.equal(s.askCount(t.id), 2)
  assert.equal(s.settleAsk(t.id, 'answered', 'A').answer, 'A'); assert.equal(pendingAsk(s.get(t.id)), null)
  s.reopenAsk(t.id, b.id); assert.equal(pendingAsk(s.get(t.id)).id, b.id); assert.equal(pendingAsk(s.get(t.id)).answer, undefined)
  assert.ok(a.id.startsWith('ask-'))
})

test('normalizeAsk and answerText: kinds, fixed option sets, limits', () => {
  assert.deepEqual(normalizeAsk({ question: ' 发吗？ ' }), { question: '发吗？', askKind: 'text', options: [], detail: '' })
  assert.deepEqual(normalizeAsk({ question: '发吗？', askKind: 'approval', options: ['x'] }).options, ['允许一次', '拒绝'])
  assert.deepEqual(normalizeAsk({ question: '去登录', askKind: 'takeover' }).options, ['我做完了'])
  assert.equal(normalizeAsk({ question: 'q', detail: 'd'.repeat(ASK_DETAIL_MAX + 100) }).detail.length, ASK_DETAIL_MAX)
  assert.throws(() => normalizeAsk({ question: '' }), /question/)
  assert.throws(() => normalizeAsk({ question: 'q', askKind: 'poll' }), /askKind/)
  assert.throws(() => normalizeAsk({ question: 'q', askKind: 'choice', options: ['只有一个'] }), /2 到 4/)
  assert.throws(() => normalizeAsk({ question: 'q', askKind: 'choice', options: ['1', '2', '3', '4', '5'] }), /2 到 4/)
  assert.equal(answerText({ askKind: 'approval' }, true), '允许'); assert.equal(answerText({ askKind: 'approval' }, '允许一次'), '允许'); assert.equal(answerText({ askKind: 'approval' }, 'no'), '拒绝'); assert.equal(answerText({ askKind: 'approval' }, '先改一下措辞'), '先改一下措辞')
  assert.equal(answerText({ askKind: 'takeover' }, ''), '我做完了'); assert.equal(answerText({ askKind: 'takeover' }, '做完了，用的是备用账号'), '做完了，用的是备用账号')
  assert.equal(answerText({ askKind: 'choice' }, ' B '), 'B'); assert.equal(answerText({ askKind: 'text' }, null), '')
})

test('thread trimming never drops an ask entry; an ask keeps a 500-char detail', () => {
  const list = [{ kind: 'ask', id: 'ask-1', status: 'answered', at: 'a' }]
  for (let i = 0; i < ACTIVITY_THREAD_MAX + 20; i += 1) list.push({ kind: 'text', text: String(i), at: 'b' })
  capActivity(list)
  assert.equal(list.length, ACTIVITY_THREAD_MAX); assert.equal(list[0].id, 'ask-1')
  const s = new TaskStore(null); const t = s.create({ input: 'x' })
  s.activity(t.id, { kind: 'ask', id: 'ask-2', status: 'pending', question: 'q', askKind: 'text', detail: 'd'.repeat(ASK_DETAIL_MAX) })
  assert.equal(s.get(t.id).activity.find((x) => x.kind === 'ask').detail.length, ASK_DETAIL_MAX)
  for (let i = 0; i < 65; i += 1) { const x = s.create({ input: 'y' }); s.activity(x.id, { kind: 'text', text: 'hi' }); s.setStatus(x.id, 'done') }
  s.setStatus(t.id, 'done')
  assert.equal(s.get(t.id).activity.length, 1) // old done tasks keep the thread (the ask) and lose only tool calls
})

test('verifier prompt carries the user answers and follow-ups, later words win', async () => {
  const { defaultVerifyPrompt } = await import('../src/scenarios.js')
  const task = { input: '给房东写退租通知，写好后直接发给他' }
  const activity = [
    { kind: 'ask', status: 'answered', question: '房东联系方式？', answer: '只写草稿，不要发送' },
    { kind: 'user', text: '回答：只写草稿，不要发送', askId: 'ask-1' },
    { kind: 'user', text: '用户 24 小时没有回答，按合理假设继续', auto: true },
  ]
  const p = defaultVerifyPrompt(task, [{ title: '草稿', markdown: '正文' }], activity)
  assert.match(p, /## 用户后来补充的话/)
  assert.match(p, /用户答：只写草稿，不要发送/)
  assert.doesNotMatch(p, /24 小时没有回答/)
  const plain = defaultVerifyPrompt(task, [{ title: '草稿', markdown: '正文' }], [])
  assert.doesNotMatch(plain, /## 用户后来补充的话/)
})
