export function createAirHockeyMoveInput(playerId: string, moveX: number, moveY: number) {
  const magnitude = Math.hypot(moveX, moveY);
  const scale = magnitude > 1 ? 1 / magnitude : 1;

  return {
    type: "move" as const,
    playerId,
    moveX: moveX * scale,
    moveY: moveY * scale,
    sentAt: Date.now()
  };
}
