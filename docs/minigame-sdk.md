# Mini-Game SDK

## What the platform provides

- the room: creation, join URL, QR code, room code, reconnects
- the catalog: browsing, selecting and configuring a game
- the round lifecycle: phases, timers, scoring storage, broadcast
- shared libraries: `game-core`, `protocol`, `ui-kit`, `utils`
- the audio engine and its instrument templates

## What a game provides

Everything a player looks at once a game has started. The platform has **no**
round-intro screen and **no** scoreboard screen — a game that does not render
its own result phase shows nothing after the round.

Each game exposes:

- a package manifest export;
- a server implementation;
- a host scene covering `round_intro` … `finished`;
- a controller model or layout binding;
- protocol types when game-specific state or input is needed.

## Host contract

The router hands the screen to the game's scene for every phase from
`round_intro` onwards and takes it back only for the lobby and the catalog. The
game's scene therefore has to branch on `state.game.phase` itself:

```ts
create(): void {
  const client = this.registry.get("hostClient") as HostClientLike;

  this.unsubscribe = client.subscribe((state) => {
    const phase = state.game?.phase;

    if (phase === "round_intro" || phase === "countdown") {
      this.renderIntro(state);
      return;
    }

    if (phase === "result" || phase === "scoreboard" || phase === "finished") {
      this.renderResult(state);
      return;
    }

    this.renderPlayfield(state);
  });
}
```

`state.scoreboard` carries the platform's score entries, so a result screen does
not have to recompute anything — it only has to draw.

## Manifest fields

Beyond the basics, a manifest declares how the platform should behave around it.
Everything here is optional; the defaults suit a simple game.

| Field | Purpose |
| --- | --- |
| `ownsScreens` | Which lifecycle screens the game renders. Declare `["round_intro", "result"]` once both exist — it documents the contract and is checked during review. |
| `hostChrome` | Suppress platform chrome on the shared screen: `joinOverlay`, `hud`, `roomCode`, `joinOverlayWhenFinished`. |
| `controllerChrome` | Suppress phone chrome: `minimal`, `wide`, `bare`, `hideSubtitle`. |
| `visual` | Catalog card appearance: `accent` (`#rrggbb`), `eyebrow`, optional `iconPath`. |
| `audio` | Background music: an instrument `profile` plus `bpm`, `rootMidi`, `masterGain`. Use `trackBySetting` to swap tracks with a lobby setting. |
| `broadcast` | `hostStateIntervalMs`, `controllerStateIntervalMs`, `supportsHostPatches`. |

Instrument templates currently available: `lobby`, `battle`, `chase`, `arcade`,
`gentle`, `mystery`, `strategy`, `sports`, `frostfire`, `sugarCountry`.

## Optional server hooks

| Hook | Purpose |
| --- | --- |
| `shouldContinueRun(state, context)` | Return true when a finished round should flow into the next one instead of ending the session. Games with a persistent run implement this; the platform no longer inspects game state to decide. |
| `buildHostPatch(state, previousState, context)` | Return an incremental delta against the last public state the host received, or null to force a full state. Requires `broadcast.supportsHostPatches`. |

## Optional host hooks

| Hook | Purpose |
| --- | --- |
| `applyHostPatch(currentState, patch)` | Merges a delta the server sent. Exported alongside `hostGame`. Return null to make the host wait for a full state. |

## Shared card-game layout

Card games do not need their own controller layout. The platform ships a generic
`card_hand` layout (`apps/controller/src/controller-ui/layouts/CardHandLayout.tsx`)
for phones held sideways: a fanning hand that adapts from three to twenty-plus
cards, the shared table with draw and discard piles, seat chips with hand counts,
and an action bar filled from the server.

Its contract lives in `packages/protocol/src/games/cardTable.ts`: card faces,
stacks, seats, actions, and an optional choice prompt (a wish suit, for example).
A game fills `CardTablePublicState` for the host and `CardTableControllerState`
for the phone, and gets table, cards and hand for free. `local-games/card-table`
is the reference implementation and carries the deck presets, the table engine
and its pluggable rulesets — Mau-Mau, Schwimmen, Wizard, Elfer raus and free
play all run on the same layout, so a new card game there needs no platform
change at all.

## Package entrypoints

External games must expose stable subpath exports:

```text
@open-party-lab/game-example/manifest
@open-party-lab/game-example/protocol
@open-party-lab/game-example/server
@open-party-lab/game-example/host
@open-party-lab/game-example/controller
```

The platform must not import private files from a game repo.

## Integration checklist

1. Create or clone the game repo under `local-games/<game-name>`.
2. Add the game to `config/known-games.json`.
3. Export manifest, protocol, server, host, and controller entrypoints.
4. Render the intro and result phases in the host scene.
5. Declare `ownsScreens`, `visual` and `audio` in the manifest.
6. Add or reuse a controller layout when the existing layouts are insufficient.
7. Run `npm run games:sync-local` from the platform.
8. Run `npm run typecheck`, then `npm run build` for release-facing changes.

## Design guidance

- Use the short game name for repo and folder names, e.g. `tap-race`.
- Keep simulation state serializable.
- Keep renderer objects out of server state.
- Keep inputs small and explicit.
- Use DOM/React for text-heavy phone controls.
- Use Phaser scenes for host playfield rendering.
- Read colours from `@open-party-lab/ui-kit` rather than hardcoding hex values,
  so a game matches the platform theme.

## AI checks

Use the in-app browser for screenshots and visual QA. For local smoke tests that
need players, add virtual controllers with:

```bash
npm run ai:controllers -- --room DEBU --players 4 --ready true --hold-ms 600000
```
