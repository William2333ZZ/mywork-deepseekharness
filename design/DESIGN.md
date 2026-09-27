# 交易工作台 (Trading Workbench) Design System

> Category: Themed & Unique (Finance / Trading analysis)
> A market-analysis workstation: dense, numeric, calm. The cockpit is the product; conversations are analyses; reports are the output. Light and dark, never dark-only.

Product name: **交易工作台** (Trading Workbench). The analysis engine inside it keeps its own name, 市场先知 (Digital Oracle): 交易工作台 is the product, 驾驶舱 is its home, 市场先知 answers the questions. The wordmark is one constant (`EDITION_NAME`).

## 1. Visual Theme & Atmosphere

A workstation, not a chat app and not a coding agent. The user opens it to see where the market is, asks one question at a time, and keeps the answers. Every screen answers "what is the number, what changed, what does it mean" in that order.

- **Visual style:** dense operational, terminal-adjacent, flat
- **Color stance:** neutral surfaces, one accent for actions, semantic gain/loss colors that the user can flip (China: red up, green down; international: green up, red down)
- **Design intent:** readable at a glance, stable under live data, identical structure in light and dark
- **Prior art (keep the attitude, not the pixels):** Bloomberg Terminal and TradingView for density and monospace numerals; Linear for restraint and hairline structure; Open Design's `trading-terminal` and `mission-control` packages for token roles

## 2. Color

Roles, not brand names. The kit already exposes every role as a `--dsw-alias-*` token; the terminal family below binds them.

| Role | Light | Dark | Usage |
|------|-------|------|-------|
| Background | `#F6F5F2` | `#0E1116` | page canvas |
| Surface | `#FFFFFF` | `#141920` | sidebar, panels, composer |
| Surface 2 | `#EEECE7` | `#1B2129` | inputs, hover |
| Border | `#DAD7D0` | `#263040` | hairlines (1px, never 0.5px) |
| Text | `#161A1F` | `#EEF2F6` | primary |
| Text secondary | `#5B6470` | `#A7B1BE` | labels |
| Text tertiary | `#75808C` | `#7F8B98` | timestamps, hints (still ≥ 4.5:1) |
| Accent | `#1F6FEB` | `#5AA0FF` | the one action color: 问先知, focus rings, active nav |
| Gain | `#1A8F5A` | `#3CCB7F` | positive change (international) |
| Loss | `#C93C3C` | `#FF6B6B` | negative change (international) |
| Warning | `#B7791F` | `#F2B84B` | stale data, cooldown |

Rules:
- Accent appears at most three times per viewport. Deltas are never accent.
- Gain/loss are semantic and paired with a sign (+ / -) so color is never the only signal. The user chooses the convention once (设置 → 市场先知 → 涨跌配色); the default for the Chinese edition is red up.
- No gradients, no glow, no pure black or pure white.

## 3. Typography

| Role | Face | Size / weight | Where |
|------|------|---------------|-------|
| Numbers | JetBrains Mono (bundled) | 12 / 14 / 22 / 30, 500 | every figure, delta, timestamp; `font-variant-numeric: tabular-nums` |
| UI | Geist (bundled), CJK: PingFang / Noto Sans SC | 12 / 13 / 14 / 18, 400–600 | labels, questions, navigation |
| Display | Geist 600, 18–22px | | page titles only; no hero headline larger than 22px |

Two families total. No serif. No uppercase-tracked eyebrows. Labels are sentence case at 12px secondary.

## 4. Spacing & Grid

- 4px base; component padding 12/14px; section gap 30px; page gutter 28px.
- Data grids share 1px borders, no gaps, no card shadows. The last row of a flex grid always fills the width.
- Sidebar 260px expanded, 56px compact. Content max-width 1400px.

## 5. Layout & Composition

- **Landing = cockpit.** The app opens on 市场先知. Nothing else is the home.
- **Sidebar (edition mode):** wordmark, 驾驶舱, 新分析, 分析记录 (flat, newest first, no workspace grouping), collapsed 更多 (定时巡检, IM 助理, MCP, 插件市场), 设置.
- **Analysis view:** the conversation. The hero shows the five questions and a question box, not a slogan. No workspace picker, no access-mode picker, no file/@ affordances that belong to coding.
- **Reports** live in the cockpit archive and open their conversation.
- Three layout families across the cockpit: hairline grid (temperature), rows (questions), tables (watchlist / positions / reports). Do not add a fourth.

## 6. Components

- **Buttons:** one primary style (accent fill, inverted text), one quiet style (1px border). Radius from the family (terminal: 4px). `:active` moves 1px down. Labels ≤ 4 characters in Chinese, one intent per label (问先知 is the only primary action).
- **Inputs:** 1px border, transparent fill, label above or `aria-label`, placeholder ends with …, focus ring 2px accent.
- **Tiles:** label, value (mono), delta (mono, semantic color, signed), meaning (≤ 2 lines), source on hover. Lead tiles are 2× wide.
- **Tables:** header 11.5px tertiary, rows separated by 1px soft border, numbers right-aligned mono.
- **Empty states:** a bold one-liner plus one sentence saying how to fill it. **Loading:** skeleton in the final shape. **Errors:** inline, red text, never a toast for data problems.
- **Sparklines:** 1.5px stroke, semantic color, no axis, no fill.

## 7. Motion & Interaction

- 90–160ms transitions on transform, opacity, background and border only. No `transition: all`.
- Data never animates decoratively; a value swap is instant. Skeleton shimmer only when the OS allows motion.
- Everything reachable by keyboard: Enter submits a question row, `:focus-visible` rings everywhere.

## 8. Voice & Brand

- Chinese first, English complete. Plain functional labels: 驾驶舱, 新分析, 分析记录, 报告, 自选, 持仓, 问先知.
- Copy states facts and uncertainty; no marketing adjectives, no exclamation marks, no emoji in titles or UI (line icons only).
- Analysis, never advice: the product does not place orders, hold accounts, or say "buy". Positions are the user's own numbers and are only used for P&L and context.
- Session titles are the question, trimmed, with no category prefix.

## 9. Anti-patterns

- The coding-agent shell showing through: workspace / project lists, 扩展管理 as a top-level item, "工作区内修改", file attachments as the main affordance, emoji-prefixed session titles.
- A slogan hero ("探索未至之境") on a product whose first screen should be data.
- Cards inside cards, rounded 16px panels, shadows on data.
- Color as the only gain/loss signal; ignoring the Chinese red-up convention.
- Em-dashes and en-dashes in copy; middle-dot chains; uppercase eyebrows; decorative dots.
- Dark-only. The kit ships light and dark and the family must hold in both.
