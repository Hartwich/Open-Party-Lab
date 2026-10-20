/**
 * Languages a game has to be able to provide text for.
 *
 * External game repos declare exhaustive `Record<SupportedLanguage, …>` maps,
 * so this set must stay stable: adding a language here would break every game
 * repo the platform clones. The room itself may speak more languages than a
 * given game can render — see `RoomLanguage`.
 */
export const supportedLanguages = ["de", "en"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

/**
 * Languages a room can run in.
 *
 * Superset of `SupportedLanguage`: the platform ships full text for all of
 * these, while a game that only knows `de`/`en` falls back to English at the
 * game boundary.
 */
export const roomLanguages = ["de", "en", "ar"] as const;

export type RoomLanguage = (typeof roomLanguages)[number];

export const defaultLanguage: SupportedLanguage = "en";

export const languageLabels: Record<RoomLanguage, string> = {
  de: "Deutsch",
  en: "English",
  ar: "العربية"
};

export function isRoomLanguage(value: unknown): value is RoomLanguage {
  return typeof value === "string" && roomLanguages.includes(value as RoomLanguage);
}

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === "string" && supportedLanguages.includes(value as SupportedLanguage);
}

export function normalizeRoomLanguage(
  value: unknown,
  fallback: RoomLanguage = defaultLanguage
): RoomLanguage {
  return isRoomLanguage(value) ? value : fallback;
}

export function normalizeLanguage(
  value: unknown,
  fallback: SupportedLanguage = defaultLanguage
): SupportedLanguage {
  return isSupportedLanguage(value) ? value : fallback;
}

/**
 * Narrows a room language to one a game can render.
 *
 * Arabic rooms fall back to English game text rather than German, so the
 * strings a player sees stay closer to the language they picked.
 */
export function toSupportedLanguage(language: RoomLanguage): SupportedLanguage {
  return isSupportedLanguage(language) ? language : "en";
}
