import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const arenaSurvivorText = {
  de: {
    displayName: "Arena Survivor",
    description: "Ueberlebe in der Arena gegen immer neue Gegner."
  },
  en: {
    displayName: "Arena Survivor",
    description: "Survive in the arena against wave after wave of enemies."
  }
} as const satisfies LocalizedGameTextMap;
