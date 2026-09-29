/**
 * dsh-mywork-tasks — run engine: one task = one dsh session, driven headlessly.
 *
 * The recipe mirrors @michengai/dsh-automation's executor (the only other plugin
 * that runs sessions without a client): create an agent outside any initiator
 * scope, mount the agent preset, pin provider/model, set the permission preset
 * and approval policy to unattended, attach the session to a workspace, then
 * hand it the composed prompt and wait for idle. Steps are derived from the
 * global `session/event` stream (tool/call → step), the final assistant text is
 * the task summary, and `deliver` tool calls create deliverables.
 *
 * No imports from @deepseek-ai/* here: this package is `link:`ed into the
 * profile, so those specifiers do not resolve from its real path. The two
 * helpers dsh-automation imports (createUserMessage, installModelSelection)
 * are tiny and inlined below.
 */
import { existsSync, mkdirSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { myworkDir, titleOf } from './store.js'
import { stepNameFor } from './scenarios.js'

const CANCEL_CONVERGENCE_MS = 15000

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

/** Human error for a turn/end reason. */
export function reasonError(reason) {
  if (!reason) return '会话没有产生完整的一轮。'
  if (reason.kind === 'completed') return ''
  if (reason.kind === 'error') return (reason.error && reason.error.message) ? String(reason.error.message) : '模型调用失败。'
  return `会话以 ${String(reason.kind)} 结束。`
}

/**
 * @param {object} o
 *   ctx           plugin context with agents / sessions / workspaceRegistry / agentDefaultModel / agentPresets / permissionPresets
 *   store         TaskStore, deliverables DeliverableStore, scenarios registry
 *   config        { concurrency, timeoutMs, permission, agentPreset, cwd }
 *   log(msg), emit(kind, task)
 */
export function createEngine({ ctx, store, deliverables, scenarios, config, log, emit }) {
  const live = new Map() // taskId → { handle, text: '', reason, cancel: fn }
  let pumping = false

  const sessionOf = (taskId) => 'mywork-task-' + taskId

  /** Pick the workspace tasks run in: config.cwd, else the first registered one, else $DSH_HOME/mywork/workbench. */
  async function resolveWorkspace() {
    const registry = ctx.workspaceRegistry
    if (config.cwd) {
      const found = await registry.resolveByPath(config.cwd)
      if (found) return found
      return registry.create(config.cwd, 'MyWork')
    }
    for (const ws of registry.list()) if ((await ws.status()) === 'ok') return ws
    const dir = join(myworkDir(), 'workbench')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    return (await registry.resolveByPath(dir)) || registry.create(dir, 'MyWork')
  }

  async function run(task) {
    const scenario = scenarios.resolve(task.scenario)
    const sessionId = sessionOf(task.id)
    const state = { handle: null, started: false, text: '', reason: undefined, cancelled: false, timedOut: false, cancel: () => { state.cancelled = true; if (state.handle) state.handle.agent.cancel({ kind: 'hook', reason: 'cancelled by user' }) } }
    live.set(task.id, state)
    let timer
    try {
      const workspace = await resolveWorkspace()
      const cwd = workspace.path
      const selection = (scenario && scenario.model) || ctx.agentDefaultModel.currentSelection()
      if (!selection || !selection.provider || !selection.model) throw new Error('没有可用的模型：先在设置里配置模型和 API key。')
      const agentPreset = (scenario && scenario.agentPreset) || config.agentPreset || undefined
      const permission = (scenario && scenario.permission) || config.permission
      store.update(task.id, { sessionId })
      state.handle = await ctx.agents.withoutInitiator(() => ctx.agents.create({
        sessionId,
        meta: { cwd, ...(agentPreset ? { agentPreset } : {}) },
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
      const { agent } = state.handle
      await agent.whenIdle()
      try { await workspace.attachSession(sessionId) } catch (e) { log(`attachSession: ${e && e.message}`) }
      try { const titles = ctx.get('sessionTitle'); if (titles && typeof titles.rename === 'function') titles.rename(agent.session, '任务 · ' + task.title) } catch {}
      state.started = true
      store.setStatus(task.id, 'running', { startedAt: new Date().toISOString() })
      emit('started', store.get(task.id))
      const prompt = scenario.compose(task.input, { date: new Date().toISOString().slice(0, 10), cwd, task: { id: task.id, title: task.title } })
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
    const summary = state.text ? titleOf(state.text) : ''
    let error = thrown || (state.cancelled ? '已取消。' : state.timedOut ? '超过最长运行时间。' : reasonError(state.reason))
    // A task that produced nothing but text still yields a deliverable: the text itself.
    if (!error && t.deliverableIds.length === 0 && state.text) {
      const d = deliverables.create({ taskId, title: t.title, kind: 'markdown', scenario: t.scenario, markdown: state.text })
      store.update(taskId, (x) => { x.deliverableIds.push(d.id) })
      emit('deliverable', store.get(taskId), d)
    }
    if (!error && store.get(taskId).deliverableIds.length === 0) error = '没有产出交付物。'
    store.setStatus(taskId, 'done', { finishedAt: new Date().toISOString(), error, summary: summary || (error ? '' : '已完成') })
    log(`task ${taskId} ${error ? 'failed: ' + error : 'done'}`)
    emit('done', store.get(taskId))
  }

  /** Start queued tasks while there is room. */
  function pump() {
    if (pumping) return
    pumping = true
    try {
      const running = store.items.filter((t) => t.status === 'running' || t.status === 'delivering' || t.status === 'verifying' || (t.status === 'queued' && live.has(t.id)))
      let room = Math.max(1, Number(config.concurrency) || 2) - running.length
      for (const t of store.items) {
        if (room <= 0) break
        if (t.status !== 'queued' || live.has(t.id)) continue
        room -= 1
        run(t).catch((e) => log(`task ${t.id} crashed: ${e && e.message}`))
      }
    } finally { pumping = false }
  }

  /** Global session/event listener: advance steps and capture the final text. */
  function onSessionEvent(session, event) {
    try {
      const id = session && session.id !== undefined ? String(session.id) : ''
      if (!id.startsWith('mywork-task-') || !event || typeof event.type !== 'string') return
      const taskId = id.slice('mywork-task-'.length)
      const state = live.get(taskId)
      if (!state) return
      if (event.type === 'tool/call') {
        const tool = event.data && event.data.name ? String(event.data.name) : ''
        const scenario = scenarios.resolve((store.get(taskId) || {}).scenario)
        store.step(taskId, stepNameFor(tool, scenario && scenario.toolStepMap), tool)
        emit('step', store.get(taskId))
        return
      }
      if (event.type === 'assistant/message') { const text = assistantText(event); if (text) state.text = text; return }
      if (event.type === 'turn/end') { state.reason = event.data && event.data.reason; store.endSteps(taskId) }
    } catch (e) { log('event error: ' + (e && e.message)) }
  }

  /** Called by the deliver tool from inside a task session. */
  function deliver(sessionId, args) {
    const t = store.bySession(String(sessionId || ''))
    if (!t) throw new Error('deliver 只能在后台任务会话里调用（这个会话不属于任何任务）。')
    const d = deliverables.create({ taskId: t.id, title: args.title, kind: args.kind, scenario: t.scenario, markdown: args.markdown, data: args.data })
    store.update(t.id, (x) => { x.deliverableIds.push(d.id); if (x.status === 'running') x.status = 'delivering' })
    store.step(t.id, '交付', 'deliver')
    emit('deliverable', store.get(t.id), d)
    return d
  }

  /** Recover from a restart: tasks left running are finished as failed; queued ones start. */
  function recover() {
    for (const t of store.items) if (t.status !== 'done' && t.status !== 'queued') store.setStatus(t.id, 'done', { finishedAt: new Date().toISOString(), error: '服务重启，任务中断。' })
    pump()
  }

  function cancel(taskId) {
    const t = store.get(taskId)
    if (!t) throw new Error('task not found')
    if (t.status === 'done') return t
    const state = live.get(taskId)
    if (state) { state.cancel(); return t }
    store.endSteps(taskId)
    return store.setStatus(taskId, 'done', { finishedAt: new Date().toISOString(), error: '已取消。' })
  }

  return { pump, recover, cancel, deliver, onSessionEvent, isLive: (id) => live.has(id) }
}
