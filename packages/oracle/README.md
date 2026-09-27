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
4. 系统提示：遇到概率、宏观、择时、A 股资金流问题先读方法论，至少取 3 个独立维度的信号，按模板输出结构化报告。
5. 设置 → MyWork → **市场先知**：运行环境、联网自检、一键安装 `yfinance`（美股价格历史与期权链需要；只接受本机请求）。
6. 新建对话页多一个「市场先知」起点（dsh-mywork-codex-ui）。

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
```

## HTTP（同源、已登录）

`GET /mywork-oracle/api/status`、`GET /describe`、`POST /selfcheck`（拉 Fear & Greed、国债曲线、Polymarket 各一次）、`POST /install-yfinance`（仅本机）。

## 测试

```bash
cd packages/oracle && npm test          # runner 自省 / 错误路径 / 结果裁剪
cd packages/oracle/digital-oracle && python3 -m pytest -q   # 上游 246 个快照测试，无需联网
```
