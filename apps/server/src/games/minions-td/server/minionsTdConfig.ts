import type {
  MinionsTdEnemyCatalogEntry,
  MinionsTdMapBuildSlotState,
  MinionsTdMapPathCellState,
  MinionsTdMapState,
  MinionsTdTowerCatalogEntry,
  MinionsTdTowerLevelState
} from "@open-party-lab/protocol";

interface PathPoint {
  x: number;
  y: number;
}

interface PathSegment {
  start: PathPoint;
  end: PathPoint;
  length: number;
}

interface PathMetrics {
  totalLength: number;
  points: PathPoint[];
  segments: PathSegment[];
}

function pathCell(col: number, row: number): MinionsTdMapPathCellState {
  return { col, row };
}

function buildSlot(id: string, col: number, row: number): MinionsTdMapBuildSlotState {
  return { id, col, row };
}

function buildAllOpenSlots(
  prefix: string,
  cols: number,
  rows: number,
  pathCells: readonly MinionsTdMapPathCellState[]
): MinionsTdMapBuildSlotState[] {
  const pathKeys = new Set(pathCells.map((cell) => `${cell.col}:${cell.row}`));
  const buildSlots: MinionsTdMapBuildSlotState[] = [];
  let nextIndex = 1;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (pathKeys.has(`${col}:${row}`)) {
        continue;
      }

      buildSlots.push(buildSlot(`${prefix}${nextIndex}`, col, row));
      nextIndex += 1;
    }
  }

  return buildSlots;
}

// Waypoints werden der Reihe nach als [col, row] gelesen.
// Jeder Eintrag ist ein Knick, Start- oder Endpunkt des Weges.
// Dazwischen fuellt buildPathFromWaypoints alle orthogonalen Zellen automatisch auf.
function buildPathFromWaypoints(
  waypoints: readonly (readonly [col: number, row: number])[]
): MinionsTdMapPathCellState[] {
  if (waypoints.length === 0) {
    return [];
  }

  const pathCells: MinionsTdMapPathCellState[] = [
    pathCell(waypoints[0][0], waypoints[0][1])
  ];

  for (let index = 0; index < waypoints.length - 1; index += 1) {
    const [startCol, startRow] = waypoints[index];
    const [endCol, endRow] = waypoints[index + 1];
    const colDelta = endCol - startCol;
    const rowDelta = endRow - startRow;

    if (colDelta !== 0 && rowDelta !== 0) {
      throw new Error("MinionsTD map paths must use orthogonal waypoints.");
    }

    const steps = Math.max(Math.abs(colDelta), Math.abs(rowDelta));
    const colStep = Math.sign(colDelta);
    const rowStep = Math.sign(rowDelta);

    for (let step = 1; step <= steps; step += 1) {
      pathCells.push(pathCell(startCol + colStep * step, startRow + rowStep * step));
    }
  }

  return pathCells;
}

function towerIconPath(towerId: string): string {
  return `/minions-td/tower-icons/${towerId}.svg`;
}

function enemyIconPath(enemyId: string): string {
  return `/minions-td/enemy-icons/${enemyId}.svg`;
}

function normalizeTowerRange(range: number): number {
  return range > 20 ? range / 10 : range;
}

function normalizeEnemySpeed(speed: number): number {
  return Number((speed / 60).toFixed(2));
}

function resolveEnemyLeakDamage(sendCost: number): number {
  if (sendCost >= 1_250_000) {
    return 8;
  }

  if (sendCost >= 400_000) {
    return 7;
  }

  if (sendCost >= 200_000) {
    return 6;
  }

  if (sendCost >= 100_000) {
    return 5;
  }

  if (sendCost >= 25_000) {
    return 4;
  }

  if (sendCost >= 8_000) {
    return 3;
  }

  if (sendCost >= 1_000) {
    return 2;
  }

  return 1;
}

function towerLevel(
  level: number,
  price: number,
  damage: number,
  range: number,
  fireRateMs: number,
  options: Partial<
    Pick<
      MinionsTdTowerLevelState,
      | "splashRadius"
      | "splashDamagePercent"
      | "slowPct"
      | "slowDurationMs"
      | "targeting"
      | "trait"
    >
  > = {}
): MinionsTdTowerLevelState {
  return {
    level,
    price,
    damage,
    range: normalizeTowerRange(range),
    fireRateMs,
    splashRadius: options.splashRadius,
    splashDamagePercent: options.splashDamagePercent,
    slowPct: options.slowPct,
    slowDurationMs: options.slowDurationMs,
    targeting: options.targeting,
    trait: options.trait
  };
}

export const minionsTdConfig = {
  maxPlayers: 4,
  startingGold: 1000,
  startingLives: 20,
  matchDurationMs: null,
  passiveIncomeEveryMs: 15_000,
  passiveIncomeValue: 50
} as const;

export const minionsTdRoomSettingKeys = {
  selectedMapId: "minionsTdSelectedMapId",
  startingLives: "minionsTdStartingLives",
  startingGold: "minionsTdStartingGold"
} as const;

const switchbackPathCells = buildPathFromWaypoints([
  [0, 2],
  [6, 2],
  [6, 4],
  [1, 4],
  [1, 6],
  [11, 6]
]);

const causewayPathCells = buildPathFromWaypoints([
  [0, 1],
  [4, 1],
  [4, 5],
  [8, 5],
  [8, 2],
  [11, 2]
]);

const zigguratPathCells = buildPathFromWaypoints([
  [0, 6],
  [2, 6],
  [2, 4],
  [5, 4],
  [5, 2],
  [8, 2],
  [8, 4],
  [11, 4]
]);

const crossroadsPathCells = buildPathFromWaypoints([
  [0, 3],
  [2, 3],
  [2, 1],
  [6, 1],
  [6, 3],
  [8, 3],
  [8, 5],
  [11, 5]
]);

const lockstepPathCells = buildPathFromWaypoints([
  [0, 5],
  [3, 5],
  [3, 3],
  [7, 3],
  [7, 5],
  [9, 5],
  [9, 3],
  [11, 3]
]);

const harborPathCells = buildPathFromWaypoints([
  [0, 1],
  [2, 1],
  [2, 3],
  [5, 3],
  [5, 1],
  [8, 1],
  [8, 3],
  [10, 3],
  [10, 5],
  [11, 5]
]);

const serpentinePathCells = buildPathFromWaypoints([
  [1, 0],
  [1, 8],
  [4, 8],
  [4, 2],
  [8, 2],
  [8, 7],
  [11, 7],
  [11, 1],
  [14, 1],
  [14, 9]
]);

const redoubtPathCells = buildPathFromWaypoints([
  [13, 0],
  [13, 8],
  [3, 8],
  [3, 3],
  [10, 3],
  [10, 7],
  [6, 7],
  [6, 1],
  [1, 1],
  [1, 8],
  [1, 9]
]);

const overpassPathCells = buildPathFromWaypoints([
  [0, 1],
  [10, 1],
  [10, 3],
  [3, 3],
  [3, 6],
  [8, 6],
  [8, 9],
  [1, 9],
  [1, 11],
  [11, 11]
]);

const bastionPathCells = buildPathFromWaypoints([
  [0, 10],
  [11, 10],
  [11, 2],
  [5, 2],
  [5, 7],
  [9, 7],
  [9, 4],
  [2, 4],
  [2, 0],
  [11, 0]
]);

export const minionsTdMaps = [
  {
    id: "switchback",
    name: "Switchback",
    cols: 12,
    rows: 8,
    pathCells: switchbackPathCells,
    buildSlots: buildAllOpenSlots("a", 12, 8, switchbackPathCells)
  },
  {
    id: "causeway",
    name: "Causeway",
    cols: 12,
    rows: 8,
    pathCells: causewayPathCells,
    buildSlots: buildAllOpenSlots("b", 12, 8, causewayPathCells)
  },
  {
    id: "ziggurat",
    name: "Ziggurat",
    cols: 12,
    rows: 8,
    pathCells: zigguratPathCells,
    buildSlots: buildAllOpenSlots("c", 12, 8, zigguratPathCells)
  },
  {
    id: "crossroads",
    name: "Crossroads",
    cols: 12,
    rows: 8,
    pathCells: crossroadsPathCells,
    buildSlots: buildAllOpenSlots("d", 12, 8, crossroadsPathCells)
  },
  {
    id: "lockstep",
    name: "Lockstep",
    cols: 12,
    rows: 8,
    pathCells: lockstepPathCells,
    buildSlots: buildAllOpenSlots("e", 12, 8, lockstepPathCells)
  },
  {
    id: "harbor",
    name: "Harbor",
    cols: 12,
    rows: 8,
    pathCells: harborPathCells,
    buildSlots: buildAllOpenSlots("f", 12, 8, harborPathCells)
  },
  {
    id: "serpentine",
    name: "Serpentine",
    cols: 16,
    rows: 10,
    pathCells: serpentinePathCells,
    buildSlots: buildAllOpenSlots("g", 16, 10, serpentinePathCells)
  },
  {
    id: "redoubt",
    name: "Redoubt",
    cols: 16,
    rows: 10,
    pathCells: redoubtPathCells,
    buildSlots: buildAllOpenSlots("h", 16, 10, redoubtPathCells)
  },
  {
    id: "overpass",
    name: "Overpass",
    cols: 12,
    rows: 12,
    pathCells: overpassPathCells,
    buildSlots: buildAllOpenSlots("i", 12, 12, overpassPathCells)
  },
  {
    id: "bastion",
    name: "Bastion",
    cols: 12,
    rows: 12,
    pathCells: bastionPathCells,
    buildSlots: buildAllOpenSlots("j", 12, 12, bastionPathCells)
  }
] as const satisfies readonly MinionsTdMapState[];

export const minionsTdTowerCatalog = [
  {
    id: "guard",
    displayName: "Guard Cannon",
    description: "Guenstiger Allround-Turm mit soliden Upgrades.",
    color: "#38bdf8",
    iconPath: towerIconPath("guard"),
    cost: 50,
    sellRefundRatio: 0.65,
    role: "Basic",
    levels: [
      towerLevel(1, 50, 25, 2.5, 650, { targeting: "Naechste", trait: "Guenstige Verbesserung" }),
      towerLevel(2, 100, 50, 3.0, 650, { targeting: "Naechste", trait: "Guenstige Verbesserung" }),
      towerLevel(3, 150, 75, 3.5, 650, { targeting: "Naechste", trait: "Guenstige Verbesserung" }),
      towerLevel(4, 200, 100, 4, 650, { targeting: "Naechste", trait: "Keine" })
    ]
  },
  {
    id: "emp",
    displayName: "EMP Emitter",
    description: "Verlangsamt Gegner und stuetzt andere Tuerme.",
    color: "#a78bfa",
    iconPath: towerIconPath("emp"),
    cost: 100,
    sellRefundRatio: 0.65,
    role: "Slow",
    levels: [
      towerLevel(1, 100, 25, 2.5, 750, {
        slowPct: 0.3,
        slowDurationMs: 800,
        targeting: "Schnellste",
        trait: "Verlangsamt Ziel"
      }),
      towerLevel(2, 200, 50, 3, 800, {
        slowPct: 0.35,
        slowDurationMs: 800,
        targeting: "Schnellste",
        trait: "Verlangsamt Ziel"
      }),
      towerLevel(3, 400, 75, 3.5, 850, {
        slowPct: 0.45,
        slowDurationMs: 1_000,
        targeting: "Schnellste",
        trait: "Verlangsamt Ziel"
      }),
      towerLevel(4, 3_000, 100, 4, 900, {
        splashRadius: 1.5,
        splashDamagePercent: 0.3,
        slowPct: 0.5,
        slowDurationMs: 1_000,
        targeting: "Schnellste",
        trait: "Verlangsamt mehrere Ziele"
      })
    ]
  },
  {
    id: "burst",
    displayName: "Burst Cannon",
    description: "Verursacht Flaechenschaden gegen Gruppen.",
    color: "#f97316",
    iconPath: towerIconPath("burst"),
    cost: 150,
    sellRefundRatio: 0.65,
    role: "Splash",
    levels: [
      towerLevel(1, 150, 60, 2.5, 1_000, {
        splashRadius: 1.5,
        splashDamagePercent: 0.19,
        targeting: "Naechste",
        trait: "Verursacht Flaechenschaden"
      }),
      towerLevel(2, 300, 120, 3.5, 800, {
        splashRadius: 1.5,
        splashDamagePercent: 0.3,
        targeting: "Naechste",
        trait: "Verursacht Flaechenschaden"
      }),
      towerLevel(3, 600, 180, 3.5, 600, {
        splashRadius: 1.5,
        splashDamagePercent: 0.4,
        targeting: "Naechste",
        trait: "Verursacht Flaechenschaden"
      }),
      towerLevel(4, 1_200, 240, 4, 400, {
        splashRadius: 1.75,
        splashDamagePercent: 0.5,
        targeting: "Naechste",
        trait: "Verursacht Flaechenschaden"
      })
    ]
  },
  {
    id: "missile",
    displayName: "Missile Silo",
    description: "Feuert zielsuchende Raketen mit grossem Explosionsradius.",
    color: "#fb7185",
    iconPath: towerIconPath("missile"),
    cost: 1_000,
    sellRefundRatio: 0.65,
    role: "Rocket",
    levels: [
      towerLevel(1, 1_000, 1_000, 3.5, 3_500, {
        splashRadius: 2,
        splashDamagePercent: 0.19,
        targeting: "Staerkste",
        trait: "Startet zielsuchende Raketen"
      }),
      towerLevel(2, 3_000, 3_500, 4, 3_500, {
        splashRadius: 2.25,
        splashDamagePercent: 0.3,
        targeting: "Staerkste",
        trait: "Startet zielsuchende Raketen"
      }),
      towerLevel(3, 7_500, 7_500, 4.5, 3_000, {
        splashRadius: 2.5,
        splashDamagePercent: 0.4,
        targeting: "Staerkste",
        trait: "Startet zielsuchende Raketen"
      }),
      towerLevel(4, 15_000, 15_000, 5, 3_000, {
        splashRadius: 3,
        splashDamagePercent: 0.5,
        targeting: "Staerkste",
        trait: "Startet zielsuchende Raketen"
      })
    ]
  },
  {
    id: "tesla",
    displayName: "Tesla Coil",
    description: "Sehr hohe Feuerrate mit starkem Einzelschaden.",
    color: "#facc15",
    iconPath: towerIconPath("tesla"),
    cost: 1_000,
    sellRefundRatio: 0.65,
    role: "Speed",
    levels: [
      towerLevel(1, 1_000, 250, 3, 450, {
        targeting: "Staerkste",
        trait: "Schnelle Angriffsgeschwindigkeit"
      }),
      towerLevel(2, 3_000, 700, 3.5, 350, {
        targeting: "Staerkste",
        trait: "Sehr schnelle Angriffsgeschwindigkeit"
      }),
      towerLevel(3, 7_500, 1_350, 4, 250, {
        targeting: "Staerkste",
        trait: "Super schnelle Angriffsgeschwindigkeit"
      }),
      towerLevel(4, 15_000, 1_800, 4.5, 150, {
        targeting: "Staerkste",
        trait: "Ultra schnelle Angriffsgeschwindigkeit"
      })
    ]
  },
  {
    id: "ion",
    displayName: "Ion Cannon",
    description: "Extrem teuer, aber mit enormer Reichweite und Schaden.",
    color: "#22c55e",
    iconPath: towerIconPath("ion"),
    cost: 20_000,
    sellRefundRatio: 0.65,
    role: "Ultimate",
    levels: [
      towerLevel(1, 20_000, 27_500, 7, 5_000, {
        targeting: "Staerkste",
        trait: "Hoher Schaden, sehr hohe Reichweite"
      }),
      towerLevel(2, 50_000, 40_000, 10, 2_500, {
        targeting: "Staerkste",
        trait: "Maximaler Schaden und Reichweite"
      })
    ]
  }
] as const satisfies readonly MinionsTdTowerCatalogEntry[];

export const minionsTdEnemyCatalog = [
  {
    id: "glint",
    displayName: "Glint",
    description: "Schwacher Start-Minion mit Selbstheilung.",
    color: "#38bdf8",
    iconPath: enemyIconPath("glint"),
    sendCost: 50,
    incomeBonus: 5,
    maxHp: 300,
    speed: normalizeEnemySpeed(70),
    bounty: 5,
    damage: resolveEnemyLeakDamage(50),
    trait: "Regeneriert"
  },
  {
    id: "bulwark",
    displayName: "Bulwark",
    description: "Frueher Tank mit EMP-Schutz.",
    color: "#94a3b8",
    iconPath: enemyIconPath("bulwark"),
    sendCost: 100,
    incomeBonus: 10,
    maxHp: 700,
    speed: normalizeEnemySpeed(65),
    bounty: 10,
    damage: resolveEnemyLeakDamage(100),
    trait: "EMP-immun"
  },
  {
    id: "swiftstar",
    displayName: "Swiftstar",
    description: "Flinker Minion fuer fruehe Durchbrueche.",
    color: "#f59e0b",
    iconPath: enemyIconPath("swiftstar"),
    sendCost: 250,
    incomeBonus: 25,
    maxHp: 1_400,
    speed: normalizeEnemySpeed(80),
    bounty: 25,
    damage: resolveEnemyLeakDamage(250),
    trait: "Schnell"
  },
  {
    id: "ironray",
    displayName: "Ironray",
    description: "Robuster Midgame-Minion mit viel Panzerung.",
    color: "#60a5fa",
    iconPath: enemyIconPath("ironray"),
    sendCost: 500,
    incomeBonus: 50,
    maxHp: 3_700,
    speed: normalizeEnemySpeed(50),
    bounty: 50,
    damage: resolveEnemyLeakDamage(500),
    trait: "Stark"
  },
  {
    id: "verdantis",
    displayName: "Verdantis",
    description: "Heilt sich und haelt verstreute Verteidigung gut aus.",
    color: "#34d399",
    iconPath: enemyIconPath("verdantis"),
    sendCost: 1_000,
    incomeBonus: 90,
    maxHp: 6_000,
    speed: normalizeEnemySpeed(60),
    bounty: 90,
    damage: resolveEnemyLeakDamage(1_000),
    trait: "Regeneriert"
  },
  {
    id: "pulsefang",
    displayName: "Pulsefang",
    description: "Zaeher Angreifer, der nicht verlangsamt wird.",
    color: "#f97316",
    iconPath: enemyIconPath("pulsefang"),
    sendCost: 2_000,
    incomeBonus: 180,
    maxHp: 14_000,
    speed: normalizeEnemySpeed(65),
    bounty: 180,
    damage: resolveEnemyLeakDamage(2_000),
    trait: "EMP-immun"
  },
  {
    id: "rushclaw",
    displayName: "Rushclaw",
    description: "Schnell und stabil, ideal fuer Druck.",
    color: "#fb7185",
    iconPath: enemyIconPath("rushclaw"),
    sendCost: 4_000,
    incomeBonus: 360,
    maxHp: 30_000,
    speed: normalizeEnemySpeed(90),
    bounty: 360,
    damage: resolveEnemyLeakDamage(4_000),
    trait: "Schnell"
  },
  {
    id: "stonebeak",
    displayName: "Stonebeak",
    description: "Langsamer, sehr widerstandsfaehiger Einkommens-Minion.",
    color: "#a3a3a3",
    iconPath: enemyIconPath("stonebeak"),
    sendCost: 8_000,
    incomeBonus: 720,
    maxHp: 80_000,
    speed: normalizeEnemySpeed(60),
    bounty: 720,
    damage: resolveEnemyLeakDamage(8_000),
    trait: "Stark"
  },
  {
    id: "grimtalon",
    displayName: "Grimtalon",
    description: "Zaeher Regenerations-Minion fuer laengere Wege.",
    color: "#ef4444",
    iconPath: enemyIconPath("grimtalon"),
    sendCost: 15_000,
    incomeBonus: 1_200,
    maxHp: 120_000,
    speed: normalizeEnemySpeed(70),
    bounty: 1_200,
    damage: resolveEnemyLeakDamage(15_000),
    trait: "Regeneriert"
  },
  {
    id: "shockfin",
    displayName: "Shockfin",
    description: "Schnell, robust und resistent gegen EMP.",
    color: "#14b8a6",
    iconPath: enemyIconPath("shockfin"),
    sendCost: 25_000,
    incomeBonus: 2_000,
    maxHp: 250_000,
    speed: normalizeEnemySpeed(75),
    bounty: 2_000,
    damage: resolveEnemyLeakDamage(25_000),
    trait: "EMP-immun"
  },
  {
    id: "viperx",
    displayName: "Viper X",
    description: "Sehr schnell und deutlich haerter als erwartet.",
    color: "#eab308",
    iconPath: enemyIconPath("viperx"),
    sendCost: 40_000,
    incomeBonus: 3_200,
    maxHp: 500_000,
    speed: normalizeEnemySpeed(100),
    bounty: 3_200,
    damage: resolveEnemyLeakDamage(40_000),
    trait: "Schnell"
  },
  {
    id: "colossar",
    displayName: "Colossar",
    description: "Massiver Panzerbrecher mit enormer Haltbarkeit.",
    color: "#8b5cf6",
    iconPath: enemyIconPath("colossar"),
    sendCost: 60_000,
    incomeBonus: 4_800,
    maxHp: 1_200_000,
    speed: normalizeEnemySpeed(65),
    bounty: 4_800,
    damage: resolveEnemyLeakDamage(60_000),
    trait: "Stark"
  },
  {
    id: "stormlord",
    displayName: "Stormlord",
    description: "Schwere Panzerung kombiniert mit Heilung.",
    color: "#6366f1",
    iconPath: enemyIconPath("stormlord"),
    sendCost: 100_000,
    incomeBonus: 7_000,
    maxHp: 1_400_000,
    speed: normalizeEnemySpeed(65),
    bounty: 7_000,
    damage: resolveEnemyLeakDamage(100_000),
    trait: "Regeneriert"
  },
  {
    id: "ashdrake",
    displayName: "Ashdrake",
    description: "Schneller Endgame-Minion mit EMP-Resistenz.",
    color: "#f97316",
    iconPath: enemyIconPath("ashdrake"),
    sendCost: 200_000,
    incomeBonus: 14_000,
    maxHp: 2_500_000,
    speed: normalizeEnemySpeed(80),
    bounty: 14_000,
    damage: resolveEnemyLeakDamage(200_000),
    trait: "EMP-immun"
  },
  {
    id: "flashreign",
    displayName: "Flashreign",
    description: "Extrem schneller Albtraum fuer jede Verteidigung.",
    color: "#facc15",
    iconPath: enemyIconPath("flashreign"),
    sendCost: 400_000,
    incomeBonus: 28_000,
    maxHp: 6_000_000,
    speed: normalizeEnemySpeed(140),
    bounty: 28_000,
    damage: resolveEnemyLeakDamage(400_000),
    trait: "Sehr schnell"
  },
  {
    id: "hivecore",
    displayName: "Hivecore",
    description: "Boss-Einheit, die weitere Minions hervorbringt.",
    color: "#ec4899",
    iconPath: enemyIconPath("hivecore"),
    sendCost: 1_250_000,
    incomeBonus: 87_500,
    maxHp: 15_000_000,
    speed: normalizeEnemySpeed(70),
    bounty: 105_000,
    damage: resolveEnemyLeakDamage(1_250_000),
    trait: "Generiert Minions"
  }
] as const satisfies readonly MinionsTdEnemyCatalogEntry[];

const pathMetricsCache = new Map<string, PathMetrics>();

function toCellCenter(cell: MinionsTdMapPathCellState): PathPoint {
  return {
    x: cell.col + 0.5,
    y: cell.row + 0.5
  };
}

function buildPathMetrics(map: MinionsTdMapState): PathMetrics {
  const points = map.pathCells.map(toCellCenter);
  const segments: PathSegment[] = [];
  let totalLength = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const length = Math.hypot(end.x - start.x, end.y - start.y);

    segments.push({
      start,
      end,
      length
    });
    totalLength += length;
  }

  return {
    totalLength,
    points,
    segments
  };
}

function resolvePathMetrics(map: MinionsTdMapState): PathMetrics {
  const cached = pathMetricsCache.get(map.id);

  if (cached) {
    return cached;
  }

  const metrics = buildPathMetrics(map);
  pathMetricsCache.set(map.id, metrics);
  return metrics;
}

export function selectMinionsTdMap(roundNumber: number): MinionsTdMapState {
  const safeRoundNumber = Math.max(1, roundNumber);
  return minionsTdMaps[(safeRoundNumber - 1) % minionsTdMaps.length] ?? minionsTdMaps[0];
}

export function resolveMinionsTdMap(
  mapId: string | null | undefined,
  roundNumber: number
): MinionsTdMapState {
  if (typeof mapId === "string") {
    const explicitMap = minionsTdMaps.find((entry) => entry.id === mapId);

    if (explicitMap) {
      return explicitMap;
    }
  }

  return selectMinionsTdMap(roundNumber);
}

export function listMinionsTdMaps(): MinionsTdMapState[] {
  return minionsTdMaps.map((map) => ({
    ...map,
    pathCells: map.pathCells.map((cell) => ({ ...cell })),
    buildSlots: map.buildSlots.map((slot) => ({ ...slot }))
  }));
}

export function resolveMinionsTdTowerCatalogEntry(towerTypeId: string): MinionsTdTowerCatalogEntry | undefined {
  return minionsTdTowerCatalog.find((entry) => entry.id === towerTypeId);
}

export function resolveMinionsTdEnemyCatalogEntry(enemyTypeId: string): MinionsTdEnemyCatalogEntry | undefined {
  return minionsTdEnemyCatalog.find((entry) => entry.id === enemyTypeId);
}

export function resolveMinionsTdTowerLevelEntry(
  towerTypeId: string,
  level: number
): MinionsTdTowerLevelState | undefined {
  return resolveMinionsTdTowerCatalogEntry(towerTypeId)?.levels.find((entry) => entry.level === level);
}

export function resolveMinionsTdBuildSlot(
  map: MinionsTdMapState,
  slotId: string
): MinionsTdMapBuildSlotState | undefined {
  return map.buildSlots.find((slot) => slot.id === slotId);
}

export function resolveMinionsTdBuildSlotCenter(slot: MinionsTdMapBuildSlotState): PathPoint {
  return {
    x: slot.col + 0.5,
    y: slot.row + 0.5
  };
}

export function resolveMinionsTdPathLength(map: MinionsTdMapState): number {
  return resolvePathMetrics(map).totalLength;
}

export function resolveMinionsTdPathPosition(map: MinionsTdMapState, progress: number): PathPoint {
  const metrics = resolvePathMetrics(map);

  if (metrics.points.length === 0) {
    return { x: 0, y: 0 };
  }

  if (metrics.points.length === 1 || progress <= 0) {
    return metrics.points[0];
  }

  let remaining = Math.min(progress, metrics.totalLength);

  for (const segment of metrics.segments) {
    if (remaining <= segment.length) {
      const ratio = segment.length <= 0 ? 0 : remaining / segment.length;
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * ratio,
        y: segment.start.y + (segment.end.y - segment.start.y) * ratio
      };
    }

    remaining -= segment.length;
  }

  return metrics.points[metrics.points.length - 1];
}
