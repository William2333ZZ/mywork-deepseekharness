/**
 * MyWork mobile — the desktop's palettes (dsh-mywork-shell): 炭 · 香槟 (the default) and 墨 · 雾紫, each dark and light.
 * The same OKLCH values as the web, every text role at least 4.5:1. Roles: the page (bg) with the cards, inputs and the
 * teammate's bubble above it; your bubble (bubble / bubbleFg); text fg / fg2 (= muted) / meta; lines border / borderSoft;
 * one accent (primary, accentText where it is type) for what concerns you and what you can press — send, the unread dot,
 * links, the open row; warn = needs you, danger = failed, badge = an unread count; the MyWork mark (markBg / markFg) stays
 * black and white; the avatars in the palette's muted colours.
 *
 * `color` is one live object: applyTheme() rewrites it in place, `themed()` style sheets rebuild on the next read, and
 * the app remounts its screens (ThemeProvider's `version`), so every component draws with the palette in force. Sizes,
 * radii and spacing do not change with the theme. Spacing 4 / 8 / 16 / 24 / 32 / 48; three weights, serif for titles.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Appearance, Platform, StyleSheet, useColorScheme } from 'react-native'
import { kvGet, kvSet } from './kv'

export type PaletteId = 'champagne' | 'mist'
export type SchemeMode = 'system' | 'light' | 'dark'

const PALETTES = {
  champagne: {
    dark: { scheme: 'dark', bg: '#12100e', side: '#0e0c0a', surface: '#0e0c0a', card: '#191714', input: '#211f1c', surface2: '#211f1c', bubble: '#3b342a', bubbleFg: '#f2eee6', fg: '#efebe2', fg2: 'rgba(239,235,226,0.68)', muted: 'rgba(239,235,226,0.68)', meta: 'rgba(239,235,226,0.54)', border: 'rgba(239,235,226,0.09)', borderSoft: 'rgba(239,235,226,0.05)', borderStrong: 'rgba(239,235,226,0.09)', warn: '#e2c797', danger: '#df7f78', badge: '#c74b47', primary: '#d8c198', onPrimary: '#191511', accentText: '#dec79f', sel: 'rgba(216,193,152,0.1)', pressed: '#211f1c', markBg: '#292622', markFg: '#ffffff',
      av: { slate: '#6d757f', blue: '#617692', teal: '#517e7b', green: '#607d65', amber: '#9c8a6a', orange: '#8d6c5a', rose: '#8f6870', violet: '#766f8f' } },
    light: { scheme: 'light', bg: '#fcfaf6', side: '#f5f2ee', surface: '#f5f2ee', card: '#fffdfa', input: '#efece7', surface2: '#efece7', bubble: '#eadec8', bubbleFg: '#26201c', fg: '#26201c', fg2: 'rgba(38,32,28,0.76)', muted: 'rgba(38,32,28,0.76)', meta: 'rgba(38,32,28,0.66)', border: 'rgba(38,32,28,0.1)', borderSoft: 'rgba(38,32,28,0.05)', borderStrong: 'rgba(38,32,28,0.1)', warn: '#9b641a', danger: '#b33736', badge: '#cb4644', primary: '#7c5d34', onPrimary: '#ffffff', accentText: '#74542c', sel: 'rgba(124,93,52,0.12)', pressed: '#efece7', markBg: '#26201c', markFg: '#ffffff',
      av: { slate: '#7e8791', blue: '#7288a4', teal: '#62908d', green: '#718f76', amber: '#ae9c7b', orange: '#a07e6b', rose: '#a17a82', violet: '#8881a2' } },
  },
  mist: {
    dark: { scheme: 'dark', bg: '#0f0f13', side: '#0a0b0f', surface: '#0a0b0f', card: '#16171c', input: '#1e1f25', surface2: '#1e1f25', bubble: '#383c62', bubbleFg: '#f4f5f9', fg: '#f1f1f6', fg2: 'rgba(241,241,246,0.68)', muted: 'rgba(241,241,246,0.68)', meta: 'rgba(241,241,246,0.54)', border: 'rgba(241,241,246,0.09)', borderSoft: 'rgba(241,241,246,0.05)', borderStrong: 'rgba(241,241,246,0.09)', warn: '#efb062', danger: '#eb827b', badge: '#cb4644', primary: '#666cad', onPrimary: '#ffffff', accentText: '#aab3ee', sel: 'rgba(102,108,173,0.16)', pressed: '#1e1f25', markBg: '#25262b', markFg: '#ffffff',
      av: { slate: '#717c87', blue: '#627c9e', teal: '#4e8682', green: '#618568', amber: '#a58f68', orange: '#98705a', rose: '#996c75', violet: '#7c749b' } },
    light: { scheme: 'light', bg: '#fbfbfe', side: '#f4f4f7', surface: '#f4f4f7', card: '#ffffff', input: '#eeeff3', surface2: '#eeeff3', bubble: '#e3e6fc', bubbleFg: '#1b1c24', fg: '#1b1c24', fg2: 'rgba(27,28,36,0.76)', muted: 'rgba(27,28,36,0.76)', meta: 'rgba(27,28,36,0.65)', border: 'rgba(27,28,36,0.1)', borderSoft: 'rgba(27,28,36,0.05)', borderStrong: 'rgba(27,28,36,0.1)', warn: '#a46311', danger: '#b63132', badge: '#cb4644', primary: '#5b61a7', onPrimary: '#ffffff', accentText: '#50559a', sel: 'rgba(91,97,167,0.12)', pressed: '#eeeff3', markBg: '#1b1c24', markFg: '#ffffff',
      av: { slate: '#7e8792', blue: '#7088a7', teal: '#5e918d', green: '#6f9075', amber: '#b09c78', orange: '#a27d69', rose: '#a47982', violet: '#8880a4' } },
  },
} as const

type Roles = { -readonly [K in keyof typeof PALETTES.champagne.dark]: K extends 'av' ? Record<AvKey, string> : string }
export type AvKey = keyof typeof PALETTES.champagne.dark.av

/** The live palette (starts as 炭 · 香槟 in the system's scheme). */
export const color: Roles = { ...PALETTES.champagne[Appearance.getColorScheme() === 'light' ? 'light' : 'dark'], av: { ...PALETTES.champagne[Appearance.getColorScheme() === 'light' ? 'light' : 'dark'].av } }
let version = 0

/** Rewrite `color` for a palette and scheme; returns whether anything changed. */
export function applyTheme(palette: PaletteId, scheme: 'light' | 'dark'): boolean {
  const next = PALETTES[palette][scheme]
  if (color.bg === next.bg && color.primary === next.primary && color.scheme === next.scheme) return false
  Object.assign(color, next, { av: { ...next.av } })
  version++
  return true
}

/**
 * A style sheet that follows the theme: built from `make` on first read and again after the palette changes. Reads,
 * spreads and key listings go to the current sheet, so it stands in for a StyleSheet.create() result anywhere.
 */
export function themed<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(make: () => T & StyleSheet.NamedStyles<any>): T {
  let sheet: T | undefined
  let at = -1
  const now = (): T => { if (sheet === undefined || at !== version) { sheet = StyleSheet.create(make()); at = version } return sheet }
  return new Proxy({} as T, {
    get: (_t, k) => (now() as Record<string | symbol, unknown>)[k],
    has: (_t, k) => k in (now() as object),
    ownKeys: () => Reflect.ownKeys(now() as object),
    getOwnPropertyDescriptor: (_t, k) => { const v = (now() as Record<string | symbol, unknown>)[k]; return v === undefined ? undefined : { value: v, writable: true, enumerable: true, configurable: true } },
  })
}

const PREF_KEY = 'mywork.theme'
type Prefs = { palette: PaletteId; mode: SchemeMode }
const ThemeCtx = createContext<{ palette: PaletteId; mode: SchemeMode; scheme: 'light' | 'dark'; version: number; setPalette: (p: PaletteId) => void; setMode: (m: SchemeMode) => void }>({
  palette: 'champagne', mode: 'system', scheme: 'dark', version: 0, setPalette: () => {}, setMode: () => {},
})
export const useTheme = () => useContext(ThemeCtx)

/**
 * The palette (kept on this phone) and the scheme: the system's by default, or fixed light / dark. Changing either
 * rewrites `color` before the next render and bumps `version`, which the app keys its screens on.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme()
  const [prefs, setPrefs] = useState<Prefs>({ palette: 'champagne', mode: 'system' })
  useEffect(() => {
    kvGet(PREF_KEY).then((raw) => {
      if (!raw) return
      try {
        const p = JSON.parse(raw) as Partial<Prefs>
        setPrefs({ palette: p.palette === 'mist' ? 'mist' : 'champagne', mode: p.mode === 'light' || p.mode === 'dark' ? p.mode : 'system' })
      } catch { /* a bad value: keep the default */ }
    }).catch(() => {})
  }, [])
  const scheme: 'light' | 'dark' = prefs.mode === 'system' ? (system === 'light' ? 'light' : 'dark') : prefs.mode
  // Applied during render, so this very render (and every child) already reads the new colours.
  applyTheme(prefs.palette, scheme)
  const save = useCallback((next: Prefs) => { setPrefs(next); kvSet(PREF_KEY, JSON.stringify(next)).catch(() => {}) }, [])
  const value = useMemo(() => ({
    palette: prefs.palette, mode: prefs.mode, scheme, version,
    setPalette: (palette: PaletteId) => save({ ...prefs, palette }),
    setMode: (mode: SchemeMode) => save({ ...prefs, mode }),
  }), [prefs, scheme, version, save])
  return React.createElement(ThemeCtx.Provider, { value }, children)
}

/** The palettes as the settings screen lists them. */
export const PALETTE_CHOICES: { id: PaletteId; label: string; sub: string }[] = [
  { id: 'champagne', label: '炭 · 香槟', sub: '暖炭灰与暖象牙，香槟金只给和你有关的' },
  { id: 'mist', label: '墨 · 雾紫', sub: '冷墨与低饱和雾紫' },
]
export const SCHEME_CHOICES: { id: SchemeMode; label: string }[] = [
  { id: 'system', label: '跟随系统' }, { id: 'light', label: '浅色' }, { id: 'dark', label: '深色' },
]

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 }

/** Sizes: 12 small, 13 meta, 15 UI and reading, 16 body, 26 title, 28 greeting. */
export const size = { meta: 13, small: 12, ui: 15, body: 16, title: 26, greet: 28 }

/** Titles use the platform serif (Georgia / Noto Serif); everything else the system sans. */
export const font = {
  display: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) as string,
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string,
}

/** The 8-point steps (xs 4 only for tight inline gaps; md is 16, the grid has no 12). */
export const space = { xs: 4, sm: 8, md: 16, lg: 16, xl: 24, xxl: 32, xxxl: 48 }
