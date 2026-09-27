import sys, json, math
sys.path.insert(0, "/Volumes/KESU/deepseek_harness_projects/Mywork_deepseekharness/packages/oracle/digital-oracle")
from digital_oracle import StooqProvider, PriceHistoryQuery

p = StooqProvider()

def hist(sym, interval="d", limit=400):
    r = p.get_history(PriceHistoryQuery(symbol=sym, interval=interval, limit=limit))
    return [(b.date, b.close, b.high, b.low) for b in r.bars]

def pct(a, b):
    return (a / b - 1) * 100 if b else None

def ret_over(bars, n):
    if len(bars) <= n: return None
    return pct(bars[-1][1], bars[-1 - n][1])

def realized_vol(bars, n=20):
    cl = [b[1] for b in bars[-(n + 1):]]
    if len(cl) < n + 1: return None
    rs = [math.log(cl[i + 1] / cl[i]) for i in range(len(cl) - 1)]
    m = sum(rs) / len(rs)
    v = sum((x - m) ** 2 for x in rs) / (len(rs) - 1)
    return math.sqrt(v) * math.sqrt(252) * 100

out = {}

gold_d = hist("XAUUSD", "d", 400)
gold_w = hist("XAUUSD", "w", 60)
gold_m = hist("XAUUSD", "m", 60)

out["gold_daily_count"] = len(gold_d)
out["gold_last"] = {"date": gold_d[-1][0], "close": gold_d[-1][1]}
out["gold_5d"] = ret_over(gold_d, 5)
out["gold_10d"] = ret_over(gold_d, 10)
out["gold_20d"] = ret_over(gold_d, 20)
out["gold_30d"] = ret_over(gold_d, 30)
out["gold_60d"] = ret_over(gold_d, 60)
out["gold_90d"] = ret_over(gold_d, 90)
out["gold_120d"] = ret_over(gold_d, 120)
out["gold_250d"] = ret_over(gold_d, 250)
out["gold_all_high"] = max(b[2] for b in gold_d)
out["gold_all_high_date"] = max(gold_d, key=lambda b: b[2])[0]
out["gold_all_low"] = min(b[3] for b in gold_d)
out["gold_all_low_date"] = min(gold_d, key=lambda b: b[3])[0]
out["gold_drawdown_from_high_pct"] = pct(gold_d[-1][1], out["gold_all_high"])
out["gold_vol20_ann"] = realized_vol(gold_d, 20)
out["gold_vol60_ann"] = realized_vol(gold_d, 60)
out["gold_ma20"] = sum(b[1] for b in gold_d[-20:]) / 20
out["gold_ma50"] = sum(b[1] for b in gold_d[-50:]) / 50
out["gold_ma100"] = sum(b[1] for b in gold_d[-100:]) / 100
out["gold_ma200"] = sum(b[1] for b in gold_d[-200:]) / 200 if len(gold_d) >= 200 else None
out["gold_above_ma20"] = gold_d[-1][1] > out["gold_ma20"]
out["gold_above_ma50"] = gold_d[-1][1] > out["gold_ma50"]
out["gold_above_ma200"] = gold_d[-1][1] > out["gold_ma200"] if out["gold_ma200"] else None
out["gold_last30_closes"] = [{"d": b[0], "c": b[1]} for b in gold_d[-30:]]
out["gold_last12_weekly"] = [{"d": b[0], "c": b[1]} for b in gold_w[-12:]]
out["gold_monthly_last15"] = [{"d": b[0], "c": b[1]} for b in gold_m[-15:]]

# 2026 YTD / long history context
if gold_m:
    yr = [b for b in gold_m if b[0].startswith("2026")]
    out["gold_2026_monthly"] = [{"d": b[0], "c": b[1]} for b in yr]
    if yr:
        out["gold_ytd_pct"] = pct(gold_d[-1][1], yr[0][1])

# relatives
for name, sym in [("copper", "HG=F"), ("silver", "SI=F"), ("dxy", "DX-Y.NYB"), ("gdx", "GDX"), ("spy", "SPY"), ("tips", "TIP"), ("tlt", "TLT"), ("vix", "^VIX"), ("gld", "GLD"), ("wti", "CL=F")]:
    try:
        b = hist(sym, "d", 300)
        out[name] = {
            "last_date": b[-1][0], "close": b[-1][1],
            "d30": ret_over(b, 30), "d60": ret_over(b, 60), "d90": ret_over(b, 90),
            "d250": ret_over(b, 250),
            "high": max(x[2] for x in b), "high_date": max(b, key=lambda x: x[2])[0],
            "low": min(x[3] for x in b), "low_date": min(b, key=lambda x: x[3])[0],
            "vol20": realized_vol(b, 20),
        }
    except Exception as e:
        out[name] = {"error": str(e)}

# ratios
if "copper" in out and "close" in out.get("copper", {}):
    out["copper_gold_ratio"] = out["copper"]["close"] / gold_d[-1][1]
    out["copper_gold_ratio_30d_pct"] = pct(out["copper_gold_ratio"], None) if False else None
if "silver" in out and "close" in out.get("silver", {}):
    out["gold_silver_ratio"] = gold_d[-1][1] / out["silver"]["close"]

# copper/gold ratio change over 30d: recompute jointly
try:
    c = hist("HG=F", "d", 300)
    s = hist("SI=F", "d", 300)
    n = min(len(c), len(gold_d))
    cg_now = c[-1][1] / gold_d[-1][1]
    cg_30 = c[-31][1] / gold_d[-31][1]
    gs_now = gold_d[-1][1] / s[-1][1]
    gs_60 = gold_d[-61][1] / s[-61][1]
    out["copper_gold_ratio"] = cg_now
    out["copper_gold_30d_pct"] = pct(cg_now, cg_30)
    out["gold_silver_ratio"] = gs_now
    out["gold_silver_60d_pct"] = pct(gs_now, gs_60)
except Exception as e:
    out["ratio_err"] = str(e)

print(json.dumps(out, indent=1, default=str))
