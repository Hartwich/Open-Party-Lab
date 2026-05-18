# Mini-Game SDK

Each game should provide:

- a catalog manifest in `packages/game-core`;
- a server implementation;
- a host view;
- a controller model or layout binding;
- protocol types when game-specific state or input is needed;
- registry entries in server, host, and controller.

## Server Contract

Server games generally implement these responsibilities:

- create initial runtime state;
- start a round;
- accept validated player input;
- advance state on ticks or timers;
- decide when a round is finished;
- build score entries;
- expose public state for host and controller rendering.

The exact interfaces are in `packages/game-core`.

## Integration Checklist

1. Add catalog text and manifest data.
2. Add protocol types under `packages/protocol/src/games`.
3. Add the server game under `apps/server/src/games/<game>`.
4. Add the host scene under `apps/host/src/games/<game>`.
5. Add controller bindings under `apps/controller/src/controller-ui/games/<game>`.
6. Add or reuse a controller layout in `apps/controller/src/controller-ui/layouts`.
7. Register the game in all registries.
8. Update docs and status.
9. Run `npm run typecheck`.
10. Run `npm run build` for release-facing changes.

## Design Guidance

- Keep simulation state serializable.
- Keep renderer objects out of server state.
- Keep inputs small and explicit.
- Use DOM/React for text-heavy phone controls.
- Use Phaser scenes for host playfield rendering.
- Prefer small vertical changes over broad rewrites.
