/**
 * dsh-mywork-tasks — durable stores for tasks and deliverables.
 *
 *   $DSH_HOME/mywork/tasks.json         { version, items: Task[] }
 *   $DSH_HOME/mywork/deliverables.json  { version, items: Deliverable[] }
 *   $DSH_HOME/mywork/seen.json          { $since, [taskId | routineId]: ISO }   read state of the conversation column
 *
 * Task       { id, title, scenario, input, status, steps[], sessionId, deliverableIds[],
 *              createdAt, startedAt, finishedAt, error, summary }
 * Step       { name, tool, count, startedAt, endedAt }
 * Deliverable{ id, taskId, title, kind, scenario, markdown, data, createdAt, rating, verification }
 *
 * Status is one of STATUSES; a failed task is `done` with `error` set. `waiting` (等你答, §2.7 找人) is a
 * task stopped on a question: it keeps its session, holds no concurrency slot, and resumes through say().
 *
 * Ask entry (activity kind 'ask', written by the mywork_ask tool):
 *   { kind:'ask', id, at, status:'pending'|'answered'|'superseded'|'expired', question, askKind:'choice'|'text'|'approval'|'takeover',
 *     options?, detail?, answer?, answeredAt? }
 * Ask entries are never trimmed: the ≤2-per-task rule and the thread both count on them staying.
 *
 * The activity stream is two things at once: the thread a person reads back (user / text / handoff /
 * verify / ask entries) and the noise of the run (tool calls). Trimming may drop the noise, never the
 * thread, so an old 今日 or task page still reads as a conversation.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'

export const STATUSES = ['queued', 'running', 'delivering', 'verifying', 'waiting', 'done']
export const STATUS_LABELS = { queued: '排队', running: '执行', delivering: '交付', verifying: '核验', waiting: '等你答', done: '完成' }
/** 找人 (§2.7) hard limits, enforced by the mywork_ask tool: the question, each option, the detail block, asks per task, and how long an answer is waited for. */
export const ASK_KINDS = ['text', 'choice', 'approval', 'takeover']
export const ASK_QUESTION_MAX = 120
export const ASK_OPTION_MAX = 12
export const ASK_OPTIONS_MIN = 2
export const ASK_OPTIONS_MAX = 4
export const ASK_DETAIL_MAX = 500
export const ASK_MAX_PER_TASK = 2
export const ASK_EXPIRY_MS = 24 * 3600000
const MAX_TASKS = 500
const MAX_DELIVERABLES = 1000
const MAX_SEEN = 2000
/** Tasks that keep their tool calls in the activity stream; older done tasks keep only the thread. Quiet routine runs do not count. */
const ACTIVITY_KEEP = 60
/** Entries per task, tool calls included; the oldest tool calls go first. */
export const ACTIVITY_MAX = 120
/** Thread entries per task (what a person reads back). A busy 今日 is 20–30 exchanges, so this is well above one day; the oldest go first. */
export const ACTIVITY_THREAD_MAX = 80
export const ACTIVITY_TEXT_MAX = 2000
export const ACTIVITY_DETAIL_MAX = 240
/** The second line of a conversation row. */
export const PREVIEW_MAX = 80
/** Entries a person reads back as the conversation; everything else (tool calls) is noise that trimming may drop. */
export const THREAD_KINDS = new Set(['user', 'text', 'handoff', 'verify', 'ask'])
export const isThreadEntry = (a) => !!a && THREAD_KINDS.has(a.kind)

export function myworkDir() { return join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'mywork') }
export function newId(prefix) { return prefix + '-' + Date.now().toString(36) + randomBytes(3).toString('hex') }

/** Epoch ms of an ISO stamp, -Infinity when missing or unparsable, so comparisons never trip on legacy values. */
export function ts(iso) { const n = Date.parse(String(iso || '')); return Number.isNaN(n) ? -Infinity : n }
/** The later of two ISO stamps (either may be empty). */
export function later(a, b) { return ts(b) > ts(a) ? b : (a || b || '') }

/**
 * Keep the stream inside its two budgets: the thread first (its oldest entries go only when the thread itself is too long),
 * then tool calls (the oldest go first). Ask entries are never dropped (§2.7): the ≤2-asks rule counts them, and a question
 * the task stopped on must stay readable.
 */
export function capActivity(list) {
  let thread = 0
  for (const a of list) if (isThreadEntry(a)) thread += 1
  for (let i = 0; i < list.length && thread > ACTIVITY_THREAD_MAX;) { if (isThreadEntry(list[i]) && list[i].kind !== 'ask') { list.splice(i, 1); thread -= 1 } else i += 1 }
  for (let i = 0; i < list.length && list.length > ACTIVITY_MAX;) { if (isThreadEntry(list[i])) i += 1; else list.splice(i, 1) }
  return list
}

/** Minimal JSON collection with atomic writes; `file` may be null for in-memory use (tests). */
export class JsonList {
  constructor(file, max) { this.file = file; this.max = max; this.items = []; this.load() }
  load() {
    if (!this.file || !existsSync(this.file)) return
    try { const d = JSON.parse(readFileSync(this.file, 'utf8')); this.items = Array.isArray(d && d.items) ? d.items : [] } catch { this.items = [] }
  }
  save() {
    if (this.items.length > this.max) this.items = this.items.slice(this.items.length - this.max)
    if (typeof this.beforeSave === 'function') this.beforeSave()
    if (!this.file) return
    mkdirSync(join(this.file, '..'), { recursive: true })
    const tmp = this.file + '.tmp'
    writeFileSync(tmp, JSON.stringify({ version: 1, items: this.items }, null, 2))
    renameSync(tmp, this.file)
  }
  get(id) { return this.items.find((t) => t.id === id) || null }
  list() { return this.items.slice().reverse() }
  add(item) { this.items.push(item); this.save(); return item }
  update(id, patch) {
    const item = this.get(id)
    if (!item) return null
    Object.assign(item, typeof patch === 'function' ? patch(item) || {} : patch)
    this.save()
    return item
  }
  remove(id) { const n = this.items.length; this.items = this.items.filter((t) => t.id !== id); if (this.items.length !== n) this.save(); return this.items.length !== n }
}

export class TaskStore extends JsonList {
  constructor(file) { super(file, MAX_TASKS) }
  create({ title, input, scenario, source, routineId }) {
    const text = String(input || '').trim()
    if (!text) throw new Error('input is required')
    return this.add({
      id: newId('task'), title: String(title || '').trim() || titleOf(text), scenario: scenario || 'general', input: text,
      status: 'queued', steps: [], activity: [], sessionId: '', deliverableIds: [], source: source || 'ui', routineId: routineId || '', quiet: false,
      createdAt: new Date().toISOString(), startedAt: '', finishedAt: '', error: '', summary: '',
    })
  }
  setStatus(id, status, extra) {
    if (!STATUSES.includes(status)) throw new Error('bad status: ' + status)
    return this.update(id, { status, ...(extra || {}) })
  }
  /** Append a step, or bump the count of the current step when it has the same name. */
  step(id, name, tool) {
    return this.update(id, (t) => {
      const now = new Date().toISOString()
      const last = t.steps[t.steps.length - 1]
      if (last && !last.endedAt && last.name === name) { last.count = (last.count || 1) + 1; return }
      if (last && !last.endedAt) last.endedAt = now
      t.steps.push({ name, tool: tool || '', count: 1, startedAt: now, endedAt: '' })
    })
  }
  /** Append one activity entry ({ kind: 'user' | 'text' | 'tool' | 'handoff' | 'verify' | 'ask', name?, detail?, text?, ok? }), text capped, stream capped. */
  activity(id, entry) {
    return this.update(id, (t) => {
      if (!Array.isArray(t.activity)) t.activity = []
      const e = { at: new Date().toISOString(), ...entry }
      if (typeof e.text === 'string' && e.text.length > ACTIVITY_TEXT_MAX) e.text = e.text.slice(0, ACTIVITY_TEXT_MAX - 1) + '…'
      // An ask's detail is data the person must read whole (an email body to confirm), so it keeps the tool's 500-char limit, not the tool-call preview cap.
      const detailMax = e.kind === 'ask' ? ASK_DETAIL_MAX : ACTIVITY_DETAIL_MAX
      for (const k of ['detail', 'result']) if (typeof e[k] === 'string' && e[k].length > detailMax) e[k] = e[k].slice(0, detailMax - 1) + '…'
      t.activity.push(e)
      capActivity(t.activity)
    })
  }
  /**
   * 找人 (§2.7): append a pending ask. Any older pending ask is superseded first — a task stops on one question at a
   * time. The caller (engine.ask) has already validated and trimmed the fields. Returns the stored entry (with id, at).
   */
  ask(id, { question, askKind, options, detail }) {
    this.update(id, (t) => { for (const a of Array.isArray(t.activity) ? t.activity : []) if (a && a.kind === 'ask' && isPendingAsk(a)) a.status = 'superseded' })
    const entry = { kind: 'ask', id: newId('ask'), status: 'pending', question: String(question), askKind: askKind || 'text', ...(Array.isArray(options) && options.length ? { options } : {}), ...(detail ? { detail } : {}) }
    this.activity(id, entry)
    const list = this.get(id).activity
    return list[list.length - 1] // asks are never trimmed, so the entry just pushed is the last one
  }
  /** Settle the newest pending ask as 'answered' (with the answer), 'expired' or 'superseded'. Returns the entry, or null when nothing was pending. */
  settleAsk(id, status, answer) {
    let hit = null
    this.update(id, (t) => {
      const a = pendingAsk(t)
      if (!a) return
      a.status = status
      if (status === 'answered') { a.answer = String(answer === undefined || answer === null ? '' : answer); a.answeredAt = new Date().toISOString() }
      hit = a
    })
    return hit
  }
  /** Put an answered ask back to pending (the resume that followed it failed, so nothing happened). */
  reopenAsk(id, askId) {
    return this.update(id, (t) => { for (const a of Array.isArray(t.activity) ? t.activity : []) if (a && a.kind === 'ask' && a.id === askId) { a.status = 'pending'; delete a.answer; delete a.answeredAt } })
  }
  /** How many times this task has asked, whatever became of the questions (the ≤2 rule counts attempts, not open questions). */
  askCount(id) { const t = this.get(id); return t && Array.isArray(t.activity) ? t.activity.filter((a) => a && a.kind === 'ask').length : 0 }
  /** Mark the latest open tool entry with its result. */
  activityResult(id, ok, text) {
    return this.update(id, (t) => {
      const list = Array.isArray(t.activity) ? t.activity : []
      for (let i = list.length - 1; i >= 0; i -= 1) { const e = list[i]; if (e.kind === 'tool' && e.ok === undefined) { e.ok = ok; if (text) e.result = String(text).slice(0, ACTIVITY_DETAIL_MAX); return } }
    })
  }
  /**
   * Older done tasks lose their tool calls, never their thread: an old 今日 or task page must still read
   * as a conversation. The keep window counts user-visible tasks only, so a routine that runs quietly
   * every hour cannot push them out of it.
   */
  beforeSave() {
    let kept = 0
    let i = this.items.length - 1
    for (; i >= 0 && kept < ACTIVITY_KEEP; i -= 1) if (!this.items[i].quiet) kept += 1
    for (; i >= 0; i -= 1) {
      const t = this.items[i]
      if (t.status !== 'done' || !Array.isArray(t.activity) || !t.activity.some((a) => !isThreadEntry(a))) continue
      t.activity = t.activity.filter(isThreadEntry)
    }
  }
  endSteps(id) { return this.update(id, (t) => { const now = new Date().toISOString(); for (const s of t.steps) if (!s.endedAt) s.endedAt = now }) }
  bySession(sessionId) { return this.items.find((t) => t.sessionId === sessionId) || null }
  active() { return this.items.filter((t) => t.status !== 'done') }
}

export class DeliverableStore extends JsonList {
  constructor(file) { super(file, MAX_DELIVERABLES) }
  create({ taskId, title, kind, scenario, markdown, data, summary }) {
    const body = String(markdown || '').trim()
    if (!body) throw new Error('markdown is required')
    // ✓ rows: at most six short label → value pairs; anything else is dropped rather than rendered badly.
    const rows = Array.isArray(summary) ? summary.filter((r) => r && typeof r === 'object' && String(r.label || '').trim()).slice(0, 6).map((r) => ({ label: String(r.label).trim().slice(0, 60), value: String(r.value === undefined || r.value === null ? '' : r.value).trim().slice(0, 60) })) : []
    return this.add({
      id: newId('dlv'), taskId: taskId || '', title: String(title || '').trim() || titleOf(body), kind: kind || 'markdown', scenario: scenario || 'general',
      markdown: body, data: data === undefined ? null : data, summary: rows.length ? rows : null, createdAt: new Date().toISOString(), rating: null, verification: null,
    })
  }
  forTask(taskId) { return this.items.filter((d) => d.taskId === taskId) }
}

/** First line of the text, trimmed of markdown heading marks, capped for a card title. */
export function titleOf(text) {
  const line = String(text || '').split('\n').map((l) => l.replace(/^#+\s*/, '').trim()).find(Boolean) || ''
  return line.length > 60 ? line.slice(0, 59) + '…' : line
}

/** One line of markdown as plain words: no heading marks, quote marks, bullets, table edges, emphasis, code ticks or link syntax. */
export function stripMarkdown(line) {
  const s = String(line || '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s*(?:[#>]+\s*)+/, '').replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/, '')
    .replace(/^\s*\|\s*|\s*\|\s*$/g, '').replace(/\s*\|\s*/g, ' · ')
    .replace(/`+/g, '').replace(/\*\*|__|~~/g, '').replace(/(^|[\s(（])[*_](?=\S)/g, '$1').replace(/(\S)[*_](?=[\s)）,.，。:：;；!！?？]|$)/g, '$1')
    .replace(/\s+/g, ' ').trim()
  return /^[\s\-—=·:|*_~`#>.]*$/.test(s) ? '' : s // a rule, a table separator or leftover marks is not a line
}
/** First line of a markdown text that says something, as plain words. */
export function plainLine(text) {
  for (const raw of String(text || '').split('\n')) { const line = stripMarkdown(raw); if (line) return line }
  return ''
}
/** One line, at most `max` characters, with an ellipsis when cut. */
export function clip(text, max = PREVIEW_MAX) {
  const s = String(text || '').replace(/\s+/g, ' ').trim()
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}
/** Does this line start with the task's title (case-insensitive)? The row already shows the title once. */
export function repeatsTitle(line, title) {
  const t = String(title || '').trim().toLowerCase()
  return !!t && String(line || '').trim().toLowerCase().startsWith(t)
}
/** First plain line of a reply that is not the task title again; the first line when every line is. */
export function replyLine(text, title) {
  let first = ''
  for (const raw of String(text || '').split('\n')) {
    const line = stripMarkdown(raw)
    if (!line) continue
    if (!repeatsTitle(line, title)) return line
    if (!first) first = line
  }
  return first
}
const findLast = (list, fn) => { for (let i = list.length - 1; i >= 0; i -= 1) if (fn(list[i])) return list[i]; return null }
const newestOf = (list) => list.reduce((best, d) => (!best || ts(d.createdAt) > ts(best.createdAt) ? d : best), null)
const currentStepOf = (t) => { const s = Array.isArray(t.steps) && t.steps.length ? t.steps[t.steps.length - 1] : null; return s && !s.endedAt ? s.name : '' }

/** Is this ask entry still open? Legacy entries without a status count as open until they carry an answer. */
export function isPendingAsk(a) { return !!a && a.kind === 'ask' && (a.status ? a.status === 'pending' : !a.answer) }
/** The ask the task is stopped on (§2.7 waiting): the newest pending kind 'ask' entry, or null. */
export function pendingAsk(t) {
  return findLast(Array.isArray(t && t.activity) ? t.activity : [], isPendingAsk)
}
/** What a card needs to ask the question: { id, at, question, askKind, options, detail }. `options` is always an array, `detail` always a string. */
export function askView(a) {
  return { id: a.id || '', at: a.at || '', question: String(a.question || ''), askKind: a.askKind || 'text', options: Array.isArray(a.options) ? a.options.slice() : [], detail: typeof a.detail === 'string' ? a.detail : '' }
}

/**
 * The second line of a conversation row: ≤80 characters, one line, plain words. One rule for every
 * task so the column reads the same everywhere:
 *   in flight   the current step, else the status word (核验 while verifying: nothing claims 已核验 early)
 *   failed      失败 · the reason
 *   waiting     the question it stopped on
 *   delivered   the newest deliverable's first summary row (label value), else 已交付 · 已核验 / 核验发现问题
 *               — the 核验 words come only from a live verdict (passed === true / false)
 *   answered    the first line of the last reply
 *   今日        the last thing said, prefixed 你： when it was the user's line; a failed turn that got no
 *               reply reads 失败 · reason, because that failure is the newest thing in the thread
 * A deliverable's title is never printed, and a reply line that starts with the task title is skipped:
 * the row shows the title once, on its first line.
 */
export function previewOf(task, deliverables) {
  const list = Array.isArray(deliverables) ? deliverables : []
  const activity = Array.isArray(task.activity) ? task.activity : []
  const status = task.status
  const failed = status === 'done' && !!task.error
  const failure = () => clip('失败 · ' + clip(plainLine(task.error) || String(task.error), 60))
  if (task.scenario === 'assistant') {
    const last = findLast(activity, (a) => a && (a.kind === 'user' || a.kind === 'text'))
    if (failed && (!last || last.kind === 'user')) return failure()
    if (!last) return ''
    const line = plainLine(last.text)
    return clip(last.kind === 'user' ? '你：' + line : line)
  }
  if (status === 'queued' || status === 'running' || status === 'delivering' || status === 'verifying') return clip(currentStepOf(task) || STATUS_LABELS[status] || status)
  if (status === 'waiting') { const ask = pendingAsk(task); return clip((ask && plainLine(ask.question || ask.text)) || '等你答') }
  if (failed) return failure()
  const newest = newestOf(list)
  if (newest) {
    const row = Array.isArray(newest.summary) ? newest.summary[0] : null
    if (row && String(row.label || '').trim()) return clip(`${String(row.label).trim()} ${String(row.value === undefined || row.value === null ? '' : row.value).trim()}`)
    const v = task.verification || newest.verification || null
    return '已交付' + (v && v.passed === true ? ' · 已核验' : v && v.passed === false ? ' · 核验发现问题' : '')
  }
  const text = findLast(activity, (a) => a && a.kind === 'text')
  return text ? clip(replyLine(text.text, task.title)) : ''
}

/** When something a person would notice last happened: a thread entry, a deliverable, a verdict, the end. Never a tool call or a step. */
export function lastAtOf(t, deliverables) {
  let best = t.createdAt || ''
  for (const a of Array.isArray(t.activity) ? t.activity : []) if (isThreadEntry(a)) best = later(best, a.at)
  for (const d of Array.isArray(deliverables) ? deliverables : []) best = later(best, d.createdAt)
  if (t.verification) best = later(best, t.verification.at)
  best = later(best, t.finishedAt)
  return best
}

/**
 * When the task last did something the user did not ask for at that moment: it finished (done or
 * failed), a verification was stamped, it stopped to ask, or (今日) the assistant wrote a reply.
 * Empty while the task runs and for quiet routine runs, so those rows never carry a dot.
 */
export function attentionOf(t) {
  if (t.quiet) return ''
  if (t.status !== 'done' && t.status !== 'waiting') return ''
  let best = ''
  if (t.status === 'done') best = later(best, t.finishedAt)
  if (t.verification) best = later(best, t.verification.at)
  const ask = pendingAsk(t)
  if (ask) best = later(best, ask.at)
  if (t.scenario === 'assistant') for (const a of Array.isArray(t.activity) ? t.activity : []) if (a && a.kind === 'text') best = later(best, a.at)
  return best
}

/**
 * Read state of the conversation column: { [taskId | routineId]: seenAt }. A row is unread when its
 * attentionAt is later than its seenAt. `$since` (when the file was born) stands in for a missing
 * seenAt, so upgrading does not light up every old row at once. `file` may be null (tests).
 */
export class SeenStore {
  constructor(file) {
    this.file = file; this.items = {}; this.since = ''
    this.load()
    if (!this.since) { this.since = new Date().toISOString(); this.save() }
  }
  load() {
    if (!this.file || !existsSync(this.file)) return
    try {
      const d = JSON.parse(readFileSync(this.file, 'utf8'))
      if (d && typeof d === 'object' && !Array.isArray(d)) { const { $since, ...rest } = d; this.since = typeof $since === 'string' ? $since : ''; this.items = {}; for (const [k, v] of Object.entries(rest)) if (typeof v === 'string') this.items[k] = v }
    } catch { this.items = {} }
  }
  save() {
    const keys = Object.keys(this.items)
    if (keys.length > MAX_SEEN) { keys.sort((a, b) => ts(this.items[a]) - ts(this.items[b])); for (const k of keys.slice(0, keys.length - MAX_SEEN)) delete this.items[k] }
    if (!this.file) return
    mkdirSync(join(this.file, '..'), { recursive: true })
    const tmp = this.file + '.tmp'
    writeFileSync(tmp, JSON.stringify({ $since: this.since, ...this.items }, null, 2))
    renameSync(tmp, this.file)
  }
  get(id) { return this.items[id] || '' }
  /** Stamp one or more ids as seen now (or at `at`); returns the stamp. */
  mark(ids, at) {
    const seenAt = at || new Date().toISOString()
    for (const id of Array.isArray(ids) ? ids : [ids]) if (id) this.items[String(id)] = seenAt
    this.save()
    return seenAt
  }
  forget(id) { if (this.items[id]) { delete this.items[id]; this.save() } }
  unread(id, attentionAt) {
    if (!attentionAt) return false
    const seenAt = this.items[id]
    return seenAt ? ts(attentionAt) > ts(seenAt) : ts(attentionAt) >= ts(this.since)
  }
}

/**
 * Case-insensitive substring search over what a person would type for: task titles and inputs,
 * deliverable titles and bodies (a body hit also brings its task), routine titles and inputs.
 * Returns raw store objects, each list newest first (tasks and routines by their last activity,
 * deliverables by creation), at most `limit` each; an empty query returns empty lists.
 */
export function searchAll(q, { tasks = [], deliverables = [], routines = [] } = {}, { limit = 20, routineAt = (r) => r.createdAt } = {}) {
  const needle = String(q || '').trim().toLowerCase()
  if (!needle) return { tasks: [], routines: [], deliverables: [] }
  const has = (s) => String(s || '').toLowerCase().includes(needle)
  const byTask = new Map()
  for (const d of deliverables) { const l = byTask.get(d.taskId); if (l) l.push(d); else byTask.set(d.taskId, [d]) }
  const hits = deliverables.filter((d) => has(d.title) || has(String(d.markdown || '').slice(0, 2000)))
  const hitTasks = new Set(hits.map((d) => d.taskId))
  const desc = (key) => (a, b) => ts(key(b)) - ts(key(a))
  return {
    tasks: tasks.filter((t) => has(t.title) || has(t.input) || hitTasks.has(t.id)).sort(desc((t) => lastAtOf(t, byTask.get(t.id) || []))).slice(0, limit),
    routines: routines.filter((r) => has(r.title) || has(r.input)).sort(desc(routineAt)).slice(0, limit),
    deliverables: hits.sort(desc((d) => d.createdAt)).slice(0, limit).map((d) => ({ id: d.id, taskId: d.taskId, title: d.title, createdAt: d.createdAt, kind: d.kind })),
  }
}

/**
 * Public projection of a task: the stored fields (minus the verifier's material) plus what the
 * conversation column needs — currentStep, statusLabel, deliverables, lastAt, preview, attentionAt,
 * unread — and `ask`, the pending question a waiting task stopped on (null otherwise), so the column
 * and the card can show it without the activity stream. `seen` is the SeenStore; without one,
 * anything with an attentionAt counts as unread.
 */
export function taskView(t, deliverables, seen) {
  const list = deliverables ? deliverables.forTask(t.id) : []
  const { material: _material, ...rest } = t // the report material stays server-side (verifier input), not in every list payload
  const attentionAt = attentionOf(t)
  const ask = pendingAsk(t)
  return {
    ...rest,
    currentStep: currentStepOf(t),
    statusLabel: STATUS_LABELS[t.status] || t.status,
    deliverables: list.map((d) => ({ id: d.id, title: d.title, kind: d.kind, createdAt: d.createdAt, rating: d.rating })),
    lastAt: lastAtOf(t, list),
    preview: previewOf(t, list),
    attentionAt,
    unread: seen ? seen.unread(t.id, attentionAt) : !!attentionAt,
    ask: ask ? askView(ask) : null,
  }
}
