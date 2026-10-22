from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
from nsb_engine import unpack_nsb, pack_nsb, pack_scb

BASE = os.path.dirname(os.path.abspath(__file__))

class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def _read_body(self) -> bytes:
        length = int(self.headers.get("Content-Length", 0))
        return self.rfile.read(length)

    def do_POST(self):
        if self.path == "/unpack":
            try:
                raw = self._read_body()
                json_text, version, trailing = unpack_nsb(raw)
                resp = json.dumps({
                    "success": True,
                    "json": json_text,
                    "version": version,
                    "trailing_hex": trailing.hex(),
                }).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self._cors()
                self.end_headers()
                self.wfile.write(resp)
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self._cors()
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode())

        elif self.path == "/pack":
            try:
                body = json.loads(self._read_body())
                json_text = body["json"]
                player_id = body.get("player_id", "")
                version = body.get("version", 2)
                trailing = bytes.fromhex(body.get("trailing_hex", ""))
                
                out = pack_nsb(json_text, player_id, version, trailing)
                
                self.send_response(200)
                self.send_header("Content-Type", "application/octet-stream")
                self.send_header("Content-Disposition", 'attachment; filename="modded.nsb"')
                self._cors()
                self.end_headers()
                self.wfile.write(out)
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self._cors()
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode())
                
        elif self.path == "/pack_scb":
            try:
                body = json.loads(self._read_body())
                json_text = body["json"]
                player_id = body.get("player_id", "")
                version = body.get("version", 6)
                
                out = pack_scb(json_text, player_id, version)
                
                self.send_response(200)
                self.send_header("Content-Type", "application/octet-stream")
                self.send_header("Content-Disposition", 'attachment; filename="scb"')
                self._cors()
                self.end_headers()
                self.wfile.write(out)
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self._cors()
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode())
        else:
            self.send_response(404)
            self._cors()
            self.end_headers()

    def do_GET(self):
        if self.path == "/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True}).encode())
        else:
            self.send_response(404)
            self._cors()
            self.end_headers()

if __name__ == "__main__":
    HTTPServer(("127.0.0.1", 8000), Handler).serve_forever()