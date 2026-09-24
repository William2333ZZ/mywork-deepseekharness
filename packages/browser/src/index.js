/**
 * dsh-mywork-browser — host half.
 *
 *   1. Starts a background Chrome/Chromium/Edge (new headless by default) with a
 *      loopback DevTools port and keeps it alive for the dsh process lifetime.
 *   2. Playwright MCP (the official runtime + pinned @playwright/mcp, installed in the
 *      profile as kit members) is mounted by this plugin for EVERY session, attached to
 *      that same browser → the model gets `mcp__playwright-mcp__*` tools in every
 *      conversation (the official provider row would give them to one session only).
 *   3. This plugin's CDP viewer streams the pages into the dsh web UI (right
 *      sidebar tab "实时浏览器") and forwards your mouse / keyboard back, so you
 *      can watch the model work and take over at any moment.
 *   4. A short system-prompt section tells the model the browser exists.
 *   5. Bookmarks (快捷链接) in $DSH_HOME/mywork/links.json, the `open_url` /
 *      `quick_links` model tools and the `/open` slash command. `open_url`
 *      navigates the background Chrome itself; the CDP target watcher then
 *      reveals the live tab in the UI (event-driven, no polling, no iframe).
 */
import { launchChrome, killChrome, probe } from './chrome.js'
import { ViewerHub, BrowserWatcher } from './cdp.js'
import { configSchema, defineRawTool, rejectUntrusted } from './harness.js'
import { LinkStore, defaultLinksPath, normalizeUrl, openInSystemBrowser } from './links.js'
import { mountSharedPlaywright } from './mcp-provider.js'
import { HistoryStore, SEARCH_ENGINES, defaultHistoryPath, resolveOmni } from './history.js'
import { parseCookies, summarize, groupByDomain } from './cookies.js'
import { existsSync as existsSyncHistory } from 'node:fs'

export const name = 'dsh-mywork-browser'
// browserUse / agents / systemPrompt are what the Playwright runtime needs to mount per session.
export const inject = ['tools', 'browserUse', 'agents', 'systemPrompt']

/**
 * Config (all optional):
 *   autoLaunch:     start the browser when dsh starts (default true)
 *   headless:       new headless mode (default true); false shows a real window too
 *   port:           DevTools port on 127.0.0.1 (default 9333, or MYWORK_BROWSER_PORT)
 *   executablePath: browser binary; auto-detected (Chrome / Chromium / Edge) when empty
 *   userDataDir:    profile dir; default $DSH_HOME/mywork/chrome-profile (logins persist)
 *   width, height:  window / screencast size (default 1280 × 800)
 *   quality:        JPEG quality of the live view (default 60)
 *   pixelRatio:     device scale factor the browser is launched with (default 2). Headless Chrome screencasts at
 *                   its launch scale factor, so 2 makes the live stream itself Retina-sharp; 1 = smaller frames
 *   proxy:          --proxy-server for the launched browser, e.g. socks5://127.0.0.1:1080
 *                   (or MYWORK_BROWSER_PROXY); empty = system proxy settings
 *   promptHint:     add the "Real browser" system prompt section (default true)
 *   linksPath:      bookmarks JSON; default $DSH_HOME/mywork/links.json
 *   allowSystemBrowser: allow open_url target=system / the "system browser" buttons (default true)
 *   seedLinks:      bookmarks written on first run when the file does not exist yet
 *   modelTools:     mount Playwright MCP for every session (default true)
 *   toolCallTimeoutMs: per-call timeout for the Playwright MCP tools (0 = MCP client default)
 *   historyPath:    omnibox history JSON; default $DSH_HOME/mywork/browser-history.json
 *   searchEngine:   initial engine for non-URL omnibox text: bing | google | baidu | duckduckgo
 *                   (the user's later choice in 设置 → 浏览器 is kept in the history file)
 */
export const Config = configSchema({
  autoLaunch: true, headless: true, port: Number(process.env.MYWORK_BROWSER_PORT) || 9333,
  executablePath: '', userDataDir: '', width: 1280, height: 800, quality: 60, pixelRatio: 2, promptHint: true, proxy: '',
  linksPath: '', allowSystemBrowser: true, modelTools: true, toolCallTimeoutMs: 0, historyPath: '', searchEngine: 'bing',
  seedLinks: [
    { name: 'DeepSeek Harness 文档', url: 'https://deepseek-harness.github.io/deepseek-harness/' },
    { name: 'awesome-dsh-plugin', url: 'https://awesome-dsh-plugin.com/' },
    { name: 'GitHub', url: 'https://github.com/' },
  ],
}, (c) => (Array.isArray(c.seedLinks) ? null : 'seedLinks must be an array of { name, url }'))

export function apply(ctx, config = {}) {
  const log = (m) => console.log('[dsh-mywork-browser] ' + m)
  const warn = (m) => console.warn('[dsh-mywork-browser] ' + m)
  const port = Number(config.port) || 9333
  let handle = null
  let launchError = null
  const hub = new ViewerHub(port, { width: config.width, height: config.height, quality: config.quality, log: warn })
  const watcher = new BrowserWatcher(port, { log: warn })
  const links = new LinkStore(config.linksPath || defaultLinksPath(), config.seedLinks)
  // Omnibox history: every page the background browser lands on (model or user), title updated as it arrives.
  const history = new HistoryStore(config.historyPath || defaultHistoryPath())
  history.load()
  if (SEARCH_ENGINES[config.searchEngine] && !existsSyncHistory(history.path)) history.engine = config.searchEngine
  watcher.subscribe((ev) => { if (ev && ev.type === 'changed' && ev.url) history.record(ev.url, ev.title) })

  const ensureBrowser = async () => {
    if (handle) return handle
    if (config.autoLaunch === false) {
      const v = await probe(port)
      if (!v) throw new Error(`autoLaunch is off and nothing listens on 127.0.0.1:${port}`)
      handle = { child: null, port, version: v, adopted: true }
      return handle
    }
    handle = await launchChrome({ port, headless: history.headed ? false : config.headless !== false, executablePath: config.executablePath || undefined, userDataDir: config.userDataDir || undefined, pixelRatio: config.pixelRatio === undefined ? 2 : config.pixelRatio, width: config.width || 1280, height: config.height || 800, proxy: config.proxy || undefined })
    log(`${handle.adopted ? 'attached to' : 'started'} browser on 127.0.0.1:${port}${handle.executable ? ' (' + handle.executable + ')' : ''}`)
    watcher.start().catch(() => {})
    return handle
  }

  // Launch eagerly so Playwright can attach when the first session starts.
  const ready = ensureBrowser().catch((e) => { launchError = e; warn('browser not available: ' + e.message); return null })

  // Model tools: one Playwright MCP server per live session, all attached to this Chrome.
  if (config.modelTools !== false) {
    mountSharedPlaywright(ctx, { port, toolCallTimeoutMs: Number(config.toolCallTimeoutMs) || 0, log, warn })
      .catch((e) => warn('Playwright MCP not mounted: ' + (e && e.message)))
  }

  ctx.effect(() => () => {
    watcher.stop()
    hub.close()
    if (handle && !handle.adopted) killChrome(handle)
    handle = null
  }, 'dsh-mywork-browser: browser process')

  /**
   * Show a page in the live browser: reuse a blank tab, otherwise open a new one,
   * and bring it to front. The target watcher reports the navigation to every
   * connected web UI, which reveals the live tab for the current session.
   */
  const openInLiveBrowser = async (url) => {
    await ready
    if (!handle) throw new Error('browser not running' + (launchError ? ': ' + launchError.message : ''))
    const targets = await hub.targets()
    const blank = targets.find((x) => x.url === 'about:blank')
    if (blank) { await hub.navigate(blank.id, url); await hub.activate(blank.id); return { target: blank.id } }
    const created = await hub.newTab(url)
    if (created && created.id) await hub.activate(created.id)
    return { target: created && created.id }
  }
  /** A bookmark name wins over a bare word (`github` → the saved link, not https://github/). */
  const looksLikeUrl = (text) => /^[a-z][a-z0-9+.-]*:\/\//i.test(text) || /[./]/.test(text)
  const openUrl = async (rawUrl, target) => {
    const raw = String(rawUrl || '').trim()
    const byName = looksLikeUrl(raw) ? null : links.findByName(raw)
    const url = normalizeUrl(byName ? byName.url : raw)
    if (!url) throw new Error('only http(s) URLs (or a saved bookmark name) are allowed')
    if (target === 'system') {
      if (config.allowSystemBrowser === false) throw new Error('system browser is disabled by config')
      await openInSystemBrowser(url)
      return { url, target: 'system', opened: true }
    }
    const r = await openInLiveBrowser(url)
    return { url, target: 'live', opened: true, tab: r.target, note: 'Shown to the user in the DSH live browser tab.' }
  }

  ctx.tools.register(defineRawTool({
    name: 'open_url',
    description: '为用户打开一个网页给他看：默认在 DSH 右侧栏的「实时浏览器」（后台真实 Chrome）里打开并自动展示（target=live）；target=system 则用宿主机的系统默认浏览器打开。只接受 http(s) 链接，也可以传保存过的书签名称。你自己要读取或操作网页请用 mcp__playwright-mcp__* 工具。',
    parameters: {
      url: { type: 'string', required: true, description: '要打开的 http(s) 链接，或已保存的书签名称' },
      target: { type: 'string', description: 'live（默认）| system' },
    },
    async execute(args) { return openUrl(args.url, args.target === 'system' ? 'system' : 'live') },
  }))
  /** Import pasted login cookies into the background browser; never invents values, never returns them. */
  async function importCookies(text, domain) {
    const r = parseCookies(text, domain)
    if (r.error) throw new Error(r.error)
    if (r.cookies.length === 0) throw new Error('no cookies found in the pasted text')
    const res = await hub.setCookies(r.cookies)
    return { set: res.set, format: r.format, cookies: summarize(r.cookies) }
  }
  ctx.tools.register(defineRawTool({
    name: 'browser_set_cookies',
    description: '把用户提供的 Cookie（登录态）写进实时浏览器的后台 Chrome，用于免登录访问需要账号的网站（例如小红书的 web_session）。只能使用用户明确粘贴给你的 Cookie，绝不能自己编造或猜测；写入后重新打开页面即可生效。支持三种格式：name=value; name2=value2（需给 domain）、Cookie-Editor 导出的 JSON 数组、Netscape cookies.txt。',
    parameters: {
      cookies: { type: 'string', required: true, description: '用户粘贴的 Cookie 文本：name=value 列表 / JSON 数组 / cookies.txt' },
      domain: { type: 'string', description: '域名，例如 .xiaohongshu.com；name=value 格式必填，JSON 里没有 domain 时作为默认值' },
    },
    async execute(args) { return importCookies(String(args.cookies || ''), args.domain ? String(args.domain) : '') },
  }))
  ctx.tools.register(defineRawTool({
    name: 'quick_links',
    description: '列出用户在实时浏览器里保存的书签（名称 + URL）。',
    parameters: {},
    async execute() { return { items: links.list() } },
  }))
  ctx.inject(['commands'], (cctx) => {
    cctx.commands.register({
      name: 'open',
      description: '打开网页：/open <url|书签名> [system]（默认在右侧栏实时浏览器打开，加 system 用系统浏览器）',
      input: { hint: '<url 或 书签名> [system]' },
      handler: async ({ rawInput }) => {
        const parts = String(rawInput || '').trim().split(/\s+/).filter(Boolean)
        if (parts.length === 0) {
          const items = links.list()
          return { kind: 'success', text: '用法：/open <url|书签名> [system]\n书签：' + (items.length ? items.map((x) => `${x.name} → ${x.url}`).join('\n') : '（空）') }
        }
        const system = parts[parts.length - 1].toLowerCase() === 'system'
        const target = system ? parts.slice(0, -1).join(' ') : parts.join(' ')
        try {
          const r = await openUrl(target, system ? 'system' : 'live')
          return { kind: 'success', text: (system ? '已在系统浏览器打开：' : '已在实时浏览器打开：') + r.url }
        } catch (e) { return { kind: 'error', text: String(e.message || e) } }
      },
    })
  })

  if (config.promptHint !== false) {
    ctx.inject(['systemPrompt'], (sctx) => {
      try {
        sctx.systemPrompt.section({
          name: 'mywork-browser', order: 900, interpolate: false,
          text: [
            '## Real browser',
            'A real Chromium browser is available through the `mcp__playwright-mcp__*` tools (navigate, click, type, snapshot, screenshot). Whatever you navigate to is shown to the user automatically in the DSH right sidebar ("实时浏览器", a live view of that browser); the user may take over at any time.',
            'Sites that need an account: the user can paste their own cookies (e.g. `web_session` for xiaohongshu.com) and you write them into that browser with `browser_set_cookies` (domain required for name=value text); reload the page afterwards. Never guess or fabricate cookie values, and never read them back to the user.',
            'Use it whenever the user asks you to open, browse, read or operate a web page. Do not claim a page is open unless a navigate/snapshot tool call succeeded. `open_url` shows a page in that same live browser without you reading it; `quick_links` lists the user\'s saved bookmarks.',
          ].join('\n'),
        })
      } catch (e) { warn('system prompt hint skipped: ' + (e && e.message)) }
    })
  }

  ctx.inject(['webServer'], (wctx) => {
    const json = (res, body, status = 200) => {
      res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
      res.end(JSON.stringify(body))
    }
    const readBody = (req) => new Promise((resolve, reject) => {
      let data = ''; let size = 0
      req.on('data', (c) => { size += c.length; if (size > 256 * 1024) { reject(new Error('body too large')); req.destroy(); return } data += c })
      req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}) } catch (e) { reject(e) } })
      req.on('error', reject)
    })
    const route = (path, handler) => wctx.webServer.register({
      kind: 'exact', path: '/mywork-browser/api' + path,
      handler: (req, res) => rejectUntrusted(ctx, req, res, json) || Promise.resolve(handler(req, res)).catch((e) => { if (!res.headersSent) json(res, { error: e instanceof Error ? e.message : String(e) }, 500); else { try { res.end() } catch { /* ignore */ } } }),
    })
    const query = (req) => new URL(req.url || '/', 'http://dsh.local').searchParams

    route('/status', async (_req, res) => {
      await ready
      if (!handle) return json(res, { running: false, error: launchError ? launchError.message : 'not started', port })
      let targets = []
      try { targets = await hub.targets() } catch (e) {
        if (handle.adopted && !(await probe(port))) { handle = null; ensureBrowser().catch((err) => { launchError = err }) }
        return json(res, { running: false, error: 'DevTools unreachable: ' + e.message, port })
      }
      json(res, { running: true, port, headless: history.headed ? false : config.headless !== false, headed: !!history.headed, adopted: !!handle.adopted, executable: handle.executable || null, browser: handle.version && handle.version.Browser, targets, size: { width: config.width || 1280, height: config.height || 800 }, allowSystem: config.allowSystemBrowser !== false })
    })

    // Browser activity feed (page created / navigated / closed) for the whole
    // browser — the UI opens the live tab the moment the model navigates.
    route('/events', async (req, res) => {
      await ready
      if (!handle) return json(res, { error: 'browser not running' }, 503)
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no' })
      res.write(': connected\n\n')
      const send = (ev) => { try { res.write(`data: ${JSON.stringify(ev)}\n\n`) } catch { /* client gone */ } }
      const off = watcher.subscribe(send)
      const ping = setInterval(() => { try { res.write(': ping\n\n') } catch { /* ignore */ } }, 15000)
      const cleanup = () => { clearInterval(ping); off() }
      req.on('close', cleanup); res.on('close', cleanup)
    })

    // Live view: Server-Sent Events carrying JPEG frames for one page target.
    route('/stream', async (req, res) => {
      await ready
      if (!handle) return json(res, { error: 'browser not running' }, 503)
      const id = query(req).get('target')
      if (!id) return json(res, { error: 'target required' }, 400)
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no' })
      res.write(': connected\n\n')
      const send = (msg) => { try { res.write(`data: ${JSON.stringify(msg)}\n\n`) } catch { /* client gone */ } }
      let off = null
      try { off = await hub.subscribe(id, send) } catch (e) { send({ type: 'error', message: e.message }); res.end(); return }
      const ping = setInterval(() => { try { res.write(': ping\n\n') } catch { /* ignore */ } }, 15000)
      const cleanup = () => { clearInterval(ping); if (off) { off(); off = null } }
      req.on('close', cleanup); res.on('close', cleanup)
    })

    route('/navigate', async (req, res) => {
      const b = await readBody(req); const raw = String(b.url || '').trim()
      const url = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : 'https://' + raw
      if (!/^https?:\/\//i.test(url)) return json(res, { error: 'only http(s) URLs' }, 400)
      json(res, await hub.navigate(String(b.target), url))
    })
    // Omnibox: URL → navigate; bookmark name → its URL; anything else → the chosen search engine.
    route('/omni/go', async (req, res) => {
      const b = await readBody(req)
      const r = resolveOmni(String(b.text || ''), { engine: history.engine, bookmarks: links.list() })
      if (!r) return json(res, { error: 'empty' }, 400)
      if (b.target) await hub.navigate(String(b.target), r.url)
      else await openInLiveBrowser(r.url)
      json(res, r)
    })
    route('/history/search', async (req, res) => { const q = query(req); json(res, { items: history.search(q.get('q') || '', Math.min(20, Number(q.get('limit')) || 8)) }) })
    route('/history/clear', async (_req, res) => { history.clear(); json(res, { ok: true }) })
    route('/prefs', async (req, res) => {
      if (req.method === 'POST') { const b = await readBody(req); if (b.searchEngine) history.setEngine(String(b.searchEngine)); if (b.headed !== undefined) history.setHeaded(!!b.headed) }
      json(res, { searchEngine: history.engine, engines: Object.entries(SEARCH_ENGINES).map(([id, e]) => ({ id, name: e.name })), historyCount: history.size(), historyPath: history.path, headed: !!history.headed })
    })
    // Cookies (login state): loopback only, values never leave the host.
    const loopback = (req) => { const a = req.socket && req.socket.remoteAddress; return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1' }
    route('/cookies/list', async (req, res) => {
      if (!loopback(req)) return json(res, { error: 'cookies are limited to loopback requests' }, 403)
      // dsh's own session cookie lives in this browser too (the live view is served from it); keep loopback hosts out of the list so nobody clears themselves out
      try { json(res, { domains: groupByDomain(await hub.getCookies()).filter((g) => !/^(127\.0\.0\.1|localhost|\[?::1\]?)$/.test(g.domain)) }) } catch (e) { json(res, { error: e.message }, 500) }
    })
    route('/cookies/import', async (req, res) => {
      if (!loopback(req)) return json(res, { error: 'cookies are limited to loopback requests' }, 403)
      const b = await readBody(req)
      try { json(res, await importCookies(String(b.text || ''), String(b.domain || ''))) } catch (e) { json(res, { error: e.message }, 400) }
    })
    route('/cookies/clear', async (req, res) => {
      if (!loopback(req)) return json(res, { error: 'cookies are limited to loopback requests' }, 403)
      const b = await readBody(req)
      try { json(res, await hub.clearCookies(b.domain ? String(b.domain) : '')) } catch (e) { json(res, { error: e.message }, 500) }
    })
    route('/resize', async (req, res) => { const b = await readBody(req); json(res, await hub.resize(String(b.target), Number(b.width), Number(b.height), Number(b.scale) || 1, String(b.viewer || req.headers['x-forwarded-for'] || 'default').slice(0, 64))) })
    route('/reload', async (req, res) => { const b = await readBody(req); await hub.reload(String(b.target)); json(res, { ok: true }) })
    route('/back', async (req, res) => { const b = await readBody(req); json(res, await hub.history(String(b.target), -1)) })
    route('/forward', async (req, res) => { const b = await readBody(req); json(res, await hub.history(String(b.target), 1)) })
    route('/new-tab', async (req, res) => { const b = await readBody(req); json(res, await hub.newTab(b.url || 'about:blank')) })
    route('/close-tab', async (req, res) => { const b = await readBody(req); await hub.closeTab(String(b.target)); json(res, { ok: true }) })
    route('/activate', async (req, res) => { const b = await readBody(req); await hub.activate(String(b.target)); json(res, { ok: true }) })
    route('/input', async (req, res) => {
      const b = await readBody(req)
      const events = Array.isArray(b.events) ? b.events.slice(0, 200) : []
      await hub.input(String(b.target), events)
      json(res, { ok: true })
    })
    // Bookmarks (快捷链接) — used by the address-bar menu and the settings tab.
    route('/links/list', async (_req, res) => json(res, { items: links.list(), dataPath: links.path, allowSystem: config.allowSystemBrowser !== false }))
    route('/links/add', async (req, res) => {
      const b = await readBody(req); const url = normalizeUrl(b.url)
      if (!url) return json(res, { error: 'only http(s) URLs are allowed' }, 400)
      json(res, { item: links.add(b.name, url) })
    })
    route('/links/update', async (req, res) => {
      const b = await readBody(req); const patch = {}
      if (typeof b.name === 'string' && b.name.trim()) patch.name = b.name.trim()
      if (typeof b.url === 'string') { const url = normalizeUrl(b.url); if (!url) return json(res, { error: 'only http(s) URLs are allowed' }, 400); patch.url = url }
      const it = links.update(String(b.id || ''), patch)
      if (!it) return json(res, { error: 'not found' }, 404)
      json(res, { item: it })
    })
    route('/links/remove', async (req, res) => { const b = await readBody(req); json(res, { removed: links.remove(String(b.id || '')) }) })
    route('/links/move', async (req, res) => { const b = await readBody(req); json(res, { moved: links.move(String(b.id || ''), Number(b.dir) < 0 ? -1 : 1), items: links.list() }) })
    route('/open', async (req, res) => { const b = await readBody(req); json(res, await openUrl(String(b.url || ''), b.target === 'system' ? 'system' : 'live')) })
    route('/restart', async (_req, res) => {
      watcher.stop(); hub.close()
      if (handle && !handle.adopted) killChrome(handle)
      handle = null; launchError = null
      // wait until the old process has really released the port, otherwise ensureBrowser() adopts the dying instance
      for (let i = 0; i < 40 && await probe(port); i++) await new Promise((r) => setTimeout(r, 150))
      try { await ensureBrowser(); json(res, { ok: true }) } catch (e) { launchError = e; json(res, { ok: false, error: e.message }, 500) }
    })
  })
}
