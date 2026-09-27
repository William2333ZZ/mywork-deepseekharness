/**
 * dsh-mywork-oracle, browser half: the "市场先知" tab in 设置 → MyWork (slot `mywork.settings.tab`).
 * Shows the Python / yfinance state, runs a live self-check and installs yfinance on request.
 */
'use strict'
const React = require('react')
const { icon } = require('./client-icons.cjs')
const PLUGIN = 'dsh-mywork-oracle'
const NS = 'mywork.oracle'
const API = '/mywork-oracle/api'
const TAB_SLOT = 'mywork.settings.tab'
const PAGE_SLOT = 'mywork.oracle.section'

const zh = {
  nav: '市场先知', title: 'Digital Oracle · 市场数据先知',
  intro: '用市场交易数据（预测市场、期权、国债曲线、机构持仓、内部人交易、加密衍生品、A 股资金流）回答「这件事概率多大」「现在值不值得买」。模型在对话里自动使用 oracle_* 工具；新建对话页有「市场先知」起点。只做分析，不下单。',
  env: '运行环境', python: 'Python', yfinance: 'yfinance（美股价格历史 / 期权链）', providers: '数据源', version: '内置版本', ok: '可用', missing: '未安装', bad: '不可用',
  selfcheck: '自检（联网拉三组数据）', checking: '检查中…', install: '安装 yfinance', installing: '安装中…（1-3 分钟）',
  result: '结果', errors: '失败的数据源', refresh: '刷新',
  examples: '可以问的问题', ex1: 'WW3 的概率是多少？', ex2: '现在适合买黄金吗？', ex3: '比特币到底了吗？', ex4: '600519 主力资金最近在买还是卖？', ex5: 'NVDA 期权溢价是不是太高了？',
  credit: '基于 komako-workshop/digital-oracle（MIT）',
  temp: '市场温度', updated: '更新于 {0}', never: '尚未取数', refreshNow: '刷新', refreshing: '取数中…', cooldown: '刚刚刷新过，稍后再试',
  panels: '五个问题', ask: '问先知', askPlaceholder: '补充你的具体问题（可空）', signalsNone: '暂无缓存信号',
  watch: '自选', positions: '持仓', reports: '报告档案', add: '添加', remove: '删除', kind: '类型', symbol: '代码', label: '名称', qty: '数量', cost: '成本', pnl: '浮动盈亏', value: '市值', last: '最新', day: '日', d30: '30日',
  posHint: '从自选里选标的，填数量和成本。持仓只用来算盈亏、给模型当分析背景，这里没有任何下单功能。', noPos: '还没有持仓。', noWatch: '自选为空。', noReports: '还没有报告。',
  openSession: '打开对话', prob: '概率', horizon: '窗口', sources: '数据源', chooseWatch: '选择自选标的', errors: '取数失败',
  noWatchHint: '在下方选类型、填代码就能加入，价格几秒内出现。', noReportsHint: '在任一问题上按「问先知」，模型写完报告会自动存到这里。', signalsNoneHint: '数据源尚未返回。等一分钟，或按「刷新」。', panelsHint: '按「问先知」会带着当前数字和你的自选、持仓开一个新对话',
}
const en = {
  nav: 'Market oracle', title: 'Digital Oracle · market-data oracle',
  intro: 'Answers "how likely is X" and "is Y worth buying now" from trading data only: prediction markets, options, yield curves, CFTC positioning, insider filings, crypto derivatives, A-share fund flow. The model uses the oracle_* tools by itself; the new-conversation page has a "Market oracle" starting point. Analysis only, no orders.',
  env: 'Environment', python: 'Python', yfinance: 'yfinance (US price history / options chains)', providers: 'Data sources', version: 'Bundled version', ok: 'ready', missing: 'not installed', bad: 'unavailable',
  selfcheck: 'Self-check (fetches three live signals)', checking: 'Checking…', install: 'Install yfinance', installing: 'Installing… (1-3 min)',
  result: 'Result', errors: 'Failed sources', refresh: 'Refresh',
  examples: 'Questions to try', ex1: 'What is the probability of WW3?', ex2: 'Is it a good time to buy gold?', ex3: 'Has Bitcoin bottomed?', ex4: 'Is institutional money buying or selling 600519?', ex5: 'Is NVDA options premium too high?',
  credit: 'Powered by komako-workshop/digital-oracle (MIT)',
  temp: 'Market temperature', updated: 'updated {0}', never: 'no data yet', refreshNow: 'Refresh', refreshing: 'Fetching…', cooldown: 'Just refreshed, try again shortly',
  panels: 'Five questions', ask: 'Ask the oracle', askPlaceholder: 'Add your specific question (optional)', signalsNone: 'no cached signals',
  watch: 'Watchlist', positions: 'Positions', reports: 'Reports', add: 'Add', remove: 'Remove', kind: 'Kind', symbol: 'Symbol', label: 'Name', qty: 'Qty', cost: 'Cost', pnl: 'P&L', value: 'Value', last: 'Last', day: '1d', d30: '30d',
  posHint: 'Pick a watchlist item, enter quantity and cost. Positions only feed the P&L and the analysis context; nothing here places orders.', noPos: 'No positions yet.', noWatch: 'Watchlist is empty.', noReports: 'No reports yet.',
  openSession: 'Open conversation', prob: 'Probability', horizon: 'Horizon', sources: 'Sources', chooseWatch: 'choose a watchlist item', errors: 'Fetch errors',
  noWatchHint: 'Pick a kind and type a symbol below; the price shows up within seconds.', noReportsHint: 'Press "Ask the oracle" on any question; the model saves its report here.', signalsNoneHint: 'The data sources have not answered yet. Wait a minute or press refresh.', panelsHint: '"Ask the oracle" starts a conversation carrying the current numbers, your watchlist and positions',
}

const CSS = `
.mwo{font-size:13px;color:var(--dsw-alias-label-primary);max-width:720px}
.mwo h3{margin:0 0 6px;font-size:15px;display:flex;align-items:center;gap:8px}
.mwo .intro{color:var(--dsw-alias-label-secondary);line-height:1.65;margin-bottom:14px}
.mwo .card{border:0.5px solid var(--dsw-alias-border-l2);border-radius:12px;padding:12px 14px;margin-bottom:14px;background:var(--dsw-alias-bg-layer-1)}
.mwo .card h4{margin:0 0 8px;font-size:13px;color:var(--dsw-alias-label-secondary);font-weight:600}
.mwo table{border-collapse:collapse;width:100%}
.mwo td{padding:4px 0;vertical-align:top}
.mwo td:first-child{color:var(--dsw-alias-label-secondary);width:46%}
.mwo .ok{color:var(--dsw-alias-state-success-primary)}
.mwo .bad{color:var(--dsw-alias-state-error-primary)}
.mwo .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px}
.mwo .btn{border:0;border-radius:8px;background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary));color:var(--dsw-alias-label-primary-inverted,#fff);padding:6px 14px;cursor:pointer;font:inherit;font-weight:600;display:inline-flex;gap:6px;align-items:center}
.mwo .btn:disabled{opacity:.5;cursor:default}
.mwo .mini{border:0.5px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary);border-radius:8px;padding:5px 10px;cursor:pointer;font:inherit;font-size:12px}
.mwo pre{margin:8px 0 0;white-space:pre-wrap;word-break:break-word;font-size:12px;background:var(--dsw-alias-bg-layer-2);border-radius:8px;padding:8px 10px;max-height:220px;overflow:auto}
.mwo ul{margin:0;padding-left:18px;line-height:1.7;color:var(--dsw-alias-label-secondary)}
.mwo .credit{font-size:12px;color:var(--dsw-alias-label-tertiary)}
/* ---- cockpit (VISUAL_DENSITY 8: no card boxes, 1px lines separate data, every number monospace) ---- */
.mwc{--mwc-r:var(--mwc-radius,6px);--mwc-line:var(--dsw-alias-border-l2);--mwc-line-soft:var(--dsw-alias-border-l1,var(--dsw-alias-border-l2));--mwc-mono:var(--dsw-font-mono,ui-monospace,"JetBrains Mono",Menlo,monospace);font-size:13px;color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;gap:30px;padding-bottom:36px;max-width:1400px}
.mwc .num{font-family:var(--mwc-mono);font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.mwc h4{margin:0;font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);display:flex;align-items:center;gap:8px}
.mwc .head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-bottom:10px;border-bottom:1px solid var(--mwc-line)}
.mwc .meta{font-size:12px;color:var(--dsw-alias-label-tertiary);display:inline-flex;gap:10px;align-items:center}
.mwc .btn,.mwc .mini{font:inherit;cursor:pointer;display:inline-flex;gap:6px;align-items:center;white-space:nowrap;border-radius:var(--mwc-r);transition:transform .12s ease,background-color .12s ease,border-color .12s ease}
.mwc .btn{border:0;background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary));color:var(--dsw-alias-label-primary-inverted,#fff);padding:6px 12px;font-weight:600}
.mwc .mini{border:1px solid var(--mwc-line);background:transparent;color:var(--dsw-alias-label-secondary);padding:4px 10px;font-size:12px;min-height:26px}
.mwc .mini:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3,var(--mwc-line))}
.mwc .mini.danger:hover{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}
.mwc .btn:active,.mwc .mini:active{transform:translateY(1px)}
.mwc .btn:disabled,.mwc .mini:disabled{opacity:.5;cursor:default;transform:none}
.mwc .btn:focus-visible,.mwc .mini:focus-visible,.mwc input:focus-visible,.mwc select:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.mwc input,.mwc select{background:transparent;border:1px solid var(--mwc-line);border-radius:var(--mwc-r);color:inherit;font:inherit;font-size:12.5px;padding:5px 9px;min-width:0}
.mwc input::placeholder{color:var(--dsw-alias-label-tertiary)}
.mwc .up{color:var(--dsw-alias-state-success-primary)}.mwc .down{color:var(--dsw-alias-state-error-primary)}
/* market temperature: a hairline grid; the last row always stretches to the edge, so there is never an empty cell */
.mwc .grid{display:flex;flex-wrap:wrap;gap:1px;background:var(--mwc-line);border:1px solid var(--mwc-line);border-radius:var(--mwc-r);overflow:hidden}
.mwc .cell{flex:1 1 200px;background:var(--dsw-alias-bg-base);padding:12px 14px 11px;min-height:108px;display:flex;flex-direction:column;gap:5px;position:relative;box-sizing:border-box}
.mwc .cell.lead{flex:2 1 400px}
.mwc .cell .lb{font-size:12px;color:var(--dsw-alias-label-secondary);display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.mwc .cell .v{font-size:22px;font-weight:500;line-height:1.1;display:flex;align-items:baseline;gap:6px;flex-wrap:wrap}
.mwc .cell.lead .v{font-size:30px}
.mwc .cell .v.txt{font-size:15px;font-family:inherit;font-weight:600}
.mwc .cell .v small{font-size:12px;font-weight:500;color:var(--dsw-alias-label-secondary);font-family:inherit}
.mwc .cell .d{font-size:12px}
.mwc .cell .m{font-size:11.5px;line-height:1.45;color:var(--dsw-alias-label-tertiary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:auto}
.mwc .cell:hover .m{-webkit-line-clamp:unset}
.mwc .cell svg.spark{position:absolute;right:14px;top:36px}
.mwc .cell.lead svg.spark{right:16px;top:30px}
/* skeleton (loading) */
.mwc .sk{background:var(--dsw-alias-bg-layer-2);border-radius:4px;height:12px}
.mwc .sk.w{width:60%}.mwc .sk.v{height:24px;width:45%;margin:4px 0}
@media (prefers-reduced-motion:no-preference){.mwc .sk{background:linear-gradient(90deg,var(--dsw-alias-bg-layer-2) 25%,var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-layer-2)) 50%,var(--dsw-alias-bg-layer-2) 75%);background-size:200% 100%;animation:mwc-sk 1.4s ease infinite}}
@keyframes mwc-sk{from{background-position:200% 0}to{background-position:-200% 0}}
/* five questions: rows, not cards */
.mwc .rows{border-top:1px solid var(--mwc-line)}
.mwc .prow{display:grid;grid-template-columns:minmax(200px,1fr) minmax(220px,1.3fr) minmax(280px,1.1fr);gap:28px;padding:16px 0;border-bottom:1px solid var(--mwc-line);align-items:start}
.mwc .prow .title{font-weight:600;font-size:14px;margin-bottom:4px}
.mwc .prow .q{font-size:12.5px;line-height:1.55;color:var(--dsw-alias-label-secondary);max-width:46ch}
.mwc .sig{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:1fr auto;column-gap:14px;row-gap:3px;font-size:12px}
.mwc .sig li{display:contents}
.mwc .sig li span:first-child{color:var(--dsw-alias-label-secondary)}
.mwc .sig li span:last-child{text-align:right;white-space:nowrap}
.mwc .askrow{display:flex;gap:8px;align-items:center}
.mwc .askrow input{flex:1}
.mwc .askhint{font-size:12px;color:var(--dsw-alias-label-tertiary);margin-top:6px}
@media (max-width:980px){.mwc .prow{grid-template-columns:1fr;gap:12px}}
/* watchlist + positions */
.mwc .two{display:grid;grid-template-columns:1fr 1fr;gap:36px}
@media (max-width:1100px){.mwc .two{grid-template-columns:1fr}}
.mwc table{border-collapse:collapse;width:100%;font-size:12.5px}
.mwc th{text-align:left;font-weight:500;font-size:11.5px;color:var(--dsw-alias-label-tertiary);padding:8px 8px 6px 0}
.mwc td{padding:7px 8px 7px 0;border-top:1px solid var(--mwc-line-soft);vertical-align:middle}
.mwc td.num,.mwc th.num{text-align:right}
.mwc td .sub{display:block;font-size:11px;color:var(--dsw-alias-label-tertiary);margin-top:1px}
.mwc .form{display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding-top:12px;border-top:1px solid var(--mwc-line)}
.mwc .form input.sym{width:150px}.mwc .form input.lbl{width:110px}.mwc .form input.n{width:96px}
.mwc .hint{font-size:12px;color:var(--dsw-alias-label-tertiary);line-height:1.6}
.mwc .empty{padding:18px 0 14px;color:var(--dsw-alias-label-secondary);font-size:12.5px;line-height:1.6;max-width:56ch}
.mwc .empty strong{display:block;color:var(--dsw-alias-label-primary);font-weight:600;margin-bottom:2px}
.mwc .err{color:var(--dsw-alias-state-error-primary);font-size:12px;white-space:pre-wrap;margin-top:6px}
.mwc .tot{font-size:12px;color:var(--dsw-alias-label-secondary)}
/* reports: rows with the probability as the lead figure */
.mwc .rrow{display:grid;grid-template-columns:104px 1fr auto;gap:18px;padding:14px 0;border-bottom:1px solid var(--mwc-line);cursor:pointer;align-items:start}
.mwc .rrow .p{font-size:26px;font-weight:500;line-height:1}
.mwc .rrow .p small{display:block;font-size:11px;color:var(--dsw-alias-label-tertiary);font-family:inherit;margin-top:4px}
.mwc .rrow .t{font-weight:600;margin-bottom:3px}
.mwc .rrow .s{font-size:12.5px;line-height:1.55;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.mwc .rrow[data-open=true] .s{-webkit-line-clamp:unset}
.mwc .rrow .sigs{margin:8px 0 0;padding-left:16px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.mwc .rrow .side{display:flex;flex-direction:column;align-items:flex-end;gap:8px;font-size:11.5px;color:var(--dsw-alias-label-tertiary);white-space:nowrap}
.mwc .tag{border-radius:var(--mwc-r);padding:1px 7px;font-size:11px;border:1px solid var(--mwc-line);color:var(--dsw-alias-label-secondary)}
@media (max-width:720px){.mwc .rrow{grid-template-columns:1fr}.mwc .rrow .side{align-items:flex-start}}
.mwc .foot{font-size:12px;color:var(--dsw-alias-label-tertiary)}
`
async function api(path, body) {
  const res = await fetch(API + path, body === undefined ? { method: 'GET' } : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data && data.error ? data.error : 'HTTP ' + res.status)
  return data
}

exports.name = PLUGIN
exports.inject = ['slots', 'locale']
exports.apply = function apply(ctx) {
  ctx.effect(() => { const el = document.createElement('style'); el.setAttribute('data-plugin', PLUGIN); el.textContent = CSS; document.head.appendChild(el); return () => el.remove() }, `${PLUGIN}: stylesheet`)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), `${PLUGIN}: dictionaries`)
  const t = ctx.locale.bind(NS)
  const h = React.createElement

  function Tab() {
    const [st, setSt] = React.useState(null)
    const [busy, setBusy] = React.useState('')
    const [out, setOut] = React.useState(null)
    const load = React.useCallback(() => api('/status').then(setSt).catch((e) => setSt({ ok: false, pythonError: String(e.message || e) })), [])
    React.useEffect(() => { load() }, [load])
    const run = async (kind) => {
      setBusy(kind); setOut(null)
      try { const r = await api(kind === 'check' ? '/selfcheck' : '/install-yfinance', {}); setOut(r); load() } catch (e) { setOut({ error: String(e.message || e) }) } finally { setBusy('') }
    }
    const state = (ok, label) => h('span', { className: ok ? 'ok' : 'bad' }, label)
    return h('div', { className: 'mwo' },
      h('h3', null, icon('trending-up', { size: 16 }), t('title')),
      h('div', { className: 'intro' }, t('intro')),
      h('div', { className: 'card' }, h('h4', null, t('env')),
        st === null ? h('div', null, '…') : h('table', null, h('tbody', null,
          h('tr', null, h('td', null, t('python')), h('td', null, st.pythonVersion ? state(true, `${st.pythonVersion} · ${st.pythonCmd}`) : state(false, st.pythonError || t('bad')))),
          h('tr', null, h('td', null, t('yfinance')), h('td', null, st.yfinance ? state(true, t('ok')) : state(false, t('missing')))),
          h('tr', null, h('td', null, t('providers')), h('td', null, Array.isArray(st.providers) ? String(st.providers.length) : state(false, st.runnerError || t('bad')))),
          h('tr', null, h('td', null, t('version')), h('td', null, st.version || '-')))),
        h('div', { className: 'row' },
          h('button', { className: 'btn', disabled: !!busy || !(st && st.ok), onClick: () => run('check') }, icon('activity', { size: 13 }), busy === 'check' ? t('checking') : t('selfcheck')),
          st && st.ok && !st.yfinance ? h('button', { className: 'mini', disabled: !!busy, onClick: () => run('install') }, busy === 'install' ? t('installing') : t('install')) : null,
          h('button', { className: 'mini', disabled: !!busy, onClick: load }, t('refresh'))),
        out ? h('pre', null, out.error ? out.error : [
          `${t('result')}: ${out.ok ? 'OK' : 'FAIL'}${out.ms ? ` · ${out.ms} ms` : ''}`,
          out.summary ? JSON.stringify(out.summary) : '',
          out.errors && Object.keys(out.errors).length ? `${t('errors')}: ${JSON.stringify(out.errors)}` : '',
          out.command ? `$ ${out.command}\n${out.output || ''}` : '',
        ].filter(Boolean).join('\n')) : null),
      h('div', { className: 'card' }, h('h4', null, t('examples')), h('ul', null, ['ex1', 'ex2', 'ex3', 'ex4', 'ex5'].map((k) => h('li', { key: k }, t(k))))),
      h('div', { className: 'credit' }, t('credit')),
    )
  }
  ctx.slots.inject(TAB_SLOT, () => ctx.slots.register({ name: TAB_SLOT, id: 'oracle', order: 60, label: () => t('nav') }, function MyworkOracleTab() { return h(Tab) }))

  // ---- cockpit page (slot provided by dsh-mywork-codex-ui's 市场先知 sidebar page) ----
  const fmtNum = (v, d) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? '-' : Number(v).toLocaleString(undefined, { maximumFractionDigits: d === undefined ? (Math.abs(v) >= 1000 ? 0 : Math.abs(v) >= 10 ? 2 : 4) : d }))
  const sign = (v, d = 2) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? '' : (v > 0 ? '+' : '') + Number(v).toFixed(d))
  const cls = (v) => (v === null || v === undefined || !Number.isFinite(Number(v)) || v === 0 ? '' : v > 0 ? 'up' : 'down')
  const ago = (ms) => { if (!ms) return t('never'); const m = Math.round((Date.now() - ms) / 60000); return t('updated').replace('{0}', m < 1 ? '<1 min' : m < 60 ? m + ' min' : Math.round(m / 60) + ' h') }
  const dash = '-' // the only dash on the page: "no value"
  function Spark({ data, w = 72, hgt = 26 }) {
    if (!Array.isArray(data) || data.length < 2) return null
    const min = Math.min(...data); const max = Math.max(...data); const span = max - min || 1
    const pts = data.map((v, i) => `${(i / (data.length - 1) * w).toFixed(1)},${(hgt - (v - min) / span * (hgt - 2) - 1).toFixed(1)}`).join(' ')
    const upv = data[data.length - 1] >= data[0]
    return h('svg', { className: 'spark', width: w, height: hgt, viewBox: `0 0 ${w} ${hgt}`, 'aria-hidden': true }, h('polyline', { points: pts, fill: 'none', stroke: upv ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-state-error-primary)', strokeWidth: 1.5, strokeLinejoin: 'round', strokeLinecap: 'round' }))
  }
  const deltaText = (tile) => {
    if (tile.delta === undefined || tile.delta === null) return null
    const pctLike = tile.deltaLabel && tile.deltaLabel.includes('%')
    const digits = pctLike ? 1 : 0
    return `${sign(tile.delta, digits)}${pctLike ? '%' : ''} ${tile.deltaLabel ? tile.deltaLabel.replace('%', '') : ''}`.trim()
  }
  function Tile({ tile, spark, lead }) {
    const numeric = typeof tile.value === 'number'
    const d = deltaText(tile)
    return h('div', { className: 'cell' + (lead ? ' lead' : ''), title: `${tile.source}${tile.asOf ? ' ' + String(tile.asOf).slice(0, 10) : ''}` },
      h('div', { className: 'lb' }, h('span', null, tile.label), d ? h('span', { className: 'd num ' + cls(tile.delta) }, d) : null),
      h('div', { className: 'v' + (numeric ? ' num' : ' txt') }, numeric ? fmtNum(tile.value) : String(tile.value), numeric && tile.unit ? h('small', null, tile.unit) : null),
      h('div', { className: 'm' }, tile.meaning),
      spark ? h(Spark, { data: spark, w: lead ? 120 : 72, hgt: lead ? 34 : 26 }) : null)
  }
  function Skeleton() {
    return h('div', { className: 'grid', 'aria-busy': true }, Array.from({ length: 8 }, (_, i) => h('div', { key: i, className: 'cell' + (i < 2 ? ' lead' : '') }, h('div', { className: 'sk w' }), h('div', { className: 'sk v' }), h('div', { className: 'sk' }))))
  }
  const askOracle = async (id, question) => {
    const r = await api('/panels/prompt', { id, question })
    window.dispatchEvent(new CustomEvent('mywork:new-conversation', { detail: { text: r.text } }))
  }
  function PanelRow({ panel, tiles }) {
    const [q, setQ] = React.useState(''); const [busy, setBusy] = React.useState(false); const [err, setErr] = React.useState('')
    const rows = panel.tiles.map((id) => tiles.find((x) => x.id === id)).filter(Boolean)
    const ask = async () => { setBusy(true); setErr(''); try { await askOracle(panel.id, q) } catch (e) { setErr(String(e.message || e)) } finally { setBusy(false) } }
    return h('div', { className: 'prow' },
      h('div', null, h('div', { className: 'title' }, panel.label), h('div', { className: 'q' }, panel.question)),
      rows.length ? h('ul', { className: 'sig' }, rows.map((x) => h('li', { key: x.id }, h('span', null, x.label), h('span', { className: 'num' }, typeof x.value === 'number' ? fmtNum(x.value) + (x.unit || '') : String(x.value).slice(0, 14), x.delta !== undefined && x.delta !== null ? h('span', { className: cls(x.delta), style: { marginLeft: 8 } }, deltaText(x)) : null)))) : h('div', { className: 'hint' }, t('signalsNone')),
      h('div', null,
        h('div', { className: 'askrow' },
          h('input', { value: q, placeholder: t('askPlaceholder'), 'aria-label': `${panel.label} ${t('askPlaceholder')}`, onChange: (e) => setQ(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') ask() } }),
          h('button', { className: 'btn', disabled: busy, onClick: ask }, t('ask'))),
        err ? h('div', { className: 'err' }, err) : null))
  }
  function Watchlist({ d, onChange }) {
    const kinds = d.kinds || {}
    const [kind, setKind] = React.useState('stooq'); const [sym, setSym] = React.useState(''); const [lbl, setLbl] = React.useState(''); const [err, setErr] = React.useState(''); const [busy, setBusy] = React.useState(false)
    const add = async () => { setBusy(true); setErr(''); try { const r = await api('/watchlist', { kind, symbol: sym, label: lbl }); setSym(''); setLbl(''); onChange(r) } catch (e) { setErr(String(e.message || e)) } finally { setBusy(false) } }
    const del = async (id) => { setErr(''); try { onChange(await api('/watchlist/remove', { id })) } catch (e) { setErr(String(e.message || e)) } }
    return h('div', null,
      h('div', { className: 'head' }, h('h4', null, t('watch')), h('span', { className: 'meta' }, d.quotesAt ? ago(Date.parse(d.quotesAt)) : t('never'))),
      d.watchlist.length === 0 ? h('div', { className: 'empty' }, h('strong', null, t('noWatch')), t('noWatchHint')) : h('table', null,
        h('thead', null, h('tr', null, h('th', null, t('label')), h('th', { className: 'num' }, t('last')), h('th', { className: 'num' }, t('day')), h('th', { className: 'num' }, t('d30')), h('th', null, ''), h('th', null, ''))),
        h('tbody', null, d.watchlist.map((w) => { const q = d.quotes[w.id] || {}; return h('tr', { key: w.id },
          h('td', null, w.label, h('span', { className: 'sub' }, `${w.kindLabel || w.kind}  ${w.symbol}${q.name && q.name !== w.label && q.name !== w.symbol ? '  ' + q.name : ''}`)),
          h('td', { className: 'num' }, q.error ? h('span', { className: 'down', title: q.error }, '!') : fmtNum(q.last), q.currency === '概率' && q.last !== null && q.last !== undefined ? '%' : ''),
          h('td', { className: 'num ' + cls(q.changePct) }, q.changePct === null || q.changePct === undefined ? dash : sign(q.changePct) + '%'),
          h('td', { className: 'num ' + cls(q.change30Pct) }, q.change30Pct === null || q.change30Pct === undefined ? dash : sign(q.change30Pct) + '%'),
          h('td', null, h(Spark, { data: q.spark, w: 56, hgt: 18 })),
          h('td', { className: 'num' }, h('button', { className: 'mini danger', 'aria-label': t('remove') + ' ' + w.label, onClick: () => del(w.id) }, icon('x', { size: 12 })))) }))),
      h('div', { className: 'form' },
        h('select', { 'aria-label': t('kind'), value: kind, onChange: (e) => setKind(e.target.value) }, Object.entries(kinds).map(([k, v]) => h('option', { key: k, value: k }, v.label))),
        h('input', { className: 'sym', value: sym, placeholder: (kinds[kind] || {}).hint || t('symbol'), 'aria-label': t('symbol'), onChange: (e) => setSym(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') add() } }),
        h('input', { className: 'lbl', value: lbl, placeholder: t('label'), 'aria-label': t('label'), onChange: (e) => setLbl(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') add() } }),
        h('button', { className: 'mini', disabled: busy || !sym.trim(), onClick: add }, icon('plus', { size: 12 }), t('add'))),
      err ? h('div', { className: 'err' }, err) : null)
  }
  function Positions({ d, onChange }) {
    const [watchId, setWatchId] = React.useState(''); const [qty, setQty] = React.useState(''); const [cost, setCost] = React.useState(''); const [err, setErr] = React.useState(''); const [busy, setBusy] = React.useState(false)
    const add = async () => { setBusy(true); setErr(''); try { onChange(await api('/positions', { watchId, qty, cost })); setQty(''); setCost('') } catch (e) { setErr(String(e.message || e)) } finally { setBusy(false) } }
    const del = async (id) => { setErr(''); try { onChange(await api('/positions/remove', { id })) } catch (e) { setErr(String(e.message || e)) } }
    const total = d.positions.reduce((a, p) => { if (p.value !== null && p.pnl !== null) { a[p.currency] = a[p.currency] || { value: 0, pnl: 0 }; a[p.currency].value += p.value; a[p.currency].pnl += p.pnl } return a }, {})
    return h('div', null,
      h('div', { className: 'head' }, h('h4', null, t('positions')), h('span', { className: 'meta num' }, Object.entries(total).map(([c, v]) => h('span', { key: c, className: cls(v.pnl) }, `${c} ${fmtNum(v.value, 0)} (${sign(v.pnl, 0)})`)))),
      d.positions.length === 0 ? h('div', { className: 'empty' }, h('strong', null, t('noPos')), t('posHint')) : h('table', null,
        h('thead', null, h('tr', null, h('th', null, t('label')), h('th', { className: 'num' }, t('qty')), h('th', { className: 'num' }, t('cost')), h('th', { className: 'num' }, t('last')), h('th', { className: 'num' }, t('value')), h('th', { className: 'num' }, t('pnl')), h('th', null, ''))),
        h('tbody', null, d.positions.map((p) => h('tr', { key: p.id },
          h('td', null, p.label, h('span', { className: 'sub' }, `${p.symbol}  ${p.currency}`)),
          h('td', { className: 'num' }, fmtNum(p.qty)), h('td', { className: 'num' }, fmtNum(p.cost)), h('td', { className: 'num' }, fmtNum(p.last)), h('td', { className: 'num' }, fmtNum(p.value, 0)),
          h('td', { className: 'num ' + cls(p.pnl) }, p.pnl === null ? dash : `${sign(p.pnl, 0)} (${sign(p.pnlPct)}%)`),
          h('td', { className: 'num' }, h('button', { className: 'mini danger', 'aria-label': t('remove') + ' ' + p.label, onClick: () => del(p.id) }, icon('x', { size: 12 }))))))),
      h('div', { className: 'form' },
        h('select', { 'aria-label': t('chooseWatch'), value: watchId, onChange: (e) => setWatchId(e.target.value) }, h('option', { value: '' }, t('chooseWatch')), d.watchlist.map((w) => h('option', { key: w.id, value: w.id }, `${w.label}  ${w.symbol}`))),
        h('input', { className: 'n', type: 'number', min: 0, step: 'any', value: qty, placeholder: t('qty'), 'aria-label': t('qty'), onChange: (e) => setQty(e.target.value) }),
        h('input', { className: 'n', type: 'number', min: 0, step: 'any', value: cost, placeholder: t('cost'), 'aria-label': t('cost'), onChange: (e) => setCost(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') add() } }),
        h('button', { className: 'mini', disabled: busy || !watchId || !qty || cost === '', onClick: add }, icon('plus', { size: 12 }), t('add'))),
      d.positions.length ? h('div', { className: 'hint', style: { marginTop: 8 } }, t('posHint')) : null,
      err ? h('div', { className: 'err' }, err) : null)
  }
  function Reports({ d, onChange }) {
    const [open, setOpen] = React.useState('')
    const labelOf = (topic) => (d.panels.find((p) => p.id === topic) || {}).label || topic
    const del = async (id) => { try { const r = await api('/reports/remove', { id }); onChange({ reports: r.reports }) } catch { /* ignore */ } }
    return h('div', null,
      h('div', { className: 'head' }, h('h4', null, t('reports')), d.reports.length ? h('span', { className: 'meta num' }, String(d.reports.length)) : null),
      d.reports.length === 0 ? h('div', { className: 'empty' }, h('strong', null, t('noReports')), t('noReportsHint')) : d.reports.map((r) => h('div', { key: r.id, className: 'rrow', 'data-open': open === r.id, onClick: () => setOpen(open === r.id ? '' : r.id) },
        h('div', { className: 'p num' }, r.probability !== null && r.probability !== undefined ? `${r.probability}%` : dash, h('small', null, r.horizon || t('prob'))),
        h('div', null, h('div', { className: 't' }, r.title), h('div', { className: 's' }, r.summary), open === r.id && r.signals && r.signals.length ? h('ul', { className: 'sigs' }, r.signals.map((s, i) => h('li', { key: i }, `${s.name}：${s.value}，${s.meaning}`))) : null),
        h('div', { className: 'side' }, h('span', null, h('span', { className: 'tag' }, labelOf(r.topic)), ' ', new Date(r.at).toLocaleDateString()),
          h('span', { style: { display: 'inline-flex', gap: 6 } }, r.sessionId ? h('button', { className: 'mini', onClick: (e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('mywork:open-session', { detail: { id: r.sessionId } })) } }, t('openSession')) : null,
            h('button', { className: 'mini danger', 'aria-label': t('remove'), onClick: (e) => { e.stopPropagation(); del(r.id) } }, icon('x', { size: 12 })))))))
  }
  function Cockpit() {
    const [d, setD] = React.useState(null); const [busy, setBusy] = React.useState(false); const [note, setNote] = React.useState(''); const [loadErr, setLoadErr] = React.useState('')
    const merge = React.useCallback((patch) => setD((cur) => ({ ...(cur || {}), ...patch })), [])
    const load = React.useCallback(() => api('/dashboard').then((x) => { setD(x); setLoadErr('') }).catch((e) => setLoadErr(String(e.message || e))), [])
    React.useEffect(() => { load(); const id = setInterval(load, 60000); return () => clearInterval(id) }, [load])
    const refresh = async () => { setBusy(true); setNote(''); try { const r = await api('/dashboard/refresh', {}); setD(r); if (r.cooldown) setNote(t('cooldown')) } catch (e) { setNote(String(e.message || e)) } finally { setBusy(false) } }
    if (!d) return h('div', { className: 'mwc' }, h('section', null, h('div', { className: 'head' }, h('h4', null, t('temp')), h('span', { className: 'meta' }, loadErr ? h('span', { className: 'down' }, loadErr) : t('refreshing'))), h(Skeleton)))
    const tiles = (d.signals && d.signals.tiles) || []; const sparks = (d.signals && d.signals.sparks) || {}
    const errs = d.signals && d.signals.errors ? Object.entries(d.signals.errors) : []
    const leads = new Set(['fg', 'gold'])
    return h('div', { className: 'mwc' },
      h('section', null,
        h('div', { className: 'head' }, h('h4', null, t('temp')), h('span', { className: 'meta' }, d.refreshing ? t('refreshing') : ago(d.lastRefresh), h('button', { className: 'mini', disabled: busy || d.refreshing, onClick: refresh }, icon('refresh-cw', { size: 12 }), t('refreshNow')))),
        tiles.length ? h('div', { className: 'grid' }, tiles.map((x) => h(Tile, { key: x.id, tile: x, spark: sparks[x.id], lead: leads.has(x.id) }))) : (d.refreshing ? h(Skeleton) : h('div', { className: 'empty' }, h('strong', null, t('signalsNone')), t('signalsNoneHint'))),
        note ? h('div', { className: 'hint', style: { marginTop: 8 } }, note) : null,
        errs.length ? h('div', { className: 'err' }, t('errors') + ': ' + errs.map(([k, v]) => `${k}: ${String(v).slice(0, 80)}`).join('; ')) : null),
      h('section', null, h('div', { className: 'head' }, h('h4', null, t('panels')), h('span', { className: 'meta' }, t('panelsHint'))), h('div', { className: 'rows' }, d.panels.map((p) => h(PanelRow, { key: p.id, panel: p, tiles })))),
      h('section', { className: 'two' }, h(Watchlist, { d, onChange: merge }), h(Positions, { d, onChange: merge })),
      h('section', null, h(Reports, { d, onChange: merge })),
      h('div', { className: 'foot' }, t('credit')))
  }
  ctx.slots.inject(PAGE_SLOT, () => ctx.slots.register({ name: PAGE_SLOT, id: PLUGIN, order: 10 }, function MyworkOracleCockpit() { return h(Cockpit) }))
}
