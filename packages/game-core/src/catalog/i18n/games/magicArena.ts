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
  }
} as const satisfies LocalizedGameTextMap;
