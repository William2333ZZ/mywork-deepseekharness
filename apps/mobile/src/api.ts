/**
 * MyWork mobile — the connection to the computer and the task API.
 *
 * The phone talks to the LAN gateway the desktop opens (设置 → MyWork → 手机): `http://<lan ip>:<port>`.
 * Every request carries the launch token from the QR as `Authorization: Bearer …`; the gateway holds
 * the dsh session for us, so nothing here depends on the platform's cookie jar. The API is the same
 * JSON API the web pages use, under /mywork-tasks/api (the teammate contract, TEAMMATES.md §9.8). The pairing
 * (base URL + token) is kept in the secure store.
 */
import * as SecureStore from 'expo-secure-store'
import { Relay, textToB64, type RelayInfo } from './relay'

/** The paired computer: its LAN gateway (base + phone token) and, when it offered one, the encrypted relay to reach it from anywhere. */
export type Connection = { base: string; token: string; pairedAt: string; relay?: RelayInfo }

/** A file a teammate handed over (§9.1 文件): it hangs off the run that made it; verification lands on it in the background. */
export type Deliverable = {
  id: string; title: string; kind: string; createdAt: string; rating: number | null; mateId?: string; runId?: string
  markdown?: string; verification?: Verification | null; summary?: { label: string; value: string }[] | null
  /** Set by the server while the background verifier works on it, when it says so. */
  verifying?: boolean
  /** The thread's copy carries the document's first paragraph, not the document. */
  excerpt?: string
}
export type Verification = { passed: boolean | null; checked: number; issues: number; notes: string; at: string; status?: string; pending?: boolean }
export type AskKind = 'text' | 'choice' | 'approval' | 'takeover'
/** The pending question a run stopped on (§9.2 找你卡); the mate's state is 'waiting' while it is open. */
export type Ask = { id: string; at: string; question: string; askKind: AskKind; options: string[]; detail: string }
export type AskActivity = { at: string; kind: 'ask'; id: string; status: 'pending' | 'answered' | 'superseded' | 'expired'; question: string; askKind: AskKind; options?: string[]; detail?: string; answer?: string; answeredAt?: string }
/**
 * One entry of a run's activity. `user` lines are what was said into the run after it started: a steer (a bubble), an
 * answer to a question (askId, shown on the card), the 24 h resume (auto) or a hidden system line (system).
 * `routine` is written when mywork_routine_create succeeds (the centred 「已安排」 line); `remind` is a reminder that fired.
 */
export type Activity =
  | { at: string; kind: 'user'; text: string; askId?: string; auto?: boolean; system?: boolean }
  | { at: string; kind: 'text'; text: string }
  | { at: string; kind: 'tool'; name: string; detail?: string; ok?: boolean; result?: string }
  | { at: string; kind: 'verify'; text: string }
  | { at: string; kind: 'routine'; action: 'created' | string; routineId: string; title: string; scheduleLabel?: string }
  | { at: string; kind: 'remind'; routineId: string; title: string; text?: string; acked?: boolean; ackedAt?: string }
  /** MyWork created a teammate in this run (mywork_mate_create). */
  | { at: string; kind: 'mate'; action: 'created' | string; mateId: string; name?: string }
  | AskActivity
export type MateState = 'idle' | 'working' | 'waiting'
/** A teammate (§9.1): one endless conversation, its own folder, its own routines. `group` names its section on the list ('' = 其他). */
export type Mate = {
  id: string; name: string; title: string; description: string; glyph: string; pinned: boolean; isDefault: boolean; notify: boolean; group: string
  /** The look picked on the computer (8 colours × 4 shapes); null: derived from the id, as on the web. */
  avatar?: { color?: string; shape?: string } | null
  createdAt: string; lastAt: string; preview: string; unread: boolean; state: MateState; step: string; since: string; ask: Ask | null; routineCount: number
  /** Results since this teammate was last opened (the IM badge); `attentionAt`: when it last asked for attention. */
  unreadCount?: number; attentionAt?: string
}
/** A teammate's look: one of 8 colours × 4 shapes (the web's picker). */
export type Look = { color: string; shape: string }
/** GET /mates/folder: the newest files in a teammate's folder (what it wrote with fs / bash), 30 at most. */
export type FolderItem = { name: string; path: string; size: number; modifiedAt: string }
/** GET /mates/file: one text file (csv / tsv / md / txt / json) of a teammate's folder, 512 KB at most. */
export type FolderFile = { path: string; name: string; size: number; modifiedAt: string; truncated: boolean; text: string }
/** GET /mates/link: a signed link to any file of a teammate's folder (10 minutes; HTML served sandboxed). */
export type FileLink = { url: string; name: string; size: number; modifiedAt: string; mime: string; expiresAt: string }
export type RunTrigger = 'user' | 'routine' | 'system'
/** One round of work inside a teammate's conversation (§9.8). Runs ascend by createdAt; quiet routine runs are left out. */
export type Run = {
  id: string; mateId: string; trigger: RunTrigger; routineId?: string; routineTitle?: string; status: 'running' | 'waiting' | 'done'
  input: string; activity: Activity[]; deliverables: Deliverable[]; verification: Verification | null; ask: Ask | null
  error: string; quiet?: boolean; step: string; createdAt: string; startedAt?: string; finishedAt?: string
  /** 'mywork': the first job MyWork handed over when it created this teammate. */
  via?: string
  /** True while the background verifier works on this run's files (status is already 'done' then). */
  verifying?: boolean
  /** Migrated old tasks may carry only a summary. */
  summary?: string
  /** The thread's lite copy of a finished run: tool calls left out (GET /run has them), counted here. */
  process?: { tools: number; groups: number; lite?: boolean }
}
export type ThreadPage = { runs: Run[]; nextBefore: string | null }
/** A routine's run receipt: a task routine's names its run `taskId`, a fired reminder's `runId`; read `runId || taskId`. */
export type RoutineRun = { at: string; runId?: string; taskId?: string; changed?: boolean | null; error?: string; fired?: boolean; quiet?: boolean; report?: boolean }
export type Routine = {
  id: string; mateId: string; kind: 'task' | 'remind'; title: string; input: string; scheduleLabel: string; enabled: boolean
  nextRunAt: string; lastRunAt?: string; schedule?: { type: string }; runs?: RoutineRun[]
}
export type ActivityKind = 'ask' | 'failed' | 'working' | 'done' | 'remind'
export type ActivityItem = { mateId: string; mateName: string; runId: string; at: string; text: string; kind: ActivityKind }
/** GET /activity: the bell's three groups. */
export type ActivityPayload = { needs: ActivityItem[]; working: ActivityItem[]; recent: ActivityItem[] }
export type SearchMessage = { mateId: string; runId: string; at: string; text: string }
export type SearchResult = { mates: Mate[]; messages: SearchMessage[]; files: Deliverable[]; routines: Routine[] }

const KEY = 'mywork.connection'

export async function loadConnection(): Promise<Connection | null> {
  try { const raw = await SecureStore.getItemAsync(KEY); return raw ? (JSON.parse(raw) as Connection) : null } catch { return null }
}
export async function saveConnection(c: Connection): Promise<void> { await SecureStore.setItemAsync(KEY, JSON.stringify(c)) }
export async function clearConnection(): Promise<void> { try { await SecureStore.deleteItemAsync(KEY) } catch { /* nothing to clear */ } }

/**
 * The QR on the computer is the relay's address with the pairing after `#`: `https://<relay>/#i=<pairing id>&k=<computer's
 * public key>&t=<phone token>` (the fragment never travels anywhere: the app reads it). Older codes, `http://<lan ip>:<port>
 * /?token=…` (optionally with `#r=<relay>&i=&k=`), still parse.
 */
export function parsePairText(text: string): { base: string; token: string; relay?: RelayInfo } | null {
  const t = text.trim()
  if (!t) return null
  const hash = t.indexOf('#')
  const main = hash >= 0 ? t.slice(0, hash) : t
  const frag: Record<string, string> = {}
  if (hash >= 0) for (const kv of t.slice(hash + 1).split('&')) { const i = kv.indexOf('='); if (i > 0) { try { frag[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1)) } catch { /* a bad escape: skip */ } } }
  try {
    const u = new URL(/^https?:\/\//.test(main) ? main : 'http://' + main)
    if (!u.hostname) return null
    const origin = `${u.protocol}//${u.host}`
    if (frag.i && frag.k && frag.t) return { base: origin, token: frag.t, relay: { url: origin, id: frag.i, pk: frag.k } }
    const relay = frag.r && frag.i && frag.k ? { url: frag.r, id: frag.i, pk: frag.k } : undefined
    return { base: origin, token: u.searchParams.get('token') || '', ...(relay ? { relay } : {}) }
  } catch { return null }
}

export class ApiError extends Error { constructor(public status: number, message: string) { super(message) } }

const PREFIX = '/mywork-tasks/api'

/**
 * Reach the paired computer and prove the pairing with one API call: through the encrypted relay (every pairing made
 * since the relay; any network), or, for an older Wi-Fi-only pairing, its LAN gateway. `relay` is the open line;
 * `reason` says what went wrong.
 */
export async function login(c: Connection): Promise<{ ok: boolean; reason: string; relay: Relay | null }> {
  if (!c.token) return { ok: false, reason: '配对码里没有令牌', relay: null }
  if (!c.relay) {
    try {
      const r = await fetch(`${c.base}${PREFIX}/mates`, { credentials: 'omit', headers: { authorization: `Bearer ${c.token}` } })
      return r.ok ? { ok: true, reason: '', relay: null } : { ok: false, reason: r.status === 401 ? '令牌不对或已过期，重新扫码' : `HTTP ${r.status}`, relay: null }
    } catch (e) { return { ok: false, reason: (e instanceof Error ? e.message : String(e)) + '；这是旧的配对码，重新扫一次电脑上的新码', relay: null } }
  }
  const relay = new Relay(c.relay, c.token)
  try {
    const r = await relay.request('GET', PREFIX + '/mates')
    if (r.status >= 200 && r.status < 300) return { ok: true, reason: '', relay }
    relay.close()
    return { ok: false, reason: r.status === 401 ? '令牌不对或已过期，重新扫码' : `中继：HTTP ${r.status}`, relay: null }
  } catch (e) { relay.close(); return { ok: false, reason: e instanceof Error ? e.message : String(e), relay: null } }
}

export class Api {
  /** `relay`: the open encrypted line to the computer (every pairing since the relay), else null (an older LAN pairing). */
  constructor(public base: string, private token: string, private relay: Relay | null = null) {}
  /** How this phone reaches the computer now. */
  get via(): 'lan' | 'relay' { return this.relay ? 'relay' : 'lan' }
  /** A file's bytes through the relay (signed links do not open in a browser from there): base64 and its type. */
  async raw(path: string): Promise<{ contentType: string; b64: string }> {
    if (!this.relay) throw new Error('只在中继上用')
    const r = await this.relay.request('GET', path)
    if (r.status < 200 || r.status >= 300) throw new ApiError(r.status, r.text || `HTTP ${r.status}`)
    return { contentType: r.contentType, b64: r.b64 || (r.text ? textToB64(r.text) : '') }
  }
  private async req<T>(path: string, body?: unknown): Promise<T> {
    if (this.relay) {
      const r = await this.relay.request(body === undefined ? 'GET' : 'POST', PREFIX + path, body === undefined ? undefined : JSON.stringify(body))
      let data: any = {}
      try { data = r.text ? JSON.parse(r.text) : {} } catch { /* not JSON */ }
      if (r.status < 200 || r.status >= 300) throw new ApiError(r.status, (data && data.error) || `HTTP ${r.status}`)
      return data as T
    }
    const auth = { authorization: `Bearer ${this.token}` }
    const r = await fetch(this.base + PREFIX + path, body === undefined
      ? { credentials: 'omit', headers: auth }
      : { method: 'POST', credentials: 'omit', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) throw new ApiError(r.status, (data && data.error) || `HTTP ${r.status}`)
    return data as T
  }
  // ---- teammates ----
  mates() { return this.req<{ items: Mate[] }>('/mates') }
  /** `group` names its type (the list's section); `avatar` its look. */
  mateCreate(description: string, opts: { name?: string; group?: string; avatar?: Look } = {}) { return this.req<{ mate: Mate }>('/mates/create', { description, ...(opts.name ? { name: opts.name } : {}), ...(opts.group ? { group: opts.group } : {}), ...(opts.avatar ? { avatar: opts.avatar } : {}) }) }
  /** `group`: up to 12 characters, '' clears it (the teammate goes back to 其他). */
  mateUpdate(id: string, patch: Partial<Pick<Mate, 'name' | 'title' | 'description' | 'pinned' | 'notify' | 'group'>> & { avatar?: Look }) { return this.req<{ mate: Mate }>('/mates/update', { id, ...patch }) }
  // ---- a teammate's folder ----
  folder(id: string) { return this.req<{ dir: string; items: FolderItem[] }>('/mates/folder?id=' + encodeURIComponent(id)) }
  /** A text file of the folder (tables, notes); 400 for other kinds, 404 when gone. */
  folderFile(id: string, path: string) { return this.req<FolderFile>('/mates/file?id=' + encodeURIComponent(id) + '&path=' + encodeURIComponent(path)) }
  /** A signed link to any file of the folder; open `base + url` (the gateway passes it through without a token). */
  fileLink(id: string, path: string) { return this.req<FileLink>('/mates/link?id=' + encodeURIComponent(id) + '&path=' + encodeURIComponent(path)) }
  /** The default mate refuses (400). */
  mateRemove(id: string) { return this.req<{ removed: boolean }>('/mates/remove', { id }) }
  /** A page of the conversation, runs ascending; `before` is the previous page's nextBefore. */
  thread(id: string, before?: string | null, limit = 20) { return this.req<ThreadPage>('/mates/thread?' + ['id=' + encodeURIComponent(id), before ? 'before=' + encodeURIComponent(before) : '', 'limit=' + limit].filter(Boolean).join('&')) }
  /** idle: a new run · working: steers the run (or waits behind a routine run) · waiting: answers the pending question. */
  say(id: string, text: string) { return this.req<{ mate: Mate; runId: string }>('/mates/say', { id, text }) }
  /** Cancels the active run; what was sent and not yet read stays queued. */
  stop(id: string) { return this.req<{ mate: Mate }>('/mates/stop', { id }) }
  /** An ask card's button: choice → the option, approval → 允许一次 / 拒绝, takeover → 我做完了. 400 when nothing is pending or the askId is stale. */
  answer(runId: string, askId: string, answer: string) { return this.req<{ run: Run }>('/answer', { id: runId, askId, answer }) }
  /** One run with its whole activity (the 过程 fold of a lite run). */
  run(id: string) { return this.req<{ run: Run }>('/run?id=' + encodeURIComponent(id)) }
  seen(mateId: string) { return this.req<{ id: string; seenAt: string }>('/seen', { id: mateId }) }
  activity() { return this.req<ActivityPayload>('/activity') }
  search(q: string) { return this.req<SearchResult>('/search?q=' + encodeURIComponent(q)) }
  // ---- files ----
  files(opts: { mate?: string; q?: string; since?: string } = {}) { const q = (['mate', 'q', 'since'] as const).filter((k) => opts[k]).map((k) => k + '=' + encodeURIComponent(String(opts[k]))).join('&'); return this.req<{ items: Deliverable[] }>('/files' + (q ? '?' + q : '')) }
  /** The file (with its body) and the run that made it (for the live verification state). */
  deliverable(id: string) { return this.req<{ deliverable: Deliverable; run: Run | null }>('/deliverable?id=' + encodeURIComponent(id)) }
  rate(id: string, rating: number | null) { return this.req<{ deliverable: Deliverable }>('/rate', { id, rating }) }
  // ---- routines (each belongs to one mate) ----
  routines(mateId: string) { return this.req<{ items: Routine[] }>('/routines?mate=' + encodeURIComponent(mateId)) }
  routineCreate(mateId: string, input: string) { return this.req<{ routine: Routine }>('/routines/create', { mateId, input }) }
  routineUpdate(id: string, input: string) { return this.req<{ routine: Routine }>('/routines/update', { id, input }) }
  routineRun(id: string) { return this.req<{ routine: Routine; runId?: string }>('/routines/run', { id }) }
  routineEnable(id: string, enabled: boolean) { return this.req<{ routine: Routine }>('/routines/enable', { id, enabled }) }
  routineRemove(id: string) { return this.req<{ removed: boolean }>('/routines/remove', { id }) }
  routineAck(id: string, at: string) { return this.req<{ routine: Routine }>('/routines/ack', { id, at }) }
}

/** Time helpers shared by the screens. */
export const fmtTime = (iso?: string) => { if (!iso) return ''; const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
export const fmtDate = (iso?: string) => { if (!iso) return ''; const d = new Date(iso); return `${d.getMonth() + 1}月${d.getDate()}日 ${fmtTime(iso)}` }
export const fmtDay = (iso?: string) => { if (!iso) return ''; const d = new Date(iso); return `${d.getMonth() + 1}月${d.getDate()}日` }
/** The column's time: HH:MM today, M/D otherwise. */
export const fmtWhen = (iso?: string) => { if (!iso) return ''; const d = new Date(iso); if (isNaN(d.getTime())) return ''; return isToday(iso) ? fmtTime(iso) : `${d.getMonth() + 1}/${d.getDate()}` }
export const isToday = (iso?: string) => { if (!iso) return false; const d = new Date(iso); const n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate() }
export const fmtDuration = (ms: number) => { if (!(ms > 0)) return '0s'; const s = Math.round(ms / 1000); if (s < 60) return s + 's'; const m = Math.floor(s / 60); return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m` }
