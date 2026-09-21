/**
 * dsh-mywork-schedule — host half (reminders; scheduled tasks come from @michengai/dsh-automation).
 *
 *   • Model tools: reminder_add / reminder_list / reminder_delete / reminder_toggle
 *   • Slash command: /remind 10m 喝水 | /remind 18:30 下班 | /remind daily 09:00 站会
 *                    /remind weekly 1,3,5 10:00 周会 | /remind every 30m 喝水
 *                    /remind list | /remind del <id>
 *   • HTTP API for the browser panel under /mywork-schedule/api/*
 *
 * The browser is where alarms actually fire (toast + Notification + beep); the
 * host only stores rules and records what fired so several tabs agree.
 */
import { createRequire } from 'node:module'
import { ReminderStore, defaultDataPath } from './store.js'
import { configSchema, defineRawTool, rejectUntrusted } from './harness.js'

const require = createRequire(import.meta.url)
const logic = require('./logic.cjs')

export const name = 'dsh-mywork-schedule'
export const inject = ['tools']

/**
 * Config (all optional):
 *   dataPath: absolute path of the JSON file; defaults to $DSH_HOME/mywork/reminders.json
 *   command:  register the /remind slash command (default true)
 *   tools:    register the reminder_* model tools (default true)
 */
export const Config = configSchema({ dataPath: '', command: true, tools: true })

function tool(name, description, parameters, execute) {
  return defineRawTool({ name, description, parameters, execute })
}

function view(r) {
  const next = logic.nextOccurrence(r, new Date(r.lastFiredAt || r.createdAt || Date.now()))
  return { ...r, rule: logic.describe(r, 'zh'), nextAt: next ? next.toISOString() : null }
}

export function apply(ctx, config = {}) {
  const store = new ReminderStore(config.dataPath || defaultDataPath())

  // ---- model tools -------------------------------------------------------
  if (config.tools !== false) {
    ctx.tools.register(tool(
      'reminder_add',
      '为用户设置一个闹钟/提醒（到点时在 DSH 网页里弹出提示、浏览器通知和提示音）。kind: once（需要 at，RFC 3339 带时区偏移）/ daily（需要 time HH:MM，用户本地时间）/ weekly（time + weekdays，1=周一…7=周日）/ interval（every_minutes）。',
      {
        title: { type: 'string', required: true, description: '提醒内容（简短）' },
        kind: { type: 'string', description: 'once | daily | weekly | interval（缺省按其他参数推断）' },
        at: { type: 'string', description: 'once：绝对时间，RFC 3339，例如 2026-09-21T09:00:00+08:00' },
        time: { type: 'string', description: 'daily / weekly：本地时间 HH:MM' },
        weekdays: { type: 'array', description: 'weekly：星期几数组，1=周一 … 7=周日' },
        every_minutes: { type: 'number', description: 'interval：间隔分钟数（>= 1）' },
        note: { type: 'string', description: '可选备注' },
      },
      async (args, exec) => {
        const input = { ...(args || {}), everyMinutes: args && args.every_minutes }
        if (exec && exec.agent && exec.agent.id) input.sessionId = String(exec.agent.id)
        const n = logic.normalize(input)
        if (!n.ok) throw new Error(n.error)
        return view(store.add(n.value))
      },
    ))

    ctx.tools.register(tool(
      'reminder_list',
      '列出用户的全部闹钟/提醒及其下次触发时间。',
      {},
      async () => {
        const items = store.list().map(view)
        return { count: items.length, items }
      },
    ))

    ctx.tools.register(tool(
      'reminder_delete',
      '删除一条提醒。',
      { id: { type: 'string', required: true, description: '提醒 id' } },
      async (args) => ({ id: args.id, removed: store.remove(String(args.id)) }),
    ))

    ctx.tools.register(tool(
      'reminder_toggle',
      '启用或暂停一条提醒。',
      {
        id: { type: 'string', required: true, description: '提醒 id' },
        enabled: { type: 'boolean', description: 'true 启用（默认）/ false 暂停' },
      },
      async (args) => {
        const r = store.update(String(args.id), { enabled: args.enabled !== false })
        if (!r) throw new Error('reminder not found')
        return view(r)
      },
    ))
  }

  // ---- /remind slash command (optional: only when commands exists) ---------
  if (config.command !== false) {
    ctx.inject(['commands'], (cctx) => {
      cctx.commands.register({
        name: 'remind',
        description: '设置提醒：/remind 10m 喝水 · /remind 18:30 下班 · /remind daily 09:00 站会 · /remind list',
        input: { hint: '10m 喝水 | 18:30 下班 | daily 09:00 站会 | weekly 1,3,5 10:00 周会 | every 30m 喝水 | list | del <id>' },
        handler: ({ agent, rawInput }) => {
          const text = String(rawInput || '').trim()
          const head = text.split(/\s+/)[0]
          if (!text || head === 'help') {
            return { kind: 'success', text: '用法：/remind 10m 喝水 · /remind 18:30 下班 · /remind daily 09:00 站会 · /remind weekly 1,3,5 10:00 周会 · /remind every 30m 喝水 · /remind list · /remind del <id>' }
          }
          if (head === 'list' || head === 'ls') {
            const items = store.list().map(view)
            if (items.length === 0) return { kind: 'success', text: '还没有提醒。' }
            return { kind: 'success', text: items.map((r) => `${r.enabled ? '⏰' : '⏸'} ${r.id}  ${r.title}  [${r.rule}]  下次: ${r.nextAt ? new Date(r.nextAt).toLocaleString() : '—'}`).join('\n') }
          }
          if (head === 'del' || head === 'rm' || head === 'delete') {
            const id = text.split(/\s+/)[1]
            return store.remove(String(id || '')) ? { kind: 'success', text: `已删除 ${id}` } : { kind: 'error', text: `没有找到 ${id}` }
          }
          const parsed = logic.parseCommand(text, new Date())
          if (!parsed.ok) return { kind: 'error', text: `无法识别时间：${text}。试试 /remind 10m 喝水 或 /remind 18:30 下班` }
          if (!parsed.value.title) return { kind: 'error', text: '请写上提醒内容，例如 /remind 10m 喝水' }
          if (agent && agent.id) parsed.value.sessionId = String(agent.id)
          const r = view(store.add(parsed.value))
          return { kind: 'success', text: `已设置提醒「${r.title}」（${r.rule}），下次：${r.nextAt ? new Date(r.nextAt).toLocaleString() : '—'}。id: ${r.id}` }
        },
      })
    })
  }

  // ---- HTTP API for the browser panel (optional: only with a web server) ---
  ctx.inject(['webServer'], (wctx) => {
    const json = (res, body, status = 200) => {
      res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
      res.end(JSON.stringify(body))
    }
    const readBody = (req) => new Promise((resolve, reject) => {
      let data = ''; let size = 0
      req.on('data', (c) => {
        size += c.length
        if (size > 256 * 1024) { reject(Object.assign(new Error('body too large'), { statusCode: 413 })); req.destroy(); return }
        data += c
      })
      req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}) } catch (e) { reject(Object.assign(e, { statusCode: 400 })) } })
      req.on('error', reject)
    })
    const route = (path, handler) => wctx.webServer.register({
      kind: 'exact',
      path: '/mywork-schedule/api' + path,
      handler: (req, res) => rejectUntrusted(ctx, req, res, json) || Promise.resolve(handler(req, res)).catch((e) => json(res, { error: e instanceof Error ? e.message : String(e) }, e && e.statusCode ? e.statusCode : 500)),
    })

    route('/list', async (_req, res) => json(res, { items: store.list().map(view), dataPath: store.path }))
    route('/add', async (req, res) => {
      if (req.method !== 'POST') return json(res, { error: 'POST only' }, 405)
      const body = await readBody(req)
      const n = logic.normalize(body)
      if (!n.ok) return json(res, { error: n.error }, 400)
      json(res, { item: view(store.add(n.value)) })
    })
    route('/update', async (req, res) => {
      if (req.method !== 'POST') return json(res, { error: 'POST only' }, 405)
      const body = await readBody(req)
      const cur = store.get(String(body.id || ''))
      if (!cur) return json(res, { error: 'not found' }, 404)
      const merged = { ...cur, ...body }
      const n = logic.normalize(merged)
      if (!n.ok) return json(res, { error: n.error }, 400)
      json(res, { item: view(store.update(cur.id, { ...n.value })) })
    })
    route('/remove', async (req, res) => {
      if (req.method !== 'POST') return json(res, { error: 'POST only' }, 405)
      const body = await readBody(req)
      json(res, { removed: store.remove(String(body.id || '')) })
    })
    route('/fired', async (req, res) => {
      if (req.method !== 'POST') return json(res, { error: 'POST only' }, 405)
      const body = await readBody(req)
      const r = store.markFired(String(body.id || ''), body.at || new Date().toISOString())
      json(res, { item: r ? view(r) : null })
    })
  })
}
