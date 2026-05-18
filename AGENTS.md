# AI Agent Guide

This file is for AI coding agents and humans using them.

## Mental Model

- The server is authoritative. Gameplay rules, timers, scoring, and round transitions belong in `apps/server`.
- The host renders the shared screen. It should not become the source of truth.
- The controller sends player intent and shows phone UI. It should not trust itself for game outcomes.
- Protocol types in `packages/protocol` are the contract between all three apps.
- Game catalog metadata in `packages/game-core` drives availability, display names, player counts, and layout selection.

## Important Entry Points

- Server game registry: `apps/server/src/game-engine/gameRegistry.ts`
- Host game registry: `apps/host/src/games/registry.ts`
- Controller game registry: `apps/controller/src/controller-ui/games/registry.tsx`
- Catalog: `packages/game-core/src/catalog/gameCatalog.ts`
- Shared protocol exports: `packages/protocol/src/index.ts`
- Room lifecycle: `apps/server/src/rooms/roomLifecycle.ts`
- Host router: `apps/host/src/app/router.ts`

## Public Source Boundaries

Do not reintroduce these without maintainer approval:

- private or hidden game prototypes excluded from this public cut
- removed experimental prototypes
- legacy experiment folders
- `Temp/`, `artifacts/`, build output, logs, or generated browser profiles

## Contribution Rules

- Keep changes small enough to review.
- Prefer vertical slices: server, protocol, host, controller, and docs together when behavior changes.
- Update `docs/project-status.md` when functionality or limitations change.
- Do not add assets with unclear rights.
- Do not add generated output to source control.
- For new games, follow `docs/minigame-sdk.md`.
- For UI changes, verify both desktop host and phone controller sizes.
- Keep naming, folder structure, state flow, and UI patterns consistent with nearby games before inventing new conventions.
- Treat localization as part of the feature design. User-facing text should be structured so multiple languages can be supported, using the existing language and catalog text patterns instead of scattering hard-coded strings through server, host, and controller code.
- Before creating a new controller layout, check `apps/controller/src/controller-ui/layouts`, `apps/controller/src/controller-ui/layouts/models.ts`, and existing game controller builders. Reuse or extend an existing controller when it fits; add a new one only when the interaction model genuinely needs it.
- When a new controller is needed, keep it generic enough that future games can reuse it and wire it through the registry with clear model types.
- All games in this public cut are alpha. Balance changes, pacing changes, and usability refinements are welcome, but document gameplay-impacting adjustments clearly.

## Verification

Run at least:

```bash
npm run typecheck
```

Run a full build when touching bundling, shared packages, game registries, Vite config, or publish-ready work:

```bash
npm run build
```

If you cannot run a check, state that clearly in the PR.
