/**
 * Starts a round in every installed game against a running server.
 *
 * The per-round smoke test only drives one game. This one walks the catalog:
 * for each entry it joins the minimum number of players, satisfies whatever
 * setup the manifest declares (character choice, lobby confirmation), readies
 * everyone and checks that the round actually reaches a live phase.
 *
 * It does not play the games — it proves they load, accept a round start and
 * advance, which is what breaks when the platform contract changes.
 *
 *   npm run dev:server
 *   URL=http://127.0.0.1:3000 npm run smoke:games
 */
import { io } from "socket.io-client";

const URL = process.env.URL ?? "http://127.0.0.1:3000";
const LIVE_PHASES = new Set(["round_intro", "countdown", "playing", "locked"]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function connect() {
  return io(URL, { transports: ["websocket"], forceNew: true });
}

function once(socket, event, predicate = () => true, timeoutMs = 10_000) {
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
    const timer = setTimeout(() => resolve({ ok: false, error: "ack timeout" }), 10_000);
    socket.emit(event, payload, (result) => {
      clearTimeout(timer);
      resolve(result);
    });
  });
}

/**
 * Plays a game up to its first live phase.
 *
 * Returns a short verdict string; anything other than a live phase is a
 * failure the caller reports.
 */
async function exerciseGame(game) {
  const host = connect();
  const phones = [];

  try {
    await once(host, "server:hello");
    const created = await emitAck(host, "room:create", { hostName: "Catalog", language: "de" });

    if (!created.ok) {
      return { ok: false, detail: `Raum: ${created.error}` };
    }

    const room = created.data.room;
    const errors = [];
    host.on("room:error", (payload) => errors.push(payload.message));

    const playerCount = Math.max(1, Math.min(game.minPlayers, game.maxPlayers));

    for (let index = 0; index < playerCount; index += 1) {
      const phone = connect();
      phones.push(phone);
      await once(phone, "server:hello");
      const joined = await emitAck(phone, "room:join", {
        roomCode: room.code,
        playerName: `P${index + 1}`,
        deviceId: `catalog-${game.id}-${index}`
      });

      if (!joined.ok) {
        return { ok: false, detail: `Beitritt: ${joined.error}` };
      }

      phone.playerId = joined.data.player.id;
    }

    const selected = once(host, "room:state", (p) => p.room.selectedGameId === game.id, 8000);
    host.emit("game:select", { roomCode: room.code, gameId: game.id });
    await selected.catch(() => null);

    // Satisfy a per-player chooser by taking the first option for everyone.
    const setupOption = game.playerSetup?.options?.[0];

    if (setupOption) {
      for (const phone of phones) {
        await emitAck(phone, "player:set-setup", {
          roomCode: room.code,
          playerId: phone.playerId,
          selectionKey: game.playerSetup.selectionKey ?? "character",
          value:
            game.playerSetup.kind === "multi-select"
              ? game.playerSetup.options
                  .slice(0, Math.max(1, game.playerSetup.minSelections))
                  .map((option) => option.id)
              : setupOption.id
        });
      }
    }

    // Confirm a lobby setup if the game gates the start behind one.
    const confirmation = game.lobbySetup?.confirmation;

    if (confirmation) {
      host.emit("game:host-action", {
        roomCode: room.code,
        gameId: game.id,
        action: { type: confirmation.actionType }
      });
      await sleep(150);
    }

    const live = once(host, "room:state", (p) => LIVE_PHASES.has(p.room.currentRound?.phase ?? ""), 12_000);

    for (const phone of phones) {
      phone.emit("player:ready", { roomCode: room.code, playerId: phone.playerId, isReady: true });
    }

    await sleep(250);

    // `wait_for_ready` games start themselves; the rest need an explicit start.
    if (game.roundCompletionMode !== "wait_for_ready") {
      host.emit("round:start", { roomCode: room.code });
    }

    const started = await live.catch(() => null);

    if (!started) {
      return { ok: false, detail: errors.at(-1) ?? "keine Runde gestartet" };
    }

    // Let it tick briefly so a crash in the game loop surfaces here.
    await sleep(700);
    const stillAlive = await emitAck(host, "round:abort", { roomCode: room.code });

    return {
      ok: true,
      detail: `${started.room.currentRound.phase}${stillAlive.ok ? "" : " (Abbruch fehlgeschlagen)"}`
    };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : String(error) };
  } finally {
    for (const phone of phones) phone.close();
    host.close();
  }
}

async function main() {
  const probe = connect();
  await once(probe, "server:hello");
  const created = await emitAck(probe, "room:create", { hostName: "Probe", language: "de" });
  const games = created.data.room.availableGames;
  probe.close();

  console.log(`${games.length} Spiele im Katalog\n`);

  const failures = [];

  for (const game of games) {
    const result = await exerciseGame(game);
    console.log(`${result.ok ? "PASS" : "FAIL"}  ${game.id.padEnd(22)} ${result.detail}`);

    if (!result.ok) {
      failures.push(game.id);
    }
  }

  console.log(`\n${games.length - failures.length}/${games.length} Spiele starten eine Runde`);

  if (failures.length > 0) {
    console.log(`Fehlgeschlagen: ${failures.join(", ")}`);
  }

  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("FEHLER", error);
  process.exit(1);
});
