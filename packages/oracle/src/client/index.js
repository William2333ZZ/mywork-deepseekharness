/**
 * dsh-mywork-oracle — browser half: the "市场先知" tab in 设置 → MyWork (slot `mywork.settings.tab`).
 * Shows the Python / yfinance state, runs a live self-check and installs yfinance on request.
 */
'use strict'
const React = require('react')
const { icon } = require('./client-icons.cjs')
const PLUGIN = 'dsh-mywork-oracle'
const NS = 'mywork.oracle'
const API = '/mywork-oracle/api'
const TAB_SLOT = 'mywork.settings.tab'

const zh = {
  nav: '市场先知', title: 'Digital Oracle · 市场数据先知',
  intro: '用市场交易数据（预测市场、期权、国债曲线、机构持仓、内部人交易、加密衍生品、A 股资金流）回答「这件事概率多大」「现在值不值得买」。模型在对话里自动使用 oracle_* 工具；新建对话页有「市场先知」起点。只做分析，不下单。',
  env: '运行环境', python: 'Python', yfinance: 'yfinance（美股价格历史 / 期权链）', providers: '数据源', version: '内置版本', ok: '可用', missing: '未安装', bad: '不可用',
  selfcheck: '自检（联网拉三组数据）', checking: '检查中…', install: '安装 yfinance', installing: '安装中…（1–3 分钟）',
  result: '结果', errors: '失败的数据源', refresh: '刷新',
  examples: '可以问的问题', ex1: 'WW3 的概率是多少？', ex2: '现在适合买黄金吗？', ex3: '比特币到底了吗？', ex4: '600519 主力资金最近在买还是卖？', ex5: 'NVDA 期权溢价是不是太高了？',
  credit: '基于 komako-workshop/digital-oracle（MIT）',
}
const en = {
  nav: 'Market oracle', title: 'Digital Oracle · market-data oracle',
  intro: 'Answers "how likely is X" and "is Y worth buying now" from trading data only: prediction markets, options, yield curves, CFTC positioning, insider filings, crypto derivatives, A-share fund flow. The model uses the oracle_* tools by itself; the new-conversation page has a "Market oracle" starting point. Analysis only, no orders.',
  env: 'Environment', python: 'Python', yfinance: 'yfinance (US price history / options chains)', providers: 'Data sources', version: 'Bundled version', ok: 'ready', missing: 'not installed', bad: 'unavailable',
  selfcheck: 'Self-check (fetches three live signals)', checking: 'Checking…', install: 'Install yfinance', installing: 'Installing… (1–3 min)',
  result: 'Result', errors: 'Failed sources', refresh: 'Refresh',
  examples: 'Questions to try', ex1: 'What is the probability of WW3?', ex2: 'Is it a good time to buy gold?', ex3: 'Has Bitcoin bottomed?', ex4: 'Is institutional money buying or selling 600519?', ex5: 'Is NVDA options premium too high?',
  credit: 'Powered by komako-workshop/digital-oracle (MIT)',
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
          h('tr', null, h('td', null, t('version')), h('td', null, st.version || '—')))),
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
}
