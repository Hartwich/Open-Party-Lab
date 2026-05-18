import { createArenaSurvivorProjectile } from "../factories/createProjectile.js";
import type { ArenaSurvivorRuntimePlayerState, ArenaSurvivorRuntimeState } from "../arenaSurvivorState.js";
import { distanceSquared, normalizeVector } from "../arenaSurvivorState.js";

const RADIAL_BURST_PROJECTILE_COUNT = 12;
const RADIAL_BURST_ENEMY_IDS = new Set(["crimson-overlord"]);

function pickNearestAlivePlayer(
  state: ArenaSurvivorRuntimeState,
  enemyX: number,
  enemyY: number
): ArenaSurvivorRuntimePlayerState | null {
  const alivePlayers = state.players.filter((player) => player.alive);

  if (alivePlayers.length === 0) {
    return null;
  }

  return alivePlayers.reduce((closest, player) => {
    const closestDistance = distanceSquared(enemyX, enemyY, closest.x, closest.y);
    const playerDistance = distanceSquared(enemyX, enemyY, player.x, player.y);
    return playerDistance < closestDistance ? player : closest;
  });
}

function spawnRadialBurstProjectiles(
  state: ArenaSurvivorRuntimeState,
  enemy: ArenaSurvivorRuntimeState["enemies"][number],
  nextProjectiles: ArenaSurvivorRuntimeState["projectiles"]
): void {
  if (!enemy.projectile) {
    return;
  }

  const baseAngle = (state.elapsedMs / 1000) * 0.55;
  const originOffset = Math.max(10, enemy.radius * 0.6);

  for (let index = 0; index < RADIAL_BURST_PROJECTILE_COUNT; index += 1) {
    const angle = baseAngle + (index / RADIAL_BURST_PROJECTILE_COUNT) * Math.PI * 2;

    nextProjectiles.push(
      createArenaSurvivorProjectile({
        ownerId: enemy.id,
        ownerKind: "enemy",
        definitionId: enemy.projectile.id,
        originX: enemy.x + Math.cos(angle) * originOffset,
        originY: enemy.y + Math.sin(angle) * originOffset,
        angleRad: angle,
        now: state.elapsedMs,
        speed: enemy.projectile.speed,
        damage: enemy.projectile.damage,
        radius: enemy.projectile.radius,
        lifetimeMs: enemy.projectile.lifetimeMs,
        maxRange: enemy.projectile.maxRange,
        pierce: enemy.projectile.pierce
      })
    );
  }
}

export function applyEnemyAiSystem(
  state: ArenaSurvivorRuntimeState,
  deltaMs: number
): ArenaSurvivorRuntimeState {
  if (state.phase !== "playing") {
    return state;
  }

  const deltaSeconds = Math.max(0.001, deltaMs / 1000);
  const nextProjectiles = [...state.projectiles];

  return {
    ...state,
    projectiles: nextProjectiles,
    enemies: state.enemies.map((enemy) => {
      if (!enemy.alive) {
        return enemy;
      }

      const targetPlayer = pickNearestAlivePlayer(state, enemy.x, enemy.y);

      if (!targetPlayer) {
        return enemy;
      }

      const speed = Math.max(1, enemy.moveSpeed);
      const directionToPlayer = normalizeVector(targetPlayer.x - enemy.x, targetPlayer.y - enemy.y);
      const distanceToPlayer = Math.sqrt(
        distanceSquared(targetPlayer.x, targetPlayer.y, enemy.x, enemy.y)
      );
      const nextCooldown = Math.max(0, enemy.shootCooldownRemainingMs - deltaMs);
      let moveDirection = directionToPlayer;
      let moveSpeed = speed;

      if (enemy.role === "shooter" && enemy.shootRange) {
        if (distanceToPlayer <= enemy.shootRange) {
          moveSpeed = speed * 0.42;
        } else if (distanceToPlayer <= enemy.shootRange * 1.35) {
          moveSpeed = speed * 0.58;
        } else {
          moveSpeed = speed * 0.72;
        }
      }

      const nextVx = moveDirection.x * moveSpeed;
      const nextVy = moveDirection.y * moveSpeed;
      let shootCooldownRemainingMs = nextCooldown;
      const isRadialBurstEnemy = RADIAL_BURST_ENEMY_IDS.has(enemy.definitionId);

      if (
        enemy.role === "shooter" &&
        enemy.projectile &&
        nextCooldown <= 0
      ) {
        if (isRadialBurstEnemy) {
          spawnRadialBurstProjectiles(state, enemy, nextProjectiles);
          shootCooldownRemainingMs = enemy.shootCooldownMs ?? 0;
        } else if (enemy.shootRange && distanceToPlayer <= enemy.shootRange) {
          const angle = Math.atan2(targetPlayer.y - enemy.y, targetPlayer.x - enemy.x);

          nextProjectiles.push(
            createArenaSurvivorProjectile({
              ownerId: enemy.id,
              ownerKind: "enemy",
              definitionId: enemy.projectile.id,
              originX: enemy.x,
              originY: enemy.y,
              angleRad: angle,
              now: state.elapsedMs,
              speed: enemy.projectile.speed,
              damage: enemy.projectile.damage,
              radius: enemy.projectile.radius,
              lifetimeMs: enemy.projectile.lifetimeMs,
              maxRange: enemy.projectile.maxRange,
              pierce: enemy.projectile.pierce
            })
          );

          shootCooldownRemainingMs = enemy.shootCooldownMs ?? 0;
        }
      }

      return {
        ...enemy,
        shootCooldownRemainingMs,
        vx: nextVx,
        vy: nextVy,
        x: enemy.x + nextVx * deltaSeconds,
        y: enemy.y + nextVy * deltaSeconds
      };
    })
  };
}
