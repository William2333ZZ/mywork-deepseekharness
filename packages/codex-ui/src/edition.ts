/**
 * Edition switch. The `digital-oracle-work` branch ships the "交易工作台" (Trading Workbench) edition: the market cockpit is the
 * home, the sidebar speaks analysis (驾驶舱 / 新分析 / 分析记录), coding affordances live under 更多, session titles are
 * questions. main keeps EDITION = 'kit'. See design/DESIGN.md. The product name is one constant so renaming is a one-liner.
 */
export const EDITION: 'kit' | 'oracle' = 'oracle'
export const EDITION_NAME = '交易工作台'
export const EDITION_NAME_EN = 'Trading Workbench'
export const EDITION_LABEL = { zh: EDITION_NAME, en: EDITION_NAME_EN } as const
/** Browser-side override for debugging: localStorage `dsh-mywork:edition` = 'kit' shows the plain kit shell. */
export function editionActive(): boolean {
  if (EDITION !== 'oracle') return false
  try { return globalThis.localStorage?.getItem('dsh-mywork:edition') !== 'kit' } catch { return true }
}
