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
| `app/` | `main.js`：起 dsh、等 `dsh web:` 行、加载窗口；外链走系统浏览器 |
| `runtime/node/` | 官方 Node 24 |
| `runtime/dsh/` | `@deepseek-ai/dsh@alpha` 及其原生依赖（目标平台） |
| `runtime/chrome/` | Chrome for Testing；通过 `MYWORK_BROWSER_EXECUTABLE` / `UNIVER_RENDER_BROWSER` 交给实时浏览器插件和 Univer |
| `runtime/profile-template/` | 装好全部 kit 成员的 profile（首次启动复制到数据目录） |

数据目录：Windows `%APPDATA%\Mywork-DSH_desktop\`，macOS `~/Library/Application Support/Mywork-DSH_desktop/`；里面是 `home/`（DSH_HOME）和 `dsh.log`。

## 已知限制

- 未签名：Windows SmartScreen / macOS Gatekeeper 首次都会拦一次。
- 只出 win-x64 与 mac-arm64。
- 应用内的“插件市场 / MyWork 成员安装”需要机器上有 pnpm；打包版默认不带。
- Windows 包在 Mac 上交叉构建，无法在此验证运行；请在 Windows 上实测。
