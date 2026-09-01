/**
 * A phone holding host control must be able to configure the game, not just
 * pick it.
 *
 * Taking over used to hand across the room but not the game: the holder could
 * select MinionsTD and start it, while the map, the starting lives and the
 * card-table ruleset stayed on the shared screen only — exactly the choices
 * that matter before a round. The server already authorised `game:host-action`
 * for the holder; the phone simply never sent one.
 *
 * This drives the real events for both games that carry a lobby setup and
 * checks the room settings actually changed, then confirms a player without
 * control is still refused.
 *
 *   npm run dev:server
 *   URL=http://127.0.0.1:3000 npm run smoke:remote-setup
 */
import { io } from "socket.io-client";

const URL = process.env.URL ?? "http://127.0.0.1:3000";
const results = [];

function check(name, condition, detail = "") {
  results.push({ name, ok: Boolean(condition) });
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function connect() {
  const socket = io(URL, { transports: ["websocket"], forceNew: true });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Verbindung kam nicht zustande")), 8000);
    socket.on("connect", () => {
      clearTimeout(timer);
      resolve(socket);
    });
  });
}

function emit(socket, event, payload) {
  return new Promise((resolve) => socket.emit(event, payload, resolve));
}

/**
 * `game:select` is fire-and-forget on the server, so waiting for an
 * acknowledgement that was never promised would hang the suite.
 */
async function select(socket, gameId) {
  socket.emit("game:select", { roomCode, gameId });
  await sleep(400);
}

/** Latest room snapshot the socket has seen. */
function trackRoom(socket) {
  const box = { room: null };
  socket.on("room:state", ({ room }) => {
    box.room = room;
  });
  return box;
}

const host = await connect();
const hostRoom = trackRoom(host);
const created = await emit(host, "room:create", { hostName: "Screen" });
const roomCode = created.data.room.code;
check("Raum erstellt", created.ok === true, roomCode);

const holder = await connect();
const holderJoin = await emit(holder, "room:join", {
  roomCode,
  playerName: "Holder",
  deviceId: "remote-setup-holder"
});
const holderId = holderJoin.data.player.id;

const bystander = await connect();
const bystanderJoin = await emit(bystander, "room:join", {
  roomCode,
  playerName: "Bystander",
  deviceId: "remote-setup-bystander"
});
check("Zwei Spieler im Raum", holderJoin.ok && bystanderJoin.ok);

// Hand control to the first phone.
await emit(holder, "host-control:request", { roomCode, playerId: holderId });
await emit(host, "host-control:resolve", { roomCode, playerId: holderId, grant: true });
await sleep(300);
check(
  "Handy haelt die Steuerung",
  hostRoom.room?.hostControl.holderPlayerId === holderId,
  hostRoom.room?.hostControl.holderName ?? ""
);

/**
 * Reads a lobby field straight from the manifest so the test configures each
 * game the way its own setup declares, rather than hard-coding setting keys.
 */
function selectField(room, gameId) {
  const game = room.availableGames.find((entry) => entry.id === gameId);
  const field = game?.lobbySetup?.fields.find((entry) => entry.kind === "select");
  return field ? { game, field } : null;
}

async function configureFromPhone(gameId, label) {
  await select(holder, gameId);

  const found = selectField(hostRoom.room, gameId);

  if (!found) {
    check(`${label}: Auswahlfeld im Manifest`, false, "kein select-Feld gefunden");
    return;
  }

  const { field } = found;
  const settingKey = field.settingKey ?? field.id;
  const before = hostRoom.room.selectedGameSettings?.[settingKey] ?? field.defaultValue;
  const target = field.options.find((option) => option.id !== before) ?? field.options[0];

  holder.emit("game:host-action", {
    roomCode,
    gameId,
    action: { type: "configure-lobby", [field.actionKey ?? field.id]: target.id }
  });
  await sleep(500);

  const after = hostRoom.room.selectedGameSettings?.[settingKey];
  check(
    `${label}: ${field.label} vom Handy geaendert`,
    after === target.id,
    `${before} -> ${after}`
  );
}

await configureFromPhone("minions-td", "MinionsTD");
await configureFromPhone("card-table", "Kartentisch");

// A number field proves the stepper path, not just the option buttons.
const minions = hostRoom.room.availableGames.find((entry) => entry.id === "minions-td");
const numberField = minions?.lobbySetup?.fields.find((entry) => entry.kind === "number");

if (numberField) {
  await select(holder, "minions-td");

  const settingKey = numberField.settingKey ?? numberField.id;
  const before = Number(
    hostRoom.room.selectedGameSettings?.[settingKey] ?? numberField.defaultValue
  );
  const target = Math.min(numberField.max, before + numberField.step);

  holder.emit("game:host-action", {
    roomCode,
    gameId: "minions-td",
    action: { type: "configure-lobby", [numberField.actionKey ?? numberField.id]: target }
  });
  await sleep(500);

  check(
    `MinionsTD: ${numberField.label} vom Handy geaendert`,
    Number(hostRoom.room.selectedGameSettings?.[settingKey]) === target,
    `${before} -> ${hostRoom.room.selectedGameSettings?.[settingKey]}`
  );
}

// Without control the same event must bounce.
const settingsBefore = JSON.stringify(hostRoom.room.selectedGameSettings ?? {});
const refusal = new Promise((resolve) => {
  bystander.once("room:error", (payload) => resolve(payload));
  setTimeout(() => resolve(null), 2500);
});
const numberFieldKey = numberField?.actionKey ?? numberField?.id ?? "startingLives";
bystander.emit("game:host-action", {
  roomCode,
  gameId: "minions-td",
  action: { type: "configure-lobby", [numberFieldKey]: numberField?.min ?? 1 }
});
const error = await refusal;
await sleep(300);

check("Spieler ohne Steuerung wird abgewiesen", error !== null, error?.code ?? "keine Antwort");
check(
  "Einstellungen blieben unveraendert",
  JSON.stringify(hostRoom.room.selectedGameSettings ?? {}) === settingsBefore
);

// The shared screen must still be able to configure after handing over.
const screenTarget = selectField(hostRoom.room, "minions-td");

if (screenTarget) {
  const { field } = screenTarget;
  const settingKey = field.settingKey ?? field.id;
  const before = hostRoom.room.selectedGameSettings?.[settingKey];
  const target = field.options.find((option) => option.id !== before) ?? field.options[0];

  host.emit("game:host-action", {
    roomCode,
    gameId: "minions-td",
    action: { type: "configure-lobby", [field.actionKey ?? field.id]: target.id }
  });
  await sleep(500);
  check(
    "Bildschirm kann weiterhin einstellen",
    hostRoom.room.selectedGameSettings?.[settingKey] === target.id
  );
}

for (const socket of [host, holder, bystander]) {
  socket.close();
}

const failed = results.filter((result) => !result.ok);
console.log(
  failed.length === 0
    ? `\n${results.length}/${results.length} Pruefungen bestanden`
    : `\n${failed.length} von ${results.length} fehlgeschlagen`
);
process.exit(failed.length === 0 ? 0 : 1);
