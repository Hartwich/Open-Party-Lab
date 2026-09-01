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
| `visual` | Catalog tile appearance: `accent` (`#rrggbb`), `eyebrow`, `icon`, optional `iconPath`. |
| `audio` | Background music: an instrument `profile` plus `bpm`, `rootMidi`, `masterGain`. Use `trackBySetting` to swap tracks with a lobby setting. |
| `broadcast` | `hostStateIntervalMs`, `controllerStateIntervalMs`, `supportsHostPatches`. |

Instrument templates currently available: `lobby`, `battle`, `chase`, `arcade`,
`gentle`, `mystery`, `strategy`, `sports`, `frostfire`, `sugarCountry`.

Catalog glyphs for `visual.icon`: `swords`, `brush`, `cards`, `chat`, `cannon`,
`car`, `bird`, `mask`, `bolt`, `sparkles`, `wand`, `tower`, `drama`, `question`,
`ghost`, `hand`, `grid`, `puck`, `star`. A game that ships its own SVG points at
it with `iconPath` instead; a game that declares neither gets `star`.

## Host surface

The platform screen — room code, QR, player roster, game shelf and the selected
game's settings — is rendered in the DOM (`apps/host/src/shell`). Games may use
either a Phaser scene or mount a resolution-independent DOM host surface. The
canvas is hidden whenever the shell or a DOM game owns the screen.

Two consequences for game authors:

- DOM host games stay crisp on high-density displays and are a good fit for
  quizzes, scoreboards and other text-heavy shared screens. Canvas scenes remain
  the right fit for playfields with continuous rendering or physics.
- The platform hands over the screen from `round_intro` onwards. `apps/host/src/app/hostSurface.ts`
  is the single place that decides this; router and shell both read it, so they
  cannot disagree about who is drawing.

## Optional server hooks

| Hook | Purpose |
| --- | --- |
| `shouldContinueRun(state, context)` | Return true when a finished round should flow into the next one instead of ending the session. Games with a persistent run implement this; the platform no longer inspects game state to decide. |
| `buildHostPatch(state, previousState, context)` | Return an incremental delta against the last public state the host received, or null to force a full state. Requires `broadcast.supportsHostPatches`. |

## Optional host hooks

| Hook | Purpose |
| --- | --- |
| `mountDom(root, stateSource)` | Mount a DOM host into the supplied root and return an unmount callback. `stateSource` exposes the current host state and a subscription. Omit `sceneKey` and `scene` for a DOM-only game. |
| `applyHostPatch(currentState, patch)` | Merges a delta the server sent. Exported alongside `hostGame`. Return null to make the host wait for a full state. |

## Shared card-game layout

Card games do not need their own controller layout. The platform ships a generic
`card_hand` layout (`apps/controller/src/controller-ui/layouts/CardHandLayout.tsx`)
for phones held sideways: a fanning hand that adapts from three to twenty-plus
cards, seat chips with hand counts, and an action bar filled from the server.
The shared table — draw pile, discard, tricks, open cards — stays on the host
screen rather than being repeated on every phone.

Its contract lives in `packages/protocol/src/games/cardTable.ts`: card faces,
stacks, seats, actions, and an optional choice prompt (a wish suit, for example).
A game fills `CardTablePublicState` for the host and `CardTableControllerState`
for the phone, and gets table, cards and hand for free. `local-games/card-table`
is the reference implementation and carries the deck presets, the table engine
and its pluggable rulesets — ten card games run on the same layout, so a new card
game there needs no platform change at all.

Seat chips carry an optional `isBot` flag. The platform has no notion of AI
players and never will: it only knows the people who joined a room. A game that
wants virtual opponents mints its own seats, drives them from `tick()`, and
marks them with that flag so host and phone can label them — `card-table` does
exactly this, and puts the bot moves through the same rule functions a real
input goes through. Scores for such seats are dropped by the platform score
manager (it skips unknown player ids), so the game keeps them in its own state
and shows them on its own result screen.

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
4. Render the intro and result phases in the host scene or DOM host surface.
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
- Use Phaser scenes for continuously rendered playfields and DOM host surfaces
  for text-heavy, resolution-independent game screens.
- Read colours from `@open-party-lab/ui-kit` rather than hardcoding hex values,
  so a game matches the platform theme.

## AI checks

For local smoke tests that need players, add virtual controllers with:

```bash
npm run ai:controllers -- --room DEBU --players 4 --ready true --hold-ms 600000
```

`smoke:remote-setup` covers host control end to end: a phone takes the room over
and changes the selected game's own settings — MinionsTD's map and starting
lives, the card-table ruleset — reading the fields from each manifest rather
than hard-coding keys, then checks that a player without control is refused and
that the shared screen can still configure. A game's lobby setup is therefore
operable from either surface for free; nothing per-game is needed.

`smoke:robustness` sends what a broken or hostile client would — events with no
payload, no acknowledgement callback, or the wrong types — and checks the server
is still serving afterwards. Client events are registered through
`createGuardedOn` rather than `socket.on` for that reason; a handler added with
the raw listener is outside the guard and can end the process.

On Linux — including agent sandboxes, where the repo's npm workspace links are
Windows junctions that cannot be followed — `scripts/sandbox-harness.sh` mirrors
the workspace with real symlinks so `tsc`, `vite` and `node` work normally, and
`scripts/host-e2e.mjs` drives the built host in headless Chromium: it reads the
room code off the screen, joins real players over Socket.IO, opens a game's
settings, switches theme from the dock and checks that the shell yields the
screen once a round starts. Layout regressions show up there rather than in
review — the settings card being clipped by its grid row was found this way.
