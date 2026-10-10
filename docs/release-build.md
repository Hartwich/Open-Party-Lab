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

### Optional Windows hotspot test build

The separate hotspot launcher opens an English network setup dialog before starting the game. **Create Wi-Fi hotspot** is off by default. Enable it to edit the prefilled network name and generated password, then select **Start hotspot & game**. The running window displays a Wi-Fi QR code, credentials, and the device limit reported by Windows. Phones scan this QR to join Wi-Fi, then scan the separate game QR on the host screen. Wi-Fi QR recognition depends on the phone camera/scanner; manual credentials remain available.

Windows must support Mobile hotspot and provide a connection profile to share. This build does not create an offline virtual network adapter. Some Windows configurations or managed PCs may refuse hotspot control; the dialog reports the error and lets you use your existing network instead. An already active hotspot is left untouched. After starting its own hotspot, the launcher waits for its virtual adapter's IPv4 address and uses that address for host/controller links. Closing the launcher normally stops its server and its own hotspot; after a forced termination, check Windows Mobile hotspot settings yourself. Network name/password changes apply to Windows' hotspot configuration. Physical phone connections and firewall access still need device testing.

Build this variant into a separate directory:

```powershell
npm run release:windows -- artifacts/Open-Party-Lab-windows-x64-hotspot-test --hotspot-launcher
```

### Additional offline Wi-Fi variant (experimental)

Both hotspot launcher variants include **Keep laptop awake while playing (screen stays on)**, enabled by default and independent of hotspot creation. It requests Windows to prevent automatic system sleep and display idle-off while the game is running, then restores the launcher's prior execution state on exit. No permanent power-plan changes or administrator rights are required. Closing the lid, explicitly choosing Sleep, or critical battery conditions can still suspend the laptop. This option does not disable phone Wi-Fi switching or the Wi-Fi driver's own power management.

The setup dialog also prefills an editable four-character **Room code** (A-Z/0-9). The last selected code is saved in `room-code.txt` alongside the EXE when the directory is writable. **Open host** and the initial browser launch use the same room URL, preserving the room's players/game when opening another host tab. Restarting the app retains the selected code but starts a fresh in-memory game session. The local server creates its configured primary room on first host access and reuses it thereafter; hosted room lookup behavior is unchanged.

The running launcher places the Wi-Fi QR on the left only when a hotspot was started, status/buttons and a clickable controller join URL in the middle, and the controller QR on the right with a wide gap between the two codes. Both the controller QR and link include the selected room code. On an existing network, only the controller QR is displayed.

Compile with `--offline-hotspot-launcher` to add a mode selector to the hotspot setup dialog:

```powershell
npm run release:windows -- artifacts/Open-Party-Lab-windows-x64-offline-test --offline-hotspot-launcher
```

Choose **Offline local Wi-Fi (no internet required)** to create a standalone Wi-Fi Direct legacy access point. Keep the Wi-Fi radio enabled; a connection to an existing Wi-Fi network or the internet is not required. Phones join with the displayed Wi-Fi QR/password, then use the host's game QR. If the phone warns that the network has no internet, choose to stay connected. Games that require online services remain unavailable offline. Choose **Windows Mobile hotspot (share a connection)** for the existing sharing mode.

The offline helper remains alive until the launcher closes its input pipe, including after a launcher crash, and releases its own publisher in `finally`. It does not install adapters or alter Internet Connection Sharing settings. A supported Wi-Fi Direct driver and a newly assigned private IPv4 address are required; unsupported devices show an error instead of starting an unreachable game. An active Mobile hotspot is refused; Mobile hotspot/Miracast may conflict with Wi-Fi Direct. The device limit depends on the driver and is not reported as a fixed number. Phone connectivity and operation with the upstream Wi-Fi disconnected require physical device testing. `--hotspot-launcher` still compiles the previous dialog without the offline selector. Existing release ZIPs remain unchanged.

The normal launcher source and existing portable packages remain unchanged. `--hotspot-launcher` cannot be combined with `--launcher-from`. The hotspot variant also supports `--check` for server start/stop without changing Wi-Fi, and `--hotspot-check` for a read-only capability check (result in `hotspot-check.json`, errors in `open-party-lab.log`). Normal cleanup restores the Windows hotspot name/password/band saved before this session, provided its settings still match the session. The backend was checked on the development PC with hotspot IP 192.168.137.1 and an eight-device limit. Windows application control blocked the newly compiled unsigned EXE during subsequent checks; the final GUI/phone flow is therefore not confirmed. No Windows security settings were changed.

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
