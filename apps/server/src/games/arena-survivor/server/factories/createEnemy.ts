import { createId } from "../../../../core/ids/createId.js";
import type { ArenaSurvivorEnemyDefinition } from "@open-party-lab/protocol";
import {
  arenaSurvivorEnemyDefinitionsById
} from "../definitions/enemyDefinitions.js";
import {
  normalizeVector,
  type ArenaSurvivorRuntimeEnemyState
} from "../arenaSurvivorState.js";

export interface EnemySpawnPoint {
  x: number;
  y: number;
}

export function createArenaSurvivorEnemy(
  definitionId: string,
  spawnPoint: EnemySpawnPoint,
  targetPoint: EnemySpawnPoint,
  now: number,
  overrides?: {
    moveSpeed?: number;
    maxHp?: number;
    contactDamage?: number;
    contactDamageCooldownMs?: number;
    projectileDamageMultiplier?: number;
  }
): ArenaSurvivorRuntimeEnemyState {
  const definition = arenaSurvivorEnemyDefinitionsById[definitionId] as
    | ArenaSurvivorEnemyDefinition
    | undefined;

  if (!definition) {
    throw new Error(`Arena Survivor enemy definition missing for ${definitionId}.`);
  }

  const direction = normalizeVector(
    targetPoint.x - spawnPoint.x,
    targetPoint.y - spawnPoint.y
  );
  const speed = overrides?.moveSpeed ?? definition.moveSpeed;
  const maxHp = overrides?.maxHp ?? definition.maxHp;
  const shootCooldownMs = definition.shootCooldownMs;
  const projectile =
    definition.projectile && overrides?.projectileDamageMultiplier
      ? {
          ...definition.projectile,
          damage: Math.max(
            1,
            Math.round(definition.projectile.damage * overrides.projectileDamageMultiplier)
          )
        }
      : definition.projectile;

  return {
    id: createId("enemy"),
    definitionId: definition.id,
    displayName: definition.displayName,
    role: definition.role,
    x: spawnPoint.x,
    y: spawnPoint.y,
    vx: direction.x * speed,
    vy: direction.y * speed,
    moveSpeed: speed,
    radius: definition.radius,
    hp: maxHp,
    maxHp,
    alive: true,
    contactDamage: overrides?.contactDamage ?? definition.contactDamage,
    contactDamageCooldownMs:
      overrides?.contactDamageCooldownMs ?? definition.contactDamageCooldownMs,
    lastContactDamageAt: null,
    shootCooldownRemainingMs: shootCooldownMs ?? 0,
    shootCooldownMs,
    shootRange: definition.shootRange,
    projectile,
    spritePath: definition.spritePath,
    portraitPath: definition.portraitPath,
    spawnedAtMs: now
  };
}
