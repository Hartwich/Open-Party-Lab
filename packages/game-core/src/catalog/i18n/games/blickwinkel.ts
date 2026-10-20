import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const blickwinkelText = {
  de: {
    displayName: "Blickwinkel",
    description: "Stimmt geheim ab, schreibt kurze Antworten, macht Fotos und zeichnet. Wie gut kennt ihr euch?",
    lobbySetup: {
      title: "Blickwinkel einrichten",
      fields: { adultContent: { label: "Ü18", description: "Zusätzliche Fragen und Textaufgaben über Flirts, Sex und Nachtleben." } }
    }
  },
  en: {
    displayName: "Blickwinkel",
    description: "Vote in secret, write short answers, take photos and draw. How well do you know one another?",
    lobbySetup: {
      title: "Set up Blickwinkel",
      fields: { adultContent: { label: "18+", description: "Add questions and text tasks about flirting, sex and nightlife." } }
    }
  },
  ar: {
    displayName: "Blickwinkel",
    description: "صوّت سرًّا واكتب إجابات قصيرة والتقط صورًا وارسم. كم تعرفون بعضكم البعض؟",
    lobbySetup: {
      title: "إعداد Blickwinkel",
      fields: { adultContent: { label: "+18", description: "أضف أسئلة ومهام نصية عن التغرّب والجنس وحياة الليل." } }
    }
  }
} as const satisfies LocalizedGameTextMap;
