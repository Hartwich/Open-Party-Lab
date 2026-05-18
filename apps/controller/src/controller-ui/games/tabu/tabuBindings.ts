export function createTabuCorrectInput(playerId: string, guessedPlayerId?: string) {
  return {
    type: "tabu_correct",
    playerId,
    sentAt: Date.now(),
    pressedAt: Date.now(),
    guessedPlayerId
  };
}
