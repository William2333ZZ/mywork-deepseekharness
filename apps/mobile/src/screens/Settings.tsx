/**
 * S7 设置 — 一列：连接（只展示）、重新配对、关于。不含模型 / API key / 成员安装。
 */
import { ScrollView, StyleSheet } from 'react-native'
import { useConn, useNav } from '../store'
import { Screen, TopBar, IconBtn, ListBox, Row } from '../components'
import { space } from '../theme'

export default function Settings() {
  const nav = useNav()
  const { conn, forget } = useConn()
  return (
    <Screen>
      <TopBar left={<IconBtn name="chevron-back-outline" label="返回" onPress={nav.pop} />} title="设置" />
      <ScrollView contentContainerStyle={styles.wrap}>
        <ListBox>
          <Row glyph="laptop-outline" title="连接" sub={conn ? conn.base : ''} />
          <Row glyph="qr-code-outline" title="重新配对" onPress={() => { forget() }} chevron />
          <Row glyph="information-circle-outline" title="关于" sub="MyWork 手机端 0.1" />
        </ListBox>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xxl },
})
