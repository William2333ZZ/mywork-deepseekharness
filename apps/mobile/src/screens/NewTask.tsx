/**
 * S2 新任务 — one screen, one field. Sending always creates something: a task lands on its page,
 * a routine on its routine page. The examples fill the field; they do not send.
 */
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useConn, useNav, useStore } from '../store'
import { Btn, Composer, IconBtn, Screen, Title, TopBar } from '../components'
import { color, size, space } from '../theme'

const EXAMPLES = [
  '把这个目录的 README 整理成一页产品介绍',
  '比较三种 Node 定时任务方案，给出推荐',
  '每天 9 点给我一份 Node 生态简报',
]

export default function NewTask({ prefill }: { prefill?: string }) {
  const nav = useNav()
  const { api } = useConn()
  const store = useStore()
  const [text, setText] = useState(prefill || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const send = async () => {
    const body = text.trim()
    if (!body || busy || !api) return
    setBusy(true); setErr('')
    try {
      const d = await api.create(body)
      await store.refresh()
      if (d.task) nav.replace({ name: 'task', id: d.task.id })
      else if (d.routine) nav.replace({ name: 'routine', id: d.routine.id })
      else nav.pop()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <Screen>
      <TopBar left={<IconBtn name="close-outline" label="关闭" onPress={nav.pop} />} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Title style={styles.title}>你要什么结果？</Title>
          <Composer big autoFocus value={text} onChange={setText} onSend={send} placeholder="今天要做什么" busy={busy} disabled={!api} />
          {err ? <Text style={styles.err}>{err}</Text> : null}
          <View style={styles.examples}>
            {EXAMPLES.map((ex) => <Btn key={ex} label={ex} icon="arrow-forward-outline" onPress={() => setText(ex)} style={styles.example} />)}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xxl, gap: space.lg },
  title: { marginBottom: space.xs },
  err: { fontSize: size.ui, lineHeight: 22, color: color.danger },
  examples: { alignItems: 'flex-start', gap: space.xs, marginLeft: -8 },
  example: { alignSelf: 'flex-start' },
})
