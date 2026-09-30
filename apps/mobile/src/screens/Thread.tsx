/**
 * The thread screen (TEAMMATES.md §8.3 / §8.5): one shape for 今日, a task, a routine and the empty thread 「+」 opens.
 * Shared chrome: back · the serif title · one meta line · ··· where there are actions · the composer docked at the bottom.
 * The line itself is Grok-shaped: your words in a bubble on the right, replies as plain text, no avatars, no grey boxes.
 *
 *   today    「今日 · 9月30日」 + status words; the 44px 等你看 bar (sticky) and its sheet; the day's line (GET /feed when the
 *            server has it, the assistant task's activity otherwise) with hand-off rows that update in place; dock → /today/say
 *   task     threadOf(): bubble → 在做 line → ✓ rows + body + one live verification line with 有用 / 没用 → reply → failure +
 *            再来一次 → the folded 过程 above the dock; dock → /say; ··· = 取消｜再来一次 · 重新核验 · 重命名 · 分享 · 删除
 *   routine  meta line; runs newest first, each a date line + that run's reply (the run task's newest deliverable, or one
 *            line 没有变化); dock 「追问这一次」→ /say on the last run; ··· = 现在跑一次 · 暂停/恢复 · 删除
 *   new      「要什么结果？」 + example pills; dock → /create, and the route becomes the task (or routine) it made
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { ApiError, fmtDate, fmtDay, fmtDuration, fmtTime, type Activity, type Api, type Deliverable, type FeedEntry, type Routine, type RoutineRun, type Task } from '../api'
import { useConn, useNav, useStore, type ThreadKind } from '../store'
import { Btn, Bubble, Composer, DateLine, Empty, Field, Folded, Ghost, HandoffChip, IconBtn, ListBox, Meta, Prose, Reply, ResultRows, Row, Screen, Sheet, SheetItem, Thinking, Title, TopBar, VerifyLine, type Tone } from '../components'
import { color, font, radius, size, space } from '../theme'
import { dayStartIso, describe, elapsedOf, feedRows, handoffState, isCancelled, localDay, mergeFeed, olderDayOf, phasesOf, shiftDay, shortDay, threadOf, time, todayRows, verdictWord, verifyWords, type FeedRow, type ThreadEntry, type VerifyState } from '../thread'

const EXAMPLES = [
  '把这个目录的 README 整理成一页产品介绍',
  '比较三种 Node 定时任务方案，给出推荐',
  '每天 9 点给我一份 Node 生态简报',
]

/** One body per thread: folds, drafts and fetched detail must not survive a jump to another thread. */
export default function Thread({ kind, id }: { kind: ThreadKind; id?: string }) {
  const key = kind + ':' + (id || '')
  if (kind === 'today') return <TodayThread key={key} />
  if (kind === 'task') return <TaskThread key={key} id={id || ''} />
  if (kind === 'routine') return <RoutineThread key={key} id={id || ''} />
  return <NewThread key={key} />
}

// ---- shared -------------------------------------------------------------------

/** Re-render once a second while something runs, so 耗时 moves. */
function useTick(on: boolean) { const [, set] = useState(0); useEffect(() => { if (!on) return; const t = setInterval(() => set((n) => n + 1), 1000); return () => clearInterval(t) }, [on]) }

/** The thread is on screen: mark it read on the server. `stamp` changes when new content lands while it stays open. */
function useSeen(id: string, stamp: string) {
  const { api } = useConn()
  useEffect(() => { if (api && id) api.seen(id).catch(() => { /* an older server has no /seen */ }) }, [api, id, stamp])
}

/** Keep the end of the line in view when it grows. With `fromStart` the first layout scrolls too (今日); otherwise a thread opens at its title. */
function useFollow(ref: React.RefObject<ScrollView | null>, key: string | number | undefined, fromStart: boolean) {
  const seen = useRef<string | number | undefined>(undefined)
  useEffect(() => {
    if (key === undefined || key === seen.current) return
    const first = seen.current === undefined
    seen.current = key
    if (first && !fromStart) return
    const t = setTimeout(() => ref.current?.scrollToEnd({ animated: !first }), 60)
    return () => clearTimeout(t)
  }, [key, fromStart, ref])
}

/** Back · title area · optional sticky bar · the line · the dock. */
function Frame({ right, header, sticky, children, dock, err, follow, followFromStart }: { right?: React.ReactNode; header: React.ReactNode; sticky?: React.ReactNode; children: React.ReactNode; dock: React.ReactNode; err?: string; follow?: string | number; followFromStart?: boolean }) {
  const nav = useNav()
  const insets = useSafeAreaInsets()
  const scroller = useRef<ScrollView>(null)
  useFollow(scroller, follow, !!followFromStart)
  return (
    <Screen>
      <TopBar left={<IconBtn name="chevron-back-outline" label="返回" onPress={nav.pop} />} right={right} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroller} style={{ flex: 1 }} contentContainerStyle={styles.body} stickyHeaderIndices={sticky ? [1] : undefined} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" maintainVisibleContentPosition={{ minIndexForVisible: 1 }}>
          <View style={styles.head}>{header}</View>
          {sticky ? <View style={styles.sticky}>{sticky}</View> : null}
          {children}
        </ScrollView>
        <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
          {err ? <Text style={styles.err}>{err}</Text> : null}
          {dock}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const errText = (e: unknown) => (e instanceof Error ? e.message : String(e))

/** A failure as one line, with the one button that makes sense. */
function FailedLine({ reason, onRerun, busy }: { reason: string; onRerun?: () => void; busy?: boolean }) {
  return (
    <View style={styles.failed}>
      <Text style={styles.failedText}>{(isCancelled(reason) ? '' : '失败 · ') + reason}</Text>
      {onRerun && !isCancelled(reason) ? <Ghost icon="refresh-outline" label="再来一次" onPress={onRerun} disabled={busy} /> : null}
    </View>
  )
}

/** The delivery segment: ✓ rows, the body full width, one meta line reading verification live. */
function Deliver({ d, verify, onRate }: { d: Deliverable; verify: VerifyState; onRate: (d: Deliverable, r: number) => void }) {
  const tone: Tone = verify.kind === 'passed' ? 'success' : verify.kind === 'issues' ? 'warn' : verify.kind === 'verifying' ? 'live' : 'meta'
  return (
    <View style={styles.deliver}>
      <ResultRows rows={Array.isArray(d.summary) ? d.summary : []} />
      <Prose markdown={d.markdown || ''} />
      <VerifyLine words={verifyWords(verify)} tone={tone} notes={verify.kind !== 'verifying' ? verify.notes : ''} rating={d.rating} onRate={(r) => onRate(d, r)} />
    </View>
  )
}

// ---- 今日 -----------------------------------------------------------------------

type Handoff = Extract<Activity, { kind: 'handoff' }>
/** The line across days (web useDayFeed): everything fetched, shown from `from` (local midnight of the oldest day revealed). */
type Feed = { mode: 'unknown' | 'on' | 'off'; entries: FeedEntry[]; nextBefore: string | null; today: string; from: string; loaded: boolean; busy: boolean }
const FEED_PAGE = 60
const NONE: Activity[] = []
const dayLabel = () => fmtDay(new Date().toISOString())

function TodayThread() {
  const nav = useNav()
  const { api } = useConn()
  const { data, thread, refresh, setThread } = useStore()
  const { height: winH } = useWindowDimensions()
  const items = data ? data.items : []
  const active = items.filter((x) => x.status !== 'done' && x.status !== 'waiting' && x.scenario !== 'assistant')
  useTick(active.length > 0)
  const entries = useMemo(() => (thread && Array.isArray(thread.activity) ? thread.activity : NONE), [thread])
  useSeen(thread ? thread.id : '', thread ? (thread.lastAt || '') + ':' + entries.length : '')

  // ---- 等你看 ----
  const [open, setOpen] = useState(false)
  const [acting, setActing] = useState('')
  const { rows, more, unrated, counts } = useMemo(() => (data ? todayRows(data.items, data.deliverables, data.reminders) : { rows: [], more: 0, unrated: 0, counts: { waiting: 0, running: 0, delivered: 0, needs: false } }), [data])
  const hasBar = rows.length > 0 || unrated > 0
  const barText = [counts.waiting ? `等你看 ${counts.waiting}` : '', counts.running ? `${counts.running} 个在跑` : '', counts.delivered ? `今天交付 ${counts.delivered}` : ''].filter(Boolean).join(' · ') || `${unrated} 份还没评价`
  const words = [active.length ? `${active.length} 个在跑` : '', counts.waiting ? `${counts.waiting} 份等你看` : ''].filter(Boolean).join(' · ')
  useEffect(() => { if (open && !hasBar) setOpen(false) }, [open, hasBar])
  const goTask = useCallback((id: string) => { setOpen(false); nav.push({ name: 'thread', kind: 'task', id }) }, [nav])
  const goRoutine = useCallback((id: string) => { setOpen(false); nav.push({ name: 'thread', kind: 'routine', id }) }, [nav])
  const ack = async (routineId: string, at: string) => {
    if (!api) return
    setActing('r' + routineId + at)
    try { await api.routineAck(routineId, at); await refresh() } catch { /* the row stays; the next poll tells the truth */ } finally { setActing('') }
  }
  const rerun = async (id: string) => {
    if (!api) return
    setActing('f' + id)
    try { const d = await api.rerun(id); await refresh(); setOpen(false); nav.push({ name: 'thread', kind: 'task', id: d.task ? d.task.id : id }) } catch { /* nothing to show; the row stays */ } finally { setActing('') }
  }

  // ---- the line: the newest /feed page on every poll, merged by key; the assistant task's activity when the server has no /feed ----
  const [feed, setFeed] = useState<Feed>({ mode: 'unknown', entries: [], nextBefore: null, today: '', from: '', loaded: false, busy: false })
  const feedRef = useRef(feed); feedRef.current = feed
  const noFeed = feed.mode === 'off'
  useEffect(() => {
    if (!api || noFeed) return
    let on = true
    api.feed(undefined, FEED_PAGE).then((d) => {
      if (!on) return
      setFeed((prev) => {
        const today = localDay(new Date().toISOString())
        const fresh = !prev.loaded || prev.today !== today // first page, or the thread was left open past midnight
        return { ...prev, mode: 'on', loaded: true, today, entries: mergeFeed(fresh ? [] : prev.entries, d.entries || []), from: fresh ? dayStartIso(today) : prev.from, nextBefore: fresh ? d.nextBefore : prev.nextBefore }
      })
    }).catch((e) => { if (on && e instanceof ApiError && e.status === 404) setFeed((f) => ({ ...f, mode: 'off' })) })
    return () => { on = false }
  }, [api, noFeed, data]) // data is a new snapshot every poll
  /** 「加载昨天」: reveal one earlier day from what is loaded, fetching the page before the oldest when nothing older is loaded yet. */
  const loadOlder = async () => {
    const cur = feedRef.current
    if (cur.busy || !api) return
    if (!olderDayOf(cur.entries, cur.from)) {
      if (!cur.nextBefore) return
      setFeed((p) => ({ ...p, busy: true }))
      try { const d = await api.feed(cur.nextBefore, FEED_PAGE); setFeed((p) => ({ ...p, busy: false, entries: mergeFeed(p.entries, d.entries || []), nextBefore: d.nextBefore })) } catch { setFeed((p) => ({ ...p, busy: false })); return }
    }
    setFeed((p) => { const day = olderDayOf(p.entries, p.from); return day ? { ...p, from: dayStartIso(day) } : p })
  }
  const line = useMemo((): FeedRow[] => feed.mode === 'on'
    ? feedRows(feed.entries, feed.from, feed.today)
    : entries.flatMap((e, i) => (e.kind === 'user' || e.kind === 'text' || e.kind === 'handoff' ? [{ ...e, key: 'e' + i, today: true }] : [])), [feed, entries])
  const olderDay = feed.mode === 'on' ? olderDayOf(feed.entries, feed.from) : ''
  const canOlder = feed.mode === 'on' && (!!olderDay || !!feed.nextBefore)
  const olderLabel = olderDay ? (olderDay === shiftDay(feed.today, -1) ? '加载昨天' : '加载 ' + shortDay(olderDay)) : '加载更早'
  const todayCount = line.filter((r) => r.kind !== 'date' && r.today).length

  // ---- composer ----
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [pending, setPending] = useState('')
  useEffect(() => { if (pending && line.some((e) => e.kind === 'user' && e.text === pending)) setPending('') }, [pending, line])
  const send = async () => {
    const body = text.trim()
    if (!body || busy || !api) return
    setBusy(true); setPending(body); setText(''); setErr('')
    try { const d = await api.todaySay(body); if (d.thread) setThread(d.thread); await refresh() } catch (e) { setPending(''); setText(body); setErr(errText(e)) } finally { setBusy(false) }
  }
  const threadLive = !!(thread && thread.status !== 'done') || !!pending

  return (
    <>
      <Frame
        follow={todayCount + (pending ? 1 : 0) + (threadLive ? 1 : 0)}
        followFromStart
        err={err}
        header={
          <View style={styles.todayHead}>
            <Title>今日</Title>
            <Text style={styles.todayDate}>{dayLabel()}</Text>
            <View style={{ flex: 1 }} />
            {words ? <Text style={styles.todayWords} numberOfLines={1}>{words}</Text> : null}
          </View>
        }
        sticky={hasBar ? (
          <Pressable onPress={() => setOpen(true)} accessibilityRole="button" style={({ pressed }) => [styles.bar, pressed && { backgroundColor: color.surface2 }]}>
            <Text style={styles.barText} numberOfLines={1}>{barText}</Text>
            <Ionicons name="chevron-forward-outline" size={16} color={color.meta} />
          </Pressable>
        ) : undefined}
        dock={<Composer value={text} onChange={setText} onSend={send} placeholder="今天要做什么" busy={busy} disabled={!api} />}
      >
        <View style={styles.line}>
          {canOlder ? <Ghost icon="chevron-up-outline" label={olderLabel} onPress={loadOlder} disabled={feed.busy} /> : null}
          {line.map((e) => {
            if (e.kind === 'date') return <DateLine key={e.key} text={e.label} />
            if (e.kind === 'user') return <Bubble key={e.key} text={e.text} />
            if (e.kind === 'text') return <Reply key={e.key} markdown={e.text} />
            if (e.kind === 'handoff') {
              const h = e as Handoff & { today: boolean }
              const isTask = h.target === 'task'
              const st = isTask ? handoffState(items.find((x) => x.id === h.id)) : null
              const sub = st ? st.sub : isTask ? '已交给后台' : '已安排' + (h.schedule ? ' · ' + h.schedule : '')
              return <HandoffChip key={e.key} label={h.title} sub={sub} glyph={st ? st.glyph : isTask ? 'checkmark-outline' : 'repeat-outline'} spin={st ? st.spin : false} tone={st ? st.tone : 'meta'} onPress={() => (isTask ? goTask(h.id) : goRoutine(h.id))} action={h.today && st && st.failed ? () => { rerun(h.id).catch(() => {}) } : undefined} busy={acting === 'f' + h.id} />
            }
            if (e.kind === 'remind') return <Line key={e.key} icon="notifications-outline" text={e.title} onPress={() => goRoutine(e.routineId)} action={e.today && !e.acked ? { label: '知道了', run: () => { ack(e.routineId, e.at).catch(() => {}) } } : undefined} busy={acting === 'r' + e.routineId + e.at} />
            if (e.kind === 'change') return <Line key={e.key} icon="repeat-outline" text={[e.title, e.report ? '已出报告' : '有变化', fmtTime(e.at)].join(' · ')} onPress={() => goTask(e.taskId)} chevron />
            return null
          })}
          {pending ? <Bubble text={pending} /> : null}
          {threadLive ? <Thinking text={thread && thread.status !== 'done' && thread.currentStep ? thread.currentStep : '在想'} /> : null}
          {!line.length && !pending && !threadLive && !canOlder && data && !hasBar ? <Empty text="今天没有等你的事。说一句，交给它。" /> : null}
        </View>
      </Frame>

      <Sheet open={open} onClose={() => setOpen(false)} title="等你看">
        <ScrollView style={{ maxHeight: Math.round(winH * 0.62) }} bounces={false}>
          <ListBox>
            {rows.map((r) => {
              const openRow = r.open ? () => (r.open!.kind === 'task' ? goTask(r.open!.id) : goRoutine(r.open!.id)) : undefined
              const row = <Row glyph={r.glyph} tone={r.tone} spin={r.spin} title={r.title} sub={r.sub} state={r.action ? undefined : r.state} stateTone={r.stateTone} onPress={openRow} chevron={!!openRow && !r.action} />
              if (!r.action) return <View key={r.key}>{row}</View>
              const a = r.action
              return (
                <View key={r.key} style={styles.actionRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>{row}</View>
                  <Btn label={a.kind === 'ack' ? '知道了' : '再来一次'} onPress={() => { (a.kind === 'ack' ? ack(a.reminder.routineId, a.reminder.at) : rerun(a.id)).catch(() => {}) }} disabled={acting === r.key} style={{ marginRight: 10 }} />
                </View>
              )
            })}
            {more || unrated ? (
              <Row key="more" glyph={unrated ? 'document-text-outline' : 'list-outline'} title={[more ? `还有 ${more} 项` : '', unrated ? `${unrated} 份还没评价` : ''].filter(Boolean).join(' · ')} chevron onPress={() => { setOpen(false); if (unrated) nav.push({ name: 'deliverables' }) }} />
            ) : null}
          </ListBox>
        </ScrollView>
      </Sheet>
    </>
  )
}

/** One plain line in 今日's line: a reminder (bell · title · 知道了) or a routine's change (opens the run). Not a card. */
function Line({ icon, text, onPress, chevron, action, busy }: { icon: 'notifications-outline' | 'repeat-outline'; text: string; onPress?: () => void; chevron?: boolean; action?: { label: string; run: () => void }; busy?: boolean }) {
  return (
    <View style={styles.lineRow}>
      <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.lineMain, pressed && { opacity: 0.7 }]}>
        <View style={styles.ic}><Ionicons name={icon} size={14} color={color.meta} /></View>
        <Text style={styles.lineText} numberOfLines={2}>{text}</Text>
        {chevron ? <Ionicons name="chevron-forward" size={14} color={color.meta} /> : null}
      </Pressable>
      {action ? <Btn label={action.label} onPress={action.run} disabled={busy} /> : null}
    </View>
  )
}

/**
 * 需要你 (§2.7 找人): the question a task stopped on, at its place in the thread. Pending: the question, the detail in a
 * monospace block, then the answer controls by kind — choice → stacked outline buttons, approval → 允许一次 / 拒绝,
 * takeover → 「需要你在电脑上操作」 + 我做完了 (the phone cannot take the screen), text → the dock answers it. Answered
 * asks collapse to one line 「已回答：X」; superseded and expired ones read 「不再等待」.
 */
function AskCard({ ask, busy, onAnswer }: { ask: Extract<ThreadEntry, { kind: 'ask' }>; busy: boolean; onAnswer: (answer: string) => void }) {
  if (ask.status === 'answered') return <Text style={styles.askDone}>已回答：{ask.answer}</Text>
  if (ask.status === 'superseded' || ask.status === 'expired') return <Text style={styles.askGone}>不再等待 · {ask.question}</Text>
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

/** A full-width 44px answer button: outline, or filled for the default choice. */
function Outline({ label, onPress, disabled, filled }: { label: string; onPress: () => void; disabled?: boolean; filled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" style={({ pressed }) => [styles.outline, filled && styles.outlineFilled, disabled && { opacity: 0.45 }, pressed && { opacity: 0.7 }]}>
      <Text style={[styles.outlineText, filled && { color: color.bg }]} numberOfLines={2}>{label}</Text>
    </Pressable>
  )
}

// ---- a task ---------------------------------------------------------------------

type Detail = { task: Task; deliverables: Deliverable[] }
type TaskSheet = 'menu' | 'rename' | 'confirm' | null
const NO_DOCS: Deliverable[] = []

function TaskThread({ id }: { id: string }) {
  const nav = useNav()
  const { api } = useConn()
  const store = useStore()
  const summary = store.data ? store.data.items.find((x) => x.id === id) || null : null
  const live = !!summary && summary.status !== 'done'
  useTick(live)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [gone, setGone] = useState(false)
  // Refetch when the summary changes shape, and on every poll while it runs (store.data is a new snapshot each 5s).
  const key = summary ? `${summary.status}:${summary.deliverableIds.length}:${summary.lastAt || ''}` : ''
  const snap = live ? store.data : null
  useEffect(() => {
    if (!api) return
    let on = true
    api.task(id).then((d) => { if (on) setDetail(d) }).catch(() => { if (on && !summary) setGone(true) })
    return () => { on = false }
  }, [api, id, key, snap]) // eslint-disable-line react-hooks/exhaustive-deps
  useSeen(id, summary ? `${summary.lastAt || ''}:${summary.status}:${summary.deliverableIds.length}` : '')

  const task = summary || (detail ? detail.task : null) // the freshest status
  // The live copy carries status and verification; the detail carries the activity and the documents.
  const full = useMemo(() => (task ? (detail && detail.task.id === id ? { ...detail.task, ...task, activity: detail.task.activity } : task) : null), [task, detail, id])
  const docs = detail && detail.task.id === id ? detail.deliverables : NO_DOCS
  const entries = useMemo(() => (full ? threadOf(full, docs) : []), [full, docs])

  const [sheet, setSheet] = useState<TaskSheet>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [answering, setAnswering] = useState(false)
  const [err, setErr] = useState('')

  if (!task || !full) {
    return (
      <Screen>
        <TopBar left={<IconBtn name="chevron-back-outline" label="返回" onPress={nav.pop} />} />
        <View style={styles.center}>{gone ? <Empty text="没有这条任务。" /> : <ActivityIndicator color={color.fg2} />}</View>
      </Screen>
    )
  }

  const meta = [live ? task.statusLabel : task.error ? (isCancelled(task.error) ? '已取消' : '失败') : verdictWord(task), fmtDate(task.finishedAt || task.createdAt)].filter(Boolean).join(' · ')
  // 等你答: a text question is answered from the dock; a choice / approval / takeover only from its card.
  const pendingAsk = task.status === 'waiting' && task.ask ? task.ask : null
  const blocked = task.status === 'verifying' || task.status === 'queued' || !task.sessionId || (!!pendingAsk && pendingAsk.askKind !== 'text')
  const latest = docs.length ? docs[docs.length - 1] : null

  /** One POST from the ··· menu: close the sheet, do it, refresh; `then` runs before the refresh so a pop or push is not delayed. */
  const run = async <T,>(fn: (a: Api) => Promise<T>, then?: (r: T) => void) => {
    if (!api || busy) return
    setBusy(true); setSheet(null); setErr('')
    try { const r = await fn(api); if (then) then(r); await store.refresh() } catch (e) { setErr(errText(e)) } finally { setBusy(false) }
  }
  const rerun = () => run((a) => a.rerun(id), (d) => { if (d.task) nav.push({ name: 'thread', kind: 'task', id: d.task.id }) })
  const saveName = () => { const t = name.trim(); if (!t || t === task.title) { setSheet(null); return } run((a) => a.rename(id, t)) }
  const rate = async (d: Deliverable, r: number) => {
    if (!api) return
    try {
      const x = await api.rate(d.id, d.rating === r ? null : r)
      setDetail((prev) => prev ? { ...prev, deliverables: prev.deliverables.map((y) => y.id === x.deliverable.id ? { ...y, ...x.deliverable } : y) } : prev)
      store.refresh()
    } catch (e) { setErr(errText(e)) }
  }
  const share = (d: Deliverable) => { Share.share({ title: d.title, message: '# ' + d.title + '\n\n' + (d.markdown || '') }).catch(() => {}) }
  const say = async () => {
    const body = text.trim()
    if (!body || sending || blocked || !api) return
    setSending(true); setErr('')
    try { if (pendingAsk) await api.answer(id, pendingAsk.id, body); else await api.say(id, body); setText(''); await store.refresh() } catch (e) { setErr(errText(e)) } finally { setSending(false) }
  }
  const answer = async (askId: string, value: string) => {
    if (!api || answering) return
    setAnswering(true); setErr('')
    try { await api.answer(id, askId, value); await store.refresh() } catch (e) { setErr(errText(e)) } finally { setAnswering(false) }
  }

  return (
    <>
      <Frame
        right={<IconBtn name="ellipsis-horizontal-outline" label="更多" onPress={() => setSheet('menu')} />}
        header={<><Title>{task.title}</Title><Meta style={styles.meta}>{meta}</Meta></>}
        follow={detail ? entries.length : undefined}
        err={err}
        dock={<View style={{ opacity: blocked ? 0.45 : 1 }}><Composer value={text} onChange={setText} onSend={say} placeholder={pendingAsk && pendingAsk.askKind === 'text' ? '回答' : '回复'} busy={sending} disabled={blocked || !api} /></View>}
      >
        <View style={styles.line}>
          {entries.map((e) => {
            if (e.kind === 'user') return <Bubble key={e.key} text={e.text} />
            if (e.kind === 'deliver') return <Deliver key={e.key} d={e.d} verify={e.verify} onRate={rate} />
            if (e.kind === 'text') return <Reply key={e.key} markdown={e.text} />
            if (e.kind === 'ask') return <AskCard key={e.key} ask={e} busy={answering} onAnswer={(v) => { answer(e.id, v) }} />
            if (e.kind === 'auto') return <Text key={e.key} style={styles.askGone}>24 小时没有回答，已按合理假设继续</Text>
            if (e.kind === 'thinking') return <Thinking key={e.key} text={['在做', e.step, elapsedOf(task)].filter(Boolean).join(' · ')} tail="" />
            if (e.kind === 'failed') return <FailedLine key={e.key} reason={e.reason} onRerun={rerun} busy={busy} />
            return null
          })}
          {!detail && entries.length <= 1 ? <ActivityIndicator color={color.meta} style={styles.loading} /> : null}
        </View>
        <Process task={full} live={live} onOpen={(kind, tid) => nav.push({ name: 'thread', kind, id: tid })} />
      </Frame>

      <Sheet open={sheet !== null} onClose={() => setSheet(null)} title={sheet === 'rename' ? '重命名' : sheet === 'confirm' ? '删掉这条记录和它的交付物？' : undefined}>
        {sheet === 'menu' ? (
          <>
            {live
              ? <SheetItem icon="stop-circle-outline" label="取消" onPress={() => run((a) => a.cancel(id))} />
              : <SheetItem icon="refresh-outline" label="再来一次" onPress={rerun} />}
            {!live && task.deliverableIds.length ? <SheetItem icon="shield-checkmark-outline" label="重新核验" onPress={() => run((a) => a.verify(id))} /> : null}
            <SheetItem icon="pencil-outline" label="重命名" onPress={() => { setName(task.title); setSheet('rename') }} />
            {latest ? <SheetItem icon="share-outline" label="分享" onPress={() => { setSheet(null); share(latest) }} /> : null}
            <SheetItem icon="trash-outline" label="删除" danger onPress={() => setSheet('confirm')} />
          </>
        ) : sheet === 'rename' ? (
          <View style={styles.renameBox}>
            <Field value={name} onChange={setName} placeholder="标题" autoFocus onSubmit={saveName} />
            <Btn label="确定" kind="primary" onPress={saveName} disabled={!name.trim() || busy} style={{ alignSelf: 'flex-end' }} />
          </View>
        ) : sheet === 'confirm' ? (
          <>
            <SheetItem icon="trash-outline" label="删除" danger onPress={() => run((a) => a.remove(id), () => nav.pop())} />
            <SheetItem label="取消" onPress={() => setSheet(null)} />
          </>
        ) : null}
      </Sheet>
    </>
  )
}

/** 「过程 · n 步 · 3m」 folded at the end of the line, above the dock: the run as phases, opening to their calls. */
function Process({ task, live, onOpen }: { task: Task; live: boolean; onOpen: (kind: 'task' | 'routine', id: string) => void }) {
  const rows = useMemo(() => phasesOf(task), [task])
  const [open, setOpen] = useState(false)
  const [openPhase, setOpenPhase] = useState(-1)
  const lastIdx = rows.length - 1
  // Follow the run: the newest phase opens when it appears, not on every poll, so a fold you closed stays closed.
  useEffect(() => { if (live && rows[lastIdx] && rows[lastIdx].kind === 'phase') setOpenPhase(lastIdx) }, [live, lastIdx]) // eslint-disable-line react-hooks/exhaustive-deps
  const v = task.verification
  const phaseCount = rows.filter((r) => r.kind === 'phase').length
  const label = ['过程', phaseCount ? `${phaseCount} 步` : '', elapsedOf(task)].filter(Boolean).join(' · ')
  const handoffLabel = (e: Extract<Activity, { kind: 'handoff' }>) => (e.target === 'task' ? '已交给后台' : '已安排') + '：' + e.title + (e.schedule ? ' · ' + e.schedule : '')
  return (
    <View style={styles.proc}>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.procHead}>
        <View style={styles.ic}>{live ? <ActivityIndicator size="small" color={color.fg2} /> : <Ionicons name="time-outline" size={16} color={color.meta} />}</View>
        <Text style={styles.procText}>{label}</Text>
        <Ionicons name={open ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color={color.meta} />
      </Pressable>
      {open ? (
        <View style={styles.phases}>
          {!rows.length && !v && task.status !== 'verifying' ? <Empty text={live ? task.statusLabel + '…' : '无'} /> : null}
          {rows.map((r, i) => {
            if (r.kind === 'phase') {
              const running = live && i === lastIdx && task.status === 'running'
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
                  {isOpen ? r.items.map((e, j) => {
                    const d = describe(e.name, e.detail)
                    const nextAt = r.items[j + 1] ? r.items[j + 1].at : r.endAt
                    const ms = Math.max(0, time(nextAt) - time(e.at))
                    return (
                      <View key={j} style={styles.call}>
                        <View style={styles.ic}><Ionicons name={e.ok === false ? 'close-circle-outline' : e.ok === true ? 'checkmark-outline' : 'ellipse-outline'} size={13} color={e.ok === false ? color.danger : color.meta} /></View>
                        <View style={styles.callMain}>
                          <Text style={styles.callLine} numberOfLines={2}><Text style={styles.callVerb}>{d.verb}</Text>{d.obj ? '  ' + d.obj : ''}</Text>
                          {e.ok === false && e.result ? <Text style={styles.callFail} numberOfLines={2}>失败 · {e.result}</Text> : null}
                        </View>
                        {ms > 1500 ? <Text style={styles.phaseMeta}>{fmtDuration(ms)}</Text> : null}
                      </View>
                    )
                  }) : null}
                </View>
              )
            }
            if (r.kind === 'handoff') return <View key={i} style={styles.note}><HandoffChip label={handoffLabel(r)} glyph={r.target === 'task' ? 'checkmark-outline' : 'repeat-outline'} tone="meta" onPress={() => onOpen(r.target, r.id)} /></View>
            return (
              <View key={i} style={styles.note}>
                <View style={[styles.ic, { marginTop: 2 }]}><Ionicons name="chatbox-ellipses-outline" size={15} color={color.meta} /></View>
                <View style={{ flex: 1 }}><Folded text={r.kind === 'verify' ? '核验 · ' + r.text : r.text} /></View>
              </View>
            )
          })}
          {task.status === 'verifying' ? (
            <View style={styles.phase}>
              <View style={styles.ic}><ActivityIndicator size="small" color={color.fg2} /></View>
              <Text style={[styles.verb, { color: color.fg }]}>核验</Text>
              <Text style={styles.phaseMeta}>核验中</Text>
            </View>
          ) : v ? (
            <View style={styles.phase}>
              <View style={styles.ic}><Ionicons name={v.passed === false ? 'close-circle-outline' : v.passed === true ? 'checkmark-outline' : 'remove-outline'} size={15} color={v.passed === false ? color.danger : color.meta} /></View>
              <Text style={[styles.verb, v.passed === false && { color: color.danger }]}>核验</Text>
              <Text style={styles.phaseMeta}>{[v.passed === true ? '通过' : v.passed === false ? '有问题' : '未能核验', v.checked ? `核对 ${v.checked}` : '', v.issues ? `问题 ${v.issues}` : ''].filter(Boolean).join(' · ')}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

// ---- a routine -------------------------------------------------------------------

type RunDetail = Detail | 'loading' | 'error'
type RoutineSheet = 'menu' | 'confirm' | null
const EAGER_RUNS = 5
const MAX_RUNS = 20

/** The newest run that produced a task. Runs come newest first from the server. */
const newestTask = (r: Routine) => { const hit = (r.runs || []).find((x) => x.taskId); return (hit && hit.taskId) || r.lastTaskId || '' }

function RoutineThread({ id }: { id: string }) {
  const nav = useNav()
  const { api } = useConn()
  const store = useStore()
  const [full, setFull] = useState<Routine | null>(null)
  const [sheet, setSheet] = useState<RoutineSheet>(null)
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const [details, setDetails] = useState<Record<string, RunDetail>>({})

  // The list payload has the routine without its runs; the routines endpoint has them. Reload whenever the store ticks.
  const base = store.data ? store.data.routines.find((x) => x.id === id) || null : null
  useEffect(() => {
    if (!api) return
    let on = true
    api.routines().then((d) => { if (on) setFull(d.items.find((x) => x.id === id) || null) }).catch(() => {})
    return () => { on = false }
  }, [api, id, store.data])
  const detail = full && full.id === id ? full : null
  // Stable per poll and per fetch: the eager-load effect below keys off it, so it must not be a fresh object every render.
  const r = useMemo((): Routine | null => (base ? { ...base, runs: detail ? detail.runs : base.runs } : detail), [base, detail])
  useSeen(r ? r.id : '', r ? r.lastAt || '' : '')

  const runs = useMemo(() => (r && r.runs ? r.runs : []).slice(0, MAX_RUNS), [r])
  const load = useCallback((taskId: string) => {
    if (!api) return
    setDetails((d) => (d[taskId] ? d : { ...d, [taskId]: 'loading' }))
    api.task(taskId).then((d) => setDetails((prev) => ({ ...prev, [taskId]: d }))).catch(() => setDetails((prev) => ({ ...prev, [taskId]: 'error' })))
  }, [api])
  // The first few runs load with the thread; older ones on request. A run still going reloads with every poll.
  useEffect(() => {
    runs.slice(0, EAGER_RUNS).forEach((x) => { if (x.taskId && !x.fired && x.changed !== false && !x.error) { const cur = details[x.taskId]; if (!cur || (typeof cur === 'object' && cur.task.status !== 'done')) load(x.taskId) } })
  }, [runs, load, store.data]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!r) {
    return (
      <Screen>
        <TopBar left={<IconBtn name="chevron-back-outline" label="返回" onPress={nav.pop} />} />
        <View style={styles.center}>{store.data ? <Empty text="找不到这条例行。" /> : <ActivityIndicator color={color.fg2} />}</View>
      </Screen>
    )
  }

  const once = !!r.once
  const meta = [r.kind === 'remind' ? '提醒' : '例行', r.scheduleLabel, !r.enabled ? (once ? '已结束' : '已暂停') : r.nextRunAt && !once ? '下次 ' + fmtDate(r.nextRunAt) : ''].filter(Boolean).join(' · ')
  const lastTaskId = newestTask(r)

  const act = async (fn: (a: Api) => Promise<unknown>, then?: () => void) => {
    if (!api || busy) return
    setBusy(true); setSheet(null); setErr('')
    try { await fn(api); if (then) then(); await store.refresh() } catch (e) { setErr(errText(e)) } finally { setBusy(false) }
  }
  const runNow = async () => {
    if (!api || busy) return
    setBusy(true); setSheet(null); setErr('')
    const before = newestTask(r)
    try {
      const d = (await api.routineRun(r.id)) as { routine: Routine; task?: Task }
      await store.refresh()
      let next = (d.task && d.task.id) || newestTask(d.routine)
      if (!next || next === before) { const fresh = await api.routines(); const mine = fresh.items.find((x) => x.id === r.id); if (mine) { setFull(mine); next = newestTask(mine) } }
      if (next && next !== before) nav.push({ name: 'thread', kind: 'task', id: next })
    } catch (e) { setErr(errText(e)) } finally { setBusy(false) }
  }
  const say = async () => {
    const body = text.trim()
    if (!body || sending || !lastTaskId || !api) return
    setSending(true); setErr('')
    try { await api.say(lastTaskId, body); setText(''); await store.refresh(); load(lastTaskId) } catch (e) { setErr(errText(e)) } finally { setSending(false) }
  }

  return (
    <>
      <Frame
        right={<IconBtn name="ellipsis-horizontal-outline" label="更多" onPress={() => setSheet('menu')} />}
        header={<><Title>{r.title}</Title><Meta style={styles.meta}>{meta}</Meta></>}
        err={err}
        dock={<View style={{ opacity: lastTaskId ? 1 : 0.45 }}><Composer value={text} onChange={setText} onSend={say} placeholder="追问这一次" busy={sending} disabled={!lastTaskId || !api} /></View>}
      >
        <View style={styles.runs}>
          {runs.length ? runs.map((x, i) => (
            <View key={x.at + i} style={styles.run}>
              <Pressable onPress={x.taskId ? () => nav.push({ name: 'thread', kind: 'task', id: x.taskId! }) : undefined} disabled={!x.taskId} accessibilityRole={x.taskId ? 'button' : undefined}>
                <DateLine text={fmtDate(x.at)} />
              </Pressable>
              <RunBody run={x} remind={r.kind === 'remind'} detail={x.taskId ? details[x.taskId] : undefined} onLoad={() => { if (x.taskId) load(x.taskId) }} />
            </View>
          )) : <Empty text={detail || !api ? '还没跑过' : '…'} />}
        </View>
      </Frame>

      <Sheet open={sheet !== null} onClose={() => setSheet(null)} title={sheet === 'confirm' ? '删掉这条例行？' : undefined}>
        {sheet === 'menu' ? (
          <>
            <SheetItem icon="play-outline" label="现在跑一次" onPress={runNow} />
            {!once || r.enabled ? <SheetItem icon={r.enabled ? 'pause-outline' : 'play-outline'} label={r.enabled ? '暂停' : '恢复'} onPress={() => act((a) => a.routineEnable(r.id, !r.enabled))} /> : null}
            <SheetItem icon="trash-outline" label="删除" danger onPress={() => setSheet('confirm')} />
          </>
        ) : sheet === 'confirm' ? (
          <>
            <SheetItem icon="trash-outline" label="删除" danger onPress={() => act((a) => a.routineRemove(r.id), () => nav.pop())} />
            <SheetItem label="取消" onPress={() => setSheet(null)} />
          </>
        ) : null}
      </Sheet>
    </>
  )
}

/** One run's reply: a reminder that fired, a failure, 没有变化 for a quiet run, else the run task's newest deliverable (reports in full) or its last reply. */
function RunBody({ run, remind, detail, onLoad }: { run: RoutineRun; remind: boolean; detail?: RunDetail; onLoad: () => void }) {
  if (run.fired || (remind && !run.taskId)) return <Text style={styles.runLine}>提醒</Text>
  if (run.error) return <Text style={[styles.runLine, { color: color.danger }]}>失败 · {run.error}</Text>
  if (run.changed === false) return <Text style={styles.runLine}>没有变化</Text>
  if (!run.taskId) return <Text style={styles.runLine}>已完成</Text>
  if (!detail) return <Ghost icon="chevron-down-outline" label="看这一次" onPress={onLoad} />
  if (detail === 'loading') return <ActivityIndicator color={color.meta} style={styles.loading} />
  if (detail === 'error') return <Text style={styles.runLine}>读不到这一次的结果。</Text>
  const { task, deliverables } = detail
  const docs = deliverables.slice().sort((a, b) => time(b.createdAt) - time(a.createdAt))
  const newest = docs[0]
  if (newest) return <View><ResultRows rows={Array.isArray(newest.summary) ? newest.summary : []} /><Prose markdown={newest.markdown || ''} /></View>
  const texts = (task.activity || []).filter((e): e is Extract<Activity, { kind: 'text' }> => e.kind === 'text')
  const last = texts[texts.length - 1]
  if (last) return <Reply markdown={last.text} />
  if (task.status !== 'done') return <Thinking text={['在做', task.currentStep || task.statusLabel].filter(Boolean).join(' · ')} />
  return <Text style={styles.runLine}>{task.error ? '失败 · ' + task.error : task.summary || '已完成'}</Text>
}

// ---- a new thread ------------------------------------------------------------------

function NewThread() {
  const nav = useNav()
  const { api } = useConn()
  const store = useStore()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const send = async () => {
    const body = text.trim()
    if (!body || busy || !api) return
    setBusy(true); setErr('')
    try {
      const d = await api.create(body)
      await store.refresh()
      if (d.task) nav.replace({ name: 'thread', kind: 'task', id: d.task.id })
      else if (d.routine) nav.replace({ name: 'thread', kind: 'routine', id: d.routine.id })
      else nav.pop()
    } catch (e) { setErr(errText(e)); setBusy(false) }
  }
  return (
    <Frame
      header={<Title>要什么结果？</Title>}
      err={err}
      dock={<Composer value={text} onChange={setText} onSend={send} placeholder="今天要做什么" busy={busy} disabled={!api} autoFocus />}
    >
      <View style={styles.examples}>
        {EXAMPLES.map((ex) => <Btn key={ex} label={ex} icon="arrow-forward-outline" onPress={() => setText(ex)} style={styles.example} />)}
      </View>
    </Frame>
  )
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingTop: space.xs, paddingBottom: space.xl },
  head: { paddingBottom: space.md },
  meta: { marginTop: space.sm },
  sticky: { backgroundColor: color.bg, paddingBottom: space.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dock: { paddingHorizontal: space.md, paddingTop: space.sm, gap: space.sm, backgroundColor: color.bg },
  err: { fontSize: size.meta, lineHeight: 18, color: color.danger, paddingHorizontal: 6 },
  line: { gap: space.md },
  loading: { alignSelf: 'flex-start', marginVertical: space.md },
  deliver: { gap: 2 },
  failed: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  failedText: { flexShrink: 1, fontSize: size.ui, lineHeight: 22, color: color.danger },
  // 今日
  todayHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  todayDate: { fontSize: 14, color: color.muted, fontVariant: ['tabular-nums'] },
  todayWords: { fontSize: size.meta, color: color.meta, fontVariant: ['tabular-nums'], flexShrink: 1 },
  bar: { height: 44, paddingLeft: 14, paddingRight: 10, borderRadius: radius.lg, borderWidth: 1, borderColor: color.border, backgroundColor: color.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  barText: { fontSize: size.ui, fontWeight: '500', color: color.fg2, flexShrink: 1, fontVariant: ['tabular-nums'] },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lineMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  lineText: { flex: 1, minWidth: 0, fontSize: size.ui, lineHeight: 22, color: color.fg2 },
  // 需要你
  ask: { gap: 6 },
  askQ: { fontSize: size.ui, lineHeight: 24, color: color.fg, marginBottom: 2 },
  askDetail: { maxHeight: 240, borderRadius: radius.md, backgroundColor: color.surface, marginBottom: 4 },
  askDetailText: { fontFamily: font.mono, fontSize: 13, lineHeight: 19, color: color.fg2, padding: 12 },
  askNote: { fontSize: size.ui, lineHeight: 22, color: color.muted, marginBottom: 2 },
  askDone: { fontSize: size.meta, lineHeight: 18, color: color.success },
  askGone: { fontSize: size.meta, lineHeight: 18, color: color.muted },
  outline: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: color.border, borderRadius: radius.md, backgroundColor: color.bg },
  outlineFilled: { backgroundColor: color.fg, borderColor: color.fg },
  outlineText: { fontSize: size.ui, fontWeight: '500', color: color.fg, textAlign: 'center' },
  // 过程
  proc: { borderTopWidth: 1, borderTopColor: color.borderSoft, marginTop: space.lg, paddingTop: space.xs },
  procHead: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  procText: { flex: 1, fontSize: size.ui, color: color.fg2, fontVariant: ['tabular-nums'] },
  ic: { width: 20, alignItems: 'center' },
  phases: { paddingBottom: space.sm },
  phase: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36, paddingVertical: 4 },
  verb: { fontSize: size.ui, fontWeight: '500', color: color.fg2 },
  phaseMeta: { fontSize: size.meta, color: color.meta, fontVariant: ['tabular-nums'] },
  obj: { flex: 1, fontSize: size.meta, color: color.muted },
  call: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingLeft: 30, paddingVertical: 4 },
  callMain: { flex: 1, minWidth: 0 },
  callLine: { fontSize: size.meta + 1, lineHeight: 20, color: color.muted },
  callVerb: { color: color.fg2, fontWeight: '500' },
  callFail: { fontSize: size.meta, lineHeight: 18, color: color.danger },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  renameBox: { paddingHorizontal: 12, paddingTop: 4, gap: space.md },
  // routine
  runs: { gap: space.lg },
  run: { gap: space.sm },
  runLine: { fontSize: size.body, lineHeight: 26, color: color.muted },
  // new
  examples: { alignItems: 'flex-start', gap: space.xs, marginLeft: -8 },
  example: { alignSelf: 'flex-start' },
})
