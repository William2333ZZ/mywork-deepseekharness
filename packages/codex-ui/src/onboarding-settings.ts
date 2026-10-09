import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'

/**
 * Host half of dsh's `ui-settings-general` row without its settings shell. dsh 0.2 keeps the welcome notice's
 * acknowledgement in that row's settings section, so the row stays enabled (pointing here) while the sidebar and
 * settings page are ours; disabling it outright leaves the notice unable to save and it never closes.
 */
export const name = 'mywork-codex-ui-onboarding-settings'
export const Config = z.object({ welcomeNoticeVersion: z.string().volatile() })

export function apply(ctx: Context): void {
  ctx.inject(['settings'], (child) => {
    const settings = (child as unknown as { settings?: { configure?: (o: { auto: boolean }, fiber: unknown) => () => void } }).settings
    if (typeof settings?.configure === 'function') child.effect(() => settings.configure!({ auto: false }, ctx.fiber))
  })
}
