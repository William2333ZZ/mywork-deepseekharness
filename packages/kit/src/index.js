/**
 * dsh-mywork-kit — host half.
 *
 * The kit is a bundle-of-bundles: installing it mounts this row (plus dsh's
 * built-in session reminders, see cordis.patch.yml) and exposes a small
 * same-origin API the Settings page uses to see which kit members are
 * installed and to install / update them with pnpm (see installer.js).
 *
 * Model tool `mywork_kit_status` lets the agent explain what is installed.
 */
import * as installer from './installer.js'
import { configSchema, defineRawTool, rejectUntrusted } from './harness.js'

export const name = 'dsh-mywork-kit'
export const inject = []

/**
 * Config (all optional):
 *   allowInstall: expose the install/update endpoints (default true). Set false
 *                 on shared/remote deployments where the browser must not run pnpm.
 */
export const Config = configSchema({ allowInstall: true })

export function apply(ctx, config = {}) {
  let boot = { bundles: new Set() }
  try { boot = installer.captureBootState() } catch (e) { console.warn('[dsh-mywork-kit] boot snapshot failed:', e && e.message) }
  let busy = false

  ctx.inject(['tools'], (tctx) => {
    tctx.tools.register(defineRawTool({
      name: 'mywork_kit_status',
      description: '查看 MyWork Kit（本组合包）各成员插件的安装状态：主题、提醒、定时任务、打开网页、Mermaid、插件市场等。',
      parameters: {},
      async execute() {
        const s = installer.status(process.env, boot)
        return { ok: s.ok, error: s.error, profile: s.profile && s.profile.name, members: (s.members || []).map((m) => ({ name: m.name, label: m.label, installed: m.installed, version: m.version, active: m.active, needsRestart: m.needsRestart })) }
      },
    }))
  })

  ctx.inject(['webServer'], (wctx) => {
    const json = (res, body, status = 200) => {
      res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
      res.end(JSON.stringify(body))
    }
    const readBody = (req) => new Promise((resolve, reject) => {
      let data = ''; let size = 0
      req.on('data', (c) => { size += c.length; if (size > 64 * 1024) { reject(new Error('body too large')); req.destroy(); return } data += c })
      req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}) } catch (e) { reject(e) } })
      req.on('error', reject)
    })
    const loopback = (req) => {
      const a = req.socket && req.socket.remoteAddress
      return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1'
    }
    const route = (path, handler) => wctx.webServer.register({
      kind: 'exact', path: '/mywork-kit/api' + path,
      handler: (req, res) => rejectUntrusted(ctx, req, res, json) || Promise.resolve(handler(req, res)).catch((e) => json(res, { error: e instanceof Error ? e.message : String(e) }, 500)),
    })

    route('/status', async (_req, res) => {
      const s = installer.status(process.env, boot)
      s.allowInstall = config.allowInstall !== false
      s.busy = busy
      json(res, s)
    })
    route('/check-updates', async (_req, res) => json(res, await installer.checkUpdates()))
    const mutate = (fn) => async (req, res) => {
      if (req.method !== 'POST') return json(res, { error: 'POST only' }, 405)
      if (config.allowInstall === false) return json(res, { error: 'installing from the browser is disabled by config (allowInstall: false)' }, 403)
      if (!loopback(req)) return json(res, { error: 'install is limited to loopback requests' }, 403)
      if (busy) return json(res, { error: 'another install/update is running' }, 409)
      const body = await readBody(req).catch(() => ({}))
      const names = Array.isArray(body.names) ? body.names.filter((n) => typeof n === 'string') : null
      busy = true
      try { const r = await fn(names); json(res, r, r.ok ? 200 : 500) } finally { busy = false }
    }
    route('/install', mutate((names) => installer.install(names)))
    route('/update', mutate((names) => installer.update(names)))
  })
}
