# dsh-mywork-kit

MyWork Kit 组合包本体：装它 = 带上一整套。

```sh
dsh plugin --profile web add dsh-mywork-kit
dsh web
# 设置 → MyWork Kit → 「补装缺失的 N 个」→ 重启 dsh
```

## 它做什么

1. **成员清单** `kit.json`：分组列出本仓库插件（主题、提醒、打开网页）与精选社区插件（Codex 侧栏、Codex 排版、定时任务、Mermaid、插件市场），含 npm 版本范围。
2. **设置面板**：每个成员的安装状态 / 版本 / 是否已挂载，一键安装、更新、检查更新；成员变化后提示重启。
3. **安装器** `src/installer.js`：在 profile 目录里跑 `pnpm add`，再把声明了 `dsh.bundle` 的直接依赖回填到 `dsh.profile.bundles`（与 `dsh plugin add` 的对账一致）。开发模式（kit 本身是 `link:` 安装）下，本仓库成员也以 `link:` 安装。
4. **启用 dsh 自带的会话内提醒**：`cordis.patch.yml` 插入 `time-context` 与 `schedule` 行并启用 `ui-schedule`，模型即可用 `schedule_create` 在同一会话里定时回来提醒。
5. 工具 `mywork_kit_status`：让模型说明当前装了什么。

## 配置

```yaml
- id: mywork-kit
  config:
    allowInstall: false   # 远程 / 共享部署：禁止从浏览器触发 pnpm，面板改为给出终端命令
```

安装接口只接受本机回环地址的同源请求。

## 定制你自己的 Kit

改 `kit.json`（加一行即扩包；`required` 标必装；`local` 指向本仓库内的包目录），改 `name`/`description`，`pnpm publish` 即可分发。
