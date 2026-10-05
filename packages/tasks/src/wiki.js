/**
 * dsh-mywork-tasks — the 知识库 teammate's wiki, read by code (Karpathy, "LLM Wiki": raw sources → a wiki the model
 * writes → a schema file). Three folders inside the teammate's folder:
 *
 *   原始资料/   what you hand over (PDF, clipped pages, notes); the model reads, never edits
 *   wiki/       pages the model writes: index.md, log.md, 来源/, 概念/, 人和机构/, 综述与对比/ …
 *   AGENTS.md   the schema: how the wiki is built and kept (you and the model change it together)
 *
 * Code does the bookkeeping checks the model should not have to guess at: which page links where ([[页面]] or
 * [[页面|显示的字]]), what links back, pages nothing links to (孤立), links to pages that do not exist (断链), pages the
 * index does not list (没进索引), the log's latest entries (`## [YYYY-MM-DD] 动作 | 标题`), plain search.
 *
 *   scanWiki(dir) → { pages: Page[], byKey, sources: n, orphans, broken, unindexed, log }
 *   Page = { path, name, title, category, links: [{ target, path }], inbound: [path], mtime, size, words }
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'

export const WIKI_DIR = 'wiki'
export const SOURCES_DIR = '原始资料'
const SPECIAL = new Set(['index.md', 'log.md'])
const MAX_PAGES = 3000

/** [[目标]] / [[目标|显示]] / [[目标#小节]] → the target part. */
export function wikiLinks(text) {
  const out = []
  for (const m of String(text || '').matchAll(/\[\[([^\]\n|#]+)(?:#[^\]\n|]*)?(?:\|[^\]\n]*)?\]\]/g)) out.push(m[1].trim())
  return out
}
/** Markdown links to local .md files too ([文字](概念/注意力.md)). */
function mdLinks(text) {
  const out = []
  for (const m of String(text || '').matchAll(/\]\(([^)\s]+\.md)(?:#[^)]*)?\)/g)) if (!/^[a-z]+:/i.test(m[1])) out.push(decodeURIComponent(m[1]))
  return out
}
/** A target written to show the format (「[[页名]]」「[[来源/…]]」), not a link. */
const placeholder = (s) => /…|\.\.\.|^页名$|^页面名?$|^页名\|/.test(String(s || '').trim())
const keyOf = (s) => String(s || '').trim().toLowerCase().replace(/\.md$/i, '').replace(/\\/g, '/').replace(/^\.?\//, '')

function walk(root, rel, out, depth) {
  if (out.length >= MAX_PAGES || depth > 6) return
  let names = []
  try { names = readdirSync(join(root, rel)) } catch { return }
  for (const n of names) {
    if (n.startsWith('.')) continue
    const p = rel ? rel + '/' + n : n
    let st
    try { st = statSync(join(root, p)) } catch { continue }
    if (st.isDirectory()) walk(root, p, out, depth + 1)
    else if (/\.md$/i.test(n)) out.push({ rel: p, st })
  }
}
function countFiles(root) {
  let n = 0
  const go = (rel, depth) => {
    let names = []
    try { names = readdirSync(join(root, rel)) } catch { return }
    for (const x of names) {
      if (x.startsWith('.')) continue
      const p = rel ? join(rel, x) : x
      try { if (statSync(join(root, p)).isDirectory()) { if (depth < 6) go(p, depth + 1) } else n += 1 } catch {}
    }
  }
  go('', 0)
  return n
}

/** The log's entries, newest first: { date, op, title }. */
export function logEntries(text, limit = 20) {
  const out = []
  for (const m of String(text || '').matchAll(/^##\s*\[(\d{4}-\d{2}-\d{2})\]\s*([^|\n]+?)\s*\|\s*(.+)$/gm)) out.push({ date: m[1], op: m[2].trim(), title: m[3].trim() })
  return out.reverse().slice(0, limit)
}

/** The file outside wiki/ a link names (AGENTS.md, 原始资料/x.md), relative to the teammate's folder, or ''. */
export function outside(dir, target) {
  const t = String(target || '').trim().replace(/^\.?\//, '')
  if (!t || t.includes('..')) return ''
  for (const c of [t, t + '.md']) { try { if (existsSync(join(dir, c)) && statSync(join(dir, c)).isFile()) return c } catch {} }
  return ''
}

/** The whole wiki by code. `dir` is the teammate's folder. */
export function scanWiki(dir) {
  const root = join(dir, WIKI_DIR)
  const files = []
  walk(root, '', files, 0)
  const pages = files.map(({ rel, st }) => {
    let text = ''
    try { text = readFileSync(join(root, rel), 'utf8') } catch {}
    const h1 = text.match(/^#\s+(.+)$/m)
    const name = basename(rel).replace(/\.md$/i, '')
    const category = rel.includes('/') ? rel.split('/')[0] : ''
    return { path: WIKI_DIR + '/' + rel, rel, name, title: h1 ? h1[1].trim() : name, category, raw: [...wikiLinks(text), ...mdLinks(text)], text, mtime: st.mtime.toISOString(), size: st.size, words: text.replace(/\s+/g, '').length, inbound: [], links: [] }
  })
  // A link resolves by relative path (概念/注意力), else by page name, else by title.
  const byKey = new Map()
  for (const p of pages) { byKey.set(keyOf(p.rel), p); if (!byKey.has(keyOf(p.name))) byKey.set(keyOf(p.name), p) }
  for (const p of pages) if (!byKey.has(keyOf(p.title))) byKey.set(keyOf(p.title), p)
  const resolveLink = (from, target) => {
    const t = keyOf(target)
    if (byKey.has(t)) return byKey.get(t)
    const fromDir = from.rel.includes('/') ? from.rel.slice(0, from.rel.lastIndexOf('/')) : ''
    const local = keyOf((fromDir ? fromDir + '/' : '') + target)
    return byKey.get(local) || byKey.get(keyOf(t.split('/').pop())) || null
  }
  const broken = []
  for (const p of pages) {
    const seen = new Set()
    for (const target of p.raw) {
      if (placeholder(target)) continue
      const hit = resolveLink(p, target)
      // A link to a file outside the wiki (AGENTS.md, 原始资料/…) is fine, just not a page.
      if (!hit) { if (!outside(dir, target)) broken.push({ from: p.path, target }); continue }
      if (hit === p || seen.has(hit.path)) continue
      seen.add(hit.path)
      p.links.push({ target, path: hit.path })
      hit.inbound.push(p.path)
    }
  }
  const index = pages.find((p) => p.rel === 'index.md')
  const indexed = new Set(index ? index.links.map((l) => l.path) : [])
  const content = pages.filter((p) => !SPECIAL.has(p.rel))
  const orphans = content.filter((p) => !p.inbound.some((x) => x !== WIKI_DIR + '/index.md')).map((p) => p.path)
  const unindexed = index ? content.filter((p) => !indexed.has(p.path)).map((p) => p.path) : []
  let logText = ''
  try { logText = readFileSync(join(root, 'log.md'), 'utf8') } catch {}
  for (const p of pages) { delete p.raw; delete p.text }
  return { pages, byKey, sources: countFiles(join(dir, SOURCES_DIR)), orphans, broken, unindexed, log: logEntries(logText) }
}

/** A link target (from a page, or typed) → that page's path, or ''. */
export function resolvePage(scan, target, fromPath) {
  const t = keyOf(target)
  if (scan.byKey.has(t)) return scan.byKey.get(t).path
  if (fromPath) {
    const rel = fromPath.replace(/^wiki\//, '')
    const dir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : ''
    const hit = scan.byKey.get(keyOf((dir ? dir + '/' : '') + target))
    if (hit) return hit.path
  }
  const last = scan.byKey.get(keyOf(t.split('/').pop()))
  return last ? last.path : ''
}

/** Plain search over titles and bodies: hits ranked title first, each with a snippet around the first match. */
export function searchWiki(dir, q, limit = 20) {
  const needle = String(q || '').trim().toLowerCase()
  if (!needle) return []
  const root = join(dir, WIKI_DIR)
  const files = []
  walk(root, '', files, 0)
  const out = []
  for (const { rel } of files) {
    if (SPECIAL.has(rel)) continue // the index and the log are how you get around, not answers
    let text = ''
    try { text = readFileSync(join(root, rel), 'utf8') } catch { continue }
    const h1 = text.match(/^#\s+(.+)$/m)
    const title = h1 ? h1[1].trim() : basename(rel).replace(/\.md$/i, '')
    const i = text.toLowerCase().indexOf(needle)
    const inTitle = title.toLowerCase().includes(needle)
    if (i < 0 && !inTitle) continue
    const snippet = i < 0 ? '' : text.slice(Math.max(0, i - 40), i + needle.length + 60).replace(/\s+/g, ' ').trim()
    out.push({ path: WIKI_DIR + '/' + rel, title, snippet, rank: inTitle ? 0 : 1 })
  }
  return out.sort((a, b) => a.rank - b.rank).slice(0, limit).map(({ rank: _r, ...x }) => x)
}

/** What code found, for the 体检 prompt (the model does contradictions, stale claims and gaps; these it need not guess). */
export function lintFindings(scan) {
  const lines = [`知识库现在 ${scan.pages.length} 页，来自 ${scan.sources} 份原始资料。`]
  const list = (label, items) => { if (items.length) lines.push(`${label}（${items.length}）：` + items.slice(0, 30).join('、') + (items.length > 30 ? ' …' : '')) }
  list('孤立页（除了索引没有别的页链到它）', scan.orphans)
  list('断链（链到不存在的页）', scan.broken.map((b) => `${b.from} → [[${b.target}]]`))
  list('没进 index.md 的页', scan.unindexed)
  if (lines.length === 1) lines.push('链接和索引程序没查出问题。')
  return lines.join('\n')
}
