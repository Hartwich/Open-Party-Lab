import type {
  ArenaSurvivorCharacterState,
  ArenaSurvivorLoadoutState,
  ArenaSurvivorLoadoutWeaponState,
  ArenaSurvivorOwnedItemState,
  ArenaSurvivorPlayerStats,
  ArenaSurvivorShopOfferState,
  ArenaSurvivorShopState,
  ArenaSurvivorStatModifiers,
  ArenaSurvivorWeaponDefinition,
  ArenaSurvivorWeaponLevelDefinition,
  ArenaSurvivorWeaponRuntimeState,
  SupportedLanguage
} from "@open-party-lab/protocol";
import { ARENA_SURVIVOR_MAX_WEAPON_SLOTS as MAX_WEAPON_SLOTS } from "@open-party-lab/protocol";
import { arenaSurvivorPlayerDefinition } from "../definitions/playerDefinitions.js";
import {
  arenaSurvivorCharacterDefinitions,
  arenaSurvivorCharacterDefinitionsById
} from "../definitions/characterDefinitions.js";
import {
  arenaSurvivorItemDefinitions,
  arenaSurvivorItemDefinitionsById
} from "../definitions/itemDefinitions.js";
import {
  arenaSurvivorStarterWeaponDefinition,
  arenaSurvivorWeaponDefinitions,
  arenaSurvivorWeaponDefinitionsById
} from "../definitions/weaponDefinitions.js";
import type {
  ArenaSurvivorWeaponDefinition as ArenaSurvivorContentWeaponDefinition,
  ArenaSurvivorWeaponLevelDefinition as ArenaSurvivorContentWeaponLevelDefinition
} from "../content/types.js";
import {
  cloneLoadout,
  cloneRunSummary,
  createEmptyRunSummary,
  createSeededRandom,
  type ArenaSurvivorPlayerCarryState,
  type ArenaSurvivorRuntimePlayerState,
  type ArenaSurvivorRuntimeState
} from "../arenaSurvivorState.js";
import { createId } from "../../../../core/ids/createId.js";

export interface ArenaSurvivorRunCarryResolution {
  continuedRun: boolean;
  waveNumber: number;
  players: ArenaSurvivorPlayerCarryRecord[];
}

export interface ArenaSurvivorPlayerCarryRecord extends ArenaSurvivorPlayerCarryState {
  playerId: string;
}

function defaultItemIconPath(itemId: string): string {
  return `/arena-survivor/item-icons/${itemId}.svg`;
}

function createWeaponInstanceId(): string {
  return createId("weapon");
}

function resolveItemIconPath(itemId: string): string {
  const definition = arenaSurvivorItemDefinitionsById[itemId];

  return definition && "iconPath" in definition && typeof definition.iconPath === "string"
    ? definition.iconPath
    : defaultItemIconPath(itemId);
}

function weaponShopIconPath(weaponId: string): string {
  return `/arena-survivor/weapons/shop/${weaponId}.svg`;
}

function weaponCarrySpritePath(weaponId: string): string {
  return `/arena-survivor/weapons/carry/${weaponId}_carry.svg`;
}

const arenaSurvivorShopOfferCount = 4;
const arenaSurvivorShopRerollBaseCost = 2;
const arenaSurvivorShopRerollWaveCost = 1;
const arenaSurvivorShopRerollStepCost = 2;
const arenaSurvivorWeaponSellRatio = 1 / 3;
const arenaSurvivorWeaponOfferLevelChanceBands = {
  2: [
    { wave: 1, chance: 0 },
    { wave: 2, chance: 0.08 },
    { wave: 4, chance: 0.18 },
    { wave: 8, chance: 0.34 },
    { wave: 12, chance: 0.42 },
    { wave: 20, chance: 0.36 },
    { wave: 30, chance: 0.3 }
  ],
  3: [
    { wave: 1, chance: 0 },
    { wave: 4, chance: 0.03 },
    { wave: 8, chance: 0.1 },
    { wave: 12, chance: 0.18 },
    { wave: 16, chance: 0.24 },
    { wave: 30, chance: 0.22 }
  ],
  4: [
    { wave: 1, chance: 0 },
    { wave: 8, chance: 0.025 },
    { wave: 12, chance: 0.07 },
    { wave: 16, chance: 0.12 },
    { wave: 20, chance: 0.18 },
    { wave: 30, chance: 0.2 }
  ]
} as const;

function resolveMultiplier(current: number, percentDelta = 0): number {
  return current * Math.max(0.2, 1 + percentDelta / 100);
}

function formatShopNumber(value: number, fractionDigits = 0): string {
  if (fractionDigits <= 0) {
    return `${Math.round(value)}`;
  }

  return value.toFixed(fractionDigits).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

function formatCooldownLabel(cooldownMs: number): string {
  return `${formatShopNumber(cooldownMs / 1000, 2)}s`;
}

function formatMultiplierLabel(value: number): string {
  return `x${formatShopNumber(value, 2)}`;
}

function resolveWeaponSellValue(investedMaterials: number): number {
  return Math.max(0, Math.floor(Math.max(0, investedMaterials) * arenaSurvivorWeaponSellRatio));
}

function interpolateWaveChance(
  points: ReadonlyArray<{ wave: number; chance: number }>,
  waveNumber: number
): number {
  if (points.length === 0) {
    return 0;
  }

  if (waveNumber <= points[0].wave) {
    return points[0].chance;
  }

  for (let index = 1; index < points.length; index += 1) {
    const previousPoint = points[index - 1];
    const nextPoint = points[index];

    if (waveNumber <= nextPoint.wave) {
      const span = Math.max(1, nextPoint.wave - previousPoint.wave);
      const progress = (waveNumber - previousPoint.wave) / span;

      return previousPoint.chance + (nextPoint.chance - previousPoint.chance) * progress;
    }
  }

  return points[points.length - 1].chance;
}

function resolveWeaponOfferLevelProbabilities(
  waveNumber: number
): Array<{ level: 1 | 2 | 3 | 4; probability: number }> {
  const clampedWave = Math.max(1, Math.round(waveNumber));
  const level2Probability = interpolateWaveChance(
    arenaSurvivorWeaponOfferLevelChanceBands[2],
    clampedWave
  );
  const level3Probability = interpolateWaveChance(
    arenaSurvivorWeaponOfferLevelChanceBands[3],
    clampedWave
  );
  const level4Probability = interpolateWaveChance(
    arenaSurvivorWeaponOfferLevelChanceBands[4],
    clampedWave
  );
  const totalHighLevelProbability = Math.min(
    0.94,
    level2Probability + level3Probability + level4Probability
  );
  const scalingFactor =
    level2Probability + level3Probability + level4Probability > 0
      ? totalHighLevelProbability / (level2Probability + level3Probability + level4Probability)
      : 1;
  const scaledLevel2Probability = level2Probability * scalingFactor;
  const scaledLevel3Probability = level3Probability * scalingFactor;
  const scaledLevel4Probability = level4Probability * scalingFactor;

  return [
    {
      level: 1,
      probability: Math.max(
        0.06,
        1 - (scaledLevel2Probability + scaledLevel3Probability + scaledLevel4Probability)
      )
    },
    {
      level: 2,
      probability: scaledLevel2Probability
    },
    {
      level: 3,
      probability: scaledLevel3Probability
    },
    {
      level: 4,
      probability: scaledLevel4Probability
    }
  ];
}

function resolveWeaponOfferLevel(
  definition: ArenaSurvivorContentWeaponDefinition,
  waveNumber: number,
  seed: number
): { level: number; seed: number } {
  const probabilities = resolveWeaponOfferLevelProbabilities(waveNumber).filter(
    (entry) => entry.level <= definition.levels.length
  );
  const normalizedTotal = probabilities.reduce((total, entry) => total + entry.probability, 0);
  const random = createSeededRandom(seed);
  let threshold = random.value * Math.max(normalizedTotal, Number.EPSILON);

  for (const entry of probabilities) {
    threshold -= entry.probability;

    if (threshold <= 0) {
      return {
        level: entry.level,
        seed: random.seed
      };
    }
  }

  return {
    level: probabilities[probabilities.length - 1]?.level ?? 1,
    seed: random.seed
  };
}

function buildWeaponOfferDetailLines(
  definition: ArenaSurvivorContentWeaponDefinition,
  levelDefinition: ArenaSurvivorContentWeaponLevelDefinition
): Array<{ label: string; value: string }> {
  const detailLines: Array<{ label: string; value: string }> = [
    {
      label: "Damage",
      value: formatShopNumber(levelDefinition.damage)
    },
    {
      label: "Range",
      value: formatShopNumber(levelDefinition.range)
    },
    {
      label: "Cooldown",
      value: formatCooldownLabel(levelDefinition.cooldownMs)
    }
  ];

  if (levelDefinition.projectileSpeed > 0) {
    detailLines.push({
      label: "Proj Speed",
      value: formatShopNumber(levelDefinition.projectileSpeed)
    });
  }

  if (typeof levelDefinition.critScale === "number" && levelDefinition.critScale > 1) {
    detailLines.push({
      label: "Crit",
      value:
        typeof levelDefinition.critChancePct === "number"
          ? `${formatMultiplierLabel(levelDefinition.critScale)} / ${formatShopNumber(levelDefinition.critChancePct)}%`
          : formatMultiplierLabel(levelDefinition.critScale)
    });
  } else if (typeof levelDefinition.critChancePct === "number" && levelDefinition.critChancePct > 0) {
    detailLines.push({
      label: "Crit",
      value: `${formatShopNumber(levelDefinition.critChancePct)}%`
    });
  }

  if (typeof levelDefinition.projectileCount === "number" && levelDefinition.projectileCount > 1) {
    detailLines.push({
      label: "Projektile",
      value: formatShopNumber(levelDefinition.projectileCount)
    });
  }

  if (typeof levelDefinition.pierce === "number" && levelDefinition.pierce > 0) {
    detailLines.push({
      label: "Pierce",
      value: formatShopNumber(levelDefinition.pierce)
    });
  }

  if (typeof levelDefinition.knockback === "number" && levelDefinition.knockback > 0) {
    detailLines.push({
      label: "Knockback",
      value: formatShopNumber(levelDefinition.knockback, 2)
    });
  }

  if (definition.projectileDefinitionId) {
    detailLines.push({
      label: "Typ",
      value: definition.projectileDefinitionId
        .split("-")
        .map((segment: string) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ")
    });
  }

  return detailLines;
}

function buildLoadoutWeaponDetailLines(
  weaponId: string,
  level: number
): Array<{ label: string; value: string }> {
  const definition = arenaSurvivorWeaponDefinitionsById[weaponId] ?? arenaSurvivorStarterWeaponDefinition;
  const levelDefinition =
    definition.levels.find((entry) => entry.level === level) ??
    definition.levels[definition.levels.length - 1] ??
    definition.levels[0];

  return buildWeaponOfferDetailLines(definition, levelDefinition);
}

function sanitizeCharacter(
  characterId: string | undefined,
  index: number
): ArenaSurvivorCharacterState {
  const fallback =
    arenaSurvivorCharacterDefinitions[index % arenaSurvivorCharacterDefinitions.length] ??
    arenaSurvivorCharacterDefinitions[0];
  const definition =
    (characterId ? arenaSurvivorCharacterDefinitionsById[characterId] : null) ?? fallback;

  return {
    id: definition.id,
    name: definition.name,
    title: definition.title,
    archetype: definition.archetype,
    description: definition.description,
    portraitPath: `/arena-survivor/characters/portraits/${definition.id}.svg`,
    visual: {
      primaryColor: definition.visual.primaryColor,
      secondaryColor: definition.visual.secondaryColor,
      accentColor: definition.visual.accentColor
    }
  };
}

export function resolveArenaSurvivorCharacter(characterId: string | undefined, index = 0): ArenaSurvivorCharacterState {
  return sanitizeCharacter(characterId, index);
}

function resolveStarterWeaponIdForCharacter(characterId?: string): string {
  const character = sanitizeCharacter(characterId, 0);

  switch (character.archetype) {
    case "ranged":
      return "hunter-bow";
    case "magic":
      return "ember-wand";
    case "lifesteal":
      return "scrap-smg";
    case "regen":
      return "frost-orb";
    case "speed":
      return "spark-rod";
    case "luck":
      return "stick";
    case "economy":
      return "stone";
    case "hybrid":
      return "survivor-pistol";
    case "tank":
      return "survivor-pistol";
    case "melee":
      return "spear";
    default:
      return arenaSurvivorStarterWeaponDefinition.id;
  }
}

function createOwnedItemState(itemId: string, level: number): ArenaSurvivorOwnedItemState {
  const itemDefinition = arenaSurvivorItemDefinitionsById[itemId];
  const itemLevel = itemDefinition?.levels.find((entry) => entry.level === level);

  if (!itemDefinition || !itemLevel) {
    throw new Error(`Arena Survivor item state could not be resolved for ${itemId} level ${level}.`);
  }

  return {
    itemId,
    displayName: itemDefinition.name,
    level,
    description: itemLevel.description,
    iconPath: resolveItemIconPath(itemId)
  };
}

function createLoadoutWeaponState(
  weaponId: string,
  level: number,
  options?: {
    weaponInstanceId?: string;
    starterGranted?: boolean;
    investedMaterials?: number;
  }
): ArenaSurvivorLoadoutWeaponState {
  const { definition, levelDefinition } = resolveArenaSurvivorWeaponLevel(weaponId, level);
  const investedMaterials = Math.max(0, Math.round(options?.investedMaterials ?? 0));
  const sellValue = resolveWeaponSellValue(investedMaterials);

  return {
    weaponInstanceId: options?.weaponInstanceId ?? createWeaponInstanceId(),
    weaponId: definition.id,
    displayName: definition.displayName,
    category: definition.category,
    level: levelDefinition.level,
    maxLevel: definition.levels.length,
    description: levelDefinition.description,
    iconPath: weaponShopIconPath(definition.id),
    starterGranted: options?.starterGranted ?? false,
    investedMaterials,
    sellValue,
    sellable: sellValue > 0,
    detailLines: buildLoadoutWeaponDetailLines(definition.id, levelDefinition.level)
  };
}

export function resolveArenaSurvivorWeaponDefinition(weaponId: string): ArenaSurvivorWeaponDefinition {
  const definition = arenaSurvivorWeaponDefinitionsById[weaponId];
  const starterProjectileDefinitionId =
    "projectileDefinitionId" in arenaSurvivorStarterWeaponDefinition &&
    typeof arenaSurvivorStarterWeaponDefinition.projectileDefinitionId === "string"
      ? arenaSurvivorStarterWeaponDefinition.projectileDefinitionId
      : undefined;

  if (!definition) {
    return {
      id: arenaSurvivorStarterWeaponDefinition.id,
      displayName: arenaSurvivorStarterWeaponDefinition.name,
      category: arenaSurvivorStarterWeaponDefinition.category,
      attackPattern: "single_projectile",
      projectileDefinitionId: starterProjectileDefinitionId,
      tags: [...arenaSurvivorStarterWeaponDefinition.tags],
      baseDescription: arenaSurvivorStarterWeaponDefinition.baseDescription,
      levels: arenaSurvivorStarterWeaponDefinition.levels.map((entry) => ({ ...entry })),
      shopIconPath: weaponShopIconPath(arenaSurvivorStarterWeaponDefinition.id),
      carrySpritePath: weaponCarrySpritePath(arenaSurvivorStarterWeaponDefinition.id)
    };
  }

  return {
    id: definition.id,
    displayName: definition.name,
    category: definition.category,
    attackPattern: definition.category === "melee" ? "melee_arc" : "single_projectile",
    projectileDefinitionId:
      "projectileDefinitionId" in definition ? definition.projectileDefinitionId : undefined,
    tags: [...definition.tags],
    baseDescription: definition.baseDescription,
    levels: definition.levels.map((entry) => ({ ...entry })),
    shopIconPath: weaponShopIconPath(definition.id),
    carrySpritePath: weaponCarrySpritePath(definition.id)
  };
}

export function resolveArenaSurvivorWeaponLevel(weaponId: string, level: number) {
  const definition = resolveArenaSurvivorWeaponDefinition(weaponId);
  const resolvedLevel = Math.min(definition.levels.length, Math.max(1, level));
  const levelDefinition =
    definition.levels.find((entry) => entry.level === resolvedLevel) ?? definition.levels[0];

  return {
    definition,
    levelDefinition
  };
}

export function createArenaSurvivorStarterLoadout(characterId?: string): ArenaSurvivorLoadoutState {
  const starterWeaponId = resolveStarterWeaponIdForCharacter(characterId);
  const starterLevelCost =
    arenaSurvivorWeaponDefinitionsById[starterWeaponId]?.levels.find((entry) => entry.level === 1)?.cost ?? 0;

  return {
    weapons: [
      createLoadoutWeaponState(starterWeaponId, 1, {
        starterGranted: true,
        investedMaterials: starterLevelCost
      })
    ],
    items: []
  };
}

export function createArenaSurvivorWeaponRuntimeStates(
  loadout: ArenaSurvivorLoadoutState,
  previousWeaponStates?: ArenaSurvivorWeaponRuntimeState[] | null
): ArenaSurvivorWeaponRuntimeState[] {
  return loadout.weapons.map((weapon) => {
    const previousWeapon = previousWeaponStates?.find(
      (entry) => entry.weaponInstanceId === weapon.weaponInstanceId
    );

    return {
      weaponInstanceId: weapon.weaponInstanceId,
      weaponId: weapon.weaponId,
      level: weapon.level,
      cooldownRemainingMs:
        previousWeapon?.level === weapon.level ? previousWeapon.cooldownRemainingMs : 0,
      lastFiredAt:
        previousWeapon?.weaponInstanceId === weapon.weaponInstanceId ? previousWeapon.lastFiredAt : null,
      lastAimAngleRad:
        previousWeapon?.weaponInstanceId === weapon.weaponInstanceId
          ? previousWeapon.lastAimAngleRad ?? null
          : null,
      lastAttackReachDistance:
        previousWeapon?.weaponInstanceId === weapon.weaponInstanceId
          ? previousWeapon.lastAttackReachDistance ?? null
          : null
    };
  });
}

export function resolveArenaSurvivorPlayerStats(
  loadout: ArenaSurvivorLoadoutState,
  characterId?: string
): ArenaSurvivorPlayerStats {
  const character = sanitizeCharacter(characterId, 0);
  let maxHpBonus = 0;
  let armor: number = arenaSurvivorPlayerDefinition.armor;
  let dodgePct: number = arenaSurvivorPlayerDefinition.dodgePct;
  let luck: number = arenaSurvivorPlayerDefinition.luck;
  let harvesting: number = arenaSurvivorPlayerDefinition.harvesting;
  let hpRegen: number = arenaSurvivorPlayerDefinition.hpRegen;
  let moveSpeedMultiplier = 1;
  let weaponRangeMultiplier: number = arenaSurvivorPlayerDefinition.weaponRangeMultiplier;
  let pickupRadiusBonus = 0;
  let pickupRadiusMultiplier = 1;
  let damageMultiplier: number = arenaSurvivorPlayerDefinition.damageMultiplier;
  let attackSpeedMultiplier: number = arenaSurvivorPlayerDefinition.attackSpeedMultiplier;
  let meleePowerMultiplier: number = arenaSurvivorPlayerDefinition.meleePowerMultiplier;
  let rangedPowerMultiplier: number = arenaSurvivorPlayerDefinition.rangedPowerMultiplier;
  let magicPowerMultiplier: number = arenaSurvivorPlayerDefinition.magicPowerMultiplier;
  let elementalPowerMultiplier: number = arenaSurvivorPlayerDefinition.elementalPowerMultiplier;
  let critChancePct: number = arenaSurvivorPlayerDefinition.critChancePct;
  let critDamageMultiplier: number = arenaSurvivorPlayerDefinition.critDamageMultiplier;
  let projectileCountBonus: number = arenaSurvivorPlayerDefinition.projectileCountBonus;
  let pierceBonus: number = arenaSurvivorPlayerDefinition.pierceBonus;
  let lifeStealPct: number = arenaSurvivorPlayerDefinition.lifeStealPct;

  const applyModifiers = (modifiers: ArenaSurvivorStatModifiers) => {
    maxHpBonus += modifiers.maxHp ?? 0;
    armor += modifiers.armor ?? 0;
    dodgePct += modifiers.dodgePct ?? 0;
    luck += modifiers.luck ?? 0;
    harvesting += modifiers.harvesting ?? 0;
    hpRegen += modifiers.hpRegen ?? 0;
    moveSpeedMultiplier = resolveMultiplier(moveSpeedMultiplier, modifiers.moveSpeedPct);
    weaponRangeMultiplier = resolveMultiplier(weaponRangeMultiplier, modifiers.weaponRangePct);
    pickupRadiusBonus += modifiers.pickupRadius ?? 0;
    pickupRadiusMultiplier = resolveMultiplier(pickupRadiusMultiplier, modifiers.pickupRadiusPct);
    damageMultiplier = resolveMultiplier(damageMultiplier, modifiers.damagePct);
    attackSpeedMultiplier = resolveMultiplier(attackSpeedMultiplier, modifiers.attackSpeedPct);
    meleePowerMultiplier = resolveMultiplier(meleePowerMultiplier, modifiers.meleePowerPct);
    rangedPowerMultiplier = resolveMultiplier(rangedPowerMultiplier, modifiers.rangedPowerPct);
    magicPowerMultiplier = resolveMultiplier(magicPowerMultiplier, modifiers.magicPowerPct);
    elementalPowerMultiplier = resolveMultiplier(elementalPowerMultiplier, modifiers.elementalPowerPct);
    critChancePct += modifiers.critChancePct ?? 0;
    critDamageMultiplier += (modifiers.critDamagePct ?? 0) / 100;
    projectileCountBonus += modifiers.projectileCount ?? 0;
    pierceBonus += modifiers.pierce ?? 0;
    lifeStealPct += modifiers.lifeStealPct ?? 0;
  };

  applyModifiers(characterDefinitionModifiers(character.id));

  for (const ownedItem of loadout.items) {
    const itemDefinition = arenaSurvivorItemDefinitionsById[ownedItem.itemId];
    const levelDefinition = itemDefinition?.levels.find((entry) => entry.level === ownedItem.level);

    if (!itemDefinition || !levelDefinition) {
      continue;
    }

    applyModifiers(levelDefinition.modifiers);
  }

  const moveSpeed = Math.max(60, arenaSurvivorPlayerDefinition.moveSpeed * moveSpeedMultiplier);
  const pickupRadius = Math.max(
    8,
    (arenaSurvivorPlayerDefinition.pickupRadius + pickupRadiusBonus) * pickupRadiusMultiplier
  );
  const maxHp = Math.max(1, arenaSurvivorPlayerDefinition.maxHp + maxHpBonus);

  return {
    moveSpeed,
    pickupRadius,
    maxHp,
    armor,
    dodgePct: Math.min(70, Math.max(0, dodgePct)),
    luck,
    harvesting,
    hpRegen: Math.max(0, hpRegen),
    contactDamageTakenMultiplier: arenaSurvivorPlayerDefinition.contactDamageTakenMultiplier,
    damageMultiplier,
    projectileDamageMultiplier: damageMultiplier,
    projectileSpeedMultiplier: arenaSurvivorPlayerDefinition.projectileSpeedMultiplier,
    weaponRangeMultiplier: Math.max(0.2, weaponRangeMultiplier),
    attackSpeedMultiplier,
    autoFireRateMultiplier: attackSpeedMultiplier,
    meleePowerMultiplier,
    rangedPowerMultiplier,
    magicPowerMultiplier,
    elementalPowerMultiplier,
    critChancePct,
    critDamageMultiplier,
    projectileCountBonus,
    pierceBonus,
    lifeStealPct
  };
}

function characterDefinitionModifiers(characterId: string): ArenaSurvivorStatModifiers {
  return arenaSurvivorCharacterDefinitionsById[characterId]?.modifiers ?? {};
}

function resolveCarryForPlayer(
  previousState: ArenaSurvivorRuntimeState,
  playerId: string
): ArenaSurvivorPlayerCarryRecord | null {
  const previousPlayer = previousState.players.find((entry) => entry.playerId === playerId);

  if (!previousPlayer) {
    return null;
  }

  return {
    playerId,
    continuedRun: true,
    characterId: previousPlayer.character.id,
    materials: previousPlayer.materials,
    loadout: cloneLoadout(previousPlayer.loadout),
    runSummary: cloneRunSummary(previousPlayer.runSummary)
  };
}

export function resolveArenaSurvivorRunCarry(
  previousState: ArenaSurvivorRuntimeState | null | undefined,
  playerIds: string[]
): ArenaSurvivorRunCarryResolution {
  if (!previousState || previousState.result.outcome !== "survived") {
    return {
      continuedRun: false,
      waveNumber: 1,
      players: playerIds.map((playerId, index) => ({
        playerId,
        continuedRun: false,
        characterId: arenaSurvivorCharacterDefinitions[index % arenaSurvivorCharacterDefinitions.length]?.id,
        materials: 0,
        loadout: createArenaSurvivorStarterLoadout(
          arenaSurvivorCharacterDefinitions[index % arenaSurvivorCharacterDefinitions.length]?.id
        ),
        runSummary: createEmptyRunSummary()
      }))
    };
  }

  return {
    continuedRun: true,
    waveNumber: previousState.waveNumber + 1,
    players: playerIds.map((playerId, index) => {
      const carry = resolveCarryForPlayer(previousState, playerId);

      return (
        carry ?? {
          playerId,
          continuedRun: false,
          characterId: arenaSurvivorCharacterDefinitions[index % arenaSurvivorCharacterDefinitions.length]?.id,
          materials: 0,
          loadout: createArenaSurvivorStarterLoadout(
            arenaSurvivorCharacterDefinitions[index % arenaSurvivorCharacterDefinitions.length]?.id
          ),
          runSummary: createEmptyRunSummary()
        }
      );
    })
  };
}

function createItemOffer(
  itemId: string,
  currentLevel: number,
  materials: number,
  waveNumber: number
): ArenaSurvivorShopOfferState | null {
  const definition = arenaSurvivorItemDefinitionsById[itemId];

  if (!definition) {
    return null;
  }

  const targetLevel = currentLevel + 1;
  const minimumWave =
    targetLevel <= 1
      ? 1
      : targetLevel === 2
        ? 2
        : targetLevel === 3
          ? 4
          : 8;

  if (waveNumber < minimumWave) {
    return null;
  }

  const levelDefinition = definition.levels.find((entry) => entry.level === targetLevel);

  if (!levelDefinition) {
    return null;
  }

  return {
    id: `item:${itemId}:${targetLevel}`,
    kind: "item",
    title: definition.name,
    description: levelDefinition.description,
    cost: levelDefinition.cost,
    affordable: materials >= levelDefinition.cost,
    purchased: false,
    targetLevel,
    itemId,
    iconPath: resolveItemIconPath(itemId),
    tags: definition.tags,
    summary: currentLevel > 0 ? `Upgrade auf Lv. ${targetLevel}` : "Neues Item"
  };
}

function resolveCombinableWeaponCandidate(
  weapons: ArenaSurvivorLoadoutWeaponState[],
  weaponId: string,
  level: number
): ArenaSurvivorLoadoutWeaponState | null {
  for (const weapon of weapons) {
    if (
      weapon.weaponId === weaponId &&
      weapon.level === level &&
      weapon.level < weapon.maxLevel
    ) {
      return weapon;
    }
  }

  return null;
}

function createWeaponOffer(
  definition: ArenaSurvivorContentWeaponDefinition,
  targetLevel: number,
  ownedCopies: number,
  materials: number,
  currentWeaponCount: number,
  options?: {
    combineTarget?: ArenaSurvivorLoadoutWeaponState | null;
    hasWeaponSlotAvailable?: boolean;
  }
): ArenaSurvivorShopOfferState | null {
  const combineTarget = options?.combineTarget ?? null;
  const hasWeaponSlotAvailable = options?.hasWeaponSlotAvailable ?? currentWeaponCount < MAX_WEAPON_SLOTS;
  const levelDefinition = definition.levels.find((entry) => entry.level === targetLevel);

  if (!levelDefinition) {
    return null;
  }

  const nextSlotNumber = currentWeaponCount + 1;

  return {
    id: combineTarget
      ? `weapon:${definition.id}:combine:${combineTarget.weaponInstanceId}:level:${targetLevel}`
      : `weapon:${definition.id}:copy:level:${targetLevel}`,
    kind: "weapon",
    title: `${definition.name} Lv. ${targetLevel}`,
    description: levelDefinition.description,
    cost: levelDefinition.cost,
    affordable: materials >= levelDefinition.cost && (hasWeaponSlotAvailable || Boolean(combineTarget)),
    purchased: false,
    targetLevel,
    weaponId: definition.id,
    targetWeaponInstanceId: combineTarget?.weaponInstanceId,
    iconPath: weaponShopIconPath(definition.id),
    tags: definition.tags,
    detailLines: buildWeaponOfferDetailLines(definition, levelDefinition),
    summary: combineTarget
      ? `Lv. ${targetLevel} | Direkt kombinierbar zu Lv. ${targetLevel + 1}`
      : !hasWeaponSlotAvailable
        ? `Lv. ${targetLevel} | Slot voll - erst verkaufen oder kombinieren`
      : ownedCopies > 0
        ? `Lv. ${targetLevel} | ${ownedCopies + 1}. Kopie | Slot ${nextSlotNumber}/${MAX_WEAPON_SLOTS}`
        : `Lv. ${targetLevel} | Neuer Waffenslot ${nextSlotNumber}/${MAX_WEAPON_SLOTS}`
  };
}

function createOfferPools(
  player: ArenaSurvivorRuntimePlayerState,
  waveNumber: number,
  seed: number
): {
  items: ArenaSurvivorShopOfferState[];
  weapons: ArenaSurvivorShopOfferState[];
  seed: number;
} {
  const itemLevels = new Map(player.loadout.items.map((item) => [item.itemId, item.level]));
  const weaponCounts = player.loadout.weapons.reduce((counts, weapon) => {
    counts.set(weapon.weaponId, (counts.get(weapon.weaponId) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
  const hasWeaponSlotAvailable = player.loadout.weapons.length < MAX_WEAPON_SLOTS;
  let nextSeed = seed;

  return {
    items: arenaSurvivorItemDefinitions
      .map((item) =>
        createItemOffer(item.id, itemLevels.get(item.id) ?? 0, player.materials, waveNumber)
      )
      .filter((offer): offer is ArenaSurvivorShopOfferState => offer !== null),
    weapons: arenaSurvivorWeaponDefinitions
      .map((weapon) => {
        const levelResolution = resolveWeaponOfferLevel(weapon, waveNumber, nextSeed);
        nextSeed = levelResolution.seed;

        return createWeaponOffer(
          weapon,
          levelResolution.level,
          weaponCounts.get(weapon.id) ?? 0,
          player.materials,
          player.loadout.weapons.length,
          {
            combineTarget: hasWeaponSlotAvailable
              ? null
              : resolveCombinableWeaponCandidate(
                  player.loadout.weapons,
                  weapon.id,
                  levelResolution.level
                ),
            hasWeaponSlotAvailable
          }
        );
      })
      .filter((offer): offer is ArenaSurvivorShopOfferState => offer !== null),
    seed: nextSeed
  };
}

function resolveArenaSurvivorShopRerollCost(waveNumber: number, rerollCount: number): number {
  return (
    arenaSurvivorShopRerollBaseCost +
    Math.max(0, waveNumber - 1) * arenaSurvivorShopRerollWaveCost +
    rerollCount * arenaSurvivorShopRerollStepCost
  );
}

function pullOffer(
  pool: ArenaSurvivorShopOfferState[],
  usedOfferIds: Set<string>,
  seed: number
): { offer: ArenaSurvivorShopOfferState | null; seed: number } {
  const candidates = pool.filter((offer) => !usedOfferIds.has(offer.id));

  if (candidates.length === 0) {
    return { offer: null, seed };
  }

  const random = createSeededRandom(seed);
  const picked = candidates[Math.floor(random.value * candidates.length)] ?? null;

  return {
    offer: picked ? { ...picked } : null,
    seed: random.seed
  };
}

function buildShopOffersForPlayer(
  player: ArenaSurvivorRuntimePlayerState,
  waveNumber: number,
  seed: number
): { offers: ArenaSurvivorShopOfferState[]; seed: number } {
  const pools = createOfferPools(player, waveNumber, seed);
  const offers: ArenaSurvivorShopOfferState[] = [];
  const usedOfferIds = new Set<string>();
  let nextSeed = pools.seed;

  const preferredWeaponPick = pullOffer(pools.weapons, usedOfferIds, nextSeed);
  nextSeed = preferredWeaponPick.seed;

  if (preferredWeaponPick.offer) {
    offers.push(preferredWeaponPick.offer);
    usedOfferIds.add(preferredWeaponPick.offer.id);
  }

  const combinedPool = [...pools.items, ...pools.weapons];

  while (offers.length < arenaSurvivorShopOfferCount) {
    const offerPick = pullOffer(combinedPool, usedOfferIds, nextSeed);
    nextSeed = offerPick.seed;

    if (!offerPick.offer) {
      break;
    }

    offers.push(offerPick.offer);
    usedOfferIds.add(offerPick.offer.id);
  }

  return {
    offers,
    seed: nextSeed
  };
}

function createArenaSurvivorShopStateForPlayer(
  player: ArenaSurvivorRuntimePlayerState,
  waveNumber: number,
  rerollCount: number,
  seed: number,
  language?: SupportedLanguage
): { shop: ArenaSurvivorShopState; seed: number } {
  const en = language === "en";
  const offerResolution = buildShopOffersForPlayer(player, waveNumber, seed);
  const rerollCost = resolveArenaSurvivorShopRerollCost(waveNumber, rerollCount);

  return {
    seed: offerResolution.seed,
    shop: {
      available: offerResolution.offers.length > 0,
      offers: offerResolution.offers,
      message:
        offerResolution.offers.length > 0
          ? en ? "Buy upgrades or reroll offers for the next wave." : "Kaufe Upgrades oder wuerfle neue Angebote fuer die naechste Welle."
          : en ? "No more shop offers available." : "Keine weiteren Shop-Angebote verfuegbar.",
      rerollCount,
      rerollCost,
      canReroll: offerResolution.offers.length > 0 && player.materials >= rerollCost
    }
  };
}

function refreshArenaSurvivorShopOffers(
  loadout: ArenaSurvivorLoadoutState,
  offers: ArenaSurvivorShopOfferState[],
  materials: number
): ArenaSurvivorShopOfferState[] {
  const itemLevels = new Map(loadout.items.map((item) => [item.itemId, item.level]));
  const hasWeaponSlotAvailable = loadout.weapons.length < MAX_WEAPON_SLOTS;

  return offers
    .filter((offer) => {
      if (offer.kind === "item" && offer.itemId) {
        const currentLevel = itemLevels.get(offer.itemId) ?? 0;
        return offer.purchased || offer.targetLevel === currentLevel + 1;
      }

      return true;
    })
    .map((offer) => {
      const combineTarget =
        offer.kind === "weapon" && offer.weaponId && !hasWeaponSlotAvailable
          ? resolveCombinableWeaponCandidate(loadout.weapons, offer.weaponId, offer.targetLevel)
          : null;

      return {
        ...offer,
        targetWeaponInstanceId: combineTarget?.weaponInstanceId,
        affordable:
          !offer.purchased &&
          materials >= offer.cost &&
          (offer.kind !== "weapon" || hasWeaponSlotAvailable || Boolean(combineTarget))
      };
    });
}

export function createArenaSurvivorShopsForPlayers(
  players: ArenaSurvivorRuntimePlayerState[],
  waveNumber: number,
  seed: number,
  language?: SupportedLanguage
): { shopsByPlayerId: Map<string, ArenaSurvivorShopState>; seed: number } {
  let nextSeed = seed;
  const shopsByPlayerId = new Map<string, ArenaSurvivorShopState>();

  for (const player of players) {
    const shopResolution = createArenaSurvivorShopStateForPlayer(player, waveNumber, 0, nextSeed, language);
    nextSeed = shopResolution.seed;
    shopsByPlayerId.set(player.playerId, shopResolution.shop);
  }

  return {
    shopsByPlayerId,
    seed: nextSeed
  };
}

export function applyArenaSurvivorShopReroll(
  state: ArenaSurvivorRuntimeState,
  playerId: string
): ArenaSurvivorRuntimeState {
  const playerIndex = state.players.findIndex((entry) => entry.playerId === playerId);

  if (playerIndex === -1) {
    return state;
  }

  const player = state.players[playerIndex];

  if (!player.shop.available || !player.shop.canReroll || player.materials < player.shop.rerollCost) {
    return state;
  }

  const nextMaterials = player.materials - player.shop.rerollCost;
  const rerolledPlayer: ArenaSurvivorRuntimePlayerState = {
    ...player,
    materials: nextMaterials,
    shop: {
      ...player.shop
    },
    runSummary: {
      ...player.runSummary,
      spentMaterials: player.runSummary.spentMaterials + player.shop.rerollCost
    }
  };

  const rerollSeed = createSeededRandom(state.seed ^ (playerIndex + 1) * 13_337).seed;
  const shopResolution = createArenaSurvivorShopStateForPlayer(
    rerolledPlayer,
    state.waveNumber,
    player.shop.rerollCount + 1,
    rerollSeed,
    state.language
  );
  const nextPlayers = [...state.players];
  nextPlayers[playerIndex] = {
    ...rerolledPlayer,
    shop: shopResolution.shop
  };

  return {
    ...state,
    seed: shopResolution.seed,
    players: nextPlayers
  };
}

export function applyArenaSurvivorShopPurchase(
  state: ArenaSurvivorRuntimeState,
  playerId: string,
  offerId: string
): ArenaSurvivorRuntimeState {
  const playerIndex = state.players.findIndex((entry) => entry.playerId === playerId);

  if (playerIndex === -1) {
    return state;
  }

  const player = state.players[playerIndex];

  if (!player.shop.available) {
    return state;
  }

  const offer = player.shop.offers.find((entry) => entry.id === offerId);

  if (!offer || offer.purchased || offer.cost > player.materials) {
    return state;
  }

  const nextLoadout = cloneLoadout(player.loadout);
  let purchaseApplied = false;

  if (offer.kind === "item" && offer.itemId) {
    const existingItem = nextLoadout.items.find((item) => item.itemId === offer.itemId);

    if (existingItem) {
      Object.assign(existingItem, createOwnedItemState(offer.itemId, offer.targetLevel));
    } else {
      nextLoadout.items.push(createOwnedItemState(offer.itemId, offer.targetLevel));
    }

    purchaseApplied = true;
  }

  if (offer.kind === "weapon" && offer.weaponId) {
    if (nextLoadout.weapons.length < MAX_WEAPON_SLOTS) {
      nextLoadout.weapons.push(
        createLoadoutWeaponState(offer.weaponId, offer.targetLevel, {
          starterGranted: false,
          investedMaterials: offer.cost
        })
      );
      purchaseApplied = true;
    } else {
      const existingWeapon = resolveCombinableWeaponCandidate(
        nextLoadout.weapons,
        offer.weaponId,
        offer.targetLevel
      );

      if (existingWeapon) {
        Object.assign(
          existingWeapon,
          createLoadoutWeaponState(offer.weaponId, offer.targetLevel + 1, {
            weaponInstanceId: existingWeapon.weaponInstanceId,
            starterGranted: existingWeapon.starterGranted ?? false,
            investedMaterials: (existingWeapon.investedMaterials ?? 0) + offer.cost
          })
        );
        purchaseApplied = true;
      }
    }
  }

  if (!purchaseApplied) {
    return state;
  }

  nextLoadout.items.sort((left, right) => left.displayName.localeCompare(right.displayName));

  const nextMaterials = player.materials - offer.cost;
  const nextStats = resolveArenaSurvivorPlayerStats(nextLoadout, player.character.id);
  const nextShopOffers = refreshArenaSurvivorShopOffers(
    nextLoadout,
    player.shop.offers.map((entry) => {
      if (entry.id === offer.id) {
        return {
          ...entry,
          purchased: true,
          affordable: false
        };
      }

      return {
        ...entry
      };
    }),
    nextMaterials
  );

  const nextPlayers = [...state.players];
  nextPlayers[playerIndex] = {
    ...player,
    materials: nextMaterials,
    loadout: nextLoadout,
    shop: {
      ...player.shop,
      offers: nextShopOffers,
      canReroll: nextMaterials >= player.shop.rerollCost
    },
    moveSpeed: nextStats.moveSpeed,
    maxHp: nextStats.maxHp,
    hp: Math.min(nextStats.maxHp, player.hp),
    weaponRuntimeStates: createArenaSurvivorWeaponRuntimeStates(nextLoadout, player.weaponRuntimeStates),
    stats: nextStats,
    runSummary: {
      ...player.runSummary,
      spentMaterials: player.runSummary.spentMaterials + offer.cost
    }
  };

  return {
    ...state,
    players: nextPlayers
  };
}

export function applyArenaSurvivorShopSell(
  state: ArenaSurvivorRuntimeState,
  playerId: string,
  weaponInstanceId: string
): ArenaSurvivorRuntimeState {
  const playerIndex = state.players.findIndex((entry) => entry.playerId === playerId);

  if (playerIndex === -1) {
    return state;
  }

  const player = state.players[playerIndex];

  const weaponIndex = player.loadout.weapons.findIndex(
    (weapon) => weapon.weaponInstanceId === weaponInstanceId
  );

  if (weaponIndex === -1) {
    return state;
  }

  const weapon = player.loadout.weapons[weaponIndex];
  const sellValue = weapon.sellValue ?? 0;

  if (!weapon.sellable || sellValue <= 0) {
    return state;
  }

  const nextLoadout = cloneLoadout(player.loadout);
  nextLoadout.weapons.splice(weaponIndex, 1);

  const nextMaterials = player.materials + sellValue;
  const nextStats = resolveArenaSurvivorPlayerStats(nextLoadout, player.character.id);
  const nextOffers = refreshArenaSurvivorShopOffers(
    nextLoadout,
    player.shop.offers,
    nextMaterials
  );

  const nextPlayers = [...state.players];
  nextPlayers[playerIndex] = {
    ...player,
    materials: nextMaterials,
    loadout: nextLoadout,
    shop: {
      ...player.shop,
      offers: nextOffers,
      canReroll: nextMaterials >= player.shop.rerollCost
    },
    moveSpeed: nextStats.moveSpeed,
    maxHp: nextStats.maxHp,
    hp: Math.min(nextStats.maxHp, player.hp),
    weaponRuntimeStates: createArenaSurvivorWeaponRuntimeStates(nextLoadout, player.weaponRuntimeStates),
    stats: nextStats
  };

  return {
    ...state,
    players: nextPlayers
  };
}

export function applyArenaSurvivorShopCombine(
  state: ArenaSurvivorRuntimeState,
  playerId: string,
  weaponInstanceId: string
): ArenaSurvivorRuntimeState {
  const playerIndex = state.players.findIndex((entry) => entry.playerId === playerId);

  if (playerIndex === -1) {
    return state;
  }

  const player = state.players[playerIndex];

  const selectedWeapon = player.loadout.weapons.find(
    (weapon) => weapon.weaponInstanceId === weaponInstanceId
  );

  if (!selectedWeapon || selectedWeapon.level >= selectedWeapon.maxLevel) {
    return state;
  }

  const consumedWeapon = player.loadout.weapons.find(
    (weapon) =>
      weapon.weaponInstanceId !== selectedWeapon.weaponInstanceId &&
      weapon.weaponId === selectedWeapon.weaponId &&
      weapon.level === selectedWeapon.level
  );

  if (!consumedWeapon) {
    return state;
  }

  const upgradedWeapon = createLoadoutWeaponState(
    selectedWeapon.weaponId,
    selectedWeapon.level + 1,
    {
      weaponInstanceId: selectedWeapon.weaponInstanceId,
      starterGranted:
        (selectedWeapon.starterGranted ?? false) || (consumedWeapon.starterGranted ?? false),
      investedMaterials:
        (selectedWeapon.investedMaterials ?? 0) + (consumedWeapon.investedMaterials ?? 0)
    }
  );
  const nextLoadout = cloneLoadout(player.loadout);
  nextLoadout.weapons = nextLoadout.weapons
    .filter((weapon) => weapon.weaponInstanceId !== consumedWeapon.weaponInstanceId)
    .map((weapon) =>
      weapon.weaponInstanceId === selectedWeapon.weaponInstanceId ? upgradedWeapon : weapon
    );

  const nextStats = resolveArenaSurvivorPlayerStats(nextLoadout, player.character.id);
  const nextOffers = refreshArenaSurvivorShopOffers(
    nextLoadout,
    player.shop.offers,
    player.materials
  );
  const nextPlayers = [...state.players];
  nextPlayers[playerIndex] = {
    ...player,
    loadout: nextLoadout,
    shop: {
      ...player.shop,
      offers: nextOffers,
      canReroll: player.materials >= player.shop.rerollCost
    },
    moveSpeed: nextStats.moveSpeed,
    maxHp: nextStats.maxHp,
    hp: Math.min(nextStats.maxHp, player.hp),
    weaponRuntimeStates: createArenaSurvivorWeaponRuntimeStates(nextLoadout, player.weaponRuntimeStates),
    stats: nextStats
  };

  return {
    ...state,
    players: nextPlayers
  };
}
