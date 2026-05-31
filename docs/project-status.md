# Project Status

Snapshot date: 2026-05-31

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

Games:

- Drift Racer
- Chaos-Kommando
- Draw & Guess
- Schaetzorama
- Word Tiles
- Arena Survivor
- MinionsTD
- Imposter
- Tabu
- Pantomime
- Air Hockey
- Light Trails

Optional local game repos:

- Tap Race can be loaded from `local-games/open-party-game-tap-race` when cloned locally.

Draw & Guess:

- host-selectable word categories: U18, 18+, or all words combined

## Not Production-Ready Yet

- every included game is still alpha and may need rule, pacing, scoring, UI, and balancing changes;
- persistent storage is not wired for production use;
- no hosted deployment configuration is included;
- no formal end-to-end test suite exists yet;
- controller bundles can be split further;
- most games still live inside the platform repo until they are migrated to optional game repos;
- several games need deeper playtesting and balancing;
- Firefox phone controllers can sometimes show controller issues around fullscreen behavior, reconnect/session handling, or touch input timing;
- asset and word-list rights need review before any store release.

## Good Next Contributions

- add E2E smoke tests for join, reconnect, round start, and round end;
- improve persistence and restore behavior;
- split controller code by game;
- migrate the next simple game into its own optional repo after Tap Race;
- add more incremental host rendering paths;
- improve docs for each game;
- improve balancing, round pacing, scoring clarity, and player feedback for alpha games;
- add playtest checklists and fixture rooms.
