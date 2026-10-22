/** CSR2 profile container used by the Python packer (gzip + sealed JSON). */

export const HASH_KEY = "4cPw3ZyC";
export const DEFAULT_VERSION = "6.8.0";

/** Product-version stamps the client compares against the installed build. */
export const VERSION_KEYS = ["prvr", "adbpvr", "racv"] as const;

export type SealKind = "hmac-sha1" | "sha1-prefix" | "sha1-suffix";

export type VersionHit = {
  key: string;
  from: string;
  to: string;
  changed: boolean;
};

export type WriteExtras = {
  /** Raw all_cars.txt. Omit to leave the garage alone. */
  carsText?: string | null;
  /** When set, replaces agprlv. Omit to leave the level alone. */
  level?: number | null;
};

export type NsbInspection = {
  /** Display name when the profile has one. Never leaves the browser. */
  name: string | null;
  compressed: boolean;
  hadSeal: boolean;
  /** Seal style that matched the bytes on the way in. Null if none matched. */
  incomingSeal: SealKind | null;
  /** Seal written on the way out. */
  outgoingSeal: SealKind;
  versions: VersionHit[];
  patched: boolean;
  notes: string[];
  packed: Uint8Array;
  jsonText: string;
  carCount: number | null;
  levelFrom: string | null;
  levelTo: number | null;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: true });

function asBlob(bytes: Uint8Array): Blob {
  const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([copy]);
}

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha1Hex(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(HASH_KEY),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, textEncoder.encode(message));
  return hex(sig);
}

async function sha1Hex(message: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-1", textEncoder.encode(message));
  return hex(digest);
}

async function sealMessage(kind: SealKind, message: string): Promise<string> {
  if (kind === "hmac-sha1") return hmacSha1Hex(message);
  if (kind === "sha1-prefix") return sha1Hex(HASH_KEY + message);
  return sha1Hex(message + HASH_KEY);
}

export async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  if (bytes.length < 2 || bytes[0] !== 0x1f || bytes[1] !== 0x8b) {
    throw new Error("Not a gzip archive.");
  }
  const stream = asBlob(bytes).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function gzipHeader(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

export async function gzipBytes(payload: Uint8Array): Promise<Uint8Array> {
  const stream = asBlob(payload).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

type Opened = {
  compressed: boolean;
  hadSeal: boolean;
  hash: string | null;
  /** Exact JSON text the seal covers. */
  body: string;
};

function scanBracket(text: string, openAt: number, open: string, close: string): number {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = openAt; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  throw new Error("The profile JSON is cut off.");
}

/** Same entry point as write_nsb.py: first `{`, then one JSON value. */
export function sliceJsonObject(text: string): string {
  const start = text.indexOf("{");
  if (start < 0) throw new Error("No JSON object in this file.");
  const end = scanBracket(text, start, "{", "}");
  return text.slice(start, end);
}

function insertBeforeClose(json: string, field: string): string {
  const end = json.lastIndexOf("}");
  if (end < 0) throw new Error("The profile JSON is cut off.");
  const inner = json.slice(1, end).trim();
  return json.slice(0, end) + (inner.length > 0 ? "," : "") + field + json.slice(end);
}

/**
 * all_cars.txt is a loose list of objects, often missing commas.
 * Objects are copied through as text so large ids are not re-typed.
 */
export function parseCarList(text: string): string[] {
  let source = text.replace(/\}\s*\n(\s*)\{/g, "},\n$1{");
  source = source.replace(/,\s*\]/g, "\n]");
  const cars: string[] = [];
  let i = 0;
  while (i < source.length) {
    while (i < source.length && " \t\n\r,".includes(source[i] ?? "")) i++;
    if (i >= source.length) break;
    if (source[i] !== "{") {
      const next = source.indexOf("{", i);
      if (next < 0) break;
      i = next;
      continue;
    }
    try {
      const end = scanBracket(source, i, "{", "}");
      cars.push(source.slice(i, end).trim());
      i = end;
    } catch {
      const next = source.indexOf("{", i + 1);
      if (next < 0) break;
      i = next;
    }
  }
  return cars;
}

function replaceCaow(body: string, cars: string[]): string {
  const array = `[${cars.join(",")}]`;
  const mark = body.match(/"caow"\s*:\s*/);
  if (!mark || mark.index == null) return insertBeforeClose(body, `"caow":${array}`);
  const valueAt = mark.index + mark[0].length;
  if (body[valueAt] !== "[") throw new Error("The caow field is not a list.");
  const end = scanBracket(body, valueAt, "[", "]");
  return body.slice(0, valueAt) + array + body.slice(end);
}

function replaceLevel(body: string, level: number): { body: string; from: string | null } {
  const mark = body.match(/"agprlv"\s*:\s*(-?\d+(?:\.\d+)?)/);
  if (!mark || mark.index == null) {
    return { body: insertBeforeClose(body, `"agprlv":${level}`), from: null };
  }
  const from = mark[1] ?? null;
  return {
    body: body.slice(0, mark.index) + `"agprlv":${level}` + body.slice(mark.index + mark[0].length),
    from,
  };
}

/**
 * Open either a packed profile (gzip, seal line, JSON) or the .txt the
 * Python tool writes after unpack. Anything after the seal line is kept —
 * the old script only read line 2, so a profile that isn't one line never loaded.
 */
export async function openProfile(bytes: Uint8Array): Promise<Opened> {
  let compressed = false;
  let raw: Uint8Array = bytes;
  if (gzipHeader(bytes)) {
    compressed = true;
    try {
      raw = await gunzip(bytes);
    } catch {
      throw new Error("This gzip archive couldn't be opened. It may be truncated.");
    }
  }

  let text: string;
  try {
    text = textDecoder.decode(raw);
  } catch {
    throw new Error("The file isn't UTF-8 text after decompression. This isn't the Python profile format.");
  }

  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const nl = text.indexOf("\n");
  const first = (nl === -1 ? text : text.slice(0, nl)).trim();
  if (/^[0-9a-fA-F]{40}$/.test(first)) {
    let body = nl === -1 ? "" : text.slice(nl + 1);
    if (body.endsWith("\n")) body = body.slice(0, -1);
    return { compressed, hadSeal: true, hash: first.toLowerCase(), body };
  }

  if (text.includes("{")) {
    return { compressed, hadSeal: false, hash: null, body: text.endsWith("\n") ? text.slice(0, -1) : text };
  }

  throw new Error(
    "No JSON profile in this file. Expected a packed NSB (gzip) or the unpacked .txt from the Python tool.",
  );
}

const versionField = /("(?:prvr|adbpvr|racv)")(\s*:\s*)"([^"\\]*)"/g;

export function patchVersionFields(body: string, version: string): { body: string; hits: VersionHit[] } {
  const hits: VersionHit[] = [];
  const next = body.replace(versionField, (full, keyQuoted: string, sep: string, value: string) => {
    const key = keyQuoted.slice(1, -1);
    const changed = value !== version;
    hits.push({ key, from: value, to: version, changed });
    if (!changed) return full;
    return `${keyQuoted}${sep}"${version}"`;
  });
  return { body: next, hits };
}

function readName(body: string): string | null {
  const match = body.match(/"name"\s*:\s*"([^"\\]{1,40})"/);
  return match ? match[1] : null;
}

async function detectSeal(hash: string | null, body: string): Promise<SealKind | null> {
  if (!hash) return null;
  const kinds: SealKind[] = ["hmac-sha1", "sha1-prefix", "sha1-suffix"];
  for (const kind of kinds) {
    if ((await sealMessage(kind, body)) === hash) return kind;
  }
  return null;
}

export async function repack(body: string, seal: SealKind): Promise<Uint8Array> {
  const hash = await sealMessage(seal, body);
  const payload = textEncoder.encode(`${hash}\n${body}`);
  return gzipBytes(payload);
}

export async function setProfileVersion(
  bytes: Uint8Array,
  version: string,
  extras?: WriteExtras,
): Promise<NsbInspection> {
  const trimmed = version.trim();
  if (!/^\d+\.\d+\.\d+$/.test(trimmed)) {
    throw new Error("Version has to look like 6.8.0.");
  }
  if (extras?.level != null && (!Number.isInteger(extras.level) || extras.level < 0)) {
    throw new Error("Level has to be a whole number.");
  }

  const opened = await openProfile(bytes);
  let body = sliceJsonObject(opened.body);
  const incomingSeal = await detectSeal(opened.hash, body);
  const patched = patchVersionFields(body, trimmed);
  body = patched.body;
  const hits = patched.hits;
  const present = new Set(hits.map((hit) => hit.key));
  const missing = VERSION_KEYS.filter((key) => !present.has(key));
  if (missing.length > 0) {
    body = insertBeforeClose(body, missing.map((key) => `"${key}":"${trimmed}"`).join(","));
    for (const key of missing) hits.push({ key, from: "(missing)", to: trimmed, changed: true });
  }

  const notes: string[] = [];
  let carCount: number | null = null;
  if (extras?.carsText != null) {
    const cars = parseCarList(extras.carsText);
    if (cars.length === 0) {
      throw new Error("No car objects in that list. The garage was left unchanged.");
    }
    body = replaceCaow(body, cars);
    carCount = cars.length;
    notes.push(`Garage replaced with ${cars.length} cars from the list. Each car was copied as written.`);
  }

  let levelFrom: string | null = null;
  let levelTo: number | null = null;
  if (extras?.level != null) {
    const leveled = replaceLevel(body, extras.level);
    body = leveled.body;
    levelFrom = leveled.from;
    levelTo = extras.level;
    notes.push(
      levelFrom == null ? `Added agprlv ${extras.level}.` : `Level agprlv ${levelFrom} → ${extras.level}.`,
    );
  }

  if (hits.every((hit) => !hit.changed) && carCount == null && levelTo == null) {
    notes.push(`Those stamps are already ${trimmed}. The file was resealed without other edits.`);
  }
  notes.push("Packed as gzip with an HMAC-SHA1 seal. write_nsb.py only wrote bare nsb.txt, which 6.8.0 will not load.");

  if (opened.hadSeal && !incomingSeal) {
    notes.push("The old seal didn't match. The new file uses the Python packer's seal.");
  }

  const packed = await repack(body, "hmac-sha1");

  return {
    name: readName(body),
    compressed: opened.compressed,
    hadSeal: opened.hadSeal,
    incomingSeal,
    outgoingSeal: "hmac-sha1",
    versions: hits,
    patched: hits.some((hit) => hit.changed) || carCount != null || levelTo != null,
    notes,
    packed,
    jsonText: body,
    carCount,
    levelFrom,
    levelTo,
  };
}

/** Tiny packed profile so the bench can be tried without a real garage file. */
export async function sampleProfile(): Promise<Uint8Array> {
  const body =
    '{"name":"Sample Garage","prvr":"6.7.0","adbpvr":"6.7.1","racv":"6.7.0","agprlv":100,"caow":[{"crdb":"Old"}],"pid":9007199254740993,"boqt":12.842}';
  return repack(body, "hmac-sha1");
}
