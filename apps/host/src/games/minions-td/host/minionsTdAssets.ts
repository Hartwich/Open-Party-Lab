import Phaser from "phaser";

const towerIds = ["guard", "emp", "burst", "missile", "tesla", "ion"] as const;
const enemyIds = [
  "glint",
  "bulwark",
  "swiftstar",
  "ironray",
  "verdantis",
  "pulsefang",
  "rushclaw",
  "stonebeak",
  "grimtalon",
  "shockfin",
  "viperx",
  "colossar",
  "stormlord",
  "ashdrake",
  "flashreign",
  "hivecore"
] as const;

const staticTileBaseSize = 64;
const staticPathTileKey = "minions-td-static-path-tile";
const staticBuildSlotTileKey = "minions-td-static-build-slot-tile";

export function resolveMinionsTdTowerSpriteKey(towerTypeId: string): string {
  return `minions-td-tower-${towerTypeId}`;
}

export function resolveMinionsTdEnemySpriteKey(enemyTypeId: string): string {
  return `minions-td-enemy-${enemyTypeId}`;
}

export function resolveMinionsTdStaticPathTileKey(): string {
  return staticPathTileKey;
}

export function resolveMinionsTdStaticBuildSlotTileKey(): string {
  return staticBuildSlotTileKey;
}

export function getMinionsTdStaticTileBaseSize(): number {
  return staticTileBaseSize;
}

function generateStaticTileTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(staticPathTileKey)) {
    const graphics = scene.make.graphics({}, false);
    graphics.clear();
    graphics.fillStyle(0x082f49, 0.98);
    graphics.fillRect(0, 0, staticTileBaseSize, staticTileBaseSize);
    graphics.fillStyle(0x7dd3fc, 0.18);
    graphics.fillRoundedRect(8, 14, staticTileBaseSize - 16, staticTileBaseSize - 28, 6);
    graphics.lineStyle(1, 0x7dd3fc, 0.24);
    graphics.strokeRoundedRect(7, 13, staticTileBaseSize - 14, staticTileBaseSize - 26, 6);
    graphics.generateTexture(staticPathTileKey, staticTileBaseSize, staticTileBaseSize);
    graphics.destroy();
  }

  if (!scene.textures.exists(staticBuildSlotTileKey)) {
    const graphics = scene.make.graphics({}, false);
    graphics.clear();
    graphics.fillStyle(0x0f172a, 0.3);
    graphics.fillRoundedRect(4, 4, staticTileBaseSize - 8, staticTileBaseSize - 8, 8);
    graphics.lineStyle(2, 0x38bdf8, 0.88);
    graphics.strokeRoundedRect(3, 3, staticTileBaseSize - 6, staticTileBaseSize - 6, 8);
    graphics.lineStyle(1, 0x7dd3fc, 0.18);
    graphics.strokeRoundedRect(9, 9, staticTileBaseSize - 18, staticTileBaseSize - 18, 6);
    graphics.generateTexture(staticBuildSlotTileKey, staticTileBaseSize, staticTileBaseSize);
    graphics.destroy();
  }
}

export function loadMinionsTdAssets(scene: Phaser.Scene): void {
  generateStaticTileTextures(scene);

  for (const towerId of towerIds) {
    const spriteKey = resolveMinionsTdTowerSpriteKey(towerId);

    if (!scene.textures.exists(spriteKey)) {
      scene.load.image(spriteKey, `/minions-td/tower-icons/${towerId}.svg`);
    }
  }

  for (const enemyId of enemyIds) {
    const spriteKey = resolveMinionsTdEnemySpriteKey(enemyId);

    if (!scene.textures.exists(spriteKey)) {
      scene.load.image(spriteKey, `/minions-td/enemy-icons/${enemyId}.svg`);
    }
  }
}
