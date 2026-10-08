/**
 * dsh-mywork-tasks — the 实验 teammate's ledger, read by code (Karpathy, autoresearch: every experiment is one row of
 * results.tsv — commit, the metric, memory, keep / discard / crash, what was tried; tab-separated because commas break
 * the description). The numbers the morning report and the panel show come from here, not from the model's memory.
 *
 *   parseResults(text) → Row[]          Row = { n, commit, metric, memory, status, description }
 *   directionOf(programText) → 'lower' | 'higher'   (program.md: 「越低越好」 / 「越高越好」; lower by default, like val_bpb)
 *   summarize(rows, dir, from?) → { total, keep, discard, crash, baseline, best, frontier, last }
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const RESULTS_FILE = 'results.tsv'
export const PROGRAM_FILE = 'program.md'
export const PROGRESS_FILE = 'PROGRESS.md'
const STATUS = { keep: 'keep', kept: 'keep', 保留: 'keep', discard: 'discard', discarded: 'discard', 丢弃: 'discard', crash: 'crash', crashed: 'crash', 崩溃: 'crash', 失败: 'crash' }

export function parseResults(text) {
  const lines = String(text || '').split('\n').map((l) => l.replace(/\r$/, '')).filter((l) => l.trim())
  if (!lines.length) return []
  const sep = lines.some((l) => l.includes('\t')) ? '\t' : ','
  const head = lines[0].split(sep).map((x) => x.trim().toLowerCase())
  const hasHead = head.some((x) => /commit|status|状态|description|说明|val_|指标|metric/.test(x))
  const col = (re, dflt) => { const i = head.findIndex((x) => re.test(x)); return hasHead && i >= 0 ? i : dflt }
  const ci = col(/commit|提交/, 0)
  const mi = col(/val_|metric|指标|loss|acc|score|bpb/, 1)
  const memi = col(/mem|显存|vram/, 2)
  const si = col(/status|状态/, 3)
  const di = col(/desc|说明|描述|note/, 4)
  const rows = []
  for (const l of hasHead ? lines.slice(1) : lines) {
    const c = l.split(sep)
    const num = Number(String(c[mi] || '').trim())
    const status = STATUS[String(c[si] || '').trim().toLowerCase()] || 'other'
    rows.push({ n: rows.length + 1, commit: String(c[ci] || '').trim().slice(0, 12), metric: Number.isFinite(num) && !(status === 'crash' && num === 0) ? num : null, memory: String(c[memi] || '').trim(), status, description: String(c.slice(di).join(sep === '\t' ? ' ' : ',') || '').trim() })
  }
  return rows
}

export function directionOf(text) {
  // 「（越低越好 / 越高越好）」 is the seed's placeholder, not a choice.
  const s = String(text || '').replace(/（[^）]*）|\([^)]*\)/g, ' ')
  if (/越高越好|higher is better|maximi[sz]e/i.test(s)) return 'higher'
  return 'lower'
}
/** The metric's name as program.md gives it (「指标：val_bpb」), or ''. */
export function metricName(text) {
  const m = String(text || '').match(/^\s*[-*]?\s*(?:指标|metric)\s*[:：]\s*([A-Za-z0-9_@./-]+)/im)
  return m ? m[1] : ''
}

/** Counts and the best-so-far line over rows (from row `from` on, for one night). */
export function summarize(rows, dir = 'lower', from = 0) {
  const part = rows.slice(from)
  const better = (a, b) => (dir === 'higher' ? a > b : a < b)
  const count = (s) => part.filter((r) => r.status === s).length
  const scored = rows.filter((r) => r.metric !== null && r.status !== 'crash')
  const baseline = scored[0] || null
  let best = null
  const frontier = []
  for (const r of rows) {
    if (r.metric === null || r.status === 'crash') continue
    if (r.status !== 'keep' && r !== baseline && best) continue
    if (!best || better(r.metric, best.metric)) best = r
    frontier.push({ n: r.n, metric: best.metric })
  }
  const bestBefore = (() => { let b = null; for (const r of rows.slice(0, from)) if (r.metric !== null && r.status !== 'crash' && (r.status === 'keep' || r === baseline) && (!b || better(r.metric, b.metric))) b = r; return b })()
  return { total: part.length, keep: count('keep'), discard: count('discard'), crash: count('crash'), baseline, best, bestBefore, frontier, last: part.slice(-8).reverse(), dir }
}

export function readLedger(dir) {
  let text = ''
  let program = ''
  try { text = readFileSync(join(dir, RESULTS_FILE), 'utf8') } catch {}
  try { program = readFileSync(join(dir, PROGRAM_FILE), 'utf8') } catch {}
  const rows = parseResults(text)
  return { rows, dir: directionOf(program), metric: metricName(program) }
}

/** One line for prompts and the thread: 「42 次：保留 6 · 丢弃 33 · 崩溃 3；val_bpb 0.9979 → 0.9812（a1b2c3d）」. */
export function ledgerLine(s, metric) {
  if (!s.total) return '还没有实验记录。'
  const parts = [`${s.total} 次：保留 ${s.keep} · 丢弃 ${s.discard} · 崩溃 ${s.crash}`]
  const from = s.bestBefore || s.baseline
  if (s.best) parts.push(`${metric || '指标'} ${from && from !== s.best ? fmt(from.metric) + ' → ' : ''}${fmt(s.best.metric)}（${s.best.commit || '#' + s.best.n}）`)
  return parts.join('；')
}
const fmt = (x) => (x === null || x === undefined ? '—' : Math.abs(x) >= 100 ? x.toFixed(1) : Number(x.toPrecision(6)).toString())
