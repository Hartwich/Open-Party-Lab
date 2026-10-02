import assert from "node:assert/strict";
import { loadEnv } from "../apps/server/dist/core/config/env.js";
import { RoomStore } from "../apps/server/dist/rooms/roomStore.js";
import { RoomManager } from "../apps/server/dist/rooms/roomManager.js";
import { RoomCleanupService } from "../apps/server/dist/rooms/roomCleanupService.js";
import { toRoomSnapshot } from "../apps/server/dist/rooms/roomLifecycle.js";

const minute = 60_000;
const local = loadEnv({ NODE_ENV: "production", RENDER: "false", ROOM_MAX_LIFETIME_MS: "3600000" });
const hosted = loadEnv({ RENDER: "true" });
assert.equal(local.hostedMode, false);
assert.equal(local.roomMaxLifetimeMs, 0, "Local rooms must ignore an inherited hosted lifetime");
assert.equal(hosted.roomMaxLifetimeMs, 60 * minute);
assert.equal(loadEnv({ RENDER_EXTERNAL_URL: "https://example.com" }).roomMaxLifetimeMs, 60 * minute);

function fixture(lifetime) {
  let time = 1_000_000;
  const store = new RoomStore();
  const manager = new RoomManager(store, (code) => `http://localhost/controller/?room=${code}`, () => time, null, lifetime);
  const closed = [];
  const service = new RoomCleanupService(
    store, manager, { removeByRoomCode() {} }, { clearGameStateCache() {} },
    { to() { return { emit(_event, payload) { closed.push(payload); } }; }, sockets: { adapter: { rooms: new Map() }, sockets: new Map() } },
    () => time, 10 * minute, minute, lifetime, 20
  );
  const room = manager.createRoom("Lifetime regression", "en");
  manager.attachHostSocket(room, "host", "Lifetime regression");
  return { room, store, manager, service, closed, advance(duration) { time += duration; } };
}

const unlimited = fixture(local.roomMaxLifetimeMs);
assert.equal(toRoomSnapshot(unlimited.room, []).expiresAt, null);
for (const elapsed of [61 * minute, 3 * 60 * minute, 3 * 24 * 60 * minute]) {
  unlimited.advance(elapsed);
  assert.deepEqual(unlimited.service.removeInactiveRooms(), []);
  assert.equal(unlimited.store.get(unlimited.room.code), unlimited.room);
}
unlimited.service.extendRoomLifetime(unlimited.room);
assert.equal(unlimited.room.expiresAt, null);

const timed = fixture(hosted.roomMaxLifetimeMs);
assert.equal(timed.room.expiresAt - timed.room.createdAt, 60 * minute);
timed.advance(60 * minute - 1);
assert.deepEqual(timed.service.removeInactiveRooms(), []);
timed.advance(1);
assert.deepEqual(timed.service.removeInactiveRooms(), [timed.room.code]);
assert.equal(timed.closed[0].reason, "expired");

const extended = fixture(hosted.roomMaxLifetimeMs);
extended.advance(55 * minute);
extended.service.extendRoomLifetime(extended.room);
extended.advance(6 * minute);
assert.deepEqual(extended.service.removeInactiveRooms(), []);
extended.advance(59 * minute);
assert.deepEqual(extended.service.removeInactiveRooms(), [extended.room.code]);

const abandoned = fixture(0);
abandoned.manager.setHostSocket(abandoned.room, null);
abandoned.advance(10 * minute);
assert.deepEqual(abandoned.service.removeInactiveRooms(), [abandoned.room.code]);
assert.equal(abandoned.closed[0].reason, "inactive");
console.log("Room lifetime checks passed: local rooms survive hours/days; hosted rooms expire/extend; abandoned local rooms are cleaned up.");
