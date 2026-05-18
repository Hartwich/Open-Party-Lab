import type { RoundPhaseTimings } from "./RoundPhaseTimings.js";

export const roundPhaseDurations: RoundPhaseTimings = {
  roundIntroMs: 1_200,
  countdownMs: 2_000,
  lockedMs: 1_100,
  resultMs: 3_200,
  scoreboardMs: 3_600
};

export function resolveRoundPhaseTimings(
  overrides: Partial<RoundPhaseTimings> = {}
): RoundPhaseTimings {
  return {
    ...roundPhaseDurations,
    ...overrides
  };
}
