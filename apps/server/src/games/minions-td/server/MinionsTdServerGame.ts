import {
  createBaseRoundState,
  resolveRoundPhaseTimings,
  transitionRoundState,
  type ScoreEntry,
  type ServerGameContext,
  type ServerGame
} from "@open-party-lab/game-core";
import {
  minionsTdSetupConfig,
  resolveMinionsTdSellValue,
  resolveMinionsTdUpgradeCost
} from "@open-party-lab/protocol";
import type {
  MinionsTdConfigureLobbyHostAction,
  MinionsTdEnemyCatalogEntry,
  MinionsTdHostAction,
  MinionsTdEnemyState,
  MinionsTdInput,
  MinionsTdProjectileState,
  MinionsTdState
} from "@open-party-lab/protocol";
import { minionsTdManifest } from "../manifest.js";
import {
  minionsTdConfig,
  minionsTdRoomSettingKeys,
  minionsTdEnemyCatalog,
  minionsTdTowerCatalog,
  listMinionsTdMaps,
  resolveMinionsTdBuildSlot,
  resolveMinionsTdBuildSlotCenter,
  resolveMinionsTdEnemyCatalogEntry,
  resolveMinionsTdMap,
  resolveMinionsTdPathLength,
  resolveMinionsTdPathPosition,
  resolveMinionsTdTowerCatalogEntry,
  resolveMinionsTdTowerLevelEntry,
} from "./minionsTdConfig.js";
import {
  createMinionsTdPlayerBoards,
  createMinionsTdResult,
  minionsTdScoreByPlace,
  rankMinionsTdPlayers,
  resolveMinionsTdAlivePlayerIds,
  toControllerMinionsTdState,
  toPublicMinionsTdState,
  withMinionsTdOutgoingTargets,
  type MinionsTdRuntimePlayerBoardState,
  type MinionsTdRuntimeState,
  type MinionsTdRuntimeTowerState
} from "./minionsTdState.js";

interface LeakEvent {
  ownerPlayerId: string;
  enemy: MinionsTdEnemyState;
}

interface PendingSpawn {
  targetPlayerId: string;
  enemy: MinionsTdEnemyState;
}

const phaseTimings = resolveRoundPhaseTimings(minionsTdManifest.phaseDurations);

function createEnemyInstance(
  enemyDefinition: MinionsTdEnemyCatalogEntry,
  enemyId: number,
  sentByPlayerId: string | null,
  progress = 0,
  hp = enemyDefinition.maxHp,
  forwardedCount = 0
): MinionsTdEnemyState {
  return {
    id: `enemy-${enemyId}`,
    enemyTypeId: enemyDefinition.id,
    displayName: enemyDefinition.displayName,
    color: enemyDefinition.color,
    x: 0,
    y: 0,
    progress,
    hp,
    maxHp: enemyDefinition.maxHp,
    speed: enemyDefinition.speed,
    bounty: enemyDefinition.bounty,
    damage: enemyDefinition.damage,
    forwardedCount,
    sentByPlayerId,
    slowPct: 0,
    slowRemainingMs: 0
  };
}

function createTowerInstance(
  towerTypeId: string,
  slotId: string,
  towerId: number
): MinionsTdRuntimeTowerState | null {
  const towerDefinition = resolveMinionsTdTowerCatalogEntry(towerTypeId);
  const levelDefinition = resolveMinionsTdTowerLevelEntry(towerTypeId, 1);

  if (!towerDefinition || !levelDefinition) {
    return null;
  }

  return {
    id: `tower-${towerId}`,
    slotId,
    towerTypeId,
    displayName: towerDefinition.displayName,
    level: 1,
    damage: levelDefinition.damage,
    range: levelDefinition.range,
    fireRateMs: levelDefinition.fireRateMs,
    color: towerDefinition.color,
    cooldownRemainingMs: 0,
    investedGold: towerDefinition.cost,
    splashRadius: levelDefinition.splashRadius,
    splashDamagePercent: levelDefinition.splashDamagePercent,
    slowPct: levelDefinition.slowPct,
    slowDurationMs: levelDefinition.slowDurationMs,
    targeting: levelDefinition.targeting,
    trait: levelDefinition.trait,
    totalInvested: towerDefinition.cost
  };
}

function createShotProjectile(
  projectileId: number,
  originX: number,
  originY: number,
  targetX: number,
  targetY: number,
  tower: MinionsTdRuntimeTowerState
): MinionsTdProjectileState {
  const style =
    tower.towerTypeId === "ion"
      ? "heavy_beam"
      : tower.towerTypeId === "missile"
        ? "rocket"
        : tower.towerTypeId === "emp"
          ? "arc"
        : tower.towerTypeId === "tesla"
          ? "bullet"
          : "beam";
  const maxLifetimeMs =
    style === "rocket" ? 420 : style === "bullet" ? 120 : style === "heavy_beam" ? 210 : style === "arc" ? 150 : 170;
  const radius =
    style === "rocket" ? 0.16 : style === "bullet" ? 0.11 : style === "heavy_beam" ? 0.2 : style === "arc" ? 0.13 : 0.12;

  return {
    id: `shot-${projectileId}`,
    x: originX,
    y: originY,
    targetX,
    targetY,
    color: tower.color,
    radius,
    style,
    remainingMs: maxLifetimeMs,
    maxLifetimeMs,
    splashRadius: tower.splashRadius
  };
}

function clonePlayers(players: readonly MinionsTdRuntimePlayerBoardState[]): MinionsTdRuntimePlayerBoardState[] {
  return players.map((player) => ({
    ...player,
    towers: player.towers.map((tower) => ({ ...tower })),
    enemies: player.enemies.map((enemy) => ({ ...enemy })),
    projectiles: player.projectiles.map((projectile) => ({ ...projectile }))
  }));
}

function resolvePlayerIndex(
  players: readonly MinionsTdRuntimePlayerBoardState[],
  playerId: string
): number {
  return players.findIndex((player) => player.playerId === playerId);
}

function resolveNextAlivePlayerId(
  players: readonly MinionsTdRuntimePlayerBoardState[],
  playerId: string
): string | null {
  const playerIndex = resolvePlayerIndex(players, playerId);

  if (playerIndex === -1) {
    return null;
  }

  const aliveCount = players.filter((player) => player.alive).length;

  if (aliveCount <= 1) {
    return null;
  }

  for (let offset = 1; offset < players.length; offset += 1) {
    const nextPlayer = players[(playerIndex + offset) % players.length];

    if (nextPlayer?.alive) {
      return nextPlayer.playerId;
    }
  }

  return null;
}

function applyPassiveIncome(players: MinionsTdRuntimePlayerBoardState[], now: number): void {
  for (const player of players) {
    if (!player.alive) {
      continue;
    }

    while (now >= player.passiveIncomeAtMs) {
      player.gold += player.incomeTickValue;
      player.passiveIncomeAtMs += player.incomeTickEveryMs;
    }
  }
}

function ageProjectiles(players: MinionsTdRuntimePlayerBoardState[], deltaMs: number): void {
  for (const player of players) {
    if (!player.alive) {
      player.projectiles = [];
      continue;
    }

    player.projectiles = player.projectiles
      .map((projectile) => ({
        ...projectile,
        remainingMs: Math.max(0, projectile.remainingMs - deltaMs)
      }))
      .filter((projectile) => projectile.remainingMs > 0);
  }
}

function advanceEnemies(
  players: MinionsTdRuntimePlayerBoardState[],
  state: MinionsTdRuntimeState,
  deltaMs: number
): LeakEvent[] {
  const pathLength = resolveMinionsTdPathLength(state.map);
  const exitPosition = resolveMinionsTdPathPosition(state.map, pathLength);
  const leakEvents: LeakEvent[] = [];

  for (const player of players) {
    if (!player.alive) {
      player.enemies = [];
      player.projectiles = [];
      continue;
    }

    const nextEnemies: MinionsTdEnemyState[] = [];

    for (const enemy of player.enemies) {
      const nextSlowRemainingMs = Math.max(0, enemy.slowRemainingMs - deltaMs);
      const effectiveSlowPct = nextSlowRemainingMs > 0 ? enemy.slowPct : 0;
      const effectiveSpeed = enemy.speed * (1 - Math.min(0.8, effectiveSlowPct));
      const nextProgress = enemy.progress + effectiveSpeed * (deltaMs / 1000);

      if (nextProgress >= pathLength) {
        leakEvents.push({
          ownerPlayerId: player.playerId,
          enemy: {
            ...enemy,
            progress: pathLength,
            x: exitPosition.x,
            y: exitPosition.y,
            slowPct: effectiveSlowPct,
            slowRemainingMs: nextSlowRemainingMs
          }
        });
        continue;
      }

      const position = resolveMinionsTdPathPosition(state.map, nextProgress);

      nextEnemies.push({
        ...enemy,
        progress: nextProgress,
        x: position.x,
        y: position.y,
        slowPct: effectiveSlowPct,
        slowRemainingMs: nextSlowRemainingMs
      });
    }

    player.enemies = nextEnemies;
  }

  return leakEvents;
}

function resolveTargetEnemyIndex(
  lane: MinionsTdRuntimePlayerBoardState,
  state: MinionsTdRuntimeState,
  tower: MinionsTdRuntimeTowerState
): number {
  const slot = resolveMinionsTdBuildSlot(state.map, tower.slotId);

  if (!slot) {
    return -1;
  }

  const center = resolveMinionsTdBuildSlotCenter(slot);
  const rangeSquared = tower.range * tower.range;
  let selectedIndex = -1;
  let selectedEnemy: MinionsTdRuntimePlayerBoardState["enemies"][number] | null = null;

  for (let index = 0; index < lane.enemies.length; index += 1) {
    const enemy = lane.enemies[index];
    const dx = enemy.x - center.x;
    const dy = enemy.y - center.y;
    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared > rangeSquared) {
      continue;
    }

    if (!selectedEnemy) {
      selectedEnemy = enemy;
      selectedIndex = index;
      continue;
    }

    if (tower.targeting === "Staerkste") {
      if (
        enemy.hp > selectedEnemy.hp ||
        (enemy.hp === selectedEnemy.hp && enemy.progress > selectedEnemy.progress)
      ) {
        selectedEnemy = enemy;
        selectedIndex = index;
      }
      continue;
    }

    if (tower.targeting === "Schnellste") {
      if (
        enemy.speed > selectedEnemy.speed ||
        (enemy.speed === selectedEnemy.speed && enemy.progress > selectedEnemy.progress)
      ) {
        selectedEnemy = enemy;
        selectedIndex = index;
      }
      continue;
    }

    if (
      enemy.progress > selectedEnemy.progress ||
      (enemy.progress === selectedEnemy.progress && enemy.hp > selectedEnemy.hp)
    ) {
      selectedEnemy = enemy;
      selectedIndex = index;
    }
  }

  return selectedIndex;
}

function runTowerCombat(
  players: MinionsTdRuntimePlayerBoardState[],
  state: MinionsTdRuntimeState,
  deltaMs: number,
  nextProjectileId: number
): { nextProjectileId: number } {
  for (const player of players) {
    if (!player.alive) {
      continue;
    }

    for (const tower of player.towers) {
      const slot = resolveMinionsTdBuildSlot(state.map, tower.slotId);
      let cooldownRemainingMs = Math.max(0, tower.cooldownRemainingMs - deltaMs);
      let shotCount = 0;

      while (cooldownRemainingMs <= 0 && shotCount < 4) {
        const targetIndex = resolveTargetEnemyIndex(player, state, tower);

        if (targetIndex === -1 || !slot) {
          cooldownRemainingMs = 0;
          break;
        }

        const origin = resolveMinionsTdBuildSlotCenter(slot);
        const target = player.enemies[targetIndex];

        player.projectiles.push(
          createShotProjectile(
            nextProjectileId,
            origin.x,
            origin.y,
            target.x,
            target.y,
            tower
          )
        );
        nextProjectileId += 1;
        target.hp -= tower.damage;

        if (tower.slowPct && tower.slowDurationMs) {
          target.slowPct = Math.max(target.slowPct, tower.slowPct);
          target.slowRemainingMs = Math.max(target.slowRemainingMs, tower.slowDurationMs);
        }

        if (tower.splashRadius && tower.splashDamagePercent) {
          const splashRadiusSquared = tower.splashRadius * tower.splashRadius;
          const splashDamage = Math.max(1, Math.round(tower.damage * tower.splashDamagePercent));

          for (const splashTarget of player.enemies) {
            if (splashTarget.id === target.id) {
              continue;
            }

            const dx = splashTarget.x - target.x;
            const dy = splashTarget.y - target.y;
            const distanceSquared = dx * dx + dy * dy;

            if (distanceSquared > splashRadiusSquared) {
              continue;
            }

            splashTarget.hp -= splashDamage;

            if (tower.slowPct && tower.slowDurationMs) {
              splashTarget.slowPct = Math.max(splashTarget.slowPct, tower.slowPct);
              splashTarget.slowRemainingMs = Math.max(
                splashTarget.slowRemainingMs,
                tower.slowDurationMs
              );
            }
          }
        }

        cooldownRemainingMs += tower.fireRateMs;
        shotCount += 1;

        const defeatedEnemies = player.enemies.filter((enemy) => enemy.hp <= 0);

        if (defeatedEnemies.length > 0) {
          player.gold += defeatedEnemies.reduce((total, enemy) => total + enemy.bounty, 0);
          player.kills += defeatedEnemies.length;
          player.enemies = player.enemies.filter((enemy) => enemy.hp > 0);
        }
      }

      tower.cooldownRemainingMs = cooldownRemainingMs;
    }
  }

  return {
    nextProjectileId
  };
}

function createForwardedEnemy(
  leakedEnemy: MinionsTdEnemyState,
  targetPlayerId: string,
  nextEnemyId: number
): PendingSpawn | null {
  const enemyDefinition = resolveMinionsTdEnemyCatalogEntry(leakedEnemy.enemyTypeId);

  if (!enemyDefinition) {
    return null;
  }

  const hpRatio = leakedEnemy.maxHp > 0 ? leakedEnemy.hp / leakedEnemy.maxHp : 1;
  const carriedHp = Math.max(1, Math.round(enemyDefinition.maxHp * Math.max(0.1, hpRatio)));

  return {
    targetPlayerId,
    enemy: createEnemyInstance(
      enemyDefinition,
      nextEnemyId,
      leakedEnemy.sentByPlayerId ?? null,
      0,
      carriedHp,
      leakedEnemy.forwardedCount + 1
    )
  };
}

function processLeaks(
  players: MinionsTdRuntimePlayerBoardState[],
  map: MinionsTdRuntimeState["map"],
  leakEvents: LeakEvent[],
  now: number,
  nextEnemyId: number
): { nextEnemyId: number } {
  for (const event of leakEvents) {
    const owner = players.find((player) => player.playerId === event.ownerPlayerId);

    if (!owner || !owner.alive) {
      continue;
    }

    owner.lives = Math.max(0, owner.lives - event.enemy.damage);
    owner.leaks += 1;
    owner.leakSignalCount += 1;

    if (owner.lives <= 0) {
      owner.alive = false;
      owner.defeatedAt = now;
      owner.enemies = [];
      owner.projectiles = [];
    }
  }

  const pendingSpawns: PendingSpawn[] = [];

  for (const event of leakEvents) {
    const targetPlayerId = resolveNextAlivePlayerId(players, event.ownerPlayerId);
    const wouldReturnToSender =
      typeof event.enemy.sentByPlayerId === "string" &&
      event.enemy.sentByPlayerId === targetPlayerId;

    if (!targetPlayerId || wouldReturnToSender) {
      continue;
    }

    const forwardedEnemy = createForwardedEnemy(event.enemy, targetPlayerId, nextEnemyId);

    if (!forwardedEnemy) {
      continue;
    }

    nextEnemyId += 1;
    pendingSpawns.push(forwardedEnemy);
  }

  for (const spawn of pendingSpawns) {
    const targetPlayer = players.find((player) => player.playerId === spawn.targetPlayerId);

    if (!targetPlayer || !targetPlayer.alive) {
      continue;
    }

    const spawnPosition = resolveMinionsTdPathPosition(map, 0);
    spawn.enemy.x = spawnPosition.x;
    spawn.enemy.y = spawnPosition.y;
    targetPlayer.enemies.push(spawn.enemy);
  }

  return {
    nextEnemyId
  };
}

function resolvePlacements(players: readonly MinionsTdRuntimePlayerBoardState[]): ScoreEntry[] {
  const rankedPlayers = rankMinionsTdPlayers(players);

  return rankedPlayers.map((player, index) => ({
    playerId: player.playerId,
    delta: minionsTdScoreByPlace[index] ?? 0,
    reason: "MinionsTD Platzierung"
  }));
}

function finishMatch(
  state: MinionsTdRuntimeState,
  now: number,
  winnerPlayer: MinionsTdRuntimePlayerBoardState | undefined,
  reason: "last_player_standing" | "time_limit"
): MinionsTdRuntimeState {
  const en = state.language === "en";
  const winnerName = winnerPlayer?.name ?? (en ? "Nobody" : "Niemand");
  return transitionRoundState(
    {
      ...state,
      alivePlayerIds: resolveMinionsTdAlivePlayerIds(state.players),
      result: {
        outcome: "finished",
        winnerPlayerId: winnerPlayer?.playerId,
        winnerName: winnerPlayer?.name,
        reason
      }
    },
    "locked",
    now,
    {
      message:
        reason === "time_limit"
          ? en ? `${winnerName} wins after time runs out.` : `${winnerName} gewinnt nach Zeit.`
          : en ? `${winnerName} survives the longest.` : `${winnerName} ueberlebt am laengsten.`,
      durationMs: 1_400
    }
  );
}

function canModifyTowers(phase: MinionsTdRuntimeState["phase"]): boolean {
  return phase === "countdown" || phase === "playing";
}

function canSendEnemies(phase: MinionsTdRuntimeState["phase"]): boolean {
  return phase === "playing";
}

function buildPreparationMessage(mapName: string, en = false): string {
  return en ? `Preparing MinionsTD on ${mapName}.` : `MinionsTD auf ${mapName} wird vorbereitet.`;
}

function clampLobbyNumber(
  value: number | undefined,
  config: (typeof minionsTdSetupConfig)["startingLives"] | (typeof minionsTdSetupConfig)["startingGold"]
): number {
  if (!Number.isFinite(value)) {
    return config.defaultValue;
  }

  const normalized = Math.round((value as number) / config.step) * config.step;
  return Math.max(config.min, Math.min(config.max, normalized));
}

function resolveConfiguredMapId(context: ServerGameContext): string | null {
  const configuredMapId = context.roomSettings[minionsTdRoomSettingKeys.selectedMapId];
  return typeof configuredMapId === "string" ? configuredMapId : null;
}

function resolveConfiguredMap(context: ServerGameContext) {
  return resolveMinionsTdMap(resolveConfiguredMapId(context), context.roundNumber);
}

function resolveConfiguredStartingLives(context: ServerGameContext): number {
  const configuredValue = context.roomSettings[minionsTdRoomSettingKeys.startingLives];
  return clampLobbyNumber(
    typeof configuredValue === "number" ? configuredValue : undefined,
    minionsTdSetupConfig.startingLives
  );
}

function resolveConfiguredStartingGold(context: ServerGameContext): number {
  const configuredValue = context.roomSettings[minionsTdRoomSettingKeys.startingGold];
  return clampLobbyNumber(
    typeof configuredValue === "number" ? configuredValue : undefined,
    minionsTdSetupConfig.startingGold
  );
}

export const minionsTdServerGame: ServerGame<MinionsTdRuntimeState, MinionsTdInput, MinionsTdState> = {
  manifest: minionsTdManifest,
  createInitialState(context) {
    const gamePlayers = context.players.slice(0, minionsTdConfig.maxPlayers);
    const selectedMap = resolveConfiguredMap(context);
    const en = context.language === "en";
    const startingLives = resolveConfiguredStartingLives(context);
    const startingGold = resolveConfiguredStartingGold(context);

    return {
      ...createBaseRoundState("round_intro", context.now, {
        durationMs: phaseTimings.roundIntroMs,
        message: buildPreparationMessage(selectedMap.name, en)
      }),
      language: context.language,
      map: selectedMap,
      availableMaps: listMinionsTdMaps(),
      selectedMapId: selectedMap.id,
      elapsedMs: 0,
      remainingMs: minionsTdConfig.matchDurationMs,
      startingLives,
      startingGold,
      towerCatalog: [...minionsTdTowerCatalog],
      enemyCatalog: [...minionsTdEnemyCatalog],
      players: createMinionsTdPlayerBoards(gamePlayers, context.now, startingGold, startingLives),
      ringOrder: gamePlayers.map((player) => player.id),
      alivePlayerIds: gamePlayers.map((player) => player.id),
      result: createMinionsTdResult(),
      nextEnemyId: 1,
      nextTowerId: 1,
      nextProjectileId: 1
    };
  },
  handleHostAction(state, action, context) {
    const hostAction = action as Partial<MinionsTdHostAction> | null;

    if (!hostAction?.type) {
      return {};
    }

    if (state) {
      return {};
    }

    if (hostAction.type === "select-map" && typeof hostAction.mapId === "string") {
      const selectedMap = resolveMinionsTdMap(hostAction.mapId, context.roundNumber);
      return {
        roomSettings: {
          [minionsTdRoomSettingKeys.selectedMapId]: selectedMap.id
        }
      };
    }

    if (hostAction.type !== "configure-lobby") {
      return {};
    }

    const configureAction = hostAction as MinionsTdConfigureLobbyHostAction;
    const nextSettings: Record<string, string | number> = {};

    if (typeof configureAction.mapId === "string") {
      nextSettings[minionsTdRoomSettingKeys.selectedMapId] = resolveMinionsTdMap(
        configureAction.mapId,
        context.roundNumber
      ).id;
    }

    if (typeof configureAction.startingLives === "number") {
      nextSettings[minionsTdRoomSettingKeys.startingLives] = clampLobbyNumber(
        configureAction.startingLives,
        minionsTdSetupConfig.startingLives
      );
    }

    if (typeof configureAction.startingGold === "number") {
      nextSettings[minionsTdRoomSettingKeys.startingGold] = clampLobbyNumber(
        configureAction.startingGold,
        minionsTdSetupConfig.startingGold
      );
    }

    return Object.keys(nextSettings).length > 0
      ? {
          roomSettings: nextSettings
        }
      : {};
  },
  startRound(state, context) {
    return transitionRoundState(
      {
        ...state,
        elapsedMs: 0,
        remainingMs: minionsTdConfig.matchDurationMs,
        result: createMinionsTdResult()
      },
      "playing",
      context.now,
      {
        startedAt: context.now,
        message: state.language === "en"
          ? `Map ${state.map.name} is live. Build, upgrade, and send minions.`
          : `Map ${state.map.name} ist live. Bauen, upgraden und Minions schicken.`
      }
    );
  },
  handleInput(state, input, context) {
    const playerIndex = resolvePlayerIndex(state.players, input.playerId);

    if (playerIndex === -1) {
      return state;
    }

    const actingPlayer = state.players[playerIndex];

    if (!actingPlayer?.alive) {
      return state;
    }

    if (input.type === "send") {
      if (!canSendEnemies(state.phase)) {
        return state;
      }

      const enemyDefinition = resolveMinionsTdEnemyCatalogEntry(input.enemyTypeId);
      const targetPlayerId = resolveNextAlivePlayerId(state.players, actingPlayer.playerId);

      if (!enemyDefinition || !targetPlayerId || actingPlayer.gold < enemyDefinition.sendCost) {
        return state;
      }

      const players = clonePlayers(state.players);
      const nextActingPlayer = players[playerIndex];
      const targetIndex = resolvePlayerIndex(players, targetPlayerId);

      if (!nextActingPlayer || targetIndex === -1) {
        return state;
      }

      const enemy = createEnemyInstance(
        enemyDefinition,
        state.nextEnemyId,
        actingPlayer.playerId
      );
      const spawnPosition = resolveMinionsTdPathPosition(state.map, 0);

      enemy.x = spawnPosition.x;
      enemy.y = spawnPosition.y;

      nextActingPlayer.gold -= enemyDefinition.sendCost;
      nextActingPlayer.sends += 1;
      nextActingPlayer.incomeTickValue += enemyDefinition.incomeBonus;
      players[targetIndex].enemies.push(enemy);

      return {
        ...state,
        players,
        alivePlayerIds: resolveMinionsTdAlivePlayerIds(players),
        nextEnemyId: state.nextEnemyId + 1,
        updatedAt: input.sentAt ?? context.now,
        message:
          state.language === "en"
            ? `${actingPlayer.name} sends ${enemyDefinition.displayName} to ${players[targetIndex].name} and raises income to ${nextActingPlayer.incomeTickValue} gold per tick.`
            : `${actingPlayer.name} schickt ${enemyDefinition.displayName} an ${players[targetIndex].name} ` +
              `und erhoeht das Einkommen auf ${nextActingPlayer.incomeTickValue} Gold pro Tick.`
      };
    }

    if (!canModifyTowers(state.phase)) {
      return state;
    }

    const players = clonePlayers(state.players);
    const nextActingPlayer = players[playerIndex];

    if (!nextActingPlayer) {
      return state;
    }

    if (input.type === "build") {
      const towerDefinition = resolveMinionsTdTowerCatalogEntry(input.towerTypeId);
      const slot = resolveMinionsTdBuildSlot(state.map, input.slotId);

      if (
        !towerDefinition ||
        !slot ||
        nextActingPlayer.gold < towerDefinition.cost ||
        nextActingPlayer.towers.some((tower) => tower.slotId === input.slotId)
      ) {
        return state;
      }

      const tower = createTowerInstance(input.towerTypeId, input.slotId, state.nextTowerId);

      if (!tower) {
        return state;
      }

      nextActingPlayer.gold -= towerDefinition.cost;
      nextActingPlayer.towers.push(tower);

      return {
        ...state,
        players,
        nextTowerId: state.nextTowerId + 1,
        updatedAt: input.sentAt ?? context.now
      };
    }

    const towerIndex = nextActingPlayer.towers.findIndex((tower) => tower.slotId === input.slotId);

    if (towerIndex === -1) {
      return state;
    }

    const tower = nextActingPlayer.towers[towerIndex];
    const towerDefinition = resolveMinionsTdTowerCatalogEntry(tower.towerTypeId);

    if (!towerDefinition) {
      return state;
    }

    if (input.type === "upgrade") {
      const nextLevel = tower.level + 1;
      const nextLevelDefinition = resolveMinionsTdTowerLevelEntry(tower.towerTypeId, nextLevel);
      const upgradeCost = resolveMinionsTdUpgradeCost(
        towerDefinition.cost,
        tower.level,
        towerDefinition.levels
      );

      if (!nextLevelDefinition || nextActingPlayer.gold < upgradeCost) {
        return state;
      }

      nextActingPlayer.gold -= upgradeCost;
      nextActingPlayer.towers[towerIndex] = {
        ...tower,
        level: nextLevel,
        damage: nextLevelDefinition.damage,
        range: nextLevelDefinition.range,
        fireRateMs: nextLevelDefinition.fireRateMs,
        investedGold: tower.totalInvested + upgradeCost,
        splashRadius: nextLevelDefinition.splashRadius,
        splashDamagePercent: nextLevelDefinition.splashDamagePercent,
        slowPct: nextLevelDefinition.slowPct,
        slowDurationMs: nextLevelDefinition.slowDurationMs,
        targeting: nextLevelDefinition.targeting,
        trait: nextLevelDefinition.trait,
        totalInvested: tower.totalInvested + upgradeCost
      };

      return {
        ...state,
        players,
        updatedAt: input.sentAt ?? context.now
      };
    }

    if (input.type === "sell") {
      const refund = resolveMinionsTdSellValue(tower.totalInvested, towerDefinition.sellRefundRatio);
      nextActingPlayer.gold += refund;
      nextActingPlayer.towers.splice(towerIndex, 1);

      return {
        ...state,
        players,
        updatedAt: input.sentAt ?? context.now
      };
    }

    return state;
  },
  tick(state, deltaMs, context) {
    if (state.phase !== "playing") {
      return state;
    }

    const players = clonePlayers(state.players);

    applyPassiveIncome(players, context.now);
    ageProjectiles(players, deltaMs);
    const leakEvents = advanceEnemies(players, state, deltaMs);
    const combatResult = runTowerCombat(players, state, deltaMs, state.nextProjectileId);
    const leakResult = processLeaks(players, state.map, leakEvents, context.now, state.nextEnemyId);
    const playersWithTargets = withMinionsTdOutgoingTargets(players);
    const alivePlayerIds = resolveMinionsTdAlivePlayerIds(playersWithTargets);
    const nextState: MinionsTdRuntimeState = {
      ...state,
      elapsedMs: state.elapsedMs + deltaMs,
      remainingMs:
        state.remainingMs === null ? null : Math.max(0, state.remainingMs - deltaMs),
      players: playersWithTargets,
      alivePlayerIds,
      nextEnemyId: leakResult.nextEnemyId,
      nextProjectileId: combatResult.nextProjectileId,
      updatedAt: context.now
    };

    if (alivePlayerIds.length <= 1) {
      return finishMatch(
        nextState,
        context.now,
        rankMinionsTdPlayers(playersWithTargets)[0],
        "last_player_standing"
      );
    }

    if (nextState.remainingMs !== null && nextState.remainingMs <= 0) {
      return finishMatch(nextState, context.now, rankMinionsTdPlayers(playersWithTargets)[0], "time_limit");
    }

    return nextState;
  },
  isRoundFinished(state) {
    return state.phase === "locked";
  },
  buildScore(state) {
    return resolvePlacements(state.players);
  },
  toPublicState(state) {
    return toPublicMinionsTdState(state);
  },
  toControllerState(state) {
    return toControllerMinionsTdState(state);
  },
  toControllerStateForPlayer(state, _context, playerId) {
    return toControllerMinionsTdState(state, playerId);
  }
};
