import Phaser from "phaser";

/**
 * Clears a scene before a full rebuild.
 *
 * `children.removeAll(true)` destroys the display list but leaves the tween
 * manager untouched. The selected game card starts an infinite pulse tween, so
 * every re-render used to leak one more tween animating an already-destroyed
 * object — they accumulated for as long as the lobby stayed open. Killing the
 * tweens first keeps the rebuild genuinely idempotent.
 */
export function resetSceneDisplay(scene: Phaser.Scene): void {
  scene.tweens.killAll();
  scene.children.removeAll(true);
}
