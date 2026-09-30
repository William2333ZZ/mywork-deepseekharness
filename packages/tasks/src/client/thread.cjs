/**
 * The task page as one thread: what you said, what came back, in time order.
 * Pure CommonJS (no React, no locale) so the client bundle inlines it as a prelude
 * and node tests can require it.
 *
 *   threadOf(task, deliverables) → [{ kind, key, at, ... }]
 *
 * Entry kinds, in the order they appear:
 *   user      { text }                     task.input first, then every activity entry of kind 'user' (follow-ups)
 *   deliver   { d, verify }                one per deliverable, at its createdAt; `verify` is verifyState(task), read live
 *   text      { text }                     a reply: activity text AFTER the last deliverable of its run; a run without a
 *                                          deliverable shows only its final text; text before a deliverable stays in 过程
 *   thinking  { step }                     one line while the task is not done (the caller renders the elapsed time)
 *   failed    { reason }                   a done task with an error
 *
 * A run is what one user line started: task.input opens the first, each follow-up the next. Deliverables belong to
 * the run whose window (its user line up to the next) holds their createdAt, so old tasks whose activity was trimmed
 * still show the bubble and every deliverable under it.
 */
'use strict'

const time = (iso) => { const n = iso ? new Date(iso).getTime() : NaN; return Number.isFinite(n) ? n : 0 }

/**
 * What the meta line under a deliverable may say about verification, read from the task (the live copy), never from a
 * stale deliverable: a deliverable must not read 已核验 before the verifier has stamped it.
 *   verifying  task.status is 'verifying', or nothing is stamped yet and the task is not done
 *   passed     { checked, issues, notes }
 *   issues     { checked, issues, notes }
 *   none       the verifier could not decide (passed === null)
 *   ''         a done task that was never verified (verification switched off): no verdict word at all
 */
function verifyState(task) {
  const t = task || {}
  const v = t.verification && typeof t.verification === 'object' ? t.verification : null
  const done = t.status === 'done'
  if (t.status === 'verifying') return { kind: 'verifying', checked: 0, issues: 0, notes: '' }
  if (!v) return done ? { kind: '', checked: 0, issues: 0, notes: '' } : { kind: 'verifying', checked: 0, issues: 0, notes: '' }
  const checked = Number(v.checked) || 0
  const issues = Number(v.issues) || 0
  const notes = typeof v.notes === 'string' ? v.notes : ''
  if (v.passed === true) return { kind: 'passed', checked, issues, notes }
  if (v.passed === false) return { kind: 'issues', checked, issues, notes }
  return { kind: 'none', checked, issues, notes }
}

function threadOf(task, deliverables) {
  const t = task || {}
  const activity = Array.isArray(t.activity) ? t.activity : []
  const done = t.status === 'done'
  const docs = (Array.isArray(deliverables) && deliverables.length ? deliverables : Array.isArray(t.deliverables) ? t.deliverables : [])
    .filter((d) => d && typeof d === 'object').slice().sort((a, b) => time(a.createdAt) - time(b.createdAt))
  const verify = verifyState(t)

  // Split the activity into runs, each opened by a user line.
  const runs = [{ at: t.createdAt || '', text: String(t.input || ''), entries: [] }]
  for (const e of activity) {
    if (!e || typeof e !== 'object') continue
    if (e.kind === 'user') { runs.push({ at: e.at || '', text: String(e.text || ''), entries: [] }); continue }
    runs[runs.length - 1].entries.push(e)
  }

  const out = []
  let seq = 0
  runs.forEach((run, i) => {
    const last = i === runs.length - 1
    const start = time(run.at)
    const end = last ? Infinity : time(runs[i + 1].at)
    out.push({ kind: 'user', key: 'u' + i, at: run.at, text: run.text })
    // Deliverables of this run: the first run also takes anything stamped before its own line (trimmed history, clock skew).
    const mine = docs.filter((d) => { const c = time(d.createdAt); return (i === 0 || c >= start) && c < end })
    for (const d of mine) out.push({ kind: 'deliver', key: 'd' + (d.id || seq++), at: d.createdAt || run.at, d, verify })
    const texts = run.entries.filter((e) => e.kind === 'text' && String(e.text || '').trim())
    if (mine.length) {
      const lastDoc = time(mine[mine.length - 1].createdAt)
      for (const e of texts) if (time(e.at) > lastDoc) out.push({ kind: 'text', key: 't' + seq++, at: e.at, text: String(e.text) })
    } else if (!(last && !done)) {
      // No deliverable: the reply is the run's final text. While the last run is still going, the thinking line speaks instead.
      const final = texts[texts.length - 1]
      if (final) out.push({ kind: 'text', key: 't' + seq++, at: final.at, text: String(final.text) })
      else if (i === 0 && last && done && !t.error && !docs.length && !activity.some((e) => e && e.kind === 'text') && String(t.summary || '').trim()) {
        out.push({ kind: 'text', key: 't' + seq++, at: t.finishedAt || run.at, text: String(t.summary) }) // old task whose activity was trimmed: what is left of the answer
      }
    }
  })

  if (!done) out.push({ kind: 'thinking', key: 'thinking', at: '', step: String(t.currentStep || t.statusLabel || '') })
  else if (t.error) out.push({ kind: 'failed', key: 'failed', at: t.finishedAt || '', reason: String(t.error) })
  return out
}

// ---- 今日's line (§8.3): the client's side of GET /feed ------------------------------------------------------------
// Entries come from the server ascending by `at` with no date entries; the client keeps everything it has fetched,
// shows from a cut-off (`from`, local midnight of the oldest day revealed) and draws the separators itself.

const pad2 = (n) => String(n).padStart(2, '0')
/** Local calendar day of an ISO stamp as YYYY-MM-DD ('' when unparsable): what separators and 「今天」 compare by. */
function localDay(iso) { const d = new Date(iso); if (!Number.isFinite(d.getTime())) return ''; return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) }
const parts = (day) => String(day || '').split('-').map(Number)
/** Local midnight that starts a YYYY-MM-DD day, as ISO. */
function dayStartIso(day) { const [y, m, d] = parts(day); return new Date(y || 1970, (m || 1) - 1, d || 1).toISOString() }
/** The YYYY-MM-DD day `n` days after `day`. */
function shiftDay(day, n) { const [y, m, d] = parts(day); return localDay(new Date(y || 1970, (m || 1) - 1, (d || 1) + n).toISOString()) }
/** 「9/29」 for a YYYY-MM-DD day. */
function shortDay(day) { const [, m, d] = parts(day); return (m || 0) + '/' + (d || 0) }
/** Identity of a feed entry across pages and polls: kind, stamp and the thing it points at. */
function feedKey(e) { return e.kind + '|' + (e.at || '') + '|' + (e.id || e.routineId || e.taskId || '') }
/** Merge a page into what is loaded: the same key replaces (a reminder's ack lands this way), the rest joins; ascending by at. */
function mergeFeed(existing, incoming) {
  const map = new Map()
  for (const e of existing || []) if (e) map.set(feedKey(e), e)
  for (const e of incoming || []) if (e) map.set(feedKey(e), e)
  return [...map.values()].sort((a, b) => time(a.at) - time(b.at))
}
/** The day of the newest loaded entry before `from` (ISO): what 「加载昨天」 reveals next; '' when nothing is loaded there. */
function olderDayOf(entries, from) {
  const cut = time(from)
  let best = null
  for (const e of entries || []) { if (!e) continue; const t = time(e.at); if (t < cut && (!best || t > time(best.at))) best = e }
  return best ? localDay(best.at) : ''
}
/**
 * What the line renders: the entries from `from` on, each with its key and a `today` flag, and one date separator
 * before the first entry of every day but today — 「昨天 · 9/29」, then 「9/28」.
 */
function feedRows(entries, from, today, yesterdayWord) {
  const cut = time(from)
  const out = []
  let day = ''
  for (const e of entries || []) {
    if (!e || time(e.at) < cut) continue
    const d = localDay(e.at)
    if (d !== day) { day = d; if (d && d !== today) out.push({ kind: 'date', key: 'date|' + d, at: e.at, day: d, label: d === shiftDay(today, -1) ? String(yesterdayWord || '') + ' · ' + shortDay(d) : shortDay(d) }) }
    out.push({ ...e, key: feedKey(e), today: d === today })
  }
  return out
}

module.exports = { threadOf, verifyState, localDay, dayStartIso, shiftDay, shortDay, feedKey, mergeFeed, olderDayOf, feedRows }
