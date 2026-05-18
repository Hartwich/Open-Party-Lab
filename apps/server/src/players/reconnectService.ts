import { createId } from "../core/ids/createId.js";
import { SocketSessionStore } from "../network/socket/socketSessionStore.js";
import type { PlayerRecord } from "../rooms/roomStore.js";

export class ReconnectService {
  constructor(
    private readonly sessionStore: SocketSessionStore,
    private readonly getNow: () => number
  ) {}

  createReconnectToken(): string {
    return createId("reconnect");
  }

  bindPlayer(player: PlayerRecord, roomCode: string, socketId: string): void {
    this.sessionStore.upsert({
      reconnectToken: player.reconnectToken,
      roomCode,
      playerId: player.id,
      deviceId: player.deviceId,
      socketId,
      updatedAt: this.getNow()
    });
  }

  attachSocket(reconnectToken: string, socketId: string): void {
    this.sessionStore.attachSocket(reconnectToken, socketId, this.getNow());
  }

  detachSocket(socketId: string): void {
    this.sessionStore.detachBySocket(socketId, this.getNow());
  }

  removeReconnectToken(reconnectToken: string): void {
    this.sessionStore.delete(reconnectToken);
  }

  removePlayerSession(roomCode: string, playerId: string): void {
    this.sessionStore.removeByPlayerId(roomCode, playerId);
  }

  getSession(reconnectToken: string) {
    return this.sessionStore.get(reconnectToken);
  }
}
