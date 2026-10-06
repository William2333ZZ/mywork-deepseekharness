# GBrain 仓库的设计（garrytan/gbrain master，2026-10-06）

# GBrain 设计提取（garrytan/gbrain，master 分支，2026-10-06）

下文路径都相对仓库根目录。仓库体积太大，没法完整克隆，所以我用 GitHub tree API 拉了文件树，再从 raw 地址下载了 310 个文档、技能和模板文件，外加 3 个源码文件。

## 1. 它是什么
- **形态**：用 Bun/TypeScript 写的命令行工具，同时是 MCP 服务。它给现有的 agent 加一套记忆：Markdown 页面库，加上 Postgres 索引，加上用 Markdown 写的技能，再加夜间维护（`README.md`）。
- **版本与日期**：版本 0.60.89.0（`VERSION`）。`CHANGELOG.md` 最新条目日期是 2026-10-06。仓库建于 2026-04-05，MIT 协议。
- **作者自述**：Garry Tan（YC 总裁兼 CEO）说这是他 OpenClaw/Hermes 的生产记忆库，规模为 155,795 页、24,589 个人物页、5,340 个公司页、66 个定时任务（`README.md`）。
- **起因**：agent 跨会话失忆；同一个实体被重复建页（`docs/ethos/ORIGIN.md`）。
- **目标原话**："Give the agent you already use a memory you control."（`README.md`）
- **推荐路径**：现在首推给已有 agent 加一个无需 API key 的记忆。24/7 服务器加夜间 dream 才是原设计用法，但成本最高（`README.md`）。

## 2. 数据模型
**页面种类**
- `README.md` 和 `docs/architecture/type-taxonomy.md` 说默认包 gbrain-base-v2 有 15 种：person、company、media、tweet、social-digest、analysis、atom、concept、source、deal、email、slack、writing、project、note。子类型写进 frontmatter。
- 代码里的包文件 `src/core/schema-pack/base/gbrain-base-v2.yaml`（v1.3.0）实际定义了 20 种，多出 account、meeting、conversation、event、diary。文档和代码不一致。
- 用户可以用 `gbrain schema detect`、`suggest`、`review-candidates` 三条命令建自己的类型。

**目录结构**（`docs/GBRAIN_RECOMMENDED_SCHEMA.md`）
- 目录：people/ companies/ deals/ meetings/ projects/ ideas/ concepts/ writing/ org/ personal/ hiring/ sources/ inbox/ archive/ 等。
- 每个目录有一个 README.md，写明这里放什么、不放什么。顶层有 RESOLVER.md 作为归档决策树。
- 原则是一个实体只有一个主页面，各目录互不重叠。放不进任何目录的内容进 inbox/，这本身是"该改分类了"的信号。

**一页的格式**（`docs/guides/compiled-truth.md`）
- 上半部分是 compiled truth（当前结论），每次有新信息就整段重写。
- 下半部分是 timeline（时间线），只能追加，不能修改。写错了就追加一条 Correction。
- 分隔符首选 `<!-- timeline -->`。单独一行 `---` 只有在下一行是 `## Timeline` 时才算分隔符。
- 但 `GBRAIN_RECOMMENDED_SCHEMA.md` 仍写"用 `---` 分隔"，两份文档不一致。
- **人物页**各节：State / What They Believe / What They're Building / Motivates / Communication Style / Assessment（含 Confidence 和 Last assessed）/ Trajectory / Relationship / Open Threads。
  - 没内容的节写 `[No data yet]`，作为下次补全的提示。
  - 观点必须标注来源类型：observed / self-described / inferred。
- **会议页**：Summary / Key Decisions / Action Items / Notable Quotes，再加单独一行 `Attendees:`（`skills/meeting-ingestion/SKILL.md`）。
- 外部 API 的原始返回存到 `people/.raw/<slug>.json`。

**页内结构化数据**
- 页内还有 `## Facts` 和 `## Takes` 两个围栏表（`docs/architecture/system-of-record.md`）。
- facts 是"热记忆"：主人在对话中说的事件、偏好、承诺、信念等。
- takes 是"冷存储"：谁持什么观点，带持有人和权重。
- 夜间 dream 的 consolidate 阶段把 facts 单向提升为 takes（`docs/takes-vs-facts.md`）。

**引用写法**
- 每条事实都带 `[Source: 谁, 渠道, 日期 时间 时区]`，compiled truth 部分也不例外。
- 推文引用必须带 URL。两个来源冲突时两条都保留。
- 来源优先级：用户本人 > 会议、邮件等一手来源 > API > 网页 > 社交媒体（`docs/guides/source-attribution.md`、`skills/conventions/quality.md`）。

**链接写法**
- `[[people/x]]` 或 `[text](slug)`。
- 不调用模型，按句子上下文推断出 attended / works_at / invested_in / founded / advises 等带类型的边（`docs/architecture/RETRIEVAL.md`）。包文件里还有 owes_to、awaiting_reply_from、supersedes。
- 边分两类：会结束的"状态"和发生在某天的"事件"（`docs/guides/temporal-edges.md`）。
- 反向链接是硬规则：页面提到某实体，就要在该实体页的时间线上追加一条回链。

**frontmatter 字段**
- 字段：type、title、tags、aliases（拼写变体、邮箱、各平台账号都收）、visibility、attendees、date / event_date / published、subtype / legacy_type、unverified_claims、untrusted_directives。
- slug 由文件路径推出（`skills/frontmatter-guard/SKILL.md`）。
- frontmatter 里的标量值不进搜索索引，需要被搜到的值要在正文再写一遍（`GBRAIN_RECOMMENDED_SCHEMA.md`）。

## 3. 存储和检索
**存储**
- Markdown 仓库是文件类知识的真源，数据库只是可重建的索引（`gbrain sync && gbrain extract all`）。
- 只存在数据库里的页面、修订历史、撤回账本需要单独备份数据库。多台机器之间靠 git 同步（`system-of-record.md`）。
- `GBRAIN_RECOMMENDED_SCHEMA.md` 却写成 Markdown 由数据库生成，与此矛盾。
- 两种引擎：PGLite（WASM 版 Postgres 17，默认，适合约 5 万页以内）；或 Postgres + pgvector（`README.md`）。

**检索**
- 组成：pgvector 的 HNSW 向量检索、tsvector 关键词检索、按页做 RRF 融合、Voyage rerank-2.5 重排、关系图检索。分 conservative / balanced / tokenmax 三档（`docs/guides/search-modes.md`）。
- `search` 只返回原始页面；`think` 给出带引用的答案，并写明"库里还不知道什么"。
- 七个记忆动词：recall / remember / entity / synthesize / forget / context_pack / delta（`README.md`）。

**brain-first 规则**（`docs/guides/brain-first-lookup.md`）
- 查找顺序：关键词 search → 混合 query → 直接猜 slug → 都没有才调外部 API。
- bootstrap 生成的 AGENTS 模板把它写成每条消息都要过的关卡（`templates/bootstrap/AGENTS.md.template`）：
  - 消息里每个实体都先查库。
  - 关于记录的断言必须是本轮检索到并引用的，否则标 `(inference, unverified)`。
  - 问用户之前先走完查找链。
- 另有不调模型的每轮实体指针注入（`recipes/retrieval-reflex.md`）。

## 4. 收进来（ingestion）
**会议**
- 现成配方绑定 Circleback：用 API token，工作日每天同步 3 次（`recipes/meeting-sync.md`），或用它带 HMAC 签名的 webhook（`docs/integrations/meeting-webhooks.md`）。
- meeting-ingestion 技能本身声明支持任意录音工具：先把输入归一成标准转写记录，字段有 source / source_id / title / date / attendees / transcript_segments / raw_transcript_text / source_summary。各厂商的专用逻辑到归一化这一步就结束。

**邮件、日历、联系人**
- 原生的 google 数据源：用户自建 OAuth 客户端，只读权限，token 存在本机 `~/.gbrain/credentials.json`（`docs/guides/google-connect.md`）。
- 备选 ClawVisor 凭据网关（`recipes/credential-gateway.md`）。
- 离线用 Google Takeout 导出：日历 ICS、邮件 mbox、联系人 CSV（`skills/cold-start/SKILL.md`）。
- Outlook 只有爬取 .pst 归档一条路（`skills/archive-crawler/SKILL.md`）。
- 我没找到 Outlook、CalDAV、IMAP、飞书、钉钉的实时接入。

**推文**：X API v2 的 Bearer token，每月 0–200 美元（`recipes/x-to-brain.md`）。

**语音**
- 语音通话：OpenAI Realtime 走 WebRTC，可选接 Twilio 电话（`recipes/agent-voice.md`）。
- 语音笔记：用宿主 agent 给的转写，或自己用 Groq / OpenAI Whisper 转写，原话不改写（`skills/voice-note-ingest/SKILL.md`）。
- 短信和电话：Quo（OpenPhone）的 webhook。

**AI 对话记录**
- `gbrain transcripts ingest` 读取 Claude Code、Codex、OpenClaw、Hermes、Grok Build 的会话，以及 ChatGPT 的 conversations.json 导出，写入前按正则脱敏。
- `gbrain connectors` 粘贴浏览器 cookie 来同步 ChatGPT / Claude 历史（`docs/guides/data-ingestion.md`）。

**文件和随手记**
- `gbrain capture` 默认落到 `inbox/日期-hash`。
- `~/.gbrain/inbox/` 投放文件夹，可接 iOS 快捷指令、AirDrop、Drafts。
- `POST /ingest` webhook，可接 Zapier / IFTTT。
- 支持从 Obsidian / Notion / Logseq / Roam 迁移，以及 RSS、PDF、视频。
- 第三方可以按 `IngestionSource` 契约自己写数据源。

**会议收入的步骤**（`skills/meeting-ingestion/SKILL.md`）
1. 归一成标准转写记录。
2. 一段录音里如果有多场会，先拆开。
3. 跨录音工具去重：日期相差不超过 1 天，且与会者重合 ≥50%。
4. 按证据认人，不猜；认不出就写 UNKNOWN。
5. 建会议页。
6. 核验断言：要有转写原话支撑，要与库里已有事实对比，要合理。
7. 对每个与会者跑 enrich。
8. 在相关实体的时间线上加回链。
9. 核对清单通过，才算收完。

原始转写存到 `sources/meetings/…-transcript`，存之前先脱敏。

## 5. 维护（夜里跑什么）
**`gbrain dream`**
- 核心顺序：lint → backlinks → sync → synthesize → extract → patterns → embed → orphans（`skills/maintain/SKILL.md`）。
- 全部 26 个阶段在 `src/core/cycle/phase-table.ts`，包括 consolidate、edge_contradictions、drift、enrich_thin、purge 等。

**频率**（参考 `docs/guides/cron-schedule.md`）
- 邮件、X：每 30 分钟。
- 会议：工作日每天 3 次。
- 日历：每周。
- 晨报：每天。
- 体检：每周。
- dream：每晚，示例是凌晨 2 点。
- HEARTBEAT 模板里每 15 分钟跑一次 sync + embed。

**synthesize 阶段**
- 先用便宜模型给每份转写打 0–1 分，阈值 0.5，过了才花钱派子任务写页。
- 写完后有一个不调模型的 quote_verify 核对：
  - 被改写过的引语换回原文。
  - 找不到出处、跨了说话人、张冠李戴、或数字日期原文里没有的句子，从正文移到 frontmatter 的 `unverified_claims`。
  - search、recall、think 都不读这个字段。
- patterns 阶段：30 天内至少 3 条反思支持，才写成"模式"页。

**防止写错**（maintain SKILL）
- 子任务只能写 `_brain-filing-rules.json` 白名单里的路径，即使被提示注入也写不出去。
- MCP 不能提交子任务。
- 按（路径，内容哈希）保证重复运行无副作用。
- 默认排除含 medical / therapy 的转写。
- 12 小时冷却。
- 24 小时内失败 3 次就熔断。
- 不自动 git commit。

**其他维护规则**
- 检查项：compiled truth 比最新时间线还旧（视为过期）、孤立页、死链、缺反链、引用审计。
- 合并重复页的流程：选一页保留，合并时间线和别名，改所有引用，提交信息写 `merge: X into Y`（`GBRAIN_RECOMMENDED_SCHEMA.md`）。
- 外部 API 返回的账号连接数小于 20，或姓氏对不上，就只存进 .raw，不写到页面上；理由是错的数据比没有数据更糟。

## 6. 技能、RESOLVER、SOUL
`skills/` 下共 75 个技能，每个一句话：

**脑操作**
- brain-ops：读写主循环
- query：检索并给出带引用的综合答案
- enrich：按重要程度分级补全人物和公司页
- repo-architecture：新文件放哪
- brain-taxonomist：按当前分类包定路径
- eiirp：一次工作结束后归档整理
- citation-fixer：修引用格式
- data-research：用 YAML 配方从邮件等抽结构化数据
- publish：页面导出成加密 HTML
- frontmatter-guard：校验和修复 frontmatter
- data-loss-gate：删除前确认
- fact-check：逐条核实声明
- resolve-before-asking：问人之前先查
- brain-ingest-gate：入库前的质量门
- correction-pipeline：用户纠错后追溯并修源头
- company-brainify：从个人库提取去敏的团队库
- citation-graph-ingest：建带类型的引用图
- brain-link-discipline：汇报页面时同一条消息里附可用链接
- research-compendium：把一个主题深研成汇编页
- article-enrichment：文章原文转结构化页
- brain-pdf：页面转 PDF
- schema-author：增改页面类型
- schema-unify：统一到 base-v2 类型

**收入**
- capture：一条命令存内容
- idea-ingest：链接、文章、推文、想法
- media-ingest：视频、音频、PDF、书、截图、代码仓库
- meeting-ingestion：会议转写
- ingest：按内容类型分派
- two-tier-extraction：便宜模型分拣，强模型精读
- bulk-ingestion：大批量导入
- blog-ingest：整个博客或 RSS
- conversation-archive：AI 对话导出
- chat-connectors：在线同步 ChatGPT / Claude 历史
- voice-note-ingest：语音笔记
- archive-crawler：个人归档，需白名单

**研究**
- book-mirror：书按章节对照到个人生活
- strategic-reading：带着一个具体问题去读
- concept-synthesis：概念去重并分层
- idea-lineage：一个想法的演变
- perplexity-research：联网研究，只报库里没有的新东西
- academic-verify：学术声明溯源

**运行**
- daily-task-manager：任务管理
- daily-task-prep：晨间准备
- briefing：日报
- google-loops：Google 接入和"谁在等你"
- cron-scheduler：排班和静默时段
- gbrain-advisor：定期给改进建议
- reports：报告存取
- skill-creator：新建技能
- skillify：把功能做成带评测的技能
- skill-optimizer：用基准自动改技能文本
- functional-area-resolver：压缩路由表
- skillpack-check：安装健康检查
- skillpack-harvest：把宿主技能回收到上游
- smoke-test：重启后自检
- db-repair：修数据库
- cross-modal-review：换一个模型复核
- testing：技能校验和测试健康
- webhook-transforms：外部事件转成信号
- minion-orchestrator：后台作业和子代理
- ask-user：给选项并等用户回复
- measure-before-you-fix：先计时再修
- draft-in-voice：按某人语气代写
- context-audit：常驻上下文瘦身
- skill-autobench：从真实使用记录生成评测

**安装与迁移**
- setup：给现有 agent 加记忆
- mcp-access：MCP 客户端和权限管理
- cold-start：首日导入数据
- postgres-adopt：迁到 Postgres
- remote-mcp：经 Tailscale 发布
- migrate：从其他笔记工具迁入
- maintain：体检和 dream
- gbrain-upgrade：升级
- soul-audit：重做身份访谈
- signal-detector：开启后每条消息捕捉想法和实体

另有 4 个随配方附带的技能：voice-persona-mars、voice-persona-venus、voice-post-call、retrieval-reflex。

**RESOLVER**（`skills/RESOLVER.md`）
- 每个技能 frontmatter 里的 `triggers:` 是权威路由信号；RESOLVER.md 是给人看的总表，两者冲突以 frontmatter 为准。
- 多个技能都匹配时：选最具体的；有 URL 就按内容类型分；拿不准就走 ask-user。
- 还会路由到外部 GStack 的 office-hours / ceo-review / investigate / retro。

**SOUL**（`templates/bootstrap/SOUL.md.template`）
- 内容全部来自对主人的访谈，禁止编造。
- 基调：粗心是头号大罪；说真话优先于安抚情绪；不知道就先说"不知道"；有观点不含糊；没验证不说做完；不叙述自己在走哪个技能。
- 口吻按项填写：语域、长度、格式、脏话、幽默、禁用语。
- 简版模板 `templates/SOUL.md.template`：直接，先给结论，引用来源，坦白缺口。

## 7. 多人访问、权限、隐私
**远程调用者受到的限制**（`docs/architecture/brains-and-sources.md`）
- OAuth 权限分 read / write / admin / agent。
- 没有某个 source 授权就读不到它。
- facts 分 private / world，远程只能看到 world。
- 页面写 `visibility: private` 对远程隐藏。
- 写入可以限定在某些 slug 前缀下。
- takes 按持有人设白名单。

**作者自己写明的边界**（`README.md`）
- 共享本机文件或数据库凭据的人，不受 source 隔离约束。
- 测试只覆盖特定访问路径，不等于保证不泄露。

**只留在本机的东西**
- `gbrain.yml` 里标为 `db_only` 的路径自动 gitignore；远程读取时剥掉私有 facts 和整个 takes 围栏（`system-of-record.md`）。
- Google token 和聊天 cookie 以 0600 权限存本机。
- 会话转写语料存在仓库外，权限 0700，定期清理（`templates/bootstrap/ACCESS_POLICY.md.template`）。
- 检索结果里形似凭据的值替换成 `<REDACTED:…>`（`data-ingestion.md`）。
- 但配置了云端 embedding、重排、综合时，文本会发给这些服务商（`docs/guides/memory-boundaries.md`）。

**其他**
- ACCESS_POLICY 把访问者分成 Full / Work / Family / None 四档，模板自己承认这只是提示层策略（`templates/ACCESS_POLICY.md.template`）。
- company-brainify 生成团队库时，会剥掉内部评价、薪酬、绩效、去留和政治相关内容。
- 自动写回只在个人库上问一次；团队库从不主动提示开启（`docs/guides/ambient-writeback.md`）。

## 8. 人在环
**需要人确认的事**
- 批量删除：先出一张可恢复性说明卡，等用户明确说"yes"（`skills/data-loss-gate/SKILL.md`）。
- `doctor --remediate`：须用户同意，用 plan_hash 绑定这次同意，并用 `--max-usd` 设花费上限。
- 新增分类类型：要人工审核通过。
- 会议的叙述顺序有矛盾时，阻断收入，直到修正或用户明确豁免。
- 新说法与库里已有事实冲突时，默认旧的赢，并报告给用户。
- 短信回复只起草，等用户批准。
- 定时任务出厂全部关闭，一次只开一个（`templates/bootstrap/HEARTBEAT.md.template`）。
- 自动捕捉、付费补全、dream 都要单独开启。

**撤销和审计**
- 页面可以回退到旧版本，回退会生成新的修订号（`docs/guides/concurrent-writes.md`）。
- 写入归因：每个修订、每条 fact、每行时间线由谁写，都可以用 `gbrain attribution` 查。
- forget 先写入撤回账本；Markdown 里保留删除线。
- "谁在等谁"的未结事项只靠状态变化关闭，不删除（`docs/guides/open-loops.md`）。
- 类型合并时保留 legacy_type；被合并的页面软删，72 小时内可以 `gbrain restore`（`docs/architecture/type-taxonomy.md`）。
- 抓进来的外部文本一律当数据看；里面像指令的段落包进 `untrusted-quoted` 围栏（`skills/conventions/untrusted-content.md`）。

## 9. README 和 docs 写明的限制
- Markdown 导出不是完整备份。
- 远程 MCP 写入不会即时抽取图上的边；HTTP 模式的服务不会自动跑维护扫描（`memory-boundaries.md`）。
- data-loss-gate 和 correction-pipeline 只是路由约定，运行时不会强制拦截。
- 语义结果缓存暂时停用；v0.48.3.0 之前建的库要重建分块（`README.md`）。
- 桌面版的定时任务只在 agent 打开时才触发；Codex 没有逐轮 hook；兜底抽取出来的事实不会自动过期（`ambient-writeback.md`）。
- 全文检索一个库只能用一种语言；中日韩查询退化成逐词 ILIKE 匹配（`docs/guides/multi-language-fts.md`）。
- 聊天 cookie 同步常被 Cloudflare 返回 403（`docs/guides/chat-connectors.md`）。
- dream 不会自动 commit。
- 文档之间有不一致：时间线分隔符、Markdown 与数据库谁是真源、页面类型数量（15 还是 20）。

## 10. 【推论】用到 CTO 的幕僚数字同事上
**最该借的**
1. 一个实体一页，上面是可重写的结论，下面是只追加的时间线，每句带 `[Source]`。CTO 问"现在怎样"就读上面，问"凭什么"就读下面。
2. 按来源类型定一个归一化记录作为契约：会议用标准转写记录，日程用 ICS 式事件，邮件按线程。飞书妙记、钉钉、Teams、Zoom、手记各写一个薄适配器。GBrain 原生只接 Google 和 Circleback，这一层得自己建。
3. 先查自己的库，再问人：问 CTO 之前先查库和日程，查找链走完仍不清楚才问。
4. 录音工具的摘要当作"声明"而不是"事实"：重大变动必须有原话支撑；与已有事实冲突时旧的赢并提醒；没核实的句子隔离起来，不扩散到其他页面。
5. 代码收数据，模型做判断：用确定性规则判断"谁在等 CTO / CTO 在等谁"，模型只抽承诺并附原文；事项靠状态变化关闭，不删除。
6. 夜间任务的护栏照搬：先用便宜模型打分再花钱；按内容哈希保证重复运行无副作用；写入路径白名单；敏感词排除；冷却、熔断、花费账本。
7. 安静规则：大多数检查不出声；任务默认关闭、逐个开启；静默时段的输出积压起来并进晨报。
8. 能撤销、能审计：版本回退、写入归因、撤回账本、删除确认卡。但要做成运行时强制，而不是像 GBrain 现在这样只是约定。

**不该照搬的**
- 给同事和下属写 Assessment、Motivates 这类画像，并调外部人肉搜索 API。这在公司里属于人事敏感内容，GBrain 自己生成团队库时也要剥掉。
- 绑定 Google、Circleback、X 付费 API，以及靠 cookie 抓取；facts 默认对所有授权 agent 可见。
- 75 个技能、26 个阶段、66 个定时任务、多层的 facts / takes / atoms 体系、Postgres 运维。对一位 CTO 的单人幕僚太重。
- 默认的英文全文检索：中文内容要换分词器，或者主要依靠向量检索。
- 每条消息自动捕捉：GBrain 自己也默认关闭，应先问过 CTO。
