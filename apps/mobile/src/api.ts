/**
 * MyWork mobile — the connection to the computer and the task API.
 *
 * The phone talks to the LAN gateway the desktop opens (设置 → MyWork → 手机): `http://<lan ip>:<port>`.
 * Login is dsh's own launch-token exchange: `GET /?token=…` answers with the session cookie, which the
 * platform's HTTP stack keeps and sends back. Everything after that is the same JSON API the web pages
 * use, under /mywork-tasks/api. The pairing (base URL + token) is kept in the secure store.
 */
import * as SecureStore from 'expo-secure-store'

export type Connection = { base: string; token: string; pairedAt: string }

export type Deliverable = { id: string; title: string; kind: string; createdAt: string; rating: number | null; markdown?: string; verification?: Verification | null }
export type Verification = { passed: boolean | null; checked: number; issues: number; notes: string; at: string }
export type Step = { name: string; tool?: string; count?: number; startedAt?: string; endedAt?: string }
export type Activity =
  | { at: string; kind: 'user'; text: string }
  | { at: string; kind: 'text'; text: string }
  | { at: string; kind: 'tool'; name: string; detail?: string; ok?: boolean; result?: string }
  | { at: string; kind: 'handoff'; target: 'task' | 'routine'; id: string; title: string; schedule?: string }
  | { at: string; kind: 'verify'; text: string }
export type Task = {
  id: string; title: string; scenario: string; input: string; status: 'queued' | 'running' | 'delivering' | 'verifying' | 'done'
  statusLabel: string; currentStep: string; error: string; summary?: string; createdAt: string; startedAt?: string; finishedAt?: string
  routineId?: string; quiet?: boolean; report?: boolean; source?: string; sessionId?: string
  steps: Step[]; activity?: Activity[]; deliverableIds: string[]; deliverables: Deliverable[]; verification?: Verification | null
}
export type Routine = { id: string; kind: 'task' | 'remind'; title: string; scheduleLabel: string; enabled: boolean; nextRunAt: string; once?: boolean; lastTaskId?: string; input?: string; runs?: { at: string; taskId?: string; changed?: boolean | null; error?: string; fired?: boolean }[] }
export type Reminder = { routineId: string; title: string; input: string; at: string }
export type TasksPayload = { items: Task[]; deliverables: Deliverable[]; reminders: Reminder[]; routines: Routine[] }

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

/** Exchange the launch token for the session cookie. Returns false when the computer refuses (token stale, gateway off). */
export async function login(c: Connection): Promise<boolean> {
  try {
    if (c.token) await fetch(`${c.base}/?token=${encodeURIComponent(c.token)}`, { credentials: 'include' })
    const r = await fetch(`${c.base}${PREFIX}/tasks`, { credentials: 'include' })
    return r.ok
  } catch { return false }
}

export class Api {
  constructor(public base: string) {}
  private async req<T>(path: string, body?: unknown): Promise<T> {
    const r = await fetch(this.base + PREFIX + path, body === undefined
      ? { credentials: 'include' }
      : { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) throw new ApiError(r.status, (data && data.error) || `HTTP ${r.status}`)
    return data as T
  }
  tasks() { return this.req<TasksPayload>('/tasks') }
  task(id: string) { return this.req<{ task: Task; deliverables: Deliverable[] }>('/task?id=' + encodeURIComponent(id)) }
  create(input: string) { return this.req<{ task?: Task; routine?: Routine }>('/create', { input }) }
  today() { return this.req<{ thread: Task | null }>('/today') }
  todaySay(text: string) { return this.req<{ thread: Task }>('/today/say', { text }) }
  say(id: string, text: string) { return this.req<{ task: Task }>('/say', { id, text }) }
  cancel(id: string) { return this.req<{ task: Task }>('/cancel', { id }) }
  rerun(id: string) { return this.req<{ task: Task }>('/rerun', { id }) }
  verify(id: string) { return this.req<{ task: Task }>('/verify', { id }) }
  rename(id: string, title: string) { return this.req<{ task: Task }>('/rename', { id, title }) }
  remove(id: string) { return this.req<{ removed: boolean }>('/remove', { id }) }
  rate(id: string, rating: number | null) { return this.req<{ deliverable: Deliverable }>('/rate', { id, rating }) }
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
export const isToday = (iso?: string) => { if (!iso) return false; const d = new Date(iso); const n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate() }
export const fmtDuration = (ms: number) => { if (!(ms > 0)) return '0s'; const s = Math.round(ms / 1000); if (s < 60) return s + 's'; const m = Math.floor(s / 60); return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m` }
