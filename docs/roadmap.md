# Roadmap

This roadmap describes likely next steps, not promises.

## Priority A

- Add reliable persistence and restore for rooms and active rounds.
- Add E2E smoke tests for room creation, phone join, reconnect, game select, round start, round end, and kick/leave flows.
- Review all included assets and word lists before any official public build.
- Improve documentation for each game.
- Establish repeatable alpha playtest notes for balancing, pacing, and scoring.

## Priority B

- Split controller code by game to reduce the main bundle.
- Move more host scenes from full redraws to incremental updates where it matters.
- Expand patch streaming beyond `Light Trails`.
- Add fixture rooms or scripted local playtest flows.

## Priority C

- Add more Arena Survivor progression depth.
- Add more MinionsTD map and balance options.
- Improve game selection UX for larger catalogs.
- Rename remaining internal legacy identifiers when doing so is low-risk.

## Product Questions

- Should official distribution target LAN-only play, hosted rooms, or both?
- Which games are polished enough for a first public demo?
- What minimum QA bar is required before a Steam build?
- Which contribution areas should be labeled as good first issues?
