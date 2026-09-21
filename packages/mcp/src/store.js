/**
 * dsh-mywork-mcp — server records (host side, zero dependencies).
 *
 * File: $DSH_HOME/mywork/mcp.json (mode 0600; env values / headers may hold secrets).
 * Records are normalized here; the loader entry config is derived from them.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, chmodSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export const dshHome = (env = process.env) => env.DSH_HOME || join(homedir(), '.dsh')
export const defaultDataPath = (env = process.env) => join(dshHome(env), 'mywork', 'mcp.json')
export const NAME_RE = /^[A-Za-z0-9_-]{1,32}$/

const str = (v) => (typeof v === 'string' ? v.trim() : '')
const strMap = (v) => {
  const out = {}
  if (v && typeof v === 'object' && !Array.isArray(v)) for (const [k, val] of Object.entries(v)) if (str(k)) out[str(k)] = typeof val === 'string' ? val : String(val ?? '')
  return out
}
const strList = (v) => (Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : String(x ?? ''))).filter((x) => x !== '') : typeof v === 'string' ? splitArgs(v) : [])

/** Split a command line the way a shell would for simple cases (quotes, no expansion). */
export function splitArgs(text) {
  const out = []; let cur = ''; let q = null; let has = false
  for (const ch of String(text || '')) {
    if (q) { if (ch === q) q = null; else cur += ch; continue }
    if (ch === '"' || ch === "'") { q = ch; has = true; continue }
    if (/\s/.test(ch)) { if (cur || has) { out.push(cur); cur = ''; has = false } continue }
    cur += ch
  }
  if (cur || has) out.push(cur)
  return out
}

/** Validate + normalize one server record. Returns { ok, value } or { ok, error }. */
export function normalize(input) {
  const i = input || {}
  const name = str(i.name || i.serverName)
  if (!NAME_RE.test(name)) return { ok: false, error: 'name must match [A-Za-z0-9_-]{1,32}' }
  let transport = str(i.transport || i.type)
  if (transport === 'http' || transport === 'sse' || transport === 'streamable_http' || transport === 'streamableHttp') transport = 'streamable-http'
  if (!transport) transport = str(i.url) ? 'streamable-http' : 'stdio'
  if (transport !== 'stdio' && transport !== 'streamable-http') return { ok: false, error: 'transport must be stdio or streamable-http' }
  const value = { id: str(i.id) || name, name, transport, enabled: i.enabled !== false, note: str(i.note).slice(0, 200) }
  if (transport === 'stdio') {
    value.command = str(i.command)
    if (!value.command) return { ok: false, error: 'command is required for stdio' }
    value.args = strList(i.args)
    value.env = strMap(i.env)
    value.cwd = str(i.cwd)
  } else {
    value.url = str(i.url)
    if (!/^https?:\/\//i.test(value.url)) return { ok: false, error: 'url must be http(s) for streamable-http' }
    value.headers = strMap(i.headers)
  }
  return { ok: true, value }
}

/** Config object for an @deepseek-ai/dsh-mcp-client loader entry. */
export function entryConfig(r) {
  if (r.transport === 'stdio') {
    const c = { serverName: r.name, transport: 'stdio', command: r.command, args: r.args || [] }
    if (r.env && Object.keys(r.env).length) c.env = r.env
    if (r.cwd) c.cwd = r.cwd
    return c
  }
  const c = { serverName: r.name, transport: 'streamable-http', url: r.url }
  if (r.headers && Object.keys(r.headers).length) c.headers = r.headers
  return c
}

/**
 * Parse an `mcpServers` document (Claude Desktop / Cursor / VS Code style) or a plain
 * name → definition map into normalized records. Returns { items, errors }.
 */
export function parseImport(text) {
  let doc
  try { doc = JSON.parse(String(text || '')) } catch (e) { return { items: [], errors: ['invalid JSON: ' + e.message] } }
  const map = doc && typeof doc === 'object' ? (doc.mcpServers && typeof doc.mcpServers === 'object' ? doc.mcpServers : doc.servers && typeof doc.servers === 'object' ? doc.servers : doc) : null
  if (!map || typeof map !== 'object' || Array.isArray(map)) return { items: [], errors: ['expected { "mcpServers": { name: {...} } }'] }
  const items = []; const errors = []
  for (const [name, def] of Object.entries(map)) {
    if (!def || typeof def !== 'object') { errors.push(`${name}: not an object`); continue }
    const n = normalize({ ...def, name, enabled: def.disabled === true ? false : def.enabled })
    if (n.ok) items.push(n.value); else errors.push(`${name}: ${n.error}`)
  }
  return { items, errors }
}

export class McpStore {
  constructor(path = defaultDataPath()) { this.path = path; this.state = null }
  load() {
    if (this.state) return this.state
    if (!existsSync(this.path)) { this.state = { version: 1, servers: [] }; return this.state }
    try {
      const parsed = JSON.parse(readFileSync(this.path, 'utf8'))
      this.state = { version: 1, servers: Array.isArray(parsed.servers) ? parsed.servers : [] }
    } catch { this.state = { version: 1, servers: [] } }
    return this.state
  }
  save() {
    mkdirSync(dirname(this.path), { recursive: true, mode: 0o700 })
    const tmp = this.path + '.tmp-' + process.pid
    writeFileSync(tmp, JSON.stringify(this.state, null, 2) + '\n', { mode: 0o600 })
    renameSync(tmp, this.path)
    try { chmodSync(this.path, 0o600) } catch { /* ignore */ }
  }
  list() { return this.load().servers.slice() }
  get(id) { return this.load().servers.find((s) => s.id === id) || null }
  byName(name) { return this.load().servers.find((s) => s.name === name) || null }
  upsert(value) {
    const st = this.load()
    const idx = st.servers.findIndex((s) => s.id === value.id || s.name === value.name)
    if (idx === -1) st.servers.push(value); else st.servers[idx] = { ...st.servers[idx], ...value, id: st.servers[idx].id }
    this.save()
    return idx === -1 ? value : st.servers[idx]
  }
  remove(id) {
    const st = this.load(); const before = st.servers.length
    st.servers = st.servers.filter((s) => s.id !== id)
    if (st.servers.length === before) return false
    this.save(); return true
  }
}
