import type { LocalizedGameTextMap } from "../../../i18n/text.js";

const spellOptionsDe = {
  fire_bolt: { name: "Feuerstich", description: "Roter Strich von unten nach oben. Schleudert einen direkten Feuerangriff." },
  flame_drop: { name: "Flammenfall", description: "Roter Strich von oben nach unten. Laesst Feuer auf den Gegner fallen." },
  fire_wall: { name: "Feuerwand", description: "Rotes Dreieck. Verstaerkt nachfolgende Angriffszauber 10 Sekunden lang." },
  ember_orb: { name: "Glutkreis", description: "Roter Kreis. Schleudert eine langsamere Glutkugel." },
  meteor_square: { name: "Magmaquadrat", description: "Rotes Viereck. Ein schwerer Einschlag, der auch Mana verbrennt." },
  burn_spiral: { name: "Brandspirale", description: "Rote Spirale. Entzuendet den Gegner ueber Zeit." },
  scarlet_lightning: { name: "Scharlachblitz", description: "Roter Blitz. Sehr schneller, harter Angriff." },
  rift_cleave: { name: "Rissklinge", description: "Rotes Dreieck mit Strich. Durchschneidet einen Teil des Schilds." },
  arcane_bolt: { name: "Arkanstich", description: "Blauer Strich von unten nach oben. Ein schneller, guenstiger Arkanangriff." },
  frost_ward: { name: "Frostsenke", description: "Blauer Strich von oben nach unten. Erzeugt einen kurzen Schutz." },
  shield: { name: "Dreiecksschild", description: "Blaues Dreieck. Erzeugt eine Schutzblase um deinen Charakter." },
  mana_surge: { name: "Manakreis", description: "Blauer Kreis. Laedt Mana wieder auf." },
  mirror_square: { name: "Spiegelquadrat", description: "Blaues Viereck. Erzeugt einen stabilen, laengeren Schild." },
  mana_triplet: { name: "Manatrio", description: "Drei blaue Kreise. Stellt Mana wieder her und drueckt laufende Abklingzeiten." },
  null_cross: { name: "Nullkreuz", description: "Blaues Kreuz. Trifft kaum, raubt dem Gegner aber Mana." },
  tide_barrier: { name: "Wellenbarriere", description: "Blaue Welle. Reinigt Schaden ueber Zeit und schuetzt kurz." },
  thorn_lance: { name: "Dornenstich", description: "Gruener Strich von unten nach oben. Ein leichter Naturangriff." },
  heal: { name: "Gruener Rueckfluss", description: "Gruener Strich von oben nach unten. Stellt sofort Leben wieder her." },
  vine_wall: { name: "Rankenwall", description: "Gruenes Dreieck. Ein schwacher, laengerer Schutz." },
  clover_bloom: { name: "Kleebluete", description: "Drei gruene Kreise. Heilt sofort und dann weiter ueber Zeit." },
  poison_spiral: { name: "Giftspirale", description: "Gruene Spirale. Laesst den Gegner ueber Zeit Leben verlieren." },
  root_snare: { name: "Wurzelzacke", description: "Gruener Zickzack. Trifft leicht und stoert gegnerisches Mana." },
  verdant_chevron: { name: "Naturfokus", description: "Gruenes Chevron. Heilt leicht und beschleunigt deine Mana-Regeneration." },
  regeneration: { name: "Lebenskreis", description: "Gruener Kreis. Stellt Leben ueber 20 Sekunden wieder her." }
} as const;

const spellOptionsEn = {
  fire_bolt: { name: "Firebolt", description: "Red stroke, bottom to top. Hurls a direct fire attack." },
  flame_drop: { name: "Flamefall", description: "Red stroke, top to bottom. Drops fire onto the opponent." },
  fire_wall: { name: "Firewall", description: "Red triangle. Boosts subsequent attack spells for 10 seconds." },
  ember_orb: { name: "Ember Orb", description: "Red circle. Hurls a slower ember ball." },
  meteor_square: { name: "Magma Square", description: "Red square. A heavy impact that also burns mana." },
  burn_spiral: { name: "Burn Spiral", description: "Red spiral. Ignites the opponent over time." },
  scarlet_lightning: { name: "Scarlet Bolt", description: "Red lightning. A very fast, hard attack." },
  rift_cleave: { name: "Riftblade", description: "Red triangle with stroke. Cuts through part of the shield." },
  arcane_bolt: { name: "Arcane Bolt", description: "Blue stroke, bottom to top. A fast, cheap arcane attack." },
  frost_ward: { name: "Frost Dip", description: "Blue stroke, top to bottom. Creates brief protection." },
  shield: { name: "Triangle Shield", description: "Blue triangle. Creates a protective bubble around your character." },
  mana_surge: { name: "Mana Circle", description: "Blue circle. Recharges mana." },
  mirror_square: { name: "Mirror Square", description: "Blue square. Creates a stable, longer-lasting shield." },
  mana_triplet: { name: "Mana Trio", description: "Three blue circles. Restores mana and shortens running cooldowns." },
  null_cross: { name: "Null Cross", description: "Blue cross. Barely hits, but steals the opponent's mana." },
  tide_barrier: { name: "Tide Barrier", description: "Blue wave. Cleanses damage over time and shields briefly." },
  thorn_lance: { name: "Thorn Lance", description: "Green stroke, bottom to top. A light nature attack." },
  heal: { name: "Green Reflow", description: "Green stroke, top to bottom. Instantly restores health." },
  vine_wall: { name: "Vine Wall", description: "Green triangle. A weak, longer-lasting protection." },
  clover_bloom: { name: "Clover Bloom", description: "Three green circles. Heals instantly and keeps healing over time." },
  poison_spiral: { name: "Poison Spiral", description: "Green spiral. Makes the opponent lose health over time." },
  root_snare: { name: "Root Snag", description: "Green zigzag. Hits lightly and disrupts enemy mana." },
  verdant_chevron: { name: "Nature Focus", description: "Green chevron. Heals lightly and speeds up your mana regeneration." },
  regeneration: { name: "Circle of Life", description: "Green circle. Restores health over 20 seconds." }
} as const;

export const magicDuellText = {
  de: {
    displayName: "Magic Duell",
    description: "Statisches 3D-Magierduell mit gezeichneten Handy-Zaubern.",
    playerSetup: {
      title: "Spells waehlen",
      description: "Waehle die Zauber, die auf deinem Handy-Controller verfuegbar sein sollen.",
      readyBlockedLabel: "Erst Spells waehlen",
      options: spellOptionsDe
    }
  },
  en: {
    displayName: "Magic Duel",
    description: "Arena-style 3D wizard duel with phone-drawn spells.",
    playerSetup: {
      title: "Choose spells",
      description: "Choose the spells available on your phone controller.",
      readyBlockedLabel: "Choose spells first",
      options: spellOptionsEn
    }
  }
} as const satisfies LocalizedGameTextMap;
