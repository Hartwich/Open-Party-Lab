import type { HostGame } from "@open-party-lab/game-core";
import { externalHostGameRegistry } from "./.generated/externalGames.js";

/**
 * Every installed game, keyed by id.
 *
 * The platform ships no games of its own — this map is generated from the game
 * repos that are present, and is the only place the host learns that a game
 * exists.
 */
export const hostGameRegistry: Record<string, HostGame> = {
  ...(externalHostGameRegistry as Record<string, HostGame>)
};
