import type { GameManifest } from "../types/GameManifest.js";
import { defaultLanguage, normalizeLanguage, type SupportedLanguage } from "../i18n/language.js";
import { gameTextById } from "./i18n/gameTexts.js";

export const gameCatalog: readonly GameManifest[] = [];

export function listGameCatalog(): GameManifest[] {
  return [...gameCatalog];
}

export function getGameManifest(gameId: string): GameManifest | undefined {
  return gameCatalog.find((entry) => entry.id === gameId);
}

export function localizeGameManifest(
  manifest: GameManifest,
  language: SupportedLanguage = defaultLanguage
): GameManifest {
  const text = gameTextById[manifest.id]?.[normalizeLanguage(language)] ?? gameTextById[manifest.id]?.[defaultLanguage];

  if (!text) {
    return manifest;
  }

  return {
    ...manifest,
    displayName: text.displayName,
    description: text.description
  };
}

export function listLocalizedGameCatalog(
  language: SupportedLanguage = defaultLanguage
): GameManifest[] {
  return gameCatalog.map((entry) => localizeGameManifest(entry, language));
}
