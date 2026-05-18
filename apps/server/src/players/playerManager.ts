import {
  canManagePlayerRoster,
  type JoinRoomRequest,
  type PlayerSnapshot
} from "@open-party-lab/protocol";
import { createId } from "../core/ids/createId.js";
import { now } from "../core/time/now.js";
import { arenaSurvivorCharacterDefinitionsById } from "../games/arena-survivor/server/definitions/characterDefinitions.js";
import type { PlayerRecord, RoomRecord } from "../rooms/roomStore.js";
import { PlayerPresenceTracker } from "./playerPresenceTracker.js";
import { PlayerStore } from "./playerStore.js";
import { ReconnectService } from "./reconnectService.js";

const playerColors = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#0ea5e9",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#14b8a6"
];

export interface JoinPlayerResult {
  player: PlayerRecord;
  resumed: boolean;
}

export interface RemovePlayerResult {
  player: PlayerRecord;
  socketId: string | null;
}

export interface RemovePlayerError {
  error: string;
}

export type RemovePlayerOutcome = RemovePlayerResult | RemovePlayerError;

export class PlayerManager {
  constructor(
    private readonly playerStore: PlayerStore,
    private readonly presenceTracker: PlayerPresenceTracker,
    private readonly reconnectService: ReconnectService,
    private readonly getNow: () => number = now
  ) {}

  joinPlayer(room: RoomRecord, request: JoinRoomRequest, socketId: string): JoinPlayerResult {
    const existingPlayer = this.playerStore.findByDeviceId(room, request.deviceId);

    if (existingPlayer) {
      if (request.playerName.trim()) {
        existingPlayer.name = request.playerName.trim();
      }

      this.presenceTracker.markConnected(existingPlayer, socketId);
      this.reconnectService.bindPlayer(existingPlayer, room.code, socketId);

      return {
        player: existingPlayer,
        resumed: true
      };
    }

    const player = this.playerStore.add(room, {
      id: createId("player"),
      deviceId: request.deviceId,
      name: request.playerName.trim(),
      color: request.preferredColor ?? this.pickColor(room),
      selectedCharacterId: null,
      score: 0,
      isReady: false,
      connected: true,
      presence: "online",
      socketId,
      reconnectToken: this.reconnectService.createReconnectToken(),
      joinedAt: this.getNow(),
      lastSeenAt: this.getNow(),
      reconnectGraceEndsAt: null
    });

    this.reconnectService.bindPlayer(player, room.code, socketId);

    return {
      player,
      resumed: false
    };
  }

  resumePlayer(
    room: RoomRecord,
    reconnectToken: string,
    deviceId: string,
    socketId: string
  ): PlayerRecord | null {
    const player = this.playerStore.findByReconnectToken(room, reconnectToken);

    if (!player || player.reconnectToken !== reconnectToken || player.deviceId !== deviceId) {
      return null;
    }

    this.presenceTracker.markConnected(player, socketId);
    this.reconnectService.attachSocket(reconnectToken, socketId);
    return player;
  }

  setReady(room: RoomRecord, playerId: string, isReady: boolean): PlayerRecord | null {
    const player = this.playerStore.get(room, playerId);

    if (!player) {
      return null;
    }

    player.isReady = isReady;
    return player;
  }

  setSelectedCharacter(room: RoomRecord, playerId: string, characterId: string): PlayerRecord | null {
    const player = this.playerStore.get(room, playerId);

    if (!player || !arenaSurvivorCharacterDefinitionsById[characterId]) {
      return null;
    }

    player.selectedCharacterId = characterId;
    return player;
  }

  setAllReady(room: RoomRecord, isReady: boolean): boolean {
    let changed = false;

    for (const player of room.players.values()) {
      if (player.isReady === isReady) {
        continue;
      }

      player.isReady = isReady;
      changed = true;
    }

    return changed;
  }

  disconnectPlayer(room: RoomRecord, socketId: string): PlayerRecord | null {
    const player = this.playerStore.findBySocket(room, socketId);

    if (!player) {
      return null;
    }

    this.presenceTracker.markDisconnected(player);
    this.reconnectService.detachSocket(socketId);
    return player;
  }

  removePlayer(room: RoomRecord, playerId: string): RemovePlayerOutcome {
    if (!canManagePlayerRoster(room)) {
      return {
        error: room.language === "en"
          ? "Players can only be removed while no active round is running."
          : "Spieler koennen nur entfernt werden, solange keine aktive Runde laeuft."
      };
    }

    const player = this.playerStore.get(room, playerId);

    if (!player) {
      return {
        error: room.language === "en" ? "Player not found." : "Spieler nicht gefunden."
      };
    }

    const socketId = player.socketId;
    room.players.delete(player.id);
    this.reconnectService.removePlayerSession(room.code, player.id);

    if (socketId) {
      this.reconnectService.detachSocket(socketId);
    }

    return {
      player,
      socketId
    };
  }

  expireDisconnectedPlayers(room: RoomRecord): boolean {
    return this.presenceTracker.expireGraceWindows(room);
  }

  toSnapshot(player: PlayerRecord): PlayerSnapshot {
    const selectedCharacter = player.selectedCharacterId
      ? arenaSurvivorCharacterDefinitionsById[player.selectedCharacterId]
      : null;

    return {
      id: player.id,
      name: player.name,
      color: player.color,
      selectedCharacterId: player.selectedCharacterId,
      selectedCharacterName: selectedCharacter?.name ?? null,
      isReady: player.isReady,
      connected: player.connected,
      presence: player.presence,
      score: player.score,
      joinedAt: player.joinedAt,
      lastSeenAt: player.lastSeenAt,
      reconnectGraceEndsAt: player.reconnectGraceEndsAt
    };
  }

  private pickColor(room: RoomRecord): string {
    return playerColors[room.players.size % playerColors.length] ?? playerColors[0];
  }
}
