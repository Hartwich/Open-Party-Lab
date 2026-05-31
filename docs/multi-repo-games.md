# Multi-Repo Games

Open Party Lab supports optional local game repos. You do not need every game repo. The platform loads only games that exist locally and are linked by `npm run games:sync-local`.

## Recommended Layout

Use child repos inside the platform working tree:

```text
Open-Party-Lab/
  local-games/
    tap-race/
```

`local-games/` is ignored by the platform repo, so each child folder can be its own Git repository.

New game repos should use the short game name as the repo and folder name, for example `tap-race` or `light-trails`, not an `open-party-game-` prefix. The npm package name may still use `@open-party-lab/game-<game-id>`.

The generator also accepts the older sibling layout as a fallback:

```text
OpenParty/
  Open-Party-Lab/
  tap-race/
```

## Commands

List known optional games:

```bash
npm run games:list
```

Clone optional games:

```bash
git clone https://github.com/Hartwich/open-party-game-tap-race.git local-games/tap-race
git clone https://github.com/Hartwich/air-hockey.git local-games/air-hockey
git clone https://github.com/Hartwich/tabu.git local-games/tabu
git clone https://github.com/Hartwich/imposter.git local-games/imposter
git clone https://github.com/Hartwich/schaetzorama.git local-games/schaetzorama
git clone https://github.com/Hartwich/light-trails.git local-games/light-trails
```

Link local games:

```bash
npm run games:sync-local
```

Clear local links:

```bash
npm run games:clear-local
```

Normal scripts call the sync step automatically:

```bash
npm run typecheck
npm run build
npm run dev:all
```

## Game Package Contract

External games expose only these public entrypoints:

```text
@open-party-lab/game-tap-race/manifest
@open-party-lab/game-tap-race/protocol
@open-party-lab/game-tap-race/server
@open-party-lab/game-tap-race/host
@open-party-lab/game-tap-race/controller
```

For Air Hockey, Tabu, Imposter, Schaetzorama, and Light Trails, the same contract uses the matching package name such as `@open-party-lab/game-air-hockey/...` or `@open-party-lab/game-light-trails/...`.

The platform generates registry imports only for local repos that exist and build successfully. Missing repos are skipped.

## AI Agent Workflow

Use the Codex in-app browser for visual checks and screenshots. Do not fall back to external browser executables for README or QA screenshots unless the maintainer explicitly asks for that.

Virtual controllers can be joined to an existing browser-hosted room without opening phone browser tabs:

```bash
npm run ai:controllers -- --room DEBU --players 4 --ready true --hold-ms 600000
```

The helper is game-agnostic. If a game needs input during the check, pass that game's input shape as JSON:

```bash
npm run ai:controllers -- --room DEBU --players 4 --input-json "{\"type\":\"tap\"}" --input-duration-ms 3000
```

When working on one game, open that game repo directly and run:

```bash
npm install
npm run typecheck
npm run build
```

Then test it through the platform:

```bash
cd ../..
npm run games:sync-local
npm run typecheck
npm run dev:all
```

If Firefox is used as a phone controller, verify carefully. Chromium-based browsers and Safari are recommended because Firefox can show issues around fullscreen, reconnect/session handling, or touch timing.
