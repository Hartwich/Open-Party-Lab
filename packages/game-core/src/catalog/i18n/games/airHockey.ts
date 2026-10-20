import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const airHockeyText = {
  de: {
    displayName: "Air Hockey",
    description: "Duelle dich im 1v1 und schiesse den Puck ins gegnerische Tor."
  },
  en: {
    displayName: "Air Hockey",
    description: "Duel one-on-one and shoot the puck into the opponent's goal."
  },
  ar: {
    displayName: "Air Hockey",
    description: "تحدَّ خصمك واحدًا مقابل واحد وأسجِل القرص في مرماه."
  }
} as const satisfies LocalizedGameTextMap;
