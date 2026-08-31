import type { ScoreEntry, SupportedLanguage } from "@open-party-lab/game-core";
import type { PlayerSetupValue, PublicGamePhase } from "@open-party-lab/protocol";
import type { ThemeName } from "@open-party-lab/ui-kit";
import { MemoryStore } from "../persistence/memoryStore.js";

export type PlayerPresenceState = "online" | "reconnecting" | "offline";

export interface PlayerRecord {
  id: string;
  deviceId: string;
  name: string;
  color: string;
  selectedCharacterId: string | null;
  setupSelectionsByGameId: Record<string, Record<string, PlayerSetupValue>>;
  score: number;
  isReady: boolean;
  connected: boolean;
  presence: PlayerPresenceState;
  socketId: string | null;
  reconnectToken: string;
  joinedAt: number;
  lastSeenAt: number;
  reconnectGraceEndsAt: number | null;
}

export interface RoundRecord {
  gameId: string;
  roundNumber: number;
  phase: PublicGamePhase;
  startedAt: number | null;
  phaseStartedAt: number;
  phaseEndsAt: number | null;
  updatedAt: number;
  message?: string;
  state: unknown;
  scoreEntries: ScoreEntry[];
  scoreCommittedAt: number | null;
}

/**
 * Remote host control state.
 *
 * Keyed by player id, not socket id, so a phone that reconnects keeps the
 * permission it was granted.
 */
export interface HostControlRecord {
  holderPlayerId: string | null;
  pendingRequest: { playerId: string; requestedAt: number } | null;
}

export interface RoomRecord {
  code: string;
  createdAt: number;
  lastActivityAt: number;
  joinUrl: string;
  language: SupportedLanguage;
  theme: ThemeName;
  hostName: string;
  hostSocketId: string | null;
  hostControl: HostControlRecord;
  selectedGameId: string | null;
  gameSettingsByGameId: Record<string, Record<string, unknown>>;
  roundCounter: number;
  players: Map<string, PlayerRecord>;
  currentRound: RoundRecord | null;
}

export class RoomStore {
  private readonly rooms = new MemoryStore<RoomRecord>();

  create(room: RoomRecord): RoomRecord {
    return this.rooms.set(room.code, room);
  }

  get(roomCode: string): RoomRecord | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  has(roomCode: string): boolean {
    return this.rooms.has(roomCode.toUpperCase());
  }

  delete(roomCode: string): boolean {
    return this.rooms.delete(roomCode.toUpperCase());
  }

  values(): RoomRecord[] {
    return this.rooms.values();
  }

  first(): RoomRecord | undefined {
    return this.values()[0];
  }

  findByHostSocketId(socketId: string): RoomRecord | undefined {
    return this.values().find((room) => room.hostSocketId === socketId);
  }
}
