import {
  createBaseRoundState,
  resolveRoundPhaseTimings,
  transitionRoundState,
  type BaseRoundState,
  type ScoreEntry,
  type ServerGame,
  type ServerGameContext
} from "@open-party-lab/game-core";
import type {
  ChaosKommandoExplosionState,
  ChaosKommandoExplosionSourceId,
  ChaosKommandoGravestoneState,
  ChaosKommandoInput,
  ChaosKommandoMercenaryRole,
  ChaosKommandoMercenaryState,
  ChaosKommandoPlayerState,
  ChaosKommandoProjectileState,
  ChaosKommandoState,
  ChaosKommandoTerrainState,
  ChaosKommandoTurnState,
  ChaosKommandoWeaponDefinition,
  ChaosKommandoWeaponId,
  ChaosKommandoWindState,
  SupportedLanguage
} from "@open-party-lab/protocol";
import { chaosKommandoManifest } from "../manifest.js";

const phaseTimings = resolveRoundPhaseTimings(chaosKommandoManifest.phaseDurations);

const terrainWidth = 2_360;
const terrainHeight = 1_260;
const waterlineY = 1_094;
const sampleSpacing = 4;
const mercenaryRadius = 25;
const walkSpeed = 146;
const gravity = 880;
const jumpVelocity = -365;
const turnDurationMs = 25_000;
const chargeWindowMs = 1_400;
const settleDelayMs = 900;
const jumpCooldownMs = 700;
const crosshairDistance = 126;
const deathExplosionRadius = 96;
const deathExplosionDamage = 0;
const deathExplosionCraterDepth = 26;
const deathExplosionDelayMs = 340;
const gravestoneSpawnDelayMs = 280;
const gravestoneRadius = 22;

type RuntimeMercenaryState = ChaosKommandoMercenaryState & {
  moveInputX: number;
  jumpReadyAt: number;
  airborneFromY: number | null;
  deathExploded: boolean;
};

type RuntimeGravestoneState = ChaosKommandoGravestoneState;

interface RuntimePlayerState extends Omit<ChaosKommandoPlayerState, "mercenaries"> {
  mercenaries: RuntimeMercenaryState[];
}

type RuntimeProjectileState = ChaosKommandoProjectileState & {
  damage: number;
  blastRadius: number;
  craterDepth: number;
  gravityScale: number;
  splashColor: string;
  bounceFactor: number;
};

interface RuntimeTurnState extends ChaosKommandoTurnState {
  orderPlayerIds: string[];
}

interface RuntimeDeathSequenceState {
  mercenaryId: string;
  explodeAt: number;
  gravestoneAt: number | null;
}

interface ChaosKommandoRuntimeState
  extends BaseRoundState,
    Omit<
      ChaosKommandoState,
      "players" | "projectiles" | "explosions" | "gravestones" | "turn"
    > {
  players: RuntimePlayerState[];
  projectiles: RuntimeProjectileState[];
  explosions: ChaosKommandoExplosionState[];
  gravestones: RuntimeGravestoneState[];
  turn: RuntimeTurnState;
  seed: number;
  language: SupportedLanguage;
  deathQueueMercenaryIds: string[];
  activeDeathSequence: RuntimeDeathSequenceState | null;
}

const weaponDefinitions: ChaosKommandoWeaponDefinition[] = [
  {
    id: "kicher-bazooka",
    displayName: "Kicher-Bazooka",
    description: "Klassische Rakete mit ordentlichem Crater und viel Schub.",
    iconPath: "/chaos-kommando/weapons/kicher-bazooka.svg",
    accentColor: "#ff935c",
    fireMode: "charged",
    damage: 38,
    blastRadius: 94,
    projectileSpeed: 680,
    gravityScale: 0.68,
    fuseMs: null,
    craterDepth: 56
  },
  {
    id: "enten-granate",
    displayName: "Enten-Granate",
    description: "Springt kurz, wartet frech und reisst dann ein tiefes Loch.",
    iconPath: "/chaos-kommando/weapons/enten-granate.svg",
    accentColor: "#ffd24d",
    fireMode: "charged",
    damage: 46,
    blastRadius: 112,
    projectileSpeed: 560,
    gravityScale: 1.1,
    fuseMs: 1_550,
    craterDepth: 68
  },
  {
    id: "plunder-pistole",
    displayName: "Plunder-Pistole",
    description: "Schneller Direkt-Schuss fuer kleine Gemeinheiten auf Distanz.",
    iconPath: "/chaos-kommando/weapons/plunder-pistole.svg",
    accentColor: "#7dd3fc",
    fireMode: "instant",
    damage: 22,
    blastRadius: 34,
    projectileSpeed: 1_000,
    gravityScale: 0.12,
    fuseMs: null,
    craterDepth: 14
  },
  {
    id: "regenbogen-rakete",
    displayName: "Regenbogen-Rakete",
    description: "Sehr frech, sehr bunt und nur einmal pro Soeldner verfuegbar.",
    iconPath: "/chaos-kommando/weapons/regenbogen-rakete.svg",
    accentColor: "#f472b6",
    fireMode: "charged",
    damage: 62,
    blastRadius: 132,
    projectileSpeed: 760,
    gravityScale: 0.58,
    fuseMs: null,
    craterDepth: 74
  },
  {
    id: "splitter-granate",
    displayName: "Splitter-Granate",
    description: "Huepft kurz und streut beim Einschlag kleine fiese Splitter.",
    iconPath: "/chaos-kommando/weapons/splitter-granate.svg",
    accentColor: "#fb923c",
    fireMode: "charged",
    damage: 34,
    blastRadius: 88,
    projectileSpeed: 545,
    gravityScale: 1.08,
    fuseMs: 1_450,
    craterDepth: 48
  },
  {
    id: "konfetti-schrot",
    displayName: "Konfetti-Schrot",
    description: "Direkter Faecher aus funkelnden Nahkampf-Pellets.",
    iconPath: "/chaos-kommando/weapons/konfetti-schrot.svg",
    accentColor: "#f0abfc",
    fireMode: "instant",
    damage: 13,
    blastRadius: 26,
    projectileSpeed: 980,
    gravityScale: 0.18,
    fuseMs: null,
    craterDepth: 8
  },
  {
    id: "bohrer-rakete",
    displayName: "Bohrer-Rakete",
    description: "Frisst sich knackig ins Gelaende und macht steile Loecher.",
    iconPath: "/chaos-kommando/weapons/bohrer-rakete.svg",
    accentColor: "#a3e635",
    fireMode: "charged",
    damage: 30,
    blastRadius: 78,
    projectileSpeed: 720,
    gravityScale: 0.62,
    fuseMs: null,
    craterDepth: 92
  },
  {
    id: "gummi-huhn",
    displayName: "Gummi-Huhn",
    description: "Springt albern, quiekt gemein und schubst alles vom Hang.",
    iconPath: "/chaos-kommando/weapons/gummi-huhn.svg",
    accentColor: "#fde047",
    fireMode: "charged",
    damage: 26,
    blastRadius: 82,
    projectileSpeed: 600,
    gravityScale: 0.95,
    fuseMs: 1_850,
    craterDepth: 30
  },
  {
    id: "seifenblasen-bombe",
    displayName: "Seifenblasen-Bombe",
    description: "Schwebt weich, platzt breit und pustet Soeldner weg.",
    iconPath: "/chaos-kommando/weapons/seifenblasen-bombe.svg",
    accentColor: "#67e8f9",
    fireMode: "charged",
    damage: 24,
    blastRadius: 118,
    projectileSpeed: 500,
    gravityScale: 0.34,
    fuseMs: 1_900,
    craterDepth: 24
  },
  {
    id: "keks-moerser",
    displayName: "Keks-Moerser",
    description: "Schwerer Bogenwurf mit knusprigem Einschlag von oben.",
    iconPath: "/chaos-kommando/weapons/keks-moerser.svg",
    accentColor: "#d97706",
    fireMode: "charged",
    damage: 42,
    blastRadius: 104,
    projectileSpeed: 470,
    gravityScale: 1.22,
    fuseMs: null,
    craterDepth: 64
  }
];

const weaponTexts: Partial<
  Record<
    SupportedLanguage,
    Partial<Record<ChaosKommandoWeaponId, Pick<ChaosKommandoWeaponDefinition, "displayName" | "description">>>
  >
> = {
  en: {
    "kicher-bazooka": {
      displayName: "Giggler Bazooka",
      description: "Classic rocket with a proper crater and plenty of push."
    },
    "enten-granate": {
      displayName: "Duck Grenade",
      description: "Bounces briefly, waits cheekily, then tears open a deep hole."
    },
    "plunder-pistole": {
      displayName: "Plunder Pistol",
      description: "Fast direct shot for small long-range trouble."
    },
    "regenbogen-rakete": {
      displayName: "Rainbow Rocket",
      description: "Very cheeky, very colorful, and available once per mercenary."
    },
    "splitter-granate": {
      displayName: "Shrapnel Grenade",
      description: "Bounces briefly and scatters nasty little fragments on impact."
    },
    "konfetti-schrot": {
      displayName: "Confetti Shotgun",
      description: "A direct fan of sparkling close-range pellets."
    },
    "bohrer-rakete": {
      displayName: "Drill Rocket",
      description: "Bites into the terrain and carves steep holes."
    },
    "gummi-huhn": {
      displayName: "Rubber Chicken",
      description: "Bounces absurdly, squeaks meanly, and shoves everything downhill."
    },
    "seifenblasen-bombe": {
      displayName: "Bubble Bomb",
      description: "Floats gently, pops wide, and blasts mercenaries away."
    },
    "keks-moerser": {
      displayName: "Cookie Mortar",
      description: "Heavy arcing shot with a crunchy impact from above."
    }
  }
};

function localizeWeaponDefinition(
  definition: ChaosKommandoWeaponDefinition,
  language: SupportedLanguage
): ChaosKommandoWeaponDefinition {
  const text = weaponTexts[language]?.[definition.id];

  return text ? { ...definition, ...text } : definition;
}

function localizeWeaponDefinitions(language: SupportedLanguage): ChaosKommandoWeaponDefinition[] {
  return weaponDefinitions.map((definition) => localizeWeaponDefinition(definition, language));
}

const chaosKommandoText = {
  de: {
    waitingAction: "Chaos-Kommando wartet auf die naechste Aktion.",
    playerTurn: (playerName: string, mercenaryName: string, weaponName: string) =>
      `${playerName} ist dran | ${mercenaryName} mit ${weaponName}`,
    wind: (direction: number, strength: number) =>
      `${direction > 0 ? "Wind nach rechts" : "Wind nach links"} | ${Math.round(strength * 10)}`,
    winner: (name: string) => `${name} gewinnt Chaos-Kommando!`,
    draw: "Alle Teams sind untergegangen.",
    smokeClears: "Der Rauch verzieht sich. Das naechste Team ist dran.",
    intro: "Chaos-Kommando macht die Sicherungen locker.",
    introLog: "Bunt, ueberdreht, lustig, taktisch und schoen gemein.",
    start: "Die Lunte brennt. Das erste Team stuermt los.",
    mercenaryForward: (playerName: string, mercenaryName: string) => `${playerName} schickt jetzt ${mercenaryName} vor.`,
    clockFaster: "Die Uhr war schneller. Das naechste Team uebernimmt."
  },
  en: {
    waitingAction: "Chaos Commando is waiting for the next action.",
    playerTurn: (playerName: string, mercenaryName: string, weaponName: string) =>
      `${playerName} is up | ${mercenaryName} with ${weaponName}`,
    wind: (direction: number, strength: number) =>
      `${direction > 0 ? "Wind right" : "Wind left"} | ${Math.round(strength * 10)}`,
    winner: (name: string) => `${name} wins Chaos Commando!`,
    draw: "All teams went down.",
    smokeClears: "The smoke clears. The next team is up.",
    intro: "Chaos Commando is loosening the fuses.",
    introLog: "Colorful, loud, tactical, and delightfully mean.",
    start: "The fuse is lit. The first team rushes in.",
    mercenaryForward: (playerName: string, mercenaryName: string) => `${playerName} sends ${mercenaryName} forward.`,
    clockFaster: "The clock won. The next team takes over."
  }
} satisfies Record<SupportedLanguage, {
  waitingAction: string;
  playerTurn: (playerName: string, mercenaryName: string, weaponName: string) => string;
  wind: (direction: number, strength: number) => string;
  winner: (name: string) => string;
  draw: string;
  smokeClears: string;
  intro: string;
  introLog: string;
  start: string;
  mercenaryForward: (playerName: string, mercenaryName: string) => string;
  clockFaster: string;
}>;

const mercenaryTemplates: Array<{
  role: ChaosKommandoMercenaryRole;
  name: string;
  spritePath: string;
  portraitPath: string;
  accentColor: string;
}> = [
  {
    role: "sprinter",
    name: "Turbo-Toni",
    spritePath: "/chaos-kommando/characters/marshmallow-portrait.png",
    portraitPath: "/chaos-kommando/characters/marshmallow-portrait.png",
    accentColor: "#22d3ee"
  },
  {
    role: "grenadier",
    name: "Greta Granate",
    spritePath: "/chaos-kommando/characters/marshmallow-portrait.png",
    portraitPath: "/chaos-kommando/characters/marshmallow-portrait.png",
    accentColor: "#fbbf24"
  },
  {
    role: "chaos-schuetze",
    name: "Bummo Blitz",
    spritePath: "/chaos-kommando/characters/marshmallow-portrait.png",
    portraitPath: "/chaos-kommando/characters/marshmallow-portrait.png",
    accentColor: "#fb7185"
  }
];

interface TerrainPreset {
  id: string;
  name: string;
  controlPoints: Array<{ x: number; y: number }>;
}

const terrainPresets: TerrainPreset[] = [
  {
    id: "klapperkueste",
    name: "Klapperkueste",
    controlPoints: [
      { x: 0, y: 826 },
      { x: 150, y: 778 },
      { x: 320, y: 652 },
      { x: 430, y: 498 },
      { x: 610, y: 560 },
      { x: 820, y: 452 },
      { x: 990, y: 522 },
      { x: 1180, y: 690 },
      { x: 1390, y: 558 },
      { x: 1570, y: 432 },
      { x: 1750, y: 506 },
      { x: 1960, y: 644 },
      { x: 2140, y: 718 },
      { x: 2360, y: 834 }
    ]
  },
  {
    id: "seeschlund",
    name: "Seeschlund",
    controlPoints: [
      { x: 0, y: 792 },
      { x: 210, y: 702 },
      { x: 420, y: 530 },
      { x: 640, y: 446 },
      { x: 860, y: 608 },
      { x: 1080, y: 742 },
      { x: 1260, y: 620 },
      { x: 1450, y: 458 },
      { x: 1660, y: 508 },
      { x: 1860, y: 656 },
      { x: 2080, y: 578 },
      { x: 2230, y: 494 },
      { x: 2360, y: 734 }
    ]
  },
  {
    id: "brandungstreppe",
    name: "Brandungstreppe",
    controlPoints: [
      { x: 0, y: 842 },
      { x: 180, y: 764 },
      { x: 360, y: 662 },
      { x: 540, y: 560 },
      { x: 700, y: 450 },
      { x: 930, y: 612 },
      { x: 1180, y: 760 },
      { x: 1390, y: 594 },
      { x: 1580, y: 462 },
      { x: 1760, y: 526 },
      { x: 1940, y: 650 },
      { x: 2160, y: 706 },
      { x: 2360, y: 812 }
    ]
  }
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function createSeed(context: ServerGameContext): number {
  let seed = context.now >>> 0;

  for (const player of context.players) {
    for (let index = 0; index < player.id.length; index += 1) {
      seed = (seed ^ player.id.charCodeAt(index) ^ (index * 374_761_393)) >>> 0;
      seed = Math.imul(seed ^ (seed >>> 13), 1_274_126_177) >>> 0;
    }
  }

  return seed || 0x51f15e;
}

function createRng(seed: number): () => number {
  let state = seed >>> 0 || 1;

  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 4_294_967_295;
  };
}

function pushActionLog(actionLog: string[], entry: string): string[] {
  return [entry, ...actionLog].slice(0, 5);
}

function normalizeStick(x: number, y: number): { x: number; y: number } {
  const magnitude = Math.hypot(x, y);

  if (magnitude <= 0.0001) {
    return { x: 0, y: 0 };
  }

  if (magnitude <= 1) {
    return { x, y };
  }

  return {
    x: x / magnitude,
    y: y / magnitude
  };
}

function resolveAimAngle(aimX: number, aimY: number, fallback: number): number {
  const normalized = normalizeStick(aimX, aimY);

  if (normalized.x === 0 && normalized.y === 0) {
    return fallback;
  }

  return Math.atan2(normalized.y, normalized.x);
}

function buildWind(seed: number, language: SupportedLanguage): ChaosKommandoWindState {
  const rng = createRng(seed ^ 0xa53c9f);
  const direction = rng() > 0.5 ? 1 : -1;
  const strength = Math.round((0.2 + rng() * 0.8) * 100) / 100;

  return {
    strength,
    direction,
    label: chaosKommandoText[language].wind(direction, strength)
  };
}

function createSpawnAnchors(playerCount: number): number[] {
  switch (playerCount) {
    case 2:
      return [440, terrainWidth - 440];
    case 3:
      return [360, terrainWidth / 2, terrainWidth - 360];
    default:
      return [280, 820, terrainWidth - 820, terrainWidth - 280];
  }
}

function createMercenarySpawnXs(anchor: number, width: number): number[] {
  return [-210, 0, 210].map((offset) =>
    clamp(anchor + offset, mercenaryRadius + 16, width - mercenaryRadius - 16)
  );
}

function smoothStep(value: number): number {
  return value * value * (3 - 2 * value);
}

function resolvePresetHeight(
  preset: TerrainPreset,
  x: number
): number {
  const points = preset.controlPoints;

  if (x <= points[0].x) {
    return points[0].y;
  }

  for (let index = 1; index < points.length; index += 1) {
    const left = points[index - 1];
    const right = points[index];

    if (x > right.x) {
      continue;
    }

    const blend = smoothStep(clamp((x - left.x) / Math.max(1, right.x - left.x), 0, 1));
    return left.y + (right.y - left.y) * blend;
  }

  return points[points.length - 1].y;
}

function resolveSampleHeight(samples: number[], x: number): number {
  const scaled = clamp(x / sampleSpacing, 0, samples.length - 1);
  const leftIndex = Math.floor(scaled);
  const rightIndex = Math.min(samples.length - 1, leftIndex + 1);
  const blend = scaled - leftIndex;
  return (samples[leftIndex] ?? samples[samples.length - 1]) * (1 - blend) + (samples[rightIndex] ?? samples[leftIndex] ?? 0) * blend;
}

function flattenTerrain(samples: number[], centerX: number, width: number, targetY: number): void {
  const startIndex = Math.max(0, Math.floor((centerX - width) / sampleSpacing));
  const endIndex = Math.min(samples.length - 1, Math.ceil((centerX + width) / sampleSpacing));

  for (let index = startIndex; index <= endIndex; index += 1) {
    const sampleX = index * sampleSpacing;
    const distance = Math.abs(sampleX - centerX);
    const influence = clamp(1 - distance / width, 0, 1);
    const blend = 1 - (1 - influence) * (1 - influence);
    samples[index] = samples[index] * (1 - blend) + targetY * blend;
  }
}

function createTerrain(playerCount: number, _seed: number): ChaosKommandoTerrainState {
  const preset = terrainPresets[0];
  const sampleCount = Math.floor(terrainWidth / sampleSpacing) + 1;
  const samples = Array.from({ length: sampleCount }, (_, index) => {
    const x = index * sampleSpacing;
    const sculpted =
      resolvePresetHeight(preset, x) +
      Math.sin(x / 64) * 7 +
      Math.cos(x / 118) * 5 +
      Math.sin(x / 28) * 2;

    return clamp(sculpted, 410, waterlineY - 66);
  });

  const spawnAnchors = createSpawnAnchors(playerCount);

  for (const anchorX of spawnAnchors) {
    for (const spawnX of createMercenarySpawnXs(anchorX, terrainWidth)) {
      flattenTerrain(samples, spawnX, 118, clamp(resolveSampleHeight(samples, spawnX) - 6, 430, 660));
    }
  }

  flattenTerrain(samples, terrainWidth * 0.18, 140, 676);
  flattenTerrain(samples, terrainWidth * 0.52, 172, 724);
  flattenTerrain(samples, terrainWidth * 0.84, 150, 690);

  return {
    mapId: preset.id,
    mapName: preset.name,
    width: terrainWidth,
    height: terrainHeight,
    waterlineY,
    sampleSpacing,
    samples
  };
}

function resolveGroundY(terrain: ChaosKommandoTerrainState, x: number): number {
  const clampedX = clamp(x, 0, terrain.width);
  const scaled = clampedX / terrain.sampleSpacing;
  const leftIndex = Math.floor(scaled);
  const rightIndex = Math.min(terrain.samples.length - 1, leftIndex + 1);
  const blend = scaled - leftIndex;
  const leftValue = terrain.samples[leftIndex] ?? terrain.samples[terrain.samples.length - 1];
  const rightValue = terrain.samples[rightIndex] ?? leftValue;
  return leftValue + (rightValue - leftValue) * blend;
}

function buildAmmo(): Record<ChaosKommandoWeaponId, number> {
  return {
    "kicher-bazooka": 3,
    "enten-granate": 2,
    "plunder-pistole": 6,
    "regenbogen-rakete": 1,
    "splitter-granate": 2,
    "konfetti-schrot": 4,
    "bohrer-rakete": 2,
    "gummi-huhn": 2,
    "seifenblasen-bombe": 2,
    "keks-moerser": 2
  };
}

function createMercenary(
  player: ServerGameContext["players"][number],
  template: (typeof mercenaryTemplates)[number],
  mercenaryIndex: number,
  spawnX: number,
  terrain: ChaosKommandoTerrainState
): RuntimeMercenaryState {
  const x = clamp(spawnX, mercenaryRadius + 4, terrain.width - mercenaryRadius - 4);
  const y = resolveGroundY(terrain, x) - mercenaryRadius;

  return {
    id: `${player.id}:merc:${mercenaryIndex}`,
    name: template.name,
    role: template.role,
    playerId: player.id,
    playerName: player.name,
    teamColor: player.color,
    accentColor: template.accentColor,
    spritePath: template.spritePath,
    portraitPath: template.portraitPath,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: mercenaryRadius,
    hp: 100,
    maxHp: 100,
    alive: true,
    grounded: true,
    facing: mercenaryIndex % 2 === 0 ? "right" : "left",
    aimAngleRad: mercenaryIndex % 2 === 0 ? -Math.PI / 4 : (-Math.PI * 3) / 4,
    ammo: buildAmmo(),
    moveInputX: 0,
    jumpReadyAt: 0,
    airborneFromY: null,
    deathExploded: false
  };
}

function countAliveMercenaries(mercenaries: RuntimeMercenaryState[]): number {
  return mercenaries.filter((mercenary) => mercenary.alive).length;
}

function createPlayers(
  players: ServerGameContext["players"],
  terrain: ChaosKommandoTerrainState
): RuntimePlayerState[] {
  const safePlayers = players.length > 0
    ? players
    : [
        {
          id: "chaos-p1",
          name: "Spieler 1",
          color: "#38bdf8",
          score: 0,
          isReady: true,
          connected: true
        },
        {
          id: "chaos-p2",
          name: "Spieler 2",
          color: "#fb7185",
          score: 0,
          isReady: true,
          connected: true
        }
      ];
  const anchors = createSpawnAnchors(safePlayers.length);

  return safePlayers.map((player, playerIndex) => {
    const anchor = anchors[playerIndex] ?? anchors[anchors.length - 1] ?? terrain.width / 2;
    const spawnXs = createMercenarySpawnXs(anchor, terrain.width);
    const mercenaries = mercenaryTemplates.map((template, mercenaryIndex) =>
      createMercenary(
        player,
        template,
        mercenaryIndex,
        spawnXs[mercenaryIndex] ?? anchor,
        terrain
      )
    );

    return {
      playerId: player.id,
      name: player.name,
      color: player.color,
      mercenaries,
      aliveMercenaryCount: countAliveMercenaries(mercenaries),
      eliminated: false
    };
  });
}

function resolveFirstAliveMercenaryId(player: RuntimePlayerState | undefined): string {
  return player?.mercenaries.find((mercenary) => mercenary.alive)?.id ?? "";
}

function findPlayer(state: { players: RuntimePlayerState[] }, playerId: string): RuntimePlayerState | undefined {
  return state.players.find((player) => player.playerId === playerId);
}

function findMercenaryById(
  state: { players: RuntimePlayerState[] },
  mercenaryId: string
): RuntimeMercenaryState | undefined {
  for (const player of state.players) {
    const mercenary = player.mercenaries.find((entry) => entry.id === mercenaryId);

    if (mercenary) {
      return mercenary;
    }
  }

  return undefined;
}

function hasGravestoneForMercenary(
  state: { gravestones: RuntimeGravestoneState[] },
  mercenaryId: string
): boolean {
  return state.gravestones.some((gravestone) => gravestone.mercenaryId === mercenaryId);
}

function findWeaponDefinition(weaponId: ChaosKommandoWeaponId): ChaosKommandoWeaponDefinition {
  return (
    weaponDefinitions.find((definition) => definition.id === weaponId) ??
    weaponDefinitions[0]
  );
}

function resolveAvailableWeapon(
  mercenary: RuntimeMercenaryState | undefined,
  preferredWeaponId: ChaosKommandoWeaponId | undefined
): ChaosKommandoWeaponId {
  if (mercenary && preferredWeaponId && (mercenary.ammo[preferredWeaponId] ?? 0) > 0) {
    return preferredWeaponId;
  }

  for (const definition of weaponDefinitions) {
    if ((mercenary?.ammo[definition.id] ?? 0) > 0) {
      return definition.id;
    }
  }

  return "plunder-pistole";
}

function isBouncyWeapon(weaponId: ChaosKommandoWeaponId): boolean {
  return weaponId === "enten-granate" || weaponId === "splitter-granate" || weaponId === "gummi-huhn";
}

function resolveProjectileRadius(weaponId: ChaosKommandoWeaponId): number {
  switch (weaponId) {
    case "plunder-pistole":
      return 8;
    case "konfetti-schrot":
      return 5;
    case "enten-granate":
    case "splitter-granate":
      return 11;
    case "gummi-huhn":
      return 13;
    case "seifenblasen-bombe":
      return 15;
    case "keks-moerser":
      return 12;
    case "bohrer-rakete":
      return 10;
    case "kicher-bazooka":
    case "regenbogen-rakete":
    default:
      return 10;
  }
}

function resolveProjectileBounceFactor(weaponId: ChaosKommandoWeaponId): number {
  switch (weaponId) {
    case "gummi-huhn":
      return 0.72;
    case "splitter-granate":
      return 0.5;
    case "enten-granate":
      return 0.55;
    default:
      return 0.18;
  }
}

function resolveShotSpreadAngles(weaponId: ChaosKommandoWeaponId): number[] {
  if (weaponId !== "konfetti-schrot") {
    return [0];
  }

  return [-0.18, -0.09, 0, 0.09, 0.18];
}

function refreshPlayerSummaries(players: RuntimePlayerState[]): RuntimePlayerState[] {
  return players.map((player) => {
    const aliveMercenaryCount = countAliveMercenaries(player.mercenaries);

    return {
      ...player,
      aliveMercenaryCount,
      eliminated: aliveMercenaryCount === 0
    };
  });
}

function countAliveTeams(players: RuntimePlayerState[]): number {
  return players.filter((player) => player.aliveMercenaryCount > 0).length;
}

function buildTurnState(players: RuntimePlayerState[], now: number): RuntimeTurnState {
  const currentPlayer = players.find((player) => player.aliveMercenaryCount > 0) ?? players[0];
  const activeMercenaryId = resolveFirstAliveMercenaryId(currentPlayer);
  const activeMercenary = activeMercenaryId ? findMercenaryById({ players }, activeMercenaryId) : undefined;
  const aimAngleRad = activeMercenary?.aimAngleRad ?? -Math.PI / 4;

  return {
    turnNumber: 1,
    currentPlayerId: currentPlayer?.playerId ?? "",
    activeMercenaryId,
    currentWeaponId: resolveAvailableWeapon(activeMercenary, "kicher-bazooka"),
    turnEndsAt: now + turnDurationMs,
    hasFired: false,
    resolvingShot: false,
    chargeStartedAt: null,
    chargeRatio: 0,
    settleEndsAt: null,
    crosshairX: (activeMercenary?.x ?? terrainWidth / 2) + Math.cos(aimAngleRad) * crosshairDistance,
    crosshairY: (activeMercenary?.y ?? terrainHeight / 2) + Math.sin(aimAngleRad) * crosshairDistance,
    crosshairDistance,
    orderPlayerIds: players.map((player) => player.playerId)
  };
}

function findCurrentPlayerIndex(state: ChaosKommandoRuntimeState): number {
  return state.turn.orderPlayerIds.findIndex((playerId) => playerId === state.turn.currentPlayerId);
}

function buildTurnMessage(state: ChaosKommandoRuntimeState): string {
  const player = findPlayer(state, state.turn.currentPlayerId);
  const mercenary = findMercenaryById(state, state.turn.activeMercenaryId);
  const text = chaosKommandoText[state.language];

  if (!player || !mercenary) {
    return text.waitingAction;
  }

  const weapon = localizeWeaponDefinition(findWeaponDefinition(state.turn.currentWeaponId), state.language);
  return text.playerTurn(player.name, mercenary.name, weapon.displayName);
}

function resolveCrosshairPosition(
  mercenary: RuntimeMercenaryState | null | undefined,
  fallbackAngleRad: number
): { x: number; y: number } {
  if (!mercenary) {
    return {
      x: terrainWidth / 2 + Math.cos(fallbackAngleRad) * crosshairDistance,
      y: terrainHeight / 2 + Math.sin(fallbackAngleRad) * crosshairDistance
    };
  }

  return {
    x: mercenary.x + Math.cos(fallbackAngleRad) * crosshairDistance,
    y: mercenary.y + Math.sin(fallbackAngleRad) * crosshairDistance
  };
}

function syncTurnPresentation(
  state: ChaosKommandoRuntimeState,
  now: number
): ChaosKommandoRuntimeState {
  const activeMercenary = findMercenaryById(state, state.turn.activeMercenaryId);
  const aimAngleRad = activeMercenary?.aimAngleRad ?? -Math.PI / 4;
  const weapon = findWeaponDefinition(state.turn.currentWeaponId);
  const crosshair = resolveCrosshairPosition(activeMercenary, aimAngleRad);
  const chargeRatio =
    state.turn.chargeStartedAt !== null &&
    !state.turn.hasFired &&
    !state.turn.resolvingShot &&
    weapon.fireMode === "charged"
      ? clamp((now - state.turn.chargeStartedAt) / chargeWindowMs, 0, 1)
      : 0;

  return {
    ...state,
    turn: {
      ...state.turn,
      chargeRatio,
      crosshairX: crosshair.x,
      crosshairY: crosshair.y,
      crosshairDistance
    },
    updatedAt: now
  };
}

function resolveCameraFocus(state: ChaosKommandoRuntimeState): { x: number; y: number } {
  const projectile = state.projectiles[state.projectiles.length - 1];

  if (projectile) {
    return { x: projectile.x, y: projectile.y };
  }

  if (state.activeDeathSequence) {
    const doomedMercenary = findMercenaryById(state, state.activeDeathSequence.mercenaryId);

    if (doomedMercenary) {
      return { x: doomedMercenary.x, y: doomedMercenary.y };
    }
  }

  const mercenary = findMercenaryById(state, state.turn.activeMercenaryId);

  if (mercenary) {
    return { x: mercenary.x, y: mercenary.y };
  }

  return { x: state.terrain.width / 2, y: state.terrain.height / 2 };
}

function startPlayerTurn(
  state: ChaosKommandoRuntimeState,
  playerId: string,
  activeMercenaryId: string,
  now: number,
  turnNumber: number,
  reason: string
): ChaosKommandoRuntimeState {
  const activeMercenary = findMercenaryById(state, activeMercenaryId);
  const nextWeaponId = resolveAvailableWeapon(activeMercenary, state.turn.currentWeaponId);

  const nextState: ChaosKommandoRuntimeState = {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      mercenaries: player.mercenaries.map((mercenary) => ({
        ...mercenary,
        moveInputX: 0
      }))
    })),
    turn: {
      ...state.turn,
      turnNumber,
      currentPlayerId: playerId,
      activeMercenaryId,
      currentWeaponId: nextWeaponId,
      turnEndsAt: now + turnDurationMs,
      hasFired: false,
      resolvingShot: false,
      chargeStartedAt: null,
      chargeRatio: 0,
      settleEndsAt: null
    },
    actionLog: pushActionLog(state.actionLog, reason),
    updatedAt: now
  };
  const focus = resolveCameraFocus(nextState);

  return {
    ...syncTurnPresentation(nextState, now),
    cameraFocusX: focus.x,
    cameraFocusY: focus.y,
    message: buildTurnMessage(nextState)
  };
}

function resolveNextTurn(state: ChaosKommandoRuntimeState, now: number, reason: string): ChaosKommandoRuntimeState {
  const currentIndex = findCurrentPlayerIndex(state);
  const order = state.turn.orderPlayerIds;

  for (let offset = 1; offset <= order.length; offset += 1) {
    const nextIndex = (currentIndex + offset + order.length) % order.length;
    const nextPlayer = findPlayer(state, order[nextIndex]);

    if (!nextPlayer || nextPlayer.aliveMercenaryCount === 0) {
      continue;
    }

    return startPlayerTurn(
      state,
      nextPlayer.playerId,
      resolveFirstAliveMercenaryId(nextPlayer),
      now,
      state.turn.turnNumber + 1,
      reason
    );
  }

  return state;
}

function updateTerrainForExplosion(
  terrain: ChaosKommandoTerrainState,
  x: number,
  y: number,
  radius: number,
  craterDepth: number
): ChaosKommandoTerrainState {
  const samples = [...terrain.samples];
  const rimRadius = radius * 1.18;
  const startIndex = Math.max(0, Math.floor((x - rimRadius) / terrain.sampleSpacing));
  const endIndex = Math.min(samples.length - 1, Math.ceil((x + rimRadius) / terrain.sampleSpacing));
  const carveCenterY = y - Math.max(0, radius - craterDepth);

  for (let index = startIndex; index <= endIndex; index += 1) {
    const sampleX = index * terrain.sampleSpacing;
    const distance = Math.abs(sampleX - x);

    if (distance <= radius) {
      const arcDepth = Math.sqrt(Math.max(0, radius * radius - distance * distance));
      const craterFloor = carveCenterY + arcDepth;
      const roughness = Math.sin((sampleX + y) * 0.043) * Math.min(8, craterDepth * 0.09);
      samples[index] = Math.min(
        terrain.waterlineY - 10,
        Math.max(samples[index], craterFloor + roughness)
      );
      continue;
    }

    if (distance <= rimRadius) {
      const rimRatio = 1 - (distance - radius) / Math.max(1, rimRadius - radius);
      const rimLift = Math.sin(rimRatio * Math.PI) * Math.min(16, craterDepth * 0.22);
      samples[index] = clamp(samples[index] - rimLift, 390, terrain.waterlineY - 10);
    }
  }

  for (let index = Math.max(1, startIndex); index < Math.min(samples.length - 1, endIndex); index += 1) {
    const previous = samples[index - 1] ?? samples[index];
    const current = samples[index] ?? previous;
    const next = samples[index + 1] ?? current;
    samples[index] = current * 0.7 + (previous + next) * 0.15;
  }

  return {
    ...terrain,
    samples
  };
}

function applyExplosion(
  state: ChaosKommandoRuntimeState,
  explosionX: number,
  explosionY: number,
  definition: ChaosKommandoWeaponDefinition,
  now: number,
  ownerPlayerId: string,
  sourceWeaponId: ChaosKommandoExplosionSourceId = definition.id
): ChaosKommandoRuntimeState {
  const nextTerrain = updateTerrainForExplosion(
    state.terrain,
    explosionX,
    explosionY,
    definition.blastRadius,
    definition.craterDepth
  );
  const nextPlayers = state.players.map((player) => ({
    ...player,
    mercenaries: player.mercenaries.map((mercenary) => {
      const dx = mercenary.x - explosionX;
      const dy = mercenary.y - explosionY;
      const distance = Math.hypot(dx, dy);

      if (distance > definition.blastRadius) {
        return mercenary;
      }

      const normalizedDistance = clamp(distance / definition.blastRadius, 0, 1);
      const safeDistance = Math.max(distance, 8);
      const pushStrength = (1 - normalizedDistance) * 355;
      const damage = mercenary.alive
        ? definition.damage > 0
          ? Math.max(1, Math.round(definition.damage * (1 - normalizedDistance)))
          : 0
        : 0;
      const nextHp = Math.max(0, mercenary.hp - damage);
      const killed = mercenary.alive && nextHp <= 0;

      return {
        ...mercenary,
        hp: nextHp,
        alive: mercenary.alive ? !killed : false,
        grounded: false,
        vx: mercenary.vx + (dx / safeDistance) * pushStrength,
        vy: mercenary.vy + (dy / safeDistance) * pushStrength - 150,
        airborneFromY: mercenary.y
      };
    })
  }));
  const nextGravestones = state.gravestones.map((gravestone) => {
    const dx = gravestone.x - explosionX;
    const dy = gravestone.y - explosionY;
    const distance = Math.hypot(dx, dy);

    if (distance > definition.blastRadius) {
      return gravestone;
    }

    const normalizedDistance = clamp(distance / definition.blastRadius, 0, 1);
    const safeDistance = Math.max(distance, 8);
    const pushStrength = (1 - normalizedDistance) * 320;

    return {
      ...gravestone,
      grounded: false,
      vx: gravestone.vx + (dx / safeDistance) * pushStrength,
      vy: gravestone.vy + (dy / safeDistance) * pushStrength - 120
    };
  });
  const refreshedPlayers = refreshPlayerSummaries(nextPlayers);
  const explosion: ChaosKommandoExplosionState = {
    id: `explosion:${now}:${Math.round(explosionX)}:${Math.round(explosionY)}`,
    sourceWeaponId,
    x: explosionX,
    y: explosionY,
    radius: definition.blastRadius,
    color: definition.accentColor,
    createdAt: now
  };
  const nextState: ChaosKommandoRuntimeState = {
    ...state,
    terrain: nextTerrain,
    players: refreshedPlayers,
    gravestones: nextGravestones,
    explosions: [explosion, ...state.explosions].slice(0, 8),
    actionLog: pushActionLog(
      state.actionLog,
      `${findPlayer(state, ownerPlayerId)?.name ?? "Ein Team"} locht das Terrain mit ${definition.displayName}.`
    ),
    updatedAt: now
  };
  const focus = resolveCameraFocus(nextState);

  return {
    ...nextState,
    cameraFocusX: focus.x,
    cameraFocusY: focus.y
  };
}

function markMercenaryDeathExploded(
  state: ChaosKommandoRuntimeState,
  mercenaryId: string
): ChaosKommandoRuntimeState {
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      mercenaries: player.mercenaries.map((mercenary) =>
        mercenary.id === mercenaryId
          ? {
              ...mercenary,
              deathExploded: true
            }
          : mercenary
      )
    }))
  };
}

function buildDeathExplosionDefinition(mercenary: RuntimeMercenaryState): ChaosKommandoWeaponDefinition {
  return {
    id: "enten-granate",
    displayName: "Abschieds-BUMM",
    description: "Wenn ein Soeldner faellt, gibt es noch eine letzte Gemeinheit.",
    iconPath: mercenary.portraitPath,
    accentColor: mercenary.accentColor,
    fireMode: "instant",
    damage: deathExplosionDamage,
    blastRadius: deathExplosionRadius,
    projectileSpeed: 0,
    gravityScale: 1,
    fuseMs: null,
    craterDepth: deathExplosionCraterDepth
  };
}

function queueDeadMercenaries(
  state: ChaosKommandoRuntimeState,
): ChaosKommandoRuntimeState {
  const queued = [...state.deathQueueMercenaryIds];
  let changed = false;

  for (const mercenary of state.players.flatMap((player) => player.mercenaries)) {
    if (mercenary.alive || mercenary.deathExploded) {
      continue;
    }

    if (
      queued.includes(mercenary.id) ||
      state.activeDeathSequence?.mercenaryId === mercenary.id ||
      hasGravestoneForMercenary(state, mercenary.id)
    ) {
      continue;
    }

    queued.push(mercenary.id);
    changed = true;
  }

  return changed
    ? {
        ...state,
        deathQueueMercenaryIds: queued
      }
    : state;
}

function startNextDeathSequence(
  state: ChaosKommandoRuntimeState,
  now: number
): ChaosKommandoRuntimeState {
  if (state.activeDeathSequence || state.deathQueueMercenaryIds.length === 0) {
    return state;
  }

  return {
    ...state,
    deathQueueMercenaryIds: state.deathQueueMercenaryIds.slice(1),
    activeDeathSequence: {
      mercenaryId: state.deathQueueMercenaryIds[0],
      explodeAt: now + deathExplosionDelayMs,
      gravestoneAt: null
    }
  };
}

function createGravestone(
  state: ChaosKommandoRuntimeState,
  mercenary: RuntimeMercenaryState
): RuntimeGravestoneState {
  const x = clamp(mercenary.x, gravestoneRadius + 12, state.terrain.width - gravestoneRadius - 12);
  const groundY = resolveGroundY(state.terrain, x);

  return {
    id: `gravestone:${mercenary.id}`,
    mercenaryId: mercenary.id,
    playerId: mercenary.playerId,
    x,
    y: groundY - gravestoneRadius - 6,
    vx: clamp(mercenary.vx * 0.14, -90, 90),
    vy: -120,
    radius: gravestoneRadius,
    grounded: false
  };
}

function resolveDeathSequences(
  state: ChaosKommandoRuntimeState,
  now: number
): ChaosKommandoRuntimeState {
  let nextState = startNextDeathSequence(queueDeadMercenaries(state), now);
  const activeSequence = nextState.activeDeathSequence;

  if (!activeSequence) {
    return nextState;
  }

  const doomedMercenary = findMercenaryById(nextState, activeSequence.mercenaryId);

  if (!doomedMercenary) {
    return {
      ...nextState,
      activeDeathSequence: null
    };
  }

  if (activeSequence.gravestoneAt === null) {
    if (now < activeSequence.explodeAt) {
      return nextState;
    }

    const explodedState = applyExplosion(
      markMercenaryDeathExploded(nextState, doomedMercenary.id),
      doomedMercenary.x,
      doomedMercenary.y,
      buildDeathExplosionDefinition(doomedMercenary),
      now,
      doomedMercenary.playerId,
      "abschieds-bumm"
    );

    return {
      ...explodedState,
      activeDeathSequence: {
        ...activeSequence,
        gravestoneAt: now + gravestoneSpawnDelayMs
      }
    };
  }

  if (now < activeSequence.gravestoneAt) {
    return nextState;
  }

  const withGravestone = hasGravestoneForMercenary(nextState, doomedMercenary.id)
    ? nextState
    : {
        ...nextState,
        gravestones: [...nextState.gravestones, createGravestone(nextState, doomedMercenary)],
        updatedAt: now
      };

  return startNextDeathSequence(
    {
      ...withGravestone,
      activeDeathSequence: null
    },
    now
  );
}

function markProjectileSettling(state: ChaosKommandoRuntimeState, now: number): ChaosKommandoRuntimeState {
  return {
    ...state,
    turn: {
      ...state.turn,
      resolvingShot: true,
      settleEndsAt: now + settleDelayMs,
      chargeStartedAt: null
    },
    updatedAt: now
  };
}

function detonateProjectile(
  state: ChaosKommandoRuntimeState,
  projectile: RuntimeProjectileState,
  now: number
): ChaosKommandoRuntimeState {
  const baseDefinition = findWeaponDefinition(projectile.weaponId);
  const definition: ChaosKommandoWeaponDefinition = {
    ...baseDefinition,
    damage: projectile.damage,
    blastRadius: projectile.blastRadius,
    craterDepth: projectile.craterDepth,
    gravityScale: projectile.gravityScale,
    accentColor: projectile.splashColor
  };
  const nextProjectiles = state.projectiles.filter((entry) => entry.id !== projectile.id);
  const withRemovedProjectile: ChaosKommandoRuntimeState = {
    ...state,
    projectiles: nextProjectiles,
    updatedAt: now
  };
  let explodedState = applyExplosion(
    withRemovedProjectile,
    projectile.x,
    projectile.y,
    definition,
    now,
    projectile.ownerPlayerId
  );

  if (projectile.weaponId === "splitter-granate") {
    const shardDefinition: ChaosKommandoWeaponDefinition = {
      ...definition,
      displayName: "Splitterwolke",
      damage: 13,
      blastRadius: 42,
      craterDepth: 14,
      accentColor: "#facc15"
    };

    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6 + Math.PI / 7;
      const distance = 50 + (index % 2) * 16;
      explodedState = applyExplosion(
        explodedState,
        projectile.x + Math.cos(angle) * distance,
        projectile.y + Math.sin(angle) * distance * 0.7,
        shardDefinition,
        now,
        projectile.ownerPlayerId,
        projectile.weaponId
      );
    }
  }

  return markProjectileSettling(explodedState, now);
}

function fireActiveWeapon(
  state: ChaosKommandoRuntimeState,
  now: number,
  chargeRatio: number
): ChaosKommandoRuntimeState {
  const activeMercenary = findMercenaryById(state, state.turn.activeMercenaryId);

  if (!activeMercenary || !activeMercenary.alive) {
    return state;
  }

  const weaponId = resolveAvailableWeapon(activeMercenary, state.turn.currentWeaponId);
  const definition = findWeaponDefinition(weaponId);

  if ((activeMercenary.ammo[weaponId] ?? 0) <= 0) {
    return {
      ...state,
      turn: {
        ...state.turn,
        currentWeaponId: resolveAvailableWeapon(activeMercenary, undefined),
        chargeStartedAt: null
      },
      updatedAt: now
    };
  }

  const angle = activeMercenary.aimAngleRad;
  const normalizedChargeRatio =
    definition.fireMode === "charged" ? clamp(chargeRatio, 0.25, 1) : 1;
  const launchSpeed = definition.projectileSpeed * normalizedChargeRatio;
  const spreadAngles = resolveShotSpreadAngles(weaponId);
  const projectiles = spreadAngles.map((spreadAngle, projectileIndex): RuntimeProjectileState => {
    const projectileAngle = angle + spreadAngle;
    const pelletSpeedMultiplier = weaponId === "konfetti-schrot" ? 0.9 + projectileIndex * 0.035 : 1;
    const startX = activeMercenary.x + Math.cos(projectileAngle) * activeMercenary.radius * 1.25;
    const startY = activeMercenary.y + Math.sin(projectileAngle) * activeMercenary.radius * 1.25;

    return {
      id: `projectile:${now}:${activeMercenary.id}:${projectileIndex}`,
      weaponId,
      ownerPlayerId: activeMercenary.playerId,
      ownerMercenaryId: activeMercenary.id,
      x: startX,
      y: startY,
      vx: Math.cos(projectileAngle) * launchSpeed * pelletSpeedMultiplier,
      vy: Math.sin(projectileAngle) * launchSpeed * pelletSpeedMultiplier,
      radius: resolveProjectileRadius(weaponId),
      ageMs: 0,
      fuseMs: definition.fuseMs,
      armed: false,
      damage: definition.damage,
      blastRadius: definition.blastRadius,
      craterDepth: definition.craterDepth,
      gravityScale: definition.gravityScale,
      splashColor: definition.accentColor,
      bounceFactor: resolveProjectileBounceFactor(weaponId)
    };
  });
  const nextPlayers = state.players.map((player) => ({
    ...player,
    mercenaries: player.mercenaries.map((mercenary) =>
      mercenary.id === activeMercenary.id
        ? {
            ...mercenary,
            ammo: {
              ...mercenary.ammo,
              [weaponId]: Math.max(0, (mercenary.ammo[weaponId] ?? 0) - 1)
            },
            facing: Math.cos(angle) >= 0 ? ("right" as const) : ("left" as const),
            moveInputX: 0
          }
        : mercenary
    )
  }));
  const nextState: ChaosKommandoRuntimeState = {
    ...state,
    players: refreshPlayerSummaries(nextPlayers),
    projectiles: [...state.projectiles, ...projectiles],
    turn: {
      ...state.turn,
      currentWeaponId: weaponId,
      hasFired: true,
      resolvingShot: true,
      chargeStartedAt: null,
      chargeRatio: 0,
      settleEndsAt: null
    },
    actionLog: pushActionLog(
      state.actionLog,
      definition.fireMode === "charged"
        ? `${activeMercenary.name} feuert ${definition.displayName} mit ${Math.round(normalizedChargeRatio * 100)}% Wumms.`
        : `${activeMercenary.name} zupft ${definition.displayName} blitzschnell ab.`
    ),
    updatedAt: now
  };
  const focus = resolveCameraFocus(nextState);

  return {
    ...syncTurnPresentation(nextState, now),
    cameraFocusX: focus.x,
    cameraFocusY: focus.y,
    message: `${activeMercenary.name} feuert ${definition.displayName}.`
  };
}

function updateProjectile(
  state: ChaosKommandoRuntimeState,
  projectile: RuntimeProjectileState,
  deltaMs: number,
  now: number
): ChaosKommandoRuntimeState {
  const seconds = deltaMs / 1000;
  const windPush = state.wind.direction * state.wind.strength * 65;
  const nextProjectile: RuntimeProjectileState = {
    ...projectile,
    ageMs: projectile.ageMs + deltaMs,
    vx: projectile.vx + windPush * seconds * projectile.gravityScale,
    vy: projectile.vy + gravity * projectile.gravityScale * seconds
  };

  nextProjectile.x += nextProjectile.vx * seconds;
  nextProjectile.y += nextProjectile.vy * seconds;
  nextProjectile.armed = nextProjectile.ageMs > 150;

  const hitGravestone = state.gravestones.find(
    (gravestone) =>
      Math.hypot(gravestone.x - nextProjectile.x, gravestone.y - nextProjectile.y) <=
      gravestone.radius + nextProjectile.radius + 2
  );

  if (hitGravestone) {
    return detonateProjectile(
      state,
      {
        ...nextProjectile,
        x: hitGravestone.x,
        y: hitGravestone.y
      },
      now
    );
  }

  if (
    nextProjectile.x < -40 ||
    nextProjectile.x > state.terrain.width + 40 ||
    nextProjectile.y > state.terrain.height + 80
  ) {
    return detonateProjectile(state, nextProjectile, now);
  }

  const groundY = resolveGroundY(state.terrain, nextProjectile.x);

  if (isBouncyWeapon(nextProjectile.weaponId)) {
    if (nextProjectile.y + nextProjectile.radius >= groundY) {
      nextProjectile.y = groundY - nextProjectile.radius;
      nextProjectile.vy = -Math.abs(nextProjectile.vy) * nextProjectile.bounceFactor;
      nextProjectile.vx *= nextProjectile.weaponId === "gummi-huhn" ? 0.86 : 0.76;
    }

    if (nextProjectile.fuseMs !== null && nextProjectile.ageMs >= nextProjectile.fuseMs) {
      return detonateProjectile(state, nextProjectile, now);
    }
  } else if (nextProjectile.weaponId === "seifenblasen-bombe") {
    if (nextProjectile.fuseMs !== null && nextProjectile.ageMs >= nextProjectile.fuseMs) {
      return detonateProjectile(state, nextProjectile, now);
    }

    if (nextProjectile.y + nextProjectile.radius >= groundY) {
      nextProjectile.y = groundY - nextProjectile.radius;
      nextProjectile.vx *= 0.68;
      nextProjectile.vy = -Math.abs(nextProjectile.vy) * 0.24;
    }
  } else if (nextProjectile.y + nextProjectile.radius >= groundY) {
    nextProjectile.y = groundY - nextProjectile.radius;
    return detonateProjectile(state, nextProjectile, now);
  }

  for (const player of state.players) {
    for (const mercenary of player.mercenaries) {
      if (!mercenary.alive || mercenary.id === nextProjectile.ownerMercenaryId || !nextProjectile.armed) {
        continue;
      }

      const dx = mercenary.x - nextProjectile.x;
      const dy = mercenary.y - nextProjectile.y;

      if (Math.hypot(dx, dy) <= mercenary.radius + nextProjectile.radius) {
        return detonateProjectile(state, nextProjectile, now);
      }
    }
  }

  return {
    ...state,
    projectiles: state.projectiles.map((entry) => (entry.id === projectile.id ? nextProjectile : entry)),
    updatedAt: now
  };
}

function applyCrowdHop(players: RuntimePlayerState[], activeMercenaryId: string): RuntimePlayerState[] {
  const allMercenaries = players.flatMap((player) => player.mercenaries).filter((mercenary) => mercenary.alive);
  const activeMercenary = allMercenaries.find((mercenary) => mercenary.id === activeMercenaryId);

  if (!activeMercenary?.grounded || Math.abs(activeMercenary.moveInputX) < 0.18) {
    return players;
  }

  const blocker = allMercenaries.find((mercenary) => {
    if (mercenary.id === activeMercenary.id) {
      return false;
    }

    const dx = mercenary.x - activeMercenary.x;
    const dy = Math.abs(mercenary.y - activeMercenary.y);
    const movingTowardBlocker = Math.sign(activeMercenary.moveInputX) === Math.sign(dx) || Math.abs(dx) < activeMercenary.radius * 0.7;

    return (
      movingTowardBlocker &&
      Math.abs(dx) < activeMercenary.radius * 1.9 &&
      dy < activeMercenary.radius * 1.35
    );
  });

  if (!blocker) {
    return players;
  }

  return players.map((player) => ({
    ...player,
    mercenaries: player.mercenaries.map((mercenary) =>
      mercenary.id === activeMercenary.id
        ? {
            ...mercenary,
            grounded: false,
            vy: Math.min(mercenary.vy, jumpVelocity * 0.7),
            vx: mercenary.vx + Math.sign(mercenary.moveInputX) * 58,
            y: mercenary.y - 4,
            airborneFromY: mercenary.y
          }
        : mercenary
    )
  }));
}

function applyGravestonePhysics(
  state: ChaosKommandoRuntimeState,
  deltaMs: number,
  now: number
): ChaosKommandoRuntimeState {
  if (state.gravestones.length === 0) {
    return state;
  }

  const seconds = Math.max(0.001, deltaMs / 1000);
  const nextGravestones = state.gravestones.map((gravestone) => {
    let nextGravestone = { ...gravestone };
    const terrainLeft = nextGravestone.radius + 8;
    const terrainRight = state.terrain.width - nextGravestone.radius - 8;

    if (nextGravestone.grounded) {
      nextGravestone.vx *= 0.84;
      nextGravestone.x = clamp(nextGravestone.x + nextGravestone.vx * seconds, terrainLeft, terrainRight);
      const groundY = resolveGroundY(state.terrain, nextGravestone.x);
      const dropDistance = groundY - (nextGravestone.y + nextGravestone.radius);

      if (dropDistance > 10) {
        nextGravestone.grounded = false;
      } else {
        nextGravestone.y = groundY - nextGravestone.radius;
        nextGravestone.vy = 0;
      }
    }

    if (!nextGravestone.grounded) {
      nextGravestone.vx *= 0.993;
      nextGravestone.vy += gravity * seconds;
      nextGravestone.x = clamp(nextGravestone.x + nextGravestone.vx * seconds, terrainLeft, terrainRight);
      nextGravestone.y += nextGravestone.vy * seconds;
      const groundY = resolveGroundY(state.terrain, nextGravestone.x);

      if (nextGravestone.y + nextGravestone.radius >= groundY) {
        nextGravestone.y = groundY - nextGravestone.radius;
        nextGravestone.vx *= 0.62;
        nextGravestone.vy = -Math.abs(nextGravestone.vy) * 0.22;

        if (Math.abs(nextGravestone.vy) < 34) {
          nextGravestone.vy = 0;
          nextGravestone.grounded = true;
        }
      }
    }

    return nextGravestone;
  });

  return {
    ...state,
    gravestones: nextGravestones,
    updatedAt: now
  };
}

function applyMercenaryPhysics(
  state: ChaosKommandoRuntimeState,
  deltaMs: number,
  now: number
): ChaosKommandoRuntimeState {
  const seconds = Math.max(0.001, deltaMs / 1000);
  const nextPlayers = state.players.map((player) => ({
    ...player,
    mercenaries: player.mercenaries.map((mercenary) => {
      const isActiveMercenary =
        mercenary.alive &&
        mercenary.id === state.turn.activeMercenaryId &&
        player.playerId === state.turn.currentPlayerId &&
        !state.turn.hasFired &&
        !state.turn.resolvingShot;
      let nextMercenary = { ...mercenary };
      const terrainLeft = nextMercenary.radius + 8;
      const terrainRight = state.terrain.width - nextMercenary.radius - 8;

      if (nextMercenary.grounded) {
        if (isActiveMercenary) {
          nextMercenary.vx = nextMercenary.moveInputX * walkSpeed;
          if (nextMercenary.moveInputX > 0.1) {
            nextMercenary.facing = "right";
          } else if (nextMercenary.moveInputX < -0.1) {
            nextMercenary.facing = "left";
          }
        } else {
          nextMercenary.vx *= 0.65;
        }

        nextMercenary.x = clamp(nextMercenary.x + nextMercenary.vx * seconds, terrainLeft, terrainRight);
        const groundY = resolveGroundY(state.terrain, nextMercenary.x);
        const dropDistance = groundY - (nextMercenary.y + nextMercenary.radius);

        if (dropDistance > 12) {
          nextMercenary.grounded = false;
          nextMercenary.airborneFromY = nextMercenary.y;
        } else {
          nextMercenary.y = groundY - nextMercenary.radius;
          nextMercenary.vy = 0;
        }
      }

      if (!nextMercenary.grounded) {
        nextMercenary.vx *= 0.995;
        nextMercenary.vy += gravity * seconds;
        nextMercenary.x = clamp(nextMercenary.x + nextMercenary.vx * seconds, terrainLeft, terrainRight);
        nextMercenary.y += nextMercenary.vy * seconds;
        const groundY = resolveGroundY(state.terrain, nextMercenary.x);

        if (nextMercenary.y + nextMercenary.radius >= groundY) {
          const airborneFromY = nextMercenary.airborneFromY ?? nextMercenary.y;
          const fallDistance = groundY - airborneFromY;
          const fallDamage =
            nextMercenary.alive && fallDistance > 120 ? Math.round((fallDistance - 120) * 0.14) : 0;
          const nextHp = Math.max(0, nextMercenary.hp - fallDamage);

          nextMercenary.y = groundY - nextMercenary.radius;
          nextMercenary.vy = 0;
          nextMercenary.vx *= 0.52;
          nextMercenary.grounded = true;
          nextMercenary.airborneFromY = null;
          nextMercenary.hp = nextHp;
          nextMercenary.alive = nextMercenary.alive ? nextHp > 0 : false;
        }
      }

      if (nextMercenary.y - nextMercenary.radius > state.terrain.waterlineY + 52) {
        nextMercenary.hp = 0;
        nextMercenary.alive = false;
      }

      return nextMercenary;
    })
  }));

  const crowdAdjustedPlayers = applyCrowdHop(nextPlayers, state.turn.activeMercenaryId);
  const refreshedPlayers = refreshPlayerSummaries(crowdAdjustedPlayers);
  const nextState: ChaosKommandoRuntimeState = {
    ...state,
    players: refreshedPlayers,
    explosions: state.explosions.filter((explosion) => now - explosion.createdAt <= 950),
    updatedAt: now
  };
  const focus = resolveCameraFocus(nextState);

  return {
    ...syncTurnPresentation(nextState, now),
    cameraFocusX: focus.x,
    cameraFocusY: focus.y
  };
}

function resolveWinnerLock(state: ChaosKommandoRuntimeState, now: number): ChaosKommandoRuntimeState | null {
  if (state.activeDeathSequence || state.deathQueueMercenaryIds.length > 0) {
    return null;
  }

  const alivePlayers = state.players.filter((player) => player.aliveMercenaryCount > 0);

  if (alivePlayers.length > 1) {
    return null;
  }

  const winner = alivePlayers[0];
  const text = chaosKommandoText[state.language];
  const message = winner ? text.winner(winner.name) : text.draw;

  return transitionRoundState(
    {
      ...state,
      winnerPlayerId: winner?.playerId,
      winnerName: winner?.name,
      isDraw: !winner,
      message
    },
    "locked",
    now,
    {
      durationMs: phaseTimings.lockedMs,
      message
    }
  ) as ChaosKommandoRuntimeState;
}

function maybeAdvanceAfterShot(state: ChaosKommandoRuntimeState, now: number): ChaosKommandoRuntimeState {
  if (
    !state.turn.resolvingShot ||
    state.projectiles.length > 0 ||
    state.activeDeathSequence ||
    state.deathQueueMercenaryIds.length > 0
  ) {
    return state;
  }

  if (state.turn.settleEndsAt !== null && now < state.turn.settleEndsAt) {
    return state;
  }

  const winnerLocked = resolveWinnerLock(state, now);

  if (winnerLocked) {
    return winnerLocked;
  }

  return resolveNextTurn(state, now, chaosKommandoText[state.language].smokeClears);
}

function buildPublicPlayers(players: RuntimePlayerState[]): ChaosKommandoPlayerState[] {
  return players.map((player) => ({
    ...player,
    mercenaries: player.mercenaries.map(
      ({
        moveInputX: _moveInputX,
        jumpReadyAt: _jumpReadyAt,
        airborneFromY: _airborneFromY,
        deathExploded: _deathExploded,
        ...mercenary
      }) => mercenary
    )
  }));
}

function buildPublicGravestones(gravestones: RuntimeGravestoneState[]): ChaosKommandoGravestoneState[] {
  return gravestones.map((gravestone) => ({ ...gravestone }));
}

function buildPublicProjectiles(projectiles: RuntimeProjectileState[]): ChaosKommandoProjectileState[] {
  return projectiles.map(({ damage: _damage, blastRadius: _blastRadius, craterDepth: _craterDepth, gravityScale: _gravityScale, splashColor: _splashColor, bounceFactor: _bounceFactor, ...projectile }) => projectile);
}

function buildPublicTurn(turn: RuntimeTurnState): ChaosKommandoTurnState {
  const { orderPlayerIds: _orderPlayerIds, ...publicTurn } = turn;
  return publicTurn;
}

function buildControllerState(state: ChaosKommandoRuntimeState): ChaosKommandoState {
  return {
    terrain: {
      mapId: state.terrain.mapId,
      mapName: state.terrain.mapName,
      width: state.terrain.width,
      height: state.terrain.height,
      waterlineY: state.terrain.waterlineY,
      sampleSpacing: state.terrain.sampleSpacing,
      // The controller UI does not render terrain; omitting the heightmap
      // keeps the 60 Hz controller stream dramatically smaller.
      samples: []
    },
    players: buildPublicPlayers(state.players),
    turn: buildPublicTurn(state.turn),
    weapons: state.weapons,
    projectiles: [],
    explosions: [],
    gravestones: [],
    wind: state.wind,
    winnerPlayerId: state.winnerPlayerId,
    winnerName: state.winnerName,
    isDraw: state.isDraw,
    cameraFocusX: 0,
    cameraFocusY: 0,
    actionLog: []
  };
}

function buildScore(state: ChaosKommandoRuntimeState): ScoreEntry[] {
  return state.players.map((player) => ({
    playerId: player.playerId,
    delta:
      player.playerId === state.winnerPlayerId
        ? 4 + player.aliveMercenaryCount
        : player.aliveMercenaryCount,
    reason: "Chaos-Kommando"
  }));
}

export const chaosKommandoServerGame: ServerGame<
  ChaosKommandoRuntimeState,
  ChaosKommandoInput,
  ChaosKommandoState
> = {
  manifest: chaosKommandoManifest,
  createInitialState(context) {
    const seed = createSeed(context);
    const terrain = createTerrain(context.players.length || 2, seed);
    const players = refreshPlayerSummaries(createPlayers(context.players, terrain));
    const turn = buildTurnState(players, context.now);
    const activeMercenary = findMercenaryById({ players }, turn.activeMercenaryId);
    const text = chaosKommandoText[context.language];

    return {
      ...createBaseRoundState("round_intro", context.now, {
        durationMs: phaseTimings.roundIntroMs,
        message: text.intro
      }),
      seed,
      language: context.language,
      terrain,
      players,
      turn: {
        ...turn,
        currentWeaponId: resolveAvailableWeapon(activeMercenary, "kicher-bazooka")
      },
      weapons: localizeWeaponDefinitions(context.language),
      projectiles: [],
      explosions: [],
      gravestones: [],
      wind: buildWind(seed, context.language),
      isDraw: false,
      cameraFocusX: activeMercenary?.x ?? terrain.width / 2,
      cameraFocusY: activeMercenary?.y ?? terrain.height / 2,
      actionLog: [text.introLog],
      deathQueueMercenaryIds: [],
      activeDeathSequence: null
    };
  },
  startRound(state, context) {
    const currentPlayer = findPlayer(state, state.turn.currentPlayerId) ?? state.players[0];
    const text = chaosKommandoText[state.language];

    return transitionRoundState(
      startPlayerTurn(
        {
          ...state,
          phase: "playing",
          wind: buildWind(state.seed ^ context.roundNumber * 97, state.language),
          weapons: localizeWeaponDefinitions(state.language)
        },
        currentPlayer?.playerId ?? "",
        resolveFirstAliveMercenaryId(currentPlayer),
        context.now,
        1,
        text.start
      ),
      "playing",
      context.now,
      {
        startedAt: context.now,
        message: text.start
      }
    ) as ChaosKommandoRuntimeState;
  },
  handleInput(state, input, context) {
    if (state.phase !== "playing") {
      return state;
    }

    if (input.playerId !== state.turn.currentPlayerId) {
      return state;
    }

    const player = findPlayer(state, input.playerId);
    const activeMercenary = findMercenaryById(state, state.turn.activeMercenaryId);

    if (!player || !activeMercenary || !activeMercenary.alive) {
      return state;
    }

    if (input.type === "select-mercenary") {
      const nextMercenary = player.mercenaries.find((mercenary) => mercenary.id === input.mercenaryId && mercenary.alive);

      if (!nextMercenary || state.turn.hasFired || state.turn.resolvingShot) {
        return state;
      }

      return startPlayerTurn(
        {
          ...state,
          turn: {
            ...state.turn,
            currentPlayerId: player.playerId
          }
        },
        player.playerId,
        nextMercenary.id,
        input.sentAt ?? context.now,
        state.turn.turnNumber,
        chaosKommandoText[state.language].mercenaryForward(player.name, nextMercenary.name)
      );
    }

    if (input.type === "select-weapon") {
      if (state.turn.hasFired || state.turn.resolvingShot) {
        return state;
      }

      if ((activeMercenary.ammo[input.weaponId] ?? 0) <= 0) {
        return state;
      }

      return syncTurnPresentation(
        {
          ...state,
          turn: {
            ...state.turn,
            currentWeaponId: input.weaponId,
            chargeStartedAt: null,
            chargeRatio: 0
          },
          updatedAt: input.sentAt ?? context.now
        },
        input.sentAt ?? context.now
      );
    }

    if (input.type === "move") {
      const nextX = clamp(input.moveX, -1, 1);

      return syncTurnPresentation(
        {
          ...state,
          players: state.players.map((entry) => ({
            ...entry,
            mercenaries: entry.mercenaries.map((mercenary) =>
              mercenary.id === activeMercenary.id
                ? {
                    ...mercenary,
                    moveInputX: nextX
                  }
                : mercenary
            )
          })),
          updatedAt: input.sentAt ?? context.now
        },
        input.sentAt ?? context.now
      );
    }

    if (input.type === "aim") {
      return syncTurnPresentation(
        {
          ...state,
          players: state.players.map((entry) => ({
            ...entry,
            mercenaries: entry.mercenaries.map((mercenary) =>
              mercenary.id === activeMercenary.id
                ? {
                    ...mercenary,
                    aimAngleRad: resolveAimAngle(input.aimX, input.aimY, mercenary.aimAngleRad),
                    facing:
                      Math.abs(input.aimX) > 0.08
                        ? input.aimX >= 0
                          ? "right"
                          : "left"
                        : mercenary.facing
                  }
                : mercenary
            )
          })),
          updatedAt: input.sentAt ?? context.now
        },
        input.sentAt ?? context.now
      );
    }

    if (input.type === "jump") {
      if (!activeMercenary.grounded || activeMercenary.jumpReadyAt > (input.sentAt ?? context.now)) {
        return state;
      }

      return syncTurnPresentation(
        {
          ...state,
          players: state.players.map((entry) => ({
            ...entry,
            mercenaries: entry.mercenaries.map((mercenary) =>
              mercenary.id === activeMercenary.id
                ? {
                    ...mercenary,
                    grounded: false,
                    vy: jumpVelocity,
                    jumpReadyAt: (input.sentAt ?? context.now) + jumpCooldownMs,
                    airborneFromY: mercenary.y
                  }
                : mercenary
            )
          })),
          updatedAt: input.sentAt ?? context.now
        },
        input.sentAt ?? context.now
      );
    }

    if (input.type === "fire:start") {
      if (state.turn.hasFired || state.turn.resolvingShot) {
        return state;
      }

      const definition = findWeaponDefinition(state.turn.currentWeaponId);

      if ((activeMercenary.ammo[state.turn.currentWeaponId] ?? 0) <= 0) {
        return state;
      }

      if (definition.fireMode === "instant") {
        return fireActiveWeapon(state, input.sentAt ?? context.now, 1);
      }

      return syncTurnPresentation(
        {
          ...state,
          turn: {
            ...state.turn,
            chargeStartedAt: input.sentAt ?? context.now
          },
          updatedAt: input.sentAt ?? context.now
        },
        input.sentAt ?? context.now
      );
    }

    if (input.type === "fire:release") {
      if (state.turn.hasFired || state.turn.resolvingShot) {
        return state;
      }

      const definition = findWeaponDefinition(state.turn.currentWeaponId);

      if (definition.fireMode === "instant") {
        return state;
      }

      const chargeStartedAt = state.turn.chargeStartedAt ?? (input.sentAt ?? context.now) - 420;
      const chargeRatio = clamp(((input.sentAt ?? context.now) - chargeStartedAt) / chargeWindowMs, 0.2, 1);
      return fireActiveWeapon(state, input.sentAt ?? context.now, chargeRatio);
    }

    return state;
  },
  tick(state, deltaMs, context) {
    if (state.phase !== "playing") {
      return state;
    }

    let nextState = applyMercenaryPhysics(state, deltaMs, context.now);
    nextState = applyGravestonePhysics(nextState, deltaMs, context.now);
    nextState = resolveDeathSequences(nextState, context.now);

    for (const projectile of [...nextState.projectiles]) {
      nextState = updateProjectile(nextState, projectile, deltaMs, context.now);
      nextState = resolveDeathSequences(nextState, context.now);

      if (nextState.phase === "locked") {
        return nextState;
      }
    }

    if (
      nextState.turn.chargeStartedAt !== null &&
      !nextState.turn.hasFired &&
      findWeaponDefinition(nextState.turn.currentWeaponId).fireMode === "charged" &&
      context.now >= nextState.turn.turnEndsAt
    ) {
      const chargeRatio = clamp((context.now - nextState.turn.chargeStartedAt) / chargeWindowMs, 0.35, 1);
      nextState = fireActiveWeapon(nextState, context.now, chargeRatio);
    }

    if (!nextState.turn.hasFired && context.now >= nextState.turn.turnEndsAt) {
      nextState = resolveNextTurn(nextState, context.now, chaosKommandoText[nextState.language].clockFaster);
    }

    nextState = maybeAdvanceAfterShot(nextState, context.now);

    const winnerLocked = resolveWinnerLock(nextState, context.now);

    if (winnerLocked) {
      return winnerLocked;
    }

    const focus = resolveCameraFocus(nextState);

    return {
      ...syncTurnPresentation(nextState, context.now),
      cameraFocusX: focus.x,
      cameraFocusY: focus.y,
      message: buildTurnMessage(nextState),
      updatedAt: context.now
    };
  },
  isRoundFinished(state) {
    return state.phase === "locked";
  },
  buildScore(state) {
    return buildScore(state);
  },
  toPublicState(state) {
    return {
      terrain: state.terrain,
      players: buildPublicPlayers(state.players),
      turn: buildPublicTurn(state.turn),
      weapons: state.weapons,
      projectiles: buildPublicProjectiles(state.projectiles),
      explosions: state.explosions,
      gravestones: buildPublicGravestones(state.gravestones),
      wind: state.wind,
      winnerPlayerId: state.winnerPlayerId,
      winnerName: state.winnerName,
      isDraw: state.isDraw,
      cameraFocusX: state.cameraFocusX,
      cameraFocusY: state.cameraFocusY,
      actionLog: state.actionLog
    };
  },
  toControllerState(state) {
    return buildControllerState(state);
  },
  toControllerStateForPlayer(state) {
    return buildControllerState(state);
  }
};
