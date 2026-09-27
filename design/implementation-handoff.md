# Implementation handoff

Read first: `design/DESIGN.md`, then `packages/oracle/README.md` (cockpit), `packages/shell/src/client/index.js` (families), `packages/codex-ui/src/client/CodexSidebar.tsx` (navigation).

## Edition switch

`packages/codex-ui` decides "edition mode" when the `mywork.oracle.section` slot has a provider (the oracle plugin is installed). `MYWORK_EDITION=kit` in localStorage (`dsh-mywork:edition`) turns it off for debugging. The product name lives in `EDITION_NAME` (codex-ui) and the shell's `EDITION` block.

## Tokens, type, layout

- Add the `terminal` family to the shell: light and dark maps from DESIGN.md §2, fonts `/mywork-shell/fonts.css` (Geist + JetBrains Mono), `--mwc-radius: 4px`, 1px borders. It is the default family for the edition.
- Numbers: `--dsw-font-mono`; the cockpit already uses `.num`.
- Sidebar and hero copy from DESIGN.md §5 and §8; locales in `locales.ts`.

## Asset rules

No images, no illustrations, no emoji. Line icons from `scripts/client-icons.cjs` (kit) or lucide in codex-ui (already a dependency).

## Responsive

Cockpit collapses to one column under 980px (already), sidebar compacts under 80px; nothing overflows horizontally at 1024px.

## First artifact should prove

1. Opening the app lands on the cockpit with the terminal family in light and dark.
2. The sidebar reads 驾驶舱 / 新分析 / 分析记录 / 更多 / 设置 and the wordmark is the product's.
3. A question asked from a cockpit row produces a session titled by the question, listed under 分析记录, and a report card in the archive.
4. Flipping 涨跌配色 recolors every delta and sparkline without reload.
