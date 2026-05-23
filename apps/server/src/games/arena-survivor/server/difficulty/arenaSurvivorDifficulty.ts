import {
  arenaSurvivorSetupConfig,
  resolveArenaSurvivorDifficultyTier
} from "@open-party-lab/protocol";
import { arenaSurvivorConfig } from "../arenaSurvivorConfig.js";

export interface ArenaSurvivorDifficultyState {
  level: number;
  difficultyTier: number;
  playerCountMultiplier: number;
  enemySpawnIntervalMs: number;
  maxEnemiesOnScreen: number;
  pickupValue: number;
  enemyHpMultiplier: number;
  enemyDamageMultiplier: number;
  enemySpeedMultiplier: number;
  enemyUnlockWaveBonus: number;
  spawnBurstBonus: number;
  bossSpawnCount: number;
  bossHpMultiplier: number;
}

export function resolveArenaSurvivorPlayerCountMultiplier(playerCount: number): number {
  return Math.pow(1.5, Math.max(0, playerCount - 1));
}

export function resolveArenaSurvivorDifficulty(
  roundNumber: number,
  playerCount = 1,
  difficultyTier: number = arenaSurvivorSetupConfig.difficulty.defaultValue
): ArenaSurvivorDifficultyState {
  const level = Math.max(1, roundNumber);
  const spawnIntervalReduction = (level - 1) * arenaSurvivorConfig.difficultySpawnIntervalReductionMs;
  const maxEnemiesBonus = (level - 1) * arenaSurvivorConfig.difficultyMaxEnemiesBonusPerRound;
  const playerCountMultiplier = resolveArenaSurvivorPlayerCountMultiplier(playerCount);
  const resolvedTier = resolveArenaSurvivorDifficultyTier(difficultyTier);
  const baseSpawnInterval = Math.max(
    200,
    arenaSurvivorConfig.enemySpawnIntervalMs - spawnIntervalReduction
  );

  return {
    level,
    difficultyTier: resolvedTier.level,
    playerCountMultiplier,
    enemySpawnIntervalMs: Math.max(
      200,
      Math.round(
        (baseSpawnInterval * resolvedTier.spawnIntervalMultiplier) / playerCountMultiplier
      )
    ),
    maxEnemiesOnScreen: Math.max(
      8,
      arenaSurvivorConfig.maxEnemiesOnScreen +
        Math.min(48, maxEnemiesBonus) +
        resolvedTier.maxEnemyCountBonus
    ),
    pickupValue: arenaSurvivorConfig.pickupValueBase,
    enemyHpMultiplier: resolvedTier.enemyHpMultiplier,
    enemyDamageMultiplier: resolvedTier.enemyDamageMultiplier,
    enemySpeedMultiplier: resolvedTier.enemySpeedMultiplier,
    enemyUnlockWaveBonus: resolvedTier.enemyUnlockWaveBonus,
    spawnBurstBonus: resolvedTier.spawnBurstBonus,
    bossSpawnCount: resolvedTier.bossSpawnCount,
    bossHpMultiplier: resolvedTier.bossHpMultiplier
  };
}
