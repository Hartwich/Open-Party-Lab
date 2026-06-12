import type { GamePlayerSummary } from "@open-party-lab/game-core";
import type { RoomRecord } from "../../rooms/roomStore.js";

export function roomPlayersToSummaries(room: RoomRecord, gameId: string): GamePlayerSummary[] {
  return [...room.players.values()]
    .sort((left, right) => left.joinedAt - right.joinedAt)
    .map((player) => ({
      id: player.id,
      name: player.name,
      color: player.color,
      score: player.score,
      isReady: player.isReady,
      connected: player.connected,
      selectedCharacterId: player.selectedCharacterId,
      setupSelections: player.setupSelectionsByGameId[gameId] ?? {}
    }));
}
