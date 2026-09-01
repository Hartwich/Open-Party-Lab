import {
  applyThemeVariables,
  normalizeThemeName,
  partyTheme,
  setActiveTheme,
  type ThemeName
} from "@open-party-lab/ui-kit";

/**
 * Host-facing view of the active theme.
 *
 * Flat strings, because Phaser text styles and inline DOM styles both want
 * them. Like `partyTheme` this object is mutated in place on a theme switch so
 * that every module which imported it keeps seeing current values — do not
 * destructure it into local constants that outlive a switch.
 */
export const hostTheme = {
  background: partyTheme.color.background,
  backgroundDeep: partyTheme.color.backgroundDeep,
  panel: partyTheme.color.surface,
  panelMuted: partyTheme.color.surfaceMuted,
  accent: partyTheme.color.accent,
  accentStrong: partyTheme.color.accentStrong,
  accentSoft: partyTheme.color.accentSoft,
  success: partyTheme.color.success,
  successSoft: partyTheme.color.successSoft,
  warning: partyTheme.color.warning,
  danger: partyTheme.color.danger,
  text: partyTheme.color.text,
  textSoft: partyTheme.color.textSoft,
  muted: partyTheme.color.muted,
  line: partyTheme.color.line,
  lineStrong: partyTheme.color.lineStrong,
  onAccent: partyTheme.color.onAccent,
  titleFont: partyTheme.font.display,
  bodyFont: partyTheme.font.body,
  monoFont: partyTheme.font.mono
};

function syncHostTheme(): void {
  hostTheme.background = partyTheme.color.background;
  hostTheme.backgroundDeep = partyTheme.color.backgroundDeep;
  hostTheme.panel = partyTheme.color.surface;
  hostTheme.panelMuted = partyTheme.color.surfaceMuted;
  hostTheme.accent = partyTheme.color.accent;
  hostTheme.accentStrong = partyTheme.color.accentStrong;
  hostTheme.accentSoft = partyTheme.color.accentSoft;
  hostTheme.success = partyTheme.color.success;
  hostTheme.successSoft = partyTheme.color.successSoft;
  hostTheme.warning = partyTheme.color.warning;
  hostTheme.danger = partyTheme.color.danger;
  hostTheme.text = partyTheme.color.text;
  hostTheme.textSoft = partyTheme.color.textSoft;
  hostTheme.muted = partyTheme.color.muted;
  hostTheme.line = partyTheme.color.line;
  hostTheme.lineStrong = partyTheme.color.lineStrong;
  hostTheme.onAccent = partyTheme.color.onAccent;
  hostTheme.titleFont = partyTheme.font.display;
  hostTheme.bodyFont = partyTheme.font.body;
  hostTheme.monoFont = partyTheme.font.mono;
}

/**
 * Applies a theme across every host-side token set.
 *
 * Returns true when the theme actually changed, so the caller can force a
 * redraw only when it is needed.
 */
export function applyHostTheme(name: ThemeName | string | undefined): boolean {
  const normalized = normalizeThemeName(name);
  const changed = setActiveTheme(normalized);

  if (typeof document !== "undefined") {
    applyThemeVariables(document.documentElement, normalized);
  }

  if (changed) {
    syncHostTheme();
  }

  return changed;
}

export { partyTheme };
