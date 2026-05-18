# AI Handover

Start with the repository root:

1. `README.md`
2. `AGENTS.md`
3. `CONTRIBUTING.md`
4. `docs/project-status.md`
5. `docs/architecture.md`
6. `docs/minigame-sdk.md`

Fast orientation:

- server logic: `apps/server/src`
- host rendering: `apps/host/src`
- phone controller UI: `apps/controller/src`
- shared contracts: `packages/protocol/src`
- game catalog: `packages/game-core/src/catalog`

Before changing game behavior, inspect the server registry, host registry, controller registry, and protocol types together.
