/**
 * 交付物 — the finding page behind the column's last row: every deliverable, newest first, one row shape. A row opens
 * the task thread it belongs to (the thread is where the document lives); rows carry no actions.
 */
import { useEffect, useMemo, useState } from 'react'
import { FlatList, StyleSheet, Text } from 'react-native'
import { fmtWhen, type Deliverable } from '../api'
import { useConn, useNav, useStore } from '../store'
import { Field, IconBtn, Screen, ThreadRow, TopBar } from '../components'
import { color, size, space } from '../theme'
import { time } from '../thread'

const verdict = (d: Deliverable) => (d.verification ? (d.verification.passed === true ? '已核验' : d.verification.passed === false ? '核验发现问题' : '未能核验') : '')
const previewOf = (d: Deliverable) => [d.kind === 'report' ? '报告' : '', verdict(d), d.rating === 1 ? '有用' : d.rating === -1 ? '没用' : ''].filter(Boolean).join(' · ')

export default function Deliverables() {
  const nav = useNav()
  const { api } = useConn()
  const { data } = useStore()
  const [items, setItems] = useState<Deliverable[] | null>(null)
  const [q, setQ] = useState('')
  // The whole list from /deliverables; the column payload's recent sixty stand in until it arrives.
  useEffect(() => {
    if (!api) return
    let on = true
    api.deliverables().then((d) => { if (on) setItems(d.items || []) }).catch(() => {})
    return () => { on = false }
  }, [api, data])
  const list = useMemo(() => {
    const all = (items || (data ? data.deliverables : [])).slice().sort((a, b) => time(b.createdAt) - time(a.createdAt))
    const needle = q.trim().toLowerCase()
    return needle ? all.filter((d) => d.title.toLowerCase().includes(needle)) : all
  }, [items, data, q])

  return (
    <Screen>
      <TopBar left={<IconBtn name="chevron-back-outline" label="返回" onPress={nav.pop} />} title="交付物" />
      <Field value={q} onChange={setQ} placeholder="搜索" icon="search-outline" clearable style={styles.search} />
      <FlatList
        data={list}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item: d }) => (
          <ThreadRow glyph="document-text-outline" tone={d.verification && d.verification.passed === true ? 'success' : 'meta'} title={d.title} time={fmtWhen(d.createdAt)} preview={previewOf(d)} onPress={() => { if (d.taskId) nav.push({ name: 'thread', kind: 'task', id: d.taskId }) }} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>{items || data ? (q.trim() ? '没有匹配的' : '还没有交付物。') : '…'}</Text>}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  search: { marginHorizontal: space.lg, marginTop: space.xs, marginBottom: space.sm },
  list: { paddingHorizontal: 6, paddingBottom: space.xl },
  empty: { fontSize: size.meta, lineHeight: 18, color: color.muted, paddingHorizontal: 10, paddingVertical: 12 },
})
