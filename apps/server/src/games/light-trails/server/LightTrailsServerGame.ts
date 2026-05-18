import {
  createBaseRoundState,
  resolveRoundPhaseTimings,
  transitionRoundState,
  type ScoreEntry,
  type ServerGame,
  type ServerGameContext
} from "@open-party-lab/game-core";
import type {
  LightTrailsInput,
  LightTrailsPlayerState,
  LightTrailsTrailSegment,
  LightTrailsState
} from "@open-party-lab/protocol";
import { lightTrailsManifest } from "../manifest.js";
import { lightTrailsConfig } from "./lightTrailsConfig.js";
import { collidesWithArena, evaluateCollisions, type MovementProposal } from "./collision.js";
import type {
  LightTrailsRuntimePlayerState,
  LightTrailsRuntimeState
} from "./lightTrailsState.js";
import { createTrailGridMetrics, pointToCellId, sampleTrailCellIds } from "./trailGrid.js";

const phaseTimings = resolveRoundPhaseTimings(lightTrailsManifest.phaseDurations);
const trailGridMetrics = createTrailGridMetrics(lightTrailsConfig);

function normalizeAngle(angleRad: number): number {
  const fullCircle = Math.PI * 2;
  const normalized = angleRad % fullCircle;
  return normalized >= 0 ? normalized : normalized + fullCircle;
}

function hashStringToSeed(value: string): number {
  let hash = 2_166_136_261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return (hash >>> 0) || 1;
}

function nextRandomValue(seed: number): { nextSeed: number; value: number } {
  const nextSeed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
  return {
    nextSeed,
    value: nextSeed / 4_294_967_296
  };
}

function deriveTurnInput(leftPressed: boolean, rightPressed: boolean): -1 | 0 | 1 {
  if (leftPressed === rightPressed) {
    return 0;
  }

  return leftPressed ? -1 : 1;
}

function scheduleNextGap(player: LightTrailsRuntimePlayerState, currentTick: number): LightTrailsRuntimePlayerState {
  const intervalRange = Math.max(
    0,
    lightTrailsConfig.gapIntervalMaxTicks - lightTrailsConfig.gapIntervalMinTicks
  );
  const { nextSeed, value } = nextRandomValue(player.rngState);
  const intervalTicks =
    lightTrailsConfig.gapIntervalMinTicks + Math.round(value * intervalRange);

  return {
    ...player,
    rngState: nextSeed,
    nextGapAtTick: currentTick + intervalTicks + lightTrailsConfig.gapLengthTicks
  };
}

function createRuntimePlayer(
  player: ServerGameContext["players"][number],
  roomCode: string,
  playerIndex: number,
  playerCount: number
): LightTrailsRuntimePlayerState {
  const centerX = lightTrailsConfig.arenaWidth / 2;
  const centerY = lightTrailsConfig.arenaHeight / 2;
  const spawnRadius =
    Math.min(lightTrailsConfig.arenaWidth, lightTrailsConfig.arenaHeight) *
    lightTrailsConfig.spawnRadiusFactor;
  const orbitAngle = (-Math.PI / 2) + (playerIndex / Math.max(1, playerCount)) * Math.PI * 2;
  const x = centerX + Math.cos(orbitAngle) * spawnRadius;
  const y = centerY + Math.sin(orbitAngle) * spawnRadius;
  const angleRad = normalizeAngle(orbitAngle + Math.PI / 2);
  const startCellId = pointToCellId(x, y, trailGridMetrics);
  return scheduleNextGap(
    {
      playerId: player.id,
      name: player.name,
      color: player.color,
      x,
      y,
      angleRad,
      alive: true,
      turnInput: 0,
      trailCellIds: startCellId === null ? [] : [startCellId],
      trailSegments: [],
      leftPressed: false,
      rightPressed: false,
      gapTicksRemaining: 0,
      nextGapAtTick: 0,
      rngState: hashStringToSeed(`${roomCode}:${player.id}`),
      collisionReason: undefined,
      eliminatedAt: undefined
    },
    0
  );
}

function createPlayers(context: ServerGameContext): Record<string, LightTrailsRuntimePlayerState> {
  return Object.fromEntries(
    context.players.map((player, index) => {
      const runtimePlayer = createRuntimePlayer(player, context.roomCode, index, context.players.length);
      return [player.id, runtimePlayer];
    })
  );
}

function createOccupiedCells(players: Record<string, LightTrailsRuntimePlayerState>): Record<number, string> {
  const occupiedCells: Record<number, string> = {};

  for (const player of Object.values(players)) {
    for (const cellId of player.trailCellIds) {
      occupiedCells[cellId] = player.playerId;
    }
  }

  return occupiedCells;
}

function updatePlayerInput(
  state: LightTrailsRuntimeState,
  input: LightTrailsInput
): LightTrailsRuntimeState {
  const player = state.players[input.playerId];

  if (!player) {
    return state;
  }

  const leftPressed = input.direction === "left" ? input.active : player.leftPressed;
  const rightPressed = input.direction === "right" ? input.active : player.rightPressed;
  const nextPlayer: LightTrailsRuntimePlayerState = {
    ...player,
    leftPressed,
    rightPressed,
    turnInput: deriveTurnInput(leftPressed, rightPressed)
  };

  return {
    ...state,
    players: {
      ...state.players,
      [input.playerId]: nextPlayer
    },
    updatedAt: input.sentAt
  };
}

function buildPublicPlayers(
  players: Record<string, LightTrailsRuntimePlayerState>
): Record<string, LightTrailsPlayerState> {
  return Object.fromEntries(
    Object.values(players).map((player) => [
      player.playerId,
      {
        playerId: player.playerId,
        name: player.name,
        color: player.color,
        x: player.x,
        y: player.y,
        angleRad: player.angleRad,
        alive: player.alive,
        turnInput: player.turnInput,
        trailCellIds: [],
        trailSegments: player.trailSegments,
        eliminatedAt: player.eliminatedAt,
        collisionReason: player.collisionReason
      }
    ])
  );
}

function buildScore(state: LightTrailsRuntimeState): ScoreEntry[] {
  return state.winnerPlayerId
    ? [
        {
          playerId: state.winnerPlayerId,
          delta: 1,
          reason: "Light Trails"
        }
      ]
    : [];
}

function neutralizeDisconnectedPlayers(
  state: LightTrailsRuntimeState,
  context: ServerGameContext
): LightTrailsRuntimeState {
  const connectedByPlayerId = new Map(context.players.map((player) => [player.id, player.connected]));
  let changed = false;
  const players = Object.fromEntries(
    Object.values(state.players).map((player) => {
      if (!player.alive || connectedByPlayerId.get(player.playerId) !== false) {
        return [player.playerId, player];
      }

      if (!player.leftPressed && !player.rightPressed && player.turnInput === 0) {
        return [player.playerId, player];
      }

      changed = true;
      return [
        player.playerId,
        {
          ...player,
          leftPressed: false,
          rightPressed: false,
          turnInput: 0
        }
      ];
    })
  ) as Record<string, LightTrailsRuntimePlayerState>;

  if (!changed) {
    return state;
  }

  return {
    ...state,
    players
  };
}

function simulateTick(
  state: LightTrailsRuntimeState,
  deltaMs: number,
  context: ServerGameContext
): LightTrailsRuntimeState {
  let nextState = neutralizeDisconnectedPlayers(state, context);
  const alivePlayers = Object.values(nextState.players).filter((player) => player.alive);
  const totalPlayers = Object.keys(nextState.players).length;

  if (totalPlayers > 1 && alivePlayers.length <= 1) {
    return nextState;
  }

  const seconds = Math.max(0.001, deltaMs / 1000);
  const distancePerTick = lightTrailsConfig.moveSpeed * seconds;
  const substeps = Math.max(
    1,
    Math.ceil(distancePerTick / Math.max(1, lightTrailsConfig.gridCellSize * 0.75))
  );
  const stepSeconds = seconds / substeps;
  let players = { ...nextState.players };
  let occupiedCells = { ...nextState.occupiedCells };

  for (let stepIndex = 0; stepIndex < substeps; stepIndex += 1) {
    const proposals: MovementProposal[] = [];
    const wallHits = new Set<string>();

    for (const player of Object.values(players)) {
      if (!player.alive) {
        continue;
      }

      const nextAngleRad = normalizeAngle(
        player.angleRad + player.turnInput * lightTrailsConfig.turnSpeedRadPerSecond * stepSeconds
      );
      const nextX = player.x + Math.cos(nextAngleRad) * lightTrailsConfig.moveSpeed * stepSeconds;
      const nextY = player.y + Math.sin(nextAngleRad) * lightTrailsConfig.moveSpeed * stepSeconds;

      if (collidesWithArena(nextX, nextY, trailGridMetrics)) {
        wallHits.add(player.playerId);
        continue;
      }

      const currentCellId = pointToCellId(player.x, player.y, trailGridMetrics);
      const pathCellIds = sampleTrailCellIds(player.x, player.y, nextX, nextY, trailGridMetrics).filter(
        (cellId) => cellId !== currentCellId
      );

      proposals.push({
        playerId: player.playerId,
        nextX,
        nextY,
        nextAngleRad,
        pathCellIds
      });
    }

    const collisionEvaluation = evaluateCollisions(proposals, occupiedCells);
    const collidedPlayerIds = new Set([
      ...wallHits,
      ...Object.keys(collisionEvaluation.byPlayerId)
    ]);

    for (const playerId of collidedPlayerIds) {
      const player = players[playerId];

      if (!player || !player.alive) {
        continue;
      }

      players[playerId] = {
        ...player,
        alive: false,
        turnInput: 0,
        leftPressed: false,
        rightPressed: false,
        eliminatedAt: context.now,
        collisionReason: wallHits.has(playerId)
          ? "wall"
          : collisionEvaluation.byPlayerId[playerId]
      };
    }

    for (const proposal of proposals) {
      const player = players[proposal.playerId];

      if (!player || !player.alive) {
        continue;
      }

      // This hot path runs for every living player on every tick. We intentionally
      // reuse the existing trail buffers here instead of rebuilding full arrays,
      // because immutable `[...segments, nextSegment]` copies were causing
      // increasingly heavy GC and frame drops in longer sessions.
      const nextPlayer: LightTrailsRuntimePlayerState = {
        ...player
      };
      nextPlayer.x = proposal.nextX;
      nextPlayer.y = proposal.nextY;
      nextPlayer.angleRad = proposal.nextAngleRad;
      let shouldDrawTrail = !lightTrailsConfig.gapEnabled;

      if (lightTrailsConfig.gapEnabled) {
        const shouldStartGap = nextState.tick >= nextPlayer.nextGapAtTick && nextPlayer.gapTicksRemaining === 0;

        if (shouldStartGap) {
          Object.assign(
            nextPlayer,
            scheduleNextGap(
              {
                ...nextPlayer,
                gapTicksRemaining: lightTrailsConfig.gapLengthTicks
              },
              nextState.tick
            )
          );
        }

        shouldDrawTrail = nextPlayer.gapTicksRemaining === 0;
      }

      if (shouldDrawTrail) {
        const nextSegment: LightTrailsTrailSegment = {
          x1: player.x,
          y1: player.y,
          x2: proposal.nextX,
          y2: proposal.nextY
        };
        const appendedCells = proposal.pathCellIds.filter((cellId) => occupiedCells[cellId] === undefined);

        nextPlayer.trailSegments.push(nextSegment);

        if (appendedCells.length > 0) {
          nextPlayer.trailCellIds.push(...appendedCells);

          for (const cellId of appendedCells) {
            occupiedCells[cellId] = nextPlayer.playerId;
          }
        }
      } else {
        nextPlayer.gapTicksRemaining = Math.max(0, nextPlayer.gapTicksRemaining - 1);
      }

      players[proposal.playerId] = nextPlayer;
    }
  }

  const alivePlayerIds = Object.values(players)
    .filter((player) => player.alive)
    .map((player) => player.playerId);
  const winnerPlayerId =
    totalPlayers > 1 && alivePlayerIds.length === 1 ? alivePlayerIds[0] : undefined;
  const winnerName = winnerPlayerId ? players[winnerPlayerId]?.name : undefined;
  const timedOut = nextState.finishAt !== null && context.now >= nextState.finishAt;
  const soloPlayerId = totalPlayers === 1 ? alivePlayerIds[0] : undefined;
  const soloWinnerId = totalPlayers === 1 && timedOut ? soloPlayerId : undefined;
  const resolvedWinnerPlayerId = soloWinnerId ?? winnerPlayerId;
  const resolvedWinnerName = resolvedWinnerPlayerId
    ? players[resolvedWinnerPlayerId]?.name
    : undefined;
  const isDraw =
    totalPlayers > 1
      ? alivePlayerIds.length === 0 || (timedOut && alivePlayerIds.length > 1)
      : alivePlayerIds.length === 0;
  const en = context.language === "en";
  const message = resolvedWinnerPlayerId
    ? totalPlayers === 1
      ? en ? `${resolvedWinnerName ?? "You"} survived until the time limit.` : `${resolvedWinnerName ?? "Du"} haelt bis zum Zeitlimit durch.`
      : en ? `${resolvedWinnerName ?? "A player"} is the last one standing.` : `${resolvedWinnerName ?? "Ein Spieler"} ueberlebt als Letzter.`
    : timedOut
      ? totalPlayers === 1
        ? en ? "Time is up." : "Zeit abgelaufen."
        : en ? "Time is up. This round ends in a draw." : "Zeit abgelaufen. Diese Runde endet unentschieden."
      : alivePlayerIds.length === 0
        ? totalPlayers === 1
          ? en ? "Collision. Solo test ended." : "Kollision. Solo-Test beendet."
          : en ? "Everyone crashed. Draw." : "Alle sind kollidiert. Unentschieden."
        : en ? `${alivePlayerIds.length} drivers are still racing.` : `${alivePlayerIds.length} Fahrer sind noch im Rennen.`;

  return {
    ...nextState,
    tick: nextState.tick + 1,
    players,
    occupiedCells,
    alivePlayerIds,
    winnerPlayerId: resolvedWinnerPlayerId,
    winnerName: resolvedWinnerName,
    isDraw,
    updatedAt: context.now,
    message
  };
}

export const lightTrailsServerGame: ServerGame<
  LightTrailsRuntimeState,
  LightTrailsInput,
  LightTrailsState
> = {
  manifest: lightTrailsManifest,
  createInitialState(context) {
    const players = createPlayers(context);

    return {
      ...createBaseRoundState("round_intro", context.now, {
        durationMs: phaseTimings.roundIntroMs,
        message: context.language === "en"
          ? "Hold left or right. Do not touch the trail."
          : "Links oder rechts gedrueckt halten. Nicht die Spur beruehren."
      }),
      arenaWidth: lightTrailsConfig.arenaWidth,
      arenaHeight: lightTrailsConfig.arenaHeight,
      cellSize: lightTrailsConfig.gridCellSize,
      trailThickness: lightTrailsConfig.trailThickness,
      tick: 0,
      alivePlayerIds: Object.keys(players),
      winnerPlayerId: undefined,
      winnerName: undefined,
      isDraw: false,
      finishAt: null,
      players,
      occupiedCells: createOccupiedCells(players)
    };
  },
  startRound(state, context) {
    return transitionRoundState(
      {
        ...state,
        finishAt: context.now + lightTrailsConfig.maxPlayingMs,
        message: context.language === "en" ? "Steer, survive, win." : "Lenken, ueberleben, gewinnen."
      },
      "playing",
      context.now,
      {
        startedAt: context.now,
        message: context.language === "en" ? "Steer, survive, win." : "Lenken, ueberleben, gewinnen."
      }
    );
  },
  handleInput(state, input) {
    if (input.type !== "turn" || (state.phase !== "countdown" && state.phase !== "playing")) {
      return state;
    }

    return updatePlayerInput(state, input);
  },
  tick(state, deltaMs, context) {
    if (state.phase !== "playing") {
      return state;
    }

    return simulateTick(state, deltaMs, context);
  },
  isRoundFinished(state) {
    const totalPlayers = Object.keys(state.players).length;

    if (totalPlayers <= 1) {
      return state.phase === "locked" || state.isDraw || Boolean(state.winnerPlayerId);
    }

    return state.phase === "locked" || state.isDraw || state.alivePlayerIds.length <= 1;
  },
  buildScore(state) {
    return buildScore(state);
  },
  toPublicState(state) {
    return {
      arenaWidth: state.arenaWidth,
      arenaHeight: state.arenaHeight,
      cellSize: state.cellSize,
      trailThickness: state.trailThickness,
      tick: state.tick,
      alivePlayerIds: state.alivePlayerIds,
      winnerPlayerId: state.winnerPlayerId,
      winnerName: state.winnerName,
      isDraw: state.isDraw,
      finishAt: state.finishAt,
      players: buildPublicPlayers(state.players)
    };
  },
  toControllerState(state) {
    return {
      arenaWidth: state.arenaWidth,
      arenaHeight: state.arenaHeight,
      cellSize: state.cellSize,
      trailThickness: state.trailThickness,
      tick: state.tick,
      alivePlayerIds: state.alivePlayerIds,
      winnerPlayerId: state.winnerPlayerId,
      winnerName: state.winnerName,
      isDraw: state.isDraw,
      finishAt: state.finishAt,
      players: Object.fromEntries(
        Object.values(state.players).map((player) => [
          player.playerId,
          {
            playerId: player.playerId,
            name: player.name,
            color: player.color,
            x: player.x,
            y: player.y,
            angleRad: player.angleRad,
            alive: player.alive,
            turnInput: player.turnInput,
            trailCellIds: [],
            trailSegments: [],
            eliminatedAt: player.eliminatedAt,
            collisionReason: player.collisionReason
          }
        ])
      )
    };
  }
};
