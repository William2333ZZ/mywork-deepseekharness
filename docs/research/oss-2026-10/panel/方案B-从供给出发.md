## 1. 两个产品各是什么

两个安装包，同一份内核，换一个版本包。默认同事 MyWork 和它的标志在两边都不变，版本名只是后缀。

**MyWork · AI 版**
- 定位：给做 AI 的人配一个情报班子，每天早上交一份「昨天到现在真正变了什么」，不重复，带一手链接，写清没覆盖到哪。
- 给谁：模型和应用工程师、AI 产品经理、研究员、AI 方向的投资人和内容作者。
- 凭什么赢：
  - AIHOT、ai-news-radar、follow-builders 和公众号日报是人人一份，不认识你。我们把它们当上游，自己做一手核对和「和你有关」。
  - TrendRadar、Horizon、daily-arXiv-ai-enhanced、zotero-arxiv-daily 要自己搭 Python、Docker 或 GitHub Actions，不能对话，读不了登录态信源。我们一个安装包，改信源是说一句话。
  - 侦察确认没人做好的两件事：模型价格、榜单、更新日志的快照对比；跨来源按事件合并加事件台账。
  - X、即刻、小红书用用户自己登录的 Chrome 读（OpenCLI），中心化产品做不了。

**MyWork · 金融版**
- 定位：给做投研和交易的人配一个盯盘班子：自选股发生了什么、公告改变了什么、盘面怎么读、明天看什么。带评分、关键价位和仓位倾向，每个数字标来源，每个观点记账并到期结算。
- 给谁：买方和卖方研究员、交易员、投顾、私募、认真的个人投资者。
- 凭什么赢：
  - daily_stock_analysis（6.6 万星）证明了「自选股每日仪表盘」的需求，但要配 Python、Actions 和推送渠道，不能追问，没有记忆。我们同样的格式一键可得。
  - 厂商自己的 skill 和助手（HiThink-Tech/Financial-API、Wind-Alice/AliceMarket、东财妙想、金十 MCP）只有自家数据，问一句答一句，不会到点交东西。同花顺公开接口不含分钟线、港美股、宏观、公告和新闻正文，一份 A 股简报至少要 2–3 个连接器。我们做跨厂商分层，把来源标在每个数字后面。
  - TradingAgents 各分支、UZI-Skill、ai-berkshire 是单票一次性重分析，贵，不持续。我们借它们的角色和打分，放进持续的同事和表里。
  - 侦察确认金融领域没有开源件端到端做了「增量、去重、相对上次变了什么」。这层状态由同事的表补上。

## 2. 内核与版本包的分界

**运行时决定：Node 做核心，uv 管 Python。**
- 每个产品的第一位同事、采集器、厂商 CLI（Wind `cli.mjs`、`@hithink-tech/hithink-finance-cli`、OpenCLI、stock-sdk）和所有直连端点只用自带的 Node 24。第一份简报不依赖 Python。
- 安装包带 `uv` 单文件，不带 Python 本体。Python 3.12 和依赖在首次打开时后台拉取，走国内 PyPI 镜像，装到 `$DSH_HOME/mywork/py/default`，并加进 dsh 子进程的 PATH。
- 这样 a-stock-data、akshare、hhxg、plate-rotation 不用改就能跑；自己用 uv 起环境的 last30days、MinerU、`uvx akshare-one-mcp` 也直接可用。
- 装不上就降到 Node 层，在简报脚注写明。
- 待验证：Python 独立构建包的国内镜像。不稳的话，金融版安装包改成内置 Python 压缩包。

**内核（共用，写代码）**
- 同事引擎：对话、文件夹、例行、记忆、`deliver`、`mywork_ask`、后台核验。
- 模板装载：按模板建同事，播种表、例行和 skills。
- 采集器 `mw-collect`：读信源表，按通用方式（rss、json、md-diff、snapshot）抓取、去重、写收件箱、回写健康列。站点专用抓法不进内核。
- 例行调度：补跑、安静规则、交易日历、预检（没变化不叫醒模型）。
- 连接器框架：MCP、CLI、登录三种形状，加密钥库、额度预算和探测。
- 托管运行时：Node、uv/Python、Chrome（预载 OpenCLI 桥接扩展）。
- 覆盖与信源健康的展示、skill 锁定校验、手机中继、IM 推送。
- 默认同事 MyWork：晨报合并、建同事、带用户接连接器、每周信源体检。

**版本包（数据）**
- 清单、同事模板（职责、例行、表结构和种子行）、skills、连接器预设、信源包、交易日历、交付物格式、Python 依赖锁、首次打开脚本、网络探测表。

**分界规则**
- 版本包不含内核或插件代码。唯一可执行的是 skill 里的 `scripts/`，在同事自己的 shell 里跑，经过锁定和扫描。
- 站点专用抓法（财联社签名、金十请求头、巨潮 POST）写成第一方 skill 脚本放在包里；内核只认通用方式和 `cli`。
- 两个安装包的差异只有 `edition/` 目录、kit 成员增量和版本后缀。

## 3. 版本包长什么样

```
editions/<ai|finance>/
  edition.json
  onboarding.json
  probes.json
  mates/<slug>/mate.json · duty.md · AGENTS.md · tables/*.csv
  skills/<name>/SKILL.md · scripts/ · references/
  skills.lock.json
  connectors/<id>.json
  sources/<pack>.csv
  schemas/<表名>.schema.json
  formats/<name>.md
  python/default.lock.txt
  calendars/cn-a-2026.json
```

- **edition.json**：`id, name, version, kernelMin, firstMate, mates[{slug, default, order}], kitMembers[], python{mode: at-onboarding|on-demand, lock}, mirrors{pypi, python, githubRaw[]}, sharedTables[], houseSkills[]`
- **mate.json**：`slug, name, title, group, glyph, pinned, notify, dutyFile, first, routines[], tables[{file, schema, seed, shared}], skills[], connectors{required[], optional[]}, needsPython, verify, budget{maxItemsToModel, maxRunMinutes}`
- **routines[] 一项**：`title, input（带时间的一句话）, kind: do|remind, calendar: none|cn-a, window（如 09:15-15:00）, pre（预检命令）, staleAfterMinutes, cooldownMinutes, maxAlertsPerDay`
- **schema**：`file, key[], maintainedBy: collector|mate|user, appendOnly, columns[{name, type: text|date|datetime|number|enum|url|bool, enum, required}]`
- **connectors/<id>.json**：`id, label, shape: mcp-http|mcp-stdio|cli|login, tier, for[], endpoint{url, headerName}, cli{package, version, bin}, auth{type: none|key|qr|oauth|browser-login, portalUrl, steps[], secretName, writeTo}, probe{cmd, expect}, quota{unit, free, budgetPerDay}, tools{allow[], deny[]}, fragile: 低|中|高, cost: 免费|免费key|付费`
- **skills.lock.json 一项**：`name, upstream, commit, sha256, capabilities{shell, network, credentials, python}, patched[], scan{skillspector, agentScan}, reviewedAt`
- **onboarding.json**：`probe, question{kind, text, options}, firstMate, firstJob, backgroundJobs[], connectorChecklist[{id, gain}]`
- **probes.json**：`group（国内|海外|镜像）, url, expect, timeoutMs`

**两张通用表**（沿用开发环境里已有的列，往后加）：
- 信源表.csv：`类型, 名称, 地址或账号, 关注什么, 权重, 启用, 层级, 方式, 备用地址, 需要, 频率分钟, 上次成功, 最新条目时间, 连续失败, 失败原因, 近30天采纳数`
- 情报库.csv：`日期, 标题, 信源, 链接, 级别, 一句话, 事件ID, 首见时间, 最近报道时间, 一手链接, 信源数, 上游ID, 评分, 状态（新/跟进/已报/不报）`

**层级统一五档**：T0 一手官方；T1 用户自己 key 的授权数据；T2 聚合上游；T3 公开抓取；T4 登录态与桥接。聚合源只能提名，不能当唯一依据。金融数字优先级 T1 > T0 > T3，禁止用模型记忆补数。

## 4. 两个产品各自的同事名册

引擎同时只跑 2 位同事、单次上限 20 分钟，所以早间例行错开。下面的「预检」指脚本先跑，没变化不叫醒模型。

### AI 版（6 位，加 1 位可选）

**头条（第一位）· AI 头条编辑**
- 职责：按事件合并过去 24 小时的 AI 动态，分必读、值得看、可跳过，必读项回到一手链接核对。
- 例行：每天 08:00 早报；13:00、19:00 增量（没有必读就安静）。
- 表：信源表.csv、情报库.csv；关注表.csv（`实体, 类型, 别名, 各平台账号, 权重, 静音`）。
- 供给：KKKKhazix/AIHOT（`/api/v1/selected/changes`、`/api/v1/agent/hot`）和 khazix-skills 的 aihot skill；LearnPrompt/ai-news-radar（`latest-24h-all.json`、`stories-merged.json`、`source-status.json`）；实验室官方 RSS；Olshansk/rss-feeds；量子位、极客公园、36氪、IT之家原生 RSS；fuxiaoai/tidings-rss 与 ginobefun/BestBlogs 的 OPML；HN Algolia。
- 交付物：变化一段 → 今日看点 3–5 句 → 必读至多 3 条（结论、为什么重要、一手链接、多源 N）→ 值得看至多 8 条 → 可跳过只列标题 → 覆盖脚注。摘要行：必读 n、值得看 n、覆盖 a/b 源、时间窗。
- 为什么是第一位：零 key、零登录、零 Python，上游在国内可达，填完 DeepSeek key 几分钟内出第一份。

**价目 · 模型与价格**
- 职责：模型上新、调价、弃用、榜单名次变动。存昨天的快照，对比后回厂商页面确认再报。
- 例行：每天 09:30（预检，没变化安静）；每周一 09:40 周表。
- 表：模型台账.csv（`模型ID, 厂商, 发布日期, 上下文, 输入价, 输出价, 缓存价, 币种, 状态, 来源, 一手确认, 最近变动日期`）；变动日志.csv（`日期, 对象, 厂商, 变动前, 变动后, 快照来源, 一手链接, 已核对`）；榜单快照.csv（`日期, 榜单, 名次, 模型, 分数, 名次变化`）。
- 供给：anomalyco/models.dev 的 `api.json`（5 MB，只在脚本里对比）；OpenRouter `/api/v1/models` 和新模型 RSS；各厂商 `.md` 更新日志与定价页（Anthropic、OpenAI、Gemini、xAI、智谱、Kimi、MiniMax）；DeepSeek、阿里、火山、百度、腾讯用真实 Chrome 读页；lmarena-ai/leaderboard-dataset；SWE-bench `leaderboards.json`；Artificial Analysis（免费 key）。
- 交付物：变动表（前 → 后、幅度、一手链接）加「对你的成本意味着什么」一句。

**论文**
- 职责：按用户的方向筛新论文，前三篇写结构化笔记，自报结果要标注。
- 例行：每天 10:30（周末无新数据自动安静）；每周五 17:00 本周必读 5 篇。
- 表：方向表.csv（`方向, 关键词, 正例ID, 反例ID, 权重`）；论文库.csv（`arXivID, 版本, 标题, 机构, 提交日期, 类别, 来源, HF赞数, 评分, 级别, 代码链接, 自报结果, 笔记文件, 状态`）。
- 供给：arXiv API 和分类 RSS；papers.cool Atom；HF `/api/daily_papers`；alphaXiv 的 `/overview/{id}.md`；huggingface/skills 的 papers skill；笔记格式借 FeijiangHan/PaperForge、lijigang/ljg-skills；分级借 huangkiki/dailypaper-skills。
- 交付物：必读 / 值得看 / 可跳过清单，加笔记文件。
- 证据薄：hf-mirror 的 papers 接口，两位侦察员结论相反，要实测。

**开源**（现有「探新」加「技术雷达」的开源部分）
- 职责：新仓库、关注仓库的新版本、HN 热议。
- 例行：每天 09:00；每 2 小时查版本（预检）。
- 表：仓库表.csv（`仓库, 关注原因, 最新tag, tag日期, 星数, 周增星, 上次检查, 启用`）；情报库.csv。
- 供给：`releases.atom`；mshibanami/GitHubTrendingRSS；GitHub 搜索 API（接 token 后 5000 次/小时）；duanyytop/agents-radar 的 RSS；HN Algolia；DeepWiki MCP 用于追问。
- 交付物：新版本改了什么、新仓库值不值得看，一行一条带星数。

**圈内**
- 职责：跟人不跟号，一线 builder 和研究者昨天说了什么、哪里有分歧。
- 例行：每天 08:30；每周日 20:00 本周分歧。
- 表：人物表.csv（`人物, 身份, X, 即刻, 公众号, 播客或博客, 层级, 权重, 启用`）；言论库.csv（`条目ID, 人物, 平台, 时间, 原文链接, 要点, 类型, 互动量, 关联事件ID, 状态`）。
- 供给：zarazhangrui/follow-builders 的 `feed-x.json`、`feed-podcasts.json`（经 jsDelivr 镜像）；BestBlogs 的 X 与公众号 RSS；ttttmr/Wechat2RSS 公共源；jackwener/OpenCLI `twitter` 读登录态 X；zhengjy01/dsh-jike 扫码读即刻（0 星，先审代码）；小宇宙官方文稿；JimLiu/baoyu-skills 的 youtube-transcript。
- 交付物：按人列要点和原帖链接，加一段「分歧」。

**产品**（现有「产品雷达」）
- 职责：AI 产品发布、更新日志、定价、融资。
- 例行：每天 09:10；每周一 09:20 融资周表。
- 表：产品表.csv（`产品, 公司, 更新日志地址, 定价页地址, 方式, 上次快照哈希, 上次变动日期, 启用`）；融资表.csv（`日期, 公司, 轮次, 金额, 投资方, 赛道, 来源, 链接, 可信度`）；情报库.csv。
- 供给：Product Hunt Atom；Cursor、Windsurf、Claude Code 等更新日志；Crunchbase News AI、36氪；IT桔子用登录态读；监控契约借 NousResearch/hermes-agent 的 competitor-news-monitor。
- 交付物：产品动作一行一条；融资表。

**口碑（可选，要 Python 和登录）**
- 职责：回答「社区这 30 天怎么评价 X」；每周一 10:00 出「什么在升温」。
- 表：话题表.csv（`话题, 平台, 关键词, 上次结论, 上次日期`）。
- 供给：mvanhorn/last30days-skill；OpenCLI 读知乎、小红书、Reddit；xpzouying/xiaohongshu-mcp（扫码）；需要评论级深度时一键装 NanmiCoder/MediaCrawler，低频、建议小号。
- 交付物：带互动量的观点分布，正反各举原帖。

### 金融版（7 位）

所有同事的职责里写同一套规矩：先跑 `date` 并写数据截止时间；数字只来自工具返回；缺失写「未取得」，不写 0；每个数字带来源层级；结束状态用 Wind 的那套（DONE / DONE_WITH_LIMITS / NO_RESULTS / BLOCKED_KEY / BLOCKED_QUOTA）。

**盯盘（第一位）· 自选股管家**
- 职责：自选股过去一天的公告、快讯、研报、异动，加评分、结论、关键价位。
- 例行：交易日 08:30 盘前；交易时段每 30 分钟查异动和公告（预检，冷却 60 分钟，每天至多 6 次提醒）；交易日 18:00 仪表盘；周六 09:30 周度体检。
- 表：自选股.csv（共享；`代码, 名称, 市场, 分组, 持仓, 成本, 关注理由, 关键词, 提醒阈值, 加入日期, 启用`）；事件库.csv（`事件ID, 代码, 类型, 标题, 发生时间, 首见时间, 来源, 层级, 链接, 影响, 方向, 状态, 一句话`）；观点账本.csv（`观点ID, 日期, 同事, 标的, 方向, 评分, 关键价位, 依据, 证伪条件, 到期日, 结算价, 结果, 结算日`）。
- 供给：行情用 chengzuopeng/stock-sdk（无 key），接了 key 用 HiThink-Tech/Financial-API，装了 Python 加 simonlin1212/a-stock-data；公告用巨潮、上交所、深交所、东财公告直连端点；快讯从「快讯」的库里按代码取；格式照 ZhuLinsen/daily_stock_analysis；Wind key 用户用 AliceMarket 的 `daily_watchlist_morning_brief`、`major_announcement_impact`。
- 交付物：抬头计数 → 每票一行「结论 | 评分 | 趋势」→ 每票：重要信息速览、风险警报、利好催化、关键价位、最新动态 → 来源与截止时间。
- 为什么是第一位：任何时刻装完都能马上出（非交易日出「过去一周加下周日历」）。它是个人化的，用户手工拼不出来。

**快讯**（现有「财联社记者」扩成五家）
- 职责：五家 7×24 快讯跨社合并成事件，标红和命中关键词的优先。
- 例行：每天 07:00、13:20、21:00；交易时段每 10 分钟预检，只有标红且命中关键词才出声。
- 表：信源表.csv；情报库.csv（加列 `通讯社条目ID, 标红, 涉及标的, 涉及板块`）；关键词表.csv（`关键词, 类型, 权重, 静音`）。
- 供给：财联社 `api/cache?name=telegraph`（要算签名）、华尔街见闻 `apiv1/content/lives`、金十 `get_flash_list`（两个请求头）、东财 `getFastNewsList`、格隆汇 lives；抓法移植自 newsnext/newsnow 的 fetcher；金十官方 MCP 接了 token 后作为 T1。
- 交付物：按事件一行一条，多社链接合一，先标红。

**公告 · 公告雷达**
- 职责：自选股加全市场高信号类别（减持、回购、业绩预告、重组、问询函）。只对高信号类别读 PDF 正文。
- 例行：交易日 16:00–23:00 每 30 分钟（预检）；21:30 晚间公告汇总；07:40 隔夜补充（安静）。
- 表：公告库.csv（`公告ID, 代码, 名称, 标题, 类别, 子类, 披露时间, 首见时间, 来源, PDF链接, 页码依据, 内容哈希, 读过正文, 影响, 结论一句话, 更正替代, 状态`）。
- 供给：巨潮 `hisAnnouncement/query`（并发不超过 4）、上交所 `queryCompanyBulletinNew.do`、深交所 `annList`、东财 `np-anotice-stock`；分类用 rollysys/announcement_filter 的 11 类 82 子类；PDF 用 run-llama/liteparse，难表格装 opendatalab/MinerU；Wind `financial_docs`（有 key）。
- 交付物：新公告按影响排，每条「改变了什么」加页码和 PDF 链接。

**复盘 · 盘后复盘员**
- 职责：五分项（情绪、资金、题材、龙虎榜、龙头）加明日展望和仓位倾向。指标由脚本算，模型只解释。
- 例行：交易日 17:40；周六 10:00 周复盘。
- 表：情绪表.csv（`日期, 上涨家数, 下跌家数, 涨停, 跌停, 炸板率, 连板高度, 晋级率, 成交额, 情绪定位, 来源, 取数时间`）；梯队表.csv（`日期, 代码, 名称, 连板数, 题材, 首封时间, 次日表现`）；主线表.csv（`板块, 起始日, 持续天数, 标签, 龙头, 两源一致, 最近更新`）；龙虎榜.csv（`日期, 代码, 席位, 买入额, 卖出额, 净额, 席位标签`）。
- 供给：HiThink 的涨停、连板、龙虎榜、热榜；stock-sdk 的涨停池、龙虎榜、资金流；Python 层用 a-stock-data、Niceck/hhxg-top-hhxg-python、hssqz/plate-rotation-skill；结构照 simonlin1212/vibe-astock 和 go-stock 的五块；Wind 的 `post-market-debrief`、`sector_rotation_radar`。
- 交付物：指数与涨跌停计数 → 五分项 → 主线第几天 → 明日展望。不报北向日净买入（2024-08-19 后不可比）。

**研报 · 研报摘要员**
- 职责：昨夜到今晨的新研报和券商晨会；评级、目标价、一致预期变了什么。
- 例行：交易日 08:05、20:00。
- 表：研报库.csv（`研报ID, 日期, 类型, 标的或行业, 券商, 分析师, 评级, 评级变动, 目标价, EPS预测, 页数, 链接, 本地PDF, 读过, 相对一致预期变了什么`）；一致预期.csv（`代码, 快照日期, 指标, 年度, 值, 机构数, 较上次变动`）。
- 供给：东财 `reportapi.eastmoney.com/report/list`；manymore13/report-cli；a-stock-data 的研报和同花顺一致预期层；妙想 FinSearch（有 key，50 次/天）。
- 交付物：评级和目标价变动表，加每篇三行摘要。

**宏观 · 宏观与日历员**
- 职责：隔夜外盘映射到 A 股链条、资金面一行、今日数据日历、数据公布后的变化句。
- 例行：交易日 07:30；每小时查已公布数据（预检）；周日 20:00 下周日历。
- 表：日历表.csv（`日期, 时间, 国家, 指标, 重要性, 前值, 预期, 公布值, 较预期, 来源, 状态`）；利率表.csv（`日期, Shibor隔夜, Shibor1W, LPR1Y, LPR5Y, 中间价, 10Y国债, 来源`）；外盘快照.csv（`日期, 标的, 收盘, 涨跌幅, 来源, 取数时间`）。
- 供给：中国货币网 `ShiborHis`、`LprHis`、中间价；中债收益率曲线；华尔街见闻 `apiv1/finance/macrodatas`；金十日历；东财数据中心宏观表；FRED（免费 key）、美国财政部、CFTC；外盘行情用 stock-sdk；Wind `economic_data`（有 key）。
- 交付物：外盘一表 → 映射到哪些链条 → 今日关注（时间、前值、预期）。

**深研 · 个股深研与财报点评**
- 职责：按需做单票深度（多空两面加裁决，给评级、目标区间、证伪条件）；自选股出定期报告时写财报点评；每天拿新证据核对论点。
- 例行：交易日 20:30 论点核对（安静）；「公告」往共享的待办表写一行即触发财报点评。
- 表：论点表.csv（`代码, 论点ID, 类型, 内容, 证伪条件, 建立日期, 状态, 最近证据日期`）；论点日志.csv（`日期, 代码, 论点ID, 新证据, 证据链接, 变化类型, 判定`）。
- 供给：anthropics/financial-services 的 `thesis-tracker`、`earnings-analysis`、`catalyst-calendar`；jwangkun/claude-for-financial-services-cn 的 `china-earnings-analysis`；xbtlin/ai-berkshire 的 `news-pulse`、`thesis-drift`、`financial_rigor.py`；simonlin1212/TradingAgents-astock 的政策、游资、解禁三个角色；wbh604/UZI-Skill 的 13 项自检；数字用 HiThink `financials`，叙述用 liteparse 或 MinerU 读原文。
- 交付物：一页备忘（结论、评级与区间、多空要点、证伪条件）；财报点评（超预期在哪、数字逐项带来源）。

## 5. 第一次打开

目标：从双击到第一份简报不超过 10 分钟。

1. 装对应版本的安装包。里面已有 Node、Chrome、uv 和版本包。
2. 填 DeepSeek key，做一次最小调用验证。
3. MyWork 在自己的对话里开场。先跑 10 秒网络探测，把结果说成一句话，例如「海外源不可达，X、Reddit、HF 官方先跳过，用镜像和中文源」。
4. 问或不问：
   - AI 版不问，直接按默认信源出第一份。
   - 金融版只问一句：「把自选股贴给我，或回『样例』」。
5. 按模板建第一位同事并转交第一件事。头条出过去 24 小时早报；盯盘出自选股体检。
6. 后台同时装数据引擎（金融版默认装，AI 版按需）。对话里一行进度；失败不挡第一份，只在脚注写「数据引擎未就绪」。
7. 第一份简报末尾附「接上这些会更好」，按增益排序，每项写要什么、花不花钱、多出哪块内容。
   - 金融版：同花顺 key（扫码）→ 金十 token → Tushare token → Wind key → 雪球登录。
   - AI 版：GitHub token → X 登录 → 即刻扫码 → xAI key。
   - 点一项后，右栏浏览器打开门户，用户自己登录，key 贴回对话进密钥库，当场探测。
8. 扫码配手机，告诉用户明早几点收到什么。
9. 当天稍晚，MyWork 按用户追问过的方向提议第二、第三位同事（先问再建）。第二天 08:45 的晨报是合并版。

## 6. 供给清单

**随安装包带**
- 运行时：Node 24、Chrome for Testing、uv。
- npm 件：stock-sdk、`@llamaindex/liteparse`、OpenCLI 及其桥接扩展、openclaw/mcporter（在 shell 里调远程 MCP，不占工具表）、`@hithink-tech/hithink-finance-cli`。
- 第一方 skill：`mw-collect`、`mw-brief`、`mw-fin-wires`、`mw-fin-ann`、`mw-fin-macro`、`mw-fin-reports`、`mw-ai-snapshots`、`mw-ledger-settle`。
- 审过并锁定的第三方 skill：
  - AI 版：khazix-skills 的 aihot、follow-builders 的读取脚本和提示词、ai-news-radar 的读取 skill、huggingface/skills 的 papers、hermes 的 competitor-news-monitor（改写）、PaperForge、ljg-paper。
  - 金融版：`hithink-finance`；Wind 的 `wind-mcp-skill` 和四个工作流 skill；anthropics/financial-services 的 equity-research 四件；jwangkun 的 `china-*` 四件；ai-berkshire 的两件；a-stock-data 的 SKILL.md（跑起来要 Python）。
- 数据：信源包（核过的实验室和中文媒体 RSS、tidings-rss 与 BestBlogs 子集）、交易日历、announcement_filter 分类表。

**一键安装**
- Python（uv）：a-stock-data 的依赖、akshare 与 `uvx akshare-one-mcp`、hhxg、plate-rotation、report-cli、use_cninfo、UZI-Skill、last30days、MinerU（模型 0.8–3 GB，走 ModelScope）、MediaCrawler（可选，高风险）、arxiv-mcp-server。
- Node 或二进制：本地 RSSHub（独立进程，给即刻、小宇宙等路由）、xiaohongshu-mcp、yt-dlp、sherpa-onnx-node（播客转写）。

**接用户自己的账号或 key**
- 必需：DeepSeek key。
- 金融：同花顺 fuyao key、Wind aifinmarket key（积分）、金十 MCP token、Tushare token、iFinD token、妙想 key、且慢 key、FRED key；雪球和东财登录（OpenCLI）；长桥、富途放后面，只读。
- AI：GitHub token、X 登录、即刻扫码、小红书扫码、知乎和 B 站登录、OpenRouter 与 Artificial Analysis 免费 key、xAI key（`x_search` 约 5 美元每千帖）、博查 key、DashScope key；用户自己的代理。

**只借格式**
- 金融：daily_stock_analysis（仪表盘、大盘复盘、回退顺序、交易日判断）；财联社早知道五模块；go-stock 五块；vibe-astock 五分项；byteseek/Mira 的简报契约和证据表；HKUDS/Vibe-Trading 的数字核验闸门和数据路由；JingHao-Leon/dsh-alpha-desk 的预测账本；TNT-Likely/PanWatch 的提醒冷却；jundizhou/easy-stock 的大V共识。
- AI：AIHOT 引擎（五轴打分、分层阈值 60/65/76、事件热度按独立信源计、24 小时半衰）；draco-agent/tech-news-digest 的加减分；vigorX777/ai-daily-digest 的版面；sansan0/TrendRadar 的增量模式和兴趣文件；Panniantong/Agent-Reach 的 doctor；ai-news-radar 的「伯乐」信源准入；jordan-gibbs/hyperresearch 的分步文件。
- 通用：dexter 的 HEARTBEAT 静默规则。

## 7. 内核要补的能力

1. **同事模板与版本包装载**。没有它，首次打开建不出领域同事；`mywork_mate_create` 加 `template` 参数。改动：中。
2. **安装包切到 v2，带 `edition/` 和 uv**。现在安装包还是 v1；`build.mjs` 加 `--edition`，`main.js` 首启复制版本包并设置 PATH 和镜像变量。改动：小到中。
3. **采集器 `mw-collect`**。抓取和去重必须在 shell 里做，只有新条目进模型（models.dev 5 MB、OpenAI feed 760 KB）。先做成第一方 skill，零内核改动。改动：中。
4. **例行预检**。同事是一条长对话，高频轮询每次都付上下文的钱。`pre` 命令退出码决定是否叫醒模型，没变化记一次安静运行。改动：小到中。
5. **密钥库与连接器预设**。key 是每个用户自己的，接入过程是「去门户登录、复制 key」；dsh 会清掉像凭据的环境变量，所以要写厂商配置文件；Tushare 的 token 在 URL 里要打码。改动：中。
6. **交易日历例行与时段窗口**。加「交易日 HH:MM」「交易时段每 N 分钟」和过期不补跑（盘前简报 11 点补跑没有意义）。改动：小。
7. **覆盖与信源健康的展示**。健康列在表格视图里显示成状态；交付卡固定一行「覆盖 a/b 源」。改动：小。
8. **共享表与转交**。自选股.csv 多位同事要读；「公告」要能把财报交给「深研」。先用共享目录加待办表，不加新工具。改动：小。
9. **数字核验闸门**。交付物里的每个数字必须能在本次运行的原始文件里找到，找不到的删掉并注明。改动：中。
10. **Skill 锁定校验与权限卡**。启动时比对 sha256，同事资料卡显示每个 skill 的能力；按清单整目录替换，避免改名后残留的 skill 抢触发。改动：中。
11. **每位同事的 MCP 工具白名单**。MCP 现在全局可见，大工具表会淹没上下文。在此之前优先用 CLI 和 mcporter。改动：中到大，取决于 dsh。
12. **MCP 的 OAuth**。富途、长桥、OpenAlex、alphaXiv 需要；先用 `mcp-remote` 桥接。改动：大，放最后。
13. **模板导入导出**。给模板分享铺路。改动：中。

## 8. 可靠性与安全

- **信源失效**
  - HTTP 200 不算健康。看「最新条目时间」对比应有频率：连续失败 3 次切备用地址，超期无新条目标「疑似停更」。
  - 游标只对成功的源前进。抓取失败写「未覆盖」，不写「无新闻」。
  - 每份简报固定覆盖脚注：成功、失败、过期的源，时间窗，未读的低分条数。
  - MyWork 每周日 21:00 出信源体检，写明哪些死了、怎么换。
- **封禁**
  - 采集器按主机限速：东财间隔 3–5 秒，巨潮并发不超过 4，arXiv 3 秒一次，快讯间隔不低于 2 分钟，默认缓存 30 分钟。
  - 登录态信源只读、按人的频率、每平台每日上限，建议小号；遇到验证码立刻停，请用户接手。
  - 已被平台掐过的类别（B 站 API 封装、公众号后台接口、Nitter、X 密码登录）不进默认路径。
  - 每条 T4 源都要满足「没有它简报也完整」。东财只用于研报、数据中心和公告分类，行情走腾讯、新浪或厂商 key。
- **额度**
  - 连接器带 `quota` 和每日预算；例行先批量、先查缓存、不重复查。
  - 用到 80% 时在脚注提示；用尽自动降一层并写明「本期数字来自 T3」。
  - 付费接口首次启用和调高预算都要用户批准。
- **恶意 skill**
  - 只带审过的一小批，锁定 commit 和 sha256，不自动更新。
  - 构建时用 NVIDIA/SkillSpector 和 snyk/agent-scan 扫。
  - 载入前去掉 Unicode 标签字符，拒绝正文里叫 agent 下载或运行安装器的 skill。
  - 用户自己装的第三方 skill 先进隔离目录，扫描、显示权限卡、用户同意后才进某位同事的文件夹。「读凭据且联网」单独确认。金融类是被仿冒最多的类别。
- **花钱或对外的动作**
  - 沿用 `mywork_ask` 的批准。同事可以给观点，但不下单：交易类工具在连接器层按名称拒绝（order、trade、submit、cancel、simulat）。
  - 发帖、给别人发消息、写 GitHub 默认关闭；dsh-jike 保持只读开关。
- **注入与幻觉**
  - 抓来的内容是数据，不是指令，包括 AIHOT 返回里写给 agent 的提示。
  - 标题不出现原文没提到的公司。
  - 数字由脚本算，模型只叙述；单位（手与股、元与亿元）在脚本里归一；两源相差超过 1% 标冲突；午休和夜间的旧报价不当实时。
- **观点问责**
  - 每个评分和价位进观点账本，按收盘价机械结算，缺数据作废，不回填。每周复盘附命中率。
- **密钥**
  - 存在同事文件夹之外，权限 0600；日志和导出里打码；不让用户把密码或 cookie 发进对话。

## 9. 节奏

**2 周**
- 模板装载最小版；安装包出 v2 加两个版本包；uv 随包并跑通一个 Python 环境（a-stock-data）。
- `mw-collect`（rss、json、md-diff、snapshot）和五家快讯、四个公告端点的脚本。
- 两位第一同事可用：头条（零 key）、盯盘（stock-sdk 加公告加快讯）。
- 网络探测、覆盖脚注、错开的例行时间。
- 在真实大陆线路上测一遍全部默认信源和镜像。

**6 周**
- 两份名册全部上线；连接器预设和密钥库（同花顺、金十、Tushare、Wind、GitHub、X 登录、即刻）。
- 例行预检、交易日历、共享表、健康展示。
- OpenCLI 桥接预载；观点账本结算；数字核验闸门；skill 锁定和 CI 扫描。
- 头条用自己的 T0 信源达到不依赖 AIHOT 也能出的水平。

**12 周**
- 模板导入导出与分享；每位同事的工具白名单；`mcp-remote` 或原生 OAuth。
- 自己的中心化信源：镜像 follow-builders 式的 X 名单（100 个账号约 5 美元一天）到国内可达的地址。
- MinerU 重解析、播客转写、论文结果表抽取。
- 第三方 skill 隔离安装；追加包（基金用且慢 MCP、港美股用长桥只读、大V观点用雪球登录态）。
- 用 100–200 条人工标注校准打分阈值。

## 10. 最大的风险，以及什么情况会推翻这个方案

**风险**
- **大陆可达性全部是推断。** 13 位侦察员都经代理出网，没有一项是实测。涉及 hf-mirror、jsDelivr、raw.githubusercontent、uv 的 Python 镜像、workers.dev 中继。第一周实测可能改写默认信源表。
- **厂商免费层没有核实。** 同花顺 fuyao、金十 MCP、Wind 积分的价格和配额都未验证。如果个人拿不到够用的额度，金融版的免费层就只剩抓取源，而抓取源在持续失效（通达信公共服务器 2026-09 停供 K 线，东财封 IP，a-stock-data 的更新日志记录了端点死亡）。
- **上游聚合源收紧。** AIHOT 旧接口 2026-10-31 关停，说明接口会变；follow-builders 是单人维护。头条必须在 6 周内不靠它们也成立。
- **Python 安装失败率。** 如果国内网络下 uv 拉取失败率高，金融版的复盘和研报深度第一天就缺一块，要改成安装包内置。
- **成本与上下文。** 一位同事一条长对话，高频例行没有预检就不可持续；同时只能跑 2 位、单次 20 分钟，七位同事的早间窗口很紧。
- **观点出错伤信任。** 给评分和价位是卖点，也是最快流失的原因。账本和命中率必须第一版就有。
- **登录态信源连累用户账号。** 一次封号的口碑代价大于它带来的内容。
- **未验证的技术假设。** Chrome for Testing 153 能否预载 OpenCLI 扩展；dsh-jike 与钉住的 dsh 是否兼容；PATH 方式能否让第三方 Python skill 免改。

**会推翻方案的情况**
- 实测发现默认信源在大陆大面积不可达，镜像也不稳。那就必须先建自己的中心化信源，方案从「本机采集」变成「中心采集加本机个性化」。
- 厂商把 skill 和 API 收回自家宿主，或者同花顺、Wind、东财的助手自己做了到点交付的持续简报。金融版的优势只剩「跨厂商、本地、自己的表」，要重估是否值得单独做一个产品。
- 留存数据显示用户留下来是因为「一句话自己建同事」，而不是名册。那模板和版本包应降级为示例，资源回到通用内核。
- 6 周时两个版本的次周留存差距很大。收成一个产品，另一个退成追加包。
- dsh 升级后提供每会话工具范围和 MCP OAuth，或者钉住的版本出现挡路的缺陷。第 7 节后半的排序要重排。