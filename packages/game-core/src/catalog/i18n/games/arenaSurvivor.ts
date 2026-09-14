import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const arenaSurvivorText = {
  de: {
    displayName: "Arena Survivor",
    description: "Kaempft gemeinsam im Wave-Modus oder erkundet Frostfire im Survival-Modus mit Level-Ups, Loot und Waffen-Evolutionen."
  },
  en: {
    displayName: "Arena Survivor",
    description: "Fight together in Wave mode or explore Frostfire in Survival mode with shared level-ups, loot and weapon evolutions."
  }
} as const satisfies LocalizedGameTextMap;
