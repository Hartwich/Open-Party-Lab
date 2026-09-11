/**
 * A translucent variant of any colour, including a theme variable.
 *
 * Layouts used to write `${color}44` to get a faint border or glow. That only
 * ever worked while `color` was a hex literal: once the palette moved to theme
 * variables the same expression produced `var(--sage)44`, which is not a colour
 * at all, so the browser dropped the whole declaration — borders and glows
 * silently disappeared rather than looking wrong, which is why it survived
 * review.
 *
 * `color-mix` takes either form, so this works for a token, a hex literal, or a
 * colour that arrives from game state.
 *
 * @param color any CSS colour — `var(--accent)`, `#b1503a`, `rgb(...)`
 * @param percent how much of it to keep, 0–100
 */
export function translucent(color: string, percent: number): string {
  const clamped = Math.max(0, Math.min(100, percent));
  return `color-mix(in srgb, ${color} ${clamped}%, transparent)`;
}
