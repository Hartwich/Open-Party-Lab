import type { ArenaSurvivorRuntimeState } from "../arenaSurvivorState.js";

export function applyProjectileSystem(
  state: ArenaSurvivorRuntimeState,
  deltaMs: number
): ArenaSurvivorRuntimeState {
  if (state.phase !== "playing") {
    return state;
  }

  const deltaSeconds = Math.max(0.001, deltaMs / 1000);

  return {
    ...state,
    projectiles: state.projectiles
      .map((projectile) => {
        if (!projectile.alive) {
          return projectile;
        }

        const nextX = projectile.x + projectile.vx * deltaSeconds;
        const nextY = projectile.y + projectile.vy * deltaSeconds;
        const nextTravelledDistance =
          projectile.travelledDistance + Math.hypot(projectile.vx, projectile.vy) * deltaSeconds;
        const nextAgeMs = projectile.ageMs + deltaMs;
        const stillAlive =
          nextAgeMs < projectile.lifetimeMs &&
          nextTravelledDistance < projectile.maxRange &&
          nextX >= -projectile.radius &&
          nextY >= -projectile.radius &&
          nextX <= state.arenaWidth + projectile.radius &&
          nextY <= state.arenaHeight + projectile.radius;

        return {
          ...projectile,
          x: nextX,
          y: nextY,
          ageMs: nextAgeMs,
          travelledDistance: nextTravelledDistance,
          alive: stillAlive
        };
      })
      .filter((projectile) => projectile.alive)
  };
}
