/**
 * dsh-mywork-tasks — host half: the task engine of MyWork Kit v2.
 *
 *   一句话 → 任务（后台会话）→ 交付物 → 通知
 *
 *   • service `myworkTasks`: scenario plugins register { id, label, intro, examples, compose, toolStepMap, … }
 *     and can create / list tasks (ctx.provide, so `inject: ['myworkTasks']` works in cordis).
 *   • tools: deliver({ title, markdown, kind?, data? }) inside a task session;
 *            mywork_task_create({ input, scenario? }) and mywork_tasks() from any session.
 *   • HTTP: /mywork-tasks/api/{tasks, task, create, cancel, rerun, verify, say, scenarios, deliverables, deliverable, rate}
 *   • events: ctx.emit('mywork/task', { kind: started|step|deliverable|done, task, deliverable? })
 */
import { join } from 'node:path'
import { createEngine } from './engine.js'
import { configSchema, defineRawTool, rejectUntrusted } from './harness.js'
import { BUILTIN_SCENARIOS, createScenarioRegistry } from './scenarios.js'
import { DeliverableStore, myworkDir, TaskStore, taskView, STATUS_LABELS } from './store.js'
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

import { describeSchedule, parseSchedule, RoutineStore, routineView } from './routines.js'

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
  const scenarios = createScenarioRegistry()
  for (const s of BUILTIN_SCENARIOS) scenarios.register(s)
  const listeners = new Set()
  const emit = (kind, task, deliverable, extra) => {
    const payload = { kind, task: task ? taskView(task, deliverables) : null, ...(deliverable ? { deliverable: { id: deliverable.id, title: deliverable.title, kind: deliverable.kind, taskId: deliverable.taskId } } : {}), ...(extra || {}) }
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
    return taskView(task, deliverables)
  }
  /** Routines: a sentence with a time becomes a standing thing instead of a one-off task. */
  const createRoutine = ({ input, schedule, kind, title }) => {
    let parsed = null
    if (!schedule) { parsed = parseSchedule(input); if (!parsed) throw new Error('没看出时间。写法如「每天 9 点…」「每周一 8:30…」「工作日 18 点…」「明天 8 点提醒我…」「30 分钟后提醒我…」') }
    const finalKind = kind || (parsed ? parsed.kind : 'task')
    const finalTitle = finalKind === 'task' ? String(title || '').replace(/(的)?提醒$/, '').trim() : title // 「写周报提醒」 is a report MyWork writes, so the title is the report
    const r = routines.create({ kind: finalKind, title: finalTitle, input: parsed ? parsed.text : input, schedule: schedule || parsed.schedule })
    log(`routine ${r.id} ${r.kind} ${describeSchedule(r.schedule)}: ${r.title}`)
    emit('routine', null, undefined, { routine: routineView(r) })
    return routineView(r)
  }
  const runRoutine = (id) => {
    const r = routines.get(id)
    if (!r) throw new Error('routine not found')
    if (r.kind === 'remind') { routines.fire(id); routines.ran(id, { fired: true }); emit('remind', null, undefined, { routine: routineView(routines.get(id)) }); return routineView(routines.get(id)) }
    const task = create({ input: r.input, title: r.title, source: 'routine', routineId: r.id })
    routines.ran(id, { taskId: task.id })
    return routineView(routines.get(id))
  }
  // Scheduler: every 30 s run what is due. A run that fires while the server was down runs once on start.
  ctx.effect(() => { const tick = () => { try { for (const r of routines.due()) runRoutine(r.id) } catch (e) { log('scheduler: ' + (e && e.message)) } }; const id = setInterval(tick, 30000); const first = setTimeout(tick, 5000); return () => { clearInterval(id); clearTimeout(first) } }, 'dsh-mywork-tasks: scheduler')

  /** 今日's conversation: one assistant task per day, created on the first message, continued with say(). */
  const dayKey = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') }
  const todayThread = () => store.items.find((t) => t.scenario === 'assistant' && t.dayKey === dayKey()) || null
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
      return taskView(store.get(t.id), deliverables)
    }
    return taskView(await engine.say(t.id, body), deliverables)
  }
  const api = {
    register: (s) => scenarios.register(s),
    today: () => { const t = todayThread(); return t ? taskView(t, deliverables) : null },
    todaySay,
    routines: () => routines.list().map(routineView),
    routine: (id) => { const r = routines.get(id); return r ? routineView(r) : null },
    createRoutine,
    runRoutine,
    scenarios: () => scenarios.list(),
    create,
    list: () => store.list().map((t) => taskView(t, deliverables)),
    get: (id) => { const t = store.get(id); return t ? taskView(t, deliverables) : null },
    cancel: (id) => taskView(engine.cancel(id), deliverables),
    verify: (id) => taskView(engine.reverify(id), deliverables),
    say: async (id, text) => taskView(await engine.say(id, text), deliverables),
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
  }

  ctx.inject(['webServer'], (wctx) => {
    const json = (res, body, status = 200) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)) }
    const readBody = (req) => new Promise((resolve, reject) => { let d = ''; let n = 0; req.on('data', (c) => { n += c.length; if (n > 256 * 1024) { reject(new Error('body too large')); req.destroy(); return } d += c }); req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}) } catch (e) { reject(e) } }); req.on('error', reject) })
    const query = (req) => new URL(req.url || '/', 'http://localhost').searchParams
    const route = (path, handler) => wctx.webServer.register({ kind: 'exact', path: '/mywork-tasks/api' + path, handler: (req, res) => rejectUntrusted(ctx, req, res, json) || Promise.resolve(handler(req, res)).catch((e) => json(res, { error: e instanceof Error ? e.message : String(e) }, 500)) })
    const post = (path, handler) => route(path, async (req, res) => { if (req.method !== 'POST') return json(res, { error: 'POST only' }, 405); return handler(await readBody(req), res, req) })
    const deliverableSummary = (d) => ({ id: d.id, taskId: d.taskId, title: d.title, kind: d.kind, scenario: d.scenario, createdAt: d.createdAt, rating: d.rating, verification: d.verification })
    // One payload feeds 今日, the sidebar and the lists: tasks without their activity, recent deliverables, packs, capabilities.
    route('/tasks', async (_req, res) => json(res, { items: api.list().map(({ activity: _a, ...t }) => t), deliverables: deliverables.list().slice(0, 60).map(deliverableSummary), reminders: routines.pending(), routines: api.routines().map((r) => ({ id: r.id, kind: r.kind, title: r.title, scheduleLabel: r.scheduleLabel, enabled: r.enabled, nextRunAt: r.nextRunAt, once: r.schedule && r.schedule.type === 'once', lastTaskId: ((r.runs || []).find((x) => x.taskId) || {}).taskId || '' })), scenarios: scenarios.list(), capabilities: capabilities() }))
    route('/task', async (req, res) => { const t = api.get(query(req).get('id') || ''); if (!t) return json(res, { error: 'task not found' }, 404); json(res, { task: t, deliverables: deliverables.forTask(t.id) }) })
    post('/create', async (b, res) => {
      if (!String(b.input || '').trim()) return json(res, { error: 'input is required' }, 400)
      if (!b.scenario && b.routine !== false && parseSchedule(b.input)) return json(res, { routine: createRoutine({ input: b.input }) })
      json(res, { task: create({ input: b.input, scenario: b.scenario, title: b.title, source: 'ui' }) })
    })
    route('/routines', async (_req, res) => json(res, { items: api.routines(), pending: routines.pending() }))
    post('/routines/create', async (b, res) => json(res, { routine: createRoutine({ input: b.input, schedule: b.schedule, kind: b.kind, title: b.title }) }))
    post('/routines/run', async (b, res) => json(res, { routine: runRoutine(String(b.id || '')) }))
    post('/routines/enable', async (b, res) => { const r = routines.setEnabled(String(b.id || ''), b.enabled !== false); if (!r) return json(res, { error: 'routine not found' }, 404); json(res, { routine: routineView(r) }) })
    post('/routines/remove', async (b, res) => json(res, { removed: routines.remove(String(b.id || '')) }))
    post('/routines/ack', async (b, res) => { const r = routines.ack(String(b.id || ''), b.at); if (!r) return json(res, { error: 'routine not found' }, 404); json(res, { routine: routineView(r), pending: routines.pending() }) })
    post('/cancel', async (b, res) => json(res, { task: api.cancel(String(b.id || '')) }))
    post('/verify', async (b, res) => json(res, { task: api.verify(String(b.id || '')) }))
    route('/today', async (_req, res) => json(res, { thread: api.today() }))
    post('/today/say', async (b, res) => { if (!String(b.text || '').trim()) return json(res, { error: 'text is required' }, 400); json(res, { thread: await todaySay(b.text) }) })
    post('/say', async (b, res) => { if (!String(b.text || '').trim()) return json(res, { error: 'text is required' }, 400); json(res, { task: await api.say(String(b.id || ''), b.text) }) })
    post('/rerun', async (b, res) => { const t = store.get(String(b.id || '')); if (!t) return json(res, { error: 'task not found' }, 404); json(res, { task: create({ input: t.input, scenario: t.scenario, title: t.title, source: 'rerun' }) }) })
    route('/scenarios', async (_req, res) => json(res, { items: scenarios.list(), capabilities: capabilities() }))
    route('/deliverables', async (_req, res) => json(res, { items: deliverables.list().map(deliverableSummary) }))
    route('/deliverable', async (req, res) => { const d = deliverables.get(query(req).get('id') || ''); if (!d) return json(res, { error: 'deliverable not found' }, 404); json(res, { deliverable: d, task: api.get(d.taskId) }) })
    post('/rate', async (b, res) => { const d = deliverables.update(String(b.id || ''), { rating: b.rating === null ? null : Number(b.rating) || 0 }); if (!d) return json(res, { error: 'deliverable not found' }, 404); json(res, { deliverable: d }) })
  })

  ctx.inject(['systemPrompt'], (sctx) => {
    try {
      sctx.systemPrompt.section({ name: 'mywork-tasks', order: 905, interpolate: false, text: '这台机器上装了 MyWork 任务引擎：用户要的结果可以交给后台任务（mywork_task_create），完成后成为「任务」页里的交付物。后台任务会话里必须用 deliver 交付。' })
    } catch (e) { log('system prompt section skipped: ' + (e && e.message)) }
  })

  log(`ready (${store.items.length} tasks, ${deliverables.items.length} deliverables, ${routines.items.length} routines, ${scenarios.list().length} scenario)`)
}
