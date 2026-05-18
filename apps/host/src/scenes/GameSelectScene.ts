import Phaser from "phaser";
import {
  hasActiveRound,
  type AvailableGameDto,
  type PlayerSnapshot,
  type SupportedLanguage,
  type ZeichnenUndErratenLobbyState
} from "@open-party-lab/protocol";
import { bindGameSelectionHotkeys } from "../app/gameHotkeys.js";
import type { HostSocketClient } from "../app/hostSocketClient.js";
import { requiresReadyAutoStart } from "../app/roundStartPolicy.js";
import { getHostText } from "../i18n/hostText.js";
import { hostTheme } from "../ui/theme/theme.js";
import {
  drawArcadeBackdrop,
  getSceneContentFrame,
  getVisualAccent,
  measureSceneHeaderBottom,
  renderGameCardGrid,
  renderInfoPanel,
  renderPlayerStrip,
  renderSceneHeader,
  renderSelectedGamePanel
} from "./gameSelectionUi.js";
import { clampScroll, measureMaxScroll, renderScrollBar } from "./sceneScroll.js";

export class GameSelectScene extends Phaser.Scene {
  private unsubscribe?: () => void;
  private unbindHotkeys?: () => void;
  private client?: HostSocketClient;
  private scrollY = 0;
  private maxScroll = 0;
  private readonly handleResize = () => this.renderFromState();
  private readonly handleWheel = (
    _pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ) => {
    if (this.maxScroll <= 0) {
      return;
    }

    this.scrollY = clampScroll(this.scrollY + deltaY, this.maxScroll);
    this.renderFromState();
  };

  constructor() {
    super("GameSelectScene");
  }

  create(): void {
    const client = this.registry.get("hostClient") as HostSocketClient;
    const handleStartRound = () => client.startRound();

    this.client = client;
    this.unbindHotkeys = bindGameSelectionHotkeys(this, client);
    this.input.keyboard?.on("keydown-SPACE", handleStartRound);
    this.input.on("wheel", this.handleWheel);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize);

    this.unsubscribe = client.subscribe(() => {
      this.renderFromState();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
      this.unbindHotkeys?.();
      this.unbindHotkeys = undefined;
      this.client = undefined;
      this.input.keyboard?.off("keydown-SPACE", handleStartRound);
      this.input.off("wheel", this.handleWheel);
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize);
    });
  }

  private renderFromState(): void {
    const state = this.client?.getState();

    if (!state) {
      return;
    }

    const selectedGame = state.room?.availableGames.find((game) => game.id === state.room?.selectedGameId);
    this.render(
      selectedGame,
      state.room?.players ?? [],
      state.room?.availableGames ?? [],
      state.error,
      state.room?.code ?? "----",
      hasActiveRound(state.room),
      state.room?.language ?? state.preferredLanguage,
      state.room?.zeichnenUndErratenLobby
    );
  }

  private updateScrollBounds(contentBottom: number): boolean {
    this.maxScroll = measureMaxScroll(this, contentBottom);
    const nextScrollY = clampScroll(this.scrollY, this.maxScroll);

    if (nextScrollY === this.scrollY) {
      return false;
    }

    this.scrollY = nextScrollY;
    this.renderFromState();
    return true;
  }

  private render(
    selectedGame: AvailableGameDto | undefined,
    players: PlayerSnapshot[],
    availableGames: AvailableGameDto[],
    error: string | null,
    roomCode: string,
    roundActive: boolean,
    language: SupportedLanguage,
    zeichnenUndErratenLobby?: ZeichnenUndErratenLobbyState
  ): void {
    this.children.removeAll(true);
    drawArcadeBackdrop(this);

    const text = getHostText(language);
    const autoStartsWithReady = requiresReadyAutoStart(selectedGame);
    const { x: contentX, width: contentWidth } = getSceneContentFrame(this);
    const selectedGameName = selectedGame?.displayName ?? text.gameSelectionFallback;
    const headerOptions = {
      title: selectedGameName,
      subtitle: roundActive
        ? text.gameSelectRoundActiveSubtitle
        : autoStartsWithReady
          ? text.gameSelectAutoReadySubtitle
          : text.gameSelectClassicSubtitle,
      roomCode,
      language
    };
    const headerBottom = measureSceneHeaderBottom(this, headerOptions);
    const bodyY = headerBottom - this.scrollY;
    const pickerBottom = renderGameCardGrid(this, {
      games: availableGames,
      selectedGameId: selectedGame?.id ?? null,
      x: contentX,
      y: bodyY,
      width: contentWidth,
      variant: "compact",
      language,
      onSelect: roundActive ? undefined : (gameId) => this.client?.selectGame(gameId)
    });
    const stripBottom = renderPlayerStrip(this, {
      x: contentX,
      y: pickerBottom + 14,
      width: contentWidth,
      players,
      selectedGameId: selectedGame?.id ?? null,
      title: text.playerStatusTitle,
      language
    });
    const lowerY = stripBottom + 16;

    if (!selectedGame) {
      const infoHeight = Math.max(150, this.scale.height - (lowerY + this.scrollY) - 28);
      renderInfoPanel(this, {
        x: contentX,
        y: lowerY,
        width: contentWidth,
        height: infoHeight,
        title: text.noActiveGameTitle,
        lines: [
          text.noActiveGameSelectLine,
          roundActive
            ? text.noActiveGameRoundActiveLine
            : text.noActiveGameStartLine
        ],
        language,
        error
      });
      if (this.updateScrollBounds(lowerY + infoHeight + this.scrollY)) {
        return;
      }

      renderSceneHeader(this, headerOptions);
      renderScrollBar(this, this.scrollY, this.maxScroll);
      return;
    }

    const stacked = contentWidth < 1_040;
    const gap = 22;
    const sideWidth = stacked ? contentWidth : Math.min(360, Math.max(300, Math.floor(contentWidth * 0.34)));
    const heroWidth = stacked ? contentWidth : contentWidth - sideWidth - gap;
    const heroHeight = stacked ? 220 : 240;
    const hasDrawingCategoryControls = selectedGame.id === "zeichnen-und-erraten" && Boolean(zeichnenUndErratenLobby);
    const categoryPanelHeight = hasDrawingCategoryControls ? 78 : 0;
    const heroBlockHeight = heroHeight + (hasDrawingCategoryControls ? 12 + categoryPanelHeight : 0);
    renderSelectedGamePanel(this, {
      x: contentX,
      y: lowerY,
      width: heroWidth,
      height: heroHeight,
      game: selectedGame,
      playersCount: players.length,
      language
    });

    if (hasDrawingCategoryControls && zeichnenUndErratenLobby) {
      this.renderZeichnenCategoryControls({
        x: contentX,
        y: lowerY + heroHeight + 12,
        width: heroWidth,
        height: categoryPanelHeight,
        lobby: zeichnenUndErratenLobby,
        disabled: roundActive,
        language
      });
    }

    const infoX = stacked ? contentX : contentX + heroWidth + gap;
    const infoY = stacked ? lowerY + heroBlockHeight + 18 : lowerY;
    const infoHeight = stacked ? Math.max(170, this.scale.height - (infoY + this.scrollY) - 24) : heroBlockHeight;
    const guidanceLines = [
      text.playersConnected(players.length, selectedGame.maxPlayers),
      roundActive
        ? text.activeRoundLockedLine
        : selectedGame.id === "arena-survivor"
          ? text.arenaNeedsCharacterLine
          : autoStartsWithReady
            ? text.autoReadyLine
            : text.spaceStartLine,
      selectedGame.id === "minions-td"
        ? text.minionsSetupLine
        : selectedGame.id === "arena-survivor"
            ? roundActive
              ? text.arenaContinuesLine
              : text.arenaReadyLine
        : roundActive
          ? text.afterRoundSwitchLine
          : autoStartsWithReady
            ? text.autoStartsWhenReadyLine
            : text.readyVisibleLine
    ];
    renderInfoPanel(this, {
      x: infoX,
      y: infoY,
      width: stacked ? contentWidth : sideWidth,
      height: infoHeight,
      title: selectedGame.id === "minions-td" ? text.setupFollowsTitle : text.readyToStartTitle,
      lines: guidanceLines,
      accent: getVisualAccent(selectedGame.id),
      language,
      error
    });

    const contentBottom = Math.max(
      pickerBottom + this.scrollY,
      stripBottom + this.scrollY,
      lowerY + heroBlockHeight + this.scrollY,
      infoY + infoHeight + this.scrollY
    );

    if (this.updateScrollBounds(contentBottom)) {
      return;
    }

    renderSceneHeader(this, headerOptions);
    renderScrollBar(this, this.scrollY, this.maxScroll);
  }

  private renderZeichnenCategoryControls(options: {
    x: number;
    y: number;
    width: number;
    height: number;
    lobby: ZeichnenUndErratenLobbyState;
    disabled: boolean;
    language: SupportedLanguage;
  }): void {
    const { x, y, width, height, lobby, disabled, language } = options;
    const en = language === "en";
    const gap = 10;
    const buttonWidth = Math.floor((width - 24 - gap) / 2);

    this.add
      .rectangle(x, y, width, height, 0x08111f, 0.9)
      .setOrigin(0)
      .setStrokeStyle(1, 0x38bdf8, 0.22);
    this.add.text(x + 14, y + 10, en ? "Category" : "Kategorie", {
      fontFamily: hostTheme.titleFont,
      fontSize: "18px",
      color: hostTheme.text
    });

    lobby.categories.forEach((category, index) => {
      const selected = lobby.selectedCategory === category.id;
      const buttonX = x + 12 + index * (buttonWidth + gap);
      const buttonY = y + 36;
      const fill = selected ? 0x0ea5e9 : 0x0b1320;
      const stroke = selected ? 0x7dd3fc : 0xffffff;
      const textColor = selected ? "#082f49" : "#dbeafe";

      this.add
        .rectangle(buttonX, buttonY, buttonWidth, 30, fill, disabled ? 0.58 : 0.96)
        .setOrigin(0)
        .setStrokeStyle(selected ? 2 : 1, stroke, selected ? 0.92 : 0.12);
      this.add.text(buttonX + 12, buttonY + 6, category.label, {
        fontFamily: hostTheme.bodyFont,
        fontSize: "15px",
        color: textColor
      });

      if (disabled) {
        return;
      }

      const zone = this.add.zone(buttonX, buttonY, buttonWidth, 30).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on("pointerdown", () => {
        this.client?.sendGameHostAction("zeichnen-und-erraten", {
          type: "configure-lobby",
          category: category.id
        });
      });
    });
  }
}
