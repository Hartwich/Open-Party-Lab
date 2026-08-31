import Phaser from "phaser";
import type { PlayerSnapshot } from "@open-party-lab/protocol";
import type { HostAppState } from "../app/hostSocketClient.js";

/**
 * Render fingerprints.
 *
 * The lobby and game-select scenes rebuild their whole display list, so the
 * cheapest optimisation available is to not rebuild at all when the output
 * would be identical. These helpers describe exactly the state each scene
 * draws — nothing more, so that unrelated traffic (per-tick `game:state`,
 * scoreboard updates) no longer triggers a rebuild.
 *
 * Keep a field out of the signature and the scene stops reacting to it; add a
 * field the scene does not draw and the optimisation quietly disappears.
 */

function describePlayers(players: PlayerSnapshot[], includeSetup: boolean): string {
  return players
    .map((player) => {
      const base = `${player.id}:${player.name}:${player.color}:${player.isReady ? 1 : 0}:${
        player.connected ? 1 : 0
      }:${player.presence ?? ""}`;

      return includeSetup
        ? `${base}:${player.selectedCharacterId ?? ""}:${player.selectedCharacterName ?? ""}`
        : base;
    })
    .join("|");
}

function describeGames(state: HostAppState): string {
  // Ids are enough: the catalog never changes a game's copy mid-session.
  return (state.room?.availableGames ?? []).map((game) => game.id).join(",");
}

function describeViewport(scale: Phaser.Scale.ScaleManager): string {
  return `${Math.round(scale.width)}x${Math.round(scale.height)}`;
}

export function describeLobbyState(
  state: HostAppState,
  scrollY: number,
  scale: Phaser.Scale.ScaleManager
): string {
  return [
    describeViewport(scale),
    Math.round(scrollY),
    state.room?.code ?? "",
    state.room?.joinUrl ?? "",
    state.room?.language ?? state.preferredLanguage,
    state.room?.theme ?? "",
    state.room?.lifecycle ?? "",
    state.room?.currentRound?.phase ?? "",
    state.error ?? "",
    describeGames(state),
    describePlayers(state.room?.players ?? [], false)
  ].join("~");
}

export function describeGameSelectState(
  state: HostAppState,
  scrollY: number,
  scale: Phaser.Scale.ScaleManager
): string {
  const selectedGame = state.room?.selectedGameId
    ? state.room.availableGames.find((game) => game.id === state.room?.selectedGameId)
    : undefined;
  // Only games with a chooser render per-player setup details.
  const showsSetup = (selectedGame?.playerSetup?.options.length ?? 0) > 0;

  return [
    describeViewport(scale),
    Math.round(scrollY),
    state.room?.code ?? "",
    state.room?.language ?? state.preferredLanguage,
    state.room?.selectedGameId ?? "",
    state.room?.lifecycle ?? "",
    state.room?.currentRound?.phase ?? "",
    state.error ?? "",
    JSON.stringify(state.room?.selectedGameSettings ?? {}),
    describeGames(state),
    describePlayers(state.room?.players ?? [], showsSetup)
  ].join("~");
}
