# Project Status

Snapshot date: 2026-06-12

## Available In This Public Cut

Platform:

- local room creation
- room code and QR join flow
- phone controller app
- Phaser host screen
- authoritative Socket.IO server
- reconnect/session recovery
- shared round lifecycle
- scoreboards
- host controls for language, FPS, and player moderation outside active rounds
- optional local game-repo discovery through `npm run games:list` and `npm run games:sync-local`
- virtual controller helper for AI browser checks through `npm run ai:controllers`
- host DEV automation bridge for browser checks exposed only by the Vite dev host

Optional local game repos:

- Magic Arena can be loaded from `local-games/magic-arena` when cloned locally. It is currently recommended alpha and playable.
- Magic Duell can be loaded from `local-games/magic-duell` when cloned locally. It is currently recommended alpha and playable.
- Arena Survivor can be loaded from `local-games/arena-survivor` when cloned locally. It is currently beta and recommended.
- MinionsTD can be loaded from `local-games/minions-td` when cloned locally. It is currently beta and recommended.
- Zeichnen & Erraten can be loaded from `local-games/zeichnen-und-erraten` when cloned locally. It is currently beta and recommended.
- Schaetzorama can be loaded from `local-games/schaetzorama` when cloned locally. It is currently beta and recommended; the answer-setting phase has no timer, repeated question IDs are avoided within a 10-round session, and directly math-solvable prompts are excluded from the active pool.
- Tap Race can be loaded from `local-games/tap-race` when cloned locally.
- Pantomime can be loaded from `local-games/pantomime` when cloned locally.
- Air Hockey can be loaded from `local-games/air-hockey` when cloned locally.
- Tabu can be loaded from `local-games/tabu` when cloned locally.
- Imposter can be loaded from `local-games/imposter` when cloned locally.
- Light Trails can be loaded from `local-games/light-trails` when cloned locally.
- Drift Racer can be loaded from `local-games/drift-racer` when cloned locally. It is under construction and currently not playable; its phone controller uses a left virtual drive stick plus Boost, Fire, and Drift action buttons.
- Word Tiles can be loaded from `local-games/word-tiles` when cloned locally. It supports multiple accepted word placements per turn and uses table-driven word challenges instead of an internal dictionary check.
- Chaos-Kommando can be loaded from `local-games/chaos-kommando` when cloned locally.

Lobby/setup:

- common setup controls are rendered by the platform from `manifest.lobbySetup`;
- common controller-side player setup is rendered from `manifest.playerSetup` with `choice` and `multi-select` support;
- player setup portraits can react to a selected lobby setting through `portraitPathBySetting`, allowing phones to mirror host-selected visual themes before a round starts;
- the host background-music controller can select a theme-specific Arena Survivor profile from the current room settings while retaining its shared audio unlock and crossfade behavior;
- game repos keep their own setup field declarations and server-side validation.

## Not Production-Ready Yet

- most included games are still alpha and may need rule, pacing, scoring, UI, and balancing changes;
- Magic Arena, Magic Duell, Arena Survivor, MinionsTD, Zeichnen & Erraten, and Schaetzorama are already in advanced alpha or beta shape, but still need normal playtesting and refinement;
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
