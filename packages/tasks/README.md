# dsh-mywork-tasks · 任务引擎

MyWork Kit v2 的核心成员：**一句话即任务，后台做完，交付一份东西，自己核对过。** 设计见 [design/MYWORK-V2.md](../../design/MYWORK-V2.md)。形态对标 Manus / Meta Muse：侧栏是任务列表，首页只有一个框，任务页左边是过程、右边是交付物。

## 用户看到的

- **侧栏**（由 dsh-mywork-codex-ui 在 v2 模式下提供）：新任务、今日 / 任务 / 交付物 / 场景、进行中与最近的任务、设置。没有工作区、会话、扩展菜单。
- **今日**：一个框（场景下拉、示例）、进行中、最近。
- **任务页**：左边「进度」= 步骤条 + 消息与工具调用流，底部是对话框：跑的时候可以插话，跑完了可以接着说（同一个会话继续，像 Manus）；右边「交付物」= 正文、核验徽章、有用 / 没用、导出 Markdown / PDF。动作：取消、再来一次、重新核验、过程（打开背后的 dsh 会话）。
- **交付物**：全部交付物，按场景筛，查看器同上。
- **场景**：已装场景的说明和示例，示例一点即任务。
- 完成时右下角弹通知（浏览器通知需授权）；配置了 IM 默认通知目标时同时推到飞书 / 微信。

任务状态六个：排队、执行、交付、核验、等你答、完成（失败也是完成，带原因）。

## 它怎么跑

一个任务 = 一个 dsh 会话，按 `@michengai/dsh-automation` 的做法在服务端无头执行：`agents.create` 建会话、挂 agent preset、钉住模型、权限预设与免审批、挂到工作区、把场景 `compose` 出来的提示词交给它，等它空闲。全局 `session/event` 里 `tool/call` 映射成步骤，消息与工具调用记进任务的活动流（`activity`，每个任务最多 120 条，只保留最近 60 个任务的），最后一条 assistant 文本是摘要。会话里的 `deliver` 工具生成交付物；没有调用 deliver 的任务，把最后的回复当作交付物。

**核验**：任务交付后开第二个只读会话，把任务、执行时调用过的工具和交付内容交给它核对（事实是否能对应到工具调用、有没有承诺了没做的事），要求它最后输出 `{"passed", "checked", "issues", "notes"}`。结果盖在每份交付物的 `verification` 上，任务页和交付物页显示「已核验 / 核验发现问题 / 未能核验」。可用 `verify: false` 关掉，场景也可以给自己的 `verifyPrompt`。

数据在 `$DSH_HOME/mywork/tasks.json` 与 `deliverables.json`。默认同时跑两个任务，其余排队；单个任务最长 20 分钟，核验最长 5 分钟。

## 找人（等你答）

设计见 [design/v2/TEAMMATES.md §2.7](../../design/v2/TEAMMATES.md)。任务默认按合理假设做完、假设写进结果；只在四种情况停下来问：缺关键信息且无法假设 / 需要用户拍板 / 有后果的动作（发消息、付费、删除、对外提交）/ 需要密码、验证码、扫码。

- 机制是**结束本轮**，不是挂着等：任务会话里调用 `mywork_ask({ question, askKind?, options?, detail? })` 写下一条 `{ kind: 'ask', status: 'pending' }` 的活动并结束本轮；引擎在 `finish()` 见到未答的问题且没有错误，就把任务标成 **等你答**（`waiting`）：保留会话、跳过核验、不算失败、不占并发位、不计超时。`askKind`：`text`（自由回答，默认）| `choice`（2–4 个选项，每个 ≤12 字）| `approval`（允许一次 / 拒绝）| `takeover`（要用户去电脑上亲自操作，答「我做完了」）；问题 ≤120 字硬截，`detail` ≤500 字（要确认的原文，等宽展示）。
- 限制：每个任务最多问 2 次（第三次工具报错「这个任务已经问过两次，按合理假设做完并写明假设」）；例行运行报错「例行不能提问，把缺的写进结果」，今日助理报错「今日助理不能提问」；场景可声明 `ask: false`。新问题会把旧的未答问题标成 `superseded`。
- 回答：`POST /answer { id, askId?, answer }` 把问题标成 `answered`，然后走 `say()` 在原会话续跑，送进去的话是「回答：<answer>」（approval 是 允许 / 拒绝，takeover 是 我做完了）；`POST /say` 对等你答的任务也走这条路。等你答时交付过的东西，在任务最终完成时一起核验。
- 24 小时没人答：调度器把问题标成 `expired`，用「用户 24 小时没有回答，按合理假设继续，并在结果里写明假设」续跑。取消把问题标成 `expired`；服务重启不动等你答的任务（它没有在跑的东西，答了就能续）。
- 视图：`taskView.ask` 是当前未答的问题 `{ id, at, question, askKind, options, detail }`（没有就是 null）；列行的第二行显示问题；事件 `waiting`；IM 推「【任务】<标题> · 等你答 · <问题>」。

## 例行与提醒

一句带时间的话就是例行：「每天 9 点给我一份 Node 生态简报」「每周一 8:30 汇总上周的交付物」「工作日 18 点提醒我写日报」「30 分钟后提醒我喝水」。输入框、模型工具 `mywork_routine_create`、`POST /routines/create` 三个入口走同一个解析器（`src/routines.js`），支持 once / interval / daily / workdays / weekly。

- **例行任务**：到点创建一个普通任务。提示词里附上上一次的交付物，要求第一段先写「变化」，最后一行给 `变化：有 / 无`。「无」的运行标记 `quiet`：存进交付物和「例行」页，但不弹通知、不推 IM。这是 OpenMuse 的 Goals & Tracking 和 Muse Code 目标跟踪观察者的逻辑：系统主动盯着，只有变化才打扰。
- **提醒**：不跑 agent。到点进「等你看」直到你点「知道了」，同时弹通知、推 IM。只有你自己能做的事才是提醒（喝水、开会、交周报）。「提醒我写周报 / 整理 / 汇总…」是 MyWork 自己能做的事，所以它是例行任务：到点 MyWork 写好交给你，周报、日报、总结类的运行会拿 MyWork 这段时间的工作记录当素材：用户在「今日」问过什么、答了什么、交办了什么，后台做过的任务、交付物和核对结果（日报取当天，周报取近 7 天，月报取近 30 天）。「每天晚上 7 点根据我一天的问题写日报」就是这样一条。
- 每次运行都在例行上留回执（taskId、交付物、变化、错误）。服务停机期间错过的一次会在启动后补跑一次。
- 数据在 `$DSH_HOME/mywork/routines.json`；调度器每 30 秒看一次到期。

## 场景

内置四个：**通用**、**对话**（就是聊天，不强制交付，`deliverable: false`、`verify: false`）、**调研**（真实浏览器读网页，交付带来源的摘要）、**办公**（有 Univer 时生成表格 / 文档 / 幻灯片，否则 Markdown）。其他成员通过 cordis 服务 `myworkTasks` 注册自己的场景（交易工作台是第一个定制场景）：

```js
export const inject = ['myworkTasks']
export function apply(ctx) {
  ctx.myworkTasks.register({
    id: 'trade', label: '交易', intro: '问一只标的或一个宏观问题，得到一份概率报告',
    examples: ['黄金未来一个月的方向', '美债曲线现在说明什么'],
    compose: (input, { date }) => `……${input}……`,
    toolStepMap: { oracle_fetch: '取数', oracle_report_save: '交付' },
    deliverableKinds: ['report'],
    permission: 'read-only',            // 可选：覆盖权限预设
    model: { provider, model },         // 可选：覆盖模型
    verifyPrompt: (task, docs, activity) => '…',  // 可选：自己的核验提示词；verify: false 关掉核验
    ask: false,                         // 可选：这个场景的任务从不停下来问（mywork_ask 报错）
  })
}
```

## 工具与 API

- 工具：`deliver({ title, markdown, kind?, data? })`、`mywork_ask({ question, askKind?, options?, detail? })`（任务会话内）、`mywork_task_create({ input, scenario? })`、`mywork_tasks()`。
- HTTP（同源）：`GET /mywork-tasks/api/tasks`、`GET /task?id=`（含活动流）、`POST /create`、`POST /cancel`、`POST /rerun`、`POST /verify`、`GET /routines`、`POST /routines/{create,run,enable,remove,ack}`、`POST /say`（追问：运行中进活体 agent 的收件箱，已完成的走 dsh sessionController 在原会话续一轮，产出新交付物时再核验一次；等你答的任务把这句话当回答）、`POST /answer { id, askId?, answer }`（回答等你答的问题并续跑；没有未答问题、askId 不是当前问题或回答为空时 400）、`GET /scenarios`、`GET /deliverables`、`GET /deliverable?id=`、`POST /rate`；会话列与线程用的：`GET /today[?day=YYYY-MM-DD]`、`POST /today/say`、`GET /feed?before=&limit=`（今日线：各天助理会话的话与交办行、到点的提醒、有变化或报告类的例行运行，按时间分页）、`POST /seen {id|ids}`（已读，存 seen.json）、`GET /search?q=`（任务 · 例行 · 交付物）。任务与例行的视图都带 `lastAt` / `preview` / `unread`，给左栏那一列用。今日助理另有工具 `mywork_task_say({ id, text })`，把追问送进已有任务，今日线里留一行原地更新的交办行。
- 事件：`mywork/task`，`{ kind: queued | started | step | deliverable | verifying | waiting | done | routine | remind, task?, deliverable?, routine? }`；`done` 的 task 带 `quiet`（例行运行没有变化）；`waiting` 的 task 带 `ask`。
- 页面间的窗口事件：`mywork:new-task {text?, scenario?}`、`mywork:open-task {id}`、`mywork:open-deliverable {id}`、`mywork:open-session {sessionId}`。

## 配置

`concurrency`（2）、`timeoutMinutes`（20）、`permission`（workspace-write）、`agentPreset`（standard）、`cwd`（空 = `$DSH_HOME/mywork/workbench`，任务从不在你打开的代码仓库里跑）、`tools`（true）、`verify`（true）。

浏览器里 `localStorage['dsh-mywork:v2'] = 'off'` 可退回 Codex 侧栏与对话首页。
