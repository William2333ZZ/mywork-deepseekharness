# GBrain：Garry Tan 自己怎么用、讲的原则、独立评测（2026-10-06）

**来源代号**（下文按「代号＋日期」标注出处）
Garry 本人的文字：T1《Thin Harness, Fat Skills》2026-04-11 https://x.com/garrytan/status/2042925773300908103；T2《Resolvers》2026-04-15 https://x.com/garrytan/status/2044479509874020852；T3《How to really stop your agents from making the same mistakes》2026-04-22 https://x.com/garrytan/status/2046876981711769720；T4《Meta-Meta-Prompting》2026-05-09 https://x.com/garrytan/status/2053127519872614419；T5 Startup School 演讲《Own Your Intelligence》，播客 2026-08-06 发布，逐字稿见 https://podscripts.co/podcasts/y-combinator-startup-podcast/garry-tan-own-your-intelligence；T6 README 自述（镜像页 2026-10-03 更新）https://hermesatlas.com/projects/garrytan/gbrain。
他的推文（前缀均为 x.com/garrytan/status/）：X1 04-10 /2042497872114090069；X2 04-30 /2049767235888275756；X3 05-15 /2055310116325560647；X4 08-12 /2087594114372259890；X5 08-18 /2089733961492930659；X6 05-24 /2058627082322858397；X7 04-11 /2043075944743923845。
独立来源：R1 dev.to No.46，04-23 发布、06-04 修订，https://dev.to/wonderlab/one-open-source-project-a-day-no46-the-y-combinator-ceo-wrote-his-own-ai-brain-and-open-sourced-2ib5；R2 ice-ice-bear 04-16 https://ice-ice-bear.github.io/posts/2026-04-16-gbrain/；R3 lucaberton 05-04 https://lucaberton.com/blog/garry-tan-gbrain-ai-agent-knowledge-graph-2026/；R4 vectorize 05-08 https://vectorize.io/articles/gbrain-review；R5 AI by Aakash 05-28 https://www.aibyaakash.com/p/gbrain；R6 slite 07-16 https://slite.com/learn/gbrain-review；R7 gamgee 04-14 发布、07-18 更新，https://gamgee.ai/blogs/garry-tan-gbrain-ai-memory-system/；P Product Hunt 09-23 https://www.producthunt.com/products/gbrain，以及定价页 https://gbrain.io/pricing（10-06 抓取）。
注意：R4、R6、R7 的作者都在卖与 GBrain 竞争的记忆产品。

**1. Garry 自己怎么用**
- **夜里**
  - agent 会"处理"他的收件箱，而不只是排序：分出处境困难的创始人、推销邮件和各类邮件列表，并附上发件人的背景和历史往来。他早上醒来看到的是一份简报。
  - 半夜想到要查的研究，第二天早上已经做完。外部新闻已经读过，对照他关心的事归好档（T5）。
  - 夜间 cron 做的事：人物页去重、修复引用、打重要度分、找矛盾、准备第二天的任务（T6）。
  - 一次 compendium 夜跑读完三本 Spinoza 传记（约 1500 页），产出带出处的年表和三位作者的分歧点（T5）。
- **白天**
  - 邮件分拣每 10 分钟跑一次；会议结束后自动入库（T4）。
  - 会议 skill 的内容：Circleback 录音一到就做带说话人的转写，抽出承诺内容、承诺人和截止日，把出现的每个人名链接到其人物页，摘要和全文分开存。如果与已有认知冲突，只标记、不覆盖（T5）。
  - 每条消息都会经过 signal detector 抽取实体（R2）。
- **每周**：check-resolvable 扫描一遍"已经存在但调不到"的 skill（T2）。
- **喂进去的东西**
  - 配方里列的来源：Gmail、Google Calendar、X 时间线（含删推监控）、Twilio＋OpenAI Realtime 电话、Circleback 会议（R1、T6）。
  - 还有 Slack、社交媒体（T4）；邮件里的投资人月报（指标会抽进公司页）、YouTube/播客/语音备忘（T4）；DocuSign 待签文件（T2）。
  - 日历先落成本地文件（2013–2026 年共 3146 个），实时 API 只用来查未来或最近 48 小时的事（T3）。
  - 模型分工：Opus 4.7 管精度，GPT-5.5 管召回，DeepSeek V4-Pro 管创意，Groq 上的 Llama 管速度（T4）。
  - 运行环境：harness 用 OpenClaw＋Hermes（T4），数据库用 Supabase（R4）。
- **怎么取用**
  - 会前简报：Demis Hassabis 来访前，2 分钟内拿到他的人物页、公开观点和对话切入点（T4）。
  - office hours 见过的创始人，下次再见时已有一整包上下文（T4）。
  - 创始人来信，他还没读完，agent 已经调出全部往来记录，以及三家遇到过同样问题的被投公司（T5）。
  - 直接问"某某是谁"，由 brain-ops 回答（T2）。
  - 读书"镜像"：把书逐章映射到自己的生活，已做了 20 多本（T4）。

**2. 他讲的设计原则（转述）**
- **薄 harness、厚 skill**：harness 只管循环、读写文件、管理上下文、守安全。skill 是带参数的 markdown，像方法调用一样复用。智能往上放进 skill，执行往下交给确定性代码（T1）。
- **潜空间与确定性分开**：判断交给模型，算术、排座、查表交给脚本。他的 agent 心算时区错了整整一小时（实际 88 分钟后的会说成 28 分钟），修法是强制先跑脚本再回答（T1、T3）。
- **Resolver**：把 2 万行的 CLAUDE.md 砍成 200 行路由表；所有写入大脑的 skill 先读归档规则；路由本身要有 eval；不维护的话 90 天就腐烂（T2）。
- **Diarization**：读完一个对象的全部材料，写一页判断，比如对比"他说在做的"和"他实际在做的"（T1）。
- **Compiled truth**：页面顶部是当前最佳理解，下面是只追加的时间线，原始材料单独挂在旁边（T4）。
- **实体回写**：会议页本身不是产品，把会上的信息回写到每个相关的人和公司页才是（T4）。
- **Brain-first**：先查本地大脑，查不到才调外部 API，结果再写回大脑（R1、T3、T6）。
- **Self-wiring**：写页面时用规则（不调 LLM）抽出 works_at、invested_in 这类带类型的关系边（R1、T6）。
- **分级补全（enrichment）**：只提到一次先建空壳页；跨来源提到 3 次做网络补全；开过会或提到 8 次以上走完整流程（R4 转述）。
- **Skillify**：不做一次性工作。先手工做 3–10 个样例，他批准后写成 skill，需要自动跑就挂上 cron（T1、T4）。
- **卫生**：每条事实带出处，新旧冲突要检查，要有专门负责修剪的角色。用他的话说：「A brain nobody curates is a garbage dump with great search.」（T5）
- **所有权**：上下文要自己掌握，跑在自己的基础设施、仓库和密钥下；他说"掌握托管权"本身就是安全模型（T5、X7）。

**3. 数字与成本（均为自报，口径前后不一）**
- **规模变化**
  - 04-10：1 万多个 md 文件（X1）。
  - 4 月中：17,888 页、4,383 人、723 家公司、21 个 cron，据称 12 天写成（R2、R1）。
  - 04-15：2.5 万个文件，每天 200 条输入，40 多个 skill（T2）。
  - 04-30：7.5 万（X2）。
  - 05-09：约 10 万页、100 多个 skill。同一篇里既说每天 100 多个 cron，又说 15 个 cron，自相矛盾（T4）。
  - 7 月：146,646 页、24,585 人、5,339 家、66 个任务（R6 转引）。
  - 08-06 演讲：约 22 万页，覆盖"25 年人生"（T5）。
  - 10-03 README：155,795 页、24,589 人、5,340 家、66 个 cron（T6）。演讲和 README 的数字对不上。
- **Garry 说的成本**
  - 每月烧 1 万美元 token，就能提前用上 2028 年 100 美元能买到的 AI（X3）。
  - README 承认常驻服务器路线最贵：需要 8GB 以上内存的服务器，加上随用量增长的 API 费（T6）。
- **独立估算**
  - 个人活跃大脑每月几美元（R4）。
  - 小团队每人每月约 4 美元，重度使用 8–15 美元；钱主要花在查询，不在写入（R6）。
  - brainstorm/lsd 每次 0.2–0.4 美元（R5）。
- **托管版**：演讲时说免费（T5）；现在定价为每工作区每月 199 美元，含 100 美元额度（P）。

**4. 独立评测**
- **优点**
  - 复利是设计进去的：分级补全、失败后自动生成正则、反向链接加权；写入几乎不花 token；markdown 放在 git 里可以 diff；公布的基准数字诚实（R4）。Garry 本人转发了 R4，称之为好反馈（X6）。
  - 架构评五星（R7）；安装约 30 分钟（R3、R7）。
- **出错**
  - 夜间循环只整理、重链、重写摘要，不核实内容真伪（R6）。
  - 遗忘、哪条事实取代哪条、冲突怎么仲裁、什么时候该说"不知道"，都还没解决（R7）。
- **维护成本**
  - skill 和 schema 要用户自己写，放着不管会把错误也一起复利（R4）。
  - v0.x 阶段频繁有破坏性升级，npm 上还有被抢注的同名包（R4）。
  - 要 4–8 周才见效（R4）。Garry 自己也说第一周是玩具，多数人第二周就放弃（T5）。
- **隐私与权限**
  - 单人设计，没有真正的权限模型（R6）；团队治理评 2/5（R7）。
  - README 自己承认授权测试不等于普遍的防泄漏保证（T6）。
  - R1 只介绍了信任边界（CLI 有完整权限、MCP 走沙箱），没有评价隐私风险。
- **非 Garry 场景**
  - 关系词表写死，偏向 VC 人脉（R6）。
  - 不适合非技术用户（R7）。
  - 有用户用了三周觉得有效（R5）。
- **平台绑定**
  - 5 月时一等支持只有 OpenClaw/Hermes（R4），而且要跑在 Telegram 上的 Hermes/OpenClaw 里（R5）。
  - 8 月起称 Codex、Claude Code、任意 harness、任意 Postgres＋pgvector 都能用（X4、X5）。
  - 5 月时向量嵌入必须用 OpenAI（R4）。

**5. 【推论】给「CTO 的幕僚」**
最值得借的 5 条：
1. **会议→实体回写**：承诺、负责人、截止日回写到人、项目、系统页；遇到冲突只标记、不覆盖。
2. **页面结构**：compiled truth＋只追加时间线＋原始材料，每条带出处。适合技术决策、事故和技术债。
3. **确定性边界**：日程、时区、"还有几分钟"一律走本地镜像和脚本，不让模型心算。
4. **夜间批处理**：早上出一页简报，每场会前出 prep（是谁、上次说了什么、之后变了什么、该问什么）。
5. **Skillify 和路由测试**：先手工做几次，用户点头才固化成 skill；每周自检有没有调不到的能力。

最该避开的 3 条：
1. **把"整齐"当成"正确"**：必须有核实步骤，以及用户能看到的矛盾队列。
2. **token 和 cron 没有上限，还要用户自己写 skill**：要设预算上限，只给少量默认 skill。
3. **单人、无权限的假设**：CTO 的上下文涉及人事、安全和客户数据，必须分权限。关系词表也要换掉 VC 那套，例如 owns、depends_on、blocked_by。

**日历和会议纪要来源是否绑定某家厂商**
- **Garry 自己的配置**：Google（Gmail/Calendar 通过自有 OAuth 原生同步）＋Circleback 会议＋Twilio/OpenAI 电话（R1、T5、T6）。
- **架构上不绑定**
  - 接入方式是 markdown 写的配方。README 另外列了通用的邮件/日历 webhook，电话也写明可以换成自建的语音转写＋LLM＋语音合成（T6）。
  - 会议 skill 只是一段说明文字，改掉提到 Circleback 的那一句就能接别的来源。
  - 日历先落成本地文件，再用脚本查询（T3）。
- **现实中是 Google 优先**：原生连接器只有 Google，其他来源要自己写配方。我们可以用同样的模式接飞书日历和妙记：来源→本地镜像→实体回写，来源这一层可以替换。
