/**
 * MyWork mobile — the web client's dark tokens (packages/tasks client, Rakazo look), in RN units.
 * Near-black page, slightly lifted surfaces, one cream primary; three weights, serif for titles.
 */
import { Platform } from 'react-native'

export const color = {
  bg: '#0b0c0e',
  surface: '#111215',
  /** Rows, cards and the reply bubble. */
  card: '#141518',
  /** Inputs, the composer, chips. */
  input: '#18191e',
  surface2: '#18191e',
  /** The user's bubble. */
  bubble: '#22242b',
  fg: '#ececee',
  fg2: '#d2d2d6',
  muted: '#85858a',
  meta: '#6c6c72',
  border: '#1e2026',
  borderSoft: '#17191d',
  borderStrong: '#2c2f37',
  success: '#5ccf85',
  warn: '#f0a33a',
  danger: '#f07167',
  accent: '#7aa7ff',
  /** The cream primary: send, primary buttons, unread dots, the MyWork mark. */
  primary: '#f1f1ef',
  onPrimary: '#0b0c0e',
  warmWhite: '#f1f1ef',
  pressed: '#1b1d22',
}

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 }

/** Sizes: 13 meta, 15 UI, 16 reading, 26 title, 28 greeting. */
export const size = { meta: 13, small: 12.5, ui: 15, body: 16, title: 26, greet: 28 }

/** Titles use the platform serif (Georgia / Noto Serif); everything else the system sans. */
export const font = {
  display: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) as string,
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string,
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }
