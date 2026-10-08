# 复核记录（第二轮，13 组）

每组复核员重新打开一手来源，能跑的就实际跑一遍，对第一轮的说法逐条给出：confirmed（确认）、corrected（纠正）、refuted（推翻）、unverified（没法确认）。下面是每组的意外发现（SURPRISES）、建议基于什么来做（BEST PICKS），以及被纠正或推翻的条目。原文为英文。

注意：复核机器的网络出口在境外，「能通」只说明接口活着，不代表大陆直连可用。

```text
===== ths
SURPRISES: 1. A missing or wrong key on the fuyao service does not look like an error. initialize and tools/list work with no key, and tools/call returns HTTP 200 with an ordinary result containing code 2003. MyWork would show the six servers as connected with 72 tools while every call fails; the teammate's instructions (or a wrapper) must check code==0, and the setup flow needs a real test call.

2. There is no price and no quota because the service is in beta ("内测", owner statement 2026-09-16). It is free and uncapped today, throttled by an undisclosed dynamic limit that users hit at one request per 5 seconds in peak hours. Two pricing questions from users are still unanswered. Build so the data source can be swapped or metered later.

3. The scouts' catalogue was the documented one. Live MCP serves 72 tools, the docs list 87, and the CLI/REST expose 88. REST or CLI is the complete surface; MCP lags.

4. The most valuable finance data is deliberately withheld from the API: capital flow (主力资金), high-frequency activity, the graded news-event library, and futures macro are "端内专用", available only inside 同花顺AI客户端 (lumi.10jqka.com.cn). 同花顺 is shipping its own desktop AI client with this data built in, and the open API is positioned as the funnel to it. That is a direct competitor to the finance product.

5. Loading all six fuyao MCP servers puts about 100 KB of tool schemas into context (futures alone is 41 KB). For a DeepSeek-backed teammate it is cheaper to connect only a-share + a-share-index + meta (about 30 KB) or to call REST from a skill.

6. Getting the key needs a QR scan with the 同花顺 app in a real browser, which matches MyWork's log-in-by-hand Chrome. The official note says the admin URL must keep its trailing slash or the login is lost.

7. The CLI's postinstall copies its 12 skills into whatever agent folders it detects in the user's home. With an empty sandbox home it wrote nothing; on a real machine it will. Install with --ignore-scripts if it goes into the installer. Its native DuckDB binary adds 38 MB on Windows x64 and 113 MB on macOS arm64.

8. iFinD MCP differs from what third-party pages say: the Authorization header carries the raw key (no Bearer), the port is 8643, nothing works keyless, and the free tier is 2,000 calls in total rather than per month. Its tools take free-text queries, so cost and accuracy depend on how the model phrases and splits them.

9. Reachability caveat: this machine routes everything through a TUN/fake-ip proxy, so every live result proves the endpoints are alive, not that they work proxy-free. Both services resolve to mainland addresses (60.204.3.68 and 122.224.107.237), the npm package is on npmmirror, and the repo has a Gitee mirror, so I expect the mainland path to be the good one. The only network complaint on record is from overseas.

Working files are in <scratch> (live.tools.*.json are the six live tool lists; clirun/caps.json is the CLI capability list; live/ifind/ holds the iFinD site bundle and official skill package). That folder already contained files from an earlier run when I started; I re-ran every live check myself and used the earlier repo extraction only after confirming it matches current HEAD 3bca780.
BEST PICKS: 1. fuyao REST + the three core MCP endpoints (a-share, a-share-index, meta) with the user's sk-fuyao key. No runtime, free today, mainland-hosted, static header only. This is the base for the finance teammate: daily review routines over limit-up pool and ladder, hot lists, dragon-tiger list, mover reasons, financial statements, valuation and sector data, written into its tables. Use REST for scheduled routines and for the 15 tools MCP does not serve.

2. The repo's prompt and routing material, rewritten rather than shipped: the intent-to-endpoint table, the error-code handling rules and the 16 report prompts with reference HTML give a finance teammate its report formats on day one. Drop the skill's self-install/self-update steps and its no-advice stance.

3. iFinD MCP as the optional paid add-on (user's own key, 2,000 free calls then from ¥40/month) for what fuyao cannot give: news and announcement search, macro series, HK/US, bonds, same-day realtime. Offer it as a second connection the user turns on, with a per-day call budget in the teammate's instructions.

The CLI is a later addition, only if users want bulk history and SQL over a local DuckDB; it runs on the bundled Node 24.21.0 but costs 40-115 MB per platform.
ITEMS:
- [user-key] HiThink-Tech/Financial-API — six hosted MCP endpoints (fuyao.aicubes.c | runtime: None. Remote streamable HTTP with one static header, which is exactly what MyWork's MCP client supports. No OA | access: One key for MCP, REST and CLI, format sk-fuyao-<32 chars>. Issued at https://fuyao.aicubes.cn/admin/ after logging in with a 同花顺 account (passport iframe upass.aicubes.cn, QR scan with the 同花顺 app). T
    * CORRECTED: Authenticated by an X-api-key header -> The key is only checked on tools/call, and the failure is NOT an HTTP 401 nor an MCP isError: it is a successful tool result carrying business code 2003. A client showing 'connected, N tools' proves nothing about the key; the teammate must test code==0 on ever
    * CORRECTED: Tool catalogue (what the endpoints actually serve) -> 15 documented tools are not live on MCP: fund backtest x2, fund indicators line/table, QDII quota x2, 7 futures catalogue tools (contracts list, main, secondary-main, main-continuous, commodity index, variety plates, session timeline), options contracts list a
    * CORRECTED: Coverage excludes minute K-lines, HK/US, macro and news/announcement text -> Some text and intraday data does exist publicly: get_a_share_special_data_anomaly_analysis_stock returns analysis_content + keyword_list (reason text for today's movers, max 50 codes); get_fund_news_article_list returns title/summary/source/url metadata; futur
- [user-key] HiThink-Tech/Financial-API — Node CLI @hithink-tech/hithink-finance-cl | runtime: Node >= 22.12.0 (works on MyWork's bundled 24.21.0). Two native dependencies with prebuilt binaries per platfo | access: Same sk-fuyao key as the MCP endpoints; free in beta. Key via env HITHINK_FINANCE_API_KEY, stdin, a user-level credentials.env, or the OS keychain.
    * CORRECTED: Install side effects (scouts did not report) -> On 0.1.13 the sync is detection-based, so on a real machine it will copy 12 hithink-finance-* skills into whichever agent folders it detects (for example ~/.claude/skills). Installing with `npm install --ignore-scripts` avoids this and the CLI still works; tha
- [borrow-format] HiThink-Tech/Financial-API — hithink-finance SKILL.md, 12 CLI domain s | runtime: None for the markdown. The skill text tells the agent to pick CLI, MCP or REST and, in places, to install the  | access: The files are free to copy; anything they do at run time needs the sk-fuyao key.
- [user-key] HiThink-Tech/Financial-API — REST API and Market Dumps | runtime: None (plain HTTPS GET with one header). | access: Same sk-fuyao key, free in beta, 同花顺 account login by QR scan in a real browser.
    * CORRECTED: An individual can get the key; free quota and price -> There is no free quota and no price list at all: it is uncapped and free during a beta, with unspecified dynamic throttling, and pricing is an open question (issues #57, #58 unanswered by the owner). The official onboarding note also warns that the admin URL m
- [user-key] 同花顺 iFinD official MCP (mcp.51ifind.com) | runtime: None as MCP (streamable HTTP or SSE with a static Authorization header). The official skill alternative is a z | access: Log in at https://mcp.51ifind.com/ with a 同花顺 app account or iFinD account, copy the key from 个人中心 → 密钥. 2,000 free calls in total at 2 per second, then ¥40 to ¥199 per month for individuals.
    * CORRECTED: Auth header -> The header is Authorization with the raw key, not 'Bearer <key>' as third-party pages describe. Unlike the fuyao endpoints, nothing works without a key, including tools/list. Transport options offered are streamablehttp and sse. The port is 8643, not 443.
    * CORRECTED: Tool list -> 38 tools across 8 domain services, plus an all-in-one service (hexin-ifind-ds-mcp) and two separate services for company registry data (kuaicha-enterprise-mcp) and law (hexin-law-mcp). Most tools take a single natural-language `query` string (up to about 5 sec

===== wind
SURPRISES: 1) The CLI is unnecessary. Wind's own portal publishes the manual config for each service as {type:"streamablehttp", url:"https://mcp.wind.com.cn/vserver_<domain>/mcp/", headers:{Authorization:"Bearer YOUR_WIND_KEY", Accept:"application/json, text/event-stream"}} — exactly MyWork's 'streamable-http + static headers' path. The servers are stateless (the CLI sends initialize then tools/call with no session header). One key field in MyWork can light up 7 MCP servers / 35 tools with no code shipped.

2) The free tier shrank and its unit cost is opaque. Portal string: '自9月11日起，每日赠送积分将调整为 300 积分' (it was 1,000/day in June); unused daily points are removed at day cut; ¥100 buys 10,000 permanent points (tiers ¥100–1,000, WeChat/Alipay). The points charged per tool call are not published (login-only), so nobody has verified how many watchlist briefings 300 points covers. Design for a budget: batch quotes (the price-indicator tools take up to 50 codes per call), avoid analytics_data (SKILL.md says it costs more), show the user a points warning, and do not make Wind the only source for a daily routine.

3) aifinmarket.wind.com.cn now 301-redirects to market.windalice.com ('Alice Market'); signup is mobile number + SMS (individual OK per portal code; I did not register). GitHub Wind-Information-Co-Ltd/wind-skills and Wind-Alice/AliceMarket are the same repo; Gitee wind_info/wind-skills redirects to WindAlice/AliceMarket and is content-identical.

4) If the CLI is shipped anyway: after each successful call it spawns a detached `node` that runs `npx skills update wind-mcp-skill -y` (self-update from GitHub/Gitee), writes update-state.json into the skill folder and ~/.cache/wind-aifinmarket; and a key in ~/.wind-aifinmarket/config overrides the WIND_API_KEY env var (README states the reverse). Delete scripts/update-check.mjs to switch the updater off.

5) 69 of the 78 skills are plain markdown (60 are single 2–3 KB files) and contain no data logic at all — they are report templates plus checklists that say 'use wind-mcp-skill'. Each also starts with an `npx skills add … -g -y` install block that should be stripped. So 'Wind has 78 skills' really means: 1 data connector + ~65 prompt templates + a few Python/US-oriented extras. The trading-decision ones give structure (price/logic/time stop, tranche plan, invalidation) but no numeric rules.

6) The repo README is stale (says 34 skills; lists a global_stock_data server_type that CLI v2.0.4 no longer has — HK/US now go through stock_data). 14 Wind-official 'Alice' skills shown in the portal are not in the repo; they only run server-side through wind-alice (minutes per run, extra points, separate trial cap).

7) Everything was reached through this machine's TUN proxy, so mainland-direct access is a judgement, not a test: all Wind hosts resolve to China Telecom Shanghai IPs (114.80.213.29 / 180.96.8.108), so direct access should be the normal case. GitHub and `npx skills` (npm registry) are the weak links for mainland installs — vendoring the folder avoids both.

8) A keyless public endpoint returns the whole skill catalog (89 records, Chinese names/descriptions/categories/download counts): POST market.windalice.com/Wind.AIMarket.Service/mcp-config/skills.

Housekeeping: my working files are under <scratch> (AliceMarket/, gitee-mirror/, portal/, fakehome/, ps-out/). That folder also contained files dated 00:29–00:37 that I did not create (README.md, paid-agreement.txt, portal-skills.json, skillmd/, js/ …), apparently from another run using the same key; I left them untouched.
BEST PICKS: 1) Wind MCP endpoints wired directly as streamable-http MCP servers with the user's key (not the CLI). Start with financial_docs (get_company_announcements, get_financial_news), stock_data, index_data and economic_data; ship wind-mcp-skill's routing rules and references/*.md as the usage skill, rewritten to call MCP tools. This is the only piece that delivers real data, it runs with zero bundled code, and it is domestic-hosted. Treat it as an optional paid-tier source because of the 300-points/day free cap and unknown per-call cost.

2) The WindClaw markdown skills as teammate duty templates, vendored and edited (strip the install block, add the tool mapping and a 自选股表.csv): the routine trio daily_watchlist_morning_brief_skill + after_close_watchlist_recap_skill + watchlist_news_impact_digest_skill; major_announcement_impact_skill for the event duty; and the trading set trade_plan_builder_skill, position_sizing_decision_skill, stop_loss_discipline_skill, take_profit_ladder_skill, dip_buy_decision_skill. They are pure markdown, work with DeepSeek, and their '30 秒结论 + table + invalidation conditions' output shape fits MyWork's report-as-deliverable model.

3) post-market-debrief and a-share-primary-theme-identification as the A-share-native report formats for a market-read teammate (主线 / 龙头-中军 / 情绪周期 / 明日观察). They are prompt-only and data-source-agnostic, so they can run on whatever free A-share source MyWork ships and upgrade to Wind when the user adds a key.
ITEMS:
- [user-key] wind-mcp-skill CLI (Wind-Alice/AliceMarket/skills/wind-mcp-skill) — No | runtime: Node >= 18 (ran on v23.9.0; no deps, no engines field, no Python). Works on bundled Node 24. | access: WIND_API_KEY required for every call (user's own; phone-number signup at market.windalice.com). Free 300 points/day since 2026-09-11; ¥100 = 10,000 points, purchased points permanent; per-call cost un
    * CORRECTED: Needs WIND_API_KEY from aifinmarket.wind.com.cn -> Key comes from market.windalice.com (old domain 301s there). Key lookup order in code is ~/.wind-aifinmarket/config (WIND_API_KEY=...) > <skill>/config.json (wind_api_key) > env WIND_API_KEY — i.e. a global file BEATS the env var, the opposite of what the repo
    * CORRECTED: An individual can register and gets a points-based quota (price/points text) -> Individual phone-number signup: yes (from portal code, not exercised). Free quota is now 300 points/day since 2026-09-11 (was 1,000), non-accumulating (unused daily points are deducted at day cut). Paid: ¥100 = 10,000 points, tiers ¥100–1,000, purchased points
- [user-key] Wind MCP endpoints used directly (https://mcp.wind.com.cn/vserver_*/mc | runtime: none (HTTP) | access: User's WIND_API_KEY as static header 'Authorization: Bearer <key>' plus 'Accept: application/json, text/event-stream'. Same points billing as above.
- [borrow-format] FULL INVENTORY of the 78 skills (grouped) | runtime: 69 skills: none (markdown). 6 skills: Python (position-sizer and backtest-expert stdlib only; dcf-model needs  | access: Markdown skills need no key themselves; they only say '推荐使用万得 wind-mcp-skill 获取底层数据'.
- [borrow-format] Quality of the best SKILL.md files as teammate duties (read in full: t | runtime: none (markdown, 2-3 KB each) | access: none
    * CORRECTED: The skills are good enough to serve as teammate duties -> Good as report formats and reasoning checklists; incomplete as duties. Missing: (1) any data recipe — none maps a step to a Wind tool or field, they only say 'use wind-mcp-skill'; (2) numeric rules — trade plan/stop loss/position sizing give categories (价格/逻辑/
- [direct-endpoint] Public keyless catalog endpoint: POST https://market.windalice.com/Win | runtime: none | access: No key.
- [skip] wind-alice (Alice Agent A2A CLI) and the Python community skills | runtime: Node >= 18 for wind-alice; Python 3 for the six community skills | access: wind-alice: WIND_API_KEY + points. tushare: TUSHARE_TOKEN (points-tiered). theme-detector: FINVIZ Elite / FMP keys. dcf-model: yfinance (Yahoo, blocked in mainland).
    * CORRECTED: (scope check) These parts also run on bundled Node without Python -> wind-alice is Node-only but key-gated, slow and point-hungry with a separate daily trial cap; six community skills need Python (not bundled in MyWork) and three of those need foreign keys or US-only data.

===== fin-skill-packs
SURPRISES: 1. Data should not come from any of these packs. Wind and iFinD both run hosted MCP servers that take a static Authorization header, which MyWork already supports. Both answered a keyless initialize with HTTP 401 (iFinD: https://api-mcp.51ifind.com:8643/ds-mcp-servers/hexin-ifind-ds-stock-mcp; Wind: https://mcp.wind.com.cn/vserver_stock_data/mcp/). Individual sign-up, free quota and price are not confirmed from a vendor page — both sites are login SPAs.

2. Wind publishes its own skill pack, which the scouts did not list: Wind-Alice/AliceMarket has 78 SKILL.md (pushed 2026-09-10), including after-close watchlist recap, A-share primary-theme identification and stop-loss discipline. Its data skill is a zero-dependency Node CLI, so it runs on bundled Node. aifinmarket.wind.com.cn now redirects to market.windalice.com. This deserves its own verification pass; I only checked the tree, the README and the CLI's imports.

3. Python is the dividing line. Every pack that fetches or computes needs it: UZI (229 files), the CN repo's four MCP servers, alphaear, dcf.py, financial_rigor.py. Only three stdlib scripts are worth porting to Node: financial_rigor.py (465 lines), dcf.py (383) and check_research_output.py (808). All three ran on Python 3.9 here.

4. The CN pack's free tier is broken on a fresh install. pip resolves mcp 2.3.0 and all four servers fail at import; they need mcp<2. After pinning, 4 of the 9 AkShare tools failed here because they depend on push2.eastmoney.com.

5. Eastmoney push2 is the weak point for UZI and the CN pack. It returned 502 or an empty reply from this machine, and UZI's own code warns it is often restricted outside China. Endpoints that did answer keylessly: qt.gtimg.cn, hq.sinajs.cn, datacenter.eastmoney.com, the THS financial abstract via AkShare, BaoStock login, and newsnow.busiyi.world.

6. Nothing here verifies mainland reachability. Both the proxy route and the direct route from this machine exit in the US (Zenlayer, Los Angeles).

7. Three scout descriptions were looser than the code:
- UZI's ledger is a 26-line append-only JSONL with no outcome tracking.
- UZI's self review has 17 checks, not 13, and they gate UZI's own JSON rather than review a report.
- alphaear's Strengthened/Weakened/Falsified is not a field. The only status vocabularies actually specified are ai-berkshire's 成立/边际弱化/受损/破裂 and Improved/Unchanged/Weakened.

8. The Anthropic and CN skills are written in English; the CN ones mix in Chinese terms and carry factual errors (中证500 listed as a US index, ±30% given as the ST limit, a tax-loss-harvesting skill for A-shares). ai-berkshire, rollingSirius and UZI are native Chinese.

9. Side effect of my test: UZI's run created ~/.uzi-skill/_minirackercrash.sentinel outside the scratch folder. I confirmed the directory was born during my run and removed it. UZI also has a session-start hook that checks GitHub releases, and its SKILL.md tells the agent to show an update prompt before anything else.

All experiments are in <scratch> ; no servers or processes left running.
BEST PICKS: Build on three things:

1. ai-berkshire's thesis-tracker, thesis-drift and news-pulse as the core duties. They are already file-backed, in Chinese, with explicit state vocabularies and a health-score formula. Rewrite the parallel-agent steps as sequential passes.
2. The Anthropic equity-research templates (morning-note, catalyst-calendar, earnings-preview) as the short routine formats, filled with the A-share tables from the CN fork after a fact pass.
3. rollingSirius's dcf.py, its checker and ai-berkshire's financial_rigor.py, ported to Node, as the "no mental arithmetic" calculators. For data, attach Wind or iFinD hosted MCP with the user's key rather than any pack's Python fetchers.

Top 8 skills to turn into teammate duties, with what each produces:

1. ai-berkshire thesis-tracker — one file per holding, reports/{公司}-thesis.md: 5-sentence thesis, assumptions table (假设 | 验证方式 | 频率 | 状态), red-line table, valuation anchors, health score = 10 − 3×破裂 − 2×受损 − 1×弱化 − 5×红线 mapped to 加仓/持有/减仓/卖出, and an appended log row (检查日期 | 健康度 | 核心变化 | 动作建议). The log maps directly to a teammate table.
2. ai-berkshire news-pulse — 异动归因报告 at reports/{公司}/{公司}-news-{YYYYMMDD}.md: one-line attribution, merged timeline (日期 | 维度 | 事件 | 来源 | 权重 高/中/低), candidate-explanation table (证据 | 反证 | 置信度 | 持续性), a nature verdict (价值事件 / 情绪波动 / 真因不明 / 混合), action table, 7-30 day watch list, information gaps.
3. Morning note — the Anthropic one-page format (Top Call, overnight one-liners, key events, trade ideas with risk) in the CN fork's six sections (市场回顾 / 隔夜外盘 / 重要资讯 / 今日策略 / 事件日历 / 风险提示), 300-600 words, markdown. A daily routine.
4. rollingSirius earnings mode — nine-chapter 财报深度分析 in markdown (drop the PDF default), with an assumptions JSON fed to dcf.py, a fair-value bridge, and a forecast register (基准值 | 区间 | 验证日期 | 先行指标 | 失效条件) re-scored next quarter.
5. Catalyst calendar — Anthropic's table (Date | Event | Company | Type | Impact H/M/L | Positioning | Notes) kept as a CSV, plus a weekly preview note; CN fork supplies the A-share event types (业绩预告, 解禁, 集采, LPR, 股东大会).
6. ai-berkshire thesis-drift — compares two thesis snapshots: table of five fixed dimensions (估值锚点, 核心假设, 红线, 管理层, 护城河) each Improved / Unchanged / Weakened with trigger evidence and confidence, and a verdict separating fact change from price change.
7. UZI daily observation list, format only — at most 10 rows and fewer when evidence is thin; each row carries action (buyable / wait_pullback / wait_reseal / watch_only / unbuyable), why_now, entry_condition, invalidation, theme and leader rank, evidence, data_gaps, risk_flags; append each to a ledger table and add the outcome column UZI lacks.
8. ai-berkshire quality-screen — pass/fail table over 7 hard exclusion metrics (10-year ROE, 5-year FCF, interest cover, gross margin, OCF/net profit, net margin, share dilution) with 3 exemptions, plus pass-rate and ranking for a sector or index.

Runners-up: Anthropic earnings-preview (one page with bull/base/bear table), UZI trap-detector (8-signal 杀猪盘 check, JSON with evidence URLs), and alphaear's InvestmentSignal fields as the row schema for 情报库.csv.
ITEMS:
- [borrow-format] anthropics/financial-services — equity-research plugin (morning-note,  | runtime: None for six skills (markdown). earnings-analysis: Python with matplotlib/pandas/seaborn plus a DOCX writer. | access: Free on GitHub, no key. The vendor MCPs it points to all need paid accounts.
    * CORRECTED: They are pure markdown -> Six are pure markdown. earnings-analysis is markdown that demands Python charting and a DOCX writer, and specifies an 8-12 page Word report with 8-12 charts.
    * REFUTED: The skills come with data access -> No data layer. The skills are workflow and output templates that assume WebSearch or US vendor subscriptions.
- [borrow-format] jwangkun/claude-for-financial-services-cn (63 A-share skills, data tie | runtime: Skills: markdown. Data servers: Python 3 with mcp<2, akshare, pandas, requests, lxml. | access: Skills and the AkShare/news servers are free and keyless. Wind needs WIND_API_KEY ('ak_...'); iFinD needs a token from mcp.51ifind.com. The README states an iFinD free tier (stock/bond/index, 2 calls/
    * CORRECTED: 63 A-share-adapted skills -> 63 files, 58 distinct skills. Each is one SKILL.md of 2.3-11.4 KB.
    * CORRECTED: It is a real adaptation, not a mechanical translation -> A real LLM-written adaptation, not proofread. Usable as an A-share checklist; every skill needs a fact pass and a rewrite into Chinese before a teammate uses it.
    * CORRECTED: It references tools that do not exist -> Tool names are real; several call signatures and capabilities are not.
    * REFUTED: The free tier works out of the box -> Needs an mcp<2 pin. 4 of 9 AkShare tools depend on Eastmoney push2, which did not answer from this US-exit network; mainland behaviour not verified.
- [user-key] Wind and iFinD hosted MCP endpoints (found inside target 2; not on the | runtime: None when attached directly as streamable-http with a static header; Wind's official CLI is zero-dependency No | access: User's own key (Wind 'ak_...' from the Alice Market user centre; iFinD token from mcp.51ifind.com). Individual sign-up, free quota and price are not confirmed from a primary source.
- [borrow-format] xbtlin/ai-berkshire (value-investing skills, news-pulse, financial_rig | runtime: Skills: markdown. Tools: Python 3.8+ stdlib; xueqiu_scraper.py needs playwright. | access: Free, no key. FinMind (Taiwan stocks) optionally takes a token.
    * CORRECTED: 20 value-investing skills -> 21 Claude-command skills and 22 Codex SKILL.md packages. The repo is 73 MB because of 3,441 report files; the skills themselves are about 250 KB.
- [one-click-install] rollingSirius/equity-research-skill (nine-chapter earnings deep-dive,  | runtime: Python 3 stdlib for the two scripts (CI uses 3.11; ran here on 3.9). The rest is markdown. | access: Free, no key.
    * REFUTED: It brings its own data -> Method and calculators only; the host must supply web search/fetch or a data MCP.
- [borrow-format] wbh604/UZI-Skill (daily list 'at most 10, never pad', self-review, 观察账 | runtime: Python 3.10 or 3.12 (CI matrix) with akshare, yfinance, baostock, pandas, requests, exchange-calendars, ddgs,  | access: Free and keyless; an optional free Eastmoney MX_APIKEY is recommended by the repo for stability.
    * CORRECTED: 13-check self review -> 17 checks now, and they are data-completeness gates for UZI's own files, not a reusable report-review prompt.
    * CORRECTED: It keeps an observation ledger (观察账本) -> An append-only candidate log with no outcome tracking.
    * CORRECTED: Single-stock analysis runs out of the box -> Stage 1 data collection partly works here; the 'lite 30-60 s' figure did not hold on this network. Its own code warns that push2 is often restricted outside China.
- [borrow-format] RKiding/Awesome-finance-skills (alphaear-news, alphaear-signal-tracker | runtime: Python with requests and loguru for news; akshare/yfinance for stock; torch/transformers for sentiment and pre | access: Free, keyless.
    * CORRECTED: The news comes from the skill's own sources -> It is a thin wrapper over one third-party public NewsNow instance (14 source ids). A teammate can read that endpoint directly with no Python.
    * CORRECTED: signal-tracker classifies signals as Strengthened / Weakened / Falsified -> A prompt stub plus a schema. The three-state label is free text inside 'reasoning', not a tracked field.

===== keyed-cn
SURPRISES: 1. Vantage point: this machine's proxy runs in TUN mode, so even `curl --noproxy '*'` exits in Los Angeles (myip.ipip.net said so, and google.com answered direct). Every "alive" result proves the endpoint is up, not mainland reachability. My mainland judgement rests on AliDNS resolution with a mainland client subnet: all hosts except mcp.longbridge.com land on Aliyun, Tencent Cloud, China Telecom or Unicom addresses.

2. Three of the five channels already work with MyWork's static-header connector: Jin10 (`Authorization: Bearer`), Yingmi (`x-api-key`), Tushare (`Authorization: Bearer` or `?token=`). 妙想 is not an MCP at all but a single POST with an `apikey` header, so it needs a thin skill, not Python.

3. Longbridge is not OAuth-only. It has a token-less `/agent` endpoint whose single tool, `authenticate`, swaps a one-time code from open.longbridge.cn/connect for a Bearer token; I ran initialize and tools/list against it keyless. It also has a mainland host (mcp.longbridge.cn), a read-only `/v2` endpoint, and a CLI binary that does its own OAuth. The user can do the one browser step in the real Chrome MyWork already has.

4. Futu is the only target that truly needs an OAuth client, and its refresh token dies after 14 days, so any Futu teammate will ask the user to re-login fortnightly. Futu also has a REST API with per-request Ed25519 signing (AppKey), which a small Node helper could use instead.

5. Tool lists are too large to attach whole. Tushare's tools/list is 254 tools and 228 KB of JSON, roughly 80K tokens by my estimate. Futu has 101 tools, Longbridge 164, Yingmi 69. MyWork's MCP connector needs a per-teammate tool allowlist, or these should be reached through a skill that reads an interface catalogue on demand. Jin10's 8 tools are the exception.

6. Tushare's free tier is close to useless (120 points = unadjusted daily bars only), and the content an intelligence teammate wants is not in the points tiers at all: news 1000 元/年, 公告 1000, 政策 1000, 研报 500, on top of the 200 元/年 for 2000 points. The official doc's MCP URL example is also wrong (`/mcp/token=…` returns 401; `/mcp/?token=…` works).

7. 妙想's free quota is 150 calls per day per skill today, not 50, but it is all labelled 限时; inactive accounts are cut to 10 per day; new keys are capped at 5000 per day; and the key can only be claimed inside the 东方财富 app, so onboarding needs a phone step.

8. Jin10's OAuth metadata points at http://localhost:8080, so any client that reacts to a 401 by starting OAuth will break; and its key page has an admin-approval account state I could not test.

9. Yingmi's key page is qieman.com/mcp (ai.yingmi.com redirects there); the GitHub repo is a README only.

Evidence files are in <scratch> (ts_tools.json, mx_skill_list.json, futu_tools_open.futunn.com.json, jin10_app.js, lb_agent_tools_*.txt).
BEST PICKS: 1. Jin10 MCP as the default keyed source for the finance product: free, static Bearer header, 8 small tools (快讯, 资讯 with full text, 财经日历, macro quotes and K-lines), 1500 calls per tool per day, mainland-hosted. It works with the connector as it stands; the only onboarding is a 金十 login and one click.

2. 妙想 MX API, wrapped as a Node or curl skill rather than the shipped Python: natural-language search over 新闻/公告/研报/政策, an indicator query, a stock screener and a simulated portfolio, all behind one `apikey` header. It is the A-share coverage Jin10 lacks. Budget routines around 150 calls per day per skill and treat the quota as changeable.

3. Yingmi MCP for anything about funds and allocation: free, static `x-api-key`, 69 tools including diagnosis, back-test, Monte-Carlo and PDF report rendering. Attach it with a tool allowlist.

Two paid or account-gated additions are worth offering as optional upgrades, not defaults: Tushare at 200 元/年 through its plain HTTP API, borrowing the official SKILL.md routing map and interface catalogue instead of attaching 254 tools; and Longbridge through mcp.longbridge.cn using the paste-a-code `/agent` path, which gives US and HK research data without MyWork building OAuth. I would leave Futu until MyWork has an OAuth client or the dsh-futu-mcp plugin has been test-installed against the pinned dsh version.
ITEMS:
- [user-key] Tushare official MCP (https://api.tushare.pro/mcp/) | runtime: None. Hosted streamable-HTTP MCP; responses are SSE. | access: Individual registers at tushare.pro (phone or email) and copies the token from 个人中心. Free 120 points = unadjusted daily bars only. 200 元/年 = 2000 points; 500 元/年 = 5000 points. News, 公告, 研报, 政策 are se
    * CORRECTED: Auth is a static token (works with a static-header MCP connector), not an OAuth flow -> Use header `Authorization: Bearer <token>` or URL `https://api.tushare.pro/mcp/?token=<token>`. The doc's JSON example (`/mcp/token=...` without `?`) is a typo and fails. The server advertises OAuth protected-resource metadata (authorization_servers: https://t
    * REFUTED: The points tier covers the news / announcements / research content an intelligence teammate needs -> A 200 元/年 (2000-point) account gives structured A-share market and financial data only. News, 公告, 政策, 研报 each cost 500-1000 元/年 extra.
- [borrow-format] waditu-tushare/skills | runtime: As shipped: Python 3.7+ with the tushare pip package. Reimplemented: none beyond Node. | access: Same Tushare token and points gate as the MCP (200 元/年 minimum to be useful).
    * REFUTED: It runs with nothing but the bundled Node -> Needs Python 3.7+ and `pip install tushare` (pandas). The underlying API does not need Python: POST http://api.tushare.pro with JSON {api_name, token, params, fields} answered my keyless probe with HTTP 200 {"code":40101,"msg":"您上传Token！"} on both http and htt
- [user-key] 金十 Jin10 official MCP (https://mcp.jin10.com/mcp) | runtime: None. Hosted streamable-HTTP MCP. | access: Individual logs in with a 金十 account at mcp.jin10.com/app, accepts the MCP user rules and clicks 激活. The bundle also has account states 审批中 / 审批未通过 / 已停用, so approval may not be instant; I could not t
    * CORRECTED: Tools are list_flash / search_flash / calendar / quotes -> Eight tools: get_quote({code}), get_kline({code,time?,count?}), list_flash({cursor?}), search_flash({keyword}), list_news({cursor?}), search_news({keyword,cursor?}), get_news({id}), list_calendar({}); plus resource quote://codes. Calendar rows carry pub_time, 
    * REFUTED: Standard OAuth discovery works as a fallback -> OAuth metadata is misconfigured. Only the static Bearer header works, and a client that auto-starts OAuth on a 401 will fail against localhost.
- [user-key] 东方财富 妙想 Skills / MX API (mkapi2.dfcfs.com/finskillshub) | runtime: None if called by HTTP. Python 3 with requests/pandas if the official scripts are used. | access: Individual needs the 东方财富 app and a 通行证 login to claim the key; the hub page cannot issue one in a desktop browser. Free; 150 per day per skill now; 5000 new keys per day; no paid plan.
    * CORRECTED: Free quota is 50 calls per day -> Today the free tier is 150 calls per day per skill (base 50 plus a limited-time 100 bonus), counted separately per skill. 进阶版 is 300+200 and 旗舰版 600+200, earned by account level V2 or by opening a brokerage account ('开户客户即享免费3个月'); there is no cash price. An i
    * REFUTED: It needs Python -> Call the endpoints directly from Node or curl. No Python required.
- [user-key] 盈米且慢 MCP (yingmi-dev/Yingmi-MCP, https://stargate.yingmi.com/mcp/v2) | runtime: None. Hosted streamable-HTTP MCP. | access: Individual registers a 且慢 account at qieman.com/mcp, clicks 开通服务, and copies the key from 个人中心. Free ('目前使用无须付费'); heavy or commercial use is by contacting 盈米.
    * CORRECTED: yingmi-dev/Yingmi-MCP is the official server -> The repo is documentation only. The server is hosted at https://stargate.yingmi.com/mcp/v2 (streamable HTTP). There is nothing to install or run.
- [user-key] 富途 official MCP (https://mcp.futunn.com/mcp) | runtime: None for the hosted MCP, but the client must implement OAuth 2.1 with dynamic registration, PKCE and a localho | access: Individual needs a Futu (牛牛) account and browser login. No fee. Trade scopes need an opened brokerage account plus trade password; quote-only authorisation sends orders to paper trading.
    * CORRECTED: OAuth only, so it does not work with a static-header connector -> True for the MCP: a 2-hour access token cannot live in a static header, and the user must re-authorise in a browser at least every 14 days. Futu's REST API has a second mode, 'AppKey', using X-Api-Key + X-Timestamp + X-Nonce + an Ed25519 or RSA signature per r
- [user-key] yangzhe1991/dsh-futu-mcp (@yangzhe1991/dsh-futu-mcp) | runtime: Node inside the DSH plugin host (pure JS; deps @modelcontextprotocol/sdk ^1.30.0, zod). No Python. | access: User's Futu account; the browser opens on first Futu tool call and again whenever the 14-day refresh token lapses.
- [user-key] longbridge/longbridge-mcp (https://mcp.longbridge.com, https://mcp.lon | runtime: None for the hosted endpoint. Self-hosting is a Docker image or Rust build, which MyWork does not need. | access: Individual needs a Longbridge account (docs say 完成开户) and either an OAuth client or a one-time code from open.longbridge.cn/connect. No API fee stated. Free quotes are HK BMP and US Nasdaq Basic.
    * REFUTED: OAuth only, so it cannot work with MyWork's static-header connector -> There is a paste-a-code path: the user generates a code on the connect page in a browser, the agent calls authenticate on /agent, and the returned access token goes into a static Authorization header on the main endpoint. Token lifetime was not observable with
    * CORRECTED: The hosted endpoint is the .com one -> There is a mainland deployment at https://mcp.longbridge.cn (Aliyun) alongside https://mcp.longbridge.com (CloudFront), and a restricted /v2 endpoint that excludes trade execution, DCA, IPO orders and money movement. The docs note .cn has no route to the US da
- [one-click-install] longbridge/skills (+ longbridge-terminal CLI) | runtime: Native CLI binary (macOS, Windows x64, Linux), downloaded from GitHub releases. Python 3 only for the quant an | access: Longbridge account and browser login via the CLI; pick the Trade permission for positions and orders. No fee stated.
    * CORRECTED: Skill pack that uses OAuth and gives quotes, positions and order tools -> The skills hold no auth of their own. They drive two prerequisites: the Longbridge CLI (native binary, `longbridge auth login` opens a browser and caches the token) and/or the Longbridge MCP. Docs: the CLI is required for the read tier; the MCP is required for

===== cn-research-products
SURPRISES: 1. Python is not needed for the finance product's daily reports. 28 of 29 A-share endpoints answered a dependency-free Node script (built-in fetch, node:crypto for the 财联社 signature, TextDecoder('gbk') for Tencent and Sina). Only mootdx and baostock (TCP), xls/xlsx parsing and the pandas chip-distribution maths need Python.

2. Mainland reachability could not be tested. Both the proxy route and the --noproxy route from this machine exit in Los Angeles, so every result means "alive from a US IP". All hosts are mainland sites, so I expect them to work unproxied in China.

3. Eastmoney push2 is the weak point. push2.eastmoney.com and push2delay (clist, stock/get, ulist.np) returned 502, 302 or empty on every attempt, while push2ex, push2his fund flow, datacenter-web, reportapi, np-weblist, search-api-web and emappdata all worked. That removes Eastmoney sector ranking, sector fund flow and breadth; Sina MoneyFlow, Tencent indices and the legulegu breadth page worked as substitutes. It may be an overseas-IP block, which would also hit DSA's recommended GitHub Actions mode.

4. DeepSeek has peak pricing that overlaps the trading day. Per the live pricing page, peak is Mon-Fri 9:00-12:00 and 14:00-18:00 Beijing time (holidays excluded) and costs double; everything else is half price. deepseek-flash: input 1 / 2 元 per M tokens, output 4 / 8 元, cache hit 0.02 / 0.04 元, 1M context. Routines at 08:30, in the lunch break and from 18:00 run at half price; intraday watching should be code-only numbers with the model called only on a triggered alert.

5. Almost every target has removed ratings and price levels on purpose. vibe-astock, Vibe-Research, TradingAgents-astock, TradingAgents-CN (since v2.1) and the Vibe-Trading playbooks all forbid action advice in their prompts. Only DSA (buy points, stop, target, position size, separate advice for holders and non-holders), go-stock (stock pool with triggers, position advice) and Vibe-Trading's report-generate skill (rating and target price) still give what the owner wants. The advice-giving prompts must be written by MyWork on DSA's schema, not copied from the simonlin projects.

6. Vibe-Trading already has routine templates the scouts did not report: five scheduled-research playbooks in markdown with cron frontmatter (pre-market 08:30, A-share money flow 19:00, earnings tracker, quarterly holdings diff, Saturday portfolio check-up), a fixed output order, a mandatory Data gaps section and a machine-readable verdict line per symbol.

7. The a-stock-data skill is one 425 KB file (323k characters, roughly 200k+ tokens). It fits DeepSeek's 1M context but is wasteful to load on each run. Split it per layer or use only its routing table plus a small Node endpoint tool.

8. A forecast-then-verify loop is common to the best products and should be a table in the teammate folder. go-stock's evening review grades the morning forecast and the user's trades and backtests its own picks at 3/5/10/20/30 days; vibe-astock emits next-day verification items checked by code; DSA keeps a per-stock history table and evaluates signals after 1/3/5/10 days.

9. The trading-day gate needs no library. https://www.szse.cn/api/report/exchange/onepersistenthour/monthList?month=2026-10 returned 31 days with an open flag; October 2026 opens on the 8th. Today (2026-10-05) is inside the National Day closure, so all "today" data in my tests is from 2026-09-30.

10. Two scout attributions were wrong. The five-part review is vibe-astock's, not Vibe-Research's; the 政策 / 游资 / 解禁 roles are TradingAgents-astock's, not TradingAgents-CN's. Vibe-Trading has 90 skills, not 88.

11. mootdx is failing upstream. a-stock-data documents that mootdx K-line, quote and tick commands have returned empty since 2026-09; TradingAgents-astock and Vibe-Trading still list it as a primary A-share source. I could not test it (not installed here). Treat Tencent as the primary source for quotes and K-lines.
BEST PICKS: Build on three pieces.

1. a-stock-data endpoints as a Node data layer. Port 25-30 of the verified endpoints into one small Node CLI shipped in the installer: Tencent quote, K-line and ticks; push2ex limit-up, broken-board, limit-down and yesterday pools; THS theme reasons and limit-up pool; datacenter-web 龙虎榜, lockups, margin and events; reportapi research reports; 财联社, Eastmoney and Wallstreetcn news; cninfo announcements; Sina futures/A50 and sector flow; SZSE calendar. Keep its ordering (Tencent and official sources first, Eastmoney serial at 1 request per second) and compute the short-term metrics in code so the model only narrates.

2. DSA's report contract for anything that gives advice. Use the decision-dashboard schema (score 0-100 with bands, one-line conclusion, separate advice for holders and non-holders, buy / stop / target levels, position size, check list, history table) and the seven-section market recap.

3. Vibe-Trading playbooks plus go-stock's loop for routines. Use the playbook shape (cron, data needs, fixed sections, Data gaps, verdict line) as the routine file format, and go-stock's morning-forecast and evening-grading loop with a 预判表.csv next to 信源表.csv and 情报库.csv. From vibe-astock take the five-part short-term review, the sentiment phase label and next-day verification items; from TradingAgents-astock the policy, hot-money and lockup duty prompts.

Recommended finance teammates (trading days, Beijing time; times chosen for off-peak DeepSeek pricing):

1. 盘前策略师, 08:30. Output 盘前必读: overnight markets (US/EU/Asia indices, A50, FX, commodities, US and China 10-year yields); yesterday's review in brief; three scenarios with triggers; stock pool with code, reason and trigger price; position and discipline advice; today's calendar (macro releases, lockups, earnings); risks.
2. 盯盘哨兵, 09:26 auction, 11:35 midday note, 14:45 late check, plus threshold alerts. Output: short alert lines for watchlist moves, limit-up and broken-board events, and whether the morning's trigger conditions occurred. Numbers by code; model only on a triggered alert or in the lunch window.
3. 大盘复盘官, 18:00. Output: seven-section market recap ending in an attack / balanced / defensive call with a position range and one invalidation condition.
4. 短线情绪复盘师, 18:15. Output: sentiment, funds, themes, 龙虎榜 and leaders, then a judge block with the sentiment phase, 2-5 active directions each with evidence and a falsifier, risks, and 2-5 verification items for tomorrow. First grades yesterday's items.
5. 自选股决策官, 18:30. Output: 决策仪表盘 for the watchlist: summary line per stock (verdict, score, trend), then news digest, risk alerts, catalysts, core conclusion, data view, buy / stop / target levels, position size, and the history table.
6. 资金与筹码追踪师, 19:00 daily, plus a Sunday 20:00 weekly lockup and insider-selling outlook. Output: northbound, sector flow, 龙虎榜 seats per stock, limit board, margin balances, block trades, watchlist cross-reference, data gaps, with a selling-pressure rating per watched stock.
7. 政策与事件分析师, 07:45 and 20:00 (after 新闻联播). Output: dated policy list with issuing body and strength level, sector direction, time window, beneficiary and loser chain, a five-level policy rating, and tomorrow's macro calendar. Writes new items to 情报库.csv.

On demand rather than daily: a 个股深研 teammate (six-stage study, bull/bear debate, five-level rating with decision points) and a Saturday 09:00 portfolio check-up with a weekly review of the user's own trades.

Experiment scripts are in <scratch> (probe.mjs, probe2.mjs, run_skill.py).
ITEMS:
- [borrow-format] ZhuLinsen/daily_stock_analysis (DSA) | runtime: Python 3.10+ with about 45 pip packages (akshare, efinance, tushare, pytdx, baostock, litellm, exchange-calend | access: Needs an LLM key. News quality needs a search key (Tavily, Bocha, SerpAPI, Anspire and others). Market data is free by default.
    * CORRECTED: Evening watchlist 决策仪表盘 = per-stock line 'verdict | score | trend' plus 重要信息速览 / 风险警报 / 利好催化 / 最新动态 -> The four blocks named by the scout are only the 'intelligence' part. The full per-stock card has more, in this order: (1) 重要信息速览: sentiment_summary, earnings_outlook, risk_alerts[], positive_catalysts[], latest_news; (2) 核心结论: one_sentence (30 chars max), sign
    * CORRECTED: Data chain AkShare / Tushare / Pytdx / Baostock / YFinance -> Actual daily-bar order: efinance (0), akshare (1), tushare / tickflow / pytdx (2, the first two need a token), baostock (3), yfinance (4), Tencent direct K-line (5, last resort). Realtime order: tencent, akshare_sina, efinance, akshare_em. Longbridge, Futu, Fi
- [direct-endpoint] simonlin1212/a-stock-data | runtime: As written: Python 3.9+ with pip install mootdx requests pandas stockstats numpy baostock xlrd openpyxl. As en | access: No key, no login, free. iwencai semantic search is the only keyed part.
    * CORRECTED: All endpoints currently work -> From this machine (US egress) the push2 quote/list family is down or blocked. That removes the Eastmoney sector ranking, sector fund flow, stock info and the name lookup for the hot rank. Working substitutes I verified: Sina MoneyFlow (ssl_bkzj_bk) for sector 
- [borrow-format] simonlin1212/Vibe-Research | runtime: Node >= 22.18 (runs .ts natively) plus Python >= 3.11; Codex SDK installed as a dependency. | access: User's own model subscription or API key (DeepSeek template present, marked untested). Data sources keyless.
    * REFUTED: Its 每日复盘 has the five parts 情绪/资金/题材/龙虎榜/龙头 -> The five-part review belongs to vibe-astock, not Vibe-Research. Vibe-Research's distinctive report is the six-stage single-stock study.
    * CORRECTED: Reusable as Agent Skills -> The four method skills are markdown, but they reference the repo's own calc CLI and endpoint ids, and every skill forbids action advice. They need editing before a MyWork teammate can use them; data-access needs Python 3.11+ with akshare, baostock and mootdx.
- [borrow-format] simonlin1212/vibe-astock | runtime: Python 3.10+ and Node 22+; local web app on 127.0.0.1:8910. | access: User's own model subscription or API key. Data keyless (akshare, Tencent, Eastmoney).
    * CORRECTED: Gives a market verdict a finance teammate can copy -> The default prompt pack deliberately gives no stock picks, no participation stance and no price levels. The engine supports replacing the pack through a local prompts file, so the structure is reusable but the advice-giving wording has to be written by MyWork.
    * CORRECTED: Runs locally without an API key -> Needs Python 3.10+ (3.12 recommended) and Node 22+, with langgraph, akshare >= 1.18, mini-racer (a JS engine needed to decode a THS script), baostock, fastapi. 'No key' means it can drive a logged-in Codex, Claude Code or WorkBuddy CLI subscription; otherwise 
- [ship-in-installer] HKUDS/Vibe-Trading | runtime: Python 3.11+ (pip install vibe-trading-ai), or Docker. The 64 markdown-only skills and 5 playbooks need no run | access: LLM key (DeepSeek supported). Market data keyless by default; Tushare, Gildata, QVeris and others are optional keyed sources.
    * CORRECTED: 88 skills -> 90, not 88. 64 of the 90 are a single markdown file with no code (389 md files vs 29 py files in the skills tree).
- [borrow-format] simonlin1212/TradingAgents-astock | runtime: Python 3.10+; CLI and Streamlit UI; Docker file present. | access: LLM key; data keyless.
    * CORRECTED: Final decision gives ratings and levels -> Levels were removed on purpose: the prompt says "Do NOT state entry prices, stop-loss levels, target prices or position sizes" (portfolio_manager.py). It gives a rating and reasoning only.
- [skip] hsliuping/TradingAgents-CN | runtime: Python 3.11 + Node 18 + MongoDB 7 + Redis 6. | access: LLM key; Tushare token recommended for data.
    * REFUTED: Has the A-share roles 政策分析师 / 游资追踪师 / 解禁监控师 -> Those three roles exist only in TradingAgents-astock. TradingAgents-CN's own additions are the index and sector analysts, chip distribution, holding analysis and trade review.
    * CORRECTED: Usable today as a local tool -> It runs, but needs two databases. In the community edition, scheduled and batch analysis are Pro-only, so it cannot produce a daily report by itself. v2.1 rewrote prompts to remove execution-style advice.
- [borrow-format] ArvinLovegood/go-stock | runtime: Single Go binary with a GUI; no CLI for agents. Has its own skill import (zip) and MCP client. | access: User's own LLM key (DeepSeek, 硅基流动, 火山, 百炼, Ollama and others). Data mostly keyless; Tushare optional.

===== dsh-eco
SURPRISES: 1) dsh has moved on: npm dist-tags for @deepseek-ai/dsh are latest/next 0.2.0-rc.2 (2026-09-29) and alpha 0.2.1-alpha.1 (2026-10-03). MyWork's pin 0.1.6-alpha.2 (2026-09-17) is three generations back, and the most-downloaded plugins already floor above it (dsh-zotero >=0.2.0-rc.2, dsh-free-search ^0.1.7-rc.1||^0.2.0-rc.1, dsh-web-search-pro =0.1.7-rc.2, @hyzyn/dsh-rss >=0.1.7-rc.2, dsh-zhihu-search >=0.1.7-alpha.1, capital-generation 'needs 0.2.0-rc.2', paper-search-mcp-dsh pins dsh-mcp-client 0.2.0-rc.2). dsh-rss says 0.4.0+ targets the 0.1.7 settings interface. Installer must pin plugin versions, not take latest.

2) Peer ranges are not enforced on the pin. In a scratch dsh 0.1.6-alpha.2 profile, `dsh plugin add dsh-us-stocks dsh-rss dsh-industry-research` succeeded with only 'missing peer' warnings (profile sets autoInstallPeers: false; host packages are never in the profile) and all three rows composed in --dump-config; the host code contains no reference to engines.dsh or manifestVersion. Under strict semver even '*' rejects 0.1.6-alpha.2; only PerryLink's packages ('>=0.1.6-0 <0.2.0') accept it strictly. So the range is a signal of what the author tested, nothing more. Runtime loading on the pin was NOT boot-tested: I did not execute third-party plugin code.

3) Seven of the nine named targets are not in the awesome catalog, and four are not on npm at all: dsh-alpha-desk (no root package.json), dsh-stock-analyst ("private": true), dsh-academic-paper-search (README says `add dsh-academic-paper-search`, registry returns 404), paper-search-mcp-dsh (link: install from a checkout). GitHub-only installs are a poor fit for mainland users.

4) MCP-wrapper bundles hard-pin a host package as a dependency (@deepseek-ai/dsh-mcp-client 0.1.1-rc.2 in wp-a's bundle, 0.2.0-rc.2 in paper-search-mcp-dsh). That is the duplicate-core failure MyWork already documented. Since MyWork has its own MCP connector, take the command line or URL from these bundles and never install the bundle.

5) The hosted mrd MCP endpoint (https://mrd.hermes.cc.cd/mcp) returns the SPA HTML, not JSON-RPC, so that catalog bundle registers nothing today; yet the same host's REST API is alive and keyless, and the server is zero-dependency Node that can be vendored and run locally with its 5 MCP tools.

6) quant.tybbtech.com/api (behind dsh-astock-research) is a keyless A-share JSON service that answered live: valuation percentiles, financial cards, classified announcements. A teammate can read it without any plugin.

7) Side effects hidden in bundle patches: dsh-aris rewrites the `agent-default-model` row and mounts a python3 Codex bridge with failOnStartupError: true; alpha-desk's risk-gate denies any tool call matching futu/富途/moomoo and order verbs (it would block dsh-futu-mcp and is the opposite of the owner's 'ratings and positions are wanted').

8) PerryLink's packages declare tsdown and typescript as runtime dependencies: three plugins produced an 89 MB profile node_modules.

9) Mainland reachability could not be tested at all from this machine: it runs a TUN-mode proxy (fake IPs 28.0.x.x, ipinfo shows a Los Angeles exit), so even --noproxy requests leave via the US. Everything marked alive is alive through that exit. Side effect seen: Eastmoney push2/push2delay returned 502 from the overseas exit while fund.eastmoney.com and fundf10 returned data. My judgements (not measurements): Yahoo Finance, hacker-news.firebaseio.com and workers.dev are not usable from mainland without a proxy; Tencent/Sina/Eastmoney/cninfo/cuecue.cn/wind.com.cn/futunn.com are mainland services; GitHub Pages (awesome-dsh-plugin.com) is unreliable, which is why the catalog is also on npm (dsh-plugin-catalog, present on npmmirror).

10) Catalog details the scouts glossed: 'downloads' is a 30-day window, there is no peer-range field, and npm names dsh-kline and dsh-bilibili are 1.4 KB placeholder packages unrelated to the catalog's FTShare-Lab/dsh_kline and CZX2244/dsh-bilibili.

11) dsh-futu-mcp is the one place where a plugin beats MyWork's connector: Futu's MCP is OAuth-only (401 with scopes quote:read, quote:write, trade:read, trade:write, accid:*), and the plugin does discovery, dynamic registration, PKCE and refresh in-process.

Scratch artifacts: <scratch> (plugins.json, fin_hits.json, ai_hits.json, named-meta.json, gh-only-meta.json, tb/ tarballs, dshrt/ scratch dsh 0.1.6-alpha.2 home with the three plugins installed). No servers were left running.
BEST PICKS: FINANCE EDITION
1) PerryLink's research family: dsh-industry-research@0.3.15 + dsh-fund-research@0.4.16 (+ dsh-research-report@0.3.16). The only plugins whose declared range strictly admits 0.1.6 prereleases; npm-published, Node-only, keyless, mainland sources (Eastmoney/Tiantian for funds, the host web search for industry tracking). They give a finished report discipline: sourced chain map, hashed snapshots, number-traceback appendix, explicit gap statements. This is the most work saved for the 报告 deliverable. Cost: ~80 MB of build tooling in the profile; boot-test on the pin before shipping.
2) A MyWork-owned keyless market-data layer built from what was verified live rather than from dsh-us-stocks: Tencent qt.gtimg.cn quotes, the quant.tybbtech.com/api endpoints (profile, fin_card, events), and the mrd server code (zero-dependency Node, tools get_quotes / get_boards / get_futures / get_money_flow / get_news) vendored and run locally behind MyWork's MCP connector. Keep dsh-us-stocks@0.3.0 as an optional add-on for users with a proxy, because it is the only source of analyst ratings and price targets, and copy its six tool schemas.
3) Optional user-key connectors, added as MCP rows not plugins: Cue data MCP (static Bearer, 108 tools, 10 free credits/day), Wind AIFin for paying users, and dsh-futu-mcp for existing Futu account holders (it supplies the OAuth flow MyWork lacks). Borrow formats: alpha-desk's prediction ledger with mechanical settlement, and dsh-tradingagents' 14-role rating/position report.

AI-PRACTITIONER EDITION
1) dsh-rss (STARDUSTLC666, npm dsh-rss, pin a tested version): 9 keyless tools with OPML, search, health checks and proxy/Fake-IP handling. Seed 信源表.csv from three verified lists: its 16-feed catalog, dsh-rss-daily's 46-feed sources.default.json, and @hyzyn/dsh-rss's RSSHub catalog. This covers arXiv, lab blogs, HN, 量子位, InfoQ, 少数派 and similar with no key.
2) dsh-lit-search@0.2.1 (27 KB, Crossref + OpenAlex, 4 tools, keyless, Node-only) for paper lookup and citations, optionally dsh-hacker-news@0.1.0 (4 tools, 35 KB). Offer paper-search-mcp (`uvx paper-search-mcp`) only as an optional connector once Python/uv is available.
3) For 即刻 / 知乎 / 公众号 / 小红书 / X nothing in the ecosystem is keyless: use MyWork's logged-in Chrome with per-site skills as the default, and offer @zhengjunyao/dsh-jike (QR login, 11 read tools) and LinkDigest (paid, one MCP tool) as optional add-ons. From ARIS take the literature and review SKILL.md files as text, not the dsh-aris bundle.
ITEMS:
- [direct-endpoint] awesome-dsh-plugin/awesome-dsh-plugin (catalog: plugins.json) | runtime: none (JSON over HTTP / npm tarball) | access: No key. https://awesome-dsh-plugin.com/plugins.json (GitHub Pages IPs 185.199.108-111.153) or npm dsh-plugin-catalog (registry.npmmirror.com/dsh-plugin-catalog/latest answered 200 here).
    * CORRECTED: plugins.json has ~4,412 entries in 23 categories, 175 in "skill" -> Numbers are exact, but the file is a build artifact (website + npm package dsh-plugin-catalog), not a file in the repo. Per-entry fields: name, owner, url, page, category, description{en,zh}, npm, version, stars, downloads (a 30-DAY window, downloadsStart/End,
    * REFUTED: The named targets can be found in this catalog -> 7 of the 9 named targets are outside the curated catalog; they were verified directly on GitHub/npm instead.
- [borrow-format] dsh version compatibility of the ecosystem vs MyWork's pin 0.1.6-alpha | runtime: Node >= 24 for dsh itself (dev-env note); most plugins declare node '^22.19.0 || >=24.0.0' or '>=22.19.0' | access: n/a
    * CORRECTED: Each plugin's peer range decides whether it works on dsh 0.1.6-alpha.2; npm semver treats prereleases speciall -> On the pinned host, peer ranges and dsh.engines are advisory only: host packages are never installed into the profile, so every dsh peer is reported 'missing' as a warning and install/compose succeeds regardless. The range tells you what the author tested, not
    * REFUTED: MyWork's pinned dsh 0.1.6-alpha.2 is close to current -> The pin is three generations behind. Actively maintained plugins already floor above it: dsh-zotero '>=0.2.0-rc.2', dsh-free-search '^0.1.7-rc.1 || ^0.2.0-rc.1', dsh-web-search-pro '0.1.7-rc.2', @hyzyn/dsh-rss engines.dsh '>=0.1.7-rc.2', dsh-zhihu-search '>=0.
- [user-key] yangzhe1991/dsh-futu-mcp | runtime: Node (no engines declared; built ESM, deps @modelcontextprotocol/sdk ^1.30.0, zod) | access: Needs the user's own Futu account and a browser OAuth approval (refresh token ~14 days per README). No API key, no price stated in the plugin.
    * CORRECTED: Peer range accepts dsh 0.1.6-alpha.2; plugin type and tools -> Range rejects the pin under strict semver (accepted only with prerelease-inclusive matching / override; in a dsh profile it is just a warning). It is an MCP wrapper implemented as a native plugin (it does not use dsh-mcp-client). Tools are dynamic: whatever th
- [borrow-format] JingHao-Leon/dsh-alpha-desk | runtime: Python >= 3.11 (aihf), python3 stdlib for ledger.py; Node only for the optional risk-gate | access: FINANCIAL_DATASETS_API_KEY (financialdatasets.ai, README says a free tier exists; not checked), DeepSeek/other LLM key, optional Kimi key. GitHub-only.
    * CORRECTED: dsh-alpha-desk is a dsh plugin for AI investment research -> It is a SKILL pack plus Python tooling, not an npm plugin: install = symlink skill/ into the skills path, `pipx install aihf` (virattt/ai-hedge-fund engine), set FINANCIAL_DATASETS_API_KEY + an LLM key. The only dsh-native code is plugins/risk-gate (peers '*')
- [skip] Hm0ren/dsh-stock-analyst | runtime: Node (plain ESM, no build) | access: No key. GitHub source only.
    * CORRECTED: A usable dsh stock-analyst plugin (watch + AI analysis + alerts + daily report) -> Native tool plugin, but an unpublished one-shot prototype (not on npm, never updated, written against rc-era APIs, logs under $DSH_HOME/super-injector). Its prompt forbids price levels/recommendations, the opposite of what the finance edition wants.
- [ship-in-installer] PerryLink/dsh-industry-research (and siblings dsh-fund-research, dsh-r | runtime: Node ^22.19.0 || >=24.0.0 | access: No key of its own. Needs a working web_search/web_fetch provider behind ctx.web (stock dsh uses DeepSeek's search with the user's DeepSeek key).
- [ship-in-installer] PerryLink/dsh-fund-research | runtime: Node ^22.19.0 || >=24.0.0 | access: No key. Eastmoney / Tiantian Fund public pages.
- [user-key] zhengjy01/dsh-jike | runtime: Node ^22.19.0 || >=24.0.0 | access: User's Jike account, QR scan in the Jike app (code lives ~2 min); tokens auto-refresh. Free.
    * CORRECTED: Peer range accepts dsh 0.1.6-alpha.2 -> The author enumerates tested generations and 0.1.6 is not among them: strict semver false, true only with includePrerelease. It also touches webServer and client settings slots (devDeps built against 0.1.7-rc.2), so it is one of the plugins most likely to misb
- [one-click-install] wp-a/dsh-academic-paper-search | runtime: Python >= 3.10 via uv/uvx; Node only for the wrapper | access: No key required; an email for NCBI; optional keys raise quotas. Needs uv/uvx on PATH (not bundled).
    * CORRECTED: dsh-academic-paper-search is an installable dsh plugin for multi-source paper search -> It is a pure MCP wrapper (no native tools), NOT published to npm (GitHub install only), and it hard-pins a dsh core package (dsh-mcp-client 0.1.1-rc.2) as a dependency, which would put a second, older copy of a host package into the profile. Tools (per README,
- [borrow-format] wanshuiyin/Auto-claude-code-research-in-sleep, branch dsh-aris (npm ds | runtime: Node for the adapter; python3 for helper scripts and the Codex bridge; Codex CLI for review | access: Skills: none. Full bundle: python3 on PATH and an installed, logged-in Codex CLI (OpenAI account; not obtainable/usable by most mainland users without a proxy).
    * CORRECTED: It is a pure skill bundle that is safe to drop into a profile -> Skill bundle PLUS an MCP wrapper around the OpenAI Codex CLI (cross-model reviewer) PLUS a model-row override. No peer range is declared, so nothing rejects 0.1.6-alpha.2, but installing the bundle changes MyWork's default-model row and adds a startup-critical
- [one-click-install] openags/paper-search-mcp (dsh/ bundle: paper-search-mcp-dsh) | runtime: Python >= 3.10 via uv/uvx (not run here) | access: No key for most sources; optional Semantic Scholar/CORE/IEEE/Unpaywall-email keys. Needs uv (uvx).
    * REFUTED: The bundle can be installed on MyWork's dsh 0.1.6-alpha.2 -> Not on npm, link-install from a checkout only, and it pins the 0.2.0-rc.2 generation of dsh-mcp-client as a hard dependency. Use the underlying server instead: stdio `uvx paper-search-mcp` through MyWork's MCP connector; optional keys go in ~/.config/paper-sea
- [ship-in-installer] Realyujie/dsh-us-stocks | runtime: Node >= 22.19.0 | access: No key, no login.
    * CORRECTED: Peer range accepts dsh 0.1.6-alpha.2 -> Strict semver false, includePrerelease true; all peers optional so nothing blocks. Devs built against 0.1.0-rc.6 and the package has not been published since 2026-08-16.
- [ship-in-installer] STARDUSTLC666/dsh-rss (npm dsh-rss) | runtime: Node ^22.19.0 || >=24.0.0 | access: No key.
- [borrow-format] Other RSS / news / digest plugins (@hyzyn/dsh-rss, dsh-rss-daily, dsh- | runtime: Node; Python for dsh-rss-daily | access: All keyless. dsh-rss-daily: Python 3.9+ with feedparser. dsh-rss-monitor: SMTP credentials for mail.
    * CORRECTED: Several RSS/news plugins are available as alternatives -> @hyzyn/dsh-rss rejects the pin outright; dsh-rss-daily needs Python; dsh-rss-monitor gives the agent nothing to call. Only dsh-rss-digest, dsh-hacker-news and dsh-frontier-repro are Node-only tool plugins whose ranges admit 0.1.6 with prerelease matching.
- [direct-endpoint] tiantianlaolao/dsh-astock-research (public API quant.tybbtech.com) | runtime: none for the endpoint; Node for the plugin | access: No key, no login (requests carry embedded=true).
- [direct-endpoint] theBigGavin/marketingdashboard (mrd market-data MCP bundle) | runtime: Node (built-ins only) if self-hosted; none for the hosted REST | access: No key. Hosted demo is per-IP rate-limited (429 path in code).
    * CORRECTED: Zero-key market data MCP server (dsh bundle) with 5 MCP tools for A/HK/US quotes, sector rankings, futures, mo -> The hosted MCP endpoint the bundle points to does not speak MCP today, so the bundle as shipped registers nothing. The REST endpoints work. The server is self-hostable: server/index.cjs requires only Node built-ins (http, fs, path) and local modules, `node ser
- [user-key] Keyed finance data connectors found in the catalog: Cue data MCP (sens | runtime: none (remote MCP) | access: Cue: register at cuecue.cn for CUE_API_KEY; 10 free credits/day (~16 calls) + 500 one-time. Wind: WIND_API_KEY from Wind AIFin market (pricing not checked). Fuyao: key from fuyao.aicubes.cn (not check
    * CORRECTED: Cue exposes 15 streamable-http domains (~104 tools) for regulatory, macro, disclosure and market data -> 16 live domains / 108 tools today; every call needs CUE_API_KEY.
- [borrow-format] megatronyy/dsh-tradingagents and kentleenot/dsh-trading-toolkit (GitHu | runtime: Node | access: No key (host LLM + public Eastmoney/Tencent sources).
- [one-click-install] Other AI-tracking sources in the ecosystem (dsh-lit-search, dsh-ai4sch | runtime: Node for dsh-lit-search; Python sidecars for wechat-collector and dsh-zhihu; none for LinkDigest (remote MCP) | access: dsh-lit-search: none. ai4scholar: key + credits. harvest: Tavily key. LinkDigest: key (10 free credits once). WeChat collector / Zhihu / Jike / Cubox: the user's own account login.
    * CORRECTED: The catalog has ready plugins for papers, deep search, Xiaohongshu/Douyin/X links, WeChat articles and Zhihu -> Only dsh-lit-search is keyless and Node-only. The social-platform readers all need a login, a paid key, or a Python sidecar; none is a drop-in for 即刻/小红书/公众号/X. There is no GitHub-trending plugin (github-explore@3.1.0 is a SKILL.md pack around the gh CLI) and 

===== ai-central-feeds
SURPRISES: 1. The 'three central feeds' are one dependency chain, not three independent upstreams. ai-news-radar ingests AIHOT (via the legacy API https://aihot.virxact.com/api/public/items) and follow-builders (raw feed-x/blogs/podcasts JSON). Using all three double-counts, and the radar's AIHOT lane is on an API that answers today with 'deprecation: true' and 'sunset: Sat, 31 Oct 2026 15:59:59 GMT'.

2. AIHOT's legacy /api/public/* and the aihot.virxact.com host stop on 2026-10-31 (26 days from now). Anything built must use https://aihot.news/api/v1/*. The khazix aihot skill v2.0.0 already does.

3. Self-hosting the AIHOT engine does not give AIHOT's coverage: the repo ships 18 sample RSS sources; the hosted site watches 853 (X 512, RSS 170, web 130, WeChat 23, API 18) using paid SocialData and dajiala keys. The engine needs Node >=24.11 + PostgreSQL + Docker. What is portable is the method (prompts, thresholds 60/65/76, type-weighted five-axis score, 48h/24h-half-life heat, 7-edition no-repeat rule).

4. AIHOT's selected stream is thin on weekends/holidays (2 items in the last 24h, 3 on Oct 3, versus 17-34 on weekdays) and can contain backfilled old posts with null publishedAt (a 2023 Vicuna post is 'selected', and the radar ranked it #2 today). A daily routine needs: fallback to mode=all with a score cut (score is returned for every item), and a publishedAt sanity filter.

5. Keyless X and WeChat exist, but not where the scouts pointed: BestBlogs' OPML is really a directory of two third-party bridges - api.xgo.ing (160 X accounts as RSS, 8/8 sampled live with real tweet dates) and wechat2rss.bestblogs.dev (115-375 WeChat accounts, full text, 14/14 sampled live). These let a user put arbitrary X accounts and 公众号 into 信源表.csv with no key - something AIHOT (no per-account feed, 23 公众号) and follow-builders (26 fixed accounts, 3 tweets/day) cannot do. They are also the single most fragile dependency, and tidings-rss leans on the same bridges for 75+ of its feeds.

6. WeChat bridge feeds are 0.2-1.8 MB each (10 full articles). Polling 115 of them is tens of MB per cycle; the teammate needs conditional requests / per-source intervals, not a naive loop.

7. Hosting matters for mainland users and I could not test it: this machine runs a fake-IP TUN proxy (DNS returns 28.0.x.x; curl --noproxy still went through it). Judgement only: aihot.news is on Tencent EdgeOne (likely fine); news.learnprompt.pro, wechat2rss/rsshub.bestblogs.dev are Cloudflare-fronted (usually reachable, slow); follow-builders, Olshansk and tidings live on raw.githubusercontent.com (commonly unreachable - jsDelivr mirrors returned identical content here); agents-radar's MCP is on *.workers.dev (commonly blocked) while its github.io pages are usually reachable. tidings' own validation file marks mainland reachability 'unverified'.

8. agents-radar quality is uneven: only 4 of 9 report types ran on Oct 4, the 'Chinese' reports that day are 0-16% Chinese, and the prose cites 'Claude 3.5 Sonnet and DeepSeek-V3' as recent releases. Its tables are useful; its commentary is not trustworthy.

9. Olshansk/rss-feeds lists 34 feeds but about 10 generators have been dead since May-August (xAI, Mistral, Perplexity, The Batch, Windsurf changelogs, Groq, FAR.AI, Transluce, Anthropic Red). HTTP 200 does not mean alive; lastBuildDate does.

10. Small integration facts: AIHOT hot-topics returns rank and source/participant counts but no heat number; AIHOT web pages give 403 to curl's default UA while API/RSS/MCP do not; learnprompt.github.io 301s to an http:// URL first; the radar reader skill assumes python3 and quotes file sizes that are 3-5x off; AIHOT's MCP is stateless streamable-HTTP with no headers needed, agents-radar's is plain JSON POST on protocol 2024-11-05.

Scratch files from the checks are in <scratch> (feedcheck.py, olcheck.py, saved payloads). No servers left running, nothing installed globally.
BEST PICKS: Day-one, zero-key coverage for an AI teammate - four upstreams, in order:

1. AIHOT hosted (https://aihot.news/api/v1/* + the 3-file aihot skill, optionally the MCP at /api/mcp). The spine: scored, summarised, clustered Chinese AI news with hot events and a daily edition; 15-minute median lag; 853 sources behind it. Ship the skill in the installer and have routines call /api/v1/items (JSON with score) into 情报库.csv. Lacks: thin 公众号 coverage (23 accounts), no full text, search only 7 days back, low selected volume on weekends/holidays, taste tuned to general heavy users rather than researchers, and it is one person's site.

2. BestBlogs bridges as 信源表 rows (wechat2rss.bestblogs.dev for 公众号 full text, api.xgo.ing for X accounts, plus BestBlogs' own /feeds/rss?category=ai&minScore=90). The raw, user-customisable layer: the only keyless path to WeChat and to arbitrary X timelines. Lacks: any curation or scoring (the teammate must score with DeepSeek, using AIHOT's published prompt format), heavy payloads, and it rests on third-party bridges that can disappear - track per-source health.

3. Olshansk/rss-feeds, fresh subset only (anthropic_news, anthropic_research, claude, openai_research, openai_developer, openai_engineering, cursor, ollama, meta_ai, aisi, goodfire) plus the official RSS URLs its README lists. First-party lab posts at source, independent of any aggregator's taste. Lacks: about 10 dead generators, English only, raw.githubusercontent.com hosting (fetch through a jsDelivr path or the app's own fetcher with fallback).

4. agents-radar markdown/manifest on duanyytop.github.io (not the workers.dev MCP). The developer-ecosystem lane nobody else covers: daily issue/PR/release activity for Claude Code, Codex, Gemini CLI, Qwen Code, OpenClaw, vLLM/Ollama, GitHub AI trending with star deltas, arXiv/HN on most days. Lacks: consistent report set, reliable Chinese output, trustworthy prose - use the tables.

Secondary, optional: follow-builders feed-x.json (clean builder posts via official X API, but 26 fixed accounts, daily, mostly subsumed by xgo.ing rows and by AIHOT's X sources); ai-news-radar JSON only for its Xiaohongshu/Douyin creator list and HN/Techmeme breadth, since the rest duplicates AIHOT and follow-builders; tidings-rss feeds.json bundled as a pick-list catalog.

Build on, concretely: (a) AIHOT v1 API + skill as the default daily brief; (b) AIHOT's open prompts/thresholds (selection-score.md, T1 60 / T1.5 65 / T2 76, double scoring, 7-edition no-repeat, independent-source heat) as the scoring format for the teammate's own 情报库 over user-chosen sources; (c) a seed 信源表.csv assembled from BestBlogs' WeChat/X bridge URLs and the verified-fresh Olshansk feeds, with a health column (HTTP status, newest item date, lastBuildDate) because every one of these upstreams fails silently.
ITEMS:
- [direct-endpoint] AIHOT hosted service (aihot.news): REST API v1, agent-markdown endpoin | runtime: none (HTTP GET / remote MCP) | access: No key, no login, free. ~60 req/min/IP. Search limited to last 7 days; no per-item full-text endpoint.
    * REFUTED: The old API scouts may have used (/api/public/*, aihot.virxact.com) is the one to build on -> Build only on https://aihot.news/api/v1/*. Note hot-topics still returns links.story on the aihot.virxact.com host.
    * CORRECTED: Hot topics give a heat value -> You get rank plus independent-source/participant counts, not the heat score.
- [ship-in-installer] aihot Agent Skill (KKKKhazix/khazix-skills/aihot, mirrored at aihot.ne | runtime: none (pure markdown; needs curl or a fetch tool; Windows uses curl.exe) | access: None. Optional anonymous .aihot-actor-id UUID appended to UA for dedup stats (can be omitted).
    * REFUTED: It needs Python or other runtime -> SKILL.md only instructs curl GETs (or any web-read tool) against aihot.news; server returns finished Chinese markdown. No scripts in the package.
- [borrow-format] AIHOT open-source engine (KKKKhazix/AIHOT) pipeline | runtime: Node >=24.11, PostgreSQL, Docker Compose | access: Self-host needs LLM key + Postgres; X and WeChat collection need paid third-party keys.
    * CORRECTED: 5-axis scoring run twice -> Five axes are internal reasoning; output is a single attentionScore, type-weighted, computed twice. A prefilter (BLOCK/PASS/UNKNOWN) runs before it.
    * REFUTED: Self-hosting the engine reproduces AIHOT's coverage -> The repo is the framework only; the hosted site's 853 sources are not published.
- [direct-endpoint] LearnPrompt/ai-news-radar static JSON (news.learnprompt.pro/data/*.jso | runtime: none to read; self-run needs Python 3.11 (requests, beautifulsoup4, feedparser, python-dateutil) + GitHub Acti | access: No key, no login, no rate limit (static files on GitHub Pages behind Cloudflare).
    * CORRECTED: Static JSON at learnprompt.github.io/ai-news-radar/data/latest-24h.json -> Canonical URL is https://news.learnprompt.pro/data/...; clients that do not follow redirects will fail on the github.io URL.
    * REFUTED: It is an independent upstream -> It is a downstream re-aggregation of AIHOT + follow-builders + HN/TechURLs/NewsNow/Buzzing, plus two paid lanes run on the maintainer's keys. Its AIHOT lane will break on Oct 31 unless migrated to /api/v1.
- [borrow-format] ai-news-radar skills: 伯乐/Scout (skills/ai-news-radar) and 雷达/Radar (sk | runtime: markdown; reader skill snippets assume python3 | access: none
    * CORRECTED: There is also a reader skill that needs no key -> Works without keys but assumes python3 on PATH; on MyWork the parsing lines must be rewritten for Node or done by the model.
- [direct-endpoint] zarazhangrui/follow-builders central feeds (feed-x.json, feed-podcasts | runtime: none to read; optional Node >=18 for prepare-digest.js (verified on 23.9) | access: No key for readers. Telegram/Resend keys only for its own delivery scripts (not needed in MyWork).
- [direct-endpoint] duanyytop/agents-radar (hosted MCP + RSS + markdown digests) | runtime: none (remote MCP or HTTP GET) | access: No key. MCP and Pages are free and anonymous.
    * CORRECTED: Daily digest from 10 sources, bilingual -> Coverage and language are inconsistent day to day; treat the tables (repos, stars, issues/PRs, HN items) as data and ignore the prose.
- [direct-endpoint] ginobefun/BestBlogs OPML (and its WeChat / X / RSSHub bridges) | runtime: none (RSS over HTTP) | access: OPML and bridges: none. BestBlogs API/skills: account + X-API-KEY (some endpoints Pro).
    * CORRECTED: BestBlogs curated output is available without a key -> RSS is keyless; API, CLI and skills need a BestBlogs account key.
    * CORRECTED: Repo is maintained -> Static list, live bridges.
- [ship-in-installer] fuxiaoai/tidings-rss (718 feeds, data/feeds.json, OPML packs) | runtime: none (JSON/OPML); its own tooling is Python + a Node script, not needed | access: none
    * CORRECTED: It is an AI feed catalog -> Mostly Chinese independent engineering blogs; AI proper is 38-99 feeds, and 75+ feeds reuse the BestBlogs/xlab bridges.
    * CORRECTED: Live-verified -> A dated snapshot (7+ weeks old) that still checks out at about 95% in a 20-feed sample; the repo itself says mainland reachability is unverified.
- [direct-endpoint] Olshansk/rss-feeds (generated RSS for AI lab blogs without a feed) | runtime: none to read; generators are Python 3.11 + uv (+ Selenium for some) | access: none
    * CORRECTED: Provides RSS for AI lab blogs lacking one, kept fresh -> About 14 of 34 feeds are demonstrably current; roughly 10 generators have been dead for 2-4 months, including xAI, Mistral, Perplexity and The Batch.

===== x-and-social
SURPRISES: 1) Rettiwt guest mode is NOT a timeline source: `rettiwt user timeline` as guest returns 100 'most popular' tweets, newest from Nov 2025 (checked karpathy and sama). Any design assuming keyless fresh X timelines through Rettiwt is wrong. Guest mode is still good for profile lookup and single-tweet hydration.
2) There IS a free keyless X source nobody listed: BestBlogs_RSS_Twitters.opml = 160 AI builder accounts as RSS on api.xgo.ing (50 tweets each, fresh to Oct 2-3, engagement counts included). Arbitrary handles are not available (404). Single tweets also hydrate keylessly via cdn.syndication.twimg.com/tweet-result.
3) 即刻 does not need login for fixed lists: m.okjike.com/users/<uuid> and /topics/<id> return the 10 newest posts in __NEXT_DATA__ (verified fresh today). dsh-jike is only needed for the following feed, search and notifications.
4) 公众号: the public Wechat2RSS feeds (xlab.app) are ~6 days stale right now (newest Sep 28 for 机器之心/新智元/量子位) while BestBlogs' own instance (wechat2rss.bestblogs.dev, 375 accounts, full text) is fresh to Oct 4. we-mp-rss has several unresolved 'authorized but cannot sync' reports from September. Self-hosted options are Docker-only, so a desktop user realistically gets 公众号 only from hosted feeds or from their own Chrome.
5) Reddit closed self-serve API app creation (reddit-mcp-buddy issue #69), so 'user brings own Reddit key' is mostly dead; what remains is anonymous RSS at roughly one request per 10-60s with no scores, or the logged-in Chrome.
6) YouTube transcript tools that call InnerTube directly are blocked from this IP: baoyu's script only succeeded through its yt-dlp fallback, and kimtaeyoon83's MCP returns an empty string with isError=false. yt-dlp is the working layer, and it now wants a JS runtime (`--js-runtimes node:<path>` works with bundled Node). Fetch one subtitle language per call (second language got 429).
7) xAI x_search pricing is per item now: $5/1k posts + $10/1k profiles + tokens, max 20 handles per call. Per post it costs the same as the official X API ($0.005), without the determinism.
8) Split routing matters: mp.weixin.qq.com answered a foreign-proxy request with a 302 to a captcha page and B站 returned 412, while X/YouTube/Reddit need the proxy. The teammate's fetch layer needs per-domain direct/proxy rules.
9) xiaohongshu-mcp: no Intel-Mac or Windows-arm build, pulls a 140-190MB custom Chromium from cdn.one-world.ai on first run, and its web session and the user's own 小红书 web session evict each other.
10) bilibili-mcp is a Node package (GitHub's 'Python' label is wrong); only its optional ASR needs Python.
11) sherpa-onnx needs WAV input, so local transcription also requires shipping an audio decoder (ffmpeg); measured RTF 0.021 on Apple Silicon.
12) Mainland reachability could not be tested at all: this machine runs a TUN proxy (fake-IP DNS 28.0.x.x, 'direct' curl exits in the US). Every reachability statement above is a judgement.
13) Not run: anything requiring a login (OpenCLI browser adapters, Rettiwt cookie mode, xiaohongshu-mcp, MediaCrawler, bilibili-mcp logged-in tools) and anything requiring a key (xAI, X API). Those verdicts rest on source, docs, release assets and issue trackers.
BEST PICKS: Build on three pieces.

1) Hosted RSS as the zero-setup default (direct-endpoint, $0, no login): BestBlogs OPMLs. X: 160 builder feeds on api.xgo.ing. 公众号: 375 full-text feeds on wechat2rss.bestblogs.dev. Podcasts: xiaoyuzhoufm podcast pages (or rsshub.bestblogs.dev/xiaoyuzhou). Add keyless m.okjike.com user/圈子 pages and YouTube channel RSS. These fill 信源表.csv on day one. Risk: all are one-owner third-party hosts, so store the canonical handle/biz id next to each URL to allow re-pointing.

2) OpenCLI in the user's logged-in Chrome (ship-in-installer, Node >=20.18.1, 9.5MB, extension zip 45KB or CDP): the fallback for everything login-walled or outside the hosted lists — X (`twitter list-tweets <listId>` reads a whole 100-member List in one call), 小红书 search/user/note/comments, B站, 微博, 知乎, Reddit with scores, 公众号 article export.

3) yt-dlp binary + sherpa-onnx-node SenseVoice as an optional media pack (one-click-install, ~18-37MB + ~300MB): YouTube transcripts in ~10s per video; podcast transcripts at ~75s per hour of audio on Apple Silicon.

Recommended coverage for the AI-edition teammate, with cost:
(a) ~100 builder accounts on X: default xgo.ing RSS for accounts in the 160 list, $0. Accounts outside it: OpenCLI with the user's X login and one X List, $0 but uses the user's account and needs a proxy. Paid tier only if the user wants no login: official X API at $0.005/post, about 400 posts/day = ~$2/day = ~$60/month ($20 free credit on first card), or xAI x_search at the same per-post rate plus tokens for ad-hoc digests (5 calls of 20 handles).
(b) 公众号: BestBlogs wechat2rss feeds, $0, full text, same-day. Outside the list: user opens/exports the article in Chrome (OpenCLI weixin download); no self-host option fits a desktop install (Wechat2RSS private is ¥150/year but Docker-only; we-mp-rss is failing).
(c) 即刻: keyless m.okjike.com pages, $0; dsh-jike (QR) only for the personal following feed and search. 小红书: always needs the user's login; use OpenCLI xiaohongshu in Chrome, $0; xiaohongshu-mcp as an optional ~200MB install for Apple Silicon and Windows x64.
(d) YouTube: channel RSS for discovery + yt-dlp for subtitles, $0, proxy required. Podcasts: xiaoyuzhoufm page for episodes, shownotes and mp3 URL, $0; local SenseVoice for full transcripts, $0; official 小宇宙 transcripts only with the user's app tokens.
ITEMS:
- [user-key] xAI x_search tool (api.x.ai Responses API) | runtime: none (HTTPS JSON); works from bundled Node fetch | access: User's own xAI API key (card needed). No free quota found on the pricing page. ~$0.005 per post fetched + tokens.
    * CORRECTED: x_search costs $5 per 1,000 sources -> $5 per 1k POSTS fetched + $10 per 1k PROFILES fetched + model tokens (grok-4.3 $1.25/M in, $2.50/M out; grok-4.7 $2/$6). Parent and quoted posts count.
    * CORRECTED: Can be scoped to a list of builder handles -> Max 20 handles per request, so 100 accounts = 5 requests per sweep. Output is a model-written answer with citations, not a guaranteed complete timeline: the model decides how many posts to fetch.
- [user-key] Official X API pay-per-use | runtime: none (HTTPS, Bearer token) | access: X developer account + card; $20 free credit on first card; individual can sign up. Not tested with a key.
- [user-key] Rishikant181/Rettiwt-API (npm rettiwt-api 7.1.4) | runtime: Node (declares ^22.21.0; ran on 23.9) | access: Guest: none. User mode: X account cookies encoded as API_KEY; README warns of account-ban risk.
    * CORRECTED: Node library/CLI, works on bundled Node -> Published engines field is ^22.21.0 only; on Node 24 npm prints EBADENGINE (warning, not failure).
    * REFUTED: Guest mode still returns user timelines -> Guest timeline returns X's logged-out 'most popular' set, nearly a year stale. Useless for monitoring new posts. Fresh timelines need the cookie API_KEY (auth_token, ct0, twid base64).
- [skip] twscrape (vladkens) and twitter-cli (public-clis/twitter-cli) | runtime: Python >=3.10 (not bundled) | access: X account cookies
    * CORRECTED: twscrape is alive -> Maintained but Python-only, needs accounts, and has an open transaction-id breakage as of 2026-09-30.
    * CORRECTED: twitter-cli state -> Effectively unmaintained since May 2026; search broken since Aug 2026.
- [skip] RSSHub twitter routes and public Nitter/XCancel | runtime: Node ^22.22.2 || ^24.15.0 server (or Docker) | access: User's X auth_token cookie
    * REFUTED: Public Nitter-style mirrors are a fallback -> xcancel.com/karpathy/rss -> HTTP 451 'XCancel service is suspended'; nitter.net and nitter.poast.org TLS failure; lightbrd.com 403; nitter.tiekoetter.com bot-check page.
- [ship-in-installer] jackwener/OpenCLI (npm @jackwener/opencli 1.8.8) with the user's logge | runtime: Node >=20.18.1, pure JS deps | access: No key. User logs into each site by hand in Chrome. xiaoyuzhou commands need ~/.opencli/xiaoyuzhou.json tokens (verified: exit 78 'Missing Xiaoyuzhou credentials').
    * CORRECTED: Needs a Chrome extension -> Extension OR plain CDP endpoint. Chrome Web Store is not reachable from mainland, so ship the 45KB zip (load unpacked) or use CDP with MyWork's own Chrome.
- [direct-endpoint] XGo.ing RSS feeds via BestBlogs_RSS_Twitters.opml (found during verifi | runtime: none | access: No key, no login, $0
    * REFUTED: Arbitrary handles can be requested -> Only the accounts already in the OPML are available without an xgo account.
- [direct-endpoint] karanb192/reddit-mcp-buddy and Reddit .json | runtime: Node >=18 (3 pure-JS deps, 329KB) or none if reading .rss directly | access: None; ~1 request per 10-60s per IP
    * CORRECTED: Anonymous RSS mode works -> Works, but only subreddit listing, no scores or comment counts, and about one request per 10-60s per IP.
    * CORRECTED: User can add own Reddit app credentials for 60-100 req/min -> New individuals generally cannot create a Reddit API app any more, so the authenticated tiers are not obtainable for most users.
- [one-click-install] NanmiCoder/MediaCrawler | runtime: Python >=3.11 + uv + Node.js; git clone (not a pip package) | access: User's logged-in Chrome or QR login; no key
- [one-click-install] xpzouying/xiaohongshu-mcp | runtime: Go binary (no runtime) + downloaded Chromium | access: 小红书 account QR login; real-name verified account recommended
    * CORRECTED: Self-contained download -> Needs an extra 140-190MB browser download from a Cloudflare-fronted CDN; no Intel Mac or Windows-arm build.
    * CORRECTED: Safe to run alongside the user's own session -> The MCP's web session and the user's own browser web session evict each other; phone app is unaffected.
- [skip] rachelos/we-mp-rss | runtime: Python >=3.13.1 or Docker | access: WeChat QR authorization (or WeRead cookie)
    * CORRECTED: Self-hosted 公众号 to RSS works now -> Many users cannot sync after authorizing as of Sept 2026; the WeRead fallback gives one article per account per run and no history.
- [direct-endpoint] ttttmr/Wechat2RSS (wechat2rss.xlab.app) | runtime: none for public feeds; Docker for private | access: Public: free. Private: ¥15/month or ¥150/year + a WeChat/WeRead account
    * CORRECTED: Free public feeds for 300+ 公众号 -> Public xlab feeds are alive but about 6 days behind right now.
- [direct-endpoint] BestBlogs WeChat bridge (wechat2rss.bestblogs.dev) and BestBlogs OPMLs | runtime: none | access: No key, $0. OPML last synced in repo 2026-06-07.
- [direct-endpoint] 即刻 keyless pages (m.okjike.com) — found during verification | runtime: none | access: No key
    * REFUTED: 即刻 needs login/QR to read -> Public user pages and 圈子 pages are readable with no login; only the following feed, search and notifications need a token.
- [user-key] zhengjy01/dsh-jike (npm @zhengjunyao/dsh-jike 0.1.1) | runtime: Node ^22.19 || >=24 inside DSH | access: 即刻 app QR scan; tokens stored locally and refreshed
- [user-key] XZXZZX-Ai/bilibili-mcp (npm @xzxzzx/bilibili-mcp 1.14.2) | runtime: Node >=20 (npx) | access: B站 login: QR scan in terminal (`setup`) or SESSDATA/bili_jct/DedeUserID; stored in ~/.bilibili-mcp/config.json
    * CORRECTED: Runtime -> It is a Node stdio MCP server; Python is only for the optional ASR add-on.
- [borrow-format] baoyu-youtube-transcript (JimLiu/baoyu-skills) | runtime: bun (or npx bun) + yt-dlp binary | access: No key
    * CORRECTED: No API key or browser required; uses InnerTube directly -> From this (proxy) IP the direct InnerTube path no longer returns caption text; it works only because of the yt-dlp fallback.
    * CORRECTED: Runs on bundled Node -> Needs bun (or a Node new enough to support import.meta.main, not verified) plus yt-dlp.
- [skip] kimtaeyoon83/mcp-server-youtube-transcript | runtime: Node | access: none
    * REFUTED: Working YouTube transcript MCP -> Returns an empty transcript silently.
- [one-click-install] yt-dlp standalone binary | runtime: Single binary (17.8MB Windows, 37MB macOS); bundled Node as JS runtime | access: No key
    * CORRECTED: No extra runtime needed -> Pass --js-runtimes node:<bundled node path>; subtitles still worked without it, but formats may be missing.
- [one-click-install] sherpa-onnx Node bindings (sherpa-onnx-node 1.13.8) with SenseVoice | runtime: Node native addon (prebuilt, 23-38MB per platform) + 237MB model + ffmpeg for decoding | access: No key, $0
    * CORRECTED: Self-contained -> Needs an audio decoder (ffmpeg or equivalent) for mp3/m4a, which MyWork does not bundle today.
- [direct-endpoint] 小宇宙 transcripts and episode data | runtime: none for metadata; sherpa-onnx pack for transcripts | access: No key for metadata/audio; app tokens for official transcripts
    * CORRECTED: 小宇宙 transcripts are available to a teammate -> Official transcripts need the user's app tokens; there is no QR flow in OpenCLI for it.

===== browser-layers
SURPRISES: 1. OpenCLI does NOT need its Browser Bridge extension for the per-site commands: setting OPENCLI_CDP_ENDPOINT routes every site adapter through plain CDP, and I ran it against a Chrome started with --remote-debugging-port (bilibili hot, 36kr hot, gov-policy recent, web read all returned data; twitter returned exit 77 for no login). The scouts' picture of 'extension from a store' is the default path, not the only one.
2. The CDP path has three sharp edges that shape the integration: (a) `opencli browser <session> ...` and `opencli doctor` ignore the CDP endpoint and demand the extension — only `opencli <site> <command>` works; (b) with an http://host:port endpoint OpenCLI does not open a tab, it picks an existing one from /json and navigates it, preferring localhost/127.0.0.1 URLs, which in MyWork's Electron shell is the app window itself — pass a ws://127.0.0.1:9333/devtools/page/<id> endpoint for a tab MyWork created; (c) there is no tab lease in CDP mode, so calls must be serialised per tab.
3. About 300 of the 1366 commands need no browser at all, and 97 of 127 I sampled returned data keylessly on Node (HN, arxiv, HF, GitHub trending, Product Hunt, 掘金, V2EX, LessWrong, 36kr, 头条, 新浪财经 7x24, 同花顺热股, 东财快讯/龙虎榜/北向/公告/十大股东, CoinGecko, Bloomberg RSS). That is a ready-made 信源表 for both editions before any login.
4. Exit codes are not fully trustworthy: zhihu hot behind an anti-bot page and eastmoney hot-rank returned `[]` with exit 0. Routines must treat empty output as failure.
5. Headless Chrome gets blocked: xueqiu served '请求异常已被安全策略拦截' and zhihu redirected to /account/unhuman in my headless test. MyWork's packages/browser README describes a headless-by-default background Chrome; logged-in finance/social reading needs it headed (or with a non-Headless UA).
6. All eastmoney quote/kline/rank/sector/money-flow commands go to push2.eastmoney.com, which returned 502 from this US-egress proxy (curl too). Expected to work on a mainland line but I could not verify it; the datacenter/np hosts worked.
7. OpenCLI upstream activity collapsed in September 2026: 114 merged PRs in August, 1 since September 1, 199 open PRs, with fresh breakage reports for xiaohongshu/tiktok/instagram unanswered. Plan to pin the version and own adapter fixes (adapters are single JS files overridable in ~/.opencli/clis).
8. Agent-Reach is no longer an independent reader: its first-choice backend for Reddit, 小红书, Facebook and Instagram, and its fallback for X and B站, is OpenCLI. Its PyPI name belongs to a different project, and its shipped SKILL.md hard-codes the author's conda environment.
9. 同花顺 coverage is one hot-rank command; there is no 同花顺 quote/F10 adapter.
BEST PICKS: 1. @jackwener/opencli 1.8.8, vendored into the installer and pinned (19 MB, pure JS, bundled Node). Yes — adopt it as MyWork's logged-in website reader, for the per-site commands only. Integration: ship the package under runtime/; expose one shell tool that runs `node <runtime>/opencli/dist/src/main.js <site> <command> -f json|csv` with (a) HOME/USERPROFILE pointed at a MyWork-owned dir so ~/.opencli stays out of the user's home and adapter hot-fixes live there, (b) for browser:true commands, OPENCLI_CDP_ENDPOINT=ws://127.0.0.1:9333/devtools/page/<targetId> of a dedicated 'reader' tab that MyWork creates through its own tab bridge, one command at a time per tab, (c) HTTP(S)_PROXY passed through when the user has one. Never call `opencli doctor` or `opencli browser ...`; keep Playwright MCP for generic browsing. Map results: exit 77 -> ask the user to log in to that site in the browser panel (then `opencli <site> whoami`), 75 -> retry once, 1 or empty array -> mark the source unhealthy in 信源表.csv. Run the Chrome headed for xueqiu/zhihu/xiaohongshu.
2. The keyless public adapters as the default 信源表 rows for both editions (finance: eastmoney kuaixun/longhu/northbound/announcement/holders, ths hot-rank, sinafinance news/rolling-news/stock, bloomberg feeds, coingecko; AI: hackernews, arxiv, hf, github-trending, producthunt, juejin, v2ex, lesswrong, 36kr, google news) — they work before the user logs into anything, and `-f csv` output appends directly to 情报库.csv.
3. A MyWork-written skill that borrows from OpenCLI's opencli-usage/opencli-autofix (command discovery via `<site> --help -f yaml`, repair loop on a local adapter copy) and from Agent-Reach's ordered-backend table and doctor contract (per-source status, active route, repair hint, 'empty is not success'). Take the format, not Agent-Reach's Python.
ITEMS:
- [ship-in-installer] jackwener/OpenCLI — npm package @jackwener/opencli 1.8.8 (the CLI itse | runtime: Node >= 20.18.1 (ran on 23.9.0; bundled Node 24 is fine). No Python. Browser adapters additionally need a Chro | access: No key, no account for the public adapters. semanticscholar and pubmed rate-limit anonymous calls (429 seen); semanticscholar accepts SEMANTIC_SCHOLAR_API_KEY. Free.
    * CORRECTED: Uses sysexits exit codes (66 empty, 69 bridge down, 75 timeout, 77 auth, 78 config) -> Exit 66 is per-adapter (EmptyResultError appears in 444 adapter files, not in zhihu/hot or eastmoney/hot-rank). A caller must treat exit 0 + empty array as a failure too, and must not use `doctor`'s exit code.
    * CORRECTED: Can attach to an existing Chrome started with --remote-debugging-port (how MyWork runs its Chrome on 127.0.0.1 -> Only SITE ADAPTERS honour the CDP endpoint. `opencli browser <session> open/state/eval/tab ...` and `opencli doctor` hard-code BrowserBridge (dist/src/cli.js lines 514 and 1024) — with the CDP env set they still waited 45s and failed 'Browser Bridge extension 
    * CORRECTED: Finance adapters include eastmoney, 同花顺, xueqiu, sina -> 同花顺 is a single hot-rank command, not a data adapter. Live results from this US-egress proxy: eastmoney kuaixun/northbound/longhu/announcement/holders OK, ths hot-rank OK, sinafinance news/rolling-news/stock OK; every push2.eastmoney.com command (quote, kline,
- [user-key] OpenCLI logged-in site adapters via CDP into MyWork's Chrome (xueqiu,  | runtime: Bundled Node + MyWork's Chrome over CDP. No extension, no daemon. | access: User logs in by hand in the MyWork browser panel; no keys. Free.
    * CORRECTED: OpenCLI can serve as MyWork's 'logged-in website reader' on the existing 127.0.0.1:9333 Chrome without the ext -> It works for the per-site commands only, one tab at a time, and only if MyWork hands OpenCLI a ws://127.0.0.1:9333/devtools/page/<targetId> URL for a tab MyWork created itself. Generic click/type browsing must stay on MyWork's Playwright MCP. Not run against t
- [skip] OpenCLI Browser Bridge extension + `opencli browser` primitives + Open | runtime: Chrome extension + persistent Node daemon on 127.0.0.1:19825 | access: Free; manual 'Load unpacked' or Web Store install
    * CORRECTED: `opencli browser` gives a generic navigate/click/type/extract layer -> Extension-only. Unusable over MyWork's CDP port.
- [borrow-format] OpenCLI bundled skills (skills/opencli-usage, opencli-adapter-author,  | runtime: none (markdown) | access: none
- [borrow-format] Panniantong/Agent-Reach (v1.5.0, Python) | runtime: Python >= 3.10 (+ pipx or uv), Node for mcporter/OpenCLI, optional ffmpeg | access: Free. Login cookies for Twitter/雪球/小红书/Reddit; free Groq key for podcast transcription.
    * CORRECTED: Python CLI + SKILL.md -> It is not on PyPI under its own name: pypi.org/pypi/agent-reach is an unrelated 0.1.0 package by another author, and the README says not to install from PyPI. Install is from the GitHub archive only. The shipped SKILL.md also contains the author's local enviro
- [direct-endpoint] Exa MCP (https://mcp.exa.ai/mcp) and Jina Reader (https://r.jina.ai/<u | runtime: none | access: No key used in my calls; free anonymous tier limits not verified.

===== pdf
SURPRISES: 1. liteparse's default is the wrong default for MyWork. Plain `lit parse file.pdf` has OCR on: on the 143-page Moutai annual report it took 111.7 s and first downloaded eng.traineddata (15.4 MB) from github.com, versus 0.41 s with --no-ocr, and the OCR added nothing useful. "Bundled Tesseract" means the engine only; language data is fetched from GitHub at first use. The wrapper must always pass --no-ocr and treat OCR as a separate, explicit step.

2. Markdown mode is not the right format for filings. It gave clean tables for the key-figures section but emptied the consolidated balance sheet and income statement (labels in a table, numbers spilled as loose lines) and missed the top-10 shareholder table. Text (layout grid) mode had every one of those right. So: text/JSON for filings, markdown for papers.

3. Page numbers are not in text or markdown output. Only JSON/library output carries them (CLI key `page`, library key `pageNum`). A citing teammate needs a wrapper that writes per-page text with page headers.

4. A whole annual report does not fit one prompt: 143 pages = about 270K characters in text mode (about 189K in markdown). The reading tool has to be "parse once into the teammate's folder, then search / read pages X-Y", not "return the PDF as text".

5. `lit is-complex` flags 65 of 143 pages of a fully born-digital Chinese report as needing OCR (sparse-text heuristic tuned for Latin text). It cannot be the OCR router for Chinese documents.

6. MinerU has a keyless hosted endpoint that works today (mineru.net /api/v1/agent/parse/url and /parse/file: ≤10 MB, ≤20 pages per task, page_range accepted on longer files, 14-22 s per task). The scouts' "hosted API?" question has a better answer than expected: no key, no Python. Two catches: its result CDN (cdn-mineru.openxlab.org.cn) has had an expired TLS certificate since 2026-10-02, so a strict Node fetch of markdown_url fails right now; and numbers come back OCR-style with spaces inside ("303, 834, 844, 021. 44").

7. MinerU is now 4.0 (2026-09): tiers are flash / basic / standard / advanced, CLIs are `mineru` and `mineru-kit`, and it runs a local background server. Any scout note using "pipeline / vlm backend" wording describes 3.x or the hosted API only. Local install is about 220 MB of wheels on Windows (310 MB on Apple Silicon, torch included) plus 0.8 GB of models for the CPU tier — and Python 3.10-3.14.

8. The main npm tarball of liteparse ships a stray Linux binary (33 of 34 MB). Bundle size per platform is about 26 MB if the installer prunes it. `lit --version` reports 2.0.0 on 2.15.1 and the README's --tessdata-path flag does not exist in the Node CLI.

9. Office files are not covered on bundled Node: liteparse shells out to LibreOffice for DOCX/XLSX/PPTX. The keyless MinerU endpoint accepts Docx/PPTx/Xlsx, which makes it the no-install route for those too.

Reachability, stated separately: everything above was run through this machine's proxy (HTTP proxy on 127.0.0.1:7890 with fake-IP addresses), so I verified only that the endpoints are alive. My judgement for a mainland user without a proxy: npm via registry.npmmirror.com (where I actually pulled liteparse and its win32/darwin binaries), static.cninfo.com.cn, mineru.net, Aliyun OSS and the openxlab CDN are mainland-hosted and should work; the GitHub tessdata download, PyPI without a mirror, and Hugging Face (Docling models, MinerU 'auto' source) should be assumed unreliable.

Not done: MinerU and Docling were not run locally (the machine's disk filled during the MinerU install; I removed what I had downloaded). Evidence files are in <scratch> (m_text.txt, m_md.md, mineru_bs.md, mineru_full.md, mk_out.md, p57_ocr.txt).
BEST PICKS: 1. @llamaindex/liteparse as the default "read a filing / paper PDF" path, shipped in the installer. Bundle dist/ JS plus the one platform package (win32-x64-msvc, darwin-arm64, darwin-x64; about 26 MB each, Node >=18, no key). Wrap it as one MyWork tool: always --no-ocr; filings -> per-page text from the JSON/library output with page headers written into the teammate's folder; papers -> markdown; then search and read by page range. Measured: 143-page Chinese annual report in 0.41 s with correct Chinese text and correctly aligned statement tables. Keep @llamaindex/liteparse-wasm (5.5 MB, 5.3 s on the same file) as the fallback when a native binary will not load.

2. MinerU's keyless Agent API (https://mineru.net/api/v1/agent/parse/url and /parse/file) as the optional heavy path with zero install. Call it only for pages liteparse cannot serve — pages with no text layer (scans), statements where real table cells are needed, papers where formulas matter, and DOCX/PPTX/XLSX — in slices of at most 20 pages via page_range, and normalise spaces inside numbers. It needs no Python and no key; the user must accept that the document is uploaded. Handle the currently expired certificate on the result CDN explicitly, and offer the token API (1000 priority pages per day per account) as an optional user setting for heavy users.

3. MinerU local (pip, basic tier on CPU: Python 3.10-3.14, about 220-310 MB of packages plus 0.8 GB of models from ModelScope) as the one-click "keep it on my machine" heavy option for users with confidential scanned documents. Offer it later, behind an explicit install step; its local speed is still unmeasured.

Skip MarkItDown and Docling for this job: both need Python, MarkItDown is slower and worse than liteparse on PDFs, and Docling duplicates MinerU with a model source that is hard to reach from the mainland. Borrow the reading discipline from the liteparse agent skill (parse once to a file, then bounded search) but reimplement its helper in Node.
ITEMS:
- [ship-in-installer] run-llama/liteparse — npm @llamaindex/liteparse (native Node CLI + lib | runtime: Node >=18.0.0 (engines.node exactly ">=18.0.0"); ran here on Node v23.9.0 darwin-arm64. One prebuilt napi .nod | access: No key, no login, free. Installed from registry.npmmirror.com (this machine's configured registry) in 9 s.
    * CORRECTED: Bundled Tesseract OCR -> The Tesseract engine is compiled in, but the language data is NOT bundled: it is downloaded from github.com on first OCR, default language is eng, and OCR is ON by default. For MyWork: pass --no-ocr by default; if OCR is wanted, ship eng + chi_sim traineddata 
    * CORRECTED: engines.node and package size -> The main package ships a stray Linux binary: 33 of its 34 MB are useless on Windows/macOS. Real need per platform is about 0.5 MB JS + about 26 MB platform package; prune the two Linux files when bundling.
    * CORRECTED: Chinese listed-company PDF parses with usable Chinese text, tables and page numbers -> Chinese text is clean in every mode. Tables: text (layout grid) mode is correct for all tables I checked including the balance sheet and shareholder table; markdown mode is good for simple ruled tables and for papers but loses the values of the primary financi
    * REFUTED: `lit is-complex` can route documents (needs OCR or not) -> The sparse-text heuristic is tuned for Latin text and misfires on Chinese pages. Do not use is-complex to decide OCR for Chinese filings; decide by 'page text length is zero or near zero' instead.
- [ship-in-installer] @llamaindex/liteparse-wasm (platform-independent build of the same par | runtime: Node >=18 (engines) — ran on Node v23.9.0 as ESM; needs init({module_or_path: wasmBytes}) because the default  | access: No key. npm, 5.6 MB unpacked.
- [direct-endpoint] MinerU hosted 'Agent 轻量解析 API' (mineru.net, keyless) | runtime: none (HTTP only; three calls from Node fetch) | access: No token, no login. Limits from https://mineru.net/apiManage/docs: file ≤ 10 MB, ≤ 20 pages per task (use page_range on longer files), single file, Markdown only, '每 IP 每分钟提交请求数有限制' -> HTTP 429 (numbe
    * CORRECTED: Hosted output can be used as-is for numbers -> The keyless tier re-reads the page with OCR instead of the text layer, so numbers come back with stray spaces (digits were right in every row I compared). Strip whitespace inside numeric cells, and for born-digital PDFs prefer liteparse's digits and MinerU's t
    * CORRECTED: Result download works -> As of today the markdown_url host has an expired TLS certificate. The integration must surface this clearly (or tolerate it for this one host) instead of reporting 'parse failed'.
- [user-key] MinerU hosted '精准解析 API' (token) | runtime: none (HTTP with a static 'Authorization: Bearer <token>' header) | access: User must register at mineru.net and create a token in the API management page. Docs text: '单个文件大小不能超过 200MB,文件页数不超出 200 页' and '每个账号每天享有 1000 页最高优先级解析额度，超过 1000 页的部分优先级降低'. No price is listed on the 
- [one-click-install] opendatalab/MinerU local install (Python package mineru 4.0.10) | runtime: Python >=3.10,<3.15 (not bundled in MyWork). Base install resolves to 112 packages / about 218 MB of wheels on | access: No key for local use. Models from Hugging Face or ModelScope; `MINERU_MODEL_SOURCE=modelscope` selects the mainland source ('auto' probes Hugging Face first).
- [skip] microsoft/markitdown | runtime: Python >=3.10,<3.15; venv with markitdown[pdf] was 174 MB. | access: No key (Azure Document Intelligence / Content Understanding extras are optional and need Azure keys).
- [skip] docling-project/docling | runtime: Python >=3.10. `pip install docling` = docling-slim[standard], which pulls torch, torchvision, accelerate, doc | access: No key. Layout/table models download from Hugging Face at first run (judgement: blocked from mainland without a mirror).
- [borrow-format] run-llama/llamaparse-agent-skills — skills/liteparse/SKILL.md | runtime: Markdown; its helper scripts/search.py needs uv and Python >=3.13 (bm25s), and its examples use grep/sed/head. | access: none

===== aggregators
SURPRISES: 1) The hosted newsnow endpoint is not a plain keyless GET: Cloudflare returns 403 to curl, Node fetch, Python requests and any custom UA; only a 'Mozilla/5.0...' User-Agent passes. Any MyWork HTTP source reader must send a browser UA or it will look dead.

2) The hosted newsnow is too stale for a finance wire: 30-minute TTL, and the `latest` flag only works for GitHub-logged-in users. Measured: 财联社电报 newest item 35 min old on the hosted instance while cls.cn itself had an item under 2 min old. Five sources (36kr x2, bilibili hot-video and ranking, kuaishou) are switched off there; all five worked on my local build.

3) TrendRadar is not a second collector — its hot lists are the same newsnow public instance (hard-coded default URL). newsnow-mcp-server is too. So three of the four targets collapse onto one person's Cloudflare site, whose README now says the current version no longer accepts contributions (NewsNext is coming). TrendRadar's own docs (2026-09-15) already tell users to self-host NewsNow. Design consequence: MyWork should own the fetch layer (bundled newsnow build and/or direct publisher endpoints) and treat newsnow.busiyi.world as a fallback, not the foundation.

4) The publishers' own wire endpoints are open and richer than any aggregator: cls (signed, with A/B/C importance level, linked stocks and sectors, full text), jin10 flash_newest.js (important flag), wallstreetcn lives (score, channels, symbols), gelonghui live, eastmoney 7x24, sina 7x24 — all answered 200 keyless. For the finance edition these fields (importance, tickers) are exactly what a 情报库 row wants, and aggregators discard them.

5) RSSHub: `npx rsshub` does not exist (no bin; it is a library), a plain `npm i rsshub` is broken today (every request throws 'No headers based on this input can be generated' until caniuse-lite is pinned to the lockfile version), it weighs 396 MB, and the public rsshub.app returns 403. It does run in-process on the bundled Node 24.21 once pinned (init ~1-3 s, ~250-320 MB RAM).

6) 公众号 through RSSHub is dead in practice (6 of 6 keyless routes failed; the one that answered was two years stale). Twitter needs the user's auth_token. These two must go through the user's own logged-in Chrome, not through any collector here. 即刻 and 小宇宙 (per-podcast) work keyless via RSSHub.

7) Network position matters in both directions, and I could not test mainland directly: even `curl --noproxy '*'` on this machine exits in Los Angeles (TUN mode), so everything above proves ALIVE, not mainland-reachable. My judgement: Chinese publisher endpoints work best from a mainland IP with the proxy off — zhihu's hot list returned 403 from the US exit in three independent tools (local newsnow, RSSHub, mcp-trends-hub) while the hosted newsnow served it. Overseas AI sources (anthropic.com, openai.com, HN, GitHub trending, Hugging Face) will not load from mainland without a proxy whatever the collector; the hosted newsnow acts as an overseas relay for hackernews / github / producthunt, which is its one irreplaceable use for the AI edition. A local collector therefore needs per-source routing: Chinese sources direct, overseas sources via the user's proxy or an overseas relay (the owner already runs a Cloudflare worker).

8) Runtime facts: MyWork's bundled Node is 24.21.0, which satisfies RSSHub (^22.22.2 || ^24.15.0) and runs mcp-trends-hub and the newsnow build; newsnow's better-sqlite3 must be compiled for that Node ABI or caching silently turns off. TrendRadar's MCP server takes 27-41 s to initialise over stdio.

9) Housekeeping: test artefacts (2.4 GB of node_modules, pnpm store, venv) are left in <scratch> and can be deleted; no servers are running and the git working tree is unchanged.
BEST PICKS: Day-one collector for Chinese hot lists and finance wires: the newsnow JSON contract, fetched by MyWork itself.

1) newsnow, self-built and shipped in the installer (8.3 MB Nitro server, starts in <1 s on the bundled Node 24.21, no key, 52 sources, `/api/s?id=<id>&latest` on localhost). It runs from the user's mainland IP, restores the five sources the hosted instance disables, and refreshes every 2-10 min instead of 30. Keep https://newsnow.busiyi.world/api/s (with a Mozilla User-Agent) as fallback and as the overseas relay for hackernews / github-trending-today / producthunt. Day-one ids — finance: cls-telegraph, cls-hot, cls-depth, jin10, wallstreetcn-quick, wallstreetcn-hot, xueqiu-hotstock, gelonghui, mktnews-flash; AI: hackernews, github-trending-today, producthunt, aihot, juejin, v2ex-share, ithome, 36kr-quick; general: weibo, zhihu, baidu, toutiao, thepaper, douyin. Needs: better-sqlite3 prebuilt for Node 24 per platform.

2) Direct publisher endpoints for the finance wires (cls signed roll list, jin10 flash_newest.js, wallstreetcn lives, gelonghui live, eastmoney and sina 7x24). A few dozen lines each, no dependency, and they carry the importance grade, tickers, sectors and full text that the finance teammate should write into 情报库.csv. This is what makes the finance edition better than a hot-list reader.

3) RSSHub as an optional one-click 'more sources' pack, used as an in-process library with pinned dependencies and CHROMIUM_EXECUTABLE_PATH set to MyWork's Chrome: Anthropic / OpenAI / Claude Code changelog / HF daily papers / DeepMind / Qwen for the AI edition (through the user's proxy), 即刻 and 小宇宙 feeds, 雪球 user feeds, 同花顺 / 第一财经 / 富途 wires for finance.

From TrendRadar take the formats, not the code: frequency_words syntax (+must, !exclude, /regex/, group alias, @cap), the plain-language interests file with priority order and a 0.7 score threshold, the 0.6 rank / 0.3 frequency / 0.1 hotness weight, the daily / current / incremental push modes, and the first-seen / last-seen / crawl-count / rank-history columns. mcp-trends-hub is only a fallback for general hot lists.
ITEMS:
- [direct-endpoint] newsnow hosted endpoint — https://newsnow.busiyi.world/api/s?id=<sourc | runtime: None (HTTP GET). Optional MCP wrapper newsnow-mcp-server runs on Node via npx. | access: No key, no login for reads. Must send a browser-like User-Agent. Free; no documented quota; GitHub login (optional) only unlocks forced refresh.
    * CORRECTED: Keyless JSON endpoint per source at https://newsnow.busiyi.world/api/s?id=<source> -> Keyless, but only with a browser-like User-Agent (anything starting 'Mozilla/5.0' passed). Default curl / Node fetch / Python requests UAs are blocked by Cloudflare with 403. Response shape: {status:'success'|'cache', id, updatedTime(ms), items:[{id,title,url,
    * CORRECTED: Source ids hackernews, github-trending, cls, jin10, wallstreetcn, xueqiu, gelonghui (plus two more) work -> `github-trending` is not a valid id; use `github` (alias) or `github-trending-today` (15 items, stars in extra.info, description in extra.hover). cls / wallstreetcn / xueqiu are aliases for cls-telegraph / wallstreetcn-quick / xueqiu-hotstock.
    * CORRECTED: Project is actively maintained -> Alive and patched as of 2026-09-16, but the current codebase is frozen to outside contributions and a successor (NewsNext) is announced; the hosted instance's future shape is unknown.
- [ship-in-installer] newsnow self-hosted build (same repo, run locally or on the owner's Cl | runtime: Node >= 20 (verified 23.9 and 24.21.0); pnpm only at build time; or Docker; or Cloudflare Pages + D1. | access: No key. PRODUCTHUNT_API_TOKEN only for the producthunt source. Free.
    * CORRECTED: The built server runs on MyWork's bundled Node -> It runs on bundled Node 24.21.0, but better-sqlite3 must be built against the bundled Node's ABI (build with Node 24, per platform: win-x64 and mac-arm64) or run with ENABLE_CACHE=false. With login unconfigured, `&latest` does force a refetch after the per-sou
- [direct-endpoint] Upstream finance wire endpoints (found while reading newsnow/RSSHub ge | runtime: None beyond HTTP (bundled Node fetch). | access: No key, no login. Browser UA; cls needs the md5(sha1()) sign and a Referer; xueqiu needs the cookie handshake.
- [one-click-install] DIYgod/RSSHub (46,410 stars, pushed 2026-10-04; npm rsshub@1.0.0-maste | runtime: Node ^22.22.2 || ^24.15.0 (bundled 24.21.0 qualifies); optional Chromium for browser routes; or Docker. | access: No key for most routes. Per-route secrets when wanted: GITHUB_ACCESS_TOKEN (github trending), TWITTER_AUTH_TOKEN, XUEQIU_COOKIES, ZHIHU_COOKIES, WEIBO_COOKIES (optional), NEWRANK_COOKIE, YOUTUBE_KEY (
    * REFUTED: `npx rsshub` starts RSSHub -> The npm package is a library: `import { init, request } from 'rsshub'`; `await init({...config}); const feed = await request('/cls/telegraph')` returns a JS object {title, link, item:[{title, description, pubDate, link, category...}]}. No HTTP server from npm.
    * CORRECTED: A quick local install works; startup time and memory -> Installable in under 2 minutes and fast to start, but a plain `npm i rsshub` is broken today through dependency drift; it must be shipped with pinned dependencies (lockfile or overrides). Footprint ~400 MB on disk, ~250-320 MB RAM.
    * CORRECTED: 公众号, 即刻, 小宇宙, twitter routes and which need cookies -> 即刻 and 小宇宙 per-podcast feeds work keyless. Twitter needs the user's auth_token cookie. 公众号 is effectively not available through RSSHub today. 雪球/微博热搜 need a Chromium path, which MyWork can supply from its bundled Chrome.
    * REFUTED: The public instance can be used instead of running it -> curl with Mozilla UA: https://rsshub.app/cls/telegraph, /anthropic/news, /jin10 all HTTP 403 (Cloudflare). Community mirrors tried: rsshub.rssforever.com 503, rsshub.pseudoyu.com and rss.shab.fun no connection.
- [borrow-format] sansan0/TrendRadar (62,670 stars, v6.10.0, MCP server 4.1.0 / reports  | runtime: Python >= 3.12 via uv, or Docker. | access: No key for crawl + keyword filter. AI filter / analysis / translation need a model key (default model string deepseek/deepseek-v4-flash, so the user's DeepSeek key fits). Push channels need webhooks.
    * CORRECTED: It is a collector in its own right -> For hot lists it is a client of the newsnow public instance (configurable api_url) plus a plain RSS fetcher. It adds storage, filtering, scoring, reports and push — not sources. It stores only title/url/rank/crawl time: pubDate and body text from the wires are
    * CORRECTED: A MyWork teammate could simply run it as its collector -> Technically yes as a one-click Python add-on, but it buys no sources. Take its formats and rules instead.
- [ship-in-installer] baranwang/mcp-trends-hub (269 stars, npm mcp-trends-hub@1.7.0, last pu | runtime: Node (README says 22+; verified 23.9 and 24.21.0), started with npx or by bundling dist/index.cjs. | access: No key, no login. Free.
    * CORRECTED: Requires Node 22+ -> Node 22+ is a README statement, not enforced; verified working on 23.9 and on MyWork's bundled 24.21.0.
    * REFUTED: It covers the finance wires -> General/tech hot lists only. Four tools are overseas sites (BBC, NYT, The Verge, 9to5Mac) that a mainland machine cannot reach without a proxy.
    * CORRECTED: Output is usable as-is by a model -> Usable only with TRENDS_HUB_HIDDEN_FIELDS set; unfiltered calls can dump 50-130 KB into the context.

===== ai-skill-dropins
SURPRISES: 1. Mainland reachability could not be tested at all from this machine: even with `curl --noproxy '*'` the exit IP is Los Angeles (zenlayer; system-level tunnel). Every "works" above means "alive through a proxy"; mainland statements are my judgement.

2. hf-mirror.com does not mirror the Hugging Face papers API: /api/daily_papers and /papers/<id>.md return 308 to huggingface.co. So the HF papers skill, dailypaper-skills' HF feed and news-aggregator's HF source all need a proxy. Mainland-safe paper inputs are the arXiv API / arxiv.org/html and AIHOT `category=paper`.

3. last30days cannot be dropped in as a skill: SKILL.md is 260KB (~65k tokens). Its engine is separable (Python >=3.12, zero pip deps, `--emit json`), but keyless it only delivers HN + Polymarket + GitHub; Reddit returned 403, X needs cookies or a key, YouTube needs yt-dlp — and all of those are blocked in mainland anyway. Its doctor still lists Reddit as WORKING.

4. Node 24 runs TypeScript skills directly. baoyu-youtube-transcript and ai-daily-digest both ran with plain `node file.ts` on Node 24.18, no bun, no npm install. Limits: `import.meta.main` needs Node >=24.2 (silent no-op on 23.9), and baoyu-url-to-markdown fails on Node (extensionless imports) and needs bun + 54MB of packages.

5. Python is the real gap. Six targets need it (last30days >=3.12; tech-news-digest, dailypaper-skills and hermes watchers are stdlib-only and ran on macOS system Python 3.9; news-aggregator and evil-read-arxiv need pip packages). Windows has no system Python, so the product needs either a bundled `uv` binary or Node ports of the stdlib fetchers (RSS, arXiv, GitHub releases, watermark dedupe — a few hundred lines).

6. YouTube transcripts are no longer keyless in practice: track listing works, but the transcript body came back empty and only the yt-dlp fallback succeeded. The 播客视频 teammate needs a yt-dlp binary shipped or downloaded, plus the user's proxy.

7. Silent empties are everywhere: tech-news-digest reports Twitter/Reddit/Web as "ok, 0 items" without keys; news-aggregator swallows exceptions (HN and 36Kr returned nothing, no error); last30days doctor over-reports. 信源表.csv needs last_ok / last_count / last_error columns and the Hermes rule "a source failure is unknown coverage, not no news".

8. AIHOT is more than the skill suggests: a full public JSON API (28 paths in openapi-v1.json, no auth) with score, category and reason per item, served via Tencent EdgeOne. Two cautions: responses carry vendor-written "回答提示" instructions that can change server-side (use the JSON API for routines), and it is a single-vendor dependency with a ~60 req/min limit.

9. dailypaper-skills' default config filters out what AI practitioners want (negative keywords include coding agent, RAG, LLM memory, GUI agent, code generation; categories lack cs.CL). It must ship with a rewritten keyword file.

10. Hermes corrections: only competitor-news-monitor is bundled; blogwatcher and watchers are optional-skills, and blogwatcher is just a wrapper for a 33-star Go binary. Not in my target list but relevant to report verification: Hermes also bundles skills/research/grounded-citations (12.7KB + a 25KB stdlib ledger script that rejects quotes not literally present in the fetched page) — I only read its header, did not run it.

11. Every deep-research and paper-notes skill assumes parallel sub-agents (hv-analysis 3, SeanEllyJames up to 7, Weizhena one per item, dailypaper Task agents, ljg-paper independent evaluator). For a single-conversation DeepSeek teammate these must become sequential passes that write intermediate files to the teammate folder.

Scratch evidence: <scratch> (src/ clones, trees/ listings, tnd-merged.json, dp-top30.json, na-out.json, out_l30.txt, aihot_*.txt, aihot_openapi.json, ytout/nn.md, u2m-out.md). No servers or processes left running.
BEST PICKS: Ranked eight to ship, with teammate mapping:
1. khazix aihot → AIHOT endpoints (direct, keyless, mainland-hosted) — 中文圈 backbone; also feeds 模型与价格 (category=ai-models), 产品与竞品 (ai-products), 论文 (paper).
2. Hermes competitor-news-monitor (4.6KB markdown) + the watchers watermark pattern ported to Node — 产品与竞品; the same tick/dedupe/stay-silent loop serves 开源 (GitHub releases) and 模型与价格 (pricing/changelog pages).
3. FeijiangHan/PaperForge SKILL_CHN.md — 论文 (deep-reading protocol, pure markdown).
4. vigorX777/ai-daily-digest — 开源 / English engineering blogs; runs on bundled Node 24 with the user's DeepSeek key.
5. draco-agent/tech-news-digest — sources.json (99 RSS + 49 GitHub repos) and scoring constants as the 信源表 seed for 模型与价格 and 开源; scripts need Python or a Node port.
6. huangkiki/dailypaper-skills fetch_and_score + enrich — 论文 daily feed (Python stdlib; rewrite keywords, drop Obsidian).
7. JimLiu baoyu-youtube-transcript — 播客视频 (Node 24 + yt-dlp binary + proxy).
8. SeanEllyJames/deep-research-skill — 深度研究, with khazix hv-analysis as its second mode and anthropics competitive-brief as the brief format for 产品与竞品.
Below the line: last30days (optional power-up needing Python 3.12 + keys + proxy), K-Dense paper-lookup (ship a trimmed arXiv/OpenAlex/S2 reference), HF papers endpoints (proxy users only), Weizhena (borrow items × fields → tables), ljg-paper (borrow the lay-reader mode), news-aggregator and evil-read-arxiv (borrow ideas), baoyu-url-to-markdown (only for X/HN adapters).

If only three things are built on:
A. AIHOT's JSON API as the first source row of every AI teammate — it works with no runtime, no key, and is the only feed I expect to work from mainland without a proxy.
B. The Hermes "watch contract" procedure plus a Node re-implementation of the watermark fetchers (RSS, GitHub, JSON), seeded with tech-news-digest's sources.json and scoring constants. This is the routine skeleton for all seven teammates and removes the Python dependency.
C. Two pure-markdown method skills: PaperForge for 论文 and SeanEllyJames deep-research for 深度研究, both rewritten for sequential single-agent passes. ai-daily-digest is the proof that single-file TypeScript on the bundled Node with the DeepSeek key is the right packaging for anything that needs code.
ITEMS:
- [one-click-install] (a) mvanhorn/last30days-skill | runtime: Python >=3.12 stdlib only (refuses 3.9); node for vendored X client; optional yt-dlp, gh. Skill dir 2.9MB code | access: No key for HN/Polymarket/GitHub (GitHub unauthenticated tier). X: browser cookies or XAI/X bearer/xquik key. Web: BRAVE/SERPER/EXA/PARALLEL/PERPLEXITY key. TikTok/IG etc.: ScrapeCreators key. No accou
    * CORRECTED: Python via uv -> uv is not required; the hard requirement is a Python >=3.12 interpreter with zero pip packages. frontmatter bins also lists node (vendored bird-search .mjs for X).
    * CORRECTED: Reddit / X / YouTube / HN / Polymarket last-30-days research -> Keyless it really delivers only HN + Polymarket + GitHub. Reddit keyless returned 403 from this IP; X needs browser cookies (AUTH_TOKEN/CT0) or a paid key; YouTube needs yt-dlp; web search needs BRAVE/SERPER/etc. or the host's own search.
    * CORRECTED: doctor -> doctor exists but over-reports: it reports configuration state, not live success.
    * REFUTED: Usable as a drop-in SKILL.md -> Only the engine is usable: call `last30days.py <topic> --emit json|compact` behind a short MyWork-written skill. JSON keys: clusters, freshness_verdicts, generated_at, query, results, schema_version, source_status, window_days (4.8KB for the quick run).
- [one-click-install] (b) draco-agent/tech-news-digest | runtime: Python 3.8+ standard library (requirements.txt: feedparser and jsonschema optional; falls back to regex XML pa | access: None for RSS/GitHub/Trending (GitHub unauthenticated 60 req/h). Optional: X_BEARER_TOKEN or TWITTERAPI_IO_KEY, TAVILY/BRAVE key, Reddit OAuth app, GITHUB_TOKEN.
    * CORRECTED: 216 sources config -> 216 is the enabled count out of 237; 76 of them are X accounts that need a paid X backend and 13 are Reddit, so the keyless usable set is ~99 RSS + 49 GitHub repos + GitHub Trending.
- [borrow-format] (c) cclank/news-aggregator-skill | runtime: Python 3 + requests + beautifulsoup4; Playwright/chromium for 2 sources. SKILL.md 9.1KB (~3k tokens). | access: No key.
    * CORRECTED: Works today -> About 12 of 18 tested sources returned data; failures are silent. HF Papers and Ben's Bites need Playwright + chromium.
- [one-click-install] (d) huangkiki/dailypaper-skills | runtime: Python 3.9+ stdlib; curl; optional pdftotext (poppler). Hard-coded /tmp/daily_papers_*.json paths (breaks on W | access: No key.
    * REFUTED: Fits AI practitioners out of the box -> Defaults are tuned for robotics/vision and actively filter out LLM-agent topics; the keyword config must be rewritten (add cs.CL).
- [borrow-format] (e) juliye2025/evil-read-arxiv | runtime: Python + PyYAML + requests (+ PyMuPDF for figure extraction, arxiv, pymed). | access: No key; optional semantic_scholar_api_key (keyless is rate-limited, 429 seen).
- [ship-in-installer] (f1) FeijiangHan/PaperForge | runtime: None (pure markdown). | access: None.
- [borrow-format] (f2) lijigang/ljg-skills — ljg-paper | runtime: Markdown + bun for the validator; Emacs/Denote assumed. | access: None.
    * CORRECTED: paper reading prompts -> More than prompts: it mandates an Org-mode note saved to ~/Context/ with Denote filenames, a bun validator, 'real Emacs' org-lint checks, and an independent fresh-context reader evaluation.
- [direct-endpoint] (g1) huggingface/skills — huggingface-papers | runtime: None (curl). | access: None for reads.
    * REFUTED: Usable from mainland via hf-mirror -> hf-mirror does not mirror the papers API or paper pages; they need huggingface.co itself, which mainland users can only reach through a proxy.
- [ship-in-installer] (g2) K-Dense-AI/scientific-agent-skills — paper-lookup | runtime: curl; scripts Python 3.11+ stdlib (optional). | access: None; optional NCBI/S2/CORE/OpenAlex keys raise limits.
- [ship-in-installer] (h1) NousResearch/hermes-agent — competitor-news-monitor | runtime: None (pure markdown). | access: None.
- [borrow-format] (h2) NousResearch/hermes-agent — blogwatcher and watchers | runtime: watchers: Python 3 stdlib. blogwatcher: Go binary download. | access: None (GitHub 60 req/h anonymous; GITHUB_TOKEN optional).
    * CORRECTED: bundled skills blogwatcher / watchers -> Both live in optional-skills, not the bundled skills/ tree, and blogwatcher is only a wrapper around a third-party Go binary.
- [ship-in-installer] (i) anthropics/knowledge-work-plugins — competitive-brief | runtime: None (pure markdown). | access: None.
- [one-click-install] (j1) JimLiu/baoyu-skills — baoyu-youtube-transcript | runtime: Node >=24.2 or bun; zero npm deps; yt-dlp needed in practice. | access: No key. Optional YOUTUBE_TRANSCRIPT_COOKIES_FROM_BROWSER for yt-dlp.
    * CORRECTED: youtube-transcript skill, no API key or browser -> The direct InnerTube path can list tracks but returned no transcript text today; in practice it needs yt-dlp (a standalone binary or uv+Python).
    * CORRECTED: Needs bun -> Runs directly on Node >=24.2 via built-in type stripping; bun is optional.
- [one-click-install] (j2) JimLiu/baoyu-skills — baoyu-url-to-markdown | runtime: bun required (wrapper is `exec bun`); 54MB npm deps; a local Chrome. | access: None; X adapter uses a logged-in Chrome profile; `--cdp-url` can reuse an existing Chrome.
- [direct-endpoint] (k1) KKKKhazix/khazix-skills — aihot | runtime: None (curl / any HTTP GET). | access: No key, no login; ~60 requests/min/IP.
- [ship-in-installer] (k2) KKKKhazix/khazix-skills — hv-analysis | runtime: Markdown method; PDF step needs Python + weasyprint (pango/cairo system libs). | access: None.
- [borrow-format] (l1) Weizhena/Deep-Research-skills | runtime: Markdown + Python/PyYAML validator; Claude Code Task tool and custom agent definition. | access: None.
- [ship-in-installer] (l2) SeanEllyJames/deep-research-skill | runtime: None (pure markdown). | access: None; recommends a search tool (Tavily-class) the product must supply.
    * CORRECTED: deep research skill, plug-and-play single file -> Not a valid Agent Skill as-is: name/description frontmatter must be added. It also assumes up to 7 parallel sub-agents on a cheaper model and a search MCP such as Tavily with WebSearch/WebFetch fallback.
- [ship-in-installer] (m) vigorX777/ai-daily-digest | runtime: Node >=23.6 / 24 (type stripping) or bun; zero dependencies. | access: Needs an LLM key: the user's DeepSeek key via OPENAI_API_KEY + OPENAI_API_BASE (+ OPENAI_MODEL), or a Gemini key (Google endpoint is blocked in mainland).
    * CORRECTED: single TS file via bun -> bun is not needed; it runs on the bundled Node 24 as-is.
    * CORRECTED: Works today -> Feed fetching verified (85 feeds answered); the LLM scoring path with a DeepSeek key is supported in code but not exercised here (no key used). Repo has been idle for ~8 months.

===== python-bootstrap
SURPRISES: 1. Python download source changed: uv 0.12.23 pulls CPython from releases.astral.sh first and only falls back to GitHub when no mirror is set. Setting UV_PYTHON_INSTALL_MIRROR turns the fallback off (read in source), so MyWork has to try mirrors in order itself.

2. The mirror hint in the brief is wrong for Python builds: Tsinghua and Aliyun return 404 for python-build-standalone. npmmirror and NJU serve it with full release history; USTC keeps only the latest release and will break a pinned uv. Tsinghua/Aliyun are right only for PyPI packages (and they also host the uv binary as a wheel).

3. Offline bootstrap is possible: UV_PYTHON_INSTALL_MIRROR=file://<dir> with UV_OFFLINE=1 installed Python in 7 s from a bundled 22-25 MB tarball.

4. First use is slow, later use is fast, and the difference is bytecode. Cold akshare was 57-83 s here (heavily loaded machine, US exit); the first import alone took 12-70 s. Warm was 0.65 s from a persistent venv and about 2 s via `uv run --with`. If the parent process exports PYTHONDONTWRITEBYTECODE=1 (this agent harness does), every import costs 6-10 s. The product needs a visible one-time "preparing" step, a pre-warm import, and a scrubbed child environment. UV_COMPILE_BYTECODE=1 is the documented way to move compilation to install time; I did not time it.

5. The uv cache is tied to the index URL: an offline run with a different default index could not find akshare. Pick one PyPI mirror and keep it.

6. Defaults leak: without UV_PYTHON_INSTALL_BIN=0 uv drops python3.12 into ~/.local/bin (another app on this machine did exactly that), on Windows it registers Python in HKCU, and without UV_MANAGED_PYTHON=1 uv will happily use the user's Homebrew/conda Python.

7. `npx skills add` needs git for almost every repo, and its git-free path depends on raw.githubusercontent.com, which failed from 3 of 4 mainland probes. Finance users on Windows will not have git. skills.sh has a keyless JSON endpoint that returns whole skills and answered from all mainland probes.

8. Skills themselves need Python: the anthropics pdf skill ships 8 Python scripts. So a managed Python is needed for the skill ecosystem, not just for finance data.

9. Windows: uv binaries are signed since 0.12.12, but python.exe from python-build-standalone is not, and another agent app that bundles uv had uv.exe quarantined. Long-path support in both binaries only works when the OS policy is enabled, so the app root must be short. None of the Windows behavior was run here.

10. Mainland reachability was measured from 4 cloud-datacenter probes via Globalping (HEAD requests), not from this machine, whose traffic exits in Los Angeles even without the proxy variable. Home-broadband throughput is not verified.
BEST PICKS: Recommendation: bundle uv in the installer and keep Python itself as a managed, app-owned runtime. Do not stay Node-only.

1. uv binary, bundled. Cost: about 18 MB on win-x64 (zip; 40 MB unpacked), 17 MB on mac-arm64 (36 MB unpacked), 21 MB on mac-x64 (50 MB unpacked). Pin one version (0.12.23 tested; at least 0.12.12 for signed Windows binaries).

2. Managed CPython 3.12 through uv. For the finance product, also bundle the python-build-standalone tarball (+22 MB win-x64, +25 MB mac) and install it offline with a file:// mirror, so the only network step is PyPI packages from a domestic mirror. For the AI-practitioner product, downloading on first need from npmmirror (NJU as fallback, then no mirror) is enough. Budget for a finance teammate: about 87-89 MB of downloads if nothing is bundled, about 270 MB on disk (uv 36-50, Python 63-66, akshare env about 165), first run about 1 minute, later calls under 2 s. Use one shared venv per toolkit under the app directory (uv venv + uv pip install, then call its python directly) rather than a venv inside each teammate folder; use uvx for Python MCP servers.

3. skills.sh download endpoint plus the .agents/skills/<name>/ layout for installing skills into a teammate's folder, with the codeload tar.gz as fallback, instead of shelling out to `npx skills add`.

Environment MyWork should set for every uv / python child process (ROOT = a short ASCII path on the same drive as the environments, e.g. %LOCALAPPDATA%\MyWork\py):
UV_PYTHON_INSTALL_DIR=ROOT/python
UV_CACHE_DIR=ROOT/cache
UV_TOOL_DIR=ROOT/tools
UV_TOOL_BIN_DIR=ROOT/bin
UV_PYTHON_BIN_DIR=ROOT/bin
UV_PYTHON_INSTALL_BIN=0
UV_PYTHON_INSTALL_REGISTRY=0
UV_MANAGED_PYTHON=1
UV_PYTHON=3.12
UV_NO_CONFIG=1
UV_PYTHON_INSTALL_MIRROR=https://registry.npmmirror.com/-/binary/python-build-standalone (fallback https://mirror.nju.edu.cn/github-release/astral-sh/python-build-standalone; or file://<resources>/pbs when the tarball is bundled)
UV_DEFAULT_INDEX=https://mirrors.aliyun.com/pypi/simple/ (alternative https://pypi.tuna.tsinghua.edu.cn/simple; choose one and do not switch)
UV_HTTP_TIMEOUT=120 (default read timeout is 30 s)
UV_NO_PROGRESS=1
UV_COMPILE_BYTECODE=1 (documented; not timed here)
Leave UV_LINK_MODE unset. Remove from the child environment: PYTHONDONTWRITEBYTECODE, PYTHONPATH, PYTHONHOME, VIRTUAL_ENV, CONDA_PREFIX. If the skills CLI is ever invoked: DISABLE_TELEMETRY=1.

Before shipping, test on a real Windows machine: a non-ASCII user name, 360/Huorong/Defender installed, and LongPathsEnabled off. The temp directory used for these experiments has been emptied.
ITEMS:
- [ship-in-installer] astral-sh/uv release binary (bundle size per platform) | runtime: None (static native binary). macOS 11+; Windows x64 Tier 1. | access: No key, no login, free.
    * CORRECTED: uv Windows binaries are unsigned and get flagged by antivirus -> Signed since 0.12.12. AV/EDR false positives and file-lock failures are still an open upstream topic.
- [one-click-install] uv python install 3.12 (managed CPython) and mainland mirrors for pyth | runtime: uv binary only. | access: No key, free. Mainland source: npmmirror (primary) and NJU (fallback); default releases.astral.sh also answered from CN probes.
    * CORRECTED: `uv python install 3.12` downloads CPython from GitHub (astral-sh/python-build-standalone) -> uv 0.12.23 tries https://releases.astral.sh/github/python-build-standalone/releases/download/... first and falls back to github.com only when no mirror is configured. New variable UV_ASTRAL_MIRROR_URL (added 0.11.14) replaces that base.
    * CORRECTED: UV_PYTHON_INSTALL_MIRROR can point at a Tsinghua or Aliyun mirror for mainland users -> Tsinghua, Aliyun, BFSU and SJTU do not serve python-build-standalone (404), Huawei returns 401. Working: https://registry.npmmirror.com/-/binary/python-build-standalone (redirects to cdn.npmmirror.com, 122 release dirs back to 2018) and https://mirror.nju.edu.
- [one-click-install] PyPI mirrors with UV_DEFAULT_INDEX and akshare cold start (`uv run --w | runtime: uv + managed Python 3.12. numpy 2.5.3 already requires Python >=3.12, so do not pin lower. | access: No key. Free public mirrors.
    * CORRECTED: Every warm start is fast -> Only if bytecode caching is allowed. With PYTHONDONTWRITEBYTECODE=1 inherited from the parent process, no .pyc was written and every `import akshare` cost 6-10 s. The first import after a fresh install took 12-70 s here (2,726 .py files to compile plus first l
    * REFUTED: The cache survives switching the index mirror -> With the cache filled via Tsinghua, running UV_OFFLINE=1 without the same UV_DEFAULT_INDEX failed: 'akshare was not found in the cache'. With the same index set, offline worked.
- [ship-in-installer] Single app-owned directory (nothing touches the user's system Python) | runtime: uv | access: None.
    * REFUTED: The defaults are already isolated -> Help text: 'By default, Python executables are added to a directory on the path' (~/.local/bin) and on Windows the install is registered in the registry; disable with UV_PYTHON_INSTALL_BIN=0 and UV_PYTHON_INSTALL_REGISTRY=0. On this very machine another app le
- [one-click-install] Windows specifics (long paths, antivirus, no admin) | runtime: Windows x64 (Tier 1). Windows arm64 is Tier 2. | access: None.
    * REFUTED: Antivirus is not a problem -> uv #20792 (open): maintainers attribute failures to AV/EDR vendors holding exclusive locks; #17679 (open, 2026-01) 'failed to rename file ... os error 5'; #15011 Defender removed uvw.exe; hermes-agent #48411 uv.exe quarantined inside another agent app. Chinese
- [borrow-format] npx skills add (vercel-labs/skills CLI) | runtime: Node >=22.20.0; git on PATH for most GitHub sources. | access: No key. Sends telemetry to add-skill.vercel.sh unless DISABLE_TELEMETRY=1.
    * CORRECTED: It can install a skill into an arbitrary directory such as a teammate's folder -> There is no --dir option. Project scope installs relative to the current working directory (./.agents/skills/<name> for the universal agent, ./.claude/skills/<name> for claude-code) and writes ./skills-lock.json; -g installs under the home directory. So run it
    * REFUTED: It does not need git -> With git and gh removed from PATH the same command failed: 'Failed to clone https://github.com/vercel-labs/agent-skills.git: Error: spawn git ENOENT' (same for anthropics/skills). src/add.ts limits the git-free 'blob' path to owners ['vercel','vercel-labs','he
- [direct-endpoint] skills.sh download API (git-free skill snapshots) | runtime: None (HTTP GET). | access: Keyless. No documented quota seen; it is an undocumented endpoint used by the CLI.

```
