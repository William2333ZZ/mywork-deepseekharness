/**
 * S5 · 例行条目页 — what it is, when it runs, the three things you can do to it, and its runs.
 * The only screen in the app with three buttons in a row. Same logic as the web RoutineDetail.
 */
import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native'
import { fmtDate, type Routine, type Task } from '../api'
import { useConn, useNav, useStore } from '../store'
import { Btn, Empty, IconBtn, ListBox, Meta, Row, Screen, Section, Sheet, SheetItem, Title, TopBar } from '../components'
import { color, space } from '../theme'

type Run = NonNullable<Routine['runs']>[number]

/** The newest run that produced a task. Runs come newest first from the server. */
const newestTask = (r: Routine) => { const hit = (r.runs || []).find((x) => x.taskId); return (hit && hit.taskId) || r.lastTaskId || '' }
/** The web's runState: a reminder that fired, a failure, then what a task run found. */
const runState = (x: Run) => x.fired ? '提醒' : x.error ? '失败' : x.changed === false ? '没有变化' : x.changed === true ? '有变化' : '已交付'

export default function RoutinePage({ id }: { id: string }) {
  const nav = useNav()
  const { api } = useConn()
  const store = useStore()
  const [full, setFull] = useState<Routine | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)

  // The list payload has the routine without its runs; the routines endpoint has them. Reload whenever the store ticks.
  const base = store.data ? store.data.routines.find((x) => x.id === id) || null : null
  useEffect(() => {
    if (!api) return
    let on = true
    api.routines().then((d) => { if (on) setFull(d.items.find((x) => x.id === id) || null) }).catch(() => {})
    return () => { on = false }
  }, [api, id, store.data])
  const detail = full && full.id === id ? full : null
  const r: Routine | null = base ? { ...base, runs: detail ? detail.runs : base.runs } : detail

  const back = <IconBtn name="chevron-back-outline" onPress={nav.pop} label="返回" />
  if (!r) {
    return (
      <Screen>
        <TopBar left={back} />
        <View style={styles.page}>{store.data ? <Empty text="找不到这条例行。" /> : <ActivityIndicator color={color.fg2} style={{ marginTop: space.xxl }} />}</View>
      </Screen>
    )
  }

  const once = !!r.once
  // A one-off's schedule already is its next run; do not say it twice.
  const meta = [
    r.kind === 'remind' ? '提醒' : '例行',
    r.scheduleLabel,
    !r.enabled ? (once ? '已结束' : '已暂停') : r.nextRunAt && !once ? '下次 ' + fmtDate(r.nextRunAt) : '',
  ].filter(Boolean).join(' · ')
  const runs = (r.runs || []).slice(0, 20)

  const run = async () => {
    if (!api || busy) return
    setBusy(true)
    const before = newestTask(r)
    try {
      const d = (await api.routineRun(r.id)) as { routine: Routine; task?: Task }
      await store.refresh()
      let next = (d.task && d.task.id) || newestTask(d.routine)
      if (!next || next === before) { const fresh = await api.routines(); const mine = fresh.items.find((x) => x.id === r.id); next = mine ? newestTask(mine) : '' }
      if (next && next !== before) nav.push({ name: 'task', id: next })
    } catch { /* the runs list says what happened */ } finally { setBusy(false) }
  }
  const toggle = async () => {
    if (!api || busy) return
    setBusy(true)
    try { await api.routineEnable(r.id, !r.enabled); await store.refresh() } catch { /* state stays as shown */ } finally { setBusy(false) }
  }
  const remove = async () => {
    if (!api || busy) return
    setBusy(true)
    try { await api.routineRemove(r.id); setConfirm(false); nav.pop(); store.refresh() } catch { setBusy(false) }
  }

  return (
    <Screen>
      <TopBar left={back} />
      <ScrollView contentContainerStyle={styles.page}>
        <Title>{r.title}</Title>
        <Meta style={styles.meta}>{meta}</Meta>

        <View style={styles.actions}>
          <Btn label="现在跑一次" icon="play-outline" onPress={run} disabled={busy} style={styles.filled} />
          {!once || r.enabled ? <Btn label={r.enabled ? '暂停' : '恢复'} icon={r.enabled ? 'pause-outline' : 'play-outline'} onPress={toggle} disabled={busy} /> : null}
          <Btn label="删除" icon="trash-outline" onPress={() => setConfirm(true)} disabled={busy} />
        </View>

        <Section label="运行记录" />
        {runs.length ? (
          <ListBox>
            {runs.map((x, i) => {
              const taskId = x.taskId
              return (
                <Row
                  key={x.at + i}
                  glyph={x.error ? 'close-circle-outline' : x.fired || r.kind === 'remind' ? 'notifications-outline' : 'checkmark-circle-outline'}
                  tone={x.error ? 'danger' : 'success'}
                  title={fmtDate(x.at)}
                  state={runState(x)}
                  stateTone={x.error ? 'danger' : undefined}
                  onPress={taskId ? () => nav.push({ name: 'task', id: taskId }) : undefined}
                />
              )
            })}
          </ListBox>
        ) : <Empty text={detail || !api ? '还没跑过' : '…'} />}
      </ScrollView>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="删掉这条例行？">
        <SheetItem icon="trash-outline" label="删除" danger onPress={remove} />
        <SheetItem icon="close-outline" label="取消" onPress={() => setConfirm(false)} />
      </Sheet>
    </Screen>
  )
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: 48 },
  meta: { marginTop: 6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xl },
  filled: { backgroundColor: color.surface, paddingHorizontal: 14 },
})
