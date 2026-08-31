import type { ThemeName, ThemeTokens } from "@open-party-lab/ui-kit";

/**
 * The theme a game's host scene should paint with.
 *
 * The platform puts the live token object into the Phaser registry under
 * `hostTheme`. Games read it there rather than importing ui-kit, so the
 * platform stays the only place that decides what a theme is.
 *
 * The object is mutated in place when the room switches theme, so a game must
 * read through it at draw time instead of caching individual values.
 */
export const HOST_THEME_REGISTRY_KEY = "hostTheme";

export type GameHostThemeTokens = ThemeTokens;
export type GameHostThemeName = ThemeName;

/** Minimal shape of the Phaser registry, so game-core needs no Phaser types. */
export interface RegistryLike {
  get(key: string): unknown;
}

/**
 * Reads the active theme out of a scene registry.
 *
 * Falls back to the supplied tokens when the platform has not provided one,
 * which keeps a game runnable in isolation (tests, its own dev harness).
 */
export function readHostTheme(
  registry: RegistryLike | undefined,
  fallback: GameHostThemeTokens
): GameHostThemeTokens {
  const tokens = registry?.get(HOST_THEME_REGISTRY_KEY);
  return (tokens as GameHostThemeTokens | undefined) ?? fallback;
}

/** Converts a `#rrggbb` token to the numeric form Phaser draw calls need. */
export function toPhaserColor(value: string): number {
  const normalized = value.trim().replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized.split("").map((char) => `${char}${char}`).join("")
      : normalized;
  const parsed = Number.parseInt(expanded, 16);
  return Number.isNaN(parsed) ? 0x000000 : parsed;
}
