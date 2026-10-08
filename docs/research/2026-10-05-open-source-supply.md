# 开源供给清单：AI 版与金融版能直接用什么

2026-10-05。给「一个内核、两个产品」的设计（[design/v2/EDITIONS.md](../../design/v2/EDITIONS.md)）提供依据。

## 怎么得到的

1. **第一轮，收集**：13 个方向同时查（金融 6 个、AI 6 个、skill 生态 1 个），得到 259 个候选。其中 210 个 GitHub 仓库用 GitHub API 逐个核实，全部存在。完整列表见 [oss-2026-10/candidates.md](oss-2026-10/candidates.md)。
2. **第二轮，复核**：13 组复核员重新打开一手来源，能跑的就实际跑一遍，专门找第一轮说错的地方。131 个对象、364 条说法里，201 条被确认，116 条被纠正，33 条被推翻，14 条没法确认。逐条记录见 [oss-2026-10/verification-notes.md](oss-2026-10/verification-notes.md)。
3. **直连测试**：关键数据接口我自己逐个请求了一遍。

选型标准只有四条：现在能不能用、能不能在我们的环境里跑、国内能不能用、要不要钱。许可证和合规不作为筛选条件。

**一个贯穿全文的保留**：所有测试机器的网络出口都在境外。「能通」只说明接口活着，不代表大陆直连可用。大陆可达性是这次调研最大的空白，必须用一条真实的大陆线路补测。

## 先说结论

- **金融：不用 Python、不用 key，就能撑起一份早报。** 公告、快讯、行情、研报列表、宏观日历都有活着的直连接口，一个没有依赖的 Node 库就能取 A 股和港股行情。
- **金融厂商自己在出 skill 和 MCP。** 同花顺、万得、金十、东方财富妙想、且慢、Tushare 都有官方接口，多数用一个固定的请求头就能接上，正好是我们的 MCP 连接器现在支持的方式。它们适合做「接上会更好」的升级项。
- **AI：现成的资讯聚合已经做得不错，而且免费。** AIHOT 已经做了打分、合并同一事件、不重复。所以 AI 版不能靠「聚合新闻」取胜，要靠「和你自己的技术栈有什么关系」。
- **X 和公众号有免登录的读法。** 160 个 AI 圈账号的 X 动态、375 个公众号的全文，都有第三方做成了 RSS。它们也是最容易失效的一环。
- **真正的分界线是 Node 还是 Python。** 社区里最好的金融和资讯工具大多是 Python，我们的安装包只带 Node。Windows 上还没有 bash。结论是默认同事只靠 Node，Python 做成一键启用的可选环境。
- **借来的 skill 不能直接用。** 几乎每个都要改：去掉对 Claude 子代理的依赖，去掉自动安装和自动更新，把 Python 和 bash 写法换成 Node。

## 金融版

### 不要 key 的数据（直连）

| 给什么 | 来源 | 实测 |
|---|---|---|
| 公告列表 | 巨潮资讯、上交所、深交所、港交所披露易 | 四个都正常，每条公告有稳定编号，可用来去重 |
| 快讯 | 华尔街见闻、金十、格隆汇、东方财富和新浪 7×24；财联社要签名 | 正常。发布方自己的接口带重要度、相关股票和板块，聚合站会把这些丢掉 |
| 宏观日历 | 华尔街见闻日历接口 | 正常 |
| 研报列表 | 东方财富研报中心（含券商晨会分类） | 正常 |
| 行情 | 腾讯、新浪 | 正常 |
| 利率 | 中国货币网（LPR、Shibor） | 正常 |
| 交易日历 | 深交所按月的开市日接口 | 正常，不需要额外的库 |
| 估值分位、财务卡片、分类公告 | quant.tybbtech.com 的公开接口 | 正常 |

要注意的：
- **东方财富的行情接口不可靠。** 从境外出口请求一律 502，可能是屏蔽境外 IP，大陆情况未测。行情用腾讯和新浪，东方财富只用来取研报、数据中心和公告分类。
- **聚合站太慢，不能当快讯源。** 公共的 newsnow 实例缓存 30 分钟，实测财联社最新一条落后 35 分钟，而且必须带浏览器的请求头才不被拦。
- **巨潮的并发限制**（调研称超过约 4 个并发会被封 IP）没有实测，按单并发设计。

### 现成的 Node 工具

| 工具 | 给什么 | 实测 |
|---|---|---|
| [chengzuopeng/stock-sdk](https://github.com/chengzuopeng/stock-sdk) | A 股、港股、美股行情，K 线，涨停股池，龙虎榜，资金流，融资融券，交易日历 | 我在自带的 Node 上跑通：没有任何依赖，1.1 MB，自带命令行和 MCP 服务，2.6 秒取回 3 只股票 |
| [simonlin1212/a-stock-data](https://github.com/simonlin1212/a-stock-data) | 34 个公开来源、87 个接口的调用方法 | 原样是 Python，文件 425 KB，太大不能直接当 skill。但 29 个接口里有 28 个用纯 Node 就能调通，值得把 25–30 个移植成一个 Node 小工具 |
| [run-llama/liteparse](https://github.com/run-llama/liteparse) | 读公告和年报 PDF | 143 页的茅台年报 0.41 秒解析完，中文和报表都对。必须关掉 OCR（默认开着，会慢到 112 秒）；财报用文本模式，论文用 Markdown 模式；每个平台约 26 MB |
| MinerU 的免 key 在线接口 | 扫描件、复杂表格、Office 文件 | 能用，每次最多 20 页、10 MB。文件会上传到对方服务器 |

### 接上用户自己的账号会更好

| 来源 | 给什么 | 怎么拿、多少钱 | 能不能直接接 |
|---|---|---|---|
| 同花顺 Financial-API | A 股行情、财务、估值、涨停梯队、龙虎榜、异动原因 | 用同花顺 App 扫码领 key；内测期免费，没有公布额度和价格 | 能，固定请求头。注意 key 错了也返回成功，要检查返回里的业务码 |
| 金十 MCP | 快讯、资讯全文、财经日历、外汇和商品行情 | 金十账号登录后点一下激活；免费，每个工具每天 1500 次 | 能，固定请求头，只有 8 个工具 |
| 东方财富妙想 | 自然语言搜新闻、公告、研报、政策；指标查询；选股 | 要在东方财富 App 里领 key；免费，现在每个功能每天 150 次 | 不是 MCP，是一个普通 HTTP 接口，写个小脚本就能调 |
| 盈米且慢 MCP | 基金诊断、回测、配置 | 且慢账号开通；免费 | 能，69 个工具，要限制范围 |
| 万得 MCP | 公告、新闻、行情、指数、债券、宏观数据库 | 手机号注册；每天送 300 积分（9 月前是 1000），100 元买 10000 积分；每次调用扣多少没有公布 | 能，固定请求头，7 个服务 35 个工具 |
| 同花顺 iFinD MCP | 新闻公告搜索、宏观、港美股、债券 | 总共 2000 次免费，之后个人每月 40–199 元 | 能，固定请求头 |
| Tushare | 结构化行情和财务 | 200 元/年起；新闻、公告、研报、政策各要另付 500–1000 元/年 | 能，但工具列表有 254 个、约 8 万 token，不能整个挂上 |
| 长桥 | 港美股行情、研究数据、持仓、下单 | 长桥账号；有大陆节点；可以在浏览器里生成一次性授权码 | 能，用授权码换令牌 |
| 富途 | 行情、持仓、下单 | 富途账号；只支持 OAuth，令牌 14 天过期 | 我们的连接器不支持 OAuth；有现成的 dsh 插件替它做了登录 |

要注意的：
- **工具太多会撑爆上下文。** 同花顺六个服务全挂上约 100 KB，Tushare 约 8 万 token。要么按同事限制可见的工具，要么用 skill 里的脚本按需调用。
- **同花顺是直接对手。** 它把最值钱的数据（主力资金、高频异动、分级事件库）留给自己的 AI 客户端，开放接口是给它引流的。

### 做法和格式（拿来改，不是拿来装）

| 来源 | 值得拿的 |
|---|---|
| [ZhuLinsen/daily_stock_analysis](https://github.com/ZhuLinsen/daily_stock_analysis)（6.6 万星） | 自选股「决策仪表盘」的结构：0–100 评分、一句话结论、持仓者和未持仓者分开给建议、买点 / 止损 / 目标位、仓位、检查清单、历史表。还有七段式大盘复盘 |
| [Wind-Alice/AliceMarket](https://github.com/Wind-Alice/AliceMarket) | 78 个 skill 里 69 个是纯文字模板：自选股晨报、收盘复盘、公告影响解读、交易计划、仓位、止损、止盈、抄底判断。输出形状是「30 秒结论 + 表 + 失效条件」。缺数据做法和数字规则，要我们补 |
| [xbtlin/ai-berkshire](https://github.com/xbtlin/ai-berkshire) | 观点跟踪（假设表、红线表、健康分公式、每次检查追加一行）、异动归因、观点漂移对比。中文原生，状态词定义清楚 |
| [anthropics/financial-services](https://github.com/anthropics/financial-services) | 晨会纪要一页纸、催化剂日历、业绩前瞻。英文，面向美股，要改 |
| [HKUDS/Vibe-Trading](https://github.com/HKUDS/Vibe-Trading) | 5 个带定时的研究流程模板（盘前 08:30、资金流 19:00、财报跟踪等）：固定章节、必写「数据缺口」、每只股票一行机器可读的结论 |
| [ArvinLovegood/go-stock](https://github.com/ArvinLovegood/go-stock) | 早上预判、晚上给预判打分的闭环；按 3/5/10/20/30 天回测自己的推荐。它也是形态最接近的对手（本地桌面、DeepSeek、定时、记忆） |
| [simonlin1212/vibe-astock](https://github.com/simonlin1212/vibe-astock) | 短线复盘五部分：情绪、资金、题材、龙虎榜、龙头；次日验证项 |
| [simonlin1212/TradingAgents-astock](https://github.com/simonlin1212/TradingAgents-astock) | A 股特有的三个角色：政策分析、游资追踪、解禁监控 |
| [rollingSirius/equity-research-skill](https://github.com/rollingSirius/equity-research-skill) | 九章财报深度分析；三个只用标准库的计算和检查脚本，值得移植到 Node |

复核纠正的两点：
- 多数热门项目**主动去掉了**评分和点位（vibe-astock、Vibe-Research、TradingAgents-astock、TradingAgents-CN）。还在给买卖点的只有 daily_stock_analysis、go-stock 和 Vibe-Trading 的报告 skill。所以带观点的提示词要我们自己按 daily_stock_analysis 的结构写。
- jwangkun 的 A 股版 Anthropic skills 有事实错误（把中证 500 当美股指数、ST 涨跌幅写成 30%），可以当清单参考，不能直接用。

## AI 版

### 不要 key 的数据

| 给什么 | 来源 | 实测 |
|---|---|---|
| 中文 AI 资讯（已打分、已合并） | [AIHOT](https://aihot.news) 的 v1 接口 | 正常，每条带分数、分类和理由；背后是 853 个信源；国内节点。旧接口 2026-10-31 关停；周末和节假日精选很少；偶尔混入旧文章，要按发布时间过滤 |
| 官方一手 | OpenAI、DeepMind 的 RSS；Anthropic 的更新日志（Markdown 版）；各厂商文档的 Markdown 版 | 正常。Olshansk/rss-feeds 的 34 个源里只有约 14 个还在更新 |
| 论文 | arXiv 接口和 RSS、papers.cool | 正常 |
| 论文（要代理） | Hugging Face 每日论文 | 主站正常；国内镜像会把这个接口重定向回主站，大陆没代理拿不到 |
| 模型和价格 | models.dev（一个 5 MB 的 JSON）、OpenRouter 的模型列表 | 正常，适合做「和昨天的快照对比」 |
| 开源动态 | Hacker News 搜索接口、GitHub Trending 的 RSS、各仓库的发版 RSS | 正常 |
| 新产品 | Product Hunt 的 AI 分类 RSS | 正常 |
| X 上的 AI 圈 | api.xgo.ing 把 160 个账号做成了 RSS（清单在 BestBlogs 的 OPML 里） | 抽查 8 个都正常，带互动数；不在清单里的账号拿不到 |
| 公众号 | wechat2rss.bestblogs.dev（375 个号，全文） | 抽查 14 个都正常，更新到前一天 |
| 即刻 | m.okjike.com 的用户页和圈子页 | 不用登录就能读最新 10 条 |
| 中文热榜和科技媒体 | newsnow 自己构建一份跑在本机（8.3 MB，52 个源） | 在自带的 Node 上启动不到 1 秒 |

要注意的：
- **X 和公众号的桥都是个人运营的**，是最容易失效的一环。信源表里要同时存账号本身，桥坏了能换。
- **三个「中心 feed」其实是一条链。** ai-news-radar 的数据来自 AIHOT 和 follow-builders，同时用三个会重复计数。
- **已经失效的**：公开的 Nitter 镜像全部不可用；Rettiwt 的免登录模式只返回一年前的热门推文；公共 RSSHub 实例被拦；we-mp-rss 9 月起很多人同步不了；一个常被推荐的 YouTube 字幕 MCP 悄悄返回空结果。

### 登录后才能读的

| 平台 | 办法 |
|---|---|
| X（清单外的账号）、小红书、知乎、微博、B 站、雪球 | [jackwener/OpenCLI](https://github.com/jackwener/OpenCLI)：19 MB，纯 Node。它不需要浏览器扩展，可以直接接到我们自己的浏览器上，用户手动登录一次。另有约 300 个命令完全不需要浏览器（抽查 127 个，97 个直接返回数据） |
| X（不想登录） | 官方接口按量付费，每条 0.005 美元；盯 100 个账号大约每月 60 美元 |
| YouTube | yt-dlp 的独立程序取字幕（要代理） |
| 播客 | 本机语音转写（sherpa-onnx，约 300 MB 模型，另需 ffmpeg），做成可选包 |

要注意的：OpenCLI 上游 9 月以后几乎停止合并，要锁定版本、自己修适配器；返回空数组也要当失败处理；无界面浏览器会被雪球和知乎拦。

### 做法和格式

| 来源 | 值得拿的 |
|---|---|
| AIHOT 开源的引擎 | 打分提示词和阈值、同一事件的合并规则、按独立信源数算热度、7 期内不重复 |
| [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) 的 competitor-news-monitor | 「关注合同」：关注名单、事件类别、重要度门槛、上次检查点；失败的信源算「覆盖未知」，不算「没有新闻」 |
| [sansan0/TrendRadar](https://github.com/sansan0/TrendRadar) | 用大白话写兴趣、关键词语法、排名 / 频次 / 热度的权重、只推新增。它自己不采集，热榜来自 newsnow |
| [draco-agent/tech-news-digest](https://github.com/draco-agent/tech-news-digest) | 99 个 RSS 加 49 个 GitHub 仓库的信源清单，加减分规则 |
| [FeijiangHan/PaperForge](https://github.com/FeijiangHan/PaperForge) | 中文的论文精读提纲，纯文字 |
| [vigorX777/ai-daily-digest](https://github.com/vigorX777/ai-daily-digest) | 一个 TypeScript 文件，在自带的 Node 24 上直接跑，用 DeepSeek 打分。证明「单文件脚本 + 自带 Node」是正确的打包方式 |
| 深度研究类 skill | 方法可用，但都假设能同时开多个子代理，要改成一步一步、把中间结果写进文件 |

模型调价和下线的跟踪工具，调研里只找到一个 9 星的小项目。这是一个空位。

## 运行环境

| 问题 | 结论 |
|---|---|
| 要不要带 Python | 默认同事不依赖 Python。安装包带上 uv（17–21 MB）；金融版再带一份 Python 压缩包（22–25 MB），离线 7 秒装好，联网只需要从国内镜像下包 |
| 镜像 | Python 本体用 npmmirror（备用南京大学）；清华和阿里云没有这个镜像，只适合装包。包镜像选一个后不要换，换了缓存会失效 |
| 速度 | 第一次用 akshare 要 1 分钟左右，之后 2 秒内。必须给用户一个看得见的「正在准备」步骤 |
| Windows | 没有 bash，只有 PowerShell。skill 里的脚本必须是 Node 文件，不能是 bash 或 python 单行命令。杀毒软件误报 uv 和 Python 的情况有记录，没有实测 |
| 装 skill | `npx skills add` 几乎都要 git，大陆走不通；skills.sh 有一个不要 git 的下载接口 |
| RSSHub | 只是一个库，约 400 MB，直接安装目前是坏的（要锁依赖版本）。做成可选包 |

## DeepSeek Harness 自己的生态

- **我们锁定的 dsh 版本落后三代。** 现在的最新版是 0.2.0-rc.2，我们是 0.1.6-alpha.2。活跃的插件已经开始要求更高版本。
- 能直接用的 Node 插件：dsh-rss（9 个工具，带 OPML 和健康检查）、dsh-lit-search（论文检索）、PerryLink 的行业研究和基金研究系列（带出处的报告规范）。在锁定版本上能装上，但没有实际启动验证过。
- 富途的 dsh 插件是唯一一处插件比我们的连接器强的地方：它自己做了 OAuth 登录。

## 不建议用的

| 项目 | 原因 |
|---|---|
| Nitter、XCancel 等 X 镜像 | 全部停服或被拦 |
| twitter-cli | 5 月后无人维护，搜索 8 月起坏了 |
| we-mp-rss | 授权后无法同步的报告很多 |
| 公共 rsshub.app、公共 newsnow 当主力 | 前者被拦，后者太慢 |
| markitdown、docling | 都要 Python；读 PDF 不如 liteparse |
| TradingAgents-CN | 要 MongoDB 和 Redis，定时分析是付费功能 |
| mootdx（通达信） | 上游 9 月起返回空数据 |
| last30days 整个 skill | 说明文件 260 KB；免 key 只能拿到 HN 和 GitHub |
