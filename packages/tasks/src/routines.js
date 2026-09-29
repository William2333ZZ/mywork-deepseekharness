/**
 * dsh-mywork-tasks — routines: standing things the system does for you on a schedule.
 *
 * Two kinds, created from the same input box by saying the time:
 *   task    「每天 9 点给我一份 Node 生态简报」 → each run is a normal task; the run is told what the
 *           last run delivered and leads with 变化 (memory recall + goal tracking, the OpenMuse /
 *           Muse Code observer logic); a run that reports 变化：无 is stored but stays quiet.
 *   remind  「明天 8 点提醒我交周报」「30 分钟后提醒我喝水」 → no agent, just a nudge that sits in
 *           等你看 until acknowledged, plus toast / browser notification / IM.
 *
 * Schedules are deliberately small: once (at), interval (every N minutes), hourly, daily (HH:MM),
 * weekly (weekday + HH:MM), workdays. Times are the server's local time.
 *
 * Routine { id, kind, title, input, schedule, enabled, createdAt, lastRunAt, nextRunAt,
 *           runs: [{ at, taskId, changed }], fired: [{ at, ackAt }] }
 */
import { JsonList, newId, titleOf } from './store.js'

const MAX_ROUTINES = 200
const KEEP_RUNS = 30
const KEEP_FIRED = 30
export const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const CN_NUM = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 半: 30 }

function cnNumber(s) {
  if (/^\d+$/.test(s)) return Number(s)
  if (s === '半') return 30
  if (s.length === 1) return CN_NUM[s]
  if (s[0] === '十') return 10 + (CN_NUM[s[1]] || 0)
  if (s[1] === '十') return (CN_NUM[s[0]] || 0) * 10 + (s[2] ? CN_NUM[s[2]] || 0 : 0)
  return undefined
}
function pad(n) { return String(n).padStart(2, '0') }
/** Parse "9点" "9:30" "9点半" "下午3点" "晚上8点" → "HH:MM". */
function parseClock(m) {
  const period = m.period || ''
  let h = cnNumber(m.h)
  if (h === undefined) return undefined
  let min = 0
  if (m.min !== undefined && m.min !== '') min = m.min === '半' ? 30 : Number(m.min)
  if (/下午|晚上|傍晚|晚|pm/i.test(period) && h < 12) h += 12
  if (/中午/.test(period) && h < 11) h += 12
  if (/凌晨|早上|上午|早|am/i.test(period) && h === 12) h = 0
  if (h > 23 || min > 59) return undefined
  return pad(h) + ':' + pad(min)
}
const CLOCK = '(?<period>凌晨|早上|上午|中午|下午|傍晚|晚上|早|晚)?\\s*(?<h>\\d{1,2}|[一二两三四五六七八九十]{1,3})\\s*(?:[:：点]\\s*(?<min>\\d{1,2}|半)?分?|\\s*(?:am|pm))?'
const CLOCK_RE = new RegExp(CLOCK, 'i')

/**
 * Find a schedule inside free text. Returns { schedule, text } (text = the input without the
 * schedule phrase, still readable) or null when the input has no schedule.
 */
export function parseSchedule(input) {
  const raw = String(input || '').trim()
  if (!raw) return null
  let m
  // 每 N 分钟 / 每小时 / 每 N 小时
  if ((m = raw.match(/每\s*(\d+|[一二两三四五六七八九十]{1,3})\s*分钟/))) return done({ type: 'interval', everyMinutes: cnNumber(m[1]) || 30 }, raw, m[0])
  if ((m = raw.match(/每\s*(\d+|[一二两三四五六七八九十]{1,3})?\s*(个)?小时/))) return done({ type: 'interval', everyMinutes: 60 * (m[1] ? cnNumber(m[1]) || 1 : 1) }, raw, m[0])
  if ((m = raw.match(/every\s+(\d+)\s*(min|minutes?)/i))) return done({ type: 'interval', everyMinutes: Number(m[1]) }, raw, m[0])
  if ((m = raw.match(/every\s+hour|hourly/i))) return done({ type: 'interval', everyMinutes: 60 }, raw, m[0])
  // 每周一 9 点 / 每周一
  if ((m = raw.match(new RegExp('每(?:周|星期|礼拜)([一二三四五六日天])\\s*(?:' + CLOCK + ')?', 'i')))) {
    const weekday = m[1] === '天' ? 0 : WEEKDAYS.indexOf(m[1])
    return done({ type: 'weekly', weekday, time: m.groups && m.groups.h ? parseClock(m.groups) || '09:00' : '09:00' }, raw, m[0])
  }
  // 工作日 9 点 / 每个工作日
  if ((m = raw.match(new RegExp('(?:每个?)?工作日\\s*(?:' + CLOCK + ')?', 'i')))) return done({ type: 'workdays', time: m.groups && m.groups.h ? parseClock(m.groups) || '09:00' : '09:00' }, raw, m[0])
  // 每天 9 点 / 每天早上 / 每晚 8 点 / daily at 9
  if ((m = raw.match(new RegExp('每(?:天|日|晚|早)\\s*(?:' + CLOCK + ')?', 'i')))) {
    let time = m.groups && m.groups.h ? parseClock(m.groups) : undefined
    if (!time) time = /每晚/.test(m[0]) ? '20:00' : '09:00'
    return done({ type: 'daily', time }, raw, m[0])
  }
  if ((m = raw.match(/(?:daily|every\s+day)(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?/i))) {
    let h = m[1] ? Number(m[1]) : 9; if (m[3] && /pm/i.test(m[3]) && h < 12) h += 12
    return done({ type: 'daily', time: pad(h) + ':' + pad(m[2] ? Number(m[2]) : 0) }, raw, m[0])
  }
  // N 分钟后 / N 小时后 / in N minutes
  if ((m = raw.match(/(\d+|[一二两三四五六七八九十]{1,3}|半)\s*(分钟|小时|个小时)\s*(?:后|之后|以后)/))) {
    const n = m[1] === '半' ? (m[2].includes('小时') ? 0.5 : 30) : cnNumber(m[1]) || 1
    const minutes = m[2].includes('小时') ? n * 60 : n
    return done({ type: 'once', at: new Date(Date.now() + minutes * 60000).toISOString() }, raw, m[0])
  }
  if ((m = raw.match(/in\s+(\d+)\s*(min|minutes?|hours?|h)\b/i))) {
    const minutes = /h/i.test(m[2]) ? Number(m[1]) * 60 : Number(m[1])
    return done({ type: 'once', at: new Date(Date.now() + minutes * 60000).toISOString() }, raw, m[0])
  }
  // 明天 8 点 / 后天 / 今天下午 3 点 / 周五 5 点（最近的一个）
  if ((m = raw.match(new RegExp('(今天|明天|后天|(?:这|本|下)?(?:周|星期|礼拜)([一二三四五六日天]))\\s*' + CLOCK, 'i')))) {
    const time = parseClock(m.groups)
    if (time) {
      const base = new Date(); base.setSeconds(0, 0)
      const [hh, mm] = time.split(':').map(Number)
      const day = m[1]
      if (day === '明天') base.setDate(base.getDate() + 1)
      else if (day === '后天') base.setDate(base.getDate() + 2)
      else if (m[2]) {
        const target = m[2] === '天' ? 0 : WEEKDAYS.indexOf(m[2])
        let delta = (target - base.getDay() + 7) % 7
        if (/^下/.test(day)) delta = delta === 0 ? 7 : delta + 7
        base.setDate(base.getDate() + delta)
      }
      base.setHours(hh, mm, 0, 0)
      if (base.getTime() <= Date.now() && (day === '今天' || !m[2])) { if (day === '今天') return null; base.setDate(base.getDate() + 1) }
      return done({ type: 'once', at: base.toISOString() }, raw, m[0])
    }
  }
  return null
}

function done(schedule, raw, phrase) {
  let text = raw.replace(phrase, ' ')
  text = text.replace(/^(请|帮我|麻烦)?\s*(提醒我|提醒)\s*/, '提醒我 ').replace(/\s{2,}/g, ' ').replace(/^[，,、\s]+|[，,、\s]+$/g, '').trim()
  const remind = /提醒|叫我|remind/i.test(raw)
  if (remind) text = text.replace(/^提醒我\s*/, '').replace(/^(去|要)\s*/, '').trim() || '提醒'
  return { schedule, text: text || raw, kind: remind ? 'remind' : 'task' }
}

/** Human label for a schedule. */
export function describeSchedule(s) {
  if (!s) return ''
  if (s.type === 'once') { const d = new Date(s.at); return d.toLocaleDateString([], { month: 'numeric', day: 'numeric' }) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) }
  if (s.type === 'interval') return s.everyMinutes % 60 === 0 ? `每 ${s.everyMinutes / 60} 小时` : `每 ${s.everyMinutes} 分钟`
  if (s.type === 'daily') return `每天 ${s.time}`
  if (s.type === 'workdays') return `工作日 ${s.time}`
  if (s.type === 'weekly') return `每周${WEEKDAYS[s.weekday]} ${s.time}`
  return ''
}

/** Next run strictly after `from` (Date), or null when the schedule is spent. */
export function nextRun(s, from = new Date()) {
  const t = from.getTime()
  if (!s) return null
  if (s.type === 'once') return new Date(s.at).getTime() > t ? new Date(s.at) : null
  if (s.type === 'interval') return new Date(t + Math.max(1, s.everyMinutes) * 60000)
  const [hh, mm] = String(s.time || '09:00').split(':').map(Number)
  const d = new Date(from); d.setSeconds(0, 0); d.setHours(hh, mm, 0, 0)
  for (let i = 0; i < 8; i += 1) {
    if (d.getTime() > t) {
      const wd = d.getDay()
      if (s.type === 'daily' || (s.type === 'workdays' && wd >= 1 && wd <= 5) || (s.type === 'weekly' && wd === s.weekday)) return new Date(d)
    }
    d.setDate(d.getDate() + 1)
  }
  return null
}

export class RoutineStore extends JsonList {
  constructor(file) { super(file, MAX_ROUTINES) }
  create({ kind, title, input, schedule }) {
    const text = String(input || '').trim()
    if (!text) throw new Error('input is required')
    if (!schedule || !schedule.type) throw new Error('schedule is required')
    const next = nextRun(schedule)
    return this.add({ id: newId('rt'), kind: kind === 'remind' ? 'remind' : 'task', title: String(title || '').trim() || titleOf(text), input: text, schedule, enabled: true, createdAt: new Date().toISOString(), lastRunAt: '', nextRunAt: next ? next.toISOString() : '', runs: [], fired: [] })
  }
  due(now = new Date()) { return this.items.filter((r) => r.enabled && r.nextRunAt && new Date(r.nextRunAt).getTime() <= now.getTime()) }
  /** Record a run and advance the schedule; a spent once-routine is disabled. */
  ran(id, entry) {
    return this.update(id, (r) => {
      const now = new Date()
      r.lastRunAt = now.toISOString()
      if (entry) { r.runs.unshift({ at: r.lastRunAt, ...entry }); r.runs.splice(KEEP_RUNS) }
      // A once-schedule is spent by its run even when the clock says it is still slightly ahead.
      const next = r.schedule.type === 'once' ? null : nextRun(r.schedule, now)
      r.nextRunAt = next ? next.toISOString() : ''
      if (!next) r.enabled = false
    })
  }
  fire(id) {
    return this.update(id, (r) => { r.fired.unshift({ at: new Date().toISOString(), ackAt: '' }); r.fired.splice(KEEP_FIRED) })
  }
  ack(id, at) { return this.update(id, (r) => { for (const f of r.fired) if ((!at || f.at === at) && !f.ackAt) f.ackAt = new Date().toISOString() }) }
  setEnabled(id, enabled) { return this.update(id, (r) => { r.enabled = !!enabled; if (r.enabled && !r.nextRunAt) { const n = nextRun(r.schedule); r.nextRunAt = n ? n.toISOString() : '' } }) }
  markRun(id, runAt, patch) { return this.update(id, (r) => { const run = r.runs.find((x) => x.at === runAt || x.taskId === patch.taskId); if (run) Object.assign(run, patch) }) }
  pending() { return this.items.flatMap((r) => r.fired.filter((f) => !f.ackAt).map((f) => ({ routineId: r.id, title: r.title, input: r.input, at: f.at }))) }
}

export function routineView(r) {
  const lastRun = r.runs[0] || null
  return { ...r, scheduleLabel: describeSchedule(r.schedule), lastRun, pendingFired: r.fired.filter((f) => !f.ackAt).length }
}

/** The prompt of one routine run: the standing request plus what last time delivered, changes first. */
export function routinePrompt(routine, previous) {
  const lines = [
    `这是例行任务《${routine.title}》的一次运行，要求如下：`, routine.input, '',
    previous ? '上一次的交付物（供对比，不要照抄）：' : '这是第一次运行，没有上一次可对比。',
    previous ? '----\n' + String(previous.markdown || '').slice(0, 4000) + '\n----' : '',
    '',
    '交付要求：deliver 的 markdown 第一段先写「变化」：和上一次相比什么变了（新出现、消失、数字变动），没有实质变化就写"变化：无"。然后才是本次内容。',
    '最后单独一行输出 `变化：有` 或 `变化：无`，用于决定要不要打扰用户。',
  ].filter((x) => x !== '')
  return lines.join('\n')
}

/** Read the 变化 verdict from the run's final text. */
export function changedVerdict(text) {
  const m = String(text || '').match(/变化[:：]\s*(有|无|没有|none|yes|no)/i)
  if (!m) return null
  return /有|yes/i.test(m[1]) && !/没有/.test(m[1])
}
