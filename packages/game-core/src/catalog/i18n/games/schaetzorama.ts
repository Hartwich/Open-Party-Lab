import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const schaetzoramaText = {
  de: {
    displayName: "Schaetzorama",
    description: "Schaetzen, sortieren und abschreiben auf einer quietschbunten Quiz-Konsole."
  },
  en: {
    displayName: "Schaetzorama",
    description: "Estimate, sort and copy facts on a bright quiz console."
  }
} as const satisfies LocalizedGameTextMap;
