# Contributing

Thanks for helping. This project explicitly welcomes contributions from people using AI coding agents, as long as the resulting work is understandable, reviewable, and responsibly sourced.

## Contribution Terms

By submitting a pull request or patch, you agree that:

- your contribution is voluntary and unpaid;
- you are not creating an employment, contractor, partnership, royalty, revenue-share, or compensation relationship with the maintainer;
- your contribution may be used in this project under the Apache License 2.0;
- the maintainer may publish official project builds, including possible commercial or store releases such as Steam, without owing financial compensation for contributed work;
- you have the right to submit the contribution and it does not knowingly include code, assets, or data that violate third-party rights.

If those terms do not work for you, please discuss before contributing.

## Workflow

1. Open an issue first for large gameplay, architecture, licensing, or asset changes.
2. Keep PRs focused.
3. Include screenshots or short clips for host/controller UI changes when useful.
4. Mention whether AI tools helped produce the change.
5. Run `npm run typecheck`.
6. Run `npm run build` for shared, runtime, or release-affecting changes.

## Game Changes

All games are currently alpha. Balance, pacing, scoring, and content may change substantially, and contributions that make the games easier to understand, fairer, or more fun are welcome.

New or changed games usually need updates in all of these places:

- `packages/game-core/src/catalog/gameCatalog.ts`
- `packages/game-core/src/catalog/i18n/gameTexts.ts`
- `packages/protocol/src/games/*`
- `apps/server/src/game-engine/gameRegistry.ts`
- `apps/server/src/games/*`
- `apps/host/src/games/*`
- `apps/controller/src/controller-ui/games/*`
- docs

The server must remain authoritative. Controllers should send input, not decide winners. Before adding a controller layout, check whether an existing layout can be reused or extended.

User-facing text should be prepared for multiple languages from the start. Prefer existing i18n/catalog patterns over hard-coded strings embedded directly in gameplay code.

## Assets And Names

Only add assets that are original, generated with clear rights, or explicitly licensed for this project. Avoid names that imply affiliation with existing commercial games, platforms, brands, or stores.
