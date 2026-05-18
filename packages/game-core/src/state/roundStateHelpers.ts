import type { BaseRoundState } from "./BaseRoundState.js";
import type { RoundPhase } from "./RoundPhase.js";

export interface RoundStateTransitionOptions {
  durationMs?: number | null;
  message?: string;
  startedAt?: number | null;
}

export function createBaseRoundState(
  phase: RoundPhase,
  now: number,
  options: RoundStateTransitionOptions = {}
): BaseRoundState {
  const durationMs = options.durationMs ?? null;
  const phaseEndsAt = durationMs === null ? null : now + durationMs;

  return {
    phase,
    startedAt: options.startedAt ?? null,
    phaseStartedAt: now,
    phaseEndsAt,
    updatedAt: now,
    message: options.message
  };
}

export function transitionRoundState<TState extends BaseRoundState>(
  state: TState,
  phase: RoundPhase,
  now: number,
  options: RoundStateTransitionOptions = {}
): TState {
  const durationMs = options.durationMs ?? null;
  const phaseEndsAt = durationMs === null ? null : now + durationMs;

  return {
    ...state,
    phase,
    startedAt: options.startedAt === undefined ? state.startedAt : options.startedAt,
    phaseStartedAt: now,
    phaseEndsAt,
    updatedAt: now,
    message: options.message ?? state.message
  };
}
