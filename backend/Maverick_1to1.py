import gzip
import io
import hmac
import hashlib
import json
import os
import sys

# --- 1:1 ENGINE DEFINITIONS ---
MAGIC_GZIP = b"\x1f\x8b"

def is_gzip(data: bytes) -> bool:
    return data[:2] == MAGIC_GZIP

def extract_json_object(text: str) -> str:
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start: return text[start:end+1]
    return text

def generate_current_key(player_id: str, version: int) -> bytes:
    reversed_id = player_id[::-1]
    idx = version % len(reversed_id)
    return (reversed_id[idx:] + reversed_id[:idx]).encode('utf-8')

def unpack_nsb(raw: bytes):
    if not is_gzip(raw):
        return extract_json_object(raw.decode("utf-8", errors="ignore")), 0, b""
    bio = io.BytesIO(raw)
    with gzip.GzipFile(fileobj=bio, mode="rb") as gz: json_bytes = gz.read()
    trailing = bio.read()
    text = json_bytes.decode("utf-8", errors="ignore")
    lines = text.split('\n', 1)
    version = 1
    if len(lines) == 2 and '-ver-' in lines[0]:
        try: version = int(lines[0].split('-ver-')[0])
        except: pass
        json_text = lines[1]
    else: json_text = text
    return extract_json_object(json_text), version, trailing

def pack_nsb(json_text: str, player_id: str, version: int, trailing: bytes = b"") -> bytes:
    json_bytes = json_text.encode('utf-8')
    key = generate_current_key(player_id, version)
    signature = hmac.new(key, json_bytes, hashlib.sha1).hexdigest()
    full_bytes = f"{version}-ver-{signature}\n{json_text}".encode('utf-8')
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="wb", compresslevel=9) as gz: gz.write(full_bytes)
    return buf.getvalue() + trailing

def pack_scb(json_text: str, player_id: str, version: int) -> bytes:
    return pack_nsb(json_text, player_id, version, b"")

def recursive_nuke(data):
    nuked = 0
    if isinstance(data, dict):
        for k, v in data.items():
            k_lower = k.lower()
            if 'tut' in k_lower or 'ftue' in k_lower or 'step' in k_lower:
                if isinstance(v, bool): data[k] = True; nuked += 1
                elif isinstance(v, int): data[k] = 9999; nuked += 1
            else: nuked += recursive_nuke(v)
    elif isinstance(data, list):
        for item in data: nuked += recursive_nuke(item)
    return nuked

# --- MAIN SCRIPT ---
def main():
    print("=== CSR2 1:1 MAVERICK MODDER ===")
    print("Ensure 'all_cars.txt' is in this folder.")
    
    if not os.path.exists("all_cars.txt"):
        print("ERROR: all_cars.txt not found in the current directory!")
        sys.exit(1)

    # 1. Load all cars
    print("Loading car database...")
    with open("all_cars.txt", "r", encoding="utf-8") as f:
        content = f.read()
    start = content.find('[')
    end = content.rfind(']')
    cars = json.loads(content[start:end+1])
    print(f"Loaded {len(cars)} cars.")

    # 2. Get User Input
    nsb_file = input("\nEnter path to pulled nsb file (or drag & drop): ").strip('\"\' ')
    scb_file = input("Enter path to pulled scb file (or drag & drop): ").strip('\"\' ')
    player_id = input("Enter your Player ID: ").strip()

    try:
        with open(nsb_file, 'rb') as f: nsb_json, nsb_ver, nsb_trail = unpack_nsb(f.read())
        with open(scb_file, 'rb') as f: scb_json, scb_ver, scb_trail = unpack_nsb(f.read())
    except Exception as e:
        print(f"Error reading files: {e}"); return

    nsb = json.loads(nsb_json)
    scb = json.loads(scb_json)

    # 3. Apply Mods
    print("\nInjecting cars & maxing stats...")
    nsb['caow'] = cars
    recursive_nuke(nsb)
    
    nsb['caea'] = 999999999; nsb['casp'] = 0; nsb['goea'] = 999999; nsb['gosp'] = 0
    nsb['gbke'] = 9999; nsb['gbks'] = 0; nsb['gske'] = 9999; nsb['gsks'] = 0
    nsb['ggke'] = 9999; nsb['ggks'] = 0
    nsb['afme'] = {'Green': 9999, 'Blue': 9999, 'Red': 9999, 'Yellow': 9999}
    nsb['afms'] = {'Green': 0, 'Blue': 0, 'Red': 0, 'Yellow': 0}
    nsb['plrp'] = 999999999; nsb['splr'] = 999999
    nsb.setdefault('cpd', {})['CollectionPoints'] = 999999

    # Sync SCB
    scb['CashEarned'] = nsb['caea']; scb['CashSpent'] = nsb['casp']
    scb['GoldEarned'] = nsb['goea']; scb['GoldSpent'] = nsb['gosp']
    scb['GachaBronzeKeysEarned'] = nsb['gbke']; scb['GachaBronzeKeysSpent'] = nsb['gbks']
    scb['GachaSilverKeysEarned'] = nsb['gske']; scb['GachaSilverKeysSpent'] = nsb['gsks']
    scb['GachaGoldKeysEarned'] = nsb['ggke']; scb['GachaGoldKeysSpent'] = nsb['ggks']
    scb['RP'] = nsb['plrp']; scb['RacesInCrewEarned'] = nsb['splr']; scb['RacesInCrewSpent'] = 0
    scb['AMPartGreenEarned'] = nsb['afme']['Green']; scb['AMPartGreenSpent'] = nsb['afms']['Green']
    scb['AMPartBlueEarned'] = nsb['afme']['Blue']; scb['AMPartBlueSpent'] = nsb['afms']['Blue']
    scb['AMPartRedEarned'] = nsb['afme']['Red']; scb['AMPartRedSpent'] = nsb['afms']['Red']
    scb['AMPartYellowEarned'] = nsb['afme']['Yellow']; scb['AMPartYellowSpent'] = nsb['afms']['Yellow']

    for key in scb.keys():
        if 'car' in key.lower() or 'caow' in key.lower() or 'owned' in key.lower():
            if isinstance(scb[key], int): scb[key] = len(cars)
            elif isinstance(scb[key], list): scb[key] = cars

    # 4. Pack Output
    print("Packing files...")
    out_nsb = "nsb_modded"
    out_scb = "scb_modded"
    
    with open(out_nsb, 'wb') as f: f.write(pack_nsb(json.dumps(nsb, separators=(',',':')), player_id, nsb_ver, nsb_trail))
    with open(out_scb, 'wb') as f: f.write(pack_scb(json.dumps(scb, separators=(',',':')), player_id, scb_ver))

    print(f"\n✅ Success! Generated {out_nsb} and {out_scb} in this folder.")
    
    # 5. Print 1:1 Injection Instructions
    print("\n" + "="*50)
    print("=== NEXT STEPS (COPY & PASTE) ===")
    print("="*50)
    print("1. Force stop the game and DELETE the pp folder so it doesn't make a second save.")
    print("2. Push the modded files into the 'temp' folder ONLY.")
    print("3. Launch the game and click 'Local Save'.")
    print("\nHere are your exact commands:\n")
    
    print(f'$adb = "C:\\Program Files\\Google\\Play Games Developer Emulator\\current\\emulator\\adb.exe"')
    print(f'$pkg = "/sdcard/Android/data/com.naturalmotion.customstreetracer2/files"')
    print(f'$id = "{player_id}"')
    print('')
    print('& $adb shell "am force-stop com.naturalmotion.customstreetracer2"')
    print('& $adb shell "su -c \'rm -rf $pkg/pp\'"')
    print('')
    print(f'& $adb push "C:\\Users\\aaran\\Downloads\\csr2-tool\\backend\\{out_nsb}" /sdcard/nsb_new')
    print(f'& $adb push "C:\\Users\\aaran\\Downloads\\csr2-tool\\backend\\{out_scb}" /sdcard/scb_new')
    print('')
    print('& $adb shell "su -c \'mkdir -p $pkg/pp/temp\'"')
    print('& $adb shell "su -c \'cp /sdcard/nsb_new $pkg/pp/temp/nsb\'"')
    print('& $adb shell "su -c \'cp /sdcard/scb_new $pkg/pp/temp/scb\'"')
    print('')
    print('& $adb shell "su -c \'chown -R 10054:10054 $pkg/pp\'"')
    print('& $adb shell "su -c \'chmod -R 777 $pkg/pp\'"')
    print('='*50)

if __name__ == "__main__":
    main()