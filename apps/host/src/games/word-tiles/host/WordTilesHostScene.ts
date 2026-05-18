import Phaser from "phaser";
import type { WordTilesBoardCellState, WordTilesPublicState, SupportedLanguage } from "@open-party-lab/protocol";
import type { HostSocketClient } from "../../../app/hostSocketClient.js";
import { hostTheme } from "../../../ui/theme/theme.js";

const boardSize = 15;

function bonusFill(bonus: WordTilesBoardCellState["bonus"]): number {
  switch (bonus) {
    case "double_letter":
      return 0x1d4ed8;
    case "triple_letter":
      return 0x0284c7;
    case "double_word":
    case "center":
      return 0xbe185d;
    case "triple_word":
      return 0xb91c1c;
    default:
      return 0x1e293b;
  }
}

function bonusLabel(bonus: WordTilesBoardCellState["bonus"]): string {
  switch (bonus) {
    case "double_letter":
      return "2L";
    case "triple_letter":
      return "3L";
    case "double_word":
      return "2W";
    case "triple_word":
      return "3W";
    case "center":
      return "*";
    default:
      return "";
  }
}

function text(language?: SupportedLanguage) {
  const en = language === "en";

  return {
    active: en ? "Turn" : "Am Zug",
    bag: en ? "Bag" : "Beutel",
    move: en ? "Move" : "Zug",
    lastMove: en ? "Last move" : "Letzter Zug",
    waiting: en ? "Waiting for Word Tiles state." : "Warte auf Word-Tiles-Zustand.",
    rack: en ? "Rack" : "Rack",
    points: en ? "pts" : "Pkt.",
    noMove: en ? "No move yet." : "Noch kein Zug."
  };
}

function buildFallbackState(players: Array<{ id: string; name: string; color: string; connected: boolean }>): WordTilesPublicState {
  return {
    boardSize,
    board: Array.from({ length: boardSize * boardSize }, (_, index) => ({
      x: index % boardSize,
      y: Math.floor(index / boardSize),
      bonus: "normal",
      tile: null
    })),
    players: players.map((player) => ({
      playerId: player.id,
      name: player.name,
      color: player.color,
      score: 0,
      rackCount: 7,
      connected: player.connected
    })),
    activePlayerId: players[0]?.id ?? null,
    activePlayerName: players[0]?.name ?? null,
    moveNumber: 0,
    bagCount: 0,
    consecutivePasses: 0,
    gameOver: false,
    tileValues: {}
  };
}

export class WordTilesHostScene extends Phaser.Scene {
  private unsubscribe?: () => void;

  constructor() {
    super("WordTilesHostScene");
  }

  create(): void {
    const client = this.registry.get("hostClient") as HostSocketClient;

    this.unsubscribe = client.subscribe((state) => {
      const language = state.room?.language;
      const labels = text(language);
      const gameState =
        (state.game?.state as WordTilesPublicState | undefined) ??
        buildFallbackState((state.room?.players ?? []).map((player) => ({
          id: player.id,
          name: player.name,
          color: player.color,
          connected: player.connected
        })));

      this.children.removeAll(true);
      this.cameras.main.setBackgroundColor(0x07111f);

      if (!gameState.board.length) {
        this.add
          .text(this.scale.width / 2, this.scale.height / 2, labels.waiting, {
            fontFamily: hostTheme.bodyFont,
            fontSize: "28px",
            color: hostTheme.text
          })
          .setOrigin(0.5);
        return;
      }

      this.renderBoard(gameState);
      this.renderPanel(gameState, state.game?.message, language);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
    });
  }

  private renderBoard(state: WordTilesPublicState): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const sidePanelWidth = Math.max(360, width * 0.28);
    const maxBoard = Math.min(height - 72, width - sidePanelWidth - 92);
    const boardPixels = Math.max(420, maxBoard);
    const cell = boardPixels / state.boardSize;
    const boardX = 38;
    const boardY = (height - boardPixels) / 2 + 22;

    this.add.rectangle(boardX + boardPixels / 2, boardY + boardPixels / 2, boardPixels + 18, boardPixels + 18, 0x020617, 0.92)
      .setStrokeStyle(2, 0x334155, 0.9);

    for (const boardCell of state.board) {
      const x = boardX + boardCell.x * cell;
      const y = boardY + boardCell.y * cell;
      const centerX = x + cell / 2;
      const centerY = y + cell / 2;

      this.add.rectangle(centerX, centerY, cell - 2, cell - 2, bonusFill(boardCell.bonus), boardCell.tile ? 0.22 : 0.72)
        .setStrokeStyle(boardCell.recent ? 3 : 1, boardCell.recent ? 0xfacc15 : 0x475569, boardCell.recent ? 1 : 0.42);

      if (boardCell.tile) {
        this.add.rectangle(centerX, centerY, cell - 6, cell - 6, boardCell.tile.isBlank ? 0xe0f2fe : 0xf1d38d, 1)
          .setStrokeStyle(1, boardCell.tile.isBlank ? 0x38bdf8 : 0x854d0e, 0.92);
        this.add
          .text(centerX, centerY - cell * 0.04, boardCell.tile.letter, {
            fontFamily: hostTheme.titleFont,
            fontSize: `${Math.max(16, Math.floor(cell * 0.5))}px`,
            color: "#3b2208"
          })
          .setOrigin(0.5);
        this.add
          .text(centerX + cell * 0.26, centerY + cell * 0.24, `${boardCell.tile.score}`, {
            fontFamily: hostTheme.bodyFont,
            fontSize: `${Math.max(8, Math.floor(cell * 0.18))}px`,
            color: "#5f370e"
          })
          .setOrigin(0.5);
      } else {
        const label = bonusLabel(boardCell.bonus);

        if (label) {
          this.add
            .text(centerX, centerY, label, {
              fontFamily: hostTheme.bodyFont,
              fontSize: `${Math.max(9, Math.floor(cell * 0.22))}px`,
              color: "#e2e8f0",
              fontStyle: "bold"
            })
            .setOrigin(0.5);
        }
      }
    }
  }

  private renderPanel(state: WordTilesPublicState, message?: string, language?: SupportedLanguage): void {
    const labels = text(language);
    const width = this.scale.width;
    const height = this.scale.height;
    const panelX = Math.max(width - 390, width * 0.68);
    const panelWidth = Math.min(360, width - panelX - 24);
    const panelTop = 56;
    const panelHeight = height - 96;

    this.add.rectangle(panelX + panelWidth / 2, panelTop + panelHeight / 2, panelWidth, panelHeight, 0x0f172a, 0.88)
      .setStrokeStyle(1, 0x334155, 0.9);

    this.add
      .text(panelX + 22, panelTop + 22, "Word Tiles", {
        fontFamily: hostTheme.titleFont,
        fontSize: "42px",
        color: hostTheme.text
      })
      .setOrigin(0, 0);

    this.add
      .text(panelX + 22, panelTop + 80, `${labels.active}: ${state.activePlayerName ?? "-"}`, {
        fontFamily: hostTheme.bodyFont,
        fontSize: "23px",
        color: hostTheme.accent
      })
      .setOrigin(0, 0);

    this.add
      .text(panelX + 22, panelTop + 116, `${labels.bag}: ${state.bagCount} | ${labels.move}: ${state.moveNumber + 1}`, {
        fontFamily: hostTheme.bodyFont,
        fontSize: "18px",
        color: hostTheme.muted
      })
      .setOrigin(0, 0);

    const sortedPlayers = [...state.players].sort((left, right) => right.score - left.score);
    let y = panelTop + 164;

    sortedPlayers.forEach((player, index) => {
      const active = player.playerId === state.activePlayerId;
      this.add.rectangle(panelX + panelWidth / 2, y + 24, panelWidth - 36, 48, active ? 0x064e3b : 0x1e293b, active ? 0.72 : 0.58)
        .setStrokeStyle(1, active ? 0x22c55e : 0x334155, active ? 0.9 : 0.5);
      this.add
        .text(panelX + 28, y + 9, `${index + 1}. ${player.name}`, {
          fontFamily: hostTheme.bodyFont,
          fontSize: "18px",
          color: player.connected ? hostTheme.text : hostTheme.muted
        })
        .setOrigin(0, 0);
      this.add
        .text(panelX + panelWidth - 118, y + 9, `${player.score} ${labels.points}`, {
          fontFamily: hostTheme.bodyFont,
          fontSize: "18px",
          color: hostTheme.warning,
          align: "right"
        })
        .setOrigin(0, 0);
      this.add
        .text(panelX + panelWidth - 66, y + 30, `${labels.rack}: ${player.rackCount}`, {
          fontFamily: hostTheme.bodyFont,
          fontSize: "13px",
          color: hostTheme.muted,
          align: "right"
        })
        .setOrigin(0, 0);
      y += 58;
    });

    const lastMoveText = state.lastMove
      ? [
          `${state.lastMove.playerName}: ${state.lastMove.score} ${labels.points}`,
          state.lastMove.words.length > 0 ? state.lastMove.words.map((word) => `${word.word} (${word.score})`).join(", ") : state.lastMove.reason ?? "",
          state.lastMove.bingo ? "Bingo +50" : ""
        ].filter(Boolean).join("\n")
      : labels.noMove;

    y += 18;
    this.add
      .text(panelX + 22, y, labels.lastMove, {
        fontFamily: hostTheme.titleFont,
        fontSize: "22px",
        color: hostTheme.text
      })
      .setOrigin(0, 0);

    this.add
      .text(panelX + 22, y + 34, lastMoveText, {
        fontFamily: hostTheme.bodyFont,
        fontSize: "17px",
        color: hostTheme.muted,
        lineSpacing: 8,
        wordWrap: { width: panelWidth - 44 }
      })
      .setOrigin(0, 0);

    this.add
      .text(panelX + 22, panelTop + panelHeight - 110, message ?? "", {
        fontFamily: hostTheme.bodyFont,
        fontSize: "18px",
        color: state.lastError ? hostTheme.danger : hostTheme.text,
        lineSpacing: 6,
        wordWrap: { width: panelWidth - 44 }
      })
      .setOrigin(0, 0);
  }
}
