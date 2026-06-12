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
  confirmation?: {
    settingKey: string;
    actionType: string;
    label?: string;
    description?: string;
  };
}

export interface GamePlayerSetupOption {
  id: string;
  name: string;
  title?: string;
  archetype?: string;
  description?: string;
  iconPath?: string;
  portraitPath?: string;
  visual?: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
}

interface GamePlayerSetupDefinitionBase {
  title?: string;
  description?: string;
  required?: boolean;
  selectionKey?: string;
}

export interface GamePlayerSetupChoiceDefinition extends GamePlayerSetupDefinitionBase {
  kind: "choice";
  options: readonly GamePlayerSetupOption[];
}

export interface GamePlayerSetupMultiSelectDefinition extends GamePlayerSetupDefinitionBase {
  kind: "multi-select";
  selectionKey: string;
  minSelections: number;
  maxSelections: number;
  defaultValue?: readonly string[];
  readyBlockedLabel?: string;
  options: readonly GamePlayerSetupOption[];
}

export type GamePlayerSetupDefinition =
  | GamePlayerSetupChoiceDefinition
  | GamePlayerSetupMultiSelectDefinition;

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
  playerSetup?: GamePlayerSetupDefinition;
}
