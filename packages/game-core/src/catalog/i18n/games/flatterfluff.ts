import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const flatterfluffText = {
  de: {
    displayName: "Flatterfluff",
    description: "Rasante Zuckerpraerie-Zieljagd mit gefluegelten Marshmallows, Nachladen, Munitionskisten und bis zu sechs farbigen Fadenkreuzen.",
    lobbySetup: {
      title: "Flatterfluff Setup",
      description: "Waehlt Zeitjagd oder eine offene Endlosrunde.",
      fields: {
        mode: {
          label: "Spielmodus",
          options: {
            timed: {
              label: "Zeitjagd",
              description: "Sammelt vor Ablauf der Uhr so viele Punkte wie moeglich."
            },
            endless: {
              label: "Endlos",
              description: "Spielt ohne Zeitlimit, bis der Host die Runde beendet."
            }
          }
        },
        roundSeconds: {
          label: "Rundenzeit",
          description: "Dauer der Zeitjagd in Sekunden."
        }
      }
    }
  },
  en: {
    displayName: "Flatterfluff",
    description: "Fast sugar-prairie target hunt with winged marshmallows, reloading, ammo crates and up to six colored crosshairs.",
    lobbySetup: {
      title: "Flatterfluff Setup",
      description: "Choose a timed hunt or an open endless round.",
      fields: {
        mode: {
          label: "Game mode",
          options: {
            timed: {
              label: "Timed hunt",
              description: "Score as many points as possible before the clock runs out."
            },
            endless: {
              label: "Endless",
              description: "Play without a time limit until the host ends the round."
            }
          }
        },
        roundSeconds: {
          label: "Round length",
          description: "Timed-hunt duration in seconds."
        }
      }
    }
  }
} as const satisfies LocalizedGameTextMap;
