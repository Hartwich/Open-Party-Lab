import { distanceSquared } from "../arenaSurvivorState.js";
import type { ArenaSurvivorRuntimeState } from "../arenaSurvivorState.js";

export interface ArenaSurvivorCollisionReport {
  projectileHits: Array<{ projectileId: string; enemyId: string }>;
  playerProjectileHits: Array<{ projectileId: string; playerId: string }>;
  enemyHits: Array<{ enemyId: string; playerId: string }>;
}

export function resolveCollisionSystem(
  state: ArenaSurvivorRuntimeState
): ArenaSurvivorCollisionReport {
  const projectileHits: Array<{ projectileId: string; enemyId: string }> = [];
  const playerProjectileHits: Array<{ projectileId: string; playerId: string }> = [];
  const enemyHits: Array<{ enemyId: string; playerId: string }> = [];

  for (const projectile of state.projectiles) {
    if (!projectile.alive) {
      continue;
    }

    if (projectile.ownerKind === "enemy") {
      for (const player of state.players) {
        if (!player.alive) {
          continue;
        }

        const hitDistance = projectile.radius + player.radius;

        if (
          distanceSquared(projectile.x, projectile.y, player.x, player.y) <=
          hitDistance * hitDistance
        ) {
          playerProjectileHits.push({ projectileId: projectile.id, playerId: player.playerId });
          break;
        }
      }

      continue;
    }

    for (const enemy of state.enemies) {
      if (!enemy.alive) {
        continue;
      }

      const hitDistance = projectile.radius + enemy.radius;

      if (distanceSquared(projectile.x, projectile.y, enemy.x, enemy.y) <= hitDistance * hitDistance) {
        projectileHits.push({ projectileId: projectile.id, enemyId: enemy.id });
        break;
      }
    }
  }

  for (const enemy of state.enemies) {
    if (!enemy.alive) {
      continue;
    }

    for (const player of state.players) {
      if (!player.alive) {
        continue;
      }

      const hitDistance = player.radius + enemy.radius;

      if (distanceSquared(player.x, player.y, enemy.x, enemy.y) <= hitDistance * hitDistance) {
        enemyHits.push({ enemyId: enemy.id, playerId: player.playerId });
        break;
      }
    }
  }

  return {
    projectileHits,
    playerProjectileHits,
    enemyHits
  };
}
