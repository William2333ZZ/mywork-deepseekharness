# dsh-mywork-tasks · 同事

MyWork Kit v2 的核心成员：**同事模型**。设计见 [design/v2/TEAMMATES.md §9](../../design/v2/TEAMMATES.md)。

一个同事 = 一条永远的对话（一个 dsh 会话）+ 自己的文件夹（它的电脑）+ 自己的例行 + 自己的记忆（文件夹里的 `AGENTS.md`）。默认同事「MyWork」第一次启动就在，置顶，不能删。任务不再是用户看得见的东西：每一轮干活是一次**运行**（run），只是对话里的一段。

## 数据

都在 `$DSH_HOME/mywork/`：

| 文件 | 内容 |
|---|---|
| `mates.json` | `Mate { id, name, title, description, glyph, pinned, isDefault, notify, createdAt, sessionId, dir }`；`sessionId` 在会话建好之前是空的 |
| `tasks.json` | 运行（沿用旧的任务记录，文件名不变）：`{ id, mateId, trigger: user\|routine\|system, routineId, routineTitle, input, status, steps, activity, deliverableIds, dispatched, quiet, verification, verifying, … }` |
| `deliverables.json` | 文件（交付物）：`{ id, mateId, taskId(=runId), title, kind, markdown, data, summary, rating, verification }` |
| `routines.json` | 例行：旧字段 + `mateId` |
| `seen.json` | 已读：`{ $since, [mateId]: ISO }` |
| `mates/<id>/` | 同事的文件夹：会话的 cwd、写权限的边界、注册成 dsh 工作区；`AGENTS.md` 是它的记忆 |

`$DSH_HOME/.agent-presets/mate-<id>/agent.cordis.yml`：每个同事一份生成的 preset。

**迁移**（启动时，幂等）：没有 `mateId` 的记录都成为 MyWork 的运行（`source: routine` → `trigger: routine`，其余 `user`）；旧「今日」助理的记录去掉与 input 重复的第一条用户行；停在问题上的旧任务把问题标为过期、收尾（它原来的会话不在新模型里）；例行、交付物补上 `mateId`。第二次启动什么都不改。

## 引擎（`src/engine.js`）

- **一个同事一条会话** `mywork-mate-<id>`。第一次用时 `agents.create`：cwd = 同事文件夹（注册为工作区，名字是同事名），preset = `mate-<id>`，钉住当前默认模型，权限预设 `workspace-write`，审批 `never`。之后每句话都走 `sessionController.prompt`（冷会话由 controller 按 id 恢复）。
- **preset**：取 dsh 自带的 `standard`（`agentPresets.resolve('standard')` 的文件；读不到时用包里的 `presets/mate-base/` 副本），把 persona 行换成这位同事的（名字、头衔、职责 + MyWork 的工作规矩：用 deliver 交付并给 summary、只在四种情况用 mywork_ask、用 mywork_routine_create 建例行、用 mywork_remember 记长期偏好），去掉 dsh 的 `ask_user`（它会挂住一轮等客户端）。其余行（agent-instructions、bash、fs、jobs、skills、计划、压缩、子代理、todo、web、present …）照搬。改名字 / 头衔 / 职责时重写，并用 `agentPresets.recompose(agent.ctx, 'mate-<id>')` 把活着的会话换到新一代（dsh 的 preset 挂载按文件戳换代，已加入的会话不会自己换；同事的会话整个进程都活着）：空闲时立刻换，正在一轮里就等这一轮结束。所以新同事在自我介绍里给自己起的名字、右栏改的职责，下一轮就生效。改名字时同事的 dsh 工作区标题一起改（`Workspace.setTitle`）。
- **一次运行 = 会话里的一轮**：全局监听 `session/event`，只看 `mywork-mate-` 前缀，任何时候都听（不再只在「在跑」时听）。`turn/start … turn/end` 是一次运行；我们发出的每句话 requestId 带运行 id（`mywork-run-<runId>.<n>`），`user/message` 靠它把这一轮绑到运行上；`tool/call` → 步骤与活动，`assistant/message` → 回复，`deliver` / `mywork_ask` 找这位同事当前的运行。别处（dsh 会话页）直接打进同事会话的话也成为一次运行；AGENTS.md 之类的上下文消息不算。
- **说一句话**（`POST /mates/say`）：
  - 它正在做**用户**的运行 → `mode: 'steer'` 插进这一轮，不另起运行（用户行记在这次运行的 activity 里）；
  - 它只在做**例行**或**自我介绍** → 这句话排队（`status: queued`），等它空下来成为下一次运行（`mode: 'queue'`）；
  - 有运行**等你答** → 这句话就是回答，同一次运行接着做；
  - 它刚在这一轮里调用了 `mywork_ask`、这一轮还没结束 → 这句话就是回答（问题标为 answered，以「回答：…」steer 进去），这一轮不会停在问题上；
  - 它自己的**用户**运行还在排队 → 这句话并进那次运行：还没交出去就接在它的提示后面，已经交进会话收件箱、没开跑就 steer（和那条排队消息同一轮被认领）；
  - 否则 → 新运行。
  - 插话若在那一轮结束后才到，会被下一轮认领：引擎把它挪成一次续接的运行，不会丢。
- **并发**：每个同事同时只交出一次运行（dsh 本来就一轮一轮串行）；所有同事加起来最多 `concurrency` 个在干活，其余排队。
- **结束**：`turn/end` 立刻 `done`（有未答的问题则 `waiting`）；失败是 `done` + `error`（停止是「已停止。」）。有新交付物就在后台开只读核验会话，结果盖在交付物和 `run.verification` 上，期间 `run.verifying = true`，不挡同事接着说话。
- **停**（`POST /mates/stop`）：有绑定到当前一轮的运行 → `controller.cancel`（保留收件箱：排在它后面的话照样会跑）。没有绑定的运行（排在并发上限后面、排在例行后面、会话正在冷恢复）→ 这位同事排着的运行都以「已停止。」收尾：已经交进收件箱的用 `controller.updateQueue({ action: { kind: 'remove' } })` 取回，取不回（还在路上）就记 `run.stopped`，它那一轮一开始就被取消、什么都不记。等你答的运行一并收尾。
- **重启**：分两步。`repair()` 在 `createMyWork()` 里同步跑（任何路由和派发之前）：还在一轮里的运行收尾为「服务重启，这一轮中断。」，核验中的盖「核验被服务重启打断」，记下重启前已经交进会话收件箱的运行。3 秒后 `recover()` 只处理这些：用运行上存的同一个 requestId 以 `mode: 'queue'` 重发（controller 认得收件箱或日志里已有的 requestId，不会重复；崩溃窗口里丢了的会补回），再用一句 steer 唤醒（dsh 不会自己启动恢复的 agent）。其余排队的照常派发。
- **丢了的消息**：每次 `turn/end` 检查这位同事已交出、还没开跑的运行，它的 requestId 不在 agent 的收件箱里就重新派发（新 requestId），不会永远「排队」。没带我们 requestId 的一轮（别处打进来的话、dsh 自己的提醒）永远是它自己的一次运行，不会被猜成排着的那次；已经结束的运行不会再被绑上一轮。
- **找人**：`mywork_ask` 写一条 pending 的 ask、结束本轮 → 运行 `waiting`。每次运行最多问 2 次；例行运行、自我介绍不能问。回答（卡片按钮 `POST /answer` 或直接在对话里说）把问题标为 answered、用户的话记进这次运行、以「回答：…」重新交给同一会话，同一次运行接着做。24 小时没人答：问题过期，运行里多一条 `{ kind: 'user', auto: true, askId, text }`（一行灰字，不是气泡），按合理假设继续。

## 新同事

`POST /mates/create { description, name?, title? }` 建好同事后排一次**隐藏的自我介绍运行**（`trigger: 'system'`，线程里不显示它的用户行，只显示回复）：没有名字时先 `mywork_mate_update` 给自己起 2–4 个汉字的名字；职责里带时间就 `mywork_routine_create` 建好例行；然后两三句话说它怎么理解职责、需要什么。

## 例行

例行属于一位同事（`mateId`），结果回到它的对话。到点（调度器每 30 秒）：

- **做事**：建一次 `trigger: 'routine'` 的运行（带 `routineId`、`routineTitle`），把 `routinePrompt()` 交进**同事自己的会话**（排队），之后的追问看得到例行的结果。回复末尾的「变化：有 / 无」由引擎读走并从对话里去掉；「变化：无」的运行 `quiet: true`：留在例行的运行记录里，不进对话、不亮未读、不推 IM；它交的文件不进文件页和搜索，也不起核验会话。日报 / 周报 / 月报永远出，素材是**所有同事**那段时间的运行（`workRecord`）。
- **提醒**：不叫醒同事。沿用 `fired[]` / `ack` 机制，同时往同事对话里放一个**合成的已完成运行**（存进 tasks.json，和别的运行一样分页）：`{ trigger: 'routine', status: 'done', routineId, routineTitle, remind: { routineId, title, at, acked }, activity: [{ kind: 'remind', routineId, title, at, acked }] }`，`at` 与 `fired[]` 里那一条相同。`POST /routines/ack { id, at }` 把两边都标成已知道。客户端见到 `run.remind` 是对象，就只画一张提醒卡（不画例行小字）。

例行运行时不能建例行（工具报错）。

## 工具（宿主级，只在同事会话里生效，别处礼貌拒绝）

| 工具 | 作用 |
|---|---|
| `deliver({ title, markdown, kind?, data?, summary? })` | 交一份文件，挂在当前运行上 |
| `mywork_ask({ question, askKind?, options?, detail? })` | 停下来问，结束本轮 |
| `mywork_routine_create({ input, title? })` | 给自己建例行 / 提醒；在当前运行里写 `{ kind: 'routine', action: 'created', routineId, title, scheduleLabel, at }` |
| `mywork_routines()` / `mywork_routine_cancel({ id \| title })` | 看 / 删自己的例行 |
| `mywork_remember({ fact })` | 往自己文件夹的 `AGENTS.md` 追加一行 `- YYYY-MM-DD <fact>`（≤300 字） |
| `mywork_mate_update({ name?, title? })` | 改自己的名字 / 头衔（会重写 preset） |

已移除：`mywork_task_create`、`mywork_task_say`、`mywork_tasks`、交办行、「交给后台」的系统提示段、今日助理与 `mywork-assistant` preset、`/today`、`/today/say`、`/feed`、`/create`、`/tasks`、`/task`、`/say`、`/cancel`、`/rerun`、`/verify`、`/rename`、`/remove`、`/scenarios`、`/deliverables`。

## HTTP（`/mywork-tasks/api`，同源）

```
GET  /mates                         → { items: Mate[] }
POST /mates/create  { description, name?, title? }                       → { mate }
POST /mates/update  { id, name?, title?, description?, pinned?, notify? } → { mate }
POST /mates/remove  { id }          → { removed: true }      默认同事 400；删掉它的运行、文件、例行，文件夹留着
GET  /mates/thread?id=&before=&limit=  → { runs: Run[], nextBefore: ISO|null }
POST /mates/say     { id, text }    → { mate, runId, mode: 'queue'|'steer'|'answer' }
POST /mates/stop    { id }          → { mate }
GET  /mates/folder?id=              → { dir, items: [{ name, path, size, modifiedAt }] }   同事文件夹里最近的文件（右栏「电脑」）
POST /answer        { id: runId, askId?, answer } → { run }
GET  /routines?mate=                → { items: Routine[], pending }
POST /routines/create { mateId, input } · /routines/update { id, input } · /routines/run { id } → { routine, runId }
POST /routines/enable { id, enabled } · /routines/remove { id } · /routines/ack { id, at }
GET  /activity                      → { needs, working, recent }   Item = { mateId, mateName, runId, at, text, kind }
GET  /files?mate=&q=&since=         → { items: Deliverable[] }
GET  /deliverable?id=               → { deliverable, run } · POST /rate { id, rating }
POST /seen          { id | ids }    → { id, ids, seenAt }
GET  /search?q=                     → { mates, messages: [{ mateId, runId, at, text }], files, routines }
```

**Mate** = `{ id, name, named, title, description, glyph, pinned, isDefault, notify, createdAt, lastAt, preview, unread, attentionAt, state: idle|working|waiting, step, since, ask: (askView + runId)|null, routineCount, dir }`

- `name` 没起名时是「新同事」（`named: false`）。`glyph` 是名字的第一个字（MyWork 是 M）。
- 顺序：置顶的在前（默认同事第一，其余按创建时间），其余按 `lastAt` 倒序；状态不改变顺序。
- `lastAt`：它所有运行里最新的有意义的时刻（用户行、回复、提醒、文件、核验、结束）；从不因为工具调用而动。
- `preview`：干活中「在干活 · <步骤>」（排队时「在干活 · 排队」）；等你答「等你答 · <问题>」；否则最后一句话（用户说的加「你：」，没回复的失败是「失败 · 原因」，提醒是「提醒 · 标题」），≤80 字一行。
- `unread`：`seen.json` 按同事记。点亮它的：结束的非安静运行（回复、失败、提醒）、核验发现问题、停下来问。用户自己的话、安静的例行运行不会。
- `since`：在干活时这次运行开始的时间；等你答时问的时间。

**Run** = `{ id, mateId, trigger, routineId, routineTitle, status: running|waiting|done, queued, input, title, summary, activity[], deliverables: Deliverable[], verification|null, verifying, ask|null, error, quiet, remind: { routineId, title, at, acked }|null, step, createdAt, startedAt, finishedAt }`

- `status`：排队中的运行报 `running` 并带 `queued: true`。
- **对话怎么画**：`input` 是这次运行的第一句用户话（右侧气泡）；`trigger: 'system'`（自我介绍）的 `input` 是空的，不画；`trigger: 'routine'` 画居中小字「<routineTitle> · HH:MM」（取 `createdAt`）而不是气泡。然后按顺序画 `activity` 里的线程条目：`user`（后来的插话是右侧气泡；带 `askId` 的是对问题的回答，由问题卡显示；带 `auto: true` 的是 24 小时后按假设继续，一行灰字）、`text`（回复，正文，一轮里可能有好几条，最后一条是结论）、`ask`（找你卡；`status` pending / answered / superseded / expired）、`routine`（居中小字「已安排 · <title> · <scheduleLabel>」）、`remind`（提醒卡）；`tool` 是过程，`handoff` 是旧数据，都不属于对话。`deliverables` 是这次运行交的文件（没有正文，正文用 `/deliverable?id=` 取），各自带 `summary` 行和 `verification`；`run.verifying` 为真时显示「核验中」。
- `/mates/thread`：按 `createdAt` 升序，取 `before` 之前最新的 `limit` 条（默认 20，最多 100）；安静的例行运行、什么都没留下的系统运行不在里面；`nextBefore` 是这一页最早的 `createdAt`，没有更早的就是 null。回答过的问题会让同一次运行接着跑，所以它的新内容仍在原来的位置（按创建时间）。

**Deliverable**（列表形态）= `{ id, mateId, runId, title, kind, createdAt, rating, verification, summary }`

**/activity**：`needs` = 等你答（`ask`）+ 没点知道了的提醒（`remind`）+ 你看过之后才失败的运行（`failed`，停止不算）；`working` = 在干活 / 排队的运行（`text` 是步骤或那句话）；`recent` = 近 7 天完成的运行（`done` / `failed`，`text` 是回复第一行或文件标题），最多 20 条。

## 事件

`ctx.emit('mywork/task', { kind, run: Run|null, mate: { id, name, glyph, notify }|null, deliverable?, routine?, removed? })`（删除同事的 `mate` 事件带 `removed: true`，`mate` 只剩 `{ id }`），`kind` ∈ `queued | started | step | text | deliverable | verifying | verified | waiting | done | remind | routine | mate`。IM（dsh-mywork-im）推：提醒、等你答、有变化的例行、失败、超过 2 分钟的用户运行；同事的「通知」关掉则都不推。

## 配置

`concurrency`（2，同时在干活的同事数）、`timeoutMinutes`（20，单次运行）、`permission`（workspace-write）、`agentPreset`（standard，核验会话用）、`tools`（true）、`verify`（true）。

## 测试

`pnpm --filter dsh-mywork-tasks test`。`test/mates.test.mjs` 用一个假的 dsh 宿主跑完整流程（它照 dsh 的收件箱语义：queue 进下一轮、steer 并进当前轮、cancel 保留收件箱）。
