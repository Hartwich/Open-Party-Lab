import type { ControllerLayoutKey, GameManifest, RoundPhase } from "@open-party-lab/game-core";

export type PublicGamePhase = RoundPhase;

export interface AvailableGameDto {
  id: string;
  displayName: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  hostView: string;
  controllerView: string;
  controllerLayout: ControllerLayoutKey;
  supportsTeams: boolean;
  estimatedRoundDurationMs: number;
  roundCompletionMode?: GameManifest["roundCompletionMode"];
}

export interface GameStateEnvelope<TState = unknown> {
  gameId: string;
  roundNumber: number;
  phase: PublicGamePhase;
  phaseStartedAt: number;
  phaseEndsAt: number | null;
  state: TState;
  updatedAt: number;
  message?: string;
}
