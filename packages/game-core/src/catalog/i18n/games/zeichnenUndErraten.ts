import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const zeichnenUndErratenText = {
  de: {
    displayName: "Zeichnen & Erraten",
    description: "Eine Person zeichnet auf dem Handy, alle anderen raten das Wort.",
    lobbySetup: {
      title: "Wortkategorie",
      description: "Waehlt, welche Begriffe in der Runde vorkommen duerfen.",
      fields: {
        category: {
          label: "Kategorie",
          options: {
            standard: {
              label: "U18",
              description: "Familienfreundliche Zeichenbegriffe."
            },
            adult: {
              label: "Ue18",
              description: "Erwachsene Party-Begriffe."
            },
            all: {
              label: "Alle",
              description: "U18- und Ue18-Begriffe zusammen."
            }
          }
        },
        roundSeconds: {
          label: "Rundenzeit in Sekunden (0 = ohne Limit)",
          description: "Legt fest, wie lange geraten werden kann."
        }
      }
    }
  },
  en: {
    displayName: "Draw & Guess",
    description: "One player draws on the phone while everyone else guesses the word.",
    lobbySetup: {
      title: "Word category",
      description: "Choose which words may appear in the round.",
      fields: {
        category: {
          label: "Category",
          options: {
            standard: {
              label: "Family",
              description: "Family-friendly drawing words."
            },
            adult: {
              label: "18+",
              description: "Mature party words."
            },
            all: {
              label: "All",
              description: "Family and mature words together."
            }
          }
        },
        roundSeconds: {
          label: "Round time in seconds (0 = no limit)",
          description: "Sets how long players can guess."
        }
      }
    }
  },
  ar: {
    displayName: "ارسم وخمّن",
    description: "يرسم لاعب واحد على الهاتف بينما يخمّن البقية الكلمة.",
    lobbySetup: {
      title: "فئة الكلمة",
      description: "اختر الكلمات المسموح بها في الجولة.",
      fields: {
        category: {
          label: "الفئة",
          options: {
            standard: {
              label: "للعائلة",
              description: "كلمات رسم مناسبة للعائلة."
            },
            adult: {
              label: "+18",
              description: "كلمات حفلات للكبار."
            },
            all: {
              label: "الكل",
              description: "كلمات العائلة والكبار معًا."
            }
          }
        },
        roundSeconds: {
          label: "زمن الجولة بالثواني (0 = بلا حد)",
          description: "يحدّد مدة التخمين."
        }
      }
    }
  }
} as const satisfies LocalizedGameTextMap;
