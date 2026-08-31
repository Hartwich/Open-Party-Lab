import Phaser from "phaser";

export interface SceneRenderSchedulerOptions {
  /**
   * Cheap fingerprint of everything the scene actually draws. When it is
   * unchanged the render is skipped entirely.
   */
  signature: () => string;
  /** Performs the full rebuild. */
  render: () => void;
}

export interface SceneRenderScheduler {
  /** Requests a render if the signature changed. Coalesced to one per frame. */
  request(): void;
  /** Requests a render regardless of the signature (resize, scroll, …). */
  requestForced(): void;
  /** Renders immediately, bypassing both the guard and the frame coalescing. */
  flush(): void;
  /** Drops any pending frame callback. */
  destroy(): void;
}

/**
 * Guards scene rebuilds.
 *
 * Host scenes redraw by wiping the display list and building it again. That is
 * simple and predictable, but it used to happen on *every* state notification —
 * including scoreboard and game-state updates that the lobby does not render at
 * all — and once more for every wheel event and resize tick.
 *
 * This scheduler solves both halves: a signature comparison drops renders that
 * would produce identical output, and everything else is coalesced into a
 * single callback per animation frame.
 */
export function createSceneRenderScheduler(
  scene: Phaser.Scene,
  { signature, render }: SceneRenderSchedulerOptions
): SceneRenderScheduler {
  let lastSignature: string | null = null;
  let frameHandle: number | null = null;
  let forced = false;
  let destroyed = false;

  const runRender = (): void => {
    if (destroyed) {
      return;
    }

    lastSignature = signature();
    forced = false;
    render();
  };

  const cancelFrame = (): void => {
    if (frameHandle === null) {
      return;
    }

    if (typeof window !== "undefined" && typeof window.cancelAnimationFrame === "function") {
      window.cancelAnimationFrame(frameHandle);
    } else {
      clearTimeout(frameHandle);
    }

    frameHandle = null;
  };

  const scheduleFrame = (): void => {
    if (frameHandle !== null || destroyed) {
      return;
    }

    const flushFrame = (): void => {
      frameHandle = null;

      if (destroyed) {
        return;
      }

      if (!forced && signature() === lastSignature) {
        return;
      }

      runRender();
    };

    frameHandle =
      typeof window !== "undefined" && typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame(flushFrame)
        : (setTimeout(flushFrame, 16) as unknown as number);
  };

  const scheduler: SceneRenderScheduler = {
    request() {
      if (!forced && signature() === lastSignature) {
        return;
      }

      scheduleFrame();
    },
    requestForced() {
      forced = true;
      scheduleFrame();
    },
    flush() {
      cancelFrame();
      runRender();
    },
    destroy() {
      destroyed = true;
      cancelFrame();
    }
  };

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scheduler.destroy());
  scene.events.once(Phaser.Scenes.Events.DESTROY, () => scheduler.destroy());

  return scheduler;
}
