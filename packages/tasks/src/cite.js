/**
 * dsh-mywork-tasks — 核引用 for the 论文 teammate, by code (design/v2/AI-WORKERS.md).
 *
 * ICLR 2026 desk-rejected papers that cited works which do not exist; its own checker had many false alarms, so people
 * confirmed every flag. ARIS's citation-audit checks each \cite on three axes — exists, metadata right, supports the
 * sentence — and learned (9/28) that a refused request is not a missing paper. So code does the first two against
 * arXiv and Crossref and keeps four outcomes apart:
 *
 *   ok        found, title / first author / year agree
 *   mismatch  found, but the title, first author or year differs (a year off by one is only noted: preprint vs venue)
 *   missing   the service answered and has no such work — 疑似, for a person to confirm (translated titles, books …)
 *   pending   the request failed (network, 429, 5xx, 403/406) — never counted as missing; run again later
 *   web       a web page or software (@misc / @online with a url and nothing to look up) — the model opens it
 *
 * The third axis (does the cited work say what the sentence says) is the model's: each citation keeps where it is cited
 * and the sentence, and a found work keeps its abstract.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

export const DRAFT_DIR = '稿子'
export const CHECK_DIR = '核引用'
const UA = 'MyWork/0.1 (citation check; https://github.com/William2333ZZ/mywork-deepseekharness)'
const ARXIV_ID = /(\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v\d+)?/

// ── BibTeX ──
/** @type{key, field = {…} | "…" | 123, …} entries; nested braces kept, outer ones dropped. */
export function parseBib(text) {
  const s = String(text || '')
  const out = []
  let i = 0
  while ((i = s.indexOf('@', i)) >= 0) {
    const m = s.slice(i).match(/^@([A-Za-z]+)\s*([{(])/)
    if (!m) { i += 1; continue }
    const type = m[1].toLowerCase()
    const close = m[2] === '{' ? '}' : ')'
    let j = i + m[0].length
    if (type === 'comment' || type === 'preamble' || type === 'string') { let d = 1; while (j < s.length && d) { if (s[j] === m[2]) d += 1; else if (s[j] === close) d -= 1; j += 1 } i = j; continue }
    const comma = s.indexOf(',', j)
    if (comma < 0) break
    const key = s.slice(j, comma).trim()
    j = comma + 1
    const fields = {}
    while (j < s.length) {
      while (j < s.length && /[\s,]/.test(s[j])) j += 1
      if (s[j] === close) { j += 1; break }
      const fm = s.slice(j).match(/^([A-Za-z_][\w-]*)\s*=\s*/)
      if (!fm) { j += 1; continue }
      j += fm[0].length
      let value = ''
      if (s[j] === '{') { let d = 0; const st = j; do { if (s[j] === '{') d += 1; else if (s[j] === '}') d -= 1; j += 1 } while (j < s.length && d > 0); value = s.slice(st + 1, j - 1) }
      else if (s[j] === '"') { const st = ++j; while (j < s.length && !(s[j] === '"' && s[j - 1] !== '\\')) j += 1; value = s.slice(st, j); j += 1 }
      else { const st = j; while (j < s.length && !/[,}\n)]/.test(s[j])) j += 1; value = s.slice(st, j).trim() }
      fields[fm[1].toLowerCase()] = value.replace(/\s+/g, ' ').trim()
    }
    if (key) out.push({ key, type, fields })
    i = j
  }
  return out
}

// ── where things are cited ──
const LATEX_CITE = /\\(?:no)?(?:cite|citep|citet|citealp|citealt|citeauthor|citeyear|parencite|textcite|autocite|footcite|fullcite)\*?(?:\[[^\]]*\]){0,2}\{([^}]+)\}/g
const MD_CITE = /\[([^\]\n]*@[^\]\n]*)\]/g
/** The sentence a citation sits in, LaTeX commands thinned, ≤240 chars. */
function sentenceAt(text, index) {
  const before = text.slice(0, index)
  const start = Math.max(before.lastIndexOf('\n\n'), ...['. ', '。', '! ', '? ', '！', '？'].map((p) => { const k = before.lastIndexOf(p); return k < 0 ? -1 : k + p.length - 1 })) + 1
  const rest = text.slice(index)
  const ends = ['. ', '.\n', '。', '! ', '? ', '！', '？', '\n\n'].map((p) => rest.indexOf(p)).filter((k) => k >= 0)
  const end = index + (ends.length ? Math.min(...ends) + 1 : Math.min(rest.length, 300))
  const raw = text.slice(start, end).replace(/%.*$/gm, '').replace(/\\(?:emph|textit|textbf|texttt)\{([^}]*)\}/g, '$1').replace(/\s+/g, ' ').trim()
  return raw.length > 240 ? raw.slice(0, 239) + '…' : raw
}
export function citesIn(text, file) {
  const s = String(text || '')
  const out = []
  const lineOf = (k) => s.slice(0, k).split('\n').length
  for (const m of s.matchAll(LATEX_CITE)) for (const key of m[1].split(',').map((x) => x.trim()).filter(Boolean)) out.push({ key, file, line: lineOf(m.index), sentence: sentenceAt(s, m.index) })
  if (/\.(md|markdown|qmd|rmd)$/i.test(file || '')) {
    for (const m of s.matchAll(MD_CITE)) for (const k of m[1].matchAll(/-?@([A-Za-z0-9_][\w:.#$%&+?<>~/-]*)/g)) out.push({ key: k[1].replace(/[.,;:]+$/, ''), file, line: lineOf(m.index), sentence: sentenceAt(s, m.index) })
  }
  return out
}

// ── comparing ──
const plain = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\\[a-zA-Z]+\s*/g, ' ').replace(/[{}\\$]/g, '').toLowerCase()
const words = (s) => plain(s).split(/[^a-z0-9\u4e00-\u9fff]+/).filter((w) => w.length > 1 || /[0-9]/.test(w))
export function titleOverlap(a, b) {
  const A = new Set(words(a))
  const B = new Set(words(b))
  if (!A.size || !B.size) return 0
  let n = 0
  for (const w of A) if (B.has(w)) n += 1
  return n / Math.max(A.size, B.size)
}
/** Same work by title: word overlap, or a short title whose words all sit in the long one (a .bib often drops the subtitle). */
export function titleMatch(a, b) {
  const o = titleOverlap(a, b)
  const A = new Set(words(a))
  const B = new Set(words(b))
  const [short, long] = A.size <= B.size ? [A, B] : [B, A]
  if (short.size < 4) return o
  let n = 0
  for (const w of short) if (long.has(w)) n += 1
  return n / short.size >= 0.95 ? Math.max(o, 0.9) : o
}
/** First author's family name: 「Vaswani, Ashish and …」 or 「Ashish Vaswani and …」. */
export function firstFamily(authors) {
  const first = String(authors || '').split(/\s+and\s+/i)[0].trim()
  if (!first || /^others$/i.test(first)) return ''
  const fam = first.includes(',') ? first.split(',')[0] : first.split(/\s+/).pop()
  return plain(fam).replace(/[^a-z\u4e00-\u9fff-]/g, '')
}
const yearOf = (s) => { const m = String(s || '').match(/\b(19|20)\d{2}\b/); return m ? Number(m[0]) : null }
/** The arXiv id an entry names (eprint, url, journal / note 「arXiv:…」, or an arXiv DOI). */
export function arxivIdOf(f) {
  const fromDoi = String(f.doi || '').match(/10\.48550\/arxiv\.(.+)$/i)
  if (fromDoi) return fromDoi[1]
  if (f.eprint && (!f.archiveprefix || /arxiv/i.test(f.archiveprefix))) { const m = String(f.eprint).match(ARXIV_ID); if (m) return m[1] }
  for (const k of ['url', 'journal', 'note', 'howpublished', 'booktitle', 'volume']) {
    const v = String(f[k] || '')
    const m = v.match(/arxiv\.org\/(?:abs|pdf)\/([^\s?#v]+(?:\.\d+)?)/i) || v.match(/arxiv[:\s]+(?:preprint\s+)?(?:arxiv:)?\s*(\d{4}\.\d{4,5})/i)
    if (m) { const id = m[1].match(ARXIV_ID); if (id) return id[1] }
  }
  return ''
}
function compare(entry, found) {
  const f = entry.fields
  const diffs = []
  const notes = []
  if (f.title && titleMatch(f.title, found.title) < 0.85) diffs.push('标题')
  else if (f.title && titleOverlap(f.title, found.title) < 0.85) notes.push('标题比正式的短或长（比如少了副标题）')
  const fam = firstFamily(f.author)
  const got = (found.authors || []).map((a) => plain(a).split(/\s+/).pop().replace(/[^a-z\u4e00-\u9fff-]/g, ''))
  if (fam && got.length && !got.slice(0, 1).includes(fam)) { if (got.includes(fam)) notes.push('第一作者顺序不同'); else diffs.push('作者') }
  const y = yearOf(f.year || f.date)
  if (y && found.year) { const d = Math.abs(y - found.year); if (d > 1) diffs.push('年份'); else if (d === 1) notes.push('年份差一年（常见于预印本和正式发表）') }
  return { diffs, notes }
}

// ── looking things up ──
class Pending extends Error {}
async function get(f, url, { accept, timeoutMs = 30000 } = {}) {
  const ac = typeof AbortController === 'function' ? new AbortController() : null
  const timer = ac ? setTimeout(() => ac.abort(), timeoutMs) : null
  let r
  try { r = await f(url, { headers: { 'user-agent': UA, ...(accept ? { accept } : {}) }, ...(ac ? { signal: ac.signal } : {}) }) } catch (e) { throw new Pending('网络：' + ((e && e.message) || e)) } finally { if (timer) clearTimeout(timer) }
  if (r.status === 404) return null
  if (!r.ok) throw new Pending(`${new URL(url).hostname} 返回 ${r.status}`)
  return r.text()
}
const xmlTag = (x, n) => { const m = String(x).match(new RegExp('<' + n + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + n + '>')); return m ? m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() : '' }
function arxivEntries(xml) {
  return [...String(xml || '').matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => {
    const x = m[1]
    const id = (xmlTag(x, 'id').match(/abs\/(.+?)(?:v\d+)?$/) || [])[1] || ''
    return { source: 'arXiv', id, title: xmlTag(x, 'title'), authors: [...x.matchAll(/<name>([\s\S]*?)<\/name>/g)].map((a) => a[1].trim()), year: yearOf(xmlTag(x, 'published')), url: 'https://arxiv.org/abs/' + id, abstract: xmlTag(x, 'summary').slice(0, 700) }
  }).filter((e) => e.id && e.title && !/^error$/i.test(e.title))
}
function crossrefWork(w) {
  if (!w) return null
  const parts = (w.issued && w.issued['date-parts'] && w.issued['date-parts'][0]) || (w.published && w.published['date-parts'] && w.published['date-parts'][0]) || []
  return { source: 'Crossref', id: w.DOI || '', title: (w.title || [])[0] || '', authors: (w.author || []).map((a) => [a.given, a.family].filter(Boolean).join(' ') || a.name || ''), year: parts[0] || null, url: w.DOI ? 'https://doi.org/' + w.DOI : '', venue: (w['container-title'] || [])[0] || '', abstract: String(w.abstract || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 700) }
}
const pause = (ms) => new Promise((r) => { const t = setTimeout(r, ms); if (t && t.unref) t.unref() })

/**
 * Check every bib entry. `cites` (from citesIn) attach where each is used; keys cited but not in any .bib come back as
 * `undefinedKeys`, entries never cited as `unused`. `fetch` is injectable; arXiv ids go in one batch.
 */
export async function checkEntries(entries, cites, { fetch: f = globalThis.fetch, gapMs = 3000 } = {}) {
  const byKey = new Map()
  for (const c of cites || []) { if (!byKey.has(c.key)) byKey.set(c.key, []); byKey.get(c.key).push({ file: c.file, line: c.line, sentence: c.sentence }) }
  const keys = new Set(entries.map((e) => e.key))
  const results = entries.map((e) => ({ key: e.key, type: e.type, title: (e.fields.title || '').replace(/[{}]/g, ''), author: e.fields.author || '', year: yearOf(e.fields.year || e.fields.date), doi: e.fields.doi || '', arxiv: arxivIdOf(e.fields), cited: byKey.get(e.key) || [], status: '', found: null, diffs: [], notes: [], why: '', _e: e }))
  // 1. arXiv ids in one request.
  const withId = results.filter((r) => r.arxiv)
  if (withId.length) {
    try {
      for (let i = 0; i < withId.length; i += 100) {
        const chunk = withId.slice(i, i + 100)
        const xml = await get(f, 'https://export.arxiv.org/api/query?max_results=' + chunk.length + '&id_list=' + chunk.map((r) => r.arxiv).join(','))
        const got = new Map(arxivEntries(xml).map((x) => [x.id.replace(/v\d+$/, ''), x]))
        for (const r of chunk) { const hit = got.get(r.arxiv); if (hit) r.found = hit; else { r.status = 'missing'; r.why = `arXiv 上没有 ${r.arxiv}` } }
        if (i + 100 < withId.length) await pause(gapMs)
      }
    } catch (e) { for (const r of withId) if (!r.found && !r.status) { r.status = 'pending'; r.why = e.message } }
  }
  // 2. DOIs, then titles, through Crossref (arXiv title search when Crossref has nothing close).
  let arxivCalls = 0
  for (const r of results) {
    if (r.found || r.status) continue
    const fl = r._e.fields
    try {
      if (r.doi && !/10\.48550/i.test(r.doi)) {
        const body = await get(f, 'https://api.crossref.org/works/' + encodeURIComponent(r.doi))
        if (body === null) { r.status = 'missing'; r.why = `DOI ${r.doi} 不存在`; continue }
        r.found = crossrefWork(JSON.parse(body).message)
        continue
      }
      if (!r.title) { if (fl.url && /^(misc|online|electronic|software|www)$/.test(r.type)) { r.status = 'web'; r.why = fl.url } else { r.status = 'nometa'; r.why = '条目没有标题，查不了' } continue }
      if (/^(misc|online|electronic|software|www)$/.test(r.type) && fl.url && !/doi\.org|arxiv\.org/i.test(fl.url)) { r.status = 'web'; r.why = fl.url; continue }
      const q = encodeURIComponent([r.title, firstFamily(r.author)].filter(Boolean).join(' '))
      const body = await get(f, `https://api.crossref.org/works?rows=5&select=DOI,title,author,issued,published,container-title,abstract&query.bibliographic=${q}`)
      const items = body ? ((JSON.parse(body).message || {}).items || []).map(crossrefWork) : []
      let best = items.map((x) => ({ x, s: titleMatch(r.title, x.title) })).sort((a, b) => b.s - a.s)[0]
      if (!best || best.s < 0.85) {
        if (arxivCalls++) await pause(gapMs)
        const xml = await get(f, 'https://export.arxiv.org/api/query?max_results=5&search_query=' + encodeURIComponent('ti:"' + r.title.replace(/["\\]/g, ' ').slice(0, 200) + '"'))
        const ax = arxivEntries(xml).map((x) => ({ x, s: titleMatch(r.title, x.title) })).sort((a, b) => b.s - a.s)[0]
        if (ax && (!best || ax.s > best.s)) best = ax
      }
      if (best && best.s >= 0.6) r.found = best.x
      else { r.status = 'missing'; r.why = 'Crossref 和 arXiv 都没有这个标题' }
    } catch (e) {
      r.status = 'pending'; r.why = e instanceof Pending ? e.message : String((e && e.message) || e)
    }
  }
  for (const r of results) {
    delete r._e
    if (!r.found) continue
    const { diffs, notes } = compare({ fields: { title: r.title, author: r.author, year: String(r.year || '') } }, r.found)
    r.diffs = diffs; r.notes = notes
    r.status = diffs.length ? 'mismatch' : 'ok'
  }
  const undefinedKeys = [...byKey.keys()].filter((k) => !keys.has(k)).map((k) => ({ key: k, cited: byKey.get(k) }))
  const unused = results.filter((r) => !r.cited.length).map((r) => r.key)
  const counts = { total: results.length }
  for (const s of ['ok', 'mismatch', 'missing', 'pending', 'web', 'nometa']) counts[s] = results.filter((r) => r.status === s).length
  counts.undefined = undefinedKeys.length
  return { entries: results, undefinedKeys, unused, counts }
}

/** The draft folder's .bib and citing files (.tex .md), and what is cited where. */
export function readDraft(dir) {
  const root = join(dir, DRAFT_DIR)
  const files = []
  const walk = (d, depth) => {
    let names = []
    try { names = readdirSync(d) } catch { return }
    for (const n of names) {
      if (n.startsWith('.')) continue
      const p = join(d, n)
      let st
      try { st = statSync(p) } catch { continue }
      if (st.isDirectory()) { if (depth < 4) walk(p, depth + 1) } else if (/\.(bib|tex|md|markdown|qmd)$/i.test(n) && st.size < 5 * 1024 * 1024) files.push(p)
    }
  }
  walk(root, 0)
  const entries = []
  const cites = []
  for (const p of files) {
    const rel = relative(dir, p).split('\\').join('/')
    let text = ''
    try { text = readFileSync(p, 'utf8') } catch { continue }
    if (/\.bib$/i.test(p)) { for (const e of parseBib(text)) if (!entries.some((x) => x.key === e.key)) entries.push(e) } else cites.push(...citesIn(text, rel))
  }
  return { files: files.map((p) => relative(dir, p).split('\\').join('/')), entries, cites }
}

const STATUS_WORDS = { ok: '核实', mismatch: '元数据不符', missing: '查无此文（疑似）', pending: '待查（请求失败）', web: '网页或软件', nometa: '条目缺标题' }
export const statusWord = (s) => STATUS_WORDS[s] || s

/** The report, for the person and the model: problems first, each with where it is cited. */
export function reportMarkdown(res, date) {
  const c = res.counts
  const where = (list) => (list || []).slice(0, 3).map((x) => `${x.file}:${x.line}「${x.sentence}」`).join('；') || '没有被引用'
  const lines = [`# 核引用 · ${date}`, '', `> 程序查的：${c.total} 条参考文献 — 核实 ${c.ok} · 元数据不符 ${c.mismatch} · 查无此文 ${c.missing} · 待查 ${c.pending} · 网页或软件 ${c.web}${c.nometa ? ' · 缺标题 ' + c.nometa : ''}${c.undefined ? ' · 引用了却不在 .bib 里 ' + c.undefined : ''}。`, '> 「查无此文」只是疑似：译过的标题、书、学位论文常被误报，要人确认；「待查」是请求失败，不算查无。', '']
  const section = (title, list, fmt) => { if (!list.length) return; lines.push('## ' + title, ''); for (const x of list) lines.push(fmt(x)); lines.push('') }
  const ent = (s) => res.entries.filter((e) => e.status === s)
  section('查无此文（疑似，请确认）', ent('missing'), (e) => `- **${e.key}** ${e.title || '（无标题）'}${e.year ? '（' + e.year + '）' : ''} — ${e.why}。引在：${where(e.cited)}`)
  section('引用了却不在 .bib 里', res.undefinedKeys, (u) => `- **${u.key}** 引在：${where(u.cited)}`)
  section('元数据不符', ent('mismatch'), (e) => `- **${e.key}** ${e.diffs.join('、')}不符：.bib 写「${e.title}」${firstFamily(e.author) ? ' / ' + firstFamily(e.author) : ''}${e.year ? ' / ' + e.year : ''}；查到「${e.found.title}」/ ${(e.found.authors || [])[0] || '—'} / ${e.found.year || '—'}（${e.found.url}）${e.notes.length ? '；' + e.notes.join('；') : ''}`)
  section('待查（请求失败，稍后再跑）', ent('pending'), (e) => `- **${e.key}** ${e.title} — ${e.why}`)
  section('网页或软件（程序不查，要打开看）', ent('web'), (e) => `- **${e.key}** ${e.why}`)
  section('条目缺标题', ent('nometa'), (e) => `- **${e.key}**`)
  section('核实', ent('ok'), (e) => `- ${e.key} — ${e.found.url}${e.notes.length ? '（' + e.notes.join('；') + '）' : ''}`)
  if (res.unused.length) lines.push('## 没被引用的条目', '', res.unused.join('、'), '')
  return lines.join('\n')
}

export function saveCheck(dir, date, res) {
  mkdirSync(join(dir, CHECK_DIR), { recursive: true })
  writeFileSync(join(dir, CHECK_DIR, date + '.json'), JSON.stringify({ date, ...res }, null, 1))
  writeFileSync(join(dir, CHECK_DIR, date + '.md'), reportMarkdown(res, date))
  return { json: CHECK_DIR + '/' + date + '.json', md: CHECK_DIR + '/' + date + '.md' }
}
export function lastCheck(dir) {
  let names = []
  try { names = readdirSync(join(dir, CHECK_DIR)) } catch { return null }
  const day = names.map((n) => (n.match(/^(\d{4}-\d{2}-\d{2})\.json$/) || [])[1]).filter(Boolean).sort().pop()
  if (!day) return null
  try { return JSON.parse(readFileSync(join(dir, CHECK_DIR, day + '.json'), 'utf8')) } catch { return null }
}
export const hasDraft = (dir) => existsSync(join(dir, DRAFT_DIR))
