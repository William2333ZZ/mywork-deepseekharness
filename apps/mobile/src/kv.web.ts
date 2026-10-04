/**
 * The web version keeps the same small values in the browser's localStorage, on the relay's own origin (it serves
 * nothing but this app, so no other page shares it). A private window or blocked storage just forgets them.
 */
const store = (): Storage | null => { try { return window.localStorage } catch { return null } }

export const kvGet = async (key: string): Promise<string | null> => { try { const s = store(); return s ? s.getItem(key) : null } catch { return null } }
export const kvSet = async (key: string, value: string): Promise<void> => { try { const s = store(); if (s) s.setItem(key, value) } catch { /* kept for this visit only */ } }
export const kvDel = async (key: string): Promise<void> => { try { const s = store(); if (s) s.removeItem(key) } catch { /* nothing kept */ } }
