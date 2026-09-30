/**
 * dsh-mywork-tasks — host half: the task engine of MyWork Kit v2.
 *
 *   一句话 → 任务（后台会话）→ 交付物 → 通知
 *
 *   • service `myworkTasks`: scenario plugins register { id, label, intro, examples, compose, toolStepMap, … }
 *     and can create / list tasks (ctx.provide, so `inject: ['myworkTasks']` works in cordis).
 *   • tools: deliver({ title, markdown, kind?, data? }) inside a task session;
 *            mywork_task_create({ input, scenario? }) and mywork_tasks() from any session;
 *            mywork_task_say({ id, text }) from the day's assistant session only (a follow-up into an existing task).
 *   • HTTP: /mywork-tasks/api/{tasks, task, create, cancel, rerun, verify, say, scenarios, deliverables, deliverable, rate,
 *           today[?day=YYYY-MM-DD], feed?before=&limit=, seen, search?q=}
 *   • events: ctx.emit('mywork/task', { kind: started|step|deliverable|done, task, deliverable? })
 *
 * Every task and routine view carries what the conversation column shows: lastAt, preview, attentionAt
 * and unread (read state lives in $DSH_HOME/mywork/seen.json, written by POST /seen).
 */
import { join } from 'node:path'
import { createEngine } from './engine.js'
import { assistantMemory, buildFeed } from './feed.js'
import { configSchema, defineRawTool, rejectUntrusted } from './harness.js'
import { BUILTIN_SCENARIOS, createScenarioRegistry } from './scenarios.js'
import { DeliverableStore, myworkDir, searchAll, SeenStore, TaskStore, taskView, STATUS_LABELS } from './store.js'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Install the package's agent presets into <DSH_HOME>/.agent-presets so sessions can name them (idempotent). */
function installPresets(log) {
  const src = join(dirname(fileURLToPath(import.meta.url)), '..', 'presets')
  const root = join(myworkDir(), '..', '.agent-presets')
  for (const id of ['mywork-assistant']) {
    try {
      const body = readFileSync(join(src, id, 'agent.cordis.yml'), 'utf8')
      const dir = join(root, id)
      const file = join(dir, 'agent.cordis.yml')
      if (existsSync(file) && readFileSync(file, 'utf8') === body) continue
      mkdirSync(dir, { recursive: true })
      writeFileSync(file, body)
      log(`installed agent preset ${id} → ${file}`)
    } catch (e) { log(`agent preset ${id} not installed: ${e && e.message}`) }
  }
}

import { describeSchedule, parseSchedule, routineLastAt, RoutineStore, routineView } from './routines.js'

export const name = 'dsh-mywork-tasks'
export const inject = ['tools', 'agents', 'sessions', 'workspaceRegistry', 'agentDefaultModel', 'agentPresets', 'permissionPresets']

/** Config (all optional): concurrency, timeoutMinutes, permission, agentPreset, cwd, tools, verify */
export const Config = configSchema({ concurrency: 2, timeoutMinutes: 20, permission: 'workspace-write', agentPreset: 'standard', cwd: '', tools: true, verify: true })

export function apply(ctx, config = {}) {
  const log = (m) => console.log('[dsh-mywork-tasks] ' + m)
  installPresets(log)
  const dir = myworkDir()
  const store = new TaskStore(join(dir, 'tasks.json'))
  const deliverables = new DeliverableStore(join(dir, 'deliverables.json'))
  const routines = new RoutineStore(join(dir, 'routines.json'))
  const seen = new SeenStore(join(dir, 'seen.json'))
  // Every task / routine leaves here through one of these, so unread always reflects the current seen.json.
  const view = (t) => taskView(t, deliverables, seen)
  const rview = (r) => routineView(r, seen)
  const scenarios = createScenarioRegistry()
  // §8.3 助理的连续性: the assistant composes with the recent tasks, earlier days' lines and the last results (feed.js).
  for (const s of BUILTIN_SCENARIOS) scenarios.register(s.id === 'assistant' ? { ...s, compose: (input, context) => s.compose(input, { ...context, memory: assistantMemory({ store, deliverables, today: dayKey() }) }) } : s)
  const listeners = new Set()
  const emit = (kind, task, deliverable, extra) => {
    const payload = { kind, task: task ? view(task) : null, ...(deliverable ? { deliverable: { id: deliverable.id, title: deliverable.title, kind: deliverable.kind, taskId: deliverable.taskId } } : {}), ...(extra || {}) }
    for (const fn of listeners) { try { fn(payload) } catch (e) { log('listener error: ' + (e && e.message)) } }
    try { ctx.emit('mywork/task', payload) } catch {}
  }
  let controller = null
  ctx.inject(['sessionController'], (sctx) => { controller = sctx.sessionController; sctx.effect(() => () => { controller = null }, 'dsh-mywork-tasks: controller') })
  /** What this machine can do, read from the tool registry at task time (members come and go). */
  const hasTool = (name) => { try { return !!ctx.tools.get(name) } catch { return false } }
  const capabilities = () => ({ browser: hasTool('open_url') || hasTool('browser_navigate'), office: hasTool('univer_new'), im: hasTool('im_send') })
  const engine = createEngine({
    ctx, store, deliverables, scenarios, log, emit, controller: () => controller, capabilities, routines, todaySummary: () => todaySummary(), workRecord: (days) => workRecord(days),
    config: { concurrency: Number(config.concurrency) || 2, timeoutMs: Math.max(1, Number(config.timeoutMinutes) || 20) * 60000, permission: String(config.permission || 'workspace-write'), agentPreset: config.agentPreset === '' ? undefined : (config.agentPreset || 'standard'), cwd: String(config.cwd || ''), verify: config.verify !== false },
  })

  const create = ({ input, scenario, title, source, routineId }) => {
    // The user never picks: a pack claims the input through match(), otherwise 通用 decides for itself.
    const s = scenario ? scenarios.resolve(scenario) : scenarios.route(input)
    const task = store.create({ input, scenario: s ? s.id : 'general', title, source, routineId })
    log(`task ${task.id} queued (${task.scenario}): ${task.title}`)
    emit('queued', task)
    engine.pump()
    return view(task)
  }
  /** Routines: a sentence with a time becomes a standing thing instead of a one-off task. */
  const createRoutine = ({ input, schedule, kind, title }) => {
    let parsed = null
    if (!schedule) { parsed = parseSchedule(input); if (!parsed) throw new Error('没看出时间。写法如「每天 9 点…」「每周一 8:30…」「工作日 18 点…」「明天 8 点提醒我…」「30 分钟后提醒我…」') }
    const finalKind = kind || (parsed ? parsed.kind : 'task')
    const finalTitle = finalKind === 'task' ? String(title || '').replace(/(的)?提醒$/, '').trim() : title // 「写周报提醒」 is a report MyWork writes, so the title is the report
    const r = routines.create({ kind: finalKind, title: finalTitle, input: parsed ? parsed.text : input, schedule: schedule || parsed.schedule })
    log(`routine ${r.id} ${r.kind} ${describeSchedule(r.schedule)}: ${r.title}`)
    emit('routine', null, undefined, { routine: rview(r) })
    return rview(r)
  }
  const runRoutine = (id) => {
    const r = routines.get(id)
    if (!r) throw new Error('routine not found')
    if (r.kind === 'remind') { routines.fire(id); routines.ran(id, { fired: true }); emit('remind', null, undefined, { routine: rview(routines.get(id)) }); return rview(routines.get(id)) }
    const task = create({ input: r.input, title: r.title, source: 'routine', routineId: r.id })
    routines.ran(id, { taskId: task.id })
    return rview(routines.get(id))
  }
  // Scheduler: every 30 s run what is due. A run that fires while the server was down runs once on start.
  ctx.effect(() => { const tick = () => { try { for (const r of routines.due()) runRoutine(r.id) } catch (e) { log('scheduler: ' + (e && e.message)) } }; const id = setInterval(tick, 30000); const first = setTimeout(tick, 5000); return () => { clearInterval(id); clearTimeout(first) } }, 'dsh-mywork-tasks: scheduler')

  /** 今日's conversation: one assistant task per day, created on the first message, continued with say(). */
  const dayKey = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') }
  const todayThread = () => store.items.find((t) => t.scenario === 'assistant' && t.dayKey === dayKey()) || null
  /** An earlier day's thread, to read back: the newest assistant task of that day (a restart can leave two). */
  const threadFor = (day) => { if (day === dayKey()) return todayThread(); for (let i = store.items.length - 1; i >= 0; i -= 1) { const t = store.items[i]; if (t.scenario === 'assistant' && t.dayKey === day) return t } return null }
  const todaySummary = () => {
    const today = new Date().toISOString().slice(0, 10)
    const running = store.items.filter((t) => t.status !== 'done' && t.scenario !== 'assistant').map((t) => t.title)
    const done = store.items.filter((t) => t.status === 'done' && t.scenario !== 'assistant' && String(t.finishedAt).slice(0, 10) === today).map((t) => t.title + (t.error ? '（失败）' : ''))
    const upcoming = routines.items.filter((r) => r.enabled).map((r) => r.title + ' ' + describeSchedule(r.schedule))
    return [running.length ? '在跑：' + running.join('；') : '', done.length ? '今天完成：' + done.join('；') : '', upcoming.length ? '例行：' + upcoming.join('；') : ''].filter(Boolean).join('\n')
  }
  /** What happened in the last N calendar days (today counts as one): tasks, deliverables, and the questions asked on
   *  今日. The material for 日报 / 周报 style routines: a 日报 is written from the day's questions and work, not invented. */
  const workRecord = (days) => {
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - Math.max(0, days - 1))
    const since = start.getTime()
    const stamp = (iso) => { const d = new Date(iso); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') }
    const clip = (text, n) => { const t = String(text || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n) + '…' : t }
    const work = []
    const asked = []
    for (const t of store.items) {
      if (t.scenario === 'assistant') {
        // The hand-off line is the fact; the assistant's wording of it can be stale (a routine renamed or removed since).
        let handedOff = false
        for (const a of t.activity || []) {
          if (new Date(a.at).getTime() < since) continue
          if (a.kind === 'user') { handedOff = false; asked.push(`- ${stamp(a.at)} 问：${clip(a.text, 200)}`) }
          else if (a.kind === 'handoff') { handedOff = true; asked.push(`  → ${a.target === 'routine' ? '安排了例行' : '交给了后台'}：${a.title}${a.schedule ? '（' + a.schedule + '）' : ''}`) }
          else if (a.kind === 'text' && !handedOff) asked.push(`  答：${clip(a.text, 160)}`)
        }
        continue
      }
      if (t.quiet) continue
      const at = new Date(t.finishedAt || t.startedAt || t.createdAt).getTime()
      if (!(at >= since)) continue
      const state = t.status === 'done' ? (t.error ? '失败：' + clip(t.error, 80) : '完成') : (STATUS_LABELS[t.status] || t.status) + '中'
      work.push(`- ${stamp(at)} ${t.title}（${state}${t.routineId ? '，例行' : ''}）`)
      for (const dl of deliverables.forTask(t.id)) {
        const v = dl.verification
        work.push(`  交付：${dl.title}${v ? (v.passed ? '，核对通过' : '，核对有问题') : ''}${dl.rating ? '，评价 ' + dl.rating : ''}`)
        const body = clip(dl.markdown, 240)
        if (body) work.push('  ' + body)
      }
    }
    const standing = routines.items.filter((r) => r.enabled).map((r) => `- ${r.title}：${describeSchedule(r.schedule)}${r.kind === 'remind' ? '（提醒）' : ''}`)
    return [asked.length ? '用户在「今日」问过 / 说过：\n' + asked.slice(-80).join('\n') : '', work.length ? '后台做过的任务：\n' + work.slice(-60).join('\n') : '', '现在有效的例行（以此为准，别的说法都过时了）：\n' + (standing.join('\n') || '- 无')].filter(Boolean).join('\n\n')
  }
  const todaySay = async (text) => {
    const body = String(text || '').trim()
    if (!body) throw new Error('text is required')
    let t = todayThread()
    if (t && t.status !== 'done' && !engine.isLive(t.id)) t = null // a thread interrupted by a restart: start a fresh one
    if (!t) {
      t = store.create({ input: body, scenario: 'assistant', title: '今天的对话 ' + dayKey().slice(5).replace('-', '/'), source: 'today' })
      store.update(t.id, { dayKey: dayKey() })
      store.activity(t.id, { kind: 'user', text: body }) // the first line of the day shows like every later one
      emit('queued', t)
      engine.pump()
      return view(store.get(t.id))
    }
    return view(await engine.say(t.id, body))
  }
  const api = {
    register: (s) => scenarios.register(s),
    today: () => { const t = todayThread(); return t ? view(t) : null },
    todaySay,
    routines: () => routines.list().map(rview),
    routine: (id) => { const r = routines.get(id); return r ? rview(r) : null },
    createRoutine,
    runRoutine,
    scenarios: () => scenarios.list(),
    create,
    list: () => store.list().map((t) => view(t)),
    get: (id) => { const t = store.get(id); return t ? view(t) : null },
    cancel: (id) => view(engine.cancel(id)),
    verify: (id) => view(engine.reverify(id)),
    say: async (id, text) => view(await engine.say(id, text)),
    deliverables: () => deliverables.list(),
    deliverable: (id) => deliverables.get(id),
    on: (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
  }
  try { ctx.provide('myworkTasks', api) } catch (e) { log('ctx.provide(myworkTasks) failed, scenarios must register through the HTTP API: ' + (e && e.message)) }

  ctx.effect(() => ctx.on('session/event', (...args) => { engine.onSessionEvent(args[0], args[1]) }, { global: true }), 'dsh-mywork-tasks: session watcher')
  ctx.effect(() => { const t = setTimeout(() => { try { engine.recover() } catch (e) { log('recover: ' + (e && e.message)) } }, 3000); return () => clearTimeout(t) }, 'dsh-mywork-tasks: recover')

  /** When a tool call inside a task creates something, note it on that task's activity so the conversation can link to it. */
  const handoff = (exec, entry) => { try { const sid = exec && exec.agent && exec.agent.session ? exec.agent.session.id : ''; const caller = sid ? store.bySession(String(sid)) : null; if (caller) { store.activity(caller.id, entry); emit('step', store.get(caller.id)) } } catch (e) { log('handoff note: ' + (e && e.message)) } }
  if (config.tools !== false) {
    ctx.tools.register(defineRawTool({
      name: 'deliver',
      description: '交付一份交付物（只在 MyWork 后台任务会话里可用）。任务做完后调用一次：title 是一句话标题，markdown 是完整正文（先结论，再依据）。kind 缺省 markdown；data 可选，放结构化数据（表格行、数值等）。交付后再用一两句话总结。',
      parameters: {
        title: { type: 'string', required: true, description: '一句话标题' },
        markdown: { type: 'string', required: true, description: '交付物正文（Markdown）' },
        kind: { type: 'string', description: '交付物类型：markdown（默认）| report | table | summary' },
        data: { type: 'object', description: '可选的结构化数据' },
        summary: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' } }, required: ['label', 'value'] }, description: '结果的可数摘要，2 到 6 行 { label, value }。label 是名目（≤10 字），value 只放数字、单位和最短的限定词（≤20 字，不带括号说明，口径和依据写进正文），例如 { label: "包", value: "8 个" }、{ label: "源文件", value: "57 个 · 18,420 行" }。正文里有数字、清单、表格时必须给；纯说明文才省略。' },
      },
      async execute(args, exec) {
        const sessionId = exec && exec.agent && exec.agent.session ? exec.agent.session.id : ''
        const d = engine.deliver(sessionId, args)
        return { delivered: true, id: d.id, title: d.title, kind: d.kind }
      },
      render: (_a, v) => [{ type: 'text', text: `已交付：${v.title}（${v.id}）` }],
    }))
    ctx.tools.register(defineRawTool({
      name: 'mywork_task_create',
      description: '把一件事交给 MyWork 在后台做：创建一个任务，它会在独立会话里执行并交付一份交付物，用户在「任务」页看结果。适合用户说"帮我在后台做…""跑一个任务…"，或者一件事太长不适合在当前对话里做。input 写清楚要的结果；scenario 可选（mywork_tasks 可查已装场景）。',
      parameters: {
        input: { type: 'string', required: true, description: '要的结果，一句话或几句话' },
        scenario: { type: 'string', description: '场景 id，缺省 general' },
        title: { type: 'string', description: '可选标题' },
      },
      async execute(args, exec) { const t = create({ input: args.input, scenario: args.scenario, title: args.title, source: 'chat' }); handoff(exec, { kind: 'handoff', target: 'task', id: t.id, title: t.title }); return { id: t.id, title: t.title, status: t.status } },
      render: (_a, v) => [{ type: 'text', text: `已创建后台任务「${v.title}」（${v.id}），完成后在「任务」页查看。` }],
    }))
    ctx.tools.register(defineRawTool({
      name: 'mywork_routine_create',
      description: '给用户安排一件例行的事或一个提醒：「每天 9 点…」「每周一 8:30…」「工作日 18 点…」「每 2 小时…」是例行任务（每次到点后台跑一遍，交付物里先说变化）；「提醒我喝水 / 开会 / 交周报」这类只有用户自己能做的事是提醒（到点在首页和 IM 提示，不跑 agent）；「提醒我写周报 / 整理 / 汇总…」这类 MyWork 自己能做的事不是提醒，到点 MyWork 自己做完交给用户（周报、日报会拿 MyWork 这段时间的工作记录当素材）。schedule 用自然语言写在 input 里即可，分类由解析器决定，返回值里的 kind 告诉你结果。用户说"每天/每周/到点提醒我"时用它，不要自己去写 cron。',
      parameters: { input: { type: 'string', required: true, description: '含时间的一句话，例如"每天 9 点给我一份 Node 生态简报"或"明天 8 点提醒我交周报"' }, title: { type: 'string', description: '可选标题' } },
      async execute(args, exec) { const r = createRoutine({ input: args.input, title: args.title }); handoff(exec, { kind: 'handoff', target: 'routine', id: r.id, title: r.title, schedule: r.scheduleLabel }); return { id: r.id, kind: r.kind, title: r.title, schedule: r.scheduleLabel, nextRunAt: r.nextRunAt } },
      render: (_a, v) => [{ type: 'text', text: v.kind === 'remind' ? `已安排提醒「${v.title}」：${v.schedule}，下次 ${v.nextRunAt ? new Date(v.nextRunAt).toLocaleString() : '—'}，到点在首页和 IM 提示。` : `已安排例行任务「${v.title}」：${v.schedule}，下次 ${v.nextRunAt ? new Date(v.nextRunAt).toLocaleString() : '—'}。到点 MyWork 自己做完交给用户，不需要再加提醒，直接回话。` }],
    }))
    ctx.tools.register(defineRawTool({
      name: 'mywork_tasks',
      description: '列出 MyWork 的后台任务（最近 20 条：状态、当前步骤、交付物）、例行任务与提醒、已装的领域包。',
      parameters: {},
      async execute() { return { routines: api.routines().map((r) => ({ id: r.id, kind: r.kind, title: r.title, schedule: r.scheduleLabel, enabled: r.enabled, nextRunAt: r.nextRunAt })), scenarios: scenarios.list().map((s) => ({ id: s.id, label: s.label })), tasks: api.list().slice(0, 20).map((t) => ({ id: t.id, title: t.title, status: t.statusLabel, step: t.currentStep, deliverables: t.deliverables.map((d) => d.title), error: t.error })) } },
    }))
    // §8.3 助理的连续性: a follow-up into an existing task, from the day's assistant session only. engine.say() queues the
    // words into the live agent or resumes the task's persisted session and returns at once; the run finishes in the
    // background, and the hand-off row this leaves on 今日 (followup: true) updates in place from the polled task.
    ctx.tools.register(defineRawTool({
      name: 'mywork_task_say',
      description: '追问一个已有的后台任务（只在「今日」的助理会话里可用）：把用户的话送进那个任务自己的会话，它接着改、再交付。用户对已有结果提修改或补充（「再短一点」「上一份改成英文」「刚才那个加个表」）时用它，不要为此新建任务。id 取「最近的任务」里对应任务的 id，text 用用户的原话。',
      parameters: { id: { type: 'string', required: true, description: '任务 id（「最近的任务」里的）' }, text: { type: 'string', required: true, description: '要对那个任务说的话，用用户的原话' } },
      async execute(args, exec) {
        const sid = exec && exec.agent && exec.agent.session ? String(exec.agent.session.id) : ''
        const caller = sid ? store.bySession(sid) : null
        if (!caller || caller.scenario !== 'assistant') throw new Error('mywork_task_say 只能在「今日」的助理会话里调用。')
        const target = store.get(String(args.id || '').trim())
        if (!target) throw new Error('没有这个任务：' + String(args.id || ''))
        if (target.scenario === 'assistant') throw new Error('这是今日的对话本身，直接回答即可。')
        const t = await engine.say(target.id, args.text)
        handoff(exec, { kind: 'handoff', target: 'task', id: t.id, title: t.title, followup: true })
        return { id: t.id, title: t.title, status: t.status }
      },
      render: (_a, v) => [{ type: 'text', text: `已把话送进任务「${v.title}」（${v.id}），它接着改；改完在今日线里原地更新，不必再建任务。` }],
    }))
  }

  ctx.inject(['webServer'], (wctx) => {
    const json = (res, body, status = 200) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)) }
    const readBody = (req) => new Promise((resolve, reject) => { let d = ''; let n = 0; req.on('data', (c) => { n += c.length; if (n > 256 * 1024) { reject(new Error('body too large')); req.destroy(); return } d += c }); req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}) } catch (e) { reject(e) } }); req.on('error', reject) })
    const query = (req) => new URL(req.url || '/', 'http://localhost').searchParams
    const route = (path, handler) => wctx.webServer.register({ kind: 'exact', path: '/mywork-tasks/api' + path, handler: (req, res) => rejectUntrusted(ctx, req, res, json) || Promise.resolve(handler(req, res)).catch((e) => json(res, { error: e instanceof Error ? e.message : String(e) }, 500)) })
    const post = (path, handler) => route(path, async (req, res) => { if (req.method !== 'POST') return json(res, { error: 'POST only' }, 405); return handler(await readBody(req), res, req) })
    const deliverableSummary = (d) => ({ id: d.id, taskId: d.taskId, title: d.title, kind: d.kind, scenario: d.scenario, createdAt: d.createdAt, rating: d.rating, verification: d.verification, summary: d.summary || null })
    // One payload feeds 今日, the sidebar and the lists: tasks without their activity, recent deliverables, packs, capabilities.
    const routineRow = (r) => ({ id: r.id, kind: r.kind, title: r.title, scheduleLabel: r.scheduleLabel, enabled: r.enabled, nextRunAt: r.nextRunAt, once: r.schedule && r.schedule.type === 'once', lastTaskId: ((r.runs || []).find((x) => x.taskId) || {}).taskId || '', lastAt: r.lastAt, lastRunSummary: r.lastRunSummary, preview: r.preview, attentionAt: r.attentionAt, unread: r.unread })
    route('/tasks', async (_req, res) => json(res, { items: api.list().map(({ activity: _a, ...t }) => t), deliverables: deliverables.list().slice(0, 60).map(deliverableSummary), reminders: routines.pending(), routines: api.routines().map(routineRow), scenarios: scenarios.list(), capabilities: capabilities() }))
    route('/task', async (req, res) => { const t = api.get(query(req).get('id') || ''); if (!t) return json(res, { error: 'task not found' }, 404); json(res, { task: t, deliverables: deliverables.forTask(t.id) }) })
    post('/create', async (b, res) => {
      if (!String(b.input || '').trim()) return json(res, { error: 'input is required' }, 400)
      if (!b.scenario && b.routine !== false && parseSchedule(b.input)) return json(res, { routine: createRoutine({ input: b.input }) })
      json(res, { task: create({ input: b.input, scenario: b.scenario, title: b.title, source: 'ui' }) })
    })
    route('/routines', async (_req, res) => json(res, { items: api.routines(), pending: routines.pending() }))
    post('/routines/create', async (b, res) => json(res, { routine: createRoutine({ input: b.input, schedule: b.schedule, kind: b.kind, title: b.title }) }))
    post('/routines/run', async (b, res) => json(res, { routine: runRoutine(String(b.id || '')) }))
    post('/routines/enable', async (b, res) => { const r = routines.setEnabled(String(b.id || ''), b.enabled !== false); if (!r) return json(res, { error: 'routine not found' }, 404); json(res, { routine: rview(r) }) })
    post('/routines/remove', async (b, res) => { const id = String(b.id || ''); const removed = routines.remove(id); if (removed) seen.forget(id); json(res, { removed }) })
    // 知道了 on a reminder is also having seen its row: the dot goes with the card.
    post('/routines/ack', async (b, res) => { const r = routines.ack(String(b.id || ''), b.at); if (!r) return json(res, { error: 'routine not found' }, 404); seen.mark([r.id]); json(res, { routine: rview(r), pending: routines.pending() }) })
    post('/cancel', async (b, res) => json(res, { task: api.cancel(String(b.id || '')) }))
    post('/verify', async (b, res) => json(res, { task: api.verify(String(b.id || '')) }))
    // Today's thread, or with ?day=YYYY-MM-DD (local date, the dayKey format) an earlier day's, to read back.
    route('/today', async (req, res) => {
      const day = String(query(req).get('day') || '').trim()
      if (!day) return json(res, { thread: api.today() })
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return json(res, { error: 'day must be YYYY-MM-DD' }, 400)
      const t = threadFor(day)
      json(res, { thread: t ? view(t) : null, day, readOnly: day !== dayKey() })
    })
    post('/today/say', async (b, res) => { if (!String(b.text || '').trim()) return json(res, { error: 'text is required' }, 400); json(res, { thread: await todaySay(b.text) }) })
    // §8.3 今日线程: the line across days, paged by time (feed.js). ?before=<ISO> pages back; ?limit= 1..200, default 60.
    route('/feed', async (req, res) => {
      const q = query(req)
      const before = String(q.get('before') || '').trim()
      if (before && !Number.isFinite(Date.parse(before))) return json(res, { error: 'before must be an ISO date' }, 400)
      const limit = q.get('limit') === null || q.get('limit') === '' ? undefined : Number(q.get('limit'))
      if (limit !== undefined && !Number.isFinite(limit)) return json(res, { error: 'limit must be a number' }, 400)
      json(res, buildFeed({ store, deliverables, routines, before: before || undefined, limit, today: dayKey() }))
    })
    post('/say', async (b, res) => { if (!String(b.text || '').trim()) return json(res, { error: 'text is required' }, 400); json(res, { task: await api.say(String(b.id || ''), b.text) }) })
    // History is the user's: rename a task, or delete it with its deliverables (a running one is cancelled first).
    post('/rename', async (b, res) => { const t = store.get(String(b.id || '')); if (!t) return json(res, { error: 'task not found' }, 404); const title = String(b.title || '').trim().slice(0, 200); if (!title) return json(res, { error: 'title is required' }, 400); store.update(t.id, { title }); json(res, { task: view(store.get(t.id)) }) })
    post('/remove', async (b, res) => {
      const t = store.get(String(b.id || '')); if (!t) return json(res, { error: 'task not found' }, 404)
      if (t.status !== 'done') { try { engine.cancel(t.id) } catch {} }
      for (const d of deliverables.forTask(t.id)) deliverables.remove(d.id)
      routines.forgetTask(t.id)
      store.remove(t.id)
      seen.forget(t.id)
      log(`task ${t.id} removed by the user: ${t.title}`)
      json(res, { removed: true })
    })
    post('/rerun', async (b, res) => { const t = store.get(String(b.id || '')); if (!t) return json(res, { error: 'task not found' }, 404); json(res, { task: create({ input: t.input, scenario: t.scenario, title: t.title, source: 'rerun' }) }) })
    route('/scenarios', async (_req, res) => json(res, { items: scenarios.list(), capabilities: capabilities() }))
    route('/deliverables', async (_req, res) => json(res, { items: deliverables.list().map(deliverableSummary) }))
    route('/deliverable', async (req, res) => { const d = deliverables.get(query(req).get('id') || ''); if (!d) return json(res, { error: 'deliverable not found' }, 404); json(res, { deliverable: d, task: api.get(d.taskId) }) })
    post('/rate', async (b, res) => { const d = deliverables.update(String(b.id || ''), { rating: b.rating === null ? null : Number(b.rating) || 0 }); if (!d) return json(res, { error: 'deliverable not found' }, 404); json(res, { deliverable: d }) })
    // Read state of the conversation column: { id } or { ids: [...] } of tasks and / or routines → seenAt = now.
    post('/seen', async (b, res) => {
      const ids = [...(Array.isArray(b.ids) ? b.ids : []), ...(b.id !== undefined && b.id !== null ? [b.id] : [])].map((x) => String(x || '').trim().slice(0, 100)).filter(Boolean)
      if (!ids.length) return json(res, { error: 'id is required' }, 400)
      const seenAt = seen.mark(ids)
      json(res, { id: ids[0], ids, seenAt })
    })
    // Search across tasks (title / input, or a deliverable body that leads to the task), routines and deliverables; ≤20 each, newest first.
    route('/search', async (req, res) => {
      const found = searchAll(query(req).get('q') || '', { tasks: store.items, deliverables: deliverables.items, routines: routines.items }, { routineAt: routineLastAt })
      json(res, { tasks: found.tasks.map((t) => { const { activity: _a, ...v } = view(t); return v }), routines: found.routines.map(rview), deliverables: found.deliverables })
    })
  })

  ctx.inject(['systemPrompt'], (sctx) => {
    try {
      sctx.systemPrompt.section({ name: 'mywork-tasks', order: 905, interpolate: false, text: '这台机器上装了 MyWork 任务引擎：用户要的结果可以交给后台任务（mywork_task_create），完成后成为「任务」页里的交付物。后台任务会话里必须用 deliver 交付。' })
    } catch (e) { log('system prompt section skipped: ' + (e && e.message)) }
  })

  log(`ready (${store.items.length} tasks, ${deliverables.items.length} deliverables, ${routines.items.length} routines, ${scenarios.list().length} scenario)`)
}
