import {
  createBaseRoundState,
  roundPhaseDurations,
  transitionRoundState,
  type ScoreEntry,
  type SupportedLanguage,
  type ServerGame
} from "@open-party-lab/game-core";
import { airHockeyManifest } from "../manifest.js";
import { AirHockeyInput, AirHockeyState, clamp, type AirHockeyPaddleState } from "./airHockeyState.js";

const arenaWidth = 1_200;
const arenaHeight = 700;
const paddleRadius = 42;
const puckRadius = 22;
const goalSize = 320;
const targetScore = 5;
const serveCountdownMs = 3_000;
const paddleSpeed = 520;
const puckBaseSpeed = 560;
const puckMaxSpeed = 980;

const airHockeyText = {
  de: {
    playerOne: "Spieler 1",
    playerTwo: "Spieler 2",
    playerFallback: "Spieler",
    intro: "Air Hockey: Verteidige dein Tor links oder rechts!",
    sideLeft: "links",
    sideRight: "rechts",
    serveCountdown: (secondsRemaining: number, sideLabel: string) =>
      `Anstoss in ${secondsRemaining} Sekunden nach ${sideLabel}.`,
    serveLaunch: (sideLabel: string) => `Anstoss nach ${sideLabel}!`,
    scores: (name: string) => `${name} trifft!`,
    wins: (name: string) => `${name} gewinnt die Runde!`
  },
  en: {
    playerOne: "Player 1",
    playerTwo: "Player 2",
    playerFallback: "Player",
    intro: "Air Hockey: Defend your goal on the left or right!",
    sideLeft: "left",
    sideRight: "right",
    serveCountdown: (secondsRemaining: number, sideLabel: string) =>
      `Face-off in ${secondsRemaining} seconds toward the ${sideLabel}.`,
    serveLaunch: (sideLabel: string) => `Face-off toward the ${sideLabel}!`,
    scores: (name: string) => `${name} scores!`,
    wins: (name: string) => `${name} wins the round!`
  }
} satisfies Record<SupportedLanguage, {
  playerOne: string;
  playerTwo: string;
  playerFallback: string;
  intro: string;
  sideLeft: string;
  sideRight: string;
  serveCountdown: (secondsRemaining: number, sideLabel: string) => string;
  serveLaunch: (sideLabel: string) => string;
  scores: (name: string) => string;
  wins: (name: string) => string;
}>;

function normalize(moveX: number, moveY: number): { x: number; y: number } {
  const magnitude = Math.hypot(moveX, moveY);

  if (magnitude < 0.0001) {
    return { x: 0, y: 0 };
  }

  if (magnitude <= 1) {
    return { x: moveX, y: moveY };
  }

  return { x: moveX / magnitude, y: moveY / magnitude };
}

function createPaddles(
  statePlayers: Array<{ id: string; name: string; color: string }>,
  language: SupportedLanguage
): {
  paddles: Record<string, AirHockeyPaddleState>;
  leftPlayerId: string;
  rightPlayerId: string;
  scoresByPlayer: Record<string, number>;
} {
  const [first, second] = statePlayers;
  const leftPlayerId = first?.id ?? "p1";
  const rightPlayerId = second?.id ?? "p2";
  const text = airHockeyText[language];

  return {
    leftPlayerId,
    rightPlayerId,
    paddles: {
      [leftPlayerId]: {
        playerId: leftPlayerId,
        name: first?.name ?? text.playerOne,
        color: first?.color ?? "#60a5fa",
        x: arenaWidth * 0.23,
        y: arenaHeight / 2,
        inputX: 0,
        inputY: 0
      },
      [rightPlayerId]: {
        playerId: rightPlayerId,
        name: second?.name ?? text.playerTwo,
        color: second?.color ?? "#f97316",
        x: arenaWidth * 0.77,
        y: arenaHeight / 2,
        inputX: 0,
        inputY: 0
      }
    },
    scoresByPlayer: {
      [leftPlayerId]: 0,
      [rightPlayerId]: 0
    }
  };
}

function buildServeMessage(
  direction: "left" | "right",
  secondsRemaining: number,
  language: SupportedLanguage
): string {
  const text = airHockeyText[language];
  const sideLabel = direction === "right" ? text.sideRight : text.sideLeft;
  return text.serveCountdown(secondsRemaining, sideLabel);
}

function beginServeCountdown(
  state: AirHockeyState,
  now: number,
  direction: "left" | "right",
  language: SupportedLanguage
): AirHockeyState {
  return {
    ...state,
    puckX: arenaWidth / 2,
    puckY: arenaHeight / 2,
    puckVx: 0,
    puckVy: 0,
    serveDirection: direction,
    serveCountdownEndsAt: now + serveCountdownMs,
    paddles: {
      ...state.paddles,
      [state.leftPlayerId]: {
        ...state.paddles[state.leftPlayerId],
        x: arenaWidth * 0.23,
        y: arenaHeight / 2,
        inputX: 0,
        inputY: 0
      },
      [state.rightPlayerId]: {
        ...state.paddles[state.rightPlayerId],
        x: arenaWidth * 0.77,
        y: arenaHeight / 2,
        inputX: 0,
        inputY: 0
      }
    },
    message: buildServeMessage(direction, 3, language),
    updatedAt: now
  };
}

function launchServe(state: AirHockeyState, now: number, language: SupportedLanguage): AirHockeyState {
  const serveTowardRight = state.serveDirection === "right";
  const text = airHockeyText[language];
  const sideLabel = serveTowardRight ? text.sideRight : text.sideLeft;

  return {
    ...state,
    puckVx: serveTowardRight ? puckBaseSpeed : -puckBaseSpeed,
    puckVy: 0,
    serveCountdownEndsAt: null,
    message: text.serveLaunch(sideLabel),
    updatedAt: now
  };
}

function buildScore(state: AirHockeyState): ScoreEntry[] {
  return state.winnerPlayerId ? [{ playerId: state.winnerPlayerId, delta: 1, reason: "Air Hockey Sieg" }] : [];
}

export const airHockeyServerGame: ServerGame<AirHockeyState, AirHockeyInput> = {
  manifest: airHockeyManifest,
  createInitialState(context) {
    const setup = createPaddles(context.players, context.language);
    return {
      ...createBaseRoundState("round_intro", context.now, {
        durationMs: roundPhaseDurations.roundIntroMs,
        message: airHockeyText[context.language].intro
      }),
      arenaWidth,
      arenaHeight,
      puckX: arenaWidth / 2,
      puckY: arenaHeight / 2,
      puckVx: 0,
      puckVy: 0,
      paddleRadius,
      puckRadius,
      goalSize,
      targetScore,
      tick: 0,
      leftPlayerId: setup.leftPlayerId,
      rightPlayerId: setup.rightPlayerId,
      serveDirection: "right",
      serveCountdownEndsAt: null,
      paddles: setup.paddles,
      scoresByPlayer: setup.scoresByPlayer
    };
  },
  startRound(state, context) {
    const setup = createPaddles(context.players, context.language);
    const nextState = transitionRoundState(
      {
        ...state,
        leftPlayerId: setup.leftPlayerId,
        rightPlayerId: setup.rightPlayerId,
        paddles: setup.paddles,
        scoresByPlayer: setup.scoresByPlayer,
        winnerPlayerId: undefined,
        tick: 0,
        serveDirection: "right",
        serveCountdownEndsAt: null,
        puckX: arenaWidth / 2,
        puckY: arenaHeight / 2,
        puckVx: 0,
        puckVy: 0
      },
      "playing",
      context.now,
      {
        startedAt: context.now,
        message: buildServeMessage("right", 3, context.language)
      }
    ) as AirHockeyState;

    return beginServeCountdown(nextState, context.now, "right", context.language);
  },
  handleInput(state, input) {
    if (state.phase !== "playing" || input.type !== "move") {
      return state;
    }

    const paddle = state.paddles[input.playerId];

    if (!paddle) {
      return state;
    }

    const normalized = normalize(input.moveX, input.moveY);

    return {
      ...state,
      paddles: {
        ...state.paddles,
        [input.playerId]: {
          ...paddle,
          inputX: normalized.x,
          inputY: normalized.y
        }
      },
      updatedAt: input.sentAt
    };
  },
  tick(state, deltaMs, context) {
    if (state.phase !== "playing") {
      return state;
    }

    if (state.serveCountdownEndsAt !== null) {
      if (context.now < state.serveCountdownEndsAt) {
        const remainingSeconds = Math.max(
          1,
          Math.ceil((state.serveCountdownEndsAt - context.now) / 1000)
        );
        const countdownMessage = buildServeMessage(state.serveDirection, remainingSeconds, context.language);

        if (state.message === countdownMessage) {
          return state;
        }

        return {
          ...state,
          message: countdownMessage,
          updatedAt: context.now
        };
      }

      return launchServe(state, context.now, context.language);
    }

    const seconds = Math.max(0.001, deltaMs / 1000);
    const midX = state.arenaWidth / 2;
    const nextPaddles = { ...state.paddles };

    for (const paddle of Object.values(state.paddles)) {
      const inLeftHalf = paddle.playerId === state.leftPlayerId;
      const minX = inLeftHalf ? state.paddleRadius : midX + state.paddleRadius;
      const maxX = inLeftHalf ? midX - state.paddleRadius : state.arenaWidth - state.paddleRadius;
      const nextX = clamp(paddle.x + paddle.inputX * paddleSpeed * seconds, minX, maxX);
      const nextY = clamp(
        paddle.y + paddle.inputY * paddleSpeed * seconds,
        state.paddleRadius,
        state.arenaHeight - state.paddleRadius
      );

      nextPaddles[paddle.playerId] = {
        ...paddle,
        x: nextX,
        y: nextY
      };
    }

    let puckX = state.puckX + state.puckVx * seconds;
    let puckY = state.puckY + state.puckVy * seconds;
    let puckVx = state.puckVx;
    let puckVy = state.puckVy;

    if (puckY <= state.puckRadius || puckY >= state.arenaHeight - state.puckRadius) {
      puckY = clamp(puckY, state.puckRadius, state.arenaHeight - state.puckRadius);
      puckVy *= -1;
    }

    const goalTop = (state.arenaHeight - state.goalSize) / 2;
    const goalBottom = goalTop + state.goalSize;
    const insideGoal = puckY >= goalTop && puckY <= goalBottom;
    const scoredLeft = puckX <= state.puckRadius && insideGoal;
    const scoredRight = puckX >= state.arenaWidth - state.puckRadius && insideGoal;

    if (scoredLeft || scoredRight) {
      const nextServeDirection = state.serveDirection === "right" ? "left" : "right";
      const scorerId = scoredLeft ? state.rightPlayerId : state.leftPlayerId;
      const nextScore = (state.scoresByPlayer[scorerId] ?? 0) + 1;
      const nextState: AirHockeyState = {
        ...state,
        tick: state.tick + 1,
        paddles: nextPaddles,
        scoresByPlayer: {
          ...state.scoresByPlayer,
          [scorerId]: nextScore
        },
        serveDirection: nextServeDirection,
        serveCountdownEndsAt: null,
        message: airHockeyText[context.language].scores(
          state.paddles[scorerId]?.name ?? airHockeyText[context.language].playerFallback
        )
      };

      if (nextScore >= state.targetScore) {
        return transitionRoundState(
          {
            ...nextState,
            winnerPlayerId: scorerId
          },
          "locked",
          context.now,
          {
            durationMs: roundPhaseDurations.lockedMs,
            message: airHockeyText[context.language].wins(
              state.paddles[scorerId]?.name ?? airHockeyText[context.language].playerFallback
            )
          }
        );
      }

      return beginServeCountdown(nextState, context.now, nextServeDirection, context.language);
    }

    if (puckX <= state.puckRadius && !insideGoal) {
      puckX = state.puckRadius;
      puckVx = Math.abs(puckVx);
    } else if (puckX >= state.arenaWidth - state.puckRadius && !insideGoal) {
      puckX = state.arenaWidth - state.puckRadius;
      puckVx = -Math.abs(puckVx);
    }

    for (const paddle of Object.values(nextPaddles)) {
      const dx = puckX - paddle.x;
      const dy = puckY - paddle.y;
      const minDistance = state.puckRadius + state.paddleRadius;
      const distance = Math.hypot(dx, dy);

      if (distance > 0 && distance < minDistance) {
        const nx = dx / distance;
        const ny = dy / distance;
        const overlap = minDistance - distance;
        puckX += nx * overlap;
        puckY += ny * overlap;

        const incomingDot = puckVx * nx + puckVy * ny;
        const reflectedVx = puckVx - 2 * incomingDot * nx;
        const reflectedVy = puckVy - 2 * incomingDot * ny;
        const influenceVx = paddle.inputX * 140;
        const influenceVy = paddle.inputY * 140;
        puckVx = reflectedVx + influenceVx;
        puckVy = reflectedVy + influenceVy;

        const speed = Math.hypot(puckVx, puckVy);

        if (speed < puckBaseSpeed) {
          const scale = puckBaseSpeed / Math.max(speed, 0.001);
          puckVx *= scale;
          puckVy *= scale;
        } else if (speed > puckMaxSpeed) {
          const scale = puckMaxSpeed / speed;
          puckVx *= scale;
          puckVy *= scale;
        }
      }
    }

    return {
      ...state,
      paddles: nextPaddles,
      puckX,
      puckY,
      puckVx,
      puckVy,
      tick: state.tick + 1,
      updatedAt: context.now
    };
  },
  isRoundFinished(state) {
    return state.phase === "locked";
  },
  buildScore
};
