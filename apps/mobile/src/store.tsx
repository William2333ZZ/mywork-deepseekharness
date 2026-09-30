/**
 * MyWork mobile — connection, data and navigation for every screen.
 *
 *   useConn()  → { conn, api, pair(text), forget() }          the paired computer
 *   useStore() → { data, thread, loading, error, refresh() }  what the computer says, polled 5s while
 *                                                              something runs, 30s otherwise
 *   useNav()   → { route, stack, push(r), pop(), replace(r), reset(r) }
 *
 * Navigation is a plain stack in state (no router dependency): Android back pops it.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AppState, BackHandler } from 'react-native'
import { Api, clearConnection, loadConnection, login, parsePairText, saveConnection, type Connection, type Task, type TasksPayload } from './api'

export type Route =
  | { name: 'home' }
  | { name: 'new'; prefill?: string }
  | { name: 'task'; id: string }
  | { name: 'mywork' }
  | { name: 'tasks'; filter?: 'all' | 'active' | 'delivered' }
  | { name: 'routine'; id: string }
  | { name: 'settings' }

type Nav = { route: Route; stack: Route[]; push: (r: Route) => void; pop: () => void; replace: (r: Route) => void; reset: (r: Route) => void }
type Conn = { conn: Connection | null; api: Api | null; ready: boolean; failed: boolean; pair: (text: string) => Promise<string | null>; forget: () => Promise<void>; retry: () => Promise<void> }
type Store = { data: TasksPayload | null; thread: Task | null; loading: boolean; error: string; refresh: () => Promise<void>; setThread: (t: Task | null) => void }

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
  }), [stack])
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { if (stack.length > 1) { setStack((s) => s.slice(0, -1)); return true } return false })
    return () => sub.remove()
  }, [stack.length])

  // ---- connection ----
  const [conn, setConn] = useState<Connection | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const api = useMemo(() => (conn ? new Api(conn.base, conn.token) : null), [conn])
  const tryLogin = useCallback(async (c: Connection | null) => {
    if (!c) { setConn(null); setFailed(false); setReady(true); return }
    const { ok } = await login(c)
    setConn(c); setFailed(!ok); setReady(true)
  }, [])
  useEffect(() => { loadConnection().then(tryLogin) }, [tryLogin])
  const pair = useCallback(async (text: string) => {
    const p = parsePairText(text)
    if (!p) return '看不出这是一个地址。'
    const c: Connection = { base: p.base, token: p.token, pairedAt: new Date().toISOString() }
    const { ok, reason } = await login(c)
    if (!ok) return `连不上这台电脑（${reason}）。手机和电脑要在同一个 Wi‑Fi，电脑上的「允许手机连接」要打开。`
    await saveConnection(c); setConn(c); setFailed(false); setReady(true)
    setStack([{ name: 'home' }])
    return null
  }, [])
  const forget = useCallback(async () => { await clearConnection(); setConn(null); setFailed(false); setData(null); setThread(null); setStack([{ name: 'home' }]) }, [])
  const retry = useCallback(async () => { await tryLogin(conn) }, [conn, tryLogin])

  // ---- data ----
  const [data, setData] = useState<TasksPayload | null>(null)
  const [thread, setThread] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const refresh = useCallback(async () => {
    if (!api) return
    setLoading(true)
    try {
      const [t, d] = await Promise.all([api.tasks(), api.today()])
      setData(t); setThread(d.thread); setError('')
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) } finally { setLoading(false) }
  }, [api])
  useEffect(() => {
    if (!api || failed) return
    let alive = true
    const tick = async () => {
      if (!alive) return
      await refresh()
      const active = !!(data && data.items.some((x) => x.status !== 'done')) || !!(thread && thread.status !== 'done')
      timer.current = setTimeout(tick, active ? FAST : SLOW)
    }
    tick()
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') { if (timer.current) clearTimeout(timer.current); tick() } })
    return () => { alive = false; if (timer.current) clearTimeout(timer.current); sub.remove() }
    // data/thread are read inside tick on purpose: the cadence follows the latest snapshot without restarting the loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, failed, refresh])

  const store = useMemo<Store>(() => ({ data, thread, loading, error, refresh, setThread }), [data, thread, loading, error, refresh])
  const connValue = useMemo<Conn>(() => ({ conn, api, ready, failed, pair, forget, retry }), [conn, api, ready, failed, pair, forget, retry])
  return <NavCtx.Provider value={nav}><ConnCtx.Provider value={connValue}><StoreCtx.Provider value={store}>{children}</StoreCtx.Provider></ConnCtx.Provider></NavCtx.Provider>
}
