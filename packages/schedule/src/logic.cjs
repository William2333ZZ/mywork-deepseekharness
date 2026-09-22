/**
 * dsh-mywork-schedule — pure scheduling logic shared by the host (Node ESM via
 * createRequire) and the browser bundle (inlined by scripts/build-client.mjs).
 *
 * No I/O, no globals except Date. All "local" calculations use the caller's
 * timezone (the browser where the alarm fires, or the host machine for the
 * /remind command), which is the natural meaning of "09:00 every day".
 *
 * Reminder shape (JSON):
 *   {
 *     id: string, title: string, note?: string,
 *     kind: 'once' | 'daily' | 'weekly' | 'interval',
 *     at?: string            // once:     RFC 3339 instant
 *     time?: 'HH:MM'         // daily / weekly: local wall-clock time
 *     weekdays?: number[]    // weekly:   1 = Monday … 7 = Sunday
 *     everyMinutes?: number  // interval: >= 1
 *     enabled: boolean, createdAt: string, lastFiredAt?: string, sessionId?: string
 *   }
 */
'use strict'

const KINDS = ['once', 'daily', 'weekly', 'interval']
const GRACE_MS = 24 * 60 * 60 * 1000 // fire "missed" alarms up to a day late

function pad2(n) { return (n < 10 ? '0' : '') + n }

/** Parse 'HH:MM' → { h, m } or null. */
function parseTime(text) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(text || '').trim())
  if (!m) return null
  const h = Number(m[1]); const mi = Number(m[2])
  if (h < 0 || h > 23 || mi < 0 || mi > 59) return null
  return { h, m: mi }
}

/** ISO weekday of a Date in local time: 1 = Monday … 7 = Sunday. */
function isoWeekday(d) { const w = d.getDay(); return w === 0 ? 7 : w }

/** Parse a relative duration like 10m, 2h, 1h30m, 45s, 2d → milliseconds or null. */
function parseDuration(text) {
  const s = String(text || '').trim().toLowerCase()
  if (!s) return null
  const re = /(\d+(?:\.\d+)?)\s*(d|h|m|s|天|小时|分钟|分|秒)/g
  let total = 0; let matched = ''
  let m
  while ((m = re.exec(s)) !== null) {
    const n = Number(m[1]); const u = m[2]
    matched += m[0]
    if (u === 'd' || u === '天') total += n * 86400000
    else if (u === 'h' || u === '小时') total += n * 3600000
    else if (u === 'm' || u === '分钟' || u === '分') total += n * 60000
    else total += n * 1000
  }
  if (matched.replace(/\s/g, '') !== s.replace(/\s/g, '')) return null
  return total > 0 ? total : null
}

/** Validate a reminder-like object; returns { ok: true, value } or { ok: false, error }. */
function normalize(input) {
  if (input === null || typeof input !== 'object') return { ok: false, error: 'reminder must be an object' }
  const title = typeof input.title === 'string' ? input.title.trim() : ''
  if (!title) return { ok: false, error: 'title is required' }
  const kind = input.kind || (input.at ? 'once' : input.everyMinutes ? 'interval' : input.weekdays ? 'weekly' : input.time ? 'daily' : 'once')
  if (!KINDS.includes(kind)) return { ok: false, error: `kind must be one of ${KINDS.join(', ')}` }
  const out = { title, kind, enabled: input.enabled !== false }
  if (typeof input.note === 'string' && input.note.trim()) out.note = input.note.trim()
  if (typeof input.sessionId === 'string' && input.sessionId) out.sessionId = input.sessionId
  // optional IM delivery (dsh-mywork-im): true = most recent chat, or a target string
  if (input.im === true) out.im = true; else if (typeof input.im === 'string' && input.im.trim()) out.im = input.im.trim()
  if (kind === 'once') {
    const at = input.at ? new Date(input.at) : null
    if (!at || Number.isNaN(at.getTime())) return { ok: false, error: 'once reminders need a valid `at` instant (RFC 3339)' }
    out.at = at.toISOString()
  } else if (kind === 'daily' || kind === 'weekly') {
    const t = parseTime(input.time)
    if (!t) return { ok: false, error: '`time` must be HH:MM' }
    out.time = pad2(t.h) + ':' + pad2(t.m)
    if (kind === 'weekly') {
      const days = Array.isArray(input.weekdays) ? input.weekdays.map(Number).filter((d) => Number.isInteger(d) && d >= 1 && d <= 7) : []
      if (days.length === 0) return { ok: false, error: 'weekly reminders need `weekdays` (1 = Monday … 7 = Sunday)' }
      out.weekdays = Array.from(new Set(days)).sort((a, b) => a - b)
    }
  } else {
    const n = Number(input.everyMinutes)
    if (!Number.isFinite(n) || n < 1) return { ok: false, error: '`everyMinutes` must be >= 1' }
    out.everyMinutes = Math.round(n)
  }
  return { ok: true, value: out }
}

/**
 * Next occurrence strictly after `after` (a Date), in the caller's local time.
 * Returns a Date or null (a `once` reminder that already passed `after`).
 */
function nextOccurrence(r, after) {
  const from = after instanceof Date ? after : new Date(after)
  if (r.kind === 'once') {
    const at = new Date(r.at)
    return at.getTime() > from.getTime() ? at : null
  }
  if (r.kind === 'interval') {
    const anchor = new Date(r.lastFiredAt || r.createdAt || from)
    const step = r.everyMinutes * 60000
    let t = anchor.getTime() + step
    if (t <= from.getTime()) {
      const k = Math.floor((from.getTime() - anchor.getTime()) / step) + 1
      t = anchor.getTime() + k * step
    }
    return new Date(t)
  }
  const tm = parseTime(r.time)
  if (!tm) return null
  const cand = new Date(from.getFullYear(), from.getMonth(), from.getDate(), tm.h, tm.m, 0, 0)
  for (let i = 0; i < 8; i++) {
    if (cand.getTime() > from.getTime()) {
      if (r.kind === 'daily') return new Date(cand)
      if (r.weekdays.includes(isoWeekday(cand))) return new Date(cand)
    }
    cand.setDate(cand.getDate() + 1)
    cand.setHours(tm.h, tm.m, 0, 0)
  }
  return null
}

/**
 * The occurrence that is due right now, if any: the latest occurrence after
 * `lastFiredAt` (or creation) that is <= now and not older than the grace
 * window. Returns a Date or null.
 */
function dueOccurrence(r, now) {
  if (!r.enabled) return null
  const nowD = now instanceof Date ? now : new Date(now)
  const after = new Date(r.lastFiredAt || r.createdAt || 0)
  let next = nextOccurrence(r, after)
  if (!next) return null
  if (next.getTime() > nowD.getTime()) return null
  // Skip forward to the most recent due occurrence (no backlog).
  let due = next
  for (let i = 0; i < 1000; i++) {
    const n = nextOccurrence(r, due)
    if (!n || n.getTime() > nowD.getTime()) break
    due = n
  }
  if (nowD.getTime() - due.getTime() > GRACE_MS) {
    // Too old to be a meaningful alarm; treat as skipped but still report so
    // the caller can advance lastFiredAt silently.
    return { at: due, stale: true }
  }
  return { at: due, stale: false }
}

/** Human summary of the rule (for tool output / lists). */
function describe(r, lang) {
  const zh = lang === 'zh'
  const names = zh ? ['一', '二', '三', '四', '五', '六', '日'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  if (r.kind === 'once') return zh ? '一次' : 'once'
  if (r.kind === 'daily') return (zh ? '每天 ' : 'daily ') + r.time
  if (r.kind === 'weekly') return (zh ? '每周' : 'weekly ') + r.weekdays.map((d) => names[d - 1]).join(zh ? '、' : ',') + ' ' + r.time
  const m = r.everyMinutes
  const txt = m % 60 === 0 ? (m / 60) + 'h' : m + 'm'
  return (zh ? '每 ' : 'every ') + txt
}

/**
 * Parse the free text of `/remind …` into a reminder input (local time).
 *   /remind 10m 喝水               → once, now + 10m
 *   /remind 18:30 下班             → once, today 18:30 (tomorrow if passed)
 *   /remind daily 09:00 站会       → daily
 *   /remind weekly 1,3,5 10:00 周会 → weekly (1 = Mon … 7 = Sun)
 *   /remind every 30m 喝水         → interval
 * Returns { ok: true, value } or { ok: false, error }.
 */
function parseCommand(raw, now) {
  const nowD = now instanceof Date ? now : new Date(now || Date.now())
  const text = String(raw || '').trim()
  if (!text) return { ok: false, error: 'usage' }
  const parts = text.split(/\s+/)
  const head = parts[0].toLowerCase()
  if (head === 'daily' || head === '每天') {
    const t = parseTime(parts[1])
    if (!t) return { ok: false, error: 'daily needs HH:MM' }
    const title = parts.slice(2).join(' ')
    return normalize({ title, kind: 'daily', time: parts[1] })
  }
  if (head === 'weekly' || head === '每周') {
    const days = String(parts[1] || '').split(/[，,]/).map(Number)
    const t = parseTime(parts[2])
    if (!t) return { ok: false, error: 'weekly needs days and HH:MM' }
    return normalize({ title: parts.slice(3).join(' '), kind: 'weekly', weekdays: days, time: parts[2] })
  }
  if (head === 'every' || head === '每') {
    const ms = parseDuration(parts[1])
    if (!ms) return { ok: false, error: 'every needs a duration like 30m' }
    return normalize({ title: parts.slice(2).join(' '), kind: 'interval', everyMinutes: Math.max(1, Math.round(ms / 60000)) })
  }
  const t = parseTime(parts[0])
  if (t) {
    const at = new Date(nowD.getFullYear(), nowD.getMonth(), nowD.getDate(), t.h, t.m, 0, 0)
    if (at.getTime() <= nowD.getTime()) at.setDate(at.getDate() + 1)
    return normalize({ title: parts.slice(1).join(' '), kind: 'once', at: at.toISOString() })
  }
  const ms = parseDuration(parts[0])
  if (ms) return normalize({ title: parts.slice(1).join(' '), kind: 'once', at: new Date(nowD.getTime() + ms).toISOString() })
  return { ok: false, error: 'unrecognized time' }
}

module.exports = { KINDS, GRACE_MS, parseTime, parseDuration, normalize, nextOccurrence, dueOccurrence, describe, parseCommand, isoWeekday }
