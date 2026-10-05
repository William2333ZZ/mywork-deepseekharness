# 内核现状：主动的钩子和限制

原始调研记录（2026-10-05）。每条以所附出处为准。汇总见 [../2026-10-05-proactive.md](../2026-10-05-proactive.md)。

## 现在已有的主动行为

- 【说明】下文中带「代码」标签的，是 2026-10-05 读代码得到的事实；「行为证据」来自开发者本人 9-29 至 10-05 的自测数据，目录是 .dsh-dev-home/home/mywork/（tasks.json、routines.json 等），会话日志在 .dsh-dev-home/home/sessions/*/mywork-mate-*/session.v3.jsonl.zstd，这些都不是目标用户的使用；「厂商说法」指 dsh 包的 README；「推断」指没有实测过的判断。以下路径省略前缀 。
- MyWork 默认晨报【代码】在 packages/tasks/src/index.js:342-356。首次启动时建一条每天 08:40 的例行，并在 defaults.json 里记下 morningBrief，所以用户删掉后不会再建。晨报命中 wantsRecord 和 wantsSchedule（routines.js:261-263），因此会注入 workRecord（index.js:284-318）和当天日程表（index.js:265-282），而且永远不会静默（engine.js:549）。【行为证据】默认晨报在 10-03、10-04 各跑过一次，素材分别为 7,967 字和 6,877 字（tasks.json 的 material 字段）。10-04 10:21Z 用户说「我想以后每天早上都能看到 AI 行业有什么新东西」，MyWork 在 run-muto8ega832797 里先调 mywork_routine_cancel 取消旧晨报，再新建「晨报（含 AI 行业新东西）」08:40；10-05 这份晨报的素材是 8,179 字。晨报 8:40 出，排在 3 条 9:00 例行之前，看不到它们（current-form.md 第 6 点）。
- 做事型例行【代码】调度每 30 秒跑一次 tick（index.js:948、916-919），到点由 runRoutine 建一轮 trigger=routine 的运行（index.js:613-617）。提示词里带上一次交付物的前 4,000 字，并要求最后一行写「变化：有/无」（routines.js:288-297）。写了「变化：无」的那一轮静默（engine.js:547-551、571-576）。【行为证据】现在共有 16 条例行：每天 11 条、每周 3 条、一次性 2 条。不含迁移数据的 71 轮里，45 轮是例行发起的（63%）。47 次运行回执里 3 次静默，其中 1 次误藏了产品雷达的首份日报。0 次失败（current-form.md 第 2、7、13 点，routines.json 复核一致）。
- 自我介绍（隐藏的 system 轮）【代码】建同事时 index.js:366 会排一轮。introPrompt（engine.js:174-180）让同事在没名字时先给自己起名，职责里带时间的就调 mywork_routine_create，然后用两三句话自我介绍。这一轮明令不交付（engine.js:178），也不能提问（engine.js:675）。【行为证据】一共 6 轮自我介绍，6 轮都调了 mywork_routine_create（财联社记者一次排了 3 条，日程助理排了 2 条）。介绍里都会主动说「第一次是明天早上 9 点」，但没有一轮交出样本。之后用户自己发了 5 次「先跑一次给我看看」这类话（current-form.md 第 3 点）。
- 「第一件事」（MyWork 转交）【代码】mywork_mate_create 带 first 参数（index.js:848），由 handOver（index.js:702-711）把它排成新同事在自我介绍之后的一轮用户运行，source 记为 'mywork'，界面显示「MyWork 转交」。【行为证据】只发生过 1 次：10-04 10:28Z 红书雷达的 run-mutogs315ee362，内容是「先跑一次今天的…」。
- MyWork 提议建同事【代码】这条只写在人设里（index.js:65），由 mywork_mates 和 mywork_mate_create 两个工具配合（index.js:826-858），代码里没有任何强制。【行为证据】10-04 有两件符合「长期要盯的事」的请求。10:22Z 的招聘那件（run-muto9yyx032841），MyWork 没有问，直接给自己建了每周五 16:00 的例行（工具调用依次是 web_search、bash、mywork_routine_create）。10:26Z 的小红书那件，它用选项卡问了「新建一位同事」，用户选了，建出红书雷达。两次里命中 1 次。
- 「已安排」小字【代码】同事在一轮里调 mywork_routine_create 时，index.js:759 往这一轮写一条 activity（kind 'routine'、action 'created'）。thread.cjs:132 把它画成「已安排 · 计划 标题」，client/index.js:1660 让它可点，点了打开右栏对应的例行。工具返回给模型的话要它「直接回话，不要再加提醒」（index.js:762）。【行为证据】tasks.json 里共有 13 条这样的记录。
- 提醒卡【代码】提醒型例行到点时不叫醒同事，而是由 index.js:604-611 写一个合成的已完成运行，界面画成 RemindCard（client/index.js:1395-1405）。未确认的提醒会进铃铛的「需要你」（index.js:647），也会推到 IM（packages/im/src/index.js:74-77）。【行为证据】提醒型例行 0 条，reminders.json 是空的。旧插件的 reminder_add 在一轮迁移数据里被调过 2 次（task-mumz7por0f545b），说明旧的提醒工具对同事仍然可见。
- workRecord 注入【代码】判断要不要注入，用的是正则 /晨报|周报|日报|月报|汇报|总结|回顾|复盘/，同时匹配例行的 input 和 title（routines.js:261）。注入的素材写进 run.material（engine.js:323-325），并让这条例行永不静默（engine.js:549）。workRecord 不收 system 轮（index.js:293）。【行为证据】11 轮拿到过素材：MyWork 的日报、周报、晨报共 10 轮，每轮 1,569 到 14,038 字；另有 1 轮是误判，红书雷达那条盯话题的每周例行因为标题里有「周报」二字，被塞进了全体同事 23,052 字的工作记录。红书雷达 10-05 00:12Z 那轮「补全版」是 system 轮，所以不在任何工作记录里。
- 24 小时没人答就按假设续跑【代码】engine.js:826-840，每次 tick 都会检查。【行为证据】0 次触发：7 天里只有 2 次提问，都被回答了。
- 服务重启后主动唤醒【代码】engine.js:847-899 负责修复和恢复：启动 3 秒后（index.js:946），把重启前已交给会话的请求重新发一遍，再插一句「（MyWork 服务刚重启。接着处理排队的消息。）」（engine.js:41）。
- 桌面端 toast 和浏览器通知【代码】Overlay 在 client/index.js:2259-2285。有同事在干活时每 4 秒轮询 /mates 和 /activity，否则每 30 秒一次，窗口获得焦点时也会立刻拉一次（client/index.js:62-65、680-687）。用户正看着某位同事的对话、页面也可见时，这位同事不弹 toast（738-745）。系统通知只在权限已是 granted 时才发（2268），而任务插件的客户端从不申请通知权限，整个仓库只有旧的 schedule 客户端申请过（packages/schedule/src/client/index.js:610）。这些都要求页面开着。手机端只在前台轮询（apps/mobile/src/store.tsx:185-186），apps/mobile/package.json 里没有任何通知相关的依赖。
- IM 推送【代码】packages/im/src/index.js:58-96。会推的有：提醒、等你答、有变化的例行、失败的轮，以及耗时超过 2 分钟的用户轮（LONG_RUN_MS，见第 62 行和第 90 行）。最后这条是整个代码里唯一一处「用户大概走开了」的判断。system 轮（84 行）和静默轮（88 行）不推。前提是 notifyConfig.automation.default 已经设好（66-67 行），而这一项没有界面。【行为证据】开发目录里没有 im-notify.json，所以这条链路没有生效；10-04 的日报和 10-05 的晨报里都写着「现在没有任何可用的 IM 聊天」（current-form.md 第 11 点）。
- 同事自己多跑的一轮（真实发生过）【代码】一条 user/message 如果不带 MyWork 自己的请求号，到下一次 tool/call 或 assistant/message 时，引擎就给它建一个 trigger=system 的「孤儿运行」（engine.js:448-450）。【行为证据】10-05 00:12Z 的 run-muuhwj36d83751：红书雷达的会话日志里有 5 条 subagent-settled 消息，晚到的子任务结果把它唤醒，它改写报告，在第一份交付约 2 分钟后又交了一份，对话里看起来是凭空多了一张文件卡。

## 可用的钩子

- 调度器【代码】每 30 秒一次 tick（index.js:948），依次跑 routines.due()（routines.js:189）、runRoutine 和 expireAsks（index.js:916-919）。服务停着期间错过的多次只补跑一次：ran() 从「现在」开始算下一次（routines.js:197）。
- 自己给自己安排下一次【代码】同事可以在用户轮或 system 轮里调 mywork_routine_create（index.js:752-763），在例行轮里会被直接拒绝（index.js:757），例行的提示词里也写着「不要新建例行」（routines.js:284、294）。一次性的时间只认两种写法：「N 分钟/小时后」，以及「今天/明天/后天/周X + 几点」（routines.js:88-115）。「3 天后」「10 月 9 日」都解析不出来，会返回 400「没看出时间」（index.js:576）。工具参数只有 input 和 title（754 行），而 createRoutine 本身接受结构化的 schedule（index.js:570），HTTP 的 /routines/create 也接受（883 行）。另外，mywork_routine_cancel 在例行轮里不受限制（index.js:774-790），所以「盯到出结果就自己取消」这条路代码上已经通，只是没人告诉模型。同事也没有修改例行的工具。【行为证据】2 条一次性例行都是用户要求的（「10分钟后你再跑一次」「5分钟后你在做一份新的」），同事自己主动安排过的是 0 次。
- 例行里提问【代码】例行轮直接拒绝 mywork_ask（engine.js:674，返回「例行不能提问，把缺的写进结果」），自我介绍轮也拒绝（675 行）。人设里同样写了「那时不要提问」（index.js:60）。
- 事件触发：文件变化【代码】在 packages/*/src 里搜 fs.watch、watchFile、chokidar，结果为空，没有任何文件监听。
- 事件触发：日历【代码】唯一的日历来源，是读各位同事文件夹里 日程表.csv 或 schedule.csv 中当天的行，而且只在晨报里用（index.js:265-282、routines.js:263）。没有任何外部日历接入。【行为证据】日程助理的日程表.csv 只有 1 行。
- 事件触发：外部 webhook【代码】MyWork 的 HTTP 路由都套了 rejectUntrusted，要求同源并已登录（harness.js:82-91、index.js:960），外部调用方进不来。【厂商说法】npm 里装了 @deepseek-ai/dsh-webhook 0.1.6-alpha.2，但 dsh-base 和 dsh-web-app 的 cordis.patch.yml 都没挂它。它的内置动作是「每个事件新建一个根会话」（README「Session request」），不会路由进同事已有的会话。不过 README「Rule interface」说规则的 run() 可以执行任意可信代码并返回 null，所以理论上能在规则里调 myworkTasks.say【推断】。
- 事件触发：IM 收到的消息【代码】@michengai/dsh-im-connect 0.1.57 支持在聊天里发 /session <id>，把这个聊天绑到一个已有的 dsh 会话上（lib/engine/router.js:152-165、chat-commands.js:14）。IM 发进来的消息 source 是 {kind:'user', rpcId}（gateway.js:623）。MyWork 引擎会把它当成「在别处打进会话的一句话」，单独开一轮（engine.js:474-477）。【推断，未实测】把一个微信或飞书聊天绑到 mywork-mate-<id>，就能和这位同事双向对话，它的回复也会被送回 IM。
- 检测用户空闲或久不在【代码】apps/desktop/main.js 里没有 powerMonitor、Tray、setLoginItemSettings、powerSaveBlocker、getSystemIdleTime，grep 只命中 182 行的 window-all-closed。现成能用的在场信号有：(1) 打开某位同事的对话时 POST /seen（client/index.js:1538 → index.js:893-899），seen.json 里每位同事各一个时间戳；(2) 页面开着时持续轮询 /mates，可以反推「界面开着」；(3) 客户端里读得到 document.visibilityState（client/index.js:740），但服务端拿不到；(4) 手机通过中继连着电脑时，中继状态里有 phones 计数（packages/kit/src/relay-client.js:187，由 packages/kit/src/index.js:149 暴露）；(5) 手机 App 回到前台时触发 AppState 'active'（store.tsx:186）。没有全局的「最后活跃时间」记录。
- 用户打开时主动说话【代码】没有这个钩子。打开对话只会 POST /seen（index.js:893-899）。空对话里的 Hello 是静态的三句示例（client/index.js:1792-1806）。打开时唯一的服务端相关表现是「以下是新的」分隔线（client/index.js:1510-1525）。
- 事件总线和服务【代码】ctx.emit('mywork/task', {kind, run, mate, ...})，kind 有 queued、started、step、text、deliverable、verifying、verified、waiting、done、remind、routine、mate（index.js:12-13、211-220），外部还能用 api.on 订阅（931 行）。IM 插件就是这样消费的（im/src/index.js:63）。别的插件可以通过 myworkTasks 服务调用 say、createRoutine、runRoutine（index.js:921-932、942）。全局 session/event 监听在 index.js:944。
- 后台任务完成后唤醒同事【厂商说法】dsh-tool-jobs 的 README 第 40-42 行：后台任务结束时，空闲的主人会被一个后续轮叫醒；默认 completionDelivery 是 wakeup，maxConsecutiveWakes 是 3（56-57 行）；只有「用户写的消息」能补满唤醒次数（94 行），而 MyWork 发出的每一条提示都算用户消息（dsh-api-session-controller/lib/index.js:748-751）。等着送达的通知在主人被销毁时丢失（175 行），而且只在本进程内有效。同事的预设里有 tool-jobs 和 bash（.dsh-dev-home/home/.agent-presets/mate-mywork/agent.cordis.yml:89-90）。【推断，未实测】同事可以用 run_in_background 跑一个 sleep，当作短程自定时器；被唤醒的那一轮会落成孤儿 system 轮。
- 后台子代理结束后唤醒同事【厂商说法】dsh-tool-subagent 的 README 第 61、165 行：continuable 模式下，子代理结束时运行时会给父会话发一条结果通知。dsh-base 默认就是 continuable（cordis.patch.yml:356-361）。【行为证据】红书雷达那轮额外的 system 轮就是这样产生的，见上文。
- 当前时间【行为证据】time-context 插件每一步都把当前时间注入会话：7 份同事日志里共 492 条 source 为 plugin:time-context 的消息。所以模型知道「现在几点」，但不知道用户上次什么时候来过。

## dsh 里和主动有关的能力

- dsh-goal、dsh-goal-round-driver、dsh-command-goal【代码】三者作为宿主行挂在 dsh-base（.dsh-dev-home/npm/node_modules/@deepseek-ai/dsh-base/cordis.patch.yml:299-306），dsh-tool-goal 在 421-424 行。同事的生成预设里也带了 command-goal 和 tool-goal（mate-mywork/agent.cordis.yml:110-114，由 packages/tasks/src/index.js:102-108 从 standard 预设生成）。所以同事会话里现在就有 get_goal、create_goal、update_goal。【MyWork 里实测】没有用过：7 份同事日志里 goal/change 事件为 0，tasks.json 的 steps 里 goal 工具调用也是 0。
- dsh-goal 的语义【厂商说法】出自 dsh-goal/README.md。每个会话最多一个当前目标，有 active、paused、blocked、complete 四个阶段，默认轮数上限 256。状态只存在会话日志里。会话一旦重新开始（resume 或 fork），即使目标仍是 active，也会被「解除武装」，要人明确恢复才继续。只按轮数计，不管 token、钱、时间；没有独立的评判者，是否完成由调用方自己说了算。
- round driver【厂商说法】出自 dsh-goal-round-driver/README.md。会话一空闲、目标处于武装状态、轮数还没用完，它立刻排下一轮，两轮之间没有任何间隔，不能安排在某个时间。遇到这些情况会停：轮数用完（记为 blocked，代码 round-limit）、被取消（转为暂停，不自动重启）、max tokens、写盘失败。不做异常重试。【推断】它适合「一口气连续推进一件长事」，不适合「每天看一次、直到某件事发生」，后者还得靠例行加状态文件。
- tool-goal 的授权门槛被 MyWork 绕过了【代码】create、edit、pause、resume 要求当前轮里有 source.kind==='user' 的消息（dsh-tool-goal/lib/index.js:49-51）。而 MyWork 经 session controller 发出的每条提示，包括例行、自我介绍、24 小时续跑、重启唤醒，source 都是 {kind:'user', rpcId}（dsh-api-session-controller/lib/index.js:748-751）。所以例行轮里也能建目标。create_goal 的说明还允许模型自己推断用户想要一个目标（lib/index.js:123），这段 goal 指引每次请求都会进系统提示（196 行）。【推断】同事可能自发建目标，这个风险从未出现过，但代码上没有任何东西拦着。
- goal 轮在 MyWork 引擎里会怎样【推断，按代码】goal 轮的 user/message 的 source.kind 是 'goal'，onUserMessage 不处理（engine.js:453-478），于是这一轮成为孤儿 system 运行（448-450 行）。后果：铃铛「在干活」里显示成「自我介绍」（index.js:645）；不能提问（engine.js:675）；不进 workRecord（index.js:293）；不推 IM（im/src/index.js:84）；每一轮仍受 20 分钟计时（engine.js:413）；开跑不经过并发上限 pump（engine.js:383-395），只是跑起来以后会占住名额。用户在 MyWork 输入框里打 /goal 不会被当作命令：输入框走 /mates/say → controller.prompt，而 dsh-commands 的 README 写明命令只走界面的命令通道。要用目标，得由宿主插件直接注入 ctx.goals 来调。
- dsh-tool-ralph【代码】默认关闭（dsh-base:433-438，同事预设 252-253 行）。【厂商说法】它每轮新开一个代理，完成与否靠代理自报，适合人明确要求的迭代。
- 后台任务和子代理的唤醒【厂商说法】dsh-tool-jobs/README.md:40-42、56-57；dsh-tool-subagent/README.md:61、165。dsh 里能让同事在没人发话时自己开一轮的现成机制，只有这两个加上 goal driver。【MyWork 里实测】子代理唤醒发生过 1 次（红书雷达，5 条 subagent-settled）；后台任务唤醒 0 次（日志里 run_in_background 0 次）。
- heartbeat 和 memory【代码】0.1.6-alpha.2 里没有这两个包。对 .dsh-dev-home/npm/node_modules/@deepseek-ai 做 ls，找不到 heartbeat 或 memory 相关的包；grep heartbeat 只命中传输层的保活（dsh-api-gateway 的 stream-server，dsh-im-connect 的 qq、wecom 通道）。
- 记忆（dsh-agent-instructions）【代码】dsh-base 第 275-278 行挂载，maxBytes 65536。【厂商说法】README 第 12、32 行：只在第一次请求时载入 $DSH_HOME/AGENTS.md 和项目链上的 AGENTS.md；之后只有第一方的 read、write、edit 碰到文件，或会话 resume 时，才会刷新。【推断】mywork_remember 是宿主直接 appendFileSync 写的（index.js:806），不算第一方文件操作，所以写进去的那一行很可能要到会话 resume 才被模型看到。【行为证据】每份同事日志里 agent-instructions 来源的消息有 1 到 3 条。
- 压缩（dsh-compaction-basic）【厂商说法】默认在路由模型上下文窗口的 80% 开始压缩，保留最近 16%（README:62-67）。【行为证据】日志里的 request/context 显示同事都跑在 deepseek-flash 上，上下文窗口 1,000,000，所以要到约 80 万 token 才会压缩。单步提示词最大的是 MyWork（20 轮）37.2 万，红书雷达只跑了 6 轮就到 34.5 万。7 份日志里压缩事件为 0。EDITIONS §7.4 写的「没有验证」，这里可以落定：7 天里没有触发，而且到 80 万之前都不会。
- token-meter【代码】dsh-base 第 324-325 行挂载。【厂商说法】它提供会话级的 tokenUsage 投影（未缓存输入、输出、缓存读、缓存写），以及按轮汇总的 deriveTurnTokenUsage（README「Session projections」）。【行为证据】assistant/message 事件的 data.usage 里直接带着 inputTokens、outputTokens、cacheReadTokens、cacheWriteTokens，引擎的 onSessionEvent 拿得到，但现在没有读。
- llm-pi-ai 与模型钉死【代码】llm-pi-ai 作为休眠的多家模型适配器挂在 dsh-base:107-115。同事会话的模型在建会话时就钉死（engine.js:53-68、226-229），取当时的 agentDefaultModel，默认是 deepseek-flash（dsh-base:82-86）。所以主动跑的轮没法单独换一个便宜的模型，除非另开会话。
- dsh 自带的调度和自动化【代码】dsh-schedule 在 npm 安装里有，但没挂载（dsh-web-app 的 cordis.patch.yml:330-334 把 ui-schedule 关了）。@michengai/dsh-automation 0.1.52 是挂着的，每次运行新开一个 dsh-automation-session- 会话（packages/im/src/notify.js:5-8），和同事无关。人设禁止同事用这些工具（index.js:60）。【行为证据】同事仍然调了 automation_list 4 次、reminder_add 2 次（tasks.json 的 steps）。
- 消息来源的种类【代码】dsh 的 MessageSourceMap 里有 user、plugin、goal、subagent-settled、agent-message 等多种（dsh-api-session-controller/lib/typert.host.js:1587）。但 controller.prompt 一律标成 user，MyWork 也没有别的发消息途径（engine.js:277、281），所以引擎分不出哪些是例行、哪些是人说的话。

## 会卡住主动的约束

- 全局并发 2【代码】默认值在 index.js:36（concurrency 2），上限函数 engine.js:205，判断在 pump 的 390 行；每位同事同一时间只跑一轮（engine.js:387-392）。packages/tasks/cordis.patch.yml 里没有 config，profile 的 cordis.patch.yml 是 []，所以按默认值推，settings.yaml 未读。【行为证据】产品雷达 9:00 的例行在 10-03、10-04、10-05 分别排队 91、61、88 秒。孤儿轮（子代理、后台任务、goal）和核验会话（engine.js:592-641）都不经过这个上限。
- 单轮 20 分钟【代码】默认值在 index.js:36（timeoutMinutes 20）和 324 行，计时器在 engine.js:413。到点取消，这一轮记为「超过最长运行时间。」，不续跑。【行为证据】最长的一轮 631 秒，没有一轮超时。
- 例行不能提问、不能建例行、不能建同事【代码】分别在 engine.js:674、index.js:757、index.js:852，例行的提示词里也写了（routines.js:284、294）。【行为证据】X 登录问题从 10-02 到 10-05 反复出现在两位雷达的报告正文里，一直没有变成「需要你」（current-form.md 第 8 点）。
- 运行记录上限【代码】全体共用最多 2,000 轮，超出就丢最旧的（store.js:54，在 JsonList.save 里裁，store.js:100-101）；每条例行只留 30 次回执（routines.js:27）、30 次提醒（28 行）；例行最多 200 条（26 行）；工具调用只为最新 60 轮保留（store.js:59）。静默轮也占记录。每次更新都整文件重写 tasks.json（store.js:100-108）。【推断】按现在每天 12 到 16 轮，约 4 到 5 个月写满 2,000 轮；一条每 30 分钟的例行每天 48 轮，单靠它约 6 周就满。
- 费用【代码】引擎不读用量（engine.js、store.js 里没有 token 字段）。【行为证据】7 份同事日志加总：72 轮、492 步；未缓存输入 1,971,954 token，缓存读 68,347,136 token，输出 364,193 token。每位同事只有一条会话，单步提示词从约 2.4 万（固定前缀）一路长到 37.2 万（MyWork）。所以每一次主动跑都要把整段历史再送一遍，主要花在缓存读上，按例行次数线性变贵。价格没有算，仓库里没有价格表。
- 电脑关机或关窗【代码】关掉窗口就停掉 dsh 并退出（apps/desktop/main.js:182）；没有托盘、开机自启、阻止休眠，也没有 powerMonitor。重启后错过的多次只补一次（routines.js:197）。重启还会让 goal 解除武装（dsh-goal README），让后台任务的待送通知丢失（dsh-tool-jobs README:175）；webhook 是即发即弃，没有重放（dsh-webhook README）。
- 共用 Chrome【代码】所有会话共用一个 Chrome，Playwright MCP 以非独占方式挂给每个会话，大家用同一组标签页（packages/browser/src/mcp-provider.js:1-10、53）；桌面版用的是 Electron 自己的 CDP 端口 9333（main.js:37-41）。并发 2 时，两位同事可能同时操作同一组标签。要用户亲自登录只能走提问（takeover），而例行轮不能提问。
- 能不能找到人【代码】toast 要页面开着；任务插件的客户端从不申请通知权限（client/index.js:2268）；手机没有推送，只在前台轮询（store.tsx:185-186，MOBILE.md:225）；IM 的默认目标没有界面（im/src/index.js:66-67），开发环境也没配。
- 时间写法【代码】只认每 N 分钟或小时、每天、工作日、每周几、一次性（今天/明天/后天/周X，或 N 分钟/小时后），见 routines.js:61-118。没有交易日、每月、N 天后、具体日期。
- 旧调度工具没收干净【代码】reminder_*（packages/schedule/src/index.js:1-8）和 automation_* 对同事会话仍然可见，只在人设里禁止（index.js:60）。【行为证据】automation_list 被调了 4 次，reminder_add 2 次。
- 非 MyWork 发起的轮被当成自我介绍【代码】孤儿轮的 trigger 是 system，铃铛里显示「自我介绍」（index.js:645）；它们不进 workRecord（293 行），不推 IM（im/src/index.js:84），不能提问（engine.js:675）。

## 照现有模式就能加的

- 给 mywork_routine_create 加结构化时间（at 用 ISO 时间，或直接传 schedule），createRoutine 已经支持；同时让 parseSchedule 认「N 天后」「M 月 D 日 H 点」。这样同事能自己约「3 天后复查」。大小：小。位置：index.js:752-763（工具参数在 754 行）、570-583；routines.js:88-115。
- 例行轮里放开「一次性跟进」：只许建 once 类型，每条链限制深度或次数；再在 routinePrompt 里写明「目标达成就用 mywork_routine_cancel 取消自己」，这个工具在例行轮里本来就能用。这样「持续追到完成」只靠现有例行就能做。大小：小。位置：index.js:757、774-790；routines.js:284、294。
- 把不是 MyWork 发起的轮单独标出来：在 onUserMessage 里读 source.kind（subagent-settled、goal、后台任务通知），不再一律落成 system，改用一个新 trigger（比如 'self'）。这样铃铛不再显示「自我介绍」，这些轮能进 workRecord，也能按规则推 IM。这和 EDITIONS §14 第 14 条为「纠正」新加的触发类型不是一回事。大小：小到中。位置：engine.js:448-450、453-478；store.js:38；index.js:293、645；thread.cjs；im/src/index.js:84。
- 修 wantsRecord 的误判：不再在 input 里匹配「周报」，改成只看标题，或者用显式标记，避免盯话题的例行被塞进 2.3 万字的全员工作记录。大小：小。位置：routines.js:261。
- 加一个「打开时」的钩子：POST /seen 时顺带记一个全局 lastActiveAt。它可以 (a) 让代码拼一行「你不在时：x 位同事交了 n 份，需要你 m 件」，不调模型；(b) 作为「久不在」判断的信号来源，EDITIONS 4.3 只写了规则，没写信号从哪来。大小：小。位置：index.js:893-899；store.js SeenStore（425-461）；client/index.js:1538。
- 桌面端接 Electron 的 powerMonitor（suspend、resume、lock-screen、unlock-screen、getSystemIdleTime），把「用户在不在电脑前」传给 dsh，并在唤醒后立刻 tick 一次补跑。这和 EDITIONS 第 0 批的托盘、自启、不休眠是不同的东西。大小：小到中。位置：apps/desktop/main.js，主进程现在和 dsh 之间只有 stdout，需要用 token URL 调 dsh 的 HTTP。
- 任务插件的客户端申请通知权限，照抄 schedule 客户端的写法，否则网页版的系统通知永远不弹。大小：小。位置：client/index.js Overlay（2259-2270）；参照 packages/schedule/src/client/index.js:610。
- 新建同事时，把「先出一份样本」作为 first 自动排在自我介绍后面。handOver 已经支持 first，自我介绍那一轮仍然不交付。这是 EDITIONS §3「马上出基线」的实现落点，§14 没有列。大小：小。位置：index.js:359-372、702-711；engine.js:178。
- 从日程表派生「会前准备」：tick 里读 todaySchedule 的行，在会前 N 分钟给日程助理排一轮一次性运行。大小：小到中。位置：index.js:265-282、916-919。
- 零代码验证 IM 双向：在微信或飞书聊天里发 /session mywork-mate-<id>，让 dsh-im-connect 接管这位同事的会话，看引擎是否按「别处打进来的一句话」正常开轮、回复是否送回 IM。大小：小，只是验证。依据：im-connect 的 router.js:152-165；engine.js:474-477。
- 外部事件入口，两种做法：(a) 加一条带独立密钥的 HTTP 路由，直接调 engine.say，因为现有路由的 rejectUntrusted 只认同源登录，需要单独鉴权；(b) 挂上 dsh-webhook，在规则的 run() 里调 myworkTasks.say 并返回 null，不让它新建会话。大小：中。位置：index.js:952-969；dsh-webhook 的 README「Rule interface」。
- 文件夹变化触发：用 fs.watch 盯同事的 材料/ 目录，有新文件就给这位同事排一轮。大小：中。位置：index.js 新加 effect，排轮方式照 runRoutine（600-618）。

## 不知道的

- 开发环境实际的 concurrency、timeoutMinutes、verify：按要求没读 settings.yaml；两个 cordis.patch.yml 都没有 config，所以按代码默认值 2、20、false 推断。
- dsh-goal 在 MyWork 同事会话里的实际表现：0 次使用。引擎怎么接 goal 轮、孤儿轮怎么显示，都是按代码推出来的；模型会不会自发调 create_goal 也没见过。
- 用后台任务 sleep 当自定时器是否可行：bash 沙箱有 timeoutMs 60000（dsh-base:221-225），不知道它管不管 run_in_background 的任务；唤醒次数用完后的行为没测过。
- dsh-im-connect 接管同事会话的双向链路没测过，包括 /sessions 列不列得出同事会话、同事的例行回复会不会全部推到 IM。
- Electron 的渲染进程里 Notification 默认是不是 granted：main.js 没设 setPermissionRequestHandler，桌面通知到底弹不弹没验证。
- 电脑休眠或合盖时 setInterval 和补跑的实际表现，数据里看不出发生过没有。
- 每轮花多少钱：没有价格表，缓存读的单价也没取，只拿到 token 数。
- mywork_remember 写的那一行在会话 resume 之前模型能不能看到：只是根据 dsh-agent-instructions 的 README 推断，没实测。
- 数据只是开发者 7 天的自测，没有目标用户、没有长任务、没有一次提醒型例行，所以对「主动行为在真实用户那里怎么样」不能下结论。
- MyWork 在一件请求上分诊、在另一件上不分诊，原因不明：只有 2 个样本，没看到当时模型的推理。

