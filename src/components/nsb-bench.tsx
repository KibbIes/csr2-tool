import { useState } from "react";

const BACKEND = "http://127.0.0.1:8000";

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

  const readFileAsBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });

  const handleGenerate = async () => {
    if (!playerId.trim()) return setError("Enter Player ID");
    if (!nsbFile || !scbFile) return setError("Upload NSB and SCB");
    if (patchSo && !soFile) return setError("Upload libil2cpp.so");

    setError("");
    setIsLoading(true);

    try {
      setStatus("Unpacking & Modding Files...");
      const nsb_b64 = await readFileAsBase64(nsbFile);
      const scb_b64 = await readFileAsBase64(scbFile);

      const modRes = await fetch(`${BACKEND}/auto_mod`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerId.trim(), nsb_b64, scb_b64, inject_cars: injectCars, add_money: addMoney })
      });

      if (!modRes.ok) {
        const text = await modRes.text();
        let errMsg = text;
        try { errMsg = JSON.parse(text).error; } catch(e) {}
        throw new Error(errMsg || `Server error: ${modRes.status}`);
      }

      const modData = await modRes.json();
      if (!modData.success) throw new Error(modData.error);

      const nsbBlob = new Blob([Uint8Array.from(atob(modData.nsb_b64), c => c.charCodeAt(0))], { type: "application/octet-stream" });
      const scbBlob = new Blob([Uint8Array.from(atob(modData.scb_b64), c => c.charCodeAt(0))], { type: "application/octet-stream" });

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
        setStatus("Patching libil2cpp.so...");
        const soRes = await fetch(`${BACKEND}/patch_so`, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "X-Offset": "0x378E0D8"
          },
          body: soFile
        });

        if (!soRes.ok) {
          const text = await soRes.text();
          let errMsg = text;
          try { errMsg = JSON.parse(text).error; } catch(e) {}
          throw new Error(errMsg || `Failed to patch .so: ${soRes.status}`);
        }

        const soBlob = await soRes.blob();
        setTimeout(() => {
          const a3 = document.createElement("a");
          a3.href = URL.createObjectURL(soBlob);
          a3.download = "libil2cpp_patched.so";
          a3.click();
        }, 1000);
      }

      setStatus("All files generated successfully! Check your Downloads folder.");
    } catch (err: any) {
      setError(err.message || String(err));
      setStatus("");
    }
    setIsLoading(false);
  };

  const downloadPythonScript = () => {
    window.location.href = `${BACKEND}/download_standalone`;
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

# Push with the EXACT filenames the game expects
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
& $adb shell "su -c 'ls $pkg/pp/'" # Note the 11-digit folder name (your ID)
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
& $adb shell "su -c id" # Tap "Grant" again when the popup appears.

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
1. Upload the pulled nsb_live, scb_live, and libil2cpp_original.so into the web tool.
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

# CRITICAL: Fix permissions so the game doesn't infinite load
& $adb shell "su -c 'chmod 755 $libPath'"
& $adb shell "su -c 'restorecon -v $libPath'"

--- STEP 15: MAVERICK INJECTION (DO NOT LAUNCH) ---
$pkg = "/data/media/0/Android/data/com.naturalmotion.customstreetracer2/files"
& $adb push "C:\\Path\\To\\Downloads\\nsb_modded" /sdcard/nsb_new
& $adb push "C:\\Path\\To\\Downloads\\scb_modded" /sdcard/scb_new

# Auto-detect the active ID folder
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

# CRITICAL: Fix SELinux context so the game can read the injected files
& $adb shell "su -c 'restorecon -RF $pkg/pp'"

--- STEP 16: LAUNCH & CHOOSE LOCAL ---
# Grant All Files Access
& $adb shell "pm grant com.naturalmotion.customstreetracer2 android.permission.READ_EXTERNAL_STORAGE"
& $adb shell "appops set com.naturalmotion.customstreetracer2 MANAGE_EXTERNAL_STORAGE allow"

# Launch
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
          <p className="text-sm text-muted mt-1">Generates modded NSB, SCB, and patched libil2cpp.so.</p>
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
              <button onClick={downloadPythonScript} className="bg-primary hover:bg-primary/80 text-primary-fg font-bold py-2 px-4 rounded text-sm transition">
                [Download] Standalone Modder (.py)
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-primary mb-2">Step 1: Download Required Files</h4>
                <ul className="list-disc ml-5 text-sm space-y-1 text-fg">
                  <li>CSR 2 APK + OBB: <a href="https://apkpure.com/csr-2-realistic-drag-racing/com.naturalmotion.customstreetracer2/download" target="_blank" rel="noopener noreferrer" className="text-primary underline">APKPure (Latest XAPK)</a></li>
                  <li>Magisk.apk: <a href="https://github.com/topjohnwu/Magisk/releases" target="_blank" rel="noopener noreferrer" className="text-primary underline">GitHub Releases</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-primary mb-2">Step 2: Root the Emulator</h4>
                <pre className="bg-[#0a0b08] p-3 rounded text-xs overflow-x-auto text-[#a39e8c] border border-border">
{`$adb = "C:\\Program Files\\Google\\Play Games Developer Emulator\\current\\emulator\\adb.exe"
& $adb install "C:\\Path\\To\\Magisk.apk"
# Open Magisk app inside the emulator. Let it complete "Additional Setup" and reboot.`}
                </pre>
              </div>

              <div>
                <h4 className="font-bold text-primary mb-2">Step 3: Grant ADB Root Access</h4>
                <p className="text-sm text-muted mb-2">A popup will appear on the emulator screen. Tap "Grant". The output must say uid=0(root).</p>
                <pre className="bg-[#0a0b08] p-3 rounded text-xs overflow-x-auto text-[#a39e8c] border border-border">
{`& $adb shell "su -c id"`}
                </pre>
              </div>

              <div>
                <h4 className="font-bold text-primary mb-2">Step 4: Install Game APK</h4>
                <pre className="bg-[#0a0b08] p-3 rounded text-xs overflow-x-auto text-[#a39e8c] border border-border">
{`& $adb install -r "C:\\Path\\To\\com.naturalmotion.customstreetracer2.apk"`}
                </pre>
              </div>

              <div>
                <h4 className="font-bold text-primary mb-2">Step 5: Push OBB Files</h4>
                <pre className="bg-[#0a0b08] p-3 rounded text-xs overflow-x-auto text-[#a39e8c] border border-border">
{`$obbDest = "/data/media/0/Android/obb/com.naturalmotion.customstreetracer2"
& $adb shell "su -c 'mkdir -p $obbDest'"
& $adb shell "su -c 'mkdir -p /sdcard/temp_obb'"
& $adb push "C:\\Path\\To\\main.6805204.com.naturalmotion.customstreetracer2.obb" /sdcard/temp_obb/main.6805204.com.naturalmotion.customstreetracer2.obb
& $adb push "C:\\Path\\To\\patch.6805204.com.naturalmotion.customstreetracer2.obb" /sdcard/temp_obb/patch.6805204.com.naturalmotion.customstreetracer2.obb
& $adb shell "su -c 'mv /sdcard/temp_obb/*.obb $obbDest/'"
& $adb shell "su -c 'rm -rf /sdcard/temp_obb'"`}
                </pre>
              </div>

              <div>
                <h4 className="font-bold text-primary mb-2">Step 6: Verify OBB Files & Get UID</h4>
                <pre className="bg-[#0a0b08] p-3 rounded text-xs overflow-x-auto text-[#a39e8c] border border-border">
{`& $adb shell "su -c 'ls -l $obbDest'"
$uidLine = & $adb shell "pm list packages -U com.naturalmotion.customstreetracer2"
$uid = ($uidLine -split 'uid:')[1].Trim()
Write-Host "Your Game UID is: $uid"
& $adb shell "su -c 'chown -R \${uid}:\${uid} $obbDest'"
& $adb shell "su -c 'chmod -R 777 $obbDest'"`}
                </pre>
              </div>

              <div>
                <h4 className="font-bold text-primary mb-2">Step 7: Launch & Complete Tutorial (CRITICAL)</h4>
                <p className="text-sm text-muted mb-2">You MUST complete the tutorial on this first boot. Do not inject any files yet. If you skip the tutorial, the game's state machine will soft-lock or strip the cars later. Play until you reach the fully interactive garage, then force close the game.</p>
                <pre className="bg-[#0a0b08] p-3 rounded text-xs overflow-x-auto text-[#a39e8c] border border-border">
{`& $adb shell "am force-stop com.naturalmotion.customstreetracer2"
$pkg = "/data/media/0/Android/data/com.naturalmotion.customstreetracer2/files"
& $adb shell "su -c 'ls $pkg/pp/'" # Note the 11-digit folder name (your ID)
$id = "<YOUR_ID_FROM_ABOVE>"
$pathOutput = & $adb shell "pm path com.naturalmotion.customstreetracer2"
$apkPath = ($pathOutput -split "package:")[1].Trim() -replace "\`r", "" -replace "\`n", ""
$libPath = $apkPath.Replace("/base.apk", "/lib/arm64/libil2cpp.so")
& $adb shell "su -c 'cp $pkg/pp/$id/nsb /sdcard/nsb'"
& $adb shell "su -c 'cp $pkg/pp/$id/scb /sdcard/scb'"
& $adb shell "su -c 'cp $libPath /sdcard/libil2cpp.so'"
& $adb pull /sdcard/nsb "C:\\Path\\To\\Downloads\\nsb_live"
& $adb pull /sdcard/scb "C:\\Path\\To\\Downloads\\scb_live"
& $adb pull /sdcard/libil2cpp.so "C:\\Path\\To\\Downloads\\libil2cpp_original.so"`}
                </pre>
              </div>

              <div>
                <h4 className="font-bold text-primary mb-2">Step 8: Verify Pulled Files</h4>
                <pre className="bg-[#0a0b08] p-3 rounded text-xs overflow-x-auto text-[#a39e8c] border border-border">
{`& $adb shell "su -c 'ls -l /sdcard/nsb /sdcard/scb /sdcard/libil2cpp.so'"`}
                </pre>
              </div>

              <div>
                <h4 className="font-bold text-primary mb-2">Step 9: Scratch Scratch Reset</h4>
                <p className="text-sm text-muted mb-2">You must remove the account to force a fresh device state. Use the EXACT SAME Google Play account you just used.</p>
                <ul className="list-disc ml-5 text-sm space-y-1 text-fg">
                  <li>Open Emulator Settings.</li>
                  <li>Go to Accounts.</li>
                  <li>Click your Google email.</li>
                  <li>Click "Remove account" (This signs you out immediately).</li>
                  <li>Sign back into the emulator with your Google account.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-primary mb-2">Step 10: Reinstall Magisk</h4>
                <p className="text-sm text-muted mb-2">A popup will appear on the emulator screen. Tap "Grant".</p>
                <pre className="bg-[#0a0b08] p-3 rounded text-xs overflow-x-auto text-[#a39e8c] border border-border">
{`& $adb install -r "C:\\Path\\To\\Magisk.apk"
& $adb shell "su -c id"`}
                </pre>
              </div>

              <div>
                <h4 className="font-bold text-primary mb-2">Step 11: Reinstall Game APK & OBB</h4>
                <pre className="bg-[#0a0b08] p-3 rounded text-xs overflow-x-auto text-[#a39e8c] border border-border">
{`& $adb install -r "C:\\Path\\To\\com.naturalmotion.customstreetracer2.apk"
$obbDest = "/data/media/0/Android/obb/com.naturalmotion.customstreetracer2"
& $adb shell "su -c 'mkdir -p $obbDest'"
& $adb shell "su -c 'mkdir -p /sdcard/temp_obb'"
& $adb push "C:\\Path\\To\\main.6805204.com.naturalmotion.customstreetracer2.obb" /sdcard/temp_obb/main.6805204.com.naturalmotion.customstreetracer2.obb
& $adb push "C:\\Path\\To\\patch.6805204.com.naturalmotion.customstreetracer2.obb" /sdcard/temp_obb/patch.6805204.com.naturalmotion.customstreetracer2.obb
& $adb shell "su -c 'mv /sdcard/temp_obb/*.obb $obbDest/'"
& $adb shell "su -c 'rm -rf /sdcard/temp_obb'"`}
                </pre>
              </div>

              <div>
                <h4 className="font-bold text-primary mb-2">Step 12: Verify OBB Files & Update UID</h4>
                <pre className="bg-[#0a0b08] p-3 rounded text-xs overflow-x-auto text-[#a39e8c] border border-border">
{`$uidLine = & $adb shell "pm list packages -U com.naturalmotion.customstreetracer2"
$uid = ($uidLine -split 'uid:')[1].Trim()
Write-Host "New Game UID: $uid"
& $adb shell "su -c 'chown -R \${uid}:\${uid} $obbDest'"
& $adb shell "su -c 'chmod -R 777 $obbDest'"
& $adb shell "su -c 'ls -l $obbDest'"`}
                </pre>
              </div>

              <div>
                <h4 className="font-bold text-primary mb-2">Step 13: Mod Files</h4>
                <p className="text-sm text-muted mb-2">Upload the pulled nsb_live, scb_live, and libil2cpp_original.so into the web tool. Download the modded nsb_modded, scb_modded, and libil2cpp_patched.so.</p>
              </div>

              <div>
                <h4 className="font-bold text-primary mb-2">Step 14: Push Patched .SO</h4>
                <pre className="bg-[#0a0b08] p-3 rounded text-xs overflow-x-auto text-[#a39e8c] border border-border">
{`$pathOutput = & $adb shell "pm path com.naturalmotion.customstreetracer2"
$apkPath = ($pathOutput -split "package:")[1].Trim() -replace "\`r", "" -replace "\`n", ""
$libPath = $apkPath.Replace("/base.apk", "/lib/arm64/libil2cpp.so")

& $adb push "C:\\Path\\To\\Downloads\\libil2cpp_patched.so" /sdcard/libil2cpp.so
& $adb shell "su -c 'mount -o rw,remount /data'"
& $adb shell "su -c 'cat /sdcard/libil2cpp.so > $libPath'"
& $adb shell "su -c 'sync'"
& $adb shell "su -c 'rm /sdcard/libil2cpp.so'"

# CRITICAL: Fix permissions so the game doesn't infinite load
& $adb shell "su -c 'chmod 755 $libPath'"
& $adb shell "su -c 'restorecon -v $libPath'"`}
                </pre>
              </div>

              <div>
                <h4 className="font-bold text-primary mb-2">Step 15: Maverick Injection (DO NOT LAUNCH)</h4>
                <pre className="bg-[#0a0b08] p-3 rounded text-xs overflow-x-auto text-[#a39e8c] border border-border">
{`$pkg = "/data/media/0/Android/data/com.naturalmotion.customstreetracer2/files"
& $adb push "C:\\Path\\To\\Downloads\\nsb_modded" /sdcard/nsb_new
& $adb push "C:\\Path\\To\\Downloads\\scb_modded" /sdcard/scb_new

# Auto-detect the active ID folder
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

# CRITICAL: Fix SELinux context so the game can read the injected files
& $adb shell "su -c 'restorecon -RF $pkg/pp'"`}
                </pre>
              </div>

              <div>
                <h4 className="font-bold text-primary mb-2">Step 16: Launch & Choose Local</h4>
                <pre className="bg-[#0a0b08] p-3 rounded text-xs overflow-x-auto text-[#a39e8c] border border-border">
{`# Grant All Files Access
& $adb shell "pm grant com.naturalmotion.customstreetracer2 android.permission.READ_EXTERNAL_STORAGE"
& $adb shell "appops set com.naturalmotion.customstreetracer2 MANAGE_EXTERNAL_STORAGE allow"

# Launch
& $adb shell "monkey -p com.naturalmotion.customstreetracer2 -c android.intent.category.LAUNCHER 1"`}
                </pre>
              </div>
            </div>
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
          <input type="checkbox" checked={addMoney} onChange={(e) => setAddMoney(e.target.checked)} className="w-4 h-4 accent-primary" />
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