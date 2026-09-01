/**
 * Drives the built host in a real browser.
 *
 * The smoke suites talk to the server over Socket.IO and prove the protocol
 * works; they say nothing about what ends up on the screen. This opens the
 * built host in headless Chromium, joins real players, and checks the platform
 * surface: the room code and roster it shows, the settings card a game opens,
 * the theme switch in the dock, and the hand-over to the game when a round
 * starts. It also fails on any browser console error.
 *
 * Expects a server on SERVER_URL and the built host served at HOST_URL:
 *
 *   node scripts/host-e2e.mjs
 *   HOST_URL=http://localhost:4173 SERVER_URL=http://localhost:3000 node scripts/host-e2e.mjs
 *
 * Chromium comes from playwright-core; SHOT_DIR takes the screenshots.
 */
import { chromium } from "playwright-core";
import { io } from "socket.io-client";

const HOST_URL = process.env.HOST_URL ?? "http://localhost:4173";
const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3000";
const SHOT_DIR = process.env.SHOT_DIR ?? ".";
const NAMES = ["Patrick", "Mia Lang", "Jonas"];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const failures = [];

function check(label, condition, detail = "") {
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);

  if (!condition) {
    failures.push(label);
  }
}

const browser = await chromium.launch({
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
});
const page = await browser.newPage({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 2
});

const consoleErrors = [];
page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") {
    consoleErrors.push(`console: ${message.text()}`);
  }
});

await page.goto(HOST_URL, { waitUntil: "domcontentloaded", timeout: 20_000 });
await wait(2500);

const roomCode = await page.evaluate(
  () => document.querySelector(".opl-room-code")?.textContent?.trim() ?? null
);
check("Raumcode steht auf dem Bildschirm", Boolean(roomCode) && roomCode !== "----", roomCode ?? "");

if (!roomCode || roomCode === "----") {
  await browser.close();
  process.exit(1);
}

// Real players over the same transport a phone uses.
const sockets = [];
const playerIds = [];

for (const name of NAMES) {
  const socket = io(SERVER_URL, { transports: ["websocket"] });
  await new Promise((resolve) => socket.on("connect", resolve));
  await new Promise((resolve) => {
    socket.emit(
      "room:join",
      { roomCode, playerName: name, deviceId: `e2e-${name.replace(/\s/g, "")}` },
      (result) => {
        if (result?.ok) {
          playerIds.push(result.data.player?.id ?? result.data.playerId);
        } else {
          failures.push(`Beitritt ${name}: ${result?.error ?? "unbekannt"}`);
        }
        resolve();
      }
    );
  });
  sockets.push(socket);
}

await wait(1200);

const roster = await page.evaluate(() =>
  [...document.querySelectorAll(".opl-player-name")].map((node) =>
    node.firstChild?.textContent?.trim()
  )
);
check("Beigetretene Spieler erscheinen in der Liste", roster.length === NAMES.length, roster.join(", "));
await page.screenshot({ path: `${SHOT_DIR}/e2e-lobby.png` });

// Selecting a game must open its settings card, not a separate screen.
const tile = await page.$(".opl-tile[data-game-id]");
const chosenGame = await tile.getAttribute("data-game-id");
await tile.click();
await wait(1500);

const layout = await page.evaluate(() => {
  const card = document.querySelector(".opl-open-card");

  if (!card) {
    return null;
  }

  const setup = card.querySelector(".opl-setup");
  const shelf = document.querySelector(".opl-catalog");
  const cardBox = card.getBoundingClientRect();

  return {
    title: card.querySelector(".opl-tile-name")?.textContent?.trim(),
    fields: card.querySelectorAll(".opl-field").length,
    contentFits: setup.getBoundingClientRect().bottom <= cardBox.bottom + 1,
    shelfBelow: shelf.getBoundingClientRect().top >= cardBox.bottom - 1
  };
});

check("Gewaehltes Spiel oeffnet seine Einstellungskarte", Boolean(layout), chosenGame);
check("Einstellungen werden nicht abgeschnitten", layout?.contentFits === true);
check("Die Kachelwand bleibt darunter sichtbar", layout?.shelfBelow === true);
await page.screenshot({ path: `${SHOT_DIR}/e2e-setup.png` });

// The dock's theme button is a room setting, so it must reach the server.
await page.click('[data-action="toggle-theme"]');
await wait(1200);
const paper = await page.evaluate(() =>
  getComputedStyle(document.querySelector(".opl-shell")).getPropertyValue("--paper").trim()
);
check("Theme-Umschalter im Dock wirkt", paper === "#020617", paper);
await page.screenshot({ path: `${SHOT_DIR}/e2e-dark.png` });
await page.click('[data-action="toggle-theme"]');
await wait(800);

// Once a round runs the game owns the screen and the shell steps aside.
sockets.forEach((socket, index) =>
  socket.emit("player:ready", { roomCode, playerId: playerIds[index], isReady: true })
);
await wait(3000);

const handover = await page.evaluate(() => ({
  shellHidden: document.querySelector(".opl-shell")?.hidden ?? null,
  canvasVisible: getComputedStyle(document.querySelector("canvas")).visibility
}));
check("Shell tritt beim Rundenstart zurueck", handover.shellHidden === true);
check("Der Canvas des Spiels wird sichtbar", handover.canvasVisible === "visible");
await page.screenshot({ path: `${SHOT_DIR}/e2e-ingame.png` });

check("Keine Fehler in der Browserkonsole", consoleErrors.length === 0, consoleErrors[0] ?? "");

for (const socket of sockets) {
  socket.close();
}

await browser.close();

console.log(
  failures.length === 0
    ? "\nAlle Pruefungen bestanden"
    : `\n${failures.length} Pruefung(en) fehlgeschlagen:\n- ${failures.join("\n- ")}`
);
process.exit(failures.length === 0 ? 0 : 1);
