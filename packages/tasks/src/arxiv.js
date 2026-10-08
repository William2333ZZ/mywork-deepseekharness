/**
 * dsh-mywork-tasks — the 每日论文 teammate's arXiv list, fetched by code (design/v2/AI-WORKERS.md).
 *
 * 苏剑林 reads the whole day's arXiv list himself, in its own order, with no algorithm in front of it (科学空间 9907:
 * a pre-filter loses recall). So code takes the day's complete list for the categories in the teammate's AGENTS.md
 * (`分类：cs.CL, cs.LG`) from arXiv's RSS — new, cross-listed, and updated papers — and keeps it as
 * 每日/YYYY-MM-DD.json; the model goes through every title and writes its triage to 每日/YYYY-MM-DD.md, naming papers
 * by their arXiv id. No new list (weekends, US holidays) means nothing to do that day.
 *
 *   fetchDaily(cats, { fetch }) → { date, cats, items: Paper[] }
 *   Paper = { id, title, authors, abstract, cats: [], type: 'new' | 'cross' | 'replace' | 'replace-cross', link }
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const DAILY_DIR = '每日'
const UA = 'MyWork/0.1 (research teammate; https://github.com/William2333ZZ/mywork-deepseekharness)'
const CAT_RE = /^[a-z-]+(?:\.[A-Za-z-]+)?$/
export const TYPE_WORDS = { new: '新', cross: '交叉', replace: '更新', 'replace-cross': '交叉更新' }

const decode = (s) => String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&')
const tag = (xml, name) => { const m = String(xml).match(new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + name + '>')); return m ? decode(m[1]).trim() : '' }
const tags = (xml, name) => [...String(xml).matchAll(new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + name + '>', 'g'))].map((m) => decode(m[1]).trim())
const MONTHS = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' }
/** "Mon, 05 Oct 2026 00:00:00 -0400" → "2026-10-05" (the announcement day as arXiv dates it). */
function dayOf(rfc) {
  const m = String(rfc || '').match(/(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{4})/)
  return m && MONTHS[m[2]] ? `${m[3]}-${MONTHS[m[2]]}-${m[1].padStart(2, '0')}` : ''
}

/** The categories in AGENTS.md: the first 「分类：cs.CL, cs.LG」 line that names any (the seed's placeholder names none). */
export function categoriesOf(text) {
  for (const m of String(text || '').matchAll(/^\s*[-*]?\s*(?:分类|categories)\s*[:：]\s*(.+)$/gim)) {
    // 「（开张时写，例如 cs.CL, cs.LG）」 is the seed's placeholder, not a subscription.
    const cats = [...new Set(m[1].replace(/（[^）]*）|\([^)]*\)/g, ' ').split(/[\s,，、;；+]+/).map((x) => x.trim()).filter((x) => CAT_RE.test(x)))].slice(0, 12)
    if (cats.length) return cats
  }
  return []
}

/** arXiv's RSS for one or more categories → { date, items }. */
export function parseFeed(xml) {
  const channel = String(xml || '')
  const date = dayOf(tag(channel.split('<item>')[0], 'pubDate'))
  const items = []
  for (const m of channel.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const x = m[1]
    const desc = tag(x, 'description')
    const id = (desc.match(/arXiv:(\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v\d+)?/) || [])[1] || (tag(x, 'link').match(/abs\/([^\s?#]+?)(?:v\d+)?$/) || [])[1] || ''
    if (!id) continue
    const type = tag(x, 'arxiv:announce_type') || ((desc.match(/Announce Type:\s*([a-z-]+)/) || [])[1] || 'new')
    const abstract = (desc.split(/Abstract:\s*/)[1] || '').replace(/\s+/g, ' ').trim()
    items.push({ id, title: tag(x, 'title').replace(/\s+/g, ' '), authors: tag(x, 'dc:creator').replace(/\s+/g, ' '), abstract, cats: tags(x, 'category'), type, link: 'https://arxiv.org/abs/' + id })
  }
  return { date, items }
}

/** The day's list for these categories (one request; arXiv dedupes a paper listed in several). */
export async function fetchDaily(cats, { fetch: f = globalThis.fetch, timeoutMs = 60000 } = {}) {
  const list = (cats || []).filter((c) => CAT_RE.test(c))
  if (!list.length) throw new Error('AGENTS.md 里还没写分类（例如「分类：cs.CL, cs.LG」）。')
  const ac = typeof AbortController === 'function' ? new AbortController() : null
  const timer = ac ? setTimeout(() => ac.abort(), timeoutMs) : null
  try {
    const r = await f('https://rss.arxiv.org/rss/' + list.join('+'), { headers: { 'user-agent': UA }, ...(ac ? { signal: ac.signal } : {}) })
    if (!r.ok) throw new Error('arXiv 返回 ' + r.status)
    return { ...parseFeed(await r.text()), cats: list }
  } finally { if (timer) clearTimeout(timer) }
}

/** Numbered titles for the prompt: 「12. [2610.02293] Title（cs.CL · 新）」. */
export function titleLines(items) {
  return items.map((p, i) => `${i + 1}. [${p.id}] ${p.title}（${p.cats.slice(0, 3).join(' ')} · ${TYPE_WORDS[p.type] || p.type}）`).join('\n')
}

export function readDay(dir, date) {
  try { return JSON.parse(readFileSync(join(dir, DAILY_DIR, date + '.json'), 'utf8')) } catch { return null }
}
export function saveDay(dir, day) {
  mkdirSync(join(dir, DAILY_DIR), { recursive: true })
  writeFileSync(join(dir, DAILY_DIR, day.date + '.json'), JSON.stringify(day, null, 1))
}
export const triagePath = (date) => DAILY_DIR + '/' + date + '.md'
export function readTriage(dir, date) {
  const p = join(dir, triagePath(date))
  return existsSync(p) ? readFileSync(p, 'utf8') : ''
}
