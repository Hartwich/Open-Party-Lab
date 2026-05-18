import {
  createBaseRoundState,
  roundPhaseDurations,
  transitionRoundState,
  type ScoreEntry,
  type SupportedLanguage,
  type ServerGame
} from "@open-party-lab/game-core";
import { tapRaceManifest } from "../manifest.js";
import type { TapRaceInput, TapRaceState } from "./tapRaceState.js";

const tapRaceTargetTaps = 50;
const tapRaceDurationMs = 20_000;

const tapRaceText = {
  de: {
    ready: "Auf die Plaetze, fertig ...",
    playing: "Tippen, tippen, tippen!",
    keepGoing: "Weiter tippen!",
    noInput: "Keine Eingaben. Diese Runde zaehlt nicht.",
    unknown: "Unbekannt",
    fallbackPlayer: "Ein Spieler",
    targetReached: (name: string) => `${name} erreicht das Ziel zuerst.`,
    wins: (name: string) => `${name} gewinnt das Tap Race.`
  },
  en: {
    ready: "On your marks, get set ...",
    playing: "Tap, tap, tap!",
    keepGoing: "Keep tapping!",
    noInput: "No input. This round does not count.",
    unknown: "Unknown",
    fallbackPlayer: "A player",
    targetReached: (name: string) => `${name} reaches the target first.`,
    wins: (name: string) => `${name} wins the Tap Race.`
  }
} satisfies Record<SupportedLanguage, {
  ready: string;
  playing: string;
  keepGoing: string;
  noInput: string;
  unknown: string;
  fallbackPlayer: string;
  targetReached: (name: string) => string;
  wins: (name: string) => string;
}>;

function buildTapRaceScore(state: TapRaceState): ScoreEntry[] {
  return state.winnerPlayerId
    ? [{ playerId: state.winnerPlayerId, delta: 1, reason: "Tap race win" }]
    : [];
}

function createInitialTapMap(playerIds: string[]): Record<string, number> {
  return Object.fromEntries(playerIds.map((playerId) => [playerId, 0]));
}

export const tapRaceServerGame: ServerGame<TapRaceState, TapRaceInput> = {
  manifest: tapRaceManifest,
  createInitialState(context) {
    const text = tapRaceText[context.language];

    return {
      ...createBaseRoundState("round_intro", context.now, {
        durationMs: roundPhaseDurations.roundIntroMs,
        message: text.ready
      }),
      targetTaps: tapRaceTargetTaps,
      finishAt: null,
      tapsByPlayer: createInitialTapMap(context.players.map((player) => player.id))
    };
  },
  startRound(state, context) {
    const text = tapRaceText[context.language];

    return transitionRoundState(
      {
        ...state,
        finishAt: context.now + tapRaceDurationMs,
        tapsByPlayer: createInitialTapMap(context.players.map((player) => player.id)),
        leadingPlayerId: undefined,
        winnerPlayerId: undefined,
        winnerName: undefined,
        winningTapCount: undefined
      },
      "playing",
      context.now,
      {
        startedAt: context.now,
        message: text.playing
      }
    );
  },
  handleInput(state, input, context) {
    if (state.phase !== "playing") {
      return state;
    }

    const currentTaps = state.tapsByPlayer[input.playerId] ?? 0;
    const nextTapCount = currentTaps + 1;
    const tapsByPlayer = {
      ...state.tapsByPlayer,
      [input.playerId]: nextTapCount
    };
    const actingPlayer = context.players.find((player) => player.id === input.playerId);
    const text = tapRaceText[context.language];

    if (nextTapCount >= state.targetTaps) {
      return transitionRoundState(
        {
          ...state,
          tapsByPlayer,
          leadingPlayerId: input.playerId,
          winnerPlayerId: input.playerId,
          winnerName: actingPlayer?.name ?? text.unknown,
          winningTapCount: nextTapCount
        },
        "locked",
        context.now,
        {
          durationMs: roundPhaseDurations.lockedMs,
          message: text.targetReached(actingPlayer?.name ?? text.fallbackPlayer)
        }
      );
    }

    const leadingPlayerId = Object.entries(tapsByPlayer).sort((left, right) => right[1] - left[1])[0]?.[0];

    return {
      ...state,
      tapsByPlayer,
      leadingPlayerId,
      updatedAt: context.now,
      message: text.keepGoing
    };
  },
  tick(state, _deltaMs, context) {
    if (state.phase !== "playing" || state.finishAt === null || context.now < state.finishAt) {
      return state;
    }

    const sortedResults = Object.entries(state.tapsByPlayer).sort((left, right) => right[1] - left[1]);
    const [winnerEntry] = sortedResults;

    if (!winnerEntry || winnerEntry[1] === 0) {
      return transitionRoundState(
        state,
        "locked",
        context.now,
      {
        durationMs: roundPhaseDurations.lockedMs,
        message: tapRaceText[context.language].noInput
      }
      );
    }

    const actingPlayer = context.players.find((player) => player.id === winnerEntry[0]);
    const text = tapRaceText[context.language];

    return transitionRoundState(
      {
        ...state,
        winnerPlayerId: winnerEntry[0],
        winnerName: actingPlayer?.name ?? text.unknown,
        winningTapCount: winnerEntry[1],
        leadingPlayerId: winnerEntry[0]
      },
      "locked",
      context.now,
      {
        durationMs: roundPhaseDurations.lockedMs,
        message: text.wins(actingPlayer?.name ?? text.fallbackPlayer)
      }
    );
  },
  isRoundFinished(state) {
    return state.phase === "locked";
  },
  buildScore(state) {
    return buildTapRaceScore(state);
  }
};
