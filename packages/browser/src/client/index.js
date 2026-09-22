/**
 * dsh-mywork-browser — browser half: the "实时浏览器 / Live browser" right-sidebar
 * tab. Renders the background Chrome's screencast (SSE JPEG frames from the host)
 * and forwards mouse / keyboard input, so you can watch the model browse and take
 * over. Also adds a globe button next to the composer that opens the tab, a
 * bookmark menu in the address bar (saved links → navigate the live browser) and
 * the "浏览器 / Browser" tab inside Settings → MyWork (status, restart, bookmarks).
 */
'use strict'

const React = require('react')
const { icon } = require('./client-icons.cjs')

const PLUGIN = 'dsh-mywork-browser'
const NS = 'mywork.browser'
const API = '/mywork-browser/api'
// Register under dsh's own `browser` kind: an extension registration outranks the
// builtin iframe tab, so the guide page, Markdown link clicks and openTab('browser')
// from any plugin all land in the live browser (no iframe anywhere).
const KIND = 'browser'
const TAB_SLOT = 'mywork.settings.tab'

const zh = {
  tab: '实时浏览器', guide: '实时浏览器', guideDesc: '后台 Chrome 的实时画面，可围观模型操作，也可自己点',
  open: '打开实时浏览器', notRunning: '浏览器未运行', starting: '连接中…', restart: '重启浏览器',
  newTab: '新标签页', closeTab: '关闭标签页', back: '后退', forward: '前进', reload: '刷新', go: '前往',
  follow: '跟随模型', system: '用系统浏览器打开', noTabs: '没有打开的页面。输入网址，或让模型去浏览。',
  hint: '点击、滚动、输入都会转发到后台浏览器；按 Esc 退出输入焦点。',
  nav: '浏览器', bookmarks: '书签', addCurrent: '收藏当前页', noBookmarks: '还没有书签。', name: '名称', url: '网址（http/https）', add: '添加',
  up: '上移', down: '下移', del: '删除', edit: '重命名', save: '保存', openLive: '在实时浏览器打开', openSys: '用系统浏览器打开',
  status: '状态', running: '运行中', stopped: '未运行', engine: '内核', port: 'DevTools 端口', headless: '无头', yes: '是', no: '否', tabs: '标签页', dataFile: '书签文件',
  omniPlaceholder: '搜索或输入网址', goTo: '前往', searchWith: '用 %e 搜索', fromHistory: '历史', fromBookmarks: '书签', searchEngine: '地址栏搜索引擎', searchEngineHint: '地址栏里输入的不是网址时，用它搜索。网址（如 github.com）直接打开，书签名也可以直接输。', history: '地址栏历史', historyCount: '%n 条', clearHistory: '清除历史', cleared: '已清除',
  help: '后台 Chrome 由本插件拉起，模型通过 Playwright MCP 操作它；它每次导航都会自动在右侧栏展示。模型可用 open_url / quick_links 工具，你可用 /open <网址或书签名> 命令。',
}
const en = {
  tab: 'Live browser', guide: 'Live browser', guideDesc: 'Live view of the background Chrome: watch the model, take over anytime',
  open: 'Open live browser', notRunning: 'browser not running', starting: 'connecting…', restart: 'Restart browser',
  newTab: 'New tab', closeTab: 'Close tab', back: 'Back', forward: 'Forward', reload: 'Reload', go: 'Go',
  follow: 'Follow model', system: 'Open in system browser', noTabs: 'No pages open. Type a URL, or ask the model to browse.',
  hint: 'Clicks, scrolling and typing are forwarded to the background browser; press Esc to leave input focus.',
  nav: 'Browser', bookmarks: 'Bookmarks', addCurrent: 'Bookmark this page', noBookmarks: 'No bookmarks yet.', name: 'Name', url: 'URL (http/https)', add: 'Add',
  up: 'Up', down: 'Down', del: 'Delete', edit: 'Rename', save: 'Save', openLive: 'Open in live browser', openSys: 'Open in system browser',
  status: 'Status', running: 'running', stopped: 'not running', engine: 'Engine', port: 'DevTools port', headless: 'Headless', yes: 'yes', no: 'no', tabs: 'Tabs', dataFile: 'Bookmarks file',
  omniPlaceholder: 'Search or type a URL', goTo: 'Go to', searchWith: 'Search with %e', fromHistory: 'History', fromBookmarks: 'Bookmarks', searchEngine: 'Address-bar search engine', searchEngineHint: 'Used when what you type is not an address. Addresses (github.com) open directly; a bookmark name works too.', history: 'Address-bar history', historyCount: '%n entries', clearHistory: 'Clear history', cleared: 'cleared',
  help: 'This plugin starts the background Chrome; the model drives it through Playwright MCP, and every navigation is shown in the right sidebar automatically. The model can use the open_url / quick_links tools, you can type /open <url or bookmark name>.',
}

const CSS = `
.mwb{display:flex;flex-direction:column;height:100%;min-height:0;background:var(--dsw-alias-bg-base)}
.mwb-bar{display:flex;gap:4px;align-items:center;padding:5px 8px 0;flex:none}
.mwb-bar2{display:flex;gap:4px;align-items:center;padding:4px 8px 5px;border-bottom:0.5px solid var(--dsw-alias-border-l2);flex:none}
.mwb-bar select{flex:1;min-width:0}
.mwb-bar select{background:var(--dsw-alias-bg-layer-2);border:0.5px solid var(--dsw-alias-border-l2);border-radius:8px;color:inherit;font:inherit;font-size:12px;padding:3px 6px}
.mwb-in{flex:1;min-width:120px;background:var(--dsw-alias-bg-layer-2);border:0.5px solid var(--dsw-alias-border-l2);border-radius:8px;padding:4px 8px;font:inherit;font-size:12px;color:inherit;font-family:ui-monospace,Menlo,monospace}
.mwb-in:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
.mwb-omni{position:relative;flex:1;min-width:140px;display:flex}
.mwb-omni .mwb-in{width:100%;font-family:inherit;font-size:12.5px;padding-left:26px}
.mwb-omni .lead{position:absolute;left:8px;top:50%;transform:translateY(-50%);color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));pointer-events:none;display:inline-flex}
.mwb-sugg{position:absolute;left:0;right:0;top:calc(100% + 4px);background:var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-layer-1));color:var(--dsw-alias-label-primary);border:0.5px solid var(--dsw-alias-border-l2);border-radius:12px;box-shadow:var(--dsw-elevation-prominent,0 10px 40px rgba(0,0,0,.28));padding:6px;z-index:1100;font-size:12.5px;max-height:min(50vh,420px);overflow:auto}
.mwb-sugg .row{display:flex;align-items:center;gap:8px;width:100%;border:0;background:transparent;color:inherit;padding:6px 8px;border-radius:8px;cursor:pointer;text-align:left;font:inherit;font-size:12.5px}
.mwb-sugg .row.sel,.mwb-sugg .row:hover{background:var(--dsw-alias-interactive-bg-hover)}
.mwb-sugg .row .ic{flex:none;color:var(--dsw-alias-label-secondary);display:inline-flex}
.mwb-sugg .row .main{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwb-sugg .row .sub{flex:none;max-width:45%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary);font-size:11.5px}
.mwb-sugg .grp{font-size:11px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));padding:6px 8px 2px}
.mwb-b{border:0;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;width:26px;height:26px;padding:0;display:inline-flex;align-items:center;justify-content:center;border-radius:6px}
.mwb-b:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}
.mwb-b:disabled{opacity:.4;cursor:default}
.mwb-b.on{color:var(--dsw-alias-brand-primary)}
.mwb-view{flex:1;min-height:0;position:relative;display:flex;align-items:flex-start;justify-content:center;background:#1a1a1a;overflow:hidden;outline:none}
.mwb-view:focus-visible{box-shadow:inset 0 0 0 2px var(--dsw-alias-brand-primary)}
.mwb-img{max-width:100%;max-height:100%;object-fit:contain;display:block;cursor:default;user-select:none;-webkit-user-drag:none}
.mwb-msg{flex:1;display:flex;flex-direction:column;gap:10px;align-items:center;justify-content:center;padding:24px;text-align:center;color:var(--dsw-alias-label-secondary);line-height:1.7;font-size:12.5px}
.mwb-foot{flex:none;font-size:11px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));padding:3px 8px;border-top:0.5px solid var(--dsw-alias-border-l2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mwb-composer{display:inline-flex;align-items:center;justify-content:center;background:transparent;border:0;border-radius:8px;width:28px;height:28px;padding:0;cursor:pointer;color:var(--dsw-alias-label-secondary)}
.mwb-composer:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.mwb-bm{position:relative;display:inline-flex}
.mwb-menu{position:absolute;top:30px;right:0;min-width:240px;max-width:340px;background:var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-layer-1));color:var(--dsw-alias-label-primary);border-radius:12px;box-shadow:var(--dsw-elevation-prominent,0 10px 40px rgba(0,0,0,.28));padding:6px;z-index:1100;font-size:13px;text-align:left}
.mwb-menu .hd{font-size:11px;color:var(--dsw-alias-label-secondary);padding:4px 8px 6px}
.mwb-item{display:flex;align-items:center;gap:8px;width:100%;border:0;background:transparent;color:inherit;padding:7px 8px;border-radius:8px;cursor:pointer;text-align:left;font:inherit}
.mwb-item:hover{background:var(--dsw-alias-interactive-bg-hover)}
.mwb-item .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwb-item .host{font-size:11px;color:var(--dsw-alias-label-secondary);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwb-empty{padding:8px;color:var(--dsw-alias-label-secondary)}
.mwb-set{font-size:13px;display:flex;flex-direction:column;gap:10px}
.mwb-hint{color:var(--dsw-alias-label-secondary);line-height:1.6}
.mwb-hint code{font-family:ui-monospace,Menlo,monospace;font-size:11.5px}
.mwb-title{font-size:13px;font-weight:600;margin-top:6px}
.mwb-kv{display:grid;grid-template-columns:140px 1fr;gap:4px 10px;align-items:center}
.mwb-kv .k{color:var(--dsw-alias-label-secondary)}
.mwb-kv .v{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwb-row{display:flex;gap:8px;align-items:center;padding:6px 8px;border-radius:8px}
.mwb-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
.mwb-row .nm{font-weight:600;min-width:120px}
.mwb-row .u{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary);font-family:ui-monospace,Menlo,monospace;font-size:11.5px}
.mwb-mini{border:0;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:12px;padding:0 6px;height:24px;display:inline-flex;align-items:center;gap:4px;border-radius:6px;font-family:inherit}
.mwb-mini:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}
.mwb-mini:disabled{opacity:.4;cursor:default}
.mwb-mini.danger{color:var(--dsw-alias-state-error-primary)}
.mwb-mini.framed{border:0.5px solid var(--dsw-alias-border-l2)}
.mwb-form{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.mwb-form .mwb-in{flex:1;min-width:140px}
.mwb-primary{border:0;border-radius:8px;background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary));color:var(--dsw-alias-label-primary-inverted,#fff);padding:6px 14px;cursor:pointer;font:inherit;font-weight:600}
.mwb-primary:disabled{opacity:.5;cursor:default}
.mwb-err{color:var(--dsw-alias-state-error-primary);font-size:12px}
`

function injectStyles() {
  const el = document.createElement('style'); el.setAttribute('data-plugin', PLUGIN); el.textContent = CSS
  document.head.appendChild(el); return () => { el.remove() }
}
async function api(path, body) {
  const res = await fetch(API + path, body === undefined ? { method: 'GET' } : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data && data.error ? data.error : 'HTTP ' + res.status)
  return data
}
function hostOf(url) { try { return new URL(url).host || url } catch { return url } }
function normalizeUrl(input) {
  const raw = String(input || '').trim()
  if (!raw) return null
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : 'https://' + raw
  let u
  try { u = new URL(withScheme) } catch { return null }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
  if (u.username || u.password) return null
  return u.toString()
}
function mods(e) { return (e.altKey ? 1 : 0) | (e.ctrlKey ? 2 : 0) | (e.metaKey ? 4 : 0) | (e.shiftKey ? 8 : 0) }

exports.name = PLUGIN
exports.inject = ['slots', 'locale', 'sidebarRight', 'sidebarRightTabs']

exports.apply = function apply(ctx) {
  ctx.effect(() => injectStyles(), `${PLUGIN}: stylesheet`)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), `${PLUGIN}: dictionaries`)
  const t = ctx.locale.bind(NS)
  const h = React.createElement

  // ---- bookmarks (shared by the address-bar menu and the settings tab) ----
  const bm = { items: [], dataPath: '', allowSystem: true, loaded: false }
  const bmSubs = new Set()
  const bmSet = (patch) => { Object.assign(bm, patch); bmSubs.forEach((fn) => { try { fn() } catch { /* ignore */ } }) }
  function useBookmarks() {
    const [, force] = React.useState(0)
    React.useEffect(() => { const fn = () => force((n) => n + 1); bmSubs.add(fn); if (!bm.loaded) loadBookmarks(); return () => { bmSubs.delete(fn) } }, [])
    return bm
  }
  async function loadBookmarks() {
    try { const d = await api('/links/list'); bmSet({ items: d.items || [], dataPath: d.dataPath || '', allowSystem: d.allowSystem !== false, loaded: true }) } catch (e) { console.warn(`[${PLUGIN}] bookmarks failed`, e) }
  }
  const bmAdd = async (name, url) => { const d = await api('/links/add', { name, url }); bmSet({ items: bm.items.concat([d.item]) }); return d.item }
  const bmRename = async (id, name) => { const d = await api('/links/update', { id, name }); bmSet({ items: bm.items.map((x) => (x.id === id ? d.item : x)) }) }
  const bmMove = async (id, dir) => { const d = await api('/links/move', { id, dir }); bmSet({ items: d.items || bm.items }) }
  const bmRemove = async (id) => { await api('/links/remove', { id }); bmSet({ items: bm.items.filter((x) => x.id !== id) }) }
  /** Show a URL in the live browser (host reuses a blank tab or opens a new one; the watcher reveals it). */
  const openLive = (url) => api('/open', { url }).catch((e) => console.warn(`[${PLUGIN}] open failed`, e))
  const openSystem = (url) => api('/open', { url, target: 'system' }).catch(() => { try { window.open(url, '_blank', 'noopener') } catch { /* ignore */ } })

  function BookmarkMenu(props) {
    const { current, target } = props
    const [open, setOpen] = React.useState(false)
    const ref = React.useRef(null)
    const { items, allowSystem } = useBookmarks()
    React.useEffect(() => {
      if (!open) return undefined
      const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
      const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
      document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey)
      return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
    }, [open])
    const canAdd = !!(current && /^https?:/.test(current.url) && !items.some((x) => x.url === current.url))
    const go = (url, sys) => { setOpen(false); if (sys) { openSystem(url); return } if (target) api('/navigate', { target, url }).catch(() => openLive(url)); else openLive(url) }
    return h('div', { ref, className: 'mwb-bm' },
      h('button', { className: 'mwb-b' + (open ? ' on' : ''), title: t('bookmarks'), onClick: () => setOpen(!open) }, icon('bookmark', { size: 14 })),
      open ? h('div', { className: 'mwb-menu' },
        h('div', { className: 'hd' }, t('bookmarks')),
        items.length === 0 ? h('div', { className: 'mwb-empty' }, t('noBookmarks')) : items.map((it) => h('button', { key: it.id, className: 'mwb-item', title: it.url, onClick: (e) => go(it.url, e.altKey) },
          h('span', { className: 'nm' }, it.name), h('span', { className: 'host' }, hostOf(it.url)),
          allowSystem ? h('span', { className: 'mwb-b', title: t('openSys'), style: { width: 22, height: 22 }, onClick: (e) => { e.stopPropagation(); go(it.url, true) } }, icon('external-link', { size: 12 })) : null)),
        canAdd ? h('button', { className: 'mwb-item', onClick: () => { bmAdd(current.title || hostOf(current.url), current.url); setOpen(false) } }, icon('bookmark-plus', { size: 14 }), h('span', { className: 'nm' }, t('addCurrent'))) : null,
      ) : null,
    )
  }

  /**
   * Chrome-like omnibox: shows the page URL trimmed (no scheme / www / trailing slash) until
   * focused, selects all on focus, completes the top history match inline, suggests history and
   * bookmarks while typing, and sends non-URLs to the chosen search engine (host /omni/go).
   */
  function Omnibox(props) {
    const { target, currentUrl, onNavigated, focusRef } = props
    const [draft, setDraft] = React.useState('')
    const [focused, setFocused] = React.useState(false)
    const [open, setOpen] = React.useState(false)
    const [hist, setHist] = React.useState([])
    const [sel, setSel] = React.useState(-1)
    const [engine, setEngine] = React.useState({ id: 'bing', name: 'Bing' })
    const inputRef = React.useRef(null)
    const completion = React.useRef(null) // { typed, full } last inline completion
    const seq = React.useRef(0)
    const { items: bookmarks } = useBookmarks()
    React.useEffect(() => { api('/prefs').then((p) => { const e = (p.engines || []).find((x) => x.id === p.searchEngine); if (e) setEngine(e) }).catch(() => {}) }, [])
    // Mirror the page URL while not editing.
    React.useEffect(() => { if (!focused) setDraft(currentUrl || '') }, [currentUrl, focused])
    const selectAllPending = React.useRef(false)
    React.useEffect(() => { if (!focused) return; const el = inputRef.current; if (el) { try { el.select() } catch { /* ignore */ } } }, [focused])
    React.useImperativeHandle(focusRef, () => ({ focus: () => { const el = inputRef.current; if (el) { selectAllPending.current = true; el.focus() } } }), [])

    const typed = draft.trim()
    const isUrl = typed && looksLikeUrlClient(typed)
    const bmHits = typed ? bookmarks.filter((b) => (b.name + ' ' + b.url).toLowerCase().includes(typed.toLowerCase())).slice(0, 3) : []
    const rows = []
    if (typed) rows.push(isUrl ? { kind: 'url', label: prettyUrlClient(typed), sub: t('goTo'), url: typed } : { kind: 'search', label: typed, sub: t('searchWith').replace('%e', engine.name), text: typed })
    for (const it of hist) rows.push({ kind: 'history', label: it.title || prettyUrlClient(it.url), sub: prettyUrlClient(it.url), url: it.url })
    for (const b of bmHits) if (!hist.some((it) => it.url === b.url)) rows.push({ kind: 'bookmark', label: b.name, sub: prettyUrlClient(b.url), url: b.url })

    const fetchHist = (text) => {
      const my = ++seq.current
      if (!text.trim()) { setHist([]); return }
      api('/history/search?q=' + encodeURIComponent(text.trim()) + '&limit=6').then((d) => { if (my !== seq.current) return; setHist(d.items || []); maybeComplete(text, d.items || []) }).catch(() => {})
    }
    // Inline completion (Chrome): when the top history hit's pretty URL starts with what was typed,
    // fill the rest and select it so the next keystroke replaces it.
    const maybeComplete = (text, items) => {
      const el = inputRef.current; if (!el || document.activeElement !== el) return
      const top = items[0]; const c = completion.current
      if (!top || !top.prefix || !c || c.typed !== text) return
      const full = prettyUrlClient(top.url)
      if (!full.toLowerCase().startsWith(text.toLowerCase()) || full.length === text.length) return
      const value = text + full.slice(text.length)
      setDraft(value); completion.current = { typed: text, full: value }
      requestAnimationFrame(() => { try { el.setSelectionRange(text.length, value.length) } catch { /* ignore */ } })
    }
    const onChange = (e) => {
      const value = e.target.value
      const deleting = e.nativeEvent && /delete/i.test(e.nativeEvent.inputType || '')
      setDraft(value); setSel(-1); setOpen(true)
      completion.current = deleting ? null : { typed: value, full: null }
      fetchHist(value)
    }
    const go = async (row) => {
      const text = row ? (row.kind === 'search' ? row.text : row.url) : draft.trim()
      if (!text) return
      setOpen(false); setSel(-1)
      try {
        const r = await api('/omni/go', { target: target || undefined, text })
        if (r && r.url) { setDraft(r.url); onNavigated && onNavigated(r.url) }
        const el = inputRef.current; if (el) el.blur()
      } catch (err) { console.warn('[' + PLUGIN + '] omnibox failed', err) }
    }
    const onKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!rows.length) return
        e.preventDefault(); setOpen(true)
        const next = e.key === 'ArrowDown' ? (sel + 1) % rows.length : (sel - 1 + rows.length) % rows.length
        setSel(next); const r = rows[next]; setDraft(r.kind === 'search' ? r.text : r.url); completion.current = null
        return
      }
      if (e.key === 'Enter') { e.preventDefault(); go(sel >= 0 ? rows[sel] : null); return }
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); setSel(-1); setDraft(currentUrl || ''); const el = inputRef.current; if (el) el.blur(); return }
      if (e.key === 'Tab' && completion.current && completion.current.full) { e.preventDefault(); const el = inputRef.current; if (el) el.setSelectionRange(draft.length, draft.length); completion.current = null }
    }
    const ic = (kind) => icon(kind === 'search' ? 'search' : kind === 'history' ? 'history' : kind === 'bookmark' ? 'bookmark' : 'globe', { size: 13 })
    return h('div', { className: 'mwb-omni' },
      h('span', { className: 'lead' }, icon(isUrl || !typed ? 'globe' : 'search', { size: 13 })),
      h('input', { ref: inputRef, className: 'mwb-in', placeholder: t('omniPlaceholder'), value: focused ? draft : prettyUrlClient(draft), spellCheck: false, autoComplete: 'off',
        onChange, onKeyDown,
        onMouseDown: () => { if (document.activeElement !== inputRef.current) selectAllPending.current = true },
        onMouseUp: (e) => { if (selectAllPending.current) { e.preventDefault(); selectAllPending.current = false; try { e.target.select() } catch { /* ignore */ } } },
        onFocus: () => { setFocused(true); setDraft(currentUrl || '') },
        onBlur: () => { setFocused(false); setTimeout(() => setOpen(false), 120) } }),
      open && rows.length ? h('div', { className: 'mwb-sugg' }, rows.map((r, i) => h('button', { key: r.kind + ':' + (r.url || r.text) + i, type: 'button', className: 'row' + (i === sel ? ' sel' : ''), onMouseDown: (e) => e.preventDefault(), onClick: () => go(r), onMouseEnter: () => setSel(i) },
        h('span', { className: 'ic' }, ic(r.kind)), h('span', { className: 'main' }, r.label), h('span', { className: 'sub' }, r.sub)))) : null,
    )
  }
  function looksLikeUrlClient(text) {
    const s = String(text || '').trim()
    if (!s || /\s/.test(s)) return false
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) return true
    const host = s.split(/[/?#]/)[0]
    return /^localhost(:\d+)?$/i.test(host) || /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(host) || /^[\w-]+(\.[\w-]+)+(:\d+)?$/.test(host)
  }
  function prettyUrlClient(url) { return String(url || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '') }

  function LiveBrowser(props) {
    const [status, setStatus] = React.useState(null)
    const [target, setTarget] = React.useState(null)
    const [follow, setFollow] = React.useState(true)
    const [frame, setFrame] = React.useState(null) // { data, metadata }
    const [draft, setDraft] = React.useState('')
    const [conn, setConn] = React.useState('idle')
    const omniRef = React.useRef(null)
    const imgRef = React.useRef(null)
    const viewRef = React.useRef(null)
    const queue = React.useRef([])
    const flushTimer = React.useRef(null)
    const lastMove = React.useRef(0)
    const targetRef = React.useRef(null)
    targetRef.current = target
    const running = !!(status && status.running)

    const refresh = React.useCallback(async () => {
      try {
        const s = await api('/status'); setStatus(s)
        if (s.running) {
          const ids = s.targets.map((x) => x.id)
          // Keep the viewed tab while it exists; following the model is driven by
          // the activity events (created / navigated), not by list order.
          setTarget((cur) => (cur && ids.includes(cur) ? cur : (ids.length ? ids[0] : null)))
        }
      } catch (e) { setStatus({ running: false, error: String(e.message || e) }) }
    }, [])
    // Follow the model: a page it creates or navigates becomes the viewed target right away.
    React.useEffect(() => {
      refresh()
      const id = setInterval(refresh, 5000)
      const off = onActivity((ev) => {
        if (follow && ev && (ev.type === 'created' || ev.type === 'changed') && ev.targetId && ev.url && ev.url !== 'about:blank') setTarget(ev.targetId)
        refresh()
      })
      return () => { clearInterval(id); off() }
    }, [refresh, follow])

    // The page viewport follows the pane: measure the view box and ask the host to resize the
    // target (debounced), also whenever the viewed target changes. Frames then fill the pane.
    const sizeRef = React.useRef(null)
    const sendSize = React.useCallback((id, w, h) => {
      if (!id || w < 50 || h < 50) return
      const scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1))
      api('/resize', { target: id, width: Math.floor(w), height: Math.floor(h), scale }).catch(() => {})
    }, [])
    React.useEffect(() => {
      const el = viewRef.current
      if (!el || !target) return undefined
      let timer = null
      const measure = () => { const r = el.getBoundingClientRect(); const next = { w: Math.floor(r.width), h: Math.floor(r.height) }; if (sizeRef.current && Math.abs(sizeRef.current.w - next.w) < 4 && Math.abs(sizeRef.current.h - next.h) < 4) return; sizeRef.current = next; sendSize(target, next.w, next.h) }
      const ro = new ResizeObserver(() => { if (timer) clearTimeout(timer); timer = setTimeout(measure, 250) })
      ro.observe(el)
      sizeRef.current = null; measure()
      return () => { ro.disconnect(); if (timer) clearTimeout(timer) }
    }, [target, sendSize, running])

    // SSE frames for the active target.
    React.useEffect(() => {
      if (!target) { setFrame(null); return undefined }
      setConn('connecting')
      const es = new EventSource(`${API}/stream?target=${encodeURIComponent(target)}`)
      es.onmessage = (ev) => {
        let msg; try { msg = JSON.parse(ev.data) } catch { return }
        if (msg.type === 'frame') { setFrame({ data: msg.data, metadata: msg.metadata }); setConn('live') }
        else if (msg.type === 'nav') { lastUrl.current = target + '|' + msg.url; setDraft(msg.url === 'about:blank' ? '' : msg.url); refresh() }
        else if (msg.type === 'closed') { setConn('closed'); refresh() }
        else if (msg.type === 'error') { setConn('error:' + msg.message) }
      }
      es.onerror = () => { setConn((c) => (c === 'live' ? 'reconnecting' : c)) }
      return () => { es.close() }
    }, [target])

    // Mirror the page URL into the address bar only when it actually changes,
    // so a half-typed address survives status polls and button clicks.
    const lastUrl = React.useRef(null)
    React.useEffect(() => {
      if (!status || !status.running || !target) return
      const tinfo = status.targets.find((x) => x.id === target)
      if (!tinfo) return
      const key = target + '|' + tinfo.url
      if (lastUrl.current === key) return
      lastUrl.current = key
      setDraft(tinfo.url === 'about:blank' ? '' : tinfo.url)
    }, [status, target])

    const flush = () => {
      flushTimer.current = null
      const ev = queue.current; queue.current = []
      const id = targetRef.current
      if (!id || ev.length === 0) return
      api('/input', { target: id, events: ev }).catch(() => {})
    }
    const push = (e, immediate) => {
      queue.current.push(e)
      if (immediate) { if (flushTimer.current) { clearTimeout(flushTimer.current) } flush() }
      else if (!flushTimer.current) flushTimer.current = setTimeout(flush, 40)
    }
    const pageXY = (e) => {
      const img = imgRef.current; const m = frame && frame.metadata
      if (!img || !m) return null
      const r = img.getBoundingClientRect()
      const sx = m.deviceWidth / r.width; const sy = m.deviceHeight / r.height
      return { x: Math.max(0, Math.round((e.clientX - r.left) * sx)), y: Math.max(0, Math.round((e.clientY - r.top) * sy)) }
    }
    const btn = (e) => (e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left')
    const onMouseDown = (e) => { const p = pageXY(e); if (!p) return; e.preventDefault(); viewRef.current && viewRef.current.focus(); push({ kind: 'mouse', type: 'mousePressed', ...p, button: btn(e), buttons: e.buttons, clickCount: e.detail || 1, modifiers: mods(e) }, true) }
    const onMouseUp = (e) => { const p = pageXY(e); if (!p) return; push({ kind: 'mouse', type: 'mouseReleased', ...p, button: btn(e), buttons: e.buttons, clickCount: e.detail || 1, modifiers: mods(e) }, true) }
    const onMouseMove = (e) => { const now = Date.now(); if (now - lastMove.current < 50) return; lastMove.current = now; const p = pageXY(e); if (!p) return; push({ kind: 'mouse', type: 'mouseMoved', ...p, buttons: e.buttons, modifiers: mods(e) }) }
    const onWheel = (e) => { const p = pageXY(e); if (!p) return; e.preventDefault(); push({ kind: 'mouse', type: 'mouseWheel', ...p, deltaX: Math.round(e.deltaX), deltaY: Math.round(e.deltaY), modifiers: mods(e) }, true) }
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'l' || e.key === 'L')) { e.preventDefault(); omniRef.current && omniRef.current.focus(); return }
      if (e.key === 'Escape') { e.preventDefault(); viewRef.current && viewRef.current.blur(); return }
      if (['Enter', 'Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) { e.preventDefault(); push({ kind: 'key', key: e.key, modifiers: mods(e) }, true); return }
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) { e.preventDefault(); push({ kind: 'text', text: e.key }, true) }
    }
    const onPaste = (e) => { const txt = e.clipboardData && e.clipboardData.getData('text'); if (txt) { e.preventDefault(); push({ kind: 'text', text: txt }, true) } }

    const act = (path, extra) => () => { if (!target) return; api(path, { target, ...(extra || {}) }).then(refresh).catch(() => {}) }
    const newTab = async () => { setFollow(false); try { const tinfo = await api('/new-tab', {}); await refresh(); if (tinfo && tinfo.id) setTarget(tinfo.id) } catch { /* ignore */ } }
    const current = status && status.running ? status.targets.find((x) => x.id === target) : null

    // openTab(KIND, { params: { url } }) from other plugins (quick links, open_url, /open):
    // navigate the active page, or open a first tab when none exists.
    const info = typeof props.useTabInfo === 'function' ? props.useTabInfo() : null
    const nav = info && info.tab ? info.tab.navigation : null
    const wantedUrl = nav && nav.params && nav.params.url ? String(nav.params.url) : null
    const navRev = nav ? nav.revision : 0
    const handledRev = React.useRef(-1)
    React.useEffect(() => {
      if (!wantedUrl || !running || handledRev.current === navRev) return
      handledRev.current = navRev
      ;(async () => {
        const id = targetRef.current
        if (id) { await api('/navigate', { target: id, url: wantedUrl }); setDraft(wantedUrl); return }
        const t = await api('/new-tab', { url: wantedUrl }); await refresh(); if (t && t.id) setTarget(t.id)
      })().catch((e) => setConn('error:' + e.message))
    }, [wantedUrl, navRev, running])

    if (!status) return h('div', { className: 'mwb' }, h('div', { className: 'mwb-msg' }, t('starting')))
    if (!status.running) {
      return h('div', { className: 'mwb' }, h('div', { className: 'mwb-msg' }, h('div', null, t('notRunning')), h('div', { style: { fontSize: 11.5 } }, status.error || ''), h('button', { className: 'mwb-b on', onClick: () => api('/restart', {}).then(refresh).catch(refresh) }, t('restart'))))
    }
    return h('div', { className: 'mwb' },
      h('div', { className: 'mwb-bar' },
        h('select', { value: target || '', onChange: (e) => { setFollow(false); setTarget(e.target.value || null) }, title: 'tabs' },
          status.targets.length === 0 ? h('option', { value: '' }, '—') : null,
          status.targets.map((x) => h('option', { key: x.id, value: x.id }, (x.title || hostOf(x.url) || 'about:blank').slice(0, 40)))),
        h('button', { className: 'mwb-b', title: t('newTab'), onClick: newTab }, icon('plus', { size: 14 })),
        h('button', { className: 'mwb-b', title: t('closeTab'), disabled: !target, onClick: act('/close-tab') }, icon('x', { size: 14 })),
        h('button', { className: 'mwb-b' + (follow ? ' on' : ''), title: t('follow'), onClick: () => setFollow(!follow) }, icon('crosshair', { size: 14 })),
      ),
      h('div', { className: 'mwb-bar2' },
        h('button', { className: 'mwb-b', title: t('back'), disabled: !target, onClick: act('/back') }, icon('arrow-left', { size: 14 })),
        h('button', { className: 'mwb-b', title: t('forward'), disabled: !target, onClick: act('/forward') }, icon('arrow-right', { size: 14 })),
        h('button', { className: 'mwb-b', title: t('reload'), disabled: !target, onClick: act('/reload') }, icon('refresh-cw', { size: 13 })),
        h(Omnibox, { target, currentUrl: draft, focusRef: omniRef, onNavigated: (url) => { setDraft(url); refresh() } }),
        h(BookmarkMenu, { current, target }),
        h('button', { className: 'mwb-b', title: t('system'), disabled: !current || !/^https?:/.test(current.url), onClick: () => { if (current) openSystem(current.url) } }, icon('external-link', { size: 14 })),
      ),
      status.targets.length === 0 || !target
        ? h('div', { className: 'mwb-msg' }, t('noTabs'))
        : h('div', { ref: viewRef, className: 'mwb-view', tabIndex: 0, onKeyDown, onPaste, onContextMenu: (e) => e.preventDefault() },
          frame ? h('img', { ref: imgRef, className: 'mwb-img', src: 'data:image/jpeg;base64,' + frame.data, draggable: false, onMouseDown, onMouseUp, onMouseMove, onWheel, alt: '' }) : h('div', { className: 'mwb-msg' }, conn === 'connecting' ? t('starting') : conn)),
      h('div', { className: 'mwb-foot' }, (current ? (current.title ? current.title + ' · ' : '') + current.url : '') + (conn.startsWith('error') ? ' · ' + conn : '') + ' · ' + t('hint')),
    )
  }

  /** Guide capsule glyph in dsh's own idiom (the terminal is a dark tile with one bold white ">_"): a dark tile with one bold white globe. */
  function LiveBrowserGuideIcon(props) {
    const size = props && props.size ? props.size : 26
    return h('svg', { width: size, height: size, className: props && props.className, viewBox: '0 0 28 28', fill: 'none', 'aria-hidden': 'true' },
      h('rect', { x: 3, y: 5, width: 22, height: 19, rx: 3, fill: '#17191d' }),
      h('circle', { cx: 14, cy: 14.5, r: 5.6, stroke: '#fff', strokeWidth: 1.7 }),
      h('path', { d: 'M8.4 14.5h11.2M14 8.9c-2.5 3.1-2.5 8.1 0 11.2M14 8.9c2.5 3.1 2.5 8.1 0 11.2', stroke: '#fff', strokeWidth: 1.5, strokeLinecap: 'round' }),
    )
  }
  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: PLUGIN, kind: KIND, title: () => t('tab'),
    guide: [{ order: 55, title: () => t('guide'), description: () => t('guideDesc'), icon: LiveBrowserGuideIcon }],
  }), `${PLUGIN}: tab type`)
  ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({ name: 'sidebar.right.pane.tab', key: PLUGIN }, function MyworkLiveBrowser(props) { return h(LiveBrowser, props) }))

  // Composer button + auto-reveal: when the model navigates the background
  // browser (targets / URLs change), open or focus the live tab for this
  // session so the user actually sees it — without them having to click.
  // One shared activity feed per page: every page created / navigated / closed in
  // the background browser arrives here immediately (SSE from the host's CDP
  // target watcher). Consumers: the live tab (refresh targets) and the composer
  // button (auto-reveal the tab for the current session).
  const activity = { subs: new Set(), es: null }
  const onActivity = (fn) => { activity.subs.add(fn); return () => { activity.subs.delete(fn) } }
  ctx.effect(() => {
    let es = null; let retry = null
    const open = () => {
      es = new EventSource(`${API}/events`)
      activity.es = es
      es.onmessage = (ev) => { let msg; try { msg = JSON.parse(ev.data) } catch { return }; activity.subs.forEach((fn) => { try { fn(msg) } catch { /* ignore */ } }) }
      es.onerror = () => { es.close(); retry = setTimeout(open, 5000) }
    }
    open()
    return () => { if (retry) clearTimeout(retry); if (es) es.close(); activity.es = null }
  }, `${PLUGIN}: activity feed`)

  function LiveBrowserButton(props) {
    const sessionId = props && props.sessionId
    React.useEffect(() => {
      let lastReveal = 0
      return onActivity((ev) => {
        if (ev.type === 'destroyed' || !ev.url || ev.url === 'about:blank') return
        const now = Date.now()
        if (now - lastReveal < 800) return
        lastReveal = now
        try {
          if (sessionId && typeof ctx.sidebarRight.openTabIn === 'function') ctx.sidebarRight.openTabIn(sessionId, KIND)
          else ctx.sidebarRight.openTab(KIND)
        } catch { /* no session pane mounted */ }
      })
    }, [sessionId])
    return h('button', { type: 'button', className: 'mwb-composer', title: t('open'), onClick: () => { try { ctx.sidebarRight.openTab(KIND) } catch (e) { console.warn('[dsh-mywork-browser] open tab failed', e) } } }, icon('globe'))
  }
  ctx.slots.inject('conversation.input.right', () => ctx.slots.register({ name: 'conversation.input.right', id: PLUGIN, order: 42 }, function MyworkLiveBrowserButton(props) { return h(LiveBrowserButton, { sessionId: props && props.sessionId }) }))

  // ---- Settings → MyWork → 浏览器 ------------------------------------------
  function BrowserSettings() {
    const { items, dataPath } = useBookmarks()
    const [status, setStatus] = React.useState(null)
    const [nm, setNm] = React.useState(''); const [url, setUrl] = React.useState(''); const [err, setErr] = React.useState('')
    const [editing, setEditing] = React.useState(null); const [editName, setEditName] = React.useState('')
    const refresh = React.useCallback(() => api('/status').then(setStatus).catch((e) => setStatus({ running: false, error: String(e.message || e) })), [])
    React.useEffect(() => { refresh(); return onActivity(() => { refresh() }) }, [refresh])
    const add = async () => {
      setErr('')
      const u = normalizeUrl(url)
      if (!u) { setErr(t('url')); return }
      try { await bmAdd(nm, u); setNm(''); setUrl('') } catch (e) { setErr(String(e.message || e)) }
    }
    const [prefs, setPrefs] = React.useState(null); const [msg, setMsg] = React.useState('')
    const loadPrefs = React.useCallback(() => api('/prefs').then(setPrefs).catch(() => {}), [])
    React.useEffect(() => { loadPrefs() }, [loadPrefs])
    const setEngine = (id) => api('/prefs', { searchEngine: id }).then(setPrefs).catch((e) => setErr(String(e.message || e)))
    const clearHistory = () => api('/history/clear', {}).then(() => { setMsg(t('cleared')); loadPrefs() }).catch((e) => setErr(String(e.message || e)))
    const kv = (k, v) => h(React.Fragment, { key: k }, h('span', { className: 'k' }, k), h('span', { className: 'v', title: String(v) }, String(v)))
    return h('div', { className: 'mwb-set' },
      h('div', { className: 'mwb-hint' }, t('help')),
      h('div', { className: 'mwb-title' }, t('status')),
      status ? h('div', { className: 'mwb-kv' },
        kv(t('status'), status.running ? t('running') : t('stopped') + (status.error ? ' · ' + status.error : '')),
        status.running ? kv(t('engine'), status.browser || status.executable || '—') : null,
        status.running ? kv(t('port'), status.port) : null,
        status.running ? kv(t('headless'), status.headless ? t('yes') : t('no')) : null,
        status.running ? kv(t('tabs'), status.targets.length) : null,
      ) : h('div', { className: 'mwb-hint' }, t('starting')),
      h('div', null,
        h('button', { className: 'mwb-mini framed', onClick: () => api('/restart', {}).then(refresh).catch(refresh) }, icon('refresh-cw', { size: 12 }), t('restart')),
        ' ',
        h('button', { className: 'mwb-mini framed', onClick: () => { try { ctx.sidebarRight.openTab(KIND) } catch { /* ignore */ } } }, icon('globe', { size: 12 }), t('open')),
      ),
      h('div', { className: 'mwb-title' }, t('searchEngine')),
      h('div', { className: 'mwb-hint' }, t('searchEngineHint')),
      prefs ? h('div', { className: 'mwb-form' },
        h('select', { className: 'mwb-in', style: { flex: 'none', width: 180 }, value: prefs.searchEngine, onChange: (e) => setEngine(e.target.value) }, prefs.engines.map((e) => h('option', { key: e.id, value: e.id }, e.name))),
        h('span', { className: 'mwb-hint' }, t('history') + ' · ' + t('historyCount').replace('%n', String(prefs.historyCount))),
        h('button', { className: 'mwb-mini framed danger', disabled: !prefs.historyCount, onClick: clearHistory }, icon('trash', { size: 12 }), t('clearHistory')),
        msg ? h('span', { className: 'mwb-hint' }, msg) : null,
      ) : null,
      h('div', { className: 'mwb-title' }, t('bookmarks')),
      h('div', null, items.length === 0 ? h('div', { className: 'mwb-empty' }, t('noBookmarks')) : items.map((it, i) => h('div', { className: 'mwb-row', key: it.id },
        editing === it.id
          ? h('input', { className: 'mwb-in', style: { width: 160, flex: 'none' }, value: editName, autoFocus: true, onChange: (e) => setEditName(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') { bmRename(it.id, editName); setEditing(null) } if (e.key === 'Escape') setEditing(null) } })
          : h('span', { className: 'nm' }, it.name),
        h('span', { className: 'u', title: it.url }, it.url),
        h('button', { className: 'mwb-mini', title: t('openLive'), onClick: () => openLive(it.url) }, icon('square-arrow-out', { size: 13 })),
        editing === it.id ? h('button', { className: 'mwb-mini', onClick: () => { bmRename(it.id, editName); setEditing(null) } }, t('save')) : h('button', { className: 'mwb-mini', title: t('edit'), onClick: () => { setEditing(it.id); setEditName(it.name) } }, icon('pencil', { size: 13 })),
        h('button', { className: 'mwb-mini', title: t('up'), disabled: i === 0, onClick: () => bmMove(it.id, -1) }, icon('chevron-up', { size: 13 })),
        h('button', { className: 'mwb-mini', title: t('down'), disabled: i === items.length - 1, onClick: () => bmMove(it.id, 1) }, icon('chevron-down', { size: 13 })),
        h('button', { className: 'mwb-mini danger', title: t('del'), onClick: () => bmRemove(it.id) }, icon('trash', { size: 13 })),
      ))),
      h('div', { className: 'mwb-form' },
        h('input', { className: 'mwb-in', placeholder: t('name'), value: nm, onChange: (e) => setNm(e.target.value) }),
        h('input', { className: 'mwb-in', placeholder: t('url'), value: url, onChange: (e) => setUrl(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') add() } }),
        h('button', { className: 'mwb-primary', disabled: !normalizeUrl(url), onClick: add }, t('add')),
      ),
      err ? h('div', { className: 'mwb-err' }, err) : null,
      h('div', { className: 'mwb-hint' }, t('dataFile'), ' ', h('code', null, dataPath || '…')),
    )
  }
  ctx.slots.inject(TAB_SLOT, () => ctx.slots.register({
    name: TAB_SLOT, id: 'browser', order: 40, label: () => t('nav'),
  }, function MyworkBrowserTab() { return h(BrowserSettings) }))
}
