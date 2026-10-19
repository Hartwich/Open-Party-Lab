import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const buzzwortText = {
  de: {
    displayName: "Buzzwort",
    description: "Erklaere Begriffe gegen die Uhr, ohne die verbotenen Woerter zu sagen - ein Waechter passt auf."
  },
  en: {
    displayName: "Buzzword",
    description: "Explain terms against the clock without saying the forbidden words - a watcher is listening."
  }
} as const satisfies LocalizedGameTextMap;
