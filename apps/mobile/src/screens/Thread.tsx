/**
 * A teammate's conversation (TEAMMATES.md §9.2 / §9.5 / §9.6). Header: back · avatar + name, its title on a 12px line
 * under it — tapping it opens the teammate's page · ··· (停止). 32 between runs, 8 inside one; a reply that arrives while
 * you watch enters over 200ms. The line is the runs from GET /mates/thread, oldest first, 「加载更早」 on top;
 * each run drawn by runEntries(): a routine's centred marker or your bubble, lines said while it worked, 文件 with the
 * live verification line and 有用 / 没用, 找你卡, 「已安排」, 提醒卡 with 知道了, the reply as plain text, 在干活 while it
 * works, a failure line, and its 过程 folded. Dock 「给 <name> 发消息」 (「回答」 while it waits) → POST /mates/say: idle
 * starts a run, working steers it, waiting answers the question. Opening it posts /seen. With `runId` the screen pages
 * back until that run is loaded, scrolls to it and lights it up briefly.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, type LayoutChangeEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { fmtDay, fmtDuration, fmtTime, fmtWhen, isToday, type Deliverable, type Mate, type Run } from '../api'
import { useConn, useNav, useStore } from '../store'
import { Arrive, Avatar, Btn, Bubble, CenterLine, Composer, DateLine, Empty, Folded, Ghost, IconBtn, Prose, Reply, ReplyBubble, ResultRows, Screen, Sheet, SheetItem, Thinking, VerifyLine, type IconName } from '../components'
import { color, font, radius, size, space, themed } from '../theme'
import { describe, elapsedOf, glyphOf, mergeRuns, pendingAsk, phasesOf, runEntries, time, verifyWords, type ThreadEntry, type VerifyState } from '../thread'

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

const dayWord = (iso: string) => { if (isToday(iso)) return '今天'; const y = new Date(); y.setDate(y.getDate() - 1); const d = new Date(iso); return d.toDateString() === y.toDateString() ? '昨天' : fmtDay(iso) }

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
  const onRunLayout = (rid: string) => (e: LayoutChangeEvent) => {
    ys.current[rid] = e.nativeEvent.layout.y
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
  const rate = async (d: Deliverable, r: number) => {
    if (!api) return
    try {
      const x = await api.rate(d.id, d.rating === r ? null : r)
      setPage((p) => ({ ...p, runs: p.runs.map((run) => (run.deliverables || []).some((y) => y.id === d.id) ? { ...run, deliverables: run.deliverables.map((y) => (y.id === d.id ? { ...y, ...x.deliverable } : y)) } : run) }))
    } catch (e) { setErr(errText(e)) }
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

  let prevDay = ''
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
          {runs.map((run) => {
            const day = new Date(run.createdAt).toDateString()
            const sep = day !== prevDay && (prevDay !== '' || !isToday(run.createdAt)) ? <DateLine text={dayWord(run.createdAt)} /> : null
            prevDay = day
            return (
              <View key={run.id} onLayout={onRunLayout(run.id)} style={[styles.run, lit === run.id && styles.lit]}>
                {sep}
                <RunView
                  run={run}
                  mate={mate}
                  newest={run.id === newestId}
                  fresh={fresh}
                  busyAnswer={busyAnswer}
                  acking={acking}
                  onAnswer={(askId, v) => { answer(run, askId, v) }}
                  onAck={(rid, at) => { ack(rid, at) }}
                  onRate={rate}
                  onOpenFile={(d) => nav.push({ name: 'file', id: d.id })}
                  onRoutine={openRoutine}
                />
              </View>
            )
          })}
          {pending ? <View style={styles.run}><Bubble text={pending} /></View> : null}
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

/** One run: its entries, the 过程 fold, then the 在干活 or failure line. */
function RunView({ run, mate, newest, fresh, busyAnswer, acking, onAnswer, onAck, onRate, onOpenFile, onRoutine }: {
  run: Run; mate: Mate | null; newest: boolean; fresh: (key: string) => boolean; busyAnswer: boolean; acking: string
  onAnswer: (askId: string, value: string) => void; onAck: (routineId: string, at: string) => void
  onRate: (d: Deliverable, r: number) => void; onOpenFile: (d: Deliverable) => void; onRoutine: (routineId?: string) => void
}) {
  const entries = useMemo(() => runEntries(run), [run])
  const body = entries.filter((e) => e.kind !== 'working' && e.kind !== 'failed')
  const end = entries.find((e) => e.kind === 'working' || e.kind === 'failed')
  const props = { run, mate, newest, busyAnswer, acking, onAnswer, onAck, onRate, onOpenFile, onRoutine }
  return (
    <View style={styles.line}>
      {body.map((e) => <Arrive key={e.key} on={fresh(e.key)}><Entry e={e} {...props} /></Arrive>)}
      <Process run={run} />
      {end ? <Entry e={end} {...props} /> : null}
    </View>
  )
}

function Entry({ e, run, mate, newest, busyAnswer, acking, onAnswer, onAck, onRate, onOpenFile, onRoutine }: {
  e: ThreadEntry; run: Run; mate: Mate | null; newest: boolean; busyAnswer: boolean; acking: string
  onAnswer: (askId: string, value: string) => void; onAck: (routineId: string, at: string) => void
  onRate: (d: Deliverable, r: number) => void; onOpenFile: (d: Deliverable) => void; onRoutine: (routineId?: string) => void
}) {
  switch (e.kind) {
    // The routine's marker attaches to its run (8 below it, the run's 32 above).
    case 'marker': return <CenterLine text={e.text} onPress={e.routineId ? () => onRoutine(e.routineId) : undefined} />
    case 'scheduled': return <CenterLine text={e.text} onPress={() => onRoutine(e.routineId)} />
    case 'user': return <Bubble text={e.text} />
    case 'text': return <Reply markdown={e.text} />
    case 'deliver': return <Delivery ds={e.ds} text={e.text} verify={e.verify} warn={newest && e.verify.kind === 'issues'} onRate={onRate} onOpen={onOpenFile} />
    case 'ask': return <AskCard ask={e} busy={busyAnswer} onAnswer={(v) => onAnswer(e.id, v)} />
    case 'remind': return <RemindCard title={e.title} text={e.text} at={e.at} acked={e.acked} busy={acking === e.routineId + e.at} onAck={() => onAck(e.routineId, e.at)} onOpen={() => onRoutine(e.routineId)} />
    case 'auto': return <Text style={styles.muted}>24 小时没有回答，已按合理假设继续</Text>
    case 'working': return (
      <View style={styles.working} accessibilityRole="text" accessibilityLabel={`${mate ? mate.name : ''} 在干活`}>
        {mate ? <Avatar id={mate.id || mate.name} look={mate.avatar} isDefault={mate.isDefault} working dim={26} /> : null}
        <Thinking text={['在干活', e.step, elapsedOf(run)].filter(Boolean).join(' · ')} tail="" small />
      </View>
    )
    case 'failed': return e.cancelled ? <CenterLine text="已停止" /> : <Text style={styles.failed}>失败 · {e.reason}</Text>
    default: return null
  }
}

const fileIcon = (d: Deliverable): IconName => (d.kind === 'sheet' || d.kind === 'table' ? 'grid-outline' : d.kind === 'report' ? 'document-text-outline' : 'document-outline')
/** The document's first paragraph, as plain words. */
const plainWords = (md: string) => String(md || '').replace(/```[\s\S]*?```/g, ' ').replace(/[#>*_`|~\[\]]+/g, ' ').replace(/\(https?:[^)]*\)/g, '').replace(/\s+/g, ' ').trim()

/**
 * One segment's output as ONE grey bubble (web DeliverBubble), never carrying the document: the reply (or, when none
 * follows, the first document's excerpt), every file's summary rows, then the files as plain rows under a hairline — no
 * card inside the card (tapping a row opens the File screen). Verification + rating under it, one line per file.
 */
function Delivery({ ds, text, verify, warn, onRate, onOpen }: { ds: Deliverable[]; text: string; verify: VerifyState; warn: boolean; onRate: (d: Deliverable, r: number) => void; onOpen: (d: Deliverable) => void }) {
  const first = ds[0]
  const excerpt = !text && first && first.excerpt ? plainWords(first.excerpt) : ''
  return (
    <View style={styles.delivery}>
      <ReplyBubble>
        {text ? <Prose markdown={text} tight /> : excerpt ? <Text style={styles.excerpt} numberOfLines={3}>{excerpt}</Text> : null}
        {ds.map((d, i) => (Array.isArray(d.summary) && d.summary.length ? <ResultRows key={'s' + i} rows={d.summary} /> : null))}
        <View style={styles.files}>
          {ds.map((d, i) => (
            <Pressable key={'f' + (d.id || i)} onPress={() => onOpen(d)} accessibilityRole="button" accessibilityLabel={'打开 ' + d.title} hitSlop={4} style={({ pressed }) => [styles.fileRow, pressed && { opacity: 0.7 }]}>
              <Ionicons name={fileIcon(d)} size={20} color={color.muted} />
              <Text style={styles.fileTitle} numberOfLines={1}>{d.title || d.id}</Text>
              <Text style={styles.fileMeta} numberOfLines={1}>{fmtWhen(d.createdAt)}</Text>
            </Pressable>
          ))}
        </View>
      </ReplyBubble>
      <View style={styles.after}>
        {ds.map((d, i) => <VerifyLine key={d.id || i} words={verifyWords(verify)} warn={warn} notes={verify.kind !== 'verifying' ? verify.notes : ''} rating={d.rating} onRate={(r) => onRate(d, r)} />)}
      </View>
    </View>
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

/** 提醒卡: only you can do it; the teammate does not work. Title · time, the sentence, one 知道了. */
function RemindCard({ title, text, at, acked, busy, onAck, onOpen }: { title: string; text: string; at: string; acked: boolean; busy: boolean; onAck: () => void; onOpen: () => void }) {
  return (
    <View style={styles.remind}>
      <Pressable onPress={onOpen} style={styles.remindMain}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.remindTitle} numberOfLines={1}>{[title, fmtTime(at)].filter(Boolean).join(' · ')}</Text>
          {text && text !== title ? <Text style={styles.remindSub} numberOfLines={2}>{text}</Text> : null}
        </View>
      </Pressable>
      {acked ? <Text style={styles.remindDone}>已知道</Text> : <Btn label="知道了" onPress={onAck} disabled={busy} />}
    </View>
  )
}

/**
 * 找你卡 (§9.2): the question a run stopped on, at its place. Pending: the question, the detail in a monospace block, then
 * the answer controls — choice → stacked outline buttons, approval → 允许一次 / 拒绝, takeover → 「需要你在电脑上操作」 +
 * 我做完了, text → the dock answers it. Answered collapses to 「已回答：X」; superseded / expired read 「不再等待」.
 */
function AskCard({ ask, busy, onAnswer }: { ask: Extract<ThreadEntry, { kind: 'ask' }>; busy: boolean; onAnswer: (answer: string) => void }) {
  if (ask.status === 'answered') return <Text style={styles.askDone}>已回答：{ask.answer}</Text>
  if (ask.status === 'superseded' || ask.status === 'expired') return <Text style={styles.muted}>不再等待 · {ask.question}</Text>
  const off = !ask.answerable || busy
  return (
    <View style={styles.ask}>
      <Text style={styles.askQ}>{ask.question}</Text>
      {ask.detail ? <ScrollView style={styles.askDetail} nestedScrollEnabled><Text style={styles.askDetailText} selectable>{ask.detail}</Text></ScrollView> : null}
      {ask.askKind === 'choice' ? ask.options.map((o, i) => <Outline key={i} label={o} onPress={() => onAnswer(o)} disabled={off} />)
        : ask.askKind === 'approval' ? <><Outline label="允许一次" filled onPress={() => onAnswer('允许一次')} disabled={off} /><Outline label="拒绝" onPress={() => onAnswer('拒绝')} disabled={off} /></>
        : ask.askKind === 'takeover' ? <><Text style={styles.askNote}>需要你在电脑上操作</Text><Outline label="我做完了" onPress={() => onAnswer('我做完了')} disabled={off} /></>
        : null}
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
  const rows = useMemo(() => (src ? phasesOf(src) : []), [src])
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
                <View style={{ flex: 1 }}><Folded text={r.kind === 'verify' ? '核验 · ' + r.text : r.text} /></View>
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
  // 32 between runs, 8 inside one
  body: { flexGrow: 1, paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.xxl },
  older: { alignItems: 'center', minHeight: 8 },
  run: { gap: space.sm, borderRadius: radius.lg },
  lit: { backgroundColor: color.card, marginHorizontal: -8, paddingHorizontal: 8, paddingVertical: 8 },
  line: { gap: space.sm },
  loading: { alignSelf: 'center', marginVertical: space.xl, fontSize: 13, color: color.meta },
  dock: { paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.sm, backgroundColor: color.bg },
  working: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hello: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg, paddingVertical: space.xxl, gap: 8 },
  helloName: { fontSize: 16, lineHeight: 24, fontWeight: '600', color: color.fg, marginTop: 8 },
  helloDuty: { fontSize: 13, lineHeight: 20, color: color.muted, textAlign: 'center', maxWidth: 300 },
  pills: { alignSelf: 'stretch', gap: 8, marginTop: space.lg },
  pill: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, borderWidth: 1, borderColor: color.border, backgroundColor: color.card },
  pillText: { fontSize: 15, lineHeight: 24, color: color.fg2 },
  err: { fontSize: size.meta, lineHeight: 20, color: color.danger, paddingHorizontal: 8 },
  muted: { fontSize: size.meta, lineHeight: 20, color: color.muted },
  failed: { fontSize: size.meta, lineHeight: 20, color: color.danger },
  // 文件: the reply bubble's file rows (no card in the card)
  delivery: { gap: 4 },
  excerpt: { fontSize: 15, lineHeight: 26, color: color.fg },
  files: { borderTopWidth: 1, borderTopColor: color.border, paddingTop: 8, marginTop: 4, gap: 8 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 24 },
  fileTitle: { flexShrink: 1, fontSize: 14, lineHeight: 20, fontWeight: '500', color: color.fg },
  fileMeta: { flexShrink: 0, fontSize: 12, lineHeight: 16, color: color.muted, fontVariant: ['tabular-nums'] },
  after: { paddingLeft: 8 },
  // 提醒卡
  remind: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingLeft: 16, paddingRight: 8, borderWidth: 1, borderColor: color.border, borderRadius: radius.lg, backgroundColor: color.card },
  remindMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  remindTitle: { fontSize: 15, lineHeight: 24, color: color.fg, fontVariant: ['tabular-nums'] },
  remindSub: { fontSize: 13, lineHeight: 20, color: color.muted },
  remindDone: { fontSize: size.meta, color: color.meta, paddingHorizontal: 8 },
  // 找你卡
  ask: { gap: 8, padding: 16, borderRadius: 20, backgroundColor: color.card, maxWidth: '92%' },
  askQ: { fontSize: 15, lineHeight: 26, color: color.fg },
  askDetail: { maxHeight: 240, borderRadius: radius.md, backgroundColor: color.input, marginBottom: 4 },
  askDetailText: { fontFamily: font.mono, fontSize: 12, lineHeight: 20, color: color.fg2, padding: 16 },
  askNote: { fontSize: 15, lineHeight: 24, color: color.muted },
  askDone: { fontSize: size.meta, lineHeight: 20, color: color.meta },
  outline: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: color.border, borderRadius: 24, backgroundColor: color.input },
  outlineFilled: { backgroundColor: color.bubble },
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
