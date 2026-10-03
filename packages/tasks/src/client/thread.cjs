/**
 * A teammate's conversation (§9): one thread made of runs. Each run is one turn of work — what you said (or what a
 * routine said for you), what came back — and renders as its own block in time order. Pure CommonJS (no React, no
 * locale) so the client bundle inlines it as a prelude and node tests can require it.
 *
 *   threadOf(run, deliverables?) → [{ kind, key, at, ... }]        one run's entries
 *
 * Entry kinds, in the order they appear:
 *   routine   { title, routineId }             a routine run opens with a centred line 「<routineTitle> · HH:MM」 (at = createdAt)
 *   user      { text }                         run.input first — unless the run's trigger is 'system' (the hidden intro) or
 *                                              'routine' — then every activity entry of kind 'user' (a message that steered
 *                                              the run while it worked)
 *   deliver   { d, ds, text, verify }          ONE per segment that delivered: its reply `text` (activity text after the
 *                                              segment's last deliverable/question, joined; '' when none), all its
 *                                              deliverables `ds` (d = ds[0]); at = the later of the last file / reply;
 *                                              `verify` is verifyState(run), read live
 *   text      { text }                         a reply in a segment without a deliverable: its final text
 *   ask       { id, status, question, askKind, options, detail, answer, answerable }
 *                                              a question the run stopped on; status pending | answered | superseded |
 *                                              expired; answerable = the newest pending question of a waiting run
 *   scheduled { routineId, title, scheduleLabel }  activity { kind:'routine', action:'created' }: 「已安排 · 每天 19:00 写日报」
 *   remind    { routineId, title, acked }      a reminder card (activity { kind:'remind' }, or a whole synthetic remind run)
 *   auto      {}                               the 24 h resume (the user line with auto: true): one muted line
 *   thinking  { step }                         one line while the run works (status running, not queued); the caller adds the time
 *   queued    {}                               the run has not started: it waits behind the teammate's current run
 *   stopped   {}                               a done run you stopped (error 已停止 / 已取消): a centred 「已停止」, not a failure
 *   failed    { reason }                       a done run with any other error
 *
 * A segment is what one user line started: the run's input opens the first, each steer the next. The line that answers
 * a question (askId) and the 24 h resume (auto) do not open a segment and are not bubbles: the question shows its answer.
 * Deliverables belong to the segment whose window holds their createdAt.
 */
'use strict'

const time = (iso) => { const n = iso ? new Date(iso).getTime() : NaN; return Number.isFinite(n) ? n : 0 }
const str = (v) => (v === undefined || v === null ? '' : String(v))

/** Working: not done and not stopped on a question (a queued run counts: it is about to work). */
function isLive(run) { const s = run && run.status; return !!s && s !== 'done' && s !== 'waiting' }
/** Waiting its turn: the server sends a queued run as status 'running' with queued: true. */
function isQueued(run) { return !!run && (run.status === 'queued' || (run.queued === true && run.status !== 'done' && run.status !== 'waiting')) }
/** Ended by 停止 (engine STOPPED 「已停止。」, or a cancel), which is not a failure. */
function isStopped(error) { return /已停止|已取消|cancel/i.test(str(error)) }

/**
 * What the meta line under a deliverable may say about verification, read from the run (the live copy), never from a
 * stale deliverable. Verification runs in the background after the run is done (§9.7): the server flags the run
 * `verifying: true` while the verifier works, then stamps `verification`. A stamp that says it is still going
 * ({ status: 'verifying' | 'running' | 'pending' } or { pending: true }) also reads 核验中.
 *   verifying  run.verifying (or a stamp still going)
 *   passed     { checked, issues, notes }
 *   issues     { checked, issues, notes }
 *   none       the verifier could not decide (passed === null)
 *   ''         nothing verifying and nothing stamped (a run still working, or one never verified): no word at all
 */
function verifyState(run) {
  const t = run || {}
  const v = t.verification && typeof t.verification === 'object' ? t.verification : null
  const going = { kind: 'verifying', checked: 0, issues: 0, notes: '' }
  if (t.verifying === true || t.status === 'verifying') return going
  if (!v) return { kind: '', checked: 0, issues: 0, notes: '' }
  if (v.pending === true || v.status === 'verifying' || v.status === 'running' || v.status === 'pending' || v.status === 'queued') return going
  const checked = Number(v.checked) || 0
  const issues = Number(v.issues) || 0
  const notes = typeof v.notes === 'string' ? v.notes : ''
  if (v.passed === true) return { kind: 'passed', checked, issues, notes }
  if (v.passed === false) return { kind: 'issues', checked, issues, notes }
  return { kind: 'none', checked, issues, notes }
}

/** A run that is only a reminder firing (the server may send it as its own synthetic run). */
function remindOf(run) {
  const r = run || {}
  if (r.kind === 'remind' || (r.remind && typeof r.remind === 'object') || r.trigger === 'remind') {
    const x = r.remind && typeof r.remind === 'object' ? r.remind : {}
    return { routineId: str(x.routineId || r.routineId), title: str(x.title || r.routineTitle || x.text || r.input), at: str(x.at || r.createdAt), acked: !!(x.acked || x.ackedAt || r.acked || r.ackedAt) }
  }
  return null
}

function threadOf(run, deliverables) {
  const r = run || {}
  const out = []
  const synthetic = remindOf(r)
  if (synthetic) { out.push({ kind: 'remind', key: 'rm', ...synthetic }); return out }
  const activity = Array.isArray(r.activity) ? r.activity : []
  const done = r.status === 'done'
  const waiting = r.status === 'waiting'
  const trigger = r.trigger || 'user'
  const docs = (Array.isArray(deliverables) && deliverables.length ? deliverables : Array.isArray(r.deliverables) ? r.deliverables : [])
    .filter((d) => d && typeof d === 'object').slice().sort((a, b) => time(a.createdAt) - time(b.createdAt))
  const verify = verifyState(r)
  // The one question that can still be answered: the newest pending ask, and only while the run waits on it.
  let newestPending = null
  for (const e of activity) if (e && e.kind === 'ask' && askStatus(e) === 'pending') newestPending = e

  if (trigger === 'routine') out.push({ kind: 'routine', key: 'rt', at: str(r.createdAt), title: str(r.routineTitle), routineId: str(r.routineId) })

  // Split the activity into segments, each opened by a user line (an answer or the 24 h resume continues its segment).
  const segs = [{ at: str(r.createdAt), text: str(r.input), bubble: trigger === 'user' && !!str(r.input).trim(), entries: [] }]
  for (const e of activity) {
    if (!e || typeof e !== 'object') continue
    if (e.kind === 'user' && !e.askId && !e.auto) { segs.push({ at: str(e.at), text: str(e.text), bubble: true, entries: [] }); continue }
    segs[segs.length - 1].entries.push(e)
  }

  let seq = 0
  segs.forEach((seg, i) => {
    const last = i === segs.length - 1
    const start = time(seg.at)
    const end = last ? Infinity : time(segs[i + 1].at)
    if (seg.bubble) out.push({ kind: 'user', key: 'u' + i, at: seg.at, text: seg.text })
    const body = []
    // Deliverables of this segment: the first also takes anything stamped before its own line (clock skew, trimmed history).
    const mine = docs.filter((d) => { const c = time(d.createdAt); return (i === 0 || c >= start) && c < end })
    const asks = seg.entries.filter((e) => e.kind === 'ask')
    for (const a of asks) {
      let status = askStatus(a)
      if (status === 'pending' && a !== newestPending) status = 'superseded' // only the newest question is open
      body.push({
        kind: 'ask', key: 'a' + (a.id || seq++), at: str(a.at), id: str(a.id), status,
        question: str(a.question || a.text), askKind: a.askKind || 'text', options: Array.isArray(a.options) ? a.options.map(String) : [],
        detail: typeof a.detail === 'string' ? a.detail : '', answer: str(a.answer),
        answerable: status === 'pending' && waiting,
      })
    }
    for (const e of seg.entries) {
      if (e.kind === 'user' && e.auto) body.push({ kind: 'auto', key: 'r' + seq++, at: str(e.at) })
      else if (e.kind === 'routine' && (e.action === 'created' || !e.action)) body.push({ kind: 'scheduled', key: 's' + (e.routineId || seq++), at: str(e.at), routineId: str(e.routineId || e.id), title: str(e.title), scheduleLabel: str(e.scheduleLabel) })
      else if (e.kind === 'remind') body.push({ kind: 'remind', key: 'm' + seq++, at: str(e.at), routineId: str(e.routineId || e.id), title: str(e.title || e.text), acked: !!(e.acked || e.ackedAt) })
    }
    // Text before the segment's last deliverable or question is narration (过程); what comes after it is the reply.
    const cut = Math.max(mine.length ? time(mine[mine.length - 1].createdAt) : -Infinity, asks.length ? time(asks[asks.length - 1].at) : -Infinity)
    const texts = seg.entries.filter((e) => e.kind === 'text' && str(e.text).trim())
    if (mine.length) {
      // One bubble for the segment's output: the reply, the ✓ rows, every file card.
      const reply = texts.filter((e) => time(e.at) > cut)
      const lastDoc = mine[mine.length - 1]
      const at = reply.length ? reply[reply.length - 1].at : (lastDoc.createdAt || seg.at)
      body.push({ kind: 'deliver', key: 'd' + (mine[0].id || seq++), at: str(at), d: mine[0], ds: mine, text: reply.map((e) => str(e.text)).join('\n\n'), verify })
    } else if (!(last && !done)) {
      // No deliverable: the reply is the segment's final text. While the last segment is still going, the working line speaks.
      const final = texts[texts.length - 1]
      if (final && time(final.at) > cut) body.push({ kind: 'text', key: 't' + seq++, at: final.at, text: str(final.text) })
      else if (!final && i === 0 && last && done && !r.error && !docs.length && !activity.some((e) => e && e.kind === 'text') && str(r.summary).trim()) {
        body.push({ kind: 'text', key: 't' + seq++, at: r.finishedAt || seg.at, text: str(r.summary) }) // a migrated task whose activity was trimmed
      }
    }
    // In time order; entries stamped at the same moment keep the order above.
    body.map((e, n) => ({ e, n, at: time(e.at) })).sort((a, b) => a.at - b.at || a.n - b.n).forEach((x) => out.push(x.e))
  })

  if (!done && !waiting) {
    if (isQueued(r)) out.push({ kind: 'queued', key: 'queued', at: '' })
    else out.push({ kind: 'thinking', key: 'thinking', at: '', step: str(r.step || r.currentStep || r.statusLabel) })
  } else if (done && r.error) {
    if (isStopped(r.error)) out.push({ kind: 'stopped', key: 'stopped', at: str(r.finishedAt) })
    else out.push({ kind: 'failed', key: 'failed', at: str(r.finishedAt), reason: str(r.error) })
  }
  return out
}

/** An ask entry's status; legacy entries without one are open until they carry an answer. */
function askStatus(a) {
  if (a.status === 'pending' || a.status === 'answered' || a.status === 'superseded' || a.status === 'expired') return a.status
  return a.answer ? 'answered' : 'pending'
}

// ---- the thread as a whole -------------------------------------------------------------------------------------------

/** Merge a page of runs into what is loaded: the same id replaces, the rest joins; ascending by createdAt. */
function mergeRuns(existing, incoming) {
  const map = new Map()
  for (const r of existing || []) if (r && r.id) map.set(r.id, r)
  for (const r of incoming || []) if (r && r.id) map.set(r.id, r)
  return [...map.values()].sort((a, b) => time(a.createdAt) - time(b.createdAt) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

/**
 * The run that is actually working right now, or null: the newest one running (not queued), else the newest waiting on
 * you, else the newest queued. A message sent while a routine run works is queued behind it; the routine run stays the
 * one on screen (电脑, the avatar ring) until it ends.
 */
function activeRun(runs) {
  const list = (runs || []).filter((r) => r && r.status && r.status !== 'done')
  const newest = (pred) => { for (let i = list.length - 1; i >= 0; i--) if (pred(list[i])) return list[i]; return null }
  return newest((r) => r.status !== 'waiting' && !isQueued(r)) || newest((r) => r.status === 'waiting') || newest(isQueued)
}

/** The text question the dock answers: the newest run waits on an ask of kind text. */
function textAskOf(runs) {
  const list = runs || []
  const r = list[list.length - 1]
  if (!r || r.status !== 'waiting' || !r.ask || typeof r.ask !== 'object') return null
  return (r.ask.askKind || 'text') === 'text' ? r.ask : null
}

/** The column's one order rule (§9.4): pinned first (the default mate counts as pinned unless unpinned), then newest lastAt. */
function mateOrder(mates) {
  const pinned = (m) => m.pinned === true || (!!m.isDefault && m.pinned !== false)
  return (mates || []).filter((m) => m && m.id).slice().sort((a, b) =>
    (pinned(b) ? 1 : 0) - (pinned(a) ? 1 : 0)
    || (pinned(a) && pinned(b) ? (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0) : 0)
    || time(b.lastAt || b.createdAt) - time(a.lastAt || a.createdAt)
    || (a.id < b.id ? -1 : 1))
}

/**
 * One routine run receipt as the right panel's run rows say it: result (jumps to the run) | quiet | failed | fired |
 * running. A receipt starts as { at, taskId } when the run is queued and is settled with `changed` (and `error`) when it
 * ends; one that is not settled yet is still running.
 */
function routineRunKind(x) {
  if (!x || typeof x !== 'object') return 'quiet'
  if (x.error) return 'failed'
  if (x.fired) return 'fired'
  if (x.quiet === true || x.changed === false) return 'quiet'
  if ((x.status && x.status !== 'done') || (!('changed' in x) && (x.runId || x.taskId))) return 'running'
  return 'result'
}

/** The first character of a name, whole (a surrogate pair stays one character). */
function initialOf(name) { const s = str(name).trim(); return s ? Array.from(s)[0].toUpperCase() : '·' }

/**
 * Which runs of one teammate's thread render folded (the user line, then one compact file row per deliverable): every
 * migrated run, and every finished run older than the newest `keep` finished runs. Live, waiting and queued runs never fold.
 */
function foldedRunIds(runs, keep) {
  const n = Number.isFinite(keep) ? keep : 5
  const done = (runs || []).filter((r) => r && r.status === 'done')
  const recent = new Set(done.slice(Math.max(0, done.length - n)).map((r) => r.id))
  const out = new Set()
  for (const r of done) if (r.migrated === true || !recent.has(r.id)) out.add(r.id)
  return out
}

// ---- a teammate's folder files (the 电脑 rows that open in the reading view) -----------------------------------------

/** What the reading view does with a folder file, by extension (the server reads these five): table | markdown | text | json | ''. */
function fileKindOf(name) {
  const m = str(name).toLowerCase().match(/\.([a-z0-9]+)$/)
  const ext = m ? m[1] : ''
  return ext === 'csv' || ext === 'tsv' ? 'table' : ext === 'md' ? 'markdown' : ext === 'txt' ? 'text' : ext === 'json' ? 'json' : ''
}

/**
 * How any folder file opens (every 电脑 row opens): 'text' — read in the reading view (fileKindOf, GET /mates/file);
 * 'image' — shown in the reading view from a signed link; 'page' — HTML / PDF, shown in the live browser (never an
 * iframe); 'download' — Office files and anything else.
 */
function openKindOf(name) {
  if (fileKindOf(name)) return 'text'
  const m = str(name).toLowerCase().match(/\.([a-z0-9]+)$/)
  const ext = m ? m[1] : ''
  return /^(png|jpe?g|gif|webp)$/.test(ext) ? 'image' : /^(html?|pdf)$/.test(ext) ? 'page' : 'download'
}

/**
 * CSV (or, with a tab, TSV) as rows of cells, RFC 4180: a field that starts with a quote may hold the delimiter, line
 * breaks and doubled quotes (""); CRLF, LF or CR end a row; a leading BOM goes; blank lines are not rows; an unclosed
 * quote runs to the end. Rows keep their own length (tableOf pads them).
 */
function parseDelimited(text, delimiter) {
  const s = str(text).replace(/^﻿/, '')
  const d = delimiter || ','
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  let start = true // at the start of a field: a quote here opens a quoted field
  let any = false // the row has something in it (a blank line is not a row)
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (quoted) {
      if (c !== '"') { cell += c; continue }
      if (s[i + 1] === '"') { cell += '"'; i++; continue }
      quoted = false
      continue
    }
    if (c === '"' && start) { quoted = true; start = false; any = true; continue }
    if (c === d) { row.push(cell); cell = ''; start = true; any = true; continue }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++
      if (any) { row.push(cell); rows.push(row) }
      row = []; cell = ''; start = true; any = false
      continue
    }
    cell += c; start = false; any = true
  }
  if (any) { row.push(cell); rows.push(row) }
  return rows
}

/** A number as a table cell may hold it: 1,234.5 · -3 · +1.2% · ¥12 · $1,000 (no units, no dates, no times). */
const NUMERIC = /^[+\-−]?[¥$€£]?\s?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\s?[%‰]?$|^[+\-−]?\.\d+%?$/
const isNumericCell = (v) => NUMERIC.test(str(v).trim())

/**
 * A table file for the reading view: { header, rows, width, numeric } — the first row is the header, every row padded to
 * the widest one, and numeric[j] when every non-empty cell of column j (below the header) is a number (right-aligned).
 */
function tableOf(text, delimiter) {
  const all = parseDelimited(text, delimiter)
  const width = all.reduce((n, r) => Math.max(n, r.length), 0)
  const pad = (r) => (r.length < width ? r.concat(Array(width - r.length).fill('')) : r)
  const header = all.length ? pad(all[0]) : []
  const rows = all.slice(1).map(pad)
  const numeric = header.map((_, j) => {
    let seen = 0
    for (const r of rows) { const v = str(r[j]).trim(); if (!v) continue; if (!isNumericCell(v)) return false; seen++ }
    return seen > 0
  })
  return { header, rows, width, numeric }
}

/** A cell's text split into plain runs and http(s) links: [{ text, href? }]; a link's trailing punctuation stays text. */
function linkRuns(text) {
  const s = str(text)
  const out = []
  const re = /https?:\/\/[^\s<>"'，。；、！？）】」]+/gi
  let at = 0
  let m
  while ((m = re.exec(s))) {
    let url = m[0]
    const trail = url.match(/[.,;:!?)\]]+$/)
    if (trail) url = url.slice(0, -trail[0].length)
    if (m.index > at) out.push({ text: s.slice(at, m.index) })
    out.push({ text: url, href: url })
    at = m.index + url.length
    re.lastIndex = at
  }
  if (at < s.length) out.push({ text: s.slice(at) })
  return out
}

module.exports = {
  foldedRunIds, threadOf, verifyState, isLive, isQueued, isStopped, remindOf, mergeRuns, activeRun, textAskOf, mateOrder, routineRunKind, initialOf,
  fileKindOf, openKindOf, parseDelimited, isNumericCell, tableOf, linkRuns,
}
