/**
 * dsh-mywork-tasks — routines: a sentence a teammate is sent on a schedule (design/v2/TEAMMATES.md §9.3).
 *
 * A routine belongs to one teammate (mateId); its results land in that teammate's thread. Two kinds, created from the
 * same sentence by saying the time:
 *   task    「每天 9 点给我一份 Node 生态简报」 → at each run the owning teammate is prompted (in its own session, mode
 *           queue) with routinePrompt(): what the last run delivered, and lead with 变化; a run that reports 变化：无 is
 *           kept in the routine's record but stays out of the thread (quiet).
 *   remind  「明天 8 点提醒我交周报」「30 分钟后提醒我喝水」 → the teammate does not run; a remind card is posted to its
 *           thread (a synthetic done run, see README) and stays until acknowledged, plus toast / notification / IM.
 *   「提醒我写周报」 is not a nudge: writing the report is something a teammate can do itself, so it becomes a task
 *   routine that writes it from the period's work record (every teammate's runs) and hands it over at that time.
 *
 * Schedules are deliberately small: once (at), interval (every N minutes), hourly, daily (HH:MM), weekly (weekday +
 * HH:MM), workdays. Times are the server's local time.
 *
 * Routine { id, mateId, kind, title, input, schedule, enabled, createdAt, lastRunAt, nextRunAt,
 *           runs: [{ at, taskId, deliverableId, changed, error, settledAt } | { at, fired, taskId? }], fired: [{ at, ackAt }] }
 *
 * A run receipt starts as { at, taskId } when the run is queued (taskId is the run id) and is settled by the engine
 * (markRun) with what it delivered, whether 变化 was 有 / 无 (changed true / false, null when the run gave no verdict)
 * and any error; settledAt is when that happened.
 */
import { clip, JsonList, later, newId, titleOf } from './store.js'

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

/** Work MyWork can do itself. 「提醒我 + one of these」 becomes a task that does it, not a reminder. */
const DOABLE_START = /^(帮我|给我|替我|为我)?\s*(写|整理|汇总|总结|统计|收集|搜集|查一?下?|检查|生成|准备|起草|翻译|对比|比较|做一份|出一份|列一?下?|更新|复盘|回顾|梳理)/
const DOABLE_REPORT = /(写|整理|汇总|总结|统计|收集|生成|准备|起草|翻译|梳理|复盘|回顾).{0,16}(日报|周报|月报|报告|总结|简报|纪要|材料|文档|清单|表格?)/
const doable = (text) => DOABLE_START.test(text) || DOABLE_REPORT.test(text)

function done(schedule, raw, phrase) {
  let text = raw.replace(phrase, ' ')
  text = text.replace(/^(请|帮我|麻烦)?\s*(提醒我|提醒)\s*/, '提醒我 ').replace(/\s{2,}/g, ' ').replace(/^[，,、\s]+|[，,、\s]+$/g, '').trim()
  const remind = /提醒|叫我|remind/i.test(raw)
  if (remind) text = text.replace(/^提醒我\s*/, '').replace(/^(去|要)\s*/, '').trim() || '提醒'
  return { schedule, text: text || raw, kind: remind && !doable(text) ? 'remind' : 'task' }
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
  /** Drop the run receipts that pointed at a task the user deleted. */
  forgetTask(taskId) { let n = 0; for (const r of this.items) { const before = (r.runs || []).length; r.runs = (r.runs || []).filter((x) => x.taskId !== taskId); n += before - r.runs.length } if (n) this.save(); return n }
  /** `lint` names a code check whose findings go into the run's prompt (知识库体检: 'wiki'). */
  create({ mateId, kind, title, input, schedule, lint, loopUntil }) {
    const text = String(input || '').trim()
    if (!text) throw new Error('input is required')
    if (!schedule || !schedule.type) throw new Error('schedule is required')
    const next = nextRun(schedule)
    return this.add({ id: newId('rt'), mateId: mateId || 'mywork', kind: kind === 'remind' ? 'remind' : 'task', title: String(title || '').trim() || titleOf(text), input: text, schedule, enabled: true, createdAt: new Date().toISOString(), lastRunAt: '', nextRunAt: next ? next.toISOString() : '', runs: [], fired: [], ...(lint ? { lint: String(lint) } : {}), ...(loopUntil ? { loopUntil: String(loopUntil) } : {}) })
  }
  /** Change what the routine says and, when given, its schedule / kind / title; the next run is recomputed from the schedule. */
  edit(id, { input, schedule, kind, title }) {
    return this.update(id, (r) => {
      const text = String(input === undefined || input === null ? '' : input).trim()
      if (text) r.input = text
      if (title !== undefined && String(title).trim()) r.title = String(title).trim()
      if (kind === 'task' || kind === 'remind') r.kind = kind
      if (schedule && schedule.type) {
        r.schedule = schedule
        const next = nextRun(schedule)
        r.nextRunAt = next ? next.toISOString() : ''
        if (next) r.enabled = true
      }
    })
  }
  forMate(mateId) { return this.items.filter((r) => (r.mateId || 'mywork') === mateId) }
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
  /** Settle a run receipt with its outcome; settledAt is the moment the outcome became known (the unread dot keys off it, not off the start). */
  markRun(id, runAt, patch) { return this.update(id, (r) => { const run = r.runs.find((x) => x.at === runAt || x.taskId === patch.taskId); if (run) Object.assign(run, patch, { settledAt: new Date().toISOString() }) }) }
  pending() { return this.items.flatMap((r) => r.fired.filter((f) => !f.ackAt).map((f) => ({ routineId: r.id, title: r.title, input: r.input, at: f.at }))) }
}

/** Has the engine written the outcome onto this run receipt? */
const settled = (run) => !!run && ('changed' in run || !!run.error)
/** A run a person would want to know about: it failed, found a change, wrote a report, or (reminder) fired. A quiet run is not. */
const notable = (r, run) => !!run && (!!run.error || run.changed === true || run.fired === true || (r.kind !== 'remind' && wantsRecord(r) && settled(run) && !run.error))
const runAt = (run) => run.settledAt || run.at

/** The newest run, read for the column: { at, taskId, changed, quiet, error, report, fired, running } or null when it never ran. */
export function lastRunSummary(r) {
  const run = (r.runs || [])[0]
  if (!run) return null
  return {
    at: runAt(run), taskId: run.taskId || '',
    changed: run.changed === true ? true : run.changed === false ? false : null,
    quiet: run.changed === false, error: run.error || '',
    report: r.kind !== 'remind' && wantsRecord(r) && settled(run) && !run.error,
    fired: run.fired === true, running: !!run.taskId && !settled(run),
  }
}
/** When the routine last did something notable (see `notable`); empty when it never did. */
export function routineAttentionAt(r) {
  let best = ''
  for (const run of r.runs || []) if (notable(r, run)) best = later(best, runAt(run))
  for (const f of r.fired || []) best = later(best, f.at)
  return best
}
/** The column's time for a routine: its last notable run, else the next one, else its creation. Quiet runs leave no trace here. */
export function routineLastAt(r) { return routineAttentionAt(r) || r.nextRunAt || r.createdAt || '' }
/** The second line of a routine row: schedule · state, e.g. 每天 19:00 · 没有变化; a reminder reads 每天 8:00 · 提醒. */
export function routinePreview(r) {
  const label = describeSchedule(r.schedule)
  if (r.kind === 'remind') return clip(label + ' · 提醒')
  const s = lastRunSummary(r)
  const state = !s ? '还没跑过' : s.error ? '失败' : s.report ? '已出报告' : s.changed === true ? '有变化' : s.quiet ? '没有变化' : s.running ? '在跑' : '已完成'
  return clip(label + ' · ' + state)
}

/** Public projection of a routine; `seen` is the SeenStore (unread keys off notable runs and fired reminders, never quiet runs). */
export function routineView(r, seen) {
  const lastRun = r.runs[0] || null
  const attentionAt = routineAttentionAt(r)
  return {
    ...r, scheduleLabel: describeSchedule(r.schedule), lastRun, pendingFired: r.fired.filter((f) => !f.ackAt).length,
    lastAt: routineLastAt(r), lastRunSummary: lastRunSummary(r), preview: routinePreview(r), attentionAt,
    unread: seen ? seen.unread(r.id, attentionAt) : !!attentionAt,
  }
}

/** The prompt of one routine run: the standing request plus what last time delivered, changes first. */
/** Does this routine write about a period of work (周报 / 日报 / 总结)? Then the run gets MyWork's record of that period. */
export function wantsRecord(routine) { return /晨报|周报|日报|月报|汇报|总结|回顾|复盘/.test(String(routine.input || '') + String(routine.title || '')) }
/** The morning brief also gets today's meetings from the teammates' schedule tables. */
export function wantsSchedule(routine) { return /晨报/.test(String(routine.input || '') + String(routine.title || '')) }
export function recordDays(routine) {
  const text = String(routine.input || '') + String(routine.title || '')
  if (/月报/.test(text)) return 30
  if (/周报/.test(text)) return 7
  if (/日报/.test(text)) return 1
  if (/晨报/.test(text)) return 2 // yesterday and this morning
  const s = routine.schedule || {}
  return s.type === 'weekly' ? 7 : s.type === 'daily' || s.type === 'workdays' || s.type === 'interval' || s.type === 'hourly' ? 1 : 7
}

export function routinePrompt(routine, previous, record) {
  if (wantsRecord(routine)) {
    // A report (日报 / 周报 / 总结) is a deliverable every time: no 变化 paragraph, no quiet runs.
    const lines = [
      `这是例行任务《${routine.title}》的这一期，要求如下：`, routine.input, '',
      '同事们这段时间替用户做过的事（这就是素材，按实际写，不要编造没做过的事；记录为空就如实说这段时间没有记录）：',
      '----\n' + (record || '（没有记录）') + '\n----',
      previous ? '\n上一期（只用来保持体例和接续，不要照抄）：\n----\n' + String(previous.markdown || '').slice(0, 2500) + '\n----' : '',
      '',
      '写法：先一句话总结，再按事实写做了什么、结果如何、还没完成什么；这是写给用户本人看的，不要提内部路径、运行 ID 和系统机制。',
      '交付要求：用 deliver 交付，kind 用 report；交付后用一两句话回话。不要写「变化」段，也不要在最后输出变化行。例行运行时不要提问，也不要新建例行。',
    ]
    return lines.filter((x) => x !== '').join('\n')
  }
  const lines = [
    `这是例行任务《${routine.title}》的一次运行，要求如下：`, routine.input, '',
    previous ? '上一次的交付物（供对比，不要照抄）：' : '这是第一次运行，没有上一次可对比。',
    previous ? '----\n' + String(previous.markdown || '').slice(0, 4000) + '\n----' : '',
    record ? '\n同事们这段时间替用户做过的事（写周报、日报、总结时以此为素材，按实际写，不要编造没做过的事；记录为空就如实说这段时间没有记录）：\n----\n' + record + '\n----' : '',
    '',
    '交付要求：deliver 的 markdown 第一段先写「变化」：和上一次相比什么变了（新出现、消失、数字变动），没有实质变化就写"变化：无"。然后才是本次内容。例行运行时不要提问，也不要新建例行。',
    '回话的最后单独一行输出 `变化：有` 或 `变化：无`，用于决定要不要打扰用户。',
  ].filter((x) => x !== '')
  return lines.join('\n')
}

/** Read the 变化 verdict from the run's final text. */
export function changedVerdict(text) {
  const m = String(text || '').match(/变化[:：]\s*(有|无|没有|none|yes|no)/i)
  if (!m) return null
  return /有|yes/i.test(m[1]) && !/没有/.test(m[1])
}

/** The reply without its closing `变化：有 / 无` line (that line is for the engine, not the person). */
export function stripVerdict(text) {
  const lines = String(text || '').replace(/\s+$/, '').split('\n')
  if (lines.length && /^\s*`?\s*变化[:：]\s*(有|无|没有)\s*`?\s*[。.]?\s*$/.test(lines[lines.length - 1])) lines.pop()
  return lines.join('\n').replace(/\s+$/, '')
}
