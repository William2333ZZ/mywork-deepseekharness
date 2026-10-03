/**
 * MyWork v2 sidebar (TEAMMATES §9.4): the column is teammates, set brutalist (pure black, white type at 100 / 65 / 50 %,
 * no fills; each teammate keeps its flat avatar). On top the MyWork mark (18px, white), a search field, the bell (a
 * dot: white while someone works, --warn when someone needs you; a dropdown of 需要你 / 在干活 / 刚完成), 「+」 for a new
 * teammate and collapse. In the middle only teammates, in sections: 置顶 (pinned; MyWork is pinned by default), then one
 * per type (the `group` field, 「类型」 in the UI) in the order the types were formed, then 其他. Within a section:
 * pinned / default first, then the last conversation; state never changes the order of rows or sections. A section
 * label (only when there is more than one section) folds its rows; what is folded is kept in localStorage (folded, it
 * carries the sum of its rows' badges). A row is the avatar with the unread count on its top-right — an IM badge (white
 * on red, 99+): results since you last opened that teammate, at least 1 while it waits on your answer — then the name
 * (never bold) and the time over one line (等你答 in --warn, 在干活 breathing, else the last thing said). The list ends
 * with 新同事. At the bottom 文件 and 设置 as plain text rows. Rows carry no actions: opening a row is the only thing it
 * does.
 *
 * Collapsing is clipping, not another layout: the same tree in dsh's 56px rail, where the avatar column (left 14,
 * 28 wide, centre 28) is all that shows. Every avatar, the mark, the section breaks (a short rule where the label was), 新同事,
 * 文件 and 设置 stay exactly where they were; only the words go.
 *
 * Data comes from dsh-mywork-tasks (/mywork-tasks/api/mates, /activity, /search); navigation into that plugin's pages
 * goes through window events so neither package imports the other: the column dispatches mywork:open-thread and
 * listens for mywork:thread-opened (the highlight) and mywork:mates-updated (the page's own poll, shared).
 */
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement } from 'react'
import { Bell, ChevronDown, PanelLeft, Plus } from 'lucide-react'
import type { CodexSidebarProps } from './CodexSidebar.tsx'

export const V2_STORAGE_KEY = 'dsh-mywork:v2'
export function v2Active(): boolean { try { return localStorage.getItem(V2_STORAGE_KEY) !== 'off' } catch { return true } }

export const MYWORK_PANELS = { mate: 'mywork-mate', files: 'mywork-files' } as const
const API = '/mywork-tasks/api'
const FAST_MS = 4000
const SLOW_MS = 30000
const SEARCH_DEBOUNCE_MS = 200

/** GET /mates → items (the §9.8 contract; only the fields the column reads). */
type Mate = { id: string; name: string; title?: string; pinned?: boolean; isDefault?: boolean; group?: string; avatar?: { color?: string; shape?: string } | null; createdAt?: string; lastAt?: string; preview?: string; unread?: boolean; unreadCount?: number; state?: 'idle' | 'working' | 'waiting'; step?: string; ask?: { question?: string } | null }
/** One block of the column: 置顶, a group (its name), or 其他 (ungrouped). */
type Section = { key: string; kind: 'pinned' | 'group' | 'other'; name: string; mates: Mate[] }
/** Folded section keys ('pinned' | 'g:<name>' | 'other' → true), kept across reloads. */
const SECTIONS_KEY = 'dsh-mywork:sections'
function storedSections(): Record<string, boolean> {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(SECTIONS_KEY) ?? '{}')
    return v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, boolean> : {}
  } catch { return {} }
}
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
/*
 * Brutalist structure, aesthetic execution (the tasks page shares these tokens): pure black, white text at 100 / 65 /
 * 50 %, rules white at 10 / 5 %; --warn only for a pending question (等你答). The one other colour is the unread badge
 * (white on #e5484d, as in IM). No fills, no decoration: a row is the teammate's avatar
 * (28, flat, its own colour and shape), its name (13) and one line (12 at 65 %); the selected row a 5 % ground, radius
 * 8. Line icons only where they act, at 50 %,
 * 100 % on hover. Spacing 8 / 16 / 24 (4 inline). Shadows only on the bell's elevated dropdown. Motion: colour /
 * opacity 150 ms; a working teammate breathes (opacity 1 ↔ .5, 2.4 s; reduced motion holds .65); nothing else moves.
 */
.mws{--bg:#000;--elevated:#111;--fg:#fff;--fg-2:rgba(255,255,255,.65);--fg-3:rgba(255,255,255,.5);--rule:rgba(255,255,255,.1);--rule-soft:rgba(255,255,255,.05);--warn:#f0a35e;--danger:#f87171;--av-mark-bg:#2a2a2a;--av-mark-fg:#fff;--shadow:0 8px 24px rgba(0,0,0,.5);--fast:150ms ease;--font:-apple-system,BlinkMacSystemFont,"SF Pro Text","PingFang SC","Hiragino Sans GB","Microsoft YaHei UI",sans-serif;position:relative;width:100%;height:100%;min-width:0;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;background:var(--bg);color:var(--fg);border-right:1px solid var(--rule);font:13px/18px var(--font);letter-spacing:0;-webkit-font-smoothing:antialiased}
html[data-mywork-theme="light"] .mws{--bg:#fff;--elevated:#fff;--fg:#000;--fg-2:rgba(0,0,0,.65);--fg-3:rgba(0,0,0,.55);--rule:rgba(0,0,0,.1);--rule-soft:rgba(0,0,0,.05);--warn:#b5480a;--danger:#c0392b;--av-mark-bg:#111;--av-mark-fg:#fff;--shadow:0 8px 24px rgba(0,0,0,.08)}
.mws *{box-sizing:border-box}
.mws button{font-family:inherit;transition:color var(--fast),background-color var(--fast),border-color var(--fast),opacity var(--fast)}
/* (html body .mws: the shell theme rings every :focus-visible in its brand colour; ours is white at 50 %.) */
html body .mws :focus-visible{outline:2px solid var(--fg-3);outline-offset:-2px}
html body .mws input:focus{outline:none}
.mws ::selection{background:rgba(255,255,255,.25);color:var(--fg)}
@media (prefers-reduced-motion:reduce){.mws *{transition:none!important;animation:none!important}}
.mws-breathe{animation:mws-breathe 2.4s ease-in-out infinite}
@keyframes mws-breathe{0%,100%{opacity:1}50%{opacity:.5}}
@media (prefers-reduced-motion:reduce){.mws .mws-breathe{opacity:.65}}
/* The MyWork mark: an M whose last stroke turns into a check, 18px, white. */
.mws-mark{display:inline-grid;place-items:center;flex:none;color:var(--fg)}
.mws-mark svg{display:block}
/*
 * One geometry for both states. dsh's collapsed rail is 56px, so the avatar column is left 14 / 28 wide / centre 28
 * everywhere: list 4 + row 10 to the avatar, the mark in a 28 box on the same column, labels and 文件 / 设置 starting at
 * 14. Collapsed, nothing moves; the words are hidden and the rail clips the rest.
 * Density as in a desktop IM list (Feishu / WeChat run 14 / 12 at 64): name 13, line 12, time 11, avatar 28, row 52.
 */
/* Header: the mark · search · bell · + · collapse (collapsed: the mark alone; it expands, the panel icon on hover). */
.mws-head{position:relative;display:flex;align-items:center;gap:4px;flex:none;height:52px;padding:0 8px 0 14px}
.mws-brand{appearance:none;display:grid;place-items:center;flex:none;width:28px;height:28px;padding:0;border:0;border-radius:8px;background:transparent;color:var(--fg)}
.mws-brand>*{grid-area:1/1;transition:opacity var(--fast)}
.mws-brand .alt{display:grid;place-items:center;opacity:0}
button.mws-brand{cursor:pointer}
button.mws-brand:hover .mws-mark,button.mws-brand:focus-visible .mws-mark{opacity:0}
button.mws-brand:hover .alt,button.mws-brand:focus-visible .alt{opacity:1}
.mws-search{flex:1;min-width:0;height:28px;margin:0 4px 0 8px;border:1px solid var(--rule);border-radius:8px;transition:border-color var(--fast)}
.mws-search:focus-within{border-color:var(--fg-3)}
.mws-search input{display:block;width:100%;height:100%;margin:0;padding:0 8px;border:0;background:transparent;color:var(--fg);font:inherit;font-size:12px;outline:none}
.mws-search input::placeholder{color:var(--fg-3)}
.mws-icon{appearance:none;position:relative;display:inline-grid;place-items:center;flex:none;width:28px;height:28px;padding:0;border:0;border-radius:8px;background:transparent;color:var(--fg-3);cursor:pointer}
.mws-icon:hover,.mws-icon[aria-expanded=true]{color:var(--fg)}
.mws-icon svg{display:block}
/* The bell's dot: white while someone works or something needs you, --warn when a question waits on you. */
.mws-dot{position:absolute;top:5px;right:5px;width:6px;height:6px;border-radius:50%;background:var(--fg);pointer-events:none}
.mws-dot[data-needs=true]{background:var(--warn)}
/* The bell's panel: an elevated layer under the header, over the list. */
.mws-drop{position:absolute;top:46px;left:8px;right:8px;z-index:20;max-height:min(420px,calc(100vh - 120px));overflow:auto;padding:8px;border:1px solid var(--rule);border-radius:8px;background:var(--elevated);box-shadow:var(--shadow)}
.mws-drop h3{margin:8px 8px 4px;color:var(--fg-3);font-size:12px;line-height:16px;font-weight:400}
.mws-list{flex:1;min-height:0;overflow-x:hidden;overflow-y:auto;padding:0 4px 16px;scrollbar-width:thin;scrollbar-color:var(--rule) transparent}
/* Section labels: 12 at 50 %, sentence case, the chevron after the words (open: down; folded: right, with the count). */
.mws-sec+.mws-sec{margin-top:8px}
.mws-sec-head{appearance:none;display:flex;align-items:center;gap:4px;width:100%;height:28px;padding:0 10px;border:0;border-radius:8px;background:transparent;color:var(--fg-3);font:inherit;font-size:12px;line-height:16px;font-weight:400;text-align:left;cursor:pointer}
.mws-sec-head:hover{color:var(--fg)}
.mws-sec-head svg{flex:none}
.mws-sec-head[aria-expanded=false] svg{transform:rotate(-90deg)}
.mws-sec-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mws-sec-count{flex:none;margin-left:4px;font-variant-numeric:tabular-nums}
.mws-sec-head .mws-badge{margin-left:8px}
/* Collapsed, the label's place holds a 16px rule on the avatar column; folded, the count (or the badge sum) instead. */
.mws-sec-mark{display:grid;place-items:center;width:28px;height:16px;font-variant-numeric:tabular-nums}
.mws-sec-mark:empty::before{content:'';width:16px;height:1px;background:var(--rule)}
.mws-sec-mark .mws-badge{margin:0}
/* Rows: the avatar (28, the unread badge on its top-right), then the name 13 and the time 11 at 50 % on one line and one
 * line of 12 at 65 % under it. */
.mws-row{appearance:none;display:grid;grid-template-columns:28px minmax(0,1fr);column-gap:10px;align-items:center;width:100%;min-width:0;padding:8px 8px 8px 10px;border:0;border-radius:8px;background:transparent;color:var(--fg);font:inherit;text-align:left;cursor:pointer}
.mws-main{display:grid;gap:2px;min-width:0}
.mws-avw{position:relative;isolation:isolate;display:block;width:28px;height:28px;line-height:0}
.mws-av{display:inline-block;flex:none;line-height:0;user-select:none}
.mws-av svg{display:block;overflow:visible}
.mws-av-none{display:block;width:28px;height:28px}
.mws-row:hover,.mws-row[aria-current=page]{background:var(--rule-soft)}
.mws-line{display:flex;align-items:baseline;min-width:0}
.mws-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;line-height:18px;font-weight:400}
.mws-time{flex:none;margin-left:8px;color:var(--fg-3);font-size:11px;line-height:16px;font-variant-numeric:tabular-nums;white-space:nowrap}
.mws-sub{display:block;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--fg-2);font-size:12px;line-height:16px}
.mws-sub[data-tone=warn]{color:var(--warn)}
.mws-sub[data-tone=danger]{color:var(--danger)}
/* The unread badge (IM): a pill, white 11 / 600 tabular on red; on an avatar 16 high at its top-right, ringed in the ground. */
.mws-badge{flex:none;display:inline-block;min-width:18px;height:18px;margin-left:8px;padding:0 6px;border-radius:9px;background:#e5484d;color:#fff;font-size:11px;line-height:18px;font-weight:600;font-variant-numeric:tabular-nums;text-align:center;white-space:nowrap}
.mws-badge.on{position:absolute;top:-6px;right:-6px;min-width:16px;height:16px;margin:0;padding:0 4px;border-radius:8px;font-size:10px;line-height:16px;box-shadow:0 0 0 2px var(--bg)}
/* 新同事 closes the list: a 28 outlined square with + on the avatar column, the words at 50 %. */
.mws-add{margin-top:4px;color:var(--fg-3)}
.mws-add:hover{color:var(--fg)}
.mws-add-box{display:grid;place-items:center;width:28px;height:28px;border:1px solid var(--rule);border-radius:8px}
.mws-empty{padding:16px 10px;color:var(--fg-3);font-size:12px;line-height:16px}
/* Footer: 文件 and 设置 as plain text rows, the words at 14 (two characters of 13 sit on the avatar column). */
.mws-foot{flex:none;padding:4px 4px 0;border-top:1px solid var(--rule)}
.mws-flat{appearance:none;display:flex;align-items:center;width:100%;height:32px;padding:0 10px;border:0;border-radius:8px;background:transparent;color:var(--fg);font:inherit;font-size:13px;line-height:18px;text-align:left;white-space:nowrap;cursor:pointer}
.mws-flat:hover,.mws-flat[aria-current=page]{background:var(--rule-soft)}
/* The settings entry is dsh's own trigger; it wears the 文件 row. */
.mws-settings{flex:none;padding:0 4px 12px}
.mws-settings .dcu-settings-trigger{height:32px;min-height:32px;padding:0 10px;border-radius:8px;color:var(--fg);font:400 13px/18px var(--font);white-space:nowrap;transition:background-color var(--fast),color var(--fast)}
.mws-settings .dcu-settings-trigger:hover,.mws-settings .dcu-settings-trigger[aria-expanded=true]{background:var(--rule-soft);color:var(--fg)}
.mws-settings .dcu-settings-trigger:active{transform:none}
html body .mws-settings .dcu-settings-trigger:focus-visible{outline:2px solid var(--fg-3);outline-offset:-2px;background:transparent}
.mws-settings .dcu-settings-trigger-content{display:block}
.mws-settings .dcu-settings-trigger-content svg{display:none}
/* Collapsed: the same rows; the words hidden, the selected / hovered ground a 40 square around the avatar. */
.mws.compact .mws-list{scrollbar-width:none}
.mws.compact .mws-list::-webkit-scrollbar{display:none}
.mws.compact .mws-main{visibility:hidden}
.mws.compact .mws-row{padding-right:0}
.mws.compact .mws-row:hover,.mws.compact .mws-row[aria-current=page]{background:transparent}
.mws.compact .mws-row:hover .mws-avw::before,.mws.compact .mws-row[aria-current=page] .mws-avw::before{content:'';position:absolute;z-index:-1;inset:-4px;border-radius:8px;background:var(--rule-soft)}
.mws.compact .mws-flat,.mws.compact .mws-settings .dcu-settings-trigger{padding-right:0}
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
/**
 * The column's sections: 置顶 (every pinned teammate, whatever its group), then one per group name in a stable order —
 * alphabetical by name, zh-CN collation, so activity never moves a section — then 其他 (no group). Empty sections are
 * left out; each keeps orderMates' order.
 */
export function sectionMates(mates: Mate[]): Section[] {
  const pinned: Mate[] = []
  const other: Mate[] = []
  const groups = new Map<string, Mate[]>()
  for (const m of orderMates(mates)) {
    if (isPinned(m)) { pinned.push(m); continue }
    const name = str(m.group).trim()
    if (name === '') { other.push(m); continue }
    const list = groups.get(name)
    if (list !== undefined) list.push(m)
    else groups.set(name, [m])
  }
  // Stable: a group keeps its place from the day it was formed (its earliest member), never by activity or alphabet.
  const born = (list: Mate[]): number => Math.min(...list.map(m => Date.parse(str(m.createdAt)) || 0))
  const named = [...groups].sort(([a, la], [b, lb]) => (born(la) - born(lb)) || a.localeCompare(b, 'zh-CN'))
  const out: Section[] = []
  if (pinned.length > 0) out.push({ key: 'pinned', kind: 'pinned', name: '', mates: pinned })
  for (const [name, list] of named) out.push({ key: 'g:' + name, kind: 'group', name, mates: list })
  if (other.length > 0) out.push({ key: 'other', kind: 'other', name: '', mates: other })
  return out
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
    out.push({ key: `msg:${mateId}:${str(x.runId)}:${i}`, glyph: 'message', mate: byId.get(mateId), title: byId.get(mateId)?.name ?? str(x.mateName), sub: str(x.text), at: str(x.at), target: { kind: 'mate', id: mateId, runId: str(x.runId) || undefined } })
  })
  for (const x of list('files')) {
    const id = str(x.id)
    if (id === '') continue
    out.push({ key: 'file:' + id, glyph: 'file', mate: byId.get(str(x.mateId)), title: str(x.title), sub: byId.get(str(x.mateId))?.name ?? '', at: str(x.createdAt), target: { kind: 'files', id } })
  }
  for (const x of list('routines')) {
    const id = str(x.id)
    if (id === '') continue
    const owner = byId.get(str(x.mateId))?.name ?? ''
    out.push({ key: 'routine:' + id, glyph: 'routine', mate: byId.get(str(x.mateId)), title: str(x.title), sub: [str(x.scheduleLabel), owner].filter(s => s !== '').join(' · '), at: str(x.lastAt) || str(x.nextRunAt), target: { kind: 'routine', id, mateId: str(x.mateId) || undefined } })
  }
  return out
}
function fire(name: string, detail: Record<string, unknown>, cancelable = false): boolean {
  try { return !window.dispatchEvent(new CustomEvent(name, { detail, cancelable })) } catch { return false }
}

/** The MyWork mark: an M whose last stroke turns into a check — the product mark, white, 18px by default. */
export function BrandMark({ size = 18 }: { size?: number }): ReactElement {
  const box: CSSProperties = { width: size, height: size }
  return <span className="mws-mark" style={box} aria-hidden="true">
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"><path d="M4.5 18.5V7l5.5 6.5L15.5 7M10.5 17l3 3 6-6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </span>
}

/**
 * Avatars (the same recipe as dsh-mywork-tasks' page): a flat shape with two eyes in the look the owner picked for the
 * teammate (mate.avatar { color, shape }: one of 8 muted colour keys and 4 shapes), else derived from its id per field.
 * The colours are mid-tones that sit on #000 without glowing; [fill, eyes]. MyWork keeps its M-check mark.
 */
const AV_COLORS: Record<string, [string, string]> = { slate: ['#5f6b7a', '#ffffff'], blue: ['#4c6d9e', '#ffffff'], teal: ['#3f7f7b', '#ffffff'], green: ['#5a8160', '#ffffff'], amber: ['#a48344', '#141414'], orange: ['#a9673f', '#ffffff'], rose: ['#9d5868', '#ffffff'], violet: ['#71609f', '#ffffff'] }
const AV_COLOR_KEYS = Object.keys(AV_COLORS)
/** In a 100 box; the hexagon is drawn with a round-joined stroke of its own colour, so its corners are soft. */
const AV_SHAPES: Record<string, string> = { circle: 'M50 4a46 46 0 1 1 0 92a46 46 0 1 1 0-92Z', squircle: 'M34 4h32c20 0 30 10 30 30v32c0 20-10 30-30 30H34C14 96 4 86 4 66V34C4 14 14 4 34 4Z', pebble: 'M50 8c28 0 46 14 46 40s-18 44-46 44S4 74 4 48 22 8 50 8Z', hex: 'M50 8L86.4 29V71L50 92L13.6 71V29Z' }
const AV_SHAPE_KEYS = Object.keys(AV_SHAPES)
/** Rakazo's shippedHash (FNV-1a): the derived look is stable per teammate. */
function avatarHash(v: string): number { let x = 2166136261; for (let i = 0; i < v.length; i++) x = Math.imul(x ^ v.charCodeAt(i), 16777619); return x >>> 0 }
function lookOf(mate: Mate): { color: string; shape: string } {
  const a = mate.avatar ?? {}
  const hash = avatarHash(str(mate.id) || str(mate.name) || 'mate')
  const color = a.color !== undefined && a.color in AV_COLORS ? a.color : AV_COLOR_KEYS[hash % AV_COLOR_KEYS.length]
  const shape = a.shape !== undefined && a.shape in AV_SHAPES ? a.shape : AV_SHAPE_KEYS[(Math.imul(hash ^ (hash >>> 16), 73244475) >>> 0) % AV_SHAPE_KEYS.length]
  return { color, shape }
}
/** A teammate's avatar; working, it breathes (opacity 1 ↔ .5 over 2.4 s; .65 under reduced motion). */
export function MateAvatar({ mate, size = 32 }: { mate: Mate; size?: number }): ReactElement {
  const cls = 'mws-av' + (mate.state === 'working' ? ' mws-breathe' : '')
  if (mate.isDefault === true) {
    return <span className={cls} aria-hidden="true">
      <svg viewBox="0 0 100 100" width={size} height={size}><circle cx="50" cy="50" r="46" fill="var(--av-mark-bg)" /><svg x="22" y="22" width="56" height="56" viewBox="0 0 24 24" fill="none"><path d="M4.5 18.5V7l5.5 6.5L15.5 7M10.5 17l3 3 6-6" stroke="var(--av-mark-fg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></svg>
    </span>
  }
  const look = lookOf(mate)
  const [fill, eye] = AV_COLORS[look.color] ?? AV_COLORS.slate
  const d = AV_SHAPES[look.shape] ?? AV_SHAPES.circle
  return <span className={cls} aria-hidden="true">
    <svg viewBox="0 0 100 100" width={size} height={size}>
      {look.shape === 'hex' ? <path d={d} fill={fill} stroke={fill} strokeWidth="8" strokeLinejoin="round" /> : <path d={d} fill={fill} />}
      <g fill={eye}><ellipse cx="37.3" cy="46.5" rx="4.4" ry="3.1" /><ellipse cx="62.7" cy="46.5" rx="4.4" ry="3.1" /></g>
    </svg>
  </span>
}

/** The second line: 等你答 · question (--warn) / 在干活 · step (breathing) / the last thing said. */
function secondLine(mate: Mate, t: SidebarProps['t']): { text: string; tone?: 'warn'; live?: boolean } {
  if (mate.state === 'waiting') { const q = str(mate.ask?.question).replace(/\*\*|__|`/g, ''); return { text: [t('v2.waitingAsk'), q].filter(s => s !== '').join(' · '), tone: 'warn' } }
  if (mate.state === 'working') return { text: [t('v2.working'), str(mate.step)].filter(s => s !== '').join(' · '), live: true }
  return { text: str(mate.preview) }
}

/** The unread count as an IM badge (nothing at 0; 99+ above 99). */
function Badge({ n, on = false, t }: { n: number; on?: boolean; t: SidebarProps['t'] }): ReactElement | null {
  if (n <= 0) return null
  return <span className={'mws-badge' + (on ? ' on' : '')} role="img" aria-label={t('v2.unreadCount').replace('{0}', String(n))}>{n > 99 ? '99+' : String(n)}</span>
}

/** A teammate's row; collapsed, the same row with the words hidden (its name becomes the tooltip). */
function MateRow({ mate, time, current, unread, compact, t, onOpen }: { mate: Mate; time: string; current: boolean; unread: number; compact: boolean; t: SidebarProps['t']; onOpen: () => void }): ReactElement {
  const sub = secondLine(mate, t)
  return <button type="button" className="mws-row" title={compact ? mate.name : undefined} aria-current={current ? 'page' : undefined} data-unread={unread > 0 ? 'true' : undefined} onClick={onOpen}>
    <span className="mws-avw"><MateAvatar mate={mate} size={28} /><Badge n={unread} on t={t} /></span>
    <span className="mws-main">
      <span className="mws-line"><span className="mws-title">{mate.name}</span>{time !== '' && <span className="mws-time">{time}</span>}</span>
      {sub.text !== '' && <span className="mws-line"><span className={'mws-sub' + (sub.live === true ? ' mws-breathe' : '')} data-tone={sub.tone}>{sub.text}</span></span>}
    </span>
  </button>
}

/**
 * A search result: the avatar of the teammate it belongs to and the same two lines; a file or a routine says what it
 * is at the start of its second line.
 */
function ResultItem({ row, time, t, onOpen }: { row: ResultRow; time: string; t: SidebarProps['t']; onOpen: () => void }): ReactElement {
  const kind = row.glyph === 'file' ? t('v2.files') : row.glyph === 'routine' ? t('v2.routine') : ''
  const sub = [kind, row.sub].filter(s => s !== '').join(' · ')
  return <button type="button" className="mws-row" onClick={onOpen}>
    {row.mate !== undefined ? <MateAvatar mate={row.mate} size={28} /> : <span className="mws-av-none" aria-hidden="true" />}
    <span className="mws-main">
      <span className="mws-line"><span className="mws-title">{row.title}</span>{time !== '' && <span className="mws-time">{time}</span>}</span>
      {sub !== '' && <span className="mws-sub">{sub}</span>}
    </span>
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
  const [folded, setFolded] = useState<Record<string, boolean>>(storedSections)
  const toggleSection = (key: string): void => {
    const next = { ...folded }
    if (next[key] === true) delete next[key]
    else next[key] = true
    setFolded(next)
    try { localStorage.setItem(SECTIONS_KEY, JSON.stringify(next)) } catch { /* private mode: folded for this visit only */ }
  }
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

  const sections = useMemo(() => sectionMates(mates), [mates])
  // One section needs no header (and cannot fold).
  const headed = sections.length > 1
  const count = activity.needs.length + activity.working.length
  const asking = activity.needs.some(x => x.kind === 'ask')
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
  /**
   * The row's badge: results since you last opened that teammate (the server's unreadCount; 1 when it only says unread),
   * and at least 1 while it waits on your answer. Nothing on the teammate you have open, or one you just opened here
   * (until its lastAt moves). POST /seen on open is the page's.
   */
  const unreadOf = (mate: Mate): number => {
    if (highlighted === 'mate:' + mate.id) return 0
    const count = typeof mate.unreadCount === 'number' && Number.isFinite(mate.unreadCount) ? Math.max(0, Math.floor(mate.unreadCount)) : 0
    const fresh = (mate.unread === true || count > 0) && seen[mate.id] !== str(mate.lastAt)
    const n = fresh ? Math.max(1, count) : 0
    return mate.state === 'waiting' ? Math.max(1, n) : n
  }
  const sectionLabel = (sec: Section): string => sec.kind === 'pinned' ? t('v2.pinned') : sec.kind === 'other' ? t('v2.other') : sec.name

  // Collapsed, the list is the teammates (a search in progress waits in the field until the column opens again).
  const searching = needle !== '' && !compact
  return <div className={'mws' + (compact ? ' compact' : '')} data-mywork-sidebar="v2">
    <style>{stylesheet}</style>
    <div className="mws-head" ref={headRef}>
      {compact
        ? <button type="button" className="mws-brand" aria-label={t('sidebar.expand')} title={t('sidebar.expand')} onClick={toggleSidebar}>
          <BrandMark /><span className="alt"><PanelLeft size={16} strokeWidth={1.5} /></span>
        </button>
        : <span className="mws-brand"><BrandMark /></span>}
      {!compact && <>
        <label className="mws-search"><input type="text" value={query} placeholder={t('v2.search')} aria-label={t('v2.search')} autoComplete="off" spellCheck={false} onChange={event => { setQuery(event.target.value) }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); setQuery('') } }} /></label>
        <button type="button" className="mws-icon" aria-label={t('v2.bell')} title={t('v2.bell')} aria-haspopup="true" aria-expanded={bellOpen} onClick={() => { setBellOpen(!bellOpen) }}>
          <Bell size={16} strokeWidth={1.5} />{count > 0 && <span className="mws-dot" data-needs={asking ? 'true' : undefined} aria-hidden="true" />}
        </button>
        <button type="button" className="mws-icon" aria-label={t('v2.newMate')} title={t('v2.newMate')} onClick={() => { open({ kind: 'new-mate' }) }}><Plus size={16} strokeWidth={1.5} /></button>
        <button type="button" className="mws-icon" aria-label={t('sidebar.collapse')} title={t('sidebar.collapse')} onClick={toggleSidebar}><PanelLeft size={16} strokeWidth={1.5} /></button>
      </>}
      {bellOpen && !compact && <div className="mws-drop" role="dialog" aria-label={t('v2.bell')}>
        {groups.every(([, items]) => items.length === 0) && <div className="mws-empty">{t('v2.quiet')}</div>}
        {groups.map(([label, items]) => items.length === 0 ? null : <div key={label}>
          <h3>{label}</h3>
          {items.map((item, i) => {
            const mate = byId.get(item.mateId) ?? { id: item.mateId, name: str(item.mateName) }
            return <button key={`${item.mateId}:${str(item.runId)}:${i}`} type="button" className="mws-row" onClick={() => { open({ kind: 'mate', id: item.mateId, runId: str(item.runId) || undefined }) }}>
              <MateAvatar mate={mate} size={28} />
              <span className="mws-main">
                <span className="mws-line"><span className="mws-title">{str(mate.name) || str(item.mateName)}</span><span className="mws-time">{fmtWhen(str(item.at), now)}</span></span>
                {str(item.text) !== '' && <span className="mws-sub" data-tone={item.kind === 'ask' ? 'warn' : item.kind === 'failed' ? 'danger' : undefined}>{str(item.text)}</span>}
              </span>
            </button>
          })}
        </div>)}
      </div>}
    </div>
    <div className="mws-list">
      {!searching
        ? sections.map(sec => {
          const rows = sec.mates.map(mate => <MateRow key={mate.id} mate={mate} t={t} compact={compact} time={fmtWhen(str(mate.lastAt), now)} current={highlighted === 'mate:' + mate.id} unread={unreadOf(mate)} onOpen={() => { open({ kind: 'mate', id: mate.id }) }} />)
          if (!headed) return <Fragment key={sec.key}>{rows}</Fragment>
          const closed = folded[sec.key] === true
          // Folded, the label keeps the count of teammates and the sum of their badges.
          const news = closed ? sec.mates.reduce((n, m) => n + unreadOf(m), 0) : 0
          return <div key={sec.key} className="mws-sec" role="group" aria-label={sectionLabel(sec)}>
            <button type="button" className="mws-sec-head" title={compact ? sectionLabel(sec) : undefined} aria-expanded={!closed} onClick={() => { toggleSection(sec.key) }}>
              {compact
                // Collapsed: a rule where the label was; folded, the badge sum or else the count.
                ? <span className="mws-sec-mark">{closed ? (news > 0 ? <Badge n={news} t={t} /> : sec.mates.length) : null}</span>
                : <>
                  <span className="mws-sec-name">{sectionLabel(sec)}</span>
                  <ChevronDown size={12} strokeWidth={1.5} aria-hidden="true" />
                  {closed && <span className="mws-sec-count">{sec.mates.length}</span>}
                  <Badge n={news} t={t} />
                </>}
            </button>
            {!closed && rows}
          </div>
        })
        : results.map(row => <ResultItem key={row.key} row={row} t={t} time={fmtWhen(row.at, now)} onOpen={() => { open(row.target) }} />)}
      {searching && remote !== null && results.length === 0 && <div className="mws-empty">{t('v2.noResults')}</div>}
      {!searching && <button type="button" className="mws-row mws-add" title={compact ? t('v2.newMate') : undefined} onClick={() => { open({ kind: 'new-mate' }) }}>
        <span className="mws-avw"><span className="mws-add-box"><Plus size={16} strokeWidth={1.5} /></span></span>
        <span className="mws-main"><span className="mws-title">{t('v2.newMate')}</span></span>
      </button>}
    </div>
    <footer className="mws-foot">
      <button type="button" className="mws-flat" aria-current={highlighted === 'files' ? 'page' : undefined} onClick={() => { open({ kind: 'files' }) }}>{t('v2.files')}</button>
    </footer>
    {/* dsh's settings trigger, always with its words: collapsed, 设置 stays where it was like 文件. */}
    <div className="mws-settings">{renderSlot('sidebar.settings', { wide: true })}</div>
  </div>
}
