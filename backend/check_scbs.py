import json, sys, os
sys.path.append(r"C:\Users\aaran\csr2\csr2-tool\backend")
from nsb_engine import unpack_nsb

paths = [
    r"C:\Users\aaran\csr2\backup\scb_check",
    r"C:\Users\aaran\csr2\backup\scb_matched",
    r"C:\Users\aaran\csr2\csr2-tool\backend\scb",
    r"C:\Users\aaran\csr2\csr2-tool\backend\scb_modded",
]
for p in paths:
    with open(p, "rb") as f:
        raw = f.read()
    j, v, t = unpack_nsb(raw)
    d = json.loads(j)
    print(p)
    print("  size:", len(raw))
    print("  CarsSecureData:", d.get("CarsSecureData"))
    print("  all keys:", list(d.keys()))
    print()
