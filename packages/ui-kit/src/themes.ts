import { elevation } from "./elevation.js";
import { radius } from "./radius.js";

/**
 * The two skins the platform ships.
 *
 * `light` is the warm paper look; `dark` reproduces the palette the platform
 * had before it — same hues, same shadows — so the games' own artwork, which is
 * still built for a dark stage, reads correctly when it is selected.
 *
 * Both themes expose exactly the same token names. Anything that reads a token
 * therefore works in both without a single conditional.
 */
export type ThemeName = "light" | "dark";

export const themeNames: readonly ThemeName[] = ["light", "dark"];

export const defaultThemeName: ThemeName = "light";

export interface ThemeTokens {
  color: {
    background: string;
    backgroundDeep: string;
    surface: string;
    surfaceMuted: string;
    surfaceRaised: string;
    text: string;
    textSoft: string;
    muted: string;
    line: string;
    lineStrong: string;
    accent: string;
    accentStrong: string;
    accentSoft: string;
    success: string;
    successStrong: string;
    successSoft: string;
    warning: string;
    warningSoft: string;
    danger: string;
    dangerSoft: string;
    onAccent: string;
  };
  font: {
    display: string;
    body: string;
    mono: string;
  };
  elevation: {
    hairline: string;
    card: string;
    panel: string;
    dock: string;
    dockActive: string;
    modal: string;
  };
  /** Translucent variants for chrome floating over live game art. */
  scrim: {
    surface: string;
    surfaceSoft: string;
    backdrop: string;
    line: string;
  };
}

const lightTheme: ThemeTokens = {
  color: {
    background: "#f7f1e7",
    backgroundDeep: "#efe6d8",
    surface: "#fffbf4",
    surfaceMuted: "#f3ece0",
    surfaceRaised: "#fffdf9",
    text: "#24313a",
    textSoft: "#3d4b55",
    muted: "#697178",
    line: "#ded5c7",
    lineStrong: "#c9bda9",
    accent: "#d15f3b",
    accentStrong: "#bd4727",
    accentSoft: "#f6ddd0",
    success: "#6e8b74",
    successStrong: "#587260",
    successSoft: "#dfe9df",
    warning: "#c8873a",
    warningSoft: "#f7e7cd",
    danger: "#a93b31",
    dangerSoft: "#f4dad6",
    onAccent: "#ffffff"
  },
  font: {
    display: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
    body: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace'
  },
  elevation: {
    hairline: elevation.hairline,
    card: elevation.card,
    panel: elevation.panel,
    dock: elevation.dock,
    dockActive: elevation.dockActive,
    modal: elevation.modal
  },
  scrim: {
    surface: "rgba(255, 253, 249, 0.94)",
    surfaceSoft: "rgba(243, 236, 224, 0.9)",
    backdrop: "rgba(36, 49, 58, 0.42)",
    line: "rgba(201, 189, 169, 0.75)"
  }
};

/**
 * The original palette, recovered from the pre-redesign source so that "dark"
 * really is the look the project started from rather than a reinvention.
 */
const darkTheme: ThemeTokens = {
  color: {
    background: "#020617",
    backgroundDeep: "#010309",
    surface: "#0f172a",
    surfaceMuted: "#0b1320",
    surfaceRaised: "#162033",
    text: "#f8fafc",
    textSoft: "#cbd5e1",
    muted: "#94a3b8",
    line: "#1e293b",
    lineStrong: "#334155",
    accent: "#0ea5e9",
    accentStrong: "#0284c7",
    accentSoft: "#082f49",
    success: "#10b981",
    successStrong: "#059669",
    successSoft: "#08362a",
    warning: "#f59e0b",
    warningSoft: "#2b1f0a",
    danger: "#ef4444",
    dangerSoft: "#3f1414",
    onAccent: "#082f49"
  },
  font: {
    display: '"Space Grotesk", sans-serif',
    body: '"Nunito Sans", sans-serif',
    mono: '"IBM Plex Mono", monospace'
  },
  elevation: {
    hairline: "0 1px 2px rgba(2, 6, 23, 0.4)",
    card: "0 16px 36px rgba(2, 6, 23, 0.24)",
    panel: "0 22px 50px rgba(2, 6, 23, 0.34)",
    dock: "0 18px 42px rgba(2, 6, 23, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
    dockActive:
      "0 20px 48px rgba(14, 165, 233, 0.34), 0 0 0 5px rgba(14, 165, 233, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.42)",
    modal: "0 24px 70px rgba(2, 6, 23, 0.5)"
  },
  scrim: {
    surface: "rgba(15, 23, 42, 0.94)",
    surfaceSoft: "rgba(8, 15, 30, 0.72)",
    backdrop: "rgba(2, 6, 23, 0.62)",
    line: "rgba(148, 163, 184, 0.18)"
  }
};

export const themes: Readonly<Record<ThemeName, ThemeTokens>> = {
  light: lightTheme,
  dark: darkTheme
};

/** Coerces unknown input (stored preference, room state) to a valid name. */
export function normalizeThemeName(value: unknown): ThemeName {
  return value === "dark" || value === "light" ? value : defaultThemeName;
}

/**
 * Base colour for hand-built shadows.
 *
 * The `elevation` tokens are complete `box-shadow` strings, which cannot be
 * reused inside `drop-shadow()` or a custom mix. This exposes just the tint:
 * warm brown on paper, near-black on the dark stage.
 */
const shadowColors: Readonly<Record<ThemeName, string>> = {
  light: "rgb(60, 43, 26)",
  dark: "rgb(2, 6, 23)"
};

/** CSS custom properties for a theme, using the puzzle-app naming. */
export function themeCssVariablesFor(name: ThemeName): Readonly<Record<string, string>> {
  const theme = themes[name];

  return {
    "--shadow-color": shadowColors[name],
    "--paper": theme.color.background,
    "--paper-deep": theme.color.backgroundDeep,
    "--surface": theme.color.surface,
    "--surface-muted": theme.color.surfaceMuted,
    "--surface-raised": theme.color.surfaceRaised,
    "--ink": theme.color.text,
    "--ink-soft": theme.color.textSoft,
    "--muted": theme.color.muted,
    "--line": theme.color.line,
    "--line-strong": theme.color.lineStrong,
    "--accent": theme.color.accent,
    "--accent-strong": theme.color.accentStrong,
    "--accent-soft": theme.color.accentSoft,
    "--sage": theme.color.success,
    "--sage-strong": theme.color.successStrong,
    "--sage-soft": theme.color.successSoft,
    "--amber": theme.color.warning,
    "--amber-soft": theme.color.warningSoft,
    "--danger": theme.color.danger,
    "--danger-soft": theme.color.dangerSoft,
    "--on-accent": theme.color.onAccent,
    "--font-display": theme.font.display,
    "--font-body": theme.font.body,
    "--font-mono": theme.font.mono,
    "--radius-sm": `${radius.sm}px`,
    "--radius-md": `${radius.md}px`,
    "--radius-lg": `${radius.lg}px`,
    "--radius-xl": `${radius.xl}px`,
    "--shadow-card": theme.elevation.card,
    "--shadow-panel": theme.elevation.panel,
    "--shadow-modal": theme.elevation.modal,
    // Legacy aliases used across the existing controller components.
    "--page-bg": theme.color.background,
    "--surface-bg": theme.color.surface,
    "--panel-bg": theme.color.surface,
    "--panel-border": theme.color.line,
    "--text-main": theme.color.text,
    "--text-muted": theme.color.muted,
    "--success": theme.color.success,
    "--button-shadow": theme.elevation.card
  };
}

export interface ThemeStyleTarget {
  style: { setProperty(property: string, value: string): void };
}

/** Writes a theme's variables onto an element, typically the document root. */
export function applyThemeVariables(target: ThemeStyleTarget, name: ThemeName): void {
  for (const [property, value] of Object.entries(themeCssVariablesFor(name))) {
    target.style.setProperty(property, value);
  }
}

/** Ready-to-inline `:root { … }` rule for apps that build CSS as a string. */
export function themeRootCss(name: ThemeName, selector = ":root"): string {
  const declarations = Object.entries(themeCssVariablesFor(name))
    .map(([property, value]) => `${property}:${value}`)
    .join(";");

  return `${selector}{${declarations}}`;
}
