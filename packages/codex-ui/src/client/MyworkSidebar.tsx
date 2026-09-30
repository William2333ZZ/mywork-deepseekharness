/**
 * MyWork v2 sidebar: the Manus / Muse shape. One button to start a task, four pages,
 * the task list, settings. No workspaces, no conversations, no extension menus: the
 * dsh conversation behind a task is reachable only through the task page's 「过程」.
 *
 * Tasks come from dsh-mywork-tasks (/mywork-tasks/api/tasks); navigation into that
 * plugin's pages goes through window events so neither package imports the other.
 */
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import { CircleCheck, CircleX, Clock, History, ListChecks, Loader, PanelLeft, Plus, Sun } from 'lucide-react'
import type { CodexSidebarProps } from './CodexSidebar.tsx'

export const V2_STORAGE_KEY = 'dsh-mywork:v2'
export function v2Active(): boolean { try { return localStorage.getItem(V2_STORAGE_KEY) !== 'off' } catch { return true } }

export const MYWORK_PANELS = { today: 'mywork-today', create: 'mywork-new', tasks: 'mywork-tasks', deliverables: 'mywork-deliverables', routines: 'mywork-routines', scenarios: 'mywork-scenarios' } as const
const API = '/mywork-tasks/api/tasks'
const FAST_MS = 4000
const SLOW_MS = 30000

type SidebarTask = { id: string; title: string; status: string; statusLabel: string; error: string; currentStep: string; finishedAt: string; createdAt: string; scenario?: string; routineId?: string }
type SidebarProps = Pick<CodexSidebarProps, 'selectPanel' | 'usePanelInfo' | 'collapsed' | 'width' | 'toggleSidebar' | 'renderSlot' | 't'>

const useLegacyPanelInfo = <T,>(selector: (info: { activePanelId: string | null }) => T): T => selector({ activePanelId: null })

const stylesheet = `
/* Tokens: design/v2/DESIGN.md §2. The sidebar is a --surface column beside a --bg page. */
.mws{--bg:#ffffff;--surface:#f6f5f4;--surface-2:#efedeb;--fg:rgba(0,0,0,.92);--fg-2:#31302e;--muted:#615d59;--meta:#75706a;--border:rgba(0,0,0,.1);--border-soft:rgba(0,0,0,.06);--accent:#0075de;--accent-on:#ffffff;--success:#178a30;--danger:#c0392b;--radius-sm:6px;--radius-md:8px;--focus-ring:0 0 0 3px rgba(0,117,222,.25);--motion-fast:150ms;--ease-standard:cubic-bezier(.2,0,0,1);width:100%;height:100%;min-width:0;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;background:var(--surface);color:var(--fg);box-shadow:inset -1px 0 var(--border-soft);font:14px/1.5 Geist,-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Noto Sans SC","Microsoft YaHei UI",sans-serif;-webkit-font-smoothing:antialiased}
body[data-ds-dark-theme] .mws{--bg:#191919;--surface:#202020;--surface-2:#2a2a2a;--fg:rgba(255,255,255,.9);--fg-2:#e6e4e0;--muted:#9b9893;--meta:#8a867f;--border:rgba(255,255,255,.1);--border-soft:rgba(255,255,255,.06);--accent:#529cca;--accent-on:#111111;--success:#4dab7a;--danger:#e26e63;--focus-ring:0 0 0 3px rgba(82,156,202,.35)}
.mws *{box-sizing:border-box}
.mws button{font-family:inherit;transition:background-color var(--motion-fast) var(--ease-standard),color var(--motion-fast) var(--ease-standard),border-color var(--motion-fast) var(--ease-standard),transform var(--motion-fast) var(--ease-standard)}
.mws button:active{transform:scale(.98)}
.mws :focus-visible{outline:none;box-shadow:var(--focus-ring);border-radius:var(--radius-sm)}
@media (prefers-reduced-motion:reduce){.mws *{transition:none!important;animation:none!important}}
.mws-head{display:flex;align-items:center;gap:8px;height:52px;padding:10px 8px 4px 16px}
.mws-brand{appearance:none;border:0;background:transparent;padding:4px 6px 4px 0;border-radius:var(--radius-sm);flex:1;display:flex;align-items:center;gap:8px;font:inherit;font-weight:600;font-size:14px;color:var(--fg);min-width:0;cursor:pointer;text-align:left}
.mws-brand:hover{color:var(--fg-2)}
.mws-all span{color:var(--muted)}
.mws-mark{display:inline-grid;place-items:center;flex:none;width:22px;height:22px;border-radius:5px;background:var(--fg);color:var(--bg)}
.mws-mark svg{display:block;width:16px;height:16px}
.mws-mark path{stroke-dasharray:60;stroke-dashoffset:0}
.mws-mark[data-live=true] path{animation:mws-draw 2.4s var(--ease-standard,ease) infinite}
@keyframes mws-draw{0%{stroke-dashoffset:60}55%{stroke-dashoffset:0}80%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:.35}}
@media (prefers-reduced-motion:reduce){.mws-mark[data-live=true] path{animation:none}}
.mws-icon{appearance:none;display:inline-grid;place-items:center;width:28px;height:28px;border:0;border-radius:var(--radius-sm);background:transparent;color:var(--meta);cursor:pointer}
.mws-icon:hover{background:var(--surface-2);color:var(--fg)}
.mws-new{appearance:none;display:flex;align-items:center;gap:8px;margin:6px 10px 12px;height:36px;padding:0 10px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--bg);color:var(--fg);font:inherit;font-weight:500;cursor:pointer}
.mws-new:hover{background:var(--surface-2)}
body[data-ds-dark-theme] .mws-new:hover{background:var(--surface-2)}
.mws-new svg{color:var(--muted)}
.mws-nav{display:grid;gap:1px;padding:0 8px}
.mws-nav button{appearance:none;display:flex;align-items:center;gap:10px;height:34px;padding:0 10px;border:1px solid transparent;border-radius:var(--radius-md);background:transparent;color:var(--muted);font:inherit;font-weight:500;text-align:left;cursor:pointer}
.mws-nav button:hover{background:var(--surface-2);color:var(--fg)}
.mws-nav button[aria-current=page]{background:var(--bg);border-color:var(--border);color:var(--fg)}
.mws-nav svg{flex:none;color:var(--meta)}
.mws-nav button:hover svg,.mws-nav button[aria-current=page] svg{color:var(--fg-2)}
.mws-list{flex:1;min-height:0;overflow:auto;margin-top:12px;padding:4px 8px 8px;scrollbar-width:thin;scrollbar-color:var(--border) transparent}
.mws-group{padding:10px 10px 4px;color:var(--meta);font-size:12.5px;font-weight:500;letter-spacing:.02em;font-variant-numeric:tabular-nums}
.mws-task{appearance:none;display:grid;grid-template-columns:minmax(0,1fr) 16px;column-gap:8px;align-items:center;width:100%;min-height:30px;padding:4px 10px;border:0;border-radius:var(--radius-md);background:transparent;color:var(--fg);font:inherit;text-align:left;cursor:pointer}
.mws-task.mws-all{grid-template-columns:16px minmax(0,1fr)}
.mws-task:hover{background:var(--surface-2)}
.mws-task span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px}
.mws-task small{display:block;color:var(--meta);font-size:12px;line-height:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mws-dot{display:inline-flex;color:var(--meta)}
.mws-dot[data-s=running] svg,.mws-dot[data-s=delivering] svg,.mws-dot[data-s=verifying] svg{animation:mws-spin 1.6s linear infinite;color:var(--fg-2)}
.mws-dot[data-s=ok]{color:var(--success)}.mws-dot[data-s=err]{color:var(--danger)}
@keyframes mws-spin{to{transform:rotate(360deg)}}
.mws-empty{padding:8px 10px;color:var(--meta);font-size:12.5px}
.mws-foot{padding:8px 8px 12px;border-top:1px solid var(--border-soft)}
.mws-foot>div>button{width:100%;min-height:32px;padding-left:6px!important;border-radius:var(--radius-md);color:var(--muted);font:13.5px/20px inherit;font-weight:500}
.mws-foot>div>button:hover{background:var(--surface-2);color:var(--fg)}
.mws.compact{align-items:center}
.mws.compact .mws-head{padding:10px 0 4px;justify-content:center}
.mws.compact .mws-brand,.mws.compact .mws-list,.mws.compact .mws-nav button span,.mws.compact .mws-new span{display:none}
.mws.compact .mws-new{width:34px;height:34px;padding:0;justify-content:center;margin:4px 0 10px}
.mws.compact .mws-nav{padding:0}
.mws.compact .mws-nav button{width:36px;height:36px;padding:0;justify-content:center}
.mws.compact .mws-foot{width:36px;padding:8px 0;border-top:0;margin-top:auto;overflow:hidden}
.mws.compact .mws-foot>div>button{display:grid;place-items:center;width:36px;min-height:36px;padding:0!important;font-size:0!important;line-height:0}
`

function visual(task: SidebarTask): string { return task.status !== 'done' ? task.status : task.error ? 'err' : 'ok' }
function Dot({ task }: { task: SidebarTask }): ReactElement {
  const v = visual(task)
  const Icon = v === 'ok' ? CircleCheck : v === 'err' ? CircleX : v === 'queued' ? History : Loader
  return <span className="mws-dot" data-s={v} title={task.statusLabel}><Icon size={14} strokeWidth={1.6} /></span>
}
/** 今天 / 昨天 / 更早 — the day a task finished, in local time. */
function groupByDay(items: SidebarTask[], t: (key: string) => string): { label: string; items: SidebarTask[] }[] {
  const dayOf = (iso: string): string => { const d = new Date(iso); return isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }
  const now = new Date()
  const today = dayOf(now.toISOString())
  const yesterday = dayOf(new Date(now.getTime() - 86400000).toISOString())
  const buckets: { label: string; items: SidebarTask[] }[] = [{ label: t('v2.groupToday'), items: [] }, { label: t('v2.groupYesterday'), items: [] }, { label: t('v2.groupEarlier'), items: [] }]
  for (const x of items) { const day = dayOf(x.finishedAt || x.createdAt); (day === today ? buckets[0] : day === yesterday ? buckets[1] : buckets[2]).items.push(x) }
  return buckets.filter(b => b.items.length > 0)
}
/** The MyWork mark: an M whose last stroke turns into a check. While something runs it draws itself, Grok style. */
export function BrandMark({ live }: { live?: boolean }): ReactElement {
  return <span className="mws-mark" data-live={live ? 'true' : undefined} aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none"><path d="M4.5 18.5V7l5.5 6.5L15.5 7M10.5 17l3 3 6-6" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </span>
}
function fire(name: string, detail: Record<string, unknown>): void { try { window.dispatchEvent(new CustomEvent(name, { detail })) } catch { /* no window */ } }

export function MyworkSidebar({ selectPanel, usePanelInfo = useLegacyPanelInfo, collapsed, width, toggleSidebar, renderSlot, t }: SidebarProps): ReactElement {
  const activePanelId = usePanelInfo(info => info.activePanelId)
  const compact = collapsed || width < 80
  const [tasks, setTasks] = useState<SidebarTask[]>([])
  const timer = useRef<number | undefined>(undefined)
  const load = useCallback((): void => {
    fetch(API).then(r => (r.ok ? r.json() : null)).then((d: { items?: SidebarTask[] } | null) => {
      const items = d && Array.isArray(d.items) ? d.items : []
      setTasks(items)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(load, items.some(x => x.status !== 'done') ? FAST_MS : SLOW_MS)
    }).catch(() => { window.clearTimeout(timer.current); timer.current = window.setTimeout(load, SLOW_MS) })
  }, [])
  useEffect(() => {
    load()
    const onFocus = (): void => { load() }
    // The tasks pages poll faster while something runs; reuse their snapshots instead of a second fast poll.
    const onUpdated = (event: Event): void => {
      const items = (event as CustomEvent<{ items?: SidebarTask[] }>).detail?.items
      if (Array.isArray(items)) setTasks(items)
    }
    window.addEventListener('focus', onFocus)
    window.addEventListener('mywork:tasks-updated', onUpdated)
    return () => { window.clearTimeout(timer.current); window.removeEventListener('focus', onFocus); window.removeEventListener('mywork:tasks-updated', onUpdated) }
  }, [load])

  const go = (id: string): void => { if (selectPanel !== undefined) selectPanel(id) }
  const nav: { id: string; label: string; Icon: typeof Sun }[] = [
    { id: MYWORK_PANELS.today, label: t('v2.today'), Icon: Sun },
    { id: MYWORK_PANELS.tasks, label: t('v2.tasks'), Icon: ListChecks },
    { id: MYWORK_PANELS.routines, label: t('v2.routines'), Icon: Clock },
  ]
  // Only what the user asked for: routine runs live on 例行, the day's conversation on 今日.
  const mine = tasks.filter(x => x.scenario !== 'assistant' && !x.routineId)
  const active = mine.filter(x => x.status !== 'done')
  const recent = mine.filter(x => x.status === 'done').slice(0, 12)
  const groups = groupByDay(recent, t)
  const openTask = (id: string): void => { go(MYWORK_PANELS.tasks); fire('mywork:open-task', { id }) }
  const item = (task: SidebarTask): ReactElement => <button key={task.id} type="button" className="mws-task" title={task.title} onClick={() => { openTask(task.id) }}>
    <span>{task.title}{task.status !== 'done' ? <small>{task.currentStep || task.statusLabel}</small> : null}</span>{task.status !== 'done' || task.error ? <Dot task={task} /> : <span />}
  </button>

  return <div className={'mws' + (compact ? ' compact' : '')} data-mywork-sidebar="v2">
    <style>{stylesheet}</style>
    <div className="mws-head"><button type="button" className="mws-brand" aria-current={activePanelId === MYWORK_PANELS.today ? 'page' : undefined} onClick={() => { go(MYWORK_PANELS.today) }}><BrandMark live={active.length > 0} /><span>MyWork</span></button><button type="button" className="mws-icon" aria-label={compact ? t('sidebar.expand') : t('sidebar.collapse')} onClick={toggleSidebar}><PanelLeft size={16} strokeWidth={1.5} /></button></div>
    <button type="button" className="mws-new" title={t('v2.newTask')} onClick={() => { fire('mywork:new-task', {}) }}><Plus size={15} strokeWidth={1.6} /><span>{t('v2.newTask')}</span></button>
    <nav className="mws-nav" aria-label="MyWork">{nav.map(({ id, label, Icon }) => <button key={id} type="button" aria-current={activePanelId === id ? 'page' : undefined} title={label} onClick={() => { if (activePanelId === id) fire('mywork:panel-home', { id }); go(id) }}><Icon size={16} strokeWidth={1.5} /><span>{label}</span></button>)}</nav>
    <div className="mws-list">
      {active.length > 0 && <><div className="mws-group">{t('v2.running')} · {active.length}</div>{active.map(item)}</>}
      {recent.length > 0 ? groups.map(g => <div key={g.label}><div className="mws-group">{g.label}</div>{g.items.map(item)}</div>) : active.length === 0 ? <div className="mws-empty">{t('v2.noTasks')}</div> : null}
      {mine.length > active.length + recent.length && <button type="button" className="mws-task mws-all" onClick={() => { go(MYWORK_PANELS.tasks) }}><span className="mws-dot"><ListChecks size={14} strokeWidth={1.6} /></span><span>{t('v2.allTasks')}</span></button>}
    </div>
    <footer className="mws-foot"><div>{renderSlot('sidebar.settings', { wide: !compact })}</div></footer>
  </div>
}
