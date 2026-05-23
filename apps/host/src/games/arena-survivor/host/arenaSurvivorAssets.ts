import Phaser from "phaser";

const characterAssetIds = [
  { id: "schrotto-scharfschuss", assetId: "schrotto-scharfschuss" },
  { id: "kloppbert-keulenwucht", assetId: "kloppbert-keulenwucht" },
  { id: "funkenberta-flaemmchen", assetId: "funkenberta-flaemmchen" },
  { id: "kanni-baldrian", assetId: "kanni-baldrian" },
  { id: "doktor-knolle", assetId: "doktor-knolle" },
  { id: "sir-pampel-panzer", assetId: "sir-pampel-panzer" },
  { id: "flitzelotte", assetId: "flitzelotte" },
  { id: "professor-paradox", assetId: "professor-paradox" },
  { id: "rundling-allround", assetId: "professor-paradox" },
  { id: "pruegler-brawler", assetId: "kloppbert-keulenwucht" },
  { id: "jaeger-ranger", assetId: "schrotto-scharfschuss" },
  { id: "gluecksknolle-lucky", assetId: "flitzelotte" },
  { id: "ackerling-farmer", assetId: "doktor-knolle" }
] as const;
const enemyAssetIds = [
  { id: "slime-blob", assetId: "slime-blob" },
  { id: "fang-crawler", assetId: "fang-crawler" },
  { id: "needle-runner", assetId: "fang-crawler" },
  { id: "stone-brute", assetId: "stone-brute" },
  { id: "shell-bulwark", assetId: "stone-brute" },
  { id: "ember-wisp", assetId: "ember-wisp" },
  { id: "toxic-shroom", assetId: "toxic-shroom" },
  { id: "ash-spitter", assetId: "ember-wisp" },
  { id: "plague-lobber", assetId: "toxic-shroom" },
  { id: "iron-mauler", assetId: "stone-brute" },
  { id: "loot-runner", assetId: "fang-crawler" },
  { id: "charger-hulk", assetId: "stone-brute" },
  { id: "elite-spitter", assetId: "ember-wisp" },
  { id: "scrap-goliath", assetId: "scrap-goliath" },
  { id: "crimson-overlord", assetId: "crimson-overlord" }
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

export const arenaSurvivorCharacterAssets: readonly ArenaSurvivorAssetDescriptor[] = characterAssetIds.map((entry) => ({
  id: entry.id,
  spriteKey: `arena-survivor-character-${entry.id}`,
  spritePath: `/arena-survivor/characters/sprites/${entry.assetId}.svg`,
  portraitKey: `arena-survivor-character-portrait-${entry.id}`,
  portraitPath: `/arena-survivor/characters/portraits/${entry.assetId}.svg`
}));

export const arenaSurvivorEnemyAssets: readonly ArenaSurvivorAssetDescriptor[] = enemyAssetIds.map((entry) => ({
  id: entry.id,
  spriteKey: `arena-survivor-enemy-${entry.id}`,
  spritePath: `/arena-survivor/enemies/sprites/${entry.assetId}.svg`,
  portraitKey: `arena-survivor-enemy-portrait-${entry.id}`,
  portraitPath: `/arena-survivor/enemies/portraits/${entry.assetId}.svg`
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
