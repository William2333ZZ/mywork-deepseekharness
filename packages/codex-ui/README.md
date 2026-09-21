# dsh-mywork-codex-ui

MyWork Kit 的 Codex 风格侧栏与设置页，fork 自 [@michengai/dsh-codex-ui](https://github.com/MichengAI/dsh-codex-ui) 1.1.14（Apache-2.0，见 `LICENSE` / `NOTICE`；上游说明见 `README.upstream.md`）。

与上游的差别：

- **导航按已安装的功能收拾**：「扩展管理」里只放 定时任务 与 插件市场（插件配置、连接器从设置页进）；专家 / 技能 / IM助理 只在对应插件真的注册了设置分区时才出现（宽侧栏、窄侧栏、搜索面板三处一致），不再把找不到的入口跳到「Codex UI」关于页。
- **定时任务 / IM助理 / MCP 连接器 是独立页面**：像 dsh 自带的插件管理页一样占据主区域，侧栏保持可见（面板 id `mywork-schedule` / `mywork-im` / `mywork-mcp`）。前两页直接挂载 `@michengai/dsh-automation`、`@michengai/dsh-im-connect` 注册的设置分区视图；MCP 页声明子槽 `mywork.mcp.section`，`dsh-mywork-mcp` 把服务器管理器渲染在这里，下方是本包的原生连接器 / 工具列表。没装对应插件时页面给出安装提示。
- **没有 iframe**：去掉了把第三方费用插件套进 iframe 的「使用统计」页，连接器页始终用原生列表（装了 `dsh-mcp-connector` 时提供「在新标签页打开市场」）。
- 去掉上游的发布 / CI 脚本与测试依赖；构建只剩 `tsdown`。

```sh
pnpm --filter dsh-mywork-codex-ui run build     # lib/index.mjs + lib/client.js
pnpm --filter dsh-mywork-codex-ui run typecheck
```

`cordis.patch.yml` 与上游一致：禁用 `ui-sidebar`、`ui-settings-general`、`session-title-llm`，插入 `mywork-codex-ui` 与 `mywork-codex-ui-session-title`。
