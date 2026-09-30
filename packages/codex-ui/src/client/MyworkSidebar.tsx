/**
 * MyWork v2 sidebar (TEAMMATES §9.4): the column is teammates. On top a search field, the bell (a count of what needs
 * you + what is working; a dropdown of 需要你 / 在干活 / 刚完成) and 「+」 for a new teammate. In the middle only
 * teammates — pinned first (MyWork is pinned by default), the rest by their last conversation; state never changes the
 * order. At the bottom 文件 and 设置. Rows carry no actions: opening a row is the only thing it does.
 *
 * Data comes from dsh-mywork-tasks (/mywork-tasks/api/mates, /activity, /search); navigation into that plugin's pages
 * goes through window events so neither package imports the other: the column dispatches mywork:open-thread and
 * listens for mywork:thread-opened (the highlight) and mywork:mates-updated (the page's own poll, shared).
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import { Bell, FileText, Files, MessageCircle, PanelLeft, Plus, Repeat, Search } from 'lucide-react'
import type { CodexSidebarProps } from './CodexSidebar.tsx'

export const V2_STORAGE_KEY = 'dsh-mywork:v2'
export function v2Active(): boolean { try { return localStorage.getItem(V2_STORAGE_KEY) !== 'off' } catch { return true } }

export const MYWORK_PANELS = { mate: 'mywork-mate', files: 'mywork-files' } as const
const API = '/mywork-tasks/api'
const FAST_MS = 4000
const SLOW_MS = 30000
const SEARCH_DEBOUNCE_MS = 200

/** GET /mates → items (the §9.8 contract; only the fields the column reads). */
type Mate = { id: string; name: string; title?: string; pinned?: boolean; isDefault?: boolean; createdAt?: string; lastAt?: string; preview?: string; unread?: boolean; state?: 'idle' | 'working' | 'waiting'; step?: string; ask?: { question?: string } | null }
/** GET /activity → { needs, working, recent } of these. */
type ActivityItem = { mateId: string; mateName?: string; runId?: string; at?: string; text?: string; kind?: string }
type Activity = { needs: ActivityItem[]; working: ActivityItem[]; recent: ActivityItem[] }
/** The teammate the tasks page has open (its sticky nav, shared through sessionStorage). */
const MATE_KEY = 'dsh-mywork:mate'
function storedMate(): string { try { return window.sessionStorage.getItem(MATE_KEY) ?? '' } catch { return '' } }
function storeMate(id: string): void { try { if (id !== '') window.sessionStorage.setItem(MATE_KEY, id); else window.sessionStorage.removeItem(MATE_KEY) } catch { /* private mode */ } }

/** What a row opens; the contract with dsh-mywork-tasks' web client (mywork:open-thread). */
type Target = { kind: 'mate'; id?: string; runId?: string } | { kind: 'new-mate' } | { kind: 'files'; id?: string } | { kind: 'routine'; id: string; mateId?: string }
type ResultRow = { key: string; glyph: 'mate' | 'message' | 'file' | 'routine'; mate?: Mate; title: string; sub: string; at: string; target: Target }
type SidebarProps = Pick<CodexSidebarProps, 'selectPanel' | 'usePanelInfo' | 'collapsed' | 'width' | 'toggleSidebar' | 'renderSlot' | 't'>

const useLegacyPanelInfo = <T,>(selector: (info: { activePanelId: string | null }) => T): T => selector({ activePanelId: null })
const EMPTY_ACTIVITY: Activity = { needs: [], working: [], recent: [] }

const stylesheet = `
/* Tokens: Rakazo's (packages/ui-tokens): dark by default; a light twin only when dsh itself is light and the OS asks for light. */
.mws{--bg:#0b0c0e;--surface:#111215;--surface-2:#18191e;--card:#141518;--fg:#ececee;--fg-2:#d4d4d8;--muted:#85858a;--meta:#85858a;--border:#1e2026;--border-soft:#1e2026;--border-strong:#2c2e36;--primary:#f1f1ef;--primary-on:#0b0c0e;--warn:#f0a35e;--focus-ring:0 0 0 2px rgba(241,241,239,.35);--elev-raised:0 10px 30px rgba(0,0,0,.5),0 2px 8px rgba(0,0,0,.4);--motion-fast:150ms;--ease-standard:cubic-bezier(.2,0,0,1);position:relative;width:100%;height:100%;min-width:0;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;background:var(--surface);color:var(--fg);box-shadow:inset -1px 0 var(--border);font:14px/20px Geist,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Noto Sans SC","Microsoft YaHei UI",sans-serif;-webkit-font-smoothing:antialiased}
@media all{html[data-mywork-theme="light"] .mws{--bg:#ffffff;--surface:#f7f7f8;--surface-2:#ececee;--card:#f2f2f3;--fg:#111113;--fg-2:#2a2a2e;--muted:#6b6b70;--meta:#6b6b70;--border:#e6e6e9;--border-soft:#ececee;--border-strong:#d4d4d8;--primary:#111113;--primary-on:#ffffff;--warn:#b5480a;--focus-ring:0 0 0 2px rgba(17,17,19,.25);--elev-raised:0 10px 30px rgba(0,0,0,.08),0 2px 8px rgba(0,0,0,.05)}}
.mws *{box-sizing:border-box}
.mws button{font-family:inherit;transition:background-color var(--motion-fast) var(--ease-standard),color var(--motion-fast) var(--ease-standard),transform var(--motion-fast) var(--ease-standard)}
.mws button:active{transform:scale(.98)}
.mws :focus-visible{outline:none;box-shadow:var(--focus-ring)}
@media (prefers-reduced-motion:reduce){.mws *{transition:none!important;animation:none!important}}
.mws-head{position:relative;display:flex;align-items:center;gap:2px;flex:none;padding:12px 10px 10px}
.mws-search{flex:1;min-width:0;display:flex;align-items:center;gap:8px;height:34px;margin-right:4px;padding:0 12px;border:1px solid var(--border);border-radius:999px;background:var(--card);color:var(--muted);transition:border-color var(--motion-fast) var(--ease-standard)}
.mws-search:focus-within{border-color:var(--border-strong)}
.mws-search svg{flex:none}
.mws-search input{flex:1;min-width:0;height:100%;margin:0;padding:0;border:0;background:transparent;color:var(--fg);font:inherit;font-size:13.5px;outline:none}
.mws-search input::placeholder{color:var(--muted)}
.mws-search input:focus-visible{box-shadow:none}
.mws-icon{appearance:none;position:relative;display:inline-grid;place-items:center;flex:none;width:32px;height:32px;border:0;border-radius:12px;background:transparent;color:var(--muted);cursor:pointer}
.mws-icon:hover,.mws-icon[aria-expanded=true]{background:var(--surface-2);color:var(--fg)}
.mws-count{position:absolute;top:2px;right:1px;min-width:15px;height:15px;padding:0 4px;border-radius:8px;background:var(--primary);color:var(--primary-on);font-size:10px;line-height:15px;font-weight:600;font-variant-numeric:tabular-nums;text-align:center;pointer-events:none}
/* The bell's panel: under the header, over the list. */
.mws-drop{position:absolute;top:calc(100% - 2px);left:8px;right:8px;z-index:20;max-height:min(420px,calc(100vh - 120px));overflow:auto;padding:6px;border:1px solid var(--border);border-radius:18px;background:var(--card);box-shadow:var(--elev-raised)}
.mws-drop h3{margin:6px 10px 2px;font-size:12px;line-height:16px;font-weight:500;color:var(--muted)}
.mws-drop .mws-row{min-height:48px;border-radius:14px}
.mws-drop .mws-row:hover{background:var(--surface-2)}
.mws-list{flex:1;min-height:0;overflow:auto;padding:0 8px 8px;scrollbar-width:thin;scrollbar-color:var(--border) transparent}
/* Rows (Rakazo's chat list): 38 avatar · name + time + dot · title chip · two-line preview. */
.mws-row{appearance:none;display:grid;grid-template-columns:38px minmax(0,1fr);column-gap:12px;align-items:start;width:100%;min-height:60px;padding:10px 10px;border:0;border-radius:16px;background:transparent;color:var(--fg);font:inherit;text-align:left;cursor:pointer}
.mws-row-flat{grid-template-columns:20px minmax(0,1fr);align-items:center;min-height:44px;padding:12px 10px}
.mws-row:hover,.mws-row[aria-current=page]{background:var(--surface-2)}
.mws-glyph{display:inline-grid;place-items:center;width:20px;height:20px;color:var(--muted)}
.mws-glyph.wide{width:38px;height:38px;border-radius:50%;background:var(--card)}
.mws-glyph svg{display:block}
/* Avatar (Rakazo's bot avatar): a coloured shape with two eyes; working, it pulses at scale 1.04 with a glow. */
.mws-av{position:relative;display:inline-block;flex:none;line-height:0;user-select:none}
.mws-av svg{display:block;overflow:visible;transition:transform .3s;filter:drop-shadow(0 2px 4px rgba(0,0,0,.45))}
.mws-av[data-working=true] svg{transform:scale(1.04);filter:drop-shadow(0 0 8px var(--glow)) drop-shadow(0 0 2px #fff);animation:mws-pulse 2s cubic-bezier(.4,0,.6,1) infinite}
@keyframes mws-pulse{50%{opacity:.55}}
@media (prefers-reduced-motion:reduce){.mws-av[data-working=true] svg{animation:none}}
.mws-main{min-width:0;display:grid;gap:3px}
.mws-line{display:flex;align-items:center;min-width:0}
.mws-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:20px;font-weight:500}
.mws-row[data-unread=true] .mws-title{font-weight:600}
.mws-time{flex:none;margin-left:8px;color:var(--muted);font-size:11.5px;line-height:20px;font-variant-numeric:tabular-nums;text-align:right}
.mws-unread{flex:none;width:8px;height:8px;margin-left:6px;border-radius:50%;background:var(--primary)}
.mws-chip{justify-self:start;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 7px;border:1px solid var(--border-strong);border-radius:999px;color:var(--muted);font-size:11px;line-height:17px}
.mws-sub{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:var(--muted);font-size:12.5px;line-height:17px;word-break:break-word}
.mws-sub[data-tone=warn]{color:var(--warn)}
.mws-empty{padding:12px 10px;color:var(--muted);font-size:12.5px;line-height:18px}
.mws-mark{display:inline-grid;place-items:center;flex:none;border-radius:50%;background:var(--primary);color:var(--primary-on)}
.mws-mark svg{display:block}
.mws-mark path{stroke-dasharray:60;stroke-dashoffset:0}
.mws-mark[data-live=true] path{animation:mws-draw 2.4s var(--ease-standard) infinite}
@keyframes mws-draw{0%{stroke-dashoffset:60}55%{stroke-dashoffset:0}80%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:.35}}
@media (prefers-reduced-motion:reduce){.mws-mark[data-live=true] path{animation:none}}
.mws-foot{flex:none;padding:8px 8px 0;border-top:1px solid var(--border)}
/* The settings entry is dsh's own trigger, kept outside the footer so it stays mounted across collapse; it wears the same row recipe as 文件 above it. */
.mws-settings{flex:none;padding:0 8px 12px}
.mws-settings .dcu-settings-trigger{height:44px;min-height:44px;padding:0 10px;border-radius:16px;color:var(--fg);font-family:inherit;font-size:14px;line-height:20px;transition:background-color var(--motion-fast) var(--ease-standard),color var(--motion-fast) var(--ease-standard),transform var(--motion-fast) var(--ease-standard)}
.mws-settings .dcu-settings-trigger:hover{background:var(--surface-2);color:var(--fg)}
.mws-settings .dcu-settings-trigger:hover svg{transform:none}
.mws-settings .dcu-settings-trigger:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.mws-settings .dcu-settings-trigger-content{column-gap:10px}
.mws-settings .dcu-settings-trigger-content svg{justify-self:center;color:var(--muted)}
/* Collapsed: dsh keeps a 56px rail on the web. Only the mark and the expand control live there. */
.mws.compact{align-items:center;gap:8px;padding:12px 0 8px}
.mws.compact .mws-settings{position:absolute;width:0;height:0;overflow:hidden}
.mws-rail{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;align-items:center;gap:8px;padding:4px 0;scrollbar-width:none}
.mws-rail-mate{position:relative;padding:3px;border:0;border-radius:14px;background:transparent;cursor:pointer;transition:background .15s}
.mws-rail-mate:hover,.mws-rail-mate[aria-current=page]{background:var(--surface-2)}
.mws-rail-dot{position:absolute;top:2px;right:2px;width:8px;height:8px;border-radius:50%;background:var(--primary);box-shadow:0 0 0 2px var(--surface)}
`

const str = (v: unknown): string => typeof v === 'string' ? v : ''
const ms = (iso: string): number => { const n = Date.parse(iso); return Number.isFinite(n) ? n : 0 }
const sameDay = (a: Date, b: Date): boolean => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
/** HH:MM today, M/D otherwise. */
function fmtWhen(iso: string, now: Date): string {
  if (iso === '') return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  if (sameDay(d, now)) return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${d.getMonth() + 1}/${d.getDate()}`
}
const isPinned = (m: Mate): boolean => m.pinned === true || (m.isDefault === true && m.pinned !== false)
/** The column's one order rule: pinned first (MyWork first among them), then the newest conversation. State never moves a row. */
export function orderMates(mates: Mate[]): Mate[] {
  return mates.filter(m => str(m.id) !== '').slice().sort((a, b) =>
    Number(isPinned(b)) - Number(isPinned(a))
    || (isPinned(a) && isPinned(b) ? Number(b.isDefault === true) - Number(a.isDefault === true) : 0)
    || ms(str(b.lastAt) || str(b.createdAt)) - ms(str(a.lastAt) || str(a.createdAt))
    || (a.id < b.id ? -1 : 1))
}
function asMates(v: unknown): Mate[] { return Array.isArray(v) ? v.filter((x): x is Mate => x !== null && typeof x === 'object' && str((x as Mate).id) !== '') : [] }
function asItems(v: unknown): ActivityItem[] { return Array.isArray(v) ? v.filter((x): x is ActivityItem => x !== null && typeof x === 'object' && str((x as ActivityItem).mateId) !== '') : [] }
function asActivity(v: unknown): Activity | undefined {
  if (v === null || typeof v !== 'object') return undefined
  const a = v as Record<string, unknown>
  return { needs: asItems(a.needs), working: asItems(a.working), recent: asItems(a.recent) }
}
/** GET /search?q= → { mates, messages, files, routines }: one row shape, told apart by the glyph. */
function parseSearch(data: unknown, byId: Map<string, Mate>): ResultRow[] {
  if (data === null || typeof data !== 'object') return []
  const body = data as Record<string, unknown>
  const list = (k: string): Record<string, unknown>[] => (Array.isArray(body[k]) ? (body[k] as unknown[]).filter((x): x is Record<string, unknown> => x !== null && typeof x === 'object') : [])
  const out: ResultRow[] = []
  for (const m of asMates(body.mates)) out.push({ key: 'mate:' + m.id, glyph: 'mate', mate: byId.get(m.id) ?? m, title: str(m.name), sub: str(m.title) || str(m.preview), at: str(m.lastAt), target: { kind: 'mate', id: m.id } })
  list('messages').forEach((x, i) => {
    const mateId = str(x.mateId)
    if (mateId === '') return
    out.push({ key: `msg:${mateId}:${str(x.runId)}:${i}`, glyph: 'message', title: byId.get(mateId)?.name ?? str(x.mateName), sub: str(x.text), at: str(x.at), target: { kind: 'mate', id: mateId, runId: str(x.runId) || undefined } })
  })
  for (const x of list('files')) {
    const id = str(x.id)
    if (id === '') continue
    out.push({ key: 'file:' + id, glyph: 'file', title: str(x.title), sub: byId.get(str(x.mateId))?.name ?? '', at: str(x.createdAt), target: { kind: 'files', id } })
  }
  for (const x of list('routines')) {
    const id = str(x.id)
    if (id === '') continue
    const owner = byId.get(str(x.mateId))?.name ?? ''
    out.push({ key: 'routine:' + id, glyph: 'routine', title: str(x.title), sub: [str(x.scheduleLabel), owner].filter(s => s !== '').join(' · '), at: str(x.lastAt) || str(x.nextRunAt), target: { kind: 'routine', id, mateId: str(x.mateId) || undefined } })
  }
  return out
}
function fire(name: string, detail: Record<string, unknown>, cancelable = false): boolean {
  try { return !window.dispatchEvent(new CustomEvent(name, { detail, cancelable })) } catch { return false }
}

/** The MyWork mark: an M whose last stroke turns into a check. While something runs it draws itself. */
export function BrandMark({ live, size = 22, round }: { live?: boolean; size?: number; round?: boolean }): ReactElement {
  const box: CSSProperties = { width: size, height: size, borderRadius: round === true ? '50%' : undefined }
  const glyph = Math.round(size * (round === true ? 0.62 : 0.72))
  return <span className="mws-mark" style={box} data-live={live ? 'true' : undefined} aria-hidden="true">
    <svg viewBox="0 0 24 24" width={glyph} height={glyph} fill="none"><path d="M4.5 18.5V7l5.5 6.5L15.5 7M10.5 17l3 3 6-6" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </span>
}

/** Rakazo's bot palette (packages/core bot-avatar-colors): light → dark gradient, eye colour. */
const AVATAR_COLORS: Array<[string, string, string]> = [['#A97EFE', '#7C3AED', '#FFFFFF'], ['#00C972', '#059669', '#FFFFFF'], ['#FF781C', '#EA580C', '#FFFFFF'], ['#1CC3B0', '#0284C7', '#FFFFFF'], ['#2A92FE', '#1D4ED8', '#FFFFFF'], ['#FFAF38', '#D97706', '#141414'], ['#A27952', '#78350F', '#FFFFFF'], ['#FF3E51', '#BE123C', '#FFFFFF'], ['#FF5EB1', '#BE185D', '#FFFFFF'], ['#94A3B8', '#475569', '#FFFFFF']]
/** Rakazo's shippedHash (FNV-1a). */
function avatarHash(v: string): number { let x = 2166136261; for (let i = 0; i < v.length; i++) x = Math.imul(x ^ v.charCodeAt(i), 16777619); return x >>> 0 }
/** Simple stand-ins for Rakazo's shapes, in a 100 box: blob, squircle, pebble. */
const AVATAR_SHAPES = ['M50 4a46 46 0 1 1 0 92a46 46 0 1 1 0-92Z', 'M34 4h32c20 0 30 10 30 30v32c0 20-10 30-30 30H34C14 96 4 86 4 66V34C4 14 14 4 34 4Z', 'M50 8c28 0 46 14 46 40s-18 44-46 44S4 74 4 48 22 8 50 8Z']
let avatarSeq = 0
/** A teammate's avatar (Rakazo's): a coloured shape from its id with two eyes; MyWork keeps its mark in the same frame. Working pulses. */
export function MateAvatar({ mate, size = 38 }: { mate: Mate; size?: number }): ReactElement {
  const working = mate.state === 'working'
  const [gid] = useState(() => 'mwsav' + String(++avatarSeq))
  if (mate.isDefault === true) {
    return <span className="mws-av" data-working={working ? 'true' : undefined} style={{ '--glow': '#f1f1ef' } as CSSProperties} aria-hidden="true">
      <svg viewBox="0 0 100 100" width={size} height={size}><circle cx="50" cy="50" r="46" fill="var(--primary)" /><svg x="20" y="20" width="60" height="60" viewBox="0 0 24 24" fill="none"><path d="M4.5 18.5V7l5.5 6.5L15.5 7M10.5 17l3 3 6-6" stroke="var(--primary-on)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg></svg>
    </span>
  }
  const hash = avatarHash(str(mate.id) || str(mate.name) || 'mate')
  const [light, dark, eye] = AVATAR_COLORS[hash % AVATAR_COLORS.length]
  const shape = AVATAR_SHAPES[(Math.imul(hash ^ (hash >>> 16), 73244475) >>> 0) % AVATAR_SHAPES.length]
  return <span className="mws-av" data-working={working ? 'true' : undefined} style={{ '--glow': light } as CSSProperties} aria-hidden="true">
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={light} /><stop offset="100%" stopColor={dark} /></linearGradient></defs>
      <path d={shape} fill={`url(#${gid})`} />
      <g fill={eye}><ellipse cx="37.3" cy="46.5" rx="4.4" ry="3.1" /><ellipse cx="62.7" cy="46.5" rx="4.4" ry="3.1" /></g>
    </svg>
  </span>
}

/** The second line: 等你答 · question / 在干活 · step / the last thing said. */
function secondLine(mate: Mate, t: SidebarProps['t']): { text: string; tone?: 'warn' } {
  if (mate.state === 'waiting') { const q = str(mate.ask?.question).replace(/\*\*|__|`/g, ''); return { text: [t('v2.waitingAsk'), q].filter(s => s !== '').join(' · '), tone: 'warn' } }
  if (mate.state === 'working') return { text: [t('v2.working'), str(mate.step)].filter(s => s !== '').join(' · ') }
  return { text: str(mate.preview) || str(mate.title) }
}

function MateRow({ mate, time, current, unread, t, onOpen }: { mate: Mate; time: string; current: boolean; unread: boolean; t: SidebarProps['t']; onOpen: () => void }): ReactElement {
  const sub = secondLine(mate, t)
  return <button type="button" className="mws-row" aria-current={current ? 'page' : undefined} data-unread={unread ? 'true' : undefined} onClick={onOpen}>
    <MateAvatar mate={mate} />
    <span className="mws-main">
      <span className="mws-line"><span className="mws-title">{mate.name}</span>{time !== '' && <span className="mws-time">{time}</span>}{unread && <i className="mws-unread" aria-hidden="true" />}</span>
      {str(mate.title) !== '' && <span className="mws-chip">{mate.title}</span>}
      {sub.text !== '' && sub.text !== str(mate.title) && <span className="mws-sub" data-tone={sub.tone}>{sub.text}</span>}
    </span>
  </button>
}

function ResultItem({ row, time, onOpen }: { row: ResultRow; time: string; onOpen: () => void }): ReactElement {
  const glyph = row.glyph === 'mate' && row.mate !== undefined ? <MateAvatar mate={row.mate} />
    : <span className="mws-glyph wide">{row.glyph === 'message' ? <MessageCircle size={16} strokeWidth={1.5} /> : row.glyph === 'file' ? <FileText size={16} strokeWidth={1.5} /> : <Repeat size={16} strokeWidth={1.5} />}</span>
  return <button type="button" className="mws-row" onClick={onOpen}>
    {glyph}
    <span className="mws-main">
      <span className="mws-line"><span className="mws-title">{row.title}</span>{time !== '' && <span className="mws-time">{time}</span>}</span>
      <span className="mws-sub">{row.sub}</span>
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
  const [mates, setMates] = useState<Mate[]>([])
  const [activity, setActivity] = useState<Activity>(EMPTY_ACTIVITY)
  const [query, setQuery] = useState('')
  const [remote, setRemote] = useState<ResultRow[] | null>(null)
  // The open teammate survives a remount (collapse / expand): the tasks page keeps it in sessionStorage too.
  const [opened, setOpened] = useState(() => { const id = storedMate(); return id !== '' ? 'mate:' + id : '' })
  const [bellOpen, setBellOpen] = useState(false)
  // Teammates opened here, with the lastAt they had then: the dot stays off until new activity moves lastAt.
  const [seen, setSeen] = useState<Record<string, string>>({})
  const timer = useRef<number | undefined>(undefined)
  const searchSeq = useRef(0)
  const matesRef = useRef<Mate[]>([])
  matesRef.current = mates
  const headRef = useRef<HTMLDivElement | null>(null)

  const schedule = useCallback((list: Mate[]): void => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => { load() }, list.some(m => m.state === 'working') ? FAST_MS : SLOW_MS)
  }, [])
  const load = useCallback((): void => {
    const matesReq = fetch(`${API}/mates`).then(r => (r.ok ? r.json() : null))
    const activityReq = fetch(`${API}/activity`).then(r => (r.ok ? r.json() : null)).catch(() => null)
    Promise.all([matesReq, activityReq]).then(([m, a]: [unknown, unknown]) => {
      const items = m !== null && typeof m === 'object' ? asMates((m as { items?: unknown }).items) : undefined
      if (items !== undefined) setMates(items)
      const next = asActivity(a)
      if (next !== undefined) setActivity(next)
      schedule(items ?? matesRef.current)
    }).catch(() => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => { load() }, SLOW_MS) })
  }, [schedule])
  const markSeen = useCallback((id: string): void => {
    const mate = matesRef.current.find(m => m.id === id)
    setSeen(prev => (prev[id] === str(mate?.lastAt) ? prev : { ...prev, [id]: str(mate?.lastAt) }))
  }, [])
  useEffect(() => {
    load()
    const onFocus = (): void => { load() }
    // The page polls on its own; reuse its snapshot the moment it lands.
    const onUpdated = (event: Event): void => {
      const detail = (event as CustomEvent<{ items?: unknown; activity?: unknown }>).detail
      if (Array.isArray(detail?.items)) { const list = asMates(detail.items); setMates(list); schedule(list) }
      const next = asActivity(detail?.activity)
      if (next !== undefined) setActivity(next)
    }
    // The page tells the column what it shows; the column highlights that row and drops its dot (POST /seen is the page's).
    const onOpened = (event: Event): void => {
      const detail = (event as CustomEvent<{ kind?: string; id?: string }>).detail
      const kind = str(detail?.kind)
      const id = str(detail?.id)
      if (kind === 'mate' && id !== '') { setOpened('mate:' + id); markSeen(id) }
      else if (kind === 'files') setOpened('files')
    }
    window.addEventListener('focus', onFocus)
    window.addEventListener('mywork:mates-updated', onUpdated)
    window.addEventListener('mywork:thread-opened', onOpened)
    return () => { window.clearTimeout(timer.current); window.removeEventListener('focus', onFocus); window.removeEventListener('mywork:mates-updated', onUpdated); window.removeEventListener('mywork:thread-opened', onOpened) }
  }, [load, markSeen, schedule])

  // The bell's panel closes on a click outside the header or on Escape.
  useEffect(() => {
    if (!bellOpen) return undefined
    const onDoc = (event: MouseEvent): void => { if (headRef.current !== null && event.target instanceof Node && !headRef.current.contains(event.target)) setBellOpen(false) }
    const onKey = (event: KeyboardEvent): void => { if (event.key === 'Escape') setBellOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [bellOpen])

  // Search: while the field has text, the list is GET /search's results (teammates matched by name show at once).
  const needle = query.trim()
  const byId = useMemo(() => new Map(mates.map(m => [m.id, m])), [mates])
  useEffect(() => {
    const seq = ++searchSeq.current
    if (needle === '') { setRemote(null); return }
    const id = window.setTimeout(() => {
      fetch(`${API}/search?q=${encodeURIComponent(needle)}`).then(r => (r.ok ? r.json() : null))
        .then((d: unknown) => { if (seq === searchSeq.current) setRemote(parseSearch(d, byId)) })
        .catch(() => { if (seq === searchSeq.current) setRemote([]) })
    }, SEARCH_DEBOUNCE_MS)
    return () => { window.clearTimeout(id) }
  }, [needle])
  const results = useMemo((): ResultRow[] => {
    if (needle === '') return []
    const q = needle.toLowerCase()
    const local: ResultRow[] = orderMates(mates).filter(m => str(m.name).toLowerCase().includes(q) || str(m.title).toLowerCase().includes(q))
      .map(m => ({ key: 'mate:' + m.id, glyph: 'mate', mate: m, title: m.name, sub: str(m.title) || str(m.preview), at: str(m.lastAt), target: { kind: 'mate', id: m.id } }))
    const keys = new Set(local.map(r => r.key))
    return [...local, ...(remote ?? []).filter(r => !keys.has(r.key))]
  }, [needle, mates, remote])

  const ordered = useMemo(() => orderMates(mates), [mates])
  const live = mates.some(m => m.state === 'working')
  const count = activity.needs.length + activity.working.length
  const now = new Date()

  /** mywork:open-thread is the contract; if nothing handled it (the tasks client is not loaded yet), its page is selected. */
  const open = (target: Target): void => {
    setBellOpen(false)
    if (target.kind === 'mate' && target.id !== undefined && target.id !== '') { setOpened('mate:' + target.id); markSeen(target.id) }
    else if (target.kind === 'files') setOpened('files')
    // Written before the event, so a tasks page that mounts only now (not loaded yet) still opens this teammate.
    if (target.kind === 'mate') storeMate(target.id !== undefined ? target.id : '')
    const handled = fire('mywork:open-thread', { ...target }, true)
    if (!handled && selectPanel !== undefined) selectPanel(target.kind === 'files' ? MYWORK_PANELS.files : MYWORK_PANELS.mate)
  }
  const highlighted = activePanelId === MYWORK_PANELS.files ? 'files'
    : activePanelId === null || activePanelId === MYWORK_PANELS.mate ? opened
      : ''
  const groups: Array<[string, ActivityItem[]]> = [[t('v2.needs'), activity.needs], [t('v2.working'), activity.working], [t('v2.recent'), activity.recent]]

  return <div className={'mws' + (compact ? ' compact' : '')} data-mywork-sidebar="v2">
    <style>{stylesheet}</style>
    {compact ? <>
      {/* Collapsed = the same teammates without names: switching, unread and working stay one click away. */}
      <button type="button" className="mws-icon" aria-label={t('sidebar.expand')} onClick={toggleSidebar}><PanelLeft size={16} strokeWidth={1.5} /></button>
      <div className="mws-rail">
        {ordered.map(mate => {
          const unread = mate.unread === true && seen[mate.id] !== str(mate.lastAt) && highlighted !== 'mate:' + mate.id
          return <button key={mate.id} type="button" className="mws-rail-mate" title={mate.name} aria-label={mate.name} aria-current={highlighted === 'mate:' + mate.id ? 'page' : undefined} onClick={() => { open({ kind: 'mate', id: mate.id }) }}>
            <MateAvatar mate={mate} size={32} />{unread && <span className="mws-rail-dot" />}
          </button>
        })}
        <button type="button" className="mws-icon" aria-label={t('v2.newMate')} onClick={() => { open({ kind: 'new-mate' }) }}><Plus size={16} strokeWidth={1.5} /></button>
      </div>
      <button type="button" className="mws-icon" aria-label={t('v2.files')} onClick={() => { open({ kind: 'files' }) }}><Files size={16} strokeWidth={1.5} /></button>
    </> : <>
      <div className="mws-head" ref={headRef}>
        <label className="mws-search"><Search size={14} strokeWidth={1.5} aria-hidden="true" /><input type="text" value={query} placeholder={t('v2.search')} aria-label={t('v2.search')} autoComplete="off" spellCheck={false} onChange={event => { setQuery(event.target.value) }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); setQuery('') } }} /></label>
        <button type="button" className="mws-icon" aria-label={t('v2.bell')} aria-haspopup="true" aria-expanded={bellOpen} onClick={() => { setBellOpen(!bellOpen) }}>
          <Bell size={16} strokeWidth={1.5} />{count > 0 && <span className="mws-count">{count > 99 ? '99' : count}</span>}
        </button>
        <button type="button" className="mws-icon" aria-label={t('sidebar.collapse')} onClick={toggleSidebar}><PanelLeft size={16} strokeWidth={1.5} /></button>
        <button type="button" className="mws-icon" aria-label={t('v2.newMate')} onClick={() => { open({ kind: 'new-mate' }) }}><Plus size={16} strokeWidth={1.5} /></button>
        {bellOpen && <div className="mws-drop" role="dialog" aria-label={t('v2.bell')}>
          {groups.every(([, items]) => items.length === 0) && <div className="mws-empty">{t('v2.quiet')}</div>}
          {groups.map(([label, items]) => items.length === 0 ? null : <div key={label}>
            <h3>{label}</h3>
            {items.map((item, i) => {
              const mate = byId.get(item.mateId) ?? { id: item.mateId, name: str(item.mateName) }
              return <button key={`${item.mateId}:${str(item.runId)}:${i}`} type="button" className="mws-row" onClick={() => { open({ kind: 'mate', id: item.mateId, runId: str(item.runId) || undefined }) }}>
                <MateAvatar mate={mate} />
                <span className="mws-main">
                  <span className="mws-line"><span className="mws-title">{str(mate.name) || str(item.mateName)}</span><span className="mws-time">{fmtWhen(str(item.at), now)}</span></span>
                  <span className="mws-sub">{str(item.text)}</span>
                </span>
              </button>
            })}
          </div>)}
        </div>}
      </div>
      <div className="mws-list">
        {needle === ''
          ? ordered.map(mate => <MateRow key={mate.id} mate={mate} t={t} time={fmtWhen(str(mate.lastAt), now)} current={highlighted === 'mate:' + mate.id} unread={mate.unread === true && seen[mate.id] !== str(mate.lastAt) && highlighted !== 'mate:' + mate.id} onOpen={() => { open({ kind: 'mate', id: mate.id }) }} />)
          : results.map(row => <ResultItem key={row.key} row={row} time={fmtWhen(row.at, now)} onOpen={() => { open(row.target) }} />)}
        {needle !== '' && remote !== null && results.length === 0 && <div className="mws-empty">{t('v2.noResults')}</div>}
      </div>
      <footer className="mws-foot">
        <FlatRow label={t('v2.files')} icon={<Files size={16} strokeWidth={1.5} />} current={highlighted === 'files'} onOpen={() => { open({ kind: 'files' }) }} />
      </footer>
    </>}
    <div className="mws-settings">{renderSlot('sidebar.settings', { wide: !compact })}</div>
  </div>
}
