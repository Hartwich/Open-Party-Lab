# Open Party Lab – Portable Windows Build

1. Extract the complete ZIP archive to a normal folder.
2. Double-click `Open-Party-Lab.exe`.
3. The shared host screen opens automatically in your browser.
4. Players scan the QR code and open the controller page on phones connected to the same LAN/Wi-Fi.
5. Keep the small launcher window open while playing. Click **Stop** or close it to stop the server. Closing only the browser keeps the server running.

The launcher prefers the computer's active private Wi-Fi address and opens the host as `http://<LAN-IP>:3000/`. It uses that same address for the QR/controller link. If no private LAN address is available, it warns and falls back to localhost until the computer is connected to a LAN or Wi-Fi network.

The portable build contains the server, host, controller, all game repositories, and its own Node.js runtime. Node.js and npm do not need to be installed.

Use Windows 10/11 on an x64 PC with a current browser. Share the complete ZIP, not just the EXE. After extraction, the bundled games run locally; downloading dependencies on the receiving PC is unnecessary. Individual games using online services still need an internet connection. Rooms and scores live in memory and are cleared when you stop the program.

Windows may show a SmartScreen warning because this community build is not code-signed. You can inspect the Apache-2.0 source at https://github.com/Hartwich/Open-Party-Lab before running it.

If startup fails, check `open-party-lab.log`. Port 3000 must be available, and Windows Firewall must allow private-network access so phones can connect.

## Build from source

On Windows x64 with Node.js and npm installed:

```powershell
npm ci
npm run games:clone-all
npm run typecheck
npm run release:windows
```

`release:windows` rebuilds the platform with the correct controller asset paths and same-origin connections, verifies that every known game was included, copies the runtime and dependency licenses (including browser libraries), compiles the launcher, and checks an isolated copy of the package outside the source checkout. It then creates:

- `artifacts/Open-Party-Lab-windows-x64/` — extracted portable program
- `artifacts/Open-Party-Lab-windows-x64.zip` — file to share
- `artifacts/Open-Party-Lab-windows-x64.zip.sha256` — SHA-256 checksum

`release.json` records the build time, Node.js version and included game IDs. The packaging check covers server startup, host/controller entry assets, room creation and the complete external-game catalog. Physical phone connections, firewall prompts and gameplay on another PC still require device testing.

The launcher can also be checked without opening a browser with `Open-Party-Lab.exe --check`; it starts its own server, waits for health, stops it and returns an exit code. Port 3000 must be free for this check.

## Incremental launcher builds

The first incremental package, `Open-Party-Lab-windows-x64-step1-english.zip`, changes only the four bilingual launcher texts to English. It keeps the verified original server, host, controller, games and Node.js runtime byte-for-byte. Port 3000 and automatic room-code creation are unchanged. The original EXE, an unchanged-source recompilation, and the English-text-only EXE all passed the local `--check` start/shutdown check. The user confirmed this package works. Physical phone play remains unreported. The original ZIP remains available separately.

The separate step2 port-fallback experiment is not a verified release: local Windows application control blocked its newly compiled EXE before startup (event 3077). The retained step1 EXE still passed `--check`, but a new compilation of the identical step1 source was blocked too. The results therefore do not identify the port change as the cause. The current launcher source remains at step1; the experiment and control-check evidence are preserved under ignored artifacts.

The selected working release is `Open-Party-Lab-windows-x64-step1-english.zip`. Retain and share that exact verified ZIP: rebuilding the same source creates a new EXE and does not preserve the observed Windows approval of the existing file. Automatic port switching is excluded from the active release; if port 3000 is occupied, the launcher reports an error.
