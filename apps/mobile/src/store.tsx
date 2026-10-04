/**
 * MyWork mobile — connection, data and navigation for every screen.
 *
 *   useConn()  → { conn, api, pair(text), forget() }          the paired computer
 *   useStore() → { mates, activity, tick, loading, error, refresh() }  GET /mates + GET /activity, polled 5s while
 *                                                              a teammate works, 30s otherwise; `tick` counts polls
 *   useNav()   → { route, stack, push(r), pop(), replace(r), reset(r) }
 *
 * Navigation is a plain stack in state (no router dependency): Android back pops it. The stack starts on the
 * teammates list (home); everything else is pushed on top of it, so back always lands on the list.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AppState, BackHandler } from 'react-native'
import { Api, clearConnection, loadConnection, login, parsePairText, saveConnection, type ActivityPayload, type Connection, type Mate } from './api'
import type { Relay } from './relay'

/**
 * The screens (TEAMMATES.md §9.6): the teammates list · a teammate's conversation (runId: scroll to that run and
 * light it up) · the teammate's page (routineId: open that routine's sheet) · the bell's activity · a new teammate ·
 * files and one file · settings.
 */
export type Route =
  | { name: 'home' }
  | { name: 'mate'; id: string; runId?: string }
  | { name: 'mateInfo'; id: string; routineId?: string }
  | { name: 'activity' }
  | { name: 'newMate' }
  | { name: 'files'; mateId?: string }
  | { name: 'file'; id: string }
  /** A file of a teammate's folder: a table, a note or an image, read here (other kinds open in the phone's browser). */
  | { name: 'folderFile'; mateId: string; path: string }
  | { name: 'settings' }

type Nav = {
  route: Route; stack: Route[]; push: (r: Route) => void; pop: () => void; replace: (r: Route) => void; reset: (r: Route) => void
  /** Go to a teammate's conversation (at a run): back to it when it is already in the stack, pushed otherwise. */
  openMate: (id: string, runId?: string) => void
}
/** `via`: how the computer is reached now — its LAN gateway (same Wi-Fi) or the encrypted relay (anywhere). */
type Conn = { conn: Connection | null; api: Api | null; via: 'lan' | 'relay'; ready: boolean; failed: boolean; pair: (text: string) => Promise<string | null>; forget: () => Promise<void>; retry: () => Promise<void> }
type Store = {
  mates: Mate[] | null; activity: ActivityPayload | null; tick: number; loading: boolean; error: string
  refresh: () => Promise<void>
  /** Put a mate the server just returned (create / update / say) into the list without waiting for the poll. */
  putMate: (m: Mate) => void
  dropMate: (id: string) => void
}

const NavCtx = createContext<Nav | null>(null)
const ConnCtx = createContext<Conn | null>(null)
const StoreCtx = createContext<Store | null>(null)

export const useNav = () => { const v = useContext(NavCtx); if (!v) throw new Error('nav outside provider'); return v }
export const useConn = () => { const v = useContext(ConnCtx); if (!v) throw new Error('conn outside provider'); return v }
export const useStore = () => { const v = useContext(StoreCtx); if (!v) throw new Error('store outside provider'); return v }

const FAST = 5000
const SLOW = 30000

export function Providers({ children }: { children: React.ReactNode }) {
  // ---- navigation ----
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }])
  const nav = useMemo<Nav>(() => ({
    route: stack[stack.length - 1],
    stack,
    push: (r) => setStack((s) => [...s, r]),
    pop: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    replace: (r) => setStack((s) => [...s.slice(0, -1), r]),
    reset: (r) => setStack([r]),
    openMate: (id, runId) => setStack((s) => {
      const r: Route = { name: 'mate', id, runId }
      const i = s.findIndex((x) => x.name === 'mate' && x.id === id)
      return i >= 0 ? [...s.slice(0, i), r] : [...s, r]
    }),
  }), [stack])
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { if (stack.length > 1) { setStack((s) => s.slice(0, -1)); return true } return false })
    return () => sub.remove()
  }, [stack.length])

  // ---- connection ----
  const [conn, setConn] = useState<Connection | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  // The open encrypted line when the computer is reached through the relay; null on its Wi-Fi.
  const [line, setLine] = useState<Relay | null>(null)
  const swapLine = useCallback((next: Relay | null) => setLine((old) => { if (old && old !== next) old.close(); return next }), [])
  const api = useMemo(() => (conn ? new Api(conn.base, conn.token, line) : null), [conn, line])
  const tryLogin = useCallback(async (c: Connection | null) => {
    if (!c) { swapLine(null); setConn(null); setFailed(false); setReady(true); return }
    const { ok, relay } = await login(c)
    swapLine(relay); setConn(c); setFailed(!ok); setReady(true)
  }, [swapLine])
  useEffect(() => { loadConnection().then(tryLogin) }, [tryLogin])
  const pair = useCallback(async (text: string) => {
    const p = parsePairText(text)
    if (!p) return '看不出这是一个地址。'
    const c: Connection = { base: p.base, token: p.token, pairedAt: new Date().toISOString(), ...(p.relay ? { relay: p.relay } : {}) }
    const { ok, reason, relay } = await login(c)
    if (!ok) return `连不上这台电脑（${reason}）。` + (c.relay ? '电脑上的 MyWork 要开着，「允许手机连接」和「在外面也能连」要打开。' : '手机和电脑要在同一个 Wi‑Fi，电脑上的「允许手机连接」要打开。')
    await saveConnection(c); swapLine(relay); setConn(c); setFailed(false); setReady(true)
    setStack([{ name: 'home' }])
    return null
  }, [swapLine])
  const forget = useCallback(async () => { await clearConnection(); fetched.current = null; swapLine(null); setConn(null); setFailed(false); setMates(null); setActivity(null); setStack([{ name: 'home' }]) }, [swapLine])
  const retry = useCallback(async () => { await tryLogin(conn) }, [conn, tryLogin])

  // ---- data ----
  const [mates, setMates] = useState<Mate[] | null>(null)
  const [activity, setActivity] = useState<ActivityPayload | null>(null)
  const [tick, setTick] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** The list the latest successful poll fetched, set synchronously (state lands only after React renders). */
  const fetched = useRef<Mate[] | null>(null)
  /** One poll; returns the list it fetched (null on failure), so the loop picks its cadence from this poll, not the last. */
  const fetchNow = useCallback(async (): Promise<Mate[] | null> => {
    if (!api) return null
    setLoading(true)
    try {
      const [m, a] = await Promise.all([api.mates(), api.activity().catch(() => null)])
      const list = m.items || []
      fetched.current = list
      setMates(list); if (a) setActivity(a); setError(''); setTick((n) => n + 1)
      return list
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); return null } finally { setLoading(false) }
  }, [api])
  // One poll loop at a time: every (re)start bumps the generation, and a loop from an older generation stops.
  const gen = useRef(0)
  const live = useRef(false)
  const loop = useCallback(async () => {
    const my = ++gen.current
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    const list = await fetchNow()
    if (!live.current || my !== gen.current) return
    // 5s while any teammate works; one waiting on a question is not working, so it does not keep the fast cadence.
    const seen = list || fetched.current // a failed poll keeps the cadence the last good one set
    const busy = !!(seen && seen.some((m) => m.state === 'working'))
    timer.current = setTimeout(() => { loop().catch(() => {}) }, busy ? FAST : SLOW)
  }, [fetchNow])
  useEffect(() => {
    if (!api || failed) return
    live.current = true
    loop().catch(() => {})
    // Back in the foreground: on the relay, check the Wi-Fi again first (home again → straight to the gateway).
    const sub = AppState.addEventListener('change', (s) => { if (s !== 'active') return; if (api.via === 'relay' && conn) tryLogin(conn).catch(() => {}); else loop().catch(() => {}) })
    return () => { live.current = false; gen.current++; if (timer.current) clearTimeout(timer.current); sub.remove() }
  }, [api, failed, loop, conn, tryLogin])
  /** Poll now and restart the cadence: after a send the mate works, so the next poll comes in 5s, not 30s. */
  const refresh = useCallback(async () => { if (live.current) await loop(); else await fetchNow() }, [loop, fetchNow])
  const putMate = useCallback((m: Mate) => setMates((list) => { const l = list || []; return l.some((x) => x.id === m.id) ? l.map((x) => (x.id === m.id ? { ...x, ...m } : x)) : [...l, m] }), [])
  const dropMate = useCallback((id: string) => setMates((list) => (list ? list.filter((x) => x.id !== id) : list)), [])

  const store = useMemo<Store>(() => ({ mates, activity, tick, loading, error, refresh, putMate, dropMate }), [mates, activity, tick, loading, error, refresh, putMate, dropMate])
  const connValue = useMemo<Conn>(() => ({ conn, api, via: api ? api.via : 'lan', ready, failed, pair, forget, retry }), [conn, api, ready, failed, pair, forget, retry])
  return <NavCtx.Provider value={nav}><ConnCtx.Provider value={connValue}><StoreCtx.Provider value={store}>{children}</StoreCtx.Provider></ConnCtx.Provider></NavCtx.Provider>
}
