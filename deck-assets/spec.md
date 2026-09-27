# Deck spec — 现在是否值得做多黄金

Page size: 960 × 540 px. Origin top-left.

## Deck constants
- bg deep:      #0E1621
- bg panel:     #16212E
- bg panel 2:   #1C2A39
- gold:         #E8B54D
- gold deep:    #C9942F
- text primary: #F2F5F8
- text body:    #AFC0D0
- text mute:    #7A8A9A
- red (bear):   #E0574A
- green (bull): #4FB477
- hairline:     #2A3846

Fonts: title = "Source Han Sans SC","PingFang SC",Helvetica,Arial,sans-serif; body same.
Sizes = SVG px: page title 32, page kicker 13 (letter-spacing 3), card heading 18, metric 40–56,
body 14–15, label 12, footnote 11.

Rules: left margin 64, right margin 64, content width 832. Header y=56 title, y=86 kicker.
Footer hairline y=500, footer text y=518. Every page gets a gold 6px accent bar top-left
(x=64,y=44,w=44,h=5) except the title page.

Every page has a distinct structure. No two adjacent pages share a layout.

---

## Page 1 — Hero verdict
Structure: hero. Core message: 现在不是一次性做多的时候。
- Full-bleed dark bg with a large gold radial-ish band (use a wide rounded gold-tinted rect at low opacity on the right).
- Kicker: "MARKET-IMPLIED VERDICT · 2026-09-27"
- Big title: "现在适合买黄金吗？"
- Verdict line (gold, large): "不建议现在一次性做多"
- Sub: "可以小仓位分批建底仓 —— 但不是现在追"
- Three inline metrics across the bottom: "4,321 USD/oz  现货基准" / "+51bp  10Y 实际利率 1个月变化" / "93%  6个月内触及 4,278 的概率"
- Right side: a vertical "42%" ... actually: right side shows a stacked gold block with "Iv/Rv 0.67" and "期权折价 33%".
- Footer: "数据源：US Treasury TIPS · CFTC COT · GLD 期权链 · Polymarket · FearGreed"

## Page 2 — Signal dashboard (5 layers)
Structure: layered rows (5 horizontal bands). Core message: 五个独立维度，四个偏空。
- Title: "五层信号：四个偏空，一个托底"
- Kicker: "INDEPENDENT MARKET SIGNALS"
- 5 rows, each: left gold number 01–05, dimension label, data value (bold gold), one-line reading, and a right-aligned arrow chip (↓空 / ↑多 / →中).
Rows:
01 实际利率 | 10Y TIPS 2.83%，1个月 +51bp | 持有黄金的机会成本处于 2008 年前水平 | ↓
02 价格抗性 | 利率+51bp，金价仅 −1.95% | 央行实需在承接，但抗性有限 | →
03 矿商/金属 | GDX −6.80% vs GLD −3.79%，破 95 | 矿商是领先指标，它在报警 | ↓
04 期权定价 | ATM IV 16.43% vs 30日已实现 24.4% | IV/RV=0.67，市场低估波动而非方向 | →
05 预测市场 | 10月触 4,700 仅 12.5%；跌至 3,500 12% | 短期突破无定价，下尾不免费 | ↓

## Page 3 — Contradiction / real-rate wall
Structure: comparison (two panels + center vs). Core message: 实需说买，利率说等；金属抗跌，矿商领跌。
- Title: "两组关键矛盾"
- Two panels.
  Left panel "实需托底" (green edge): 央行 Q2 购金 289 吨（纪录） / 9月 ETF 净流入 ≈ 20亿 USD / 4,278–4,289 两次被接住 → conclusion: 底部真实。
  Right panel "资金先撤" (red edge): 10Y 实际利率 +20bp/3天，加速上行 / CFTC 净多 30.9% OI（较8/25 −17,358手） / GDX 破 95 → 90.85 → conclusion: 流量在压制。
- Center column: large "VS" in gold.
- Bottom band: 破解 — 期权 IV/RV=0.67 说明市场低估的是波动、不是方向。
- Footnote: 矿商与金属是同一资产的两个定价层 → 权重最高的分歧信号。

## Page 4 — Probability scenarios
Structure: horizontal bars (4 scenarios) + 6M distribution strip. Core message: 先跌后涨是主导路径。
- Title: "概率场景：未来 6 个月"
- Four rows with horizontal bars and % labels:
  先跌后涨（下探 4,000–4,150 后修复） 40%
  区间震荡 4,150–4,500 30%
  直接上行 站稳 4,500+ 30%
  深度回撤 <3,800 27%
- Right/bottom: a 6-month price distribution strip from 3,800 → 5,000 marked with 4,000 / 4,321 / 4,500 / 4,700 and 1σ band 3,848–4,853.
- Footnote: 1σ 由 GLD 6个月 ATM IV 21.9% 推导；6个月 P(触 4,000)=51%。

## Page 5 — Operation framework
Structure: 5-zone decision rail (do/don't cards in a row with a price axis). Core message: 位置和时机不匹配，等 4,200–4,250。
- Title: "操作框架：什么时候才是「现在」"
- A horizontal price axis 4,150 → 4,500 with three zone markers: 现在 4,321 (red zone, "不追") / 4,200–4,250 (gold zone, "理想建仓") / 4,500+ (green zone, "确认后加").
- Below: three cards
  ❌ 不建议：现在满仓 — 实际利率 +20bp/3天加速，矿商破位
  ⚠️ 可考虑：小仓 ≤1/3 试探 — 央行 289 吨托底，期权定价折价 33%
  ✅ 看涨者用期权替代现货 — IV/RV=0.67，买期权优于买现货
- Footnote: 4,278 作止损仅 0.97 个日 σ = 噪音；2σ 止损在 4,232 下方。

## Page 6 — Monitoring thresholds
Structure: table. Core message: 触发条件决定「现在」何时变成「当时」。
- Title: "监测阈值：满足这些才是买点"
- Table 5 rows × 4 cols: 信号 | 当前值 | 触发条件 | 含义
  10Y TIPS 实际利率 | 2.83%（+51bp/月） | 回落至 2.60% 以下 | 逆风解除，胜率升至 70%
  GDX 金矿股 | 92.87（已破 95） | 收复 97.8 | 矿商领涨确认
  CFTC 净多 / OI | 30.9% | 降至 25% 以下 | 投机盘出清，底部扎实
  现货金价 | 4,321 | 跌至 4,200–4,250 | 风险回报反转
  GLD ATM IV | 16.4% | 升至 22%+ | 恐慌定价，反而接近买点
- High OI strikes footnote: GLD 12/18 到期：300P OI 6,719 / 310P OI 9,237 / 300C... use: 300P 6,719、310P 9,237、295P 608 — 下行保护集中在 300–310 美元。

## Page 7 — Risks & sources
Structure: two-column risk split + sources block. Core message: 两个方向的代价。
- Title: "风险与数据来源"
- Left card (green, 上行风险 / 踏空): 实际利率 2.83% 是脆弱高位；就业转弱 → 降息重定价 → 金价脉冲式反弹。完全空仓也有成本。
- Right card (red, 下行风险 / 套牢): 实际利率若向 3.0%+ 突破（30Y 已 3.22%），叠加净多 31% OI 平仓，4,000 测试会很快。
- Sources block: US Treasury TIPS 实际利率曲线 · CFTC COT 黄金/白银 · YFinance GLD 期权链（9/28、12/18） · Yahoo Finance GC=F / GLD / GDX · Polymarket · CNN FearGreed 37
- Disclaimer band: 以上为市场交易数据推导的风险回报评估，不构成个性化投资建议。
- Verdict restated small: 6–12 个月正收益概率约 55%，但入场位置应在 4,200–4,250。
