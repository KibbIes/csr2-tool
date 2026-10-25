# CSR2 Maverick Modding Tool

A complete web-based and standalone tool for modding CSR2 on the Google Play Games Developer Emulator (GPGDE). Safely injects 1,278 maxed cars, cash, gold, and specific currencies without breaking your PlayerProfile or skyrocketing your Level.

## Prerequisites
- Google Play Games Developer Emulator installed.
- ADB (Android Debug Bridge) installed.
- PowerShell 5.1+ running as Administrator.
- Make sure to replace C:\Path\To\... with your actual local file paths.

---

## The 16-Step Guide

### Step 1: Download Required Files
- CSR 2 APK + OBB (Version 6.8.0 / 6805204)
- Magisk.apk

### Step 2: Root the Emulator
    $adb = "C:\Program Files\Google\Play Games Developer Emulator\current\emulator\adb.exe"
    & $adb install "C:\Path\To\Magisk.apk"
    # Open Magisk app inside the emulator. Let it complete "Additional Setup" and reboot.

### Step 3: Grant ADB Root Access
A popup will appear on the emulator screen. Tap "Grant". The output must say uid=0(root).
    & $adb shell "su -c id"

### Step 4: Install Game APK
    & $adb install -r "C:\Path\To\com.naturalmotion.customstreetracer2.apk"

### Step 5: Push OBB Files
    $obbDest = "/data/media/0/Android/obb/com.naturalmotion.customstreetracer2"
    & $adb shell "su -c 'mkdir -p $obbDest'"
    & $adb shell "su -c 'mkdir -p /sdcard/temp_obb'"

    & $adb push "C:\Path\To\main.6805204.com.naturalmotion.customstreetracer2.obb" /sdcard/temp_obb/main.6805204.com.naturalmotion.customstreetracer2.obb
    & $adb push "C:\Path\To\patch.6805204.com.naturalmotion.customstreetracer2.obb" /sdcard/temp_obb/patch.6805204.com.naturalmotion.customstreetracer2.obb

    & $adb shell "su -c 'mv /sdcard/temp_obb/*.obb $obbDest/'"
    & $adb shell "su -c 'rm -rf /sdcard/temp_obb'"

### Step 6: Verify OBB Files & Get UID
    & $adb shell "su -c 'ls -l $obbDest'"
    $uidLine = & $adb shell "pm list packages -U com.naturalmotion.customstreetracer2"
    $uid = ($uidLine -split 'uid:')[1].Trim()
    Write-Host "Your Game UID is: $uid"

    & $adb shell "su -c 'chown -R ${uid}:${uid} $obbDest'"
    & $adb shell "su -c 'chmod -R 777 $obbDest'"

### Step 7: Launch & Complete Tutorial (CRITICAL)
You MUST complete the tutorial on this first boot. Do not inject any files yet. If you skip the tutorial, the game's state machine will soft-lock or strip the cars later. Play until you reach the fully interactive garage, then force close the game.

    & $adb shell "am force-stop com.naturalmotion.customstreetracer2"
    $pkg = "/data/media/0/Android/data/com.naturalmotion.customstreetracer2/files"
    & $adb shell "su -c 'ls $pkg/pp/'" # Note the 11-digit folder name (your ID)
    $id = "<YOUR_ID_FROM_ABOVE>"

    $pathOutput = & $adb shell "pm path com.naturalmotion.customstreetracer2"
    $apkPath = ($pathOutput -split "package:")[1].Trim() -replace "`r", "" -replace "`n", ""
    $libPath = $apkPath.Replace("/base.apk", "/lib/arm64/libil2cpp.so")

    & $adb shell "su -c 'cp $pkg/pp/$id/nsb /sdcard/nsb'"
    & $adb shell "su -c 'cp $pkg/pp/$id/scb /sdcard/scb'"
    & $adb shell "su -c 'cp $libPath /sdcard/libil2cpp.so'"

    & $adb pull /sdcard/nsb "C:\Path\To\Downloads\nsb_live"
    & $adb pull /sdcard/scb "C:\Path\To\Downloads\scb_live"
    & $adb pull /sdcard/libil2cpp.so "C:\Path\To\Downloads\libil2cpp_original.so"

### Step 8: Verify Pulled Files
    & $adb shell "su -c 'ls -l /sdcard/nsb /sdcard/scb /sdcard/libil2cpp.so'"

### Step 9: Scratch Scratch Reset
1. Open the Emulator Settings.
2. Go to Accounts.
3. Click your Google email.
4. Click "Remove account" (This wipes the emulator).
5. Sign back into the emulator with the EXACT SAME Google Play account you just used.

### Step 10: Reinstall Magisk
A popup will appear on the emulator screen. Tap "Grant".
    & $adb install -r "C:\Path\To\Magisk.apk"
    & $adb shell "su -c id"

### Step 11: Reinstall Game APK & OBB
    & $adb install -r "C:\Path\To\com.naturalmotion.customstreetracer2.apk"
    $obbDest = "/data/media/0/Android/obb/com.naturalmotion.customstreetracer2"
    & $adb shell "su -c 'mkdir -p $obbDest'"
    & $adb shell "su -c 'mkdir -p /sdcard/temp_obb'"

    & $adb push "C:\Path\To\main.6805204.com.naturalmotion.customstreetracer2.obb" /sdcard/temp_obb/main.6805204.com.naturalmotion.customstreetracer2.obb
    & $adb push "C:\Path\To\patch.6805204.com.naturalmotion.customstreetracer2.obb" /sdcard/temp_obb/patch.6805204.com.naturalmotion.customstreetracer2.obb

    & $adb shell "su -c 'mv /sdcard/temp_obb/*.obb $obbDest/'"
    & $adb shell "su -c 'rm -rf /sdcard/temp_obb'"

### Step 12: Verify OBB Files & Update UID
    $uidLine = & $adb shell "pm list packages -U com.naturalmotion.customstreetracer2"
    $uid = ($uidLine -split 'uid:')[1].Trim()
    Write-Host "New Game UID: $uid"

    & $adb shell "su -c 'chown -R ${uid}:${uid} $obbDest'"
    & $adb shell "su -c 'chmod -R 777 $obbDest'"
    & $adb shell "su -c 'ls -l $obbDest'"

### Step 13: Mod Files
1. Upload the pulled nsb_live, scb_live, and libil2cpp_original.so into the web tool.
2. Download the modded nsb_modded, scb_modded, and libil2cpp_patched.so.

### Step 14: Push Patched .SO
    $pathOutput = & $adb shell "pm path com.naturalmotion.customstreetracer2"
    $apkPath = ($pathOutput -split "package:")[1].Trim() -replace "`r", "" -replace "`n", ""
    $libPath = $apkPath.Replace("/base.apk", "/lib/arm64/libil2cpp.so")

    & $adb push "C:\Path\To\Downloads\libil2cpp_patched.so" /sdcard/libil2cpp.so
    & $adb shell "su -c 'mount -o rw,remount /data'"
    & $adb shell "su -c 'cat /sdcard/libil2cpp.so > $libPath'"
    & $adb shell "su -c 'sync'"
    & $adb shell "su -c 'rm /sdcard/libil2cpp.so'"

    # CRITICAL: Fix permissions so the game doesn't infinite load
    & $adb shell "su -c 'chmod 755 $libPath'"
    & $adb shell "su -c 'restorecon -v $libPath'"

### Step 15: Maverick Injection (DO NOT LAUNCH)
    $pkg = "/data/media/0/Android/data/com.naturalmotion.customstreetracer2/files"
    & $adb push "C:\Path\To\Downloads\nsb_modded" /sdcard/nsb_new
    & $adb push "C:\Path\To\Downloads\scb_modded" /sdcard/scb_new

    # Auto-detect the active ID folder
    $idLine = & $adb shell "su -c 'ls $pkg/pp/'" | Where-Object { $_ -match '^\d{11}$' }
    $id = $idLine.Trim()

    & $adb shell "su -c 'mkdir -p $pkg/pp/$id'"
    & $adb shell "su -c 'mkdir -p $pkg/pp/temp'"
    & $adb shell "su -c 'cp /sdcard/nsb_new $pkg/pp/$id/nsb'"
    & $adb shell "su -c 'cp /sdcard/scb_new $pkg/pp/$id/scb'"
    & $adb shell "su -c 'cp /sdcard/nsb_new $pkg/pp/temp/nsb'"
    & $adb shell "su -c 'cp /sdcard/scb_new $pkg/pp/temp/scb'"

    & $adb shell "su -c 'chown -R ${uid}:${uid} $pkg/pp'"
    & $adb shell "su -c 'chmod -R 777 $pkg/pp'"

    # CRITICAL: Fix SELinux context so the game can read the injected files
    & $adb shell "su -c 'restorecon -RF $pkg/pp'"

### Step 16: Launch & Choose Local
    # Grant All Files Access
    & $adb shell "pm grant com.naturalmotion.customstreetracer2 android.permission.READ_EXTERNAL_STORAGE"
    & $adb shell "appops set com.naturalmotion.customstreetracer2 MANAGE_EXTERNAL_STORAGE allow"

    # Launch
    & $adb shell "monkey -p com.naturalmotion.customstreetracer2 -c android.intent.category.LAUNCHER 1"

1. Launch CSR2.
2. Click "Local Save" (Left side).
3. Verify there are NO Sync Prompts and the tutorials are skipped. You are done!
