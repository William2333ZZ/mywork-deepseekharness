# Design contract: MyWork v2

## Goal and target artifact

The running dsh web app on branch `research-muse-paseo` (v2 shell: `packages/tasks` pages, `packages/codex-ui` sidebar and settings), light and dark, desktop and phone. Audience: an individual knowledge worker in China who hands work to an agent and comes back for results; not a developer.

## Evidence

| Evidence | Confidence | What it told us |
|----------|-----------|-----------------|
| Screenshots of the current v2 (今日, task page, 例行, settings; 1400 and 390 wide; light and dark) | observed | three visual passes in one day piled up containers (tray in sheet in canvas), radii up to 28px, and an entrance animation; the user rejected it twice |
| Manus home and task page (public site), Grok home (live) | observed | one input, one job per screen, chrome that disappears; Manus's task page is stream left, computer right |
| Open Design `notion` package (`DESIGN.md`, `tokens.css`, USAGE) | provided | warm neutrals, whisper borders, one blue, pill badges, 4-layer sub-0.04 shadows, 4/8/12 radii |
| Open Design `linear-app` package | provided | list rows, weight 500 UI text, semi-transparent borders, achromatic everything but one accent |
| Open Design craft: `anti-ai-slop`, `typography` (CJK leading and tracking), `color` (accent cap, contrast gates), `animation-discipline`, `state-coverage` | provided | the hard rules in section 9 of DESIGN.md |
| User: 「UI和设计我觉得不好看」「用 open design，UIUX 都不对」 | provided | the complaint is coherence and taste, not a missing feature; the fix is a contract and discipline, not more effects |
| The kit already serves Geist and Geist Mono offline | observed | no new webfont work needed; CJK falls back to system fonts |

## Keep / change / do not copy

| Keep | Change | Do not copy |
|------|--------|-------------|
| Notion's warm neutral scale, whisper borders, single blue, pill badges, shadow philosophy | marketing scale (64px display, 80px sections) becomes app scale (24px titles, 32px sections); NotionInter becomes Geist | Notion's logo, illustrations, copy, page layouts, the name of the font |
| Linear's row discipline, weight 500 UI, mono meta | Linear's dark-native palette becomes light-default with a dark twin | Linear's indigo |
| Manus's task page split (stream left, result right) and one-input home | the home leads with 等你看, not the input | Manus's chrome, icons, wording |
| Everything already working: pages, routes, events, engine | the CSS layer only, plus small markup changes for list containers | |

## Design stance

A warm paper workspace with list discipline. White pages, warm off-white chrome, whisper borders, one blue used twice, three semantic colors only on status pills, Geist at three weights, tabular mono for numbers. Lists share one recipe; the deliverable card is the only raised object besides toasts. Motion is 150ms feedback and nothing else. The first screen is what needs the user.

## Risks and unknowns

- Chinese typography: Geist has no CJK glyphs; PingFang SC (macOS) and Noto Sans SC / Microsoft YaHei (Windows) render the Chinese. Line-heights are set for CJK, so Latin-only lines look slightly airy. Accepted.
- Notion's `--meta` (#a39e98) fails 4.5:1 on white at small sizes; this contract darkens it to #75706a (4.8:1) and uses #8a867f on the dark page (4.9:1).
- dsh's sidebar rail at 56px on phones is outside this contract; only its contents are styled here.
- The settings page is dsh's shell with our palette; its internal cards keep dsh's component recipes.

## Quality gate

- [ ] Every raw color in the two client stylesheets is a token from DESIGN.md section 2 (no stray hex outside `:root`-style token blocks).
- [ ] At most two `--accent` uses visible on 今日 and on the task page.
- [ ] No radius above 12px except pills; no nested containers with different radii.
- [ ] Chinese headings at line-height ≥ 1.35, body ≥ 1.6, no negative tracking on CJK.
- [ ] Only three weights (400/500/600); six type sizes.
- [ ] 今日, 任务, 交付物, 例行, 领域 each render empty and error sentences.
- [ ] No page-load animation; transitions ≤ 200ms; reduced motion honoured.
- [ ] Contrast: muted ≥ 4.5:1, meta ≥ 4.5:1 at 12px+, pills ≥ 4.5:1 on their tints.
- [ ] Phone (390px): no horizontal scroll, composer reachable, rows ≥ 44px tall.
