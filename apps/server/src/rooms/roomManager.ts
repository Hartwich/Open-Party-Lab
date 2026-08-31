import { defaultLanguage, normalizeLanguage, type SupportedLanguage } from "@open-party-lab/game-core";
import { defaultThemeName, normalizeThemeName, type ThemeName } from "@open-party-lab/ui-kit";
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
      theme: defaultThemeName,
      hostName,
      hostSocketId: null,
      hostControl: { holderPlayerId: null, pendingRequest: null },
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

  /**
   * Records a takeover request. A newer request replaces an older pending one,
   * so a forgotten prompt on the shared screen cannot block the room.
   */
  requestHostControl(room: RoomRecord, playerId: string): void {
    room.hostControl.pendingRequest = { playerId, requestedAt: this.getNow() };
    this.touch(room);
  }

  /**
   * Answers the pending request. Returns false when the request no longer
   * matches — e.g. the player left, or a newer request arrived meanwhile.
   */
  resolveHostControl(room: RoomRecord, playerId: string, grant: boolean): boolean {
    if (room.hostControl.pendingRequest?.playerId !== playerId) {
      return false;
    }

    room.hostControl.pendingRequest = null;

    if (grant) {
      room.hostControl.holderPlayerId = room.players.has(playerId) ? playerId : null;
    }

    this.touch(room);
    return true;
  }

  /** Hands control back to the shared screen. */
  releaseHostControl(room: RoomRecord): void {
    room.hostControl.holderPlayerId = null;
    room.hostControl.pendingRequest = null;
    this.touch(room);
  }

  /**
   * Drops any control or pending request belonging to a player who left.
   * Returns true when something changed and the room must be rebroadcast.
   */
  forgetHostControlForPlayer(room: RoomRecord, playerId: string): boolean {
    let changed = false;

    if (room.hostControl.holderPlayerId === playerId) {
      room.hostControl.holderPlayerId = null;
      changed = true;
    }

    if (room.hostControl.pendingRequest?.playerId === playerId) {
      room.hostControl.pendingRequest = null;
      changed = true;
    }

    return changed;
  }

  /**
   * The holder must still be in the room. Cleanup paths that drop a player
   * record without going through `forgetHostControlForPlayer` would otherwise
   * leave a stale id that still authorises actions.
   */
  hasHostControl(room: RoomRecord, playerId: string | undefined): boolean {
    if (!playerId || room.hostControl.holderPlayerId !== playerId) {
      return false;
    }

    return room.players.has(playerId);
  }

  setTheme(room: RoomRecord, theme: unknown): RoomRecord {
    room.theme = normalizeThemeName(theme);
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
