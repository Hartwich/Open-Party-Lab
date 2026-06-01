import Phaser from "phaser";
import { getRoomPhase } from "@open-party-lab/protocol";
import type { HostAppState, HostSocketClient } from "./hostSocketClient.js";
import { HostPerfTracker } from "./perfTelemetry.js";
import { hostGameRegistry } from "../games/registry.js";

export const hostSceneKeys = {
  boot: "BootScene",
  lobby: "LobbyScene",
  gameSelect: "GameSelectScene",
  roundIntro: "RoundIntroScene",
  scoreboard: "ScoreboardScene"
} as const;

function shouldKeepArenaSurvivorResultScene(
  state: HostAppState,
  phase: ReturnType<typeof getRoomPhase>
): boolean {
  if (
    state.room?.selectedGameId !== "arena-survivor" ||
    (phase !== "result" && phase !== "scoreboard" && phase !== "finished")
  ) {
    return false;
  }

  const arenaState = state.game?.state as { result?: { outcome?: string } } | null | undefined;

  return arenaState?.result?.outcome === "survived";
}

function shouldKeepZeichnenUndErratenResultScene(
  state: HostAppState,
  phase: ReturnType<typeof getRoomPhase>
): boolean {
  return (
    state.room?.selectedGameId === "zeichnen-und-erraten" &&
    (phase === "result" || phase === "scoreboard" || phase === "finished")
  );
}

function shouldKeepSchaetzoramaResultScene(
  state: HostAppState,
  phase: ReturnType<typeof getRoomPhase>
): boolean {
  return (
    state.room?.selectedGameId === "schaetzorama" &&
    (phase === "result" || phase === "scoreboard" || phase === "finished")
  );
}

function resolveSceneKey(state: HostAppState): string {
  if (!state.room) {
    return hostSceneKeys.boot;
  }

  if (state.sceneOverride === "catalog") {
    return hostSceneKeys.gameSelect;
  }

  const phase = getRoomPhase(state.room);
  const selectedGameId = state.room.selectedGameId;

  if (shouldKeepArenaSurvivorResultScene(state, phase)) {
    return hostGameRegistry["arena-survivor"]?.sceneKey ?? hostSceneKeys.roundIntro;
  }

  if (shouldKeepZeichnenUndErratenResultScene(state, phase)) {
    return hostGameRegistry["zeichnen-und-erraten"]?.sceneKey ?? hostSceneKeys.roundIntro;
  }

  if (shouldKeepSchaetzoramaResultScene(state, phase)) {
    return hostGameRegistry.schaetzorama?.sceneKey ?? hostSceneKeys.roundIntro;
  }

  if (phase === "round_intro" || phase === "countdown") {
    return hostSceneKeys.roundIntro;
  }

  if (phase === "playing" || phase === "locked") {
    const gameId = state.room.selectedGameId;
    return gameId ? hostGameRegistry[gameId]?.sceneKey ?? hostSceneKeys.roundIntro : hostSceneKeys.roundIntro;
  }

  if (phase === "result" || phase === "scoreboard" || phase === "finished") {
    return hostSceneKeys.scoreboard;
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
