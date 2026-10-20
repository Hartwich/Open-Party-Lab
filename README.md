# LDC Open Party Lab

Local multiplayer party game platform. One shared screen (host) and many phone controllers, synced over WebSockets.

## Mental model

- **Server is authoritative** (`apps/server`). Gameplay rules, timers, scoring, and round transitions live here. The host never becomes the source of truth.
- **Host** renders the shared screen. It shows game state but does not decide outcomes.
- **Controller** (phone) sends player intent and shows its own UI. It does not trust itself for game outcomes.
- **Protocol types** in `packages/protocol` are the shared room/socket contract between server, host, and controller.

## Apps

| App | Purpose | Port (dev) |
|-----|---------|------------|
| `apps/server` | Authoritative game engine, rooms, sockets | 3000 |
| `apps/host` | Shared screen / Phaser host scene | 5173 |
| `apps/controller` | Phone controller UI (React) | 5174 |
| `packages/*` | Shared protocol, game-core, ui-kit, utils | — |

## Important entry points

- Server game registry: `apps/server/src/game-engine/gameRegistry.ts`
- Host game registry: `apps/host/src/games/registry.ts`
- Controller game registry: `apps/controller/src/controller-ui/games/registry.tsx`
- Optional game list: `config/known-games.json`
- Local game generator: `scripts/local-games.mjs`
- Catalog: `packages/game-core/src/catalog/gameCatalog.ts`
- Room lifecycle: `apps/server/src/rooms/roomLifecycle.ts`

## Optional games

External game repos live under `local-games/` during development and are ignored by this repo. Missing repos are normal — do not add static imports to packages that might not exist locally.

See `config/known-games.json` and run:

```bash
npm run games:list          # see optional local game repos
npm run games:sync-local    # refresh generated platform registries
```

## Scripts

```bash
npm run typecheck   # typecheck all workspaces (also the lint step)
npm run build       # full build (packages, games, host, controller, server)
npm run dev         # run server + host + controller together
```

## Contribution rules

- Keep changes small (vertical slices: server, protocol, host, controller, docs together when behavior changes).
- Update `docs/project-status.md` when functionality or limitations change.
- Do not add generated output or assets with unclear rights to source control.
- For new games, follow `docs/minigame-sdk.md` and `docs/multi-repo-games.md`.
- Reuse existing controller layouts before inventing new ones.
- User-facing text goes through the i18n catalogs (`hostText.ts`, `controllerText.ts`) — do not scatter hard-coded strings.
- All games in this public cut are alpha.

## Hunter avatars

The controller ships a Hunter × Hunter–styled avatar set (`apps/controller/src/controller-ui/common/HunterAvatars.tsx`) with Gon, Killua, Kurapika, Hisoka, Chrollo, Leorio, Bisky, Netero, Ging, and Meruem, each rendered as an inline SVG with Nen type, color, and quote. Use `getAvatarById(id)` / `HunterAssociationSeal()` from that module.

Note: the current room join contract only sends `playerName`. Storing a chosen avatar per player requires a protocol + server + lobby change and is not yet wired end-to-end.
