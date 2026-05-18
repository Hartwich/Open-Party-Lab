import type { PlayerInput } from "@open-party-lab/game-core";

export type LightTrailsTurnDirection = "left" | "right";
export type LightTrailsTurnInput = -1 | 0 | 1;
export type LightTrailsCollisionReason = "wall" | "trail" | "head_clash" | "timeout";

export interface LightTrailsInput extends PlayerInput {
  type: "turn";
  direction: LightTrailsTurnDirection;
  active: boolean;
}

export interface LightTrailsTrailSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LightTrailsHostPatchPlayer {
  playerId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  angleRad: number;
  alive: boolean;
  turnInput: LightTrailsTurnInput;
  trailSegments: LightTrailsTrailSegment[];
  eliminatedAt?: number;
  collisionReason?: LightTrailsCollisionReason;
}

export interface LightTrailsPlayerState {
  playerId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  angleRad: number;
  alive: boolean;
  turnInput: LightTrailsTurnInput;
  trailCellIds: number[];
  trailSegments: LightTrailsTrailSegment[];
  eliminatedAt?: number;
  collisionReason?: LightTrailsCollisionReason;
}

export interface LightTrailsState {
  arenaWidth: number;
  arenaHeight: number;
  cellSize: number;
  trailThickness: number;
  tick: number;
  alivePlayerIds: string[];
  winnerPlayerId?: string;
  winnerName?: string;
  isDraw: boolean;
  finishAt: number | null;
  players: Record<string, LightTrailsPlayerState>;
}

export interface LightTrailsHostPatch {
  arenaWidth: number;
  arenaHeight: number;
  cellSize: number;
  trailThickness: number;
  tick: number;
  alivePlayerIds: string[];
  winnerPlayerId?: string;
  winnerName?: string;
  isDraw: boolean;
  finishAt: number | null;
  players: Record<string, LightTrailsHostPatchPlayer>;
}
