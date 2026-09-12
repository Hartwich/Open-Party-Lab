import type { AvailableGameDto, PublicGamePhase } from "./gameState.js";
import type { HostControlSnapshot } from "./hostControl.js";
import type { ThemeName } from "@open-party-lab/ui-kit";
import type { SupportedLanguage } from "@open-party-lab/game-core";
import type { PlayerSnapshot } from "./player.js";

/** Shared warning/extension window for the hosted room lifetime. */
export const ROOM_EXTENSION_WINDOW_MS = 5 * 60_000;

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
  /** Server-authoritative time at which the room will be closed. */
  expiresAt: number;
  joinUrl: string;
  language: SupportedLanguage;
  /** Skin every screen in this room uses. Set from the host settings. */
  theme: ThemeName;
  hostConnected: boolean;
  /** Who is currently allowed to drive the room. */
  hostControl: HostControlSnapshot;
  lifecycle: RoomLifecycle;
  /**
   * The round is held: the simulation and every phase timer stand still.
   *
   * Set while whoever drives the room has the host menu open. Null while the
   * round runs; carries the player who paused when a phone did it, so the
   * screen can say whose menu everyone is waiting on.
   */
  pausedBy?: { playerId: string | null; playerName: string | null } | null;
  selectedGameId: string | null;
  selectedGameSettings?: Record<string, string | number | boolean>;
  availableGames: AvailableGameDto[];
  players: PlayerSnapshot[];
  currentRound: RoundSummary | null;
}

/** True while the round is held, whoever did it. */
export function isRoomPaused(
  room: Pick<RoomSnapshot, "pausedBy"> | null | undefined
): boolean {
  return Boolean(room?.pausedBy);
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
