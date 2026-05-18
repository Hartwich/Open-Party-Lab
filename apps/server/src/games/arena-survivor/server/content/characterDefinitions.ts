import type { ArenaSurvivorCharacterDefinition } from "./types.js";

export const arenaSurvivorCharacterDefinitions = [
  {
    id: "schrotto-scharfschuss",
    name: "Schrotto",
    title: "der Scharfschuss",
    archetype: "ranged",
    description:
      "Liebt alles, was aus sicherer Entfernung laut wird. Starker Fernschaden, aber nicht der robusteste Kartoffelheld.",
    modifiers: {
      rangedPowerPct: 28,
      critChancePct: 6,
      moveSpeedPct: 4,
      maxHp: -10,
      armor: -1,
      meleePowerPct: -12
    },
    visual: {
      primaryColor: "#d2b08a",
      secondaryColor: "#4e9eff",
      accentColor: "#1f3d7a"
    }
  },
  {
    id: "kloppbert-keulenwucht",
    name: "Kloppbert",
    title: "die Keulenwucht",
    archetype: "melee",
    description:
      "Loest fast jedes Problem mit einer Nahkampfwaffe. Massiver Nahkampfschaden und etwas mehr Leben, aber weniger Angriffstempo.",
    modifiers: {
      meleePowerPct: 30,
      maxHp: 12,
      armor: 1,
      attackSpeedPct: -10,
      rangedPowerPct: -10
    },
    visual: {
      primaryColor: "#c89d72",
      secondaryColor: "#d44f42",
      accentColor: "#7d241d"
    }
  },
  {
    id: "funkenberta-flaemmchen",
    name: "Funkenberta",
    title: "das Flaemmchen",
    archetype: "magic",
    description:
      "Wirft Feuer, Frost und Funken durch die Gegend. Hoher Magie- und Elementarschaden, aber wenig Ruestung.",
    modifiers: {
      magicPowerPct: 22,
      elementalPowerPct: 24,
      attackSpeedPct: 6,
      armor: -2,
      maxHp: -6
    },
    visual: {
      primaryColor: "#d6b58e",
      secondaryColor: "#9a68ff",
      accentColor: "#ff7a45"
    }
  },
  {
    id: "kanni-baldrian",
    name: "Kanni",
    title: "Baldrian der Bissige",
    archetype: "lifesteal",
    description:
      "Sieht harmlos aus, knabbert sich aber durch ganze Horden. Viel Lebensraub und gutes Angriffstempo, dafuer weniger Grundschaden.",
    modifiers: {
      lifeStealPct: 0.8,
      attackSpeedPct: 14,
      damagePct: -8,
      armor: -1,
      maxHp: -4
    },
    visual: {
      primaryColor: "#cda47a",
      secondaryColor: "#67c96f",
      accentColor: "#2f6a33"
    }
  },
  {
    id: "doktor-knolle",
    name: "Doktor Knolle",
    title: "der Nachheiler",
    archetype: "regen",
    description:
      "Hat immer Pflaster, Tee und eine fragwuerdige Bruehe dabei. Mehr Regeneration und ordentliches Leben, dafuer weniger Tempo.",
    modifiers: {
      hpRegen: 2.5,
      maxHp: 18,
      moveSpeedPct: -8,
      attackSpeedPct: -4
    },
    visual: {
      primaryColor: "#d8b894",
      secondaryColor: "#ffffff",
      accentColor: "#3f8f5a"
    }
  },
  {
    id: "sir-pampel-panzer",
    name: "Sir Pampel",
    title: "der Panzer",
    archetype: "tank",
    description:
      "Traegt mehr Metall als Vernunft. Sehr viel Leben und Ruestung, bezahlt aber mit Mobilitaet und Angriffstempo.",
    modifiers: {
      maxHp: 26,
      armor: 4,
      moveSpeedPct: -14,
      attackSpeedPct: -10
    },
    visual: {
      primaryColor: "#b9c2cf",
      secondaryColor: "#8c98aa",
      accentColor: "#4a5568"
    }
  },
  {
    id: "flitzelotte",
    name: "Flitzelotte",
    title: "der Turboknoedel",
    archetype: "speed",
    description:
      "Ist schon weg, bevor der Gegner den Angriff bemerkt. Viel Bewegung und Angriffsgeschwindigkeit, aber wenig Leben.",
    modifiers: {
      moveSpeedPct: 18,
      attackSpeedPct: 16,
      maxHp: -12,
      armor: -2
    },
    visual: {
      primaryColor: "#deb98f",
      secondaryColor: "#ffd84f",
      accentColor: "#e86a2e"
    }
  },
  {
    id: "professor-paradox",
    name: "Professor Paradox",
    title: "der Alles-ein-bisschen",
    archetype: "hybrid",
    description:
      "Hat zu allem eine Theorie und meistens auch eine fragwuerdige Loesung. Solider Hybrid mit leicht mehr Projektilen, aber ohne Extremwerte.",
    modifiers: {
      damagePct: 8,
      projectileCount: 1,
      meleePowerPct: 8,
      rangedPowerPct: 8,
      magicPowerPct: 8,
      elementalPowerPct: 8,
      maxHp: -4,
      armor: -1
    },
    visual: {
      primaryColor: "#d2ae85",
      secondaryColor: "#5ed0c6",
      accentColor: "#375c88"
    }
  }
] as const satisfies readonly ArenaSurvivorCharacterDefinition[];

export const arenaSurvivorCharacterDefinitionsById = Object.fromEntries(
  arenaSurvivorCharacterDefinitions.map((character) => [character.id, character])
) satisfies Record<string, ArenaSurvivorCharacterDefinition>;
