import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const buzzwortText = {
  de: {
    displayName: "Buzzwort",
    description: "Erklaere Begriffe gegen die Uhr, ohne die verbotenen Woerter zu sagen - ein Waechter passt auf."
  },
  en: {
    displayName: "Buzzword",
    description: "Explain terms against the clock without saying the forbidden words - a watcher is listening."
  },
  ar: {
    displayName: "Buzzword",
    description: "اشرح المصطلحات ضدد الوقت دون قول الكلمات الممنوعة — هناك من يراقب."
  }
} as const satisfies LocalizedGameTextMap;
