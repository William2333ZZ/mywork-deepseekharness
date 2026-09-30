/**
 * MyWork mobile — the thread logic, ported from the web client (packages/tasks/src/client/thread.cjs and the
 * helpers in index.js) so the phone reads a task exactly as the desktop does. Pure functions, no React.
 *
 *   threadOf(task, deliverables) → entries        user · deliver · text · thinking · failed
 *   verifyState(task)                              what the meta line under a delivery may say, read live
 *   handoffState(task)                             what a hand-off row says about its task right now
 *   todayRows(items, deliverables, reminders)      the 等你看 list: reminders → failures / 等你答 → issues → running → delivered
 *   phasesOf(task) / describe(name, detail)        the 过程 fold: tool calls folded by verb
 */
import { fmtDuration, isToday, type Activity, type AskActivity, type AskKind, type Deliverable, type FeedEntry, type Reminder, type Task } from './api'

export const time = (iso?: string) => { const n = iso ? new Date(iso).getTime() : NaN; return Number.isFinite(n) ? n : 0 }
export const elapsedOf = (t: Task) => fmtDuration(time(t.finishedAt || new Date().toISOString()) - time(t.startedAt || t.createdAt))
export const isReport = (t: Task) => !!(t.report || (t.deliverables || []).some((d) => d.kind === 'report'))
export const isCancelled = (err?: string) => /已取消/.test(String(err || ''))

// ---- verification ----------------------------------------------------------

export type VerifyKind = 'verifying' | 'passed' | 'issues' | 'none' | ''
export type VerifyState = { kind: VerifyKind; checked: number; issues: number; notes: string }

/**
 * Read from the task (the live copy), never from a stale deliverable: nothing reads 已核验 before the verifier stamped it.
 *   verifying  task.status is 'verifying', or nothing is stamped yet and the task is not done
 *   passed / issues / none  the verdict; '' a done task that was never verified
 */
export function verifyState(task: Task | null | undefined): VerifyState {
  const t = task || ({} as Partial<Task>)
  const v = t.verification && typeof t.verification === 'object' ? t.verification : null
  const done = t.status === 'done'
  const empty = (kind: VerifyKind): VerifyState => ({ kind, checked: 0, issues: 0, notes: '' })
  if (t.status === 'verifying') return empty('verifying')
  if (!v) return done ? empty('') : empty('verifying')
  const checked = Number(v.checked) || 0
  const issues = Number(v.issues) || 0
  const notes = typeof v.notes === 'string' ? v.notes : ''
  if (v.passed === true) return { kind: 'passed', checked, issues, notes }
  if (v.passed === false) return { kind: 'issues', checked, issues, notes }
  return { kind: 'none', checked, issues, notes }
}

/** The words of the verification line: 核验中 / 已核验 · 核对 n · 问题 m / 核验发现 n 处 / 未能核验. */
export function verifyWords(v: VerifyState): string {
  if (v.kind === 'verifying') return '核验中'
  if (v.kind === 'passed') return ['已核验', `核对 ${v.checked}`, `问题 ${v.issues}`].join(' · ')
  if (v.kind === 'issues') return `核验发现 ${v.issues || 0} 处`
  if (v.kind === 'none') return '未能核验'
  return ''
}

/** The verdict word for the meta line under the title. */
export function verdictWord(task: Task): string {
  const v = task.verification
  if (task.status === 'verifying') return '核验中'
  if (!v) return ''
  return v.passed === true ? '已核验' : v.passed === false ? `核验发现 ${v.issues || 0} 处` : '未能核验'
}

// ---- the task thread -------------------------------------------------------

export type AskStatus = 'pending' | 'answered' | 'superseded' | 'expired'
export type ThreadEntry =
  | { kind: 'user'; key: string; at: string; text: string }
  | { kind: 'deliver'; key: string; at: string; d: Deliverable; verify: VerifyState }
  | { kind: 'text'; key: string; at: string; text: string }
  | { kind: 'ask'; key: string; at: string; id: string; status: AskStatus; question: string; askKind: AskKind; options: string[]; detail: string; answer: string; answerable: boolean }
  | { kind: 'auto'; key: string; at: string }
  | { kind: 'thinking'; key: string; at: string; step: string }
  | { kind: 'failed'; key: string; at: string; reason: string }

/** An ask entry's status; legacy entries without one are open until they carry an answer (store.isPendingAsk). */
function askStatus(a: AskActivity): AskStatus {
  if (a.status === 'pending' || a.status === 'answered' || a.status === 'superseded' || a.status === 'expired') return a.status
  return a.answer ? 'answered' : 'pending'
}

/**
 * The task page as one thread: what you said, what came back, in time order (thread.cjs, faithfully).
 * A run is what one user line started: task.input opens the first, each follow-up the next. The line that answers a
 * question (askId) and the 24 h resume (auto) do not open a run and are not bubbles: the question shows its answer.
 * Deliverables belong to the run whose window holds their createdAt. Text after the run's last deliverable or question
 * is the reply; text before them is narration and stays in 过程. A question the task stopped on (§2.7 找人) sits at its
 * time as the 需要你 card; only the newest pending one of a waiting task is answerable, older pending ones read as
 * superseded. While the task waits, the card speaks instead of the 在做 line.
 */
export function threadOf(task: Task | null | undefined, deliverables?: Deliverable[] | null): ThreadEntry[] {
  const t = task || ({} as Partial<Task>)
  const activity: Activity[] = Array.isArray(t.activity) ? t.activity : []
  const done = t.status === 'done'
  const docs = (Array.isArray(deliverables) && deliverables.length ? deliverables : Array.isArray(t.deliverables) ? t.deliverables : [])
    .filter((d) => d && typeof d === 'object').slice().sort((a, b) => time(a.createdAt) - time(b.createdAt))
  const verify = verifyState(task)
  const waiting = t.status === 'waiting'
  // The one question that can still be answered: the newest pending ask, and only while the task waits on it.
  let newestPending: AskActivity | null = null
  for (const e of activity) if (e && e.kind === 'ask' && askStatus(e) === 'pending') newestPending = e

  type Run = { at: string; text: string; entries: Activity[] }
  const runs: Run[] = [{ at: t.createdAt || '', text: String(t.input || ''), entries: [] }]
  for (const e of activity) {
    if (!e || typeof e !== 'object') continue
    if (e.kind === 'user' && !e.askId && !e.auto) { runs.push({ at: e.at || '', text: String(e.text || ''), entries: [] }); continue }
    runs[runs.length - 1].entries.push(e)
  }

  const out: ThreadEntry[] = []
  let seq = 0
  runs.forEach((run, i) => {
    const last = i === runs.length - 1
    const start = time(run.at)
    const end = last ? Infinity : time(runs[i + 1].at)
    out.push({ kind: 'user', key: 'u' + i, at: run.at, text: run.text })
    const body: ThreadEntry[] = []
    const mine = docs.filter((d) => { const c = time(d.createdAt); return (i === 0 || c >= start) && c < end })
    for (const d of mine) body.push({ kind: 'deliver', key: 'd' + (d.id || seq++), at: d.createdAt || run.at, d, verify })
    const asks = run.entries.filter((e): e is AskActivity => e.kind === 'ask')
    for (const a of asks) {
      let status = askStatus(a)
      if (status === 'pending' && a !== newestPending) status = 'superseded' // only the newest question is open
      body.push({
        kind: 'ask', key: 'a' + (a.id || seq++), at: a.at || '', id: String(a.id || ''), status,
        question: String(a.question || ''), askKind: a.askKind || 'text', options: Array.isArray(a.options) ? a.options.map(String) : [],
        detail: typeof a.detail === 'string' ? a.detail : '', answer: a.answer === undefined || a.answer === null ? '' : String(a.answer),
        answerable: status === 'pending' && waiting,
      })
    }
    for (const e of run.entries) if (e.kind === 'user' && e.auto) body.push({ kind: 'auto', key: 'r' + seq++, at: e.at || '' })
    // Text before the run's last deliverable or question is narration (过程); what comes after it is the reply.
    const cut = Math.max(mine.length ? time(mine[mine.length - 1].createdAt) : -Infinity, asks.length ? time(asks[asks.length - 1].at) : -Infinity)
    const texts = run.entries.filter((e): e is Extract<Activity, { kind: 'text' }> => e.kind === 'text' && !!String(e.text || '').trim())
    if (mine.length) {
      for (const e of texts) if (time(e.at) > cut) body.push({ kind: 'text', key: 't' + seq++, at: e.at, text: String(e.text) })
    } else if (!(last && !done)) {
      const final = texts[texts.length - 1]
      if (final && time(final.at) > cut) body.push({ kind: 'text', key: 't' + seq++, at: final.at, text: String(final.text) })
      else if (!final && i === 0 && last && done && !t.error && !docs.length && !activity.some((e) => e && e.kind === 'text') && String(t.summary || '').trim()) {
        body.push({ kind: 'text', key: 't' + seq++, at: t.finishedAt || run.at, text: String(t.summary) })
      }
    }
    // In time order; entries stamped at the same moment keep the order above (deliverable, question, resume, reply).
    body.map((e, n) => ({ e, n, at: time(e.at) })).sort((a, b) => a.at - b.at || a.n - b.n).forEach((x) => out.push(x.e))
  })

  if (!done && !waiting) out.push({ kind: 'thinking', key: 'thinking', at: '', step: String(t.currentStep || t.statusLabel || '') })
  else if (done && t.error) out.push({ kind: 'failed', key: 'failed', at: t.finishedAt || '', reason: String(t.error) })
  return out
}

// ---- hand-off rows in 今日 ---------------------------------------------------

export type HandoffLive = { spin?: boolean; glyph: 'time-outline' | 'close-circle-outline' | 'checkmark-outline' | 'chatbubble-ellipses-outline'; tone: 'live' | 'danger' | 'success' | 'warn'; sub: string; failed?: boolean }

/** What a hand-off line says about its task right now: running step · time, 等你答 · the question, 已交付 · 已核验, 已回答, or 失败. */
export function handoffState(task: Task | null | undefined): HandoffLive | null {
  if (!task) return null
  if (task.status === 'waiting') return { glyph: 'chatbubble-ellipses-outline', tone: 'warn', sub: '等你答' + (task.ask && task.ask.question ? ' · ' + task.ask.question : '') }
  if (task.status !== 'done') return { spin: true, glyph: 'time-outline', tone: 'live', sub: (task.currentStep || task.statusLabel) + ' · ' + elapsedOf(task) }
  if (task.error) return { glyph: 'close-circle-outline', tone: 'danger', sub: (isCancelled(task.error) ? '已取消' : '失败 · ' + String(task.error).slice(0, 80)), failed: !isCancelled(task.error) }
  const v = task.verification
  if (task.deliverables && task.deliverables.length) return { glyph: 'checkmark-outline', tone: 'success', sub: '已交付' + (v ? (v.passed === true ? ' · 已核验' : v.passed === false ? ' · 核验发现问题' : '') : '') }
  return { glyph: 'checkmark-outline', tone: 'success', sub: '已回答' }
}

// ---- 等你看 -------------------------------------------------------------------

export type TodayRow = {
  key: string; rank: number; needs?: boolean; at: string
  glyph?: 'notifications-outline' | 'close-circle-outline' | 'chatbubble-ellipses-outline' | 'alert-circle-outline' | 'checkmark-circle-outline'
  tone?: 'live' | 'success' | 'danger' | 'warn' | 'meta'; spin?: boolean
  title: string; sub?: string; state?: string; stateTone?: 'warn' | 'danger'
  action?: { kind: 'ack'; reminder: Reminder } | { kind: 'rerun'; id: string }
  open?: { kind: 'task' | 'routine'; id: string }
}
export type TodayCounts = { waiting: number; running: number; delivered: number; needs: boolean }

export const failedToday = (t: Task) => t.status === 'done' && !!t.error && !isCancelled(t.error) && isToday(t.finishedAt || t.createdAt)

/** The web's todayRows: reminders, failures and 等你答, verification issues, running, delivered today; the bar's counts read every row. */
export function todayRows(items: Task[], deliverables: Deliverable[], reminders: Reminder[]): { rows: TodayRow[]; more: number; unrated: number; counts: TodayCounts } {
  const rows: TodayRow[] = []
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
  for (const r of reminders || []) rows.push({ key: 'r' + r.routineId + r.at, rank: 0, needs: true, at: r.at, glyph: 'notifications-outline', tone: 'live', title: r.title, sub: '提醒 · ' + hhmm(r.at), action: { kind: 'ack', reminder: r }, open: { kind: 'routine', id: r.routineId } })
  for (const x of items) {
    if (x.scenario === 'assistant') continue
    const done = x.status === 'done'
    const when = new Date(x.finishedAt || x.createdAt)
    if (failedToday(x)) rows.push({ key: 'f' + x.id, rank: 1, needs: true, at: x.finishedAt || x.createdAt, glyph: 'close-circle-outline', tone: 'danger', title: x.title, sub: x.error, action: { kind: 'rerun', id: x.id }, open: { kind: 'task', id: x.id } })
    else if (x.status === 'waiting' || (!done && x.attentionAt)) rows.push({ key: 'a' + x.id, rank: 1, needs: true, at: x.attentionAt || x.createdAt, glyph: 'chatbubble-ellipses-outline', tone: 'warn', title: x.title, sub: x.ask ? x.ask.question : undefined, state: '等你答', stateTone: 'warn', open: { kind: 'task', id: x.id } }) // 等你答: no button, the card in the thread answers
    else if (done && x.verification && x.verification.passed === false && when >= dayStart) rows.push({ key: 'v' + x.id, rank: 2, at: x.finishedAt || x.createdAt, glyph: 'alert-circle-outline', tone: 'warn', title: x.title, state: '核验发现问题', stateTone: 'warn', open: { kind: 'task', id: x.id } })
    else if (!done) rows.push({ key: 'l' + x.id, rank: 3, at: x.createdAt, spin: true, title: x.title, state: (x.currentStep || x.statusLabel) + ' · ' + elapsedOf(x), open: { kind: 'task', id: x.id } })
    else if (done && when >= dayStart) rows.push({ key: 'd' + x.id, rank: 4, at: x.finishedAt || x.createdAt, glyph: 'checkmark-circle-outline', tone: 'success', title: x.title, state: x.routineId && !isReport(x) ? (x.quiet ? '没有变化' : '有变化') : (x.deliverables.length ? '已交付' : '已回答'), open: { kind: 'task', id: x.id } })
  }
  rows.sort((a, b) => a.rank - b.rank || time(b.at) - time(a.at))
  const unrated = (deliverables || []).filter((d) => d.rating === null || d.rating === undefined).length
  const counts: TodayCounts = { waiting: rows.filter((r) => r.rank <= 2).length, running: rows.filter((r) => r.rank === 3).length, delivered: rows.filter((r) => r.rank === 4).length, needs: rows.some((r) => !!r.needs) }
  return { rows: rows.slice(0, 10), more: Math.max(0, rows.length - 10), unrated, counts }
}
const hhmm = (iso: string) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }

// ---- the column --------------------------------------------------------------

/** Only what the user asked for: the day's conversation is the 今日 row, routine runs live behind their routine. */
export const isMine = (t: Task) => t.scenario !== 'assistant' && !t.routineId

/** The 今日 row's second line when something is going on: 「2 个在跑 · 1 份等你看」, else ''. */
export function todayCounts(items: Task[], reminders: Reminder[]): string {
  const mine = items.filter(isMine)
  const running = mine.filter((x) => x.status !== 'done').length
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
  const waiting = (reminders || []).length + mine.filter((x) => x.status === 'done' && time(x.finishedAt || x.createdAt) >= dayStart.getTime()
    && ((!!x.error && !isCancelled(x.error)) || (x.verification && x.verification.passed === false))).length
  return [running > 0 ? `${running} 个在跑` : '', waiting > 0 ? `${waiting} 份等你看` : ''].filter(Boolean).join(' · ')
}

// ---- 今日's line: the client's side of GET /feed (thread.cjs, faithfully) --------------------------------------------
// Entries come from the server ascending by `at` with no date entries; the client keeps everything it has fetched,
// shows from a cut-off (`from`, local midnight of the oldest day revealed) and draws the separators itself.

const pad2 = (n: number) => String(n).padStart(2, '0')
/** Local calendar day of an ISO stamp as YYYY-MM-DD ('' when unparsable): what separators and 「今天」 compare by. */
export function localDay(iso: string): string { const d = new Date(iso); if (!Number.isFinite(d.getTime())) return ''; return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) }
const parts = (day: string) => String(day || '').split('-').map(Number)
/** Local midnight that starts a YYYY-MM-DD day, as ISO. */
export function dayStartIso(day: string): string { const [y, m, d] = parts(day); return new Date(y || 1970, (m || 1) - 1, d || 1).toISOString() }
/** The YYYY-MM-DD day `n` days after `day`. */
export function shiftDay(day: string, n: number): string { const [y, m, d] = parts(day); return localDay(new Date(y || 1970, (m || 1) - 1, (d || 1) + n).toISOString()) }
/** 「9/29」 for a YYYY-MM-DD day. */
export function shortDay(day: string): string { const [, m, d] = parts(day); return (m || 0) + '/' + (d || 0) }
/** Identity of a feed entry across pages and polls: kind, stamp and the thing it points at. */
export function feedKey(e: FeedEntry): string { const ref = 'id' in e ? e.id : 'routineId' in e ? e.routineId : e.taskId || ''; return e.kind + '|' + (e.at || '') + '|' + ref }
/** Merge a page into what is loaded: the same key replaces (a reminder's ack lands this way), the rest joins; ascending by at. */
export function mergeFeed(existing: FeedEntry[], incoming: FeedEntry[]): FeedEntry[] {
  const map = new Map<string, FeedEntry>()
  for (const e of existing || []) if (e) map.set(feedKey(e), e)
  for (const e of incoming || []) if (e) map.set(feedKey(e), e)
  return [...map.values()].sort((a, b) => time(a.at) - time(b.at))
}
/** The day of the newest loaded entry before `from` (ISO): what 「加载昨天」 reveals next; '' when nothing is loaded there. */
export function olderDayOf(entries: FeedEntry[], from: string): string {
  const cut = time(from)
  let best: FeedEntry | null = null
  for (const e of entries || []) { if (!e) continue; const at = time(e.at); if (at < cut && (!best || at > time(best.at))) best = e }
  return best ? localDay(best.at) : ''
}
export type FeedRow = (FeedEntry & { key: string; today: boolean }) | { kind: 'date'; key: string; at: string; day: string; label: string }
/**
 * What the line renders: the entries from `from` on, each with its key and a `today` flag, and one date separator
 * before the first entry of every day but today — 「昨天 · 9/29」, then 「9/28」.
 */
export function feedRows(entries: FeedEntry[], from: string, today: string, yesterdayWord = '昨天'): FeedRow[] {
  const cut = time(from)
  const out: FeedRow[] = []
  let day = ''
  for (const e of entries || []) {
    if (!e || time(e.at) < cut) continue
    const d = localDay(e.at)
    if (d !== day) { day = d; if (d && d !== today) out.push({ kind: 'date', key: 'date|' + d, at: e.at, day: d, label: d === shiftDay(today, -1) ? yesterdayWord + ' · ' + shortDay(d) : shortDay(d) }) }
    out.push({ ...e, key: feedKey(e), today: d === today })
  }
  return out
}

// ---- 过程 ----------------------------------------------------------------------

export type ToolAct = Extract<Activity, { kind: 'tool' }>
export type Phase = { kind: 'phase'; verb: string; obj: string; items: ToolAct[]; at: string; endAt: string; ms: number; failed: number }
export type PhaseRow = Phase | Extract<Activity, { kind: 'text' | 'handoff' | 'verify' }>

/** The run as phases: consecutive tool calls with the same verb fold into one line; a note, a hand-off and the verifier's note are lines of their own. */
export function phasesOf(task: Task): PhaseRow[] {
  const list = Array.isArray(task.activity) ? task.activity : []
  const end = task.finishedAt || new Date().toISOString()
  const out: PhaseRow[] = []
  for (const e of list) {
    if (e.kind === 'tool') {
      const d = describe(e.name, e.detail)
      const last = out[out.length - 1]
      if (last && last.kind === 'phase' && last.verb === d.verb) { last.items.push(e); if (d.obj) last.obj = d.obj; if (e.ok === false) last.failed++; continue }
      out.push({ kind: 'phase', verb: d.verb, obj: d.obj, items: [e], at: e.at, endAt: end, ms: 0, failed: e.ok === false ? 1 : 0 })
      continue
    }
    if (e.kind === 'text' || e.kind === 'handoff' || e.kind === 'verify') out.push(e)
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
  return { verb: n, obj: String(detail || '').slice(0, 70) }
}

/** Arguments arrive as a JSON string (possibly truncated) or as key=value pairs. */
function parseArgs(raw?: string): Record<string, unknown> {
  const t = String(raw || '').trim()
  const out: Record<string, unknown> = {}
  if (t.startsWith('{')) {
    try { return JSON.parse(t) as Record<string, unknown> } catch { /* truncated: pick the fields we show */ }
    const m = t.match(/"(url|href|file_path|path|title|query|command|pattern|description)"\s*:\s*"([^"]{1,200})/)
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
