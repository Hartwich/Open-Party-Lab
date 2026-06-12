import { setTimeout as wait } from "node:timers/promises";
import { io } from "socket.io-client";

const defaultNames = [
  "AI Ada",
  "AI Ben",
  "AI Cora",
  "AI Dee",
  "AI Eli",
  "AI Fin",
  "AI Gia",
  "AI Hal"
];

function parseArgs(argv) {
  const args = {
    server: "http://127.0.0.1:3000",
    room: "DEBU",
    players: 4,
    prefix: "AI",
    ready: true,
    holdMs: 0,
    inputJson: null,
    inputEveryMs: 100,
    inputDurationMs: 0,
    autoCharacter: true
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }

    if (arg === "--server" && next) {
      args.server = next;
      index += 1;
      continue;
    }

    if (arg === "--room" && next) {
      args.room = next.toUpperCase();
      index += 1;
      continue;
    }

    if (arg === "--players" && next) {
      args.players = Number.parseInt(next, 10);
      index += 1;
      continue;
    }

    if (arg === "--prefix" && next) {
      args.prefix = next;
      index += 1;
      continue;
    }

    if (arg === "--ready" && next) {
      args.ready = next !== "false";
      index += 1;
      continue;
    }

    if (arg === "--hold-ms" && next) {
      args.holdMs = Number.parseInt(next, 10);
      index += 1;
      continue;
    }

    if (arg === "--input-json" && next) {
      args.inputJson = next;
      index += 1;
      continue;
    }

    if (arg === "--input-every-ms" && next) {
      args.inputEveryMs = Number.parseInt(next, 10);
      index += 1;
      continue;
    }

    if (arg === "--input-duration-ms" && next) {
      args.inputDurationMs = Number.parseInt(next, 10);
      index += 1;
      continue;
    }

    if (arg === "--auto-character" && next) {
      args.autoCharacter = next !== "false";
      index += 1;
      continue;
    }

    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  if (!Number.isInteger(args.players) || args.players < 1) {
    throw new Error("--players must be a positive integer.");
  }

  if (!Number.isInteger(args.holdMs) || args.holdMs < 0) {
    throw new Error("--hold-ms must be a non-negative integer.");
  }

  if (!Number.isInteger(args.inputEveryMs) || args.inputEveryMs < 1) {
    throw new Error("--input-every-ms must be a positive integer.");
  }

  if (!Number.isInteger(args.inputDurationMs) || args.inputDurationMs < 0) {
    throw new Error("--input-duration-ms must be a non-negative integer.");
  }

  if (args.inputJson) {
    args.inputTemplate = JSON.parse(args.inputJson);
  }

  return args;
}

function printHelp() {
  console.log(`Virtual controller helper for AI browser checks.

Usage:
  npm run ai:controllers -- --room DEBU --players 4 --ready true --hold-ms 600000

Options:
  --server <url>              Socket.IO server URL. Default: http://127.0.0.1:3000
  --room <code>               Existing room code. Default: DEBU
  --players <count>           Number of virtual controllers. Default: 4
  --prefix <name>             Player name prefix. Default: AI
  --ready <true|false>        Mark controllers ready after joining. Default: true
  --hold-ms <ms>              Keep controller sockets connected. Default: 0
  --input-json <json>         Repeated game input payload template.
  --input-every-ms <ms>       Interval for repeated input. Default: 100
  --input-duration-ms <ms>    Duration for repeated input. Default: 0
  --auto-character <true|false>
                              Auto-pick player setup options when present. Default: true

The helper is game-agnostic. For game input, pass the JSON shape that game expects.
It adds playerId, sentAt, and pressedAt when those fields are not already provided.`);
}

function connectSocket(serverUrl) {
  return io(serverUrl, {
    transports: ["websocket"],
    timeout: 5_000
  });
}

function onceConnect(socket) {
  return new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
  });
}

function emitAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (result) => {
      if (result?.ok) {
        resolve(result.data);
        return;
      }

      reject(new Error(result?.error ?? `${event} failed`));
    });
  });
}

function resolvePlayerName(prefix, index) {
  if (prefix === "AI") {
    return defaultNames[index] ?? `AI ${index + 1}`;
  }

  return `${prefix} ${index + 1}`;
}

function createInput(template, playerId) {
  const now = Date.now();

  return {
    ...template,
    playerId: template.playerId ?? playerId,
    sentAt: template.sentAt ?? now,
    pressedAt: template.pressedAt ?? now
  };
}

function resolveAutoSetupValue(playerSetup, index) {
  if (!playerSetup) {
    return null;
  }

  if (playerSetup.kind === "choice") {
    const option = playerSetup.options[index % playerSetup.options.length];
    return option ? option.id : null;
  }

  if (playerSetup.kind === "multi-select") {
    if (Array.isArray(playerSetup.defaultValue) && playerSetup.defaultValue.length > 0) {
      return [...playerSetup.defaultValue];
    }

    return playerSetup.options
      .slice(0, playerSetup.maxSelections)
      .map((option) => option.id);
  }

  return null;
}

async function joinVirtualControllers(args) {
  const controllers = [];

  for (let index = 0; index < args.players; index += 1) {
    const socket = connectSocket(args.server);

    socket.on("room:error", (error) => {
      console.warn(`[virtual-controller] room:error ${JSON.stringify(error)}`);
    });

    await onceConnect(socket);

    const joined = await emitAck(socket, "room:join", {
      roomCode: args.room,
      playerName: resolvePlayerName(args.prefix, index),
      deviceId: `ai-controller-${args.room.toLowerCase()}-${index + 1}-${Date.now()}`
    });

    const controller = {
      socket,
      playerId: joined.player.id,
      name: joined.player.name,
      room: joined.room
    };

    controllers.push(controller);

    if (args.autoCharacter) {
      const selectedGame = joined.room.availableGames.find(
        (game) => game.id === joined.room.selectedGameId
      );
      const playerSetup = selectedGame?.playerSetup;
      const setupValue = resolveAutoSetupValue(playerSetup, index);
      const selectionKey = playerSetup?.selectionKey ?? "character";

      if (setupValue) {
        socket.emit("player:set-setup", {
          roomCode: args.room,
          playerId: controller.playerId,
          selectionKey,
          value: setupValue
        });
      }
    }

    if (args.ready) {
      socket.emit("player:ready", {
        roomCode: args.room,
        playerId: controller.playerId,
        isReady: true
      });
    }
  }

  return controllers;
}

async function sendRepeatedInput(args, controllers) {
  if (!args.inputTemplate || args.inputDurationMs === 0) {
    return;
  }

  const endAt = Date.now() + args.inputDurationMs;

  while (Date.now() < endAt) {
    for (const controller of controllers) {
      controller.socket.emit("game:input", {
        roomCode: args.room,
        playerId: controller.playerId,
        input: createInput(args.inputTemplate, controller.playerId)
      });
    }

    await wait(args.inputEveryMs);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const controllers = await joinVirtualControllers(args);

  console.log(JSON.stringify({
    ok: true,
    room: args.room,
    players: controllers.map((controller) => ({
      id: controller.playerId,
      name: controller.name
    })),
    ready: args.ready,
    holdMs: args.holdMs
  }, null, 2));

  await sendRepeatedInput(args, controllers);

  if (args.holdMs > 0) {
    await wait(args.holdMs);
  }

  for (const controller of controllers) {
    controller.socket.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
