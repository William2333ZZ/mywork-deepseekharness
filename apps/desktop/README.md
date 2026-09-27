# Mywork-DSH_desktop 桌面版

把 DeepSeek Harness + MyWork Kit 打成免安装的桌面应用：Electron 窗口壳 + 自带 Node 24 + 自带 dsh + 自带 Chrome for Testing + 预装好全部插件的 profile。不改 dsh 本体：dsh 以子进程方式运行，窗口只是加载它的带 token 地址。

```
node apps/desktop/build.mjs win-x64     # → dist/Mywork-DSH_desktop-win-x64.zip（免安装，解压双击）
node apps/desktop/build.mjs mac-arm64   # → dist/mac-arm64/Mywork-DSH_desktop.app
bash apps/desktop/package-mac.sh        # → dist/Mywork-DSH_desktop-mac-arm64.dmg
```

构建机是 macOS（需要 node ≥ 24、pnpm、curl、unzip）。Windows 包可以在 Mac 上交叉打：dsh 用 `npm install --os=win32 --cpu=x64` 拿到 win32 的原生可选依赖，profile 用 pnpm 的 `supportedArchitectures` 同理。下载的运行时缓存在 `.cache/`。

## 运行时布局（resources/）

| 目录 | 内容 |
| --- | --- |
| `app/` | `main.js`：起 dsh、等 `dsh web:` 行、加载窗口；外链走系统浏览器。`preload.js`：给页面暴露 `window.myworkDesktop.browser`（原生标签页桥） |
| `runtime/node/` | 官方 Node 24 |
| `runtime/dsh/` | `@deepseek-ai/dsh@alpha` 及其原生依赖（目标平台） |
| `runtime/chrome/` | Chrome for Testing；只通过 `UNIVER_RENDER_BROWSER` 交给 Univer 渲染（实时浏览器不再用它，见下） |
| `runtime/profile-template/` | 装好全部 kit 成员的 profile（首次启动复制到数据目录） |

数据目录：Windows `%APPDATA%\Mywork-DSH_desktop\`，macOS `~/Library/Application Support/Mywork-DSH_desktop/`；里面是 `home/`（DSH_HOME）和 `dsh.log`。

## 已知限制

- 未签名：Windows SmartScreen / macOS Gatekeeper 首次都会拦一次。
- 只出 win-x64 与 mac-arm64。
- 应用内的“插件市场 / MyWork 成员安装”需要机器上有 pnpm；打包版默认不带。
- Windows 包在 Mac 上交叉构建，无法在此验证运行；请在 Windows 上实测。

## 内嵌真实浏览器（Claude 桌面版的做法）

桌面壳自己带 `--remote-debugging-port`（默认 9333，和插件共用 `MYWORK_BROWSER_PORT`），并给 dsh 子进程设 `MYWORK_DESKTOP=1`。实时浏览器插件看到这个变量就不再拉起后台 Chrome，而是**接到 Electron 自己的 DevTools 端口**上：

- 每个标签页是一个 `WebContentsView`（沙箱、无 Node），加到主窗口里，位置 = 页面里「实时浏览器」面板 `.mwb-view` 的矩形（页面通过 `preload.js` 的桥持续上报 `setBounds`，面板收起时传 `null` 隐藏）。
- 页面上的标签条、地址栏、`open_url` / `/open` 都走同一批标签页：页面通过桥建标签（`newTab`）、切换（`select`）、关闭（`closeTab`）；插件那边 Playwright MCP、截图、`/status` 看到的就是这些标签的 CDP target id。Electron 的 DevTools 端口不支持 `Target.createTarget`，所以模型要开新页时插件广播一条 `open-request`，打开着面板的页面建好标签后 `/open-ack` 回执。
- 主窗口只允许导航到 dsh 自己的地址（`will-navigate` 拦截），共享 DevTools 端口的自动化不可能把应用窗口带到别处；标签页里 `window.open` 会开成新标签，不弹窗。
- 不打包时的开发方式：先 `MYWORK_DESKTOP=1 bash scripts/dev-env.sh restart`，再 `MYWORK_DESKTOP_DEV_URL=<带 token 的地址> MYWORK_BROWSER_PORT=9333 npx electron .`（apps/desktop 目录，先 `npm i --no-save electron@44`）。
