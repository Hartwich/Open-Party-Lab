// Runs the real browser socket clients against the real server, with only DOM
// rendering dependencies replaced. No browser, camera or OS standby is tested.
// Run: node --import tsx scripts/test-session-recovery.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as socketClient from "socket.io-client";
import * as core from "@open-party-lab/game-core";
import * as protocol from "@open-party-lab/protocol";
import { createApp } from "../apps/server/src/app.ts";
import { loadEnv } from "../apps/server/src/core/config/env.ts";

const app = createApp({ ...loadEnv(), host: "127.0.0.1", port: 0, connectionRecoveryMs: 100, playerReconnectWindowMs: 100 });
await app.start();
const url = `http://127.0.0.1:${app.httpServer.address().port}`;
const storage = new Map();
const windowTarget = new EventTarget();
windowTarget.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key)
};
const documentTarget = new EventTarget();
documentTarget.visibilityState = "visible";
documentTarget.documentElement = {};
const dependencies = {
  "socket.io-client": socketClient,
  "@open-party-lab/game-core": core,
  "@open-party-lab/protocol": protocol,
  "@open-party-lab/ui-kit": { applyThemeVariables() {}, normalizeThemeName: (theme) => theme },
  "../games/registry.js": { hostGameRegistry: {} },
  "../ui/theme/theme.js": { applyHostTheme: () => false },
  "../i18n/hostText.js": { readStoredHostLanguage: () => "de", writeStoredHostLanguage() {} }
};
function loadClient(path) {
  const code = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), "utf8").replaceAll("import.meta.env", "({})"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    exports: module.exports, module,
    require: (name) => {
      assert.ok(dependencies[name], `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    window: windowTarget, document: documentTarget, crypto: globalThis.crypto,
    setTimeout, clearTimeout, console
  }, { filename: path });
  return module.exports;
}
dependencies["./deviceSession.js"] = loadClient("apps/controller/src/app/deviceSession.ts");
dependencies["../i18n/controllerText.js"] = loadClient("apps/controller/src/i18n/controllerText.ts");
const { HostSocketClient } = loadClient("apps/host/src/app/hostSocketClient.ts");
const { ControllerSocketClient } = loadClient("apps/controller/src/app/controllerSocketClient.ts");
const host = new HostSocketClient(url);
const phone = new ControllerSocketClient(url);
const waitFor = async (condition, label) => {
  const deadline = Date.now() + 12_000;
  while (!condition()) {
    assert.ok(Date.now() < deadline, `Timed out: ${label}; host=${JSON.stringify(host.getState())}; phone=${JSON.stringify(phone.getState())}`);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
};
const ack = (socket, event, payload) => socket.timeout(3000).emitWithAck(event, payload);
let peer;
try {
  host.connect();
  await waitFor(() => host.getState().connected && host.getState().room, "host room");
  const roomCode = host.getState().room.code;
  phone.connect();
  await waitFor(() => phone.getState().connected, "phone transport");
  phone.joinRoom(roomCode, "Before");
  await waitFor(() => phone.getState().player, "join");
  const playerId = phone.getState().player.id;
  const token = phone.getState().storedSession.reconnectToken;
  const avatar = "data:image/jpeg;base64,/9j/AA==";
  assert.equal(await phone.setProfile("After", avatar), null);
  await waitFor(() => host.getState().room.players[0].avatar === avatar, "host selfie");
  assert.equal(host.getState().room.players[0].name, "After");
  assert.equal(phone.getState().storedSession.playerName, "After");
  assert.ok(await phone.setProfile(" ", avatar), "blank names are rejected");
  assert.ok(await phone.setProfile("After", "data:image/svg+xml;base64,AAAA"), "non-JPEG media is rejected");
  assert.ok(await phone.setProfile("After", `data:image/jpeg;base64,${"A".repeat(35_000)}`), "oversized media is rejected");

  peer = socketClient.io(url, { transports: ["websocket"] });
  await waitFor(() => peer.connected, "second transport");
  const joined = await ack(peer, "room:join", { roomCode, playerName: "Peer", deviceId: "recovery-test-peer" });
  assert.equal(joined.ok, true);
  const forged = await ack(peer, "player:set-profile", { roomCode, playerId, name: "Forged", avatar: null });
  assert.equal(forged.ok, false, "another phone cannot change the profile");

  // Both reconnect after the server's packet recovery and presence windows.
  // Identity, roster and catalog selection must survive even a fresh socket.
  const testGame = host.getState().room.availableGames.find((game) => game.id === "tap-race");
  if (testGame) {
    host.selectGame(testGame.id);
    await waitFor(() => host.getState().room.selectedGameId === testGame.id, "selected game");
  }
  const oldHostSocket = host.socket.id;
  host.socket.io.engine.close();
  await waitFor(() => !host.getState().connected, "host disconnect indication");
  await waitFor(() => host.getState().connected, "host automatic restore");
  assert.notEqual(host.socket.id, oldHostSocket);
  assert.equal(host.getState().room.code, roomCode);
  assert.equal(host.getState().room.selectedGameId, testGame?.id ?? null);
  const oldPhoneSocket = phone.socket.id;
  phone.socket.io.engine.close();
  await waitFor(() => !phone.getState().connected, "phone disconnect indication");
  const inputCount = phone.socket.sendBuffer.length;
  phone.sendInput({ type: "tap" });
  assert.equal(phone.socket.sendBuffer.length, inputCount, "offline inputs are not queued");
  await waitFor(() => phone.getState().connected, "phone automatic restore");
  assert.notEqual(phone.socket.id, oldPhoneSocket);
  assert.equal(phone.getState().player.id, playerId);
  assert.equal(phone.getState().storedSession.reconnectToken, token);
  assert.equal(phone.getState().player.avatar, avatar);
  assert.equal(host.getState().room.players.length, 2);

  // Simulate an ACK lost after a successful transport connection. Identity
  // must remain saved and the retry must restore it without a manual click.
  const timeout = phone.socket.timeout.bind(phone.socket);
  let loseReply = true;
  phone.socket.timeout = (ms) => ({ emit: (event, payload, callback) => {
    if (event === "session:resume" && loseReply) {
      loseReply = false;
      setTimeout(() => callback(new Error("lost ACK")), 10);
      return phone.socket;
    }
    return timeout(ms).emit(event, payload, callback);
  } });
  phone.resumeSession();
  await waitFor(() => !phone.getState().connected, "lost resume ACK");
  assert.equal(phone.getState().storedSession.reconnectToken, token);
  await waitFor(() => phone.getState().connected, "resume ACK retry");
  phone.socket.timeout = timeout;

  if (testGame) {
    phone.setReady(true);
    peer.emit("player:ready", { roomCode, playerId: joined.data.player.id, isReady: true });
    await waitFor(() => host.getState().room.players.every((player) => player.isReady), "ready players");
    host.startRound();
    await waitFor(() => phone.getState().game, "active game");
    assert.ok(await phone.setProfile("During round", null), "profile edits are rejected during active rounds");
    const roundNumber = phone.getState().game.roundNumber;
    phone.socket.io.engine.close();
    await waitFor(() => !phone.getState().connected, "in-game disconnect");
    await waitFor(() => phone.getState().connected && phone.getState().game, "in-game restore");
    assert.equal(phone.getState().player.id, playerId);
    assert.equal(phone.getState().game.roundNumber, roundNumber);
  } else {
    console.log("SKIP: active round continuity (optional tap-race package is not installed).");
  }
  phone.clearStoredSession({ disconnect: true });
  await waitFor(() => phone.getState().connected, "fresh join connection after leaving");
  assert.equal(phone.getState().room, null, "intentional termination does not restore the room");
  assert.equal(phone.getState().hasStoredSession, false);
  console.log(`PASS: automatic host/player recovery, ${testGame ? "active round continuity, " : ""}lost ACK retry, profile validation, ownership and offline inputs.`);
} finally {
  phone.socket.disconnect();
  host.socket.disconnect();
  peer?.disconnect();
  app.io.close();
}
process.exit(0);
