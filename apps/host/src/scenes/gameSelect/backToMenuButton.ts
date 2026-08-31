import Phaser from "phaser";
import type { SupportedLanguage } from "@open-party-lab/protocol";
import { getHostText } from "../../i18n/hostText.js";
import { hostTheme } from "../../ui/theme/theme.js";
import { sceneColor } from "../../ui/theme/sceneColors.js";
import { addSceneText } from "../../ui/scene/index.js";

const BUTTON_HEIGHT = 34;
const COMPACT_BREAKPOINT = 520;
const WIDTH_COMPACT = 96;
const WIDTH_FULL = 172;

export interface BackToMenuButtonOptions {
  x: number;
  y: number;
  /** Available width; the button switches to its short label when tight. */
  width: number;
  language: SupportedLanguage;
  onBack: () => void;
}

/** Width the button will take, so callers can right-align it exactly. */
export function measureBackToMenuButtonWidth(availableWidth: number): number {
  return availableWidth < COMPACT_BREAKPOINT ? WIDTH_COMPACT : WIDTH_FULL;
}

/** Returns the y coordinate just below the button. */
export function renderBackToMenuButton(
  scene: Phaser.Scene,
  { x, y, width, language, onBack }: BackToMenuButtonOptions
): number {
  const text = getHostText(language);
  const compact = width < COMPACT_BREAKPOINT;
  const buttonWidth = measureBackToMenuButtonWidth(width);

  scene.add
    .rectangle(x, y, buttonWidth, BUTTON_HEIGHT, sceneColor.panel, 1)
    .setOrigin(0)
    .setStrokeStyle(1, sceneColor.lineStrong, 1);
  addSceneText(
    scene,
    x + buttonWidth / 2,
    y + BUTTON_HEIGHT / 2,
    compact ? text.backToMenuShort : text.backToMenu,
    {
      fontFamily: hostTheme.bodyFont,
      fontSize: compact ? "15px" : "16px",
      color: hostTheme.textSoft
    }
  ).setOrigin(0.5);

  scene.add
    .zone(x, y, buttonWidth, BUTTON_HEIGHT)
    .setOrigin(0)
    .setInteractive({ useHandCursor: true })
    .on("pointerdown", onBack);

  return y + BUTTON_HEIGHT;
}
