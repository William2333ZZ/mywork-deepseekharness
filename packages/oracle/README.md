# dsh-mywork-oracle — Digital Oracle · 市场数据先知

把 [komako-workshop/digital-oracle](https://github.com/komako-workshop/digital-oracle)（MIT）接进 DeepSeek Harness：用市场交易数据回答「这件事概率多大」「现在值不值得买」「A 股主力在买还是卖」，不看新闻不读观点。**只做分析，不下单、不接交易所或券商账户。**

## 它做了什么

1. 上游项目以 git subtree 内置在 `digital-oracle/`（`git subtree pull --prefix packages/oracle/digital-oracle https://github.com/komako-workshop/digital-oracle.git main --squash` 更新）。13 个数据源全部免费、无需 API key，12 个只用 Python 标准库。
2. `src/runner.py` 用本机 Python（3.9+；`python3` / `python`，或 `MYWORK_ORACLE_PYTHON`，都没有时退到 `uv run python`）驱动这些 provider：一次请求里的多个调用并行执行，dataclass 结果连同派生属性（`yes_probability`、`spread`、`atm_iv`…）序列化成 JSON。
3. 模型工具：
   - `oracle_docs(name)` — `skill`（方法论与五步工作流）/ `providers`（API 速查）/ `symbols`（交易代码目录）/ `readme`
   - `oracle_providers(provider?)` — 数据源、方法、参数、查询字段的自省
   - `oracle_fetch(calls | provider+method+args)` — 并行取数，最多 12 个调用；结果按预算裁剪长数组
   - `oracle_status()` — Python / yfinance / 数据源状态
   - `oracle_portfolio()` — 驾驶舱的自选、持仓（含浮动盈亏）和缓存信号（只读）
   - `oracle_report_save(...)` — 把报告结论存进驾驶舱档案
4. 系统提示：遇到概率、宏观、择时、A 股资金流问题先读方法论，至少取 3 个独立维度的信号，按模板输出结构化报告。
5. 设置 → MyWork → **市场先知**：运行环境、联网自检、一键安装 `yfinance`（美股价格历史与期权链需要；只接受本机请求）。
6. 新建对话页多一个「市场先知」起点（dsh-mywork-codex-ui）。

## 驾驶舱（侧栏「市场先知」页）

发行版的首页。整页由本插件通过 codex-ui 的 `mywork.oracle.section` 槽位渲染：

- **市场温度**：恐惧贪婪指数、10Y 实际利率、10Y–2Y 利差、黄金、铜/金比、原油、美元/人民币、BTC 期货年化基差、CFTC 黄金基金净多头、A 股主力净流入板块、Polymarket 美联储 / 衰退合约。每张卡带 30 日变化、含义和数据源；黄金 / 铜金比 / 原油 / 汇率有 30 日折线。
- **五个问题**：地缘冲突、衰退周期、泡沫与风险偏好、资产择时、A 股。每个面板列出它用到的信号，「问先知」把这些数字、你的自选与持仓和方法论要求一起放进一个新对话，模型从第二层信号开始补数、按模板出报告，写完用 `oracle_report_save` 存档。
- **自选**：五类标的（美股 / 商品 / 外汇、A 股、加密现货、Polymarket 合约、Kalshi 合约），显示最新、日变化、30 日变化和折线。
- **持仓**：从自选里选标的，填数量和成本，按最新报价算市值和浮动盈亏。**这里没有任何下单功能**，持仓只用来算盈亏和给模型当分析背景（`oracle_portfolio` 工具可读）。
- **报告档案**：模型存下的报告卡片（概率、窗口、摘要、关键信号），可打开原对话。

数据缓存在 `$DSH_HOME/mywork/oracle-snapshot.json`：信号 15 分钟、自选报价 5 分钟自动刷新，手动刷新有 45 秒冷却，所有数据源都是免费接口。自选 / 持仓 / 报告存在 `$DSH_HOME/mywork/oracle.json`。价格类信号（黄金、原油、美股自选）经 Yahoo Finance，需要 `yfinance`。

## 配置

```yaml
- id: mywork-oracle
  name: dsh-mywork-oracle
  config:
    tools: true          # oracle_* 工具
    promptHint: true     # 系统提示段
    python: ''           # 指定解释器（默认 MYWORK_ORACLE_PYTHON → python3 → python → uv）
    timeoutMs: 120000    # 一批 oracle_fetch 的总超时
    maxChars: 80000      # 交给模型的结果预算（超出时先截长数组）
    signalsTtlMin: 15    # 驾驶舱信号缓存分钟数
    quotesTtlMin: 5      # 自选报价缓存分钟数
```

## HTTP（同源、已登录）

`GET /mywork-oracle/api/status`、`GET /describe`、`POST /selfcheck`（拉 Fear & Greed、国债曲线、Polymarket 各一次）、`POST /install-yfinance`（仅本机）；驾驶舱：`GET /dashboard`、`POST /dashboard/refresh`、`POST /watchlist` / `/watchlist/remove`、`POST /positions` / `/positions/remove`、`POST /reports/remove`、`POST /panels/prompt`。

## 测试

```bash
cd packages/oracle && npm test          # runner 自省 / 错误路径 / 结果裁剪
cd packages/oracle/digital-oracle && python3 -m pytest -q   # 上游 246 个快照测试，无需联网
```
