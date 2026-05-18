import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const tapRaceText = {
  de: {
    displayName: "Tap Race",
    description: "Tippe schneller als die anderen bis zum Ziel."
  },
  en: {
    displayName: "Tap Race",
    description: "Tap faster than everyone else until you reach the finish."
  }
} as const satisfies LocalizedGameTextMap;
