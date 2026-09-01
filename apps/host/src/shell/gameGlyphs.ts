import type { GameGlyphName } from "@open-party-lab/game-core";

/**
 * The catalog's pictorial vocabulary.
 *
 * Every glyph is a stroke-only path on a 24×24 grid drawn in `currentColor`, so
 * one definition works at any size and follows whatever hue the tile sets. They
 * are deliberately plain: at catalog size a silhouette reads, detail does not.
 */
const glyphPaths: Readonly<Record<GameGlyphName, string>> = {
  swords:
    "M3.5 3.5h3l10 10-3 3-10-10v-3zM20.5 3.5h-3l-4.2 4.2 3 3L20.5 6.5v-3zM6 17l-2.5 2.5M18 17l2.5 2.5M14.5 14.5L17 17l-2 2-2.5-2.5",
  brush: "M4 20c0-2 1-3 3-3 1.7 0 3 1.3 3 3H4zM10 17l9-9a2.1 2.1 0 0 0-3-3l-9 9",
  cards:
    "M9 8.5h7.5a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H9a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 9 8.5zM11 5.6l6.6-1.8a1.5 1.5 0 0 1 1.8 1l2 7.6M12.7 13.4h.01",
  chat: "M20 12a7 7 0 0 1-7 7H8l-4 3v-4.4A7 7 0 0 1 6.5 6.4 7 7 0 0 1 13 5a7 7 0 0 1 7 7z",
  cannon: "M3 18h5M5.5 18v-3M8 15l10-6M8 15l-1.5-3L17 6l1.5 3M19 19h2M15 19h2",
  car: "M4 15h16M5 15l1.6-4.4A2 2 0 0 1 8.5 9h7a2 2 0 0 1 1.9 1.6L19 15M5 15v3M19 15v3M8 18.5h1M15 18.5h1",
  bird: "M3.5 10.5c3.2-4.5 6.4-4.5 8.5 0 2.1-4.5 5.3-4.5 8.5 0M8 17c2-3 4.2-3 5.8 0",
  mask: "M4.5 6.5c5-1.6 10-1.6 15 0 0 7-3 12.5-7.5 12.5S4.5 13.5 4.5 6.5zM8.5 11c.9-.8 2.1-.8 3 0M12.5 11c.9-.8 2.1-.8 3 0M10 15.5c1.3.9 2.7.9 4 0",
  bolt: "M13 3L5 14h6l-1 7 8-11h-6l1-7z",
  sparkles: "M12 4l1.7 4.3L18 10l-4.3 1.7L12 16l-1.7-4.3L6 10l4.3-1.7L12 4zM18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z",
  wand: "M5 19L15 9M15 9l1.5-1.5a2.1 2.1 0 0 1 3 3L18 12M9 4v3M7.5 5.5h3M18 15v2.5M16.75 16.25h2.5",
  tower: "M8 20V9l4-4 4 4v11M8 20h8M6 20h12M10.5 20v-4h3v4M9 9h6",
  drama:
    "M3 4.5h8v6.5a4 4 0 0 1-8 0V4.5zM5.5 7h.01M8.5 7h.01M5.5 9.5c.9.7 2.1.7 3 0M13 8.5h8V15a4 4 0 0 1-8 0V8.5zM15.5 11h.01M18.5 11h.01M15.5 14c.9-.7 2.1-.7 3 0",
  question: "M9 9a3 3 0 1 1 4.2 2.8c-.8.4-1.2 1-1.2 1.9v.6M12 18h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  ghost: "M5 20V10a7 7 0 0 1 14 0v10l-2.3-1.8L14.4 20 12 18.2 9.6 20l-2.3-1.8L5 20zM9.5 10h.01M14.5 10h.01",
  hand: "M9 12V5.5a1.5 1.5 0 0 1 3 0V11M12 11V4.5a1.5 1.5 0 0 1 3 0V11M15 11V6.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a5 5 0 0 1-4.3-2.5L6 15.5a1.6 1.6 0 0 1 2.6-1.9L9 14",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  puck: "M12 6c4.4 0 8 1.1 8 2.5v7c0 1.4-3.6 2.5-8 2.5s-8-1.1-8-2.5v-7C4 7.1 7.6 6 12 6zM4 8.5c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5",
  star: "M12 4l2.4 5.2 5.6.7-4.1 3.9 1.1 5.6-5-2.8-5 2.8 1.1-5.6L4 9.9l5.6-.7L12 4z"
};

const fallbackGlyph: GameGlyphName = "star";

function isGlyphName(value: unknown): value is GameGlyphName {
  return typeof value === "string" && value in glyphPaths;
}

/**
 * Inline SVG for a game's glyph.
 *
 * `iconPath` wins when a game ships its own artwork; otherwise the named glyph
 * is drawn, and an unknown or missing name falls back to the abstract mark
 * rather than leaving a hole in the grid.
 */
export function renderGameGlyph(
  icon: unknown,
  iconPath: string | undefined,
  size: number
): string {
  if (iconPath) {
    return `<img src="${iconPath}" alt="" width="${size}" height="${size}" class="opl-glyph-img" />`;
  }

  const name = isGlyphName(icon) ? icon : fallbackGlyph;

  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${glyphPaths[name]}" /></svg>`;
}

/** Chrome icons for the dock and the roster, drawn in the same language. */
const uiPaths = {
  catalog: "M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z",
  settings:
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-3-1.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.3-3l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 3 1.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z",
  theme: "M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3L4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  crown: "M4 8l3.5 3L12 5l4.5 6L20 8l-1.5 10h-13L4 8z",
  phone: "M9 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM11 18h2",
  kick: "M9 9l6 6M15 9l-6 6M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  users: "M15.5 20v-2a3.5 3.5 0 0 0-3.5-3.5H7A3.5 3.5 0 0 0 3.5 18v2M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20.5 20v-2a3.5 3.5 0 0 0-2.6-3.4M16 4.1a3.5 3.5 0 0 1 0 6.8",
  back: "M15 5l-7 7 7 7",
  play: "M7 5l11 7-11 7V5z",
  fullscreen: "M8 4H4v4M16 4h4v4M20 16v4h-4M4 16v4h4",
  dots: "M6 12h.01M12 12h.01M18 12h.01",
  check: "M5 12.5l4.5 4.5L19 7"
} as const;

export type UiIconName = keyof typeof uiPaths;

export function renderUiIcon(name: UiIconName, size: number, strokeWidth = 1.7): string {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="${uiPaths[name]}" /></svg>`;
}
