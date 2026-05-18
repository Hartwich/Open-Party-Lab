import type { BaseRoundState, PlayerInput } from "@open-party-lab/game-core";

export interface TapRaceInput extends PlayerInput {
  type: "tap";
  pressedAt: number;
}

export interface TapRaceState extends BaseRoundState {
  targetTaps: number;
  finishAt: number | null;
  tapsByPlayer: Record<string, number>;
  leadingPlayerId?: string;
  winnerPlayerId?: string;
  winnerName?: string;
  winningTapCount?: number;
}
