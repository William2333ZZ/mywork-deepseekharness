# 代码研究 · 跟进 AI 进展 · 研究流程 · 公司推 AI（四篇原文提取，2026-10-05）

四个页面都已用 curl 抓到全文。另外顺带抓了 Simon 文中提到的 simonw/research 仓库里的 AGENTS.md，这是 2026 年的现行版本，可能和 2025 年 11 月写文章时的版本不一样。下面所有内容都只来自原文。

---

## 1. Simon Willison：用异步 coding agent 做代码研究（"Code research projects with async coding agents"）

**作者和日期**：Simon Willison，2025-11-06。

**工作流步骤**
- 选一个"写代码、跑起来就能回答"的问题（他叫 "code research"），把明确的目标写成 "a few paragraphs of prompt"。
- 用的工具：异步 agent，包括 Codex Cloud、Claude Code for web、Jules、Copilot coding agent。发出去以后 "check back ten minutes later"。可以在手机上发起。某个任务失败过一次后，他改用本机的 Claude Code 重跑。
- 频率是每天 "2-3 code research projects"，两周做了 13 个。
- 产出放在专用 GitHub 仓库里，一公一私（公开的是 simonw/research），每个项目一个文件夹。agent 跑完以 PR 或 commit 的形式交付。commit 记录里通常附 prompt，有时也附 transcript。
- 怎么组织：
  - 一个 GitHub Workflow 调用 GitHub Models 加 Cog/LLM，每次新增项目都自动更新 README 里的项目摘要。
  - 仓库里的 AGENTS.md 规定：每个项目新建文件夹，边做边往 notes.md 追加笔记，最后写 README.md 报告；只提交自己写的代码和 diff，不复制别人的整个仓库；不写 `_summary.md`（这个文件会自动生成）。
- 项目之间可以互相借用，新项目能建立在旧项目之上（例如 cmarkgfm-in-pyodide 就复用了之前 node-pyodide 的成果）。
- agent 中途放弃时，人用一句追问推它继续，例如 "actually run emscripten, I do not care how long it takes"，或者换一个思路让它重写。

**分工**
- 人负责：提出问题，写 prompt 和约束（"只在这个文件夹里改"、"没跑通测试不许 commit"），卡住时推一把，决定哪些内容可以发出去。
- agent 负责：自己搜索候选对象（只给了 cmarkgfm，另外 6 个库是它自己找的），clone 代码、读源码、设计并运行 benchmark、画图、写报告、提交。

**怎么核对 / 没审过的产出怎么处理**
- 核对靠运行结果："the code itself doesn't lie"。代码跑通就证明了"可行"，但证明不了"不可行"。
- prompt 里要求测试通过才能提交。
- 没审过的内容他直接承认 "This is total slop, of course"（他对 slop 的定义是没经人审就发布的 AI 内容），这些报告他自己没细审。
- 处理方式是全部隔离在这一个仓库里，不经 "serious editing and verification" 不会拿到别处发布。他还希望 GitHub 能给这类仓库加 noindex，不让搜索引擎收录。

**作者明说的限制**
- agent 证明不了某件事做不到。
- agent 会忽略部分指令（例如要求的 HTML 可视化页面没做）。
- 会半途放弃，比如嫌 emscripten 编译太久。
- 没有网络时第一次尝试直接失败。
- 安全上，只能在非敏感的专用仓库里放开网络，否则有 "lethal trifecta" 式的 prompt injection 风险。

**做成长期数字同事，最少需要**
1. 一个隔离、可联网的独立工作区，坏了不心疼。
2. 能从手机发起、异步回报的任务入口。
3. 每个任务一个目录，里面有 notes 和 report，并把 prompt、transcript 和产出关联起来。
4. 以"可执行验证通过"作为完成标准。
5. 所有项目有一个自动维护的总索引和摘要，后续项目能复用前面的成果。
6. 卡住的任务能被追问、接着做。
7. 明确标出"未经人审"的状态，并把这类内容隔离存放。

---

## 2. Atharva Raykar（nilenso）：How I keep up with AI progress

**作者和日期**：Atharva Raykar。URL 上的日期是 2025-06-23，页面标注 "Last Updated: 30th June 2025"。

**工作流步骤**（全文都是人自己的信息摄入方式，没有用到 agent）
- 原则一："Stay close to the source"，并且 "Always assume that all reporting is wrong by default, unless it's coming from the primary source"。
- 原则二：只跟真诚、有好奇心的个人看评论。
- 信源分层：
  - 入门：Simon Willison、Karpathy、Every 的 Chain of Thought。
  - 各大实验室（OpenAI、DeepMind、Anthropic、DeepSeek、Meta、xAI、Qwen）的发布文、工程博客、cookbook、system card、论文。
  - 偶尔看小实验室（Nous、Allen AI 等）。
  - 一批 high-signal 个人（Hamel、Shreya、Eugene Yan 等）。
  - 新闻：Twitter/X；不用 Twitter 的话看 smol.ai 的 AI news，它会汇总各平台的讨论并做摘要；再加 Dwarkesh 的播客。
  - 小众：LessWrong、Gwern、在模型边界做探索的 prompt 实验者。
- 有人抛出耸动说法时，"bypass the person making the claim and read it straight from the source, with the surrounding context"。
- 频率：每天像读报纸一样刷 Twitter feed，大约 "15 to 20 minutes"（他说自己没计过时）。看到感兴趣的内容就开个标签页留着以后读。发现谁分享了好东西，就关注这个人并翻他的其他作品，"像发现音乐一样"。
- 产出放在哪：一个 Twitter/X list；RSS 版本写着 "Coming soon"。文中没有提到笔记或存档。

**分工**：人做全部工作。文中唯一接近 agent 的环节是 smol.ai 替人做跨平台汇总和摘要。

**怎么核对 / 没审过的产出怎么处理**
- 默认二手报道是错的，必须回到一手来源并连同上下文一起读。
- cookbook 只当起点："Your own experience of putting AI capabilities into production backed by data trumps everything"。
- 没细看的内容是略过，或者留在标签页里以后再读。

**作者明说的限制**
- 现在是 "most polluted information environment"。
- Twitter 可能很 toxic。
- cookbook 不一定是最佳做法。
- 小实验室的技术深度他缺乏前置知识，读不太懂；Gwern 的大部分文章他也没读。

**做成长期数字同事，最少需要**
1. 一份分层、标了信任度、用户可以编辑的信源清单。
2. 每天一份 15 到 20 分钟就能读完的速览，外加一个"稍后读"队列。
3. 把任何说法追溯到一手来源（发布文、system card、论文），附上原文上下文；没溯源的标为"未核实"。
4. 关注关系扩展：发现某人分享了好东西，就建议把他加入信源，并梳理他过去的作品。

---

## 3. Neel Nanda：How I Think About My Research Process: Explore, Understand, Distill

**作者和日期**：Neel Nanda，2025-04-26，发在 LessWrong / AI Alignment Forum，是一个系列的第 1 篇。

**说明**：这篇讲的是人做研究的流程，几乎不涉及 agent。AI 只出现在两处：
- 文献综述用 "Google/OpenAI Deep Research is invaluable for literature reviews"。
- 这篇文章本身由 Gemini 2.5 Pro 共同撰写，方式是把 "200K tokens of past blog posts and a long voice memo" 放进上下文。

**工作流步骤**（四个阶段，可以回退，文中没给日历式的频率）
1. **Ideation 选题**：靠导师给题，或者复现并扩展一篇已有论文；用 Deep Research 做文献综述，弄清已经知道什么、还有什么没解决。
2. **Exploration 获取信息量**：北极星是 "gain information"。大量做实验、用多种方式可视化、追求快速反馈；经常问自己 "am I getting enough information per unit time?"。关键做法是维护一份 "highlights doc"，记下有意思的结果，方便发现它们之间的联系。
3. **Understanding 检验假设**：把假设写下来，设计能区分不同假设的实验；经常问 "what am I learning and is it relevant?"。
4. **Distillation 压缩与沟通**：把成果压缩成几条范围明确的 claim，为每条整理出足以说服怀疑者的证据，做 red-team，然后写成文字（"Write to inform, not persuade"）。他建议在截止日期前一个月就开始写。

**分工**：研究品味、实验设计、判断什么时候转向，都是人的事。AI 只负责文献综述和起草文稿。

**怎么核对 / 没审过的结论怎么处理**
- 核心是 "a deep commitment to skepticism of your results"：主动找其他解释，设强 baseline，查 bug。
- 到 Distillation 阶段门槛更高，要能说服怀疑的外人：做 sanity check、保证统计稳健、做 red-team。
- 发现情况比想的更乱时，要承认，并退回到 Understanding 甚至 Exploration 阶段。

**作者明说的限制**
- "This isn't the definitive way"，可能不适用于别人；主要针对 mech interp 和反馈周期短的实证科学。
- 新手常把探索阶段误当成理解阶段，没有明确下一步就焦虑。
- 只为了被会议录用而写论文，会扭曲选题和证据的选择。

**评论区**：有人把这篇提炼进自己的 Cursor User Rules / system prompt，用来引导 agent 做研究，但承认还没有系统测试过效果。

**做成长期数字同事，最少需要**
1. 知道每个项目处在哪个阶段（探索、理解、提炼），并据此调整行为。
2. 自动维护 highlights doc 和假设清单，每条假设记下支持和反对的证据。
3. 能提出可以区分不同假设的实验。
4. 定期检查"最近学到东西了吗"，提醒用户可能陷进兔子洞了。
5. 对结论做 red-team，并压缩成几条 claim，每条附证据和局限。
6. 能做文献综述。
7. 允许退回到前面的阶段。

---

## 4. Will Larson：Facilitating AI adoption at Imprint（lethain.com/company-ai-adoption）

**作者和日期**：Will Larson。页面元数据日期是 2025-12-07，正文说他已经做了约 18 个月。

**领导者亲自做的事**
- **先建立直觉**：读 Chip Huyen 的《AI Engineering》，然后做几个有边界的小项目，每个 "two to ten hours"：
  - 用 Claude Code 搭一个简陋的 agent 平台；
  - 做一个搜索自己博客的 MCP；
  - 做一个给 Notion 文档写评论的 agent。
  - 他的原话："Tool use ... seemed like magic until I implemented a simple tool-using agent"。
- **和高管层一起定策略**，三条支柱：
  - 铺平道路，比如不用再单独申请权限；
  - 所有职能都有机会用上 AI；
  - "Senior leadership leads from the front"。
  - 采用 strategy testing，在细节里快速迭代。
- **整理技巧**：把全公司的 tips & tricks 收集到一个 Notion 数据库里，人和 bot 都会查。
- **集中管理 prompt**：每个 agent 的 prompt 都放在一个全员可读的 Notion 数据库里，大多数人人可编辑。几乎每个 prompt 都要求输出里附上 prompt 本身的链接，这样从一条平庸的回复能直接找到驱动它的 prompt 去修。
- **统一平台**：全员用 OpenAI，入职第一天自动开好账号；工程团队另配 Cursor 和 Claude（Claude Code 通过 AWS Bedrock 使用）。
- **看用量**："at least once a month"。看两件事：重度用户实际在做什么、为什么觉得有用；不用的人为什么不用（他认为这些人是 "rational non-adopters"）。
- **亲自写内部 agent 平台**：一个无状态 Python lambda，约 3000 行。
  - 推广的公式不是 "build a platform and they will come"，而是：找一个痛点大的 workflow，和领域专家一起把第一版做通，让使用团队自己能扩展，再用采用率检验是否对题。
  - 已经跑起来的场景：配好 AGENTS.md 写代码、客服 chat/IVR、工单分诊、Slack 频道答疑、合规初步答复、从 Git commit 和 Slack 拉材料写每周优先事项。

**分工**
- 人：领域专家负责并共同编辑 prompt；领导者负责平台、配置和用量复盘。
- agent：分诊、路由、回复、评论、汇总周报。

**怎么核对**
- agent 配置放在要 code review 的 Git 仓库里，静态类型，通过测试、lint 和类型检查后自动部署。prompt 由 Notion 做版本管理，敏感场景可以强制放进 Git。
- 每条回复都有一道 "final mandatory check"，确认里面引用的 Slack/Notion 实体真实存在。如果有不存在的，就把无效项写回上下文，再跑一轮只开放实体解析工具的循环。他说 "only at this point that things really started working consistently"。
- 格式问题他打算再加一道类似的校验步骤。
- 所有工具调用都写进 Datadog，同时推送到 Slack 的 #ai-logs 频道，让非工程师也能看到。

**作者明说的限制**
- "This isn't a recommendation about what you should do"，只是他自己的做法回顾。
- 最怕的是只做出 "the impression of adopting AI"。
- 工具开放太多，工作流就不可靠：exit_early 容易把 bot 弄坏，slack_chat 可能刷屏。工具越强，安全问题越复杂。
- 大多数 "AI tools" 只是营销里提到 AI 的 SaaS。
- Zapier 精度不够。
- 学习曲线 "meaningfully high"。
- 最大缺口：还没有一个平台能让非工程师得到相当于本地 Claude Code 加个人 MCP 的体验；Claude Desktop 配置起来乱；也不放心把内部数据交给很早期的公司。
- 结论：现在要重视 "rate of learning"；领导者 "must be using the tools ... building your own tool-using agent using only an LLM API"。

**做成长期数字同事，最少需要**
1. 指令和 prompt 对团队可见、可编辑，每条产出都链接回驱动它的指令。
2. 每个同事有自己的工具白名单，比如限定能发言的频道。
3. 发出前强制校验引用的实体和格式。
4. 一份非工程师也能看懂的活动日志。
5. 能被事件触发（新文档、新工单、新消息），也能按计划做汇总（例如每周优先事项）。
6. 能接入用户自己的 MCP 和数据源。
7. 有采用情况的复盘数据。
