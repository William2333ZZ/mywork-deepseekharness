/**
 * dsh-mywork-im — scheduled-task → IM notifications, configured PER TASK (host side).
 *
 * @michengai/dsh-automation keeps its tasks and runs in $DSH_HOME/storages/dsh_automation.json
 * (tables.definitions / tables.runs; a run records the session id, which starts with
 * `dsh-automation-session-`). We watch dsh's global `session/event` stream; when a run's
 * turn ends we look the run up by session id, take that task's notification setting and
 * send the last assistant reply to the chosen chat.
 *
 * Config: $DSH_HOME/mywork/im-notify.json
 *   { automation: { tasks: { [automationId]: { target, when } }, default: { target, when } | null, maxChars } }
 *   (`default` is only reachable through the API / tool; the UI is strictly per task)
 *   target = IM chat session id (see chats.js), when = 'always' | 'failed'
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export const AUTOMATION_SESSION_PREFIX = 'dsh-automation-session-'
export const dshHome = (env = process.env) => env.DSH_HOME || join(homedir(), '.dsh')
export const notifyConfigPath = (env = process.env) => join(dshHome(env), 'mywork', 'im-notify.json')
export const automationStorePath = (env = process.env) => join(dshHome(env), 'storages', 'dsh_automation.json')

const rule = (v) => {
  if (!v || typeof v !== 'object') return null
  const target = typeof v.target === 'string' ? v.target.trim() : ''
  if (!target) return null
  return { target, when: v.when === 'failed' ? 'failed' : 'always' }
}
export function normalizeNotifyConfig(input) {
  const a = input && typeof input === 'object' && input.automation && typeof input.automation === 'object' ? input.automation : {}
  const tasks = {}
  if (a.tasks && typeof a.tasks === 'object') for (const [id, v] of Object.entries(a.tasks)) { const r = rule(v); if (r && id) tasks[id] = r }
  return { automation: { tasks, default: rule(a.default), maxChars: Math.min(4000, Math.max(200, Number(a.maxChars) || 1500)) } }
}
export function readNotifyConfig(path = notifyConfigPath()) {
  try { return normalizeNotifyConfig(JSON.parse(readFileSync(path, 'utf8'))) } catch { return normalizeNotifyConfig({}) }
}
export function writeNotifyConfig(config, path = notifyConfigPath()) {
  const value = normalizeNotifyConfig(config)
  mkdirSync(dirname(path), { recursive: true })
  const tmp = path + '.tmp-' + process.pid
  writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n')
  renameSync(tmp, path)
  return value
}

/** Tasks and runs from Automation's store (empty when the plugin is not installed / no tasks yet). */
export function readAutomationStore(path = automationStorePath()) {
  try {
    const doc = JSON.parse(readFileSync(path, 'utf8'))
    const t = doc && doc.tables ? doc.tables : {}
    return { definitions: t.definitions && typeof t.definitions === 'object' ? t.definitions : {}, runs: t.runs && typeof t.runs === 'object' ? t.runs : {} }
  } catch { return { definitions: {}, runs: {} } }
}
export function listAutomationTasks(store = readAutomationStore()) {
  return Object.values(store.definitions).filter((d) => d && d.id).map((d) => ({
    id: d.id, name: d.name || d.id, status: d.status || '', schedule: d.schedule && d.schedule.kind ? String(d.schedule.kind) : '', rrule: typeof d.rrule === 'string' ? d.rrule : '', updatedAt: d.updatedAt || d.createdAt || '',
  })).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
}
/** Find the task a run session belongs to. */
export function taskForSession(sessionId, store = readAutomationStore()) {
  const run = Object.values(store.runs).find((r) => r && r.sessionId === sessionId)
  if (!run) return null
  const def = store.definitions[run.automationId]
  return { id: run.automationId, name: (def && def.name) || run.automationName || run.automationId, run }
}
/** Resolve a task by id or (unique) name / substring. */
export function resolveTask(query, tasks) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return { error: 'task is required' }
  const exact = tasks.filter((t) => t.id.toLowerCase() === q || t.name.toLowerCase() === q)
  if (exact.length === 1) return { task: exact[0] }
  const fuzzy = exact.length ? exact : tasks.filter((t) => t.name.toLowerCase().includes(q))
  if (fuzzy.length === 1) return { task: fuzzy[0] }
  if (fuzzy.length > 1) return { error: `"${query}" matches several tasks: ` + fuzzy.map((t) => `${t.name} (${t.id})`).join(' | ') }
  return { error: `no scheduled task matches "${query}"; known: ` + (tasks.map((t) => `${t.name} (${t.id})`).join(' | ') || '(none)') }
}
export function ruleForTask(config, taskId) {
  return (config.automation.tasks && config.automation.tasks[taskId]) || config.automation.default || null
}

/** Text of an assistant/message event (text blocks joined), '' when none. */
export function assistantText(event) {
  const blocks = event && event.data && event.data.message && Array.isArray(event.data.message.content) ? event.data.message.content : []
  return blocks.filter((b) => b && b.type === 'text' && typeof b.text === 'string').map((b) => b.text).join('\n').trim()
}
/** Compose the IM message for one finished run turn; null when nothing should be sent. */
export function composeRunMessage({ title, text, reason, when, maxChars }) {
  const failed = !!(reason && reason.kind === 'error')
  if (when === 'failed' && !failed) return null
  const body = String(text || '').trim()
  if (!failed && !body) return null
  const head = `【定时任务】${title || '未命名任务'} · ${failed ? '失败' : '完成'}`
  const detail = failed && !body ? (reason && reason.error && reason.error.message ? String(reason.error.message) : '模型调用失败') : body
  const cut = detail.length > maxChars ? detail.slice(0, maxChars) + '\n…（已截断）' : detail
  return head + '\n\n' + cut
}

/**
 * Track automation run sessions from the global session event stream and hand finished
 * turns to `send(target, text)` according to the task's rule. Returns (session, event) => void.
 */
export function createAutomationWatcher({ getConfig, send, log, store = readAutomationStore }) {
  const state = new Map() // sessionId → { text }
  return (session, event) => {
    try {
      const id = session && session.id !== undefined ? String(session.id) : ''
      if (!id.startsWith(AUTOMATION_SESSION_PREFIX) || !event || typeof event.type !== 'string') return
      const s = state.get(id) || { text: '' }
      if (!state.has(id)) { if (state.size > 200) state.delete(state.keys().next().value); state.set(id, s) }
      if (event.type === 'assistant/message') { const t = assistantText(event); if (t) s.text = t; return }
      if (event.type !== 'turn/end') return
      const text = s.text; s.text = ''
      const config = getConfig()
      const task = taskForSession(id, store())
      const r = task ? ruleForTask(config, task.id) : config.automation.default
      if (!r) return
      const message = composeRunMessage({ title: task ? task.name : '', text, reason: event.data && event.data.reason, when: r.when, maxChars: config.automation.maxChars })
      if (!message) return
      Promise.resolve(send(r.target, message)).then(() => log(`automation run ${id}${task ? ' (' + task.name + ')' : ''} → IM notified`)).catch((e) => log(`automation run ${id} → IM notify failed: ${e && e.message}`))
    } catch (e) { log('automation watcher error: ' + (e && e.message)) }
  }
}
