<h1 align="center">MyWork Kit</h1>

<p align="center"><b>基于 DeepSeek Harness 的个人工作台组合包：不改 dsh 本体，一切皆插件。</b></p>
<p align="center">上网查资料、做表格和演示文稿、定时任务与提醒、微信 / 飞书助理，都跑在同一个 dsh profile 里，全程没有 iframe。</p>

<p align="center">中文 · <a href="README.en.md">English</a> · <a href="https://zhuanlan.zhihu.com/p/2086048468519466606">知乎介绍文章</a></p>

<p align="center">
  <a href="https://github.com/William2333ZZ/mywork-deepseekharness/releases"><img src="https://img.shields.io/github/v/release/William2333ZZ/mywork-deepseekharness?include_prereleases&label=release" alt="release"></a>
  <a href="https://github.com/deepseek-ai/deepseek-harness"><img src="https://img.shields.io/badge/dsh-0.1.6--alpha.2-blue" alt="dsh"></a>
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey" alt="platform">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT%20%2B%20Apache--2.0-green" alt="license"></a>
  <a href="https://github.com/William2333ZZ/mywork-deepseekharness/stargazers"><img src="https://img.shields.io/github/stars/William2333ZZ/mywork-deepseekharness?style=flat" alt="stars"></a>
</p>

![MyWork Kit 一分钟导览](docs/tour.gif)

## 下载

| 方式 | 适合谁 | 怎么做 | 状态 |
| --- | --- | --- | --- |
| **桌面版 Windows x64**（免安装 zip） | 不想装 Node / dsh 的人 | [Releases](https://github.com/William2333ZZ/mywork-deepseekharness/releases) 下载 `Mywork-DSH_desktop-win-x64.zip` → 解压 → 双击 `Mywork-DSH_desktop.exe` | 预览：未签名（首次过一次 SmartScreen），在 Mac 上交叉构建，欢迎反馈 |
| **桌面版 macOS arm64**（.dmg） | Apple 芯片 Mac | [Releases](https://github.com/William2333ZZ/mywork-deepseekharness/releases) 下载 `Mywork-DSH_desktop-mac-arm64.dmg` → 拖到「应用程序」 → 首次右键打开 | 预览：未签名（首次过一次 Gatekeeper） |
| **一条命令试用** | 机器上有 Node ≥ 24 | `git clone … && bash scripts/dev-env.sh`，不碰 `~/.dsh` | 稳定 |
| **装进自己的 dsh** | 已经在用 dsh 的人 | `bash scripts/install.sh web && dsh web` | 稳定 |

桌面版自带 Node 24、dsh、Chrome for Testing 和装好全部插件的 profile；个人数据（API key、IM 登录态、书签、历史、浏览器登录）都在数据目录里，升级和重装不丢。

## 打开就能用

- **官方 dsh 对话**：模型、工作区、会话、文件、终端、Git 全是 dsh 自己的，套件只在外面加东西。
- **Codex 风格的侧栏和设置**：新建对话、扩展管理（定时任务 / 插件市场）、IM助理、MCP 连接器，只显示装了的功能。
- **实时浏览器**：后台真实 Chrome，模型打开的页面实时出现在右侧栏，你能点、能滚、能输入；地址栏和 Chrome 一样，画面随面板大小铺满，任何会话都能用。
- **表格和演示文稿**：Univer 在实时窗口里边做边看，审阅后导出 `.xlsx` / `.pptx`。
- **定时任务与提醒**：按计划在独立会话里跑任务，每个任务自己选"运行结束发到哪个聊天"；提醒到点弹窗、通知、提示音，也能发到 IM。
- **微信 / 飞书助理**：微信、飞书、钉钉、企业微信、QQ、Telegram 接到本机 dsh，在聊天里派任务，也能从桌面主动发消息到聊天。
- **MCP 连接器**：应用内添加 / 编辑 / 停用 MCP 服务器，粘贴 `mcpServers` JSON 导入，保存即挂载。
- **四种风格 × 明暗 × 缩放**：Claude Code / 柔和高级 / 极简编辑 / 工业粗野，浅色 / 深色 / 跟随系统，界面缩放 80–150%。
- **插件市场与 Mermaid**：2300+ 社区插件一键装；回复里的 mermaid 代码块自动成图。

## 界面

### 新建对话：四个起点

上网查资料 / 做表格和演示文稿 / 定时任务与提醒 / 微信·飞书助理，点开就是一条能直接发的提示，你只补具体内容。

![新建对话](docs/screenshots/12-new-conversation.png)

### 侧栏与设置

导航按已安装功能收拾：扩展管理只放 定时任务 与 插件市场；设置里 MyWork 一个入口，成员 / 外观 / 日程 / 浏览器 四个标签，缺的成员一键补装。

| | |
| --- | --- |
| ![首页](docs/screenshots/01-home.png) | ![成员](docs/screenshots/07-settings-members.png) |

### 实时浏览器

模型一导航，右侧栏自动展示；地址栏输网址直接开、输文字就搜索（Bing / Google / 百度 / DuckDuckGo 可选），历史和书签建议、行内补全、↑↓ / Enter / Esc，在画面里按 Ctrl/Cmd+L 跳回地址栏。页面视口跟随面板大小，不留黑边。

| | |
| --- | --- |
| ![实时浏览器](docs/screenshots/02-conversation-live-browser.png) | ![地址栏](docs/screenshots/13-omnibox.png) |

### 定时任务

独立页面（来自 Automation），新建 / 编辑弹窗里多一栏「运行结束发到 IM」，选聊天和 每次结束 / 仅失败，随任务保存，卡片上显示。

![定时任务](docs/screenshots/04-scheduled-tasks.png)

### 表格和演示文稿

Univer 在可拖动的实时窗口里边做边校验，完成后会话里留一张审阅卡片，可全屏、可对比版本、可导出。

![Univer](docs/screenshots/14-univer-review.png)

### IM助理与 MCP 连接器

| | |
| --- | --- |
| ![IM助理](docs/screenshots/05-im-assistant.png) | ![MCP](docs/screenshots/06-mcp-connectors.png) |

### 外观与缩放

Claude Code 风格之外的三种来自 [taste-skill](https://github.com/Leonxlnx/taste-skill) 技能包：柔和高级（soft-skill：Plus Jakarta Sans、超柔和的环境阴影、胶囊按钮）、极简编辑（minimalist-skill：暖白纸色、1px 分割线、Newsreader 衬线标题）、工业粗野（brutalist-skill：直角、Archivo 黑体、等宽大写元数据、只有一个警示红；深色是 CRT 扫描线终端）。四种风格的所有文字都过 WCAG AA 4.5:1。

| 柔和高级（浅色） | 工业粗野（深色） |
| --- | --- |
| ![柔和高级](docs/screenshots/10-soft-light.png) | ![工业粗野](docs/screenshots/11-brutal-dark.png) |

## 演示案例

下面每个案例都在这套件里跑通过。提示词可以原样贴进输入框，或在「新建对话」页点对应的起点卡片，它会把提示填好。

### 1. 上网查资料，边看边总结

1. 点输入框旁的地球图标打开右侧「实时浏览器」，地址栏输入 `github.com`（或直接输入一个问题，会用 Bing 搜索），Enter。
2. 对模型说：**打开这个网址给我看，并把页面要点整理成 5 条：https://github.com/deepseek-ai/deepseek-harness**
3. 模型用 Playwright 打开页面，右侧画面实时跟着走，你可以随时自己点、滚、输入；总结出现在对话里。

### 2. 做一份演示文稿（或表格）

对模型说：**根据下面的资料做一份演示文稿，5 页以内，每页一个要点，做完截图给我看：**（把资料贴在后面）。表格同理：**用 Univer 新建一个电子表格：做好表头、示例数据和汇总公式，最后导出 .xlsx。内容是：…**

### 3. 定时任务跑完发到微信

1. 侧栏 扩展管理 → 定时任务 → 新建定时任务，最下面「运行结束发到 IM」选一个聊天，保存。
2. 或者直接说：**创建一个定时任务：每天 09:00 检查 GitHub 上我关注的仓库有没有新 release，跑完把结果发到微信。** 模型会调用 `automation_create` 和 `automation_notify_set`。
3. 到点后任务在独立会话里执行，最后一条回复带着任务名和「完成 / 失败」发到你选的聊天。

> 微信个人号机器人只能在你给它发过消息后的一段时间内回复（平台限制，见「已知的坑」）。要准点推送，把通知目标选成飞书 / 钉钉 / 企业微信账号。

### 4. 在微信里直接用助理

1. 侧栏 IM助理 → 添加微信账号（扫码）；飞书 / 钉钉 / 企业微信 / QQ / Telegram 填 Bot 凭证。
2. 在微信里对机器人说话，就是在和本机 dsh 的一个会话对话：**每天 9 点把 ~/Downloads 里超过 30 天的文件列出来发给我** 这种话它会直接建成定时任务。
3. 从桌面主动发：IM助理 页顶部的「主动发消息到频道」卡片，或对模型说 **把上面的结论整理成 3 句话，发到微信**，或 `/imsend 内容`。提醒新建时勾选"到点也发到 IM"。

### 5. 换个风格、缩放界面

设置 → MyWork → 外观：四种风格 × 浅色 / 深色 / 跟随系统，侧栏、设置页、气泡、输入框、按钮都跟着换；界面缩放 80–150%，所有弹层、拖动、Univer 窗口、实时浏览器在任何缩放下都对得上鼠标。

## 常用操作

- **主题 / 缩放**：设置 → MyWork → 外观。会话正文字号在 设置 → 常规 → 字号大小（dsh 自带，12–17 px）。
- **提醒**：输入框右侧日历图标 → 提醒 → 添加；或对模型说"10 分钟后提醒我看 CI"；或 `/remind 10m 喝水`、`/remind 18:30 下班`、`/remind daily 09:00 站会`、`/remind weekly 1,3,5 10:00 周会`、`/remind every 30m 起身`、`/remind list`。到点页面弹窗 + 浏览器通知（首次在 设置 → MyWork → 日程 里授权）+ 提示音，**需保持 DSH 页面开着**。
- **会话内提醒**（dsh 自带，kit 已启用）：对模型说"30 分钟后提醒我"，到点在同一会话里作为 follow-up 回来。
- **IM助理**：侧栏「IM助理」添加账号；会话出现在侧栏「频道」标签。多个账号 / 聊天时发送必须指明目标，不会猜。
- **主动发到 IM**：IM助理 页的发送卡片、对话里说"把结果发到微信"（`im_send`）、`/imsend 内容`。只能发给已经和机器人聊过的聊天，送达经过一次模型回合。
- **定时任务**：侧栏 扩展管理 → 定时任务；日程面板和侧栏「定时」列表也都跳到这里；或直接在对话里描述"每天 9 点跑一遍测试并汇报"。
- **MCP 连接器**：侧栏「MCP 连接器」：stdio 命令或 streamable-http URL，环境变量 / 请求头，或粘贴 `mcpServers` JSON；页面下方是当前会话实际可用的连接器与工具。
- **打开网页**：地址栏的书签按钮（Alt/⌥ 点击 = 系统浏览器）；`/open https://…` 或 `/open <书签名>`；模型用 `open_url`。书签和搜索引擎在 设置 → MyWork → 浏览器。
- **Mermaid**：回复里的 ```mermaid 代码块自动变图。

## 开始使用

前置：Node ≥ 24（见「已知的坑」）、pnpm、`dsh` 在 PATH 上。**请装最新的 dsh**：`npm i -g @deepseek-ai/dsh@alpha`（当前 0.1.6-alpha.2；`latest` 标签还停在 0.1.5-rc.2）。

### 一条命令试用（不碰 `~/.dsh`）

```bash
git clone https://github.com/William2333ZZ/mywork-deepseekharness.git && cd mywork-deepseekharness
bash scripts/dev-env.sh           # 在仓库内 .dsh-dev-home/ 装 dsh@alpha + 全部插件，起 web 服务（:3090）
bash scripts/dev-env.sh restart   # 改了插件代码后重建并重启
bash scripts/dev-env.sh stop
```

打开命令打印的带 token 的地址；API key 在 设置 → 模型 里填，或运行前 `export DEEPSEEK_API_KEY=…`。Node 低于 24 时脚本会自动改用 Homebrew 的 `node@24`。

### 装进你自己的 dsh

```bash
npm i -g @deepseek-ai/dsh@alpha pnpm
bash scripts/install.sh web       # 构建本地插件，link 进 web profile，并安装社区成员
dsh web
```

然后打开 设置 → MyWork，缺成员就点「补装缺失的 N 个」，重启 dsh。仓库里已提交各包构建好的 `lib/`，别人 clone 后跑同样的命令即可。卸载：`bash scripts/uninstall.sh web`，或逐个 `dsh plugin --profile web remove <name>`。

## 默认内置的插件

本仓库的包（都能单独 `dsh plugin --profile web remove`）：

| 包 | 作用 |
| --- | --- |
| `dsh-mywork-kit` | 组合包本体：成员清单 `kit.json`、设置页 MyWork 入口（成员 / 外观 / 日程 / 浏览器标签由各成员通过 `mywork.settings.tab` 槽贡献）、`mywork_kit_status` 工具、退役成员自动卸载 |
| `dsh-mywork-codex-ui` | Codex 风格侧栏与设置页，fork 自 [@michengai/dsh-codex-ui](https://github.com/MichengAI/dsh-codex-ui)（Apache-2.0）：导航按已装功能收拾，定时任务 / IM助理 / MCP 连接器 是独立主区域页面，去掉了上游的 iframe 页面 |
| `dsh-mywork-shell` | 主题叠加层（Claude Code / 柔和高级 / 极简编辑 / 工业粗野）与界面缩放 |
| `dsh-mywork-schedule` | 提醒（`/remind`、`reminder_*` 工具、日程面板）与定时任务的 IM 通知设置（注入 Automation 的任务弹窗） |
| `dsh-mywork-browser` | 真实浏览器：后台拉起本机 Chrome，官方 browser-use + Playwright MCP 驱动，右侧栏实时画面、Chrome 式地址栏、书签、`open_url` / `/open` |
| `dsh-mywork-im` | 主动发消息到 IM：`im_send` / `im_chats` / `automation_notify_set` 工具、`/imsend`、定时任务结束通知 |
| `dsh-mywork-mcp` | MCP 连接器页面：记录、导入、通过 dsh loader 动态挂成官方 mcp-client 条目 |

社区成员（npm 上的成熟包，由 kit 面板一键安装，也可单独卸载）：

| 成员 | 作用 |
| --- | --- |
| [`@michengai/dsh-automation`](https://github.com/MichengAI/dsh-automation) | 定时任务：按计划在独立会话里执行任务（一次 / 每小时 / 每天 / 每周 / 每月） |
| [`@michengai/dsh-im-connect`](https://github.com/MichengAI/dsh-im-connect) | IM助理：钉钉 / 飞书 / Lark / 微信 / 企业微信 / QQ / Telegram 接到本机 dsh |
| [`dsh-univer-office`](https://github.com/dream-num/dsh-univer-office) | Univer 办公：表格、文档、幻灯片，实时预览与审阅，需要本机 Chrome |
| [`dshmarket`](https://github.com/dsh-market/dsh-market) | 插件市场：2300+ 社区插件一键装 |
| [`dsh-mermaid-render`](https://github.com/baosfeng/my-dsh-plugins/tree/main/plugins/dsh-mermaid-render) | mermaid 代码块渲染成图，离线可用 |
| `@deepseek-ai/dsh-browser-use` + `dsh-experimental-browser-use-playwright-mcp` | 官方 browser-use 运行时，实时浏览器的底座 |

## 为什么选择这条路线

- **组合包 = `dsh.bundle` + `cordis.patch.yml`**。dsh 只激活 profile 直接依赖的组合包层，所以成员不是写进 `dependencies`，而是作为一等公民装进 profile（面板里的"安装"就是在 profile 目录跑 `pnpm add` 再回填 `dsh.profile.bundles`，和 `dsh plugin add` 的对账逻辑一致）。任何成员都能单独卸，也能被插件市场管理。
- **宿主插件零依赖**。第三方插件 import `@deepseek-ai/dsh-tools` 在 `link:` 安装时解析不到，所以宿主代码直接注册原生 JSON Schema 工具、手写配置校验（`src/harness.js`），npm / tarball / git / link 四种安装方式都能加载。
- **浏览器半身是 C6 bundle**：`scripts/build-client.mjs` 把纯 CommonJS 的 `src/client/index.js` 包成 `window.__ModuleLoader__.load({ id, factory })`，`react` 由 dsh 提供，零构建依赖。
- **主题用官方 `ctx.theme.overrideTokens` 叠加层**，明暗方案仍由 dsh 保存；风格同时覆盖 dsh 的 specific / business token 和 fork 的侧栏变量，切换才看得见。
- **缩放作用在应用根节点而不是 `<html>`**：dsh 的浮层用视口坐标定位，缩放整个文档会让它们偏移；根节点缩放 + 对 JS 定位的 fixed 元素做反向缩放，Univer 窗口保持 1:1。
- **不做 iframe**。实时浏览器、MCP 配置、设置页全是原生页面；`dsh-mywork-browser` 禁用了 dsh 内置的 iframe 浏览器行。
- **HTTP 路由都经宿主 `connection.requestRejection` 鉴权**（同源 / token），安装接口再加 loopback 限制。

## 桌面版

`apps/desktop/` 把 dsh + 全部插件打成自包含的桌面应用：Electron 窗口壳 + 自带 Node 24 + 自带 dsh + 自带 Chrome for Testing + 预装好的 profile。dsh 作为子进程运行，窗口只加载它的地址。

```bash
node apps/desktop/build.mjs win-x64     # → apps/desktop/dist/Mywork-DSH_desktop-win-x64.zip
node apps/desktop/build.mjs mac-arm64 && bash apps/desktop/package-mac.sh   # → .dmg
```

Windows 包在 Mac 上交叉构建（npm `--os/--cpu` + pnpm `supportedArchitectures`）。未签名；应用内的插件市场 / 成员安装需要机器上有 pnpm。详见 [apps/desktop/README.md](apps/desktop/README.md)。

## 数据与权限

- 所有个人数据都在 `$DSH_HOME` 下（桌面版：Windows `%APPDATA%\Mywork-DSH_desktop\home`，macOS `~/Library/Application Support/Mywork-DSH_desktop/home`）；套件自己的文件在 `$DSH_HOME/mywork/`：提醒 `reminders.json`、书签 `links.json`、地址栏历史 `browser-history.json`、MCP 记录 `mcp.json`、IM 通知规则 `im-notify.json`、Chrome 登录态 `chrome-profile/`。
- API key、dsh 登录（`.credentials.yaml`）、IM 账号登录态（`dsh-im-connect/`）也在同一目录，重启和升级都保留；换机器把目录拷走即可（含明文 key，注意保管）。
- 安装包里不含任何账号信息；每台机器首次启动自己填 key、自己扫码。
- 浏览器内安装插件 = 在你机器上跑 pnpm。远程 / 共享部署请在 profile patch 里把 kit 配成 `allowInstall: false`。
- 套件的所有 HTTP 接口只对已鉴权的 dsh 页面开放，安装接口只接受 loopback。

## 已知的坑

- **`npx @deepseek-ai/dsh` 在 Node 23 下没有任何输出**：入口用了 `import.meta.main`（Node ≥ 24 才有）。macOS：`brew install node@24`。
- **npm 的 `latest` 标签落后于源码**：用 `@deepseek-ai/dsh@alpha`。
- **微信推送有时效**：微信个人号机器人接口只允许在你给它发消息后的一段时间内回复（靠那条消息带的 context_token），过期后所有主动发送都报 `sendmessage ret=-2 prepare failed`。对策：给机器人回一句就续期；要准点推送用飞书 / 钉钉 / 企业微信账号做通知目标。
- **git 安装的社区插件**可能被 pnpm ≥ 10 挡在 `allowBuilds` 之外；面板会把 pnpm 的提示原样显示，按提示改 profile 的 `pnpm-workspace.yaml` 后重试。
- `dsh-mywork-codex-ui` 会替换官方侧栏 / 设置总览（patch 禁用 `ui-sidebar`、`ui-settings-general`、`session-title-llm`）；还关掉了会话头部的「Open In…」按钮，想要回来在 profile patch 里写 `- id: ui-open-in-app` + `disabled: false`。
- **workspace `pnpm install` 的坑**：dsh alpha 包的 peer 写成 `^0.1.6-alpha.2`，pnpm 自动装 peer 时会交成不存在的范围。根 `package.json` 的 `pnpm.overrides` 解决；升级 dsh 时同步改。
- **dsh 核心模块只能有一份**：插件不要把 `@deepseek-ai/dsh-*` 写进 `dependencies`。官方 `dsh-experimental-browser-use-runtime` 自己把 `dsh-scope` / `dsh-mcp-client` 写成了 dependencies，会多出第二份 → 新建会话报 `tools.restrict() requires a scoped context`；kit 用 pnpm `"-"` override 去掉（`kit.json` 的 `profileOverrides`）。
- **每个会话都能用浏览器**：官方 Playwright provider 在 attach 模式下只给第一个会话用；`dsh-mywork-browser` 自己给每个会话挂非独占的 Playwright MCP。多个会话同时操作时共用同一批标签页。
- `dsh-univer-office@0.3.2` 的前端在 0.1.6-alpha.2 上不会激活（上游 PR #82 已修未发版）；kit 的安装器给已装的 0.3.x 打同样的补丁，0.3.3 上 npm 后删掉即可。
- `@michengai/dsh-im-connect` 给新账号的默认工作区是 dsh 启动目录，不是已登记工作区时每条消息都失败；kit 启动时会改到第一个已登记工作区（[#1](https://github.com/William2333ZZ/mywork-deepseekharness/issues/1)）。
- `dsh-chat-tidy@0.4` 已从成员中退役：它在 alpha.2 上把行距放大一倍、让字号设置失效（[#4](https://github.com/William2333ZZ/mywork-deepseekharness/issues/4)）；已装的 profile 会被自动卸掉。

## 与 DeepSeek Harness 的关系

- 本仓库不是 dsh 的 fork，也不修改 dsh 的任何文件：所有能力都是 dsh 插件（组合包 + patch），dsh 升级后重跑 `scripts/install.sh` 即可。
- 目标 dsh 版本 0.1.6-alpha.2（在 0.1.5-rc.2 上也验证过）。dsh 是 [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 的作品，本仓库与 DeepSeek 无隶属关系。
- 遇到问题先看「已知的坑」，再到 [Issues](https://github.com/William2333ZZ/mywork-deepseekharness/issues) 提；每个已修的 issue 里都有原因和验证记录。

## 相关项目

| 项目 | 说明 |
| --- | --- |
| [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) | DeepSeek Harness 本体 |
| [MichengAI/dsh-codex-ui](https://github.com/MichengAI/dsh-codex-ui) | 本仓库侧栏 / 设置页的上游 |
| [MichengAI/dsh-automation](https://github.com/MichengAI/dsh-automation) · [MichengAI/dsh-im-connect](https://github.com/MichengAI/dsh-im-connect) | 定时任务 / IM 接入 |
| [dream-num/dsh-univer-office](https://github.com/dream-num/dsh-univer-office) | Univer 办公 |
| [dsh-market/dsh-market](https://github.com/dsh-market/dsh-market) | 插件市场 |
| [0xsline/awesome-deepseek-harness](https://github.com/0xsline/awesome-deepseek-harness) | dsh 插件与工具索引 |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | 柔和 / 极简 / 粗野三种风格所依据的设计技能包 |
| [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | 界面审视用的 UX 规则库（`scripts/ux-audit.mjs`） |

## 目录结构

```
packages/
  kit/         kit.json（成员清单）· src/installer.js（pnpm 安装 + bundles 回填 + 退役成员卸载）· src/client（设置面板）
  codex-ui/    fork 自 @michengai/dsh-codex-ui（TypeScript，tsdown 构建）
  shell/       src/client（主题叠加层 + 缩放，MyWork → 外观）
  schedule/    src/logic.cjs（调度逻辑）· src/index.js（工具 / 命令 / API）· src/client（日程面板 + 定时任务 IM 字段注入）
  im/          src/chats.js · src/notify.js（定时任务 → IM）· src/index.js · src/client
  mcp/         src/store.js · src/index.js（loader 动态条目 + API）· src/client
  browser/     src/chrome.js · src/cdp.js · src/links.js · src/history.js（地址栏历史 / 搜索）· src/index.js · src/client
apps/desktop/  Electron 壳与打包脚本
scripts/       build-client.mjs（零依赖 C6 打包器）· install.sh / uninstall.sh · dev-env.sh · profile-fixups.mjs
```

每个包：`node ../../scripts/build-client.mjs .` 构建（codex-ui 用 `pnpm run build`）；`pnpm -r test` 跑测试。

## 更新记录

### 未发布

- 实时浏览器：Retina 屏上全程高清。后台 Chrome 现在按屏幕像素比启动（`pixelRatio`，默认 2），实时流本身就是 2x。多个面板同时看同一页时按最大的那个面板设置视口，不再来回抖动。画面上方有状态条：模型刚导航过时显示「模型正在浏览 · 点击画面即可接管」，你一点画面就切到「你在操作」并停止跟随，按「跟随模型」恢复。
- 风格重做：保留 Claude Code 风格，去掉 Codex / Swiss；按 [taste-skill](https://github.com/Leonxlnx/taste-skill) 的 soft-skill / minimalist-skill / brutalist-skill 新增「柔和高级」「极简编辑」「工业粗野」三种风格，各自带字体、圆角、阴影、动效规则，浅色深色文字全部过 WCAG AA。定时任务 / IM 助理页面里第三方插件的重复标题隐藏；实时浏览器工具条改成 Chrome 式标签条 + 胶囊地址栏。
- 按 [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) 的清单做了一轮界面审视（`scripts/ux-audit.mjs` 自动检查对比度、点击目标、无障碍名称、最小字号）：三种风格的次要 / 三级文字、状态色、主按钮填充全部达到 WCAG AA 4.5:1（Claude 风格的主按钮从 #D97757 改为 #BA5A3A，深色 Swiss 的主按钮改用深色文字）；所有 11px 文字提到 12px；输入框获得可见的焦点环；图标按钮、下拉框、文本域补上无障碍名称；侧栏「更多」按钮和缩放滑块放大到 24px 点击目标。

### 0.0.1（2026-09-23）— 首个版本

- Codex 风格侧栏与设置页（fork 自 dsh-codex-ui，去掉 iframe 页面），新建对话页的四个起点：上网查资料 / 做表格和演示文稿 / 定时任务与提醒 / 微信·飞书助理。
- 三种风格（Claude Code / Codex / Swiss）× 明暗 × 界面缩放 80–150%；缩放作用在应用根节点，浮层菜单、悬停卡片、拖动、Univer 窗口、实时浏览器在任何缩放下都对齐（[#2](https://github.com/William2333ZZ/mywork-deepseekharness/issues/2) [#5](https://github.com/William2333ZZ/mywork-deepseekharness/issues/5) [#6](https://github.com/William2333ZZ/mywork-deepseekharness/issues/6) [#7](https://github.com/William2333ZZ/mywork-deepseekharness/issues/7)）。
- 实时浏览器：后台真实 Chrome + Playwright MCP（每个会话可用），Chrome 式地址栏（网址 / 搜索 / 历史 / 书签 / 行内补全 / Ctrl+L），页面视口跟随面板大小，书签与 `open_url` / `/open`。
- 提醒（`/remind`、日程面板、到点弹窗 + 通知 + 提示音，可发到 IM）与定时任务（Automation）；每个定时任务自己的设定里选「运行结束发到哪个聊天」。
- IM助理（微信 / 飞书 / 钉钉 / 企业微信 / QQ / Telegram）与主动发消息（`im_send`、`/imsend`、发送卡片）；IM 账号工作区未登记时自动修正（[#1](https://github.com/William2333ZZ/mywork-deepseekharness/issues/1)）。
- MCP 连接器页面（应用内配置、mcpServers JSON 导入、保存即挂载）、Univer 表格 / 演示文稿、插件市场、Mermaid。
- 移除不兼容 alpha.2 的 dsh-chat-tidy（[#4](https://github.com/William2333ZZ/mywork-deepseekharness/issues/4)）；折叠工具调用组的空白带修掉（[#3](https://github.com/William2333ZZ/mywork-deepseekharness/issues/3)）。
- 桌面版打包（Mywork-DSH_desktop：Electron + 自带 Node / dsh / Chrome / profile）。

## 许可证

本仓库的包（kit / shell / schedule / browser / im / mcp）为 MIT；`packages/codex-ui` fork 自 [@michengai/dsh-codex-ui](https://github.com/MichengAI/dsh-codex-ui)，保持 Apache-2.0（见其 LICENSE / NOTICE）。社区成员各按其自身许可证。
