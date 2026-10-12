/**
 * S7 设置 — 一列：连接（只展示）、重新配对、关于；通知（网页版：这台手机收不收电脑推来的通知，见 push.web.ts）；外观：配色（炭 · 香槟 / 墨 · 雾紫，和电脑上同一套）与明暗（跟随系统 /
 * 浅色 / 深色），都记在这台手机上。不含模型 / API key / 成员安装。
 */
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useConn, useNav } from '../store'
import { Screen, TopBar, IconBtn, ListBox, Row, Section } from '../components'
import { pushDisable, pushEnable, pushState, pushTest, type PushState } from '../push'
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

const PUSH_SUB: Record<PushState, string> = {
  off: '同事有结果、有问题要你定、提醒到点，推到这台手机',
  on: '这台手机会收到通知；免打扰时段只静音',
  denied: '浏览器拦下了通知：去浏览器的网站设置里允许',
  install: 'iPhone 要先「分享 › 添加到主屏幕」，从主屏幕打开再开',
  unsupported: '这个浏览器收不了通知',
}

/** 通知: one row that turns this phone's notifications on or off, and 发一条试试 once on. */
function Notifications() {
  const { api } = useConn()
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  useEffect(() => { pushState().then(setState).catch(() => setState('unsupported')) }, [])
  if (!state || state === 'unsupported') return null
  const act = (fn: () => Promise<PushState | void>, done = '') => async () => {
    if (!api || busy) return
    setBusy(true); setNote('')
    try { const s = await fn(); if (s) setState(s); if (done) setNote(done) } catch (e) { setNote(e instanceof Error ? e.message : String(e)) } finally { setBusy(false) }
  }
  const toggle = state === 'on' ? act(() => pushDisable(api!)) : state === 'off' ? act(() => pushEnable(api!)) : undefined
  return (
    <>
      <Section label="通知" />
      <ListBox>
        <Row title="推送到这台手机" sub={note || PUSH_SUB[state]} state={busy ? '…' : state === 'on' ? '开' : state === 'off' ? '关' : ''} stateTone={state === 'on' ? 'live' : undefined} onPress={toggle} />
        {state === 'on' ? <Row title="发一条试试" onPress={act(() => pushTest(api!), '发出去了，几秒内会到')} chevron /> : null}
      </ListBox>
    </>
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
          <Row title="连接" sub={conn ? (via === 'relay' ? '云端中继 · 端到端加密，任何网络都能连' : '旧的局域网配对 · 重新扫一次电脑上的码') : ''} />
          <Row title="重新配对" onPress={() => { forget() }} chevron />
          <Row title="关于" sub="MyWork 手机端 0.1" />
        </ListBox>
        <Notifications />
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
