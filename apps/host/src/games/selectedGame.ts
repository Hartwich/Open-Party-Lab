import { resolveHostChrome, type GameHostChromeOptions } from "@open-party-lab/game-core";
import type { AvailableGameDto } from "@open-party-lab/protocol";
import type { HostAppState } from "../app/hostSocketClient.js";

/**
 * Single place the host resolves "which game is selected, and what does it want
 * from the platform".
 *
 * Every overlay used to answer this with its own `if (gameId === "…")` chain.
 * Routing those questions through the manifest means adding a game never
 * requires editing platform code again.
 */
export function getSelectedGame(state: HostAppState): AvailableGameDto | undefined {
  const gameId = state.room?.selectedGameId;
  return gameId ? state.room?.availableGames.find((game) => game.id === gameId) : undefined;
}

/** Chrome preferences of the selected game, merged with the platform defaults. */
export function getSelectedGameChrome(
  state: HostAppState
): Required<GameHostChromeOptions> {
  return resolveHostChrome(getSelectedGame(state)?.hostChrome);
}
