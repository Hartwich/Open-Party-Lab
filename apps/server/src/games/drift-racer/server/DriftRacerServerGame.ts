import {
  createBaseRoundState,
  resolveRoundPhaseTimings,
  transitionRoundState,
  type GamePlayerSummary,
  type ScoreEntry,
  type ServerGame,
  type ServerGameContext
} from "@open-party-lab/game-core";
import type {
  DriftRacerControlState,
  DriftRacerInput,
  DriftRacerRacerState,
  DriftRacerState
} from "@open-party-lab/protocol";
import { driftRacerManifest } from "../manifest.js";
import {
  driftRacerTrack,
  driftRacerTrackConfig,
  projectPointToDriftRacerTrack,
  sampleDriftRacerTrack
} from "./driftRacerTrack.js";
import type {
  DriftRacerRuntimeRacerState,
  DriftRacerRuntimeState
} from "./driftRacerState.js";

const phaseTimings = resolveRoundPhaseTimings(driftRacerManifest.phaseDurations);
const acceleration = 660;
const brakeAcceleration = 920;
const reverseAcceleration = 350;
const rollingDrag = 1.05;
const offTrackDrag = 2.55;
const maxForwardSpeed = 780;
const maxBoostSpeed = 1_040;
const maxOffTrackSpeed = 390;
const maxReverseSpeed = -170;
const steeringRate = 2.45;
const driftSteeringRate = 3.2;
const driftFuelGainPerSecond = 0.28;
const boostFuelUsePerSecond = 0.56;
const boostAcceleration = 920;

const neutralControls: DriftRacerControlState = {
  steering: 0,
  throttle: false,
  brake: false,
  drift: false,
  boost: false
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeAngle(angleRad: number): number {
  const fullCircle = Math.PI * 2;
  const normalized = angleRad % fullCircle;
  return normalized >= -Math.PI ? normalized : normalized + fullCircle;
}

function getPlayers(context: ServerGameContext): GamePlayerSummary[] {
  if (context.players.length > 0) {
    return context.players.slice(0, 4);
  }

  return [
    {
      id: "drift-racer-player",
      name: "Player",
      color: "#22d3ee",
      score: 0,
      isReady: true,
      connected: true
    }
  ];
}

function createRacers(context: ServerGameContext): DriftRacerRuntimeRacerState[] {
  const players = getPlayers(context);
  const laneOffsets = [-0.24, 0.24, -0.08, 0.08];

  return players.map((player, index) => {
    const row = Math.floor(index / 2);
    const startDistance = 110 + row * 92;
    const sample = sampleDriftRacerTrack(startDistance);
    const laneOffset = laneOffsets[index] * driftRacerTrackConfig.trackWidth;
    const x = sample.x + sample.normalX * laneOffset;
    const y = sample.y + sample.normalY * laneOffset;

    return {
      playerId: player.id,
      name: player.name,
      color: player.color,
      x,
      y,
      angleRad: sample.angleRad,
      speed: 0,
      lap: 0,
      lapProgress: startDistance,
      previousLapProgress: startDistance,
      totalProgress: startDistance,
      rank: index + 1,
      finished: false,
      finishMs: null,
      finishOrder: null,
      offTrack: false,
      drifting: false,
      boostFuel: 0.35,
      boostActive: false,
      steerInput: 0,
      controls: neutralControls,
      lastInputAt: context.now
    };
  });
}

function toPublicRacer(racer: DriftRacerRuntimeRacerState): DriftRacerRacerState {
  return {
    playerId: racer.playerId,
    name: racer.name,
    color: racer.color,
    x: racer.x,
    y: racer.y,
    angleRad: racer.angleRad,
    speed: racer.speed,
    lap: racer.lap,
    lapProgress: racer.lapProgress,
    totalProgress: racer.totalProgress,
    rank: racer.rank,
    finished: racer.finished,
    finishMs: racer.finishMs,
    offTrack: racer.offTrack,
    drifting: racer.drifting,
    boostFuel: racer.boostFuel,
    boostActive: racer.boostActive,
    steerInput: racer.steerInput
  };
}

function sortRacersForRank(racers: DriftRacerRuntimeRacerState[]): DriftRacerRuntimeRacerState[] {
  return [...racers].sort((a, b) => {
    if (a.finished && b.finished) {
      return (a.finishOrder ?? 999) - (b.finishOrder ?? 999);
    }

    if (a.finished !== b.finished) {
      return a.finished ? -1 : 1;
    }

    return b.totalProgress - a.totalProgress;
  });
}

function assignRanks(racers: DriftRacerRuntimeRacerState[]): DriftRacerRuntimeRacerState[] {
  const rankByPlayerId = new Map<string, number>();

  sortRacersForRank(racers).forEach((racer, index) => {
    rankByPlayerId.set(racer.playerId, index + 1);
  });

  return racers.map((racer) => ({
    ...racer,
    rank: rankByPlayerId.get(racer.playerId) ?? racer.rank
  }));
}

function updateRacerProgress(
  racer: DriftRacerRuntimeRacerState,
  elapsedMs: number,
  nextFinishOrder: number
): { racer: DriftRacerRuntimeRacerState; nextFinishOrder: number } {
  const projection = projectPointToDriftRacerTrack(racer.x, racer.y);
  const lapProgress = projection.distance;
  const crossedForward =
    racer.previousLapProgress > driftRacerTrack.length * 0.78 &&
    lapProgress < driftRacerTrack.length * 0.22 &&
    racer.speed > 70;
  const crossedBackward =
    racer.previousLapProgress < driftRacerTrack.length * 0.18 &&
    lapProgress > driftRacerTrack.length * 0.82 &&
    racer.speed < -55;
  const lap = crossedForward
    ? racer.lap + 1
    : crossedBackward
      ? Math.max(0, racer.lap - 1)
      : racer.lap;
  const finished = racer.finished || lap >= driftRacerTrackConfig.lapsToWin;
  const finishOrder = finished && racer.finishOrder === null ? nextFinishOrder : racer.finishOrder;
  const finishMs = finished && racer.finishMs === null ? elapsedMs : racer.finishMs;

  return {
    racer: {
      ...racer,
      lap,
      lapProgress,
      previousLapProgress: lapProgress,
      totalProgress: lap * driftRacerTrack.length + lapProgress,
      finished,
      finishOrder,
      finishMs,
      offTrack: projection.lateralDistance > driftRacerTrackConfig.trackWidth * 0.5
    },
    nextFinishOrder: finished && racer.finishOrder === null ? nextFinishOrder + 1 : nextFinishOrder
  };
}

function simulateRacer(
  racer: DriftRacerRuntimeRacerState,
  deltaMs: number,
  connected: boolean
): DriftRacerRuntimeRacerState {
  if (racer.finished) {
    return {
      ...racer,
      controls: neutralControls,
      speed: racer.speed * 0.96,
      boostActive: false,
      drifting: false,
      steerInput: 0
    };
  }

  const seconds = Math.max(0.001, deltaMs / 1000);
  const controls = connected ? racer.controls : neutralControls;
  const steering = clamp(controls.steering, -1, 1);
  const driftRequested = controls.drift && Math.abs(steering) > 0.12 && racer.speed > 170;
  const boostActive = controls.boost && racer.boostFuel > 0.02 && racer.speed > 80;
  const maxSpeed = racer.offTrack ? maxOffTrackSpeed : boostActive ? maxBoostSpeed : maxForwardSpeed;
  let speed = racer.speed;

  if (controls.throttle) {
    speed += acceleration * seconds;
  }

  if (controls.brake) {
    speed += speed > 20 ? -brakeAcceleration * seconds : -reverseAcceleration * seconds;
  }

  speed -= speed * (racer.offTrack ? offTrackDrag : rollingDrag) * seconds;

  if (boostActive) {
    speed += boostAcceleration * seconds;
  }

  if (driftRequested) {
    speed -= Math.max(0, speed) * 0.34 * seconds;
  }

  speed = clamp(speed, maxReverseSpeed, maxSpeed);

  const speedFactor = clamp(Math.abs(speed) / maxForwardSpeed, 0.12, 1.18);
  const turnRate = driftRequested ? driftSteeringRate : steeringRate;
  const directionSign = speed >= 0 ? 1 : -1;
  const angleRad = normalizeAngle(
    racer.angleRad + steering * turnRate * speedFactor * directionSign * seconds
  );
  const slideAngle = driftRequested ? steering * 0.34 * speedFactor : 0;
  const moveAngle = angleRad + slideAngle;
  const x = clamp(
    racer.x + Math.cos(moveAngle) * speed * seconds,
    driftRacerTrackConfig.carRadius,
    driftRacerTrackConfig.worldWidth - driftRacerTrackConfig.carRadius
  );
  const y = clamp(
    racer.y + Math.sin(moveAngle) * speed * seconds,
    driftRacerTrackConfig.carRadius,
    driftRacerTrackConfig.worldHeight - driftRacerTrackConfig.carRadius
  );
  const boostFuel = clamp(
    racer.boostFuel +
      (driftRequested && !racer.offTrack ? driftFuelGainPerSecond * seconds : 0) -
      (boostActive ? boostFuelUsePerSecond * seconds : 0),
    0,
    1
  );

  return {
    ...racer,
    controls,
    x,
    y,
    angleRad,
    speed,
    drifting: driftRequested,
    boostActive,
    boostFuel,
    steerInput: steering
  };
}

function resolveRacerBumps(racers: DriftRacerRuntimeRacerState[]): DriftRacerRuntimeRacerState[] {
  const nextRacers = racers.map((racer) => ({ ...racer }));
  const minDistance = driftRacerTrackConfig.carRadius * 1.82;

  for (let firstIndex = 0; firstIndex < nextRacers.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < nextRacers.length; secondIndex += 1) {
      const first = nextRacers[firstIndex];
      const second = nextRacers[secondIndex];
      const dx = second.x - first.x;
      const dy = second.y - first.y;
      const distance = Math.hypot(dx, dy);

      if (distance <= 0.001 || distance >= minDistance) {
        continue;
      }

      const nx = dx / distance;
      const ny = dy / distance;
      const overlap = (minDistance - distance) / 2;

      first.x = clamp(first.x - nx * overlap, driftRacerTrackConfig.carRadius, driftRacerTrackConfig.worldWidth);
      first.y = clamp(first.y - ny * overlap, driftRacerTrackConfig.carRadius, driftRacerTrackConfig.worldHeight);
      second.x = clamp(second.x + nx * overlap, driftRacerTrackConfig.carRadius, driftRacerTrackConfig.worldWidth);
      second.y = clamp(second.y + ny * overlap, driftRacerTrackConfig.carRadius, driftRacerTrackConfig.worldHeight);
      first.speed *= 0.86;
      second.speed *= 0.86;
    }
  }

  return nextRacers;
}

function buildRaceMessage(state: DriftRacerRuntimeState, language: ServerGameContext["language"]): string {
  const leader = sortRacersForRank(state.racers)[0];

  if (!leader) {
    return language === "en" ? "Race finished." : "Rennen beendet.";
  }

  if (state.isTimedOut) {
    return language === "en"
      ? `${leader.name} leads at the time limit.`
      : `${leader.name} fuehrt beim Zeitlimit.`;
  }

  return language === "en" ? `${leader.name} reaches the finish.` : `${leader.name} erreicht das Ziel.`;
}

function tickRace(
  state: DriftRacerRuntimeState,
  deltaMs: number,
  context: ServerGameContext
): DriftRacerRuntimeState {
  const connectedByPlayerId = new Map(context.players.map((player) => [player.id, player.connected]));
  let racers = state.racers.map((racer) =>
    simulateRacer(racer, deltaMs, connectedByPlayerId.get(racer.playerId) !== false)
  );

  racers = resolveRacerBumps(racers);

  let nextFinishOrder = state.nextFinishOrder;
  const elapsedMs = Math.min(state.maxRaceMs, state.elapsedMs + deltaMs);
  racers = racers.map((racer) => {
    const progressUpdate = updateRacerProgress(racer, elapsedMs, nextFinishOrder);
    nextFinishOrder = progressUpdate.nextFinishOrder;
    return progressUpdate.racer;
  });
  racers = assignRanks(racers);

  const allFinished = racers.length > 0 && racers.every((racer) => racer.finished);
  const isTimedOut = elapsedMs >= state.maxRaceMs;
  const leader = sortRacersForRank(racers)[0];

  return {
    ...state,
    racers,
    elapsedMs,
    tick: state.tick + 1,
    nextFinishOrder,
    isTimedOut,
    winnerPlayerId: allFinished || isTimedOut ? leader?.playerId : state.winnerPlayerId,
    winnerName: allFinished || isTimedOut ? leader?.name : state.winnerName,
    updatedAt: context.now,
    message: allFinished || isTimedOut ? buildRaceMessage({ ...state, racers, isTimedOut }, context.language) : state.message
  };
}

function buildPublicState(state: DriftRacerRuntimeState): DriftRacerState {
  return {
    worldWidth: state.worldWidth,
    worldHeight: state.worldHeight,
    trackWidth: state.trackWidth,
    trackLength: state.trackLength,
    lapsToWin: state.lapsToWin,
    maxRaceMs: state.maxRaceMs,
    elapsedMs: state.elapsedMs,
    tick: state.tick,
    winnerPlayerId: state.winnerPlayerId,
    winnerName: state.winnerName,
    isTimedOut: state.isTimedOut,
    track: state.track,
    racers: state.racers.map(toPublicRacer)
  };
}

function buildScore(state: DriftRacerRuntimeState): ScoreEntry[] {
  const racerCount = state.racers.length;

  return sortRacersForRank(state.racers).map((racer, index) => ({
    playerId: racer.playerId,
    delta: Math.max(1, racerCount - index),
    reason: index === 0 ? "Drift Racer Sieg" : "Drift Racer Platzierung"
  }));
}

export const driftRacerServerGame: ServerGame<
  DriftRacerRuntimeState,
  DriftRacerInput,
  DriftRacerState
> = {
  manifest: driftRacerManifest,
  createInitialState(context) {
    return {
      ...createBaseRoundState("round_intro", context.now, {
        durationMs: phaseTimings.roundIntroMs,
        message: context.language === "en" ? "Engines warming up." : "Motoren laufen warm."
      }),
      worldWidth: driftRacerTrackConfig.worldWidth,
      worldHeight: driftRacerTrackConfig.worldHeight,
      trackWidth: driftRacerTrackConfig.trackWidth,
      trackLength: driftRacerTrack.length,
      lapsToWin: driftRacerTrackConfig.lapsToWin,
      maxRaceMs: driftRacerTrackConfig.maxRaceMs,
      elapsedMs: 0,
      tick: 0,
      winnerPlayerId: undefined,
      winnerName: undefined,
      isTimedOut: false,
      track: driftRacerTrack.points,
      racers: assignRanks(createRacers(context)),
      nextFinishOrder: 1
    };
  },
  startRound(_state, context) {
    return transitionRoundState(
      {
        ..._state,
        elapsedMs: 0,
        tick: 0,
        winnerPlayerId: undefined,
        winnerName: undefined,
        isTimedOut: false,
        racers: assignRanks(createRacers(context)),
        nextFinishOrder: 1
      },
      "playing",
      context.now,
      {
        startedAt: context.now,
        message: context.language === "en" ? "Race is live." : "Das Rennen laeuft."
      }
    );
  },
  handleInput(state, input, context) {
    if (input.type !== "drive" || state.phase !== "playing") {
      return state;
    }

    const racerIndex = state.racers.findIndex((racer) => racer.playerId === input.playerId);

    if (racerIndex === -1) {
      return state;
    }

    const racers = [...state.racers];
    const racer = racers[racerIndex];
    racers[racerIndex] = {
      ...racer,
      controls: {
        steering: clamp(input.steering, -1, 1),
        throttle: Boolean(input.throttle),
        brake: Boolean(input.brake),
        drift: Boolean(input.drift),
        boost: Boolean(input.boost)
      },
      lastInputAt: input.sentAt ?? context.now
    };

    return {
      ...state,
      racers,
      updatedAt: input.sentAt ?? context.now
    };
  },
  tick(state, deltaMs, context) {
    if (state.phase !== "playing") {
      return state;
    }

    return tickRace(state, deltaMs, context);
  },
  isRoundFinished(state) {
    return (
      state.phase === "locked" ||
      state.isTimedOut ||
      (state.racers.length > 0 && state.racers.every((racer) => racer.finished))
    );
  },
  buildScore(state) {
    return buildScore(state);
  },
  toPublicState(state) {
    return buildPublicState(state);
  },
  toControllerState(state) {
    return buildPublicState(state);
  }
};
