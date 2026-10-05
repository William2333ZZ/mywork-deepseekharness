/**
 * dsh-mywork-tasks — 「我们在用什么」(EDITIONS.md 9.3): candidate rows of the 在用清单 read by code from what the person
 * hands over, each with 「怎么知道的」. The teammate checks them and writes 清单.csv (mywork_list_write); 「哪里在用」 is
 * left for the person (a file says where a model is named, not what business uses it).
 *
 *   scanFiles([{ name, text }]) → { rows: Row[], read: [{ name, kind, n }], skipped: [{ name, reason }] }
 *   scanDir(dir)                → the same for a code folder: dependency files plus model ids quoted in source files
 *
 * Row = { 类型, 名称, 供应商, 模型ID或版本, 月用量或花费, 怎么知道的 }
 * Readers: package.json · requirements*.txt · pyproject.toml · go.mod · new-api / one-api channel exports (JSON) ·
 * LiteLLM config (YAML) · bills (CSV: a model column and an amount column) · source files (quoted model ids).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, extname, join, relative } from 'node:path'
import { parseCsv, vendorOf } from './aiwatch.js'

const VENDOR_NAMES = { deepseek: 'DeepSeek', alibaba: '阿里云百炼', zhipu: '智谱', moonshot: '月之暗面', volcengine: '火山方舟', baidu: '百度千帆', tencent: '腾讯混元', minimax: 'MiniMax', stepfun: '阶跃星辰', siliconflow: '硅基流动', openrouter: 'OpenRouter', azure: 'Azure OpenAI', anthropic: 'Anthropic', google: 'Google', xai: 'xAI', groq: 'Groq', cohere: 'Cohere', mistral: 'Mistral', openai: 'OpenAI' }
export const vendorName = (k) => VENDOR_NAMES[k] || ''

/** AI SDKs by package name (npm, PyPI, Go): the vendor key, or '' for multi-vendor frameworks. */
const NPM = { openai: 'openai', '@anthropic-ai/sdk': 'anthropic', '@google/generative-ai': 'google', '@google/genai': 'google', '@google-cloud/vertexai': 'google', ai: '', '@ai-sdk/openai': 'openai', '@ai-sdk/anthropic': 'anthropic', '@ai-sdk/google': 'google', '@ai-sdk/deepseek': 'deepseek', '@ai-sdk/alibaba': 'alibaba', langchain: '', '@langchain/core': '', '@langchain/openai': 'openai', '@langchain/anthropic': 'anthropic', '@langchain/community': '', llamaindex: '', '@mistralai/mistralai': 'mistral', 'groq-sdk': 'groq', 'cohere-ai': 'cohere', ollama: '', '@modelcontextprotocol/sdk': '', '@huggingface/inference': '', replicate: '', 'together-ai': '', '@openrouter/ai-sdk-provider': 'openrouter', '@volcengine/ark-runtime': 'volcengine', 'zhipuai-sdk-nodejs-v4': 'zhipu', '@baiducloud/qianfan': 'baidu', 'dashscope-node': 'alibaba', '@vercel/ai': '', '@mastra/core': '', '@openai/agents': 'openai' }
const PYPI = { openai: 'openai', anthropic: 'anthropic', 'google-generativeai': 'google', 'google-genai': 'google', 'google-cloud-aiplatform': 'google', dashscope: 'alibaba', zhipuai: 'zhipu', 'zai-sdk': 'zhipu', 'volcengine-python-sdk': 'volcengine', qianfan: 'baidu', 'tencentcloud-sdk-python': 'tencent', mistralai: 'mistral', groq: 'groq', cohere: 'cohere', together: '', ollama: '', litellm: '', langchain: '', 'langchain-core': '', 'langchain-openai': 'openai', 'langchain-anthropic': 'anthropic', 'langchain-community': '', 'langchain-deepseek': 'deepseek', 'llama-index': '', 'llama-index-core': '', transformers: '', vllm: '', 'sentence-transformers': '', 'openai-agents': 'openai', 'mcp': '', 'dspy': '', 'dspy-ai': '', 'instructor': '', 'pydantic-ai': '' }
const GO = { 'github.com/sashabaranov/go-openai': 'openai', 'github.com/openai/openai-go': 'openai', 'github.com/anthropics/anthropic-sdk-go': 'anthropic', 'google.golang.org/genai': 'google', 'github.com/google/generative-ai-go': 'google', 'github.com/tmc/langchaingo': '', 'github.com/cloudwego/eino': '', 'github.com/volcengine/volcengine-go-sdk': 'volcengine', 'github.com/cohere-ai/cohere-go/v2': 'cohere' }

/** A model id as it appears in code or configs (quoted, in code). */
const MODEL_ID = /^(deepseek-[a-z0-9.-]+|qwen[a-z0-9.-]*|qwq-[a-z0-9.-]+|glm-[a-z0-9.-]+|kimi-[a-z0-9.-]+|moonshot-v1-[a-z0-9-]+|doubao-[a-z0-9.-]+|ep-\d{14}-[a-z0-9]+|gpt-[a-z0-9.-]+|chatgpt-[a-z0-9.-]+|o[134](?:-mini|-pro|-preview)?(?:-\d{4}-\d{2}-\d{2})?|claude-[a-z0-9.-]+|gemini-[a-z0-9.-]+|gemma-[a-z0-9.-]+|text-embedding-[a-z0-9-]+|bge-[a-z0-9.-]+|ernie-[a-z0-9.-]+|hunyuan-[a-z0-9.-]+|abab[a-z0-9.-]+|minimax-[a-z0-9.-]+|step-[a-z0-9.-]+|grok-[a-z0-9.-]+|mistral-[a-z0-9.-]+|codestral-[a-z0-9.-]+|command-r[a-z0-9.-]*|llama-?[0-9][a-z0-9.-]*|whisper-[a-z0-9.-]+|dall-e-[0-9]+|tts-1(?:-hd)?)$/i
export const isModelId = (s) => MODEL_ID.test(String(s || '').trim().replace(/^[a-z0-9-]+\//i, ''))

const row = (o) => ({ 类型: '', 名称: '', 供应商: '', 模型ID或版本: '', 月用量或花费: '', 怎么知道的: '', ...o })
const modelRow = (id, how, extra) => { const clean = String(id).trim(); const v = vendorOf('', clean); return row({ 类型: '模型', 名称: clean, 供应商: vendorName(v), 模型ID或版本: clean, 怎么知道的: how, ...(extra || {}) }) }

function fromPackageJson(name, text) {
  let d
  try { d = JSON.parse(text) } catch { return null }
  if (!d || typeof d !== 'object' || !(d.dependencies || d.devDependencies)) return null
  const out = []
  for (const [k, v] of Object.entries({ ...(d.devDependencies || {}), ...(d.dependencies || {}) })) {
    const known = Object.prototype.hasOwnProperty.call(NPM, k) || /^@ai-sdk\//.test(k) || /^@langchain\//.test(k)
    if (!known) continue
    out.push(row({ 类型: 'SDK', 名称: k, 供应商: vendorName(NPM[k] || ''), 模型ID或版本: String(v).replace(/^[\^~>=<\s]+/, ''), 怎么知道的: name }))
  }
  return out
}
function fromRequirements(name, text) {
  const out = []
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim()
    const m = line.match(/^([A-Za-z0-9_.\-[\]]+)\s*(?:[=<>!~]=?\s*([0-9][^,;\s]*))?/)
    if (!m) continue
    const pkg = m[1].replace(/\[.*\]$/, '').toLowerCase()
    if (!Object.prototype.hasOwnProperty.call(PYPI, pkg) && !/^langchain-|^llama-index-/.test(pkg)) continue
    out.push(row({ 类型: 'SDK', 名称: pkg, 供应商: vendorName(PYPI[pkg] || ''), 模型ID或版本: m[2] || '', 怎么知道的: name }))
  }
  return out
}
function fromPyproject(name, text) {
  const out = []
  for (const m of String(text).matchAll(/["']([A-Za-z0-9_.\-]+)(?:\[[^\]]*\])?\s*(?:[=<>!~]=?\s*([0-9][^"',;\s]*))?[^"']*["']/g)) {
    const pkg = m[1].toLowerCase()
    if (!Object.prototype.hasOwnProperty.call(PYPI, pkg) && !/^langchain-|^llama-index-/.test(pkg)) continue
    out.push(row({ 类型: 'SDK', 名称: pkg, 供应商: vendorName(PYPI[pkg] || ''), 模型ID或版本: m[2] || '', 怎么知道的: name }))
  }
  // poetry: name = "^1.2"
  for (const m of String(text).matchAll(/^\s*([A-Za-z0-9_.\-]+)\s*=\s*["'{][^\n]*?([0-9][0-9.]*)/gm)) {
    const pkg = m[1].toLowerCase()
    if (!Object.prototype.hasOwnProperty.call(PYPI, pkg)) continue
    out.push(row({ 类型: 'SDK', 名称: pkg, 供应商: vendorName(PYPI[pkg] || ''), 模型ID或版本: m[2], 怎么知道的: name }))
  }
  return out
}
function fromGoMod(name, text) {
  const out = []
  for (const m of String(text).matchAll(/^\s*(?:require\s+)?([a-z0-9.\-/]+)\s+v([0-9][^\s]*)/gim)) {
    const mod = m[1]
    const hit = Object.keys(GO).find((k) => mod === k || mod.startsWith(k + '/'))
    if (!hit) continue
    out.push(row({ 类型: 'SDK', 名称: mod, 供应商: vendorName(GO[hit]), 模型ID或版本: m[2], 怎么知道的: name }))
  }
  return out
}
/** new-api / one-api channel export: [{ name, models: 'a,b', model_mapping, base_url, status }] (or { data: [...] }). */
function fromGateway(name, text) {
  let d
  try { d = JSON.parse(text) } catch { return null }
  const list = Array.isArray(d) ? d : d && Array.isArray(d.data) ? d.data : d && d.data && Array.isArray(d.data.items) ? d.data.items : null
  if (!list || !list.some((c) => c && (typeof c.models === 'string' || Array.isArray(c.models)))) return null
  const out = []
  for (const c of list) {
    if (!c || typeof c !== 'object') continue
    const models = Array.isArray(c.models) ? c.models : String(c.models || '').split(',')
    let mapping = {}
    try { mapping = typeof c.model_mapping === 'string' && c.model_mapping.trim() ? JSON.parse(c.model_mapping) : (c.model_mapping || {}) } catch {}
    const off = c.status !== undefined && Number(c.status) !== 1
    for (const m0 of models) {
      const m = String(m0).trim()
      if (!m) continue
      const real = mapping && typeof mapping[m] === 'string' ? mapping[m] : m
      const vendor = vendorOf(String(c.base_url || '') + ' ' + String(c.name || ''), real)
      out.push(row({ 类型: '模型', 名称: m, 供应商: vendorName(vendor), 模型ID或版本: real, 怎么知道的: `网关渠道「${String(c.name || c.id || '').slice(0, 30)}」` + (real !== m ? `（${m} 映射到 ${real}）` : '') + (off ? '，渠道已停用' : ''), ...(off ? { 启用: '否' } : {}) }))
    }
  }
  return out
}
/** LiteLLM config: model_list: - model_name: x  litellm_params: model: provider/id */
function fromLitellm(name, text) {
  if (!/model_list\s*:/.test(text)) return null
  const out = []
  let alias = ''
  for (const raw of String(text).split(/\r?\n/)) {
    let m
    if ((m = raw.match(/^\s*-?\s*model_name\s*:\s*["']?([^"'#\s]+)/))) { alias = m[1]; continue }
    if ((m = raw.match(/^\s*model\s*:\s*["']?([^"'#\s]+)/)) && alias) {
      const full = m[1]
      const id = full.replace(/^[a-z_]+\//i, '')
      out.push(row({ 类型: '模型', 名称: alias, 供应商: vendorName(vendorOf(full, id)), 模型ID或版本: id, 怎么知道的: `LiteLLM 配置 ${name}（${alias} → ${full}）` }))
      alias = ''
    }
  }
  return out
}
/** A bill: a model column and an amount column; the amounts are summed per model (the month's 用量或花费). */
function fromBill(name, text) {
  const rows = parseCsv(text)
  if (rows.length < 2) return null
  const header = rows[0].map((x) => String(x).trim())
  const mi = header.findIndex((h) => /模型|model|商品名称|产品明细|服务名称|计费项/i.test(h))
  const ai = header.findIndex((h) => /应付|实付|金额|费用|消费|cost|amount|charge|price|总计/i.test(h) && !/单价|unit/i.test(h))
  if (mi < 0 || ai < 0) return null
  const usd = header.some((h) => /usd|\$/i.test(h)) || /\$/.test(rows.slice(1, 6).map((r) => r[ai]).join(''))
  const sums = new Map()
  for (const r of rows.slice(1)) {
    const id = String(r[mi] || '').trim()
    if (!id) continue
    const n = Number(String(r[ai] || '').replace(/[^\d.\-]/g, ''))
    if (!Number.isFinite(n)) continue
    sums.set(id, (sums.get(id) || 0) + n)
  }
  const out = []
  for (const [id, n] of sums) {
    if (!isModelId(id) && !vendorOf('', id)) continue
    out.push(modelRow(id, `账单 ${name}`, { 月用量或花费: (usd ? '$' : '¥') + Math.round(n).toLocaleString('en-US') + '（' + name.replace(/\.csv$/i, '') + '）' }))
  }
  return out
}
/** Model ids quoted in a source file: "gpt-4o", 'deepseek-chat', `qwen-max`. */
function fromSource(name, text) {
  const out = []
  const lines = String(text).split(/\r?\n/)
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/["'`]([A-Za-z0-9][A-Za-z0-9._/-]{2,60})["'`]/g)) {
      const id = m[1].replace(/^[a-z0-9-]+\//i, '')
      if (!isModelId(id)) continue
      out.push(modelRow(id, `代码 ${name}:${i + 1}`))
    }
  })
  return out
}

/** Merge candidate rows: one per model id (or SDK name); 怎么知道的 joined; a spend kept. */
export function mergeRows(rows) {
  const map = new Map()
  for (const r of rows) {
    const key = (r.类型 === 'SDK' ? 'sdk:' + r.名称 : 'm:' + String(r.模型ID或版本 || r.名称)).toLowerCase()
    const prev = map.get(key)
    if (!prev) { map.set(key, { ...r }); continue }
    for (const k of Object.keys(r)) if (!prev[k] && r[k]) prev[k] = r[k]
    if (r.怎么知道的 && !prev.怎么知道的.split('；').includes(r.怎么知道的)) {
      const parts = prev.怎么知道的.split('；')
      if (parts.length < 4) prev.怎么知道的 = parts.concat(r.怎么知道的).join('；')
      else if (!/等 \d+ 处$/.test(prev.怎么知道的)) prev.怎么知道的 += '；等更多处'
    }
  }
  return [...map.values()]
}

const CODE_EXT = new Set(['.py', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.go', '.java', '.kt', '.rb', '.php', '.rs', '.cs', '.yaml', '.yml', '.toml', '.json', '.env', '.ini', '.cfg', '.conf'])
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', 'venv', '.venv', '__pycache__', 'vendor', 'target', '.idea', '.vscode', 'coverage', '.cache', 'site-packages'])

/** One file by its name and content: which reader takes it (null: none did). */
export function readOne(name, text) {
  const base = basename(name).toLowerCase()
  const ext = extname(base)
  if (base === 'package.json') return { kind: 'package.json', rows: fromPackageJson(name, text) || [] }
  if (/^requirements.*\.txt$/.test(base)) return { kind: 'requirements', rows: fromRequirements(name, text) }
  if (base === 'pyproject.toml') return { kind: 'pyproject', rows: fromPyproject(name, text) }
  if (base === 'go.mod') return { kind: 'go.mod', rows: fromGoMod(name, text) }
  if (ext === '.csv' || ext === '.tsv') { const r = fromBill(name, ext === '.tsv' ? String(text).replace(/\t/g, ',') : text); return r ? { kind: '账单', rows: r } : null }
  if (ext === '.yaml' || ext === '.yml') { const r = fromLitellm(name, text); if (r) return { kind: 'LiteLLM', rows: r } }
  if (ext === '.json') { const r = fromGateway(name, text); if (r) return { kind: '网关', rows: r } }
  if (CODE_EXT.has(ext) || /\.env/.test(base)) return { kind: '代码', rows: fromSource(name, text) }
  if (ext === '.txt' || ext === '.md' || !ext) return { kind: '文字', rows: fromSource(name, text).concat(plainIds(name, text)) }
  return null
}
/** Pasted or plain text: model ids written bare, one per word. */
function plainIds(name, text) {
  const out = []
  for (const w of String(text).split(/[\s,，、;；|()（）]+/)) { const id = w.replace(/^[a-z0-9-]+\//i, '').replace(/[。.:：]+$/, ''); if (id.length > 2 && isModelId(id)) out.push(modelRow(id, name)) }
  return out
}

export function scanFiles(files) {
  const all = []
  const read = []
  const skipped = []
  for (const f of files || []) {
    const name = String(f.name || 'pasted')
    const r = readOne(name, String(f.text || ''))
    if (!r) { skipped.push({ name, reason: '不认识这种文件' }); continue }
    read.push({ name, kind: r.kind, n: r.rows.length })
    all.push(...r.rows)
  }
  return { rows: mergeRows(all), read, skipped }
}

/** A code folder: dependency files and quoted model ids, at most `maxFiles` files of ≤1 MB, skipping vendored trees. */
export function scanDir(dir, { maxFiles = 4000 } = {}) {
  const files = []
  const walk = (rel, depth) => {
    if (files.length >= maxFiles || depth > 8) return
    let names = []
    try { names = readdirSync(join(dir, rel)) } catch { return }
    for (const n of names) {
      if (files.length >= maxFiles) return
      if (SKIP_DIRS.has(n) || (n.startsWith('.') && !/^\.env/.test(n))) continue
      const p = rel ? join(rel, n) : n
      let st
      try { st = statSync(join(dir, p)) } catch { continue }
      if (st.isDirectory()) walk(p, depth + 1)
      else if (st.size <= 1024 * 1024) {
        const base = n.toLowerCase()
        if (base === 'package.json' || base === 'go.mod' || base === 'pyproject.toml' || /^requirements.*\.txt$/.test(base) || CODE_EXT.has(extname(base)) || /^\.env/.test(base)) files.push(p)
      }
    }
  }
  walk('', 0)
  const texts = []
  for (const p of files) { try { texts.push({ name: relative(dir, join(dir, p)), text: readFileSync(join(dir, p), 'utf8') }) } catch {} }
  const out = scanFiles(texts)
  out.files = files.length
  return out
}
