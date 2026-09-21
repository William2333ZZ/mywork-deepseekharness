# dsh-mywork-mcp

MCP 服务器配置 for DeepSeek Harness Web：在侧栏 **MCP 连接器** 页面（dsh-mywork-codex-ui 提供的独立页面）里添加 / 编辑 / 停用 MCP 服务器，不用手写 patch，不用重启。

- **传输方式**：`stdio`（本地进程：命令、参数、环境变量、工作目录）或 `streamable-http`（URL + 请求头）。
- **导入**：粘贴 Claude Desktop / Cursor / VS Code 风格的 `{ "mcpServers": { ... } }`，同名覆盖。
- **原理**：每条记录通过 dsh 的 loader 动态生成一条官方 `@deepseek-ai/dsh-mcp-client` 条目（id `mywork-mcp-<名称>`），保存即挂载；工具名为 `mcp__<名称>__<工具>`，所有会话可用。loader 会把条目写进 profile 树，本插件启动时用 `$DSH_HOME/mywork/mcp.json` 与之对账（多余的删、缺的补）。
- **状态**：页面上每张卡显示 已挂载 / 连接中 / 工具数；工具数来自宿主工具注册表。
- **模型工具**：`mcp_servers_list`（只读）。
- **安全**：环境变量与请求头里的密钥明文保存在 `$DSH_HOME/mywork/mcp.json`（0600）；HTTP 路由经宿主 `connection.requestRejection` 鉴权。

```sh
dsh plugin --profile web add dsh-mywork-mcp      # 需要 dsh-mywork-codex-ui 提供的页面
```

配置（cordis.patch.yml，可选）：`dataPath`（记录文件路径）、`tools: false`（不注册 mcp_servers_list）。
