# dsh-mywork-tasks · 任务引擎

MyWork Kit v2 的核心成员：**一句话即任务，后台做完，交付一份东西。** 设计见 [design/MYWORK-V2.md](../../design/MYWORK-V2.md)。

## 用户看到的

- **今日**：输入框（回车即任务）、场景示例、进行中的任务卡、今天的交付物。
- **任务**：全部任务；点开看步骤时间线、交付物正文、失败原因；再来一次、取消、过程（打开背后的会话）。

任务状态五个：排队、执行、交付、核验、完成（失败也是完成，带原因）。

## 它怎么跑

一个任务 = 一个 dsh 会话，按 `@michengai/dsh-automation` 的做法在服务端无头执行：`agents.create` 建会话、挂 agent preset、钉住模型、权限预设与免审批、挂到工作区、把场景 `compose` 出来的提示词交给它，等它空闲。全局 `session/event` 里的 `tool/call` 映射成步骤，最后一条 assistant 文本是摘要。会话里的 `deliver` 工具生成交付物；没有调用 deliver 的任务，把最后的回复当作交付物。

数据在 `$DSH_HOME/mywork/tasks.json` 与 `deliverables.json`。默认同时跑两个任务，其余排队；单个任务最长 20 分钟。

## 场景插件

场景决定一类任务怎么做。注册走 cordis 服务 `myworkTasks`：

```js
export const inject = ['myworkTasks']
export function apply(ctx) {
  ctx.myworkTasks.register({
    id: 'trade', label: '交易', intro: '问一只标的或一个宏观问题，得到一份概率报告',
    examples: ['黄金未来一个月的方向', '美债曲线现在说明什么'],
    compose: (input, { date }) => `……${input}……`,
    toolStepMap: { oracle_fetch: '取数', oracle_report_save: '交付' },
    deliverableKinds: ['report'],
    permission: 'read-only',           // 可选：覆盖权限预设
    model: { provider, model },        // 可选：覆盖模型
  })
}
```

## 工具与 API

- 工具：`deliver({ title, markdown, kind?, data? })`（任务会话内）、`mywork_task_create({ input, scenario? })`、`mywork_tasks()`。
- HTTP（同源）：`GET /mywork-tasks/api/tasks`、`GET /task?id=`、`POST /create`、`POST /cancel`、`POST /rerun`、`GET /scenarios`、`GET /deliverables`、`GET /deliverable?id=`、`POST /rate`。
- 事件：`mywork/task`，`{ kind: queued | started | step | deliverable | done, task, deliverable? }`。

## 配置

`concurrency`（2）、`timeoutMinutes`（20）、`permission`（workspace-write）、`agentPreset`（standard）、`cwd`（空 = 第一个工作区，否则 `$DSH_HOME/mywork/workbench`）、`tools`（true）。
