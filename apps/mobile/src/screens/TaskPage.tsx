/**
 * S3 任务页 — the web task page in one column: title, one meta line, the deliverables (or the conversation),
 * the process fold, the reply dock. Every action on a task lives here, behind ···.
 */
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { fmtDate, fmtDuration, type Activity, type Api, type Deliverable, type Task } from '../api'
import { useConn, useNav, useStore } from '../store'
import { Body, Btn, Bubble, Composer, Empty, Field, Folded, HandoffChip, IconBtn, Meta, Prose, Reply, Screen, Sheet, SheetItem, Thinking, Title, TopBar, type IconName } from '../components'
import { color, radius, size, space } from '../theme'

type ToolAct = Extract<Activity, { kind: 'tool' }>
type Handoff = Extract<Activity, { kind: 'handoff' }>
type Phase = { kind: 'phase'; verb: string; obj: string; items: ToolAct[]; at: string; endAt: string; ms: number; failed: number }
type PhaseRow = Phase | Extract<Activity, { kind: 'text' | 'handoff' | 'verify' }>
type Detail = { task: Task; deliverables: Deliverable[] }
type SheetMode = 'menu' | 'rename' | 'confirm' | null

/** One body per task id: folds, drafts and the fetched detail must not survive a jump to another task. */
export default function TaskPage({ id }: { id: string }) { return <TaskBody key={id} id={id} /> }

function TaskBody({ id }: { id: string }) {
  const nav = useNav()
  const { api } = useConn()
  const store = useStore()
  const insets = useSafeAreaInsets()

  const summary = store.data ? store.data.items.find((x) => x.id === id) || null : null
  const live = !!summary && summary.status !== 'done'
  const [detail, setDetail] = useState<Detail | null>(null)
  const [gone, setGone] = useState(false)
  // Refetch when the summary changes shape, and on every poll while it runs (store.data is a new snapshot each 5s).
  const key = summary ? `${summary.status}:${summary.deliverableIds.length}:${summary.activity ? summary.activity.length : 0}` : ''
  const snap = live ? store.data : null
  useEffect(() => {
    if (!api) return
    let on = true
    api.task(id).then((d) => { if (on) setDetail(d) }).catch(() => { if (on) setGone(true) })
    return () => { on = false }
  }, [api, id, key, snap])

  const task = summary || (detail ? detail.task : null) // the freshest status
  const full = detail ? detail.task : summary // the one with activity
  const docs = detail ? detail.deliverables : []
  const rows = useMemo(() => (full ? phasesOf(full) : []), [full])

  const [sheet, setSheet] = useState<SheetMode>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(live)
  const [openPhase, setOpenPhase] = useState(-1)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => { if (live) setOpen(true) }, [live])
  const lastIdx = rows.length - 1
  // Follow the run: the newest phase opens when it appears, not on every poll, so a fold you closed stays closed.
  useEffect(() => { if (live && rows[lastIdx] && rows[lastIdx].kind === 'phase') setOpenPhase(lastIdx) }, [live, lastIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!task || !full) {
    return (
      <Screen>
        <TopBar left={<IconBtn name="chevron-back-outline" label="返回" onPress={nav.pop} />} />
        <View style={styles.center}>{gone ? <Empty text="没有这条任务。" /> : <ActivityIndicator color={color.fg2} />}</View>
      </Screen>
    )
  }

  const v = task.verification
  const verdict = task.status === 'verifying' ? '核验中'
    : v ? (v.passed === true ? '已核验' : v.passed === false ? '核验发现问题' : '未能核验') + (v.checked ? ` · 核对 ${v.checked}${v.issues ? ` · 问题 ${v.issues}` : ''}` : '')
    : task.error ? (/已取消/.test(task.error) ? '已取消' : '失败') : ''
  const meta = [live ? task.statusLabel : verdict, fmtDate(task.finishedAt || task.createdAt)].filter(Boolean).join(' · ')
  const elapsed = fmtDuration(new Date(task.finishedAt || Date.now()).getTime() - new Date(task.startedAt || task.createdAt).getTime())
  const phaseCount = rows.filter((r) => r.kind === 'phase').length
  const procLabel = ['过程', phaseCount ? `${phaseCount} 步` : '', elapsed].filter(Boolean).join(' · ')

  // Conversational tasks: the exchange is the body.
  const turns = (full.activity || []).filter((e): e is Exclude<Activity, ToolAct | Extract<Activity, { kind: 'verify' }>> => e.kind === 'user' || e.kind === 'text' || e.kind === 'handoff')
  const isTalk = turns.some((e) => e.kind !== 'handoff')
  const blocked = task.status === 'verifying' || task.status === 'queued' || !task.sessionId

  /** One POST from the ··· menu: close the sheet, do it, refresh; `then` runs before the refresh so a pop or push is not delayed. */
  const run = async <T,>(fn: (a: Api) => Promise<T>, then?: (r: T) => void) => {
    if (!api || busy) return
    setBusy(true); setSheet(null); setErr('')
    try {
      const r = await fn(api)
      if (then) then(r)
      await store.refresh()
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)) } finally { setBusy(false) }
  }
  const saveName = () => {
    const t = name.trim()
    if (!t || t === task.title) { setSheet(null); return }
    run((a) => a.rename(id, t))
  }
  const rate = async (d: Deliverable, r: number) => {
    if (!api) return
    try {
      const x = await api.rate(d.id, d.rating === r ? null : r)
      setDetail((prev) => prev ? { ...prev, deliverables: prev.deliverables.map((y) => y.id === x.deliverable.id ? { ...y, ...x.deliverable } : y) } : prev)
      store.refresh()
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)) }
  }
  const share = (d: Deliverable) => { Share.share({ title: d.title, message: '# ' + d.title + '\n\n' + (d.markdown || '') }).catch(() => {}) }
  const say = async () => {
    const body = text.trim()
    if (!body || sending || blocked || !api) return
    setSending(true); setErr('')
    try { await api.say(id, body); setText(''); await store.refresh() } catch (e) { setErr(e instanceof Error ? e.message : String(e)) } finally { setSending(false) }
  }
  const handoffLabel = (e: Handoff) => (e.target === 'task' ? '已交给后台' : '已安排') + '：' + e.title + (e.schedule ? ' · ' + e.schedule : '')
  const openHandoff = (e: Handoff) => nav.push(e.target === 'task' ? { name: 'task', id: e.id } : { name: 'routine', id: e.id })

  return (
    <Screen>
      <TopBar
        left={<IconBtn name="chevron-back-outline" label="返回" onPress={nav.pop} />}
        right={<IconBtn name="ellipsis-horizontal-outline" label="更多" onPress={() => setSheet('menu')} />}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Title>{task.title}</Title>
          <Meta style={styles.meta}>{meta}</Meta>
          {task.error ? <Body style={styles.error}>{task.error}</Body> : null}

          {docs.length ? docs.map((d) => (
            <View key={d.id} style={styles.doc}>
              {d.verification && d.verification.notes ? <View style={styles.notes}><Folded text={d.verification.notes} /></View> : null}
              <Prose markdown={d.markdown || ''} />
              <View style={styles.docActions}>
                <RateBtn icon="checkmark-outline" label="有用" on={d.rating === 1} onPress={() => rate(d, 1)} />
                <RateBtn icon="close-outline" label="没用" on={d.rating === -1} onPress={() => rate(d, -1)} />
                <View style={{ flex: 1 }} />
                <Btn label="分享" icon="share-outline" onPress={() => share(d)} />
              </View>
            </View>
          )) : isTalk ? (
            <View style={styles.turns}>
              {turns.map((e, i) => e.kind === 'user' ? <Bubble key={i} text={e.text} />
                : e.kind === 'text' ? <Reply key={i} markdown={e.text} />
                : <HandoffChip key={i} label={handoffLabel(e)} onPress={() => openHandoff(e)} />)}
              {live ? <Thinking text={task.currentStep || '在想'} /> : null}
            </View>
          ) : !detail ? <ActivityIndicator color={color.meta} style={styles.loading} /> : null}

          <View style={styles.proc}>
            <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.procHead}>
              <View style={styles.ic}>{live ? <ActivityIndicator size="small" color={color.fg2} /> : <Ionicons name="time-outline" size={16} color={color.meta} />}</View>
              <Text style={styles.procText}>{procLabel}</Text>
              <Ionicons name={open ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color={color.meta} />
            </Pressable>

            {open ? (
              <View style={styles.phases}>
                {!rows.length && !v && task.status !== 'verifying' ? <Empty text={live ? task.statusLabel + '…' : '无'} /> : null}
                {rows.map((r, i) => {
                  if (r.kind === 'phase') {
                    const running = live && i === lastIdx && task.status === 'running'
                    const n = r.items.length
                    const pm = [n > 1 ? `${n} 次` : '', r.ms > 1500 ? fmtDuration(r.ms) : ''].filter(Boolean).join(' · ')
                    const isOpen = openPhase === i
                    return (
                      <View key={i}>
                        <Pressable onPress={() => setOpenPhase(isOpen ? -1 : i)} accessibilityRole="button" accessibilityState={{ expanded: isOpen }} style={styles.phase}>
                          <View style={styles.ic}>{running ? <ActivityIndicator size="small" color={color.fg2} /> : <Ionicons name={r.failed ? 'close-circle-outline' : 'checkmark-outline'} size={15} color={r.failed ? color.danger : color.meta} />}</View>
                          <Text style={[styles.verb, running && { color: color.fg }, r.failed > 0 && { color: color.danger }]}>{r.verb}</Text>
                          {pm ? <Text style={styles.phaseMeta}>{pm}</Text> : null}
                          {!isOpen && r.obj ? <Text style={styles.obj} numberOfLines={1}>{r.obj}</Text> : null}
                        </Pressable>
                        {isOpen ? r.items.map((e, j) => {
                          const d = describe(e.name, e.detail)
                          const nextAt = r.items[j + 1] ? r.items[j + 1].at : r.endAt
                          const ms = Math.max(0, new Date(nextAt).getTime() - new Date(e.at).getTime())
                          return (
                            <View key={j} style={styles.call}>
                              <View style={styles.ic}><Ionicons name={e.ok === false ? 'close-circle-outline' : e.ok === true ? 'checkmark-outline' : 'ellipse-outline'} size={13} color={e.ok === false ? color.danger : color.meta} /></View>
                              <View style={styles.callMain}>
                                <Text style={styles.callLine} numberOfLines={2}><Text style={styles.callVerb}>{d.verb}</Text>{d.obj ? '  ' + d.obj : ''}</Text>
                                {e.ok === false && e.result ? <Text style={styles.callFail} numberOfLines={2}>失败 · {e.result}</Text> : null}
                              </View>
                              {ms > 1500 ? <Text style={styles.phaseMeta}>{fmtDuration(ms)}</Text> : null}
                            </View>
                          )
                        }) : null}
                      </View>
                    )
                  }
                  if (r.kind === 'handoff') return <View key={i} style={styles.note}><HandoffChip label={handoffLabel(r)} onPress={() => openHandoff(r)} /></View>
                  return (
                    <View key={i} style={styles.note}>
                      <View style={[styles.ic, { marginTop: 2 }]}><Ionicons name="chatbox-ellipses-outline" size={15} color={color.meta} /></View>
                      <View style={{ flex: 1 }}><Folded text={r.kind === 'verify' ? '核验 · ' + r.text : r.text} /></View>
                    </View>
                  )
                })}
                {task.status === 'verifying' ? (
                  <View style={styles.phase}>
                    <View style={styles.ic}><ActivityIndicator size="small" color={color.fg2} /></View>
                    <Text style={[styles.verb, { color: color.fg }]}>核验</Text>
                    <Text style={styles.phaseMeta}>核验中</Text>
                  </View>
                ) : v ? (
                  <View style={styles.phase}>
                    <View style={styles.ic}><Ionicons name={v.passed === false ? 'close-circle-outline' : v.passed === true ? 'checkmark-outline' : 'remove-outline'} size={15} color={v.passed === false ? color.danger : color.meta} /></View>
                    <Text style={[styles.verb, v.passed === false && { color: color.danger }]}>核验</Text>
                    <Text style={styles.phaseMeta}>{[v.passed === true ? '通过' : v.passed === false ? '有问题' : '未能核验', v.checked ? `核对 ${v.checked}` : '', v.issues ? `问题 ${v.issues}` : ''].filter(Boolean).join(' · ')}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
          {err ? <Text style={styles.err}>{err}</Text> : null}
          <View style={{ opacity: blocked ? 0.45 : 1 }}>
            <Composer value={text} onChange={setText} onSend={say} placeholder="回复" busy={sending} disabled={blocked || !api} />
          </View>
        </View>
      </KeyboardAvoidingView>

      <Sheet open={sheet !== null} onClose={() => setSheet(null)} title={sheet === 'rename' ? '重命名' : sheet === 'confirm' ? '删掉这条记录和它的交付物？' : undefined}>
        {sheet === 'menu' ? (
          <>
            {live
              ? <SheetItem icon="stop-circle-outline" label="取消" onPress={() => run((a) => a.cancel(id))} />
              : <SheetItem icon="refresh-outline" label="再来一次" onPress={() => run((a) => a.rerun(id), (d) => { if (d.task) nav.push({ name: 'task', id: d.task.id }) })} />}
            {!live && task.deliverableIds.length ? <SheetItem icon="shield-checkmark-outline" label="重新核验" onPress={() => run((a) => a.verify(id))} /> : null}
            <SheetItem icon="pencil-outline" label="重命名" onPress={() => { setName(task.title); setSheet('rename') }} />
            <SheetItem icon="trash-outline" label="删除" danger onPress={() => setSheet('confirm')} />
          </>
        ) : sheet === 'rename' ? (
          <View style={styles.renameBox}>
            <Field value={name} onChange={setName} placeholder="标题" autoFocus onSubmit={saveName} />
            <Btn label="确定" kind="primary" onPress={saveName} disabled={!name.trim() || busy} style={{ alignSelf: 'flex-end' }} />
          </View>
        ) : sheet === 'confirm' ? (
          <>
            <SheetItem icon="trash-outline" label="删除" danger onPress={() => run((a) => a.remove(id), () => nav.pop())} />
            <SheetItem label="取消" onPress={() => setSheet(null)} />
          </>
        ) : null}
      </Sheet>
    </Screen>
  )
}

/** 有用 / 没用: a ghost button whose text and icon darken when it is the chosen one. */
function RateBtn({ icon, label, on, onPress }: { icon: IconName; label: string; on: boolean; onPress: () => void }) {
  const tone = on ? color.fg : color.muted
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} style={({ pressed }) => [styles.rateBtn, on && { backgroundColor: color.surface }, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icon} size={15} color={tone} />
      <Text style={[styles.rateText, { color: tone }]}>{label}</Text>
    </Pressable>
  )
}

/** The run as phases, the web's phasesOf: consecutive tool calls with the same verb fold into one line;
 *  a note the agent wrote, a hand-off and the verifier's note are lines of their own. */
function phasesOf(task: Task): PhaseRow[] {
  const list = Array.isArray(task.activity) ? task.activity : []
  const end = task.finishedAt || new Date().toISOString()
  const out: PhaseRow[] = []
  for (const e of list) {
    if (e.kind === 'user') continue // follow-ups are in the conversation above
    if (e.kind === 'tool') {
      const d = describe(e.name, e.detail)
      const last = out[out.length - 1]
      if (last && last.kind === 'phase' && last.verb === d.verb) { last.items.push(e); if (d.obj) last.obj = d.obj; if (e.ok === false) last.failed++; continue }
      out.push({ kind: 'phase', verb: d.verb, obj: d.obj, items: [e], at: e.at, endAt: end, ms: 0, failed: e.ok === false ? 1 : 0 })
      continue
    }
    out.push(e)
  }
  for (let i = 0; i < out.length; i++) {
    const r = out[i]
    if (r.kind !== 'phase') continue
    const next = out[i + 1]
    r.endAt = next ? next.at : end
    r.ms = Math.max(0, new Date(r.endAt).getTime() - new Date(r.at).getTime())
  }
  return out
}

/** One plain line per tool call: a verb and the thing it touched. Raw arguments never reach the screen. */
function describe(name: string, detail?: string): { verb: string; obj: string } {
  const n = String(name || '')
  const kv = parseArgs(detail)
  const s = (x: unknown): string => (typeof x === 'string' ? x : Array.isArray(x) ? s(x[0]) : '')
  const host = (u: string) => { const m = u.match(/^[a-z]+:\/\/([^/?#]+)([^?#]*)/i); return m ? m[1].replace(/^www\./, '') + (m[2].length > 1 ? m[2].replace(/\/$/, '').slice(0, 40) : '') : u.slice(0, 60) }
  const base = (p: string) => p.split('/').filter(Boolean).slice(-1)[0] || p
  if (/^web_fetch$|^open_url$|^browser_navigate$/.test(n)) return { verb: '读取网页', obj: host(s(kv.url) || s(kv.href)) }
  if (/^web_search$|search/.test(n)) { let q = s(kv.queries) || s(kv.query) || s(kv.q); if (q.startsWith('[')) { try { q = s(JSON.parse(q)) } catch { /* keep as is */ } } return { verb: '搜索', obj: q ? '“' + q.slice(0, 60) + '”' : '' } }
  if (/^read$|read_file|^cat$|^view$/.test(n)) return { verb: '读取', obj: base(s(kv.file_path) || s(kv.path)) }
  if (/^(edit|write|apply_patch|create_file|write_file)$/.test(n)) return { verb: '整理', obj: base(s(kv.file_path) || s(kv.path)) }
  if (/^(glob|grep|list|ls|find)$/.test(n)) return { verb: '查找', obj: (s(kv.pattern) || s(kv.query) || s(kv.path)).slice(0, 60) }
  if (/^(bash|shell|run_code|exec)$/.test(n)) return { verb: '执行', obj: (s(kv.description) || s(kv.command)).slice(0, 70) }
  if (n === 'deliver') return { verb: '交付', obj: s(kv.title).slice(0, 70) }
  if (/^univer_/.test(n)) return { verb: '文档', obj: (s(kv.title) || s(kv.name) || s(kv.action) || n.slice(7)).slice(0, 60) }
  if (/^browser_/.test(n)) return { verb: '浏览器', obj: n.slice(8) + (s(kv.url) ? ' ' + host(s(kv.url)) : '') }
  if (/^present/.test(n)) return { verb: '展示', obj: s(kv.title).slice(0, 60) }
  if (/^skill/.test(n)) return { verb: '技能', obj: (s(kv.name) || s(kv.skill)).slice(0, 60) }
  return { verb: n, obj: String(detail || '').slice(0, 70) }
}

/** Arguments arrive as a JSON string (possibly truncated) or as key=value pairs. */
function parseArgs(raw?: string): Record<string, unknown> {
  const t = String(raw || '').trim()
  const out: Record<string, unknown> = {}
  if (t.startsWith('{')) {
    try { return JSON.parse(t) as Record<string, unknown> } catch { /* truncated: pick the fields we show */ }
    const m = t.match(/"(url|href|file_path|path|title|query|command|pattern|description)"\s*:\s*"([^"]{1,200})/)
    if (m) out[m[1]] = m[2]
    const q = t.match(/"queries"\s*:\s*\[\s*"([^"]{1,200})/)
    if (q) out.queries = q[1]
    return out
  }
  for (const m of t.matchAll(/(\w+)=("(?:[^"\\]|\\.)*"|\S+)/g)) {
    let val: unknown = m[2]
    if (m[2].startsWith('"')) { try { val = JSON.parse(m[2]) } catch { val = m[2].slice(1, -1) } }
    out[m[1]] = val
  }
  return out
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: space.lg, paddingTop: space.xs, paddingBottom: space.xxl },
  meta: { marginTop: space.sm, marginBottom: space.lg },
  error: { color: color.danger, marginBottom: space.lg },
  loading: { alignSelf: 'flex-start', marginVertical: space.lg },
  doc: { marginBottom: space.xl },
  notes: { marginBottom: space.md },
  docActions: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.sm, marginLeft: -8 },
  rateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 8, borderRadius: radius.sm },
  rateText: { fontSize: 14, fontWeight: '500' },
  turns: { gap: space.md, marginBottom: space.xl },
  proc: { borderTopWidth: 1, borderTopColor: color.borderSoft, marginTop: space.sm, paddingTop: space.xs },
  procHead: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  procText: { flex: 1, fontSize: size.ui, color: color.fg2, fontVariant: ['tabular-nums'] },
  ic: { width: 20, alignItems: 'center' },
  phases: { paddingBottom: space.sm },
  phase: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36, paddingVertical: 4 },
  verb: { fontSize: size.ui, fontWeight: '500', color: color.fg2 },
  phaseMeta: { fontSize: size.meta, color: color.meta, fontVariant: ['tabular-nums'] },
  obj: { flex: 1, fontSize: size.meta, color: color.muted },
  call: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingLeft: 30, paddingVertical: 4 },
  callMain: { flex: 1, minWidth: 0 },
  callLine: { fontSize: size.meta + 1, lineHeight: 20, color: color.muted },
  callVerb: { color: color.fg2, fontWeight: '500' },
  callFail: { fontSize: size.meta, lineHeight: 18, color: color.danger },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  dock: { paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.sm, backgroundColor: color.bg },
  err: { fontSize: size.meta, lineHeight: 18, color: color.danger, paddingHorizontal: 2 },
  renameBox: { paddingHorizontal: 12, paddingTop: 4, gap: space.md },
})
