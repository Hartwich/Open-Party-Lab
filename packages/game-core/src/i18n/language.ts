export const supportedLanguages = ["de", "en"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage: SupportedLanguage = "de";

export const languageLabels: Record<SupportedLanguage, string> = {
  de: "Deutsch",
  en: "English"
};

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === "string" && supportedLanguages.includes(value as SupportedLanguage);
}

export function normalizeLanguage(
  value: unknown,
  fallback: SupportedLanguage = defaultLanguage
): SupportedLanguage {
  return isSupportedLanguage(value) ? value : fallback;
}
