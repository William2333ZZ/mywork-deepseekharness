/**
 * dsh-mywork-tasks — 在我们自己的任务上测 (EDITIONS.md 9.3; needs report I5, 7.2): the evidence says teams trust a
 * test on their own workload, rerun when a model changes, more than any desk-written comparison — and that migrating
 * and retesting, not learning about a change, is what hurts. So a teammate keeps 10–30 real tasks with a way to judge
 * each, and runs the current model and its candidates on them with the keys you gave it.
 *
 *   自测/任务.csv   编号,任务,输入,判定方法,期望,备注
 *     判定方法  包含 · 不包含 · 等于 · 正则 · JSON · 长度不超过 — judged by code;
 *               标准 — judged by a model against the rubric in 期望 (five of them sampled for you to look at);
 *               人工 — kept for you to look at.
 *     「包含」的期望可写几个，用 | 分隔（任一）或 & 分隔（全部）；JSON 的期望写 字段=值（可空：能解析就算过）。
 *
 *   runSelftest({ tasks, candidates, judge, post, concurrency }) → { rows, summary }
 *   candidates: [{ label, baseUrl, model, apiKey }] (OpenAI-compatible chat completions; keys never leave the call)
 */
import { parseCsv, toCsv } from './aiwatch.js'

export const TASK_HEADER = ['编号', '任务', '输入', '判定方法', '期望', '备注']
export const RESULT_HEADER = ['编号', '任务', '候选', '判定方法', '结果', '理由', '耗时(毫秒)', '输入token', '输出token', '输出（前 300 字）']
/** OpenAI-compatible endpoints by vendor key (aiwatch vendorOf). */
export const BASE_URLS = {
  deepseek: 'https://api.deepseek.com/v1',
  alibaba: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4',
  moonshot: 'https://api.moonshot.cn/v1',
  volcengine: 'https://ark.cn-beijing.volces.com/api/v3',
  siliconflow: 'https://api.siliconflow.cn/v1',
  minimax: 'https://api.minimaxi.com/v1',
  stepfun: 'https://api.stepfun.com/v1',
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta/openai',
  openrouter: 'https://openrouter.ai/api/v1',
  xai: 'https://api.x.ai/v1',
  groq: 'https://api.groq.com/openai/v1',
  mistral: 'https://api.mistral.ai/v1',
}

/** The tasks of 自测/任务.csv as objects; rows without 输入 are left out. */
export function readTasks(text) {
  const all = parseCsv(text)
  if (!all.length) return []
  const header = all[0].map((x) => String(x).trim())
  const col = (names) => header.findIndex((h) => names.includes(h))
  const ci = { id: col(['编号', 'id']), name: col(['任务', '名称']), input: col(['输入', 'prompt', '问题']), method: col(['判定方法', '判定']), expect: col(['期望', '标准', '答案']), note: col(['备注']) }
  const get = (r, i) => (i >= 0 ? String(r[i] === undefined ? '' : r[i]).trim() : '')
  return all.slice(1).map((r, n) => ({ id: get(r, ci.id) || 'T' + String(n + 1).padStart(2, '0'), name: get(r, ci.name), input: get(r, ci.input), method: get(r, ci.method) || '人工', expect: get(r, ci.expect), note: get(r, ci.note) })).filter((t) => t.input)
}

const stripFence = (s) => String(s || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
/**
 * One output against its task, by code: { pass: true | false | null, reason, needsJudge? }. null = not judged by code
 * (人工, or 标准 waiting for a model).
 */
export function judgeByCode(task, output) {
  const out = String(output || '')
  const m = String(task.method || '').trim()
  const exp = String(task.expect || '')
  if (/^包含/.test(m)) {
    const all = exp.includes('&')
    const parts = exp.split(all ? '&' : '|').map((x) => x.trim()).filter(Boolean)
    if (!parts.length) return { pass: null, reason: '期望是空的' }
    const hits = parts.filter((p) => out.includes(p))
    const pass = all ? hits.length === parts.length : hits.length > 0
    return { pass, reason: pass ? '包含「' + hits.join('」「') + '」' : '没有「' + parts.filter((p) => !hits.includes(p)).join('」「') + '」' }
  }
  if (/^不包含/.test(m)) { const bad = exp.split('|').map((x) => x.trim()).filter((p) => p && out.includes(p)); return { pass: !bad.length, reason: bad.length ? '出现了「' + bad.join('」「') + '」' : '没有出现' } }
  if (/^等于/.test(m)) { const pass = out.trim() === exp.trim(); return { pass, reason: pass ? '一致' : '不一致' } }
  if (/^正则/.test(m)) { try { const pass = new RegExp(exp).test(out); return { pass, reason: pass ? '匹配' : '不匹配' } } catch { return { pass: null, reason: '正则写错了' } } }
  if (/^json/i.test(m)) {
    let v
    try { v = JSON.parse(stripFence(out)) } catch { return { pass: false, reason: '不是合法 JSON' } }
    if (!exp.trim()) return { pass: true, reason: '合法 JSON' }
    const [path, want] = exp.split('=').map((x) => x.trim())
    const got = path.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), v)
    const pass = want === undefined ? got !== undefined : String(got) === want
    return { pass, reason: pass ? `${path} = ${got}` : `${path} 是 ${JSON.stringify(got)}，期望 ${want}` }
  }
  if (/^长度/.test(m)) { const n = Number(exp); const pass = Number.isFinite(n) ? out.length <= n : null; return { pass, reason: `${out.length} 字` } }
  if (/^标准/.test(m)) return { pass: null, reason: '', needsJudge: true }
  return { pass: null, reason: '待你看' }
}

/** One chat completion: { text, ms, tokensIn, tokensOut, error }. */
export async function callChat({ baseUrl, apiKey, model, messages, post, timeoutMs = 120000 }) {
  const url = String(baseUrl || '').replace(/\/+$/, '') + '/chat/completions'
  const t0 = Date.now()
  try {
    const r = await post(url, { model, messages }, { timeoutMs, headers: { authorization: 'Bearer ' + apiKey } })
    const ms = Date.now() - t0
    if (r.status >= 400 || !r.json) {
      const msg = (r.json && r.json.error && (r.json.error.message || r.json.error.code)) || String(r.text || '').slice(0, 120) || 'HTTP ' + r.status
      return { text: '', ms, tokensIn: 0, tokensOut: 0, error: `HTTP ${r.status}：${String(msg).slice(0, 160)}` }
    }
    const c = r.json.choices && r.json.choices[0]
    const text = c && c.message ? String(c.message.content || '') : ''
    const u = r.json.usage || {}
    return { text, ms, tokensIn: Number(u.prompt_tokens) || 0, tokensOut: Number(u.completion_tokens) || 0, error: text ? '' : '没有返回内容' }
  } catch (e) {
    return { text: '', ms: Date.now() - t0, tokensIn: 0, tokensOut: 0, error: String((e && e.message) || e).slice(0, 160) }
  }
}

/** The rubric judge's verdict: 「通过」/「不通过」 on the first line, a reason after. */
export function parseVerdict(text) {
  const s = String(text || '').trim()
  const first = s.split('\n')[0]
  const pass = /不通过|不合格|fail/i.test(first) ? false : /通过|合格|pass/i.test(first) ? true : null
  return { pass, reason: s.replace(/^[^\n]*\n?/, '').trim().slice(0, 120) || first.slice(0, 120) }
}

async function pool(items, n, fn) {
  const out = new Array(items.length)
  let i = 0
  await Promise.all(Array.from({ length: Math.max(1, Math.min(n, items.length)) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k) } }))
  return out
}

/**
 * Every task on every candidate. A 标准 task is judged by `judge` (when given), and five of those verdicts are flagged
 * for you to check (抽检). Returns rows (one per task × candidate) and a summary per candidate.
 */
export async function runSelftest({ tasks, candidates, judge, post, concurrency = 4 }) {
  const jobs = []
  for (const c of candidates) for (const t of tasks) jobs.push({ c, t })
  const rows = await pool(jobs, concurrency, async ({ c, t }) => {
    const r = await callChat({ baseUrl: c.baseUrl, apiKey: c.apiKey, model: c.model, messages: [{ role: 'user', content: t.input }], post })
    let verdict = r.error ? { pass: null, reason: '调用失败：' + r.error } : judgeByCode(t, r.text)
    let byModel = false
    if (!r.error && verdict.needsJudge) {
      if (judge) {
        const j = await callChat({ baseUrl: judge.baseUrl, apiKey: judge.apiKey, model: judge.model, post, messages: [{ role: 'user', content: `你是评分员。按标准判断下面的回答是否合格，第一行只写「通过」或「不通过」，第二行用一句话说理由。\n\n标准：${t.expect || '（没写标准，按任务要求判断）'}\n\n任务：${t.input}\n\n回答：\n${r.text.slice(0, 6000)}` }] })
        verdict = j.error ? { pass: null, reason: '评分失败：' + j.error } : parseVerdict(j.text)
        byModel = !j.error
      } else verdict = { pass: null, reason: '没有评分模型，待你看' }
    }
    return { task: t, label: c.label, output: r.text, error: r.error, pass: verdict.pass, reason: verdict.reason, byModel, ms: r.ms, tokensIn: r.tokensIn, tokensOut: r.tokensOut }
  })
  // 抽检: five verdicts a model gave, spread over candidates, for you to look at (EDITIONS.md 9.3).
  const judged = rows.filter((x) => x.byModel)
  const step = Math.max(1, Math.floor(judged.length / 5))
  for (let i = 0; i < judged.length && i / step < 5; i += step) judged[i].check = true
  const summary = candidates.map((c) => {
    const mine = rows.filter((x) => x.label === c.label)
    const ok = mine.filter((x) => !x.error)
    return {
      label: c.label, model: c.model, total: mine.length,
      pass: mine.filter((x) => x.pass === true).length, fail: mine.filter((x) => x.pass === false).length,
      manual: mine.filter((x) => x.pass === null && !x.error).length, errors: mine.filter((x) => x.error).length,
      avgMs: ok.length ? Math.round(ok.reduce((n, x) => n + x.ms, 0) / ok.length) : 0,
      tokensIn: mine.reduce((n, x) => n + x.tokensIn, 0), tokensOut: mine.reduce((n, x) => n + x.tokensOut, 0),
    }
  })
  return { rows, summary }
}

/** The results table (自测/结果-<时间>.csv): one row per task × candidate; outputs cut at 300 characters; no keys. */
export function resultsCsv(rows) {
  const word = (x) => (x.error ? '调用失败' : x.pass === true ? '通过' : x.pass === false ? '不通过' : '待你看') + (x.check ? '（抽检）' : '')
  return toCsv(RESULT_HEADER, rows.map((x) => [x.task.id, x.task.name || x.task.input.slice(0, 30), x.label, x.task.method + (x.byModel ? '（模型判）' : ''), word(x), x.reason, x.ms, x.tokensIn, x.tokensOut, String(x.output || '').replace(/\s+/g, ' ').slice(0, 300)]))
}
