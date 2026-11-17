import test from "node:test";
import assert from "node:assert/strict";
import { createBaseRoundState } from "@open-party-lab/game-core";
import { StateBroadcaster } from "../../apps/server/src/game-engine/stateBroadcaster.ts";
import { GameRuntime } from "../../apps/server/src/game-engine/gameRuntime.ts";
import { GameRegistry } from "../../apps/server/src/game-engine/gameRegistry.ts";
import { RoundManager } from "../../apps/server/src/game-engine/roundManager.ts";
import { GameTransitionService } from "../../apps/server/src/game-engine/gameTransitionService.ts";
import { ScoreManager } from "../../apps/server/src/game-engine/scoreManager.ts";
import { RoomManager } from "../../apps/server/src/rooms/roomManager.ts";
import { RoomStore } from "../../apps/server/src/rooms/roomStore.ts";
import { RoomCleanupService } from "../../apps/server/src/rooms/roomCleanupService.ts";
import { serverPerfRegistry } from "../../apps/server/src/core/perf/serverPerfRegistry.ts";
import { logger } from "../../apps/server/src/core/logger/logger.ts";

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const manifest = { id: "delivery-test", displayName: "Delivery test", minPlayers: 1, maxPlayers: 20,
  description: "Fixture", hostView: "test", controllerView: "test", controllerLayout: "single_button",
  estimatedRoundDurationMs: 10_000, supportsTeams: false };

function fixture(t, { players = 1, privateState = false, blocked = false, policy = {}, throwOnSharedCall } = {}) {
  let sharedCalls = 0; let privateCalls = 0;
  const game = { manifest: { ...manifest, broadcast: policy }, serverGame: {
    createInitialState: context => ({ ...createBaseRoundState("playing", context.now), count: 0 }),
    handleInput: state => ({ ...state, count: state.count + 1 }),
    startRound: state => state, tick: state => state, isRoundFinished: () => false, buildScore: () => [],
    toControllerState: state => {
      sharedCalls++;
      if (sharedCalls === throwOnSharedCall) throw new Error("Fixture serializer failure");
      return { count: state.count };
    },
    ...(policy.supportsHostPatches ? { buildHostPatch: (state, previous) => state.count === 1
      ? null : { previous: previous.count, count: state.count } } : {}),
    ...(privateState ? { toControllerStateForPlayer: (state, _context, playerId) => {
      privateCalls++; return { count: state.count, secret: playerId };
    } } : {})
  } };
  const registry = { get: () => game, require: () => game, getAvailableGame: () => game.manifest };
  const store = new RoomStore();
  const manager = new RoomManager(store, code => code, Date.now, null, 0);
  const rounds = new RoundManager(); const scores = new ScoreManager(Date.now);
  const runtime = new GameRuntime(registry, rounds, new GameTransitionService(rounds, scores));
  const room = manager.createRoom("Delivery"); runtime.selectGame(room, manifest.id); runtime.startRound(room);
  const emitted = [];
  const sockets = new Map(); const rooms = new Map([[room.code, new Set()]]);
  function addSocket(id, role, playerId) {
    const emit = (event, payload, reliable) => {
      if (reliable || !blocked) emitted.push({ id, event, payload: structuredClone(payload), reliable });
    };
    const emitter = { emit: (event, payload) => emit(event, payload, true),
      volatile: { emit: (event, payload) => emit(event, payload, false) } };
    sockets.set(id, { data: { role, playerId }, compress: () => emitter });
    rooms.get(room.code).add(id);
  }
  addSocket("host", "host");
  for (let index = 0; index < players; index++) addSocket(`phone${index}`, "controller", `player${index}`);
  const io = { sockets: { sockets, adapter: { rooms } }, to: () => ({ emit() {} }) };
  const broadcaster = new StateBroadcaster(io, registry, runtime, scores);
  t.after(() => { for (const room of store.values()) broadcaster.clearGameStateCache(room.code); });
  return { room, runtime, broadcaster, emitted, store, manager, io,
    calls: () => ({ shared: sharedCalls, private: privateCalls }) };
}

test("last throttled/dropped update reaches every screen as one reliable trailing snapshot", async t => {
  const f = fixture(t, { players: 2, blocked: true, policy: { hostStateIntervalMs: 40, controllerStateIntervalMs: 40 } });
  f.broadcaster.broadcastGameState(f.room);
  for (let index = 0; index < 8; index++) {
    f.runtime.handleInput(f.room, { playerId: "player0", input: { type: "tap" } });
    f.broadcaster.broadcastGameState(f.room);
  }
  assert.ok(f.emitted.every(event => event.payload.game.state.count === 0));
  await wait(100);
  for (const id of ["host", "phone0", "phone1"]) {
    const events = f.emitted.filter(event => event.id === id);
    assert.equal(events.length, 2, "burst adds only one reliable snapshot per recipient");
    assert.equal(events.at(-1).payload.game.state.count, 8);
    assert.equal(events.at(-1).reliable, true);
  }
});

test("phase transitions bypass live-stream throttling and backpressure immediately", t => {
  const f = fixture(t, { blocked: true, policy: { hostStateIntervalMs: 10_000, controllerStateIntervalMs: 10_000 } });
  f.broadcaster.broadcastGameState(f.room);
  f.room.currentRound.phase = f.room.currentRound.state.phase = "locked";
  f.broadcaster.broadcastGameState(f.room);
  assert.equal(f.emitted.length, 4);
  for (const id of ["host", "phone0"]) {
    const final = f.emitted.filter(event => event.id === id).at(-1);
    assert.equal(final.payload.game.phase, "locked"); assert.equal(final.reliable, true);
  }
});

test("shared controller serialization runs once for 16 phones", t => {
  const f = fixture(t, { players: 16 });
  f.broadcaster.broadcastGameState(f.room);
  assert.deepEqual(f.calls(), { shared: 1, private: 0 });
  assert.equal(f.emitted.filter(event => event.id.startsWith("phone")).length, 16);
});

test("patch streams reliably deliver fallback full snapshots before patches depend on them", t => {
  const f = fixture(t, { players: 0, blocked: true, policy: { supportsHostPatches: true, hostStateIntervalMs: 0 } });
  f.broadcaster.broadcastGameState(f.room);
  f.runtime.handleInput(f.room, { playerId: "player0", input: { type: "tap" } });
  f.broadcaster.broadcastGameState(f.room);
  assert.equal(f.emitted.at(-1).payload.game.state.count, 1);
  assert.equal(f.emitted.at(-1).reliable, true);
  f.runtime.handleInput(f.room, { playerId: "player0", input: { type: "tap" } });
  f.broadcaster.broadcastGameState(f.room);
  assert.equal(f.emitted.at(-1).event, "game:patch");
  assert.deepEqual(f.emitted.at(-1).payload.patch, { previous: 1, count: 2 });
});

test("private controller serialization remains isolated for 16 phones", t => {
  const f = fixture(t, { players: 16, privateState: true });
  f.broadcaster.broadcastGameState(f.room);
  assert.deepEqual(f.calls(), { shared: 0, private: 16 });
  for (let index = 0; index < 16; index++) {
    const event = f.emitted.find(event => event.id === `phone${index}`);
    assert.equal(event.payload.game.state.secret, `player${index}`);
  }
});

test("clearing a round cancels pending delivery", async t => {
  const f = fixture(t);
  f.broadcaster.broadcastGameState(f.room);
  f.runtime.handleInput(f.room, { playerId: "player0", input: { type: "tap" } });
  f.broadcaster.broadcastGameState(f.room);
  f.broadcaster.clearGameStateCache(f.room.code);
  const count = f.emitted.length;
  await wait(80); assert.equal(f.emitted.length, count);
});

test("a failing deferred serializer is contained instead of becoming an uncaught timer exception", async t => {
  const log = t.mock.method(logger, "error", () => {});
  const f = fixture(t, { throwOnSharedCall: 3 });
  f.broadcaster.broadcastGameState(f.room);
  f.broadcaster.broadcastGameState(f.room);
  await wait(80);
  assert.equal(log.mock.calls.length, 1);
  assert.equal(log.mock.calls[0].arguments[1].roomCode, f.room.code);
});

test("closing a room clears published/unpublished telemetry and deferred delivery without clearing other rooms", async t => {
  serverPerfRegistry.clear(); t.after(() => serverPerfRegistry.clear());
  const f = fixture(t, { players: 0 });
  const other = f.manager.createRoom("Other");
  f.broadcaster.broadcastGameState(f.room);
  f.broadcaster.broadcastGameState(f.room);
  serverPerfRegistry.flush(`runtime:start-round:${f.room.code}`, "test");
  serverPerfRegistry.sample(`unpublished:${f.room.code}`, "test", { tags: { roomCode: f.room.code } });
  serverPerfRegistry.flush(`runtime:tick:${other.code}`, "test");
  serverPerfRegistry.flush("round-timer", "test");
  const service = new RoomCleanupService(f.store, f.manager, { removeByRoomCode() {} }, f.broadcaster,
    { ...f.io, sockets: { ...f.io.sockets, adapter: { rooms: new Map() } } }, Date.now, 600000, 60000, 0, 20);
  f.room.expiresAt = 0;
  service.removeInactiveRooms();
  const count = f.emitted.length; await wait(80);
  assert.equal(f.emitted.length, count, "closed room cannot send deferred data");
  const snapshots = serverPerfRegistry.listSnapshots();
  assert.ok(snapshots.every(snapshot => !snapshot.ownerKey.endsWith(`:${f.room.code}`)));
  assert.ok(snapshots.some(snapshot => snapshot.ownerKey === `runtime:tick:${other.code}`));
  assert.ok(snapshots.some(snapshot => snapshot.ownerKey === "round-timer"));
  assert.equal(f.store.get(f.room.code), undefined);
});

for (const gameId of ["arena-survivor", "air-hockey", "light-trails", "drift-racer", "chaos-kommando"]) {
  test(`${gameId}: pausing clears real held inputs without firing or changing simulation time`, t => {
    const game = new GameRegistry().get(gameId);
    if (!game) { t.skip("optional game is not installed"); return; }
    const players = ["p1", "p2"].map(id => ({ id, name: id, color: "#ef4444", score: 0, isReady: true, connected: true }));
    const context = { roomCode: "TEST", roundNumber: 1, players, now: 100_000, deltaMs: 0,
      language: "en", theme: "light", selectedGame: game.manifest, previousRound: null, roomSettings: {} };
    let state = game.serverGame.createInitialState(context);
    state = game.serverGame.startRound(state, context);
    if (gameId === "arena-survivor") state.players[0].moveInputX = 1;
    if (gameId === "air-hockey") Object.values(state.paddles)[0].inputX = 1;
    if (gameId === "light-trails") Object.values(state.players)[0].leftPressed = true;
    if (gameId === "drift-racer") state.racers[0].controls = { ...state.racers[0].controls, throttle: true, fire: true };
    if (gameId === "chaos-kommando") {
      state.players[0].mercenaries[0].moveInputX = 1; state.turn.chargeStartedAt = context.now;
    }
    const before = structuredClone(state);
    const reset = game.serverGame.onPause(state, context);
    assert.equal(reset.phase, before.phase);
    assert.equal(reset.updatedAt, before.updatedAt);
    if (gameId === "arena-survivor") {
      assert.equal(reset.players[0].moveInputX, 0); assert.equal(reset.players[0].x, before.players[0].x);
    }
    if (gameId === "air-hockey") {
      assert.equal(Object.values(reset.paddles)[0].inputX, 0); assert.equal(reset.puckX, before.puckX);
    }
    if (gameId === "light-trails") {
      assert.equal(Object.values(reset.players)[0].leftPressed, false); assert.equal(Object.values(reset.players)[0].turnInput, 0);
    }
    if (gameId === "drift-racer") {
      assert.equal(reset.racers[0].controls.throttle, false); assert.equal(reset.racers[0].controls.fire, false);
      assert.equal(reset.racers[0].x, before.racers[0].x);
    }
    if (gameId === "chaos-kommando") {
      assert.equal(reset.players[0].mercenaries[0].moveInputX, 0); assert.equal(reset.turn.chargeStartedAt, null);
      assert.deepEqual(reset.projectiles, before.projectiles);
    }
    assert.deepEqual(state, before, "pause hook does not mutate the previous snapshot");
  });
}
