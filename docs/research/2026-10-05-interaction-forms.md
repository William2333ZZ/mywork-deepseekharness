# 现在这类产品的交互形式

2026-10-05。调查 AI 智能体、AI 同事、研究和简报类产品现在怎么让人和它们一起工作，以及用的人怎么评价。只调查，不设计。设计见 [design/v2/EDITIONS.md](../../design/v2/EDITIONS.md)。

## 怎么做的

- **分五路独立调查**，每路要求打开原始页面阅读，记下说话人、日期和网址：
  1. 通用智能体和通用助手；
  2. 常驻的智能体和 AI 同事；
  3. 简报、监控和跟踪；
  4. 对话之外的形式；
  5. 研究类产品（学术、海外金融、国内、开源）。第一次因模型额度用完中途失败，重跑后补齐。
- **同时用开发者自己 7 天的真实数据评估了我们现在的形式**，见 [interaction-2026-10/current-form.md](interaction-2026-10/current-form.md)。
- **局限**：
  - 这一轮没有做任何网页搜索（内置浏览器开不了新标签页），来源偏向已知网址的官方文档、Hacker News、V2EX、GitHub issue 和厂商帮助中心。
  - Reddit、知乎、小红书、即刻、应用商店评论没读到。
  - 多数产品的运行界面没有亲眼看到，靠官方文字描述。
- **原始记录**在 [interaction-2026-10/forms/](interaction-2026-10/forms/)，共 111 个产品条目和 44 种形式的描述。每条以所附网址的原文为准。研究类产品那一路做过网页搜索；知乎、Trustpilot、Reddit、OpenAI 帮助中心被验证页挡住，没有绕过，所以国内和金融产品的真实用户评价很少。

## 几种形式

| 形式 | 单位 | 例子 | 适合 | 在哪里坏 |
|---|---|---|---|---|
| 多条对话加项目夹 | 一次对话 | ChatGPT、Claude 的旧 chat | 即时问答、一次性小活 | 对话变长后质量下降：同样的任务拆成多轮，各家模型平均下降 39%（[Laban 等，2025](https://export.arxiv.org/abs/2505.06120)）；状态、旧结果、文件被挤到边上 |
| 一事一线，旁边一块工作面板 | 一次交办 | ChatGPT Work、Claude、Manus、Gemini Spark | 一件说得清的活 | 用户要决定一件事放哪；跨几件事的上下文要自己搬 |
| 项目当容器 | 项目里的任务 | Manus Projects、ChatGPT Projects | 资料和指令共用 | 项目文件改了只对之后的新任务生效（Manus） |
| 常驻的一位或几位 | 一位智能体一条长对话 | Grok Bot、OpenAI dots、Meta Muse、Manus Cue、OpenClaw、Rakazo、Lindy | 记得你是谁、在做什么，不必重述背景 | 几件事混在一条线里；对话无限增长只能压缩或重置 |
| 定时与事件自动化，加运行记录收件箱 | 一条自动化 | ChatGPT Scheduled、Manus Automations、Linear Loops | 周期性的盯和报 | 堆积是常态；分类粗会被整箱忽略 |
| 聊天软件当遥控器 | 一条消息 | 微信 ClawBot、Slack 里的 dot、飞书里的智能体 | 碎片时间、手机 | 长内容读不了，接手和登录做不了 |
| 文档、表格、看板当工作面 | 一份文档或一张表 | Notion、ChatGPT Pages、Hebbia Matrix、Elicit 的表 | 对着同一份东西改、逐格核对 | 看板和独立收件箱在退场（见下） |
| 主动信息流 | 系统猜题的每日一组 | ChatGPT Pulse（已下线）、Gemini Daily Brief | — | 见下 |

## 近一年的变化

**主动推送收回到用户自己定义的定时任务。** ChatGPT 的 Pulse 从 2025-09-25 上线到 2026-06-17 宣布下线，主动更新并入定时任务。同日上线 Scheduled 页：监控类任务只在有值得报告的事时才通知，无人看管的任务一段时间不活动会自动暂停（[release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)）。方向相反的一家是 Google 的 Gemini Daily Brief，2026-09 对美国免费账号开放，条目上能直接回邮件、排日程，每条可查来源。

**聊天和任务合并成一个入口，单线程产品退场。**
- Anthropic 2026-09-16 把 Cowork 和 chat 合并成一个输入框，由模型判断是回答还是任务，理由是用户最烦决定一件事该放哪（[公告](https://claude.com/blog/cowork-is-now-claude)）。
- 它的单线程产品 Dispatch 不再向新用户开放，帮助页把「只能有一条线程」列为限制（[帮助页](https://support.claude.com/en/articles/13947068-assign-tasks-from-anywhere-in-claude-cowork)）。
- OpenAI 2026-07-09 把 Chat、Work、Codex 合进一个桌面应用。

**常驻智能体成了一类产品，形态趋同。**
- 2026-08 到 09 月，Grok Bot、Meta Muse、Manus Cue、OpenAI dots 相继发布。共同点：自带云端电脑、7×24、主动找人、手机为主。
- dots 是一条持续对话，但派出去的任务是另开的可见线程；资料页有 Activity 和 Scheduled 面板，有它自己的笔记。动作执行前过一道自动审查，结果分放行、要你批准、交给你本人做（[文档](https://learn.chatgpt.com/docs/dots.md)）。
- Grok Bot 每位一条对话，例行属于某一位，Bot 之间可以发消息和建群（[公告](https://x.ai/news/introducing-grok-bot)）。

**记忆文件化，加心跳。** 扣子（SOUL.md、USER.md、MEMORY.md、HEARTBEAT.md）、Kimi Claw、Genspark Claw、ChatGPT dot（自己的笔记、自己决定何时醒来）都把 OpenClaw 式的文件化记忆和心跳搬进了商业产品。Lindy 把记忆做成带版本、可在线编辑的文件系统。

**一条对话里只对一个智能体说话。** Dust 放弃了在一条对话里 @ 多个智能体，理由是只有一对一时中途插话才能可靠到达；多方协作挪到另一个空间（[文档](https://docs.dust.tt/docs/user-documentation/agents/steering-conversations.md)）。

**看板和独立收件箱在退场，表格并回对话。**
- Vibe Kanban 背后的公司 2026-04 关闭（[公告](https://www.vibekanban.com/blog/shutdown)）。
- LangChain 的 agent-inbox 仓库已归档，收件箱成了审批动作的一个部件。
- Elicit 2026-09-30 撤掉独立的找论文、抽数据、和论文聊天，并入对话式的研究智能体，表格成为会话里的产物，Routines 取代 Alerts（[帮助页](https://support.elicit.com/en/articles/17220397-where-did-find-papers-extract-data-and-chat-with-papers-go)）。

**通知方主动降量。**
- Dependabot 默认对版本更新加 3 天冷却，维护者长期不理时自动暂停。
- Gemini Spark 在你正看着某个任务时不再推手机。
- Linear 把通知分成优先和其他两栏。

**计费从包月转向独立的用量额度。**
- Anthropic 2026-04-04 把第三方 harness 移出订阅额度。
- Grok Bot 一发布就给了独立于原订阅、按周重置的用量。
- Lindy、WorkBuddy 用额度或积分，并在任务旁显示消耗。
- Perplexity 在定时任务旁实时显示已花的额度。

**执行位置两个方向同时发生。** Claude 和 ChatGPT 把执行搬到云端，合上电脑也能跑；Manus、Perplexity、Kimi Work、MiniMax Code、扣子桌面端在往本机文件夹和本机应用上靠。2026-10-06 起，Claude Pro/Max 的新 Cowork 任务一律在云端运行，要留在本机的被引导去 Claude Code。

**国内大厂从 IM 里的助理变成独立的办公智能体应用，再往回接 IM。** 钉钉悟空并入千问办公；字节的豆包工作有独立 App、豆包 App、飞书内三个入口；腾讯 WorkBuddy 7 月月活 1115 万；企业微信向各类智能体开放 CLI 和 MCP。

**券商和基金从禁用转向封装。** 3 月先禁用 OpenClaw，4–5 月转为把自家数据和方法封成技能，送进别人的智能体。9 月基金公司的口径从「实习生」改叫「新同事」，开始用任务成功率、人工介入率、单 token 成本来衡量。

## 研究类产品

覆盖了学术与通用研究（Gemini Notebook、Elicit、ChatGPT 和 Gemini 的 deep research、Perplexity、Undermind、Consensus、SciSpace）、海外金融（AlphaSense、Hebbia、Rogo、Fintool、Daloopa、Brightwave）、国内（秘塔、Kimi、豆包、进门、熵简、Wind、同花顺、东方财富妙想、Reportify）和开源（ARIS、ai-berkshire、gpt-researcher、local-deep-research、Khoj、Zotero 接智能体）共 29 个，原始记录在 [forms/5-research-products.md](interaction-2026-10/forms/5-research-products.md)。

**工作单位在往「项目或研究空间」收拢。**
- Elicit 2026-09-30 撤掉独立的表格工具，表格退成研究智能体会话里的产物，提醒换成能交回分析成品的 Routines（[帮助页](https://support.elicit.com/en/articles/17220397-where-did-find-papers-extract-data-and-chat-with-papers-go)）。
- Undermind 的默认形态从一次性报告换成持久的 Projects。
- Consensus 从搜索引擎变成工作区，每个引用对应原句，研究空白矩阵的格子能点开。
- 进门 2026-07 上线研究模式：每个个股或赛道一个长期研究空间，加常态化监测，增量信息写回原底稿，明确针对「聊完即废」。

**一次性报告最大的缺陷是接不上上次。**
- HN 上有用户说，连续做 5 到 10 次深度研究，大部分篇幅浪费在引言和已经查过的内容上；只能自己另建知识库，把旧报告当新来源喂回去。
- 只问一轮就跑半小时，问错了白白浪费一次额度；Kimi 帮助页写明中途停止也照扣额度。
- 能改过程的很少：ChatGPT 和 Gemini 可以在开始前改计划，Perplexity 运行中可以追加问题，Elicit Report 是唯一读到的能事后回去改中间步骤再出新版本的。

**出处做得最好的在格子和句子上。** Hebbia 的格子里写日期、状态、口径；Consensus 和 Kimi 点引用后高亮原文；Hebbia Max 宣称 Excel 模型每格都带引用。

**金融侧转向常驻、事件触发的智能体，但几乎没有使用者的证据。** AlphaSense 预告常驻的 SuperAnalyst；Hebbia Max 能用邮件派活；Fintool 2026-04 被 Microsoft 收购。国内数据商 2026-03 起集中推出「小龙虾」形态的智能体（WindClaw、熵简 AlphaClaw、妙想 ClawBot），同时把数据和技能做成 MCP 卖给外部智能体。能读到的几乎全是厂商页和通稿；少数真实评价来自金融从业者论坛，认为这类工具适合快速上手一个领域，但产不出能交给客户的东西。

**订阅式提醒**：只告诉「有新论文」价值低，用户原话是「新的、相关的，但不新颖」。Reportify 把定时研究做成首页可订阅的卡片，写明送达时间、一条样例消息和在用人数。

**专业用户的倾向**：学术侧主张各工具只管一个阶段，检索记录、去重、纳入决策要留在任何一个 AI 界面之外；这和我们「状态落在用户自己的文件夹里」的做法一致。

**计费**普遍转向统一额度池、按任务大小扣（Elicit 月度池、Kimi 一次深度研究约占月额度 5% 到 10%）。

## OpenClaw 在国内的退潮

它是离 MyWork 最近的一个先例（本机常驻、IM 入口、文件化记忆）。按来源能支持的排序，没有来源给出各项占比：

1. **装上之后用不上。** 时间成本倒挂：部署、调接口、授权，配置花数小时，而多数人的活没有复杂到需要工作流。离场最多的是跟风的普通用户。
2. **费用。** 简单任务也要多轮调用；2026-04-04 之后部分用户月账单涨了 50 倍；有受访者给每位助理设每天 20 美元上限。
3. **稳定性和升级。** 任务链一长就卡住；4 月底的升级造成大面积中断，重度用户每次更新后都要修。
4. **安全和禁令。** 它直接切掉的是机关、国企、银行、券商的办公场景。

数据：2026 年 4 月访问量环比跌 50.67%；腾讯 QClaw 环比跌 99.19%。OpenClaw 2.0 重做了网页端；新智元的评价是它修的是「为什么装不上、为什么不敢用」，没回答「装完第二周为什么不打开」。

## 一条永续对话：两面的证据

- **问题**：
  - 几件事混在一条线里，无限增长只能压缩或重置；
  - Dispatch 下线时把单线程列为限制；
  - HN 和 V2EX 上的重度用户要求每件事有自己的上下文和状态，由文件承载状态（[HN](https://news.ycombinator.com/item?id=49736108)、[V2EX](https://www.v2ex.com/t/1188747)）。
- **价值**：
  - 记得你是谁、在做什么，不必重述背景；
  - 用户喜欢总管式的汇报，「不用自己管多条对话，它来汇报其他对话的进展」；
  - 有 Grok Bot 的重度用户认为，按领域分开的常驻智能体让记忆不串、更可信。
- **两股相反的方向**：厂商在把一切收进一个对话入口，再在旁边加面板（任务、产物、定时、文档）；重度用户在要求按事情分开。我们的设计取中间：一位同事一条对话不变，按事情分的是背后的会话和文件，不是用户看到的线程。

## 对我们现在的形式

详见 [current-form.md](interaction-2026-10/current-form.md)。

**要保留的**：
- 回话先给一两句结论、文件另放；
- 同事维护的表最稳；
- 一句话成例行；
- 默认按假设做完；
- MyWork 当分诊口；
- 如实交代做不到的；
- 本机真实浏览器加接手；
- 跳转只有一条规则。

**断点有 14 处**，最疼的是：
- 核对没有落点；
- 只有用户能办的事进不了「需要你」；
- 「没有变化」把真东西藏掉；
- 找回靠不住；
- 产出远超阅读时间；
- 纠正落不到实处；
- 装不下长任务。

## 还不知道的

- 多数产品的运行界面、记忆界面没有亲眼看到。
- 常驻智能体产品的留存数据没有任何一家公开。
- 用户对「一条对话」和「每件事一条」的偏好，没有找到带样本的调查。
- 中文用户的一手评价主要来自 V2EX，覆盖窄。
