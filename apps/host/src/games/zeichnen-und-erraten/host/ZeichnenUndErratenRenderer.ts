import Phaser from "phaser";
import type { SupportedLanguage } from "@open-party-lab/protocol";
import { hostTheme } from "../../../ui/theme/theme.js";

interface DrawingPoint {
  x: number;
  y: number;
}

interface DrawingStroke {
  id: string;
  color: string;
  points: DrawingPoint[];
}

interface GuessEntry {
  playerName: string;
  guess: string;
  correct: boolean;
}

export interface ZeichnenUndErratenRenderState {
  drawerName?: string;
  maskedWord?: string;
  revealedWord?: string;
  strokes?: DrawingStroke[];
  guesses?: GuessEntry[];
  winnerName?: string;
}

function parseStrokeColor(color: string | undefined): number {
  if (!color) {
    return 0xf8fafc;
  }

  return Phaser.Display.Color.HexStringToColor(color).color;
}

export function renderZeichnenUndErratenState(
  scene: Phaser.Scene,
  state: ZeichnenUndErratenRenderState,
  message: string,
  language?: SupportedLanguage
): void {
  const en = language === "en";
  const width = scene.scale.width;
  const height = scene.scale.height;
  const pad = 28;
  const boardX = pad;
  const boardY = 120;
  const boardWidth = Math.max(320, width - pad * 2 - 340);
  const boardHeight = Math.max(240, height - boardY - pad);

  scene.add
    .rectangle(width / 2, 56, width - pad * 2, 88, 0x111827, 0.96)
    .setStrokeStyle(2, 0x334155, 0.8);

  const title = `${en ? "Drawer" : "Zeichner"}: ${state.drawerName ?? "-"}`;
  const wordLabel = state.revealedWord
    ? `${en ? "Word" : "Wort"}: ${state.revealedWord}`
    : `${en ? "Word" : "Wort"}: ${state.maskedWord ?? "_ _ _"}`;

  scene.add.text(pad + 18, 26, `${title}\n${wordLabel}`, {
    fontFamily: hostTheme.titleFont,
    fontSize: "28px",
    color: "#e2e8f0"
  });

  scene.add
    .rectangle(boardX + boardWidth / 2, boardY + boardHeight / 2, boardWidth, boardHeight, 0x0b1220, 1)
    .setStrokeStyle(3, 0x334155, 0.9);

  const graphics = scene.add.graphics();

  for (const stroke of state.strokes ?? []) {
    const color = parseStrokeColor(stroke.color);

    if (stroke.points.length < 2) {
      const p = stroke.points[0];
      if (p) {
        graphics.fillStyle(color, 1);
        graphics.fillCircle(boardX + p.x * boardWidth, boardY + p.y * boardHeight, 3.5);
      }
      continue;
    }

    graphics.lineStyle(6, color, 1);
    graphics.beginPath();
    stroke.points.forEach((point, index) => {
      const x = boardX + point.x * boardWidth;
      const y = boardY + point.y * boardHeight;
      if (index === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    });
    graphics.strokePath();
  }

  const panelX = boardX + boardWidth + 16;
  const panelWidth = width - panelX - pad;
  const guesses = (state.guesses ?? []).slice(-9).reverse();

  scene.add
    .rectangle(panelX + panelWidth / 2, boardY + boardHeight / 2, panelWidth, boardHeight, 0x111827, 0.92)
    .setStrokeStyle(2, 0x334155, 0.9);

  scene.add.text(panelX + 14, boardY + 12, en ? "Guesses" : "Tipps", {
    fontFamily: hostTheme.titleFont,
    fontSize: "26px",
    color: "#f8fafc"
  });

  guesses.forEach((entry, index) => {
    scene.add.text(panelX + 14, boardY + 50 + index * 34, `${entry.playerName}: ${entry.guess}`, {
      fontFamily: hostTheme.bodyFont,
      fontSize: "21px",
      color: entry.correct ? "#4ade80" : "#cbd5e1"
    });
  });

  scene.add.text(
    panelX + 14,
    boardY + boardHeight - 70,
    state.winnerName
      ? `${en ? "Winner" : "Gewinner"}: ${state.winnerName}`
      : en ? "No correct word yet" : "Noch kein korrektes Wort",
    {
      fontFamily: hostTheme.bodyFont,
      fontSize: "20px",
      color: state.winnerName ? "#4ade80" : "#94a3b8",
      wordWrap: { width: panelWidth - 28 }
    }
  );

  scene.add.text(panelX + 14, boardY + boardHeight - 38, message, {
    fontFamily: hostTheme.bodyFont,
    fontSize: "18px",
    color: "#94a3b8",
    wordWrap: { width: panelWidth - 28 }
  });
}
