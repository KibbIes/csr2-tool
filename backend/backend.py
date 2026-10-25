from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import json
import os
import base64
import io
import gzip
import hmac
import hashlib
from nsb_engine import unpack_nsb, pack_nsb, pack_scb

BASE = os.path.dirname(os.path.abspath(__file__))
CARS_FILE = os.path.join(BASE, "all_cars.txt")

CARS_CACHE = None

def get_cars():
    global CARS_CACHE
    if CARS_CACHE is not None:
        return CARS_CACHE

    if not os.path.exists(CARS_FILE):
        raise Exception(f"File not found at {CARS_FILE}")

    try:
        with open(CARS_FILE, 'r', encoding='utf-8') as f:
            content = f.read()

        start = content.find('[')
        end = content.rfind(']')
        if start != -1 and end != -1 and end > start:
            CARS_CACHE = json.loads(content[start:end+1])
        else:
            CARS_CACHE = json.loads(content)

        return CARS_CACHE
    except Exception as e:
        raise Exception(f"Error parsing all_cars.txt: {e}")

class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Offset")

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def _read_body(self) -> bytes:
        length = int(self.headers.get("Content-Length", 0))
        return self.rfile.read(length)

    def do_POST(self):
        try:
            if self.path == "/auto_mod":
                body = json.loads(self._read_body())
                nsb_b64 = body["nsb_b64"]
                scb_b64 = body["scb_b64"]
                player_id = body.get("player_id", "").strip()
                inject_cars = body.get("inject_cars", True)
                add_money = body.get("add_money", True)

                if not player_id:
                    raise ValueError("Player ID is empty.")

                nsb_raw = base64.b64decode(nsb_b64)
                scb_raw = base64.b64decode(scb_b64)

                nsb_json, nsb_ver, nsb_trail = unpack_nsb(nsb_raw)
                scb_json, scb_ver, scb_trail = unpack_nsb(scb_raw)

                nsb = json.loads(nsb_json)
                scb = json.loads(scb_json)

                cars = get_cars()

                if inject_cars and cars:
                    nsb['caow'] = cars
                    # Build the JokerPartsData ledger so the game accepts the cars
                    crds = [c['crdb'] for c in cars]
                    brands = {f"id_{c.split('_')[0].lower()}" for c in crds}
                    jp = scb.setdefault('JokerPartsData', {})
                    jp['JokerCarUpgradeStagesEarned'] = {c: 10000 for c in crds}
                    jp['JokerCarUpgradeStagesSpent']  = {c: 0   for c in crds}
                    jp['JokerFusionPartsEarned']      = {b: 10000 for b in sorted(brands)}
                    jp['JokerFusionPartsSpent']       = {b: 0   for b in sorted(brands)}
                    jp['JokerIconRestorationPartsEarned'] = 10000
                    jp['JokerIconRestorationPartsSpent']  = 0

                if add_money:
                    # Cash & Gold
                    nsb['caea'] = 999999999
                    nsb['casp'] = 0
                    nsb['goea'] = 999999
                    nsb['gosp'] = 0

                    # Keys (10k each)
                    nsb['gbke'] = 10000
                    nsb['gbks'] = 0
                    nsb['gske'] = 10000
                    nsb['gsks'] = 0
                    nsb['ggke'] = 10000
                    nsb['ggks'] = 0

                    # Fusion Parts (10k each)
                    nsb['afme'] = {'Green': 10000, 'Blue': 10000, 'Red': 10000, 'Yellow': 10000}
                    nsb['afms'] = {'Green': 0, 'Blue': 0, 'Red': 0, 'Yellow': 0}

                    # Collection Credits (50k)
                    nsb.setdefault('cpd', {})['CollectionPoints'] = 50000

                    # DO NOT TOUCH: plrp, splr, agprlv, elt, eltc, hmpd
                    # These fields cause NullReferenceExceptions if modified incorrectly.

                    # Mirror to SCB
                    scb['CashEarned'] = nsb['caea']; scb['CashSpent'] = nsb['casp']
                    scb['GoldEarned'] = nsb['goea']; scb['GoldSpent'] = nsb['gosp']
                    scb['GachaBronzeKeysEarned'] = nsb['gbke']; scb['GachaBronzeKeysSpent'] = nsb['gbks']
                    scb['GachaSilverKeysEarned'] = nsb['gske']; scb['GachaSilverKeysSpent'] = nsb['gsks']
                    scb['GachaGoldKeysEarned'] = nsb['ggke']; scb['GachaGoldKeysSpent'] = nsb['ggks']
                    scb['AMPartGreenEarned']  = nsb['afme']['Green'];  scb['AMPartGreenSpent']  = nsb['afms']['Green']
                    scb['AMPartBlueEarned']   = nsb['afme']['Blue'];   scb['AMPartBlueSpent']   = nsb['afms']['Blue']
                    scb['AMPartRedEarned']    = nsb['afme']['Red'];    scb['AMPartRedSpent']    = nsb['afms']['Red']
                    scb['AMPartYellowEarned'] = nsb['afme']['Yellow']; scb['AMPartYellowSpent'] = nsb['afms']['Yellow']

                new_nsb_bytes = pack_nsb(json.dumps(nsb, separators=(',',':')), player_id, nsb_ver, nsb_trail)
                new_scb_bytes = pack_scb(json.dumps(scb, separators=(',',':')), player_id, scb_ver)

                resp = json.dumps({
                    "success": True,
                    "nsb_b64": base64.b64encode(new_nsb_bytes).decode('utf-8'),
                    "scb_b64": base64.b64encode(new_scb_bytes).decode('utf-8')
                }).encode()

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self._cors()
                self.end_headers()
                self.wfile.write(resp)

            elif self.path == "/patch_so":
                so_bytes = bytearray(self._read_body())
                offset_str = self.headers.get("X-Offset", "0x378E0D8")
                offset = int(offset_str, 16)

                patch = b"\x00\x00\x80\x52\xC0\x03\x5F\xD6"
                if len(so_bytes) > offset + 8:
                    so_bytes[offset:offset+8] = patch
                else:
                    raise ValueError(f"File too small for offset {offset_str}")

                self.send_response(200)
                self.send_header("Content-Type", "application/octet-stream")
                self._cors()
                self.end_headers()
                self.wfile.write(so_bytes)
            else:
                self.send_response(404)
                self._cors()
                self.end_headers()
        except Exception as e:
            self._send_error(e)

    def _send_error(self, e: Exception):
        self.send_response(500)
        self.send_header("Content-Type", "application/json")
        self._cors()
        self.end_headers()
        self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode())

    def do_GET(self):
        if self.path == "/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True}).encode())

        elif self.path == "/download_standalone":
            try:
                with open(CARS_FILE, 'r', encoding='utf-8') as f:
                    content = f.read()
                start = content.find('[')
                end = content.rfind(']')
                raw_json = content[start:end+1].encode('utf-8')

                buf = io.BytesIO()
                with gzip.GzipFile(fileobj=buf, mode="wb", compresslevel=9) as gz:
                    gz.write(raw_json)
                b64_data = base64.b64encode(buf.getvalue()).decode('utf-8')

                standalone_script = '''import gzip
import io
import hmac
import hashlib
import json
import base64
import sys
import os

MAGIC_GZIP = b"\\\\x1f\\\\x8b"
def is_gzip(data): return data[:2] == MAGIC_GZIP
def extract_json_object(text):
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start: return text[start:end+1]
    return text
def generate_current_key(player_id, version):
    reversed_id = player_id[::-1]
    idx = version % len(reversed_id)
    return (reversed_id[idx:] + reversed_id[:idx]).encode('utf-8')
def unpack_nsb(raw):
    if not is_gzip(raw):
        return extract_json_object(raw.decode("utf-8", errors="ignore")), 0, b""
    bio = io.BytesIO(raw)
    with gzip.GzipFile(fileobj=bio, mode="rb") as gz: json_bytes = gz.read()
    trailing = bio.read()
    text = json_bytes.decode("utf-8", errors="ignore")
    lines = text.split('\\\\n', 1)
    version = 1
    if len(lines) == 2 and '-ver-' in lines[0]:
        try: version = int(lines[0].split('-ver-')[0])
        except: pass
        json_text = lines[1]
    else: json_text = text
    return extract_json_object(json_text), version, trailing
def pack_nsb(json_text, player_id, version, trailing=b""):
    json_bytes = json_text.encode('utf-8')
    key = generate_current_key(player_id, version)
    signature = hmac.new(key, json_bytes, hashlib.sha1).hexdigest()
    full_bytes = f"{version}-ver-{signature}\\\\n{json_text}".encode('utf-8')
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="wb", compresslevel=9) as gz: gz.write(full_bytes)
    return buf.getvalue() + trailing
def pack_scb(json_text, player_id, version): return pack_nsb(json_text, player_id, version, b"")

CARS_B64_GZ = "{b64_data}"
def get_cars():
    raw = gzip.decompress(base64.b64decode(CARS_B64_GZ))
    return json.loads(raw.decode('utf-8'))

def main():
    print("=== CSR2 Standalone Modder ===")
    print("This script will mod your nsb and scb files.")

    nsb_file = input("Enter path to nsb file (or drag & drop): ").strip('\\\\"\\\\' ')
    if not nsb_file: nsb_file = "nsb"

    scb_file = input("Enter path to scb file (or drag & drop): ").strip('\\\\"\\\\' ')
    if not scb_file: scb_file = "scb"

    player_id = input("Enter your Player ID: ").strip()

    try:
        with open(nsb_file, 'rb') as f: nsb_json, nsb_ver, nsb_trail = unpack_nsb(f.read())
        with open(scb_file, 'rb') as f: scb_json, scb_ver, scb_trail = unpack_nsb(f.read())
    except Exception as e:
        print(f"Error reading files: {e}"); return

    nsb = json.loads(nsb_json)
    scb = json.loads(scb_json)
    cars = get_cars()

    print(f"Loaded {len(cars)} cars from embedded database.")

    nsb['caow'] = cars
    crds = [c['crdb'] for c in cars]
    brands = {f"id_{c.split('_')[0].lower()}" for c in crds}
    jp = scb.setdefault('JokerPartsData', {})
    jp['JokerCarUpgradeStagesEarned'] = {c: 10000 for c in crds}
    jp['JokerCarUpgradeStagesSpent']  = {c: 0   for c in crds}
    jp['JokerFusionPartsEarned']      = {b: 10000 for b in sorted(brands)}
    jp['JokerFusionPartsSpent']       = {b: 0   for b in sorted(brands)}
    jp['JokerIconRestorationPartsEarned'] = 10000
    jp['JokerIconRestorationPartsSpent']  = 0

    nsb['caea'] = 999999999; nsb['casp'] = 0; nsb['goea'] = 999999; nsb['gosp'] = 0
    nsb['gbke'] = 10000; nsb['gbks'] = 0; nsb['gske'] = 10000; nsb['gsks'] = 0
    nsb['ggke'] = 10000; nsb['ggks'] = 0
    nsb['afme'] = {'Green': 10000, 'Blue': 10000, 'Red': 10000, 'Yellow': 10000}
    nsb['afms'] = {'Green': 0, 'Blue': 0, 'Red': 0, 'Yellow': 0}
    nsb.setdefault('cpd', {})['CollectionPoints'] = 50000
    
    # DO NOT TOUCH plrp, splr, agprlv, elt, eltc, hmpd

    scb['CashEarned'] = nsb['caea']; scb['CashSpent'] = nsb['casp']
    scb['GoldEarned'] = nsb['goea']; scb['GoldSpent'] = nsb['gosp']
    scb['GachaBronzeKeysEarned'] = nsb['gbke']; scb['GachaBronzeKeysSpent'] = nsb['gbks']
    scb['GachaSilverKeysEarned'] = nsb['gske']; scb['GachaSilverKeysSpent'] = nsb['gsks']
    scb['GachaGoldKeysEarned'] = nsb['ggke']; scb['GachaGoldKeysSpent'] = nsb['ggks']
    scb['AMPartGreenEarned'] = nsb['afme']['Green']; scb['AMPartGreenSpent'] = nsb['afms']['Green']
    scb['AMPartBlueEarned'] = nsb['afme']['Blue']; scb['AMPartBlueSpent'] = nsb['afms']['Blue']
    scb['AMPartRedEarned'] = nsb['afme']['Red']; scb['AMPartRedSpent'] = nsb['afms']['Red']
    scb['AMPartYellowEarned'] = nsb['afme']['Yellow']; scb['AMPartYellowSpent'] = nsb['afms']['Yellow']

    out_nsb = "nsb_modded"
    out_scb = "scb_modded"

    with open(out_nsb, 'wb') as f: f.write(pack_nsb(json.dumps(nsb, separators=(',',':')), player_id, nsb_ver, nsb_trail))
    with open(out_scb, 'wb') as f: f.write(pack_scb(json.dumps(scb, separators=(',',':')), player_id, scb_ver))

    print(f"\\nSuccess! Created {out_nsb} and {out_scb} in the current directory.")

if __name__ == "__main__":
    main()
'''
                script = standalone_script.replace("{b64_data}", b64_data)

                self.send_response(200)
                self.send_header("Content-Type", "text/x-python")
                self.send_header("Content-Disposition", 'attachment; filename="CSR2_Standalone_Modder.py"')
                self._cors()
                self.end_headers()
                self.wfile.write(script.encode('utf-8'))
            except Exception as e:
                self._send_error(e)
        else:
            self.send_response(404)
            self._cors()
            self.end_headers()

if __name__ == "__main__":
    print("Starting server on port 8000...")
    ThreadingHTTPServer(("127.0.0.1", 8000), Handler).serve_forever()