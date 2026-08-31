export const typography = {
  /** Headlines and numerals — warm serif, matches the puzzle-book look. */
  display: "Georgia, \"Iowan Old Style\", \"Times New Roman\", serif",
  /** Body copy and UI labels. */
  body: "Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
  /** Room codes, debug output, telemetry. */
  mono: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace"
} as const;

/** Shared type scale in px. Host scenes and DOM chrome read from the same set. */
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 34,
  display: 48,
  hero: 72
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  heavy: 800
} as const;

export const letterSpacing = {
  tight: "-0.025em",
  normal: "0",
  wide: "0.08em"
} as const;
