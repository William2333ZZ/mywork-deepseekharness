/**
 * dsh-mywork-im — the delivery gate for what teammates push unasked (PROACTIVE.md 7.2, 7.5): quiet hours (22:00–07:30
 * by default) and a daily budget (5 by default). A push that meets either is held; when the window opens the held
 * ones go out as one message. State in $DSH_HOME/mywork/im-gate.json: { day, sent, held: [{ text, at, what }] }.
 *
 *   createGate({ file, send, log, quiet, budget, now }) → { push(text, what) → 'sent' | 'held', flush() }
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const minutes = (hhmm) => { const [h, m] = String(hhmm || '').split(':').map(Number); return (h || 0) * 60 + (m || 0) }
/** Is this moment inside quiet hours (a window that may wrap midnight)? */
export function inQuiet(date, quiet) {
  if (!quiet || !quiet.from || !quiet.to) return false
  const t = date.getHours() * 60 + date.getMinutes()
  const a = minutes(quiet.from)
  const b = minutes(quiet.to)
  return a <= b ? t >= a && t < b : t >= a || t < b
}
const dayOf = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')

export function createGate({ file, send, log = () => {}, quiet = { from: '22:00', to: '07:30' }, budget = 5, now = () => new Date() }) {
  const read = () => { try { const s = JSON.parse(readFileSync(file, 'utf8')); return { day: String(s.day || ''), sent: Number(s.sent) || 0, held: Array.isArray(s.held) ? s.held : [] } } catch { return { day: '', sent: 0, held: [] } } }
  const write = (s) => { try { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, JSON.stringify(s, null, 1)) } catch (e) { log('gate: ' + (e && e.message)) } }
  const today = (s) => { const d = dayOf(now()); return s.day === d ? s : { ...s, day: d, sent: 0 } }
  let flushing = false
  return {
    async push(text, what) {
      const s = today(read())
      if (inQuiet(now(), quiet) || s.sent >= budget) {
        s.held.push({ text, at: now().toISOString(), what: what || '' })
        write(s)
        log(`${what || 'push'} held (${inQuiet(now(), quiet) ? 'quiet hours' : 'daily budget'})`)
        return 'held'
      }
      s.sent += 1
      write(s)
      await send(text)
      return 'sent'
    },
    /** Held pushes out as one message, once outside quiet hours and within the day's budget. */
    async flush() {
      if (flushing) return false
      const s = today(read())
      if (!s.held.length || inQuiet(now(), quiet) || s.sent >= budget) { if (s.day !== read().day) write(s); return false }
      flushing = true
      try {
        const held = s.held
        const text = held.length === 1 ? held[0].text : `【MyWork】你不在时攒下的 ${held.length} 条\n\n` + held.map((x) => x.text).join('\n\n')
        write({ ...s, sent: s.sent + 1, held: [] })
        await send(text)
        log(`flushed ${held.length} held push(es)`)
        return true
      } catch (e) {
        write({ ...s }) // keep them for the next minute
        log('gate flush: ' + (e && e.message))
        return false
      } finally { flushing = false }
    },
  }
}

export const gateExists = (file) => existsSync(file)
