# 交互形式调查：简报、监控和跟踪

原始记录（2026-10-05）。每条说法以所附网址的原文为准。

## 形式

### 系统猜题的每日简报

- **骨架**：单位：一天一期的一页或一组卡片。开始：用户不发起，系统夜里根据记忆、聊天历史、邮件和日历自己选题。过程：不可见。交付：早上出现在应用里，一条一卡，可展开。后续：拇指反馈、说想看什么；能追问（Pulse），或直接在条目上回邮件、排日程、建待办（Gemini Daily Brief）；隔天整期换新。
- **例子**：ChatGPT Pulse（2025-09 至 2026-06）、Gemini Daily Brief、Slack Recap 里系统推荐频道的部分。
- **适合**：系统手里有带截止时间、带对象的私人数据（邮件、日程、待办），而且条目上能直接做动作的场合。Gemini Daily Brief 的三段式（要紧的、知道就行、往后看）和每条可查来源，是这种形式目前还在扩张的版本 https://gemini.google/overview/daily-brief/
- **在哪里坏**：选题只有聊天历史可依时：内容变成旧对话的重述，继续追已经解决的问题，读完没有可做的事。OpenAI 在 2026-06-17 下线 Pulse，把主动更新并进用户自己定义的定时任务 https://help.openai.com/en/articles/6825453-chatgpt-release-notes ；用户侧证据见 https://news.ycombinator.com/item?id=45375477 和 https://news.ycombinator.com/item?id=48062680 ；第三方复盘 https://prowlo.com/blog/chatgpt-pulse-shut-down

### 用户自己定的定时任务和监测任务

- **骨架**：单位：一句指令加一个计划，挂在一条对话或一个助手上。开始：在对话里说带时间的话，系统回确认卡；或在任务页新建；或把刚才问过的问题设成定时。过程：无人值守，需要批准时暂停。交付：结果回到原对话，再发推送或邮件；监测类只在有变化时才出声。后续：一张任务列表管全部（下次运行、暂停、改、删、看结果）；可分享成模板。
- **例子**：ChatGPT 定时任务、Perplexity Computer 的 Scheduled Tasks、Microsoft 365 Copilot 的 scheduled prompts 和 Cowork、飞书知识问答的定时任务、Linear Loops、follow-builders。
- **适合**：读的人说得清自己要盯什么的场合：每日或每周的固定简报、盯某个条件、盯某个仓库或频道。各家都在往这里收：ChatGPT 加了事件触发（Gmail、Slack、GitHub PR）https://help.openai.com/zh-hans-cn/articles/10291617-scheduled-tasks-in-chatgpt ；飞书把周期性问题直接变成定时推送 https://www.feishu.cn/hc/zh-CN/articles/854453754409-%E4%BD%BF%E7%94%A8%E7%9F%A5%E8%AF%86%E9%97%AE%E7%AD%94
- **在哪里坏**：任务悄悄停掉而人不知道：ChatGPT 的任务会因不活跃、等批准、关联对话被删而暂停（同上帮助页）。数量上限很低：ChatGPT 3 到 15 个，Copilot 10 条 https://support.microsoft.com/en-us/microsoft-365-copilot/schedule-your-most-used-copilot-prompts 。上游数据断了就整期空掉：follow-builders 的中心 feed 多次停更 https://github.com/zarazhangrui/follow-builders/issues 。用户说不清要什么时，这种形式帮不上。

### 有人编好的定期刊物

- **骨架**：单位：一期（日报、周刊、半年刊）。开始：订阅一次。过程：编辑或流水线替所有读者选同一批内容。交付：邮件或网页，固定栏目、固定长度，每条一两句加原文链接，常标阅读时间。后续：点链接去原文，除此没有动作；往期存档可查。
- **例子**：TLDR、AIHOT 日报、Thoughtworks 技术雷达、Feedly 的自动 Newsletter（团队内刊）、Linear Pulse 的每周摘要。
- **适合**：想用很少时间知道圈子里大概发生了什么的人。有篇幅上限和明确的读完点是它的长处：AIHOT 日报标着几件事、几分钟读完 https://aihot.news/daily ；技术雷达半年一期，读者说靠它保持大致同步 https://news.ycombinator.com/item?id=48920193
- **在哪里坏**：内容对所有人一样，和读的人自己的技术栈、项目无关；读完没有下一步。读者的说法是多数资讯源给的原始信息太多，筛到累了就全部退订 https://news.ycombinator.com/item?id=48414812 ；还有人干脆不追了，理由是（HN 用户 PaiDxng）"anything truly important survives the 48-hour filter" https://news.ycombinator.com/item?id=48939630 。节奏太慢也是问题：雷达一年两期 https://news.ycombinator.com/item?id=45838036

### 订阅流加收件箱分拣

- **骨架**：单位：一条条目（文章、通知线程、动态）。开始：用户自己订源（RSS、仓库、圈子、人、项目）。过程：条目不断进来。交付：一个按时间排的列表，带未读状态。后续：逐条分拣（已看、稍后读、存档、保存、退订），可建筛选视图；有的能对单篇或全库提问。
- **例子**：Readwise Reader、Feedly、GitHub 通知收件箱与 Releases 订阅、Hugging Face 通知、即刻、Linear Pulse 的 feed。
- **适合**：源不多、读的人愿意自己做筛选的场合；需要精确控制订什么的场合（GitHub 可以只订某个仓库的 Releases；Linear 的订阅规则按项目成员、负责的 initiative、团队来定 https://linear.app/docs/pulse ）。
- **在哪里坏**：源一多就淹：GitHub 员工自己说被通知淹没、只能靠邮件过滤，另做了一个收件箱 https://news.ycombinator.com/item?id=46859010 ；有人 99% 的 GitHub 邮件自动清掉 https://news.ycombinator.com/item?id=42778129 。给的是碎片，判断还得自己做（关于即刻的文章自己这么说）https://www.cooyue.com/article/share-20260911-5.html 。Linear 在 2026-09-03 把收件箱分成优先和其他两栏，是对这个问题的一次修补 https://linear.app/changelog/2026-09-03-priority-inbox

### 缺席之后的回顾摘要

- **骨架**：单位：一场会议、一个频道的一天、一个项目的一周。开始：多数默认开着（飞书在你是组织者时自动开 AI 总结），或用户选好要回顾的频道。过程：会中可问它刚才说了什么。交付：一份摘要（要点、谁说了什么、待办、章节），每条能跳回原话、原消息或录音的那个时刻。后续：接着问、改文档、导出、分享；有的可以听。
- **例子**：Slack Recap 与频道摘要、Teams 的 Copilot 会议回顾、飞书智能纪要与妙记、钉钉 AI 听记、Linear Pulse 摘要。
- **适合**：事情已经发生、有完整原始记录、读的人只想知道结论和自己的待办。送达位置贴着原事件时最顺：飞书把纪要发进会议群或一对一聊天 https://www.feishu.cn/hc/zh-CN/articles/244959839578-%E5%9C%A8%E8%A7%86%E9%A2%91%E4%BC%9A%E8%AE%AE%E4%B8%AD%E4%BD%BF%E7%94%A8%E6%99%BA%E8%83%BD%E7%BA%AA%E8%A6%81 ；Copilot 把回顾贴在会议聊天和日历事件上；Slack 的 Recap 明说是为了替代实时打断 https://slack.com/help/articles/25076892548883-Guide-to-AI-features-in-Slack
- **在哪里坏**：原始记录不在就什么都没有：没开转写就没有回顾，中途补课只覆盖 Copilot 打开之后 https://www.explainx.ai/blog/microsoft-copilot-in-teams-meeting-recap-guide-2026 。自动推送会把不该扩散的内容送出去，飞书帮助页自己提醒敏感会议慎用（同上飞书链接）。这类工具只看得到被记录下来的东西 https://news.ycombinator.com/item?id=47901738 。本轮没有取得用户对摘要准确度的直接评价。

### 把变化做成工作对象，送到工作发生的地方

- **骨架**：单位：一个合并请求、一个 issue、一封定向邮件、一条发进工作群的消息。开始：机器按配置或按你的实际用量判断这件事和你有关。过程：对象出现在你本来就要处理的队列里（代码评审、邮箱、团队频道）。交付：对象自带上下文（改了什么、发布说明、截止日期、推荐替代）和一个明确的动作（合并、勾选、迁移）。后续：做了动作这件事就结了；不理它，机器会降频或暂停。
- **例子**：Dependabot、Renovate 及其 Dependency Dashboard、OpenAI 和 Anthropic 的弃用邮件（只发给在用该模型的账号）、Statuspage 的按组件订阅发到 Slack/Teams/webhook、ChatGPT 的事件触发任务（GitHub PR 活动、Slack 消息、Gmail）、Glean 发到 Slack 私信的 digest。
- **适合**：变化能直接对上读的人手里的东西（他的仓库、他在用的模型、他依赖的服务组件），而且有一个明确动作可做。相关性不靠猜，靠事实：Anthropic 只通知有活跃部署的客户并可导出按 key 和模型的用量 https://platform.claude.com/docs/en/about-claude/model-deprecations ；Renovate 的 Dashboard 让全部待办可见但要勾选才动 https://docs.renovatebot.com/key-concepts/dashboard/
- **在哪里坏**：量一大，工作队列本身被淹，团队开始走形式或直接关掉：讽刺文和评论 https://nesbitt.io/2026/01/10/16-best-practices-for-reducing-dependabot-noise.html 、https://news.ycombinator.com/item?id=46583914 ；同一更新在多个项目各来一遍 https://news.ycombinator.com/item?id=49109247 。两家工具都在加闸：Dependabot 默认冷却 3 天、长期没人理就暂停 https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/about-dependabot-version-updates ；Renovate 用分组、排程、自动合并 https://docs.renovatebot.com/noise-reduction/ 。弃用邮件只到账号，落不到具体哪条工作流 https://news.ycombinator.com/item?id=49262312

### 随查随看的参考看板

- **骨架**：单位：一张表或一张榜，行是模型或技术。开始：人想起来了去看，通常是在要做选型的时候。过程：筛选、排序、钉住几项对比。交付：数字和图，不给结论。后续：没有；数据常以开放格式提供，可被别的工具读。
- **例子**：models.dev、OpenRouter Rankings、Artificial Analysis、Hugging Face Trending、技术雷达的网站。
- **适合**：做一次具体选型的那一刻：比价格、上下文、能力、真实用量。数据开放的可以当底层来源：models.dev 的数据在 Git 仓库里并有 JSON 接口 https://github.com/anomalyco/models.dev ；OpenRouter 的排行数据以 CC BY 4.0 开放 https://openrouter.ai/rankings
- **在哪里坏**：不会来找你：四个页面上都没看到「我在用的模型有变化就提醒」。合成指数的可信度被质疑 https://news.ycombinator.com/item?id=49821855 、https://news.ycombinator.com/item?id=49810923 ；用户的结论是信息一直在变，只能自己试，或让一个周期性任务替自己去侦察 https://news.ycombinator.com/item?id=49550324

### 下单式的一次性研究报告

- **骨架**：单位：一份报告。开始：读的人提一个问题，定范围（内部资料、网页或两者）；系统可能先问澄清问题。过程：几分钟到几十分钟，后台跑。交付：分章节、带图表和引用的长文，引用可点回来源。后续：同一对话里追问；导出成文档；有的可调掉某份参考资料后重出。
- **例子**：Microsoft 365 Copilot 的 Researcher 和 Analyst、飞书知识问答的深入研究、Perplexity Computer。
- **适合**：要做一个具体决定、需要把内部材料和外部信息合在一起看的时候。飞书的做法把出处做得最细：脚注跳到信息源，能看每份参考资料的权限来源，还能逐份排除后重新生成 https://www.feishu.cn/hc/zh-CN/articles/854453754409-%E4%BD%BF%E7%94%A8%E7%9F%A5%E8%AF%86%E9%97%AE%E7%AD%94
- **在哪里坏**：配额紧而且看不见余量：Researcher 每人每月 25 次，用户查不到用了多少 https://learn.microsoft.com/en-us/microsoft-365/copilot/faq-researcher 、https://techcommunity.microsoft.com/discussions/microsoft-copilot/researcher-and-analyst-usage-limits/4420959 。按量计费时费用难预估（Perplexity，第三方）https://abmedia.io/perplexity-computer-guide-2026 。报告交完就完，不会自己变成一条决定或一条待办。

### 决策记录加评审线程

- **骨架**：单位：一份带编号和状态的决策文档。开始：有人写草稿并开一个评审（PR 或文档评论）。过程：评论在行内进行，状态从提议走到接受。交付：合并后的文档成为记录，和代码放在一起，有短链可引用。后续：被新决定取代时互相指向；订了仓库或被 @ 的人收到通知。
- **例子**：ADR（Nygard、MADR 模板）、Oxide 的 RFD 流程、Notion 的评论与建议编辑。
- **适合**：需要留下「当时为什么这么定」的技术决定。Oxide 的做法把读的人考虑进去了：订仓库即收到新提案，状态机清楚，有渲染站点和机器人查询 https://rfd.shared.oxide.computer/rfd/0001
- **在哪里坏**：没有人把外部变化带进来：这套流程只管决定怎么被记录和评审，不管是什么触发了决定。专用工具基本停更（adr-tools 最后推送 2024-04，log4brains 2024-12）https://github.com/npryce/adr-tools 、https://github.com/thomvaill/log4brains 。很多团队事后才发现没记，要回溯补写 https://news.ycombinator.com/item?id=46729934

### 把材料变成可以听的东西

- **骨架**：单位：一段音频，挂在一个资料集或一份摘要上。开始：用户点生成并选体裁和长度，或在摘要上点播放。过程：后台生成几分钟。交付：单人简报或双人对谈。后续：调速、下载、分享；个别可以中途用语音插话提问。
- **例子**：Gemini Notebook 的音频概览（深聊、两分钟简报、评审、辩论四种体裁）、Linear Pulse 在收件箱里的朗读、Particle 的朗读、Teams 的音频回顾、报道中 Gemini Daily Brief 在做的音频播放。
- **适合**：手和眼被占着的时间；想先粗听一遍再决定要不要细读。Gemini Notebook 的两分钟单人简报和评审体裁是为看材料做决定的人准备的 https://support.google.com/notebooklm/answer/16212820?hl=en
- **在哪里坏**：听的时候没法核对出处，官方自己提示可能不准并列出串人、多出声音等故障（同上链接）。互动只支持英语。本轮没有取得用户对长期使用的评价。

## 近一年的变化

- 2026-06-17 OpenAI 宣布下线 ChatGPT Pulse（2025-09-25 上线，始终只给 Pro），主动更新并入定时任务；同日定时任务改版：侧栏新增 Scheduled 页，可按时间窗排程，监测任务只在有值得报告的变化时通知。https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- 2026-07-09 OpenAI 推出 ChatGPT Work（做长任务的代理，可跟进度、答它的问题、改方向、批准动作，产出文档、表格、演示、Sites）；2026-08-25 定时任务加上事件触发（Gmail 新邮件、Slack 频道消息、GitHub PR 活动）和分享链接，免费用户也可建 3 个定时任务。https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- 方向相反的一家：Google 的 Gemini Daily Brief 在 2026 年推出，2026-09-09 起对美国免费个人账号开放；它的条目上能直接回邮件、排日程、建待办，每条可查来源。https://www.androidheadlines.com/2026/09/google-gemini-daily-brief-free-us-rollout.html 、https://gemini.google/overview/daily-brief/
- 2026-07-16 NotebookLM 改名 Gemini Notebook，仍是独立产品，旧链接自动跳转。音频概览现在有四种体裁（深聊、两分钟简报、评审、辩论）和语音插话的互动模式。https://workspaceupdates.googleblog.com/2026/07/notebooklm-now-gemini-notebook.html 、https://support.google.com/notebooklm/answer/16212820?hl=en
- Perplexity 2026 年把重心移到 Computer：2026-03-27 首页加定时任务总览并实时显示任务已花的 credit；2026-05-11 改进「完成」和「需要你输入」的通知；2026-07-13 Discover 被收进统一菜单，同日推出跨会话的 Brain 记忆；2026-08-24 可以发邮件给它来开一个任务。https://releasebot.io/updates/perplexity-ai
- Microsoft 365 Copilot：定时提示不再依赖 Power Automate，并在 2026-08 归入默认开启的 Connected Experiences；出现 Cowork（任务列表按 需要你输入、进行中、已完成、已排程 筛选，定时计划要先批准才生效）。https://learn.microsoft.com/en-us/microsoft-365/copilot/scheduled-prompts 、https://support.microsoft.com/en-us/microsoft-365-copilot/cowork-manage-tasks-schedule-prompts
- 2026-03-31 Salesforce 宣布 Slack 大改：Slackbot 变成代理（可接外部服务、可定义可复用技能、会议转写和行动项、根据桌面上下文给建议）。https://techcrunch.com/2026/03/31/salesforce-announces-an-ai-heavy-makeover-for-slack-with-30-new-features/
- Linear 在看的人这一侧连加三样：2026-06-18 代理协助写项目更新；2026-07-20 Loops（按计划或按事件触发的周期性代理工作，运行记录全员可查）；2026-09-03 Priority inbox（通知分优先和其他两栏）。https://linear.app/changelog
- 飞书知识问答加了定时任务：周期性问题可以定时推送最新回答（帮助页 2026-08-10 版）。https://www.feishu.cn/hc/zh-CN/articles/854453754409-%E4%BD%BF%E7%94%A8%E7%9F%A5%E8%AF%86%E9%97%AE%E7%AD%94
- Glean 的 Slack daily digest 改为可订主题，并聚合所有连接器的更新而不只是 Slack（文档 2026-09-30）。https://docs.glean.com/administration/platform/embedded-integrations/slackbot/admin-guide/enable-daily-digest
- Dependabot 现在默认对版本更新加 3 天冷却，并在维护者长期不理时自动暂停；这是通知方主动降量。文档页 2026-10-05 所见，哪天生效未查到。https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/about-dependabot-version-updates
- 资讯聚合从「一个站给所有人」转向「给你一套引擎，自己换信源和标准」：AIHOT 把引擎和全部提示词开源（2026-10-03 的 4.0.0 改为直接从线上代码导出）；follow-builders 把 digest 做成装进用户自己 agent 的 skill，2026-07-10 有 issue 指出 agent 已能自己定时，不必手动触发。https://github.com/KKKKhazix/AIHOT 、https://github.com/zarazhangrui/follow-builders/issues
- Feedly 的 AI 功能向企业情报产品收拢：带 AI 的自动 Newsletter 需要 Threat Intelligence 或 Market Intelligence 账号（文档 2026-03-26）；HN 用户的印象是个人用户这边没怎么更新。https://docs.feedly.com/article/753-guide-to-using-ai-in-automated-newsletters 、https://news.ycombinator.com/item?id=47037535

## 产品

### ChatGPT Pulse（已下线，2026-06-17 宣布）

- **来源**：<https://help.openai.com/en/articles/6825453-chatgpt-release-notes> <https://prowlo.com/blog/chatgpt-pulse-shut-down> <https://justinmckelvey.com/blog/chatgpt-pulse> <https://news.ycombinator.com/item?id=45375477> <https://news.ycombinator.com/item?id=48062680> <https://news.ycombinator.com/item?id=45429154>
- **时间**：官方 Release Notes 页显示「更新于 3 天前」，最新条目 2026-10-02；Pulse 相关条目：2025-09-25 上线、2025-10-29 上 web、2025-12-17 Tasks 并入、2026-03-26 移动端入口调整、2026-06-17 宣布下线。prowlo 2026-07-12；justinmckelvey 2026-10-05。
- **工作的单位**：每天一期的一组「视觉摘要卡片」。不是对话，卡片点开追问后才变成一次对话。
- **怎么开始**：用户不发起。系统夜里根据记忆、聊天历史和用户反馈做异步研究，第二天送达。用户只能用拇指上下和 curate（告诉它想看什么）间接影响；晚上提的新要求争取次日早上出现。
- **干活时**：过程完全不可见（隔夜异步），用户只看到结果。
- **提问和批准**：不提问、不请求批准。
- **交付**：一组可一眼扫完的卡片，点开有更多细节。官方 release notes 没写出处如何呈现（未亲见）。
- **后续**：每张卡可展开、追问、保存成对话；每天刷新，不保存的隔天就没了。
- **主动**：一天一次，早上。2025-12-17 起定时任务（Tasks）的查看、创建、编辑都放进 Pulse。2026-06-17 官方宣布下线：主动更新并入定时任务，Pro 用户再保留 14 天，官方建议改为让 ChatGPT 建一个基于兴趣和过往聊天的「每日简报」定时任务。
- **记忆**：选题靠记忆和聊天历史，用户只能通过反馈间接调，没有看到单独可编辑的「Pulse 记忆」。
- **文件和工作区**：无。
- **排列**：单一入口。2026-03-26 起在手机端和 Images、Codex、Apps 并排在聊天列表上方的横栏里。
- **手机**：先手机后桌面：2025-09-25 只在 iOS/Android，2025-10-29 才到 web 和 Atlas。
- **计费**：只给 ChatGPT Pro 订阅（官方 2025-12-17 条目写明仅 Pro）。从未到免费层。月费数字是第三方说法。
- **被夸的**：个别正面例子：HN 用户说它知道自己要去度假，给了当地闭馆和需要提前预订的活动 https://news.ycombinator.com/item?id=45429154
- **被骂的**：1) 内容只是把以前的对话平庸地重述一遍（HN 上线帖，SirensOfTitan）https://news.ycombinator.com/item?id=45375477 ；同帖多人反感「它先开口」和又一个通知来源。2) 2026-05 Ask HN：新订 Pro 的用户说每天早上收到随机的 AI 综述，问有没有人真得到过可行动的东西，零回复 https://news.ycombinator.com/item?id=48062680 。3) 第三方复盘归纳三条：揪着几周前已解决的话题不放；什么时候该主动判断不准；卡片只能读、不产出草稿或决定，成了又一个收件箱 https://prowlo.com/blog/chatgpt-pulse-shut-down （其中的准确率和搜索量数字未核实）。
- **没看到的**：产品界面本身（已下线）；Gmail/日历接入细节、每期卡片数、出处呈现方式、价格，均来自第三方转述或未见。

### ChatGPT 定时任务（Scheduled tasks）与 Work 模式

- **来源**：<https://help.openai.com/zh-hans-cn/articles/10291617-scheduled-tasks-in-chatgpt> <https://help.openai.com/en/articles/6825453-chatgpt-release-notes> <https://news.ycombinator.com/item?id=48939630>
- **时间**：帮助页显示「更新于 3 天前」（约 2026-10-02）；release notes 条目 2026-06-17、2026-07-09、2026-08-25。
- **工作的单位**：一个任务 = 一句指令 + 计划或事件触发器 + 它所在的那条对话。任务挂在创建它的对话上，删掉对话任务就暂停。
- **怎么开始**：在对话里说一句带时间或条件的话（帮助页例子：包裹送达后通知我），ChatGPT 回一张确认卡；或到侧栏「已安排」页新建。事件触发任务要在 Work 模式里描述事件和要做的事，再检查触发器、条件、提示词并完成授权。
- **干活时**：任务无人值守地跑。Work 模式（2026-07-09）里可以跟进度、回答它的问题、改方向、批准重要动作。
- **提问和批准**：发消息或改外部数据的动作可能需要批准，需要时任务暂停等用户审。任务还会因为不活跃或关联对话被删而自动暂停，要回「已安排」页恢复。
- **交付**：结果回到任务所在的对话。通知在 设置 > 通知 里选推送、邮件或两者。监测类任务只在有值得报告的变化时才通知。
- **后续**：在对话里点任务标题打开任务面板，可改、暂停、删。「已安排」页列出全部任务、下次运行时间和结果。任务可生成分享链接，对方得到独立副本，不带聊天记录、以往结果、记忆、连接器数据和凭据。
- **主动**：四种：一次性；周期（付费最高每小时一次并可指定准确时间，免费每天最多一次且只能选上午/下午/晚上这类时间窗）；监测（可用以往运行的信息，满足结束条件自己停）；事件触发（Gmail 新邮件、Slack 频道新消息、GitHub PR 活动，合计每小时最多 30 次、每天 720 次，多个事件可能合并处理）。连接财务账户时系统可能自动建一个「每周财务动态」任务。
- **记忆**：监测任务会用以往运行的信息。项目里建的任务读不到项目文件。分享出去的任务不带记忆。
- **文件和工作区**：任务没有自己的文件夹。Work 模式的产出是文档、表格、演示、报告和 Sites。
- **排列**：一张任务列表（侧栏「已安排」）。活动任务上限：Free/Go 3 个，Plus 5 个，Business/Edu 10 个，Pro/Enterprise 15 个。
- **手机**：手机 App 可建任务并收推送。桌面 App 只能显示已有的事件触发任务，不能建或改触发条件，页面建议用网页版。
- **计费**：含在订阅里，按活动任务数量和运行频率分档。用户看到的是数量上限，不是金额。
- **被夸的**：未找到针对 2026-06 之后新版的独立用户好评。同类形式被技术用户自己搭出来并认可：HN 用户用流水线每天抓行业源、让模型按和自己关注点的相关度打分、周五早上收一份周报 https://news.ycombinator.com/item?id=48939630
- **被骂的**：未找到新版的集中抱怨。帮助页自己列出的摩擦：任务会悄悄暂停（不活跃、等批准、对话被删）；用户会收到自己没建过的任务的更新（每周财务动态）。
- **没看到的**：实际界面与通知文案；监测任务判断「值得报告」的标准；真实用户评价。

### Gemini Daily Brief

- **来源**：<https://gemini.google/overview/daily-brief/> <https://www.androidheadlines.com/2026/09/google-gemini-daily-brief-free-us-rollout.html> <https://www.mindstudio.ai/blog/google-gemini-daily-brief-ai-morning-digest>
- **时间**：官方介绍页无日期（2026-10-05 打开）；androidheadlines 2026-09-09；mindstudio 2026-05-22（与官方页有出入，以官方页为准）。
- **工作的单位**：每天一份简报，一页，分三段：Top of mind（要紧的）、FYI（提醒和日程）、Looking ahead（长期目标）。
- **怎么开始**：用户不发起，每天早上自动生成。前提是打开 Personal Intelligence（Workspace 和 Memory 两项）。
- **干活时**：不可见。
- **提问和批准**：不提问。条目上的动作由用户自己点。
- **交付**：Gemini App 侧边导航里的一页。每条可点 More 看它来自哪封邮件、哪个日程。
- **后续**：在条目上直接回邮件、排日程、设提醒、建待办；可标完成、评有用或无用；给了反馈下一期就调整。
- **主动**：每天早上一次。
- **记忆**：数据源是 Gmail、Google 日历和 Gemini 聊天记录，可随时关掉某个来源。
- **文件和工作区**：无。
- **排列**：单一。
- **手机**：在 Gemini App 里。据报道在做免提的音频播放和安卓锁屏卡片，尚未上线。
- **计费**：2026-09-09 起对美国免费个人账号开放，此前要付费订阅。仅美国、英语、18 岁以上。
- **被夸的**：未找到独立用户评价。
- **被骂的**：未找到。
- **没看到的**：实际界面、推送形式、I/O 2026 发布细节（只见搜索摘要）、用户评价。

### Perplexity（Discover、Tasks、Computer 的 Scheduled Tasks）

- **来源**：<https://releasebot.io/updates/perplexity-ai> <https://abmedia.io/perplexity-computer-guide-2026> <https://www.testingcatalog.com/perplexity-adds-scheduled-tasks-feature-for-pro-and-enterprise-users/>
- **时间**：releasebot 汇总页 2026-09-21；abmedia 2026-09-12；testingcatalog 2025-06-13。官方帮助中心被安全验证页挡住，没有绕过。
- **工作的单位**：Computer 里是「任务」，每个任务跑在隔离的计算环境里（有真实文件系统和浏览器）。Scheduled Task 是周期性任务。Discover 是新闻流，2026-07-13 起和 Finance、Health、Patents、Academic 一起收进同一个菜单。
- **怎么开始**：描述想要的结果而不是步骤。也可以在 Slack 里 @ 它，或给它发、转发一封邮件来开一个会话（2026-08-24），它在原线程里回。
- **干活时**：可以放后台跟着看，中途加指令或改方向。运行时实时显示这个任务已经花掉多少 credit（2026-03-27）。
- **提问和批准**：敏感操作要批准，有审计和一键停止（第三方描述）。2026-05-11 起对「任务完成」和「需要你输入」两种时刻的通知做了改进。
- **交付**：报告、表格、演示、仪表盘或网站。
- **后续**：对话很长时让用户二选一：延长完整上下文（更细），或让它总结后继续（更省）（2026-03-27）。
- **主动**：Scheduled Tasks 用于监测、报告、提醒。首页有一个视图列出全部定时任务，每个可单独暂停或取消（2026-03-27）。早期版本的 Tasks 在设置里创建和管理，可定时跑普通搜索或研究模式（2025-06）。
- **记忆**：Brain（2026-07-13）：跨会话、连接器、文件和过去的决定建私有上下文图；2026-07-27 起会为你在意的人、项目、偏好写 wiki 页。用户能否直接改，未见。
- **文件和工作区**：每个任务有隔离文件系统。Spaces 里可用 Computer（2026-04-17），并可用 Space skills 打包分享能力（2026-05-04）。
- **排列**：任务列表加一个定时任务视图。
- **手机**：第三方说 iPhone 可向常开的 Mac mini 远程派任务。
- **计费**：按 credit（点数），干活时费用实时可见。第三方数字：100 点约 1 美元，单个任务从约 100 点到近万点；Pro 送 4000 点，Max 每月 10000 点。组织管理员可给单个成员设 credit 上限（2026-06-19）。
- **被夸的**：未取得独立用户好评。
- **被骂的**：第三方指南列出的顾虑：点数消耗难以预估；直接进账户和文件带来的权限风险 https://abmedia.io/perplexity-computer-guide-2026
- **没看到的**：官方帮助页全文；Discover 的推送、条数和个性化方式；定时任务结果的交付形式（邮件还是推送）；真实用户评价。

### Gemini Notebook（原 NotebookLM）的音频概览

- **来源**：<https://support.google.com/notebooklm/answer/16212820?hl=en> <https://workspaceupdates.googleblog.com/2026/07/notebooklm-now-gemini-notebook.html> <https://aionx.co/ai-comparisons/notebooklm-review/> <https://news.ycombinator.com/item?id=44806191>
- **时间**：帮助页无日期，2026-10-05 打开时标题已是 Gemini Notebook；改名公告 2026-07-16。
- **工作的单位**：一个笔记本（用户放进去的一组资料）。音频概览是笔记本 Studio 面板里的一件生成物。
- **怎么开始**：在 Studio 面板点 Audio Overview。可选形式：Deep Dive（两位主持人深聊，默认）、The Brief（单人，两分钟内讲要点）、The Critique（对文章或设计文档提建设性意见）、The Debate（正反辩论）；选语言（80 多种）、长度（短/默认/长，仅英语）；写一段提示指定重点或听众水平。
- **干活时**：后台生成，要几分钟，期间可以生成别的东西或离开页面。
- **提问和批准**：无。
- **交付**：一段音频，可调播放速度。页面明示内容由 AI 生成、可能不准，并说明概览应是对资料的客观反映而不是主持人的观点。边听可以在笔记本里查引文、问资料。
- **后续**：互动模式（仅英语、仅新生成的）：点 Join，主持人点到你时用语音提问，他们按资料回答后接着讲原节目。可查看生成时用的自定义提示。拇指反馈。
- **主动**：没有定时和推送，完全是用户点了才有。
- **记忆**：没有跨笔记本的记忆，资料就是上下文。
- **文件和工作区**：资料在笔记本里。音频可下载，可分享链接（对方要有整个笔记本的访问权；企业和教育账号不能公开分享）。
- **排列**：笔记本列表。
- **手机**：有手机 App，官方提示这项功能在手机上有限制。
- **计费**：按每天可生成的份数分档。第三方说免费层每天 3 份，付费 Google AI 方案更多。
- **被夸的**：HN 用户说弄懂 LLM 论文时，用语音来回问比文字聊天更适合自己 https://news.ycombinator.com/item?id=44806191 （说的是语音问答，不专指音频概览）。
- **被骂的**：官方页自己列的：音频故障、说话人串位、冒出第三个声音、互动时有延迟。本轮没有取得独立用户长评。
- **没看到的**：留存情况、手机后台播放细节、官方配额数字、2026 年用户评价。

### Feedly（AI Feeds、带 AI 的自动 Newsletter）

- **来源**：<https://docs.feedly.com/article/753-guide-to-using-ai-in-automated-newsletters> <https://feedly.com/ai> <https://news.ycombinator.com/item?id=47037535> <https://news.ycombinator.com/item?id=47372397>
- **时间**：文档页 2026-03-26；feedly.com/ai 无日期。
- **工作的单位**：订阅源和文件夹、Board（团队剪报夹）、AI Feed（用预训练的主题模型定义的一条信息流）。
- **怎么开始**：选要跟的主题、公司、趋势。预训练模型覆盖威胁情报、市场情报、生物医药研究、风险情报。
- **干活时**：持续抓取，没有「一次运行」的概念。
- **提问和批准**：Newsletter 发出前可在编辑器里改任何 AI 生成的内容，等于人工过一遍再发。
- **交付**：文章流。自动 Newsletter：选文件夹、Board 或 AI Feed 当来源；两种 AI 处理，AI Overview 一次看多篇找模式和趋势，AI Summary 逐篇提取；可自定义提示词（角色、背景、任务、格式）。处理发生在保存模板或预览时，不是在发送时。
- **后续**：Ask AI 等功能本轮只见搜索摘要，未打开页面。
- **主动**：定期邮件 newsletter，团队里有人编、其他人收。
- **记忆**：无。
- **文件和工作区**：Boards。
- **排列**：无。
- **手机**：未见。
- **计费**：带 AI 的 newsletter 需要 Threat Intelligence 或 Market Intelligence 账号。HN 用户称其方案 1600 美元/月起（用户说法，未核实）。
- **被夸的**：未取得。
- **被骂的**：HN：Feedly 近年没怎么被打磨，明显转向企业市场，API 藏在企业档后面，于是放弃 https://news.ycombinator.com/item?id=47037535 。另一位迁出 Feedly 的用户说现在很多站点的反爬保护让 RSS 阅读器读不到内容 https://news.ycombinator.com/item?id=47372397
- **没看到的**：个人版 AI 功能现状、手机端、Slack/Teams 分享、定价页。

### Readwise Reader

- **来源**：<https://docs.readwise.io/reader/docs/faqs> <https://docs.readwise.io/reader/docs/faqs/ghostreader> <https://docs.readwise.io/reader/docs/faqs/feed> <https://docs.readwise.io/reader/docs/faqs/email-newsletters>
- **时间**：文档页无日期，2026-10-05 打开。
- **工作的单位**：一篇文档。两个大区：Library（你决定要读的）和 Feed（订阅推来的）。
- **怎么开始**：存入：浏览器扩展，或把邮件发到你的 library 专用地址。订阅：RSS、OPML、把 newsletter 订到或自动转发到 feed 专用地址。
- **干活时**：不适用。
- **提问和批准**：无。
- **交付**：文档本身加 Ghostreader 摘要。存进 Library 的自动出摘要；Feed 里的默认要手动触发，填了自己的 OpenAI key 才自动。全库 Ghostreader 可对整个库提问，回答带链接到原文的引用。
- **后续**：高亮、笔记；自定义提示词（网页端改，手机端可用）；手机上选词可快速查定义或翻译。
- **主动**：RSS 大约每 5 分钟检查一次。Daily Digest 邮件的文档本轮没打开到。
- **记忆**：高亮和笔记就是留下来的东西。
- **文件和工作区**：自己的库，离线可读。
- **排列**：用 Filtered Views（按条件的动态子集）把订阅分组。
- **手机**：iOS 和 Android。Feed 是卡片式，划过即标已看，可设置手势把上面的全部标已看。
- **计费**：订阅制：年付每月 9.99 美元，月付 12.99 美元。默认模型含在订阅里，用更强的模型或给 Feed 自动摘要要自带 key。
- **被夸的**：本轮未取得独立评价。
- **被骂的**：本轮未取得独立评价。
- **没看到的**：Daily Digest 内容和时间、朗读、导出到笔记软件、用户评价。

### Particle（新闻应用）

- **来源**：<https://particle.news/> <https://particle.news/blog/particle-upgrades-dynamic-news-app-with-more-customizable-features> <https://wisp.news/blog/particle-review/>
- **时间**：官网首页 2026-10-05 打开；官方博客 2025-12-16；wisp 评测 2026-08-04（竞品，有利益冲突）。
- **工作的单位**：一个「故事」：多家报道聚成一条，条目上标有多少篇文章。另有话题页和实体页。
- **怎么开始**：打开 App 看流；关注话题或实体。
- **干活时**：不适用。
- **提问和批准**：无。
- **交付**：标题加摘要。可换摘要风格（付费版可用自然语言自定风格）。评测提到左右立场对照、自动抽取播客里相关的几十秒片段。可把个性化新闻流读出来。
- **后续**：每条故事可问答。公开问答免费，只有自己看得见的提问要付费版。
- **主动**：通知行为本轮未见。有 newsletter 入口。
- **记忆**：关注的话题和实体。
- **文件和工作区**：无。
- **排列**：无。
- **手机**：iOS、Android，也有网页。
- **计费**：Particle+ 每月 2.99 美元或每年 29.99 美元。
- **被夸的**：竞品评测也承认：多来源聚成一条并标来源，比单家标题强 https://wisp.news/blog/particle-review/
- **被骂的**：同一评测：功能堆得太多，用起来像在管一块仪表盘；偶有摘要和来源质量问题 https://wisp.news/blog/particle-review/
- **没看到的**：推送、引用的具体呈现、应用商店评论。

### AIHOT（aihot.news，及其开源引擎）

- **来源**：<https://aihot.news/> <https://aihot.news/daily> <https://github.com/KKKKhazix/AIHOT>
- **时间**：站点 2026-10-05 打开，日报为 2026-10-04 第 166 期；仓库 5842 星，2026-10-04 仍在推送。
- **工作的单位**：一个「事件」（多个来源说的同一件事聚成一条）和每天一期日报。
- **怎么开始**：读者不发起，打开就看。后台流程（README）：采集、判重、预筛、独立打两次分、写中文标题和摘要、聚成事件、算热度；过门槛且不重复才进精选。
- **干活时**：不适用。
- **提问和批准**：无。
- **交付**：首页按日期排的时间轴，每条有发布时间、来源、评分、标题、一句推荐理由、还有几家信源在报。日报每天 08:00 出刊，当期 4 件大事、3 个来源、标注约 2 分钟读完；分头条、今日看点、行业动态、论文研究、快讯；每条带原文链接，并标是否一手来源。另有周报、月报、合订本。
- **后续**：不能追问。可收藏、按主题和品类（一手、模型、产品、行业、论文、教程、观点）筛。
- **主动**：页面上没看到 RSS、邮件或推送入口，是要自己去看的地方。
- **记忆**：收藏。
- **文件和工作区**：无。
- **排列**：无。
- **手机**：仓库 issue 提到手机端重写，本轮未见实际页面。
- **计费**：免费。引擎以 MIT 开源，所有提示词原文和入选门槛都在仓库里。
- **被夸的**：作者在 README 里写开源的原因：做法律、人力、金融、贵金属的朋友都来问能不能给自己行业做一个，而选哪些信源、什么才算热点只有行内人懂 https://github.com/KKKKhazix/AIHOT 。星数和 issue 活跃度说明有人在照着搭自己的站。
- **被骂的**：仓库里有优化内容布局的建议（issue 67）。本轮没有取得读者侧的评价。
- **没看到的**：订阅入口是否存在（只看了摘要后的页面）；读者留存；模型榜等只留在主站的功能。

### follow-builders（装在自己 agent 里的资讯 skill）

- **来源**：<https://github.com/zarazhangrui/follow-builders> <https://post.smzdm.com/p/aqr5nw9x/>
- **时间**：仓库 6835 星，2026-10-05 有更新；什么值得买转载文标注原微博 2026-03-25。
- **工作的单位**：用户自己 agent（Claude Code、OpenClaw 等）里的一个 skill；产出是一期 digest。
- **怎么开始**：说一句 set up follow builders 或输入斜杠命令，agent 用对话问三件事：多久一期和几点、什么语言、发到哪（Telegram、邮件或就在对话里）。装完立刻出第一期。
- **干活时**：和 agent 平时干活一样。
- **提问和批准**：只有安装时的几个问题。
- **交付**：发到用户选的消息应用的一条长消息：播客新一期的摘要、26 位建造者在 X 上的要点、官方博客全文，全部带原文链接；可中文、英文或双语。
- **后续**：用对话改：换成每周一早上、改语言、摘要短一点、更关注可操作的。agent 去改 prompts 目录下的明文提示词文件，下一期生效。
- **主动**：每天或每周定时。中心 feed 每天更新，用户的 agent 一次请求拉下来，再按自己的偏好重写。
- **记忆**：配置、偏好、阅读历史都留在本机。
- **文件和工作区**：本机配置目录。
- **排列**：无。
- **手机**：靠 Telegram 等消息应用到手机。
- **计费**：免费、MIT。内容由作者中心化抓取，不需要用户的 API key；摘要消耗用户自己 agent 的额度。
- **被夸的**：转载的用户推荐语：帮人从海量内容里筛出最值得看的，省掉自己刷信息流的时间 https://post.smzdm.com/p/aqr5nw9x/ （推荐口吻）。
- **被骂的**：都在 issue 里：中心 feed 多次停更或抓不到（#5、#12、#14；#42 X 的 API 额度用完；#49、#50 X 抓取报 500）；博客文章 7 天后会被当成新的再出现一次（#95）；源表由作者统一定，用户想加自己的源、加投资向的建造者、换成别的行业（#29、#52、#55）。https://github.com/zarazhangrui/follow-builders/issues
- **没看到的**：真实的日活和留存；digest 样例只看了 README 的描述。

### TLDR（及同类技术通讯）

- **来源**：<https://tldr.tech/> <https://news.ycombinator.com/item?id=48414812> <https://news.ycombinator.com/item?id=48939630>
- **时间**：首页 2026-10-05 打开。
- **工作的单位**：一期邮件。
- **怎么开始**：填邮箱订阅。
- **干活时**：不适用。
- **提问和批准**：无。
- **交付**：每天一封。每条是标题、来源、预计阅读分钟数和一两句摘要；顶部有赞助位。网页有往期存档。
- **后续**：点链接去原文，没有别的动作。
- **主动**：每天一封邮件，主打 5 分钟读完。
- **记忆**：无。
- **文件和工作区**：无。
- **排列**：有多个垂直刊（首页只见入口，数量未核）。
- **手机**：邮件。
- **计费**：免费，靠广告。
- **被夸的**：自称 800 万以上读者（厂商数字）。
- **被骂的**：不专指 TLDR 的同类抱怨：HN 上一位后端开发者说多数 changelog 和资讯源给的原始信息太多，筛到累了就全部退订，现在只想留少数有观点的策展人 https://news.ycombinator.com/item?id=48414812 。另一帖多人回答「不追了」，只留少数一手来源，每周补一次。https://news.ycombinator.com/item?id=48939630
- **没看到的**：各垂直刊名单、打开率、退订率。

### 即刻

- **来源**：<https://www.cooyue.com/article/share-20260911-5.html>
- **时间**：文章 2026-09-11。本轮只打开到这一篇推荐性质的文章，没有打开即刻官方页面。
- **工作的单位**：圈子（例如「AI探索站」）里的一条条动态，加个人关注流。
- **怎么开始**：关注圈子和人，刷流。
- **干活时**：不适用。
- **提问和批准**：无。
- **交付**：从业者发的灰度截图、试用小记、方法拆解，讨论在评论区。
- **后续**：评论、私下找人合作。
- **主动**：未见。
- **记忆**：未见。
- **文件和工作区**：无。
- **排列**：无。
- **手机**：手机 App 为主（未亲见）。
- **计费**：未见。
- **被夸的**：文章的说法：新功能当天就有人讨论和对比，刷半小时的信息量顶别人刷一天微信群 https://www.cooyue.com/article/share-20260911-5.html
- **被骂的**：同一篇文章自己承认：不适合当纯资讯源，给的是一手碎片，判断还得自己做。
- **没看到的**：推送机制、推荐算法、留存、收费、任何独立用户评价，全部未亲见。

### Microsoft 365 Copilot（会前准备、会议回顾、Researcher/Analyst、定时提示、Cowork）

- **来源**：<https://support.microsoft.com/en-us/outlook/prepare-for-your-meeting-with-copilot> <https://support.microsoft.com/en-us/teams/copilot/catch-up-on-meetings-with-microsoft-365-copilot-in-teams> <https://learn.microsoft.com/en-us/microsoft-365/copilot/researcher-agent> <https://learn.microsoft.com/en-us/microsoft-365/copilot/faq-researcher> <https://support.microsoft.com/en-us/microsoft-365-copilot/schedule-your-most-used-copilot-prompts> <https://learn.microsoft.com/en-us/microsoft-365/copilot/scheduled-prompts> <https://support.microsoft.com/en-us/microsoft-365-copilot/cowork-manage-tasks-schedule-prompts> <https://techcommunity.microsoft.com/discussions/microsoft-copilot/researcher-and-analyst-usage-limits/4420959> <https://www.explainx.ai/blog/microsoft-copilot-in-teams-meeting-recap-guide-2026>
- **时间**：Learn 文档 updated 2026-08-18（Researcher 及 FAQ）、2026-09-01（scheduled prompts）；support 页无日期；explainx 2026-08-21；社区帖 2025-06 至 2025-10。
- **工作的单位**：好几种并存：一次 Copilot 对话；一场会议（回顾挂在会议上）；一份 Researcher 报告；一条定时提示；Cowork 里的一个 task（一段让它干活的对话）。
- **怎么开始**：会前准备：在 Outlook 日历里打开会议，点「Prepare for this meeting」，是用户去点，不是推送。会后：从会议聊天或 Recap 标签打开 Copilot。Researcher：在 Agents 下选它提问，可限定只用工作资料、只用网页或两者，它可能先问澄清问题。定时：把鼠标悬到已发过的提示上点 Schedule this prompt。Cowork：用白话说，例如每天早上 9 点给我一份简报。
- **干活时**：Researcher 简单问题 5 分钟内，复杂的 10 到 45 分钟。Cowork 有 My tasks 视图，可按 需要你输入、进行中、已完成、已排程 筛。
- **提问和批准**：Researcher 会问澄清问题。Cowork 在激活一个计划前先确认并请你批准，动作执行前可以接管。
- **交付**：会前：会议事件表单顶部的一段摘要（相关上下文、任务、文档）加几条建议提问；只对一对一或有相关内容的会议出，没有共享材料的会议只给泛泛的回答。会后：讨论要点、谁说了什么、建议的行动项，回答注明用了哪些来源；回顾贴在会议聊天和日历事件上，组织者可分享到 Outlook；另有 Recap 应用把摘要、录制、转写、音频和视频回顾收在一处（第三方描述）。Researcher：分章节、带图表和引用来源的报告。
- **后续**：在会议的 Copilot 里接着问；Researcher 在同一对话追问。Researcher 报告导出 PowerPoint 和 PDF、控制报告长度，FAQ 都写的是即将推出。
- **主动**：定时提示最多 10 条，可设什么时候跑、跑几次、完成后要不要发邮件。结果出现在左侧 Chats 列表里（加粗、带图标）。管理入口在设置菜单的 Scheduled prompts：立即运行、改计划、关闭、删除。Cowork 的定时在 My tasks 的 Scheduled 标签里改、暂停、取消。
- **记忆**：Researcher 的记忆在 FAQ 里写的是即将推出。
- **文件和工作区**：报告留在对话里；工作资料来自 Microsoft Graph 和连接器。
- **排列**：Researcher 和 Analyst 固定在 Agents 下，用户不能自己移除或取消固定。
- **手机**：Researcher 在 iOS 和 Android 的 Copilot App 可用。会前准备在 Outlook Mobile 可用，各端体验不同。
- **计费**：需要 Copilot 许可。Researcher 每人每月 25 次（社区帖确认按自然月、与 Analyst 合计）。用户看不到剩余次数。
- **被夸的**：本轮未取得独立用户好评。
- **被骂的**：社区帖：用户问怎么知道自己用了多少次，回答是没有报表，只能翻对话历史数；有人担心第 26 次怎么办 https://techcommunity.microsoft.com/discussions/microsoft-copilot/researcher-and-analyst-usage-limits/4420959 。第三方指南列的硬限制：没开转写就没有回顾和行动项；会中让它帮你补课只覆盖 Copilot 打开之后的内容；摘要质量随音质走 https://www.explainx.ai/blog/microsoft-copilot-in-teams-meeting-recap-guide-2026 。FAQ 自己承认：Researcher 不能读图、管理员没有用量报表。
- **没看到的**：所有实际界面；Analyst 的细节；Cowork 入门页（404）；Recap 应用的官方文档；会前准备的出处呈现。

### Slack（Recap、对话摘要、搜索回答、Slackbot）

- **来源**：<https://slack.com/help/articles/25076892548883-Guide-to-AI-features-in-Slack> <https://techcrunch.com/2026/03/31/salesforce-announces-an-ai-heavy-makeover-for-slack-with-30-new-features/>
- **时间**：帮助页无日期，2026-10-05 打开；TechCrunch 2026-03-31。
- **工作的单位**：频道和线程。Recap 是每天一份、按频道分段的摘要页。
- **怎么开始**：第一次设置时 Slack 推荐几个你常看但很少发言的频道，你确认后开启，并可把这些频道静音。频道和线程摘要是手动点，可选未读、最近 7 天或自定义时间段（桌面）。
- **干活时**：时间段长的摘要要等，生成好会通知。
- **提问和批准**：无。
- **交付**：侧栏的 Recap 入口。每天早上一份，讲前一天错过的；离开多天就覆盖离开的那几天；一天内再打开可以刷新。点 More details 看摘要用了哪些消息。搜索回答带引用，悬停预览，点击跳到原消息或文件，可分享到频道或私信。上传的文档自动出摘要。
- **后续**：每个频道旁可以把它从今后的 recap 里移除；随时增减频道。
- **主动**：每天早上一份。帮助页对它的定位是：给你想留意但不想在工作时被打断的频道。
- **记忆**：无。
- **文件和工作区**：无自己的文件夹。
- **排列**：无。
- **手机**：手机在 Home 标签点 Recap，点消息看来源。
- **计费**：按席位的套餐功能。Recap、搜索回答、文件摘要在 Business+ 和 Enterprise+；对话摘要和 huddle 纪要从 Pro 起。
- **被夸的**：本轮未取得独立用户评价。
- **被骂的**：本轮未取得独立用户评价。
- **没看到的**：Recap 实际页面的长度和结构；2026-03-31 宣布的 Slackbot 新能力的实际上线情况；用户评价。

### 飞书 知识问答

- **来源**：<https://www.feishu.cn/hc/zh-CN/articles/854453754409-%E4%BD%BF%E7%94%A8%E7%9F%A5%E8%AF%86%E9%97%AE%E7%AD%94>
- **时间**：帮助页，搜索结果显示 2026-08-10；要求飞书 V7.41 及以上；标注内测中、成熟度 M3。
- **工作的单位**：一次对话，有历史对话列表。周期性的问题可以变成一条定时任务。
- **怎么开始**：桌面端左侧导航或消息置顶处点「知识问答」，或用网页 ask.feishu.cn；在搜索、云文档里看到的推荐问题和自动回答也能跳进来。输入问题，可加图片，可选「深入研究」或「帮我写作」；选是否联网、用哪个模型（自动、豆包、豆包深度思考）、这一次的知识范围；可连外部邮箱当知识源、上传文件。
- **干活时**：帮助页没有描述过程。
- **提问和批准**：无。
- **交付**：一段回答。正文用数字脚注标出处，点一下跳到信息源；底部列参考资料，并能看到每份资料你是凭什么权限看到的。
- **后续**：分享（复制或下载图片、复制链接、发到会话）；导出到文档；重新生成时可改检索范围，或用「调整参考资料」逐份勾掉某些资料后重出。
- **主动**：问题是周期性的（帮助页例子：我今天有什么待办事项），可以为它建定时任务，到点推送最新回答；可改启用状态和触发时间。
- **记忆**：知识范围就是你在飞书上有权限访问的消息、文档、知识库。「知识库」页管理自己上传的文件。没有看到单独的记忆页。
- **文件和工作区**：自己上传的文件在「知识库」里；回答可导出成飞书文档。
- **排列**：单一助手，历史对话列表。
- **手机**：帮助页只写了桌面端和网页入口。
- **计费**：按 AI 额度扣点：基于企业知识的有效回答 20 点一次，只联网或只调模型 3 点一次；超过每人每月免费用量后要另买。
- **被夸的**：本轮未取得独立用户评价。
- **被骂的**：本轮未取得（知乎页面 403）。帮助页自己说明：效果取决于你有权限看到的资料范围；试用版只能问自己上传的文件。
- **没看到的**：手机端；定时任务推送到哪里（消息还是别处）；深入研究的过程和交付；真实用户评价。

### 飞书 智能纪要（妙记）

- **来源**：<https://www.feishu.cn/hc/zh-CN/articles/244959839578-%E5%9C%A8%E8%A7%86%E9%A2%91%E4%BC%9A%E8%AE%AE%E4%B8%AD%E4%BD%BF%E7%94%A8%E6%99%BA%E8%83%BD%E7%BA%AA%E8%A6%81>
- **时间**：帮助页无日期，2026-10-05 打开；标注成熟度 M4。
- **工作的单位**：一场会议对应一份智能纪要文档（开了 AI 总结），或妙记里的纪要（开了录制）。
- **怎么开始**：会议工具栏打开「AI 总结」开关，或开始录制。「我是组织者时自动开启 AI 总结」默认勾选，所以多数会不用人去点。
- **干活时**：中途可关可再开，关闭期间的内容不记录。可设成仅主持人能开关，其他人要向主持人申请。
- **提问和批准**：无。
- **交付**：会后一份文档：会议信息、AI 写的总结、待办事项、逐字稿。妙记里另有章节纪要。送到哪里有明确规则：有会议群就发到会议群；没有群由「智能纪要助手」机器人发给参会人；一对一通话发到两人的聊天框。
- **后续**：默认所有参会人可读可改这份文档，组织者可收紧权限。妙记里有编辑权限的人可改总结和章节。
- **主动**：会后自动推送。每个人可以关掉「会议结束后向我推送智能纪要」，但自己是组织者时仍会收到。
- **记忆**：无。
- **文件和工作区**：纪要是普通飞书文档；妙记在 视频会议 > 妙记 里集中。
- **排列**：无。
- **手机**：帮助页未写。
- **计费**：有免费额度，超出后买用量。
- **被夸的**：本轮未取得独立用户评价。
- **被骂的**：本轮未取得。帮助页自己提醒：涉及公司敏感信息、员工答辩的会议慎用，自动推送可能让会议信息过度外溢。
- **没看到的**：待办是否能一键变成飞书任务；手机端；真实用户评价。

### 钉钉 AI 听记

- **来源**：<https://help.dingtalk.io/zh/ai-minutes/use-ai-minutes> <https://www.sohu.com/a/1022418871_122574406>
- **时间**：帮助页无日期，2026-10-05 打开；搜狐文章 2026-05-14（判断为厂商软文）。
- **工作的单位**：一个听记文件，对应一场会或一段录音。
- **怎么开始**：帮助页这一篇没写入口。软文称支持线上会议、本地视频、直播培训、线下实时录制，以及配套录音硬件。
- **干活时**：本页未写实时转写的界面。
- **提问和批准**：无。
- **交付**：一个文件里几个视图：智能纪要（按内容自动匹配模板，共 36 种模板，不满意可换模板重生成）；章节（点章节，音视频和原文一起跳过去）；转写原文（自动去掉重复词和口头禅）；发言人片段（每人发言的时段和时长分布，点了跳转）；19 种语言翻译，可双语对照；关键词搜索高亮。
- **后续**：有编辑权限的人可改文字。导出成钉钉文档、PDF、docx、srt。
- **主动**：本页未写会后推送。
- **记忆**：可录入声纹，之后自动认出发言人并显示通讯录头像。
- **文件和工作区**：分享范围四档：指定成员或群、组织内公开、拿到链接的人、直接发到聊天。
- **排列**：无。
- **手机**：本页未写。
- **计费**：本页未写。
- **被夸的**：只找到厂商口吻的文章，不作为用户评价。
- **被骂的**：未取得。
- **没看到的**：入口、实时转写界面、会后推送、对纪要追问、手机端、收费、真实用户评价。

### Glean（Daily digest、助手、agents）

- **来源**：<https://docs.glean.com/administration/platform/embedded-integrations/slackbot/admin-guide/enable-daily-digest> <https://www.glean.com/ai-assistant/proactive-ai> <https://theplanettools.ai/tools/glean> <https://news.ycombinator.com/item?id=47901738>
- **时间**：daily digest 文档 2026-09-30；proactive-ai 营销页无日期；theplanettools 2026-08-04。
- **工作的单位**：一次搜索或助手对话。Daily digest 是每天一条 Slack 私信。
- **怎么开始**：用户订阅频道、关键词或主题（最多 10 个主题、100 个 Slack 频道），并选送达时间。
- **干活时**：不适用。
- **提问和批准**：营销页只有「替你把事情往前推」这类说法，没有可核对的机制。
- **交付**：Slack 私信里的一份个性化摘要。内容来自所选频道和主题，并且聚合所有接进 Glean 的企业连接器（文档、邮件、工单、会议），不只是 Slack。管理员可改成发一份排好版的 Slack Canvas。
- **后续**：用户侧怎么对条目采取动作，管理员文档没写。
- **主动**：每天一次，时间用户自己定。
- **记忆**：未见。
- **文件和工作区**：不存文件，索引别处的资料，按原系统权限检索。
- **排列**：未见。
- **手机**：未见。
- **计费**：按席位、报价制。第三方数字：每人每月约 45 到 50 美元，AI 附加约 15 美元，起步约 100 席。
- **被夸的**：本轮未取得真实用户好评（G2 与 Cybernews 页面 403）。
- **被骂的**：第三方评测：只卖企业、续约涨价不好预估、还要配专人维护 https://theplanettools.ai/tools/glean 。HN 上一位做同类产品的人指出：这类工具只能搜到已经写下来的东西，而工作里真正有用的多数没被写下 https://news.ycombinator.com/item?id=47901738 （竞品作者，有立场）。
- **没看到的**：助手界面和出处呈现；会前准备和每日简报类 agent 模板的实际行为；用户侧订阅管理；真实用户评价。

### Linear Pulse（及 Priority inbox、Loops）

- **来源**：<https://linear.app/docs/pulse> <https://linear.app/changelog> <https://linear.app/changelog/2026-07-20-introducing-loops> <https://linear.app/changelog/2026-09-03-priority-inbox>
- **时间**：Pulse 文档无日期，2026-10-05 打开；changelog 条目 2026-06-18、2026-07-20、2026-09-03、2026-09-14。
- **工作的单位**：人写的项目更新和 initiative 更新。Pulse 是这些更新的流；摘要是收件箱里的一条通知。
- **怎么开始**：读的人不用发起。管理员在 Settings > Pulse 打开并设默认节奏（每周一、每个工作日、从不），个人设置会覆盖默认。
- **干活时**：不适用。
- **提问和批准**：无。
- **交付**：侧栏 Pulse 页有三个标签：For me（你参与或订阅的项目）、Popular（有表情和评论的）、Recent（按时间）。可读更新原文。每日或每周摘要大约在当地早上 6 点进 Inbox；Inbox 里的摘要可以点 Play 听朗读（音频只在 Inbox，不在 Pulse 页）。
- **后续**：在更新下加表情、评论。
- **主动**：每日或每周一条进 Inbox。侧栏的 Pulse 入口可设成总是显示、有角标才显示、从不显示。只订和我有关的：你是项目成员；项目归到你负责的 initiative；你显式订阅了；你订了某 initiative 的全部子项目；你订了某团队的全部项目更新。还可按自定义筛选建个人 feed，只有自己看得见，不能分享。
- **记忆**：无。
- **文件和工作区**：无。
- **排列**：2026-07-20 的 Loops：用白话描述一件周期性的工作，选按计划或按工作区事件触发；团队和工作区级别共享，任何有权限的人都能看它的指令、配置和每次运行发生了什么。
- **手机**：Pulse 的手机端未见。
- **计费**：Pulse 所有套餐可用（访客角色除外）。Loops 在 Business 和 Enterprise，用 AI credits。
- **被夸的**：本轮未取得独立用户评价。
- **被骂的**：本轮未取得独立用户评价。
- **没看到的**：摘要的长度和样子；邮件或 Slack 送达；Priority inbox 怎么判定「优先」；Loops 的结果落在哪里；用户评价。

### Thoughtworks 技术雷达与自建雷达工具

- **来源**：<https://www.thoughtworks.com/radar/faq> <https://github.com/thoughtworks/build-your-own-radar> <https://news.ycombinator.com/item?id=48920193> <https://news.ycombinator.com/item?id=45358791> <https://news.ycombinator.com/item?id=45838036> <https://news.ycombinator.com/item?id=47403904>
- **时间**：FAQ 页 2026-10-05 打开，当前为第 34 期（2026）；build-your-own-radar 仓库 2574 星，最近推送 2026-04-22。
- **工作的单位**：一期雷达（一年两期）。里面的单位是一个 blip：一项技术，落在四个象限之一（技术、平台、工具、语言与框架）和四个环之一（Adopt、Trial、Assess、Caution）。
- **怎么开始**：读的人打开网站。可订邮件，隔月一封。
- **干活时**：不适用。编的过程：全球员工从客户项目里提名，约 20 位资深技术人组成的委员会讨论，位置不够时投票。
- **提问和批准**：无。
- **交付**：一张图加每个 blip 的一段理由。blip 只在一期出现，除非换了环；没动的从当期淡出但留档。FAQ 建议的读法是先看 Adopt，再 Trial，再 Assess，把它当成排自己调研优先级的参考。
- **后续**：不能追问。自建工具：一张公开的 Google 表格，列是 name、ring、quadrant、isNew、description，可加 status 列（New、Moved In、Moved Out 等）来显示移动。
- **主动**：半年一期，邮件隔月。
- **记忆**：历史各期存档，能看到一项技术的环怎么变。
- **文件和工作区**：自建雷达的数据就是一张表。Zalando 的 tech-radar 仓库 1940 星，2026-09 仍在更新。
- **排列**：无。
- **手机**：网页。
- **计费**：免费。
- **被夸的**：HN：离前沿比较远的人靠它和技术世界保持大致同步 https://news.ycombinator.com/item?id=48920193 ；虽然是营销材料，但看得出是懂行的人编的 https://news.ycombinator.com/item?id=47403904
- **被骂的**：有人以为它跟得很紧，发现仍是一年两期，只是刚好最近出 https://news.ycombinator.com/item?id=45838036 。对别人自建的雷达：只列状态不写理由没有用，理由才是关键 https://news.ycombinator.com/item?id=45358791
- **没看到的**：雷达页面的交互；企业内部自建雷达的实际使用和维护情况。

### 模型行情看板（models.dev、OpenRouter Rankings、Artificial Analysis、Hugging Face Trending）

- **来源**：<https://models.dev/> <https://github.com/anomalyco/models.dev> <https://openrouter.ai/rankings> <https://artificialanalysis.ai/> <https://huggingface.co/models?sort=trending> <https://news.ycombinator.com/item?id=49821855> <https://news.ycombinator.com/item?id=49810923> <https://news.ycombinator.com/item?id=49550324>
- **时间**：四个页面均 2026-10-05 打开。OpenRouter 标注用量数据截至 2026-10-04；Artificial Analysis 智能指数为 v4.3.2，changelog 最近一条 10 月 3 日；models.dev 仓库 7109 星，当天有推送。
- **工作的单位**：一张表或一张榜。行是模型。
- **怎么开始**：人想起来了去看。
- **干活时**：不适用。
- **提问和批准**：无。
- **交付**：models.dev：一张大表，列有模型、厂商、有几家在提供、上下文和输出上限、能力（推理、工具调用、结构化输出）、是否开放权重、输入输出价格、发布日期、最后更新；数据是仓库里的 TOML 文件，靠社区提 PR 维护，另有 JSON 接口。OpenRouter：按平台上的真实用量排，周用量榜、各类任务按花费份额的榜、编码代理一次会话的成本、最快的模型、市场份额；还有价格对智能指数的散点图，可显示帕累托前沿、钉住最多 5 个模型。Artificial Analysis：智能指数（10 项评测合成）、速度、跑完指数任务的成本；有编码代理、金融、法律、医疗等专项指数；有按你的优先级推荐模型的工具。Hugging Face：模型按 Trending 排，可按任务、库、参数量、推理提供方、本地运行工具筛，每行有任务类型、参数量、更新时间、下载和点赞数。
- **后续**：筛选、对比、钉住。Artificial Analysis 可订文章邮件。
- **主动**：基本没有。四个页面上都没看到「我用的模型有变化就告诉我」这类提醒；Artificial Analysis 只有一个记录新评测的 changelog 流和文章订阅。
- **记忆**：无。
- **文件和工作区**：models.dev 的数据在 Git 仓库里，可以直接被别的工具读。OpenRouter 的排行数据以 CC BY 4.0 开放。
- **排列**：无。
- **手机**：网页。
- **计费**：免费查看。
- **被夸的**：模型发布帖里，用户直接拿 Artificial Analysis 的指数和成本做性价比比较 https://news.ycombinator.com/item?id=49900275
- **被骂的**：有人说这个智能指数里多数基准已经饱和或信号弱，不再是好指标 https://news.ycombinator.com/item?id=49821855 ；合成指数对具体用途可能不相关 https://news.ycombinator.com/item?id=49810923 ；订阅额度和新模型一直在变、总体信息不可靠，只能自己花钱试 https://news.ycombinator.com/item?id=49550324 。同帖有人干脆让一个周期性的 LLM 任务去侦察行情、测新模型、觉得好就换上。
- **没看到的**：四个页面只看了摘要后的内容，筛选和排序的具体交互未亲手操作；Hugging Face 是否有论文或趋势的邮件摘要未核。

### 模型弃用通知与更新日志（OpenAI、Anthropic）

- **来源**：<https://developers.openai.com/api/docs/deprecations> <https://platform.claude.com/docs/en/about-claude/model-deprecations> <https://news.ycombinator.com/item?id=49262312>
- **时间**：两页均 2026-10-05 打开。OpenAI 最新条目 2026-10-01；Anthropic 最新条目 2026-09-30。
- **工作的单位**：一条弃用公告：公告日、关停日、被弃用的模型、推荐的替代。
- **怎么开始**：厂商发起。读的人是被通知的一方。
- **干活时**：不适用。
- **提问和批准**：无。
- **交付**：OpenAI：受影响的客户一定会收到邮件，文档同步，大的变更另有博客。通知期分档：正式可用的模型至少 6 个月，专用变体至少 3 个月，预览模型可能短到 2 周。Anthropic：模型有四种状态（Active、Legacy、Deprecated、Retired）；只通知对该模型有活跃部署的客户，公开发布的模型至少提前 60 天；文档里一张表列出每个模型的状态和不早于哪天退役。
- **后续**：Anthropic：到 Console 的 Usage 页导出 CSV，按 API key 和模型看自己哪里还在用旧模型。两家都给迁移指南和替代型号。
- **主动**：邮件，定向发给受影响的账号。这是「只通知和我有关的」的现成做法：按实际用量决定通知谁。
- **记忆**：文档页保留完整的弃用历史。
- **文件和工作区**：无。
- **排列**：无。
- **手机**：邮件。
- **计费**：不收费。
- **被夸的**：未取得用户对弃用邮件本身的评价。
- **被骂的**：通知只到账号层面，落不到具体哪条工作流：HN 上有人维护 54 个 LLM 工作流，发帖问怎么让它们一直用对模型 https://news.ycombinator.com/item?id=49262312
- **没看到的**：邮件原文；各厂商产品更新日志的订阅方式；用户对通知期长短的评价。

### Dependabot 与 Renovate（用合并请求当通知）

- **来源**：<https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/about-dependabot-version-updates> <https://docs.renovatebot.com/key-concepts/dashboard/> <https://docs.renovatebot.com/noise-reduction/> <https://nesbitt.io/2026/01/10/16-best-practices-for-reducing-dependabot-noise.html> <https://news.ycombinator.com/item?id=46583914> <https://news.ycombinator.com/item?id=47638374> <https://news.ycombinator.com/item?id=49109247>
- **时间**：三个文档页 2026-10-05 打开；讽刺文 2026-01-10；HN 讨论 2026-01、2026-04、2026-07。
- **工作的单位**：一个合并请求对应一条依赖更新。Renovate 另有一个常驻的 issue（Dependency Dashboard）。
- **怎么开始**：仓库里放一份配置，机器人按计划检查。
- **干活时**：人看到的是 PR 上的测试结果。
- **提问和批准**：合并就是批准。Renovate 可以设成先在 Dashboard 里勾选才建 PR：对全部更新、对某一类（例如大版本）、或对某些包；漏洞修复不受这个限制。
- **交付**：PR，摘要里带 changelog 和 release notes；人要做的是看测试过没过、读说明、合并。Renovate Dashboard 这个 issue 列出：还没处理的更新、已弃用的依赖、疑似被遗弃的包、你关掉没合的更新（可以勾选让它重新提）。
- **后续**：在 PR 上评论、关掉、合并；在 Dashboard 上勾选。
- **主动**：变化直接出现在代码评审的队列里，不另开一个要去看的地方。Dependabot 现在默认有 3 天冷却：新版本发布 3 天后才提 PR，安全更新不受限，可用 cooldown 选项改。维护者长期不理它的 PR，它会自己暂停并告诉你。Renovate 的降噪手段：把相关的包合成一个 PR、排到下班后或每月、测试通过就自动合并（分支自动合并时连 PR 都不开）。Renovate 文档的目标是久而久之你越来越少看见它。
- **记忆**：Dashboard 记着你拒绝过什么。
- **文件和工作区**：配置文件在仓库里。
- **排列**：无。
- **手机**：走 GitHub 的通知。
- **计费**：Dependabot 随 GitHub 提供；Renovate 开源。
- **被夸的**：HN：尽管吵，它是有用的，因为它把你的注意力叫过来；加上延迟、把更新合成一个 PR 就好 https://news.ycombinator.com/item?id=47638374
- **被骂的**：一篇讽刺文把「减少 Dependabot 噪音」写成 16 条最佳实践（把 PR 上限设成 0、用机器人自动关掉没人看的 PR、删掉锁文件），上了 HN，讽刺的正是 PR 太多导致团队走形式 https://nesbitt.io/2026/01/10/16-best-practices-for-reducing-dependabot-noise.html ；评论里有人说自己团队靠直接关掉它解决了噪音 https://news.ycombinator.com/item?id=46583914 。同一个版本更新在多个项目、多个平台各来一遍，邮件通知吵得受不了，有人为此做了终端里的分拣工具 https://news.ycombinator.com/item?id=49109247
- **没看到的**：默认冷却是哪天开始的；分组后的 PR 长什么样；团队里的实际合并率。

### GitHub 通知收件箱与 Releases 订阅（附 Hugging Face 通知）

- **来源**：<https://docs.github.com/en/account-and-profile/managing-subscriptions-and-notifications-on-github/setting-up-notifications/about-notifications> <https://docs.github.com/en/account-and-profile/managing-subscriptions-and-notifications-on-github/setting-up-notifications/configuring-notifications> <https://huggingface.co/docs/hub/en/notifications> <https://news.ycombinator.com/item?id=46859010> <https://news.ycombinator.com/item?id=42778129>
- **时间**：文档页 2026-10-05 打开；HN 帖 2026-02-02 与 2025-01-21。
- **工作的单位**：一条通知线程，背后是一个 issue、PR、release 或讨论。
- **怎么开始**：对仓库点 Watch。可选全部活动；自定义只勾 Issues、Pull requests、Releases、Discussions、Security alerts 中的几项；只在参与或被 @ 时通知；或忽略。
- **干活时**：不适用。
- **提问和批准**：无。
- **交付**：网页收件箱，每条标着为什么通知你（被提及、订阅了、请你评审等），可按原因筛。
- **后续**：分拣动作：标 Done（移出收件箱）、Save（一直留着）、Unsubscribe（以后不再通知）、已读未读。没保存的通知保留 3 个月。回复通知邮件就等于在原帖里回复。
- **主动**：三路：网页收件箱、GitHub Mobile（和网页同步）、邮件（带可用于邮箱过滤的头信息）。Hugging Face 类似：关注用户、组织或单个仓库，收到的是讨论和 PR 的动静，可按仓库或按单个讨论静音；它通知的不是新模型发布的摘要。
- **记忆**：Saved 列表。
- **文件和工作区**：无。
- **排列**：无。
- **手机**：GitHub Mobile 的收件箱。
- **计费**：免费。
- **被夸的**：未取得。
- **被骂的**：一位 GitHub 员工自述：入职后被通知淹没，自带界面在维护很多仓库、身处很多组织时就不够用了，以前只能丢给邮件过滤，于是自己做了一个仿 Gmail 的开源收件箱 https://news.ycombinator.com/item?id=46859010 。另一位说 GitHub 邮件 99% 被自动清掉，而网页上的通知页没法用 https://news.ycombinator.com/item?id=42778129
- **没看到的**：定时提醒（评审提醒）细节；Releases 订阅邮件的样子。

### 状态页订阅（Atlassian Statuspage）

- **来源**：<https://www.atlassian.com/software/statuspage/features/notifications>
- **时间**：功能介绍页，搜索结果显示 2026-09-11。支持文档两个地址 404，未取得。
- **工作的单位**：一次事故或一次计划维护；订阅的对象是页面或页面上的某个组件。
- **怎么开始**：读的人在状态页上自己订阅。
- **干活时**：不适用。
- **提问和批准**：无。
- **交付**：事故发生和更新时的通知。
- **后续**：未见。
- **主动**：渠道有邮件、短信、Slack、Microsoft Teams、webhook。可以只订自己在意的组件（Component Subscriptions），别的部分出事不打扰你。
- **记忆**：无。
- **文件和工作区**：无。
- **排列**：无。
- **手机**：短信和邮件。
- **计费**：对读的人免费；对开状态页的一方按订阅人数等分档（只见搜索摘要）。
- **被夸的**：未取得。
- **被骂的**：未取得。只在搜索结果里看到一条 2023 年的社区提问：webhook 订阅不能按单个组件订（未打开）。
- **没看到的**：订阅管理页、通知样式、定价页、用户评价。

### 技术决策文档（ADR 工具、RFC/RFD 流程、Notion 评审）

- **来源**：<https://adr.github.io/> <https://rfd.shared.oxide.computer/rfd/0001> <https://www.notion.com/help/comments-mentions-and-reminders> <https://github.com/npryce/adr-tools> <https://github.com/thomvaill/log4brains> <https://news.ycombinator.com/item?id=46729934>
- **时间**：三个页面 2026-10-05 打开。adr-tools 5722 星，最后推送 2024-04-25；log4brains 1599 星，最后推送 2024-12-17。
- **工作的单位**：一份决策记录：一个决定加它的理由、取舍和后果。许多条合起来叫决策日志。
- **怎么开始**：有人写一份草稿。ADR 常用 Nygard 或 MADR 模板。Oxide 的 RFD：每份占一个编号、一个同名分支。
- **干活时**：Oxide RFD 的状态：prediscussion（还没准备好讨论）、ideation（只有题目）、discussion（开了 PR 就进入）、published（合并）、committed（已全部实现）、abandoned。
- **提问和批准**：讨论在 PR 里进行。Oxide：作者自己决定什么时候合并，建议留 3 到 5 个工作日给反馈；合并后讨论还可以继续。ADR 的状态常见 proposed、accepted、superseded。
- **交付**：仓库里的 Markdown 或 AsciiDoc 文件。Oxide 另有渲染好的站点、按编号的短链、能按标题模糊查并返回状态和讨论链接的聊天机器人、一份导出的 CSV。
- **后续**：被新决定取代时标 superseded 并指向新的那份。Notion 的评审：选中文字加行内评论或加页面级评论，评论可以标为已解决，可加表情回应；另有建议编辑功能（帮助页只给了入口）。
- **主动**：Oxide：订了仓库的人在 PR 打开时收到通知。Notion：被 @ 的人侧栏 Inbox 出红点，Notion 没开着时改发邮件。
- **记忆**：决策日志本身就是组织的记忆，带状态和取代关系。
- **文件和工作区**：和代码放在一起，走同一套评审。
- **排列**：无。
- **手机**：无专门形态。
- **计费**：工具免费开源。
- **被夸的**：HN 上有人问怎么找到旧代码决定背后的原因，回答里建议从现有材料回溯补写轻量 ADR，并从此养成习惯 https://news.ycombinator.com/item?id=46729934
- **被骂的**：本轮未取得直接抱怨。可见的事实：两个最知名的 ADR 专用工具都已一年半以上没有推送，实践主要靠 Markdown 加 PR。
- **没看到的**：飞书文档里的评审流程；Notion 的建议编辑和任何审批机制；企业里 ADR 实际被谁读、读的人怎么被通知。

## 没查到的，来源说明

- 本轮多数页面是通过 WebFetch 的摘要读到的，摘要模型可能漏项或概括失真。我自己读过原文的只有：OpenAI release notes 和定时任务帮助页、飞书两篇帮助页、钉钉帮助页、Gemini Notebook 音频概览帮助页、Dependabot 文档的冷却和暂停段落、Linear Pulse 文档、Slack 帮助页的 Recap 段落、Anthropic 弃用页、Microsoft Learn 的三篇、三个 GitHub 仓库的 README 和 issue 列表、HN 的帖子和评论。其余条目应视为「摘要所见」。
- 没有登录或试用任何产品，所有界面都没亲眼看过。卡片多长、一期多少条、通知文案怎么写、出处在界面上长什么样，这些只能从文档推断。
- Perplexity 官方帮助中心被安全验证页挡住，没有绕过。Discover 的推送和个性化、定时任务结果怎么送达、credit 的官方价格，都只有第三方说法。
- 真实用户评价缺口大的产品：Slack Recap、Teams 会议回顾的准确度、飞书知识问答和智能纪要、钉钉 AI 听记、Glean、Linear Pulse、Readwise Reader、Gemini Daily Brief、新版 ChatGPT 定时任务。Reddit、知乎、G2、Cybernews 的页面都返回 403 或登录墙；钉钉只找到厂商口吻的文章。
- 留存数据一项都没拿到。Pulse 下线是唯一有官方动作佐证的留存信号；prowlo 文中的搜索量下降 96% 和「判断时机最多 64% 准确」两个数字没有核实来源。
- 读完之后的动作（转给下属、记成待办、变成一次决定）在本轮看到的产品里基本缺席：只有 Gemini Daily Brief 能在条目上建待办和回邮件，飞书知识问答能把回答导出成文档或发到会话，Slack 搜索回答能分享到频道。没有看到任何一个产品把一条外部变化直接变成一份决策记录。这是没查到，不等于不存在。
- 「只订和我有关的」按技术栈或项目自动判断的做法，只在两处见到事实依据：依赖更新机器人（读仓库里的依赖）和模型弃用邮件（读账号的实际用量）。资讯类产品里没有看到读用户代码仓库或用量来决定推什么的，是否有产品在做未查到。
- 即刻只打开到一篇推荐性质的文章，产品行为全部未亲见。飞书文档里的评审流程、Notion 的建议编辑和审批、Statuspage 的订阅管理页、GitHub 的定时评审提醒、Hugging Face 是否有论文或趋势的邮件摘要，都未打开到。
- 企业内部自建技术雷达实际怎么维护、多久更新、谁在读，没有找到使用者的说法，只看到工具仓库和一条「不写理由就没用」的评论。
- Microsoft Researcher 的 FAQ 写 25 次每人每月，社区帖说与 Analyst 合计、按自然月；FAQ 更新于 2026-08-18，但社区帖是 2025 年的，合计口径现在是否仍然如此未核。
- Dependabot 默认 3 天冷却是哪一天开始的、Renovate 是否有对应的默认值，未查到。
