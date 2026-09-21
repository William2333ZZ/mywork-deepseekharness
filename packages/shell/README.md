# dsh-mywork-shell

MyWork 外观 for DeepSeek Harness Web：**Claude Code / Codex 主题 + 界面缩放**，出现在 设置 → MyWork → **外观**（标签槽 `mywork.settings.tab` 由 `dsh-mywork-kit` 声明）。侧栏由 `dsh-mywork-codex-ui` 提供，本包不再碰侧栏。

- **风格**：官方默认 / Claude Code（暖白 + 橙色强调）/ Codex（中性单色、终端感）。用官方 `ctx.theme.overrideTokens` 叠一层 alias token，明暗方案仍由 dsh 自己保存（跟随系统 / 浅色 / 深色），两者自由组合。
- **界面缩放**：80%–150%（`<html>` 的 CSS zoom），记在本浏览器。会话正文字号请用 设置 → 常规 → 字号大小。
- 选择保存在 localStorage：`dsh-mywork-shell:theme`、`dsh-mywork-shell:zoom`。

```sh
dsh plugin --profile web add dsh-mywork-shell
```

卸载即恢复：叠加层、CSS 与标签页随插件一起移除。
