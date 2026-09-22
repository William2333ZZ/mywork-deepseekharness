import { useEffect, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Globe, FileSpreadsheet, CalendarClock, MessageSquare } from 'lucide-react'
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
  const [selected, setSelected] = useState<Category>()
  const [hint, setHint] = useState<PrefillResult>('ready')
  function fill(text: string) {
    const result = prefill?.(text) ?? 'workspace'
    setHint(result)
    if (result === 'ready') document.querySelector<HTMLElement>('[data-phase=hero] [data-lexical-editor=true]')?.focus()
    if (result === 'workspace') document.querySelector<HTMLButtonElement>('[data-phase=hero] [class*="_heroWorkspaceRow"]>button')?.click()
  }
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
