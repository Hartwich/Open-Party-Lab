import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const lightTrailsText = {
  de: {
    displayName: "Light Trails",
    description: "Lenke deine Spur durch die Arena und ueberlebe am laengsten."
  },
  en: {
    displayName: "Light Trails",
    description: "Steer your trail through the arena and survive the longest."
  },
  ar: {
    displayName: "Light Trails",
    description: "وجّه أثرك داخل الحلبة وابقَ الأخير على قيد الحياة."
  }
} as const satisfies LocalizedGameTextMap;
