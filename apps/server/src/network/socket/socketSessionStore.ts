export interface SocketSessionRecord {
  reconnectToken: string;
  roomCode: string;
  playerId: string;
  deviceId: string;
  socketId: string | null;
  updatedAt: number;
}

export class SocketSessionStore {
  private readonly sessions = new Map<string, SocketSessionRecord>();

  upsert(record: SocketSessionRecord): SocketSessionRecord {
    this.sessions.set(record.reconnectToken, record);
    return record;
  }

  get(reconnectToken: string): SocketSessionRecord | undefined {
    return this.sessions.get(reconnectToken);
  }

  delete(reconnectToken: string): boolean {
    return this.sessions.delete(reconnectToken);
  }

  removeByPlayerId(roomCode: string, playerId: string): boolean {
    let removed = false;

    for (const [reconnectToken, session] of this.sessions.entries()) {
      if (session.roomCode === roomCode && session.playerId === playerId) {
        this.sessions.delete(reconnectToken);
        removed = true;
      }
    }

    return removed;
  }

  attachSocket(reconnectToken: string, socketId: string, updatedAt: number): void {
    const session = this.sessions.get(reconnectToken);

    if (!session) {
      return;
    }

    session.socketId = socketId;
    session.updatedAt = updatedAt;
  }

  detachBySocket(socketId: string, updatedAt: number): void {
    for (const session of this.sessions.values()) {
      if (session.socketId === socketId) {
        session.socketId = null;
        session.updatedAt = updatedAt;
      }
    }
  }
}
