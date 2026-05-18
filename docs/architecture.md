# Architecture

Open Party Lab is a TypeScript npm-workspace monorepo for local browser party games.

## Applications

- `apps/server` is the authoritative Socket.IO server. It owns rooms, players, round timing, gameplay rules, scoring, and lifecycle transitions.
- `apps/host` is the shared-screen Phaser application. It renders the lobby, game select flow, QR join overlay, scoreboards, and game host scenes.
- `apps/controller` is the React phone UI. It renders the player controller for the selected game and sends typed input to the server.

## Shared Packages

- `packages/protocol`: event names, client/server event payloads, DTOs, game-specific payloads
- `packages/game-core`: game manifests, catalog, localization hooks, round phase helpers, shared gameplay contracts
- `packages/ui-kit`: shared UI tokens
- `packages/utils`: generic utilities

## Core Rules

1. The server is the single source of truth.
2. Controllers send intent; they do not decide outcomes.
3. Host scenes render state; they do not own game rules.
4. Protocol types are the contract between all apps.
5. New games should be additive: manifest, server implementation, host scene, controller model, registry entries, docs.

## Runtime Flow

1. Host creates a room through `room:create`.
2. Server returns a room code and join URL.
3. Host displays the room code and QR overlay.
4. Phones join through the controller app.
5. Host selects a game from the available catalog.
6. Server starts and advances the round lifecycle.
7. Controller inputs flow through `game:input`.
8. Server broadcasts `game:state` or `game:patch`.
9. Host and controllers render the latest public state.
10. Server publishes scoreboard updates.

## Round Lifecycle

Room and round phases are shared across games:

- `lobby`
- `game_selected`
- `round_intro`
- `countdown`
- `playing`
- `locked`
- `result`
- `scoreboard`
- `finished`

Game-specific state should fit inside this lifecycle unless there is a strong reason to extend the platform.

## Registries

Main registry files:

- `packages/game-core/src/catalog/gameCatalog.ts`
- `apps/server/src/game-engine/gameRegistry.ts`
- `apps/host/src/games/registry.ts`
- `apps/controller/src/controller-ui/games/registry.tsx`

If a game is added or removed, check all of them.
