/**
 * S4 · MyWork 页 — the member's profile: mark, name, one line of counts, its routines, a door to the task list.
 * Rows carry no actions; a routine is managed on its own page. Same logic as the web RoutinesPage, single column.
 */
import { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { fmtDate, fmtTime, isToday, type Routine } from '../api'
import { useNav, useStore } from '../store'
import { Empty, IconBtn, ListBox, Mark, Meta, Row, Screen, Section, Title, TopBar } from '../components'
import { space } from '../theme'

/** A one-off that already fired (or was switched off) is history, not a standing thing. */
const isEnded = (r: Routine) => !!r.once && (!r.enabled || !r.nextRunAt)
const byNext = (a: Routine, b: Routine) => (a.enabled === b.enabled ? 0 : a.enabled ? -1 : 1) || (+new Date(a.nextRunAt || 0) - +new Date(b.nextRunAt || 0))
const when = (r: Routine) => !r.enabled ? '已暂停' : r.nextRunAt ? '下次 ' + (isToday(r.nextRunAt) ? '今天 ' + fmtTime(r.nextRunAt) : fmtDate(r.nextRunAt)) : ''

export default function MyWork() {
  const nav = useNav()
  const { data } = useStore()
  const [showEnded, setShowEnded] = useState(false)

  const routines = data ? data.routines : []
  const ended = routines.filter(isEnded)
  const live = routines.filter((r) => !isEnded(r)).sort(byNext)
  // The assistant thread is the home screen, not a task. Same set the task list shows (routine runs included, as on the web).
  const tasks = (data ? data.items : []).filter((x) => x.scenario !== 'assistant')

  const routineRow = (r: Routine, state: string) => (
    <Row
      key={r.id}
      glyph={r.kind === 'remind' ? 'notifications-outline' : 'time-outline'}
      tone={r.enabled ? 'live' : 'meta'}
      title={r.title}
      sub={r.scheduleLabel}
      state={state}
      onPress={() => nav.push({ name: 'routine', id: r.id })}
    />
  )

  return (
    <Screen>
      <TopBar left={<IconBtn name="chevron-back-outline" onPress={nav.pop} label="返回" />} />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.head}>
          <Mark dim={40} />
          <Title>MyWork</Title>
          <Meta>{`通用助理 · ${live.length} 个例行 · ${tasks.length} 个任务`}</Meta>
        </View>

        <Section label="例行" />
        {live.length || ended.length ? (
          <ListBox>
            {live.map((r) => routineRow(r, when(r)))}
            {ended.length ? (
              <Row
                key="ended"
                glyph={showEnded ? 'chevron-down-outline' : 'chevron-forward-outline'}
                title={`已结束的 ${ended.length} 项`}
                onPress={() => setShowEnded(!showEnded)}
              />
            ) : null}
            {showEnded ? ended.map((r) => routineRow(r, '已结束')) : null}
          </ListBox>
        ) : (
          <Empty text={data ? '还没有例行的事。' : '…'} />
        )}

        <Section label="任务" />
        <ListBox>
          <Row glyph="list-outline" title={`全部任务 · ${tasks.length}`} chevron onPress={() => nav.push({ name: 'tasks' })} />
        </ListBox>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: space.lg, paddingBottom: 48 },
  head: { alignItems: 'center', paddingTop: space.xl, gap: space.md },
})
