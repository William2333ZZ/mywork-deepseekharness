/**
 * MyWork mobile — the web client's dark tokens (packages/tasks client, Rakazo look), in RN units.
 * Near-black page, slightly lifted surfaces; text is #ececee at 100 / 65 / 40 %, borders white at 10 / 5 %. Colour only
 * where it carries a decision (danger: failures; warn: needs you); the cream primary is the send button and the unread
 * dot (and the MyWork mark). Spacing 4 / 8 / 16 / 24 / 32 / 48; three weights, serif for titles.
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
  /** Text, 100 %. */
  fg: '#ececee',
  /** Secondary text, 65 %. */
  fg2: 'rgba(236,236,238,0.65)',
  muted: 'rgba(236,236,238,0.65)',
  /** Tertiary text (meta), 40 %. */
  meta: 'rgba(236,236,238,0.5)',
  /** Structural lines, 10 %. */
  border: 'rgba(255,255,255,0.1)',
  /** Subtle lines, 5 %. */
  borderSoft: 'rgba(255,255,255,0.05)',
  borderStrong: 'rgba(255,255,255,0.1)',
  warn: '#f0a33a',
  danger: '#f07167',
  /** The cream primary: the send button and the unread dot (and the MyWork mark). */
  primary: '#f1f1ef',
  onPrimary: '#0b0c0e',
  pressed: '#1b1d22',
}

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
