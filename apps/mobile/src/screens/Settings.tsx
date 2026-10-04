/**
 * S7 设置 — 一列：连接（只展示）、重新配对、关于；外观：配色（炭 · 香槟 / 墨 · 雾紫，和电脑上同一套）与明暗（跟随系统 /
 * 浅色 / 深色），都记在这台手机上。不含模型 / API key / 成员安装。
 */
import { Pressable, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useConn, useNav } from '../store'
import { Screen, TopBar, IconBtn, ListBox, Row, Section } from '../components'
import { color, size, space, themed, useTheme, PALETTE_CHOICES, SCHEME_CHOICES } from '../theme'

/** One choice in a list: the words, a line under them, the accent check on the one in force. */
function Choice({ title, sub, on, onPress }: { title: string; sub?: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: on }} style={({ pressed }) => [styles.row, pressed && { backgroundColor: color.pressed }]}>
      <View style={styles.main}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {sub ? <Text style={styles.sub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {on ? <Ionicons name="checkmark" size={18} color={color.primary} /> : null}
    </Pressable>
  )
}

export default function Settings() {
  const nav = useNav()
  const { conn, forget, via } = useConn()
  const theme = useTheme()
  return (
    <Screen>
      <TopBar left={<IconBtn name="chevron-back-outline" label="返回" onPress={nav.pop} />} title="设置" />
      <ScrollView contentContainerStyle={styles.wrap}>
        <ListBox>
          <Row title="连接" sub={conn ? (via === 'relay' ? '加密中继 · 在外面也能用' : '局域网 · ' + conn.base) : ''} state={conn && conn.relay ? (via === 'relay' ? '外网' : '同一 Wi‑Fi') : undefined} />
          <Row title="重新配对" onPress={() => { forget() }} chevron />
          <Row title="关于" sub="MyWork 手机端 0.1" />
        </ListBox>
        <Section label="配色" />
        <ListBox>
          {PALETTE_CHOICES.map((p) => <Choice key={p.id} title={p.label} sub={p.sub} on={theme.palette === p.id} onPress={() => theme.setPalette(p.id)} />)}
        </ListBox>
        <Section label="明暗" />
        <ListBox>
          {SCHEME_CHOICES.map((m) => <Choice key={m.id} title={m.label} on={theme.mode === m.id} onPress={() => theme.setMode(m.id)} />)}
        </ListBox>
      </ScrollView>
    </Screen>
  )
}

const styles = themed(() => ({
  wrap: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 52, paddingVertical: 8, paddingHorizontal: 16 },
  main: { flex: 1, minWidth: 0 },
  title: { fontSize: size.ui, lineHeight: 24, fontWeight: '500', color: color.fg },
  sub: { fontSize: size.meta, lineHeight: 20, color: color.muted },
}))
