/**
 * dsh-mywork-mcp — host half.
 *
 *   • Server records live in $DSH_HOME/mywork/mcp.json (this plugin's own file).
 *   • Each enabled record becomes a loader entry `mywork-mcp-<name>` running the
 *     official `@deepseek-ai/dsh-mcp-client` (stdio or streamable-http). Entries are
 *     created / updated / removed live through `ctx.loader`, so changes apply without
 *     a restart; the loader persists them in the profile tree and this plugin
 *     reconciles both sides at boot.
 *   • HTTP API for the "MCP 连接器" page: /mywork-mcp/api/{list,status,save,remove,toggle,import}
 *   • Model tool `mcp_servers_list` (read-only).
 */
import { McpStore, defaultDataPath, entryConfig, normalize, parseImport } from './store.js'
import { configSchema, defineRawTool, rejectUntrusted } from './harness.js'

export const name = 'dsh-mywork-mcp'
export const inject = ['tools', 'loader']

const CLIENT = '@deepseek-ai/dsh-mcp-client'
const PREFIX = 'mywork-mcp-'

/** Config (all optional): dataPath (absolute path of mcp.json), tools (register mcp_servers_list) */
export const Config = configSchema({ dataPath: '', tools: true })

export function apply(ctx, config = {}) {
  const log = (m) => console.log('[dsh-mywork-mcp] ' + m)
  const warn = (m) => console.warn('[dsh-mywork-mcp] ' + m)
  const store = new McpStore(config.dataPath || defaultDataPath())
  const entryId = (r) => PREFIX + r.name

  const hasEntry = (id) => { try { return !!ctx.loader.resolve(id) } catch { return false } }
  const provision = async (r) => {
    const id = entryId(r)
    const cfg = entryConfig(r)
    if (hasEntry(id)) await ctx.loader.update(id, { config: cfg, disabled: r.enabled === false })
    else await ctx.loader.create({ id, name: CLIENT, config: cfg, disabled: r.enabled === false })
    return id
  }
  const unprovision = async (r) => { const id = entryId(r); if (hasEntry(id)) await ctx.loader.remove(id) }

  /** Boot: make the loader tree match mcp.json (persisted entries survive restarts; stale ones go). */
  const reconcile = async () => {
    const records = store.list()
    for (const r of records) { try { await provision(r) } catch (e) { warn(`provision ${r.name} failed: ${e.message}`) } }
    // drop entries with our prefix that no longer have a record
    let ids = []
    try { ids = collectEntryIds(ctx.loader) } catch { ids = [] }
    for (const id of ids) if (id.startsWith(PREFIX) && !records.some((r) => entryId(r) === id)) { try { await ctx.loader.remove(id) } catch { /* ignore */ } }
    log(`${records.length} MCP server(s) configured`)
  }
  reconcile().catch((e) => warn('reconcile failed: ' + e.message))

  const toolsOf = (r) => {
    try { return ctx.tools.schemas().filter((t) => t.name.startsWith(`mcp__${r.name}__`)).map((t) => t.name.slice(`mcp__${r.name}__`.length)) } catch { return [] }
  }
  const view = (r) => {
    const id = entryId(r)
    let entry = null
    try { entry = ctx.loader.resolve(id) } catch { entry = null }
    const tools = r.enabled === false ? [] : toolsOf(r)
    return { ...r, entryId: id, mounted: !!entry, tools, toolCount: tools.length, connected: tools.length > 0 }
  }

  if (config.tools !== false) {
    ctx.tools.register(defineRawTool({
      name: 'mcp_servers_list',
      description: '列出用户在「MCP 连接器」页面配置的 MCP 服务器（名称、传输方式、是否启用、已注册的工具数）。配置请让用户在页面里操作。',
      parameters: {},
      async execute() { return { items: store.list().map((r) => { const v = view(r); return { name: v.name, transport: v.transport, enabled: v.enabled, tools: v.tools } }) } },
    }))
  }

  ctx.inject(['webServer'], (wctx) => {
    const json = (res, body, status = 200) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)) }
    const readBody = (req) => new Promise((resolve, reject) => {
      let data = ''; let size = 0
      req.on('data', (c) => { size += c.length; if (size > 512 * 1024) { reject(new Error('body too large')); req.destroy(); return } data += c })
      req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}) } catch (e) { reject(e) } })
      req.on('error', reject)
    })
    const route = (path, handler) => wctx.webServer.register({
      kind: 'exact', path: '/mywork-mcp/api' + path,
      handler: (req, res) => rejectUntrusted(ctx, req, res, json) || Promise.resolve(handler(req, res)).catch((e) => json(res, { error: e instanceof Error ? e.message : String(e) }, 500)),
    })
    const post = (req, res) => { if (req.method !== 'POST') { json(res, { error: 'POST only' }, 405); return false } return true }

    route('/list', async (_req, res) => json(res, { items: store.list().map(view), dataPath: store.path }))
    route('/status', async (_req, res) => json(res, { items: store.list().map(view) }))
    route('/save', async (req, res) => {
      if (!post(req, res)) return
      const b = await readBody(req)
      const n = normalize(b)
      if (!n.ok) return json(res, { error: n.error }, 400)
      const existing = b.id ? store.get(String(b.id)) : null
      if (existing && existing.name !== n.value.name) await unprovision(existing) // renamed: old entry goes
      const dup = store.byName(n.value.name)
      if (dup && (!existing || dup.id !== existing.id)) return json(res, { error: `a server named "${n.value.name}" already exists` }, 409)
      const saved = store.upsert(existing ? { ...n.value, id: existing.id } : n.value)
      try { await provision(saved) } catch (e) { return json(res, { item: view(saved), warning: 'saved, but mounting failed: ' + e.message }) }
      json(res, { item: view(saved) })
    })
    route('/toggle', async (req, res) => {
      if (!post(req, res)) return
      const b = await readBody(req); const r = store.get(String(b.id || ''))
      if (!r) return json(res, { error: 'not found' }, 404)
      const saved = store.upsert({ ...r, enabled: b.enabled !== false })
      await provision(saved)
      json(res, { item: view(saved) })
    })
    route('/remove', async (req, res) => {
      if (!post(req, res)) return
      const b = await readBody(req); const r = store.get(String(b.id || ''))
      if (!r) return json(res, { removed: false })
      await unprovision(r)
      json(res, { removed: store.remove(r.id) })
    })
    route('/import', async (req, res) => {
      if (!post(req, res)) return
      const b = await readBody(req)
      const { items, errors } = parseImport(typeof b.text === 'string' ? b.text : JSON.stringify(b.document || {}))
      const saved = []
      for (const it of items) {
        const existing = store.byName(it.name)
        const rec = store.upsert(existing ? { ...it, id: existing.id } : it)
        try { await provision(rec) } catch (e) { errors.push(`${it.name}: ${e.message}`) }
        saved.push(view(rec))
      }
      json(res, { imported: saved, errors })
    })
  })
}

/** Ids of the entries in the loader's root tree (our entries are root-level). */
function collectEntryIds(loader) {
  if (loader && loader.store && typeof loader.store === 'object') return Object.keys(loader.store)
  const root = loader && loader.root
  return root && Array.isArray(root.data) ? root.data.map((o) => o && o.id).filter((id) => typeof id === 'string') : []
}
