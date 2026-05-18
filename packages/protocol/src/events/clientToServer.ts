import type { SupportedLanguage } from "@open-party-lab/game-core";
import type { RoomSnapshot } from "../dto/room.js";
import type { PlayerSnapshot } from "../dto/player.js";

export interface OkResult<T> {
  ok: true;
  data: T;
}

export interface ErrorResult {
  ok: false;
  error: string;
}

export type AckResult<T> = OkResult<T> | ErrorResult;

export interface CreateRoomRequest {
  hostName?: string;
  language?: SupportedLanguage;
}

export interface JoinRoomRequest {
  roomCode: string;
  playerName: string;
  deviceId: string;
  preferredColor?: string;
}

export interface ResumeSessionRequest {
  reconnectToken: string;
  deviceId: string;
}

export interface PlayerReadyRequest {
  roomCode: string;
  playerId: string;
  isReady: boolean;
}

export interface PlayerSelectCharacterRequest {
  roomCode: string;
  playerId: string;
  characterId: string;
}

export interface GameSelectRequest {
  roomCode: string;
  gameId: string;
}

export interface GameHostActionRequest<TAction = unknown> {
  roomCode: string;
  gameId: string;
  action: TAction;
}

export interface GameInputRequest<TInput = unknown> {
  roomCode: string;
  playerId: string;
  input: TInput;
}

export interface RoundStartRequest {
  roomCode: string;
}

export interface RoundAbortRequest {
  roomCode: string;
}

export interface CreateRoomSuccess {
  room: RoomSnapshot;
}

export interface JoinRoomSuccess {
  room: RoomSnapshot;
  player: PlayerSnapshot;
  reconnectToken: string;
}

export interface ResumeSessionSuccess {
  room: RoomSnapshot;
  player: PlayerSnapshot;
  reconnectToken: string;
}

export interface LeaveRoomRequest {
  roomCode: string;
}

export interface LeaveRoomSuccess {
  room: RoomSnapshot;
}

export interface KickPlayerRequest {
  roomCode: string;
  playerId: string;
}

export interface KickPlayerSuccess {
  room: RoomSnapshot;
}

export interface RoundAbortSuccess {
  room: RoomSnapshot;
}

export interface RoomLanguageRequest {
  roomCode: string;
  language: SupportedLanguage;
}

export interface RoomLanguageSuccess {
  room: RoomSnapshot;
}

export interface ClientToServerEvents {
  "room:create": (
    payload: CreateRoomRequest,
    ack: (result: AckResult<CreateRoomSuccess>) => void
  ) => void;
  "room:join": (
    payload: JoinRoomRequest,
    ack: (result: AckResult<JoinRoomSuccess>) => void
  ) => void;
  "session:resume": (
    payload: ResumeSessionRequest,
    ack: (result: AckResult<ResumeSessionSuccess>) => void
  ) => void;
  "room:leave": (
    payload: LeaveRoomRequest,
    ack: (result: AckResult<LeaveRoomSuccess>) => void
  ) => void;
  "player:kick": (
    payload: KickPlayerRequest,
    ack: (result: AckResult<KickPlayerSuccess>) => void
  ) => void;
  "room:set-language": (
    payload: RoomLanguageRequest,
    ack: (result: AckResult<RoomLanguageSuccess>) => void
  ) => void;
  "player:ready": (payload: PlayerReadyRequest) => void;
  "player:select-character": (payload: PlayerSelectCharacterRequest) => void;
  "game:select": (payload: GameSelectRequest) => void;
  "game:host-action": (payload: GameHostActionRequest) => void;
  "game:input": (payload: GameInputRequest) => void;
  "round:start": (payload: RoundStartRequest) => void;
  "round:abort": (
    payload: RoundAbortRequest,
    ack: (result: AckResult<RoundAbortSuccess>) => void
  ) => void;
}
