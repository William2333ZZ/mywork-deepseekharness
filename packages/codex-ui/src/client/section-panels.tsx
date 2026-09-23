/**
 * Standalone main panels (like dsh's own Plugins page) for features that upstream
 * exposed only as settings sections:
 *
 *   定时任务  – hosts the `settings.section` entry of @michengai/dsh-automation
 *   IM助理    – hosts the `settings.section` entry of @michengai/dsh-im-connect
 *   MCP 连接器 – this package's native connector list (+ a link to the
 *               dsh-mcp-connector market page, opened in a new tab, never an iframe)
 *
 * A hosted section component is mounted with the same face the settings shell
 * would give it: its inject face, a `t` bound to its declared locale namespace
 * and a `close` that returns to the conversation.
 */
import { createElement, useSyncExternalStore, type ComponentType, type ReactElement, type ReactNode } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type { PropsRenderSlots, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /** Sections of the MCP page; dsh-mywork-mcp contributes the server manager here. */
    'mywork.mcp.section': { kind: 'list'; scope: 'root'; owner: {} }
    /** Top of the 定时任务 page; dsh-mywork-schedule contributes the run-notification card here. */
    'mywork.schedule.section': { kind: 'list'; scope: 'root'; owner: {} }
    /** Top of the IM page; dsh-mywork-im contributes the outbound send card here. */
    'mywork.im.section': { kind: 'list'; scope: 'root'; owner: {} }
  }
}
import { CalendarClock, MessageSquareMore, Plug } from 'lucide-react'
import { NS } from './locales.ts'

export const SCHEDULE_PANEL_ID = 'mywork-schedule'
export const IM_PANEL_ID = 'mywork-im'
export const MCP_PANEL_ID = 'mywork-mcp'
export const SECTION_PANEL_IDS: readonly string[] = [SCHEDULE_PANEL_ID, IM_PANEL_ID, MCP_PANEL_ID]

/** settings.section ids registered by the companion plugins. */
const AUTOMATION_SECTION_ID = 'scheduled-tasks'
const IM_SECTION_ID = 'im-assistant'

type SectionEntry = { component: unknown; options: { id?: string }; inject?: (...args: never[]) => Record<string, unknown>; locale?: string }
type SectionSlots = {
  entriesOfSlot(name: 'settings.section'): readonly SectionEntry[]
  subscribe(name: 'settings.section', listener: () => void): () => void
}
type LocaleService = { bind(namespace: string): (key: string, values?: Record<string, unknown>) => string }

const stylesheet = `
.dcu-panel-page{display:flex;flex-direction:column;height:100%;min-height:0;overflow:auto;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}
.dcu-panel-head{display:flex;align-items:center;gap:10px;padding:18px 28px 8px;font-size:18px;font-weight:600}
.dcu-panel-head svg{color:var(--dsw-alias-label-secondary)}
.dcu-panel-body{flex:1;min-height:0;padding:4px 28px 28px}
/* Hosted sections (dsh-automation, dsh-im-connect) repeat the page title in their own heading row; keep their links, hide the duplicate title visually. */
.dcu-panel-body .dsh-st-heading-row>h1,.dcu-panel-body .ima-title-row>h2{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.dcu-panel-body .dsh-st-heading-row,.dcu-panel-body .ima-title-row{display:flex;justify-content:flex-end;align-items:center;min-height:0;margin:0 0 8px;padding:0}
.dcu-panel-body>.dcu-panel-hosted:first-child .dsh-st-heading-row,.dcu-panel-body .dsh-st-shell .dsh-st-heading-row{margin-top:-40px}
.dcu-panel-body .dsh-st-heading-row .mpi-version,.dcu-panel-body .ima-title-row .mpi-version{position:static;margin:0 8px 0 0;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dcu-panel-body .dsh-st-heading-links,.dcu-panel-body .ima-title-links{display:flex;gap:6px;margin-left:auto}
.dcu-panel-empty{max-width:560px;margin:24px 0;line-height:1.7;color:var(--dsw-alias-label-secondary);font-size:13px}
.dcu-panel-hint{max-width:720px;margin:0 0 16px;line-height:1.7;color:var(--dsw-alias-label-secondary);font-size:13px}
.dcu-panel-hint code{font-family:ui-monospace,Menlo,monospace;font-size:12px}
.dcu-panel-divider{height:1px;background:var(--dsw-alias-border-l2);margin:22px 0 18px}
`

export function ScheduleRailIcon(): ReactElement { return <CalendarClock size={16} strokeWidth={1.6} /> }
export function ImRailIcon(): ReactElement { return <MessageSquareMore size={16} strokeWidth={1.6} /> }
export function McpRailIcon(): ReactElement { return <Plug size={16} strokeWidth={1.6} /> }

function sectionSource(slots: SectionSlots, sectionId: string) {
  const find = (): SectionEntry | undefined => slots.entriesOfSlot('settings.section').find(entry => entry.options.id === sectionId)
  let cached = find()
  return {
    getSnapshot: (): SectionEntry | undefined => { const next = find(); if (next !== cached) cached = next; return cached },
    subscribe: (listener: () => void): (() => void) => slots.subscribe('settings.section', listener),
  }
}

/** Mount a settings.section entry outside the settings shell with the face it expects. */
function HostedSection({ entry, locale, close }: { entry: SectionEntry; locale: LocaleService; close: () => void }): ReactElement {
  let face: Record<string, unknown> = {}
  try { face = entry.inject?.() ?? {} } catch (error) { console.warn('[dsh-mywork-codex-ui] section inject face failed', error) }
  const props: Record<string, unknown> = { ...face, close }
  if (entry.locale !== undefined && props.t === undefined) props.t = locale.bind(entry.locale)
  return createElement(entry.component as ComponentType<Record<string, unknown>>, props)
}

export type SectionPanelsOptions = {
  /** Native MCP connector list (the same component as the 连接器 settings section). */
  renderConnectors: () => ReactNode
}

export function registerSectionPanels(ctx: Context, t: TranslateNS<typeof NS>, selectPanel: (id: string | null) => void, options: SectionPanelsOptions): void {
  const slots = ctx.slots as unknown as SectionSlots
  const locale = ctx.locale as unknown as LocaleService
  const close = (): void => { selectPanel(null) }

  const page = (title: string, icon: ReactElement, body: ReactNode): ReactElement => <div className="dcu-panel-page">
    <style>{stylesheet}</style>
    <div className="dcu-panel-head">{icon}<span>{title}</span></div>
    <div className="dcu-panel-body">{body}</div>
  </div>

  const hostedPanel = (sectionId: string, title: () => string, icon: () => ReactElement, missing: () => string) => {
    const source = sectionSource(slots, sectionId)
    return function SectionPanel(): ReactElement {
      const entry = useSyncExternalStore(source.subscribe, source.getSnapshot, source.getSnapshot)
      return page(title(), icon(), entry === undefined
        ? <p className="dcu-panel-empty">{missing()}</p>
        : <HostedSection entry={entry} locale={locale} close={close} />)
    }
  }

  const panels: { id: string; order: number; label: () => string; icon: () => ReactElement; component: () => ReactElement }[] = [
  ]
  for (const panel of panels) {
    ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: panel.id, locale: NS, inject: () => ({}) }, panel.component))
    ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: panel.id, order: panel.order, locale: NS, label: panel.label, inject: () => ({}) }, panel.icon))
  }
  // 定时任务 page: run-notification card (dsh-mywork-schedule, via the child slot) + the hosted dsh-automation section.
  const scheduleSource = sectionSource(slots, AUTOMATION_SECTION_ID)
  function SchedulePanel(props: PropsRenderSlots<'mywork.schedule.section'>): ReactElement {
    const entry = useSyncExternalStore(scheduleSource.subscribe, scheduleSource.getSnapshot, scheduleSource.getSnapshot)
    return page(t('sidebar.schedule'), <CalendarClock size={18} strokeWidth={1.6} />, <>
      {props.renderSlot('mywork.schedule.section', {})}
      {entry === undefined ? <p className="dcu-panel-empty">{t('schedulePanel.missing')}</p> : <HostedSection entry={entry} locale={locale} close={close} />}
    </>)
  }
  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main', key: SCHEDULE_PANEL_ID, locale: NS, inject: () => ({}),
    children: { 'mywork.schedule.section': { kind: 'list', scope: 'root' } },
  }, SchedulePanel))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: SCHEDULE_PANEL_ID, order: 20, locale: NS, label: () => t('sidebar.schedule'), inject: () => ({}) }, ScheduleRailIcon))
  // IM page: outbound send card (dsh-mywork-im, via the child slot) + the hosted dsh-im-connect section.
  const imSource = sectionSource(slots, IM_SECTION_ID)
  function ImPanel(props: PropsRenderSlots<'mywork.im.section'>): ReactElement {
    const entry = useSyncExternalStore(imSource.subscribe, imSource.getSnapshot, imSource.getSnapshot)
    return page(t('sidebar.assistant'), <MessageSquareMore size={18} strokeWidth={1.6} />, <>
      {props.renderSlot('mywork.im.section', {})}
      {entry === undefined ? <p className="dcu-panel-empty">{t('imPanel.missing')}</p> : <HostedSection entry={entry} locale={locale} close={close} />}
    </>)
  }
  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main', key: IM_PANEL_ID, locale: NS, inject: () => ({}),
    children: { 'mywork.im.section': { kind: 'list', scope: 'root' } },
  }, ImPanel))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: IM_PANEL_ID, order: 21, locale: NS, label: () => t('sidebar.assistant'), inject: () => ({}) }, ImRailIcon))
  // MCP page: server manager (dsh-mywork-mcp, via the child slot) + this package's native tool list.
  const managerSlots = ctx.slots as unknown as { entriesOfSlot(name: 'mywork.mcp.section'): readonly unknown[]; subscribe(name: 'mywork.mcp.section', listener: () => void): () => void }
  const managerCount = (): number => { try { return managerSlots.entriesOfSlot('mywork.mcp.section').length } catch { return 0 } }
  const subscribeManager = (listener: () => void): (() => void) => { try { return managerSlots.subscribe('mywork.mcp.section', listener) } catch { return () => {} } }
  function McpPanel(props: PropsRenderSlots<'mywork.mcp.section'>): ReactElement {
    const managers = useSyncExternalStore(subscribeManager, managerCount, managerCount)
    return page(t('sidebar.mcp'), <Plug size={18} strokeWidth={1.6} />, <>
      <p className="dcu-panel-hint">{t('mcpPanel.hint')}</p>
      {managers === 0 ? <p className="dcu-panel-empty">{t('mcpPanel.missing')}</p> : props.renderSlot('mywork.mcp.section', {})}
      <div className="dcu-panel-divider" />
      {options.renderConnectors()}
    </>)
  }
  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main', key: MCP_PANEL_ID, locale: NS, inject: () => ({}),
    children: { 'mywork.mcp.section': { kind: 'list', scope: 'root' } },
  }, McpPanel))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: MCP_PANEL_ID, order: 22, locale: NS, label: () => t('sidebar.mcp'), inject: () => ({}) }, McpRailIcon))
}
