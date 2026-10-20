import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const pantomimeText = {
  de: {
    displayName: "Pantomime",
    description: "Begriffe ohne Worte darstellen, Treffer sammeln und gemeinsam prüfen.",
    lobbySetup: { title: "Pantomime einrichten", fields: {
      mode: { label: "Spielmodus" }, category: { label: "Begriffe" },
      duration: { label: "Sekunden pro Darsteller" }, skips: { label: "Weiter pro Darsteller-Zug" }
    } }
  },
  en: {
    displayName: "Charades",
    description: "Act out words, claim correct guesses and review them together.",
    lobbySetup: { title: "Set up Charades", fields: {
      mode: { label: "Game mode" }, category: { label: "Words" },
      duration: { label: "Seconds per actor" }, skips: { label: "Skips per actor turn" }
    } }
  },
  ar: {
    displayName: "تمثيل صامت",
    description: "مثّل كلمات دون كلام، واجمع التخمينات الصحيحة، ومراجعها معًا.",
    lobbySetup: { title: "إعداد التمثيل الصامت", fields: {
      mode: { label: "وضع اللعب" }, category: { label: "الكلمات" },
      duration: { label: "ثوانٍ لكل ممثّل" }, skips: { label: "التجاوزات لكل دور" }
    } }
  }
} as const satisfies LocalizedGameTextMap;
