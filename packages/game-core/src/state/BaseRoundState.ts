import type { RoundPhase } from "./RoundPhase.js";

export interface BaseRoundState {
  phase: RoundPhase;
  startedAt: number | null;
  phaseStartedAt: number;
  phaseEndsAt: number | null;
  updatedAt: number;
  message?: string;
}
