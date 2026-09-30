/**
 * 文件 (TEAMMATES.md §9.1): every file the teammates handed over, newest first. Search · one chip per teammate · rows;
 * a row opens the file. Rows carry no actions. `mateId` starts with that teammate's chip selected.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import { fmtWhen, type Deliverable } from '../api'
import { useConn, useNav, useStore } from '../store'
import { Field, IconBtn, Screen, ThreadRow, TopBar } from '../components'
import { color, radius, size, space } from '../theme'
import { orderMates, time } from '../thread'

const SEARCH_DEBOUNCE_MS = 250
const verdict = (d: Deliverable) => (d.verification ? (d.verification.passed === true ? '已核验' : d.verification.passed === false ? '核验发现问题' : '未能核验') : '')

export default function Files({ mateId }: { mateId?: string }) {
  const nav = useNav()
  const { api } = useConn()
  const { mates, tick } = useStore()
  const [mate, setMate] = useState(mateId || '')
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Deliverable[] | null>(null)
  const seq = useRef(0)
  const needle = q.trim()
  useEffect(() => {
    if (!api) return
    const my = ++seq.current
    const t = setTimeout(() => {
      api.files({ mate: mate || undefined, q: needle || undefined }).then((d) => { if (my === seq.current) setItems(d.items || []) }).catch(() => { if (my === seq.current) setItems((x) => x || []) })
    }, needle ? SEARCH_DEBOUNCE_MS : 0)
    return () => clearTimeout(t)
  }, [api, mate, needle, tick])
  const list = useMemo(() => (items || []).slice().sort((a, b) => time(b.createdAt) - time(a.createdAt)), [items])
  const ordered = useMemo(() => orderMates(mates || []), [mates])
  const nameOf = (id?: string) => (id ? ordered.find((m) => m.id === id)?.name || '' : '')

  return (
    <Screen>
      <TopBar left={<IconBtn name="chevron-back-outline" label="返回" onPress={nav.pop} />} title="文件" />
      <Field value={q} onChange={setQ} placeholder="搜索" icon="search-outline" clearable style={styles.search} />
      {ordered.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsBar} contentContainerStyle={styles.chips}>
          <Chip label="全部" on={!mate} onPress={() => setMate('')} />
          {ordered.map((m) => <Chip key={m.id} label={m.name} on={mate === m.id} onPress={() => setMate(mate === m.id ? '' : m.id)} />)}
        </ScrollView>
      ) : null}
      <FlatList
        data={list}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item: d }) => (
          <ThreadRow glyph={d.kind === 'report' ? 'newspaper-outline' : 'document-text-outline'} tone={d.verification && d.verification.passed === true ? 'success' : 'meta'} title={d.title} time={fmtWhen(d.createdAt)} preview={[mate ? '' : nameOf(d.mateId), verdict(d)].filter(Boolean).join(' · ')} onPress={() => nav.push({ name: 'file', id: d.id })} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>{items ? (needle ? '没有匹配的' : '还没有文件') : '…'}</Text>}
      />
    </Screen>
  )
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && { opacity: 0.7 }]}>
      <Text style={[styles.chipText, on && { color: color.bg }]} numberOfLines={1}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  search: { marginHorizontal: space.lg, marginTop: space.xs, marginBottom: space.sm },
  chipsBar: { flexGrow: 0 },
  chips: { paddingHorizontal: space.lg, gap: space.sm, paddingBottom: space.sm },
  chip: { height: 30, paddingHorizontal: 12, borderRadius: radius.xl, borderWidth: 1, borderColor: color.border, justifyContent: 'center', maxWidth: 160 },
  chipOn: { backgroundColor: color.fg, borderColor: color.fg },
  chipText: { fontSize: size.meta, color: color.fg2 },
  list: { paddingHorizontal: 6, paddingBottom: space.xl },
  empty: { fontSize: size.meta, lineHeight: 18, color: color.muted, paddingHorizontal: 10, paddingVertical: 12 },
})
