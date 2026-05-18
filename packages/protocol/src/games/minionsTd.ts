import type { PlayerInput } from "@open-party-lab/game-core";

export interface MinionsTdBuildInput extends PlayerInput {
  type: "build";
  slotId: string;
  towerTypeId: string;
}

export interface MinionsTdUpgradeInput extends PlayerInput {
  type: "upgrade";
  slotId: string;
}

export interface MinionsTdSellInput extends PlayerInput {
  type: "sell";
  slotId: string;
}

export interface MinionsTdSendInput extends PlayerInput {
  type: "send";
  enemyTypeId: string;
}

export interface MinionsTdSelectMapHostAction {
  type: "select-map";
  mapId: string;
}

export const minionsTdSetupConfig = {
  startingLives: {
    min: 5,
    max: 50,
    step: 5,
    defaultValue: 20
  },
  startingGold: {
    min: 250,
    max: 5000,
    step: 250,
    defaultValue: 1000
  }
} as const;

export interface MinionsTdConfigureLobbyHostAction {
  type: "configure-lobby";
  mapId?: string;
  startingLives?: number;
  startingGold?: number;
}

export type MinionsTdInput =
  | MinionsTdBuildInput
  | MinionsTdUpgradeInput
  | MinionsTdSellInput
  | MinionsTdSendInput;

export type MinionsTdHostAction =
  | MinionsTdSelectMapHostAction
  | MinionsTdConfigureLobbyHostAction;

export interface MinionsTdMapPathCellState {
  col: number;
  row: number;
}

export interface MinionsTdMapBuildSlotState {
  id: string;
  col: number;
  row: number;
}

export interface MinionsTdMapState {
  id: string;
  name: string;
  cols: number;
  rows: number;
  pathCells: MinionsTdMapPathCellState[];
  buildSlots: MinionsTdMapBuildSlotState[];
}

export interface MinionsTdLobbyState {
  maps: MinionsTdMapState[];
  selectedMapId: string;
  startingLives: number;
  startingGold: number;
}

export interface MinionsTdTowerLevelState {
  level: number;
  price: number;
  damage: number;
  range: number;
  fireRateMs: number;
  splashRadius?: number;
  splashDamagePercent?: number;
  slowPct?: number;
  slowDurationMs?: number;
  targeting?: string;
  trait?: string;
}

export interface MinionsTdTowerCatalogEntry {
  id: string;
  displayName: string;
  description: string;
  color: string;
  iconPath?: string;
  cost: number;
  sellRefundRatio: number;
  role?: string;
  levels: MinionsTdTowerLevelState[];
}

export function resolveMinionsTdUpgradeCost(
  baseCost: number,
  currentLevel: number,
  levels?: readonly MinionsTdTowerLevelState[]
): number {
  const nextLevel = levels?.find((entry) => entry.level === currentLevel + 1);

  if (nextLevel) {
    return nextLevel.price;
  }

  return Math.max(baseCost + 2, Math.round(baseCost * (1.2 + currentLevel * 0.55)));
}

export function resolveMinionsTdSellValue(totalInvested: number, sellRefundRatio: number): number {
  return Math.max(1, Math.round(totalInvested * sellRefundRatio));
}

export interface MinionsTdEnemyCatalogEntry {
  id: string;
  displayName: string;
  description: string;
  color: string;
  iconPath?: string;
  sendCost: number;
  incomeBonus: number;
  maxHp: number;
  speed: number;
  bounty: number;
  damage: number;
  trait?: string;
}

export interface MinionsTdTowerState {
  id: string;
  slotId: string;
  towerTypeId: string;
  displayName: string;
  level: number;
  damage: number;
  range: number;
  fireRateMs: number;
  color: string;
  cooldownRemainingMs: number;
  investedGold: number;
  splashRadius?: number;
  splashDamagePercent?: number;
  slowPct?: number;
  slowDurationMs?: number;
  targeting?: string;
  trait?: string;
}

export interface MinionsTdEnemyState {
  id: string;
  enemyTypeId: string;
  displayName: string;
  color: string;
  x: number;
  y: number;
  progress: number;
  hp: number;
  maxHp: number;
  speed: number;
  bounty: number;
  damage: number;
  forwardedCount: number;
  sentByPlayerId?: string | null;
  slowPct: number;
  slowRemainingMs: number;
}

export type MinionsTdProjectileStyle = "beam" | "heavy_beam" | "bullet" | "rocket" | "arc";

export interface MinionsTdProjectileState {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  radius: number;
  style: MinionsTdProjectileStyle;
  remainingMs: number;
  maxLifetimeMs: number;
  splashRadius?: number;
}

export interface MinionsTdPlayerBoardState {
  playerId: string;
  name: string;
  color: string;
  gold: number;
  lives: number;
  alive: boolean;
  towers: MinionsTdTowerState[];
  enemies: MinionsTdEnemyState[];
  projectiles: MinionsTdProjectileState[];
  kills: number;
  sends: number;
  leaks: number;
  leakSignalCount: number;
  incomeTickValue: number;
  incomeTickEveryMs: number;
  outgoingToPlayerId: string | null;
  outgoingToPlayerName: string | null;
  defeatedAt: number | null;
}

export interface MinionsTdResultState {
  outcome: "running" | "finished";
  winnerPlayerId?: string;
  winnerName?: string;
  reason?: "last_player_standing" | "time_limit";
}

export interface MinionsTdState {
  map: MinionsTdMapState;
  availableMaps: MinionsTdMapState[];
  selectedMapId: string;
  elapsedMs: number;
  remainingMs: number | null;
  startingLives: number;
  startingGold: number;
  towerCatalog: MinionsTdTowerCatalogEntry[];
  enemyCatalog: MinionsTdEnemyCatalogEntry[];
  players: MinionsTdPlayerBoardState[];
  ringOrder: string[];
  alivePlayerIds: string[];
  result: MinionsTdResultState;
}
