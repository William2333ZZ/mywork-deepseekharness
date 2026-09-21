/**
 * 读取当前已注册的设置分区标签。侧栏只为真实存在的分区显示入口，
 * 缺失的分区（未安装专家 / 技能 / 定时任务 / IM 插件）不再显示，也不再兜底到关于页。
 */
export type SettingsSectionSource = {
  getSnapshot: () => ReadonlySet<string>
  subscribe: (listener: () => void) => () => void
}

type SectionSlots = {
  entriesOfSlot(name: 'settings.section'): readonly { options: { label?: string | (() => string | undefined) } }[]
  subscribe(name: 'settings.section', listener: () => void): () => void
}

export const EMPTY_SECTIONS: ReadonlySet<string> = new Set()

/** 与 global-panels 相同的外部状态契约：快照按内容缓存，避免每次渲染都换引用。 */
export function createSettingsSectionSource(slots: SectionSlots, locale: { subscribe: (listener: () => void) => () => void }): SettingsSectionSource {
  let cached: ReadonlySet<string> = EMPTY_SECTIONS
  return {
    getSnapshot() {
      const next = new Set<string>()
      for (const { options } of slots.entriesOfSlot('settings.section')) {
        let label: string | undefined
        try { label = typeof options.label === 'function' ? options.label() : options.label } catch { label = undefined }
        if (typeof label === 'string' && label.trim() !== '') next.add(label.trim())
      }
      if (next.size !== cached.size || [...next].some(label => !cached.has(label))) cached = next
      return cached
    },
    subscribe(listener) {
      const offSlots = slots.subscribe('settings.section', listener)
      const offLocale = locale.subscribe(listener)
      return () => { offSlots(); offLocale() }
    },
  }
}

/** 侧栏导航里可选入口的可用性；plugins / connectors / about 由本插件自己注册，始终可用。 */
export type OptionalSectionAvailability = {
  readonly experts: boolean
  readonly skills: boolean
  readonly schedule: boolean
  readonly assistant: boolean
}

export function optionalSectionAvailability(sections: ReadonlySet<string>, labels: { experts: string; skills: string; schedule: string; assistant: readonly string[] }, companions: { channels: boolean; schedule: boolean }): OptionalSectionAvailability {
  return {
    experts: sections.has(labels.experts),
    skills: sections.has(labels.skills),
    schedule: sections.has(labels.schedule) || companions.schedule,
    assistant: companions.channels || labels.assistant.some(label => sections.has(label)),
  }
}
