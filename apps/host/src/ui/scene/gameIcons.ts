import Phaser from "phaser";

/**
 * Generic catalog icon.
 *
 * The platform used to hand-draw a bespoke icon for every game, which meant a
 * new game could not get an icon without a platform change. Games now ship an
 * SVG and point at it from their manifest (`visual.iconPath`); this abstract
 * mark is what a game without one gets.
 */
export function drawStar(
  graphics: Phaser.GameObjects.Graphics,
  centerX: number,
  centerY: number,
  outerRadius: number,
  innerRadius: number,
  points: number
): void {
  graphics.beginPath();

  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + (Math.PI * index) / points;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    if (index === 0) {
      graphics.moveTo(x, y);
    } else {
      graphics.lineTo(x, y);
    }
  }

  graphics.closePath();
}

/** Draws the fallback mark into `graphics`, sized to `size`. */
export function drawGameIcon(
  graphics: Phaser.GameObjects.Graphics,
  size: number,
  accent: number,
  accentSoft: number
): void {
  const lineWidth = Math.max(2, size * 0.065);
  const center = size / 2;

  graphics.clear();
  graphics.fillStyle(accentSoft, 0.96);
  graphics.lineStyle(lineWidth, accent, 1);
  graphics.strokeCircle(center, center, size * 0.32);
  drawStar(graphics, center, center, size * 0.18, size * 0.09, 4);
  graphics.fillPath();
  graphics.strokePath();
}
