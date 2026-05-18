export type ArenaSurvivorWeaponCategory = "melee" | "ranged" | "magic";
export type ArenaSurvivorEnemyRole = "chaser" | "brute" | "shooter";
export type ArenaSurvivorCharacterArchetype =
  | "melee"
  | "ranged"
  | "magic"
  | "lifesteal"
  | "regen"
  | "tank"
  | "speed"
  | "hybrid";

export interface ArenaSurvivorStatModifiers {
  maxHp?: number;
  armor?: number;
  moveSpeedPct?: number;
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

export interface ArenaSurvivorItemLevelDefinition {
  level: 1 | 2 | 3;
  cost: number;
  description: string;
  modifiers: ArenaSurvivorStatModifiers;
}

export interface ArenaSurvivorItemDefinition {
  id: string;
  name: string;
  maxLevel: 3;
  tags?: string[];
  description: string;
  levels: ArenaSurvivorItemLevelDefinition[];
  iconPath?: string;
}

export interface ArenaSurvivorWeaponLevelDefinition {
  level: 1 | 2 | 3 | 4;
  cost: number;
  damage: number;
  cooldownMs: number;
  range: number;
  projectileSpeed: number;
  projectileCount?: number;
  pierce?: number;
  critScale?: number;
  knockback?: number;
  description: string;
}

export interface ArenaSurvivorWeaponDefinition {
  id: string;
  name: string;
  category: ArenaSurvivorWeaponCategory;
  projectileDefinitionId?: string;
  tags: string[];
  baseDescription: string;
  levels: ArenaSurvivorWeaponLevelDefinition[];
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

export interface ArenaSurvivorCharacterVisualDefinition {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface ArenaSurvivorCharacterDefinition {
  id: string;
  name: string;
  title: string;
  archetype: ArenaSurvivorCharacterArchetype;
  description: string;
  modifiers: ArenaSurvivorStatModifiers;
  visual: ArenaSurvivorCharacterVisualDefinition;
}
