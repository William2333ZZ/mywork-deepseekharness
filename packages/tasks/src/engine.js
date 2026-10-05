/**
 * dsh-mywork-tasks — run engine of the teammate model (design/v2/TEAMMATES.md §9.7).
 *
 * One teammate = one persistent dsh session, id 'mywork-mate-<mateId>'. The first use creates it with agents.create
 * (cwd = the teammate's folder, registered as a workspace; preset = the teammate's generated preset; model pinned;
 * permission preset and approval policy 'never' appended as durable events). Every message after that goes through
 * dsh's session controller: prompt({ requestId, sessionId, mode, content }), which resumes a cold session by id.
 *
 * Runs are driven by the session's own events, for every 'mywork-mate-' session at all times:
 *   turn/start … turn/end   one run (a run answered after an ask spans more than one turn)
 *   user/message            binds the turn to its run: our requestIds carry the run id ('mywork-run-<runId>.<n>');
 *                           a steer ('mywork-steer-<runId>.<n>') that missed its run's turn opens a continuation run;
 *                           a line typed into the session elsewhere (source kind 'user') opens a run of its own
 *   tool/call · tool/result steps and activity;  assistant/message → the reply text
 *   deliver / mywork_ask    resolved to the teammate's current run
 * A run is done at turn/end (or waiting when an ask is pending). Deliverables are verified afterwards in a second,
 * read-only session in the background; the stamp lands on the deliverables and on run.verification.
 *
 * Messages: while the teammate works on a user run a new message steers that run (mode 'steer'); while only a routine
 * or system run is active it waits and becomes the next run (mode 'queue', dispatched when the teammate is free);
 * while a run waits on an ask the text answers it. Per teammate one run is dispatched at a time (dsh serialises turns
 * anyway); across teammates at most config.concurrency run at once. A message while its own user run is still queued
joins that run (not dispatched yet: appended to its prompt; dispatched, turn not started: a steer claimed with it).
Stop = controller.cancel (keeps the inbox) of the bound run; with no run bound, the teammate's queued runs end instead
(a message already in the session inbox is removed from it, or its turn is cancelled the moment it starts).
 *
 * No imports from @deepseek-ai/* here: this package is `link:`ed into the profile, so those specifiers do not resolve
 * from its real path. The two helpers dsh-automation imports (createUserMessage, installModelSelection) are inlined.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'
import { ACTIVITY_DETAIL_MAX, ASK_DETAIL_MAX, ASK_EXPIRY_MS, ASK_KINDS, ASK_MAX_PER_TASK, ASK_OPTION_MAX, ASK_OPTIONS_MAX, ASK_OPTIONS_MIN, ASK_QUESTION_MAX, MATE_SESSION_PREFIX, pendingAsk, titleOf, ts } from './store.js'
import { defaultVerifyPrompt, parseVerdict, stepNameFor } from './scenarios.js'
import { changedVerdict, parseSchedule, recordDays, routinePrompt, stripVerdict, wantsRecord, wantsSchedule } from './routines.js'

const VERIFY_TIMEOUT_MS = 5 * 60000
const VERIFY_PREFIX = 'mywork-verify-'
export const RUN_RPC = 'mywork-run-'
export const STEER_RPC = 'mywork-steer-'
export const NUDGE_RPC = 'mywork-nudge-'
export const NUDGE_TEXT = '（MyWork 服务刚重启。接着处理排队的消息。）'
export const mateSessionId = (id) => MATE_SESSION_PREFIX + id
const rand = () => randomUUID().slice(0, 8)
/** The run id inside one of our request ids: '<prefix><runId>.<n>'. */
export function rpcRunId(rpc, prefix) { const body = String(rpc).slice(prefix.length); const i = body.lastIndexOf('.'); return i > 0 ? body.slice(0, i) : body }

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

export function assistantText(event) {
  const blocks = event && event.data && event.data.message && Array.isArray(event.data.message.content) ? event.data.message.content : []
  return blocks.filter((b) => b && b.type === 'text' && typeof b.text === 'string').map((b) => b.text).join('\n').trim()
}
/** Text of a user/message event (its data is the message itself). */
export function messageText(message) {
  const blocks = message && Array.isArray(message.content) ? message.content : []
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

/**
 * 做了告诉你 (PROACTIVE.md §5.2): what a tool call changes. filesTouched → the paths a file tool writes (write / edit /
 * multi_edit with file_path, apply_patch by its 「*** Update File:」 lines); outwardAct → 'send' (an IM message) or 'web'
 * (a click, typing or a form on a page) — things that leave the computer and cannot be taken back.
 */
export function filesTouched(tool, args) {
  const a = args && typeof args === 'object' ? args : {}
  const name = String(tool || '')
  if (/^(write|edit|multi_edit|multiedit|write_file|create_file)$/i.test(name)) {
    const p = a.file_path || a.path || a.filePath
    return typeof p === 'string' && p.trim() ? [p.trim()] : []
  }
  if (/^apply_patch$/i.test(name)) {
    const text = typeof a.patch === 'string' ? a.patch : typeof a.input === 'string' ? a.input : ''
    return [...text.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm)].map((m) => m[1].trim()).filter(Boolean)
  }
  return []
}
export function outwardAct(tool) {
  const name = String(tool || '')
  if (name === 'im_send') return 'send'
  if (/browser_(click|type|fill_form|fill|select_option|press_key|file_upload|drag|handle_dialog)$/.test(name)) return 'web'
  return ''
}
/** A file larger than this is not copied before a change: its line says 撤不回. */
export const UNDO_MAX_BYTES = 2 * 1024 * 1024
/** The content hash of a file (null when it is not there): undo refuses a file changed again since. */
export function hashOf(file) { try { return createHash('sha1').update(readFileSync(file)).digest('hex') } catch { return null } }

/** Human error for a turn/end reason. */
export function reasonError(reason) {
  if (!reason) return '会话没有产生完整的一轮。'
  if (reason.kind === 'completed') return ''
  if (reason.kind === 'aborted') return '已停止。'
  if (reason.kind === 'error') return (reason.error && reason.error.message) ? String(reason.error.message) : '模型调用失败。'
  return `会话以 ${String(reason.kind)} 结束。`
}

/** The exact words of 找人 (§2.7) and of the engine's refusals. */
export const ASK_TEXT = {
  asked: '问题已提出。结束本轮，用户回答后会继续。',
  routine: '例行不能提问，把缺的写进结果',
  system: '自我介绍时不能提问，把需要的写进介绍',
  limit: '这一轮已经问过两次，按合理假设做完并写明假设',
  notLive: 'mywork_ask 只能在同事正在干活的时候调用。',
  notMate: 'mywork_ask 只能在 MyWork 同事的会话里调用。',
  expired: '用户 24 小时没有回答，按合理假设继续，并在结果里写明假设',
  answerPrefix: '回答：',
}
export const INTERRUPTED = '服务重启，这一轮中断。'
export const STOPPED = '已停止。'
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

/** The hidden first message of a new teammate: it names itself if it has no name, sets up a timed duty, and says hello. */
export function introPrompt(mate) {
  const lines = ['（这句话是 MyWork 在你刚被创建时替用户发的，用户看不到它，只看得到你的回复。）']
  if (!mate.name) lines.push('你还没有名字：先调用 mywork_mate_update 给自己起一个 2 到 4 个汉字的名字（贴合你的职责；合适的话同时给一个一行的头衔），再往下做。')
  if (parseSchedule(mate.description)) lines.push('你的职责里带着时间：调用 mywork_routine_create 把它安排成你的例行（input 用职责里带时间的那句话），然后在介绍里用一句话说已经安排好了、什么时候。')
  lines.push('然后用两三句话向用户介绍自己：你怎么理解你的职责、接下来会怎么做、需要用户给你什么（资料、账号、偏好）。像同事第一次打招呼，不要标题和列表，不要交付文件，不要调用 mywork_ask。')
  return lines.join('\n')
}

/** An error the HTTP layer answers with 400 instead of 500. */
export const bad = (message) => Object.assign(new Error(message), { status: 400 })
export const notFound = (message) => Object.assign(new Error(message), { status: 404 })
const errorText = (e) => (e instanceof Error ? e.message : String(e))
const isNotFound = (e) => /not[-_ ]?found/i.test(String((e && (e.code || e.name)) || '') + ' ' + errorText(e))

/**
 * @param {object} o
 *   ctx           plugin context with agents / sessions / workspaceRegistry / agentDefaultModel / agentPresets / permissionPresets
 *   store         TaskStore (runs), deliverables DeliverableStore, mates MateStore, routines RoutineStore, scenarios registry
 *   config        { concurrency, timeoutMs, permission, agentPreset, verify, workbench }
 *   log(msg), emit(kind, run, extra?), controller() → dsh sessionController
 *   presetFor(mate) → Promise<preset id> (writes the teammate's generated preset), workRecord(days) → string
 *   afterTurn(mateId) → called at every turn/end of a teammate (the host re-links a rewritten preset there)
 */
export function createEngine({ ctx, store, deliverables, mates, routines, scenarios, config, log, emit, controller, presetFor, workRecord, afterTurn }) {
  const turns = new Map()     // mateId → { n, runId, discard, pending: [{ kind: 'steer'|'line', requestId?, fromRunId?, text }] }
  const live = new Map()      // runId → { text, timer, stopped, timedOut }
  const handles = new Map()   // mateId → agent handle from agents.create (kept for the process lifetime)
  const opening = new Map()   // mateId → Promise<sessionId>
  const verifying = new Map() // runId → { text, handle }
  let pumping = false
  let repaired = null         // run ids that were handed to a session inbox before the restart (repair() → recover())
  const cap = () => Math.max(1, Number(config.concurrency) || 2)
  const control = () => (typeof controller === 'function' ? controller() : null)
  const stepMap = () => (scenarios && typeof scenarios.stepMap === 'function' ? scenarios.stepMap() : {})

  function selectionFor() {
    const selection = ctx.agentDefaultModel.currentSelection()
    if (!selection || !selection.provider || !selection.model) throw new Error('没有可用的模型：先在设置里配置模型和 API key。')
    return selection
  }

  /** Create one headless session (agents.create) in `cwd`, registered as a workspace; the caller owns the handle. */
  async function openSession({ sessionId, cwd, workspaceName, selection, agentPreset, permission }) {
    const registry = ctx.workspaceRegistry
    if (!existsSync(cwd)) mkdirSync(cwd, { recursive: true })
    const workspace = (await registry.resolveByPath(cwd)) || (await registry.create(cwd, workspaceName || 'MyWork'))
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
        if (!agent) throw new Error('session setup has no scoped agent')
        try { ctx.permissionPresets.set(agent.session, permission) } catch (e) { log(`permission preset ${permission} not applied: ${e && e.message}`) }
        agent.session.append('approval/policy', { policy: 'never' })
      },
    }))
    await handle.agent.whenIdle()
    try { await workspace.attachSession(sessionId) } catch (e) { log(`attachSession: ${e && e.message}`) }
    return { handle, workspace }
  }

  function rename(agent, title) {
    try { const titles = ctx.get('sessionTitle'); if (titles && typeof titles.rename === 'function') titles.rename(agent.session, title) } catch {}
  }

  /** The teammate's session id, creating the session on first use. A persisted session is resumed by the controller. */
  async function ensureSession(mate) {
    if (mate.sessionId) return mate.sessionId
    if (opening.has(mate.id)) return opening.get(mate.id)
    const p = (async () => {
      const sessionId = mateSessionId(mate.id)
      let agentPreset = config.agentPreset
      try { if (typeof presetFor === 'function') agentPreset = await presetFor(mate) } catch (e) { log(`preset for ${mate.id} not written (${e && e.message}); using ${config.agentPreset}`) }
      try {
        const { handle } = await openSession({ sessionId, cwd: mate.dir, workspaceName: mate.name || '同事', selection: selectionFor(), agentPreset, permission: config.permission })
        handles.set(mate.id, handle)
        rename(handle.agent, mate.name || '同事')
      } catch (e) {
        // A session with this id may already exist (mates.json lost its stamp): the controller resumes it by id.
        if (!/exist|already|owned/i.test(errorText(e))) throw e
        log(`session ${sessionId} exists already; resuming it`)
      }
      mates.update(mate.id, { sessionId, permission: config.permission })
      log(`teammate ${mate.id} session ${sessionId} ready`)
      return sessionId
    })()
    opening.set(mate.id, p)
    try { return await p } finally { opening.delete(mate.id) }
  }

  /** Hand text to the teammate's session: mode 'queue' (its own next turn) or 'steer' (into the running turn). */
  async function sendPrompt(mateId, text, mode, requestId, retried) {
    const mate = mates.get(mateId)
    if (!mate) throw new Error('同事不存在了。')
    const sessionId = await ensureSession(mate)
    const c = control()
    try {
      if (c) await c.prompt({ requestId, sessionId, mode, content: [{ type: 'text', text }] }, AbortSignal.timeout(30000))
      else {
        const h = handles.get(mateId)
        if (!h) throw new Error('session controller not available')
        const m = userMessage(text, { kind: 'user', rpcId: requestId })
        if (mode === 'steer') h.agent.steer(m); else h.agent.followup(m)
      }
    } catch (e) {
      if (!retried && isNotFound(e) && !handles.has(mateId)) { mates.update(mateId, { sessionId: '' }); return sendPrompt(mateId, text, mode, requestId, true) }
      throw e
    }
  }

  function cancelSession(mateId) {
    try {
      const c = control()
      if (c && typeof c.cancel === 'function') { c.cancel({ sessionId: mateSessionId(mateId) }); return true }
      const h = handles.get(mateId)
      if (h) { h.agent.cancel({ kind: 'user' }, { keepInbox: true }); return true }
    } catch (e) { log(`cancel ${mateId}: ${errorText(e)}`) }
    return false
  }

  /** The teammate's live dsh agent (ctx.agents.get, else the handle this process created), or null when cold. */
  function liveAgent(mateId) {
    try { const a = ctx.agents && typeof ctx.agents.get === 'function' ? ctx.agents.get(mateSessionId(mateId)) : null; if (a) return a } catch {}
    const h = handles.get(mateId)
    return h ? h.agent : null
  }
  /** The pending inbox message (next turn or next step) that carries this request id, or null. */
  function inboxItem(agent, requestId) {
    const inbox = agent && agent.inbox
    if (!inbox || !requestId) return null
    const all = [...(Array.isArray(inbox.nextTurn) ? inbox.nextTurn : []), ...(Array.isArray(inbox.nextStep) ? inbox.nextStep : [])]
    return all.find((m) => m && m.source && m.source.rpcId === requestId) || null
  }

  /** The prompt a run is dispatched with: an answer / resume text, the intro, the routine's prompt, or the user's line. */
  function promptFor(run, mate) {
    if (run.pendingText) return run.pendingText
    // A prompt the host wrote for this run (a template's intro, a precheck's changes); a line you add while it waits follows it.
    if (run.prompt) return run.promptExtra ? run.prompt + '\n' + run.promptExtra : run.prompt
    if (run.trigger === 'system') return introPrompt(mate)
    if (run.trigger === 'routine' && run.routineId && routines) {
      const routine = routines.get(run.routineId)
      if (routine) {
        const previousRun = (routine.runs || []).find((r) => r.taskId && r.taskId !== run.id && r.deliverableId)
        const previous = previousRun ? deliverables.get(previousRun.deliverableId) : null
        const record = wantsRecord(routine) && typeof workRecord === 'function' ? workRecord(recordDays(routine), { schedule: wantsSchedule(routine) }) : ''
        if (record) store.update(run.id, { material: record, report: true }) // the verifier must see the same record
        return routinePrompt(routine, previous, record)
      }
    }
    return run.promptExtra ? run.input + '\n' + run.promptExtra : run.input
  }

  /** Hand a queued run to its teammate's session. The request id is kept on the run: recovery re-sends exactly it. */
  function dispatch(run) {
    const mate = mates.get(run.mateId)
    if (!mate) { store.setStatus(run.id, 'done', { finishedAt: new Date().toISOString(), error: '同事不存在了。' }); emit('done', store.get(run.id)); return }
    const requestId = RUN_RPC + run.id + '.' + rand()
    store.update(run.id, { dispatched: true, dispatchedAt: new Date().toISOString(), sessionId: mateSessionId(mate.id), requestId, handed: false })
    const text = promptFor(run, mate)
    sendPrompt(mate.id, text, 'queue', requestId).then(
      () => {
        const t = store.get(run.id)
        if (t && t.status === 'queued' && t.requestId === requestId) store.update(run.id, { handed: true })
        log(`run ${run.id} → ${mate.id} (${run.trigger})`)
      },
      (e) => dispatchFailed(run.id, e),
    )
  }

  /**
   * At a turn/end: a run handed to the session whose message is no longer pending in the inbox, yet never bound a turn,
   * was lost (a crash before the inbox splice was flushed). It is dispatched again with a fresh request id.
   */
  function recheckHanded(mateId) {
    const agent = liveAgent(mateId)
    if (!agent || !agent.inbox) return
    for (const r of store.items) {
      if (r.mateId !== mateId || r.status !== 'queued' || !r.dispatched || !r.handed) continue
      if (r.requestId && inboxItem(agent, r.requestId)) continue
      log(`run ${r.id}: its message is not in the session inbox; dispatching it again`)
      store.update(r.id, { dispatched: false, handed: false, requestId: '' })
    }
  }

  /** Nothing reached the session: an answer goes back to its question, anything else ends as failed. */
  function dispatchFailed(runId, e) {
    const t = store.get(runId)
    if (!t || t.status !== 'queued') return
    const message = errorText(e)
    log(`run ${runId} not delivered: ${message}`)
    if (t.resumeAskId) {
      store.reopenAsk(runId, t.resumeAskId)
      store.takeEntry(runId, (a) => a && a.kind === 'user' && a.askId === t.resumeAskId)
      store.setStatus(runId, 'waiting', { dispatched: false, pendingText: '', resumeAskId: '', dispatchError: message })
      emit('waiting', store.get(runId))
    } else {
      store.setStatus(runId, 'done', { finishedAt: new Date().toISOString(), error: '没能把话送进会话：' + message, dispatched: false })
      settleRoutine(runId)
      emit('done', store.get(runId))
    }
    pump()
  }

  /** Dispatch queued runs: one in flight per teammate, config.concurrency teammates at once. */
  function pump() {
    if (pumping) return
    pumping = true
    try {
      const busy = new Set(store.items.filter((r) => r.status === 'running' || (r.status === 'queued' && r.dispatched)).map((r) => r.mateId))
      for (const r of store.items) {
        if (r.status !== 'queued' || r.dispatched || busy.has(r.mateId)) continue
        if (busy.size >= cap()) break
        busy.add(r.mateId)
        dispatch(r)
      }
    } finally { pumping = false }
  }

  /**
   * A session made before the permission default changed keeps its old preset: after its next turn it moves to
   * config.permission (once; the preset is a durable session fact). Deferred past the event being published (dsh
   * refuses an append from inside another append) and never mid-turn.
   */
  function applyPermission(mateId) {
    const m = mates.get(mateId)
    if (!m || m.permission === config.permission || !ctx.permissionPresets || typeof ctx.permissionPresets.set !== 'function') return
    const agent = liveAgent(mateId)
    if (!agent || !agent.session) return
    try { ctx.permissionPresets.set(agent.session, config.permission); mates.update(mateId, { permission: config.permission }); log(`teammate ${mateId} permission → ${config.permission}`) } catch (e) { log(`permission ${mateId}: ${errorText(e)}`) }
  }

  /**
   * 做了告诉你: a tool call that changes something becomes a `did` entry of the run (a thread entry, kept when the tool
   * calls are trimmed). A file is copied to <folder>/.mywork/undo/<runId>/ before its first change in the run, so 撤销
   * can put it back (a new file: undo deletes it); a message or a page action is recorded as 撤不回.
   */
  /**
   * A file about to change in a run (a tool the model called, or a host tool such as mywork_list_write): copied to
   * <folder>/.mywork/undo/<runId>/ before its first change in the run (a new file: undo deletes it). False when the run is gone.
   */
  function recordFileChange(runId, mate, abs) {
    const didId = () => 'did-' + Date.now().toString(36) + rand().slice(0, 4)
    const run = store.get(runId)
    if (!run) return false
    const hit = (run.activity || []).find((a) => a && a.kind === 'did' && a.act === 'file' && a.abs === abs)
    if (hit) { store.update(runId, () => { hit.n = (Number(hit.n) || 1) + 1; hit.at = new Date().toISOString() }); return true }
    let existed = false
    let size = 0
    try { const st = statSync(abs); existed = st.isFile(); size = st.size } catch {}
    let snap = ''
    if (existed && size <= UNDO_MAX_BYTES) {
      try {
        const dir = join(mate.dir, '.mywork', 'undo', runId)
        mkdirSync(dir, { recursive: true })
        const n = (run.activity || []).filter((a) => a && a.kind === 'did' && a.act === 'file').length + 1
        snap = join(dir, n + extname(abs))
        copyFileSync(abs, snap)
      } catch (e) { snap = ''; log(`undo copy ${abs}: ${errorText(e)}`) }
    }
    const inside = relative(resolve(mate.dir), abs)
    const shown = inside && !inside.startsWith('..') && !isAbsolute(inside) ? inside : abs
    store.activity(runId, { kind: 'did', id: didId(), act: 'file', path: shown, abs, existed, snap, undoable: !existed || !!snap, n: 1 })
    return true
  }

  /**
   * 做了告诉你 for files written any way (bash, scripts, tools): when a run's first turn starts, the folder's file list
   * is kept and its text files (≤1 MB each, ≤20 MB in all) are set aside in .mywork/undo/<runId>/base/; when the run
   * ends, what was created, changed or deleted becomes one did entry { act: 'files', files: [...] } that 撤销 reverses
   * (a file it could not set aside says 撤不回). Files the tool hook already recorded are left to their own entries.
   */
  const SNAP_SKIP = new Set(['.mywork', '.cache', '.dsh', '.git', 'node_modules', '__pycache__'])
  const SNAP_TEXT = /\.(md|markdown|txt|csv|tsv|json|jsonl|ya?ml|toml|html?|xml|js|mjs|cjs|ts|py|tex|bib|ini|cfg)$/i
  function folderList(dir) {
    const out = new Map()
    const walk = (rel, depth) => {
      if (out.size >= 5000 || depth > 8) return
      let names = []
      try { names = readdirSync(rel ? join(dir, rel) : dir) } catch { return }
      for (const n of names) {
        if (SNAP_SKIP.has(n)) continue
        const p = rel ? rel + '/' + n : n
        let st
        try { st = statSync(join(dir, p)) } catch { continue }
        if (st.isDirectory()) walk(p, depth + 1)
        else if (st.isFile()) out.set(p, { size: st.size, mtime: st.mtimeMs })
      }
    }
    walk('', 0)
    return out
  }
  const UNDO_KEEP_MS = 14 * 86400000
  function snapshotRun(runId, mate) {
    const run = store.get(runId)
    if (!run || run.snapAt || !mate || !mate.dir || !existsSync(mate.dir)) return
    // What was set aside for runs more than 14 days old goes (their 撤销 then says what it could not put back).
    try { const root = join(mate.dir, '.mywork', 'undo'); for (const n of readdirSync(root)) { const p = join(root, n); try { if (Date.now() - statSync(p).mtimeMs > UNDO_KEEP_MS) rmSync(p, { recursive: true, force: true }) } catch {} } } catch {}
    try {
      const base = join(mate.dir, '.mywork', 'undo', runId, 'base')
      const list = folderList(mate.dir)
      let total = 0
      const kept = []
      for (const [rel, f] of list) {
        if (!SNAP_TEXT.test(rel) || f.size > UNDO_MAX_BYTES / 2 || total + f.size > 20 * 1024 * 1024) continue
        try { mkdirSync(dirname(join(base, rel)), { recursive: true }); copyFileSync(join(mate.dir, rel), join(base, rel)); total += f.size; kept.push(rel) } catch {}
      }
      mkdirSync(join(mate.dir, '.mywork', 'undo', runId), { recursive: true })
      writeFileSync(join(mate.dir, '.mywork', 'undo', runId, 'list.json'), JSON.stringify({ files: Object.fromEntries(list), kept }))
      store.update(runId, { snapAt: new Date().toISOString() })
    } catch (e) { log(`snapshot ${runId}: ${errorText(e)}`) }
  }
  function diffRun(runId, mate) {
    const run = store.get(runId)
    if (!run || !run.snapAt || run.diffAt || !mate) return
    try {
      const dir = join(mate.dir, '.mywork', 'undo', runId)
      const before = JSON.parse(readFileSync(join(dir, 'list.json'), 'utf8'))
      const was = before.files || {}
      const kept = new Set(before.kept || [])
      const now = folderList(mate.dir)
      const known = new Set((run.activity || []).filter((a) => a && a.kind === 'did' && a.act === 'file').map((a) => a.abs))
      // A rule written by mywork_remember has its own line (记下了规矩 · 删): AGENTS.md is not listed again.
      if ((run.activity || []).some((a) => a && a.kind === 'did' && a.act === 'rule')) known.add(join(mate.dir, 'AGENTS.md'))
      const files = []
      for (const [rel, f] of now) {
        const old = was[rel]
        if (old && old.size === f.size && old.mtime === f.mtime) continue
        const abs = join(mate.dir, rel)
        if (known.has(abs)) continue
        const snap = old && kept.has(rel) ? join(dir, 'base', rel) : ''
        files.push({ path: rel, abs, existed: !!old, snap, undoable: !old || !!snap })
      }
      for (const rel of Object.keys(was)) if (!now.has(rel) && !known.has(join(mate.dir, rel))) files.push({ path: rel, abs: join(mate.dir, rel), existed: true, deleted: true, snap: kept.has(rel) ? join(dir, 'base', rel) : '', undoable: kept.has(rel) })
      if (files.length) store.activity(runId, { kind: 'did', id: 'did-' + Date.now().toString(36) + rand().slice(0, 4), act: 'files', files: files.slice(0, 500), n: files.length, undoable: files.some((f) => f.undoable) })
      store.update(runId, { diffAt: new Date().toISOString() })
    } catch (e) { log(`diff ${runId}: ${errorText(e)}`) }
  }

  function recordDid(runId, mate, tool, rawArgs) {
    const didId = () => 'did-' + Date.now().toString(36) + rand().slice(0, 4)
    // dsh hands the model's arguments over as the JSON text it wrote; tests and other callers may pass the object.
    let args = rawArgs
    if (typeof args === 'string') { try { args = JSON.parse(args) } catch { args = {} } }
    for (const p of filesTouched(tool, args)) { if (!recordFileChange(runId, mate, isAbsolute(p) ? p : resolve(mate.dir, p))) return }
    const out = outwardAct(tool)
    const a = args && typeof args === 'object' ? args : {}
    if (out === 'send') store.activity(runId, { kind: 'did', id: didId(), act: 'send', target: clipTo(a.target, 40), text: clipTo(a.text, 120), undoable: false })
    else if (out === 'web') {
      const run = store.get(runId)
      const hit = run && (run.activity || []).find((x) => x && x.kind === 'did' && x.act === 'web')
      if (hit) store.update(runId, () => { hit.n = (Number(hit.n) || 1) + 1; hit.at = new Date().toISOString() })
      else store.activity(runId, { kind: 'did', id: didId(), act: 'web', n: 1, undoable: false })
    }
  }

  // ── session events ───────────────────────────────────────────────────────

  const turnOf = (mateId) => { let t = turns.get(mateId); if (!t) { t = { n: 0, runId: null, discard: false, pending: [] }; turns.set(mateId, t) } return t }

  /** Bind the teammate's current turn to a run: status running, timeout armed; lines claimed before it move into it. */
  function bindTurn(mateId, runId) {
    const turn = turnOf(mateId)
    const run = store.get(runId)
    if (!run || run.mateId !== mateId) return null
    if (run.status === 'done') return null // a finished run never takes another turn; the turn becomes its own run
    if (turn.runId === runId) return run
    if (turn.runId && live.has(turn.runId)) return store.get(turn.runId) // the turn already belongs to a run: keep it
    turn.runId = runId
    absorbPending(turn, runId)
    const state = { text: '', timer: null, stopped: false, timedOut: false }
    live.set(runId, state)
    state.timer = setTimeout(() => { state.timedOut = true; if (!cancelSession(mateId)) finishRun(runId, { kind: 'aborted' }) }, config.timeoutMs)
    if (state.timer && typeof state.timer.unref === 'function') state.timer.unref()
    store.setStatus(runId, 'running', { startedAt: run.startedAt || new Date().toISOString(), finishedAt: '', error: '', dispatched: true, pendingText: '', resumeAskId: '' })
    snapshotRun(runId, mates.get(mateId))
    emit('started', store.get(runId))
    return store.get(runId)
  }

  /** Steers and lines claimed before any run was bound go into the run the turn turned out to be. */
  function absorbPending(turn, runId) {
    for (const p of turn.pending.splice(0)) {
      if (p.kind === 'steer') {
        if (p.fromRunId === runId) continue
        const entry = store.takeEntry(p.fromRunId, (a) => a && a.kind === 'user' && a.requestId === p.requestId)
        store.putEntry(runId, entry || { kind: 'user', text: p.text, at: new Date().toISOString() })
      } else store.activity(runId, { kind: 'user', text: p.text })
    }
  }

  /**
   * The run of the teammate's current turn, binding it when no user line did: a continuation, or an orphan. Our own
   * messages always carry their run id, so a turn without one (a line typed elsewhere, a dsh reminder) is its own run.
   */
  function resolveTurn(mateId) {
    const turn = turnOf(mateId)
    if (turn.discard) return null
    if (turn.runId && live.has(turn.runId)) return store.get(turn.runId)
    if (turn.pending.length) {
      // A steer that arrived after its run's turn ended (or a line typed into the session elsewhere) opens a continuation run.
      const first = turn.pending.shift()
      if (first.kind === 'steer') store.takeEntry(first.fromRunId, (a) => a && a.kind === 'user' && a.requestId === first.requestId)
      const input = String(first.text || '').startsWith(ASK_TEXT.answerPrefix) ? String(first.text).slice(ASK_TEXT.answerPrefix.length) : first.text
      const run = store.create({ mateId, trigger: 'user', input })
      store.update(run.id, { dispatched: true })
      return bindTurn(mateId, run.id)
    }
    const orphan = store.create({ mateId, trigger: 'system', input: '' })
    store.update(orphan.id, { dispatched: true })
    return bindTurn(mateId, orphan.id)
  }

  function onUserMessage(mateId, message) {
    const turn = turnOf(mateId)
    const source = (message && message.source) || {}
    const rpc = String(source.rpcId || '')
    const text = messageText(message)
    if (rpc.startsWith(RUN_RPC)) {
      const run = store.get(rpcRunId(rpc, RUN_RPC))
      // Stopped before its turn started (its inbox item could not be withdrawn): the turn is cancelled, nothing is recorded.
      if (run && run.mateId === mateId && run.status === 'done' && run.stopped && !(turn.runId && live.has(turn.runId))) { turn.discard = true; cancelSession(mateId); return }
      bindTurn(mateId, run ? run.id : rpcRunId(rpc, RUN_RPC))
      return
    }
    if (rpc.startsWith(NUDGE_RPC)) return
    if (rpc.startsWith(STEER_RPC)) {
      const fromRunId = rpcRunId(rpc, STEER_RPC)
      if (turn.runId === fromRunId && live.has(fromRunId)) return // merged into its own run, as meant
      if (turn.runId && live.has(turn.runId)) { const entry = store.takeEntry(fromRunId, (a) => a && a.kind === 'user' && a.requestId === rpc); store.putEntry(turn.runId, entry || { kind: 'user', text, at: new Date().toISOString() }); return }
      turn.pending.push({ kind: 'steer', fromRunId, requestId: rpc, text })
      return
    }
    // A line typed into the teammate's session elsewhere (the dsh session view): part of the thread too.
    if (source.kind === 'user' && text) {
      if (turn.runId && live.has(turn.runId)) store.activity(turn.runId, { kind: 'user', text })
      else turn.pending.push({ kind: 'line', text })
    }
  }

  /** Global session/event listener: teammates' turns become runs; verifier sessions hand back their verdict text. */
  function onSessionEvent(session, event) {
    try {
      const id = session && session.id !== undefined ? String(session.id) : ''
      if (!event || typeof event.type !== 'string') return
      if (id.startsWith(VERIFY_PREFIX)) {
        const runId = id.slice(VERIFY_PREFIX.length).replace(/-[a-z0-9]+$/, '')
        const v = verifying.get(runId)
        if (v && event.type === 'assistant/message') { const text = assistantText(event); if (text) v.text = text }
        return
      }
      if (!id.startsWith(MATE_SESSION_PREFIX)) return
      const mateId = id.slice(MATE_SESSION_PREFIX.length)
      if (!mates.get(mateId)) return
      const data = event.data || {}
      switch (event.type) {
        case 'turn/start': {
          const turn = turnOf(mateId)
          if (turn.runId && live.has(turn.runId)) finishRun(turn.runId, { kind: 'error', error: { message: '上一轮没有正常结束。' } })
          turns.set(mateId, { n: Number(data.turn) || 0, runId: null, discard: false, pending: [] })
          return
        }
        case 'user/message': onUserMessage(mateId, data); return
        case 'tool/call': {
          const run = resolveTurn(mateId)
          if (!run) return
          const tool = data.name ? String(data.name) : ''
          store.step(run.id, stepNameFor(tool, stepMap()), tool)
          store.activity(run.id, { kind: 'tool', name: tool, detail: argsPreview(data.arguments) })
          try { recordDid(run.id, mates.get(mateId), tool, data.arguments) } catch (e) { log('did: ' + errorText(e)) }
          emit('step', store.get(run.id))
          return
        }
        case 'tool/result': {
          const turn = turnOf(mateId)
          if (turn.runId && live.has(turn.runId)) store.activityResult(turn.runId, !data.error, resultPreview(event))
          return
        }
        case 'assistant/message': {
          const text = assistantText(event)
          if (!text) return
          const run = resolveTurn(mateId)
          if (!run) return
          const state = live.get(run.id)
          if (state) state.text = text
          store.activity(run.id, { kind: 'text', text })
          emit('text', store.get(run.id))
          return
        }
        case 'turn/end': {
          const turn = turnOf(mateId)
          const runId = turn.runId && live.has(turn.runId) ? turn.runId : null
          // Lines claimed by a turn that never produced anything still belong to the thread.
          if (turn.discard) { /* a stopped run's turn: nothing to record */ }
          else if (!runId && turn.pending.length) { const run = resolveTurn(mateId); if (run) finishRun(run.id, data.reason) }
          else if (runId) finishRun(runId, data.reason)
          turns.set(mateId, { n: turn.n, runId: null, discard: false, pending: [] })
          recheckHanded(mateId)
          { const t = setTimeout(() => applyPermission(mateId), 0); if (t && typeof t.unref === 'function') t.unref() }
          if (typeof afterTurn === 'function') { try { afterTurn(mateId) } catch (e) { log('afterTurn: ' + errorText(e)) } }
          pump()
          return
        }
        default:
      }
    } catch (e) { log('event error: ' + (e && e.message)) }
  }

  /** A routine run stays quiet when it reports 变化：无. A report routine (日报 / 周报) is never quiet: the report is the point. */
  function quietFor(run, text) {
    const routine = routines && run.routineId ? routines.get(run.routineId) : null
    if (routine && wantsRecord(routine)) return false
    return changedVerdict(text) === false
  }

  /** End of a run's turn: waiting when it stopped on a question, else done at once; verification follows in the background. */
  function finishRun(runId, reason) {
    const run = store.get(runId)
    const state = live.get(runId) || { text: '' }
    if (state.timer) clearTimeout(state.timer)
    live.delete(runId)
    for (const [mateId, turn] of turns) if (turn.runId === runId) turns.set(mateId, { n: turn.n, runId: null, discard: false, pending: turn.pending })
    if (!run || run.status === 'done') return
    store.endSteps(runId)
    // What each changed file looks like now: 撤销 later refuses a file someone changed again since.
    if (!pendingAsk(run)) diffRun(runId, mates.get(run.mateId))
    if ((store.get(runId).activity || []).some((a) => a && a.kind === 'did' && (a.act === 'file' || a.act === 'files'))) {
      store.update(runId, (x) => { for (const a of x.activity || []) { if (a && a.kind === 'did' && a.act === 'file') a.after = hashOf(a.abs); if (a && a.kind === 'did' && a.act === 'files') for (const f of a.files || []) f.after = hashOf(f.abs) } })
    }
    const error = state.stopped ? STOPPED : state.timedOut ? '超过最长运行时间。' : reasonError(reason)
    const ask = pendingAsk(run)
    if (!error && ask) {
      store.setStatus(runId, 'waiting', { error: '', finishedAt: '' })
      log(`run ${runId} waiting: ${ask.question}`)
      emit('waiting', store.get(runId))
      return
    }
    if (error && ask) store.settleAsk(runId, 'expired')
    const quiet = run.trigger === 'routine' && !error ? quietFor(run, state.text) : false
    if (run.trigger === 'routine') {
      // The closing 变化 line is for the engine; the thread shows the reply without it.
      store.update(runId, (x) => { for (let i = x.activity.length - 1; i >= 0; i -= 1) if (x.activity[i].kind === 'text') { const cleaned = stripVerdict(x.activity[i].text); if (cleaned) x.activity[i].text = cleaned; break } })
    }
    store.setStatus(runId, 'done', { finishedAt: new Date().toISOString(), error, summary: state.text ? titleOf(stripVerdict(state.text)) : '', quiet })
    settleRoutine(runId)
    const done = store.get(runId)
    const unverified = done.deliverableIds.length > (Number(done.verifiedCount) || 0)
    if (!error && !quiet && config.verify && unverified) startVerify(runId) // a quiet run is never seen: no verifier for it
    log(`run ${runId} ${error ? 'failed: ' + error : 'done'}${quiet ? ' (quiet)' : ''}`)
    emit('done', store.get(runId))
  }

  /** Write the run outcome back onto its routine (receipt + what it delivered, for the next run). */
  function settleRoutine(runId) {
    const t = store.get(runId)
    if (!t || !t.routineId || !routines || t.remind) return
    try { routines.markRun(t.routineId, '', { taskId: runId, deliverableId: t.deliverableIds[t.deliverableIds.length - 1] || '', changed: t.quiet === true ? false : t.error ? null : true, error: t.error || '' }) } catch (e) { log('routine receipt: ' + (e && e.message)) }
  }

  function startVerify(runId) {
    if (verifying.has(runId)) return
    store.update(runId, { verifying: true })
    emit('verifying', store.get(runId))
    verify(runId).catch((e) => { log(`verify ${runId} crashed: ${e && e.message}`); store.update(runId, { verifying: false }) })
  }

  /** Second session: a read-only check of the run's new deliverables against what the user said; stamps each one. */
  async function verify(runId) {
    const t = store.get(runId)
    if (!t) return
    const count = t.deliverableIds.length
    const from = Math.min(Number(t.verifiedCount) || 0, count)
    const ids = new Set(t.deliverableIds.slice(from))
    const docs = deliverables.forTask(runId).filter((d) => ids.has(d.id))
    const general = scenarios ? scenarios.resolve('general') : null
    const state = { text: '', handle: null }
    verifying.set(runId, state)
    let timer
    let verdict = null
    let failure = ''
    let sessionId = ''
    try {
      const prompt = general && typeof general.verifyPrompt === 'function' ? general.verifyPrompt(t, docs, t.activity || []) : defaultVerifyPrompt(t, docs, t.activity || [])
      sessionId = VERIFY_PREFIX + runId + '-' + Date.now().toString(36)
      const opened = await openSession({ sessionId, cwd: config.workbench, workspaceName: 'MyWork 核验', selection: selectionFor(), agentPreset: config.agentPreset, permission: 'read-only' })
      state.handle = opened.handle
      rename(opened.handle.agent, '核验 · ' + (t.title || t.input || runId))
      opened.handle.agent.followup(userMessage(prompt, { kind: 'mywork-verify', runId }))
      const idle = opened.handle.agent.whenIdle()
      const deadline = new Promise((r) => { timer = setTimeout(() => { opened.handle.agent.cancel({ kind: 'hook', reason: 'verify timeout' }); r() }, VERIFY_TIMEOUT_MS); if (timer.unref) timer.unref() })
      await Promise.race([idle, deadline])
      clearTimeout(timer)
      try { await ctx.sessions.flush(opened.handle.agent.session) } catch {}
      verdict = parseVerdict(state.text)
      if (!verdict) failure = state.text ? '核验员没有给出可解析的结论。' : '核验会话没有回复。'
    } catch (e) {
      clearTimeout(timer)
      failure = errorText(e)
    } finally {
      verifying.delete(runId)
      try { if (state.handle) state.handle.dispose() } catch {}
    }
    const stamp = verdict ? { ...verdict, at: new Date().toISOString() } : { passed: null, checked: 0, issues: 0, notes: '核验失败：' + failure, at: new Date().toISOString() }
    for (const d of docs) deliverables.update(d.id, { verification: stamp })
    if (!store.get(runId)) return
    store.update(runId, { verification: stamp, verifying: false, verifiedCount: count, ...(sessionId ? { verifySessionId: sessionId } : {}) })
    log(`run ${runId} verified: ${verdict ? (verdict.passed ? 'passed' : 'issues') : 'unavailable'}`)
    emit('verified', store.get(runId))
  }

  // ── what the HTTP layer and the tools call ────────────────────────────────

  /** The teammate and the run a tool call came from, by the calling session's id; null outside teammate sessions. */
  function caller(sessionId) {
    const mate = mates.bySession(sessionId)
    if (!mate) return null
    const turn = turns.get(mate.id)
    const run = turn && turn.runId && live.has(turn.runId) ? store.get(turn.runId) : null
    return { mate, run: run || store.items.find((r) => r.mateId === mate.id && r.status === 'running') || null }
  }

  /** Called by the deliver tool: a deliverable of the calling teammate's current run. */
  function deliver(sessionId, args) {
    const c = caller(sessionId)
    if (!c) throw new Error('deliver 只能在 MyWork 同事的会话里调用（这个会话不属于任何同事）。')
    if (!c.run) throw new Error('现在没有在干的活，没法交付。')
    const d = deliverables.create({ mateId: c.mate.id, runId: c.run.id, title: args.title, kind: args.kind, markdown: args.markdown, data: args.data, summary: args.summary })
    store.update(c.run.id, (x) => { x.deliverableIds.push(d.id) })
    emit('deliverable', store.get(c.run.id), { deliverable: d })
    return d
  }

  /**
   * 找人 (§2.7), the tool side: the calling teammate's running run writes a pending ask and ends its turn; finishRun()
   * then parks it as waiting. Routine and system (intro) runs may not ask; at most two asks per run.
   */
  function ask(sessionId, args) {
    const c = caller(sessionId)
    if (!c) throw new Error(ASK_TEXT.notMate)
    const run = c.run
    if (!run || run.status !== 'running') throw new Error(ASK_TEXT.notLive)
    if (run.trigger === 'routine') throw new Error(ASK_TEXT.routine)
    if (run.trigger === 'system') throw new Error(ASK_TEXT.system)
    if (store.askCount(run.id) >= ASK_MAX_PER_TASK) throw new Error(ASK_TEXT.limit)
    const fields = normalizeAsk(args)
    const entry = store.ask(run.id, fields)
    log(`run ${run.id} asks (${fields.askKind}): ${fields.question}`)
    emit('step', store.get(run.id))
    return entry
  }

  /** The run the teammate works on now (bound to its turn), or null. */
  function activeRun(mateId) {
    const turn = turns.get(mateId)
    if (turn && turn.runId && live.has(turn.runId)) return store.get(turn.runId)
    return null
  }

  /** Steer `prompt` into a run's session and record the user's line on the run; the line comes off again if it never got there. */
  async function steerInto(mateId, run, entry, prompt, onFail) {
    const requestId = STEER_RPC + run.id + '.' + rand()
    store.activity(run.id, { ...entry, requestId })
    try { await sendPrompt(mateId, prompt, 'steer', requestId) } catch (e) {
      store.takeEntry(run.id, (a) => a && a.requestId === requestId)
      if (typeof onFail === 'function') onFail()
      throw new Error('没能把话送进会话：' + errorText(e))
    }
    emit('step', store.get(run.id))
  }

  /**
   * A message to a teammate. Working on a user run → steer it (no new run); if that run has just asked (mywork_ask, turn
   * not over yet), the text is the answer. Waiting on an ask → the text answers it. Its own user run still queued → the
   * text joins that run. Otherwise (idle, or only a routine / intro run active) → a new user run, dispatched when free.
   * Returns { runId, mode: 'steer' | 'answer' | 'queue' }.
   */
  async function say(mateId, text) {
    const mate = mates.get(mateId)
    if (!mate) throw notFound('同事不存在。')
    const body = String(text || '').trim()
    if (!body) throw bad('text is required')
    const active = activeRun(mateId)
    if (active && active.trigger === 'user' && active.status === 'running') {
      const ask = pendingAsk(active)
      if (ask) {
        // It asked in this very turn: the line is the answer, so the turn does not end parked on a question.
        const t = answerText(ask, body) || body
        store.settleAsk(active.id, 'answered', t)
        await steerInto(mateId, active, { kind: 'user', text: t, askId: ask.id }, ASK_TEXT.answerPrefix + t, () => store.reopenAsk(active.id, ask.id))
        return { runId: active.id, mode: 'answer' }
      }
      await steerInto(mateId, active, { kind: 'user', text: body }, body)
      return { runId: active.id, mode: 'steer' }
    }
    const waiting = [...store.items].reverse().find((r) => r.mateId === mateId && r.status === 'waiting' && pendingAsk(r))
    if (waiting) { const r = answer(waiting.id, '', body); return { runId: r.id, mode: 'answer' } }
    // Its own user run is still queued (behind the concurrency cap, behind a routine, or its cold session resuming).
    const newest = [...store.items].reverse().find((r) => r.mateId === mateId && r.trigger === 'user' && r.status !== 'done')
    if (newest && newest.status === 'queued') {
      if (!newest.dispatched) {
        store.activity(newest.id, { kind: 'user', text: body })
        store.update(newest.id, (x) => (x.pendingText ? { pendingText: x.pendingText + '\n' + body } : { promptExtra: x.promptExtra ? x.promptExtra + '\n' + body : body }))
        emit('step', store.get(newest.id))
        return { runId: newest.id, mode: 'steer' }
      }
      // Handed to the session, turn not started: a steer is claimed together with it (absorbPending keeps it in the run).
      await steerInto(mateId, newest, { kind: 'user', text: body }, body)
      return { runId: newest.id, mode: 'steer' }
    }
    const run = store.create({ mateId, trigger: 'user', input: body })
    emit('queued', run)
    pump()
    return { runId: run.id, mode: 'queue' }
  }

  /**
   * Answer the pending ask of a waiting run (POST /answer, or a line typed while it waits). The ask is marked answered,
   * the user's words join the run's thread, and the run is queued again with 「回答：<answer>」 as its prompt, so the same
   * run continues in the same session. `askId` may be empty (= the newest); a stale id, nothing pending or an empty
   * answer is a 400. Should the answer not reach the session, the ask reopens and the run is waiting again.
   */
  function answer(runId, askId, raw) {
    const t = store.get(runId)
    if (!t) throw notFound('run not found')
    const ask = pendingAsk(t)
    if (!ask || t.status !== 'waiting') throw bad('这一轮没有等着回答的问题。')
    if (askId && String(askId) !== ask.id) throw bad('这个问题已经不是当前的问题了。')
    const text = answerText(ask, raw)
    if (!text) throw bad('回答不能为空。')
    store.settleAsk(runId, 'answered', text)
    store.activity(runId, { kind: 'user', text, askId: ask.id })
    store.setStatus(runId, 'queued', { dispatched: false, pendingText: ASK_TEXT.answerPrefix + text, resumeAskId: ask.id, dispatchError: '' })
    emit('queued', store.get(runId))
    pump()
    return store.get(runId)
  }

  /** Take a dispatched run's message back out of the session inbox; false when it is not (or no longer) there. */
  function withdraw(mateId, run) {
    const agent = liveAgent(mateId)
    const item = inboxItem(agent, run.requestId)
    if (!item) return false
    const c = control()
    try {
      if (c && typeof c.updateQueue === 'function') {
        Promise.resolve(c.updateQueue({ sessionId: mateSessionId(mateId), itemId: item.id, action: { kind: 'remove' } })).catch((e) => log(`withdraw ${run.id}: ${errorText(e)}`))
        return true
      }
      if (agent.inbox && typeof agent.inbox.remove === 'function') { agent.inbox.remove(item.id); return true }
    } catch (e) { log(`withdraw ${run.id}: ${errorText(e)}`) }
    return false
  }

  /**
   * Stop. A run bound to the current turn is cancelled (controller.cancel keeps the inbox, so messages queued behind it
   * still run). With no run bound, the teammate's queued runs end instead: a message already in the session inbox is
   * taken out, and should it be claimed anyway its turn is cancelled at once (run.stopped). A run waiting on a question
   * ends with it. Returns how many runs were stopped.
   */
  function stop(mateId) {
    let n = 0
    const at = new Date().toISOString()
    const active = activeRun(mateId)
    if (active) {
      const state = live.get(active.id)
      if (state) state.stopped = true
      if (!cancelSession(mateId)) finishRun(active.id, { kind: 'aborted' })
      n += 1
    } else {
      for (const r of store.items.filter((x) => x.mateId === mateId && x.status === 'queued')) {
        if (r.dispatched) withdraw(mateId, r)
        store.endSteps(r.id)
        store.setStatus(r.id, 'done', { finishedAt: at, error: STOPPED, stopped: true })
        settleRoutine(r.id)
        emit('done', store.get(r.id))
        n += 1
      }
    }
    for (const r of store.items.filter((x) => x.mateId === mateId && x.status === 'waiting')) {
      store.settleAsk(r.id, 'expired')
      store.endSteps(r.id)
      store.setStatus(r.id, 'done', { finishedAt: new Date().toISOString(), error: STOPPED })
      emit('done', store.get(r.id))
      n += 1
    }
    if (n) pump()
    return n
  }

  /**
   * 24-hour rule: a waiting run nobody answered continues on its own assumptions; the ask is marked expired first so the
   * card closes. Run from the scheduler tick. `now` is injectable for tests. Returns the ids it resumed.
   */
  function expireAsks(now = Date.now()) {
    const resumed = []
    for (const t of store.items.slice()) {
      if (t.status !== 'waiting') continue
      const ask = pendingAsk(t)
      if (!ask || ts(ask.at) > now - ASK_EXPIRY_MS) continue
      store.settleAsk(t.id, 'expired')
      store.activity(t.id, { kind: 'user', text: ASK_TEXT.expired, auto: true, askId: ask.id }) // one muted line in the thread, not a bubble
      store.setStatus(t.id, 'queued', { dispatched: false, pendingText: ASK_TEXT.expired, resumeAskId: '' })
      resumed.push(t.id)
      log(`run ${t.id}: question expired after 24 h, resumed on assumptions`)
    }
    if (resumed.length) pump()
    return resumed
  }

  /**
   * Restart, part one — synchronous, before any route or pump can run: runs that were mid-turn end with
   * 服务重启，这一轮中断。; a verification in flight is stamped as interrupted; the runs already handed to a session
   * inbox are remembered for recover(). Idempotent.
   */
  function repair() {
    if (repaired) return repaired
    const at = new Date().toISOString()
    for (const t of store.items) {
      if (t.verifying || t.status === 'verifying') {
        store.update(t.id, { verifying: false, verification: { passed: null, checked: 0, issues: 0, notes: '核验被服务重启打断。', at } })
        if (t.status === 'verifying') store.update(t.id, { status: 'done', finishedAt: t.finishedAt || at })
      }
      if (t.status === 'running' || t.status === 'delivering') {
        store.endSteps(t.id)
        store.settleAsk(t.id, 'expired')
        store.setStatus(t.id, 'done', { finishedAt: at, error: INTERRUPTED })
        settleRoutine(t.id)
      }
    }
    repaired = new Set()
    for (const t of store.items) if (t.status === 'queued' && t.dispatched) { repaired.add(t.id); if (!t.handed) store.update(t.id, { handed: true }) }
    return repaired
  }

  /**
   * Restart, part two (a few seconds after start): each teammate that had a message handed to its session before the
   * restart gets that exact request re-sent (mode 'queue'; the controller ignores a request id it already holds in the
   * inbox or the log, and restores one lost in the crash window), then a steer to wake it, because dsh does not start
   * a resumed agent by itself. A run handed over after this start is not touched. Everything else is dispatched as usual.
   */
  async function recover() {
    const ids = repair()
    const byMate = new Map()
    for (const id of ids) {
      const t = store.get(id)
      if (!t || t.status !== 'queued' || !t.dispatched) continue
      const list = byMate.get(t.mateId); if (list) list.push(t); else byMate.set(t.mateId, [t])
    }
    const work = []
    for (const [mateId, runs] of byMate) {
      const mate = mates.get(mateId)
      const requeue = () => { for (const t of runs) { const x = store.get(t.id); if (x && x.status === 'queued' && x.dispatched) store.update(t.id, { dispatched: false, handed: false, requestId: '' }) } pump() }
      if (!mate || !mate.sessionId) { requeue(); continue }
      work.push((async () => {
        try {
          for (const t of runs) {
            const x = store.get(t.id)
            if (x && x.status === 'queued' && x.dispatched && x.requestId) await sendPrompt(mateId, promptFor(x, mate), 'queue', x.requestId)
          }
          await sendPrompt(mateId, NUDGE_TEXT, 'steer', NUDGE_RPC + rand())
          log(`teammate ${mateId} resumed and nudged`)
        } catch (e) { log(`resume ${mateId} failed (${errorText(e)}); dispatching again`); requeue() }
      })())
    }
    pump()
    await Promise.all(work)
  }

  /** Forget a removed teammate: stop what it runs, let go of its session handle. */
  function forget(mateId) {
    stop(mateId)
    turns.delete(mateId)
    const h = handles.get(mateId)
    handles.delete(mateId)
    try { if (h) h.dispose() } catch {}
  }

  /** After a host tool wrote a file the run had snapshotted: stamp what it looks like now (undo refuses a later change). */
  function settleFile(runId, abs) { store.update(runId, (x) => { for (const a of x.activity || []) if (a && a.kind === 'did' && a.act === 'file' && a.abs === abs) a.after = hashOf(abs) }) }
  return { pump, repair, recover, say, answer, stop, ask, deliver, caller, expireAsks, onSessionEvent, forget, activeRun, ensureSession, recordFileChange, settleFile, isLive: (runId) => live.has(runId), isVerifying: (runId) => verifying.has(runId) }
}
