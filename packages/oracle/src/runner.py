#!/usr/bin/env python3
"""dsh-mywork-oracle — Python side of the Digital Oracle tools.

Modes (argv[1]):
  status    -> {"python", "yfinance", "providers", "version"}
  describe  -> every provider, its public methods, their parameters and query-dataclass fields
  call      -> stdin {"calls": [{"id", "provider", "method", "args"}]} ; calls run in parallel
               -> {"results": {id: value}, "errors": {id: message}}

Values are plain JSON: dataclasses become objects (fields + @property values such as
yes_probability / spread / atm_iv; `raw` payload fields are dropped), datetimes become ISO strings,
NaN becomes null.
Only the vendored digital-oracle package is imported; nothing is written to disk.
"""
import concurrent.futures
import dataclasses
import datetime
import decimal
import inspect
import json
import math
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
VENDOR = os.path.join(os.path.dirname(HERE), "digital-oracle")
sys.path.insert(0, VENDOR)

import digital_oracle as do  # noqa: E402
from digital_oracle.providers.base import SignalProvider  # noqa: E402


def registry():
    out = {}
    for name in do.__all__:
        obj = getattr(do, name, None)
        if inspect.isclass(obj) and issubclass(obj, SignalProvider) and obj is not SignalProvider:
            out[name] = obj
    return out


def skill_version():
    try:
        with open(os.path.join(VENDOR, "SKILL.md"), encoding="utf-8") as f:
            head = f.read(2000)
        m = re.search(r"^version:\s*([^\n]+)", head, re.M)
        return m.group(1).strip() if m else None
    except OSError:
        return None


def to_json(v, depth=0):
    if depth > 14:
        return str(v)
    if v is None or isinstance(v, (bool, int, str)):
        return v
    if isinstance(v, float):
        return None if (math.isnan(v) or math.isinf(v)) else v
    if isinstance(v, (datetime.datetime, datetime.date, datetime.time)):
        return v.isoformat()
    if isinstance(v, decimal.Decimal):
        return float(v)
    if dataclasses.is_dataclass(v) and not isinstance(v, type):
        out = {}
        for f in dataclasses.fields(v):
            if f.name == "raw" or f.name.startswith("raw_"):
                continue  # the untouched upstream API payload: hundreds of KB per Polymarket event, no signal in it
            out[f.name] = to_json(getattr(v, f.name), depth + 1)
        for name, attr in inspect.getmembers(type(v)):
            if isinstance(attr, property) and not name.startswith("_"):
                try:
                    out[name] = to_json(getattr(v, name), depth + 1)
                except Exception:  # a derived value that cannot be computed is simply absent
                    pass
        return out
    if isinstance(v, dict):
        return {str(k): to_json(x, depth + 1) for k, x in v.items()}
    if isinstance(v, (list, tuple, set, frozenset)):
        return [to_json(x, depth + 1) for x in v]
    if hasattr(v, "__dict__"):
        return {k: to_json(x, depth + 1) for k, x in vars(v).items() if not k.startswith("_")}
    return str(v)


def annotation_names(ann):
    if ann is inspect.Parameter.empty:
        return []
    if isinstance(ann, str):
        return [t.strip() for t in ann.split("|")]
    return [getattr(ann, "__name__", str(ann))]


def query_class(ann):
    for token in annotation_names(ann):
        cls = getattr(do, token, None)
        if inspect.isclass(cls) and dataclasses.is_dataclass(cls):
            return cls
    return None


def field_info(cls):
    out = []
    for f in dataclasses.fields(cls):
        d = None
        if f.default is not dataclasses.MISSING:
            d = to_json(f.default)
        elif f.default_factory is not dataclasses.MISSING:  # type: ignore[misc]
            try:
                d = to_json(f.default_factory())  # type: ignore[misc]
            except Exception:
                d = None
        out.append({"name": f.name, "type": str(f.type), "default": d, "required": f.default is dataclasses.MISSING and f.default_factory is dataclasses.MISSING})  # type: ignore[misc]
    return out


def describe(only=None):
    out = []
    for name, cls in sorted(registry().items()):
        if only and name != only:
            continue
        methods = []
        for mname, fn in inspect.getmembers(cls, predicate=inspect.isfunction):
            if mname.startswith("_") or mname == "describe":
                continue
            try:
                sig = inspect.signature(fn)
            except (TypeError, ValueError):
                continue
            params = []
            for p in list(sig.parameters.values())[1:]:
                q = query_class(p.annotation)
                params.append({
                    "name": p.name,
                    "type": " | ".join(annotation_names(p.annotation)) or "any",
                    "default": None if p.default is inspect.Parameter.empty else to_json(p.default),
                    "required": p.default is inspect.Parameter.empty,
                    **({"query": q.__name__, "fields": field_info(q)} if q else {}),
                })
            doc = (fn.__doc__ or "").strip().splitlines()
            methods.append({"name": mname, "params": params, "doc": doc[0] if doc else ""})
        out.append({
            "name": name,
            "provider_id": getattr(cls, "provider_id", None),
            "display_name": getattr(cls, "display_name", None),
            "capabilities": list(getattr(cls, "capabilities", ()) or ()),
            "methods": methods,
        })
    return out


_instances = {}


def instance(name):
    if name not in _instances:
        cls = registry().get(name)
        if cls is None:
            raise ValueError("unknown provider %r; known: %s" % (name, ", ".join(sorted(registry()))))
        _instances[name] = cls()
    return _instances[name]


def coerce_field(f, value):
    t = str(f.type)
    if isinstance(value, list) and t.startswith("tuple"):
        return tuple(value)
    if isinstance(value, str) and t.startswith("int") and re.fullmatch(r"-?\d+", value):
        return int(value)
    if isinstance(value, str) and t.startswith("float") and re.fullmatch(r"-?\d+(\.\d+)?", value):
        return float(value)
    return value


def build_query(qcls, data):
    fields = {f.name: f for f in dataclasses.fields(qcls)}
    unknown = [k for k in data if k not in fields]
    if unknown:
        raise ValueError("%s has no field(s) %s; fields: %s" % (qcls.__name__, ", ".join(unknown), ", ".join(fields)))
    return qcls(**{k: coerce_field(fields[k], v) for k, v in data.items()})


def call_one(provider, method, args):
    inst = instance(provider)
    if not method or method.startswith("_") or not hasattr(inst, method) or not callable(getattr(inst, method)):
        names = [m for m, _ in inspect.getmembers(type(inst), predicate=inspect.isfunction) if not m.startswith("_") and m != "describe"]
        raise ValueError("unknown method %r on %s; methods: %s" % (method, provider, ", ".join(names)))
    fn = getattr(inst, method)
    sig = inspect.signature(fn)
    params = list(sig.parameters.values())
    args = dict(args or {})
    kwargs = {}
    if params:
        p0 = params[0]
        qcls = query_class(p0.annotation)
        if qcls is not None:
            if p0.name in args and not isinstance(args[p0.name], dict):
                kwargs[p0.name] = args.pop(p0.name)  # e.g. WebSearchProvider.search("vix")
            elif p0.name in args:
                kwargs[p0.name] = build_query(qcls, args.pop(p0.name))
            else:
                names = {f.name for f in dataclasses.fields(qcls)}
                picked = {k: args.pop(k) for k in list(args) if k in names}
                if picked or p0.default is inspect.Parameter.empty:
                    kwargs[p0.name] = build_query(qcls, picked)
    qcls = query_class(params[0].annotation) if params else None
    for k, v in args.items():
        if k not in sig.parameters:
            hint = ", ".join(p.name for p in params)
            if qcls is not None:
                hint += "; fields of %s: %s" % (qcls.__name__, ", ".join(f.name for f in dataclasses.fields(qcls)))
            raise ValueError("%s.%s does not take %r; parameters: %s" % (provider, method, k, hint))
        kwargs[k] = v
    return fn(**kwargs)


def run_calls(calls):
    results, errors = {}, {}
    if not calls:
        return {"results": results, "errors": errors}

    def work(c):
        try:
            return to_json(call_one(str(c.get("provider", "")), str(c.get("method", "")), c.get("args") or {}))
        except Exception as e:  # provider errors are reported per call, never abort the batch
            raise RuntimeError("%s: %s" % (type(e).__name__, e))

    with concurrent.futures.ThreadPoolExecutor(max_workers=min(8, len(calls))) as ex:
        futs = {}
        for i, c in enumerate(calls):
            cid = str(c.get("id") or ("%s.%s" % (c.get("provider"), c.get("method"))) or i)
            if cid in futs:
                cid = "%s#%d" % (cid, i)
            futs[cid] = ex.submit(work, c)
        for cid, fut in futs.items():
            try:
                results[cid] = fut.result()
            except Exception as e:
                errors[cid] = str(e)
    return {"results": results, "errors": errors}


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "status"
    if mode == "status":
        try:
            import yfinance  # noqa: F401
            yf = True
        except Exception:
            yf = False
        out = {"python": sys.version.split()[0], "executable": sys.executable, "yfinance": yf, "providers": sorted(registry()), "version": skill_version(), "root": VENDOR}
    elif mode == "describe":
        out = describe(sys.argv[2] if len(sys.argv) > 2 else None)
    elif mode == "call":
        payload = json.loads(sys.stdin.read() or "{}")
        out = run_calls(payload.get("calls") or [])
    else:
        raise SystemExit("unknown mode " + mode)
    sys.stdout.write(json.dumps(out, ensure_ascii=False))
    sys.stdout.flush()


if __name__ == "__main__":
    main()
