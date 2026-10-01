/**
 * Home = the teammates list (TEAMMATES.md §9.4 / §9.6). Top: search · the bell (count = 需要你 + 在干活, opens the
 * activity screen) · 「+」 new teammate. Middle: only teammates, one ordering rule — pinned first (MyWork by default),
 * then the latest conversation; working or waiting never reorders. Bottom: 文件; the mark on the left opens 设置.
 * While the search is non-empty the list becomes the results: teammates, messages (open the mate at that run), files
 * (open the file), routines (open the mate's page with that routine). Rows carry no actions.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { fmtWhen, type Mate, type SearchResult } from '../api'
import { useConn, useNav, useStore } from '../store'
import { Field, Mark, MateRow, Screen, ThreadRow, type IconName } from '../components'
import { color, size, space } from '../theme'
import { glyphOf, orderMates, secondLine } from '../thread'

const SEARCH_DEBOUNCE_MS = 250

type Hit =
  | { key: string; kind: 'mate'; mate: Mate }
  | { key: string; kind: 'message' | 'file' | 'routine'; glyph: IconName; title: string; sub: string; at: string; open: () => void }

export default function Home() {
  const nav = useNav()
  const { api } = useConn()
  const { mates, activity, loading, error, refresh } = useStore()
  const insets = useSafeAreaInsets()

  // Home mounts again when a conversation pops: refresh once so the row you just read drops its dot.
  useEffect(() => { if (mates) refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const list = useMemo(() => orderMates(mates || []), [mates])
  const nameOf = useMemo(() => { const m = new Map(list.map((x) => [x.id, x.name])); return (id: string) => m.get(id) || '' }, [list])
  const bell = activity ? (activity.needs || []).length + (activity.working || []).length : list.filter((m) => m.state !== 'idle').length
  const needs = activity ? (activity.needs || []).length > 0 : list.some((m) => m.state === 'waiting')

  // ---- search: local name / title / preview matches first, then what GET /search finds, 250ms later ----
  const [query, setQuery] = useState('')
  const [remote, setRemote] = useState<SearchResult | null>(null)
  const seq = useRef(0)
  const needle = query.trim()
  useEffect(() => {
    const my = ++seq.current
    if (!needle || !api) { setRemote(null); return }
    const t = setTimeout(() => { api.search(needle).then((d) => { if (my === seq.current) setRemote(d) }).catch(() => { if (my === seq.current) setRemote({ mates: [], messages: [], files: [], routines: [] }) }) }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [needle, api])
  const hits = useMemo((): Hit[] => {
    if (!needle) return []
    const q = needle.toLowerCase()
    const local = list.filter((m) => [m.name, m.title, m.preview, m.description].some((x) => String(x || '').toLowerCase().includes(q)))
    const seen = new Set(local.map((m) => m.id))
    const out: Hit[] = local.map((m) => ({ key: 'm:' + m.id, kind: 'mate', mate: m }))
    if (remote) {
      for (const m of remote.mates || []) if (!seen.has(m.id)) { seen.add(m.id); out.push({ key: 'm:' + m.id, kind: 'mate', mate: list.find((x) => x.id === m.id) || m }) }
      ;(remote.messages || []).forEach((x, i) => out.push({ key: 'x:' + x.runId + ':' + i, kind: 'message', glyph: 'chatbubble-outline', title: nameOf(x.mateId) || '对话', sub: x.text, at: x.at, open: () => nav.openMate(x.mateId, x.runId) }))
      for (const f of remote.files || []) out.push({ key: 'f:' + f.id, kind: 'file', glyph: 'document-text-outline', title: f.title, sub: nameOf(f.mateId || ''), at: f.createdAt, open: () => nav.push({ name: 'file', id: f.id }) })
      for (const r of remote.routines || []) out.push({ key: 'r:' + r.id, kind: 'routine', glyph: 'repeat-outline', title: r.title, sub: [nameOf(r.mateId), r.scheduleLabel].filter(Boolean).join(' · '), at: '', open: () => nav.push({ name: 'mateInfo', id: r.mateId, routineId: r.id }) })
    }
    return out
  }, [needle, list, remote, nameOf, nav])
  const rows: Hit[] = needle ? hits : list.map((m) => ({ key: 'm:' + m.id, kind: 'mate', mate: m }))

  const [searching, setSearching] = useState(false)
  const closeSearch = () => { setQuery(''); setSearching(false) }
  return (
    <Screen>
      <View style={styles.head}>
        <Pressable onPress={() => nav.push({ name: 'settings' })} accessibilityRole="button" accessibilityLabel="设置" hitSlop={4} style={({ pressed }) => pressed && { opacity: 0.7 }}>
          <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}><Mark dim={26} /></View>
        </Pressable>
        <View style={styles.actions}>
          <Circle icon={searching ? 'close' : 'search'} label={searching ? '关闭搜索' : '搜索'} on={searching} onPress={() => (searching ? closeSearch() : setSearching(true))} />
          <Pressable onPress={() => nav.push({ name: 'activity' })} accessibilityRole="button" accessibilityLabel={bell ? `动态 ${bell}` : '动态'} hitSlop={4} style={({ pressed }) => [styles.circle, pressed && styles.circlePressed]}>
            <Ionicons name="notifications-outline" size={19} color={color.fg} />
            {bell ? <View style={[styles.badge, needs && { backgroundColor: color.warn }]}><Text style={styles.badgeText}>{bell > 99 ? '99+' : bell}</Text></View> : null}
          </Pressable>
          <Circle icon="add" label="新同事" accent onPress={() => nav.push({ name: 'newMate' })} />
        </View>
      </View>
      {searching ? <View style={styles.search}><Field value={query} onChange={setQuery} placeholder="搜索同事、消息、文件" icon="search-outline" clearable autoFocus /></View> : null}
      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={loading && !mates} onRefresh={refresh} tintColor={color.meta} colors={[color.fg]} progressBackgroundColor={color.card} />}
        renderItem={({ item }) => {
          if (item.kind === 'mate') {
            const m = item.mate
            return <MateRow id={m.id || m.name} char={glyphOf(m)} isDefault={m.isDefault} working={m.state === 'working'} waiting={m.state === 'waiting'} name={m.name} time={fmtWhen(m.lastAt)} unread={m.unread} sub={secondLine(m)} onPress={() => nav.push({ name: 'mate', id: m.id })} />
          }
          return <ThreadRow glyph={item.glyph} title={item.title} time={fmtWhen(item.at)} preview={item.sub} onPress={item.open} />
        }}
        ListEmptyComponent={<Text style={styles.empty}>{needle ? (remote ? '没有匹配的' : '…') : error && !mates ? error : mates ? '' : '…'}</Text>}
      />
      <View style={[styles.foot, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
        <ThreadRow glyph="folder-outline" title="文件" onPress={() => nav.push({ name: 'files' })} />
      </View>
    </Screen>
  )
}

function Circle({ icon, label, onPress, accent, on }: { icon: IconName; label: string; onPress: () => void; accent?: boolean; on?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={4} style={({ pressed }) => [styles.circle, accent && styles.circleAccent, on && { backgroundColor: color.bubble }, pressed && (accent ? { opacity: 0.8 } : styles.circlePressed)]}>
      <Ionicons name={icon} size={accent ? 22 : 19} color={accent ? color.onPrimary : color.fg} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: 10 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  circle: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.input, alignItems: 'center', justifyContent: 'center' },
  circlePressed: { backgroundColor: color.bubble },
  circleAccent: { backgroundColor: color.primary },
  search: { paddingHorizontal: space.lg, paddingBottom: space.sm },
  badge: { position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: color.primary, borderWidth: 2, borderColor: color.bg, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 10, lineHeight: 12, fontWeight: '700', color: color.onPrimary, fontVariant: ['tabular-nums'] },
  list: { paddingHorizontal: 4, paddingTop: space.xs, paddingBottom: space.sm },
  empty: { fontSize: size.meta, lineHeight: 18, color: color.muted, paddingHorizontal: 16, paddingVertical: 12 },
  foot: { paddingHorizontal: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: color.border },
})
