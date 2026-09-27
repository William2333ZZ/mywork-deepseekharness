import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { OracleStore, PANELS, buildQuotes, buildSignals, panelPrompt, quoteCalls, valuePositions } from '../src/cockpit.js'

const hist = (...c) => ({ bars: c.map((close, i) => ({ date: `2026-09-${String(i + 1).padStart(2, '0')}`, close })), latest: { date: '2026-09-30' } })

test('store: watchlist and positions round-trip with validation', () => {
  const s = new OracleStore(join(mkdtempSync(join(tmpdir(), 'oracle-')), 'oracle.json'))
  assert.ok(s.read().watchlist.length >= 3, 'defaults')
  const w = s.addWatch({ kind: 'ashare', symbol: '000977', label: '浪潮' })
  assert.equal(w.symbol, '000977')
  assert.throws(() => s.addWatch({ kind: 'ashare', symbol: 'abc' }), /does not look like/)
  assert.throws(() => s.addWatch({ kind: 'nope', symbol: 'x' }), /kind must be/)
  assert.equal(s.addWatch({ kind: 'ashare', symbol: '000977' }).id, w.id, 'dedupe')
  const p = s.upsertPosition({ watchId: w.id, qty: 200, cost: 50 })
  assert.equal(p.qty, 200)
  assert.throws(() => s.upsertPosition({ watchId: w.id, qty: -1, cost: 1 }), /qty/)
  assert.throws(() => s.removeWatch(w.id), /position/)
  assert.equal(s.removePosition(p.id), true)
  assert.equal(s.removeWatch(w.id), true)
  const r = s.addReport({ topic: 'macro', title: 'x', summary: 'y', probability: 140, signals: [{ name: 'a', value: '1', meaning: 'm' }] })
  assert.equal(r.probability, 100)
  const again = new OracleStore(s.path)
  assert.equal(again.read().reports.length, 1, 'persisted')
})

test('signals: tiles derive spreads, ratios and deltas', () => {
  const results = {
    fg: { score: 37, rating: 'fear', one_week_ago: 30, timestamp: '2026-09-25' },
    nominal: { date: '09/25/2026', points: [{ tenor: '2Y', value: 4.81 }, { tenor: '10Y', value: 5.17 }] },
    real: { date: '09/25/2026', points: [{ tenor: '10Y', value: 2.83 }] },
    gold: hist(4000, 4100, 4321), copper: hist(4, 4.2, 4.4), oil: hist(60, 61, 59), usdcny: hist(7.1, 7.12, 7.15),
    btc: { points: [{ instrument_name: 'BTC-PERPETUAL', is_perpetual: true, mark_price: 84913 }, { instrument_name: 'BTC-26DEC26', is_perpetual: false, open_interest: 100, annualized_basis_vs_perpetual: 4.2 }] },
    cftcGold: [{ report_date: '2026-09-22', mm_net: 127389, open_interest: 412800 }, { mm_net: 144747 }],
    sectors: [{ name: '汽车零部件', main_net_cny: 989606464, change_pct: -0.64 }],
    pmFed: [{ title: 'Fed Decision in October?', slug: 'fed-oct', volume: 10, primary_market: { question: 'Cut in October?', yes_probability: 0.035 } }],
  }
  const s = buildSignals(results, { pmRecession: 'timeout' })
  const by = Object.fromEntries(s.tiles.map((t) => [t.id, t]))
  assert.equal(by.spread.value, 36)
  assert.equal(by.real10y.value, 2.83)
  assert.equal(by.gold.value, 4321)
  assert.equal(by.copper_gold.value, Number((4.4 / 4321 * 1000).toFixed(3)))
  assert.equal(by.btc_basis.value, 4.2)
  assert.equal(by.cftc_gold.delta, 127389 - 144747)
  assert.equal(by.pm_fed.value, 3.5)
  assert.equal(by.ashare_flow.value, '汽车零部件')
  assert.equal(s.sparks.gold.length, 3)
  assert.equal(s.errors.pmRecession, 'timeout')
})

test('quotes and positions: every kind is priced and valued', () => {
  const wl = [
    { id: 'a', kind: 'stooq', symbol: 'spy.us', label: 'SPY' }, { id: 'b', kind: 'ashare', symbol: '600519', label: '茅台' },
    { id: 'c', kind: 'crypto', symbol: 'bitcoin', label: 'BTC' }, { id: 'd', kind: 'polymarket', symbol: 'fed-oct', label: 'Fed' }, { id: 'e', kind: 'kalshi', symbol: 'KXFED-1', label: 'K' },
  ]
  assert.equal(quoteCalls(wl).length, 6, 'ashare needs quote + history')
  const q = buildQuotes(wl, {
    'q:a': hist(100, 110, 121), 'q:b': { last: 1237, change_pct: -1.14, name: '贵州茅台', pe_ttm: 17.4, turnover_rate_pct: 0.25 }, 'h:b': hist(1200, 1250, 1237),
    'q:c': [{ coin_id: 'bitcoin', price_usd: 84900, price_change_24h_pct: -1.2 }], 'q:d': { title: 'Fed', primary_market: { question: 'Cut?', yes_probability: 0.5 } }, 'q:e': { title: 'K', yes_probability: 0.25 },
  }, { 'q:zzz': 'ignored' })
  assert.equal(q.byId.a.last, 121); assert.equal(q.byId.a.changePct, 10); assert.equal(q.byId.a.change30Pct, 21)
  assert.equal(q.byId.b.last, 1237); assert.equal(q.byId.b.spark.length, 3)
  assert.equal(q.byId.c.last, 84900); assert.equal(q.byId.d.last, 50); assert.equal(q.byId.e.last, 25)
  const v = valuePositions([{ id: 'p1', watchId: 'a', qty: 10, cost: 100 }, { id: 'p2', watchId: 'b', qty: 100, cost: 1300 }], wl, q)
  assert.equal(v[0].value, 1210); assert.equal(v[0].pnl, 210); assert.equal(v[0].pnlPct, 21)
  assert.equal(v[1].pnl, -6300); assert.equal(v[1].currency, 'CNY')
})

test('panel prompt carries the cached signals and the portfolio', () => {
  const snapshot = { signals: { tiles: [{ id: 'gold', label: '黄金', value: 4321, unit: 'USD', delta: 8, deltaLabel: '30日%', meaning: 'm', source: 'src', asOf: '2026-09-25' }, { id: 'fg', label: '恐惧贪婪指数', value: 37, meaning: 'fear', source: 'CNN' }] } }
  const portfolio = { watchlist: [{ id: 'a', kind: 'stooq', symbol: 'xauusd', label: '黄金' }], quotes: { a: { last: 4321, changePct: 0.5 } }, positions: [{ label: '黄金', kind: 'stooq', qty: 2, cost: 4000, pnlPct: 8.03 }] }
  const text = panelPrompt(PANELS.find((p) => p.id === 'assets'), snapshot, portfolio, '  黄金要不要加仓？ ')
  assert.match(text, /黄金要不要加仓？/)
  assert.match(text, /- 黄金：4321USD（30日% \+8）；m（src，2026-09-25）/)
  assert.match(text, /我的持仓.*黄金 2 @ 成本 4000，浮动 \+8.03%/)
  assert.doesNotMatch(text, /[—–]/, 'no em/en dashes in the prompt')
  assert.match(text, /oracle_report_save.*topic = "assets"/)
  const geo = panelPrompt(PANELS[0], { signals: { tiles: [] } }, portfolio, '')
  assert.match(geo, /暂无缓存信号/)
  assert.doesNotMatch(geo, /我的持仓/)
})

import { dailyChanges, patrolDigest, recordHistory } from '../src/cockpit.js'

test('history and daily changes: only moves above the noise floor, biggest first', () => {
  let h = {}
  h = recordHistory(h, { tiles: [{ id: 'fg', label: '恐惧贪婪指数', value: 30 }, { id: 'gold', label: '黄金', value: 4000, unit: 'USD' }, { id: 'spread', label: '10Y-2Y 利差', value: 36, unit: 'bp' }] }, { byId: { a: { last: 100, label: 'SPY' } } }, '2026-09-26')
  h = recordHistory(h, { tiles: [{ id: 'fg', label: '恐惧贪婪指数', value: 37 }, { id: 'gold', label: '黄金', value: 4321, unit: 'USD' }, { id: 'spread', label: '10Y-2Y 利差', value: 37, unit: 'bp' }] }, { byId: { a: { last: 100.5, label: 'SPY' } } }, '2026-09-27')
  const c = dailyChanges(h, '2026-09-27')
  assert.equal(c.since, '2026-09-26')
  assert.deepEqual(c.items.map((x) => x.id), ['gold', 'fg'], 'spread (1bp) and SPY (0.5%) are noise')
  assert.match(c.items[0].text, /黄金 4000USD → 4321USD（\+8\.0%）/)
  assert.deepEqual(dailyChanges(h, '2026-09-26'), { since: null, items: [] })
  for (let i = 1; i <= 12; i++) h = recordHistory(h, { tiles: [] }, { byId: {} }, `2026-10-${String(i).padStart(2, '0')}`)
  assert.equal(Object.keys(h).length, 10, 'ten days kept')
})

test('patrol digest: sections follow the include flags and stay short', () => {
  const s = new OracleStore(join(mkdtempSync(join(tmpdir(), 'oracle-')), 'oracle.json'))
  assert.throws(() => s.setPatrol({ time: '25:00' }), /HH:MM/)
  const cfg = s.setPatrol({ enabled: true, time: '08:30', include: { temperature: true, symbols: false, reports: true }, target: 'acc1' })
  assert.equal(cfg.include.symbols, false)
  const old = s.addReport({ topic: 'assets', title: '旧报告', summary: 'x', probability: 40, symbol: '黄金' }); old.at = '2026-08-01T00:00:00.000Z'; s.write()
  const text = patrolDigest({ patrol: cfg, signals: { tiles: [{ id: 'fg', label: '恐惧贪婪指数', value: 37, delta: 7, deltaLabel: '周' }] }, portfolio: { watchlist: [{ id: 'a', label: 'SPY' }], quotes: { a: { last: 771, changePct: 0.5 } }, positions: [] }, changes: { since: '2026-09-26', items: [{ text: '黄金 4000 → 4321（+8.0%）' }] }, reports: s.read().reports, now: new Date('2026-09-28T08:30:00') })
  assert.match(text, /巡检 9月28日 08:30/)
  assert.match(text, /恐惧贪婪指数 37（周 \+7）/)
  assert.match(text, /较 2026-09-26 变化最大/)
  assert.doesNotMatch(text, /我的标的/, 'symbols excluded')
  assert.match(text, /该复核的报告[\s\S]*旧报告 40%/)
  assert.ok(text.length <= 1800)
  assert.equal(s.setVerdict(old.id, 'right').verdict, 'right')
  assert.equal(s.addRun({ ok: true, manual: true, target: 'x', summary: 's' }).ok, true)
})
