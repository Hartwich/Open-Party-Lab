import type { ControllerLayoutKey } from "../layouts/ControllerLayoutKey.js";
import type { RoundPhaseTimings } from "../state/RoundPhaseTimings.js";

export interface GameManifest {
  id: string;
  displayName: string;
  description: string;
  listed?: boolean;
  minPlayers: number;
  maxPlayers: number;
  hostView: string;
  controllerView: string;
  controllerLayout: ControllerLayoutKey;
  supportsTeams: boolean;
  estimatedRoundDurationMs: number;
  phaseDurations?: Partial<RoundPhaseTimings>;
  roundCompletionMode?: "standard" | "wait_for_ready";
}
