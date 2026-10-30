import test from "node:test";
import assert from "node:assert/strict";
import { resolvePlayerSetup } from "../../packages/game-core/dist/index.js";
import { assignPlayerSetup } from "../../apps/server/src/rooms/playerSetupAssignments.ts";
import { canStartRound, explainCannotStartRound } from "../../apps/server/src/rooms/roomLifecycle.ts";

const game = { id: "test-teams", displayName: "Teams", minPlayers: 3, maxPlayers: 20,
  lobbySetup: { fields: [{ id: "mode", settingKey: "mode", defaultValue: "team" }] },
  playerSetup: { kind: "choice", selectionKey: "team", assignment: "balanced-random", required: true,
    minPlayersPerOption: 2, visibleWhen: { field: "mode", anyOf: ["team"] }, options: [{ id: "a" }, { id: "b" }] } };
function room(count = 6) {
  return { selectedGameId: game.id, currentRound: null, gameSettingsByGameId: {}, language: "en",
    players: new Map(Array.from({ length: count }, (_, index) => [`p${index}`, { id: `p${index}`, name: `P${index}`,
      isReady: true, setupSelectionsByGameId: {}, selectedCharacterId: null }])) };
}
test("balanced random defaults preserve choices and reconnects, and balance late arrivals", () => {
  const value = room(7); assignPlayerSetup(value, game);
  const choices = () => [...value.players.values()].map((player) => player.setupSelectionsByGameId[game.id].team);
  const first = choices();
  assert.equal(Math.abs(first.filter((id) => id === "a").length - first.filter((id) => id === "b").length), 1);
  assignPlayerSetup(value, game); assert.deepEqual(choices(), first);
  const newcomer = { id: "late", isReady: false, setupSelectionsByGameId: {} };
  value.players.set("late", newcomer); assignPlayerSetup(value, game);
  assert.equal(choices().filter((id) => id === "a").length, 4);
  assert.equal(choices().filter((id) => id === "b").length, 4);
  value.currentRound = { phase: "playing" };
  const before = choices(); assignPlayerSetup(value, game, true); assert.deepEqual(choices(), before);
});
test("explicit shuffle resets readiness, conditional solo setup disappears, minimum team sizes block start", () => {
  const value = room(); assignPlayerSetup(value, game);
  assert.equal(canStartRound(value, game), true);
  for (const player of value.players.values()) player.setupSelectionsByGameId[game.id].team = "a";
  assert.equal(canStartRound(value, game), false);
  assert.match(explainCannotStartRound(value, game), /Each team needs at least 2/);
  const solo = resolvePlayerSetup(game, { mode: "solo" });
  assert.equal(solo.playerSetup, undefined); assert.equal(canStartRound(value, solo), true);
  assert.equal(resolvePlayerSetup(game).playerSetup, game.playerSetup);
  assignPlayerSetup(value, game, true);
  assert.ok([...value.players.values()].every((player) => !player.isReady));
});
