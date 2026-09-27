/**
 * dsh-mywork-oracle — host half: Digital Oracle (komako-workshop/digital-oracle, MIT) as dsh tools.
 *
 * Digital Oracle answers "what is the probability of X / is Y worth buying" from market trading
 * data only (prediction markets, options, yield curves, CFTC positioning, insider filings, crypto
 * derivatives, A-share fund flow). The upstream project is vendored as a git subtree in
 * ../digital-oracle and driven through src/runner.py with the system Python (3.9+, stdlib only;
 * `yfinance` is optional for US price history and options chains).
 *
 *   • tools: oracle_docs (methodology / API / symbols), oracle_providers (introspection),
 *            oracle_fetch (parallel provider calls), oracle_status
 *   • system prompt section so the model reaches for market data on probability questions
 *   • HTTP: /mywork-oracle/api/status | describe | selfcheck | install-yfinance (loopback)
 *
 * Analysis only: nothing here places orders or touches an exchange account.
 */
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { configSchema, defineRawTool, rejectUntrusted } from './harness.js'

export const name = 'dsh-mywork-oracle'
export const inject = ['tools']

/**
 * Config (all optional):
 *   tools:      register the oracle_* tools (default true)
 *   promptHint: add the system prompt section (default true)
 *   python:     interpreter to use (default: MYWORK_ORACLE_PYTHON, then python3 / python on PATH)
 *   timeoutMs:  per oracle_fetch batch (default 120000)
 *   maxChars:   result budget handed back to the model per batch (default 80000)
 */
export const Config = configSchema({ tools: true, promptHint: true, python: '', timeoutMs: 120000, maxChars: 80000 })

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG = dirname(HERE)
const VENDOR = join(PKG, 'digital-oracle')
const RUNNER = join(HERE, 'runner.py')
const DOCS = {
  skill: join(VENDOR, 'SKILL.md'),
  providers: join(VENDOR, 'references', 'providers.md'),
  symbols: join(VENDOR, 'references', 'symbols.md'),
  readme: join(VENDOR, 'README.md'),
}

function exec(cmd, args, { input, timeoutMs = 30000, cwd } = {}) {
  return new Promise((resolve) => {
    let child
    try { child = spawn(cmd, args, { cwd, env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' }, stdio: ['pipe', 'pipe', 'pipe'] }) } catch (e) { return resolve({ code: -1, stdout: '', stderr: String(e && e.message || e) }) }
    let stdout = ''; let stderr = ''; let done = false
    const timer = setTimeout(() => { if (!done) { try { child.kill('SIGKILL') } catch { /* ignore */ } stderr += `\n[timeout after ${timeoutMs} ms]` } }, timeoutMs)
    child.stdout.on('data', (c) => { stdout += c })
    child.stderr.on('data', (c) => { if (stderr.length < 20000) stderr += c })
    child.on('error', (e) => { if (!done) { done = true; clearTimeout(timer); resolve({ code: -1, stdout, stderr: stderr + String(e && e.message || e) }) } })
    child.on('close', (code) => { if (!done) { done = true; clearTimeout(timer); resolve({ code, stdout, stderr }) } })
    if (input !== undefined) { child.stdin.on('error', () => {}); child.stdin.end(input) }
    else child.stdin.end()
  })
}

/** Keep the model's view of a result under `budget` characters by trimming long arrays first. */
export function shrink(value, budget) {
  const size = (v) => JSON.stringify(v).length
  if (size(value) <= budget) return { value, truncated: false }
  const cut = (v, cap, scap) => {
    if (Array.isArray(v)) { const out = v.slice(0, cap).map((x) => cut(x, cap, scap)); if (v.length > cap) out.push({ _truncated: `${v.length - cap} more item(s) omitted; narrow the query (limit / dates)` }); return out }
    if (v && typeof v === 'object') { const o = {}; for (const [k, x] of Object.entries(v)) o[k] = cut(x, cap, scap); return o }
    if (typeof v === 'string' && v.length > scap) return v.slice(0, scap) + `…[${v.length - scap} more chars]`
    return v
  }
  // Long arrays go first (fewer items), then long prose (descriptions, rules text); the structure survives.
  for (const [cap, scap] of [[200, 4000], [100, 2000], [50, 1000], [25, 600], [12, 400], [6, 300], [3, 200], [3, 120], [2, 80]]) {
    const v = cut(value, cap, scap)
    if (size(v) <= budget) return { value: v, truncated: true }
  }
  return { value: JSON.stringify(cut(value, 2, 80)).slice(0, budget) + '…', truncated: true }
}

export function apply(ctx, config = {}) {
  const log = (m) => console.log('[dsh-mywork-oracle] ' + m)
  const warn = (m) => console.warn('[dsh-mywork-oracle] ' + m)
  const timeoutMs = Number(config.timeoutMs) || 120000
  const maxChars = Number(config.maxChars) || 80000
  let python = null // { cmd, args, version }

  async function resolvePython(force = false) {
    if (python && !force) return python
    const candidates = [config.python, process.env.MYWORK_ORACLE_PYTHON, 'python3', 'python'].filter(Boolean)
    for (const cmd of candidates) {
      const r = await exec(cmd, ['-c', 'import sys; print("%d.%d.%d" % sys.version_info[:3])'], { timeoutMs: 10000 })
      const v = r.stdout.trim()
      if (r.code === 0 && /^\d+\.\d+\.\d+$/.test(v)) {
        const [maj, min] = v.split('.').map(Number)
        if (maj > 3 || (maj === 3 && min >= 9)) { python = { cmd, args: [], version: v }; return python }
      }
    }
    // Last resort: uv can supply an interpreter on a machine that has none.
    const r = await exec('uv', ['run', '--no-project', 'python', '-c', 'import sys; print("%d.%d.%d" % sys.version_info[:3])'], { timeoutMs: 60000 })
    if (r.code === 0 && /^\d+\.\d+\.\d+$/.test(r.stdout.trim())) { python = { cmd: 'uv', args: ['run', '--no-project', 'python'], version: r.stdout.trim() }; return python }
    throw new Error('no Python 3.9+ found (looked for ' + candidates.join(', ') + ' and uv). Install Python 3 or set MYWORK_ORACLE_PYTHON.')
  }

  async function runner(mode, extraArgs = [], input, ms = 30000) {
    const py = await resolvePython()
    const r = await exec(py.cmd, [...py.args, RUNNER, mode, ...extraArgs], { input, timeoutMs: ms, cwd: VENDOR })
    let data = null
    try { data = JSON.parse(r.stdout) } catch { /* not JSON */ }
    if (r.code !== 0 || data === null) {
      if (r.code !== 0) python = null // interpreter may have vanished; re-resolve next time
      throw new Error(`oracle runner failed (${r.code}): ${(r.stderr || r.stdout || '').trim().split('\n').slice(-6).join('\n')}`)
    }
    return data
  }

  const status = async () => {
    const out = { vendor: existsSync(VENDOR), root: VENDOR }
    try { const py = await resolvePython(); Object.assign(out, { pythonCmd: [py.cmd, ...py.args].join(' '), pythonVersion: py.version }) } catch (e) { out.pythonError = String(e.message || e) }
    if (!out.pythonError) {
      try { Object.assign(out, await runner('status')) } catch (e) { out.runnerError = String(e.message || e) }
    }
    out.uv = (await exec('uv', ['--version'], { timeoutMs: 8000 })).code === 0
    out.ok = !!(out.vendor && !out.pythonError && !out.runnerError)
    return out
  }

  const fetchCalls = async (calls) => {
    const list = (Array.isArray(calls) ? calls : []).slice(0, 12).map((c, i) => ({ id: String(c && c.id || `${c && c.provider}.${c && c.method}#${i}`), provider: String(c && c.provider || ''), method: String(c && c.method || ''), args: c && typeof c.args === 'object' && c.args ? c.args : {} }))
    if (list.length === 0) throw new Error('calls is empty; each call needs provider + method (+ args)')
    const data = await runner('call', [], JSON.stringify({ calls: list }), timeoutMs)
    const results = data.results || {}
    const budget = Math.max(5000, Math.floor(maxChars / Math.max(1, Object.keys(results).length)))
    const out = { results: {}, errors: data.errors || {}, truncated: [] }
    for (const [id, v] of Object.entries(results)) { const s = shrink(v, budget); out.results[id] = s.value; if (s.truncated) out.truncated.push(id) }
    if (out.truncated.length === 0) delete out.truncated
    if (Object.keys(out.errors).length === 0) delete out.errors
    return out
  }

  const docText = (name) => {
    const file = DOCS[String(name || 'skill').toLowerCase()]
    if (!file) throw new Error('name must be one of: ' + Object.keys(DOCS).join(', '))
    return readFileSync(file, 'utf8')
  }

  if (config.tools !== false) {
    ctx.tools.register(defineRawTool({
      name: 'oracle_docs',
      description: 'Digital Oracle（市场数据先知）的文档：skill = 方法论与工作流（回答概率 / 宏观 / 是否值得买这类问题前先读一次，每个会话一次）；providers = 各数据源 Python API 速查；symbols = 可用交易代码目录；readme = 项目简介。',
      parameters: { name: { type: 'string', description: 'skill | providers | symbols | readme（默认 skill）' } },
      async execute(a) { return docText(a.name) },
      render: (_a, v) => [{ type: 'text', text: String(v) }],
    }))
    ctx.tools.register(defineRawTool({
      name: 'oracle_providers',
      description: '列出 Digital Oracle 的数据源（PolymarketProvider、KalshiProvider、USTreasuryProvider、CftcCotProvider、DeribitProvider、CoinGeckoProvider、EdgarProvider、BisProvider、WorldBankProvider、StooqProvider、EastmoneyProvider、FearGreedProvider、WebSearchProvider、YahooPriceProvider / YFinanceProvider）及每个方法的参数与查询字段，供 oracle_fetch 使用。',
      parameters: { provider: { type: 'string', description: '只看这一个 provider（类名），缺省列出全部' } },
      async execute(a) { return runner('describe', a.provider ? [String(a.provider)] : [], undefined, 30000) },
    }))
    ctx.tools.register(defineRawTool({
      name: 'oracle_fetch',
      description: '并行调用 Digital Oracle 的数据源，返回交易数据（JSON）。calls 里每项 { id, provider, method, args }：provider 是类名（如 PolymarketProvider），method 是方法名（如 list_events），args 直接写查询字段（如 { slug_contains: "russia", limit: 10 }）或方法参数（如 { ticker: "KXFED-27APR-T4.25" }）。一次最多 12 个调用，回答一个问题至少取 3 个独立维度的信号。只取数据，不做任何交易。',
      parameters: {
        calls: { type: 'array', description: '[{ id, provider, method, args }]' },
        provider: { type: 'string', description: '单个调用的简写：provider 类名（与 calls 二选一）' },
        method: { type: 'string', description: '单个调用的简写：方法名' },
        args: { type: 'object', description: '单个调用的简写：参数对象' },
      },
      async execute(a) {
        const calls = Array.isArray(a.calls) && a.calls.length ? a.calls : (a.provider ? [{ id: a.provider + '.' + a.method, provider: a.provider, method: a.method, args: a.args || {} }] : [])
        return fetchCalls(calls)
      },
    }))
    ctx.tools.register(defineRawTool({
      name: 'oracle_status',
      description: '查看 Digital Oracle 的运行环境：Python 版本、yfinance 是否可用（美股价格历史与期权链需要）、数据源数量、内置版本。',
      parameters: {},
      async execute() { return status() },
    }))
  }

  if (config.promptHint !== false) {
    ctx.inject(['systemPrompt'], (sctx) => {
      try {
        sctx.systemPrompt.section({ name: 'mywork-oracle', order: 915, interpolate: false, text: [
          '## Digital Oracle（市场数据先知）',
          '当用户问某件事的概率（战争、衰退、政策、选举）、宏观周期、某行业是否泡沫、某资产（股票 / ETF / 黄金 / 比特币 / A 股）现在值不值得买、期权溢价高不高、A 股资金流向这类问题时，用市场交易数据回答，不要用新闻、观点或统计报告当因果证据：',
          '1. 先 oracle_docs("skill") 读一次方法论（每个会话只需一次），必要时 oracle_docs("symbols") / oracle_docs("providers") 查代码与参数。',
          '2. 用 oracle_providers 确认参数，再用 oracle_fetch 一次并行取至少 3 个独立维度的信号（预测市场、期权 / 波动率、国债曲线、机构持仓、内部人交易、资金流、避险资产等）。',
          '3. 按 SKILL.md 第 5 步的模板输出：分层信号表 → 矛盾分析 → 概率场景 → 信号一致性评估，标注每个信号的时间窗口。',
          '这是分析工具：不下单、不接任何交易所或券商账户、不给个性化投资建议；结论要说明不确定性。',
        ].join('\n') })
      } catch (e) { warn('system prompt hint skipped: ' + (e && e.message)) }
    })
  }

  ctx.inject(['webServer'], (wctx) => {
    const json = (res, body, code = 200) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)) }
    const loopback = (req) => { const a = req.socket && req.socket.remoteAddress; return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1' }
    const route = (path, handler) => wctx.webServer.register({ kind: 'exact', path: '/mywork-oracle/api' + path, handler: (req, res) => rejectUntrusted(ctx, req, res, json) || Promise.resolve(handler(req, res)).catch((e) => json(res, { error: e instanceof Error ? e.message : String(e) }, 500)) })
    route('/status', async (_req, res) => json(res, await status()))
    route('/describe', async (_req, res) => json(res, await runner('describe', [], undefined, 30000)))
    route('/selfcheck', async (req, res) => {
      if (req.method !== 'POST') return json(res, { error: 'POST only' }, 405)
      const t0 = Date.now()
      const r = await fetchCalls([
        { id: 'fear_greed', provider: 'FearGreedProvider', method: 'get_index', args: {} },
        { id: 'treasury', provider: 'USTreasuryProvider', method: 'latest_yield_curve', args: {} },
        { id: 'polymarket', provider: 'PolymarketProvider', method: 'list_events', args: { limit: 3 } },
      ])
      const summary = {}
      const fg = r.results.fear_greed; if (fg && typeof fg === 'object') summary.fear_greed = fg.score ?? fg.value ?? fg
      const tc = r.results.treasury; if (tc && typeof tc === 'object') summary.treasury_date = tc.date ?? tc.record_date ?? null
      const pm = r.results.polymarket; if (Array.isArray(pm)) summary.polymarket_events = pm.length
      json(res, { ok: !r.errors || Object.keys(r.errors).length < 3, ms: Date.now() - t0, summary, errors: r.errors || {} })
    })
    route('/install-yfinance', async (req, res) => {
      if (req.method !== 'POST') return json(res, { error: 'POST only' }, 405)
      if (!loopback(req)) return json(res, { error: 'install is limited to loopback requests' }, 403)
      const py = await resolvePython()
      const hasUv = (await exec('uv', ['--version'], { timeoutMs: 8000 })).code === 0
      const plan = hasUv && py.cmd !== 'uv' ? ['uv', ['pip', 'install', '--python', py.cmd, 'yfinance']] : [py.cmd, [...py.args, '-m', 'pip', 'install', '--user', 'yfinance']]
      log('installing yfinance: ' + plan[0] + ' ' + plan[1].join(' '))
      const r = await exec(plan[0], plan[1], { timeoutMs: 300000 })
      const s = await status()
      json(res, { ok: r.code === 0 && !!s.yfinance, command: plan[0] + ' ' + plan[1].join(' '), output: (r.stdout + '\n' + r.stderr).trim().split('\n').slice(-12).join('\n'), status: s })
    })
  })

  resolvePython().then((py) => log(`ready: ${[py.cmd, ...py.args].join(' ')} ${py.version}, vendor ${VENDOR}`)).catch((e) => warn(String(e.message || e)))
}
