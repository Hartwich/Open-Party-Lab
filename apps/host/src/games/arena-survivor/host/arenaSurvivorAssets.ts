import Phaser from "phaser";

const characterIds = [
  "schrotto-scharfschuss",
  "kloppbert-keulenwucht",
  "funkenberta-flaemmchen",
  "kanni-baldrian",
  "doktor-knolle",
  "sir-pampel-panzer",
  "flitzelotte",
  "professor-paradox"
] as const;
const enemyIds = [
  "slime-blob",
  "fang-crawler",
  "stone-brute",
  "ember-wisp",
  "toxic-shroom",
  "scrap-goliath",
  "crimson-overlord"
] as const;
const weaponIds = [
  "cleaver",
  "coil-rifle",
  "ember-wand",
  "frost-orb",
  "gear-launcher",
  "halberd",
  "hunter-bow",
  "lance",
  "mace",
  "prism-scepter",
  "rust-blade",
  "scrap-smg",
  "spear",
  "spark-rod",
  "stick",
  "stone",
  "survivor-pistol",
  "twin-daggers",
  "venom-siphon",
  "war-hammer",
  "pitchfork"
] as const;

const arenaSurvivorBackgroundKey = "arena-survivor-background";

export interface ArenaSurvivorAssetDescriptor {
  id: string;
  spriteKey: string;
  spritePath: string;
  portraitKey: string;
  portraitPath: string;
}

export const arenaSurvivorCharacterAssets: readonly ArenaSurvivorAssetDescriptor[] = characterIds.map((id) => ({
  id,
  spriteKey: `arena-survivor-character-${id}`,
  spritePath: `/arena-survivor/characters/sprites/${id}.svg`,
  portraitKey: `arena-survivor-character-portrait-${id}`,
  portraitPath: `/arena-survivor/characters/portraits/${id}.svg`
}));

export const arenaSurvivorEnemyAssets: readonly ArenaSurvivorAssetDescriptor[] = enemyIds.map((id) => ({
  id,
  spriteKey: `arena-survivor-enemy-${id}`,
  spritePath: `/arena-survivor/enemies/sprites/${id}.svg`,
  portraitKey: `arena-survivor-enemy-portrait-${id}`,
  portraitPath: `/arena-survivor/enemies/portraits/${id}.svg`
}));

export const arenaSurvivorWeaponCarryAssets: ReadonlyArray<{
  id: string;
  spriteKey: string;
  spritePath: string;
}> = weaponIds.map((id) => ({
  id,
  spriteKey: `arena-survivor-weapon-carry-${id}`,
  spritePath: `/arena-survivor/weapons/carry/${id}_carry.svg`
}));

export function loadArenaSurvivorAssets(scene: Phaser.Scene): void {
  for (const asset of [...arenaSurvivorCharacterAssets, ...arenaSurvivorEnemyAssets]) {
    if (!scene.textures.exists(asset.spriteKey)) {
      scene.load.svg(asset.spriteKey, asset.spritePath);
    }

    if (!scene.textures.exists(asset.portraitKey)) {
      scene.load.svg(asset.portraitKey, asset.portraitPath);
    }
  }

  for (const asset of arenaSurvivorWeaponCarryAssets) {
    if (!scene.textures.exists(asset.spriteKey)) {
      scene.load.svg(asset.spriteKey, asset.spritePath);
    }
  }

  if (!scene.textures.exists(arenaSurvivorBackgroundKey)) {
    scene.load.svg(arenaSurvivorBackgroundKey, "/arena-survivor/backgrounds/arena-field.svg");
  }
}

export function resolveArenaSurvivorPlayerSpriteKey(characterId: string): string {
  const asset = arenaSurvivorCharacterAssets.find((entry) => entry.id === characterId);
  return asset?.spriteKey ?? arenaSurvivorCharacterAssets[0].spriteKey;
}

export function resolveArenaSurvivorPlayerPortraitKey(characterId: string): string {
  const asset = arenaSurvivorCharacterAssets.find((entry) => entry.id === characterId);
  return asset?.portraitKey ?? arenaSurvivorCharacterAssets[0].portraitKey;
}

export function resolveArenaSurvivorEnemySpriteKey(definitionId: string): string | null {
  const asset = arenaSurvivorEnemyAssets.find((entry) => entry.id === definitionId);
  return asset?.spriteKey ?? null;
}

export function resolveArenaSurvivorEnemyPortraitKey(definitionId: string): string | null {
  const asset = arenaSurvivorEnemyAssets.find((entry) => entry.id === definitionId);
  return asset?.portraitKey ?? null;
}

export function resolveArenaSurvivorWeaponCarrySpriteKey(weaponId: string): string | null {
  const asset = arenaSurvivorWeaponCarryAssets.find((entry) => entry.id === weaponId);
  return asset?.spriteKey ?? null;
}

export function resolveArenaSurvivorBackgroundKey(): string {
  return arenaSurvivorBackgroundKey;
}
