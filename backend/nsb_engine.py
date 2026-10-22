import gzip
import io
import hmac
import hashlib
import json

MAGIC_GZIP = b"\x1f\x8b"

def is_gzip(data: bytes) -> bool:
    return data[:2] == MAGIC_GZIP

def generate_current_key(player_id: str, version: int) -> bytes:
    # Reverses the Player ID and rotates it based on the version number
    reversed_id = player_id[::-1]
    idx = version % len(reversed_id)
    rotated = reversed_id[idx:] + reversed_id[:idx]
    return rotated.encode('utf-8')

def unpack_nsb(raw: bytes):
    if not is_gzip(raw):
        return raw.decode("utf-8"), 0, b""

    bio = io.BytesIO(raw)
    with gzip.GzipFile(fileobj=bio, mode="rb") as gz:
        json_bytes = gz.read()
    trailing = bio.read()

    text = json_bytes.decode("utf-8")
    lines = text.split('\n', 1)
    
    version = 1 # Default fallback
    if len(lines) == 2 and '-ver-' in lines[0]:
        # Extract the version number from the header (e.g., "2-ver-hash" -> 2)
        try:
            version = int(lines[0].split('-ver-')[0])
        except:
            pass
        json_text = lines[1]
    else:
        json_text = text

    return json_text, version, trailing

def pack_nsb(json_text: str, player_id: str, version: int, trailing: bytes = b"") -> bytes:
    json_bytes = json_text.encode('utf-8')
    
    # Generate the exact dynamic key
    key = generate_current_key(player_id, version)
    
    # Calculate HMAC-SHA1
    signature = hmac.new(key, json_bytes, hashlib.sha1).hexdigest()
    
    # Construct the full file content
    full_text = f"{version}-ver-{signature}\n{json_text}"
    full_bytes = full_text.encode('utf-8')

    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="wb", compresslevel=9) as gz:
        gz.write(full_bytes)

    gz_bytes = buf.getvalue()
    return gz_bytes + trailing