/**
 * dsh-mywork-browser — bookmarks ("快捷链接") and URL helpers (host side, zero deps).
 *
 * File: $DSH_HOME/mywork/links.json. Writes are atomic (temp file + rename).
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'

export const dshHome = (env = process.env) => env.DSH_HOME || join(homedir(), '.dsh')
export const defaultLinksPath = (env = process.env) => join(dshHome(env), 'mywork', 'links.json')

/** Accept only http(s) URLs without embedded credentials; bare hosts get https://. */
export function normalizeUrl(input) {
  const raw = String(input || '').trim()
  if (!raw) return null
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : 'https://' + raw
  let u
  try { u = new URL(withScheme) } catch { return null }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
  if (u.username || u.password) return null
  return u.toString()
}

export class LinkStore {
  constructor(path = defaultLinksPath(), seed = []) { this.path = path; this.seed = seed; this.items = null }
  load() {
    if (this.items) return this.items
    if (!existsSync(this.path)) {
      this.items = (this.seed || []).map((l) => ({ id: randomBytes(4).toString('hex'), name: String(l.name || l.url), url: String(l.url) }))
      this.save()
      return this.items
    }
    try {
      const parsed = JSON.parse(readFileSync(this.path, 'utf8'))
      this.items = Array.isArray(parsed.items) ? parsed.items : []
    } catch { this.items = [] }
    return this.items
  }
  save() {
    mkdirSync(dirname(this.path), { recursive: true })
    const tmp = this.path + '.tmp-' + process.pid
    writeFileSync(tmp, JSON.stringify({ version: 1, items: this.items }, null, 2) + '\n')
    renameSync(tmp, this.path)
  }
  list() { return this.load().slice() }
  add(nameText, url) {
    const item = { id: randomBytes(4).toString('hex'), name: String(nameText || url).trim() || url, url }
    this.load().push(item); this.save(); return item
  }
  update(id, patch) {
    const it = this.load().find((x) => x.id === id)
    if (!it) return null
    Object.assign(it, patch); this.save(); return it
  }
  remove(id) {
    const before = this.load().length
    this.items = this.items.filter((x) => x.id !== id)
    if (this.items.length === before) return false
    this.save(); return true
  }
  move(id, dir) {
    const items = this.load(); const i = items.findIndex((x) => x.id === id)
    const j = i + dir
    if (i === -1 || j < 0 || j >= items.length) return false
    ;[items[i], items[j]] = [items[j], items[i]]; this.save(); return true
  }
  findByName(text) {
    const q = String(text || '').trim().toLowerCase()
    if (!q) return null
    return this.load().find((x) => x.name.toLowerCase() === q) || this.load().find((x) => x.name.toLowerCase().includes(q)) || null
  }
}

/** Open a URL with the host machine's default browser (macOS / Windows / Linux). */
export function openInSystemBrowser(url) {
  const platform = process.platform
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open'
  const args = platform === 'win32' ? ['/c', 'start', '', url] : [url]
  return new Promise((resolve, reject) => {
    try {
      const child = spawn(cmd, args, { stdio: 'ignore', detached: true })
      child.on('error', reject)
      child.unref()
      resolve(true)
    } catch (e) { reject(e) }
  })
}
