import Phaser from "phaser";
import type { AvailableGameDto, SupportedLanguage } from "@open-party-lab/protocol";
import { getHostText } from "../../i18n/hostText.js";
import { getGameVisual } from "../../games/gameVisuals.js";
import { hostTheme } from "../theme/theme.js";
import { sceneAlpha, sceneColor } from "../theme/sceneColors.js";
import { drawGameIcon } from "./gameIcons.js";
import { drawPill } from "./pill.js";
import { blockPointerInput } from "./pointerBlocker.js";
import { addSceneText } from "./sceneText.js";
import { fitTextToBox, fitTextToHeight } from "./textFitting.js";

export interface InfoPanelOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  lines: string[];
  accent?: number;
  error?: string | null;
  language?: SupportedLanguage;
}

export interface SelectedGamePanelOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  game: AvailableGameDto;
  playersCount: number;
  language?: SupportedLanguage;
}

/** Hero panel for the currently selected game. */
export function renderSelectedGamePanel(
  scene: Phaser.Scene,
  { x, y, width, height, game, playersCount, language }: SelectedGamePanelOptions
): void {
  const text = getHostText(language);
  const visual = getGameVisual(game);

  scene.add
    .rectangle(x, y, width, height, visual.surface, 1)
    .setOrigin(0)
    .setStrokeStyle(2, visual.accent, 0.6);
  scene.add.ellipse(x + width - 72, y + 66, 132, 132, visual.accent, 0.08);
  blockPointerInput(scene, x, y, width, height);

  const iconPlateSize = 108;
  scene.add
    .rectangle(x + 24, y + 24, iconPlateSize, iconPlateSize, visual.accentSoft, 1)
    .setOrigin(0)
    .setStrokeStyle(1, visual.accent, 0.34);
  drawGameIcon(
    scene.add.graphics().setPosition(x + 40, y + 40),
    iconPlateSize - 32,
    visual.accent,
    visual.accentSoft
  );

  addSceneText(scene, x + 152, y + 28, visual.eyebrow.toUpperCase(), {
    fontFamily: hostTheme.monoFont,
    fontSize: "12px",
    color: hostTheme.muted
  });

  const textMaxWidth = Math.max(42, width - 176);
  const title = addSceneText(scene, x + 152, y + 48, game.displayName, {
    fontFamily: hostTheme.titleFont,
    fontSize: "34px",
    color: hostTheme.text,
    wordWrap: { width: textMaxWidth, useAdvancedWrap: true }
  });
  fitTextToBox(title, game.displayName, textMaxWidth, 76);

  const description = addSceneText(
    scene,
    x + 152,
    title.y + title.height + 8,
    game.description,
    {
      fontFamily: hostTheme.bodyFont,
      fontSize: "17px",
      color: hostTheme.textSoft,
      lineSpacing: 4,
      wordWrap: { width: textMaxWidth, useAdvancedWrap: true }
    }
  );
  fitTextToBox(
    description,
    game.description,
    textMaxWidth,
    Math.max(24, y + height - description.y - 64)
  );

  const pillsY = y + height - 52;
  drawPill(
    scene,
    x + 24,
    pillsY,
    text.playerRange(game.minPlayers, game.maxPlayers),
    sceneColor.panelMuted,
    hostTheme.muted
  );
  drawPill(
    scene,
    x + 194,
    pillsY,
    `${text.lobby}: ${playersCount}`,
    sceneColor.panelMuted,
    hostTheme.muted
  );
}

/** Guidance panel with an accent rule on top. */
export function renderInfoPanel(scene: Phaser.Scene, options: InfoPanelOptions): void {
  const { x, y, width, height, title, lines, accent = sceneColor.accent, error, language } = options;
  const text = getHostText(language);

  scene.add
    .rectangle(x, y, width, height, sceneColor.panel, sceneAlpha.panel)
    .setOrigin(0)
    .setStrokeStyle(1, sceneColor.line, 1);
  scene.add.rectangle(x, y, width, 5, accent, 1).setOrigin(0);
  blockPointerInput(scene, x, y, width, height);

  const titleText = addSceneText(scene, x + 18, y + 20, title, {
    fontFamily: hostTheme.titleFont,
    fontSize: "24px",
    color: hostTheme.text,
    wordWrap: { width: width - 36 }
  });
  fitTextToHeight(titleText, title, Math.max(28, height - 46));

  const contentLines = error ? [...lines, "", `${text.errorLabel}: ${error}`] : lines;
  const contentY = Math.min(y + height - 24, titleText.y + titleText.height + 16);
  const contentText = addSceneText(scene, x + 18, contentY, contentLines.join("\n"), {
    fontFamily: hostTheme.bodyFont,
    fontSize: "17px",
    color: error ? hostTheme.danger : hostTheme.textSoft,
    lineSpacing: 8,
    wordWrap: { width: width - 36 }
  });
  fitTextToHeight(
    contentText,
    contentLines.join("\n"),
    Math.max(24, y + height - contentY - 16)
  );
}
