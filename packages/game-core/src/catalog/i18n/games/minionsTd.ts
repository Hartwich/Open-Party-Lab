import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const minionsTdText = {
  de: {
    displayName: "MinionsTD",
    description: "Baue Tower, schicke Minions weiter und halte deine Lane laenger als die anderen."
  },
  en: {
    displayName: "Minions TD",
    description: "Build towers, send minions onward, and keep your lane alive longer than the others."
  }
} as const satisfies LocalizedGameTextMap;
