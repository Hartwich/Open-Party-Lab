import type { PlayerRecord, RoomRecord } from "../rooms/roomStore.js";

export class PlayerPresenceTracker {
  constructor(
    private readonly reconnectWindowMs: number,
    private readonly getNow: () => number
  ) {}

  markConnected(player: PlayerRecord, socketId: string): PlayerRecord {
    player.connected = true;
    player.presence = "online";
    player.socketId = socketId;
    player.lastSeenAt = this.getNow();
    player.reconnectGraceEndsAt = null;
    return player;
  }

  markDisconnected(player: PlayerRecord): PlayerRecord {
    const now = this.getNow();
    player.connected = false;
    player.presence = "reconnecting";
    player.socketId = null;
    player.lastSeenAt = now;
    player.reconnectGraceEndsAt = now + this.reconnectWindowMs;
    return player;
  }

  expireGraceWindows(room: RoomRecord): boolean {
    const now = this.getNow();
    let mutated = false;

    for (const player of room.players.values()) {
      if (
        player.presence === "reconnecting" &&
        player.reconnectGraceEndsAt !== null &&
        player.reconnectGraceEndsAt <= now
      ) {
        player.presence = "offline";
        player.connected = false;
        player.reconnectGraceEndsAt = null;
        player.lastSeenAt = now;
        mutated = true;
      }
    }

    return mutated;
  }
}
