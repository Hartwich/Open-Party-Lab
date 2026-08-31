import Phaser from "phaser";

export interface SceneContentFrame {
  x: number;
  width: number;
}

/** Horizontal band the scene content is allowed to occupy. */
const CONTENT_INSET_LEFT = 40;
const CONTENT_INSET_RIGHT_WIDE = 120;
const CONTENT_INSET_RIGHT_NARROW = 40;
const MIN_CONTENT_WIDTH = 260;

/**
 * Leaves room on the right for the floating host controls dock on wide screens.
 */
export function getSceneContentFrame(scene: Phaser.Scene): SceneContentFrame {
  const rightSafeArea =
    scene.scale.width >= 840 ? CONTENT_INSET_RIGHT_WIDE : CONTENT_INSET_RIGHT_NARROW;

  return {
    x: CONTENT_INSET_LEFT,
    width: Math.max(scene.scale.width - CONTENT_INSET_LEFT - rightSafeArea, MIN_CONTENT_WIDTH)
  };
}

/** Breakpoint helpers, so scenes stop repeating magic numbers. */
export const sceneBreakpoint = {
  /** Below this the lobby stacks its sidebar underneath the content. */
  stackedSidebar: 1_120,
  /** Below this the game select screen stacks hero and info panel. */
  stackedGameSelect: 1_040,
  /** Below this the setup lobby stacks its roster and settings panel. */
  stackedSetupLobby: 1_020,
  /** Below this headers switch to their compact two-line form. */
  narrowHeader: 860
} as const;
