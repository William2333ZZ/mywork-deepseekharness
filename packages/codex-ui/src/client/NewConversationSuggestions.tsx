import { useEffect, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Globe, FileSpreadsheet, CalendarClock, MessageSquare, TrendingUp } from 'lucide-react'
import { editionActive } from '../edition.ts'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { NS } from './locales.ts'
import type { PrefillResult, DraftPresenceSource } from './new-conversation-draft.ts'
export type { PrefillResult } from './new-conversation-draft.ts'

// MyWork Kit is a personal work assistant (live browser, Univer office documents, scheduled tasks, IM),
// so the starting points describe those jobs rather than a coding workflow.
const categories = [
  { id: 'web', label: 'home.web', tasks: [{ label: 'home.web.task1', prompt: 'home.web.prompt1' }, { label: 'home.web.task2', prompt: 'home.web.prompt2' }], Icon: Globe, color: '#4f8ff7' },
  { id: 'office', label: 'home.office', tasks: [{ label: 'home.office.task1', prompt: 'home.office.prompt1' }, { label: 'home.office.task2', prompt: 'home.office.prompt2' }], Icon: FileSpreadsheet, color: '#22c55e' },
  { id: 'schedule', label: 'home.schedule', tasks: [{ label: 'home.schedule.task1', prompt: 'home.schedule.prompt1' }, { label: 'home.schedule.task2', prompt: 'home.schedule.prompt2' }], Icon: CalendarClock, color: '#f48235' },
  { id: 'im', label: 'home.im', tasks: [{ label: 'home.im.task1', prompt: 'home.im.prompt1' }, { label: 'home.im.task2', prompt: 'home.im.prompt2' }], Icon: MessageSquare, color: '#a478e8' },
  { id: 'oracle', label: 'home.oracle', tasks: [{ label: 'home.oracle.task1', prompt: 'home.oracle.prompt1' }, { label: 'home.oracle.task2', prompt: 'home.oracle.prompt2' }], Icon: TrendingUp, color: '#c9931a' },
] as const
const hints = { workspace: 'home.workspace', draft: 'home.draft', busy: 'home.busy' } as const
type Category = typeof categories[number]['id']
const emptyDraft: DraftPresenceSource = { getSnapshot: () => false, subscribe: () => () => {} }

/** 只向宿主标题容器贡献自己的 React portal，不搬动标题、工具条或编辑器。 */
export function NewConversationSuggestions({ t, prefill, draftSource = emptyDraft }: PropsLocale<typeof NS> & { prefill?: (text: string) => PrefillResult; draftSource?: DraftPresenceSource }) {
  const hasDraft = useSyncExternalStore(draftSource.subscribe, draftSource.getSnapshot, emptyDraft.getSnapshot)
  const [target, setTarget] = useState<HTMLElement | null>(null)
  useEffect(() => {
    const sync = () => setTarget(document.querySelector('[data-phase=hero] [class*="_composerHero"]>:first-child>[class$="_stack"]'))
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-phase'] })
    return () => observer.disconnect()
  }, [])
  return target === null ? null : createPortal(<SuggestionCards t={t} prefill={prefill} hasDraft={hasDraft} />, target)
}

export function SuggestionCards({ t, prefill, hasDraft = false }: PropsLocale<typeof NS> & { prefill?: (text: string) => PrefillResult; hasDraft?: boolean }) {
  if (editionActive()) return <EditionCards t={t} prefill={prefill} hasDraft={hasDraft} />
  return <KitCards t={t} prefill={prefill} hasDraft={hasDraft} />
}

function useFill(prefill?: (text: string) => PrefillResult) {
  const [hint, setHint] = useState<PrefillResult>('ready')
  function fill(text: string) {
    const result = prefill?.(text) ?? 'workspace'
    setHint(result)
    if (result === 'ready') document.querySelector<HTMLElement>('[data-phase=hero] [data-lexical-editor=true]')?.focus()
    if (result === 'workspace') document.querySelector<HTMLButtonElement>('[data-phase=hero] [class*="_heroWorkspaceRow"]>button')?.click()
  }
  return { hint, setHint, fill }
}

type Tile = { id: string; label: string; value: number | string; unit?: string; delta?: number | null; deltaLabel?: string }
type Quote = { last: number | null; changePct?: number | null; change30Pct?: number | null; currency?: string; name?: string; error?: string | null }
type Watch = { id: string; kind: string; symbol: string; label: string; kindLabel?: string }
type Position = { id: string; watchId: string; qty: number; cost: number; pnl: number | null; pnlPct: number | null }
type Report = { id: string; title: string; probability: number | null; horizon?: string; at: string; sessionId?: string | null }
type Dashboard = { signals?: { tiles?: Tile[] }; watchlist?: Watch[]; quotes?: Record<string, Quote>; positions?: Position[]; reports?: Report[] }
const STRIP_IDS = ['gold', 'spread', 'real10y', 'fg', 'btc_basis', 'usdcny']
function useDashboard(): Dashboard | undefined {
  const [d, setD] = useState<Dashboard>()
  useEffect(() => {
    let alive = true
    const load = (): void => { fetch('/mywork-oracle/api/dashboard').then(r => r.ok ? r.json() : null).then((x: Dashboard | null) => { if (alive && x) setD(x) }).catch(() => {}) }
    load(); const id = setInterval(load, 60000)
    return () => { alive = false; clearInterval(id) }
  }, [])
  return d
}
const fmt = (v: number | string | null | undefined, digits?: number): string => v === null || v === undefined ? '-' : typeof v === 'number' ? v.toLocaleString(undefined, { maximumFractionDigits: digits ?? (Math.abs(v) >= 1000 ? 0 : Math.abs(v) >= 10 ? 2 : 4) }) : String(v)
const signed = (v: number | null | undefined, digits = 2): string => v === null || v === undefined ? '' : (v > 0 ? '+' : '') + v.toFixed(digits)
const upDownClass = (d: number | null | undefined): string => (d === null || d === undefined || d === 0 ? '' : d > 0 ? ' up' : ' down')
const openCockpit = (): void => { window.dispatchEvent(new CustomEvent('mywork:open-cockpit')) }
const askAndSend = (text: string): void => { window.dispatchEvent(new CustomEvent('mywork:new-conversation', { detail: { text, send: true } })) }

/** Edition home: the conversation entry, with the cockpit's essentials above it. */
function EditionCards({ t, prefill, hasDraft }: PropsLocale<typeof NS> & { prefill?: (text: string) => PrefillResult; hasDraft: boolean }) {
  const { hint, fill } = useFill(prefill)
  const d = useDashboard()
  const tiles = d?.signals?.tiles ?? []
  const by = new Map(tiles.map(x => [x.id, x]))
  const strip = STRIP_IDS.map(id => by.get(id)).filter((x): x is Tile => x !== undefined)
  const watchlist = (d?.watchlist ?? []).slice(0, 6)
  const quotes = d?.quotes ?? {}
  const positions = d?.positions ?? []
  const reports = (d?.reports ?? []).slice(0, 3)
  const analyze = (w: Watch): void => { fetch('/mywork-oracle/api/symbol/prompt', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ watchId: w.id }) }).then(r => r.json()).then((r: { text?: string }) => { if (r.text) askAndSend(r.text) }).catch(() => {}) }
  return <section className="dcu-home-suggestions dcu-home-edition" data-has-draft={hasDraft} aria-hidden={hasDraft} aria-label={t('home.suggestions')}>
    {strip.length > 0 && <button type="button" className="dcu-home-strip" onClick={openCockpit} aria-label={t('home.ticker.open')}>
      {strip.map(x => <span key={x.id} className="dcu-home-strip-item"><span className="dcu-home-strip-label">{x.label}</span><span className="dcu-home-strip-value">{fmt(x.value)}{x.unit ?? ''}</span>{x.delta !== null && x.delta !== undefined && <span className={'dcu-home-strip-delta' + upDownClass(x.delta)}>{signed(x.delta, x.deltaLabel?.includes('%') ? 1 : 0)}{x.deltaLabel?.includes('%') ? '%' : ''}</span>}</span>)}
      <span className="dcu-home-strip-open">{t('home.ticker.open')}</span>
    </button>}
    <div className="dcu-home-digest">
      <div className="dcu-home-digest-col">
        <div className="dcu-home-digest-head"><span>{t('home.mine')}</span><button type="button" className="dcu-home-link" onClick={openCockpit}>{t('home.allReports')}</button></div>
        {watchlist.length === 0 ? <p className="dcu-home-digest-empty">-</p> : <table className="dcu-home-table"><tbody>{watchlist.map(w => { const q = quotes[w.id]; const ps = positions.filter(p => p.watchId === w.id); return <tr key={w.id}>
          <td className="dcu-home-td-label">{w.label}<span className="dcu-home-td-sub">{w.symbol}</span></td>
          <td className="dcu-home-td-num">{q?.last === null || q?.last === undefined ? '-' : fmt(q.last) + (q.currency === '概率' ? '%' : '')}</td>
          <td className={'dcu-home-td-num' + upDownClass(q?.changePct)}>{q?.changePct === null || q?.changePct === undefined ? '' : signed(q.changePct) + '%'}</td>
          <td className={'dcu-home-td-num' + upDownClass(ps[0]?.pnl)}>{ps.length > 0 && ps[0].pnlPct !== null ? signed(ps[0].pnlPct) + '%' : ''}</td>
          <td className="dcu-home-td-act"><button type="button" className="dcu-home-chip dcu-home-chip-primary" onClick={() => { analyze(w) }}>{t('home.analyze')}</button></td>
        </tr> })}</tbody></table>}
      </div>
      <div className="dcu-home-digest-col dcu-home-digest-side">
        <div className="dcu-home-digest-head"><span>{t('home.reports')}</span></div>
        {reports.length === 0 ? <p className="dcu-home-digest-empty">-</p> : reports.map(r => <button type="button" key={r.id} className="dcu-home-report" onClick={() => { if (r.sessionId) window.dispatchEvent(new CustomEvent('mywork:open-session', { detail: { id: r.sessionId } })); else openCockpit() }}>
          <span className="dcu-home-report-p">{r.probability === null || r.probability === undefined ? '-' : `${r.probability}%`}</span>
          <span className="dcu-home-report-t">{r.title}<span className="dcu-home-td-sub">{new Date(r.at).toLocaleDateString()}{r.horizon ? ' ' + r.horizon : ''}</span></span>
        </button>)}
      </div>
    </div>
    <div className="dcu-home-templates" aria-label={t('home.templates')}>
      {(['home.tpl.1', 'home.tpl.2', 'home.tpl.3', 'home.tpl.4', 'home.tpl.5', 'home.tpl.6'] as const).map(k => <button type="button" key={k} className="dcu-home-chip" disabled={hasDraft} onClick={() => fill(t(k))}>{t(k)}</button>)}
    </div>
    <div className="dcu-home-status">{(Object.keys(hints) as Array<keyof typeof hints>).map(key => <p key={key} className="dcu-home-hint" data-active={hint === key} aria-hidden={hint !== key} role={hint === key ? 'status' : undefined}>{t(hints[key])}</p>)}</div>
  </section>
}

function KitCards({ t, prefill, hasDraft }: PropsLocale<typeof NS> & { prefill?: (text: string) => PrefillResult; hasDraft: boolean }) {
  const [selected, setSelected] = useState<Category>()
  const { hint, setHint, fill } = useFill(prefill)
  return <section className="dcu-home-suggestions" data-has-draft={hasDraft} aria-hidden={hasDraft} aria-label={t('home.suggestions')}>
    <div className="dcu-home-cards">{categories.map(({ id, label, Icon, color }) => <button type="button" key={id} disabled={hasDraft} className="dcu-home-card" style={{ '--dcu-home-icon': color } as CSSProperties} aria-pressed={selected === id} onClick={() => { setSelected(selected === id ? undefined : id); setHint('ready') }}>
      <Icon aria-hidden="true" /><span>{t(label)}</span>
    </button>)}</div>
    {/* 所有分区共用同一网格单元，按最长内容预留高度，展开和切换不重新撑高居中区域。 */}
    <div className="dcu-home-details">{categories.map(category => <div key={category.id} className="dcu-home-tasks" data-active={selected === category.id} aria-hidden={selected !== category.id}>
      {category.tasks.map(task => <button type="button" key={task.label} className="dcu-home-task" disabled={hasDraft || selected !== category.id} onClick={() => fill(t(task.prompt))}>{t(task.label)}</button>)}
    </div>)}</div>
    <div className="dcu-home-status">{(Object.keys(hints) as Array<keyof typeof hints>).map(key => <p key={key} className="dcu-home-hint" data-active={hint === key} aria-hidden={hint !== key} role={hint === key ? 'status' : undefined}>{t(hints[key])}</p>)}</div>
  </section>
}
