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
 *   scanWiki(dir) → { pages: Page[], byKey, sources: n, orphans, broken, unindexed, log, revisit, actions }
 *   Page = { path, name, title, category, links: [{ target, path }], inbound: [path], mtime, size, words }
 *
 * Dates are facts too (an organisation's wiki, Karpathy's "Business/team" use): a page that says 「重审：YYYY-MM-DD」
 * (a decision to look at again) and the open action items 「- [ ] 事（@人，截止 YYYY-MM-DD）」 anywhere in the wiki.
 *
 * And from Garry Tan's GBrain, whose pages are a compiled truth on top (rewritten) and a timeline below
 * 「<!-- timeline -->」 (appended only): a page whose top says 「更新：YYYY-MM-DD」 older than its newest timeline entry
 * is stale; two pages sharing a name in 「别名：…」 are probably one; an open loop 「- [ ] 等 @人 …（自 YYYY-MM-DD）」
 * waiting more than a week is listed.
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

const DATE = '(\\d{4})[-/.年](\\d{1,2})[-/.月](\\d{1,2})日?'
const ymd = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
/** 「重审：2026-12-01」 (also 复查 / 复盘 / revisit) in a page → the date, or ''. */
export function revisitOf(text) {
  const m = String(text || '').match(new RegExp('(?:重审|复查|复盘|revisit)\\s*[:：]\\s*' + DATE, 'i'))
  return m ? ymd(m[1], m[2], m[3]) : ''
}
/** The action items of a page: 「- [ ] 事（@人，截止 2026-10-10）」; done ones are 「- [x]」 and skipped. */
export function actionsOf(text) {
  const out = []
  for (const line of String(text || '').split('\n')) {
    const m = line.match(/^\s*[-*]\s+\[( |x|X)\]\s+(.+)$/)
    if (!m || m[1] !== ' ') continue
    const due = m[2].match(new RegExp('(?:截止|due|到期)\\s*[:：]?\\s*' + DATE, 'i'))
    const who = m[2].match(/@([^\s，,）)]+)/)
    out.push({ text: m[2].trim(), due: due ? ymd(due[1], due[2], due[3]) : '', who: who ? who[1] : '' })
  }
  return out
}
/** The top (compiled truth) and the timeline of a page: split at 「<!-- timeline -->」 or a 「## 时间线 / ## Timeline」 heading. */
export function splitPage(text) {
  const t = String(text || '')
  const m = t.match(/^<!--\s*timeline\s*-->\s*$/im) || t.match(/^#{2,3}\s*(?:时间线|Timeline)\s*$/im)
  return m ? { top: t.slice(0, m.index), timeline: t.slice(m.index + m[0].length) } : { top: t, timeline: '' }
}
/** 「更新：2026-10-06」 in the top, the newest 「- 2026-10-06 …」 in the timeline. */
function datesOfPage(text) {
  const { top, timeline } = splitPage(text)
  const u = top.match(new RegExp('(?:更新|updated)\\s*[:：]\\s*' + DATE, 'i'))
  let last = ''
  for (const m of timeline.matchAll(new RegExp('^\\s*[-*]\\s*\\**' + DATE, 'gm'))) { const d = ymd(m[1], m[2], m[3]); if (d > last) last = d }
  return { updated: u ? ymd(u[1], u[2], u[3]) : '', lastEvent: last }
}
/** 「别名：张三, Zhang San, zs@example.com」 → lower-cased names. */
function aliasesOf(text) {
  const m = splitPage(text).top.match(/^\s*[-*]?\s*(?:别名|aliases)\s*[:：]\s*(.+)$/im)
  return m ? m[1].split(/[,，、;；/]+/).map((x) => x.trim().toLowerCase()).filter((x) => x.length > 1) : []
}
/** An open loop: an unchecked item that starts with 「等」 (waiting on someone) and says since when. */
function waitingOf(actions) {
  return actions.filter((a) => /^等/.test(a.text)).map((a) => {
    const m = a.text.match(new RegExp('(?:自|since)\\s*' + DATE, 'i'))
    return m ? { ...a, since: ymd(m[1], m[2], m[3]) } : null
  }).filter(Boolean)
}
const today = () => { const d = new Date(); return ymd(d.getFullYear(), d.getMonth() + 1, d.getDate()) }
const plusDays = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return ymd(d.getFullYear(), d.getMonth() + 1, d.getDate()) }

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
    return { path: WIKI_DIR + '/' + rel, rel, name, title: h1 ? h1[1].trim() : name, category, raw: [...wikiLinks(text), ...mdLinks(text)], text, mtime: st.mtime.toISOString(), size: st.size, words: text.replace(/\s+/g, '').length, inbound: [], links: [], revisit: revisitOf(text), actions: actionsOf(text), dates: datesOfPage(text), aliases: aliasesOf(text) }
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
  // Decisions due for another look, and open action items that are late or due within three days (by today's date).
  const now = today()
  const soon = plusDays(now, 3)
  const revisit = pages.filter((p) => p.revisit && p.revisit <= now).map((p) => ({ path: p.path, title: p.title, date: p.revisit }))
  // The same item written on a person's page and a project's page is one item, kept with every page it is on.
  const byItem = new Map()
  for (const p of pages) for (const a of p.actions) {
    if (!a.due || a.due > soon) continue
    const k = a.text.replace(/\s+/g, '') + '|' + a.due
    if (byItem.has(k)) byItem.get(k).paths.push(p.path)
    else byItem.set(k, { ...a, path: p.path, paths: [p.path], late: a.due < now })
  }
  const actions = [...byItem.values()].sort((a, b) => a.due.localeCompare(b.due))
  // GBrain: a top older than the timeline under it, one entity on two pages, loops left waiting.
  const stale = pages.filter((p) => p.dates.updated && p.dates.lastEvent > p.dates.updated).map((p) => ({ path: p.path, title: p.title, updated: p.dates.updated, lastEvent: p.dates.lastEvent }))
  const owner = new Map()
  const dupes = []
  for (const p of pages) {
    for (const a of new Set([...p.aliases, p.title.toLowerCase()])) {
      const other = owner.get(a)
      if (other && other !== p.path && !dupes.some((d) => d.paths.includes(other) && d.paths.includes(p.path))) dupes.push({ name: a, paths: [other, p.path] })
      else if (!other) owner.set(a, p.path)
    }
  }
  const weekAgo = plusDays(now, -7)
  const waiting = []
  for (const p of pages) for (const w of waitingOf(p.actions)) if (w.since <= weekAgo) waiting.push({ ...w, path: p.path })
  waiting.sort((a, b) => a.since.localeCompare(b.since))
  for (const p of pages) { delete p.raw; delete p.text; delete p.actions; delete p.dates; delete p.aliases }
  return { pages, byKey, sources: countFiles(join(dir, SOURCES_DIR)), orphans, broken, unindexed, log: logEntries(logText), revisit, actions, stale, dupes, waiting }
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
  const lines = [`库里现在 ${scan.pages.length} 页，来自 ${scan.sources} 份原始资料。`]
  const list = (label, items) => { if (items.length) lines.push(`${label}（${items.length}）：` + items.slice(0, 30).join('、') + (items.length > 30 ? ' …' : '')) }
  list('孤立页（除了索引没有别的页链到它）', scan.orphans)
  list('断链（链到不存在的页）', scan.broken.map((b) => `${b.from} → [[${b.target}]]`))
  list('没进 index.md 的页', scan.unindexed)
  list('到了重审日期的页', (scan.revisit || []).map((r) => `${r.path}（重审 ${r.date}）`))
  const where = (a) => (a.paths || [a.path]).join('、')
  list('过期的行动项', (scan.actions || []).filter((a) => a.late).map((a) => `${a.text}（${where(a)}）`))
  list('三天内到期的行动项', (scan.actions || []).filter((a) => !a.late).map((a) => `${a.text}（${where(a)}）`))
  list('顶部结论比时间线旧、该重写的页', (scan.stale || []).map((x) => `${x.path}（更新 ${x.updated}，时间线到 ${x.lastEvent}）`))
  list('可能是同一个人或同一件事的页', (scan.dupes || []).map((d) => `${d.paths.join(' 和 ')}（都叫「${d.name}」）`))
  list('等了一周以上的事', (scan.waiting || []).map((w) => `${w.text}（${w.path}）`))
  if (lines.length === 1) lines.push('链接、索引和日期程序没查出问题。')
  return lines.join('\n')
}
