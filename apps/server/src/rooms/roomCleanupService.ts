import { logger } from "../core/logger/logger.js";
import type {
  ClientToServerEvents,
  InterServerEvents,
  RoomClosedReason,
  ServerToClientEvents,
  SocketData
} from "@open-party-lab/protocol";
import type { StateBroadcaster } from "../game-engine/stateBroadcaster.js";
import type { SocketSessionStore } from "../network/socket/socketSessionStore.js";
import type { RoomManager } from "./roomManager.js";
import type { RoomRecord, RoomStore } from "./roomStore.js";

type IoServer = import("socket.io").Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type RoomCapacityResult =
  | { ok: true; evictedRoomCode?: string }
  | { ok: false };

export class RoomCleanupService {
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(
    private readonly roomStore: RoomStore,
    private readonly roomManager: RoomManager,
    private readonly sessionStore: SocketSessionStore,
    private readonly stateBroadcaster: StateBroadcaster,
    private readonly io: IoServer,
    private readonly getNow: () => number,
    private readonly inactivityTimeoutMs: number,
    private readonly cleanupIntervalMs: number,
    private readonly maxLifetimeMs: number,
    private readonly maxRoomCount: number
  ) {}

  start(): void {
    if (this.intervalHandle) return;

    this.intervalHandle = setInterval(() => this.removeInactiveRooms(), this.cleanupIntervalMs);
    logger.info("Room inactivity cleanup started.", {
      inactivityTimeoutMs: this.inactivityTimeoutMs,
      cleanupIntervalMs: this.cleanupIntervalMs,
      maxLifetimeMs: this.maxLifetimeMs,
      maxRoomCount: this.maxRoomCount
    });
  }

  stop(): void {
    if (!this.intervalHandle) return;
    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
  }

  prepareForRoomCreation(): RoomCapacityResult {
    this.removeInactiveRooms();
    const rooms = this.roomStore.values();

    if (rooms.length < this.maxRoomCount) return { ok: true };

    const evictionCandidate = rooms
      .filter((room) => ![...room.players.values()].some((player) => player.connected))
      .sort((left, right) => left.lastActivityAt - right.lastActivityAt)[0];

    if (!evictionCandidate) return { ok: false };

    this.closeRoom(evictionCandidate, "capacity");
    return { ok: true, evictedRoomCode: evictionCandidate.code };
  }

  getMaxRoomCount(): number {
    return this.maxRoomCount;
  }

  removeInactiveRooms(): string[] {
    const cutoff = this.getNow() - this.inactivityTimeoutMs;
    const lifetimeCutoff = this.getNow() - this.maxLifetimeMs;
    const removedRoomCodes: string[] = [];

    for (const room of this.roomStore.values()) {
      if (room.createdAt <= lifetimeCutoff) {
        this.closeRoom(room, "expired");
        removedRoomCodes.push(room.code);
        continue;
      }

      const hasConnectedPlayer = [...room.players.values()].some((player) => player.connected);

      if (room.hostSocketId || hasConnectedPlayer || room.lastActivityAt > cutoff) continue;
      this.closeRoom(room, "inactive");
      removedRoomCodes.push(room.code);
    }

    if (removedRoomCodes.length > 0) {
      logger.info("Removed inactive rooms.", { roomCodes: removedRoomCodes });
    }

    return removedRoomCodes;
  }

  private closeRoom(room: RoomRecord, reason: RoomClosedReason): void {
    const message = this.closeMessage(room.language === "en", reason);

    this.io.to(room.code).emit("room:closed", {
      roomCode: room.code,
      reason,
      message
    });
    const roomSocketIds = [...(this.io.sockets.adapter.rooms.get(room.code) ?? [])];

    for (const socketId of roomSocketIds) {
      const socket = this.io.sockets.sockets.get(socketId);

      if (!socket) continue;
      socket.leave(room.code);
      delete socket.data.role;
      delete socket.data.roomCode;
      delete socket.data.playerId;
    }

    this.roomManager.deleteRoom(room.code);
    this.sessionStore.removeByRoomCode(room.code);
    this.stateBroadcaster.clearGameStateCache(room.code);

    logger.info("Closed room.", { roomCode: room.code, reason });
  }

  private closeMessage(en: boolean, reason: RoomClosedReason): string {
    if (reason === "expired") {
      return en
        ? "This room reached its one-hour limit and was closed."
        : "Dieser Raum hat sein Ein-Stunden-Limit erreicht und wurde geschlossen.";
    }

    if (reason === "capacity") {
      return en
        ? "This room had no active players and was closed to make space for a new room."
        : "Dieser Raum hatte keine aktiven Spieler und wurde geschlossen, um Platz für einen neuen Raum zu schaffen.";
    }

    return en
      ? "This room was closed after ten minutes without activity."
      : "Dieser Raum wurde nach zehn Minuten ohne Aktivität geschlossen.";
  }
}
