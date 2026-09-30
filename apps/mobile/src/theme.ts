/**
 * MyWork mobile — the same tokens as the web contract (design/v2/DESIGN.md), in RN units.
 * Warm black on warm white, one accent used at most twice, three weights, serif for titles.
 */
import { Platform } from 'react-native'

export const color = {
  bg: '#ffffff',
  surface: '#f6f5f4',
  surface2: '#efedeb',
  fg: '#1f1d1a',
  fg2: '#31302e',
  muted: '#615d59',
  meta: '#75706a',
  border: 'rgba(0,0,0,0.10)',
  borderSoft: 'rgba(0,0,0,0.06)',
  borderStrong: 'rgba(0,0,0,0.22)',
  success: '#127e28',
  warn: '#b5480a',
  danger: '#c0392b',
  accent: '#0075de',
  warmWhite: '#fbfaf8',
}

export const radius = { sm: 6, md: 8, lg: 12, xl: 22 }

/** Sizes: 13 meta, 15 UI, 16 reading, 26 title, 28 greeting. */
export const size = { meta: 13, small: 12.5, ui: 15, body: 16, title: 26, greet: 28 }

/** Titles use the platform serif (Georgia / Noto Serif); everything else the system sans. */
export const font = {
  display: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) as string,
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string,
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }
