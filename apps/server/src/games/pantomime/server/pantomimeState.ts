import type { BaseRoundState, PlayerInput } from "@open-party-lab/game-core";

export interface PantomimeInput extends PlayerInput {
  type: "noop";
}

export interface PantomimeState extends BaseRoundState {
  actorPlayerId?: string;
  actorName?: string;
  secretTerm?: string;
  finishAt: number | null;
}
