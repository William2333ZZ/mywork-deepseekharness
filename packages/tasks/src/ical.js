/**
 * dsh-mywork-tasks — a calendar read by code from iCalendar (RFC 5545), whichever service it comes from: Google, Outlook,
 * iCloud, Feishu, DingTalk and most others publish a subscription link (.ics) or export one. Garry Tan (GBrain): the
 * calendar is mirrored to local files and times are worked out by a script — his agent once read a meeting 88 minutes
 * away as 28. So the model gets the events with their local times and minutes-from-now already computed.
 *
 *   parseIcs(text) → VEvent[]
 *   eventsBetween(events, from, to, { tz }) → Occurrence[]   (RRULE daily / weekly / monthly / yearly with INTERVAL,
 *                                                             BYDAY, BYMONTHDAY, COUNT, UNTIL; EXDATE; RECURRENCE-ID
 *                                                             overrides; cancelled ones left out)
 */

/** Windows names (Outlook / Exchange) → IANA. */
const WINDOWS_TZ = {
  'China Standard Time': 'Asia/Shanghai', 'Taipei Standard Time': 'Asia/Taipei', 'Tokyo Standard Time': 'Asia/Tokyo', 'Korea Standard Time': 'Asia/Seoul',
  'Singapore Standard Time': 'Asia/Singapore', 'India Standard Time': 'Asia/Kolkata', 'UTC': 'UTC', 'GMT Standard Time': 'Europe/London',
  'W. Europe Standard Time': 'Europe/Berlin', 'Central Europe Standard Time': 'Europe/Budapest', 'Romance Standard Time': 'Europe/Paris',
  'Eastern Standard Time': 'America/New_York', 'Central Standard Time': 'America/Chicago', 'Mountain Standard Time': 'America/Denver',
  'Pacific Standard Time': 'America/Los_Angeles', 'AUS Eastern Standard Time': 'Australia/Sydney',
}
const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
const CN_WEEK = ['日', '一', '二', '三', '四', '五', '六']

function zoneOk(tz) { try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true } catch { return false } }
export function ianaOf(tzid) {
  const t = String(tzid || '').replace(/^"|"$/g, '').replace(/^\/[^/]+\/[^/]+\//, '') // "/mozilla.org/20050126_1/Asia/Shanghai"
  if (!t) return ''
  if (WINDOWS_TZ[t]) return WINDOWS_TZ[t]
  return zoneOk(t) ? t : ''
}
/** The wall-clock parts of an instant in a zone. */
function partsIn(ms, tz) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short' })
  const o = {}
  for (const p of f.formatToParts(new Date(ms))) o[p.type] = p.value
  return { y: +o.year, mo: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second, wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday) }
}
/** A wall-clock time in a zone → epoch ms (two passes settle the offset, DST included). */
export function zonedMs(y, mo, d, h, mi, s, tz) {
  const want = Date.UTC(y, mo - 1, d, h, mi, s)
  let ms = want
  for (let i = 0; i < 2; i++) { const p = partsIn(ms, tz); ms += want - Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) }
  return ms
}

/** Unfolded content lines → [{ name, params, value }]. */
function lines(text) {
  const raw = String(text || '').replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '').split('\n')
  const out = []
  for (const l of raw) {
    if (!l.trim()) continue
    let i = 0; let q = false
    for (; i < l.length; i++) { const c = l[i]; if (c === '"') q = !q; else if (c === ':' && !q) break }
    const head = l.slice(0, i)
    const value = l.slice(i + 1)
    const [name, ...ps] = head.split(';')
    const params = {}
    for (const p of ps) { const k = p.indexOf('='); if (k > 0) params[p.slice(0, k).toUpperCase()] = p.slice(k + 1).replace(/^"|"$/g, '') }
    out.push({ name: name.toUpperCase(), params, value })
  }
  return out
}
const unescape = (v) => String(v || '').replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1').trim()
/** A DATE / DATE-TIME value → { ms, allDay, floating } in the given zone (floating and dates use `tz`). */
function timeOf(value, params, tz) {
  const v = String(value || '').trim()
  const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/)
  if (!m) return null
  const [, y, mo, d, h, mi, s, z] = m
  if (!h || params.VALUE === 'DATE') return { ms: zonedMs(+y, +mo, +d, 0, 0, 0, tz), allDay: true, wall: { y: +y, mo: +mo, d: +d, h: 0, mi: 0, s: 0 }, tz }
  if (z) return { ms: Date.UTC(+y, +mo - 1, +d, +h, +mi, +(s || 0)), allDay: false, tz: 'UTC', wall: null }
  const zone = ianaOf(params.TZID) || tz
  return { ms: zonedMs(+y, +mo, +d, +h, +mi, +(s || 0), zone), allDay: false, wall: { y: +y, mo: +mo, d: +d, h: +h, mi: +mi, s: +(s || 0) }, tz: zone }
}
function durationMs(v) {
  const m = String(v || '').match(/^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/)
  if (!m) return 0
  const n = (x) => +(x || 0)
  return (m[1] === '-' ? -1 : 1) * (((n(m[2]) * 7 + n(m[3])) * 24 + n(m[4])) * 3600 + n(m[5]) * 60 + n(m[6])) * 1000
}

/** The VEVENTs of a calendar, times resolved (`tz` for floating times and all-day dates). */
export function parseIcs(text, { tz = Intl.DateTimeFormat().resolvedOptions().timeZone } = {}) {
  const events = []
  let cur = null
  let depth = 0
  for (const l of lines(text)) {
    if (l.name === 'BEGIN' && l.value.toUpperCase() === 'VEVENT') { cur = { exdates: [], attendees: [] }; depth = 0; continue }
    if (!cur) continue
    if (l.name === 'BEGIN') { depth += 1; continue } // VALARM and the like
    if (l.name === 'END' && depth > 0) { depth -= 1; continue }
    if (l.name === 'END' && l.value.toUpperCase() === 'VEVENT') {
      if (cur.start) {
        if (!cur.end) cur.end = cur.duration ? { ...cur.start, ms: cur.start.ms + cur.duration } : { ...cur.start, ms: cur.start.ms + (cur.start.allDay ? 86400000 : 0) }
        events.push(cur)
      }
      cur = null
      continue
    }
    if (depth > 0) continue
    switch (l.name) {
      case 'UID': cur.uid = l.value.trim(); break
      case 'SUMMARY': cur.title = unescape(l.value); break
      case 'LOCATION': cur.location = unescape(l.value); break
      case 'DESCRIPTION': cur.description = unescape(l.value).slice(0, 500); break
      case 'STATUS': cur.status = l.value.trim().toUpperCase(); break
      case 'DTSTART': cur.start = timeOf(l.value, l.params, tz); break
      case 'DTEND': cur.end = timeOf(l.value, l.params, tz); break
      case 'DURATION': cur.duration = durationMs(l.value); break
      case 'RRULE': cur.rrule = Object.fromEntries(l.value.split(';').map((p) => p.split('=')).filter((p) => p.length === 2).map(([k, v]) => [k.toUpperCase(), v])); break
      case 'EXDATE': for (const v of l.value.split(',')) { const t = timeOf(v, l.params, tz); if (t) cur.exdates.push(t.ms) } break
      case 'RECURRENCE-ID': cur.recurrenceId = timeOf(l.value, l.params, tz); break
      case 'ATTENDEE': cur.attendees.push(l.params.CN || l.value.replace(/^mailto:/i, '')); break
      case 'ORGANIZER': cur.organizer = l.params.CN || l.value.replace(/^mailto:/i, ''); break
      default:
    }
  }
  return events
}

/** The starts of a recurring event in [from, to): RRULE expanded in the event's own wall clock (so DST keeps 10:00 at 10:00). */
function occurrences(ev, from, to) {
  const r = ev.rrule
  const s = ev.start
  // A single event counts when it overlaps the window (an all-day one started at midnight still counts at noon).
  if (!r) return s.ms < to && Math.max(ev.end.ms, s.ms + 1) > from ? [s.ms] : []
  const freq = String(r.FREQ || '').toUpperCase()
  const interval = Math.max(1, +(r.INTERVAL || 1))
  const count = r.COUNT ? +r.COUNT : Infinity
  const until = r.UNTIL ? (timeOf(r.UNTIL, {}, s.tz || 'UTC') || { ms: Infinity }).ms : Infinity
  const zone = s.tz || 'UTC'
  const w = s.wall || (() => { const p = partsIn(s.ms, zone); return { y: p.y, mo: p.mo, d: p.d, h: p.h, mi: p.mi, s: p.s } })()
  const at = (y, mo, d) => (s.allDay ? zonedMs(y, mo, d, 0, 0, 0, zone) : zonedMs(y, mo, d, w.h, w.mi, w.s, zone))
  const byday = r.BYDAY ? r.BYDAY.split(',').map((x) => WEEKDAYS.indexOf(x.slice(-2).toUpperCase())).filter((x) => x >= 0) : null
  const bymonthday = r.BYMONTHDAY ? r.BYMONTHDAY.split(',').map(Number).filter(Boolean) : null
  const out = []
  let n = 0
  const day = (y, mo, d) => new Date(Date.UTC(y, mo - 1, d))
  const emit = (ms) => { if (ms < s.ms) return true; n += 1; if (n > count || ms > until) return false; if (ms >= from && ms < to) out.push(ms); return ms < to }
  if (freq === 'DAILY') {
    for (let i = 0; i < 5000; i++) { const t = day(w.y, w.mo, w.d + i * interval); if (!emit(at(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()))) break }
  } else if (freq === 'WEEKLY') {
    const days = byday && byday.length ? byday.slice().sort((a, b) => a - b) : [day(w.y, w.mo, w.d).getUTCDay()]
    const first = day(w.y, w.mo, w.d)
    const weekStart = day(w.y, w.mo, w.d - first.getUTCDay())
    outer: for (let k = 0; k < 2000; k++) {
      for (const wd of days) {
        const t = new Date(weekStart.getTime() + (k * interval * 7 + wd) * 86400000)
        if (!emit(at(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()))) break outer
      }
    }
  } else if (freq === 'MONTHLY') {
    outer: for (let k = 0; k < 600; k++) {
      const base = day(w.y, w.mo + k * interval, 1)
      const y = base.getUTCFullYear(); const mo = base.getUTCMonth() + 1
      const last = new Date(Date.UTC(y, mo, 0)).getUTCDate()
      let ds = bymonthday ? bymonthday.map((x) => (x < 0 ? last + 1 + x : x)) : [w.d]
      if (byday && !bymonthday) {
        // 「每月第二个周二」: BYDAY=2TU; a bare TU means every Tuesday of the month
        ds = []
        for (const spec of r.BYDAY.split(',')) {
          const m = spec.match(/^([+-]?\d)?([A-Z]{2})$/i)
          if (!m) continue
          const wd = WEEKDAYS.indexOf(m[2].toUpperCase())
          const all = []
          for (let dd = 1; dd <= last; dd++) if (new Date(Date.UTC(y, mo - 1, dd)).getUTCDay() === wd) all.push(dd)
          if (!m[1]) ds.push(...all); else { const i = +m[1]; const pick = i > 0 ? all[i - 1] : all[all.length + i]; if (pick) ds.push(pick) }
        }
      }
      for (const dd of ds.filter((x) => x >= 1 && x <= last).sort((a, b) => a - b)) if (!emit(at(y, mo, dd))) break outer
    }
  } else if (freq === 'YEARLY') {
    for (let k = 0; k < 200; k++) if (!emit(at(w.y + k * interval, w.mo, w.d))) break
  } else return s.ms >= from && s.ms < to ? [s.ms] : []
  return out
}

const pad = (x) => String(x).padStart(2, '0')
/**
 * The occurrences in [from, to) sorted by start: { title, start, end, local: 'YYYY-MM-DD HH:MM', endLocal, weekday,
 * allDay, location, attendees, organizer, recurring, minutesFromNow } in `tz`. Cancelled ones and EXDATEs are left out;
 * a RECURRENCE-ID instance replaces the occurrence it moves.
 */
export function eventsBetween(events, from, to, { tz = Intl.DateTimeFormat().resolvedOptions().timeZone, now = Date.now() } = {}) {
  const overrides = new Map()
  for (const e of events) if (e.recurrenceId) overrides.set(e.uid + '@' + e.recurrenceId.ms, e)
  const out = []
  const push = (e, startMs) => {
    if (e.status === 'CANCELLED') return
    const len = Math.max(0, e.end.ms - e.start.ms)
    const p = partsIn(startMs, tz)
    const q = partsIn(startMs + len, tz)
    out.push({
      title: e.title || '（无标题）', start: new Date(startMs).toISOString(), end: new Date(startMs + len).toISOString(),
      local: e.start.allDay ? `${p.y}-${pad(p.mo)}-${pad(p.d)}` : `${p.y}-${pad(p.mo)}-${pad(p.d)} ${pad(p.h)}:${pad(p.mi)}`,
      endLocal: e.start.allDay ? '' : `${pad(q.h)}:${pad(q.mi)}`, weekday: '周' + CN_WEEK[p.wd], allDay: !!e.start.allDay,
      location: e.location || '', attendees: e.attendees.slice(0, 30), organizer: e.organizer || '', recurring: !!e.rrule || !!e.recurrenceId,
      minutesFromNow: Math.round((startMs - now) / 60000),
    })
  }
  for (const e of events) {
    if (e.recurrenceId) { if (e.start.ms >= from && e.start.ms < to) push(e, e.start.ms); continue }
    for (const ms of occurrences(e, from, to)) {
      if (e.exdates.includes(ms)) continue
      if (overrides.has(e.uid + '@' + ms)) continue // moved or cancelled: its own instance stands in
      push(e, ms)
    }
  }
  return out.sort((a, b) => a.start.localeCompare(b.start))
}

/** 「- 日历：https://…/basic.ics」 (or a file in the folder) in AGENTS.md → the source, or ''. */
export function calendarSourceOf(text) {
  for (const m of String(text || '').matchAll(/^\s*[-*]?\s*(?:日历|日程|calendar)\s*[:：]\s*(\S+)/gim)) {
    const v = m[1].replace(/[，。；;,]+$/, '')
    if (/^(https?|webcal):\/\//i.test(v) || /\.ics$/i.test(v)) return v
  }
  return ''
}
