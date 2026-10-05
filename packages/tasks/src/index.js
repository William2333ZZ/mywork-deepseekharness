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
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'
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
import { changePrompt, changesEntry, LIST_HEADER, parseCsv, precheck as aiPrecheck, pushOf, toCsv } from './aiwatch.js'
import { mergeRows, scanDir, scanFiles } from './inventory.js'
import { getText, postJson } from './net.js'
import { BASE_URLS, readTasks, resultsCsv, runSelftest, TASK_HEADER } from './selftest.js'

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

/**
 * Teammate templates (EDITIONS.md 9.5), one folder each under templates/: template.json (name, title, group, avatar,
 * pitch, intro, onboard card, subscription items, routine, precheck), duty.md (the job), seed/ (清单.csv, 判断.csv,
 * AGENTS.md copied into a new teammate's folder; {date} becomes today) and sources.json (the precheck's vendor pages).
 */
export function loadTemplates(root) {
  const out = new Map()
  let names = []
  try { names = readdirSync(root) } catch { return out }
  for (const n of names) {
    const dir = join(root, n)
    try {
      const t = JSON.parse(readFileSync(join(dir, 'template.json'), 'utf8'))
      if (!t || !t.id) continue
      t.dir = dir
      t.duty = existsSync(join(dir, 'duty.md')) ? readFileSync(join(dir, 'duty.md'), 'utf8').trim() : ''
      t.sources = existsSync(join(dir, 'sources.json')) ? JSON.parse(readFileSync(join(dir, 'sources.json'), 'utf8')) : []
      out.set(t.id, t)
    } catch {}
  }
  return out
}
/** Prechecks by name: async ({ listText, state, sources, options, fetchText, now }) → { state, changes, checked, related, unreadable, … } */
export const PRECHECKS = { 'ai-watch': aiPrecheck }
/** A file handed over in pieces may grow to this size (材料/). */
const UPLOAD_MAX = 20 * 1024 * 1024
const MATERIAL_DIR = '材料'

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
    '- 你盯的东西（股票、在用的模型和依赖、课题、竞品……）记在你文件夹里的 清单.csv：一行一个对象，第一列是对象名，其余列你定，中文表头，只往后加列；已经有表头的照表头写，用 mywork_list_write 写（按表头合并，用户能撤销）。用户说出的看法、假设和决定记在 判断.csv，表头固定为 编号,类型,内容,依据,重看条件,状态,日期（编号从 J-01 起；类型是 看法 / 假设 / 决定 / 前提；状态是 有效 / 动摇 / 已改 / 撤回）。用户在右边的资料栏里看这两张表。改用户的判断时写清新的状态和理由；你自己的看法在内容前标「同事的：」。',
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
export function createMyWork({ ctx, config = {}, home, log = () => {}, controller = () => null, hostEmit = () => {}, fetchText, post, templates: givenTemplates }) {
  const postModel = typeof post === 'function' ? post : postJson
  const templates = givenTemplates instanceof Map ? givenTemplates : loadTemplates(join(dirname(fileURLToPath(import.meta.url)), '..', 'templates'))
  const fetchSource = typeof fetchText === 'function' ? fetchText : (url) => getText(url, { timeoutMs: 25000 }).then((r) => r.text)
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
      watch: t.watch ? { tier: t.watch.tier, headline: t.watch.headline, n: t.watch.n, now: t.watch.now, push: t.watch.push || '' } : null,
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
      routineCount: routines.forMate(m.id).length, dir: m.dir, template: m.template || '',
      // When a precheck last settled (a quiet one leaves only a receipt): the page re-reads the thread and routines on it.
      checkedAt: routines.forMate(m.id).reduce((acc, r) => (r.precheck && r.runs && r.runs[0] && r.runs[0].settledAt ? later(acc, r.runs[0].settledAt) : acc), ''),
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
    afterTurn: (mateId) => { if (stalePresets.delete(mateId)) relink(mateId); try { onboardAfterIntro(mateId) } catch (e) { log('onboard: ' + (e && e.message)) } },
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
    const tpl = b && b.template ? templates.get(String(b.template)) : null
    if (b && b.template && !tpl) throw bad('没有这个模板。')
    const description = tpl ? tpl.duty || tpl.pitch || tpl.name : String((b && b.description) || '').trim()
    if (!description) throw bad('写一句它负责什么。')
    const mate = mates.create({ description, name: b.name || (tpl ? tpl.name : ''), title: b.title !== undefined ? b.title : tpl ? tpl.title : '' })
    if (tpl) mates.update(mate.id, { template: tpl.id, group: String(b.group || tpl.group || '').trim().slice(0, 12), avatar: avatarOf(b.avatar || tpl.avatar), pinned: !!b.pinned })
    else if (b.group !== undefined || b.pinned !== undefined || b.avatar !== undefined) mates.update(mate.id, { group: String(b.group || '').trim().slice(0, 12), pinned: !!b.pinned, avatar: avatarOf(b.avatar) })
    try { mkdirSync(mate.dir, { recursive: true }) } catch {}
    if (tpl) seedFolder(tpl, mate.dir)
    // The hidden intro run: it names itself when it has no name, sets up a timed duty, and says how it understood its job.
    // A template's intro says its own lines; the onboarding card follows it (onboardAfterIntro).
    const intro = store.create({ mateId: mate.id, trigger: 'system', input: '', title: '自我介绍' })
    if (tpl) store.update(intro.id, { template: tpl.id, prompt: '（这句话是 MyWork 在你刚被创建时替用户发的，用户看不到它，只看得到你的回复。）\n' + (tpl.intro || '用两三句话向用户介绍自己。') })
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
    // A precheck that found nothing made no run: its receipt on the routine is drawn as the same grey line.
    const receipts = []
    for (const rt of routines.forMate(m.id)) {
      if (!rt.precheck) continue
      for (const x of rt.runs || []) {
        if (!x.precheck || x.taskId || x.precheck.running) continue
        receipts.push({ id: 'pc-' + rt.id + '-' + ts(x.at), mateId: m.id, trigger: 'routine', routineId: rt.id, routineTitle: rt.title, status: 'done', quiet: true, receipt: true, precheck: x.precheck, error: '', input: '', activity: [], deliverableIds: [], createdAt: x.at, startedAt: x.at, finishedAt: x.settledAt || x.at })
      }
    }
    const runs = [...store.forMate(m.id).filter(visible), ...receipts].map((r, i) => ({ r, i })).sort((a, b) => (ts(a.r.createdAt) - ts(b.r.createdAt)) || (a.i - b.i)).map((x) => x.r)
    const b = String(before || '').trim()
    if (b && !Number.isFinite(Date.parse(b))) throw bad('before must be an ISO date')
    const cut = b ? ts(b) : Infinity
    const eligible = cut === Infinity ? runs : runs.filter((r) => ts(r.createdAt) < cut)
    const n = Math.max(1, Math.min(THREAD_LIMIT_MAX, Math.floor(Number(limit)) || THREAD_LIMIT))
    let start = Math.max(0, eligible.length - n)
    while (start > 0 && ts(eligible[start - 1].createdAt) === ts(eligible[start].createdAt)) start -= 1
    const page = eligible.slice(start)
    const viewOf = (r) => (r.receipt ? { ...runView(r, []), receipt: true, precheck: r.precheck } : liteRun(runView(r, index.get(r.id) || [])))
    return { runs: page.map(viewOf), nextBefore: start > 0 && page.length ? page[0].createdAt : null }
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
    if (r.precheck && PRECHECKS[r.precheck]) return startPrecheck(r)
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
        // A precheck's change: its headline and the tier code gave it (立刻 · pushed at HH:MM / 到点).
        if (t.watch) { mine.push({ ...item('watch', t.finishedAt, t.watch.headline + (t.watch.n > 1 ? ` 等 ${t.watch.n} 条` : '')), tier: t.watch.tier }); continue }
        const docs = index.get(t.id) || []
        // Something you asked for counts only when it left a file you have not opened yet; a routine's result always.
        if (t.trigger !== 'routine' && !(docs.length && seen.unread(m.id, t.finishedAt))) continue
        const reply = [...(t.activity || [])].reverse().find((a) => a && a.kind === 'text')
        const text = docs.length ? docs[docs.length - 1].title : reply ? plainLine(reply.text) : t.summary
        if (text) mine.push(item(t.trigger === 'routine' ? 'routine' : 'file', t.finishedAt, (t.trigger === 'routine' && t.routineTitle && !docs.length ? t.routineTitle + '：' : '') + text))
      }
      for (const rt of routines.forMate(m.id)) if (rt.precheck) for (const x of rt.runs || []) if (x.precheck && !x.taskId && !x.precheck.running && ts(x.settledAt || x.at) >= since) q += 1
      mine.sort((a, b) => (a.tier === 'now' ? 0 : 1) - (b.tier === 'now' ? 0 : 1) || ts(b.at) - ts(a.at))
      if (mine.length) changes.push(...mine.slice(0, 3).map((x, i) => (i === 2 && mine.length > 3 ? { ...x, more: mine.length - 3 } : x)))
      if (q) quiet.push({ mateId: m.id, mateName: name, n: q })
    }
    const order = { ask: 0, failed: 1, remind: 2 }
    needs.sort((a, b) => (order[a.kind] - order[b.kind]) || (ts(b.at) - ts(a.at)))
    // 立刻 changes first, across teammates (EDITIONS.md 4.4); the rest keep their teammate order.
    changes.sort((a, b) => (a.tier === 'now' ? 0 : 1) - (b.tier === 'now' ? 0 : 1))
    // One screen: at most 12 rows in all (需要你 first); what does not fit is counted, and each teammate's thread has it.
    const room = Math.max(3, TODAY_ROWS - needs.length)
    const hidden = Math.max(0, changes.length - room)
    const days = daysOf(now)
    return { ...base, ready: true, needs, days, changes: changes.slice(0, Math.max(3, room - days.length)), hidden: Math.max(0, changes.length - Math.max(3, room - days.length)), did, quiet, updatedAt: now.toISOString() }
  }

  // ── templates, 上岗, 在用清单, 预检 (EDITIONS.md 3, 4.1, 9.3; PROACTIVE.md 12) ──
  const cardId = (p) => p + '-' + Date.now().toString(36) + randomBytes(3).toString('hex')
  const dayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') }
  const templateView = (tp) => ({ id: tp.id, name: tp.name, title: tp.title || '', group: tp.group || '', avatar: tp.avatar || null, pitch: tp.pitch || '' })
  /** A template's seed files into a new teammate's folder (never over a file that is already there). */
  function seedFolder(tp, dir, sub = '') {
    const from = join(tp.dir, 'seed', sub)
    let names = []
    try { names = readdirSync(from) } catch { return }
    for (const n of names) {
      const to = join(dir, sub, n)
      try { if (statSync(join(from, n)).isDirectory()) { mkdirSync(to, { recursive: true }); seedFolder(tp, dir, join(sub, n)); continue } } catch { continue }
      if (existsSync(to)) continue
      try { writeFileSync(to, readFileSync(join(from, n), 'utf8').replace(/\{date\}/g, dayStr())) } catch (e) { log(`seed ${n}: ${e && e.message}`) }
    }
  }
  /** The card a run carries (kind, and id when given), or a 404. */
  function cardOf(runId, entryId, kind) {
    const run = store.get(String(runId || ''))
    if (!run) throw notFound('run not found')
    const e = [...(run.activity || [])].reverse().find((a) => a && a.kind === kind && (!entryId || a.id === entryId))
    if (!e) throw notFound('没有这张卡。')
    return { run, e }
  }
  /** After a template teammate's intro turn: the onboarding card (上岗卡) under its greeting, once. */
  function onboardAfterIntro(mateId) {
    const m = mates.get(mateId)
    const tp = m && m.template ? templates.get(m.template) : null
    if (!tp || !tp.onboard) return
    const intro = store.forMate(m.id).find((r) => r.trigger === 'system' && r.template)
    if (!intro || intro.status !== 'done' || (intro.activity || []).some((a) => a && a.kind === 'onboard')) return
    const o = tp.onboard
    store.activity(intro.id, { kind: 'onboard', id: cardId('ob'), template: tp.id, title: o.title || '开工 · ' + tp.name, question: o.question || '', hint: o.hint || '', placeholder: o.placeholder || '', done: false })
    emit('mate', null, { mateId: m.id })
  }
  /** A new name in 材料/ for a file handed over (never over an existing one). */
  function materialPath(m, name) {
    const base = String(name || 'file').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/^\.+/, '').trim().slice(0, 120) || 'file'
    mkdirSync(join(m.dir, MATERIAL_DIR), { recursive: true })
    const ext = extname(base)
    const stem = ext ? base.slice(0, -ext.length) : base
    let candidate = base
    for (let i = 2; existsSync(join(m.dir, MATERIAL_DIR, candidate)); i += 1) candidate = `${stem} (${i})${ext}`
    return MATERIAL_DIR + '/' + candidate
  }
  /** POST /mates/upload { id, name, data (base64) } → a new file in 材料/; { path, data } appends the next piece to it. */
  function upload(b) {
    const m = mates.get(String((b && b.id) || ''))
    if (!m) throw notFound('同事不存在。')
    const data = Buffer.from(String(b.data || ''), 'base64')
    let rel = String(b.path || '')
    if (rel) {
      const full = resolve(m.dir, rel)
      const inside = relative(resolve(m.dir, MATERIAL_DIR), full)
      if (!inside || inside.startsWith('..') || isAbsolute(inside)) throw bad('只能续写 材料/ 里的文件。')
      rel = relative(resolve(m.dir), full).split('\\').join('/')
    } else rel = materialPath(m, b.name)
    const full = join(m.dir, rel)
    const before = b.path && existsSync(full) ? statSync(full).size : 0
    if (before + data.length > UPLOAD_MAX) throw bad('文件太大了：一个最多 20 MB。')
    if (b.path) appendFileSync(full, data); else writeFileSync(full, data)
    return { path: rel, size: before + data.length }
  }
  /**
   * The onboarding card's 「交给它」: files already in 材料/ plus what you wrote. Code reads candidates first (dependency
   * files, gateway configs, bills, folders the text names); the teammate checks them and writes 清单.csv.
   */
  function onboard(b) {
    const m = mates.get(String((b && b.id) || ''))
    if (!m) throw notFound('同事不存在。')
    const { run: introRun, e } = cardOf(b.runId, b.entryId, 'onboard')
    if (e.done) throw bad('已经交给它了。')
    const files = (Array.isArray(b.files) ? b.files : []).map((x) => String(x || '').trim()).filter(Boolean).slice(0, 20)
    const text = String(b.text || '').trim().slice(0, 4000)
    if (!files.length && !text) throw bad('给它一个文件，或者写几句你们在用什么。')
    const texts = []
    for (const f of files) { try { texts.push({ name: f.replace(/^材料\//, ''), text: readFileSync(folderPath(m.id, f).full, 'utf8').slice(0, 5 * 1024 * 1024) }) } catch {} }
    if (text) texts.push({ name: '你写的', text })
    const scan = scanFiles(texts)
    const dirs = []
    for (const raw of text.match(/(?:~|\/)[^\s，。；、"'`]+/g) || []) { const p = raw.startsWith('~') ? join(homedir(), raw.slice(1)) : raw; try { if (statSync(p).isDirectory() && !dirs.includes(p)) dirs.push(p) } catch {} }
    let rows = scan.rows
    for (const d of dirs.slice(0, 3)) { const s = scanDir(d); rows = mergeRows([...rows, ...s.rows]); scan.read.push({ name: d, kind: '代码目录', n: s.rows.length }) }
    const at = new Date().toISOString()
    store.update(introRun.id, () => { e.done = true; e.doneAt = at; e.files = files; e.note = clip(text, 120) })
    const shown = files.map((f) => f.replace(/^材料\//, ''))
    const visible = [shown.length ? '我们在用的东西放在 材料/ 里：' + shown.join('、') + '。' : '', text].filter(Boolean).join('\n')
    const cols = ['类型', '名称', '供应商', '模型ID或版本', '月用量或花费', '怎么知道的']
    const extra = [
      '',
      '（以下是 MyWork 替用户附上的，用户看不到。）',
      rows.length ? `程序先从这些材料里读出了 ${rows.length} 行候选（「怎么知道的」已写好）：\n` + toCsv(cols, rows.slice(0, 200).map((r) => cols.map((c) => r[c] || ''))) : '程序没从材料里读出候选：你自己读一遍材料（材料/ 下），或者问用户。',
      scan.skipped.length ? '程序不认识的：' + scan.skipped.map((x) => x.name).join('、') + '（你自己看）。' : '',
      dirs.length ? `用户给的代码目录（程序扫过一遍）：${dirs.join('、')}。` : '',
      '你要做：核对这些候选（去掉不是在用的、合并重复的、SDK 和模型分开），能确定的列补上；用户写到的哪里在用、负责人、月花费照填，用户没说的「哪里在用」留空，不要猜。然后调用 mywork_list_write（confirm: true，rows 的键用 清单.csv 的表头）写进清单，再用两三句话告诉用户：读到了几行、哪几行的「哪里在用」还空着、还缺什么（比如账单）。不要交付文件，不要建例行。',
    ].filter((x) => x !== '').join('\n')
    const run = store.create({ mateId: m.id, trigger: 'user', input: visible })
    store.update(run.id, { promptExtra: extra })
    emit('mate', null, { mateId: m.id })
    emit('queued', store.get(run.id))
    engine.pump()
    return { runId: run.id, candidates: rows.length, read: scan.read }
  }
  /**
   * 清单.csv by its header: a model row is keyed by 模型ID或版本 (else 名称), an SDK row by 名称; an existing row takes the
   * non-empty cells it is given; a column the header lacks is added at the end. The file is snapshotted for 撤销 first.
   * confirm → the list card (前 10 行 + 对，就这些 / 改一下) under the run's reply.
   */
  function writeList(mate, runId, rows, { replace, confirm } = {}) {
    const file = join(mate.dir, '清单.csv')
    const existing = existsSync(file) ? parseCsv(readFileSync(file, 'utf8')) : []
    const header = existing.length ? existing[0].map((x) => String(x).trim()) : mate.template === 'watch-ai' ? LIST_HEADER.slice() : []
    const keyOf = (o) => {
      const sdk = /sdk|框架|库|framework|library/i.test(String(o['类型'] || ''))
      const v = String((sdk ? o['名称'] : o['模型ID或版本'] || o['名称']) || (header[0] ? o[header[0]] : '') || '').trim().toLowerCase()
      return v ? (sdk ? 'sdk:' : 'm:') + v : ''
    }
    const body = replace ? [] : existing.slice(1).filter((c) => c.some((x) => String(x).trim())).map((cells) => Object.fromEntries(header.map((h, i) => [h, String(cells[i] === undefined ? '' : cells[i])])))
    let added = 0
    let updated = 0
    for (const raw of rows) {
      if (!raw || typeof raw !== 'object') continue
      const o = {}
      for (const [k, v] of Object.entries(raw)) { const kk = String(k).trim().slice(0, 20); if (kk) o[kk] = String(v === undefined || v === null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, 300) }
      for (const k of Object.keys(o)) if (!header.includes(k)) header.push(k)
      const k = keyOf(o)
      const hit = k ? body.find((x) => keyOf(x) === k) : null
      if (hit) { for (const [kk, v] of Object.entries(o)) if (v) hit[kk] = v; updated += 1 } else { body.push(o); added += 1 }
    }
    if (!header.length) throw new Error('清单还没有表头：rows 里至少要有一个键。')
    mkdirSync(mate.dir, { recursive: true })
    if (runId) engine.recordFileChange(runId, mate, file)
    writeFileSync(file, toCsv(header, body.map((o) => header.map((h) => o[h] || ''))))
    if (confirm && runId) store.activity(runId, { kind: 'listcheck', id: cardId('lc'), file: '清单.csv', rows: body.length, added, updated, confirmed: false })
    emit('mate', null, { mateId: mate.id })
    return { rows: body.length, added, updated, header }
  }
  /** 「对，就这些」 on the list card; a template teammate's subscription card (它会主动做的) follows, once. */
  function listOk(b) {
    const m = mates.get(String((b && b.id) || ''))
    if (!m) throw notFound('同事不存在。')
    const { run, e } = cardOf(b.runId, b.entryId, 'listcheck')
    store.update(run.id, () => { e.confirmed = true; e.confirmedAt = new Date().toISOString() })
    const tp = m.template ? templates.get(m.template) : null
    const asked = store.forMate(m.id).some((r) => (r.activity || []).some((a) => a && a.kind === 'subscribe'))
    if (tp && Array.isArray(tp.subscribe) && tp.subscribe.length && !asked) {
      store.activity(run.id, { kind: 'subscribe', id: cardId('sb'), title: '它会主动做的 · ' + (m.name || tp.name), items: tp.subscribe.map((x) => ({ id: String(x.id), label: String(x.label || ''), note: String(x.note || ''), on: x.on !== false })), quiet: tp.quiet || '', done: false })
    }
    emit('mate', null, { mateId: m.id })
    return { run: runView(store.get(run.id)) }
  }
  /** 「交给它」 on the subscription card: the ticked items become its routines, and the first check (the baseline) runs now. */
  function subscribe(b) {
    const m = mates.get(String((b && b.id) || ''))
    if (!m) throw notFound('同事不存在。')
    const tp = m.template ? templates.get(m.template) : null
    if (!tp) throw bad('这位同事不是用模板建的。')
    const { run, e } = cardOf(b.runId, b.entryId, 'subscribe')
    if (e.done) throw bad('已经交给它了。')
    const on = (id) => (b.items && typeof b.items === 'object' && id in b.items ? !!b.items[id] : !!((e.items || []).find((x) => x.id === id) || {}).on)
    let routine = null
    if (on('precheck') && tp.routine && tp.precheck) {
      routine = routines.forMate(m.id).find((r) => r.precheck === tp.precheck) || null
      if (!routine) {
        routine = routines.create({ mateId: m.id, kind: 'task', title: tp.routine.title, input: tp.routine.input, schedule: { type: 'interval', everyMinutes: Number(tp.routine.everyMinutes) || 360 }, precheck: tp.precheck, options: { sdk: on('sdk') } })
        store.activity(run.id, { kind: 'routine', action: 'created', routineId: routine.id, title: routine.title, scheduleLabel: describeSchedule(routine.schedule) })
        store.activity(run.id, { kind: 'did', id: didId(), act: 'routine', routineId: routine.id, title: routine.title, undoable: true })
        emit('routine', null, { mateId: m.id, routine: rview(routine) })
      } else routines.update(routine.id, (r) => { r.options = { ...(r.options || {}), sdk: on('sdk') } })
    }
    const at = new Date().toISOString()
    store.update(run.id, () => { e.done = true; e.doneAt = at; e.items = (e.items || []).map((x) => ({ ...x, on: on(x.id) })) })
    emit('mate', null, { mateId: m.id })
    // 马上出基线: the first check runs now, not in six hours.
    if (routine) startPrecheck(routines.get(routine.id))
    return { routine: routine ? rview(routines.get(routine.id)) : null }
  }

  /**
   * A routine with a precheck: the script runs first (no model). Nothing touched a row in use → a receipt on the routine
   * (drawn as one grey line, no run, no unread, no push). Changes → a routine run whose prompt carries them, the change
   * card (activity 'changes') built by code, and `watch` (tier, headline, push text) for the 今天卡 and the IM push.
   */
  const prechecking = new Map() // routineId → Promise
  function startPrecheck(r) {
    if (prechecking.has(r.id)) return { routine: rview(r), precheck: true, running: true }
    routines.ran(r.id, { precheck: { running: true } })
    const receiptAt = routines.get(r.id).runs[0].at
    const p = runPrecheck(r.id, receiptAt)
      .catch((e) => {
        log(`precheck ${r.id}: ${e && e.message}`)
        try { routines.markRun(r.id, receiptAt, { precheck: { checked: 0, related: 0, unreadable: [{ title: '预检', reason: clip(String((e && e.message) || e), 80) }], failed: true }, changed: false }) } catch {}
        emit('mate', null, { mateId: r.mateId })
        return { changes: 0, error: String((e && e.message) || e) }
      })
      .finally(() => prechecking.delete(r.id))
    prechecking.set(r.id, p)
    return { routine: rview(routines.get(r.id)), precheck: true }
  }
  async function runPrecheck(routineId, receiptAt) {
    const r = routines.get(routineId)
    const mate = r ? mates.get(r.mateId) : null
    if (!r || !mate) return { changes: 0 }
    const tp = (mate.template && templates.get(mate.template)) || [...templates.values()].find((x) => x.precheck === r.precheck) || null
    const stateFile = join(mate.dir, '.mywork', 'precheck', routineId + '.json')
    let state = {}
    try { state = JSON.parse(readFileSync(stateFile, 'utf8')) } catch {}
    let listText = ''
    try { listText = readFileSync(join(mate.dir, '清单.csv'), 'utf8') } catch {}
    const result = await PRECHECKS[r.precheck]({ listText, state, sources: tp ? tp.sources : [], options: r.options || {}, fetchText: fetchSource, now: new Date() })
    mkdirSync(dirname(stateFile), { recursive: true })
    writeFileSync(stateFile, JSON.stringify(result.state, null, 1))
    const summary = { checked: result.checked || 0, related: result.related || 0, unreadable: (result.unreadable || []).slice(0, 8), baseline: !!result.baseline, empty: !!result.empty, sources: (result.sources || []).length }
    // 立刻 first: the card's order, the headline (今天卡) and the push all lead with what cannot wait.
    const loud = (result.changes || []).filter((c) => c.tier !== 'seen').sort((a, b) => (a.tier === 'now' ? 0 : 1) - (b.tier === 'now' ? 0 : 1))
    if (!loud.length) {
      routines.markRun(routineId, receiptAt, { precheck: summary, changed: false })
      log(`precheck ${routineId}: nothing touched a row in use (${summary.checked} looked at)`)
      emit('mate', null, { mateId: mate.id })
      return { changes: 0 }
    }
    const res = { ...result, changes: loud }
    const now = loud.filter((c) => c.tier === 'now').length
    const run = store.create({ mateId: mate.id, trigger: 'routine', routineId, routineTitle: r.title, input: r.input })
    store.update(run.id, { prompt: changePrompt(r, res), watch: { tier: now ? 'now' : 'digest', headline: loud[0].headline, n: loud.length, now, push: pushOf(mate.name, loud) } })
    store.activity(run.id, { ...changesEntry(res), id: cardId('chg') })
    routines.markRun(routineId, receiptAt, { taskId: run.id, precheck: summary })
    log(`precheck ${routineId}: ${loud.length} change(s), ${now} now → run ${run.id}`)
    emit('queued', store.get(run.id))
    engine.pump()
    return { changes: loud.length, now, runId: run.id }
  }
  /**
   * An item of a change card, acted on (POST /mates/change): plan → it writes a migration plan (where the code names the
   * model, what to change, replacements constraints first, what to retest); retest → it runs the current model and the
   * replacements on 自测/任务.csv (drafting the tasks with you when there are none); mine / doing → you are on it, the
   * card says so and the countdown stays. Research (needs report 7.2): the pain is migrating and retesting, not knowing.
   */
  const CHANGE_ACTIONS = ['plan', 'retest', 'mine', 'doing']
  function actOnChange(b) {
    const m = mates.get(String((b && b.id) || ''))
    if (!m) throw notFound('同事不存在。')
    const action = String(b.action || '')
    if (!CHANGE_ACTIONS.includes(action)) throw bad('action 是 plan / retest / mine / doing。')
    const { run, e } = cardOf(b.runId, b.entryId, 'changes')
    const item = (e.items || []).find((x) => x.key === String(b.key || ''))
    if (!item) throw notFound('卡片上没有这一条。')
    const at = new Date().toISOString()
    let runId = ''
    if (action === 'plan' || action === 'retest') {
      const facts = [`${item.subject} ${item.summary}`, item.where ? item.where + '在用' : '哪里在用：未填', item.effective ? '生效 ' + item.effective : '', item.replacement && item.replacement.length ? '厂商给的替代：' + item.replacement.join('、') : '', '出处 ' + item.source + (item.url ? ' ' + item.url : ''), item.quote ? '原文「' + item.quote + '」' : ''].filter(Boolean).join('；')
      const visible = action === 'plan' ? `给 ${item.subject} 出一份迁移方案` : `在我们的任务上重测 ${item.subject} 和它的替代`
      const extra = action === 'plan' ? [
        '', '（以下是 MyWork 替用户附上的，用户看不到。）', '变化：' + facts,
        '出一份迁移方案，用 deliver 交付（kind report，标题「迁移方案 · ' + item.subject + '」）：',
        '1. 在哪里改：在清单里「怎么知道的」提到的文件和代码目录里找出所有用到这个模型的地方，逐条写 文件:行 和要改成什么（模型名、base URL、参数）。找不到代码的写明「代码没给我」。',
        '2. 换成什么：先列约束（同一家、同一个账号和发票、国内能买到、会不会被封、合规），再比能力和价格；至多三个候选，写清不选的理由。价格标出处（官方 / 第三方）。',
        '3. 要重测什么：按「哪里在用」列出要重测的业务和看哪些指标；如果文件夹里有 自测/任务.csv，说明可以直接用 mywork_selftest_run 跑。',
        '4. 时间线：离生效还有几天、建议哪天前改完、要谁来做。',
        '不要替用户改代码，除非用户在对话里明说让你改。交付后用两三句话回话。',
      ] : [
        '', '（以下是 MyWork 替用户附上的，用户看不到。）', '变化：' + facts,
        '在用户自己的任务上重测（EDITIONS 9.3）：',
        '1. 任务在 自测/任务.csv（表头 ' + TASK_HEADER.join(',') + '；判定方法是 包含 / 不包含 / 等于 / 正则 / JSON / 长度不超过 / 标准 / 人工）。没有任务或少于 5 条时，先从「哪里在用」相关的代码、提示词和日志里起草 10 条真实任务写进去（判定方法能用代码判的就用代码判），在回话里说清是你起草的、请用户改，然后照样跑。',
        '2. 候选：现在用的模型，加一到两个替代（先看约束：同一家、同一个账号和发票、国内能买到）。',
        '3. key：用户在对话里给过的 key 存在 .mywork/keys.json（{ "deepseek": "sk-…" } 按供应商）；这里没有的，用 mywork_ask 问用户要，不要猜。',
        '4. 调用 mywork_selftest_run 跑；然后用三五句话说结果（每个候选 通过/总数、待你看几条、平均耗时），哪几条值得用户亲自看。数字标「我们测的」。',
      ]
      const created = store.create({ mateId: m.id, trigger: 'user', input: visible })
      store.update(created.id, { promptExtra: extra.join('\n') })
      runId = created.id
      emit('queued', store.get(created.id))
      engine.pump()
    }
    store.update(run.id, () => { item.handled = { action, at, runId } })
    emit('mate', null, { mateId: m.id })
    return { run: runView(store.get(run.id)), runId }
  }

  /** The keys a teammate keeps (.mywork/keys.json, by vendor or label); never shown, never written to results. */
  function keyOf(mate, c) {
    if (c.apiKey) return String(c.apiKey)
    if (c.keyEnv && process.env[c.keyEnv]) return process.env[c.keyEnv]
    try {
      const keys = JSON.parse(readFileSync(join(mate.dir, '.mywork', 'keys.json'), 'utf8'))
      for (const k of [c.vendor, c.label, c.model].filter(Boolean)) if (typeof keys[k] === 'string' && keys[k]) return keys[k]
    } catch {}
    return ''
  }
  const stampNow = () => { const d = new Date(); const p2 = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}` }
  /** mywork_selftest_run: the tasks on every candidate, a results table in 自测/, a card in the thread. */
  async function selftest(mate, runId, args) {
    const file = resolve(mate.dir, String(args.tasks || '自测/任务.csv'))
    let text = ''
    try { text = readFileSync(file, 'utf8') } catch { throw new Error(`${relative(mate.dir, file)} 不存在：先和用户一起写 10–30 条真实任务，表头 ${TASK_HEADER.join(',')}。`) }
    let tasks = readTasks(text)
    if (!tasks.length) throw new Error('任务表是空的：每行至少要有「输入」。')
    const limit = Math.floor(Number(args.limit)) || 0
    if (limit > 0) tasks = tasks.slice(0, limit)
    const list = (Array.isArray(args.candidates) ? args.candidates : []).slice(0, 4)
    if (!list.length) throw new Error('给至少一个候选：{ vendor 或 baseUrl, model }。')
    const resolveOne = (c, i) => {
      const vendor = String(c.vendor || '').toLowerCase()
      const baseUrl = String(c.baseUrl || BASE_URLS[vendor] || '')
      const model = String(c.model || '').trim()
      if (!model) throw new Error(`第 ${i + 1} 个候选没有 model。`)
      if (!baseUrl) throw new Error(`${model}：不知道它的接口地址，给 baseUrl（OpenAI 兼容的 /v1），或 vendor（${Object.keys(BASE_URLS).join(' / ')}）。`)
      const apiKey = keyOf(mate, { ...c, vendor })
      if (!apiKey) throw new Error(`${model}：没有 key。用户给你 key 后存进 .mywork/keys.json（{ "${vendor || 'label'}": "sk-…" }），或在 apiKey 里传。`)
      return { label: String(c.label || model), vendor, baseUrl, model, apiKey }
    }
    const candidates = list.map(resolveOne)
    const judge = args.judge && args.judge.model ? resolveOne(args.judge, list.length) : null
    const { rows, summary } = await runSelftest({ tasks, candidates, judge, post: postModel, concurrency: 4 })
    const out = join(mate.dir, '自测', `结果-${stampNow()}.csv`)
    mkdirSync(dirname(out), { recursive: true })
    if (runId) engine.recordFileChange(runId, mate, out)
    writeFileSync(out, resultsCsv(rows))
    const rel = relative(mate.dir, out).split('\\').join('/')
    const checks = rows.filter((x) => x.check).length
    if (runId) store.activity(runId, { kind: 'selftest', id: cardId('st'), file: rel, tasks: tasks.length, judge: judge ? judge.label : '', checks, summary: summary.map((s) => ({ label: s.label, model: s.model, total: s.total, pass: s.pass, fail: s.fail, manual: s.manual, errors: s.errors, avgMs: s.avgMs, tokensIn: s.tokensIn, tokensOut: s.tokensOut })) })
    emit('mate', null, { mateId: mate.id })
    return { file: rel, tasks: tasks.length, checks, summary: summary.map(({ model: _m, ...s }) => s) }
  }

  /** 今天的日子 (PROACTIVE.md 7.4): open migrations counting down (a shutdown or redirect of a row in use, ≤30 days ahead). */
  function daysOf(now) {
    const out = []
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    for (const m of mates.items) {
      for (const t of store.forMate(m.id)) {
        for (const a of t.activity || []) {
          if (!a || a.kind !== 'changes') continue
          for (const x of a.items || []) {
            if (!x.effective || !(x.category === '下线' || x.category === '改名重定向' || x.category === '改计费')) continue
            const [y, mo, d] = x.effective.split('-').map(Number)
            const left = Math.round((Date.UTC(y, mo - 1, d) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000)
            if (left < 0 || left > 30 || !(today >= 0)) continue
            out.push({ mateId: m.id, mateName: m.name || '新同事', runId: t.id, kind: 'day', at: x.effective, days: left, text: clip(`${x.subject} ${x.category === '下线' ? '下线' : x.category}还有 ${left} 天${x.where ? ' · ' + x.where + '在用' : ''}${x.handled ? ' · ' + ({ plan: '方案在出', retest: '在重测', mine: '你来改', doing: '在改' }[x.handled.action] || '') : ''}`, 70) })
          }
        }
      }
    }
    const seenKey = new Set()
    return out.filter((x) => { const k = x.mateId + x.text; if (seenKey.has(k)) return false; seenKey.add(k); return true }).sort((a, b) => a.days - b.days).slice(0, 3)
  }

  /** Run a routine's precheck now and wait for it (tests; 现在跑一次 does not wait). */
  function precheckNow(id) {
    const r = routines.get(String(id || ''))
    if (!r || !r.precheck) throw notFound('routine not found')
    startPrecheck(r)
    return prechecking.get(r.id) || Promise.resolve({ changes: 0 })
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
      name: 'mywork_list_write',
      description: '把行写进你文件夹里的 清单.csv（只在 MyWork 同事的会话里可用）。按表头合并：模型按「模型ID或版本」、SDK 按「名称」对上已有的行，只补非空的列；表头没有的列加在最后；用户在对话里能一键撤销。confirm: true 时对话里出一张清单确认卡（前 10 行 + 「对，就这些 / 改一下」）：第一次建清单、或用户给了新材料后用。',
      parameters: {
        rows: { type: 'array', required: true, items: { type: 'object' }, description: '一行一个对象，键是 清单.csv 的表头，例如 { 类型: "模型", 名称: "deepseek-chat", 供应商: "DeepSeek", 模型ID或版本: "deepseek-chat", 哪里在用: "客服机器人", 月用量或花费: "¥5,000", 怎么知道的: "网关渠道「客服」" }' },
        replace: { type: 'boolean', description: 'true = 整张换掉（默认合并）' },
        confirm: { type: 'boolean', description: 'true = 对话里出清单确认卡' },
      },
      execute(args, exec) {
        const c = mateOnly(exec, 'mywork_list_write')
        const rows = Array.isArray(args.rows) ? args.rows : []
        if (!rows.length && !args.replace) throw new Error('rows 不能为空。')
        return writeList(c.mate, c.run ? c.run.id : '', rows, { replace: !!args.replace, confirm: !!args.confirm })
      },
      render: (_a, v) => [{ type: 'text', text: `清单写好了：共 ${v.rows} 行（新加 ${v.added}，更新 ${v.updated}）。` }],
    },
    {
      name: 'mywork_selftest_run',
      description: '在用户自己的任务上测模型（只在 MyWork 同事的会话里可用）：读 自测/任务.csv（表头 编号,任务,输入,判定方法,期望,备注），每条任务在每个候选上跑一次（OpenAI 兼容接口），按判定方法判（包含 / 不包含 / 等于 / 正则 / JSON / 长度不超过 由程序判；标准 由 judge 模型判，抽 5 条给用户看；人工 留给用户看），结果写进 自测/结果-<时间>.csv，对话里出一张结果卡。key 从 .mywork/keys.json（按供应商）或 apiKey 取，不会写进结果。',
      parameters: {
        candidates: { type: 'array', required: true, items: { type: 'object' }, description: '1–4 个候选，例如 { vendor: "deepseek", model: "deepseek-flash", label: "替代" }；vendor 是 deepseek / alibaba / zhipu / moonshot / volcengine / siliconflow / openai / anthropic / google / openrouter 等，或者直接给 baseUrl（OpenAI 兼容的 /v1）；apiKey 可选' },
        tasks: { type: 'string', description: '任务表路径，默认 自测/任务.csv' },
        judge: { type: 'object', description: '可选，给「标准」类任务打分的模型，格式同候选' },
        limit: { type: 'number', description: '可选，只跑前 N 条（先试跑）' },
      },
      async execute(args, exec) {
        const c = mateOnly(exec, 'mywork_selftest_run')
        return selftest(c.mate, c.run ? c.run.id : '', args || {})
      },
      render: (_a, v) => [{ type: 'text', text: `测完了：${v.tasks} 条任务，结果在 ${v.file}。` + v.summary.map((s) => `${s.label} 通过 ${s.pass}/${s.total}${s.manual ? '，待看 ' + s.manual : ''}${s.errors ? '，失败 ' + s.errors : ''}`).join('；') }],
    },
    {
      name: 'mywork_inventory_scan',
      description: '用程序读出「我们在用什么」的候选行（只在 MyWork 同事的会话里可用）。给文件或目录的路径（相对你的文件夹，或绝对路径，~ 是用户主目录）。认得 package.json、requirements*.txt、pyproject.toml、go.mod、new-api / one-api 渠道导出、LiteLLM 配置、账单 CSV，以及代码里加了引号的模型 ID。返回候选行和「怎么知道的」，不写文件；核对后用 mywork_list_write 写进清单。',
      parameters: { paths: { type: 'array', required: true, items: { type: 'string' }, description: '文件或目录的路径' } },
      execute(args, exec) {
        const c = mateOnly(exec, 'mywork_inventory_scan')
        const files = []
        const rows = []
        const read = []
        const skipped = []
        for (const raw of (Array.isArray(args.paths) ? args.paths : []).slice(0, 20)) {
          const p0 = String(raw || '').trim()
          if (!p0) continue
          const p = p0.startsWith('~') ? join(homedir(), p0.slice(1)) : resolve(c.mate.dir, p0)
          let st
          try { st = statSync(p) } catch { skipped.push({ name: p0, reason: '不存在' }); continue }
          if (st.isDirectory()) { const s = scanDir(p); rows.push(...s.rows); read.push({ name: p0, kind: '目录', n: s.rows.length, files: s.files }) }
          else if (st.size > 8 * 1024 * 1024) skipped.push({ name: p0, reason: '超过 8 MB' })
          else { try { files.push({ name: p0, text: readFileSync(p, 'utf8') }) } catch (e) { skipped.push({ name: p0, reason: String(e && e.message) }) } }
        }
        const s = scanFiles(files)
        return { rows: mergeRows([...rows, ...s.rows]).slice(0, 300), read: [...read, ...s.read], skipped: [...skipped, ...s.skipped] }
      },
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
    '/templates': { GET: () => ({ items: [...templates.values()].map(templateView) }) },
    '/mates/upload': { POST: (_q, b) => upload(b) },
    '/mates/onboard': { POST: (_q, b) => onboard(b) },
    '/mates/listok': { POST: (_q, b) => listOk(b) },
    '/mates/subscribe': { POST: (_q, b) => subscribe(b) },
    '/mates/change': { POST: (_q, b) => actOnChange(b) },
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

  return { store, deliverables, routines, seen, mates, scenarios, engine, api, tools, routes, handle, tick, runView, mateView: mateViewById, listMates, thread, activity, files, search, workRecord, presetFor, createMate, updateMate, removeMate, createRoutine, updateRoutine, runRoutine, ackRoutine, dir, presetRoot, templates, precheckNow, writeList, onboard, listOk, subscribe, upload, todayCard, actOnChange, selftest }
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
