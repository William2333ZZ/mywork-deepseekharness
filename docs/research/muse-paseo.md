# 调研：Muse 与 Paseo

调研日期：2026 年 9 月 29 日。分支 `research-muse-paseo`，从 `main` 建。结论在前，细节在后。

## 先说「Muse」是哪一个

叫 Muse 的项目有三个，和 Paseo 放在一起最可能是前两个：

| 名字 | 是什么 | 开源 | 与我们的关系 |
|------|--------|------|-------------|
| **OpenMuse**（CopilotKit，2026-09-22 发布） | 自托管的个人 agent 应用：浏览器、终端、文件、持续的后台任务，手机和网页端，「兼容任何 agent harness」 | MIT，2.9k star，创建两周 | 产品形态最接近 MyWork Kit 和交易工作台：个人助理、可见的工作过程、目标跟踪 |
| **Muse Code**（Meta，2026-08-05 公测） | Meta 的终端编程 agent，跑 Muse Spark 模型，带子代理、观察者、沙箱、MCP、hooks、skills | 闭源、付费、无仓库 | 与 dsh 同类（编程 agent harness），可借鉴机制 |
| MUSE（KnowledgeXLab，ACL 2026） | 论文：经验驱动的自进化 agent 框架 | 研究代码 | 关系不大，略过 |

下面按 OpenMuse、Paseo、Muse Code 三段写，最后是对本项目的建议。

## 1. Paseo

仓库 [getpaseo/paseo](https://github.com/getpaseo/paseo)，18.9k star，2.2k fork，Apache-2.0，2025-10 创建，一人维护（Mohamed Boudra）加社区，最新 v0.10.1（2026-09-28），TypeScript。

### 定位

「一个界面跑 Claude Code、Codex、Copilot、OpenCode、Pi」。本地守护进程管 agent，手机 / 桌面 / 网页 / CLI 都是客户端。自托管、无遥测、可选的端到端加密中继让手机远程连回家里的机器。它不是 agent，是 agent 的**驾驶舱和调度台**。

### 架构

```
Mobile(Expo) / CLI / Desktop(Electron)  ──WebSocket──▶  Daemon(Node)  ──▶  Claude Agent SDK / Codex app-server / Copilot ACP / OpenCode / Pi
                                              可选：Relay（E2E 加密，Curve25519 + NaCl box）
```

- `packages/server` 守护进程：agent 生命周期、时间线流、工具目录（MCP 是其中一种适配）、可选中继、可选自托管网页端。
- `packages/app` Expo 客户端（iOS / Android / web / 桌面共用），Unistyles，xterm 终端，zustand。
- `packages/protocol` zod 协议 + 生成的入站校验；`packages/client` SDK；`packages/plugin` 插件 SDK；`packages/relay`。
- 数据：文件 JSON 持久化，zod schema，原子写，不做迁移。
- 权限模型：主体（principal）+ 凭证 + 语义权限（`workspace.read/write/manage`、`automation.manage`、`hub.execute`…），配对邀请一次性；owner / operator / viewer 只是 UI 预设。

### 关键能力

- **Agent 编排**：agent 可以通过 Paseo 工具创建子 agent（同工作区或独立 worktree），子 agent 挂在父的「Subagents 轨道」；三个官方 skill：`/paseo-handoff`（Claude 规划、Codex 实现）、`/paseo-advisor`（第二意见）、`/paseo-committee`（两个对立 agent 做根因分析）。
- **Agent profiles**：把 provider、模型、思考档位、模式存成「UI 工作 / 规划 / 评审」这样的配置，并写「什么时候用」的说明给编排 agent 看。
- **浏览器工具**：桌面版里 agent 驱动真实标签页，`browser_*` MCP 工具集：`snapshot` 返回带 `@e3` 引用的无障碍树，引用随页面变化过期；`click/fill/type/hover/drag/upload/scroll`，`logs` 读控制台和网络，登录态保留、人可以随时接管。
- **Hub**：守护进程之上的一层，GitHub / Slack / Discord 事件触发工作流，多步 agent 串行，配置放仓库 `.paseo/hub.yml`。
- **自动化**：schedules、heartbeats、loops（`automation.manage` 权限）。
- **语音**：对话式语音，双向音频原生模块。
- **插件**：`index.server.ts` 子进程 + `index.client.tsx` 注入所有客户端；能贡献 RPC、面板、命令、slash 命令、时间线项、头部按钮、主题、附件来源、设置页、provider。生命周期钩子能改 agent 配置、注入 MCP、注入环境变量、答复权限请求、回合结束发跟进。
- **CLI**：`paseo run/ls/attach/send/logs/stop`，`--output-schema` 结构化输出，`--worktree-mode`，远程 `--host`。

### 值得学的做法

- `docs/` 是唯一事实来源，每篇一个主题，「一个事实只写一处，其他地方是链接」，AGENTS.md 开头就列表。我们的 design/ 和各包 README 可以照这个纪律收一收。
- 权限是语义的，不按 RPC 名；agent 和终端共用工作区权限，因为守护进程无法真正隔离两者。这和我们「工作区内修改」的语义一致，但它写清楚了。
- 浏览器工具的「快照引用」设计比坐标点击稳，且每次结果报告弹窗处理。我们用的是官方 Playwright MCP，思路相同；如果以后自己做工具集，照这个表。
- 中继威胁模型写得很完整（QR 码是信任锚，中继看不到内容）。手机远程看驾驶舱如果要做，这是现成方案。

### 与 dsh / MyWork Kit 的差异

Paseo 不做模型、不做推理，只做壳；dsh 自己就是 harness 加壳。Paseo 的壳更成熟（手机端、多 provider、编排、权限），dsh 的优势是模型和 harness 一体、插件深度介入系统提示和工具。两者不冲突：理论上 dsh 可以作为 Paseo 的一个 provider 插件被接入（provider 插件是它公开的扩展点）。

## 2. OpenMuse

仓库 [CopilotKit/openmuse](https://github.com/CopilotKit/openmuse)，2.9k star，MIT，2026-09-15 创建，alpha，CopilotKit 官方模板项目（作者 Atai Barkai）。

### 定位

「一个带浏览器、终端、文件、持续工作的个人 agent，兼容任何 agent harness」。它是**产品模板**：克隆下来改成自己的助理。手机（Expo + CopilotKit React Native）和网页共用。

### 架构

- `apps/server`：API 加任务 worker（PGlite 嵌入式 Postgres，SQL 租约恢复中断的任务）。
- `apps/worker`：浏览器 worker，持久 Chromium 配置，Playwright，独立 token。
- `apps/computer`：可选 Linux 容器（非 root、只读根文件系统、无网络、30 秒超时、128 KB 输出上限），`/workspace` 命名卷持久化。
- `apps/mobile`：Expo 客户端。
- `packages/backends | domain | integrations`。
- 「兼容任何 harness」的实际含义：`AGENT_BACKEND=sample | model | agui`。`model` 走 CopilotKit 配置的 OpenAI / Anthropic / Google；`agui` 接一个外部的原始 AG-UI agent 端点；OpenBot 适配器目前是禁用的契约测试。所以它兼容的是 **AG-UI 协议**，不是任意 CLI harness。
- 硬依赖：CopilotKit Intelligence 的项目 key（会话持久化与回放）。这是它最大的绑定。

### 关键能力（已实现）

- **持久任务**：计划、进度、输入请求、暂停 / 恢复 / 取消 / 重试、审批、回执。外部写操作不确定时不自动重试，让用户先看提供方结果。
- **Ideas**：带证据来源的建议，可编辑 / 接受 / 忽略；已回复或已完成的自动排除。
- **Goals & Tracking**：目标与里程碑；对公开网页做周期检查（内容变化、文本出现、美元价格阈值），告警去重、失败退避。
- **Documents**：邮件附件 → PDF → 表单值 → 填好的副本 → 审阅后的回复 → 回执。
- **Finance**：导入交易 CSV 生成支出摘要与储蓄目标。
- **Gmail / Calendar**：OAuth，每次发送或改日历都要单独审阅。
- **交互设计**：一个主对话；发送键在回复中变成停止键；跟进排队可见；后台更新只在有意义时通知；点头像看活动、审阅、回执。

### 值得学的做法

- **审阅与回执**是产品骨架：任何对外动作先审阅，做完留回执。我们的报告存档是回执的一种，巡检推送也该留回执（已做执行记录）。
- **Tracking**：对页面或价格设阈值的周期检查，正是交易工作台「巡检」的下一步：自选标的的价格阈值、信号阈值告警，去重与退避的规则可以直接照搬。
- **计算机边界**写得很清楚：浏览器能上网、终端不能上网；容器无挂载无凭证。我们桌面版的原生浏览器与 Playwright 共用标签页，边界文档可以补一份。
- 「兼容任何 harness」的营销要打折扣：它需要 CopilotKit 的云 key 才能持久化会话。

### 与本项目的差异

OpenMuse 是「个人生活助理」模板，重邮件、日历、表单、目标；我们是「交易分析工作台」，重市场数据和报告。共同点是「可见的后台工作 + 审阅 + 回执 + 周期跟踪」。它的 Goals & Tracking 和我们的巡检几乎是同一个产品动作。

## 3. Muse Code（Meta）

官方页 [developer.meta.com/ai/products/muse-code](https://developer.meta.com/ai/products/muse-code/)，文档 [dev.meta.ai/docs/muse-code](https://dev.meta.ai/docs/muse-code)。2026-08-05 公测，v1.2.1（09-20），模型 Muse Spark 1.2 / 1.3，闭源，无免费额度，macOS / Linux / Windows，一条命令安装。

### 机制

- **沙箱默认开**，审批门控；`muse exec` 无头模式给 CI，`--disable-approval` 只关审批、`--yolo` 连沙箱一起关。
- **子代理**：默认一棵树 8 个（1 到 64 可调），孙代理共享配额，可选 worktree 隔离，协作式取消，运行时记日志。
- **工作流**：`.agents/workflows/*.js` 脚本编排并行组和分阶段，最多 16 个并发子任务，`/workflows` 看状态。
- **四个后台观察者**默认开：记忆召回、技能召回、目标跟踪、**验证**（确认声称做过的工作真的做了），各自独立调用模型。
- **Hooks**：`SessionStart / UserPromptSubmit / PreToolUse / PermissionRequest / PostToolUse / PreLLMCall / PostLLMCall / PreCompact / SubagentStart / Stop / SessionEnd` 等，项目级 `.muse/hooks.json`，管理员可集中下发；hooks 在沙箱和审批之外运行。
- **Skills**：`.agents/skills/<id>/SKILL.md`，slash 调用，`muse skills import --from claude` 直接导入 Claude 的技能；观察者会自动推荐技能。
- **会话消息**：独立会话之间交接、评审请求、状态更新。
- **记忆**：`.agents/memory/`；项目说明读 `AGENTS.md`（退回 `CLAUDE.md`）。
- **SDK**：`@muse-code/sdk`，`muse serve` 协议。

### 与 dsh 的对照

同一类产品。dsh 0.1.6 有 skills、MCP、系统提示插槽、定时任务、浏览器；Muse Code 多出来的是**观察者**（尤其是验证观察者）、**hooks 全生命周期**、**工作流脚本**、**会话间消息**。这些是 harness 层的能力，不是我们插件层能补的，但「验证观察者」的思路可以在插件层做一个弱版本（见建议）。

## 4. 对本项目的建议

按投入产出排序。前三项都能在交易工作台分支上直接做。

1. **巡检加阈值告警（借 OpenMuse Tracking）**：自选标的设价格阈值、温度信号设阈值，触发即推飞书；告警去重（同一阈值一天一次）、失败退避。我们已有每日快照和推送，加一个「规则表」就够。
2. **报告的验证回执（借 Muse Code 验证观察者）**：报告存档时，让一个便宜的模型回合只做一件事：核对报告里的数字是否与工具返回一致、概率是否给了时间窗口、是否至少三个独立信号，把结果写进报告的「核验」字段。这是插件层能做的最像观察者的东西。
3. **回执化（借 OpenMuse）**：任何对外动作（飞书推送、报告存档、未来的任何写操作）统一留回执，驾驶舱有一处能看全部回执。巡检执行记录已经是雏形，扩成通用的「活动」列表。
4. **文档纪律（借 Paseo）**：`design/` 和各包 README 采用「一处事实、其他处链接」，AGENTS.md 开头列表。低成本。
5. **手机端查看（借 Paseo relay）**：如果用户想在手机上看驾驶舱，两条路：短期继续用飞书推送（已有）；长期做一个只读网页端加 E2E 中继，Paseo 的威胁模型和配对流程可以直接参考。不建议现在做。
6. **Agent profiles**：dsh 已有 Agent 预设；交易工作台可以预置「快速问答（Flash）」「深度报告（High）」两个档位放在提问框旁。小改动。
7. **作为 Paseo provider 接入**：技术上可行（provider 插件是公开扩展点），但价值取决于是否有 Paseo 用户想用 DeepSeek Harness；先不做，记着。

不建议跟进的：OpenMuse 的邮件 / 日历 / 表单能力（和交易无关，且依赖 CopilotKit 云 key）；Muse Code 本身（闭源付费，只能借鉴机制）。

## 5. 数字与来源

| 项目 | star | fork | 许可 | 创建 | 最近推送 | 语言 |
|------|------|------|------|------|----------|------|
| getpaseo/paseo | 18.9k | 2.2k | Apache-2.0 | 2025-10-13 | 2026-09-29 | TypeScript |
| CopilotKit/openmuse | 2.9k | 372 | MIT | 2026-09-15 | 2026-09-26 | TypeScript |
| komako-workshop/digital-oracle（对照） | 846 | 167 | MIT | 2026-03-11 | 2026-07-26 | Python |

本地克隆（浅）：paseo 100 MB，openmuse 22 MB，都在会话临时目录，未入库。

来源：Paseo 仓库 README、`docs/product.md`、`docs/architecture.md`、`docs/agent-lifecycle.md`、`docs/permissions.md`、`docs/plugins.md`、`public-docs/browser-tools.md`、`public-docs/agent-profiles.md`、`public-docs/hub/*`、`SECURITY.md`、CHANGELOG；OpenMuse 仓库 README、`docs/FEATURES.md`、`docs/EXPERIENCE.md`、`docs/COMPUTER.md`、`docs/OPENBOT-INTEGRATION.md`、`SECURITY.md`、`ROADMAP.md`、`.env.example`；Muse Code 官方文档（overview、workflows、extending）与 [innfactory 的整理](https://innfactory.ai/en/ai-harness/muse/)、[SitePoint 上手文](https://www.sitepoint.com/meta-muse-code-getting-started/)、[explainx 公测报道](https://www.explainx.ai/blog/meta-muse-code-coding-agent-muse-spark-1-2-launch-august-2026)；OpenMuse 发布：[CopilotKit 公告](https://x.com/CopilotKit/status/2102402336572203075)；GitHub API 统计。
