/**
 * MyWork mobile — the few pieces every screen is built from. Same rules as the web contract:
 * one list recipe, lists carry no actions, the composer never changes colour, no hint captions.
 */
import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Animated, Modal, Pressable, StyleSheet, Text, TextInput, View, type ViewStyle, type TextStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Markdown from 'react-native-markdown-display'
import { Ionicons } from '@expo/vector-icons'
import { color, font, radius, size, space } from './theme'

export type IconName = React.ComponentProps<typeof Ionicons>['name']

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <SafeAreaView style={[styles.screen, style]} edges={['top', 'left', 'right']}>{children}</SafeAreaView>
}

/** Top bar: left control, a title that may be a button, right control. 52px, no border. */
export function TopBar({ left, title, right, onTitle }: { left?: React.ReactNode; title?: string; right?: React.ReactNode; onTitle?: () => void }) {
  return (
    <View style={styles.bar}>
      <View style={styles.barSide}>{left}</View>
      {title ? (
        onTitle ? (
          <Pressable onPress={onTitle} style={styles.barTitleBtn} hitSlop={8}>
            <Text style={styles.barTitle} numberOfLines={1}>{title}</Text>
            <Ionicons name="chevron-forward" size={14} color={color.meta} />
          </Pressable>
        ) : <Text style={[styles.barTitle, { flex: 1, textAlign: 'center' }]} numberOfLines={1}>{title}</Text>
      ) : <View style={{ flex: 1 }} />}
      <View style={[styles.barSide, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  )
}

export function IconBtn({ name, onPress, label, size: s = 22, tone }: { name: IconName; onPress: () => void; label: string; size?: number; tone?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} accessibilityRole="button" hitSlop={6} style={({ pressed }) => [styles.iconBtn, pressed && { backgroundColor: color.surface }]}>
      <Ionicons name={name} size={s} color={tone || color.fg2} />
    </Pressable>
  )
}

/** The brand mark: an M whose last stroke turns into a check. Drawn with two rotated strokes so it needs no SVG dependency. */
export function Mark({ dim = 22, live }: { dim?: number; live?: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current
  useEffect(() => {
    if (!live) { pulse.setValue(1); return }
    const loop = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }), Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true })]))
    loop.start(); return () => loop.stop()
  }, [live, pulse])
  return (
    <View style={{ width: dim, height: dim, borderRadius: dim * 0.23, backgroundColor: color.fg, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.Text style={{ color: color.warmWhite, fontSize: dim * 0.62, fontWeight: '700', lineHeight: dim * 0.75, opacity: pulse, fontFamily: font.display }}>M</Animated.Text>
    </View>
  )
}

export function Title({ children, style }: { children: React.ReactNode; style?: TextStyle }) { return <Text style={[styles.title, style]}>{children}</Text> }
export function Meta({ children, style }: { children: React.ReactNode; style?: TextStyle }) { return <Text style={[styles.meta, style]}>{children}</Text> }
export function Body({ children, style }: { children: React.ReactNode; style?: TextStyle }) { return <Text style={[styles.body, style]}>{children}</Text> }
export function Section({ label, right }: { label: string; right?: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionLabel}>{label}</Text>{right}</View>
}
export function Empty({ text }: { text: string }) { return <Text style={styles.empty}>{text}</Text> }

/** One list recipe: a whisper-bordered box, rows divided by soft lines. Rows carry no actions. */
export function ListBox({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const kids = React.Children.toArray(children).filter(Boolean)
  return <View style={[styles.listBox, style]}>{kids.map((k, i) => <View key={i} style={i > 0 ? styles.rowDivider : undefined}>{k}</View>)}</View>
}
export type Tone = 'live' | 'success' | 'danger' | 'warn' | 'meta'
const toneColor: Record<Tone, string> = { live: color.fg2, success: color.success, danger: color.danger, warn: color.warn, meta: color.meta }
export function Row({ glyph, tone = 'meta', spin, title, sub, state, stateTone, onPress, chevron }: { glyph?: IconName; tone?: Tone; spin?: boolean; title: string; sub?: string; state?: string; stateTone?: Tone; onPress?: () => void; chevron?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: color.surface }]}>
      {glyph || spin ? <View style={styles.rowGlyph}>{spin ? <ActivityIndicator size="small" color={color.fg2} /> : <Ionicons name={glyph as IconName} size={18} color={toneColor[tone]} />}</View> : null}
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
        {sub ? <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {state ? <Text style={[styles.rowState, stateTone ? { color: toneColor[stateTone] } : null]} numberOfLines={1}>{state}</Text> : null}
      {chevron ? <Ionicons name="chevron-forward" size={16} color={color.meta} /> : null}
    </Pressable>
  )
}

/**
 * The column's one row shape (TEAMMATES.md §8.2): glyph 20px · title 15px (600 when unread) · time right-aligned tabular ·
 * unread dot 6px · one line of preview 13px muted. Rows carry no actions; opening the row is the only thing it does.
 * `glyph` is an icon name or a ready element (the 今日 row's Mark); `spin` draws the running spinner instead.
 */
export function ThreadRow({ glyph, tone = 'meta', spin, title, time, unread, preview, onPress, current }: { glyph?: IconName | React.ReactNode; tone?: Tone; spin?: boolean; title: string; time?: string; unread?: boolean; preview?: string; onPress: () => void; current?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.trow, (pressed || current) && { backgroundColor: color.surface }]}>
      <View style={styles.trowGlyph}>{spin ? <ActivityIndicator size="small" color={color.fg2} /> : typeof glyph === 'string' ? <Ionicons name={glyph as IconName} size={20} color={toneColor[tone]} /> : glyph}</View>
      <View style={styles.trowMain}>
        <View style={styles.trowLine}>
          <Text style={[styles.trowTitle, unread && { fontWeight: '600' }]} numberOfLines={1}>{title}</Text>
          {time ? <Text style={styles.trowTime}>{time}</Text> : null}
          {unread ? <View style={styles.trowDot} /> : null}
        </View>
        {preview ? <Text style={styles.trowSub} numberOfLines={1}>{preview}</Text> : null}
      </View>
    </Pressable>
  )
}

/** A date separator in a thread (「9月29日」 in a routine's runs, the day line when reading back in 今日). */
export function DateLine({ text }: { text: string }) {
  return <View style={styles.dateLine}><View style={styles.dateRule} /><Text style={styles.dateText}>{text}</Text><View style={styles.dateRule} /></View>
}

/** ✓ countable results, one per line, as a plain list: no box, no border (§8.3). */
export function ResultRows({ rows }: { rows: { label: string; value: string }[] }) {
  if (!rows.length) return null
  return (
    <View style={styles.results}>
      {rows.map((r, i) => (
        <View key={i} style={styles.resultRow}>
          <Ionicons name="checkmark-outline" size={16} color={color.success} />
          <Text style={styles.resultLabel}>{r.label}</Text>
          <Text style={styles.resultValue} numberOfLines={1}>{String(r.value === undefined || r.value === null ? '' : r.value)}</Text>
        </View>
      ))}
    </View>
  )
}

/**
 * One meta line under a delivery: the verification words read live (核验中 / 已核验 · 核对 n · 问题 m / 核验发现 n 处 / 未能核验),
 * then the rating ghosts. The verdict opens the verifier's notes when there are any.
 */
export function VerifyLine({ words, tone = 'meta', notes, rating, onRate }: { words: string; tone?: Tone; notes?: string; rating: number | null | undefined; onRate: (r: number) => void }) {
  const [open, setOpen] = useState(false)
  const hasNotes = !!notes
  const glyph: IconName | '' = tone === 'success' ? 'checkmark-outline' : tone === 'warn' ? 'close-circle-outline' : tone === 'live' ? 'time-outline' : words ? 'remove-outline' : ''
  return (
    <View>
      <View style={styles.verifyLine}>
        {words ? (
          <Pressable onPress={() => { if (hasNotes) setOpen(!open) }} disabled={!hasNotes} style={styles.verdict} accessibilityRole={hasNotes ? 'button' : undefined} accessibilityState={hasNotes ? { expanded: open } : undefined}>
            {glyph ? <Ionicons name={glyph} size={13} color={toneColor[tone]} /> : null}
            <Text style={[styles.verdictText, { color: toneColor[tone] }, hasNotes && { textDecorationLine: 'underline', textDecorationStyle: 'dotted' }]} numberOfLines={1}>{words}</Text>
          </Pressable>
        ) : null}
        {words ? <Text style={styles.verdictSep}>·</Text> : null}
        <Ghost icon="checkmark-outline" label="有用" on={rating === 1} onPress={() => onRate(1)} />
        <Ghost icon="close-outline" label="没用" on={rating === -1} onPress={() => onRate(-1)} />
      </View>
      {open && hasNotes ? <Text style={styles.notes}>{notes}</Text> : null}
    </View>
  )
}

/** A ghost button whose text and icon darken when it is the chosen one (有用 / 没用, 再来一次). */
export function Ghost({ icon, label, on, onPress, disabled }: { icon?: IconName; label: string; on?: boolean; onPress: () => void; disabled?: boolean }) {
  const tone = on ? color.fg : color.muted
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ selected: !!on }} style={({ pressed }) => [styles.ghost, on && { backgroundColor: color.surface }, disabled && { opacity: 0.45 }, pressed && { opacity: 0.7 }]}>
      {icon ? <Ionicons name={icon} size={15} color={tone} /> : null}
      <Text style={[styles.ghostText, { color: tone }]}>{label}</Text>
    </Pressable>
  )
}

/** Conversation turns, the Grok shape: the user's words in a bubble on the right, the reply as plain text. */
export function Bubble({ text }: { text: string }) {
  return <View style={styles.bubbleWrap}><View style={styles.bubble}><Text style={styles.bubbleText}>{text}</Text></View></View>
}
export function Reply({ markdown }: { markdown: string }) { return <View style={styles.reply}><Prose markdown={markdown} /></View> }
/** One pulsing line while something runs: 「在想…」 in 今日, 「在做 · 步骤 · 耗时」 (no ellipsis) in a task. */
export function Thinking({ text = '在想', tail = '…' }: { text?: string; tail?: string }) {
  const op = useRef(new Animated.Value(0.35)).current
  useEffect(() => { const loop = Animated.loop(Animated.sequence([Animated.timing(op, { toValue: 1, duration: 800, useNativeDriver: true }), Animated.timing(op, { toValue: 0.35, duration: 800, useNativeDriver: true })])); loop.start(); return () => loop.stop() }, [op])
  return <Animated.Text style={[styles.body, { color: color.muted, opacity: op, fontVariant: ['tabular-nums'] }]}>{text}{tail}</Animated.Text>
}
/**
 * A hand-off row in the 今日 line: what the assistant handed to a task or a routine, with the task's live state as its
 * second line (查阅 · 40s → ✓ 已交付 · 已核验). It is the delivery card too: opening it is the task thread. The one
 * button it may carry is 再来一次 after a failure.
 */
export function HandoffChip({ label, sub, glyph = 'time-outline', spin, tone = 'live', onPress, action, actionLabel = '再来一次', busy }: { label: string; sub?: string; glyph?: IconName; spin?: boolean; tone?: Tone; onPress: () => void; action?: () => void; actionLabel?: string; busy?: boolean }) {
  return (
    <View style={styles.handoff}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.handoffMain, pressed && { backgroundColor: color.surface }]}>
        <View style={styles.handoffIc}>{spin ? <ActivityIndicator size="small" color={color.fg2} /> : <Ionicons name={glyph} size={15} color={toneColor[tone]} />}</View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.handoffTitle} numberOfLines={1}>{label}</Text>
          {sub ? <Text style={[styles.handoffSub, tone === 'danger' && { color: color.danger }]} numberOfLines={1}>{sub}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={14} color={color.meta} />
      </Pressable>
      {action ? <Btn label={actionLabel} onPress={action} disabled={busy} /> : null}
    </View>
  )
}

/** Markdown at reading size. Titles in the serif, like the web. */
export function Prose({ markdown }: { markdown: string }) {
  return <Markdown style={mdStyles}>{markdown || ''}</Markdown>
}

/** The composer: a rounded field with a round send button. Neutral, never changes colour. */
export function Composer({ value, onChange, onSend, placeholder, busy, disabled, autoFocus, big }: { value: string; onChange: (v: string) => void; onSend: () => void; placeholder: string; busy?: boolean; disabled?: boolean; autoFocus?: boolean; big?: boolean }) {
  const can = !!value.trim() && !busy && !disabled
  return (
    <View style={[styles.composer, big && styles.composerBig]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={color.meta}
        multiline
        autoFocus={autoFocus}
        editable={!disabled}
        style={[styles.composerInput, big && { minHeight: 96, textAlignVertical: 'top' }]}
        onSubmitEditing={can ? onSend : undefined}
        blurOnSubmit={false}
      />
      <Pressable onPress={onSend} disabled={!can} accessibilityLabel="发送" style={[styles.send, can ? styles.sendOn : styles.sendOff]}>
        {busy ? <ActivityIndicator size="small" color={can ? color.bg : color.meta} /> : <Ionicons name="arrow-up" size={18} color={can ? color.bg : color.meta} />}
      </Pressable>
    </View>
  )
}

export function Btn({ label, onPress, kind = 'ghost', icon, disabled, style }: { label: string; onPress: () => void; kind?: 'ghost' | 'primary' | 'danger'; icon?: IconName; disabled?: boolean; style?: ViewStyle }) {
  const txt = kind === 'primary' ? color.bg : kind === 'danger' ? color.danger : color.fg2
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.btn, kind === 'primary' && styles.btnPrimary, kind === 'ghost' && styles.btnGhost, disabled && { opacity: 0.45 }, pressed && { opacity: 0.7 }, style]}>
      {icon ? <Ionicons name={icon} size={15} color={txt} /> : null}
      <Text style={[styles.btnText, { color: txt }]}>{label}</Text>
    </Pressable>
  )
}

export function Field({ value, onChange, placeholder, icon, autoFocus, onSubmit, mono, clearable, style }: { value: string; onChange: (v: string) => void; placeholder: string; icon?: IconName; autoFocus?: boolean; onSubmit?: () => void; mono?: boolean; clearable?: boolean; style?: ViewStyle }) {
  return (
    <View style={[styles.field, style]}>
      {icon ? <Ionicons name={icon} size={16} color={color.meta} /> : null}
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={color.meta} autoFocus={autoFocus} autoCapitalize="none" autoCorrect={false} onSubmitEditing={onSubmit} returnKeyType={onSubmit ? 'go' : clearable ? 'search' : 'done'} style={[styles.fieldInput, mono && { fontFamily: font.mono, fontSize: 14 }]} />
      {clearable && value ? <Pressable onPress={() => onChange('')} accessibilityLabel="清除" hitSlop={8}><Ionicons name="close-circle" size={16} color={color.meta} /></Pressable> : null}
    </View>
  )
}

/** A bottom sheet for the few places that need a choice: the ··· menu, a delete confirm, 等你看. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        {title ? <Text style={styles.sheetTitle}>{title}</Text> : null}
        {children}
      </View>
    </Modal>
  )
}
export function SheetItem({ icon, label, onPress, danger }: { icon?: IconName; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: color.surface }]}>
      {icon ? <Ionicons name={icon} size={18} color={danger ? color.danger : color.fg2} /> : null}
      <Text style={[styles.sheetItemText, danger && { color: color.danger }]}>{label}</Text>
    </Pressable>
  )
}

/** Two lines by default, the whole text on tap: verifier notes, mid-run notes. */
export function Folded({ text, lines = 2, style }: { text: string; lines?: number; style?: TextStyle }) {
  const [open, setOpen] = useState(false)
  return <Pressable onPress={() => setOpen(!open)}><Text style={[styles.meta, { color: color.muted, lineHeight: 20, fontSize: 14 }, style]} numberOfLines={open ? undefined : lines}>{text}</Text></Pressable>
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  bar: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  barSide: { width: 88, flexDirection: 'row', alignItems: 'center', gap: 4 },
  barTitleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, height: 32, borderRadius: 16, backgroundColor: color.surface, marginHorizontal: 8, paddingHorizontal: 12 },
  barTitle: { fontSize: size.ui, fontWeight: '600', color: color.fg },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: font.display, fontSize: size.title, lineHeight: 36, color: color.fg, fontWeight: '400' },
  meta: { fontSize: size.meta, lineHeight: 18, color: color.meta, fontVariant: ['tabular-nums'] },
  body: { fontSize: size.body, lineHeight: 28, color: color.fg },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xxl, marginBottom: 10, paddingHorizontal: 2 },
  sectionLabel: { fontSize: size.small, lineHeight: 18, fontWeight: '500', letterSpacing: 0.3, color: color.muted },
  empty: { fontSize: size.ui, color: color.muted, paddingVertical: 8, paddingHorizontal: 2 },
  listBox: { borderWidth: 1, borderColor: color.border, borderRadius: radius.lg, backgroundColor: color.bg, overflow: 'hidden' },
  rowDivider: { borderTopWidth: 1, borderTopColor: color.borderSoft },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingVertical: 12, paddingHorizontal: 16 },
  rowGlyph: { width: 20, alignItems: 'center' },
  rowMain: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: size.ui, lineHeight: 22, fontWeight: '500', color: color.fg },
  rowSub: { fontSize: size.meta, lineHeight: 18, color: color.muted },
  rowState: { fontSize: size.meta, color: color.meta, fontVariant: ['tabular-nums'], maxWidth: 140 },
  // the column's row
  trow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingVertical: 8, paddingHorizontal: 10, borderRadius: radius.lg },
  trowGlyph: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  trowMain: { flex: 1, minWidth: 0 },
  trowLine: { flexDirection: 'row', alignItems: 'center' },
  trowTitle: { flex: 1, minWidth: 0, fontSize: size.ui, lineHeight: 22, fontWeight: '400', color: color.fg },
  trowTime: { marginLeft: 8, fontSize: 11.5, lineHeight: 22, color: color.meta, fontVariant: ['tabular-nums'], textAlign: 'right' },
  trowDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 6, backgroundColor: color.fg },
  trowSub: { fontSize: size.meta, lineHeight: 18, color: color.muted },
  // thread pieces
  dateLine: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  dateRule: { flex: 1, height: 1, backgroundColor: color.borderSoft },
  dateText: { fontSize: size.small, lineHeight: 18, color: color.meta, fontVariant: ['tabular-nums'] },
  results: { gap: 2, marginBottom: 12 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 26 },
  resultLabel: { fontSize: size.ui, fontWeight: '500', color: color.fg },
  resultValue: { flex: 1, fontSize: size.ui, color: color.muted, fontVariant: ['tabular-nums'] },
  verifyLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 2, marginLeft: -8 },
  verdict: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 32, paddingHorizontal: 8 },
  verdictText: { fontSize: size.meta, fontVariant: ['tabular-nums'] },
  verdictSep: { fontSize: size.meta, color: color.meta },
  notes: { fontSize: 14, lineHeight: 20, color: color.muted, marginTop: 4 },
  ghost: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 32, paddingHorizontal: 8, borderRadius: radius.sm },
  ghostText: { fontSize: 14, fontWeight: '500' },
  bubbleWrap: { flexDirection: 'row', justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.xl, backgroundColor: color.surface },
  bubbleText: { fontSize: size.body, lineHeight: 25, color: color.fg },
  reply: { paddingRight: 8 },
  handoff: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  handoffMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingLeft: 10, paddingRight: 8, borderWidth: 1, borderColor: color.border, borderRadius: radius.lg, backgroundColor: color.bg },
  handoffIc: { width: 20, alignItems: 'center' },
  handoffTitle: { fontSize: size.ui, lineHeight: 20, color: color.fg },
  handoffSub: { fontSize: size.meta, lineHeight: 18, color: color.muted, fontVariant: ['tabular-nums'] },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderWidth: 1, borderColor: color.border, borderRadius: 24, backgroundColor: color.bg, paddingVertical: 6, paddingLeft: 18, paddingRight: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  composerBig: { alignItems: 'flex-end', borderRadius: 18, paddingTop: 10 },
  composerInput: { flex: 1, minHeight: 36, maxHeight: 160, fontSize: size.body, lineHeight: 24, paddingVertical: 6, color: color.fg },
  send: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 1 },
  sendOn: { backgroundColor: color.fg },
  sendOff: { backgroundColor: color.surface2 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: radius.sm, backgroundColor: color.surface },
  btnPrimary: { backgroundColor: color.fg },
  btnGhost: { backgroundColor: 'transparent', paddingHorizontal: 8 },
  btnText: { fontSize: 14, fontWeight: '500' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 12, borderWidth: 1, borderColor: color.border, borderRadius: radius.md, backgroundColor: color.bg },
  fieldInput: { flex: 1, fontSize: size.ui, color: color.fg, paddingVertical: 0 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  sheet: { backgroundColor: color.bg, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 28 },
  sheetHandle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: color.surface2, marginBottom: 8 },
  sheetTitle: { fontSize: size.ui, color: color.muted, paddingHorizontal: 12, paddingVertical: 8 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 48, paddingHorizontal: 12, borderRadius: radius.md },
  sheetItemText: { fontSize: size.body, color: color.fg },
})

const mdStyles = StyleSheet.create({
  body: { fontSize: size.body, lineHeight: 28, color: color.fg },
  paragraph: { marginTop: 0, marginBottom: 12 },
  heading1: { fontFamily: font.display, fontSize: 24, lineHeight: 32, fontWeight: '400', marginTop: 20, marginBottom: 8 },
  heading2: { fontFamily: font.display, fontSize: 20, lineHeight: 28, fontWeight: '400', marginTop: 20, marginBottom: 6 },
  heading3: { fontSize: 16, lineHeight: 24, fontWeight: '600', marginTop: 16, marginBottom: 4 },
  strong: { fontWeight: '600' },
  bullet_list: { marginBottom: 12 },
  ordered_list: { marginBottom: 12 },
  list_item: { marginBottom: 2 },
  blockquote: { backgroundColor: color.surface, borderLeftWidth: 2, borderLeftColor: color.borderStrong, paddingHorizontal: 12, marginBottom: 12 },
  code_inline: { fontFamily: font.mono, fontSize: 14, backgroundColor: color.surface, paddingHorizontal: 4, borderRadius: 4 },
  fence: { fontFamily: font.mono, fontSize: 13, backgroundColor: color.surface, borderRadius: radius.md, padding: 12, marginBottom: 12, borderWidth: 0 },
  code_block: { fontFamily: font.mono, fontSize: 13, backgroundColor: color.surface, borderRadius: radius.md, padding: 12, marginBottom: 12, borderWidth: 0 },
  table: { borderWidth: 1, borderColor: color.borderSoft, borderRadius: radius.md, marginBottom: 14 },
  thead: { backgroundColor: color.surface },
  th: { padding: 8, fontSize: 13, fontWeight: '500', color: color.muted },
  td: { padding: 8, fontSize: 14 },
  tr: { borderBottomWidth: 1, borderColor: color.borderSoft },
  hr: { backgroundColor: color.borderSoft, marginVertical: 16 },
  link: { color: color.fg, textDecorationLine: 'underline' },
})
