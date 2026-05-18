import Phaser from "phaser";
import type { SupportedLanguage } from "@open-party-lab/protocol";
import { hostTheme } from "../../../ui/theme/theme.js";

interface TapRaceRenderState {
  targetTaps?: number;
  tapsByPlayer?: Record<string, number>;
  winnerName?: string;
  winningTapCount?: number;
  message?: string;
}

const lanePalette = ["#38bdf8", "#f97316", "#a78bfa", "#34d399", "#facc15", "#fb7185"];

function clampProgress(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

export function renderTapRaceState(
  scene: Phaser.Scene,
  state: TapRaceRenderState,
  playerNames: Record<string, string>,
  language?: SupportedLanguage
): void {
  const en = language === "en";
  const targetTaps = state.targetTaps ?? 50;
  const tapsByPlayer = state.tapsByPlayer ?? {};
  const playerIds = Object.keys(tapsByPlayer);
  const hasPlayers = playerIds.length > 0;

  const title = state.winnerName
    ? en ? `${state.winnerName} wins!` : `${state.winnerName} gewinnt!`
    : en ? "Ladder Race" : "Leiter-Rennen";

  const subtitle = state.winnerName
    ? `${state.winningTapCount ?? 0}/${targetTaps} ${en ? "taps reached" : "Klicks erreicht"}`
    : state.message ?? (en ? "Tap quickly to climb the ladder." : "Klickt schnell, um die Leiter hochzuklettern.");

  scene.add
    .text(scene.scale.width / 2, 60, title, {
      fontFamily: hostTheme.titleFont,
      fontSize: "56px",
      color: hostTheme.text,
      align: "center"
    })
    .setOrigin(0.5, 0);

  scene.add
    .text(scene.scale.width / 2, 128, subtitle, {
      fontFamily: hostTheme.bodyFont,
      fontSize: "30px",
      color: "#cbd5e1",
      align: "center"
    })
    .setOrigin(0.5, 0);

  if (!hasPlayers) {
    scene.add
      .text(scene.scale.width / 2, scene.scale.height / 2, en ? "Waiting for players ..." : "Warte auf Spieler ...", {
        fontFamily: hostTheme.bodyFont,
        fontSize: "34px",
        color: hostTheme.text
      })
      .setOrigin(0.5);
    return;
  }

  const left = 120;
  const right = scene.scale.width - 120;
  const top = 230;
  const bottom = scene.scale.height - 120;
  const laneWidth = (right - left) / playerIds.length;

  scene.add
    .text(scene.scale.width / 2, bottom + 30, `${en ? "Target" : "Ziel"}: ${targetTaps} ${en ? "taps" : "Klicks"}`, {
      fontFamily: hostTheme.bodyFont,
      fontSize: "26px",
      color: "#94a3b8"
    })
    .setOrigin(0.5, 0.5);

  playerIds.forEach((playerId, index) => {
    const taps = tapsByPlayer[playerId] ?? 0;
    const progress = clampProgress(taps / targetTaps);
    const laneX = left + index * laneWidth + laneWidth / 2;
    const laneColor = lanePalette[index % lanePalette.length];
    const ladderHeight = bottom - top;

    const ladder = scene.add.graphics();
    ladder.lineStyle(6, 0xe2e8f0, 0.9);
    ladder.beginPath();
    ladder.moveTo(laneX - 24, top);
    ladder.lineTo(laneX - 24, bottom);
    ladder.moveTo(laneX + 24, top);
    ladder.lineTo(laneX + 24, bottom);

    const rungs = 10;
    for (let rungIndex = 0; rungIndex <= rungs; rungIndex += 1) {
      const y = bottom - (ladderHeight / rungs) * rungIndex;
      ladder.moveTo(laneX - 24, y);
      ladder.lineTo(laneX + 24, y);
    }
    ladder.strokePath();

    const playerY = bottom - progress * ladderHeight;
    const token = scene.add.circle(laneX, playerY, 16, Number.parseInt(laneColor.slice(1), 16), 1);
    token.setStrokeStyle(4, 0x0f172a, 1);

    scene.add
      .text(laneX, bottom + 8, playerNames[playerId] ?? playerId, {
        fontFamily: hostTheme.bodyFont,
        fontSize: "22px",
        color: hostTheme.text,
        align: "center"
      })
      .setOrigin(0.5, 0);

    scene.add
      .text(laneX, playerY - 26, `${taps}`, {
        fontFamily: hostTheme.bodyFont,
        fontSize: "20px",
        color: laneColor
      })
      .setOrigin(0.5, 1);
  });
}
