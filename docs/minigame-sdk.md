# Mini-Game SDK

Each game should provide:

- a package manifest export;
- a server implementation;
- a host view;
- a controller model or layout binding;
- protocol types when game-specific state or input is needed;
- package entrypoints consumed by the platform registry generator.

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

## Package Entrypoints

External games must expose stable subpath exports:

```text
@open-party-lab/game-example/manifest
@open-party-lab/game-example/protocol
@open-party-lab/game-example/server
@open-party-lab/game-example/host
@open-party-lab/game-example/controller
```

The platform must not import private files from a game repo.

## Integration Checklist

1. Create or clone the game repo under `local-games/<repo-name>`.
2. Add the game to `config/known-games.json`.
3. Export manifest, protocol, server, host, and controller entrypoints.
4. Add or reuse a controller layout in the platform when the existing layouts are insufficient.
5. Run `npm run games:sync-local` from the platform.
6. Update docs and status.
7. Run `npm run typecheck`.
8. Run `npm run build` for release-facing changes.

## Design Guidance

- Keep simulation state serializable.
- Keep renderer objects out of server state.
- Keep inputs small and explicit.
- Use DOM/React for text-heavy phone controls.
- Use Phaser scenes for host playfield rendering.
- Prefer small vertical changes over broad rewrites.
