import type { BaseRoundState, GamePlayerSummary } from "@open-party-lab/game-core";
import type {
  MinionsTdEnemyState,
  MinionsTdPlayerBoardState,
  MinionsTdProjectileState,
  MinionsTdResultState,
  MinionsTdState,
  MinionsTdTowerState,
  SupportedLanguage
} from "@open-party-lab/protocol";
import { minionsTdConfig, minionsTdEnemyCatalog, minionsTdTowerCatalog } from "./minionsTdConfig.js";

export interface MinionsTdRuntimeTowerState extends MinionsTdTowerState {
  totalInvested: number;
}

export interface MinionsTdRuntimePlayerBoardState
  extends Omit<MinionsTdPlayerBoardState, "towers"> {
  towers: MinionsTdRuntimeTowerState[];
  leakSignalCount: number;
  passiveIncomeAtMs: number;
}

export interface MinionsTdRuntimeState extends BaseRoundState, Omit<MinionsTdState, "players"> {
  language: SupportedLanguage;
  players: MinionsTdRuntimePlayerBoardState[];
  nextEnemyId: number;
  nextTowerId: number;
  nextProjectileId: number;
}

export const minionsTdScoreByPlace = [3, 2, 1, 0] as const;

const minionsTdControllerTowerCatalog = minionsTdTowerCatalog.map((entry) => ({
  ...entry,
  levels: entry.levels.map((level) => ({
    ...level
  }))
}));

const minionsTdControllerEnemyCatalog = minionsTdEnemyCatalog.map((entry) => ({
  ...entry
}));

function compareNullableDesc(left: number | null, right: number | null): number {
  return (right ?? -1) - (left ?? -1);
}

function resolveNextAliveIndex(
  players: readonly MinionsTdRuntimePlayerBoardState[],
  fromIndex: number
): number | null {
  const aliveCount = players.filter((player) => player.alive).length;

  if (aliveCount <= 1) {
    return null;
  }

  for (let offset = 1; offset < players.length; offset += 1) {
    const nextIndex = (fromIndex + offset) % players.length;

    if (players[nextIndex]?.alive) {
      return nextIndex;
    }
  }

  return null;
}

export function createMinionsTdResult(): MinionsTdResultState {
  return {
    outcome: "running"
  };
}

export function resolveMinionsTdAlivePlayerIds(
  players: readonly MinionsTdRuntimePlayerBoardState[]
): string[] {
  return players.filter((player) => player.alive).map((player) => player.playerId);
}

export function withMinionsTdOutgoingTargets(
  players: readonly MinionsTdRuntimePlayerBoardState[]
): MinionsTdRuntimePlayerBoardState[] {
  return players.map((player, index) => {
    const nextAliveIndex = player.alive ? resolveNextAliveIndex(players, index) : null;
    const targetPlayer = nextAliveIndex === null ? null : players[nextAliveIndex];

    return {
      ...player,
      outgoingToPlayerId: targetPlayer?.playerId ?? null,
      outgoingToPlayerName: targetPlayer?.name ?? null
    };
  });
}

export function createMinionsTdPlayerBoards(
  gamePlayers: readonly GamePlayerSummary[],
  now: number,
  startingGold: number,
  startingLives: number
): MinionsTdRuntimePlayerBoardState[] {
  return withMinionsTdOutgoingTargets(
    gamePlayers.slice(0, minionsTdConfig.maxPlayers).map((player) => ({
      playerId: player.id,
      name: player.name,
      color: player.color,
      gold: startingGold,
      lives: startingLives,
      alive: true,
      towers: [],
      enemies: [],
      projectiles: [],
      kills: 0,
      sends: 0,
      leaks: 0,
      leakSignalCount: 0,
      incomeTickValue: minionsTdConfig.passiveIncomeValue,
      incomeTickEveryMs: minionsTdConfig.passiveIncomeEveryMs,
      outgoingToPlayerId: null,
      outgoingToPlayerName: null,
      defeatedAt: null,
      passiveIncomeAtMs: now + minionsTdConfig.passiveIncomeEveryMs
    }))
  );
}

export function rankMinionsTdPlayers(
  players: readonly MinionsTdRuntimePlayerBoardState[]
): MinionsTdRuntimePlayerBoardState[] {
  return [...players].sort(
    (left, right) =>
      Number(right.alive) - Number(left.alive) ||
      right.lives - left.lives ||
      compareNullableDesc(left.defeatedAt, right.defeatedAt) ||
      right.kills - left.kills ||
      right.gold - left.gold ||
      left.name.localeCompare(right.name)
  );
}

export function toPublicMinionsTdState(state: MinionsTdRuntimeState): MinionsTdState {
  return {
    map: state.map,
    availableMaps: state.availableMaps.map((map) => ({
      ...map,
      pathCells: map.pathCells.map((cell) => ({ ...cell })),
      buildSlots: map.buildSlots.map((slot) => ({ ...slot }))
    })),
    selectedMapId: state.selectedMapId,
    elapsedMs: state.elapsedMs,
    remainingMs: state.remainingMs,
    startingLives: state.startingLives,
    startingGold: state.startingGold,
    towerCatalog: [...minionsTdTowerCatalog],
    enemyCatalog: [...minionsTdEnemyCatalog],
    players: state.players.map((player) => ({
      playerId: player.playerId,
      name: player.name,
      color: player.color,
      gold: player.gold,
      lives: player.lives,
      alive: player.alive,
      towers: player.towers.map(({ totalInvested: _totalInvested, ...tower }) => ({
        ...tower
      })),
      enemies: player.enemies.map((enemy: MinionsTdEnemyState) => ({
        ...enemy
      })),
      projectiles: player.projectiles.map((projectile: MinionsTdProjectileState) => ({
        ...projectile
      })),
      kills: player.kills,
      sends: player.sends,
      leaks: player.leaks,
      leakSignalCount: player.leakSignalCount,
      incomeTickValue: player.incomeTickValue,
      incomeTickEveryMs: player.incomeTickEveryMs,
      outgoingToPlayerId: player.outgoingToPlayerId,
      outgoingToPlayerName: player.outgoingToPlayerName,
      defeatedAt: player.defeatedAt
    })),
    ringOrder: [...state.ringOrder],
    alivePlayerIds: [...state.alivePlayerIds],
    result: {
      ...state.result
    }
  };
}

export function toControllerMinionsTdState(
  state: MinionsTdRuntimeState,
  currentPlayerId?: string | null
): MinionsTdState {
  return {
    map: state.map,
    availableMaps: [],
    selectedMapId: state.selectedMapId,
    elapsedMs: state.elapsedMs,
    remainingMs: state.remainingMs,
    startingLives: state.startingLives,
    startingGold: state.startingGold,
    towerCatalog: minionsTdControllerTowerCatalog,
    enemyCatalog: minionsTdControllerEnemyCatalog,
    players: state.players.map((player) => {
      const isCurrentPlayer = player.playerId === currentPlayerId;

      return {
        playerId: player.playerId,
        name: player.name,
        color: player.color,
        gold: player.gold,
        lives: player.lives,
        alive: player.alive,
        towers: isCurrentPlayer
          ? player.towers.map(({ totalInvested: _totalInvested, ...tower }) => ({
              ...tower
            }))
          : [],
        enemies: [],
        projectiles: [],
        kills: player.kills,
        sends: player.sends,
        leaks: player.leaks,
        leakSignalCount: player.leakSignalCount,
        incomeTickValue: player.incomeTickValue,
        incomeTickEveryMs: player.incomeTickEveryMs,
        outgoingToPlayerId: player.outgoingToPlayerId,
        outgoingToPlayerName: player.outgoingToPlayerName,
        defeatedAt: player.defeatedAt
      };
    }),
    ringOrder: state.ringOrder,
    alivePlayerIds: state.alivePlayerIds,
    result: {
      ...state.result
    }
  };
}
