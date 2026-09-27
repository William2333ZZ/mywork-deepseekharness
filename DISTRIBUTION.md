# 交易工作台 — 发行版说明

本分支（`digital-oracle-work`）是 MyWork Kit 的**交易分析发行版「交易工作台」**：在完整的 MyWork Kit（Claude 风格界面、日程、真实浏览器、IM、MCP）之上，内置 [Digital Oracle](https://github.com/komako-workshop/digital-oracle)（komako-workshop，MIT）作为「市场先知」——用市场交易数据回答概率、宏观、择时与 A 股资金流问题。它将来作为独立发行版打包发布；`main` 仍是通用的 MyWork Kit。

## 设计合约

产品设计按 Open Design 的方法立了合约，见 [design/DESIGN.md](design/DESIGN.md)（九节视觉规范）、[design/design-contract.md](design/design-contract.md)（证据、取舍、质量门禁）、[design/implementation-handoff.md](design/implementation-handoff.md)（实现交接）。改界面先改合约。

## 发行版模式

`packages/codex-ui/src/edition.ts` 里 `EDITION = 'oracle'`（main 是 `'kit'`），产品名「交易工作台」在 `EDITION_NAME` 一处。生效后：启动落在驾驶舱；侧栏是「驾驶舱 / 报告 / 巡检 / 提问」，没有「更多」；插件市场、MCP、通知账号从设置或巡检页进，会话列表叫「分析记录」，不显示工作区名和置顶分区，两个标签叫「通知 / 巡检」；左栏「提问」打开对话入口页：输入框上方是行情条、我的标的（每行「分析」直接开对话并发送）、最近报告和一行常见问法；驾驶舱页是完整版（市场温度网格、标的与持仓表、报告档案），不再有五个问题面板；dsh 自带的「回到对话」按钮在发行版里隐藏；输入框占位文字是市场问题；隐藏工作区选择行和「访问模式」；会话标题就是问题本身，没有 emoji 和类型前缀；设置页去掉内置插件、插件配置、Agent 预设、Codex UI 四项，IM 助理和定时任务在这里也叫「消息通知 / 定时巡检」。调试时在浏览器 localStorage 写 `dsh-mywork:edition = kit` 可临时看回套件原貌。

默认风格是 shell 新增的「市场终端」家族：中性底色、一个蓝色动作色、语义涨跌色，Geist 配 JetBrains Mono，1px 细线、4px 圆角，浅色深色全部过 WCAG AA。驾驶舱右上角可切换涨跌配色（默认红涨绿跌）。

**报告页**：模型存档的每份报告一行（概率、标题、结论、标的与主题标签、日期），可按标的 / 主题筛选、搜索，同一标的或主题的概率按时间连成历史，可标记事后对错、打开原对话。

**巡检页**：每日一次的数据摘要（市场温度与今日变化、我的标的与持仓、该复核的报告）在设定时间推到飞书账号；可预览、可立即推送、有执行记录。「今日变化」来自每日收盘快照（保留十天），只列超过噪声阈值的变动。

## 与 main 的差异

| 位置 | 内容 |
| --- | --- |
| `packages/oracle/` | 新成员插件 `dsh-mywork-oracle`：驾驶舱（市场温度、五个问题、自选、持仓、报告档案）、`oracle_docs` / `oracle_providers` / `oracle_fetch` / `oracle_status` / `oracle_portfolio` / `oracle_report_save` 工具、系统提示、设置页「市场先知」。上游代码以 git subtree 放在 `packages/oracle/digital-oracle/` |
| `packages/codex-ui` | 发行版模式（`edition.ts`）：字标、导航、落地页、五问首页、会话标题；「市场先知」页面（槽位 `mywork.oracle.section`）；`mywork:new-conversation` 事件桥 |
| `packages/kit/kit.json` | 成员表加入 `dsh-mywork-oracle`（分组「交易 · 市场数据分析」） |
| `packages/shell` | 「市场终端」风格家族，发行版默认 |
| `design/` | 设计合约 |
| `scripts/dev-env.sh` | 开发环境把 oracle 一起构建、链接 |

其余（字体、主题、浏览器、IM、桌面壳）与 `main` 完全相同；`main` 的改动定期合并进来，本分支不反向合并。

## 边界

- **只做分析。** 不下单、不接交易所 / 券商账户、不给个性化投资建议。持仓是用户手填的数量和成本，只用于算浮动盈亏和给模型当背景。所有数据源免费、无需 API key，结论必须标注不确定性。
- 前置依赖：本机 Python 3.9+（macOS 自带即可）；美股价格历史与期权链需要 `yfinance`（设置页一键安装，或 `uv pip install yfinance`）。

## 更新上游

```bash
git subtree pull --prefix packages/oracle/digital-oracle https://github.com/komako-workshop/digital-oracle.git main --squash
cd packages/oracle/digital-oracle && python3 -m pytest -q
```

## 待办（打包前）

- 桌面壳已改名 TradingWorkbench（窗口标题「交易工作台」）；打包前再核对图标与安装说明。
- 定时巡检：一键创建每日任务，把变化最大的信号推到飞书（直接推送已就绪）。
- README 截图与「市场先知」的示例报告。
