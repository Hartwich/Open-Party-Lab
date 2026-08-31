import Phaser from "phaser";
import { hostTheme } from "../theme/theme.js";
import { sceneColor } from "../theme/sceneColors.js";

/**
 * Warm paper backdrop for the lobby and game-select scenes.
 *
 * Deliberately cheap. The previous version drew a fine grid across the whole
 * canvas on every re-render; the grid is now four times coarser and the soft
 * blobs replaced additive glows, so the whole backdrop is a handful of fills.
 */
export function drawArcadeBackdrop(scene: Phaser.Scene): void {
  const width = scene.scale.width;
  const height = scene.scale.height;

  scene.cameras.main.setBackgroundColor(hostTheme.background);

  const background = scene.add.graphics();
  background.fillStyle(sceneColor.background, 1);
  background.fillRect(0, 0, width, height);

  background.fillStyle(sceneColor.accentSoft, 0.5);
  background.fillCircle(width * 0.14, height * 0.16, Math.max(width * 0.18, 160));
  background.fillStyle(sceneColor.successSoft, 0.45);
  background.fillCircle(width * 0.9, height * 0.12, Math.max(width * 0.12, 110));
  background.fillStyle(sceneColor.backgroundDeep, 0.75);
  background.fillCircle(width * 0.76, height * 0.86, Math.max(width * 0.26, 240));

  const grid = Math.max(120, Math.floor(width / 9));
  background.lineStyle(1, sceneColor.line, 0.55);

  for (let x = grid; x < width; x += grid) {
    background.lineBetween(x, 0, x, height);
  }

  for (let y = grid; y < height; y += grid) {
    background.lineBetween(0, y, width, y);
  }
}
