/**
 * 新同事 (TEAMMATES.md §9.5): 「它负责什么」 (required; three examples under it fill it) + 名字 (optional) →
 * POST /mates/create, then its conversation replaces this screen. The server queues the teammate's hidden intro run: it names itself when the name is empty,
 * says how it understood the job, and sets up the routine when the sentence carries a time.
 */
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { useConn, useNav, useStore } from '../store'
import { Btn, Field, IconBtn, Screen, Title, TopBar } from '../components'
import { color, radius, size, space, themed } from '../theme'

/** What people usually hand a teammate: one tap fills 「它负责什么」 (edit it from there). */
const EXAMPLES = ['每天早上 8 点按信源整理 AI 技术动态，只报和我有关的', '帮我管日程，记在一张表里，每天 8:30 给我今日安排', '盯竞品的定价页和更新日志，有变化就告诉我']

export default function NewMate() {
  const nav = useNav()
  const { api } = useConn()
  const store = useStore()
  const [description, setDescription] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const can = !!description.trim() && !busy && !!api
  const create = async () => {
    if (!can || !api) return
    setBusy(true); setErr('')
    try {
      const d = await api.mateCreate(description.trim(), name.trim() || undefined)
      store.putMate(d.mate)
      nav.replace({ name: 'mate', id: d.mate.id })
      store.refresh().catch(() => {})
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); setBusy(false) }
  }
  return (
    <Screen>
      <TopBar left={<IconBtn name="chevron-back-outline" label="返回" onPress={nav.pop} />} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
          <Title>新同事</Title>
          <Text style={styles.label}>它负责什么</Text>
          <Field value={description} onChange={setDescription} placeholder="每天 9 点整理 Node 生态的新闻，写成一页简报" autoFocus multiline />
          <View style={styles.examples}>
            {EXAMPLES.map((x) => (
              <Pressable key={x} onPress={() => setDescription(x)} accessibilityRole="button" style={({ pressed }) => [styles.example, pressed && { backgroundColor: color.bubble }]}>
                <Text style={styles.exampleText}>{x}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>名字</Text>
          <Field value={name} onChange={setName} placeholder="可以不填" />
          {err ? <Text style={styles.err}>{err}</Text> : null}
          <Btn label="创建" kind="primary" onPress={() => { create() }} disabled={!can} style={styles.go} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = themed(() => ({
  wrap: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.sm },
  label: { fontSize: size.small, lineHeight: 16, fontWeight: '500', color: color.meta, marginTop: space.lg },
  examples: { alignItems: 'flex-start', gap: space.sm },
  example: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.md, borderWidth: 1, borderColor: color.border, backgroundColor: color.card },
  exampleText: { fontSize: 13, lineHeight: 20, color: color.fg2 },
  err: { fontSize: size.meta, lineHeight: 20, color: color.danger, marginTop: space.sm },
  go: { alignSelf: 'flex-end', marginTop: space.lg },
}))
