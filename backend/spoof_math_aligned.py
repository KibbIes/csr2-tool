import json, sys, os
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from nsb_engine import pack_nsb, unpack_nsb, pack_scb

PLAYER_ID = "95293904138"
NSB_IN  = r"C:\Users\aaran\Downloads\nsb_live"
SCB_IN  = r"C:\Users\aaran\Downloads\scb_live"
NSB_OUT = r"C:\Users\aaran\Downloads\nsb_modded"
SCB_OUT = r"C:\Users\aaran\Downloads\scb_modded"
CARS_FILE = r"C:\Users\aaran\csr2\web\public\all_cars.txt"

with open(NSB_IN, 'rb') as f: nsb_json, nsb_ver, nsb_trail = unpack_nsb(f.read())
with open(SCB_IN, 'rb') as f: scb_json, scb_ver, scb_trail = unpack_nsb(f.read())
nsb = json.loads(nsb_json); scb = json.loads(scb_json)
with open(CARS_FILE, 'r', encoding='utf-8') as f: cars = json.load(f)

# --- Cars ---
nsb['caow'] = cars

# --- Currencies we KNOW are safe (scalar, exist in fresh save) ---
nsb['caea'] = 999999999
nsb['casp'] = 0
nsb['goea'] = 999999
nsb['gosp'] = 0

nsb['gbke'] = 10000; nsb['gbks'] = 0
nsb['gske'] = 10000; nsb['gsks'] = 0
nsb['ggke'] = 10000; nsb['ggks'] = 0

nsb['afme'] = {'Green': 10000, 'Blue': 10000, 'Red': 10000, 'Yellow': 10000}
nsb['afms'] = {'Green': 0, 'Blue': 0, 'Red': 0, 'Yellow': 0}

# cpd is a dict; only set one key inside it
nsb.setdefault('cpd', {})['CollectionPoints'] = 50000

# --- Explicitly DO NOT touch: plrp, splr, agprlv, elt, eltc, hmpd ---

# --- Mirror only the safe fields to SCB ---
scb['CashEarned'] = nsb['caea']; scb['CashSpent'] = nsb['casp']
scb['GoldEarned'] = nsb['goea']; scb['GoldSpent'] = nsb['gosp']

scb['GachaBronzeKeysEarned'] = nsb['gbke']; scb['GachaBronzeKeysSpent'] = nsb['gbks']
scb['GachaSilverKeysEarned'] = nsb['gske']; scb['GachaSilverKeysSpent'] = nsb['gsks']
scb['GachaGoldKeysEarned']   = nsb['ggke']; scb['GachaGoldKeysSpent']   = nsb['ggks']

scb['AMPartGreenEarned']  = nsb['afme']['Green'];  scb['AMPartGreenSpent']  = nsb['afms']['Green']
scb['AMPartBlueEarned']   = nsb['afme']['Blue'];   scb['AMPartBlueSpent']   = nsb['afms']['Blue']
scb['AMPartRedEarned']    = nsb['afme']['Red'];    scb['AMPartRedSpent']    = nsb['afms']['Red']
scb['AMPartYellowEarned'] = nsb['afme']['Yellow']; scb['AMPartYellowSpent'] = nsb['afms']['Yellow']

# Explicitly DO NOT touch: FlexibleCurrenciesEarned, hmpd, HypermodsEarned

# --- JokerPartsData ledger so cars don't get stripped ---
crds = [c['crdb'] for c in nsb['caow']]
brands = {f"id_{c.split('_')[0].lower()}" for c in crds}
jp = scb.setdefault('JokerPartsData', {})
jp['JokerCarUpgradeStagesEarned'] = {c: 10000 for c in crds}
jp['JokerCarUpgradeStagesSpent']  = {c: 0     for c in crds}
jp['JokerFusionPartsEarned']      = {b: 10000 for b in sorted(brands)}
jp['JokerFusionPartsSpent']       = {b: 0     for b in sorted(brands)}
jp['JokerIconRestorationPartsEarned'] = 10000
jp['JokerIconRestorationPartsSpent']  = 0

with open(NSB_OUT, 'wb') as f:
    f.write(pack_nsb(json.dumps(nsb, separators=(',',':')), PLAYER_ID, nsb_ver, nsb_trail))
with open(SCB_OUT, 'wb') as f:
    f.write(pack_scb(json.dumps(scb, separators=(',',':')), PLAYER_ID, scb_ver))

print("NSB:", os.path.getsize(NSB_OUT), "bytes")
print("SCB:", os.path.getsize(SCB_OUT), "bytes")