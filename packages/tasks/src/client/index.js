/**
 * dsh-mywork-tasks — browser half (CommonJS; wrapped by scripts/build-client.mjs with
 * src/md.cjs and client-icons.cjs inlined as preludes).
 *
 * Pages (main slot + sidebar.panellist):
 *   mywork-today  今日：输入框（一句话即任务）、场景示例、进行中的任务、今天的交付物
 *   mywork-tasks  任务：全部任务；点开一条看步骤、交付物、失败原因；再来一次 / 取消 / 过程
 *
 * State is one module-level store polled from /mywork-tasks/api (3 s while anything runs,
 * 20 s otherwise, and on focus). No dsh conversation concepts appear on these pages; the
 * session behind a task is reachable only through 「过程」.
 */
'use strict'

const React = require('react')
const md = require('./md.cjs')
const { icon } = require('./client-icons.cjs')

const h = React.createElement
const PLUGIN = 'dsh-mywork-tasks'
const NS = 'mywork.tasks'
const API = '/mywork-tasks/api'
const TODAY_PANEL = 'mywork-today'
const TASKS_PANEL = 'mywork-tasks'
const FAST_MS = 3000
const SLOW_MS = 20000

const zh = {
  today: '今日', tasks: '任务', ask: '说一个你要的结果', hint: '回车创建任务，Shift + 回车换行。任务在后台完成，交付物会出现在这里。',
  running: '进行中', doneToday: '今天完成', none: '还没有任务。', noneRunning: '现在没有在跑的任务。', noneDeliverables: '今天还没有完成的任务。',
  all: '全部', active: '进行中', finished: '已完成', back: '返回', rerun: '再来一次', cancel: '取消', process: '过程', steps: '步骤', deliverables: '交付物',
  failed: '失败', queued: '排队', input: '你说的', elapsed: '用时', noSteps: '还没有开始。', scenario: '场景', create: '创建任务', creating: '创建中…',
  open: '打开', ratingGood: '有用', ratingBad: '没用', none2: '无',
}
const en = {
  today: 'Today', tasks: 'Tasks', ask: 'Say what you want done', hint: 'Enter creates a task, Shift + Enter for a new line. Tasks run in the background and deliverables show up here.',
  running: 'In progress', doneToday: 'Finished today', none: 'No tasks yet.', noneRunning: 'Nothing is running.', noneDeliverables: 'Nothing finished today.',
  all: 'All', active: 'Active', finished: 'Finished', back: 'Back', rerun: 'Run again', cancel: 'Cancel', process: 'Process', steps: 'Steps', deliverables: 'Deliverables',
  failed: 'Failed', queued: 'Queued', input: 'Your request', elapsed: 'Elapsed', noSteps: 'Not started yet.', scenario: 'Scenario', create: 'Create task', creating: 'Creating…',
  open: 'Open', ratingGood: 'Useful', ratingBad: 'Not useful', none2: 'none',
}

const STYLE = `
.mwt{--mwt-fg:var(--dsw-alias-label-primary);--mwt-fg2:var(--dsw-alias-label-secondary);--mwt-line:var(--dsw-alias-border-l2);--mwt-bg:var(--dsw-alias-bg-layer-1);--mwt-bg2:var(--dsw-alias-bg-layer-2);--mwt-accent:var(--dsw-alias-brand-primary);--mwt-err:var(--dsw-alias-state-error-primary);--mwt-hover:var(--dsw-alias-interactive-bg-hover);height:100%;overflow:auto;color:var(--mwt-fg);font-size:14px;line-height:22px}
.mwt *{box-sizing:border-box}
.mwt-page{max-width:820px;margin:0 auto;padding:36px 28px 64px}
.mwt-title{display:flex;align-items:baseline;gap:12px;margin:0 0 20px}
.mwt-title h1{margin:0;font-size:22px;line-height:30px;font-weight:600}
.mwt-title span{color:var(--mwt-fg2);font-size:13px}
.mwt-ask{border:1px solid var(--mwt-line);border-radius:14px;background:var(--mwt-bg);padding:12px 14px 10px;transition:border-color 120ms}
.mwt-ask:focus-within{border-color:var(--mwt-accent)}
.mwt-ask textarea{display:block;width:100%;min-height:52px;max-height:200px;resize:none;border:0;outline:0;background:transparent;color:inherit;font:inherit;padding:0}
.mwt-ask-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px}
.mwt-ask-row small{color:var(--mwt-fg2);font-size:12px}
.mwt-btn{appearance:none;display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border:1px solid var(--mwt-line);border-radius:8px;background:var(--mwt-bg);color:var(--mwt-fg);font:inherit;font-size:13px;cursor:pointer}
.mwt-btn:hover{background:var(--mwt-hover)}
.mwt-btn[disabled]{opacity:.5;cursor:default}
.mwt-btn.primary{background:var(--mwt-accent);border-color:var(--mwt-accent);color:#fff}
.mwt-btn.primary:hover{filter:brightness(1.05)}
.mwt-chips{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 0}
.mwt-chip{appearance:none;border:1px solid var(--mwt-line);border-radius:999px;background:transparent;color:var(--mwt-fg2);padding:4px 12px;font:inherit;font-size:13px;line-height:20px;cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-chip:hover{color:var(--mwt-fg);background:var(--mwt-hover)}
.mwt-chip[data-on=true]{color:var(--mwt-fg);border-color:var(--mwt-fg2)}
.mwt-section{margin-top:32px}
.mwt-section h2{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-size:13px;font-weight:600;color:var(--mwt-fg2);text-transform:none}
.mwt-empty{color:var(--mwt-fg2);font-size:13px;padding:6px 0}
.mwt-cards{display:grid;gap:8px}
.mwt-card{display:grid;grid-template-columns:20px minmax(0,1fr) auto;align-items:start;column-gap:10px;padding:12px 14px;border:1px solid var(--mwt-line);border-radius:12px;background:var(--mwt-bg);cursor:pointer;text-align:left;font:inherit;color:inherit;width:100%}
.mwt-card:hover{background:var(--mwt-hover)}
.mwt-card-title{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-card-sub{color:var(--mwt-fg2);font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-card-sub.err{color:var(--mwt-err)}
.mwt-card-meta{color:var(--mwt-fg2);font-size:12px;white-space:nowrap;padding-top:2px;font-variant-numeric:tabular-nums}
.mwt-dot{display:inline-flex;width:20px;height:22px;align-items:center;justify-content:center;color:var(--mwt-fg2)}
.mwt-dot[data-s=running] svg,.mwt-dot[data-s=delivering] svg,.mwt-dot[data-s=verifying] svg{animation:mwt-spin 1.2s linear infinite;color:var(--mwt-accent)}
.mwt-dot[data-s=ok]{color:var(--mwt-accent)}
.mwt-dot[data-s=err]{color:var(--mwt-err)}
@keyframes mwt-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.mwt-dot svg{animation:none!important}}
.mwt-toolbar{display:flex;align-items:center;gap:8px;margin:0 0 16px}
.mwt-toolbar .grow{flex:1}
.mwt-detail-head{display:flex;align-items:flex-start;gap:12px;margin:0 0 18px}
.mwt-detail-head h1{flex:1;margin:0;font-size:20px;line-height:28px;font-weight:600}
.mwt-actions{display:flex;gap:8px;flex-wrap:wrap}
.mwt-kv{display:grid;grid-template-columns:auto 1fr;column-gap:16px;row-gap:4px;font-size:13px;margin:0 0 18px}
.mwt-kv dt{color:var(--mwt-fg2);margin:0}
.mwt-kv dd{margin:0;white-space:pre-wrap;word-break:break-word}
.mwt-steps{list-style:none;margin:0;padding:0;border-left:2px solid var(--mwt-line);margin-left:6px}
.mwt-steps li{position:relative;padding:2px 0 2px 16px;display:flex;gap:12px;align-items:baseline;font-size:13px}
.mwt-steps li::before{content:"";position:absolute;left:-5px;top:11px;width:8px;height:8px;border-radius:50%;background:var(--mwt-fg2)}
.mwt-steps li[data-live=true]::before{background:var(--mwt-accent)}
.mwt-steps li .name{min-width:0;flex:1}
.mwt-steps li .time{color:var(--mwt-fg2);font-variant-numeric:tabular-nums}
.mwt-error{border:1px solid var(--mwt-err);border-radius:10px;padding:10px 12px;color:var(--mwt-err);font-size:13px;margin:0 0 18px;white-space:pre-wrap}
.mwt-doc{border:1px solid var(--mwt-line);border-radius:12px;background:var(--mwt-bg);padding:18px 22px;margin:0 0 12px}
.mwt-doc-head{display:flex;align-items:center;gap:10px;margin:0 0 8px}
.mwt-doc-head h3{flex:1;margin:0;font-size:15px;font-weight:600}
.mwt-doc-head small{color:var(--mwt-fg2);font-size:12px}
.mwt-md{font-size:14px;line-height:1.7}
.mwt-md h2,.mwt-md h3,.mwt-md h4{margin:18px 0 6px;font-weight:600;line-height:1.4}
.mwt-md h2{font-size:17px}.mwt-md h3{font-size:15px}.mwt-md h4{font-size:14px}
.mwt-md p{margin:0 0 10px}.mwt-md ul,.mwt-md ol{margin:0 0 10px;padding-left:22px}
.mwt-md code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;background:var(--mwt-bg2);padding:1px 5px;border-radius:4px}
.mwt-md pre{background:var(--mwt-bg2);border-radius:8px;padding:10px 12px;overflow:auto;margin:0 0 10px}.mwt-md pre code{background:transparent;padding:0}
.mwt-md table{border-collapse:collapse;margin:0 0 12px;font-size:13px}.mwt-md th,.mwt-md td{border:1px solid var(--mwt-line);padding:4px 10px;text-align:left}
.mwt-md blockquote{margin:0 0 10px;padding:2px 12px;border-left:3px solid var(--mwt-line);color:var(--mwt-fg2)}
.mwt-md hr{border:0;border-top:1px solid var(--mwt-line);margin:14px 0}
.mwt-md a{color:var(--mwt-accent)}
`

// ---- state ------------------------------------------------------------------
// `state` is replaced, never mutated: useSyncExternalStore compares snapshots by identity.
let state = { items: [], scenarios: [], loadedAt: 0, error: '' }
const listeners = new Set()
function setState(patch) { state = { ...state, ...patch }; for (const fn of listeners) fn() }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function getSnapshot() { return state }
async function api(path, body) {
  const res = await fetch(API + path, body === undefined ? { method: 'GET' } : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.error) throw new Error(data.error || ('HTTP ' + res.status))
  return data
}
let refreshing = null
function refresh() {
  if (refreshing) return refreshing
  refreshing = api('/tasks').then((d) => { setState({ items: d.items || [], scenarios: d.scenarios || [], error: '', loadedAt: Date.now() }) })
    .catch((e) => { setState({ error: e.message || String(e) }) }).finally(() => { refreshing = null })
  return refreshing
}
let pollTimer = null
let pollUsers = 0
function schedulePoll() {
  clearTimeout(pollTimer)
  if (pollUsers <= 0) return
  const active = state.items.some((t) => t.status !== 'done')
  pollTimer = setTimeout(() => { refresh().then(schedulePoll) }, active ? FAST_MS : SLOW_MS)
}
function usePolling() {
  React.useEffect(() => {
    pollUsers += 1
    refresh().then(schedulePoll)
    const onFocus = () => { refresh().then(schedulePoll) }
    window.addEventListener('focus', onFocus)
    return () => { pollUsers -= 1; window.removeEventListener('focus', onFocus); if (pollUsers <= 0) clearTimeout(pollTimer) }
  }, [])
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
// the same clock for every elapsed counter
function useTick(on) {
  const [, set] = React.useState(0)
  React.useEffect(() => { if (!on) return; const id = setInterval(() => set((n) => n + 1), 1000); return () => clearInterval(id) }, [on])
}

// ---- helpers ----------------------------------------------------------------
function fmtDuration(ms) {
  if (!(ms > 0)) return '0s'
  const s = Math.round(ms / 1000)
  if (s < 60) return s + 's'
  const m = Math.floor(s / 60)
  if (m < 60) return m + 'm ' + (s % 60) + 's'
  return Math.floor(m / 60) + 'h ' + (m % 60) + 'm'
}
function elapsedOf(t) {
  const start = t.startedAt || t.createdAt
  const end = t.finishedAt || new Date().toISOString()
  return fmtDuration(new Date(end) - new Date(start))
}
function fmtTime(iso) { if (!iso) return ''; const d = new Date(iso); return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
function fmtDate(iso) { if (!iso) return ''; const d = new Date(iso); return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + fmtTime(iso) }
function isToday(iso) { if (!iso) return false; const d = new Date(iso); const n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate() }
function visual(t) { return t.status !== 'done' ? t.status : t.error ? 'err' : 'ok' }
function StatusDot({ task }) {
  const v = visual(task)
  const name = v === 'ok' ? 'circle-check' : v === 'err' ? 'circle-x' : v === 'queued' ? 'history' : 'loader'
  return h('span', { className: 'mwt-dot', 'data-s': v, title: task.statusLabel }, icon(name, { size: 16 }))
}
function openSession(sessionId) {
  if (!sessionId) return
  try { window.dispatchEvent(new CustomEvent('mywork:open-session', { detail: { sessionId } })) } catch {}
}
function Markdown({ text }) {
  const html = React.useMemo(() => md.render(text || ''), [text])
  return h('div', { className: 'mwt-md', dangerouslySetInnerHTML: { __html: html } })
}

// ---- components -------------------------------------------------------------
function makeComponents(ctx, t) {
  const selectPanel = (id) => { if (ctx.layout && typeof ctx.layout.selectPanel === 'function') ctx.layout.selectPanel(id) }

  function TaskCard({ task, onOpen }) {
    const live = task.status !== 'done'
    const sub = live ? (task.currentStep || task.statusLabel) : task.error ? (t('failed') + ' · ' + task.error) : (task.summary || (task.deliverables[0] && task.deliverables[0].title) || '')
    return h('button', { type: 'button', className: 'mwt-card', onClick: () => onOpen(task.id) },
      h(StatusDot, { task }),
      h('span', null, h('div', { className: 'mwt-card-title' }, task.title), h('div', { className: 'mwt-card-sub' + (task.error ? ' err' : '') }, sub)),
      h('span', { className: 'mwt-card-meta' }, live ? elapsedOf(task) : fmtTime(task.finishedAt)))
  }

  function Ask({ scenarios, onCreated }) {
    const [text, setText] = React.useState('')
    const [scenario, setScenario] = React.useState('general')
    const [busy, setBusy] = React.useState(false)
    const [err, setErr] = React.useState('')
    const ref = React.useRef(null)
    const current = scenarios.find((s) => s.id === scenario) || scenarios[0] || null
    const submit = async () => {
      const input = text.trim()
      if (!input || busy) return
      setBusy(true); setErr('')
      try { await api('/create', { input, scenario }); setText(''); await refresh(); schedulePoll(); if (onCreated) onCreated() } catch (e) { setErr(e.message || String(e)) } finally { setBusy(false) }
    }
    const grow = () => { const el = ref.current; if (!el) return; el.style.height = 'auto'; el.style.height = Math.min(200, el.scrollHeight) + 'px' }
    React.useEffect(grow, [text])
    return h('div', null,
      h('div', { className: 'mwt-ask' },
        h('textarea', { ref, value: text, placeholder: t('ask'), rows: 2, onChange: (e) => setText(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } } }),
        h('div', { className: 'mwt-ask-row' }, h('small', null, err || t('hint')), h('button', { type: 'button', className: 'mwt-btn primary', disabled: busy || !text.trim(), onClick: submit }, busy ? t('creating') : t('create')))),
      scenarios.length > 1 ? h('div', { className: 'mwt-chips' }, scenarios.map((s) => h('button', { key: s.id, type: 'button', className: 'mwt-chip', 'data-on': s.id === scenario, onClick: () => setScenario(s.id) }, s.label))) : null,
      current && current.examples.length ? h('div', { className: 'mwt-chips' }, current.examples.map((ex) => h('button', { key: ex, type: 'button', className: 'mwt-chip', title: ex, onClick: () => { setText(ex); if (ref.current) ref.current.focus() } }, ex))) : null)
  }

  function TodayPage() {
    const s = usePolling()
    const active = s.items.filter((x) => x.status !== 'done')
    useTick(active.length > 0)
    const todayDone = s.items.filter((x) => x.status === 'done' && isToday(x.finishedAt))
    const openTask = (id) => { pendingOpen = id; selectPanel(TASKS_PANEL) }
    const today = new Date()
    return h('div', { className: 'mwt' }, h('style', null, STYLE), h('div', { className: 'mwt-page' },
      h('div', { className: 'mwt-title' }, h('h1', null, t('today')), h('span', null, today.toLocaleDateString([], { month: 'long', day: 'numeric', weekday: 'short' }))),
      h(Ask, { scenarios: s.scenarios }),
      h('div', { className: 'mwt-section' }, h('h2', null, icon('loader', { size: 14 }), t('running'), active.length ? h('span', null, String(active.length)) : null),
        active.length ? h('div', { className: 'mwt-cards' }, active.map((x) => h(TaskCard, { key: x.id, task: x, onOpen: openTask }))) : h('div', { className: 'mwt-empty' }, s.error || t('noneRunning'))),
      h('div', { className: 'mwt-section' }, h('h2', null, icon('file-text', { size: 14 }), t('doneToday')),
        todayDone.length ? h('div', { className: 'mwt-cards' }, todayDone.map((x) => h(TaskCard, { key: x.id, task: x, onOpen: openTask }))) : h('div', { className: 'mwt-empty' }, t('noneDeliverables')))))
  }

  let pendingOpen = ''

  function TaskDetail({ id, onBack }) {
    const s = usePolling()
    const task = s.items.find((x) => x.id === id) || null
    const [detail, setDetail] = React.useState(null)
    const live = !!task && task.status !== 'done'
    useTick(live)
    const key = task ? task.status + ':' + task.deliverableIds.length : ''
    React.useEffect(() => { let on = true; api('/task?id=' + encodeURIComponent(id)).then((d) => { if (on) setDetail(d) }).catch(() => {}); return () => { on = false } }, [id, key])
    if (!task) return h('div', { className: 'mwt-empty' }, t('none'))
    const deliverables = detail && detail.deliverables ? detail.deliverables : []
    const rerun = () => api('/rerun', { id }).then((d) => { refresh().then(schedulePoll); if (d.task) onBack() }).catch(() => {})
    const cancel = () => api('/cancel', { id }).then(() => refresh()).catch(() => {})
    const rate = (d, r) => api('/rate', { id: d.id, rating: d.rating === r ? null : r }).then((x) => setDetail((prev) => prev ? { ...prev, deliverables: prev.deliverables.map((y) => y.id === x.deliverable.id ? x.deliverable : y) } : prev)).catch(() => {})
    return h('div', null,
      h('div', { className: 'mwt-toolbar' }, h('button', { type: 'button', className: 'mwt-btn', onClick: onBack }, icon('arrow-left', { size: 14 }), t('back')), h('span', { className: 'grow' }),
        h('div', { className: 'mwt-actions' },
          live ? h('button', { type: 'button', className: 'mwt-btn', onClick: cancel }, icon('x', { size: 14 }), t('cancel')) : h('button', { type: 'button', className: 'mwt-btn', onClick: rerun }, icon('rotate-cw', { size: 14 }), t('rerun')),
          task.sessionId ? h('button', { type: 'button', className: 'mwt-btn', onClick: () => openSession(task.sessionId) }, icon('history', { size: 14 }), t('process')) : null)),
      h('div', { className: 'mwt-detail-head' }, h(StatusDot, { task }), h('h1', null, task.title)),
      h('dl', { className: 'mwt-kv' },
        h('dt', null, t('input')), h('dd', null, task.input),
        h('dt', null, t('scenario')), h('dd', null, (s.scenarios.find((x) => x.id === task.scenario) || {}).label || task.scenario),
        h('dt', null, t('elapsed')), h('dd', null, elapsedOf(task) + (task.finishedAt ? ' · ' + fmtDate(task.finishedAt) : ''))),
      task.error ? h('div', { className: 'mwt-error' }, task.error) : null,
      h('div', { className: 'mwt-section', style: { marginTop: 0 } }, h('h2', null, t('steps')),
        task.steps.length ? h('ol', { className: 'mwt-steps' }, task.steps.map((st, i) => h('li', { key: i, 'data-live': !st.endedAt },
          h('span', { className: 'name' }, st.name + (st.count > 1 ? ' × ' + st.count : '')),
          h('span', { className: 'time' }, fmtDuration(new Date(st.endedAt || Date.now()) - new Date(st.startedAt)))))) : h('div', { className: 'mwt-empty' }, live ? task.statusLabel : t('noSteps'))),
      h('div', { className: 'mwt-section' }, h('h2', null, t('deliverables')),
        deliverables.length ? deliverables.map((d) => h('div', { key: d.id, className: 'mwt-doc' },
          h('div', { className: 'mwt-doc-head' }, icon('file-text', { size: 15 }), h('h3', null, d.title), h('small', null, fmtDate(d.createdAt)),
            h('button', { type: 'button', className: 'mwt-chip', 'data-on': d.rating === 1, onClick: () => rate(d, 1) }, t('ratingGood')),
            h('button', { type: 'button', className: 'mwt-chip', 'data-on': d.rating === -1, onClick: () => rate(d, -1) }, t('ratingBad'))),
          h(Markdown, { text: d.markdown }))) : h('div', { className: 'mwt-empty' }, t('none2'))))
  }

  function TasksPage() {
    const s = usePolling()
    const [filter, setFilter] = React.useState('all')
    const [open, setOpen] = React.useState(() => { const id = pendingOpen; pendingOpen = ''; return id })
    React.useEffect(() => { if (pendingOpen) { setOpen(pendingOpen); pendingOpen = '' } })
    useTick(s.items.some((x) => x.status !== 'done'))
    const items = s.items.filter((x) => filter === 'all' ? true : filter === 'active' ? x.status !== 'done' : x.status === 'done')
    return h('div', { className: 'mwt' }, h('style', null, STYLE), h('div', { className: 'mwt-page' },
      open ? h(TaskDetail, { id: open, onBack: () => setOpen('') }) : h(React.Fragment, null,
        h('div', { className: 'mwt-title' }, h('h1', null, t('tasks')), h('span', null, String(s.items.length))),
        h('div', { className: 'mwt-chips', style: { margin: '0 0 16px' } }, [['all', t('all')], ['active', t('active')], ['done', t('finished')]].map(([k, label]) => h('button', { key: k, type: 'button', className: 'mwt-chip', 'data-on': filter === k, onClick: () => setFilter(k) }, label))),
        items.length ? h('div', { className: 'mwt-cards' }, items.map((x) => h(TaskCard, { key: x.id, task: x, onOpen: setOpen }))) : h('div', { className: 'mwt-empty' }, s.error || t('none')))))
  }

  return { TodayPage, TasksPage }
}

// ---- plugin -----------------------------------------------------------------
exports.name = PLUGIN
exports.inject = ['slots', 'locale', 'layout']
exports.apply = function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), PLUGIN + ': dictionaries')
  const t = ctx.locale.bind(NS)
  const { TodayPage, TasksPage } = makeComponents(ctx, t)
  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: TODAY_PANEL, locale: NS, inject: () => ({}) }, function MyworkToday() { return h(TodayPage) }))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: TODAY_PANEL, order: 1, locale: NS, label: () => t('today'), inject: () => ({}) }, function MyworkTodayIcon() { return icon('sun', { size: 16, strokeWidth: 1.6 }) }))
  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: TASKS_PANEL, locale: NS, inject: () => ({}) }, function MyworkTasks() { return h(TasksPage) }))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: TASKS_PANEL, order: 2, locale: NS, label: () => t('tasks'), inject: () => ({}) }, function MyworkTasksIcon() { return icon('list-checks', { size: 16, strokeWidth: 1.6 }) }))
}
