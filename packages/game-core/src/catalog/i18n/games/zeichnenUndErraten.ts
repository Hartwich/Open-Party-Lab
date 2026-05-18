import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const zeichnenUndErratenText = {
  de: {
    displayName: "Zeichnen & Erraten",
    description: "Eine Person zeichnet auf dem Handy, alle anderen raten das Wort."
  },
  en: {
    displayName: "Draw & Guess",
    description: "One player draws on the phone while everyone else guesses the word."
  }
} as const satisfies LocalizedGameTextMap;
