/**
 * MyWork mobile — the few pieces every screen is built from. Same rules as the web contract:
 * one list recipe, lists carry no actions, the composer never changes colour, no hint captions; text in three opacities
 * of one white, colour only for a decision, icons only where they do something, no spinners (nothing moves but a press,
 * a sheet, a working avatar and a reply that arrives).
 */
import React, { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Dimensions, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ViewStyle, type TextStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Markdown from 'react-native-markdown-display'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Circle, Ellipse, Path } from 'react-native-svg'
import { color, font, radius, size, space, themed, type AvKey } from './theme'
import type { Look } from './api'

export type IconName = React.ComponentProps<typeof Ionicons>['name']

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <SafeAreaView style={[styles.screen, style]} edges={['top', 'left', 'right']}>{children}</SafeAreaView>
}

/** Top bar: left control, a title that may be a button, right control. 52px, no border. */
export function TopBar({ left, title, right, onTitle }: { left?: React.ReactNode; title?: string | React.ReactElement; right?: React.ReactNode; onTitle?: () => void }) {
  return (
    <View style={styles.bar}>
      <View style={styles.barSide}>{left}</View>
      {title && typeof title !== 'string' ? <View style={{ flex: 1, alignItems: 'center' }}>{title}</View> : title ? (
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
    <Pressable onPress={onPress} accessibilityLabel={label} accessibilityRole="button" hitSlop={6} style={({ pressed }) => [styles.iconBtn, pressed && { backgroundColor: color.pressed }]}>
      <Ionicons name={name} size={s} color={tone || color.fg2} />
    </Pressable>
  )
}

/** The brand mark (design/v2/brand/mark.svg): an M whose last stroke turns into a check, in the text colour (white on dark, ink on light): the brand stays black and white. */
export const MARK_PATH = 'M4.5 18.5V7l5.5 6.5L15.5 7M10.5 17l3 3 6-6'
export function Mark({ dim = 22, live, tint = color.fg }: { dim?: number; live?: boolean; tint?: string }) {
  const pulse = useRef(new Animated.Value(1)).current
  useEffect(() => {
    if (!live) { pulse.setValue(1); return }
    const loop = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }), Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true })]))
    loop.start(); return () => loop.stop()
  }, [live, pulse])
  return (
    <Animated.View style={{ width: dim, height: dim, opacity: pulse }}>
      <Svg width={dim} height={dim} viewBox="0 0 24 24" fill="none"><Path d={MARK_PATH} stroke={tint} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" /></Svg>
    </Animated.View>
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
/** Colour carries a decision only: danger (a failure), warn (needs you); everything else is the white scale. */
export type Tone = 'live' | 'danger' | 'warn' | 'meta'
/** A tone's colour in the palette in force (read at render). */
const toneColor = (t: Tone): string => ({ live: color.fg2, danger: color.danger, warn: color.warn, meta: color.meta })[t]
export function Row({ glyph, tone = 'meta', title, sub, state, stateTone, onPress, chevron }: { glyph?: IconName; tone?: Tone; title: string; sub?: string; state?: string; stateTone?: Tone; onPress?: () => void; chevron?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: color.pressed }]}>
      {glyph ? <View style={styles.rowGlyph}><Ionicons name={glyph} size={18} color={toneColor(tone)} /></View> : null}
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
        {sub ? <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {state ? <Text style={[styles.rowState, stateTone ? { color: toneColor(stateTone) } : null]} numberOfLines={1}>{state}</Text> : null}
      {chevron ? <Ionicons name="chevron-forward" size={16} color={color.meta} /> : null}
    </Pressable>
  )
}

/**
 * The column's one row shape (TEAMMATES.md §8.2): glyph 20px · title 15px (600 when unread) · time right-aligned tabular ·
 * unread dot · one line of preview 13px muted. Rows carry no actions; opening the row is the only thing it does.
 * `glyph` is an icon name or a ready element.
 */
export function ThreadRow({ glyph, tone = 'meta', title, time, unread, preview, onPress, current }: { glyph?: IconName | React.ReactNode; tone?: Tone; title: string; time?: string; unread?: boolean; preview?: string; onPress: () => void; current?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.trow, (pressed || current) && { backgroundColor: color.pressed }]}>
      <View style={styles.trowGlyph}>{typeof glyph === 'string' ? <Ionicons name={glyph as IconName} size={20} color={toneColor(tone)} /> : glyph}</View>
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

/** The web's avatar colour keys, in its order; the palette in force supplies each one's muted fill (color.av). */
export const AV_KEYS: AvKey[] = ['slate', 'blue', 'teal', 'green', 'amber', 'orange', 'rose', 'violet']
/** Rakazo's shippedHash (FNV-1a), the web's avatarHash. */
export function avatarHash(v: string): number { let x = 2166136261; for (let i = 0; i < v.length; i++) x = Math.imul(x ^ v.charCodeAt(i), 16777619); return x >>> 0 }
/** The web's four shapes in a 100 box; the hexagon is drawn with a round-joined stroke of its own colour, so its corners are soft. */
const AV_SHAPES: Record<string, string> = { circle: 'M50 4a46 46 0 1 1 0 92a46 46 0 1 1 0-92Z', squircle: 'M34 4h32c20 0 30 10 30 30v32c0 20-10 30-30 30H34C14 96 4 86 4 66V34C4 14 14 4 34 4Z', pebble: 'M50 8c28 0 46 14 46 40s-18 44-46 44S4 74 4 48 22 8 50 8Z', hex: 'M50 8L86.4 29V71L50 92L13.6 71V29Z' }
export const AV_SHAPE_KEYS = Object.keys(AV_SHAPES)
/** The teammate's look, the web's lookOf: its own pick (from the computer), else derived from its id, per field. */
export function avatarLook(id: string, pick?: { color?: string; shape?: string } | null) {
  const hash = avatarHash(String(id || 'mate'))
  const key: AvKey = pick && AV_KEYS.includes(pick.color as AvKey) ? pick.color as AvKey : AV_KEYS[hash % AV_KEYS.length]
  const shape = pick && pick.shape && AV_SHAPES[pick.shape] ? pick.shape : AV_SHAPE_KEYS[(Math.imul(hash ^ (hash >>> 16), 73244475) >>> 0) % AV_SHAPE_KEYS.length]
  return { fill: color.av[key], eye: key === 'amber' ? '#141414' : '#ffffff', shape, d: AV_SHAPES[shape] }
}

/**
 * A teammate's avatar, the web's MateAvatar: a flat shape in its colour and shape (its own pick, else from its id), in
 * the palette's muted tone, with two eyes; MyWork is its black-and-white mark. `working` pulses it at scale 1.04.
 */
export function Avatar({ id, look, isDefault, dim = 36, working }: { id: string; look?: { color?: string; shape?: string } | null; char?: string; isDefault?: boolean; dim?: number; working?: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current
  useEffect(() => {
    if (!working) { pulse.setValue(1); return }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.04, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]))
    loop.start(); return () => loop.stop()
  }, [working, pulse])
  let body: React.ReactNode
  if (isDefault) body = (
    <Svg width={dim} height={dim} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="46" fill={color.markBg} />
      <Svg x="22" y="22" width="56" height="56" viewBox="0 0 24 24" fill="none"><Path d={MARK_PATH} stroke={color.markFg} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></Svg>
    </Svg>
  )
  else {
    const { fill, eye, shape, d } = avatarLook(id, look)
    body = (
      <Svg width={dim} height={dim} viewBox="0 0 100 100">
        {shape === 'hex' ? <Path d={d} fill={fill} stroke={fill} strokeWidth={8} strokeLinejoin="round" /> : <Path d={d} fill={fill} />}
        <Ellipse cx="37.3" cy="46.5" rx="4.4" ry="3.1" fill={eye} /><Ellipse cx="62.7" cy="46.5" rx="4.4" ry="3.1" fill={eye} />
      </Svg>
    )
  }
  return <Animated.View style={{ width: dim, height: dim, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pulse }] }}>{body}</Animated.View>
}

/**
 * The teammates list's one row (§9.4), as in IM: the avatar (it breathes while working) with the unread count on its
 * top-right — a red badge, 99+ — then the name and the time, and one line under them (在干活 in the accent, 等你答 in
 * warn, else the latest sentence). Rows carry no actions; opening the row is the only thing it does.
 */
export function MateRow({ id, look, char, isDefault, working, waiting, name, time, unread = 0, sub, onPress }: { id: string; look?: { color?: string; shape?: string } | null; char: string; isDefault?: boolean; working?: boolean; waiting?: boolean; name: string; time?: string; unread?: number; sub?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={unread > 0 ? `${name}，${unread} 条未读` : name} style={({ pressed }) => [styles.mrow, pressed && { backgroundColor: color.pressed }]}>
      <View>
        <Avatar id={id} look={look} char={char} isDefault={isDefault} working={working} dim={44} />
        {unread > 0 ? <UnreadBadge n={unread} /> : null}
      </View>
      <View style={styles.trowMain}>
        <View style={styles.trowLine}>
          <Text style={styles.mrowName} numberOfLines={1}>{name}</Text>
          {time ? <Text style={styles.trowTime}>{time}</Text> : null}
        </View>
        {sub ? <Text style={[styles.mrowSub, working && { color: color.accentText }, waiting && { color: color.warn }]} numberOfLines={1}>{sub}</Text> : null}
      </View>
    </Pressable>
  )
}
/** The IM unread count: white on the badge red, ringed in the page colour, at an avatar's top-right; 99+ above 99. */
export function UnreadBadge({ n }: { n: number }) {
  return <View style={styles.badge} pointerEvents="none"><Text style={styles.badgeText}>{n > 99 ? '99+' : String(n)}</Text></View>
}

/** A switch drawn like the web's: off, a hairline pill with a muted knob; on, the accent pill with a dark knob. */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} hitSlop={10}
      style={[styles.toggle, value && styles.toggleOn]}>
      <View style={[styles.knob, value && styles.knobOn]} />
    </Pressable>
  )
}

/** 头像: 8 colour swatches and 4 shapes drawn in the chosen colour (the web's picker; the look is saved as { color, shape }). */
export function AvatarPicker({ look, onChange }: { look: Look; onChange: (next: Look) => void }) {
  return (
    <View style={styles.pick}>
      <View style={styles.pickRow} accessibilityRole="radiogroup" accessibilityLabel="颜色">
        {AV_KEYS.map((k) => (
          <Pressable key={k} onPress={() => onChange({ ...look, color: k })} accessibilityRole="radio" accessibilityState={{ checked: look.color === k }} hitSlop={4}
            style={[styles.swatch, { backgroundColor: color.av[k] }, look.color === k && styles.swatchOn]} />
        ))}
      </View>
      <View style={styles.pickRow} accessibilityRole="radiogroup" accessibilityLabel="形状">
        {AV_SHAPE_KEYS.map((sh) => (
          <Pressable key={sh} onPress={() => onChange({ ...look, shape: sh })} accessibilityRole="radio" accessibilityState={{ checked: look.shape === sh }}
            style={[styles.shape, look.shape === sh && styles.shapeOn]}>
            <Avatar id="look" look={{ color: look.color, shape: sh }} dim={28} />
          </Pressable>
        ))}
      </View>
    </View>
  )
}
/** A look to start from: a random colour and shape (the form's first pick). */
export const randomLook = (): Look => ({ color: AV_KEYS[Math.floor(Math.random() * AV_KEYS.length)], shape: AV_SHAPE_KEYS[Math.floor(Math.random() * AV_SHAPE_KEYS.length)] })

/**
 * 类型: the types in use as chips (in the order they were formed), 「其他」 when not `required`, and 「新建类型」, which
 * turns into a field (12 characters). `value` is the type ('' = 其他).
 */
export function TypePicker({ value, types, required, onChange }: { value: string; types: string[]; required?: boolean; onChange: (v: string) => void }) {
  const known = !value || types.includes(value)
  const [fresh, setFresh] = useState(!known || (!!required && !types.length))
  const [draft, setDraft] = useState(known ? '' : value)
  const chip = (label: string, on: boolean, onPress: () => void) => (
    <Pressable key={label} onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: on }} style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && { opacity: 0.7 }]}>
      <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>{label}</Text>
    </Pressable>
  )
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.chips}>
        {types.map((g) => chip(g, !fresh && value === g, () => { setFresh(false); onChange(g) }))}
        {required ? null : chip('其他', !fresh && !value, () => { setFresh(false); onChange('') })}
        {chip('+ 新建类型', fresh, () => { setFresh(true); onChange(draft.replace(/\s+/g, ' ').trim().slice(0, 12)) })}
      </View>
      {fresh ? <Field value={draft} onChange={(v) => { setDraft(v); onChange(v.replace(/\s+/g, ' ').trim().slice(0, 12)) }} placeholder="类型名，例如：行业研究" autoFocus={types.length > 0} /> : null}
    </View>
  )
}

/** A centred small line in a conversation: a routine's marker 「每日日报 · 19:00」, 「已安排 · …」, 已停止. Words only. */
export function CenterLine({ text, onPress, lit, style }: { text: string; onPress?: () => void; lit?: boolean; style?: ViewStyle }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.center, lit && { backgroundColor: color.card }, pressed && { opacity: 0.7 }, style]}>
      <Text style={styles.centerText} numberOfLines={2}>{text}</Text>
    </Pressable>
  )
}

/** A date separator in a conversation: one before the first run of every day but today. */
export function DateLine({ text }: { text: string }) {
  return <View style={styles.dateLine}><View style={styles.dateRule} /><Text style={styles.dateText}>{text}</Text><View style={styles.dateRule} /></View>
}

/**
 * Summary rows as a compact two-column definition list (§8.3): label 13 muted, value 13 in the text colour with tabular
 * numbers, 4 between rows, the label column as wide as its longest label up to 40 %. No marks, no colour. Every row is
 * one 20-high line, so the two columns stay aligned.
 */
export function ResultRows({ rows }: { rows: { label: string; value: string }[] }) {
  if (!rows.length) return null
  const val = (v: unknown) => String(v === undefined || v === null ? '' : v)
  return (
    <View style={styles.results}>
      <View style={styles.resultLabels}>{rows.map((r, i) => <Text key={i} style={styles.resultLabel} numberOfLines={1}>{r.label}</Text>)}</View>
      <View style={styles.resultValues}>{rows.map((r, i) => <Text key={i} style={styles.resultValue} numberOfLines={1}>{val(r.value)}</Text>)}</View>
    </View>
  )
}

/**
 * One meta line under a delivery, 12px: the verification words read live (核验中 / 已核验 · 核对 n · 问题 m / 核验发现 n 处 /
 * 未能核验) in meta — warn only when the caller says so (issues on the thread's newest run) — then 有用 / 没用, always
 * there on the phone but muted until one is chosen. The verdict opens the verifier's notes when there are any.
 */
export function VerifyLine({ words, warn, notes, rating, onRate }: { words: string; warn?: boolean; notes?: string; rating: number | null | undefined; onRate: (r: number) => void }) {
  const [open, setOpen] = useState(false)
  const hasNotes = !!notes
  const tone = warn ? color.warn : color.meta
  return (
    <View>
      <View style={styles.verifyLine}>
        {words ? (
          <Pressable onPress={() => { if (hasNotes) setOpen(!open) }} disabled={!hasNotes} style={styles.verdict} accessibilityRole={hasNotes ? 'button' : undefined} accessibilityState={hasNotes ? { expanded: open } : undefined}>
            <Text style={[styles.verdictText, { color: tone }, hasNotes && { textDecorationLine: 'underline', textDecorationStyle: 'dotted' }]} numberOfLines={1}>{words}</Text>
          </Pressable>
        ) : null}
        {words ? <Text style={styles.verdictSep}>·</Text> : null}
        <Ghost label="有用" on={rating === 1} onPress={() => onRate(1)} fontSize={12} />
        <Ghost label="没用" on={rating === -1} onPress={() => onRate(-1)} fontSize={12} />
      </View>
      {open && hasNotes ? <Text style={styles.notes}>{notes}</Text> : null}
    </View>
  )
}

/** A ghost button: muted words (and an optional functional icon) that turn full white when it is the chosen one. */
export function Ghost({ icon, label, on, onPress, disabled, fontSize }: { icon?: IconName; label: string; on?: boolean; onPress: () => void; disabled?: boolean; fontSize?: number }) {
  const tone = on ? color.fg : fontSize ? color.meta : color.muted
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ selected: !!on }} style={({ pressed }) => [styles.ghost, fontSize ? styles.ghostSmall : null, on && { backgroundColor: color.borderSoft }, disabled && { opacity: 0.45 }, pressed && { opacity: 0.7 }]}>
      {icon ? <Ionicons name={icon} size={fontSize ? 13 : 15} color={tone} /> : null}
      <Text style={[styles.ghostText, fontSize ? { fontSize, fontWeight: '400' } : null, { color: tone }]}>{label}</Text>
    </Pressable>
  )
}

/** Conversation turns, the Grok shape: the user's words in a bubble on the right, the reply as plain text. */
export function Bubble({ text }: { text: string }) {
  return <View style={styles.bubbleWrap}><View style={styles.bubble}><Text style={styles.bubbleText}>{text}</Text></View></View>
}
export function Reply({ markdown }: { markdown: string }) { return <ReplyBubble><Prose markdown={markdown} tight /></ReplyBubble> }
/** The teammate's side: a grey bubble on the left (card colour, radius 20, up to 88%). */
export function ReplyBubble({ children }: { children: React.ReactNode }) {
  return <View style={styles.replyWrap}><View style={styles.reply}>{children}</View></View>
}
/** One still line while a run works: 「在干活 · 步骤 · 耗时」 (the avatar beside it is what moves). */
export function Thinking({ text = '在想', tail = '…', small }: { text?: string; tail?: string; small?: boolean }) {
  return <Text numberOfLines={1} style={[styles.body, small && { fontSize: 13, lineHeight: 20, flexShrink: 1 }, { color: color.muted, fontVariant: ['tabular-nums'] }]}>{text}{tail}</Text>
}

/** Reduce Motion, kept current for every Arrive. */
let reduceMotion = false
AccessibilityInfo.isReduceMotionEnabled().then((v) => { reduceMotion = v }).catch(() => { /* assume motion is fine */ })
AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => { reduceMotion = v })
const ENTER_MS = 200
/**
 * A reply that arrives while you watch: opacity 0 → 1 and 6px up into place over 200ms (M3 standard easing); with Reduce
 * Motion on, the fade only. Mounted with `on` false, it renders the children as they are.
 */
export function Arrive({ on, children }: { on?: boolean; children: React.ReactNode }) {
  // Decided when it mounts: an arrival keeps its wrapper (so the entry never remounts when the mark lapses).
  const arrived = useRef(!!on).current
  const p = useRef(new Animated.Value(arrived ? 0 : 1)).current
  const still = useRef(reduceMotion).current
  useEffect(() => {
    if (!arrived) return
    Animated.timing(p, { toValue: 1, duration: ENTER_MS, easing: Easing.bezier(0.2, 0, 0, 1), useNativeDriver: true }).start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  if (!arrived) return <>{children}</>
  const translateY = still ? 0 : p.interpolate({ inputRange: [0, 1], outputRange: [6, 0] })
  return <Animated.View style={{ opacity: p, transform: [{ translateY }] }}>{children}</Animated.View>
}
/** Markdown at reading size. Titles in the serif, like the web. */
export function Prose({ markdown, wide, tight }: { markdown: string; wide?: boolean; tight?: boolean }) {
  return <Markdown style={tight ? mdTight : mdStyles} rules={wide ? wideRules : undefined}>{String(markdown || '').trim()}</Markdown>
}
/** Tables scroll sideways instead of squeezing their columns (the file screen). */
const wideRules = {
  table: (node: { key: string }, children: React.ReactNode) => (
    <ScrollView key={node.key} horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
      <View style={mdWide.table}>{children}</View>
    </ScrollView>
  ),
  th: (node: { key: string }, children: React.ReactNode) => <View key={node.key} style={mdWide.th}>{children}</View>,
  td: (node: { key: string }, children: React.ReactNode) => <View key={node.key} style={mdWide.td}>{children}</View>,
}

/** The composer: a pill with a cream round send; while the teammate works and nothing is typed, a Stop circle. */
export function Composer({ value, onChange, onSend, placeholder, busy, disabled, autoFocus, big, onStop, inputRef }: { value: string; onChange: (v: string) => void; onSend: () => void; placeholder: string; busy?: boolean; disabled?: boolean; autoFocus?: boolean; big?: boolean; onStop?: () => void; inputRef?: React.Ref<TextInput> }) {
  const can = !!value.trim() && !busy && !disabled
  const stopping = !!onStop && !value.trim() && !busy
  return (
    <View style={[styles.composer, big && styles.composerBig]}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={color.meta}
        multiline
        autoFocus={autoFocus}
        editable={!disabled}
        selectionColor={color.primary}
        style={[styles.composerInput, big && { minHeight: 96, textAlignVertical: 'top' }]}
        onSubmitEditing={can ? onSend : undefined}
        blurOnSubmit={false}
      />
      {stopping ? (
        <Pressable onPress={onStop} accessibilityLabel="停止" accessibilityRole="button" style={({ pressed }) => [styles.send, styles.stop, pressed && { opacity: 0.7 }]}>
          <View style={styles.stopSquare} />
        </Pressable>
      ) : (
        <Pressable onPress={onSend} disabled={!can} accessibilityLabel="发送" accessibilityRole="button" accessibilityState={{ busy: !!busy }} style={({ pressed }) => [styles.send, can ? styles.sendOn : styles.sendOff, pressed && { opacity: 0.8 }]}>
          <Ionicons name="arrow-up" size={18} color={can ? color.onPrimary : color.meta} />
        </Pressable>
      )}
    </View>
  )
}

/** A pill button. `primary` is the strongest neutral (the bubble surface, a hairline): the cream belongs to send alone. */
export function Btn({ label, onPress, kind = 'ghost', icon, disabled, style }: { label: string; onPress: () => void; kind?: 'ghost' | 'primary' | 'danger'; icon?: IconName; disabled?: boolean; style?: ViewStyle }) {
  const txt = kind === 'primary' ? color.fg : kind === 'danger' ? color.danger : color.fg2
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.btn, kind === 'primary' && styles.btnPrimary, kind === 'ghost' && styles.btnGhost, disabled && { opacity: 0.45 }, pressed && { opacity: 0.7 }, style]}>
      {icon ? <Ionicons name={icon} size={15} color={txt} /> : null}
      <Text style={[styles.btnText, { color: txt }]}>{label}</Text>
    </Pressable>
  )
}

export function Field({ value, onChange, placeholder, icon, autoFocus, onSubmit, mono, clearable, multiline, style }: { value: string; onChange: (v: string) => void; placeholder: string; icon?: IconName; autoFocus?: boolean; onSubmit?: () => void; mono?: boolean; clearable?: boolean; multiline?: boolean; style?: ViewStyle }) {
  if (multiline) {
    return (
      <View style={[styles.field, styles.fieldMulti, style]}>
        <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={color.meta} autoFocus={autoFocus} multiline textAlignVertical="top" style={[styles.fieldInput, { minHeight: 72, maxHeight: 200, lineHeight: 22 }]} />
      </View>
    )
  }
  return (
    <View style={[styles.field, style]}>
      {icon ? <Ionicons name={icon} size={16} color={color.meta} /> : null}
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={color.meta} autoFocus={autoFocus} autoCapitalize="none" autoCorrect={false} onSubmitEditing={onSubmit} returnKeyType={onSubmit ? 'go' : clearable ? 'search' : 'done'} style={[styles.fieldInput, mono && { fontFamily: font.mono, fontSize: 14 }]} />
      {clearable && value ? <Pressable onPress={() => onChange('')} accessibilityLabel="清除" hitSlop={8}><Ionicons name="close-circle" size={16} color={color.meta} /></Pressable> : null}
    </View>
  )
}

const SHEET_MS = 150

/**
 * A bottom sheet for the few places that need a choice: the ··· menu, a delete confirm, a routine. It rises and fades its
 * backdrop in 150ms (the platform's slide takes ~300ms); a tap outside or back slides it down first, then calls onClose.
 */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  const [shown, setShown] = useState(open)
  const height = Dimensions.get('window').height // off the bottom edge whatever the sheet's own height
  const p = useRef(new Animated.Value(0)).current // 0 = down and clear, 1 = up
  const up = useRef(false)
  const run = (to: 0 | 1, then?: () => void) => {
    Animated.timing(p, { toValue: to, duration: SHEET_MS, easing: to ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => { if (finished && then) then() })
  }
  useEffect(() => {
    if (open && !up.current) { up.current = true; setShown(true); p.setValue(0); run(1) }
    else if (!open && up.current) { up.current = false; run(0, () => setShown(false)) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const dismiss = () => {
    if (!up.current) return
    up.current = false
    run(0, () => { setShown(false); onClose() })
  }
  const translateY = p.interpolate({ inputRange: [0, 1], outputRange: [height, 0] })
  return (
    <Modal visible={shown} transparent animationType="none" onRequestClose={dismiss}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.sheetShade, { opacity: p }]} />
      <Pressable style={styles.sheetBackdrop} onPress={dismiss} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.sheetHandle} />
        {title ? <Text style={styles.sheetTitle}>{title}</Text> : null}
        {children}
      </Animated.View>
    </Modal>
  )
}
export function SheetItem({ icon, label, onPress, danger }: { icon?: IconName; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: color.pressed }]}>
      {icon ? <Ionicons name={icon} size={18} color={danger ? color.danger : color.fg2} /> : null}
      <Text style={[styles.sheetItemText, danger && { color: color.danger }]}>{label}</Text>
    </Pressable>
  )
}

/** Two lines by default, the whole text on tap: verifier notes, mid-run notes. */
export function Folded({ text, lines = 2, style }: { text: string; lines?: number; style?: TextStyle }) {
  const [open, setOpen] = useState(false)
  return <Pressable onPress={() => setOpen(!open)}><Text style={[styles.meta, { color: color.muted, lineHeight: 20, fontSize: 13 }, style]} numberOfLines={open ? undefined : lines}>{text}</Text></Pressable>
}

const styles = themed(() => ({
  screen: { flex: 1, backgroundColor: color.bg },
  bar: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  barSide: { width: 88, flexDirection: 'row', alignItems: 'center', gap: 4 },
  barTitleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 32, borderRadius: 16, backgroundColor: color.surface, marginHorizontal: 8, paddingHorizontal: 16 },
  barTitle: { fontSize: size.ui, fontWeight: '600', color: color.fg },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: font.display, fontSize: size.title, lineHeight: 36, color: color.fg, fontWeight: '400' },
  meta: { fontSize: size.meta, lineHeight: 20, color: color.meta, fontVariant: ['tabular-nums'] },
  body: { fontSize: size.body, lineHeight: 28, color: color.fg },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xxl, marginBottom: space.sm },
  sectionLabel: { fontSize: size.small, lineHeight: 16, fontWeight: '500', letterSpacing: 0.24, color: color.meta },
  empty: { fontSize: size.ui, lineHeight: 24, color: color.muted, paddingVertical: space.xl, textAlign: 'center' },
  listBox: { borderWidth: 1, borderColor: color.border, borderRadius: radius.lg, backgroundColor: color.card, overflow: 'hidden' },
  rowDivider: { borderTopWidth: 1, borderTopColor: color.borderSoft },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 52, paddingVertical: 8, paddingHorizontal: 16 },
  rowGlyph: { width: 20, alignItems: 'center' },
  rowMain: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: size.ui, lineHeight: 24, fontWeight: '500', color: color.fg },
  rowSub: { fontSize: size.meta, lineHeight: 20, color: color.muted },
  rowState: { fontSize: size.meta, color: color.meta, fontVariant: ['tabular-nums'], maxWidth: 140 },
  // the column's row
  trow: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 48, paddingVertical: 8, paddingHorizontal: 16, borderRadius: radius.lg },
  trowGlyph: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  trowMain: { flex: 1, minWidth: 0 },
  trowLine: { flexDirection: 'row', alignItems: 'center' },
  trowTitle: { flex: 1, minWidth: 0, fontSize: size.ui, lineHeight: 24, fontWeight: '400', color: color.fg },
  trowTime: { marginLeft: 8, fontSize: 12, lineHeight: 24, color: color.meta, fontVariant: ['tabular-nums'], textAlign: 'right' },
  trowDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8, backgroundColor: color.primary },
  trowSub: { fontSize: size.meta, lineHeight: 20, color: color.muted },
  mrow: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 56, paddingVertical: 8, paddingHorizontal: 16, borderRadius: radius.lg },
  mrowSub: { fontSize: 13, lineHeight: 20, color: color.muted },
  badge: { position: 'absolute', top: -4, right: -6, minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, borderWidth: 2, borderColor: color.bg, backgroundColor: color.badge, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 11, lineHeight: 14, fontWeight: '600', color: '#ffffff', fontVariant: ['tabular-nums'] },
  toggle: { width: 44, height: 26, borderRadius: 13, borderWidth: 1, borderColor: color.border, backgroundColor: color.input, padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: color.primary, borderColor: color.primary },
  knob: { width: 18, height: 18, borderRadius: 9, backgroundColor: color.meta },
  knobOn: { backgroundColor: color.onPrimary, alignSelf: 'flex-end' },
  pick: { gap: 12 },
  pickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  swatchOn: { borderColor: color.fg },
  shape: { width: 44, height: 44, borderRadius: radius.md, borderWidth: 1, borderColor: color.border, alignItems: 'center', justifyContent: 'center' },
  shapeOn: { borderColor: color.fg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 32, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: color.border, justifyContent: 'center' },
  chipOn: { borderColor: color.primary, backgroundColor: color.sel },
  chipText: { fontSize: 13, color: color.fg2 },
  chipTextOn: { color: color.fg },
  mrowName: { flex: 1, minWidth: 0, fontSize: 15, lineHeight: 20, fontWeight: '500', color: color.fg },
  center: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, maxWidth: '90%' },
  centerText: { fontSize: 12, lineHeight: 16, color: color.meta, textAlign: 'center', fontVariant: ['tabular-nums'] },
  // thread pieces
  dateLine: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  dateRule: { flex: 1, height: 1, backgroundColor: color.borderSoft },
  dateText: { fontSize: size.small, lineHeight: 16, color: color.meta, fontVariant: ['tabular-nums'] },
  results: { flexDirection: 'row', gap: 16 },
  resultLabels: { maxWidth: '40%', flexShrink: 0, gap: 4 },
  resultValues: { flex: 1, minWidth: 0, gap: 4 },
  resultLabel: { fontSize: 13, lineHeight: 20, color: color.muted },
  resultValue: { fontSize: 13, lineHeight: 20, color: color.fg, fontVariant: ['tabular-nums'] },
  verifyLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginLeft: -8 },
  verdict: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 28, paddingHorizontal: 8 },
  verdictText: { fontSize: 12, fontVariant: ['tabular-nums'] },
  verdictSep: { fontSize: 12, color: color.meta },
  notes: { fontSize: 13, lineHeight: 20, color: color.muted, marginTop: 4 },
  ghost: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 32, paddingHorizontal: 8, borderRadius: radius.sm },
  ghostSmall: { height: 28 },
  ghostText: { fontSize: 13, fontWeight: '500' },
  bubbleWrap: { flexDirection: 'row', justifyContent: 'flex-end' },
  bubble: { maxWidth: '70%', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: color.bubble },
  bubbleText: { fontSize: 15, lineHeight: 24, color: color.bubbleFg },
  replyWrap: { flexDirection: 'row', justifyContent: 'flex-start' },
  reply: { maxWidth: '88%', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: color.card, gap: 8 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderWidth: 1, borderColor: color.border, borderRadius: 24, backgroundColor: color.input, paddingVertical: 4, paddingLeft: 16, paddingRight: 4 },
  composerBig: { alignItems: 'flex-end', borderRadius: 24, paddingTop: 8 },
  composerInput: { flex: 1, minHeight: 40, maxHeight: 160, fontSize: size.ui, lineHeight: 24, paddingVertical: 8, color: color.fg },
  send: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sendOn: { backgroundColor: color.primary },
  stop: { backgroundColor: color.bubble, borderWidth: 1, borderColor: color.border },
  stopSquare: { width: 12, height: 12, borderRadius: 2, backgroundColor: color.fg },
  sendOff: { backgroundColor: color.bubble, opacity: 0.6 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: color.input },
  btnPrimary: { backgroundColor: color.bubble, borderWidth: 1, borderColor: color.border },
  btnGhost: { backgroundColor: 'transparent', paddingHorizontal: 8 },
  btnText: { fontSize: 14, fontWeight: '500' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 16, borderWidth: 1, borderColor: color.border, borderRadius: radius.pill, backgroundColor: color.input },
  fieldMulti: { height: undefined, alignItems: 'flex-start', paddingVertical: 8, borderRadius: 24 },
  fieldInput: { flex: 1, fontSize: size.ui, color: color.fg, paddingVertical: 0 },
  sheetShade: { backgroundColor: 'rgba(0,0,0,0.6)' },
  sheetBackdrop: { flex: 1 },
  sheet: { backgroundColor: color.card, borderTopWidth: 1, borderColor: color.border, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  sheetHandle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: color.border, marginBottom: 8 },
  sheetTitle: { fontSize: size.ui, color: color.muted, paddingHorizontal: 8, paddingVertical: 8 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', gap: 16, height: 48, paddingHorizontal: 8, borderRadius: radius.lg },
  sheetItemText: { fontSize: size.body, color: color.fg },
}))

const mdBase = () => ({
  body: { fontSize: size.body, lineHeight: 28, color: color.fg },
  // No colour on the text leaf: it inherits its parent's (body, a link's accent, strong).
  paragraph: { marginTop: 0, marginBottom: 16 },
  heading1: { fontFamily: font.display, fontSize: 24, lineHeight: 32, fontWeight: '400' as const, color: color.fg, marginTop: 24, marginBottom: 8 },
  heading2: { fontFamily: font.display, fontSize: 20, lineHeight: 28, fontWeight: '400' as const, color: color.fg, marginTop: 24, marginBottom: 8 },
  heading3: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const, color: color.fg, marginTop: 16, marginBottom: 4 },
  strong: { fontWeight: '600' as const, color: color.fg },
  bullet_list: { marginBottom: 16 },
  ordered_list: { marginBottom: 16 },
  list_item: { marginBottom: 4 },
  bullet_list_icon: { color: color.muted },
  ordered_list_icon: { color: color.muted },
  blockquote: { backgroundColor: color.card, borderLeftWidth: 2, borderLeftColor: color.border, paddingHorizontal: 16, marginBottom: 16 },
  code_inline: { fontFamily: font.mono, fontSize: 13, backgroundColor: color.input, color: color.fg2, paddingHorizontal: 4, borderRadius: 4 },
  fence: { fontFamily: font.mono, fontSize: 13, backgroundColor: color.input, color: color.fg2, borderRadius: radius.md, padding: 16, marginBottom: 16, borderWidth: 0 },
  code_block: { fontFamily: font.mono, fontSize: 13, backgroundColor: color.input, color: color.fg2, borderRadius: radius.md, padding: 16, marginBottom: 16, borderWidth: 0 },
  table: { borderWidth: 1, borderColor: color.border, borderRadius: radius.md, marginBottom: 16 },
  thead: { backgroundColor: color.card },
  th: { padding: 8, fontSize: 12, fontWeight: '500' as const, color: color.muted },
  td: { padding: 8, fontSize: 13, color: color.fg },
  tr: { borderBottomWidth: 1, borderColor: color.borderSoft, flexDirection: 'row' as const },
  hr: { backgroundColor: color.border, marginVertical: 16 },
  link: { color: color.accentText, textDecorationLine: 'underline' as const },
})
const mdStyles = themed(() => (mdBase()))
/** Inside a bubble: CJK reading at 15 / 1.75, headings no bigger than the text (15 / 600), no trailing gap. */
const heading = () => ({ fontFamily: undefined, fontSize: 15, lineHeight: 26, fontWeight: '600' as const, color: color.fg, marginTop: 8, marginBottom: 4 })
const mdTight = themed(() => ({ ...mdBase(), body: { fontSize: 15, lineHeight: 26, color: color.fg, marginBottom: -8 }, paragraph: { marginTop: 0, marginBottom: 8 }, heading1: heading(), heading2: heading(), heading3: heading(), heading4: heading(), heading5: heading(), heading6: heading(), bullet_list: { marginBottom: 8 }, ordered_list: { marginBottom: 8 } }))
const mdWide = themed(() => ({
  table: { borderWidth: 1, borderColor: color.border, borderRadius: radius.md, overflow: 'hidden' },
  th: { width: 140, padding: 8, backgroundColor: color.card },
  td: { width: 140, padding: 8 },
}))
