/**
 * dsh-mywork-tasks — the work benches of the teammates made for AI work (design/v2/AI-WORKERS.md). Each follows one
 * practitioner's published workflow, and each has the part code does so the model need not be trusted with it:
 *
 *   每日论文 (papers)        苏剑林's daily arXiv sweep: code takes the whole day's list before the run (prepArxiv), the
 *                           panel shows it in arXiv's order with the teammate's picks marked; 收进知识库 hands a paper over
 *   实验 (experiments)       Karpathy's autoresearch: results.tsv read by code (the panel, the morning numbers); 连续跑 —
 *                           code calls the next round until the time you set, so the model cannot stop early on its own
 *   代码研究 (code-research)  Simon Willison: one folder per question; 未经你审 until you mark it reviewed
 *   论文 (paper)             Neel Nanda's claims, ARIS / ICLR 核引用: mywork_cite_check looks every reference up
 *
 * A template says which bench it has (template.json `panel.id`); the routes below refuse a teammate without it.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { categoriesOf, DAILY_DIR, FAVS_FILE, fetchDaily, picksOf, readDay, readTriage, saveDay, savedDays, titleLines, triagePath, TYPE_WORDS } from './arxiv.js'
import { checkEntries, lastCheck, readDraft, saveCheck, statusWord } from './cite.js'
import { markReviewed, scanProjects } from './projects.js'
import { ledgerLine, readLedger, summarize } from './results.js'

const pad = (n) => String(n).padStart(2, '0')
const dayOf = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
const hhmm = (iso) => { const d = new Date(iso); return pad(d.getHours()) + ':' + pad(d.getMinutes()) }
/** Rounds of one 连续跑 at most, and how many rounds in a row without a new results.tsv row end it. */
export const LOOP_MAX = 200
export const LOOP_IDLE = 3
const INLINE_TITLES = 20000

export function createBenches({ store, mates, routines, templates, emit, pump, log, notFound, bad, fetch: f, now = () => new Date() }) {
  const doFetch = (...a) => (f || globalThis.fetch)(...a)
  const tplOf = (m) => (m && m.template ? templates.get(m.template) || null : null)
  const benchOf = (m) => { const tp = tplOf(m); return tp && tp.panel && tp.panel.id ? tp.panel.id : '' }
  function mateWith(id, bench) {
    const m = mates.get(String(id || ''))
    if (!m) throw notFound('同事不存在。')
    if (bench && benchOf(m) !== bench) throw bad('这位同事没有这个工作台。')
    return m
  }
  const readText = (p) => { try { return readFileSync(p, 'utf8') } catch { return '' } }
  /** A done run posted by code into a teammate's thread: one line of text (quiet: a grey line when it is a routine's). */
  function postLine(mateId, text, extra = {}) {
    const at = now().toISOString()
    const run = store.create({ mateId, trigger: extra.routineId ? 'routine' : 'system', input: extra.input || '', status: 'done', ...(extra.routineId ? { routineId: extra.routineId, routineTitle: extra.routineTitle } : {}) })
    store.update(run.id, { startedAt: at, finishedAt: at, summary: text, quiet: !!extra.quiet, ...(extra.patch || {}), activity: [{ kind: 'text', text, at }] })
    emit('done', store.get(run.id))
    return store.get(run.id)
  }

  // ── 每日论文 ──
  const preparing = new Set()
  /** The routine with `prep: 'arxiv'`: code fetches the day's list first; no new list means one grey line and no run. */
  async function prepArxiv(r, m, manual) {
    const cats = categoriesOf(readText(join(m.dir, 'AGENTS.md')))
    let day = null
    let err = ''
    if (!cats.length) err = 'AGENTS.md 里还没写分类（「分类：cs.CL, cs.LG」这样一行）'
    else { try { day = await fetchDaily(cats, { fetch: doFetch }) } catch (e) { err = (e && e.message) || String(e) } }
    if (day && !day.items.length) return quietReceipt(r, m, '今天 arXiv 没有新表（周末或美国假日）')
    if (day && !manual && readDay(m.dir, day.date) && readTriage(m.dir, day.date)) return quietReceipt(r, m, `${day.date} 的表已经过过了`)
    let prompt
    if (day) {
      saveDay(m.dir, day)
      const fresh = day.items.filter((p) => p.type === 'new' || p.type === 'cross')
      const updated = day.items.filter((p) => p.type !== 'new' && p.type !== 'cross')
      writeFileSync(join(m.dir, DAILY_DIR, day.date + '.标题.txt'), titleLines(fresh) + '\n')
      writeFileSync(join(m.dir, DAILY_DIR, day.date + '.更新.txt'), titleLines(updated) + '\n')
      const count = (t) => day.items.filter((p) => p.type === t).length
      const lines = titleLines(fresh)
      prompt = [
        `（例行《${r.title}》。以下是 MyWork 替用户准备好的，用户看不到。）`,
        `程序取到了 ${day.date} 的 arXiv 全表（${day.cats.join(', ')}）：${day.items.length} 篇 —— 新 ${count('new')} · 交叉 ${count('cross')} · 更新 ${count('replace') + count('replace-cross')}。`,
        `- 新和交叉的 ${fresh.length} 篇${lines.length <= INLINE_TITLES ? '标题就在下面' : `标题在 ${DAILY_DIR}/${day.date}.标题.txt`}：逐行看完，一篇不跳。`,
        `- 摘要在 ${DAILY_DIR}/${day.date}.json（items[]：id / title / authors / abstract / cats / type），标题拿不准的去读摘要。`,
        `- 更新的 ${updated.length} 篇在 ${DAILY_DIR}/${day.date}.更新.txt，只看 ${FAVS_FILE} 和知识库里出现过的。`,
        `按 AGENTS.md 的「怎么过表」写 ${triagePath(day.date)}（论文一律写 arXiv 号），然后回话：必读的标题各一句话，最后一行写过了多少篇。不要用 deliver，这份在右边的列表里。`,
        r.input ? '用户订阅时说的：' + r.input : '',
        lines.length <= INLINE_TITLES ? '\n新和交叉的标题：\n' + lines : '',
      ].filter(Boolean).join('\n')
    } else {
      const date = dayOf(now())
      prompt = [
        `（例行《${r.title}》。以下是 MyWork 替用户附上的，用户看不到。）`,
        `程序这次没取到 arXiv 的表：${err}。`,
        cats.length ? `用浏览器打开 ${cats.map((c) => 'https://arxiv.org/list/' + c + '/new').join('、')} 自己过一遍，照 AGENTS.md 写 ${triagePath(date)}；` : '先请用户告诉你要看哪几个分类，写进 AGENTS.md；',
        '做不了就一句话告诉用户原因。',
      ].join('\n')
    }
    const run = store.create({ mateId: m.id, trigger: 'routine', routineId: r.id, routineTitle: r.title, input: r.input })
    store.update(run.id, { prompt })
    routines.ran(r.id, { taskId: run.id })
    emit('queued', store.get(run.id))
    pump()
    return run.id
  }
  function quietReceipt(r, m, text) {
    const run = postLine(m.id, text, { routineId: r.id, routineTitle: r.title, input: r.input, quiet: true })
    routines.ran(r.id, { taskId: run.id, changed: false, settledAt: run.finishedAt })
    return run.id
  }

  /** GET /mates/papers: one day's whole list in arXiv's order, the teammate's picks marked, what went to the 知识库. */
  function papersView(id, date) {
    const m = mateWith(id, 'papers')
    const days = savedDays(m.dir)
    const d = date && days.includes(String(date)) ? String(date) : days[0] || ''
    const cats = categoriesOf(readText(join(m.dir, 'AGENTS.md')))
    if (!d) return { days, date: '', cats, items: [], counts: {}, triage: '', wiki: !!wikiMate() }
    const day = readDay(m.dir, d) || { items: [] }
    const triage = readTriage(m.dir, d)
    const picks = picksOf(triage)
    const favs = readText(join(m.dir, FAVS_FILE))
    const counts = {}
    for (const p of day.items) counts[p.type] = (counts[p.type] || 0) + 1
    const shortAuthors = (s) => { const a = String(s || '').split(/,\s*/); return a.length > 3 ? a.slice(0, 3).join(', ') + ' 等' : a.join(', ') }
    return {
      days: days.slice(0, 14), date: d, cats: day.cats || cats, counts, triage: triage ? triagePath(d) : '', wiki: !!wikiMate(),
      items: day.items.map((p) => ({ id: p.id, title: p.title, authors: shortAuthors(p.authors), cats: (p.cats || []).slice(0, 3), type: p.type, typeWord: TYPE_WORDS[p.type] || p.type, pick: picks.get(p.id) || '', handed: favs.includes('[' + p.id + ']') })),
    }
  }
  function paperItem(id, date, pid) {
    const m = mateWith(id, 'papers')
    const day = readDay(m.dir, String(date || ''))
    const p = day && day.items.find((x) => x.id === String(pid || ''))
    if (!p) throw notFound('没有这篇。')
    return { ...p, pdf: 'https://arxiv.org/pdf/' + p.id }
  }
  /** The 知识库 a paper goes to: the most recently active teammate made from the wiki template. */
  function wikiMate() {
    const list = mates.items.filter((x) => x.template === 'wiki')
    if (!list.length) return null
    const lastOf = (x) => { const runs = store.forMate(x.id); return runs.length ? runs[runs.length - 1].createdAt : x.createdAt }
    return list.sort((a, b) => String(lastOf(b)).localeCompare(String(lastOf(a))))[0]
  }
  /** POST /mates/papers/wiki: the paper's abstract into the 知识库's 原始资料/, a line in 收藏.md, and a run there to take it in. */
  function handToWiki(id, date, pid) {
    const m = mateWith(id, 'papers')
    const p = paperItem(id, date, pid)
    const w = wikiMate()
    if (!w) throw bad('还没有知识库同事：在「新同事」里从模板建一个，收进来的论文会交给它。')
    const tp = tplOf(w)
    const drop = (tp && tp.dropDir) || '原始资料'
    mkdirSync(join(w.dir, drop), { recursive: true })
    const rel = `${drop}/arXiv-${p.id.replace(/\//g, '_')}.md`
    if (!existsSync(join(w.dir, rel))) {
      writeFileSync(join(w.dir, rel), [`来源：https://arxiv.org/abs/${p.id}`, `PDF：https://arxiv.org/pdf/${p.id}`, `取得：${dayOf(now())}（${m.name || '每日论文'}转来，arXiv ${date} 的表）`, '', `# ${p.title}`, '', `作者：${p.authors}`, `分类：${(p.cats || []).join(', ')}`, '', '## 摘要', '', p.abstract || '（没有摘要）', ''].join('\n'))
    }
    const favs = join(m.dir, FAVS_FILE)
    if (!existsSync(favs)) writeFileSync(favs, '# 收藏\n\n你收进知识库的论文，越往下越新（程序记；它把这些当作你现在的兴趣）。\n\n')
    if (!readText(favs).includes('[' + p.id + ']')) appendFileSync(favs, `- ${dayOf(now())} [${p.id}] ${p.title}\n`)
    const run = store.create({ mateId: w.id, trigger: 'user', input: `收进知识库：${rel}（${p.title}）。摘要已经存好，值得的话打开 PDF 读全文再收。`, source: 'mate' })
    store.update(run.id, { fromMate: m.id })
    emit('queued', store.get(run.id))
    pump()
    return { wiki: { id: w.id, name: w.name || '知识库' }, path: rel, runId: run.id }
  }

  // ── 实验 ──
  /** 'HH:MM' → the next time the clock shows it; minutes → that long from now. */
  function untilOf({ until, minutes }) {
    const t = now()
    if (Number(minutes) > 0) return new Date(t.getTime() + Math.min(Number(minutes), 72 * 60) * 60000).toISOString()
    const m = String(until || '').match(/^(\d{1,2})[:：](\d{2})$/)
    if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) throw bad('until 写成 HH:MM，比如 07:00。')
    const d = new Date(t)
    d.setHours(Number(m[1]), Number(m[2]), 0, 0)
    if (d.getTime() <= t.getTime()) d.setDate(d.getDate() + 1)
    return d.toISOString()
  }
  const loopView = (m) => (m.loop && m.loop.active ? { until: m.loop.until, rounds: m.loop.rounds, startedAt: m.loop.startedAt, idle: m.loop.idle } : null)
  function startLoop(m, until) {
    const rows = readLedger(m.dir).rows.length
    const prev = m.loop && m.loop.active ? m.loop : null
    const loop = prev ? { ...prev, until } : { id: 'lp-' + now().getTime().toString(36), active: true, until, startedAt: now().toISOString(), rounds: 0, idle: 0, errors: 0, rowsAtStart: rows, lastRows: rows }
    mates.update(m.id, { loop })
    emit('mate', null, { mateId: m.id })
    return loop
  }
  function finishLoop(m, why) {
    const L = m.loop
    if (!L || !L.active) return false
    const at = now().toISOString()
    mates.update(m.id, { loop: { ...L, active: false, endedAt: at, why } })
    const { rows, dir, metric } = readLedger(m.dir)
    postLine(m.id, `连续跑结束（${why}）：${hhmm(L.startedAt)}–${hhmm(at)}，${L.rounds} 轮。${ledgerLine(summarize(rows, dir, L.rowsAtStart), metric)}`, { patch: { loopEnd: L.id } })
    emit('mate', null, { mateId: m.id })
    return true
  }
  /** After each turn (and on the scheduler tick): the next round, unless it is time, it is idle, or someone else has the turn. */
  function continueLoop(mateId) {
    const m = mates.get(mateId)
    const L = m && m.loop
    if (!L || !L.active) return
    const runs = store.forMate(mateId)
    if (runs.some((r) => r.status === 'queued' || r.status === 'running' || r.status === 'waiting')) return
    const last = [...runs].reverse().find((r) => r.status === 'done' && !r.loopEnd)
    if (last && last.stopped) return finishLoop(m, '你停下了')
    const rows = readLedger(m.dir).rows.length
    const idle = rows > L.lastRows ? 0 : (L.idle || 0) + 1
    const errors = last && last.error && last.loop === L.id ? (L.errors || 0) + 1 : 0
    if (now().getTime() >= Date.parse(L.until)) return finishLoop(m, '到点了')
    if (errors >= 2) return finishLoop(m, '连续出错：' + String(last.error).slice(0, 60))
    if (idle >= LOOP_IDLE) return finishLoop(m, `连续 ${LOOP_IDLE} 轮没有新结果`)
    if (L.rounds >= LOOP_MAX) return finishLoop(m, `跑满 ${LOOP_MAX} 轮`)
    const n = (L.rounds || 0) + 1
    mates.update(mateId, { loop: { ...L, rounds: n, idle, errors, lastRows: rows } })
    const { rows: all, dir, metric } = readLedger(m.dir)
    const run = store.create({ mateId, trigger: 'system', input: '' })
    store.update(run.id, {
      loop: L.id, loopRound: n,
      prompt: [
        `（连续跑 · 第 ${n} 轮 · 到 ${hhmm(L.until)} 为止。这句话是 MyWork 替用户发的，用户看不到。）`,
        '接着做下一个实验：先看 PROGRESS.md 的「下一步」和 results.tsv 的最后几行，挑一个改动，照 program.md 做完一次实验并记账（results.tsv 加一行，PROGRESS.md 更新），然后结束这一轮，回一句话：试了什么、结果、留还是丢。',
        '不要问要不要继续，不要说「明天再说」，不要停下来写总结：下一轮程序会再叫你，到点它自己停。没有思路时去读代码里引用的论文、把差一点成功的改动组合起来、试更大胆的结构。',
        idle ? `（上一轮没有往 results.tsv 加行；连续 ${LOOP_IDLE} 轮没有新结果程序就会停下。卡住了就在这一轮把原因写进 PROGRESS.md。）` : '',
        `今晚到现在：${ledgerLine(summarize(all, dir, L.rowsAtStart), metric)}`,
      ].filter(Boolean).join('\n'),
    })
    emit('queued', store.get(run.id))
    pump()
  }
  /** The routine with `loopUntil`: its run is round one, and the loop starts with it. */
  function startLoopRoutine(r, m) {
    const until = untilOf({ until: r.loopUntil })
    const loop = startLoop(m, until)
    const { rows, dir, metric } = readLedger(m.dir)
    const run = store.create({ mateId: m.id, trigger: 'routine', routineId: r.id, routineTitle: r.title, input: r.input })
    store.update(run.id, {
      loop: loop.id, loopRound: 0,
      prompt: [
        `（例行《${r.title}》。这句话是 MyWork 替用户发的，用户看不到。）今晚连续跑实验，到 ${hhmm(until)} 为止：程序会一轮接一轮地叫你，每轮做一个实验。`,
        '这是第一轮：先确认代码和机器能跑（GPU 空闲、上次的改动已经提交或回退），再照 program.md 做第一个实验并记账，然后结束这一轮，回一句话。',
        r.input,
        `到现在：${ledgerLine(summarize(rows, dir), metric)}`,
      ].filter(Boolean).join('\n'),
    })
    routines.ran(r.id, { taskId: run.id })
    emit('queued', store.get(run.id))
    pump()
    return run.id
  }
  /** The routine with `prep: 'ledger'` (实验早报): the numbers from results.tsv go in first. */
  function ledgerFacts(m) {
    const { rows, dir, metric } = readLedger(m.dir)
    const L = m.loop
    const night = L && L.endedAt && now().getTime() - Date.parse(L.endedAt) < 16 * 3600000 ? summarize(rows, dir, L.rowsAtStart) : null
    const all = summarize(rows, dir)
    const table = all.last.map((x) => `${x.n}\t${x.commit}\t${x.metric === null ? '—' : x.metric}\t${x.status}\t${x.description}`).join('\n')
    return ['程序从 results.tsv 算好的（以这些数字为准）：', night ? `- 昨晚的连续跑（${hhmm(L.startedAt)}–${hhmm(L.endedAt)}，${L.rounds} 轮，${L.why}）：${ledgerLine(night, metric)}` : '- 昨晚没有连续跑。', `- 全部：${ledgerLine(all, metric)}`, table ? '- 最近几次（序号 / commit / 指标 / 状态 / 说明）：\n' + table : ''].filter(Boolean).join('\n')
  }
  /** GET /mates/ledger: the 实验 panel — best so far, counts, the best-so-far line, the latest rows, the loop. */
  function ledgerView(id) {
    const m = mateWith(id, 'experiments')
    const { rows, dir, metric } = readLedger(m.dir)
    const s = summarize(rows, dir)
    const step = Math.max(1, Math.ceil(rows.length / 240))
    return {
      metric, dir, total: s.total, keep: s.keep, discard: s.discard, crash: s.crash, best: s.best, baseline: s.baseline, last: s.last,
      points: rows.filter((r, i) => i % step === 0 || r.status === 'keep').map((r) => ({ n: r.n, metric: r.metric, status: r.status })),
      frontier: s.frontier, loop: loopView(m), lastLoop: m.loop && !m.loop.active && m.loop.endedAt ? { startedAt: m.loop.startedAt, endedAt: m.loop.endedAt, rounds: m.loop.rounds, why: m.loop.why } : null,
      files: ['program.md', 'PROGRESS.md', 'results.tsv'].filter((x) => existsSync(join(m.dir, x))),
    }
  }
  function loopAction(b) {
    const m = mateWith(b && b.id, 'experiments')
    if (b.stop) { finishLoop(m, '你停下了'); return { loop: null } }
    const loop = startLoop(m, untilOf(b))
    continueLoop(m.id)
    return { loop: loopView(mates.get(m.id)) || loop }
  }

  // ── 代码研究 ──
  function projectsView(id) {
    const m = mateWith(id, 'projects')
    const items = scanProjects(m.dir)
    return { items, counts: { doing: items.filter((x) => x.state === 'doing').length, unreviewed: items.filter((x) => x.state === 'unreviewed').length, reviewed: items.filter((x) => x.state === 'reviewed').length } }
  }
  function review(id, folder) {
    const m = mateWith(id, 'projects')
    try { markReviewed(m.dir, folder, dayOf(now())) } catch (e) { throw bad(e.message) }
    emit('mate', null, { mateId: m.id })
    return projectsView(id)
  }

  // ── 论文 ──
  const checking = new Map()
  /** 论点.md's table: | claim | 证据 | 局限 | 状态 |. */
  function claimsOf(text) {
    const out = []
    for (const line of String(text || '').split('\n')) {
      if (!/^\s*\|/.test(line) || /^\s*\|[\s:|-]+\|\s*$/.test(line)) continue
      const c = line.trim().replace(/^\||\|$/g, '').split('|').map((x) => x.trim())
      if (!c[0] || /^(claim|论点|编号|#)$/i.test(c[0]) || /^(claim|论点)$/i.test(c[1] || '')) continue
      const lead = /^[A-Z]?\d+$/.test(c[0]) ? c.slice(1) : c
      out.push({ claim: lead[0] || '', evidence: lead[1] || '', limits: lead[2] || '', status: lead[3] || '' })
    }
    return out.slice(0, 20)
  }
  function paperView(id) {
    const m = mateWith(id, 'paper')
    const draft = readDraft(m.dir)
    const last = lastCheck(m.dir)
    const problems = last ? [...last.entries.filter((e) => e.status === 'missing' || e.status === 'mismatch' || e.status === 'pending'), ...(last.undefinedKeys || []).map((u) => ({ key: u.key, status: 'undefined', title: '', why: '引用了却不在 .bib 里' }))].slice(0, 40).map((e) => ({ key: e.key, status: e.status, word: e.status === 'undefined' ? '不在 .bib 里' : statusWord(e.status), title: e.title || '', why: e.status === 'mismatch' ? (e.diffs || []).join('、') + '不符' : e.why || '' })) : []
    return {
      claims: claimsOf(readText(join(m.dir, '论点.md'))), files: draft.files, entries: draft.entries.length, cites: draft.cites.length,
      check: last ? { date: last.date, counts: last.counts, report: '核引用/' + last.date + '.md', problems } : null,
      checking: checking.has(m.id),
    }
  }
  async function citeCheck(m) {
    if (checking.has(m.id)) return checking.get(m.id)
    const job = (async () => {
      const draft = readDraft(m.dir)
      if (!draft.entries.length) return { empty: true, files: draft.files }
      const res = await checkEntries(draft.entries, draft.cites, { fetch: doFetch })
      const paths = saveCheck(m.dir, dayOf(now()), res)
      return { ...paths, counts: res.counts, files: draft.files }
    })()
    checking.set(m.id, job)
    emit('mate', null, { mateId: m.id })
    try { return await job } finally { checking.delete(m.id); emit('mate', null, { mateId: m.id }) }
  }

  // ── wiring ──
  /** runRoutine's hook: true when the bench took the routine (its run comes now or after code has prepared it). */
  function runRoutine(r, mateId, opts = {}) {
    const m = mates.get(mateId)
    if (!m) return null
    if (r.loopUntil) return { runId: startLoopRoutine(r, m) }
    if (r.prep === 'arxiv') {
      if (preparing.has(r.id)) return { runId: '', preparing: true }
      preparing.add(r.id)
      prepArxiv(r, m, !!opts.manual).catch((e) => log(`arxiv ${r.id}: ${e && e.message}`)).finally(() => preparing.delete(r.id))
      return { runId: '', preparing: true }
    }
    return null
  }
  /** Extra prompt lines for a routine run (after routinePrompt), or ''. */
  function routineFacts(r, m) { return r.prep === 'ledger' ? '\n\n' + ledgerFacts(m) : '' }
  const isPreparing = (routineId) => preparing.has(routineId)

  const tools = [
    {
      name: 'mywork_loop',
      description: '连续干到某个时间：程序会一轮接一轮地叫你接着做，到点才停，你不用自己判断要不要继续（实验同事用）。用户说「跑到明早 7 点」「接着跑一晚上」「再跑两个小时」时调用；用户说停就传 stop: true。调用后照常做完这一轮再结束。',
      parameters: {
        until: { type: 'string', description: '到几点停，HH:MM（今天或明天的这个时间）' },
        minutes: { type: 'number', description: '或者：再跑多少分钟' },
        stop: { type: 'boolean', description: 'true 就停下连续跑' },
      },
      bench: 'experiments',
      execute(args, m) {
        if (args.stop) return { stopped: finishLoop(m, '你停下了') }
        const loop = startLoop(m, untilOf(args))
        return { until: loop.until, untilLocal: hhmm(loop.until) }
      },
      render: (_a, v) => [{ type: 'text', text: v.stopped !== undefined ? '连续跑已停下。' : `好的，程序会一轮接一轮地叫你，到 ${v.untilLocal} 为止。这一轮照常做完一个实验、记账，然后结束这一轮。` }],
    },
    {
      name: 'mywork_cite_check',
      description: '核引用（论文同事用）：程序把 稿子/ 里每条参考文献到 arXiv 和 Crossref 查一遍，看存在不存在、标题 / 第一作者 / 年份对不对，并找出每条引用所在的句子；写成 核引用/日期.md 和 .json。投稿前、改过参考文献后用；查一次要几十秒。',
      parameters: {},
      bench: 'paper',
      async execute(_args, m) { return citeCheck(m) },
      render: (_a, v) => [{ type: 'text', text: v.empty ? `稿子/ 里没有 .bib（看到的文件：${(v.files || []).join('、') || '无'}）。请用户把 .bib 和稿子放进 稿子/。` : `程序查完了：${v.counts.total} 条 —— 核实 ${v.counts.ok} · 元数据不符 ${v.counts.mismatch} · 查无此文 ${v.counts.missing} · 待查 ${v.counts.pending} · 网页或软件 ${v.counts.web}${v.counts.undefined ? ' · 不在 .bib 里 ' + v.counts.undefined : ''}。报告在 ${v.md}，明细（含查到的摘要和每条引用的原句）在 ${v.json}。接下来照 AGENTS.md 的「核引用」做：对每条引用判断查到的文献是否支持原句（支持 / 弱 / 不支持）；元数据不符的直接改 .bib；查无此文、不支持、要换或删的列给用户拍板；判断写进报告末尾「## 是否支持原句」一节。待查的不算查无。` }],
    },
  ]

  const routes = {
    '/mates/papers': { GET: (q) => papersView(q.get('id'), q.get('date')) },
    '/mates/papers/item': { GET: (q) => paperItem(q.get('id'), q.get('date'), q.get('pid')) },
    '/mates/papers/wiki': { POST: (_q, b) => handToWiki(b.id, b.date, b.pid) },
    '/mates/ledger': { GET: (q) => ledgerView(q.get('id')) },
    '/mates/loop': { POST: (_q, b) => loopAction(b) },
    '/mates/projects': { GET: (q) => projectsView(q.get('id')) },
    '/mates/projects/review': { POST: (_q, b) => review(b.id, b.folder) },
    '/mates/paper': { GET: (q) => paperView(q.get('id')) },
  }

  return { benchOf, runRoutine, routineFacts, isPreparing, continueLoop, finishLoop, loopView, tools, routes, papersView, handToWiki, ledgerView, projectsView, paperView, citeCheck, prepArxiv }
}
