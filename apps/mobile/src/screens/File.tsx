/**
 * One file, full screen (opened from a thread's 文件卡 or the files list): the serif title, one meta line (teammate · time), ✓ rows, the body (tables scroll sideways), share in the top bar, 有用 / 没用,
 * and 「在对话里看」 — the conversation of the teammate that made it, scrolled to the run (§9.3 跳转一条规则).
 */
import { useEffect, useState } from 'react'
import { ScrollView, Share, Text, View } from 'react-native'
import { fmtDate, type Deliverable } from '../api'
import { useConn, useNav, useStore } from '../store'
import { Btn, Empty, IconBtn, Meta, Prose, ResultRows, Screen, Title, TopBar, VerifyLine, type Tone } from '../components'
import { color, radius, space, themed } from '../theme'

export default function File({ id }: { id: string }) {
  const nav = useNav()
  const { api } = useConn()
  const { mates } = useStore()
  const [d, setD] = useState<Deliverable | null>(null)
  const [gone, setGone] = useState(false)
  useEffect(() => {
    if (!api) return
    let on = true
    api.deliverable(id).then((x) => { if (on) setD(x.deliverable) }).catch(() => { if (on) setGone(true) })
    return () => { on = false }
  }, [api, id])
  const rate = async (r: number) => {
    if (!api || !d) return
    try { const x = await api.rate(d.id, d.rating === r ? null : r); setD({ ...d, ...x.deliverable }) } catch { /* the line keeps the old rating */ }
  }
  const share = () => { if (d) Share.share({ title: d.title, message: '# ' + d.title + '\n\n' + (d.markdown || '') }).catch(() => {}) }

  if (!d) {
    return (
      <Screen>
        <TopBar left={<IconBtn name="chevron-back-outline" label="返回" onPress={nav.pop} />} />
        <View style={styles.center}>{gone ? <Empty text="没有这份文件。" /> : <Text style={styles.wait}>…</Text>}</View>
      </Screen>
    )
  }
  const mate = d.mateId ? (mates || []).find((m) => m.id === d.mateId) : undefined
  return (
    <Screen>
      <TopBar left={<IconBtn name="chevron-back-outline" label="返回" onPress={nav.pop} />} right={<IconBtn name="share-outline" label="分享" onPress={share} />} />
      <ScrollView contentContainerStyle={styles.wrap}>
        <Title>{d.title}</Title>
        <Meta style={styles.meta}>{[mate ? mate.name : '', fmtDate(d.createdAt)].filter(Boolean).join(' · ')}</Meta>
        {Array.isArray(d.summary) && d.summary.length ? <View style={styles.sum}><ResultRows rows={d.summary} /></View> : null}
        <View style={styles.doc}><Prose markdown={d.markdown || ''} wide /></View>
        <VerifyLine words="" rating={d.rating} onRate={(r) => { rate(r) }} />
        {d.mateId ? <Btn label="在对话里看" onPress={() => nav.openMate(d.mateId!, d.runId)} style={styles.go} /> : null}
      </ScrollView>
    </Screen>
  )
}

const styles = themed(() => ({
  wrap: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  meta: { marginTop: space.sm, marginBottom: space.lg },
  go: { alignSelf: 'flex-start', marginTop: space.lg },
  sum: { marginBottom: space.xl },
  wait: { fontSize: 13, color: color.meta },
  doc: { marginBottom: space.sm },
}))
