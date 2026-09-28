**English** | [中文](README.md)

# Trading Workbench (交易工作台)

A one-person trading analysis workstation. It answers "how likely is this", "is this a buy right now" and "are institutions buying or selling" from market trading data, never from news or opinions. Watch the market, ask, keep the answer, review it later; a daily check pushes a digest on its own.

It runs on [DeepSeek Harness](https://github.com/deepseek-ai/dsh) as the trading edition of [MyWork Kit](docs/mywork-kit-README.en.md): dsh itself is untouched, everything is a plugin. The analysis engine is a bundled [Digital Oracle](https://github.com/komako-workshop/digital-oracle) (komako-workshop, MIT): 13 free data sources, no API keys.

**Analysis only.** It does not place orders, connect to brokers or exchanges, or give personal investment advice. Positions are numbers you type in, used only for P&L and as analysis context.

![Demo](docs/demo/trading-workbench.gif)

## At a glance

| Cockpit | Ask |
| --- | --- |
| ![Cockpit](docs/screenshots/tw-01-cockpit.png) | ![Ask](docs/screenshots/tw-02-ask.png) |

| Reports | Checks |
| --- | --- |
| ![Reports](docs/screenshots/tw-03-reports.png) | ![Checks](docs/screenshots/tw-04-patrol.png) |

| Analysis | Dark |
| --- | --- |
| ![Analysis](docs/screenshots/tw-05-analysis.png) | ![Dark](docs/screenshots/tw-06-cockpit-dark.png) |

## The loop

```
watch ──▶ ask ──▶ report ──▶ archive ──▶ review
  ▲                                       │
  └──────────── daily check ◀─────────────┘
```

- **Cockpit (home):** market temperature (Fear & Greed, 10Y real rate, 10Y-2Y spread, gold, copper/gold, oil, USD/CNY, BTC futures basis, CFTC gold positioning, A-share sector inflow, Polymarket Fed and recession contracts) with a regime word per tile and a rule-built market read; today's changes versus yesterday's snapshot; sector fund flow; your symbols and positions in one table with an Analyze action per row and the latest report's probability; recent reports. Gain/loss colours can follow the Chinese convention (red up, default) or the international one.
- **Ask:** the conversation entry, with the cockpit's essentials above the composer. Analyze on a symbol opens a conversation carrying its quote, your position, the market temperature and the sources to pull, and sends it. The model follows Digital Oracle's five-step method and reports in a fixed structure: layered signals, contradictions, probability scenarios with horizons, consistency. Reports are archived automatically; session titles are the question.
- **Reports:** one row per report, probability first; filter by symbol or topic, search; the probability history per symbol is the review; mark each report right or wrong afterwards.
- **Checks:** a switch, a time, three checkboxes and a Feishu account. A data-only digest (market temperature and changes, symbols and positions, reports due for review) is pushed at the set time; preview and push-now included.

## Run it

Node 24, pnpm and Python 3.9+ (macOS ships one).

```bash
git clone -b digital-oracle-work https://github.com/William2333ZZ/mywork-deepseekharness.git
cd mywork-deepseekharness
bash scripts/dev-env.sh start
```

Open the token URL printed after `dsh web:` in `.dsh-dev-home/web.log`. Configure the DeepSeek key the way dsh does (Settings → Models); never commit it. US price history and options chains need `yfinance` (one click in Settings → MyWork → 市场先知, or `uv pip install yfinance`); the other twelve sources are standard library only.

The desktop shell in `apps/desktop/` (TradingWorkbench, window title 交易工作台) bundles Node, dsh and Chrome for Testing with a native embedded browser; packaging is described in [apps/desktop/README.md](apps/desktop/README.md).

## Data sources

Polymarket, Kalshi, Yahoo Finance (prices and options), US Treasury, CFTC COT, SEC EDGAR, Deribit, CoinGecko, BIS, World Bank, Eastmoney (A-share quotes, order-size fund flow, sector rotation), CNN Fear & Greed, web search. All free, no keys. Signals refresh every 15 minutes, watchlist quotes every 5; manual refresh has a 45-second cool-down.

## Design

- [design/PRODUCT.md](design/PRODUCT.md): product design (audience, loop, IA, screens, phases)
- [design/DESIGN.md](design/DESIGN.md): the visual contract (Open Design's nine sections)
- [design/design-contract.md](design/design-contract.md): evidence, keep/change, quality gate
- [docs/DEMO.md](docs/DEMO.md): demo script

Default style "market terminal": neutral surfaces, one blue action colour, semantic gain/loss, Geist with JetBrains Mono, 1px hairlines, 4px radius, WCAG AA in light and dark. Claude Code, soft, editorial-minimal and brutalist styles are also available.

## Relation to MyWork Kit

This branch is the kit's trading edition. `main` stays the generic kit and is merged into this branch, never the reverse. Differences are listed in [DISTRIBUTION.md](DISTRIBUTION.md); the kit's own README is kept at [docs/mywork-kit-README.en.md](docs/mywork-kit-README.en.md).

## License

MIT. The bundled Digital Oracle is MIT (komako-workshop). Open Design's method and design-system packages are Apache-2.0 (nexu-io); this repository uses the method only and contains none of its code.
