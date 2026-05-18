import type { BaseRoundState, ScoreEntry } from "@open-party-lab/game-core";
import type { RoomRecord, RoundRecord } from "../rooms/roomStore.js";

export class RoundManager {
  openRound(room: RoomRecord, gameId: string, state: BaseRoundState): RoundRecord {
    const round: RoundRecord = {
      gameId,
      roundNumber: room.roundCounter + 1,
      phase: state.phase,
      startedAt: state.startedAt,
      phaseStartedAt: state.phaseStartedAt,
      phaseEndsAt: state.phaseEndsAt,
      updatedAt: state.updatedAt,
      message: state.message,
      state,
      scoreEntries: [],
      scoreCommittedAt: null
    };

    room.roundCounter = round.roundNumber;
    room.currentRound = round;
    return round;
  }

  replaceState(room: RoomRecord, state: BaseRoundState): RoundRecord | null {
    if (!room.currentRound) {
      return null;
    }

    room.currentRound = {
      ...room.currentRound,
      phase: state.phase,
      startedAt: state.startedAt,
      phaseStartedAt: state.phaseStartedAt,
      phaseEndsAt: state.phaseEndsAt,
      updatedAt: state.updatedAt,
      message: state.message,
      state
    };

    return room.currentRound;
  }

  commitScore(room: RoomRecord, scoreEntries: ScoreEntry[], committedAt: number): RoundRecord | null {
    if (!room.currentRound) {
      return null;
    }

    room.currentRound = {
      ...room.currentRound,
      scoreEntries,
      scoreCommittedAt: committedAt
    };

    return room.currentRound;
  }
}
