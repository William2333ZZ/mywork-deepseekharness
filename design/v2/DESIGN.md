# MyWork v2 Design System

> Category: Productivity & SaaS (personal work agent)
> Base package: Open Design `notion` (warm minimalism, whisper borders, one blue) with `linear-app` list discipline. Light and dark. App density, not marketing density.

MyWork is a personal work agent: you say a result, it works in the background, delivers something, checks it, and keeps watching what you asked it to watch. The interface is a quiet workspace where the user's attention is the scarce resource. Nothing in the chrome competes with the list of things that need them.

## 1. Visual Theme & Atmosphere

Warm paper, not a screen. White pages, a warm off-white for everything that is chrome (sidebar, inputs, trays), text that is near-black with a hint of warmth, and borders so thin they read as folds rather than lines. One blue for the one action on screen. Numbers are tabular and quiet. Status is a small pill, never a colored block.

- **Visual style:** warm minimal, list-first, low chrome
- **Color stance:** warm neutrals for 90% of pixels, one accent, three semantic colors used only on status
- **Design intent:** the first screen answers "what needs me" in under three seconds; every later screen keeps the same rhythm
- **Prior art (attitude only):** Notion for warmth and whisper borders; Linear for row discipline and weight 500 UI text; Things for the calm of a today list

## 2. Color

Schema tokens (Open Design names) bound for this product. Light is the default.

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--bg` | `#ffffff` | `#191919` | page |
| `--surface` | `#f6f5f4` | `#202020` | sidebar, inputs, trays, hover fills |
| `--surface-2` | `#efedeb` | `#2a2a2a` | pressed fills, code, table heads |
| `--fg` | `rgba(0,0,0,.92)` | `rgba(255,255,255,.9)` | primary text |
| `--fg-2` | `#31302e` | `#e6e4e0` | headings on surfaces |
| `--muted` | `#615d59` | `#9b9893` | secondary text (4.5:1 on bg) |
| `--meta` | `#75706a` | `#8a867f` | timestamps, placeholders (4.8:1 light, 4.9:1 dark) |
| `--border` | `rgba(0,0,0,.1)` | `rgba(255,255,255,.1)` | whisper border, containment |
| `--border-soft` | `rgba(0,0,0,.06)` | `rgba(255,255,255,.06)` | row dividers |
| `--accent` | `#0075de` | `#529cca` | the one action: send, active nav, focus, links |
| `--accent-on` | `#ffffff` | `#111111` | text on accent |
| `--accent-hover` | `#005bab` | `#6cb0dd` | |
| `--accent-soft` | `#eef6fd` | `rgba(82,156,202,.16)` | tinted pill for accent badges |
| `--success` | `#127e28` | `#4dab7a` | verified, done (4.5:1 on bg and on its 10% tint) |
| `--warn` | `#b5480a` | `#e08a3c` | verification issues, stale |
| `--danger` | `#c0392b` | `#e26e63` | failed |

Rules:
- `--accent` appears at most once per screen: the active navigation item. The composer and its send button are neutral and do not change color; keyboard focus rings are the only other accent. Links inside documents use `--fg` with an underline.
- Semantic colors color the icon and the pill text only. Never a filled block, never a left border stripe.
- Pure black and pure white text do not exist. Gradients do not exist.

## 3. Typography

Two families, three weights.

| Role | Face | Size / line | Weight | Tracking |
|------|------|-------------|--------|----------|
| Page title (greeting, task title) | Geist, CJK: PingFang SC / Noto Sans SC | 24 / 34 (CJK 1.4) | 600 | 0 (CJK); -0.01em Latin-only |
| Section label | same | 12 / 16 | 500 | 0.02em |
| List row title | same | 14 / 20 | 500 | 0 |
| Body / document | same | 15 / 26 (CJK 1.7) | 400 | 0 |
| Small / meta | same | 12.5 / 18 | 400 | 0.01em |
| Badge | same | 12 / 16 | 500 | 0.02em |
| Numbers, timestamps, raw arguments | Geist Mono | 12 / 12.5 | 400 | 0; `font-variant-numeric: tabular-nums` |

Weights: 400 read, 500 emphasize, 600 announce. 700 is not used. Seven sizes total: 12 meta and badges, 12.5 secondary, 13 buttons and chips, 14 UI, 15 documents, 16 document h3, 24 page titles. Body copy is capped at 65ch. No uppercase labels.

## 4. Spacing & Grid

- 8px base: 4, 8, 12, 16, 24, 32, 48.
- Page gutter 24px desktop, 12px phone. Reading column 760px; task page 1120px.
- Section gap 32px; label to list 8px; list rows 12px vertical padding, 16px horizontal, minimum height 44px.
- Sidebar 240px, compact rail 56px. Hairline (`--border-soft`) between sidebar and page.
- Radii: 6px buttons and inputs, 8px rows and pills' containers, 12px cards and the composer, pill (9999px) badges. Nothing larger than 12px.

## 5. Layout & Composition

- **Sidebar** (`--surface`): the wordmark (also the home button), 新任务, 今日 / 任务 / 例行, the task history (a 进行中 group only when something runs), 设置. 交付物 and 领域 are pages reached from content, not rail entries.
- **今日** is the product's one page: a greeting; **the day's list** (reminders, failures, verification issues, running, delivered today, one row each; unrated deliveries fold into one row that opens 任务); below it **例行**, the standing things as plain rows (title, schedule, next run on the right) that open the 例行 page where they are managed, three shown and the rest folded; the composer docked at the bottom. A quiet day is one sentence.
- **Task page**: the answer is the page. Back arrow and a ··· menu (再来一次 / 重新核验 / 取消 / 原始对话); title; one meta line (verdict · pack · time); the document full width as plain text with rating and export as ghost actions under it; conversational tasks show the exchange instead; then one folded line 过程 · 读取网页 9 次 · 搜索 3 次 · 3m that opens the stream; then the follow-up field. Single column at every width, 760px reading column.
- **Deliverable**: not a card. Verifier notes (two lines, tap to expand) above the document; the document at document typography; one row of ghost actions below.
- **例行 page**: the same rows (title, schedule, next run on the right); a routine opens its own page: title, one meta line, three actions (现在跑一次 / 暂停 / 删除) as buttons, then 运行记录 as rows that open the run's task. Ended one-offs sit behind an 已结束 toggle.
- **任务 page**: the same rows with three filter chips (全部 / 进行中 / 交付物); a task opens its page.
- **Lists everywhere** share one recipe: container with whisper border and radius 12, rows divided by `--border-soft`, 20px status glyph, title, and one state on the right (text or a single button). Hover: `--surface` fill. No per-row borders, shadows, or label lines.

## 6. Components

- **Button primary**: `--accent` fill, `--accent-on` text, radius 6, height 32, padding 0 12; hover `--accent-hover`; disabled 40% opacity. One per screen.
- **Button secondary**: `--surface` fill, `--fg` text, same geometry; hover `--surface-2`.
- **Button ghost**: transparent, `--muted` text; hover `--surface` fill and `--fg` text. Toolbars use ghost.
- **Round send button**: neutral `--surface` circle, 32px, `--fg-2` arrow; disabled at 45% opacity. It never turns blue.
- **Pill badge**: 12px / 500, padding 2px 8px, `--surface` fill and `--muted` text by default; verified `--success` text on a 10% tint; issues `--warn`; failed `--danger`; accent pill `--accent-soft` + `--accent`.
- **Input / composer**: `--bg` field with a whisper border, radius 12, no shadow; focus darkens the border one step (`--border-strong`, 22% ink), never blue. No hint line under the field. Placeholder `--meta`.
- **Chip** (examples, filters): `--surface` fill, radius 8, 13px, `--muted` text; selected `--fg-2` text with a whisper border.
- **Status glyph**: 16px monoline, 1.5px stroke, colored by semantic token; running spins at 1.6s linear.
- **Toast**: `--bg`, whisper border, `--elev-raised`, radius 12, bottom right (bottom full-width on phones).
- **Empty / loading / error**: empty is one sentence in `--muted` plus the next action; loading uses the same list skeleton height; errors are a plain sentence in `--danger` with the recovery action.

## 7. Motion & Interaction

- 150ms for state feedback (hover, press, toggles), 200ms for container changes, `cubic-bezier(.2,0,0,1)`. No entrance choreography; new list rows fade in over 150ms.
- Press: `transform: scale(.98)`. Hover on rows changes fill only.
- Spinners are the only continuous animation. `prefers-reduced-motion` stops them and every transition.
- Keyboard: every control has a visible focus ring; Enter creates, Shift+Enter breaks a line, Esc closes.

## 8. Voice & Brand

- Wordmark "MyWork", mark is a 22px square in `--fg` with a white "M". No taglines in the chrome.
- Copy is sentence case, plain, in the user's language. Verbs on buttons (再来一次, 知道了, 现在跑一次). No exclamation marks, no "成功！".
- The system speaks about outcomes: "交付了", "核验发现 1 处问题", "没有变化", never about models or sessions.

## 9. Anti-patterns

- Trays inside shells inside sheets (nested containers with different radii). One container per list.
- Radii above 12px on anything but pills. Floating page sheets. Cards with both a border and a shadow, except the deliverable card and toasts.
- Tailwind indigo accents, purple-blue gradients, glass blur, colored left-border stripes on rows.
- Emoji anywhere in the chrome. Icons heavier than 1.6px stroke.
- More than two accent uses per screen. Accent on deltas or status.
- Latin negative tracking on Chinese headings; CJK headings under 1.35 line-height; body under 1.6.
- Uppercase labels; weight 700; more than three type sizes above the fold.
- Hint lines under fields (回车发送…), status captions under headings, tooltips that repeat visible text. The field and the button speak for themselves.
- Entrance animations on page load; motion longer than 200ms; anything animating width, height or position.
- Populated-only design: every list ships its empty, loading and error sentence.
- More than one list on 今日; section labels on 今日; a two-column task page; a card around the document; toolbars with more than one visible action.
