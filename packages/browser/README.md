# dsh-mywork-browser

真实浏览器 for DeepSeek Harness：**后台拉起本机 Chrome，模型驱动它，画面实时渲染在 dsh 页面里，你随时可以接管。**

## 它做了什么

1. dsh 启动时，插件在后台启动本机的 Chrome / Chromium / Edge（默认新版无头模式，不弹窗），只在 `127.0.0.1:9333` 开一个 DevTools 端口。不下载任何东西；找不到浏览器时会在「实时浏览器」标签里提示。
2. 同时挂载 dsh **官方**的 `browser-use` 服务，并由本插件给**每个会话**各挂一份官方 Playwright MCP（attach 到同一个 Chrome，非独占）。模型因此在任何对话里都有 `mcp__playwright-mcp__*` 工具：导航、点击、输入、快照、截图。官方 provider 行在 attach 模式下是独占的（只有启动后第一个会话能用，其它会话报 "browser tool belongs to another Session"），所以套件不插入那一行，而是用同一个运行时自己挂载（`src/mcp-provider.js`）。
3. dsh 内置的 iframe 浏览器行 `ui-sidebar-browser` 被本插件的 patch 禁用；右侧栏的「**浏览器**」标签由本插件接管（注册为 dsh 的 `browser` 类型，扩展优先于内置的 iframe 实现）：引导页入口、回复里的链接点击、其他插件的 `openTab('browser')` 全部进入实时浏览器（输入框旁 🌐 按钮，或右侧栏引导页）：通过 CDP `Page.startScreencast` 把页面画面以 SSE 推到网页里；你的点击、滚动、输入会回传到后台浏览器。有标签页选择、前进/后退/刷新、地址栏、「跟随模型」开关。宿主用 CDP `Target.setDiscoverTargets` 监听后台浏览器的全部页面事件并经 SSE 推给网页端：**模型一导航，实时浏览器标签就自动弹出/聚焦**，不用你手动点。
4. GitHub、Google 这类禁止 iframe 嵌入的站点在这里**完全正常**，登录态保存在 `$DSH_HOME/mywork/chrome-profile`，下次还在。
5. **书签与打开网页**：地址栏的书签按钮（保存的链接 / 收藏当前页）；模型工具 `open_url`（默认在实时浏览器里打开并自动展示，`target: system` 用系统浏览器）与 `quick_links`；命令 `/open <网址|书签名> [system]`。`open_url` 直接让后台 Chrome 导航，CDP 目标监听器随即把实时标签推到前台——事件驱动，不轮询。
6. **设置 → MyWork → 浏览器**：运行状态（内核、端口、无头、标签页数）、重启、书签管理。

```sh
dsh plugin --profile web add dsh-mywork-browser @deepseek-ai/dsh-browser-use@alpha @deepseek-ai/dsh-experimental-browser-use-playwright-mcp@alpha
# 需要 dsh >= 0.1.6-alpha.2、Node >= 24、本机有 Chrome。两个官方包必须装在 profile 里（kit 的成员面板会代劳）：
# 若作为本包的依赖打进来，会加载第二份 dsh 核心模块，新建会话时报 "tools.restrict() requires a scoped context"。
# 官方 runtime 包又把 dsh-scope / dsh-mcp-client 写成了 dependencies：profile 的 package.json 需要
#   "pnpm": { "overrides": { "@deepseek-ai/dsh-scope": "-", "@deepseek-ai/dsh-mcp-client": "-" } }
# （kit 安装器 / scripts 会自动写入；手动安装请自己加上再 pnpm install）。
```

## 配置

profile 的 `cordis.patch.yml`（patch 会整体替换 config，所以要把需要的键都写上）：

```yaml
- id: mywork-browser
  config:
    autoLaunch: true      # false = 你自己起一个带 --remote-debugging-port 的浏览器
    headless: false       # 默认值；设置页里的「显示真实浏览器窗口」开关会覆盖它（存在 browser-history.json 的 headed 字段）
    port: 9333
    executablePath: ''    # 留空自动找 Chrome / Chromium / Edge；或设环境变量 MYWORK_BROWSER_EXECUTABLE
    width: 1280
    height: 800
    quality: 60           # 实时画面 JPEG 质量
    pixelRatio: 2         # 后台浏览器的像素比：无头 Chrome 的实时流按启动时的像素比输出，2 = Retina 高清；1 = 帧更小
    proxy: ''             # 例如 socks5://127.0.0.1:1080；留空用系统代理设置（或环境变量 MYWORK_BROWSER_PROXY）
    linksPath: ''         # 书签文件，默认 $DSH_HOME/mywork/links.json
    allowSystemBrowser: true
    seedLinks: [{ name: GitHub, url: https://github.com/ }]   # 首次运行写入的书签
    modelTools: true      # false = 不给模型挂 Playwright MCP（只保留实时浏览器与 open_url）
    toolCallTimeoutMs: 0  # Playwright 工具单次调用超时；0 = MCP 客户端默认
```

`MYWORK_BROWSER_PORT` 环境变量可同时改插件和 Playwright 提供方的端口。

## 安全

- DevTools 端口只绑定回环地址；所有 HTTP 路由经宿主 `connection.requestRejection` 鉴权（同源 + token）。
- 输入转发只接受鼠标/文本/少量功能键，不执行任意脚本。
- `open_url` / 书签只接受 http(s) 链接，且不含内嵌凭证。
- 远程 / 共享部署时请注意：能打开 dsh 页面的人就能操作这个浏览器。

## 实现

零依赖：`src/chrome.js`（找浏览器、拉起、等端口）、`src/cdp.js`（用 Node 自带 `WebSocket` 的最小 CDP 客户端 + 截屏流广播 + 目标监听）、`src/links.js`（书签存储）、`src/index.js`（宿主 API、open_url / quick_links / /open、系统提示词提示）、`src/client/index.js`（右侧栏标签）。

## 地址栏（Chrome 式）

- 输入框像 Chrome 的地址栏：不聚焦时显示去掉 `https://`、`www.` 和末尾 `/` 的网址，点进去全选、显示完整网址。
- 输入网址（`github.com`、`localhost:3090`、带协议的）直接打开；输入书签名打开书签；其它文字用搜索引擎搜（默认 Bing，可在 设置 → MyWork → 浏览器 换成 Google / 百度 / DuckDuckGo）。
- 边输边出建议：历史（按访问次数和时间排序，标题 + 网址）、书签；第一行永远是"前往 …"或"用 … 搜索"。↑ ↓ 选，Enter 前往，Esc 还原并退出，Tab 接受行内补全。
- 行内补全：历史里有以你输入开头的网址时，自动补全剩余部分并选中，继续输入会覆盖。
- 在实时画面里按 Ctrl/Cmd + L 跳到地址栏。
- 历史记在 `$DSH_HOME/mywork/browser-history.json`（最多 3000 条，模型和你打开的页面都算；本机 dsh 的 token 页不记）；设置页可一键清除。接口：`POST /mywork-browser/api/omni/go {target?, text}`、`GET /history/search?q=`、`POST /history/clear`、`GET|POST /prefs`。
- 页面视口跟随面板：实时画面不再固定 1280 × 800 留黑边，面板多大（拖侧栏、全屏、缩放）后台页面就按多大排版，画面铺满；模型截图看到的也是同一尺寸。接口 `POST /mywork-browser/api/resize {target, width, height, scale}`（CDP `Emulation.setDeviceMetricsOverride` + 重开 screencast）。

## 登录态：把已有的 Cookie 导进后台浏览器

有些网站在实时浏览器里不方便登录（扫码、短信）。设置 → MyWork → 浏览器 → 「登录态（Cookie 导入）」，把你自己浏览器里已登录的 Cookie 粘进去即可，支持 `name=value; name2=value2`（需填域名）、Cookie-Editor 导出的 JSON、Netscape `cookies.txt`。也可以在对话里把 Cookie 粘给模型，它会调用 `browser_set_cookies` 写入。接口只接受本机请求，Cookie 只进后台 Chrome 的 profile，不显示、不上传、不落我们自己的文件。
