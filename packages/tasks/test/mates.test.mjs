/**
 * The teammate model (design/v2/TEAMMATES.md §9) end to end against a fake dsh host.
 *
 * The fake host keeps dsh's inbox semantics: controller.prompt({ mode: 'queue' }) appends to the session's next-turn
 * inbox, mode 'steer' to next-step; one driver per session runs turns one after another, each turn claiming the
 * pending steers plus one queued message, emitting turn/start, user/message (source { kind: 'user', rpcId }) and, after
 * the turn's script, turn/end. Steers that arrive while a script runs are claimed into the same turn and run the next
 * script. controller.cancel aborts the running turn (reason 'aborted') and keeps the inbox. Scripts are consumed FIFO,
 * one per step; a script gets { texts, tool(name, args), say(text) } and may await a gate to hold the turn open.
 * controller.prompt ignores a request id already pending or claimed (dsh's hasPromptRequest); updateQueue removes an
 * inbox item; ctx.agents.get hands out the live agent (with its inbox); agentPresets.recompose is recorded.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createMyWork, mateComposition } from '../src/index.js'
import { ASK_TEXT, INTERRUPTED, messageText, NUDGE_TEXT, STOPPED } from '../src/engine.js'
import { ASK_EXPIRY_MS, pendingAsk } from '../src/store.js'

const STANDARD = new URL('../presets/mate-base/agent.cordis.yml', import.meta.url).pathname
const gate = () => { let open; const promise = new Promise((r) => { open = r }); return { promise, open } }

export function harness({ concurrency = 2, verify = false, home } = {}) {
  const dir = home || mkdtempSync(join(tmpdir(), 'mywork-mates-'))
  const sessions = new Map()
  const h = { dir, sessions, scripts: [], verdict: '{"passed": true, "checked": 2, "issues": 0, "notes": "ok"}', verifyGate: null, scriptErrors: [], logs: [], events: [], prompts: [], deduped: [], cancels: [], workspaces: [], created: [], recomposes: [], titles: [], removedItems: [], agents: new Map(), promptFails: false, mw: null }
  const ev = (s, type, data) => h.mw.engine.onSessionEvent({ id: s.id }, { type, data })
  const turnApi = (s, claimed) => ({
    session: { id: s.id },
    texts: claimed.map(messageText),
    say: (text) => ev(s, 'assistant/message', { message: { content: [{ type: 'text', text }] } }),
    tool(name, args = {}) {
      ev(s, 'tool/call', { name, arguments: args })
      const def = h.mw.tools.find((t) => t.name === name)
      let out
      try { out = def ? def.execute(args, { agent: { session: { id: s.id } } }) : { ok: true } } catch (e) { out = { error: e.message } }
      ev(s, 'tool/result', { error: out && out.error ? out.error : undefined, message: { content: [{ type: 'text', text: JSON.stringify(out) }] } })
      return out
    },
  })
  function wake(s) {
    if (s.running) return
    s.running = true
    s.idle = (async () => {
      await new Promise((r) => setImmediate(r)) // the caller's prompt() returns first, as in dsh
      while (s.nextTurn.length || s.nextStep.length) {
        s.turn += 1
        const turn = s.turn
        ev(s, 'turn/start', { turn })
        let claimed = [...s.nextStep.splice(0), ...s.nextTurn.splice(0, 1)]
        for (const m of claimed) s.log.push(m)
        let reason = { kind: 'completed' }
        let abort
        const aborted = new Promise((r) => { abort = r })
        s.abort = abort
        try {
          while (claimed.length) {
            for (const m of claimed) ev(s, 'user/message', m)
            const script = s.verify ? async (t) => { if (h.verifyGate) await h.verifyGate.promise; t.say(h.verdict) } : (h.scripts.shift() || ((t) => t.say('好的')))
            const outcome = await Promise.race([Promise.resolve().then(() => script(turnApi(s, claimed))).then(() => 'ok'), aborted.then(() => 'aborted')])
            if (outcome === 'aborted') { reason = { kind: 'aborted', reason: { kind: 'user' } }; break }
            claimed = s.nextStep.splice(0) // steers claimed at the step boundary continue the same turn
            for (const m of claimed) s.log.push(m)
          }
        } catch (e) { h.scriptErrors.push(e); reason = { kind: 'error', error: { message: e.message } } }
        s.abort = null
        ev(s, 'turn/end', { turn, reason })
      }
      s.running = false
    })()
  }
  const session = (id) => {
    const s = { id, nextTurn: [], nextStep: [], log: [], running: false, turn: 0, abort: null, idle: Promise.resolve(), verify: id.startsWith('mywork-verify-') }
    sessions.set(id, s)
    return s
  }
  const ctx = {
    workspaceRegistry: {
      resolveByPath: async (p) => { const w = h.workspaces.find((x) => x.path === p); return w ? { path: p, attachSession: async () => {}, setTitle: async (t) => { w.name = t; h.titles.push([p, t]) } } : null },
      create: async (p, name) => { h.workspaces.push({ path: p, name }); return { path: p, attachSession: async () => {} } },
    },
    agents: {
      withoutInitiator: (fn) => fn(),
      get: (sessionId) => h.agents.get(sessionId),
      async create({ sessionId, meta, setup }) {
        if (sessions.has(sessionId)) throw new Error(`session ${sessionId} already exists`)
        const s = session(sessionId)
        h.created.push({ sessionId, meta })
        const agent = {
          ctx: { sessionId },
          inbox: { get nextTurn() { return s.nextTurn }, get nextStep() { return s.nextStep } },
          session: { id: sessionId, append() {} },
          followup(m) { s.nextTurn.push(m); wake(s) },
          steer(m) { s.nextStep.push(m); wake(s) },
          whenIdle: () => s.idle,
          cancel(_cause, opts) { if (!(opts && opts.keepInbox)) { s.nextTurn.length = 0; s.nextStep.length = 0 } if (s.abort) s.abort() },
        }
        await setup({}, agent)
        if (!s.verify) h.agents.set(sessionId, agent)
        return { agent, dispose() {} }
      },
    },
    agentPresets: { mount: async () => {}, resolve: async (id) => (id === 'standard' ? { id, path: STANDARD } : { id }), recompose: async (agentCtx, id) => { h.recomposes.push([agentCtx.sessionId, id]); return { id } } },
    permissionPresets: { set() {} },
    agentDefaultModel: { currentSelection: () => ({ provider: 'p', model: 'm' }) },
    sessions: { flush: async () => {} },
    get() { return null },
  }
  const controller = {
    async prompt({ requestId, sessionId, mode, content }) {
      if (h.promptFails) throw new Error('controller down')
      const s = sessions.get(sessionId)
      if (!s) throw Object.assign(new Error(`session "${sessionId}" not found`), { code: 'session/not-found' })
      const pending = (m) => m.source && m.source.rpcId === requestId
      if (s.nextTurn.some(pending) || s.nextStep.some(pending) || s.log.some(pending)) { h.deduped.push(requestId); return { accepted: true } }
      h.prompts.push({ requestId, sessionId, mode, text: content[0].text })
      const m = { id: requestId, role: 'user', content, source: { kind: 'user', rpcId: requestId } }
      if (mode === 'steer') s.nextStep.push(m); else s.nextTurn.push(m)
      wake(s)
      return { accepted: true }
    },
    async updateQueue({ sessionId, itemId, action }) {
      const s = sessions.get(sessionId)
      const i = s ? s.nextTurn.findIndex((m) => m.id === itemId) : -1
      if (i < 0) throw Object.assign(new Error('queued item is no longer pending'), { code: 'session/queue-item-not-found' })
      if (action.kind === 'remove') { s.nextTurn.splice(i, 1); h.removedItems.push(itemId) }
      return { accepted: true }
    },
    cancel({ sessionId }) {
      const s = sessions.get(sessionId)
      if (!s) throw Object.assign(new Error('not found'), { code: 'session/not-found' })
      h.cancels.push(sessionId)
      if (s.abort) s.abort()
      return { accepted: true }
    },
  }
  h.controller = controller
  h.ctx = ctx
  h.mw = createMyWork({ ctx, config: { concurrency, verify, timeoutMinutes: 1 }, home: dir, log: (m) => h.logs.push(m), controller: () => controller, hostEmit: (p) => h.events.push(p) })
  h.until = async (fn, ms = 3000) => { const t0 = Date.now(); while (!fn()) { if (h.scriptErrors.length) throw h.scriptErrors[0]; if (Date.now() - t0 > ms) throw new Error('timed out waiting for the engine'); await new Promise((r) => setTimeout(r, 5)) } }
  h.call = async (method, path, a) => { const out = await h.mw.handle(method, path, method === 'GET' ? a : undefined, method === 'POST' ? a : undefined); return out }
  h.ok = async (method, path, a) => { const out = await h.call(method, path, a); assert.equal(out.status, 200, JSON.stringify(out.body)); return out.body }
  h.run = (id) => h.mw.store.get(id)
  h.runsOf = (mateId) => h.mw.store.forMate(mateId)
  h.cleanup = () => rmSync(dir, { recursive: true, force: true })
  return h
}

test('first start: the default teammate MyWork exists, pinned, with its folder and no session yet', async () => {
  const h = harness()
  const { items } = await h.ok('GET', '/mates')
  assert.equal(items.length, 1)
  const m = items[0]
  assert.deepEqual([m.id, m.name, m.glyph, m.isDefault, m.pinned, m.notify, m.state, m.unread, m.ask, m.routineCount], ['mywork', 'MyWork', 'M', true, true, true, 'idle', false, null, 0])
  assert.equal(m.dir, join(h.dir, 'mywork', 'mates', 'mywork'))
  assert.equal(h.mw.mates.get('mywork').sessionId, '')
  h.cleanup()
})

test('create teammate → hidden intro run: it names itself, sets up the timed duty, says hello; the intro line is not in the thread', async () => {
  const h = harness()
  h.scripts.push((t) => {
    assert.match(t.texts[0], /mywork_mate_update/); assert.match(t.texts[0], /mywork_routine_create/)
    t.tool('mywork_mate_update', { name: '周报员', title: '每周写周报' })
    t.tool('mywork_routine_create', { input: '每周五 17 点把大家这周做的事写成周报' })
    t.say('我是周报员。每周五 17 点我会把大家这周做的事写成周报，已经安排好了。')
  })
  const { mate } = await h.ok('POST', '/mates/create', { description: '每周五 17 点把大家这周做的事写成周报' })
  assert.equal(mate.name, '新同事'); assert.equal(mate.named, false); assert.equal(mate.state, 'working')
  await h.until(() => h.runsOf(mate.id).every((r) => r.status === 'done'))
  const sid = 'mywork-mate-' + mate.id
  assert.deepEqual(h.created.map((c) => c.sessionId), [sid])
  assert.equal(h.created[0].meta.cwd, join(h.dir, 'mywork', 'mates', mate.id)); assert.equal(h.created[0].meta.agentPreset, 'mate-' + mate.id)
  assert.deepEqual(h.workspaces.map((w) => w.path), [join(h.dir, 'mywork', 'mates', mate.id)])
  const preset = readFileSync(join(h.dir, '.agent-presets', 'mate-' + mate.id, 'agent.cordis.yml'), 'utf8')
  assert.match(preset, /你是「周报员」/); assert.match(preset, /头衔：每周写周报/); assert.match(preset, /每周五 17 点把大家这周做的事写成周报/)
  assert.match(preset, /- id: compaction/); assert.match(preset, /- id: agent-instructions/); assert.match(preset, /- id: present/); assert.match(preset, /- id: tool-fs\n/)
  assert.doesNotMatch(preset, /tool-ask-user/); assert.doesNotMatch(preset, /You are a coding agent/)
  const v = h.mw.mateView(mate.id)
  assert.deepEqual([v.name, v.glyph, v.title, v.state, v.routineCount, v.unread], ['周报员', '周', '每周写周报', 'idle', 1, true])
  assert.equal(v.preview, '我是周报员。每周五 17 点我会把大家这周做的事写成周报，已经安排好了。')
  const [routine] = (await h.ok('GET', '/routines', { mate: mate.id })).items
  assert.equal(routine.mateId, mate.id); assert.equal(routine.kind, 'task'); assert.equal(routine.scheduleLabel, '每周五 17:00')
  const { runs, nextBefore } = await h.ok('GET', '/mates/thread', { id: mate.id })
  assert.equal(nextBefore, null); assert.equal(runs.length, 1)
  const intro = runs[0]
  assert.equal(intro.trigger, 'system'); assert.equal(intro.input, ''); assert.equal(intro.status, 'done')
  const created = intro.activity.find((a) => a.kind === 'routine')
  assert.deepEqual({ ...created, at: '' }, { kind: 'routine', action: 'created', routineId: routine.id, title: routine.title, scheduleLabel: '每周五 17:00', at: '' })
  assert.equal(intro.activity.filter((a) => a.kind === 'text').length, 1)
  // Mates sort: pinned first (MyWork), then by last conversation.
  assert.deepEqual((await h.ok('GET', '/mates')).items.map((m) => m.id), ['mywork', mate.id])
  await h.ok('POST', '/seen', { id: mate.id })
  assert.equal(h.mw.mateView(mate.id).unread, false)
  h.cleanup()
})

test('say while idle opens a run; say while it works on a user run steers it (no second run)', async () => {
  const h = harness()
  const g = gate()
  h.scripts.push(async (t) => { assert.deepEqual(t.texts, ['写一份 README 简介']); t.tool('read_file', { path: 'README.md' }); await g.promise; t.say('初稿好了') })
  h.scripts.push((t) => { assert.deepEqual(t.texts, ['改成英文']); t.say('Done, in English.') })
  const first = await h.ok('POST', '/mates/say', { id: 'mywork', text: '写一份 README 简介' })
  assert.equal(first.mode, 'queue')
  await h.until(() => h.run(first.runId).status === 'running' && h.run(first.runId).steps.length === 1)
  let m = h.mw.mateView('mywork')
  assert.deepEqual([m.state, m.step, m.preview], ['working', '读取', '在干活 · 读取'])
  assert.ok(m.since)
  const second = await h.ok('POST', '/mates/say', { id: 'mywork', text: '改成英文' })
  assert.deepEqual([second.mode, second.runId], ['steer', first.runId])
  assert.equal(h.prompts[1].mode, 'steer')
  g.open()
  await h.until(() => h.run(first.runId).status === 'done')
  assert.equal(h.runsOf('mywork').length, 1)
  const run = (await h.ok('GET', '/mates/thread', { id: 'mywork' })).runs[0]
  assert.equal(run.input, '写一份 README 简介'); assert.equal(run.trigger, 'user'); assert.equal(run.error, '')
  assert.deepEqual(run.activity.filter((a) => a.kind !== 'tool').map((a) => [a.kind, a.text]), [['user', '改成英文'], ['text', '初稿好了'], ['text', 'Done, in English.']])
  assert.ok(run.activity.every((a) => !('requestId' in a)))
  m = h.mw.mateView('mywork')
  assert.deepEqual([m.state, m.preview, m.unread], ['idle', 'Done, in English.', true])
  h.cleanup()
})

test('say while only a routine run is active: the message waits and becomes the next run; the routine run is trigger routine', async () => {
  const h = harness()
  const g = gate()
  const { routine } = await h.ok('POST', '/routines/create', { mateId: 'mywork', input: '每天 9 点给我一份 Node 生态简报' })
  h.scripts.push(async (t) => {
    assert.match(t.texts[0], /这是例行任务《/)
    t.tool('deliver', { title: 'Node 简报', markdown: '变化：新出了 Node 26\n\n正文', summary: [{ label: '版本', value: '26' }] })
    await g.promise
    t.say('简报交了。\n变化：有')
  })
  h.scripts.push((t) => { assert.deepEqual(t.texts, ['顺便看看 Bun']); t.say('Bun 也更新了。') })
  const ran = await h.ok('POST', '/routines/run', { id: routine.id })
  await h.until(() => h.run(ran.runId).status === 'running')
  const said = await h.ok('POST', '/mates/say', { id: 'mywork', text: '顺便看看 Bun' })
  assert.equal(said.mode, 'queue'); assert.notEqual(said.runId, ran.runId)
  assert.deepEqual([h.run(said.runId).status, h.run(said.runId).dispatched], ['queued', false]) // not handed over while the routine runs
  assert.equal(h.prompts.length, 1)
  assert.deepEqual([h.mw.runView(h.run(said.runId)).status, h.mw.runView(h.run(said.runId)).queued], ['running', true])
  g.open()
  await h.until(() => h.run(said.runId).status === 'done')
  assert.deepEqual(h.prompts.map((p) => [p.mode, p.requestId.startsWith('mywork-run-' + (p === h.prompts[0] ? ran.runId : said.runId) + '.')]), [['queue', true], ['queue', true]])
  const { runs } = await h.ok('GET', '/mates/thread', { id: 'mywork' })
  assert.deepEqual(runs.map((r) => r.trigger), ['routine', 'user'])
  const r = runs[0]
  assert.deepEqual([r.routineId, r.routineTitle, r.quiet, r.error], [routine.id, routine.title, false, ''])
  assert.equal(r.activity.filter((a) => a.kind === 'text').pop().text, '简报交了。') // the 变化 line is for the engine only
  assert.equal(r.deliverables.length, 1); assert.deepEqual(r.deliverables[0].summary, [{ label: '版本', value: '26' }]); assert.equal(r.deliverables[0].mateId, 'mywork'); assert.equal(r.deliverables[0].runId, r.id)
  const receipt = h.mw.routines.get(routine.id).runs[0]
  assert.deepEqual([receipt.taskId, receipt.changed, receipt.deliverableId], [r.id, true, r.deliverables[0].id])
  assert.equal(runs[1].activity.find((a) => a.kind === 'text').text, 'Bun 也更新了。')
  h.cleanup()
})

test('say while waiting on an ask answers it; the same run continues in the same session', async () => {
  const h = harness()
  h.scripts.push((t) => { const out = t.tool('mywork_ask', { question: '发给谁？' }); assert.equal(out.asked, true); t.say('我需要知道收件人。') })
  h.scripts.push((t) => { assert.deepEqual(t.texts, ['回答：张三']); t.say('已发给张三。') })
  const { runId } = await h.ok('POST', '/mates/say', { id: 'mywork', text: '把周报发出去' })
  await h.until(() => h.run(runId).status === 'waiting')
  const m = h.mw.mateView('mywork')
  assert.deepEqual([m.state, m.preview, m.unread], ['waiting', '等你答 · 发给谁？', true])
  assert.deepEqual(Object.keys(m.ask), ['id', 'at', 'question', 'askKind', 'options', 'detail', 'runId']); assert.equal(m.ask.runId, runId)
  const bell = await h.ok('GET', '/activity')
  assert.deepEqual(bell.needs.map((x) => [x.kind, x.text, x.runId, x.mateName]), [['ask', '发给谁？', runId, 'MyWork']])
  const thread = (await h.ok('GET', '/mates/thread', { id: 'mywork' })).runs
  assert.equal(thread[0].status, 'waiting'); assert.equal(thread[0].ask.question, '发给谁？')
  const answered = await h.ok('POST', '/mates/say', { id: 'mywork', text: '张三' })
  assert.deepEqual([answered.mode, answered.runId], ['answer', runId])
  await h.until(() => h.run(runId).status === 'done')
  assert.equal(h.runsOf('mywork').length, 1)
  const run = h.mw.runView(h.run(runId))
  const ask = run.activity.find((a) => a.kind === 'ask')
  assert.deepEqual([ask.status, ask.answer], ['answered', '张三'])
  assert.deepEqual(run.activity.filter((a) => a.kind === 'user').map((a) => [a.text, a.askId]), [['张三', ask.id]])
  assert.equal(run.activity.filter((a) => a.kind === 'text').pop().text, '已发给张三。'); assert.equal(run.ask, null)
  assert.equal(h.mw.mateView('mywork').state, 'idle')
  h.cleanup()
})

test('POST /answer answers from the card; 400 for nothing pending, a stale askId or an empty answer; a failed hand-over reopens the ask', async () => {
  const h = harness()
  h.scripts.push((t) => { t.tool('mywork_ask', { question: '要发吗？', askKind: 'approval' }) })
  const { runId } = await h.ok('POST', '/mates/say', { id: 'mywork', text: '给客户发邮件' })
  await h.until(() => h.run(runId).status === 'waiting')
  const askId = pendingAsk(h.run(runId)).id
  assert.equal((await h.call('POST', '/answer', { id: runId, askId: 'ask-stale', answer: true })).status, 400)
  assert.equal((await h.call('POST', '/answer', { id: runId, askId, answer: '' })).status, 400)
  assert.equal((await h.call('POST', '/answer', { id: 'run-nope', answer: 'x' })).status, 404)
  h.promptFails = true
  await h.ok('POST', '/answer', { id: runId, askId, answer: true })
  await h.until(() => h.run(runId).status === 'waiting')
  assert.equal(pendingAsk(h.run(runId)).id, askId); assert.ok(!h.run(runId).activity.some((a) => a.kind === 'user'))
  h.promptFails = false
  h.scripts.push((t) => { assert.deepEqual(t.texts, ['回答：允许']); t.say('发了。') })
  const { run } = await h.ok('POST', '/answer', { id: runId, askId, answer: true })
  assert.deepEqual([run.status, run.queued], ['running', true])
  await h.until(() => h.run(runId).status === 'done')
  assert.equal((await h.call('POST', '/answer', { id: runId, answer: 'x' })).status, 400)
  h.cleanup()
})

test('ask rules: at most two per run, never in routine or intro runs, never outside a teammate session', async () => {
  const h = harness()
  const refusals = {}
  h.scripts.push((t) => {
    const a = t.tool('mywork_ask', { question: '第一个' })
    const b = t.tool('mywork_ask', { question: '要哪个？', askKind: 'choice', options: ['A', 'B'] })
    refusals.third = t.tool('mywork_ask', { question: '第三个' }).error
    assert.ok(a.asked && b.asked)
  })
  const { runId } = await h.ok('POST', '/mates/say', { id: 'mywork', text: 'x' })
  await h.until(() => h.run(runId).status === 'waiting')
  assert.equal(refusals.third, ASK_TEXT.limit)
  assert.deepEqual(h.run(runId).activity.filter((a) => a.kind === 'ask').map((a) => a.status), ['superseded', 'pending'])
  await h.ok('POST', '/mates/stop', { id: 'mywork' })
  assert.equal(h.run(runId).status, 'done'); assert.equal(h.run(runId).error, STOPPED); assert.equal(pendingAsk(h.run(runId)), null)
  const { routine } = await h.ok('POST', '/routines/create', { mateId: 'mywork', input: '每天 9 点给我一份简报' })
  h.scripts.push((t) => { refusals.routine = t.tool('mywork_ask', { question: '？' }).error; refusals.nested = t.tool('mywork_routine_create', { input: '每天 10 点再来一份' }).error; t.say('简报\n变化：有') })
  const ran = await h.ok('POST', '/routines/run', { id: routine.id })
  await h.until(() => h.run(ran.runId).status === 'done')
  assert.equal(refusals.routine, ASK_TEXT.routine); assert.match(refusals.nested, /例行运行时不能新建例行/)
  h.scripts.push((t) => { refusals.system = t.tool('mywork_ask', { question: '？' }).error; t.tool('mywork_mate_update', { name: '小助' }); t.say('你好') })
  const { mate } = await h.ok('POST', '/mates/create', { description: '帮我盯邮件' })
  await h.until(() => h.runsOf(mate.id).every((r) => r.status === 'done'))
  assert.equal(refusals.system, ASK_TEXT.system)
  assert.throws(() => h.mw.engine.ask('some-other-session', { question: '?' }), new RegExp(ASK_TEXT.notMate))
  for (const name of ['mywork_routine_create', 'mywork_routines', 'mywork_remember', 'mywork_mate_update']) {
    assert.throws(() => h.mw.tools.find((t) => t.name === name).execute({ input: 'x', fact: 'x', name: 'x' }, { agent: { session: { id: 'user-session' } } }), /只在 MyWork 同事的会话里可用/)
  }
  assert.throws(() => h.mw.tools.find((t) => t.name === 'deliver').execute({ title: 't', markdown: 'm' }, { agent: { session: { id: 'user-session' } } }), /只能在 MyWork 同事的会话里调用/)
  h.cleanup()
})

test('stop cancels the active run (inbox kept): a queued message still runs afterwards', async () => {
  const h = harness()
  const never = gate()
  h.scripts.push(async (t) => { t.tool('read_file'); await never.promise })
  const a = await h.ok('POST', '/mates/say', { id: 'mywork', text: '一件很长的事' })
  await h.until(() => h.run(a.runId).status === 'running')
  const { mate } = await h.ok('POST', '/mates/stop', { id: 'mywork' })
  assert.ok(mate)
  await h.until(() => h.run(a.runId).status === 'done')
  assert.equal(h.run(a.runId).error, STOPPED); assert.deepEqual(h.cancels, ['mywork-mate-mywork'])
  assert.equal(h.mw.mateView('mywork').state, 'idle'); assert.equal(h.mw.mateView('mywork').preview, '失败 · 已停止。')
  // A routine run is stopped; the user's message queued behind it runs next.
  const { routine } = await h.ok('POST', '/routines/create', { mateId: 'mywork', input: '每天 9 点给我一份简报' })
  h.scripts.push(async () => { await never.promise })
  h.scripts.push((t) => t.say('第二件做完了'))
  const r = await h.ok('POST', '/routines/run', { id: routine.id })
  await h.until(() => h.run(r.runId).status === 'running')
  const b = await h.ok('POST', '/mates/say', { id: 'mywork', text: '第二件' })
  assert.equal(b.mode, 'queue')
  await h.ok('POST', '/mates/stop', { id: 'mywork' })
  await h.until(() => h.run(b.runId).status === 'done')
  assert.equal(h.run(r.runId).error, STOPPED); assert.equal(h.run(b.runId).error, '')
  assert.equal(h.run(b.runId).activity.find((x) => x.kind === 'text').text, '第二件做完了')
  assert.equal((await h.call('POST', '/mates/stop', { id: 'nobody' })).status, 404)
  h.cleanup()
})

test('routine runs: a quiet run stays in the routine record but not in the thread; a reminder posts a remind card without running the teammate', async () => {
  const h = harness()
  const { routine } = await h.ok('POST', '/routines/create', { mateId: 'mywork', input: '每天 9 点给我一份 Node 简报' })
  h.scripts.push((t) => { t.tool('deliver', { title: '简报', markdown: '变化：无' }); t.say('没什么新的。\n变化：无') })
  const quiet = await h.ok('POST', '/routines/run', { id: routine.id })
  await h.until(() => h.run(quiet.runId).status === 'done')
  assert.equal(h.run(quiet.runId).quiet, true)
  assert.deepEqual((await h.ok('GET', '/mates/thread', { id: 'mywork' })).runs, [])
  assert.equal(h.mw.routines.get(routine.id).runs[0].changed, false)
  let m = h.mw.mateView('mywork'); assert.deepEqual([m.unread, m.preview], [false, ''])
  // 日报 is never quiet, and its prompt carries every teammate's record of the day.
  const { routine: report } = await h.ok('POST', '/routines/create', { mateId: 'mywork', input: '工作日晚上 7 点提醒我根据今天的问题写日报' })
  assert.equal(report.kind, 'task')
  h.scripts.push((t) => { assert.match(t.texts[0], /同事们这段时间替用户做过的事/); assert.match(t.texts[0], /【MyWork】/); t.tool('deliver', { title: '日报', markdown: '今天没做什么', kind: 'report' }); t.say('日报交了。\n变化：无') })
  const rep = await h.ok('POST', '/routines/run', { id: report.id })
  await h.until(() => h.run(rep.runId).status === 'done')
  assert.equal(h.run(rep.runId).quiet, false); assert.equal(h.run(rep.runId).report, true)
  // A reminder: no prompt, a synthetic done run with one remind entry, acked through /routines/ack.
  const { routine: remind } = await h.ok('POST', '/routines/create', { mateId: 'mywork', input: '明天 8 点提醒我交周报' })
  assert.equal(remind.kind, 'remind')
  const prompts = h.prompts.length
  const fired = await h.ok('POST', '/routines/run', { id: remind.id })
  assert.equal(h.prompts.length, prompts)
  const card = h.mw.runView(h.run(fired.runId))
  assert.deepEqual([card.trigger, card.status, card.routineId, card.routineTitle], ['routine', 'done', remind.id, '交周报'])
  assert.deepEqual(card.remind, { routineId: remind.id, title: '交周报', at: card.activity[0].at, acked: false })
  assert.deepEqual(card.activity.map((a) => [a.kind, a.title, a.acked]), [['remind', '交周报', false]])
  assert.equal(card.activity[0].at, h.mw.routines.get(remind.id).fired[0].at)
  assert.deepEqual((await h.ok('GET', '/mates/thread', { id: 'mywork' })).runs.map((r) => r.id), [rep.runId, fired.runId])
  m = h.mw.mateView('mywork'); assert.deepEqual([m.unread, m.preview], [true, '提醒 · 交周报'])
  assert.deepEqual((await h.ok('GET', '/activity')).needs.map((x) => [x.kind, x.text]), [['remind', '交周报']])
  assert.ok(h.events.some((e) => e.kind === 'remind' && e.routine && e.routine.id === remind.id && e.run.id === fired.runId))
  await h.ok('POST', '/routines/ack', { id: remind.id, at: card.activity[0].at })
  assert.equal(h.run(fired.runId).activity[0].acked, true); assert.equal(h.mw.runView(h.run(fired.runId)).remind.acked, true)
  assert.deepEqual((await h.ok('GET', '/activity')).needs, [])
  h.cleanup()
})

test('one run in flight per teammate, config.concurrency teammates at once', async () => {
  const h = harness({ concurrency: 1 })
  const g = gate()
  h.scripts.push(async (t) => { await g.promise; t.say('A 完成') })
  h.scripts.push((t) => t.say('B 完成'))
  const other = h.mw.mates.create({ name: '小二', description: '跑腿' })
  const a = await h.ok('POST', '/mates/say', { id: 'mywork', text: 'A' })
  const b = await h.ok('POST', '/mates/say', { id: other.id, text: 'B' })
  await h.until(() => h.run(a.runId).status === 'running')
  assert.equal(h.run(b.runId).dispatched, false)
  assert.equal(h.mw.mateView(other.id).state, 'working'); assert.equal(h.mw.mateView(other.id).preview, '在干活 · 排队')
  g.open()
  await h.until(() => h.run(b.runId).status === 'done')
  assert.equal(h.run(b.runId).activity.find((x) => x.kind === 'text').text, 'B 完成')
  h.cleanup()
})

test('verification runs in the background: the run is done and the teammate free while it verifies; the stamp lands later', async () => {
  const h = harness({ verify: true })
  h.verifyGate = gate()
  h.verdict = '{"passed": false, "checked": 3, "issues": 1, "notes": "有一个数字对不上"}'
  h.scripts.push((t) => { t.tool('deliver', { title: '比较', markdown: '| a | 1 |' }); t.say('比较好了') })
  const { runId } = await h.ok('POST', '/mates/say', { id: 'mywork', text: '比较一下' })
  await h.until(() => h.run(runId).status === 'done' && h.run(runId).verifying)
  assert.equal(h.mw.mateView('mywork').state, 'idle')
  h.scripts.push((t) => t.say('在'))
  const next = await h.ok('POST', '/mates/say', { id: 'mywork', text: '你还在吗' })
  await h.until(() => h.run(next.runId).status === 'done')
  assert.equal(h.run(runId).verifying, true)
  await h.ok('POST', '/seen', { id: 'mywork' })
  await new Promise((r) => setTimeout(r, 5)) // the stamp must be strictly later than the look
  h.verifyGate.open()
  await h.until(() => !h.run(runId).verifying)
  const run = h.mw.runView(h.run(runId))
  assert.deepEqual([run.verification.passed, run.verification.issues], [false, 1]); assert.equal(run.deliverables[0].verification.issues, 1)
  assert.ok([...h.sessions.keys()].some((id) => id.startsWith('mywork-verify-' + runId)))
  assert.equal(h.mw.mateView('mywork').unread, true) // a stamped verification with issues lights the row again
  assert.ok(h.events.some((e) => e.kind === 'verified' && e.run.id === runId))
  h.cleanup()
})

test('a steer that missed its run\'s turn opens a continuation run; a line typed into the session elsewhere is a run too', async () => {
  const h = harness()
  const { runId } = await h.ok('POST', '/mates/say', { id: 'mywork', text: '第一件' })
  await h.until(() => h.run(runId).status === 'done')
  const sid = { id: 'mywork-mate-mywork' }
  const ev = (type, data) => h.mw.engine.onSessionEvent(sid, { type, data })
  const rpc = 'mywork-steer-' + runId + '.abc'
  h.mw.store.activity(runId, { kind: 'user', text: '晚到的一句', requestId: rpc })
  ev('turn/start', { turn: 9 })
  ev('user/message', { role: 'user', content: [{ type: 'text', text: '晚到的一句' }], source: { kind: 'user', rpcId: rpc } })
  ev('assistant/message', { message: { content: [{ type: 'text', text: '收到晚到的话' }] } })
  ev('turn/end', { turn: 9, reason: { kind: 'completed' } })
  const runs = h.runsOf('mywork')
  assert.equal(runs.length, 2)
  assert.ok(!runs[0].activity.some((a) => a.kind === 'user'))
  assert.deepEqual([runs[1].trigger, runs[1].input, runs[1].status, runs[1].activity.map((a) => a.text)], ['user', '晚到的一句', 'done', ['收到晚到的话']])
  ev('turn/start', { turn: 10 })
  ev('user/message', { role: 'user', content: [{ type: 'text', text: '在 dsh 里直接打的' }], source: { kind: 'user', rpcId: 'dsh-web-1' } })
  ev('user/message', { role: 'user', content: [{ type: 'text', text: 'AGENTS.md 内容' }], source: { kind: 'agent-instructions' } })
  ev('assistant/message', { message: { content: [{ type: 'text', text: '好' }] } })
  ev('turn/end', { turn: 10, reason: { kind: 'completed' } })
  const last = h.runsOf('mywork')[2]
  assert.deepEqual([last.input, last.activity.map((a) => a.text)], ['在 dsh 里直接打的', ['好']])
  h.cleanup()
})

test('restart: a run mid-turn ends with 服务重启…; a teammate with a message in its session inbox is resumed and nudged', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mywork-restart-'))
  const first = harness({ home: dir })
  const hold = gate()
  first.scripts.push(async () => { await hold.promise })
  const a = await first.ok('POST', '/mates/say', { id: 'mywork', text: '长活' })
  await first.until(() => first.run(a.runId).status === 'running')
  // A second teammate whose message reached its session but whose turn never started.
  const other = first.mw.mates.create({ name: '小二', description: '跑腿' })
  first.mw.mates.update(other.id, { sessionId: 'mywork-mate-' + other.id })
  const queued = first.mw.store.create({ mateId: other.id, trigger: 'user', input: '排着的' })
  first.mw.store.update(queued.id, { dispatched: true, handed: true, requestId: 'mywork-run-' + queued.id + '.x' })
  // Restart: a new process over the same files.
  const second = harness({ home: dir })
  second.sessions.set('mywork-mate-' + other.id, { id: 'mywork-mate-' + other.id, nextTurn: [{ role: 'user', content: [{ type: 'text', text: '排着的' }], source: { kind: 'user', rpcId: 'mywork-run-' + queued.id + '.x' } }], nextStep: [], log: [], running: false, turn: 0, idle: Promise.resolve() })
  // The status repair already ran when the second process started, before any route could run.
  assert.equal(second.run(a.runId).status, 'done'); assert.equal(second.run(a.runId).error, INTERRUPTED)
  second.scripts.push((t) => { assert.deepEqual(t.texts, [NUDGE_TEXT, '排着的']); t.say('接着做完了') })
  await second.mw.engine.recover()
  await second.until(() => second.run(queued.id).status === 'done')
  assert.equal(second.run(queued.id).activity.find((x) => x.kind === 'text').text, '接着做完了')
  // The same request id was re-sent first (already in the inbox, so ignored), then the wake-up steer.
  assert.deepEqual(second.deduped, ['mywork-run-' + queued.id + '.x'])
  assert.deepEqual(second.prompts.map((p) => [p.mode, p.requestId.startsWith('mywork-nudge-')]), [['steer', true]])
  hold.open()
  rmSync(dir, { recursive: true, force: true })
})

test('migration to the teammate model is idempotent', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mywork-migrate-'))
  const my = join(dir, 'mywork')
  mkdirSync(my, { recursive: true })
  const at = '2026-09-29T10:00:00.000Z'
  const tasks = [
    { id: 'task-1', title: '整理 README', scenario: 'general', input: '整理 README', status: 'done', steps: [], activity: [{ kind: 'text', text: '好了', at }], sessionId: 'mywork-task-task-1', deliverableIds: ['dlv-1'], source: 'ui', routineId: '', quiet: false, createdAt: at, startedAt: at, finishedAt: at, error: '', summary: '' },
    { id: 'task-2', title: '今天的对话 09/29', scenario: 'assistant', input: '你好', dayKey: '2026-09-29', status: 'done', steps: [], activity: [{ kind: 'user', text: '你好', at }, { kind: 'text', text: '你好！', at }, { kind: 'handoff', target: 'task', id: 'task-1', title: 'x', at }, { kind: 'user', text: '再见', at }], sessionId: '', deliverableIds: [], source: 'today', routineId: '', createdAt: at, startedAt: at, finishedAt: at, error: '', summary: '' },
    { id: 'task-3', title: '简报', scenario: 'general', input: '简报', status: 'done', steps: [], activity: [], sessionId: '', deliverableIds: [], source: 'routine', routineId: 'rt-1', quiet: true, createdAt: at, finishedAt: at, error: '', summary: '' },
    { id: 'task-4', title: '发邮件', scenario: 'general', input: '发邮件', status: 'waiting', steps: [], activity: [{ kind: 'ask', id: 'ask-1', status: 'pending', question: '发给谁？', at }], sessionId: '', deliverableIds: [], source: 'ui', createdAt: at, finishedAt: '', error: '', summary: '' },
  ]
  writeFileSync(join(my, 'tasks.json'), JSON.stringify({ version: 1, items: tasks }))
  writeFileSync(join(my, 'routines.json'), JSON.stringify({ version: 1, items: [{ id: 'rt-1', kind: 'task', title: '简报', input: '简报', schedule: { type: 'daily', time: '09:00' }, enabled: true, createdAt: at, lastRunAt: '', nextRunAt: '', runs: [], fired: [] }] }))
  writeFileSync(join(my, 'deliverables.json'), JSON.stringify({ version: 1, items: [{ id: 'dlv-1', taskId: 'task-1', title: 'README', kind: 'markdown', markdown: '# x', createdAt: at }] }))
  const h1 = harness({ home: dir })
  const runs = h1.mw.store.items
  assert.deepEqual(runs.map((r) => [r.id, r.mateId, r.trigger]), [['task-1', 'mywork', 'user'], ['task-2', 'mywork', 'user'], ['task-3', 'mywork', 'routine'], ['task-4', 'mywork', 'user']])
  assert.deepEqual(runs[1].activity.map((a) => a.text || a.kind), ['你好！', 'handoff', '再见'])
  assert.equal(runs[2].routineTitle, '简报')
  assert.deepEqual([runs[3].status, runs[3].activity[0].status], ['done', 'expired'])
  assert.equal(h1.mw.routines.get('rt-1').mateId, 'mywork'); assert.equal(h1.mw.deliverables.get('dlv-1').mateId, 'mywork')
  const files = ['tasks.json', 'routines.json', 'deliverables.json', 'mates.json'].map((f) => readFileSync(join(my, f), 'utf8'))
  const h2 = harness({ home: dir })
  assert.deepEqual(['tasks.json', 'routines.json', 'deliverables.json', 'mates.json'].map((f) => readFileSync(join(my, f), 'utf8')), files)
  assert.ok(!h2.logs.some((l) => /migrated/.test(l))); assert.ok(h1.logs.some((l) => /migrated 6 records/.test(l)))
  // Old tasks read as runs of MyWork: the thread shows them, the quiet routine run excepted.
  const thread = h2.mw.thread('mywork')
  assert.deepEqual(thread.runs.map((r) => r.id), ['task-1', 'task-2', 'task-4'])
  assert.equal(thread.runs[0].deliverables[0].runId, 'task-1')
  rmSync(dir, { recursive: true, force: true })
})

test('teammates: the default one cannot be removed; removing another drops its runs, files and routines, keeps its folder', async () => {
  const h = harness()
  assert.equal((await h.call('POST', '/mates/remove', { id: 'mywork' })).status, 400)
  assert.equal((await h.call('POST', '/mates/create', { description: '  ' })).status, 400)
  h.scripts.push((t) => { t.tool('deliver', { title: '介绍', markdown: '正文' }); t.say('你好，我是阿文。') })
  const { mate } = await h.ok('POST', '/mates/create', { description: '写文案', name: '阿文', title: '文案' })
  assert.deepEqual([mate.name, mate.glyph, mate.title], ['阿文', '阿', '文案'])
  await h.until(() => h.runsOf(mate.id).every((r) => r.status === 'done'))
  await h.ok('POST', '/routines/create', { mateId: mate.id, input: '每天 9 点写一条文案' })
  assert.equal((await h.ok('GET', '/files', { mate: mate.id })).items.length, 1)
  const updated = await h.ok('POST', '/mates/update', { id: mate.id, name: '文文', pinned: true, notify: false })
  assert.deepEqual([updated.mate.name, updated.mate.glyph, updated.mate.pinned, updated.mate.notify], ['文文', '文', true, false])
  await h.until(() => /你是「文文」/.test(readFileSync(join(h.dir, '.agent-presets', 'mate-' + mate.id, 'agent.cordis.yml'), 'utf8')))
  assert.equal((await h.call('POST', '/mates/update', { id: mate.id, name: ' ' })).status, 400)
  assert.deepEqual((await h.ok('POST', '/mates/remove', { id: mate.id })), { removed: true })
  assert.equal(h.runsOf(mate.id).length, 0); assert.equal(h.mw.routines.forMate(mate.id).length, 0); assert.equal((await h.ok('GET', '/files', { mate: mate.id })).items.length, 0)
  assert.ok(existsSync(join(h.dir, 'mywork', 'mates', mate.id))); assert.ok(!existsSync(join(h.dir, '.agent-presets', 'mate-' + mate.id)))
  assert.equal((await h.call('GET', '/mates/thread', { id: mate.id })).status, 404)
  h.cleanup()
})

test('memory, routine tools and the thread page', async () => {
  const h = harness()
  let listed
  h.scripts.push((t) => {
    assert.equal(t.tool('mywork_remember', { fact: '周报用表格，按项目分' }).remembered, true)
    assert.match(t.tool('mywork_remember', { fact: 'x'.repeat(301) }).error, /≤300/)
    t.tool('mywork_routine_create', { input: '30 分钟后提醒我喝水' })
    t.tool('mywork_routine_create', { input: '每天 9 点给我一份简报' })
    listed = t.tool('mywork_routines')
    assert.equal(t.tool('mywork_routine_cancel', { title: '简报' }).removed, true)
    assert.match(t.tool('mywork_routine_cancel', { title: '不存在的' }).error, /你没有这条例行/)
    t.say('记住了，也安排好了。')
  })
  const { runId } = await h.ok('POST', '/mates/say', { id: 'mywork', text: '记住：周报用表格。30 分钟后提醒我喝水' })
  await h.until(() => h.run(runId).status === 'done')
  const memory = readFileSync(join(h.dir, 'mywork', 'mates', 'mywork', 'AGENTS.md'), 'utf8')
  assert.match(memory, /^# MyWork 记住的事/); assert.match(memory, /\n- \d{4}-\d{2}-\d{2} 周报用表格，按项目分\n$/)
  // MyWork's default morning brief (晨报) is there from the start; the rest are what this run created.
  const own = (list) => list.filter((r) => r.title !== '晨报')
  assert.equal(listed.items.filter((r) => r.title === '晨报').length, 1)
  assert.deepEqual(own(listed.items).map((r) => r.kind), ['remind', 'task'])
  assert.deepEqual(own(h.mw.routines.forMate('mywork')).map((r) => r.title), ['喝水'])
  assert.deepEqual(h.run(runId).activity.filter((a) => a.kind === 'routine').map((a) => a.title), ['喝水', '给我一份简报'])
  // Paging: the newest `limit` runs before `before`, ascending; nextBefore until the start.
  for (let i = 0; i < 4; i += 1) { const r = h.mw.store.create({ mateId: 'mywork', trigger: 'user', input: 'old ' + i, status: 'done' }); r.createdAt = new Date(Date.parse('2026-09-01T00:00:00Z') + i * 1000).toISOString() }
  const page1 = await h.ok('GET', '/mates/thread', { id: 'mywork', limit: '3' })
  assert.deepEqual(page1.runs.map((r) => r.input), ['old 2', 'old 3', '记住：周报用表格。30 分钟后提醒我喝水'])
  const page2 = await h.ok('GET', '/mates/thread', { id: 'mywork', limit: '3', before: page1.nextBefore })
  assert.deepEqual([page2.runs.map((r) => r.input), page2.nextBefore], [['old 0', 'old 1'], null])
  assert.equal((await h.call('GET', '/mates/thread', { id: 'mywork', before: 'yesterday' })).status, 400)
  // Search: teammates, messages, files, routines.
  const found = await h.ok('GET', '/search', { q: '喝水' })
  assert.deepEqual([found.mates.length, found.messages.map((m) => m.runId), found.routines.map((r) => r.title)], [0, [runId], ['喝水']])
  assert.deepEqual((await h.ok('GET', '/search', { q: 'mywork' })).mates.map((m) => m.id), ['mywork'])
  h.cleanup()
})

test('the teammate preset replaces standard\'s persona and drops ask_user, whatever the user wrote', () => {
  const base = readFileSync(STANDARD, 'utf8')
  const out = mateComposition(base, { id: 'm1', name: '', title: '', description: '每天 {{cwd}} 整理\n- id: evil\n# comment' })
  assert.match(out, /你是一位刚加入的同事（还没有名字）/)
  assert.match(out, /      每天 \{ \{cwd\} \} 整理\n      - id: evil\n      # comment/) // the description stays inside the literal block
  assert.equal((out.match(/^- id: persona$/gm) || []).length, 1)
  assert.doesNotMatch(out, /tool-ask-user/)
  assert.equal((out.match(/^- id: /gm) || []).length, (base.match(/^- id: /gm) || []).length - 1)
  assert.match(out, /suffix: 你的工作目录（你的文件夹）是 \{\{cwd\}\}。/)
  const noPersona = mateComposition('- id: tool-fs\n  name: x\n', { id: 'm2', name: '甲', description: 'd' })
  assert.match(noPersona, /^# Generated[^\n]*\n\n- id: persona/)
})

test('24 h without an answer: the ask expires and the run resumes on its own assumptions', async () => {
  const h = harness()
  h.scripts.push((t) => { t.tool('mywork_ask', { question: '哪个？' }) })
  const { runId } = await h.ok('POST', '/mates/say', { id: 'mywork', text: 'x' })
  await h.until(() => h.run(runId).status === 'waiting')
  assert.deepEqual(h.mw.engine.expireAsks(), [])
  h.scripts.push((t) => { assert.deepEqual(t.texts, [ASK_TEXT.expired]); t.say('按假设做完了') })
  assert.deepEqual(h.mw.engine.expireAsks(Date.now() + ASK_EXPIRY_MS + 1000), [runId])
  await h.until(() => h.run(runId).status === 'done')
  assert.equal(h.run(runId).activity.find((a) => a.kind === 'ask').status, 'expired')
  assert.deepEqual(h.run(runId).activity.filter((a) => a.kind === 'user').map((a) => [a.text, a.auto]), [[ASK_TEXT.expired, true]])
  assert.equal(h.mw.mateView('mywork').preview, '按假设做完了')
  h.cleanup()
})

// ── review fixes ───────────────────────────────────────────────────────────

test('a rewritten preset reaches the live session: the intro rename re-links it after the turn, an idle 职责 edit at once; the workspace takes the name', async () => {
  const h = harness()
  const mid = {}
  h.scripts.push(async (t) => {
    t.tool('mywork_mate_update', { name: '盯邮件' })
    await new Promise((r) => setTimeout(r, 20)) // the preset is rewritten while the turn is still going
    mid.recomposes = h.recomposes.length
    t.say('我是盯邮件。')
  })
  const { mate } = await h.ok('POST', '/mates/create', { description: '帮我盯邮件' })
  const sid = 'mywork-mate-' + mate.id
  await h.until(() => h.runsOf(mate.id).every((r) => r.status === 'done') && h.recomposes.length === 1)
  assert.equal(mid.recomposes, 0) // never mid-turn
  assert.deepEqual(h.recomposes, [[sid, 'mate-' + mate.id]])
  assert.match(readFileSync(join(h.dir, '.agent-presets', 'mate-' + mate.id, 'agent.cordis.yml'), 'utf8'), /你是「盯邮件」/)
  assert.deepEqual(h.titles, [[join(h.dir, 'mywork', 'mates', mate.id), '盯邮件']])
  assert.equal(h.workspaces[0].name, '盯邮件')
  // Idle: a 职责 edit in the right panel is re-linked right away (no restart needed); the name did not change, the title stays.
  await h.ok('POST', '/mates/update', { id: mate.id, description: '帮我盯邮件，只看客户的' })
  await h.until(() => h.recomposes.length === 2)
  assert.match(readFileSync(join(h.dir, '.agent-presets', 'mate-' + mate.id, 'agent.cordis.yml'), 'utf8'), /只看客户的/)
  assert.equal(h.titles.length, 1)
  // Pinning is not identity: nothing is rewritten.
  await h.ok('POST', '/mates/update', { id: mate.id, pinned: true })
  await new Promise((r) => setTimeout(r, 20))
  assert.equal(h.recomposes.length, 2)
  h.cleanup()
})

test('a quiet routine run leaves no file on the 文件 page or in search, and no verifier runs for it', async () => {
  const h = harness({ verify: true })
  const { routine } = await h.ok('POST', '/routines/create', { mateId: 'mywork', input: '每小时看一下 Node 有没有新版本' })
  h.scripts.push((t) => { t.tool('deliver', { title: 'Node 版本观察', markdown: '变化：无' }); t.say('没有新版本。\n变化：无') })
  const quiet = await h.ok('POST', '/routines/run', { id: routine.id })
  await h.until(() => h.run(quiet.runId).status === 'done')
  assert.equal(h.run(quiet.runId).quiet, true)
  assert.equal(h.mw.deliverables.items.length, 1) // kept in the routine's record…
  assert.deepEqual((await h.ok('GET', '/files')).items, []) // …but never listed
  assert.deepEqual((await h.ok('GET', '/files', { mate: 'mywork', q: 'Node' })).items, [])
  assert.deepEqual((await h.ok('GET', '/search', { q: 'Node 版本' })).files, [])
  assert.equal(h.run(quiet.runId).verifying, false)
  assert.ok(![...h.sessions.keys()].some((id) => id.startsWith('mywork-verify-')))
  assert.ok(!h.events.some((e) => e.kind === 'verifying' || e.kind === 'verified'))
  // A run with a change shows its file (and is verified).
  h.scripts.push((t) => { t.tool('deliver', { title: 'Node 26 发布', markdown: '变化：Node 26' }); t.say('Node 26 出了。\n变化：有') })
  const changed = await h.ok('POST', '/routines/run', { id: routine.id })
  await h.until(() => h.run(changed.runId).status === 'done' && !h.run(changed.runId).verifying && h.run(changed.runId).verification)
  assert.deepEqual((await h.ok('GET', '/files')).items.map((d) => [d.title, d.runId]), [['Node 26 发布', changed.runId]])
  assert.deepEqual((await h.ok('GET', '/search', { q: 'Node' })).files.map((d) => d.title), ['Node 26 发布'])
  h.cleanup()
})

test('restart: the status repair runs when the service is created; a message handed over after start is never treated as pre-restart', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mywork-repair-'))
  const first = harness({ home: dir })
  const hold = gate()
  first.scripts.push(async () => { await hold.promise })
  const a = await first.ok('POST', '/mates/say', { id: 'mywork', text: '长活' })
  await first.until(() => first.run(a.runId).status === 'running')
  const second = harness({ home: dir })
  assert.equal(second.run(a.runId).error, INTERRUPTED) // before any route or recover()
  // A message in the first 3 s: it is dispatched, runs, and recover() neither ends nor nudges it.
  const g = gate()
  second.scripts.push(async (t) => { assert.deepEqual(t.texts, ['新的一句']); await g.promise; t.say('做完了') })
  const b = await second.ok('POST', '/mates/say', { id: 'mywork', text: '新的一句' })
  await second.until(() => second.run(b.runId).status === 'running')
  await second.mw.engine.recover()
  assert.equal(second.run(b.runId).status, 'running'); assert.equal(second.run(b.runId).error, '')
  assert.ok(!second.prompts.some((p) => p.requestId.startsWith('mywork-nudge-')))
  g.open()
  await second.until(() => second.run(b.runId).status === 'done')
  assert.equal(second.run(b.runId).error, '')
  hold.open()
  rmSync(dir, { recursive: true, force: true })
})

test('restart: a message lost from the session inbox is re-sent with its own request id; the run completes, no orphan', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mywork-lost-'))
  const first = harness({ home: dir })
  const other = first.mw.mates.create({ name: '小二', description: '跑腿' })
  first.mw.mates.update(other.id, { sessionId: 'mywork-mate-' + other.id })
  const queued = first.mw.store.create({ mateId: other.id, trigger: 'user', input: '丢了的那句' })
  first.mw.store.update(queued.id, { dispatched: true, handed: true, requestId: 'mywork-run-' + queued.id + '.x' })
  const second = harness({ home: dir })
  second.sessions.set('mywork-mate-' + other.id, { id: 'mywork-mate-' + other.id, nextTurn: [], nextStep: [], log: [], running: false, turn: 0, idle: Promise.resolve() }) // the inbox lost it
  second.scripts.push((t) => { assert.deepEqual(t.texts, [NUDGE_TEXT, '丢了的那句']); t.say('补上了') })
  await second.mw.engine.recover()
  await second.until(() => second.run(queued.id).status === 'done')
  assert.deepEqual(second.prompts.map((p) => [p.mode, p.requestId]), [['queue', 'mywork-run-' + queued.id + '.x'], ['steer', second.prompts[1].requestId]])
  assert.equal(second.runsOf(other.id).length, 1)
  assert.equal(second.run(queued.id).activity.find((x) => x.kind === 'text').text, '补上了')
  rmSync(dir, { recursive: true, force: true })
})

test('a handed-over run whose message is gone from the inbox is dispatched again at the next turn end', async () => {
  const h = harness()
  const { runId: warm } = await h.ok('POST', '/mates/say', { id: 'mywork', text: '先开个会话' })
  await h.until(() => h.run(warm).status === 'done')
  const lost = h.mw.store.create({ mateId: 'mywork', trigger: 'user', input: '被弄丢的' })
  h.mw.store.update(lost.id, { dispatched: true, handed: true, requestId: 'mywork-run-' + lost.id + '.gone' })
  assert.equal(h.mw.mateView('mywork').state, 'working')
  h.scripts.push((t) => { assert.deepEqual(t.texts, ['别处打的']); t.say('好') })
  h.scripts.push((t) => { assert.deepEqual(t.texts, ['被弄丢的']); t.say('这次到了') })
  await h.controller.prompt({ requestId: 'dsh-web-1', sessionId: 'mywork-mate-mywork', mode: 'queue', content: [{ type: 'text', text: '别处打的' }] })
  await h.until(() => h.run(lost.id).status === 'done')
  assert.equal(h.run(lost.id).activity.find((x) => x.kind === 'text').text, '这次到了')
  assert.ok(h.logs.some((l) => l.includes(`run ${lost.id}: its message is not in the session inbox`)))
  assert.notEqual(h.run(lost.id).requestId, 'mywork-run-' + lost.id + '.gone') // dispatched again under a fresh id
  const runs = h.runsOf('mywork')
  assert.deepEqual(runs.map((r) => [r.input, r.status, r.error]), [['先开个会话', 'done', ''], ['被弄丢的', 'done', ''], ['别处打的', 'done', '']])
  h.cleanup()
})

test('a turn without our request id is its own run, never the dispatched one; a finished run is never bound again', async () => {
  const h = harness()
  const { runId: warm } = await h.ok('POST', '/mates/say', { id: 'mywork', text: '先开个会话' })
  await h.until(() => h.run(warm).status === 'done')
  const sid = { id: 'mywork-mate-mywork' }
  const ev = (type, data) => h.mw.engine.onSessionEvent(sid, { type, data })
  const dispatched = h.mw.store.create({ mateId: 'mywork', trigger: 'user', input: '排着的' })
  h.mw.store.update(dispatched.id, { dispatched: true })
  // A dsh reminder turn (plugin source) comes first.
  ev('turn/start', { turn: 5 })
  ev('user/message', { role: 'user', content: [{ type: 'text', text: '提醒：喝水' }], source: { kind: 'plugin' } })
  ev('assistant/message', { message: { content: [{ type: 'text', text: '记得喝水' }] } })
  ev('turn/end', { turn: 5, reason: { kind: 'completed' } })
  assert.equal(h.run(dispatched.id).status, 'queued')
  const orphan = h.runsOf('mywork').find((r) => r.id !== warm && r.id !== dispatched.id)
  assert.deepEqual([orphan.trigger, orphan.status, orphan.activity.map((a) => a.text)], ['system', 'done', ['记得喝水']])
  // Its own turn binds it; a stray later message with the same run id does not reopen it.
  const rpc = 'mywork-run-' + dispatched.id + '.a'
  ev('turn/start', { turn: 6 })
  ev('user/message', { role: 'user', content: [{ type: 'text', text: '排着的' }], source: { kind: 'user', rpcId: rpc } })
  ev('assistant/message', { message: { content: [{ type: 'text', text: '做完了' }] } })
  ev('turn/end', { turn: 6, reason: { kind: 'completed' } })
  const finishedAt = h.run(dispatched.id).finishedAt
  assert.deepEqual([h.run(dispatched.id).status, h.run(dispatched.id).error], ['done', ''])
  ev('turn/start', { turn: 7 })
  ev('user/message', { role: 'user', content: [{ type: 'text', text: '排着的' }], source: { kind: 'user', rpcId: rpc } })
  ev('assistant/message', { message: { content: [{ type: 'text', text: '又一次' }] } })
  ev('turn/end', { turn: 7, reason: { kind: 'completed' } })
  assert.deepEqual([h.run(dispatched.id).status, h.run(dispatched.id).finishedAt], ['done', finishedAt])
  assert.deepEqual(h.run(dispatched.id).activity.map((a) => a.text), ['做完了'])
  h.cleanup()
})

test('stop with no bound run: a run queued behind the cap ends, the teammate is idle, nothing runs later', async () => {
  const h = harness({ concurrency: 1 })
  const g = gate()
  h.scripts.push(async (t) => { await g.promise; t.say('A 完成') })
  const other = h.mw.mates.create({ name: '小二', description: '跑腿' })
  const a = await h.ok('POST', '/mates/say', { id: 'mywork', text: 'A' })
  const b = await h.ok('POST', '/mates/say', { id: other.id, text: 'B' })
  await h.until(() => h.run(a.runId).status === 'running')
  assert.equal(h.mw.mateView(other.id).state, 'working')
  const { mate } = await h.ok('POST', '/mates/stop', { id: other.id })
  assert.deepEqual([mate.state, h.run(b.runId).status, h.run(b.runId).error], ['idle', 'done', STOPPED])
  assert.deepEqual(h.cancels, [])
  g.open()
  await h.until(() => h.run(a.runId).status === 'done')
  await new Promise((r) => setTimeout(r, 20))
  assert.ok(!h.prompts.some((p) => p.text === 'B'))
  assert.deepEqual(h.runsOf(other.id).map((r) => r.status), ['done'])
  h.cleanup()
})

test('stop before a dispatched run\'s turn starts: its inbox item is removed; if it is claimed anyway, that turn is cancelled and nothing is recorded', async () => {
  const h = harness()
  const { runId: warm } = await h.ok('POST', '/mates/say', { id: 'mywork', text: '先开个会话' })
  await h.until(() => h.run(warm).status === 'done')
  const s = h.sessions.get('mywork-mate-mywork')
  // Put a dispatched run's message in the inbox without waking the session.
  const d = h.mw.store.create({ mateId: 'mywork', trigger: 'user', input: 'D' })
  const rpc = 'mywork-run-' + d.id + '.q'
  h.mw.store.update(d.id, { dispatched: true, handed: true, requestId: rpc })
  s.nextTurn.push({ id: rpc, role: 'user', content: [{ type: 'text', text: 'D' }], source: { kind: 'user', rpcId: rpc } })
  assert.equal(h.mw.mateView('mywork').state, 'working')
  await h.ok('POST', '/mates/stop', { id: 'mywork' })
  await h.until(() => h.removedItems.length === 1)
  assert.deepEqual([h.run(d.id).status, h.run(d.id).error, h.run(d.id).stopped, s.nextTurn.length, h.removedItems[0]], ['done', STOPPED, true, 0, rpc])
  assert.equal(h.mw.mateView('mywork').state, 'idle')
  // Claimed anyway (the withdrawal lost the race): the turn is cancelled and leaves no run behind.
  const e = h.mw.store.create({ mateId: 'mywork', trigger: 'user', input: 'E' })
  h.mw.store.update(e.id, { status: 'done', error: STOPPED, stopped: true })
  const before = h.runsOf('mywork').length
  const ev = (type, data) => h.mw.engine.onSessionEvent({ id: 'mywork-mate-mywork' }, { type, data })
  const cancels = h.cancels.length
  ev('turn/start', { turn: 40 })
  ev('user/message', { role: 'user', content: [{ type: 'text', text: 'E' }], source: { kind: 'user', rpcId: 'mywork-run-' + e.id + '.z' } })
  ev('assistant/message', { message: { content: [{ type: 'text', text: '被停了还在说' }] } })
  ev('turn/end', { turn: 40, reason: { kind: 'aborted' } })
  assert.equal(h.cancels.length, cancels + 1)
  assert.equal(h.runsOf('mywork').length, before)
  assert.deepEqual(h.run(e.id).activity, [])
  h.cleanup()
})

test('a message after mywork_ask but before the turn ends is the answer: the run does not park on the question', async () => {
  const h = harness()
  const asked = gate()
  const go = gate()
  h.scripts.push(async (t) => { t.tool('mywork_ask', { question: '发给谁？' }); asked.open(); await go.promise })
  h.scripts.push((t) => { assert.deepEqual(t.texts, ['回答：张三']); t.say('已发给张三。') })
  const { runId } = await h.ok('POST', '/mates/say', { id: 'mywork', text: '把周报发出去' })
  await asked.promise
  const said = await h.ok('POST', '/mates/say', { id: 'mywork', text: '张三' })
  assert.deepEqual([said.mode, said.runId], ['answer', runId])
  const ask = h.run(runId).activity.find((a) => a.kind === 'ask')
  assert.deepEqual([ask.status, ask.answer], ['answered', '张三'])
  go.open()
  await h.until(() => h.run(runId).status === 'done')
  assert.equal(h.run(runId).error, ''); assert.equal(pendingAsk(h.run(runId)), null)
  const run = h.mw.runView(h.run(runId))
  assert.deepEqual(run.activity.filter((a) => a.kind === 'user').map((a) => [a.text, a.askId]), [['张三', ask.id]])
  assert.equal(run.activity.filter((a) => a.kind === 'text').pop().text, '已发给张三。')
  assert.deepEqual((await h.ok('GET', '/activity')).needs, [])
  h.cleanup()
})

test('a second message while the teammate\'s own user run is still queued joins that run: one run, one reply', async () => {
  const h = harness({ concurrency: 1 })
  const g = gate()
  h.scripts.push(async (t) => { await g.promise; t.say('A 完成') })
  h.scripts.push((t) => { assert.deepEqual(t.texts, ['查一下天气\n顺便看看明天']); t.say('今天晴，明天雨。') })
  const other = h.mw.mates.create({ name: '小二', description: '跑腿' })
  const a = await h.ok('POST', '/mates/say', { id: 'mywork', text: 'A' })
  await h.until(() => h.run(a.runId).status === 'running')
  const first = await h.ok('POST', '/mates/say', { id: other.id, text: '查一下天气' })
  const second = await h.ok('POST', '/mates/say', { id: other.id, text: '顺便看看明天' })
  assert.deepEqual([second.mode, second.runId], ['steer', first.runId])
  g.open()
  await h.until(() => h.run(first.runId).status === 'done')
  assert.equal(h.runsOf(other.id).length, 1)
  const run = h.mw.runView(h.run(first.runId))
  assert.equal(run.input, '查一下天气')
  assert.deepEqual(run.activity.filter((x) => x.kind !== 'tool').map((x) => [x.kind, x.text]), [['user', '顺便看看明天'], ['text', '今天晴，明天雨。']])
  h.cleanup()
})

test('a message while the own user run is handed over but its turn has not started is steered into that run', async () => {
  const h = harness()
  const { runId: warm } = await h.ok('POST', '/mates/say', { id: 'mywork', text: '先开个会话' })
  await h.until(() => h.run(warm).status === 'done')
  const s = h.sessions.get('mywork-mate-mywork')
  const d = h.mw.store.create({ mateId: 'mywork', trigger: 'user', input: '写个清单' })
  const rpc = 'mywork-run-' + d.id + '.q'
  h.mw.store.update(d.id, { dispatched: true, handed: true, requestId: rpc })
  s.nextTurn.push({ id: rpc, role: 'user', content: [{ type: 'text', text: '写个清单' }], source: { kind: 'user', rpcId: rpc } })
  h.scripts.push((t) => { assert.deepEqual(t.texts, ['要带日期', '写个清单']); t.say('清单好了，带日期。') })
  const said = await h.ok('POST', '/mates/say', { id: 'mywork', text: '要带日期' })
  assert.deepEqual([said.mode, said.runId], ['steer', d.id])
  assert.equal(h.prompts[h.prompts.length - 1].mode, 'steer')
  await h.until(() => h.run(d.id).status === 'done')
  assert.equal(h.runsOf('mywork').length, 2)
  assert.deepEqual(h.mw.runView(h.run(d.id)).activity.map((x) => [x.kind, x.text]), [['user', '要带日期'], ['text', '清单好了，带日期。']])
  h.cleanup()
})

test('the removal event names the teammate that was removed', async () => {
  const h = harness()
  const { mate } = await h.ok('POST', '/mates/create', { description: '临时帮忙', name: '临时' })
  await h.until(() => h.runsOf(mate.id).every((r) => r.status === 'done'))
  const seen = []
  h.mw.api.on((p) => seen.push(p))
  await h.ok('POST', '/mates/remove', { id: mate.id })
  const removed = seen.find((p) => p.kind === 'mate' && p.removed)
  assert.deepEqual(removed.mate, { id: mate.id })
  assert.ok(h.events.some((p) => p.kind === 'mate' && p.removed && p.mate && p.mate.id === mate.id))
  h.cleanup()
})

test('MyWork ships with a daily morning brief, created once; deleting it is remembered', async () => {
  const h = harness()
  await h.until(() => h.mw.routines.forMate('mywork').some((r) => r.title === '晨报'))
  const brief = h.mw.routines.forMate('mywork').find((r) => r.title === '晨报')
  assert.deepEqual(brief.schedule, { type: 'daily', time: '08:40' })
  assert.match(brief.input, /今天的会/)
  assert.ok(existsSync(join(h.dir, 'mywork', 'defaults.json')))
})

test('any file in a teammate folder opens by a signed link; tampered or escaping links are refused; HTML is sandboxed', async () => {
  const h = harness()
  const dir = join(h.dir, 'mywork', 'mates', 'mywork')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'report.html'), '<h1>hi</h1>')
  writeFileSync(join(dir, 'chart.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]))
  const link = (await h.ok('GET', '/mates/link', { id: 'mywork', path: 'report.html' }))
  assert.match(link.url, /^\/mywork-tasks\/files\/raw\?/)
  const serve = (url) => new Promise((resolve) => {
    const chunks = []; const res = { headers: {}, status: 0, writeHead(s, hd) { this.status = s; Object.assign(this.headers, hd || {}) }, write(c) { chunks.push(Buffer.from(c)) }, end(c) { if (c) chunks.push(Buffer.from(c)); resolve({ status: this.status, headers: this.headers, body: Buffer.concat(chunks).toString() }) }, on() {}, once() {}, emit() {}, removeListener() {} }
    h.mw.api.serveFile({ url }, res)
  })
  const ok = await serve(link.url)
  assert.equal(ok.status, 200); assert.match(ok.headers['content-type'], /text\/html/); assert.match(ok.headers['content-security-policy'], /sandbox/); assert.equal(ok.body, '<h1>hi</h1>')
  assert.equal((await serve(link.url.replace(/sig=[^&]+/, 'sig=AAAA'))).status, 403)
  assert.equal((await serve(link.url.replace('report.html', 'chart.png'))).status, 403) // the signature covers the path
  assert.equal((await h.call('GET', '/mates/link', { id: 'mywork', path: '../../mates.json' })).status, 400)
  const img = await h.ok('GET', '/mates/link', { id: 'mywork', path: 'chart.png' })
  assert.equal(img.mime, 'image/png')
})

test('a teammate folder lists the tables it keeps however many newer files there are, and the newest 30 of the rest', async () => {
  const h = harness()
  const dir = join(h.dir, 'mywork', 'mates', 'mywork')
  mkdirSync(dir, { recursive: true })
  const old = new Date(Date.now() - 3 * 86400000)
  writeFileSync(join(dir, '信源表.csv'), '类型,名称\nGitHub,Trending\n')
  utimesSync(join(dir, '信源表.csv'), old, old)
  for (let i = 0; i < 40; i++) writeFileSync(join(dir, `raw-${i}.html`), '<p>' + i + '</p>')
  const { items } = await h.ok('GET', '/mates/folder', { id: 'mywork' })
  assert.ok(items.some((f) => f.name === '信源表.csv'), 'the table older than 40 fresh files is still listed')
  assert.equal(items.filter((f) => /\.html$/.test(f.name)).length, 30)
})
