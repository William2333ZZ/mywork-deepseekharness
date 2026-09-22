/**
 * dsh-mywork-im — scheduled-task → IM notifications (host side, zero dependencies).
 *
 * @michengai/dsh-automation runs every task in a session whose id starts with
 * `dsh-automation-session-`. We watch dsh's global `session/event` stream: the last
 * assistant message of such a session plus its `turn/end` reason become one IM
 * message. Config lives in $DSH_HOME/mywork/im-notify.json:
 *   { automation: { enabled, target (IM chat session id), when: 'always' | 'failed', maxChars } }
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export const AUTOMATION_SESSION_PREFIX = 'dsh-automation-session-'
export const dshHome = (env = process.env) => env.DSH_HOME || join(homedir(), '.dsh')
export const notifyConfigPath = (env = process.env) => join(dshHome(env), 'mywork', 'im-notify.json')
export const DEFAULTS = { automation: { enabled: false, target: '', when: 'always', maxChars: 1500 } }

export function normalizeNotifyConfig(input) {
  const a = input && typeof input === 'object' && input.automation && typeof input.automation === 'object' ? input.automation : {}
  return { automation: {
    enabled: a.enabled === true,
    target: typeof a.target === 'string' ? a.target.trim() : '',
    when: a.when === 'failed' ? 'failed' : 'always',
    maxChars: Math.min(4000, Math.max(200, Number(a.maxChars) || 1500)),
  } }
}
export function readNotifyConfig(path = notifyConfigPath()) {
  try { return normalizeNotifyConfig(JSON.parse(readFileSync(path, 'utf8'))) } catch { return normalizeNotifyConfig(DEFAULTS) }
}
export function writeNotifyConfig(config, path = notifyConfigPath()) {
  const value = normalizeNotifyConfig(config)
  mkdirSync(dirname(path), { recursive: true })
  const tmp = path + '.tmp-' + process.pid
  writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n')
  renameSync(tmp, path)
  return value
}

/** Text of an assistant/message event (text blocks joined), '' when none. */
export function assistantText(event) {
  const blocks = event && event.data && event.data.message && Array.isArray(event.data.message.content) ? event.data.message.content : []
  return blocks.filter((b) => b && b.type === 'text' && typeof b.text === 'string').map((b) => b.text).join('\n').trim()
}

/** Compose the IM message for one finished automation turn; null when nothing should be sent. */
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
 * Track automation sessions from the global session event stream and hand finished
 * turns to `send(target, text)`. Returns the event handler (session, event) => void.
 */
export function createAutomationWatcher({ getConfig, send, log }) {
  const state = new Map() // sessionId → { title, text }
  return (session, event) => {
    try {
      const id = session && session.id !== undefined ? String(session.id) : ''
      if (!id.startsWith(AUTOMATION_SESSION_PREFIX) || !event || typeof event.type !== 'string') return
      const s = state.get(id) || { title: '', text: '' }
      if (!state.has(id)) { if (state.size > 200) state.delete(state.keys().next().value); state.set(id, s) }
      if (event.type === 'session/title') { const t = event.data && (event.data.title || event.data.value); if (typeof t === 'string' && t.trim()) s.title = t.trim() }
      else if (event.type === 'assistant/message') { const t = assistantText(event); if (t) s.text = t }
      else if (event.type === 'turn/end') {
        const cfg = getConfig().automation
        if (!cfg.enabled || !cfg.target) return
        const message = composeRunMessage({ title: s.title, text: s.text, reason: event.data && event.data.reason, when: cfg.when, maxChars: cfg.maxChars })
        s.text = ''
        if (!message) return
        Promise.resolve(send(cfg.target, message)).then(() => log(`automation run ${id} → IM notified`)).catch((e) => log(`automation run ${id} → IM notify failed: ${e && e.message}`))
      }
    } catch (e) { log('automation watcher error: ' + (e && e.message)) }
  }
}
