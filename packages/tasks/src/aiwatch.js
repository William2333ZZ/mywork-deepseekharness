/**
 * dsh-mywork-tasks — the precheck of 「盯在用的 AI」 (EDITIONS.md 4.1, 9.3): a Node script, no model. It reads the
 * teammate's 在用清单 (清单.csv), looks at the sources, compares with what it saw last time and says what changed for a
 * row that is in use. Nothing changed → no model call and no run, just a receipt; something changed → a routine run whose
 * prompt carries the changes, and a change card built from them.
 *
 *   precheck({ listText, state, sources, options, fetchText, now }) →
 *     { state, changes: Change[], checked, related, unreadable: [{ title, reason }], sources: [{ title, ok, n }], baseline }
 *
 * Sources (all optional, each fails alone):
 *   deprecations.info  v1/deprecations.json: OpenAI, Anthropic, Google, Vertex, Cohere, Groq, xAI, Azure, with dates
 *   models.dev         api.json: per-provider prices (USD / 1M tokens) and status 'deprecated'
 *   OpenRouter         /api/v1/models: prices and expiration_date (rows whose vendor is OpenRouter)
 *   vendor pages       sources.json of the template (DeepSeek 更新日志 / 定价, 智谱, 百炼 …): text lines that name a model
 *                      in use; `render: true` pages need a browser and are listed as 没读到
 *   npm / PyPI         SDK rows: a new major version (options.sdk)
 *
 * The tier is decided here, by code, never by the model (EDITIONS.md 4.2): 立刻 (now) only for an operational change
 * (下线 · 调价 up · 改名重定向 · 改计费 · 限区域 · 停用 · 下架) of a row in use, matched exactly, taking effect within 14 days
 * (or already in effect); everything else 到点 (digest); SDK minor releases and loose matches never speak (seen).
 * The first run is the baseline: it records what is there and reports only what already touches a row in use (a
 * shutdown on its way, an old name now served by another model).
 */
import { createHash } from 'node:crypto'

export const SOURCES = {
  deprecations: { title: 'deprecations.info', url: 'https://deprecations.info/v1/deprecations.json' },
  modelsdev: { title: 'models.dev', url: 'https://models.dev/api.json' },
  openrouter: { title: 'OpenRouter', url: 'https://openrouter.ai/api/v1/models' },
}
export const NOW_DAYS = 14
const OPERATIONAL = new Set(['下线', '调价', '改名重定向', '改计费', '限区域', '停用', '下架'])
const DAY = 86400000

// ── the list ────────────────────────────────────────────────────────────────

/** CSV (RFC 4180) → rows of cells. */
export function parseCsv(text) {
  const s = String(text || '').replace(/^﻿/, '')
  const rows = []
  let row = []; let cell = ''; let quoted = false; let start = true; let any = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (quoted) { if (c !== '"') { cell += c; continue } if (s[i + 1] === '"') { cell += '"'; i++; continue } quoted = false; continue }
    if (c === '"' && start) { quoted = true; start = false; any = true; continue }
    if (c === ',') { row.push(cell); cell = ''; start = true; any = true; continue }
    if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; if (any) { row.push(cell); rows.push(row) } row = []; cell = ''; start = true; any = false; continue }
    cell += c; start = false; any = true
  }
  if (any) { row.push(cell); rows.push(row) }
  return rows
}
const csvCell = (v) => { const s = String(v === undefined || v === null ? '' : v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s }
export function toCsv(header, rows) { return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n') + '\n' }

/** The header of 在用清单 (EDITIONS.md 9.3): constraints before capability. */
export const LIST_HEADER = ['类型', '名称', '供应商', '模型ID或版本', '哪里在用', '负责人', '月用量或花费', '账号主体', '能否开票', '合规备注', '替代', '环', '怎么知道的', '启用']

const pick = (o, names) => { for (const n of names) { const v = o[n]; if (v !== undefined && String(v).trim()) return String(v).trim() } return '' }
/** The rows of 清单.csv as objects keyed by header, with the fields the precheck needs. Off (启用 = 否, 环 = 暂停) rows are kept but marked. */
export function readList(text) {
  const all = parseCsv(text)
  if (!all.length) return []
  const header = all[0].map((x) => String(x).trim())
  const out = []
  for (const cells of all.slice(1)) {
    if (!cells.some((c) => String(c).trim())) continue
    const o = {}
    header.forEach((h, i) => { o[h] = String(cells[i] === undefined ? '' : cells[i]).trim() })
    const id = pick(o, ['模型ID或版本', '模型ID', '模型', 'model', 'Model', '版本'])
    const name = pick(o, ['名称', '名字', 'name']) || id
    const vendorText = pick(o, ['供应商', '厂商', 'vendor', 'provider'])
    const kind = pick(o, ['类型', 'type'])
    const off = /^(否|停用|no|false|0|off)$/i.test(pick(o, ['启用'])) || /暂停/.test(pick(o, ['环']))
    out.push({ raw: o, kind, name, id, vendor: vendorOf(vendorText, id || name), vendorText, where: pick(o, ['哪里在用', '在哪用']), spend: pick(o, ['月用量或花费', '月花费', '月用量']), off })
  }
  return out
}

// ── vendors and model ids ───────────────────────────────────────────────────

const VENDORS = [
  ['deepseek', /deepseek|深度求索/i],
  ['alibaba', /百炼|阿里|通义|dashscope|aliyun|alibaba|qwen|qwq/i],
  ['zhipu', /智谱|zhipu|bigmodel|glm|z\.ai/i],
  ['moonshot', /月之暗面|moonshot|kimi/i],
  ['volcengine', /火山|方舟|豆包|doubao|volcengine|bytedance|字节/i],
  ['baidu', /百度|文心|千帆|ernie|qianfan/i],
  ['tencent', /腾讯|混元|hunyuan/i],
  ['minimax', /minimax|abab/i],
  ['stepfun', /阶跃|stepfun|\bstep-/i],
  ['siliconflow', /硅基|siliconflow/i],
  ['openrouter', /openrouter/i],
  ['azure', /azure/i],
  ['anthropic', /anthropic|claude/i],
  ['google', /google|gemini|vertex|gemma/i],
  ['xai', /\bxai\b|x\.ai|grok/i],
  ['groq', /\bgroq\b/i],
  ['cohere', /cohere|command-r/i],
  ['mistral', /mistral|codestral/i],
  ['openai', /openai|gpt|chatgpt|\bo[134](-|\b)|dall-e|whisper|text-embedding/i],
]
/** A vendor key from what the list says, else from the model id. */
export function vendorOf(text, id) {
  for (const [k, re] of VENDORS) if (re.test(String(text || ''))) return k
  for (const [k, re] of VENDORS) if (re.test(String(id || ''))) return k
  return ''
}
const MD_PROVIDERS = { deepseek: ['deepseek'], alibaba: ['alibaba-cn', 'alibaba'], zhipu: ['zhipuai', 'zai'], moonshot: ['moonshotai-cn', 'moonshotai'], volcengine: ['volcengine'], openai: ['openai'], anthropic: ['anthropic'], google: ['google'], xai: ['xai'], groq: ['groq'], cohere: ['cohere'], mistral: ['mistral'], openrouter: ['openrouter'], azure: ['azure'], siliconflow: ['siliconflow-cn', 'siliconflow'], minimax: ['minimax-cn', 'minimax'], stepfun: ['stepfun'], baidu: ['baidu'], tencent: ['tencent'] }
const DEP_VENDOR = { openai: 'openai', anthropic: 'anthropic', google: 'google', 'google vertex': 'google', cohere: 'cohere', groq: 'groq', xai: 'xai', azure: 'azure' }

/** A model id compared loosely: lower case, no provider path, no :free / :beta tag. */
export function normId(id) { return String(id || '').trim().toLowerCase().replace(/^.*\//, '').replace(/:[a-z-]+$/, '') }
const VERSION_TAIL = /^(\d{4}-?\d{2}-?\d{2}|\d{4}|\d{6}|\d{3,}|latest|preview|exp|v\d+)$/
/** 'exact' | 'loose' (one is the other plus a date or version tail: an alias against a snapshot) | '' */
export function sameModel(a, b) {
  const x = normId(a); const y = normId(b)
  if (!x || !y) return ''
  if (x === y) return 'exact'
  const [s, l] = x.length < y.length ? [x, y] : [y, x]
  if (l.startsWith(s + '-') && VERSION_TAIL.test(l.slice(s.length + 1))) return 'loose'
  return ''
}
/** A model row (not an SDK, framework or tool) that is in use. */
const isModelRow = (r) => !r.off && !!r.id && !/sdk|框架|库|工具|套餐|framework|library/i.test(r.kind)
const isSdkRow = (r) => !r.off && /sdk|框架|库|framework|library/i.test(r.kind)

// ── text, dates, money ──────────────────────────────────────────────────────

/** HTML → the page's text lines (scripts, styles and tags out; block ends become line breaks). */
export function htmlLines(html) {
  const t = String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/h\d|\/td|\/th|\/section|\/article|\/pre|\/blockquote)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&')
  return t.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter((l) => l.length > 1)
}
const pad = (n) => String(n).padStart(2, '0')
const iso = (y, m, d) => (y > 1990 && m >= 1 && m <= 12 && d >= 1 && d <= 31 ? `${y}-${pad(m)}-${pad(d)}` : '')
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 }
/** The first date a line mentions (2026-10-22 · 2026/10/22 · 2026年10月22日 · 10月22日 · October 22, 2026), as YYYY-MM-DD. */
export function dateIn(text, now = new Date()) {
  const s = String(text || '')
  let m
  if ((m = s.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/))) return iso(+m[1], +m[2], +m[3])
  if ((m = s.match(/(20\d{2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/))) return iso(+m[1], +m[2], +m[3])
  if ((m = s.match(/(?<!\d)(\d{1,2})\s*月\s*(\d{1,2})\s*日/))) return iso(now.getFullYear(), +m[1], +m[2])
  if ((m = s.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(20\d{2})/i))) return iso(+m[3], MONTHS[m[1].toLowerCase()], +m[2])
  return ''
}
/** Whole days from today to a YYYY-MM-DD (negative: already past), or null. */
export function daysTo(day, now = new Date()) {
  if (!day) return null
  const [y, m, d] = day.split('-').map(Number)
  const a = Date.UTC(y, m - 1, d)
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((a - b) / DAY)
}
/** 「¥5,000」「5000 元/月」「$1.2k」「1.5 万」 → { amount, currency } or null. */
export function spendOf(text) {
  const s = String(text || '').replace(/,/g, '')
  const m = s.match(/([¥￥$]|USD|RMB|CNY)?\s*(\d+(?:\.\d+)?)\s*(万|千|k|K)?\s*(元|块|美元|刀|USD|RMB)?/)
  if (!m || (!m[1] && !m[4] && !m[3])) return null
  let n = Number(m[2])
  if (m[3] === '万') n *= 10000
  else if (m[3]) n *= 1000
  const usd = /\$|USD|美元|刀/.test((m[1] || '') + (m[4] || ''))
  return n > 0 ? { amount: n, currency: usd ? '$' : '¥' } : null
}
const money = (n, c) => c + Math.round(Math.abs(n)).toLocaleString('en-US')

/** Which operational category a page line speaks of (or '' for a plain mention). */
export function categoryOf(line) {
  const s = String(line || '')
  const redirect = /指向|映射到|重定向|alias|redirect|points? to|由.{0,40}提供服务|改名|更名|升级为|切换(到|至)/i.test(s)
  const stillCallable = /仍可调用|继续可调|仍然可用|仍可访问|仍可使用|均可以访问|出于兼容|向前兼容|兼容考虑|still (available|callable|works)/i.test(s)
  const down = /下线|停止(服务|使用|支持|调用)|退役|弃用|废弃|deprecat|retir|sunset|shut ?down|discontinu|end of life|\beol\b|不再(提供|支持)/i.test(s)
  if (redirect && (stillCallable || !down)) return '改名重定向'
  if (down) return '下线'
  if (/计费(方式|规则|模式)|按.{0,10}计费|billing/i.test(s)) return '改计费'
  if (/限(制)?(地区|区域)|region|不再向.{0,10}(地区|用户)/i.test(s)) return '限区域'
  if (/封(号|禁)|停用|suspend|ban(ned)?\b/i.test(s)) return '停用'
  if (/价格|调价|涨价|降价|元\s*\/|¥|\$\s*\d|price|pricing/i.test(s)) return '调价'
  return ''
}
const hash = (s) => createHash('sha1').update(String(s)).digest('hex').slice(0, 16)

/** Where the operational wording of a sentence starts (−1: none). */
const KEYWORDS = /下线|停止(服务|使用|支持|调用)|退役|弃用|废弃|deprecat|retir|sunset|shut ?down|discontinu|end of life|\beol\b|不再(提供|支持)|指向|映射到|重定向|alias|redirect|points? to|提供服务|改名|更名|升级为|切换(到|至)|更改为|仍可调用|继续可调|计费|billing|限(制)?(地区|区域)|\bregion|封(号|禁)|停用|suspend|价格|调价|涨价|降价|price|pricing/i
/**
 * Which rows a line speaks about, sentence by sentence: a row named before the sentence's operational wording is its
 * subject (「deepseek-chat 将于 7/24 停止使用」); one named after it is only a target (「…指向 deepseek-v4-flash」).
 * → Map(row → { category, sentence })
 */
export function subjectsOf(line, rows) {
  const out = new Map()
  for (const s of String(line || '').split(/(?<=[。；;!！?？])\s*/)) {
    const category = categoryOf(s)
    if (!category) continue
    const k = s.search(KEYWORDS)
    const lower = s.toLowerCase()
    for (const r of rows) {
      if (out.has(r)) continue
      const id = normId(r.id)
      const m = new RegExp('(^|[^a-z0-9.-])' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9-])').exec(lower)
      if (m && (k < 0 || m.index < k)) out.set(r, { category, sentence: s })
    }
  }
  return out
}

// ── tiers ───────────────────────────────────────────────────────────────────

/** now | digest | seen, by the rule in the header. */
export function tierOf(c) {
  if (c.category === '发版') return c.major ? 'digest' : 'seen'
  if (!c.exact) return c.category ? 'digest' : 'seen'
  if (!OPERATIONAL.has(c.category)) return 'digest'
  if (c.category === '调价' && !(c.up > 0)) return 'digest'
  return c.days !== null && c.days !== undefined && c.days <= NOW_DAYS ? 'now' : 'digest'
}

function rowLabel(r) {
  const id = r.id && r.id !== r.name ? r.id : ''
  return (r.name || r.id) + (id && normId(id) !== normId(r.name) ? '（' + id + '）' : '')
}
/** The one-line headline of a change: what, when, where it is used. */
export function headlineOf(c) {
  const when = c.effective ? (c.days === null ? c.effective : c.days < 0 ? `${c.effective.slice(5).replace('-', '/')} 已生效` : c.days === 0 ? '今天生效' : `${c.effective.slice(5).replace('-', '/')} 生效，还有 ${c.days} 天`) : c.days === 0 ? '已生效' : ''
  return [c.subject + ' ' + c.summary, when, c.row.where ? c.row.where + '在用' : '哪里在用：未填'].filter(Boolean).join(' · ')
}
/** The push for 立刻 changes: rows touched, days left, a link — never money (EDITIONS.md 4.2, PROACTIVE 7.5). */
export function pushOf(mateName, changes) {
  const now = changes.filter((c) => c.tier === 'now')
  if (!now.length) return ''
  const lines = now.slice(0, 3).map((c) => '· ' + c.subject + ' ' + (c.brief || c.summary) + (c.days !== null && c.days <= 0 ? '（已生效）' : c.days > 0 ? `（还有 ${c.days} 天）` : '') + (c.url ? '\n  ' + c.url : ''))
  return `【${mateName || '盯在用的 AI'}】动到在用的 ${now.length} 行\n` + lines.join('\n') + (now.length > 3 ? `\n还有 ${now.length - 3} 条，打开 MyWork 看` : '')
}

// ── the precheck ────────────────────────────────────────────────────────────

const json = (text) => { try { return JSON.parse(text) } catch { return null } }

/**
 * One precheck. `fetchText(url)` → Promise<string> (throws on failure); `state` is what the last run left ({} the first
 * time); `sources` the template's vendor pages; `options.sdk` also checks SDK releases.
 */
export async function precheck({ listText, state, sources = [], options = {}, fetchText, now = new Date() }) {
  const prev = state && typeof state === 'object' && state.v === 1 ? state : null
  const baseline = !prev
  const next = { v: 1, baselineAt: prev ? prev.baselineAt : now.toISOString(), lastAt: now.toISOString(), dep: {}, md: {}, or: {}, pages: {}, sdk: {}, said: { ...(prev ? prev.said : {}) } }
  const rows = readList(listText)
  const models = rows.filter(isModelRow)
  const sdks = options.sdk === false ? [] : rows.filter(isSdkRow)
  const changes = []
  const unreadable = []
  const report = []
  let checked = 0
  let related = 0
  const add = (c) => {
    c.exact = c.exact !== false
    c.subject = c.subject || rowLabel(c.row)
    c.days = c.effective ? daysTo(c.effective, now) : (c.days === undefined ? null : c.days)
    c.tier = tierOf(c)
    c.key = c.key || hash([c.category, normId(c.row.id || c.row.name), c.effective, c.summary].join('|'))
    if (next.said[c.key]) return
    next.said[c.key] = now.toISOString()
    c.headline = headlineOf(c)
    changes.push(c)
  }
  const get = async (title, url) => {
    try { const t = await fetchText(url); report.push({ title, ok: true }); return t } catch (e) { unreadable.push({ title, reason: String((e && e.message) || e).slice(0, 80) }); report.push({ title, ok: false }); return null }
  }

  if (!models.length && !sdks.length) return { state: { ...next, said: next.said }, changes, checked, related, unreadable, sources: report, baseline, empty: true }

  // deprecations.info — dated shutdowns of the overseas vendors
  if (models.some((r) => Object.values(DEP_VENDOR).includes(r.vendor) || !r.vendor)) {
    const text = await get(SOURCES.deprecations.title, SOURCES.deprecations.url)
    const list = text ? json(text) : null
    if (text && !Array.isArray(list)) unreadable.push({ title: SOURCES.deprecations.title, reason: '读法失效：不是预期的 JSON' })
    for (const d of Array.isArray(list) ? list : []) {
      checked += 1
      const v = DEP_VENDOR[String(d.provider || '').toLowerCase()] || ''
      for (const r of models) {
        if (r.vendor && v && r.vendor !== v && r.vendor !== 'openrouter') continue
        const how = sameModel(r.id, d.model_id)
        if (!how) continue
        related += 1
        const k = hash([d.provider, d.model_id, d.shutdown_date].join('|'))
        next.dep[k] = true
        const seenBefore = prev && prev.dep && prev.dep[k]
        if (seenBefore) continue
        const effective = /^\d{4}-\d{2}-\d{2}$/.test(String(d.shutdown_date || '')) ? d.shutdown_date : ''
        const days = effective ? daysTo(effective, now) : null
        // An old retirement is history — unless the row in use is that very model: then it is the most urgent news there is.
        if (baseline && days !== null && days < -30 && how !== 'exact') continue
        add({
          row: r, category: '下线', exact: how === 'exact', effective, source: SOURCES.deprecations.title + ' · ' + d.provider, url: d.url || '',
          summary: how === 'exact' ? '下线' : `的快照 ${d.model_id} 下线（你清单里写的是 ${r.id}）`,
          replacement: Array.isArray(d.replacement_models) ? d.replacement_models.slice(0, 3) : [],
          quote: String(d.deprecation_context || '').slice(0, 300), backfill: baseline,
        })
      }
    }
  }

  // models.dev — prices and the deprecated status
  if (models.length) {
    const text = await get(SOURCES.modelsdev.title, SOURCES.modelsdev.url)
    const all = text ? json(text) : null
    if (text && !(all && typeof all === 'object')) unreadable.push({ title: SOURCES.modelsdev.title, reason: '读法失效：不是预期的 JSON' })
    if (all && typeof all === 'object') {
      for (const r of models) {
        const providers = (MD_PROVIDERS[r.vendor] || []).filter((p) => all[p])
        const pool = providers.length ? providers : Object.keys(all)
        let found = null
        for (const p of pool) {
          const ms = (all[p] && all[p].models) || {}
          for (const id of Object.keys(ms)) { checked += 1; if (sameModel(r.id, id) === 'exact') { found = { p, id, m: ms[id] }; break } }
          if (found) break
        }
        if (!found) continue
        related += 1
        const cost = found.m.cost || {}
        const cur = { in: Number(cost.input), out: Number(cost.output), status: String(found.m.status || '') }
        const key = found.p + ':' + found.id
        next.md[key] = cur
        const old = prev && prev.md ? prev.md[key] : null
        const url = 'https://models.dev/'
        if (old && Number.isFinite(cur.in) && Number.isFinite(old.in) && (cur.in !== old.in || cur.out !== old.out)) {
          const before = (old.in || 0) + (old.out || 0)
          const after = (cur.in || 0) + (cur.out || 0)
          const up = before > 0 ? after / before - 1 : 0
          const spend = spendOf(r.spend)
          add({
            row: r, category: '调价', effective: now.toISOString().slice(0, 10), source: SOURCES.modelsdev.title, url, up, brief: `${up > 0 ? '涨价' : '降价'} ${Math.round(Math.abs(up) * 100)}%`,
            summary: `${up > 0 ? '涨价' : '降价'}：输入 $${old.in}→$${cur.in}、输出 $${old.out}→$${cur.out}（每百万 token）`,
            price: { from: old, to: cur, unit: 'USD / 1M tokens' },
            monthly: spend && before > 0 ? { spend: spend.amount, currency: spend.currency, delta: spend.amount * up, text: `按上月 ${money(spend.amount, spend.currency)} 估，月费 ${up > 0 ? '+' : '−'}${money(spend.amount * up, spend.currency)}` } : null,
          })
        }
        if (cur.status === 'deprecated' && (!old || old.status !== 'deprecated')) {
          add({ row: r, category: '下线', effective: '', days: null, source: SOURCES.modelsdev.title, url, summary: '被标为已弃用（没有日期，以厂商公告为准）', backfill: baseline })
        }
      }
    }
  }

  // OpenRouter — rows whose vendor is OpenRouter
  const orRows = models.filter((r) => r.vendor === 'openrouter' || /\//.test(r.id) && /openrouter/i.test(r.vendorText))
  if (orRows.length) {
    const text = await get(SOURCES.openrouter.title, SOURCES.openrouter.url)
    const data = text ? json(text) : null
    for (const m of (data && Array.isArray(data.data) ? data.data : [])) {
      checked += 1
      for (const r of orRows) {
        if (String(r.id).toLowerCase() !== String(m.id).toLowerCase() && sameModel(r.id, m.id) !== 'exact') continue
        related += 1
        const cur = { in: Number(m.pricing && m.pricing.prompt) * 1e6, out: Number(m.pricing && m.pricing.completion) * 1e6, exp: m.expiration_date || '' }
        next.or[m.id] = cur
        const old = prev && prev.or ? prev.or[m.id] : null
        const url = 'https://openrouter.ai/' + m.id
        if (cur.exp && (!old || old.exp !== cur.exp)) add({ row: r, category: '下线', effective: String(cur.exp).slice(0, 10), source: SOURCES.openrouter.title, url, summary: '在 OpenRouter 上到期下架', backfill: baseline })
        if (old && Number.isFinite(cur.in) && (cur.in !== old.in || cur.out !== old.out)) {
          const before = (old.in || 0) + (old.out || 0)
          const up = before > 0 ? ((cur.in || 0) + (cur.out || 0)) / before - 1 : 0
          const spend = spendOf(r.spend)
          add({ row: r, category: '调价', effective: now.toISOString().slice(0, 10), source: SOURCES.openrouter.title, url, up, brief: `${up > 0 ? '涨价' : '降价'} ${Math.round(Math.abs(up) * 100)}%`, summary: `${up > 0 ? '涨价' : '降价'}：输入 $${+old.in.toFixed(3)}→$${+cur.in.toFixed(3)}、输出 $${+old.out.toFixed(3)}→$${+cur.out.toFixed(3)}（每百万 token）`, monthly: spend && before > 0 ? { spend: spend.amount, currency: spend.currency, delta: spend.amount * up, text: `按上月 ${money(spend.amount, spend.currency)} 估，月费 ${up > 0 ? '+' : '−'}${money(spend.amount * up, spend.currency)}` } : null })
        }
      }
    }
  }

  // vendor pages — lines that name a model in use
  for (const src of sources) {
    const mine = models.filter((r) => r.vendor && r.vendor === src.vendor)
    if (!mine.length) continue
    if (src.render) { unreadable.push({ title: src.title, reason: '页面要用浏览器打开，脚本读不了' }); continue }
    const html = await get(src.title, src.url)
    if (html === null) continue
    const lines = htmlLines(html)
    if (lines.join('').length < 300) { unreadable.push({ title: src.title, reason: '读法失效：页面上没有正文' }); continue }
    const page = { lines: {} }
    const old = prev && prev.pages ? prev.pages[src.url] : null
    // A changelog dates its sections (「时间: 2026-09-10」): a line without a date of its own takes its section's.
    let section = ''
    for (const line of lines) {
      checked += 1
      if (line.replace(/[\s\u200b]/g, '').length <= 30 && dateIn(line, now)) { section = dateIn(line, now); continue }
      const lower = line.toLowerCase()
      const hits = mine.filter((r) => { const id = normId(r.id); return id.length >= 3 && new RegExp('(^|[^a-z0-9.-])' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9-])').test(lower) })
      if (!hits.length) continue
      related += 1
      const h = hash(line)
      page.lines[h] = true
      if (old && old.lines && old.lines[h]) continue
      const subjects = subjectsOf(line, hits)
      const plain = !categoryOf(line)
      for (const r of hits) {
        // A row named only as the target of someone else's change (「…指向 deepseek-v4-flash」) is not what changed.
        const said = subjects.get(r)
        if (!said && !plain) continue
        const category = said ? said.category : ''
        // The baseline reports only operational lines (a shutdown, a redirect); later, any new line naming a row in use.
        if (baseline && !OPERATIONAL.has(category)) continue
        if (!old && !baseline && !OPERATIONAL.has(category)) continue // a page added to the sources later starts quiet
        const effective = (said ? dateIn(said.sentence, now) : '') || dateIn(line, now) || section
        // Old news is history (an upgrade, a price note from last year) — but a shutdown of a model still in use never is.
        // Applies on every run: a vendor rewording its changelog must not bring last year back as news.
        if (effective && daysTo(effective, now) < -30 && category !== '下线') continue
        const quote = (said ? said.sentence : line).slice(0, 300)
        add({
          row: r, category: category || '页面变动', effective, days: category === '改名重定向' && !effective ? 0 : undefined, page: true,
          source: src.title, url: src.url, quote, backfill: baseline, brief: category === '调价' ? '价格有变' : undefined,
          summary: category === '改名重定向' ? '改名或重定向：原名背后换了模型' : category === '下线' ? '下线' : category === '调价' ? '价格有变' : category === '改计费' ? '计费方式有变' : category ? category : '出现在新的一段说明里',
        })
      }
    }
    next.pages[src.url] = page
  }

  // SDKs — a new major version
  for (const r of sdks) {
    // 「openai（Node）」「dashscope (Python)」: the package is the name before any note in brackets.
    const pkg = String(r.name || '').replace(/[（(【\[].*$/, '').replace(/\s+.*$/, '').trim()
    if (!pkg) continue
    const py = /python|pypi|pip|requirements|pyproject/i.test((r.raw['怎么知道的'] || '') + ' ' + r.name)
    const url = py ? `https://pypi.org/pypi/${encodeURIComponent(pkg)}/json` : `https://registry.npmjs.org/${pkg.replace('/', '%2F')}/latest`
    const text = await get((py ? 'PyPI ' : 'npm ') + pkg, url)
    const d = text ? json(text) : null
    const version = d ? String(py ? (d.info && d.info.version) || '' : d.version || '') : ''
    if (!version) continue
    checked += 1
    related += 1
    const key = (py ? 'pypi:' : 'npm:') + pkg
    next.sdk[key] = version
    const old = prev && prev.sdk ? prev.sdk[key] : String(r.id || '').replace(/^[^\d]*/, '')
    const major = (v) => Number(String(v || '').replace(/^[^\d]*/, '').split('.')[0])
    if (old && version !== old && major(version) > major(old)) {
      add({ row: r, category: '发版', major: true, effective: '', days: null, source: py ? 'PyPI' : 'npm', url: py ? `https://pypi.org/project/${pkg}/` : `https://www.npmjs.com/package/${pkg}`, summary: `出了大版本 ${version}（你们在用 ${old}）`, subject: pkg })
    }
  }

  return { state: next, changes: mergeChanges(changes, now), checked, related, unreadable, sources: report, baseline }
}

/**
 * One item per row for 「it is gone or now something else」 (下线 / 改名重定向): the vendor's own page with a date wins,
 * then the vendor's page, then deprecations.info, then models.dev; the other sources are named after it.
 */
export function mergeChanges(changes, now = new Date()) {
  const rank = (c) => (c.page ? (c.effective ? 0 : 1) : /deprecations/.test(c.source) ? 2 : 3)
  const out = []
  const byRow = new Map()
  for (const c of changes) {
    if (c.category !== '下线' && c.category !== '改名重定向') { out.push(c); continue }
    const k = normId(c.row.id || c.row.name)
    const prev = byRow.get(k)
    if (!prev) { byRow.set(k, c); out.push(c); continue }
    const [win, lose] = rank(c) < rank(prev) || (rank(c) === rank(prev) && c.category === '改名重定向') ? [c, prev] : [prev, c]
    win.also = [...new Set([...(win.also || []), lose.source, ...(lose.also || [])])].filter((s) => s !== win.source)
    // 「gone, but the old name now reaches another model」 says more than 「gone」: keep the date, take its words.
    if (win.category === '下线' && lose.category === '改名重定向') {
      win.also = [...new Set([win.source, ...win.also])].filter((s) => s !== lose.source)
      Object.assign(win, { category: '改名重定向', summary: lose.summary, quote: lose.quote || win.quote, source: lose.source, url: lose.url || win.url })
      win.tier = tierOf(win)
    }
    if (!win.replacement || !win.replacement.length) win.replacement = lose.replacement || []
    if (lose.tier === 'now' && win.tier !== 'now' && win.exact && lose.exact) win.tier = 'now'
    win.headline = headlineOf(win)
    if (win !== prev) { out[out.indexOf(prev)] = win; byRow.set(k, win) }
  }
  return out
}

/** The prompt of the run a change wakes up (the teammate confirms, it does not decide the tier). */
export function changePrompt(routine, result) {
  const tierWord = { now: '立刻', digest: '到点', seen: '看过' }
  const lines = [
    `这是例行任务《${routine.title}》：预检脚本（没有经过模型）发现了动到在用清单的变化，见下面。你要做：`,
    '1. 打开每一条的一手出处确认（厂商的公告、更新日志、定价页；第三方来源只当线索）。只比证据，不比措辞：分清是事实变了，还是只是换了说法。',
    '2. 用几句话说清：动到 清单.csv 里哪几行、哪里在用（「哪里在用」空着就写「哪里在用：未填」，不要猜）；月费多花或少花多少（脚本估过的照用，没有用量就写没有用量数据，不要估）；离生效还有几天、要改什么、要重测什么；有什么替代，先说约束（能不能买到、能不能开票、会不会被封），再说能力。',
    '3. 对照 判断.csv 里的决定和假设，碰到重看条件的点名（J-编号），并把那一行的状态改成「动摇」。',
    '4. 卡片和档位由程序出，你不要改档位，不要重贴卡片里的表；不需要 deliver。',
    '5. 全部只是换了说法、事实没变，回话最后单独一行写「变化：无」；否则写「变化：有」。',
    '',
    result.baseline ? '（这是第一次检查：在用清单的现状已记下，以后只报相对这份的变化；下面是已经动到在用的。）' : '',
    '变化：',
    ...result.changes.map((c, i) => `${i + 1}. [${tierWord[c.tier] || '到点'}] ${c.headline} · ${c.category}${c.monthly ? ' · ' + c.monthly.text : ''}${c.replacement && c.replacement.length ? ' · 替代：' + c.replacement.join('、') : ''} · 出处 ${c.source}${c.also && c.also.length ? '（另见 ' + c.also.join('、') + '）' : ''}${c.url ? ' ' + c.url : ''}${c.quote ? '\n   原文：「' + c.quote + '」' : ''}`),
    '',
    `看过 ${result.checked} 条，动到在用的 ${result.related} 条。` + (result.unreadable.length ? '没读到：' + result.unreadable.map((u) => `${u.title}（${u.reason}）`).join('、') + '。脚本读不了的页面，你有空时用浏览器看一眼。' : ''),
  ]
  return lines.filter((x) => x !== '').join('\n')
}

/** The card entry of a change run (activity kind 'changes'): what the client draws, nothing the person cannot read. */
export function changesEntry(result) {
  return {
    kind: 'changes', baseline: !!result.baseline,
    items: result.changes.map((c) => ({
      key: c.key, subject: c.subject, summary: c.summary, category: c.category, tier: c.tier, effective: c.effective || '', days: c.days,
      where: c.row.where || '', exact: c.exact !== false, source: c.source, also: c.also || [], url: c.url || '', quote: c.quote || '',
      monthly: c.monthly ? c.monthly.text : '', replacement: c.replacement || [], backfill: !!c.backfill,
    })),
    checked: result.checked, related: result.related, unreadable: result.unreadable,
  }
}
