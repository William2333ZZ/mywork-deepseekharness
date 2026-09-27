# Design contract: Digital Oracle Work

## Goal and target artifact

Turn the `digital-oracle-work` branch of MyWork Kit from "a coding-agent shell with a market page" into a market-analysis workstation. Target: the running dsh web app (and the desktop shell later), not a static prototype.

## Evidence

| Evidence | Confidence | What it told us |
|----------|-----------|-----------------|
| Screenshots of the current app (home, cockpit light/dark/soft, settings) | observed | the shell reads as DeepSeek Harness + plugins; the cockpit is one panel among coding pages |
| taste-skill pass on the cockpit (Sept 27) | observed | density-8 rules already hold on the cockpit: hairline grid, mono numbers, no cards |
| Open Design `trading-terminal`, `mission-control` packages | provided | token roles, mono-for-numbers, flat borders, "readable from two meters"; both are dark-only |
| Open Design `design-brief`, `reference-design-contract`, `frontend-design`, `impeccable-design-polish`, Vercel `web-design-guidelines` | provided | nine-section contract shape, real states, anti-slop checks, a11y rules |
| User: "从产品设计角度这个不好" | provided | the complaint is product structure, not the cockpit's styling |
| Chinese A-share users read red as up | inferred (well known) | gain/loss convention must be a setting, default red-up for the Chinese edition |

## Keep / change / do not copy

| Keep | Change | Do not copy |
|------|--------|-------------|
| The kit's token system (`--dsw-alias-*`), style families, light + dark | the default family becomes a terminal family; landing becomes the cockpit | trading-terminal's dark-only rule and its literal palette |
| The cockpit's structure (temperature grid, question rows, watchlist, positions, reports) | wordmark, navigation, hero, session list, session titles, hidden coding affordances | Bloomberg/TradingView screens or copy |
| dsh's conversation engine and settings shell | the coding-agent vocabulary in the edition (工作区, 访问模式, 扩展管理) | any Open Design template HTML verbatim |

## Design stance

A calm terminal. Neutral surfaces, one blue action color, red/green that the user can flip, JetBrains Mono for every number, Geist for words, 1px borders and no shadows. The first screen is the market; the conversation is where a question gets answered; the report is what remains. Everything that belongs to a coding agent is hidden behind 更多 or removed from the edition.

## Risks and unknowns

- Product name is not decided; `EDITION_NAME` is a single constant in shell and codex-ui.
- dsh's hero DOM uses hashed class names; hiding its title relies on `[class*="_titleGroup"]` and may need a bump on dsh upgrades.
- Hiding the access-mode picker removes a real control; it is hidden only in edition mode and is still available in dsh settings.
- Price signals depend on yfinance; the settings tab installs it, but the cockpit must degrade (tiles missing, not broken).

## Quality gate

- [ ] Landing on the cockpit at first paint; no slogan hero anywhere in the edition
- [ ] Sidebar shows only edition items; coding items live under 更多
- [ ] Session titles are questions, no emoji, no category prefix
- [ ] Terminal family passes WCAG AA in light and dark for primary / secondary / tertiary text and both button styles
- [ ] Gain/loss convention setting works and persists; sign always accompanies color
- [ ] Vercel guidelines: icon buttons have `aria-label`, inputs have labels, `:focus-visible` everywhere, reduced motion honored
- [ ] Zero em/en dashes, no uppercase eyebrows, ≤ 1 middle dot per line
- [ ] Screenshots in light, dark, and at 1024px width
