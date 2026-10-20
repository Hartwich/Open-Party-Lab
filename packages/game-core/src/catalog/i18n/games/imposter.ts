import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const imposterText = {
  de: {
    displayName: "Imposter",
    description: "Finde den Bluffenden durch Hinweise und Abstimmung."
  },
  en: {
    displayName: "Imposter",
    description: "Find the bluffing player through clues and a vote."
  },
  ar: {
    displayName: "Imposter",
    description: "اكتشف اللاعب المدّعي من خلال الأدلة والتصويت."
  }
} as const satisfies LocalizedGameTextMap;
