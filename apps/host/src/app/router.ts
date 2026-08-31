import Phaser from "phaser";
import { getRoomPhase } from "@open-party-lab/protocol";
import type { HostAppState, HostSocketClient } from "./hostSocketClient.js";
import { HostPerfTracker } from "./perfTelemetry.js";
import { hostGameRegistry } from "../games/registry.js";

/**
 * Scenes the platform itself owns. Everything else belongs to a game.
 */
export const hostSceneKeys = {
  boot: "BootScene",
  lobby: "LobbyScene",
  gameSelect: "GameSelectScene"
} as const;

/** Phases during which the selected game renders the screen. */
const gameOwnedPhases = new Set([
  "round_intro",
  "countdown",
  "playing",
  "locked",
  "result",
  "scoreboard",
  "finished"
]);

/**
 * The game's own host scene, or null when the game is not installed.
 *
 * A missing scene is not something to paper over: the room falls back to the
 * catalog rather than showing a stand-in that pretends the game is running.
 */
function getGameSceneKey(gameId: string | null | undefined): string | null {
  return gameId ? hostGameRegistry[gameId]?.sceneKey ?? null : null;
}

/**
 * Chooses which scene should be running.
 *
 * The platform owns three scenes — boot, lobby, game select — and hands the
 * screen to the selected game for the entire round, intro and result included.
 * The router used to carry one hand-written exception per game that had
 * outgrown the generic scoreboard; there is nothing left to except.
 */
function resolveSceneKey(state: HostAppState): string {
  if (!state.room) {
    return hostSceneKeys.boot;
  }

  if (state.sceneOverride === "catalog") {
    return hostSceneKeys.gameSelect;
  }

  const phase = getRoomPhase(state.room);
  const gameSceneKey = getGameSceneKey(state.room.selectedGameId);

  if (phase && gameSceneKey && gameOwnedPhases.has(phase)) {
    return gameSceneKey;
  }

  if (state.room.selectedGameId) {
    return hostSceneKeys.gameSelect;
  }

  return hostSceneKeys.lobby;
}

export function createHostRouter(game: Phaser.Game, client: HostSocketClient): () => void {
  let currentSceneKey: string = hostSceneKeys.boot;
  const perfTracker = new HostPerfTracker(game, "host-router", "host-router");

  const unsubscribe = client.subscribe((state) => {
    const routeStart = performance.now();
    const nextSceneKey = resolveSceneKey(state);
    const activeScenes = game.scene.getScenes(true);
    const strayScenes = activeScenes.filter((scene) => scene.scene.key !== nextSceneKey);
    const sceneChanged = nextSceneKey !== currentSceneKey || !game.scene.isActive(nextSceneKey);

    for (const scene of strayScenes) {
      game.scene.stop(scene.scene.key);
    }

    if (!(nextSceneKey === currentSceneKey && game.scene.isActive(nextSceneKey))) {
      currentSceneKey = nextSceneKey;

      if (!game.scene.isActive(nextSceneKey)) {
        game.scene.start(nextSceneKey);
      }
    }

    perfTracker.sample({
      timingsMs: {
        route: performance.now() - routeStart
      },
      counters: {
        activeScenes: game.scene.getScenes(true).length,
        players: state.room?.players.length ?? 0
      },
      tags: {
        roomCode: state.room?.code ?? null,
        gameId: state.room?.selectedGameId ?? null,
        phase: state.game?.phase ?? state.room?.lifecycle ?? null,
        sceneKey: nextSceneKey
      },
      flags: {
        sceneChanged
      }
    });
  });

  return () => {
    perfTracker.clear();
    unsubscribe();
  };
}
