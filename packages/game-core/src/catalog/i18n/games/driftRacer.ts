import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const driftRacerText = {
  de: {
    displayName: "Drift Racer",
    description: "3D-Arcade-Racer im RC-Mini-Car-Stil mit cineastischer Flugkamera, Waffen und KI-Gegnern.",
    lobbySetup: {
      title: "Drift Racer Setup",
      description: "Waehlt Strecke, Rundenzahl und die Anzahl der KI-Gegner.",
      fields: {
        track: {
          label: "Strecke",
          options: {
            rotate: {
              label: "Wechselnd",
              description: "Jedes Rennen faehrt automatisch die naechste Strecke."
            },
            "palm-bay": {
              label: "Palm Bay",
              description: "Kompakter Inselkurs mit zwei Sprungschanzen."
            },
            "lagoon-loop": {
              label: "Lagoon Loop",
              description: "Lange, fluessige Kurvenkombinationen und drei Schanzen."
            },
            "volcano-ridge": {
              label: "Volcano Ridge",
              description: "Laengste Strecke mit vier Schanzen und engen Wechseln."
            }
          }
        },
        laps: {
          label: "Runden",
          description: "Wie viele Runden bis zum Ziel."
        },
        bots: {
          label: "KI-Gegner",
          description: "Zusaetzliche Computer-Fahrer im Feld."
        }
      }
    }
  },
  en: {
    displayName: "Drift Racer",
    description: "3D arcade racer in RC mini-car style with cinematic chase camera, weapons and AI opponents.",
    lobbySetup: {
      title: "Drift Racer Setup",
      description: "Choose the track, lap count and number of AI opponents.",
      fields: {
        track: {
          label: "Track",
          options: {
            rotate: {
              label: "Rotating",
              description: "Each race automatically drives the next track."
            },
            "palm-bay": {
              label: "Palm Bay",
              description: "Compact island circuit with two jumps."
            },
            "lagoon-loop": {
              label: "Lagoon Loop",
              description: "Long, flowing corner combinations and three jumps."
            },
            "volcano-ridge": {
              label: "Volcano Ridge",
              description: "Longest track with four jumps and tight switchbacks."
            }
          }
        },
        laps: {
          label: "Laps",
          description: "How many laps to the finish."
        },
        bots: {
          label: "AI opponents",
          description: "Extra computer drivers in the field."
        }
      }
    }
  },
  ar: {
    displayName: "Drift Racer",
    description: "سباق أركيد ثلاثي الأبعاد بأسلوب سيارات RC مع كاميرا مطاردة سينمائية وسلاح وخصوم بذكاء اصطناعي.",
    lobbySetup: {
      title: "إعداد Drift Racer",
      description: "اختر الحلبة وعدد اللفات وعدد الخصوم من الذكاء الاصطناعي.",
      fields: {
        track: {
          label: "الحلبة",
          options: {
            rotate: {
              label: "متغيّرة",
              description: "يقود كل سباق الحلبة التالية تلقائيًا."
            },
            "palm-bay": {
              label: "Palm Bay",
              description: "مسار جزيرة مدمج بقفزتين."
            },
            "lagoon-loop": {
              label: "Lagoon Loop",
              description: "منحنيات طويلة انسيابية وثلاث قفزات."
            },
            "volcano-ridge": {
              label: "Volcano Ridge",
              description: "أطول مسار بأربع قفزات ومنعطفات ضيقة."
            }
          }
        },
        laps: {
          label: "اللفات",
          description: "عدد اللفات حتى خط النهاية."
        },
        bots: {
          label: "خصوم الذكاء الاصطناعي",
          description: "سائقون إضافيون بحكم الحاسوب في السباق."
        }
      }
    }
  }
} as const satisfies LocalizedGameTextMap;
