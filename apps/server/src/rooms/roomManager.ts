import { defaultLanguage, normalizeLanguage, type SupportedLanguage } from "@open-party-lab/game-core";
import { createRoomCode } from "./roomCode.js";
import type { RoomRecord } from "./roomStore.js";
import { RoomStore } from "./roomStore.js";

export class RoomManager {
  constructor(
    private readonly roomStore: RoomStore,
    private readonly createJoinUrl: (roomCode: string) => string,
    private readonly getNow: () => number,
    private readonly fixedPrimaryRoomCode: string | null = null
  ) {}

  createRoom(hostName: string, language: SupportedLanguage = defaultLanguage): RoomRecord {
    const fixedCode = this.fixedPrimaryRoomCode?.trim().toUpperCase() ?? null;
    const code =
      fixedCode && !this.roomStore.has(fixedCode)
        ? fixedCode
        : createRoomCode((candidate) => this.roomStore.has(candidate));

    const createdAt = this.getNow();

    return this.roomStore.create({
      code,
      createdAt,
      lastActivityAt: createdAt,
      joinUrl: this.createJoinUrl(code),
      language: normalizeLanguage(language),
      hostName,
      hostSocketId: null,
      selectedGameId: null,
      gameSettingsByGameId: {},
      roundCounter: 0,
      players: new Map(),
      currentRound: null
    });
  }

  touch(room: RoomRecord): void {
    room.lastActivityAt = this.getNow();
  }

  deleteRoom(roomCode: string): boolean {
    return this.roomStore.delete(roomCode);
  }

  attachHostSocket(room: RoomRecord, socketId: string, hostName: string): string | null {
    const previousHostSocketId =
      room.hostSocketId && room.hostSocketId !== socketId ? room.hostSocketId : null;

    room.hostSocketId = socketId;
    this.touch(room);

    if (hostName.trim()) {
      room.hostName = hostName.trim();
    }

    return previousHostSocketId;
  }

  getRoom(roomCode: string): RoomRecord | undefined {
    return this.roomStore.get(roomCode);
  }

  getPrimaryRoom(): RoomRecord | undefined {
    return this.roomStore.first();
  }

  findByHostSocketId(socketId: string): RoomRecord | undefined {
    return this.roomStore.findByHostSocketId(socketId);
  }

  setHostSocket(room: RoomRecord, socketId: string | null): RoomRecord {
    room.hostSocketId = socketId;
    this.touch(room);
    return room;
  }

  setLanguage(room: RoomRecord, language: SupportedLanguage): RoomRecord {
    room.language = normalizeLanguage(language, room.language);
    return room;
  }

  clearHostSocket(room: RoomRecord, socketId: string): boolean {
    if (room.hostSocketId !== socketId) {
      return false;
    }

    room.hostSocketId = null;
    this.touch(room);
    return true;
  }
}
