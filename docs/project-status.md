# Project Status

Snapshot date: 2026-06-01

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

- Arena Survivor can be loaded from `local-games/arena-survivor` when cloned locally. It is currently beta and recommended.
- MinionsTD can be loaded from `local-games/minions-td` when cloned locally. It is currently beta and recommended.
- Zeichnen & Erraten can be loaded from `local-games/zeichnen-und-erraten` when cloned locally. It is currently beta and recommended.
- Schaetzorama can be loaded from `local-games/schaetzorama` when cloned locally. It is currently beta and recommended.
- Tap Race can be loaded from `local-games/tap-race` when cloned locally.
- Pantomime can be loaded from `local-games/pantomime` when cloned locally.
- Air Hockey can be loaded from `local-games/air-hockey` when cloned locally.
- Tabu can be loaded from `local-games/tabu` when cloned locally.
- Imposter can be loaded from `local-games/imposter` when cloned locally.
- Light Trails can be loaded from `local-games/light-trails` when cloned locally.
- Drift Racer can be loaded from `local-games/drift-racer` when cloned locally. It is under construction and currently not playable.
- Word Tiles can be loaded from `local-games/word-tiles` when cloned locally.
- Chaos-Kommando can be loaded from `local-games/chaos-kommando` when cloned locally.

Lobby/setup:

- common setup controls are rendered by the platform from `manifest.lobbySetup`;
- game repos keep their own setup field declarations and server-side validation.

## Not Production-Ready Yet

- most included games are still alpha and may need rule, pacing, scoring, UI, and balancing changes;
- Arena Survivor, MinionsTD, Zeichnen & Erraten, and Schaetzorama are already in beta shape, but still need normal playtesting and refinement;
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
