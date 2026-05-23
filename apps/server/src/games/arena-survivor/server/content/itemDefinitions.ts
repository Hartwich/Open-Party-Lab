import type { ArenaSurvivorItemDefinition } from "./types.js";

export const arenaSurvivorItemDefinitions = [
  {
    id: "mushroom-cap",
    name: "Dicke Pilzkappe",
    maxLevel: 3,
    tags: [
      "defense",
      "health",
      "starter-safe",
    ],
    description: "Mehr Leben auf Kosten von etwas Rohschaden.",
    levels: [
      {
        level: 1,
        cost: 6,
        description: "+15 Max HP, -4% Schaden",
        modifiers: {
          maxHp: 15,
          damagePct: -4,
        },
      },
      {
        level: 2,
        cost: 9,
        description: "+30 Max HP, -8% Schaden",
        modifiers: {
          maxHp: 30,
          damagePct: -8,
        },
      },
      {
        level: 3,
        cost: 13,
        description: "+50 Max HP, -12% Schaden",
        modifiers: {
          maxHp: 50,
          damagePct: -12,
        },
      },
    ],
  },
  {
    id: "iron-shell",
    name: "Eisenpanzer",
    maxLevel: 3,
    tags: [
      "defense",
      "armor",
      "slow",
    ],
    description: "Mehr Ruestung, aber etwas weniger Bewegungstempo.",
    levels: [
      {
        level: 1,
        cost: 7,
        description: "+2 Ruestung, -4% Tempo",
        modifiers: {
          armor: 2,
          moveSpeedPct: -4,
        },
      },
      {
        level: 2,
        cost: 11,
        description: "+4 Ruestung, -8% Tempo",
        modifiers: {
          armor: 4,
          moveSpeedPct: -8,
        },
      },
      {
        level: 3,
        cost: 19,
        description: "+7 Ruestung, -12% Tempo",
        modifiers: {
          armor: 7,
          moveSpeedPct: -12,
        },
      },
    ],
  },
  {
    id: "heavy-coat",
    name: "Dicke Jacke",
    maxLevel: 3,
    tags: [
      "defense",
      "hybrid",
      "armor",
    ],
    description: "Kombiniert HP und Ruestung, bremst aber das Angriffstempo.",
    levels: [
      {
        level: 1,
        cost: 8,
        description: "+10 HP, +1 Ruestung, -4% Angriffstempo",
        modifiers: {
          maxHp: 10,
          armor: 1,
          attackSpeedPct: -4,
        },
      },
      {
        level: 2,
        cost: 12,
        description: "+22 HP, +2 Ruestung, -8% Angriffstempo",
        modifiers: {
          maxHp: 22,
          armor: 2,
          attackSpeedPct: -8,
        },
      },
      {
        level: 3,
        cost: 17,
        description: "+38 HP, +4 Ruestung, -12% Angriffstempo",
        modifiers: {
          maxHp: 38,
          armor: 4,
          attackSpeedPct: -12,
        },
      },
    ],
  },
  {
    id: "stone-heart",
    name: "Steinkern",
    maxLevel: 3,
    tags: [
      "defense",
      "tank",
      "slow",
    ],
    description: "Sehr tankig, aber auf Kosten von Mobilitaet und Angriffsfluss.",
    levels: [
      {
        level: 1,
        cost: 9,
        description: "+12 HP, +2 Ruestung, -3% Tempo, -3% Angriffstempo",
        modifiers: {
          maxHp: 12,
          armor: 2,
          moveSpeedPct: -3,
          attackSpeedPct: -3,
        },
      },
      {
        level: 2,
        cost: 14,
        description: "+28 HP, +4 Ruestung, -6% Tempo, -6% Angriffstempo",
        modifiers: {
          maxHp: 28,
          armor: 4,
          moveSpeedPct: -6,
          attackSpeedPct: -6,
        },
      },
      {
        level: 3,
        cost: 21,
        description: "+50 HP, +6 Ruestung, -10% Tempo, -10% Angriffstempo",
        modifiers: {
          maxHp: 50,
          armor: 6,
          moveSpeedPct: -10,
          attackSpeedPct: -10,
        },
      },
    ],
  },
  {
    id: "power-bracelet",
    name: "Kraftarmband",
    maxLevel: 3,
    tags: [
      "offense",
      "damage",
      "slow",
    ],
    description: "Mehr Schaden, dafuer geringere Beweglichkeit.",
    levels: [
      {
        level: 1,
        cost: 6,
        description: "+8% Schaden, -3% Tempo",
        modifiers: {
          damagePct: 8,
          moveSpeedPct: -3,
        },
      },
      {
        level: 2,
        cost: 10,
        description: "+18% Schaden, -6% Tempo",
        modifiers: {
          damagePct: 18,
          moveSpeedPct: -6,
        },
      },
      {
        level: 3,
        cost: 14,
        description: "+30% Schaden, -10% Tempo",
        modifiers: {
          damagePct: 30,
          moveSpeedPct: -10,
        },
      },
    ],
  },
  {
    id: "berserker-feather",
    name: "Berserkerfeder",
    maxLevel: 4,
    tags: [
      "offense",
      "attack-speed",
      "damage-tradeoff",
    ],
    description: "Mehr Angriffstempo gegen etwas Rohschaden.",
    levels: [
      {
        level: 1,
        cost: 7,
        description: "+10% Angriffstempo, -2% Schaden",
        modifiers: {
          attackSpeedPct: 10,
          damagePct: -2,
        },
      },
      {
        level: 2,
        cost: 12,
        description: "+18% Angriffstempo, -4% Schaden",
        modifiers: {
          attackSpeedPct: 18,
          damagePct: -4,
        },
      },
      {
        level: 3,
        cost: 19,
        description: "+28% Angriffstempo, -6% Schaden",
        modifiers: {
          attackSpeedPct: 28,
          damagePct: -6,
        },
      },
      {
        level: 4,
        cost: 30,
        description: "+40% Angriffstempo, -8% Schaden",
        modifiers: {
          attackSpeedPct: 40,
          damagePct: -8,
        },
      },
    ],
  },
  {
    id: "glass-eye",
    name: "Glasauge",
    maxLevel: 4,
    tags: [
      "offense",
      "crit",
      "glass-cannon",
    ],
    description: "Staerkt Crit-Chance und Crit-Schaden mit defensiven Kosten.",
    levels: [
      {
        level: 1,
        cost: 8,
        description: "+6% Crit-Chance, -3% Schaden",
        modifiers: {
          critChancePct: 6,
          damagePct: -3,
        },
      },
      {
        level: 2,
        cost: 12,
        description: "+10% Crit-Chance, -1 Ruestung",
        modifiers: {
          critChancePct: 10,
          armor: -1,
        },
      },
      {
        level: 3,
        cost: 18,
        description: "+15% Crit-Chance, +20% Crit-Schaden, -3 HP",
        modifiers: {
          critChancePct: 15,
          critDamagePct: 20,
          maxHp: -3,
        },
      },
      {
        level: 4,
        cost: 32,
        description: "+22% Crit-Chance, +40% Crit-Schaden, -1 Ruestung, -4 HP",
        modifiers: {
          critChancePct: 22,
          critDamagePct: 40,
          armor: -1,
          maxHp: -4,
        },
      },
    ],
  },
  {
    id: "trigger-glove",
    name: "Schiesshandschuh",
    maxLevel: 3,
    tags: [
      "offense",
      "projectile",
      "ranged",
      "magic",
    ],
    description: "Mehr Projektile und Tempo, dafuer geringerer Rohschaden.",
    levels: [
      {
        level: 1,
        cost: 11,
        description: "+1 Projektil, -8% Schaden",
        modifiers: {
          projectileCount: 1,
          damagePct: -8,
        },
      },
      {
        level: 2,
        cost: 15,
        description: "+1 Projektil, +10% Angriffstempo, -12% Schaden",
        modifiers: {
          projectileCount: 1,
          attackSpeedPct: 10,
          damagePct: -12,
        },
      },
      {
        level: 3,
        cost: 21,
        description: "+2 Projektile, -18% Schaden",
        modifiers: {
          projectileCount: 2,
          damagePct: -18,
        },
      },
    ],
  },
  {
    id: "runner-boots",
    name: "Lauferstiefel",
    maxLevel: 4,
    tags: [
      "mobility",
      "speed",
      "dodge",
    ],
    description: "Mehr Bewegungstempo und Ausweichen, aber weniger Leben.",
    levels: [
      {
        level: 1,
        cost: 6,
        description: "+6% Tempo, +2% Ausweichen, -2 HP",
        modifiers: {
          moveSpeedPct: 6,
          dodgePct: 2,
          maxHp: -2,
        },
      },
      {
        level: 2,
        cost: 10,
        description: "+10% Tempo, +4% Ausweichen, -4 HP",
        modifiers: {
          moveSpeedPct: 10,
          dodgePct: 4,
          maxHp: -4,
        },
      },
      {
        level: 3,
        cost: 15,
        description: "+15% Tempo, +7% Ausweichen, -6 HP",
        modifiers: {
          moveSpeedPct: 15,
          dodgePct: 7,
          maxHp: -6,
        },
      },
      {
        level: 4,
        cost: 29,
        description: "+22% Tempo, +10% Ausweichen, -8 HP",
        modifiers: {
          moveSpeedPct: 22,
          dodgePct: 10,
          maxHp: -8,
        },
      },
    ],
  },
  {
    id: "scope-lens",
    name: "Zieloptik",
    maxLevel: 4,
    tags: [
      "ranged",
      "range",
      "attack-speed-tradeoff",
    ],
    description: "Mehr Waffenreichweite und Fernkampf, dafuer weniger Angriffstempo.",
    levels: [
      {
        level: 1,
        cost: 8,
        description: "+8% Waffenreichweite, -3% Angriffstempo",
        modifiers: {
          weaponRangePct: 8,
          attackSpeedPct: -3,
        },
      },
      {
        level: 2,
        cost: 12,
        description: "+15% Waffenreichweite, +4% Fernkampf, -5% Angriffstempo",
        modifiers: {
          weaponRangePct: 15,
          rangedPowerPct: 4,
          attackSpeedPct: -5,
        },
      },
      {
        level: 3,
        cost: 17,
        description: "+24% Waffenreichweite, +8% Fernkampf, -7% Angriffstempo",
        modifiers: {
          weaponRangePct: 24,
          rangedPowerPct: 8,
          attackSpeedPct: -7,
        },
      },
      {
        level: 4,
        cost: 34,
        description: "+36% Waffenreichweite, +12% Fernkampf, -9% Angriffstempo",
        modifiers: {
          weaponRangePct: 36,
          rangedPowerPct: 12,
          attackSpeedPct: -9,
        },
      },
    ],
  },
  {
    id: "arcane-crystal",
    name: "Arkankristall",
    maxLevel: 3,
    tags: [
      "magic",
      "elemental",
      "specialist",
    ],
    description: "Massiver Bonus auf Magie und Elementar, aber fragiler.",
    levels: [
      {
        level: 1,
        cost: 9,
        description: "+10% Magie, +10% Elementar, -1 Ruestung",
        modifiers: {
          magicPowerPct: 10,
          elementalPowerPct: 10,
          armor: -1,
        },
      },
      {
        level: 2,
        cost: 14,
        description: "+22% Magie, +22% Elementar, -2 Ruestung",
        modifiers: {
          magicPowerPct: 22,
          elementalPowerPct: 22,
          armor: -2,
        },
      },
      {
        level: 3,
        cost: 19,
        description: "+36% Magie, +36% Elementar, -4 Ruestung",
        modifiers: {
          magicPowerPct: 36,
          elementalPowerPct: 36,
          armor: -4,
        },
      },
    ],
  },
  {
    id: "vampire-brooch",
    name: "Vampirbrosche",
    maxLevel: 4,
    tags: [
      "hybrid",
      "sustain",
      "on-hit",
    ],
    description: "Gibt Lifesteal und Schaden, kostet aber Ruestung.",
    levels: [
      {
        level: 1,
        cost: 8,
        description: "+2% Lifesteal, +3% Schaden, -1 Ruestung",
        modifiers: {
          lifeStealPct: 2,
          damagePct: 3,
          armor: -1,
        },
      },
      {
        level: 2,
        cost: 12,
        description: "+4% Lifesteal, +7% Schaden, -1 Ruestung",
        modifiers: {
          lifeStealPct: 4,
          damagePct: 7,
          armor: -1,
        },
      },
      {
        level: 3,
        cost: 18,
        description: "+7% Lifesteal, +12% Schaden, -2 Ruestung",
        modifiers: {
          lifeStealPct: 7,
          damagePct: 12,
          armor: -2,
        },
      },
      {
        level: 4,
        cost: 38,
        description: "+10% Lifesteal, +20% Schaden, -3 Ruestung",
        modifiers: {
          lifeStealPct: 10,
          damagePct: 20,
          armor: -3,
        },
      },
    ],
  },
  {
    id: "magnet-core",
    name: "Magnetkern",
    maxLevel: 4,
    tags: [
      "utility",
      "pickup",
      "luck",
    ],
    description: "Vergroessert die Sammelreichweite und verbessert Drop-Glueck.",
    iconPath: "/arena-survivor/item-icons/magnet-core.svg",
    levels: [
      {
        level: 1,
        cost: 6,
        description: "+25% Sammelradius, +8 Luck",
        modifiers: {
          pickupRadiusPct: 25,
          luck: 8,
        },
      },
      {
        level: 2,
        cost: 10,
        description: "+45% Sammelradius, +16 Luck",
        modifiers: {
          pickupRadiusPct: 45,
          luck: 16,
        },
      },
      {
        level: 3,
        cost: 15,
        description: "+70% Sammelradius, +28 Luck",
        modifiers: {
          pickupRadiusPct: 70,
          luck: 28,
        },
      },
      {
        level: 4,
        cost: 30,
        description: "+100% Sammelradius, +45 Luck",
        modifiers: {
          pickupRadiusPct: 100,
          luck: 45,
        },
      },
    ],
  },
  {
    id: "herbal-bandage",
    name: "Kraeuterverband",
    maxLevel: 3,
    tags: [
      "sustain",
      "regen",
      "slow",
    ],
    description: "Mehr Regeneration und etwas Leben, bremst aber die Bewegung.",
    iconPath: "/arena-survivor/item-icons/herbal-bandage.svg",
    levels: [
      {
        level: 1,
        cost: 7,
        description: "+0.6 Regen, +8 HP, -3% Tempo",
        modifiers: {
          hpRegen: 0.6,
          maxHp: 8,
          moveSpeedPct: -3,
        },
      },
      {
        level: 2,
        cost: 11,
        description: "+1.4 Regen, +16 HP, -6% Tempo",
        modifiers: {
          hpRegen: 1.4,
          maxHp: 16,
          moveSpeedPct: -6,
        },
      },
      {
        level: 3,
        cost: 16,
        description: "+2.4 Regen, +28 HP, -9% Tempo",
        modifiers: {
          hpRegen: 2.4,
          maxHp: 28,
          moveSpeedPct: -9,
        },
      },
    ],
  },
  {
    id: "drill-core",
    name: "Bohrkern",
    maxLevel: 4,
    tags: [
      "economy",
      "harvesting",
      "damage-tradeoff",
    ],
    description: "Langfristige Economy mit schwacherem Direktschaden.",
    iconPath: "/arena-survivor/item-icons/drill-core.svg",
    levels: [
      {
        level: 1,
        cost: 8,
        description: "+8 Harvesting, -2% Schaden",
        modifiers: {
          harvesting: 8,
          damagePct: -2,
        },
      },
      {
        level: 2,
        cost: 13,
        description: "+18 Harvesting, -4% Schaden",
        modifiers: {
          harvesting: 18,
          damagePct: -4,
        },
      },
      {
        level: 3,
        cost: 18,
        description: "+34 Harvesting, -6% Schaden",
        modifiers: {
          harvesting: 34,
          damagePct: -6,
        },
      },
      {
        level: 4,
        cost: 36,
        description: "+55 Harvesting, +10 Luck, -8% Schaden",
        modifiers: {
          harvesting: 55,
          luck: 10,
          damagePct: -8,
        },
      },
    ],
  },
  {
    id: "duelist-ribbon",
    name: "Duellschleife",
    maxLevel: 3,
    tags: [
      "offense",
      "crit",
      "attack-speed",
    ],
    description: "Kombiniert Crit und Angriffstempo, macht den Build aber fragiler.",
    iconPath: "/arena-survivor/item-icons/duelist-ribbon.svg",
    levels: [
      {
        level: 1,
        cost: 8,
        description: "+6% Angriffstempo, +3% Crit, -6 HP",
        modifiers: {
          attackSpeedPct: 6,
          critChancePct: 3,
          maxHp: -6,
        },
      },
      {
        level: 2,
        cost: 13,
        description: "+14% Angriffstempo, +6% Crit, -12 HP",
        modifiers: {
          attackSpeedPct: 14,
          critChancePct: 6,
          maxHp: -12,
        },
      },
      {
        level: 3,
        cost: 19,
        description: "+24% Angriffstempo, +10% Crit, -20 HP",
        modifiers: {
          attackSpeedPct: 24,
          critChancePct: 10,
          maxHp: -20,
        },
      },
    ],
  },
  {
    id: "thorn-chain",
    name: "Dornkette",
    maxLevel: 3,
    tags: [
      "hybrid",
      "sustain",
      "tank",
    ],
    description: "Verbindet Lifesteal und Ruestung, kostet dafuer Bewegungstempo.",
    iconPath: "/arena-survivor/item-icons/thorn-chain.svg",
    levels: [
      {
        level: 1,
        cost: 8,
        description: "+2% Lifesteal, +1 Ruestung, -3% Tempo",
        modifiers: {
          lifeStealPct: 2,
          armor: 1,
          moveSpeedPct: -3,
        },
      },
      {
        level: 2,
        cost: 12,
        description: "+4% Lifesteal, +2 Ruestung, -6% Tempo",
        modifiers: {
          lifeStealPct: 4,
          armor: 2,
          moveSpeedPct: -6,
        },
      },
      {
        level: 3,
        cost: 18,
        description: "+7% Lifesteal, +4 Ruestung, -9% Tempo",
        modifiers: {
          lifeStealPct: 7,
          armor: 4,
          moveSpeedPct: -9,
        },
      },
    ],
  },
  {
    id: "medal",
    name: "Medaille",
    maxLevel: 1,
    tags: [
      "hybrid",
      "max-hp",
      "damage",
      "armor",
      "speed",
    ],
    description: "Kleiner Hybrid-Pick mit HP, Schaden, Ruestung und Tempo gegen Crit.",
    iconPath: "/arena-survivor/item-icons/power-bracelet.svg",
    levels: [
      {
        level: 1,
        cost: 14,
        description: "+3 HP, +3% Schaden, +1 Ruestung, +3% Tempo, -4% Crit-Chance",
        modifiers: {
          maxHp: 3,
          damagePct: 3,
          armor: 1,
          moveSpeedPct: 3,
          critChancePct: -4,
        },
      },
    ],
  },
  {
    id: "blindfold",
    name: "Augenbinde",
    maxLevel: 1,
    tags: [
      "crit",
      "dodge",
      "range-tradeoff",
    ],
    description: "Crit und Ausweichen gegen geringere Waffenreichweite.",
    iconPath: "/arena-survivor/item-icons/glass-eye.svg",
    levels: [
      {
        level: 1,
        cost: 13,
        description: "+5% Crit-Chance, +5% Ausweichen, -8% Waffenreichweite",
        modifiers: {
          critChancePct: 5,
          dodgePct: 5,
          weaponRangePct: -8,
        },
      },
    ],
  },
  {
    id: "lucky-charm",
    name: "Gluecksbringer",
    maxLevel: 1,
    tags: [
      "luck",
      "pickup",
    ],
    description: "Mehr Luck und Sammelkomfort gegen etwas Angriffstempo.",
    iconPath: "/arena-survivor/item-icons/magnet-core.svg",
    levels: [
      {
        level: 1,
        cost: 18,
        description: "+30 Luck, +12% Sammelradius, -4% Angriffstempo",
        modifiers: {
          luck: 30,
          pickupRadiusPct: 12,
          attackSpeedPct: -4,
        },
      },
    ],
  },
  {
    id: "harvest-sprout",
    name: "Erntespross",
    maxLevel: 1,
    tags: [
      "economy",
      "harvesting",
    ],
    description: "Fruehe Economy mit schwachem Startkampf-Tradeoff.",
    iconPath: "/arena-survivor/item-icons/herbal-bandage.svg",
    levels: [
      {
        level: 1,
        cost: 10,
        description: "+15 Harvesting, -5% Schaden",
        modifiers: {
          harvesting: 15,
          damagePct: -5,
        },
      },
    ],
  },
  {
    id: "heavy-bullets",
    name: "Schwere Kugeln",
    maxLevel: 1,
    tags: [
      "ranged",
      "damage",
      "range",
      "attack-speed-tradeoff",
    ],
    description: "Mehr Fernkampf, Schaden und Reichweite gegen Tempo und Crit.",
    iconPath: "/arena-survivor/item-icons/scope-lens.svg",
    levels: [
      {
        level: 1,
        cost: 24,
        description: "+10% Fernkampf, +10% Schaden, +6% Waffenreichweite, -5% Angriffstempo, -5% Crit-Chance",
        modifiers: {
          rangedPowerPct: 10,
          damagePct: 10,
          weaponRangePct: 6,
          attackSpeedPct: -5,
          critChancePct: -5,
        },
      },
    ],
  },
] as const satisfies readonly ArenaSurvivorItemDefinition[];

export const arenaSurvivorItemDefinitionsById = Object.fromEntries(
  arenaSurvivorItemDefinitions.map((item) => [item.id, item])
) satisfies Record<string, ArenaSurvivorItemDefinition>;
