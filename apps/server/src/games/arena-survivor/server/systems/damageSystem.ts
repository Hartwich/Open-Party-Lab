import { arenaSurvivorConfig } from "../arenaSurvivorConfig.js";
import { createArenaSurvivorEnemyDrops } from "../factories/createEnemyDrops.js";
import { resolveArenaSurvivorDifficulty } from "../difficulty/arenaSurvivorDifficulty.js";
import { createSeededRandom } from "../arenaSurvivorState.js";
import type {
  ArenaSurvivorRuntimeEnemyState,
  ArenaSurvivorRuntimeProjectileState,
  ArenaSurvivorRuntimeState
} from "../arenaSurvivorState.js";
import type { ArenaSurvivorCollisionReport } from "./collisionSystem.js";

function resolveContactDamage(rawDamage: number, armor: number): number {
  if (armor >= 0) {
    return Math.max(1, rawDamage * (100 / (100 + armor * 18)));
  }

  return rawDamage * (1 + Math.abs(armor) * 0.08);
}

function rollDodge(dodgePct: number, seed: number): { dodged: boolean; seed: number } {
  const chance = Math.min(70, Math.max(0, dodgePct)) / 100;

  if (chance <= 0) {
    return { dodged: false, seed };
  }

  const roll = createSeededRandom(seed);

  return {
    dodged: roll.value <= chance,
    seed: roll.seed
  };
}

export function applyDamageSystem(
  state: ArenaSurvivorRuntimeState,
  report: ArenaSurvivorCollisionReport,
  now: number
): ArenaSurvivorRuntimeState {
  if (state.phase !== "playing") {
    return state;
  }

  const enemiesById = new Map<string, ArenaSurvivorRuntimeEnemyState>(
    state.enemies.map((enemy) => [enemy.id, enemy])
  );
  const projectilesById = new Map<string, ArenaSurvivorRuntimeProjectileState>(
    state.projectiles.map((projectile) => [projectile.id, projectile])
  );
  const playersById = new Map(state.players.map((player) => [player.playerId, player]));
  let nextSeed = state.seed;
  let kills = state.kills;
  let pickups = state.pickups;
  const difficulty = resolveArenaSurvivorDifficulty(
    state.waveNumber,
    state.players.length,
    state.difficultyTier
  );

  for (const hit of report.projectileHits) {
    const projectile = projectilesById.get(hit.projectileId);
    const enemy = enemiesById.get(hit.enemyId);

    if (!projectile || !enemy || !enemy.alive) {
      continue;
    }

    const nextEnemyHp = enemy.hp - projectile.damage;
    const owner = playersById.get(projectile.ownerId);

    if (owner) {
      const lifeStealAmount =
        projectile.damage * (Math.max(0, owner.stats.lifeStealPct) / 100);

      playersById.set(owner.playerId, {
        ...owner,
        hp: Math.min(owner.maxHp, owner.hp + lifeStealAmount),
        runStats: {
          ...owner.runStats,
          hitsLanded: owner.runStats.hitsLanded + 1
        }
      });
    }

    enemiesById.set(enemy.id, {
      ...enemy,
      hp: nextEnemyHp,
      alive: nextEnemyHp > 0
    });

    if (projectile.remainingPierce <= 1) {
      projectilesById.set(projectile.id, {
        ...projectile,
        remainingPierce: 0,
        alive: false
      });
    } else {
      projectilesById.set(projectile.id, {
        ...projectile,
        remainingPierce: projectile.remainingPierce - 1
      });
    }

    if (nextEnemyHp <= 0) {
      kills += 1;
      const drops = createArenaSurvivorEnemyDrops({
        enemy,
        materialValue: difficulty.pickupValue,
        now,
        seed: nextSeed,
        luck: owner?.stats.luck
      });
      nextSeed = drops.seed;
      pickups = [...pickups, ...drops.pickups];

      if (owner) {
        const updatedOwner = playersById.get(owner.playerId);

        if (updatedOwner) {
          playersById.set(owner.playerId, {
            ...updatedOwner,
            runStats: {
              ...updatedOwner.runStats,
              kills: updatedOwner.runStats.kills + 1
            }
          });
        }
      }
    }
  }

  for (const hit of report.playerProjectileHits) {
    const projectile = projectilesById.get(hit.projectileId);
    const player = playersById.get(hit.playerId);

    if (!projectile || !projectile.alive || !player || !player.alive) {
      continue;
    }

    projectilesById.set(projectile.id, {
      ...projectile,
      alive: false
    });

    if (now < player.invulnerableUntilMs) {
      continue;
    }

    const dodgeRoll = rollDodge(player.stats.dodgePct, nextSeed);
    nextSeed = dodgeRoll.seed;

    if (dodgeRoll.dodged) {
      continue;
    }

    const mitigatedDamage =
      resolveContactDamage(projectile.damage, player.stats.armor) *
      player.stats.contactDamageTakenMultiplier;
    const nextHp = player.hp - mitigatedDamage;

    playersById.set(player.playerId, {
      ...player,
      hp: nextHp,
      alive: nextHp > 0,
      invulnerableUntilMs: now + arenaSurvivorConfig.hitInvulnerabilityMs,
      runStats: {
        ...player.runStats,
        damageTaken: player.runStats.damageTaken + mitigatedDamage
      }
    });
  }

  for (const hit of report.enemyHits) {
    const enemy = enemiesById.get(hit.enemyId);
    const player = playersById.get(hit.playerId);

    if (!enemy || !enemy.alive || !player || !player.alive) {
      continue;
    }

    if (now < player.invulnerableUntilMs) {
      continue;
    }

    if (enemy.lastContactDamageAt !== null && now < enemy.lastContactDamageAt + enemy.contactDamageCooldownMs) {
      continue;
    }

    const dodgeRoll = rollDodge(player.stats.dodgePct, nextSeed);
    nextSeed = dodgeRoll.seed;

    if (dodgeRoll.dodged) {
      enemiesById.set(enemy.id, {
        ...enemy,
        lastContactDamageAt: now
      });
      continue;
    }

    const mitigatedDamage =
      resolveContactDamage(enemy.contactDamage, player.stats.armor) *
      player.stats.contactDamageTakenMultiplier;
    const nextHp = player.hp - mitigatedDamage;

    playersById.set(player.playerId, {
      ...player,
      hp: nextHp,
      alive: nextHp > 0,
      invulnerableUntilMs: now + arenaSurvivorConfig.hitInvulnerabilityMs,
      runStats: {
        ...player.runStats,
        damageTaken: player.runStats.damageTaken + mitigatedDamage
      }
    });

    enemiesById.set(enemy.id, {
      ...enemy,
      lastContactDamageAt: now
    });
  }

  return {
    ...state,
    seed: nextSeed,
    kills,
    players: state.players
      .map((player) => playersById.get(player.playerId) ?? player),
    enemies: [...enemiesById.values()].filter((enemy) => enemy.alive),
    projectiles: [...projectilesById.values()].filter((projectile) => projectile.alive),
    pickups
  };
}
