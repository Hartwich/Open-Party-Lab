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
  /** Localized rules shown before starting the selected option. */
  rules?: Partial<Record<"de" | "en", readonly { title: string; lines: readonly string[] }[]>>;
}

/**
 * Sichtbarkeit eines Feldes, abhängig von einem anderen Feld.
 *
 * Manche Optionen ergeben nur für einen Teil eines Spiels Sinn - eine
 * Deckauswahl bei einem Regelwerk mit festem Blatt zum Beispiel. Statt sie
 * auszugrauen oder gar wirkungslos anzubieten, blendet die Lobby sie aus.
 */
export interface GameLobbySetupVisibility {
  /** `settingKey` (ersatzweise `id`) des Feldes, von dem die Sichtbarkeit abhängt. */
  field: string;
  /** Sichtbar, solange der Wert jenes Feldes einer dieser Optionen entspricht. */
  anyOf: readonly string[];
}

interface GameLobbySetupFieldBase {
  id: string;
  label: string;
  description?: string;
  settingKey?: string;
  actionKey?: string;
  /**
   * Überschrift, unter der verwandte Felder zusammen erscheinen.
   *
   * Zehn einzelne Hausregeln untereinander sind eine Wand; unter einer
   * Überschrift und nebeneinander sind sie eine Liste, die man überfliegt.
   * Felder ohne Gruppe stehen weiterhin für sich.
   */
  group?: string;
  /** Ohne Angabe immer sichtbar. */
  visibleWhen?: GameLobbySetupVisibility;
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

/**
 * Ein Schalter mit zwei Zuständen.
 *
 * Technisch eine Auswahl mit genau zwei Werten - aber als Häkchen gezeichnet
 * und nur eine Zeile hoch. Für alles, was schlicht an oder aus ist, statt zwei
 * nebeneinanderliegender Knöpfe, die dieselbe Frage umständlich stellen.
 */
export interface GameLobbySetupToggleField extends GameLobbySetupFieldBase {
  kind: "toggle";
  /** Wert im eingeschalteten Zustand. */
  onValue: string;
  /** Wert im ausgeschalteten Zustand. */
  offValue: string;
  defaultValue: string;
}

export type GameLobbySetupField =
  | GameLobbySetupSelectField
  | GameLobbySetupNumberField
  | GameLobbySetupToggleField;

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

/** Optional minimum-player override driven by a lobby setting. */
export interface GameMinPlayersBySetting {
  settingKey: string;
  values: Readonly<Record<string, number>>;
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
  minPlayersBySetting?: GameMinPlayersBySetting;
  maxPlayers: number;
  hostView: string;
  controllerView: string;
  controllerLayout: ControllerLayoutKey;
  supportsTeams: boolean;
  estimatedRoundDurationMs: number;
  phaseDurations?: Partial<RoundPhaseTimings>;
  roundCompletionMode?: "standard" | "wait_for_ready";
  /** Whether this game's points belong to the room total or only this game. */
  scoreScope?: "room" | "game";
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

export function resolveGameMinPlayers(
  manifest: Pick<GameManifest, "minPlayers" | "minPlayersBySetting">,
  settings: Readonly<Record<string, unknown>> | undefined
): number {
  const rule = manifest.minPlayersBySetting;
  const rawValue = rule && settings ? settings[rule.settingKey] : undefined;
  const override = rule && rawValue !== undefined ? rule.values[String(rawValue)] : undefined;

  return typeof override === "number" && Number.isFinite(override)
    ? Math.max(1, Math.round(override))
    : manifest.minPlayers;
}

function lobbyFieldKey(field: GameLobbySetupField): string {
  return field.settingKey ?? field.id;
}

/**
 * Ist dieses Lobby-Feld gerade sichtbar?
 *
 * Host und Handy müssen dieselbe Antwort geben, deshalb liegt die Regel hier
 * und nicht in einer der beiden Oberflächen. Der Wert des Bezugsfeldes kommt
 * aus den Raumeinstellungen; solange dort nichts steht, gilt sein Standardwert.
 */
export function isLobbyFieldVisible(
  field: GameLobbySetupField,
  fields: readonly GameLobbySetupField[],
  settings: Readonly<Record<string, unknown>>
): boolean {
  const rule = field.visibleWhen;

  if (!rule) {
    return true;
  }

  const source = fields.find((entry) => lobbyFieldKey(entry) === rule.field);
  const stored = settings[rule.field];
  const value = stored === undefined || stored === null ? source?.defaultValue : stored;

  return rule.anyOf.includes(String(value));
}

/** True when the game renders the given lifecycle screen itself. */
export function ownsHostScreen(
  manifest: Pick<GameManifest, "ownsScreens"> | undefined | null,
  screen: HostOwnedScreen
): boolean {
  return Boolean(manifest?.ownsScreens?.includes(screen));
}
