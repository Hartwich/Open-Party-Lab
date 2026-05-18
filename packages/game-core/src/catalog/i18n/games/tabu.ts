import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const tabuText = {
  de: {
    displayName: "Tabu",
    description: "Erklaert Begriffe, ohne die Tabu-Woerter zu benutzen."
  },
  en: {
    displayName: "Taboo",
    description: "Explain terms without using the forbidden words."
  }
} as const satisfies LocalizedGameTextMap;
