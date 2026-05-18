export interface ArenaSurvivorConfig {
  arenaWidth: number;
  arenaHeight: number;
  roundDurationMs: number;
  tickRate: number;
  enemySpawnIntervalMs: number;
  hitInvulnerabilityMs: number;
  resultScreenMs: number;
  scoreboardScreenMs: number;
  lockedMs: number;
  enemySpawnMargin: number;
  enemySpawnWarningLeadMs: number;
  enemySpawnForbiddenRadius: number;
  enemySpawnPointAttemptCount: number;
  maxEnemiesOnScreen: number;
  difficultySpawnIntervalReductionMs: number;
  difficultyMaxEnemiesBonusPerRound: number;
  difficultyEnemyHpMultiplierPerRound: number;
  difficultyEnemyWaveSpeedBonus: number;
  difficultyEnemyContactDamageIncreaseEveryRounds: number;
  difficultyPickupTierEveryRounds: number;
  pickupItemRadius: number;
  pickupLifetimeMs: number;
  pickupMagnetBaseSpeed: number;
  pickupMagnetMaxSpeed: number;
  pickupMagnetDistanceFactor: number;
  pickupValueBase: number;
  pickupValuePerDifficultyTier: number;
  healthPickupRadius: number;
  healthPickupHealAmount: number;
  healthPickupDropChance: number;
}
export const arenaSurvivorConfig: ArenaSurvivorConfig = {
  arenaWidth: 1280,
  arenaHeight: 720,
  roundDurationMs: 45000,
  tickRate: 60,
  enemySpawnIntervalMs: 881,
  hitInvulnerabilityMs: 850,
  resultScreenMs: 3200,
  scoreboardScreenMs: 3600,
  lockedMs: 1050,
  enemySpawnMargin: 40,
  enemySpawnWarningLeadMs: 1000,
  enemySpawnForbiddenRadius: 180,
  enemySpawnPointAttemptCount: 24,
  maxEnemiesOnScreen: 18,
  difficultySpawnIntervalReductionMs: 113,
  difficultyMaxEnemiesBonusPerRound: 4,
  difficultyEnemyHpMultiplierPerRound: 1.2,
  difficultyEnemyWaveSpeedBonus: 9,
  difficultyEnemyContactDamageIncreaseEveryRounds: 2,
  difficultyPickupTierEveryRounds: 2,
  pickupItemRadius: 9,
  pickupLifetimeMs: 16000,
  pickupMagnetBaseSpeed: 320,
  pickupMagnetMaxSpeed: 900,
  pickupMagnetDistanceFactor: 4.6,
  pickupValueBase: 1,
  pickupValuePerDifficultyTier: 0,
  healthPickupRadius: 11,
  healthPickupHealAmount: 25,
  healthPickupDropChance: 0.05
};

export const arenaSurvivorRoomSettingKeys = {
  difficultyTier: "arenaSurvivorDifficultyTier",
  setupConfirmed: "arenaSurvivorSetupConfirmed"
} as const;
