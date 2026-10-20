import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const magicArenaText = {
  de: {
    displayName: "Magic Arena",
    description: "Rundenbasierte 3D-Hex-Taktik mit Karten, Wasserloechern und verdeckter Planung.",
    lobbySetup: {
      title: "Magic Arena Setup",
      description: "Waehle, wie die Zuege gespielt werden.",
      fields: {
        planningMode: {
          label: "Zugplanung",
          options: {
            planned: {
              label: "Vorausplanen",
              description: "Alle vier Zuege werden verdeckt geplant und dann gemeinsam ausgefuehrt."
            },
            sequential: {
              label: "Zug fuer Zug",
              description: "Die Spieler ziehen nacheinander: Jeder Zug wird sofort ausgefuehrt."
            }
          }
        }
      }
    }
  },
  en: {
    displayName: "Magic Arena",
    description: "Turn-based 3D hex tactics with cards, water hazards and hidden planning.",
    lobbySetup: {
      title: "Magic Arena Setup",
      description: "Choose how turns are played.",
      fields: {
        planningMode: {
          label: "Turn planning",
          options: {
            planned: {
              label: "Plan ahead",
              description: "All four moves are planned face-down, then resolved together."
            },
            sequential: {
              label: "Turn by turn",
              description: "Players move one after another: every move resolves immediately."
            }
          }
        }
      }
    }
  },
  ar: {
    displayName: "Magic Arena",
    description: "تكتيك سداسي ثلاثي الأبعاد بالأدوار مع بطاقات وعقبات مائية وتخطيط مخفي.",
    lobbySetup: {
      title: "إعداد Magic Arena",
      description: "اختر طريقة لعب الأدوار.",
      fields: {
        planningMode: {
          label: "تخطيط الدور",
          options: {
            planned: {
              label: "تخطيط مسبق",
              description: "تُخطَّط الأدوار الأربعة كلها مقلوبة ثم تُنفَّذ معًا."
            },
            sequential: {
              label: "دورًا بدور",
              description: "يتحرك اللاعبون بالتناوب: يُنفَّذ كل فورًا."
            }
          }
        }
      }
    }
  }
} as const satisfies LocalizedGameTextMap;
