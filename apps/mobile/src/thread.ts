/**
 * MyWork mobile — the thread logic of a teammate's conversation (TEAMMATES.md §9), pure functions, no React. The web
 * client reads the same runs the same way; keep the two in step.
 *
 *   orderMates(mates)          the one ordering rule: pinned first, then the latest conversation; state never reorders
 *   secondLine(mate)           the row's second line: 在干活 · 步骤 / 等你答 · 问题 / the latest sentence
 *   runEntries(run, ctx)       one run as thread entries: routine marker · bubble · steers · 文件 · 找你卡 · 已安排 ·
 *                              提醒卡 · reply · 在干活 line · failed line
 *   verifyOf(d, run)           what the line under a file says about verification, read live
 *   phasesOf(run) / describe   the 过程 fold: tool calls folded by verb
 */
import { fmtDuration, fmtTime, type Activity, type AskActivity, type AskKind, type Deliverable, type Mate, type Run } from './api'

export const time = (iso?: string) => { const n = iso ? new Date(iso).getTime() : NaN; return Number.isFinite(n) ? n : 0 }
export const isCancelled = (err?: string) => /已取消|已停止|cancel/i.test(String(err || ''))
/** How long the run has been going (or took). */
export const elapsedOf = (r: Pick<Run, 'startedAt' | 'createdAt' | 'finishedAt'>) => fmtDuration(time(r.finishedAt || new Date().toISOString()) - time(r.startedAt || r.createdAt))

// ---- teammates -----------------------------------------------------------------

/** Pinned first (the default mate counts as pinned unless unpinned, and leads the pinned), then by the latest conversation; working or waiting never moves a row (web mateOrder). */
export function orderMates(mates: Mate[]): Mate[] {
  const pinned = (m: Mate) => m.pinned === true || (!!m.isDefault && m.pinned !== false)
  return (mates || []).filter((m) => m && m.id).slice().sort((a, b) =>
    (pinned(b) ? 1 : 0) - (pinned(a) ? 1 : 0)
    || (pinned(a) && pinned(b) ? (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0) : 0)
    || time(b.lastAt || b.createdAt) - time(a.lastAt || a.createdAt)
    || (a.id < b.id ? -1 : 1))
}

/** The row's second line: what it is doing, what it asks, or the latest sentence. */
export function secondLine(m: Mate): string {
  if (m.state === 'waiting') return '等你答' + (m.ask && m.ask.question ? ' · ' + m.ask.question : '')
  if (m.state === 'working') return '在干活' + (m.step ? ' · ' + m.step : '')
  return m.preview || m.title || ''
}

/** The avatar's one character: the mate's glyph when it is one, else the first character of its name. */
export function glyphOf(m: Pick<Mate, 'glyph' | 'name'>): string {
  const g = String(m.glyph || '').trim()
  if (g && [...g].length <= 2) return [...g][0]
  return [...String(m.name || '').trim()][0] || '·'
}

// ---- verification ----------------------------------------------------------------

export type VerifyKind = 'verifying' | 'passed' | 'issues' | 'none' | ''
export type VerifyState = { kind: VerifyKind; checked: number; issues: number; notes: string }

/**
 * Verification runs in the background after the run ends and stamps the file (§9.2). Read it from the file first, the
 * run second; with no stamp it reads 核验中 only while the server says the verifier works (run.verifying, which comes
 * with status 'done'), else nothing — also while the run itself still works, since the verifier has not started.
 */
export function verifyOf(d: Deliverable, run?: Run | null): VerifyState {
  const v = (d && d.verification) || (run && run.verification) || null
  const empty = (kind: VerifyKind): VerifyState => ({ kind, checked: 0, issues: 0, notes: '' })
  if (!v || typeof v !== 'object') return d.verifying || (run && (run.verifying || (run.status as string) === 'verifying')) ? empty('verifying') : empty('')
  if (v.pending === true || v.status === 'verifying' || v.status === 'running' || v.status === 'pending' || v.status === 'queued') return empty('verifying')
  const checked = Number(v.checked) || 0
  const issues = Number(v.issues) || 0
  const notes = typeof v.notes === 'string' ? v.notes : ''
  if (v.passed === true) return { kind: 'passed', checked, issues, notes }
  if (v.passed === false) return { kind: 'issues', checked, issues, notes }
  return { kind: 'none', checked, issues, notes }
}

/** 核验中 / 已核验 · 核对 n / 核验发现 n 处 / 未能核验. */
export function verifyWords(v: VerifyState): string {
  if (v.kind === 'verifying') return '核验中'
  if (v.kind === 'passed') return ['已核验', `核对 ${v.checked}`].join(' · ')
  if (v.kind === 'issues') return `核验发现 ${v.issues || 0} 处`
  if (v.kind === 'none') return '未能核验'
  return ''
}

// ---- one run as thread entries --------------------------------------------------------

export type AskStatus = 'pending' | 'answered' | 'superseded' | 'expired'
export type ThreadEntry =
  | { kind: 'marker'; key: string; at: string; text: string; routineId?: string }
  | { kind: 'user'; key: string; at: string; text: string }
  /** One segment's output as ONE bubble: the reply text ('' when none), then every deliverable (d = ds[0]). */
  | { kind: 'deliver'; key: string; at: string; d: Deliverable; ds: Deliverable[]; text: string; verify: VerifyState }
  | { kind: 'text'; key: string; at: string; text: string }
  | { kind: 'ask'; key: string; at: string; id: string; status: AskStatus; question: string; askKind: AskKind; options: string[]; detail: string; answer: string; answerable: boolean }
  | { kind: 'scheduled'; key: string; at: string; routineId: string; text: string }
  | { kind: 'remind'; key: string; at: string; routineId: string; title: string; text: string; acked: boolean }
  | { kind: 'auto'; key: string; at: string }
  | { kind: 'working'; key: string; at: string; step: string }
  | { kind: 'failed'; key: string; at: string; reason: string; cancelled: boolean }

/** An ask entry's status; legacy entries without one are open until they carry an answer. */
function askStatus(a: AskActivity): AskStatus {
  if (a.status === 'pending' || a.status === 'answered' || a.status === 'superseded' || a.status === 'expired') return a.status
  return a.answer ? 'answered' : 'pending'
}

type Text = Extract<Activity, { kind: 'text' }>

/**
 * One run, the way the thread shows it (§9.1 / §9.2):
 *   - a routine run opens with the centred 「<routine> · HH:MM」 marker instead of a bubble; a system run (the intro a new
 *     teammate gives) shows no user line; a user run opens with the bubble of what was said
 *   - a line said while it worked (steer) is a bubble of its own and opens a new segment; an answer (askId), the 24 h
 *     resume (auto) and hidden system lines are not bubbles: the question card shows its answer
 *   - within a segment, text after its last file or question is the reply; text before them is narration and stays in
 *     过程; a segment with neither shows its final text only once it is over
 *   - files sit at their createdAt; 「已安排」 lines where mywork_routine_create succeeded; reminder cards where they fired
 *   - the end: 在干活 while it runs, nothing while it waits (the card speaks), a failure line when it ended on an error
 */
export function runEntries(run: Run): ThreadEntry[] {
  const r = run || ({} as Run)
  if (r.quiet && r.trigger === 'routine') return []
  const synthetic = remindOf(r)
  if (synthetic) return [{ kind: 'remind', key: r.id + ':rm', ...synthetic }]
  const activity: Activity[] = Array.isArray(r.activity) ? r.activity : []
  const done = r.status === 'done'
  const waiting = r.status === 'waiting'
  const k = (s: string) => r.id + ':' + s
  const docs = (Array.isArray(r.deliverables) ? r.deliverables : []).filter((d) => d && typeof d === 'object').slice().sort((a, b) => time(a.createdAt) - time(b.createdAt))
  let newestPending: AskActivity | null = null
  for (const e of activity) if (e && e.kind === 'ask' && askStatus(e) === 'pending') newestPending = e

  const out: ThreadEntry[] = []
  if (r.trigger === 'routine') out.push({ kind: 'marker', key: k('m'), at: r.createdAt, text: [r.routineTitle || '例行', fmtTime(r.createdAt)].filter(Boolean).join(' · '), routineId: r.routineId })
  else if (r.trigger !== 'system' && String(r.input || '').trim()) out.push({ kind: 'user', key: k('u'), at: r.createdAt, text: String(r.input) })

  // Segments: the opening, then one per steer line.
  type Seg = { start: number; entries: Activity[] }
  const segs: Seg[] = [{ start: time(r.createdAt), entries: [] }]
  let seq = 0
  const steers: ThreadEntry[] = []
  for (const e of activity) {
    if (!e || typeof e !== 'object') continue
    if (e.kind === 'user' && !e.askId && !e.auto && !e.system && String(e.text || '').trim()) {
      steers.push({ kind: 'user', key: k('s' + seq++), at: e.at, text: String(e.text) })
      segs.push({ start: time(e.at), entries: [] })
      continue
    }
    segs[segs.length - 1].entries.push(e)
  }

  segs.forEach((seg, i) => {
    const last = i === segs.length - 1
    const end = last ? Infinity : segs[i + 1].start
    const body: ThreadEntry[] = []
    if (i > 0) body.push(steers[i - 1])
    const mine = docs.filter((d) => { const c = time(d.createdAt); return (i === 0 || c >= seg.start) && c < end })
    const asks = seg.entries.filter((e): e is AskActivity => e.kind === 'ask')
    for (const a of asks) {
      let status = askStatus(a)
      if (status === 'pending' && a !== newestPending) status = 'superseded'
      body.push({
        kind: 'ask', key: k('a' + (a.id || seq++)), at: a.at || '', id: String(a.id || ''), status,
        question: String(a.question || (a as { text?: string }).text || ''), askKind: a.askKind || 'text', options: Array.isArray(a.options) ? a.options.map(String) : [],
        detail: typeof a.detail === 'string' ? a.detail : '', answer: a.answer === undefined || a.answer === null ? '' : String(a.answer),
        answerable: status === 'pending' && waiting,
      })
    }
    for (const e of seg.entries) {
      if (e.kind === 'routine' && (!e.action || e.action === 'created')) body.push({ kind: 'scheduled', key: k('r' + (e.routineId || seq++)), at: e.at, routineId: e.routineId, text: ['已安排', [e.scheduleLabel, e.title].filter(Boolean).join(' ')].filter(Boolean).join(' · ') })
      else if (e.kind === 'remind') body.push({ kind: 'remind', key: k('n' + seq++), at: e.at, routineId: e.routineId, title: String(e.title || e.text || ''), text: String(e.text || ''), acked: !!(e.acked || e.ackedAt) })
      else if (e.kind === 'user' && e.auto) body.push({ kind: 'auto', key: k('x' + seq++), at: e.at })
    }
    const cut = Math.max(mine.length ? time(mine[mine.length - 1].createdAt) : -Infinity, asks.length ? time(asks[asks.length - 1].at) : -Infinity)
    const texts = seg.entries.filter((e): e is Text => e.kind === 'text' && !!String(e.text || '').trim())
    if (mine.length) {
      const reply = texts.filter((e) => time(e.at) > cut)
      const at = reply.length ? reply[reply.length - 1].at : (mine[mine.length - 1].createdAt || r.createdAt)
      body.push({ kind: 'deliver', key: k('d' + (mine[0].id || seq++)), at: at || '', d: mine[0], ds: mine, text: reply.map((e) => String(e.text)).join('\n\n'), verify: verifyOf(mine[0], r) })
    } else if (!(last && !done)) {
      // No file: the reply is the segment's final text. While the last segment is still going, the working line speaks.
      const final = texts[texts.length - 1]
      if (final && time(final.at) > cut) body.push({ kind: 'text', key: k('t' + seq++), at: final.at, text: String(final.text) })
      else if (!final && i === 0 && last && done && !r.error && !docs.length && !activity.some((e) => e && e.kind === 'text') && String(r.summary || '').trim()) {
        body.push({ kind: 'text', key: k('t' + seq++), at: r.finishedAt || r.createdAt, text: String(r.summary) }) // a migrated task whose activity was trimmed
      }
    }
    body.map((e, n) => ({ e, n, at: time(e.at) })).sort((a, b) => a.at - b.at || a.n - b.n).forEach((x) => out.push(x.e))
  })

  if (!done && !waiting) out.push({ kind: 'working', key: k('w'), at: '', step: String(r.step || '') })
  else if (done && r.error) out.push({ kind: 'failed', key: k('f'), at: r.finishedAt || '', reason: String(r.error), cancelled: isCancelled(r.error) })
  return out
}

/** A run that is only a reminder firing (the server may send it as its own run; web remindOf). */
function remindOf(r: Run): { at: string; routineId: string; title: string; text: string; acked: boolean } | null {
  const x = r as Run & { kind?: string; remind?: { routineId?: string; title?: string; text?: string; at?: string; acked?: boolean; ackedAt?: string }; acked?: boolean; ackedAt?: string }
  if (!(x.kind === 'remind' || (x.remind && typeof x.remind === 'object') || (x.trigger as string) === 'remind')) return null
  const m = x.remind && typeof x.remind === 'object' ? x.remind : {}
  const title = String(m.title || x.routineTitle || m.text || x.input || '')
  return { at: String(m.at || x.createdAt || ''), routineId: String(m.routineId || x.routineId || ''), title, text: String(m.text || x.input || ''), acked: !!(m.acked || m.ackedAt || x.acked || x.ackedAt) }
}

/** The newest pending question across the loaded runs (what the dock answers). */
export function pendingAsk(runs: Run[]): { run: Run; ask: AskActivity } | null {
  for (let i = runs.length - 1; i >= 0; i--) {
    const run = runs[i]
    if (run.status !== 'waiting') continue
    const acts = Array.isArray(run.activity) ? run.activity : []
    for (let j = acts.length - 1; j >= 0; j--) { const e = acts[j]; if (e && e.kind === 'ask' && askStatus(e) === 'pending') return { run, ask: e } }
  }
  return null
}

/** Merge a page into what is loaded: the same run id replaces, the rest joins; ascending by createdAt. */
export function mergeRuns(existing: Run[], incoming: Run[]): Run[] {
  const map = new Map<string, Run>()
  for (const r of existing || []) if (r && r.id) map.set(r.id, r)
  for (const r of incoming || []) if (r && r.id) map.set(r.id, r)
  return [...map.values()].sort((a, b) => time(a.createdAt) - time(b.createdAt) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

// ---- 过程 ----------------------------------------------------------------------

export type ToolAct = Extract<Activity, { kind: 'tool' }>
export type Phase = { kind: 'phase'; verb: string; obj: string; items: ToolAct[]; at: string; endAt: string; ms: number; failed: number }
export type PhaseRow = Phase | Extract<Activity, { kind: 'text' | 'verify' }>

/** The run as phases: consecutive tool calls with the same verb fold into one line; a note and the verifier's note are lines of their own. */
export function phasesOf(run: Run): PhaseRow[] {
  const list = Array.isArray(run.activity) ? run.activity : []
  const end = run.finishedAt || new Date().toISOString()
  const out: PhaseRow[] = []
  for (const e of list) {
    if (e.kind === 'tool') {
      const d = describe(e.name, e.detail)
      const last = out[out.length - 1]
      if (last && last.kind === 'phase' && last.verb === d.verb) { last.items.push(e); if (d.obj) last.obj = d.obj; if (e.ok === false) last.failed++; continue }
      out.push({ kind: 'phase', verb: d.verb, obj: d.obj, items: [e], at: e.at, endAt: end, ms: 0, failed: e.ok === false ? 1 : 0 })
      continue
    }
    if (e.kind === 'text' || e.kind === 'verify') out.push(e)
  }
  for (let i = 0; i < out.length; i++) {
    const r = out[i]
    if (r.kind !== 'phase') continue
    const next = out[i + 1]
    r.endAt = next ? next.at : end
    r.ms = Math.max(0, time(r.endAt) - time(r.at))
  }
  return out
}

/** One plain line per tool call: a verb and the thing it touched. Raw arguments never reach the screen. */
export function describe(name: string, detail?: string): { verb: string; obj: string } {
  const n = String(name || '')
  const kv = parseArgs(detail)
  const s = (x: unknown): string => (typeof x === 'string' ? x : Array.isArray(x) ? s(x[0]) : '')
  const host = (u: string) => { const m = u.match(/^[a-z]+:\/\/([^/?#]+)([^?#]*)/i); return m ? m[1].replace(/^www\./, '') + (m[2].length > 1 ? m[2].replace(/\/$/, '').slice(0, 40) : '') : u.slice(0, 60) }
  const base = (p: string) => p.split('/').filter(Boolean).slice(-1)[0] || p
  if (/^web_fetch$|^open_url$|^browser_navigate$/.test(n)) return { verb: '读取网页', obj: host(s(kv.url) || s(kv.href)) }
  if (/^web_search$|search/.test(n)) { let q = s(kv.queries) || s(kv.query) || s(kv.q); if (q.startsWith('[')) { try { q = s(JSON.parse(q)) } catch { /* keep as is */ } } return { verb: '搜索', obj: q ? '“' + q.slice(0, 60) + '”' : '' } }
  if (/^read$|read_file|^cat$|^view$/.test(n)) return { verb: '读取', obj: base(s(kv.file_path) || s(kv.path)) }
  if (/^(edit|write|apply_patch|create_file|write_file)$/.test(n)) return { verb: '整理', obj: base(s(kv.file_path) || s(kv.path)) }
  if (/^(glob|grep|list|ls|find)$/.test(n)) return { verb: '查找', obj: (s(kv.pattern) || s(kv.query) || s(kv.path)).slice(0, 60) }
  if (/^(bash|shell|run_code|exec)$/.test(n)) return { verb: '执行', obj: (s(kv.description) || s(kv.command)).slice(0, 70) }
  if (n === 'deliver') return { verb: '交付', obj: s(kv.title).slice(0, 70) }
  if (/^univer_/.test(n)) return { verb: '文档', obj: (s(kv.title) || s(kv.name) || s(kv.action) || n.slice(7)).slice(0, 60) }
  if (/^browser_/.test(n)) return { verb: '浏览器', obj: n.slice(8) + (s(kv.url) ? ' ' + host(s(kv.url)) : '') }
  if (/^present/.test(n)) return { verb: '展示', obj: s(kv.title).slice(0, 60) }
  if (/^skill/.test(n)) return { verb: '技能', obj: (s(kv.name) || s(kv.skill)).slice(0, 60) }
  if (n === 'mywork_routine_create') return { verb: '安排', obj: (s(kv.input) || s(kv.title)).slice(0, 70) }
  if (n === 'mywork_mate_update') return { verb: '改名片', obj: (s(kv.name) || s(kv.title)).slice(0, 40) }
  if (n === 'mywork_remember') return { verb: '记下', obj: (s(kv.fact) || s(kv.text) || s(kv.note)).slice(0, 70) }
  if (n === 'mywork_ask') return { verb: '问你', obj: s(kv.question).slice(0, 70) }
  return { verb: n, obj: String(detail || '').slice(0, 70) }
}

/** Arguments arrive as a JSON string (possibly truncated) or as key=value pairs. */
function parseArgs(raw?: string): Record<string, unknown> {
  const t = String(raw || '').trim()
  const out: Record<string, unknown> = {}
  if (t.startsWith('{')) {
    try { return JSON.parse(t) as Record<string, unknown> } catch { /* truncated: pick the fields we show */ }
    const m = t.match(/"(url|href|file_path|path|title|query|command|pattern|description|input|name|fact|question)"\s*:\s*"([^"]{1,200})/)
    if (m) out[m[1]] = m[2]
    const q = t.match(/"queries"\s*:\s*\[\s*"([^"]{1,200})/)
    if (q) out.queries = q[1]
    return out
  }
  for (const m of t.matchAll(/(\w+)=("(?:[^"\\]|\\.)*"|\S+)/g)) {
    let val: unknown = m[2]
    if (m[2].startsWith('"')) { try { val = JSON.parse(m[2]) } catch { val = m[2].slice(1, -1) } }
    out[m[1]] = val
  }
  return out
}
