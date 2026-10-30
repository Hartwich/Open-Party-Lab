# Multi-Repo Games

Open Party Lab supports optional local game repos. You do not need every game repo. The platform loads only games that exist locally and are linked by `npm run games:sync-local`.

Games with no `repo` URL remain local-only. `games:clone-all` skips them on hosted builds and leaves an existing local folder untouched, even with `--fresh`.

Game packages that import unpublished platform packages, such as `@open-party-lab/protocol`, must mark those peer dependencies as optional. The local-game sync installs each game before linking the platform packages from this repository; a required peer would make npm request a package that is not published.

## Recommended Layout

Use child repos inside the platform working tree:

```text
Open-Party-Lab/
  local-games/
    tap-race/
```

`local-games/` is ignored by the platform repo, so each child folder can be its own Git repository.

New game repos should use the short game name as the repo and folder name, for example `tap-race` or `light-trails`, not an `open-party-game-` prefix. The npm package name may still use `@open-party-lab/game-<game-id>`.

The generator also accepts the older sibling layout as a fallback:

```text
OpenParty/
  Open-Party-Lab/
  tap-race/
```

## Commands

List known optional games:

```bash
npm run games:list
```

Clone optional games:

```bash
git clone https://github.com/Hartwich/magic-arena.git local-games/magic-arena
git clone https://github.com/Hartwich/magic-duell.git local-games/magic-duell
git clone https://github.com/Hartwich/tap-race.git local-games/tap-race
git clone https://github.com/Hartwich/air-hockey.git local-games/air-hockey
git clone https://github.com/Hartwich/buzzwort.git local-games/buzzwort
git clone https://github.com/Hartwich/imposter.git local-games/imposter
git clone https://github.com/Hartwich/schaetzorama.git local-games/schaetzorama
git clone https://github.com/Hartwich/light-trails.git local-games/light-trails
git clone https://github.com/Hartwich/drift-racer.git local-games/drift-racer
git clone https://github.com/Hartwich/word-tiles.git local-games/word-tiles
git clone https://github.com/Hartwich/card-table.git local-games/card-table
git clone https://github.com/Hartwich/dungeon-guild.git local-games/dungeon-guild
git clone https://github.com/Hartwich/student-activity.git local-games/student-activity
git clone https://github.com/Hartwich/zeichnen-und-erraten.git local-games/zeichnen-und-erraten
git clone https://github.com/Hartwich/arena-survivor.git local-games/arena-survivor
git clone https://github.com/Hartwich/minions-td.git local-games/minions-td
git clone https://github.com/Hartwich/chaos-kommando.git local-games/chaos-kommando
git clone https://github.com/Hartwich/schattenjagd.git local-games/schattenjagd
git clone https://github.com/Hartwich/blickwinkel.git local-games/blickwinkel
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

For Magic Arena, Magic Duell, Air Hockey, Buzzwort, Imposter, Schaetzorama, Light Trails, Drift Racer, Word Tiles, Zeichnen & Erraten, Arena Survivor, MinionsTD, Schattenjagd, and Chaos-Kommando, the same contract uses the matching package name such as `@open-party-lab/game-magic-arena/...` or `@open-party-lab/game-chaos-kommando/...`.

The platform generates registry imports only for local repos that exist and build successfully. Missing repos are skipped.

## Game Content and Asset Ownership

Game rules, scoring, special state, content, translations, dedicated views and
original assets belong to the game repository. The platform owns rooms,
connections, shared lifecycle control, localization mechanisms and reusable
controller inputs (such as joystick, card selection and drawing).

Catalog translations are optional data on `GameManifest.translations`, exported
through the existing `./manifest` package entrypoint and included in each game
registration's manifest. Keep the text source inside the game package:

```ts
import type { LocalizedGameTextMap } from "@open-party-lab/game-core";

export const catalogText = {
  de: { displayName: "Mein Spiel", description: "Beschreibung" },
  en: { displayName: "My game", description: "Description" }
} satisfies LocalizedGameTextMap;

// Set `translations: catalogText` on the game's manifest.
```

`localizeGameManifest` selects the requested language, falls back to German,
then keeps the base manifest when no translation exists. This works for games
unknown to the platform and needs no static game imports or central text list.
Optional translated setup titles and field labels use the same mechanism.

The same text map also supports lobby descriptions and confirmation text;
`lobbySetup.fields[fieldId]` can translate `label`, `description`, `group` and
`options[optionId].label/description`. `playerSetup` can translate its title,
description, ready-blocked label and option names, titles, archetypes and
descriptions. `visual.eyebrow` localizes the catalog category. These maps replace
only copy: field/option IDs, action keys, constraints, selection counts, rules
and artwork stay intact. Translate the display name for each language while
keeping the game ID and package name stable.

Runtime text and content pools must follow the room language as well. A
translated manifest does not translate card descriptions, secret words, quiz
questions, effects or event messages. Games should select authored localized
content on the server, expose only the permitted public/private text and use
their own text modules for host/controller rendering. The controller registry
supplies room language to generic input models so their fallback labels match
the room too.

Asset sources live in `public/host/<game-id>/` and
`public/controller/<game-id>/` inside the game repo. Sync/build copies them to
the corresponding app's public directory. Add both destination paths to the
platform `.gitignore` when introducing assets; never track these build copies.
`npm run check:game-boundaries` checks tracked copies, centralized game catalog
texts and optional game imports in game-core. Package builds run this check.

Publish game-side migrations together with the platform change: the ignored
`local-games/` working trees are separate repositories and are not included in
a platform commit. Deployments must fetch those updated game revisions.

### Publishing changes to shared package contracts

Game CI checks out the platform separately and builds its packages before
typechecking the game. When games start using a new shared contract, publish
the backward-compatible platform contract first and wait for its CI to pass.
Then publish the dependent games. Remove old platform-owned game content only
after those game revisions are available. A blanket games-first release order
does not work for changes to shared interfaces.

The 2026-10-29 localization release initially pushed games before the platform
contract. Fifteen game CI jobs checked out the older platform commit; fourteen
failed on `GameManifest.translations` and nested localized text fields, while
Drift Racer also had an outdated dependency lockfile. Retrying the failed jobs
after publishing the platform makes the separate checkout use the current
contract. Check the platform checkout SHA in the job log when
diagnosing this mismatch; rerunning a game alone does not pin its external
platform dependency to the SHA used by the previous attempt.

Dedicated game controller views and game-specific protocol copies still in
the platform are follow-up migrations. Move each through the documented
controller/protocol exports as a separate vertical slice while keeping reusable
input layouts in the platform.

The next slices include `SymboljagdLayout.tsx` and the Symboljagd-specific
fields of the platform's `CardHandLayoutModel` (owned by Card Table), followed
by the duplicated contracts in `packages/protocol/src/games/`. Controller
registration currently supplies layout models; a reusable custom-view contract
must be introduced before moving dedicated renderers. Keep each game's public
and private payload boundaries intact during that change.

## Lobby Setup Boundary

The platform owns generic lobby/setup rendering, navigation, room snapshots, and start-button behavior. Game repos own game-specific setup declarations and validation.

For common host setup controls, add `lobbySetup` to the game manifest. The platform currently renders reusable `select` and `number` fields and sends host actions shaped like:

```ts
{
  type: "configure-lobby",
  [actionKey]: value
}
```

The game server must validate that action and persist trusted values through `roomSettings`. Do not add static Platform imports for optional game setup data.

For common controller-side player setup, add `playerSetup` to the game manifest. The platform renders reusable `choice` and `multi-select` flows and persists trusted values per player for the selected game. Game servers receive those values through `context.players[].setupSelections`.

## AI Agent Workflow

Use the Codex in-app browser for visual checks and screenshots. Do not fall back to external browser executables for README or QA screenshots unless the maintainer explicitly asks for that.

Virtual controllers can be joined to an existing browser-hosted room without opening phone browser tabs:

```bash
npm run ai:controllers -- --room DEBU --players 4 --ready true --hold-ms 600000
```

The helper is game-agnostic. If a game needs input during the check, pass that game's input shape as JSON:

```bash
npm run ai:controllers -- --room DEBU --players 4 --input-json "{\"type\":\"tap\"}" --input-duration-ms 3000
```

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
