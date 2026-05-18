import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const pantomimeText = {
  de: {
    displayName: "Pantomime",
    description: "Ein Spieler stellt einen Begriff dar, alle anderen raten."
  },
  en: {
    displayName: "Charades",
    description: "One player acts out a term while everyone else guesses."
  }
} as const satisfies LocalizedGameTextMap;
