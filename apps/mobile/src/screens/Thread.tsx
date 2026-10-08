/**
 * A teammate's conversation (TEAMMATES.md §9.2 / §9.5 / §9.6), as IM — the web's thread. Header: back · avatar + name,
 * its title on a 12px line under it — tapping it opens the teammate's page · ··· (停止). The line is the runs from
 * GET /mates/thread, oldest first, 「加载更早」 on top; each run's entries (runEntries) become messages: yours on the right
 * in your bubble colour, the teammate's on the left under its avatar (one avatar per group: one side's messages within
 * five minutes), its deliveries as message cards (title, the key figures in two columns, time · 打开), questions and
 * reminders as cards; routine markers, 「已安排」 and 已停止 centred; a centred time before anything that comes more than
 * five minutes after the last message; 「以下是新的」 before the first new run; 在干活 as the avatar breathing beside a
 * line; 过程 folded under the run's last teammate group. A reply that arrives while you watch enters over 200ms. Dock 「给 <name> 发消息」 (「回答」 while it waits) → POST /mates/say: idle
 * starts a run, working steers it, waiting answers the question. Opening it posts /seen. With `runId` the screen pages
 * back until that run is loaded, scrolls to it and lights it up briefly.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, type LayoutChangeEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { fmtDuration, fmtTime, type Deliverable, type Mate, type Run } from '../api'
import { useConn, useNav, useStore } from '../store'
import { Arrive, Avatar, CenterLine, Composer, Empty, Folded, Ghost, IconBtn, Prose, Screen, Sheet, SheetItem, Thinking } from '../components'
import { color, font, radius, size, space, themed } from '../theme'
import { describe, elapsedOf, fieldsOf, firstNewRun, firstSentence, glyphOf, imTime, mergeRuns, pendingAsk, phasesOf, plainOf, runEntries, time, type ThreadEntry } from '../thread'

const PAGE = 20
const SEEK_PAGES = 10
const LIGHT_MS = 1600

type Page = { runs: Run[]; nextBefore: string | null; loaded: boolean; busy: boolean; missing: boolean }
/** Each teammate's loaded runs, kept for the app's life so reopening a conversation draws at once. */
const cache = new Map<string, { runs: Run[]; nextBefore: string | null }>()

const errText = (e: unknown) => (e instanceof Error ? e.message : String(e))
/** Working: not done and not stopped on a question (a queued run counts, it is about to work). */
const isLive = (r: Run) => !!r.status && r.status !== 'done' && r.status !== 'waiting'

/** Re-render once a second while a run works, so 耗时 moves. */
function useTick(on: boolean) { const [, set] = useState(0); useEffect(() => { if (!on) return; const t = setInterval(() => set((n) => n + 1), 1000); return () => clearInterval(t) }, [on]) }

/** When this phone last had each teammate's conversation open (for 「以下是新的」), kept for the app's life. */
const lastOpened = new Map<string, number>()
/** One side's messages within this long make a group (one avatar); a longer pause gets a centred time. */
const GAP = 5 * 60000

/** What stays of the loaded runs when the newest page arrives: only those older than the page's window, or in it. */
function newestWindow(loaded: Run[], d: { runs?: Run[]; nextBefore: string | null }): Run[] {
  const incoming = d.runs || []
  if (!incoming.length && !d.nextBefore) return []
  const ids = new Set(incoming.map((r) => r.id))
  const cutoff = d.nextBefore && incoming.length ? Math.min(...incoming.map((r) => time(r.createdAt))) : -Infinity
  return loaded.filter((r) => ids.has(r.id) || time(r.createdAt) < cutoff)
}

export default function Thread({ id, runId }: { id: string; runId?: string }) {
  return <MateThread key={id + ':' + (runId || '')} id={id} runId={runId} />
}

function MateThread({ id, runId }: { id: string; runId?: string }) {
  const nav = useNav()
  const { api } = useConn()
  const store = useStore()
  const insets = useSafeAreaInsets()
  const mate = store.mates ? store.mates.find((m) => m.id === id) || null : null
  const name = mate ? mate.name : ''

  // ---- the runs: the newest page on open and on every poll; older pages on request ----
  // The newest page replaces its own window (a routine run that ended quiet, or an empty intro, drops out of the
  // server's answer and must leave the screen too); pages loaded from before that window stay as they are.
  const [page, setPage] = useState<Page>(() => { const c = cache.get(id); return c ? { runs: c.runs, nextBefore: c.nextBefore, loaded: true, busy: false, missing: false } : { runs: [], nextBefore: null, loaded: false, busy: false, missing: false } })
  const pageRef = useRef(page); pageRef.current = page
  useEffect(() => { if (page.loaded && !page.missing) cache.set(id, { runs: page.runs, nextBefore: page.nextBefore }) }, [id, page.runs, page.nextBefore, page.loaded, page.missing])
  const loadNewest = useCallback(async () => {
    if (!api) return
    try {
      const d = await api.thread(id, null, PAGE)
      setPage((p) => ({ ...p, runs: mergeRuns(newestWindow(p.runs, d), d.runs || []), nextBefore: p.loaded ? p.nextBefore : d.nextBefore, loaded: true, missing: false }))
    } catch (e) { setPage((p) => ({ ...p, loaded: true, missing: !p.runs.length })) }
  }, [api, id])
  useEffect(() => { loadNewest() }, [loadNewest, store.tick])
  const loadOlder = useCallback(async () => {
    const cur = pageRef.current
    if (!api || cur.busy || !cur.nextBefore) return false
    setPage((p) => ({ ...p, busy: true }))
    try {
      const d = await api.thread(id, cur.nextBefore, PAGE)
      setPage((p) => ({ ...p, busy: false, runs: mergeRuns(p.runs, d.runs || []), nextBefore: d.nextBefore }))
      return true
    } catch { setPage((p) => ({ ...p, busy: false })); return false }
  }, [api, id])

  // ---- 已读: on open, and again when something new lands while it stays open ----
  const stamp = mate ? mate.lastAt + ':' + mate.state : ''
  useEffect(() => { if (api && id) api.seen(id).catch(() => { /* nothing to mark */ }) }, [api, id, stamp])

  const runs = useMemo(() => page.runs.filter((r) => !(r.quiet && r.trigger === 'routine')), [page.runs])
  const fresh = useArrivals(runs, page.loaded)
  // 「以下是新的」: captured on opening, before this visit marks the teammate seen; the time is kept for the next visit.
  const [visit] = useState(() => ({ unread: !!mate && (mate.unread || (mate.unreadCount || 0) > 0), seenAt: lastOpened.get(id) || 0, attentionAt: (mate && mate.attentionAt) || '' }))
  useEffect(() => { lastOpened.set(id, Date.now()); return () => { lastOpened.set(id, Date.now()) } }, [id])
  const firstNew = useMemo(() => firstNewRun(runs, visit), [runs, visit])
  const newestId = runs.length ? runs[runs.length - 1].id : ''
  const active = runs.some((r) => r.status === 'running') || (!!mate && mate.state === 'working')
  useTick(active)
  const waitingOn = useMemo(() => pendingAsk(runs), [runs])
  const answering = (!!mate && mate.state === 'waiting') || !!waitingOn

  // ---- scrolling: to the end when the line grows, or to the run a link points at ----
  const scroller = useRef<ScrollView>(null)
  const ys = useRef<Record<string, number>>({})
  const [lit, setLit] = useState('')
  const [target, setTarget] = useState(runId || '')
  const seeking = useRef(0)
  useEffect(() => {
    if (!target || !page.loaded || page.busy) return
    if (runs.some((r) => r.id === target)) return
    if (page.nextBefore && seeking.current < SEEK_PAGES) { seeking.current++; loadOlder() } else { setTarget(''); following.current = true; setTimeout(() => scroller.current?.scrollToEnd({ animated: false }), 60) } // not there: the end
  }, [target, page.loaded, page.busy, page.nextBefore, runs, loadOlder])
  // Opening with something new: the divider in view instead of the end.
  const toNew = useRef('')
  useEffect(() => {
    if (!firstNew || runId || toNew.current === 'done') return
    following.current = false
    const y = ys.current[firstNew]
    if (y !== undefined) { toNew.current = 'done'; setTimeout(() => scroller.current?.scrollTo({ y: Math.max(0, y - 48), animated: false }), 30) } else toNew.current = firstNew
  }, [firstNew, runId])
  const onRunLayout = (rid: string) => (e: LayoutChangeEvent) => {
    ys.current[rid] = e.nativeEvent.layout.y
    if (rid === toNew.current) { toNew.current = 'done'; const y = Math.max(0, e.nativeEvent.layout.y - 48); setTimeout(() => scroller.current?.scrollTo({ y, animated: false }), 30) }
    if (rid === target) {
      const y = Math.max(0, e.nativeEvent.layout.y - 12)
      setTimeout(() => scroller.current?.scrollTo({ y, animated: false }), 30)
      setTarget(''); setLit(rid)
      setTimeout(() => setLit(''), LIGHT_MS)
    }
  }
  const lastKey = useMemo(() => { const r = runs[runs.length - 1]; return r ? r.id + ':' + r.status + ':' + (r.activity || []).length + ':' + (r.deliverables || []).length : '' }, [runs])
  const following = useRef(!runId)
  useEffect(() => {
    if (!following.current || !lastKey) return
    const t = setTimeout(() => scroller.current?.scrollToEnd({ animated: false }), 60)
    return () => clearTimeout(t)
  }, [lastKey])
  /** Open at the newest message: while following, every growth of the line keeps its end in view. */
  const onContentSize = () => { if (following.current && !target) scroller.current?.scrollToEnd({ animated: false }) }
  const inputRef = useRef<TextInput>(null)
  const fill = (v: string) => { setText(v); setTimeout(() => inputRef.current?.focus(), 30) }

  // ---- the dock ----
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [pending, setPending] = useState('')
  const [err, setErr] = useState('')
  const [busyAnswer, setBusyAnswer] = useState(false)
  const [acking, setAcking] = useState('')
  const [sheet, setSheet] = useState(false)
  const send = async () => {
    const body = text.trim()
    if (!body || sending || !api) return
    setSending(true); setPending(body); setText(''); setErr(''); following.current = true
    try {
      const d = await api.say(id, body)
      if (d.mate) store.putMate(d.mate)
      await loadNewest()
      store.refresh().catch(() => {})
    } catch (e) { setText(body); setErr(errText(e)) } finally { setPending(''); setSending(false) }
  }
  const answer = async (run: Run, askId: string, value: string) => {
    if (!api || busyAnswer) return
    setBusyAnswer(true); setErr('')
    try { const d = await api.answer(run.id, askId, value); if (d.run) setPage((p) => ({ ...p, runs: mergeRuns(p.runs, [d.run]) })); store.refresh().catch(() => {}) } catch (e) { setErr(errText(e)) } finally { setBusyAnswer(false) }
  }
  const ack = async (routineId: string, at: string) => {
    if (!api) return
    setAcking(routineId + at)
    try { await api.routineAck(routineId, at); await loadNewest() } catch (e) { setErr(errText(e)) } finally { setAcking('') }
  }
  const stop = async () => {
    setSheet(false)
    if (!api) return
    try { const d = await api.stop(id); if (d.mate) store.putMate(d.mate); await loadNewest(); store.refresh().catch(() => {}) } catch (e) { setErr(errText(e)) }
  }
  const openRoutine = (routineId?: string) => nav.push({ name: 'mateInfo', id, routineId })

  if (!mate && (store.mates || page.missing)) {
    return (
      <Screen>
        <View style={styles.head}><IconBtn name="chevron-back-outline" label="返回" onPress={nav.pop} /></View>
        <View style={styles.center}><Empty text="没有这位同事。" /></View>
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={styles.head}>
        <IconBtn name="chevron-back-outline" label="返回" onPress={nav.pop} />
        <Pressable onPress={() => nav.push({ name: 'mateInfo', id })} accessibilityRole="button" style={({ pressed }) => [styles.who, pressed && { opacity: 0.7 }]}>
          {mate ? <Avatar id={mate.id || mate.name} look={mate.avatar} char={glyphOf(mate)} isDefault={mate.isDefault} working={mate.state === 'working'} dim={32} /> : null}
          <View style={styles.whoText}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            {mate && mate.title ? <Text style={styles.ttl} numberOfLines={1}>{mate.title}</Text> : null}
          </View>
        </Pressable>
        <IconBtn name="ellipsis-horizontal-outline" label="更多" onPress={() => setSheet(true)} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scroller}
          style={{ flex: 1 }}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
          onScrollBeginDrag={() => { following.current = false }}
          onMomentumScrollEnd={(e) => { const n = e.nativeEvent; following.current = n.contentOffset.y + n.layoutMeasurement.height >= n.contentSize.height - 48 }}
          onScrollEndDrag={(e) => { const n = e.nativeEvent; following.current = n.contentOffset.y + n.layoutMeasurement.height >= n.contentSize.height - 48 }}
          onContentSizeChange={onContentSize}
        >
          {page.loaded && !runs.length && !pending && mate ? <Hello mate={mate} onPick={fill} /> : null}
          <View style={styles.older}>{page.nextBefore ? <Ghost icon="chevron-up-outline" label="加载更早" onPress={() => { loadOlder() }} disabled={page.busy} /> : null}</View>
          <Line
            runs={runs}
            mate={mate}
            firstNew={firstNew}
            lit={lit}
            fresh={fresh}
            pending={pending}
            onRunLayout={onRunLayout}
            ctx={{ busyAnswer, acking, mates: store.mates || [], onAnswer: answer, onAck: ack, onOpenFile: (d) => nav.push({ name: 'file', id: d.id }), onRoutine: openRoutine, onMate: (mid) => nav.push({ name: 'mate', id: mid }) }}
          />
          {!page.loaded ? <Text style={styles.loading}>…</Text> : null}
        </ScrollView>
        <View style={[styles.dock, { paddingBottom: insets.bottom + space.sm }]}>
          {err ? <Text style={styles.err}>{err}</Text> : null}
          <Composer inputRef={inputRef} value={text} onChange={setText} onSend={send} onStop={mate && mate.state === 'working' ? () => { stop() } : undefined} placeholder={answering ? '回答' : name ? `给 ${name} 发消息` : '发消息'} busy={sending} disabled={!api || !mate} />
        </View>
      </KeyboardAvoidingView>

      <Sheet open={sheet} onClose={() => setSheet(false)}>
        {mate && mate.state !== 'idle' ? <SheetItem label="停止" onPress={() => { stop() }} /> : null}
        <SheetItem label="同事资料" onPress={() => { setSheet(false); nav.push({ name: 'mateInfo', id }) }} />
      </Sheet>
    </Screen>
  )
}

/**
 * Reply entries that first show up while the thread is open, in a run it watched working (or one started meanwhile):
 * they enter over 200ms. The first pass only takes note of what is there; a mark lapses after a second.
 */
function useArrivals(runs: Run[], ready: boolean): (key: string) => boolean {
  const ref = useRef<{ since: number; live: Set<string>; shown: Set<string>; until: Map<string, number>; runs: Run[] | null; primed: boolean } | null>(null)
  if (!ref.current) ref.current = { since: Date.now(), live: new Set(), shown: new Set(), until: new Map(), runs: null, primed: false }
  const w = ref.current
  if (ready && w.runs !== runs) {
    w.runs = runs
    const now = Date.now()
    for (const run of runs) {
      const watched = w.live.has(run.id) || (w.primed && time(run.createdAt) >= w.since - 2000)
      for (const e of runEntries(run)) {
        if (e.kind !== 'deliver' && e.kind !== 'text') continue
        if (w.shown.has(e.key)) continue
        w.shown.add(e.key)
        if (w.primed && watched) w.until.set(e.key, now + 1000)
      }
      if (isLive(run)) w.live.add(run.id)
    }
    w.primed = true
  }
  return (key: string) => (w.until.get(key) || 0) > Date.now()
}

/** What the messages call back into the screen. */
type LineCtx = {
  busyAnswer: boolean; acking: string; mates: Mate[]
  onAnswer: (run: Run, askId: string, value: string) => void; onAck: (routineId: string, at: string) => void
  onOpenFile: (d: Deliverable) => void; onRoutine: (routineId?: string) => void; onMate: (mateId: string) => void
}
/** One message as IM: its side (yours, the teammate's, a centred note, the working line), its time, how it draws. */
type Item = { key: string; side: 'me' | 'mate' | 'note' | 'status'; at: string; card?: boolean; arrive?: boolean; make: (first: boolean) => React.ReactNode }

/**
 * One run's entries as messages, in time order: yours and the teammate's text as bubbles, its files, questions and
 * reminders as cards, routine markers / 已安排 / 已停止 / the 24 h resume as centred notes, 在干活 as the status line.
 */
function itemsOf(run: Run, mate: Mate | null, ctx: LineCtx, fresh: (key: string) => boolean): Item[] {
  const out: Item[] = []
  for (const e of runEntries(run)) {
    const arrive = (e.kind === 'text' || e.kind === 'deliver') && fresh(e.key)
    switch (e.kind) {
      case 'marker': out.push({ key: e.key, side: 'note', at: e.at, make: () => <CenterLine text={e.text} onPress={e.routineId ? () => ctx.onRoutine(e.routineId) : undefined} /> }); break
      case 'scheduled': out.push({ key: e.key, side: 'note', at: e.at, make: () => <CenterLine text={e.text} onPress={() => ctx.onRoutine(e.routineId)} /> }); break
      case 'auto': out.push({ key: e.key, side: 'note', at: e.at, make: () => <CenterLine text="24 小时没有回答，按合理假设继续" /> }); break
      case 'user': out.push({ key: e.key, side: 'me', at: e.at, make: (first) => (e.via === 'mywork' ? <><Text style={styles.via}>MyWork 转交</Text><MeBubble text={e.text} first={first} /></> : <MeBubble text={e.text} first={first} />) }); break
      case 'newMate': {
        const m = ctx.mates.find((x) => x.id === e.mateId)
        out.push(m
          ? { key: e.key, side: 'mate', at: e.at, card: true, make: () => <MateCard m={m} onOpen={() => ctx.onMate(m.id)} /> }
          : { key: e.key, side: 'note', at: e.at, make: () => <CenterLine text={['新同事', e.name, '已删除'].filter(Boolean).join(' · ')} /> })
        break
      }
      case 'text': out.push({ key: e.key, side: 'mate', at: e.at, arrive, make: (first) => <MateBubble first={first}><Prose markdown={e.text} tight /></MateBubble> }); break
      case 'deliver':
        if (plainOf(e.text)) out.push({ key: e.key + ':t', side: 'mate', at: e.at, arrive, make: (first) => <MateBubble first={first}><Prose markdown={e.text} tight /></MateBubble> })
        for (const d of e.ds) out.push({ key: e.key + ':' + d.id, side: 'mate', at: e.at, card: true, arrive, make: () => <DocCard d={d} onOpen={ctx.onOpenFile} /> })
        break
      case 'ask': out.push({ key: e.key, side: 'mate', at: e.at, card: true, make: () => <AskCard ask={e} busy={ctx.busyAnswer} onAnswer={(v) => ctx.onAnswer(run, e.id, v)} /> }); break
      case 'remind': out.push({ key: e.key, side: 'mate', at: e.at, card: true, make: () => <RemindCard title={e.title} text={e.text} at={e.at} acked={e.acked} busy={ctx.acking === e.routineId + e.at} onAck={() => ctx.onAck(e.routineId, e.at)} onOpen={() => ctx.onRoutine(e.routineId)} /> }); break
      case 'working': out.push({ key: e.key, side: 'status', at: '', make: () => <Working mate={mate} text={['在干活', e.step, elapsedOf(run)].filter(Boolean).join(' · ')} /> }); break
      case 'failed': out.push(e.cancelled
        ? { key: e.key, side: 'note', at: e.at, make: () => <CenterLine text="已停止" /> }
        : { key: e.key, side: 'mate', at: e.at, make: (first) => <MateBubble first={first}><Text style={styles.failed}>失败 · {e.reason}</Text></MateBubble> })
        break
    }
  }
  return out
}

/** The whole line: runs in order, each run's messages in groups, centred times, 「以下是新的」, then what you just sent. */
function Line({ runs, mate, firstNew, lit, fresh, pending, onRunLayout, ctx }: {
  runs: Run[]; mate: Mate | null; firstNew: string; lit: string; fresh: (key: string) => boolean; pending: string
  onRunLayout: (rid: string) => (e: LayoutChangeEvent) => void; ctx: LineCtx
}) {
  let lastAt = 0
  type Grp = { side: 'me' | 'mate'; key: string; items: Item[]; last: number; proc?: boolean }
  const runNode = (run: Run | null, items: Item[], key: string) => {
    const blocks: ({ node: React.ReactNode } | { grp: Grp })[] = []
    let grp: Grp | null = null
    for (const it of items) {
      const at = time(it.at)
      if (at && (!lastAt || at - lastAt > GAP)) { blocks.push({ node: <TimeNote key={'t:' + it.key} text={imTime(it.at)} /> }); grp = null }
      if (at) lastAt = Math.max(lastAt, at)
      if (it.side === 'note' || it.side === 'status') { blocks.push({ node: <View key={it.key}>{it.make(false)}</View> }); grp = null; continue }
      if (!grp || grp.side !== it.side || (at && grp.last && at - grp.last > GAP)) { grp = { side: it.side, key: it.key, items: [], last: at }; blocks.push({ grp }) }
      grp.items.push(it)
      if (at) grp.last = at
    }
    // 过程 sits under the run's last teammate group.
    if (run) { const g = blocks.filter((b): b is { grp: Grp } => 'grp' in b && b.grp.side === 'mate').pop(); if (g) g.grp.proc = true }
    return (
      <View key={key} onLayout={run ? onRunLayout(run.id) : undefined} style={[styles.run, run && lit === run.id && styles.lit]}>
        {blocks.map((b) => ('grp' in b
          ? <Group key={'g:' + b.grp.key} side={b.grp.side} mate={mate} items={b.grp.items} run={b.grp.proc ? run : null} />
          : b.node))}
      </View>
    )
  }
  const out: React.ReactNode[] = []
  for (const run of runs) {
    if (run.id === firstNew) out.push(<NewLine key={'new:' + run.id} />)
    out.push(runNode(run, itemsOf(run, mate, ctx, fresh), run.id))
  }
  if (pending) out.push(runNode(null, [{ key: 'pending', side: 'me', at: new Date().toISOString(), make: (first) => <MeBubble text={pending} first={first} /> }], 'pending'))
  return <>{out}</>
}

/** One side's messages: the teammate's under its avatar (on the group's first message only), yours on the right. */
function Group({ side, mate, items, run }: { side: 'me' | 'mate'; mate: Mate | null; items: Item[]; run: Run | null }) {
  return (
    <View style={[styles.grp, side === 'me' && styles.grpMe]}>
      {side === 'mate' ? <View style={styles.grpAv}>{mate ? <Avatar id={mate.id || mate.name} look={mate.avatar} isDefault={mate.isDefault} dim={32} /> : null}</View> : null}
      <View style={[styles.grpCol, side === 'me' && styles.grpColMe]}>
        {items.map((it, i) => <Arrive key={it.key} on={!!it.arrive}>{it.make(i === 0 && !it.card)}</Arrive>)}
        {run ? <Process run={run} /> : null}
      </View>
    </View>
  )
}

/** Your message: your bubble colour, the corner by the edge squared on a group's first. */
function MeBubble({ text, first }: { text: string; first: boolean }) {
  return <View style={[styles.bub, styles.bubMe, first && styles.bubMeFirst]}><Text style={styles.bubMeText} selectable>{text}</Text></View>
}
/** The teammate's message: the bubble ground, the corner by its avatar squared on a group's first. */
function MateBubble({ first, children }: { first: boolean; children: React.ReactNode }) {
  return <View style={[styles.bub, styles.bubMate, first && styles.bubMateFirst]}>{children}</View>
}
/** A centred time between messages more than five minutes apart. */
function TimeNote({ text }: { text: string }) { return <Text style={styles.time}>{text}</Text> }
/** 「以下是新的」 in the accent between two hairlines. */
function NewLine() {
  return <View style={styles.newLine} accessibilityRole="text"><View style={styles.newRule} /><Text style={styles.newText}>以下是新的</Text><View style={styles.newRule} /></View>
}
/** 在干活: the teammate's avatar breathing beside one line (the step and how long). */
function Working({ mate, text }: { mate: Mate | null; text: string }) {
  return (
    <View style={styles.working} accessibilityRole="text" accessibilityLabel={`${mate ? mate.name : ''} 在干活`}>
      <View style={styles.grpAv}>{mate ? <Avatar id={mate.id || mate.name} look={mate.avatar} isDefault={mate.isDefault} working dim={32} /> : null}</View>
      <Thinking text={text} tail="" small />
    </View>
  )
}

/**
 * A delivery as an IM message card (the web's DocCard): the file's title (two lines), its key figures in two columns
 * (or, without any, its first sentence), and a footer with the time and 打开. The whole card opens the file.
 */
function DocCard({ d, onOpen }: { d: Deliverable; onOpen: (d: Deliverable) => void }) {
  const fields = fieldsOf(d)
  const deck = fields.length ? '' : firstSentence(d.excerpt || '')
  return (
    <Pressable onPress={() => onOpen(d)} accessibilityRole="button" accessibilityLabel={'打开 ' + (d.title || '')} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <Text style={styles.cardH} numberOfLines={2}>{d.title || d.id}</Text>
      {fields.length ? (
        <View style={styles.cardB}>
          {fields.map((f, i) => (
            <View key={i} style={styles.cardF}>
              <Text style={styles.cardK} numberOfLines={1}>{f.label}</Text>
              <Text style={styles.cardV} numberOfLines={1}>{f.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {deck ? <Text style={styles.cardD} numberOfLines={3}>{deck}</Text> : null}
      <View style={styles.cardFoot}>
        <Text style={styles.cardTime}>{imTime(d.createdAt)}</Text>
        <Text style={styles.cardGo}>打开</Text>
      </View>
    </Pressable>
  )
}

/** A teammate MyWork just created, as a message card in MyWork's thread: its look, name, title or type, its job; opens it. */
function MateCard({ m, onOpen }: { m: Mate; onOpen: () => void }) {
  return (
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={'打开 ' + m.name} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <View style={styles.cardWho}>
        <Avatar id={m.id || m.name} look={m.avatar} isDefault={m.isDefault} dim={36} />
        <View style={styles.cardWhoText}>
          <Text style={styles.cardH} numberOfLines={1}>{m.name}</Text>
          <Text style={styles.cardTime} numberOfLines={1}>{m.title || m.group || '新同事'}</Text>
        </View>
      </View>
      {m.description ? <Text style={styles.cardD} numberOfLines={3}>{m.description}</Text> : null}
      <View style={styles.cardFoot}>
        <Text style={styles.cardTime}>新同事</Text>
        <Text style={styles.cardGo}>打开</Text>
      </View>
    </Pressable>
  )
}

/** Example prompts from a teammate's job (web examplesOf): its first clauses as asks, else three general ones. */
function examplesOf(mate: Mate): string[] {
  const parts = String(mate.description || '').split(/[，,。；;、\n]+/).map((x) => x.replace(/^(每天|负责|帮我|请)/, '').trim()).filter((x) => x.length >= 2 && x.length <= 30)
  const topic = parts[0] || ''
  if (!topic) return ['你能帮我做什么？', '先了解一下我的工作', '给我一个今天的建议']
  return [topic, '关于「' + topic.slice(0, 14) + '」，先给我一份简报', parts[1] ? parts[1] : '你打算怎么做「' + topic.slice(0, 14) + '」？'].slice(0, 3)
}

/** An empty thread: the avatar, the name, the job muted, three pills that fill the composer. */
function Hello({ mate, onPick }: { mate: Mate; onPick: (text: string) => void }) {
  return (
    <View style={styles.hello}>
      <Avatar id={mate.id || mate.name} look={mate.avatar} isDefault={mate.isDefault} dim={64} />
      <Text style={styles.helloName}>{mate.name}</Text>
      {mate.description || mate.title ? <Text style={styles.helloDuty}>{mate.description || mate.title}</Text> : null}
      <View style={styles.pills}>
        {examplesOf(mate).map((x) => (
          <Pressable key={x} onPress={() => onPick(x)} accessibilityRole="button" style={({ pressed }) => [styles.pill, pressed && { backgroundColor: color.bubble }]}>
            <Text style={styles.pillText} numberOfLines={2}>{x}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

/** 提醒卡: a reminder firing, as a message card: its title · time and sentence (tap: the routine), a footer with 知道了 → 「已知道」. */
function RemindCard({ title, text, at, acked, busy, onAck, onOpen }: { title: string; text: string; at: string; acked: boolean; busy: boolean; onAck: () => void; onOpen: () => void }) {
  return (
    <View style={styles.card}>
      <Pressable onPress={onOpen} accessibilityRole="button">
        <Text style={styles.cardH} numberOfLines={2}>{[title || '提醒', fmtTime(at)].filter(Boolean).join(' · ')}</Text>
        {text && text !== title ? <Text style={styles.cardD} numberOfLines={3}>{text}</Text> : null}
      </Pressable>
      <View style={styles.cardFoot}>
        <Text style={styles.cardTime}>{acked ? '已知道' : '提醒'}</Text>
        {acked ? null : <Pressable onPress={onAck} disabled={busy} accessibilityRole="button" hitSlop={8}><Text style={[styles.cardGo, busy && { opacity: 0.5 }]}>知道了</Text></Pressable>}
      </View>
    </View>
  )
}

/**
 * 找你卡 (§9.2): the question a run stopped on, as a message card with a 2px rule in the needs-you colour on top: the
 * question, the detail in a monospace block, then the controls — choice → the options as full-width outline buttons,
 * approval → 允许一次 / 拒绝, takeover → 「需要你在电脑上操作」 + 我做完了, text → a footer pointing at the composer. Settled,
 * the card loses the rule and its footer reads 「已回答：X」 (or 不再等待).
 */
function AskCard({ ask, busy, onAnswer }: { ask: Extract<ThreadEntry, { kind: 'ask' }>; busy: boolean; onAnswer: (answer: string) => void }) {
  if (ask.status !== 'pending') {
    return (
      <View style={styles.card}>
        <Text style={styles.cardH}>{ask.question}</Text>
        <View style={styles.cardFoot}><Text style={styles.cardTime} numberOfLines={2}>{ask.status === 'answered' ? '已回答：' + ask.answer : '不再等待'}</Text></View>
      </View>
    )
  }
  const off = !ask.answerable || busy
  return (
    <View style={[styles.card, styles.ask]}>
      <Text style={styles.cardH}>{ask.question}</Text>
      {ask.detail ? <ScrollView style={styles.askDetail} nestedScrollEnabled><Text style={styles.askDetailText} selectable>{ask.detail}</Text></ScrollView> : null}
      {ask.askKind === 'choice' ? ask.options.map((o, i) => <Outline key={i} label={o} onPress={() => onAnswer(o)} disabled={off} />)
        : ask.askKind === 'approval' ? <><Outline label="允许一次" filled onPress={() => onAnswer('允许一次')} disabled={off} /><Outline label="拒绝" onPress={() => onAnswer('拒绝')} disabled={off} /></>
        : ask.askKind === 'takeover' ? <><Text style={styles.askNote}>需要你在电脑上操作</Text><Outline label="我做完了" onPress={() => onAnswer('我做完了')} disabled={off} /></>
        : <View style={styles.cardFoot}><Text style={styles.cardTime}>在下面的输入框回答</Text></View>}
    </View>
  )
}

function Outline({ label, onPress, disabled, filled }: { label: string; onPress: () => void; disabled?: boolean; filled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" style={({ pressed }) => [styles.outline, filled && styles.outlineFilled, disabled && { opacity: 0.45 }, pressed && { opacity: 0.7 }]}>
      <Text style={[styles.outlineText, filled && { color: color.onPrimary }]} numberOfLines={2}>{label}</Text>
    </Pressable>
  )
}

/** 「过程 · n 步 · 3m」 folded under the run: the run as phases, opening to their calls. Nothing when the run used no tools. */
function Process({ run }: { run: Run }) {
  const { api } = useConn()
  const [open, setOpen] = useState(false)
  const [openPhase, setOpenPhase] = useState(-1)
  // A finished run comes without its tool calls (run.process.lite): the fold fetches them from GET /run when opened.
  const lite = !!(run.process && run.process.lite)
  const [full, setFull] = useState<Run | null>(null)
  useEffect(() => {
    if (!open || !lite || full || !api) return
    let on = true
    api.run(run.id).then((x) => { if (on && x && x.run) setFull(x.run) }).catch(() => { /* the summary line stays */ })
    return () => { on = false }
  }, [open, lite, full, api, run.id])
  const src = lite ? full : run
  // Verification is off (and not shown): its rows leave the fold too.
  const rows = useMemo(() => (src ? phasesOf(src).filter((r) => r.kind !== 'verify') : []), [src])
  const phaseCount = src ? rows.filter((r) => r.kind === 'phase').length : (run.process && run.process.groups) || 0
  if (!phaseCount) return null
  const live = run.status === 'running'
  const lastIdx = rows.length - 1
  const label = ['过程', `${phaseCount} 步`, elapsedOf(run)].join(' · ')
  return (
    <View>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.procHead}>
        <Text style={styles.procText}>{label}</Text>
        <Ionicons name="chevron-forward-outline" size={12} color={color.meta} style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }} />
      </Pressable>
      {open && !src ? <Text style={[styles.procText, { paddingLeft: 8 }]}>…</Text> : null}
      {open && src ? (
        <View style={styles.phases}>
          {rows.map((r, i) => {
            if (r.kind === 'phase') {
              const running = live && i === lastIdx
              const n = r.items.length
              const pm = [n > 1 ? `${n} 次` : '', r.ms > 1500 ? fmtDuration(r.ms) : ''].filter(Boolean).join(' · ')
              const isOpen = openPhase === i
              return (
                <View key={i}>
                  <Pressable onPress={() => setOpenPhase(isOpen ? -1 : i)} accessibilityRole="button" accessibilityState={{ expanded: isOpen }} style={styles.phase}>
                    <Text style={[styles.verb, running && { color: color.fg }, r.failed > 0 && { color: color.danger }]}>{r.verb}</Text>
                    {pm ? <Text style={styles.phaseMeta}>{pm}</Text> : null}
                    {!isOpen && r.obj ? <Text style={styles.obj} numberOfLines={1}>{r.obj}</Text> : null}
                  </Pressable>
                  {isOpen ? r.items.map((c, j) => {
                    const d = describe(c.name, c.detail)
                    const nextAt = r.items[j + 1] ? r.items[j + 1].at : r.endAt
                    const ms = Math.max(0, time(nextAt) - time(c.at))
                    return (
                      <View key={j} style={styles.call}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.callLine} numberOfLines={2}><Text style={[styles.callVerb, c.ok === false && { color: color.danger }]}>{d.verb}</Text>{d.obj ? '  ' + d.obj : ''}</Text>
                          {c.ok === false && c.result ? <Text style={styles.callFail} numberOfLines={2}>失败 · {c.result}</Text> : null}
                        </View>
                        {ms > 1500 ? <Text style={styles.phaseMeta}>{fmtDuration(ms)}</Text> : null}
                      </View>
                    )
                  }) : null}
                </View>
              )
            }
            return (
              <View key={i} style={styles.note}>
                <View style={{ flex: 1 }}><Folded text={r.text} /></View>
              </View>
            )
          })}
        </View>
      ) : null}
    </View>
  )
}

const styles = themed(() => ({
  head: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 4 },
  who: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 4 },
  whoText: { flexShrink: 1, minWidth: 0 },
  name: { fontSize: 16, lineHeight: 20, fontWeight: '600', color: color.fg },
  ttl: { fontSize: 12, lineHeight: 16, color: color.muted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // runs follow each other at 16; inside a run, 8 between messages
  body: { flexGrow: 1, paddingHorizontal: space.md, paddingBottom: space.lg, gap: space.lg },
  older: { alignItems: 'center', minHeight: 8 },
  run: { gap: space.sm, borderRadius: radius.lg },
  lit: { backgroundColor: color.card, marginHorizontal: -8, paddingHorizontal: 8, paddingVertical: 8 },
  loading: { alignSelf: 'center', marginVertical: space.xl, fontSize: 13, color: color.meta },
  dock: { paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.sm, backgroundColor: color.bg },
  hello: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg, paddingVertical: space.xxl, gap: 8 },
  helloName: { fontSize: 16, lineHeight: 24, fontWeight: '600', color: color.fg, marginTop: 8 },
  helloDuty: { fontSize: 13, lineHeight: 20, color: color.muted, textAlign: 'center', maxWidth: 300 },
  pills: { alignSelf: 'stretch', gap: 8, marginTop: space.lg },
  pill: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, borderWidth: 1, borderColor: color.border, backgroundColor: color.card },
  pillText: { fontSize: 15, lineHeight: 24, color: color.fg2 },
  err: { fontSize: size.meta, lineHeight: 20, color: color.danger, paddingHorizontal: 8 },
  failed: { fontSize: 15, lineHeight: 24, color: color.danger },
  // IM: a group is the avatar (32) and a column of messages; yours sit right, at most 80 % wide
  grp: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  grpMe: { justifyContent: 'flex-end' },
  grpAv: { width: 32, height: 32 },
  grpCol: { flexShrink: 1, minWidth: 0, maxWidth: '86%', alignItems: 'flex-start', gap: 4 },
  grpColMe: { maxWidth: '80%', alignItems: 'flex-end' },
  bub: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, maxWidth: '100%' },
  bubMate: { backgroundColor: color.input },
  bubMateFirst: { borderTopLeftRadius: 4 },
  bubMe: { backgroundColor: color.bubble },
  bubMeFirst: { borderTopRightRadius: 4 },
  bubMeText: { fontSize: 15, lineHeight: 24, color: color.bubbleFg },
  time: { alignSelf: 'center', fontSize: 12, lineHeight: 16, color: color.meta, fontVariant: ['tabular-nums'], paddingVertical: 4 },
  newLine: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  newRule: { flex: 1, height: 1, backgroundColor: color.sel },
  newText: { fontSize: 12, lineHeight: 16, color: color.accentText },
  working: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // message cards (a delivery, a question, a reminder): a ruled card, the title 15 / 600, a footer under a soft line
  card: { width: 300, maxWidth: '100%', borderWidth: 1, borderColor: color.border, borderRadius: 14, backgroundColor: color.card, paddingHorizontal: 14, paddingTop: 12, gap: 8 },
  cardH: { fontSize: 15, lineHeight: 22, fontWeight: '600', color: color.fg },
  cardB: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  cardF: { width: '50%', paddingRight: 8 },
  cardK: { fontSize: 12, lineHeight: 16, color: color.meta },
  cardV: { fontSize: 15, lineHeight: 22, color: color.fg, fontVariant: ['tabular-nums'] },
  cardD: { fontSize: 13, lineHeight: 20, color: color.fg2 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginHorizontal: -14, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: color.borderSoft },
  cardTime: { flexShrink: 1, fontSize: 12, lineHeight: 16, color: color.meta, fontVariant: ['tabular-nums'] },
  cardGo: { fontSize: 13, lineHeight: 18, fontWeight: '500', color: color.accentText },
  cardWho: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardWhoText: { flex: 1, minWidth: 0 },
  via: { fontSize: 12, lineHeight: 16, color: color.meta },
  // 找你卡: the needs-you rule on top
  ask: { borderTopWidth: 2, borderTopColor: color.warn, paddingBottom: 12 },
  askDetail: { maxHeight: 240, borderRadius: radius.md, backgroundColor: color.input },
  askDetailText: { fontFamily: font.mono, fontSize: 12, lineHeight: 20, color: color.fg2, padding: 12 },
  askNote: { fontSize: 14, lineHeight: 22, color: color.muted },
  outline: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: color.border, borderRadius: 22, backgroundColor: color.input },
  outlineFilled: { backgroundColor: color.primary, borderColor: color.primary },
  outlineText: { fontSize: 15, fontWeight: '500', color: color.fg, textAlign: 'center' },
  // 过程: one 12px line at 40 %, then the chevron
  procHead: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 24, alignSelf: 'flex-start', paddingLeft: 8 },
  procText: { fontSize: 12, lineHeight: 16, color: color.meta, fontVariant: ['tabular-nums'] },
  phases: { paddingLeft: 8, paddingBottom: space.xs },
  phase: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 32, paddingVertical: 4 },
  verb: { fontSize: 13, fontWeight: '500', color: color.fg2 },
  phaseMeta: { fontSize: 12, color: color.meta, fontVariant: ['tabular-nums'] },
  obj: { flex: 1, fontSize: 13, color: color.muted },
  call: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingLeft: 16, paddingVertical: 4 },
  callLine: { fontSize: 13, lineHeight: 20, color: color.muted },
  callVerb: { color: color.fg2, fontWeight: '500' },
  callFail: { fontSize: 12, lineHeight: 16, color: color.danger },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 4 },
}))
