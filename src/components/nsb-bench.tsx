import { useState } from "react";
import * as pako from "pako";

// ==========================================
// BROWSER-SIDE CORE LOGIC (Replaces Python)
// ==========================================
function extractJsonObject(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return text.substring(start, end + 1);
  return text;
}

function unpackNsb(arrayBuffer: ArrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) {
    const text = new TextDecoder().decode(bytes);
    return { jsonText: extractJsonObject(text), version: 0, trailing: new Uint8Array(0) };
  }
  const inflator = new pako.Inflate();
  inflator.push(bytes);
  if (inflator.err) throw new Error("GZIP Error: " + inflator.msg);
  
  const text = new TextDecoder().decode(inflator.result);
  const trailingStart = bytes.length - inflator.strm.avail_in;
  const trailing = bytes.slice(trailingStart);
  
  let version = 1;
  let jsonText = text;
  const lines = text.split('\n');
  if (lines.length >= 2 && lines[0].includes('-ver-')) {
    const parts = lines[0].split('-ver-');
    if (parts.length > 1) {
      const v = parseInt(parts[0]);
      if (!isNaN(v)) version = v;
    }
    jsonText = text.substring(lines[0].length + 1);
  }
  return { jsonText: extractJsonObject(jsonText), version, trailing };
}

async function generateCurrentKey(playerId: string, version: number) {
  const reversedId = playerId.split('').reverse().join('');
  const idx = version % reversedId.length;
  const rotated = reversedId.slice(idx) + reversedId.slice(0, idx);
  return new TextEncoder().encode(rotated);
}

async function packNsb(jsonText: string, playerId: string, version: number, trailing: Uint8Array) {
  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(jsonText);
  const key = await generateCurrentKey(playerId, version);
  
  const cryptoKey = await window.crypto.subtle.importKey(
      "raw", key, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  const signatureBuffer = await window.crypto.subtle.sign("HMAC", cryptoKey, jsonBytes);
  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const fullText = `${version}-ver-${signatureHex}\n${jsonText}`;
  const fullBytes = encoder.encode(fullText);
  const gzipped = pako.gzip(fullBytes);
  
  const result = new Uint8Array(gzipped.length + trailing.length);
  result.set(gzipped, 0);
  result.set(trailing, gzipped.length);
  return result;
}

function patchSoBuffer(arrayBuffer: ArrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const offset = 0x378E0D8;
  const patch = [0x00, 0x00, 0x80, 0x52, 0xC0, 0x03, 0x5F, 0xD6];
  if (bytes.length > offset + 8) {
    for (let i = 0; i < 8; i++) bytes[offset + i] = patch[i];
  } else {
    throw new Error("File too small for offset 0x378E0D8");
  }
  return bytes;
}
// ==========================================

export function NsbBench() {
  const [nsbFile, setNsbFile] = useState<File | null>(null);
  const [scbFile, setScbFile] = useState<File | null>(null);
  const [soFile, setSoFile] = useState<File | null>(null);

  const [playerId, setPlayerId] = useState("");
  const [injectCars, setInjectCars] = useState(true);
  const [addMoney, setAddMoney] = useState(true);
  const [patchSo, setPatchSo] = useState(true);

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const handleGenerate = async () => {
    if (!playerId.trim()) return setError("Enter Player ID");
    if (!nsbFile || !scbFile) return setError("Upload NSB and SCB");
    if (patchSo && !soFile) return setError("Upload libil2cpp.so");

    setError("");
    setIsLoading(true);

    try {
            setStatus("Loading Car Database...");
      const carsRes = await fetch('/all_cars.txt');
      if (!carsRes.ok) throw new Error("Failed to load all_cars.txt from /public folder.");
      const carsText = await carsRes.text();
      // Extract the array using brackets instead of curly braces
      const start = carsText.indexOf('[');
      const end = carsText.lastIndexOf(']');
      const cars = JSON.parse(carsText.substring(start, end + 1));

            setStatus("Unpacking & Modding NSB...");
      const nsbBuffer = await nsbFile.arrayBuffer();
      const { jsonText: nsbJsonStr, version: nsbVer, trailing: nsbTrail } = unpackNsb(nsbBuffer);
      const nsb = JSON.parse(nsbJsonStr);
      
      // --- SURGICAL WIPE ---
      // Removes the cgpi array entirely, regardless of its contents.
      // This forces the game to rebuild the garage slots from scratch on boot.
      // Does NOT touch caow, plrp, or any other save data.
      delete nsb.cgpi;
      // --------------------

      setStatus("Unpacking & Modding SCB...");
      const scbBuffer = await scbFile.arrayBuffer();
      const { jsonText: scbJsonStr, version: scbVer } = unpackNsb(scbBuffer);
      const scb = JSON.parse(scbJsonStr);

      // --- APPLY MODIFICATIONS ---
      if (injectCars && cars) {
        nsb.caow = cars;
        const crds = cars.map((c: any) => c.crdb);
        const brands = Array.from(new Set(crds.map((c: string) => `id_${c.split('_')[0].toLowerCase()}`))).sort();
        if (!scb.JokerPartsData) scb.JokerPartsData = {};
        const jp = scb.JokerPartsData;
        jp.JokerCarUpgradeStagesEarned = {};
        jp.JokerCarUpgradeStagesSpent = {};
        crds.forEach((c: string) => { jp.JokerCarUpgradeStagesEarned[c] = 10000; jp.JokerCarUpgradeStagesSpent[c] = 0; });
        jp.JokerFusionPartsEarned = {};
        jp.JokerFusionPartsSpent = {};
        brands.forEach((b: string) => { jp.JokerFusionPartsEarned[b] = 10000; jp.JokerFusionPartsSpent[b] = 0; });
        jp.JokerIconRestorationPartsEarned = 10000;
        jp.JokerIconRestorationPartsSpent = 0;
      }

      if (addMoney) {
        nsb.caea = 999999999; nsb.casp = 0;
        nsb.goea = 999999; nsb.gosp = 0;
        nsb.gbke = 10000; nsb.gbks = 0;
        nsb.gske = 10000; nsb.gsks = 0;
        nsb.ggke = 10000; nsb.ggks = 0;
        nsb.afme = {Green: 10000, Blue: 10000, Red: 10000, Yellow: 10000};
        nsb.afms = {Green: 0, Blue: 0, Red: 0, Yellow: 0};
        if (!nsb.cpd) nsb.cpd = {};
        nsb.cpd.CollectionPoints = 50000;
        // DO NOT TOUCH plrp, splr, agprlv, elt, eltc, hmpd

        scb.CashEarned = nsb.caea; scb.CashSpent = nsb.casp;
        scb.GoldEarned = nsb.goea; scb.GoldSpent = nsb.gosp;
        scb.GachaBronzeKeysEarned = nsb.gbke; scb.GachaBronzeKeysSpent = nsb.gbks;
        scb.GachaSilverKeysEarned = nsb.gske; scb.GachaSilverKeysSpent = nsb.gsks;
        scb.GachaGoldKeysEarned = nsb.ggke; scb.GachaGoldKeysSpent = nsb.ggks;
        scb.AMPartGreenEarned = nsb.afme.Green; scb.AMPartGreenSpent = nsb.afms.Green;
        scb.AMPartBlueEarned = nsb.afme.Blue; scb.AMPartBlueSpent = nsb.afms.Blue;
        scb.AMPartRedEarned = nsb.afme.Red; scb.AMPartRedSpent = nsb.afms.Red;
        scb.AMPartYellowEarned = nsb.afme.Yellow; scb.AMPartYellowSpent = nsb.afms.Yellow;
      }

      setStatus("Packing Files...");
      const newNsbBytes = await packNsb(JSON.stringify(nsb), playerId.trim(), nsbVer, nsbTrail);
      const newScbBytes = await packNsb(JSON.stringify(scb), playerId.trim(), scbVer, new Uint8Array(0));

      const nsbBlob = new Blob([newNsbBytes], { type: "application/octet-stream" });
      const scbBlob = new Blob([newScbBytes], { type: "application/octet-stream" });

      const a1 = document.createElement("a");
      a1.href = URL.createObjectURL(nsbBlob);
      a1.download = "nsb_modded";
      a1.click();

      setTimeout(() => {
        const a2 = document.createElement("a");
        a2.href = URL.createObjectURL(scbBlob);
        a2.download = "scb_modded";
        a2.click();
      }, 500);

      if (patchSo && soFile) {
        setStatus("Patching libil2cpp.so (This may take a moment)...");
        const soBuffer = await soFile.arrayBuffer();
        const patchedSo = patchSoBuffer(soBuffer);
        const soBlob = new Blob([patchedSo], { type: "application/octet-stream" });
        setTimeout(() => {
          const a3 = document.createElement("a");
          a3.href = URL.createObjectURL(soBlob);
          a3.download = "libil2cpp_patched.so";
          a3.click();
        }, 1000);
      }

      setStatus("All files generated successfully!");
    } catch (err: any) {
      setError(err.message || String(err));
      setStatus("");
    }
    setIsLoading(false);
  };

  const downloadInstructions = () => {
    const text = `=== CSR2 MAVERICK MODDING GUIDE ===

PREREQUISITES:
- Google Play Games Developer Emulator installed.
- ADB (Android Debug Bridge) installed.
- PowerShell 5.1+ running as Administrator.
- Make sure to replace "C:\\Path\\To\\..." with your actual local file paths.

--- STEP 1: DOWNLOAD REQUIRED FILES ---
Download the CSR 2 APK + OBB and Magisk.apk.

--- STEP 2: ROOT THE EMULATOR ---
$adb = "C:\\Program Files\\Google\\Play Games Developer Emulator\\current\\emulator\\adb.exe"
& $adb install "C:\\Path\\To\\Magisk.apk"
# Open Magisk app inside the emulator. Let it complete "Additional Setup" and reboot.

--- STEP 3: GRANT ADB ROOT ACCESS ---
& $adb shell "su -c id" 
# A popup will appear on the emulator screen. Tap "Grant". The output must say uid=0(root)

--- STEP 4: INSTALL GAME APK ---
& $adb install -r "C:\\Path\\To\\com.naturalmotion.customstreetracer2.apk"

--- STEP 5: PUSH OBB FILES ---
$obbDest = "/data/media/0/Android/obb/com.naturalmotion.customstreetracer2"
& $adb shell "su -c 'mkdir -p $obbDest'"
& $adb shell "su -c 'mkdir -p /sdcard/temp_obb'"

& $adb push "C:\\Path\\To\\main.6805204.com.naturalmotion.customstreetracer2.obb" /sdcard/temp_obb/main.6805204.com.naturalmotion.customstreetracer2.obb
& $adb push "C:\\Path\\To\\patch.6805204.com.naturalmotion.customstreetracer2.obb" /sdcard/temp_obb/patch.6805204.com.naturalmotion.customstreetracer2.obb

& $adb shell "su -c 'mv /sdcard/temp_obb/*.obb $obbDest/'"
& $adb shell "su -c 'rm -rf /sdcard/temp_obb'"

--- STEP 6: VERIFY OBB FILES & GET UID ---
& $adb shell "su -c 'ls -l $obbDest'"
$uidLine = & $adb shell "pm list packages -U com.naturalmotion.customstreetracer2"
$uid = ($uidLine -split 'uid:')[1].Trim()
Write-Host "Your Game UID is: $uid"

& $adb shell "su -c 'chown -R \${uid}:\${uid} $obbDest'"
& $adb shell "su -c 'chmod -R 777 $obbDest'"

--- STEP 7: LAUNCH & COMPLETE TUTORIAL (CRITICAL) ---
You MUST complete the tutorial on this first boot. Do not inject any files yet. 
Play until you reach the fully interactive garage, then force close the game.

& $adb shell "am force-stop com.naturalmotion.customstreetracer2"
$pkg = "/data/media/0/Android/data/com.naturalmotion.customstreetracer2/files"
& $adb shell "su -c 'ls $pkg/pp/'" 
$id = "<YOUR_ID_FROM_ABOVE>"

$pathOutput = & $adb shell "pm path com.naturalmotion.customstreetracer2"
$apkPath = ($pathOutput -split "package:")[1].Trim() -replace "\`r", "" -replace "\`n", ""
$libPath = $apkPath.Replace("/base.apk", "/lib/arm64/libil2cpp.so")

& $adb shell "su -c 'cp $pkg/pp/$id/nsb /sdcard/nsb'"
& $adb shell "su -c 'cp $pkg/pp/$id/scb /sdcard/scb'"
& $adb shell "su -c 'cp $libPath /sdcard/libil2cpp.so'"

& $adb pull /sdcard/nsb "C:\\Path\\To\\Downloads\\nsb_live"
& $adb pull /sdcard/scb "C:\\Path\\To\\Downloads\\scb_live"
& $adb pull /sdcard/libil2cpp.so "C:\\Path\\To\\Downloads\\libil2cpp_original.so"

--- STEP 8: VERIFY PULLED FILES ---
& $adb shell "su -c 'ls -l /sdcard/nsb /sdcard/scb /sdcard/libil2cpp.so'"

--- STEP 9: SCRATCH SCRATCH RESET ---
1. Open the Emulator Settings.
2. Go to Accounts.
3. Click your Google email.
4. Click "Remove account" (This wipes the emulator).
5. Sign back into the emulator with the EXACT SAME Google Play account you just used.

--- STEP 10: REINSTALL MAGISK ---
& $adb install -r "C:\\Path\\To\\Magisk.apk"
& $adb shell "su -c id" 

--- STEP 11: REINSTALL GAME APK & OBB ---
& $adb install -r "C:\\Path\\To\\com.naturalmotion.customstreetracer2.apk"
$obbDest = "/data/media/0/Android/obb/com.naturalmotion.customstreetracer2"
& $adb shell "su -c 'mkdir -p $obbDest'"
& $adb shell "su -c 'mkdir -p /sdcard/temp_obb'"

& $adb push "C:\\Path\\To\\main.6805204.com.naturalmotion.customstreetracer2.obb" /sdcard/temp_obb/main.6805204.com.naturalmotion.customstreetracer2.obb
& $adb push "C:\\Path\\To\\patch.6805204.com.naturalmotion.customstreetracer2.obb" /sdcard/temp_obb/patch.6805204.com.naturalmotion.customstreetracer2.obb

& $adb shell "su -c 'mv /sdcard/temp_obb/*.obb $obbDest/'"
& $adb shell "su -c 'rm -rf /sdcard/temp_obb'"

--- STEP 12: VERIFY OBB FILES & UPDATE UID ---
$uidLine = & $adb shell "pm list packages -U com.naturalmotion.customstreetracer2"
$uid = ($uidLine -split 'uid:')[1].Trim()
Write-Host "New Game UID: $uid"

& $adb shell "su -c 'chown -R \${uid}:\${uid} $obbDest'"
& $adb shell "su -c 'chmod -R 777 $obbDest'"
& $adb shell "su -c 'ls -l $obbDest'"

--- STEP 13: MOD FILES ---
1. Upload the pulled nsb_live, scb_live, and libil2cpp_original.so into this web tool.
2. Download the modded nsb_modded, scb_modded, and libil2cpp_patched.so.

--- STEP 14: PUSH PATCHED .SO ---
$pathOutput = & $adb shell "pm path com.naturalmotion.customstreetracer2"
$apkPath = ($pathOutput -split "package:")[1].Trim() -replace "\`r", "" -replace "\`n", ""
$libPath = $apkPath.Replace("/base.apk", "/lib/arm64/libil2cpp.so")

& $adb push "C:\\Path\\To\\Downloads\\libil2cpp_patched.so" /sdcard/libil2cpp.so
& $adb shell "su -c 'mount -o rw,remount /data'"
& $adb shell "su -c 'cat /sdcard/libil2cpp.so > $libPath'"
& $adb shell "su -c 'sync'"
& $adb shell "su -c 'rm /sdcard/libil2cpp.so'"

& $adb shell "su -c 'chmod 755 $libPath'"
& $adb shell "su -c 'restorecon -v $libPath'"

--- STEP 15: MAVERICK INJECTION (DO NOT LAUNCH) ---
$pkg = "/data/media/0/Android/data/com.naturalmotion.customstreetracer2/files"
& $adb push "C:\\Path\\To\\Downloads\\nsb_modded" /sdcard/nsb_new
& $adb push "C:\\Path\\To\\Downloads\\scb_modded" /sdcard/scb_new

$idLine = & $adb shell "su -c 'ls $pkg/pp/'" | Where-Object { $_ -match '^\\d{11}$' }
$id = $idLine.Trim()

& $adb shell "su -c 'mkdir -p $pkg/pp/$id'"
& $adb shell "su -c 'mkdir -p $pkg/pp/temp'"
& $adb shell "su -c 'cp /sdcard/nsb_new $pkg/pp/$id/nsb'"
& $adb shell "su -c 'cp /sdcard/scb_new $pkg/pp/$id/scb'"
& $adb shell "su -c 'cp /sdcard/nsb_new $pkg/pp/temp/nsb'"
& $adb shell "su -c 'cp /sdcard/scb_new $pkg/pp/temp/scb'"

& $adb shell "su -c 'chown -R \${uid}:\${uid} $pkg/pp'"
& $adb shell "su -c 'chmod -R 777 $pkg/pp'"
& $adb shell "su -c 'restorecon -RF $pkg/pp'"

--- STEP 16: LAUNCH & CHOOSE LOCAL ---
& $adb shell "pm grant com.naturalmotion.customstreetracer2 android.permission.READ_EXTERNAL_STORAGE"
& $adb shell "appops set com.naturalmotion.customstreetracer2 MANAGE_EXTERNAL_STORAGE allow"
& $adb shell "monkey -p com.naturalmotion.customstreetracer2 -c android.intent.category.LAUNCHER 1"

1. Launch CSR2.
2. Click "Local Save" (Left side).
3. Verify there are NO Sync Prompts and the tutorials are skipped. You are done!
`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "instructions.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-3xl p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-fg font-display uppercase tracking-wide">CSR2 Mod Generator</h1>
          <p className="text-sm text-muted mt-1">Generates modded NSB, SCB, and patched libil2cpp.so entirely in your browser.</p>
        </div>
      </div>

      <section className="border border-border rounded-lg bg-surface-2">
        <button
          onClick={() => setShowTutorial(!showTutorial)}
          className="w-full flex justify-between items-center p-4 font-bold text-primary hover:bg-surface transition"
        >
          <span>[Guide] {showTutorial ? 'Hide' : 'View'} Full 16-Step Installation Tutorial</span>
          <span>{showTutorial ? '^' : 'v'}</span>
        </button>

        {showTutorial && (
          <div className="p-6 border-t border-border flex flex-col gap-6">
            <div className="flex gap-4">
              <button onClick={downloadInstructions} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded text-sm transition">
                [Download] instructions.txt
              </button>
            </div>
            
            {/* Visual UI steps from your original file */}
            <p className="text-sm text-muted">Click [Download] above to get the exact 16-step guide with all commands.</p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 bg-surface p-4 rounded-lg border border-border">
        <label className="text-sm font-bold text-fg">Player ID</label>
        <input type="text" value={playerId} onChange={(e) => setPlayerId(e.target.value)} placeholder="e.g. YOUR_PLAYER_ID" className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm font-mono text-fg focus:outline-none focus:border-primary" />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-fg border-b border-border pb-2">1. Upload Files</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-muted mb-1">NSB File</label>
            <input type="file" onChange={(e) => setNsbFile(e.target.files?.[0] || null)} className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-fg file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-fg hover:file:bg-primary/80" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">SCB File</label>
            <input type="file" onChange={(e) => setScbFile(e.target.files?.[0] || null)} className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-fg file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-fg hover:file:bg-primary/80" />
          </div>
          {patchSo && (
            <div>
              <label className="block text-xs text-muted mb-1">libil2cpp.so</label>
              <input type="file" onChange={(e) => setSoFile(e.target.files?.[0] || null)} className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-fg file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-fg hover:file:bg-primary/80" />
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-fg border-b border-border pb-2">2. Mod Options</h3>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={injectCars} onChange={(e) => setInjectCars(e.target.checked)} className="w-4 h-4 accent-primary" />
          <label className="text-sm font-medium text-fg">Unlock All Cars (Safe)</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={addMoney} onChange={(e) => setAddMoney(e.target.checked)} className="w-4 h-4 accent-primary" />      setStatus("Unpacking & Modding NSB...");
      const nsbBuffer = await nsbFile.arrayBuffer();
      const { jsonText: nsbJsonStr, version: nsbVer, trailing: nsbTrail } = unpackNsb(nsbBuffer);
      const nsb = JSON.parse(nsbJsonStr);
          <label className="text-sm font-medium text-fg">Inject Custom Resources (Cash, Gold, 10k Keys/Parts, etc.)</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={patchSo} onChange={(e) => setPatchSo(e.target.checked)} className="w-4 h-4 accent-primary" />
          <label className="text-sm font-medium text-fg">Patch libil2cpp.so (Bypass Sync)</label>
        </div>
      </section>

      <section className="flex flex-col gap-2 border-t border-border pt-4">
        <button onClick={handleGenerate} disabled={isLoading} className="w-full rounded-md bg-primary px-3 py-3 text-sm font-bold text-primary-fg hover:bg-primary/90 disabled:opacity-50 transition">
          {isLoading ? "Processing (This may take a moment for the 100MB .so file)..." : "Generate Files"}
        </button>
      </section>

      <div className="flex flex-col gap-2 text-center">
        {status && <p className="text-sm text-primary font-semibold">{status}</p>}
        {error && <p className="text-sm text-danger font-semibold">{error}</p>}
      </div>
    </div>
  );
}