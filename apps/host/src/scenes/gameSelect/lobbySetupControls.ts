import Phaser from "phaser";
import type { AvailableGameDto, SupportedLanguage } from "@open-party-lab/protocol";
import { hostTheme } from "../../ui/theme/theme.js";
import { sceneAlpha, sceneColor } from "../../ui/theme/sceneColors.js";
import { addSceneText, blockPointerInput } from "../../ui/scene/index.js";

type LobbyField = NonNullable<AvailableGameDto["lobbySetup"]>["fields"][number];
type LobbySelectField = LobbyField & { kind: "select" };
type LobbyNumberField = LobbyField & { kind: "number" };

export interface LobbySetupControlsOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  game: AvailableGameDto;
  settings: Record<string, string | number | boolean>;
  disabled: boolean;
  language: SupportedLanguage;
  onHostAction: (gameId: string, action: unknown) => void;
}

const PANEL_INSET = 12;
const CONTROL_HEIGHT = 34;
const SELECT_GAP = 8;
const MIN_SELECT_BUTTON_WIDTH = 132;
const NUMBER_FIELD_HEIGHT = 58;
const PANEL_HEADER_HEIGHT = 54;
const CONFIRMATION_HEIGHT = 52;

function resolveSelectGrid(
  field: LobbySelectField,
  width: number
): { buttonWidth: number; columns: number; gap: number; rows: number } {
  const optionCount = Math.max(1, field.options.length);
  const columns = Math.max(
    1,
    Math.min(optionCount, Math.floor((width + SELECT_GAP) / (MIN_SELECT_BUTTON_WIDTH + SELECT_GAP)))
  );

  return {
    buttonWidth: Math.floor((width - SELECT_GAP * (columns - 1)) / columns),
    columns,
    gap: SELECT_GAP,
    rows: Math.ceil(optionCount / columns)
  };
}

function measureSelectFieldHeight(field: LobbySelectField, width: number): number {
  const { rows } = resolveSelectGrid(field, width);
  return 22 + rows * CONTROL_HEIGHT + Math.max(0, rows - 1) * SELECT_GAP + 8;
}

/** Height the setup panel needs, so callers can lay out around it. */
export function measureLobbySetupHeight(game: AvailableGameDto, width: number): number {
  const fields = game.lobbySetup?.fields ?? [];
  const fieldWidth = Math.max(120, width - PANEL_INSET * 2);
  const fieldsHeight = fields.reduce((height, field) => {
    if (field.kind === "select") {
      return height + measureSelectFieldHeight(field, fieldWidth);
    }

    return field.kind === "number" ? height + NUMBER_FIELD_HEIGHT : height;
  }, 0);

  return (
    PANEL_HEADER_HEIGHT + fieldsHeight + (game.lobbySetup?.confirmation ? CONFIRMATION_HEIGHT : 0)
  );
}

export function hasLobbySetup(game: AvailableGameDto): boolean {
  return Boolean((game.lobbySetup?.fields.length ?? 0) > 0 || game.lobbySetup?.confirmation);
}

function renderSmallButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
  label: string,
  enabled: boolean,
  onClick: () => void
): void {
  scene.add
    .rectangle(x, y, size, size, enabled ? sceneColor.accent : sceneColor.panelMuted, enabled ? 1 : 0.6)
    .setOrigin(0)
    .setStrokeStyle(1, enabled ? sceneColor.accentStrong : sceneColor.line, 1);
  addSceneText(scene, x + size / 2, y + size / 2, label, {
    fontFamily: hostTheme.titleFont,
    fontSize: "18px",
    color: enabled ? hostTheme.onAccent : hostTheme.muted
  }).setOrigin(0.5);

  if (!enabled) {
    return;
  }

  scene.add
    .zone(x, y, size, size)
    .setOrigin(0)
    .setInteractive({ useHandCursor: true })
    .on("pointerdown", onClick);
}

function renderSelectField(
  scene: Phaser.Scene,
  options: {
    x: number;
    y: number;
    width: number;
    game: AvailableGameDto;
    field: LobbySelectField;
    value: string | number | boolean;
    disabled: boolean;
    onHostAction: (gameId: string, action: unknown) => void;
  }
): void {
  const { x, y, width, game, field, value, disabled, onHostAction } = options;
  const { buttonWidth, columns, gap } = resolveSelectGrid(field, width);

  addSceneText(scene, x, y, field.label, {
    fontFamily: hostTheme.bodyFont,
    fontSize: "14px",
    color: hostTheme.muted
  });

  field.options.forEach((option, index) => {
    const selected = value === option.id;
    const buttonX = x + (index % columns) * (buttonWidth + gap);
    const buttonY = y + 20 + Math.floor(index / columns) * (CONTROL_HEIGHT + gap);

    scene.add
      .rectangle(
        buttonX,
        buttonY,
        buttonWidth,
        CONTROL_HEIGHT,
        selected ? sceneColor.accent : sceneColor.panelMuted,
        disabled ? 0.6 : 1
      )
      .setOrigin(0)
      .setStrokeStyle(selected ? 2 : 1, selected ? sceneColor.accentStrong : sceneColor.line, 1);
    addSceneText(scene, buttonX + buttonWidth / 2, buttonY + CONTROL_HEIGHT / 2, option.label, {
      fontFamily: hostTheme.bodyFont,
      fontSize: buttonWidth < 124 ? "12px" : "14px",
      color: selected ? hostTheme.onAccent : hostTheme.textSoft,
      align: "center",
      wordWrap: { width: buttonWidth - 10 }
    }).setOrigin(0.5);

    if (disabled) {
      return;
    }

    scene.add
      .zone(buttonX, buttonY, buttonWidth, CONTROL_HEIGHT)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        onHostAction(game.id, {
          type: "configure-lobby",
          [field.actionKey ?? field.id]: option.id
        });
      });
  });
}

function renderNumberField(
  scene: Phaser.Scene,
  options: {
    x: number;
    y: number;
    width: number;
    game: AvailableGameDto;
    field: LobbyNumberField;
    value: string | number | boolean;
    disabled: boolean;
    onHostAction: (gameId: string, action: unknown) => void;
  }
): void {
  const { x, y, width, game, field, value, disabled, onHostAction } = options;
  const numericValue =
    typeof value === "number" && Number.isFinite(value) ? value : field.defaultValue;

  addSceneText(scene, x, y, field.label, {
    fontFamily: hostTheme.bodyFont,
    fontSize: "14px",
    color: hostTheme.muted
  });

  const controlY = y + 20;
  const buttonSize = 30;
  const valueWidth = Math.max(84, width - buttonSize * 2 - 20);
  const sendValue = (nextValue: number) => {
    onHostAction(game.id, {
      type: "configure-lobby",
      [field.actionKey ?? field.id]: Math.max(field.min, Math.min(field.max, nextValue))
    });
  };

  renderSmallButton(scene, x, controlY, buttonSize, "-", !disabled && numericValue > field.min, () =>
    sendValue(numericValue - field.step)
  );

  scene.add
    .rectangle(x + buttonSize + 10, controlY, valueWidth, buttonSize, sceneColor.panelMuted, 1)
    .setOrigin(0)
    .setStrokeStyle(1, sceneColor.line, 1);
  addSceneText(
    scene,
    x + buttonSize + 10 + valueWidth / 2,
    controlY + buttonSize / 2,
    `${numericValue}`,
    {
      fontFamily: hostTheme.titleFont,
      fontSize: "17px",
      color: hostTheme.text
    }
  ).setOrigin(0.5);

  renderSmallButton(
    scene,
    x + width - buttonSize,
    controlY,
    buttonSize,
    "+",
    !disabled && numericValue < field.max,
    () => sendValue(numericValue + field.step)
  );
}

function renderConfirmationButton(
  scene: Phaser.Scene,
  options: {
    x: number;
    y: number;
    width: number;
    game: AvailableGameDto;
    actionType: string;
    label: string;
    confirmed: boolean;
    disabled: boolean;
    onHostAction: (gameId: string, action: unknown) => void;
  }
): void {
  const { x, y, width, game, actionType, label, confirmed, disabled, onHostAction } = options;
  const enabled = !disabled && !confirmed;
  const fill = confirmed
    ? sceneColor.successSoft
    : enabled
      ? sceneColor.accent
      : sceneColor.panelMuted;
  const stroke = confirmed ? sceneColor.success : enabled ? sceneColor.accentStrong : sceneColor.line;
  const textColor = confirmed ? hostTheme.success : enabled ? hostTheme.onAccent : hostTheme.muted;

  scene.add
    .rectangle(x, y, width, CONTROL_HEIGHT, fill, enabled || confirmed ? 1 : 0.7)
    .setOrigin(0)
    .setStrokeStyle(1, stroke, 1);
  addSceneText(scene, x + width / 2, y + CONTROL_HEIGHT / 2, label, {
    fontFamily: hostTheme.titleFont,
    fontSize: "15px",
    color: textColor
  }).setOrigin(0.5);

  if (!enabled) {
    return;
  }

  scene.add
    .zone(x, y, width, CONTROL_HEIGHT)
    .setOrigin(0)
    .setInteractive({ useHandCursor: true })
    .on("pointerdown", () => onHostAction(game.id, { type: actionType }));
}

/**
 * Per-game setup panel.
 *
 * The panel seals its own bounds against pointer input before drawing its
 * controls, so clicking blank space inside it no longer falls through to the
 * game cards underneath.
 */
export function renderLobbySetupControls(
  scene: Phaser.Scene,
  options: LobbySetupControlsOptions
): void {
  const { x, y, width, height, game, settings, disabled, language, onHostAction } = options;
  const en = language === "en";
  const fields = game.lobbySetup?.fields ?? [];

  scene.add
    .rectangle(x, y, width, height, sceneColor.panel, sceneAlpha.panel)
    .setOrigin(0)
    .setStrokeStyle(1, sceneColor.line, 1);
  blockPointerInput(scene, x, y, width, height);

  addSceneText(scene, x + 14, y + 10, game.lobbySetup?.title ?? "Setup", {
    fontFamily: hostTheme.titleFont,
    fontSize: "18px",
    color: hostTheme.text
  });

  if (game.lobbySetup?.description) {
    addSceneText(scene, x + 14, y + 32, game.lobbySetup.description, {
      fontFamily: hostTheme.bodyFont,
      fontSize: "12px",
      color: hostTheme.muted,
      wordWrap: { width: width - 28 }
    });
  }

  const fieldWidth = width - PANEL_INSET * 2;
  let cursorY = y + PANEL_HEADER_HEIGHT + 4;

  for (const field of fields) {
    if (field.kind === "select") {
      renderSelectField(scene, {
        x: x + PANEL_INSET,
        y: cursorY,
        width: fieldWidth,
        game,
        field,
        value: settings[field.settingKey ?? field.id] ?? field.defaultValue,
        disabled,
        onHostAction
      });
      cursorY += measureSelectFieldHeight(field, fieldWidth);
      continue;
    }

    if (field.kind === "number") {
      renderNumberField(scene, {
        x: x + PANEL_INSET,
        y: cursorY,
        width: fieldWidth,
        game,
        field,
        value: settings[field.settingKey ?? field.id] ?? field.defaultValue,
        disabled,
        onHostAction
      });
      cursorY += NUMBER_FIELD_HEIGHT;
    }
  }

  const confirmation = game.lobbySetup?.confirmation;

  if (!confirmation) {
    return;
  }

  const confirmed = settings[confirmation.settingKey] === true;

  renderConfirmationButton(scene, {
    x: x + PANEL_INSET,
    y: cursorY + 4,
    width: fieldWidth,
    game,
    actionType: confirmation.actionType,
    label: confirmed
      ? en
        ? "Setup confirmed"
        : "Setup bestaetigt"
      : (confirmation.label ?? (en ? "Confirm setup" : "Setup bestaetigen")),
    confirmed,
    disabled,
    onHostAction
  });
}
