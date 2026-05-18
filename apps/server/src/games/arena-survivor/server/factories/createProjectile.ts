import { createId } from "../../../../core/ids/createId.js";
import {
  arenaSurvivorProjectileDefinition,
  arenaSurvivorProjectileDefinitionsById
} from "../definitions/projectileDefinitions.js";
import {
  type ArenaSurvivorRuntimeProjectileState
} from "../arenaSurvivorState.js";

export interface ProjectileSpawnPoint {
  originX: number;
  originY: number;
  angleRad: number;
  ownerId: string;
  ownerKind: "player" | "enemy";
  definitionId?: string;
  now: number;
  speed?: number;
  damage?: number;
  radius?: number;
  lifetimeMs?: number;
  maxRange?: number;
  pierce?: number;
  crit?: boolean;
}

export function createArenaSurvivorProjectile(
  spawnPoint: ProjectileSpawnPoint
): ArenaSurvivorRuntimeProjectileState {
  const projectileDefinition =
    (spawnPoint.definitionId
      ? arenaSurvivorProjectileDefinitionsById[spawnPoint.definitionId]
      : null) ?? arenaSurvivorProjectileDefinition;
  const speed = spawnPoint.speed ?? projectileDefinition.speed;
  const velocityX = Math.cos(spawnPoint.angleRad) * speed;
  const velocityY = Math.sin(spawnPoint.angleRad) * speed;

  return {
    id: createId("projectile"),
    ownerId: spawnPoint.ownerId,
    ownerKind: spawnPoint.ownerKind,
    definitionId: projectileDefinition.id,
    x: spawnPoint.originX,
    y: spawnPoint.originY,
    vx: velocityX,
    vy: velocityY,
    radius: spawnPoint.radius ?? projectileDefinition.radius,
    damage: spawnPoint.damage ?? projectileDefinition.damage,
    ageMs: 0,
    lifetimeMs: spawnPoint.lifetimeMs ?? projectileDefinition.lifetimeMs,
    travelledDistance: 0,
    maxRange: spawnPoint.maxRange ?? projectileDefinition.maxRange,
    remainingPierce: spawnPoint.pierce ?? projectileDefinition.pierce,
    alive: true,
    crit: spawnPoint.crit ?? false,
    spawnedAtMs: spawnPoint.now
  };
}
