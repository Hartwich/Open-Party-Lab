import Phaser from "phaser";
import type { AvailableGameDto, PlayerSnapshot, SupportedLanguage } from "@open-party-lab/protocol";
import { bindGameSelectionHotkeys } from "../app/gameHotkeys.js";
import type { HostSocketClient } from "../app/hostSocketClient.js";
import { getHostText } from "../i18n/hostText.js";
import {
  drawArcadeBackdrop,
  getSceneContentFrame,
  measureSceneHeaderBottom,
  renderGameCardGrid,
  renderInfoPanel,
  renderPlayerPanel,
  renderSceneHeader
} from "./gameSelectionUi.js";
import { clampScroll, measureMaxScroll, renderScrollBar } from "./sceneScroll.js";

export class LobbyScene extends Phaser.Scene {
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
    super("LobbyScene");
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

    this.render(
      state.room?.joinUrl ?? "",
      state.room?.code ?? "----",
      state.error,
      state.room?.players ?? [],
      state.room?.availableGames ?? [],
      state.room?.language ?? state.preferredLanguage
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
    joinUrl: string,
    roomCode: string,
    error: string | null,
    players: PlayerSnapshot[],
    availableGames: AvailableGameDto[],
    language: SupportedLanguage
  ): void {
    this.children.removeAll(true);
    drawArcadeBackdrop(this);

    const text = getHostText(language);
    const { x: contentX, width: contentWidth } = getSceneContentFrame(this);
    const headerOptions = {
      title: text.lobbyTitle,
      subtitle: "",
      roomCode,
      joinUrl,
      language
    };
    const headerBottom = measureSceneHeaderBottom(this, headerOptions);
    const bodyY = headerBottom - this.scrollY;
    const stacked = contentWidth < 1_120;
    const gap = 22;
    const sidebarWidth = stacked ? contentWidth : Math.min(320, Math.max(280, Math.floor(contentWidth * 0.28)));
    const mainWidth = stacked ? contentWidth : contentWidth - sidebarWidth - gap;
    const gridBottom = renderGameCardGrid(this, {
      games: availableGames,
      selectedGameId: null,
      x: contentX,
      y: bodyY,
      width: mainWidth,
      variant: "lobby",
      language,
      onSelect: (gameId) => this.client?.selectGame(gameId)
    });

    if (stacked) {
      const playerHeight = Math.max(200, 96 + players.length * (players.length > 6 ? 34 : 40));
      const playerY = gridBottom + 18;
      const infoY = playerY + playerHeight + 18;
      const infoHeight = Math.max(170, this.scale.height - (infoY + this.scrollY) - 28);
      renderPlayerPanel(this, {
        x: contentX,
        y: playerY,
        width: contentWidth,
        height: playerHeight,
        players,
        selectedGameId: null,
        title: text.lobbyPlayersTitle,
        language
      });
      renderInfoPanel(this, {
        x: contentX,
        y: infoY,
        width: contentWidth,
        height: infoHeight,
        title: text.quickStartTitle,
        lines: text.quickStartLines,
        language,
        error
      });
      if (this.updateScrollBounds(infoY + infoHeight + this.scrollY)) {
        return;
      }

      renderSceneHeader(this, headerOptions);
      renderScrollBar(this, this.scrollY, this.maxScroll);
      return;
    }

    const sidebarX = contentX + mainWidth + gap;
    const availableHeight = Math.max(260, this.scale.height - headerBottom - 32);
    const playerHeight = Math.min(
      Math.max(240, 96 + players.length * 44),
      Math.max(240, availableHeight - 178)
    );
    renderPlayerPanel(this, {
      x: sidebarX,
      y: bodyY,
      width: sidebarWidth,
      height: playerHeight,
      players,
      selectedGameId: null,
      title: text.lobbyPlayersTitle,
      language
    });
    renderInfoPanel(this, {
      x: sidebarX,
      y: bodyY + playerHeight + 18,
      width: sidebarWidth,
      height: Math.max(160, availableHeight - playerHeight - 18),
      title: text.quickStartTitle,
      lines: text.quickStartLines,
      language,
      error
    });
    const contentBottom = Math.max(
      gridBottom + this.scrollY,
      bodyY + playerHeight + 18 + Math.max(160, availableHeight - playerHeight - 18) + this.scrollY
    );

    if (this.updateScrollBounds(contentBottom)) {
      return;
    }

    renderSceneHeader(this, headerOptions);
    renderScrollBar(this, this.scrollY, this.maxScroll);
  }
}
