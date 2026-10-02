# Open Party Lab – Portable Windows Build

1. Extract the complete ZIP archive to a normal folder.
2. Double-click `Open-Party-Lab.exe`.
3. The shared host screen opens automatically in your browser.
4. Players scan the QR code and open the controller page on phones connected to the same LAN/Wi-Fi.
5. Keep the small launcher window open while playing. Click **Stop** or close it to stop the server. Closing only the browser keeps the server running.

The launcher prefers the computer's active private Wi-Fi address and opens the host as `http://<LAN-IP>:<port>/`. It tries port 3000 first, then the first available port through 3099. The host, controller and QR link use the selected port. If no private LAN address is available, it warns and falls back to localhost until the computer is connected to a LAN or Wi-Fi network.

The portable build contains the server, host, controller, all game repositories, and its own Node.js runtime. Node.js and npm do not need to be installed.

Use Windows 10/11 on an x64 PC with a current browser. Share the complete ZIP, not just the EXE. After extraction, the bundled games run locally; downloading dependencies on the receiving PC is unnecessary. Individual games using online services still need an internet connection. Local rooms have no 60-minute lifetime limit. Rooms and scores live in memory and are cleared when you stop the program. Rooms without a host or connected players are still cleaned up after ten minutes of inactivity. The hosted server retains its one-hour lifetime and extension controls.

Windows may show a SmartScreen warning because this community build is not code-signed. You can inspect the Apache-2.0 source at https://github.com/Hartwich/Open-Party-Lab before running it.

If startup fails, check `open-party-lab.log`. At least one port between 3000 and 3099 must be available, and Windows Firewall must allow private-network access so phones can connect.

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

`release.json` records the build time, Node.js version, platform/game revisions, included game IDs, launcher checksum and whether the launcher binary was retained. The packaging check covers server startup, host/controller entry assets, room creation without local expiry and the complete external-game catalog. Physical phone connections, firewall prompts and gameplay on another PC still require device testing.

The launcher can also be checked without opening a browser with `Open-Party-Lab.exe --check`; it starts its own server on the selected free port, waits for health, stops it and returns an exit code. After building, `node scripts/check-room-lifetime.mjs` checks local unlimited lifetimes, hosted expiry/extension, and inactive-room cleanup with a simulated clock.

## Incremental launcher builds

The first incremental package, `Open-Party-Lab-windows-x64-step1-english.zip`, changes only the four bilingual launcher texts to English. It keeps the verified original server, host, controller, games and Node.js runtime byte-for-byte. Port 3000 and automatic room-code creation are unchanged. The original EXE, an unchanged-source recompilation, and the English-text-only EXE all passed the local `--check` start/shutdown check. The user confirmed this package works. Physical phone play remains unreported. The original ZIP remains available separately.

The step2 port-fallback EXE was initially blocked locally by Windows application control, as was a fresh compilation of the unchanged step1 source. The maintainer subsequently confirmed that the existing step2 EXE works and selected it for the updated release. Its binary is retained while the current server, host, controller and games are rebuilt.

To retain an existing verified launcher while rebuilding the platform, use:

```powershell
npm run release:windows -- artifacts/Open-Party-Lab-windows-x64-current --launcher-from artifacts/Open-Party-Lab-windows-x64-step2-port-fallback/Open-Party-Lab.exe
```

The retained EXE must have an adjacent `Launcher.cs` source snapshot matching the active `scripts/release/Launcher.cs`. The source check prevents accidentally retaining a launcher from a different code version. The existing step1 ZIP remains available as an earlier release.
