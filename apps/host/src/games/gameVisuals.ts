import { mixColors, palette, toColorNumber } from "@open-party-lab/ui-kit";
import type { AvailableGameDto } from "@open-party-lab/protocol";

export interface GameVisual {
  /** Strong per-game hue used for borders, bars and icons. */
  accent: number;
  /** Tinted fill behind icons and badges. */
  accentSoft: number;
  /** Card background. */
  surface: number;
  /** Card background while hovered. */
  surfaceHover: number;
  /** Readable text colour on top of `accent`. */
  onAccent: string;
  eyebrow: string;
  /** Optional SVG the game ships instead of a platform-drawn icon. */
  iconPath?: string;
}

/**
 * Catalog appearance for a game.
 *
 * The hue comes from the game's manifest; the platform derives the card
 * surfaces from it so every entry keeps the same lightness and the grid reads
 * calmly. The platform no longer holds a table of game ids — a game that
 * declares no visual simply gets the house accent.
 */
const DEFAULT_ACCENT = palette.accent;
const DEFAULT_EYEBROW = "Party";

function buildVisual(accent: string, eyebrow: string, iconPath?: string): GameVisual {
  return {
    accent: toColorNumber(accent),
    // A light tint of the hue — used as the icon plate and badge fill.
    accentSoft: toColorNumber(mixColors(accent, palette.surface, 0.82)),
    // Barely-tinted paper so cards stay readable side by side.
    surface: toColorNumber(mixColors(palette.surface, accent, 0.05)),
    surfaceHover: toColorNumber(mixColors(palette.surface, accent, 0.13)),
    onAccent: palette.white,
    eyebrow,
    iconPath
  };
}

const visualCache = new Map<string, GameVisual>();
const fallbackVisual = buildVisual(DEFAULT_ACCENT, DEFAULT_EYEBROW);

/**
 * Resolves and caches the visual for a game.
 *
 * `game` may be undefined while the catalog is still loading, in which case the
 * house accent is used.
 */
export function getGameVisual(game: AvailableGameDto | undefined): GameVisual {
  if (!game) {
    return fallbackVisual;
  }

  const cached = visualCache.get(game.id);

  if (cached) {
    return cached;
  }

  const visual = buildVisual(
    game.visual?.accent ?? DEFAULT_ACCENT,
    game.visual?.eyebrow ?? DEFAULT_EYEBROW,
    game.visual?.iconPath
  );
  visualCache.set(game.id, visual);
  return visual;
}

export function getVisualAccent(game: AvailableGameDto | undefined): number {
  return getGameVisual(game).accent;
}

/** Clears the cache when the catalog changes language or is reloaded. */
export function clearGameVisualCache(): void {
  visualCache.clear();
}
