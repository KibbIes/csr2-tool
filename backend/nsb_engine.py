import gzip
import io
import hmac
import hashlib
import json

MAGIC_GZIP = b"\x1f\x8b"

def is_gzip(data: bytes) -> bool:
    return data[:2] == MAGIC_GZIP

def extract_json_object(text: str) -> str:
    # Brute force find the outer-most { } to ignore any trailing garbage
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        return text[start:end+1]
    return text

def generate_current_key(player_id: str, version: int) -> bytes:
    reversed_id = player_id[::-1]
    idx = version % len(reversed_id)
    rotated = reversed_id[idx:] + reversed_id[:idx]
    return rotated.encode('utf-8')

def unpack_nsb(raw: bytes):
    if not is_gzip(raw):
        text = raw.decode("utf-8", errors="ignore")
        trailing = b""
    else:
        bio = io.BytesIO(raw)
        with gzip.GzipFile(fileobj=bio, mode="rb") as gz:
            json_bytes = gz.read()
        trailing = bio.read()
        text = json_bytes.decode("utf-8", errors="ignore")

    lines = text.split('\n', 1)
    version = 1
    if len(lines) == 2 and '-ver-' in lines[0]:
        try:
            version = int(lines[0].split('-ver-')[0])
        except:
            pass
        json_text = lines[1]
    else:
        json_text = text

    # Clean the JSON to prevent "Extra data" errors
    json_text = extract_json_object(json_text)
    return json_text, version, trailing

def pack_nsb(json_text: str, player_id: str, version: int, trailing: bytes = b"") -> bytes:
    json_bytes = json_text.encode('utf-8')
    key = generate_current_key(player_id, version)
    signature = hmac.new(key, json_bytes, hashlib.sha1).hexdigest()
    full_text = f"{version}-ver-{signature}\n{json_text}"
    full_bytes = full_text.encode('utf-8')

    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="wb", compresslevel=9) as gz:
        gz.write(full_bytes)

    return buf.getvalue() + trailing

def pack_scb(json_text: str, player_id: str, version: int) -> bytes:
    return pack_nsb(json_text, player_id, version, b"")