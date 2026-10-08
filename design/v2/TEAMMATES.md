# TEAMMATES — 从 Rakazo 借什么、怎么借

2026-09-30 · 产品负责人备忘。依据：Rakazo 只读克隆的五份研究（product / web-shell / tokens / mobile / domain）、MyWork 现状盘点、三份方案、三份评审、四条核验。凡写「核验」处以核验结论为准，与研究摘要冲突时研究摘要作废。

路径约定：
- R = `/private/tmp/claude-501/-Volumes-KESU-deepseek-harness-projects-Mywork-deepseekharness/89beecb5-d0cc-4bbe-9c4b-59d7c390bd03/scratchpad/rakazo`（只读）
- M = `/Volumes/KESU/deepseek_harness_projects/Mywork_deepseekharness-v2`（本备忘所指仓库）

## 0. 结论（2026-09-30 晚已被 §8 替代，留作对照）

改面不改骨。

- 骨不动：四个对象（任务 / 交付物 / 例行 / 今日线程）与三份 JSON、任务是用户可见单位且「回答就是页面」、侧栏导航、新任务页「一定建任务」、一屏一件事、Grok 式对话、M 收成勾、本机运行无账号、手机连电脑不上云。
- 面改成 Rakazo 的形：今日页成为一条按时间的线（结果回到提问处）、侧栏行采用 Rakazo 的信息密度、第三栏按需（Rakazo 自己默认就是两栏）、ask 卡、带版本与下载的交付物。
- 唯一的产品逻辑改动：任务可以在四种情况下停下来问（waiting + ask 卡），例行永不问。
- 明确不借：bot 名册当首页、自建 bot 与自我介绍轮、一 bot 一条永续线程与历史压缩、Space / 账号、群聊 / handoff / message_bot / spawn / 子代理卡、屏幕镜像与 Take control、cron 编辑器与 webhook / Git / Slack 触发、审批规则表与自动审查判官、语音、彩色带眼头像、灰底回复气泡、深色默认、⌘K。

为什么是这个程度（三条，都来自材料）：
1. 办公活的单位是「交付物 + 核验 + 评价」。Rakazo 的 Artifact 只是文件 + 版本（R/packages/db/prisma/schema.prisma:962-991），run 是实现细节（R/VISION.md:59），结果作为消息留在线程里；它的 docs/agent-verification.md 是测试策略，不是产品级核验。MyWork 的核验（M/packages/tasks/src/engine.js:253-293）、评价（M/packages/tasks/src/index.js:274）、从工作记录写日报周报（M/packages/tasks/src/routines.js:196-219）是差异点，换骨会把它们压成一枚徽章。
2. 名册今天是空壳。MyWork 只有一个成员（M/design/v2/MOBILE.md:51「三个月仍只有一个成员，列表不做」）；digital-oracle-work 分支的 packages/oracle 只 inject ['tools']，没有向 myworkTasks.register，第二个成员还不存在（评审二）。
3. Rakazo 的「任务列表」就是侧栏 Activity（Now / Recent，R/apps/web/src/pages/ActivityList.tsx），MyWork 的今日清单 / 等你看是它做成首页的版本，且多了提醒 → 失败 → 核验问题 → 未评价的排序（M/packages/tasks/src/client/index.js:542-558）。

用户当晚的答复：「你来思考，我就是觉得他的UI和设计更合理你来决定做的方向」。方向由我定，定稿见 §8：比本节走得更远（整个产品成一列会话加一条线程），但仍不造 bot 名册。

## 1. Rakazo 模型速写

### 1.1 对象

| 对象 | 是什么 | 出处 |
|---|---|---|
| Space | 授权边界，一切对象挂 spaceId；分享 bot 不带记忆 / 历史 | schema.prisma:163-209；VISION.md:50-51 |
| Bot | 持续身份：name / title / description / instructions / color / notifyOnFinish / memoryScope / computerId / model；一 bot 一条线程（Thread.botId @unique） | schema.prisma:340-388, 465-469 |
| Thread | 属于 bot、group 或外部对话之一；nextEventSeq / nextMessageSeq 两条序号；历史压缩摘要；unread | schema.prisma:465-491 |
| Message / Event | Message = role + blocks[]（判别联合）；Event = 线程账本（threadId + seq 唯一） | schema.prisma:493-537；contracts/events.ts:95-286 |
| Task → Run → Attempt | Task(prompt,status)；Run(status, trigger 13 种, 租约, checkpoint, routineId)；状态 queued / leased / running / waiting_input / waiting_takeover / completed / failed / cancelled；「run 与 attempt 是实现细节」 | schema.prisma:539-641；core/run-state.ts:3-27；VISION.md:59 |
| Routine | name + prompt + crons[] + timezone + active + notify + webhook / github / message 触发；定时提示词，不是工作流 | schema.prisma:702-724；VISION.md:45 |
| Memory | MemoryDocument(scope bot/user, path, content, revision) + MemoryRevision(sourceRunId)；可选语义记忆 provider；Scratchpad；历史压缩（窗口 50） | schema.prisma:832-864, 1034-1047；history-compaction.ts:39-44 |
| Artifact | 文件：name / mimeType / size / hash / storageKey / runId；版本族 rootArtifactId / version；attach_file 同名即新版本 | schema.prisma:962-991；builtin-tools.ts:267-269 |
| Computer | scope team / dedicated；controlHolder；执行租约；每 bot 一个 AgentHome 与 BrowserProfile | schema.prisma:866-943 |
| Group / Connection / AgentConnection | 群（2–6 bot 共一条线程，handoff_to_bot）；连接属于用户 / Space 不属于 bot；跨主人 bot 连接需审批 | schema.prisma:431-463, 795-812, 1217-1228 |
| Ask | kind:"ask" 的消息块：text / detail / input(text|secret) / approvalEffectId / status / actions[]；只有 run 处于 waiting_input 且是最新一张时可答 | events.ts:101-124；answerable-ask.ts:11-26 |

### 1.2 线程内消息类型（核验后的版本）

块类型（events.ts:95-286）：text、card、ask、choice、app_connect、connect、computer、voice_call、meta、progress、steps、subagent、child_bot、cloud_agent、skill_draft、chart、mcp_approval、image、file、handoff、channel_message、bot_message_sent / received。

渲染规则：
- 上屏：用户气泡（右，bg-chat-user，纯文本只 linkify）、bot 回复气泡（左，bg-muted，markdown；1:1 无头像，群聊上方 22px 头像 + 名）、ask / 审批 / 密钥卡、文件 / 图片 / 图表卡、子代理卡、子 bot 卡、「Needs you」电脑卡、app / MCP 授权卡、居中一行的 handoff / meta / channel、bot 间消息胶囊。
- 不上屏：steps 块与 progress.activity 块（isToolActivityBlock，core/tool-activity.ts:3-5）。它们仍随事件流下发并持久在最终消息里（带 durationMs），只是渲染层丢弃；不是「藏在别处」，是「在线程里被隐藏」。可查看的只有全屏电脑 → Terminal → Activity（只记 shell / 写文件 / 附件 / 打开 / 启动，不记读文件与浏览器调用）。
- 运行中：只有一条合成消息 id=progress:<runId>；有叙述时是与回复同样式的流式气泡（token 流式默认关闭），无叙述时只有头像动画（ActiveBotGlyph）；run 终态合成消息消失。
- 结束：结果就是 bot 的最终文本气泡 + 可选 file / image / chart 块。线程里没有「进度卡」「结果卡」；✓ key → value 的 card 块只有渲染器没有生产者（仅营销站 demo 与测试）。
- 例外三处：子代理卡实时显示「using <tool>…」；审批 ask 卡显示「Review before <tool → 目标>」及参数明细；run 失败在输入框上方一条红字。
- 中途进展：message_user ≤500 字、高信号、不倒工具日志（builtin-tools.ts:346-352）；例行 run 的中途叙述被丢弃。
- 找人四形态：ask_user（2–4 选项）→「needs an answer」通知；审批卡（Allow once / Always allow this tool / Deny）→「needs approval」；request_takeover → 线程里「Needs you」电脑卡 + Open →「needs you on the screen」；request_secret → 受保护输入卡，值不进消息 / 事件 / 模型。

### 1.3 栏位：默认两栏 + 按需第三栏（核验）

- 左 316px bg-sidebar，可折到 0，移动端抽屉。头部：铃铛（Activity 模式，在名册上方插入 Now / Recent 两段 run 列表，15s 轮询，行 = 状态点 · bot 名 · 时间 · 提示词片段 · 状态词）、折叠、「+」（Create new Bot / Group / Space）。搜索框。分组 Pinned → 自定义 section → Unassigned。一行 = 38px 头像（工作中头像自身发光转圈）+ 14px 名字（未读加粗）+ 11.5px 时间 + 未读实心点 + 可选 title 标签 + 12.5px 两行预览（无预览显示状态词）。底部 Integrations、用户菜单（Artifacts / Settings / Usage / Log out）。归档区行上有 Restore / Delete（唯一行上操作）。
- 中：头部（头像 26 + 名字 16px，点开设置；右侧只有一个显示器按钮切右栏）；线程 px-7 py-6，「Load earlier messages」，「Jump to latest」FAB；胶囊 composer（+ 附件、textarea 15.5px、麦克风、白色圆形 ArrowUp，运行中 Send + Stop 并排）。
- 右 384px 默认关闭（Shell.tsx:421 panel=null），同一槽轮流放：电脑（16:10 只读预览 + hover Open 进全屏 + 该 bot 的 Routines 列表，行尾运行中有「Running · Stop」）、bot 设置（Name / Title / Description / Notifications / Advanced）、例行编辑器（Name / Instruction / When to run / Add trigger / Test run / Run history）、新建 bot / 群表单。「Take control」只在全屏电脑 overlay 与手机端，旧截图里的右栏药丸已不是现行代码。
- Artifacts 独立页 /app/artifacts：Bots / Artifacts 切换、Filters、卡片 / 列表、搜索、日期、每 bot 彩色 chip、320px 索引 + 预览（版本下拉、Download、最大化、HTML 沙箱提示）、hover 才出现的 Trash。
- 命令面板 ⌘K 只做「Switch bot」，⌘1–9 直选，不放动作。
- 空态：无 bot 时正中一个「Create new Bot」；首个 bot 叫 Chief，线程从空开始，服务端投递「What do you want me on first?」A–D 选择卡。
- 令牌（dark 默认）：bg #0b0c0e / sidebar #111215 / card·muted #141518 / secondary·input #18191e / accent #1a1b20 / chat-user #22242b / border #1e2026 / fg #ececee / muted-fg #85858a / primary 奶白 #f1f1ef / ring·link #3b82f6 / success #4ecb71 / warning #e9c46a；light bg #fafaf8 暖白。--radius 0.75rem → 气泡 20、工具卡 18、侧栏行 16、按钮 12、输入条 rounded-full。字体 Geist，正文 15.5px。整体单色，颜色只在 bot 头像上（11 色 + 8 形状哈希）。

### 1.4 手机

- 首屏 = bot 收件箱（无 tab bar）：顶部头像 → 账户、铃铛（Activity）、搜索、加号。行 = 头像 · 名 · title 标签 · 时间 · 未读点 · 一行预览，工作中脉动点；行上无操作，操作在长按（置顶 / 移动 / 静音）。空态一句「Tap + to create a bot」。
- 线程屏：threads/get + SSE 订阅 + 兜底轮询；同一套过滤（steps / activity / peer-run 不渲染）；用户气泡右、bot 气泡左、无头像；进度 = 底部小头像 + 三点脉动；ask 卡只有最新一张可答；长按 Reply / Quote / React / Speak / Copy；composer：+（相册 / 相机 / 文件）、胶囊输入（skill chip、@ chip）、Call、Send、工作中 Stop。
- 例行屏只读：名称卡（Active / Paused · 触发 · 时区）+ PROMPT + Open conversation；编辑只在网页。
- 电脑屏：WebView 预览卡 + 状态 + Take control / Release，全屏 Modal 可交互、解锁横屏。
- 推送：Expo 通用路；Android 前台服务每 8s 轮询 runs/list，四通道 Live / Messages / Scheduled / Attention，打开的线程不打扰，无工作自停。

### 1.5 Calm 落到的决定（我们要借的那几条）

1. 聊天只显示回复、有用进展、结果、真正的求助，不显示工具生命周期。
2. 例行没变化就沉默（NO_RESPONSE 剥掉、不落消息、不通知）。
3. 通知只三种：finish / help / takeover。
4. 只有最新一张 ask 可答。
5. 「每个可见字都是 UI，先问能删什么；新增文案的 PR 必须证明不能省」（AGENTS.md:6-7）。
6. 后端拥有编排 / 授权 / 重试，前端只表达意图与渲染状态。
7. 「模型自称完成不算数」（agent-verification.md:172-173）——这正是 MyWork 核验的理由，Rakazo 自己没做成产品。

## 2. MyWork 目标模型

### 2.1 对象映射表

| MyWork | Rakazo | 对应程度 | 决定 |
|---|---|---|---|
| 任务（用户可见、有页、可追问 / 重跑 / 核验；status 五个，M/packages/tasks/src/store.js:19-20） | Task + 多个 Run + 一段线程；run 是实现细节 | 半对应、层级错位 | 任务仍是一等对象；STATUSES 加 waiting |
| 交付物（markdown + data + rating + verification） | 最终回复正文 + Artifact 文件 | 半 | 保留正文 / 核验 / 评价；加 files[] / mimeType / rootId / version 与下载路由 |
| 例行（task / remind，一句话解析，上次交付物对比，变化判定 quiet，报告永不安静） | Routine（cron，NO_RESPONSE，notify 布尔） | 同类不同深 | 一行不改；quiet 运行在运行记录留「没有变化 · 安静」一行 |
| 今日线程（每天一个 assistant 任务，M/packages/tasks/src/index.js:103-105, 149-163） | Thread（一 bot 一条永续，历史压缩） | 相反 | 界面可回看昨天（只读、按天分隔），助理上下文仍按天，跨天靠 memory.md + 昨日摘要 |
| 领域包（做法，match() 认领，用户不选） | Bot（身份，用户写指令、选电脑） | 弱 | 领域包加可选 identity 成员标；不做 bot |
| 通用助理（preset，三分法） | 首个 bot Chief | — | 内置不可删，永远用 M 收成勾 |
| 今日清单 / 等你看 | 侧栏 Activity（Now / Recent） | 近 | 保留清单及排序，加「等你答」一行 |
| 过程折叠行「过程 · n 步 · 3m」 | steps 块（渲染层隐藏） | 同 | 保留 |
| 工作记录 workRecord（M/packages/tasks/src/index.js:113-148） | 无 | Rakazo 缺 | 保留，仍是日报周报唯一素材 |
| 核验（第二个只读会话） | 无 | Rakazo 缺 | 保留，徽章上卡 |
| 无 | Memory（MEMORY.md + 修订） | MyWork 缺 | 一份 memory.md，只做设置项 |
| 无 | ask / waiting_input / takeover | MyWork 缺 | mywork_ask + waiting；takeover 不做屏幕镜像 |
| 无（工作区目录 + 实时浏览器 tab） | Computer / Take control | MyWork 缺 | 「这台电脑」只读条件面板；不做接管语义 |
| 无 | Space / Group / spawn / message_bot / 子代理 | — | 不做 |
| 进程内 emit + 3s/20s 轮询 | Event 表 + seq 游标 + NOTIFY + SSE | MyWork 缺 | 事件账本 + SSE，第三期 |

### 2.2 成员定义（bot 在 MyWork 是什么）

- 成员 = 领域包的界面身份，不是 bot：`register({ ..., identity: { name, mark, intro } })`。mark 是 24 格单色线性字形（同 mark.svg 的 3.4 描边），不上色、不画脸、不做形状哈希。没有指令、颜色、线程、记忆、电脑。
- 通用助理是内置成员，永远存在、不可删，标是 M 收成勾。发行版在 kit.json 指定默认成员（交易工作台首屏落在交易成员，通用助理仍在）。
- 绝不做自建成员表单（Rakazo 的 New bot / Name / Title / Description）。
- 成员出现在：任务页元信息行（领域标签前）、任务列表与交付物页的成员筛选胶囊（≥2 个非内置领域包才渲染）、设置 → 领域与成员（替代 ScenariosPage，成员卡 + 示例一点即新任务）、手机 S4。
- 侧栏「成员」分组只在两个条件都满足后开：≥2 个领域包真正向 myworkTasks.register，且观察到用户去成员那里找结果。前提工作：把 packages/oracle 从 inject ['tools'] 接成 register({ match, compose, verifyPrompt, identity })，单列估算。
- 路由规则一句话：工作落在提问处，例行落在成员处。在通用线程问的交易问题，结果卡落通用线程、带交易标签；成员页只有它的例行和直接找它的活。
- 对话回复旁永远不放头像（M/design/v2/brand/README.md:8；DESIGN.md:102）。

### 2.3 线程内卡片清单（今日页的那条线）

线里只允许以下九种东西，一任务在线里最多两条：

| # | 形态 | 内容 | 操作 |
|---|---|---|---|
| 1 | 日期分隔 | 居中小字「昨天 · 9/29」；向上滚可回看（只读） | 无 |
| 2 | 用户气泡 | 右对齐，纯文本 | 无 |
| 3 | 回复正文 | 左侧 Markdown 正文，不是气泡，无头像；跑时一行「在想 · 当前步骤…」 | 无 |
| 4 | 交办行（三态原地更新） | 状态字形 · 标题 · 副文案：「查阅 · 40s」→「✓ 已交付 · 已核验」/「等你答 ›」/「失败 · 原因一句」；点开任务页 | 失败态一个「再来一次」 |
| 5 | 需要你卡 | 问题 ≤120 字 Markdown · 可选等宽 detail 块 · choice 整宽竖排按钮（2–4，label ≤12 字）/ text 输入 + 发送 / approval 允许一次 · 拒绝 / takeover 一句「去 Chrome 里处理」+「我做完了」；只有最新一张可答，旧的「不再等待」；答过一行「已回答：X」 | 卡内 |
| 6 | 提醒卡 | 标题 · 时间 | 一个「知道了」 |
| 7 | 安排行 | 「已安排：X · 每天 9:00 ›」→ 例行条目页 | 无 |
| 8 | 变化行（例行有变化） | 「X · 有变化 · 9:00 ›」→ 任务页；无变化不出现 | 无 |
| 9 | 引用胶囊（在 dock 上，不在线里） | 回复某张卡时显示卡名，× 清除 | — |

不做的块：Rakazo 灰底 bot 气泡、subagent / child_bot / handoff / bot_message 胶囊 / cloud_agent / skill_draft / choice onboarding 卡 / app_connect / mcp_approval / 语音卡、消息 hover 工具栏、表情反应、引用回复预览按钮。

回答型任务（无交付物）不出卡，回复正文直接在线里。quiet 运行零条。工具流永不进线。

### 2.4 右侧面板

- 默认关闭，只有一种内容：「这台电脑」。出现条件：任务在跑、活动里出现过 browser_* / open_url / web_fetch、视口 ≥1200px、且处在任务页。内容：16:10 只读 screencast（复用 dsh-mywork-browser 的 LiveBrowser，compact / readOnly / follow，JPEG 帧画到 canvas，不是 iframe）+ 一行「正在跑：标题 · 当前步骤 · 耗时」+ 状态胶囊「模型在浏览 / 需要你」+ hover「打开」进已有的实时浏览器标签（点击画面即接管，无 Take control 按钮、无 409 语义）。可关闭并记住（localStorage 'dsh-mywork:aside'）。<1200px 或无 browser 成员时退化为过程行上方一行「电脑画面 · 打开」。
- 实现走自声明插槽 mywork.task.aside（与 mywork.settings.tab 同一模式），不用 ctx.sidebarRight（alpha 接口，dsh 0.1.7 已知让侧栏崩）。
- 不放例行管理、不放记忆、不放设置、不放交付物查看器——每个对象只在一处管理。常驻右栏只有真实使用证明用户常开它、且 dsh 右侧栏接口稳定后再议。

### 2.5 命令面板

不做。理由：Rakazo 自己只用它切 bot；办公用户不会发现；「⌘K」提示字与「不加提示小字」相抵；⌘K 可能撞 dsh / Chrome / Electron 加速键，未核对。将来若做，只做切换（页面 / 在跑任务 / 最近任务 / 例行），不放动作。

### 2.6 Artifacts → 交付物

- 数据：Deliverable 加 files[]（name / mime / size / sha256）、mimeType、rootDeliverableId、version；同任务同标题再交付即 v2（照 attach_file 同名即新版本）。
- 工具：mywork_attach({ path, name?, description? })，≤10MiB，从 workbench 拷进 `$DSH_HOME/mywork/files/<dlvId>/`。
- 路由：GET /file?id=&name=，rejectUntrusted 守卫，只按 id 读 files/，绝不接受路径参数；手机经网关 bearer 用 fetch 写缓存后系统分享，不 openURL。
- 页面（交付物页保留列表形态，加 Rakazo 的筛选与预览）：标题「交付物 · n」、搜索、日期（全部 / 今天 / 本周 / 本月）、成员胶囊（≥2 领域包）、每项 = kind 图标 · 标题 · 核验徽章 · 评价 · 成员标 · 时间 · v{n}；详情 = 索引 + 预览（版本下拉、下载；md 内嵌、pdf / 图片 object / img、html 与其它「在实时浏览器打开」/ 下载）。删除在查看器 ··· 里，不做悬停删除，不做卡片网格。入口：任务列表「交付物」胶囊、今日清单「n 份还没评价 ›」。

### 2.7 找人（唯一的产品逻辑改动）

- 现状：approval policy 'never'（M/packages/tasks/src/engine.js:142），提示词「用户不在线：不要提问，不要等确认」（M/packages/tasks/src/scenarios.js:60）。
- 改为：默认按合理假设做完、假设写进结果；只在四种情况停下来问：缺关键信息且无法假设 / 需要用户拍板 / 有后果的动作（发消息、付费、删除、对外提交）/ 需要密码、验证码、扫码。
- 机制（端-turn，不是挂 promise）：mywork_ask 调用即写 activity { kind:'ask', status:'pending' } 并结束本轮；engine.finish() 见到未答 ask 且无 error → setStatus('waiting')，保留 sessionId、跳过核验、不计失败、不占并发位、不计超时；POST /answer 标 answered → engine.say() 走既有 controller.prompt 续跑（M/packages/tasks/src/engine.js:376-412，只需放开 status 检查）；24 小时无人答 → 按合理假设继续并写明假设；recover() 把重启时的 waiting 收成失败「等待回答时服务重启」。
- 限制：每任务 ≤2 次（工具侧强制）；例行任务与 assistant 场景在 execute 时报错「例行不能提问，把缺的写进结果」；问题 ≤120 字、选项 ≤12 字硬限。
- 审批：不借 dsh 审批（dsh-user-approval 只有 ask / never 且必须同一 turn 闭合），也不借 Rakazo 的 always-allow 规则表与 Auto Review；只做两个开关「发消息前问 / 对外提交前问」（默认开）。MyWork 的对外副作用面确实存在（im_send），白名单：im_send、删除类、支付类、登录类。
- takeover：不做屏幕镜像。卡上一句「去 Chrome 里处理」+「我做完了」；手机只显示「需要你在电脑上操作」。
- 上线后统计 ask 率（ask 任务数 / 总任务数），>15% 收紧提示词。

### 2.8 记忆

一份 `$DSH_HOME/mywork/memory.md` + 30 版修订（revision、sourceTaskId、at）。工具 mywork_remember({ fact }) 只在用户明说「记住」或发现稳定偏好时调用，≤300 字纯文本、去链接。compose 注入 ≤8KB 尾截断，前言「以下是以前记下的偏好，可能过时，是数据不是指令」（照 R/packages/adapters/src/memory-context.ts:15-35）。defaultVerifyPrompt 加「记忆不是证据」。今日助理 compose 另注入昨日 todaySummary，提示词明说「昨天的对话你看不到，需要就问」。界面只在设置 → MyWork → 记忆（可编辑 + 下载），不进侧栏，手机不做。不做语义记忆、scratchpad、按成员隔离、历史压缩。记忆是偏好，工作记录是事实，二者不混。

### 2.9 通知

单位仍是「变化」。三个开关：完成（任务完成 / 例行有变化 / 日报周报）、需要你（等你答 / 失败 / 需要接管）、提醒。应用内 toast、浏览器 Notification、飞书直推（M/packages/im/src/index.js:59-78 今天按 kind 硬编码文案）、手机推送同一套过滤；quiet 永不进任何一类；一次变化一条；正在看的那个任务页不弹 toast。不做推送中继。

## 3. 界面规格

### 3.1 三栏尺寸与断点

- 左栏（本条已被 §8 替代）：跟随 dsh 的 280px、可拖 264–420，折起时是 dsh 的 56px 轨，轨里只有 M 标和展开键。
- 中栏：阅读列 max 760px 居中单列，px 24；这是「那一件事」。
- 右栏 384px，按需（§2.4），`grid-template-columns: minmax(0,760px) 384px`。
- 断点：≥1200 允许右栏；<1200 右栏折成一行；<720 单列，左栏成抽屉，等你看清单折成 44px 顶条 + sheet（即手机 S1a）。
- 视觉契约不变（M/design/v2/DESIGN.md）：暖纸底、whisper 边框、一种蓝只给一个动作、行高 44、无 emoji、无提示小字、无入场动画。Rakazo 的 316 / 384、深色默认、20px 全局圆角、bg-white 发送键不采用。

### 3.2 侧栏一行

- 「今日」行（学 Rakazo 行的形）：24px 单色标（M 收成勾）· 名字 14px（未读加粗）· 时间 11.5px tabular · 未读实心点 6px；第二行 12.5px 最近一句（在跑时「在想 · 步骤」或「2 个在跑 · 1 份等你看」）；在跑时标自己画一遍（stroke-dashoffset），不转圈不发光。
- 任务行（历史）：状态字形 · 标题 · 状态词 / 时间；例行行：字形 · 标题 · 计划 · 下次 / 已暂停。
- 选中 --surface 圆角 12；hover 同；行上无操作、无搜索框、无分组标题（历史按天的分隔线除外）。
- 成员分组（条件出现）：标 · 名 · 一行预览 · 时间，在跑 data-live。

### 3.3 线程卡片

- 用户气泡：右对齐，max 84%，圆角 20（唯一例外，写进 DESIGN.md），现有 .mwt-bubble 色。
- 回复正文：760 列，Markdown，无气泡无边框无头像。
- 交办行 / 变化行 / 安排行 / 提醒卡：--surface 底、whisper 边框、圆角 12、行高 44、左 16px 字形、标题 14px、副文案 12.5px muted、右侧至多一个 ghost 按钮；hover 不出现额外操作。
- 需要你卡：max-width 560，圆角 12，--surface，边框 strong；问题 15px；detail 等宽 12.5px、max-h 240、--surface-2；选项按钮整宽 44px 竖排、间距 6；approval 两键「允许一次」default、「拒绝」outline；答过一行 13px success 色「已回答：X」；不可答 muted「不再等待」。
- ✓ 结果卡（任务页正文上方，非线内）：每行 15px「✓（success 色）label（500）→（meta 色）value」，--surface 圆角 12，≤6 行；线里的交办行终态只显示「✓ 已交付 · 已核验」。
- 核验徽章三态：核验中 / 已核验 / 核验发现 n 处；语义色只上图标与胶囊文字。
- 等你看清单（桌面在线程顶部，不折）：≤10 行、44px、字形 · 标题 · 状态词，顺序 提醒 → 等你答 → 失败 → 核验有问题 → 在跑 → 今天交付，未评价折一行；每行至多一个按钮（知道了 / 再来一次）；清零即消失。

### 3.4 Composer

现有 dock：输入框（占位只留现有那一句，不加第二句）+ 一种蓝的圆形发送 + 引用胶囊（回复某卡时出现在输入框上方，×）；跑时右侧「在想…」。无「+」附件、无麦克风、无 @ / 斜杠、无 Stop（取消在任务 ··· 里）。Enter 发送，Shift+Enter 换行。「任务：」前缀仍强制建任务，但新任务页保留，不靠前缀替代。

### 3.5 暗色主题的取舍

- 本轮不做「墨色」新家族，不改 5 个家族 × 浅深的令牌，手机不首次引入暗色。理由：用户没要，回归面 5 × 2 × 4 页，对「像 Rakazo」贡献小。
- 若日后动暗色，只取 Rakazo 一条教训：用户气泡 ≠ muted、sidebar ≠ background（R/packages/ui-tokens/src/appearance.test.ts:54-69）——暗色下用户气泡用 --surface-2 与回复区 / 卡分层。
- 不采用：深色默认、resolveAppearance 系统默认 dark、bg-white 发送键、text-white 结果卡键名、#3B82F6 工作光环。

## 4. 实施顺序

| # | 步骤 | 改哪些文件（M = 仓库根） | 验收 | 估算 |
|---|---|---|---|---|
| 0 | 契约先改：FLOW.md 加「找人」一节与「例行不问、与今日线程隔离」规则、「昨天可回看但上下文按天」；DESIGN.md §5 三栏栅格与条件右栏、§6 卡片规格、§9 把「two-column task page」改成「文档列单列，右栏仅在跑且用浏览器时」、加「新增文案须写理由」、把气泡 20px 列为唯一例外；MOBILE.md S1 需要你卡、S3 ask 卡、S7 三开关；ECOSYSTEM.md register 加 identity、「领域包在界面上是标签和筛选，不是会话」；brand/README.md 加成员标规则 | M/design/v2/FLOW.md · M/design/v2/DESIGN.md · M/design/v2/MOBILE.md · M/design/ECOSYSTEM.md · M/design/v2/brand/README.md · 本文件 | 五份文档互不矛盾；§5 的拍板项有用户批注 | 1 人日 |
| 1 | 结果回到提问处（本周）：网页交办行原地更新三态（照 M/apps/mobile/src/screens/Home.tsx:111-117 的 handoffState）；deliver 工具加可选 summary:[{label,value}]（≤6 行、各 ≤60 字），DeliverableStore.create / deliverableSummary 透传，任务页 Doc 上方渲染 ✓ 结果卡，手机 TaskPage 同一张；GENERAL compose 加「有可数结果时用 summary 列 2–6 行」；删 .mwt-cols / .mwt-col.sticky / .mwt-stream 两栏遗留 CSS 与零引用词条 hint / sayHint / scheduledHint（sayBusy 核对后再删） | M/packages/tasks/src/index.js:191-206 · M/packages/tasks/src/store.js:109-120 · M/packages/tasks/src/engine.js（deliver）· M/packages/tasks/src/scenarios.js（GENERAL.compose）· M/packages/tasks/src/client/index.js（Turns 607-624、Doc、STYLE、词条）· M/apps/mobile/src/screens/TaskPage.tsx · M/apps/mobile/src/components.tsx | 交办一个任务后，今日对话里同一行从「查阅 · 40s」变「✓ 已交付 · 已核验」，不新增第二条；带 summary 的交付在任务页出 ✓ 卡；grep 无 .mwt-cols 与 hint 词条；一任务在流里 ≤2 条 | 2 人日 |
| 2 | 拆文件：用 package.json mywork.clientPrelude 把 STYLE、词条、cards / feed / ask 拆成 src/client/*.cjs（依赖方向：index.js require 预置文件，组件接受 deps 工厂） | M/packages/tasks/package.json · M/packages/tasks/src/client/*.cjs · M/scripts/build-client.mjs（确认多预置文件顺序） | pnpm -C packages/tasks build 通过，页面行为不变 | 1 人日 |
| 3 | 找人：STATUSES 加 'waiting'（标签「等你答」）；mywork_ask 工具与 /answer；engine.finish / say / recover 改动（§2.7）；GENERAL compose 四种情况规则；scenario 可声明 ask:false；settings.json 动作确认两开关；todayRows 加 rank 1「等你答」行（glyph message、tone warn、无按钮）；TaskDetail 渲染 AskCard；Say 组件在 text 类 pending ask 时发到 /answer；StatusDot / 侧栏小字加 waiting；Overlay toast「需要你 · 标题」；IM 加 kind 'ask' 文案；手机 api.answer、TaskPage AskCard、Home 需要你卡、S1a 等你答行 | M/packages/tasks/src/store.js:19-20 · M/packages/tasks/src/engine.js（finish 213-244、say 376-412、pump 296-309、recover 356-363）· M/packages/tasks/src/index.js（工具 189-231、路由 241-275）· M/packages/tasks/src/scenarios.js:60 · M/packages/tasks/src/client/index.js（todayRows 542-558、TaskDetail、Say、Overlay）· M/packages/codex-ui/src/client/MyworkSidebar.tsx · M/packages/im/src/index.js:59-78 · M/apps/mobile/src/api.ts · M/apps/mobile/src/screens/TaskPage.tsx · M/apps/mobile/src/screens/Home.tsx · M/packages/tasks/test/engine-ask.test.mjs | 一个缺信息的任务停在 waiting，今日清单出「等你答」行，任务页卡可答，答后同一会话续跑并交付；第 3 次 ask 被拒；例行任务调用 ask 报错；重启后 waiting 收成失败；waiting 不占并发位 | 4 人日 |
| 4 | 今日页成线：GET /feed?before=&limit=（feed.js：assistant 活动 + 每任务两张卡 + routines.fired 提醒 + 待答 ask 按时间合成，即把 Home.tsx:98-110 的客户端合并搬到服务端）；日期分隔 + 「加载昨天」只读回看；dock 引用胶囊（replyTo → engine.say）；今日助理加 mywork_task_say 工具与「最近 3 个结果标题」上下文；昨日摘要注入 | M/packages/tasks/src/feed.js（新）· M/packages/tasks/src/index.js（路由、todaySay 149-163）· M/packages/tasks/src/scenarios.js:93-109 · M/packages/tasks/src/client/index.js（DayThread / Turns / TodayAsk）· M/apps/mobile/src/screens/Home.tsx（改读 feed）· M/packages/tasks/test/feed.test.mjs | 一天 20 任务 + 3 例行（1 quiet）+ 1 提醒 + 1 ask：线里卡数 ≤ 任务数 × 2，quiet 0 张，清单计数与侧栏一致；带引用的「再短一点」进原任务不建新任务；390px 首屏无横滚 | 3 人日 |
| 5 | 侧栏行改形 + 成员标：MyworkSidebar「今日」行按 §3.2；scenarios.register() 接 identity，publicView 暴露；MemberMark 组件用于任务页元信息、筛选胶囊、设置 → 领域与成员（替代 ScenariosPage）；手机 S4 头部 | M/packages/codex-ui/src/client/MyworkSidebar.tsx:98-159 · M/packages/tasks/src/scenarios.js:114-141 · M/packages/tasks/src/client/index.js · M/apps/mobile/src/screens/MyWork.tsx | 侧栏今日行显示最近一句 / 时间 / 未读点，在跑时标画一遍；单成员时不出现成员分组；identity 缺省时任务页无空标 | 1.5 人日 |
| 6 | 交付物文件形态与页面（§2.6） | M/packages/tasks/src/store.js（Deliverable）· M/packages/tasks/src/index.js（mywork_attach、/file、/deliverables q/since）· M/packages/tasks/src/engine.js · M/packages/tasks/src/client/index.js（DeliverablesPage、Doc 文件卡、todayRows more 行）· M/packages/tasks/README.md · M/apps/mobile/src/api.ts · M/apps/mobile/src/screens/Tasks.tsx · M/apps/mobile/src/screens/TaskPage.tsx | 同任务同标题再交付得 v2 且版本下拉可切；/file 拒绝任何带路径的参数；手机能分享文件；核验徽章与评价出现在每项 | 3 人日 |
| 7 | 记忆（§2.8） | M/packages/tasks/src/memory.js（新）· M/packages/tasks/src/index.js · M/packages/tasks/src/engine.js:176-194 · M/packages/tasks/src/scenarios.js（compose、defaultVerifyPrompt）· M/packages/tasks/src/client/index.js（settings tab）· M/packages/tasks/test/store.test.mjs | 「记住周报发给王总」后下一任务的 compose 含该条且带前言；30 版修订可回退；核验员不引用记忆作证据 | 2 人日 |
| 8 | 通知三分 + 动作确认设置（§2.9） | M/packages/tasks/src/index.js（settings.json 读写）· M/packages/tasks/src/client/index.js（Overlay 过滤、settings tab）· M/packages/im/src/index.js · M/apps/mobile/src/screens/Settings.tsx · M/apps/mobile/src/api.ts | 关掉「完成」后任务完成不 toast 不推飞书但「需要你」仍到；quiet 运行零通知；正在看的任务页无 toast | 1 人日 |
| 9 | 「这台电脑」条件右栏（§2.4） | M/packages/tasks/src/client/index.js（TaskDetail、STYLE .mwt-page.with-aside、插槽 mywork.task.aside）· M/packages/browser/src/client/index.js:373-583（LiveBrowser compact / readOnly 分支）、:597-640（注册插槽） | 只在跑 + 用了浏览器 + ≥1200 出现；关闭后记住；<1200 退化成一行；无 browser 成员时不留空框；不用 iframe | 2 人日 |
| 10 | 事件账本 + SSE：emit() 追加到 `$DSH_HOME/mywork/events.json`（seq 单调，保留 2000 条）；GET /events?cursor= text/event-stream，心跳 25s，写法照 M/packages/browser/src/index.js:257-275 的 /events、/stream；客户端 SSE 优先、断线退避 250ms→5s、45s 无帧重连、20s 轮询兜底永久保留 | M/packages/tasks/src/events.js（新）· M/packages/tasks/src/index.js:57-61 · M/packages/tasks/src/client/index.js:360-410 · M/packages/codex-ui/src/client/MyworkSidebar.tsx:109-130（可选）· M/apps/mobile/src/store.tsx（可选） | 「需要你」在电脑上 1s 内到达；拔网线 30s 后自动重连且不丢事件；多标签页不重复订阅 | 2 人日 |
| 11 | 中途进展 mywork_progress(text ≤200)，每任务 ≤3 条，只更新交办行副文案 | M/packages/tasks/src/index.js · M/packages/tasks/src/engine.js（onSessionEvent）· M/packages/tasks/src/scenarios.js | 第 4 条被忽略并在工具返回里说明；不进线不通知 | 0.5 人日 |
| 12 | 文档与截图：README 截图、演示脚本、MOBILE.md 屏幕表、本文件收口 | M/design/* · M/packages/tasks/README.md | 两张截图（今日线 + 任务页 ask 卡） | 1 人日 |

合计约 24 人日（单人）。分期：第一期 0–2（本周，结果回到提问处）；第二期 3–5（找人、成线、侧栏行）；第三期 6–9（交付物、记忆、通知、这台电脑）；第四期 10–12。每期可独立发布、独立回滚，引擎与三份 JSON 在第二期前不动。

## 5. 与用户规则的冲突及决定

| 规则 | 冲突点 | 决定 |
|---|---|---|
| 一屏一件事 | 三栏 = 三件事？ | 粒度是页面职责（MOBILE.md:177）：中栏单列是那一件事；左栏是导航不是第二件事；右栏按需且只服务当前任务（Rakazo 自己默认两栏）；桌面清单不折（核验四）。不做常驻右栏、不做 bot 名册首页。 |
| 列表上不放操作 | 卡上的按钮、Rakazo 例行行 Running · Stop、归档 Restore / Delete、悬停删除 | 线里的卡与等你看行「至多一个按钮」是唯一例外（MOBILE.md 已提出）；侧栏、任务列表、例行列表、交付物页严格无操作；Rakazo 那三处一律不借。 |
| 不加提示小字 | ask 卡 detail、设置副文案、占位提示、⌘K 提示 | detail 是待确认的数据（邮件正文、要删的文件名），允许；设置无副文案；占位只留现有一句；不做命令面板。 |
| 对话学 Grok | Rakazo 左侧灰底 bot 气泡、群聊头像 | 回复仍是正文，用户气泡在右，无头像；ask 不进正文，只在交办行变「等你答 ›」+ 卡。 |
| 例行只有变化才打扰 | Rakazo notify 布尔、NO_RESPONSE 连记录都没有 | 保留变化判定；quiet 运行留「没有变化 · 安静」一行；报告类永不安静。 |
| 日报周报由 MyWork 从工作记录写 | 记忆会不会混进素材 | 记忆是偏好，工作记录是事实；日报周报只从 workRecord 写，核验员声明记忆不是证据。 |
| 品牌标是 M 收成勾 | Rakazo 彩色带眼头像；方案三给成员标上色 | 成员标单色 24 格线性字形，不上色不画脸；通用助理永远 M；在跑「画一遍」不转圈不发光。 |
| App 连电脑不上云 | Rakazo Expo 推送中继、WebView 接管 | 不做中继；前台靠网关 SSE，后台走飞书直推；手机不做电脑面板，登录类只显示「需要你在电脑上操作」。 |
| （2026-10-04 更新）手机在任何网络都能连 | Paseo 的端到端加密中继 | 做了，且只走中继：电脑和手机都向外连 apps/relay（Cloudflare Durable Object，每个配对一个），X25519 + XSalsa20-Poly1305，公钥只在配对码 `#` 后；中继只转发密文、只放行 MyWork 的接口和文件链接。手机网关改为只听本机，不再有局域网直连；「允许手机连接」一个开关，配对码就是 `https://<中继>/#i=&k=&t=`。网页 / PDF 经中继取回后交给手机上的其他应用打开。推送仍不做。 |
| （2026-10-04 更新）MyWork 能新建同事 | Rakazo 的总助理把长期的事分给专门的队友 | 做了：只有 MyWork 有 mywork_mates / mywork_mate_create。长期、反复、要专门盯的事，它先查名册，没人在做就用找你卡（新建同事 / 你来做就行）问，你同意才建；新同事照常自我介绍、自己排例行，MyWork 给的第一件事排在介绍后面（run.source mywork，对话里标「MyWork 转交」）。MyWork 的对话里留一张新同事卡。工作规矩改了以后，启动时会重写过期的同事预设。 |
| （2026-10-04 更新）中继给所有电脑用；网页版 | Paseo 的共享中继 + 网页客户端 | 做了：电脑用 Ed25519 签名占房间（先到先得，之后只认这把钥匙，时间戳防重放）；每房间 ≤8 台手机、每手机 60 帧 / 10 秒、每地址 60 连接 / 分钟；电脑端心跳看门狗；「换一个配对码」。网页版是 apps/mobile 的 Expo web 构建，挂在中继同一地址（Workers 静态资源，严格 CSP）：手机自带相机扫码 → 浏览器打开即配对（`#` 后读一次后抹掉，存在浏览器 localStorage）；网页版不内嵌扫码、文件以下载交出（不在本源打开同事的网页）。不用自定义域名。 |
| FLOW.md:46「今天一条线，明天新的一条」 | 线上可回看昨天 | 界面可回看（只读、按天分隔），助理上下文仍按天（保留 dayKey 这个免费的上下文清零），跨天靠 memory.md + 昨日摘要。投影层改动，需用户点头。 |
| FLOW.md:37 新任务「一定建任务」 | 方案一取消新任务页 | 保留新任务页与侧栏按钮；「任务：」前缀只是补充。 |
| MOBILE.md:51 单成员不做列表 | 方案一 / 二的左栏会话列表 | 保留；成员分组 ≥2 领域包注册且观察到需求后再开。 |
| DESIGN.md:118 任务页单列、MYWORK-V2「任何宽度单列」 | 「这台电脑」条件右栏 | 需拍板。我的建议：允许条件右栏（同一任务、可关、<1200 折成一行），DESIGN.md §9 改一句；若不同意，退化为过程行上方一行「电脑画面 · 打开」，功能不丢。 |
| 圆角 ≤12 | 现有 .mwt-bubble 22px、Rakazo 20px | 气泡是唯一 20px 例外写进 DESIGN.md；卡一律 12。 |
| 用户本次要求「UI 要和这个类似」 | 本备忘只借「面」 | 需确认：像到「线程即界面 + 侧栏行 + 按需右栏 + ask 卡」这一层，还是「名册首页 + 一包一条线」那一层。前者是本备忘；后者见方案一，代价：一天 40 张卡、单成员空壳、归属规则让用户去错地方、44 人日、反悔 MOBILE.md 当天判定。 |

## 6. 被反驳的断言与修正

1. 「Rakazo 主界面是三栏，右侧常驻电脑画面 + Take control + Routines；任务以进度卡 / 结果卡出现在线程里」→ 默认两栏，右栏 panel=null、按需打开且多用途；Take control 只在全屏 overlay、手机与过时截图；线程里没有进度卡 / 结果卡，运行中是叙述气泡或头像动画，结果是普通回复 + 附件块；✓ card 块只有渲染器没有生产者；它的「任务列表」是侧栏 Activity（Now / Recent）与独立 Artifacts 页。
2. 「线程只显示回复、进度卡、结果、ask，工具细节藏在别处」→ 工具活动块随事件流下发并持久在最终消息里，只是渲染层丢弃，没有开关可看；例外：子代理卡实时显示工具名、审批卡显示参数明细、失败红条、手机朗读会读 steps 标签；「别处」只有全屏电脑 Terminal 的 Activity（shell / 写文件 / 附件 / 打开 / 启动，不含只读工具与浏览器 / MCP 调用）。
3. 「四个对象可以无损映射到 run / artifact / routine / thread，只缺 bot 身份、记忆、电脑面板三样」→ 部分同构、层级错位：任务 ≈ Task + 多个 Run + 一段线程；交付物 ≈ 最终回复正文而非 Artifact；例行同类但 remind / changed / quiet / workRecord 无对应，cron / 时区 / webhook 反向无对应；今日线程按天与永续相反。缺口还有 ask 中断点、事件账本与订阅、Space / 群 / 委派；反向 Rakazo 缺核验、评价、变化裁定、提醒、工作记录。借的是机制不是对象。
4. 「bot 列表 + 一条线程 + 右侧面板不违反一屏一件事」→ 粒度是页面职责；右栏放例行管理撞「每个对象一处管理」与「列表无操作」；bot 列表单成员空壳、多领域包时就是 v2 刚删掉的场景选择器；置顶条折清单只在手机宽度成立，桌面清单留在对话之上。
5. 方案一「把 dsh 审批按工具白名单改成 ask，映射成需要你卡」→ dsh-user-approval 策略只有 ask / never，approval/asked 与 decided 必须在同一开放 turn 内闭合，几小时后回答做不到；只能走 mywork_ask 端-turn → waiting → say 续跑。
6. 方案二「mywork_ask 持有 promise 等 24 小时」→ 挂住 agent handle、Chrome 标签与 run() 的 deadline 计时器，重启即丢；改端-turn 机制。
7. 方案二「MyWork 的任务没有对外副作用面」→ im_send 就是；审批白名单要列 im_send、删除、支付、登录。
8. 方案一「quiet 的运行只留运行记录」当作新功能 → 已是现状（settleRoutine → markRun changed=false），只补文案。
9. 方案一「领域包加一个 member 字段 2 天就成第二个成员」→ packages/oracle 只 inject ['tools']，未向 myworkTasks.register，v2 kit.json 无 oracle；接成领域包是独立移植工作。
10. 方案三成员标 color 填色 → 违反 brand/README 单色规则；改单色线性字形。
11. 方案二「thread.cjs 从 index.js 复用 Turns / TaskDetail」→ 预置文件先于 index.js 内联，依赖方向反了；组件要搬进预置文件并接受 deps 工厂。
12. 研究里 Rakazo 的 Routine.notify、thread.artifact / thread.ask / thread.choice 等事件类型 → notify 无读取点（完成推送由 bot.notifyOnFinish 或群聊控制）；那些事件类型无生产者，信息实际走 thread.message.created 的块。
13. docs/media/artifacts-tab/*.png 的青绿设计与 web-computer.png 的奶白用户气泡 → 早期迭代或 mock，与现行 tokens / 代码不符，不作视觉依据。
14. 「Rakazo 找人只有 ask 卡一种」→ 四形态：ask_user、审批卡、request_takeover（电脑卡 + Open）、request_secret（受保护输入卡）；MyWork 只借前两种的形，takeover 改成「去 Chrome 里处理」。

## 7. 材料缺口

Rakazo 侧：
- 未通读 pi-runtime.ts 的完整系统提示（求助规则由工具描述与 userTurnInstructions 推断）；bot 的 idle / working 状态枚举未定位；Routine.notify 语义未追到使用点；team chat ambient 未分析。
- Shell.tsx 367–2636 行的通知 / 未读 / runError 逻辑、VoiceChatCard / PeerMessagesOverlay / Knowledge / Scratchpad / TerminalApp / FilesApp / 右键菜单样式未读；尺寸全由 Tailwind 类名推断，未跑起项目截图核对；仓库内没有现行深浅色的实机截图。
- 手机端 thread.tsx 的 QuoteSheet、account / models / integrations / new-* 页只抽查；iOS 推送触发时机未逐行核实；语音、Slack / WhatsApp / iMessage 消息面、CloudAgent、AgentConnection 只在 schema 层面记录。
- approval「always」如何写入 ActionApprovalRule 的具体行未追到。

MyWork 侧：
- 未读 packages/tasks/src/harness.js、packages/im 全文、codex-ui 设置页、DeliverablesPage / ScenariosPage 入口；手机 TaskPage / RoutinePage / Tasks / Settings 未读；未启动服务真机核对。
- wctx.webServer.register 是否允许长连接、lan-gateway 有无 idle 超时（browser 包的 /events、/stream 已跑通是唯一旁证）。
- dsh-mywork-browser 有无 tabs 查询 API；桌面版 Electron 的 BrowserView 与任务页 aside 的定位同步未评估。
- sayBusy 词条是否零引用未核对（review 说三个，方案说四个）。
- 把 packages/oracle 接成 myworkTasks.register 的工作量未估；digital-oracle-work 分支与 v2 worktree 的同步未排期。
- 「任务页单列」契约是否放开条件右栏、「昨天可回看」是否接受、以及「像 Rakazo」的程度——三项等用户拍板。

## 8. 定稿：会话即一切（2026-09-30 晚）

用户把方向交给我：「我就是觉得他的UI和设计更合理」。这句话说的是骨架，不是颜色：左边一列你在和谁说话、每行带最近一句；中间一条线，问在上、结果在下、接着问在底；电脑画面一键拉出。§0 只借了面，问与结果仍分在两页；§8 把整个产品做成这副骨架，但仍不造 bot。四个方向的比较（面改骨不改 / 会话即一切 / 名册首页 / 一条流）经五个角度评审与三轮反驳，结论如下，反驳里站得住的修正已并入。

### 8.1 结论

整个产品是一列会话加一条线程。骨不动：四个对象、三份 JSON、引擎状态、第二会话核验、评价、工作记录写日报周报、安静例行、等你看。面上把任务页、任务列表、例行页、新任务页合成一种形态：线程。默认两栏（Rakazo 自己 panel=null），第三栏「这台电脑」按需且只做一件事。不留旧页、不设开关：git 就是回滚。

概念数是验收项：左栏只有一种行；线里最多七种东西（用户气泡、回复正文、交办行、需要你卡、提醒卡、日期分隔、在做行）；右栏只有一段；同一任务在任何一屏最多出现两次（列里一行、线里一段）。Rakazo 的数字是 1 / 5 / 1 / 1，用户看到的「合理」就是这几个数。

### 8.2 左栏：一列会话

- 宽度跟随 dsh：默认 280，可拖 264–420，不再逐次强制；折起时是 dsh 的 56px 轨（web 上 AppFrame 写死，桌面版为 0），轨里只有 M 标和展开键。
- 头一行：搜索框 · 「+」。没有品牌标（M 标只在「今日」行出现一次）。
- 行只有一种形：状态字形 20px · 标题 14px（未读 500 字重）· 时间 11.5px 等宽（今天 HH:MM，更早 M/D）· 未读点 6px · 第二行 12.5px 最近一句。行上无操作、无悬停按钮、无右键。选中与悬停都是 --surface 圆角 12。
- 顺序：「今日」固定第一行（字形 = M 标，在跑时描边画一遍；第二行 = 助理线程最近一句，或「2 个在跑 · 1 份等你看」）；其余任务与例行按最近活动混排，不分日期组（时间在行上）。例行行字形是循环线形，第二行「每天 19:00 · 没有变化」；任务行字形是状态。只列用户交办的任务，安静的例行运行不占行。上限 80 行，其余靠搜索。
- 第二行的规则（服务端 previewOf）：在跑 = 当前步骤；失败 = 失败 · 原因；等你答 = 问题；完成 = 结果第一行「label value」，没有可数结果就「已交付 · 已核验」；绝不重复标题。
- 未读：服务端 seen.json，只由「不请自来」的事置位——任务做完或失败、核验盖章、等你答、有变化或报告类的例行运行、提醒到点、今日线程里助理的回复；工具步骤、安静运行、用户自己的话不置位；打开的线程即读。网页与手机共用。
- 搜索非空时整列换成结果：任务 · 例行 · 交付物，同一种行，靠字形区分，不加分组标题。
- 底部两行：交付物（查找页）· 设置。

### 8.3 中栏：一条线程

760 阅读列。头部：返回 · 衬线标题（任务与例行线程沿用现有 26px 衬线 h1，用户定的字体不动；列与状态词用无衬线）· 一行元信息 · 显示器键（只在右栏有内容时出现）· ···。用户气泡在右（20px 是唯一圆角例外）、回复是正文、无头像、无灰底。底部同一个 dock：不变色、无 + 与 Stop、Enter 发送；回复某段时输入框上方出引用胶囊「接着说」，走 /say 进那个任务的会话，同时在今日线里留下用户的话和一条会原地更新的交办行。

- 今日线程：头部「今日 · 9月30日」+ 状态词；其下一条 44px 的等你看栏「等你看 3 · 2 个在跑」，吸顶，点开原地展开清单（同序、每行至多一个按钮），有提醒 / 失败 / 等你答时自动展开，清零即消失——不再是压在对话上面的十行清单，也不会被「落到最新」推出屏幕。再往下是 GET /feed 的线：按天分页、「加载昨天」只读回看、日期分隔只在回看时出现；一任务在线里最多两条：用户的话、交办行。交办行就是交付卡：原地从「查阅 · 40s」变成「✓ 已交付 · 已核验」，点开任务线程；不再另发交付卡。安静运行零条，工具流永不进线。问候与例行小段删去。
- 任务线程：原话气泡 → 在跑时一行「在做 · 步骤 · 耗时」原地更新（没有进度卡）→ 回复段 = ✓ 可数结果按行列出（不套卡，不加边框）+ 交付物正文全宽纯文本 + 一行元信息「已核验 · 核对 16 · 问题 3 · 有用 / 没用」（核验状态读实时值：核验中 / 已核验 / 核验发现 n 处 / 未能核验，绝不在核验员盖章前写「已核验」；问题 n 点开核验员备注）→ 交付之前的叙述留在「过程」折叠行里，交付之后的收尾文字作为回复正文 → 追问接在后面，再交付就是新一段，线程本身就是版本。「过程 · n 步 · 3m」折叠行留在线尾、dock 之上，任何宽度都在。··· = 取消｜再来一次、重新核验、导出 Markdown、导出 PDF、原始对话、重命名、删除。
- 例行线程：标题 + 一行元信息；按运行倒序，每次 = 日期分隔 + 那次的回复；没有变化只留一行「没有变化」，报告永远全文。dock 占位「追问这一次」，落最近一次运行；··· = 现在跑一次、暂停、改要求（同一个衬线输入框预填原句，重新解析计划）、删除。
- 新线程：「+」打开空线程，衬线一句「要什么结果？」+ 示例胶囊 + dock；发送走 /create 一定建任务，线程原地变成该任务（带时间则变例行）。今日的 dock 仍由助理三分。
- 助理的连续性：今日任务仍按天建（工作记录与上下文清零的免费好处），但 compose 注入跨天的最近 20 句用户 / 助理话（≤2000 字）与最近 3 个结果标题，并有 mywork_task_say 把追问送进旧任务；提示词里不出现「昨天的对话你看不到」这类认错的话——用户永远不该读到助理承认失忆。

### 8.4 右栏：这台电脑

只有一段：画面。复用 dsh-mywork-browser 的 LiveBrowser 紧凑分支（JPEG 帧画到 img，不是 iframe），点画面即在原地接管、FollowPill 变「你在控制 · 交还」，不再跳到 dsh 的右侧栏（不碰 ctx.sidebarRight，零 alpha 接口）。走自声明插槽 mywork.thread.aside，浏览器包只在任务活动里出现过 browser_* / open_url / web_fetch、或任务在跑且模型正在浏览时注册这一段，否则返回空，显示器键不渲染、不留空框。宽度按容器算不按视口：中栏容器 ≥ 760 + 384 + 间距时是栅格列，否则是不带遮罩的滑出层，760 列永远不被挤。默认关；在跑且用过浏览器时自动开一次，关掉记住。过程留在线里，文件就是回复段——右栏不放例行、不放设置、不放过程。

### 8.5 手机

首页 = 这一列（M 标在「今日」行、搜索、「+」）；线程屏与桌面中栏同形（今日 / 任务 / 例行 / 新 四种）；显示器键推入「过程」屏（桌面会出画面时才带画面）。启动落在列，第一行是今日：「Cue 那种」的会话感由列首那一行给，不伪造一个用户没见过的返回栈。配对与 LAN 网关不变，无推送中继。删 Tasks / MyWork / NewTask 三屏。

### 8.6 去掉什么

56px 轨里的图标导航与「+ 新任务」宽按钮；侧栏 今日 / 任务 / 例行 导航；日期分组标题；任务列表页与筛选胶囊；例行列表页与三个按钮；新任务页；今日的问候、例行小段与顶部十行清单；正文下的导出 ghost（进 ···）；线里的结果卡与交付卡；旧两栏 CSS 与零引用词条；README 与 design-contract 的两栏描述。

### 8.7 与规则的冲突及决定

- 一屏一件事：中栏永远一条线程；左栏是导航；右栏默认关、只服务当前线程、只有一段。容器数比今天少。
- 列表无操作：列、搜索结果、交付物页行上无操作；动作在线程 ···；等你看例外原样（每行至多一个按钮）。
- Grok 式对话、composer 不变色：回复是正文、无头像、无 + / Stop；取消在 ···。
- 衬线标题：线程 h1 保留衬线；列与状态词无衬线。
- 浅色默认不改，暗色孪生已在；用户说的合理在结构。
- 无 iframe：画面是 LiveBrowser 只读分支。
- dsh 钉 0.1.6-alpha.2：右栏走自声明插槽；侧栏宽度不再逐次强制。
- 自定规则的让步（不是用户规则）：改面不改骨的范围；任务页单列（右栏是 aside，DESIGN §9 改写）；侧栏 240 与轨里的导航；新任务独立页（「一定建任务」的保证转给「+」）；今日的清单与例行小段；FLOW「明天新的一条」（只读回看，上下文按天但注入跨天最近几句）；单成员不做列表（行是任务不是 bot）。

### 8.8 不借什么

bot 名册与自建 bot、灰底回复气泡、彩色头像、深色默认、composer 的 + / 麦克风 / Send+Stop、行内 Running·Stop 与归档 Restore/Delete、右键菜单、独立的 Take control 按钮（接管是点画面）、cron 编辑器与 webhook 触发、⌘K、铃铛 Activity 覆盖层、iframe 预览、推送中继、大写分组标签、20px 全局圆角、线里的结果卡。交付物文件与版本留到下一轮：线程里的再交付就是新一段。

### 8.9 落地顺序

每步可发可退，引擎与三份 JSON 只在「找人」一步动。

| # | 步骤 | 验收 |
|---|---|---|
| 1 | 服务端字段：taskView 加 lastAt / preview / unread / attentionAt，POST /seen 与 seen.json，例行视图加 lastRunSummary / preview / unread，GET /search，活动裁剪只裁工具条目且安静运行不占保留额度，GET /today?day= | /tasks 每项带三字段且不含 activity；200 任务 + 100 安静运行后 30 天前的用户任务线程仍完整；/search「周报」命中报告 |
| 2 | 左栏成列（§8.2） | 每行两行文字 + 时间 + 未读点，行上无操作；搜索换列；点行切换中栏；未读打开即消失；dsh 0.1.6-alpha.2 侧栏不崩 |
| 3 | 任务页成线程（§8.3）；今日改头部与等你看栏 | 原话气泡在右、回复正文在左、✓ 行在正文上、一行核验 + 评价在正文下；在跑只有一行在做；追问接在同一条线；··· 七项；核验盖章前不写已核验 |
| 4 | 今日成线 + GET /feed：按天分页、加载昨天、引用胶囊「接着说」、mywork_task_say、跨天上下文 | 一天 20 任务 + 3 例行（1 安静）+ 1 提醒：线里 ≤ 20×2 + 2 + 1 条，安静 0 条；带引用的「再短一点」进原任务且今日线里留一行会原地更新的交办行 |
| 5 | 例行线程、新线程、Thread 抽成预置文件 thread.cjs，删任务列表页 / 例行列表页 / 新任务页 | 「+」→ 空线程 → 发送 → 同一中栏变成在跑的任务；日报例行线程按天列出每份报告；四种线程共用头部 / dock / ··· |
| 6 | 这台电脑（§8.4） | 只在用过浏览器时出现；img 不是 iframe；点画面接管；容器窄时滑出层不挤 760 列；无 browser 成员时无空框 |
| 7 | 找人（§2.7；recover 保留 waiting 不收成失败） | 缺信息的任务停在等你答，列行与今日栏显示，卡可答，答后同会话续跑并交付；例行不问 |
| 8 | 手机（§8.5） | 打开落在列，线程四种同形，390px 无横滚，TestDevice 构建通过 |
| 9 | 通知三开关与收口：删零引用词条与死样式，README 两张截图（列 + 任务线程 / 右栏在跑） | 关掉「完成」后完成不打扰但「需要你」仍到；安静零通知；正在看的线程无 toast |

## 9. 同事模型（2026-09-30 深夜，替代 §8；用户确认）

用户：「很明显，这个做的产品逻辑都不对」「对，就按这个同事模型来，侧边栏你要有逻辑在的」「可以，开始做吧」。§0 与 §8 都保留了「任务是单位」的骨，Rakazo 的 VISION.md 明说这正是反面：「把 bot 缩成提示词预设或孤立的一次性任务，是在和产品作对」。§9 把单位换成同事。

### 9.1 对象

- **同事**：名字、头衔（一行，可空）、职责（一段话，就是它的指令）、单色字形头像、置顶、通知。一个同事 = 一条永远的对话 + 自己的文件夹（电脑）+ 自己的例行 + 自己的记忆（文件夹里的 AGENTS.md）。默认同事「MyWork」不可删，头像是 M 收成勾。
- **对话里的东西**：你的话；同事的回复（正文）；文件卡（交付物，下面一行核验与评价）；找你卡；例行到点的居中小字；「已安排」居中小字；提醒卡。
- **文件**：同事交出来的东西，挂在回复上；文件页汇总所有同事的文件。
- 任务不再是用户看得见的东西：每一轮干活是一次运行（run），只是对话里的一段。

### 9.2 发一句话之后

- 你发 → 同事干活：左栏头像在动、第二行「在干活 · 步骤」、对话底部一行「在干活 · 步骤 · 40s」；做完回复落在对话里。
- 它干活时你再发：这句话插进正在做的这件事（steer，Rakazo 同），不另起一件；「停」在 ···。
- 缺信息时它停下来问（mywork_ask，每轮至多 2 次）：对话里找你卡、左栏「等你答 · 问题」、铃铛计数；你答的话就是下一条消息，同一会话接着做。例行运行不问。
- 追问就在对话里说，改的就是刚才那份。
- 核验在后台：文件卡下「核验中 → 已核验 · 核对 n / 核验发现 n 处」，不挡你说话。

### 9.3 例行

- 例行 = 到点替你发给某位同事的一句话。属于这位同事，结果回到这位同事的对话。左栏没有例行，没有例行页。
- 两种：做事（到点让同事干活）/ 提醒（只有你能做的事；到点只出提醒卡 + 系统通知，不让同事干活）。
- 建：在对话里说带时间的话（同事调用 mywork_routine_create，归属它自己，对话里出居中小字「已安排 · 每天 19:00 写日报」）；或右栏例行一栏「新例行」。例行运行时不能建例行。
- 到点：对话里先出居中小字「每日日报 · 19:00」，同事照常干活，结果是普通回复。盯变化的没变化 → 对话里不出任何东西，只在运行记录里记「没有变化」；日报周报永远出；日报读所有同事当天的对话和文件。
- 管：只在该同事右栏「例行」一栏。行 = 名字 · 计划 · 下次/已暂停；点开原地展开：原话与计划可改、现在跑一次、暂停/恢复、删除、最近 10 次运行。
- 跳转一条规则：凡是看结果，都跳到那位同事对话里的那一条（滚到并高亮）。右栏运行记录、铃铛、系统通知、搜索结果都遵守；「已安排」小字与搜索到的例行 → 打开对话 + 右栏展开该例行。
- 迁移：现有例行全部归 MyWork。

### 9.4 侧栏

- 顶：搜索（同事、消息、文件、例行）· 铃铛（计数 = 需要你 + 在干活；下拉三组 需要你 / 在干活 / 刚完成，点 → 那位同事对话那一条）· 「+」新同事。
- 中：只有同事，分区 置顶 → 各类型（按类型出现的先后）→ 其他。分区内置顶的在前（MyWork 默认置顶），其余按最近对话时间；状态不改变顺序。行 = 头像（干活时在动；右上角红色未读数，同 IM）· 名字 · 时间 · 第二行（最近一句 / 在干活 · 步骤 / 等你答 · 问题）。行上无操作。列表末尾一行「新同事」。
- 底：文件 · 设置。
- 色彩：两套配色，炭 · 香槟（默认）和 墨 · 雾紫，各有深色和浅色，跟着 dsh 的明暗方案。色板只在 dsh-mywork-shell 里定义一份（OKLCH 计算，文字全部 ≥ 4.5:1），同时生成 dsh 自己的 alias token 和 MyWork 页面读的 --mw-* 变量。规则：强调色只给和你有关的（你的消息、等你答、能按的、链接、选中）；状态色只有「需要你」和红（失败、未读）；层次靠明度（侧栏 < 画布 < 卡片 < 气泡）；头像用降饱和的同调色，MyWork 标志不上色。
- 收起：不换布局，只收起文字。dsh 收起后是 56px 的窄栏，所以头像列在任何状态都是 左 12 / 宽 32 / 中线 28；品牌标、每个头像和角标、分区（收起时标签处变成一条短横线，折叠的分区显示人数或未读合计）、新同事、文件、设置都在原位，只是文字不显示，同事名字变成悬停提示。

### 9.5 中栏与右栏

- 中栏：头部 = 头像 + 名字（点开右栏）+ 头衔 + ···（停、清空对话不做）；对话按时间，向上翻加载更早；dock「给 {名字} 发消息」。空对话只有 dock。
- 右栏（只讲这一位同事），顶上两个标签「资料 · 电脑」随时切换。资料（点名字打开）= 它是谁、负责什么、什么时候干活、记住了什么：头像 + 名字 + 头衔 + 类型做成资料卡，直接点文字改（MyWork 是品牌，名字和标志不变，没有头衔和类型）；职责以正文显示，点「编辑」才变成输入框；例行一条一行（一次性的跑完收进「已结束的 n 个」）；「它记住的」读它文件夹里的 AGENTS.md；置顶、通知；删除。电脑（点显示器图标打开）= 它现在在干什么、手上有什么：屏幕（上网时是实时画面，可以接手，否则一行说明）；文件夹分「它维护的表」和「最近的文件」，按类型配线条图标，点开在中间阅读。
- 新同事：「+」→ 右栏「新同事」：一句「它负责什么」（必填）+ 名字（可空）。建好后进它的对话；名字空时它第一轮给自己起名（mywork_mate_update）并自我介绍；那句话带时间就顺手建好例行。

### 9.6 手机

首页 = 同事列表 + 铃铛 + 搜索 + 「+」，底部文件；点进对话；右上角进同事页（例行、设置、文件；不做电脑画面）。

### 9.7 引擎（dsh 0.1.6-alpha.2 上怎么做）

- 一个同事一条 dsh 会话 `mywork-mate-<id>`：第一次用 agents.create 建（cwd = `$DSH_HOME/mywork/mates/<id>/`，注册为工作区；preset = 每个同事一份 `$DSH_HOME/.agent-presets/mate-<id>/agent.cordis.yml`，以 standard 的行为基础（含压缩、fs、bash、present），persona 前缀写名字、头衔、职责）；之后每条消息走 sessionController.prompt（空闲 mode 'queue'，干活中 mode 'steer'）。
- 运行记录由会话事件驱动：全局监听 session/event，前缀 `mywork-mate-`；turn/start…turn/end = 一次运行；user/message 进运行；tool/call、assistant/message 照旧；deliver 找当前运行。取消用 controller.cancel（保留收件箱）。
- 核验不再阻塞：运行结束立即 done，有交付物就后台起核验会话，结果盖在交付物上。
- 记忆：同事文件夹里的 AGENTS.md（agent-instructions 自动载入）；工具 mywork_remember 追加。
- 移除：今日助理与 mywork-assistant preset、dayKey、mywork_task_create / mywork_task_say / mywork_tasks、交办行、feed.js 的今日线、「交给后台」的系统提示段、新任务页、任务页、任务列表、今日页、等你看条、交付物页（换成文件页）。
- 重启：恢复有待处理收件箱的同事会话并唤醒。

### 9.8 API 契约（/mywork-tasks/api）

```
GET  /mates                         → { items: Mate[] }
     Mate = { id, name, title, description, glyph, pinned, isDefault, notify, createdAt,
              lastAt, preview, unread, state: 'idle'|'working'|'waiting', step, since, ask|null, routineCount }
POST /mates/create  { description, name? , title? }        → { mate }
POST /mates/update  { id, name?, title?, description?, pinned?, notify? } → { mate }
POST /mates/remove  { id }                                  → { removed }   (default mate refuses)
GET  /mates/thread?id=&before=&limit=                        → { runs: Run[], nextBefore|null }
     Run = { id, mateId, trigger: 'user'|'routine'|'system', routineId?, routineTitle?, status: 'running'|'waiting'|'done',
             input, activity[], deliverables: Deliverable[], verification|null, ask|null, error, quiet, step, createdAt, startedAt, finishedAt }
     (runs ascending by createdAt; quiet routine runs are omitted; migrated old tasks are runs of the default mate)
POST /mates/say     { id, text }   → { mate, runId }   idle: new run · working: steer · waiting: answers the pending ask
POST /mates/stop    { id }         → { mate }
POST /answer        { id: runId, askId, answer } → { run }            (ask cards' buttons)
GET  /routines?mate=               → { items: Routine[] }  Routine += { mateId }
POST /routines/create { mateId, input } · /routines/update { id, input } · /routines/run { id } · /routines/enable { id, enabled } · /routines/remove { id } · /routines/ack { id, at }
GET  /activity                     → { needs: Item[], working: Item[], recent: Item[] }
     Item = { mateId, mateName, runId, at, text, kind: 'ask'|'failed'|'working'|'done'|'remind' }
GET  /files?mate=&q=&since=        → { items: Deliverable[] }   Deliverable += { mateId, runId }
GET  /deliverable?id= · POST /rate { id, rating }
POST /seen          { id: mateId }
GET  /search?q=                    → { mates: Mate[], messages: [{ mateId, runId, at, text }], files: Deliverable[], routines: Routine[] }
```

客户端跳转事件：`mywork:open-thread` { kind: 'mate', id, runId? }（runId 有值时滚到并高亮）/ { kind: 'new-mate' } / { kind: 'files' } / { kind: 'routine', id }（打开所属同事 + 右栏展开）；`mywork:thread-opened` { kind: 'mate', id }。
