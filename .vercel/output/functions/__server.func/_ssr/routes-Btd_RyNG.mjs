import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Download, n as Stamp, r as FileWarning } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Btd_RyNG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** CSR2 profile container used by the Python packer (gzip + sealed JSON). */
var HASH_KEY = "4cPw3ZyC";
var DEFAULT_VERSION = "6.8.0";
/** Product-version stamps the client compares against the installed build. */
var VERSION_KEYS = [
	"prvr",
	"adbpvr",
	"racv"
];
var textEncoder = new TextEncoder();
var textDecoder = new TextDecoder("utf-8", { fatal: true });
function asBlob(bytes) {
	const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
	return new Blob([copy]);
}
function hex(buffer) {
	return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function hmacSha1Hex(message) {
	const key = await crypto.subtle.importKey("raw", textEncoder.encode(HASH_KEY), {
		name: "HMAC",
		hash: "SHA-1"
	}, false, ["sign"]);
	return hex(await crypto.subtle.sign("HMAC", key, textEncoder.encode(message)));
}
async function sha1Hex(message) {
	return hex(await crypto.subtle.digest("SHA-1", textEncoder.encode(message)));
}
async function sealMessage(kind, message) {
	if (kind === "hmac-sha1") return hmacSha1Hex(message);
	if (kind === "sha1-prefix") return sha1Hex(HASH_KEY + message);
	return sha1Hex(message + HASH_KEY);
}
async function gunzip(bytes) {
	if (bytes.length < 2 || bytes[0] !== 31 || bytes[1] !== 139) throw new Error("Not a gzip archive.");
	const stream = asBlob(bytes).stream().pipeThrough(new DecompressionStream("gzip"));
	return new Uint8Array(await new Response(stream).arrayBuffer());
}
function gzipHeader(bytes) {
	return bytes.length >= 2 && bytes[0] === 31 && bytes[1] === 139;
}
async function gzipBytes(payload) {
	const stream = asBlob(payload).stream().pipeThrough(new CompressionStream("gzip"));
	return new Uint8Array(await new Response(stream).arrayBuffer());
}
function scanBracket(text, openAt, open, close) {
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
			if (ch === "\"") inString = false;
			continue;
		}
		if (ch === "\"") {
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
function sliceJsonObject(text) {
	const start = text.indexOf("{");
	if (start < 0) throw new Error("No JSON object in this file.");
	const end = scanBracket(text, start, "{", "}");
	return text.slice(start, end);
}
function insertBeforeClose(json, field) {
	const end = json.lastIndexOf("}");
	if (end < 0) throw new Error("The profile JSON is cut off.");
	const inner = json.slice(1, end).trim();
	return json.slice(0, end) + (inner.length > 0 ? "," : "") + field + json.slice(end);
}
/**
* all_cars.txt is a loose list of objects, often missing commas.
* Objects are copied through as text so large ids are not re-typed.
*/
function parseCarList(text) {
	let source = text.replace(/\}\s*\n(\s*)\{/g, "},\n$1{");
	source = source.replace(/,\s*\]/g, "\n]");
	const cars = [];
	let i = 0;
	while (i < source.length) {
		while (i < source.length && " 	\n\r,".includes(source[i] ?? "")) i++;
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
function replaceCaow(body, cars) {
	const array = `[${cars.join(",")}]`;
	const mark = body.match(/"caow"\s*:\s*/);
	if (!mark || mark.index == null) return insertBeforeClose(body, `"caow":${array}`);
	const valueAt = mark.index + mark[0].length;
	if (body[valueAt] !== "[") throw new Error("The caow field is not a list.");
	const end = scanBracket(body, valueAt, "[", "]");
	return body.slice(0, valueAt) + array + body.slice(end);
}
function replaceLevel(body, level) {
	const mark = body.match(/"agprlv"\s*:\s*(-?\d+(?:\.\d+)?)/);
	if (!mark || mark.index == null) return {
		body: insertBeforeClose(body, `"agprlv":${level}`),
		from: null
	};
	const from = mark[1] ?? null;
	return {
		body: body.slice(0, mark.index) + `"agprlv":${level}` + body.slice(mark.index + mark[0].length),
		from
	};
}
/**
* Open either a packed profile (gzip, seal line, JSON) or the .txt the
* Python tool writes after unpack. Anything after the seal line is kept —
* the old script only read line 2, so a profile that isn't one line never loaded.
*/
async function openProfile(bytes) {
	let compressed = false;
	let raw = bytes;
	if (gzipHeader(bytes)) {
		compressed = true;
		try {
			raw = await gunzip(bytes);
		} catch {
			throw new Error("This gzip archive couldn't be opened. It may be truncated.");
		}
	}
	let text;
	try {
		text = textDecoder.decode(raw);
	} catch {
		throw new Error("The file isn't UTF-8 text after decompression. This isn't the Python profile format.");
	}
	if (text.charCodeAt(0) === 65279) text = text.slice(1);
	text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
	const nl = text.indexOf("\n");
	const first = (nl === -1 ? text : text.slice(0, nl)).trim();
	if (/^[0-9a-fA-F]{40}$/.test(first)) {
		let body = nl === -1 ? "" : text.slice(nl + 1);
		if (body.endsWith("\n")) body = body.slice(0, -1);
		return {
			compressed,
			hadSeal: true,
			hash: first.toLowerCase(),
			body
		};
	}
	if (text.includes("{")) return {
		compressed,
		hadSeal: false,
		hash: null,
		body: text.endsWith("\n") ? text.slice(0, -1) : text
	};
	throw new Error("No JSON profile in this file. Expected a packed NSB (gzip) or the unpacked .txt from the Python tool.");
}
var versionField = /("(?:prvr|adbpvr|racv)")(\s*:\s*)"([^"\\]*)"/g;
function patchVersionFields(body, version) {
	const hits = [];
	return {
		body: body.replace(versionField, (full, keyQuoted, sep, value) => {
			const key = keyQuoted.slice(1, -1);
			const changed = value !== version;
			hits.push({
				key,
				from: value,
				to: version,
				changed
			});
			if (!changed) return full;
			return `${keyQuoted}${sep}"${version}"`;
		}),
		hits
	};
}
function readName(body) {
	const match = body.match(/"name"\s*:\s*"([^"\\]{1,40})"/);
	return match ? match[1] : null;
}
async function detectSeal(hash, body) {
	if (!hash) return null;
	for (const kind of [
		"hmac-sha1",
		"sha1-prefix",
		"sha1-suffix"
	]) if (await sealMessage(kind, body) === hash) return kind;
	return null;
}
async function repack(body, seal) {
	const hash = await sealMessage(seal, body);
	return gzipBytes(textEncoder.encode(`${hash}\n${body}`));
}
async function setProfileVersion(bytes, version, extras) {
	const trimmed = version.trim();
	if (!/^\d+\.\d+\.\d+$/.test(trimmed)) throw new Error("Version has to look like 6.8.0.");
	if (extras?.level != null && (!Number.isInteger(extras.level) || extras.level < 0)) throw new Error("Level has to be a whole number.");
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
		for (const key of missing) hits.push({
			key,
			from: "(missing)",
			to: trimmed,
			changed: true
		});
	}
	const notes = [];
	let carCount = null;
	if (extras?.carsText != null) {
		const cars = parseCarList(extras.carsText);
		if (cars.length === 0) throw new Error("No car objects in that list. The garage was left unchanged.");
		body = replaceCaow(body, cars);
		carCount = cars.length;
		notes.push(`Garage replaced with ${cars.length} cars from the list. Each car was copied as written.`);
	}
	let levelFrom = null;
	let levelTo = null;
	if (extras?.level != null) {
		const leveled = replaceLevel(body, extras.level);
		body = leveled.body;
		levelFrom = leveled.from;
		levelTo = extras.level;
		notes.push(levelFrom == null ? `Added agprlv ${extras.level}.` : `Level agprlv ${levelFrom} → ${extras.level}.`);
	}
	if (hits.every((hit) => !hit.changed) && carCount == null && levelTo == null) notes.push(`Those stamps are already ${trimmed}. The file was resealed without other edits.`);
	notes.push("Packed as gzip with an HMAC-SHA1 seal. write_nsb.py only wrote bare nsb.txt, which 6.8.0 will not load.");
	if (opened.hadSeal && !incomingSeal) notes.push("The old seal didn't match. The new file uses the Python packer's seal.");
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
		levelTo
	};
}
/** Tiny packed profile so the bench can be tried without a real garage file. */
async function sampleProfile() {
	return repack("{\"name\":\"Sample Garage\",\"prvr\":\"6.7.0\",\"adbpvr\":\"6.7.1\",\"racv\":\"6.7.0\",\"agprlv\":100,\"caow\":[{\"crdb\":\"Old\"}],\"pid\":9007199254740993,\"boqt\":12.842}", "hmac-sha1");
}
function download(bytes, fileName) {
	const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
	const blob = new Blob([copy], { type: "application/octet-stream" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	link.click();
	URL.revokeObjectURL(url);
}
function NsbBench() {
	const inputRef = (0, import_react.useRef)(null);
	const carsRef = (0, import_react.useRef)(null);
	const sourceRef = (0, import_react.useRef)(null);
	const [version, setVersion] = (0, import_react.useState)(DEFAULT_VERSION);
	const [useLevel, setUseLevel] = (0, import_react.useState)(false);
	const [level, setLevel] = (0, import_react.useState)("5776");
	const [carsText, setCarsText] = (0, import_react.useState)(null);
	const [carsName, setCarsName] = (0, import_react.useState)(null);
	const [status, setStatus] = (0, import_react.useState)({ kind: "idle" });
	const [dragOver, setDragOver] = (0, import_react.useState)(false);
	async function run(bytes, fileName, cars, withLevel, levelText) {
		setStatus({
			kind: "busy",
			label: "Reading profile"
		});
		try {
			const parsedLevel = withLevel ? Number(levelText) : null;
			const report = await setProfileVersion(bytes, version, {
				carsText: cars,
				level: parsedLevel
			});
			setStatus({
				kind: "ready",
				fileName,
				report
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : "Couldn't read that file.";
			setStatus({
				kind: "error",
				message
			});
		}
	}
	async function onFile(file) {
		if (!file) return;
		const bytes = new Uint8Array(await file.arrayBuffer());
		sourceRef.current = {
			bytes,
			name: file.name || "nsb"
		};
		await run(bytes, sourceRef.current.name, carsText, useLevel, level);
	}
	async function onCars(file) {
		if (!file) return;
		const text = await file.text();
		setCarsName(file.name);
		setCarsText(text);
		if (sourceRef.current) await run(sourceRef.current.bytes, sourceRef.current.name, text, useLevel, level);
	}
	async function onSample() {
		setStatus({
			kind: "busy",
			label: "Building a sample"
		});
		try {
			const report = await setProfileVersion(await sampleProfile(), version, {
				carsText,
				level: useLevel ? Number(level) : null
			});
			setStatus({
				kind: "ready",
				fileName: "sample-nsb",
				report
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : "Sample failed.";
			setStatus({
				kind: "error",
				message
			});
		}
	}
	const report = status.kind === "ready" ? status.report : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-sm tracking-widest text-primary uppercase",
						children: "CSR2 profile"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-4xl leading-none text-fg sm:text-5xl",
						children: "Set the save to 6.8.0"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-xl text-base leading-relaxed text-muted",
						children: "Drop the packed NSB, or the bare nsb.txt your script already wrote. Version stamps go to 6.8.0, then the file is gzipped and sealed so the client will actually load it. Nothing is uploaded."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex flex-col gap-2 text-sm font-medium text-fg",
						children: ["Target version", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: version,
							onChange: (event) => setVersion(event.target.value),
							inputMode: "decimal",
							spellCheck: false,
							className: "h-12 rounded-lg border border-border bg-bg px-3 text-lg text-fg outline-none focus:border-primary",
							"aria-describedby": "version-hint"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						id: "version-hint",
						className: "text-sm text-muted",
						children: "Use the version the game is actually on. 6.8.0 is the current client."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center gap-3 text-sm font-medium text-fg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: useLevel,
							onChange: (event) => {
								const next = event.target.checked;
								setUseLevel(next);
								if (sourceRef.current) run(sourceRef.current.bytes, sourceRef.current.name, carsText, next, level);
							},
							className: "size-5 accent-primary"
						}), "Also set level (agprlv), same as write_nsb.py"]
					}),
					useLevel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: level,
						onChange: (event) => setLevel(event.target.value),
						inputMode: "numeric",
						"aria-label": "Player level",
						className: "h-12 rounded-lg border border-border bg-bg px-3 text-lg text-fg outline-none focus:border-primary"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => carsRef.current?.click(),
							className: "h-12 rounded-lg border border-border bg-surface-2 px-4 text-sm font-semibold text-fg",
							children: carsName ? `Car list: ${carsName}` : "Add car list (optional)"
						}), carsName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								setCarsName(null);
								setCarsText(null);
							},
							className: "h-12 rounded-lg border border-border px-4 text-sm font-semibold text-fg",
							children: "Clear car list"
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: carsRef,
						type: "file",
						className: "sr-only",
						"aria-label": "Car list",
						onChange: (event) => {
							onCars(event.target.files?.[0]);
							event.target.value = "";
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "button",
						tabIndex: 0,
						onClick: () => inputRef.current?.click(),
						onKeyDown: (event) => {
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								inputRef.current?.click();
							}
						},
						onDragOver: (event) => {
							event.preventDefault();
							setDragOver(true);
						},
						onDragLeave: () => setDragOver(false),
						onDrop: (event) => {
							event.preventDefault();
							setDragOver(false);
							onFile(event.dataTransfer.files[0]);
						},
						className: "flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center " + (dragOver ? "border-primary bg-surface-2" : "border-border bg-bg"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stamp, {
								className: "size-8 text-primary",
								"aria-hidden": "true"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-base font-semibold text-fg",
								children: "Drop NSB or unpacked txt"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm text-muted",
								children: "or click to choose a file"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: inputRef,
						type: "file",
						className: "sr-only",
						"aria-label": "Profile file",
						onChange: (event) => {
							onFile(event.target.files?.[0]);
							event.target.value = "";
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => void onSample(),
						className: "h-12 rounded-lg border border-border bg-surface-2 px-4 text-sm font-semibold text-fg",
						children: "Try a sample profile"
					})
				]
			}),
			status.kind === "busy" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				role: "status",
				children: [status.label, "…"]
			}) : null,
			status.kind === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex gap-3 rounded-xl border border-danger bg-surface p-4",
				role: "alert",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileWarning, {
					className: "mt-0.5 size-5 shrink-0 text-danger",
					"aria-hidden": "true"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm leading-relaxed text-fg",
					children: status.message
				})]
			}) : null,
			report ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-5 rounded-xl border border-border bg-surface p-4 sm:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl text-fg",
							children: report.patched ? "Version updated" : "No version change"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [
								report.name ? `Profile “${report.name}”. ` : "",
								report.compressed ? "Opened from gzip. " : "Opened as text. ",
								report.carCount != null ? `${report.carCount} cars. ` : "",
								report.levelTo != null ? `Level ${report.levelFrom ?? "new"} → ${report.levelTo}. ` : "",
								"Sealed."
							]
						})]
					}),
					report.versions.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "flex flex-col gap-2",
						children: report.versions.map((hit) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between gap-3 rounded-lg bg-bg px-3 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display text-lg tracking-wide text-fg uppercase",
								children: hit.key
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-sm text-muted",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: hit.changed ? "line-through" : "",
										children: hit.from
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "px-2 text-primary",
										children: "→"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-fg",
										children: hit.to
									})
								]
							})]
						}, `${hit.key}-${hit.from}`))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Those three fields aren't in this file."
					}),
					report.notes.map((note) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed text-muted",
						children: note
					}, note)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => download(report.packed, "nsb"),
							className: "inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
								className: "size-4",
								"aria-hidden": "true"
							}), "Download packed NSB"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => download(new TextEncoder().encode(report.jsonText), "nsb.txt"),
							className: "inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-fg",
							children: "Download JSON text"
						})]
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-2 text-sm leading-relaxed text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg text-fg",
						children: "Why write_nsb.py stopped sticking"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"It decompresses the NSB, finds the first ",
						"{",
						", swaps caow from all_cars.txt, sets agprlv, and writes bare JSON to nsb.txt. It never sets prvr, adbpvr, or racv, and it never gzips the file or puts the seal line back. 6.8.0 ignores that text file, so the garage looks unchanged."
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Drop the same NSB here. Add the car list only if you still want the garage swap. Version becomes 6.8.0, and the download is a sealed NSB again. Keep a copy of the original. Currencies and the profile hash are not touched." })
				]
			})
		]
	});
}
var SplitComponent = NsbBench;
//#endregion
export { SplitComponent as component };
