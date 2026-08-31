/**
 * Edge cases for remote host control.
 *
 * The per-round smoke test walks the happy path once. This one goes after the
 * situations that actually break a permission system: the holder vanishing, a
 * second player asking mid-handover, taking control while a round is running,
 * and the shared screen reconnecting.
 *
 *   npm run dev:server
 *   URL=http://127.0.0.1:3000 npm run smoke:control
 */
import { io } from "socket.io-client";

const URL = process.env.URL ?? "http://127.0.0.1:3000";
const results = [];

function check(name, condition, detail = "") {
  results.push({ name, ok: Boolean(condition) });
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const connect = () => io(URL, { transports: ["websocket"], forceNew: true });

function once(socket, event, predicate = () => true, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`timeout: ${event}`));
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
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ ok: false, error: "ack timeout" }), 8000);
    socket.emit(event, payload, (result) => {
      clearTimeout(timer);
      resolve(result);
    });
  });
}

/** Builds a room with `count` phones already joined. */
async function makeRoom(count) {
  const host = connect();
  await once(host, "server:hello");
  const created = await emitAck(host, "room:create", { hostName: "Control", language: "de" });
  const room = created.data.room;
  const phones = [];

  for (let index = 0; index < count; index += 1) {
    const phone = connect();
    await once(phone, "server:hello");
    const joined = await emitAck(phone, "room:join", {
      roomCode: room.code,
      playerName: `P${index + 1}`,
      deviceId: `control-${Date.now()}-${index}`
    });
    phone.playerId = joined.data.player.id;
    phones.push(phone);
  }

  return { host, room, phones };
}

/** Requests control and has the screen grant it. */
async function grantControl(host, room, phone) {
  await emitAck(phone, "host-control:request", { roomCode: room.code, playerId: phone.playerId });
  return emitAck(host, "host-control:resolve", {
    roomCode: room.code,
    playerId: phone.playerId,
    grant: true
  });
}

async function scenarioDecline() {
  const { host, room, phones } = await makeRoom(1);
  const [phone] = phones;

  await emitAck(phone, "host-control:request", { roomCode: room.code, playerId: phone.playerId });
  const declined = await emitAck(host, "host-control:resolve", {
    roomCode: room.code,
    playerId: phone.playerId,
    grant: false
  });

  check(
    "Ablehnen laesst die Steuerung beim Bildschirm",
    declined.ok && declined.data.room.hostControl.holderPlayerId === null
  );

  phone.emit("game:select", { roomCode: room.code, gameId: "tap-race" });
  const rejected = await once(phone, "room:error", () => true, 3000).catch(() => null);
  check("Abgelehnter Spieler darf nichts steuern", rejected !== null);

  host.close();
  phone.close();
}

async function scenarioHolderLeaves() {
  const { host, room, phones } = await makeRoom(2);
  const [holder, other] = phones;

  await grantControl(host, room, holder);
  const left = await emitAck(holder, "room:leave", { roomCode: room.code });
  check("Halter kann den Raum verlassen", left.ok);

  await sleep(300);
  const request = await emitAck(other, "host-control:request", {
    roomCode: room.code,
    playerId: other.playerId
  });
  check(
    "Nach Weggang des Halters ist die Steuerung wieder frei",
    request.ok,
    request.ok ? "" : request.error
  );

  host.close();
  holder.close();
  other.close();
}

async function scenarioHolderKicked() {
  const { host, room, phones } = await makeRoom(2);
  const [holder, other] = phones;

  await grantControl(host, room, holder);
  const kicked = await emitAck(host, "player:kick", {
    roomCode: room.code,
    playerId: holder.playerId
  });
  check(
    "Gekickter Halter verliert die Steuerung",
    kicked.ok && kicked.data.room.hostControl.holderPlayerId === null
  );

  await sleep(300);
  const request = await emitAck(other, "host-control:request", {
    roomCode: room.code,
    playerId: other.playerId
  });
  check("Danach kann ein anderer anfragen", request.ok, request.ok ? "" : request.error);

  host.close();
  holder.close();
  other.close();
}

async function scenarioSecondRequest() {
  const { host, room, phones } = await makeRoom(2);
  const [first, second] = phones;

  await emitAck(first, "host-control:request", { roomCode: room.code, playerId: first.playerId });
  const replaced = await emitAck(second, "host-control:request", {
    roomCode: room.code,
    playerId: second.playerId
  });
  check(
    "Neue Anfrage ersetzt die offene",
    replaced.ok && replaced.data.room.hostControl.pendingRequest?.playerId === second.playerId
  );

  const staleAnswer = await emitAck(host, "host-control:resolve", {
    roomCode: room.code,
    playerId: first.playerId,
    grant: true
  });
  check("Antwort auf die veraltete Anfrage prallt ab", staleAnswer.ok === false);

  host.close();
  first.close();
  second.close();
}

async function scenarioControlDuringRound() {
  const { host, room, phones } = await makeRoom(2);
  const [holder, other] = phones;

  await grantControl(host, room, holder);
  holder.emit("game:select", { roomCode: room.code, gameId: "tap-race" });
  await once(host, "room:state", (p) => p.room.selectedGameId === "tap-race", 6000).catch(() => null);

  for (const phone of phones) {
    phone.emit("player:ready", { roomCode: room.code, playerId: phone.playerId, isReady: true });
  }

  await sleep(200);
  const live = once(host, "room:state", (p) => p.room.currentRound?.phase === "playing", 12_000);
  holder.emit("round:start", { roomCode: room.code });
  const started = await live.catch(() => null);
  check("Halter startet eine Runde", started !== null);

  // Kicking is roster management and must stay locked while a round runs.
  const kickDuringRound = await emitAck(holder, "player:kick", {
    roomCode: room.code,
    playerId: other.playerId
  });
  check(
    "Kick waehrend der Runde wird abgelehnt",
    kickDuringRound.ok === false,
    kickDuringRound.ok ? "wurde erlaubt" : kickDuringRound.error
  );

  const aborted = await emitAck(holder, "round:abort", { roomCode: room.code });
  check("Halter kann die Runde abbrechen", aborted.ok);

  host.close();
  holder.close();
  other.close();
}

async function scenarioScreenReconnects() {
  const { host, room, phones } = await makeRoom(1);
  const [holder] = phones;

  await grantControl(host, room, holder);
  host.close();
  await sleep(400);

  const newScreen = connect();
  await once(newScreen, "server:hello");
  const rejoined = await emitAck(newScreen, "room:create", {
    hostName: "Control",
    language: "de",
    roomCode: room.code
  });
  check(
    "Delegation ueberlebt einen Neustart des Bildschirms",
    rejoined.ok && rejoined.data.room.hostControl.holderPlayerId === holder.playerId,
    rejoined.ok ? String(rejoined.data.room.hostControl.holderPlayerId) : rejoined.error
  );

  const reclaimed = await emitAck(newScreen, "host-control:release", { roomCode: room.code });
  check(
    "Neuer Bildschirm kann die Steuerung zurueckholen",
    reclaimed.ok && reclaimed.data.room.hostControl.holderPlayerId === null
  );

  newScreen.close();
  holder.close();
}

async function main() {
  await scenarioDecline();
  await scenarioHolderLeaves();
  await scenarioHolderKicked();
  await scenarioSecondRequest();
  await scenarioControlDuringRound();
  await scenarioScreenReconnects();

  const failed = results.filter((entry) => !entry.ok);
  console.log(`\n${results.length - failed.length}/${results.length} Pruefungen bestanden`);
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("FEHLER", error);
  process.exit(1);
});
