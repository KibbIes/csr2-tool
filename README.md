$readme = @"
# CSR2 Mod Generator 🏎️

A browser-based tool to generate modded save files (`nsb` / `scb`) and a patched `libil2cpp.so` for **CSR2 (Custom Street Racer 2)**. 

This tool runs entirely client-side. Your save files are parsed, modified, and repacked in your browser—no data is uploaded to a server.

## ✨ Features
* **Emulator vs. Phone Target:** Automatically adjusts the JSON generation (specifically the `cgpi` garage mapping) and the `.so` patch offsets depending on whether you are modding a PC emulator or a real rooted Android device.
* **Dynamic Signature Scanning:** No more hardcoded memory offsets. The tool scans your specific `libil2cpp.so` and dynamically patches `SyncProfile()` and `ShowForceProfileSyncPopup()` to completely bypass the cloud sync overwrite. Works on any CSR2 version.
* **Merge Mode:** Injects all 1,278 cars into your existing garage while preserving your level, progress, and current cars.
* **Replace Mode:** Wipes the garage and generates a fresh, fully-modded tutorial-complete save.
* **Resource Injection:** Maxes out Cash, Gold, Keys, and Fusion Parts.
* **Built-in Tutorial:** Generates downloadable step-by-step ADB/PowerShell guides directly inside the app.

---

## 🚀 Installation & Setup

### Prerequisites
You need [Node.js](https://nodejs.org/) installed (v18 or higher recommended). You will also need a package manager like `npm`, `pnpm`, or `yarn`.

### Local Development

1. **Clone the repository:**
   ``git clone https://github.com/YOUR_USERNAME/CSR2-Mod-Generator.git``
   ``cd CSR2-Mod-Generator``

2. **Install dependencies:**
   ``npm install``
   *(or pnpm install / yarn install)*

3. **Start the development server:**
   ``npm run dev``

4. **Open the app:**
   Navigate to ``http://localhost:3000`` (or the port specified in your terminal) in your browser.

### Building for Production
To create a production-ready build:
``npm run build``

---

## 📖 How to Use

1. **Select Target Device:** Choose **Emulator** or **Phone** at the top of the interface.
2. **Pull your files:** Use ADB to pull ``nsb``, ``scb``, and ``libil2cpp.so`` from your rooted device or emulator. *(Detailed instructions are provided inside the app).*
3. **Upload to the tool:** Drop the files into the web interface.
4. **Enter Player ID:** Use the 11-digit folder name from your save path.
5. **Generate:** Download the modded files and the patched ``.so``.
6. **Push to device:** Follow the exact ADB commands generated in the app's 8-step tutorial.

---

## 📦 Releases

Please check the [Releases](../../releases) page for the latest stable builds. 

* **Latest Release:** ``v1.1.0`` (Dynamic `.so` patching & Phone support)
* If you are hosting this locally or via Vercel/Netlify, you do not need to download the releases—just use the source code.

---

## 🛠️ Tech Stack
* **React** / **TypeScript** / **Tailwind CSS**
* **Pako** (GZIP compression/decompression)
* **Web Crypto API** (HMAC-SHA1 signature generation)

---

## ⚠️ Disclaimer
This tool is for educational purposes only. Modifying game files can result in a ban. Use at your own risk. The developers are not responsible for any account bans or device issues. Always backup your original ``nsb``, ``scb``, and ``libil2cpp.so`` files before modifying them.
"@

# Overwrite README.md
$readme | Out-File -FilePath "README.md" -Encoding utf8

# Stage, Commit, and Push
git add .
git commit -m "feat: implement dynamic .so signature scanning and Emulator/Phone toggle support"
git push
