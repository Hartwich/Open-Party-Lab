import type { ArenaSurvivorEnemyDefinition } from "@open-party-lab/protocol";
import {
  createSeededRandom
} from "../arenaSurvivorState.js";
import { arenaSurvivorEnemyDefinitions } from "../definitions/enemyDefinitions.js";

export interface ArenaSurvivorSpawnPick {
  definition: ArenaSurvivorEnemyDefinition;
  seed: number;
}

export function resolveArenaSurvivorSpawnBurst(waveNumber: number): number {
  if (waveNumber >= 10) {
    return 3;
  }

  if (waveNumber >= 5) {
    return 2;
  }

  return 1;
}

export function pickArenaSurvivorEnemyDefinition(
  waveNumber: number,
  seed: number
): ArenaSurvivorSpawnPick {
  const candidates = arenaSurvivorEnemyDefinitions.filter(
    (definition) =>
      definition.minWave <= waveNumber &&
      !(definition.tags as readonly string[]).includes("boss")
  );
  const fallback = arenaSurvivorEnemyDefinitions[0];

  if (candidates.length === 0) {
    return {
      definition: fallback,
      seed
    };
  }

  const weightedCandidates = candidates.flatMap((definition) => {
    const waveBias = Math.max(1, waveNumber - definition.minWave + 1);
    const roleWeightMultiplier = definition.role === "shooter" ? 0.42 : 1;
    const weight = Math.max(
      1,
      Math.round(definition.spawnWeight * roleWeightMultiplier * (1 + waveBias * 0.15))
    );

    return Array.from({ length: weight }, () => definition);
  });

  const random = createSeededRandom(seed);
  const index = Math.floor(random.value * weightedCandidates.length);

  return {
    definition: weightedCandidates[index] ?? fallback,
    seed: random.seed
  };
}
