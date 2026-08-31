import Phaser from "phaser";

/**
 * Crisp text for the Phaser canvas renderer.
 *
 * Phaser rasterises every `Text` object into its own canvas at CSS-pixel size.
 * On a HiDPI screen that bitmap is then upscaled by the device pixel ratio,
 * which is why scene text looked soft next to the DOM overlays (those are laid
 * out by the browser and always render at native resolution).
 *
 * Setting `resolution` makes Phaser rasterise the glyph canvas at that multiple
 * and draw it back down at the same layout size — same geometry, native
 * sharpness. Every `add.text` call in the host must go through this module.
 */
const MAX_TEXT_RESOLUTION = 3;

let cachedResolution: number | null = null;

/** Device pixel ratio, clamped so a 4x phone does not blow up texture memory. */
export function sceneTextResolution(): number {
  if (cachedResolution !== null) {
    return cachedResolution;
  }

  const ratio = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  cachedResolution = Math.min(Math.max(ratio, 1), MAX_TEXT_RESOLUTION);
  return cachedResolution;
}

/** Re-reads the device pixel ratio, e.g. after the window moved to a new display. */
export function refreshSceneTextResolution(): number {
  cachedResolution = null;
  return sceneTextResolution();
}

/** Adds the sharpness setting to a text style without overriding an explicit one. */
export function sceneTextStyle(
  style: Phaser.Types.GameObjects.Text.TextStyle
): Phaser.Types.GameObjects.Text.TextStyle {
  return { resolution: sceneTextResolution(), ...style };
}

/** Drop-in replacement for `scene.add.text` that always renders at native resolution. */
export function addSceneText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  content: string,
  style: Phaser.Types.GameObjects.Text.TextStyle
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, content, sceneTextStyle(style));
}
