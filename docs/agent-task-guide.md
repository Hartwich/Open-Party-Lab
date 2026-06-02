# Agent Task Guide

This guide explains how to write issues that are useful for AI coding agents and for humans reviewing their work.

## Good Agent Tasks

A good agent task is:

- small enough to review in one pull request;
- specific about the desired behavior;
- clear about relevant files;
- explicit about constraints;
- testable with commands or visual checks;
- free of unclear product or licensing decisions.

Prefer vertical tasks over broad rewrites. If behavior changes across the server, protocol, host, controller, and docs, describe that explicitly.

## Recommended Issue Shape

```md
## Goal

Describe the change in one or two sentences.

## Context

Explain the current behavior and why it should change.

## Relevant files

- apps/server/src/...
- apps/host/src/...
- apps/controller/src/...
- packages/protocol/src/...
- docs/...

## Constraints

- Server remains authoritative.
- Controllers send input only.
- Optional game repos must not be imported statically.
- Keep the change small.
- Do not add unclear assets or generated output.

## Acceptance criteria

- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes if runtime or packaging changed.
- [ ] UI changes include screenshots or a visual QA note.
- [ ] Docs/status are updated if behavior changed.
```

## Good First Agent Tasks

Good first tasks include:

- documentation fixes;
- README screenshot sections;
- small controller text or layout improvements;
- one missing validation check;
- one small smoke test;
- one playtest checklist;
- one game manifest cleanup.

Avoid assigning vague work such as "improve the game", "refactor the server", or "make the UI nicer" without acceptance criteria.

## Review Expectations

Agent-generated pull requests should be reviewed like any other contribution. The contributor should understand the change, remove unrelated output, and state clearly which checks were run. If a check could not be run, the PR should say so.
