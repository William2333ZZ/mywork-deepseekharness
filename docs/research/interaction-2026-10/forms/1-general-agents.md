# 交互形式调查：通用智能体和通用助手

原始记录（2026-10-05）。每条说法以所附网址的原文为准。

## 形式

### 一事一线：一次交办一条任务线，旁边一块工作面板

- **骨架**：单位：一条任务线（对话）加一个沙箱或工作目录。开始：在输入框写清要的结果，选模式（聊天还是干活）、选在本机还是云端、选权限档。过程：中间是对话流，旁边是面板（步骤进度、文件、变更、浏览器画面）；人可以插话（有的进队列、有的直接改方向）、暂停、接管浏览器；它缺信息或要做敏感动作时停下来问。交付：文件卡或产物栏里的文档、表格、演示、网页，可预览、下载、分享。后续：在同一条线里追问，改的是同一份东西；线多了靠侧栏列表、搜索、置顶、归档来找。
- **例子**：Manus 任务、ChatGPT Work、合并后的 Claude、Gemini Spark 的 task thread、WorkBuddy 任务、Kimi Work、MiniMax Code、Perplexity Computer、Genspark Super Agent、豆包办公任务
- **适合**：边界清楚、做完就结束的事：一份报告、一个表、一套幻灯片、一次数据清洗。HN 上对 Cowork 和 ChatGPT Work 的正面评价都落在这类事上。
- **在哪里坏**：(1) 入口要用户先分清聊天还是干活时，普通用户分不清：Claude 为此在 2026-09-16 把两者合并（https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude），ChatGPT 仍分 Chat/Work/Codex，被用户说成极其混乱（https://news.ycombinator.com/item?id=49504625）；合并后又有人抱怨没法保证只聊天（https://news.ycombinator.com/item?id=49729412）。(2) 事情要持续或重复时，结果散成许多条线：Claude 用户说找定时任务的结果要点很多下（同上 HN）；Perplexity 的后台定时运行每次是全新 agent、不带之前上下文（https://www.perplexity.ai/help-center/en/articles/11521526-perplexity-tasks）。(3) 人的审批跟不上：有用户说自己的产出受限于自己审阅的速度（https://news.ycombinator.com/item?id=49896604）。

### 项目当容器：指令、资料、记忆归到一个项目，任务在项目里开

- **骨架**：单位：项目，里面有一份常驻指令、一批资料文件、若干条任务线，有的还有项目内的定时任务和项目记忆。开始：建项目（空白、从已有项目导入、或指向一个本地文件夹），以后在项目里新开任务就自动带上指令和资料。过程：与一事一线相同。交付：产物留在项目里。后续：同一项目的不同任务共享资料和记忆；项目可置顶、排序、分享给同事。
- **例子**：Manus Projects、ChatGPT Projects、Claude Projects、Gemini notebooks、扣子的项目、WorkBuddy 项目、Kimi Work 项目
- **适合**：同一类活反复做（周报、竞品分析）、同一主题长期跟进、多人共用一套指令和资料。
- **在哪里坏**：(1) 项目的隔离和别的能力打架：ChatGPT 仅项目记忆的项目里不能用 Work，共享项目只能用仅项目记忆（https://help.openai.com/en/articles/6825453-chatgpt-release-notes ，2026-08-14 条目）。(2) 本地与云端两种项目不互通：Claude 从本地文件夹建的项目只留在那台电脑，迁到 Claude Code 时项目和定时任务不跟着走（https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile）。(3) 更新不追溯：Manus 项目文件更新只对新任务生效（https://manus.im/docs/features/projects.md）。(4) 项目本身不会主动干活，还得另配定时，而定时的结果又未必回到项目里显眼的位置（https://news.ycombinator.com/item?id=49729412）。

### 常驻的一位（或几位）助手：有名字、有自己的电脑和记忆，一条不断的线

- **骨架**：单位：一位具名的助手，一条持续的对话，加它自己的文件夹或云电脑、自己的日程、自己的记忆文件，有的还有自己的邮箱。开始：创建时起名、定人设或写职责、连接要用的 app 和聊天渠道；之后交给它的是一件要一直管的事，而不是一次请求。过程：它在两次对话之间自己推进，自己决定何时醒来，或按心跳周期检查；派出去的子任务在它的活动页里逐个可看；人随时在同一条线里补一句、改优先级。交付：把结果或需要你决定的事发到你指定的渠道。后续：记忆写成文件或笔记，下次接着用；可暂停、可删除。
- **例子**：ChatGPT dot（2026-09-29）、扣子 Agent、Kimi Claw、Genspark Claw、WorkBuddy 助理、Manus Cue、MiniMax Code 的自定义 Agent、Claude Dispatch（已不向新用户提供）、放在 Mac mini 上的 Perplexity Personal Computer
- **适合**：要一直盯、会随时间变化的事（筹办活动、跟进提案、盯收件箱）；按领域分开的几位助手能让记忆不串——HN 上一位 Grok Bot 重度用户把这点列为主要好处（https://news.ycombinator.com/item?id=49896604）。
- **在哪里坏**：(1) 一条线撑不住无限上下文：Kimi Claw 每天凌晨 4 点重置会话，没明说要记的就丢（https://www.kimi.ai/zh-hans/help/kimi-claw/memory-loss）；Claude 的单线程 Dispatch 已停止向新用户提供（https://support.claude.com/en/articles/13947068-assign-tasks-from-anywhere-in-claude-cowork）。(2) 一条线其实断成几处：dot 派出的任务是另开的对话、不带全部历史（https://learn.chatgpt.com/docs/dots/tasks-and-memory.md）；WorkBuddy 自动化的结果只作通知，不写进助理的上下文（https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Automation-Guide）；扣子官方建议另建项目以免日程消息扰乱主对话（https://docs.coze.cn/cozespace_job）。(3) 信任与批准：不少用户不愿给写权限；实测者嫌 dot 反复确认（https://news.ycombinator.com/item?id=49896604）。(4) 后台自己醒来要花钱：扣子文档承认用户会觉得没干活积分却在少（https://docs.coze.cn/cozespace_job）；Genspark Claw 每次 Heartbeat 都耗 credits（https://www.genspark.ai/helpcenter/genspark-claw）。(5) 助手之间还不能互相派活：扣子里只有人能 @Agent（https://docs.coze.cn/cozespace_coze_app_faq.md）。

### 定时与事件自动化，加一个运行记录收件箱

- **骨架**：单位：一条保存下来的指令加一个触发条件（时间、来信、仓库或店铺事件、话题、webhook）。开始：在对话里说带时间的话，它提出名称、计划、内容让你确认；或在专门页面填表、选模板；可先试跑。过程：到点在后台跑，多数产品每次起一条新的运行；也有回到原对话带着上下文跑的选项。交付：一个专门的列表页（已排程、更新、自动化、日程），按日期或状态分组，带未读标记；另加手机推送、邮件或聊天软件消息；监控类只在有值得说的事时才通知。后续：暂停、恢复、改指令或节奏、立即跑一次、删除；连续失败或长期没人看会被系统自动暂停。
- **例子**：ChatGPT Scheduled、Manus Automations、Claude Scheduled tasks、Gemini scheduled actions 与 Spark schedules、Perplexity Automations、Genspark Workflows、WorkBuddy 自动化、扣子日程、Kimi Work 定时任务、MiniMax Code 定时任务、千问和豆包的定时任务
- **适合**：每日或每周的简报与汇总、盯变化（价格、新闻、收件箱）、周期性的整理。
- **在哪里坏**：(1) 计入额度就没人敢多建：有用户发现定时任务吃编码额度后不再新建（https://news.ycombinator.com/item?id=49729412）。(2) 数量和频率上限：Gemini 最多 10 个（https://support.google.com/gemini/answer/16316416?hl=en）；ChatGPT 和 Perplexity 最密每小时一次，Free 用户 3 个（https://help.openai.com/en/articles/6825453-chatgpt-release-notes）。(3) 数据不新鲜：Gemini 提前准备内容，官方说不适合股价（同上 Gemini 页）。(4) 没人看就自己停：ChatGPT 与 Gemini 都会自动暂停不活跃的任务。(5) 跑在本机的到点不一定跑：Kimi、MiniMax 要求电脑不睡（https://www.kimi.ai/zh-hans/products/kimi-work 、https://agent.minimaxi.com/docs/code/automation/schedules.md），WorkBuddy 更新日志列出休眠期间调度不准、通知漏发、无记录却反复执行（https://www.workbuddy.cn/docs/workbuddy/Changelog）。(6) 静默失败：一位自己跑了 20 个定时任务的用户列出超时无感知、重复触发、失败不上报，第二天才发现没跑（https://www.v2ex.com/t/1202608）。(7) 同一家两套定时并存，管理入口不同：Gemini（chat 的与 Spark 的）、Perplexity（旧 Tasks 与 Computer 的，https://www.perplexity.ai/help-center/en/articles/20260710-how-to-delete-scheduled-tasks-perplexity-tasks-vs-computer-scheduled-tasks）。

### 聊天软件当遥控器：在微信、飞书、Slack 里给电脑上或云上的助手发消息

- **骨架**：单位：聊天软件里与机器人的一个对话，对应后端的一个助手会话。开始：先在桌面或网页端绑定渠道（扫码或建机器人应用），之后在手机上发一句话。过程：手机这头基本看不到过程，只等回话；高风险动作发确认。交付：结果以消息或文件回到聊天里；完整的步骤和文件留在桌面端的记录页。后续：继续在聊天里说；回到电脑上看全貌。
- **例子**：WorkBuddy 助理（微信、企业微信、QQ、钉钉、飞书）、扣子的飞书和微信渠道、Kimi Claw 与 Genspark Claw 的 Telegram 等渠道、ChatGPT dot 的 Slack/Teams、Manus 的 Slack/LINE/邮件、MiniMax Code 的 IM 连接
- **适合**：不在电脑旁时的临时交办、收定时结果、团队群里共用一个助手。
- **在哪里坏**：(1) 本机方案要求电脑一直开着且应用在运行（https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Assistant）；Claude 把这条路换成了云端会话（https://support.claude.com/en/articles/13947068-assign-tasks-from-anywhere-in-claude-cowork）。(2) 通道本身会掉：WorkBuddy 文档提醒回调方式长时间不触发可能失效，更新日志有通知延迟和漏发（https://www.workbuddy.cn/docs/workbuddy/Changelog）。(3) 各渠道的消息互不可见，只有记忆是通的：扣子和 dot 都这样设计（https://docs.coze.cn/cozespace_memory.md 、https://learn.chatgpt.com/docs/dots/tasks-and-memory.md），用户得记住哪句话说在了哪。(4) 多设备对不上：WorkBuddy 用户三台电脑只显示两台（https://www.v2ex.com/t/1244641）。

### 文档、看板、画布当工作面：人和助手对着同一份东西改

- **骨架**：单位：一页文档、一块看板、一张画布或一条时间线。开始：从对话生成，或直接新建后在里面 @ 助手。过程：助手出第一版；人直接动手改，或选中一处让它改，先看提议再接受；人的操作成为它接着干的上下文。交付：这份东西本身，可分享链接、导出、固定到桌面。后续：一直在同一份上迭代；可给它挂一个刷新任务。
- **例子**：ChatGPT Space 的 Pages（@ChatGPT、@dot）、Claude Docs/Slides/Design 与 Artifacts、扣子的 Panel、Kimi Work 的小组件和看板、Manus Studio 的视频时间线和游戏编辑面板、Flowith 画布、Lovart
- **适合**：要给别人看的成品、需要逐处精修的东西、要并排比较多个版本的创作、需要持续刷新的指标面板。
- **在哪里坏**：(1) 自动保持更新还没接上：ChatGPT Space 上线时页面的保持更新功能不可用，在页面里写了节奏不等于真的排了任务（https://learn.chatgpt.com/docs/space/agents.md）。(2) 容量上限低：Kimi 每人 2 个看板、每个 20 个小组件、批注 10 条（https://www.kimi.ai/zh-hans/help/kimi-work/dashboard）。(3) 单步小事用不着：Flowith 官方博客自己说画布不适合一次性的小转换和严格的固定流程（https://flowith.io/blog/meet-agent-neo）。(4) 新模型里旧的并排编辑面被收回：ChatGPT 的 canvas 自 2026-05-28 起不再随新模型提供，改回对话内的写作块（https://help.openai.com/en/articles/6825453-chatgpt-release-notes）。

### 主动信息流：不等人问，每天推一组它觉得你该看的东西（已被放弃）

- **骨架**：单位：每天一批卡片。开始：不需要开始，系统根据历史对话和连接的 app 自己准备。过程：用户看不到。交付：早上的一组更新。后续：点进某张卡片继续聊，或反馈想看什么。
- **例子**：ChatGPT Pulse（2026-06-17 宣布下线）；后继形态是让用户自己排一个每日简报的定时任务，以及 dot 的只读式 proactive research
- **适合**：没有找到用户说它好用的一手证据。
- **在哪里坏**：OpenAI 自己把它并入定时任务（https://help.openai.com/en/articles/6825453-chatgpt-release-notes ，2026-06-17 条目）；下线前一个月有 Pro 用户发帖问这些每天早上的随机综合有没有人觉得真有价值，没有人回答（https://news.ycombinator.com/item?id=48062680）。后继者都改成由用户明说要盯什么、只在有事时通知。

## 近一年的变化

- 2026-06-17 ChatGPT 宣布 Pulse 下线，主动更新并入 scheduled tasks；同日上线侧栏 Scheduled 页，监控类任务只在有值得报告的事时通知，无人看管的任务会自动暂停（https://help.openai.com/en/articles/6825453-chatgpt-release-notes）
- 2026-07-09 ChatGPT 推出 Work（干活模式），新桌面 app 把 Chat、Work、Codex 合在一个应用里，App Directory 换成 Plugin Directory；同日停止新建群聊（同上 release notes）
- 2026-05-28 ChatGPT 新模型不再提供 canvas，写作和代码改在对话内的块里完成（同上 release notes）
- 2026-08-25 ChatGPT 定时任务可由 webhook 触发、可分享；Free 用户也能建（最多 3 个）；Work 的浏览器可在需登录的网站上干活（同上 release notes）
- 2026-09-11 ChatGPT 宣布计划退役自定义 GPTs，迁往 plugins；Google 同方向：Gems 从 2026-11 起转为 skills（同上 release notes；https://support.google.com/gemini/answer/18560919?hl=en）
- 2026-09-29 ChatGPT 推出 dots（常驻 agent，自带云电脑，可在 Slack/Teams/电话里找它，有只读的主动研究）；Space 取代 Library，Pages 可多人协作；同日 Pro 200 额度下调并新增 Pro 500（同上 release notes；https://learn.chatgpt.com/docs/dots.md ；https://news.ycombinator.com/item?id=49896975）
- 2026-09-16 Claude 把 Cowork 和 chat 合并成一种对话，由模型判断是快答还是任务，转过去后不能切回；同时 Dispatch（手机到桌面的单条持久线程）不再向新用户提供（https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude ；https://support.claude.com/en/articles/13947068-assign-tasks-from-anywhere-in-claude-cowork）
- 2026-10-06 起 Claude Pro/Max 的新 Cowork 任务一律在云端运行，仅在本机运行的选项移除，定时任务也迁到云端；要留在本机的被引导去 Claude Code（https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile ，页面更新于 2026-09-30）
- Claude 记忆改为边聊边按主题条目保存，旧版记忆的导出窗口到 2026-09-09；chat 与云端 Cowork 共用一份记忆（https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context ，页面更新于 2026-09-30）
- 2026-05-19 Google 推出 Gemini Spark（任务线加工作面板，带 Schedules 和 Skills）；2026-06-30 加话题监控并上 Mac；2026-07-13 通知改为你正看着该任务时不再推手机；2026-07-14 可从别的设备遥控 Mac（https://support.google.com/gemini/answer/17171264?hl=en）
- Manus：2025-12-29 被 Meta 收购，2026-08 宣布恢复独立运营并在 2026-08-23 至 24 删除受影响地区用户在收购后产生的数据；2026-03 推出桌面端 My Computer；2026-10-01 的帮助中心文章介绍 Manus 2.0：定时并入 Automations（加事件触发和一句话生成的流程）、新增 Cue（一组各有身份的个人 agent）、Studio（在本地文件夹上工作）、手机语音 Remote Control、Cloud Computer（https://help.manus.im/en/articles/16147831-service-change-overview-what-s-happening-and-am-i-affected ；https://help.manus.im/en/articles/17190150-what-is-new-in-manus-2-0）
- Perplexity：2026-02-25 推出 Computer；Computer 里的 Scheduled Tasks 取代旧的 Perplexity Tasks（旧的仍留在通知设置里）；又推出桌面的 Personal Computer 和可在自有硬件上跑的 Portable Computer（https://www.perplexity.ai/help-center/en/articles/11521526-perplexity-tasks ，https://www.perplexity.ai/help-center/en/articles/13837784-what-is-computer ，后者 2026-09-29 修改；发布日期据 HN 列表 https://news.ycombinator.com/item?id=47153775 的标题，正文未读）
- 扣子：2.5 版把长期计划改成 Agent 日程（Heartbeat 加定时任务），给 Agent 配了自己的邮箱；2026-05-29 的 3.0 改成多人多 Agent 的团队协作平台，上线桌面端，并可接入本机的 Claude Code、Codex CLI、OpenClaw、Hermes（https://docs.coze.cn/cozespace_coze_app_faq.md ，页面修改于 2026-09-08）
- Kimi：2026-06-03 上线桌面端 Kimi Work（Beta），之后陆续加目标模式、插件中心、小组件与看板；另有托管 OpenClaw 的 Kimi Claw（https://www.kimi.ai/zh-hans/help/kimi-work/overview）
- MiniMax：桌面端改名 MiniMax Code，2026-09-30 的 3.1.0 做视觉焕新并上线 M Plan 订阅；侧栏有 Agent Team，可建多位各有独立对话入口的自定义 Agent（https://agent.minimaxi.com/docs/changelog.md ；https://agent.minimaxi.com/docs/code/agents/custom-agents.md）
- 豆包：2026-06-13 上线任务模式（含定时执行，当时免费），2026-06-24 推出专业版办公任务并开始分档收费（https://www.aivsly.com/article/doubao-task-mode-agent-review-june-2026.html ；https://www.36kr.com/p/3867006268750725）
- 千问：2026-07 千问办公独立客户端上线并打通钉钉；2026-08-07 千问 App 加入定时任务、办公助理、手机发起电脑执行（https://www.aigc.bar/AI%E8%B5%84%E8%AE%AF%E6%96%87%E7%AB%A0/2026/07/27/qwen-work-ai-agent-hands-on-review ；https://www.ithome.com/0/986/849.htm）
- 跨产品的两个相反方向同时发生：Claude 和 ChatGPT 把执行搬到云端以便合上电脑也能跑、手机能接续；Manus（Studio、My Computer）、Perplexity（Personal/Portable Computer）、WorkBuddy、Kimi Work、MiniMax Code、扣子桌面端则在往本机文件夹和本机应用上靠。来源见上面各条。
- 跨产品的共同动作：把 OpenClaw 式的文件化记忆和心跳搬进商业产品——扣子（SOUL.md、USER.md、MEMORY.md、HEARTBEAT.md）、Kimi Claw（AGENTS.md 的 MEMORY 段）、Genspark Claw（Heartbeat）、ChatGPT dot（自己的笔记、自己决定何时醒来）（https://docs.coze.cn/cozespace_memory.md ；https://www.kimi.ai/zh-hans/help/kimi-claw/memory-loss ；https://www.genspark.ai/helpcenter/genspark-claw ；https://learn.chatgpt.com/docs/dots.md）

## 产品

### Manus（含 Manus 2.0、Automations、Cue、Desktop/My Computer）

- **来源**：<https://help.manus.im/en/> <https://help.manus.im/en/articles/17190150-what-is-new-in-manus-2-0> <https://help.manus.im/en/articles/16147831-service-change-overview-what-s-happening-and-am-i-affected> <https://help.manus.im/en/articles/14178443-what-is-the-my-computer-feature-capable-of> <https://manus.im/docs/llms.txt> <https://manus.im/docs/features/projects.md> <https://manus.im/docs/automations.md> <https://manus.im/docs/introduction/plans.md> <https://manus.im/docs/features/desktop.md> <https://news.ycombinator.com/item?id=49258764> <https://www.v2ex.com/t/1234707>
- **时间**：帮助中心：Manus 2.0 文章 2026-10-01、服务变更 2026-08-21、My Computer 2026-03-24；manus.im/docs 各页无日期，2026-10-05 打开；HN 2026-08-11；V2EX 2026-08-16
- **工作的单位**：任务（task）：一段对话加一个云端沙箱。Projects 是装任务的文件夹，带一份总指令（master instruction）和知识库文件，项目内新任务自动继承。2.0 新增两种单位：Automation（由时间或事件发起的工作）和 Cue（独立 app 里的一组个人 agent，每个 agent 有自己的邮箱、电话号、钱包、电脑；目前要邀请码）。
- **怎么开始**：首页输入框发一句话（帮助中心有 Chat mode / Agent mode 两档的文章）；项目里新建任务；给 Mail Manus 发邮件；Slack、LINE 里对话；手机上开语音命令遥控桌面（Remote Control）；侧栏 Automations → Create → Schedule / Triggered task / Advanced automation（Beta，一句话生成多步流程）；桌面 Studio 里指向一个本地文件夹开工。
- **干活时**：官方文字描述：Remote Control 时桌面画面实时回传到手机，执行中可以改口换指令；云端浏览器或 VS Code 可由人接管（帮助文章标题所见）；plans 文档建议多阶段任务先看中间结果再继续。Video Editor、Game Dev 这类 Studio 附加环境里，人可以直接动时间线、素材、代码，再让 Manus 接着改同一个项目。步骤列表、进度条的具体样子未亲见。
- **提问和批准**：本地 My Computer 的批准规则两处官方说法不一致：docs 的 Desktop 页说每条命令都要明确批准，可选只这一次或始终允许；帮助中心 2026-03-24 的文章说授权文件夹后自动执行，只对敏感命令确认，并可把授权范围限定到当前任务或当前路径。Automations 文档提倡在指令里写清例外路径（信息缺失、把握不足、对外动作需复核时怎么办），示例多为先出草稿由人决定是否发出。
- **交付**：任务内的文件、网页、幻灯片、视频工程等。自动化的结果进 Automations → Updates：按日期分组，每条有自动化名称、运行时间、状态、结果摘要，点开看全文或看为何需要关注；另有月历视图看已跑和将跑的。出处怎么标注未亲见。
- **后续**：在同一任务里继续说。Automation 可选在同一任务里继续（依赖早先消息、文件、要持续更新的产物时用）或每次新开任务。项目总指令改动在下一条消息生效；项目文件改动只对之后新建的任务生效，旧任务不受影响。
- **主动**：Automations 三种：Schedule（定时，含一次性提醒）、Triggered task（Gmail、Outlook、Notion、日历、GitHub、Shopify、RSS、Webhook 等事件；GitHub/Shopify/Webhook/Mail Manus 即时送达，其余周期轮询所以不一定立刻触发）、Advanced automation。管理页每张卡片可暂停、试跑（Test run）、定位原任务、编辑、删除；同一失败重复多次时触发器会自动暂停。以前的 Scheduled tasks 并入这里继续运行。
- **记忆**：看得见的是 Projects 的总指令加知识库（帮助中心有「知识库上限」文章，正文未读）。跨任务的自动记忆、Cue 里 agent 的记忆怎么呈现，未亲见。
- **文件和工作区**：每个任务一个云端沙箱；Manus Desktop 的 My Computer 授权本地文件夹后通过命令行读写（只能看到授权的文件夹）；Studio 直接在本地文件夹上工作；Cloud Computer 是另购的常驻环境，用来放自动化或游戏服务器。
- **排列**：侧栏：Projects（可置顶、拖拽排序）、任务列表（过滤项：全部 / 非项目 / 收藏 / 已排程）、Automations、Agents (Cue!) 标签。Wide Research 是并行子 agent。Cue 的例子是一个频道里三位 agent 依次传活，人定方向、在手机上查看、做最后决定。
- **手机**：手机 app 可给家里开着的电脑派活（电脑须开机且 Manus Desktop 在运行）；语音 Remote Control；Cue 有手机和桌面两端。
- **计费**：积分（credits），按任务复杂度扣。月度积分每周期清零，加购积分不过期。文档称仪表盘显示余额、历史任务消耗、低余额提醒，并在开始前给出预估。Cloud Computer 另行购买。
- **被夸的**：HN 用户：深度研究时的网页浏览比 Gemini 好、PDF 报告产线好；不在电脑旁时在 iPad 上用它做电脑操作很顺手；内置的数据库、浏览器等配套不错（https://news.ycombinator.com/item?id=49258764）。
- **被骂的**：贵且慢：有人称单个深度研究任务烧掉约 40 美元；有人指出它不是模型厂商自家产品，实际按 API 价而非套餐价付费，最后很贵；任务完成速度很慢（https://news.ycombinator.com/item?id=49258764）。2026-08 恢复独立运营时，受影响地区用户 2025-12-29 之后的任务数据被删除，需自行备份再恢复（帮助中心）；V2EX 用户称未到期的年付 Pro 被取消、斥其无商业道德，也有人说收到了退款，还有人说自从模型厂商自家的 agent 好用后几乎没再打开过（https://www.v2ex.com/t/1234707）。
- **没看到的**：任务运行界面的具体形态；Cue 的实际界面和记忆；定价页金额；Chat/Agent mode、接管浏览器、Skills、Slack/LINE 各篇正文；2.0 的独立用户评价。

### ChatGPT（Chat / Work / Scheduled / Projects / Space / dots）

- **来源**：<https://help.openai.com/en/articles/6825453-chatgpt-release-notes> <https://learn.chatgpt.com/docs/llms.txt> <https://learn.chatgpt.com/docs/dots.md> <https://learn.chatgpt.com/docs/dots/getting-started.md> <https://learn.chatgpt.com/docs/dots/tasks-and-memory.md> <https://learn.chatgpt.com/docs/dots/controls.md> <https://learn.chatgpt.com/docs/get-started-with-work.md> <https://learn.chatgpt.com/docs/automations.md> <https://learn.chatgpt.com/docs/customization/memories.md> <https://learn.chatgpt.com/docs/notifications.md> <https://learn.chatgpt.com/docs/projects.md> <https://learn.chatgpt.com/docs/pricing.md> <https://learn.chatgpt.com/docs/long-running-work.md> <https://learn.chatgpt.com/docs/space/agents.md> <https://simonwillison.net/2026/Aug/30/understanding-chatgpt-work/> <https://news.ycombinator.com/item?id=49504625> <https://news.ycombinator.com/item?id=49896604> <https://news.ycombinator.com/item?id=49896975> <https://news.ycombinator.com/item?id=49889306> <https://news.ycombinator.com/item?id=48062680> <https://news.ycombinator.com/item?id=49901067>
- **时间**：Release notes 页标注 3 天前更新，最新条目 2026-10-02；learn.chatgpt.com 文档页无日期，2026-10-05 打开（文中提到 2026-10-14 的模型退役）；Simon Willison 2026-08-30；HN 2026-05 至 2026-10
- **工作的单位**：几层并存：(1) chat——输入框上选 Chat 或 Work，Work 里的一条对话就是一个 task；(2) Project——一组 chats 加 Sources 加项目指令；(3) Scheduled——保存下来的定时或事件任务；(4) Space 里的 Page——文档为单位，可在页内 @ChatGPT 或 @dot；(5) dot（2026-09-29 推出）——一位常驻 agent：一条持续的对话，有名字、外观、@handle、自己的云端电脑和浏览器、自己的笔记，被交付的是「责任」而不是一次性请求。
- **怎么开始**：网页/手机：切到 Work 描述要的结果；桌面 app 还要选在本机还是云端跑；桌面输入 /goal 进 Goal mode（目标文字同时是首条指令和完成标准），不清楚时先 /plan 让它来问你。dot：在桌面 app 或桌面浏览器创建，连接 app、可选连接电脑，它先自我介绍并据已有上下文提建议；之后在同一对话里交事情；也可在 Slack/Teams 私信或 @ 它，或在对话里点电话按钮打给它（通话结束后已交的活继续）。
- **干活时**：Work：可看进度、回答它的问题、改方向、批准重要动作。桌面 Goal mode 在输入框上方有一条进度行，可暂停、恢复、改目标、清除；运行中可继续发消息调整；可开旁路对话问进度而不打断主对话。桌面侧栏铃铛的 Activity 视图列出未读、运行中、等你回应的对话；还有浮在桌面的 pet 显示运行中 / 需要输入 / 就绪 / 受阻。dot：它干活时可以一直跟它说话；Pause 只停它当前的主任务；在它的 Profile → Activity 里逐个打开它派出去的任务，看进度、文件、结果和等你处理的请求；它的云端浏览器可 Take over，做完再 Return control。
- **提问和批准**：网站要登录时把登录交给人：发一张登录请求，在私密表单里填，凭据不经过对话；或接管浏览器自己登。dot 的动作在执行前过一道自动审查，结果是放行、要你批准、或交给你本人做（例如改密码）。Custom rules 可对某类动作设四档：不问直接做 / 你明说才做 / 做前问 / 交给你。文档强调让它起草不等于允许它发送。HN 上有实测用户抱怨订接驳车时来回确认了好几轮。
- **交付**：Work 交回文档、表格、演示、PDF、Sites，在对话旁预览和修改。桌面的 Scheduled 视图被文档称作收件箱：有发现的运行出现在那里并带未读标记。dot 把结果或需要你决定的事发到你指定的地方，可以要求日常进展留在 ChatGPT、需要决定的事发到 Slack。回答下方的 Sources 可看用了哪些记忆、历史对话、文件（2026-05-05 条目）。
- **后续**：同一条 chat 里继续。定时任务分两种：独立任务每次新开一条 chat、从保存的 prompt 起步；chat 内定时则回到同一条 chat、带着已有上下文。dot 开出的 cloud thread 是独立对话，出现在桌面、网页、手机，可以进去直接指挥；新任务只拿到 dot 给它的指令和上下文，不会自动带上你和 dot 的全部对话。Page 上选中文字可要求改写，先看提议再接受。
- **主动**：Pulse 已下线：2026-06-17 的 release note 说主动更新并入 scheduled tasks，Pro 用户再保留 14 天，想继续收每日更新就让 ChatGPT 排一个每日简报。同日上线 Scheduled 页：可选具体时间或上午/下午/晚上这样的时间窗；监控类任务只在有值得报告的事时才通知；最密每小时一次；无人看管的任务一段时间不活动会自动暂停。2026-08-25：可由 webhook 触发、可分享；Free 用户最多 3 个活跃任务且每天至多一次。网页和手机支持 Gmail、Slack、GitHub 事件触发（桌面 app 不支持），同一任务不能混用事件和时间，短时间内多个事件可能合并成一次运行。dot：自己决定何时停下、何时醒来跟进，不必事事定时；另有 proactive research——用只读工具在已连接的 app 里找可帮忙之处，写私有笔记，再来向你提建议或提问。通知渠道视账户有 push、邮件、短信。
- **记忆**：ChatGPT memory 在 Settings > Personalization：记忆摘要页可用一句话让它改、可删、可删除并关闭。Project 可在默认记忆和仅项目记忆之间切换（2026-08-14）；共享项目只能用仅项目记忆；仅项目记忆的项目里不能用 Work。本地 Codex 记忆是 ~/.codex/memories/ 下的生成文件，默认关闭，用 /memories 按对话控制是否读取、是否参与生成。macOS 有 Computer History，把电脑上的活动变成记忆和时间线。dot 另有自己的笔记（偏好、决定、进行中的事），与 ChatGPT 的保存记忆分开、不是完整转录；文档没有说用户能不能直接查看或编辑这些笔记。
- **文件和工作区**：Work Cloud：每个会话一个 scratch 目录，/workspace 卷跨会话保留并在并行会话间共享（Simon Willison 实测）；桌面本地 Work：项目即本地文件夹；Project 的 Sources；Space（2026-09-29 起取代 Library）放 Pages 和文件；dot 有自己的云电脑，另可连一台个人电脑（需在线且 app 开着，一次只能连一台）。
- **排列**：桌面顶层切换 ChatGPT ↔ Codex，ChatGPT 内再切 Chat ↔ Work。侧栏有 Projects（可置顶）、chats、Scheduled、Activity。dot 是单独入口，Profile 里有 Activity、Scheduled、联系方式和电脑连接；它用后台 agent 并行，也可开出可见的独立 thread。文档通篇是单数的 your dot。
- **手机**：Work 在手机上可用（云端跑）；Work 里可用语音，挂断后未完成的任务以文字继续。dot 须先在桌面创建，文档写的是待支持的更新可用后可在手机 app 里继续，不支持手机网页。Codex Remote 可用手机启动、指挥、批准连着的电脑上的任务。通知含 push。
- **计费**：订阅加额度：Work 与 Codex 共用同一套额度和 credits；档位 Free 0、Go 8、Plus 20、Pro 100/200/500 美元每月，可加购 credits；不公布具体额度数值。与 dot 对话不计入 ChatGPT 用量，dot 发起的 Work/Codex 任务照常计；首月 dots 不计入套餐额度，之后的条款待公布。
- **被夸的**：Simon Willison：云端 Work 能联网跑代码、有无头浏览器、有跨会话的持久文件系统，非常强（https://simonwillison.net/2026/Aug/30/understanding-chatgpt-work/）。HN：有人用了几天 dot 后表示相当满意；有人说 ChatGPT 连上 Gmail/Drive 再加几个定时任务已经省了很多时间；有 Grok Bot 重度用户认为按领域分开的常驻 agent 让记忆不串、更可信（https://news.ycombinator.com/item?id=49896604）。
- **被骂的**：结构让人糊涂：Chat、Work（本机/云端）、Codex、Codex Cloud 的关系没有文档讲清，有用户说每类建一个最小项目才弄明白（https://news.ycombinator.com/item?id=49504625）。定时任务耗 Codex 额度，有人因此不再新建；有人说与其出 dots 不如取消定时任务的数量上限（https://news.ycombinator.com/item?id=49729412 、https://news.ycombinator.com/item?id=49896604）。dot 实测者给 B-：已口头同意的预订被反复要求确认。不少人表示不会把邮件、财务等写权限交给主动型 agent；也有人说自己的产出受限于自己审批的速度，夜里让 agent 跑没有意义（同帖）。2026-09-29 Pro 200 的额度减半且不公布具体数值，评论多为被抽走承诺、信任受损（https://news.ycombinator.com/item?id=49896975 、https://news.ycombinator.com/item?id=49889306）。Pulse：一位 Pro 用户发帖问每天早上收到的综合信息有没有人觉得真有用，零回复（https://news.ycombinator.com/item?id=48062680）。
- **没看到的**：agent 模式现状：2026-06-04 的 release note 还提到 agent mode，7 月后的文档只讲 Work，没看到明确的合并或退役公告。Canvas：2026-05-28 起新模型不再提供，改为对话内的写作块/代码块，之后是否彻底下线未见。deep research 现为 Work 的 + 菜单项或桌面插件，报告界面未亲见。dot 的真实界面、手机端、各档额度数值、Team Tasks、Skills 正文均未亲见。

### Claude（合并后的 Claude / Cowork、Projects、Scheduled tasks、Dispatch）

- **来源**：<https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude> <https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork> <https://support.claude.com/en/articles/13947068-assign-tasks-from-anywhere-in-claude-cowork> <https://support.claude.com/en/articles/14116274-organize-your-tasks-with-projects-in-claude-cowork> <https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile> <https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context> <https://support.claude.com/en/collections/19667525-claude-cowork> <https://news.ycombinator.com/item?id=49729412> <https://news.ycombinator.com/item?id=49258764>
- **时间**：帮助中心各页更新于 2026-09-16 至 2026-09-30；HN 2026-09-16、2026-08-11
- **工作的单位**：对话与任务正在并成一种：2026-09-16 起向 Pro/Max 灰度，帮助页顶部的说明是 "Claude Cowork is now just Claude"（Claude 帮助中心），由 Claude 判断是快答还是任务，转过去后不能切回。Project = 指令 + 上下文（本地文件夹、关联的项目、链接）+ 项目内定时任务 + 项目记忆。Scheduled task = 保存的 prompt 按节奏运行，每次运行是独立的一次 session。Dispatch 是手机和桌面共用的一条不重置的线程，现已不向新用户提供。
- **怎么开始**：新体验：任意对话里描述结果、格式、要用的材料。旧界面：输入框左下选 Chat 或 Cowork。Chrome 侧栏打开即是 Cowork。手机可发起，云端继续跑。输入 /deep-research 或点 + 选 Research。项目里可开 chat 也可开 Cowork。
- **干活时**：可同时跑多个任务；较长的任务在云端继续，合上电脑也不断；随时可停或改方向；手机上能看进度、回答 Claude 的问题、改方向。Dispatch 的设计是只把结果（表、备忘、PR）发回线程，不展示每一步，任务完成或需要点头时手机推送；想看细节再点进对应的 session。运行中步骤的呈现样式未亲见。
- **提问和批准**：输入框里的权限设置对整段对话生效：Manual（默认）每个动作前问，逐个允许；Auto 不逐步问，动作前跑自动安全检查。默认在永久删除文件前询问。建定时任务时 Claude 可能先出多选题，再给出任务名、计划、内容，由用户点 Schedule 确认；手动创建的表单里有一项 approval mode。
- **交付**：对话旁出现文件：文档、带公式的表格、可在 PowerPoint 打开的演示，可下载或让它接着改；Artifacts；付费档可要 Claude Docs / Slides / Design（beta），自己改或让它改，链接分享或导出。定时任务在侧栏 Scheduled 里看将要和已经跑过的运行。
- **后续**：同一对话继续；新体验下暂不支持从早先某处分叉对话；搜索不含旧的 Cowork 任务。
- **主动**：Scheduled tasks（所有付费档）：每小时 / 每天 / 每周 / 工作日 / 手动；云端运行，电脑睡眠或 app 关闭也照跑；不能绑定本地文件夹，要用本地文件或 app 的任务只能在桌面 app 开着时跑。管理页可看未来和过去的运行、改指令和节奏、暂停、恢复、删除、立即跑一次。未见 Pulse 式的主动信息流。
- **记忆**：Settings > Memory：边聊边按主题条目保存（不是事后总结），也可直接让它记住；可查看、编辑、删除、导入导出。每个 Project 有独立的记忆空间和项目摘要，不外溢。chat 与云端 Cowork 共用一份记忆；只在本机运行的 Cowork 不用记忆。单次对话可在 + 菜单关掉 Memory；Incognito 对话不进记忆也不被搜索。Free/Pro/Max 默认开，Team/Enterprise 由管理员控制且成员默认关。
- **文件和工作区**：云端 session 的文件存在账号里，各端可见。桌面可连接本地文件夹（Trusted folders），云端任务需要某个本地文件时只取那一个文件的副本，删除 session 时副本一并删除。从本地文件夹创建的 Project 只留在那台电脑。2026-10-06 起 Pro/Max 的新任务一律云端运行，设置里仅在本机运行的选项被移除；要留在本机的改用 Claude Code，但项目和定时任务不随之迁移。
- **排列**：一份对话列表 Recents（快问和长任务混排）、Projects、Scheduled、Code 标签。没有多位具名 agent 的名册。Dispatch 会按任务类型在 Claude Code 或 Cowork 里起 session，各自出现在对应侧栏。
- **手机**：iOS/Android 可发起、指挥、查看任务，接续别的端开的 session，预览文件，用定时任务和项目；本地文件、内置浏览器、电脑操作要经桌面 app 中转且 session 须从桌面发起；有 push。
- **计费**：订阅内的用量上限（不是显式积分），Settings > Usage 查看；长的 agentic 任务消耗更多；可买 usage bundles。
- **被夸的**：HN：有人说身边做知识工作的人几乎都把 Cowork 当成主要工作面，连邮件、日历、Jira、文档；有人用它重整多年的报税表格（https://news.ycombinator.com/item?id=49258764）。合并 chat 与 Cowork 被多人认为对大多数普通用户是好事，因为他们本来就分不清该选哪个（https://news.ycombinator.com/item?id=49729412）。
- **被骂的**：均出自 https://news.ycombinator.com/item?id=49729412：找定时任务及其结果要点很多下，希望直接在项目下看到结果；合并后无法保证只聊天不触发任务；记忆会把不相干的私人信息带进讨论，有人因此彻底关掉记忆，也有人希望代码和聊天的记忆保持分开；额度太紧，有人称最高档用旗舰模型做 agentic 工作二十分钟就用完；手机 app 曾不显示 Cowork 发起的对话；本地虚拟机占磁盘；干活时界面轮播功能提示关不掉。
- **没看到的**：运行界面的具体样子；Skills、Artifacts、Research 各篇正文；定价页；Dispatch 停止向新用户提供的官方理由；Cowork 上线网页和手机的公告（2026-07-07，仅见标题）。

### Gemini（Gemini Spark、scheduled actions、notebooks、Gems→skills）

- **来源**：<https://support.google.com/gemini/answer/16316416?hl=en> <https://support.google.com/gemini/answer/17094507?hl=en> <https://support.google.com/gemini/answer/17094710?hl=en> <https://support.google.com/gemini/answer/17171264?hl=en> <https://support.google.com/gemini/answer/18560919?hl=en> <https://support.google.com/gemini/answer/16972047?hl=en> <https://support.google.com/gemini/?hl=en>
- **时间**：帮助页无更新日期，2026-10-05 打开；Spark 更新记录最新一条 2026-07-17，首发 2026-05-19
- **工作的单位**：两套并存：普通 Gemini chat（含 scheduled actions）和 Gemini Spark。Spark 的单位是 task thread，旁边有 work panel（进度、文件、该任务名下的 schedules）。notebooks（与 Gemini Notebook 同步）充当项目：一条连续的对话，记得来源、指令和讨论。Gems 将从 2026-11 起转为 skills（个人账号），届时自动转换。
- **怎么开始**：网页侧栏切到 Spark，在输入框描述任务，可顺带说时间或事件；输入 / 选 skill；可上传文件、从 Drive 添加、添加 Notebook；输入 set up、get started 或 interview me 让它带你配置首批 skills 和任务。Live 语音里也能建 schedule。普通 chat 里直接说带周期的话即建 scheduled action，Gemini 回一段摘要确认。
- **干活时**：thread 顶部有进度小签，点开是 work panel：Progress 分已完成、当前、计划中的步骤；Files 列出它读过和改过的文件，可点开；Schedules 可就地暂停和恢复。它浏览网页时顶部有远程电脑图标，可看它的浏览器并接管，再交还。Chrome 侧栏点 Stop 只停浏览，它会自己想下一步（可能换远程浏览器、换工具或放弃）；输入框的 Stop 才是彻底取消。文档要求用户经常回来看任务是否在等输入。
- **提问和批准**：首次让它浏览要授权 Chrome 连接 Spark，此后每个涉及浏览的任务都先确认。网站要登录时任务停下等人接管。文档提醒不要把登录和支付信息打进 thread，不要给敏感事务排 schedule，离线时跑的 schedule 你可能来不及阻止。2026-07-13 起需要输入时的通知带更多细节，而且你正看着那条 thread 时不再发手机通知。
- **交付**：结果在 task thread 里；能直接编辑 Docs、Sheets、Slides（含共享文件），用 Canvas 面板改文档。scheduled action 的结果是一条被标成未读的 chat 加一条手机通知。引用怎么呈现未亲见。
- **后续**：在 task thread 里继续说以补充或修改指令。在 scheduled action 那条 chat 里让 Gemini 改动作，改动对以后各次生效；也可在设置里的 Scheduled actions 页编辑、暂停、删除。
- **主动**：(a) chat 的 scheduled actions：同时最多 10 个；内容提前准备（无订阅提前数小时，有订阅在前一小时内），所以官方说不适合股价这类快变数据；长期不活跃会被自动关闭。(b) Spark schedules 三类：按时间（一次、每小时、日、周、月、年）、Gmail 监控（符合过滤器的来信触发）、话题监控（新闻、财经、体育、本地活动），官方说不适合抢票这类分秒必争的事。Schedules 页分进行中、已暂停、已完成，可立即试跑。关闭 Spark 时 schedule 暂停但不删除。
- **记忆**：Spark 用到的信息源包括 Connected Apps、skills、chats、已登录的网站、Personal Intelligence、位置。notebook 的记忆依赖 Keep Activity 开启。远程浏览器会保存登录 cookie、远程电脑会保存代码执行文件供下次用，二者都可在 Spark 设置里一键删除。记忆条目的查看和编辑界面未亲见。
- **文件和工作区**：Drive 和 Workspace 文件；notebooks 的来源；Spark 的远程电脑和远程浏览器；用本机 Chrome 时能进你已登录的所有站点，设备关了则可能改用远程浏览器继续。
- **排列**：侧栏 Spark 下有 Tasks、Schedules、Skills 三页，另有 Trending 推荐任务。没有具名的多个 agent。
- **手机**：Spark 在手机 app、Mac app、网页可用；手机收通知；可从别的设备让 Mac 上的 Gemini app 执行动作。
- **计费**：订阅门槛：Spark 需 Google AI Pro 或 Ultra、18 岁以上、个人账号。用量怎么计、用户看不看得见，未读到。
- **被夸的**：未取得可核对的真实用户原文。
- **被骂的**：未取得可核对的真实用户原文。帮助页自己写明的限制：两套定时并存且互不相同；scheduled action 数据不新鲜、上限 10 个、不活跃自动关闭；监控不适合时效性任务；地区限制（欧洲经济区、英国、瑞士等不可用）。
- **没看到的**：真实用户评价（The Verge 2026-06 的评测只见标题）；额度与计费；界面截图；Deep Research、Canvas、personalization 各页正文。

### Perplexity（Computer / Personal Computer / Automations；旧 Perplexity Tasks）

- **来源**：<https://www.perplexity.ai/help-center/en/articles/13837784-what-is-computer> <https://www.perplexity.ai/help-center/en/articles/20260710-how-to-delete-scheduled-tasks-perplexity-tasks-vs-computer-scheduled-tasks> <https://www.perplexity.ai/help-center/en/articles/11521526-perplexity-tasks> <https://www.perplexity.ai/help-center/en/articles/14659663-what-is-personal-computer> <https://karozieminski.substack.com/p/perplexity-computer-review-examples-guide>
- **时间**：帮助中心：What is Computer 2026-09-29 修改，两类定时任务一文 2026-09-21 修改，其余两页截取部分未见日期；第三方评测 2026-02-26
- **工作的单位**：Computer 里的一次任务会话（背后有子 agent）；Automations 里的定时任务；Ask 是另一种模式（搜索问答）。旧的 Perplexity Tasks（定时搜索、每日摘要、价格提醒）仍留在通知设置里。
- **怎么开始**：首页点 Computer 图标，在 Start a task 里写。定时任务不填表：在 Computer 里用话描述事情和节奏，它提出计划让你确认，并提醒每次运行都耗 credits，批准后出现在 Automations；也可在已有对话里让它把这件事定期跑，或用 Automations 页底部的创建框。桌面 Personal Computer 有全局快捷键唤起的浮动任务条和语音；iPhone 可远程发起。
- **干活时**：界面未亲见。官方描述为后台异步执行、并行搜索、子 agent 分工。credits 用完时进行中的任务暂停而不是取消，有余额后自动继续。
- **提问和批准**：建定时任务要确认。后台任务卡住（指令不清或需要你输入）时通知你而不是猜。连接器掉线或授权过期时下次运行提示重连；同一问题反复失败后可能自动暂停该任务以免继续耗 credits，并通知你。桌面端敏感步骤有设备上的授权；本地模型模式下需要上云的步骤要先经许可。
- **交付**：完整结果存进该任务的 session；有新东西或值得注意时才通知（默认 app 内，另有手机 push 等）。可生成 PDF、Word、PPT、Excel、托管网站，可经已连接的 Gmail 发邮件、发 Slack。
- **后续**：定时任务分两种运行方式，由系统自动选：后台式每次起一个全新的隔离 agent、不带之前的对话上下文，适合监控、简报、提醒；有人值守式带着创建它的那段对话上下文，用于生成文档、操作浏览器、更新网站。一般任务的追问方式未亲见。
- **主动**：Automations 仪表盘分 Active / Paused / Completed，每行有操作菜单（暂停、启用、删除），显示下次运行时间；节奏最密每小时一次；一次性的事不算定时任务，按一次性提醒处理。旧 Perplexity Tasks 要到通知设置里逐个删除，没有批量删除。
- **记忆**：官方称有跨会话、跨平台的持久记忆并自动保存偏好；有 Memory 帮助文章（未读）。
- **文件和工作区**：每人一个隔离的云沙箱；Personal Computer 可连接本机任意文件夹并操控 Mac 上的原生 app（Windows 暂不能控制已安装应用）；放在 Mac mini 上可全天常驻；支持的硬件上可用本地模型，本地模型处理的部分不耗 credits。
- **排列**：左侧栏：Computer（对话，地址为 computer/tasks）、Automations、Customize（连接器）。子 agent 由系统编排；第三方评测称可为子任务选模型以控制花费。
- **手机**：Computer 在网页、iOS、Android 可用；iPhone 可给家里的 Mac 派活，Mac 照常干。
- **计费**：credits：Max 每月 10,000；消费级 Pro 不含月度 credits；可开自动补充（余额低于阈值自动购买）并设每月消费上限；账户用量页可查；普通搜索不限量、不耗 credits。
- **被夸的**：一位内容创作者的评测：一晚上做出两个与自家品牌规范一致的小工具，认为单一入口加多模型编排省事（https://karozieminski.substack.com/p/perplexity-computer-review-examples-guide ，2026-02-26，带明显推荐口吻）。
- **被骂的**：未取得可核对的 2026 年用户抱怨原文。官方文档本身显示两套定时任务并存、管理入口不同、旧任务只能逐个删。
- **没看到的**：运行界面；Spaces；Comet 浏览器现状；Memory 页；credits 单价与消耗速度；独立的用户评价。

### Genspark（Super Agent、Workflows、Genspark Claw）

- **来源**：<https://www.genspark.ai/helpcenter> <https://www.genspark.ai/helpcenter/genspark-claw> <https://www.genspark.ai/helpcenter/workflows> <https://www.genspark.ai/helpcenter/credits-guide>
- **时间**：帮助中心页无日期，2026-10-05 打开
- **工作的单位**：Super Agent 的会话，归在 project 下，一个 project 里可并行多个任务并互相利用结果；Workflow（触发器加步骤的自动化）；Genspark Claw（官方称第一位 AI 员工：一个常驻的个人助手，跑在专属云电脑或你的本机）；Skill（把一次做法存成可复用技能）。
- **怎么开始**：首页中央输入框或侧栏 New 里选 Super Agent。Workflow：新建或选模板，在左侧聊天框用话描述，AI 搭好触发器和步骤，先用模拟数据试跑（不触发真实动作），再开启。Claw：选云电脑档位后打开，或在桌面 app 左栏选本机并先选工作文件夹；也可在 WhatsApp、Slack、Teams、Telegram、LINE、Discord、飞书等里对它说。
- **干活时**：新版 Super Agent 有专属沙箱（真浏览器、自己的文件系统），官方说法是开始后可以合上电脑，回来看成品。界面细节未亲见。
- **提问和批准**：Workflow 的运行记录里，步骤可以停在待确认状态，用户在记录里审阅并处理。Claw 本机模式下选定的工作文件夹只是软性引导而非硬边界，任务需要时仍可能访问别处（官方说明）。
- **交付**：聊天里的文件卡即交付物，随 project 保存、可下载。Workflow 选中后中栏是运行历史（状态、触发时间、时长），点一条在右栏看完整结果。
- **后续**：会话期间工作区文件保留，可跨多条消息继续；说一句把这个流程存成技能即可复用并分享给团队。
- **主动**：Workflows 两种触发：定时（日、周、月、自定义间隔如每 30 分钟，可设结束日期和时区）和来信（Gmail、Outlook）。Claw 有 Schedules、Heartbeat 签到、后台监控；每次定时运行和每次 Heartbeat 都耗 credits。
- **记忆**：Claw 宣称跨会话、跨渠道记住偏好；另有 SecondBrain（未读）。记忆的查看和编辑界面未亲见。
- **文件和工作区**：会话工作区；AI Drive；Claw 的云电脑（固定 IP、网页远程桌面、终端、Files 页签）或本机文件夹；Claw 有专属邮箱地址和允许发件人名单。
- **排列**：侧栏按功能排列（Super Agent、Slides、Sheets、Docs、Claw、Workflows、GenTeam 等）。Claw 的页签：Home / Channels / Services / Schedules / Heartbeat / Terminal / Files。
- **手机**：未亲见；Claw 主要通过聊天软件触达。
- **计费**：credits，全账号共用，Claw 没有单独钱包；云电脑另收固定月费（三档），闲置不耗 credits，本机模式不收这笔。官方的省钱提示透露了扣费方式：重新生成和失败重试每次照价扣；长对话每条消息都重算全部上下文。
- **被夸的**：未取得可核对的真实用户原文。
- **被骂的**：未取得可核对的真实用户原文。
- **没看到的**：价格数字、手机端、用户评价、GenTeam / SecondBrain / AI Pods / Skills 正文。

### 腾讯 WorkBuddy（桌面工作台、助理、自动化）

- **来源**：<https://www.workbuddy.cn/docs/workbuddy/Overview> <https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Automation-Guide> <https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Assistant> <https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Memory> <https://www.workbuddy.cn/docs/workbuddy/Conversation> <https://www.workbuddy.cn/docs/workbuddy/Results> <https://www.workbuddy.cn/docs/workbuddy/Credits> <https://www.workbuddy.cn/docs/workbuddy/Changelog> <https://www.v2ex.com/t/1244641> <https://www.v2ex.com/t/1199144> <https://www.v2ex.com/t/1244897>
- **时间**：文档各页 2026-07-01 至 2026-09-28；更新日志到 5.6.2（2026-09-21）；V2EX 2026-03 至 2026-09
- **工作的单位**：任务：一次对话加一个工作空间目录，侧栏按文件夹分组。另有项目。助理（远程任务，文档里也叫 Claw）是另一种单位：只有一个会话，所有远程指令都进这一条，用固定的专属文件夹，历史完整保留且不能清空。自动化（定时任务）有独立页面。专家、技能、连接器、资料库是可挂上去的能力。
- **怎么开始**：新建任务栏里选工作模式、写需求、补上下文。手机上在微信、企业微信、QQ、钉钉、飞书里给助理发一条消息，电脑上的 WorkBuddy 执行，结果回到手机。自动化页点添加，或用模板（新闻推送、周报等）。macOS 可从微信的分享菜单把内容转进来。
- **干活时**：中间对话区看回复、结果和中间步骤。执行中可以继续发消息：消息先进输入框上方的队列，每条可编辑、删除、拖动排序；点发送可以立刻引导当前会话，但不打断正在进行的输出；本轮结束后队列按顺序交给模型。右侧结果区四类：概览（工作空间文件）、浏览器（可多页签）、变更、产物。
- **提问和批准**：权限模式两档：默认权限和完全访问。助理通道下，文件删除、系统配置修改、批准命令执行这类高风险操作要确认后才执行，并对每条远程指令做来源校验。更新日志提到对话里有问答卡片。
- **交付**：产物（Word、Markdown、PDF、Excel、CSV、PPT、报告）在右侧产物里预览；可分享，可上传到云端网盘、腾讯文档、ima 知识库、乐享。网页类产物在内置浏览器里看。任务可生成公开分享链接。自动化的结果存到指定目录，可推送到 WorkBuddy 小程序或企业微信机器人。
- **后续**：在同一任务里追问，基于之前的上下文继续。可在回复里选中一段文字添加到对话，生成引用并附批注，再让它改。顶部有对话内搜索和历史提问跳转。
- **主动**：自动化：配置（名称、提示词、工作空间、权限模式、模型和技能、定时规则、推送开关）保存在本地客户端，到点以当前登录身份发起一次 Agent 任务；一条规则可表达每周多天或每月多天；默认落在自动分配的 automation 工作空间。通过助理会话创建的自动化不绑定助理的工作空间；推送到企业微信时结果只作为通知发送，不写入助理上下文，助理不知道这次任务做了什么。通知失败不阻塞任务。有历史执行记录。
- **记忆**：每晚整理当天会话，生成记忆摘要（事实、偏好、人物关系、近期跟进事项），注入系统提示词。在设置的记忆页可查看；编辑方式是唤起对话框告诉它该记住或忘记什么；可清空，可一键关闭；可从其他 AI 导入。记忆提取不耗积分。
- **文件和工作区**：每个任务一个本地工作空间目录；独立文件浏览器；资料库；腾讯文档、ima、乐享知识库；云端任务也有产物栏。
- **排列**：左侧栏：任务列表（按文件夹分组、可搜索、按状态筛选）、助理、项目、自动化、专家、技能、连接器、资料库、灵感、我的邮箱等。支持多任务并行。
- **手机**：三种形态：聊天软件里的机器人（助理）、WorkBuddy 小程序（收自动化推送）、WorkBuddy 移动端 app（能看到并管理已登录的电脑）。用助理时电脑必须开机并运行 WorkBuddy。
- **计费**：积分，按模型 token 单价和任务复杂度扣；月度积分当月有效不结转，先用最先到期的；有加量包；有用量页。自动化文档单独提醒简单提醒类耗得少，巡检、汇总类可能耗很多。
- **被夸的**：V2EX：积分给得多，可以免费用很久（https://www.v2ex.com/t/1199144）。
- **被骂的**：V2EX 付费用户：界面入口太难找，希望简化；三台电脑登录同一账号，手机端只显示两台；还追问不续费改用本地模型后是否仍耗积分、手机端还能不能管设备（https://www.v2ex.com/t/1244641）。另一帖：国内这类产品包装得商业化，诱导充值积分，不如原生 OpenClaw（https://www.v2ex.com/t/1199144）。官方更新日志自己列出的已修故障：定时任务的企业微信通知延迟或漏发、没有运行记录却反复执行、自动化卡死不触发、休眠期间调度不准、任务结束后仍显示处理中（https://www.workbuddy.cn/docs/workbuddy/Changelog）。
- **没看到的**：知乎上关于 WorkBuddy 好不好用的问答被验证墙挡住，未读；定价金额；移动端 app 文档正文；项目、多人多 Agent 协作正文；上线日期只见搜索摘要。

### Kimi（Kimi Work 桌面端、Kimi Claw）

- **来源**：<https://www.kimi.ai/zh-hans/products/download> <https://www.kimi.ai/zh-hans/products/kimi-work> <https://www.kimi.ai/zh-hans/help> <https://www.kimi.ai/zh-hans/help/kimi-work/overview> <https://www.kimi.ai/zh-hans/help/kimi-work/goal-mode> <https://www.kimi.ai/zh-hans/help/kimi-work/dashboard> <https://www.kimi.ai/zh-hans/help/kimi-claw/overview> <https://www.kimi.ai/zh-hans/help/kimi-claw/memory-loss> <https://www.kimi.ai/zh-hans/help/kimi-claw/conversation-limits> <https://www.kimi.ai/zh-hans/help/membership/update-rules> <https://www.v2ex.com/t/1231272> <https://www.v2ex.com/t/1231264>
- **时间**：帮助中心页无显式日期，2026-10-05 打开；Kimi Work 发布日志最新 3.2.15（2026-09-30）；Work 于 2026-06-03 上线，仍标 Beta；V2EX 2026-07-31
- **工作的单位**：桌面客户端分 Chat 和 Work 两种模式，Work 里以任务为单位。另有项目、定时任务、看板（装小组件的持久视图，不依附于某次对话）、目标（围绕一个目标连续工作，最长 24 小时）。Kimi Claw 是另一条线：一只有名字、人设和长期记忆的常驻助手，实质是托管的 OpenClaw 实例。
- **怎么开始**：Work 侧栏新建任务；输入 / 用技能，输入 @ 加上下文；点 + 选目标进入目标模式；可在单 Agent 和 Agent 集群（最多 300 个子 Agent）之间切换。Claw：在 kimi.com/bot 点创建，等几分钟自动配置，起名、设人设，再接上 Telegram 等聊天渠道。
- **干活时**：目标模式的说法是过程透明、可随时中断循环，手动调整当前状态或补一句指令后继续。右侧视窗可打开文件预览和看板。具体步骤怎么呈现未亲见。
- **提问和批准**：权限全局三档：默认（常规操作自动做，修改或覆盖本地文件、运行代码前请求授权）、手动允许（每次操作前问）、全部（不问）。
- **交付**：文档、表格、PPT、PDF 等文件；小组件（会话里即时生成的可交互页面，可接本地数据或插件持续更新），可固定到看板，也可固定成电脑桌面上的独立小窗。
- **后续**：看板上可对小组件做位置批注（最多 10 条）来记录修改意见；动态小组件绑定一个小组件任务，可开关并查看最近 10 次运行。Claw 里用 /new、/compact、/reset 处理上下文过长。
- **主动**：Work 内置 Cron：可调 LLM Agent、Python 或 Shell，按天、按小时或按条件触发；在本机运行，夜里要跑得在设置里开保持电脑唤醒。Claw 在云端全天在线。结果往哪里推送未亲见。
- **记忆**：Claw：每天凌晨 4 点自动重置会话上下文，没被明确要求记下的内容会丢；已保存的记忆在工作空间的 AGENTS.md 的 MEMORY 段可看，/memory 命令可管理；会员到期后云端实例保留 7 天，逾期数据永久删除，导出备份功能还在开发。Kimi 主产品另有记忆空间（只见帮助分类描述）。
- **文件和工作区**：Work 挂载本地文件夹；项目；Claw 的云端工作空间；WebBridge 浏览器扩展操作用户自己的浏览器；预置 A 股和港股数据源。
- **排列**：Work 侧栏：新建任务、看板、插件、技能、定时任务、WebBridge、项目、对话。每个用户最多 2 个看板，每个看板最多 20 个小组件。Claw 有群聊（正文未读）。
- **手机**：有手机 app 和 Kimi Claw Android（仅见标题）；手机遥控桌面 Work 未亲见。
- **计费**：会员额度：一个共享额度池，Agent、深度研究、PPT、Kimi Code、Work、Claw 共用，按 token 扣，以百分比感知；按订阅周年日每月刷新，不结转；Kimi Code 另有 5 小时和每周的速率限制；有加油包；任务因系统问题失败可点踩申请退还额度。
- **被夸的**：V2EX：有人买了包年觉得还行；有人说会员附带的命令行工具比较稳（https://www.v2ex.com/t/1231264）。
- **被骂的**：V2EX：额度规则要读两篇帮助文档才看懂，套餐标的倍数只是限速窗口内的倍数，总量仍看共享额度（https://www.v2ex.com/t/1231272）；频繁遇到限流错误，有额度也用不上，有人因此退订改回 Claude，有人说每做一个需求都会卡一下（https://www.v2ex.com/t/1231264）。这些主要针对 API 和 Kimi Code，针对 Kimi Work 本身的用户长评未取得。
- **没看到的**：Work 的运行界面、定时任务管理页、项目与记忆空间正文、Claw 群聊正文、价格、针对 Work 的用户评价。

### 扣子 Coze 3.0（原扣子空间）

- **来源**：<https://docs.coze.cn/> <https://docs.coze.cn/llms.txt> <https://docs.coze.cn/cozespace_job.md> <https://docs.coze.cn/cozespace_memory.md> <https://docs.coze.cn/cozespace_coze_app_faq.md> <https://docs.coze.cn/cozespace_agent_overview.md> <https://docs.coze.cn/cozespace_coze_billing_overview.md> <https://docs.coze.cn/cozespace_session.md> <https://www.v2ex.com/t/1243262> <https://www.v2ex.com/t/1199144>
- **时间**：站点地图显示这些页最后修改于 2026-09-08（项目页 2026-09-10）；3.0 发布于 2026-05-29；V2EX 2026-09-20
- **工作的单位**：Agent 加与它的对话：可建多个 Agent，各有独立能力、人设、长期记忆。项目：独立上下文，可拉人类成员和多个 Agent，用 @ 派活，消息、文件、产物留在项目里。日程：Agent 的工作计划表。Agent 分三类：扣子 Agent（原生，带日程、邮箱、文件、渠道、云手机、云电脑、后台任务）、三方精选 Agent（在扣子云电脑里跑 OpenClaw、Claude Code、Codex CLI、Hermes）、本地 Agent（接入你电脑上已在跑的这些框架）。
- **怎么开始**：网页、桌面、App 的对话框里直接说，官方建议的格式是动作加对象加要求，可 @PPT、@云手机 等；绑定飞书渠道后在飞书里发消息；项目里 @ 某个 Agent；用职业模板（投资理财顾问、数据分析等）新建专家 Agent。
- **干活时**：对话区右侧可出现 Panel：设计画布、数据看板、表格、音视频时间线等，人可以直接看、选、改，这些操作会成为 Agent 接着干的上下文，对话继续时 Panel 保留。不在电脑旁时可从别的设备看任务进度。步骤怎么呈现未亲见。
- **提问和批准**：建日程时信息不足，Agent 会先向你确认。项目里 Agent 可以 @ 人类成员请求补充信息或确认结果；但不能 @ 别的 Agent，也不能给别的 Agent 派活，目前只有人能 @Agent。本地文件授权的细节未读。
- **交付**：产物留在对话或项目里。日程执行完把结果推送给你，并在日历上标为已完成。扣子 Agent 有自己的邮箱，可代发邮件。
- **后续**：在同一对话或项目里继续；多个 Agent 可基于已有结果接力，但每一棒由人 @ 触发。
- **主动**：日程两类：Heartbeat 检查（按 HEARTBEAT.md 周期性醒来批量检查，例如每半小时看有没有紧急邮件）和定时任务（准点执行）。在对话里说一句，Agent 就给自己建好日程；也可在日程卡片上点加号。有时间线/日历视图，用颜色区分待执行、执行中、已完成、已暂停、执行失败，循环任务按频率归类。官方建议怕日程消息扰乱主对话就建一个项目，让 Agent 只在那个项目里定期汇报。2.5 版把原来的长期计划改成了日程。只有扣子 Agent 能在线看日程。
- **记忆**：文件化的记忆，用户能在文件目录里看到：SOUL.md（角色、语气、边界）、USER.md（主人画像）、MEMORY.md（长期事实与偏好、阶段结论与待办）、TOOLS.md、CONTACT.md（群里谁是谁）、SECRET.md（授权给它的敏感信息）。自动提取加定期整理，也可口头要求记录。各渠道的对话相互独立，但记忆共享；拉进群聊后不向他人泄露私聊内容。本地 Agent 的记忆文件留在本机。
- **文件和工作区**：每个 Agent 的文件；每个用户一个云盘，项目和 Agent 可共用同一批资料；云电脑、云手机；桌面端可授权处理本地文件；项目有自己的文件和资产。
- **排列**：官方的说法是组建一支 AI 团队：统一入口把三类 Agent 汇到一起管理和调用；项目里多个人加多个 Agent。侧栏的具体排列未亲见。
- **手机**：App 可发起任务、看进度、继续对话、调度 Agent，并能遥控处理个人电脑里的文件；App 还有会议旁听（用手机麦克风实时转写、会后出纪要和待办）。
- **计费**：积分：个人进阶 39.9 元 3 万、高阶 99 元 9.9 万、旗舰 199 元 19.9 万、尊享 999 元 99.9 万，团队版 198 元起。与 Agent 的每次互动、日程（含 Heartbeat）、云手机和云电脑按规格与在线时长都扣。
- **被夸的**：V2EX：它的一键部署版 OpenClaw 给小白封装了不少有用的东西，例如可视化浏览器（https://www.v2ex.com/t/1199144）。
- **被骂的**：V2EX 付费用户：积分扣得一点不含糊，新模型迟迟不上，反馈没人回，想退款（https://www.v2ex.com/t/1243262）。官方日程文档自己写明：日程和 Heartbeat 也耗积分，所以用户可能觉得没对话没任务积分却在少，建议去日程页暂停（https://docs.coze.cn/cozespace_job）。
- **没看到的**：实际界面；项目页正文；云电脑和云手机的计费细则；本地授权流程；针对 3.0 的用户长评。

### MiniMax Code（MiniMax Agent 桌面端）

- **来源**：<https://agent.minimaxi.com/docs/llms.txt> <https://agent.minimaxi.com/docs/code/automation/schedules.md> <https://agent.minimaxi.com/docs/code/agents/custom-agents.md> <https://agent.minimaxi.com/docs/code/automation/remote-control.md> <https://agent.minimaxi.com/docs/code/agents/memory.md> <https://agent.minimaxi.com/docs/code/account/usage.md> <https://agent.minimaxi.com/docs/code/workflows/tasks.md> <https://agent.minimaxi.com/docs/changelog.md> <https://www.v2ex.com/t/1225385>
- **时间**：更新日志最新 v3.1.0（2026-09-30）；文档首页元数据日期 2026-10-02；V2EX 2026-07-06
- **工作的单位**：每次对话形成一个任务记录；有 Coding 和 Work 两种模式；工作区即本地项目目录。自定义 Agent：在侧栏 Agent Team 区域创建，有名称和头像、描述、行为指令、默认模型、默认工作目录、绑定的聊天渠道，每个都有独立的对话入口，用来让固定角色长期处理同一类事。另有定时任务、Goal、Mini App。
- **怎么开始**：首页写目标、选工作区、发送，并选在本机还是云端跑；从侧栏或配置页进入某位自定义 Agent 的独立会话；全局快捷键和快捷小窗；在微信、飞书、Telegram、Lark 里说。
- **干活时**：文件、变更、终端三个面板看执行过程；右侧内置浏览器；有 Agent 实时执行动态。手机 Remote Control 可看桌面任务进度、发补充指令、处理权限确认、看产物和部分文件。
- **提问和批准**：有权限与安全确认机制（文件、命令、外部操作；正文未读），确认可在手机上处理。把本地任务交接到云端前，系统整理上下文并推荐要上传的文件和文件夹，用户逐项确认或取消。云端产物涉及本地项目文件时，先检查变更再决定是否写回本地工作区。
- **交付**：定时任务的结果回到对应的会话里展示；云端产物在桌面端查看和下载。
- **后续**：在已有对话里继续；可直接引用、评论、评价 Agent 的回复；本地任务可整体交给云端 Agent 接着做。
- **主动**：定时任务：填名称、指令、执行的 Agent、执行时间、会话模式，可手动立即执行一次。依赖桌面端运行，电脑休眠或应用没开时可能不按时。
- **记忆**：设置的个性化页有记忆和主动记忆两个开关；记忆摘要可直接编辑保存或删除，也可新开一个任务让 Agent 帮忙改记忆文件；/memory 可按会话设置是否使用已有记忆（开始前定，开始后不能改）和是否参与以后的记忆生成。记忆管理的是这台电脑上的记忆。
- **文件和工作区**：本地工作区目录；云端会话和云端项目；每位自定义 Agent 有默认工作目录。
- **排列**：左侧边栏：新建任务、搜索、置顶的任务和 Agent、按项目分组的历史任务、Agent Team、定时任务入口、已归档；会话列表可切换看本地或云端。
- **手机**：Remote Control：手机连接正在运行的桌面端；另可经聊天软件。
- **计费**：M Plan 订阅（2026-09-30 上线，承接原 Token Plan）加积分；用量页看套餐状态、有效期、积分余额、额度；每日签到领 400 积分，连签加码，签到积分 30 天有效。
- **被夸的**：HN：有人说不在电脑旁时在 iPad 上用 Manus 和 MiniMax agent 做电脑操作很好用（https://news.ycombinator.com/item?id=49258764）。
- **被骂的**：V2EX：一位年付用户说它很难用，不如用命令行工具接它家模型（https://www.v2ex.com/t/1225385 ，零回复）。
- **没看到的**：界面；权限页、Agent Team、Goal、IM 连接各页正文；针对 3.1 的用户评价。

### 千问（千问 App 的定时任务 / 办公助理；千问办公）

- **来源**：<https://www.ithome.com/0/986/849.htm> <https://www.aigc.bar/AI%E8%B5%84%E8%AE%AF%E6%96%87%E7%AB%A0/2026/07/27/qwen-work-ai-agent-hands-on-review>
- **时间**：IT之家 2026-08-07；AIGC.BAR 2026-07-27（第三方介绍，口吻偏宣传）。官方帮助文档未打开。
- **工作的单位**：App 里是对话加定时任务加办公助理（任务型）；千问办公是独立的桌面客户端产品（Windows、Mac），可从钉钉左侧导航唤起。更细的单位划分未亲见。
- **怎么开始**：App 内发需求；预设执行时间建定时任务；@ 智能体广场里的服务或进入对应智能体；手机端发起、由电脑端执行（IT之家报道）。
- **干活时**：未亲见。
- **提问和批准**：未亲见。第三方文章提到千问办公支持 Hook 配置，可拦截危险的系统指令。
- **交付**：报道称直接输出可用的 Office 文档、应用、网站；定时任务以定时推送的形式交回。
- **后续**：未亲见。
- **主动**：定时任务：预设执行时间，自动完成行业简报、邮件分类汇总等，用户打开推送看结果（IT之家）。千问办公：云端定时任务（Cron），如每天早上推送未来三天待办、工作日晚上推送日报（AIGC.BAR）。
- **记忆**：未亲见。
- **文件和工作区**：办公助理可连接备忘录、日历、邮件，可操作电脑和浏览器；千问办公有云盘额度并与钉钉双向打通（会议纪要归档、周报、企业数据查询）。
- **排列**：智能体广场（生活服务类智能体）；千问办公有连接器、技能、专家套件（投研分析、企业法务、财税等）。
- **手机**：手机与 PC 跨端协同：手机发起，电脑执行。
- **计费**：千问办公按积分：免费版注册送 2000 积分、每日登录送 100，并有排队任务额度（AIGC.BAR）；App 侧计费未亲见。
- **被夸的**：未取得真实用户原文。
- **被骂的**：未取得真实用户原文。
- **没看到的**：除两篇报道外的一切细节：界面、批准方式、记忆、追问、价格全表、用户评价。夸克未查。

### 豆包（任务模式 / 专业版办公任务）

- **来源**：<https://www.aivsly.com/article/doubao-task-mode-agent-review-june-2026.html> <https://www.36kr.com/p/3867006268750725>
- **时间**：AiVsly 评测 2026-06-14；36氪转载的实测 2026-06-24。官方帮助文档未打开。
- **工作的单位**：任务（办公任务模式下的一次交办），区别于普通对话的单步问答；可设为定时执行。
- **怎么开始**：在豆包里切到任务模式或办公任务模式后描述需求；可设定触发时间。搜索摘要里提到网页版底部有办公任务入口、可新建自定义任务并设周期和输出格式，这部分未打开原文。
- **干活时**：未亲见界面。36氪实测者提到做工具时界面出得很快；评测称长任务偶尔中断，需要用户手动恢复。
- **提问和批准**：未亲见。
- **交付**：文件成品（Word、Excel、PPT、图表）；生成的小应用嵌在另一个平台的内嵌页里运行（实测中因此屏幕录制接口失效）。
- **后续**：未亲见。
- **主动**：任务模式支持定时执行（每天、每周、每月某时自动跑）。
- **记忆**：未亲见。
- **文件和工作区**：专业版宣称能操作本地电脑、调用浏览器、文档、表格，并可自建 Skill。
- **排列**：未亲见。
- **手机**：未亲见。
- **计费**：2026-06-13 任务模式上线时对所有用户免费；2026-06-24 推出专业版，三档 68 / 200 / 500 元，免费用户在一定额度内体验较低档模型的办公任务。
- **被夸的**：36氪实测者认可它打开就能试、不需要海外账号和支付方式，产品细节（自建 Skill、截图提问、屏幕共享、实时字幕）贴近上班族；浏览器里抓已登录网站的评论这一项顺利完成。AiVsly 称任务拆解准、文件排版好。
- **被骂的**：36氪实测：四个办公任务三个没做成——清理磁盘越清越少；接管不了本机的飞书客户端，浏览器里的飞书页面也读不稳，反复建议走接口；生成的录屏工具因运行环境限制用不了，绕行又卡在授权；结论是还没到值得付费的时候（https://www.36kr.com/p/3867006268750725）。
- **没看到的**：官方文档与界面；定时任务的管理和推送形态；记忆；手机端；额度细则。腾讯元宝未查到可打开的资料。

### Flowith / Lovart（画布型，仅浅查）

- **来源**：<https://flowith.io/blog> <https://flowith.io/blog/meet-agent-neo> <https://www.lovart.ai/pricing>
- **时间**：Flowith 博客文章 2026-01-15 发布、2026-03-19 修改，文内注明 2026-08-01 核对；Lovart 定价页无日期，2026-10-05 打开
- **工作的单位**：一张画布：Flowith 称为 Flow 的可视工作面，分支并排可见；Lovart 是设计画布加设计 agent。
- **怎么开始**：未亲见（需登录）。
- **干活时**：未亲见。
- **提问和批准**：未亲见。
- **交付**：画布上的节点和素材；Flowith 另有 Knowledge Garden、Knowledge Market、Media History 三个入口。
- **后续**：Flowith 官方博客的说法：画布适合需要保留分支的工作（比较多个模型的输出、保留备选稿、回到之前的决定），不适合单步的小转换和必须严格按固定流程走的任务。
- **主动**：未见。
- **记忆**：Flowith 的 Knowledge Garden（细节未亲见）。
- **文件和工作区**：画布本身即工作区。
- **排列**：未亲见。
- **手机**：Lovart 定价页的并发限制提到桌面网页最多 2 个、手机网页 1 个同时跑任务。
- **计费**：Lovart：积分，按所选工具或模型、尺寸、质量扣；订阅积分每周期清零不结转，另购积分包有效期更长；部分套餐含不限量的慢速排队生成，与耗积分的快速生成分开。Flowith 定价未读。
- **被夸的**：未取得。
- **被骂的**：未取得。Flowith 官方博客自己提醒：旧文章里关于无限步数、无限上下文的说法不能当作现行规格。
- **没看到的**：两者的实际交互流程、用户评价、Flowith 定价。

## 没查到的，来源说明

- ChatGPT agent 模式的去向：2026-06-04 的 release note 仍提到它，之后的文档只讲 Work，没有看到明确的合并或退役公告。
- ChatGPT dot 的笔记用户能否直接查看和编辑、一个账号能否有多个 dot、首月之后怎么计费——文档都没写。
- 各家任务运行时的真实界面（步骤怎么列、提问卡长什么样、出处怎么标）：本次只读文档和评测，没有登录任何产品，凡涉及界面细节的描述都来自官方文字，不是亲眼所见。
- 定时和主动推送到底有多少人在用：没有找到任何一家的使用率数据；手里只有零散的用户说法（因耗额度而不建、嫌入口深、Pulse 无人说好）和厂商的侧面动作（自动暂停不活跃任务、下线 Pulse）。
- Gemini Spark、Perplexity Computer、Genspark 的真实用户评价没有取得可核对的原文；Gemini 的计量方式未读到。
- 腾讯元宝、夸克没有查到可打开的资料；千问、豆包只读到新闻和第三方评测，官方帮助文档未开。
- 知乎因验证墙打不开，国内用户评价主要来自 V2EX，样本偏开发者，金融从业者和技术管理者的声音基本没有覆盖到。
- Manus Cue 的实际形态（一位 agent 一条线还是频道式群聊、记忆如何呈现）只有帮助中心的几段话，且需邀请码。
- Manus 本地命令批准的现行规则：docs 与帮助中心两处说法不同，无法判断哪个是现状。
- Claude 停止向新用户提供 Dispatch 的原因、OpenAI 下线 Pulse 的使用数据，官方都没有给。
- Comet 浏览器、Perplexity Spaces、Claude Skills 与 Artifacts、ChatGPT deep research 的现行交互没有读到正文。
- 积分和额度的实际消耗速度（一份报告、一次定时运行各耗多少）：除 Kimi 给了免费档的百分比参考、Perplexity 给了 Max 的月度总量外，其余都没有可核对的数字。
- 过程说明：浏览器标签页上限在大部分时间里被占满，Bing 搜索多数改用命令行抓取同一地址完成，最后阶段才用上浏览器（用完已关闭自己的标签页）；临时脚本和网页缓存放在会话的 scratchpad 里。期间另一个并行代理覆盖了共享目录里同名的抓取脚本，导致两份网页缓存被写进项目根目录，已当即移到 scratchpad，项目目录的 git 状态与开始时一致。
