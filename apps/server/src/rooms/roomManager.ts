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

  ensurePrimaryRoom(hostName: string, language: SupportedLanguage = defaultLanguage): RoomRecord {
    const existingRoom = this.roomStore.first();

    if (existingRoom) {
      if (hostName.trim()) {
        existingRoom.hostName = hostName.trim();
      }

      existingRoom.language = normalizeLanguage(language, existingRoom.language);

      return existingRoom;
    }

    const fixedCode = this.fixedPrimaryRoomCode?.trim().toUpperCase() ?? null;
    const code =
      fixedCode && !this.roomStore.has(fixedCode)
        ? fixedCode
        : createRoomCode((candidate) => this.roomStore.has(candidate));

    return this.roomStore.create({
      code,
      createdAt: this.getNow(),
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

  attachHostSocket(room: RoomRecord, socketId: string, hostName: string): string | null {
    const previousHostSocketId =
      room.hostSocketId && room.hostSocketId !== socketId ? room.hostSocketId : null;

    room.hostSocketId = socketId;

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
    return true;
  }
}
