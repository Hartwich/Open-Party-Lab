import {
  createBaseRoundState,
  resolveRoundPhaseTimings,
  transitionRoundState,
  type GamePlayerSummary,
  type ScoreEntry,
  type ServerGame
} from "@open-party-lab/game-core";
import type {
  ArenaSurvivorHostAction,
  ArenaSurvivorEnemyState,
  ArenaSurvivorInput,
  ArenaSurvivorPickupState,
  ArenaSurvivorPlayerState,
  ArenaSurvivorProjectileState
} from "@open-party-lab/protocol";
import { arenaSurvivorSetupConfig } from "@open-party-lab/protocol";
import { arenaSurvivorManifest } from "../manifest.js";
import {
  arenaSurvivorConfig,
  arenaSurvivorRoomSettingKeys
} from "./arenaSurvivorConfig.js";
import { resolveArenaSurvivorDifficulty } from "./difficulty/arenaSurvivorDifficulty.js";
import { createArenaSurvivorPlayer, type ArenaSurvivorSpawnPoint } from "./factories/createPlayer.js";
import {
  createEmptyShopState,
  countAlivePlayers,
  createEmptyRunStats,
  type ArenaSurvivorPublicState,
  type ArenaSurvivorRuntimeEnemyState,
  type ArenaSurvivorRuntimePickupState,
  type ArenaSurvivorRuntimePlayerState,
  type ArenaSurvivorRuntimeProjectileState,
  type ArenaSurvivorRuntimeSpawnIndicatorState,
  type ArenaSurvivorRuntimeState
} from "./arenaSurvivorState.js";
import {
  applyArenaSurvivorShopCombine,
  applyArenaSurvivorShopPurchase,
  applyArenaSurvivorShopReroll,
  applyArenaSurvivorShopSell,
  createArenaSurvivorStarterLoadout,
  resolveArenaSurvivorRunCarry
} from "./loadout/arenaSurvivorLoadout.js";
import { applyAutoFireSystem } from "./systems/autoFireSystem.js";
import { resolveCollisionSystem } from "./systems/collisionSystem.js";
import { applyDamageSystem } from "./systems/damageSystem.js";
import { applyEnemyAiSystem } from "./systems/enemyAiSystem.js";
import { applyMovementSystem } from "./systems/movementSystem.js";
import { applyPickupSystem } from "./systems/pickupSystem.js";
import { applyProjectileSystem } from "./systems/projectileSystem.js";
import { resolveRoundEndSystem } from "./systems/roundEndSystem.js";
import { applySpawnSystem } from "./systems/spawnSystem.js";

const phaseTimings = resolveRoundPhaseTimings(arenaSurvivorManifest.phaseDurations);

function getPlayers(context: { players: GamePlayerSummary[] }): GamePlayerSummary[] {
  if (context.players.length > 0) {
    return context.players;
  }

  return [
    {
      id: "arena-survivor-player",
      name: "Player",
      color: "#22c55e",
      score: 0,
      isReady: true,
      connected: true
    }
  ];
}

function createSpawnPoints(playerCount: number): ArenaSurvivorSpawnPoint[] {
  const width = arenaSurvivorConfig.arenaWidth;
  const height = arenaSurvivorConfig.arenaHeight;

  switch (playerCount) {
    case 1:
      return [{ x: width / 2, y: height / 2, facingAngleRad: -Math.PI / 2 }];
    case 2:
      return [
        { x: width * 0.35, y: height / 2, facingAngleRad: 0 },
        { x: width * 0.65, y: height / 2, facingAngleRad: Math.PI }
      ];
    case 3:
      return [
        { x: width * 0.28, y: height * 0.3, facingAngleRad: Math.PI / 4 },
        { x: width * 0.72, y: height * 0.3, facingAngleRad: (Math.PI * 3) / 4 },
        { x: width / 2, y: height * 0.72, facingAngleRad: -Math.PI / 2 }
      ];
    default:
      return [
        { x: width * 0.28, y: height * 0.28, facingAngleRad: Math.PI / 4 },
        { x: width * 0.72, y: height * 0.28, facingAngleRad: (Math.PI * 3) / 4 },
        { x: width * 0.28, y: height * 0.72, facingAngleRad: -Math.PI / 4 },
        { x: width * 0.72, y: height * 0.72, facingAngleRad: (-Math.PI * 3) / 4 }
      ];
  }
}

function toPublicPickup(pickup: ArenaSurvivorRuntimePickupState): ArenaSurvivorPickupState {
  const {
    spawnedAtMs: _spawnedAtMs,
    targetPlayerId: _targetPlayerId,
    ...publicPickup
  } = pickup;
  return publicPickup;
}

function toPublicSpawnIndicator(
  indicator: ArenaSurvivorRuntimeSpawnIndicatorState
) {
  const {
    definitionId: _definitionId,
    moveSpeed: _moveSpeed,
    maxHp: _maxHp,
    contactDamage: _contactDamage,
    ...publicIndicator
  } = indicator;
  return publicIndicator;
}

function toPublicPlayer(player: ArenaSurvivorRuntimePlayerState): ArenaSurvivorPlayerState {
  const { moveInputX: _moveInputX, moveInputY: _moveInputY, ...publicPlayer } = player;
  return publicPlayer;
}

function toPublicEnemy(enemy: ArenaSurvivorRuntimeEnemyState): ArenaSurvivorEnemyState {
  const { spawnedAtMs: _spawnedAtMs, ...publicEnemy } = enemy;
  return publicEnemy;
}

function toPublicProjectile(
  projectile: ArenaSurvivorRuntimeProjectileState
): ArenaSurvivorProjectileState {
  const { spawnedAtMs: _spawnedAtMs, ...publicProjectile } = projectile;
  return publicProjectile;
}

function buildScore(state: ArenaSurvivorRuntimeState): ScoreEntry[] {
  return state.players.map((player) => ({
    playerId: player.playerId,
    delta:
      state.result.outcome === "survived"
        ? Math.max(3, state.waveNumber + player.runStats.kills)
        : Math.max(0, Math.floor(player.runStats.kills / 2)),
    reason: "Arena Survivor"
  }));
}

function createDefaultResult() {
  return {
    outcome: "running" as const,
    title: "Arena Survivor"
  };
}

function resolvePreviousArenaState(
  previousRound: ArenaSurvivorRuntimeState | null
): ArenaSurvivorRuntimeState | null {
  return previousRound;
}

function clampArenaSurvivorDifficultyTier(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return arenaSurvivorSetupConfig.difficulty.defaultValue;
  }

  return Math.max(
    arenaSurvivorSetupConfig.difficulty.min,
    Math.min(arenaSurvivorSetupConfig.difficulty.max, Math.round(value))
  );
}

function resolveConfiguredArenaSurvivorDifficultyTier(context: {
  roomSettings: Readonly<Record<string, unknown>>;
}): number {
  return clampArenaSurvivorDifficultyTier(
    context.roomSettings[arenaSurvivorRoomSettingKeys.difficultyTier]
  );
}

function createPlayersFromCarry(
  gamePlayers: GamePlayerSummary[],
  now: number,
  previousState: ArenaSurvivorRuntimeState | null
): { waveNumber: number; continuedRun: boolean; players: ArenaSurvivorRuntimePlayerState[] } {
  const carry = resolveArenaSurvivorRunCarry(previousState, gamePlayers.map((player) => player.id));
  const spawnPoints = createSpawnPoints(gamePlayers.length);

  return {
    waveNumber: carry.waveNumber,
    continuedRun: carry.continuedRun,
    players: gamePlayers.map((gamePlayer, index) => {
      const carriedPlayer = carry.players.find((entry) => entry.playerId === gamePlayer.id);
      const selectedCharacterId = gamePlayer.selectedCharacterId ?? undefined;
      const reuseCarry = carriedPlayer?.continuedRun === true;
      const characterId = reuseCarry
        ? carriedPlayer?.characterId ?? selectedCharacterId
        : selectedCharacterId;
      const loadout = reuseCarry
        ? carriedPlayer?.loadout ?? createArenaSurvivorStarterLoadout(characterId)
        : createArenaSurvivorStarterLoadout(characterId);

      return createArenaSurvivorPlayer(
        gamePlayer,
        spawnPoints[index] ?? spawnPoints[0],
        now,
        reuseCarry ? carriedPlayer : undefined,
        loadout,
        characterId,
        index
      );
    })
  };
}

function rebuildPlayersForNextWave(
  contextPlayers: GamePlayerSummary[],
  statePlayers: ArenaSurvivorRuntimePlayerState[],
  now: number
): ArenaSurvivorRuntimePlayerState[] {
  const spawnPoints = createSpawnPoints(contextPlayers.length);

  return contextPlayers.map((gamePlayer, index) => {
    const previousPlayer = statePlayers.find((entry) => entry.playerId === gamePlayer.id);

    return createArenaSurvivorPlayer(
      gamePlayer,
      spawnPoints[index] ?? spawnPoints[0],
      now,
      previousPlayer
        ? {
          continuedRun: true,
          characterId: previousPlayer.character.id,
          materials: previousPlayer.materials,
          loadout: previousPlayer.loadout,
          runSummary: previousPlayer.runSummary
        }
        : undefined,
      previousPlayer?.loadout ?? createArenaSurvivorStarterLoadout(previousPlayer?.character.id),
      previousPlayer?.character.id,
      index
    );
  });
}

export const arenaSurvivorServerGame: ServerGame<
  ArenaSurvivorRuntimeState,
  ArenaSurvivorInput,
  ArenaSurvivorPublicState
> = {
  manifest: arenaSurvivorManifest,
  handleHostAction(state, action, context) {
    const hostAction = action as Partial<ArenaSurvivorHostAction> | null;

    if (!hostAction?.type || state) {
      return {};
    }

    if (hostAction.type === "confirm-lobby") {
      return {
        roomSettings: {
          [arenaSurvivorRoomSettingKeys.setupConfirmed]: true
        }
      };
    }

    if (hostAction.type !== "configure-lobby") {
      return {};
    }

    const nextDifficultyTier = clampArenaSurvivorDifficultyTier(hostAction.difficulty);

    return {
      roomSettings: {
        [arenaSurvivorRoomSettingKeys.difficultyTier]: nextDifficultyTier,
        [arenaSurvivorRoomSettingKeys.setupConfirmed]: false
      }
    };
  },
  createInitialState(context) {
    const en = context.language === "en";
    const gamePlayers = getPlayers(context).slice(0, 4);
    const previousState =
      context.previousRound?.gameId === arenaSurvivorManifest.id
        ? resolvePreviousArenaState(context.previousRound.state as ArenaSurvivorRuntimeState)
        : null;
    const playerSetup = createPlayersFromCarry(gamePlayers, context.now, previousState);
    const configuredDifficultyTier = resolveConfiguredArenaSurvivorDifficultyTier(context);
    const difficulty = resolveArenaSurvivorDifficulty(
      playerSetup.waveNumber,
      playerSetup.players.length,
      configuredDifficultyTier
    );

    return {
      ...createBaseRoundState("round_intro", context.now, {
        durationMs: phaseTimings.roundIntroMs,
        message: playerSetup.continuedRun
          ? en ? `Wave ${playerSetup.waveNumber} is being prepared.` : `Welle ${playerSetup.waveNumber} wird vorbereitet.`
          : en ? "A new run begins." : "Ein neuer Run beginnt."
      }),
      language: context.language,
      seed:
        previousState?.seed ??
        ((context.now ^ 0x9e3779b9 ^ playerSetup.waveNumber * 97) >>> 0),
      arenaWidth: arenaSurvivorConfig.arenaWidth,
      arenaHeight: arenaSurvivorConfig.arenaHeight,
      waveNumber: playerSetup.waveNumber,
      difficultyLevel: difficulty.level,
      difficultyTier: difficulty.difficultyTier,
      spawnedBossDefinitionIds: [],
      elapsedMs: 0,
      remainingMs: arenaSurvivorConfig.roundDurationMs,
      nextEnemySpawnAtMs: Math.max(
        difficulty.enemySpawnIntervalMs,
        arenaSurvivorConfig.enemySpawnWarningLeadMs
      ),
      kills: 0,
      players: playerSetup.players,
      enemies: [],
      projectiles: [],
      pickups: [],
      spawnIndicators: [],
      result: createDefaultResult(),
      debugInfo: {
        enemySpawnCooldownMs: Math.max(
          difficulty.enemySpawnIntervalMs,
          arenaSurvivorConfig.enemySpawnWarningLeadMs
        ),
        enemyCount: 0,
        pickupCount: 0,
        projectileCount: 0,
        alivePlayerCount: countAlivePlayers(playerSetup.players)
      }
    };
  },
  startRound(state, context) {
    const freshPlayers = rebuildPlayersForNextWave(getPlayers(context).slice(0, 4), state.players, context.now);
    const configuredDifficultyTier = resolveConfiguredArenaSurvivorDifficultyTier(context);
    const difficulty = resolveArenaSurvivorDifficulty(
      state.waveNumber,
      freshPlayers.length,
      configuredDifficultyTier
    );

    return transitionRoundState(
      {
        ...state,
        elapsedMs: 0,
        remainingMs: arenaSurvivorConfig.roundDurationMs,
        difficultyLevel: difficulty.level,
        difficultyTier: difficulty.difficultyTier,
        spawnedBossDefinitionIds: [],
        nextEnemySpawnAtMs: Math.max(
          difficulty.enemySpawnIntervalMs,
          arenaSurvivorConfig.enemySpawnWarningLeadMs
        ),
        kills: 0,
        players: freshPlayers.map((player) => ({
          ...player,
          shop: createEmptyShopState(),
          runStats: createEmptyRunStats()
        })),
        enemies: [],
        projectiles: [],
        pickups: [],
        spawnIndicators: [],
        result: createDefaultResult(),
        debugInfo: {
          enemySpawnCooldownMs: Math.max(
            difficulty.enemySpawnIntervalMs,
            arenaSurvivorConfig.enemySpawnWarningLeadMs
          ),
          enemyCount: 0,
          pickupCount: 0,
          projectileCount: 0,
          alivePlayerCount: countAlivePlayers(freshPlayers)
        }
      },
      "playing",
      context.now,
      {
        startedAt: context.now,
        message: state.language === "en" ? `Wave ${state.waveNumber} is running.` : `Welle ${state.waveNumber} laeuft.`
      }
    );
  },
  handleInput(state, input, context) {
    const playerIndex = state.players.findIndex((player) => player.playerId === input.playerId);

    if (playerIndex === -1) {
      return state;
    }

    if (
      input.type === "shop:buy" ||
      input.type === "shop:reroll" ||
      input.type === "shop:sell" ||
      input.type === "shop:combine"
    ) {
      if (
        state.phase === "locked" ||
        state.phase === "result" ||
        state.phase === "scoreboard" ||
        state.phase === "finished"
      ) {
        const nextState =
          input.type === "shop:buy"
            ? applyArenaSurvivorShopPurchase(state, input.playerId, input.offerId)
            : input.type === "shop:sell"
              ? applyArenaSurvivorShopSell(state, input.playerId, input.weaponInstanceId)
              : input.type === "shop:combine"
                ? applyArenaSurvivorShopCombine(state, input.playerId, input.weaponInstanceId)
              : applyArenaSurvivorShopReroll(state, input.playerId);

        return {
          ...nextState,
          updatedAt: input.sentAt ?? context.now
        };
      }

      return state;
    }

    if (state.phase !== "countdown" && state.phase !== "playing") {
      return state;
    }

    if (input.type !== "move") {
      return state;
    }

    const nextPlayers = [...state.players];
    const player = nextPlayers[playerIndex];
    nextPlayers[playerIndex] = {
      ...player,
      moveInputX: Math.max(-1, Math.min(1, input.moveX)),
      moveInputY: Math.max(-1, Math.min(1, input.moveY))
    };

    return {
      ...state,
      players: nextPlayers,
      updatedAt: input.sentAt ?? context.now
    };
  },
  tick(state, deltaMs, context) {
    if (state.phase !== "playing") {
      return state;
    }

    let nextState: ArenaSurvivorRuntimeState = {
      ...state,
      elapsedMs: state.elapsedMs + deltaMs,
      remainingMs: Math.max(0, state.remainingMs - deltaMs),
      players: state.players.map((player) => ({
        ...player,
        hp: player.alive
          ? Math.min(player.maxHp, player.hp + player.stats.hpRegen * (deltaMs / 1000))
          : player.hp,
        runStats: {
          ...player.runStats,
          survivedMs: player.runStats.survivedMs + deltaMs
        }
      }))
    };

    nextState = applySpawnSystem(nextState);
    nextState = applyMovementSystem(nextState, deltaMs);
    nextState = applyEnemyAiSystem(nextState, deltaMs);
    nextState = applyAutoFireSystem(nextState, deltaMs, context.now);
    nextState = applyProjectileSystem(nextState, deltaMs);

    const collisionReport = resolveCollisionSystem(nextState);
    nextState = applyDamageSystem(nextState, collisionReport, context.now);
    nextState = applyPickupSystem(nextState, deltaMs);
    nextState = resolveRoundEndSystem(nextState, context.now);

    if (nextState.phase !== "playing") {
      return nextState;
    }

    return {
      ...nextState,
      debugInfo: {
        enemySpawnCooldownMs: Math.max(0, nextState.nextEnemySpawnAtMs - nextState.elapsedMs),
        enemyCount: nextState.enemies.length,
        pickupCount: nextState.pickups.length,
        projectileCount: nextState.projectiles.length,
        alivePlayerCount: countAlivePlayers(nextState.players)
      }
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
      arenaWidth: state.arenaWidth,
      arenaHeight: state.arenaHeight,
      waveNumber: state.waveNumber,
      difficultyLevel: state.difficultyLevel,
      elapsedMs: state.elapsedMs,
      remainingMs: state.remainingMs,
      kills: state.kills,
      players: state.players.map(toPublicPlayer),
      difficultyTier: state.difficultyTier,
      enemies: state.enemies.map(toPublicEnemy),
      projectiles: state.projectiles.map(toPublicProjectile),
      pickups: state.pickups.map(toPublicPickup),
      spawnIndicators: state.spawnIndicators.map(toPublicSpawnIndicator),
      result: {
        ...state.result
      },
      debugInfo: state.debugInfo,
      seed: state.seed
    };
  },
  toControllerState(state) {
    return {
      arenaWidth: state.arenaWidth,
      arenaHeight: state.arenaHeight,
      waveNumber: state.waveNumber,
      difficultyLevel: state.difficultyLevel,
      elapsedMs: state.elapsedMs,
      remainingMs: state.remainingMs,
      kills: state.kills,
      players: state.players.map(toPublicPlayer),
      difficultyTier: state.difficultyTier,
      enemies: state.enemies.map(toPublicEnemy),
      projectiles: state.projectiles.map(toPublicProjectile),
      pickups: state.pickups.map(toPublicPickup),
      spawnIndicators: state.spawnIndicators.map(toPublicSpawnIndicator),
      result: {
        ...state.result
      },
      debugInfo: state.debugInfo,
      seed: state.seed
    };
  }
};
