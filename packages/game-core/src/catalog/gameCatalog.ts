import type { GameManifest } from "../types/GameManifest.js";
import { defaultLanguage, normalizeLanguage, type SupportedLanguage } from "../i18n/language.js";
import { gameTextById } from "./i18n/gameTexts.js";
import type { LocalizedGameText } from "../i18n/text.js";

export const gameCatalog: readonly GameManifest[] = [];

export function listGameCatalog(): GameManifest[] {
  return [...gameCatalog];
}

export function getGameManifest(gameId: string): GameManifest | undefined {
  return gameCatalog.find((entry) => entry.id === gameId);
}

/**
 * Replaces user-facing lobby/player-setup copy by id.
 *
 * Game manifests ship German copy inline; the per-language catalog texts
 * override label/description/name/title by field, option and setup-option id.
 * Everything structural (ids, values, visibility rules, icons, portraits)
 * always comes from the manifest itself.
 */
function localizeLobbySetup(
  setup: NonNullable<GameManifest["lobbySetup"]>,
  text: LocalizedGameText["lobbySetup"]
): NonNullable<GameManifest["lobbySetup"]> {
  if (!text) {
    return setup;
  }

  return {
    ...setup,
    ...(text.title !== undefined ? { title: text.title } : {}),
    ...(text.description !== undefined ? { description: text.description } : {}),
    ...(setup.fields && text.fields
      ? {
          fields: setup.fields.map((field) => {
            const fieldText = text.fields?.[field.id];

            if (!fieldText) {
              return field;
            }

            const localized = {
              ...field,
              label: fieldText.label,
              ...(fieldText.description !== undefined ? { description: fieldText.description } : {}),
              ...(fieldText.group !== undefined ? { group: fieldText.group } : {})
            };

            if (localized.kind === "select" && fieldText.options) {
              return {
                ...localized,
                options: localized.options.map((option) => ({
                  ...option,
                  ...(fieldText.options?.[option.id] ?? {})
                }))
              };
            }

            return localized;
          })
        }
      : {}),
    ...(setup.confirmation && text.confirmation
      ? {
          confirmation: {
            ...setup.confirmation,
            ...(text.confirmation.label !== undefined ? { label: text.confirmation.label } : {}),
            ...(text.confirmation.description !== undefined
              ? { description: text.confirmation.description }
              : {})
          }
        }
      : {})
  };
}

function localizePlayerSetup(
  setup: NonNullable<GameManifest["playerSetup"]>,
  text: LocalizedGameText["playerSetup"]
): NonNullable<GameManifest["playerSetup"]> {
  if (!text) {
    return setup;
  }

  const localized: NonNullable<GameManifest["playerSetup"]> = {
    ...setup,
    ...(text.title !== undefined ? { title: text.title } : {}),
    ...(text.description !== undefined ? { description: text.description } : {}),
    ...(setup.options && text.options
      ? {
          options: setup.options.map((option) => ({
            ...option,
            ...(text.options?.[option.id] ?? {})
          }))
        }
      : {})
  };

  if (localized.kind === "multi-select" && text.readyBlockedLabel !== undefined) {
    return {
      ...localized,
      readyBlockedLabel: text.readyBlockedLabel
    };
  }

  return localized;
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
    description: text.description,
    ...(manifest.lobbySetup ? { lobbySetup: localizeLobbySetup(manifest.lobbySetup, text.lobbySetup) } : {}),
    ...(manifest.playerSetup ? { playerSetup: localizePlayerSetup(manifest.playerSetup, text.playerSetup) } : {})
  };
}

export function listLocalizedGameCatalog(
  language: SupportedLanguage = defaultLanguage
): GameManifest[] {
  return gameCatalog.map((entry) => localizeGameManifest(entry, language));
}
