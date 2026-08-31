import {
  defaultThemeName,
  normalizeThemeName,
  themes,
  type ThemeName,
  type ThemeTokens
} from "./themes.js";

export type PartyTheme = ThemeTokens;

/**
 * The theme currently in force.
 *
 * This is deliberately a *mutable* object rather than a fresh one per switch:
 * scenes, overlays and helpers all captured a reference to it at import time,
 * and mutating in place means a theme change reaches every one of them without
 * a single subscription. Callers must therefore never destructure and cache
 * individual values across a possible switch.
 */
export const partyTheme: ThemeTokens = structuredCloneTokens(themes[defaultThemeName]);

let activeThemeName: ThemeName = defaultThemeName;

function structuredCloneTokens(tokens: ThemeTokens): ThemeTokens {
  return {
    color: { ...tokens.color },
    font: { ...tokens.font },
    elevation: { ...tokens.elevation },
    scrim: { ...tokens.scrim }
  };
}

export function getActiveThemeName(): ThemeName {
  return activeThemeName;
}

/**
 * Switches the active theme in place.
 *
 * Returns true when something actually changed, so callers can skip a redraw.
 */
export function setActiveTheme(name: unknown): boolean {
  const next = normalizeThemeName(name);

  if (next === activeThemeName) {
    return false;
  }

  const tokens = themes[next];
  activeThemeName = next;

  Object.assign(partyTheme.color, tokens.color);
  Object.assign(partyTheme.font, tokens.font);
  Object.assign(partyTheme.elevation, tokens.elevation);
  Object.assign(partyTheme.scrim, tokens.scrim);

  return true;
}

export * from "./themes.js";
