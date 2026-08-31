/**
 * Warm paper palette shared by the host screen and the controller.
 *
 * The palette is intentionally light and low-contrast-friendly: a warm paper
 * base, a soft off-white surface, terracotta as the single loud accent and a
 * muted sage as the calm secondary. Every other token in the kit derives from
 * these values, so re-skinning the platform means editing this file only.
 */
export const palette = {
  /** Page background. */
  paper: "#f7f1e7",
  /** Slightly darker paper for inset areas and page gutters. */
  paperDeep: "#efe6d8",
  /** Card / panel background. */
  surface: "#fffbf4",
  /** Panel background for secondary blocks. */
  surfaceMuted: "#f3ece0",
  /** Raised surface used by floating chrome above busy game art. */
  surfaceRaised: "#fffdf9",

  /** Primary text. */
  ink: "#24313a",
  /** Text on tinted surfaces. */
  inkSoft: "#3d4b55",
  /** Secondary text, captions, hints. */
  muted: "#697178",

  /** Hairlines and dividers. */
  line: "#ded5c7",
  /** Stronger border for interactive outlines. */
  lineStrong: "#c9bda9",

  /** Terracotta accent — primary actions, highlights, progress. */
  accent: "#d15f3b",
  /** Pressed / hovered accent. */
  accentStrong: "#bd4727",
  /** Tinted accent background. */
  accentSoft: "#f6ddd0",

  /** Warm amber — timers, warnings, secondary highlights. */
  amber: "#c8873a",
  amberSoft: "#f7e7cd",

  /** Sage — success, calm secondary actions. */
  sage: "#6e8b74",
  sageStrong: "#587260",
  sageSoft: "#dfe9df",

  /** Muted brick red for destructive actions. */
  danger: "#a93b31",
  dangerSoft: "#f4dad6",

  white: "#ffffff",
  black: "#000000"
} as const;

/**
 * Semantic aliases. Prefer these over raw palette entries in app code so that
 * intent stays readable and future palette swaps stay mechanical.
 */
export const colors = {
  background: palette.paper,
  backgroundDeep: palette.paperDeep,
  surface: palette.surface,
  surfaceMuted: palette.surfaceMuted,
  surfaceRaised: palette.surfaceRaised,
  text: palette.ink,
  textSoft: palette.inkSoft,
  muted: palette.muted,
  line: palette.line,
  lineStrong: palette.lineStrong,
  accent: palette.accent,
  accentStrong: palette.accentStrong,
  accentSoft: palette.accentSoft,
  warning: palette.amber,
  warningSoft: palette.amberSoft,
  success: palette.sage,
  successStrong: palette.sageStrong,
  successSoft: palette.sageSoft,
  danger: palette.danger,
  dangerSoft: palette.dangerSoft
} as const;

/** Deterministic player colours that sit well on the warm paper background. */
export const playerColors = [
  "#d15f3b",
  "#6e8b74",
  "#c8873a",
  "#4f7d8c",
  "#96604f",
  "#8a7aa8",
  "#a93b31",
  "#5b8f7d"
] as const;

/**
 * Converts a `#rrggbb` string into the numeric form Phaser expects.
 * Returns `0x000000` for malformed input rather than throwing, because these
 * values are read during render and must never break a frame.
 */
export function toColorNumber(hex: string): number {
  const normalized = hex.trim().replace("#", "");

  if (normalized.length !== 6 && normalized.length !== 3) {
    return 0x000000;
  }

  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;

  const parsed = Number.parseInt(expanded, 16);
  return Number.isNaN(parsed) ? 0x000000 : parsed;
}

/** Mixes two `#rrggbb` colours. `amount` is the weight of `to` (0..1). */
export function mixColors(from: string, to: string, amount: number): string {
  const weight = Math.min(1, Math.max(0, amount));
  const a = toColorNumber(from);
  const b = toColorNumber(to);
  const channel = (shift: number): number =>
    Math.round((((a >> shift) & 0xff) * (1 - weight)) + (((b >> shift) & 0xff) * weight));

  const value = (channel(16) << 16) | (channel(8) << 8) | channel(0);
  return `#${value.toString(16).padStart(6, "0")}`;
}

/** Returns an `rgba()` string for a `#rrggbb` colour. */
export function withAlpha(hex: string, alpha: number): string {
  const value = toColorNumber(hex);
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, alpha))})`;
}
