/**
 * The bell (TEAMMATES.md §9.4): three groups from GET /activity — 需要你 (questions, failures, reminders) · 在干活 ·
 * 刚完成. A row opens that teammate's conversation at that run. Rows carry no actions.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { fmtWhen, type ActivityItem } from '../api'
import { useNav, useStore } from '../store'
import { IconBtn, ListBox, Row, Screen, Section, TopBar, type IconName, type Tone } from '../components'
import { color, size, space } from '../theme'

const look = (k: ActivityItem['kind']): { glyph?: IconName; tone: Tone; spin?: boolean } =>
  k === 'ask' ? { glyph: 'chatbubble-ellipses-outline', tone: 'warn' }
    : k === 'failed' ? { glyph: 'close-circle-outline', tone: 'danger' }
    : k === 'remind' ? { glyph: 'notifications-outline', tone: 'live' }
    : k === 'working' ? { spin: true, tone: 'live' }
    : { glyph: 'checkmark-circle-outline', tone: 'success' }

export default function Activity() {
  const nav = useNav()
  const { activity, mates } = useStore()
  const groups: { label: string; items: ActivityItem[] }[] = [
    { label: '需要你', items: activity ? activity.needs || [] : [] },
    { label: '在干活', items: activity ? activity.working || [] : [] },
    { label: '刚完成', items: activity ? activity.recent || [] : [] },
  ]
  const nameOf = (id: string) => (mates || []).find((m) => m.id === id)?.name || ''
  const any = groups.some((g) => g.items.length)
  return (
    <Screen>
      <TopBar left={<IconBtn name="chevron-back-outline" label="返回" onPress={nav.pop} />} title="动态" />
      <ScrollView style={{ flex: 1, backgroundColor: color.bg }} contentContainerStyle={styles.wrap}>
        {groups.map((g) => g.items.length ? (
          <View key={g.label}>
            <Section label={g.label} />
            <ListBox>
              {g.items.map((x, i) => {
                const l = look(x.kind)
                return <Row key={x.runId + x.kind + i} glyph={l.glyph} tone={l.tone} spin={l.spin} title={x.mateName || nameOf(x.mateId)} sub={x.text} state={fmtWhen(x.at)} onPress={() => nav.openMate(x.mateId, x.runId || undefined)} />
              })}
            </ListBox>
          </View>
        ) : null)}
        {!any ? <Text style={styles.empty}>{activity ? '没有等你的事' : '…'}</Text> : null}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  empty: { fontSize: size.ui, color: color.muted, paddingVertical: space.xl, textAlign: 'center' },
})
