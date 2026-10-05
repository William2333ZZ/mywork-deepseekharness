# 交互形式调查：对话之外的形式

原始记录（2026-10-05）。每条说法以所附网址的原文为准。

## 形式

### 多条对话加项目夹（聊天产品的基线）

- **骨架**：单位：一次对话。开始：新建对话，打一句话。过程：等回复，其间能做的事很少。交付：回复正文，文件夹在消息里或旁边的面板里。后续：在原对话里接着说，说久了另开一条。排列：侧栏按时间排的对话列表，上面叠一层项目夹（共用文件、指令、记忆）。放在中心的是最近这一句和它的回复；被挤到边上的是状态（哪些做完、哪些没完）、以前的结果、产出的文件。厂商近一年的补法都是往边上加东西：置顶、分支、标题和文件搜索、文件库、项目记忆、记忆来源、自动压缩。
- **例子**：ChatGPT（Chat、Projects）、Claude 的旧 chat、Gemini 和豆包（后两者只见用户帖，未亲见）。
- **适合**：即时问答、一次性的小活、边想边聊。Julian Lehr 的文章（2025-03-27）把这种用法称为思考过程，认为对话界面适合做已有界面的补充而不是替代，理由是自然语言输入慢（他给的数字是说话约 150 词每分钟、桌面打字约 60、手机打字约 36）。
- **在哪里坏**：一、对话变长后质量下降。Laban 等人（2025-05）用 20 多万次模拟对话比较，同样的任务拆成多轮后各家模型平均下降 39%，原因是模型早早做了假设、急于给最终答案，走偏后回不来（https://export.arxiv.org/abs/2505.06120）；Chroma 的报告（2025-07-14）在 18 个模型上只改变输入长度，表现随长度变得不稳（https://research.trychroma.com/context-rot）。用户的说法：一个窗口喂了资料用两三天后答非所问（https://www.v2ex.com/t/1181025）。二、找不到以前的结果。NN/g 的可用性研究（8 人，每场 90 分钟，2023 年发表、2025-09 更新）记录到用户为了引用之前某段回复只能上滚、复制或重述，称为 apple picking（https://www.nngroup.com/articles/accordion-editing-apple-picking/）；V2EX 用户至今在抱怨同一件事（https://www.v2ex.com/t/1183974）。三、长对话本身变卡，用户被迫每天重开并手工带摘要（https://community.openai.com/t/chatgpt-typing-lag-in-long-chats-needs-virtual-scroll-like-yesterday/1273495）。四、看不出进度。HN 用户说跨多天、带工件的工作在聊天里无法跟踪（https://news.ycombinator.com/item?id=49736108）；V2EX 长帖（2026-01-27）说长期工作需要的是稳定的状态，知道哪些完成、哪些进行中、下一步是什么，而文件能把状态固定下来（https://www.v2ex.com/t/1188747）。五、压缩是有损的：Claude Code 压缩后忘掉项目规定（https://github.com/anthropics/claude-code/issues/6354）。六、项目记忆不可见：ChatGPT 帮助页明说项目记忆没有清单可看（https://web.archive.org/web/20261003080200/https://help.openai.com/en/articles/10169521-projects-in-chatgpt）。

### 一条永续对话的常驻智能体

- **骨架**：单位：一位有名字的智能体，只有一条不重置的对话。开始：直接对它说。过程：它判断活的类型，在背后开出单独的 session 或子智能体去做，主对话保持可用。交付：结果以消息回到这条对话，文件挂在消息上或落到文件夹。后续：同一条对话里接着说。主动：定时、心跳或自己决定何时醒来。记忆：对话之外另有笔记或文件。放在中心的是这位智能体和与它的关系（连续性、不必重述背景）；被挤到边上的是一件件具体的事各自的边界、状态和历史。三家的差别在于边上补了什么：Claude Dispatch 几乎没补，只有一条线程；OpenClaw 补了 Threads、Groups、Coding 三个侧栏分区和 /new；OpenAI dots 补了 Activity（每件任务一条可见线程，可单独打开和下指令）、Outputs、Scheduled 三个面板，并让任务拥有自己的对话。
- **例子**：Claude Dispatch、OpenClaw 的 main session、OpenAI dots；MyWork 现行设计第 9 节属于这一类。
- **适合**：从手机派活、回到电脑接着聊；需要它记得你是谁、在做什么的长期协作；总管式的汇报（dots 帖里的用户概括：不用自己管多条对话，它来汇报其他对话的进展，https://news.ycombinator.com/item?id=49907003）。
- **在哪里坏**：一、几件事混在一条线里。Dispatch 的帮助页把不能新开线程、不能管理多条线程列为当前限制，并已不向新用户开放（https://support.claude.com/en/articles/13947068-assign-tasks-from-anywhere-in-claude-cowork）；OpenClaw 用户要求会话选择器来分话题、找旧线程（https://github.com/openclaw/openclaw/issues/29563），Telegram 多话题共用记忆互相干扰（https://www.v2ex.com/t/1197694）。二、对话无限增长只能靠压缩或重置，两者都伤连续性：压缩后失忆（https://www.v2ex.com/t/1232955），每日重置加压缩后看不到最近的原始消息（https://github.com/openclaw/openclaw/issues/58818），session 文件失控导致此后全部静默失败（https://github.com/openclaw/openclaw/issues/2254）。三、常驻意味着持续花钱，空醒也计费（https://news.ycombinator.com/item?id=49899355）。四、信任包装：有用户反感把会动你文件的东西做成可爱宠物（https://news.ycombinator.com/item?id=49908480）。dots 的文档自己提醒运行完成不代表结果达成，要用户核对。

### 任务或会话列表（每件事一条带状态的线程）

- **骨架**：单位：一件任务，一条自己的对话加自己的工作区（分支、虚拟机或文件夹）。开始：在输入框描述结果，或从 Slack、issue、定时触发。过程：实时日志或对话流，可插话纠偏，可接管它的浏览器或远程桌面；跑在云端时可以走开。提问和批准：它停下来问，或在有后果的动作前暂停等批准，手机推送。交付：一份可验收的东西（PR 附视频截图、文件、文档），不是一段话。后续：在这条线程里要求修改。排列：侧栏或专门窗口里的列表，按最近、可筛选、可置顶，手机上称 inbox。放在中心的是一件件有始有终的事和它们的状态；被挤到边上的是跨任务的连续性（靠记忆、项目、知识库补）和随口一问（靠并排的 Chat 模式或合并成一个输入框来补）。
- **例子**：ChatGPT Work、合并后的 Claude、Cursor Agents Window 与 Cloud Agents、GitHub Agents 页、Devin 的 session、Conductor 的 workspace。
- **适合**：能说清结果、能验收的活；多件并行；从手机监督。Anthropic 对 Claude Code 实际使用的分析（2026-02-18）给了监督方式的数据：新用户约两成的 session 用全自动批准，有经验后升到四成以上，同时有经验的用户打断得更多；在最复杂的任务上，它自己停下来求澄清的次数是人打断它的两倍以上；回合时长中位数约 45 秒，最长一档三个月里从不到 25 分钟涨到 45 分钟以上（https://www.anthropic.com/research/measuring-agent-autonomy）。微软的 Magentic-UI 论文（2025-07）把低成本的人参与归纳为共同规划、共同执行、多任务、动作护栏、长期记忆等机制（https://export.arxiv.org/abs/2507.22358）。
- **在哪里坏**：一、要用户先分清这是聊天还是任务。Anthropic 的博客自述用户反馈最烦的是决定一件事该放哪边、在一边开始的东西带不到另一边，于是 2026-09-16 合并（https://claude.com/blog/cowork-is-now-claude）；合并后 HN 上又有相反的声音，认为两者本来就是两种用途，担心共用额度（https://news.ycombinator.com/item?id=49733283），以及一次性任务污染了想长期保留的聊天列表（https://news.ycombinator.com/item?id=49733828）。二、并行多了，人跟不上：智能体互相改同一批文件，自己丢了全局（https://news.ycombinator.com/item?id=44533339）。三、定时任务的结果散在各自的 session 里难找（https://news.ycombinator.com/item?id=49733015）。四、人和智能体之间的沟通本身还有十二类未解决的难题，Bansal 等人（2024-11）按智能体向人传达、人向智能体传达、贯穿两者三组列出（https://export.arxiv.org/abs/2412.10380）。

### 文档为中心

- **骨架**：单位：一份文档或页面。开始：在对话里要一份文档，或从模板、空白页开始；也可以把一次对话转成页面。过程：智能体在页面上当面写，人可以同时改。提问：动笔前问几个问题；写的过程中在页边留评论解释或提问。交付：文档本身，改动署名。后续：三条路并存，旁边的对话、直接编辑、选中文字或在评论里 @ 智能体。放在中心的是那份要拿给别人看的成品和围绕它的协作；被挤到边上的是长时间运行的过程、定时更新、以及不产出文档的活。
- **例子**：Claude Docs（2026-09-16，beta）、ChatGPT Pages（2026-09-29）、Notion（页面、评论、数据库属性里 @ 智能体）。飞书文档、Google Docs 的做法未亲见。
- **适合**：报告、方案、纪要这类要被人读和改的东西；多人和智能体一起改同一份；对局部提修改意见（选中即指向，省掉了在聊天里描述是哪一段，这正是 NN/g 记录的上滚引用问题的解法）。Geoffrey Litt 的文章（2025-07，HN 979 分）提供了更一般的理由：与其再加一个要对话的副驾驶，不如把信息直接做进人正在看的界面里，像拼写检查的红线；他同时承认常规可预测的工作适合整件委托（https://www.geoffreylitt.com/2025/07/27/enough-ai-copilots-we-need-ai-huds）。
- **在哪里坏**：一、文档不会自己保持最新：ChatGPT Pages 的保持更新在发布时不可用，要到对话里另建定时任务并核对一次真实运行（https://learn.chatgpt.com/docs/space/agents.md）；Claude Docs 里的图表不会自动刷新（https://support.claude.com/en/articles/16923645-get-started-with-claude-docs）。二、手机上基本只能看：Claude Docs 的编辑、模板、分享设置要到 web 或桌面；Notion 的 Custom Agents 要桌面或 web。三、两家的文档页面都没有描述一件要跑很久的活在文档里怎样显示进度，本次未亲见。四、真实用户评价本次没有找到，两个产品都发布不到三周。

### 表格为中心

- **骨架**：单位：一张表；每行一个对象（一篇论文、一家公司、一条记录），每列一个问题或要提取的数据点，每个单元格是一次小任务的结果。开始：放进一批文件或对象，加列并写清这一列要什么。过程：单元格逐个填出来。交付：整张表，可导出；出处挂在行或单元格上。后续：改列的说明重跑，或加列。放在中心的是多对象之间的可比性和逐格可核对；被挤到边上的是开放式的探索、叙述性的结论、以及不成行列的工作。
- **例子**：Hebbia Matrix、Elicit 的表格、Airtable field agents。Clay 只读到导航，飞书多维表格的 AI 字段未亲见。
- **适合**：同一组问题问很多份材料：尽调、同业比较、文献筛选和数据提取。Elicit 的写列建议是把说明写得像交给人工标注员一样完整（格式、单位、易错点、好答案的例子），说明这种形式的质量取决于列定义（https://support.elicit.com/en/articles/14758162-create-and-save-columns-in-elicit）。Elicit 仍为系统综述保留固定结构的 workflow。
- **在哪里坏**：一、表格退为会话里的产物。Elicit 在 2026-09-30 把独立的 Find Papers、Extract Data、Chat with Papers 撤掉并入 Research Agent，旧 session 只读并将在 2027 年删除；帮助页给的理由是问题超出学术文献、需要自定义输出、需要边问边改时，固定的表不够（https://support.elicit.com/en/articles/17220397-where-did-find-papers-extract-data-and-chat-with-papers-go，https://support.elicit.com/en/articles/14756886-elicit-s-research-agent）。二、Hebbia 在 Matrix 之外也加了定位为分析师的 Max（https://www.hebbia.com/），方向相同。三、没有读到金融从业者对 Matrix 的任何评价，表格形式在目标用户里的真实口碑本次是空白。

### 收件箱为中心

- **骨架**：单位：一条等人处理的事（通知、提问、待批动作）。开始：不是人发起，而是智能体在后台被事件触发后把需要人的部分送来。过程：人不看。处理：对每一条做有限的几种动作之一（接受、改参数后接受、回复意见、忽略或稍后）。交付：批准后的动作被执行。排列：按时间或优先级的一列，处理完就消失。放在中心的是人的注意力，只在需要时占用；被挤到边上的是过程、上下文和不需要批准的那大部分工作。
- **例子**：LangChain Agent Inbox（仓库已归档，概念进了 LangSmith Fleet）、Linear 的 Triage 和 Inbox、OpenAI dots 的 Activity 里的待处理请求、Cursor 手机端的 inbox。
- **适合**：多个后台智能体同时在跑；有后果的动作需要人过目；人想批量处理而不是被逐条打断。Harrison Chase（2025-01-14）的论证：聊天界面要求每件事都由人发起，而且一次只能进行一件，限制了人放大自己；人在回路里的三种方式是通知、提问、审阅（https://www.langchain.com/blog/introducing-ambient-agents）。Linear 的 Triage 给了人类团队里成熟的对应物：接受、拒绝、标重复、稍后，各有快捷键（https://linear.app/docs/triage.md）。
- **在哪里坏**：一、又一个要去看的地方。Chase 自己说 Slack 里通知容易跟丢才做了独立收件箱，但独立收件箱同样依赖人主动去看；Pulse 帖里的用户说自动通知太容易被忽略（https://news.ycombinator.com/item?id=45388428）。二、什么值得送来。另一个产品的作者在 HN 说真正难的界面问题是打断：什么重要到要带回来，带多少证据（https://news.ycombinator.com/item?id=49165822）。三、作为独立产品没有立住：agent-inbox 仓库已归档（https://github.com/langchain-ai/agent-inbox），收件箱成了平台里的一个部件。四、只有待办没有来龙去脉时，人要点进别处才能判断，本次没有读到用户对这一点的直接评价。

### 看板为中心

- **骨架**：单位：一张任务卡。开始：写卡、排序，拖到执行列或点按钮交给智能体。过程：卡片在列之间移动，点开看智能体的输出。交付：diff 或 PR，在卡片里评审。后续：在 diff 上留评论发回。放在中心的是一批任务的流转状态；被挤到边上的是每件任务内部的对话和判断，以及任务之间的依赖。
- **例子**：Vibe Kanban、HN 上的 kanbots 和 VS Code Agent Kanban（后两者只见 HN 帖）。
- **适合**：先规划一批相互独立的小任务再并行执行，重心在规划和评审。Vibe Kanban 的自述是工程师的时间越来越多花在规划和评审上。
- **在哪里坏**：一、商业上没立住：Vibe Kanban 背后的公司 2026-04-10 关闭，自述绝大多数是免费用户、找不到商业模式，它首创的多智能体、diff 评论、预览等功能已被各家当作标配（https://www.vibekanban.com/blog/shutdown）。二、用户质疑看板到底加了什么（https://news.ycombinator.com/item?id=48260913）。三、并行任务互相踩、人丢失全局（https://news.ycombinator.com/item?id=44533339）。四、主流产品走的是列表或窗口而不是看板：Cursor 3 的 Agents Window（https://cursor.com/docs/agent/agents-window.md）。本次没有读到研究或管理类用户用看板管智能体的例子。

### IM 里的智能体

- **骨架**：单位：IM 里的一个联系人或被 @ 的机器人；一条私聊就是一条永续对话，一个线程或群就是一个上下文。开始：在已经在用的聊天软件里发一句话。过程：打字中的提示，偶尔有进度消息。提问和批准：聊天平台原生的按钮或卡片。交付：消息和附件。后续：回复。主动：它可以直接给你发消息。放在中心的是到达率和零学习成本；被挤到边上的是富内容（表格、长文、文件预览）、多件事的分隔、过程的可见性，以及对平台规则的依赖。
- **例子**：OpenClaw（二十多个渠道）、Slack 里的 @ChatGPT、@Cursor、Devin、Notion Custom Agents，dots 的 Slack 和 Teams 渠道，腾讯为微信做的 OpenClaw 插件。飞书、钉钉、Telegram 上的具体产品未亲见。
- **适合**：人不在电脑前的时候派活和收结果；团队已经在某个频道里讨论的事直接交给它；主动提醒。Chase 以 Devin 选 Slack 为例说，我们本来就在那里和人类同事协作。OpenClaw 的 39 万星说明这种入口的吸引力。
- **在哪里坏**：一、富内容渲染差：表格在 Telegram 变成一坨，用户写了规定仍反复出错十五次以上（https://github.com/openclaw/openclaw/issues/36323）。二、通知堆积、难以回翻（Chase 博文）。三、话题混在一条私聊里（https://www.v2ex.com/t/1197694）。四、受制于平台：微信单设备登录、内容审查的顾虑、实际走企业微信通道（https://www.v2ex.com/t/1197012）。五、保真度不够管理多个子智能体：dots 帖里有开发者说 Telegram 和短信类应用做不了这个，所以要做专门的客户端（https://news.ycombinator.com/item?id=49913574）。六、多渠道并存时，OpenAI 的文档说各渠道的可见消息互不镜像，只有背后的上下文是通的（https://learn.chatgpt.com/docs/dots/channels.md），用户在哪里能看到完整经过成了问题。

### 环境式与主动式

- **骨架**：单位：一条例行、一个触发器或智能体自己的判断。开始：到点、事件发生，或它自己决定醒来。过程：人不在场。交付：一条推送、一封邮件、一张卡片、一条对话里的消息，或静默更新某份产物。后续：点进去追问。它叠加在别的形式上：定时任务挂在对话或 session 上（ChatGPT、Claude、Elicit Routines），心跳挂在永续对话上（OpenClaw），主动研究挂在常驻智能体上（dots）。放在中心的是省掉人的发起；被挤到边上的是人对何时被打扰、被什么打扰的控制。
- **例子**：ChatGPT Scheduled tasks（含事件触发）、已下线的 Pulse、Claude 的 Scheduled tasks、Elicit Routines、Notion Custom Agents 的触发器、Cursor Automations、OpenClaw Heartbeat、dots 的主动研究。
- **适合**：有明确节奏和明确产物的重复工作：日报周报、盯某个来源的变化、让一份表或文档保持最新。Elicit 的做法是每次运行落成一个可追问的 session，并可让某份产物定期更新（https://support.elicit.com/en/articles/17220392-routines-in-elicit）。研究上，Horvitz 1999 年的论文主张把自动化服务与直接操纵结合，他的 Lookout 系统的要点是判断何时发起对话、何时介入（https://www.microsoft.com/en-us/research/publication/principles-mixed-initiative-user-interfaces/）；CHI 2025 的随机实验发现主动式的编程助手有明显收益，但设计细节决定用不用得起来（https://export.arxiv.org/abs/2410.04596）。
- **在哪里坏**：一、无明确请求的每日推送没有留住：Pulse 从 2025-09-25 发布到 2026-06-17 宣布下线，改为让用户自己排一个每日简报（https://web.archive.org/web/20261004182020/https://help.openai.com/en/articles/6825453-chatgpt-release-notes）；发布时用户就说痛点不在不够主动、通知会被忽略（https://news.ycombinator.com/item?id=45381288）。二、打断有代价：Mark 等人 2008 年的实验发现被打断的人会加快速度补回来、质量不降，但压力、挫败感、时间压力和费力感更高（https://ics.uci.edu/~gmark/chi08-mark.pdf）；另一项 CHI 2025 研究（18 人）发现主动式智能体提高效率但打断工作流，显示它在做什么、给出上下文可以缓解（https://export.arxiv.org/abs/2502.18658）。三、无人值守时不能提问也不该擅自行动：ChatGPT 的事件触发任务遇到需批准的动作就暂停等人；dots 把主动研究限制为只读；Notion 承认触发后有时不回复。四、成本：心跳和常驻在没事时也耗 token（https://news.ycombinator.com/item?id=49899355）。五、定时任务与它该用的资料脱节：ChatGPT 在 project 里建的任务读不到 project 的文件；Claude 的定时任务不能绑定本机文件夹。

### 语音

- **骨架**：单位：一次通话，挂在某条对话、某个任务或某位智能体上。开始：点语音或电话按钮。过程：自然轮流、可打断；可以口头让它另起任务、查任务、在任务之间切换。交付：口头汇报加同步文字，成品仍是文件。后续：接着说，或回到文字。放在中心的是人的嘴和耳，手和眼可以干别的；被挤到边上的是任何需要看的东西（表、长文、diff）和精确的指代。
- **例子**：ChatGPT Voice（2026-07-23 起进入桌面端的 Work 和 Codex）、dots 的通话、Claude voice mode。
- **适合**：边做别的边想问题、口头改优先级、听进度汇报。两位用户的正面说法都是把它当思考伙伴而不是下指令的通道（https://news.ycombinator.com/item?id=49846292；Julian Lehr 文）。
- **在哪里坏**：一、听感：夸张的情绪表达让人难以忍受较长的对话（https://news.ycombinator.com/item?id=49822092）。二、并发：ChatGPT 桌面端同时只能有一个语音对话。三、厂商自己也在摇摆：ChatGPT 在 2025-12-11 宣布 macOS 桌面 app 的语音退役，2026-07 又以新形态回到桌面（release notes）。四、用语音读长报告、在路上听交付物的体验，本次没有读到任何用户说法。

## 近一年的变化

- OpenAI 把主动推送从独立入口收回到定时任务：Pulse 于 2025-09-25 发布、2025-10-29 上 web、2025-12-17 并入 Tasks，2026-06-17 宣布下线；2026-08-25 定时任务加上事件触发（Gmail、Slack、GitHub）和分享。来源：https://web.archive.org/web/20261004182020/https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- OpenAI 在 2026-07-09 推出 ChatGPT Work，并把 Chat、Work、Codex 合进一个桌面 app，用顶部开关区分快聊和干活；同一天停止新建群聊（group chats 于 2025-11-13 推出）。来源同上及 https://web.archive.org/web/20260905061143/https://help.openai.com/en/articles/20001275
- OpenAI 在 2026-09-29 同时推出 dots（常驻智能体，一条持续对话加 Activity、Outputs、Scheduled 面板）、Space（取代 Library）和 Pages（可 @ChatGPT、@dot 的协作文档）。来源：release notes 及 https://learn.chatgpt.com/docs/dots.md
- ChatGPT 给对话线程逐步打的补丁：2025-08-22 project-only memory，2025-09-04 分支，2025-12-18 置顶，2026-03-23 文件自动进 Library，2026-05-05 记忆来源可见可改，2026-06-04 记忆自动更新，2026-08-07 搜索覆盖标题和文件夹，2026-08-21 长对话分段加载。来源：release notes。
- Anthropic 在 2026-09-16 把 Cowork 和 chat 合并成一个输入框，由 Claude 判断是回答还是任务，同时推出 Claude Docs 和 Slides；理由是用户最烦的是决定任务该放哪。切换后不能切回。来源：https://claude.com/blog/cowork-is-now-claude
- Anthropic 的单线程产品 Dispatch 已不向新用户开放，帮助页把只能有一条线程列为限制，并引导用户改用云端 session。来源：https://support.claude.com/en/articles/13947068-assign-tasks-from-anywhere-in-claude-cowork（2026-09-16 修改）
- Claude 的任务执行从本机移向云端：2026-10-06 起 Pro、Max 的新 Cowork 任务在云端跑，仅在本机运行的选项移除；定时任务已在云端跑。记忆改为按主题随聊随存，旧记忆的导出入口保留到 2026-09-09。来源：https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork 和 https://support.claude.com/en/articles/11817273-using-claude-s-chat-search-and-memory-to-build-on-previous-context
- Elicit 在 2026-09-30 撤掉独立的 Find Papers、Extract Data、Chat with Papers，并入对话式的 Research Agent，表格成为会话里的产物；Routines 取代 Alerts。来源：https://support.elicit.com/en/articles/17220397-where-did-find-papers-extract-data-and-chat-with-papers-go
- Vibe Kanban 背后的公司于 2026-04-10 关闭，项目转社区维护。来源：https://www.vibekanban.com/blog/shutdown
- LangChain 的 agent-inbox 开源仓库已归档（最后推送 2026-09-18），收件箱成为 LangSmith Fleet 里审批动作的一个部件。来源：https://github.com/langchain-ai/agent-inbox 和 https://www.langchain.com/langsmith/fleet
- Cursor 在 2026-04-02 随 Cursor 3 正式提供 Agents Window（以智能体而不是文件为中心的窗口），并有 iOS app，锁屏可同时跟踪最多八个 agent。来源：https://cursor.com/docs/agent/agents-window.md 和 https://cursor.com/docs/cloud-agent/mobile.md
- OpenClaw 的会话默认值变了：2026-04 的 issue 还把每日 4 点重置描述为默认，现在的文档写默认不自动重置；跨渠道手动切换回复目的地的 /dock 命令已移除。来源：https://github.com/openclaw/openclaw/issues/58818 和 https://docs.openclaw.ai/concepts/session.md
- Notion 3.7（2026-09-15）给智能体加了团队共享的 skills、子智能体，并推出单独的 Notion Agents iOS app。来源：https://www.notion.com/releases
- 腾讯 QClaw 的官网导航出现迁移到 WorkBuddy、停服、申请退款入口（正文未读到，时间未亲见）。来源：https://qclaw.qq.com/
- 总的方向有两股且相反：OpenAI 和 Anthropic 都在把一切收进一个对话入口并在旁边加面板（任务、产物、定时、文档）；而 HN 和 V2EX 上的重度用户在要求相反的东西，即每件事有自己的上下文和状态、文件承载状态（https://news.ycombinator.com/item?id=49736108，https://www.v2ex.com/t/1188747）。有用户把业内动向概括为向 OpenClaw 和 Slack 的样子靠拢（https://news.ycombinator.com/item?id=49897840）。

## 产品

### ChatGPT（Chat、Projects、记忆、Library）

- **来源**：<https://web.archive.org/web/20261004182020/https://help.openai.com/en/articles/6825453-chatgpt-release-notes> <https://web.archive.org/web/20261003080200/https://help.openai.com/en/articles/10169521-projects-in-chatgpt> <https://community.openai.com/t/chatgpt-typing-lag-in-long-chats-needs-virtual-scroll-like-yesterday/1273495> <https://community.openai.com/t/intermittent-ui-freeze-hangs-across-web-windows-and-android-clients-exacerbated-by-long-chat-histories-and-session-reloads/1355269> <https://www.v2ex.com/t/1183974> <https://www.v2ex.com/t/1181025>
- **时间**：Release notes 快照 2026-10-04（最新条目 2026-10-02）；Projects 帮助页快照 2026-10-03；论坛帖 2025-05 至 2025-10；V2EX 帖 2025-12、2026-01。OpenAI 帮助页直接抓取返回 403，读的是 Wayback 存档。
- **工作的单位**：一次对话（chat）。Projects 把相关的 chats、files、instructions 收在一起；2026-09-29 起另有 Space（Pages 和文件），对有权限的账号取代 Library，原有 Projects 仍单独存在。
- **怎么开始**：新建 chat，或在某个 project 里新建；旧 chat 可以拖进 project 或用 Move to project，移入后继承该 project 的指令和文件。
- **干活时**：Chat 模式下干活时的界面，所读页面没有描述（未亲见）。
- **提问和批准**：未亲见（Chat 模式）。在 project 里使用连接的 app 去项目外搜索前可能要用户确认。
- **交付**：回复落在对话里。2026-03-23 起，上传或生成的文件自动存进 Library（仅 web 有 Library 标签；iOS、Android 支持在输入框引用最近文件和搜索文件）。在 project 里可以把某条回复存为 project source，供以后的对话复用。
- **后续**：在原对话里继续。2025-09-04 起 web 可从任一消息 Branch in new chat；2025-12-18 起可置顶对话（Pinned chats，web、iOS、Android）；2026-08-07 搜索覆盖文件夹并匹配对话标题；2026-08-21 web 上长对话改为分段加载。
- **主动**：见 ChatGPT Work 与 Scheduled tasks 一项。
- **记忆**：saved memories 加引用过去对话。2026-05-05 起回复下方有 Sources 图标，可看这次回答用了哪些记忆、过去对话、自定义指令，并可修改；2026-06-04 记忆改为自动更新，有 memory summary 页；2026-06-12 可在该页删除记忆。Project 可选 default memory 或 project-only memory（2025-08-22 推出，2026-08-14 起可事后更改）；共享 project 一律 project-only。帮助页明确说项目记忆没有可查看的清单，要让它不再引用某次对话只能删除或移走那次对话。
- **文件和工作区**：每个 project 的文件数上限：Free 5，Go 和 Plus 25，Pro、Business、Enterprise、Edu 40；一次最多传 10 个。可粘贴 Google Drive 文件夹或 Slack 频道链接作为 project 来源。Library 里的文件一直保留到用户删除。
- **排列**：侧栏列出 chats 和 projects；桌面 app 的 Recents 把 Chat 和 Work 对话混排，可排序、筛选、置顶。
- **手机**：置顶对话支持 iOS 和 Android；2026-03-26 有一条手机端侧栏简化的更新（细节未读）；Library 标签仅 web。
- **计费**：订阅分档（Free、Go、Plus、Pro 多档、Business、Enterprise、Edu）；文件数、协作者数、定时任务数随档位变化。Chat 的用量规则未读。
- **被夸的**：V2EX 用户建议把 Projects 当收藏夹用，说网页端对话产品里更喜欢带缩略图导航的那种（https://www.v2ex.com/t/1183974）。专门夸线程管理的说法没有找到。
- **被骂的**：长对话变卡：论坛用户说 10 万到 30 万 token 的对话里打字都卡，要求虚拟滚动（https://community.openai.com/t/chatgpt-typing-lag-in-long-chats-needs-virtual-scroll-like-yesterday/1273495，4385 次浏览）；另一位说只能每天开新 chat，把前一天让 ChatGPT 写的总结喂进去（https://community.openai.com/t/intermittent-ui-freeze-hangs-across-web-windows-and-android-clients-exacerbated-by-long-chat-histories-and-session-reloads/1355269）。找回困难：V2EX 用户说要不停往上滚、越过大段回复去找自己之前的提示词，置顶多了列表又乱（https://www.v2ex.com/t/1183974）。质量下降：V2EX 用户在一个窗口里喂了股票资料，用两三天后开始答非所问，45 条回复里多人说 Gemini、豆包也这样（https://www.v2ex.com/t/1181025）。
- **没看到的**：Chat 模式下的进度显示、提问方式、Canvas 现状、手机端细节均未亲见；Pulse 和 dots 的官方公告正文未能打开。

### ChatGPT Work 与 Scheduled tasks（含已下线的 Pulse）

- **来源**：<https://web.archive.org/web/20260905061143/https://help.openai.com/en/articles/20001275> <https://web.archive.org/web/20260914090633/https://help.openai.com/en/articles/10291617/> <https://web.archive.org/web/20261004182020/https://help.openai.com/en/articles/6825453-chatgpt-release-notes> <https://learn.chatgpt.com/docs/app.md> <https://news.ycombinator.com/item?id=45375477>
- **时间**：Work 帮助页快照 2026-09-05；Scheduled tasks 帮助页快照 2026-09-14；Release notes 快照 2026-10-04；learn.chatgpt.com 页面无日期，2026-10-05 读取。
- **工作的单位**：一条 Work 对话（面向较长的多步工作和成品交付），可挂在 project 下；定时任务是单独的对象，在 Scheduled 页管理。Codex 是另一套视图，历史与 ChatGPT 分开。
- **怎么开始**：桌面 app 顶部在 Chat 和 Work 之间切换，手机端用顶部下拉；然后描述想要的结果，附上文件、约束和验收标准。在 project 里选 Work 会带上项目上下文。
- **干活时**：帮助页说可以看进度、回答它的问题、改方向、批准重要动作；云端的 Work 在关掉电脑后继续，桌面端经许可可用本地文件和桌面应用。具体长什么样（步骤列表、接管按钮）未亲见。
- **提问和批准**：需要批准的动作会让任务暂停，等用户审阅；要登录网站时把登录页交给用户自己输凭据，模型看不到账号密码；对有后果的动作先请求确认。
- **交付**：文档、表格、演示稿、报告、Sites 等成品；看完结果后在同一条对话里要求修改或后续工作。
- **后续**：同一条 Work 对话里继续。云端 Work 对话在 web、手机、桌面之间同步。
- **主动**：Scheduled tasks：可一次性、按计划重复、或监控变化；2026-08-25 起可由事件触发（Gmail 新邮件、Slack 频道新消息、GitHub PR 活动）；通知走推送或邮件。活跃任务上限：Free 和 Go 3 个，Plus 5，Business 和 Edu 10，Pro 和 Enterprise 15；Free 每天至多一次且只能选时间段。在 project 里建的任务不能访问该 project 的文件。Pulse：2025-09-25 给 Pro 用户，每天根据过去对话、记忆和反馈异步研究一次，第二天以卡片送达；2025-10-29 上 web；2025-12-17 把 Tasks 并入 Pulse；2026-06-17 宣布下线，主动更新改由定时任务承担，建议用户让 ChatGPT 排一个每日简报。
- **记忆**：沿用 ChatGPT 的记忆。分享定时任务时不带聊天记录、历史结果、记忆、文件和凭据。
- **文件和工作区**：云端 Work 的文件随账号；桌面端可以打开本地文件夹，只授权任务需要的文件。
- **排列**：Recents 里 Chat 和 Work 混排，可只看其中一种；project 下可分别新建 Chat 或 Work。
- **手机**：Work 可在手机上发起和继续；Codex 在手机上不可选，只能从 Remote 标签访问桌面上的会话。
- **计费**：Work 与 Codex 用同一套用量结构：套餐内含额度，用完可买 credits；语音时间在灵活计费下单独计量。费用明细用户是否随时可见未亲见。
- **被夸的**：针对 Work 的真实好评没有找到。
- **被骂的**：Pulse 发布帖（627 分、730 条评论）里的用户反应：有人说这是把主动写作变成被动刷内容（https://news.ycombinator.com/item?id=45381688）；有人说自己用这类工具的痛点从来不是它不够主动（https://news.ycombinator.com/item?id=45381288）；有人说自动通知太容易被忽略，真人助理才难以忽略（https://news.ycombinator.com/item?id=45388428）。另有用户担心 Chat 与 Work、Codex 共用额度会让人不敢用 Chat（https://news.ycombinator.com/item?id=49733283）。
- **没看到的**：Work 运行中的界面、费用显示、Pulse 公告原文（openai.com 返回 403，Wayback 限流）未亲见；Pulse 的行为以 release notes 的条目为准。

### OpenAI dots

- **来源**：<https://learn.chatgpt.com/docs/dots.md> <https://learn.chatgpt.com/docs/dots/getting-started.md> <https://learn.chatgpt.com/docs/dots/tasks-and-memory.md> <https://learn.chatgpt.com/docs/dots/channels.md> <https://learn.chatgpt.com/docs/dots/controls.md> <https://web.archive.org/web/20261004182020/https://help.openai.com/en/articles/6825453-chatgpt-release-notes> <https://news.ycombinator.com/item?id=49896604>
- **时间**：Release notes 中 2026-09-29 条目；文档页无日期，2026-10-05 读取；HN 讨论 2026-09-29 至 10-02。发布不足一周。
- **工作的单位**：一位常驻的智能体（dot）：一条持续的对话，加它自己的云端电脑和浏览器，加它自己的笔记。它可以同时担着多项持续的职责；具体的活被分派成单独的任务线程（Work 或 Codex），每个任务有自己的对话，不会自动拿到你和 dot 的全部对话。
- **怎么开始**：在桌面 app 或桌面浏览器创建（连接应用，可选连接自己的电脑），起名、选外形。它先自我介绍，并根据已有上下文建议能帮什么。之后在同一条对话里交代要它持续盯着的事，说明哪些决定需要你拍板、更新发到哪。
- **干活时**：它干活时可以继续跟它说话；它用后台智能体并行处理多件事。桌面 app 里打开它的 profile 进 Activity，点开某个任务看进度、文件、结果和等你处理的请求，也可以直接给该任务下指令。它的云端电脑可以打开查看，按 Take over 接手，再按 Return control 交还。Pause 只停当前主任务，不停已分派的任务，也不取消定时。
- **提问和批准**：每个可能影响账号或对外分享的动作先过自动审查，结果是三选一：直接做、要你批准、必须你自己做（例如改密码）。可在设置里加自定义规则，四档：不问就做、你明说才做、做前先问、交还给你做。文档特别说明让它起草回复不等于允许它发送。在 Slack 里它会先私信问你愿意分享什么再在频道回复。
- **交付**：结果和需要你决定的事回到对话；可以规定不同类型的更新走不同渠道（例如日常进度留在 ChatGPT，决定发到 Slack）。文档插图显示对话旁有 Activity 和 Outputs。文档提醒：运行完成不等于结果达成，要自己核对输出和报错。
- **后续**：在同一条对话里补充信息、改优先级，不必另开对话重启工作；对它创建的任务也可以打开后直接追加指令。
- **主动**：它可以自己决定何时暂停、何时醒来继续，不必每次跟进都设固定时间；固定时间的重复工作要保存成 schedule，在 Scheduled 页查看；支持的来源可以按事件触发。另有主动研究：它在有权限读的信息里找可帮忙的地方并记私下笔记，这类研究本身不能发消息、改内容或操作电脑。由 dot 主动打来的电话计划在发布后提供。
- **记忆**：两层：ChatGPT 的记忆，加 dot 自己的笔记（记偏好、决定、进行中的工作，与 ChatGPT 的 saved memory 分开，也不是完整记录）。换渠道不重置。用户怎样查看或修改这些笔记，所读页面没有说明（未亲见）。
- **文件和工作区**：dot 有自己的云端电脑；可另外连接一台个人电脑（需在线且 ChatGPT app 开着），一次只能连一台。连接消息渠道、连接应用、连接电脑是三件独立的事。
- **排列**：文档通篇按单数的你的 dot 来写，能否拥有多位未亲见。它创建的云端线程会出现在桌面、web、手机的列表里。在 Space 的页面里可以 @dot。
- **手机**：必须先在桌面创建；手机 app 的支持要等后续更新，手机网页不支持。可在 ChatGPT 里给它打语音电话，通话中也能打字。可在 Slack、Teams 里私信或 @ 它；各渠道的消息不互相镜像。短信渠道写的是即将推出。
- **计费**：发布后一个月内不计入套餐额度，之后再公布规则。逐步开放给 Pro 和 Business Premium，Pro 在发布时不含欧洲经济区、瑞士和英国；Enterprise 为 beta，默认关闭。
- **被夸的**：发布帖 766 分、646 条评论。有用户概括为一个总管式对话，不必自己管多条对话，它主动来汇报其他对话的进展（https://news.ycombinator.com/item?id=49907003）；多位用户说这就是面向大众的 OpenClaw（https://news.ycombinator.com/item?id=49910901）。
- **被骂的**：担心几个月后又被弃用，列举了此前的 GPTs、Agent Builder、Pulse（https://news.ycombinator.com/item?id=49899144）；反感可爱拟人化的形象，担心它误删文件时这层包装会淡化责任（https://news.ycombinator.com/item?id=49908480）；有人以同类的 Slack 常驻智能体为例，说它在开着的频道里反复空醒烧钱，一次事故频道花掉约 400 美元（https://news.ycombinator.com/item?id=49899355，该用户称那个产品为 Claude Tag，本次未核实）。
- **没看到的**：实际界面、笔记能否查看和修改、能否多位 dot、收费规则、发布一周后的真实使用评价，均未亲见。

### ChatGPT Space 与 Pages

- **来源**：<https://learn.chatgpt.com/docs/space/agents.md> <https://web.archive.org/web/20261004182020/https://help.openai.com/en/articles/6825453-chatgpt-release-notes>
- **时间**：Release notes 2026-09-29 条目；文档页无日期，2026-10-05 读取。
- **工作的单位**：一个 Space（一个项目的 Pages、文件和相关工作）里的一页 Page。
- **怎么开始**：把一次对话变成 Page、从模板开始，或直接在 Space 里写。
- **干活时**：页面旁边有一条对话，用于提问、规划或需要讨论的大改；小改动可选中文字用 Ask for change，或在行内、评论里 @ChatGPT 或 @dot。输入 / 调出 Generate、Visualize、Image。
- **提问和批准**：选区改写以待接受的修改呈现，接受前先看；文档建议在对话里说清是答在对话里还是改页面。
- **交付**：页面本身，含图表、交互内容；协作者可同时编辑和评论，各自用各自的 ChatGPT。
- **后续**：评论线程里继续 @，或在旁边对话里说。
- **主动**：保持更新（Keep Updated）在发布时不可用；要定期更新得在对话里另建定时任务，并核对一次真实运行和页面是否真的被更新。
- **记忆**：分享 Page 不会让别人看到你的私人对话或记忆；写进 Page 的信息对能看页面的人可见。
- **文件和工作区**：Space 对有权限的账号取代 Library；原有 Projects 仍分开。会议插件的纪要也存进 Space。
- **排列**：@ 菜单分 All、People、Pages、Chats，可选 ChatGPT 或自己的 dot。
- **手机**：未亲见。
- **计费**：面向符合条件的 Pro、Business、Enterprise，桌面 app 和 web。
- **被夸的**：未找到（发布不足一周）。
- **被骂的**：未找到。
- **没看到的**：界面实物、手机端、与 Projects 的关系细节未亲见。

### Claude（chat 与 Cowork 合并后）

- **来源**：<https://claude.com/blog/cowork-is-now-claude> <https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude> <https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork> <https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork> <https://support.claude.com/en/articles/11817273-using-claude-s-chat-search-and-memory-to-build-on-previous-context> <https://support.claude.com/en/articles/11647753-understanding-usage-and-length-limits> <https://news.ycombinator.com/item?id=49729412> <https://github.com/anthropics/claude-code/issues/6354>
- **时间**：博客 2026-09-16；帮助页修改日期 2026-09-16 至 09-30；HN 讨论 2026-09-16、17。合并后的新界面在 Pro、Max 上逐步放量。
- **工作的单位**：一次对话，快问快答和交办任务在同一个输入框里，由 Claude 判断这是一句回答还是一件任务；可同时跑多件任务。Projects 是带自己文件、链接、指令和记忆的工作区。
- **怎么开始**：在任意对话里描述想要的结果；未切换到新界面的账号仍需在输入框选 Chat 或 Cowork。帮助页说账号一旦切到新界面就不能切回。
- **干活时**：较重的任务在云端继续，关电脑或离开页面也在跑；用到本机文件或应用的任务需要桌面 app 开着。从手机可以看进展、回答 Claude 的问题、改方向。对话接近上下文上限时自动把较早的消息做摘要后继续（界面上显示它在整理思路），需开启 code execution；完整历史保留。
- **提问和批准**：不清楚时它会提问；建定时任务时可能用选择题提问，最后给出任务名、时间表和内容让你点 Schedule 确认；默认在永久删除文件前先问。
- **交付**：成品文件（带公式的表格、可在 PowerPoint 打开的演示稿、文档）回到对话里等你；Docs、Slides、Design 作为 artifact 在对话旁打开，可直接改、分享链接或导出。
- **后续**：在对话里继续说；Markdown 草稿可以选中文字用 Edit with Claude 原地改。
- **主动**：Scheduled tasks：把提示词存为任务指令，按设定的节奏在云端运行，电脑休眠也跑；每次运行是一个独立的 Cowork session；左侧 Scheduled 看将要和已经跑过的运行。定时任务不能绑定本机文件夹。
- **记忆**：记忆按一条条主题随聊随存，不是对话结束后做摘要；可以直接说记住这个；每个 project 有独立的记忆空间和项目摘要；在 Settings 的 Memory 里查看和编辑。可让 Claude 搜索过去的对话（以工具调用的形式显示；范围是项目外的全部对话，或单个项目之内）。单次对话可在开始前关掉记忆，开始后不能改。chat 与云端 Cowork 共用一份记忆，本机运行的 Cowork 不用记忆。
- **文件和工作区**：桌面端可授权本机文件夹读写；云端 session 的文件随账号走。2026-10-06 起 Pro、Max 的新 Cowork 任务一律在云端跑，仅在本机运行的选项移除。
- **排列**：左侧栏有任务列表、Scheduled、Artifacts 标签等。HN 用户抱怨侧栏里不用的入口占着位置，而定时任务的结果要点很多下才找到（https://news.ycombinator.com/item?id=49733015）。
- **手机**：在桌面发起的任务会出现在手机上，可看进展、答问、改方向；也可从手机发起，在云端跑。
- **计费**：订阅加用量上限，所有 Claude 界面共用同一额度；触发自动上下文管理的长对话更耗额度；可另买 usage credits。
- **被夸的**：有用户说跳过自建方案直接用 Cowork 加 Dispatch 从手机派活，是意外的好事（https://news.ycombinator.com/item?id=48588759）；有用户说在这种任务模式里让模型每轮维护一个只追加的 markdown 文件，比在聊天里来回给清单好（https://news.ycombinator.com/item?id=49737423）。博客里引用的用户原话属厂商材料。
- **被骂的**：合并帖里一位用户说：跨多天、带报告和工件、需要来回推敲的工作，在聊天里几乎无法跟踪进度，只能在很长的对话里上下滚动找线头；他认为每件任务有自己的上下文、下面可以有多条对话才合适（https://news.ycombinator.com/item?id=49736108）。另一位说自己把聊天当知识库留存和翻看，编码任务做完就不需要了，混在一起是污染（https://news.ycombinator.com/item?id=49733828）。还有人遇到在项目的 chat 里被告知做不了、得另开 task（https://news.ycombinator.com/item?id=49733729）。Claude Code 的 issue：压缩之后忘掉 CLAUDE.md 里的规定，每次压缩后都要让它重读（https://github.com/anthropics/claude-code/issues/6354，2025-08-22）。
- **没看到的**：合并后的新界面实物、任务进行中的步骤展示、Projects 在 Cowork 里的细节未亲见。

### Claude Dispatch

- **来源**：<https://support.claude.com/en/articles/13947068-assign-tasks-from-anywhere-in-claude-cowork> <https://news.ycombinator.com/item?id=48588759> <https://news.ycombinator.com/item?id=48480786>
- **时间**：帮助页修改日期 2026-09-16；HN 评论 2026-06。
- **工作的单位**：一条跨手机和桌面的永续线程。帮助页原话：“This thread doesn't reset.” 你交办时，Claude 判断活的类型并开出相应的 session（开发类进 Claude Code，知识工作进 Cowork），这些 session 出现在各自的侧栏。
- **怎么开始**：在 Cowork 侧栏点 Dispatch，完成设置（授权文件访问、保持电脑唤醒）后直接发消息。
- **干活时**：可以点进任一 session 看细节，也可以只在线程里等结果；帮助页说它发回的是结果，而不是把每一步都摆给你看。
- **提问和批准**：任务完成或需要你放行时，手机收到推送。
- **交付**：以消息把成品（表格、备忘录、对比表、PR）发回线程；产出的文件可从手机直接取，或到它说明的桌面位置找。
- **后续**：在同一条线程里接着说，手机和桌面是同一上下文。
- **主动**：可设定时任务和例行。
- **记忆**：记得做过的事和你的做法，跨 session 延续；可随时查看、编辑、删除记忆。
- **文件和工作区**：用桌面上的本机文件、连接器、插件和应用（computer use）；电脑必须醒着且桌面 app 开着。
- **排列**：只有一条线程。帮助页把这点列为当前限制：不能新开线程，也不能管理多条线程，所有消息都在一条对话里。
- **手机**：手机是主要入口之一，需同时装桌面 app 和手机 app。
- **计费**：Pro、Max 的限量 beta。
- **被夸的**：见上一项中 HN 用户的评价（https://news.ycombinator.com/item?id=48588759）。
- **被骂的**：帮助页现在写明不再向新用户开放，已有用户暂可继续用，并建议看不到入口的人改用云端 Cowork。HN 用户指出 Windows 上的权限引导按钮链到了 macOS 的系统设置（https://news.ycombinator.com/item?id=48480786）。
- **没看到的**：实际界面、停止向新用户开放的原因（文档没有说明）未亲见。

### Claude Docs 与 Artifacts

- **来源**：<https://support.claude.com/en/articles/16923645-get-started-with-claude-docs> <https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them>
- **时间**：帮助页修改日期 2026-09-23、09-24；Docs、Slides 于 2026-09-16 发布，beta。
- **工作的单位**：一份文档（artifact），存在账号的 Artifacts 标签里，可从任何对话找回；一份 doc 可以有多个 tab。
- **怎么开始**：在任意对话里要一份文档，或以 /docs 开头，或在输入框的 Output 里选 Docs，或在 Artifacts 标签选模板。Claude 先问几个问题再动笔。
- **干活时**：它在屏幕上当面起草；它写的时候文档不上锁，人可以同时编辑。
- **提问和批准**：动笔前提问；起草时自己留评论，解释取舍或向你提问。
- **交付**：富文本文档，在对话旁打开；每处改动标明是谁做的（人或 Claude）；可链接分享或导出。
- **后续**：三条路：在对话里说要怎么改，它改完告诉你改了什么；直接点进去改；选中文字留评论并 @Claude，它在评论线程里回复、改动并说明原因。
- **主动**：没有。文档里的图表不会自动更新，要再叫它拉最新数据。
- **记忆**：起草时可用你的文件、记忆、projects、skills 和已连接的应用。
- **文件和工作区**：Artifacts 标签集中存放；2026-09-16 之前在对话里生成的旧式 artifact 仍可用但不能新建。
- **排列**：不适用。
- **手机**：手机上可在对话里要文档、稍后在 Artifacts 标签全屏查看；从模板开始、编辑、改分享设置要到 web 或桌面。
- **计费**：Docs、Slides、Design 模板限付费计划，Enterprise 默认关闭。
- **被夸的**：未找到。
- **被骂的**：未找到。
- **没看到的**：界面实物、多人协作时的表现、真实用户评价未亲见。

### OpenClaw

- **来源**：<https://github.com/openclaw/openclaw> <https://docs.openclaw.ai/concepts/main-session.md> <https://docs.openclaw.ai/concepts/session.md> <https://docs.openclaw.ai/concepts/compaction.md> <https://docs.openclaw.ai/concepts/memory.md> <https://docs.openclaw.ai/gateway/heartbeat.md> <https://docs.openclaw.ai/channels/wechat.md> <https://github.com/openclaw/openclaw/issues/29563> <https://github.com/openclaw/openclaw/issues/58818> <https://github.com/openclaw/openclaw/issues/2254> <https://github.com/openclaw/openclaw/issues/36323> <https://www.v2ex.com/t/1232955> <https://www.v2ex.com/t/1197694>
- **时间**：仓库 2026-10-05 仍有提交，391,336 星；文档页无日期，2026-10-05 读取；issue 2026-01 至 04；V2EX 帖 2026-03、08。
- **工作的单位**：一位 agent 的 main session：所有私聊渠道（Telegram、WhatsApp、iMessage、Slack 私信、网页等）默认汇进同一条滚动的对话。群和频道默认各自独立成 session，由 main session 旁观并收到合并后的通知；定时任务每次运行开新 session。网页端里 Home 就是 main session，分出去的在 Threads，群在 Groups，编码在 Coding。
- **怎么开始**：在已经在用的 IM 里给它发消息，或在网页的 Control UI 里发。
- **干活时**：IM 里看到的是消息；/stop 停止。有 issue 要求在 Slack 线程状态里显示工具级进度，说明默认可见度有限。其余细节未亲见。
- **提问和批准**：执行命令的审批用各渠道的原生控件：Telegram 的内联按钮、Slack 的 Block Kit 按钮、Discord 组件、Teams 卡片。
- **交付**：IM 消息和文件。Markdown 表格在 Telegram 上会变成一坨带竖线的文字（https://github.com/openclaw/openclaw/issues/36323）。
- **后续**：同一会话里接着说；/new 或 /reset 在同一个会话键下开新 session。会话默认不自动重置，可选每日或空闲重置；接近上限时自动压缩，完整历史留在磁盘，压缩只改变模型下一轮看到的内容。
- **主动**：Heartbeat：默认每 30 分钟在 main session 里跑一轮（用 Anthropic OAuth 时为 1 小时），让模型把需要注意的事提出来；另有 Automations（定时、webhook、Gmail 事件）；后台命令结束也会唤醒一轮。
- **记忆**：工作区里的纯 Markdown 文件：USER.md（稳定偏好）、MEMORY.md（长期事实和决定，开场载入）、memory/ 下按日期的笔记、DREAMS.md。文档说模型只记得存到磁盘上的东西，没有隐藏状态；用户可以直接看和改这些文件；后台的 dreaming 把日记里有用的内容提炼进 MEMORY.md；MEMORY.md 超出预算时注入上下文的副本会被截断。
- **文件和工作区**：默认在 ~/.openclaw/workspace；状态、记忆、凭据都在自己的机器上。
- **排列**：可有多位 agent，各有自己的 main session；网页侧栏有 agent 切换器。
- **手机**：手机上就是 IM；README 另列了 iOS、Android 原生 app。
- **计费**：软件本身免费，没有付费档和托管服务；模型费用自付。
- **被夸的**：HN 上有 518 分的文章以它才是系统级助手该有的样子为题（https://news.ycombinator.com/item?id=46893970，只见标题，正文未开）；dots 帖里有用户说在虚拟机上跑了几个月，好玩但很不稳定（https://news.ycombinator.com/item?id=49896604 下的评论）。
- **被骂的**：压缩后失忆：V2EX 用户说调到理想状态后过几天任务一多就压缩，结果不再符合预期（https://www.v2ex.com/t/1232955）。话题混杂：Telegram 群里多个 Topic 默认共用一个 session，财务和开发的记忆混在一起（https://www.v2ex.com/t/1197694）；网页端所有私聊都落在同一个会话键上，难以分话题、难找旧线程，用户要求会话选择器和新建会话（https://github.com/openclaw/openclaw/issues/29563）。体积失控：35 条用户消息几小时内把 session 文件撑到 2 至 3MB，超出上下文、自动压缩失败、此后消息全部静默失败（https://github.com/openclaw/openclaw/issues/2254，20 个表情回应）。连续性：2026-04 的 issue 说每日重置加压缩使 agent 看不到最近的原始消息（https://github.com/openclaw/openclaw/issues/58818）。成本：V2EX 用户调侃第一批装上的人账单已经欠费（https://www.v2ex.com/t/1197012）。
- **没看到的**：Control UI 和原生 app 的实物、heartbeat 实际推送的频率与内容未亲见。

### LangChain Agent Inbox 与 LangSmith Fleet

- **来源**：<https://www.langchain.com/blog/introducing-ambient-agents> <https://github.com/langchain-ai/agent-inbox> <https://www.langchain.com/langsmith/fleet>
- **时间**：博文 2025-01-14（页面 2026-04-17 修改）；仓库已归档，最后推送 2026-09-18，1093 星；Fleet 页无日期，2026-10-05 读取。
- **工作的单位**：一条中断（智能体停下来等人处理的一件事）。收件箱列出你和智能体之间所有还开着的往来。
- **怎么开始**：不由人发消息开始，而由事件流触发（示例是邮件助手）。
- **干活时**：不展示过程；人只在被找到时出现。
- **提问和批准**：三种找人的方式：通知（只告知、不动手）、提问（缺信息时问人）、审阅（危险动作先给人看）。人的回应四种：接受、编辑参数、文字回复、忽略；每条中断可配置允许其中哪几种。
- **交付**：待批的动作连同参数摆出来，人可以直接改参数（例如改一封待发邮件的正文）。
- **后续**：对该条给文字反馈，让智能体按意见重做。
- **主动**：这种形式本身就是主动式的。
- **记忆**：博文说人的反馈用于长期记忆和学习；界面上记忆如何呈现未述。
- **文件和工作区**：不适用。
- **排列**：可配多个 inbox，每个对应一个部署的智能体；博文写的是当时按时间排序、单人使用，优先级排序和分派是以后的打算。
- **手机**：未亲见。
- **计费**：开源；Fleet 的定价未读。
- **被夸的**：未找到独立用户的评价。
- **被骂的**：作者自述先试过 Slack：好处是大家本来就在里面，坏处是通知容易跟丢、积压，频道和私信不好翻，而且除了发消息之外能做的交互有限，所以才做独立的收件箱。
- **没看到的**：仓库归档的原因未见说明；Fleet 页写的是用集中的 agent inbox 审阅、编辑、批准动作，实物未亲见。

### Linear（Agents、Triage、Inbox）

- **来源**：<https://linear.app/docs/agents-in-linear> <https://linear.app/developers/aig> <https://linear.app/docs/triage.md> <https://linear.app/docs/inbox.md>
- **时间**：文档页无日期，2026-10-05 读取。
- **工作的单位**：一条 issue；智能体是可被指派、可被 @ 的成员。
- **怎么开始**：把 issue 委派给智能体，或在评论、描述里 @ 它。委派之后人仍是这条 issue 的负责人。
- **干活时**：Linear 的 Agent Interaction Guidelines 要求：被叫到时立刻给不打扰的反馈；清楚显示是在思考、等输入、执行还是已完成；需要时可查看推理、工具调用和提示词；被要求退出时立即退出。
- **提问和批准**：通过 issue 评论。Triage 是团队的特殊收件箱，外部来的 issue 先进这里，动作是接受、拒绝、标为重复、稍后再看，各有快捷键。
- **交付**：issue 上的活动和评论；具体到 PR 的呈现未亲见。
- **后续**：评论里继续。
- **主动**：个人 Inbox 是通知中心，Priority 标签把需要注意的与其他更新分开，可稍后再看。
- **记忆**：Agent guidance：工作区级和团队级的 markdown 指令，带历史，自动传给在该工作区干活的智能体。
- **文件和工作区**：不适用。
- **排列**：智能体出现在指派菜单里；My issues 里仍能看到自己委派给智能体的 issue；可按 Delegate 过滤视图和统计。
- **手机**：未亲见。
- **计费**：智能体不占付费席位；提供智能体的第三方各自计费。
- **被夸的**：未找到。
- **被骂的**：未找到。
- **没看到的**：智能体干活时在 issue 里的实际呈现、手机端未亲见。

### Vibe Kanban

- **来源**：<https://github.com/BloopAI/vibe-kanban> <https://www.vibekanban.com/blog/shutdown> <https://news.ycombinator.com/item?id=44533004> <https://news.ycombinator.com/item?id=48239413>
- **时间**：README 2026-10-05 读取（28,264 星，最后推送 2026-09-19）；停运公告 2026-04-10；HN 帖 2025-07-11、2026-05-22。
- **工作的单位**：看板上的一张 issue 卡；动手时为它开一个 workspace（分支、终端、开发服务器）。
- **怎么开始**：写卡片、排优先级，点按钮让某个编码智能体（支持十余种）在本机跑。
- **干活时**：在看板里看智能体的回应；内置浏览器可预览应用。
- **提问和批准**：未亲见。
- **交付**：diff；可在 diff 上留行内评论直接发回给智能体；开 PR、合并。
- **后续**：评论即反馈。
- **主动**：无。
- **记忆**：未亲见。
- **文件和工作区**：每个 workspace 一个分支。
- **排列**：看板列。
- **手机**：公告提到做过远程访问，细节未亲见。
- **计费**：公告说绝大多数是免费用户。
- **被夸的**：公告自述每天有数千工程师在用（厂商说法）。
- **被骂的**：2026-04-10 背后的公司 bloop 宣布关闭，理由是找不到让他们有信心的商业模式；项目转为开源社区维护，远程服务（看板 issue、评论、项目、组织）30 天后移除，本地 workspace 继续可用。HN 用户说并行一多，智能体互相改同一批文件，自己也丢了对全局的把握（https://news.ycombinator.com/item?id=44533339）；另一个看板类产品的帖子里有人直接问看板界面到底加了什么（https://news.ycombinator.com/item?id=48260913）。
- **没看到的**：界面实物未亲见。

### Conductor

- **来源**：<https://docs.conductor.build/>
- **时间**：文档页无日期，2026-10-05 读取。
- **工作的单位**：每件任务一个 workspace，带自己的分支、文件、终端、diff 和评审路径。
- **怎么开始**：新建 workspace 并让 Claude Code、Codex、Cursor 或 OpenCode 之一开工（并行）。
- **干活时**：未亲见。
- **提问和批准**：未亲见。
- **交付**：审 diff、开 PR、合并，然后归档 workspace。
- **后续**：未亲见。
- **主动**：未亲见。
- **记忆**：未亲见。
- **文件和工作区**：基于 git worktree 的隔离工作区；文档目录里有 Cloud 和 Multiplayer。
- **排列**：并行的 workspace 列表（未亲见实物）。
- **手机**：未亲见。
- **计费**：未读。
- **被夸的**：未查。
- **被骂的**：未查。
- **没看到的**：除首页概述外均未亲见。

### Cursor（Agents Window、Cloud Agents、iOS、Automations）

- **来源**：<https://cursor.com/llms.txt> <https://cursor.com/docs/agent/agents-window.md> <https://cursor.com/docs/cloud-agent/mobile.md> <https://cursor.com/docs/cloud-agent/automations.md> <https://cursor.com/help/ai-features/background-agents.md>
- **时间**：文档页无日期，2026-10-05 读取；Agents Window 随 Cursor 3 于 2026-04-02 正式提供。
- **工作的单位**：一个 agent（一次运行，绑定仓库和分支，以 PR 收尾）。云端的每个 agent 有自己的虚拟机。
- **怎么开始**：编辑器里在输入框旁选 Cloud；在 cursor.com/agents；在 Slack、GitHub、Linear 里 @Cursor；或由 Automations 按时间或事件启动。
- **干活时**：看对话流；给正在跑的 agent 发后续指令；点子智能体卡片看它的记录；可以接管 agent 的远程桌面亲自用它做出来的东西。
- **提问和批准**：未亲见。
- **交付**：PR，并附上视频、截图和日志来演示改动，让人不必检出分支就能验收。
- **后续**：让 agent 处理评审意见或修失败的检查；本机和云端之间可以来回交接。
- **主动**：Automations：定时或由 GitHub、GitLab、Slack、webhook、Linear 等事件触发；可用 /automate 用自然语言描述。
- **记忆**：规则、skills（未细读）。
- **文件和工作区**：云端虚拟机或自己的机器；worktree 隔离。
- **排列**：Agents Window：一个窗口里跨多个项目管理并行的 agent，与传统编辑器并存、可随时切回。手机端称这个列表为 inbox。
- **手机**：iOS 原生 app（Android 在计划中）。文档说它不是缩水的聊天框：可起 agent、实时跟进、看完整 diff、合并 PR；每个回合结束推送通知，锁屏实时活动可同时跟踪最多八个 agent；可语音听写。编辑器、终端、密钥和环境配置留在 web。Remote Control 可把电脑上的 session 交给手机继续指挥，循环在云端、工具仍在电脑上跑。
- **计费**：按云端 agent 的用量计费；Automations 可选记在个人名下或团队的服务账号名下。
- **被夸的**：未专门查。
- **被骂的**：未专门查。
- **没看到的**：提问与审批方式、界面实物、用户评价未亲见。

### GitHub Copilot cloud agent（Agents 页）

- **来源**：<https://docs.github.com/en/copilot/concepts/agents/coding-agent/agent-management>
- **时间**：文档页无日期，2026-10-05 读取。
- **工作的单位**：一个 agent session，在仓库的 Agents 标签或总的 Agents 页里。
- **怎么开始**：在 Agents 标签发起任务，选模型，可选第三方智能体（Claude、Codex）或自定义智能体。
- **干活时**：点开 session 看实时日志；可在运行中插话纠偏而不必停下，每条插话消耗 AI credits。
- **提问和批准**：未亲见。
- **交付**：PR，在 PR 上评审、要求改进或合并；也可把 session 接到 VS Code 或 CLI 里继续。
- **后续**：在 PR 上继续要求。
- **主动**：页面提到可设 automations（细节未读）。
- **记忆**：未亲见。
- **文件和工作区**：仓库。
- **排列**：列出仓库里所有活跃的 session。
- **手机**：未亲见。
- **计费**：AI credits。
- **被夸的**：未查。
- **被骂的**：未查。
- **没看到的**：除该文档页外均未亲见。

### Devin

- **来源**：<https://docs.devin.ai/llms.txt> <https://docs.devin.ai/get-started/first-run.md> <https://docs.devin.ai/work-with-devin/advanced-capabilities.md>
- **时间**：文档页无日期，2026-10-05 读取。
- **工作的单位**：一个 session（Ask 或 Agent 模式）。大任务可由一个协调 session 拆给多个各自有独立虚拟机的 managed Devin 并行，再汇总。
- **怎么开始**：在 web 里选模式、仓库和智能体后输入；在 Slack 线程里 @ 它；从其他编码智能体交接过来；或由 schedule 触发。
- **干活时**：文档目录列有 IDE、浏览器、Shell、Side Chat 等会话工具供监看和引导（未细读）。
- **提问和批准**：未亲见。
- **交付**：PR。
- **后续**：未细读。
- **主动**：Schedules 和 Automations。
- **记忆**：Knowledge：所有 session 都能引用的一组指令和建议，官方比作给新员工做入职；Playbooks 是可复用的做法；它可以分析过往 session、整理知识库。
- **文件和工作区**：每个 session 的虚拟机环境。
- **排列**：session 列表（未亲见实物）。
- **手机**：未亲见。
- **计费**：文档目录提到组织的 ACU 限额。
- **被夸的**：未查。
- **被骂的**：未查。
- **没看到的**：界面、提问方式、计费细节未亲见。

### Notion（Custom Agents）

- **来源**：<https://www.notion.com/help/custom-agents> <https://www.notion.com/releases>
- **时间**：Releases 页最新为 2026-09-15 的 3.7；帮助页无日期，2026-10-05 读取。
- **工作的单位**：一位 Custom Agent：指令、触发器、访问范围和模型的组合，发布后在后台按触发运行；每次运行留一条活动记录。与之并列的 Notion Agent 是对话式的。
- **怎么开始**：侧栏 Agents 区点加号，用 AI 对话描述、选模板或从空白开始；之后由日程、Notion 数据库事件、Slack 事件触发，或在页面、数据库属性、评论里 @ 它。也可以把它的聊天嵌进某个页面。
- **干活时**：后台运行。在 Slack 被触发时可显示正在处理的提示；帮助页承认有时它最后决定不回复或超时，提示自行消失。
- **提问和批准**：3.7 说对已连接工具的改动要经确认才生效（beta）。
- **交付**：写进 Notion 页面和数据库，或发 Slack 消息、回复。
- **后续**：改指令或触发器后重跑；配置有版本历史可恢复。
- **主动**：按日程（每天、每周、每月等）和事件运行。
- **记忆**：以工作区里已有的文档和数据库为上下文；只能用明确授权给它的页面。指令写在一个页面里。
- **文件和工作区**：Notion 工作区本身。
- **排列**：侧栏 Agents 区；每位有 Activity 和 Insights 标签；3.7 起一位 Custom Agent 可以调用别的 Custom Agent 作为子智能体。
- **手机**：构建、编辑、查看和使用 Custom Agents 需要桌面或 web；3.7 另推出 Notion Agents iOS app。
- **计费**：需 Business 或 Enterprise；按 Notion credits 计，高级模型按模型自身价格扣，子智能体的交接也耗 credits；额度用尽后高级模型暂停。Insights 里可比较各次运行的模型、质量和 credits。
- **被夸的**：Releases 页引用某公司用五位智能体跑 IT 服务台每年省 50 万美元（厂商材料）。
- **被骂的**：帮助页的常见问题自己列了 Slack 里显示正在处理却不回复的情况。HN 上有 183 分的帖子讲 Notion 3.0 智能体的数据外泄风险（https://news.ycombinator.com/item?id=45307095，只见标题）。
- **没看到的**：界面实物、Notion Agent 的对话形态、独立用户评价未亲见。

### Elicit

- **来源**：<https://support.elicit.com/en/articles/17220397-where-did-find-papers-extract-data-and-chat-with-papers-go> <https://support.elicit.com/en/articles/14756886-elicit-s-research-agent> <https://support.elicit.com/en/articles/17220392-routines-in-elicit> <https://support.elicit.com/en/articles/14758162-create-and-save-columns-in-elicit>
- **时间**：帮助页修改日期 2026-09-17 至 09-30。
- **工作的单位**：一个 Research Agent session，表格是 session 里的产物。另有结构固定的 Systematic Review 和 Research Report 两种 workflow，以及 Projects、Library 和 collections。
- **怎么开始**：首页用 skill（Find Papers、Extract Data）或直接向 agent 提问；可以点名某个 collection 让它从那里出发。
- **干活时**：发送前可用滑杆选力度（从最快到最聪明五档，限量 beta），力度越高读的来源越多、越久、越耗额度。运行中的界面未亲见。
- **提问和批准**：指代的论文有歧义时它会问是哪一篇，而不是替你选；建 Routine 时先给出它打算遵循的指令和建议的时间表，供你直接改字段或在对话里改。
- **交付**：带引用的回答、对比表、图、幻灯片草稿；表格每行一篇论文、每列一个要提取的数据点，可点表上的 Add column 或直接对 agent 说加什么列；可筛选和导出来源、把论文存进 Library。
- **后续**：同一 session 里追问、加列、拉更多论文、换一种输出。
- **主动**：Routines：让 Research Agent 按每周某天或每天运行的一套指令，取代了旧的 Alerts（只通知有新论文），可以对发现的内容做分析并交回成品。打开某个产物选 Track artifact 可让它定期更新。每次运行落在一个 session 里，带来源，可点进去核对引用、质疑结论或追加任务；运行后给所有者发邮件。
- **记忆**：已存的论文（Library、collections，含同事共享的）作为上下文；agent 会说明哪些结论用了你存的论文、哪些来自更广的检索。
- **文件和工作区**：Library 和 collections；Project 可绑定 collection，新找到的论文默认存进去。
- **排列**：Recents；Routines 页分 Active、Paused、Archived，每条有运行历史、暂停、立即运行、归档。
- **手机**：未亲见。
- **计费**：每月用量上限，力度档位决定消耗；Routines 限 Pro、Scale、Enterprise。
- **被夸的**：未找到（变更刚发生五天）。
- **被骂的**：未找到。
- **没看到的**：界面实物、用户对并入 agent 的反应未亲见。

### Hebbia Matrix

- **来源**：<https://www.hebbia.com/product/matrix> <https://www.hebbia.com/>
- **时间**：页面无日期，2026-10-05 读取；页面演示数据里的文件日期到 2026-08。
- **工作的单位**：一张 matrix：每行一个对象（演示里是一家公司连同它的一组源文件），每列一个问题或分析项（子行业、财务与估值、近三年并购、治理与防御、推荐的切入角度等），有 Add row 和 Add column。
- **怎么开始**：未亲见（官网只有预约演示）。
- **干活时**：未亲见。
- **提问和批准**：未亲见。
- **交付**：单元格里的文字或小表；行首列出所依据的源文件。出处在单元格里怎样呈现未亲见。
- **后续**：未亲见。
- **主动**：未亲见。
- **记忆**：未亲见。
- **文件和工作区**：官网列出的数据来源包括 SEC 和欧洲等地的申报文件、业绩会纪要、FactSet、S&P Capital IQ、PitchBook、专家访谈库，以及 SharePoint、Box 等企业网盘。
- **排列**：官网另有新产品 Max（定位为分析师）和按 Project 的团队协作。
- **手机**：未亲见。
- **计费**：未公开。
- **被夸的**：未找到真实用户的说法。
- **被骂的**：未找到。
- **没看到的**：除官网演示外全部未亲见；没有读到任何金融从业者的评价。

### Airtable field agents

- **来源**：<https://support.airtable.com/docs/using-airtable-ai-in-fields>
- **时间**：帮助页标注 26 天前更新，2026-10-05 读取。
- **工作的单位**：表里的一个字段（一列）就是一个 field agent，在单元格级别取数、分析或生成，可上网和读文档。
- **怎么开始**：加字段时从常见用例里选、点 Build a field agent，或让 Omni 代建；有编辑权限的人点 Generate 生成内容。
- **干活时**：未亲见。
- **提问和批准**：未亲见。
- **交付**：单元格内容：长文本、单选或多选、数字、金额、百分比，或建议的关联记录。
- **后续**：改字段配置，或让 Omni 改。
- **主动**：未亲见。
- **记忆**：引用同一条记录其他字段里的信息。
- **文件和工作区**：base 和表。
- **排列**：一列一个。
- **手机**：帮助页列的平台是浏览器、Mac 和 Windows app。
- **计费**：所有付费计划，另需 AI credits。
- **被夸的**：未查。
- **被骂的**：未查。
- **没看到的**：运行与出错时的表现、用户评价未亲见。

### 腾讯 QClaw、WorkBuddy、微信 ClawBot（只见官网导航和用户帖）

- **来源**：<https://qclaw.qq.com/> <https://docs.openclaw.ai/channels/wechat.md> <https://www.v2ex.com/t/1197012> <https://www.v2ex.com/t/1199899> <https://www.v2ex.com/t/1198365>
- **时间**：官网 2026-10-05 读取（正文为脚本渲染，只读到标题和导航）；V2EX 帖 2026-03。
- **工作的单位**：未亲见。QClaw 官网标题自称微信远程办公 AI 助手。
- **怎么开始**：用户帖说在微信里直接对话（https://www.v2ex.com/t/1197012）。
- **干活时**：未亲见。
- **提问和批准**：未亲见。
- **交付**：未亲见。
- **后续**：未亲见。
- **主动**：未亲见。
- **记忆**：未亲见。
- **文件和工作区**：用户帖说 QClaw 与 OpenClaw 共用同一个配置目录，卸载 QClaw 时把 OpenClaw 的目录一并删了（https://www.v2ex.com/t/1198365）。
- **排列**：未亲见。
- **手机**：入口就是微信。OpenClaw 文档说微信渠道由腾讯微信团队维护的外部插件提供，扫码登录，只声明支持私聊。
- **计费**：未亲见。
- **被夸的**：用户认为微信的优势是门槛低、基本盘大（https://www.v2ex.com/t/1197012）。
- **被骂的**：同帖用户：担心聊天内容被归档审核，宁可用网页；实际走的是企业微信或客服消息通道；一台电脑只能登一个微信号，家里挂着就影响公司电脑登录；愿意部署的人多半会选飞书这类开发者平台更成熟的。耗量：两个任务用掉约 590 万 token 而要的 PPT 没生成，微信 ClawBot 一句话 5.2 万 token（https://www.v2ex.com/t/1199899）。
- **没看到的**：QClaw 官网导航里出现迁移到 WorkBuddy、停服、申请退款、停服专区等入口，正文没读到，停服的时间和原因未亲见；WorkBuddy 官网只读到标题。产品行为全部未亲见。

### Manus（只见用户帖）

- **来源**：<https://www.v2ex.com/t/1186502> <https://www.v2ex.com/t/1189167>
- **时间**：V2EX 帖 2026-01-17、2026-01-29。
- **工作的单位**：未亲见。
- **怎么开始**：未亲见。
- **干活时**：未亲见。
- **提问和批准**：未亲见。
- **交付**：用户说做网页的效果好，服务器、域名、数据库、支付一条龙（https://www.v2ex.com/t/1189167）。
- **后续**：未亲见。
- **主动**：未亲见。
- **记忆**：未亲见。
- **文件和工作区**：未亲见。
- **排列**：未亲见。
- **手机**：未亲见。
- **计费**：积分。一位年付 200 美元的用户说每月固定 4000 积分加每日 300 积分。
- **被夸的**：同上一帖的好评；回复里有人说海外用户多拿它做深度调研和数据分析。
- **被骂的**：工作量不透明、积分消耗太快：用它写一个不到十个文件的小工具，三千多积分两天用完，只能等第二天刷新；回复里有人说用着用着就变笨，也有人希望改成包月而不是按量（https://www.v2ex.com/t/1186502）。
- **没看到的**：产品行为全部未亲见。

### 语音：ChatGPT Voice（桌面端 Work、Codex）与 Claude voice mode

- **来源**：<https://learn.chatgpt.com/docs/features/voice.md> <https://support.claude.com/en/articles/11101966-use-voice-mode> <https://web.archive.org/web/20261004182020/https://help.openai.com/en/articles/6825453-chatgpt-release-notes> <https://julian.digital/2025/03/27/the-case-against-conversational-interfaces/>
- **时间**：ChatGPT Voice 文档无日期，2026-10-05 读取；Claude 帮助页修改日期 2026-09-16；release notes 相关条目 2025-12-11 至 2026-09-23。
- **工作的单位**：一次语音对话，挂在某条对话或任务上。ChatGPT 桌面 app 里同一时间只能有一个语音对话。
- **怎么开始**：ChatGPT：在已有任务里点 Start voice chat，或新建语音对话；可设快捷键。Claude：点声波图标，手机上体验最好。
- **干活时**：ChatGPT：可随时打断、追问、改方向；可以让它另起任务做较长的活、查看现有任务、发后续指令，它把进度、阻塞和结果带回语音对话；可以说要跟某个任务说话，再说回到上一个；macOS 上可让它看当前窗口。Claude：免提模式按自然停顿应答，嘈杂环境可切按住说话；同一对话里文字和语音可切换。
- **提问和批准**：ChatGPT Voice 沿用它所指挥的任务的权限设置。
- **交付**：语音加同步的文字。
- **后续**：接着说；之前的语音对话可重新打开继续。
- **主动**：无（dots 的主动来电尚未提供）。
- **记忆**：沿用各自产品的记忆。
- **文件和工作区**：沿用所在任务的。
- **排列**：靠说话在任务之间切换。
- **手机**：ChatGPT 的这套语音是桌面能力，手机经 Remote 配对后可用；Claude 的语音在手机、桌面、web 都有。
- **计费**：ChatGPT：灵活计费下语音连接时间单独计量，语音发起的任务用同一个额度池。Claude：计入常规用量。
- **被夸的**：HN 用户说做家务时用语音和它讨论架构，直到形成计划，好处是没法略读或复制粘贴，要么真懂要么不懂（https://news.ycombinator.com/item?id=49846292）。Julian Lehr 说自己边走边和语音模式聊了一小时理出文章提纲，这是一个思考过程而不是下指令。
- **被骂的**：HN 用户说各家语音模型夸张的情绪表达让人分心，超过 45 秒的对话就难以忍受，只想要平稳克制的声音（https://news.ycombinator.com/item?id=49822092）。
- **没看到的**：NotebookLM 的 Audio Overviews、豆包和元宝的语音、通勤场景下听长回复的体验都未亲见。

## 没查到的，来源说明

- 内置浏览器整个过程都开不了新标签页（标签数已到上限，其他标签不是我的，没有动），所以没有做任何 Bing 搜索。来源偏向我已知网址的官方文档、Hacker News（Algolia 接口）、V2EX（sov2ex 接口）、GitHub issue 和 OpenAI 论坛；Reddit、知乎、小红书、即刻、应用商店评论、少数派都没有读到。
- OpenAI 的帮助页和官网直接抓取返回 403，读的是 Wayback 存档（快照日期已写明）；Pulse 和 dots 的官方公告正文没有打开，相关行为以 release notes 和 learn.chatgpt.com 的文档为准。
- HN 评论是按关键词从接口里取的样本，不是按票数排序的高赞评论，不能代表整体态度的比例。
- 未亲见的产品和功能：飞书文档与多维表格的 AI 字段、飞书知识问答、钉钉、Google Docs 和 Sheets 里的 Gemini、Microsoft Copilot、ChatGPT Canvas 现状、NotebookLM Audio Overviews、Clay（只读到导航）、Poke 和各类 Telegram 机器人、扣子空间、豆包、Kimi、元宝、WorkBuddy 的产品行为。任务书点名的飞书和 Clay 在本次结果里是空白。
- 未打开的文章和研究：Karpathy 2025 年的演讲、Luke Wroblewski 和 Amelia Wattenberger 关于聊天界面的文章、Iqbal 与 Bailey 的打断研究、Amershi 2019 年的 18 条准则原文和 Horvitz 1999 年的原则清单（只读了摘要页）、Stratechery 对 dots 的评论。
- dots 发布才六天：笔记能否查看和修改、能否有多位、收费规则、Activity 和 Outputs 的实物、真实使用一段时间后的评价都没有。
- Dispatch 为什么停止向新用户开放，文档没有说明；是单线程本身的问题，还是为云端化让路，无法判断。
- Hebbia Matrix 没有读到任何金融从业者的评价，也没有公开定价；表格形式在深度研究用户里的口碑是空白。
- 没有找到任何量化数据说明有多少用户遇到长线程问题、多长开始出问题；用户说法都是个案。消费级产品里自动压缩或自动摘要对质量的影响，也没有找到测量。
- Claude Tag 是一位 HN 用户对某个 Slack 常驻智能体的叫法，本次没有核实它是什么产品。
- 三类目标用户（金融深度研究、AI 研究、技术管理者）各自偏好哪种形式，本次没有读到针对性的访谈或评测；现有证据大多来自开发者社区。
