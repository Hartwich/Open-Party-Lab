# Open Party Lab

Open Party Lab is a local-first browser party-game environment built as an experiment in AI-assisted software development. The project exists because it is interesting to see how far human direction plus coding agents can take a multiplayer game platform.

The current public release is a clean source cut intended for GitHub collaboration. It does not include old Git history, local temp folders, build outputs, artifacts, unpublished ideas, or private and hidden game prototypes.

## What It Is

Open Party Lab runs three applications together:

- `apps/server`: authoritative Socket.IO room, round, score, and game-state server
- `apps/host`: Phaser host screen for a TV, monitor, or shared computer
- `apps/controller`: React phone controller used by players in the browser

Shared code lives in npm workspace packages:

- `packages/protocol`: Socket events, DTOs, and game-specific payload types
- `packages/game-core`: game manifests, shared game types, round helpers, and catalog data
- `packages/ui-kit`: shared visual tokens
- `packages/utils`: small shared utilities

This is intentionally published as a monorepo. The host, controller, server, and shared protocol change together, and splitting them into separate repositories would make game work harder rather than clearer.

## Current Status

This is a playable local prototype, not a hosted production service. It is designed for devices on the same LAN.

All included games are alpha versions. Rules, pacing, scoring, content, UI, and especially balancing are expected to change. Playtesting notes, balance proposals, and small polish improvements are very welcome.

Implemented platform features:

- room creation with room code, join URL, and QR overlay
- phone join flow
- reconnect support through device/session tokens
- shared round lifecycle across games
- scoreboards and post-round flow
- host controls for language, FPS, and player removal outside active rounds
- typed protocol shared by server, host, and controller

Public game catalog in this source cut:

- Drift Racer
- Chaos-Kommando
- Draw & Guess
- Schaetzorama
- Word Tiles
- Arena Survivor
- MinionsTD
- Imposter
- Tabu
- Pantomime
- Tap Race
- Air Hockey
- Light Trails

Not included in this public cut:

- private or hidden game prototypes that were not approved for public release
- removed experimental prototypes
- legacy experiment folders
- `Temp/`, `artifacts/`, `node_modules/`, `dist/`, logs, and local editor state

## Quick Start

Requirements:

- Node.js 20+
- npm 10+

From a fresh clone:

```bash
npm ci
npm run build
```

Run locally on Windows:

```bash
npm run dev:all
```

Run locally on any platform with three terminals:

```bash
npm run dev:server
npm run dev:host
npm run dev:controller
```

Default ports:

- Server: `http://localhost:3000`
- Host: `http://localhost:5173`
- Controller: `http://localhost:5174`

Useful scripts:

- `npm run dev:all`
- `npm run dev:stop`
- `npm run dev:server`
- `npm run dev:host`
- `npm run dev:controller`
- `npm run typecheck`
- `npm run build`

## LAN Setup

Phones must be able to reach the server and controller app through the host machine's LAN IP.

Example PowerShell setup:

```powershell
$env:PUBLIC_CONTROLLER_ORIGIN="http://192.168.178.20:5174"
$env:VITE_SERVER_URL="http://192.168.178.20:3000"
```

Then start the platform with `npm run dev:all` on Windows, or start the server, host, and controller scripts in separate terminals. Open the host app on the shared screen, and scan the QR code from each phone.

## Browser Notes

Use a Chromium-based browser or Safari for phone controllers when possible. Firefox can work, but controller sessions may sometimes have issues with fullscreen behavior, reconnect/session handling, or touch input timing.

The host screen is intended for a desktop browser. The controller is intended for phone-sized browser windows on the same network as the server.

## Collaboration

Developers and AI coding agents are welcome to improve the project. Good contributions are usually vertical: update the server logic, protocol types, host view, controller model, and docs together. Balancing and usability improvements are especially useful while the games are still in alpha.

Start with:

- [AGENTS.md](AGENTS.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/minigame-sdk.md](docs/minigame-sdk.md)
- [docs/project-status.md](docs/project-status.md)

Contributions are voluntary and unpaid. The maintainer may publish official builds, including a possible Steam release, to reach a larger player base. See [CONTRIBUTING.md](CONTRIBUTING.md) and [NOTICE.md](NOTICE.md).

## License

Code is licensed under the Apache License 2.0. See [LICENSE](LICENSE).

Assets, names, generated media, third-party references, and store distribution rights need separate care. See [NOTICE.md](NOTICE.md). This repository is not legal advice; get proper legal review before commercial distribution.
