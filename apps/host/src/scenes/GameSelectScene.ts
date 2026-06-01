import Phaser from "phaser";
import {
  hasActiveRound,
  type AvailableGameDto,
  type PlayerSnapshot,
  type SupportedLanguage
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
      state.room?.selectedGameSettings
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
    selectedGameSettings?: Record<string, string | number | boolean>
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
    const hasLobbySetupControls = Boolean(selectedGame.lobbySetup?.fields.length);
    const setupPanelHeight = hasLobbySetupControls
      ? this.measureLobbySetupHeight(selectedGame)
      : 0;
    const heroBlockHeight = heroHeight + (hasLobbySetupControls ? 12 + setupPanelHeight : 0);
    renderSelectedGamePanel(this, {
      x: contentX,
      y: lowerY,
      width: heroWidth,
      height: heroHeight,
      game: selectedGame,
      playersCount: players.length,
      language
    });

    if (hasLobbySetupControls && selectedGame.lobbySetup) {
      this.renderLobbySetupControls({
        x: contentX,
        y: lowerY + heroHeight + 12,
        width: heroWidth,
        height: setupPanelHeight,
        game: selectedGame,
        settings: selectedGameSettings ?? {},
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

  private measureLobbySetupHeight(game: AvailableGameDto): number {
    const fields = game.lobbySetup?.fields ?? [];

    return 54 + fields.reduce((height, field) => {
      if (field.kind === "select") {
        return height + 46;
      }

      if (field.kind === "number") {
        return height + 58;
      }

      return height;
    }, 0);
  }

  private renderLobbySetupControls(options: {
    x: number;
    y: number;
    width: number;
    height: number;
    game: AvailableGameDto;
    settings: Record<string, string | number | boolean>;
    disabled: boolean;
    language: SupportedLanguage;
  }): void {
    const { x, y, width, height, game, settings, disabled, language } = options;
    const en = language === "en";
    const fields = game.lobbySetup?.fields ?? [];

    this.add
      .rectangle(x, y, width, height, 0x08111f, 0.9)
      .setOrigin(0)
      .setStrokeStyle(1, 0x38bdf8, 0.22);
    this.add.text(x + 14, y + 10, game.lobbySetup?.title ?? (en ? "Setup" : "Setup"), {
      fontFamily: hostTheme.titleFont,
      fontSize: "18px",
      color: hostTheme.text
    });

    if (game.lobbySetup?.description) {
      this.add.text(x + 14, y + 32, game.lobbySetup.description, {
        fontFamily: hostTheme.bodyFont,
        fontSize: "12px",
        color: "#94a3b8",
        wordWrap: { width: width - 28 }
      });
    }

    let cursorY = y + 58;

    fields.forEach((field) => {
      if (field.kind === "select") {
        this.renderLobbySelectField({
          x: x + 12,
          y: cursorY,
          width: width - 24,
          game,
          field,
          value: settings[field.settingKey ?? field.id] ?? field.defaultValue,
          disabled
        });
        cursorY += 46;
        return;
      }

      if (field.kind === "number") {
        this.renderLobbyNumberField({
          x: x + 12,
          y: cursorY,
          width: width - 24,
          game,
          field,
          value: settings[field.settingKey ?? field.id] ?? field.defaultValue,
          disabled
        });
        cursorY += 58;
      }
    });
  }

  private renderLobbySelectField(options: {
    x: number;
    y: number;
    width: number;
    game: AvailableGameDto;
    field: NonNullable<AvailableGameDto["lobbySetup"]>["fields"][number] & { kind: "select" };
    value: string | number | boolean;
    disabled: boolean;
  }): void {
    const { x, y, width, game, field, value, disabled } = options;
    const gap = 10;
    const optionCount = Math.max(1, field.options.length);
    const buttonWidth = Math.floor((width - gap * (optionCount - 1)) / optionCount);

    field.options.forEach((option, index) => {
      const selected = value === option.id;
      const buttonX = x + index * (buttonWidth + gap);
      const buttonY = y;
      const fill = selected ? 0x0ea5e9 : 0x0b1320;
      const stroke = selected ? 0x7dd3fc : 0xffffff;
      const textColor = selected ? "#082f49" : "#dbeafe";

      this.add
        .rectangle(buttonX, buttonY, buttonWidth, 30, fill, disabled ? 0.58 : 0.96)
        .setOrigin(0)
        .setStrokeStyle(selected ? 2 : 1, stroke, selected ? 0.92 : 0.12);
      this.add.text(buttonX + 12, buttonY + 6, option.label, {
        fontFamily: hostTheme.bodyFont,
        fontSize: "15px",
        color: textColor
      });

      if (disabled) {
        return;
      }

      const zone = this.add.zone(buttonX, buttonY, buttonWidth, 30).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on("pointerdown", () => {
        this.client?.sendGameHostAction(game.id, {
          type: "configure-lobby",
          [field.actionKey ?? field.id]: option.id
        });
      });
    });
  }

  private renderLobbyNumberField(options: {
    x: number;
    y: number;
    width: number;
    game: AvailableGameDto;
    field: NonNullable<AvailableGameDto["lobbySetup"]>["fields"][number] & { kind: "number" };
    value: string | number | boolean;
    disabled: boolean;
  }): void {
    const { x, y, width, game, field, value, disabled } = options;
    const numericValue = typeof value === "number" && Number.isFinite(value) ? value : field.defaultValue;

    this.add.text(x, y, field.label, {
      fontFamily: hostTheme.bodyFont,
      fontSize: "14px",
      color: "#cbd5e1"
    });

    const controlY = y + 20;
    const buttonSize = 30;
    const valueWidth = Math.max(84, width - buttonSize * 2 - 20);
    const sendValue = (nextValue: number) => {
      this.client?.sendGameHostAction(game.id, {
        type: "configure-lobby",
        [field.actionKey ?? field.id]: Math.max(field.min, Math.min(field.max, nextValue))
      });
    };

    this.renderLobbySmallButton(x, controlY, buttonSize, "-", !disabled && numericValue > field.min, () => {
      sendValue(numericValue - field.step);
    });
    this.add
      .rectangle(x + buttonSize + 10, controlY, valueWidth, buttonSize, 0x0b1320, 0.96)
      .setOrigin(0)
      .setStrokeStyle(1, 0xffffff, 0.12);
    this.add.text(x + buttonSize + 10 + valueWidth / 2, controlY + buttonSize / 2, `${numericValue}`, {
      fontFamily: hostTheme.titleFont,
      fontSize: "17px",
      color: "#dbeafe"
    }).setOrigin(0.5);
    this.renderLobbySmallButton(x + width - buttonSize, controlY, buttonSize, "+", !disabled && numericValue < field.max, () => {
      sendValue(numericValue + field.step);
    });
  }

  private renderLobbySmallButton(
    x: number,
    y: number,
    size: number,
    label: string,
    enabled: boolean,
    onClick: () => void
  ): void {
    this.add
      .rectangle(x, y, size, size, enabled ? 0x0ea5e9 : 0x0b1320, enabled ? 0.96 : 0.58)
      .setOrigin(0)
      .setStrokeStyle(1, enabled ? 0x7dd3fc : 0xffffff, enabled ? 0.92 : 0.12);
    this.add.text(x + size / 2, y + size / 2, label, {
      fontFamily: hostTheme.titleFont,
      fontSize: "18px",
      color: enabled ? "#082f49" : "#64748b"
    }).setOrigin(0.5);

    if (!enabled) {
      return;
    }

    this.add.zone(x, y, size, size).setOrigin(0).setInteractive({ useHandCursor: true }).on("pointerdown", onClick);
  }
}
