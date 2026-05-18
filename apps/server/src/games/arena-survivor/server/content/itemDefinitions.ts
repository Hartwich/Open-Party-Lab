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
    maxLevel: 3,
    tags: [
      "offense",
      "attack-speed",
      "glass-cannon",
    ],
    description: "Deutlich mehr Angriffstempo, aber schwaechere Defensive.",
    levels: [
      {
        level: 1,
        cost: 7,
        description: "+10% Angriffstempo, -1 Ruestung",
        modifiers: {
          attackSpeedPct: 10,
          armor: -1,
        },
      },
      {
        level: 2,
        cost: 12,
        description: "+22% Angriffstempo, -2 Ruestung",
        modifiers: {
          attackSpeedPct: 18.04,
          armor: -2,
        },
      },
      {
        level: 3,
        cost: 19,
        description: "+36% Angriffstempo, -4 Ruestung",
        modifiers: {
          attackSpeedPct: 29.52,
          armor: -4,
        },
      },
    ],
  },
  {
    id: "glass-eye",
    name: "Glasauge",
    maxLevel: 3,
    tags: [
      "offense",
      "crit",
      "glass-cannon",
    ],
    description: "Staerkt Crit-Chance und Crit-Schaden, senkt aber das Lebenspolster.",
    levels: [
      {
        level: 1,
        cost: 8,
        description: "+4% Crit, +12% Crit-Schaden, -6 HP",
        modifiers: {
          critChancePct: 4,
          critDamagePct: 12,
          maxHp: -6,
        },
      },
      {
        level: 2,
        cost: 12,
        description: "+8% Crit, +26% Crit-Schaden, -12 HP",
        modifiers: {
          critChancePct: 8,
          critDamagePct: 26,
          maxHp: -12,
        },
      },
      {
        level: 3,
        cost: 18,
        description: "+14% Crit, +42% Crit-Schaden, -20 HP",
        modifiers: {
          critChancePct: 11.9,
          critDamagePct: 42,
          maxHp: -20,
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
          damagePct: -18,
        },
      },
      {
        level: 2,
        cost: 15,
        description: "+1 Projektil, +10% Angriffstempo, -12% Schaden",
        modifiers: {
          projectileCount: 1,
          attackSpeedPct: 10,
          damagePct: -18,
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
    maxLevel: 3,
    tags: [
      "mobility",
      "kiting",
      "fragile",
    ],
    description: "Mehr Bewegungstempo auf Kosten von Max HP.",
    levels: [
      {
        level: 1,
        cost: 6,
        description: "+8% Tempo, -4 HP",
        modifiers: {
          moveSpeedPct: 8,
          maxHp: -4,
        },
      },
      {
        level: 2,
        cost: 10,
        description: "+16% Tempo, -8 HP",
        modifiers: {
          moveSpeedPct: 16,
          maxHp: -8,
        },
      },
      {
        level: 3,
        cost: 15,
        description: "+28% Tempo, -14 HP",
        modifiers: {
          moveSpeedPct: 28,
          maxHp: -14,
        },
      },
    ],
  },
  {
    id: "scope-lens",
    name: "Zieloptik",
    maxLevel: 3,
    tags: [
      "ranged",
      "specialist",
      "precision",
    ],
    description: "Verstaerkt Fernkampf deutlich, schwaecht aber Nahkampf.",
    levels: [
      {
        level: 1,
        cost: 8,
        description: "+10% Fernkampf, -6% Nahkampf",
        modifiers: {
          rangedPowerPct: 10,
          meleePowerPct: -6,
        },
      },
      {
        level: 2,
        cost: 12,
        description: "+22% Fernkampf, -12% Nahkampf",
        modifiers: {
          rangedPowerPct: 22,
          meleePowerPct: -12,
        },
      },
      {
        level: 3,
        cost: 17,
        description: "+36% Fernkampf, -18% Nahkampf",
        modifiers: {
          rangedPowerPct: 36,
          meleePowerPct: -18,
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
    maxLevel: 3,
    tags: [
      "hybrid",
      "sustain",
      "on-hit",
    ],
    description: "Gibt Lifesteal und Sustain, reduziert aber den Rohschaden etwas.",
    levels: [
      {
        level: 1,
        cost: 8,
        description: "+0.2% Lifesteal, -3% Schaden",
        modifiers: {
          lifeStealPct: 0.2,
          damagePct: -3,
        },
      },
      {
        level: 2,
        cost: 12,
        description: "+0.4% Lifesteal, -6% Schaden",
        modifiers: {
          lifeStealPct: 0.4,
          damagePct: -6,
        },
      },
      {
        level: 3,
        cost: 18,
        description: "+0.6% Lifesteal, -10% Schaden",
        modifiers: {
          lifeStealPct: 0.595,
          damagePct: -10,
        },
      },
    ],
  },
  {
    id: "magnet-core",
    name: "Magnetkern",
    maxLevel: 3,
    tags: [
      "utility",
      "pickup",
      "greedy",
    ],
    description: "Vergroessert die Sammelreichweite deutlich, kostet aber etwas Rohschaden.",
    iconPath: "/arena-survivor/item-icons/magnet-core.svg",
    levels: [
      {
        level: 1,
        cost: 6,
        description: "+25% Sammelradius, -4% Schaden",
        modifiers: {
          pickupRadiusPct: 25,
          damagePct: -4,
        },
      },
      {
        level: 2,
        cost: 10,
        description: "+55% Sammelradius, -8% Schaden",
        modifiers: {
          pickupRadiusPct: 55,
          damagePct: -8,
        },
      },
      {
        level: 3,
        cost: 15,
        description: "+90% Sammelradius, -12% Schaden",
        modifiers: {
          pickupRadiusPct: 90,
          damagePct: -12,
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
    maxLevel: 3,
    tags: [
      "projectile",
      "pierce",
      "glass-cannon",
    ],
    description: "Gibt Projektilen mehr Durchschlag, drueckt dafuer den Rohschaden.",
    iconPath: "/arena-survivor/item-icons/drill-core.svg",
    levels: [
      {
        level: 1,
        cost: 8,
        description: "+1 Pierce, -6% Schaden",
        modifiers: {
          pierce: 1,
          damagePct: -6,
        },
      },
      {
        level: 2,
        cost: 13,
        description: "+1 Pierce, +6% Angriffstempo, -10% Schaden",
        modifiers: {
          pierce: 1,
          attackSpeedPct: 6,
          damagePct: -10,
        },
      },
      {
        level: 3,
        cost: 18,
        description: "+2 Pierce, +10% Angriffstempo, -14% Schaden",
        modifiers: {
          pierce: 2,
          attackSpeedPct: 10,
          damagePct: -14,
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
        description: "+0.2% Lifesteal, +1 Ruestung, -3% Tempo",
        modifiers: {
          lifeStealPct: 0.2,
          armor: 1,
          moveSpeedPct: -3,
        },
      },
      {
        level: 2,
        cost: 12,
        description: "+0.4% Lifesteal, +2 Ruestung, -6% Tempo",
        modifiers: {
          lifeStealPct: 0.4,
          armor: 2,
          moveSpeedPct: -6,
        },
      },
      {
        level: 3,
        cost: 18,
        description: "+0.7% Lifesteal, +4 Ruestung, -9% Tempo",
        modifiers: {
          lifeStealPct: 0.7,
          armor: 4,
          moveSpeedPct: -9,
        },
      },
    ],
  },
] as const satisfies readonly ArenaSurvivorItemDefinition[];

export const arenaSurvivorItemDefinitionsById = Object.fromEntries(
  arenaSurvivorItemDefinitions.map((item) => [item.id, item])
) satisfies Record<string, ArenaSurvivorItemDefinition>;
