import sys, json, math
sys.path.insert(0, "/Volumes/KESU/deepseek_harness_projects/Mywork_deepseekharness/packages/oracle/digital-oracle")
from digital_oracle import StooqProvider, PriceHistoryQuery, YFinanceProvider, OptionsChainQuery

out = {}

# --- gold monthly, correct dating ---
p = StooqProvider()
r = p.get_history(PriceHistoryQuery(symbol="XAUUSD", interval="m", limit=40))
out["gold_monthly"] = [{"d": b.date, "c": b.close} for b in r.bars]
r2 = p.get_history(PriceHistoryQuery(symbol="XAUUSD", interval="w", limit=70))
out["gold_weekly_all"] = [{"d": b.date, "c": b.close, "h": b.high, "l": b.low} for b in r2.bars]

# --- options chain analysis ---
yf = YFinanceProvider()

def analyze(chain):
    und = chain.underlying_price
    calls = [c for c in chain.calls if c.mid and c.mid > 0 and c.implied_volatility and 0.02 < c.implied_volatility < 1.5]
    puts = [c for c in chain.puts if c.mid and c.mid > 0 and c.implied_volatility and 0.02 < c.implied_volatility < 1.5]
    res = {"underlying": und, "expiration": chain.expiration, "atm_iv": chain.atm_iv,
           "atm_strike": chain.atm_strike,
           "pc_oi": chain.put_call_oi_ratio, "pc_vol": chain.put_call_volume_ratio,
           "total_oi": chain.total_open_interest, "total_volume": chain.total_volume}
    def nearest(rows, target_delta):
        best = None
        for c in rows:
            if not c.greeks: continue
            d = abs(abs(c.greeks.delta) - target_delta)
            if best is None or d < best[0]:
                best = (d, c)
        return best[1] if best else None
    c25 = nearest(calls, 0.25); p25 = nearest(puts, 0.25)
    c10 = nearest(calls, 0.10); p10 = nearest(puts, 0.10)
    def pack(c):
        if not c: return None
        return {"strike": c.strike, "iv": c.implied_volatility, "delta": c.greeks.delta,
                "oi": c.open_interest, "vol": c.volume, "mid": c.mid}
    res["call25"] = pack(c25); res["put25"] = pack(p25)
    res["call10"] = pack(c10); res["put10"] = pack(p10)
    if c25 and p25:
        res["rr25_put_minus_call_iv"] = p25.implied_volatility - c25.implied_volatility
        res["skew_ratio_25d"] = p25.implied_volatility / c25.implied_volatility
    if c10 and p10:
        res["rr10_put_minus_call_iv"] = p10.implied_volatility - c10.implied_volatility
    # max pain across all strikes
    strikes = sorted(set([c.strike for c in chain.calls] + [c.strike for c in chain.puts]))
    def pain(k):
        tot = 0
        for c in chain.calls:
            if c.open_interest and k > c.strike: tot += (k - c.strike) * c.open_interest
        for pp in chain.puts:
            if pp.open_interest and k < pp.strike: tot += (pp.strike - k) * pp.open_interest
        return tot
    try:
        res["max_pain"] = min(strikes, key=pain)
    except Exception as e:
        res["max_pain"] = None
    # implied move from straddle
    if chain.atm_call and chain.atm_put:
        st = chain.atm_call.mid + chain.atm_put.mid
        res["atm_straddle"] = st
        res["implied_move_pct"] = st / und * 100
    # IV by strike smile near money
    res["smile"] = [{"k": c.strike, "civ": c.implied_volatility, "coi": c.open_interest} for c in sorted(chain.calls, key=lambda x: x.strike) if abs(c.strike/und - 1) < 0.12]
    res["smile_puts"] = [{"k": c.strike, "piv": c.implied_volatility, "poi": c.open_interest} for c in sorted(chain.puts, key=lambda x: x.strike) if abs(c.strike/und - 1) < 0.12]
    return res

for exp in ["2026-12-18", "2027-01-15", "2027-03-19", "2026-10-16"]:
    try:
        ch = yf.get_chain(OptionsChainQuery(ticker="GLD", expiration=exp, compute_greeks=True))
        out["chain_" + exp] = analyze(ch)
    except Exception as e:
        out["chain_" + exp] = {"error": str(e)}

print(json.dumps(out, indent=1, default=str))
