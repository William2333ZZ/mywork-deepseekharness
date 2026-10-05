# 交互形式调查：研究类产品

原始记录（2026-10-05）。每条说法以所附网址的原文为准。

## 形式

### 表格为单位（行是对象，列是问题）

- **骨架**：单位：一张表，每行一个对象（论文、公司、交易、文件），每列是要对每一行回答的同一个问题或要抽取的数据点；一列由列名加一段详细指令组成。开始：先有一批对象（检索来的论文、上传的文件、一组公司），再加列（点 Add column，或口头说加什么列）。过程：一格一格填，格子能点开看依据。交付：表本身（导出 CSV、RIS、Excel），再从表生成报告、演示或模型。后续：改列指令重跑、加行、把列存成预设到别的表复用。
- **例子**：Elicit（2026-09-30 前的 Extract Data；现在是 Research Agent session 里的产物）、Hebbia Matrix（格子里写日期、状态、口径和来源文件）、Consensus Research Gaps Matrix（变体：格子里是论文数量，点开看论文和让它入格的原句，空格直接转成一次 Deep 检索）、SciSpace 的 Extract Data、AlphaSense Generative Grid（只在平台页和发布文里见到名字）。
- **适合**：同一组问题要对很多对象重复问、结果要逐格核对和导出的工作：系统综述的数据抽取、尽调对比、comps。出处落在格子上，核对的成本可控。HN 用户推荐 Elicit 的免费替代品时特意说少了那张对比表 https://news.ycombinator.com/item?id=44662696 。
- **在哪里坏**：问题是开放式探索，而不是「对每一行问同一个问题」。Elicit 在 2026-09-30 把独立的表格工具并进 agent，表格从工作单位退成会话里的一种产物 https://support.elicit.com/en/articles/17220397-where-did-find-papers-extract-data-and-chat-with-papers-go 。表本身不会随时间更新，要靠 Project 或 Routine（Track artifact）才能延续。WSO 上的投行分析师说这类工具能帮人快速上手，但产不出能直接交给客户的东西 https://www.wallstreetoasis.com/forum/off-topic/ai-tools-in-finance-how-good 。

### 笔记本为单位（一组来源加对话加生成物）

- **骨架**：单位：一个笔记本，装着用户放进去的来源（文件、网址、视频字幕、云盘文件），旁边是对话和笔记，再旁边是一组生成按钮（音频、视频、思维导图、幻灯片、报告）。开始：把材料放进去，或者让它按一个问题去网上或云盘找来源、由用户勾选导入。过程：回答只基于选中的来源，每句带可点的引用。交付：对话回答、存成笔记的回答、Studio 产物。后续：继续往里加来源、把笔记转成来源、分享整本。
- **例子**：Gemini Notebook（原 NotebookLM）；秘塔的「专题」和「书架」；Wind Alice Reader（多文档问答）；local-deep-research 的 Library；Consensus Library（把参考文献库接进 agent）。
- **适合**：材料边界清楚、需要「原文哪里这么写」的工作：读一组规范或论文、准备会议、学习一本书。来源能勾选，回答不越出材料，整本可以共享给同事。HN tonymet 和 kazinator 的好评都落在「回答都基于来源」上 https://news.ycombinator.com/item?id=49884002 。
- **在哪里坏**：材料要靠人手工维护（Drive 自动同步是例外），笔记本不会自己发现新材料、不会定时运行，也没有跨笔记本的记忆。能点回原文不等于原文支持整句结论：数字、因果、限定条件最容易出错 https://www.v2ex.com/t/1231872 。网页只抓文字、YouTube 只抓字幕、脚注评论不进来，丢掉的部分后面再仔细也补不回来。Gemini Notebook 和 Gemini 应用里的 Notebooks 是两套并行入口，用户会混淆 https://news.ycombinator.com/item?id=48941669 。

### 报告为单位（一次性深度研究）

- **骨架**：单位：一个问题对应一份长报告，挂在一条对话里。开始：选深度研究模式，选来源范围（网页、上传文件、云盘、指定网站或期刊），提交。之后有三种做法：ChatGPT 和 Gemini 给出研究计划、可以改了再开始；Kimi 只做一次意图澄清；Perplexity 只有问题太宽时才问。过程：异步运行 3 到 30 分钟，可以离开，能看到搜索词、读过的网址或关键发现，完成后通知。交付：带目录和引用的长报告，导出 PDF、Word、Google Docs，有的另给一份可分享的网页版。后续：在同一条对话里追问。
- **例子**：ChatGPT deep research、Gemini Deep Research、Perplexity Research、Kimi 深度研究、秘塔「深度研究」、AlphaSense Deep Research、Elicit Research Report、Undermind Classic、gpt-researcher、local-deep-research。
- **适合**：一次性进入陌生领域、做选型、做政策或行业梳理。几位 HN 用户会把同一问题丢给三四家的深度研究再做对比 https://news.ycombinator.com/item?id=47037611 。Elicit Report 允许回头改筛选标准和抽取列再生成新版本，是这类里少见的可以改过程的报告 https://support.elicit.com/en/articles/14756862-get-a-research-report-to-generate-in-depth-answers-automatically-in-elicit 。
- **在哪里坏**：同一课题要做第二份、第三份时，每份都重写引言、重复已经查过的内容，没法接着上一份做 https://news.ycombinator.com/item?id=47246527 。只问一轮问题就跑半小时，问错了就浪费一次额度 https://news.ycombinator.com/item?id=46194231 。中途停下也照扣额度，Kimi 帮助页明确叫用户不要停 https://www.kimi.com/help/deep-research/deep-research-faq 。报告写法套路化 https://news.ycombinator.com/item?id=49741677 。开放网页的深度研究比只搜学术库的工具更容易编出不存在的论文（SMU 图书馆 Aaron Tay）。

### 智能体为单位（常驻，带着方法论，由事件或时间触发）

- **骨架**：单位：一个带着数据源、技能和用户方法论的 agent。开始：先配置一次（技能、覆盖的股票池、研究框架、写作风格），之后由事件（财报、公告、价格异动）或时间触发；也可以通过邮件或 IM 直接给它派活。过程：在后台跑。交付：备忘录、模型、演示、简报，主动推给人。后续：在它的历史里追问，它记得项目历史和人的习惯（厂商宣称）。
- **例子**：AlphaSense SuperAnalyst（标「Coming Soon」）、Hebbia Max（邮件派活，「把公司最好的流程变成自己运行的 agent」）、Rogo 的 agents、Fintool V5（后台 agent，已并入 Microsoft 365）、WindClaw、熵简 AlphaClaw、东方财富妙想 ClawBot 数字员工、Reportify 的「创建智能体」、Khoj 的自定义 agent。
- **适合**：覆盖池固定、节奏由市场事件驱动的金融工作：财报前对一致预期、每周按新信号重校模型、会前准备包。AlphaSense 的示例里有一个人机交接点：先把排好序的 2 到 4 个主要分歧交给人批准，再逐个深挖 https://www.alpha-sense.com/platform/superanalyst/ 。
- **在哪里坏**：本轮读到的几乎全是厂商页、新闻稿，或者尚未上线的产品，没读到任何一位使用者用了一段时间之后的评价。国内 2026-03 以来的「小龙虾」形态（WindClaw、AlphaClaw、妙想 ClawBot、进门工作台）大多基于 OpenClaw，交互细节只能从通稿推断。WSO 上有 PE 从业者说现在「全是障眼法」 https://www.wallstreetoasis.com/forum/off-topic/who-is-winning-the-ai-war-in-finance 。

### 项目或研究空间为单位（多次查询、多份报告、一个共享库，可以持续几周）

- **骨架**：单位：一个持久的工作区，围绕一个课题或一个标的，里面有多次查询、多份报告、一个论文或资料库，可能还有多个分工的 agent。开始：建项目，挂一个资料库或 collection。过程：在项目里开多个会话，会话之间能看到彼此的产物。交付：报告和表格都留在项目里，可以反复改。后续：新会话直接继承项目里的资料；进门的版本还给每个标的挂监测任务，把增量信息写回原有底稿。
- **例子**：Elicit Projects（session 之间互看产物，挂一个 collection，新存的论文默认进去）、Undermind Projects（检索和写作分 agent，多次查询合进 All Papers，agent 分文件夹）、进门 AI进宝研究模式（每个个股或赛道一个长期研究空间，有批注留痕、版本回溯、常态化监测）、Hebbia 的交易 Project。
- **适合**：持续几周的课题和长期跟踪的标的：资料不用每次重给，后加入的同事能看到团队依据的证据，而不只是最终结论（Elicit 帮助页原意）https://support.elicit.com/en/articles/15805744-elicit-projects 。进门的通稿把这一形态的卖点直接写成解决「单次问答、聊完即废」「每次深度研究都要重新梳理背景」 https://finance.sina.cn/2026-07-24/detail-iniiwvke4424572.d.html?vt=4 。
- **在哪里坏**：多出来的层级要多点几下；Aaron Tay 说有些难的检索问题用 Undermind Classic 反而更顺手、更可靠 https://library.smu.edu.sg/topics-insights/lost-ai-search-maze-heres-your-guide-choosing-right-tool-updated-september-2026 。共享项目不会自己出现在对方侧栏，只亮一个绿点，项目和它挂的 collection 还要分别共享（Elicit）。

### 订阅式定时研究（Routine、智能任务、研究订阅）

- **骨架**：单位：一条写好的指令加一个时间表或触发条件（或者从模板卡片里选一张）。开始：写一次，或者在已有会话里让 agent 帮你建，它先给出指令和时间表的提案，人改了再确认。过程：按时或按条件运行。交付：每次运行落成一个会话或一条消息，通过邮件或推送告诉人，点进去能核对来源、接着追问。后续：暂停、立即运行、归档、看运行历史。
- **例子**：Elicit Routines 和 Track artifact（每天或每周，邮件只发给所有者）、Reportify 智能任务（财报解读、个股日报、行业晨报、持仓周报、到价提醒加分析、异动说明，每张卡片展示一条样例消息和在用人数）、Undermind Keep up、local-deep-research 的研究订阅、Khoj Automations（邮件）、AlphaSense Alerts 和定时 Workflow Agents、豆包工作的定时任务、进门的任务模式。
- **适合**：输出形状固定、能提前给人看样例的场合。Reportify 在卡片上用灰框写出「你将收到的消息」，并写明送达时间（如「财报发布 30 分钟内」「明早 9:00」）https://reportify.cn/ 。Elicit 可以让定时任务更新同一份产物，而不是每次新生成一份。
- **在哪里坏**：只告诉你「有新东西」的提醒价值低。HN yorwba 说 Undermind 推来的论文只是新的、相关的，并不新颖 https://news.ycombinator.com/item?id=45220814 ；Elicit 用 Routine 取代 Alert 的理由就是 Alert 只能告诉你有新论文 https://support.elicit.com/en/articles/17220392-routines-in-elicit 。每次运行都花额度，Elicit 的周任务一个月约等于 4 次 session。共享的会话里只有所有者收到运行邮件。

### 搜索框加强度档位加来源范围（一次提问）

- **骨架**：单位：一次提问。开始：在一个输入框里选强度（快、深、深度研究）和来源范围（全网、学术、文库、播客、指定期刊），提交。交付：带脚注的摘要，深的模式给报告和思维导图。后续：追问；靠历史记录找回。
- **例子**：秘塔（简洁、深入、深度研究；全网、文库、学术、图片、视频、播客）、Perplexity（Search、Research，以及生成文件的模式）、Consensus（快速和 Deep，加期刊、研究设计等过滤器）、同花顺问财、Reportify 的模式标签（投资分析、量化选股、文档搜索）。
- **适合**：一次性问题，门槛最低，限定来源一步完成。
- **在哪里坏**：没有项目，没有延续，要靠历史记录。测评者说秘塔的索引量不够，冷门内容直接找不到 https://aitoolstar.cn/metaso-ai-search-review/ 。

### 装进通用编程智能体的技能包（项目目录就是工作区）

- **骨架**：单位：用户自己的项目目录加一组斜杠命令。开始：在 Claude Code 或 Codex 里敲命令加参数。过程：终端里长时间运行，可以让多个 subagent 并行，或者让另一家模型做审查；检查点可配置为全自动或逐步批准，进度推送到飞书。交付：写进目录的 Markdown、HTML、LaTeX、PDF。后续：重跑或从中间某一步接着做；记忆是目录里的 wiki 或报告索引。
- **例子**：ARIS（research-wiki，执行和审查分属两家模型，飞书推送检查点）、ai-berkshire（4 个视角的 subagent，2377 份报告存在仓库里，thesis-tracker 和 thesis-drift）、zotero-mcp 的 agent skill、gpt-researcher 的 Claude Skill；数据商也在把能力做成 skill 或 MCP 卖给这类 agent：Wind Alice Market、东方财富妙想 Skills、Undermind 和 Consensus 的 MCP、Daloopa 的 MCP。
- **适合**：技术型用户；需要结构一致、可以复现的输出（ai-berkshire：半年后重跑同一家公司可以直接对比）；跨月延续靠文件而不是靠产品；ARIS 把「失败的想法」也存进 wiki，当作下次的禁用清单。
- **在哪里坏**：门槛高（V2EX 上有人说「Claude Code 门槛还是有点高」，要 Codex 版）；token 成本高；数据源受限（有人跑小米只拿到 2024 年财报，想接自己的付费数据）https://www.v2ex.com/t/1222186 ；终端被思考过程和整篇文档刷屏，是 ARIS 的头号用户抱怨 https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep ；上游 CLI 一变，整条审查链就断。

### 模板画廊（一次挑一个预制任务）

- **骨架**：单位：一张预制任务卡。开始：在画廊里按类别或学科找卡片，点运行，按卡片要求上传文件。交付：卡片写明的文件（DOCX、CSV、PDF）。后续：未见。
- **例子**：SciSpace Agent Gallery（2601 个，Run Task 和 View Output）、Hebbia 的预制 agent（交易备忘录、信贷协议审阅）、Reportify 的句式模板和公开研究、进门聊天模式里封装好的工作流、Gemini Notebook 的报告模板。
- **适合**：让新手发现能做什么，把专业流程（系统综述里的一致性检验、去重）打包成一步。
- **在哪里坏**：本轮没有找到用户评价，SciSpace 的 Trustpilot 页被验证页挡住。

## 近一年的变化

- 2026-07-16 NotebookLM 改名 Gemini Notebook，笔记本同时出现在 Gemini 应用里，两边共用来源和自定义指令；聊天加上了搜网、跑代码、生成文件的 agent 能力。https://workspaceupdates.googleblog.com/2026/07/notebooklm-now-gemini-notebook.html 、https://support.google.com/notebooklm/answer/16179559?hl=en
- 2026-09-30 Elicit 撤掉 Find Papers、Extract Data、Chat with Papers 三个独立工具，全部并入 Research Agent；表格从工作单位退成 agent 会话里的产物；Alerts 换成能交回分析成品的 Routines；用量改成统一的月度池。https://support.elicit.com/en/articles/17220397-where-did-find-papers-extract-data-and-chat-with-papers-go
- Perplexity 2026-09 的 Advanced Deep Research：先问澄清问题、运行中可以追加问题、显示进度和陆续出来的关键发现、报告直接写进可编辑的文件。Labs 这个名字已经从帮助中心消失，/labs 跳到 Computer（第三方 2026-09-03 检查）。https://www.perplexity.ai/help-center/en/articles/13600190-what-s-new-in-advanced-deep-research 、https://prompt-architects.com/blog/380-prompting-perplexity-labs-for-deliverables
- Consensus 2026 年夏从搜索引擎变成工作区：带完整步骤记录的 Research Agent、每个引用对应原句、可共享的 Library、对外开放 API 和 MCP；2026-09-22 的 Research Gaps Matrix 格子可以点开，空格直接转成一次 Deep 检索。https://consensus.app/home/blog/what-has-changed-in-consensus-summer-26/
- Undermind 默认形态从一次性报告换成 Projects（持久工作区，检索和写作分 agent），Classic 仍保留（SMU 图书馆 2026-09-08）。
- 金融侧整合：Fintool 2026-04 被 Microsoft 收购，fintool.com 现在跳到 Microsoft 365；Brightwave 首页改成做 agent 合规基础设施；AlphaSense 预告常驻 agent SuperAnalyst；Hebbia Max 支持邮件派活。
- 国内金融数据商 2026-03 起集中推出「小龙虾」形态的 agent：WindClaw（2026-03-11，本地运行、多智能体持续跟踪、学习用户习惯，另设一个只有 AI 能参与的投资论坛）、熵简 AlphaClaw（2026-03-11）、东方财富妙想 Skills（2026-03-13）和 ClawBot 数字员工（2026-05-20 上架阿里云 JVS Claw）、进门工作台以 OpenClaw 做调度。数据商同时把数据和技能做成 MCP 和 Skill 卖给外部 agent（Wind Alice Market）。
- 进门 AI进宝 2026-07 上线研究模式：每个个股或赛道一个长期研究空间，加常态化监测和底稿迭代，和任务模式、聊天模式并列，明确针对「聊完即废」。
- 国内深度研究的两种走向：Kimi 深度研究保持独立入口，交付「万字 Markdown 报告加一份可分享的 HTML 可视化报告」，和 Kimi Code 等共用一个额度池；豆包把深度研究并进「豆包工作」，和文档、表格、定时任务、飞书协作放在一起（帮助页 2026-09-28）。
- Reportify 把定时研究做成首页上可以直接订阅的卡片，写明送达时间、样例消息和在用人数；公开研究以问题树呈现（已答的子问题加一条「可进一步研究：带上你持有的公司」）。https://reportify.cn/
- 开源研究工作流搬进了编程智能体：ARIS 2026-09-16 成为 Claude Code 插件，带 research-wiki 和飞书检查点；ai-berkshire 把 2377 份报告当作仓库文件管理；Zotero 有了 MCP 和库内 agent 两条接入路线。
- 计费普遍转向「统一额度池，按任务大小扣」：Elicit 的月度池、Gemini Notebook 每 5 小时刷新加周上限、Kimi 一次深度研究约占月额度 5% 到 10%、Perplexity Computer 按 credit。

## 产品

### Gemini Notebook（原 NotebookLM，2026-07-16 改名）

- **来源**：<https://workspaceupdates.googleblog.com/2026/07/notebooklm-now-gemini-notebook.html> <https://support.google.com/notebooklm/answer/16215270?hl=en> <https://support.google.com/notebooklm/answer/16179559?hl=en> <https://support.google.com/notebooklm/answer/16262519?hl=en> <https://support.google.com/notebooklm/answer/17003757?hl=en> <https://support.google.com/notebooklm/answer/17670842?hl=en> <https://support.google.com/notebooklm/answer/18323649?hl=en> <https://support.google.com/notebooklm/answer/16206563?hl=en> <https://support.google.com/notebooklm/answer/16296687?hl=en> <https://news.ycombinator.com/item?id=49884002> <https://news.ycombinator.com/item?id=49903887> <https://news.ycombinator.com/item?id=48937720> <https://news.ycombinator.com/item?id=48941669> <https://www.v2ex.com/t/1231872>
- **时间**：改名公告 2026-07-16（Google Workspace Updates）。帮助页无日期，2026-10-05 用 curl 取原文，标题已全部是 Gemini Notebook。用户评论 2026-07 至 2026-09。
- **工作的单位**：一个笔记本：一组来源 + 一条对话 + 笔记 + Studio 产物。界面分 Sources、Chat、Studio 三块，笔记在 Studio 里，另有一条 noteboard 钉在聊天框上方。同一个笔记本也出现在 Gemini 应用的导航里（Notebooks in Gemini），两边同步改名、来源和自定义指令。
- **怎么开始**：新建笔记本，再点 Add sources：上传 PDF、docx、md、csv、pptx、音频（导入时转写成文字）、图片、ePub，或者贴文本、网址、公开 YouTube（只取字幕）、Google Drive 文件、已购的 Play Books 电子书。另有两种让它找来源的方式：在来源栏输入问题走 Fast Research（选 Web 或 Drive，返回带一句相关性说明的结果清单，勾选导入）；或者打开 Web + Deep Research 开关，几分钟后给出一份报告和全部相关来源（引用过的、没引用的都列），用户勾选后导入，没导入的直接丢弃。
- **干活时**：Deep Research 运行时可以继续用笔记本。聊天可以展开它的 thinking steps；生成过程中点 Stop，可以选修改提示或继续生成。Studio 生成前在底部显示预计耗用的额度条；额度不够时可以点 Generate later 延后（要几个小时，完成后通知）。
- **提问和批准**：没有显式的批准步骤。帮助页把聊天里的 agentic 能力（搜网、跑代码、生成文件）称为实验功能，要求用户自己盯着、自己复核。
- **交付**：聊天回答带引用：悬停显示原文引句，点击跳到来源里的原处；可以在来源栏勾选只用其中几份来源回答。Studio 产物有 Audio Overview、Video Overview、Mind Map、Flashcards/Quiz、Infographic、Slide Deck，以及 Reports（Interactive 是嵌入其他产物的交互报告，Document 是纯文字报告，模板可以改）。聊天还能直接生成 PDF、Word、Markdown、CSV、JSON、xlsx、pptx 和图表，产物带版本。
- **后续**：在同一个笔记本里接着聊。回答可以 Save to note（保存下来的回答不能再改，但保留表格和可点的引用）；笔记可以转成来源（convert to source），也可以一键合并、要批评意见、改成提纲或学习指南。笔记可导出到 Google Docs 或 Sheets，导出后不再回同步。每个产物都能查看生成时用的自定义提示。
- **主动**：没有定时，也不推送，唯一的通知是 Generate later 完成后的提醒。笔记本不会自己去找新材料，只有 Drive 来源会每隔几分钟自动同步原文件。
- **记忆**：没有跨笔记本的记忆。每个笔记本一套自定义指令，在 Gemini Notebook 和 Gemini 两边共用。可以选择把在 Gemini 里和这个笔记本的聊天当作上下文，这些聊天在来源栏以只读形式出现。来源达到 5 份后会自动按主题打标签分组，用户可以改。聊天记录只本人可见，可以删除。
- **文件和工作区**：资料就放在笔记本里：每份来源最多 50 万词或 200MB，免费用户每个笔记本最多 50 份来源。Drive 来源失去访问权限后失效，但仍占名额。网页只抓 HTML 文字（不抓图片，付费墙页面不行），Google 文件里的脚注和评论不会导入。
- **排列**：笔记本列表。可以分享：Viewer 只读，Editor 可以增删来源和笔记，还可以只发一个 Chat View 链接（官方提示这并不真正收回查看来源的权限）。另有公开笔记本、精选笔记本，可复制私有副本。编辑者之间笔记实时同步。
- **手机**：有 Android 和 iOS App（官方称早期版本）：能问答、离线听音频概览、刷闪卡和测验、看信息图和幻灯片，可以从系统分享菜单把网页、PDF、YouTube 送进笔记本。Live 语音对话只在手机上有，可以随时打断。笔记功能手机端不支持。
- **计费**：按算力的额度：每 5 小时刷新一次，另有周上限。Plus 是标准的 2 倍，Pro 是 4 倍，Ultra 是 Pro 的 5 倍或 20 倍。聊天底部显示剩余额度和刷新时间。
- **被夸的**：HN tonymet（2026-09-28）：回答都落在来源上，回答和产物可以记成笔记、攒成更有结构的研究，整个会话和产物都能分享，认为它被严重低估 https://news.ycombinator.com/item?id=49884002 ；HN kazinator（2026-09-30）用它查 ISO 标准、交通法规这类「原文哪里这么写」的问题 https://news.ycombinator.com/item?id=49903887 ；HN copperx（2026-08-09）用它读书学东西，说效果极好，但还没试过技术类主题 https://news.ycombinator.com/item?id=49237431
- **被骂的**：V2EX RenoYoo（2026-08-03）：能点回原文不等于原文支持整句结论，常见情况是凭空多出一个数字、把「相关」写成「导致」、漏掉地区、时间或样本范围；他把核对引用单独当作一道检查关 https://www.v2ex.com/t/1231872 。HN NoImmatureAdHom（2026-07-16）：想边开车边听论文，但双人播客的形式很烦，而且念不了数学 https://news.ycombinator.com/item?id=48937720 。HN musictubes（2026-08-17）：音频里的主持人反复用 exactly 接话，加提示禁止后仍然改不掉 https://news.ycombinator.com/item?id=49337397 。HN 0xbadcafebee（2026-07-16）：Gemini Notebook 和 Notebooks in Gemini 不是一回事，后者几天前还不好用 https://news.ycombinator.com/item?id=48941669 。HN lmc（2026-08-21）：一看到 NotebookLM 生成的图，就觉得是 AI 套话 https://news.ycombinator.com/item?id=49388636
- **没看到的**：界面实物；付费档每个笔记本的来源上限（只读到免费 50 份）；iOS 端细节；金融从业者对它的评价。

### Elicit（Research Agent、Projects、Routines、Systematic Review、Report）

- **来源**：<https://support.elicit.com/en/articles/14756886-elicit-s-research-agent> <https://support.elicit.com/en/articles/17220397-where-did-find-papers-extract-data-and-chat-with-papers-go> <https://support.elicit.com/en/articles/17220392-routines-in-elicit> <https://support.elicit.com/en/articles/15805744-elicit-projects> <https://support.elicit.com/en/articles/16649941-collaborate-in-a-shared-research-agent-session> <https://support.elicit.com/en/articles/14758162-create-and-save-columns-in-elicit> <https://support.elicit.com/en/articles/14759154-systematic-reviews-in-elicit> <https://support.elicit.com/en/articles/14756862-get-a-research-report-to-generate-in-depth-answers-automatically-in-elicit> <https://support.elicit.com/en/articles/15646622-usage-limits-in-elicit> <https://www.aiforacademic.world/blog/elicit-consensus-scispace-undermind-2026> <https://news.ycombinator.com/item?id=44662696>
- **时间**：帮助页标「Updated this week」或「Updated over 2 weeks ago」，2026-10-05 读取原文。独立工具在 2026-09-30 撤销并入 agent。
- **工作的单位**：一个 Research Agent session。帮助页原话：「一个研究 agent session 是持续研究的工作区，不是一次查询」。表格是 session 里的产物（每行一篇论文，每列一个要抽取的数据点）。上面一层是 Project：把多个 session 串在一起，session 之间能互相看到产物，可以挂一个 collection。另有流程固定的 Systematic Review 和 Research Report 两种工作流。2026-09-30 起 Find Papers、Extract Data、Chat with Papers 不再是独立工具，改成 agent 的 skill；旧 session 变成只读，2027 年某天删除，可以一个一个转进新的 agent session，带过去的是查询、论文集、表格和旧对话记录。
- **怎么开始**：首页点 skill（Find Papers、Extract Data），或者直接提问。发送前可以拖力度滑杆（Fastest、Fast、Balanced、Smart、Smartest，限量 beta，每个新 session 回到 Balanced）。可以点名一个 collection、某一篇论文（按标题、作者、DOI、PMID、文件名），可以限定只用某个 collection 或者把 Library 排除在外，最多上传 20 个文件。Systematic Review 先进 Setup 页，一页配好：研究问题、补充上下文（PICO、纳入排除标准）、阶段时间线（Gather、Extraction、Report 必开，摘要筛选和全文筛选可关）、语义检索还是布尔检索、每个筛选阶段用 Fast 还是 Thorough。Report：输入问题，选模板（General Review、1-Page Overview、Research Gap Analysis），选 fast、balanced 或 comprehensive。
- **干活时**：agent 开工前可能先问几个澄清问题（优先哪些来源、输出怎么组织、范围多大）。然后把问题拆成计划逐步执行，实时显示正在查哪些来源；可以离开页面。Report 的侧栏显示走到了哪一步，做完发邮件。
- **提问和批准**：指代的论文有歧义时会问是哪一篇，不替你挑。按要求把论文存进 collection 时，会说明存了哪些、存在哪、和已有的去重，collection 不存在就先建。多人协作时，选中产物的一段点 Ask Elicit，agent 不直接改，而是产出一份 draft，由人 Accept 或 Reject，也可以回复 draft 接着改；在评论里 @Elicit 提问只得到回答，不会触发修改。建 Routine 时先给出它打算执行的指令和时间表，人可以直接改字段或在对话里改。
- **交付**：带引用的回答，点引用打开论文或网页。表格可以筛选、存进 Library、导出 .bib 或 .ris。图表（付费）作为单独产物放在对话旁边；幻灯片草稿可下载为 PowerPoint（预览功能）。所有产物都在 Artifacts 下拉菜单里。Report 里点任意一处能看到支持它的引句和推理；每一步（找到的论文、筛选标准及每篇的判定理由、抽取表）都能导出 CSV。
- **后续**：在同一 session 里追问、要求修改产物、开新分析、换一种产物。表格点 Add column 加列，或者直接说要加什么列；每一列由列名和给人工标注员那样的详细指令组成，可以存成 Preset 列，在别的工作流里复用。Report（付费）可以回头改任何前面的步骤（筛选标准、筛进筛出论文、增删抽取列、改列指令），再生成新版本，旧版本留在版本选择器里。
- **主动**：Routines（Pro、Scale、Enterprise）：一套按每天或每周某天定时运行的指令，取代旧的 Alerts。帮助页的说法是，Alert 只告诉你有新论文匹配，Routine 能对发现的东西做分析，交回成品。打开某个产物点 Track artifact，就建一个定期更新这份产物的 Routine。每次运行落成一个带来源的 session，可以进去核对引用、质疑结论、追加任务。运行完给所有者发邮件（每次都发或只在失败时发），session 共享给别人也只有所有者收到。Routine 页分 Active、Paused、Archived，有运行历史、Run now、暂停、归档。
- **记忆**：已存的论文（Library、collections，包括同事共享的）是 agent 的上下文；agent 会说明哪些结论用了你存的论文、哪些来自更大范围的检索。Project 里的 session 可以互相看到产物和内容。没有看到记录个人偏好的记忆功能。
- **文件和工作区**：Library：打标签、批量传 PDF、导入 RIS/BIB、从 Zotero 导入、智能去重；collections 可共享，同事可以一起增删。Project 页汇总全部 session、文件和产物，可以挂一个 collection：项目里的 agent 优先用它，从项目里存的论文默认进它；后加入的人打开它就能看到团队依据的证据。
- **排列**：侧栏有 Recents（含 Shared with you 标签）、Projects、Routines。别人共享给你的项目和 session 不会自己出现在侧栏，只在 Recents 上亮一个绿点。
- **手机**：未亲见。
- **计费**：2026 年改成每月一个统一用量池，取代原来按工作流计次和 agent 每日上限。力度档、从图表抽取、Premium PDF parsing 都会多耗用量。Routine 每跑一次按一次 agent session 计（每周一次约等于单次的 4 倍），暂停或归档后不耗。用量用完后 agent 只剩找论文的功能。套餐有 Basic、Pro、Scale、Enterprise，具体价格没查。
- **被夸的**：AI for Academic（作者自述是河内的执业外科医生，2026）：Elicit 围绕结构化的证据综述任务设计，适合做筛选和抽取的试点，但替代不了正式检索策略和协议要求的双人审核 https://www.aiforacademic.world/blog/elicit-consensus-scispace-undermind-2026 。HN MrCoffee7（2025-07-23）推荐免费替代品时特意说，免费的那个没有 Elicit 那种对比表 https://news.ycombinator.com/item?id=44662696
- **被骂的**：没找到用户对 2026-09-30 合并的反应（到读取时才 5 天）。HN 6gvONxR4sf7o（2024-07-26，较旧）：Elicit 最大的弱点是准确性 https://news.ycombinator.com/item?id=41075424
- **没看到的**：界面实物、价格、手机端、合并后的用户评价。

### ChatGPT deep research

- **来源**：<https://help.openai.com/en/articles/10500283-deep-research-in-chatgpt> <https://chatai.guide/features/chatgpt-deep-research> <https://news.ycombinator.com/item?id=46194231> <https://news.ycombinator.com/item?id=49317534> <https://news.ycombinator.com/item?id=47140842> <https://news.ycombinator.com/item?id=47711706> <https://news.ycombinator.com/item?id=45162962>
- **时间**：官方帮助页在内置浏览器和 curl 下都停在 Cloudflare 的「请稍候」验证页，没有绕过，archive.org 也拒绝访问。只看到 Bing 搜索结果里的官方摘要：「You can edit the research plan before it starts, view progress in real time, interrupt the research to adjust focus, and update which sources the research can access.」其余内容来自 ChatAI Guide 转述官方帮助页的文章（发布 2026-03-21，更新 2026-05-05）。用户评论 2025-12 至 2026-08。
- **工作的单位**：一次深度研究任务，放在一条对话里，产出一份报告。
- **怎么开始**：（转述）从工具菜单选 Deep Research，或输入 /Deepresearch，或从侧栏进入。可以附文件。选来源：公共网页、上传的文件、已启用的 apps（Google Drive、SharePoint，以及账户可用时的 FactSet、PitchBook、Scholar Gateway 等）。可以指定网站：只搜这些站，或者优先这些站、其余照搜。可能先问澄清问题，然后给出研究计划，用户可以改计划再开始。
- **干活时**：实时看进度和活动；可以中途打断调整重点，可以改它能用的来源（官方摘要原话）。2025 年发布帖说单次 5 到 30 分钟（转述）。
- **提问和批准**：开始前的澄清问题加计划确认。用户 wincy 觉得这一步很生硬：问一轮就跑去干半小时。
- **交付**：（转述）全屏报告视图，有目录、引用或来源链接、所用来源列表、活动历史，可下载 Markdown、Word、PDF。
- **后续**：在对话里追问。第三方建议把对话和附件存进 ChatGPT Projects。
- **主动**：深度研究本身不定时。第三方建议配合 ChatGPT 的定时任务定期重跑（定时任务的情况见 survey-briefing-and-tracking）。
- **记忆**：（转述）沿用 ChatGPT 的数据控制和记忆设置。
- **文件和工作区**：上传文件、已连接的 apps、Projects。
- **排列**：对话列表。Enterprise 和 Edu 管理员可以按角色控制谁能用。
- **手机**：未亲见。
- **计费**：（转述）每月固定次数，从第一次使用起每 30 天重置，产品里有剩余次数计数。2025-04-24 的数字（Free 5、Plus/Team/Enterprise/Edu 25、Pro 250）是第三方转引，现在的额度没亲见。
- **被夸的**：HN lmeyerov（2026-04-09）：做大项目前先用 ChatGPT Pro Deep Research 快速扫几百个来源判断相关性，再逐篇深读 https://news.ycombinator.com/item?id=47711706 。HN CamperBob2（2026-02-24）：跑上 30 分钟能给出较全面的报告，其中多数引用真实存在；他说这个功能现在叫 Extended Pro 模式（未核实）https://news.ycombinator.com/item?id=47140842
- **被骂的**：HN wincy（2025-12-08）：它问一轮问题就跑去花半小时以上写报告，不知情的人会浪费次数；他妻子第一次用就把一次深度研究浪费在问它「能不能分几轮问问题」上 https://news.ycombinator.com/item?id=46194231 。HN OutOfHere（2026-08-16）：ChatGPT 削弱了 Deep Research，不过用自定义 GPT 或 Work 模式就能补回来 https://news.ycombinator.com/item?id=49317534 。HN iguana2000（2025-09-07）：普通的 ChatGPT search 用的来源常常是 deep research 的两三倍 https://news.ycombinator.com/item?id=45162962
- **没看到的**：官方帮助页原文（Cloudflare 验证）；它与 2026 年的 ChatGPT Work 是什么关系；现在的额度。

### Gemini Deep Research（Gemini 应用）

- **来源**：<https://support.google.com/gemini/answer/15719111?hl=en> <https://news.ycombinator.com/item?id=47246527> <https://news.ycombinator.com/item?id=49741677> <https://news.ycombinator.com/item?id=45163444> <https://news.ycombinator.com/item?id=48214088> <https://library.smu.edu.sg/topics-insights/lost-ai-search-maze-heres-your-guide-choosing-right-tool-updated-september-2026>
- **时间**：帮助页无日期，2026-10-05 读取原文；用户评论 2025-09 至 2026-09；SMU 图书馆指南 2026-09-08。
- **工作的单位**：一次研究请求，落在一条聊天里，产出一份报告，报告显示在右侧 Canvas 面板。
- **怎么开始**：在输入框点 Add Files，再选 Deep Research。可以上传文件或图片，也可以加 NotebookLM 笔记本。点 Sources 选 Gmail、Drive（要先连 Google Workspace）；Google Search 默认勾选，取消它就只用你选的来源。提交后 Gemini 先写一份研究计划，点 Edit plan 可以改，再点 Start research。
- **干活时**：通常 5 到 10 分钟，复杂的更久。可以离开这条聊天；做完后网页端在聊天旁标记，手机端推送通知，锁屏也能看到。帮助页没有写能否中途打断。
- **提问和批准**：计划确认：Edit plan 或 Start research。
- **交付**：Canvas 里的报告。Ultra 用户的报告里可以有图表、示意图、交互模拟器（用了 Workspace 来源时没有）。在 Canvas 里还可以点 Create 生成 Audio Overview 或自定义可视化；Share & export 可以分享 Canvas、导出到 Google Docs、复制全文。
- **后续**：在同一条聊天里继续。要找回以前的报告，必须开着 Keep Activity。
- **主动**：只有完成通知，没有定时。
- **记忆**：按 Gemini 应用的设置；报告存在 Recent 聊天里（需要开 Keep Activity）。
- **文件和工作区**：上传文件，Drive 和 Gmail，NotebookLM 笔记本都可以当来源。
- **排列**：Recent 聊天列表。
- **手机**：有，完成后推送。
- **计费**：每天的研究次数上限，加同时运行数上限；快到上限时提示当天还剩几次。Pro 和 Ultra 额度更高，并可选 Pro 模型。
- **被夸的**：HN senrex（2026-05-20）：Gemini 和它的 deep research 都很好，导出到 Google Docs 很难被超越 https://news.ycombinator.com/item?id=48214088 。SMU 图书馆的 Aaron Tay（2026-09-08）把它列为学生查开放网页材料的首选（因为学校机构版人人可用）。
- **被骂的**：HN alvdef（2026-03-04）：用了几个月，深入新话题很好用，但连续做 5 到 10 次聚焦细节的研究时，大部分篇幅浪费在引言和已经研究过的内容上，没法接着之前的成果做；后来他自己用 Claude Code 加 Obsidian 写了个 zettelkasten 技能来解决 https://news.ycombinator.com/item?id=47246527 。HN bootlooped（2026-09-17）：每份报告都有一段冗长浮夸的开头，学术腔重到像在讽刺学术 https://news.ycombinator.com/item?id=49741677 。HN losvedir（2025-09-08）：三家里只有 Gemini 不听要求，总是写成高中生模仿咨询顾问的报告 https://news.ycombinator.com/item?id=45163444 。Aaron Tay：通用的网页深度研究比专门的学术工具更容易编造，要核对论文是否存在、是否真那么说。
- **没看到的**：能否中途打断；改报告是在聊天里还是在 Canvas 里直接编辑；具体额度数字。

### Perplexity Research（Advanced Deep Research）与 Labs 的去向

- **来源**：<https://www.perplexity.ai/help-center/en/articles/10738684-what-is-research-mode> <https://www.perplexity.ai/help-center/en/articles/13600190-what-s-new-in-advanced-deep-research> <https://www.perplexity.ai/help-center/en/articles/12528830-creating-assets-with-perplexity-overview> <https://prompt-architects.com/blog/380-prompting-perplexity-labs-for-deliverables> <https://news.ycombinator.com/item?id=47739612> <https://news.ycombinator.com/item?id=49536959>
- **时间**：帮助页最后修改：Research mode 2026-09-03，Advanced Deep Research 2026-09-15，Creating assets 2026-09-03（在内置浏览器里读到；curl 返回 403）。Prompt Architects 2026-09-02。
- **工作的单位**：一次提问，Research 是搜索框里的一个模式，产出一份报告，报告直接流式写进一个可编辑的文件。文档、表格、演示、网页这类文件，现在在 Search、Research、Create files and apps 几种模式里都能生成。Labs（2025-05 上线）的去向：Prompt Architects 2026-09-03 检查了帮助中心 207 篇文章，没有一篇出现 Labs 这个词，/labs 网址跳到 Computer；另有几家第三方站点说 2026-02 改名为 Create files and apps。官方没有说明。
- **怎么开始**：在模式选择器里选 Research（网页、手机、Mac 都有）。不能自选模型。问题太宽泛时，开始前先问澄清问题。
- **干活时**：新的进度显示：正在读哪些来源、学到了什么、报告怎样成形；关键发现随进度陆续出来，不用等报告写完；运行中可以追加问题。多数任务 3 分钟内完成。
- **提问和批准**：宽泛问题先问澄清问题；没有计划确认这一步。
- **交付**：报告流式写进一个文件，可以编辑、细化、分享，也能导出 PDF 或文档、转成 Perplexity Page。生成的文件有版本历史、预览、下载、分享，可导出到 Google Drive；带引用的只有文档类文件。
- **后续**：用追问修改，版本历史可回看。
- **主动**：本轮没读到 Research 本身的定时；Computer 的定时任务见 survey-briefing-and-tracking。
- **记忆**：本轮没读。
- **文件和工作区**：Deep Research 现在可以直接处理上传的文档，代码沙箱可做计算。
- **排列**：未亲见。
- **手机**：Research 在手机端可用。
- **计费**：免费用户次数有限，Pro 更多。Max 用 Opus 4.6 Thinking，Pro 逐步换成 4.5 Thinking；额度调整为每次分配更多算力。Computer 按 credit 计（第三方：Pro 每月 4000，Max 每月 10000）。
- **被夸的**：HN stranded22（2026-09-02）：付费用了 3 年，喜欢它展示来源的方式，deep research 很有用 https://news.ycombinator.com/item?id=49536959
- **被骂的**：HN wolvoleo（2026-04-12）：20 欧档位收紧了，一次 deep research 就把他封到月底 https://news.ycombinator.com/item?id=47739612 。Prompt Architects：Labs 曾承诺一条提示出报告、表格、仪表盘、网页，现在帮助中心里连名字都没有，相关文章底部还留着一个没有链接的「Perplexity Create Files and Apps」标题。
- **没看到的**：Spaces 和 Research 的关系；研究能不能定时；报告文件里的引用长什么样。

### Undermind（Classic 与 Projects）

- **来源**：<https://www.undermind.ai/> <https://www.undermind.ai/mcp> <https://library.smu.edu.sg/topics-insights/lost-ai-search-maze-heres-your-guide-choosing-right-tool-updated-september-2026> <https://news.ycombinator.com/item?id=41069909> <https://news.ycombinator.com/item?id=45220814> <https://news.ycombinator.com/item?id=42628000>
- **时间**：官网无日期，2026-10-05 读取（基准测试已用 GPT-5.6、Claude Opus 5，说明是近期版本）。SMU 图书馆 Aaron Tay 指南 2026-09-08。HN 评论 2024-07 至 2025-09。
- **工作的单位**：两种形态并存。Classic：一次查询，先澄清，再深度搜索（约 10 分钟），最后出一份一次性报告。Projects（现在的默认）：一个持久的工作区，里面有负责检索和负责写作的不同 agent；多次深度查询的结果合进同一个 All Papers 库，agent 还能把论文分进文件夹，工作区里可以有多份反复修改的报告（Aaron Tay 截图描述：5 次查询、一个总库、若干文件夹、几份迭代过的报告）。
- **怎么开始**：官网四步：Describe，像对同事一样说明你在做什么，它追问弄清需求；Explore，它读并评估几百篇论文，顺着引用链追；Build，一起迭代报告、读全文、抽细节；Keep up，持续盯着你关心的领域。
- **干活时**：未亲见运行界面。2024 年 HN 上创始人说初次只细读 100 篇，可以用 extend 让 agent 再去找更多。
- **提问和批准**：开始前追问以收窄问题（HN 用户 setgree 2024-07 描述了这个来回，把问题收窄到具体的 RCT 条件）。
- **交付**：报告带行内引用，可以追到原论文；能判断每篇和你问题的相关程度，按需排序筛选；能生成自定义表格。
- **后续**：在报告上迭代，进全文，抽细节。2024 年时报告链接本身可以保存，登录用户的搜索都进 history 页。
- **主动**：Keep up：有相关的新论文发表时通知你。HN yorwba（2025-09-12）：上线时做的两次搜索至今偶尔还推新论文，但这些论文通常只是新的、相关的，并不新颖；不过最初的搜索帮他找回了几篇漏掉的旧论文 https://news.ycombinator.com/item?id=45220814
- **记忆**：官网称「living library」，即工作区里的论文库；没有看到别的记忆形式。
- **文件和工作区**：免费版就能用共享工作区；Pro 不限工作区、文件和论文库数量。
- **排列**：工作区列表。也能当插件接进 ChatGPT、Claude、Codex、Claude Code、Cursor、VS Code、Copilot、Perplexity 等（MCP，在 ChatGPT 里输入 @Undermind 调用）。
- **手机**：未亲见。
- **计费**：Free（标准限额）、Pro 年付每月 16 美元（10 倍限额、最新模型、最深的全文分析）、Team 每人每月 15 美元、Enterprise；产业和学术两套价目。
- **被夸的**：Aaron Tay（2026-09）：问题难、术语跨学科、关键词一搜全是噪声时，Undermind 依然很能打。HN jspann（2024-07-26，研究生）：找到不少自己课题组和相关组的漏掉的论文，愿意付费但学生觉得贵 https://news.ycombinator.com/item?id=41078304 。官网上 GSK 等客户的推荐属于厂商宣传。
- **被骂的**：Aaron Tay：Projects 更灵活，但新的不等于更好；有些难的检索问题用 Classic 更顺手、更可靠，Projects 往往要多点好几下才到同一个地方。它只覆盖学术文献，没有出版商合作，付费墙论文只能看到题名和摘要。HN llm_trw（2025-01-07）：一个月最多做两次文献综述，不想要一个会忘掉的长期订阅，宁愿每次搜索付 5 美元 https://news.ycombinator.com/item?id=42628000
- **没看到的**：Projects 的界面实物；agent 之间怎样分工；通知的形式（邮件还是站内）。

### Consensus（Research Agent、Deep、Research Gaps Matrix、Library）

- **来源**：<https://consensus.app/home/blog/what-has-changed-in-consensus-summer-26/> <https://consensus.app/home/blog/introducing-new-research-gaps-matrix/> <https://consensus.app/home/blog/> <https://library.smu.edu.sg/topics-insights/lost-ai-search-maze-heres-your-guide-choosing-right-tool-updated-september-2026> <https://news.ycombinator.com/item?id=49197091> <https://news.ycombinator.com/item?id=43519382>
- **时间**：官方博客 2026-09-09（夏季更新汇总）、2026-09-22（Research Gaps Matrix）、2026-09-24（结果里显示论文图表）。帮助中心 help.consensus.app 用 curl 访问返回 403，未读。
- **工作的单位**：基本单位是一次搜索（快速模式，或更深的 Deep）。2026 年夏天加了 Research Agent，能规划并执行多步任务（语义检索、按 DOI 查、沿引用图走），每一步做了什么、为什么做都有完整记录。另有 Library（被定位为 AI 参考文献管理器）和 Research Gaps Matrix（一张覆盖网格）。
- **怎么开始**：用自然语言或类布尔的方式提问；过滤器有对照研究、最低期刊分区、最低引用数、研究所在国家、开放获取，还能限定到具体几本期刊（SMU 指南有截图）。
- **干活时**：agent 的每一步和理由都有完整记录。
- **提问和批准**：未见。
- **交付**：AI 摘要里每个引用都对应论文里的一句原文：悬停显示原句和所在章节，点 Open 打开全文并高亮那一段。Consensus Meter 显示「研究是否同意」的百分比。2026-09-24 起把被引论文里的图表直接拉进结果。Research Gaps Matrix：一边是子主题，一边是研究维度，每格显示有几篇论文；悬停看论文，点开某篇会在矩阵旁打开并高亮让它入格的那段原文；论文的 Evidence 标签汇总矩阵用到的全部引句；空格标为 Potential Gap。
- **后续**：在矩阵的空格上点 Investigate further with Deep，把这个行列交叉直接变成一次聚焦检索，不用重新开始。
- **主动**：未见。
- **记忆**：Library 接进了 Research Agent，可以在你存的全部资料上做分析。
- **文件和工作区**：Library 除了论文还能上传基金申请书、稿件、书的章节；可以和同事共建 collection，各自增删。
- **排列**：未亲见。也能在 ChatGPT、Claude、Microsoft 365 Copilot 里调用（2026-09-14 博客）。
- **手机**：未亲见。
- **计费**：有 Pro 等付费档（具体价格没查）。API 和 MCP 每个计划都含一些免费请求，超出按请求付费。
- **被夸的**：Aaron Tay（2026-09）：对多数学生来说是学术 AI 搜索里最好的通用起点；界面功能最丰富（颜色区分的引用、完整的过滤器、核对生成的引文陈述）；悬停看原文、点开在全文里高亮，便于在上下文里核对；出版商合作多，能读到付费全文。HN vunderba（2026-08-06）：看医生前先用它查同行评审研究的结论 https://news.ycombinator.com/item?id=49197091
- **被骂的**：Aaron Tay：不要把 Consensus Meter 的百分比当成科学共识，它取决于问题怎么问、检到哪些论文、怎么分类；有些查询 Deep Search 的检索明显不如 Undermind；学术工具能保证被引论文真实存在，保证不了对论文的描述正确。HN ZYbCRq22HbJ2y7（2025-03-29）回应别人贴 Consensus 结论当证据：你像是读遍了文献，其实只是用服务做了个摘要，我没法判断你转述的是不是垃圾 https://news.ycombinator.com/item?id=43519382 。AI for Academic（2026）：它给出的是排过序的候选论文，不是系统综述那种可复现的分母。
- **没看到的**：Research Agent 的运行界面；项目或长期课题怎么延续；价格。

### SciSpace（SciSpace Agent 与 Agent Gallery）

- **来源**：<https://scispace.com/> <https://scispace.com/agents> <https://scispace.com/pricing> <https://www.aiforacademic.world/blog/elicit-consensus-scispace-undermind-2026>
- **时间**：2026-10-05 在内置浏览器里以未登录状态打开首页、Agent Gallery、定价页（curl 返回空的 202）。Trustpilot 被「Verifying Connection」验证页挡住，未绕过。
- **工作的单位**：首页是一个 agent 输入框（「How can I help with your research?」），下面有工具选项：Lite、Search Papers、Literature Review、Draft、Diagrams、Presentation。Agent Gallery 里有 2601 个预制任务，每张卡有 Run Task 和 View Output，例如 PICOT 问题生成、MBA 案例分析、抽取论文局限、Cohen's kappa、Krippendorff alpha、参考文献去重、抽取随机化方法；按 Featured、Extract + Analyse、Literature Review、Create + Write、Deep Search 和学科分类。另有 Biomedical Agent。老工具（Chat with PDF、Literature Review、AI Writer、Paraphraser、Citation Generator、Extract Data、AI Detector）仍挂在导航上。
- **怎么开始**：从画廊挑一张任务卡点 Run Task，或者在首页输入框写需求、选工具。
- **干活时**：未亲见。
- **提问和批准**：未亲见。
- **交付**：任务卡写明的输出多是文件：DOCX、PDF、CSV、XLSX、RIS 或 BibTeX。
- **后续**：未亲见。
- **主动**：未见。
- **记忆**：未见。
- **文件和工作区**：上传 PDF、CSV、Excel、RIS 等作为任务输入。
- **排列**：画廊和模板页。
- **手机**：有 SciSpace Mobile App 和 Chrome 扩展（页脚链接，未打开）。
- **计费**：按 credit 计：定价页 FAQ 的标题有月度 credit、Add-On Credits、是否滚存、团队成员能否自购、怎么增加并发任务数。价格数字在未登录页面上没有渲染出来。
- **被夸的**：AI for Academic（2026）：SciSpace 最有用的是找到论文之后的阶段，Chat with PDF 能回答关于一篇论文的问题并指回原段落，加快读方法和结果，但每个抽出来的数字都要回原表原图核对。定价页上的推荐语来自推特和 Product Hunt，属于厂商挑选。
- **被骂的**：没取到（Trustpilot 被验证页挡住）。
- **没看到的**：运行中的界面；项目、历史、记忆；价格。

### AlphaSense（Generative Search、Deep Research、Workflow Agents、Monitoring，以及预告中的 SuperAnalyst）

- **来源**：<https://www.alpha-sense.com/platform/> <https://www.alpha-sense.com/resources/product-articles/introducing-deep-research-in-alphasense/> <https://www.alpha-sense.com/platform/superanalyst/> <https://www.wallstreetoasis.com/forum/off-topic/who-is-winning-the-ai-war-in-finance> <https://www.wallstreetoasis.com/forum/off-topic/ai-tools-in-finance-how-good>
- **时间**：平台页和 SuperAnalyst 页无日期，2026-10-05 读取，SuperAnalyst 标「Coming Soon」。Deep Research 发布文 2025-06-13（Chris Ackerson，产品 SVP）。WSO 帖 2025-08。
- **工作的单位**：以 Generative Search（对话式搜索）为中心，Deep Research 是它的一个模式（10 到 30 分钟）。平台页把能力并列为 Generative Search、Deep Research、Work Products（按公司格式出 deck、报告、表格，再到 PowerPoint 和 Excel 插件里接着改）、Enterprise Intelligence、Financial Data、Workflow Agents（自定义和定时的 agent，原话是把研究从「拉」变成「推」）、Monitoring（定制仪表盘、Alerts、手机 App）。预告中的 SuperAnalyst 是常驻 agent：把团队的方法论写一次，它持续监控信号、执行工作流，保留项目历史、分析逻辑、覆盖池和工作风格。
- **怎么开始**：Deep Research：把提示转成一份多步研究计划，计划会随新发现调整。SuperAnalyst（未上线）：预装一组 Skills，用户把方法论定义一次，此后自动执行。
- **干活时**：Deep Research 展示推理过程：为什么纳入某类来源，每一步的决定。
- **提问和批准**：SuperAnalyst 的「单次会话公司入门」示例：先交给用户一份排好序的 2 到 4 个主要分歧点让用户批准，再逐个深挖，正反和矛盾证据都拉出来，并刻意尝试推翻自己的判断。
- **交付**：Deep Research：细粒度行内引用，可以点进底层来源接着研究。SuperAnalyst 示例产出：业绩前的一致预期检查（对比报告、EPS 影响、牛熊区间、可选 Excel 模型）；每周模型重校（带日期的模型、估值影响摘要、从上次观点和一致预期到当前观点的桥）；会议准备包（30 场会每场一份带出处的问题清单，加一页总览）。
- **后续**：未亲见。
- **主动**：Alerts、定时 Workflow Agents。SuperAnalyst 宣称不按固定节奏，而是事件一发生就对论点、观察名单、模型、工作流采取行动，自动更新模型、备忘录和演示。
- **记忆**：SuperAnalyst 宣称跨会话保留项目历史、分析逻辑、覆盖池和工作风格（未上线，未验证）。
- **文件和工作区**：5 亿份以上的付费商业和金融文档（券商研报、监管申报、业绩会纪要、行业刊物、Tegus 专家访谈），加企业自己的内容；可接 Snowflake。SuperAnalyst 每次会话在独立沙箱里运行。
- **排列**：未亲见。
- **手机**：有手机 App，用来随时跟踪（平台页 Monitoring 一段）。
- **计费**：企业订阅，定价页没读。
- **被夸的**：WSO dank.knight（PE）：AlphaSense 很好，它的生成式 deep research 工具加纪要库是改变游戏规则的东西 https://www.wallstreetoasis.com/forum/off-topic/who-is-winning-the-ai-war-in-finance
- **被骂的**：没找到针对 AlphaSense 的具体抱怨。同类工具的整体评价：WSO liquidiot（投行二年级分析师，2025-08）说这类工具如果按「能不能放手替代初级分析师」来衡量都很差，适合漏斗顶端的研究、快速上手一个领域或交易，但产不出能交给客户或合伙人的东西 https://www.wallstreetoasis.com/forum/off-topic/ai-tools-in-finance-how-good
- **没看到的**：产品内界面；Generative Grid 的细节；SuperAnalyst 上线时间和真实表现。

### Hebbia（Matrix 与 Max）

- **来源**：<https://www.hebbia.com/> <https://www.hebbia.com/product/matrix> <https://www.hebbia.com/max/> <https://www.businessinsider.com/ai-startup-hebbia-wall-street-investment-banking-work-demo-2025-10> <https://www.wallstreetoasis.com/forum/off-topic/ai-tools-in-finance-how-good> <https://www.wallstreetoasis.com/forum/off-topic/who-is-winning-the-ai-war-in-finance>
- **时间**：官网页无日期，2026-10-05 读取，演示数据里的文件日期到 2026-08。Business Insider 2025-10-21（记者看厂商演示）。WSO 2025-08。
- **工作的单位**：Matrix：一张表，行是公司、交易或文件，列是问题（例如 earnings flash、debt commentary），有 Add row 和 Add column，每行带一列 Source Documents。官网演示里每格是带日期、状态和来源的小段（如「Share repurchases (Jul-2026) — …— Completed」），指标旁注明口径（如「NTM Jul '26–Jun '27; Capital IQ Estimates」）。Max：一个 agent，官网称「你新的顶尖分析师」，做 LBO、comps、deck、业绩会摘要、尽调问题。首页另有按 Project 组织的交易团队协作（演示：Project Meridian，2,987 个文件，有 Publish 按钮）。
- **怎么开始**：Matrix：建矩阵，加行加列；BI 记者描述可以改措辞、改条件，对同一数据集反复问。另有预制 agent（交易备忘录、更新业绩摘要、审信贷协议等模板）。Max：用自然语言下任务，也可以通过电子邮件提问、要演示稿、会前要背景简报，不用打开应用。
- **干活时**：BI 记者：在 Matrix 里看着系统把问题一格一格解出来。
- **提问和批准**：未亲见。
- **交付**：Matrix 表格；Drafts 按公司模板生成 Word、PowerPoint、Excel（BI）；Max 产出 HTML 仪表盘、带品牌的演示、每格带引用的 Excel 模型、音频。
- **后续**：改列的措辞重跑（BI）。
- **主动**：Max 官网：把公司最好的流程变成自己运行的 agent，像团队成员一样参与工作；通过邮件交互。
- **记忆**：官网称 Max「knows your firm」，具体形式未亲见。
- **文件和工作区**：SEC 和欧洲申报、英国 Companies House、业绩会纪要、FactSet、S&P Capital IQ、PitchBook、专家访谈库，以及 SharePoint、Box 等企业网盘。
- **排列**：按 Project 组织。
- **手机**：未亲见。
- **计费**：未公开。
- **被夸的**：Max 页上不具名的客户推荐（「超大型投行」「AUM 前十的 PE」等）属于厂商宣传。WSO liquidiot（投行分析师，2025-08）：用 Rogo、Hebbia 这类工具，离开一阵后重新上手一个领域或一笔交易容易得多。
- **被骂的**：WSO liquidiot：但它并不真正改变工作，因为产不出能交给客户或合伙人的东西。WSO IsItREPE：现在全是障眼法，最后赢的公司还没出现。
- **没看到的**：运行中界面、权限、价格、真实用户对 Matrix 逐格出处的评价。

### Rogo

- **来源**：<https://rogo.ai/> <https://www.wallstreetoasis.com/forum/off-topic/ai-tools-in-finance-how-good>
- **时间**：首页无日期，2026-10-05 读取。
- **工作的单位**：首页说法是 agent：理解金融工作流，在交易和投资中端到端执行工作。
- **怎么开始**：未亲见。
- **干活时**：未亲见。
- **提问和批准**：未亲见。
- **交付**：可审计的 Excel 模型、投资备忘录、尽调材料、演示稿。
- **后续**：未亲见。
- **主动**：未亲见。
- **记忆**：未亲见。
- **文件和工作区**：嵌进公司的 SharePoint、CRM，以及市场数据、申报、研报和专有数据源。
- **排列**：未亲见。
- **手机**：未亲见。
- **计费**：每家定制部署，由前金融从业者做变革管理伙伴；价格未公开。
- **被夸的**：首页客户语录（Truist Securities CEO、Nomura、Baird）属于厂商宣传。WSO liquidiot 认为它适合快速上手一个领域。
- **被骂的**：同 Hebbia 条目下 WSO liquidiot 的评价：产不出能直接交付的东西。
- **没看到的**：除首页外全部未亲见。

### Fintool（2026-04 被 Microsoft 收购）

- **来源**：<https://www.nicolasbustamante.com/blog/microsoft-has-acquired-fintool> <https://fintool.com/>
- **时间**：创始人博客 2026-04-18；2026-10-05 用 curl 访问 fintool.com 时被 301 跳转到 microsoft.com/microsoft-365。
- **工作的单位**：据创始人：2026 年 1 月发布 V5，是完全 agent 化的体验，agent 在后台自主干活，在 Excel 里建 DCF 模型、在 PowerPoint 里做业绩演示、在 Word 里写研究备忘录。此前是读业绩会、分析申报、综合研究、提示信号的 agent，是几千名专业投资者每天用的研究工具。
- **怎么开始**：未亲见。
- **干活时**：后台运行（创始人描述）。
- **提问和批准**：未亲见。
- **交付**：Excel、PowerPoint、Word 文件。
- **后续**：未亲见。
- **主动**：未亲见。
- **记忆**：未亲见。
- **文件和工作区**：未亲见。
- **排列**：未亲见。
- **手机**：未亲见。
- **计费**：独立产品已不存在，并入 Office 和 Microsoft 365。
- **被夸的**：未取得用户评价。
- **被骂的**：未取得。
- **没看到的**：被收购前的产品界面。

### Daloopa（含 Excel agent Scout）

- **来源**：<https://daloopa.com/> <https://www.wallstreetoasis.com/forum/off-topic/who-is-winning-the-ai-war-in-finance>
- **时间**：首页 article:modified_time 2026-08-25。
- **工作的单位**：一个 Excel 模型（或一个股票代码）。卖点是带出处的基本面数据：每个数字超链接到原始文件。Scout 是在 Excel 里建模、维护模型的 AI agent；数据也通过 API、MCP 供应给别的 AI（首页列出 Anthropic、OpenAI、Google、Perplexity、Microsoft）。
- **怎么开始**：下载 6000 多个股票的完整数据表开始覆盖，或者在已有模型里加一个 tab；业绩季一键更新。
- **干活时**：未亲见。
- **提问和批准**：未亲见。
- **交付**：Excel 里的数据和模型，每个数字链接到来源。
- **后续**：链接到数据库后自动更新。
- **主动**：业绩季更新（用户点按钮触发）。
- **记忆**：无。
- **文件和工作区**：用户自己的 Excel。
- **排列**：无。
- **手机**：未亲见。
- **计费**：未公开（有免费账户入口）。
- **被夸的**：WSO 发帖人拿它当「只做一件事」的例子（「Daloopa 只是一个 Excel 工具」），问大家要单点工具还是全栈副驾。
- **被骂的**：未取得。
- **没看到的**：Scout 的交互。

### Brightwave（已转型）

- **来源**：<https://www.brightwave.io/>
- **时间**：2026-10-05 读取首页。
- **工作的单位**：首页现在写的是「An agent infrastructure company」，做把 AI agent 安全接入工作系统的合规基础设施，已看不到金融研究产品。
- **怎么开始**：不适用。
- **干活时**：不适用。
- **提问和批准**：不适用。
- **交付**：不适用。
- **后续**：不适用。
- **主动**：不适用。
- **记忆**：不适用。
- **文件和工作区**：不适用。
- **排列**：不适用。
- **手机**：不适用。
- **计费**：不适用。
- **被夸的**：未取得。
- **被骂的**：未取得。
- **没看到的**：转型时间和原产品的去向。

### 秘塔 AI 搜索（简洁、深入、深度研究；专题；书架）

- **来源**：<https://metaso.cn/> <https://www.sohu.com/a/966584134_121956424> <https://aitoolstar.cn/metaso-ai-search-review/> <https://ai.36kr.com/note-detail/kb3538549317966838>
- **时间**：2026-10-05 在内置浏览器里以未登录状态打开首页并点开了范围菜单；搜狐入门指南 2025-12-18；AI 工具星球一个月测评 2026-05-28；36氪 AI 测评页 2026-07-31（SEO 聚合页，泛泛而谈，参考价值低）。
- **工作的单位**：一次搜索提问。首页（亲见）：一个输入框，下面三档强度「简洁」「深入」「深度研究」；范围下拉有「全网、文库、学术（所有文献 >）、图片、视频、播客」；有「互动网页」开关；输入框提示按「/」打开自定义技能；顶部入口有「学点啥」「视频生成」「幻灯片」「上传文件」「API」。侧栏有「主页、专题、今天学点啥、书架、设为默认、历史记录」。「专题」是用户自建的知识库（搜狐指南）。
- **怎么开始**：输入完整问题，选强度和范围；也可以上传 PDF、Word、PPT。指南说深度研究有「先想后搜」和「先搜后扩」两种路径。
- **干活时**：未亲见。
- **提问和批准**：未亲见。
- **交付**：结构化摘要，结论带脚注出处；深度研究出结构化报告和思维导图；学术模式选中文献后可以「生成引用」，给出多种格式（搜狐指南）；测评作者提到脑图和大纲是常用功能。
- **后续**：在结果上追问、要求换角度或补充资料（指南和测评都建议追问而不是重搜）。
- **主动**：未见。
- **记忆**：专题（个人知识库）和书架（上传自己的笔记、报告，之后提问定位）。
- **文件和工作区**：专题、书架。
- **排列**：历史记录。
- **手机**：有手机端，首页提示扫码使用。
- **计费**：核心功能免费，更深的搜索、批量检索等高级权益要订阅（第三方说法，没读到官方价目）。
- **被夸的**：AI 工具星球（2026-05-28，自称用了一个月）：学术模式下结果全是正经文献，格式规范能直接引用，算国内最省事的学术信息入口；脑图和大纲帮人几秒钟看清一个领域的大致地图。
- **被骂的**：同一篇测评：索引量和 Google 不在一个量级，搜冷门开源项目细节时直接找不到，只能回到传统搜索；当时还不能搜图（2026-10-05 首页的范围菜单里已经有「图片」，说明后来补上了）。
- **没看到的**：深度研究运行中的界面；专题的组织方式；登录后功能；价格。知乎上的讨论被安全验证页挡住。

### Kimi 深度研究（Kimi-Researcher）

- **来源**：<https://www.kimi.com/help/deep-research/deep-research-overview> <https://www.kimi.com/help/deep-research/deep-research-faq> <https://www.v2ex.com/t/1245367>
- **时间**：帮助中心页面无日期，2026-10-05 读取原文（导航里已有 Kimi K3、Kimi Work、Kimi Claw）。
- **工作的单位**：一次深度研究任务（异步），交付两份东西：一份万字以上的 Markdown 报告，一份可交互、可公开分享的 HTML 可视化报告。网页入口 kimi.com/deep-research；App 在工具栏切到深度研究 Agent 模式。
- **怎么开始**：输入研究问题并发送；Kimi 返回一次意图澄清，用户确认或细化方向，也可以点「做个全面的研究」跳过。帮助页建议提问时写明时间范围、地域、来源类型（例如医学限定 PubMed、AI 优先 arXiv），大问题拆成几次研究。
- **干活时**：进入自动执行后，可以实时看到检索关键词、推理过程和访问过的网址。通常 10 到 25 分钟，可以离开页面，完成后发通知。官方明确建议「耐心等待，避免主动终止」「切勿点击停止输出」：一旦启动就算消耗额度，主动停止或关页面也照扣。
- **提问和批准**：只有开始前那一次意图澄清；不能改计划。方向跑偏时，帮助页让用户点 👎 写明问题类型和具体偏差，1 到 3 个工作日核查属实后退还额度。
- **交付**：Markdown 报告有目录、多章节，引用嵌在正文里，点击跳转并高亮原文，平均引用约 26 个来源；可导出 PDF、Word。可视化报告能切换网页版和手机版预览，可复制源代码，可生成公开链接。
- **后续**：在会话里继续。报告太长被截断时，回复「继续」；复杂研究建议主动要求分章节生成；多轮对话后建议及时开新会话或做会话总结。
- **主动**：没有。
- **记忆**：单次任务上下文 128K token；帮助页没有提到跨任务记忆。
- **文件和工作区**：可以上传相关文件（功能页说法）。
- **排列**：会话列表。
- **手机**：App 支持。
- **计费**：与 Kimi Code 等会员功能共用一个额度池，按实际 token 消耗扣；一次深度研究约耗 5% 到 10% 的月度额度（以 Moderato 套餐为参照）；任务失败自动退还。V2EX 上一则会员转让帖（2026-09-28）显示 Pro 套餐月费 199 元，权益里包括深度研究 https://www.v2ex.com/t/1245367
- **被夸的**：未取得真实用户评价（知乎被安全验证页挡住）。
- **被骂的**：未取得。帮助页自己承认「极小概率」会搜偏题，并专门为此设计了退额度流程。
- **没看到的**：运行界面实物；用户评价。

### 豆包（深度研究已并入「豆包工作」）

- **来源**：<https://www.doubao.com/work/docs/>
- **时间**：帮助页标「更新于 2026-09-28」。搜索结果里有几个仿冒豆包官网的域名（如 doubaok.com.cn、doubaom.com.cn），没有打开。知乎文章《豆包工作Agent：四步跑通深度研究全流程》（2026-09-08）被安全验证页挡住。
- **工作的单位**：一个任务。深度研究不再是单独的入口，而是「豆包工作」的一项核心能力（「信息搜索与深度研究」），和文档/PPT/表格创作、数据分析、浏览器与电脑操作、定时任务并列。
- **怎么开始**：说明任务目标、参考资料（本地文件、网页、企业内部资料）、具体要求（格式、结构、篇幅、时间范围）。可以从电脑、浏览器、飞书发起。
- **干活时**：执行中可以查看进度、补充信息、调整要求。
- **提问和批准**：操作网页和电脑需要授权（帮助页说法），具体批准界面没看到。
- **交付**：研究报告、对比分析、决策参考，生成可继续修改和分享的文件。
- **后续**：生成初稿后继续提修改意见；「AI 编辑」可以选中文档、PPT、网页或应用里的具体位置定向修改。
- **主动**：定时任务：按周期自动执行并推送结果，帮助页举的例子是行业动态简报、周期性数据报表。
- **记忆**：未见。
- **文件和工作区**：企业版可以在权限范围内调用飞书里的企业知识。
- **排列**：另有「插件、技能、伙伴」，伙伴按角色分工协作（细节见 survey-persistent-agents）。
- **手机**：手机、电脑、网页、飞书都能发起或接续任务，跨端看进度和成果。
- **计费**：按订阅档位（「升级订阅」入口），具体档位没读。
- **被夸的**：未取得。
- **被骂的**：未取得。
- **没看到的**：深度研究在豆包工作里的具体交互；用户评价。

### 进门 AI进宝（研究模式、任务模式、聊天模式）与进门 AI 投研工作台

- **来源**：<https://finance.sina.cn/2026-07-24/detail-iniiwvke4424572.d.html?vt=4> <http://www.zqrb.cn/gscy/gongsi/2026-09-15/A1789459022308.html> <https://www.comein.cn/home/index>
- **时间**：新浪财经 2026-07-24（通稿口吻）；证券日报 2026-09-15（记者李春莲）。产品没登录，界面全部未亲见。
- **工作的单位**：三种单位并存。研究模式（2026-07 上线）：给每个个股、每条产业赛道建一个独立的长期研究空间。任务模式：研究员按自己的框架搭周期性监测、数据对比、舆情扫描、财报复盘等任务。聊天模式：即问即答，内置封装好的智能体和标准工作流（业绩点评、公司速览、主题产业链、写报告、搜图表）。
- **怎么开始**：研究模式：为标的开一个研究空间；聊天模式：一键调用封装好的工作流。
- **干活时**：未亲见。
- **提问和批准**：未亲见。
- **交付**：研究底稿、深度报告；工作台带云端 Office 和 Excel 在线编辑。
- **后续**：研究模式里信息自动归集存档，支持人机协同撰稿、批注留痕、版本回溯，在原有底稿上持续迭代（新闻稿原话「持续养报告、长期做跟踪」）。
- **主动**：研究模式：对重点标的设常态化监测任务，系统自动抓政策变动、经营数据、行业催化、公告和舆情等边际变化，更新到底稿上。
- **记忆**：研究空间本身就是沉淀：对话记录、研究逻辑、底稿都留在空间里。新闻稿把痛点概括为过去用 AI「对话记录分散、研究逻辑无法留存」「每次深度研究都要重新梳理背景」。
- **文件和工作区**：研究工作区、投研数据库（独家路演会议资源、海内外研报、行情）、文件归档。工作台集成以 OpenClaw 为核心的 agent 调度（证券日报）。
- **排列**：按标的、赛道组织的研究空间列表（推断自描述，未亲见）。
- **手机**：未亲见。
- **计费**：未亲见。
- **被夸的**：只有厂商口径：服务 300 万专业投资者，AI进宝上半年使用量同比增长 10 倍。
- **被骂的**：未取得。通稿引用一份「2026 年 AI 投研行业调研」，称超八成研究员认为现有工具只能满足基础查数和文字润色、撑不起中长期研究和动态跟踪；调研出处没写，未核实。
- **没看到的**：界面、价格、用户评价。

### 熵简科技 AlphaClaw（Alpha派 所属公司的投研 agent）

- **来源**：<https://www.aipuzi.cn/ai-news/alphaclaw.html> <https://baike.baidu.com/item/AlphaClaw/67481174>
- **时间**：AI铺子 2026-03-14（第三方介绍，口吻接近宣传稿）；百度百科条目只在搜索结果里看到摘要：2026-03-11 推出，初期版本 alpha-1.0 Beta，运行在 AlphaEngine 桌面端。Alpha派 App 本身没打开。
- **工作的单位**：桌面端的一个投研 agent（「会做投研的 AI 分析师」，昵称「投研小龙虾」），本地优先。
- **怎么开始**：用自然语言下指令；可以上传投资大师的著作或股东大会纪要，提炼成可复用的投研 Skill；上传自己的历史点评，让它学行文风格。
- **干活时**：任务流程可视化，每一步可见；可暂停、继续、终止（介绍文说法）。
- **提问和批准**：未亲见。
- **交付**：Excel、Python 因子代码和回测脚本、研报点评、策略回测报告，可导出 Word 和 Markdown。
- **后续**：未亲见。
- **主动**：未亲见。
- **记忆**：Skill 和向量索引在本地；学写作风格（介绍文说法）。
- **文件和工作区**：内置研报、纪要、公告、宏观数据库（介绍文称每天更新近万篇）。
- **排列**：未亲见。
- **手机**：未亲见。
- **计费**：未亲见。
- **被夸的**：未取得。
- **被骂的**：未取得。
- **没看到的**：Alpha派 App 的交互；AlphaClaw 实物。

### Wind Alice（万得艾思）与 WindClaw

- **来源**：<https://www.wind.com.cn/portal/zh/AI/windAlice.html> <https://windalice.com/> <https://market.windalice.com/> <https://finance.eastmoney.com/a/202603123670244277.html>
- **时间**：Wind 官网 Alice 页（Bing 显示 2026-06-24）、windalice.com、Alice Market 页于 2026-10-05 读取；WindClaw 发布报道 2026-03-12（北京商报，东方财富网转载）。
- **工作的单位**：Wind 官网上的 Alice 是一组嵌在 Wind 金融终端里的工具：Alice Chat（金融问答、数据提取）、Alice Reader（多文档检索问答、摘要、图表转数据表）、Alice Meeting（音视频转写、关键词定位、对会议内容提问）、Alice Writer（研报大纲、段落生成、刷新数据、引用底稿溯源）、Marketing、Translate。windalice.com 的新定位是「金融专业人员的 AI 工作伙伴」，有 App 和网页版，另有 Alice Market（向外部 agent 开放数据、工具、Skill 和专家 Agent，走 MCP、Skill、API）和 Alice Feed（企业数据服务）。WindClaw（2026-03-11）：投研智能体平台，可一键安装、本地运行，多智能体协作，持续跟踪市场信息。
- **怎么开始**：Alice：在终端里问答或打开文件；WindClaw：零代码一键部署后使用。
- **干活时**：未亲见。
- **提问和批准**：未亲见。
- **交付**：问答、摘要、结构化数据表、研报草稿；Writer 能定位生成内容引用的来源和底稿。
- **后续**：Writer：刷新数据、扩写、改写。
- **主动**：WindClaw：多智能体组成持续运行的投研体系，持续跟踪和分析市场信息（报道说法）。
- **记忆**：WindClaw：研究逻辑、策略偏好、相关数据存在本地设备；每只「小龙虾」在互动中学习用户的研究习惯和投资偏好。
- **文件和工作区**：Wind 数据库（行情、财务、行业、公告、资讯）；用户可以上传自有文件到 Alice Reader。
- **排列**：WindClaw 另设一个只有 AI 智能体能参与的投资论坛，用户训练的智能体在上面自动分享观点、和别的智能体交流（报道说法）。
- **手机**：有 App（windalice.com 下载入口）。
- **计费**：未亲见（终端订阅体系）。
- **被夸的**：未取得。
- **被骂的**：未取得。
- **没看到的**：界面实物、价格、用户评价。

### 同花顺 i问财 与 iFinD 投研智能体

- **来源**：<http://www.zqrb.cn/gscy/ggkx/2026-02-03/A1770102189586.html> <http://iwencai.com/unifiedwap/home/index?from=wencaiMobile>
- **时间**：证券日报 2026-02-03（同花顺在互动平台回答投资者提问的转述）。问财首页只在搜索结果里看到摘要，没有打开读交互。
- **工作的单位**：i问财：面向中小投资者的金融智能体（选股、诊股、资产配置）；iFinD：面向机构的金融数据终端，采用「多智能体」架构，覆盖投行、信贷、投研、交易、风控。
- **怎么开始**：自然语言提问（问财一贯的选股句式），支持端到端语音交互和全双工实时对话（公司说法）。
- **干活时**：未亲见。
- **提问和批准**：未亲见。
- **交付**：未亲见。
- **后续**：跨轮对话（公司说法）。
- **主动**：未亲见。
- **记忆**：未亲见。
- **文件和工作区**：公司积累的金融数据和「专业 MCP 工具」。
- **排列**：未亲见。
- **手机**：同花顺 App 内。
- **计费**：未亲见。
- **被夸的**：未取得。
- **被骂的**：未取得。
- **没看到的**：几乎全部。

### 东方财富 妙想（妙想投研助理、妙想 Skills、ClawBot 数字员工）

- **来源**：<https://www.cs.com.cn/qs/2026/08/12/detail_2026081210030812.html> <https://caifuhao2.eastmoney.com/news/20260520160056886028600>
- **时间**：中证网 2026-08-12（东方财富证券董事长访谈）；东方财富财富号 2026-05-20（官方号文章）。搜索摘要另显示：妙想 Skills 于 2026-03-13 发布（百度百科），2026-06-04 接入火山引擎 ArkClaw。
- **工作的单位**：三种形态。面向散户：深度集成在东方财富 App 里（行情标的分析、热点资讯解读、研报精简摘要、持仓体检、和条件单、网格交易结合）。妙想投研助理：面向专业用户的投研助手。2026 年起把能力拆成 Skill 和「数字员工」：2026-05-20 以 ClawBot 形态上架阿里云 JVS Claw 数字员工广场，用户在广场里启动这个 Bot，用对话发起投研任务。
- **怎么开始**：对话发起：业绩解读、行业主题跟踪、宏观指标分析、研报信息整理等。
- **干活时**：未亲见。
- **提问和批准**：未亲见。
- **交付**：数据查询、信息归纳、分析框架和结构化结果（官方号说法）。
- **后续**：未亲见。
- **主动**：未亲见。
- **记忆**：未亲见。
- **文件和工作区**：东方财富的金融数据库加金融垂直 agent。
- **排列**：未亲见。
- **手机**：东方财富 App 内。
- **计费**：未亲见。
- **被夸的**：未取得。
- **被骂的**：未取得。
- **没看到的**：专业版界面、用户评价。

### Reportify（Reportify Agent、智能任务、公开研究）

- **来源**：<https://reportify.cn/>
- **时间**：2026-10-05 在内置浏览器以未登录状态读取首页（页面内容随当天市场更新：国庆休市、10 月 8 日开市）。
- **工作的单位**：三层单位。一次研究：输入问题或分配任务，用「/」指定要加载的技能；模式标签有「投资分析、量化选股、文档搜索」，另有「创建技能」「创建智能体」。智能任务：设一次就持续追盯的订阅。公开研究：首页列出别人做过的研究，每条以一个问题开头，下面挂几个已回答的子问题（打「✓…——已答」），最后一条是「＋可进一步研究：带上你持有的公司……」，并显示「233,967 人看过」这样的观看数；「第一轮研究免费看全程 · 想到自己的事随时追问」。
- **怎么开始**：首页给出句式模板，可以把 XXX 换成自己关注的标的：「帮我看看XXX最近怎么样」「搞清楚XXX为什么涨/跌」「把XXX的研报和纪要找齐」「我持有XXX，最近该注意什么」；或者点开一条公开研究接着问；或者点「现在市场上发生了什么」里别人正在问的问题「跟着问」。
- **干活时**：未亲见。
- **提问和批准**：未亲见。
- **交付**：研究结果（具体形态未亲见）；智能任务的推送消息在首页用灰框展示样例。
- **后续**：在对话里接着追问（「发出后在对话里接着问」）。
- **主动**：智能任务卡片，每张写明频率、送达时间、一条样例消息和在用人数：每季「财报自动解读」（财报发布 30 分钟内，3,776 人在用）、每日「个股每日报告」（早 9 点，3,058 人）、每日「行业晨报」（开盘前，3,547 人）、每周「持仓周报」（周一早上，2,214 人）、条件触发「到价提醒 + 分析」（触发那一刻附估值分位、回调原因、该注意的信号，2,283 人）、每日「异动第一时间说明」（盘中放量或跳水时，1,908 人）。
- **记忆**：未见。
- **文件和工作区**：研报、纪要、公告等文档搜索。
- **排列**：可以「创建智能体」，细节未亲见。另有直播活动「小R投研实战场」，每期围绕一个正在发生的投资主题现场演示一次研究。
- **手机**：未亲见。
- **计费**：有定价页，未读。
- **被夸的**：未取得用户评价（知乎的使用文章被安全验证页挡住）。
- **被骂的**：未取得。
- **没看到的**：登录后的界面、价格、智能任务消息在哪里收（站内、微信还是邮件）。

### ARIS（Auto-Research-In-Sleep，开源，跑在 Claude Code / Codex 等编程智能体里）

- **来源**：<https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep> <https://github.com/wanshuiyin/ARIS-Anything>
- **时间**：gh api 取 README，仓库 2026-09-29 有推送，约 1.7 万星；ARIS-Code CLI v0.4.28 发布于 2026-09-28。
- **工作的单位**：一个项目目录加一组斜杠命令工作流（Markdown 写的 skill，80 多个）：/idea-discovery、/auto-review-loop、/research-pipeline（一条提示从找想法到论文）、/paper-writing、/rebuttal、/proof-orchestrator 等。核心设计是「一个模型执行、另一家模型审查」（例如 Claude 执行、GPT 审查），README 认为同一个模型自审会陷进盲区。2026-09-16 起也可以作为 Claude Code 插件安装。ARIS-Anything 把同一个五步循环（计划、起草、对抗审查、迭代、持久化）推广到学术以外的研究。
- **怎么开始**：在编程智能体里敲命令并带参数，例如 /research-pipeline "课题"，或加 — ref paper: 链接、— base repo: 仓库地址。可选参数包括 sources（zotero、obsidian、local、web、semantic-scholar、openalex 等）、venue（ICLR、NeurIPS……）、gpu（本机、远程 SSH、按需租 Vast.ai）。
- **干活时**：在终端或 CLI 里长时间运行，主打「睡觉时让它做研究」。2026-06-19 起夜间循环能发现自己挂掉或卡住。2026-08-02 的 v0.4.23 专门解决 README 所说的「头号真实用户抱怨」：ARIS 把思考过程和读到的整篇文档全倒在屏幕上，于是把工具输出折叠起来。
- **提问和批准**：可配置的检查点：AUTO_PROCEED 决定是全自动还是逐步批准（2026-03-13 加入）；human checkpoint 参数开启后，每轮审查后暂停，让人看分数、给修改指令、跳过某些修复或提前停止。rebuttal 模式规定每个承诺都要用户批准。2026-03-14 起接飞书：off、push、interactive 三种模式，实验、审查、检查点都推送到手机。
- **交付**：写进项目目录的文件：Markdown 报告、LaTeX 编译的 PDF、海报等。2026-05-26 起 8 个主要检查点自动把 Markdown 产物渲染成单文件 HTML 方便看，Markdown 仍是正本。
- **后续**：重跑某个工作流，或从中间某个工作流接着做（README 说已有想法就跳到 1.5，有结果就跳到 3，收到审稿意见就跳到 4）；CLI 支持 /resume 恢复会话。
- **主动**：主动推送靠飞书集成；没有内置的定时触发（要跑过夜由用户启动）。
- **记忆**：Research Wiki（/research-wiki init 一次后自动维护）：在项目里建 research-wiki/，分论文、想法、实验、结论四类节点加关系图；找文献时自动收录论文，生成想法前先读 wiki，失败的想法当作禁用清单，实验结果回写为结论的支持或推翻。README 的说法是「失败的想法是最有价值的记忆」，没有 wiki 时每次 /idea-discovery 都从零开始。
- **文件和工作区**：全部在用户自己的项目目录里；文献来源可以是 Zotero、Obsidian 和本地 PDF。
- **排列**：无多智能体名册；执行者和审查者是两个模型。
- **手机**：通过飞书接收通知和参与检查点。
- **计费**：开源免费，费用是用户自己的模型 API 或订阅额度。
- **被夸的**：社区参与度高（README 列出大量社区贡献的合并）；没有收集到独立的长评。
- **被骂的**：README 自己记录的头号用户抱怨是终端刷屏（v0.4.23）；还有一连串因上游变化（codex-cli 0.154 移除 mcp-server）导致审查调用全部失效、需要重新注册的问题（2026-09-10、09-16）。
- **没看到的**：飞书 interactive 模式的消息样式。

### ai-berkshire（开源的价值投资研究 skill 合集，跑在 Claude Code / Codex 里）

- **来源**：<https://github.com/xbtlin/ai-berkshire> <https://www.v2ex.com/t/1222186>
- **时间**：README 2026-10-05 读取（报告索引更新到 2026-09-28，仓库约 1.66 万星）；作者在 V2EX 的介绍帖发布于 2026-06-23，235 条回复，最新回复 2026-08-24。
- **工作的单位**：一个仓库加 20 个斜杠命令 skill：深度研究类（/investment-research、/investment-team、/management-deep-dive、/private-company-research、/deep-company-series）、财报类（/earnings-review、/earnings-team）、行业筛选类（/industry-research、/industry-funnel、/quality-screen 等）、持仓管理类（/portfolio-review、/thesis-tracker、/thesis-drift、/news-pulse）。/investment-team 同时启动 4 个独立 subagent，按巴菲特、芒格、段永平、李录四种视角各自搜索、各自判断，再由 Team Lead 综合，中间有一轮互相质疑。
- **怎么开始**：在 Claude Code 里输入命令加标的，例如「/investment-team 腾讯」「/earnings-review 腾讯 2025Q4」「/quality-screen 茅台, 英伟达」。
- **干活时**：终端里运行 subagent；财务计算走 Python decimal，关键数据至少两个独立来源交叉验证。
- **提问和批准**：无显式批准；README 的「留白原则」是数据不足时标为灰色地带，不用推测冒充确定。
- **交付**：强制给结论的报告：通过、不通过或灰色地带，附分层建议（激进、稳健、保守三档各自的仓位和价格区间）和「镜子测试」（5 句话说不清为什么买就不买）。报告存进仓库，README 称已有 2377 份、111 家公司、23 个专题，按公司和专题建索引。
- **后续**：/thesis-tracker：买入后持续跟踪投资论点是否被证伪；/thesis-drift：对比两份论点或报告，区分事实变了、估值变了还是只是措辞变了。README 强调同样输入得到结构一致的输出，所以半年后重跑同一家公司可以直接对比。
- **主动**：无。
- **记忆**：报告和索引就是记忆，以文件形式存在仓库里。
- **文件和工作区**：Git 仓库目录。
- **排列**：4 个大师视角的 subagent 加一个 Team Lead。
- **手机**：无。
- **计费**：开源免费，耗用户自己的模型额度；V2EX 上有人问跑一次要用掉多少周限额。
- **被夸的**：V2EX 帖下多人说「当场 star」，有人认为它「相当于起到研究员的作用，收益本质还是靠自己的判断」。另有一位用户分享自己的做法：用 Gemini deep search 从谨慎、中性、积极三个角度给目标价，再自己做一个网页跟踪目标价和实时价的偏离 https://www.v2ex.com/t/1222186
- **被骂的**：同帖：要 Codex 版，觉得「Claude Code 门槛还是有点高」（作者后来做了 Codex 兼容）；数据源受限，有用户跑小米只拿到 2024 年财报，希望能接自己的付费数据源；有人质疑「两年实盘收益」和这套工具的因果关系；有人认为 LLM 做投研最大的风险是让人很快碰到自己的认知上限、变得盲目浮躁。
- **没看到的**：无。

### gpt-researcher（开源）

- **来源**：<https://github.com/assafelovic/gpt-researcher>
- **时间**：README 2026-10-05 读取，仓库 2026-10-01 有推送，约 3 万星。
- **工作的单位**：一次研究任务一份报告。planner 生成研究问题，execution agent 分头收集，publisher 汇总成报告；Deep Research 模式按树状递归展开子主题，单次约 5 分钟。
- **怎么开始**：本地网页界面（localhost:8000）或 Python 调用；也能装成 Claude Skill 在 Claude 对话里用。来源可以是网页、本地文档，或通过 MCP 接 GitHub、数据库等。
- **干活时**：未亲见。
- **提问和批准**：README 未提。
- **交付**：2000 字以上的报告带引用，可嵌入 Gemini 生成的配图，可导出 PDF、Word 等。
- **后续**：README 称研究过程中保持记忆和上下文。
- **主动**：无。
- **记忆**：单次研究内。
- **文件和工作区**：本地文档。
- **排列**：多个 agent 角色。
- **手机**：无。
- **计费**：开源，费用是所用模型和搜索 API。
- **被夸的**：未收集。
- **被骂的**：未收集。
- **没看到的**：界面。

### local-deep-research（开源，LearningCircuit）

- **来源**：<https://github.com/LearningCircuit/local-deep-research>
- **时间**：README 2026-10-05 读取，仓库当天有推送，约 9 千星；正在验证 v2.0.0 候选版。
- **工作的单位**：一次研究（快速流水线或完全 agent 化的 LangGraph 策略），外加一个会越积越多的加密 Library，以及订阅式研究。
- **怎么开始**：本地网页界面（localhost:5000）、Python 或 MCP。研究表单里可以设「egress scope」：Public only（只用公开网页和学术引擎）、Private only（只用本地资料库，强制本地模型）、Strict（只用一个主引擎）、Adaptive（默认，跟着主引擎走）。
- **干活时**：WebSocket 实时显示研究进度。
- **提问和批准**：未见。
- **交付**：带引用的报告，可导出 PDF 或 Markdown；可设置是否在正文里保留未被引用的来源。
- **后续**：Chat Mode：多轮研究对话，跨轮累积上下文；有 follow-up research 功能；Research History 可以保存、搜索、重访过去的研究。
- **主动**：News & Research Subscriptions：订阅话题或具体查询，AI 只筛选汇总最相关的进展，按天、按周或自定义周期送达，形式是 Markdown 报告或结构化摘要；通知可走 Apprise。
- **记忆**：Library：每次研究找到的论文、网页可以下载进按用户加密的库，自动抽文本、建索引，下次研究时同时搜你的库和实时网页（README：「你的知识会复利增长」）；另有带语义搜索的 Notes。
- **文件和工作区**：本地加密数据库（每个用户一个 SQLCipher 库）；可接 Paperless-ngx、Elasticsearch 等本地文档库。
- **排列**：无。
- **手机**：无。
- **计费**：开源；可以完全跑在本地模型上。
- **被夸的**：README 自报单张 RTX 3090 本地跑 SimpleQA 约 95%；项目还有 r/LocalDeepResearch 社区（Reddit 返回 403，没打开）。
- **被骂的**：未收集。
- **没看到的**：界面实物。

### Khoj（开源，自托管或 Khoj Cloud）

- **来源**：<https://github.com/khoj-ai/khoj> <https://docs.khoj.dev/features/automations>
- **时间**：README 2026-10-05 读取；最近推送 2026-08-02，最新 release 是 2026-03 的 2.0.0-beta.28，更新放缓。
- **工作的单位**：一个「第二大脑」助手：对话加自定义 agent（各自的知识、人设、模型和工具）。
- **怎么开始**：从浏览器、Obsidian、Emacs、桌面端、手机或 WhatsApp 提问；可以做 deep research（README 列出）。
- **干活时**：未亲见。
- **提问和批准**：未见。
- **交付**：对话回答；分享对话。
- **后续**：对话。
- **主动**：Automations：让查询按设定的时间和频率自动运行，研究结果以邮件发给你，例如自定义 newsletter、新闻摘要、世界事件提醒；在 automations 页配置、分享、删除；自托管要自己配邮件服务。
- **记忆**：你的文档作为知识库。
- **文件和工作区**：自己的文档和笔记。
- **排列**：自定义 agent 列表。
- **手机**：手机和 WhatsApp 可用。
- **计费**：开源自托管，或 Khoj Cloud（本轮没读价格）。
- **被夸的**：未收集。
- **被骂的**：未收集。
- **没看到的**：deep research 的具体交互。

### Zotero 接智能体（zotero-mcp、llm-for-zotero 等）

- **来源**：<https://github.com/54yyyu/zotero-mcp> <https://github.com/yilewang/llm-for-zotero> <https://support.elicit.com/en/articles/14744239-import-papers-from-zotero>
- **时间**：两个仓库都在 2026-10-04 有推送（zotero-mcp 约 5.2 千星，llm-for-zotero 约 3.2 千星），README 于 2026-10-05 读取。
- **工作的单位**：两条路。一是把 Zotero 文献库当作外部 agent 的数据源和工具：zotero-mcp 提供 MCP 服务器（给 Claude、ChatGPT 等聊天应用）或 zotero-cli 加 agent skill（给 Claude Code、Codex、Cursor 等编程智能体）。二是把 agent 放进 Zotero 里面：llm-for-zotero 在 Zotero 阅读器里聊当前 PDF、选中文字、图表，有独立窗口，分「论文对话」和「文献库对话」，Agent Mode 能在全库读、搜、打标签、改元数据、导入、编辑笔记、整理。
- **怎么开始**：zotero-mcp：在 Zotero 7 以上打开本地 API，运行 zotero-mcp setup 自动配置 Claude Desktop，然后直接问「在我的库里找关于注意力机制的论文」「总结这篇的主要发现」「把这篇 PDF 的主要论点高亮」。llm-for-zotero：在 Zotero 里打开论文或独立窗口提问，后端可以是 API key、本地模型、ChatGPT 网页同步、Codex App Server 或 Claude Code。
- **干活时**：未亲见。
- **提问和批准**：zotero-mcp 的写操作在 Zotero 10 以上要先运行一次 authorize-local 并选 Always Allow；旧版本走 web API 要 API key。
- **交付**：zotero-mcp：按标题、作者、标签、collection、全文或语义搜索，读元数据、BibTeX、全文、指定页（数学和图表抽不好时给页面图片），把高亮和框选精确放在对应的词、图、表、公式上，写笔记，按 DOI、URL、ISBN 加论文，管理 collection 和标签，合并重复，可选 Scite 引用统计和撤稿提醒。llm-for-zotero：带引用的回答，引用能跳回原段落；回答、整段对话、研究笔记存成 Zotero 笔记，或存到 Obsidian、Logseq 等本地 Markdown 文件夹。
- **后续**：llm-for-zotero 的 Agent Mode 会在长时间研究中保留论文上下文、已读证据和覆盖情况，上下文满了自动压缩旧对话。
- **主动**：无（Scite 撤稿提醒是查询时显示）。
- **记忆**：文献库本身，加上存下来的笔记。
- **文件和工作区**：用户本机的 Zotero 库（本地模式直接读 zotero.sqlite）。
- **排列**：llm-for-zotero 自带 8 个内置 skill，也能自建。
- **手机**：无。
- **计费**：开源；zotero-mcp 的 README 专门算了上下文成本：MCP 服务器默认 38 个工具每次请求占 13,448 token，skill 方式在被用到之前只占 98 token。
- **被夸的**：未收集独立长评；两个仓库星数和更新频率说明用的人不少。Elicit 也支持从 Zotero 导入（帮助页标题可见）。
- **被骂的**：未收集。
- **没看到的**：实际使用画面。

## unitComparison

- 材料怎么给：表格为单位，先有一批对象（检索结果或上传文件），列是问题。笔记本为单位，由人把来源放进去，或者让它找来源、人勾选导入，回答只能出自这些来源。报告为单位，给一个问题和来源范围（网页、文件、云盘、指定站点），材料由它自己去找。智能体为单位，一次性配好数据源、覆盖池和方法论，之后不再逐次给材料。
- 来源怎么限定：笔记本最严，逐份勾选。表格靠对象清单本身限定。报告靠开关和站点名单：ChatGPT 可以只搜或优先搜指定站点；Gemini 取消 Google Search 就只用 Gmail、Drive 和文件；Consensus 可以限定期刊、研究设计、引用数；秘塔分全网、学术、文库、播客；local-deep-research 用 egress scope 强制只用本地资料加本地模型。智能体为单位依赖厂商的数据库（AlphaSense 5 亿份文档、Wind、东方财富），用户能否限定，本轮没看到。
- 过程可见、能不能改：表格逐格可见、可以改列重跑。笔记本基本没有「过程」，只有 thinking steps 可展开。报告为单位分三档：能改计划（ChatGPT、Gemini），只能在开始前澄清一次（Kimi、Elicit agent、Undermind），运行中能插话（Perplexity 可以追加问题，ChatGPT 官方摘要说能打断调整重点）；Elicit Report 是唯一读到的可以事后回去改中间步骤再出新版本的。智能体为单位的过程在后台，人看到的是推送。
- 结果形态和出处：表格的出处在格子上（Hebbia 格里写日期、状态、口径；Consensus 矩阵格子点开是原句）。笔记本是每句可悬停、点击跳原处的引用。报告是长文加行内引用、来源列表、活动记录，Consensus 和 Kimi 做到点击引用后高亮原文。智能体交回的是工作成品：模型、备忘录、演示、仪表盘（Hebbia Max 宣称 Excel 模型每格都带引用）。
- 持续几周的课题：表格本身不延续，要放进 Project 或用 Routine 的 Track artifact 定期更新。笔记本可以一直加料，但不会自己更新，也不记得别的笔记本。报告为单位最差，每次重来，用户只能手动把旧报告当新来源喂回去（HN alvdef 的做法是另建 Obsidian 知识库）。项目或研究空间是目前各家给出的延续方案（Elicit Projects、Undermind Projects、进门研究模式）。智能体为单位宣称记住项目历史和风格，但本轮没有使用证据。
- 提醒和跟踪：表格和笔记本都没有。报告为单位只有完成通知。项目层通过 Routine、监测任务把增量写回原产物（Elicit 的 Track artifact、进门的「持续养报告」）。智能体为单位由事件触发（AlphaSense 宣称不按固定节奏、事件一发生就动作）。订阅式卡片（Reportify）是另一条路：不经过项目，直接订一类消息。
- 专业用户的评价倾向：学术侧（SMU 图书馆 Aaron Tay、AI for Academic 的外科医生作者）主张各工具只管一个阶段，检索记录、去重、纳入决策要留在任何一个 AI 界面之外。金融侧（WSO）认为这类工具适合漏斗顶端、快速上手，但产不出能直接交付的东西。普通用户对报告为单位的抱怨集中在：不能接着上次做、文风套路、额度被一次浪费。

## 没查到的，来源说明

- 没有登录或试用任何产品。只有秘塔、Reportify、SciSpace 的未登录首页是我在内置浏览器里亲眼看到的，其余界面全部来自文档、博客、新闻稿或第三方描述。
- OpenAI 帮助中心在内置浏览器和 curl 下都卡在 Cloudflare 的验证页，没有绕过；archive.org 也拒绝了访问。ChatGPT deep research 的条目只靠 Bing 搜索摘要里的官方原句和 ChatAI Guide 的转述。
- 知乎（安全验证页）、Trustpilot（Verifying Connection）、Reddit（403）、WSO 帖子的大部分评论（要邮箱解锁）都没有取得，所以国内产品和金融产品的真实用户评价很少。
- 金融产品（AlphaSense、Hebbia、Rogo、Daloopa，国内的 Wind、进门、妙想、问财、AlphaClaw）的交互细节大多来自厂商页或通稿，几乎没有使用者的评价；AlphaSense SuperAnalyst 尚未上线。
- Perplexity Labs 的去向，两种第三方说法互相矛盾（改名为 Create files and apps，或者并进 Computer），官方没有说明。
- Alpha派 App 本身没打开；Brightwave 何时转型不知道；Rogo 只读了首页；同花顺问财只读到一篇转述。
- Elicit、Consensus、SciSpace、AlphaSense、Reportify 的具体价格没读到。
- 手机端：只读到 Gemini Notebook、Gemini Deep Research、Kimi 的说明，以及 AlphaSense、Wind Alice、秘塔「有 App」的一句话，其余未见。
- 进门通稿里「超八成研究员认为现有工具只能满足基础查数」这类数字，来自没有写明出处的「行业调研」，未核实。
- 本轮页面大多是我自己用 curl 抽正文或在浏览器里取页面文字读的，没有依赖 WebFetch 摘要。36氪的「AI 测评」页是 SEO 聚合页，只作背景，不作证据。
