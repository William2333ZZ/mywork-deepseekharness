# 交互形式调查：常驻的智能体和 AI 同事

原始记录（2026-10-05）。每条说法以所附网址的原文为准。

## 形式

### 常驻同事名册：一位智能体一条永久对话

- **骨架**：单位是一位有名字和职责的智能体。左栏是名册，每行 = 头像 + 名字 + 最近一句或状态（在干活 / 需要你 / 未读）。开始：新建时写职责，然后直接发一句具体的活。过程：都在这一条对话里，干活时再发一句会改变当前这一轮，可以停；旁边可打开它的电脑画面。找人：对话里的卡片（提问、批准 Allow once / Always allow / Deny、接管屏幕、遮蔽的密钥输入、可编辑的待发草稿），侧栏标出「需要你」，系统通知只在做完或要输入时发。交付：办在真实工具里，对话里留小结和文件。后续：同一条对话接着说，对某个结果的反馈用线程回复。主动：例行属于某一位，结果回到它的对话，在它的详情里管理（开关、试跑、历史）。记忆：每位各自记偏好、角色和过往摘要；长期规则写在职责描述里；技能库全员共用。文件：账号级共享电脑（Grok Bot）或可选每位私有（Rakazo）。多位：2–6 位的群聊、智能体之间异步发消息交接、一位总管带几位专员。手机：同一份名册和同样的卡片。计费：周额度或自带 key。
- **例子**：Grok Bot、Rakazo、MyWork 现行第 9 节
- **适合**：职责稳定、反复发生、上下文会累积的活（收件箱、周报、账户跟进、盯变化）。HN 用户 jjcm 用了一个月的结论是按领域分开的 bot 各管各的例行和上下文，结果更好，而且有了自己的电脑后异步才真的成立（https://news.ycombinator.com/item?id=49261514）。
- **在哪里坏**：一、同一条对话里例行和人的消息撞车：Rakazo 原先把你在例行运行中发的话并进那一轮，bot 答「我没有上文」，后改为排队单独回答（https://github.com/elie222/rakazo/blob/main/CHANGELOG.md）。二、常驻很费：jjcm 一个月用掉的 token 超过此前五年；另一用户试 3 小时用掉一半周额度（同上 HN 帖）；Grok 文档写明久不在会询问并暂停例行（https://docs.x.ai/grok-bot/skills-routines-and-automations）。三、名字不是权限边界：Grok 文档明说不要把分开的 Bot 当安全边界，它们共用一台电脑和全部登录（https://docs.x.ai/grok-bot/approvals-security-and-privacy）。四、一条对话装了不止一件长期工作：Grok 文档建议此时开线程或另建 Bot（https://docs.x.ai/grok-bot/chat-and-collaboration）。五、新同事建好不出声、职责被误解到第一次干活才发现（Rakazo issue #900、#902）。六、群里只有智能体没有别的人（HN 用户 thenbrent）。

### 一位总管加后台线程

- **骨架**：单位是唯一的一位个人智能体，一条主对话。它自己把活拆给后台智能体，或另开你看得见的线程；线程各有自己的对话，不自动带上主对话的全部内容。它的资料页上挂两个面板：Activity（每个任务的进度、文件、结果、等你的请求，可对单个任务下指令）和 Scheduled（定时任务）。App、Slack、Teams、WhatsApp、电话是同一位：记忆通用，各渠道的消息不互相镜像。找人：自动审查后分三种结果（放行 / 要批准 / 必须你自己做），可加自定义规则四档。主动：自己决定何时醒来继续，出想法卡片，做只读的主动调研。记忆：它自己的私有笔记，独立于平台记忆。暂停只停主任务，已派出的任务和定时要分别停。
- **例子**：OpenAI dots、Meta Muse、OpenMuse、OpenClaw 的 Home 主会话、Lindy 的 Home、Claude Code 的 Projects（一条项目对话 + 线程 + Overview 的「Waiting on you」+ Library 存成稿）
- **适合**：个人事务和跨工具协调，用户不想自己管理一份名册；手机为主的场景（澎湃称 Muse 让手机从遥控器变成主角：https://m.thepaper.cn/newsDetail_forward_34180411）。
- **在哪里坏**：一、权限越界：Muse 在未获授权时同步了记者 Messages 数据库 187,000 行（https://appleinsider.com/articles/26/09/28/metas-new-ai-agent-blatantly-ignores-users-permissions）。二、「完成」不等于办成：dots 文档自己写明运行完成不证明结果达成或送达（https://learn.chatgpt.com/docs/dots/tasks-and-memory.md）。三、早期版本丢消息、权限报错、插件设置不清（https://tech.yahoo.com/ai/chatgpt/articles/openai-dots-grok-bot-tester-093953421.html）。四、被目标网站封禁：亚马逊封了 Muse 的购物（澎湃同上）。五、一位什么都管时缺专业深度，OpenAI 自己另做 Specialist dots（澎湃同上）。

### 聊天软件里的机器人

- **骨架**：单位是 IM 里的一个联系人或应用。开始：私聊它，或在频道、群里 @ 它，或给消息加表情触发。过程：在线程里回帖更新。找人：线程里提问，用 IM 原生按钮审批。交付：线程回帖加链接（PR、文档）。后续：同线程继续，可用关键词让它闭嘴、休眠、归档。主动：定时或心跳把提醒发到私聊。记忆：工作区文件或团队记忆。多位：每位一个机器人账号；团队共用的一位则每人各有私聊。
- **例子**：OpenClaw（Telegram、WhatsApp、微信、飞书等）、Devin 在 Slack、Lindy Teammate、Grok Team Bot 的 Slack 应用、dots 在 Slack 与 Teams、飞书 8.0 群里拉 Agent、豆包工作伙伴、企业微信智能机器人、微信 ClawBot 连 WorkBuddy、Glean independent agents、Notion Custom Agents 的 Slack 触发
- **适合**：团队本来就在这个 IM 里干活；不想让人多装一个应用；结果需要多人看见。
- **在哪里坏**：一、IM 承载不了富交互：HN 用户 h14h 说在 Telegram 里让多个 bot 的沟通可见需要大量自定义改造，宁可自己写客户端（https://news.ycombinator.com/item?id=49261514）。二、文件回传受限：微信 ClawBot 传不了大文件，要另走邮件（https://www.pconline.com.cn/focus/2178/21785878.html）。三、在群里把主人的信息说给陌生人：钉钉 CEO 举的 3000 人群案例（https://finance.sina.cn/stock/jdts/2026-03-17/detail-inhrhttn5374463.d.html?vt=4）。四、频道噪音与耗费：Grok 文档警告不要监听「每条新消息」。五、主场不对：新智元称 Discord 和 Telegram 不是中国用户的主场，国内被飞书 CLI 这类「嵌入式」做法接管（https://timeline.sohu.com/news/GCQ55R74GS）。

### 任务派单台

- **骨架**：单位是一次任务或会话，各有自己的工作区或虚拟机。左栏是任务列表，每行显示在干活 / 等你 / 做完。开始：输入框写任务，选仓库或文件夹、模型；或从 Slack、工单、PR 评论触发；每输入一句就多一个并行任务。过程：步骤流；可瞥一眼最近输出并回一句，或进入完整对话；可中途发话。找人：行上标出等你 + 推送。交付：PR 与差异、文件、在线文档。后续：同一任务里追问，或新开。手机：看列表、回一句、审并合并。
- **例子**：Devin 的 session、Cursor Agents Window 与 cloud agents 与 iOS、Codex Cloud、Claude Code agent view、Paseo、WorkBuddy、悟空「新的任务」、豆包工作、Relevance AI 的 Tasks 页
- **适合**：边界清楚、能并行、有验收物的活：代码、报告、PPT、文件整理。
- **在哪里坏**：一、每个任务都要重讲背景、自己记哪个做完哪个在等：Claude 文档把这列为做 Projects 的理由（https://code.claude.com/docs/en/claude-projects.md）。二、并行多开成倍耗用量（https://code.claude.com/docs/en/agents.md）。三、长期上下文要另靠知识库或技能补，Devin 已把 Knowledge 废弃改为 Skills（https://docs.devin.ai/product-guides/knowledge.md）。四、非技术用户面对空任务框说不出要它干什么：HN「谁在用 OpenClaw」帖首条高赞即此（https://news.ycombinator.com/item?id=47783940）。

### 触发器加提示词的后台自动化

- **骨架**：单位是一条自动化：触发器（时间表、事件、webhook）+ 一段指令 + 工具与权限 + 结果去向。没有对话主体，或挂在某位智能体名下。过程不可见，事后在运行记录里看。多数不找人；能碰什么靠事先圈定的范围。交付：发到频道、评论、PR、文档或某条对话。管理：列表页开关、试跑、编辑、最近若干次运行。
- **例子**：Notion Custom Agents、Cursor Automations、Devin Automations、Claude Code routines、ChatGPT Scheduled tasks、Dust 的 schedules、Glean 定时智能体、Lindy routines、OpenClaw 的心跳与 automations；Grok Bot、Rakazo、MyWork 的例行是它挂在某位同事名下的版本
- **适合**：周报、巡检、分诊这类重复且输出格式固定的活。
- **在哪里坏**：一、数据源过期仍给出自信的总结，或重试造成重复动作（https://kingy.ai/blog/openai-dot-vs-grok-bot-vs-meta-muse/ 的评估清单；Grok 文档要求写明无数据和过期数据时怎么办）。二、无人看守的耗费：OpenClaw 心跳默认每 30 分钟一轮模型调用（https://docs.openclaw.ai/gateway/heartbeat.md）。三、无审批：Claude routines 运行时不停下来等批准（https://code.claude.com/docs/en/routines.md）。四、别人看不到：Dust 的触发器目前属于个人，只有编辑者能看运行（https://docs.dust.tt/docs/user-documentation/agents/triggers/schedules.md）。五、Rakazo 曾出现周期例行跑一次就停（issue #3）。

### 岗位套装与画布流水线

- **骨架**：单位是预设岗位的角色（各有名字和头像），或画布上相连的一组智能体。开始：挑一个角色聊，或给整条流水线一个任务。过程：任务时间线。找人：升级到邮件或 Slack，「待审」页签集中处理。交付：各角色各自的产出。记忆：一份统一的品牌或企业知识库。多位：并列的角色，或由连接线规定谁交给谁（智能体自行判断或强制下一步）。
- **例子**：Sintra 的 12 位助手、Relevance AI Workforce、悟空的十大行业 OPT 套件、阿里云 JVS Claw 数字员工广场里的东财 Bot
- **适合**：小企业主和营销类的标准产出；想要开箱即用岗位的人。
- **在哪里坏**：一、角色之间不通上下文，要人搬运；复杂任务变慢且不稳定（https://www.unite.ai/sintra-ai-review/，经工具摘要）。二、「数字员工」变「数字祖宗」：创业者发现维护时间、错误成本、token 消耗超过人工（https://finance.sina.com.cn/tech/roll/2026-05-21/doc-inhyrmmu5981510.shtml）。

### 共享空间里人和智能体并排

- **骨架**：单位是一个空间（Pod、Space、群、文档），里面有对话、任务、文件；成员既有人也有智能体。开始：@ 智能体，或把任务指派给它。过程和结果空间成员都看得见。权限随空间或随提问的人。
- **例子**：Dust Pods、ChatGPT Space（仅见媒体转述）、飞书 8.0 的群与文档评论、Grok 的群聊（只有 bot）、Grok Team Bots（每人私聊 + 团队记忆）
- **适合**：围绕一个项目或客户的持续协作；需要多人看到智能体做了什么。
- **在哪里坏**：一、多个智能体同在一条对话里时中途插话送不准：Dust 已改为一条对话只对应一个智能体（https://docs.dust.tt/docs/user-documentation/agents/steering-conversations.md）。二、用谁的权限：Team Bot 以提问者自己的账号行动、每人对话互不可见（https://docs.x.ai/grok-bot/team-bots）；飞书沿用使用者权限（https://www.geekpark.net/news/370460）。三、把个人 Bot 变成团队 Bot 时个人记忆外泄的风险：Grok 在发布到团队时逐项让主人选哪些记忆带过去。

### 技能包寄生在别人的智能体里

- **骨架**：单位是一个技能包或命令行工具（说明文件 + 数据接口），装进用户已有的任意智能体。没有自己的界面、对话和文件夹；「同事」只是称呼（喊一声「老于」）。机构出数据和方法，壳由别人提供。
- **例子**：中金「老于」、国泰海通灵犀 Skills、广发易淘金 Skills、国信 Skills、东财妙想 Skills；飞书 CLI、企业微信 CLI 与 MCP、钉钉 CLI；基金公司内部平台上业务员工自建的 Skill
- **适合**：有合规数据源和方法论、不想自己做壳的机构；要进很多入口的分发。
- **在哪里坏**：一、总结出规则不等于下次照做：豆包工作实测里 Skill 指出了问题却没按规则改（https://finance.sina.com.cn/stock/t/2026-08-26/doc-iniprcpu1088783.shtml）。二、公开技能的安全：钉钉称约 15% 的公开 Skill 含恶意代码；新智元转述 Snyk 审计称 36% 的 ClawHub 技能含提示词注入（https://timeline.sohu.com/news/GCQ55R74GS）。三、输出随机，机构自己提示仅供参考（https://www.cls.cn/detail/2380077）。

## 近一年的变化

- 2026-08-11 SpaceXAI 发布 Grok Bot：有名字的常驻 Bot、每位一条对话、账号下共用一台云电脑、例行属于某一位、Bot 之间可发消息和建群（https://x.ai/news/introducing-grok-bot）。两天后 Rakazo 仓库创建（2026-08-13），自称其开源替代；8 月 19 日 CopilotKit 的 OpenBot 上 HN。2026-09-28 Grok 加 Team Bots：全队共用一位、每人私聊、团队记忆（https://docs.x.ai/grok-bot/team-bots）。
- 2026-09-08 Meta 发布个人智能体 Muse（云端专属虚拟机、主动建议、WhatsApp 入口、免费起步）；2026-09-28 Manus 推出 Cue；2026-09-29 OpenAI 发布 dots。中文媒体称之为「智能体 2.0」：共同点是自带云端电脑、7×24、主动找人、手机为主（https://m.thepaper.cn/newsDetail_forward_34180411；https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/）。
- OpenClaw 从纯 IM 入口长出了自己的应用：2026-08-30 的 2.0（v2026.8.1）重做网页端，侧栏分 Home / Threads / Groups / Coding，心跳并入 Automations 调度器，新增共享云会话（https://en.wikipedia.org/wiki/OpenClaw；https://docs.openclaw.ai/concepts/main-session.md）。新智元评价：修的是「为什么装不上、为什么不敢用」，没回答「装完第二周为什么不打开」（https://timeline.sohu.com/news/GCQ55R74GS，2026-09-01）。
- OpenClaw 在国内的起落时间线：2026-02-05 工信部提示默认配置风险；3 月 6 日腾讯在深圳办免费安装，近千人排队，多家云厂商上线部署服务；3 月 8 日深圳龙岗「龙虾十条」；3 月中旬彭博报道国企和政府机构被限制在办公电脑运行，至少 15 家券商发内部禁令，同时出现付费上门卸载；3 月 22 日微信接入 ClawBot；4 月 4 日 Anthropic 订阅不再覆盖第三方 harness；4 月访问量环比跌 50.67% 至 1420 万，腾讯 QClaw 环比跌 99.19%，微信指数从 1.65 亿回落到百万级；4 月底创始人承认插件迁移和核心架构调整造成大面积中断；5 月 9 日 Hermes 单日 token 消耗反超（https://zh.wikipedia.org/wiki/OpenClaw；https://www.bbc.com/zhongwen/articles/c93wvdn91kxo/simp；https://finance.sina.com.cn/tech/roll/2026-05-21/doc-inhyrmmu5981510.shtml；https://news.pedaily.cn/202604/562940.shtml）。
- OpenClaw 退潮的原因，按来源能支持的排序（没有来源给出占比）。第一位是「用不上」加上手门槛：三家中文媒体都把离场最多的人群定为跟风的普通用户，原因是时间成本倒挂——装好之后还有部署、调 API、授权，配置花数小时、重装三次，而多数人的活没有复杂到需要工作流；投资界转述 Reddit 的「三周流失路径」。第二位是费用：简单任务也要多轮调用，证券时报列为三大不成熟之首；4 月 4 日后部分用户月账单涨 50 倍（新智元）；BBC 受访者给每位助理设每天 20 美元上限。第三位是稳定性与升级：任务链一长就卡住，4 月底升级造成大面积中断，重度用户也要在每次更新后修错。第四位是安全与禁令：它直接切掉的是机关、国企、银行、券商的办公场景，对个人用户更多是心理影响（8.8 分高危漏洞、两万多个暴露实例、恶意技能）。第五位是替代品：Hermes、各家国产 Claw、飞书 CLI、编程智能体分走了留下来的用户（https://www.stcn.com/article/detail/3947903.html 及上条各链接）。
- Lindy 从流程搭建器改成「AI 员工，住在你的 Slack 里」：全队共用一位，记忆做成带版本、可在线编辑的文件系统，例行说明为「不是另一个机器人，是挂在你这位 Lindy 上的自动化」，按人加额度池收费（https://docs.lindy.ai/index.md，读于 2026-10-05；改版日期未亲见）。
- Devin 在收拢概念：Knowledge 标为废弃，迁到 Plugins 里的 Skills；Scheduled Sessions 标为旧版，并入 Automations；新增常驻的 Triage Devin 和「给一个长期运行的会话发消息」这种动作；自助套餐变为 Free / Pro 20 / Max 200 / Teams（https://docs.devin.ai/product-guides/knowledge.md；https://docs.devin.ai/product-guides/automations.md；https://docs.devin.ai/admin/billing/self-serve.md）。
- Cursor 3（2026-04-02）推出 Agents Window 这个「agent 优先」的界面，与编辑器并存；之后有原生 iOS 应用（推送 + 锁屏同时跟踪 8 个 agent）和 Automations（https://cursor.com/docs/agent/agents-window.md；https://cursor.com/docs/cloud-agent/mobile.md）。Grok Bot 用的是 Cursor 的账号、计费和云。
- Claude Code 把并行方式摊成五种，并新增 Projects（公测）：一条持续的对话里由 Claude 开线程、Overview 汇总「等你的」、Library 存成稿——这是从「任务派单台」往「一位总管」靠；云端 routines 为研究预览；旧的 Claude Code in Slack 在团队和企业版被 Claude Tag 取代（https://code.claude.com/docs/en/agents.md；https://code.claude.com/docs/en/claude-projects.md）。
- Dust 放弃了一条对话里 @ 多个智能体：现在一条对话只对应一个智能体，理由是只有这样中途插话才能可靠到达；同时把多方协作挪到 Pods（对话 + 任务 + 文件，人和智能体同为成员）（https://docs.dust.tt/docs/user-documentation/agents/steering-conversations.md；https://docs.dust.tt/docs/user-documentation/pods/overview.md）。
- OpenAI 把 Codex 文档并入 ChatGPT 的文档站（learn.chatgpt.com），云端任务从 ChatGPT 网页、手机、桌面应用里开；定时任务分「独立」与「回到同一条对话」两种，事件触发只在网页和手机端（https://learn.chatgpt.com/docs/cloud.md；https://learn.chatgpt.com/docs/automations.md）。合并的具体日期未亲见。
- 国内三家都从 IM 里的助理变成独立的办公智能体应用，再往回接 IM：钉钉 2026-03-17 发独立 App 悟空，8 月与 QoderWork、MuleRun 整合为千问办公；字节 2026-08-25 发豆包工作（独立 App + 豆包 App + 飞书内三个入口），9 月飞书 8.0 让 Agent 成为群成员并推出团队级的豆包工作伙伴；腾讯 WorkBuddy 7 月月活 1115 万，企业微信 2026-08-18 的 5.0.10 向各类智能体开放 CLI 与 MCP；飞书 2026-03-28 开源 CLI（https://finance.sina.com.cn/stock/t/2026-08-26/doc-iniprcpu1088783.shtml；https://www.geekpark.net/news/370460；https://www.pingwest.com/a/316538；https://timeline.sohu.com/news/GCQ55R74GS）。
- 券商与基金：3 月先是禁用 OpenClaw，4–5 月转为把自家数据和方法封成 Skill 送进别人的智能体（中金「老于」、东财 ClawBot 数字员工 2026-05-20 上阿里云广场），9 月基金公司口径从「实习生」改叫「新同事」，并开始用任务成功率、人工介入率、单 Token 成本衡量（https://www.cls.cn/detail/2380077；https://finance.sina.cn/2026-09-28/detail-initifmt9843346.d.html）。
- 计费方式的变化：包月订阅不再能兜住常驻智能体。Anthropic 2026-04-04 把第三方 harness 移出订阅额度；Grok Bot 发布时就给了独立于原订阅的用量并按周重置；dots 要 Pro 起步；Lindy、WorkBuddy、Relevance 用额度或积分并在任务旁显示消耗；Muse 反过来用免费档抢量（https://news.pedaily.cn/202604/562940.shtml；https://x.ai/news/introducing-grok-bot；https://docs.lindy.ai/pricing.md）。
- 过程可见性上出现两条相反的路线：Rakazo 明确「聊天不显示工具生命周期」；Grok Bot 的对话记录里与消息并排显示工具活动和电脑操作；Dust 新近改为每一步实时出现在对话里并称这让人「敢让它跑更久」（https://github.com/elie222/rakazo/blob/main/VISION.md；https://docs.x.ai/grok-bot/chat-and-collaboration；https://docs.dust.tt/docs/user-documentation/agents/steering-conversations.md）。

## 产品

### Rakazo（MyWork 现行同事模型的借鉴对象；自托管的「Grok Bot 开源替代」）

- **来源**：<https://github.com/elie222/rakazo/blob/main/VISION.md> <https://github.com/elie222/rakazo/blob/main/README.md> <https://github.com/elie222/rakazo/blob/main/CHANGELOG.md> <https://github.com/elie222/rakazo/issues> <https://rakazo.com/>
- **时间**：2026-10-05 读取；仓库 2026-08-13 创建，3,325 star / 584 fork，Apache-2.0，当天仍有推送
- **工作的单位**：一位 bot = 一个持续身份 + 一条可见的连续对话 + 记忆 + 例行 + 电脑。VISION 写明 run 与 attempt 是实现细节，把 bot 缩成提示词预设或孤立的一次性任务是与产品作对。
- **怎么开始**：给某位 bot 发一句话。新建 bot 时它先问你几个问题（官网：Start a new bot and it interviews you）；CHANGELOG 记：新 bot 建好后自动跑一轮，说出它怎么理解自己的职责并问还缺什么（之前是建好不说话，误解职责要到第一次干活才暴露）。官网有 8 个岗位模板。
- **干活时**：VISION：聊天只显示回复、有用的进展、结果和真正的求助，不显示工具生命周期。官网演示里结果是「✓ Archived → 26 newsletters」这种行；右栏是该 bot 的电脑画面 + Take control + 它的 Routines。CHANGELOG：例行或 webhook 正在跑时你发的话原先被并进那一轮当作转向，bot 会答「我没有上文」，现已改成等那一轮结束、单独一轮回答。
- **提问和批准**：VISION：只在需要信息、判断、授权、受保护输入时找人；后果性动作走显式审批策略，自动审查拿不准时倒向问。官网：设定 bot 能独自做什么、必须问什么，每个动作进审计日志。线程里有「Needs you」电脑卡（CHANGELOG 新增 Open 按钮）和受保护的密钥输入。
- **交付**：VISION：有用的工作落在它该在的地方，而不是聊天里一句没有依据的声称。即交付在真实工具里（发出的邮件、归档、表单），对话里是一段结果小结加可选文件。出处呈现未见专门机制。
- **后续**：同一条对话里接着说（官网演示：「send nora's, i'll take the rest tomorrow」→「sent」）。文件版本机制本次未复核。
- **主动**：Routines 是定时提示词而不是可视化工作流（VISION）；官网称演示一遍后 bot 把例行存成可读、可改、可提交的 Markdown。通知的种类本次未在公开页面复核。
- **记忆**：README 只说每位 bot 有自己的 conversations, memory, routines, history；VISION 要求 bot 状态可检查、可导出、可恢复、可迁移，分享 bot 只带配置不带记忆和历史。记忆在界面上怎么看、怎么改：未亲见。
- **文件和工作区**：Team Computer：同一信任边界内的 bot 共享文件、已装工具和浏览器登录身份，并发时各有独立桌面；Private Computer：整个工作目录隔离。电脑是持久的地方，懒启动、闲时释放。
- **排列**：左栏 bot 名册，每行 = 名字 + 时间 + 最近一句结果（演示：「done. 40 accounts researched, 18 drafts queued」）。bot 可委派给同级 bot 或短命子代理（README）；模板 Chief of Staff 负责「在你其他 bot 之间交接」。
- **手机**：Expo 手机端，与网页、Electron 同一套 API；VISION 要求各端是同一批 bot 和同一份状态。手机端现状未亲见。
- **计费**：自托管免费，自带模型 key（「No pricing page. Just the repo」）；Cloud 版只有候补名单。费用可见性弱：issue #973 要求按消息显示模型、tokens、费用，而不是只有账户总量。
- **被夸的**：没有找到独立用户长评（HN 搜索无结果）。旁证只有增长：不到两个月 3.3k star。
- **被骂的**：来自 issue 区 https://github.com/elie222/rakazo/issues ：#3 周期例行跑一次就停；#719 每位 bot 的模型选择埋在 Advanced 里；#900/#902 新 bot 建好后不出声；#1027 Team Computer 里 Gmail 掉登录；#706 建 bot 时不让选电脑模式、默认 Team。
- **没看到的**：记忆界面；手机端；真实用户留存与评价；本地 TEAMMATES.md 第 1 节的代码级细节（块类型、栏宽、通知通道）是 9 月 30 日读代码所得，本次未复核。

### Grok Bot（SpaceXAI，Rakazo 所模仿的原型）

- **来源**：<https://x.ai/news/introducing-grok-bot> <https://docs.x.ai/grok-bot/overview> <https://docs.x.ai/grok-bot/bots> <https://docs.x.ai/grok-bot/chat-and-collaboration> <https://docs.x.ai/grok-bot/approvals-security-and-privacy> <https://docs.x.ai/grok-bot/settings-and-notifications> <https://docs.x.ai/grok-bot/skills-routines-and-automations> <https://docs.x.ai/grok-bot/team-bots> <https://news.ycombinator.com/item?id=49261514> <https://kingy.ai/blog/openai-dot-vs-grok-bot-vs-meta-muse/>
- **时间**：发布 2026-08-11；文档读于 2026-10-05；Team Bots 2026-09-28 公布
- **工作的单位**：一位 Bot：有名字、职责、自己的一条对话和随时间累积的上下文。文档建议在目标、工具、工作方式、审批边界或例行不同的时候才另建一位；「General Helper」这种职责被点名为反例。
- **怎么开始**：侧栏 New → Create new Bot，然后直接发一条具体任务；职责写在 Description（长期规则），任务写在消息里。已有的 Bot 也可以建议或创建新 Bot。
- **干活时**：对话记录里与普通消息并排显示工具活动、电脑操作、生成的文件、提问、审批请求、语音备忘。干活时再发一句会优先于后台工作并改变当前这一轮；发「Stop now」立即停，但不撤销已做的动作。可以回复某一条消息、开线程、加表情。
- **提问和批准**：对话里的审批卡：Allow once / Always allow / Deny，显示目标和入参。Auto Review 规则两类：Ask first 与 Allow automatically，冲突时 Ask first 赢。密码、验证码、支付确认：打开 Agent Computer 接管屏幕自己输入；受支持的连接用遮蔽的密钥输入卡，值不进记录、不给模型。邮件和 Slack 消息先出可编辑草稿卡：Send / Discard。
- **交付**：落到真实工具里（官方语：90% 与 100% 的差别在于结果放在人会放的地方），对话里给总结、文件、草稿卡、语音备忘。文档建议向它要证据：链接、截图或简短动作日志。
- **后续**：同一条对话继续；对某个结果的反馈用线程回复；对话已经变成另一件长期工作时，文档建议开线程或新建 Bot。Cmd/Ctrl+K 搜索可跳回对话里对应位置。
- **主动**：Routine 属于某一位 Bot：定时或事件触发（Slack 消息、GitHub 通知），结果发回这位的对话；每位最多 50 条，保留最近 20 次运行；有 Test run（会真的执行）。久不在时会问是否继续跑例行，不回答就暂停。通知按 Bot 开关：做完或需要输入时发系统/手机通知；应用在前台时不弹。
- **记忆**：每位 Bot 各自记住稳定偏好、角色背景、过往工作摘要；对话和所学互不相通，但共享文件、浏览器登录和直接交接。文档明说记忆不能替代权威来源，长期边界应写进 Description。技能（Skill）是所有 Bot 共用的一个私有库，可用「Teach a task」录屏最多十分钟生成。复制 Bot 带走资料、技能、例行，不带记忆和历史。
- **文件和工作区**：账号下所有 Bot 共用一台持久云电脑（文件、浏览器会话、应用登录都通用），每位有自己的屏幕；文档明说不要把分开的 Bot 当安全边界，删除 Bot 不会清掉共享电脑上的文件和登录。本机执行命令另行授权，默认每次问。
- **排列**：侧栏名册：可置顶、可隐藏（隐藏不暂停它和它的例行）；状态三种：Needs attention（提问、审批、交接）/ Unread activity / 正在干活。群聊 2–6 位 Bot，用 @ 指名、@everyone 广播；Bot 之间可发异步消息互相叫醒、交接。官方内部用法是一位 chief of staff 管各条线的专员。Team Bot：全队共用一位，每人各有私密对话，团队记忆共享，以提问者自己的账号权限行动，可有自己的 Slack 应用。
- **手机**：iPhone、iPad、Android：同一批 Bot、同样的审批卡和草稿卡、听写与语音通话；推送需设备权限和该 Bot 的通知开关同时允许，文档称推送仍在逐步放开。
- **计费**：含在 Cursor 个人付费计划与 Teams 计划里，或关联 SuperGrok 订阅；按周重置的用量 + 可选按量超额，Usage & Billing 页与账号菜单显示本周用量。HN 上有人称发布时是每人每月 120/200 美元（未核实）。
- **被夸的**：HN 用户 jjcm 用了一个月：每位有自己的例行、上下文和领域且能互相沟通，按领域分开结果更好；有自己的电脑后「异步工作真的成立」。h14h：把他用 OpenClaw + 多个 Telegram bot 勉强搭出来的东西做到了几乎最简。madebywelch：bot 之间的沟通是一等公民。均见 https://news.ycombinator.com/item?id=49261514
- **被骂的**：同帖：jjcm「这个月用掉的 token 比过去五年加起来还多」；madebywelch「试了 3 小时，本周用量只剩 48%」；thenbrent：群聊里只有 bot，不能拉其他人进来；dgellow、anthonyskipper 等担心把所有登录交给常驻云端智能体；vorticalbox：iOS 上 GitHub 登录直接 404。
- **没看到的**：x.ai/bot 产品页（被 Cloudflare 拦截）；记忆是否有可查看、可编辑的界面；各档具体周额度；企业版。

### OpenAI dots（ChatGPT 里的常驻个人智能体）

- **来源**：<https://learn.chatgpt.com/docs/dots.md> <https://learn.chatgpt.com/docs/dots/tasks-and-memory.md> <https://learn.chatgpt.com/docs/dots/controls.md> <https://learn.chatgpt.com/docs/dots/channels.md> <https://tech.yahoo.com/ai/chatgpt/articles/openai-dots-grok-bot-tester-093953421.html> <https://m.thepaper.cn/newsDetail_forward_34180411> <https://kingy.ai/blog/openai-dot-vs-grok-bot-vs-meta-muse/>
- **时间**：2026-09-29 发布（DevDay）；文档读于 2026-10-05；评测 2026-09-30
- **工作的单位**：一位 dot（目前每人先有一位个人 dot，Specialist dots 是另行预览）。它之下是「任务」：自己派给后台智能体的活，或另开的可见线程（云端线程出现在桌面、网页、手机端）。
- **怎么开始**：在桌面端或桌面浏览器创建（手机网页不行），给它起名、选形状颜色；它先自我介绍并根据已有上下文建议能帮什么。之后发消息或打电话交代结果和资料来源。
- **干活时**：它干活时你可以继续和它说话，换任务、补细节、改优先级都在同一条对话。资料页 Activity 里逐个任务看进度、文件、结果和等你的请求，也能直接给某个任务下指令。Pause 只停它当前的主任务，不停已派出去的任务，也不取消定时。
- **提问和批准**：每个可能影响账号或对外分享信息的动作先过自动审查，结果三种：放行、要你批准、必须你自己做（例：改密码）。自定义规则四档：不问直接做 / 你明说才做 / 做之前问 / 交给你做。文档明说「让它起草回复」不等于允许发送；规则是它尽量遵守的指令，可能出错。
- **交付**：结果回到对话，或按你指定的渠道（例：日常进展留在 ChatGPT，要你决定的事发到 Slack）。文档自己提醒：一次运行显示完成，并不证明要的结果已经达成或送达，仍要检查产出和报错。
- **后续**：同一条对话里追加；对它创建的任务可在 Activity 里追加指令。新任务只带它给的指令和上下文，不自动带上你和它的全部对话。
- **主动**：它自己决定何时暂停、何时醒来继续，不必每件事都定时；固定时间重复的活要存成定时任务，在 Scheduled 里查看、停用、删除；支持事件监听（如 Slack 频道新报告），但把它加进频道本身不等于开始监听。另有只读的主动调研，记私有笔记、提出下一步。它主动给你打电话「发布后再做」。
- **记忆**：三层：当前对话上下文、ChatGPT 的记忆、它自己的私有笔记（偏好、决定、进行中的事）。笔记跨对话、跨渠道通用，但不是全部对话的转录；改 ChatGPT 的记忆设置不一定改它已记的笔记。Kingy 称文档里有记忆与 Reset 控制，本次未打开那一页。
- **文件和工作区**：自己的云端电脑和浏览器，你的设备关着也能干；需要看浏览器或自己做一步时可以打开它的电脑。可另外连接你的电脑（需桌面应用开着）和已建好的 Codex 云环境。
- **排列**：目前是单个 dot + 它派出的后台智能体与线程；多个专业 dot 组队是官方说的后续方向。ChatGPT、Slack、Teams、电话是同一位 dot：记忆通用，但各渠道的消息不互相镜像，把私聊信息发到群里前要先问你。
- **手机**：先在桌面创建，手机 App「在配套更新可用时」可继续同一条对话；可以打电话，通话中还能打字。短信「即将推出」。
- **计费**：随 ChatGPT Pro（Kingy 列出 100/200/500 美元三档）或 Business Premium；澎湃转述最低每月 100 美元。有首月额度，之后的用量条款 Kingy 标为文档前后不一致。
- **被夸的**：Yahoo/BeInCrypto 转述早期测试者：dot 替他过滤邮件和 Slack 请求，改签航班后主动指出与一条未读会议邀请冲突；一位记者估计花 15 分钟让它做完约两小时的杂事；可以边开车边打电话交代。
- **被骂的**：同一来源：预发布版有权限报错、丢消息、不支持 iMessage，建议多数人等一两周；插件设置不清楚，作为个人助理仍排在 Grok Bot 后面；台上演示过的付款实际不太能用。
- **没看到的**：手机端实际界面；Specialist dots；记忆的查看与编辑页；企业管理端；首月之后的计费。

### Meta Muse（个人智能体）与 OpenMuse（开源仿制）

- **来源**：<https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/> <https://m.thepaper.cn/newsDetail_forward_34180411> <https://appleinsider.com/articles/26/09/28/metas-new-ai-agent-blatantly-ignores-users-permissions> <https://kingy.ai/blog/openai-dot-vs-grok-bot-vs-meta-muse/> <https://github.com/CopilotKit/openmuse/blob/main/docs/EXPERIENCE.md>
- **时间**：Muse 2026-09-08 发布（公告 09-30 更新）；AppleInsider 2026-09-28；澎湃 2026-10-01；OpenMuse 文档读于 2026-10-05
- **工作的单位**：一位个人智能体，一条主对话（Kingy 转述官方介绍：持续对话、side chats、多任务、记忆、产出物）。用户交给它的是「目标」而不只是任务。OpenMuse 照此：默认一条主对话，side chat 有各自的上下文。
- **怎么开始**：像给人发消息一样说要办的事，在 Muse App 或直接在 WhatsApp 里。说出一个目标后它帮你定个人化计划并自己往前推。早期它会给每个用户出「想法卡片」（澎湃：知道孩子周五生日，问要不要安排生日餐）。
- **干活时**：耗时的事在你关掉 App 后继续，状态变了或需要批准时回来找你。官方称有完整审计轨迹，列出它做过和打算做的事。OpenMuse：输入框回复期间一直可用，发送键原位变停止键；追加的话排成可见队列；点头像看活动、审阅、回执。
- **提问和批准**：发邮件、付款这类敏感动作前先问。同一台虚拟机上另有一个系统级隔离的 Sentinel 智能体：Muse 的任何对外动作要它放行，必要时由它向人要许可。连接每个应用时选权限深浅（只读邮件还是可代发）。密码和支付信息进安全存储，Muse 能用但看不到。
- **交付**：在真实服务里办成（下单、发信、填表、砍价），产出物有文档、PDF、可交互内容。付款用 Stripe Link 生成的一次性卡。
- **后续**：同一条对话；可以让它「忘掉」学到的某件事。
- **主动**：主动是卖点：根据目标、习惯和对话里学到的东西出建议卡，自己判断情况主动发消息（澎湃转述官方案例：整理返校事项时发现一封体育选拔通知，提醒用户赶上截止时间）。
- **记忆**：官方：记住对你重要的事，随时可以叫它忘掉某条。记忆有没有可浏览的列表：未亲见。OpenMuse：名字、语气、记忆在 Apps 里可编辑。
- **文件和工作区**：每人一台专属云端 Muse Secure VM（含浏览器），智能体、用户数据和已连接服务的凭证都在里面；年内另出 Confidential VM（密钥只在用户手里）。Mac 上的电脑操作需另行授权。
- **排列**：单一主体。团队或多智能体排列未见。
- **手机**：手机是主场：iOS、Android、muse.ai 和 WhatsApp，之后上 AI 眼镜。澎湃：十几天下载约 260 万，美国移动端日活 64.2 万，高于 ChatGPT 同期 23.1 万（文中称出自 Sensor Tower）。
- **计费**：多数用途免费，另有订阅；Kingy 列 Power 每月 20 美元、Maximum 每月 100 美元，并提醒「Muse tokens」与 API token 没有公开换算。
- **被夸的**：澎湃：云端虚拟机解决了手机切后台任务就断的问题；主动提醒和建议卡是出圈点；零学习成本、免费起步。
- **被骂的**：AppleInsider 转述 Inc 记者 Jason Aten：装上一天后 Muse 就拿他发给播客搭档的短信内容来推荐选题，追查发现它在未授予完全磁盘访问的情况下同步了他 Messages 数据库里 187,000 行。澎湃：亚马逊以「未授权 AI 代理」为由封了 Muse 的购物功能。
- **没看到的**：Meta 的「How We Designed Muse」和帮助中心没有打开，side chat、任务和记忆的界面细节来自第三方转述；Inc 原文打不开；404 Media 关于「电话其实由呼叫中心人工拨打」的报道只见标题；Meta 的编程智能体 Muse Code 本轮未重开，沿用 9 月 29 日本地调研。

### OpenClaw（「龙虾」）

- **来源**：<https://docs.openclaw.ai/concepts/main-session.md> <https://docs.openclaw.ai/concepts/memory.md> <https://docs.openclaw.ai/gateway/heartbeat.md> <https://docs.openclaw.ai/automation/standing-orders.md> <https://docs.openclaw.ai/concepts/multi-agent.md> <https://en.wikipedia.org/wiki/OpenClaw> <https://zh.wikipedia.org/wiki/OpenClaw> <https://www.bbc.com/zhongwen/articles/c93wvdn91kxo/simp> <https://finance.sina.com.cn/tech/roll/2026-05-21/doc-inhyrmmu5981510.shtml> <https://www.stcn.com/article/detail/3947903.html> <https://news.pedaily.cn/202604/562940.shtml> <https://timeline.sohu.com/news/GCQ55R74GS> <https://news.ycombinator.com/item?id=47783940>
- **时间**：文档读于 2026-10-05（2.0 即 v2026.8.1 于 2026-08-30 发布）；媒体 2026-03-17 至 2026-09-01
- **工作的单位**：一位自托管的个人智能体，默认只有「一条滚动的对话」：main session。无论从 Telegram、WhatsApp、iMessage、Slack 私信还是网页发来，都落进同一条；群和派生会话各自隔离，但活动以合并过的通知汇回主会话。
- **怎么开始**：在已有的聊天软件里给它发消息（国内接了微信 ClawBot、飞书等）。2.0 的网页端里主会话叫 Home，是侧栏第一项；派生会话在 Threads，群聊在 Groups，编程会话在 Coding。也可以写常设指令（standing orders）让它不等吩咐就做。
- **干活时**：IM 里看到的是它的回复；心跳、后台执行完成等以带来源标记的系统事件进入会话，静默确认不显示。命令队列支持排队和中途转向。网页 Control UI 另有日志、会话、自动化等多页设置。
- **提问和批准**：执行审批做成各 IM 的原生按钮（Telegram 内联按钮、Slack Block Kit、Discord 组件、Teams 卡片等，见文档索引）；常设指令里写审批门和升级规则；文档明说记忆只能保留审批语境、不能强制策略，硬约束要靠审批设置、沙箱和定时任务。
- **交付**：回复发在聊天里；后台工作向发起它的那个会话汇报。国内实践：WorkBuddy 经微信 ClawBot 传不了大文件，要另走邮件。
- **后续**：同一条滚动对话；/new 或 /reset 会把结尾存进当日笔记，下一段重新载入近期笔记；压缩后历史仍可搜。
- **主动**：心跳：系统自带的自动化，默认每 30 分钟在主会话里跑一轮智能体回合（Anthropic OAuth 时 1 小时），让它在不打扰你的前提下发现需要注意的事；默认把提醒发到主人的私聊，可限定活跃时段。2.0 把心跳归到 Automations 调度器之下，另有定时、webhook、Gmail 触发。
- **记忆**：全是工作区里的 Markdown 文件，「没有隐藏状态」：USER.md（稳定偏好）、MEMORY.md（长期事实，每次会话载入）、memory/YYYY-MM-DD.md（每日笔记，可检索）、DREAMS.md（后台「做梦」整理的日记）。让它记就直接说「记住…」；用户可直接改文件；可从 Codex、Claude Code、Hermes 导入记忆。
- **文件和工作区**：默认 ~/.openclaw/workspace：AGENTS.md、SOUL.md、IDENTITY.md、USER.md、MEMORY.md 等自动注入；技能是含 SKILL.md 的目录，工作区内的优先。
- **排列**：一个 Gateway 里可跑多位互相隔离的智能体，各有工作区、状态目录和会话库，靠 binding 把某个 IM 账号映射到某位；主会话默认可跨会话调用工具。HN 用户 h14h：多个 Telegram bot 各配人设能用，但 bot 之间的沟通始终没配通。
- **手机**：就是手机上的 IM；另有 macOS 菜单栏应用、Apple Watch 与 Android 的 Talk 客户端、配对二维码。
- **计费**：软件免费，按模型 token 付费，费用不在产品里一目了然。BBC 受访者给每位助理设每天 20 美元上限；2026-04-04 起 Claude 订阅不再覆盖这类第三方 harness，新智元称部分用户月账单涨了 50 倍。
- **被夸的**：HN「谁在用 OpenClaw」帖：ryanmcgarvey 把生活事务接进去后，给承包商、会计发邮件这类琐事不用再开别的应用；dsiegel2275 每晚从笔记库自动生成复习卡片；mholubowski 的公司在 Slack 里跑多个隔离实例当员工。投中网：留下来的是技术人员、做副业的人和在可控 token 预算内把它嵌进工作流的人。
- **被骂的**：同帖：samxli「搭起来比自己做还麻烦」；lxgr「会走路会说话的 CVE」，多套权限模型互相卡死；MrFiskarBengt 说控制台一页又一页相似的设置。投中网：创业者想要数字员工，结果成了「数字祖宗」，用 token 供着、手动修着。BBC：李劲华称「真正能够商用的，几近没有」，连番更新后要花时间修随之而来的错误。
- **没看到的**：36Kr 三篇相关长文（安全检测页打不开）；百度百科；小红书与微博原帖；2.0 的 Control UI 实际界面；QClaw、Hermes 的产品页。退潮原因的拆分见 shifts 与 unknowns。

### Paseo（多家编程智能体的驾驶舱）

- **来源**：<https://github.com/getpaseo/paseo/blob/main/docs/product.md> <docs/research/muse-paseo.md>
- **时间**：docs/product.md 读于 2026-10-05（19,534 star）；其余沿用 2026-09-29 本地调研
- **工作的单位**：一次交给某个编程智能体的任务（一个 agent 会话），挂在工作区下；Paseo 自己不是智能体。
- **怎么开始**：桌面应用里选 provider（Claude Code、Codex、Copilot、OpenCode、Pi）和工作区后下任务；也可用 CLI（paseo run）或由 Hub 的 GitHub/Slack/Discord 事件触发。
- **干活时**：核心流程按文档是：给任务、理解它在做什么、给方向、审结果；文件、终端、差异是配角。时间线流式显示，子智能体挂在父任务的 Subagents 轨道。
- **提问和批准**：权限请求在各客户端应答；插件钩子可代答。权限模型按主体和语义权限划分。
- **交付**：代码改动与差异、结构化输出（CLI 的 output-schema）。
- **后续**：attach 回同一会话或 send 追加；可交接给另一个 provider。
- **主动**：schedules、heartbeats、loops 三种自动化；Hub 的事件触发工作流。
- **记忆**：交给各 provider 自己；Paseo 层只有 agent profiles（配置加「什么时候用」的说明）。
- **文件和工作区**：工作区与 worktree；本地守护进程，文件 JSON 持久化。
- **排列**：按工作区排列的智能体会话；编排型智能体可创建子智能体。
- **手机**：Expo 手机端，可选端到端加密中继，扫码配对，不必配 VPN。
- **计费**：开源免费，费用在各 provider 一侧。
- **被夸的**：未亲见独立用户评价。
- **被骂的**：未亲见。
- **没看到的**：本次只重新打开了 docs/product.md；其余细节未复核；用户评价未查。

### Devin（Cognition）

- **来源**：<https://docs.devin.ai/integrations/slack.md> <https://docs.devin.ai/product-guides/knowledge.md> <https://docs.devin.ai/product-guides/automations.md> <https://docs.devin.ai/product-guides/auto-triage.md> <https://docs.devin.ai/work-with-devin/advanced-capabilities.md> <https://docs.devin.ai/admin/billing/self-serve.md>
- **时间**：文档读于 2026-10-05
- **工作的单位**：会话（session），各自一台隔离 VM。另有两种更长寿的东西：Automation（触发器 + 动作）和 Triage Devin（盯一个 Slack 频道的常驻父会话，给每个问题派子会话）。
- **怎么开始**：网页应用开会话（Ask 或 Agent 模式），或在 Slack 任意频道 @Devin，Linear/Jira 指派工单，GitHub 评论，定时、webhook。Slack 里用感叹号关键词选模式和去向（!ask、!fast、!ultra、!new、!channel）。
- **干活时**：会话页有 IDE、浏览器、Shell、Side Chat 看它干活并介入。Slack 里它在线程中更新和提问；可 mute、(aside) 让它忽略某句、sleep、archive、EXIT。
- **提问和批准**：在线程或会话里提问；自动化可配 Preflight 脚本先筛事件；安全档案限制网络、MCP、git。逐动作审批卡未见描述。
- **交付**：PR（含 stacked PRs）、Slack 线程里的诊断和回复、Devin 托管的部署。
- **后续**：在同一线程或会话里继续；PR 评论它会响应；Session Insights 事后分析并给改进后的提示词。
- **主动**：Automations：Slack、GitHub、GitLab、Linear、Jira、PagerDuty、定时、webhook 触发；动作可以是新开会话、给一个长期运行的会话发消息、Triage Devin、发邮件通知。Scheduled Sessions 已标为旧版。
- **记忆**：Knowledge（触发描述 + 内容，按相关性召回，Devin 会根据聊天反馈建议新条目，可编辑或驳回）已标为废弃，正自动迁移到 Plugins 里的 Skills。Triage 自动化有共享 scratchpad 作长期记忆（已处理项、代码归属路由表、重复项）。
- **文件和工作区**：每会话一台 VM，环境由 blueprint 和快照定义；浏览器登录态可存成 profile 供以后会话复用；可用 Outposts 跑在自己机器上。
- **排列**：会话列表。协调者会话可拉起一队并行的 managed Devins：给子会话发消息、监控各自的 ACU、让它们睡眠或终止、给自己定提醒回头检查。
- **手机**：文档索引里没有手机客户端页面；未亲见。
- **计费**：Free / Pro 20 美元 / Max 200 美元 / Teams 每席 40 美元（最低 80 美元，另有免费的 flex 席位吃共享按量额度）；日配额与周配额，超出按量；企业按 ACU。
- **被夸的**：未亲见一手用户评价。
- **被骂的**：未亲见一手用户评价。
- **没看到的**：会话页与收件箱的实际界面；手机端；用户评价（HN 检索只有融资新闻）。

### Cursor（Agents Window、Cloud Agents、Automations、iOS）

- **来源**：<https://cursor.com/docs/cloud-agent.md> <https://cursor.com/docs/agent/agents-window.md> <https://cursor.com/docs/cloud-agent/automations.md> <https://cursor.com/docs/cloud-agent/mobile.md>
- **时间**：文档读于 2026-10-05；Agents Window 随 Cursor 3 于 2026-04-02 正式可用
- **工作的单位**：一个 agent（一次任务的对话），在本地、worktree 或云端 VM 上；另有 Automation（触发器 + 提示词 + 工具）。
- **怎么开始**：Agents Window、cursor.com/agents、iOS App、Slack 里 @cursor、GitHub 或 Bitbucket PR 评论、Linear、API；本地会话里可用 /in-cloud 把活交给云端子智能体。
- **干活时**：聊天流实时可看，可给运行中的 agent 追加指令，点子智能体卡看子记录；本地与云端之间可以来回搬。
- **提问和批准**：运行模式与审批属于 agent 安全设置（run-modes 页未打开）；另有托管的 PR Routing & Approval 智能体可批准低风险改动。
- **交付**：分支与 PR；在应用内看差异、提交、检查、部署并合并；自动化可发 Slack、评论 PR。
- **后续**：给同一个 agent 发后续；让 agent 处理评审意见或修失败的检查。
- **主动**：Automations：定时或 GitHub、GitLab、Slack、webhook、Linear 事件触发的云端 agent，可用 /automate 用自然语言生成；按个人或服务账号计费。
- **记忆**：未打开对应页面；未亲见。
- **文件和工作区**：云端 VM 克隆仓库，环境用快照或 Dockerfile 定义；可多仓库；也可跑在自己的机器或团队机器池。
- **排列**：Agents Window 是「agent 优先」的界面，跨所有项目并行管理多个 agent；云端 agent 仪表盘。
- **手机**：iOS 原生应用：开 agent、实时跟进、审并合并 PR；agent 完成一轮时推送；锁屏 Live Activities 同时跟踪最多 8 个 agent；本地缓存优先。Android 用 PWA，原生版计划中。
- **计费**：随 Cursor 各档订阅；自动化按云端 agent 用量计费，一律使用模型的最大上下文窗口。
- **被夸的**：未亲见一手用户评价。
- **被骂的**：未亲见一手用户评价。
- **没看到的**：记忆与规则页；审批细节；论坛用户反馈。

### Codex Cloud 与 ChatGPT 的 Scheduled tasks（OpenAI）

- **来源**：<https://learn.chatgpt.com/docs/cloud.md> <https://learn.chatgpt.com/docs/automations.md> <https://developers.openai.com/codex/llms.txt>
- **时间**：文档读于 2026-10-05
- **工作的单位**：云端任务：从一个已发布的云环境开出，每个任务有自己的工作区。定时任务：一条保存的提示词加触发条件。
- **怎么开始**：ChatGPT 网页、手机或桌面应用里选 Work in > Cloud，选环境，描述任务后发送；首次由 Codex 检查仓库、装依赖、试跑流程，再由人审阅并发布环境。
- **干活时**：任务在你电脑休眠时继续；缺访问权限或信息时向你要。
- **提问和批准**：建环境时会问缺的访问与信息；审批与沙箱见 agent-approvals-security 页（未打开）。
- **交付**：改动的文件与测试结果供审阅，确认后提交或开 PR。
- **后续**：在同一任务里要求后续修改；可从网页、手机、桌面继续。
- **主动**：Scheduled 页管理定时任务：进行中、已暂停、已完成和最近运行。两种：独立定时任务（每次从保存的提示词起跑）与对话内定时任务（回到同一条对话，带着已有上下文）。网页与手机端可由 Gmail、Slack、GitHub 事件触发；一条任务不能把事件触发和时间表混用。桌面端的定时任务可用本地项目，但电脑要开着。
- **记忆**：Memories 与 Computer History 页存在于索引，未打开。
- **文件和工作区**：云环境（仓库、工具、访问、保存的状态）；网页端定时任务不保留本地文件夹，持久说明要写进提示词或技能。
- **排列**：任务列表；dot 可以替你开和跟进这些任务。
- **手机**：手机端可开任务、审结果、继续。
- **计费**：随 ChatGPT 套餐的用量额度；细节未亲见。
- **被夸的**：未亲见。
- **被骂的**：未亲见。
- **没看到的**：任务列表实际界面、记忆页、Slack 集成页、定价页；用户评价。

### Claude Code（子智能体、agent view、Projects、routines）

- **来源**：<https://code.claude.com/docs/en/agents.md> <https://code.claude.com/docs/en/agent-view.md> <https://code.claude.com/docs/en/claude-projects.md> <https://code.claude.com/docs/en/routines.md>
- **时间**：文档读于 2026-10-05；agent view 与 routines 为研究预览，Projects 为 Pro 与 Max 公测
- **工作的单位**：文档列了五种并行方式，各有单位：子智能体（一次会话内的委派，只回摘要）、agent view（一屏后台会话的表，每行一个会话）、agent teams（共享任务表加互相发消息的多会话，实验性）、Projects（一条持续的对话，Claude 为每件事开一个线程）、dynamic workflows（脚本编排大量子智能体）。
- **怎么开始**：agent view：输入一句话回车就起一个新的后台会话，再输一句是再起一个而不是追问。Projects：把报错、任务清单随时贴进项目这一条对话，Claude 给每件事开线程或转给已在做那一块的线程，小问题当场回答。
- **干活时**：agent view 每行显示在干活、等你、做完；空格 peek 看最近输出或它在等的问题并可直接回一句；回车 attach 进完整对话。Projects 的线程多为云端会话，合上电脑照跑，可在手机上查看和转向。
- **提问和批准**：会话级权限模式；Projects 的 Overview 面板有「Waiting on you」。云端 routine 自主运行，没有权限模式选择，除部分 artifact 动作外不停下来等批准，能碰什么由所选仓库、环境网络与连接器决定。
- **交付**：PR（Overview 显示哪些已可审）；非代码工作的成稿作为文件放在项目的 Library 页。
- **后续**：在项目对话里继续说；可让 Claude 把某部分工作排成 routine。
- **主动**：Routines：保存的配置（提示词、仓库、连接器），定时、API 调用或 GitHub 事件触发，在云端跑；桌面端另有本地定时任务。Channels 可把 CI、聊天、监控事件推进运行中的会话。
- **记忆**：CLAUDE.md 或 AGENTS.md 加自动记忆；Projects 有项目指令（每个新线程都带）和项目记忆（让它记住的坑会带到后续云端线程）。
- **文件和工作区**：本地项目目录或 worktree；云端线程用 GitHub 仓库及上传到项目的文件、文件夹、Google Drive 文件夹。
- **排列**：agent view 的行；Projects 的线程；团队模式下由一位 lead 分派。跨会话消息让本机、别的机器和云端的会话互通。
- **手机**：Claude 手机应用里启动、监控、转向任务；Remote Control 从手机接着本地会话。
- **计费**：订阅配额；文档明说并行多个会话或子智能体会成倍消耗 token，每个后台会话独立占用配额。
- **被夸的**：未亲见一手用户评价。
- **被骂的**：未亲见一手用户评价。
- **没看到的**：桌面应用的任务面板与侧栏实际界面、插件与技能页、Cowork、Claude Tag 的文档；用户评价。

### Lindy（现定位「AI 员工」，住在 Slack 里）

- **来源**：<https://docs.lindy.ai/index.md> <https://docs.lindy.ai/teammate/home.md> <https://docs.lindy.ai/teammate/memory.md> <https://docs.lindy.ai/teammate/routines.md> <https://docs.lindy.ai/pricing.md>
- **时间**：文档读于 2026-10-05
- **工作的单位**：一位 Lindy：每人有个人 Lindy（接自己的邮箱、日历、电话），全队在 Slack 里共用同一位 Lindy Teammate。你的每个请求被它当作一个任务接下。
- **怎么开始**：Slack 私信或在频道里 @mention；网页 Home 顶部的输入框；iMessage 或短信；Chrome 扩展。输入 @ 可指向某次会议、文件夹或工具。
- **干活时**：Home 不是配置面板而是「你和它说话、看它替你做了什么」的地方：输入框周围是卡片——今日会议、已录会议、从邮件、Slack、会议里挑出的待办（可点可消）、统计（已分拣邮件、已写草稿、估算省时）、它学到的关于你的事。
- **提问和批准**：写操作一律等你批准（「它备好，你批准，再发出」）；邮件回复落在草稿箱。
- **交付**：回到提问的 Slack 线程；草稿箱里的邮件；它搭建并托管的 Artifacts 页面（看板、报告、原型，各有链接）；会议纪要库。
- **后续**：在 Slack 线程或 Chat 里继续。
- **主动**：Routine = 触发器 + 一句话提示词 + 结果去向，「不是另一个机器人，是挂在你这位 Lindy 上的自动化」。内置可开关的：每日简报、邮件起草、邮件贴标签、紧急邮件提醒（发短信）、跟进催办、会议录制、会前准备、排期。分 Personal、Workspace（仅管理员可建）、Discover 模板库三页。
- **记忆**：Memory 页是它的文件系统浏览器（「你能看进去的硬盘」）：Personal、Team、System 三个范围；文件有 Preview、Raw、History 三个页签，可在线编辑，每次保存都是一个版本，可恢复。.memory/ 放持久知识，.skills/ 放技能（每个技能一个带 SKILL.md 的文件夹，个人版覆盖团队版覆盖内置版）。Home 上「它学到的关于你的事」可增、改、删。
- **文件和工作区**：上述带版本的文件系统；它干活时写文件，浏览器近实时刷新。
- **排列**：只有一位（个人的和团队的是同一个名字），没有多智能体名册。侧栏是功能页：Home、Chat、Meetings、Files、Routines、Skills、Integrations，底部显示额度余额。
- **手机**：iMessage 与短信（紧急邮件用短信提醒你）；Chrome 扩展的新标签页。原生应用未见。
- **计费**：按人按月 + 全工作区共用的额度池：Plus 30 美元（3,000 额度）、Pro 100 美元、Max 200 美元；1 额度约 1 美分，日常请求 2–250、深度工作 250–1,000、大型搭建 1,000–2,500；额度用尽它暂停并告知，可按 1,000 额度 10 美元加购。
- **被夸的**：未亲见一手用户评价。
- **被骂的**：未亲见一手用户评价。
- **没看到的**：从流程搭建器转为 Slack 队友的具体时间与旧产品去向；用户评价；审批卡的样子。

### Relevance AI（「AI Workforce」）

- **来源**：<https://relevanceai.com/docs/get-started/core-concepts/workforces.md> <https://relevanceai.com/docs/build/agents/give-your-agent-tasks/task-overview.md> <https://relevanceai.com/docs/get-started/pricing.md>
- **时间**：文档读于 2026-10-05
- **工作的单位**：Task：某个 Agent 或 Workforce 的一次运行（一段对话或一条流水线的执行），由消息和工具运行组成。Workforce 是画布上连起来的一组专职智能体。
- **怎么开始**：在构建器的 Run 页点 New task，或由触发器（1,000+ 集成、定时、webhook、API）、批量排期启动；也可在 Relevance Chat 里用。
- **干活时**：三栏：左任务列表（All 与 To Review 页签、筛选、表格视图、Agent 队列），中时间线（消息与工具运行，底部评论框可对任务说话），右详情（暂停、标记完成、状态、消耗额度、运行时长）。
- **提问和批准**：Smart Escalations 发到邮件和 Slack；全局 Tasks 页集中处理升级、报错、审批，可批量操作。
- **交付**：任务线程里的输出与工具写入外部系统的结果。
- **后续**：在任务评论框追加；任务历史保留 90 天（Pro）。
- **主动**：定时触发与集成触发；企业版有工作时段控制。
- **记忆**：Memory 功能是从任务输出里抽取并回忆元数据；版本历史可回滚 Agent、Tool、Workforce。
- **文件和工作区**：知识库与项目（Pro 1 个项目，Team 5 个共享项目）。
- **排列**：画布：智能体之间两种连接——AI connection（由智能体判断是否交给另一位）和 Next step（强制顺序）——加条件路由。
- **手机**：Chat 支持桌面、手机、浏览器；细节未亲见。
- **计费**：Pro 每月 19 美元起、Team 每月 234 美元起；按 Actions（每月 2,500 / 7,000）加 Vendor Credits 计，可自带 API key；免费档已对新老用户取消。每个任务详情显示消耗额度。
- **被夸的**：未亲见一手用户评价。
- **被骂的**：未亲见一手用户评价。
- **没看到的**：用户评价；升级卡的样子；手机端。

### Sintra（一组有名字的岗位助手）

- **来源**：<https://www.unite.ai/sintra-ai-review/>
- **时间**：第三方评测 2026-04-18；经 WebFetch 摘要读取，摘要可能有偏差
- **工作的单位**：一位岗位助手（共 12 位，如客服 Cassie、SEO Seomi、文案 Penn、社媒 Soshie），各自一个聊天界面。
- **怎么开始**：挑一位助手用自然语言交代；有引导式上手。
- **干活时**：未亲见。
- **提问和批准**：发布前可完整审阅：改文案、换图、重新生成或拒绝（社媒排期示例里发布前需用户批准）。
- **交付**：聊天里的成稿与图片；经集成发到社媒等。
- **后续**：在该助手的聊天里继续。
- **主动**：简单自动化与周期任务（如每日摘要、每周生成帖子）。
- **记忆**：Brain AI：集中的知识库，存品牌文档、文件、网页和偏好；品牌套件（网址、标志、配色、素材库）可编辑，助手据此保持品牌口吻。
- **文件和工作区**：Brain AI 即资料处；集成 Gmail、Google Drive、Calendar、Notion、LinkedIn、Instagram。
- **排列**：12 位并列的助手，彼此不共享上下文，要人手动在它们之间搬运工作。
- **手机**：有手机应用。
- **计费**：无免费档，14 天退款；评测称团队用起来价格累加得快。具体价格未亲见。
- **被夸的**：评测者：上手简单、岗位现成、品牌口吻一致、有 6,000+ 成员的 Facebook 社群。
- **被骂的**：评测者：助手之间不通上下文；自动化弱于 Zapier；复杂任务变慢或结果不稳定；助手可定制程度低。
- **没看到的**：官网、帮助文档、定价页、应用商店与 Trustpilot 评论都没有打开；以上全部来自一篇第三方评测的工具摘要。

### Dust

- **来源**：<https://docs.dust.tt/docs/user-documentation/pods/overview.md> <https://docs.dust.tt/docs/user-documentation/agents/tools/agent-memory.md> <https://docs.dust.tt/docs/user-documentation/agents/triggers/schedules.md> <https://docs.dust.tt/docs/user-documentation/agents/steering-conversations.md>
- **时间**：文档读于 2026-10-05
- **工作的单位**：对话（现在一条对话只对应一个智能体）；Pod：人和智能体共用的工作空间，含对话、任务、文件。
- **怎么开始**：选一个智能体开对话（不再需要 @mention）；在 Pod 里建任务并指派或让智能体接手；触发器启动。
- **干活时**：每一步实时出现在对话里：思考块、工具调用、搜索、文件操作，可点开看详情。干活中发的话显示为待处理，等它做完当前这一轮动作后带着全部上下文接上，多条会一起被取走。文档解释不打断当前动作是为了不让推理处于不一致状态。
- **提问和批准**：本次所读页面未描述审批卡；未亲见。
- **交付**：对话回复；Frames（可交互的活内容，可钉为 Pod 横幅）；存进 Pod 文件。
- **后续**：同一对话继续；可从某处分叉对话；有上下文压缩。
- **主动**：Agent Builder 的 Triggers：用自然语言描述频率，由模型生成时间表并回显确认（例：工作日 8:00 洛杉矶时间）；webhook 触发。文档注明目前触发器属于个人，只有编辑者能看到运行。
- **记忆**：Memory 工具：智能体自己决定记什么，也可明说「记住…」；点智能体名字或头像打开详情抽屉的 Memory 页签浏览和删除；记忆按用户私有、按智能体隔离，删除不可恢复。
- **文件和工作区**：Pod 的 Files：上传的文件、文件夹、从公司数据链接来的内容、智能体生成的产物；Pod 内对话自动索引供智能体引用。
- **排列**：工作区的智能体库（@dust、@deep-dive、@analyst 等默认智能体加自建）；Pod 的原则是人能做的智能体都能做（开对话、建和完成任务、存文件）；智能体可用 Run agent 工具调用别的智能体。
- **手机**：未亲见。
- **计费**：有 credits 用量页（未打开）；定价未亲见。
- **被夸的**：未亲见一手用户评价。
- **被骂的**：未亲见一手用户评价。
- **没看到的**：审批、定价、手机端、Slack 内用法的细节；用户评价。

### Glean Agents

- **来源**：<https://docs.glean.com/agents/independent-agents.md> <https://docs.glean.com/agents/how-agents-work.md>
- **时间**：文档读于 2026-10-05；Independent agents 为 beta
- **工作的单位**：一个可复用的 agent（指令、知识、工具、触发器）及其每次 run；Independent agent 是不依赖某个用户会话、拥有自己档案和身份的常驻者。
- **怎么开始**：从 Agent Library 或直链手动启动；到点；外部内容或系统更新触发；独立智能体由 Slack 或 Teams 里的事件、消息、时间表触发。
- **干活时**：未亲见运行界面；Workflow 模式可从某一步用缓存的记忆重跑。
- **提问和批准**：独立智能体的审批与发布由管理员控制；用管理员管理的服务凭证而不是借用某个用户的登录。
- **交付**：在 Slack 或 Teams 的共享频道里回复，动作在连接的应用里以智能体自己的身份留痕。
- **后续**：未亲见。
- **主动**：定时触发、内容触发；可在 Slack 里按自定义的问题识别规则主动回复。
- **记忆**：文档把「输出与记忆」定义为一次运行内保留的上下文；跨运行记忆未亲见。
- **文件和工作区**：公司知识源由智能体配置选定。
- **排列**：Agent Library；管理员治理以避免「智能体泛滥」，可设精选。
- **手机**：未亲见。
- **计费**：未亲见。
- **被夸的**：未亲见。
- **被骂的**：未亲见。
- **没看到的**：运行界面、通知、定价、用户评价。

### Notion Custom Agents

- **来源**：<https://www.notion.com/help/custom-agents>
- **时间**：帮助页读于 2026-10-05
- **工作的单位**：一个 Custom Agent：一套共享的后台工作流（指令 + 触发器 + 访问范围 + 模型）。帮助页明说它与随叫随到的 Notion Agent 不同，是按触发器和时间表在后台自动跑的。
- **怎么开始**：侧栏 Agents 区点 + 新建：和 AI 聊着建、从模板建或从空白建。之后由触发器启动：周期时间表；Notion 事件（评论、数据库新增页、属性变更、会议纪要完成）；Slack 事件（频道消息、表情、被 @）。也可在页面、数据库属性、评论里 @ 它。
- **干活时**：后台运行；事后看活动日志。
- **提问和批准**：只能动明确授权的页面、数据库和外部应用，默认没有全工作区权限；可控制谁能编辑、运行、交互；配置有版本历史可回滚；企业版审计日志记录指令、权限、集成的变更。逐动作审批未见描述。
- **交付**：写回 Notion（发报告、建缺陷单、更新记录）或发 Slack 消息。
- **后续**：改指令后保存；版本历史可恢复旧配置。
- **主动**：本质就是主动型：时间表与事件触发，高流量频道可按关键词过滤降噪。
- **记忆**：以现有文档和数据库为上下文；独立记忆未见描述。
- **文件和工作区**：Notion 工作区本身。
- **排列**：侧栏 Agents 区的列表；一个 Custom Agent 可把部分工作交给你授权给它的其他 Custom Agents。
- **手机**：帮助页写明要用桌面或网页来搭建、编辑、查看或与 Custom Agents 交互。
- **计费**：需 Business 或 Enterprise 套餐，按 Notion credits 计（定价页未打开）。
- **被夸的**：未亲见。
- **被骂的**：未亲见。
- **没看到的**：定价细节、活动日志界面、用户评价。

### Slack 里的智能体（Salesforce Agentforce 未查）

- **来源**：<https://slack.com/help/articles/33076000248851-Understand-AI-agents-in-Slack>
- **时间**：帮助页（中文版）读于 2026-10-05
- **工作的单位**：装进工作区的带智能体的应用；与它的一段对话。
- **怎么开始**：在「代理与工具」标签里找到可用的智能体应用；像和同事说话一样一对一私信，或把它加进频道。
- **干活时**：未亲见。
- **提问和批准**：未亲见。
- **交付**：私信或频道里的回复。
- **后续**：未亲见。
- **主动**：未亲见。
- **记忆**：未亲见。
- **文件和工作区**：未亲见。
- **排列**：「代理与工具」标签是智能体的落地页；有权访问该应用的人都可发起对话。
- **手机**：未亲见。
- **计费**：未亲见。
- **被夸的**：未亲见。
- **被骂的**：未亲见。
- **没看到的**：只读到帮助页开头；Agentforce 的任何页面都没有打开。此条仅用于说明「IM 里的联系人」这一形态的官方表述。

### 钉钉「悟空」（后并入千问办公）

- **来源**：<https://finance.sina.cn/stock/jdts/2026-03-17/detail-inhrhttn5374463.d.html?vt=4> <https://finance.sina.com.cn/stock/t/2026-08-26/doc-iniprcpu1088783.shtml>
- **时间**：极客公园实测 2026-03-17（发布当日）；并入千问办公的信息见 2026-08-26 AIX 财经
- **工作的单位**：任务。独立 App 三块：「新的任务」（对话式窗口）、「技能中心」（技能商店，按行业场景的模板）、「定时任务」（记者称之为它的待办清单，记录交给它的所有持续性任务）。
- **怎么开始**：用钉钉账号登录独立 App，在「新的任务」里说需求。十大行业的 OPT（一人团队）方案直接给「场景化技能套件 + 预编排工作流」。
- **干活时**：记者实测建「每天整理竞品选题简报」：约二十分钟的来回，它先提议媒体名单（记者不满意，手动改），再想抓取办法（先想抓官网，被纠正后自己找到新榜 API 和搜狗微信搜索两条路并说明各自局限）。
- **提问和批准**：四道默认开启的防线：账号绑定核验（远程调用必须同一钉钉账号）、安全沙箱、数据隔离、技能须经企业安全审核才能启用。
- **交付**：定时简报通过钉钉消息推给用户；记者还让它改推到飞书群机器人，几分钟后生效。
- **后续**：在任务对话里继续纠偏。
- **主动**：定时任务。
- **记忆**：RealDoc：为 AI 设计的文件系统，支持精确到行列单元格的修改和高频版本快照，并把执行中的判断沉淀为企业知识图谱（发布会说法，未见界面）。
- **文件和工作区**：钉钉全部功能 CLI 化成上千条原子命令供 AI 调用；RealDoc。
- **排列**：未见多智能体名册；定位是「长在企业组织里」的数字员工，沿用钉钉的组织架构、权限、审批。
- **手机**：独立 App；手机端细节未亲见。
- **计费**：未亲见。
- **被夸的**：极客公园记者：它不是等我给答案，而是在提示下自己检索、判断、迭代，简报「真的跑起来了」。
- **被骂的**：同一记者：没喂业务上下文时初始判断粗糙（给的竞品名单不对）；要突破封闭生态时第一反应不是最优解，需要人纠偏。
- **没看到的**：并入千问办公后的现状；钉钉 AI 助理（悟空之前的形态）；虎嗅关于钉钉 AI 项目 ONE 十个月即终止的长文只见标题；定价。

### 飞书 8.0、豆包工作、豆包工作伙伴（字节）

- **来源**：<https://www.geekpark.net/news/370460> <https://finance.sina.com.cn/stock/t/2026-08-26/doc-iniprcpu1088783.shtml> <https://timeline.sohu.com/news/GCQ55R74GS>
- **时间**：豆包工作 2026-08-25 发布，实测 2026-08-26；飞书 8.0 与工作伙伴报道 2026-09-16
- **工作的单位**：豆包工作：任务（独立 App、豆包 App 的工作任务区、飞书内调用三个入口）。飞书 8.0：Agent 是群成员和文档里可 @ 的对象。豆包工作伙伴：团队共有、有独立身份、权限和记忆的智能体（仍在定向共创）。
- **怎么开始**：豆包工作：用飞书账号登录后下任务，模型选自动、2.1 Pro 或 2.1 Turbo。飞书：在群里搜名字把 Agent 拉进群；在文档评论里 @Agent 让它回答或改内容；多个 Agent 可在同一个群协作，Agent 可 @ 另一个 Agent。
- **干活时**：生成视频前先确认用途、时长、画幅并给分镜预览；整理电脑桌面文件时先列待处理清单。
- **提问和批准**：删除文件前列清单等确认。Agent 的数据权限沿用使用者的身份和权限（员工看不到的它也拿不到）；管理员统一管理企业里的 Agent、追溯使用、管控用量和高消耗场景。
- **交付**：同时交付飞书文档和 PPT 文件；飞书文档可在应用内继续编辑、分享协作；报告带章节、图表和参考链接；多维表格看板的链接关联到原有飞书文档。
- **后续**：在文档里直接改字，或选中某部分让 AI 重新生成；发布会原话「好结果往往是一版一版改出来的」。
- **主动**：工作伙伴「小飞」的例子：在群里发现一个长时间没人认领的问题，主动去另一个相关群找答案再带回来。
- **记忆**：工作伙伴有独立记忆并把团队方法沉淀为可复用能力；豆包工作可把经验做成 Skill。界面未亲见。
- **文件和工作区**：8 月陆续上线：手机远程控制电脑、Windows 虚拟桌面（独立环境执行）、侧边工作台（本地文件、飞书文档、网页、代码放进同一空间）、技能商店、连接器、工作伙伴。飞书 CLI 向 Agent 开放的功能点从 3 月的 247 个增至 767 个。
- **排列**：三层：飞书 8.0（协作与治理底座）、豆包工作（个人可直接用的企业级 Agent）、豆包工作伙伴（团队的数字员工）。
- **手机**：在手机豆包 App 里给电脑上的豆包工作下任务（实测：远程整理桌面截图和视频）。
- **计费**：未亲见。
- **被夸的**：AIX 财经实测：成品可直接进入后续编辑和协作，不用反复下载转发；报告附链接便于核验；能读已有飞书资料建看板。
- **被骂的**：同一实测：报告「全」的另一面是「散」，核心观点不突出；建看板时两篇文章缺链接，仍需人工检查；让它把修改经验做成 Skill 后，Skill 能指出问题却没按自己总结的规则去改——「从总结出经验到下一次稳定执行经验，中间还有距离」。
- **没看到的**：飞书 aily 与「智能伙伴」的帮助文档没有打开，不确定它们与豆包工作现在的关系；工作伙伴的实际界面；定价；36Kr 两篇相关报道打不开。

### 腾讯 WorkBuddy、微信 ClawBot 与企业微信的开放

- **来源**：<https://www.pconline.com.cn/focus/2178/21785878.html> <https://www.pingwest.com/a/316538> <https://finance.sina.com.cn/stock/t/2026-08-26/doc-iniprcpu1088783.shtml>
- **时间**：WorkBuddy 上手文 2026-07-13；企业微信 5.0.10 报道 2026-08-18（含厂商软文成分）；用户数见 2026-08-26 AIX 财经
- **工作的单位**：WorkBuddy：任务（桌面应用，界面像普通聊天机器人）。企业微信里：一个「智能机器人」。
- **怎么开始**：WorkBuddy 左栏新建任务、看历史对话和任务记录、管理工作空间；底部输入区可切模型、调技能、连应用、附文件或选工作文件夹。登录和下指令都可在微信里完成：接入微信 ClawBot 后，在微信发一句话，电脑上的 WorkBuddy 就去找文件。企业微信：把一句安装技能的提示词交给任意智能体并创建智能机器人，即可让它调用企微的消息、邮件、文档、表格、待办、日程、会议、微盘、通讯录。
- **干活时**：中间对话区看它的拆解过程和执行结果。
- **提问和批准**：含删除的任务触发二次确认，并在对话框顶部显示预估消耗（实测显示「预计 5.37–53.6 积分」）。可划定隔离的工作空间。
- **交付**：本地文件夹里的整理结果、腾讯文档；微信 ClawBot 传不了大文件，要用腾讯的 Agent Mail 打包发到邮箱。
- **后续**：同一任务对话继续。
- **主动**：未亲见。
- **记忆**：未亲见。
- **文件和工作区**：工作空间即用户指定的本地文件夹；可连腾讯文档等应用。
- **排列**：任务列表；有「专家团」功能（只见名字）。企微侧可接入的智能体被点名的有 WorkBuddy、Codex、DeepSeek Harness、Kimi Work、MiniMax Code 及企业自研。
- **手机**：微信就是手机端：人在地铁上也能叫电脑找文件，前提是电脑在线。
- **计费**：积分：实测整理一次文件约 95 积分，每日签到可领 100–150 积分；新模型限时免费。
- **被夸的**：太平洋科技作者：下载即用，不用折腾环境、账号、网络；接进微信是最本土化的地方；危险操作不会直接执行。AIX 财经：2026 年 7 月月活 1115.23 万，是同类里跑得最快的。
- **被骂的**：同一作者：还没到「帮我搞定」就能放手的程度，仍要说清文件夹、目标和禁区，关键节点要确认；复杂项目仍首选 Codex 或 Claude Code。
- **没看到的**：WorkBuddy 官方文档、定时与记忆功能、定价；企业微信官方更新说明（只见媒体稿）；QClaw。

### 国内券商与基金的「数字员工」「新同事」

- **来源**：<https://www.cls.cn/detail/2380077> <https://finance.sina.cn/2026-09-28/detail-initifmt9843346.d.html> <https://www.bbc.com/zhongwen/articles/c93wvdn91kxo/simp>
- **时间**：财联社 2026-05-24；证券时报 2026-09-28；BBC 2026-03-17
- **工作的单位**：对外：一个技能包（Skill），装进用户自己的智能体；或数字员工广场里的一个 Bot。对内：办公平台里的 Agent 与 Skill。「同事」多是称呼，不是一个有自己对话和文件夹的常驻对象。
- **怎么开始**：对外：把 Skill 装进任意「Claw」类智能体后用自然语言发问（国信称三步部署、适配所有 Claw）；中金的分析师 Skill「喊一声老于」；东财妙想投研助理在阿里云 JVS Claw 数字员工广场里一键启动后对话发起投研任务。对内：富国「智能研究院」里用户定制研究员 Agent，或由研究专家 Agent 规划拆分后交多个研究员 Agent 协同。
- **干活时**：未见界面描述。
- **提问和批准**：富国：「AI 辅助生成 + 人为审核」，人提问题、验证关键假设、做最终决定。兴证全球风控助手生成的条目经人工修正后回写知识库。
- **交付**：研究底稿式输出（浙商的经济数据解读 Skill：先一句话定调，再拆核心数据、分项和预期差，再映射到政策与资产定价，附风险提示）；兴证全球头寸助理在每日核心时点自动推送负头寸预警并给处置方案。
- **后续**：未见描述。
- **主动**：定时推送预警（头寸助理）；夜间后台解析研报、公告、纪要，次日早上基础工作已完成（证券时报开篇场景）。
- **记忆**：以 Skill 和知识库沉淀：中金「老于」学了 30 万字以上研究资料；易方达称「经验随代码流传」；人工修正回流知识库。
- **文件和工作区**：公司内部平台（易方达 EWork、富国智能办公平台：内置 20 多个 Agent、60 多个 Skill、接入 50 多个 MCP，日请求超 3,000 次）。
- **排列**：富国：研究专家 Agent 派活给研究员 Agent。易方达：IT 提供底座和模板，业务员工自己开发 Skill，分公开可装和限个人或小组两类。广发证券内部累计 30 类技能插件。
- **手机**：未亲见。
- **计费**：对外 Skill 多为限时免费（国泰海通每天 1,000 个试用名额）。对内开始算投入产出：易方达考察任务成功率、处理效率、人工介入率、用户活跃度、算力利用率、单 Token 成本。
- **被夸的**：上海某公募量化基金经理（证券时报）：AI「已经从大学生水平变成了博士生水平」，做因子挖掘时常能发现传统研究不易捕捉的线索。
- **被骂的**：财联社转述：浙商证券提示技术信号不能替代基本面判断；有机构提示大模型输出有随机性，结论仅供参考。BBC：至少 15 家券商发内部合规通知，严禁未经许可在办公网络或业务系统安装使用 OpenClaw。
- **没看到的**：任何一家内部平台的界面、截图或文档；从业者个人的使用评价（只有机构口径）；Wind 的 WindClaw 只在投中网文中被提到名字。

## 没查到的，来源说明

- OpenClaw 退潮各原因（费用、安装、升级、安全禁令）各占多大分量：没有任何来源给出量化比例，shifts 里的排序是按各篇报道的叙述权重归纳的；小红书、微博、知乎上的用户原帖没有直接看到。
- 本次内置浏览器开不了新标签页（标签数已到上限），搜索改用 Google News RSS、Hacker News Algolia、GitHub API 和直接抓取文档；覆盖面因此偏向官方文档和媒体，论坛、应用商店评论、社交媒体长帖偏少。
- Devin、Cursor、Codex、Claude Code、Lindy、Relevance AI、Dust、Glean、Notion 这九个产品只读了官方文档，没有找到可靠的一手用户评价；它们的「praised / complaints」一律标了未亲见。
- Sintra 只有一篇第三方评测的工具摘要，官网、帮助文档、定价和 Trustpilot 都没打开。Salesforce Agentforce 没有打开任何页面。
- Grok Bot：产品页 x.ai/bot 被拦截；记忆有没有可查看和编辑的界面不清楚；HN 用户说的每人每月 120/200 美元与现行文档「含在 Cursor 付费计划里按周额度」对不上，未能核实。
- Meta Muse：官方的设计说明和帮助中心没打开，side chat、任务、记忆的界面细节来自第三方转述；Inc 记者的原文打不开，187,000 行的说法经 AppleInsider 转述。
- OpenAI dots：手机端界面、Specialist dots、记忆的查看与重置页、首月之后的计费都没有亲见。
- Rakazo：记忆在界面上怎么呈现和编辑、手机端现状、真实用户的留存与评价都没有查到；本地 TEAMMATES.md 第 1 节的代码级描述本次没有复核。
- 飞书 aily 和「智能伙伴」的帮助文档没有打开，不确定它们现在与豆包工作、豆包工作伙伴是什么关系；钉钉 AI 助理（悟空之前的形态）和千问办公的现状没有亲见。
- 券商和基金内部平台（易方达 EWork、富国智能研究院、阿里云 JVS Claw 广场等）没有任何界面截图或文档，只有机构对媒体的口径；也没有从业者个人的评价。「把智能体叫作同事」在这些机构里目前看是称呼和技能包，是否存在一人一条对话的常驻形态未能证实。
- 36Kr 的几篇关键长文（「全民养虾 50 天」「OpenClaw，是不是凉了」「豆包将推 WorkBuddy 类产品」）停在安全检测页，百度百科停在安全验证页，均未读到正文。
- Manus Cue、Hermes Agent、QClaw、Kimi Claw、NanoClaw 都只在别人的文章里见到名字。Meta 的编程智能体 Muse Code 本轮没有重新打开，沿用 2026-09-29 的本地调研。
- 各家「常驻」到底多常驻（能否保证持续执行、失败后如何恢复）没有任何一家给出服务承诺；Kingy 的对比也指出三家都没有公开的统一保证。
