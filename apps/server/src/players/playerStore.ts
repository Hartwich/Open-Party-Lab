import type { PlayerRecord, RoomRecord } from "../rooms/roomStore.js";

export class PlayerStore {
  add(room: RoomRecord, player: PlayerRecord): PlayerRecord {
    room.players.set(player.id, player);
    return player;
  }

  get(room: RoomRecord, playerId: string): PlayerRecord | undefined {
    return room.players.get(playerId);
  }

  list(room: RoomRecord): PlayerRecord[] {
    return [...room.players.values()];
  }

  findBySocket(room: RoomRecord, socketId: string): PlayerRecord | undefined {
    return this.list(room).find((player) => player.socketId === socketId);
  }

  findByDeviceId(room: RoomRecord, deviceId: string): PlayerRecord | undefined {
    return this.list(room).find((player) => player.deviceId === deviceId);
  }

  findByReconnectToken(room: RoomRecord, reconnectToken: string): PlayerRecord | undefined {
    return this.list(room).find((player) => player.reconnectToken === reconnectToken);
  }
}
