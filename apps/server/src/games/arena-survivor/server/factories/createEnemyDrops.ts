import { arenaSurvivorConfig } from "../arenaSurvivorConfig.js";
import { createSeededRandom, type ArenaSurvivorRuntimeEnemyState } from "../arenaSurvivorState.js";
import type { ArenaSurvivorRuntimePickupState } from "../arenaSurvivorState.js";
import { createArenaSurvivorPickup } from "./createPickup.js";

export interface ArenaSurvivorEnemyDropResult {
  pickups: ArenaSurvivorRuntimePickupState[];
  seed: number;
}

export interface ArenaSurvivorEnemyDropParams {
  enemy: ArenaSurvivorRuntimeEnemyState;
  materialValue: number;
  now: number;
  seed: number;
  luck?: number;
}

export function createArenaSurvivorEnemyDrops(
  params: ArenaSurvivorEnemyDropParams
): ArenaSurvivorEnemyDropResult {
  const pickups: ArenaSurvivorRuntimePickupState[] = [];
  const luck = Math.max(-100, params.luck ?? 0);
  const luckDropMultiplier = Math.max(0.25, Math.min(2.5, 1 + luck / 100));
  let nextSeed = params.seed;

  if (params.materialValue > 0) {
    const bonusRoll = createSeededRandom(nextSeed);
    nextSeed = bonusRoll.seed;
    const bonusMaterial = bonusRoll.value <= Math.min(0.5, Math.max(0, luck / 220)) ? 1 : 0;

    pickups.push(
      createArenaSurvivorPickup({
        kind: "material",
        x: params.enemy.x,
        y: params.enemy.y,
        value: params.materialValue + bonusMaterial,
        now: params.now
      })
    );
  }

  const healthRoll = createSeededRandom(nextSeed);
  nextSeed = healthRoll.seed;

  if (healthRoll.value <= arenaSurvivorConfig.healthPickupDropChance * luckDropMultiplier) {
    const angleRoll = createSeededRandom(nextSeed);
    nextSeed = angleRoll.seed;
    const offsetDistance = Math.max(14, params.enemy.radius * 0.9);
    const angle = angleRoll.value * Math.PI * 2;

    pickups.push(
      createArenaSurvivorPickup({
        kind: "health",
        x: params.enemy.x + Math.cos(angle) * offsetDistance,
        y: params.enemy.y + Math.sin(angle) * offsetDistance,
        now: params.now
      })
    );
  }

  return {
    pickups,
    seed: nextSeed
  };
}
