/**
 * dsh-mywork-tasks — durable stores for tasks and deliverables.
 *
 *   $DSH_HOME/mywork/tasks.json         { version, items: Task[] }
 *   $DSH_HOME/mywork/deliverables.json  { version, items: Deliverable[] }
 *
 * Task       { id, title, scenario, input, status, steps[], sessionId, deliverableIds[],
 *              createdAt, startedAt, finishedAt, error, summary }
 * Step       { name, tool, count, startedAt, endedAt }
 * Deliverable{ id, taskId, title, kind, scenario, markdown, data, createdAt, rating, verification }
 *
 * Status is one of STATUSES; a failed task is `done` with `error` set.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'

export const STATUSES = ['queued', 'running', 'delivering', 'verifying', 'done']
export const STATUS_LABELS = { queued: '排队', running: '执行', delivering: '交付', verifying: '核验', done: '完成' }
const MAX_TASKS = 500
const MAX_DELIVERABLES = 1000
/** Tasks that keep their activity stream (the run's messages and tool calls); older ones keep only steps. */
const ACTIVITY_KEEP = 60
export const ACTIVITY_MAX = 120
export const ACTIVITY_DETAIL_MAX = 240

export function myworkDir() { return join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'mywork') }
export function newId(prefix) { return prefix + '-' + Date.now().toString(36) + randomBytes(3).toString('hex') }

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
  /** Append one activity entry ({ kind: 'text' | 'tool', name?, detail?, text?, ok? }), capped. */
  activity(id, entry) {
    return this.update(id, (t) => {
      if (!Array.isArray(t.activity)) t.activity = []
      t.activity.push({ at: new Date().toISOString(), ...entry })
      if (t.activity.length > ACTIVITY_MAX) t.activity.splice(0, t.activity.length - ACTIVITY_MAX)
    })
  }
  /** Mark the latest open tool entry with its result. */
  activityResult(id, ok, text) {
    return this.update(id, (t) => {
      const list = Array.isArray(t.activity) ? t.activity : []
      for (let i = list.length - 1; i >= 0; i -= 1) { const e = list[i]; if (e.kind === 'tool' && e.ok === undefined) { e.ok = ok; if (text) e.result = String(text).slice(0, ACTIVITY_DETAIL_MAX); return } }
    })
  }
  beforeSave() {
    const cut = this.items.length - ACTIVITY_KEEP
    for (let i = 0; i < cut; i += 1) if (this.items[i].status === 'done' && Array.isArray(this.items[i].activity) && this.items[i].activity.length) this.items[i].activity = []
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

/** Public projection of a task: strips nothing today, but keeps one place to shape the API. */
export function taskView(t, deliverables) {
  const list = deliverables ? deliverables.forTask(t.id) : []
  const current = t.steps.length ? t.steps[t.steps.length - 1] : null
  const { material: _material, ...rest } = t // the report material stays server-side (verifier input), not in every list payload
  return { ...rest, currentStep: current && !current.endedAt ? current.name : '', statusLabel: STATUS_LABELS[t.status] || t.status, deliverables: list.map((d) => ({ id: d.id, title: d.title, kind: d.kind, createdAt: d.createdAt, rating: d.rating })) }
}
