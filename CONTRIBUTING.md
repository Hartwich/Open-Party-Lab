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

Games live in optional repos under `local-games/` during local development. A game repo owns its server logic, protocol types, host scene, controller model, assets, manifest, README, and package entrypoints.

The Platform owns common room lifecycle, generated optional game registries, reusable controller layouts, generic setup rendering, and shared DTO/socket contracts. Add a game to `config/known-games.json`, then run `npm run games:sync-local` so the generated registries import only locally available games.

The server must remain authoritative. Controllers should send input, not decide winners. Before adding a controller layout, check whether an existing layout can be reused or extended.

User-facing text should be prepared for multiple languages from the start. Prefer existing i18n/catalog patterns over hard-coded strings embedded directly in gameplay code.

## Assets And Names

Only add assets that are original, generated with clear rights, or explicitly licensed for this project. Avoid names that imply affiliation with existing commercial games, platforms, brands, or stores.

## Recommended GitHub Labels

The following labels help categorize issues and make it easier for contributors to find work.

### Workflow Labels

- **agent-ready** – The issue is fully specified and ready to be implemented without additional clarification.
- **good first issue** – Suitable for new contributors or those unfamiliar with the project.
- **playtest-needed** – The change should be manually tested to verify gameplay, user experience, or functionality.

### Area Labels

Use one or more of these labels to indicate which part of the project is affected.

| Label | Description |
|-------|-------------|
| `area:host` | Host application or host interface changes. |
| `area:controller` | Controller application or input-related changes. |
| `area:server` | Server logic, networking, or backend functionality. |
| `area:i18n` | Localization, translations, or internationalization. |
| `area:assets` | Images, audio, fonts, or other project assets. |
| `area:gameplay` | Gameplay mechanics, rules, or game behavior. |
| `area:balancing` | Difficulty, scoring, pacing, or gameplay balance adjustments. |
| `area:docs` | Documentation improvements. |

### Planning Labels

- **needs-design** – The implementation should wait until the design has been agreed upon.
- **needs-clarification** – Additional information is required before implementation can begin.

### Size Labels

These labels indicate the expected scope of an issue.

| Label | Description |
|-------|-------------|
| `size:xs` | Very small change that can usually be completed quickly. |
| `size:s` | Small task with limited scope. |
| `size:m` | Medium-sized change requiring moderate effort. |
| `size:l` | Large or complex change that may require multiple commits or significant review. |