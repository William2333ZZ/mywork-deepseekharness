/**
 * 找人 (design/v2/TEAMMATES.md §2.7): a task may stop to ask, at the end of its turn, and resume when answered.
 *
 * The engine runs against a fake dsh host: agents.create() yields a scripted agent whose turn runs when the engine hands
 * it the prompt (followup); the script drives engine.onSessionEvent the way the real session/event stream would and calls
 * engine.ask / engine.deliver the way the tools do. The session controller's prompt() (follow-ups on finished or waiting
 * tasks) runs the next script on the next tick, after say() has returned. Scripts are consumed in FIFO order, one per turn.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  ACTIVITY_THREAD_MAX, ASK_DETAIL_MAX, ASK_EXPIRY_MS, ASK_MAX_PER_TASK, ASK_QUESTION_MAX, STATUSES, STATUS_LABELS,
  capActivity, DeliverableStore, pendingAsk, TaskStore, taskView,
} from '../src/store.js'
import { BUILTIN_SCENARIOS, createScenarioRegistry, stepNameFor } from '../src/scenarios.js'
import { APPROVAL_OPTIONS, ASK_TEXT, answerText, createEngine, normalizeAsk, TAKEOVER_OPTIONS } from '../src/engine.js'

const ev = (session, engine, type, data) => engine.onSessionEvent(session, { type, data })
const toolCall = (s, e, name, args) => ev(s, e, 'tool/call', { name, arguments: args || {} })
const said = (s, e, text) => ev(s, e, 'assistant/message', { message: { content: [{ type: 'text', text }] } })
const ended = (s, e, kind = 'completed') => ev(s, e, 'turn/end', { reason: { kind } })
/** Poll until fn() is true; a script that threw inside a turn fails the test at once instead of timing out. */
const until = async (fn, ms = 3000, h) => { const t0 = Date.now(); while (!fn()) { if (h && h.scriptErrors.length) throw h.scriptErrors[0]; if (Date.now() - t0 > ms) throw new Error('timed out waiting for the engine'); await new Promise((r) => setTimeout(r, 5)) } }
const iso = (msAgo) => new Date(Date.now() - msAgo).toISOString()

function harness({ concurrency = 2, verify = false, timeoutMs = 5000 } = {}) {
  const cwd = mkdtempSync(join(tmpdir(), 'mywork-ask-'))
  const store = new TaskStore(null)
  const deliverables = new DeliverableStore(null)
  const scenarios = createScenarioRegistry()
  for (const s of BUILTIN_SCENARIOS) scenarios.register(s)
  const events = []; const logs = []; const sessions = []; const scripts = []
  const nextScript = () => (scripts.length ? scripts.shift() : () => {})
  const sessionOf = (id) => ({ id, append() {} })
  const h = { store, deliverables, scenarios, events, logs, sessions, scripts, scriptErrors: [], promptFails: false, engine: null, cleanup: () => rmSync(cwd, { recursive: true, force: true }) }
  h.until = (fn, ms) => until(fn, ms, h)
  const runScript = (script, session) => { try { return script(session, h.engine) } catch (e) { h.scriptErrors.push(e); throw e } }
  const ctx = {
    workspaceRegistry: { resolveByPath: async (p) => ({ path: p, attachSession: async () => {} }), create: (p) => ({ path: p, attachSession: async () => {} }) },
    agents: {
      withoutInitiator: (fn) => fn(),
      async create({ sessionId, setup }) {
        sessions.push(sessionId)
        const session = sessionOf(sessionId)
        let turn = Promise.resolve()
        const agent = { session, followup() { const script = nextScript(); turn = Promise.resolve().then(() => runScript(script, session)) }, whenIdle() { return turn }, cancel() {} }
        await setup({}, agent)
        return { agent, dispose() {} }
      },
    },
    agentPresets: { mount: async () => {} },
    permissionPresets: { set() {} },
    agentDefaultModel: { currentSelection: () => ({ provider: 'p', model: 'm' }) },
    sessions: { flush: async () => {} },
    get() { return null },
  }
  const controller = { async prompt({ sessionId }) { if (h.promptFails) throw new Error('controller down'); const script = nextScript(); setImmediate(() => { try { runScript(script, sessionOf(sessionId)) } catch {} }) } }
  h.engine = createEngine({
    ctx, store, deliverables, scenarios, log: (m) => logs.push(m), emit: (kind, task) => events.push({ kind, id: task && task.id, status: task && task.status }),
    controller: () => controller, capabilities: () => ({}),
    config: { concurrency, timeoutMs, permission: 'workspace-write', agentPreset: 'standard', cwd, verify },
  })
  return h
}

test('status waiting exists, labelled 等你答, ordered before done; mywork_ask is the 提问 step', () => {
  assert.ok(STATUSES.includes('waiting')); assert.equal(STATUS_LABELS.waiting, '等你答')
  assert.ok(STATUSES.indexOf('running') < STATUSES.indexOf('waiting')); assert.ok(STATUSES.indexOf('waiting') < STATUSES.indexOf('done'))
  const s = new TaskStore(null); const t = s.create({ input: 'x' })
  assert.equal(s.setStatus(t.id, 'waiting').status, 'waiting')
  assert.equal(stepNameFor('mywork_ask'), '提问')
})

test('a turn that ends on a question parks the task as waiting: no verification, no failure, slot freed, view.ask shaped', async () => {
  const h = harness({ concurrency: 1, verify: true })
  const a = h.store.create({ input: '给客户发邮件' })
  const b = h.store.create({ input: '第二件事' })
  let asked
  h.scripts.push((s, e) => {
    toolCall(s, e, 'deliver'); e.deliver(s.id, { title: '草稿', markdown: '正文' })
    toolCall(s, e, 'mywork_ask')
    asked = e.ask(s.id, { question: '发给谁？', detail: '  邮件正文  ' })
    said(s, e, '我需要知道收件人。'); ended(s, e)
  })
  h.scripts.push((s, e) => { said(s, e, '做完了'); ended(s, e) })
  h.engine.pump()
  await h.until(() => h.store.get(a.id).status === 'waiting')
  const ta = h.store.get(a.id)
  assert.equal(asked.status, 'pending'); assert.equal(asked.askKind, 'text'); assert.ok(asked.id.startsWith('ask-')); assert.ok(asked.at); assert.equal(asked.detail, '邮件正文')
  assert.equal(ta.error, ''); assert.equal(ta.finishedAt, ''); assert.equal(ta.sessionId, 'mywork-task-' + a.id); assert.equal(ta.verifyFrom, 0)
  assert.ok(!h.sessions.some((id) => id.startsWith('mywork-verify-')), 'no verification session while waiting')
  assert.ok(h.events.some((x) => x.kind === 'waiting' && x.id === a.id && x.status === 'waiting'))
  assert.ok(!h.events.some((x) => x.kind === 'done' && x.id === a.id))
  assert.equal(h.engine.isLive(a.id), false)
  await h.until(() => h.store.get(b.id).status === 'done') // concurrency 1: b could only start because a's slot was freed
  assert.equal(h.store.get(b.id).error, '')
  const v = taskView(h.store.get(a.id), h.deliverables)
  assert.deepEqual(Object.keys(v.ask), ['id', 'at', 'question', 'askKind', 'options', 'detail'])
  assert.deepEqual(v.ask, { id: asked.id, at: asked.at, question: '发给谁？', askKind: 'text', options: [], detail: '邮件正文' })
  assert.equal(v.statusLabel, '等你答'); assert.equal(v.preview, '发给谁？'); assert.equal(v.attentionAt, asked.at)
  assert.equal(taskView(h.store.get(b.id), h.deliverables).ask, null)
  h.cleanup()
})

test('/answer marks the ask answered and resumes the task in its session; the pre-ask deliverable is verified at the end', async () => {
  const h = harness({ verify: true })
  const a = h.store.create({ input: '给客户发邮件' })
  h.scripts.push((s, e) => { toolCall(s, e, 'deliver'); e.deliver(s.id, { title: '草稿', markdown: '正文' }); e.ask(s.id, { question: '发给谁？' }); ended(s, e) })
  h.engine.pump()
  await h.until(() => h.store.get(a.id).status === 'waiting')
  const askId = pendingAsk(h.store.get(a.id)).id
  h.scripts.push((s, e) => { said(s, e, '已发给张三。'); ended(s, e) })
  h.scripts.push((s, e) => { said(s, e, '{"passed": true, "checked": 2, "issues": 0, "notes": "ok"}') })
  const resumed = await h.engine.answer(a.id, askId, '张三')
  assert.equal(resumed.status, 'running')
  const entry = resumed.activity.find((x) => x.kind === 'ask')
  assert.equal(entry.status, 'answered'); assert.equal(entry.answer, '张三'); assert.ok(entry.answeredAt)
  const line = resumed.activity[resumed.activity.length - 1]
  assert.deepEqual([line.kind, line.text, line.askId], ['user', '回答：张三', askId])
  assert.equal(taskView(resumed, h.deliverables).ask, null)
  await h.until(() => h.store.get(a.id).status === 'done')
  const done = h.store.get(a.id)
  assert.equal(done.error, ''); assert.equal(done.verification.passed, true)
  assert.ok(h.sessions.some((id) => id.startsWith('mywork-verify-' + a.id)), 'the deliverable made before the question was verified once the task finished')
  // started · step (the deliver tool call) · deliverable · step (the ask) · waiting · started (resume) · verifying · done
  assert.deepEqual(h.events.filter((x) => x.id === a.id).map((x) => x.kind), ['started', 'step', 'deliverable', 'step', 'waiting', 'started', 'verifying', 'done'])
  h.cleanup()
})

test('a task may ask twice: the second supersedes the first, the third is refused; the question is hard-trimmed', async () => {
  const h = harness()
  const a = h.store.create({ input: 'x' })
  let third
  h.scripts.push((s, e) => {
    const first = e.ask(s.id, { question: '第一个问题' + '很长'.repeat(80) })
    assert.equal(first.question.length, ASK_QUESTION_MAX)
    const second = e.ask(s.id, { question: '要哪个？', askKind: 'choice', options: [' A ', 'B', 'A', '这个选项超过十二个字了吧一定是'] })
    assert.deepEqual(second.options, ['A', 'B', '这个选项超过十二个字了吧']) // trimmed, deduplicated, each clipped to 12 chars
    assert.equal(h.store.get(a.id).activity.find((x) => x.id === first.id).status, 'superseded')
    try { e.ask(s.id, { question: '第三个' }) } catch (err) { third = err.message }
    ended(s, e)
  })
  h.engine.pump()
  await h.until(() => h.store.get(a.id).status === 'waiting')
  assert.equal(third, ASK_TEXT.limit); assert.equal(ASK_MAX_PER_TASK, 2)
  assert.equal(h.store.askCount(a.id), 2)
  const v = taskView(h.store.get(a.id), h.deliverables)
  assert.equal(v.ask.question, '要哪个？'); assert.equal(v.ask.askKind, 'choice'); assert.deepEqual(v.ask.options, ['A', 'B', '这个选项超过十二个字了吧'])
  h.cleanup()
})

test('routine runs, the 今日 assistant and ask:false scenarios cannot ask; a failed turn expires its open question', async () => {
  const h = harness({ concurrency: 4 }) // all four start at once, in store order, so the scripts pair up with their tasks
  h.scenarios.register({ id: 'noask', label: 'x', compose: () => 'p', ask: false })
  const routine = h.store.create({ input: '简报', source: 'routine', routineId: 'r1' })
  const assistant = h.store.create({ input: '你好', scenario: 'assistant' })
  const noask = h.store.create({ input: 'x', scenario: 'noask' })
  const failing = h.store.create({ input: 'y' })
  const errors = {}
  const refuse = (id) => (s, e) => { try { e.ask(s.id, { question: '？' }) } catch (err) { errors[id] = err.message } said(s, e, '完成'); ended(s, e) }
  h.scripts.push(refuse(routine.id), refuse(assistant.id), refuse(noask.id), (s, e) => { e.ask(s.id, { question: '？' }); ended(s, e, 'error') })
  h.engine.pump()
  await h.until(() => [routine, assistant, noask, failing].every((t) => h.store.get(t.id).status === 'done'))
  assert.equal(errors[routine.id], ASK_TEXT.routine); assert.equal(errors[assistant.id], ASK_TEXT.assistant); assert.equal(errors[noask.id], ASK_TEXT.scenario)
  for (const t of [routine, assistant, noask]) assert.equal(h.store.get(t.id).error, '')
  const f = h.store.get(failing.id)
  assert.ok(f.error); assert.equal(f.activity.find((x) => x.kind === 'ask').status, 'expired'); assert.equal(taskView(f, h.deliverables).ask, null)
  assert.throws(() => h.engine.ask('mywork-task-nope', { question: '?' }), /不属于任何任务/)
  h.cleanup()
})

test('recover() after a restart keeps a waiting task waiting and fails only the ones that were mid-run', () => {
  const h = harness()
  const w = h.store.create({ input: 'w' }); h.store.update(w.id, { sessionId: 'mywork-task-' + w.id }); h.store.ask(w.id, { question: '哪个？', askKind: 'text' }); h.store.setStatus(w.id, 'waiting')
  const r = h.store.create({ input: 'r' }); h.store.setStatus(r.id, 'running')
  h.engine.recover()
  assert.equal(h.store.get(w.id).status, 'waiting'); assert.equal(pendingAsk(h.store.get(w.id)).status, 'pending')
  assert.equal(h.store.get(r.id).status, 'done'); assert.match(h.store.get(r.id).error, /重启/)
  h.cleanup()
})

test('cancel on a waiting task expires the question and ends the task as cancelled', () => {
  const h = harness()
  const w = h.store.create({ input: 'w' }); h.store.update(w.id, { sessionId: 'mywork-task-' + w.id }); h.store.ask(w.id, { question: '哪个？', askKind: 'approval', options: APPROVAL_OPTIONS }); h.store.setStatus(w.id, 'waiting')
  const t = h.engine.cancel(w.id)
  assert.equal(t.status, 'done'); assert.equal(t.error, '已取消。')
  assert.equal(t.activity.find((x) => x.kind === 'ask').status, 'expired'); assert.equal(taskView(t, h.deliverables).ask, null)
  assert.ok(h.events.some((x) => x.kind === 'done' && x.id === w.id))
  h.cleanup()
})

test('say() on a waiting task answers the pending question on the same path as /answer', async () => {
  const h = harness()
  const a = h.store.create({ input: 'x' })
  h.scripts.push((s, e) => { e.ask(s.id, { question: '发给谁？' }); ended(s, e) })
  h.engine.pump()
  await h.until(() => h.store.get(a.id).status === 'waiting')
  h.scripts.push((s, e) => { said(s, e, '好'); ended(s, e) })
  const t = await h.engine.say(a.id, '李四')
  assert.equal(t.status, 'running')
  const ask = t.activity.find((x) => x.kind === 'ask'); assert.equal(ask.status, 'answered'); assert.equal(ask.answer, '李四')
  assert.equal(t.activity[t.activity.length - 1].text, '回答：李四')
  await h.until(() => h.store.get(a.id).status === 'done')
  assert.equal(h.store.get(a.id).error, '')
  h.cleanup()
})

test('answer() refuses (400) when nothing is pending, the askId is stale or the answer is empty; a failed resume reopens the ask', async () => {
  const h = harness()
  const a = h.store.create({ input: 'x' })
  await assert.rejects(h.engine.answer(a.id, '', 'x'), (e) => e.status === 400 && /没有等着回答/.test(e.message))
  h.scripts.push((s, e) => { e.ask(s.id, { question: '要发吗？', askKind: 'approval' }); ended(s, e) })
  h.engine.pump()
  await h.until(() => h.store.get(a.id).status === 'waiting')
  const askId = pendingAsk(h.store.get(a.id)).id
  await assert.rejects(h.engine.answer(a.id, 'ask-stale', true), (e) => e.status === 400 && /不是当前的问题/.test(e.message))
  await assert.rejects(h.engine.answer(a.id, askId, ''), (e) => e.status === 400 && /不能为空/.test(e.message))
  assert.equal(h.store.get(a.id).status, 'waiting')
  h.promptFails = true
  await assert.rejects(h.engine.answer(a.id, askId, true), /没能把话送进会话/)
  const after = h.store.get(a.id)
  assert.equal(after.status, 'waiting'); assert.equal(pendingAsk(after).id, askId); assert.equal(pendingAsk(after).answer, undefined)
  h.promptFails = false
  h.scripts.push((s, e) => { said(s, e, '发了'); ended(s, e) })
  const t = await h.engine.answer(a.id, askId, true)
  assert.equal(t.activity.find((x) => x.kind === 'ask').answer, '允许'); assert.equal(t.activity[t.activity.length - 1].text, '回答：允许')
  await h.until(() => h.store.get(a.id).status === 'done')
  h.cleanup()
})

test('24 h without an answer: the ask expires and the task resumes on its own assumptions; younger asks are left alone', async () => {
  const h = harness()
  const old = h.store.create({ input: 'old' }); h.store.update(old.id, { sessionId: 'mywork-task-' + old.id }); h.store.ask(old.id, { question: '哪个？', askKind: 'takeover', options: TAKEOVER_OPTIONS }); h.store.setStatus(old.id, 'waiting')
  h.store.update(old.id, (t) => { t.activity.find((x) => x.kind === 'ask').at = iso(ASK_EXPIRY_MS + 60000) })
  const young = h.store.create({ input: 'young' }); h.store.update(young.id, { sessionId: 'mywork-task-' + young.id }); h.store.ask(young.id, { question: '哪个？' }); h.store.setStatus(young.id, 'waiting')
  h.scripts.push((s, e) => { said(s, e, '按假设做完了'); ended(s, e) })
  assert.deepEqual(await h.engine.expireAsks(), [old.id])
  const t = h.store.get(old.id)
  assert.equal(t.status, 'running'); assert.equal(t.activity.find((x) => x.kind === 'ask').status, 'expired')
  const line = t.activity[t.activity.length - 1]
  assert.equal(line.text, ASK_TEXT.expired); assert.equal(line.auto, true); assert.equal(line.kind, 'user')
  assert.equal(h.store.get(young.id).status, 'waiting'); assert.equal(pendingAsk(h.store.get(young.id)).status, 'pending')
  await h.until(() => h.store.get(old.id).status === 'done')
  assert.equal(h.store.get(old.id).error, '')
  assert.deepEqual(await h.engine.expireAsks(), [])
  h.cleanup()
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
