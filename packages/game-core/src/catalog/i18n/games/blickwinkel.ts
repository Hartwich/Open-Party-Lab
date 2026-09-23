import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const blickwinkelText = {
  de: {
    displayName: "Blickwinkel",
    description: "Stimmt geheim ab, schreibt kurze Antworten, macht Fotos und zeichnet. Wie gut kennt ihr euch?"
  },
  en: {
    displayName: "Blickwinkel",
    description: "Vote in secret, write short answers, take photos and draw. How well do you know one another?"
  }
} as const satisfies LocalizedGameTextMap;
