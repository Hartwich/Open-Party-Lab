import Phaser from "phaser";
import { hostTheme } from "../theme/theme.js";
import { sceneAlpha, sceneColor } from "../theme/sceneColors.js";
import { addSceneText } from "./sceneText.js";

/** Small rounded label used for shortcuts, player status and metadata. */
export function drawPill(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  fillColor: number,
  textColor: string = hostTheme.text
): Phaser.GameObjects.Container {
  const paddingX = 12;
  const paddingY = 7;
  const text = addSceneText(scene, 0, 0, label, {
    fontFamily: hostTheme.bodyFont,
    fontSize: "14px",
    color: textColor
  });
  const width = text.width + paddingX * 2;
  const height = text.height + paddingY * 2;
  const background = scene.add
    .rectangle(0, 0, width, height, fillColor, sceneAlpha.panel)
    .setOrigin(0)
    .setStrokeStyle(1, sceneColor.line, 0.9);

  text.setPosition(paddingX, paddingY - 1);
  return scene.add.container(x, y, [background, text]);
}
