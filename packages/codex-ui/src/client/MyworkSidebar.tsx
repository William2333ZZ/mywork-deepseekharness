/**
 * MyWork v2 sidebar: the Manus / Muse shape. One button to start a task, four pages,
 * the task list, settings. No workspaces, no conversations, no extension menus: the
 * dsh conversation behind a task is reachable only through the task page's 「过程」.
 *
 * Tasks come from dsh-mywork-tasks (/mywork-tasks/api/tasks); navigation into that
 * plugin's pages goes through window events so neither package imports the other.
 */
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import { CircleCheck, CircleX, FileText, History, ListChecks, Loader, PanelLeft, Package, Plus, Sun } from 'lucide-react'
import type { CodexSidebarProps } from './CodexSidebar.tsx'

export const V2_STORAGE_KEY = 'dsh-mywork:v2'
export function v2Active(): boolean { try { return localStorage.getItem(V2_STORAGE_KEY) !== 'off' } catch { return true } }

export const MYWORK_PANELS = { today: 'mywork-today', tasks: 'mywork-tasks', deliverables: 'mywork-deliverables', scenarios: 'mywork-scenarios' } as const
const API = '/mywork-tasks/api/tasks'
const FAST_MS = 4000
const SLOW_MS = 30000

type SidebarTask = { id: string; title: string; status: string; statusLabel: string; error: string; currentStep: string; finishedAt: string; createdAt: string }
type SidebarProps = Pick<CodexSidebarProps, 'selectPanel' | 'usePanelInfo' | 'collapsed' | 'width' | 'toggleSidebar' | 'renderSlot' | 't'>

const useLegacyPanelInfo = <T,>(selector: (info: { activePanelId: string | null }) => T): T => selector({ activePanelId: null })

const stylesheet = `
.mws{--mws-bg:#f3f4f2;--mws-fg:#2b2f2e;--mws-fg2:#6d7271;--mws-fg3:#9a9f9e;--mws-line:rgba(37,46,41,.10);--mws-hover:#e6e9e6;--mws-accent:var(--dsw-alias-brand-primary,#4d6fff);width:100%;height:100%;min-width:0;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;background:var(--mws-bg);color:var(--mws-fg);font:14px/20px Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI","Microsoft YaHei UI",sans-serif}
body[data-ds-dark-theme] .mws{--mws-bg:#1d2120;--mws-fg:#c6c8c7;--mws-fg2:#8f9392;--mws-fg3:#666867;--mws-line:rgba(255,255,255,.08);--mws-hover:#2b302e}
.mws *{box-sizing:border-box}
.mws-head{display:flex;align-items:center;gap:8px;height:56px;padding:8px 10px 6px 14px}
.mws-brand{flex:1;display:flex;align-items:center;gap:8px;font-weight:700;font-size:15px;letter-spacing:-.01em;min-width:0}
.mws-brand i{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:7px;background:var(--mws-accent);color:#fff;font-style:normal;font-size:12px;font-weight:700}
.mws-icon{appearance:none;display:inline-grid;place-items:center;width:30px;height:30px;border:0;border-radius:8px;background:transparent;color:var(--mws-fg2);cursor:pointer}
.mws-icon:hover{background:var(--mws-hover);color:var(--mws-fg)}
.mws-new{appearance:none;display:flex;align-items:center;gap:8px;margin:2px 10px 10px;height:36px;padding:0 12px;border:1px solid var(--mws-line);border-radius:10px;background:#fff;color:var(--mws-fg);font:inherit;font-weight:600;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.04)}
body[data-ds-dark-theme] .mws-new{background:#262b29}
.mws-new:hover{border-color:var(--mws-fg3)}
.mws-nav{display:grid;gap:1px;padding:0 6px}
.mws-nav button{appearance:none;display:flex;align-items:center;gap:10px;height:32px;padding:0 10px;border:0;border-radius:8px;background:transparent;color:var(--mws-fg);font:inherit;text-align:left;cursor:pointer}
.mws-nav button:hover{background:var(--mws-hover)}
.mws-nav button[aria-current=page]{background:var(--mws-hover);font-weight:600}
.mws-nav svg{flex:none;color:var(--mws-fg2)}
.mws-nav button[aria-current=page] svg{color:var(--mws-fg)}
.mws-list{flex:1;min-height:0;overflow:auto;margin-top:10px;padding:8px 6px 8px;border-top:1px solid var(--mws-line)}
.mws-group{padding:6px 10px 4px;color:var(--mws-fg3);font-size:12px;font-weight:600}
.mws-task{appearance:none;display:grid;grid-template-columns:16px minmax(0,1fr);column-gap:8px;align-items:center;width:100%;min-height:30px;padding:4px 10px;border:0;border-radius:8px;background:transparent;color:var(--mws-fg);font:inherit;text-align:left;cursor:pointer}
.mws-task:hover{background:var(--mws-hover)}
.mws-task span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}
.mws-task small{display:block;color:var(--mws-fg3);font-size:11.5px;line-height:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mws-dot{display:inline-flex;color:var(--mws-fg3)}
.mws-dot[data-s=running] svg,.mws-dot[data-s=delivering] svg,.mws-dot[data-s=verifying] svg{animation:mws-spin 1.2s linear infinite;color:var(--mws-accent)}
.mws-dot[data-s=ok]{color:var(--mws-accent)}.mws-dot[data-s=err]{color:#c9463d}
@keyframes mws-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.mws-dot svg{animation:none!important}}
.mws-empty{padding:8px 10px;color:var(--mws-fg3);font-size:12.5px}
.mws-foot{padding:8px 6px 12px;border-top:1px solid var(--mws-line)}
.mws-foot>div>button{width:100%;min-height:36px;padding-left:4px!important;color:var(--mws-fg2);font:14px/20px inherit;font-weight:400}
.mws.compact{align-items:center}
.mws.compact .mws-head{padding:10px 0 4px;justify-content:center}
.mws.compact .mws-brand,.mws.compact .mws-list,.mws.compact .mws-nav button span,.mws.compact .mws-new span{display:none}
.mws.compact .mws-new{width:36px;height:36px;padding:0;justify-content:center;margin:2px 0 8px}
.mws.compact .mws-nav{padding:0}
.mws.compact .mws-nav button{width:36px;height:36px;padding:0;justify-content:center}
.mws.compact .mws-foot{width:36px;padding:8px 0;border-top:0;margin-top:auto;overflow:hidden}
.mws.compact .mws-foot>div>button{display:grid;place-items:center;width:36px;min-height:36px;padding:0!important;font-size:0!important;line-height:0}
`

function visual(task: SidebarTask): string { return task.status !== 'done' ? task.status : task.error ? 'err' : 'ok' }
function Dot({ task }: { task: SidebarTask }): ReactElement {
  const v = visual(task)
  const Icon = v === 'ok' ? CircleCheck : v === 'err' ? CircleX : v === 'queued' ? History : Loader
  return <span className="mws-dot" data-s={v} title={task.statusLabel}><Icon size={14} strokeWidth={1.8} /></span>
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
    { id: MYWORK_PANELS.deliverables, label: t('v2.deliverables'), Icon: FileText },
    { id: MYWORK_PANELS.scenarios, label: t('v2.scenarios'), Icon: Package },
  ]
  const active = tasks.filter(x => x.status !== 'done')
  const recent = tasks.filter(x => x.status === 'done').slice(0, 14)
  const openTask = (id: string): void => { go(MYWORK_PANELS.tasks); fire('mywork:open-task', { id }) }
  const item = (task: SidebarTask): ReactElement => <button key={task.id} type="button" className="mws-task" title={task.title} onClick={() => { openTask(task.id) }}>
    <Dot task={task} /><span>{task.title}{task.status !== 'done' ? <small>{task.currentStep || task.statusLabel}</small> : null}</span>
  </button>

  return <div className={'mws' + (compact ? ' compact' : '')} data-mywork-sidebar="v2">
    <style>{stylesheet}</style>
    <div className="mws-head"><div className="mws-brand"><i>M</i><span>MyWork</span></div><button type="button" className="mws-icon" aria-label={compact ? t('sidebar.expand') : t('sidebar.collapse')} onClick={toggleSidebar}><PanelLeft size={16} /></button></div>
    <button type="button" className="mws-new" title={t('v2.newTask')} onClick={() => { go(MYWORK_PANELS.today); fire('mywork:new-task', {}) }}><Plus size={16} /><span>{t('v2.newTask')}</span></button>
    <nav className="mws-nav" aria-label="MyWork">{nav.map(({ id, label, Icon }) => <button key={id} type="button" aria-current={activePanelId === id ? 'page' : undefined} title={label} onClick={() => { go(id) }}><Icon size={16} strokeWidth={1.7} /><span>{label}</span></button>)}</nav>
    <div className="mws-list">
      {active.length > 0 && <><div className="mws-group">{t('v2.running')} · {active.length}</div>{active.map(item)}</>}
      <div className="mws-group">{t('v2.recent')}</div>
      {recent.length > 0 ? recent.map(item) : <div className="mws-empty">{t('v2.noTasks')}</div>}
    </div>
    <footer className="mws-foot"><div>{renderSlot('sidebar.settings', { wide: !compact })}</div></footer>
  </div>
}
