/**
 * S6 · 任务列表 — search, three pills, rows grouped by day. Rows carry no actions; a task is managed on its page.
 * Same filter and state logic as the web TasksPage (routine runs included); the assistant thread is the home screen, not a task.
 */
import { useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native'
import { fmtTime, isToday, type Task } from '../api'
import { useNav, useStore } from '../store'
import { Btn, Empty, Field, IconBtn, ListBox, Row, Screen, Section, TopBar } from '../components'
import { color, space } from '../theme'

type Filter = 'all' | 'active' | 'delivered'
const FILTERS: [Filter, string][] = [['all', '全部'], ['active', '进行中'], ['delivered', '交付物']]
const DAYS = ['今天', '昨天', '更早']

const whenOf = (x: Task) => x.finishedAt || x.createdAt
const isYesterday = (iso: string) => { const d = new Date(iso); const y = new Date(); y.setDate(y.getDate() - 1); return d.getFullYear() === y.getFullYear() && d.getMonth() === y.getMonth() && d.getDate() === y.getDate() }
const dayOf = (iso: string) => (isToday(iso) ? 0 : isYesterday(iso) ? 1 : 2)
const fmtDay = (iso: string) => { const d = new Date(iso); return `${d.getMonth() + 1}月${d.getDate()}日` }
const stateOf = (x: Task) => x.status !== 'done'
  ? (x.currentStep || x.statusLabel)
  : x.error ? '失败'
  : x.verification && x.verification.passed === false ? '核验发现问题'
  : x.deliverables.length ? (x.verification && x.verification.passed ? '已核验' : '已交付')
  : '已回答'

export default function Tasks({ filter }: { filter?: Filter }) {
  const nav = useNav()
  const { data, error } = useStore()
  const [f, setF] = useState<Filter>(filter || 'all')
  const [q, setQ] = useState('')

  const needle = q.trim().toLowerCase()
  const hit = (x: Task) => !needle
    || x.title.toLowerCase().includes(needle)
    || (x.input || '').toLowerCase().includes(needle)
    || x.deliverables.some((d) => d.title.toLowerCase().includes(needle))
  const keep = (x: Task) => f === 'all' || (f === 'active' ? x.status !== 'done' : x.deliverables.length > 0)
  const items = (data ? data.items : [])
    .filter((x) => x.scenario !== 'assistant' && keep(x) && hit(x))
    .sort((a, b) => +new Date(whenOf(b)) - +new Date(whenOf(a)))
  const groups: Task[][] = [[], [], []]
  for (const x of items) groups[dayOf(whenOf(x))].push(x)

  const row = (x: Task, day: number) => {
    const live = x.status !== 'done'
    const at = whenOf(x)
    return (
      <Row
        key={x.id}
        spin={live}
        glyph={live ? undefined : x.error ? 'close-circle-outline' : 'checkmark-circle-outline'}
        tone={x.error ? 'danger' : 'success'}
        title={x.title}
        state={`${stateOf(x)} · ${day === 2 ? fmtDay(at) : fmtTime(at)}`}
        onPress={() => nav.push({ name: 'task', id: x.id })}
      />
    )
  }

  return (
    <Screen>
      <TopBar left={<IconBtn name="chevron-back-outline" onPress={nav.pop} label="返回" />} title="任务" />
      <View style={styles.filters}>
        <Field value={q} onChange={setQ} placeholder="搜索" icon="search-outline" />
        <View style={styles.pills}>
          {FILTERS.map(([k, label]) => <Btn key={k} label={label} kind="ghost" onPress={() => setF(k)} style={f === k ? styles.on : undefined} />)}
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        {!data && !error ? <ActivityIndicator color={color.fg2} style={{ marginTop: space.xxl }} />
          : items.length ? groups.map((g, i) => g.length ? (
            <View key={DAYS[i]}>
              <Section label={DAYS[i]} />
              <ListBox>{g.map((x) => row(x, i))}</ListBox>
            </View>
          ) : null)
          : <Empty text={error || (needle ? '没有匹配的' : '还没有任务。')} />}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  filters: { paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.md },
  pills: { flexDirection: 'row', gap: space.sm },
  on: { backgroundColor: color.surface, paddingHorizontal: 14 },
  page: { paddingHorizontal: space.lg, paddingBottom: 48 },
})
