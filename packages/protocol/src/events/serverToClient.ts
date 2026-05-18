import type { GameStateEnvelope, PublicGamePhase } from "../dto/gameState.js";
import type { PlayerSnapshot } from "../dto/player.js";
import type { RoomSnapshot } from "../dto/room.js";
import type { ScoreboardSnapshot } from "../dto/scoreboard.js";

export interface ServerHelloPayload {
  serverTime: number;
  recoveryEnabled: boolean;
}

export interface RoomStatePayload {
  room: RoomSnapshot;
}

export interface GameStatePayload<TState = unknown> {
  roomCode: string;
  game: GameStateEnvelope<TState>;
}

export interface GamePatchPayload<TPatch = unknown> {
  roomCode: string;
  gameId: string;
  roundNumber: number;
  phase: PublicGamePhase;
  updatedAt: number;
  message?: string;
  replace?: boolean;
  patch: TPatch;
}

export interface RoomErrorPayload {
  code: string;
  message: string;
}

export interface SessionResumedPayload {
  room: RoomSnapshot;
  player: PlayerSnapshot;
  reconnectToken: string;
}

export type SessionTerminationReason = "left" | "kicked";

export interface SessionTerminatedPayload {
  roomCode: string;
  playerId: string;
  reason: SessionTerminationReason;
  message: string;
}

export interface ServerToClientEvents {
  "server:hello": (payload: ServerHelloPayload) => void;
  "room:state": (payload: RoomStatePayload) => void;
  "game:state": (payload: GameStatePayload) => void;
  "game:patch": (payload: GamePatchPayload) => void;
  "scoreboard:state": (payload: ScoreboardSnapshot) => void;
  "room:error": (payload: RoomErrorPayload) => void;
  "session:resumed": (payload: SessionResumedPayload) => void;
  "session:terminated": (payload: SessionTerminatedPayload) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  role?: "host" | "controller";
  roomCode?: string;
  playerId?: string;
}
