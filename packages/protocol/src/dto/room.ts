import type { AvailableGameDto, PublicGamePhase } from "./gameState.js";
import type { SupportedLanguage } from "@open-party-lab/game-core";
import type {
  ArenaSurvivorCharacterState,
  ArenaSurvivorLobbyState
} from "../games/arenaSurvivor.js";
import type { MinionsTdLobbyState } from "../games/minionsTd.js";
import type { ZeichnenUndErratenLobbyState } from "../games/zeichnenUndErraten.js";
import type { PlayerSnapshot } from "./player.js";

export type RoomLifecycle =
  | "lobby"
  | "game_selected"
  | "round_intro"
  | "countdown"
  | "playing"
  | "locked"
  | "result"
  | "scoreboard"
  | "finished";

export interface RoundSummary {
  gameId: string;
  roundNumber: number;
  phase: PublicGamePhase;
  startedAt: number | null;
  phaseStartedAt: number;
  phaseEndsAt: number | null;
  updatedAt: number;
  message?: string;
}

export interface RoomSnapshot {
  code: string;
  createdAt: number;
  joinUrl: string;
  language: SupportedLanguage;
  hostConnected: boolean;
  lifecycle: RoomLifecycle;
  selectedGameId: string | null;
  availableGames: AvailableGameDto[];
  players: PlayerSnapshot[];
  arenaSurvivorCharacterOptions?: ArenaSurvivorCharacterState[];
  arenaSurvivorLobby?: ArenaSurvivorLobbyState;
  minionsTdLobby?: MinionsTdLobbyState;
  zeichnenUndErratenLobby?: ZeichnenUndErratenLobbyState;
  currentRound: RoundSummary | null;
}

export type RoomPhase = RoomLifecycle | PublicGamePhase;

export interface RoomPhaseLike {
  phase: RoomPhase;
}

export interface RoomStateLike {
  lifecycle?: RoomLifecycle | null;
  currentRound?: RoomPhaseLike | null;
}

export function getRoomPhase(room: RoomStateLike | null | undefined): RoomPhase | null {
  return room?.currentRound?.phase ?? room?.lifecycle ?? null;
}

export function hasActiveRound(
  room: Pick<RoomStateLike, "currentRound"> | null | undefined
): boolean {
  return Boolean(room?.currentRound && room.currentRound.phase !== "finished");
}

export function canManagePlayerRoster(
  room: Pick<RoomStateLike, "currentRound"> | null | undefined
): boolean {
  return !hasActiveRound(room);
}
