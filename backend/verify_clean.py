import json
import os
from nsb_engine import unpack_nsb

CLEAN_DIR = r"C:\Users\aaran\csr2_clean"
CARS_FILE = os.path.join(CLEAN_DIR, "all_cars.txt")
NSB_FILE = os.path.join(CLEAN_DIR, "nsb_fresh")
SCB_FILE = os.path.join(CLEAN_DIR, "scb_fresh")

print("=== VERIFYING CLEAN FILES ===")

# 1. Verify all_cars.txt
print("\n--- Checking all_cars.txt ---")
try:
    content = open(CARS_FILE, 'r', encoding='utf-8').read()
    start = content.find('[')
    end = content.rfind(']')
    cars = json.loads(content[start:end+1])
    print(f"✅ Successfully parsed JSON.")
    print(f"✅ Total cars: {len(cars)}")
    print(f"✅ First item type: {type(cars[0])}")
    print(f"✅ First car sample: {cars[0].get('crdb', 'NO CRDB KEY')}")
except Exception as e:
    print(f"❌ Error: {e}")

# 2. Verify nsb_fresh
print("\n--- Checking nsb_fresh ---")
try:
    with open(NSB_FILE, 'rb') as f:
        raw = f.read()
    json_text, version, trailing = unpack_nsb(raw)
    nsb_data = json.loads(json_text)
    print(f"✅ Unpacked successfully. Version: {version}")
    print(f"✅ JSON Keys found: {len(nsb_data.keys())}")
    print(f"✅ Current car count in NSB: {len(nsb_data.get('caow', []))}")
except Exception as e:
    print(f"❌ Error: {e}")

# 3. Verify scb_fresh
print("\n--- Checking scb_fresh ---")
try:
    with open(SCB_FILE, 'rb') as f:
        raw = f.read()
    json_text, version, trailing = unpack_nsb(raw)
    scb_data = json.loads(json_text)
    print(f"✅ Unpacked successfully. Version: {version}")
    print(f"✅ JSON Keys found: {len(scb_data.keys())}")
except Exception as e:
    print(f"❌ Error: {e}")
