import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const schaetzoramaText = {
  de: {
    displayName: "Schaetzorama",
    description: "Schaetzen, sortieren und abschreiben auf einer quietschbunten Quiz-Konsole."
  },
  en: {
    displayName: "Schaetzorama",
    description: "Estimate, sort and copy facts on a bright quiz console."
  },
  ar: {
    displayName: "Schaetzorama",
    description: "قدّر ورتّب وانسخ الحقائق على لوحة أسئلة ملوّنة."
  }
} as const satisfies LocalizedGameTextMap;
