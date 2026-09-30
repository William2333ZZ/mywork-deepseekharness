/**
 * S1 会话主屏 + S1a 等你看.
 *
 * The flow is today's thread (your words in bubbles, replies as prose, hand-offs as chips that update in place)
 * with today's deliverable cards, reminder cards and failure cards woven in by time. The 等你看 bar folds the
 * web's 今日清单 into a sheet: reminders, failures, verification issues, running, delivered today, in that order,
 * then the first three routines. A row or card here carries at most one button; no other list in the app does.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { fmtDate, fmtDuration, fmtTime, isToday, type Activity, type Deliverable, type Reminder, type Routine, type Task } from '../api'
import { useConn, useNav, useStore } from '../store'
import { Btn, Bubble, Composer, DeliverableCard, Greet, HandoffChip, IconBtn, ListBox, Mark, Reply, Row, Screen, Section, Sheet, Thinking, TopBar, type IconName, type Tone } from '../components'
import { color, radius, size, space } from '../theme'

type TodayRow = {
  key: string; rank: number; at: string
  glyph?: IconName; tone?: Tone; spin?: boolean
  title: string; sub?: string; state?: string; stateTone?: Tone
  action?: { label: string; run: () => Promise<void> }
  open?: () => void
}

type FlowItem =
  | { key: string; at: number; kind: 'entry'; entry: Activity }
  | { key: string; at: number; kind: 'card'; task: Task }
  | { key: string; at: number; kind: 'fail'; task: Task }
  | { key: string; at: number; kind: 'remind'; reminder: Reminder }

const isReport = (t: Task) => !!(t.report || (t.deliverables || []).some((d) => d.kind === 'report'))
const elapsedOf = (t: Task) => fmtDuration(new Date(t.finishedAt || new Date().toISOString()).getTime() - new Date(t.startedAt || t.createdAt).getTime())
const ms = (iso?: string) => { const n = iso ? new Date(iso).getTime() : NaN; return Number.isFinite(n) ? n : 0 }
const failedToday = (t: Task) => t.status === 'done' && !!t.error && !/已取消/.test(t.error) && isToday(t.finishedAt || t.createdAt)
const NONE: Activity[] = []

/** The web's RoutinesSection order: enabled first, then by next run; a spent one-off is history. */
const byNext = (a: Routine, b: Routine) => (a.enabled === b.enabled ? 0 : a.enabled ? -1 : 1) || (ms(a.nextRunAt) - ms(b.nextRunAt))
const whenOf = (r: Routine) => !r.enabled ? '已暂停' : r.nextRunAt ? '下次 ' + (isToday(r.nextRunAt) ? '今天 ' + fmtTime(r.nextRunAt) : fmtDate(r.nextRunAt)) : ''

/** The web's todayRows, minus the DOM: reminders → failures → verification issues → running → delivered today. */
function todayRows(items: Task[], deliverables: Deliverable[], reminders: Reminder[], go: { task: (id: string) => void; ack: (r: Reminder) => Promise<void>; rerun: (id: string) => Promise<void> }) {
  const rows: TodayRow[] = []
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
  for (const r of reminders || []) rows.push({ key: 'r' + r.routineId + r.at, rank: 0, at: r.at, glyph: 'notifications-outline', tone: 'live', title: r.title, sub: '提醒 · ' + fmtTime(r.at), action: { label: '知道了', run: () => go.ack(r) } })
  for (const x of items) {
    if (x.scenario === 'assistant') continue
    const done = x.status === 'done'
    const when = new Date(x.finishedAt || x.createdAt)
    if (failedToday(x)) rows.push({ key: 'f' + x.id, rank: 1, at: x.finishedAt || x.createdAt, glyph: 'close-circle-outline', tone: 'danger', title: x.title, sub: x.error, action: { label: '再来一次', run: () => go.rerun(x.id) }, open: () => go.task(x.id) })
    else if (done && x.verification && x.verification.passed === false && when >= dayStart) rows.push({ key: 'v' + x.id, rank: 2, at: x.finishedAt || x.createdAt, glyph: 'alert-circle-outline', tone: 'warn', title: x.title, state: '核验发现问题', stateTone: 'warn', open: () => go.task(x.id) })
    else if (!done) rows.push({ key: 'l' + x.id, rank: 3, at: x.createdAt, spin: true, title: x.title, state: (x.currentStep || x.statusLabel) + ' · ' + elapsedOf(x), open: () => go.task(x.id) })
    else if (done && when >= dayStart) rows.push({ key: 'd' + x.id, rank: 4, at: x.finishedAt || x.createdAt, glyph: 'checkmark-circle-outline', tone: 'success', title: x.title, state: x.routineId && !isReport(x) ? (x.quiet ? '没有变化' : '有变化') : (x.deliverables.length ? '已交付' : '已回答'), open: () => go.task(x.id) })
  }
  rows.sort((a, b) => a.rank - b.rank || ms(b.at) - ms(a.at))
  const unrated = (deliverables || []).filter((d) => d.rating === null || d.rating === undefined).length
  return { rows: rows.slice(0, 10), more: Math.max(0, rows.length - 10), unrated }
}

export default function Home() {
  const nav = useNav()
  const { api } = useConn()
  const { data, thread, refresh, setThread } = useStore()
  const insets = useSafeAreaInsets()
  const { height: winH } = useWindowDimensions()

  // ---- 等你看 ----
  const [open, setOpen] = useState(false)
  const [acting, setActing] = useState('')
  const goTask = useCallback((id: string) => { setOpen(false); nav.push({ name: 'task', id }) }, [nav])
  const goRoutine = useCallback((id: string) => { setOpen(false); nav.push({ name: 'routine', id }) }, [nav])
  const ack = useCallback(async (r: Reminder) => {
    if (!api) return
    const k = 'r' + r.routineId + r.at
    setActing(k)
    try { await api.routineAck(r.routineId, r.at); await refresh() } catch { /* the row stays; the next poll tells the truth */ } finally { setActing('') }
  }, [api, refresh])
  const rerun = useCallback(async (id: string) => {
    if (!api) return
    setActing('f' + id)
    try { const d = await api.rerun(id); await refresh(); setOpen(false); nav.push({ name: 'task', id: d.task ? d.task.id : id }) } catch { /* nothing to show; the row stays */ } finally { setActing('') }
  }, [api, refresh, nav])
  const { rows, more, unrated } = useMemo(
    () => (data ? todayRows(data.items, data.deliverables, data.reminders, { task: goTask, ack, rerun }) : { rows: [] as TodayRow[], more: 0, unrated: 0 }),
    [data, goTask, ack, rerun],
  )
  const running = rows.filter((r) => r.rank === 3).length
  const waiting = rows.length - running
  const hasBar = rows.length > 0 || unrated > 0
  const barLabel = [waiting ? `等你看 ${waiting}` : '', running ? `${running} 个在跑` : '', !waiting && !running && unrated ? `${unrated} 份还没评价` : ''].filter(Boolean).join(' · ')
  useEffect(() => { if (open && !hasBar) setOpen(false) }, [open, hasBar])
  const routines = useMemo(() => (data ? data.routines : []).filter((r) => r.enabled || !r.once).sort(byNext), [data])

  // ---- the flow ----
  const live = !!(data && data.items.some((x) => x.status !== 'done')) || !!(thread && thread.status !== 'done')
  const entries = useMemo(() => (thread && Array.isArray(thread.activity) ? thread.activity : NONE), [thread])
  const flow = useMemo<FlowItem[]>(() => {
    const out: FlowItem[] = []
    entries.forEach((e, i) => { if (e.kind === 'user' || e.kind === 'text' || e.kind === 'handoff') out.push({ key: 'e' + i, at: ms(e.at), kind: 'entry', entry: e }) })
    for (const t of data ? data.items : []) {
      if (t.status !== 'done' || t.scenario === 'assistant') continue
      if (failedToday(t)) { out.push({ key: 'f' + t.id, at: ms(t.finishedAt || t.createdAt), kind: 'fail', task: t }); continue }
      if (t.quiet || !isToday(t.finishedAt) || !t.deliverables.length) continue
      out.push({ key: 'c' + t.id, at: ms(t.finishedAt), kind: 'card', task: t })
    }
    for (const r of data ? data.reminders : []) out.push({ key: 'r' + r.routineId + r.at, at: ms(r.at), kind: 'remind', reminder: r })
    out.sort((a, b) => a.at - b.at)
    return out
  }, [entries, data])
  /** A hand-off row updates in place: the step and the time while it runs, the outcome once it is done. */
  const handoffState = (id: string) => {
    const t = data ? data.items.find((x) => x.id === id) : undefined
    if (!t) return ''
    if (t.status !== 'done') return (t.currentStep || t.statusLabel) + ' · ' + elapsedOf(t)
    return t.error ? (/已取消/.test(t.error) ? '已取消' : '失败') : t.deliverables.length ? '已交付' : '已回答'
  }

  // ---- composer ----
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState('')
  useEffect(() => { if (pending && entries.some((e) => e.kind === 'user' && e.text === pending)) setPending('') }, [pending, entries])
  const send = async () => {
    const body = text.trim()
    if (!body || busy || !api) return
    setBusy(true); setPending(body); setText('')
    try { const d = await api.todaySay(body); if (d.thread) setThread(d.thread); await refresh() } catch { setPending(''); setText(body) } finally { setBusy(false) }
  }

  const scroller = useRef<ScrollView>(null)
  const threadLive = !!(thread && thread.status !== 'done') || !!pending
  const empty = !flow.length && !pending && !threadLive
  const hour = new Date().getHours()
  const greet = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TopBar
          left={<Pressable onPress={() => nav.push({ name: 'settings' })} accessibilityRole="button" accessibilityLabel="设置" hitSlop={6} style={({ pressed }) => [styles.markBtn, pressed && { backgroundColor: color.surface }]}><Mark live={live} /></Pressable>}
          title="MyWork"
          onTitle={() => nav.push({ name: 'mywork' })}
          right={<IconBtn name="add-outline" label="新任务" size={26} onPress={() => nav.push({ name: 'new' })} />}
        />
        {hasBar ? (
          <Pressable onPress={() => setOpen(true)} accessibilityRole="button" style={({ pressed }) => [styles.bar, pressed && { backgroundColor: color.surface2 }]}>
            <Text style={styles.barText} numberOfLines={1}>{barLabel}</Text>
            <Ionicons name="chevron-forward-outline" size={16} color={color.meta} />
          </Pressable>
        ) : null}

        <ScrollView ref={scroller} style={{ flex: 1 }} contentContainerStyle={[styles.flow, empty && styles.flowEmpty]} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" onContentSizeChange={() => { if (!empty) scroller.current?.scrollToEnd({ animated: true }) }}>
          {empty ? (
            <Greet>{greet}</Greet>
          ) : (
            <>
              {flow.map((it) => {
                if (it.kind === 'card') {
                  const t = it.task
                  const v = t.verification
                  const when = fmtTime(t.finishedAt)
                  return <DeliverableCard key={it.key} title={t.title} meta={v && v.passed ? `已核验 · ${when}` : when} warn={v && v.passed === false ? `核验有问题 · ${when}` : undefined} icon={isReport(t) ? 'newspaper-outline' : 'document-text-outline'} onPress={() => nav.push({ name: 'task', id: t.id })} />
                }
                if (it.kind === 'fail') {
                  const t = it.task
                  return <ActionCard key={it.key} glyph="close-circle-outline" tone={color.danger} title={t.title} sub={t.error} label="再来一次" busy={acting === it.key} onPress={() => nav.push({ name: 'task', id: t.id })} onAction={() => { rerun(t.id).catch(() => {}) }} />
                }
                if (it.kind === 'remind') {
                  const r = it.reminder
                  return <ActionCard key={it.key} glyph="notifications-outline" tone={color.fg2} title={r.title} sub={'提醒 · ' + fmtTime(r.at)} label="知道了" busy={acting === it.key} onPress={() => nav.push({ name: 'routine', id: r.routineId })} onAction={() => { ack(r).catch(() => {}) }} />
                }
                const e = it.entry
                if (e.kind === 'user') return <Bubble key={it.key} text={e.text} />
                if (e.kind === 'text') return <Reply key={it.key} markdown={e.text} />
                if (e.kind === 'handoff') {
                  const isTask = e.target === 'task'
                  const state = isTask ? handoffState(e.id) : ''
                  const label = isTask ? `已交给后台：${e.title}${state ? ' · ' + state : ''}` : `已安排：${e.title}${e.schedule ? ' · ' + e.schedule : ''}`
                  return <HandoffChip key={it.key} label={label} onPress={() => (isTask ? nav.push({ name: 'task', id: e.id }) : nav.push({ name: 'routine', id: e.id }))} />
                }
                return null
              })}
              {pending ? <Bubble text={pending} /> : null}
              {threadLive ? <Thinking text={thread && thread.status !== 'done' && thread.currentStep ? thread.currentStep : '在想'} /> : null}
            </>
          )}
        </ScrollView>

        <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
          <Composer value={text} onChange={setText} onSend={send} placeholder="今天要做什么" busy={busy} disabled={!api} />
        </View>
      </KeyboardAvoidingView>

      <Sheet open={open} onClose={() => setOpen(false)} title="等你看">
        <ScrollView style={{ maxHeight: Math.round(winH * 0.62) }} bounces={false}>
          <ListBox>
            {rows.map((r) => {
              const row = <Row glyph={r.glyph} tone={r.tone} spin={r.spin} title={r.title} sub={r.sub} state={r.action ? undefined : r.state} stateTone={r.stateTone} onPress={r.open} chevron={!!r.open && !r.action} />
              if (!r.action) return <View key={r.key}>{row}</View>
              const a = r.action
              return (
                <View key={r.key} style={styles.actionRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>{row}</View>
                  <Btn label={a.label} onPress={() => { a.run().catch(() => {}) }} disabled={acting === r.key} style={{ marginRight: 10 }} />
                </View>
              )
            })}
            {more || unrated ? (
              <Row key="more" glyph="list-outline" title={[more ? `还有 ${more} 项` : '', unrated ? `${unrated} 份还没评价` : ''].filter(Boolean).join(' · ')} chevron onPress={() => { setOpen(false); nav.push({ name: 'tasks', filter: unrated ? 'delivered' : 'all' }) }} />
            ) : null}
          </ListBox>
          {routines.length ? (
            <>
              <Section label="例行" />
              <ListBox style={{ marginBottom: space.sm }}>
                {routines.slice(0, 3).map((r) => (
                  <Row key={r.id} glyph={r.kind === 'remind' ? 'notifications-outline' : 'time-outline'} tone={r.enabled ? 'live' : 'meta'} title={r.title} sub={r.scheduleLabel} state={whenOf(r)} onPress={() => (r.lastTaskId ? goTask(r.lastTaskId) : goRoutine(r.id))} />
                ))}
                {routines.length > 3 ? <Row key="more-routines" glyph="list-outline" title="更多" chevron onPress={() => { setOpen(false); nav.push({ name: 'mywork' }) }} /> : null}
              </ListBox>
            </>
          ) : null}
        </ScrollView>
      </Sheet>
    </Screen>
  )
}

/** A reminder or a failure in the flow: a card that opens its page, with the one button the rule allows. */
function ActionCard({ glyph, tone, title, sub, label, busy, onPress, onAction }: { glyph: IconName; tone: string; title: string; sub?: string; label: string; busy: boolean; onPress: () => void; onAction: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { backgroundColor: color.surface }]}>
      <Ionicons name={glyph} size={20} color={tone} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
        {sub ? <Text style={styles.cardSub} numberOfLines={2}>{sub}</Text> : null}
      </View>
      <Btn label={label} onPress={onAction} disabled={busy} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  markBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  bar: { height: 44, marginHorizontal: space.lg, marginBottom: space.xs, paddingLeft: 14, paddingRight: 10, borderRadius: radius.lg, backgroundColor: color.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  barText: { fontSize: size.ui, fontWeight: '500', color: color.fg2, flexShrink: 1, fontVariant: ['tabular-nums'] },
  flow: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg, gap: space.md },
  flowEmpty: { flexGrow: 1, justifyContent: 'center', paddingBottom: 96 },
  dock: { paddingHorizontal: space.md, paddingTop: space.sm, backgroundColor: color.bg },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingLeft: 14, paddingRight: 10, borderWidth: 1, borderColor: color.border, borderRadius: radius.lg, backgroundColor: color.bg },
  cardTitle: { fontSize: size.ui, lineHeight: 22, fontWeight: '500', color: color.fg },
  cardSub: { fontSize: size.meta, lineHeight: 18, color: color.muted, marginTop: 2 },
})
