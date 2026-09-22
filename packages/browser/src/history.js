/**
 * dsh-mywork-browser — Chrome-like omnibox support (host side, zero deps).
 *
 *   • looksLikeUrl / resolveOmni: what typed text means (URL, bookmark name, or a web search)
 *   • HistoryStore: visited pages ($DSH_HOME/mywork/browser-history.json) with a ranked
 *     prefix / substring search for address-bar suggestions and inline completion,
 *     plus the user's search-engine preference. Writes are debounced and atomic.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { dshHome, normalizeUrl } from './links.js'

export const defaultHistoryPath = (env = process.env) => join(dshHome(env), 'mywork', 'browser-history.json')

export const SEARCH_ENGINES = {
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=%s' },
  google: { name: 'Google', url: 'https://www.google.com/search?q=%s' },
  baidu: { name: '百度', url: 'https://www.baidu.com/s?wd=%s' },
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s' },
}
export const DEFAULT_ENGINE = 'bing'

/**
 * Chrome's rule of thumb: a scheme, a host with a dot (or localhost / an IPv4 / a port),
 * and no spaces → address; anything else → search.
 */
export function looksLikeUrl(text) {
  const s = String(text || '').trim()
  if (!s || /\s/.test(s)) return false
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) return true
  const hostPart = s.split(/[/?#]/)[0]
  if (/^localhost(:\d+)?$/i.test(hostPart)) return true
  if (/^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(hostPart)) return true
  return /^[\w-]+(\.[\w-]+)+(:\d+)?$/.test(hostPart)
}

export function searchUrl(query, engine = DEFAULT_ENGINE) {
  const e = SEARCH_ENGINES[engine] || SEARCH_ENGINES[DEFAULT_ENGINE]
  return e.url.replace('%s', encodeURIComponent(String(query || '').trim()))
}

/**
 * Resolve omnibox text: { kind: 'url' | 'bookmark' | 'search', url, query? }.
 * Bookmark names win over bare words (`github` → the saved link); URLs win over bookmarks.
 */
export function resolveOmni(text, { engine = DEFAULT_ENGINE, bookmarks = [] } = {}) {
  const raw = String(text || '').trim()
  if (!raw) return null
  if (looksLikeUrl(raw)) {
    const url = normalizeUrl(raw)
    if (url) return { kind: 'url', url }
  }
  const lower = raw.toLowerCase()
  const bm = bookmarks.find((b) => String(b.name || '').trim().toLowerCase() === lower)
  if (bm && normalizeUrl(bm.url)) return { kind: 'bookmark', url: normalizeUrl(bm.url), name: bm.name }
  return { kind: 'search', url: searchUrl(raw, engine), query: raw, engine: SEARCH_ENGINES[engine] ? engine : DEFAULT_ENGINE }
}

/** "https://www.github.com/foo/" → "github.com/foo" (what Chrome shows and what completion matches against). */
export function prettyUrl(url) {
  const s = String(url || '')
  return s.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '')
}

const ignorable = (url) => !url || url === 'about:blank' || !/^https?:\/\//i.test(url) || /^https?:\/\/127\.0\.0\.1:\d+\/\?token=/.test(url)

export class HistoryStore {
  constructor(path = defaultHistoryPath(), { max = 3000, saveDelayMs = 800 } = {}) {
    this.path = path; this.max = max; this.saveDelayMs = saveDelayMs
    this.items = null // Map url → { url, title, count, last }
    this.engine = DEFAULT_ENGINE
    this.timer = null
  }
  load() {
    if (this.items) return this.items
    this.items = new Map()
    try {
      const doc = JSON.parse(readFileSync(this.path, 'utf8'))
      if (doc && SEARCH_ENGINES[doc.engine]) this.engine = doc.engine
      for (const it of Array.isArray(doc && doc.items) ? doc.items : []) if (it && typeof it.url === 'string' && !ignorable(it.url)) this.items.set(it.url, { url: it.url, title: String(it.title || ''), count: Number(it.count) || 1, last: Number(it.last) || 0 })
    } catch { /* first run or unreadable */ }
    return this.items
  }
  save() {
    this.load()
    const items = [...this.items.values()].sort((a, b) => b.last - a.last).slice(0, this.max)
    mkdirSync(dirname(this.path), { recursive: true })
    const tmp = this.path + '.tmp-' + process.pid
    writeFileSync(tmp, JSON.stringify({ engine: this.engine, items }, null, 2) + '\n')
    renameSync(tmp, this.path)
  }
  scheduleSave() { if (this.timer) return; this.timer = setTimeout(() => { this.timer = null; try { this.save() } catch { /* ignore */ } }, this.saveDelayMs); if (this.timer.unref) this.timer.unref() }
  /** Called on every target change; the same URL reported again (title arriving later) updates the title only. */
  record(url, title, now = Date.now()) {
    if (ignorable(url)) return false
    const items = this.load()
    const cur = items.get(url)
    if (cur) {
      if (title && title !== url) cur.title = String(title)
      if (now - cur.last > 5000) { cur.count += 1; cur.last = now } // a burst of events for one navigation counts once
    } else {
      if (items.size >= this.max) { let oldest = null; for (const v of items.values()) if (!oldest || v.last < oldest.last) oldest = v; if (oldest) items.delete(oldest.url) }
      items.set(url, { url, title: title && title !== url ? String(title) : '', count: 1, last: now })
    }
    this.scheduleSave()
    return true
  }
  setEngine(engine) { if (!SEARCH_ENGINES[engine]) throw new Error('unknown search engine: ' + engine); this.load(); this.engine = engine; this.scheduleSave() }
  clear() { this.load(); this.items.clear(); this.scheduleSave() }
  size() { return this.load().size }
  /**
   * Ranked suggestions for typed text. `prefix` marks entries whose pretty URL starts with the
   * text (inline-completable); title / URL substring matches follow. Frequency and recency break ties.
   */
  search(query, limit = 8, now = Date.now()) {
    const q = prettyUrl(String(query || '').trim()).toLowerCase()
    if (!q) return []
    const out = []
    for (const it of this.load().values()) {
      const pu = prettyUrl(it.url).toLowerCase()
      const prefix = pu.startsWith(q)
      const hit = prefix || pu.includes(q) || it.title.toLowerCase().includes(q)
      if (!hit) continue
      const ageDays = Math.max(0, (now - it.last) / 86400000)
      const score = (prefix ? 1000 : 0) + Math.min(it.count, 50) * 10 + Math.max(0, 30 - ageDays)
      out.push({ url: it.url, title: it.title, count: it.count, last: it.last, prefix, score })
    }
    return out.sort((a, b) => b.score - a.score).slice(0, limit).map(({ score, ...rest }) => rest)
  }
}
