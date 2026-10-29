import type { GameManifest } from "../types/GameManifest.js";
import { defaultLanguage, normalizeLanguage, type SupportedLanguage } from "../i18n/language.js";

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
  const text = manifest.translations?.[normalizeLanguage(language)] ?? manifest.translations?.[defaultLanguage];

  if (!text) {
    return manifest;
  }

  return {
    ...manifest,
    displayName: text.displayName,
    description: text.description,
    ...(manifest.lobbySetup && text.lobbySetup ? {
      lobbySetup: {
        ...manifest.lobbySetup,
        title: text.lobbySetup.title ?? manifest.lobbySetup.title,
        description: text.lobbySetup.description ?? manifest.lobbySetup.description,
        ...(manifest.lobbySetup.confirmation && text.lobbySetup.confirmation ? {
          confirmation: { ...manifest.lobbySetup.confirmation, ...text.lobbySetup.confirmation }
        } : {}),
        fields: manifest.lobbySetup.fields.map((field) => {
          const translated = text.lobbySetup?.fields?.[field.id];
          if (!translated) return field;
          const { options, ...copy } = translated;
          return {
            ...field,
            ...copy,
            ...(field.kind === "select" && options ? {
              options: field.options.map((option) => ({ ...option, ...options[option.id] }))
            } : {})
          };
        })
      }
    } : {}),
    ...(manifest.playerSetup && text.playerSetup ? {
      playerSetup: {
        ...manifest.playerSetup,
        title: text.playerSetup.title ?? manifest.playerSetup.title,
        description: text.playerSetup.description ?? manifest.playerSetup.description,
        ...(manifest.playerSetup.kind === "multi-select" ? {
          readyBlockedLabel: text.playerSetup.readyBlockedLabel ?? manifest.playerSetup.readyBlockedLabel
        } : {}),
        options: manifest.playerSetup.options.map((option) => ({ ...option, ...text.playerSetup?.options?.[option.id] }))
      }
    } : {}),
    ...(manifest.visual && text.visual ? {
      visual: { ...manifest.visual, ...text.visual }
    } : {})
  };
}

export function listLocalizedGameCatalog(
  language: SupportedLanguage = defaultLanguage
): GameManifest[] {
  return gameCatalog.map((entry) => localizeGameManifest(entry, language));
}
