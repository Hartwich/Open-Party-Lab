import { logger } from "../core/logger/logger.js";
import type { StateBroadcaster } from "../game-engine/stateBroadcaster.js";
import type { SocketSessionStore } from "../network/socket/socketSessionStore.js";
import type { RoomManager } from "./roomManager.js";
import type { RoomStore } from "./roomStore.js";

export class RoomCleanupService {
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(
    private readonly roomStore: RoomStore,
    private readonly roomManager: RoomManager,
    private readonly sessionStore: SocketSessionStore,
    private readonly stateBroadcaster: StateBroadcaster,
    private readonly getNow: () => number,
    private readonly inactivityTimeoutMs: number,
    private readonly cleanupIntervalMs: number
  ) {}

  start(): void {
    if (this.intervalHandle) return;

    this.intervalHandle = setInterval(() => this.removeInactiveRooms(), this.cleanupIntervalMs);
    logger.info("Room inactivity cleanup started.", {
      inactivityTimeoutMs: this.inactivityTimeoutMs,
      cleanupIntervalMs: this.cleanupIntervalMs
    });
  }

  stop(): void {
    if (!this.intervalHandle) return;
    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
  }

  removeInactiveRooms(): string[] {
    const cutoff = this.getNow() - this.inactivityTimeoutMs;
    const removedRoomCodes: string[] = [];

    for (const room of this.roomStore.values()) {
      const hasConnectedPlayer = [...room.players.values()].some((player) => player.connected);

      if (room.hostSocketId || hasConnectedPlayer || room.lastActivityAt > cutoff) continue;
      if (!this.roomManager.deleteRoom(room.code)) continue;

      this.sessionStore.removeByRoomCode(room.code);
      this.stateBroadcaster.clearGameStateCache(room.code);
      removedRoomCodes.push(room.code);
    }

    if (removedRoomCodes.length > 0) {
      logger.info("Removed inactive rooms.", { roomCodes: removedRoomCodes });
    }

    return removedRoomCodes;
  }
}
