/**
 * S0 连接 — 整屏一件事：扫电脑上的码，或手动输入地址。
 * 曾配对但连不上时，顶部一行「连不上 …」+ 重试 / 换一台电脑；下面照旧可以重新扫码。
 */
import { useRef, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera'
import * as Clipboard from 'expo-clipboard'
import { useConn } from '../store'
import { Screen, Mark, Title, Body, Meta, Btn, Field, IconBtn } from '../components'
import { color, space } from '../theme'

type Mode = 'idle' | 'scan' | 'manual'

export default function Pair() {
  const { conn, failed, pair, retry, forget } = useConn()
  const [perm, requestPerm] = useCameraPermissions()
  const [mode, setMode] = useState<Mode>('idle')
  const [addr, setAddr] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const locked = useRef(false)

  const connect = async (text: string) => {
    if (!text.trim() || busy) return
    setBusy(true); setErr('')
    const r = await pair(text)
    setBusy(false)
    if (r) setErr(r)
  }

  const openScan = async () => {
    setErr('')
    let p = perm
    if (!p || !p.granted) p = await requestPerm()
    if (!p.granted) { setErr('没有相机权限。'); return }
    locked.current = false
    setMode('scan')
  }

  const onScanned = ({ data }: BarcodeScanningResult) => {
    if (locked.current) return
    locked.current = true
    setMode('idle')
    connect(data)
  }

  const paste = async () => {
    const t = (await Clipboard.getStringAsync()).trim()
    if (t) setAddr(t)
  }

  const doRetry = async () => {
    if (busy) return
    setBusy(true); setErr('')
    await retry()
    setBusy(false)
  }

  if (mode === 'scan') {
    return (
      <View style={styles.cam}>
        <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={onScanned} />
        <Screen style={{ backgroundColor: 'transparent' }}>
          <View style={styles.camBar}>
            <IconBtn name="close-outline" label="关闭" onPress={() => setMode('idle')} tone={color.fg} />
          </View>
        </Screen>
      </View>
    )
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Mark dim={28} />
        {failed && conn ? (
          <View style={styles.status}>
            <Body>连不上 {conn.base}</Body>
            <View style={styles.actions}>
              <Btn label="重试" onPress={doRetry} disabled={busy} />
              <Btn label="换一台电脑" onPress={() => { forget() }} disabled={busy} />
            </View>
          </View>
        ) : null}
        <Title style={styles.lead}>在电脑上打开 设置 › MyWork › 手机，扫这个码</Title>
        <View style={styles.actions}>
          <Btn label="扫码" kind="primary" onPress={openScan} disabled={busy} style={styles.big} />
        </View>
        {busy ? <Meta style={styles.line}>连接中…</Meta> : err ? <Meta style={styles.lineErr}>{err}</Meta> : null}
        {mode === 'manual' ? (
          <View style={styles.manual}>
            <Field value={addr} onChange={setAddr} placeholder="电脑上显示的地址" mono autoFocus onSubmit={() => connect(addr)} />
            <View style={styles.actions}>
              <Btn label="粘贴" onPress={paste} disabled={busy} />
              <Btn label="连接" kind="primary" onPress={() => connect(addr)} disabled={busy || !addr.trim()} />
            </View>
          </View>
        ) : (
          <View style={styles.actions}>
            <Btn label="手动输入地址" onPress={() => setMode('manual')} disabled={busy} />
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: space.xxl },
  status: { marginTop: space.xxl, gap: space.md },
  lead: { marginTop: space.xxxl, marginBottom: space.xl },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  big: { height: 44, paddingHorizontal: 24 },
  line: { marginTop: space.md },
  lineErr: { marginTop: space.md, color: color.danger },
  manual: { marginTop: space.xl, gap: space.md },
  cam: { flex: 1, backgroundColor: '#000' },
  camBar: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
})
