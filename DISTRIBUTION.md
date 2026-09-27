# Digital Oracle Work — 发行版说明

本分支（`digital-oracle-work`）是 MyWork Kit 的**交易分析发行版**：在完整的 MyWork Kit（Claude 风格界面、日程、真实浏览器、IM、MCP）之上，内置 [Digital Oracle](https://github.com/komako-workshop/digital-oracle)（komako-workshop，MIT）作为「市场先知」——用市场交易数据回答概率、宏观、择时与 A 股资金流问题。它将来作为独立发行版打包发布；`main` 仍是通用的 MyWork Kit。

## 与 main 的差异

| 位置 | 内容 |
| --- | --- |
| `packages/oracle/` | 新成员插件 `dsh-mywork-oracle`：`oracle_docs` / `oracle_providers` / `oracle_fetch` / `oracle_status` 工具、系统提示、设置页「市场先知」。上游代码以 git subtree 放在 `packages/oracle/digital-oracle/` |
| `packages/codex-ui` | 新建对话页多一个「市场先知（交易数据）」起点 |
| `packages/kit/kit.json` | 成员表加入 `dsh-mywork-oracle`（分组「交易 · 市场数据分析」） |
| `scripts/dev-env.sh` | 开发环境把 oracle 一起构建、链接 |

其余（字体、主题、浏览器、IM、桌面壳）与 `main` 完全相同；`main` 的改动定期合并进来，本分支不反向合并。

## 边界

- **只做分析。** 不下单、不接交易所 / 券商账户、不给个性化投资建议。所有数据源免费、无需 API key，结论必须标注不确定性。
- 前置依赖：本机 Python 3.9+（macOS 自带即可）；美股价格历史与期权链需要 `yfinance`（设置页一键安装，或 `uv pip install yfinance`）。

## 更新上游

```bash
git subtree pull --prefix packages/oracle/digital-oracle https://github.com/komako-workshop/digital-oracle.git main --squash
cd packages/oracle/digital-oracle && python3 -m pytest -q
```

## 待办（打包前）

- 发行版命名与桌面壳品牌（`apps/desktop` 的 APP_NAME / productName 改成发行版名称）。
- README 截图与「市场先知」的示例报告。
