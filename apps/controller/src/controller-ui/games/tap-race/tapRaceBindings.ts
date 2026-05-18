export function createTapRaceInput(playerId: string) {
  return {
    type: "tap",
    playerId,
    sentAt: Date.now(),
    pressedAt: Date.now()
  };
}
