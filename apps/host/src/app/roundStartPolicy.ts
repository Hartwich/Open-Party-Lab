import type { AvailableGameDto, RoomSnapshot } from "@open-party-lab/protocol";

export function getSelectedGame(room: RoomSnapshot | null): AvailableGameDto | undefined {
  if (!room?.selectedGameId) {
    return undefined;
  }

  return room.availableGames.find((game) => game.id === room.selectedGameId);
}

export function requiresReadyAutoStart(game: AvailableGameDto | undefined): boolean {
  return game?.roundCompletionMode === "wait_for_ready";
}
