import Phaser from "phaser";
import type { SupportedLanguage } from "@open-party-lab/protocol";
import { getHostText } from "../../i18n/hostText.js";
import { hostTheme } from "../theme/theme.js";
import { sceneAlpha, sceneColor } from "../theme/sceneColors.js";
import { getSceneContentFrame, sceneBreakpoint } from "./layout.js";
import { blockPointerInput } from "./pointerBlocker.js";
import { addSceneText } from "./sceneText.js";
import { trimMiddle } from "./textFitting.js";

export interface SceneHeaderOptions {
  title: string;
  subtitle: string;
  roomCode: string;
  showRoomCode?: boolean;
  joinUrl?: string;
  language?: SupportedLanguage;
}

interface SceneHeaderMetrics {
  x: number;
  y: number;
  width: number;
  height: number;
  narrow: boolean;
  bottom: number;
}

const HEADER_TOP = 28;
const HEADER_GAP_BELOW = 22;

function getSceneHeaderMetrics(
  scene: Phaser.Scene,
  { subtitle, joinUrl }: Pick<SceneHeaderOptions, "subtitle" | "joinUrl">
): SceneHeaderMetrics {
  const { x, width } = getSceneContentFrame(scene);
  const narrow = width < sceneBreakpoint.narrowHeader;
  const hasSubtitle = subtitle.trim().length > 0;
  const height = joinUrl
    ? narrow
      ? hasSubtitle
        ? 226
        : 196
      : 126
    : narrow
      ? hasSubtitle
        ? 160
        : 126
      : 108;

  return {
    x,
    y: HEADER_TOP,
    width,
    height,
    narrow,
    bottom: HEADER_TOP + height + HEADER_GAP_BELOW
  };
}

/** Where scene content may start, without drawing anything. */
export function measureSceneHeaderBottom(
  scene: Phaser.Scene,
  options: SceneHeaderOptions
): number {
  return getSceneHeaderMetrics(scene, options).bottom;
}

/**
 * The header is drawn last by every scene so it stays on top of content that
 * has been scrolled underneath it, and it blocks pointer input for the same
 * reason.
 */
export function renderSceneHeader(
  scene: Phaser.Scene,
  { title, subtitle, roomCode, showRoomCode = true, joinUrl, language }: SceneHeaderOptions
): number {
  const text = getHostText(language);
  const { x, y, width, height, narrow, bottom } = getSceneHeaderMetrics(scene, {
    subtitle,
    joinUrl
  });

  scene.add
    .rectangle(x, y, width, height, sceneColor.panel, sceneAlpha.panel)
    .setOrigin(0)
    .setStrokeStyle(1, sceneColor.line, 1);

  addSceneText(scene, x + 24, y + 18, title, {
    fontFamily: hostTheme.titleFont,
    fontSize: narrow ? "32px" : "44px",
    color: hostTheme.text,
    wordWrap: { width: narrow ? width - 48 : width - 300 }
  });

  addSceneText(scene, x + 24, y + (narrow ? 62 : 68), subtitle, {
    fontFamily: hostTheme.bodyFont,
    fontSize: narrow ? "16px" : "18px",
    color: hostTheme.muted,
    lineSpacing: 4,
    wordWrap: { width: narrow ? width - 48 : width - 320 }
  }).setVisible(subtitle.trim().length > 0);

  if (showRoomCode) {
    const codeCardWidth = narrow ? width - 48 : 214;
    const codeCardX = narrow ? x + 24 : x + width - codeCardWidth - 20;
    const hasSubtitle = subtitle.trim().length > 0;
    const codeCardY = narrow
      ? y + (joinUrl ? (hasSubtitle ? 118 : 88) : hasSubtitle ? 96 : 72)
      : y + 18;

    scene.add
      .rectangle(codeCardX, codeCardY, codeCardWidth, 70, sceneColor.accentSoft, 1)
      .setOrigin(0)
      .setStrokeStyle(1, sceneColor.accent, 0.4);
    addSceneText(scene, codeCardX + 14, codeCardY + 10, text.roomCode, {
      fontFamily: hostTheme.monoFont,
      fontSize: "12px",
      color: hostTheme.accentStrong
    });
    addSceneText(scene, codeCardX + 14, codeCardY + 28, roomCode, {
      fontFamily: hostTheme.titleFont,
      fontSize: "28px",
      color: hostTheme.text
    });
  }

  if (joinUrl) {
    addSceneText(
      scene,
      x + 24,
      y + height - 30,
      `${text.join}: ${trimMiddle(joinUrl, narrow ? 56 : 88)}`,
      {
        fontFamily: hostTheme.bodyFont,
        fontSize: "14px",
        color: hostTheme.accentStrong
      }
    );
  }

  blockPointerInput(scene, x, y, width, height);

  return bottom;
}
