const entities: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

/**
 * Escapes a value for interpolation into markup.
 *
 * The shell builds HTML strings, and player names, game titles and setup labels
 * all originate outside the host — a name is whatever someone typed on a phone.
 * Every interpolation goes through here.
 */
export function escapeHtml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (character) => entities[character] ?? character);
}
