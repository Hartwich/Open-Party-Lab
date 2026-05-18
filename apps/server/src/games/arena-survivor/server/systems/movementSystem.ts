import type { ArenaSurvivorRuntimeState } from "../arenaSurvivorState.js";
import { clamp, clampVectorMagnitude } from "../arenaSurvivorState.js";

export function applyMovementSystem(
  state: ArenaSurvivorRuntimeState,
  deltaMs: number
): ArenaSurvivorRuntimeState {
  if (state.phase !== "playing") {
    return state;
  }

  const deltaSeconds = Math.max(0.001, deltaMs / 1000);

  return {
    ...state,
    players: state.players.map((player) => {
      if (!player.alive) {
        return player;
      }

      const moveVector = clampVectorMagnitude(player.moveInputX, player.moveInputY);
      const nextVx = moveVector.x * player.moveSpeed;
      const nextVy = moveVector.y * player.moveSpeed;
      const nextX = clamp(
        player.x + nextVx * deltaSeconds,
        player.radius,
        state.arenaWidth - player.radius
      );
      const nextY = clamp(
        player.y + nextVy * deltaSeconds,
        player.radius,
        state.arenaHeight - player.radius
      );

      return {
        ...player,
        x: nextX,
        y: nextY,
        vx: nextVx,
        vy: nextVy,
        facingAngleRad: -Math.PI / 2
      };
    })
  };
}
