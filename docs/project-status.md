# Project Status

Snapshot date: 2026-09-01

## Available In This Public Cut

Platform:

- local room creation
- room code and QR join flow
- phone controller app
- DOM platform shell plus Phaser or DOM game host surfaces
- Canvas-backed Phaser rendering so SVG game art remains visible across Chromium/WebGL driver combinations
- authoritative Socket.IO server
- reconnect/session recovery
- shared round lifecycle
- scoreboards
- host controls for language, FPS, and player moderation outside active rounds
- synchronized light and dark room themes across the host shell, host overlays, and phone controllers, with accessible focus indicators and contrast-adjusted catalog labels
- optional local game-repo discovery through `npm run games:list` and `npm run games:sync-local`
- virtual controller helper for AI browser checks through `npm run ai:controllers`
- host DEV automation bridge for browser checks exposed only by the Vite dev host
- portable Windows release assembly with a one-click launcher, bundled Node.js runtime, same-origin host/controller assets, and all known games
- hosted room isolation with a 20-room capacity, inactive-room eviction, ten-minute empty-room cleanup, and a one-hour maximum room lifetime

Optional local game repos:

- Magic Arena can be loaded from `local-games/magic-arena` when cloned locally. It is currently recommended alpha and playable.
- Magic Duell can be loaded from `local-games/magic-duell` when cloned locally. It is currently recommended alpha and playable.
- Arena Survivor can be loaded from `local-games/arena-survivor` when cloned locally. It is currently beta and recommended.
- MinionsTD can be loaded from `local-games/minions-td` when cloned locally. It is currently beta and recommended.
- Zeichnen & Erraten can be loaded from `local-games/zeichnen-und-erraten` when cloned locally. It is currently beta and recommended; its focused play view omits redundant phase, color-prompt, and room-code chrome while retaining the host QR join flow.
- Schaetzorama can be loaded from `local-games/schaetzorama` when cloned locally. It is currently beta and recommended; its host is a crisp DOM surface with animated category reveals and scoring, while the phone presents one visual task at a time. The answer-setting phase has no timer, all 40 questions in a 10-round session are unique, the tenth round ends on a final overall ranking, and a documented audit leaves 124 of 160 sourced prompts active after excluding 36 arithmetic, definition-only, ambiguous, mismatched, or semantically duplicated questions.
- Tap Race can be loaded from `local-games/tap-race` when cloned locally.
- Pantomime can be loaded from `local-games/pantomime` when cloned locally.
- Air Hockey can be loaded from `local-games/air-hockey` when cloned locally.
- Buzzwort can be loaded from `local-games/buzzwort` when cloned locally. It is recommended alpha. Cards now carry real forbidden words, a turn is a timed window in which the explainer can solve several terms, and a rotating watcher from the opposing side sees the card and can buzz when a blocked word is used. Team mode gives each team the same number of turns, free-for-all gives every player exactly one explaining turn and one watching turn. The host screen uses a live turn ring, team/leaderboard panels, and an event feed; phones use the new reusable `secret_card` controller layout.
- Imposter can be loaded from `local-games/imposter` when cloned locally.
- Light Trails can be loaded from `local-games/light-trails` when cloned locally.
- Drift Racer can be loaded from `local-games/drift-racer` when cloned locally. It is recommended alpha; its phone controller uses a left virtual drive stick plus Boost, Fire, and Drift action buttons.
- Word Tiles can be loaded from `local-games/word-tiles` when cloned locally. It is recommended alpha, supports multiple accepted word placements per turn, and uses table-driven word challenges instead of an internal dictionary check.
- Chaos-Kommando can be loaded from `local-games/chaos-kommando` when cloned locally. It is recommended alpha. Its host uses a continuous modular toasted-marshmallow rig with a fixed world pivot, aim-tracking eyes, procedural locomotion, weapon-specific hand grips, and dedicated carry art for all 16 weapons. The self-contained Marshmallow Motion Lab lives in the platform repository at `tools/marshmallow-motion-lab`, owns all torso, weapon, and preview assets required by the tool, and exports reusable checked-in rig profiles plus an implementation guide under `tools/marshmallow-motion-lab/presets`.
- Schattenjagd can be loaded from `local-games/schattenjagd` when cloned locally. Its lobby also selects the per-turn time limit (20/30/45/60/90 seconds or no limit at all). It is playable alpha for 3–8 players: a fixed illustrated night-city board carries an original deterministic three-layer transit network (taxi/bus/metro), with stations snapped to visible intersections and route geometry following streets and bridges. Station shapes and concentric colour bands expose every available transport mode, route styles are visually distinct, and occupied station centres use the investigator's player colour. One hidden fugitive travels against a shared investigator team, only the used transport type is announced, and the fugitive surfaces on turns 3, 8, 13, 18, and 22. Illustrated tickets identify phone choices while slower taxi, bus, and metro sprites animate movement on the host. The host lobby selects whether the fugitive is a random player, a fixed seat number, or a server-side AI. All map data, artwork, naming, and rule values are original to that repo.
- Flatterfluff can be loaded from `local-games/flatterfluff` when cloned locally. It is playable alpha for 1–6 players, with timed and endless modes, server-authoritative aiming and scoring, six-shot magazines, reloads, ammunition crates, generated comic production art, dedicated effects, and a 16-bar country music profile.
- Kartentisch can be loaded from `local-games/card-table` when cloned locally. It is playable alpha for 2–6 players and is the shared foundation for card games: deck presets (French 52, French 54 with jokers, German/Skat 32, a freely defined party deck, a 108-card double deck, a 60-card trick-bet deck with crowns and feathers, an 80-card 1–20 deck, a 49-card Old-Maid deck, a 48-card Doppelkopf deck with every card twice), a server-side table engine with draw pile, discard pile, hands, free table zones and turn order, SVG card art rendered from code on both host and phone, a DOM host table that draws piles, tricks, colour rows, seats, its own action buttons and an on-demand rules overlay, three selectable card designs, and a landscape `card_hand` controller layout that shows the hand and the ruleset's actions while the shared table stays on the host screen. Ten rulesets ship with it: Mau-Mau, Schwimmen (31), Stichwette with bidding and trick play, Zahlenreihe with four colour rows, Lügen (bluffing onto a face-down pile, anyone may call), Schwarzer Peter (pair discarding and blind draws from a neighbour), Fischen (asking a named player for a rank, sets of four), Herzeln (trick avoidance with follow-suit, hearts and the queen of spades, shooting the moon), Doppelkopf (doubled deck, diamonds/queens/jacks/ten of hearts as trumps, hidden Re and Kontra parties), and an open free-play mode. Each ruleset carries its own full rule text, which the host shows on a Rules button; the table itself keeps the whole screen. A lobby field adds up to five AI players: they take real seats (own colour, hand, score and an AI badge), fill the table up to six, think for about 1.2 seconds before each move and are driven through the very same rule functions a phone input goes through, so they cannot play around the rules. Every ruleset ships its own heuristic, and a generic fallback bot covers any ruleset that does not. Table stacks are drawn either as a pile (top card first, at most three visible) or as a spread that shows every card in play order, so a completed four-card trick is fully visible; the trick games keep the finished trick on the table, labelled with the player who took it, until the next one is complete. Doppelkopf can be set to count eyes live or only reveal them at the end. A new card game is one `CardRuleset` implementation; the server runtime, the host table and the phone hand stay unchanged.

Lobby/setup:

- common setup controls are rendered by the platform from `manifest.lobbySetup`;
- any game that declares `lobbySetup` now gets a focused host lobby: selecting the game replaces the catalog view with that game's own lobby (game panel, player status, setup controls, start guidance) plus a "back to menu" button, instead of keeping the game grid above the setup;
- common controller-side player setup is rendered from `manifest.playerSetup` with `choice` and `multi-select` support;
- player setup portraits can react to a selected lobby setting through `portraitPathBySetting`, allowing phones to mirror host-selected visual themes before a round starts;
- Arena Survivor uses a dedicated themed host setup lobby that shows every joined player, the selected character portrait, and a clear pending-selection state without keeping the shared game catalog visible;
- the host background-music controller can select a theme-specific Arena Survivor profile from the current room settings while retaining its shared audio unlock and crossfade behavior;
- game repos keep their own setup field declarations and server-side validation.

## Not Production-Ready Yet

- most included games are still alpha and may need rule, pacing, scoring, UI, and balancing changes;
- Magic Arena, Magic Duell, Arena Survivor, MinionsTD, Zeichnen & Erraten, Schaetzorama, Chaos-Kommando, Flatterfluff, Word Tiles, and Drift Racer are the recommended alpha/beta set, but still need normal playtesting and refinement;
- Schaetzorama's interface is bilingual, but most legacy question texts still fall back to German in English rooms;
- persistent storage is not wired for production use;
- no hosted deployment configuration is included;
- no formal end-to-end test suite exists yet;
- controller bundles can be split further;
- several games need deeper playtesting and balancing;
- Firefox phone controllers can sometimes show controller issues around fullscreen behavior, reconnect/session handling, or touch input timing;
- asset and word-list rights need review before any store release.

## Good Next Contributions

- add E2E smoke tests for join, reconnect, round start, and round end;
- expand AI browser-check recipes around the generic virtual controller helper;
- improve persistence and restore behavior;
- split controller code by game;
- add more incremental host rendering paths;
- improve docs for each game;
- improve balancing, round pacing, scoring clarity, and player feedback for alpha games;
- add playtest checklists and fixture rooms.
