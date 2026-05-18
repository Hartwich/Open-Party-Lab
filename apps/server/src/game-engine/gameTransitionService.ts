import {
  resolveRoundPhaseTimings,
  roundPhaseDurations,
  transitionRoundState,
  type BaseRoundState,
  type ServerGameContext
} from "@open-party-lab/game-core";
import type { RoomRecord } from "../rooms/roomStore.js";
import type { ServerGameEntry } from "./gameRegistry.js";
import { RoundManager } from "./roundManager.js";
import { ScoreManager } from "./scoreManager.js";

export interface TransitionProgress {
  stateChanged: boolean;
  scoreChanged: boolean;
  phaseChanged: boolean;
}

export class GameTransitionService {
  constructor(
    private readonly roundManager: RoundManager,
    private readonly scoreManager: ScoreManager
  ) {}

  progressRoom(
    room: RoomRecord,
    entry: ServerGameEntry,
    buildContext: (deltaMs: number) => ServerGameContext,
    deltaMs: number,
    invokeGameTick = true
  ): TransitionProgress {
    if (!room.currentRound) {
      return { stateChanged: false, scoreChanged: false, phaseChanged: false };
    }

    const game = entry.serverGame;
    const phaseDurations = resolveRoundPhaseTimings(entry.manifest.phaseDurations ?? roundPhaseDurations);
    const initialPhase = room.currentRound.phase;
    let state = room.currentRound.state as BaseRoundState;
    let stateChanged = false;
    let scoreChanged = false;
    const context = buildContext(deltaMs);
    const now = context.now;
    const selectedGameName = context.selectedGame.displayName;

    if (state.phase === "round_intro" && state.phaseEndsAt !== null && now >= state.phaseEndsAt) {
      state = transitionRoundState(state, "countdown", now, {
        durationMs: phaseDurations.countdownMs,
        message:
          context.language === "en"
            ? `${selectedGameName} starts soon.`
            : `${selectedGameName} startet gleich.`
      });
      stateChanged = true;
    }

    if (state.phase === "countdown" && state.phaseEndsAt !== null && now >= state.phaseEndsAt) {
      state = game.startRound(state as never, buildContext(deltaMs));
      stateChanged = true;
    }

    if (state.phase === "playing" && invokeGameTick && game.tick) {
      const nextState = game.tick(state as never, deltaMs, buildContext(deltaMs)) as BaseRoundState;

      if (nextState !== state) {
        state = nextState;
        stateChanged = true;
      }
    }

    if (state.phase === "playing" && game.isRoundFinished(state as never, buildContext(deltaMs))) {
      state = transitionRoundState(state, "locked", now, {
        durationMs: phaseDurations.lockedMs,
        message: state.message ?? (context.language === "en" ? "Round locked." : "Runde gesperrt.")
      });
      stateChanged = true;
    }

    if (stateChanged) {
      this.roundManager.replaceState(room, state);
    }

    if (state.phase === "locked") {
      if (room.currentRound?.scoreCommittedAt === null) {
        const scoreEntries = game.buildScore(state as never, buildContext(deltaMs));
        this.scoreManager.apply(room, scoreEntries);
        this.roundManager.commitScore(room, scoreEntries, now);
        scoreChanged = scoreEntries.length > 0;
      }

      if (state.phaseEndsAt !== null && now >= state.phaseEndsAt) {
        state =
          entry.manifest.roundCompletionMode === "wait_for_ready"
            ? transitionRoundState(state, "finished", now, {
                message: state.message ?? (context.language === "en" ? "Ready for the next round" : "Bereit fuer die naechste Runde")
              })
            : transitionRoundState(state, "result", now, {
                durationMs: phaseDurations.resultMs,
                message: state.message ?? (context.language === "en" ? "Result" : "Ergebnis")
              });
        this.roundManager.replaceState(room, state);
        stateChanged = true;
      }
    }

    if (state.phase === "result" && state.phaseEndsAt !== null && now >= state.phaseEndsAt) {
      state = transitionRoundState(state, "scoreboard", now, {
        durationMs: phaseDurations.scoreboardMs,
        message: context.language === "en" ? "Scoreboard" : "Punktestand"
      });
      this.roundManager.replaceState(room, state);
      stateChanged = true;
    }

    if (state.phase === "scoreboard" && state.phaseEndsAt !== null && now >= state.phaseEndsAt) {
      state = transitionRoundState(state, "finished", now, {
        message: context.language === "en" ? "Round finished" : "Runde beendet"
      });
      this.roundManager.replaceState(room, state);
      stateChanged = true;
    }

    return {
      stateChanged,
      scoreChanged,
      phaseChanged: (room.currentRound?.phase ?? state.phase) !== initialPhase
    };
  }
}
