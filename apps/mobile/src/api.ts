/**
 * MyWork mobile — the connection to the computer and the task API.
 *
 * The phone talks to the LAN gateway the desktop opens (设置 → MyWork → 手机): `http://<lan ip>:<port>`.
 * Every request carries the launch token from the QR as `Authorization: Bearer …`; the gateway holds
 * the dsh session for us, so nothing here depends on the platform's cookie jar. The API is the same
 * JSON API the web pages use, under /mywork-tasks/api. The pairing (base URL + token) is kept in the
 * secure store.
 */
import * as SecureStore from 'expo-secure-store'

export type Connection = { base: string; token: string; pairedAt: string }

export type Deliverable = { id: string; title: string; kind: string; createdAt: string; rating: number | null; taskId?: string; scenario?: string; markdown?: string; verification?: Verification | null; summary?: { label: string; value: string }[] | null }
export type Verification = { passed: boolean | null; checked: number; issues: number; notes: string; at: string }
export type Step = { name: string; tool?: string; count?: number; startedAt?: string; endedAt?: string }
export type AskKind = 'text' | 'choice' | 'approval' | 'takeover'
/** The newest pending question a task stopped on (§2.7 找人); the task's status is 'waiting' while it is open. */
export type Ask = { id: string; at: string; question: string; askKind: AskKind; options: string[]; detail: string }
export type AskActivity = { at: string; kind: 'ask'; id: string; status: 'pending' | 'answered' | 'superseded' | 'expired'; question: string; askKind: AskKind; options?: string[]; detail?: string; answer?: string; answeredAt?: string }
export type Activity =
  | { at: string; kind: 'user'; text: string; askId?: string; auto?: boolean }
  | { at: string; kind: 'text'; text: string }
  | { at: string; kind: 'tool'; name: string; detail?: string; ok?: boolean; result?: string }
  | { at: string; kind: 'handoff'; target: 'task' | 'routine'; id: string; title: string; schedule?: string }
  | { at: string; kind: 'verify'; text: string }
  | AskActivity
export type Task = {
  id: string; title: string; scenario: string; input: string; status: 'queued' | 'running' | 'delivering' | 'verifying' | 'waiting' | 'done'
  statusLabel: string; currentStep: string; error: string; summary?: string; createdAt: string; startedAt?: string; finishedAt?: string
  routineId?: string; quiet?: boolean; report?: boolean; source?: string; sessionId?: string
  /** Column fields (2026-09-30): the latest sentence for the row's second line, the last meaningful activity, and whether something arrived unasked since the user last opened it. */
  preview?: string; lastAt?: string; unread?: boolean; attentionAt?: string; ask?: Ask | null
  steps: Step[]; activity?: Activity[]; deliverableIds: string[]; deliverables: Deliverable[]; verification?: Verification | null
}
export type RoutineRun = { at: string; taskId?: string; changed?: boolean | null; error?: string; fired?: boolean; quiet?: boolean; report?: boolean }
export type Routine = { id: string; kind: 'task' | 'remind'; title: string; scheduleLabel: string; enabled: boolean; nextRunAt: string; once?: boolean; lastTaskId?: string; input?: string; runs?: RoutineRun[]; preview?: string; lastAt?: string; unread?: boolean; lastRunSummary?: RoutineRun | null }
export type SearchResult = { tasks: Task[]; routines: Routine[]; deliverables: { id: string; taskId: string; title: string; createdAt: string; kind: string }[] }
export type Reminder = { routineId: string; title: string; input: string; at: string }
export type TasksPayload = { items: Task[]; deliverables: Deliverable[]; reminders: Reminder[]; routines: Routine[] }
/**
 * GET /feed (the 今日 line across days, server feed.js): the thread entries of every assistant task plus a reminder that
 * fired and a routine run that changed or wrote a report. Entries ascend by `at`, no date entries (the client draws the
 * separators); a page is the newest `limit` before `before`; `nextBefore` is the oldest returned `at`, null when nothing
 * older exists; `today` is the server's local day as YYYY-MM-DD.
 */
export type FeedEntry =
  | { at: string; kind: 'user'; text: string; taskId?: string }
  | { at: string; kind: 'text'; text: string; taskId?: string }
  | { at: string; kind: 'handoff'; target: 'task' | 'routine'; id: string; title: string; schedule?: string; followup?: boolean; taskId?: string }
  | { at: string; kind: 'remind'; routineId: string; title: string; acked?: boolean }
  | { at: string; kind: 'change'; routineId: string; taskId: string; title: string; report?: boolean }
export type FeedPayload = { entries: FeedEntry[]; nextBefore: string | null; today: string }

const KEY = 'mywork.connection'

export async function loadConnection(): Promise<Connection | null> {
  try { const raw = await SecureStore.getItemAsync(KEY); return raw ? (JSON.parse(raw) as Connection) : null } catch { return null }
}
export async function saveConnection(c: Connection): Promise<void> { await SecureStore.setItemAsync(KEY, JSON.stringify(c)) }
export async function clearConnection(): Promise<void> { try { await SecureStore.deleteItemAsync(KEY) } catch { /* nothing to clear */ } }

/** The QR on the computer carries `http://<ip>:<port>/?token=…`; a pasted address without a token is accepted too. */
export function parsePairText(text: string): { base: string; token: string } | null {
  const t = text.trim()
  if (!t) return null
  try {
    const u = new URL(/^https?:\/\//.test(t) ? t : 'http://' + t)
    if (!u.hostname) return null
    return { base: `${u.protocol}//${u.host}`, token: u.searchParams.get('token') || '' }
  } catch { return null }
}

export class ApiError extends Error { constructor(public status: number, message: string) { super(message) } }

const PREFIX = '/mywork-tasks/api'

/** Prove the pairing with one API call. `reason` says what went wrong. */
export async function login(c: Connection): Promise<{ ok: boolean; reason: string }> {
  if (!c.token) return { ok: false, reason: '地址里没有令牌' }
  try {
    const r = await fetch(`${c.base}${PREFIX}/tasks`, { credentials: 'omit', headers: { authorization: `Bearer ${c.token}` } })
    return r.ok ? { ok: true, reason: '' } : { ok: false, reason: r.status === 401 ? '令牌不对或已过期，重新扫码' : `HTTP ${r.status}` }
  } catch (e) { return { ok: false, reason: e instanceof Error ? e.message : String(e) } }
}

export class Api {
  constructor(public base: string, private token: string) {}
  private async req<T>(path: string, body?: unknown): Promise<T> {
    const auth = { authorization: `Bearer ${this.token}` }
    const r = await fetch(this.base + PREFIX + path, body === undefined
      ? { credentials: 'omit', headers: auth }
      : { method: 'POST', credentials: 'omit', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) throw new ApiError(r.status, (data && data.error) || `HTTP ${r.status}`)
    return data as T
  }
  tasks() { return this.req<TasksPayload>('/tasks') }
  task(id: string) { return this.req<{ task: Task; deliverables: Deliverable[] }>('/task?id=' + encodeURIComponent(id)) }
  create(input: string) { return this.req<{ task?: Task; routine?: Routine }>('/create', { input }) }
  today(day?: string) { return this.req<{ thread: Task | null }>('/today' + (day ? '?day=' + encodeURIComponent(day) : '')) }
  /** The 今日 line by day; a 404 means the server still serves /today only, and the caller falls back to it. */
  feed(before?: string, limit?: number) { const q = [before ? 'before=' + encodeURIComponent(before) : '', limit ? 'limit=' + limit : ''].filter(Boolean).join('&'); return this.req<FeedPayload>('/feed' + (q ? '?' + q : '')) }
  seen(id: string) { return this.req<{ id: string; seenAt: string }>('/seen', { id }) }
  search(q: string) { return this.req<SearchResult>('/search?q=' + encodeURIComponent(q)) }
  todaySay(text: string) { return this.req<{ thread: Task }>('/today/say', { text }) }
  say(id: string, text: string) { return this.req<{ task: Task }>('/say', { id, text }) }
  /** Answer the question a waiting task stopped on: choice → the option text, approval → 允许一次 / 拒绝, takeover → 我做完了, text → what was typed. 400 when nothing is pending or the askId is stale. */
  answer(id: string, askId: string, answer: string) { return this.req<{ task: Task }>('/answer', { id, askId, answer }) }
  cancel(id: string) { return this.req<{ task: Task }>('/cancel', { id }) }
  rerun(id: string) { return this.req<{ task: Task }>('/rerun', { id }) }
  verify(id: string) { return this.req<{ task: Task }>('/verify', { id }) }
  rename(id: string, title: string) { return this.req<{ task: Task }>('/rename', { id, title }) }
  remove(id: string) { return this.req<{ removed: boolean }>('/remove', { id }) }
  rate(id: string, rating: number | null) { return this.req<{ deliverable: Deliverable }>('/rate', { id, rating }) }
  deliverables() { return this.req<{ items: Deliverable[] }>('/deliverables') }
  deliverable(id: string) { return this.req<{ deliverable: Deliverable; task: Task | null }>('/deliverable?id=' + encodeURIComponent(id)) }
  routines() { return this.req<{ items: Routine[]; pending: Reminder[] }>('/routines') }
  routineRun(id: string) { return this.req<{ routine: Routine }>('/routines/run', { id }) }
  routineEnable(id: string, enabled: boolean) { return this.req<{ routine: Routine }>('/routines/enable', { id, enabled }) }
  routineRemove(id: string) { return this.req<{ removed: boolean }>('/routines/remove', { id }) }
  routineAck(id: string, at: string) { return this.req<{ routine: Routine; pending: Reminder[] }>('/routines/ack', { id, at }) }
}

/** Time helpers shared by the screens. */
export const fmtTime = (iso?: string) => { if (!iso) return ''; const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
export const fmtDate = (iso?: string) => { if (!iso) return ''; const d = new Date(iso); return `${d.getMonth() + 1}月${d.getDate()}日 ${fmtTime(iso)}` }
export const fmtDay = (iso?: string) => { if (!iso) return ''; const d = new Date(iso); return `${d.getMonth() + 1}月${d.getDate()}日` }
/** The column's time: HH:MM today, M/D otherwise. */
export const fmtWhen = (iso?: string) => { if (!iso) return ''; const d = new Date(iso); if (isNaN(d.getTime())) return ''; return isToday(iso) ? fmtTime(iso) : `${d.getMonth() + 1}/${d.getDate()}` }
export const isToday = (iso?: string) => { if (!iso) return false; const d = new Date(iso); const n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate() }
export const fmtDuration = (ms: number) => { if (!(ms > 0)) return '0s'; const s = Math.round(ms / 1000); if (s < 60) return s + 's'; const m = Math.floor(s / 60); return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m` }
