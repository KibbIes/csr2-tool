import json, sys
sys.path.append(r"C:\Users\aaran\csr2\csr2-tool\backend")
from nsb_engine import unpack_nsb

for label, path in (("NSB", r"C:\Users\aaran\csr2\backup\nsb_check"),
                    ("SCB", r"C:\Users\aaran\csr2\backup\scb_check")):
    with open(path, 'rb') as f:
        raw = f.read()
    print(f"\n=== {label} ({len(raw)} bytes) ===")
    j, v, t = unpack_nsb(raw)
    d = json.loads(j)
    if label == "NSB":
        print(f"tutr = {d.get('tutr')!r}")
        print(f"caow length = {len(d.get('caow', []))}")
        print(f"top-level keys (first 25): {list(d.keys())[:25]}")
    else:
        print(f"scb keys: {list(d.keys())}")
        for k, val in d.items():
            if any(x in k.lower() for x in ('car', 'caow', 'owned')):
                print(f"  car-ish: {k} = {val if not isinstance(val, list) else f'list[{len(val)}]'}")