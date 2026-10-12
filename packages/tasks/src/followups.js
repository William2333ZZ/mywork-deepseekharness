/**
 * dsh-mywork-tasks — 跟进 (PROACTIVE.md §4): what a teammate keeps in mind for you, to bring back on a later day.
 *
 * Two kinds in this first version:
 *   yours  you put something off (「先放着，下周再细看」): on that day, at your 读的时间, a card brings it back in the
 *          teammate's thread (a reminder card that quotes your words); 知道了 closes it. Not answered by the latest day
 *          (7 days later unless said), it is let go with the default written when it was opened.
 *   mine   the teammate said it would do something later (「收盘后我再对一次」): on that day it is sent back to it as
 *          a run of its own, and the follow-up closes when that run is handed over.
 *
 * Kept per teammate in <folder>/.mywork/跟进.jsonl, append-only, the newest line of an id wins (tasks.json is rewritten
 * whole on every change, and routines have a cap of 200). Nothing here calls the model: the scheduler tick compares
 * times only. It is not a task list: no page lists them, nothing counts them; each opened one is one small line under
 * the turn that opened it, with 不用记.
 *
 * Followup { id, kind: yours | mine, text, quote, runId, due (ISO), latest (ISO), fallback, count,
 *            state: open | closed | dropped, note, createdAt, updatedAt }
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { clip, newId } from './store.js'

export const FOLLOWUP_KINDS = ['yours', 'mine']
/** A teammate keeps at most this many of its own open; the oldest is let go to make room (yours have no cap). */
export const MINE_MAX = 10
/** Unless said, a follow-up of yours is let go this many days after its day. */
export const LATEST_DAYS = 7
const DAY_MS = 86400000
const FILE = ['.mywork', '跟进.jsonl']

const pad = (n) => String(n).padStart(2, '0')
/** Local date as YYYY-MM-DD. */
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/**
 * When a follow-up comes back: 'YYYY-MM-DD' (at `clock`, the 读的时间), 'YYYY-MM-DD HH:MM', or `days` from today (at
 * `clock`). Returns a Date in the future, or null when it cannot be read or is already past.
 */
export function dueAt({ when, days, clock = '08:30', now = new Date() }) {
  const [ch, cm] = String(clock).split(':').map(Number)
  let d = null
  const w = String(when || '').trim()
  const m = w.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?$/)
  if (m) d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), m[4] !== undefined ? Number(m[4]) : ch, m[5] !== undefined ? Number(m[5]) : cm)
  else if (Number.isFinite(Number(days)) && Number(days) >= 1 && Number(days) <= 366) d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + Math.floor(Number(days)), ch, cm)
  if (!d || isNaN(d) || d.getTime() <= now.getTime()) return null
  return d
}

/** The day as people read it: 10/19 周一 08:30. */
export function dayLabel(iso) {
  const d = new Date(iso)
  if (isNaN(d)) return ''
  return `${d.getMonth() + 1}/${d.getDate()} 周${'日一二三四五六'[d.getDay()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export class FollowupStore {
  constructor() { this.byMate = new Map() } // mateId → { file, items: Map<id, Followup> }
  /** Load a teammate's ledger once (its folder is mate.dir). */
  of(mate) {
    let x = this.byMate.get(mate.id)
    if (x) return x
    const file = mate.dir ? join(mate.dir, ...FILE) : ''
    x = { file, items: new Map() }
    if (file && existsSync(file)) {
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        if (!line.trim()) continue
        try { const f = JSON.parse(line); if (f && f.id) x.items.set(f.id, f) } catch {}
      }
    }
    this.byMate.set(mate.id, x)
    return x
  }
  forget(mateId) { this.byMate.delete(mateId) }
  write(mate, f) {
    const x = this.of(mate)
    x.items.set(f.id, f)
    if (x.file) { mkdirSync(join(x.file, '..'), { recursive: true }); appendFileSync(x.file, JSON.stringify(f) + '\n') }
    return f
  }
  get(mate, id) { return this.of(mate).items.get(String(id || '')) || null }
  list(mate) { return [...this.of(mate).items.values()].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))) }
  open(mate) { return this.list(mate).filter((f) => f.state === 'open') }
  /** Open one. Returns { followup, dropped } — dropped is the oldest of its own let go to stay under MINE_MAX. */
  add(mate, { kind, text, quote, runId, due, latest, fallback }) {
    if (!FOLLOWUP_KINDS.includes(kind)) throw new Error('kind 是 yours 或 mine')
    const words = clip(String(text || '').trim(), 80)
    if (!words) throw new Error('text 不能为空')
    let dropped = null
    if (kind === 'mine') {
      const mine = this.open(mate).filter((f) => f.kind === 'mine')
      if (mine.length >= MINE_MAX) dropped = this.settle(mate, mine[0].id, 'dropped', '同时跟的太多，最早的这条放下了')
    }
    const at = new Date().toISOString()
    const dueIso = due.toISOString()
    const latestIso = latest && latest.getTime() > due.getTime() ? latest.toISOString() : new Date(due.getTime() + LATEST_DAYS * DAY_MS).toISOString()
    const f = { id: newId('fu'), kind, text: words, quote: clip(String(quote || '').trim(), 120), runId: String(runId || ''), due: dueIso, latest: latestIso, fallback: clip(String(fallback || '').trim(), 80), count: 0, state: 'open', note: '', createdAt: at, updatedAt: at }
    return { followup: this.write(mate, f), dropped }
  }
  /** Close (closed) or let go (dropped) with a short note; null when it is not open. */
  settle(mate, id, state, note) {
    const f = this.get(mate, id)
    if (!f || f.state !== 'open') return null
    return this.write(mate, { ...f, state, note: clip(String(note || ''), 80), updatedAt: new Date().toISOString() })
  }
  /** Mark that it came back once (the card was posted / the run was queued). */
  brought(mate, id) {
    const f = this.get(mate, id)
    if (!f) return null
    return this.write(mate, { ...f, count: (Number(f.count) || 0) + 1, updatedAt: new Date().toISOString() })
  }
}

/** What the tick should do with a teammate's open follow-ups now: those that come back, those past their latest day. */
export function dueNow(list, now = new Date()) {
  const t = now.getTime()
  const bring = []; const lapse = []
  for (const f of list) {
    if (f.state !== 'open') continue
    if (f.kind === 'yours' && f.count > 0 && new Date(f.latest).getTime() <= t) lapse.push(f)
    else if (!f.count && new Date(f.due).getTime() <= t) bring.push(f)
  }
  return { bring, lapse }
}

/** The prompt that sends one of its own follow-ups back to the teammate. */
export function followupPrompt(f) {
  return [
    `这是你之前答应的跟进：「${f.text}」${f.quote ? `（当时的原话：${f.quote}）` : ''}。`,
    '现在到时间了：照做，有成果就用 deliver 交付，没有就用一两句话说结果。做不了就说清卡在哪、需要用户做什么。',
  ].join('\n')
}

/** The person-facing copy of a follow-up (no paths). */
export function followupView(f) {
  if (!f) return null
  return { id: f.id, kind: f.kind, text: f.text, due: f.due, dueLabel: dayLabel(f.due), latest: f.latest, fallback: f.fallback, count: Number(f.count) || 0, state: f.state, note: f.note || '' }
}
