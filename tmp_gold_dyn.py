import sys, json, math
sys.path.insert(0, "/Volumes/KESU/deepseek_harness_projects/Mywork_deepseekharness/packages/oracle/digital-oracle")
from digital_oracle import StooqProvider, PriceHistoryQuery, StooqProvider as S

p = StooqProvider()
r = p.get_history(PriceHistoryQuery(symbol="XAUUSD", interval="d", limit=90))
bars = [(b.date, b.open, b.high, b.low, b.close) for b in r.bars]
out = {}
out["last25_daily"] = [{"d": b[0], "o": round(b[1],1), "h": round(b[2],1), "l": round(b[3],1), "c": round(b[4],1)} for b in bars[-25:]]

cl = [b[4] for b in bars]
# consecutive down days
dn = 0
for i in range(len(cl)-1, 0, -1):
    if cl[i] < cl[i-1]: dn += 1
    else: break
out["consecutive_down_days"] = dn
# 30d change on two different bases
out["chg_30d_pct"] = (cl[-1]/cl[-31]-1)*100
out["chg_20d_pct"] = (cl[-1]/cl[-21]-1)*100
out["chg_10d_pct"] = (cl[-1]/cl[-11]-1)*100
# max drawdown in last 90d
peak = cl[0]; mdd = 0
for c in cl:
    peak = max(peak, c)
    mdd = min(mdd, (c/peak-1)*100)
out["max_drawdown_90d_pct"] = mdd
# distance to key levels
out["low_since_aug"] = min(b[3] for b in bars)
out["low_since_aug_date"] = min(bars, key=lambda b: b[3])[0]
out["high_since_aug"] = max(b[2] for b in bars)
out["high_since_aug_date"] = max(bars, key=lambda b: b[2])[0]
# ATR-ish 14d
trs = []
for i in range(1, len(bars)):
    tr = max(bars[i][2]-bars[i][3], abs(bars[i][2]-bars[i-1][4]), abs(bars[i][3]-bars[i-1][4]))
    trs.append(tr)
out["atr14"] = sum(trs[-14:])/14
out["atr14_pct"] = out["atr14"]/cl[-1]*100

# weekly trend structure
rw = p.get_history(PriceHistoryQuery(symbol="XAUUSD", interval="w", limit=30))
wb = [(b.date, b.close, b.high, b.low) for b in rw.bars]
out["weekly_last10"] = [{"d": b[0], "c": round(b[1],1)} for b in wb[-10:]]
# weekly consecutive down
wdn = 0
wc = [b[1] for b in wb]
for i in range(len(wc)-1, 0, -1):
    if wc[i] < wc[i-1]: wdn += 1
    else: break
out["consecutive_down_weeks"] = wdn

# confidence: what does 2026 look like
out["close_2025_12_regime"] = None
print(json.dumps(out, indent=1, default=str))
