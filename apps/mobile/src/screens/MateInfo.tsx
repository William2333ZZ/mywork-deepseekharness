/**
 * The teammate's page — the phone's right panel (TEAMMATES.md §9.5 / §9.6), about this one teammate only, in two tabs
 * like the web's panel:
 *   资料    who it is, what it does, when it works, what it remembers — its card (the avatar opens the look; the name, the
 *           title and 类型 open their sheets; MyWork keeps its name and mark, with no title or type), 职责 as text (编辑
 *           opens it), 例行 (a row opens the routine's sheet; finished one-offs fold under 「已结束的 n 个」; 新例行),
 *           它记住的 (the lines of AGENTS.md in its folder; 打开 reads the file), 置顶 · 通知, 删除同事.
 *   文件夹  what it has — 它维护的表 (.csv / .tsv) and 最近的文件 (six, then the rest), each with its kind's icon: tables,
 *           notes and images open here, web pages, PDFs and Office files in the phone's browser; 它交付的文件 opens the
 *           files screen filtered to it.
 * With `routineId` the routine's sheet opens on arrival (「已安排」 lines and search results land here).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ApiError, fmtDate, fmtWhen, type FolderItem, type Look, type Mate, type Routine, type RoutineRun } from '../api'
import { useConn, useNav, useStore } from '../store'
import { Avatar, AvatarPicker, Btn, Empty, Field, Ghost, IconBtn, ListBox, Row, Screen, Section, Sheet, SheetItem, Toggle, TopBar, TypePicker, type IconName } from '../components'
import { color, radius, size, space, themed } from '../theme'
import { cleanType, fileKindOf, glyphOf, openKindOf, time, typesOf } from '../thread'

const RUNS = 10
const RECENT = 6
const MEMORY = 5
const errText = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : String(e))

type EditKey = 'name' | 'title' | 'description'
const EDIT_LABEL: Record<EditKey, string> = { name: '名字', title: '头衔', description: '职责' }
type Tab = 'profile' | 'folder'

/** The bullets of a teammate's AGENTS.md (mywork_remember appends 「- YYYY-MM-DD what」), newest first. */
function memoryOf(text: string): { date: string; text: string }[] {
  return String(text || '').split('\n').map((l) => l.trim()).filter((l) => /^[-*]\s+\S/.test(l)).map((l) => {
    const t = l.replace(/^[-*]\s+/, '')
    const m = t.match(/^(\d{4})-(\d{2})-(\d{2})\s+(.+)$/)
    return m ? { date: Number(m[2]) + '/' + Number(m[3]), text: m[4] } : { date: '', text: t }
  }).reverse()
}

/** A folder file's icon, by how it opens. */
const fileGlyph = (name: string): IconName => fileKindOf(name) === 'table' ? 'grid-outline' : { text: 'document-text-outline', image: 'image-outline', page: 'globe-outline', download: 'document-outline' }[openKindOf(name)] as IconName

export default function MateInfo({ id, routineId }: { id: string; routineId?: string }) {
  const nav = useNav()
  const { api, conn } = useConn()
  const store = useStore()
  const mate = store.mates ? store.mates.find((m) => m.id === id) || null : null
  const [tab, setTab] = useState<Tab>('profile')
  const [err, setErr] = useState('')

  // ---- routines, memory and the folder: on arrival and on every poll ----
  const [routines, setRoutines] = useState<Routine[] | null>(null)
  const [memory, setMemory] = useState<{ path: string; items: { date: string; text: string }[] } | null>(null)
  const [folder, setFolder] = useState<FolderItem[] | null>(null)
  const loadRoutines = useCallback(async () => { if (!api) return; try { const d = await api.routines(id); setRoutines((d.items || []).filter((r) => !r.mateId || r.mateId === id)) } catch { setRoutines((x) => x || []) } }, [api, id])
  useEffect(() => { loadRoutines() }, [loadRoutines, store.tick])
  useEffect(() => {
    if (!api) return
    let on = true
    api.folderFile(id, 'AGENTS.md').then((d) => { if (on) setMemory({ path: d.path || 'AGENTS.md', items: memoryOf(d.text) }) }).catch(() => { if (on) setMemory({ path: '', items: [] }) })
    api.folder(id).then((d) => { if (on) setFolder(d.items || []) }).catch(() => { if (on) setFolder((x) => x || []) })
    return () => { on = false }
  }, [api, id, store.tick])

  // ---- sheets ----
  const [openRoutine, setOpenRoutine] = useState(routineId || '')
  const [creating, setCreating] = useState(false)
  const [edit, setEdit] = useState<EditKey | null>(null)
  const [typing, setTyping] = useState(false)
  const [looking, setLooking] = useState(false)
  const types = useMemo(() => typesOf(store.mates).list, [store.mates])
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [busy, setBusy] = useState(false)
  const [showEnded, setShowEnded] = useState(false)
  const [allMemory, setAllMemory] = useState(false)
  const [allFiles, setAllFiles] = useState(false)
  const [dutyOpen, setDutyOpen] = useState(false)

  const update = async (patch: Partial<Pick<Mate, 'name' | 'title' | 'description' | 'pinned' | 'notify' | 'group'>> & { avatar?: Look }) => {
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
  /** Tables, notes and images open on the folder-file screen; web pages, PDFs and Office files in the phone's browser by a signed link. */
  const openFile = async (f: { name: string; path: string }) => {
    const kind = openKindOf(f.name)
    if (kind === 'text' || kind === 'image') { nav.push({ name: 'folderFile', mateId: id, path: f.path }); return }
    if (!api || !conn) return
    setErr('')
    try { const l = await api.fileLink(id, f.path); await Linking.openURL(conn.base + l.url + (kind === 'download' ? '&dl=1' : '')) } catch (e) { setErr(errText(e)) }
  }

  if (!mate) {
    return (
      <Screen>
        <TopBar left={<IconBtn name="chevron-back-outline" label="返回" onPress={nav.pop} />} />
        <View style={styles.center}>{store.mates ? <Empty text="没有这位同事。" /> : <Text style={styles.wait}>…</Text>}</View>
      </Screen>
    )
  }

  const routine = routines ? routines.find((r) => r.id === openRoutine) || null : null
  const ended = (r: Routine) => !r.enabled && isOnce(r)
  const current = (routines || []).filter((r) => !ended(r))
  const done = (routines || []).filter(ended)
  const endedOpen = showEnded || done.some((r) => r.id === openRoutine)
  const duty = String(mate.description || '').trim()
  const longDuty = duty.length > 120 || duty.split('\n').length > 6
  const tables = (folder || []).filter((f) => fileKindOf(f.name) === 'table')
  const rest = (folder || []).filter((f) => fileKindOf(f.name) !== 'table')
  const fileRow = (f: FolderItem) => <Row key={f.path} glyph={fileGlyph(f.name)} title={f.name} state={fmtWhen(f.modifiedAt)} onPress={() => { openFile(f) }} />
  const pinned = mate.pinned === true || (!!mate.isDefault && mate.pinned !== false)

  return (
    <Screen>
      <TopBar left={<IconBtn name="chevron-back-outline" label="返回" onPress={nav.pop} />} title={
        <View style={styles.tabs} accessibilityRole="tablist">
          {(['profile', 'folder'] as Tab[]).map((k) => (
            <Pressable key={k} onPress={() => setTab(k)} accessibilityRole="tab" accessibilityState={{ selected: tab === k }} hitSlop={6} style={styles.tab}>
              <Text style={[styles.tabText, tab === k && styles.tabOn]}>{k === 'profile' ? '资料' : '文件夹'}</Text>
              {tab === k ? <View style={styles.tabBar} /> : null}
            </Pressable>
          ))}
        </View>
      } />
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        {err ? <Text style={styles.err}>{err}</Text> : null}
        {tab === 'profile' ? (
          <>
            <View style={styles.card}>
              <Pressable onPress={mate.isDefault ? undefined : () => setLooking(true)} disabled={!!mate.isDefault} accessibilityRole="button" accessibilityLabel="换头像" style={({ pressed }) => pressed && { opacity: 0.7 }}>
                <Avatar id={mate.id || mate.name} look={mate.avatar} char={glyphOf(mate)} isDefault={mate.isDefault} working={mate.state === 'working'} dim={56} />
              </Pressable>
              <View style={styles.who}>
                {/* MyWork is the brand: its name stays, and it carries no title or type of its own. */}
                <Pressable onPress={mate.isDefault ? undefined : () => setEdit('name')} disabled={!!mate.isDefault} accessibilityRole="button" accessibilityLabel="名字">
                  <Text style={styles.name} numberOfLines={1}>{mate.name}</Text>
                </Pressable>
                {mate.isDefault && !mate.title ? null : (
                  <Pressable onPress={() => setEdit('title')} accessibilityRole="button" accessibilityLabel="头衔">
                    <Text style={[styles.title, !mate.title && { color: color.meta }]} numberOfLines={2}>{mate.title || '加一个头衔'}</Text>
                  </Pressable>
                )}
                {mate.isDefault ? null : (
                  <Pressable onPress={() => setTyping(true)} accessibilityRole="button" accessibilityLabel="类型" style={styles.type}>
                    <Text style={styles.typeLabel}>类型</Text>
                    <Text style={styles.typeValue}>{mate.group || '其他'}</Text>
                    <Ionicons name="chevron-down" size={12} color={color.meta} />
                  </Pressable>
                )}
              </View>
            </View>

            <Section label="职责" right={<Ghost label="编辑" onPress={() => setEdit('description')} />} />
            {duty ? (
              <>
                <Text style={styles.duty} numberOfLines={longDuty && !dutyOpen ? 8 : undefined}>{duty}</Text>
                {longDuty ? <More label={dutyOpen ? '收起' : '展开全文'} onPress={() => setDutyOpen(!dutyOpen)} /> : null}
              </>
            ) : <Text style={styles.quiet}>还没写职责。写清楚它负责什么，它每次干活前都会读。</Text>}

            <Section label={current.length ? `例行 · ${current.length}` : '例行'} right={<Ghost icon="add-outline" label="新例行" onPress={() => setCreating(true)} />} />
            {routines === null ? <Text style={styles.wait}>…</Text>
              : current.length || endedOpen ? (
                <ListBox>
                  {(endedOpen ? [...current, ...done] : current).map((r) => <Row key={r.id} title={r.title} state={routineState(r)} onPress={() => setOpenRoutine(r.id)} chevron />)}
                </ListBox>
              ) : <Text style={styles.quiet}>还没有例行。说一句带时间的话就能建，例如：每天 9 点给我一份简报。</Text>}
            {done.length ? <More label={endedOpen ? '收起已结束的' : `已结束的 ${done.length} 个`} onPress={() => setShowEnded(!endedOpen)} /> : null}

            <Section label={memory && memory.items.length ? `它记住的 · ${memory.items.length}` : '它记住的'} right={memory && memory.path ? <Ghost label="打开" onPress={() => nav.push({ name: 'folderFile', mateId: id, path: memory.path })} /> : undefined} />
            {memory === null ? <Text style={styles.wait}>…</Text>
              : memory.items.length ? (
                <View style={styles.mems}>
                  {(allMemory ? memory.items : memory.items.slice(0, MEMORY)).map((x, i) => (
                    <View key={i} style={styles.mem}><Text style={styles.memDate}>{x.date}</Text><Text style={styles.memText}>{x.text}</Text></View>
                  ))}
                  {memory.items.length > MEMORY ? <More label={allMemory ? '收起' : `显示全部 ${memory.items.length} 条`} onPress={() => setAllMemory(!allMemory)} /> : null}
                </View>
              ) : <Text style={styles.quiet}>还没记住什么。跟它说「记住……」，就会记在这里。</Text>}

            <Section label="设置" />
            <ListBox>
              <SwitchRow label="置顶" value={pinned} onChange={(v) => { update({ pinned: v }) }} />
              <SwitchRow label="通知" value={mate.notify !== false} onChange={(v) => { update({ notify: v }) }} />
            </ListBox>
            {!mate.isDefault ? <Btn label="删除同事" kind="danger" onPress={() => setConfirmRemove(true)} style={styles.remove} /> : null}
          </>
        ) : (
          <>
            <Section label={folder && folder.length ? `文件夹 · ${folder.length >= 30 ? '30+' : folder.length}` : '文件夹'} />
            {folder === null ? <Text style={styles.wait}>…</Text>
              : !folder.length ? <Text style={styles.quiet}>文件夹还是空的。它写的表、抓的网页、做的文件都放在这里。</Text>
                : (
                  <>
                    {tables.length ? <Text style={styles.label}>它维护的表</Text> : null}
                    {tables.length ? <ListBox>{tables.map(fileRow)}</ListBox> : null}
                    {rest.length ? <Text style={styles.label}>最近的文件</Text> : null}
                    {rest.length ? <ListBox>{(allFiles ? rest : rest.slice(0, RECENT)).map(fileRow)}</ListBox> : null}
                    {rest.length > RECENT ? <More label={allFiles ? '收起' : `再显示 ${rest.length - RECENT} 个`} onPress={() => setAllFiles(!allFiles)} /> : null}
                  </>
                )}
            <Section label="交付" />
            <ListBox><Row glyph="documents-outline" title="它交付的文件" onPress={() => nav.push({ name: 'files', mateId: id })} chevron /></ListBox>
          </>
        )}
      </ScrollView>

      {routine ? <RoutineSheet key={routine.id} routine={routine} onClose={() => setOpenRoutine('')} onChanged={loadRoutines} onOpenRun={(runId) => { setOpenRoutine(''); nav.openMate(id, runId) }} /> : null}
      <NewRoutineSheet open={creating} mateId={id} onClose={() => setCreating(false)} onCreated={(r) => { setCreating(false); setRoutines((x) => [...(x || []).filter((y) => y.id !== r.id), r]); loadRoutines() }} />
      {typing ? <TypeSheet value={mate.group || ''} types={types} onClose={() => setTyping(false)} onSave={(v) => { setTyping(false); if (v !== (mate.group || '')) update({ group: v }) }} /> : null}
      {looking ? <LookSheet mate={mate} onClose={() => setLooking(false)} onSave={(look) => { setLooking(false); update({ avatar: look }) }} /> : null}
      {edit ? <EditSheet key={edit} label={EDIT_LABEL[edit]} value={String(mate[edit] || '')} multiline={edit === 'description'} required={edit !== 'title'} onClose={() => setEdit(null)} onSave={(v) => { setEdit(null); update({ [edit]: v }) }} /> : null}
      <Sheet open={confirmRemove} onClose={() => setConfirmRemove(false)} title={`删除「${mate.name}」？对话、例行和文件夹一起删。`}>
        <SheetItem label="删除" danger onPress={() => { remove() }} />
        <SheetItem label="取消" onPress={() => setConfirmRemove(false)} />
      </Sheet>
    </Screen>
  )
}

/** A quiet 13px link under a list: 展开全文 / 再显示 n 个 / 已结束的 n 个. */
function More({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="button" hitSlop={6} style={({ pressed }) => [styles.more, pressed && { opacity: 0.6 }]}><Text style={styles.moreText}>{label}</Text></Pressable>
}

const isOnce = (r: Routine) => !!r.schedule && r.schedule.type === 'once'
/** A routine's one word: its schedule, or 已暂停 / 已结束 (下次 lives in its sheet). */
const routineState = (r: Routine) => (!r.enabled ? (isOnce(r) ? '已结束' : '已暂停') : r.scheduleLabel || '')
const nextWord = (r: Routine) => (r.enabled && r.nextRunAt ? '下次 ' + fmtWhen(r.nextRunAt) : '')

function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Toggle value={value} onChange={onChange} label={label} />
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

/** 类型: the types in use, 其他, or a new one (12 characters); it is the list's section. 保存 when it changed. */
function TypeSheet({ value, types, onClose, onSave }: { value: string; types: string[]; onClose: () => void; onSave: (v: string) => void }) {
  const [v, setV] = useState(value)
  const next = cleanType(v)
  return (
    <Sheet open onClose={onClose} title="类型">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetBox}>
        <TypePicker value={v} types={types} onChange={setV} />
        <Btn label="保存" kind="primary" onPress={() => onSave(next)} disabled={next === value.trim()} style={{ alignSelf: 'flex-end' }} />
      </KeyboardAvoidingView>
    </Sheet>
  )
}

/** 头像: the live preview and the web's picker (8 colours × 4 shapes); 保存 when it changed. */
function LookSheet({ mate, onClose, onSave }: { mate: Mate; onClose: () => void; onSave: (look: Look) => void }) {
  const start: Look = { color: mate.avatar && mate.avatar.color ? mate.avatar.color : 'slate', shape: mate.avatar && mate.avatar.shape ? mate.avatar.shape : 'circle' }
  const [look, setLook] = useState<Look>(start)
  const changed = look.color !== start.color || look.shape !== start.shape
  return (
    <Sheet open onClose={onClose} title="头像">
      <View style={[styles.sheetBox, { flexDirection: 'row', alignItems: 'flex-start', gap: space.lg }]}>
        <Avatar id={mate.id} look={look} dim={56} />
        <View style={{ flex: 1 }}><AvatarPicker look={look} onChange={setLook} /></View>
      </View>
      <View style={[styles.sheetBox, { paddingTop: space.md }]}>
        <Btn label="保存" kind="primary" onPress={() => onSave(look)} disabled={!changed} style={{ alignSelf: 'flex-end' }} />
      </View>
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
    <Sheet open onClose={onClose} title={[r.kind === 'remind' ? '提醒' : '例行', r.scheduleLabel, r.enabled ? nextWord(r) : routineState(r)].filter(Boolean).join(' · ')}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={styles.sheetBox} keyboardShouldPersistTaps="handled" bounces={false}>
          <Field value={input} onChange={setInput} placeholder="到点替你说的那句话" multiline />
          {changed ? <Btn label="保存" kind="primary" onPress={() => { act(() => (api ? api.routineUpdate(r.id, input.trim()) : Promise.resolve())) }} disabled={busy} style={{ alignSelf: 'flex-end' }} /> : null}
          {err ? <Text style={styles.err}>{err}</Text> : null}
          <View style={styles.actions}>
            <Btn label="现在跑一次" onPress={() => { runNow() }} disabled={busy} />
            {!once || r.enabled ? <Btn label={r.enabled ? '暂停' : '恢复'} onPress={() => { act(() => (api ? api.routineEnable(r.id, !r.enabled) : Promise.resolve())) }} disabled={busy} /> : null}
            {confirm
              ? <Btn label="确认删除" kind="danger" onPress={() => { act(() => (api ? api.routineRemove(r.id) : Promise.resolve()), onClose) }} disabled={busy} />
              : <Btn label="删除" kind="danger" onPress={() => setConfirm(true)} disabled={busy} />}
          </View>
          <Text style={styles.sub}>最近运行</Text>
          {runs.length ? (
            <ListBox>
              {runs.map((x, i) => {
                const rid = x.runId || x.taskId // a task routine's receipt names its run taskId, a reminder's runId
                const opens = !!rid && !x.quiet && x.changed !== false
                return <Row key={x.at + i} title={fmtDate(x.at)} state={runWord(x)} stateTone={x.error ? 'danger' : undefined} onPress={opens ? () => onOpenRun(rid) : undefined} chevron={opens} />
              })}
            </ListBox>
          ) : <Empty text="还没跑过" />}
        </ScrollView>
      </KeyboardAvoidingView>
    </Sheet>
  )
}

const runWord = (x: RoutineRun) => (x.error ? '失败' : x.fired ? '提醒' : x.quiet || x.changed === false ? '没有变化' : x.report ? '已出报告' : x.changed === true ? '有变化' : '完成')

const styles = themed(() => ({
  wrap: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', gap: space.xl },
  tab: { height: 40, justifyContent: 'center' },
  tabText: { fontSize: size.ui, fontWeight: '500', color: color.meta },
  tabOn: { color: color.fg },
  tabBar: { position: 'absolute', left: 0, right: 0, bottom: 2, height: 2, borderRadius: 1, backgroundColor: color.primary },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingTop: space.sm, paddingBottom: space.xs },
  who: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: 20, lineHeight: 28, fontWeight: '600', color: color.fg },
  title: { fontSize: 13, lineHeight: 20, color: color.fg2 },
  type: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, alignSelf: 'flex-start' },
  typeLabel: { fontSize: 12, lineHeight: 16, color: color.meta },
  typeValue: { fontSize: 13, lineHeight: 18, color: color.fg },
  duty: { fontSize: 14, lineHeight: 24, color: color.fg },
  quiet: { fontSize: 13, lineHeight: 20, color: color.meta },
  label: { fontSize: 12, lineHeight: 16, color: color.meta, marginTop: space.sm, marginBottom: space.sm },
  mems: { gap: 2 },
  mem: { flexDirection: 'row', gap: space.sm, paddingVertical: 4 },
  memDate: { width: 40, fontSize: 12, lineHeight: 22, color: color.meta, fontVariant: ['tabular-nums'] },
  memText: { flex: 1, fontSize: 14, lineHeight: 22, color: color.fg },
  more: { alignSelf: 'flex-start', paddingVertical: 6 },
  moreText: { fontSize: 13, lineHeight: 18, color: color.meta },
  err: { fontSize: size.meta, lineHeight: 20, color: color.danger, marginTop: space.sm },
  remove: { alignSelf: 'flex-start', marginTop: space.md, marginLeft: -8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, paddingVertical: 8, paddingHorizontal: 16 },
  switchLabel: { fontSize: size.ui, lineHeight: 22, fontWeight: '500', color: color.fg },
  sheetBox: { paddingHorizontal: 8, paddingTop: 4, gap: space.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  sub: { fontSize: size.small, lineHeight: 16, fontWeight: '500', color: color.meta, marginTop: space.sm },
  sheetActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm },
  wait: { fontSize: 13, color: color.meta },
}))
