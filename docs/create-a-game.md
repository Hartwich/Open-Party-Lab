# Create A New Mini-Game

Open Party Lab supports optional game repos. A game can live in its own repository and be linked into the platform only when present locally.

## Mental Model

The platform owns:

- room creation and join flow;
- shared host/controller apps;
- generic lobby/setup rendering;
- generated optional game registries;
- reusable controller layouts;
- shared DTO and socket contracts.

A game repo owns:

- its manifest;
- game-specific protocol types;
- authoritative server logic;
- host rendering;
- controller model or layout binding;
- game-specific assets and docs.

The server must remain authoritative. Controllers should send player intent, not decide winners or score changes.

## Recommended Repo Layout

Use a short game id as the repository and folder name:

```text
Open-Party-Lab/
  local-games/
    example-game/
```

The npm package can use the scoped package name:

```text
@open-party-lab/game-example-game
```

## Required Public Entrypoints

External games should expose these subpath exports:

```text
@open-party-lab/game-example-game/manifest
@open-party-lab/game-example-game/protocol
@open-party-lab/game-example-game/server
@open-party-lab/game-example-game/host
@open-party-lab/game-example-game/controller
```

The platform should import only documented public entrypoints. Do not import private files from a game repo.

## Integration Checklist

1. Create or clone the game repo under `local-games/<game-id>`.
2. Add the game to `config/known-games.json`.
3. Export manifest, protocol, server, host, and controller entrypoints.
4. Reuse an existing controller layout where possible.
5. Add a new generic controller layout only when the interaction model genuinely needs it.
6. Run `npm run games:sync-local` from the platform repo.
7. Run `npm run typecheck`.
8. Run `npm run build` for release-facing changes.
9. Update docs and `docs/project-status.md` if status or limitations changed.

## Design Guidelines

Keep the first version small. A good first mini-game has:

- one clear round loop;
- explicit player inputs;
- serializable server state;
- simple scoring;
- host feedback that is readable from a TV;
- phone controls that work on small screens;
- no unclear third-party assets or names.

Avoid starting with advanced matchmaking, persistence, monetization, complex animations, or large asset pipelines.

## Testing Through The Platform

From the game repo:

```bash
npm install
npm run typecheck
npm run build
```

Then from the platform repo:

```bash
npm run games:sync-local
npm run typecheck
npm run dev:all
```

For AI or automated smoke checks, virtual controllers can join an existing room:

```bash
npm run ai:controllers -- --room DEBU --players 4 --ready true --hold-ms 600000
```

If the game needs input, pass game-specific input JSON:

```bash
npm run ai:controllers -- --room DEBU --players 4 --input-json "{\"type\":\"tap\"}" --input-duration-ms 3000
```

## Documentation For Each Game

Each game repo should include:

- a short README with status and screenshots;
- package entrypoints;
- development checks;
- known limitations;
- asset and rights notes;
- an `AGENTS.md` file for AI-assisted contributions.
