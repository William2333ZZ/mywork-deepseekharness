/**
 * dsh-mywork-kit — browser half: the single "MyWork" settings section.
 *
 * The kit owns ONE entry in dsh's settings navigation and renders a tab bar
 * inside it. Every MyWork package contributes a tab through the child slot
 * `mywork.settings.tab` (declared here, list cardinality):
 *
 *   ctx.slots.inject('mywork.settings.tab', () => ctx.slots.register({
 *     name: 'mywork.settings.tab', id: 'my-plugin', order: 20, label: () => '外观',
 *   }, MyTab))
 *
 * The kit's own "成员" tab (member status, install / update) is registered the
 * same way. Without the kit installed the other packages simply have no
 * settings UI — the kit is the shell.
 */
'use strict'

const React = require('react')
const { icon, PATHS } = require('./client-icons.cjs')

const PLUGIN = 'dsh-mywork-kit'
const NS = 'mywork.kit'
const API = '/mywork-kit/api'
const TAB_SLOT = 'mywork.settings.tab'
const TAB_KEY = 'dsh-mywork-kit:settings-tab'

const zh = {
  nav: 'MyWork',
  members: '成员',
  loading: '读取中…',
  installed: '已装',
  missing: '未安装',
  install: '安装',
  installAll: '补装缺失的 {n} 个',
  update: '更新',
  updateAll: '更新 {n} 个',
  check: '检查更新',
  checking: '检查中…',
  busy: '处理中…',
  restart: '成员已变化，重启 dsh 后生效（例如关闭再运行 dsh web）。',
  pendingRestart: '待重启',
  required: '必装',
  disabled: '浏览器内安装已被配置关闭；请在终端运行：',
  cmd: 'dsh plugin --profile {profile} add {names}',
  profile: 'profile',
  linked: '开发模式（link 安装）：本仓库成员将以 link 方式安装',
  error: '出错：',
  hint: '提示：',
  noProfile: '没有找到安装了本 Kit 的 profile。',
  noTabs: '没有可用的设置页。',
  phone: '手机',
  phoneOn: '手机和电脑连同一个 Wi‑Fi，扫这个码就能打开 MyWork。',
  phoneOff: '现在只有这台电脑能打开 MyWork。',
  phoneAllow: '允许手机连接',
  phoneDeny: '关闭手机连接',
  phoneRestart: '重启 MyWork 后生效。',
  phoneHere: '这个页面要在电脑上看。',
  phoneNoLan: '这台电脑没有连上局域网。',
  phoneOnRelay: '扫这个码配对。手机和电脑在同一个 Wi‑Fi 时直连；在外面时走加密中继。',
  relayTitle: '在外面也能连（加密中继）',
  relayOff: '关着：手机只能在这个 Wi‑Fi 下连。打开后，手机在 4G 或别的网络下也能连回这台电脑；中继只转发加密过的数据，看不到内容。',
  relayUp: '已连上中继 · {n} 台手机在线',
  relayConnecting: '正在连中继…',
  relayNoUrl: '还没有中继地址。',
  relayRescan: '打开后要重新扫一次码：码里多了中继的信息。',
}
const en = {
  nav: 'MyWork',
  members: 'Members',
  loading: 'Loading…',
  installed: 'installed',
  missing: 'not installed',
  install: 'Install',
  installAll: 'Install {n} missing',
  update: 'Update',
  updateAll: 'Update {n}',
  check: 'Check updates',
  checking: 'Checking…',
  busy: 'Working…',
  restart: 'Members changed — restart dsh to apply (e.g. stop and run dsh web again).',
  pendingRestart: 'restart pending',
  required: 'required',
  disabled: 'Installing from the browser is disabled by config; run in a terminal:',
  cmd: 'dsh plugin --profile {profile} add {names}',
  profile: 'profile',
  linked: 'developer mode (link install): in-repo members install as links',
  error: 'Error: ',
  hint: 'Hint: ',
  noProfile: 'No profile with this kit installed was found.',
  noTabs: 'No settings pages available.',
  phone: 'Phone',
  phoneOn: 'On the same Wi‑Fi, scan this to open MyWork on your phone.',
  phoneOff: 'Only this computer can open MyWork right now.',
  phoneAllow: 'Allow phones to connect',
  phoneDeny: 'Stop phone connections',
  phoneRestart: 'Takes effect after MyWork restarts.',
  phoneHere: 'Open this page on the computer.',
  phoneNoLan: 'This computer is not on a local network.',
  phoneOnRelay: 'Scan this to pair. On the same Wi‑Fi the phone connects directly; elsewhere through the encrypted relay.',
  relayTitle: 'Reach it from anywhere (encrypted relay)',
  relayOff: 'Off: phones connect on this Wi‑Fi only. On, a phone on 4G or another network reaches this computer too; the relay only passes encrypted data and cannot read it.',
  relayUp: 'Connected to the relay · {n} phone(s) online',
  relayConnecting: 'Connecting to the relay…',
  relayNoUrl: 'No relay address yet.',
  relayRescan: 'After turning it on, scan the code again: it now carries the relay.',
}

const CSS = `
.mwk{font-size:13px;color:var(--dsw-alias-label-primary)}
.mwk-phone{display:grid;gap:14px;max-width:420px}
.mwk-phone p{margin:0;font-size:14px;line-height:1.6}
.mwk-qr{width:208px;height:208px;padding:12px;box-sizing:border-box;background:#fff;border:1px solid color-mix(in srgb,currentColor 12%,transparent);border-radius:12px}
.mwk-qr svg{display:block;width:100%;height:100%}
.mwk-url{font-family:ui-monospace,Menlo,monospace;font-size:12px;opacity:.7;word-break:break-all;user-select:all}
.mwk-phone button{justify-self:start}
.mwk-relay{display:grid;gap:6px;padding-top:14px;border-top:0.5px solid var(--dsw-alias-border-l2)}
.mwk-relay-head{display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:14px}
.mwk-relay .mwk-sub{margin:0;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary)}
.mwk-relay .mwk-sub[data-up=true]{color:var(--dsw-alias-brand-text,var(--dsw-alias-label-primary))}
.mwk-switch{appearance:none;position:relative;flex:none;width:34px;height:20px;padding:0;border:1px solid var(--dsw-alias-border-l3);border-radius:999px;background:transparent;cursor:pointer}
.mwk-switch::after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--dsw-alias-label-tertiary);transition:left .15s}
.mwk-switch[aria-checked=true]{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-brand-primary)}
.mwk-switch[aria-checked=true]::after{left:16px;background:var(--dsw-alias-label-primary-foreground)}
.mwk-switch[disabled]{opacity:.4;cursor:default}
.mwk-tabs{display:flex;gap:2px;border-bottom:0.5px solid var(--dsw-alias-border-l2);margin:0 0 16px;overflow-x:auto}
.mwk-tab{border:0;background:transparent;color:var(--dsw-alias-label-secondary);padding:8px 12px;font:inherit;font-size:13px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-0.5px;white-space:nowrap}
.mwk-tab:hover{color:var(--dsw-alias-label-primary)}
.mwk-tab.on{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-brand-primary);font-weight:600}
.mwk-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.mwk-chip{font-size:11px;line-height:18px;border-radius:999px;padding:0 9px;border:0.5px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);white-space:nowrap;font-family:ui-monospace,Menlo,monospace}
.mwk-chip.warn{color:var(--dsw-alias-state-warn-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 50%,transparent)}
.mwk-chip.ok{color:var(--dsw-alias-state-success-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 50%,transparent)}
.mwk-chip.brand{color:var(--dsw-alias-brand-primary);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 50%,transparent)}
.mwk-sp{flex:1}
.mwk-btn{font-size:12px;padding:5px 12px;border-radius:8px;border:0.5px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer;font-family:inherit}
.mwk-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.mwk-btn:disabled{opacity:.5;cursor:default}
.mwk-btn.primary{background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary));color:var(--dsw-alias-label-primary-inverted,#fff);border-color:transparent;font-weight:600}
.mwk-banner{border-radius:10px;padding:9px 12px;margin:0 0 12px;font-size:12.5px;line-height:1.6;border:0.5px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 40%,var(--dsw-alias-border-l2));background:color-mix(in srgb,var(--dsw-alias-brand-primary) 8%,transparent)}
.mwk-banner.err{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 50%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 8%,transparent)}
.mwk-banner code{font-family:ui-monospace,Menlo,monospace;font-size:12px;user-select:all}
.mwk-desc{color:var(--dsw-alias-label-secondary);line-height:1.6;margin-bottom:12px}
.mwk-group{font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary);margin:14px 0 4px;letter-spacing:.02em}
.mwk-row{display:flex;gap:12px;align-items:flex-start;padding:10px 8px;border-radius:10px}
.mwk-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
.mwk-icon{width:24px;flex:none;display:flex;justify-content:center;color:var(--dsw-alias-label-secondary);padding-top:1px}
.mwk-main{flex:1;min-width:0}
.mwk-label{font-weight:600}
.mwk-name{font-size:11px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));font-family:ui-monospace,Menlo,monospace;margin-left:6px}
.mwk-d{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:2px;line-height:1.6}
.mwk-side{display:flex;align-items:center;gap:6px;flex:none;padding-top:2px}
.mwk-foot{font-size:11px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));font-family:ui-monospace,Menlo,monospace;margin-top:16px;word-break:break-all}
.mwk-log{white-space:pre-wrap;font-family:ui-monospace,Menlo,monospace;font-size:11px;max-height:160px;overflow:auto;background:var(--dsw-alias-bg-layer-2);border-radius:8px;padding:8px;margin-top:8px;color:var(--dsw-alias-label-secondary)}
`

function injectStyles() {
  const el = document.createElement('style')
  el.setAttribute('data-plugin', PLUGIN)
  el.textContent = CSS
  document.head.appendChild(el)
  return () => { el.remove() }
}
async function api(path, body) {
  const res = await fetch(API + path, body === undefined ? { method: 'GET' } : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined ? '' : String(vars[k])))
/** Resolve a slot registration's `label` option (string or thunk) like ui-settings-general does. */
function labelOf(options) {
  const l = options && options.label
  try { return typeof l === 'function' ? l() : (typeof l === 'string' ? l : undefined) } catch { return undefined }
}

exports.name = PLUGIN
exports.inject = ['slots', 'locale']

exports.apply = function apply(ctx) {
  ctx.effect(() => injectStyles(), `${PLUGIN}: stylesheet`)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), `${PLUGIN}: dictionaries`)
  const t = ctx.locale.bind(NS)
  const h = React.createElement

  // ---- tab registry (from the child slot's entries) --------------------------
  const tabSubs = new Set()
  const readTabs = () => {
    let entries = []
    try { entries = ctx.slots.entriesOfSlot ? ctx.slots.entriesOfSlot(TAB_SLOT) : ctx.slots.entries(TAB_SLOT) } catch { entries = [] }
    return entries.map((e) => ({ id: e.options.id, order: e.options.order || 0, label: labelOf(e.options) || e.options.id })).sort((a, b) => a.order - b.order)
  }
  const notifyTabs = () => { tabSubs.forEach((fn) => { try { fn() } catch { /* ignore */ } }) }
  ctx.effect(() => ctx.slots.subscribe(TAB_SLOT, notifyTabs), `${PLUGIN}: tab entries`)
  ctx.effect(() => ctx.locale.subscribe(notifyTabs), `${PLUGIN}: tab labels`)

  function MyWorkSection(props) {
    const [tabs, setTabs] = React.useState(readTabs)
    React.useEffect(() => { const fn = () => setTabs(readTabs()); tabSubs.add(fn); fn(); return () => { tabSubs.delete(fn) } }, [])
    const [active, setActive] = React.useState(() => { try { return window.localStorage.getItem(TAB_KEY) || 'members' } catch { return 'members' } })
    const current = tabs.find((x) => x.id === active) ? active : (tabs[0] ? tabs[0].id : null)
    const pick = (id) => { setActive(id); try { window.localStorage.setItem(TAB_KEY, id) } catch { /* ignore */ } }
    return h('div', { className: 'mwk' },
      h('div', { className: 'mwk-tabs', role: 'tablist' }, tabs.map((tab) => h('button', { key: tab.id, role: 'tab', className: 'mwk-tab' + (tab.id === current ? ' on' : ''), 'aria-selected': tab.id === current, onClick: () => pick(tab.id) }, tab.label))),
      current ? props.renderSlot(TAB_SLOT, { close: props.close }, { only: current }) : h('div', { className: 'mwk-desc' }, t('noTabs')),
    )
  }

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: PLUGIN,
    order: 60,
    label: () => t('nav'),
    children: { [TAB_SLOT]: { kind: 'list', scope: 'root' } },
    inject: () => ({}),
  }, function MyworkSettings(props) { return h(MyWorkSection, props) }))

  // ---- "成员" tab ----------------------------------------------------------------
  function Members() {
    const [st, setSt] = React.useState(null)
    const [upd, setUpd] = React.useState(null)
    const [busy, setBusy] = React.useState(false)
    const [checking, setChecking] = React.useState(false)
    const [log, setLog] = React.useState('')
    const [err, setErr] = React.useState('')
    const refresh = React.useCallback(async () => { const r = await api('/status'); if (r.ok) setSt(r.data); return r.data }, [])
    React.useEffect(() => { refresh() }, [refresh])

    const check = async () => {
      setChecking(true)
      try { const r = await api('/check-updates'); if (r.ok && r.data.ok) setUpd(r.data); else setErr(r.data.error || 'check failed') } finally { setChecking(false) }
    }
    const mutate = async (path, names) => {
      if (busy || names.length === 0) return
      setBusy(true); setErr(''); setLog('')
      try {
        const r = await api('/' + path, { names })
        const d = r.data || {}
        if (!r.ok || !d.ok) setErr((d.error || ('HTTP ' + r.status)) + (d.hint ? '\n' + t('hint') + d.hint : ''))
        setLog(((d.stdout || '') + '\n' + (d.stderr || '')).trim())
        await refresh()
        if (upd) check()
      } finally { setBusy(false) }
    }

    if (!st) return h('div', null, t('loading'))
    const members = st.members || []
    const missing = members.filter((m) => !m.installed)
    const updMap = new Map((upd && upd.members ? upd.members : []).map((x) => [x.name, x]))
    const outdated = members.filter((m) => m.installed && updMap.get(m.name) && updMap.get(m.name).outdated)
    const groups = st.kit && st.kit.groups ? st.kit.groups : {}
    const groupIds = Object.keys(groups).length ? Object.keys(groups) : ['all']
    const byGroup = (g) => members.filter((m) => (m.group || 'all') === g)
    const cmdNames = missing.map((m) => m.name).join(' ')

    return h('div', null,
      h('div', { className: 'mwk-desc' }, st.kit && st.kit.description),
      h('div', { className: 'mwk-top' },
        st.profile ? h('span', { className: 'mwk-chip' }, t('profile') + ': ' + st.profile.name) : null,
        h('span', { className: 'mwk-chip' }, `${st.installedCount}/${members.length} ${t('installed')}`),
        st.requiredMissing > 0 ? h('span', { className: 'mwk-chip warn' }, t('required') + ' ' + st.requiredMissing) : null,
        st.profile && st.profile.linked ? h('span', { className: 'mwk-chip brand', title: t('linked') }, 'link') : null,
        h('span', { className: 'mwk-sp' }),
        h('button', { className: 'mwk-btn', disabled: checking || busy, onClick: check }, checking ? t('checking') : t('check')),
        outdated.length > 0 && st.allowInstall ? h('button', { className: 'mwk-btn primary', disabled: busy, onClick: () => mutate('update', outdated.map((m) => m.name)) }, busy ? t('busy') : fill(t('updateAll'), { n: outdated.length })) : null,
        missing.length > 0 && st.allowInstall ? h('button', { className: 'mwk-btn primary', disabled: busy, onClick: () => mutate('install', missing.map((m) => m.name)) }, busy ? t('busy') : fill(t('installAll'), { n: missing.length })) : null,
      ),
      !st.ok ? h('div', { className: 'mwk-banner err' }, st.error || t('noProfile')) : null,
      st.needsRestartCount > 0 ? h('div', { className: 'mwk-banner' }, t('restart')) : null,
      !st.allowInstall && missing.length > 0 ? h('div', { className: 'mwk-banner' }, t('disabled'), ' ', h('code', null, fill(t('cmd'), { profile: st.profile ? st.profile.name : 'web', names: cmdNames }))) : null,
      err ? h('div', { className: 'mwk-banner err' }, t('error'), err) : null,
      groupIds.map((g) => {
        const list = byGroup(g)
        if (list.length === 0) return null
        return h('div', { key: g },
          h('div', { className: 'mwk-group' }, groups[g] || ''),
          list.map((m) => {
            const u = updMap.get(m.name)
            return h('div', { className: 'mwk-row', key: m.name },
              h('div', { className: 'mwk-icon' }, icon(m.icon && PATHS[m.icon] ? m.icon : 'package', { size: 18 })),
              h('div', { className: 'mwk-main' },
                h('div', null, h('span', { className: 'mwk-label' }, m.label), h('span', { className: 'mwk-name' }, m.name), m.required ? h('span', { className: 'mwk-chip brand', style: { marginLeft: 6 } }, t('required')) : null),
                h('div', { className: 'mwk-d' }, m.desc),
              ),
              h('div', { className: 'mwk-side' },
                m.installed && m.needsRestart ? h('span', { className: 'mwk-chip warn' }, t('pendingRestart')) : null,
                m.installed && !m.needsRestart ? h('span', { className: 'mwk-chip ok' }, (u && u.outdated ? `${m.version} → ${u.latest}` : m.version || t('installed'))) : null,
                !m.installed ? h('span', { className: 'mwk-chip' }, t('missing')) : null,
                m.installed && u && u.outdated && st.allowInstall ? h('button', { className: 'mwk-btn', disabled: busy, onClick: () => mutate('update', [m.name]) }, t('update')) : null,
                !m.installed && st.allowInstall ? h('button', { className: 'mwk-btn primary', disabled: busy, onClick: () => mutate('install', [m.name]) }, t('install')) : null,
              ),
            )
          }),
        )
      }),
      log ? h('div', { className: 'mwk-log' }, log) : null,
      st.profile ? h('div', { className: 'mwk-foot' }, st.profile.dir) : null,
    )
  }

  ctx.slots.inject(TAB_SLOT, () => ctx.slots.register({
    name: TAB_SLOT, id: 'members', order: 10, label: () => t('members'),
  }, function MyworkMembersTab() { return h(Members) }))

  // ---- "手机" tab: the phone opens the same web app over the LAN ---------------------------------
  function Phone() {
    const [st, setSt] = React.useState(null)
    const [busy, setBusy] = React.useState(false)
    const load = React.useCallback(async () => { const r = await api('/phone'); if (r.ok) setSt(r.data) }, [])
    // While the tab is open the relay's state is read again every 5 s (it connects in the background).
    React.useEffect(() => { load(); const id = setInterval(load, 5000); return () => clearInterval(id) }, [load])
    const flip = async (enabled) => { if (busy) return; setBusy(true); try { await api('/phone/enable', { enabled }); await load() } finally { setBusy(false) } }
    const flipRelay = async (enabled) => { if (busy) return; setBusy(true); try { await api('/phone/relay', { enabled }); await load() } finally { setBusy(false) } }
    const relay = st && st.relay ? st.relay : { wanted: false, url: '', connected: false, phones: 0, error: '' }
    const relayBlock = () => h('div', { className: 'mwk-relay' },
      h('div', { className: 'mwk-relay-head' },
        h('span', null, t('relayTitle')),
        h('button', { type: 'button', role: 'switch', className: 'mwk-switch', 'aria-checked': relay.wanted, 'aria-label': t('relayTitle'), disabled: busy || !relay.url, onClick: () => flipRelay(!relay.wanted) })),
      h('p', { className: 'mwk-sub', 'data-up': relay.wanted && relay.connected ? 'true' : undefined },
        !relay.url ? t('relayNoUrl') : !relay.wanted ? t('relayOff') : relay.connected ? t('relayUp').replace('{n}', String(relay.phones || 0)) : (relay.error || t('relayConnecting'))),
      relay.wanted ? h('p', { className: 'mwk-sub' }, t('relayRescan')) : null)
    if (!st) return h('div', null, t('loading'))
    if (!st.here) return h('div', { className: 'mwk-phone' }, h('p', null, t('phoneHere')))
    const first = st.lan && st.lan[0]
    if (st.exposed && first) {
      return h('div', { className: 'mwk-phone' },
        h('p', null, relay.wanted ? t('phoneOnRelay') : t('phoneOn')),
        h('div', { className: 'mwk-qr', dangerouslySetInnerHTML: { __html: first.svg } }),
        h('div', { className: 'mwk-url' }, first.url),
        relayBlock(),
        h('button', { type: 'button', className: 'mwk-btn', disabled: busy, onClick: () => flip(false) }, t('phoneDeny')))
    }
    if (st.exposed && !first) return h('div', { className: 'mwk-phone' }, h('p', null, t('phoneNoLan')), h('button', { type: 'button', className: 'mwk-btn', disabled: busy, onClick: () => flip(false) }, t('phoneDeny')))
    return h('div', { className: 'mwk-phone' },
      h('p', null, t('phoneOff')),
      h('button', { type: 'button', className: 'mwk-btn', disabled: busy, onClick: () => flip(true) }, t('phoneAllow')))
  }
  ctx.slots.inject(TAB_SLOT, () => ctx.slots.register({
    name: TAB_SLOT, id: 'phone', order: 30, label: () => t('phone'),
  }, function MyworkPhoneTab() { return h(Phone) }))
}
