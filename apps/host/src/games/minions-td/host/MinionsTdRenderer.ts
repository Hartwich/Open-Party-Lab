import Phaser from "phaser";
import type { MinionsTdMapState, MinionsTdPlayerBoardState, MinionsTdState, SupportedLanguage } from "@open-party-lab/protocol";
import {
  resolveMinionsTdEnemySpriteKey,
  resolveMinionsTdTowerSpriteKey
} from "./minionsTdAssets.js";

export interface MinionsTdPanelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MinionsTdPanelLayout {
  panelRects: MinionsTdPanelRect[];
  mapRects: MinionsTdPanelRect[];
  titleHeight: number;
  footerHeight: number;
  cellSize: number;
}

export interface MinionsTdSpriteLayer {
  towerSprites: Map<string, Phaser.GameObjects.Image>;
  enemySprites: Map<string, Phaser.GameObjects.Image>;
}

export interface MinionsTdStaticLayer {
  panelImages: Phaser.GameObjects.Image[];
  scratchGraphics: Phaser.GameObjects.Graphics;
  textureKeys: string[];
  textureManager: Phaser.Textures.TextureManager;
  textureBuildCount: number;
}

export interface MinionsTdStaticLayerMetrics {
  layoutMs: number;
  vectorRasterMs: number;
  tileStampMs: number;
  panelTextureCount: number;
  pathStampCount: number;
  buildSlotStampCount: number;
  gridLineCount: number;
  staticTexturePixels: number;
  cellSizePx: number;
  textureBuildCount: number;
}

export const emptyMinionsTdStaticLayerMetrics: MinionsTdStaticLayerMetrics = {
  layoutMs: 0,
  vectorRasterMs: 0,
  tileStampMs: 0,
  panelTextureCount: 0,
  pathStampCount: 0,
  buildSlotStampCount: 0,
  gridLineCount: 0,
  staticTexturePixels: 0,
  cellSizePx: 0,
  textureBuildCount: 0
};

const buildSlotLookupCache = new Map<string, Map<string, MinionsTdMapState["buildSlots"][number]>>();

function toColor(color: string): number {
  return Phaser.Display.Color.HexStringToColor(color).color;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolveMapCellRect(mapRect: MinionsTdPanelRect, map: MinionsTdMapState, col: number, row: number): MinionsTdPanelRect {
  const cellWidth = mapRect.width / map.cols;
  const cellHeight = mapRect.height / map.rows;
  return {
    x: mapRect.x + col * cellWidth,
    y: mapRect.y + row * cellHeight,
    width: cellWidth,
    height: cellHeight
  };
}

function resolveMapPoint(mapRect: MinionsTdPanelRect, map: MinionsTdMapState, x: number, y: number): { x: number; y: number } {
  return {
    x: mapRect.x + x * (mapRect.width / map.cols),
    y: mapRect.y + y * (mapRect.height / map.rows)
  };
}

function resolveBuildSlotLookup(map: MinionsTdMapState): Map<string, MinionsTdMapState["buildSlots"][number]> {
  const cached = buildSlotLookupCache.get(map.id);

  if (cached) {
    return cached;
  }

  const lookup = new Map(map.buildSlots.map((slot) => [slot.id, slot] as const));
  buildSlotLookupCache.set(map.id, lookup);
  return lookup;
}

function resolveBuildSlotById(
  map: MinionsTdMapState,
  slotId: string
): MinionsTdMapState["buildSlots"][number] | undefined {
  return resolveBuildSlotLookup(map).get(slotId);
}

function resolveLocalMapRect(
  panelRect: MinionsTdPanelRect,
  mapRect: MinionsTdPanelRect
): MinionsTdPanelRect {
  return {
    x: mapRect.x - panelRect.x,
    y: mapRect.y - panelRect.y,
    width: mapRect.width,
    height: mapRect.height
  };
}

function createPanelImage(scene: Phaser.Scene): Phaser.GameObjects.Image {
  return scene.add.image(0, 0, "__WHITE").setOrigin(0, 0).setDepth(0).setVisible(false);
}

export function createMinionsTdSpriteLayer(): MinionsTdSpriteLayer {
  return {
    towerSprites: new Map(),
    enemySprites: new Map()
  };
}

export function createMinionsTdStaticLayer(scene: Phaser.Scene): MinionsTdStaticLayer {
  return {
    panelImages: Array.from({ length: 4 }, () => createPanelImage(scene)),
    scratchGraphics: scene.make.graphics({}, false),
    textureKeys: Array.from({ length: 4 }, (_, index) => `minions-td-static-panel-${scene.sys.settings.key}-${index}`),
    textureManager: scene.textures,
    textureBuildCount: 0
  };
}

export function hideMinionsTdStaticLayer(layer: MinionsTdStaticLayer): void {
  for (const image of layer.panelImages) {
    image.setVisible(false);
  }
}

export function destroyMinionsTdStaticLayer(layer: MinionsTdStaticLayer): void {
  for (const image of layer.panelImages) {
    image.destroy();
  }
  for (const textureKey of layer.textureKeys) {
    if (layer.textureManager.exists(textureKey)) {
      layer.textureManager.remove(textureKey);
    }
  }
  layer.panelImages = [];
  layer.scratchGraphics.destroy();
}

export function hideMinionsTdSpriteLayer(layer: MinionsTdSpriteLayer): void {
  for (const sprite of layer.towerSprites.values()) {
    sprite.setVisible(false);
  }

  for (const sprite of layer.enemySprites.values()) {
    sprite.setVisible(false);
  }
}

export function destroyMinionsTdSpriteLayer(layer: MinionsTdSpriteLayer): void {
  for (const sprite of layer.towerSprites.values()) {
    sprite.destroy();
  }
  layer.towerSprites.clear();

  for (const sprite of layer.enemySprites.values()) {
    sprite.destroy();
  }
  layer.enemySprites.clear();
}

export function resolveMinionsTdPanelLayout(scene: Phaser.Scene, state: MinionsTdState): MinionsTdPanelLayout {
  const horizontalPadding = 10;
  const topPadding = 70;
  const bottomPadding = 10;
  const gap = 10;
  const width = Math.max(640, scene.scale.width);
  const height = Math.max(360, scene.scale.height);
  const panelWidth = Math.floor((width - horizontalPadding * 2 - gap) / 2);
  const panelHeight = Math.floor((height - topPadding - bottomPadding - gap) / 2);
  const titleHeight = 50;
  const footerHeight = 38;

  const panelRects: MinionsTdPanelRect[] = [];
  for (let index = 0; index < 4; index += 1) {
    const col = index % 2;
    const row = Math.floor(index / 2);
    panelRects.push({
      x: horizontalPadding + col * (panelWidth + gap),
      y: topPadding + row * (panelHeight + gap),
      width: panelWidth,
      height: panelHeight
    });
  }

  const referencePanelWidth = panelRects[0]?.width ?? panelWidth;
  const referencePanelHeight = panelRects[0]?.height ?? panelHeight;
  const mapWidth = referencePanelWidth - 30;
  const mapHeight = referencePanelHeight - titleHeight - footerHeight - 30;
  const cellSize = Math.min(mapWidth / state.map.cols, mapHeight / state.map.rows);

  return {
    panelRects,
    mapRects: panelRects.map((panelRect) => ({
      x: panelRect.x + (panelRect.width - state.map.cols * cellSize) / 2,
      y: panelRect.y + titleHeight,
      width: state.map.cols * cellSize,
      height: state.map.rows * cellSize
    })),
    titleHeight,
    footerHeight,
    cellSize
  };
}

function drawMapGrid(
  graphics: Phaser.GameObjects.Graphics,
  panelRect: MinionsTdPanelRect,
  mapRect: MinionsTdPanelRect,
  map: MinionsTdMapState
): void {
  graphics.lineStyle(1, 0x1f2937, 0.65);
  for (let col = 0; col <= map.cols; col += 1) {
    const x = mapRect.x + col * (mapRect.width / map.cols);
    graphics.lineBetween(x, mapRect.y, x, mapRect.y + mapRect.height);
  }
  for (let row = 0; row <= map.rows; row += 1) {
    const y = mapRect.y + row * (mapRect.height / map.rows);
    graphics.lineBetween(mapRect.x, y, mapRect.x + mapRect.width, y);
  }

  graphics.lineStyle(2, 0x94a3b8, 0.25);
  graphics.strokeRoundedRect(panelRect.x + 1, panelRect.y + 1, panelRect.width - 2, panelRect.height - 2, 18);
}

function drawPanelBackdrop(
  graphics: Phaser.GameObjects.Graphics,
  panelRect: MinionsTdPanelRect,
  mapRect: MinionsTdPanelRect,
  player: MinionsTdPlayerBoardState | null
): void {
  graphics.fillStyle(0x0f172a, player?.alive ? 0.92 : 0.68);
  graphics.fillRoundedRect(panelRect.x, panelRect.y, panelRect.width, panelRect.height, 18);
  graphics.lineStyle(2, player ? toColor(player.color) : 0x334155, 0.9);
  graphics.strokeRoundedRect(panelRect.x, panelRect.y, panelRect.width, panelRect.height, 18);
  graphics.fillStyle(0x020617, 0.65);
  graphics.fillRoundedRect(mapRect.x, mapRect.y, mapRect.width, mapRect.height, 10);
}

function drawPathCells(
  graphics: Phaser.GameObjects.Graphics,
  mapRect: MinionsTdPanelRect,
  map: MinionsTdMapState
): number {
  for (const cell of map.pathCells) {
    const cellRect = resolveMapCellRect(mapRect, map, cell.col, cell.row);
    graphics.fillStyle(0x082f49, 0.98);
    graphics.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height);
    graphics.fillStyle(0x7dd3fc, 0.18);
    graphics.fillRoundedRect(cellRect.x + cellRect.width * 0.125, cellRect.y + cellRect.height * 0.22, cellRect.width * 0.75, cellRect.height * 0.56, Math.min(cellRect.width, cellRect.height) * 0.1);
    graphics.lineStyle(1, 0x7dd3fc, 0.24);
    graphics.strokeRoundedRect(cellRect.x + cellRect.width * 0.11, cellRect.y + cellRect.height * 0.2, cellRect.width * 0.78, cellRect.height * 0.6, Math.min(cellRect.width, cellRect.height) * 0.1);
  }

  return map.pathCells.length;
}

function drawBuildSlots(
  graphics: Phaser.GameObjects.Graphics,
  mapRect: MinionsTdPanelRect,
  map: MinionsTdMapState
): number {
  for (const slot of map.buildSlots) {
    const cellRect = resolveMapCellRect(mapRect, map, slot.col, slot.row);
    const cornerRadius = Math.min(cellRect.width, cellRect.height) * 0.12;
    graphics.fillStyle(0x0f172a, 0.3);
    graphics.fillRoundedRect(cellRect.x + cellRect.width * 0.06, cellRect.y + cellRect.height * 0.06, cellRect.width * 0.88, cellRect.height * 0.88, cornerRadius);
    graphics.lineStyle(2, 0x38bdf8, 0.88);
    graphics.strokeRoundedRect(cellRect.x + cellRect.width * 0.045, cellRect.y + cellRect.height * 0.045, cellRect.width * 0.91, cellRect.height * 0.91, cornerRadius);
    graphics.lineStyle(1, 0x7dd3fc, 0.18);
    graphics.strokeRoundedRect(cellRect.x + cellRect.width * 0.14, cellRect.y + cellRect.height * 0.14, cellRect.width * 0.72, cellRect.height * 0.72, cornerRadius * 0.8);
  }

  return map.buildSlots.length;
}

function drawTower(
  scene: Phaser.Scene,
  graphics: Phaser.GameObjects.Graphics,
  mapRect: MinionsTdPanelRect,
  map: MinionsTdMapState,
  tower: MinionsTdPlayerBoardState["towers"][number]
): void {
  if (scene.textures.exists(resolveMinionsTdTowerSpriteKey(tower.towerTypeId))) {
    return;
  }

  const slot = resolveBuildSlotById(map, tower.slotId);
  if (!slot) {
    return;
  }

  const cellRect = resolveMapCellRect(mapRect, map, slot.col, slot.row);
  const centerX = cellRect.x + cellRect.width / 2;
  const centerY = cellRect.y + cellRect.height / 2;
  const radius = Math.min(cellRect.width, cellRect.height) * 0.28;

  graphics.fillStyle(toColor(tower.color), 0.96);
  graphics.fillCircle(centerX, centerY, radius);
  graphics.lineStyle(2, 0xe2e8f0, 0.9);
  graphics.strokeCircle(centerX, centerY, radius + 2);
  graphics.fillStyle(0x020617, 0.7);
  graphics.fillCircle(centerX + radius * 0.25, centerY - radius * 0.18, radius * 0.22);
}

function drawEnemy(
  scene: Phaser.Scene,
  graphics: Phaser.GameObjects.Graphics,
  mapRect: MinionsTdPanelRect,
  map: MinionsTdMapState,
  enemy: MinionsTdPlayerBoardState["enemies"][number]
): void {
  if (scene.textures.exists(resolveMinionsTdEnemySpriteKey(enemy.enemyTypeId))) {
    return;
  }

  if (enemy.x === 0 && enemy.y === 0 && map.pathCells.length === 0) {
    return;
  }

  const cellWidth = mapRect.width / map.cols;
  const cellHeight = mapRect.height / map.rows;
  const x = mapRect.x + enemy.x * cellWidth;
  const y = mapRect.y + enemy.y * cellHeight;
  const radius = Math.min(cellWidth, cellHeight) * 0.22;

  graphics.fillStyle(toColor(enemy.color), 0.94);
  graphics.fillCircle(x, y, radius);
  graphics.lineStyle(2, 0x0f172a, 0.9);
  graphics.strokeCircle(x, y, radius + 1);
  graphics.lineStyle(2, 0xf8fafc, 0.22);
  graphics.strokeCircle(x, y, radius + 5);
}

function drawEnemyHealthBar(
  graphics: Phaser.GameObjects.Graphics,
  mapRect: MinionsTdPanelRect,
  map: MinionsTdMapState,
  enemy: MinionsTdPlayerBoardState["enemies"][number],
  alpha: number
): void {
  if (enemy.maxHp <= 0) {
    return;
  }

  if (enemy.x === 0 && enemy.y === 0 && map.pathCells.length === 0) {
    return;
  }

  const cellWidth = mapRect.width / map.cols;
  const cellHeight = mapRect.height / map.rows;
  const x = mapRect.x + enemy.x * cellWidth;
  const y = mapRect.y + enemy.y * cellHeight;
  const displaySize = Math.min(cellWidth, cellHeight) * 0.84;
  const barWidth = Math.max(12, displaySize * 0.84);
  const barHeight = Math.max(3, displaySize * 0.14);
  const healthRatio = clamp(enemy.hp / enemy.maxHp, 0, 1);
  const barX = clamp(x - barWidth / 2, mapRect.x + 2, mapRect.x + mapRect.width - barWidth - 2);
  const barY = clamp(y - displaySize * 0.72, mapRect.y + 2, mapRect.y + mapRect.height - barHeight - 2);
  const fillColor = healthRatio > 0.5 ? 0x22c55e : healthRatio > 0.25 ? 0xf59e0b : 0xef4444;

  graphics.fillStyle(0x020617, 0.82 * alpha);
  graphics.fillRoundedRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2, 3);
  graphics.fillStyle(0x0f172a, 0.92 * alpha);
  graphics.fillRoundedRect(barX, barY, barWidth, barHeight, 2);

  if (healthRatio > 0) {
    graphics.fillStyle(fillColor, 0.96 * alpha);
    graphics.fillRoundedRect(barX, barY, Math.max(barHeight, barWidth * healthRatio), barHeight, 2);
  }
}

function drawProjectileImpact(
  graphics: Phaser.GameObjects.Graphics,
  projectile: MinionsTdPlayerBoardState["projectiles"][number],
  targetX: number,
  targetY: number,
  cellSize: number,
  progress: number
): void {
  if (!projectile.splashRadius || progress < 0.72) {
    return;
  }

  const impactProgress = clamp((progress - 0.72) / 0.28, 0, 1);
  const radius = Math.max(4, projectile.splashRadius * cellSize * (0.82 + impactProgress * 0.18));
  const color = toColor(projectile.color);

  graphics.fillStyle(color, 0.08 + (1 - impactProgress) * 0.08);
  graphics.fillCircle(targetX, targetY, radius);
  graphics.lineStyle(2, color, 0.34 + (1 - impactProgress) * 0.22);
  graphics.strokeCircle(targetX, targetY, radius);
}

function drawBeamProjectile(
  graphics: Phaser.GameObjects.Graphics,
  projectile: MinionsTdPlayerBoardState["projectiles"][number],
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  radius: number,
  alpha: number
): void {
  const color = toColor(projectile.color);
  const width = projectile.style === "heavy_beam" ? Math.max(4, radius * 1.9) : Math.max(1.2, radius * 0.62);

  graphics.lineStyle(width, color, alpha * (projectile.style === "heavy_beam" ? 0.82 : 0.68));
  graphics.lineBetween(startX, startY, targetX, targetY);
  graphics.lineStyle(Math.max(1, width * 0.38), 0xf8fafc, alpha * 0.72);
  graphics.lineBetween(startX, startY, targetX, targetY);
  graphics.fillStyle(color, alpha);
  graphics.fillCircle(targetX, targetY, projectile.style === "heavy_beam" ? radius * 1.25 : radius * 0.95);
}

function drawArcProjectile(
  graphics: Phaser.GameObjects.Graphics,
  projectile: MinionsTdPlayerBoardState["projectiles"][number],
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  radius: number,
  alpha: number
): void {
  const color = toColor(projectile.color);
  const dx = targetX - startX;
  const dy = targetY - startY;
  const length = Math.max(1, Math.hypot(dx, dy));
  const unitX = dx / length;
  const unitY = dy / length;
  const perpX = -unitY;
  const perpY = unitX;
  const amplitude = Math.max(4, radius * 2.4);
  const segments = 6;
  let previousX = startX;
  let previousY = startY;

  graphics.lineStyle(Math.max(1.5, radius * 0.72), color, alpha * 0.82);

  for (let index = 1; index <= segments; index += 1) {
    const progress = index / segments;
    const baseX = startX + dx * progress;
    const baseY = startY + dy * progress;
    const offsetMagnitude = index === segments ? 0 : (index % 2 === 0 ? -amplitude : amplitude);
    const nextX = baseX + perpX * offsetMagnitude;
    const nextY = baseY + perpY * offsetMagnitude;

    graphics.lineBetween(previousX, previousY, nextX, nextY);
    previousX = nextX;
    previousY = nextY;
  }

  graphics.lineStyle(Math.max(1, radius * 0.32), 0xf8fafc, alpha * 0.94);
  graphics.lineBetween(startX, startY, targetX, targetY);
  graphics.fillStyle(color, alpha * 0.92);
  graphics.fillCircle(targetX, targetY, Math.max(2, radius * 1.05));
}

function drawBulletProjectile(
  graphics: Phaser.GameObjects.Graphics,
  projectile: MinionsTdPlayerBoardState["projectiles"][number],
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  radius: number,
  progress: number,
  alpha: number
): void {
  const currentX = Phaser.Math.Linear(startX, targetX, progress);
  const currentY = Phaser.Math.Linear(startY, targetY, progress);
  const previousProgress = Math.max(0, progress - 0.18);
  const tailX = Phaser.Math.Linear(startX, targetX, previousProgress);
  const tailY = Phaser.Math.Linear(startY, targetY, previousProgress);
  const color = toColor(projectile.color);

  graphics.lineStyle(Math.max(1.4, radius * 0.95), color, alpha * 0.68);
  graphics.lineBetween(tailX, tailY, currentX, currentY);
  graphics.fillStyle(color, alpha);
  graphics.fillCircle(currentX, currentY, radius);
  graphics.fillStyle(0xf8fafc, alpha * 0.82);
  graphics.fillCircle(currentX, currentY, Math.max(1.5, radius * 0.42));
}

function drawRocketProjectile(
  graphics: Phaser.GameObjects.Graphics,
  projectile: MinionsTdPlayerBoardState["projectiles"][number],
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  radius: number,
  progress: number,
  alpha: number
): void {
  const currentX = Phaser.Math.Linear(startX, targetX, progress);
  const currentY = Phaser.Math.Linear(startY, targetY, progress);
  const tailProgress = Math.max(0, progress - 0.16);
  const tailX = Phaser.Math.Linear(startX, targetX, tailProgress);
  const tailY = Phaser.Math.Linear(startY, targetY, tailProgress);
  const dx = targetX - startX;
  const dy = targetY - startY;
  const length = Math.max(1, Math.hypot(dx, dy));
  const unitX = dx / length;
  const unitY = dy / length;
  const perpX = -unitY;
  const perpY = unitX;
  const bodySize = Math.max(5, radius * 1.9);
  const noseX = currentX + unitX * bodySize;
  const noseY = currentY + unitY * bodySize;
  const rearX = currentX - unitX * bodySize * 0.8;
  const rearY = currentY - unitY * bodySize * 0.8;
  const leftX = rearX + perpX * bodySize * 0.55;
  const leftY = rearY + perpY * bodySize * 0.55;
  const rightX = rearX - perpX * bodySize * 0.55;
  const rightY = rearY - perpY * bodySize * 0.55;
  const color = toColor(projectile.color);

  graphics.lineStyle(Math.max(2, radius * 0.85), color, alpha * 0.42);
  graphics.lineBetween(tailX, tailY, rearX, rearY);
  graphics.fillStyle(0xf59e0b, alpha * 0.62);
  graphics.fillCircle(tailX, tailY, Math.max(2, radius * 0.72));
  graphics.fillStyle(color, alpha);
  graphics.fillTriangle(noseX, noseY, leftX, leftY, rightX, rightY);
  graphics.lineStyle(1.4, 0xf8fafc, alpha * 0.76);
  graphics.strokeTriangle(noseX, noseY, leftX, leftY, rightX, rightY);
}

function drawProjectiles(
  graphics: Phaser.GameObjects.Graphics,
  mapRect: MinionsTdPanelRect,
  map: MinionsTdMapState,
  projectiles: MinionsTdPlayerBoardState["projectiles"]
): void {
  if (projectiles.length === 0) {
    return;
  }

  const cellWidth = mapRect.width / map.cols;
  const cellHeight = mapRect.height / map.rows;

  for (const projectile of projectiles) {
    const fade = clamp(projectile.remainingMs / Math.max(1, projectile.maxLifetimeMs), 0, 1);
    const alpha = Math.max(0.18, fade);
    const progress = 1 - fade;
    const startX = mapRect.x + projectile.x * cellWidth;
    const startY = mapRect.y + projectile.y * cellHeight;
    const targetX = mapRect.x + projectile.targetX * cellWidth;
    const targetY = mapRect.y + projectile.targetY * cellHeight;
    const radius = Math.max(2, Math.min(cellWidth, cellHeight) * projectile.radius);
    const cellSize = Math.min(cellWidth, cellHeight);

    if (projectile.style === "bullet") {
      drawBulletProjectile(graphics, projectile, startX, startY, targetX, targetY, radius, progress, alpha);
    } else if (projectile.style === "rocket") {
      drawRocketProjectile(graphics, projectile, startX, startY, targetX, targetY, radius, progress, alpha);
    } else if (projectile.style === "arc") {
      drawArcProjectile(graphics, projectile, startX, startY, targetX, targetY, radius, alpha);
    } else {
      drawBeamProjectile(graphics, projectile, startX, startY, targetX, targetY, radius, alpha);
    }

    drawProjectileImpact(graphics, projectile, targetX, targetY, cellSize, progress);
  }
}

export function syncMinionsTdStaticLayer(
  scene: Phaser.Scene,
  layer: MinionsTdStaticLayer,
  state: MinionsTdState
): { layout: MinionsTdPanelLayout; metrics: MinionsTdStaticLayerMetrics } {
  const layoutStart = performance.now();
  const layout = resolveMinionsTdPanelLayout(scene, state);
  const layoutMs = performance.now() - layoutStart;
  let vectorRasterMs = 0;
  let tileStampMs = 0;
  let pathStampCount = 0;
  let buildSlotStampCount = 0;
  let staticTexturePixels = 0;
  let gridLineCount = 0;
  const panelLocalRect = { x: 0, y: 0, width: 0, height: 0 };

  for (let index = 0; index < 4; index += 1) {
    const player = state.players[index] ?? null;
    const panelRect = layout.panelRects[index];
    const mapRect = layout.mapRects[index];
    const panelImage = layer.panelImages[index];
    const textureKey = layer.textureKeys[index];
    const localMapRect = resolveLocalMapRect(panelRect, mapRect);

    panelImage.setVisible(true);
    panelImage.setPosition(panelRect.x, panelRect.y);
    panelImage.setDepth(0);
    layer.scratchGraphics.clear();

    panelLocalRect.x = 0;
    panelLocalRect.y = 0;
    panelLocalRect.width = panelRect.width;
    panelLocalRect.height = panelRect.height;

    const vectorStart = performance.now();
    drawPanelBackdrop(layer.scratchGraphics, panelLocalRect, localMapRect, player);
    drawMapGrid(layer.scratchGraphics, panelLocalRect, localMapRect, state.map);
    vectorRasterMs += performance.now() - vectorStart;

    const stampStart = performance.now();
    pathStampCount += drawPathCells(layer.scratchGraphics, localMapRect, state.map);
    buildSlotStampCount += drawBuildSlots(layer.scratchGraphics, localMapRect, state.map);
    if (scene.textures.exists(textureKey)) {
      scene.textures.remove(textureKey);
    }
    layer.scratchGraphics.generateTexture(textureKey, Math.max(2, Math.ceil(panelRect.width)), Math.max(2, Math.ceil(panelRect.height)));
    panelImage.setTexture(textureKey);
    panelImage.setDisplaySize(panelRect.width, panelRect.height);
    tileStampMs += performance.now() - stampStart;

    staticTexturePixels += panelRect.width * panelRect.height;
    gridLineCount += state.map.cols + 1 + state.map.rows + 1;
  }

  layer.textureBuildCount += 1;

  return {
    layout,
    metrics: {
      layoutMs,
      vectorRasterMs,
      tileStampMs,
      panelTextureCount: layer.panelImages.length,
      pathStampCount,
      buildSlotStampCount,
      gridLineCount,
      staticTexturePixels,
      cellSizePx: layout.cellSize,
      textureBuildCount: layer.textureBuildCount
    }
  };
}

export function drawMinionsTdDynamicState(
  graphics: Phaser.GameObjects.Graphics,
  scene: Phaser.Scene,
  state: MinionsTdState,
  layout: MinionsTdPanelLayout
): void {
  graphics.clear();

  for (let index = 0; index < 4; index += 1) {
    const player = state.players[index] ?? null;
    const mapRect = layout.mapRects[index];

    if (!player || !mapRect) {
      continue;
    }

    drawProjectiles(graphics, mapRect, state.map, player.projectiles);

    for (const tower of player.towers) {
      drawTower(scene, graphics, mapRect, state.map, tower);
    }

    for (const enemy of player.enemies) {
      drawEnemy(scene, graphics, mapRect, state.map, enemy);
    }
  }
}

export function drawMinionsTdEnemyHealthBars(
  graphics: Phaser.GameObjects.Graphics,
  state: MinionsTdState,
  layout: MinionsTdPanelLayout
): void {
  graphics.clear();

  for (let index = 0; index < 4; index += 1) {
    const player = state.players[index] ?? null;
    const mapRect = layout.mapRects[index];

    if (!player || !mapRect) {
      continue;
    }

    const alpha = player.alive ? 1 : 0.55;

    for (const enemy of player.enemies) {
      drawEnemyHealthBar(graphics, mapRect, state.map, enemy, alpha);
    }
  }
}

export function syncMinionsTdSpriteLayer(
  scene: Phaser.Scene,
  layer: MinionsTdSpriteLayer,
  state: MinionsTdState,
  layout: MinionsTdPanelLayout
): void {
  const activeTowerKeys = new Set<string>();
  const activeEnemyKeys = new Set<string>();

  for (let playerIndex = 0; playerIndex < state.players.length; playerIndex += 1) {
    const player = state.players[playerIndex];
    const mapRect = layout.mapRects[playerIndex];

    if (!player || !mapRect) {
      continue;
    }

    for (const tower of player.towers) {
      const towerKey = `${player.playerId}:${tower.id}`;
      const spriteKey = resolveMinionsTdTowerSpriteKey(tower.towerTypeId);
      const slot = resolveBuildSlotById(state.map, tower.slotId);
      const cellRect = slot ? resolveMapCellRect(mapRect, state.map, slot.col, slot.row) : null;

      if (!slot || !cellRect || !scene.textures.exists(spriteKey)) {
        const existingSprite = layer.towerSprites.get(towerKey);

        if (existingSprite) {
          existingSprite.destroy();
          layer.towerSprites.delete(towerKey);
        }
        continue;
      }

      let towerSprite = layer.towerSprites.get(towerKey);

      if (!towerSprite) {
        towerSprite = scene.add.image(0, 0, spriteKey);
        towerSprite.setDepth(4);
        towerSprite.setOrigin(0.5);
        layer.towerSprites.set(towerKey, towerSprite);
      } else if (towerSprite.texture.key !== spriteKey) {
        towerSprite.setTexture(spriteKey);
      }

      towerSprite.setVisible(true);
      towerSprite.setPosition(cellRect.x + cellRect.width / 2, cellRect.y + cellRect.height / 2);
      const displaySize = Math.min(cellRect.width, cellRect.height) * 1.02;
      towerSprite.setDisplaySize(displaySize, displaySize);
      towerSprite.setAlpha(player.alive ? 0.98 : 0.45);
      activeTowerKeys.add(towerKey);
    }

    for (const enemy of player.enemies) {
      const enemyKey = `${player.playerId}:${enemy.id}`;
      const spriteKey = resolveMinionsTdEnemySpriteKey(enemy.enemyTypeId);

      if (!scene.textures.exists(spriteKey)) {
        const existingSprite = layer.enemySprites.get(enemyKey);

        if (existingSprite) {
          existingSprite.destroy();
          layer.enemySprites.delete(enemyKey);
        }
        continue;
      }

      let enemySprite = layer.enemySprites.get(enemyKey);

      if (!enemySprite) {
        enemySprite = scene.add.image(0, 0, spriteKey);
        enemySprite.setDepth(5);
        enemySprite.setOrigin(0.5);
        layer.enemySprites.set(enemyKey, enemySprite);
      } else if (enemySprite.texture.key !== spriteKey) {
        enemySprite.setTexture(spriteKey);
      }

      const position = resolveMapPoint(mapRect, state.map, enemy.x, enemy.y);
      const displaySize = Math.min(mapRect.width / state.map.cols, mapRect.height / state.map.rows) * 0.84;
      enemySprite.setVisible(true);
      enemySprite.setPosition(position.x, position.y);
      enemySprite.setDisplaySize(displaySize, displaySize);
      enemySprite.setAlpha(player.alive ? 0.96 : 0.48);
      activeEnemyKeys.add(enemyKey);
    }
  }

  for (const [towerKey, towerSprite] of layer.towerSprites) {
    if (!activeTowerKeys.has(towerKey)) {
      towerSprite.destroy();
      layer.towerSprites.delete(towerKey);
    }
  }

  for (const [enemyKey, enemySprite] of layer.enemySprites) {
    if (!activeEnemyKeys.has(enemyKey)) {
      enemySprite.destroy();
      layer.enemySprites.delete(enemyKey);
    }
  }
}

export function buildMinionsTdPanelHeader(player: MinionsTdPlayerBoardState | null, index: number, language?: SupportedLanguage): string {
  const en = language === "en";
  if (!player) {
    return `Slot ${index + 1}\n${en ? "Waiting for player" : "Wartet auf Spieler"}`;
  }

  const target = player.outgoingToPlayerName ?? (en ? "nobody" : "niemand");
  return `${player.name}\n${en ? "Lives" : "Leben"} ${player.lives} | -> ${target}`;
}

export function buildMinionsTdPanelFooter(player: MinionsTdPlayerBoardState | null, language?: SupportedLanguage): string {
  const en = language === "en";
  if (!player) {
    return en ? "No active player" : "Kein Spieler aktiv";
  }

  const status = player.alive ? (en ? "active" : "aktiv") : en ? "defeated" : "besiegt";
  return `Tower ${player.towers.length} | Minions ${player.enemies.length} | Kills ${player.kills} | ${status}`;
}
