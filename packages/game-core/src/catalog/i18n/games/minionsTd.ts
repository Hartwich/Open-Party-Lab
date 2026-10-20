import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const minionsTdText = {
  de: {
    displayName: "MinionsTD",
    description: "Baue Tower, schicke Minions weiter und halte deine Lane laenger als die anderen.",
    lobbySetup: {
      title: "MinionsTD Setup",
      description: "Waehle Map, Startleben und Startgold vor dem Rundenstart.",
      fields: {
        mapId: { label: "Map" },
        startingLives: { label: "Startleben" },
        startingGold: { label: "Startgold" }
      }
    }
  },
  en: {
    displayName: "MinionsTD",
    description: "Build towers, push minions forward and hold your lane longer than everyone else.",
    lobbySetup: {
      title: "MinionsTD Setup",
      description: "Choose the map, starting lives and starting gold before the round starts.",
      fields: {
        mapId: { label: "Map" },
        startingLives: { label: "Starting lives" },
        startingGold: { label: "Starting gold" }
      }
    }
  },
  ar: {
    displayName: "MinionsTD",
    description: "ابنِ الأبراج وادفع الجنود إلى الأمام واحتفظ بممرّك أطول من الجميع.",
    lobbySetup: {
      title: "إعداد MinionsTD",
      description: "اختر الخريطة ونقاط الحياة والذهب الابتدائي قبل بدء الجولة.",
      fields: {
        mapId: { label: "الخريطة" },
        startingLives: { label: "نقاط الحياة" },
        startingGold: { label: "الذهب الابتدائي" }
      }
    }
  }
} as const satisfies LocalizedGameTextMap;
