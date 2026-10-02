/**
 * The teammate's page — the phone's right panel (TEAMMATES.md §9.5 / §9.6), about this one teammate only:
 *   例行   rows (名字 · 计划 · 下次 / 已暂停); a row opens the routine's sheet: the sentence (editable), 现在跑一次,
 *          暂停 / 恢复, 删除, the last 10 runs (a run opens the conversation at it; a quiet one only reads 没有变化).
 *          「新例行」 beside the label opens a sheet with one sentence.
 *   设置   名字 · 头衔 · 职责 · 分组 (each edited in a sheet; 分组 offers the names in use, empty = 其他 on the list) ·
 *          置顶 · 通知 · 删除 (not for the default teammate).
 *   文件   this teammate's latest files; 全部 opens the files screen filtered to it.
 * With `routineId` the routine's sheet opens on arrival (「已安排」 lines and search results land here).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { ApiError, fmtDate, fmtWhen, type Deliverable, type Mate, type Routine, type RoutineRun } from '../api'
import { useConn, useNav, useStore } from '../store'
import { Avatar, Btn, Empty, Field, Ghost, IconBtn, ListBox, Meta, Row, Screen, Section, Sheet, SheetItem, ThreadRow, Title, TopBar } from '../components'
import { color, size, space } from '../theme'
import { glyphOf, time } from '../thread'

const FILES = 8
const RUNS = 10
const errText = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : String(e))

type EditKey = 'name' | 'title' | 'description'
const EDIT_LABEL: Record<EditKey, string> = { name: '名字', title: '头衔', description: '职责' }

export default function MateInfo({ id, routineId }: { id: string; routineId?: string }) {
  const nav = useNav()
  const { api } = useConn()
  const store = useStore()
  const mate = store.mates ? store.mates.find((m) => m.id === id) || null : null
  const [err, setErr] = useState('')

  // ---- routines and files: on arrival and on every poll ----
  const [routines, setRoutines] = useState<Routine[] | null>(null)
  const [files, setFiles] = useState<Deliverable[] | null>(null)
  const loadRoutines = useCallback(async () => { if (!api) return; try { const d = await api.routines(id); setRoutines((d.items || []).filter((r) => !r.mateId || r.mateId === id)) } catch { setRoutines((x) => x || []) } }, [api, id])
  useEffect(() => { loadRoutines() }, [loadRoutines, store.tick])
  useEffect(() => {
    if (!api) return
    let on = true
    api.files({ mate: id }).then((d) => { if (on) setFiles((d.items || []).slice().sort((a, b) => time(b.createdAt) - time(a.createdAt))) }).catch(() => { if (on) setFiles((x) => x || []) })
    return () => { on = false }
  }, [api, id, store.tick])

  // ---- sheets ----
  const [openRoutine, setOpenRoutine] = useState(routineId || '')
  const [creating, setCreating] = useState(false)
  const [edit, setEdit] = useState<EditKey | null>(null)
  const [grouping, setGrouping] = useState(false)
  const groups = useMemo(() => [...new Set((store.mates || []).map((m) => String(m.group || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh')), [store.mates])
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [busy, setBusy] = useState(false)

  const update = async (patch: Partial<Pick<Mate, 'name' | 'title' | 'description' | 'pinned' | 'notify' | 'group'>>) => {
    if (!api || !mate) return
    setErr('')
    store.putMate({ ...mate, ...patch }) // the switch moves at once; the server's copy replaces it
    try { const d = await api.mateUpdate(id, patch); if (d.mate) store.putMate(d.mate) } catch (e) { store.putMate(mate); setErr(errText(e)) }
  }
  const remove = async () => {
    if (!api || busy) return
    setBusy(true); setErr('')
    try { await api.mateRemove(id); store.dropMate(id); setConfirmRemove(false); nav.reset({ name: 'home' }); store.refresh().catch(() => {}) } catch (e) { setErr(errText(e)); setConfirmRemove(false) } finally { setBusy(false) }
  }

  if (!mate) {
    return (
      <Screen>
        <TopBar left={<IconBtn name="chevron-back-outline" label="返回" onPress={nav.pop} />} />
        <View style={styles.center}>{store.mates ? <Empty text="没有这位同事。" /> : <ActivityIndicator color={color.fg2} />}</View>
      </Screen>
    )
  }

  const routine = routines ? routines.find((r) => r.id === openRoutine) || null : null
  return (
    <Screen>
      <TopBar left={<IconBtn name="chevron-back-outline" label="返回" onPress={nav.pop} />} />
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <View style={styles.who}>
          <Avatar id={mate.id || mate.name} char={glyphOf(mate)} isDefault={mate.isDefault} working={mate.state === 'working'} dim={52} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Title>{mate.name}</Title>
            {mate.title ? <Meta>{mate.title}</Meta> : null}
          </View>
        </View>
        {err ? <Text style={styles.err}>{err}</Text> : null}

        <Section label="例行" right={<Ghost icon="add-outline" label="新例行" onPress={() => setCreating(true)} />} />
        {routines === null ? <ActivityIndicator color={color.meta} style={{ alignSelf: 'flex-start' }} />
          : routines.length ? (
            <ListBox>
              {routines.map((r) => <Row key={r.id} glyph={r.kind === 'remind' ? 'notifications-outline' : 'repeat-outline'} title={r.title} sub={r.scheduleLabel} state={routineState(r)} onPress={() => setOpenRoutine(r.id)} chevron />)}
            </ListBox>
          ) : <Empty text="还没有例行" />}

        <Section label="设置" />
        <ListBox>
          <Row title="名字" state={mate.name} onPress={() => setEdit('name')} chevron />
          <Row title="头衔" state={mate.title || '无'} onPress={() => setEdit('title')} chevron />
          <Row title="职责" sub={mate.description || '无'} onPress={() => setEdit('description')} chevron />
          <Row title="分组" state={mate.group || '其他'} onPress={() => setGrouping(true)} chevron />
          <SwitchRow label="置顶" value={!!mate.pinned} onChange={(v) => { update({ pinned: v }) }} />
          <SwitchRow label="通知" value={!!mate.notify} onChange={(v) => { update({ notify: v }) }} />
        </ListBox>
        {!mate.isDefault ? <Btn label="删除这位同事" kind="danger" icon="trash-outline" onPress={() => setConfirmRemove(true)} style={styles.remove} /> : null}

        <Section label="文件" right={files && files.length > FILES ? <Ghost label="全部" onPress={() => nav.push({ name: 'files', mateId: id })} /> : undefined} />
        {files === null ? <ActivityIndicator color={color.meta} style={{ alignSelf: 'flex-start' }} />
          : files.length ? (
            <View style={styles.files}>{files.slice(0, FILES).map((d) => <ThreadRow key={d.id} glyph={d.kind === 'report' ? 'newspaper-outline' : 'document-text-outline'} title={d.title} time={fmtWhen(d.createdAt)} onPress={() => nav.push({ name: 'file', id: d.id })} />)}</View>
          ) : <Empty text="还没有文件" />}
      </ScrollView>

      {routine ? <RoutineSheet key={routine.id} routine={routine} onClose={() => setOpenRoutine('')} onChanged={loadRoutines} onOpenRun={(runId) => { setOpenRoutine(''); nav.openMate(id, runId) }} /> : null}
      <NewRoutineSheet open={creating} mateId={id} onClose={() => setCreating(false)} onCreated={(r) => { setCreating(false); setRoutines((x) => [...(x || []).filter((y) => y.id !== r.id), r]); loadRoutines() }} />
      {grouping ? <GroupSheet value={mate.group || ''} groups={groups} onClose={() => setGrouping(false)} onSave={(v) => { setGrouping(false); if (v !== (mate.group || '')) update({ group: v }) }} /> : null}
      {edit ? <EditSheet key={edit} label={EDIT_LABEL[edit]} value={String(mate[edit] || '')} multiline={edit === 'description'} required={edit !== 'title'} onClose={() => setEdit(null)} onSave={(v) => { setEdit(null); update({ [edit]: v }) }} /> : null}
      <Sheet open={confirmRemove} onClose={() => setConfirmRemove(false)} title={`删除「${mate.name}」？对话、例行和文件夹一起删。`}>
        <SheetItem icon="trash-outline" label="删除" danger onPress={() => { remove() }} />
        <SheetItem label="取消" onPress={() => setConfirmRemove(false)} />
      </Sheet>
    </Screen>
  )
}

const isOnce = (r: Routine) => !!r.schedule && r.schedule.type === 'once'
const routineState = (r: Routine) => (!r.enabled ? (isOnce(r) ? '已结束' : '已暂停') : r.nextRunAt ? '下次 ' + fmtWhen(r.nextRunAt) : '')

function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: color.bubble, true: color.primary }} thumbColor={value ? color.onPrimary : color.muted} ios_backgroundColor={color.bubble} />
    </View>
  )
}

/** One field in a sheet: 名字 / 头衔 / 职责. 保存 is live only when it changed (and, for the required ones, is not empty). */
function EditSheet({ label, value, multiline, required, onClose, onSave }: { label: string; value: string; multiline?: boolean; required?: boolean; onClose: () => void; onSave: (v: string) => void }) {
  const [v, setV] = useState(value)
  const next = v.trim()
  const can = next !== value.trim() && (!required || !!next)
  return (
    <Sheet open onClose={onClose} title={label}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetBox}>
        <Field value={v} onChange={setV} placeholder={label} autoFocus multiline={multiline} onSubmit={can ? () => onSave(next) : undefined} />
        <Btn label="保存" kind="primary" onPress={() => onSave(next)} disabled={!can} style={{ alignSelf: 'flex-end' }} />
      </KeyboardAvoidingView>
    </Sheet>
  )
}

/**
 * 分组: one short name (12 characters, as the server keeps it) or nothing for 其他. The names already in use are one tap
 * each; 移到其他 clears it.
 */
function GroupSheet({ value, groups, onClose, onSave }: { value: string; groups: string[]; onClose: () => void; onSave: (v: string) => void }) {
  const [v, setV] = useState(value)
  const next = v.replace(/\s+/g, ' ').trim().slice(0, 12)
  const can = next !== value.trim()
  return (
    <Sheet open onClose={onClose} title="分组">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetBox}>
        <Field value={v} onChange={(x) => setV(x.slice(0, 12))} placeholder="其他" autoFocus onSubmit={can ? () => onSave(next) : undefined} />
        {groups.length ? (
          <View style={styles.chips}>
            {groups.map((g) => (
              <Pressable key={g} onPress={() => onSave(g)} accessibilityRole="button" accessibilityState={{ selected: g === value }} style={({ pressed }) => [styles.chip, g === value && styles.chipOn, pressed && { opacity: 0.7 }]}>
                <Text style={[styles.chipText, g === value && { color: color.fg }]} numberOfLines={1}>{g}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={styles.sheetActions}>
          {value ? <Btn label="移到其他" onPress={() => onSave('')} /> : null}
          <Btn label="保存" kind="primary" onPress={() => onSave(next)} disabled={!can} />
        </View>
      </KeyboardAvoidingView>
    </Sheet>
  )
}

function NewRoutineSheet({ open, mateId, onClose, onCreated }: { open: boolean; mateId: string; onClose: () => void; onCreated: (r: Routine) => void }) {
  const { api } = useConn()
  const [v, setV] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => { if (open) { setV(''); setErr('') } }, [open])
  const create = async () => {
    const input = v.trim()
    if (!api || !input || busy) return
    setBusy(true); setErr('')
    try { const d = await api.routineCreate(mateId, input); onCreated(d.routine) } catch (e) { setErr(errText(e)) } finally { setBusy(false) }
  }
  return (
    <Sheet open={open} onClose={onClose} title="新例行">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetBox}>
        <Field value={v} onChange={setV} placeholder="每天 19:00 写日报" autoFocus multiline />
        {err ? <Text style={styles.err}>{err}</Text> : null}
        <Btn label="创建" kind="primary" onPress={() => { create() }} disabled={!v.trim() || busy} style={{ alignSelf: 'flex-end' }} />
      </KeyboardAvoidingView>
    </Sheet>
  )
}

/** A routine, opened in place: the sentence (保存 when changed), 现在跑一次 · 暂停 / 恢复 · 删除, the last 10 runs. */
function RoutineSheet({ routine: r, onClose, onChanged, onOpenRun }: { routine: Routine; onClose: () => void; onChanged: () => Promise<void>; onOpenRun: (runId?: string) => void }) {
  const { api } = useConn()
  const store = useStore()
  const [input, setInput] = useState(r.input || r.title)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [err, setErr] = useState('')
  const act = async (fn: () => Promise<unknown>, after?: () => void) => {
    if (busy) return
    setBusy(true); setErr('')
    try { await fn(); await onChanged(); if (after) after() } catch (e) { setErr(errText(e)) } finally { setBusy(false) }
  }
  const runs = useMemo(() => (r.runs || []).slice().sort((a, b) => time(b.at) - time(a.at)).slice(0, RUNS), [r.runs])
  const changed = input.trim() && input.trim() !== (r.input || r.title).trim()
  const once = isOnce(r)
  const runNow = () => act(async () => {
    if (!api) return
    const d = await api.routineRun(r.id)
    store.refresh().catch(() => {})
    if (r.kind !== 'remind') onOpenRun(d.runId)
  })
  return (
    <Sheet open onClose={onClose} title={[r.kind === 'remind' ? '提醒' : '例行', r.scheduleLabel, routineState(r)].filter(Boolean).join(' · ')}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={styles.sheetBox} keyboardShouldPersistTaps="handled" bounces={false}>
          <Field value={input} onChange={setInput} placeholder="到点替你说的那句话" multiline />
          {changed ? <Btn label="保存" kind="primary" onPress={() => { act(() => (api ? api.routineUpdate(r.id, input.trim()) : Promise.resolve())) }} disabled={busy} style={{ alignSelf: 'flex-end' }} /> : null}
          {err ? <Text style={styles.err}>{err}</Text> : null}
          <View style={styles.actions}>
            <Btn label="现在跑一次" icon="play-outline" onPress={() => { runNow() }} disabled={busy} />
            {!once || r.enabled ? <Btn label={r.enabled ? '暂停' : '恢复'} icon={r.enabled ? 'pause-outline' : 'play-circle-outline'} onPress={() => { act(() => (api ? api.routineEnable(r.id, !r.enabled) : Promise.resolve())) }} disabled={busy} /> : null}
            {confirm
              ? <Btn label="确认删除" kind="danger" icon="trash-outline" onPress={() => { act(() => (api ? api.routineRemove(r.id) : Promise.resolve()), onClose) }} disabled={busy} />
              : <Btn label="删除" kind="danger" icon="trash-outline" onPress={() => setConfirm(true)} disabled={busy} />}
          </View>
          <Text style={styles.sub}>最近运行</Text>
          {runs.length ? (
            <ListBox>
              {runs.map((x, i) => {
                const rid = x.runId || x.taskId // a task routine's receipt names its run taskId, a reminder's runId
                const opens = !!rid && !x.quiet && x.changed !== false
                return <Row key={x.at + i} glyph={x.error ? 'close-circle-outline' : x.fired ? 'notifications-outline' : 'checkmark-outline'} tone={x.error ? 'danger' : 'meta'} title={fmtDate(x.at)} state={runWord(x)} stateTone={x.error ? 'danger' : undefined} onPress={opens ? () => onOpenRun(rid) : undefined} chevron={opens} />
              })}
            </ListBox>
          ) : <Empty text="还没跑过" />}
        </ScrollView>
      </KeyboardAvoidingView>
    </Sheet>
  )
}

const runWord = (x: RoutineRun) => (x.error ? '失败' : x.fired ? '提醒' : x.quiet || x.changed === false ? '没有变化' : x.report ? '已出报告' : x.changed === true ? '有变化' : '完成')

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  who: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingTop: space.xs },
  err: { fontSize: size.meta, lineHeight: 18, color: color.danger, marginTop: space.sm },
  remove: { alignSelf: 'flex-start', marginTop: space.md, marginLeft: -8 },
  files: { marginHorizontal: -10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, paddingVertical: 8, paddingHorizontal: 16 },
  switchLabel: { fontSize: size.ui, lineHeight: 22, fontWeight: '500', color: color.fg },
  sheetBox: { paddingHorizontal: 12, paddingTop: 4, gap: space.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  sub: { fontSize: size.small, lineHeight: 18, fontWeight: '500', color: color.muted, marginTop: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { height: 32, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: color.border, backgroundColor: color.input },
  chipOn: { borderColor: color.borderStrong, backgroundColor: color.bubble },
  chipText: { fontSize: 14, lineHeight: 18, color: color.fg2 },
  sheetActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm },
})
