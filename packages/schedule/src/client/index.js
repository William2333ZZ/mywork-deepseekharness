/**
 * dsh-mywork-schedule — browser half (CommonJS; wrapped by scripts/build-client.mjs,
 * with src/logic.cjs inlined as a prelude so `require('./logic.cjs')` works).
 *
 * Surfaces:
 *   • "日程" button at the right of the composer (conversation.input.right) with a
 *     badge for enabled reminders; click toggles the panel.
 *   • Floating panel (shell.overlay) with two tabs:
 *       提醒   — alarm-style reminders (this package)
 *       定时任务 — scheduled sessions from @michengai/dsh-automation; the tab links
 *                to its settings page (Automation has no readable HTTP API).
 *   • Alarm toasts (shell.overlay).
 *   • "日程" tab inside Settings → MyWork: notification permission, sound, list.
 *
 * Alarms fire HERE: the client polls the host list, computes due occurrences
 * with the browser's clock/timezone, shows a toast, a browser Notification
 * (if permitted) and a short beep (WebAudio, no asset), then tells the host
 * `/fired` so other tabs and the model tools agree on lastFiredAt.
 */
'use strict'

const React = require('react')
const logic = require('./logic.cjs')
const { icon } = require('./client-icons.cjs')

const PLUGIN = 'dsh-mywork-schedule'
const NS = 'mywork.schedule'
const API = '/mywork-schedule/api'
const TAB_SLOT = 'mywork.settings.tab'
/** Settings-section labels of @michengai/dsh-automation (zh / en). */
const AUTOMATION_LABELS = ['定时任务', 'Scheduled tasks']
/** Standalone 定时任务 main panel registered by dsh-mywork-codex-ui. */
const SCHEDULE_PANEL_ID = 'mywork-schedule'
const POLL_MS = 30000
const TICK_MS = 5000
const SOUND_KEY = 'dsh-mywork-schedule:sound'

const zh = {
  nav: '日程',
  title: '日程',
  reminders: '提醒',
  tasks: '定时任务',
  tasksHint: '定时任务在独立会话里按计划执行编码任务（一次 / 每小时 / 每天 / 每周 / 每月），由 Automation 插件提供；在侧栏「定时」标签查看，在设置页管理。',
  tasksOpen: '打开定时任务页面',
  tasksMissing: '尚未安装 @michengai/dsh-automation：到 设置 → MyWork → 成员 一键补装。',
  notifyTitle: '运行结束通知到 IM', notifyHint: '每次定时任务跑完，把它的最后一条回复发到你的微信 / 飞书等（由 dsh-mywork-im 转发）。', notifyEnable: '启用', notifyChat: '发给', notifyWhen: '时机', notifyAlways: '每次运行结束', notifyFailed: '仅失败时', notifySave: '保存', notifySaved: '已保存', notifyNoChats: '还没有可发的聊天：先在 IM 里给机器人发一句。', chooseChat: '请选择聊天',
  add: '添加',
  cancel: '取消',
  empty: '还没有提醒。用下面的表单，或在对话里说「10 分钟后提醒我…」，或输入 /remind 10m 喝水。',
  placeholder: '提醒内容',
  note: '备注（可选）',
  once: '一次', daily: '每天', weekly: '每周', interval: '间隔',
  minutes: '分钟',
  next: '下次',
  overdue: '已过期',
  fired: '提醒',
  missed: '（错过，已延迟提示）',
  enable: '启用', pause: '暂停', remove: '删除', confirm: '确认删除',
  notif: '浏览器通知',
  notifOn: '已允许', notifOff: '未允许 · 点此申请', notifDenied: '已被浏览器拒绝', notifNA: '当前环境不支持',
  sound: '提示音',
  on: '开', off: '关',
  toggle: '日程面板',
  help: '到点时会在页面内弹出、发浏览器通知并播放提示音（需保持 DSH 页面打开）。模型也可以用 reminder_* 工具替你设置。数据文件：',
  weekdays: ['一', '二', '三', '四', '五', '六', '日'],
  dismiss: '知道了',
  toIm: '到点也发到 IM（微信等）',
  imSent: '已发到 IM',
}
const en = {
  nav: 'Schedule',
  title: 'Schedule',
  reminders: 'Reminders',
  tasks: 'Scheduled tasks',
  tasksHint: 'Scheduled tasks run coding jobs in their own sessions on a plan (once / hourly / daily / weekly / monthly), provided by the Automation plugin; see them in the sidebar "Schedule" tab and manage them in Settings.',
  tasksOpen: 'Open the scheduled tasks page',
  tasksMissing: '@michengai/dsh-automation is not installed: Settings → MyWork → Members installs it in one click.',
  notifyTitle: 'Notify IM when a run finishes', notifyHint: 'After every scheduled run, its last reply is sent to your WeChat / Feishu … (relayed by dsh-mywork-im).', notifyEnable: 'Enabled', notifyChat: 'To', notifyWhen: 'When', notifyAlways: 'every finished run', notifyFailed: 'failed runs only', notifySave: 'Save', notifySaved: 'saved', notifyNoChats: 'No reachable chat yet: message the bot from your IM app first.', chooseChat: 'choose a chat',
  add: 'Add',
  cancel: 'Cancel',
  empty: 'No reminders yet. Use the form below, ask the model ("remind me in 10 minutes…"), or type /remind 10m water.',
  placeholder: 'What to remind',
  note: 'Note (optional)',
  once: 'Once', daily: 'Daily', weekly: 'Weekly', interval: 'Every',
  minutes: 'min',
  next: 'next',
  overdue: 'overdue',
  fired: 'Reminder',
  missed: ' (missed, shown late)',
  enable: 'Enable', pause: 'Pause', remove: 'Delete', confirm: 'Confirm',
  notif: 'Browser notifications',
  notifOn: 'granted', notifOff: 'not granted · click to request', notifDenied: 'blocked by the browser', notifNA: 'unavailable here',
  sound: 'Sound',
  on: 'on', off: 'off',
  toggle: 'Schedule panel',
  help: 'Due reminders pop up in this page, send a browser notification and play a beep (keep the DSH page open). The model can also manage them with the reminder_* tools. Data file:',
  weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  dismiss: 'OK',
  toIm: 'Also send to IM (WeChat, …) when due',
  imSent: 'sent to IM',
}

const CSS = `
.mwr-btn{display:inline-flex;align-items:center;justify-content:center;background:transparent;border:0;border-radius:8px;width:28px;height:28px;padding:0;cursor:pointer;color:var(--dsw-alias-label-secondary);position:relative}
.mwr-btn:hover,.mwr-btn.active{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.mwr-badge{position:absolute;top:-4px;right:-2px;min-width:14px;height:14px;padding:0 4px;border-radius:7px;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-inverted,#fff);font-size:9px;line-height:14px;text-align:center;font-weight:600}
.mwr-panel{position:fixed;right:18px;bottom:92px;width:360px;max-width:calc(100vw - 32px);max-height:min(72vh,640px);display:flex;flex-direction:column;background:var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-layer-1));color:var(--dsw-alias-label-primary);border:0;border-radius:14px;box-shadow:var(--dsw-elevation-prominent,0 10px 40px rgba(0,0,0,.28));z-index:1200;pointer-events:auto;font-size:13px;overflow:hidden}
.mwr-head{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:0.5px solid var(--dsw-alias-border-l2);font-weight:600}
.mwr-head .sp{flex:1}
.mwr-tabs{display:flex;gap:2px;padding:6px 8px 0}
.mwr-tab{border:0;background:transparent;color:var(--dsw-alias-label-secondary);padding:5px 10px;border-radius:8px;cursor:pointer;font:inherit;font-size:12.5px}
.mwr-tab:hover{background:var(--dsw-alias-interactive-bg-hover)}
.mwr-tab.on{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:600}
.mwr-tasks{padding:14px 12px;display:flex;flex-direction:column;gap:10px;color:var(--dsw-alias-label-secondary);line-height:1.6}
.mwr-x{border:0;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;padding:0;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;border-radius:6px}
.mwr-x:hover{background:var(--dsw-alias-interactive-bg-hover)}
.mwr-list{flex:1;overflow:auto;padding:6px 8px}
.mwr-empty{padding:16px 10px;color:var(--dsw-alias-label-secondary);line-height:1.6}
.mwr-row{display:flex;gap:8px;align-items:flex-start;padding:8px;border-radius:10px}
.mwr-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
.mwr-row.off{opacity:.55}
.mwr-main{flex:1;min-width:0}
.mwr-title{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwr-meta{display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:11px;color:var(--dsw-alias-label-secondary);margin-top:2px}
.mwr-pill{background:var(--dsw-alias-bg-layer-2);border-radius:5px;padding:0 6px;line-height:17px}
.mwr-pill.due{color:var(--dsw-alias-state-warn-primary)}
.mwr-note{font-size:11.5px;color:var(--dsw-alias-label-secondary);margin-top:2px;white-space:pre-wrap}
.mwr-acts{display:flex;gap:2px;flex:none}
.mwr-mini{border:0;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:12px;padding:0 6px;height:24px;display:inline-flex;align-items:center;gap:4px;border-radius:6px;font-family:inherit}
.mwr-mini:hover{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}
.mwr-mini.danger{color:var(--dsw-alias-state-error-primary)}
.mwr-form{padding:10px 12px;border-top:0.5px solid var(--dsw-alias-border-l2);display:flex;flex-direction:column;gap:6px}
.mwr-in{width:100%;box-sizing:border-box;background:var(--dsw-alias-bg-layer-2);border:0.5px solid var(--dsw-alias-border-l2);border-radius:8px;padding:6px 9px;font:inherit;color:inherit}
.mwr-in:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
.mwr-line{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.mwr-line .mwr-in{width:auto;flex:1;min-width:90px}
.mwr-seg{display:inline-flex;border:0.5px solid var(--dsw-alias-border-l2);border-radius:8px;overflow:hidden}
.mwr-seg button{border:0;background:transparent;color:var(--dsw-alias-label-secondary);padding:4px 9px;cursor:pointer;font:inherit;font-size:12px}
.mwr-seg button.on{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-inverted,#fff)}
.mwr-wd{display:flex;gap:3px}
.mwr-wd button{width:26px;height:26px;border-radius:50%;corner-shape:round;border:0.5px solid var(--dsw-alias-border-l2);background:transparent;color:inherit;cursor:pointer;font-size:11px;padding:0}
.mwr-wd button.on{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-inverted,#fff);border-color:transparent}
.mwr-primary{border:0;border-radius:8px;background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary));color:var(--dsw-alias-label-primary-inverted,#fff);padding:6px 14px;cursor:pointer;font:inherit;font-weight:600}
.mwr-primary:disabled{opacity:.5;cursor:default}
.mwr-err{color:var(--dsw-alias-state-error-primary);font-size:12px}
.mwr-toasts{position:fixed;top:16px;right:18px;display:flex;flex-direction:column;gap:8px;z-index:1300;pointer-events:none}
.mwr-toast{pointer-events:auto;width:340px;max-width:calc(100vw - 32px);background:var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-layer-1));color:var(--dsw-alias-label-primary);border-radius:12px;box-shadow:var(--dsw-elevation-prominent,0 10px 40px rgba(0,0,0,.28));padding:12px 14px;display:flex;gap:10px;align-items:flex-start;animation:mwr-in .25s ease}
.mwr-toast .ic{color:var(--dsw-alias-brand-primary);padding-top:2px}
.mwr-toast .tt{font-weight:600}
.mwr-toast .ts{font-size:11.5px;color:var(--dsw-alias-label-secondary);margin-top:2px}
.mwr-toast .mwr-primary{padding:4px 10px;font-size:12px;align-self:center}
@keyframes mwr-in{from{transform:translateY(-8px);opacity:0}to{transform:none;opacity:1}}
.mwr-set{display:flex;flex-direction:column;gap:10px;font-size:13px}
.mwr-set .row{display:flex;align-items:center;gap:10px}
.mwr-set .row .lab{width:140px;color:var(--dsw-alias-label-secondary)}
.mwr-set code{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;color:var(--dsw-alias-label-secondary)}
`

function injectStyles() {
  const el = document.createElement('style')
  el.setAttribute('data-plugin', PLUGIN)
  el.textContent = CSS
  document.head.appendChild(el)
  return () => { el.remove() }
}

async function api(path, body) {
  const res = await fetch(API + path, body === undefined ? { method: 'GET' } : {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data && data.error ? data.error : 'HTTP ' + res.status)
  return data
}

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ac = new Ctx()
    const now = ac.currentTime
    ;[0, 0.18, 0.36].forEach((off, i) => {
      const o = ac.createOscillator(); const g = ac.createGain()
      o.type = 'sine'; o.frequency.value = i === 2 ? 1046 : 880
      g.gain.setValueAtTime(0.0001, now + off)
      g.gain.exponentialRampToValueAtTime(0.25, now + off + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + off + 0.16)
      o.connect(g); g.connect(ac.destination)
      o.start(now + off); o.stop(now + off + 0.18)
    })
    setTimeout(() => { try { ac.close() } catch { /* ignore */ } }, 1200)
  } catch { /* audio blocked */ }
}

function soundEnabled() { try { return window.localStorage.getItem(SOUND_KEY) !== 'off' } catch { return true } }
function setSound(on) { try { window.localStorage.setItem(SOUND_KEY, on ? 'on' : 'off') } catch { /* ignore */ } }

function fmt(d) {
  if (!d) return '—'
  const dt = d instanceof Date ? d : new Date(d)
  const now = new Date()
  const sameDay = dt.toDateString() === now.toDateString()
  const time = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return sameDay ? time : dt.toLocaleDateString([], { month: 'numeric', day: 'numeric' }) + ' ' + time
}

/**
 * Open a settings section by its nav label. The MyWork Codex UI shell handles the
 * `dcu-settings-open-section` event in one commit; dsh's own shell is driven by
 * clicking the trigger and then the nav button with that text.
 */
function openSettingsSection(labels) {
  const trigger = document.querySelector('.dcu-settings-seat [data-dcu-settings-trigger], [data-dcu-settings-trigger], [aria-haspopup="dialog"]')
  if (!trigger) return false
  const ev = new CustomEvent('dcu-settings-open-section', { detail: { labels }, cancelable: true })
  if (!trigger.dispatchEvent(ev)) return true
  if (!document.querySelector('[data-dcu-settings-page],[role="dialog"]')) trigger.click()
  const deadline = Date.now() + 4000
  const tryPick = () => {
    const buttons = [...document.querySelectorAll('[data-dcu-settings-page] nav button,[role="dialog"] nav button')]
    const hit = buttons.find((b) => labels.includes((b.textContent || '').trim()))
    if (hit) { hit.click(); return }
    if (Date.now() < deadline) requestAnimationFrame(tryPick)
  }
  tryPick()
  return true
}

function pad2(n) { return (n < 10 ? '0' : '') + n }
function localDateInput(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) }
function localTimeInput(d) { return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) }

// ---------------------------------------------------------------------------

exports.name = PLUGIN
exports.inject = ['slots', 'locale', 'layout']

exports.apply = function apply(ctx) {
  ctx.effect(() => injectStyles(), `${PLUGIN}: stylesheet`)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), `${PLUGIN}: dictionaries`)
  const t = ctx.locale.bind(NS)
  const lang = () => { try { return ctx.locale.getSnapshot().active.toLowerCase().startsWith('zh') ? 'zh' : 'en' } catch { return 'zh' } }
  const dict = () => (lang() === 'zh' ? zh : en)

  // ---- state ---------------------------------------------------------------
  const state = { open: false, tab: 'reminders', items: [], dataPath: '', toasts: [], loaded: false }
  const subs = new Set()
  const emit = () => { subs.forEach((fn) => { try { fn() } catch { /* ignore */ } }) }
  const set = (patch) => { Object.assign(state, patch); emit() }
  function useState(getter) {
    const [v, setV] = React.useState(getter)
    React.useEffect(() => { const fn = () => setV(getter()); subs.add(fn); return () => { subs.delete(fn) } }, [])
    return v
  }

  let inflight = null
  async function refresh() {
    if (inflight) return inflight
    inflight = api('/list').then((d) => { set({ items: d.items || [], dataPath: d.dataPath || '', loaded: true }) })
      .catch((e) => { console.warn(`[${PLUGIN}] list failed`, e) })
      .finally(() => { inflight = null })
    return inflight
  }

  const firing = new Set()
  async function fire(r, due, stale) {
    const key = r.id + '@' + due.toISOString()
    if (firing.has(key)) return
    firing.add(key)
    try {
      // Re-check with the host first so a sibling tab that already fired wins.
      const fresh = await api('/list').catch(() => null)
      const latest = fresh && fresh.items ? fresh.items.find((x) => x.id === r.id) : r
      if (!latest || (latest.lastFiredAt && latest.lastFiredAt >= due.toISOString())) return
      await api('/fired', { id: r.id, at: due.toISOString() })
      if (!stale) {
        const toast = { key, title: r.title, note: r.note, at: due, missed: (Date.now() - due.getTime()) > 90000 }
        set({ toasts: state.toasts.concat([toast]) })
        setTimeout(() => dismiss(key), 60000)
        if (soundEnabled()) beep()
        if (r.im) fetch('/mywork-im/api/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ target: r.im === true ? '' : r.im, text: '⏰ ' + r.title + (r.note ? '\n' + r.note : '') }) }).catch((e) => console.warn(`[${PLUGIN}] IM delivery failed`, e))
        try {
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const n = new Notification(r.title, { body: (r.note ? r.note + '\n' : '') + fmt(due), tag: key })
            n.onclick = () => { try { window.focus() } catch { /* ignore */ } n.close() }
          }
        } catch { /* ignore */ }
      }
      await refresh()
    } finally { firing.delete(key) }
  }
  function dismiss(key) { set({ toasts: state.toasts.filter((x) => x.key !== key) }) }

  function tick() {
    const now = new Date()
    for (const r of state.items) {
      const due = logic.dueOccurrence(r, now)
      if (due) fire(r, due.at, due.stale)
    }
  }

  ctx.effect(() => {
    refresh()
    const poll = setInterval(refresh, POLL_MS)
    const tk = setInterval(tick, TICK_MS)
    const onVis = () => { if (document.visibilityState === 'visible') refresh().then(tick) }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', onVis)
    return () => { clearInterval(poll); clearInterval(tk); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('focus', onVis) }
  }, `${PLUGIN}: poll & tick`)

  async function add(input) {
    const d = await api('/add', input)
    set({ items: state.items.concat([d.item]) })
  }
  async function update(id, patch) {
    const d = await api('/update', { id, ...patch })
    set({ items: state.items.map((x) => (x.id === id ? d.item : x)) })
  }
  async function remove(id) {
    await api('/remove', { id })
    set({ items: state.items.filter((x) => x.id !== id) })
  }

  // ---- components ---------------------------------------------------------
  const h = React.createElement

  function ToggleButton() {
    const open = useState(() => state.open)
    const count = useState(() => state.items.filter((x) => x.enabled).length)
    return h('button', { type: 'button', className: 'mwr-btn' + (open ? ' active' : ''), title: t('toggle'), onClick: () => { set({ open: !state.open }); if (!state.loaded) refresh() } },
      icon('calendar'), count > 0 ? h('span', { className: 'mwr-badge' }, String(count)) : null)
  }

  function Row(props) {
    const { r } = props
    const [confirm, setConfirm] = React.useState(false)
    React.useEffect(() => { if (!confirm) return undefined; const id = setTimeout(() => setConfirm(false), 6000); return () => clearTimeout(id) }, [confirm])
    const next = logic.nextOccurrence(r, new Date(r.lastFiredAt || r.createdAt || Date.now()))
    const overdue = next && next.getTime() < Date.now()
    return h('div', { className: 'mwr-row' + (r.enabled ? '' : ' off') },
      h('div', { className: 'mwr-main' },
        h('div', { className: 'mwr-title', title: r.title }, r.title),
        h('div', { className: 'mwr-meta' },
          h('span', { className: 'mwr-pill' }, logic.describe(r, lang())),
          r.enabled ? h('span', { className: 'mwr-pill' + (overdue ? ' due' : '') }, (overdue ? t('overdue') : t('next')) + ' · ' + fmt(next)) : null,
          r.im ? h('span', { className: 'mwr-pill' }, 'IM') : null,
        ),
        r.note ? h('div', { className: 'mwr-note' }, r.note) : null,
      ),
      h('div', { className: 'mwr-acts' },
        h('button', { className: 'mwr-mini', title: r.enabled ? t('pause') : t('enable'), onClick: () => update(r.id, { enabled: !r.enabled }) }, r.enabled ? icon('pause', { size: 13 }) : icon('play', { size: 13 })),
        h('button', { className: 'mwr-mini danger', onClick: () => { if (confirm) remove(r.id); else setConfirm(true) } }, confirm ? t('confirm') : icon('x', { size: 13 })),
      ),
    )
  }

  function AddForm() {
    const d = dict()
    const now = new Date()
    const [kind, setKind] = React.useState('once')
    const [title, setTitle] = React.useState('')
    const [note, setNote] = React.useState('')
    const [date, setDate] = React.useState(localDateInput(now))
    const [time, setTime] = React.useState(localTimeInput(new Date(now.getTime() + 10 * 60000)))
    const [days, setDays] = React.useState([1, 2, 3, 4, 5])
    const [every, setEvery] = React.useState(30)
    const [toIm, setToIm] = React.useState(false)
    const [imChats, setImChats] = React.useState([])
    const [imTarget, setImTarget] = React.useState('')
    React.useEffect(() => { fetch('/mywork-im/api/chats').then((r) => r.ok ? r.json() : null).then((d) => { const items = d && d.items ? d.items : []; setImChats(items); if (items.length === 1) setImTarget(items[0].sessionId) }).catch(() => {}) }, [])
    const [err, setErr] = React.useState('')
    const [busy, setBusy] = React.useState(false)
    const submit = async () => {
      setErr('')
      const input = { title, note, kind }
      if (kind === 'once') input.at = new Date(date + 'T' + time + ':00').toISOString()
      if (kind === 'daily' || kind === 'weekly') input.time = time
      if (kind === 'weekly') input.weekdays = days
      if (kind === 'interval') input.everyMinutes = Number(every)
      if (toIm) { if (!imTarget) { setErr(lang() === 'zh' ? '请选择要发到的 IM 聊天' : 'choose the IM chat to notify'); return } input.im = imTarget }
      const n = logic.normalize(input)
      if (!n.ok) { setErr(n.error); return }
      if (kind === 'once' && new Date(input.at).getTime() <= Date.now()) { setErr(lang() === 'zh' ? '时间需要在将来' : 'time must be in the future'); return }
      setBusy(true)
      try { await add(n.value); setTitle(''); setNote('') } catch (e) { setErr(String(e.message || e)) } finally { setBusy(false) }
    }
    const seg = (id, label) => h('button', { type: 'button', className: kind === id ? 'on' : '', onClick: () => setKind(id) }, label)
    return h('div', { className: 'mwr-form' },
      h('input', { className: 'mwr-in', placeholder: d.placeholder, value: title, onChange: (e) => setTitle(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') submit() } }),
      h('div', { className: 'mwr-line' },
        h('div', { className: 'mwr-seg' }, seg('once', d.once), seg('daily', d.daily), seg('weekly', d.weekly), seg('interval', d.interval)),
      ),
      h('div', { className: 'mwr-line' },
        kind === 'once' ? h('input', { className: 'mwr-in', type: 'date', value: date, onChange: (e) => setDate(e.target.value) }) : null,
        kind !== 'interval' ? h('input', { className: 'mwr-in', type: 'time', value: time, onChange: (e) => setTime(e.target.value) }) : null,
        kind === 'interval' ? h('input', { className: 'mwr-in', type: 'number', min: 1, value: every, onChange: (e) => setEvery(e.target.value) }) : null,
        kind === 'interval' ? h('span', null, d.minutes) : null,
        kind === 'weekly' ? h('div', { className: 'mwr-wd' }, [1, 2, 3, 4, 5, 6, 7].map((n) => h('button', { key: n, type: 'button', className: days.includes(n) ? 'on' : '', onClick: () => setDays(days.includes(n) ? days.filter((x) => x !== n) : days.concat([n]).sort()) }, d.weekdays[n - 1]))) : null,
      ),
      h('input', { className: 'mwr-in', placeholder: d.note, value: note, onChange: (e) => setNote(e.target.value) }),
      imChats.length ? h('div', { className: 'mwr-line', style: { fontSize: 12 } },
        h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' } }, h('input', { type: 'checkbox', checked: toIm, onChange: (e) => setToIm(e.target.checked) }), d.toIm),
        toIm ? h('select', { className: 'mwr-in', style: { flex: 1 }, value: imTarget, onChange: (e) => setImTarget(e.target.value) }, imChats.length === 1 ? null : h('option', { value: '' }, lang() === 'zh' ? '请选择聊天' : 'choose a chat'), imChats.map((c) => h('option', { key: c.sessionId, value: c.sessionId }, `${c.platform} · ${c.channelName} · ${c.title}`))) : null) : null,
      err ? h('div', { className: 'mwr-err' }, err) : null,
      h('div', { className: 'mwr-line' }, h('span', { style: { flex: 1 } }), h('button', { className: 'mwr-primary', disabled: busy || !title.trim(), onClick: submit }, d.add)),
    )
  }

  const automationInstalled = () => {
    try { return ctx.slots.entriesOfSlot('settings.section').some((e) => { const l = typeof e.options.label === 'function' ? e.options.label() : e.options.label; return AUTOMATION_LABELS.includes(String(l || '').trim()) }) } catch { return false }
  }

  /** Prefer the standalone panel (Codex UI fork); fall back to the settings section elsewhere. */
  const openTasks = () => {
    let hasPanel = false
    try { hasPanel = ctx.slots.entriesOfSlot('sidebar.panellist').some((e) => e.options.id === SCHEDULE_PANEL_ID) } catch { hasPanel = false }
    if (hasPanel && ctx.layout && typeof ctx.layout.selectPanel === 'function') { ctx.layout.selectPanel(SCHEDULE_PANEL_ID); return }
    openSettingsSection(AUTOMATION_LABELS)
  }

  function NotifyCard(props) {
    const d = dict()
    const standalone = !!(props && props.standalone)
    const [cfg, setCfg] = React.useState(null); const [chats, setChats] = React.useState([]); const [msg, setMsg] = React.useState('')
    React.useEffect(() => { fetch('/mywork-im/api/notify').then((r) => (r.ok ? r.json() : null)).then((x) => { if (x) { setCfg(x.config.automation); setChats(x.chats || []) } }).catch(() => {}) }, [])
    if (!cfg) return null
    const save = async () => { setMsg(''); try { const r = await fetch('/mywork-im/api/notify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ automation: cfg }) }).then((x) => x.json()); if (r.error) throw new Error(r.error); setCfg(r.config.automation); setMsg(d.notifySaved) } catch (e) { setMsg(String(e.message || e)) } }
    return h('div', { className: 'mwr-form', style: standalone ? { border: '0.5px solid var(--dsw-alias-border-l2)', borderRadius: 12, marginBottom: 18, background: 'var(--dsw-alias-bg-layer-1)', maxWidth: 720 } : { borderTop: '0.5px solid var(--dsw-alias-border-l2)', marginTop: 6 } },
      h('div', { style: { fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, d.notifyTitle),
      h('div', { className: 'mwr-hint', style: { color: 'var(--dsw-alias-label-secondary)', lineHeight: 1.6 } }, d.notifyHint),
      chats.length === 0 ? h('div', { className: 'mwr-err' }, d.notifyNoChats) : null,
      h('label', { className: 'mwr-line', style: { cursor: 'pointer' } }, h('input', { type: 'checkbox', checked: !!cfg.enabled, onChange: (e) => setCfg({ ...cfg, enabled: e.target.checked }) }), d.notifyEnable),
      h('div', { className: 'mwr-line' }, h('span', null, d.notifyChat), h('select', { className: 'mwr-in', value: cfg.target || '', onChange: (e) => setCfg({ ...cfg, target: e.target.value }) }, h('option', { value: '' }, d.chooseChat), chats.map((c) => h('option', { key: c.sessionId, value: c.sessionId }, `${c.platform} · ${c.channelName} · ${c.title}`)))),
      h('div', { className: 'mwr-line' }, h('span', null, d.notifyWhen), h('div', { className: 'mwr-seg' }, h('button', { type: 'button', className: cfg.when !== 'failed' ? 'on' : '', onClick: () => setCfg({ ...cfg, when: 'always' }) }, d.notifyAlways), h('button', { type: 'button', className: cfg.when === 'failed' ? 'on' : '', onClick: () => setCfg({ ...cfg, when: 'failed' }) }, d.notifyFailed))),
      h('div', { className: 'mwr-line' }, h('span', { style: { flex: 1, fontSize: 12, color: 'var(--dsw-alias-label-secondary)' } }, msg), h('button', { className: 'mwr-primary', disabled: cfg.enabled && !cfg.target, onClick: save }, d.notifySave)),
    )
  }

  function TasksTab() {
    const installed = automationInstalled()
    return h('div', { className: 'mwr-tasks' },
      h('div', null, t('tasksHint')),
      installed
        ? h('div', null, h('button', { className: 'mwr-primary', onClick: () => { set({ open: false }); openTasks() } }, t('tasksOpen')))
        : h('div', { className: 'mwr-err' }, t('tasksMissing')),
      installed ? h(NotifyCard) : null,
    )
  }

  function Panel() {
    const open = useState(() => state.open)
    const items = useState(() => state.items)
    const tab = useState(() => state.tab)
    if (!open) return null
    const sorted = items.slice().sort((a, b) => {
      const na = logic.nextOccurrence(a, new Date(a.lastFiredAt || a.createdAt || 0)); const nb = logic.nextOccurrence(b, new Date(b.lastFiredAt || b.createdAt || 0))
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1
      return (na ? na.getTime() : Infinity) - (nb ? nb.getTime() : Infinity)
    })
    const tabBtn = (id, label) => h('button', { type: 'button', role: 'tab', className: 'mwr-tab' + (tab === id ? ' on' : ''), 'aria-selected': tab === id, onClick: () => set({ tab: id }) }, label)
    return h('div', { className: 'mwr-panel', role: 'dialog', 'aria-label': t('title') },
      h('div', { className: 'mwr-head' }, icon('calendar'), t('title'), h('span', { className: 'sp' }), h('button', { className: 'mwr-x', onClick: () => set({ open: false }) }, icon('x', { size: 14 }))),
      h('div', { className: 'mwr-tabs', role: 'tablist' }, tabBtn('reminders', t('reminders')), tabBtn('tasks', t('tasks'))),
      tab === 'tasks'
        ? h(TasksTab)
        : h(React.Fragment, null,
          h('div', { className: 'mwr-list' }, sorted.length === 0 ? h('div', { className: 'mwr-empty' }, t('empty')) : sorted.map((r) => h(Row, { key: r.id, r }))),
          h(AddForm),
        ),
    )
  }

  function Toasts() {
    const toasts = useState(() => state.toasts)
    if (toasts.length === 0) return null
    return h('div', { className: 'mwr-toasts' }, toasts.map((x) => h('div', { className: 'mwr-toast', key: x.key },
      h('div', { className: 'ic' }, icon('bell', { size: 18 })),
      h('div', { style: { flex: 1, minWidth: 0 } },
        h('div', { className: 'tt' }, x.title),
        h('div', { className: 'ts' }, t('fired') + ' · ' + fmt(x.at) + (x.missed ? t('missed') : '') + (x.note ? ' · ' + x.note : '')),
      ),
      h('button', { className: 'mwr-primary', onClick: () => dismiss(x.key) }, t('dismiss')),
    )))
  }

  function Overlay() { return h(React.Fragment, null, h(Panel), h(Toasts)) }

  function SettingsSection() {
    const d = dict()
    const [, force] = React.useState(0)
    const items = useState(() => state.items)
    const dataPath = useState(() => state.dataPath)
    const perm = typeof Notification === 'undefined' ? 'na' : Notification.permission
    const permLabel = perm === 'granted' ? d.notifOn : perm === 'denied' ? d.notifDenied : perm === 'na' ? d.notifNA : d.notifOff
    const ask = () => { if (typeof Notification !== 'undefined' && perm === 'default') Notification.requestPermission().then(() => force((n) => n + 1)) }
    const snd = soundEnabled()
    return h('div', { className: 'mwr-set' },
      h('div', { className: 'mwr-hint', style: { color: 'var(--dsw-alias-label-secondary)', lineHeight: 1.6 } }, d.help, ' ', h('code', null, dataPath || '…')),
      h('div', { className: 'row' }, h('span', { className: 'lab' }, d.notif), h('button', { className: 'mwr-mini', style: { border: '0.5px solid var(--dsw-alias-border-l2)' }, onClick: ask }, permLabel)),
      h('div', { className: 'row' }, h('span', { className: 'lab' }, d.sound), h('button', { className: 'mwr-mini', style: { border: '0.5px solid var(--dsw-alias-border-l2)' }, onClick: () => { setSound(!snd); beep(); force((n) => n + 1) } }, snd ? d.on : d.off)),
      h('div', { className: 'row' }, h('span', { className: 'lab' }, d.title), h('button', { className: 'mwr-mini', style: { border: '0.5px solid var(--dsw-alias-border-l2)' }, onClick: () => set({ open: true }) }, d.toggle + ' (' + items.length + ')')),
      h('div', null, items.map((r) => h(Row, { key: r.id, r }))),
    )
  }

  // ---- registrations --------------------------------------------------------
  ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
    name: 'conversation.input.right', id: PLUGIN, order: 40,
  }, function MyworkScheduleButton() { return h(ToggleButton) }))

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay', id: PLUGIN, order: 40,
  }, function MyworkScheduleOverlay() { return h(Overlay) }))

  // Same card at the top of the standalone 定时任务 page (slot declared by dsh-mywork-codex-ui).
  ctx.slots.inject('mywork.schedule.section', () => ctx.slots.register({ name: 'mywork.schedule.section', id: PLUGIN, order: 10 }, function MyworkScheduleNotify() { return h(NotifyCard, { standalone: true }) }))

  // "日程" tab inside Settings → MyWork (slot declared by dsh-mywork-kit).
  ctx.slots.inject(TAB_SLOT, () => ctx.slots.register({
    name: TAB_SLOT, id: 'schedule', order: 30, label: () => t('nav'),
  }, function MyworkScheduleTab() { return h(SettingsSection) }))
}
