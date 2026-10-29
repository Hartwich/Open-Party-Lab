import type {
  ControllerActionButtonModel,
  DPadLayoutModel,
  LayoutStat,
  TwinStickLayoutModel,
  VirtualJoystickLayoutModel
} from "./models.js";
import type { SupportedLanguage } from "@open-party-lab/protocol";
import { getControllerText } from "../../i18n/controllerText.js";

export type StandardControllerPresetId =
  | "joystick_a"
  | "joystick_abcd"
  | "dual_joystick"
  | "dpad_abcd";

export interface StandardControllerPresetDefinition {
  id: StandardControllerPresetId;
  displayName: string;
  description: string;
  layoutKind: VirtualJoystickLayoutModel["kind"] | DPadLayoutModel["kind"] | TwinStickLayoutModel["kind"];
}

export const standardControllerPresetCatalog: StandardControllerPresetDefinition[] = [
  {
    id: "joystick_a",
    displayName: "Joystick + A",
    description: "Ein linker Analog-Stick und ein grosser Aktionsbutton rechts.",
    layoutKind: "virtual_joystick"
  },
  {
    id: "joystick_abcd",
    displayName: "Joystick + A/B/C/D",
    description: "Ein linker Analog-Stick und vier Aktionsbuttons rechts.",
    layoutKind: "virtual_joystick"
  },
  {
    id: "dual_joystick",
    displayName: "Dual Joystick",
    description: "Ein linker Stick fuer Bewegung und ein rechter Stick fuer Zielen oder Blickrichtung.",
    layoutKind: "twin_stick"
  },
  {
    id: "dpad_abcd",
    displayName: "D-Pad + A/B/C/D",
    description: "Vier Richtungsbuttons links und vier Aktionsbuttons rechts.",
    layoutKind: "dpad"
  }
];

const englishPresetDescriptions: Record<StandardControllerPresetId, string> = {
  joystick_a: "An analog stick on the left and a large action button on the right.",
  joystick_abcd: "An analog stick on the left and four action buttons on the right.",
  dual_joystick: "A left stick for movement and a right stick for aiming or looking around.",
  dpad_abcd: "Four direction buttons on the left and four action buttons on the right."
};

export function listStandardControllerPresets(language: SupportedLanguage = "de"): StandardControllerPresetDefinition[] {
  return standardControllerPresetCatalog.map((preset) => ({
    ...preset,
    description: language === "en" ? englishPresetDescriptions[preset.id] : preset.description
  }));
}

interface StandardControllerBaseOptions {
  language?: SupportedLanguage;
  title: string;
  subtitle?: string;
  helperText?: string;
  disabled?: boolean;
  accentColor?: string;
  resetKey?: string;
  stats?: LayoutStat[];
}

interface StandardActionButtonBinding {
  label?: string;
  accentColor?: string;
  disabled?: boolean;
  onPress: () => void;
  onRelease?: () => void;
}

interface StandardJoystickBaseOptions extends StandardControllerBaseOptions {
  centerLabel?: string;
  onMoveChange: (moveX: number, moveY: number) => void;
}

export interface StandardJoystickAControllerOptions extends StandardJoystickBaseOptions {
  buttonA: StandardActionButtonBinding;
}

export interface StandardJoystickAbcdControllerOptions extends StandardJoystickBaseOptions {
  buttonA: StandardActionButtonBinding;
  buttonB: StandardActionButtonBinding;
  buttonC: StandardActionButtonBinding;
  buttonD: StandardActionButtonBinding;
}

export interface StandardDualJoystickControllerOptions extends StandardControllerBaseOptions {
  leftStickLabel?: string;
  rightStickLabel?: string;
  onMoveChange: (moveX: number, moveY: number) => void;
  onAimChange: (aimX: number, aimY: number) => void;
}

export interface StandardDpadAbcdControllerOptions extends StandardControllerBaseOptions {
  onMoveChange: (moveX: number, moveY: number) => void;
  buttonA: StandardActionButtonBinding;
  buttonB: StandardActionButtonBinding;
  buttonC: StandardActionButtonBinding;
  buttonD: StandardActionButtonBinding;
}

function resolveBaseOptions(options: StandardControllerBaseOptions) {
  return {
    language: options.language,
    title: options.title,
    subtitle: options.subtitle,
    helperText: options.helperText,
    disabled: options.disabled ?? false,
    accentColor: options.accentColor,
    resetKey: options.resetKey ?? "standard-controller",
    stats: options.stats
  };
}

function createActionButton(
  id: string,
  fallbackLabel: string,
  binding: StandardActionButtonBinding
): ControllerActionButtonModel {
  return {
    id,
    label: binding.label ?? fallbackLabel,
    accentColor: binding.accentColor,
    disabled: binding.disabled,
    onPress: binding.onPress,
    onRelease: binding.onRelease
  };
}

export function createStandardJoystickAController(
  options: StandardJoystickAControllerOptions
): VirtualJoystickLayoutModel {
  const base = resolveBaseOptions(options);

  return {
    kind: "virtual_joystick",
    ...base,
    centerLabel: options.centerLabel ?? getControllerText(options.language).inputs.move,
    actionButtons: [createActionButton("a", "A", options.buttonA)],
    actionButtonColumns: 1,
    onMoveChange: options.onMoveChange
  };
}

export function createStandardJoystickAbcdController(
  options: StandardJoystickAbcdControllerOptions
): VirtualJoystickLayoutModel {
  const base = resolveBaseOptions(options);

  return {
    kind: "virtual_joystick",
    ...base,
    centerLabel: options.centerLabel ?? getControllerText(options.language).inputs.move,
    actionButtons: [
      createActionButton("a", "A", options.buttonA),
      createActionButton("b", "B", options.buttonB),
      createActionButton("c", "C", options.buttonC),
      createActionButton("d", "D", options.buttonD)
    ],
    actionButtonColumns: 2,
    onMoveChange: options.onMoveChange
  };
}

export function createStandardDualJoystickController(
  options: StandardDualJoystickControllerOptions
): TwinStickLayoutModel {
  const base = resolveBaseOptions(options);

  return {
    kind: "twin_stick",
    ...base,
    leftStickLabel: options.leftStickLabel ?? getControllerText(options.language).inputs.move,
    rightStickLabel: options.rightStickLabel ?? getControllerText(options.language).inputs.look,
    onMoveChange: options.onMoveChange,
    onAimChange: options.onAimChange
  };
}

export function createStandardDpadAbcdController(
  options: StandardDpadAbcdControllerOptions
): DPadLayoutModel {
  const base = resolveBaseOptions(options);

  return {
    kind: "dpad",
    ...base,
    actionButtons: [
      createActionButton("a", "A", options.buttonA),
      createActionButton("b", "B", options.buttonB),
      createActionButton("c", "C", options.buttonC),
      createActionButton("d", "D", options.buttonD)
    ],
    actionButtonColumns: 2,
    onMoveChange: options.onMoveChange
  };
}
