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
  lobbySetup?: GameManifest["lobbySetup"];
  playerSetup?: GameManifest["playerSetup"];
  /** Lifecycle screens the game renders itself. */
  ownsScreens?: GameManifest["ownsScreens"];
  /** Platform chrome the game wants suppressed on the shared screen. */
  hostChrome?: GameManifest["hostChrome"];
  /** Platform chrome the game wants suppressed on the phone. */
  controllerChrome?: GameManifest["controllerChrome"];
  /** Catalog card appearance. */
  visual?: GameManifest["visual"];
  /** Background music profile. */
  audio?: GameManifest["audio"];
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
