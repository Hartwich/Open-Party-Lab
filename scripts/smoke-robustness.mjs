/**
 * Malformed client events must not take the server down.
 *
 * Socket.IO dispatches through a plain EventEmitter, so before the guard in
 * `network/socket/guardClientEvents.ts` anything a handler threw became an
 * uncaught exception and ended the process — every room on the server, not just
 * the offending client's. Two three-line scripts were enough: `room:create`
 * with no payload reached `payload.hostName` on `undefined`, and an event
 * without its acknowledgement callback reached `ack(...)` on `undefined`.
 *
 * The listener signature is a contract with well-behaved clients and nothing
 * enforces it on the wire, so this suite sends what a broken or hostile client
 * would and then proves the server still serves.
 *
 *   npm run dev:server
 *   URL=http://127.0.0.1:3000 npm run smoke:robustness
 */
import { io } from "socket.io-client";

const URL = process.env.URL ?? "http://127.0.0.1:3000";
const results = [];

function check(name, condition, detail = "") {
  results.push({ name, ok: Boolean(condition) });
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connect() {
  const socket = io(URL, { transports: ["websocket"], forceNew: true });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Verbindung kam nicht zustande")), 8000);
    socket.on("connect", () => {
      clearTimeout(timer);
      resolve();
    });
  });
  return socket;
}

/**
 * Sends whatever it is given, waits, and reports whether the server survived.
 *
 * A dead server cannot be connected to either, so a failed connection counts as
 * a failed check rather than an unhandled rejection — otherwise the first crash
 * hides every check after it.
 */
async function survives(label, send) {
  let socket;

  try {
    socket = await connect();
  } catch {
    check(label, false, "Server nicht erreichbar — vermutlich durch eine fruehere Pruefung beendet");
    return;
  }

  try {
    send(socket);
    await sleep(900);
    check(label, socket.connected);
  } finally {
    socket.close();
  }
}

await survives("Ereignis ohne Nutzlast und ohne Rueckmeldung", (socket) => {
  socket.emit("room:create");
});

await survives("Ereignis ohne Rueckmeldefunktion", (socket) => {
  socket.emit("room:join", { roomCode: "ZZZZ", playerName: "Bob", deviceId: "x" });
});

await survives("Nutzlast vom falschen Typ", (socket) => {
  socket.emit("player:ready", 42);
  socket.emit("game:select", null);
  socket.emit("round:start", "nein");
});

await survives("Nur die Rueckmeldung, keine Nutzlast", (socket) => {
  socket.emit("player:kick", () => {});
});

// Surviving only matters if the server still works afterwards.
let socket;

try {
  socket = await connect();
} catch {
  check("Regulaerer Raum laesst sich danach erstellen", false, "Server nicht erreichbar");
  check("Fehlgeschlagene Anfrage wird beantwortet statt zu haengen", false, "Server nicht erreichbar");
}

if (socket) {
  const created = await Promise.race([
    new Promise((resolve) => socket.emit("room:create", { hostName: "Host" }, resolve)),
    sleep(3000).then(() => null)
  ]);
  check(
    "Regulaerer Raum laesst sich danach erstellen",
    created?.ok === true,
    created?.data?.room?.code ?? created?.error ?? "keine Antwort"
  );

  // A handler that fails must still answer, or the phone waits forever.
  const answered = await Promise.race([
    new Promise((resolve) => {
      socket.emit("room:join", { roomCode: null, playerName: null }, resolve);
    }),
    sleep(3000).then(() => null)
  ]);
  check(
    "Fehlgeschlagene Anfrage wird beantwortet statt zu haengen",
    answered !== null,
    answered?.error ?? "keine Antwort"
  );

  socket.close();
}

const failed = results.filter((result) => !result.ok);
console.log(
  failed.length === 0
    ? `\n${results.length}/${results.length} Pruefungen bestanden`
    : `\n${failed.length} von ${results.length} fehlgeschlagen`
);
process.exit(failed.length === 0 ? 0 : 1);
