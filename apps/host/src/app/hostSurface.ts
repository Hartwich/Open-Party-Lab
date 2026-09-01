import { getRoomPhase } from "@open-party-lab/protocol";
import type { HostAppState } from "./hostSocketClient.js";
import { hostGameRegistry } from "../games/registry.js";
import type { HostGame } from "@open-party-lab/game-core";

/**
 * Who owns the screen.
 *
 * The platform surface is no longer a Phaser scene, so "which scene runs" is
 * the wrong question. There are three answers: nothing yet (boot), the
 * platform's own room screen (shell), or the selected game. Router and shell
 * both read this, which is what keeps them from disagreeing about who is
 * drawing — the class of bug that produced the stuck intro screen.
 */
export type HostSurface =
  | { kind: "boot" }
  | { kind: "shell" }
  | { kind: "game"; game: HostGame };

/**
 * Phases during which the selected game renders the screen.
 *
 * `finished` belongs to the game: every game ships its own result screen, and
 * the platform has no scoreboard to fall back to.
 */
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
 * shell rather than showing a stand-in that pretends the game is running.
 */
function getHostGame(gameId: string | null | undefined): HostGame | null {
  return gameId ? (hostGameRegistry[gameId] ?? null) : null;
}

export function resolveHostSurface(state: HostAppState): HostSurface {
  if (!state.room) {
    return { kind: "boot" };
  }

  // The host asked to see the catalog while a game is selected.
  if (state.sceneOverride === "catalog") {
    return { kind: "shell" };
  }

  const phase = getRoomPhase(state.room);
  const game = getHostGame(state.room.selectedGameId);

  if (phase && game && gameOwnedPhases.has(phase)) {
    return { kind: "game", game };
  }

  return { kind: "shell" };
}
