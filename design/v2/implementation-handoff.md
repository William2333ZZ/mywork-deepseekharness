# Implementation handoff: MyWork v2

Files to read first: `design/v2/DESIGN.md` (binding), `design/v2/design-contract.md` (why), then the two stylesheets you will change:

- `packages/tasks/src/client/index.js` → the `STYLE` constant (all page CSS) and small markup for list containers
- `packages/codex-ui/src/client/MyworkSidebar.tsx` → `stylesheet`
- `packages/codex-ui/src/client/settings-page-styles.ts` → the `body[data-mywork-v2]` block

Tokens: define the section-2 tokens once on `.mwt` and once on `.mws` (they are separate bundles) with the Open Design names (`--bg`, `--surface`, `--surface-2`, `--fg`, `--fg-2`, `--muted`, `--meta`, `--border`, `--border-soft`, `--accent`, `--accent-on`, `--accent-hover`, `--accent-soft`, `--success`, `--warn`, `--danger`, `--font-body`, `--font-mono`, `--radius-sm 6`, `--radius-md 8`, `--radius-lg 12`, `--elev-raised`, `--focus-ring`, `--motion-fast 150ms`, `--motion-base 200ms`, `--ease-standard`). Dark values under `body[data-ds-dark-theme]`. No other colors.

Type: Geist / Geist Mono from `/mywork-shell/fonts.css` (already linked by the tasks client). Sizes 12, 12.5, 14, 15, 16, 24. Weights 400/500/600. CJK leading per DESIGN.md.

Layout constraints: sidebar `--surface`, page `--bg`, hairline between; reading column 760px, task page 1120px; gutters 24/12; section gap 32; rows ≥ 44px.

Lists: one recipe (`.mwt-list` container: border `--border`, radius 12, overflow hidden; `.mwt-row`: grid 20px / 1fr / auto, padding 12px 16px, divider `--border-soft`, hover `--surface`). Apply it to 等你看, 进行中, 今天, 最近, 任务, 交付物, 例行 and the sidebar task groups (sidebar rows have no container).

Raised objects: composer card and deliverable card (`--elev-raised` + `--border`), toasts. Nothing else has a shadow.

Motion: `--motion-fast` for hover/press/fill changes, `--motion-base` for the composer expanding; remove `mwt-up` and every entrance animation; keep spinners; wrap in `prefers-reduced-motion`.

States: each page keeps its empty sentence; add a loading skeleton row (same height) while the first poll is in flight; errors as a `--danger` sentence with the retry action.

Responsive: below 720px the task page stacks, the composer stays docked with safe-area padding, document tables scroll horizontally, toasts go full width.

First artifact should prove: 今日 at 1400 and 390 with a reminder, a failed task and an unrated delivery in 等你看; the task page with a verified document; dark theme of both. Reviewer runs the quality gate in `design-contract.md`.
