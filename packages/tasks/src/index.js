/**
 * dsh-mywork-tasks — host half: the teammate model of MyWork Kit v2 (design/v2/TEAMMATES.md §9).
 *
 *   同事 = 一条永远的对话（一个 dsh 会话）+ 自己的文件夹 + 自己的例行 + 自己的记忆（文件夹里的 AGENTS.md）
 *
 *   • stores: mates.json, tasks.json (runs), deliverables.json, routines.json, seen.json under $DSH_HOME/mywork
 *   • engine (engine.js): one session per teammate, runs from its session events, background verification
 *   • tools (host-level, refused outside teammate sessions): deliver, mywork_ask, mywork_routine_create,
 *     mywork_routines, mywork_routine_cancel, mywork_remember, mywork_mate_update; MyWork only: mywork_mates,
 *     mywork_mate_create (it finds a long-running job its own teammate, with the user's yes)
 *   • HTTP under /mywork-tasks/api: the §9.8 contract (see README)
 *   • events: ctx.emit('mywork/task', { kind, run, mate, deliverable?, routine? }) — kinds queued | started | step | text |
 *     deliverable | verifying | verified | waiting | done | remind | routine | mate
 *
 * createMyWork() holds everything that does not need cordis (tests drive it with a fake host); apply() wires it into dsh.
 */
import { createReadStream, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, appendFileSync } from 'node:fs'
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { homedir } from 'node:os'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ASK_TEXT, bad, createEngine, hashOf, mateSessionId, notFound } from './engine.js'
import { configSchema, defineRawTool, rejectUntrusted } from './harness.js'
import { BUILTIN_SCENARIOS, createScenarioRegistry } from './scenarios.js'
import {
  askView, attentionOf, cleanName, clip, currentStepOf, DEFAULT_MATE_ID, deliverableSummary, DeliverableStore, glyphOf,
  isLiveRun, isQuietRun, isThreadEntry, lastAtOf, lastLineOf, later, MATE_DESCRIPTION_MAX, MATE_TITLE_MAX, MateStore, migrate,
  pendingAsk, plainLine, plainText, SeenStore, TaskStore, ts,
} from './store.js'
import { describeSchedule, parseSchedule, routineLastAt, RoutineStore, routineView } from './routines.js'

export const name = 'dsh-mywork-tasks'
export const inject = ['tools', 'agents', 'sessions', 'workspaceRegistry', 'agentDefaultModel', 'agentPresets', 'permissionPresets']

/**
 * Config (all optional): concurrency (teammates working at once), timeoutMinutes (per run), permission, agentPreset (base
 * of the verifier), tools, verify. Capability is not limited (PROACTIVE.md §5.4): four teammates at once, an hour a run,
 * full disk access without approval prompts.
 */
export const Config = configSchema({ concurrency: 4, timeoutMinutes: 60, permission: 'danger-full-access', agentPreset: 'standard', tools: true, verify: false })

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MEMORY_FILE = 'AGENTS.md'
export const REMEMBER_MAX = 300
const THREAD_LIMIT = 8
const THREAD_LIMIT_MAX = 100
/** When the 今天卡 is put together (MyWork's 读的时间, changeable in its 资料). */
export const DEFAULT_READ_TIME = '08:30'
/** The 今天卡 fits one screen: 12 rows at most. */
const TODAY_ROWS = 12
const READ_TIME = /^([01]\d|2[0-3]):[0-5]\d$/
/** 先问 (PROACTIVE.md §6.2): the kinds of action a teammate asks about first; empty by default. ≤12 lines × ≤40 characters. */
export function cleanAskFirst(list) {
  const out = []
  for (const x of Array.isArray(list) ? list : []) {
    const s = String(x === undefined || x === null ? '' : x).replace(/\s+/g, ' ').trim().slice(0, 40)
    if (s && !out.includes(s)) out.push(s)
    if (out.length >= 12) break
  }
  return out
}
/** 主动程度 (PROACTIVE.md §6.1): ask (只在我问时) | default | more (多做一点). */
export const PROACTIVE_LEVELS = ['ask', 'default', 'more']

// ── the teammate's generated preset ─────────────────────────────────────────

/** The persona of one teammate plus MyWork's working rules: the preset's persona prefix. */
export function personaPrefix(mate) {
  const who = mate.name ? `你是「${mate.name}」` : '你是一位刚加入的同事（还没有名字）'
  const askFirst = cleanAskFirst(mate.askFirst)
  const lines = [
    `${who}，在 MyWork 里替用户干活${mate.title ? '，头衔：' + mate.title : ''}。你和用户在一条长期的对话里共事：用户说一句，你就做，做完用中文简短回话，像同事说话，不铺垫、不用客套。`,
    '',
    '你的职责：',
    String(mate.description || '').trim() || '（用户还没写，按用户说的做）',
    '',
    '工作规矩：',
    '- 你的工作目录是你自己的文件夹（你的电脑），产出的文件放在这里。',
    '- 做出一份成果（报告、清单、比较、方案、表格、文档）时，用 deliver 交付：title 一句话，markdown 先结论后依据；正文里有数字、清单或表格时必须同时给 summary（2 到 6 行 { label, value }，value 只放数字和最短的限定词）。交付后用一两句话回话，不要把正文再贴一遍。回答问题就直接说，不用交付。',
    '- 你的能力不设限：发消息、花钱、删改文件、在网页上提交、用用户给你的账号登录，都直接做，不用先问。做完在回话里用一句话说清做了什么：发给了谁、改了哪个文件、花了多少；撤不回的事说明撤不回。用户在 MyWork 里看得到你做过的每件事，你改过的文件能一键撤销。',
    '- 默认按合理假设把事做完，假设写进结果。只在两种情况用 mywork_ask 停下来问：缺关键信息且没法合理假设 / 这件事必须由用户拍板。一次只问一件事，问完立刻结束这一轮；用户的回答以「回答：」开头送回来。',
    ...(askFirst.length ? [`- 例外：下面这几类事，做之前先用 mywork_ask（askKind approval）问用户，用户允许了再做——${askFirst.join('；')}。`] : []),
    '- 网站要登录时：用户给过你账号和密码就直接登录；没给过，用 mywork_ask（askKind takeover）请用户在电脑上的浏览器里登录，或者问用户要账号。登录状态会留在浏览器里。',
    '- 用户说带时间的事（每天 / 每周 / 工作日 / 几点 / 多久之后 / 提醒我），用 mywork_routine_create 安排成你的例行（这样用户在 MyWork 里看得见、管得着），一件事只安排一次；mywork_routines 查看，mywork_routine_cancel 取消。例行到点时你会收到「这是例行任务…」开头的消息，照要求做完回话；例行运行时没人在等着回答，不要用 mywork_ask。',
    '- 你盯的东西（股票、在用的模型和依赖、课题、竞品……）记在你文件夹里的 清单.csv：一行一个对象，第一列是对象名，其余列你定，中文表头，只往后加列。用户说出的看法、假设和决定记在 判断.csv，表头固定为 编号,类型,内容,依据,重看条件,状态,日期（编号从 J-01 起；类型是 看法 / 假设 / 决定 / 前提；状态是 有效 / 动摇 / 已改 / 撤回）。用户在右边的资料栏里看这两张表。改用户的判断时写清新的状态和理由；你自己的看法在内容前标「同事的：」。',
    '- 用户纠正你，或说了长期的偏好和口径（称呼、格式、数据只用哪种来源），用 mywork_remember 记一条规矩；它写进你文件夹里的 AGENTS.md，以后每一轮都会读到，用户能在资料栏里改和删。一次性的事不要记。',
    '- 用户在你干活时插话，是在改这件事的要求，接着做，按最新的话为准。',
    ...(mate.proactive === 'ask' ? ['- 主动程度：只在用户问时。只做用户叫你做的事和你的例行，不要额外多查、多备、多做。'] : []),
    ...(mate.proactive === 'more' ? ['- 主动程度：多做一点。和你职责有关、用户多半用得上的事（先查、先备、先整理）可以不等用户开口就做，做完在回话里交代一句。'] : []),
  ]
  // MyWork (the default teammate) is the one who finds a long-running job its own teammate.
  if (mate.isDefault) lines.push('- 你是用户的总助理：长期、反复、要专门盯着的事（每周看几家公司在招什么、每天盯某类消息、定期跟进一个项目或主题）应该交给一位专门的同事，不要都揽成你自己的例行。用户交来这类事时，先用 mywork_mates 看有没有同事已经在做，有就告诉用户去找它；没有就用 mywork_ask（askKind choice，选项「新建同事」「你来做就行」）问一句要不要给它找一位专门的同事。用户选「新建同事」，用 mywork_mate_create 建好（能马上出第一份的，把第一件事写进 first），告诉用户它叫什么、在左边的同事列表里，这件事以后由它做，你不再做；选「你来做就行」，再安排成你的例行。这条优先于「带时间的事安排成例行」那一条。晨报、日报、周报、提醒这类本来就归你的事照常自己做；一次性的事你自己做；用户直接要你新建同事时不用再问。')
  // Persona text is interpolated ({{model}}, {{cwd}}): a brace pair in what the user wrote must not become a variable.
  return lines.join('\n').replace(/\{\{/g, '{ {').replace(/\}\}/g, '} }')
}

/** The persona row as YAML (a literal block, so any text the user wrote is safe). */
function personaRow(mate) {
  const body = personaPrefix(mate).split('\n').map((l) => (l ? '      ' + l : '')).join('\n')
  return [
    '- id: persona',
    "  name: '@deepseek-ai/dsh-persona'",
    '  config:',
    '    suffix: 你的工作目录（你的文件夹）是 {{cwd}}。',
    '    prefix: |-',
    body,
    '',
  ].join('\n')
}

/** Replace (or drop) one top-level row `- id: <id>` of a composition: the row runs to the next column-0 line. */
function spliceRow(lines, id, replacement) {
  const start = lines.findIndex((l) => new RegExp('^- id: ' + id + '\\s*$').test(l))
  if (start < 0) return false
  let end = start + 1
  while (end < lines.length && !/^[-#]/.test(lines[end])) end += 1
  // trailing blank lines stay with the next row
  let cut = end
  while (cut > start + 1 && lines[cut - 1].trim() === '') cut -= 1
  lines.splice(start, cut - start, ...(replacement === null ? [] : replacement.replace(/\n$/, '').split('\n')))
  return true
}

/**
 * The teammate's composition: dsh's shipped 'standard' preset (persona, agent-instructions, shell, fs, jobs, skills,
 * plan mode, compaction, delegation, todo, web, present …) with the persona row replaced by the teammate's, and without
 * dsh's ask_user (it holds a turn open waiting for a client; teammates ask with mywork_ask instead).
 */
export function mateComposition(baseText, mate) {
  const lines = String(baseText || '').split('\n')
  const header = [`# Generated by dsh-mywork-tasks for the teammate ${mate.id} (${mate.name || '未命名'}). Rewritten when the teammate changes; do not edit.`, '']
  if (!spliceRow(lines, 'persona', personaRow(mate))) lines.unshift(...personaRow(mate).split('\n'))
  spliceRow(lines, 'tool-ask-user', null)
  return header.join('\n') + '\n' + lines.join('\n').replace(/\n*$/, '\n')
}

// ── the service ─────────────────────────────────────────────────────────────

/**
 * Everything but the cordis wiring. `ctx` is the dsh plugin context (or a fake), `home` the DSH_HOME, `controller()`
 * the session controller, `hostEmit(payload)` where 'mywork/task' events go.
 */
export function createMyWork({ ctx, config = {}, home, log = () => {}, controller = () => null, hostEmit = () => {} }) {
  const dshHome = home || process.env.DSH_HOME || join(homedir(), '.dsh')
  const dir = join(dshHome, 'mywork')
  const presetRoot = join(dshHome, '.agent-presets')
  const store = new TaskStore(join(dir, 'tasks.json'))
  const deliverables = new DeliverableStore(join(dir, 'deliverables.json'))
  const routines = new RoutineStore(join(dir, 'routines.json'))
  const seen = new SeenStore(join(dir, 'seen.json'))
  const mates = new MateStore(join(dir, 'mates.json'), { matesDir: join(dir, 'mates') })
  const defaultMate = mates.ensureDefault()
  const migrated = migrate({ runs: store, routines, deliverables, since: (defaultMate && defaultMate.createdAt) || (mates.get(DEFAULT_MATE_ID) || {}).createdAt })
  if (migrated) log(`migrated ${migrated} records to the teammate model`)
  const scenarios = createScenarioRegistry()
  for (const s of BUILTIN_SCENARIOS) scenarios.register(s)
  const listeners = new Set()

  // ── views ──
  const docsIndex = () => { const m = new Map(); for (const d of deliverables.items) { const l = m.get(d.taskId); if (l) l.push(d); else m.set(d.taskId, [d]) } return m }
  const mateName = (id) => { const m = mates.get(id); return m ? (m.name || '新同事') : '' }

  /** A synthetic reminder run's card: { routineId, title, at, acked } (the same fields as its one activity entry). */
  const remindOfRun = (t) => { const e = (t.activity || []).find((a) => a && a.kind === 'remind') || {}; return { routineId: t.routineId || '', title: e.title || t.routineTitle || '', at: e.at || t.createdAt, acked: !!e.acked } }

  /** A document's first paragraph (no heading, table, list or code), at most 180 characters: what a reply bubble quotes. */
  const excerptOf = (text) => {
    for (const block of String(text || '').split(/\n\s*\n/)) {
      const b = block.trim()
      if (!b || /^(#|\||```|>|[-*+] |\d+\. |---)/.test(b)) continue
      const line = b.replace(/\s*\n\s*/g, ' ')
      return line.length > 180 ? line.slice(0, 179) + '…' : line
    }
    return ''
  }
  function runView(t, docs) {
    const list = docs || deliverables.forTask(t.id)
    const ask = t.status === 'waiting' ? pendingAsk(t) : null
    return {
      id: t.id, mateId: t.mateId, trigger: t.trigger, routineId: t.routineId || '', routineTitle: t.routineTitle || (t.routineId && routines.get(t.routineId) ? routines.get(t.routineId).title : ''),
      status: t.status === 'queued' ? 'running' : t.status, queued: t.status === 'queued',
      input: t.trigger === 'system' ? '' : t.input, title: t.title || '', summary: t.summary || '', via: t.source === 'mywork' ? 'mywork' : '',
      activity: (Array.isArray(t.activity) ? t.activity : []).map(({ requestId: _r, ...a }) => a),
      deliverables: list.map((d) => ({ ...deliverableSummary(d), excerpt: excerptOf(d.markdown) })),
      verification: t.verification || null, verifying: !!t.verifying,
      ask: ask ? askView(ask) : null, error: t.error || '', quiet: !!t.quiet, migrated: !!t.migrated, remind: t.remind ? remindOfRun(t) : null,
      step: t.status === 'running' ? currentStepOf(t) : '',
      createdAt: t.createdAt, startedAt: t.startedAt || '', finishedAt: t.finishedAt || '',
    }
  }

  function mateView(m, index) {
    const docs = index || docsIndex()
    const runs = store.forMate(m.id)
    const live = runs.filter(isLiveRun)
    const running = live.find((r) => r.status === 'running') || null
    const waiting = [...runs].reverse().find((r) => r.status === 'waiting' && pendingAsk(r)) || null
    const state = live.length ? 'working' : waiting ? 'waiting' : 'idle'
    const step = running ? currentStepOf(running) : live.length ? '排队' : ''
    const pending = waiting ? pendingAsk(waiting) : null
    let lastAt = ''
    let attentionAt = ''
    let unreadCount = 0
    for (const r of runs) {
      if (isQuietRun(r)) continue
      lastAt = later(lastAt, lastAtOf(r, docs.get(r.id) || []))
      const a = attentionOf(r)
      attentionAt = later(attentionAt, a)
      if (a && seen.unread(m.id, a)) unreadCount++
    }
    let preview = ''
    if (state === 'working') preview = clip('在干活' + (step ? ' · ' + step : ''))
    else if (state === 'waiting') preview = clip('等你答 · ' + plainLine(pending.question))
    else { const line = lastLineOf(runs); preview = line ? clip((line.you ? '你：' : '') + line.text) : '' }
    return {
      id: m.id, name: m.name || '新同事', named: !!m.name, title: m.title || '', description: m.description || '', glyph: m.glyph || glyphOf(m.name),
      pinned: !!m.pinned, isDefault: !!m.isDefault, notify: m.notify !== false, group: m.group || '', avatar: m.avatar || null, createdAt: m.createdAt,
      lastAt: lastAt || m.createdAt, preview, unread: seen.unread(m.id, attentionAt), unreadCount, attentionAt,
      state, step, since: running ? (running.startedAt || running.createdAt) : live.length ? live[0].createdAt : pending ? pending.at : '',
      ask: pending ? { ...askView(pending), runId: waiting.id } : null,
      routineCount: routines.forMate(m.id).length, dir: m.dir,
      askFirst: cleanAskFirst(m.askFirst), proactive: PROACTIVE_LEVELS.includes(m.proactive) ? m.proactive : 'default', readTime: m.isDefault ? (READ_TIME.test(m.readTime || '') ? m.readTime : DEFAULT_READ_TIME) : '',
    }
  }
  const mateViewById = (id) => { const m = mates.get(id); return m ? mateView(m) : null }

  /** Sidebar order: pinned first (the default teammate first of them), the rest by their last conversation; state never reorders. */
  function listMates() {
    const index = docsIndex()
    const views = mates.items.map((m) => mateView(m, index))
    const pinned = views.filter((v) => v.pinned).sort((a, b) => (b.isDefault - a.isDefault) || (ts(a.createdAt) - ts(b.createdAt)))
    const rest = views.filter((v) => !v.pinned).sort((a, b) => ts(b.lastAt) - ts(a.lastAt))
    return [...pinned, ...rest]
  }

  const rview = (r) => ({ ...routineView(r, seen), mateId: r.mateId || DEFAULT_MATE_ID, mateName: mateName(r.mateId || DEFAULT_MATE_ID) })

  // ── events ──
  const emit = (kind, run, extra) => {
    const mate = run ? mates.get(run.mateId) : extra && extra.mateId ? mates.get(extra.mateId) : null
    const { mateId: _m, ...rest } = extra || {}
    // A removed teammate is gone from the store by now: the event still says which one it was.
    const mateOut = mate ? { id: mate.id, name: mate.name || '新同事', glyph: mate.glyph || '', notify: mate.notify !== false } : extra && extra.mateId ? { id: extra.mateId } : null
    const payload = { kind, run: run ? runView(run) : null, mate: mateOut, ...rest }
    if (payload.deliverable) payload.deliverable = deliverableSummary(payload.deliverable)
    for (const fn of listeners) { try { fn(payload) } catch (e) { log('listener error: ' + (e && e.message)) } }
    try { hostEmit(payload) } catch {}
  }

  // ── presets ──
  let baseText = null
  async function standardText() {
    if (baseText) return baseText
    try {
      const found = ctx.agentPresets && typeof ctx.agentPresets.resolve === 'function' ? await ctx.agentPresets.resolve('standard') : null
      if (found && found.path && existsSync(found.path)) baseText = readFileSync(found.path, 'utf8')
    } catch (e) { log(`standard preset not readable (${e && e.message}); using the packaged copy`) }
    if (!baseText) baseText = readFileSync(join(PACKAGE_ROOT, 'presets', 'mate-base', 'agent.cordis.yml'), 'utf8')
    return baseText
  }
  /** Write $DSH_HOME/.agent-presets/mate-<id>/agent.cordis.yml (and preset.yml) when it differs; returns the preset id. */
  async function presetFor(mate) {
    const id = 'mate-' + mate.id
    const folder = join(presetRoot, id)
    const file = join(folder, 'agent.cordis.yml')
    const body = mateComposition(await standardText(), mate)
    if (!existsSync(file) || readFileSync(file, 'utf8') !== body) {
      mkdirSync(folder, { recursive: true })
      writeFileSync(file, body)
      writeFileSync(join(folder, 'preset.yml'), `name: ${JSON.stringify('同事 · ' + (mate.name || '未命名'))}\ndescription: ${JSON.stringify('MyWork 同事的会话预设（自动生成）')}\norder: 90\n`)
      log(`preset ${id} written`)
    }
    return id
  }

  /**
   * A rewritten preset reaches the live session only by re-linking it: dsh keeps a joined session on the generation it
   * started with, and a teammate's session stays live for the whole process. recompose() moves the agent to the
   * current generation of 'mate-<id>' (only the persona row differs, so the tool set is the same). Mid-turn the switch
   * waits for the turn's end (afterTurn).
   */
  const stalePresets = new Set()
  async function relink(mateId) {
    const agent = ctx.agents && typeof ctx.agents.get === 'function' ? ctx.agents.get(mateSessionId(mateId)) : null
    if (!agent || !agent.ctx || !ctx.agentPresets || typeof ctx.agentPresets.recompose !== 'function') return false
    try { await ctx.agentPresets.recompose(agent.ctx, 'mate-' + mateId); log(`teammate ${mateId} re-linked to its rewritten preset`); return true } catch (e) { log(`recompose mate-${mateId}: ${e && e.message}`); return false }
  }
  const refreshing = new Map() // mateId → the last refresh (one at a time per teammate, the newest identity wins)

  // ── 日报 / 周报 material ──
  /** What every teammate did in the last N calendar days (today counts as one): what was said, replies, files, failures. */
  /** Today's rows of every 日程表.csv / schedule.csv in the teammates' folders, as plain lines (the morning brief's agenda). */
  function todaySchedule() {
    const d = new Date()
    const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
    const out = []
    for (const m of mates.items) {
      for (const name of ['日程表.csv', 'schedule.csv']) {
        const file = join(m.dir, name)
        if (!existsSync(file)) continue
        let text = ''
        try { text = readFileSync(file, 'utf8').replace(/^\uFEFF/, '') } catch { continue }
        const [head, ...rows] = text.split(/\r?\n/).filter((l) => l.trim())
        if (!head) continue
        for (const row of rows) if (row.startsWith(today)) out.push(`- ${row}`)
        if (out.length) out.unshift(`（${m.name || '同事'}的${name}，表头：${head}）`)
      }
    }
    return out.join('\n')
  }

  function workRecord(days, opts = {}) {
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - Math.max(0, days - 1))
    const since = start.getTime()
    const stamp = (iso) => { const d = new Date(iso); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') }
    const index = docsIndex()
    const out = []
    for (const m of mates.items) {
      const mine = []
      for (const t of store.forMate(m.id)) {
        if (isQuietRun(t) || t.trigger === 'system') continue
        const at = ts(t.finishedAt || t.startedAt || t.createdAt)
        if (!(at >= since)) continue
        if (t.remind) { mine.push(`- ${stamp(t.createdAt)} 提醒：${clip(t.routineTitle || t.input, 80)}`); continue }
        mine.push(t.trigger === 'routine' ? `- ${stamp(t.createdAt)} 例行《${t.routineTitle || t.title}》` : `- ${stamp(t.createdAt)} 用户：${plainText(t.input, 200)}`)
        let reply = ''
        const flush = () => { if (reply) mine.push('  答：' + plainText(reply, 160)); reply = '' }
        for (const a of t.activity || []) {
          if (a.kind === 'user' && !a.auto) { flush(); mine.push('  用户：' + plainText(a.text, 200)) } else if (a.kind === 'text') reply = a.text
        }
        flush()
        for (const d of index.get(t.id) || []) {
          const v = d.verification
          mine.push(`  交付：${d.title}${v ? (v.passed ? '，核对通过' : v.passed === false ? '，核对有问题' : '') : ''}${d.rating ? '，评价 ' + d.rating : ''}`)
          const body = plainText(d.markdown, 240)
          if (body) mine.push('  ' + body)
        }
        if (t.error) mine.push('  失败：' + clip(t.error, 80))
        if (t.status === 'waiting') mine.push('  （在等用户回答）')
      }
      if (mine.length) out.push(`【${m.name || '新同事'}】\n` + mine.slice(-60).join('\n'))
    }
    const standing = routines.items.filter((r) => r.enabled).map((r) => `- ${r.title}：${describeSchedule(r.schedule)}${r.kind === 'remind' ? '（提醒）' : ''} · ${mateName(r.mateId || DEFAULT_MATE_ID)}`)
    const agenda = opts.schedule ? todaySchedule() : ''
    return [opts.schedule ? '今天的会（来自日程表）：\n' + (agenda || '- 日程表里今天没有安排') : '', out.length ? '同事们做过的事（按同事分）：\n' + out.join('\n\n') : '', '现在有效的例行（以此为准，别的说法都过时了）：\n' + (standing.join('\n') || '- 无')].filter(Boolean).join('\n\n')
  }

  const engine = createEngine({
    ctx, store, deliverables, mates, routines, scenarios, log, emit, controller, presetFor, workRecord,
    afterTurn: (mateId) => { if (stalePresets.delete(mateId)) relink(mateId) },
    config: {
      concurrency: Number(config.concurrency) || 2, timeoutMs: Math.max(1, Number(config.timeoutMinutes) || 20) * 60000,
      permission: String(config.permission || 'workspace-write'), agentPreset: config.agentPreset === '' ? undefined : (config.agentPreset || 'standard'),
      verify: config.verify !== false, workbench: join(dir, 'workbench'),
    },
  })
  // Restart repair runs now, before any route or pump can hand a new message over; the wake-up nudge comes later.
  engine.repair()
  // A teammate's preset is written when its session is created and when its identity changes; a new MyWork version may
  // also change the working rules, so every preset out of date with this version is rewritten (its session re-linked).
  queueMicrotask(async () => {
    for (const m of mates.items) {
      if (!m.sessionId) continue
      try {
        const file = join(presetRoot, 'mate-' + m.id, 'agent.cordis.yml')
        if (!existsSync(file) || readFileSync(file, 'utf8') !== mateComposition(await standardText(), m)) refreshPreset(m, false)
      } catch (e) { log(`preset ${m.id} not checked: ${e && e.message}`) }
    }
  })
  // MyWork's morning report is the 今天卡, put together by code at 读的时间 (EDITIONS.md 4.4, GET /today); a model-written
  // 晨报 routine is no longer created (one made by an earlier version stays until the person removes it).

  // ── teammates ──
  function createMate(b) {
    const description = String((b && b.description) || '').trim()
    if (!description) throw bad('写一句它负责什么。')
    const mate = mates.create({ description, name: b.name, title: b.title })
    if (b.group !== undefined || b.pinned !== undefined || b.avatar !== undefined) mates.update(mate.id, { group: String(b.group || '').trim().slice(0, 12), pinned: !!b.pinned, avatar: avatarOf(b.avatar) })
    try { mkdirSync(mate.dir, { recursive: true }) } catch {}
    // The hidden intro run: it names itself when it has no name, sets up a timed duty, and says how it understood its job.
    const intro = store.create({ mateId: mate.id, trigger: 'system', input: '', title: '自我介绍' })
    log(`teammate ${mate.id} created (${mate.name || 'unnamed'})`)
    emit('mate', null, { mateId: mate.id })
    emit('queued', intro)
    engine.pump()
    return mateView(mates.get(mate.id))
  }

  /**
   * The teammate's name, title or duty changed: rewrite its preset and re-link the live session to it (now when idle,
   * at the end of the turn otherwise); the session title and its dsh workspace follow the name.
   */
  function refreshPreset(mate, nameChanged) {
    const id = mate.id
    const prev = refreshing.get(id) || Promise.resolve()
    const next = prev.then(async () => {
      const current = mates.get(id)
      if (!current) return
      try { await presetFor(current) } catch (e) { log(`preset ${id} not rewritten: ${e && e.message}`); return }
      if (engine.activeRun(id)) stalePresets.add(id)
      else { stalePresets.delete(id); await relink(id) }
      if (nameChanged) {
        try { const ws = ctx.workspaceRegistry && typeof ctx.workspaceRegistry.resolveByPath === 'function' ? await ctx.workspaceRegistry.resolveByPath(current.dir) : null; if (ws && typeof ws.setTitle === 'function') await ws.setTitle(current.name || '同事') } catch (e) { log(`workspace title ${id}: ${e && e.message}`) }
      }
    })
    const settled = next.catch(() => {})
    refreshing.set(id, settled)
    settled.then(() => { if (refreshing.get(id) === settled) refreshing.delete(id) })
    try { const titles = ctx.get && ctx.get('sessionTitle'); if (titles && mate.sessionId && ctx.agents && typeof ctx.agents.get === 'function') { const agent = ctx.agents.get(mate.sessionId); if (agent && typeof titles.rename === 'function') titles.rename(agent.session, mate.name || '同事') } } catch {}
    return settled
  }

  /** The look the owner picked for a teammate: one of 8 colour keys and 4 shapes; anything else falls back to the derived look. */
  const AVATAR_COLORS = ['slate', 'blue', 'teal', 'green', 'amber', 'orange', 'rose', 'violet']
  const AVATAR_SHAPES = ['circle', 'squircle', 'pebble', 'hex']
  function avatarOf(a) {
    if (!a || typeof a !== 'object') return null
    const color = AVATAR_COLORS.includes(a.color) ? a.color : ''
    const shape = AVATAR_SHAPES.includes(a.shape) ? a.shape : ''
    return color || shape ? { color, shape } : null
  }

  function updateMate(b) {
    const m = mates.get(String((b && b.id) || ''))
    if (!m) throw notFound('同事不存在。')
    const patch = {}
    if (b.name !== undefined) { const n = cleanName(b.name); if (!n) throw bad('名字不能为空。'); patch.name = n; if (!m.isDefault) patch.glyph = glyphOf(n) }
    if (b.title !== undefined) patch.title = clip(b.title, MATE_TITLE_MAX)
    if (b.description !== undefined) { const d = String(b.description || '').trim(); if (!d) throw bad('职责不能为空。'); patch.description = d.slice(0, MATE_DESCRIPTION_MAX) }
    if (b.pinned !== undefined) patch.pinned = !!b.pinned
    if (b.notify !== undefined) patch.notify = !!b.notify
    if (b.group !== undefined) patch.group = String(b.group || '').replace(/\s+/g, ' ').trim().slice(0, 12) // the teammate's type (sidebar section); '' = 其他
    if (b.avatar !== undefined) patch.avatar = avatarOf(b.avatar)
    if (b.askFirst !== undefined) patch.askFirst = cleanAskFirst(b.askFirst)
    if (b.proactive !== undefined) patch.proactive = PROACTIVE_LEVELS.includes(b.proactive) ? b.proactive : 'default'
    if (b.readTime !== undefined) { const v = String(b.readTime || '').trim(); if (v && !READ_TIME.test(v)) throw bad('读的时间写成 08:30 这样。'); patch.readTime = v }
    // The persona carries the name, title, job, 先问 and 主动程度: any of them changing rewrites the preset.
    const identity = ['name', 'title', 'description', 'askFirst', 'proactive'].some((k) => k in patch && JSON.stringify(patch[k]) !== JSON.stringify(m[k]))
    const nameChanged = 'name' in patch && patch.name !== m.name
    mates.update(m.id, patch)
    if (identity) refreshPreset(mates.get(m.id), nameChanged)
    emit('mate', null, { mateId: m.id })
    return mateView(mates.get(m.id))
  }

  function removeMate(id) {
    const m = mates.get(id)
    if (!m) throw notFound('同事不存在。')
    if (m.isDefault) throw bad('默认同事 MyWork 不能删除。')
    engine.forget(m.id)
    stalePresets.delete(m.id)
    const runIds = new Set(store.forMate(m.id).map((r) => r.id))
    store.items = store.items.filter((r) => r.mateId !== m.id); store.save()
    deliverables.items = deliverables.items.filter((d) => d.mateId !== m.id && !runIds.has(d.taskId)); deliverables.save()
    routines.items = routines.items.filter((r) => (r.mateId || DEFAULT_MATE_ID) !== m.id); routines.save()
    seen.forget(m.id)
    mates.remove(m.id)
    try { rmSync(join(presetRoot, 'mate-' + m.id), { recursive: true, force: true }) } catch {}
    log(`teammate ${m.id} removed (its folder ${m.dir} is kept)`)
    emit('mate', null, { mateId: m.id, removed: true })
    return true
  }

  /** The teammate's thread: its runs ascending by createdAt, the newest `limit` before `before`; quiet routine runs and empty system runs left out. */
  function thread(id, before, limit) {
    const m = mates.get(String(id || ''))
    if (!m) throw notFound('同事不存在。')
    const index = docsIndex()
    // A quiet routine run stays: the thread draws it as one grey line (例行 · 标题 · 没有变化), runs in a row merged.
    const visible = (r) => {
      if (r.trigger === 'system' && r.status === 'done' && !r.error && !(r.activity || []).some(isThreadEntry) && !(index.get(r.id) || []).length) return false
      return true
    }
    const runs = store.forMate(m.id).filter(visible).map((r, i) => ({ r, i })).sort((a, b) => (ts(a.r.createdAt) - ts(b.r.createdAt)) || (a.i - b.i)).map((x) => x.r)
    const b = String(before || '').trim()
    if (b && !Number.isFinite(Date.parse(b))) throw bad('before must be an ISO date')
    const cut = b ? ts(b) : Infinity
    const eligible = cut === Infinity ? runs : runs.filter((r) => ts(r.createdAt) < cut)
    const n = Math.max(1, Math.min(THREAD_LIMIT_MAX, Math.floor(Number(limit)) || THREAD_LIMIT))
    let start = Math.max(0, eligible.length - n)
    while (start > 0 && ts(eligible[start - 1].createdAt) === ts(eligible[start].createdAt)) start -= 1
    const page = eligible.slice(start)
    return { runs: page.map((r) => liteRun(runView(r, index.get(r.id) || []))), nextBefore: start > 0 && page.length ? page[0].createdAt : null }
  }
  /**
   * The thread's copy of a run: tool calls leave the activity of a run that is not live (the 过程 fold fetches them from
   * GET /run when opened); `process` keeps what its one-line summary needs: { tools, groups, verify }.
   */
  function liteRun(v) {
    if (v.status === 'running' || v.status === 'waiting') return v
    const all = v.activity || []
    let tools = 0; let groups = 0; let prev = ''
    for (const a of all) { if (a && a.kind === 'tool') { tools += 1; if (a.name !== prev) groups += 1; prev = a.name } else if (a && a.kind === 'text') prev = '' }
    if (!tools) return v
    return { ...v, activity: all.filter((a) => a && a.kind !== 'tool'), process: { tools, groups, lite: true } }
  }
  function runById(id) { const t = store.get(String(id || '')); if (!t) throw notFound('run not found'); return { run: runView(t) } }

  /** The newest files in the teammate's folder (its 电脑 when no browser is in use). */
  function folder(id) {
    const m = mates.get(String(id || ''))
    if (!m) throw notFound('同事不存在。')
    const items = []
    const walk = (base, rel, depth) => {
      let names = []
      try { names = readdirSync(join(base, rel)) } catch { return }
      for (const n of names) {
        if (n.startsWith('.')) continue
        const p = rel ? join(rel, n) : n
        let st
        try { st = statSync(join(base, p)) } catch { continue }
        if (st.isDirectory()) { if (depth < 3) walk(base, p, depth + 1) } else items.push({ name: n, path: p, size: st.size, modifiedAt: st.mtime.toISOString() })
      }
    }
    walk(m.dir, '', 0)
    items.sort((a, b) => ts(b.modifiedAt) - ts(a.modifiedAt))
    // The tables it keeps (信源表, 情报库) always, however many fresh files a day's scraping leaves; the rest, the newest 30.
    const table = (f) => /\.(csv|tsv)$/i.test(f.name)
    const keep = new Set([...items.filter(table).slice(0, 50), ...items.slice(0, 30)])
    return { dir: m.dir, items: items.filter((f) => keep.has(f)) }
  }

  /** One text file from a teammate's folder, read-only (tables and notes open in the reading view). Never leaves the folder. */
  const READABLE = new Set(['.csv', '.tsv', '.md', '.txt', '.json'])
  function folderFile(id, path) {
    const m = mates.get(String(id || ''))
    if (!m) throw notFound('同事不存在。')
    const rel = String(path || '')
    const full = resolve(m.dir, rel)
    const inside = relative(resolve(m.dir), full)
    if (!rel || inside.startsWith('..') || inside.startsWith('/') || inside === '') throw bad('路径不在同事的文件夹里。')
    if (!READABLE.has(extname(full).toLowerCase())) throw bad('只能打开表格和文本。')
    let st
    try { st = statSync(full) } catch { throw notFound('文件不存在。') }
    if (!st.isFile()) throw notFound('文件不存在。')
    const max = 512 * 1024
    const text = readFileSync(full, 'utf8').slice(0, max)
    return { path: inside, name: inside.split('/').pop(), size: st.size, modifiedAt: st.mtime.toISOString(), truncated: st.size > max, text }
  }

  /**
   * Any file in a teammate's folder, by a short-lived signed link (10 min). The page asks GET /mates/link for one; images
   * load from it inline, HTML / PDF open from it in the live browser (which has no dsh cookie), anything else downloads.
   * HTML is served under a CSP sandbox, so a page a teammate wrote runs in an opaque origin and can never reach the app.
   */
  const LINK_SECRET = randomBytes(32)
  const LINK_TTL = 10 * 60 * 1000
  const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf', '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.csv': 'text/csv; charset=utf-8', '.tsv': 'text/tab-separated-values; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json; charset=utf-8', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }
  const signOf = (id, path, exp) => createHmac('sha256', LINK_SECRET).update(id + '\n' + path + '\n' + exp).digest('base64url')
  function folderPath(id, path) {
    const m = mates.get(String(id || ''))
    if (!m) throw notFound('同事不存在。')
    const rel = String(path || '')
    const full = resolve(m.dir, rel)
    const inside = relative(resolve(m.dir), full)
    if (!rel || inside.startsWith('..') || inside.startsWith('/') || inside === '') throw bad('路径不在同事的文件夹里。')
    let st
    try { st = statSync(full) } catch { throw notFound('文件不存在。') }
    if (!st.isFile()) throw notFound('文件不存在。')
    return { mate: m, full, inside, st }
  }
  function fileLink(id, path) {
    const { inside, st } = folderPath(id, path)
    const exp = Date.now() + LINK_TTL
    const q = new URLSearchParams({ id: String(id), path: inside, exp: String(exp), sig: signOf(String(id), inside, exp) })
    const ext = extname(inside).toLowerCase()
    return { url: '/mywork-tasks/files/raw?' + q, name: inside.split('/').pop(), size: st.size, modifiedAt: st.mtime.toISOString(), mime: MIME[ext] || 'application/octet-stream', expiresAt: new Date(exp).toISOString() }
  }
  /** Serve one signed file (no cookie needed: the signature is the authority). */
  function serveFile(req, res) {
    const q = new URL(req.url || '/', 'http://localhost').searchParams
    const id = q.get('id') || '', path = q.get('path') || '', exp = Number(q.get('exp') || 0), sig = q.get('sig') || ''
    const want = Buffer.from(signOf(id, path, exp)), got = Buffer.from(sig)
    if (!(exp > Date.now()) || want.length !== got.length || !timingSafeEqual(want, got)) { res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' }); res.end('链接已过期，请回到 MyWork 重新打开。'); return }
    let f
    try { f = folderPath(id, path) } catch (e) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); res.end(String(e && e.message)); return }
    const ext = extname(f.inside).toLowerCase()
    const type = MIME[ext] || 'application/octet-stream'
    const download = q.get('dl') === '1' || !MIME[ext] || /officedocument/.test(type)
    const name = encodeURIComponent(f.inside.split('/').pop())
    const headers = { 'content-type': type, 'content-length': String(f.st.size), 'cache-control': 'private, max-age=300', 'x-content-type-options': 'nosniff', 'content-disposition': (download ? 'attachment' : 'inline') + "; filename*=UTF-8''" + name }
    if (type.startsWith('text/html')) headers['content-security-policy'] = 'sandbox allow-scripts allow-popups allow-forms; default-src * data: blob: \'unsafe-inline\''
    res.writeHead(200, headers)
    createReadStream(f.full).pipe(res)
  }

  // ── routines ──
  /** A sentence with a time becomes a routine of one teammate. */
  function createRoutine({ mateId, input, schedule, kind, title }) {
    const mate = mates.get(String(mateId || DEFAULT_MATE_ID))
    if (!mate) throw notFound('同事不存在。')
    const text = String(input || '').trim()
    if (!text) throw bad('input is required')
    let parsed = null
    if (!schedule) { parsed = parseSchedule(text); if (!parsed) throw bad('没看出时间。写法如「每天 9 点…」「每周一 8:30…」「工作日 18 点…」「明天 8 点提醒我…」「30 分钟后提醒我…」') }
    const finalKind = kind || (parsed ? parsed.kind : 'task')
    const finalTitle = finalKind === 'task' ? String(title || '').replace(/(的)?提醒$/, '').trim() : title // 「写周报提醒」 is a report the teammate writes
    const r = routines.create({ mateId: mate.id, kind: finalKind, title: finalTitle, input: parsed ? parsed.text : text, schedule: schedule || parsed.schedule })
    log(`routine ${r.id} (${mate.id}) ${r.kind} ${describeSchedule(r.schedule)}: ${r.title}`)
    emit('routine', null, { mateId: mate.id, routine: rview(r) })
    return rview(r)
  }
  function updateRoutine({ id, input, schedule, kind, title }) {
    const r = routines.get(String(id || ''))
    if (!r) throw notFound('routine not found')
    const text = String(input || '').trim()
    const parsed = text && !schedule ? parseSchedule(text) : null
    const next = parsed ? { input: parsed.text, schedule: parsed.schedule, kind: kind || parsed.kind, title: title || '' } : { input: text, schedule, kind, title }
    if (next.input && !next.title) next.title = String(next.input).split('\n')[0].slice(0, 60)
    routines.edit(r.id, next)
    emit('routine', null, { mateId: r.mateId, routine: rview(routines.get(r.id)) })
    return rview(routines.get(r.id))
  }
  /**
   * Run a routine now (the scheduler, or 现在跑一次). A task routine prompts its teammate (a run with trigger 'routine',
   * queued like any other). A reminder does not run the teammate: it fires (fired[] as before) and posts a synthetic
   * done run into the teammate's thread whose activity is one { kind: 'remind', routineId, title, at, acked } entry.
   */
  function runRoutine(id) {
    const r = routines.get(String(id || ''))
    if (!r) throw notFound('routine not found')
    const mateId = mates.get(r.mateId) ? r.mateId : DEFAULT_MATE_ID
    if (r.kind === 'remind') {
      routines.fire(r.id)
      const at = routines.get(r.id).fired[0].at
      const run = store.create({ mateId, trigger: 'routine', routineId: r.id, routineTitle: r.title, input: r.input, status: 'done' })
      store.update(run.id, { remind: true, dispatched: true, createdAt: at, startedAt: at, finishedAt: at, summary: r.title, activity: [{ kind: 'remind', routineId: r.id, title: r.title, at, acked: false }] })
      routines.ran(r.id, { fired: true, runId: run.id })
      emit('remind', store.get(run.id), { routine: rview(routines.get(r.id)) })
      return { routine: rview(routines.get(r.id)), runId: run.id }
    }
    const run = store.create({ mateId, trigger: 'routine', routineId: r.id, routineTitle: r.title, input: r.input })
    routines.ran(r.id, { taskId: run.id })
    emit('queued', run)
    engine.pump()
    return { routine: rview(routines.get(r.id)), runId: run.id }
  }
  function ackRoutine(id, at) {
    const r = routines.ack(String(id || ''), at)
    if (!r) throw notFound('routine not found')
    for (const t of store.items) {
      if (t.routineId !== r.id || !t.remind) continue
      let hit = false
      for (const a of t.activity || []) if (a.kind === 'remind' && !a.acked && (!at || a.at === at)) { a.acked = true; hit = true }
      if (hit) store.save()
    }
    return rview(r)
  }
  function removeRoutine(id) {
    const removed = routines.remove(String(id || ''))
    return removed
  }

  // ── the bell, files, search ──
  function activity() {
    const index = docsIndex()
    const needs = []; const working = []; const recent = []
    const weekAgo = Date.now() - 7 * 86400000
    for (const m of mates.items) {
      const name = m.name || '新同事'
      const seenAt = seen.get(m.id)
      for (const t of store.forMate(m.id)) {
        const item = (kind, at, text) => ({ mateId: m.id, mateName: name, runId: t.id, at, text: clip(text, 120), kind })
        if (isLiveRun(t)) { working.push(item('working', t.startedAt || t.createdAt, currentStepOf(t) || (t.trigger === 'routine' ? t.routineTitle : t.trigger === 'system' ? '自我介绍' : plainLine(t.input)) || '在干活')); continue }
        if (t.status === 'waiting') { const a = pendingAsk(t); if (a) needs.push(item('ask', a.at, a.question)); continue }
        if (t.remind) { for (const a of t.activity || []) if (a.kind === 'remind' && !a.acked) needs.push(item('remind', a.at, a.title || t.routineTitle)); continue }
        if (t.status !== 'done' || isQuietRun(t) || ts(t.finishedAt) < weekAgo) continue
        if (t.error) {
          if (t.error !== '已停止。' && (!seenAt || ts(t.finishedAt) > ts(seenAt)) && ts(t.finishedAt) >= ts(seen.since)) needs.push(item('failed', t.finishedAt, t.error))
          else recent.push(item('failed', t.finishedAt, t.error))
          continue
        }
        const reply = [...(t.activity || [])].reverse().find((a) => a.kind === 'text')
        const docs = index.get(t.id) || []
        const text = reply ? plainLine(reply.text) : docs.length ? docs[docs.length - 1].title : t.summary
        if (text) recent.push(item('done', t.finishedAt, text))
      }
    }
    const desc = (a, b) => ts(b.at) - ts(a.at)
    return { needs: needs.sort(desc), working: working.sort((a, b) => ts(a.at) - ts(b.at)), recent: recent.sort(desc).slice(0, 20) }
  }

  /** A file of a quiet routine run (变化：无) never shows: that run is not in the thread either (§9.3). */
  const shownFile = (d) => { const run = store.get(d.taskId); return !(run && isQuietRun(run)) }

  function files({ mate, q, since } = {}) {
    const needle = String(q || '').trim().toLowerCase()
    const after = since ? ts(since) : -Infinity
    if (since && !Number.isFinite(after)) throw bad('since must be an ISO date')
    const items = deliverables.items
      .filter((d) => (!mate || (d.mateId || DEFAULT_MATE_ID) === mate) && ts(d.createdAt) >= after && shownFile(d))
      .filter((d) => !needle || String(d.title || '').toLowerCase().includes(needle) || String(d.markdown || '').slice(0, 4000).toLowerCase().includes(needle))
      .sort((a, b) => ts(b.createdAt) - ts(a.createdAt))
      .slice(0, 200)
    return { items: items.map(deliverableSummary) }
  }

  function search(q) {
    const needle = String(q || '').trim().toLowerCase()
    if (!needle) return { mates: [], messages: [], files: [], routines: [] }
    const has = (s) => String(s || '').toLowerCase().includes(needle)
    const index = docsIndex()
    const foundMates = mates.items.filter((m) => has(m.name) || has(m.title) || has(m.description)).map((m) => mateView(m, index))
    const messages = []
    for (const t of store.items) {
      if (isQuietRun(t) || !mates.get(t.mateId)) continue
      if (t.trigger === 'user' && has(t.input)) messages.push({ mateId: t.mateId, runId: t.id, at: t.createdAt, text: plainText(t.input, 120) })
      for (const a of t.activity || []) if ((a.kind === 'user' || a.kind === 'text') && !a.auto && has(a.text)) messages.push({ mateId: t.mateId, runId: t.id, at: a.at, text: plainText(a.text, 120) })
    }
    messages.sort((a, b) => ts(b.at) - ts(a.at))
    const fileHits = deliverables.items.filter((d) => shownFile(d) && (has(d.title) || has(String(d.markdown || '').slice(0, 2000)))).sort((a, b) => ts(b.createdAt) - ts(a.createdAt)).slice(0, 20).map(deliverableSummary)
    const routineHits = routines.items.filter((r) => has(r.title) || has(r.input)).sort((a, b) => ts(routineLastAt(b)) - ts(routineLastAt(a))).slice(0, 20).map(rview)
    return { mates: foundMates.slice(0, 20), messages: messages.slice(0, 20), files: fileHits, routines: routineHits }
  }

  /**
   * MyWork finds a long-running job its own teammate (mywork_mate_create): the teammate is created as from 「+ 新同事」
   * (it names itself if MyWork gave no name, and sets up its timed duty in the intro), and the first piece of work, if
   * any, is queued behind the intro as a line handed over by MyWork (run.source 'mywork', shown 「MyWork 转交」).
   */
  function handOver(b) {
    const mate = createMate({ description: b.description, name: b.name, title: b.title, group: b.group })
    const first = String(b.first || '').trim()
    if (first) {
      const run = store.create({ mateId: mate.id, trigger: 'user', input: first, source: 'mywork' })
      emit('queued', run)
      engine.pump()
    }
    return { mate: mateViewById(mate.id), first }
  }

  // ── 做了告诉你 / 撤销 / 规矩 / 今天卡 ──
  const didId = () => 'did-' + Date.now().toString(36) + randomBytes(2).toString('hex')
  /** The person-facing copy of a did entry: no absolute path, no snapshot location. */
  const didView = ({ abs: _a, snap: _s, after: _h, ...rest }) => rest
  /** Everything a teammate changed or sent, newest first (资料 › 它做过的): its did entries with their run. */
  function didList(id, limit) {
    const m = mates.get(String(id || ''))
    if (!m) throw notFound('同事不存在。')
    const n = Math.max(1, Math.min(200, Math.floor(Number(limit)) || 50))
    const out = []
    for (const t of store.forMate(m.id)) {
      const title = t.trigger === 'routine' ? t.routineTitle || t.title : t.title || plainLine(t.input)
      for (const a of t.activity || []) if (a && a.kind === 'did') out.push({ ...didView(a), runId: t.id, runTitle: clip(title, 40), trigger: t.trigger })
    }
    out.sort((a, b) => ts(b.at) - ts(a.at))
    return { items: out.slice(0, n) }
  }
  /** The rules file's bullet whose text (after the date) is `text`; returns [lines, index] or [lines, -1]. */
  const ruleIndex = (lines, text) => {
    const want = String(text || '').replace(/\s+/g, ' ').trim()
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const m = lines[i].trim().match(/^[-*]\s+(?:\d{4}-\d{2}-\d{2}\s+)?(.+)$/)
      if (m && m[1].replace(/\s+/g, ' ').trim() === want) return i
    }
    return -1
  }
  function editRule(mateId, text, next) {
    const m = mates.get(String(mateId || ''))
    if (!m) throw notFound('同事不存在。')
    const file = join(m.dir, MEMORY_FILE)
    if (!existsSync(file)) return false
    const lines = readFileSync(file, 'utf8').split('\n')
    const i = ruleIndex(lines, text)
    if (i < 0) return false
    if (next === null) lines.splice(i, 1)
    else {
      const v = String(next || '').replace(/\s+/g, ' ').trim()
      if (!v) throw bad('规矩不能为空。')
      if (v.length > REMEMBER_MAX) throw bad(`太长了：一条 ≤${REMEMBER_MAX} 字。`)
      const date = (lines[i].match(/^\s*[-*]\s+(\d{4}-\d{2}-\d{2})\s+/) || [])[1]
      lines[i] = '- ' + (date ? date + ' ' : '') + v
    }
    writeFileSync(file, lines.join('\n'))
    emit('mate', null, { mateId: m.id })
    return true
  }
  /**
   * 撤销 one did entry (didId) or every one of a run. A file goes back to its copy from before the run's first change
   * (a file the run created is deleted) unless someone changed it again since the run ended; a rule leaves AGENTS.md; a
   * routine is removed. A message or a page action cannot be taken back.
   */
  function undo(runId, didIdWanted) {
    const t = store.get(String(runId || ''))
    if (!t) throw notFound('run not found')
    const list = (t.activity || []).filter((a) => a && a.kind === 'did' && !a.undoneAt && (!didIdWanted || a.id === didIdWanted))
    if (!list.length) throw bad('没有可以撤销的。')
    const undone = []
    const conflicts = []
    const kept = []
    for (const a of list) {
      if (a.act === 'file') {
        if (!a.undoable) { kept.push(a.path); continue }
        if (a.after !== undefined && hashOf(a.abs) !== a.after) { conflicts.push(a.path); continue }
        try { if (a.existed) copyFileSync(a.snap, a.abs); else if (existsSync(a.abs)) rmSync(a.abs) } catch (e) { log(`undo ${a.abs}: ${e && e.message}`); conflicts.push(a.path); continue }
        undone.push(a)
      } else if (a.act === 'rule') {
        if (editRule(t.mateId, a.line, null)) undone.push(a); else kept.push(a.line)
      } else if (a.act === 'routine') {
        if (routines.get(a.routineId)) { routines.remove(a.routineId); emit('routine', null, { mateId: t.mateId, routine: null, removedRoutineId: a.routineId }) }
        undone.push(a)
      } else kept.push(a.act)
    }
    if (undone.length) { const at = new Date().toISOString(); store.update(t.id, () => { for (const a of undone) a.undoneAt = at }) }
    emit('mate', null, { mateId: t.mateId })
    return { undone: undone.length, conflicts, kept, run: runView(store.get(t.id)) }
  }

  /** 读的时间 as today's Date. */
  function readAt(now) {
    const mw = mates.get(DEFAULT_MATE_ID) || {}
    const time = READ_TIME.test(mw.readTime || '') ? mw.readTime : DEFAULT_READ_TIME
    const [hh, mm] = time.split(':').map(Number)
    return { time, at: new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0) }
  }
  /**
   * 今天卡 (EDITIONS.md 4.4): MyWork's morning message, put together by code (no model) from the last 24 hours before
   * 读的时间 and whatever came after it (marked late, 「补」): what needs you (open questions, reminders, failures),
   * what changed (routine results, files you have not opened), how many things they did, how much they looked at and
   * kept quiet about. Before 读的时间 there is no card for today.
   */
  function todayCard() {
    const now = new Date()
    const { time, at } = readAt(now)
    const week = '日一二三四五六'[at.getDay()]
    const base = { readTime: time, at: at.toISOString(), date: (at.getMonth() + 1) + '/' + at.getDate() + ' 周' + week }
    if (now < at) return { ...base, ready: false }
    const since = at.getTime() - 86400000
    const index = docsIndex()
    const needs = []
    const changes = []
    const quiet = []
    let did = 0
    for (const m of mates.items) {
      const name = m.name || '新同事'
      let q = 0
      const mine = []
      for (const t of store.forMate(m.id)) {
        const item = (kind, iso, text) => ({ mateId: m.id, mateName: name, runId: t.id, kind, at: iso, text: clip(text, 70), late: ts(iso) > at.getTime() })
        for (const a of t.activity || []) if (a && a.kind === 'did' && !a.undoneAt && ts(a.at) >= since) did += 1
        if (t.status === 'waiting') { const a = pendingAsk(t); if (a) needs.push(item('ask', a.at, plainLine(a.question))); continue }
        if (t.remind) { for (const a of t.activity || []) if (a.kind === 'remind' && !a.acked) needs.push(item('remind', a.at, a.title || t.routineTitle)); continue }
        if (t.status !== 'done' || !(ts(t.finishedAt) >= since)) continue
        if (isQuietRun(t)) { q += 1; continue }
        if (t.error) { if (t.error !== '已停止。') needs.push(item('failed', t.finishedAt, (t.routineTitle ? t.routineTitle + ' · ' : '') + t.error)); continue }
        if (t.trigger === 'system') continue
        const docs = index.get(t.id) || []
        // Something you asked for counts only when it left a file you have not opened yet; a routine's result always.
        if (t.trigger !== 'routine' && !(docs.length && seen.unread(m.id, t.finishedAt))) continue
        const reply = [...(t.activity || [])].reverse().find((a) => a && a.kind === 'text')
        const text = docs.length ? docs[docs.length - 1].title : reply ? plainLine(reply.text) : t.summary
        if (text) mine.push(item(t.trigger === 'routine' ? 'routine' : 'file', t.finishedAt, (t.trigger === 'routine' && t.routineTitle && !docs.length ? t.routineTitle + '：' : '') + text))
      }
      mine.sort((a, b) => ts(b.at) - ts(a.at))
      if (mine.length) changes.push(...mine.slice(0, 3).map((x, i) => (i === 2 && mine.length > 3 ? { ...x, more: mine.length - 3 } : x)))
      if (q) quiet.push({ mateId: m.id, mateName: name, n: q })
    }
    const order = { ask: 0, failed: 1, remind: 2 }
    needs.sort((a, b) => (order[a.kind] - order[b.kind]) || (ts(b.at) - ts(a.at)))
    // One screen: at most 12 rows in all (需要你 first); what does not fit is counted, and each teammate's thread has it.
    const room = Math.max(3, TODAY_ROWS - needs.length)
    const hidden = Math.max(0, changes.length - room)
    return { ...base, ready: true, needs, changes: changes.slice(0, room), hidden, did, quiet, updatedAt: now.toISOString() }
  }

  // ── tools ──
  const callerOf = (exec) => engine.caller(exec && exec.agent && exec.agent.session ? String(exec.agent.session.id) : '')
  const mateOnly = (exec, tool) => { const c = callerOf(exec); if (!c) throw new Error(`${tool} 只在 MyWork 同事的会话里可用。`); return c }
  const myworkOnly = (exec, tool) => { const c = mateOnly(exec, tool); if (!c.mate.isDefault) throw new Error(`${tool} 只有 MyWork 能用。`); return c }
  const tools = [
    {
      name: 'deliver',
      description: '交付一份成果（只在 MyWork 同事的会话里可用）。做出报告、清单、比较、方案、表格、文档时调用一次：title 是一句话标题，markdown 是完整正文（先结论，再依据）。kind 缺省 markdown；data 可选，放结构化数据。交付后再用一两句话回话。',
      parameters: {
        title: { type: 'string', required: true, description: '一句话标题' },
        markdown: { type: 'string', required: true, description: '正文（Markdown）' },
        kind: { type: 'string', description: '类型：markdown（默认）| report | table | summary' },
        data: { type: 'object', description: '可选的结构化数据' },
        summary: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' } }, required: ['label', 'value'] }, description: '结果的可数摘要，2 到 6 行 { label, value }。label 是名目（≤10 字），value 只放数字、单位和最短的限定词（≤20 字，不带括号说明，口径和依据写进正文），例如 { label: "包", value: "8 个" }。正文里有数字、清单、表格时必须给；纯说明文才省略。' },
      },
      execute(args, exec) {
        const sid = exec && exec.agent && exec.agent.session ? exec.agent.session.id : ''
        const d = engine.deliver(sid, args)
        return { delivered: true, id: d.id, title: d.title, kind: d.kind }
      },
      render: (_a, v) => [{ type: 'text', text: `已交付：${v.title}（${v.id}）` }],
    },
    {
      name: 'mywork_ask',
      description: '停下来问用户一个问题（只在 MyWork 同事的会话里可用）。默认不要问：按合理假设把事做完，假设写进结果。只在四种情况用它：缺关键信息且没法合理假设 / 必须由用户拍板 / 动作有后果（发消息、付费、删除、对外提交）/ 需要密码、验证码或扫码。每一轮最多问 2 次，一次只问一件事。调用后立刻结束本轮，不要再做别的；用户回答后会在同一会话里继续，回答以「回答：」开头（approval 是 允许 / 拒绝，takeover 是 我做完了）。例行运行和自我介绍时不能问。',
      parameters: {
        question: { type: 'string', required: true, description: '问题本身，≤120 字，直接可答' },
        askKind: { type: 'string', enum: ['text', 'choice', 'approval', 'takeover'], description: 'text（自由回答，默认）| choice（给 2–4 个选项）| approval（要用户允许一次或拒绝一个有后果的动作，question 写清要做什么）| takeover（要用户去电脑上亲自操作，如登录、扫码，question 写清去哪做什么）' },
        options: { type: 'array', items: { type: 'string' }, description: 'choice 时必填：2 到 4 个选项，每个 ≤12 字' },
        detail: { type: 'string', description: '可选，≤500 字：要用户确认的原文（如邮件正文、要提交的内容），按等宽原样展示' },
      },
      execute(args, exec) {
        const sid = exec && exec.agent && exec.agent.session ? exec.agent.session.id : ''
        const a = engine.ask(sid, args)
        return { asked: true, id: a.id, question: a.question, askKind: a.askKind, note: ASK_TEXT.asked }
      },
      render: () => [{ type: 'text', text: ASK_TEXT.asked }],
    },
    {
      name: 'mywork_routine_create',
      description: '给自己安排一件例行的事或一个提醒（只在 MyWork 同事的会话里可用；例行归你，结果回到你和用户的对话里；例行运行时也可以用）。「每天 9 点…」「每周一 8:30…」「工作日 18 点…」「每 2 小时…」是例行（到点你会收到一条「这是例行任务…」的消息，照做后回话，第一段先说变化）；「提醒我喝水 / 开会 / 交周报」这类只有用户自己能做的事是提醒（到点在对话里出提醒卡、发通知，你不会被叫醒）；「提醒我写周报 / 整理 / 汇总…」这类你自己能做的事不是提醒，到点你做完交给用户（周报、日报会拿到所有同事这段时间的工作记录当素材）。时间用自然语言写在 input 里，分类由解析器决定，返回值里的 kind 告诉你结果。',
      parameters: { input: { type: 'string', required: true, description: '含时间的一句话，例如"每天 9 点给我一份 Node 生态简报"或"明天 8 点提醒我交周报"' }, title: { type: 'string', description: '可选标题' } },
      execute(args, exec) {
        const c = mateOnly(exec, 'mywork_routine_create')
        const r = createRoutine({ mateId: c.mate.id, input: args.input, title: args.title })
        if (c.run) {
          store.activity(c.run.id, { kind: 'routine', action: 'created', routineId: r.id, title: r.title, scheduleLabel: r.scheduleLabel })
          store.activity(c.run.id, { kind: 'did', id: didId(), act: 'routine', routineId: r.id, title: r.title, undoable: true })
        }
        return { id: r.id, kind: r.kind, title: r.title, schedule: r.scheduleLabel, nextRunAt: r.nextRunAt }
      },
      render: (_a, v) => [{ type: 'text', text: v.kind === 'remind' ? `已安排提醒「${v.title}」：${v.schedule}，下次 ${v.nextRunAt ? new Date(v.nextRunAt).toLocaleString() : '—'}，到点在对话里出提醒卡并通知用户。直接回话，不要再加别的提醒。` : `已安排例行「${v.title}」：${v.schedule}，下次 ${v.nextRunAt ? new Date(v.nextRunAt).toLocaleString() : '—'}。到点你会收到这条例行，做完交给用户；不需要再加提醒，直接回话。` }],
    },
    {
      name: 'mywork_routines',
      description: '列出你的例行和提醒（只在 MyWork 同事的会话里可用）：id、标题、计划、是否启用、下次时间。',
      parameters: {},
      execute(_args, exec) {
        const c = mateOnly(exec, 'mywork_routines')
        return { items: routines.forMate(c.mate.id).map((r) => ({ id: r.id, kind: r.kind, title: r.title, input: r.input, schedule: describeSchedule(r.schedule), enabled: r.enabled, nextRunAt: r.nextRunAt })) }
      },
    },
    {
      name: 'mywork_routine_cancel',
      description: '取消（删除）你的一条例行或提醒（只在 MyWork 同事的会话里可用）。用 id，或用标题（不确定就先调 mywork_routines 看列表）。',
      parameters: { id: { type: 'string', description: '例行 id' }, title: { type: 'string', description: '例行标题（或其中一段）' } },
      execute(args, exec) {
        const c = mateOnly(exec, 'mywork_routine_cancel')
        const mine = routines.forMate(c.mate.id)
        const id = String(args.id || '').trim()
        const title = String(args.title || '').trim()
        if (!id && !title) throw new Error('给 id 或 title。')
        let hits = id ? mine.filter((r) => r.id === id) : mine.filter((r) => r.title === title)
        if (!hits.length && title) hits = mine.filter((r) => r.title.includes(title) || r.input.includes(title))
        if (!hits.length) throw new Error('你没有这条例行。先调 mywork_routines 看列表。')
        if (hits.length > 1) throw new Error('有好几条对得上：' + hits.map((r) => `${r.id}（${r.title}）`).join('、') + '。用 id。')
        routines.remove(hits[0].id)
        emit('routine', null, { mateId: c.mate.id, routine: null, removedRoutineId: hits[0].id })
        return { removed: true, id: hits[0].id, title: hits[0].title }
      },
    },
    {
      name: 'mywork_remember',
      description: '记一条规矩（只在 MyWork 同事的会话里可用）：用户纠正你、或说了长期的偏好和口径时用。写成一行追加到你文件夹里的 AGENTS.md，以后每一轮都会读到；用户在资料栏里能改能删，对话里会出一行「记下了」。≤300 字，一次一条；一次性的事不要记。',
      parameters: { fact: { type: 'string', required: true, description: '这条规矩，一句话，例如「周报用表格，按项目分」「财务数字只用年报原文，研报里的数标为券商估计」' } },
      execute(args, exec) {
        const c = mateOnly(exec, 'mywork_remember')
        const fact = String(args.fact || '').replace(/\s+/g, ' ').trim()
        if (!fact) throw new Error('fact 不能为空。')
        if (fact.length > REMEMBER_MAX) throw new Error(`太长了（${fact.length} 字）：一条 ≤${REMEMBER_MAX} 字。`)
        const file = join(c.mate.dir, MEMORY_FILE)
        mkdirSync(c.mate.dir, { recursive: true })
        if (!existsSync(file)) writeFileSync(file, `# ${c.mate.name || '同事'}的规矩\n\n口径、来源、格式、教训，一行一条（mywork_remember 追加；用户在资料栏里改和删）。\n\n`)
        const d = new Date()
        const line = `- ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${fact}`
        appendFileSync(file, line + '\n')
        if (c.run) store.activity(c.run.id, { kind: 'did', id: didId(), act: 'rule', line: fact, undoable: true })
        return { remembered: true, line }
      },
      render: (_a, v) => [{ type: 'text', text: '已记下规矩：' + v.line }],
    },
    {
      name: 'mywork_mate_update',
      description: '改你自己的名字或头衔（只在 MyWork 同事的会话里可用）。新同事没有名字时先用它给自己起名：2 到 4 个汉字，贴合职责；title 是一行头衔，可空。',
      parameters: { name: { type: 'string', description: '名字，2 到 4 个汉字' }, title: { type: 'string', description: '一行头衔' } },
      execute(args, exec) {
        const c = mateOnly(exec, 'mywork_mate_update')
        const patch = { id: c.mate.id }
        if (args.name !== undefined && String(args.name).trim()) patch.name = args.name
        if (args.title !== undefined) patch.title = args.title
        if (!('name' in patch) && !('title' in patch)) throw new Error('给 name 或 title。')
        const v = updateMate(patch)
        return { name: v.name, title: v.title }
      },
      render: (_a, v) => [{ type: 'text', text: `好了：${v.name}${v.title ? ' · ' + v.title : ''}` }],
    },
    {
      name: 'mywork_mates',
      description: '列出用户现在的同事（只有 MyWork 能用）：名字、头衔、职责、类型、例行、在不在干活。新建同事前先看一眼，别建一个重复的。',
      parameters: {},
      execute(_args, exec) {
        myworkOnly(exec, 'mywork_mates')
        return {
          items: listMates().filter((m) => !m.isDefault).map((m) => ({
            id: m.id, name: m.name, title: m.title, duty: clip(m.description, 160), group: m.group, state: m.state,
            routines: routines.forMate(m.id).filter((r) => r.enabled).map((r) => `${r.title}（${describeSchedule(r.schedule)}）`),
          })),
        }
      },
    },
    {
      name: 'mywork_mate_create',
      description: '给一件长期、反复的事新建一位专门的同事（只有 MyWork 能用）。只在用户同意后调用：用户选了「新建同事」，或直接要你新建。它会出现在用户左边的同事列表里，先自我介绍；职责里带时间的，它会自己安排成例行。之后这件事由它做，你不再做。',
      parameters: {
        description: { type: 'string', required: true, description: '它的职责，一两句话，像用户自己写的：做什么、给谁看、什么格式；定时的事把时间写进去，例如「每天早上 8 点整理 AI 行业的新闻，挑 5 条最值得看的，每条一句话说为什么」' },
        name: { type: 'string', description: '名字，2 到 4 个汉字，贴合职责；用户说过就用用户的，不给就让它自己起' },
        title: { type: 'string', description: '可选，一行头衔' },
        group: { type: 'string', description: '可选，类型（左边列表的分组），≤12 字；有合适的已有类型就用已有的' },
        first: { type: 'string', description: '可选，要它马上先做的第一件事，一句话，例如「先出一份今天的」；不给就等到点再做' },
      },
      execute(args, exec) {
        const c = myworkOnly(exec, 'mywork_mate_create')
        const { mate, first } = handOver({ description: args.description, name: args.name, title: args.title, group: args.group, first: args.first })
        if (c.run) store.activity(c.run.id, { kind: 'mate', action: 'created', mateId: mate.id, name: mate.named ? mate.name : '' })
        return { created: true, id: mate.id, name: mate.named ? mate.name : '', group: mate.group, first }
      },
      render: (_a, v) => [{ type: 'text', text: `已新建同事${v.name ? '「' + v.name + '」' : '（它会先给自己起名）'}，它正在自我介绍${v.first ? '，接着马上做「' + v.first + '」' : ''}。用一两句话告诉用户：它负责什么、在左边的同事列表里，以后这件事直接找它。不要再自己做这件事。` }],
    },
  ]

  // ── HTTP ──
  const idOf = (b) => String((b && b.id) || '').trim()
  const routes = {
    '/mates': { GET: () => ({ items: listMates() }) },
    '/mates/create': { POST: (_q, b) => ({ mate: createMate(b) }) },
    '/mates/update': { POST: (_q, b) => ({ mate: updateMate(b) }) },
    '/mates/remove': { POST: (_q, b) => ({ removed: removeMate(idOf(b)) }) },
    '/mates/thread': { GET: (q) => thread(q.get('id'), q.get('before'), q.get('limit')) },
    '/run': { GET: (q) => runById(q.get('id')) },
    '/mates/folder': { GET: (q) => folder(q.get('id')) },
    '/mates/file': { GET: (q) => folderFile(q.get('id'), q.get('path')) },
    '/mates/link': { GET: (q) => fileLink(q.get('id'), q.get('path')) },
    '/mates/say': {
      POST: async (_q, b) => {
        if (!String((b && b.text) || '').trim()) throw bad('text is required')
        const r = await engine.say(idOf(b), b.text)
        return { mate: mateViewById(idOf(b)), runId: r.runId, mode: r.mode }
      },
    },
    '/mates/stop': { POST: (_q, b) => { if (!mates.get(idOf(b))) throw notFound('同事不存在。'); engine.stop(idOf(b)); return { mate: mateViewById(idOf(b)) } } },
    '/answer': { POST: (_q, b) => ({ run: runView(engine.answer(idOf(b), b.askId === undefined || b.askId === null ? '' : String(b.askId), b.answer)) }) },
    '/routines': { GET: (q) => { const mate = String(q.get('mate') || '').trim(); const list = mate ? routines.forMate(mate) : routines.items; return { items: list.slice().reverse().map(rview), pending: routines.pending() } } },
    '/routines/create': { POST: (_q, b) => ({ routine: createRoutine({ mateId: b.mateId || DEFAULT_MATE_ID, input: b.input, schedule: b.schedule, kind: b.kind, title: b.title }) }) },
    '/routines/update': { POST: (_q, b) => ({ routine: updateRoutine(b) }) },
    '/routines/run': { POST: (_q, b) => runRoutine(idOf(b)) },
    '/routines/enable': { POST: (_q, b) => { const r = routines.setEnabled(idOf(b), b.enabled !== false); if (!r) throw notFound('routine not found'); return { routine: rview(r) } } },
    '/routines/remove': { POST: (_q, b) => ({ removed: removeRoutine(idOf(b)) }) },
    '/routines/ack': { POST: (_q, b) => ({ routine: ackRoutine(idOf(b), b.at), pending: routines.pending() }) },
    '/activity': { GET: () => activity() },
    '/files': { GET: (q) => files({ mate: String(q.get('mate') || '').trim(), q: q.get('q'), since: String(q.get('since') || '').trim() }) },
    '/deliverable': { GET: (q) => { const d = deliverables.get(String(q.get('id') || '')); if (!d) throw notFound('deliverable not found'); const run = store.get(d.taskId); return { deliverable: { ...d, mateId: d.mateId || DEFAULT_MATE_ID, runId: d.taskId }, run: run ? runView(run) : null } } },
    '/rate': { POST: (_q, b) => { const d = deliverables.update(idOf(b), { rating: b.rating === null ? null : Number(b.rating) || 0 }); if (!d) throw notFound('deliverable not found'); return { deliverable: { ...d, mateId: d.mateId || DEFAULT_MATE_ID, runId: d.taskId } } } },
    '/seen': {
      POST: (_q, b) => {
        const ids = [...(Array.isArray(b.ids) ? b.ids : []), ...(b.id !== undefined && b.id !== null ? [b.id] : [])].map((x) => String(x || '').trim().slice(0, 100)).filter(Boolean)
        if (!ids.length) throw bad('id is required')
        return { id: ids[0], ids, seenAt: seen.mark(ids) }
      },
    },
    '/search': { GET: (q) => search(q.get('q')) },
    '/mates/did': { GET: (q) => didList(q.get('id'), q.get('limit')) },
    '/undo': { POST: (_q, b) => undo(b.runId, b.didId ? String(b.didId) : '') },
    '/mates/rules/remove': { POST: (_q, b) => { if (!editRule(idOf(b), b.line, null)) throw notFound('没有这条规矩。'); return { removed: true } } },
    '/mates/rules/update': { POST: (_q, b) => { if (!editRule(idOf(b), b.line, b.text)) throw notFound('没有这条规矩。'); return { updated: true } } },
    '/today': { GET: () => todayCard() },
  }
  /** One request: { status, body }. `query` is URLSearchParams or a plain object. */
  async function handle(method, path, query, body) {
    const route = routes[path]
    if (!route) return { status: 404, body: { error: 'not found' } }
    const fn = route[method]
    if (!fn) return { status: 405, body: { error: Object.keys(route).join(' / ') + ' only' } }
    const q = query instanceof URLSearchParams ? query : new URLSearchParams(query || {})
    try { return { status: 200, body: await fn(q, body && typeof body === 'object' ? body : {}) } } catch (e) {
      const status = e && (e.status === 400 || e.status === 404) ? e.status : 500
      return { status, body: { error: e instanceof Error ? e.message : String(e) } }
    }
  }

  /** The scheduler tick: due routines run, questions nobody answered in 24 h resume on assumptions. */
  function tick() {
    try { for (const r of routines.due()) runRoutine(r.id) } catch (e) { log('scheduler: ' + (e && e.message)) }
    try { engine.expireAsks() } catch (e) { log('ask expiry: ' + (e && e.message)) }
  }

  const api = {
    register: (s) => scenarios.register(s),
    mates: () => listMates(),
    mate: (id) => mateViewById(id),
    createMate, updateMate, removeMate, thread, serveFile,
    say: (id, text) => engine.say(id, text),
    routines: (mateId) => (mateId ? routines.forMate(mateId) : routines.items).map(rview),
    createRoutine, runRoutine,
    files: (o) => files(o).items,
    deliverable: (id) => deliverables.get(id),
    on: (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
  }

  return { store, deliverables, routines, seen, mates, scenarios, engine, api, tools, routes, handle, tick, runView, mateView: mateViewById, listMates, thread, activity, files, search, workRecord, presetFor, createMate, updateMate, removeMate, createRoutine, updateRoutine, runRoutine, ackRoutine, dir, presetRoot }
}

export function apply(ctx, config = {}) {
  const log = (m) => console.log('[dsh-mywork-tasks] ' + m)
  let controller = null
  ctx.inject(['sessionController'], (sctx) => { controller = sctx.sessionController; sctx.effect(() => () => { controller = null }, 'dsh-mywork-tasks: controller') })
  const mw = createMyWork({ ctx, config, log, controller: () => controller, hostEmit: (payload) => ctx.emit('mywork/task', payload) })
  try { ctx.provide('myworkTasks', mw.api) } catch (e) { log('ctx.provide(myworkTasks) failed: ' + (e && e.message)) }

  ctx.effect(() => ctx.on('session/event', (...args) => { mw.engine.onSessionEvent(args[0], args[1]) }, { global: true }), 'dsh-mywork-tasks: session watcher')
  // The status repair already ran inside createMyWork(); what is left is waking teammates with work handed over before the restart.
  ctx.effect(() => { const t = setTimeout(() => { mw.engine.recover().catch((e) => log('recover: ' + (e && e.message))) }, 3000); return () => clearTimeout(t) }, 'dsh-mywork-tasks: recover')
  // Scheduler: every 30 s run what is due. A run that fell due while the server was down runs once on start.
  ctx.effect(() => { const id = setInterval(mw.tick, 30000); const first = setTimeout(mw.tick, 5000); return () => { clearInterval(id); clearTimeout(first) } }, 'dsh-mywork-tasks: scheduler')

  if (config.tools !== false) for (const t of mw.tools) ctx.tools.register(defineRawTool(t))

  ctx.inject(['webServer'], (wctx) => {
    // Signed file links: no cookie guard on purpose (the live browser has none); the signature and expiry are checked inside.
    wctx.webServer.register({ kind: 'exact', path: '/mywork-tasks/files/raw', handler: (req, res) => { try { mw.api.serveFile(req, res) } catch (e) { res.writeHead(500); res.end(String(e && e.message)) } } })
    const json = (res, body, status = 200) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)) }
    const readBody = (req) => new Promise((resolve, reject) => { let d = ''; let n = 0; req.on('data', (c) => { n += c.length; if (n > 256 * 1024) { reject(new Error('body too large')); req.destroy(); return } d += c }); req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}) } catch (e) { reject(e) } }); req.on('error', reject) })
    for (const path of Object.keys(mw.routes)) {
      wctx.webServer.register({
        kind: 'exact', path: '/mywork-tasks/api' + path,
        handler: (req, res) => rejectUntrusted(ctx, req, res, json) || (async () => {
          try {
            const body = req.method === 'POST' ? await readBody(req) : {}
            const out = await mw.handle(req.method, path, new URL(req.url || '/', 'http://localhost').searchParams, body)
            json(res, out.body, out.status)
          } catch (e) { json(res, { error: e instanceof Error ? e.message : String(e) }, 500) }
        })(),
      })
    }
  })

  log(`ready (${mw.mates.items.length} teammates, ${mw.store.items.length} runs, ${mw.deliverables.items.length} files, ${mw.routines.items.length} routines)`)
}
