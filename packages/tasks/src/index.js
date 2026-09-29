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
import { DeliverableStore, myworkDir, TaskStore, taskView } from './store.js'

export const name = 'dsh-mywork-tasks'
export const inject = ['tools', 'agents', 'sessions', 'workspaceRegistry', 'agentDefaultModel', 'agentPresets', 'permissionPresets']

/** Config (all optional): concurrency, timeoutMinutes, permission, agentPreset, cwd, tools, verify */
export const Config = configSchema({ concurrency: 2, timeoutMinutes: 20, permission: 'workspace-write', agentPreset: 'standard', cwd: '', tools: true, verify: true })

export function apply(ctx, config = {}) {
  const log = (m) => console.log('[dsh-mywork-tasks] ' + m)
  const dir = myworkDir()
  const store = new TaskStore(join(dir, 'tasks.json'))
  const deliverables = new DeliverableStore(join(dir, 'deliverables.json'))
  const scenarios = createScenarioRegistry()
  for (const s of BUILTIN_SCENARIOS) scenarios.register(s)
  const listeners = new Set()
  const emit = (kind, task, deliverable) => {
    const payload = { kind, task: task ? taskView(task, deliverables) : null, ...(deliverable ? { deliverable: { id: deliverable.id, title: deliverable.title, kind: deliverable.kind, taskId: deliverable.taskId } } : {}) }
    for (const fn of listeners) { try { fn(payload) } catch (e) { log('listener error: ' + (e && e.message)) } }
    try { ctx.emit('mywork/task', payload) } catch {}
  }
  let controller = null
  ctx.inject(['sessionController'], (sctx) => { controller = sctx.sessionController; sctx.effect(() => () => { controller = null }, 'dsh-mywork-tasks: controller') })
  /** What this machine can do, read from the tool registry at task time (members come and go). */
  const hasTool = (name) => { try { return !!ctx.tools.get(name) } catch { return false } }
  const capabilities = () => ({ browser: hasTool('open_url') || hasTool('browser_navigate'), office: hasTool('univer_new'), im: hasTool('im_send') })
  const engine = createEngine({
    ctx, store, deliverables, scenarios, log, emit, controller: () => controller, capabilities,
    config: { concurrency: Number(config.concurrency) || 2, timeoutMs: Math.max(1, Number(config.timeoutMinutes) || 20) * 60000, permission: String(config.permission || 'workspace-write'), agentPreset: config.agentPreset === '' ? undefined : (config.agentPreset || 'standard'), cwd: String(config.cwd || ''), verify: config.verify !== false },
  })

  const create = ({ input, scenario, title, source }) => {
    // The user never picks: a pack claims the input through match(), otherwise 通用 decides for itself.
    const s = scenario ? scenarios.resolve(scenario) : scenarios.route(input)
    const task = store.create({ input, scenario: s ? s.id : 'general', title, source })
    log(`task ${task.id} queued (${task.scenario}): ${task.title}`)
    emit('queued', task)
    engine.pump()
    return taskView(task, deliverables)
  }
  const api = {
    register: (s) => scenarios.register(s),
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
      async execute(args) { const t = create({ input: args.input, scenario: args.scenario, title: args.title, source: 'chat' }); return { id: t.id, title: t.title, status: t.status } },
      render: (_a, v) => [{ type: 'text', text: `已创建后台任务「${v.title}」（${v.id}），完成后在「任务」页查看。` }],
    }))
    ctx.tools.register(defineRawTool({
      name: 'mywork_tasks',
      description: '列出 MyWork 的后台任务（最近 20 条：状态、当前步骤、交付物）和已装的场景。',
      parameters: {},
      async execute() { return { scenarios: scenarios.list().map((s) => ({ id: s.id, label: s.label })), tasks: api.list().slice(0, 20).map((t) => ({ id: t.id, title: t.title, status: t.statusLabel, step: t.currentStep, deliverables: t.deliverables.map((d) => d.title), error: t.error })) } },
    }))
  }

  ctx.inject(['webServer'], (wctx) => {
    const json = (res, body, status = 200) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)) }
    const readBody = (req) => new Promise((resolve, reject) => { let d = ''; let n = 0; req.on('data', (c) => { n += c.length; if (n > 256 * 1024) { reject(new Error('body too large')); req.destroy(); return } d += c }); req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}) } catch (e) { reject(e) } }); req.on('error', reject) })
    const query = (req) => new URL(req.url || '/', 'http://localhost').searchParams
    const route = (path, handler) => wctx.webServer.register({ kind: 'exact', path: '/mywork-tasks/api' + path, handler: (req, res) => rejectUntrusted(ctx, req, res, json) || Promise.resolve(handler(req, res)).catch((e) => json(res, { error: e instanceof Error ? e.message : String(e) }, 500)) })
    const post = (path, handler) => route(path, async (req, res) => { if (req.method !== 'POST') return json(res, { error: 'POST only' }, 405); return handler(await readBody(req), res, req) })
    route('/tasks', async (_req, res) => json(res, { items: api.list().map(({ activity: _a, ...t }) => t), scenarios: scenarios.list(), capabilities: capabilities() }))
    route('/task', async (req, res) => { const t = api.get(query(req).get('id') || ''); if (!t) return json(res, { error: 'task not found' }, 404); json(res, { task: t, deliverables: deliverables.forTask(t.id) }) })
    post('/create', async (b, res) => { if (!String(b.input || '').trim()) return json(res, { error: 'input is required' }, 400); json(res, { task: create({ input: b.input, scenario: b.scenario, title: b.title, source: 'ui' }) }) })
    post('/cancel', async (b, res) => json(res, { task: api.cancel(String(b.id || '')) }))
    post('/verify', async (b, res) => json(res, { task: api.verify(String(b.id || '')) }))
    post('/say', async (b, res) => { if (!String(b.text || '').trim()) return json(res, { error: 'text is required' }, 400); json(res, { task: await api.say(String(b.id || ''), b.text) }) })
    post('/rerun', async (b, res) => { const t = store.get(String(b.id || '')); if (!t) return json(res, { error: 'task not found' }, 404); json(res, { task: create({ input: t.input, scenario: t.scenario, title: t.title, source: 'rerun' }) }) })
    route('/scenarios', async (_req, res) => json(res, { items: scenarios.list(), capabilities: capabilities() }))
    route('/deliverables', async (_req, res) => json(res, { items: deliverables.list().map((d) => ({ id: d.id, taskId: d.taskId, title: d.title, kind: d.kind, scenario: d.scenario, createdAt: d.createdAt, rating: d.rating, verification: d.verification })) }))
    route('/deliverable', async (req, res) => { const d = deliverables.get(query(req).get('id') || ''); if (!d) return json(res, { error: 'deliverable not found' }, 404); json(res, { deliverable: d, task: api.get(d.taskId) }) })
    post('/rate', async (b, res) => { const d = deliverables.update(String(b.id || ''), { rating: b.rating === null ? null : Number(b.rating) || 0 }); if (!d) return json(res, { error: 'deliverable not found' }, 404); json(res, { deliverable: d }) })
  })

  ctx.inject(['systemPrompt'], (sctx) => {
    try {
      sctx.systemPrompt.section({ name: 'mywork-tasks', order: 905, interpolate: false, text: '这台机器上装了 MyWork 任务引擎：用户要的结果可以交给后台任务（mywork_task_create），完成后成为「任务」页里的交付物。后台任务会话里必须用 deliver 交付。' })
    } catch (e) { log('system prompt section skipped: ' + (e && e.message)) }
  })

  log(`ready (${store.items.length} tasks, ${deliverables.items.length} deliverables, ${scenarios.list().length} scenario)`)
}
