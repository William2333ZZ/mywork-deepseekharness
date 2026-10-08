/**
 * MyWork mobile — the thread logic of a teammate's conversation (TEAMMATES.md §9), pure functions, no React. The web
 * client reads the same runs the same way; keep the two in step.
 *
 *   orderMates(mates)          the one ordering rule: pinned first, then the latest conversation; state never reorders
 *   sectionMates(mates)        the list's sections: 置顶 · one per group (alphabetical, zh-CN; never by activity) · 其他
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

/** One block of the list: 置顶, a group (its name), or 其他 (no group). */
export type MateSection = { key: string; kind: 'pinned' | 'group' | 'other'; name: string; mates: Mate[] }

/**
 * The list's sections (web sectionMates): 置顶 (every pinned teammate, whatever its group), then one per group name in a
 * stable order — alphabetical, zh-CN collation, so activity never moves a section — then 其他. Empty sections are left
 * out; each keeps orderMates' order.
 */
export function sectionMates(mates: Mate[]): MateSection[] {
  const isPinned = (m: Mate) => m.pinned === true || (!!m.isDefault && m.pinned !== false)
  const pinned: Mate[] = []
  const other: Mate[] = []
  const groups = new Map<string, Mate[]>()
  for (const m of orderMates(mates)) {
    if (isPinned(m)) { pinned.push(m); continue }
    const name = String(m.group || '').trim()
    if (!name) { other.push(m); continue }
    const list = groups.get(name)
    if (list) list.push(m); else groups.set(name, [m])
  }
  // Stable: a group keeps its place from the day it was formed (its earliest member), never by activity or alphabet.
  const born = (list: Mate[]) => Math.min(...list.map((m) => Date.parse(String(m.createdAt || '')) || 0))
  const named = [...groups].sort(([a, la], [b, lb]) => (born(la) - born(lb)) || a.localeCompare(b, 'zh-CN'))
  const out: MateSection[] = []
  if (pinned.length) out.push({ key: 'pinned', kind: 'pinned', name: '', mates: pinned })
  for (const [name, list] of named) out.push({ key: 'g:' + name, kind: 'group', name, mates: list })
  if (other.length) out.push({ key: 'other', kind: 'other', name: '', mates: other })
  return out
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
  | { kind: 'user'; key: string; at: string; text: string; via?: string }
  /** MyWork created a teammate here: a card that opens it (its current name comes from the list). */
  | { kind: 'newMate'; key: string; at: string; mateId: string; name: string }
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
  else if (r.trigger !== 'system' && String(r.input || '').trim()) out.push({ kind: 'user', key: k('u'), at: r.createdAt, text: String(r.input), ...(r.via ? { via: r.via } : {}) })

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
      else if (e.kind === 'mate' && e.action === 'created' && e.mateId) body.push({ kind: 'newMate', key: k('n' + e.mateId), at: e.at, mateId: e.mateId, name: String(e.name || '') })
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

// ---- types (the list's sections), the web's typesOf -----------------------------------------------------------------

/** A type name as the server keeps it: one short line (spaces folded, 12 characters). */
export const cleanType = (v: string) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, 12)
/** The types in use, in the order they were formed (their earliest member), and the most used one (the form's default). */
export function typesOf(mates: Mate[] | null): { list: string[]; top: string } {
  const born = new Map<string, number>()
  const count = new Map<string, number>()
  for (const m of mates || []) {
    const g = cleanType(m.group || '')
    if (!g) continue
    const at = time(m.createdAt) || 0
    born.set(g, Math.min(born.get(g) ?? Infinity, at))
    count.set(g, (count.get(g) || 0) + 1)
  }
  const list = [...born.keys()].sort((a, b) => (born.get(a)! - born.get(b)!) || a.localeCompare(b, 'zh-CN'))
  const top = list.slice().sort((a, b) => (count.get(b)! - count.get(a)!) || list.indexOf(a) - list.indexOf(b))[0] || ''
  return { list, top }
}

// ---- the conversation as IM ----------------------------------------------------------------------------------------

/** IM time: 15:43 today, 昨天 21:00, 10/1 09:00 (2025/10/1 09:00 another year). */
export function imTime(iso?: string): string {
  const d = new Date(String(iso || ''))
  if (!iso || !Number.isFinite(d.getTime())) return ''
  const now = new Date()
  const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  const same = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (same(d, now)) return fmtTime(iso)
  if (same(d, y)) return '昨天 ' + fmtTime(iso)
  return (d.getFullYear() === now.getFullYear() ? '' : d.getFullYear() + '/') + (d.getMonth() + 1) + '/' + d.getDate() + ' ' + fmtTime(iso)
}
/** Markdown as one line of plain words: fences, list and heading marks, table pipes and inline marks gone. */
export function plainOf(text: string): string {
  return String(text || '').replace(/```[\s\S]*?```/g, ' ').replace(/^\s*(#{1,6}|[-*+]|\d+[.、]|>)\s*/gm, '').replace(/\|/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`~]+/g, '').replace(/\s+/g, ' ').trim()
}
/** The first sentence of some text, as plain words ('' when none). */
export function firstSentence(text: string): string {
  const plain = plainOf(text)
  const m = plain.match(/^.+?[。！？!?](?=\s|$|[^。！？!?])|^.+?\.(?=\s|$)/)
  return (m ? m[0] : plain).slice(0, 120)
}
/** A deliverable card's fields: its summary rows (label, value), six at most, each value whole on one line (24 characters). */
export function fieldsOf(d: Deliverable): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = []
  const rows = d && Array.isArray(d.summary) ? d.summary : []
  for (const r of rows) {
    const label = String((r && r.label) || '').trim()
    const raw = String(r && r.value !== undefined && r.value !== null ? r.value : '').trim()
    if (!label || !raw) continue
    out.push({ label, value: raw.length > 24 ? raw.slice(0, 23) + '…' : raw })
    if (out.length >= 6) break
  }
  return out
}
/** When a run last asked for attention (the server's attentionOf): finished, a question pending. */
export function attentionMs(r: Run): number {
  let best = 0
  if (r.status === 'done') best = Math.max(best, time(r.finishedAt))
  if (r.status === 'waiting') for (const e of Array.isArray(r.activity) ? r.activity : []) if (e && e.kind === 'ask') best = Math.max(best, time(e.at))
  return best
}
/**
 * 「以下是新的」: when the teammate was unread on opening, the first run that asked for attention after this phone last had
 * it open (else the run carrying its attention time, else the last run). '' when nothing is new.
 */
export function firstNewRun(runs: Run[], visit: { unread: boolean; seenAt: number; attentionAt: string }): string {
  if (!visit.unread || !runs.length) return ''
  if (visit.seenAt) { const r = runs.find((x) => attentionMs(x) > visit.seenAt); return r ? r.id : '' }
  const at = time(visit.attentionAt)
  const r = at ? runs.find((x) => attentionMs(x) >= at - 1000) : null
  return (r || runs[runs.length - 1]).id
}

// ---- a teammate's folder files ---------------------------------------------------------------------------------------

/** What the reading screen does with a folder file, by extension (the server reads these five): table | markdown | text | json | ''. */
export function fileKindOf(name: string): 'table' | 'markdown' | 'text' | 'json' | '' {
  const m = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/)
  const ext = m ? m[1] : ''
  return ext === 'csv' || ext === 'tsv' ? 'table' : ext === 'md' ? 'markdown' : ext === 'txt' ? 'text' : ext === 'json' ? 'json' : ''
}
/** How a folder file opens: 'text' read here · 'image' shown here · 'page' (HTML / PDF) and 'download' in the phone's browser. */
export function openKindOf(name: string): 'text' | 'image' | 'page' | 'download' {
  if (fileKindOf(name)) return 'text'
  const m = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/)
  const ext = m ? m[1] : ''
  return /^(png|jpe?g|gif|webp)$/.test(ext) ? 'image' : /^(html?|pdf)$/.test(ext) ? 'page' : 'download'
}
/**
 * CSV (or, with a tab, TSV) as rows of cells, RFC 4180 (the web's parseDelimited): quoted fields may hold the delimiter,
 * line breaks and doubled quotes; a leading BOM goes; blank lines are not rows.
 */
export function parseDelimited(text: string, delimiter = ','): string[][] {
  const s = String(text || '').replace(/^﻿/, '')
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  let start = true
  let any = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (quoted) {
      if (c !== '"') { cell += c; continue }
      if (s[i + 1] === '"') { cell += '"'; i++; continue }
      quoted = false
      continue
    }
    if (c === '"' && start) { quoted = true; start = false; any = true; continue }
    if (c === delimiter) { row.push(cell); cell = ''; start = true; any = true; continue }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++
      if (any) { row.push(cell); rows.push(row) }
      row = []; cell = ''; start = true; any = false
      continue
    }
    cell += c; start = false; any = true
  }
  if (any) { row.push(cell); rows.push(row) }
  return rows
}
const NUMERIC = /^[+\-−]?[¥$€£]?\s?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\s?[%‰]?$|^[+\-−]?\.\d+%?$/
/** A table file: the first row is the header, rows padded to the widest, numeric[j] when column j holds only numbers. */
export function tableOf(text: string, delimiter = ','): { header: string[]; rows: string[][]; numeric: boolean[] } {
  const all = parseDelimited(text, delimiter)
  const width = all.reduce((n, r) => Math.max(n, r.length), 0)
  const pad = (r: string[]) => Array.from({ length: width }, (_, j) => (r[j] === undefined ? '' : r[j]))
  const header = pad(all[0] || [])
  const rows = all.slice(1).map(pad)
  const numeric = header.map((_, j) => { const vals = rows.map((r) => r[j].trim()).filter(Boolean); return vals.length > 0 && vals.every((v) => NUMERIC.test(v)) })
  return { header, rows, numeric }
}
