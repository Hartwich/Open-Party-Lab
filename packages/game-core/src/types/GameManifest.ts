import type { ControllerLayoutKey } from "../layouts/ControllerLayoutKey.js";
import type { RoundPhaseTimings } from "../state/RoundPhaseTimings.js";
import type {
  GameAudioDefinition,
  GameBroadcastPolicy,
  GameControllerChromeOptions,
  GameHostChromeOptions,
  GameVisualDefinition,
  HostOwnedScreen
} from "./GameHostContract.js";

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
  portraitPathBySetting?: {
    settingKey: string;
    values: Readonly<Record<string, string>>;
  };
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

  /**
   * Lifecycle screens this game renders itself. The platform keeps the game's
   * own host scene mounted for every screen listed here instead of switching
   * to a generic one.
   */
  ownsScreens?: readonly HostOwnedScreen[];
  /** Platform chrome this game wants suppressed on the shared screen. */
  hostChrome?: GameHostChromeOptions;
  /** Platform chrome this game wants suppressed on the phone. */
  controllerChrome?: GameControllerChromeOptions;
  /** Catalog card appearance. */
  visual?: GameVisualDefinition;
  /** Background music profile. */
  audio?: GameAudioDefinition;
  /** State broadcast tuning. */
  broadcast?: GameBroadcastPolicy;
}

/** True when the game renders the given lifecycle screen itself. */
export function ownsHostScreen(
  manifest: Pick<GameManifest, "ownsScreens"> | undefined | null,
  screen: HostOwnedScreen
): boolean {
  return Boolean(manifest?.ownsScreens?.includes(screen));
}
