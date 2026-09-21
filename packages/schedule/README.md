# dsh-mywork-schedule

日程 for DeepSeek Harness Web：输入框旁的「日程」面板，两个标签：

- **提醒**（本包）：一次性 / 每天 / 每周 / 间隔提醒，到点页面内弹出 + 浏览器通知 + 提示音。
- **定时任务**（[`@michengai/dsh-automation`](https://github.com/MichengAI/dsh-automation)）：按计划在独立会话里执行编码任务。Automation 没有可读的 HTTP API，这个标签只做入口：跳到它的设置页；侧栏「定时」标签（dsh-mywork-codex-ui）里能看任务列表。未安装时提示到 设置 → MyWork → 成员 补装。

## 用法

- 输入框右侧 **日历图标**：打开面板；徽标 = 启用中的提醒数。
- 对模型说「10 分钟后提醒我看 CI」——模型用 `reminder_add` 工具记录。
- 命令：`/remind 10m 喝水`、`/remind 18:30 下班`、`/remind daily 09:00 站会`、`/remind weekly 1,3,5 10:00 周会`、`/remind every 30m 起身`、`/remind list`、`/remind del <id>`。
- 设置 → MyWork → **日程**：通知权限、提示音、全部提醒。
- 提醒在**浏览器里**触发：请保持 DSH 页面打开（后台标签页也可以）。多个标签页只提示一次；错过的提醒在下次打开页面时补提示（24 小时内）。

## 工具

`reminder_add`、`reminder_list`、`reminder_delete`、`reminder_toggle`

## 数据

`$DSH_HOME/mywork/reminders.json`（原子写入；文件损坏时备份为 `.corrupt-<时间戳>` 后重建）。

## 配置（cordis.patch.yml，可选）

```yaml
- id: mywork-schedule
  config:
    dataPath: /absolute/path/reminders.json
    command: true    # /remind
    tools: true      # reminder_*
```

```sh
dsh plugin --profile web add dsh-mywork-schedule
```

HTTP API（仅本机登录会话）：`/mywork-schedule/api/{list,add,update,remove,fired}`。

测试：`node --test test/*.test.mjs`（调度逻辑 `src/logic.cjs`，宿主与浏览器共用）。
