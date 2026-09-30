/**
 * dsh-mywork-tasks — run engine: one task = one dsh session, driven headlessly.
 *
 * The recipe mirrors @michengai/dsh-automation's executor (the only other plugin
 * that runs sessions without a client): create an agent outside any initiator
 * scope, mount the agent preset, pin provider/model, set the permission preset
 * and approval policy to unattended, attach the session to a workspace, then
 * hand it the composed prompt and wait for idle. The global `session/event`
 * stream feeds the task's steps (tool/call) and activity (messages, tool calls
 * and results); the final assistant text is the summary; `deliver` tool calls
 * create deliverables. A second, read-only session then verifies the
 * deliverables against the task (phase 3) and stamps each with a verdict.
 *
 * 找人 (design/v2/TEAMMATES.md §2.7) is end-of-turn, not a held promise: the
 * `mywork_ask` tool writes a pending ask entry and tells the model to end its
 * turn; finish() sees the pending ask and parks the task as `waiting` (session
 * kept, no verification, no failure, no slot, no timer). POST /answer marks it
 * answered and resumes through say() — the same session-controller path a
 * finished task's follow-up uses. 24 h without an answer resumes it on its own
 * assumptions; a restart leaves it waiting.
 *
 * No imports from @deepseek-ai/* here: this package is `link:`ed into the
 * profile, so those specifiers do not resolve from its real path. The two
 * helpers dsh-automation imports (createUserMessage, installModelSelection)
 * are tiny and inlined below.
 */
import { existsSync, mkdirSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { ACTIVITY_DETAIL_MAX, ASK_DETAIL_MAX, ASK_EXPIRY_MS, ASK_KINDS, ASK_MAX_PER_TASK, ASK_OPTION_MAX, ASK_OPTIONS_MAX, ASK_OPTIONS_MIN, ASK_QUESTION_MAX, myworkDir, pendingAsk, titleOf, ts } from './store.js'
import { defaultVerifyPrompt, parseVerdict, stepNameFor } from './scenarios.js'
import { changedVerdict, recordDays, routinePrompt, wantsRecord } from './routines.js'

const CANCEL_CONVERGENCE_MS = 15000
const VERIFY_TIMEOUT_MS = 5 * 60000
const TASK_PREFIX = 'mywork-task-'
const VERIFY_PREFIX = 'mywork-verify-'

/** @deepseek-ai/dsh-llm createUserMessage: identified, frozen user message. */
export function userMessage(text, source) {
  return Object.freeze({ id: randomUUID(), role: 'user', content: [{ type: 'text', text }], source: Object.freeze({ ...source }) })
}

/** @deepseek-ai/dsh-agent installModelSelection, minus the model-switch notice (a fresh session never switches). */
export function pinModelSelection(agentCtx, selection) {
  if (!selection || typeof agentCtx.on !== 'function') return () => {}
  const state = { current: selection, assembled: undefined }
  const d1 = agentCtx.on('system-prompt/assemble', async (_assembly, _context, next) => {
    const assembled = await next()
    state.assembled = state.current
    return { ...assembled, variables: { ...assembled.variables, provider: selection.provider, model: selection.model } }
  })
  const d2 = agentCtx.on('agent/request', async (_payload, next) => {
    const resolved = await next()
    if (state.assembled === undefined) return resolved
    const { reasoningEffort: _inherited, ...rest } = resolved
    return { ...rest, provider: selection.provider, model: selection.model, ...(selection.reasoningEffort === undefined ? {} : { reasoningEffort: selection.reasoningEffort }) }
  })
  return () => { d1(); d2() }
}

function settlesWithin(promise, ms) {
  let timer
  return Promise.race([promise.then(() => true, () => false), new Promise((r) => { timer = setTimeout(() => r(false), ms) })]).finally(() => clearTimeout(timer))
}

export function assistantText(event) {
  const blocks = event && event.data && event.data.message && Array.isArray(event.data.message.content) ? event.data.message.content : []
  return blocks.filter((b) => b && b.type === 'text' && typeof b.text === 'string').map((b) => b.text).join('\n').trim()
}

/** Short, single-line preview of a tool call's arguments for the activity stream. */
export function argsPreview(args) {
  if (args === undefined || args === null) return ''
  let text
  if (typeof args === 'string') text = args
  else if (typeof args === 'object') {
    const parts = []
    for (const [k, v] of Object.entries(args)) {
      if (v === undefined || v === null || v === '') continue
      const s = typeof v === 'string' ? v : JSON.stringify(v)
      parts.push(`${k}=${s.length > 80 ? s.slice(0, 79) + '…' : s}`)
    }
    text = parts.join(' ')
  } else text = String(args)
  text = text.replace(/\s+/g, ' ').trim()
  return text.length > ACTIVITY_DETAIL_MAX ? text.slice(0, ACTIVITY_DETAIL_MAX - 1) + '…' : text
}

/** Text of a tool/result event (first text block), for the activity stream. */
export function resultPreview(event) {
  const message = event && event.data && event.data.message
  const blocks = message && Array.isArray(message.content) ? message.content : []
  const text = blocks.filter((b) => b && b.type === 'text' && typeof b.text === 'string').map((b) => b.text).join(' ').replace(/\s+/g, ' ').trim()
  return text.length > ACTIVITY_DETAIL_MAX ? text.slice(0, ACTIVITY_DETAIL_MAX - 1) + '…' : text
}

/** Human error for a turn/end reason. */
export function reasonError(reason) {
  if (!reason) return '会话没有产生完整的一轮。'
  if (reason.kind === 'completed') return ''
  if (reason.kind === 'error') return (reason.error && reason.error.message) ? String(reason.error.message) : '模型调用失败。'
  return `会话以 ${String(reason.kind)} 结束。`
}

/** The exact words of 找人 (§2.7): what the tool answers, what it refuses with, and the line a resume is sent with. */
export const ASK_TEXT = {
  asked: '问题已提出。结束本轮，用户回答后会继续。',
  routine: '例行不能提问，把缺的写进结果',
  assistant: '今日助理不能提问',
  scenario: '这个场景不能提问，按合理假设做完并写明假设',
  limit: '这个任务已经问过两次，按合理假设做完并写明假设',
  notLive: 'mywork_ask 只能在正在运行的后台任务会话里调用。',
  expired: '用户 24 小时没有回答，按合理假设继续，并在结果里写明假设',
  answerPrefix: '回答：',
}
/** Fixed option sets: an approval is 允许一次 / 拒绝, a takeover ends with 我做完了. */
export const APPROVAL_OPTIONS = ['允许一次', '拒绝']
export const TAKEOVER_OPTIONS = ['我做完了']
const clipTo = (s, n) => { const t = String(s === undefined || s === null ? '' : s).replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n) : t }

/**
 * Validate and hard-trim the arguments of mywork_ask into an ask entry's fields. Throws (a tool error) when the kind is
 * unknown or a choice has the wrong number of options. Question ≤120 chars, options 2–4 × ≤12 chars, detail ≤500 chars.
 */
export function normalizeAsk(args) {
  const a = args && typeof args === 'object' ? args : {}
  const question = clipTo(a.question, ASK_QUESTION_MAX)
  if (!question) throw new Error('question 不能为空。')
  const askKind = a.askKind === undefined || a.askKind === null || a.askKind === '' ? 'text' : String(a.askKind)
  if (!ASK_KINDS.includes(askKind)) throw new Error(`askKind 只能是 ${ASK_KINDS.join(' / ')}。`)
  let options = []
  if (askKind === 'choice') {
    const seen = new Set()
    for (const o of Array.isArray(a.options) ? a.options : []) { const s = clipTo(o, ASK_OPTION_MAX); if (s && !seen.has(s)) { seen.add(s); options.push(s) } }
    if (options.length < ASK_OPTIONS_MIN || options.length > ASK_OPTIONS_MAX) throw new Error(`choice 需要 ${ASK_OPTIONS_MIN} 到 ${ASK_OPTIONS_MAX} 个不同的选项（每个 ≤${ASK_OPTION_MAX} 字）。`)
  } else if (askKind === 'approval') options = APPROVAL_OPTIONS.slice()
  else if (askKind === 'takeover') options = TAKEOVER_OPTIONS.slice()
  const detailRaw = typeof a.detail === 'string' ? a.detail.trim() : ''
  const detail = detailRaw.length > ASK_DETAIL_MAX ? detailRaw.slice(0, ASK_DETAIL_MAX - 1) + '…' : detailRaw
  return { question, askKind, options, detail }
}

/**
 * The answer as stored and as told to the model. approval: true / 允许一次 / allow → 允许, false / deny → 拒绝, anything
 * else the person typed is kept (「先改一下措辞」 is an answer too). takeover: empty or true → 我做完了. Others: the text.
 */
export function answerText(ask, raw) {
  const kind = ask && ask.askKind
  if (kind === 'approval') {
    if (raw === true) return '允许'
    if (raw === false) return '拒绝'
    const s = String(raw === undefined || raw === null ? '' : raw).trim()
    if (/^(允许一次|允许|同意|可以|allow|yes|ok|y)$/i.test(s)) return '允许'
    if (/^(拒绝|不允许|不行|不要|不同意|deny|no|n)$/i.test(s)) return '拒绝'
    return s
  }
  if (kind === 'takeover') { const s = raw === true || raw === undefined || raw === null ? '' : String(raw).trim(); return s || TAKEOVER_OPTIONS[0] }
  return String(raw === undefined || raw === null || raw === true ? '' : raw).trim()
}

/** An error the HTTP layer answers with 400 instead of 500. */
const bad = (message) => Object.assign(new Error(message), { status: 400 })

/**
 * @param {object} o
 *   ctx           plugin context with agents / sessions / workspaceRegistry / agentDefaultModel / agentPresets / permissionPresets
 *   store         TaskStore, deliverables DeliverableStore, scenarios registry
 *   config        { concurrency, timeoutMs, permission, agentPreset, cwd, verify }
 *   log(msg), emit(kind, task, deliverable?), controller() → dsh sessionController (for follow-up turns on finished tasks)
 */
export function createEngine({ ctx, store, deliverables, scenarios, config, log, emit, controller, capabilities, routines, todaySummary, workRecord }) {
  const live = new Map()     // taskId → run state
  const verifying = new Map() // taskId → { text }
  let pumping = false

  /**
   * Where tasks run: config.cwd, else a dedicated $DSH_HOME/mywork/workbench directory that is
   * registered as a workspace on first use. Never a code repository the user happens to have
   * open: a task with workspace-write permission would otherwise leave files in it.
   */
  async function resolveWorkspace() {
    const registry = ctx.workspaceRegistry
    const dir = config.cwd || join(myworkDir(), 'workbench')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    return (await registry.resolveByPath(dir)) || registry.create(dir, 'MyWork 工作台')
  }

  /**
   * Create one headless session and return { agent, handle, workspace }.
   * The caller owns the handle and disposes it.
   */
  async function openSession({ sessionId, selection, agentPreset, permission }) {
    const workspace = await resolveWorkspace()
    // A scenario may name its own preset (the assistant's tool-less one); fall back to the configured preset when the host cannot resolve it.
    if (agentPreset && agentPreset !== config.agentPreset && typeof ctx.agentPresets.resolve === 'function') {
      try { await ctx.agentPresets.resolve(agentPreset) } catch (e) { log(`agent preset ${agentPreset} unavailable (${e && e.message}); using ${config.agentPreset || 'default'}`); agentPreset = config.agentPreset }
    }
    const handle = await ctx.agents.withoutInitiator(() => ctx.agents.create({
      sessionId,
      meta: { cwd: workspace.path, ...(agentPreset ? { agentPreset } : {}) },
      agentOptions: { provider: selection.provider, model: selection.model },
      setup: async (agentCtx, created) => {
        await ctx.agentPresets.mount(agentCtx, agentPreset)
        pinModelSelection(agentCtx, selection)
        const agent = created || agentCtx.agent
        if (!agent) throw new Error('task setup has no scoped agent')
        try { ctx.permissionPresets.set(agent.session, permission) } catch (e) { log(`permission preset ${permission} not applied: ${e && e.message}`) }
        agent.session.append('approval/policy', { policy: 'never' })
      },
    }))
    await handle.agent.whenIdle()
    try { await workspace.attachSession(sessionId) } catch (e) { log(`attachSession: ${e && e.message}`) }
    return { agent: handle.agent, handle, workspace }
  }

  /** A routine run stays quiet when it reports 变化：无. A report routine (日报 / 周报) is never quiet: the report is the point. */
  function quietFor(task, state) {
    const routine = routines && task.routineId ? routines.get(task.routineId) : null
    if (routine && wantsRecord(routine)) return false
    return changedVerdict(state.text) === false
  }

  function rename(agent, title) {
    try { const titles = ctx.get('sessionTitle'); if (titles && typeof titles.rename === 'function') titles.rename(agent.session, title) } catch {}
  }

  function selectionFor(scenario) {
    const selection = (scenario && scenario.model) || ctx.agentDefaultModel.currentSelection()
    if (!selection || !selection.provider || !selection.model) throw new Error('没有可用的模型：先在设置里配置模型和 API key。')
    return selection
  }

  async function run(task) {
    const scenario = scenarios.resolve(task.scenario)
    const sessionId = TASK_PREFIX + task.id
    const state = { handle: null, started: false, text: '', reason: undefined, cancelled: false, timedOut: false, cancel: () => { state.cancelled = true; if (state.handle) state.handle.agent.cancel({ kind: 'hook', reason: 'cancelled by user' }) } }
    live.set(task.id, state)
    let timer
    try {
      const selection = selectionFor(scenario)
      store.update(task.id, { sessionId })
      const opened = await openSession({ sessionId, selection, agentPreset: (scenario && scenario.agentPreset) || config.agentPreset || undefined, permission: (scenario && scenario.permission) || config.permission })
      state.handle = opened.handle
      const { agent } = opened
      if (state.cancelled) { finish(task.id, state); return }
      rename(agent, '任务 · ' + task.title)
      state.started = true
      store.setStatus(task.id, 'running', { startedAt: new Date().toISOString() })
      emit('started', store.get(task.id))
      let request = task.input
      if (task.routineId && routines) {
        // A routine run is told what the previous run delivered and must lead with 变化.
        const routine = routines.get(task.routineId)
        const previousRun = routine ? routine.runs.find((r) => r.taskId && r.taskId !== task.id && r.deliverableId) : null
        const previous = previousRun ? deliverables.get(previousRun.deliverableId) : null
        const record = routine && wantsRecord(routine) && typeof workRecord === 'function' ? workRecord(recordDays(routine)) : ''
        if (record) store.update(task.id, { material: record, report: true }) // the verifier must see the same record, or every fact in the report looks unsourced
        if (routine) request = routinePrompt(routine, previous, record)
      }
      const prompt = scenario.compose(request, { date: new Date().toISOString().slice(0, 10), cwd: opened.workspace.path, task: { id: task.id, title: task.title }, capabilities: typeof capabilities === 'function' ? capabilities() : {}, today: { summary: typeof todaySummary === 'function' ? todaySummary() : '' } })
      agent.followup(userMessage(prompt, { kind: 'mywork-task', taskId: task.id, scenario: scenario.id }))
      const idle = agent.whenIdle()
      const deadline = new Promise((r) => { timer = setTimeout(() => { state.timedOut = true; agent.cancel({ kind: 'hook', reason: 'task timeout' }); r() }, config.timeoutMs) })
      await Promise.race([idle, deadline])
      if ((state.timedOut || state.cancelled) && !(await settlesWithin(idle, CANCEL_CONVERGENCE_MS))) log(`task ${task.id}: cancel did not converge`)
      clearTimeout(timer)
      try { await ctx.sessions.flush(agent.session) } catch {}
      finish(task.id, state)
    } catch (e) {
      clearTimeout(timer)
      finish(task.id, state, e instanceof Error ? e.message : String(e))
    } finally {
      live.delete(task.id)
      try { if (state.handle) state.handle.dispose() } catch {}
      pump()
    }
  }

  function finish(taskId, state, thrown) {
    const t = store.get(taskId)
    if (!t) return
    store.endSteps(taskId)
    // A run that never reached its first turn left no session behind: drop the id so 「过程」 does not point at nothing.
    if (!state.started) store.update(taskId, { sessionId: '' })
    const scenario = scenarios.resolve(t.scenario)
    // deliverable: true = the scenario promised a document (missing one is a failure, the text fills in);
    // 'auto' (default) = the agent decides, an answer in the stream is a fine outcome; false = never.
    const mode = scenario && scenario.deliverable !== undefined ? scenario.deliverable : 'auto'
    const summary = state.text ? titleOf(state.text) : ''
    let error = thrown || (state.cancelled ? '已取消。' : state.timedOut ? '超过最长运行时间。' : reasonError(state.reason))
    const ask = pendingAsk(t)
    if (!error && ask) {
      // 找人 (§2.7): the turn ended on a question. Park the task: session kept (say() resumes it), no verification yet, not a
      // failure, no deliverable demanded. The concurrency slot and the deadline timer are released by the caller (run()'s
      // finally / finishFollowup) exactly as for a done task; pump() never counts a waiting task. `verifyFrom` remembers
      // which deliverables are still unverified so the eventual finish checks them (a resume's follow-up state starts there).
      store.setStatus(taskId, 'waiting', { error: '', finishedAt: '', verifyFrom: state.followup ? state.deliverablesBefore : 0 })
      log(`task ${taskId} waiting: ${ask.question}`)
      emit('waiting', store.get(taskId))
      return
    }
    // A run that failed while a question was open: the question is moot, do not leave it dangling on a failed task.
    if (error && ask) store.settleAsk(taskId, 'expired')
    if (!error && mode === true && t.deliverableIds.length === 0 && state.text) {
      const d = deliverables.create({ taskId, title: t.title, kind: 'markdown', scenario: t.scenario, markdown: state.text })
      store.update(taskId, (x) => { x.deliverableIds.push(d.id) })
      emit('deliverable', store.get(taskId), d)
    }
    if (!error && mode === true && store.get(taskId).deliverableIds.length === 0) error = '没有产出交付物。'
    // Follow-up turns only re-verify when they produced a new deliverable.
    const newDeliverables = state.followup ? store.get(taskId).deliverableIds.length > state.deliverablesBefore : store.get(taskId).deliverableIds.length > 0
    const wantVerify = !error && config.verify && newDeliverables && !(scenario && scenario.verify === false)
    if (wantVerify) {
      store.setStatus(taskId, 'verifying', { summary: summary || '已完成', ...(t.routineId ? { quiet: quietFor(t, state) } : {}) })
      emit('verifying', store.get(taskId))
      verify(taskId).catch((e) => log(`verify ${taskId} crashed: ${e && e.message}`))
      return
    }
    store.setStatus(taskId, 'done', { finishedAt: new Date().toISOString(), error, summary: summary || (error ? '' : '已完成'), ...(t.routineId ? { quiet: quietFor(t, state) } : {}) })
    settleRoutine(taskId)
    log(`task ${taskId} ${error ? 'failed: ' + error : 'done'}`)
    emit('done', store.get(taskId))
  }

  /** Write the run outcome back onto its routine (receipt + what it delivered, for the next run). */
  function settleRoutine(taskId) {
    const t = store.get(taskId)
    if (!t || !t.routineId || !routines) return
    try { routines.markRun(t.routineId, '', { taskId, deliverableId: t.deliverableIds[t.deliverableIds.length - 1] || '', changed: t.quiet === true ? false : t.quiet === false ? true : null, error: t.error || '' }) } catch (e) { log('routine receipt: ' + (e && e.message)) }
  }

  /** Second session: read-only check of the deliverables against the task; stamps each deliverable. */
  async function verify(taskId) {
    const t = store.get(taskId)
    if (!t) return
    const docs = deliverables.forTask(taskId)
    const scenario = scenarios.resolve(t.scenario)
    const state = { text: '', handle: null }
    verifying.set(taskId, state)
    let timer
    let verdict = null
    let failure = ''
    try {
      const selection = (scenario && scenario.verifyModel) || selectionFor(scenario)
      const prompt = typeof (scenario && scenario.verifyPrompt) === 'function' ? scenario.verifyPrompt(t, docs, t.activity || []) : defaultVerifyPrompt(t, docs, t.activity || [])
      const sessionId = VERIFY_PREFIX + taskId + '-' + Date.now().toString(36)
      const opened = await openSession({ sessionId, selection, agentPreset: (scenario && scenario.agentPreset) || config.agentPreset || undefined, permission: 'read-only' })
      state.handle = opened.handle
      rename(opened.agent, '核验 · ' + t.title)
      opened.agent.followup(userMessage(prompt, { kind: 'mywork-verify', taskId }))
      const idle = opened.agent.whenIdle()
      const deadline = new Promise((r) => { timer = setTimeout(() => { opened.agent.cancel({ kind: 'hook', reason: 'verify timeout' }); r() }, VERIFY_TIMEOUT_MS) })
      await Promise.race([idle, deadline])
      clearTimeout(timer)
      try { await ctx.sessions.flush(opened.agent.session) } catch {}
      verdict = parseVerdict(state.text)
      if (!verdict) failure = state.text ? '核验员没有给出可解析的结论。' : '核验会话没有回复。'
      store.update(taskId, { verifySessionId: sessionId })
    } catch (e) {
      clearTimeout(timer)
      failure = e instanceof Error ? e.message : String(e)
    } finally {
      verifying.delete(taskId)
      try { if (state.handle) state.handle.dispose() } catch {}
    }
    const stamp = verdict ? { ...verdict, at: new Date().toISOString() } : { passed: null, checked: 0, issues: 0, notes: '核验失败：' + failure, at: new Date().toISOString() }
    for (const d of docs) deliverables.update(d.id, { verification: stamp })
    store.setStatus(taskId, 'done', { finishedAt: new Date().toISOString(), error: '', verification: stamp })
    settleRoutine(taskId)
    log(`task ${taskId} done, verified: ${verdict ? (verdict.passed ? 'passed' : 'issues') : 'unavailable'}`)
    emit('done', store.get(taskId))
  }

  /** Start queued tasks while there is room. A waiting task (§2.7) holds no slot: nothing runs for it until it is answered. */
  function pump() {
    if (pumping) return
    pumping = true
    try {
      const running = store.items.filter((t) => t.status === 'running' || t.status === 'delivering' || (t.status === 'queued' && live.has(t.id)))
      let room = Math.max(1, Number(config.concurrency) || 2) - running.length
      for (const t of store.items) {
        if (room <= 0) break
        if (t.status !== 'queued' || live.has(t.id)) continue
        room -= 1
        run(t).catch((e) => log(`task ${t.id} crashed: ${e && e.message}`))
      }
    } finally { pumping = false }
  }

  /** Global session/event listener: advance steps, record activity, capture the final text. */
  function onSessionEvent(session, event) {
    try {
      const id = session && session.id !== undefined ? String(session.id) : ''
      if (!event || typeof event.type !== 'string') return
      if (id.startsWith(VERIFY_PREFIX)) {
        const taskId = id.slice(VERIFY_PREFIX.length).replace(/-[a-z0-9]+$/, '')
        const v = verifying.get(taskId)
        if (v && event.type === 'assistant/message') { const text = assistantText(event); if (text) v.text = text }
        return
      }
      if (!id.startsWith(TASK_PREFIX)) return
      const taskId = id.slice(TASK_PREFIX.length)
      const state = live.get(taskId)
      if (!state) return
      if (event.type === 'tool/call') {
        const tool = event.data && event.data.name ? String(event.data.name) : ''
        const scenario = scenarios.resolve((store.get(taskId) || {}).scenario)
        store.step(taskId, stepNameFor(tool, scenario && scenario.toolStepMap), tool)
        store.activity(taskId, { kind: 'tool', name: tool, detail: argsPreview(event.data && event.data.arguments) })
        emit('step', store.get(taskId))
        return
      }
      if (event.type === 'tool/result') { store.activityResult(taskId, !(event.data && event.data.error), resultPreview(event)); return }
      if (event.type === 'assistant/message') {
        const text = assistantText(event)
        if (text) { state.text = text; store.activity(taskId, { kind: 'text', text: text.length > 2000 ? text.slice(0, 1999) + '…' : text }) }
        return
      }
      if (event.type === 'turn/end') { state.reason = event.data && event.data.reason; store.endSteps(taskId); if (state.followup) finishFollowup(taskId) }
    } catch (e) { log('event error: ' + (e && e.message)) }
  }

  /** Called by the deliver tool from inside a task session. */
  function deliver(sessionId, args) {
    const t = store.bySession(String(sessionId || ''))
    if (!t) throw new Error('deliver 只能在后台任务会话里调用（这个会话不属于任何任务）。')
    const d = deliverables.create({ taskId: t.id, title: args.title, kind: args.kind, scenario: t.scenario, markdown: args.markdown, data: args.data, summary: args.summary })
    // The tool/call event already recorded the 交付 step; only the status and the link change here.
    store.update(t.id, (x) => { x.deliverableIds.push(d.id); if (x.status === 'running') x.status = 'delivering' })
    emit('deliverable', store.get(t.id), d)
    return d
  }

  /**
   * Recover from a restart: tasks left running are finished as failed; queued ones start. A waiting task (§8.9 step 7)
   * stays waiting: nothing of it was in flight, and its persisted session resumes through say() whenever the answer comes.
   */
  function recover() {
    for (const t of store.items) {
      if (t.status === 'done' || t.status === 'queued' || t.status === 'waiting') continue
      if (t.status === 'verifying') { store.setStatus(t.id, 'done', { finishedAt: new Date().toISOString(), error: '', verification: { passed: null, checked: 0, issues: 0, notes: '核验被服务重启打断。', at: new Date().toISOString() } }); continue }
      store.setStatus(t.id, 'done', { finishedAt: new Date().toISOString(), error: '服务重启，任务中断。' })
    }
    pump()
  }

  function cancel(taskId) {
    const t = store.get(taskId)
    if (!t) throw new Error('task not found')
    if (t.status === 'done') return t
    const state = live.get(taskId)
    if (state) { state.cancel(); return store.get(taskId) }
    if (t.status === 'verifying') { const v = verifying.get(taskId); if (v && v.handle) v.handle.agent.cancel({ kind: 'hook', reason: 'cancelled by user' }); return t }
    // A waiting task is cancelled like a queued one; its open question expires with it, and the column hears about it.
    const wasWaiting = t.status === 'waiting'
    if (wasWaiting) store.settleAsk(taskId, 'expired')
    store.endSteps(taskId)
    const done = store.setStatus(taskId, 'done', { finishedAt: new Date().toISOString(), error: '已取消。' })
    if (wasWaiting) { log(`task ${taskId} cancelled while waiting`); emit('done', done) }
    return done
  }

  /**
   * Continue the conversation with a task: while it runs the text is queued into the live
   * agent; a finished or waiting task gets a new turn in its persisted session through dsh's
   * session controller (the same path the IM member uses), and the run engine treats that turn
   * like a run: steps, activity, deliveries, then done (or waiting) again.
   *
   * A waiting task with an open question takes whatever is said as the answer (§2.7: the same
   * path as POST /answer), so a reply typed into the composer is never refused. `extra` is merged
   * into the thread's user entry (askId of the question answered, auto for the 24 h resume).
   */
  async function say(taskId, text, extra) {
    const body = String(text || '').trim()
    if (!body) throw new Error('text is required')
    const t = store.get(taskId)
    if (!t) throw new Error('task not found')
    if (t.status === 'verifying') throw new Error('核验中，稍等一下再说。')
    if (t.status === 'waiting' && pendingAsk(t)) return answer(taskId, '', body)
    store.activity(taskId, { kind: 'user', text: body, ...(extra || {}) })
    const liveState = live.get(taskId)
    if (liveState && liveState.handle) {
      liveState.handle.agent.followup(userMessage(body, { kind: 'mywork-user', taskId }))
      emit('step', store.get(taskId))
      return store.get(taskId)
    }
    if (liveState) throw new Error('任务还在启动，稍等一下再说。')
    if (!t.sessionId) throw new Error('这个任务没有会话可以继续（它没跑起来）。')
    const control = typeof controller === 'function' ? controller() : null
    if (!control) throw new Error('session controller not available')
    // Resuming from waiting: the deliverables since `verifyFrom` were never verified (finish() skipped it), so they count as new.
    const wasWaiting = t.status === 'waiting'
    const deliverablesBefore = wasWaiting && Number.isInteger(t.verifyFrom) ? Math.min(t.verifyFrom, t.deliverableIds.length) : t.deliverableIds.length
    const state = { handle: null, followup: true, started: true, deliverablesBefore, text: '', reason: undefined, cancelled: false, timedOut: false, timer: null, cancel: () => { state.cancelled = true; finishFollowup(taskId) } }
    live.set(taskId, state)
    store.setStatus(taskId, 'running', { error: '', finishedAt: '' })
    emit('started', store.get(taskId))
    try {
      await control.prompt({ requestId: 'mywork-task-' + randomUUID(), sessionId: t.sessionId, mode: 'queue', content: [{ type: 'text', text: body }] }, AbortSignal.timeout(30000))
    } catch (e) {
      live.delete(taskId)
      // Nothing reached the session: a waiting task goes back to waiting (the person can try again), a finished one back to done.
      if (wasWaiting) store.setStatus(taskId, 'waiting', { error: '', finishedAt: '' })
      else store.setStatus(taskId, 'done', { finishedAt: new Date().toISOString(), error: '' })
      throw new Error('没能把话送进会话：' + (e instanceof Error ? e.message : String(e)))
    }
    state.timer = setTimeout(() => { state.timedOut = true; finishFollowup(taskId) }, config.timeoutMs)
    return store.get(taskId)
  }

  /**
   * 找人 (§2.7), the tool side. Called by mywork_ask from inside a running task session: resolves the task, refuses where
   * asking is not allowed (routine runs, the 今日 assistant, scenarios with ask: false, a third question), then writes the
   * pending ask entry (an older pending one is superseded). The model is told to end its turn; finish() does the rest.
   */
  function ask(sessionId, args) {
    const t = store.bySession(String(sessionId || ''))
    if (!t) throw new Error('mywork_ask 只能在后台任务会话里调用（这个会话不属于任何任务）。')
    if (t.scenario === 'assistant') throw new Error(ASK_TEXT.assistant)
    if (t.source === 'routine' || t.routineId) throw new Error(ASK_TEXT.routine)
    const scenario = scenarios.resolve(t.scenario)
    if (scenario && scenario.ask === false) throw new Error(ASK_TEXT.scenario)
    if (!live.has(t.id)) throw new Error(ASK_TEXT.notLive)
    if (store.askCount(t.id) >= ASK_MAX_PER_TASK) throw new Error(ASK_TEXT.limit)
    const fields = normalizeAsk(args)
    const entry = store.ask(t.id, fields)
    log(`task ${t.id} asks (${fields.askKind}): ${fields.question}`)
    emit('step', store.get(t.id))
    return entry
  }

  /**
   * Answer the newest pending ask of a waiting task and resume it (POST /answer). `askId` may be empty (= the newest);
   * a stale id is refused so two open cards cannot answer each other's question. The answer is stored on the ask entry and
   * sent into the session as 「回答：<answer>」 through say(); should that fail, the ask reopens and nothing has happened.
   * Errors carry status 400 where the request, not the server, was wrong.
   */
  async function answer(taskId, askId, raw) {
    const t = store.get(taskId)
    if (!t) throw new Error('task not found')
    const ask = pendingAsk(t)
    if (!ask || t.status !== 'waiting') throw bad('这个任务没有等着回答的问题。')
    if (askId && String(askId) !== ask.id) throw bad('这个问题已经不是当前的问题了。')
    const text = answerText(ask, raw)
    if (!text) throw bad('回答不能为空。')
    store.settleAsk(taskId, 'answered', text)
    try {
      return await say(taskId, ASK_TEXT.answerPrefix + text, { askId: ask.id })
    } catch (e) {
      store.reopenAsk(taskId, ask.id)
      throw e
    }
  }

  /**
   * 24-hour rule: a waiting task nobody answered resumes on its own assumptions; the ask is marked expired first so the
   * card closes. Run from the 30 s scheduler tick. `now` is injectable for tests. Returns the ids it resumed. A resume
   * that cannot reach the session ends the task as failed rather than leaving a waiting row with no question on it.
   */
  async function expireAsks(now = Date.now()) {
    const resumed = []
    for (const t of store.items.slice()) {
      if (t.status !== 'waiting') continue
      const ask = pendingAsk(t)
      if (!ask || ts(ask.at) > now - ASK_EXPIRY_MS) continue
      store.settleAsk(t.id, 'expired')
      try {
        await say(t.id, ASK_TEXT.expired, { auto: true, askId: ask.id })
        resumed.push(t.id)
        log(`task ${t.id}: question expired after 24 h, resumed on assumptions`)
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        log(`task ${t.id}: question expired but could not resume: ${message}`)
        if (store.get(t.id) && store.get(t.id).status === 'waiting') { store.endSteps(t.id); store.setStatus(t.id, 'done', { finishedAt: new Date().toISOString(), error: '等回答超过 24 小时，且没能继续会话：' + message }); emit('done', store.get(t.id)) }
      }
    }
    return resumed
  }

  function finishFollowup(taskId) {
    const state = live.get(taskId)
    if (!state || !state.followup) return
    clearTimeout(state.timer)
    live.delete(taskId)
    finish(taskId, state)
    pump()
  }

  /** Re-run verification for a finished task (manual). */
  function reverify(taskId) {
    const t = store.get(taskId)
    if (!t) throw new Error('task not found')
    if (t.status !== 'done' || t.deliverableIds.length === 0) throw new Error('只有已完成且有交付物的任务能核验')
    if (verifying.has(taskId)) return t
    store.setStatus(taskId, 'verifying')
    emit('verifying', store.get(taskId))
    verify(taskId).catch((e) => log(`verify ${taskId} crashed: ${e && e.message}`))
    return store.get(taskId)
  }

  return { pump, recover, cancel, deliver, reverify, say, ask, answer, expireAsks, onSessionEvent, isLive: (id) => live.has(id) }
}
