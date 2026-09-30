/**
 * A teammate's conversation (TEAMMATES.md §9.2 / §9.5 / §9.6). Header: back · avatar + name (serif) + title — tapping it
 * opens the teammate's page · ··· (停止). The line is the runs from GET /mates/thread, oldest first, 「加载更早」 on top;
 * each run drawn by runEntries(): a routine's centred marker or your bubble, lines said while it worked, 文件 with the
 * live verification line and 有用 / 没用, 找你卡, 「已安排」, 提醒卡 with 知道了, the reply as plain text, 在干活 while it
 * works, a failure line, and its 过程 folded. Dock 「给 <name> 发消息」 (「回答」 while it waits) → POST /mates/say: idle
 * starts a run, working steers it, waiting answers the question. Opening it posts /seen. With `runId` the screen pages
 * back until that run is loaded, scrolls to it and lights it up briefly.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { fmtDay, fmtDuration, fmtTime, isToday, type Deliverable, type Run } from '../api'
import { useConn, useNav, useStore } from '../store'
import { Avatar, Btn, Bubble, CenterLine, Composer, DateLine, Empty, Folded, Ghost, IconBtn, Prose, Reply, ResultRows, Screen, Sheet, SheetItem, Thinking, VerifyLine, type Tone } from '../components'
import { color, font, radius, size, space } from '../theme'
import { describe, elapsedOf, glyphOf, mergeRuns, pendingAsk, phasesOf, runEntries, time, verifyWords, type ThreadEntry, type VerifyState } from '../thread'

const PAGE = 20
const SEEK_PAGES = 10
const LIGHT_MS = 1600

type Page = { runs: Run[]; nextBefore: string | null; loaded: boolean; busy: boolean; missing: boolean }
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e))

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
  const [page, setPage] = useState<Page>({ runs: [], nextBefore: null, loaded: false, busy: false, missing: false })
  const pageRef = useRef(page); pageRef.current = page
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
          {mate ? <Avatar char={glyphOf(mate)} isDefault={mate.isDefault} working={mate.state === 'working'} dim={30} /> : null}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            {mate && mate.title ? <Text style={styles.title} numberOfLines={1}>{mate.title}</Text> : null}
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
        >
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
          {!page.loaded ? <ActivityIndicator color={color.meta} style={styles.loading} /> : null}
        </ScrollView>
        <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
          {err ? <Text style={styles.err}>{err}</Text> : null}
          <Composer value={text} onChange={setText} onSend={send} placeholder={answering ? '回答' : name ? `给 ${name} 发消息` : '发消息'} busy={sending} disabled={!api || !mate} />
        </View>
      </KeyboardAvoidingView>

      <Sheet open={sheet} onClose={() => setSheet(false)}>
        {mate && mate.state !== 'idle' ? <SheetItem icon="stop-circle-outline" label="停止" onPress={() => { stop() }} /> : null}
        <SheetItem icon="person-outline" label="同事资料" onPress={() => { setSheet(false); nav.push({ name: 'mateInfo', id }) }} />
      </Sheet>
    </Screen>
  )
}

/** One run: its entries, the 过程 fold, then the 在干活 or failure line. */
function RunView({ run, busyAnswer, acking, onAnswer, onAck, onRate, onOpenFile, onRoutine }: {
  run: Run; busyAnswer: boolean; acking: string
  onAnswer: (askId: string, value: string) => void; onAck: (routineId: string, at: string) => void
  onRate: (d: Deliverable, r: number) => void; onOpenFile: (d: Deliverable) => void; onRoutine: (routineId?: string) => void
}) {
  const entries = useMemo(() => runEntries(run), [run])
  const body = entries.filter((e) => e.kind !== 'working' && e.kind !== 'failed')
  const end = entries.find((e) => e.kind === 'working' || e.kind === 'failed')
  return (
    <View style={styles.line}>
      {body.map((e) => <Entry key={e.key} e={e} run={run} busyAnswer={busyAnswer} acking={acking} onAnswer={onAnswer} onAck={onAck} onRate={onRate} onOpenFile={onOpenFile} onRoutine={onRoutine} />)}
      <Process run={run} />
      {end ? <Entry e={end} run={run} busyAnswer={busyAnswer} acking={acking} onAnswer={onAnswer} onAck={onAck} onRate={onRate} onOpenFile={onOpenFile} onRoutine={onRoutine} /> : null}
    </View>
  )
}

function Entry({ e, run, busyAnswer, acking, onAnswer, onAck, onRate, onOpenFile, onRoutine }: {
  e: ThreadEntry; run: Run; busyAnswer: boolean; acking: string
  onAnswer: (askId: string, value: string) => void; onAck: (routineId: string, at: string) => void
  onRate: (d: Deliverable, r: number) => void; onOpenFile: (d: Deliverable) => void; onRoutine: (routineId?: string) => void
}) {
  switch (e.kind) {
    case 'marker': return <CenterLine icon="repeat-outline" text={e.text} onPress={e.routineId ? () => onRoutine(e.routineId) : undefined} />
    case 'scheduled': return <CenterLine icon="calendar-outline" text={e.text} onPress={() => onRoutine(e.routineId)} />
    case 'user': return <Bubble text={e.text} />
    case 'text': return <Reply markdown={e.text} />
    case 'deliver': return <FileCard d={e.d} verify={e.verify} onRate={onRate} onOpen={onOpenFile} />
    case 'ask': return <AskCard ask={e} busy={busyAnswer} onAnswer={(v) => onAnswer(e.id, v)} />
    case 'remind': return <RemindCard title={e.title} text={e.text} at={e.at} acked={e.acked} busy={acking === e.routineId + e.at} onAck={() => onAck(e.routineId, e.at)} onOpen={() => onRoutine(e.routineId)} />
    case 'auto': return <Text style={styles.muted}>24 小时没有回答，已按合理假设继续</Text>
    case 'working': return <Thinking text={['在干活', e.step, elapsedOf(run)].filter(Boolean).join(' · ')} tail="" />
    case 'failed': return e.cancelled ? <CenterLine text="已停止" /> : <Text style={styles.failed}>失败 · {e.reason}</Text>
    default: return null
  }
}

/** File bodies fetched for the cards, by file id: the thread's runs carry only a summary of each file (web DeliverBody). */
const bodies = new Map<string, string>()

/** A card's body: the file's own markdown when the run carries it, else fetched once with GET /deliverable. */
function useBody(d: Deliverable): string {
  const { api } = useConn()
  const need = typeof d.markdown !== 'string' && !!d.id
  const [body, setBody] = useState(() => (need ? bodies.get(d.id) || '' : ''))
  useEffect(() => {
    if (!need || !api || bodies.has(d.id)) return
    let on = true
    api.deliverable(d.id).then((x) => { const md = x && x.deliverable && typeof x.deliverable.markdown === 'string' ? x.deliverable.markdown : ''; bodies.set(d.id, md); if (on) setBody(md) }).catch(() => { /* the title still opens the file */ })
    return () => { on = false }
  }, [api, d.id, need])
  return need ? body : d.markdown || ''
}

/** 文件 (§9.1): the title opens the file; ✓ rows and the body inline; one line underneath reads verification live, then 有用 / 没用. */
function FileCard({ d, verify, onRate, onOpen }: { d: Deliverable; verify: VerifyState; onRate: (d: Deliverable, r: number) => void; onOpen: (d: Deliverable) => void }) {
  const markdown = useBody(d)
  const tone: Tone = verify.kind === 'passed' ? 'success' : verify.kind === 'issues' ? 'warn' : verify.kind === 'verifying' ? 'live' : 'meta'
  return (
    <View style={styles.file}>
      <Pressable onPress={() => onOpen(d)} accessibilityRole="button" style={({ pressed }) => [styles.fileHead, pressed && { backgroundColor: color.surface }]}>
        <Ionicons name={d.kind === 'report' ? 'newspaper-outline' : 'document-text-outline'} size={16} color={color.fg2} />
        <Text style={styles.fileTitle} numberOfLines={2}>{d.title}</Text>
        <Ionicons name="chevron-forward" size={14} color={color.meta} />
      </Pressable>
      <ResultRows rows={Array.isArray(d.summary) ? d.summary : []} />
      {markdown ? <Prose markdown={markdown} /> : null}
      <VerifyLine words={verifyWords(verify)} tone={tone} notes={verify.kind !== 'verifying' ? verify.notes : ''} rating={d.rating} onRate={(r) => onRate(d, r)} />
    </View>
  )
}

/** 提醒卡: only you can do it; the teammate does not work. Title · time, the sentence, one 知道了. */
function RemindCard({ title, text, at, acked, busy, onAck, onOpen }: { title: string; text: string; at: string; acked: boolean; busy: boolean; onAck: () => void; onOpen: () => void }) {
  return (
    <View style={styles.remind}>
      <Pressable onPress={onOpen} style={styles.remindMain}>
        <Ionicons name="notifications-outline" size={16} color={color.fg2} />
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
      <Text style={[styles.outlineText, filled && { color: color.bg }]} numberOfLines={2}>{label}</Text>
    </Pressable>
  )
}

/** 「过程 · n 步 · 3m」 folded under the run: the run as phases, opening to their calls. Nothing when the run used no tools. */
function Process({ run }: { run: Run }) {
  const rows = useMemo(() => phasesOf(run), [run])
  const [open, setOpen] = useState(false)
  const [openPhase, setOpenPhase] = useState(-1)
  const phaseCount = rows.filter((r) => r.kind === 'phase').length
  if (!phaseCount) return null
  const live = run.status === 'running'
  const lastIdx = rows.length - 1
  const label = ['过程', `${phaseCount} 步`, elapsedOf(run)].join(' · ')
  return (
    <View>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.procHead}>
        <Ionicons name={open ? 'chevron-down-outline' : 'chevron-forward-outline'} size={13} color={color.meta} />
        <Text style={styles.procText}>{label}</Text>
      </Pressable>
      {open ? (
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
                    <View style={styles.ic}>{running ? <ActivityIndicator size="small" color={color.fg2} /> : <Ionicons name={r.failed ? 'close-circle-outline' : 'checkmark-outline'} size={15} color={r.failed ? color.danger : color.meta} />}</View>
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
                        <View style={styles.ic}><Ionicons name={c.ok === false ? 'close-circle-outline' : c.ok === true ? 'checkmark-outline' : 'ellipse-outline'} size={13} color={c.ok === false ? color.danger : color.meta} /></View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.callLine} numberOfLines={2}><Text style={styles.callVerb}>{d.verb}</Text>{d.obj ? '  ' + d.obj : ''}</Text>
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
                <View style={[styles.ic, { marginTop: 2 }]}><Ionicons name="chatbox-ellipses-outline" size={15} color={color.meta} /></View>
                <View style={{ flex: 1 }}><Folded text={r.kind === 'verify' ? '核验 · ' + r.text : r.text} /></View>
              </View>
            )
          })}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  head: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, gap: 2 },
  who: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6, height: 48, paddingRight: 8 },
  name: { fontFamily: font.display, fontSize: 19, lineHeight: 24, color: color.fg },
  title: { fontSize: size.small, lineHeight: 16, color: color.meta },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.lg },
  older: { alignItems: 'center', minHeight: 8 },
  run: { gap: space.md, borderRadius: radius.lg },
  lit: { backgroundColor: color.surface, marginHorizontal: -8, paddingHorizontal: 8, paddingVertical: 6 },
  line: { gap: space.md },
  loading: { alignSelf: 'center', marginVertical: space.xl },
  dock: { paddingHorizontal: space.md, paddingTop: space.sm, gap: space.sm, backgroundColor: color.bg },
  err: { fontSize: size.meta, lineHeight: 18, color: color.danger, paddingHorizontal: 6 },
  muted: { fontSize: size.meta, lineHeight: 18, color: color.muted },
  failed: { fontSize: size.ui, lineHeight: 22, color: color.danger },
  // 文件
  file: { gap: 4 },
  fileHead: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 36, paddingVertical: 4, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: radius.md },
  fileTitle: { flex: 1, minWidth: 0, fontSize: size.ui, lineHeight: 22, fontWeight: '600', color: color.fg },
  // 提醒卡
  remind: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingLeft: 14, paddingRight: 6, borderWidth: 1, borderColor: color.border, borderRadius: radius.lg, backgroundColor: color.surface },
  remindMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  remindTitle: { fontSize: 14, lineHeight: 20, color: color.fg, fontVariant: ['tabular-nums'] },
  remindSub: { fontSize: size.small, lineHeight: 18, color: color.muted },
  remindDone: { fontSize: size.meta, color: color.meta, paddingHorizontal: 8 },
  // 找你卡
  ask: { gap: 6 },
  askQ: { fontSize: size.ui, lineHeight: 24, color: color.fg, marginBottom: 2 },
  askDetail: { maxHeight: 240, borderRadius: radius.md, backgroundColor: color.surface, marginBottom: 4 },
  askDetailText: { fontFamily: font.mono, fontSize: 13, lineHeight: 19, color: color.fg2, padding: 12 },
  askNote: { fontSize: size.ui, lineHeight: 22, color: color.muted, marginBottom: 2 },
  askDone: { fontSize: size.meta, lineHeight: 18, color: color.success },
  outline: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: color.border, borderRadius: radius.md, backgroundColor: color.bg },
  outlineFilled: { backgroundColor: color.fg, borderColor: color.fg },
  outlineText: { fontSize: size.ui, fontWeight: '500', color: color.fg, textAlign: 'center' },
  // 过程
  procHead: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 28, alignSelf: 'flex-start' },
  procText: { fontSize: size.small, color: color.meta, fontVariant: ['tabular-nums'] },
  ic: { width: 20, alignItems: 'center' },
  phases: { paddingBottom: space.xs },
  phase: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 34, paddingVertical: 3 },
  verb: { fontSize: 14, fontWeight: '500', color: color.fg2 },
  phaseMeta: { fontSize: size.meta, color: color.meta, fontVariant: ['tabular-nums'] },
  obj: { flex: 1, fontSize: size.meta, color: color.muted },
  call: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingLeft: 30, paddingVertical: 4 },
  callLine: { fontSize: size.meta + 1, lineHeight: 20, color: color.muted },
  callVerb: { color: color.fg2, fontWeight: '500' },
  callFail: { fontSize: size.meta, lineHeight: 18, color: color.danger },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
})
