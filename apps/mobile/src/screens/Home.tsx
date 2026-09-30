/**
 * Home = the column (TEAMMATES.md §8.2 / §8.5): one list of conversations. Search · 「+」 · settings on top; 今日 pinned
 * first (the Mark as its glyph, the assistant's last line or 「2 个在跑 · 1 份等你看」 as its second line); then every
 * routine and every task the user handed off, merged by last activity, no day headers, 80 rows at most. While the search
 * is non-empty the list becomes the results (tasks · routines · deliverables, one row shape, told apart by glyph).
 * Rows carry no actions: opening the row is the only thing it does. 交付物 is one plain row under the list.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fmtWhen, type Routine, type SearchResult, type Task } from '../api'
import { useConn, useNav, useStore, type ThreadKind } from '../store'
import { Field, IconBtn, Mark, Screen, ThreadRow, type IconName, type Tone } from '../components'
import { color, size, space } from '../theme'
import { isMine, time, todayCounts } from '../thread'

const MAX_ROWS = 80
const SEARCH_DEBOUNCE_MS = 250

type RowKind = 'today' | 'task' | 'routine' | 'deliverable'
type Row = { key: string; kind: RowKind; id: string; title: string; preview: string; lastAt: string; unread: boolean; status?: string; failed?: boolean; taskId?: string }

const byLastAt = (a: Row, b: Row) => time(b.lastAt) - time(a.lastAt)
/** Server fields (preview / lastAt / unread) with fallbacks, so the column also reads an older payload. */
const taskRow = (t: Task): Row => ({ key: 'task:' + t.id, kind: 'task', id: t.id, title: t.title, preview: t.preview || t.currentStep || t.statusLabel || '', lastAt: t.lastAt || t.finishedAt || t.createdAt, unread: t.unread === true, status: t.status, failed: !!t.error })
const routineRow = (r: Routine): Row => ({ key: 'routine:' + r.id, kind: 'routine', id: r.id, title: r.title, preview: r.preview || r.scheduleLabel || '', lastAt: r.lastAt || r.nextRunAt || '', unread: r.unread === true })
const searchRows = (d: SearchResult): Row[] => [
  ...(d.tasks || []).map(taskRow),
  ...(d.routines || []).map(routineRow),
  ...(d.deliverables || []).map((x): Row => ({ key: 'deliverable:' + x.id, kind: 'deliverable', id: x.id, title: x.title, preview: x.kind === 'report' ? '报告' : '交付物', lastAt: x.createdAt, unread: false, taskId: x.taskId })),
]

/** The task glyph is its state: spinner while it runs, a clock while it queues, ✓ or ✕ once it is done. */
function glyphOf(row: Row): { glyph?: IconName; tone: Tone; spin?: boolean } {
  if (row.kind === 'routine') return { glyph: 'repeat-outline', tone: 'meta' }
  if (row.kind === 'deliverable') return { glyph: 'document-text-outline', tone: 'meta' }
  if (row.status === 'queued') return { glyph: 'time-outline', tone: 'meta' }
  if (row.status === 'waiting') return { glyph: 'chatbubble-ellipses-outline', tone: 'warn' }
  if (row.status && row.status !== 'done') return { spin: true, tone: 'live' }
  return row.failed ? { glyph: 'close-circle-outline', tone: 'danger' } : { glyph: 'checkmark-circle-outline', tone: 'success' }
}

export default function Home() {
  const nav = useNav()
  const { api } = useConn()
  const { data, thread, loading, error, refresh } = useStore()
  const insets = useSafeAreaInsets()

  // The column mounts again when a thread pops: refresh once so the row you just read drops its dot without waiting
  // for the next poll. On the very first mount the store's own first poll is still in flight (no data yet), so skip it.
  useEffect(() => { if (data) refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const items = data ? data.items : []
  const live = items.some((x) => x.status !== 'done') || !!(thread && thread.status !== 'done')
  const mine = useMemo(() => items.filter(isMine), [items])

  const today = useMemo((): Row => {
    // The assistant's thread as the /tasks payload sees it (preview / lastAt / unread); the polled /today copy stands in when it is missing.
    const assistant = items.filter((x) => x.scenario === 'assistant').map(taskRow).sort(byLastAt)[0] || (thread ? taskRow(thread) : undefined)
    const counts = todayCounts(items, data ? data.reminders : [])
    return { key: 'today', kind: 'today', id: '', title: '今日', preview: counts || (assistant ? assistant.preview : ''), lastAt: assistant ? assistant.lastAt : '', unread: !!assistant && assistant.unread }
  }, [items, thread, data])
  const merged = useMemo(() => [...mine.map(taskRow), ...(data ? data.routines : []).map(routineRow)].sort(byLastAt), [mine, data])

  // Search: local title / preview matches first, then what the server finds in deliverables and content, 250ms later.
  const [query, setQuery] = useState('')
  const [remote, setRemote] = useState<Row[]>([])
  const seq = useRef(0)
  const needle = query.trim()
  useEffect(() => {
    const my = ++seq.current
    if (!needle || !api) { setRemote([]); return }
    const t = setTimeout(() => { api.search(needle).then((d) => { if (my === seq.current) setRemote(searchRows(d)) }).catch(() => { if (my === seq.current) setRemote([]) }) }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [needle, api])
  const results = useMemo((): Row[] => {
    if (!needle) return []
    const q = needle.toLowerCase()
    const local = merged.filter((r) => r.title.toLowerCase().includes(q) || r.preview.toLowerCase().includes(q))
    const keys = new Set(local.map((r) => r.key))
    return [...local, ...remote.filter((r) => !keys.has(r.key))]
  }, [needle, merged, remote])
  const rows = needle ? results : [today, ...merged.slice(0, MAX_ROWS)]

  const open = useCallback((kind: ThreadKind, id?: string) => nav.push({ name: 'thread', kind, id }), [nav])
  const openRow = (row: Row) => {
    if (row.kind === 'today') open('today')
    else if (row.kind === 'deliverable') { if (row.taskId) open('task', row.taskId); else nav.push({ name: 'deliverables' }) }
    else open(row.kind, row.id)
  }

  return (
    <Screen>
      <View style={styles.head}>
        <Field value={query} onChange={setQuery} placeholder="搜索" icon="search-outline" clearable style={{ flex: 1 }} />
        <IconBtn name="add-outline" label="新线程" size={26} onPress={() => open('new')} />
        <IconBtn name="settings-outline" label="设置" size={21} onPress={() => nav.push({ name: 'settings' })} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={loading && !data} onRefresh={refresh} tintColor={color.meta} />}
        renderItem={({ item: row }) => {
          const g: { glyph?: IconName | React.ReactNode; tone: Tone; spin?: boolean } = row.kind === 'today' ? { glyph: <Mark dim={20} live={live} />, tone: 'meta' } : glyphOf(row)
          return <ThreadRow glyph={g.glyph} tone={g.tone} spin={g.spin} title={row.title} time={fmtWhen(row.lastAt)} unread={row.unread} preview={row.preview} onPress={() => openRow(row)} />
        }}
        ListEmptyComponent={<Text style={styles.empty}>{needle ? '没有匹配的' : error && !data ? error : data ? '' : '…'}</Text>}
      />
      <View style={[styles.foot, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
        <ThreadRow glyph="documents-outline" title="交付物" onPress={() => nav.push({ name: 'deliverables' })} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: space.lg, paddingRight: 6, paddingTop: space.sm, paddingBottom: space.xs },
  list: { paddingHorizontal: 6, paddingTop: space.xs, paddingBottom: space.sm },
  empty: { fontSize: size.meta, lineHeight: 18, color: color.muted, paddingHorizontal: 10, paddingVertical: 12 },
  foot: { paddingHorizontal: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: color.borderSoft },
})
