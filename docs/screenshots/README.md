# README screenshot notes

The main README keeps its images in this repository so a GitHub checkout can
display the gallery without any optional `local-games/` repositories installed.

## Refreshed gallery

| File | Captured | Surface |
| --- | --- | --- |
| `host-game-selection-en.jpg` | 2026-10-15 | Running platform host, English catalog with 21 locally available games |
| `blickwinkel-host.jpg` | 2026-10-15 | Current Blickwinkel DOM host, four sample text entries at voting |
| `schaetzorama-host.jpg` | 2026-10-15 | Current Schaetzorama DOM host, four tasks and answer progress |
| `schaetzorama-reveal.jpg` | 2026-10-15 | Current Schaetzorama DOM host, numeric answer reveal and scoring |
| `draw-and-guess-host.jpg` | 2026-10-15 | Current Draw & Guess Phaser host, an original example rocket drawing and guesses |
| `imposter-host.jpg` | 2026-10-15 | Current Imposter DOM host, secret voting and sample player totals |
| `card-table-host.jpg` | 2026-10-14 | Current Mau Mau host renderer; copied from the Card Table repository |
| `card-table-symbol-hunt.jpg` | 2026-10-14 | Current Symbol Hunt host renderer with the game's original illustrations; copied from Card Table |
| `card-table-controller.jpg` | 2026-10-14 | Actual `CardHandLayout` phone controller, selected legal card; copied from Card Table |
| `pantomime-host-current.png` | 2026-10-16 | Current Pantomime host, acting stage with solved words and standings; current secret term stays private |
| `word-tiles-host.png` | 2026-10-16 | Current Word Tiles host, sample English board with intersecting words, last move and standings |
| `minions-td-host.png` | 2026-10-16 | Current MinionsTD host, four active boards with towers, enemies and projectiles |

The new host images use the Codex in-app browser at 1280 × 720. The existing Card
Table phone image is 844 × 390; its host images are 1280 × 720.

Game captures mount the actual game renderers with illustrative room states and
fictional names. Schaetzorama's questions and scoring come from its server
package. The example drawing is original. Initials use the games' built-in
portrait fallbacks; no private player photos are included. These are interface
previews, not evidence of an end-to-end multiplayer or physical-phone test.

The catalog image comes from the running host and local server. Preview pages,
temporary state-generation scripts, logs and browser profiles are excluded from
source control. No game UI or gameplay behavior was changed for these images.

The old `schaetzorama.png` and `zeichnen-und-erraten.png` show earlier host
implementations and are no longer used by the main README. The older PNG catalog
capture is also superseded there. The additional game gallery retains historical
captures rather than presenting them as newly verified interfaces.

## Project website gallery

The website also reuses the existing Arena Survivor, Buzzwort, Chaos-Kommando,
Drift Racer, Magic Arena and Magic Duell screenshots. Pantomime, Word Tiles and
MinionsTD were refreshed on 2026-10-16 using their actual current host scenes in
the Codex in-app browser at 1280 × 720. The Word Tiles board and Pantomime round
use illustrative states with fictional players. MinionsTD uses a server-created
round advanced through build/send inputs and ticks. These are renderer previews,
not physical-phone or end-to-end multiplayer checks.

The old `word-tiles.png` and `minions-td-ingame.jpg` are superseded in both the
website and main README. The earlier Pantomime capture was replaced in place.
Air Hockey, Light Trails and Tap Race were removed from the website gallery at
the maintainer's request. Their historical source images remain in this folder:

| Platform file | Source in game repository |
| --- | --- |
| `air-hockey-host.png` | `air-hockey/docs/screenshots/host.png` |
| `light-trails-host.png` | `light-trails/docs/screenshots/host.png` |
| `tap-race-host.png` | `tap-race/docs/images/tap-race-ingame.png` |

Their original capture dates are not established. These previews show earlier
implementations, not newly verified gameplay.
Duplicate captures, alternate Arena Survivor themes and controller-only images
are not separate games in the website gallery. Concept art is not used as a
gameplay screenshot.
