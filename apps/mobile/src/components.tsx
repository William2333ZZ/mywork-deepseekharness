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
export function Greet({ children }: { children: React.ReactNode }) { return <Text style={styles.greet}>{children}</Text> }
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

/** Conversation turns, the Grok shape: the user's words in a bubble on the right, the reply as plain text. */
export function Bubble({ text }: { text: string }) {
  return <View style={styles.bubbleWrap}><View style={styles.bubble}><Text style={styles.bubbleText}>{text}</Text></View></View>
}
export function Reply({ markdown }: { markdown: string }) { return <View style={styles.reply}><Prose markdown={markdown} /></View> }
export function Thinking({ text = '在想' }: { text?: string }) {
  const op = useRef(new Animated.Value(0.35)).current
  useEffect(() => { const loop = Animated.loop(Animated.sequence([Animated.timing(op, { toValue: 1, duration: 800, useNativeDriver: true }), Animated.timing(op, { toValue: 0.35, duration: 800, useNativeDriver: true })])); loop.start(); return () => loop.stop() }, [op])
  return <Animated.Text style={[styles.body, { color: color.muted, opacity: op }]}>{text}…</Animated.Text>
}
export function HandoffChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, pressed && { backgroundColor: color.surface }]}>
      <Ionicons name="time-outline" size={14} color={color.fg2} />
      <Text style={styles.chipText} numberOfLines={1}>{label}</Text>
      <Ionicons name="arrow-forward" size={12} color={color.meta} />
    </Pressable>
  )
}
/** A deliverable in the flow: a card that opens the task. No summary text, no buttons. */
export function DeliverableCard({ title, meta, warn, onPress, icon = 'document-text-outline' }: { title: string; meta: string; warn?: string; onPress: () => void; icon?: IconName }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { backgroundColor: color.surface }]}>
      <Ionicons name={icon} size={20} color={color.fg2} style={{ marginTop: 1 }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
        <Text style={[styles.meta, warn ? { color: color.warn } : null]} numberOfLines={1}>{warn || meta}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={color.meta} />
    </Pressable>
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

export function Field({ value, onChange, placeholder, icon, autoFocus, onSubmit, mono }: { value: string; onChange: (v: string) => void; placeholder: string; icon?: IconName; autoFocus?: boolean; onSubmit?: () => void; mono?: boolean }) {
  return (
    <View style={styles.field}>
      {icon ? <Ionicons name={icon} size={16} color={color.meta} /> : null}
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={color.meta} autoFocus={autoFocus} autoCapitalize="none" autoCorrect={false} onSubmitEditing={onSubmit} returnKeyType={onSubmit ? 'go' : 'done'} style={[styles.fieldInput, mono && { fontFamily: font.mono, fontSize: 14 }]} />
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
  greet: { fontFamily: font.display, fontSize: size.greet, lineHeight: 38, color: color.fg, fontWeight: '400' },
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
  bubbleWrap: { flexDirection: 'row', justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.xl, backgroundColor: color.surface },
  bubbleText: { fontSize: size.body, lineHeight: 25, color: color.fg },
  reply: { paddingRight: 8 },
  chip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingLeft: 10, paddingRight: 12, borderWidth: 1, borderColor: color.border, borderRadius: radius.md, backgroundColor: color.bg, maxWidth: '100%' },
  chipText: { fontSize: size.meta + 1, color: color.fg2, flexShrink: 1 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderWidth: 1, borderColor: color.border, borderRadius: radius.lg, backgroundColor: color.bg },
  cardTitle: { fontSize: size.ui, lineHeight: 22, fontWeight: '500', color: color.fg, marginBottom: 2 },
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
