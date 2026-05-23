import type { PlayerInput } from "@open-party-lab/game-core";

export const ARENA_SURVIVOR_MAX_WEAPON_SLOTS = 6;
export const ARENA_SURVIVOR_WEAPON_SLOT_ANGLE_OFFSET_RAD = -Math.PI / 2;

export function resolveArenaSurvivorWeaponSlotTransform(
  slotIndex: number,
  orbitDistance: number,
  slotCount = ARENA_SURVIVOR_MAX_WEAPON_SLOTS
): { angleRad: number; offsetX: number; offsetY: number } {
  const safeSlotCount = Math.max(1, slotCount);
  const normalizedIndex = ((slotIndex % safeSlotCount) + safeSlotCount) % safeSlotCount;
  const angleRad =
    ARENA_SURVIVOR_WEAPON_SLOT_ANGLE_OFFSET_RAD +
    (normalizedIndex / safeSlotCount) * Math.PI * 2;

  return {
    angleRad,
    offsetX: Math.cos(angleRad) * orbitDistance,
    offsetY: Math.sin(angleRad) * orbitDistance
  };
}

export interface ArenaSurvivorMoveInput extends PlayerInput {
  type: "move";
  moveX: number;
  moveY: number;
}

export interface ArenaSurvivorShopBuyInput extends PlayerInput {
  type: "shop:buy";
  offerId: string;
}

export interface ArenaSurvivorShopSellInput extends PlayerInput {
  type: "shop:sell";
  weaponInstanceId: string;
}

export interface ArenaSurvivorShopCombineInput extends PlayerInput {
  type: "shop:combine";
  weaponInstanceId: string;
}

export interface ArenaSurvivorShopRerollInput extends PlayerInput {
  type: "shop:reroll";
}

export type ArenaSurvivorInput =
  | ArenaSurvivorMoveInput
  | ArenaSurvivorShopBuyInput
  | ArenaSurvivorShopSellInput
  | ArenaSurvivorShopCombineInput
  | ArenaSurvivorShopRerollInput;

export const arenaSurvivorSetupConfig = {
  difficulty: {
    min: 1,
    max: 5,
    step: 1,
    defaultValue: 3
  }
} as const;

export interface ArenaSurvivorDifficultyTierDefinition {
  level: number;
  label: string;
  description: string;
  enemyHpMultiplier: number;
  enemyDamageMultiplier: number;
  enemySpeedMultiplier: number;
  spawnIntervalMultiplier: number;
  maxEnemyCountBonus: number;
  spawnBurstBonus: number;
  enemyUnlockWaveBonus: number;
  bossSpawnCount: number;
  bossHpMultiplier: number;
}

export const arenaSurvivorDifficultyTiers = [
  {
    level: 1,
    label: "Gefahr 1",
    description: "Einsteigerdruck mit langsameren Spawns und weicheren Gegnern.",
    enemyHpMultiplier: 0.85,
    enemyDamageMultiplier: 0.85,
    enemySpeedMultiplier: 0.95,
    spawnIntervalMultiplier: 1.18,
    maxEnemyCountBonus: -6,
    spawnBurstBonus: 0,
    enemyUnlockWaveBonus: -1,
    bossSpawnCount: 1,
    bossHpMultiplier: 1
  },
  {
    level: 2,
    label: "Gefahr 2",
    description: "Der klare Standard: faire Spawns, normale Gegnerwerte.",
    enemyHpMultiplier: 1,
    enemyDamageMultiplier: 1,
    enemySpeedMultiplier: 1,
    spawnIntervalMultiplier: 1.04,
    maxEnemyCountBonus: 0,
    spawnBurstBonus: 0,
    enemyUnlockWaveBonus: 0,
    bossSpawnCount: 1,
    bossHpMultiplier: 1
  },
  {
    level: 3,
    label: "Gefahr 3",
    description: "Neue Gegner frueher, mehr Druck und +12% Gegnerwerte.",
    enemyHpMultiplier: 1.12,
    enemyDamageMultiplier: 1.12,
    enemySpeedMultiplier: 1.04,
    spawnIntervalMultiplier: 0.96,
    maxEnemyCountBonus: 6,
    spawnBurstBonus: 0,
    enemyUnlockWaveBonus: 1,
    bossSpawnCount: 1,
    bossHpMultiplier: 1
  },
  {
    level: 4,
    label: "Gefahr 4",
    description: "Dichte Horden, fruehere Spezialgegner und +26% Gegnerwerte.",
    enemyHpMultiplier: 1.26,
    enemyDamageMultiplier: 1.26,
    enemySpeedMultiplier: 1.08,
    spawnIntervalMultiplier: 0.88,
    maxEnemyCountBonus: 12,
    spawnBurstBonus: 1,
    enemyUnlockWaveBonus: 2,
    bossSpawnCount: 1,
    bossHpMultiplier: 1
  },
  {
    level: 5,
    label: "Gefahr 5",
    description: "Maximaldruck: +40% Gegnerwerte und Doppelboss.",
    enemyHpMultiplier: 1.4,
    enemyDamageMultiplier: 1.4,
    enemySpeedMultiplier: 1.12,
    spawnIntervalMultiplier: 0.78,
    maxEnemyCountBonus: 18,
    spawnBurstBonus: 1,
    enemyUnlockWaveBonus: 3,
    bossSpawnCount: 2,
    bossHpMultiplier: 0.75
  }
] as const satisfies readonly ArenaSurvivorDifficultyTierDefinition[];

export function resolveArenaSurvivorDifficultyTier(
  level: number
): ArenaSurvivorDifficultyTierDefinition {
  return (
    arenaSurvivorDifficultyTiers.find((entry) => entry.level === level) ??
    arenaSurvivorDifficultyTiers.find(
      (entry) => entry.level === arenaSurvivorSetupConfig.difficulty.defaultValue
    ) ??
    arenaSurvivorDifficultyTiers[0]
  );
}

export interface ArenaSurvivorConfigureLobbyHostAction {
  type: "configure-lobby";
  difficulty?: number;
}

export interface ArenaSurvivorConfirmLobbyHostAction {
  type: "confirm-lobby";
}

export type ArenaSurvivorHostAction =
  | ArenaSurvivorConfigureLobbyHostAction
  | ArenaSurvivorConfirmLobbyHostAction;

export interface ArenaSurvivorLobbyState {
  difficulty: number;
  setupConfirmed: boolean;
}

export type ArenaSurvivorCharacterArchetype =
  | "melee"
  | "ranged"
  | "magic"
  | "lifesteal"
  | "regen"
  | "tank"
  | "speed"
  | "luck"
  | "economy"
  | "hybrid";

export interface ArenaSurvivorCharacterVisualState {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface ArenaSurvivorCharacterState {
  id: string;
  name: string;
  title: string;
  archetype: ArenaSurvivorCharacterArchetype;
  description: string;
  portraitPath?: string;
  visual: ArenaSurvivorCharacterVisualState;
}

export interface ArenaSurvivorStatModifiers {
  maxHp?: number;
  armor?: number;
  dodgePct?: number;
  luck?: number;
  harvesting?: number;
  moveSpeedPct?: number;
  weaponRangePct?: number;
  pickupRadius?: number;
  pickupRadiusPct?: number;
  damagePct?: number;
  attackSpeedPct?: number;
  meleePowerPct?: number;
  rangedPowerPct?: number;
  magicPowerPct?: number;
  elementalPowerPct?: number;
  critChancePct?: number;
  critDamagePct?: number;
  projectileCount?: number;
  pierce?: number;
  lifeStealPct?: number;
  hpRegen?: number;
}

export interface ArenaSurvivorPlayerStats {
  moveSpeed: number;
  pickupRadius: number;
  maxHp: number;
  armor: number;
  dodgePct: number;
  luck: number;
  harvesting: number;
  hpRegen: number;
  contactDamageTakenMultiplier: number;
  damageMultiplier: number;
  projectileDamageMultiplier: number;
  projectileSpeedMultiplier: number;
  weaponRangeMultiplier: number;
  attackSpeedMultiplier: number;
  autoFireRateMultiplier: number;
  meleePowerMultiplier: number;
  rangedPowerMultiplier: number;
  magicPowerMultiplier: number;
  elementalPowerMultiplier: number;
  critChancePct: number;
  critDamageMultiplier: number;
  projectileCountBonus: number;
  pierceBonus: number;
  lifeStealPct: number;
}

export type ArenaSurvivorWeaponCategory = "melee" | "ranged" | "magic";
export type ArenaSurvivorAttackPattern = "melee_arc" | "single_projectile";

export interface ArenaSurvivorWeaponDamageScaling {
  meleePower?: number;
  rangedPower?: number;
  magicPower?: number;
  elementalPower?: number;
  attackSpeed?: number;
  maxHp?: number;
  armor?: number;
  lifeSteal?: number;
}

export interface ArenaSurvivorWeaponLevelDefinition {
  level: 1 | 2 | 3 | 4;
  damage: number;
  cooldownMs: number;
  range: number;
  projectileSpeed: number;
  projectileCount?: number;
  pierce?: number;
  critChancePct?: number;
  critScale?: number;
  damageScaling?: ArenaSurvivorWeaponDamageScaling;
  knockback?: number;
  description: string;
  cost: number;
}

export interface ArenaSurvivorWeaponDefinition {
  id: string;
  displayName: string;
  category: ArenaSurvivorWeaponCategory;
  attackPattern: ArenaSurvivorAttackPattern;
  projectileDefinitionId?: string;
  tags: string[];
  baseDescription: string;
  levels: ArenaSurvivorWeaponLevelDefinition[];
  shopIconPath?: string;
  carrySpritePath?: string;
}

export interface ArenaSurvivorWeaponRuntimeState {
  weaponInstanceId: string;
  weaponId: string;
  level: number;
  cooldownRemainingMs: number;
  lastFiredAt: number | null;
  lastAimAngleRad?: number | null;
  lastAttackReachDistance?: number | null;
}

export interface ArenaSurvivorProjectileDefinition {
  id: string;
  radius: number;
  speed: number;
  damage: number;
  lifetimeMs: number;
  maxRange: number;
  pierce: number;
}

export type ArenaSurvivorProjectileOwnerKind = "player" | "enemy";

export interface ArenaSurvivorProjectileState {
  id: string;
  ownerId: string;
  ownerKind: ArenaSurvivorProjectileOwnerKind;
  definitionId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  ageMs: number;
  lifetimeMs: number;
  travelledDistance: number;
  maxRange: number;
  remainingPierce: number;
  alive: boolean;
  crit?: boolean;
}

export type ArenaSurvivorEnemyRole = "chaser" | "brute" | "shooter";

export interface ArenaSurvivorEnemyDefinition {
  id: string;
  displayName: string;
  role: ArenaSurvivorEnemyRole;
  tags: string[];
  baseDescription: string;
  minWave: number;
  spawnWeight: number;
  radius: number;
  maxHp: number;
  moveSpeed: number;
  contactDamage: number;
  contactDamageCooldownMs: number;
  shootCooldownMs?: number;
  shootRange?: number;
  projectile?: ArenaSurvivorProjectileDefinition;
  spritePath?: string;
  portraitPath?: string;
}

export interface ArenaSurvivorEnemyState {
  id: string;
  definitionId: string;
  displayName: string;
  role: ArenaSurvivorEnemyRole;
  x: number;
  y: number;
  vx: number;
  vy: number;
  moveSpeed: number;
  radius: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  contactDamage: number;
  contactDamageCooldownMs: number;
  lastContactDamageAt: number | null;
  shootCooldownRemainingMs: number;
  shootCooldownMs?: number;
  shootRange?: number;
  projectile?: ArenaSurvivorProjectileDefinition;
  spritePath?: string;
  portraitPath?: string;
}

export type ArenaSurvivorPickupKind = "material" | "health";

export interface ArenaSurvivorPickupDefinition {
  id: string;
  displayName: string;
  kind: ArenaSurvivorPickupKind;
  radius: number;
  value: number;
  lifetimeMs: number;
}

export interface ArenaSurvivorPickupState {
  id: string;
  definitionId: string;
  kind: ArenaSurvivorPickupKind;
  x: number;
  y: number;
  radius: number;
  value: number;
  ageMs: number;
  lifetimeMs: number;
}

export interface ArenaSurvivorSpawnIndicatorState {
  id: string;
  x: number;
  y: number;
  createdAtMs: number;
  spawnAtMs: number;
}

export interface ArenaSurvivorItemLevelDefinition {
  level: 1 | 2 | 3 | 4;
  description: string;
  cost: number;
  modifiers: ArenaSurvivorStatModifiers;
}

export interface ArenaSurvivorItemDefinition {
  id: string;
  displayName: string;
  maxLevel: 1 | 2 | 3 | 4;
  tags?: string[];
  description: string;
  levels: ArenaSurvivorItemLevelDefinition[];
  iconPath?: string;
}

export interface ArenaSurvivorOwnedItemState {
  itemId: string;
  displayName: string;
  level: number;
  description: string;
  iconPath?: string;
}

export interface ArenaSurvivorLoadoutWeaponState {
  weaponInstanceId: string;
  weaponId: string;
  displayName: string;
  category: ArenaSurvivorWeaponCategory;
  level: number;
  maxLevel: number;
  description: string;
  iconPath?: string;
  starterGranted?: boolean;
  investedMaterials?: number;
  sellValue?: number;
  sellable?: boolean;
  detailLines?: Array<{
    label: string;
    value: string;
  }>;
}

export interface ArenaSurvivorLoadoutState {
  weapons: ArenaSurvivorLoadoutWeaponState[];
  items: ArenaSurvivorOwnedItemState[];
}

export interface ArenaSurvivorShopOfferState {
  id: string;
  kind: "item" | "weapon";
  title: string;
  description: string;
  cost: number;
  affordable: boolean;
  purchased: boolean;
  targetLevel: number;
  itemId?: string;
  weaponId?: string;
  targetWeaponInstanceId?: string;
  iconPath?: string;
  tags?: string[];
  summary?: string;
  detailLines?: Array<{
    label: string;
    value: string;
  }>;
}

export interface ArenaSurvivorShopState {
  available: boolean;
  offers: ArenaSurvivorShopOfferState[];
  message?: string;
  rerollCount: number;
  rerollCost: number;
  canReroll: boolean;
}

export interface ArenaSurvivorRunStats {
  kills: number;
  materialsCollected: number;
  survivedMs: number;
  shotsFired: number;
  hitsLanded: number;
  damageTaken: number;
}

export interface ArenaSurvivorRunSummary {
  wavesCleared: number;
  totalKills: number;
  totalMaterialsCollected: number;
  totalSurvivedMs: number;
  totalShotsFired: number;
  totalHitsLanded: number;
  totalDamageTaken: number;
  spentMaterials: number;
}

export interface ArenaSurvivorResultState {
  outcome: "survived" | "defeated" | "running";
  reason?: "time_limit" | "player_dead";
  title: string;
}

export interface ArenaSurvivorPlayerState {
  playerId: string;
  name: string;
  color: string;
  character: ArenaSurvivorCharacterState;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  moveSpeed: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  facingAngleRad: number;
  invulnerableUntilMs: number;
  weaponRuntimeStates: ArenaSurvivorWeaponRuntimeState[];
  stats: ArenaSurvivorPlayerStats;
  materials: number;
  loadout: ArenaSurvivorLoadoutState;
  shop: ArenaSurvivorShopState;
  runStats: ArenaSurvivorRunStats;
  runSummary: ArenaSurvivorRunSummary;
}

export interface ArenaSurvivorState {
  arenaWidth: number;
  arenaHeight: number;
  waveNumber: number;
  elapsedMs: number;
  remainingMs: number;
  difficultyLevel: number;
  difficultyTier: number;
  kills: number;
  players: ArenaSurvivorPlayerState[];
  enemies: ArenaSurvivorEnemyState[];
  projectiles: ArenaSurvivorProjectileState[];
  pickups: ArenaSurvivorPickupState[];
  spawnIndicators: ArenaSurvivorSpawnIndicatorState[];
  result: ArenaSurvivorResultState;
  debugInfo?: {
    enemySpawnCooldownMs: number;
    enemyCount: number;
    pickupCount: number;
    projectileCount: number;
    alivePlayerCount: number;
  };
}
