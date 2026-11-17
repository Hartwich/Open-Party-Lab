import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { io as connectSocket } from "socket.io-client";
import { createBaseRoundState } from "@open-party-lab/game-core";
import { loadEnv } from "../../apps/server/src/core/config/env.ts";
import { createIo } from "../../apps/server/src/network/socket/createIo.ts";
import { registerSocketHandlers } from "../../apps/server/src/network/socket/registerSocketHandlers.ts";
import { SocketSessionStore } from "../../apps/server/src/network/socket/socketSessionStore.ts";
import { RoomStore } from "../../apps/server/src/rooms/roomStore.ts";
import { RoomManager } from "../../apps/server/src/rooms/roomManager.ts";
import { RoomCleanupService } from "../../apps/server/src/rooms/roomCleanupService.ts";
import { PlayerStore } from "../../apps/server/src/players/playerStore.ts";
import { PlayerManager } from "../../apps/server/src/players/playerManager.ts";
import { PlayerPresenceTracker } from "../../apps/server/src/players/playerPresenceTracker.ts";
import { ReconnectService } from "../../apps/server/src/players/reconnectService.ts";
import { RoundManager } from "../../apps/server/src/game-engine/roundManager.ts";
import { ScoreManager } from "../../apps/server/src/game-engine/scoreManager.ts";
import { GameRuntime } from "../../apps/server/src/game-engine/gameRuntime.ts";
import { GameTransitionService } from "../../apps/server/src/game-engine/gameTransitionService.ts";
import { StateBroadcaster } from "../../apps/server/src/game-engine/stateBroadcaster.ts";

const manifest = {
  id: "connection-regression", displayName: "Connection regression", description: "Test fixture",
  minPlayers: 1, maxPlayers: 8, hostView: "test", controllerView: "test", controllerLayout: "single_button",
  supportsTeams: false, estimatedRoundDurationMs: 10_000,
  broadcast: { reliableState: true, supportsHostPatches: true }
};
const entry = {
  manifest,
  serverGame: {
    manifest,
    createInitialState: context => ({ ...createBaseRoundState("playing", context.now), count: 0 }),
    startRound: state => state,
    handleInput: (state, input) => input.type === "tap" ? { ...state, count: state.count + 1 } : state,
    isRoundFinished: state => state.count >= 3,
    buildScore: (_state, context) => [{ playerId: context.players[0].id, delta: 1, reason: "Test" }],
    buildHostPatch: (state, previous) => ({ previous: previous.count, count: state.count })
  }
};
const ack = (socket, event, payload) => socket.timeout(3000).emitWithAck(event, payload);
const barrier = socket => ack(socket, "server:time", {});
const nextEvent = (socket, event) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => { socket.off(event, done); reject(new Error(`Timed out: ${event}`)); }, 3000);
  function done(payload) { clearTimeout(timeout); resolve(payload); }
  socket.once(event, done);
});

async function fixture(t, gameEntry = entry) {
  const registry = {
    get: id => id === manifest.id ? gameEntry : undefined,
    require(id) { assert.equal(id, manifest.id); return gameEntry; },
    getAvailableGame: id => id === manifest.id ? gameEntry.manifest : undefined,
    listAvailableGames: () => [gameEntry.manifest]
  };
  const httpServer = createServer();
  const io = createIo(httpServer, loadEnv({ CONNECTION_RECOVERY_MS: "100" }));
  const roomStore = new RoomStore();
  const roomManager = new RoomManager(roomStore, code => `http://localhost/#join?room=${code}`, Date.now, null, 0);
  const sessions = new SocketSessionStore();
  const reconnectService = new ReconnectService(sessions, Date.now);
  const playerManager = new PlayerManager(new PlayerStore(), new PlayerPresenceTracker(100, Date.now), reconnectService);
  const rounds = new RoundManager();
  const scores = new ScoreManager(Date.now);
  const runtime = new GameRuntime(registry, rounds, new GameTransitionService(rounds, scores));
  const broadcaster = new StateBroadcaster(io, registry, runtime, scores);
  const cleanup = new RoomCleanupService(roomStore, roomManager, sessions, broadcaster, io, Date.now, 600_000, 60_000, 0, 20);
  registerSocketHandlers({ io, roomManager, playerManager, reconnectService, gameRegistry: registry,
    gameRuntime: runtime, stateBroadcaster: broadcaster, roomCleanupService: cleanup, hostedMode: false });
  await new Promise(resolve => httpServer.listen(0, "127.0.0.1", resolve));
  const sockets = [];
  t.after(async () => {
    for (const room of roomStore.values()) broadcaster.clearGameStateCache(room.code);
    for (const socket of sockets) socket.disconnect();
    await new Promise(resolve => io.close(resolve));
  });
  async function connect() {
    const socket = connectSocket(`http://127.0.0.1:${httpServer.address().port}`, {
      transports: ["websocket"], reconnection: false, timeout: 3000
    });
    sockets.push(socket);
    await new Promise((resolve, reject) => { socket.once("connect", resolve); socket.once("connect_error", reject); });
    return socket;
  }
  async function host(roomCode) {
    const socket = await connect();
    const result = await ack(socket, "room:create", { hostName: "Screen", roomCode });
    assert.equal(result.ok, true);
    return { socket, room: roomStore.get(result.data.room.code) };
  }
  async function join(room, deviceId = "phone", socket) {
    socket ??= await connect();
    const result = await ack(socket, "room:join", { roomCode: room.code, deviceId, playerName: deviceId });
    assert.equal(result.ok, true);
    return { socket, ...result.data };
  }
  function start(room) {
    runtime.selectGame(room, manifest.id);
    runtime.startRound(room);
    broadcaster.broadcastRoomState(room);
    broadcaster.broadcastGameState(room);
  }
  return { io, roomStore, roomManager, sessions, runtime, broadcaster, connect, host, join, start };
}

test("paused rounds reject all inputs and scoring, then accept inputs after resume", async t => {
  const f = await fixture(t);
  const { socket: host, room } = await f.host();
  const phone = await f.join(room);
  f.start(room);
  host.emit("round:pause", { roomCode: room.code, paused: true }); await barrier(host);
  const pausedRound = room.currentRound;
  for (let index = 0; index < 10; index++) {
    phone.socket.emit("game:input", { roomCode: room.code, playerId: phone.player.id, input: { type: "tap" } });
  }
  await barrier(phone.socket);
  assert.equal(room.currentRound, pausedRound);
  assert.equal(room.currentRound.state.count, 0);
  assert.equal(room.players.get(phone.player.id).score, 0);
  assert.equal(f.runtime.tickRoom(room, 1000), null);
  host.emit("round:pause", { roomCode: room.code, paused: false }); await barrier(host);
  for (let index = 0; index < 3; index++) {
    phone.socket.emit("game:input", { roomCode: room.code, playerId: phone.player.id, input: { type: "tap" } });
  }
  await barrier(phone.socket);
  assert.equal(room.currentRound.phase, "locked");
  assert.equal(room.players.get(phone.player.id).score, 1);
});

test("pausing clears held movement before a release can be discarded", async t => {
  const movingGame = {
    manifest,
    serverGame: {
      ...entry.serverGame,
      createInitialState: context => ({ ...createBaseRoundState("playing", context.now), count: 0, held: 0 }),
      handleInput: (state, input) => input.type === "move" ? { ...state, held: input.moveX } : state,
      onPause: state => ({ ...state, held: 0 }),
      tick: state => ({ ...state, count: state.count + state.held }),
      isRoundFinished: () => false
    }
  };
  const f = await fixture(t, movingGame);
  const { socket: host, room } = await f.host();
  const phone = await f.join(room);
  f.start(room);
  const move = moveX => phone.socket.emit("game:input", { roomCode: room.code, playerId: phone.player.id,
    input: { type: "move", moveX, moveY: 0 } });
  move(1); await barrier(phone.socket);
  assert.equal(room.currentRound.state.held, 1);
  host.emit("round:pause", { roomCode: room.code, paused: true }); await barrier(host);
  assert.equal(room.currentRound.state.held, 0);
  move(0); await barrier(phone.socket);
  host.emit("round:pause", { roomCode: room.code, paused: false }); await barrier(host);
  f.runtime.tickRoom(room, 16);
  assert.equal(room.currentRound.state.count, 0, "released stick does not continue moving after resume");
  move(1); await barrier(phone.socket); f.runtime.tickRoom(room, 16);
  assert.equal(room.currentRound.state.count, 1, "new movement works after resume");
});

test("pause and resume deliver game snapshots after room snapshots, even for throttled volatile streams", async t => {
  const f = await fixture(t, { ...entry, manifest: { ...manifest,
    broadcast: { hostStateIntervalMs: 10_000, controllerStateIntervalMs: 10_000 } } });
  const { socket: host, room } = await f.host();
  const phone = await f.join(room); f.start(room);
  await barrier(host); await barrier(phone.socket);
  for (const paused of [true, false]) {
    const states = [nextEvent(host, "game:state"), nextEvent(phone.socket, "game:state")];
    host.emit("round:pause", { roomCode: room.code, paused });
    for (const state of await Promise.all(states)) assert.equal(state.game.state.count, 0);
    assert.equal(room.clock.pausedAt !== null, paused);
  }
});

test("join and resume replace old controllers without changing identity, readiness or online presence", async t => {
  const f = await fixture(t);
  const { socket: host, room } = await f.host();
  const first = await f.join(room);
  first.socket.emit("player:ready", { roomCode: room.code, playerId: first.player.id, isReady: true });
  await barrier(first.socket);
  const second = await f.connect();
  const replaced = nextEvent(first.socket, "session:terminated");
  const disconnected = nextEvent(first.socket, "disconnect");
  const result = await ack(second, "session:resume", { reconnectToken: first.reconnectToken, deviceId: "phone" });
  assert.equal(result.ok, true);
  assert.equal((await replaced).reason, "replaced"); await disconnected;
  assert.equal(room.players.size, 1);
  assert.equal(room.players.get(first.player.id).socketId, second.id);
  assert.equal(room.players.get(first.player.id).connected, true);
  assert.equal(room.players.get(first.player.id).isReady, true);
  assert.equal(f.sessions.get(first.reconnectToken).socketId, second.id);
  const thirdSocket = await f.connect();
  const secondDisconnected = nextEvent(second, "disconnect");
  const third = await f.join(room, "phone", thirdSocket); await secondDisconnected;
  assert.equal(third.player.id, first.player.id);
  assert.equal(third.reconnectToken, first.reconnectToken);
  assert.equal(room.players.size, 1);
  assert.deepEqual([...f.io.sockets.adapter.rooms.get(room.code)].sort(), [host.id, third.socket.id].sort());
  const kicked = nextEvent(third.socket, "session:terminated");
  const kickedDisconnect = nextEvent(third.socket, "disconnect");
  assert.equal((await ack(host, "player:kick", { roomCode: room.code, playerId: first.player.id })).ok, true);
  assert.equal((await kicked).reason, "kicked"); await kickedDisconnect;
  assert.equal(f.sessions.get(first.reconnectToken), undefined);
  assert.deepEqual([...f.io.sockets.adapter.rooms.get(room.code)], [host.id]);
});

test("room switches remove lobby ghosts, preserve failed/idempotent joins, and detach subscriptions", async t => {
  const f = await fixture(t);
  const a = await f.host(); const b = await f.host();
  const first = await f.join(a.room);
  const invalid = await ack(first.socket, "room:join", { roomCode: b.room.code, playerName: " ", deviceId: "phone" });
  assert.equal(invalid.ok, false);
  assert.equal(a.room.players.get(first.player.id).connected, true);
  const second = await f.join(b.room, "phone", first.socket);
  assert.equal(a.room.players.size, 0);
  assert.equal(f.sessions.get(first.reconnectToken), undefined);
  assert.equal(f.io.sockets.adapter.rooms.get(a.room.code).has(first.socket.id), false);
  const same = await f.join(b.room, "phone", first.socket);
  assert.equal(same.player.id, second.player.id);
  assert.equal(b.room.players.size, 1);
  const invalidResume = await ack(first.socket, "session:resume", { reconnectToken: second.reconnectToken, deviceId: "wrong" });
  assert.equal(invalidResume.ok, false);
  assert.equal(b.room.players.get(second.player.id).connected, true);
  await barrier(b.socket);
  const change = nextEvent(b.socket, "room:state");
  first.socket.disconnect();
  const changed = await change;
  assert.equal(changed.room.players[0].connected, false);
});

test("switching out of a running round retains scores and releases phone host control and pause", async t => {
  const f = await fixture(t);
  const a = await f.host(); const b = await f.host();
  const phone = await f.join(a.room);
  f.start(a.room);
  a.room.players.get(phone.player.id).score = 7;
  f.roomManager.requestHostControl(a.room, phone.player.id);
  f.roomManager.pauseRoom(a.room, phone.player.id);
  const switched = await f.join(b.room, "phone", phone.socket);
  const retained = a.room.players.get(phone.player.id);
  assert.equal(retained.connected, false);
  assert.equal(retained.socketId, null);
  assert.equal(retained.isReady, false);
  assert.equal(retained.score, 7);
  assert.equal(a.room.hostControl.holderPlayerId, null);
  assert.equal(a.room.clock.pausedAt, null);
  assert.ok(f.sessions.get(phone.reconnectToken));
  const resumed = await ack(phone.socket, "session:resume", { reconnectToken: phone.reconnectToken, deviceId: "phone" });
  assert.equal(resumed.ok, true);
  assert.equal(resumed.data.player.id, phone.player.id);
  assert.equal(resumed.data.player.score, 7);
  assert.equal(b.room.players.has(switched.player.id), false);
  assert.equal(f.sessions.get(switched.reconnectToken), undefined);
  assert.equal(retained.connected, true);
});

test("multiple host screens share full states and identical patches, including late joins and disconnects", async t => {
  const f = await fixture(t);
  const a = await f.host(); const phone = await f.join(a.room);
  f.start(a.room);
  const bSocket = await f.connect();
  const initial = nextEvent(bSocket, "game:state");
  assert.equal((await ack(bSocket, "room:create", { roomCode: a.room.code, hostName: "Second screen" })).ok, true);
  assert.equal((await initial).game.state.count, 0);
  assert.equal(a.room.hostSocketIds.size, 2);
  assert.equal(f.io.sockets.sockets.get(a.socket.id).data.role, "host");
  const patches = [nextEvent(a.socket, "game:patch"), nextEvent(bSocket, "game:patch")];
  phone.socket.emit("game:input", { roomCode: a.room.code, playerId: phone.player.id, input: { type: "tap" } });
  const received = await Promise.all(patches);
  assert.deepEqual(received[0], received[1]);
  assert.deepEqual(received[0].patch, { previous: 0, count: 1 });
  const cSocket = await f.connect(); const late = nextEvent(cSocket, "game:state");
  await ack(cSocket, "room:create", { roomCode: a.room.code, hostName: "Third screen" });
  assert.equal((await late).game.state.count, 1);
  const nextPatches = [a.socket, bSocket, cSocket].map(socket => nextEvent(socket, "game:patch"));
  phone.socket.emit("game:input", { roomCode: a.room.code, playerId: phone.player.id, input: { type: "tap" } });
  for (const patch of await Promise.all(nextPatches)) assert.deepEqual(patch.patch, { previous: 1, count: 2 });
  const hostChange = nextEvent(a.socket, "room:state");
  bSocket.disconnect(); assert.equal((await hostChange).room.hostConnected, true);
  assert.equal(a.room.hostSocketIds.size, 2);
  assert.equal((await ack(a.socket, "room:set-language", { roomCode: a.room.code, language: "en" })).ok, true);
  assert.equal((await ack(cSocket, "room:set-language", { roomCode: a.room.code, language: "de" })).ok, true);
  const remaining = nextEvent(cSocket, "room:state");
  a.socket.disconnect(); assert.equal((await remaining).room.hostConnected, true);
  await barrier(phone.socket);
  const lastScreen = nextEvent(phone.socket, "room:state");
  cSocket.disconnect(); assert.equal((await lastScreen).room.hostConnected, false);
});

test("host room switches and host/controller role switches clean up only their own identity", async t => {
  const f = await fixture(t);
  const a = await f.host(); const b = await f.host();
  const otherScreen = await f.host(a.room.code);
  await ack(a.socket, "room:create", { roomCode: b.room.code, hostName: "Moved screen" });
  assert.deepEqual([...a.room.hostSocketIds], [otherScreen.socket.id]);
  assert.equal(f.io.sockets.adapter.rooms.get(a.room.code).has(a.socket.id), false);
  assert.equal(b.room.hostSocketIds.size, 2);
  const phone = await f.join(b.room, "phone", a.socket);
  assert.deepEqual([...b.room.hostSocketIds], [b.socket.id]);
  await ack(a.socket, "room:create", { roomCode: b.room.code, hostName: "Screen again" });
  assert.equal(b.room.players.has(phone.player.id), false);
  assert.equal(f.io.sockets.sockets.get(a.socket.id).data.playerId, undefined);
  assert.equal(b.room.hostSocketIds.size, 2);
});
