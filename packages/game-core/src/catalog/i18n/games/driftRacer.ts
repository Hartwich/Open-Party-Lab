import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const driftRacerText = {
  de: {
    displayName: "Drift Racer",
    description: "Arcade-Rennen mit Drittperson-Splitscreen, engen Drifts und Boost-Duellen."
  },
  en: {
    displayName: "Drift Racer",
    description: "Arcade racing with third-person split screen, drift turns, and boost duels."
  }
} as const satisfies LocalizedGameTextMap;
