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
import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import qrcode from 'qrcode-generator'
import * as installer from './installer.js'
import { sameSecret, startLanGateway } from './lan-gateway.js'
import { newKeyPair, startRelayClient } from './relay-client.js'
import { configSchema, defineRawTool, rejectUntrusted } from './harness.js'
import { repairImWorkspacesFile } from './im-guard.js'

export const name = 'dsh-mywork-kit'
export const inject = []

/**
 * Config (all optional):
 *   allowInstall: expose the install/update endpoints (default true). Set false
 *                 on shared/remote deployments where the browser must not run pnpm.
 */
export const Config = configSchema({ allowInstall: true })

/** The relay every phone goes through (apps/relay, deployed on Cloudflare's free plan); lan.json's relayUrl or MYWORK_RELAY_URL override it. */
export const DEFAULT_RELAY_URL = 'https://mywork-relay.a313295747.workers.dev'

export function apply(ctx, config = {}) {
  // IM accounts (dsh-im-connect) whose workspace is not registered would fail every message:
  // repoint them to the first registered workspace before the IM plugin starts.
  ctx.inject(['workspaceRegistry'], (wctx) => {
    try {
      const paths = wctx.workspaceRegistry.list().map((w) => w.path)
      for (const c of repairImWorkspacesFile(paths)) console.warn(`[dsh-mywork-kit] IM account ${c.id}: workspace "${c.from}" is not registered, using "${c.to}"`)
    } catch (e) { console.warn('[dsh-mywork-kit] IM workspace guard skipped: ' + (e && e.message)) }
  })
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

    // ---- 手机 ----------------------------------------------------------------------------------
    // The phone reaches this computer through the encrypted relay only (relay-client.js; apps/relay on Cloudflare),
    // from any network: one switch, 允许手机连接, remembered in $DSH_HOME/mywork/lan.json. On, a small gateway listens
    // on loopback (lan-gateway.js: it holds dsh's session so the launch token never leaves this computer) and the
    // computer dials the relay; phones' requests come back through it to the gateway. The pairing QR is the relay's
    // address with, after `#` (never sent to any server), this pairing's id, the computer's public key and the phone
    // token kept in the same file, so a paired phone survives restarts. Nothing listens on the LAN any more.
    const homeDir = () => process.env.DSH_HOME || join(homedir(), '.dsh')
    const lanFile = () => join(homeDir(), 'mywork', 'lan.json')
    const readLan = () => { try { return existsSync(lanFile()) ? JSON.parse(readFileSync(lanFile(), 'utf8')) : {} } catch { return {} } }
    const writeLan = (patch) => { mkdirSync(join(homeDir(), 'mywork'), { recursive: true }); const next = { ...readLan(), ...patch }; writeFileSync(lanFile(), JSON.stringify(next, null, 2) + '\n'); return next }
    const phoneToken = () => {
      const t = readLan().phoneToken
      if (typeof t === 'string' && t.length >= 32) return t
      return writeLan({ phoneToken: randomBytes(32).toString('base64url') }).phoneToken
    }
    const gatewayPort = () => Number(readLan().port) || wctx.webServer.port + 1
    const launchToken = () => {
      try { const c = ctx.get('connection'); const u = new URL(c.authenticatedUrl(`http://127.0.0.1:${wctx.webServer.port}`)); return u.searchParams.get('token') || '' } catch { return '' }
    }
    // The relay address: lan.json's relayUrl, else MYWORK_RELAY_URL, else DEFAULT_RELAY_URL; MYWORK_RELAY_PUBLIC_URL
    // overrides the address the phone dials (an emulator reaches the computer's localhost at 10.0.2.2).
    const relayUrl = () => String(readLan().relayUrl || process.env.MYWORK_RELAY_URL || DEFAULT_RELAY_URL).trim().replace(/\/+$/, '')
    const relayPublicUrl = () => String(process.env.MYWORK_RELAY_PUBLIC_URL || relayUrl()).trim().replace(/\/+$/, '')
    const relayKeys = () => {
      const l = readLan()
      if (typeof l.relayId === 'string' && l.relayId.length >= 16 && l.relayPk && l.relaySk) return { id: l.relayId, pk: l.relayPk, sk: l.relaySk }
      const k = newKeyPair()
      const n = writeLan({ relayId: randomBytes(18).toString('base64url'), relayPk: k.publicKey, relaySk: k.secretKey })
      return { id: n.relayId, pk: n.relayPk, sk: n.relaySk }
    }
    // Through the relay a phone reaches MyWork's API and signed file links, nothing else of dsh.
    const relayAllowed = (p) => /^\/mywork-tasks\/(api\/|files\/raw\?)/.test(p)
    const forwardToGateway = async (method, path, body) => {
      const r = await fetch(`http://127.0.0.1:${gatewayPort()}${path}`, { method, redirect: 'manual', headers: { authorization: 'Bearer ' + phoneToken(), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) }, body })
      return { status: r.status, contentType: r.headers.get('content-type') || '', body: Buffer.from(await r.arrayBuffer()) }
    }
    let gateway = null
    let relay = null
    const openPhone = () => {
      if (!gateway) { phoneToken(); gateway = startLanGateway({ host: '127.0.0.1', targetPort: wctx.webServer.port, listenPort: gatewayPort(), log: (m) => console.log('[dsh-mywork-kit] ' + m), launchToken, phoneToken }) }
      if (!relay && relayUrl()) {
        const k = relayKeys()
        relay = startRelayClient({ relayUrl: relayUrl(), id: k.id, secretKey: k.sk, authorize: (t) => sameSecret(t, phoneToken()), forward: forwardToGateway, allowed: relayAllowed, log: (m) => console.log('[dsh-mywork-kit] ' + m) })
      }
    }
    const closePhone = () => {
      if (relay) { relay.close(); relay = null }
      if (gateway) { try { gateway.close() } catch { /* already closed */ } gateway = null }
    }
    /** What the QR says: the relay, then (after `#`) the pairing id, the computer's public key and the phone token. */
    const pairingText = () => {
      const k = relayKeys()
      return `${relayPublicUrl()}/#i=${k.id}&k=${k.pk}&t=${phoneToken()}`
    }

    if (readLan().enabled) openPhone()
    ctx.effect(() => () => closePhone(), 'dsh-mywork-kit: phone relay')
    route('/phone', async (req, res) => {
      const on = !!gateway
      const here = loopback(req) // the pairing code is only ever shown on the computer itself
      let pairing = null
      if (here && on && relayPublicUrl()) {
        const qr = qrcode(0, 'M'); qr.addData(pairingText()); qr.make()
        pairing = { svg: qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true }) }
      }
      const rs = relay ? relay.status() : null
      json(res, { on, wanted: !!readLan().enabled, here, pairing, relay: { url: relayUrl(), connected: !!(rs && rs.connected), phones: rs ? rs.phones : 0, error: rs ? rs.error : '' } })
    })
    route('/phone/enable', async (req, res) => {
      if (req.method !== 'POST') return json(res, { error: 'POST only' }, 405)
      if (!loopback(req)) return json(res, { error: 'this switch is limited to loopback requests' }, 403)
      const body = await readBody(req).catch(() => ({}))
      const enabled = body.enabled !== false
      writeLan({ enabled })
      if (enabled) openPhone(); else closePhone()
      json(res, { wanted: enabled, on: !!gateway })
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
