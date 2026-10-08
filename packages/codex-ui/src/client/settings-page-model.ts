/** 设置页只投影已注册能力；未知插件保留在扩展组，不隐藏入口。 */
export type SettingsRow = { id: string; label: string; order: number }
export type SettingsGroup = 'personal' | 'integrations' | 'records'

export function settingsGroup(id: string): SettingsGroup {
  if (/archive|about|^usage-statistics$/.test(id)) return 'records'
  if (/^(general|appearance|theme|language|shortcuts|voice|account)$/.test(id)) return 'personal'
  return 'integrations'
}

export function filterSettingsRows(rows: readonly SettingsRow[], query: string): readonly SettingsRow[] {
  const needle = query.trim().toLocaleLowerCase()
  return needle === '' ? rows : rows.filter(row => `${row.label} ${row.id}`.toLocaleLowerCase().includes(needle))
}

export function generalItemGroup(id: string): 'permissions' | 'general' | 'editor' {
  if (/permission|approval|sandbox/.test(id)) return 'permissions'
  if (/composer|font|conversation|chat|enter/.test(id)) return 'editor'
  return 'general'
}

/** MyWork v2: what a task user needs first; everything dsh-shaped goes under 高级. */
export type SettingsGroupV2 = 'common' | 'advanced'
export const SETTINGS_GROUPS_V2: readonly SettingsGroupV2[] = ['common', 'advanced']
const COMMON_V2: readonly string[] = ['general', 'models', 'dsh-mywork-kit', 'im-assistant', 'scheduled-tasks']
export function settingsGroupV2(id: string): SettingsGroupV2 { return COMMON_V2.includes(id) ? 'common' : 'advanced' }
export function settingsOrderV2(id: string): number { const i = COMMON_V2.indexOf(id); return i >= 0 ? i : 100 }
/** Labels a task user understands; falls back to the section's own label. */
export function settingsLabelV2(id: string): string | undefined {
  return ({ 'dsh-mywork-kit': 'settings.v2.scenarios', 'im-assistant': 'settings.v2.notify', 'scheduled-tasks': 'settings.v2.routine', connectors: 'settings.v2.mcp', 'archived-sessions': 'settings.v2.process', about: 'settings.v2.about' } as Record<string, string>)[id]
}
