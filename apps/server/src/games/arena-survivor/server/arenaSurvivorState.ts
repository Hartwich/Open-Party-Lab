import type { BaseRoundState } from "@open-party-lab/game-core";
import type {
  ArenaSurvivorEnemyState,
  ArenaSurvivorLoadoutState,
  ArenaSurvivorPickupState,
  ArenaSurvivorPlayerState,
  ArenaSurvivorProjectileState,
  ArenaSurvivorResultState,
  ArenaSurvivorRunStats,
  ArenaSurvivorRunSummary,
  ArenaSurvivorShopState,
  ArenaSurvivorSpawnIndicatorState,
  ArenaSurvivorState as PublicArenaSurvivorState,
  ArenaSurvivorWeaponRuntimeState,
  SupportedLanguage
} from "@open-party-lab/protocol";

export interface ArenaSurvivorRuntimePlayerState extends ArenaSurvivorPlayerState {
  moveInputX: number;
  moveInputY: number;
}

export interface ArenaSurvivorRuntimeEnemyState extends ArenaSurvivorEnemyState {
  moveSpeed: number;
  spawnedAtMs: number;
}

export interface ArenaSurvivorRuntimeProjectileState extends ArenaSurvivorProjectileState {
  spawnedAtMs: number;
}

export interface ArenaSurvivorRuntimePickupState extends ArenaSurvivorPickupState {
  spawnedAtMs: number;
  targetPlayerId: string | null;
}

export interface ArenaSurvivorRuntimeSpawnIndicatorState extends ArenaSurvivorSpawnIndicatorState {
  definitionId: string;
  moveSpeed?: number;
  maxHp?: number;
  contactDamage?: number;
  projectileDamageMultiplier?: number;
}

export interface ArenaSurvivorPublicState extends PublicArenaSurvivorState {
  seed?: number;
}

export interface ArenaSurvivorRuntimeState extends BaseRoundState {
  language: SupportedLanguage;
  seed: number;
  arenaWidth: number;
  arenaHeight: number;
  waveNumber: number;
  difficultyLevel: number;
  difficultyTier: number;
  spawnedBossDefinitionIds: string[];
  elapsedMs: number;
  remainingMs: number;
  nextEnemySpawnAtMs: number;
  kills: number;
  players: ArenaSurvivorRuntimePlayerState[];
  enemies: ArenaSurvivorRuntimeEnemyState[];
  projectiles: ArenaSurvivorRuntimeProjectileState[];
  pickups: ArenaSurvivorRuntimePickupState[];
  spawnIndicators: ArenaSurvivorRuntimeSpawnIndicatorState[];
  result: ArenaSurvivorResultState;
  debugInfo?: {
    enemySpawnCooldownMs: number;
    enemyCount: number;
    pickupCount: number;
    projectileCount: number;
    alivePlayerCount: number;
  };
}

export interface ArenaSurvivorPlayerCarryState {
  continuedRun: boolean;
  characterId?: string;
  materials: number;
  loadout: ArenaSurvivorLoadoutState;
  runSummary: ArenaSurvivorRunSummary;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampVectorMagnitude(x: number, y: number): { x: number; y: number; magnitude: number } {
  const magnitude = Math.hypot(x, y);

  if (magnitude <= 0.0001) {
    return { x: 0, y: 0, magnitude: 0 };
  }

  if (magnitude <= 1) {
    return { x, y, magnitude };
  }

  return {
    x: x / magnitude,
    y: y / magnitude,
    magnitude: 1
  };
}

export function normalizeVector(x: number, y: number): { x: number; y: number } {
  const length = Math.hypot(x, y);

  if (length <= 0.0001) {
    return { x: 0, y: 0 };
  }

  return {
    x: x / length,
    y: y / length
  };
}

export function distanceSquared(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const deltaX = x1 - x2;
  const deltaY = y1 - y2;
  return deltaX * deltaX + deltaY * deltaY;
}

export function angleFromVector(x: number, y: number): number {
  return Math.atan2(y, x);
}

export function createSeededRandom(seed: number): { seed: number; value: number } {
  const nextSeed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
  return {
    seed: nextSeed || 1,
    value: nextSeed / 4_294_967_296
  };
}

export function cloneWeaponRuntimeState(
  weapon: ArenaSurvivorWeaponRuntimeState
): ArenaSurvivorWeaponRuntimeState {
  return {
    ...weapon
  };
}

export function cloneLoadout(loadout: ArenaSurvivorLoadoutState): ArenaSurvivorLoadoutState {
  return {
    weapons: loadout.weapons.map((weapon) => ({
      ...weapon
    })),
    items: loadout.items.map((item) => ({ ...item }))
  };
}

export function createEmptyShopState(): ArenaSurvivorShopState {
  return {
    available: false,
    offers: [],
    rerollCount: 0,
    rerollCost: 0,
    canReroll: false
  };
}

export function createEmptyRunStats(): ArenaSurvivorRunStats {
  return {
    kills: 0,
    materialsCollected: 0,
    survivedMs: 0,
    shotsFired: 0,
    hitsLanded: 0,
    damageTaken: 0
  };
}

export function createEmptyRunSummary(): ArenaSurvivorRunSummary {
  return {
    wavesCleared: 0,
    totalKills: 0,
    totalMaterialsCollected: 0,
    totalSurvivedMs: 0,
    totalShotsFired: 0,
    totalHitsLanded: 0,
    totalDamageTaken: 0,
    spentMaterials: 0
  };
}

export function cloneRunSummary(summary: ArenaSurvivorRunSummary): ArenaSurvivorRunSummary {
  return {
    ...summary
  };
}

export function countAlivePlayers(players: Array<{ alive: boolean }>): number {
  return players.filter((player) => player.alive).length;
}
