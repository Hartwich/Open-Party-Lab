import Phaser from "phaser";
import { sceneColor } from "../theme/sceneColors.js";

const BOTTOM_PADDING = 28;

export function clampScroll(value: number, maxScroll: number): number {
  return Math.min(Math.max(value, 0), maxScroll);
}

export function measureMaxScroll(
  scene: Phaser.Scene,
  contentBottom: number,
  bottomPadding = BOTTOM_PADDING
): number {
  return Math.max(0, Math.ceil(contentBottom + bottomPadding - scene.scale.height));
}

export function renderScrollBar(scene: Phaser.Scene, scrollY: number, maxScroll: number): void {
  if (maxScroll <= 0) {
    return;
  }

  const trackHeight = Math.max(120, scene.scale.height - 96);
  const trackX = scene.scale.width - 18;
  const trackY = 48;
  const thumbHeight = Math.max(
    42,
    Math.floor((trackHeight * scene.scale.height) / (scene.scale.height + maxScroll))
  );
  const thumbTravel = Math.max(1, trackHeight - thumbHeight);
  const thumbY = trackY + Math.round((scrollY / maxScroll) * thumbTravel);
  const graphics = scene.add.graphics();

  graphics.fillStyle(sceneColor.line, 0.9);
  graphics.fillRoundedRect(trackX, trackY, 6, trackHeight, 4);
  graphics.fillStyle(sceneColor.accent, 0.85);
  graphics.fillRoundedRect(trackX, thumbY, 6, thumbHeight, 4);
}
