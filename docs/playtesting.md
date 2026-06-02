# Playtesting Open Party Lab

Playtesting is one of the most useful ways to help Open Party Lab. Many games are playable alpha or beta versions, but rules, pacing, scoring, controller feedback, and balancing still need real sessions.

## What To Test

Useful playtests answer questions like:

- Can new players understand what to do without the maintainer explaining the game?
- Does the host screen clearly show the current phase, score, timer, and important game state?
- Does the phone controller show the right actions at the right time?
- Are rounds too short, too long, too random, or too predictable?
- Do reconnects, player removal, and next-round flow behave sensibly?
- Are there browser-specific problems on phones?

## Recommended Games First

Start with the currently recommended alpha/beta games:

- Magic Arena
- Magic Duell
- Arena Survivor
- MinionsTD
- Zeichnen & Erraten
- Schaetzorama

Other games can still be tested, but some may be earlier prototypes or need deeper construction work.

## Local Setup

From the platform repo:

```bash
npm ci
npm run games:list
npm run games:sync-local
npm run dev:all
```

Phones must be able to reach the host machine over the same LAN. Open the host app on the shared screen, then join with phones through the QR code or join URL.

For recommended games only, you can clone them into `local-games/` with:

```bash
npm run games:clone-recommended
npm run games:sync-local
```

## What To Record

A good playtest report does not need to be long. Include:

- game name;
- number of players;
- devices and browsers used;
- what worked well;
- what was confusing;
- bugs or technical issues;
- balance, pacing, and scoring notes;
- screenshots or short clips if useful.

## Playtest Report Template

```md
## Game

## Players

## Setup

- Host:
- Controllers:
- Browser(s):
- LAN/Wi-Fi:

## What worked well?

## What was confusing?

## Balance and pacing notes

## Bugs or technical problems

## Suggested improvements
```

## Notes For Maintainers

Prefer turning repeated playtest feedback into small issues with narrow acceptance criteria. For example, instead of opening one broad issue called "Improve Magic Arena", split feedback into controller clarity, card wording, round pacing, and scoring visibility.
