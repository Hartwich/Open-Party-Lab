import type { ShopOfferModel } from "../../layouts/models.js";

interface ShopBlueprint {
  id: string;
  kind: ShopOfferModel["kind"];
  title: string;
  description: string;
  cost: number;
  summary: string;
  targetLevel: number;
}

const SHOP_BLUEPRINTS: ShopBlueprint[] = [
  { id: "starter-blaster", kind: "weapon", title: "Starter Blaster", description: "Solider Grundschuss fuer konstante Runs.", cost: 12, summary: "Balanced opener", targetLevel: 1 },
  { id: "survivor-pistol", kind: "weapon", title: "Ueberlebenspistole", description: "Klassische Fernkampfwaffe mit vernuenftigem Tempo.", cost: 18, summary: "Reliable ranged", targetLevel: 1 },
  { id: "coil-rifle", kind: "weapon", title: "Spulenkarabiner", description: "Praeziser Magnetschuss mit hoher Projektilgeschwindigkeit.", cost: 22, summary: "Precision pierce", targetLevel: 1 },
  { id: "scrap-smg", kind: "weapon", title: "Schrott-SMG", description: "Viele kleine Treffer, stark mit Tempo.", cost: 24, summary: "Fast fire rate", targetLevel: 1 },
  { id: "gear-launcher", kind: "weapon", title: "Zahnradwerfer", description: "Schrotschuss aus Schrottzahnraedern fuer kurze Distanz.", cost: 24, summary: "Short burst", targetLevel: 1 },
  { id: "ember-wand", kind: "weapon", title: "Glutstab", description: "Magischer Feuerangriff mit sauberer Reichweite.", cost: 22, summary: "Elemental ranged", targetLevel: 1 },
  { id: "frost-orb", kind: "weapon", title: "Frostorb", description: "Kontrollierter Schuss mit sicherem Schadensprofil.", cost: 22, summary: "Control weapon", targetLevel: 1 },
  { id: "spark-rod", kind: "weapon", title: "Blitzfunke", description: "Sehr schnell, ideal fuer aggressive Builds.", cost: 26, summary: "High tempo", targetLevel: 1 },
  { id: "venom-siphon", kind: "weapon", title: "Giftsiphon", description: "Schnelle Giftmagie fuer aggressive Kite-Builds.", cost: 22, summary: "Poison tempo", targetLevel: 1 },
  { id: "prism-scepter", kind: "weapon", title: "Prismenzepter", description: "Schwere Arkanschuesse mit starker Crit-Skalierung.", cost: 24, summary: "Magic crit burst", targetLevel: 1 },
  { id: "hunter-bow", kind: "weapon", title: "Jagdbogen", description: "Langsam, praezise und mit hohem Einzelschaden.", cost: 30, summary: "Precision burst", targetLevel: 1 },
  { id: "twin-daggers", kind: "weapon", title: "Doppeldolche", description: "Schnell und bissig fuer On-Hit-Setups.", cost: 20, summary: "Melee speed", targetLevel: 1 },
  { id: "war-hammer", kind: "weapon", title: "Kriegshammer", description: "Langsam, hart und sehr stabil im Burst.", cost: 34, summary: "Heavy burst", targetLevel: 1 },
  { id: "mushroom-cap", kind: "item", title: "Dicke Pilzkappe", description: "Mehr Leben auf Kosten von etwas Rohschaden.", cost: 14, summary: "+HP, -Damage", targetLevel: 1 },
  { id: "iron-shell", kind: "item", title: "Eisenpanzer", description: "Mehr Ruestung, aber etwas langsamer.", cost: 16, summary: "+Armor, -Speed", targetLevel: 1 },
  { id: "heavy-coat", kind: "item", title: "Dicke Jacke", description: "HP und Ruestung, mit etwas weniger Angriffstempo.", cost: 18, summary: "Tank hybrid", targetLevel: 1 },
  { id: "stone-heart", kind: "item", title: "Steinkern", description: "Sehr tankig, dafuer langsamer und schwerfaelliger.", cost: 24, summary: "Slow tank", targetLevel: 1 },
  { id: "power-bracelet", kind: "item", title: "Kraftarmband", description: "Mehr Schaden, dafuer etwas weniger Beweglichkeit.", cost: 16, summary: "+Damage, -Speed", targetLevel: 1 },
  { id: "berserker-feather", kind: "item", title: "Berserkerfeder", description: "Mehr Angriffstempo, aber fragiler.", cost: 18, summary: "+Attack speed", targetLevel: 1 },
  { id: "glass-eye", kind: "item", title: "Glasauge", description: "Crit-Skalierung fuer riskante Glaskanonen.", cost: 20, summary: "Crit build", targetLevel: 1 },
  { id: "trigger-glove", kind: "item", title: "Schusshandschuh", description: "Mehr Projektile und Tempo, weniger Rohschaden.", cost: 22, summary: "Projectile focus", targetLevel: 1 },
  { id: "runner-boots", kind: "item", title: "Laeuferstiefel", description: "Mehr Tempo, aber weniger HP.", cost: 15, summary: "Kiting speed", targetLevel: 1 },
  { id: "scope-lens", kind: "item", title: "Zieloptik", description: "Staerkt Fernkampf, schwaecht Nahkampf.", cost: 18, summary: "Ranged specialist", targetLevel: 1 },
  { id: "arcane-crystal", kind: "item", title: "Arkankristall", description: "Mehr Magie und Elementar, dafuer fragiler.", cost: 24, summary: "Magic boost", targetLevel: 1 },
  { id: "vampire-brooch", kind: "item", title: "Vampirbrosche", description: "Lifesteal und Sustain fuer laengere Runs.", cost: 20, summary: "Sustain", targetLevel: 1 },
  { id: "magnet-core", kind: "item", title: "Magnetkern", description: "Mehr Sammelradius auf Kosten von Rohschaden.", cost: 14, summary: "Pickup greed", targetLevel: 1 },
  { id: "herbal-bandage", kind: "item", title: "Kraeuterverband", description: "Mehr Regeneration und HP, aber etwas langsamer.", cost: 16, summary: "Regen sustain", targetLevel: 1 },
  { id: "drill-core", kind: "item", title: "Bohrkern", description: "Mehr Durchschlag fuer Projektile, dafuer weniger Rohschaden.", cost: 18, summary: "Pierce focus", targetLevel: 1 },
  { id: "duelist-ribbon", kind: "item", title: "Duellschleife", description: "Crit und Tempo fuer fragilere Offensiv-Builds.", cost: 18, summary: "Crit tempo", targetLevel: 1 },
  { id: "thorn-chain", kind: "item", title: "Dornkette", description: "Lifesteal und Ruestung, dafuer etwas weniger Tempo.", cost: 18, summary: "Tank sustain", targetLevel: 1 }
];

function hashSeed(seed: number, index: number): number {
  return (Math.imul(seed ^ (index + 1), 1_664_525) + 1_013_904_223) >>> 0;
}

function shuffleBySeed<T>(items: T[], seed: number): T[] {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const mix = hashSeed(seed, index);
    const swapIndex = mix % (index + 1);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

export function buildArenaSurvivorShopOffers(
  waveNumber: number,
  materials: number,
  activeLoadout?: {
    weapon?: { weaponId: string; level: number };
    items?: Array<{ itemId: string; level: number }>;
  }
): ShopOfferModel[] {
  const seed = Math.max(1, waveNumber) * 97 + Math.max(0, materials) * 13;
  const shuffled = shuffleBySeed(SHOP_BLUEPRINTS, seed);
  const selected = shuffled.slice(0, 7);

  return selected.map((blueprint) => {
    const purchased =
      blueprint.kind === "weapon"
        ? activeLoadout?.weapon?.weaponId === blueprint.id && (activeLoadout.weapon.level ?? 0) >= blueprint.targetLevel
        : activeLoadout?.items?.some(
            (item) => item.itemId === blueprint.id && (item.level ?? 0) >= blueprint.targetLevel
          ) ?? false;

    return {
      id: blueprint.id,
      kind: blueprint.kind,
      title: blueprint.title,
      description: blueprint.description,
      cost: blueprint.cost,
      affordable: materials >= blueprint.cost,
      purchased,
      targetLevel: blueprint.targetLevel,
      summary: blueprint.summary
    };
  });
}
