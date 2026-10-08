/**
 * One file of a teammate's folder, read on the phone (the web's FileView / LinkView): a table (.csv / .tsv) as a grid
 * that scrolls sideways — the header row, numbers right-aligned, 500 rows at most here —, a note (.md) as reading text,
 * .txt / .json as monospaced text, an image shown whole. The meta line says how big it is and when it changed; 「用其他应用打开」
 * hands the file to another app (openFile.ts). Re-read on every poll, so a teammate's edits show up.
 */
import { useEffect, useMemo, useState } from 'react'
import { Image, ScrollView, Text, View } from 'react-native'
import { openElsewhere } from '../openFile'
import { ApiError, fmtDate, type FolderFile as FileData } from '../api'
import { useConn, useNav, useStore } from '../store'
import { Empty, IconBtn, Prose, Screen, TopBar } from '../components'
import { color, font, radius, size, space, themed } from '../theme'
import { fileKindOf, openKindOf, tableOf } from '../thread'

const MAX_ROWS = 500
const errText = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : String(e))
const fmtSize = (n: number) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : n >= 1024 ? Math.round(n / 1024) + ' KB' : n + ' B')

export default function FolderFile({ mateId, path }: { mateId: string; path: string }) {
  const nav = useNav()
  const { api, conn } = useConn()
  const store = useStore()
  const name = path.split('/').pop() || path
  const kind = openKindOf(name)
  const [data, setData] = useState<FileData | null>(null)
  const [image, setImage] = useState<{ uri: string; ratio: number } | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!api) return
    let on = true
    if (kind === 'text') api.folderFile(mateId, path).then((d) => { if (on) { setData(d); setErr('') } }).catch((e) => { if (on) setErr(errText(e)) })
    else if (kind === 'image' && conn && !image) {
      api.fileLink(mateId, path).then(async (l) => {
        // Through the relay the bytes come down the encrypted line; an older LAN pairing loads the signed link directly.
        const uri = api.via === 'relay' ? await api.raw(l.url).then((r) => `data:${r.contentType.split(';')[0] || 'image/png'};base64,${r.b64}`) : conn.base + l.url
        Image.getSize(uri, (w, h) => { if (on) setImage({ uri, ratio: w && h ? w / h : 1 }) }, () => { if (on) setErr('图片没加载出来') })
      }).catch((e) => { if (on) setErr(errText(e)) })
    }
    return () => { on = false }
  }, [api, conn, mateId, path, kind, store.tick])

  const [opening, setOpening] = useState(false)
  const openOutside = async () => {
    if (!api || !conn || opening) return
    setOpening(true); setErr('')
    try { await openElsewhere(api, conn.base, mateId, path, kind === 'download') } catch (e) { setErr(errText(e)) } finally { setOpening(false) }
  }

  const tk = fileKindOf(name)
  const table = useMemo(() => (data && tk === 'table' ? tableOf(data.text, /\.tsv$/i.test(name) ? '\t' : ',') : null), [data, tk, name])
  const meta = [table ? `${table.rows.length} 行` : '', data ? fmtSize(data.size) : '', data ? fmtDate(data.modifiedAt) : '', data && data.truncated ? '只显示前 512 KB' : '', table && table.rows.length > MAX_ROWS ? `这里只显示前 ${MAX_ROWS} 行` : ''].filter(Boolean).join(' · ')

  return (
    <Screen>
      <TopBar left={<IconBtn name="chevron-back-outline" label="返回" onPress={nav.pop} />} title={name} right={<IconBtn name="open-outline" label="用其他应用打开" onPress={() => { openOutside() }} />} />
      <ScrollView contentContainerStyle={styles.wrap}>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        {err ? <Text style={styles.err}>{err}</Text> : null}
        {kind === 'image' ? (image ? <Image source={{ uri: image.uri }} style={{ width: '100%', aspectRatio: image.ratio, borderRadius: radius.md }} resizeMode="contain" /> : !err ? <Text style={styles.meta}>…</Text> : null)
          : !data ? (!err ? <Text style={styles.meta}>…</Text> : null)
            : !data.text.trim() ? <Empty text="文件是空的" />
              : table ? <Grid header={table.header} rows={table.rows.slice(0, MAX_ROWS)} numeric={table.numeric} />
                : tk === 'markdown' ? <Prose markdown={data.text} wide />
                  : <ScrollView horizontal showsHorizontalScrollIndicator={false}><Text style={styles.mono} selectable>{data.text}</Text></ScrollView>}
      </ScrollView>
    </Screen>
  )
}

/** The table: the header row on a card ground, rows between soft lines, 140 per column, numbers right-aligned; scrolls sideways. */
function Grid({ header, rows, numeric }: { header: string[]; rows: string[][]; numeric: boolean[] }) {
  const cell = (v: string, j: number, head?: boolean) => (
    <Text key={j} style={[styles.cell, head && styles.head, numeric[j] && { textAlign: 'right' }]} numberOfLines={head ? 2 : 4} selectable={!head}>{v}</Text>
  )
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.grid}>
      <View>
        <View style={[styles.row, styles.headRow]}>{header.map((v, j) => cell(v, j, true))}</View>
        {rows.map((r, i) => <View key={i} style={[styles.row, i > 0 && styles.rowLine]}>{r.map((v, j) => cell(v, j))}</View>)}
      </View>
    </ScrollView>
  )
}

const styles = themed(() => ({
  wrap: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.md },
  meta: { fontSize: size.small, lineHeight: 16, color: color.meta, fontVariant: ['tabular-nums'] },
  err: { fontSize: size.meta, lineHeight: 20, color: color.danger },
  mono: { fontFamily: font.mono, fontSize: 13, lineHeight: 20, color: color.fg2 },
  grid: { borderWidth: 1, borderColor: color.border, borderRadius: radius.md },
  row: { flexDirection: 'row' },
  headRow: { backgroundColor: color.card, borderBottomWidth: 1, borderColor: color.border },
  rowLine: { borderTopWidth: 1, borderColor: color.borderSoft },
  cell: { width: 140, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, lineHeight: 18, color: color.fg },
  head: { fontSize: 12, fontWeight: '500', color: color.muted },
}))
