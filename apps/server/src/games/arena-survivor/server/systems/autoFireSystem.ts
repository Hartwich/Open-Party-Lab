import { resolveArenaSurvivorWeaponSlotTransform } from "@open-party-lab/protocol";
import type {
  ArenaSurvivorRuntimeEnemyState,
  ArenaSurvivorRuntimePlayerState,
  ArenaSurvivorRuntimeState
} from "../arenaSurvivorState.js";
import { createSeededRandom, distanceSquared } from "../arenaSurvivorState.js";
import { arenaSurvivorProjectileDefinitionsById } from "../definitions/projectileDefinitions.js";
import { createArenaSurvivorEnemyDrops } from "../factories/createEnemyDrops.js";
import { createArenaSurvivorProjectile } from "../factories/createProjectile.js";
import { resolveArenaSurvivorDifficulty } from "../difficulty/arenaSurvivorDifficulty.js";
import { resolveArenaSurvivorWeaponLevel } from "../loadout/arenaSurvivorLoadout.js";

const weaponOrbitDistanceMultiplier = 2.25;

function pickTargetEnemy(
  originX: number,
  originY: number,
  enemies: ArenaSurvivorRuntimeEnemyState[],
  range: number,
  extraHitRadius = 0
) {
  const aliveEnemies = enemies.filter((enemy) => enemy.alive);

  if (aliveEnemies.length === 0) {
    return undefined;
  }

  const inRange = aliveEnemies.filter((enemy) => {
    const hitDistance = range + enemy.radius + extraHitRadius;
    return distanceSquared(originX, originY, enemy.x, enemy.y) <= hitDistance * hitDistance;
  });

  if (inRange.length === 0) {
    return undefined;
  }

  return inRange.reduce((closest, enemy) => {
    const closestDistance = distanceSquared(originX, originY, closest.x, closest.y);
    const enemyDistance = distanceSquared(originX, originY, enemy.x, enemy.y);
    return enemyDistance < closestDistance ? enemy : closest;
  });
}

function collectEnemiesInRange(
  originX: number,
  originY: number,
  enemies: ArenaSurvivorRuntimeEnemyState[],
  range: number,
  extraHitRadius = 0
): ArenaSurvivorRuntimeEnemyState[] {
  return enemies
    .filter((enemy) => {
      if (!enemy.alive) {
        return false;
      }

      const hitDistance = range + enemy.radius + extraHitRadius;
      return distanceSquared(originX, originY, enemy.x, enemy.y) <= hitDistance * hitDistance;
    })
    .sort(
      (left, right) =>
        distanceSquared(originX, originY, left.x, left.y) -
        distanceSquared(originX, originY, right.x, right.y)
    );
}

export function applyAutoFireSystem(
  state: ArenaSurvivorRuntimeState,
  deltaMs: number,
  now: number
): ArenaSurvivorRuntimeState {
  if (state.phase !== "playing") {
    return state;
  }

  const nextPlayers = [...state.players];
  const nextEnemies = state.enemies.map((enemy) => ({ ...enemy }));
  const nextProjectiles = [...state.projectiles];
  const nextPickups = [...state.pickups];
  const difficulty = resolveArenaSurvivorDifficulty(
    state.waveNumber,
    state.players.length,
    state.difficultyTier
  );
  let nextSeed = state.seed;
  let nextKills = state.kills;

  for (let playerIndex = 0; playerIndex < nextPlayers.length; playerIndex += 1) {
    const player = nextPlayers[playerIndex];

    if (!player.alive) {
      continue;
    }

    const nextWeaponStates = player.weaponRuntimeStates.map((weaponState) => ({
      ...weaponState,
      cooldownRemainingMs: Math.max(0, weaponState.cooldownRemainingMs - deltaMs)
    }));
    let shotsFiredThisTick = 0;
    let hitsLandedThisTick = 0;
    let killsThisTick = 0;
    let nextPlayer = {
      ...player
    };

    for (let weaponIndex = 0; weaponIndex < nextWeaponStates.length; weaponIndex += 1) {
      const weaponState = nextWeaponStates[weaponIndex];

      if (weaponState.cooldownRemainingMs > 0) {
        continue;
      }

      const { definition, levelDefinition } = resolveArenaSurvivorWeaponLevel(
        weaponState.weaponId,
        weaponState.level
      );
      const slotTransform = resolveArenaSurvivorWeaponSlotTransform(
        weaponIndex,
        nextPlayer.radius * weaponOrbitDistanceMultiplier
      );
      const originX = nextPlayer.x + slotTransform.offsetX;
      const originY = nextPlayer.y + slotTransform.offsetY;
      const projectileRadius =
        definition.attackPattern === "single_projectile"
          ? (arenaSurvivorProjectileDefinitionsById[definition.projectileDefinitionId ?? definition.id]?.radius ?? 0)
          : 0;
      const targetEnemy = pickTargetEnemy(
        originX,
        originY,
        nextEnemies,
        levelDefinition.range,
        projectileRadius
      );

      if (!targetEnemy) {
        continue;
      }

      const categoryMultiplier =
        definition.category === "magic"
          ? nextPlayer.stats.magicPowerMultiplier
          : definition.category === "melee"
            ? nextPlayer.stats.meleePowerMultiplier
            : nextPlayer.stats.rangedPowerMultiplier;
      const elementalMultiplier = definition.tags.includes("elemental")
        ? nextPlayer.stats.elementalPowerMultiplier
        : 1;
      const baseAngle = Math.atan2(targetEnemy.y - originY, targetEnemy.x - originX);
      const attackReachDistance =
        definition.category === "melee"
          ? Math.max(
            nextPlayer.radius * 0.65,
            Math.hypot(targetEnemy.x - originX, targetEnemy.y - originY) - targetEnemy.radius * 0.55
          )
          : null;
      const baseDamage =
        levelDefinition.damage *
        nextPlayer.stats.damageMultiplier *
        categoryMultiplier *
        elementalMultiplier;
      const cooldownMs = levelDefinition.cooldownMs / nextPlayer.stats.autoFireRateMultiplier;
      const critChance = nextPlayer.stats.critChancePct / 100;
      const critScale = levelDefinition.critScale ?? 1;

      if (definition.attackPattern === "single_projectile") {
        const projectileCount = Math.max(
          1,
          (levelDefinition.projectileCount ?? 1) + nextPlayer.stats.projectileCountBonus
        );
        const spreadRad = projectileCount > 1 ? 0.18 : 0;
        const projectileSpeed =
          levelDefinition.projectileSpeed * nextPlayer.stats.projectileSpeedMultiplier;

        for (let index = 0; index < projectileCount; index += 1) {
          const offsetIndex = index - (projectileCount - 1) / 2;
          const angle = baseAngle + offsetIndex * spreadRad;
          const critRoll = createSeededRandom(nextSeed);
          nextSeed = critRoll.seed;
          const crit = critRoll.value <= critChance;
          const damage = crit
            ? baseDamage * nextPlayer.stats.critDamageMultiplier * critScale
            : baseDamage;

          nextProjectiles.push(
            createArenaSurvivorProjectile({
              ownerId: nextPlayer.playerId,
              ownerKind: "player",
              definitionId: definition.projectileDefinitionId ?? definition.id,
              originX,
              originY,
              angleRad: angle,
              now,
              speed: projectileSpeed,
              damage,
              maxRange: levelDefinition.range,
              pierce: Math.max(1, 1 + (levelDefinition.pierce ?? 0) + nextPlayer.stats.pierceBonus),
              crit
            })
          );
        }

        shotsFiredThisTick += projectileCount;
      } else {
        const rapidHitCount = Math.max(
          1,
          (levelDefinition.projectileCount ?? 1) + nextPlayer.stats.projectileCountBonus
        );
        const cleaveTargetCount = Math.max(0, (levelDefinition.pierce ?? 0) + nextPlayer.stats.pierceBonus);
        const primaryTargetId = targetEnemy.id;

        for (let hitIndex = 0; hitIndex < rapidHitCount; hitIndex += 1) {
          const activePrimaryTarget =
            nextEnemies.find((enemy) => enemy.id === primaryTargetId && enemy.alive) ??
            pickTargetEnemy(originX, originY, nextEnemies, levelDefinition.range, 0);

          if (!activePrimaryTarget) {
            break;
          }

          const targetIndex = nextEnemies.findIndex((enemy) => enemy.id === activePrimaryTarget.id);
          const enemy = targetIndex >= 0 ? nextEnemies[targetIndex] : null;

          if (!enemy || !enemy.alive) {
            continue;
          }

          const critRoll = createSeededRandom(nextSeed);
          nextSeed = critRoll.seed;
          const crit = critRoll.value <= critChance;
          const damage = crit
            ? baseDamage * nextPlayer.stats.critDamageMultiplier * critScale
            : baseDamage;
          const nextEnemyHp = enemy.hp - damage;

          nextEnemies[targetIndex] = {
            ...enemy,
            hp: nextEnemyHp,
            alive: nextEnemyHp > 0
          };
          nextPlayer = {
            ...nextPlayer,
            hp: Math.min(
              nextPlayer.maxHp,
              nextPlayer.hp + damage * (Math.max(0, nextPlayer.stats.lifeStealPct) / 100)
            )
          };
          hitsLandedThisTick += 1;

          if (nextEnemyHp <= 0) {
            nextKills += 1;
            killsThisTick += 1;
            const drops = createArenaSurvivorEnemyDrops({
              enemy,
              materialValue: difficulty.pickupValue,
              now,
              seed: nextSeed
            });
            nextSeed = drops.seed;
            nextPickups.push(...drops.pickups);
          }
        }

        const cleaveTargets = collectEnemiesInRange(
          originX,
          originY,
          nextEnemies,
          levelDefinition.range,
          0
        )
          .filter((enemy) => enemy.id !== primaryTargetId)
          .slice(0, cleaveTargetCount);

        for (const cleaveTarget of cleaveTargets) {
          const targetIndex = nextEnemies.findIndex((enemy) => enemy.id === cleaveTarget.id);
          const enemy = targetIndex >= 0 ? nextEnemies[targetIndex] : null;

          if (!enemy || !enemy.alive) {
            continue;
          }

          const critRoll = createSeededRandom(nextSeed);
          nextSeed = critRoll.seed;
          const crit = critRoll.value <= critChance;
          const damage = crit
            ? baseDamage * nextPlayer.stats.critDamageMultiplier * critScale
            : baseDamage;
          const nextEnemyHp = enemy.hp - damage;

          nextEnemies[targetIndex] = {
            ...enemy,
            hp: nextEnemyHp,
            alive: nextEnemyHp > 0
          };
          nextPlayer = {
            ...nextPlayer,
            hp: Math.min(
              nextPlayer.maxHp,
              nextPlayer.hp + damage * (Math.max(0, nextPlayer.stats.lifeStealPct) / 100)
            )
          };
          hitsLandedThisTick += 1;

          if (nextEnemyHp <= 0) {
            nextKills += 1;
            killsThisTick += 1;
            const drops = createArenaSurvivorEnemyDrops({
              enemy,
              materialValue: difficulty.pickupValue,
              now,
              seed: nextSeed
            });
            nextSeed = drops.seed;
            nextPickups.push(...drops.pickups);
          }
        }

        shotsFiredThisTick += rapidHitCount + cleaveTargets.length;
      }

      nextWeaponStates[weaponIndex] = {
        ...weaponState,
        cooldownRemainingMs: cooldownMs,
        lastFiredAt: state.elapsedMs,
        lastAimAngleRad: baseAngle,
        lastAttackReachDistance: attackReachDistance
      };
    }

    nextPlayers[playerIndex] = {
      ...nextPlayer,
      weaponRuntimeStates: nextWeaponStates,
      runStats: {
        ...player.runStats,
        shotsFired: player.runStats.shotsFired + shotsFiredThisTick,
        hitsLanded: player.runStats.hitsLanded + hitsLandedThisTick,
        kills: player.runStats.kills + killsThisTick
      }
    };
  }

  return {
    ...state,
    seed: nextSeed,
    kills: nextKills,
    players: nextPlayers,
    enemies: nextEnemies.filter((enemy) => enemy.alive),
    projectiles: nextProjectiles,
    pickups: nextPickups
  };
}
