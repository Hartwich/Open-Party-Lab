import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const schattenjagdText = {
  de: {
    displayName: "Schattenjagd",
    description: "Ermittler jagen einen verdeckt reisenden Schatten durch ein zufaellig erzeugtes Verkehrsnetz."
  },
  en: {
    displayName: "Shadow Hunt",
    description: "Investigators hunt a hidden fugitive across a procedurally generated transit network."
  },
  ar: {
    displayName: "Shadow Hunt",
    description: "المحقّقون يطاردون هاربًا مختبئًا عبر شبكة نقل مولّدة عشوائيًا."
  }
} as const satisfies LocalizedGameTextMap;
