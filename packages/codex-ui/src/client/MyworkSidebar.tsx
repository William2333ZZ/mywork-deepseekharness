/**
 * MyWork v2 sidebar: one column of conversations (the Rakazo shape). A search field and
 * a "+" on top; then 今日 pinned, then every routine and user task in one list by last
 * activity; 交付物 and 设置 at the bottom. Rows carry no actions: opening a row is the only
 * thing it does, and nothing appears on hover.
 *
 * Data comes from dsh-mywork-tasks (/mywork-tasks/api/tasks, /routines, /search); navigation
 * into that plugin's pages goes through window events so neither package imports the other:
 * the column dispatches mywork:open-thread and listens for mywork:thread-opened.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import { CircleCheck, CircleX, FileText, Files, History, Loader, PanelLeft, Plus, Repeat, Search } from 'lucide-react'
import type { CodexSidebarProps } from './CodexSidebar.tsx'

export const V2_STORAGE_KEY = 'dsh-mywork:v2'
export function v2Active(): boolean { try { return localStorage.getItem(V2_STORAGE_KEY) !== 'off' } catch { return true } }

export const MYWORK_PANELS = { today: 'mywork-today', create: 'mywork-new', tasks: 'mywork-tasks', deliverables: 'mywork-deliverables', routines: 'mywork-routines', scenarios: 'mywork-scenarios' } as const
const API = '/mywork-tasks/api'
const FAST_MS = 4000
const SLOW_MS = 30000
const SEARCH_DEBOUNCE_MS = 200
const MAX_ROWS = 80

type SidebarTask = { id: string; title: string; status: string; statusLabel?: string; error?: string; currentStep?: string; finishedAt?: string; createdAt?: string; scenario?: string; routineId?: string; quiet?: boolean; verification?: { passed?: boolean } | null; preview?: string; lastAt?: string; unread?: boolean }
type SidebarRoutine = { id: string; title: string; scheduleLabel?: string; createdAt?: string; lastRunAt?: string; lastRun?: { at?: string } | null; preview?: string; lastAt?: string; unread?: boolean; lastRunSummary?: string }
type Reminder = { routineId?: string; at?: string }
type RowKind = 'today' | 'task' | 'routine' | 'deliverable'
/** What a row opens; the contract with dsh-mywork-tasks' web client (mywork:open-thread). */
type ThreadKind = 'today' | 'task' | 'routine' | 'new' | 'deliverables' | 'settings'
type Row = { key: string; kind: RowKind; id: string; title: string; preview: string; lastAt: string; unread: boolean; status?: string; failed?: boolean; taskId?: string }
type SidebarProps = Pick<CodexSidebarProps, 'selectPanel' | 'usePanelInfo' | 'collapsed' | 'width' | 'toggleSidebar' | 'renderSlot' | 't'>

const useLegacyPanelInfo = <T,>(selector: (info: { activePanelId: string | null }) => T): T => selector({ activePanelId: null })

const stylesheet = `
/* Tokens: design/v2/DESIGN.md §2. The column is --surface beside a --bg page; rows step to --surface-2. */
.mws{--bg:#ffffff;--surface:#f6f5f4;--surface-2:#efedeb;--fg:rgba(0,0,0,.92);--fg-2:#31302e;--muted:#615d59;--meta:#75706a;--border:rgba(0,0,0,.1);--border-soft:rgba(0,0,0,.06);--border-strong:rgba(0,0,0,.22);--success:#127e28;--danger:#c0392b;--focus-ring:0 0 0 3px rgba(0,117,222,.25);--motion-fast:150ms;--ease-standard:cubic-bezier(.2,0,0,1);position:relative;width:100%;height:100%;min-width:0;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;background:var(--surface);color:var(--fg);box-shadow:inset -1px 0 var(--border-soft);font:14px/20px -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Noto Sans SC","Microsoft YaHei UI",sans-serif;-webkit-font-smoothing:antialiased}
body[data-ds-dark-theme] .mws{--bg:#191919;--surface:#202020;--surface-2:#2a2a2a;--fg:rgba(255,255,255,.9);--fg-2:#e6e4e0;--muted:#9b9893;--meta:#8a867f;--border:rgba(255,255,255,.1);--border-soft:rgba(255,255,255,.06);--border-strong:rgba(255,255,255,.22);--success:#4dab7a;--danger:#e26e63;--focus-ring:0 0 0 3px rgba(82,156,202,.35)}
.mws *{box-sizing:border-box}
.mws button{font-family:inherit;transition:background-color var(--motion-fast) var(--ease-standard),color var(--motion-fast) var(--ease-standard),transform var(--motion-fast) var(--ease-standard)}
.mws button:active{transform:scale(.98)}
.mws :focus-visible{outline:none;box-shadow:var(--focus-ring)}
@media (prefers-reduced-motion:reduce){.mws *{transition:none!important;animation:none!important}}
.mws-head{display:flex;align-items:center;gap:4px;flex:none;padding:12px 8px 8px}
.mws-search{flex:1;min-width:0;display:flex;align-items:center;gap:8px;height:32px;padding:0 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--meta);transition:border-color var(--motion-fast) var(--ease-standard)}
.mws-search:focus-within{border-color:var(--border-strong)}
.mws-search svg{flex:none}
.mws-search input{flex:1;min-width:0;height:100%;margin:0;padding:0;border:0;background:transparent;color:var(--fg);font:inherit;font-size:13px;outline:none}
.mws-search input::placeholder{color:var(--meta)}
.mws-search input:focus-visible{box-shadow:none}
.mws-icon{appearance:none;display:inline-grid;place-items:center;flex:none;width:32px;height:32px;border:0;border-radius:6px;background:transparent;color:var(--muted);cursor:pointer}
.mws-icon:hover{background:var(--surface-2);color:var(--fg)}
.mws-list{flex:1;min-height:0;overflow:auto;padding:0 8px 8px;scrollbar-width:thin;scrollbar-color:var(--border) transparent}
.mws-row{appearance:none;display:grid;grid-template-columns:20px minmax(0,1fr);column-gap:10px;align-items:center;width:100%;min-height:48px;padding:5px 10px;border:0;border-radius:12px;background:transparent;color:var(--fg);font:inherit;text-align:left;cursor:pointer}
.mws-row-flat{min-height:44px;padding:12px 10px}
.mws-row:hover,.mws-row[aria-current=page]{background:var(--surface-2)}
.mws-glyph{display:inline-grid;place-items:center;width:20px;height:20px;color:var(--meta)}
.mws-glyph svg{display:block}
.mws-glyph[data-s=running] svg,.mws-glyph[data-s=delivering] svg,.mws-glyph[data-s=verifying] svg{animation:mws-spin 1.6s linear infinite;color:var(--fg-2)}
.mws-glyph[data-s=ok]{color:var(--success)}.mws-glyph[data-s=err]{color:var(--danger)}
@keyframes mws-spin{to{transform:rotate(360deg)}}
.mws-main{min-width:0}
.mws-line{display:flex;align-items:center;min-width:0}
.mws-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:20px;font-weight:400}
.mws-row[data-unread=true] .mws-title{font-weight:500}
.mws-time{flex:none;margin-left:8px;color:var(--meta);font-size:11.5px;line-height:20px;font-variant-numeric:tabular-nums;text-align:right}
.mws-unread{flex:none;width:6px;height:6px;margin-left:6px;border-radius:50%;background:var(--fg)}
.mws-sub{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted);font-size:12.5px;line-height:18px}
.mws-empty{padding:12px 10px;color:var(--muted);font-size:12.5px;line-height:18px}
.mws-mark{display:inline-grid;place-items:center;flex:none;border-radius:5px;background:var(--fg);color:var(--bg)}
.mws-mark svg{display:block}
.mws-mark path{stroke-dasharray:60;stroke-dashoffset:0}
.mws-mark[data-live=true] path{animation:mws-draw 2.4s var(--ease-standard) infinite}
@keyframes mws-draw{0%{stroke-dashoffset:60}55%{stroke-dashoffset:0}80%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:.35}}
@media (prefers-reduced-motion:reduce){.mws-mark[data-live=true] path{animation:none}}
.mws-foot{flex:none;padding:8px 8px 0;border-top:1px solid var(--border-soft)}
/* The settings entry is dsh's own trigger, kept outside the footer so it stays mounted across collapse; it wears the same row recipe as 交付物 above it. */
.mws-settings{flex:none;padding:0 8px 12px}
.mws-settings .dcu-settings-trigger{height:44px;min-height:44px;padding:0 10px;border-radius:12px;color:var(--fg);font-family:inherit;font-size:14px;line-height:20px;transition:background-color var(--motion-fast) var(--ease-standard),color var(--motion-fast) var(--ease-standard),transform var(--motion-fast) var(--ease-standard)}
.mws-settings .dcu-settings-trigger:hover{background:var(--surface-2);color:var(--fg)}
.mws-settings .dcu-settings-trigger:hover svg{transform:none}
.mws-settings .dcu-settings-trigger:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.mws-settings .dcu-settings-trigger-content{column-gap:10px}
.mws-settings .dcu-settings-trigger-content svg{justify-self:center;color:var(--meta)}
/* Collapsed: dsh keeps a 56px rail on the web. Only the mark and the expand control live there. */
.mws.compact{align-items:center;gap:8px;padding:12px 0 8px}
.mws.compact .mws-settings{position:absolute;width:0;height:0;overflow:hidden}
`

const str = (v: unknown): string => typeof v === 'string' ? v : ''
const ms = (iso: string): number => { const n = Date.parse(iso); return Number.isFinite(n) ? n : 0 }
const byLastAt = (a: Row, b: Row): number => ms(b.lastAt) - ms(a.lastAt)
const sameDay = (a: Date, b: Date): boolean => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
/** HH:MM today, M/D otherwise. */
function fmtWhen(iso: string, now: Date): string {
  if (iso === '') return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  if (sameDay(d, now)) return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${d.getMonth() + 1}/${d.getDate()}`
}
function visual(status: string, failed: boolean): string { return status !== 'done' ? status : failed ? 'err' : 'ok' }
/** Server fields (preview / lastAt / unread) with fallbacks so the column also reads the current payload. */
function taskRow(task: SidebarTask): Row {
  return { key: 'task:' + task.id, kind: 'task', id: task.id, title: str(task.title), preview: str(task.preview) || str(task.currentStep) || str(task.statusLabel), lastAt: str(task.lastAt) || str(task.finishedAt) || str(task.createdAt), unread: task.unread === true, status: str(task.status), failed: str(task.error) !== '' }
}
function routineRow(routine: SidebarRoutine): Row {
  const preview = str(routine.preview) || [str(routine.scheduleLabel), str(routine.lastRunSummary)].filter(x => x !== '').join(' · ')
  return { key: 'routine:' + routine.id, kind: 'routine', id: routine.id, title: str(routine.title), preview, lastAt: str(routine.lastAt) || str(routine.lastRun?.at) || str(routine.lastRunAt) || str(routine.createdAt), unread: routine.unread === true }
}
/** GET /search?q= results. Preferred: { items: [{ type: 'task' | 'routine' | 'deliverable', id, title, preview, lastAt, taskId? }] };
 *  plain { tasks, routines, deliverables } arrays are read too, and an item's own fields settle its kind when `type` is absent. */
function parseSearch(data: unknown): Row[] {
  if (data === null || typeof data !== 'object') return []
  const body = data as Record<string, unknown>
  const out: Row[] = []
  const push = (fallback: RowKind, raw: unknown): void => {
    if (raw === null || typeof raw !== 'object') return
    const v = raw as Record<string, unknown>
    const id = str(v.id)
    if (id === '') return
    const typed = str(v.type)
    const kind: RowKind = typed === 'task' || typed === 'routine' || typed === 'deliverable' ? typed
      : v.scheduleLabel !== undefined || v.schedule !== undefined || Array.isArray(v.runs) ? 'routine'
        : typeof v.status === 'string' ? 'task'
          : typeof v.taskId === 'string' ? 'deliverable'
            : fallback
    if (kind === 'task') { out.push(taskRow(v as unknown as SidebarTask)); return }
    if (kind === 'routine') { out.push(routineRow(v as unknown as SidebarRoutine)); return }
    out.push({ key: 'deliverable:' + id, kind: 'deliverable', id, title: str(v.title), preview: str(v.preview) || str(v.summary), lastAt: str(v.lastAt) || str(v.createdAt), unread: false, taskId: str(v.taskId) || undefined })
  }
  if (Array.isArray(body.items)) for (const x of body.items) push('task', x)
  if (Array.isArray(body.tasks)) for (const x of body.tasks) push('task', x)
  if (Array.isArray(body.routines)) for (const x of body.routines) push('routine', x)
  if (Array.isArray(body.deliverables)) for (const x of body.deliverables) push('deliverable', x)
  return out
}
function fire(name: string, detail: Record<string, unknown>, cancelable = false): boolean {
  try { return !window.dispatchEvent(new CustomEvent(name, { detail, cancelable })) } catch { return false }
}

/** The MyWork mark: an M whose last stroke turns into a check. While something runs it draws itself, Grok style. */
export function BrandMark({ live, size = 22 }: { live?: boolean; size?: number }): ReactElement {
  const box: CSSProperties = { width: size, height: size }
  const glyph = Math.round(size * 0.72)
  return <span className="mws-mark" style={box} data-live={live ? 'true' : undefined} aria-hidden="true">
    <svg viewBox="0 0 24 24" width={glyph} height={glyph} fill="none"><path d="M4.5 18.5V7l5.5 6.5L15.5 7M10.5 17l3 3 6-6" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </span>
}

function Glyph({ row, live }: { row: Row; live: boolean }): ReactElement {
  if (row.kind === 'today') return <BrandMark live={live} size={20} />
  if (row.kind === 'routine') return <span className="mws-glyph"><Repeat size={16} strokeWidth={1.5} /></span>
  if (row.kind === 'deliverable') return <span className="mws-glyph"><FileText size={16} strokeWidth={1.5} /></span>
  const v = visual(row.status ?? 'done', row.failed === true)
  const Icon = v === 'ok' ? CircleCheck : v === 'err' ? CircleX : v === 'queued' ? History : Loader
  return <span className="mws-glyph" data-s={v}><Icon size={16} strokeWidth={1.5} /></span>
}

/** One row shape for everything: glyph · title · time · unread dot, and one line of preview. */
function ListRow({ row, time, current, unread, live, onOpen }: { row: Row; time: string; current: boolean; unread: boolean; live: boolean; onOpen: () => void }): ReactElement {
  return <button type="button" className="mws-row" aria-current={current ? 'page' : undefined} data-unread={unread ? 'true' : undefined} onClick={onOpen}>
    <Glyph row={row} live={live} />
    <span className="mws-main">
      <span className="mws-line"><span className="mws-title">{row.title}</span>{time !== '' && <span className="mws-time">{time}</span>}{unread && <i className="mws-unread" aria-hidden="true" />}</span>
      <span className="mws-sub">{row.preview}</span>
    </span>
  </button>
}

function FlatRow({ label, icon, current, onOpen }: { label: string; icon: ReactNode; current: boolean; onOpen: () => void }): ReactElement {
  return <button type="button" className="mws-row mws-row-flat" aria-current={current ? 'page' : undefined} onClick={onOpen}>
    <span className="mws-glyph">{icon}</span>
    <span className="mws-main"><span className="mws-line"><span className="mws-title">{label}</span></span></span>
  </button>
}

export function MyworkSidebar({ selectPanel, usePanelInfo = useLegacyPanelInfo, collapsed, width, toggleSidebar, renderSlot, t }: SidebarProps): ReactElement {
  const activePanelId = usePanelInfo(info => info.activePanelId)
  const compact = collapsed || width < 80
  const [tasks, setTasks] = useState<SidebarTask[]>([])
  const [routines, setRoutines] = useState<SidebarRoutine[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [query, setQuery] = useState('')
  const [remote, setRemote] = useState<Row[]>([])
  const [opened, setOpened] = useState('')
  // Rows the user has opened, with the lastAt they had then: the dot stays off until new activity moves lastAt.
  const [seen, setSeen] = useState<Record<string, string>>({})
  const timer = useRef<number | undefined>(undefined)
  const searchSeq = useRef(0)
  const rowsRef = useRef<Map<string, Row>>(new Map())

  const load = useCallback((): void => {
    const tasksReq = fetch(`${API}/tasks`).then(r => (r.ok ? r.json() : null))
    const routinesReq = fetch(`${API}/routines`).then(r => (r.ok ? r.json() : null)).catch(() => null)
    Promise.all([tasksReq, routinesReq]).then(([d, rd]: [{ items?: SidebarTask[]; reminders?: Reminder[]; routines?: SidebarRoutine[] } | null, { items?: SidebarRoutine[] } | null]) => {
      const items = d !== null && Array.isArray(d.items) ? d.items : undefined
      if (items !== undefined) { setTasks(items); setReminders(d !== null && Array.isArray(d.reminders) ? d.reminders : []) }
      const routineItems = rd !== null && Array.isArray(rd.items) ? rd.items : d !== null && Array.isArray(d.routines) ? d.routines : undefined
      if (routineItems !== undefined) setRoutines(routineItems)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(load, (items ?? []).some(x => x.status !== 'done') ? FAST_MS : SLOW_MS)
    }).catch(() => { window.clearTimeout(timer.current); timer.current = window.setTimeout(load, SLOW_MS) })
  }, [])
  const markSeen = useCallback((key: string): void => {
    const row = rowsRef.current.get(key)
    setSeen(prev => (prev[key] === (row?.lastAt ?? '') ? prev : { ...prev, [key]: row?.lastAt ?? '' }))
  }, [])
  useEffect(() => {
    load()
    const onFocus = (): void => { load() }
    // The pages poll faster while something runs; reuse their snapshots instead of a second fast poll.
    const onUpdated = (event: Event): void => {
      const items = (event as CustomEvent<{ items?: SidebarTask[] }>).detail?.items
      if (Array.isArray(items)) setTasks(items)
    }
    // The page tells the column what it shows; the column highlights that row and drops its dot (POST /seen is the page's).
    const onOpened = (event: Event): void => {
      const detail = (event as CustomEvent<{ kind?: string; id?: string }>).detail
      const kind = str(detail?.kind)
      const id = str(detail?.id)
      const key = kind === 'today' ? 'today' : (kind === 'task' || kind === 'routine') && id !== '' ? `${kind}:${id}` : kind === 'deliverables' ? 'deliverables' : ''
      setOpened(key)
      if (key === 'today' || key.includes(':')) markSeen(key)
    }
    window.addEventListener('focus', onFocus)
    window.addEventListener('mywork:tasks-updated', onUpdated)
    window.addEventListener('mywork:thread-opened', onOpened)
    return () => { window.clearTimeout(timer.current); window.removeEventListener('focus', onFocus); window.removeEventListener('mywork:tasks-updated', onUpdated); window.removeEventListener('mywork:thread-opened', onOpened) }
  }, [load, markSeen])

  // Search: local title / preview matches first, then what the server finds in deliverables and content.
  const needle = query.trim()
  useEffect(() => {
    const seq = ++searchSeq.current
    if (needle === '') { setRemote([]); return }
    const id = window.setTimeout(() => {
      fetch(`${API}/search?q=${encodeURIComponent(needle)}`).then(r => (r.ok ? r.json() : null))
        .then((d: unknown) => { if (seq === searchSeq.current) setRemote(parseSearch(d)) })
        .catch(() => { if (seq === searchSeq.current) setRemote([]) })
    }, SEARCH_DEBOUNCE_MS)
    return () => { window.clearTimeout(id) }
  }, [needle])

  // Only what the user asked for: the day's conversation is the 今日 row, routine runs live behind their routine.
  const mine = useMemo(() => tasks.filter(x => x.scenario !== 'assistant' && !x.routineId), [tasks])
  const live = tasks.some(x => x.status !== 'done')
  const now = new Date()
  const today = useMemo((): Row => {
    const assistant = tasks.filter(x => x.scenario === 'assistant').map(taskRow).sort(byLastAt)[0]
    const running = mine.filter(x => x.status !== 'done').length
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
    const waiting = reminders.length + mine.filter(x => x.status === 'done' && ms(str(x.finishedAt) || str(x.createdAt)) >= dayStart.getTime()
      && ((str(x.error) !== '' && !/已取消/.test(str(x.error))) || x.verification?.passed === false)).length
    const counts = [running > 0 ? `${running} ${t('v2.running1')}` : '', waiting > 0 ? `${waiting} ${t('v2.waiting1')}` : ''].filter(x => x !== '').join(' · ')
    const thinking = assistant !== undefined && assistant.status !== 'done' ? assistant.preview : ''
    const preview = counts !== '' ? counts : assistant === undefined ? '' : (str(tasks.find(x => x.id === assistant.id)?.preview) || thinking)
    return { key: 'today', kind: 'today', id: '', title: t('v2.today'), preview, lastAt: assistant?.lastAt ?? '', unread: assistant?.unread === true }
  }, [tasks, mine, reminders, t])
  const merged = useMemo(() => [...mine.map(taskRow), ...routines.map(routineRow)].sort(byLastAt), [mine, routines])
  const results = useMemo((): Row[] => {
    if (needle === '') return []
    const q = needle.toLowerCase()
    const local = merged.filter(r => r.title.toLowerCase().includes(q) || r.preview.toLowerCase().includes(q))
    const keys = new Set(local.map(r => r.key))
    return [...local, ...remote.filter(r => !keys.has(r.key))]
  }, [needle, merged, remote])
  const rows = needle === '' ? [today, ...merged.slice(0, MAX_ROWS)] : results
  rowsRef.current = new Map(rows.map(r => [r.key, r]))

  const go = (id: string): void => { if (selectPanel !== undefined) selectPanel(id) }
  /** mywork:open-thread is the contract; until the web client handles it (preventDefault), the current pages' events follow. */
  const openThread = (kind: ThreadKind, id?: string): void => {
    if (kind === 'today') { setOpened('today'); markSeen('today') }
    else if ((kind === 'task' || kind === 'routine') && id !== undefined) { setOpened(`${kind}:${id}`); markSeen(`${kind}:${id}`) }
    else if (kind === 'deliverables') setOpened('deliverables')
    const handled = fire('mywork:open-thread', id === undefined ? { kind } : { kind, id }, true)
    if (handled) return
    if (kind === 'today') go(MYWORK_PANELS.today)
    else if (kind === 'new') fire('mywork:new-task', {})
    else if (kind === 'task') { go(MYWORK_PANELS.tasks); fire('mywork:open-task', { id }) }
    else if (kind === 'routine') { go(MYWORK_PANELS.routines); window.setTimeout(() => { fire('mywork:open-routine', { id }) }, 0) }
    else if (kind === 'deliverables') { if (id === undefined) go(MYWORK_PANELS.deliverables); else fire('mywork:open-deliverable', { id }) }
  }
  const openRow = (row: Row): void => {
    if (row.kind === 'today') openThread('today')
    else if (row.kind === 'deliverable') { if (row.taskId !== undefined) openThread('task', row.taskId); else openThread('deliverables', row.id) }
    else openThread(row.kind, row.id)
  }
  const highlighted = activePanelId === MYWORK_PANELS.today ? 'today' : activePanelId === MYWORK_PANELS.deliverables ? 'deliverables' : activePanelId === MYWORK_PANELS.create ? '' : opened

  return <div className={'mws' + (compact ? ' compact' : '')} data-mywork-sidebar="v2">
    <style>{stylesheet}</style>
    {compact ? <>
      <BrandMark live={live} />
      <button type="button" className="mws-icon" aria-label={t('sidebar.expand')} onClick={toggleSidebar}><PanelLeft size={16} strokeWidth={1.5} /></button>
    </> : <>
      <div className="mws-head">
        <label className="mws-search"><Search size={14} strokeWidth={1.5} aria-hidden="true" /><input type="text" value={query} placeholder={t('v2.search')} aria-label={t('v2.search')} autoComplete="off" spellCheck={false} onChange={event => { setQuery(event.target.value) }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); setQuery('') } }} /></label>
        <button type="button" className="mws-icon" aria-label={t('v2.newTask')} onClick={() => { openThread('new') }}><Plus size={16} strokeWidth={1.5} /></button>
        <button type="button" className="mws-icon" aria-label={t('sidebar.collapse')} onClick={toggleSidebar}><PanelLeft size={16} strokeWidth={1.5} /></button>
      </div>
      <div className="mws-list">
        {rows.map(row => <ListRow key={row.key} row={row} time={fmtWhen(row.lastAt, now)} current={highlighted === row.key} unread={row.unread && seen[row.key] !== row.lastAt} live={live} onOpen={() => { openRow(row) }} />)}
        {needle !== '' && rows.length === 0 && <div className="mws-empty">{t('v2.noResults')}</div>}
      </div>
      <footer className="mws-foot">
        <FlatRow label={t('v2.deliverables')} icon={<Files size={16} strokeWidth={1.5} />} current={highlighted === 'deliverables'} onOpen={() => { openThread('deliverables') }} />
      </footer>
    </>}
    <div className="mws-settings">{renderSlot('sidebar.settings', { wide: !compact })}</div>
  </div>
}
