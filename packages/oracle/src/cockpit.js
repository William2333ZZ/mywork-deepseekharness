/**
 * dsh-mywork-oracle, the cockpit (驾驶舱) data layer.
 *
 * One JSON file holds what the user curates ($DSH_HOME/mywork/oracle.json): the watchlist, the
 * positions they typed in (quantity + cost, nothing is ever traded from here) and the reports the
 * model saved. A second file caches the last market snapshot so the page has numbers the moment
 * dsh starts. Every number comes from digital-oracle's providers through the same batch runner the
 * model uses; the providers are free and rate-limited, so the snapshot is refreshed on a timer
 * (signals 15 min, quotes 5 min) and a manual refresh has a cool-down.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { randomBytes } from 'node:crypto'

export function dshHome(env = process.env) { return env.DSH_HOME || join(homedir(), '.dsh') }
export function dataPath(env = process.env) { return join(dshHome(env), 'mywork', 'oracle.json') }
export function snapshotPath(env = process.env) { return join(dshHome(env), 'mywork', 'oracle-snapshot.json') }

const uid = (p) => p + '-' + randomBytes(4).toString('hex')

/** Watch item kinds → which provider answers for them and how a symbol must look. */
export const KINDS = {
  stooq: { label: '美股 / 商品 / 外汇', hint: 'spy.us · aapl.us · xauusd · cl.c · hg.c · usdcny', test: /^[a-z0-9]{2,12}(\.[a-z]{1,3})?$/i, currency: 'USD' },
  ashare: { label: 'A 股', hint: '6 位代码，如 600519', test: /^\d{6}$/, currency: 'CNY' },
  crypto: { label: '加密现货', hint: 'CoinGecko id，如 bitcoin · ethereum', test: /^[a-z0-9-]{2,40}$/, currency: 'USD' },
  polymarket: { label: 'Polymarket 合约', hint: '事件 slug，如 fed-decision-in-october', test: /^[a-z0-9-]{4,120}$/i, currency: '概率' },
  kalshi: { label: 'Kalshi 合约', hint: '市场 ticker，如 KXFED-27APR-T4.25', test: /^[A-Z0-9.-]{4,60}$/, currency: '概率' },
}

const DEFAULT_DATA = () => ({
  version: 1,
  watchlist: [
    { id: 'w-gold', kind: 'stooq', symbol: 'xauusd', label: '黄金' },
    { id: 'w-spy', kind: 'stooq', symbol: 'spy.us', label: 'SPY' },
    { id: 'w-btc', kind: 'crypto', symbol: 'bitcoin', label: 'BTC' },
    { id: 'w-moutai', kind: 'ashare', symbol: '600519', label: '贵州茅台' },
  ],
  positions: [],
  reports: [],
})

export class OracleStore {
  constructor(path = dataPath()) { this.path = path; this.data = null }
  read() {
    if (this.data) return this.data
    try { this.data = existsSync(this.path) ? { ...DEFAULT_DATA(), ...JSON.parse(readFileSync(this.path, 'utf8')) } : DEFAULT_DATA() } catch { this.data = DEFAULT_DATA() }
    for (const k of ['watchlist', 'positions', 'reports']) if (!Array.isArray(this.data[k])) this.data[k] = []
    return this.data
  }
  write() { mkdirSync(dirname(this.path), { recursive: true }); writeFileSync(this.path, JSON.stringify(this.data, null, 2) + '\n') }

  addWatch({ kind, symbol, label }) {
    const d = this.read()
    const k = KINDS[String(kind || '')]
    if (!k) throw new Error('kind must be one of: ' + Object.keys(KINDS).join(', '))
    let s = String(symbol || '').trim()
    if (kind === 'stooq' || kind === 'crypto' || kind === 'polymarket') s = s.toLowerCase()
    if (kind === 'kalshi') s = s.toUpperCase()
    if (!k.test.test(s)) throw new Error(`symbol "${s}" does not look like ${k.label}（${k.hint}）`)
    const dup = d.watchlist.find((w) => w.kind === kind && w.symbol === s)
    if (dup) return dup
    if (d.watchlist.length >= 40) throw new Error('watchlist is full (40)')
    const item = { id: uid('w'), kind, symbol: s, label: String(label || '').trim().slice(0, 40) || s }
    d.watchlist.push(item); this.write(); return item
  }
  removeWatch(id) {
    const d = this.read()
    if (d.positions.some((p) => p.watchId === id)) throw new Error('remove the position on this item first')
    const n = d.watchlist.length; d.watchlist = d.watchlist.filter((w) => w.id !== id); if (d.watchlist.length !== n) this.write(); return d.watchlist.length !== n
  }
  upsertPosition({ id, watchId, qty, cost, note }) {
    const d = this.read()
    const w = d.watchlist.find((x) => x.id === watchId)
    if (!w) throw new Error('unknown watch item')
    const q = Number(qty); const c = Number(cost)
    if (!Number.isFinite(q) || q <= 0) throw new Error('qty must be a positive number')
    if (!Number.isFinite(c) || c < 0) throw new Error('cost must be a number >= 0')
    let p = id ? d.positions.find((x) => x.id === id) : null
    if (!p) { p = { id: uid('p'), watchId, qty: q, cost: c, note: '', createdAt: new Date().toISOString() }; d.positions.push(p) }
    Object.assign(p, { watchId, qty: q, cost: c, note: String(note || '').slice(0, 120), updatedAt: new Date().toISOString() })
    this.write(); return p
  }
  removePosition(id) { const d = this.read(); const n = d.positions.length; d.positions = d.positions.filter((p) => p.id !== id); if (n !== d.positions.length) this.write(); return n !== d.positions.length }
  addReport(r) {
    const d = this.read()
    const item = {
      id: uid('r'), at: new Date().toISOString(),
      topic: PANELS.some((p) => p.id === r.topic) ? r.topic : 'custom',
      title: String(r.title || '').trim().slice(0, 120) || '未命名报告',
      question: String(r.question || '').trim().slice(0, 600),
      probability: r.probability === undefined || r.probability === null || r.probability === '' ? null : Math.max(0, Math.min(100, Number(r.probability))),
      horizon: String(r.horizon || '').trim().slice(0, 40),
      summary: String(r.summary || '').trim().slice(0, 4000),
      signals: (Array.isArray(r.signals) ? r.signals : []).slice(0, 24).map((s) => ({ name: String(s && s.name || '').slice(0, 60), value: String(s && s.value || '').slice(0, 60), meaning: String(s && s.meaning || '').slice(0, 160) })),
      sessionId: r.sessionId ? String(r.sessionId) : null,
    }
    if (Number.isNaN(item.probability)) item.probability = null
    d.reports.unshift(item); d.reports = d.reports.slice(0, 200); this.write(); return item
  }
  removeReport(id) { const d = this.read(); const n = d.reports.length; d.reports = d.reports.filter((r) => r.id !== id); if (n !== d.reports.length) this.write(); return n !== d.reports.length }
}

// ---------------------------------------------------------------------------------------------
// Snapshot: market temperature tiles + watchlist quotes
// ---------------------------------------------------------------------------------------------
export const SIGNAL_CALLS = [
  { id: 'fg', provider: 'FearGreedProvider', method: 'get_index', args: {} },
  { id: 'nominal', provider: 'USTreasuryProvider', method: 'latest_yield_curve', args: {} },
  { id: 'real', provider: 'USTreasuryProvider', method: 'latest_yield_curve', args: { curve_kind: 'real' } },
  { id: 'gold', provider: 'StooqProvider', method: 'get_history', args: { symbol: 'xauusd', limit: 30 } },
  { id: 'copper', provider: 'StooqProvider', method: 'get_history', args: { symbol: 'hg.c', limit: 30 } },
  { id: 'oil', provider: 'StooqProvider', method: 'get_history', args: { symbol: 'cl.c', limit: 30 } },
  { id: 'usdcny', provider: 'StooqProvider', method: 'get_history', args: { symbol: 'usdcny', limit: 30 } },
  { id: 'btc', provider: 'DeribitProvider', method: 'get_futures_term_structure', args: {} },
  { id: 'cftcGold', provider: 'CftcCotProvider', method: 'list_reports', args: { commodity_name: 'GOLD', limit: 2 } },
  { id: 'sectors', provider: 'EastmoneyProvider', method: 'list_sector_fund_flow', args: { limit: 5 } },
  { id: 'pmFed', provider: 'PolymarketProvider', method: 'list_events', args: { slug_contains: 'fed', limit: 6 } },
  { id: 'pmRecession', provider: 'PolymarketProvider', method: 'list_events', args: { slug_contains: 'recession', limit: 8 } },
]

const closes = (h) => (h && Array.isArray(h.bars) ? h.bars.map((b) => Number(b.close)).filter(Number.isFinite) : [])
const pct = (a, b) => (Number.isFinite(a) && Number.isFinite(b) && b !== 0 ? (a / b - 1) * 100 : null)
const round = (v, d = 2) => (Number.isFinite(v) ? Number(v.toFixed(d)) : null)
const price = (v) => (Number.isFinite(v) ? round(v, Math.abs(v) >= 100 ? 2 : Math.abs(v) >= 1 ? 3 : 5) : null)
const tenor = (curve, t) => { const p = curve && Array.isArray(curve.points) ? curve.points.find((x) => x.tenor === t) : null; return p ? Number(p.value) : null }

/** Highest-volume event; `must` filters titles, `prefer` promotes matches (e.g. the US contract over Japan's). */
function pmTop(events, must, prefer) {
  if (!Array.isArray(events)) return null
  let rows = events.map((e) => ({ title: String(e.title || ''), slug: e.slug, volume: Number(e.volume) || 0, market: e.primary_market || (Array.isArray(e.markets) ? e.markets[0] : null) })).filter((r) => r.market)
  if (must) rows = rows.filter((r) => must.test(r.title))
  rows.sort((a, b) => b.volume - a.volume)
  if (prefer) { const hit = rows.find((r) => prefer.test(r.title)); if (hit) rows = [hit, ...rows.filter((r) => r !== hit)] }
  const r = rows[0]; if (!r) return null
  return { title: r.title, slug: r.slug, question: r.market.question, yes: Number.isFinite(Number(r.market.yes_probability)) ? Number(r.market.yes_probability) * 100 : null, volume: r.volume }
}

/** Turn raw provider results into tiles the page and the prompts can use. */
export function buildSignals(results, errors = {}) {
  const tiles = []; const sparks = {}
  const tile = (t) => { tiles.push(t) }
  const at = new Date().toISOString()
  const fg = results.fg
  if (fg && Number.isFinite(Number(fg.score))) tile({ id: 'fg', label: '恐惧贪婪指数', value: round(Number(fg.score), 0), unit: '', delta: round(Number(fg.score) - Number(fg.one_week_ago), 0), deltaLabel: '周', meaning: `${fg.rating || ''}；<25 极度恐惧常是反向买点，>75 贪婪要提防`, source: 'CNN Fear & Greed', asOf: fg.timestamp })
  const r10 = tenor(results.real, '10Y'); const n10 = tenor(results.nominal, '10Y'); const n2 = tenor(results.nominal, '2Y')
  if (r10 !== null) tile({ id: 'real10y', label: '10Y 实际利率', value: round(r10), unit: '%', meaning: '持有黄金 / 长久期资产的机会成本；>2% 是历史级逆风', source: 'US Treasury TIPS', asOf: results.real && results.real.date })
  if (n10 !== null && n2 !== null) tile({ id: 'spread', label: '10Y-2Y 利差', value: round((n10 - n2) * 100, 0), unit: 'bp', meaning: '倒挂 = 衰退预警；转正且陡峭 = 降息周期或不着陆', source: 'US Treasury', asOf: results.nominal && results.nominal.date, extra: `10Y ${n10}%，2Y ${n2}%` })
  const g = closes(results.gold); const c = closes(results.copper); const o = closes(results.oil); const cny = closes(results.usdcny)
  if (g.length) { tile({ id: 'gold', label: '黄金', value: round(g.at(-1)), unit: 'USD', delta: round(pct(g.at(-1), g[0]), 1), deltaLabel: '30日%', meaning: '避险与通胀对冲；与实际利率反向', source: 'Yahoo GC=F', asOf: results.gold.latest && results.gold.latest.date }); sparks.gold = g }
  if (g.length && c.length) { const cg = c.map((x, i) => (g[i] ? x / g[i] * 1000 : null)).filter((x) => x !== null); if (cg.length) { tile({ id: 'copper_gold', label: '铜 / 金比', value: round(cg.at(-1), 3), unit: '', delta: round(pct(cg.at(-1), cg[0]), 1), deltaLabel: '30日%', meaning: '上升 = risk-on（工业需求强于避险）；下降 = risk-off', source: 'HG=F / GC=F', asOf: results.copper.latest && results.copper.latest.date }); sparks.copper_gold = cg } }
  if (o.length) { tile({ id: 'oil', label: '原油 WTI', value: round(o.at(-1)), unit: 'USD', delta: round(pct(o.at(-1), o[0]), 1), deltaLabel: '30日%', meaning: '冲突 / 供给冲击的第一反应资产', source: 'Yahoo CL=F', asOf: results.oil.latest && results.oil.latest.date }); sparks.oil = o }
  if (cny.length) { tile({ id: 'usdcny', label: '美元 / 人民币', value: round(cny.at(-1), 4), unit: '', delta: round(pct(cny.at(-1), cny[0]), 2), deltaLabel: '30日%', meaning: '上升 = 人民币走弱、资本外流压力', source: 'Yahoo USDCNY=X', asOf: results.usdcny.latest && results.usdcny.latest.date }); sparks.usdcny = cny }
  const pts = results.btc && Array.isArray(results.btc.points) ? results.btc.points.filter((p) => !p.is_perpetual && Number.isFinite(Number(p.annualized_basis_vs_perpetual))) : []
  if (pts.length) { pts.sort((a, b) => (Number(b.open_interest) || 0) - (Number(a.open_interest) || 0)); const p = pts[0]; const perp = results.btc.points.find((x) => x.is_perpetual); tile({ id: 'btc_basis', label: 'BTC 期货年化基差', value: round(Number(p.annualized_basis_vs_perpetual), 1), unit: '%', meaning: '>10% 杠杆多头拥挤；接近 0 或为负 = 风险偏好熄火', source: `Deribit ${p.instrument_name}`, asOf: at, extra: perp ? `BTC ${round(Number(perp.mark_price), 0)} USD` : '' }) }
  const cot = Array.isArray(results.cftcGold) ? results.cftcGold : []
  if (cot.length) { const a = cot[0]; const b = cot[1]; const oi = Number(a.open_interest) || 0; tile({ id: 'cftc_gold', label: '黄金基金净多头', value: round(Number(a.mm_net), 0), unit: '手', delta: b ? round(Number(a.mm_net) - Number(b.mm_net), 0) : null, deltaLabel: '周', meaning: `占持仓 ${oi ? round(Number(a.mm_net) / oi * 100, 1) : '?'}%；净多高位减仓 = 投机盘撤退`, source: 'CFTC COT', asOf: a.report_date }) }
  const sec = Array.isArray(results.sectors) ? results.sectors : []
  if (sec.length) tile({ id: 'ashare_flow', label: 'A 股主力净流入板块', value: sec[0].name, unit: '', meaning: sec.slice(0, 3).map((s) => `${s.name} ${round(Number(s.main_net_cny) / 1e8, 1)}亿`).join('，'), source: '东方财富（收盘后更新）', asOf: at, list: sec.slice(0, 5).map((s) => ({ name: s.name, netYi: round(Number(s.main_net_cny) / 1e8, 1), changePct: s.change_pct })) })
  const fed = pmTop(results.pmFed, /\bfed\b|fomc|rate (cut|hike)/i); const rec = pmTop(results.pmRecession, /recession/i, /\bus\b|u\.s\.|united states|american/i)
  if (fed && fed.yes !== null) tile({ id: 'pm_fed', label: 'Polymarket 美联储', value: round(fed.yes, 1), unit: '%', meaning: fed.question || fed.title, source: `Polymarket ${fed.slug}`, asOf: at })
  if (rec && rec.yes !== null) tile({ id: 'pm_recession', label: 'Polymarket 衰退', value: round(rec.yes, 1), unit: '%', meaning: rec.question || rec.title, source: `Polymarket ${rec.slug}`, asOf: at })
  return { at, tiles, sparks, errors }
}

/** Provider calls for the watchlist (one or two per item). */
export function quoteCalls(watchlist) {
  const calls = []
  for (const w of watchlist) {
    if (w.kind === 'stooq') calls.push({ id: `q:${w.id}`, provider: 'StooqProvider', method: 'get_history', args: { symbol: w.symbol, limit: 30 } })
    else if (w.kind === 'ashare') { calls.push({ id: `q:${w.id}`, provider: 'EastmoneyProvider', method: 'get_quote', args: { symbol: w.symbol } }); calls.push({ id: `h:${w.id}`, provider: 'EastmoneyProvider', method: 'get_history', args: { symbol: w.symbol, limit: 30 } }) }
    else if (w.kind === 'crypto') calls.push({ id: `q:${w.id}`, provider: 'CoinGeckoProvider', method: 'get_prices', args: { coin_ids: [w.symbol] } })
    else if (w.kind === 'polymarket') calls.push({ id: `q:${w.id}`, provider: 'PolymarketProvider', method: 'get_event', args: { slug: w.symbol } })
    else if (w.kind === 'kalshi') calls.push({ id: `q:${w.id}`, provider: 'KalshiProvider', method: 'get_market', args: { ticker: w.symbol } })
  }
  return calls
}

export function buildQuotes(watchlist, results, errors = {}) {
  const byId = {}
  for (const w of watchlist) {
    const q = results[`q:${w.id}`]; const err = errors[`q:${w.id}`]
    const out = { watchId: w.id, kind: w.kind, symbol: w.symbol, label: w.label, last: null, changePct: null, change30Pct: null, spark: [], name: '', error: err || null, currency: KINDS[w.kind].currency }
    if (w.kind === 'stooq') { const c = closes(q); if (c.length) { out.last = price(c.at(-1)); out.changePct = round(pct(c.at(-1), c.at(-2)), 2); out.change30Pct = round(pct(c.at(-1), c[0]), 2); out.spark = c; out.asOf = q.latest && q.latest.date } }
    else if (w.kind === 'ashare') { if (q && Number.isFinite(Number(q.last))) { out.last = Number(q.last); out.changePct = q.change_pct; out.name = q.name || ''; out.extra = `PE ${q.pe_ttm} · 换手 ${q.turnover_rate_pct}%` } const c = closes(results[`h:${w.id}`]); if (c.length) { out.spark = c; out.change30Pct = round(pct(out.last ?? c.at(-1), c[0]), 2) } }
    else if (w.kind === 'crypto') { const p = Array.isArray(q) ? q[0] : null; if (p && Number.isFinite(Number(p.price_usd))) { out.last = price(Number(p.price_usd)); out.changePct = p.price_change_24h_pct ?? null; out.name = p.coin_id } }
    else if (w.kind === 'polymarket') { const m = q && (q.primary_market || (Array.isArray(q.markets) ? q.markets[0] : null)); if (m && Number.isFinite(Number(m.yes_probability))) { out.last = round(Number(m.yes_probability) * 100, 1); out.name = m.question || q.title } }
    else if (w.kind === 'kalshi') { if (q && Number.isFinite(Number(q.yes_probability))) { out.last = round(Number(q.yes_probability) * 100, 1); out.name = q.title || '' } }
    byId[w.id] = out
  }
  return { at: new Date().toISOString(), byId }
}

/** Positions valued at the latest quote. Probability contracts are priced 0-100 like the quote. */
export function valuePositions(positions, watchlist, quotes) {
  const out = []
  for (const p of positions) {
    const w = watchlist.find((x) => x.id === p.watchId); if (!w) continue
    const q = quotes && quotes.byId ? quotes.byId[w.id] : null
    const last = q && Number.isFinite(Number(q.last)) ? Number(q.last) : null
    const value = last !== null ? last * p.qty : null
    const costValue = p.cost * p.qty
    out.push({ ...p, kind: w.kind, symbol: w.symbol, label: w.label, currency: KINDS[w.kind].currency, last, value: round(value, 2), costValue: round(costValue, 2), pnl: value !== null ? round(value - costValue, 2) : null, pnlPct: value !== null && costValue > 0 ? round((value / costValue - 1) * 100, 2) : null })
  }
  return out
}

// ---------------------------------------------------------------------------------------------
// The five question panels: which tiles they read, and the prompt "问先知" starts a conversation with
// ---------------------------------------------------------------------------------------------
export const PANELS = [
  { id: 'geo', label: '地缘冲突', tiles: ['gold', 'oil', 'copper_gold', 'fg', 'cftc_gold', 'usdcny'], question: '当前地缘冲突风险（战争升级、制裁、供给冲击）在市场里定价到了什么程度？未来 3-6 个月升级的概率有多大？', extra: 'Polymarket / Kalshi 上相关的冲突合约、防务 ETF（ITA）、小麦 / 天然气、瑞郎，以及 CFTC 原油持仓' },
  { id: 'macro', label: '衰退周期', tiles: ['spread', 'real10y', 'fg', 'copper_gold', 'btc_basis', 'pm_fed', 'pm_recession'], question: '未来 12 个月美国经济衰退的概率是多少？利率路径和风险资产分别在定价什么？', extra: 'Kalshi KXFED 系列、高收益债利差（网页搜索）、SPY / 铜 / 原油趋势、BIS 信贷缺口' },
  { id: 'bubble', label: '泡沫与风险偏好', tiles: ['fg', 'btc_basis', 'pm_fed', 'copper_gold', 'gold'], question: '当前风险资产（美股 AI 龙头、加密）是否处于泡沫阶段？拥挤度和杠杆水平如何？', extra: 'NVDA / SOXX / ASML 走势与期权 IV、EDGAR 内部人卖出、Deribit 期权 IV、CoinGecko BTC 占比、杠杆 ETF 与融资余额（网页搜索）' },
  { id: 'assets', label: '资产择时', tiles: ['gold', 'real10y', 'fg', 'btc_basis', 'cftc_gold'], question: '结合我的自选与持仓：现在哪些资产适合加仓、减仓或观望？分别给概率场景。', extra: '每个标的的价格趋势、期权 IV 与 put/call、机构持仓、内部人交易、相关资产的相对价格', portfolio: true },
  { id: 'ashare', label: 'A 股', tiles: ['ashare_flow', 'usdcny', 'fg'], question: 'A 股主力资金在往哪些板块轮动？我自选里的个股主力是在买还是卖？', extra: 'EastmoneyProvider.get_fund_flow（拆单资金流）、list_sector_fund_flow、get_history 前复权 K 线、FXI / USDCNY 的离岸视角、美股同产业链对照', portfolio: true, ashareOnly: true },
]

function fmtTile(t) {
  const v = typeof t.value === 'number' ? `${t.value}${t.unit || ''}` : String(t.value)
  const d = t.delta !== undefined && t.delta !== null ? `（${t.deltaLabel || ''} ${t.delta > 0 ? '+' : ''}${t.delta}）` : ''
  return `- ${t.label}：${v}${d}${t.extra ? `，${t.extra}` : ''}；${t.meaning}（${t.source}${t.asOf ? '，' + String(t.asOf).slice(0, 10) : ''}）`
}

/** The text a panel's 问先知 button puts into a new conversation. */
export function panelPrompt(panel, snapshot, portfolio, custom) {
  const tiles = (snapshot && snapshot.signals && snapshot.signals.tiles || []).filter((t) => panel.tiles.includes(t.id))
  const lines = [
    `【市场先知 · ${panel.label}】${custom && custom.trim() ? custom.trim() : panel.question}`,
    '',
    '先 oracle_docs("skill") 读方法论（本会话未读过的话）。驾驶舱已取到的信号如下，把它们当第一层，再至少补 2 个独立维度（建议：' + panel.extra + '），用 oracle_fetch 并行取数：',
    ...(tiles.length ? tiles.map(fmtTile) : ['- （驾驶舱暂无缓存信号，请自行取数）']),
  ]
  if (panel.portfolio && portfolio) {
    const items = panel.ashareOnly ? portfolio.watchlist.filter((w) => w.kind === 'ashare') : portfolio.watchlist
    if (items.length) lines.push('', '我的自选：' + items.map((w) => { const q = portfolio.quotes && portfolio.quotes[w.id]; return `${w.label}（${w.kind}:${w.symbol}${q && q.last !== null ? `，最新 ${q.last}${q.changePct !== null && q.changePct !== undefined ? `，日 ${q.changePct}%` : ''}` : ''}）` }).join('；'))
    const pos = panel.ashareOnly ? portfolio.positions.filter((p) => p.kind === 'ashare') : portfolio.positions
    if (pos.length) lines.push('我的持仓（只用于分析，不要下任何交易指令）：' + pos.map((p) => `${p.label} ${p.qty} @ 成本 ${p.cost}${p.pnlPct !== null && p.pnlPct !== undefined ? `，浮动 ${p.pnlPct > 0 ? '+' : ''}${p.pnlPct}%` : ''}`).join('；'))
  }
  lines.push('', '按 SKILL.md 第 5 步模板输出：分层信号表 → 矛盾分析 → 概率场景（标注时间窗口）→ 信号一致性。写完后调用 oracle_report_save 把结论存进驾驶舱（topic = "' + panel.id + '"）。这是分析，不是交易指令。')
  return lines.join('\n')
}
