CSR2 Save Editor 🏎️
⚠️ DISCLAIMER

Not all emulators are tested. Not all phone types are tested.

If you run into issues, join this Discord: https://discord.gg/F924yndEjA

This tool is for educational purposes only. Modifying game files can result in a ban. Use at your own risk. The developer is not responsible for any account bans or device issues. Always backup your original nsb and scb files before modifying them.

This tool is not affiliated with Zynga, NaturalMotion, or CSR2.

A 100% free, fully offline browser-based tool to generate modded save files (nsb / scb) for CSR2 (Custom Street Racer 2). This tool runs entirely client-side. Your save files are parsed, modified, and repacked in your browser — no data is uploaded to a server. No backend, no license codes, no internet required.

✨ Features
Emulator vs. Phone Support: Automatically adjusts the JSON generation depending on whether you are modding a PC emulator or a real rooted Android device.

God Inbox: Inject Stage 6 parts, fusions, Elite Tokens, wildcard tokens, stickers, banners, and more directly into your in-game inbox. Fully unlocked — no license needed.

Merge Mode: Injects all 1,278+ cars into your existing garage while preserving your level, progress, and current cars.

Replace Mode: Wipes the garage and generates a fresh, fully-modded tutorial-complete save.

Resource Injection: Maxes out Cash, Gold, Keys, and Fusion Parts.

Built-in Tutorial: Tells you how to use it!

🚀 Installation & Setup
Prerequisites
Node.js (v18 or higher)

npm (comes with Node.js)

Local Development
Clone the repository:

bash
git clone https://github.com/KibbIes/csr2-tool.git
cd csr2-tool
Install dependencies:

bash
npm install
Start the development server:

bash
npm run dev
Open the app: Navigate to http://localhost:8080 in your browser.

Building for Production
bash
npm run build
Then serve the dist/ folder with any static file server.

📖 How to Use
Select Target Device: Choose Emulator or Phone at the top of the interface.

Pull your files: Use ADB to pull nsb and scb from your rooted device or emulator. (Detailed instructions are provided inside the app.)

Upload to the tool: Drop the files into the web interface.

Enter Player ID: Use the 11-digit folder name from your save path.

Choose your mods: Add cars, set cash/gold, inject God Inbox rewards.

Generate: Download the modded nsb and scb files.

Push to device: Follow the exact ADB commands generated in the app's built-in tutorial.

Choose "Local Save" when the game launches.

📦 Releases
Please check the Releases page for the latest stable builds.

Legacy Version: The old online version (with license system) is preserved at tag v1.1.0 in the Releases page. It is no longer maintained.

If you are hosting this locally, you do not need to download the releases — just use the source code.

🛠️ Tech Stack
React / TypeScript / Tailwind CSS

Pako (GZIP compression/decompression)

Web Crypto API (HMAC-SHA1 signature generation)

TanStack Router / Vite

📜 License
This project is source-available, non-commercial. You may:

✅ Use it for free

✅ Modify it for personal use

✅ Fork it on GitHub

You may NOT:

❌ Sell it or put it behind a paywall

❌ Claim it as your own work

❌ Redistribute compiled builds without permission

See LICENSE for full terms.

🙏 Credits
Made by KibbIes (GitHub) / Klbbies (Discord). Special thanks to the CSR2 modding community for testing and feedback.

Enjoy, and drive safe. 🏁
