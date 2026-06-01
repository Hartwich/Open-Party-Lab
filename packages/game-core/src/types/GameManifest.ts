import type { ControllerLayoutKey } from "../layouts/ControllerLayoutKey.js";
import type { RoundPhaseTimings } from "../state/RoundPhaseTimings.js";

export interface GameLobbySetupOption {
  id: string;
  label: string;
  description?: string;
}

interface GameLobbySetupFieldBase {
  id: string;
  label: string;
  description?: string;
  settingKey?: string;
  actionKey?: string;
}

export interface GameLobbySetupSelectField extends GameLobbySetupFieldBase {
  kind: "select";
  options: readonly GameLobbySetupOption[];
  defaultValue: string;
}

export interface GameLobbySetupNumberField extends GameLobbySetupFieldBase {
  kind: "number";
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export type GameLobbySetupField = GameLobbySetupSelectField | GameLobbySetupNumberField;

export interface GameLobbySetupDefinition {
  title?: string;
  description?: string;
  fields: readonly GameLobbySetupField[];
}

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
  lobbySetup?: GameLobbySetupDefinition;
}
