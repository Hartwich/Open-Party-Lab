import type { LocalizedGameTextMap } from "../../../i18n/text.js";

const characterOptionsDe = {
  "schrotto-scharfschuss": {
    name: "Schrotto",
    title: "der Scharfschuss",
    description: "Liebt alles, was aus sicherer Entfernung laut wird. Starker Fernschaden, aber nicht der robusteste Kartoffelheld."
  },
  "kloppbert-keulenwucht": {
    name: "Kloppbert",
    title: "die Keulenwucht",
    description: "Loest fast jedes Problem mit einer Nahkampfwaffe. Massiver Nahkampfschaden und etwas mehr Leben, aber weniger Angriffstempo."
  },
  "funkenberta-flaemmchen": {
    name: "Funkenberta",
    title: "das Flaemmchen",
    description: "Wirft Feuer, Frost und Funken durch die Gegend. Hoher Magie- und Elementarschaden, aber wenig Ruestung."
  },
  "kanni-baldrian": {
    name: "Kanni",
    title: "Baldrian der Bissige",
    description: "Sieht harmlos aus, knabbert sich aber durch ganze Horden. Viel Lebensraub und gutes Angriffstempo, dafuer weniger Grundschaden."
  },
  "doktor-knolle": {
    name: "Doktor Knolle",
    title: "der Nachheiler",
    description: "Hat immer Pflaster, Tee und eine fragwuerdige Bruehe dabei. Mehr Regeneration und ordentliches Leben, dafuer weniger Tempo."
  },
  "sir-pampel-panzer": {
    name: "Sir Pampel",
    title: "der Panzer",
    description: "Traegt mehr Metall als Vernunft. Sehr viel Leben und Ruestung, bezahlt aber mit Mobilitaet und Angriffstempo."
  },
  flitzelotte: {
    name: "Flitzelotte",
    title: "der Turboknoedel",
    description: "Ist schon weg, bevor der Gegner den Angriff bemerkt. Viel Tempo und Ausweichen, aber wenig Leben und Reichweite."
  },
  "professor-paradox": {
    name: "Professor Paradox",
    title: "der Allrounder",
    description: "Hat zu allem eine Theorie und meistens auch eine brauchbare Loesung. Kleine Vorteile in Leben, Schaden, Tempo und Economy."
  },
  "rundling-allround": {
    name: "Rundling",
    title: "der Ausgewogene",
    description: "Runder Einstieg mit kleinen Boni auf Leben, Schaden, Tempo und langfristige Materialien."
  },
  "pruegler-brawler": {
    name: "Pruegler",
    title: "der Nahkaempfer",
    description: "Hohes Angriffstempo und Ausweichen mit Nahkampf-Fokus, aber schwache Reichweite und Fernkampfwerte."
  },
  "jaeger-ranger": {
    name: "Jaeger",
    title: "der Fernkaempfer",
    description: "Hohe Waffenreichweite, Fernkampf und Crit, aber spuerbar weniger Leben und Nahkampfwert."
  },
  "gluecksknolle-lucky": {
    name: "Gluecksknolle",
    title: "der Glueckliche",
    description: "Bessere Drops und Health-Pickups, dafuer schwaecherer direkter Kampf."
  },
  "ackerling-farmer": {
    name: "Ackerling",
    title: "der Erntehelfer",
    description: "Starkes Harvesting und langfristige Economy, aber schwacher Startschaden."
  }
} as const;

const characterOptionsEn = {
  "schrotto-scharfschuss": {
    name: "Schrotto",
    title: "the Sharpshot",
    description: "Loves everything that goes bang from a safe distance. Strong ranged damage, but not the sturdiest potato hero."
  },
  "kloppbert-keulenwucht": {
    name: "Kloppbert",
    title: "the Club Crusher",
    description: "Solves almost every problem with a melee weapon. Massive melee damage and extra health, but slower attack speed."
  },
  "funkenberta-flaemmchen": {
    name: "Funkenberta",
    title: "the Little Flame",
    description: "Throws fire, frost and sparks everywhere. High magic and elemental damage, but little armor."
  },
  "kanni-baldrian": {
    name: "Kanni",
    title: "Baldrian the Biter",
    description: "Looks harmless but chews through whole hordes. Lots of lifesteal and good attack speed, but lower base damage."
  },
  "doktor-knolle": {
    name: "Doctor Knolle",
    title: "the Mender",
    description: "Always carries plasters, tea and a questionable broth. More regeneration and solid health, but less speed."
  },
  "sir-pampel-panzer": {
    name: "Sir Pampel",
    title: "the Tank",
    description: "Wears more metal than sense. Huge health and armor, paid for with mobility and attack speed."
  },
  flitzelotte: {
    name: "Flitzelotte",
    title: "the Turbo Dumpling",
    description: "Already gone before the enemy notices the attack. Lots of speed and dodge, but little health and range."
  },
  "professor-paradox": {
    name: "Professor Paradox",
    title: "the All-rounder",
    description: "Has a theory for everything, and usually a workable solution too. Small advantages in health, damage, speed and economy."
  },
  "rundling-allround": {
    name: "Rundling",
    title: "the Balanced",
    description: "A well-rounded start with small bonuses to health, damage, speed and long-term materials."
  },
  "pruegler-brawler": {
    name: "Pruegler",
    title: "the Brawler",
    description: "High attack speed and dodge with a melee focus, but weak range and ranged stats."
  },
  "jaeger-ranger": {
    name: "Jaeger",
    title: "the Ranger",
    description: "High weapon range, ranged damage and crit, but noticeably less health and melee power."
  },
  "gluecksknolle-lucky": {
    name: "Gluecksknolle",
    title: "the Lucky One",
    description: "Better drops and health pickups, but weaker direct combat."
  },
  "ackerling-farmer": {
    name: "Ackerling",
    title: "the Harvest Hand",
    description: "Strong harvesting and long-term economy, but weak starting damage."
  }
} as const;

export const arenaSurvivorText = {
  de: {
    displayName: "Arena Survivor",
    description: "Ueberlebe in der Arena gegen immer neue Gegner.",
    lobbySetup: {
      title: "Run Setup",
      description: "Lege die Schwierigkeit fest und gib den Run frei.",
      fields: {
        mode: {
          label: "Modus / Mode",
          description: "Wave: Wellen und Shops. Survival: 20 Minuten in der grossen Frostfire-Welt.",
          options: {
            wave: { label: "Wave" },
            survival: { label: "Survival · Frostfire Saga" }
          }
        },
        visualTheme: {
          label: "Art Design",
          description: "Waehle das komplette visuelle Set fuer Map, Figuren, Gegner und Ausruestung.",
          options: {
            "marshmallow-mayhem": {
              label: "Marshmallow Mayhem",
              description: "Geroestete Aquarellwelt mit lebendigen Wide-Rigs, Blickanimation und suessen Monstern."
            },
            "frostfire-saga": {
              label: "Frostfire Saga",
              description: "Handgemalte nordische Storybook-Welt mit Eis, Glut, Runen und geschnitztem Holz."
            },
            "obsidian-relay": {
              label: "Obsidian Relay",
              description: "Detaillierte Sci-Fi-Ruinen, Plasma, Kupfer und schwarzes Metall."
            },
            classic: {
              label: "Classic Arena",
              description: "Das bisherige warme, organische Arena-Design."
            }
          }
        },
        difficulty: {
          label: "Schwierigkeit",
          description: "Gefahr 1 bis 5."
        }
      },
      confirmation: {
        label: "Run freigeben",
        description: "Startet automatisch, sobald alle Spieler bereit sind."
      }
    },
    playerSetup: {
      title: "Charakterwahl",
      description: "Waehle deinen Charakter fuer den Run.",
      options: characterOptionsDe
    }
  },
  en: {
    displayName: "Arena Survivor",
    description: "Survive in the arena against endless waves of enemies.",
    lobbySetup: {
      title: "Run Setup",
      description: "Set the difficulty and approve the run.",
      fields: {
        mode: {
          label: "Mode",
          description: "Wave: waves and shops. Survival: 20 minutes in the large Frostfire world.",
          options: {
            wave: { label: "Wave" },
            survival: { label: "Survival · Frostfire Saga" }
          }
        },
        visualTheme: {
          label: "Art style",
          description: "Choose the complete visual set for map, characters, enemies and gear.",
          options: {
            "marshmallow-mayhem": {
              label: "Marshmallow Mayhem",
              description: "Roasted watercolor world with lively wide rigs, look animation and sweet monsters."
            },
            "frostfire-saga": {
              label: "Frostfire Saga",
              description: "Hand-painted nordic storybook world with ice, embers, runes and carved wood."
            },
            "obsidian-relay": {
              label: "Obsidian Relay",
              description: "Detailed sci-fi ruins, plasma, copper and black metal."
            },
            classic: {
              label: "Classic Arena",
              description: "The previous warm, organic arena design."
            }
          }
        },
        difficulty: {
          label: "Difficulty",
          description: "Danger 1 to 5."
        }
      },
      confirmation: {
        label: "Approve run",
        description: "Starts automatically once all players are ready."
      }
    },
    playerSetup: {
      title: "Choose your character",
      description: "Choose your character for the run.",
      options: characterOptionsEn
    }
  }
} as const satisfies LocalizedGameTextMap;
