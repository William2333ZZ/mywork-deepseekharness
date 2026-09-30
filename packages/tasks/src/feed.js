/**
 * dsh-mywork-tasks — 今日's line across days (design/v2/TEAMMATES.md §8.3 「今日线程」 and 「助理的连续性」).
 *
 *   buildFeed({ store, deliverables, routines, before, limit, today }) → { entries, nextBefore, today }
 *
 * One line, merged by time, of what a person reads back on 今日:
 *   user / text / handoff   the thread entries of every assistant-scenario task, whatever day; tool entries never
 *   remind                  a reminder that fired (the routine's fired[] list, plus runs marked fired that the list lost)
 *   change                  a routine task run that changed or is a report; quiet runs are not in the line, reports always are
 * Entries ascend by `at`. The page is the newest `limit` entries strictly before `before` (or the newest overall);
 * entries that share the boundary stamp stay on the same page, so paging by `at` never skips one. `nextBefore` is
 * the oldest returned `at`, or null when nothing older exists. No date entries: the client draws separators from `at`.
 *
 *   buildFeed entry shapes
 *     { kind: 'user',    at, text, taskId }
 *     { kind: 'text',    at, text, taskId }
 *     { kind: 'handoff', at, target: 'task' | 'routine', id, title, schedule?, followup?: true, taskId }
 *     { kind: 'remind',  at, routineId, title, acked }
 *     { kind: 'change',  at, routineId, taskId, title, report }
 *
 *   assistantMemory({ store, deliverables, today }) → { recent, history, results }
 *
 * What the day's assistant is told at compose time so it stays one assistant across days: the newest five user
 * tasks (id · title · status word, so 「再短一点」 can be routed to the right task with mywork_task_say), the last
 * twenty user / assistant lines of earlier days (≤ 2000 characters, plain words, oldest first) and the last three
 * result titles. Facts only: the assistant never reads, and so never says, that it cannot see yesterday.
 */
import { lastAtOf, STATUS_LABELS, stripMarkdown, ts } from './store.js'
import { wantsRecord } from './routines.js'

const DEFAULT_LIMIT = 60
const MAX_LIMIT = 200
/** A reminder's run receipt and its fired[] entry are stamped by two clocks a few ms apart. */
const SAME_FIRING_MS = 5000

const itemsOf = (x) => Array.isArray(x) ? x : x && Array.isArray(x.items) ? x.items : []
const valid = (iso) => Number.isFinite(ts(iso))
const pad = (n) => String(n).padStart(2, '0')

/** Local calendar day of an ISO stamp in the dayKey format, '' when unparsable. */
export function localDay(iso) {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

/** Whole markdown text as one plain line: marks stripped, lines joined by spaces, at most `max` characters. */
export function plainText(text, max = 200) {
  const s = String(text || '').split('\n').map(stripMarkdown).filter(Boolean).join(' ')
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

/** The status word beside a task in 「最近的任务」: 排队 / 执行 / 交付 / 核验 / 等你答, then 已交付 / 已完成 / 失败. */
export function statusWord(task, deliverables) {
  if (task.status === 'done') return task.error ? '失败' : (deliverables && deliverables.length ? '已交付' : '已完成')
  if (task.status === 'waiting') return '等你答'
  return STATUS_LABELS[task.status] || String(task.status || '')
}

export function buildFeed({ store, deliverables: _deliverables, routines, before, limit, today } = {}) {
  const tasks = itemsOf(store)
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const out = []
  for (const t of tasks) {
    if (!t || t.scenario !== 'assistant') continue
    const activity = Array.isArray(t.activity) ? t.activity : []
    // The first line of a day is stored as an activity entry; an older thread (or one trimmed at the front) shows its input instead.
    const input = String(t.input || '').trim()
    if (input && valid(t.createdAt) && !activity.some((a) => a && a.kind === 'user' && String(a.text || '').trim() === input)) out.push({ kind: 'user', at: t.createdAt, text: input, taskId: t.id })
    for (const a of activity) {
      if (!a || typeof a !== 'object' || !valid(a.at)) continue
      if (a.kind === 'user' || a.kind === 'text') out.push({ kind: a.kind, at: a.at, text: String(a.text || ''), taskId: t.id })
      else if (a.kind === 'handoff') out.push({ kind: 'handoff', at: a.at, target: a.target === 'routine' ? 'routine' : 'task', id: String(a.id || ''), title: String(a.title || ''), ...(a.schedule ? { schedule: String(a.schedule) } : {}), ...(a.followup ? { followup: true } : {}), taskId: t.id })
    }
  }
  for (const r of itemsOf(routines)) {
    if (!r) continue
    const firedAt = []
    for (const f of Array.isArray(r.fired) ? r.fired : []) {
      if (!f || !valid(f.at)) continue
      firedAt.push(ts(f.at))
      out.push({ kind: 'remind', at: f.at, routineId: r.id, title: String(r.title || ''), acked: !!f.ackAt })
    }
    for (const run of Array.isArray(r.runs) ? r.runs : []) {
      if (!run || !valid(run.at)) continue
      if (run.fired === true) {
        // A firing the fired[] list no longer holds (it keeps thirty) is long acknowledged.
        if (!firedAt.some((x) => Math.abs(x - ts(run.at)) < SAME_FIRING_MS)) out.push({ kind: 'remind', at: run.at, routineId: r.id, title: String(r.title || ''), acked: true })
        continue
      }
      if (!run.taskId) continue
      const t = byId.get(run.taskId)
      if (!t) continue
      const settled = 'changed' in run || !!run.error
      if (!settled || run.error) continue // in flight, or failed: the 等你看 bar and the task's own row carry those
      const report = wantsRecord(r) || t.report === true
      if (!report && run.changed !== true) continue // quiet, or no verdict: not news
      out.push({ kind: 'change', at: run.settledAt || t.finishedAt || run.at, routineId: r.id, taskId: t.id, title: String(r.title || ''), report })
    }
  }
  out.sort((a, b) => ts(a.at) - ts(b.at))
  const cut = before === undefined || before === null || before === '' ? Infinity : ts(before)
  const eligible = cut === Infinity ? out : out.filter((e) => ts(e.at) < cut)
  const n = Math.max(1, Math.min(MAX_LIMIT, Math.floor(Number(limit)) || DEFAULT_LIMIT))
  let start = Math.max(0, eligible.length - n)
  while (start > 0 && ts(eligible[start - 1].at) === ts(eligible[start].at)) start -= 1
  const entries = eligible.slice(start)
  return { entries, nextBefore: start > 0 && entries.length ? entries[0].at : null, today: today || localDay(new Date().toISOString()) }
}

export function assistantMemory({ store, deliverables, today, recent = 5, lines = 20, chars = 2000, results = 3 } = {}) {
  const tasks = itemsOf(store)
  const docs = itemsOf(deliverables)
  const docsOf = (id) => docs.filter((d) => d && d.taskId === id)
  const day = today || localDay(new Date().toISOString())
  const recentList = tasks
    .filter((t) => t && t.scenario !== 'assistant' && !t.quiet)
    .map((t) => ({ t, at: lastAtOf(t, docsOf(t.id)) }))
    .sort((a, b) => ts(b.at) - ts(a.at))
    .slice(0, recent)
    .map(({ t }) => ({ id: t.id, title: String(t.title || ''), status: statusWord(t, docsOf(t.id)) }))
  const said = []
  for (const t of tasks) {
    if (!t || t.scenario !== 'assistant') continue
    const d = t.dayKey || localDay(t.createdAt)
    if (!d || !(d < day)) continue
    for (const a of Array.isArray(t.activity) ? t.activity : []) {
      if (!a || (a.kind !== 'user' && a.kind !== 'text') || !valid(a.at)) continue
      const line = plainText(a.text)
      if (!line) continue
      const when = new Date(a.at)
      said.push({ at: a.at, text: `${when.getMonth() + 1}/${when.getDate()} ${a.kind === 'user' ? '用户' : '你'}：${line}` })
    }
  }
  said.sort((a, b) => ts(a.at) - ts(b.at))
  const history = said.slice(-lines)
  while (history.length && history.reduce((n, x) => n + x.text.length + 1, 0) > chars) history.shift()
  const quiet = new Set(tasks.filter((t) => t && t.quiet).map((t) => t.id))
  const resultTitles = docs.filter((d) => d && !quiet.has(d.taskId)).sort((a, b) => ts(b.createdAt) - ts(a.createdAt)).slice(0, results).map((d) => String(d.title || ''))
  return { recent: recentList, history: history.map((x) => x.text).join('\n'), results: resultTitles }
}
