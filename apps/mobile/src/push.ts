/**
 * Phone notifications. The installed app has none yet (push.web.ts: the web version subscribes with the browser's Web
 * Push, and the computer pushes to it directly).
 */
import type { Api } from './api'

/** off: not on · on: this phone gets notifications · denied: blocked in the browser · install: iPhone, add to home screen first · unsupported */
export type PushState = 'off' | 'on' | 'denied' | 'install' | 'unsupported'

export async function pushState(): Promise<PushState> { return 'unsupported' }
export async function pushEnable(_api: Api): Promise<PushState> { return 'unsupported' }
export async function pushDisable(_api: Api): Promise<PushState> { return 'unsupported' }
export async function pushTest(_api: Api): Promise<void> { throw new Error('这个版本还不能收通知') }
/** Keep the computer's copy of this phone's subscription current (a browser may renew it). */
export async function pushResync(_api: Api): Promise<void> {}
/** A tapped notification asks to open a teammate's conversation; `onPush`: one just arrived. Returns the unsubscribe. */
export function onPushMessages(_open: (mateId: string, runId?: string) => void, _onPush: () => void): () => void { return () => {} }
/** The teammate a tapped notification opened this page for (/?mate=…&run=…), taken out of the address. */
export function openedFor(): { mateId: string; runId?: string } | null { return null }
