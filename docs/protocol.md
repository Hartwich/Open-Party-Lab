# Protocol

The shared protocol lives in `packages/protocol`.

## Client To Server

- `room:create`
- `room:join`
- `session:resume`
- `room:leave`
- `player:kick`
- `player:ready`
- `player:select-character`
- `game:select`
- `game:host-action`
- `game:input`
- `round:start`
- `round:abort`

## Server To Client

- `server:hello`
- `room:state`
- `game:state`
- `game:patch`
- `scoreboard:state`
- `room:error`
- `session:resumed`
- `session:terminated`

## Usage Notes

- `room:state` is the canonical lobby and room snapshot.
- `game:state` carries a complete public state envelope for the active game.
- `game:patch` is for partial high-frequency state updates. At the moment, patch streaming is mainly used by `Light Trails`.
- `game:input` is the main controller input channel.
- `game:host-action` is for host-only game setup or control actions, such as setup panels.
- `player:kick` is host-only and currently allowed outside active rounds.
- `session:terminated` tells a controller that its local session is no longer valid.

## Game Payloads

Game-specific types live in `packages/protocol/src/games/*`. When a game adds public state, controller state, host actions, or inputs, define those contracts there and export them from `packages/protocol/src/index.ts`.
