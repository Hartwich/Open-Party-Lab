import { defaultLanguage, normalizeLanguage, type SupportedLanguage } from "@open-party-lab/game-core";
import { hostControlHandoverMs } from "@open-party-lab/protocol";
import { defaultThemeName, normalizeThemeName, type ThemeName } from "@open-party-lab/ui-kit";
import { createRoomCode } from "./roomCode.js";
import type { RoomRecord } from "./roomStore.js";
import { RoomStore } from "./roomStore.js";

export class RoomManager {
  constructor(
    private readonly roomStore: RoomStore,
    private readonly createJoinUrl: (roomCode: string) => string,
    private readonly getNow: () => number,
    private readonly fixedPrimaryRoomCode: string | null = null,
    private readonly maxLifetimeMs = 3_600_000
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
      expiresAt: createdAt + this.maxLifetimeMs,
      lastActivityAt: createdAt,
      joinUrl: this.createJoinUrl(code),
      language: normalizeLanguage(language),
      theme: defaultThemeName,
      hostName,
      hostSocketId: null,
      hostControl: { holderPlayerId: null, pendingRequest: null },
      clock: { pausedAt: null, pausedTotalMs: 0, pausedByPlayerId: null },
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
   * Asks for the host controls.
   *
   * Returns "granted" when the controls were free — nobody is displaced, so
   * there is nothing to ask. Returns "pending" when another player holds them:
   * that player gets `hostControlHandoverMs` to answer, and the handover goes
   * through by itself if they do not. A newer request replaces an older one.
   */
  requestHostControl(room: RoomRecord, playerId: string): "granted" | "pending" {
    const holder = room.hostControl.holderPlayerId;

    if (!holder || holder === playerId || !room.players.has(holder)) {
      room.hostControl.holderPlayerId = playerId;
      room.hostControl.pendingRequest = null;
      this.touch(room);
      return "granted";
    }

    const requestedAt = this.getNow();
    room.hostControl.pendingRequest = {
      playerId,
      requestedAt,
      expiresAt: requestedAt + hostControlHandoverMs
    };
    this.touch(room);
    return "pending";
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

  /**
   * Completes a handover whose deadline has passed.
   *
   * Silence is consent here on purpose: the alternative is a room that nobody
   * can drive because the previous holder walked away with the phone in their
   * pocket. Returns true when something changed and the room must be rebroadcast.
   */
  expireHostControlRequest(room: RoomRecord): boolean {
    const pending = room.hostControl.pendingRequest;

    if (!pending || this.getNow() < pending.expiresAt) {
      return false;
    }

    room.hostControl.pendingRequest = null;
    room.hostControl.holderPlayerId = room.players.has(pending.playerId)
      ? pending.playerId
      : null;
    this.touch(room);
    return true;
  }

  /** Hands control back to the shared screen. */
  releaseHostControl(room: RoomRecord): void {
    this.releasePauseHeldBy(room, room.hostControl.holderPlayerId);
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

    // The phone that froze the round is the only one that can unfreeze it, so
    // a player who walks out with the menu open would leave everyone else
    // staring at a still image.
    changed = this.releasePauseHeldBy(room, playerId) || changed;

    return changed;
  }

  /**
   * Resumes the round when the player who paused it is no longer in a position
   * to resume it themselves. Returns true when it actually unfroze something.
   */
  private releasePauseHeldBy(room: RoomRecord, playerId: string | null): boolean {
    if (playerId === null || room.clock.pausedByPlayerId !== playerId) {
      return false;
    }

    return this.resumeRoom(room);
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

  /** True while the round is held. */
  isPaused(room: RoomRecord): boolean {
    return room.clock.pausedAt !== null;
  }

  /**
   * The clock a game sees.
   *
   * Wall time minus everything this room has spent paused, so timestamps a game
   * stored before a pause stay comparable with the ones it reads after.
   */
  roomNow(room: RoomRecord): number {
    const wall = this.getNow();
    const running = room.clock.pausedAt === null ? 0 : wall - room.clock.pausedAt;
    return wall - room.clock.pausedTotalMs - running;
  }

  /** Returns false when the round was already paused, so callers skip the broadcast. */
  pauseRoom(room: RoomRecord, playerId: string | null): boolean {
    if (room.clock.pausedAt !== null) {
      return false;
    }

    room.clock.pausedAt = this.getNow();
    room.clock.pausedByPlayerId = playerId;
    this.touch(room);
    return true;
  }

  /** Returns false when the round was already running. */
  resumeRoom(room: RoomRecord): boolean {
    if (room.clock.pausedAt === null) {
      return false;
    }

    room.clock.pausedTotalMs += this.getNow() - room.clock.pausedAt;
    room.clock.pausedAt = null;
    room.clock.pausedByPlayerId = null;
    this.touch(room);
    return true;
  }

  /**
   * Clears the pause when a round ends.
   *
   * The accumulated offset stays: it belongs to the room's clock, not to the
   * round, and resetting it would jump every timestamp a following round
   * inherits.
   */
  clearPause(room: RoomRecord): void {
    if (room.clock.pausedAt !== null) {
      room.clock.pausedTotalMs += this.getNow() - room.clock.pausedAt;
      room.clock.pausedAt = null;
      room.clock.pausedByPlayerId = null;
    }
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
