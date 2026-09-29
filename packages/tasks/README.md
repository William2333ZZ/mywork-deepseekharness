# dsh-mywork-tasks · 任务引擎

MyWork Kit v2 的核心成员：**一句话即任务，后台做完，交付一份东西，自己核对过。** 设计见 [design/MYWORK-V2.md](../../design/MYWORK-V2.md)。形态对标 Manus / Meta Muse：侧栏是任务列表，首页只有一个框，任务页左边是过程、右边是交付物。

## 用户看到的

- **侧栏**（由 dsh-mywork-codex-ui 在 v2 模式下提供）：新任务、今日 / 任务 / 交付物 / 场景、进行中与最近的任务、设置。没有工作区、会话、扩展菜单。
- **今日**：一个框（场景下拉、示例）、进行中、最近。
- **任务页**：左边「进度」= 步骤条 + 消息与工具调用流，底部是对话框：跑的时候可以插话，跑完了可以接着说（同一个会话继续，像 Manus）；右边「交付物」= 正文、核验徽章、有用 / 没用、导出 Markdown / PDF。动作：取消、再来一次、重新核验、过程（打开背后的 dsh 会话）。
- **交付物**：全部交付物，按场景筛，查看器同上。
- **场景**：已装场景的说明和示例，示例一点即任务。
- 完成时右下角弹通知（浏览器通知需授权）；配置了 IM 默认通知目标时同时推到飞书 / 微信。

任务状态五个：排队、执行、交付、核验、完成（失败也是完成，带原因）。

## 它怎么跑

一个任务 = 一个 dsh 会话，按 `@michengai/dsh-automation` 的做法在服务端无头执行：`agents.create` 建会话、挂 agent preset、钉住模型、权限预设与免审批、挂到工作区、把场景 `compose` 出来的提示词交给它，等它空闲。全局 `session/event` 里 `tool/call` 映射成步骤，消息与工具调用记进任务的活动流（`activity`，每个任务最多 120 条，只保留最近 60 个任务的），最后一条 assistant 文本是摘要。会话里的 `deliver` 工具生成交付物；没有调用 deliver 的任务，把最后的回复当作交付物。

**核验**：任务交付后开第二个只读会话，把任务、执行时调用过的工具和交付内容交给它核对（事实是否能对应到工具调用、有没有承诺了没做的事），要求它最后输出 `{"passed", "checked", "issues", "notes"}`。结果盖在每份交付物的 `verification` 上，任务页和交付物页显示「已核验 / 核验发现问题 / 未能核验」。可用 `verify: false` 关掉，场景也可以给自己的 `verifyPrompt`。

数据在 `$DSH_HOME/mywork/tasks.json` 与 `deliverables.json`。默认同时跑两个任务，其余排队；单个任务最长 20 分钟，核验最长 5 分钟。

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
  })
}
```

## 工具与 API

- 工具：`deliver({ title, markdown, kind?, data? })`（任务会话内）、`mywork_task_create({ input, scenario? })`、`mywork_tasks()`。
- HTTP（同源）：`GET /mywork-tasks/api/tasks`、`GET /task?id=`（含活动流）、`POST /create`、`POST /cancel`、`POST /rerun`、`POST /verify`、`POST /say`（追问：运行中进活体 agent 的收件箱，已完成的走 dsh sessionController 在原会话续一轮，产出新交付物时再核验一次）、`GET /scenarios`、`GET /deliverables`、`GET /deliverable?id=`、`POST /rate`。
- 事件：`mywork/task`，`{ kind: queued | started | step | deliverable | verifying | done, task, deliverable? }`。
- 页面间的窗口事件：`mywork:new-task {text?, scenario?}`、`mywork:open-task {id}`、`mywork:open-deliverable {id}`、`mywork:open-session {sessionId}`。

## 配置

`concurrency`（2）、`timeoutMinutes`（20）、`permission`（workspace-write）、`agentPreset`（standard）、`cwd`（空 = 第一个工作区，否则 `$DSH_HOME/mywork/workbench`）、`tools`（true）、`verify`（true）。

浏览器里 `localStorage['dsh-mywork:v2'] = 'off'` 可退回 Codex 侧栏与对话首页。
