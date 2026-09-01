import Phaser from "phaser";
import type { HostSocketClient } from "./hostSocketClient.js";
import { resolveHostSurface } from "./hostSurface.js";
import { HostPerfTracker } from "./perfTelemetry.js";

/**
 * Scenes the platform itself owns.
 *
 * Exactly one is left. Lobby and catalog used to be Phaser scenes that
 * hand-computed their own pixel layout, scrollbar and hit areas; they are DOM
 * now, which is both crisper and a great deal less code. The canvas is for
 * games.
 */
export const hostSceneKeys = {
  boot: "BootScene"
} as const;

export function createHostRouter(game: Phaser.Game, client: HostSocketClient): () => void {
  const perfTracker = new HostPerfTracker(game, "host-router", "host-router");
  let currentSceneKey: string | null = null;
  let currentDomGameId: string | null = null;
  let unmountDomGame: (() => void) | null = null;
  const domRoot = document.createElement("div");
  domRoot.dataset.hostGameSurface = "";
  Object.assign(domRoot.style, {
    position: "fixed",
    inset: "0",
    display: "none",
    overflow: "hidden"
  });
  document.getElementById("app")?.appendChild(domRoot);

  const unsubscribe = client.subscribe((state) => {
    const routeStart = performance.now();
    const surface = resolveHostSurface(state);
    // The shell paints the platform screen itself, so Phaser has nothing to run
    // there; boot keeps its scene because it is what shows before a room exists.
    const nextSceneKey =
      surface.kind === "game" && !surface.game.mountDom
        ? surface.game.sceneKey ?? null
        : surface.kind === "boot"
          ? hostSceneKeys.boot
          : null;
    const nextDomGame = surface.kind === "game" && surface.game.mountDom ? surface.game : null;
    const sceneChanged = nextSceneKey !== currentSceneKey;

    if (nextDomGame?.id !== currentDomGameId) {
      unmountDomGame?.();
      unmountDomGame = null;
      domRoot.replaceChildren();
      currentDomGameId = nextDomGame?.id ?? null;

      if (nextDomGame?.mountDom) {
        unmountDomGame = nextDomGame.mountDom(domRoot, client);
      }
    }

    domRoot.style.display = nextDomGame ? "block" : "none";

    for (const scene of game.scene.getScenes(true)) {
      if (scene.scene.key !== nextSceneKey) {
        game.scene.stop(scene.scene.key);
      }
    }

    if (nextSceneKey && !game.scene.isActive(nextSceneKey)) {
      game.scene.start(nextSceneKey);
    }

    currentSceneKey = nextSceneKey;
    // A canvas nobody is drawing into should not sit on top of the shell.
    game.canvas.style.visibility = nextSceneKey ? "visible" : "hidden";

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
        sceneKey: nextDomGame ? `dom:${nextDomGame.id}` : nextSceneKey ?? "shell"
      },
      flags: {
        sceneChanged
      }
    });
  });

  return () => {
    perfTracker.clear();
    unsubscribe();
    unmountDomGame?.();
    domRoot.remove();
  };
}
