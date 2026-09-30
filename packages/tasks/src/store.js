/**
 * dsh-mywork-tasks — durable stores of the teammate model (design/v2/TEAMMATES.md §9).
 *
 *   $DSH_HOME/mywork/mates.json         { version, items: Mate[] }
 *   $DSH_HOME/mywork/tasks.json         { version, items: Run[] }          (the file keeps its name: runs are the old task records)
 *   $DSH_HOME/mywork/deliverables.json  { version, items: Deliverable[] }
 *   $DSH_HOME/mywork/seen.json          { $since, [mateId]: ISO }          read state of the sidebar, one stamp per teammate
 *
 * Mate        { id, name, title, description, glyph, pinned, isDefault, notify, createdAt, sessionId, dir }
 *             sessionId stays empty until the teammate's dsh session ('mywork-mate-<id>') has been created.
 * Run         { id, mateId, trigger: 'user'|'routine'|'system', routineId, routineTitle, title, input, status, steps[],
 *               activity[], deliverableIds[], sessionId, dispatched, pendingText, quiet, verification, verifying,
 *               verifiedCount, createdAt, startedAt, finishedAt, error, summary, remind? }
 * Step        { name, tool, count, startedAt, endedAt }
 * Deliverable { id, mateId, taskId (= runId), title, kind, markdown, data, summary, createdAt, rating, verification }
 *
 * A run is one turn of a teammate's session (turn/start … turn/end), or a chain of them when it stopped to ask and was
 * answered. Status: queued (waiting for its turn) → running → done, or waiting (等你答) until answered. A failed run is
 * `done` with `error` set. Verification is a background stamp on a done run (`verifying`, then `verification`).
 *
 * The activity stream is two things at once: the thread a person reads back (THREAD_KINDS) and the noise of the run
 * (tool calls). Trimming may drop the noise, never the thread. A run's first user line is its `input`, not an activity
 * entry; later user lines (steers, answers) are activity entries { kind: 'user', text }.
 *
 * Ask entry (activity kind 'ask', written by the mywork_ask tool):
 *   { kind:'ask', id, at, status:'pending'|'answered'|'superseded'|'expired', question, askKind:'choice'|'text'|'approval'|'takeover',
 *     options?, detail?, answer?, answeredAt? }
 * Routine entry: { kind:'routine', action:'created', routineId, title, scheduleLabel, at }
 * Remind entry:  { kind:'remind', routineId, title, at, acked }   (a reminder that fired: a synthetic done run, see README)
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'

export const STATUSES = ['queued', 'running', 'waiting', 'done']
export const STATUS_LABELS = { queued: '排队', running: '在干活', waiting: '等你答', done: '完成' }
export const TRIGGERS = ['user', 'routine', 'system']
export const DEFAULT_MATE_ID = 'mywork'
export const MATE_SESSION_PREFIX = 'mywork-mate-'
export const MATE_NAME_MAX = 12
export const MATE_TITLE_MAX = 30
export const MATE_DESCRIPTION_MAX = 2000
export const DEFAULT_MATE_DESCRIPTION = '什么都可以交给我：回答问题、查资料、整理文件、写报告，安排例行和提醒。'
/** 找人 (§2.7) hard limits, enforced by the mywork_ask tool: the question, each option, the detail block, asks per run, and how long an answer is waited for. */
export const ASK_KINDS = ['text', 'choice', 'approval', 'takeover']
export const ASK_QUESTION_MAX = 120
export const ASK_OPTION_MAX = 12
export const ASK_OPTIONS_MIN = 2
export const ASK_OPTIONS_MAX = 4
export const ASK_DETAIL_MAX = 500
export const ASK_MAX_PER_TASK = 2
export const ASK_EXPIRY_MS = 24 * 3600000
const MAX_RUNS = 2000
const MAX_DELIVERABLES = 2000
const MAX_MATES = 200
const MAX_SEEN = 2000
/** Runs that keep their tool calls in the activity stream; older done runs keep only the thread. Quiet runs do not count. */
const ACTIVITY_KEEP = 60
/** Entries per run, tool calls included; the oldest tool calls go first. */
export const ACTIVITY_MAX = 120
/** Thread entries per run (what a person reads back); the oldest go first. */
export const ACTIVITY_THREAD_MAX = 80
export const ACTIVITY_TEXT_MAX = 2000
export const ACTIVITY_DETAIL_MAX = 240
/** The second line of a sidebar row. */
export const PREVIEW_MAX = 80
/** Entries a person reads back as the conversation; everything else (tool calls) is noise that trimming may drop. */
export const THREAD_KINDS = new Set(['user', 'text', 'handoff', 'verify', 'ask', 'routine', 'remind'])
export const isThreadEntry = (a) => !!a && THREAD_KINDS.has(a.kind)

export function myworkDir(home) { return join(home || process.env.DSH_HOME || join(homedir(), '.dsh'), 'mywork') }
export function newId(prefix) { return prefix + '-' + Date.now().toString(36) + randomBytes(3).toString('hex') }
const now = () => new Date().toISOString()

/** Epoch ms of an ISO stamp, -Infinity when missing or unparsable, so comparisons never trip on legacy values. */
export function ts(iso) { const n = Date.parse(String(iso || '')); return Number.isNaN(n) ? -Infinity : n }
/** The later of two ISO stamps (either may be empty). */
export function later(a, b) { return ts(b) > ts(a) ? b : (a || b || '') }

/**
 * Keep the stream inside its two budgets: the thread first (its oldest entries go only when the thread itself is too
 * long), then tool calls (the oldest go first). Ask entries are never dropped: the ≤2-asks rule counts them.
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

export function cleanName(name) { return String(name === undefined || name === null ? '' : name).replace(/\s+/g, ' ').trim().slice(0, MATE_NAME_MAX) }
/** The one-character monochrome avatar: the first character of the name ('' until the teammate has one). */
export function glyphOf(name) { const c = [...String(name || '').trim()][0]; return c ? c.toUpperCase() : '' }

/** Teammates. The default one ('mywork') exists from the first start and cannot be removed. */
export class MateStore extends JsonList {
  constructor(file, { matesDir } = {}) { super(file, MAX_MATES); this.matesDir = matesDir || join(myworkDir(), 'mates') }
  dirOf(id) { return join(this.matesDir, id) }
  ensureDefault() {
    const found = this.get(DEFAULT_MATE_ID)
    if (found) return found
    const mate = { id: DEFAULT_MATE_ID, name: 'MyWork', title: '', description: DEFAULT_MATE_DESCRIPTION, glyph: 'M', pinned: true, isDefault: true, notify: true, createdAt: now(), sessionId: '', dir: this.dirOf(DEFAULT_MATE_ID) }
    this.items.unshift(mate)
    this.save()
    return mate
  }
  create({ name, title, description }) {
    const desc = String(description || '').trim()
    if (!desc) throw new Error('description is required')
    const id = newId('mate')
    const n = cleanName(name)
    return this.add({ id, name: n, title: clip(title, MATE_TITLE_MAX), description: desc.slice(0, MATE_DESCRIPTION_MAX), glyph: glyphOf(n), pinned: false, isDefault: false, notify: true, createdAt: now(), sessionId: '', dir: this.dirOf(id) })
  }
  /** The teammate behind a dsh session id ('mywork-mate-<id>'), or null. */
  bySession(sessionId) {
    const sid = String(sessionId || '')
    return sid.startsWith(MATE_SESSION_PREFIX) ? this.get(sid.slice(MATE_SESSION_PREFIX.length)) : null
  }
}

export class TaskStore extends JsonList {
  constructor(file) { super(file, MAX_RUNS) }
  /** A new run. `input` is required for user runs; routine and system runs may start without one. */
  create({ mateId, trigger, routineId, routineTitle, title, input, source, status }) {
    const text = String(input || '').trim()
    const trig = TRIGGERS.includes(trigger) ? trigger : (source === 'routine' || routineId ? 'routine' : 'user')
    if (!text && trig === 'user') throw new Error('input is required')
    return this.add({
      id: newId('run'), mateId: mateId || DEFAULT_MATE_ID, trigger: trig, routineId: routineId || '', routineTitle: String(routineTitle || ''),
      title: String(title || '').trim() || titleOf(text), scenario: 'general', input: text, source: source || trig,
      status: STATUSES.includes(status) ? status : 'queued', steps: [], activity: [], sessionId: '', deliverableIds: [],
      dispatched: false, pendingText: '', quiet: false, verification: null, verifying: false, verifiedCount: 0,
      createdAt: now(), startedAt: '', finishedAt: '', error: '', summary: '',
    })
  }
  setStatus(id, status, extra) {
    if (!STATUSES.includes(status)) throw new Error('bad status: ' + status)
    return this.update(id, { status, ...(extra || {}) })
  }
  /** Append a step, or bump the count of the current step when it has the same name. */
  step(id, name, tool) {
    return this.update(id, (t) => {
      const at = now()
      const last = t.steps[t.steps.length - 1]
      if (last && !last.endedAt && last.name === name) { last.count = (last.count || 1) + 1; return }
      if (last && !last.endedAt) last.endedAt = at
      t.steps.push({ name, tool: tool || '', count: 1, startedAt: at, endedAt: '' })
    })
  }
  /** Append one activity entry, text capped, stream capped. */
  activity(id, entry) {
    return this.update(id, (t) => {
      if (!Array.isArray(t.activity)) t.activity = []
      const e = { at: now(), ...entry }
      if (typeof e.text === 'string' && e.text.length > ACTIVITY_TEXT_MAX) e.text = e.text.slice(0, ACTIVITY_TEXT_MAX - 1) + '…'
      // An ask's detail is data the person must read whole (an email body to confirm), so it keeps the tool's 500-char limit.
      const detailMax = e.kind === 'ask' ? ASK_DETAIL_MAX : ACTIVITY_DETAIL_MAX
      for (const k of ['detail', 'result']) if (typeof e[k] === 'string' && e[k].length > detailMax) e[k] = e[k].slice(0, detailMax - 1) + '…'
      t.activity.push(e)
      capActivity(t.activity)
    })
  }
  /** Take one entry out of a run's activity (the first that matches); returns it, or null. */
  takeEntry(id, match) {
    let hit = null
    this.update(id, (t) => { const list = Array.isArray(t.activity) ? t.activity : []; const i = list.findIndex(match); if (i >= 0) hit = list.splice(i, 1)[0] })
    return hit
  }
  /** Put an entry taken from another run into this one, keeping its stamp, in time order. */
  putEntry(id, entry) {
    return this.update(id, (t) => {
      if (!Array.isArray(t.activity)) t.activity = []
      let i = t.activity.length
      while (i > 0 && ts(t.activity[i - 1].at) > ts(entry.at)) i -= 1
      t.activity.splice(i, 0, entry)
      capActivity(t.activity)
    })
  }
  /** Append a pending ask; any older pending ask of the run is superseded first. Returns the stored entry. */
  ask(id, { question, askKind, options, detail }) {
    this.update(id, (t) => { for (const a of Array.isArray(t.activity) ? t.activity : []) if (a && a.kind === 'ask' && isPendingAsk(a)) a.status = 'superseded' })
    const entry = { kind: 'ask', id: newId('ask'), status: 'pending', question: String(question), askKind: askKind || 'text', ...(Array.isArray(options) && options.length ? { options } : {}), ...(detail ? { detail } : {}) }
    this.activity(id, entry)
    const list = this.get(id).activity
    return list[list.length - 1] // asks are never trimmed, so the entry just pushed is the last one
  }
  /** Settle the newest pending ask as 'answered' (with the answer), 'expired' or 'superseded'. Returns the entry, or null. */
  settleAsk(id, status, answer) {
    let hit = null
    this.update(id, (t) => {
      const a = pendingAsk(t)
      if (!a) return
      a.status = status
      if (status === 'answered') { a.answer = String(answer === undefined || answer === null ? '' : answer); a.answeredAt = now() }
      hit = a
    })
    return hit
  }
  /** Put an answered ask back to pending (the resume that followed it failed, so nothing happened). */
  reopenAsk(id, askId) {
    return this.update(id, (t) => { for (const a of Array.isArray(t.activity) ? t.activity : []) if (a && a.kind === 'ask' && a.id === askId) { a.status = 'pending'; delete a.answer; delete a.answeredAt } })
  }
  /** How many times this run has asked, whatever became of the questions (the ≤2 rule counts attempts). */
  askCount(id) { const t = this.get(id); return t && Array.isArray(t.activity) ? t.activity.filter((a) => a && a.kind === 'ask').length : 0 }
  /** Mark the latest open tool entry with its result. */
  activityResult(id, ok, text) {
    return this.update(id, (t) => {
      const list = Array.isArray(t.activity) ? t.activity : []
      for (let i = list.length - 1; i >= 0; i -= 1) { const e = list[i]; if (e.kind === 'tool' && e.ok === undefined) { e.ok = ok; if (text) e.result = String(text).slice(0, ACTIVITY_DETAIL_MAX); return } }
    })
  }
  /** Older done runs lose their tool calls, never their thread. The keep window counts visible runs only. */
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
  endSteps(id) { return this.update(id, (t) => { const at = now(); for (const s of t.steps) if (!s.endedAt) s.endedAt = at }) }
  forMate(mateId) { return this.items.filter((t) => t.mateId === mateId) }
  active() { return this.items.filter((t) => t.status !== 'done') }
}

export class DeliverableStore extends JsonList {
  constructor(file) { super(file, MAX_DELIVERABLES) }
  create({ mateId, taskId, runId, title, kind, scenario, markdown, data, summary }) {
    const body = String(markdown || '').trim()
    if (!body) throw new Error('markdown is required')
    // ✓ rows: at most six short label → value pairs; anything else is dropped rather than rendered badly.
    const rows = Array.isArray(summary) ? summary.filter((r) => r && typeof r === 'object' && String(r.label || '').trim()).slice(0, 6).map((r) => ({ label: String(r.label).trim().slice(0, 60), value: String(r.value === undefined || r.value === null ? '' : r.value).trim().slice(0, 60) })) : []
    return this.add({
      id: newId('dlv'), mateId: mateId || DEFAULT_MATE_ID, taskId: runId || taskId || '', title: String(title || '').trim() || titleOf(body), kind: kind || 'markdown', scenario: scenario || 'general',
      markdown: body, data: data === undefined ? null : data, summary: rows.length ? rows : null, createdAt: now(), rating: null, verification: null,
    })
  }
  forTask(taskId) { return this.items.filter((d) => d.taskId === taskId) }
}

/** What a list of files shows of a deliverable (no body): Deliverable += { mateId, runId }. */
export function deliverableSummary(d) {
  return { id: d.id, mateId: d.mateId || DEFAULT_MATE_ID, runId: d.taskId || '', title: d.title, kind: d.kind, createdAt: d.createdAt, rating: d.rating === undefined ? null : d.rating, verification: d.verification || null, summary: d.summary || null }
}

/**
 * Idempotent upgrade of v2 task data to the teammate model: every run without mateId becomes a run of the default
 * teammate (trigger routine for routine runs, else user); an old 今日 assistant day loses the activity copy of its first
 * line (it is the run's input); a task parked on a question is closed (its own session is not part of the model any
 * more); routines and deliverables get their mateId. Returns how many records changed.
 */
export function migrate({ runs, routines, deliverables, since }) {
  let changed = 0
  // Runs upgraded here carry migrated: true (the thread folds them). Data upgraded before the marker existed: a run of
  // the default teammate created before it (`since`, the default teammate's createdAt) is one too.
  const cutoff = since ? Date.parse(since) : NaN
  const mateOfRun = new Map()
  for (const t of runs ? runs.items : []) {
    if (!t.mateId) {
      t.mateId = DEFAULT_MATE_ID
      t.migrated = true
      t.trigger = t.source === 'routine' || t.routineId ? 'routine' : 'user'
      if (t.routineId && !t.routineTitle) t.routineTitle = t.title || ''
      const activity = Array.isArray(t.activity) ? t.activity : (t.activity = [])
      if (t.scenario === 'assistant') {
        const i = activity.findIndex((a) => a && a.kind === 'user')
        if (i >= 0 && String(activity[i].text || '').trim() === String(t.input || '').trim()) activity.splice(i, 1)
      }
      if (t.status === 'waiting') {
        for (const a of activity) if (isPendingAsk(a)) a.status = 'expired'
        t.status = 'done'; t.finishedAt = t.finishedAt || now()
      }
      if (t.status === 'queued') t.dispatched = false
      if (!Array.isArray(t.deliverableIds)) t.deliverableIds = []
      if (!Array.isArray(t.steps)) t.steps = []
      t.verifiedCount = t.deliverableIds.length // what the old engine verified (or chose not to) stays as it was
      changed += 1
    }
    if (!TRIGGERS.includes(t.trigger)) { t.trigger = 'user'; changed += 1 }
    if (t.migrated === undefined && t.mateId === DEFAULT_MATE_ID && Number.isFinite(cutoff) && Date.parse(t.createdAt) < cutoff) { t.migrated = true; changed += 1 }
    mateOfRun.set(t.id, t.mateId)
  }
  for (const r of routines ? routines.items : []) if (!r.mateId) { r.mateId = DEFAULT_MATE_ID; changed += 1 }
  for (const d of deliverables ? deliverables.items : []) if (!d.mateId) { d.mateId = mateOfRun.get(d.taskId) || DEFAULT_MATE_ID; changed += 1 }
  if (changed) { if (runs) runs.save(); if (routines) routines.save(); if (deliverables) deliverables.save() }
  return changed
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
/** Whole markdown text as one plain line: marks stripped, lines joined by spaces, at most `max` characters. */
export function plainText(text, max = 200) {
  const s = String(text || '').split('\n').map(stripMarkdown).filter(Boolean).join(' ')
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}
/** One line, at most `max` characters, with an ellipsis when cut. */
export function clip(text, max = PREVIEW_MAX) {
  const s = String(text === undefined || text === null ? '' : text).replace(/\s+/g, ' ').trim()
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}
const findLast = (list, fn) => { for (let i = list.length - 1; i >= 0; i -= 1) if (fn(list[i])) return list[i]; return null }
/** The name of the step a run is in (its last open step), or ''. */
export const currentStepOf = (t) => { const s = t && Array.isArray(t.steps) && t.steps.length ? t.steps[t.steps.length - 1] : null; return s && !s.endedAt ? s.name : '' }

/** Is this ask entry still open? Legacy entries without a status count as open until they carry an answer. */
export function isPendingAsk(a) { return !!a && a.kind === 'ask' && (a.status ? a.status === 'pending' : !a.answer) }
/** The ask the run is stopped on (waiting): the newest pending kind 'ask' entry, or null. */
export function pendingAsk(t) { return findLast(Array.isArray(t && t.activity) ? t.activity : [], isPendingAsk) }
/** What a card needs to ask the question: { id, at, question, askKind, options, detail }. */
export function askView(a) {
  return { id: a.id || '', at: a.at || '', question: String(a.question || ''), askKind: a.askKind || 'text', options: Array.isArray(a.options) ? a.options.slice() : [], detail: typeof a.detail === 'string' ? a.detail : '' }
}

/** A quiet routine run (变化：无) is kept in the routine's record but is not part of the thread. */
export const isQuietRun = (t) => !!t && t.quiet === true && t.trigger === 'routine'
/** Is the run in flight (queued for its turn, or in it)? */
export const isLiveRun = (t) => !!t && (t.status === 'running' || t.status === 'queued')

/** When something a person would notice last happened in a run: a thread line, a deliverable, a verdict, the end. Never a tool call. */
export function lastAtOf(t, deliverables) {
  let best = t.trigger === 'system' ? '' : (t.createdAt || '')
  for (const a of Array.isArray(t.activity) ? t.activity : []) if (isThreadEntry(a)) best = later(best, a.at)
  for (const d of Array.isArray(deliverables) ? deliverables : []) best = later(best, d.createdAt)
  if (t.verification) best = later(best, t.verification.at)
  if (t.status === 'done') best = later(best, t.finishedAt)
  return best
}

/**
 * When the run last did something the user did not ask for at that moment: it finished (a reply, a failure, a fired
 * reminder), a verification found issues, or it stopped to ask. Empty while it runs and for quiet runs; the user's own
 * lines never count.
 */
export function attentionOf(t) {
  if (!t || isQuietRun(t)) return ''
  let best = ''
  if (t.status === 'done') best = later(best, t.finishedAt)
  if (t.verification && t.verification.passed === false) best = later(best, t.verification.at)
  const ask = t.status === 'waiting' ? pendingAsk(t) : null
  if (ask) best = later(best, ask.at)
  return best
}

/**
 * The last thing said in a teammate's thread, for the sidebar's second line: { at, text, you } or null. The user's
 * lines (a user run's input, steers, answers) are `you`; replies, fired reminders and failures that got no reply are
 * the teammate's. Quiet runs and the hidden intro line are not part of the thread.
 */
export function lastLineOf(runs) {
  let best = null
  const take = (at, text, you) => { const line = plainLine(text); if (line && (!best || ts(at) >= ts(best.at))) best = { at, text: line, you } }
  for (const t of runs) {
    if (isQuietRun(t)) continue
    if (t.trigger === 'user' && t.input) take(t.createdAt, t.input, true)
    let lastUserAt = t.trigger === 'user' ? t.createdAt : ''
    let replied = false
    for (const a of Array.isArray(t.activity) ? t.activity : []) {
      if (!a) continue
      if (a.kind === 'user' && a.auto) continue // the 24 h resume is the engine's line, not the user's
      if (a.kind === 'user') { take(a.at, a.text, true); lastUserAt = a.at; replied = false }
      else if (a.kind === 'text') { take(a.at, a.text, false); if (ts(a.at) >= ts(lastUserAt)) replied = true }
      else if (a.kind === 'remind') take(a.at, '提醒 · ' + (a.title || ''), false)
    }
    if (t.status === 'done' && t.error && !replied) take(t.finishedAt, '失败 · ' + (plainLine(t.error) || t.error), false)
  }
  return best
}

/**
 * Read state of the sidebar: { [mateId]: seenAt }. A row is unread when its attentionAt is later than its seenAt.
 * `$since` (when the file was born) stands in for a missing seenAt, so upgrading does not light up every row at once.
 */
export class SeenStore {
  constructor(file) {
    this.file = file; this.items = {}; this.since = ''
    this.load()
    if (!this.since) { this.since = now(); this.save() }
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
    const seenAt = at || now()
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
