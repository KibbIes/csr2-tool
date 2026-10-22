import assert from "node:assert/strict";
import { gunzipSync, gzipSync } from "node:zlib";
import test from "node:test";
import { createHmac } from "node:crypto";
import { HASH_KEY, openProfile, sampleProfile, setProfileVersion } from "./nsb.ts";

test("sample profile stamps move to 6.8.0 and the seal still matches", async () => {
  const packed = await sampleProfile();
  const result = await setProfileVersion(packed, "6.8.0");
  assert.equal(result.patched, true);
  assert.deepEqual(
    result.versions.map((hit) => `${hit.key}:${hit.from}->${hit.to}`),
    ["prvr:6.7.0->6.8.0", "adbpvr:6.7.1->6.8.0", "racv:6.7.0->6.8.0"],
  );
  assert.equal(result.name, "Sample Garage");
  assert.equal(result.incomingSeal, "hmac-sha1");

  const raw = gunzipSync(result.packed).toString("utf8");
  const nl = raw.indexOf("\n");
  const hash = raw.slice(0, nl);
  const body = raw.slice(nl + 1);
  const expect = createHmac("sha1", HASH_KEY).update(body).digest("hex");
  assert.equal(hash, expect);
  assert.match(body, /"prvr":"6.8.0"/);
  assert.match(body, /"boqt":12.842/);
  assert.equal(result.jsonText.includes("6.7.0"), false);
});

test("multi-line JSON is patched without rewriting other bytes", async () => {
  const body = [
    "{",
    '  "name": "Kept Spacing",',
    '  "prvr": "5.1.0",',
    '  "adbpvr": "5.1.0",',
    '  "racv": "5.1.0",',
    '  "id": "9007199254740993",',
    '  "note": "leave  this"',
    "}",
  ].join("\n");
  const hash = createHmac("sha1", HASH_KEY).update(body).digest("hex");
  const packed = gzipSync(Buffer.from(`${hash}\n${body}`, "utf8"));
  const result = await setProfileVersion(packed, "6.8.0");
  assert.match(result.jsonText, /"id": "9007199254740993"/);
  assert.match(result.jsonText, /"note": "leave  this"/);
  assert.match(result.jsonText, /"prvr": "6.8.0"/);
  assert.equal(result.jsonText.includes("5.1.0"), false);
  const opened = await openProfile(result.packed);
  assert.equal(opened.body, result.jsonText);
});

test("unpacked txt with no seal still packs", async () => {
  const txt = Buffer.from('{"prvr":"6.6.0","adbpvr":"6.6.0","racv":"6.6.0"}\n', "utf8");
  const result = await setProfileVersion(txt, "6.8.0");
  assert.equal(result.hadSeal, false);
  assert.equal(result.outgoingSeal, "hmac-sha1");
  assert.equal(result.versions.every((hit) => hit.to === "6.8.0" && hit.changed), true);
});

test("write_nsb.py path sets 6.8.0, swaps cars, sets level, and keeps big ids", async () => {
  const packed = await sampleProfile();
  const cars = '{ "crdb": "First", "id": 9007199254740993 }\n{ "crdb": "Second" }\n';
  const result = await setProfileVersion(packed, "6.8.0", { carsText: cars, level: 5776 });
  assert.equal(result.carCount, 2);
  assert.equal(result.levelFrom, "100");
  assert.equal(result.levelTo, 5776);
  assert.match(result.jsonText, /"prvr":"6.8.0"/);
  assert.match(result.jsonText, /"agprlv":5776/);
  assert.match(result.jsonText, /"pid":9007199254740993/);
  assert.match(result.jsonText, /"id": 9007199254740993/);
  assert.equal(result.jsonText.includes("Old"), false);

  const raw = gunzipSync(result.packed).toString("utf8");
  const nl = raw.indexOf("\n");
  const hash = raw.slice(0, nl);
  const body = raw.slice(nl + 1);
  assert.equal(hash, createHmac("sha1", HASH_KEY).update(body).digest("hex"));
});

test("an empty car list does not wipe the garage", async () => {
  const packed = await sampleProfile();
  await assert.rejects(() => setProfileVersion(packed, "6.8.0", { carsText: "not cars" }));
});

test("rejects a file that is not a profile", async () => {
  await assert.rejects(() => setProfileVersion(Buffer.from("hello"), "6.8.0"));
});
