import type { BaseRoundState } from "@open-party-lab/game-core";
import type {
  LightTrailsCollisionReason,
  LightTrailsInput,
  LightTrailsTrailSegment,
  LightTrailsState as LightTrailsPublicState,
  LightTrailsTurnInput
} from "@open-party-lab/protocol";

export type { LightTrailsInput };

export interface LightTrailsRuntimePlayerState {
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
  leftPressed: boolean;
  rightPressed: boolean;
  gapTicksRemaining: number;
  nextGapAtTick: number;
  rngState: number;
  eliminatedAt?: number;
  collisionReason?: LightTrailsCollisionReason;
}

export interface LightTrailsRuntimeState
  extends BaseRoundState,
    Omit<LightTrailsPublicState, "players"> {
  players: Record<string, LightTrailsRuntimePlayerState>;
  occupiedCells: Record<number, string>;
}
