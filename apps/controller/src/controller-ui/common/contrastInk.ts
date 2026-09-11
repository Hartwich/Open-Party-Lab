/**
 * Readable ink for a mark drawn on top of an arbitrary colour.
 *
 * Some swatches are chosen by the game, not the theme — the drawing palette now
 * holds both black and white so either can be the pen. A selection ring in a
 * theme token cannot work for both: on paper the ring is dark, which vanishes
 * around the black swatch, and on the dark stage it vanishes around the white
 * one. Relative luminance of the swatch itself decides instead.
 */
export function contrastInk(color: string): string {
  const hex = color.trim().replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((character) => character + character)
          .join("")
      : hex;
  const value = Number.parseInt(full, 16);

  if (!Number.isFinite(value) || full.length !== 6) {
    return "#ffffff";
  }

  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
    const ratio = channel / 255;
    return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];

  return luminance > 0.45 ? "#1d1d1b" : "#ffffff";
}
