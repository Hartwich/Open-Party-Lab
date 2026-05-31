# Multi-Repo Games

Open Party Lab supports optional local game repos. You do not need every game repo. The platform loads only games that exist locally and are linked by `npm run games:sync-local`.

## Recommended Layout

Use child repos inside the platform working tree:

```text
Open-Party-Lab/
  local-games/
    open-party-game-tap-race/
```

`local-games/` is ignored by the platform repo, so each child folder can be its own Git repository.

The generator also accepts the older sibling layout as a fallback:

```text
OpenParty/
  Open-Party-Lab/
  open-party-game-tap-race/
```

## Commands

List known optional games:

```bash
npm run games:list
```

Clone an optional game:

```bash
git clone https://github.com/Hartwich/open-party-game-tap-race.git local-games/open-party-game-tap-race
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

The platform generates registry imports only for local repos that exist and build successfully. Missing repos are skipped.

## AI Agent Workflow

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
