import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const chaosKommandoText = {
  de: {
    displayName: "Chaos-Kommando",
    description: "Rundenbasierte Cartoon-Artillerie mit Mini-Soeldnern, irren Waffen und fiesen Cratern."
  },
  en: {
    displayName: "Chaos Commando",
    description: "Turn-based cartoon artillery with tiny mercenaries, wild weapons, and mean craters."
  }
} as const satisfies LocalizedGameTextMap;
