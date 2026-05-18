import type {
  SupportedLanguage,
  ZeichnenUndErratenLobbyState,
  ZeichnenUndErratenWordCategory
} from "@open-party-lab/protocol";

export const zeichnenUndErratenRoomSettingKeys = {
  wordCategory: "zeichnenUndErratenWordCategory"
} as const;

const defaultWordCategory: ZeichnenUndErratenWordCategory = "standard";

export function isZeichnenUndErratenWordCategory(
  value: unknown
): value is ZeichnenUndErratenWordCategory {
  return value === "standard" || value === "adult";
}

export function resolveZeichnenUndErratenWordCategory(
  settings: Readonly<Record<string, unknown>>
): ZeichnenUndErratenWordCategory {
  const value = settings[zeichnenUndErratenRoomSettingKeys.wordCategory];
  return isZeichnenUndErratenWordCategory(value) ? value : defaultWordCategory;
}

export function getZeichnenUndErratenLobbyState(
  settings: Readonly<Record<string, unknown>>,
  language: SupportedLanguage
): ZeichnenUndErratenLobbyState {
  const en = language === "en";

  return {
    selectedCategory: resolveZeichnenUndErratenWordCategory(settings),
    categories: [
      {
        id: "standard",
        label: en ? "Family" : "Familie",
        description: en ? "Friendly drawing words for every group." : "Zeichenbegriffe fuer jede Runde."
      },
      {
        id: "adult",
        label: en ? "18+" : "\u00dc18",
        description: en ? "Mature party words for adults." : "Erwachsene Party-Begriffe."
      }
    ]
  };
}
