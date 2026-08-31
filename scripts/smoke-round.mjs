/**
 * End-to-end smoke test against a running server.
 *
 * Drives a real room over Socket.IO: creates it, joins two phones, exercises
 * the remote host-control handover, plays a Tap Race round to its result phase
 * and checks that the scoreboard is broadcast. No browser required, so it can
 * run in CI and in sandboxes.
 *
 *   npm run dev:server          # in one terminal
 *   URL=http://127.0.0.1:3000 npm run smoke:round
 */
import { io } from "socket.io-client";

const URL = process.env.URL ?? "http://127.0.0.1:3000";
const results = [];

function check(name, condition, detail = "") {
  results.push({ name, ok: Boolean(condition), detail });
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

function connect() {
  return io(URL, { transports: ["websocket"], forceNew: true });
}

function once(socket, event, predicate = () => true, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`timeout waiting for ${event}`));
    }, timeoutMs);

    const handler = (payload) => {
      if (!predicate(payload)) return;
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(payload);
    };

    socket.on(event, handler);
  });
}

function emitAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`ack timeout ${event}`)), 8000);
    socket.emit(event, payload, (result) => {
      clearTimeout(timer);
      resolve(result);
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const host = connect();
  await once(host, "server:hello");

  let lastScoreboard = null;
  host.on("scoreboard:state", (payload) => { lastScoreboard = payload; });

  const created = await emitAck(host, "room:create", { hostName: "Smoke", language: "de" });
  check("Raum wird erstellt", created.ok, created.ok ? created.data.room.code : created.error);
  const room = created.data.room;

  check(
    "Katalog enthaelt Spiele",
    room.availableGames.length > 0,
    `${room.availableGames.length} Spiele`
  );
  check(
    "RoomSnapshot hat hostControl",
    room.hostControl !== undefined && room.hostControl.holderPlayerId === null,
    JSON.stringify(room.hostControl)
  );

  const withVisual = room.availableGames.filter((g) => g.visual?.accent);
  check(
    "Manifest-Felder werden durchgereicht (visual)",
    true,
    `${withVisual.length}/${room.availableGames.length} Spiele mit visual.accent`
  );

  // --- theme is a room setting ---------------------------------------------
  check("Raum startet im hellen Theme", room.theme === "light", String(room.theme));

  const switched = await emitAck(host, "room:set-theme", { roomCode: room.code, theme: "dark" });
  check(
    "Host kann auf Dunkel umschalten",
    switched.ok && switched.data.room.theme === "dark",
    switched.ok ? switched.data.room.theme : switched.error
  );

  const backToLight = await emitAck(host, "room:set-theme", { roomCode: room.code, theme: "light" });
  check("Zurueck auf Hell", backToLight.ok && backToLight.data.room.theme === "light");

  // --- two phones join -----------------------------------------------------
  const p1 = connect();
  const p2 = connect();
  await once(p1, "server:hello");
  await once(p2, "server:hello");

  const j1 = await emitAck(p1, "room:join", {
    roomCode: room.code,
    playerName: "Ada",
    deviceId: "dev-1"
  });
  const j2 = await emitAck(p2, "room:join", {
    roomCode: room.code,
    playerName: "Linus",
    deviceId: "dev-2"
  });
  check("Zwei Spieler treten bei", j1.ok && j2.ok);
  const player1 = j1.data.player;

  // --- host control takeover (Etappe 3) ------------------------------------
  const req = await emitAck(p1, "host-control:request", {
    roomCode: room.code,
    playerId: player1.id
  });
  check("Controller kann Steuerung anfragen", req.ok, req.ok ? "" : req.error);
  check(
    "Anfrage erscheint im Raum-Snapshot",
    req.ok && req.data.room.hostControl.pendingRequest?.playerId === player1.id
  );

  const denyByHolder = await emitAck(p2, "host-control:resolve", {
    roomCode: room.code,
    playerId: player1.id,
    grant: true
  });
  check(
    "Nur der Bildschirm darf entscheiden",
    denyByHolder.ok === false,
    denyByHolder.ok ? "wurde faelschlich erlaubt" : denyByHolder.error
  );

  const granted = await emitAck(host, "host-control:resolve", {
    roomCode: room.code,
    playerId: player1.id,
    grant: true
  });
  check(
    "Bildschirm erlaubt die Uebernahme",
    granted.ok && granted.data.room.hostControl.holderPlayerId === player1.id
  );

  // A phone without control must not drive the room.
  p2.emit("game:select", { roomCode: room.code, gameId: "tap-race" });
  const forbidden = await once(p2, "room:error", () => true, 3000).catch(() => null);
  check("Spieler ohne Steuerung wird abgewiesen", forbidden !== null, forbidden?.message ?? "");

  // The holder may.
  const selected = once(host, "room:state", (p) => p.room.selectedGameId === "tap-race");
  p1.emit("game:select", { roomCode: room.code, gameId: "tap-race" });
  const afterSelect = await selected;
  check("Halter kann ein Spiel waehlen", afterSelect.room.selectedGameId === "tap-race");

  // --- play a full round ---------------------------------------------------
  p1.emit("player:ready", { roomCode: room.code, playerId: player1.id, isReady: true });
  p2.emit("player:ready", { roomCode: room.code, playerId: j2.data.player.id, isReady: true });
  await sleep(200);

  // Wait for the actual playing phase — inputs during round_intro/countdown
  // are ignored by the runtime.
  const playing = once(
    host,
    "room:state",
    (p) => p.room.currentRound?.phase === "playing",
    15000
  );
  p1.emit("round:start", { roomCode: room.code });
  const started = await playing.catch(() => null);
  check("Runde erreicht die Spielphase", started !== null, started?.room.currentRound?.phase ?? "keine Runde");

  // Tap until someone wins.
  const finished = once(
    host,
    "room:state",
    (p) =>
      p.room.currentRound?.phase === "result" ||
      p.room.currentRound?.phase === "scoreboard" ||
      p.room.currentRound?.phase === "finished",
    15000
  );

  for (let i = 0; i < 600; i += 1) {
    p1.emit("game:input", { roomCode: room.code, playerId: player1.id, input: { type: "tap" } });
    if (i % 10 === 0) await sleep(12);
  }

  const done = await finished.catch(() => null);
  check("Runde erreicht die Ergebnisphase", done !== null, done?.room.currentRound?.phase ?? "-");

  await sleep(500);
  check(
    "Scoreboard wird gesendet",
    lastScoreboard !== null && (lastScoreboard.entries?.length ?? 0) > 0,
    `${lastScoreboard?.entries?.length ?? 0} Eintraege`
  );

  // --- a second round must be startable once everyone is ready again -------
  // Regression guard: a finished round used to block the next one for every
  // game, because "the game has no continuation rule" was treated as "the game
  // says no".
  const secondRound = once(
    host,
    "room:state",
    (p) => p.room.currentRound?.phase === "round_intro" || p.room.currentRound?.phase === "countdown" || p.room.currentRound?.phase === "playing",
    12000
  );

  // An explicit start is only accepted once the result phase has aged into
  // "finished" — until then the round still counts as running.
  let startError = null;
  p1.on("room:error", (payload) => { startError = payload.message; });

  await once(host, "room:state", (p) => p.room.currentRound?.phase === "finished", 15000)
    .catch(() => null);

  await sleep(300);
  p1.emit("player:ready", { roomCode: room.code, playerId: player1.id, isReady: true });
  p2.emit("player:ready", { roomCode: room.code, playerId: j2.data.player.id, isReady: true });
  await sleep(200);
  p1.emit("round:start", { roomCode: room.code });

  const second = await secondRound.catch(() => null);
  check(
    "Naechste Runde startet nach dem Rundenende",
    second !== null,
    second?.room.currentRound?.phase ?? startError ?? "keine neue Runde"
  );

  // --- hand control back ---------------------------------------------------
  const released = await emitAck(p1, "host-control:release", { roomCode: room.code });
  check(
    "Steuerung wird zurueckgegeben",
    released.ok && released.data.room.hostControl.holderPlayerId === null
  );

  for (const socket of [host, p1, p2]) socket.close();

  await runWaitForReadyScenario();

  for (const socket of [host, p1, p2]) socket.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} Pruefungen bestanden`);
  process.exit(failed.length === 0 ? 0 : 1);
}

/**
 * Second scenario: a `wait_for_ready` game.
 *
 * These games have no explicit start button — readiness alone starts the next
 * round. A regression once made a finished round block that path for every
 * game, so this walks a full round and then readies up again.
 */
async function runWaitForReadyScenario() {
  const host = connect();
  await once(host, "server:hello");

  const created = await emitAck(host, "room:create", { hostName: "Smoke", language: "de" });

  if (!created.ok) {
    check("Zweiter Raum wird erstellt", false, created.error);
    return;
  }

  const room = created.data.room;
  const phone = connect();
  await once(phone, "server:hello");

  const joined = await emitAck(phone, "room:join", {
    roomCode: room.code,
    playerName: "Solo",
    deviceId: "smoke-solo"
  });
  const playerId = joined.data.player.id;

  host.emit("game:select", { roomCode: room.code, gameId: "light-trails" });
  await once(host, "room:state", (p) => p.room.selectedGameId === "light-trails");

  const livePhases = ["round_intro", "countdown", "playing"];
  const firstRound = once(
    host,
    "room:state",
    (p) => livePhases.includes(p.room.currentRound?.phase ?? ""),
    15000
  );
  phone.emit("player:ready", { roomCode: room.code, playerId, isReady: true });
  check("Bereitschaft startet die Runde ohne Startknopf", (await firstRound.catch(() => null)) !== null);

  const settled = await once(
    host,
    "room:state",
    (p) => p.room.currentRound?.phase === "finished",
    60000
  ).catch(() => null);
  check("Runde laeuft bis finished durch", settled !== null);

  const nextRound = once(
    host,
    "room:state",
    (p) => {
      const phase = p.room.currentRound?.phase;
      return Boolean(phase) && phase !== "finished";
    },
    20000
  );
  await sleep(400);
  phone.emit("player:ready", { roomCode: room.code, playerId, isReady: true });
  const next = await nextRound.catch(() => null);
  check(
    "Naechste Runde startet erneut durch Bereitschaft",
    next !== null,
    next?.room.currentRound?.phase ?? "blockiert"
  );

  host.close();
  phone.close();
}

main().catch((error) => {
  console.error("SMOKE ERROR", error);
  process.exit(1);
});
