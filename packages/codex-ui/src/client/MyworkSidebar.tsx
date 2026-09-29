/**
 * MyWork v2 sidebar: the Manus / Muse shape. One button to start a task, four pages,
 * the task list, settings. No workspaces, no conversations, no extension menus: the
 * dsh conversation behind a task is reachable only through the task page's 「过程」.
 *
 * Tasks come from dsh-mywork-tasks (/mywork-tasks/api/tasks); navigation into that
 * plugin's pages goes through window events so neither package imports the other.
 */
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import { CircleCheck, CircleX, Clock, FileText, History, ListChecks, Loader, PanelLeft, Package, Plus, Sun } from 'lucide-react'
import type { CodexSidebarProps } from './CodexSidebar.tsx'

export const V2_STORAGE_KEY = 'dsh-mywork:v2'
export function v2Active(): boolean { try { return localStorage.getItem(V2_STORAGE_KEY) !== 'off' } catch { return true } }

export const MYWORK_PANELS = { today: 'mywork-today', tasks: 'mywork-tasks', deliverables: 'mywork-deliverables', routines: 'mywork-routines', scenarios: 'mywork-scenarios' } as const
const API = '/mywork-tasks/api/tasks'
const FAST_MS = 4000
const SLOW_MS = 30000

type SidebarTask = { id: string; title: string; status: string; statusLabel: string; error: string; currentStep: string; finishedAt: string; createdAt: string }
type SidebarProps = Pick<CodexSidebarProps, 'selectPanel' | 'usePanelInfo' | 'collapsed' | 'width' | 'toggleSidebar' | 'renderSlot' | 't'>

const useLegacyPanelInfo = <T,>(selector: (info: { activePanelId: string | null }) => T): T => selector({ activePanelId: null })

const stylesheet = `
.mws{--mws-bg:#f1f1ef;--mws-surface:#ffffff;--mws-fg:#141413;--mws-fg2:#6b6b68;--mws-fg3:#a1a19c;--mws-shell:rgba(17,17,16,.05);--mws-shell2:rgba(17,17,16,.085);--mws-hair:rgba(17,17,16,.06);--mws-ink:#141413;--mws-ink-fg:#fff;--mws-ok:#1f7a55;--mws-err:#c0392b;--mws-ease:cubic-bezier(.32,.72,0,1);width:100%;height:100%;min-width:0;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;background:var(--mws-bg);color:var(--mws-fg);font:13.5px/20px Geist,-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Segoe UI","Microsoft YaHei UI",sans-serif;-webkit-font-smoothing:antialiased}
body[data-ds-dark-theme] .mws{--mws-bg:#0e0e0e;--mws-surface:#171717;--mws-fg:#ececea;--mws-fg2:#9b9b97;--mws-fg3:#63635f;--mws-shell:rgba(255,255,255,.055);--mws-shell2:rgba(255,255,255,.1);--mws-hair:rgba(255,255,255,.07);--mws-ink:#ececea;--mws-ink-fg:#111110;--mws-ok:#5cb890;--mws-err:#e2685d}
.mws *{box-sizing:border-box}
.mws button{font-family:inherit;transition:background-color 420ms var(--mws-ease),color 420ms var(--mws-ease),transform 420ms var(--mws-ease),box-shadow 420ms var(--mws-ease)}
.mws button:active{transform:scale(.98)}
.mws :focus-visible{outline:2px solid var(--mws-fg2);outline-offset:-2px;border-radius:10px}
.mws-head{display:flex;align-items:center;gap:8px;height:58px;padding:12px 8px 6px 18px}
.mws-brand{flex:1;display:flex;align-items:center;gap:9px;font-weight:600;font-size:14.5px;letter-spacing:-.01em;min-width:0}
.mws-brand i{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:7px;background:var(--mws-ink);color:var(--mws-ink-fg);font-style:normal;font-size:12px;font-weight:700}
.mws-icon{appearance:none;display:inline-grid;place-items:center;width:30px;height:30px;border:0;border-radius:10px;background:transparent;color:var(--mws-fg3);cursor:pointer}
.mws-icon:hover{background:var(--mws-shell);color:var(--mws-fg)}
.mws-new{appearance:none;display:flex;align-items:center;gap:9px;margin:6px 12px 14px;height:38px;padding:0 6px 0 14px;border:0;border-radius:999px;background:var(--mws-surface);color:var(--mws-fg);font:inherit;font-weight:500;cursor:pointer;box-shadow:0 1px 1px rgba(17,17,16,.04),0 10px 24px -14px rgba(17,17,16,.25)}
body[data-ds-dark-theme] .mws-new{box-shadow:0 1px 1px rgba(0,0,0,.3),0 10px 24px -14px rgba(0,0,0,.8)}
.mws-new:hover{transform:translateY(-1px)}
.mws-new span{flex:1;text-align:left}
.mws-new svg{order:2;width:26px;height:26px;padding:6px;border-radius:50%;background:var(--mws-ink);color:var(--mws-ink-fg);transition:transform 420ms var(--mws-ease)}
.mws-new:hover svg{transform:rotate(90deg)}
.mws-nav{display:grid;gap:2px;padding:0 10px}
.mws-nav button{appearance:none;display:flex;align-items:center;gap:10px;height:34px;padding:0 10px;border:0;border-radius:12px;background:transparent;color:var(--mws-fg2);font:inherit;text-align:left;cursor:pointer}
.mws-nav button:hover{background:var(--mws-shell);color:var(--mws-fg)}
.mws-nav button[aria-current=page]{background:var(--mws-surface);color:var(--mws-fg);font-weight:500;box-shadow:0 1px 1px rgba(17,17,16,.04),0 6px 16px -12px rgba(17,17,16,.25)}
body[data-ds-dark-theme] .mws-nav button[aria-current=page]{box-shadow:0 1px 1px rgba(0,0,0,.3)}
.mws-nav svg{flex:none;color:var(--mws-fg3)}
.mws-nav button:hover svg,.mws-nav button[aria-current=page] svg{color:var(--mws-fg)}
.mws-list{flex:1;min-height:0;overflow:auto;margin-top:14px;padding:6px 10px 8px;scrollbar-width:thin;scrollbar-color:var(--mws-shell2) transparent}
.mws-group{padding:8px 10px 4px;color:var(--mws-fg3);font-size:11.5px;font-weight:600;letter-spacing:.04em;font-variant-numeric:tabular-nums}
.mws-task{appearance:none;display:grid;grid-template-columns:16px minmax(0,1fr);column-gap:8px;align-items:center;width:100%;min-height:30px;padding:4px 10px;border:0;border-radius:11px;background:transparent;color:var(--mws-fg);font:inherit;text-align:left;cursor:pointer}
.mws-task:hover{background:var(--mws-shell)}
.mws-task span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}
.mws-task small{display:block;color:var(--mws-fg3);font-size:11.5px;line-height:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mws-dot{display:inline-flex;color:var(--mws-fg3)}
.mws-dot[data-s=running] svg,.mws-dot[data-s=delivering] svg,.mws-dot[data-s=verifying] svg{animation:mws-spin 1.6s linear infinite;color:var(--mws-fg)}
.mws-dot[data-s=ok]{color:var(--mws-ok)}.mws-dot[data-s=err]{color:var(--mws-err)}
@keyframes mws-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.mws-dot svg{animation:none!important}}
.mws-empty{padding:8px 10px;color:var(--mws-fg3);font-size:12.5px}
.mws-foot{padding:8px 10px 12px}
.mws-foot>div>button{width:100%;min-height:34px;padding-left:6px!important;border-radius:12px;color:var(--mws-fg2);font:13.5px/20px inherit;font-weight:400}
.mws-foot>div>button:hover{background:var(--mws-shell);color:var(--mws-fg)}
.mws.compact{align-items:center}
.mws.compact .mws-head{padding:12px 0 4px;justify-content:center}
.mws.compact .mws-brand,.mws.compact .mws-list,.mws.compact .mws-nav button span,.mws.compact .mws-new span{display:none}
.mws.compact .mws-new{width:38px;height:38px;padding:0;justify-content:center;margin:4px 0 10px}
.mws.compact .mws-new svg{order:0}
.mws.compact .mws-nav{padding:0}
.mws.compact .mws-nav button{width:38px;height:38px;padding:0;justify-content:center}
.mws.compact .mws-foot{width:38px;padding:8px 0;margin-top:auto;overflow:hidden}
.mws.compact .mws-foot>div>button{display:grid;place-items:center;width:38px;min-height:38px;padding:0!important;font-size:0!important;line-height:0}
`

function visual(task: SidebarTask): string { return task.status !== 'done' ? task.status : task.error ? 'err' : 'ok' }
function Dot({ task }: { task: SidebarTask }): ReactElement {
  const v = visual(task)
  const Icon = v === 'ok' ? CircleCheck : v === 'err' ? CircleX : v === 'queued' ? History : Loader
  return <span className="mws-dot" data-s={v} title={task.statusLabel}><Icon size={14} strokeWidth={1.6} /></span>
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
    { id: MYWORK_PANELS.routines, label: t('v2.routines'), Icon: Clock },
    { id: MYWORK_PANELS.scenarios, label: t('v2.scenarios'), Icon: Package },
  ]
  useEffect(() => { document.body.setAttribute('data-mywork-v2', ''); return () => { document.body.removeAttribute('data-mywork-v2') } }, [])
  const active = tasks.filter(x => x.status !== 'done')
  const recent = tasks.filter(x => x.status === 'done').slice(0, 14)
  const openTask = (id: string): void => { go(MYWORK_PANELS.tasks); fire('mywork:open-task', { id }) }
  const item = (task: SidebarTask): ReactElement => <button key={task.id} type="button" className="mws-task" title={task.title} onClick={() => { openTask(task.id) }}>
    <Dot task={task} /><span>{task.title}{task.status !== 'done' ? <small>{task.currentStep || task.statusLabel}</small> : null}</span>
  </button>

  return <div className={'mws' + (compact ? ' compact' : '')} data-mywork-sidebar="v2">
    <style>{stylesheet}</style>
    <div className="mws-head"><div className="mws-brand"><i>M</i><span>MyWork</span></div><button type="button" className="mws-icon" aria-label={compact ? t('sidebar.expand') : t('sidebar.collapse')} onClick={toggleSidebar}><PanelLeft size={16} strokeWidth={1.5} /></button></div>
    <button type="button" className="mws-new" title={t('v2.newTask')} onClick={() => { go(MYWORK_PANELS.today); fire('mywork:new-task', {}) }}><Plus size={14} strokeWidth={2} /><span>{t('v2.newTask')}</span></button>
    <nav className="mws-nav" aria-label="MyWork">{nav.map(({ id, label, Icon }) => <button key={id} type="button" aria-current={activePanelId === id ? 'page' : undefined} title={label} onClick={() => { go(id) }}><Icon size={16} strokeWidth={1.5} /><span>{label}</span></button>)}</nav>
    <div className="mws-list">
      {active.length > 0 && <><div className="mws-group">{t('v2.running')} · {active.length}</div>{active.map(item)}</>}
      <div className="mws-group">{t('v2.recent')}</div>
      {recent.length > 0 ? recent.map(item) : <div className="mws-empty">{t('v2.noTasks')}</div>}
    </div>
    <footer className="mws-foot"><div>{renderSlot('sidebar.settings', { wide: !compact })}</div></footer>
  </div>
}
