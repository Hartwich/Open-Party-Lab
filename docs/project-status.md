# Project Status

Snapshot date: 2026-05-23

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
- Tap Race
- Air Hockey
- Light Trails

## Not Included

These were intentionally excluded from the public source cut:

- private or hidden game prototypes
- removed experimental prototypes
- legacy experiment folders
- local temp files
- build output
- old Git history
- discarded prototypes and generated artifacts

## Not Production-Ready Yet

- every included game is still alpha and may need rule, pacing, scoring, UI, and balancing changes;
- persistent storage is not wired for production use;
- no hosted deployment configuration is included;
- no formal end-to-end test suite exists yet;
- controller bundles can be split further;
- several games need deeper playtesting and balancing;
- Firefox phone controllers can sometimes show controller issues around fullscreen behavior, reconnect/session handling, or touch input timing;
- asset and word-list rights need review before any store release.

## Good Next Contributions

- add E2E smoke tests for join, reconnect, round start, and round end;
- improve persistence and restore behavior;
- split controller code by game;
- add more incremental host rendering paths;
- improve docs for each game;
- improve balancing, round pacing, scoring clarity, and player feedback for alpha games;
- add playtest checklists and fixture rooms.

## Recent Arena Survivor Balance Work

- Arena Survivor now has five danger tiers, enemy HP/damage pressure, earlier special-enemy unlocks, and double-boss pressure on the highest tier.
- Weapon, item, character, enemy, and stat tuning now lives directly in the normal Arena Survivor content definition files so future additions can be reviewed by category.
- New runtime stats include weapon range, dodge, luck, and harvesting; these now affect combat range, incoming damage avoidance, drops, health pickups, and end-of-wave economy.
- Several existing weapons and items were retuned toward sharper four-tier ratios, including primitive melee weapons, high-rate guns, elemental caster scaling, attack-speed tradeoffs, hybrid stats, crit/dodge tradeoffs, luck, and harvesting items.
