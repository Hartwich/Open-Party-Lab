import Phaser from "phaser";
import type { LightTrailsState } from "@open-party-lab/protocol";

function toDisplayColor(color: string): number {
  return Phaser.Display.Color.HexStringToColor(color).color;
}

export interface LightTrailsRenderMeta {
  offsetX: number;
  offsetY: number;
  scale: number;
  arenaWidth: number;
  arenaHeight: number;
  scaledTrailThickness: number;
  glowThickness: number;
}

export function resolveLightTrailsRenderMeta(
  scene: Phaser.Scene,
  state: LightTrailsState
): LightTrailsRenderMeta {
  const padding = 8;
  const availableWidth = Math.max(200, scene.scale.width - padding * 2);
  const availableHeight = Math.max(200, scene.scale.height - padding * 2);
  const scale = Math.min(availableWidth / state.arenaWidth, availableHeight / state.arenaHeight);
  const arenaWidth = state.arenaWidth * scale;
  const arenaHeight = state.arenaHeight * scale;
  const offsetX = (scene.scale.width - arenaWidth) / 2;
  const offsetY = (scene.scale.height - arenaHeight) / 2;
  const scaledTrailThickness = Math.max(2.5, state.trailThickness * scale);
  const glowThickness = scaledTrailThickness + Math.max(3, scaledTrailThickness * 0.9);

  return {
    offsetX,
    offsetY,
    scale,
    arenaWidth,
    arenaHeight,
    scaledTrailThickness,
    glowThickness
  };
}

export function drawLightTrailsArena(
  scene: Phaser.Scene,
  graphics: Phaser.GameObjects.Graphics,
  state: LightTrailsState,
  meta: LightTrailsRenderMeta = resolveLightTrailsRenderMeta(scene, state)
): LightTrailsRenderMeta {
  const gridSpacing = Math.max(28, Math.round(44 * meta.scale));

  graphics.clear();
  graphics.fillStyle(0x020617, 1);
  graphics.fillRect(0, 0, scene.scale.width, scene.scale.height);
  graphics.fillStyle(0x030712, 1);
  graphics.fillRect(meta.offsetX, meta.offsetY, meta.arenaWidth, meta.arenaHeight);
  graphics.lineStyle(4, 0x1e293b, 1);
  graphics.strokeRect(meta.offsetX, meta.offsetY, meta.arenaWidth, meta.arenaHeight);

  graphics.lineStyle(1, 0x0f172a, 0.35);
  for (let x = meta.offsetX + gridSpacing; x < meta.offsetX + meta.arenaWidth; x += gridSpacing) {
    graphics.lineBetween(x, meta.offsetY, x, meta.offsetY + meta.arenaHeight);
  }
  for (let y = meta.offsetY + gridSpacing; y < meta.offsetY + meta.arenaHeight; y += gridSpacing) {
    graphics.lineBetween(meta.offsetX, y, meta.offsetX + meta.arenaWidth, y);
  }

  return meta;
}

export function drawLightTrailsTrailSegmentsToTexture(
  scene: Phaser.Scene,
  texture: Phaser.GameObjects.RenderTexture,
  brush: Phaser.GameObjects.Graphics,
  state: LightTrailsState,
  segmentStartByPlayerId: Map<string, number>,
  meta: LightTrailsRenderMeta = resolveLightTrailsRenderMeta(scene, state)
): void {
  for (const player of Object.values(state.players)) {
    const color = toDisplayColor(player.color);
    const glowAlpha = player.alive ? 0.18 : 0.08;
    const strokeAlpha = player.alive ? 0.95 : 0.4;
    const startIndex = segmentStartByPlayerId.get(player.playerId) ?? 0;

    if (startIndex >= player.trailSegments.length) {
      continue;
    }

    brush.clear();
    brush.lineStyle(meta.glowThickness, color, glowAlpha);

    for (let index = startIndex; index < player.trailSegments.length; index += 1) {
      const segment = player.trailSegments[index];
      brush.lineBetween(
        meta.offsetX + segment.x1 * meta.scale,
        meta.offsetY + segment.y1 * meta.scale,
        meta.offsetX + segment.x2 * meta.scale,
        meta.offsetY + segment.y2 * meta.scale
      );
    }

    brush.lineStyle(meta.scaledTrailThickness, color, strokeAlpha);

    for (let index = startIndex; index < player.trailSegments.length; index += 1) {
      const segment = player.trailSegments[index];
      brush.lineBetween(
        meta.offsetX + segment.x1 * meta.scale,
        meta.offsetY + segment.y1 * meta.scale,
        meta.offsetX + segment.x2 * meta.scale,
        meta.offsetY + segment.y2 * meta.scale
      );
    }

    texture.draw(brush);
  }

  brush.clear();
}

export function drawLightTrailsHeads(
  scene: Phaser.Scene,
  graphics: Phaser.GameObjects.Graphics,
  state: LightTrailsState,
  meta: LightTrailsRenderMeta = resolveLightTrailsRenderMeta(scene, state)
): void {
  graphics.clear();
  for (const player of Object.values(state.players)) {
    const color = toDisplayColor(player.color);

    graphics.fillStyle(color, player.alive ? 0.22 : 0.08);
    graphics.fillCircle(
      meta.offsetX + player.x * meta.scale,
      meta.offsetY + player.y * meta.scale,
      Math.max(8, meta.scaledTrailThickness * 1.8)
    );

    graphics.fillStyle(color, player.alive ? 1 : 0.45);
    graphics.fillCircle(
      meta.offsetX + player.x * meta.scale,
      meta.offsetY + player.y * meta.scale,
      Math.max(4, meta.scaledTrailThickness * 0.66)
    );
  }
}
