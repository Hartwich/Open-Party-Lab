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
    const phaseMessage = (de: string, english: string, arabic: string) =>
      room.language === "ar" ? arabic : room.language === "en" ? english : de;

    if (state.phase === "round_intro" && state.phaseEndsAt !== null && now >= state.phaseEndsAt) {
      state = transitionRoundState(state, "countdown", now, {
        durationMs: phaseDurations.countdownMs,
        message: phaseMessage(
          `${selectedGameName} startet gleich.`,
          `${selectedGameName} starts soon.`,
          `${selectedGameName} يبدأ قريبًا.`
        )
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
        message: state.message ?? phaseMessage("Runde gesperrt.", "Round locked.", "الجولة مقفلة.")
      });
      stateChanged = true;
    }

    if (stateChanged) {
      this.roundManager.replaceState(room, state);
    }

    if (state.phase === "locked") {
      if (room.currentRound?.scoreCommittedAt === null) {
        const scoreEntries = game.buildScore(state as never, buildContext(deltaMs));
        if (entry.manifest.scoreScope !== "game") {
          this.scoreManager.apply(room, scoreEntries);
        }
        this.roundManager.commitScore(room, scoreEntries, now);
        if (entry.manifest.scoreScope === "game" && state && typeof state === "object" && "gameScores" in state) {
          const gameScores = { ...((state as { gameScores?: Record<string, number> }).gameScores ?? {}) };
          for (const scoreEntry of scoreEntries) {
            gameScores[scoreEntry.playerId] = (gameScores[scoreEntry.playerId] ?? 0) + scoreEntry.delta;
          }
          state = { ...(state as object), gameScores } as unknown as BaseRoundState;
          this.roundManager.replaceState(room, state);
        }
        scoreChanged = scoreEntries.length > 0;
      }

      if (state.phaseEndsAt !== null && now >= state.phaseEndsAt) {
        state =
          entry.manifest.roundCompletionMode === "wait_for_ready"
            ? transitionRoundState(state, "finished", now, {
                message: state.message ?? phaseMessage("Bereit fuer die naechste Runde", "Ready for the next round", "جاهز للجولة التالية")
              })
            : transitionRoundState(state, "result", now, {
                durationMs: phaseDurations.resultMs,
                message: state.message ?? phaseMessage("Ergebnis", "Result", "النتيجة")
              });
        this.roundManager.replaceState(room, state);
        stateChanged = true;
      }
    }

    if (state.phase === "result" && state.phaseEndsAt !== null && now >= state.phaseEndsAt) {
      state = transitionRoundState(state, "scoreboard", now, {
        durationMs: phaseDurations.scoreboardMs,
        message: phaseMessage("Punktestand", "Scoreboard", "لوحة النتائج")
      });
      this.roundManager.replaceState(room, state);
      stateChanged = true;
    }

    if (state.phase === "scoreboard" && state.phaseEndsAt !== null && now >= state.phaseEndsAt) {
      state = transitionRoundState(state, "finished", now, {
        message: phaseMessage("Runde beendet", "Round finished", "انتهت الجولة")
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
