import type { ScoreEntry } from "@open-party-lab/game-core";
import type { ScoreboardSnapshot } from "@open-party-lab/protocol";
import { now } from "../core/time/now.js";
import type { RoomRecord } from "../rooms/roomStore.js";

export class ScoreManager {
  constructor(private readonly getNow: () => number = now) {}

  apply(room: RoomRecord, entries: ScoreEntry[]): void {
    for (const entry of entries) {
      const player = room.players.get(entry.playerId);

      if (!player) {
        continue;
      }

      player.score += entry.delta;
    }
  }

  toSnapshot(room: RoomRecord): ScoreboardSnapshot {
    const lastRoundDeltas = new Map(
      (room.currentRound?.scoreEntries ?? []).map((entry) => [entry.playerId, entry.delta])
    );

    return {
      roomCode: room.code,
      updatedAt: this.getNow(),
      entries: [...room.players.values()]
        .sort((left, right) => {
          if (right.score !== left.score) {
            return right.score - left.score;
          }

          return left.joinedAt - right.joinedAt;
        })
        .map((player) => ({
          playerId: player.id,
          delta: lastRoundDeltas.get(player.id) ?? 0,
          total: player.score
        }))
    };
  }
}
