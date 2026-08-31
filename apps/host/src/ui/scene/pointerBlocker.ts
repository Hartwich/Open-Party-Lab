import Phaser from "phaser";

/**
 * Stops pointer events from reaching whatever is drawn underneath.
 *
 * Phaser hit-tests interactive objects in reverse display-list order, and plain
 * rectangles are not interactive at all. Without a blocker, a click on the
 * empty part of a panel travels straight through to the game-card click zones
 * behind it — which is how clicking blank space in the setup area used to
 * select a different game.
 *
 * Call this *after* drawing a panel's contents so the blocker sits below the
 * panel's own buttons but above everything drawn earlier.
 */
export function blockPointerInput(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number
): Phaser.GameObjects.Zone {
  const blocker = scene.add.zone(x, y, Math.max(0, width), Math.max(0, height)).setOrigin(0);

  blocker.setInteractive();
  blocker.on(
    "pointerdown",
    (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event?: Phaser.Types.Input.EventData
    ) => {
      event?.stopPropagation();
    }
  );
  blocker.on(
    "pointerup",
    (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event?: Phaser.Types.Input.EventData
    ) => {
      event?.stopPropagation();
    }
  );

  return blocker;
}

/**
 * Draws a panel body and seals it in one step.
 *
 * `draw` receives the scene and must render the panel contents; the blocker is
 * inserted first so anything interactive created inside `draw` still wins.
 */
export function withPointerBlocker(
  scene: Phaser.Scene,
  bounds: { x: number; y: number; width: number; height: number },
  draw: () => void
): void {
  blockPointerInput(scene, bounds.x, bounds.y, bounds.width, bounds.height);
  draw();
}
