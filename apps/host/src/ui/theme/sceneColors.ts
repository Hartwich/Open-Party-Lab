import { partyTheme, toColorNumber } from "@open-party-lab/ui-kit";

/**
 * Numeric colour tokens for Phaser draw calls.
 *
 * Phaser wants `0xrrggbb` numbers while the DOM chrome wants strings, so the
 * conversion happens once here instead of at every call site. Mutated in place
 * on a theme switch for the same reason `hostTheme` is: scenes hold a reference
 * from import time.
 */
export const sceneColor = {
  background: 0,
  backgroundDeep: 0,
  panel: 0,
  panelMuted: 0,
  line: 0,
  lineStrong: 0,
  ink: 0,
  muted: 0,
  accent: 0,
  accentStrong: 0,
  accentSoft: 0,
  success: 0,
  successSoft: 0,
  warning: 0,
  warningSoft: 0,
  danger: 0,
  dangerSoft: 0,
  white: 0xffffff
};

/** Re-reads every numeric token from the active theme. */
export function refreshSceneColors(): void {
  sceneColor.background = toColorNumber(partyTheme.color.background);
  sceneColor.backgroundDeep = toColorNumber(partyTheme.color.backgroundDeep);
  sceneColor.panel = toColorNumber(partyTheme.color.surface);
  sceneColor.panelMuted = toColorNumber(partyTheme.color.surfaceMuted);
  sceneColor.line = toColorNumber(partyTheme.color.line);
  sceneColor.lineStrong = toColorNumber(partyTheme.color.lineStrong);
  sceneColor.ink = toColorNumber(partyTheme.color.text);
  sceneColor.muted = toColorNumber(partyTheme.color.muted);
  sceneColor.accent = toColorNumber(partyTheme.color.accent);
  sceneColor.accentStrong = toColorNumber(partyTheme.color.accentStrong);
  sceneColor.accentSoft = toColorNumber(partyTheme.color.accentSoft);
  sceneColor.success = toColorNumber(partyTheme.color.success);
  sceneColor.successSoft = toColorNumber(partyTheme.color.successSoft);
  sceneColor.warning = toColorNumber(partyTheme.color.warning);
  sceneColor.warningSoft = toColorNumber(partyTheme.color.warningSoft);
  sceneColor.danger = toColorNumber(partyTheme.color.danger);
  sceneColor.dangerSoft = toColorNumber(partyTheme.color.dangerSoft);
}

refreshSceneColors();

/** Opacity presets so panels stay consistent across scenes. */
export const sceneAlpha = {
  panel: 0.96,
  panelSoft: 0.88,
  hairline: 0.9,
  shadow: 0.1,
  tint: 0.18
} as const;
