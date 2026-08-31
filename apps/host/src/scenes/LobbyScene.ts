import Phaser from "phaser";
import {
  canManagePlayerRoster,
  type AvailableGameDto,
  type PlayerSnapshot,
  type SupportedLanguage
} from "@open-party-lab/protocol";
import { bindGameSelectionHotkeys } from "../app/gameHotkeys.js";
import type { HostAppState, HostSocketClient } from "../app/hostSocketClient.js";
import { getHostText } from "../i18n/hostText.js";
import {
  clampScroll,
  createSceneRenderScheduler,
  drawArcadeBackdrop,
  getSceneContentFrame,
  measureMaxScroll,
  measureSceneHeaderBottom,
  renderGameCardGrid,
  renderInfoPanel,
  renderPlayerPanel,
  renderSceneHeader,
  renderScrollBar,
  resetSceneDisplay,
  sceneBreakpoint,
  type SceneRenderScheduler
} from "../ui/scene/index.js";
import { describeLobbyState } from "./sceneSignature.js";

const SIDEBAR_GAP = 22;

interface LobbyViewModel {
  joinUrl: string;
  roomCode: string;
  error: string | null;
  players: PlayerSnapshot[];
  availableGames: AvailableGameDto[];
  language: SupportedLanguage;
  canKick: boolean;
}

function toViewModel(state: HostAppState): LobbyViewModel {
  return {
    joinUrl: state.room?.joinUrl ?? "",
    roomCode: state.room?.code ?? "----",
    error: state.error,
    players: state.room?.players ?? [],
    availableGames: state.room?.availableGames ?? [],
    language: state.room?.language ?? state.preferredLanguage,
    canKick: canManagePlayerRoster(state.room)
  };
}

export class LobbyScene extends Phaser.Scene {
  private unsubscribe?: () => void;
  private unbindHotkeys?: () => void;
  private client?: HostSocketClient;
  private scheduler?: SceneRenderScheduler;
  private scrollY = 0;
  private maxScroll = 0;

  private readonly handleResize = () => this.scheduler?.requestForced();

  private readonly handleWheel = (
    _pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ) => {
    if (this.maxScroll <= 0) {
      return;
    }

    const nextScrollY = clampScroll(this.scrollY + deltaY, this.maxScroll);

    if (nextScrollY === this.scrollY) {
      return;
    }

    this.scrollY = nextScrollY;
    this.scheduler?.requestForced();
  };

  constructor() {
    super("LobbyScene");
  }

  create(): void {
    const client = this.registry.get("hostClient") as HostSocketClient;
    const handleStartRound = () => client.startRound();

    this.client = client;
    this.scheduler = createSceneRenderScheduler(this, {
      signature: () => describeLobbyState(client.getState(), this.scrollY, this.scale),
      render: () => this.renderFromState()
    });

    this.unbindHotkeys = bindGameSelectionHotkeys(this, client);
    this.input.keyboard?.on("keydown-SPACE", handleStartRound);
    this.input.on("wheel", this.handleWheel);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize);

    this.unsubscribe = client.subscribe(() => this.scheduler?.request());
    this.scheduler.flush();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
      this.unbindHotkeys?.();
      this.unbindHotkeys = undefined;
      this.scheduler?.destroy();
      this.scheduler = undefined;
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

    this.render(toViewModel(state));
  }

  /**
   * Clamps the scroll offset to the freshly measured content height. Returns
   * true when the offset moved, in which case the caller must abandon the
   * current pass because the layout it just drew is stale.
   */
  private updateScrollBounds(contentBottom: number): boolean {
    this.maxScroll = measureMaxScroll(this, contentBottom);
    const nextScrollY = clampScroll(this.scrollY, this.maxScroll);

    if (nextScrollY === this.scrollY) {
      return false;
    }

    this.scrollY = nextScrollY;
    this.scheduler?.flush();
    return true;
  }

  private render(view: LobbyViewModel): void {
    resetSceneDisplay(this);
    drawArcadeBackdrop(this);

    const text = getHostText(view.language);
    const { x: contentX, width: contentWidth } = getSceneContentFrame(this);
    const headerOptions = {
      title: text.lobbyTitle,
      subtitle: "",
      roomCode: view.roomCode,
      joinUrl: view.joinUrl,
      language: view.language
    };
    const headerBottom = measureSceneHeaderBottom(this, headerOptions);
    const bodyY = headerBottom - this.scrollY;
    const stacked = contentWidth < sceneBreakpoint.stackedSidebar;
    const sidebarWidth = stacked
      ? contentWidth
      : Math.min(340, Math.max(300, Math.floor(contentWidth * 0.28)));
    const mainWidth = stacked ? contentWidth : contentWidth - sidebarWidth - SIDEBAR_GAP;

    const gridBottom = renderGameCardGrid(this, {
      games: view.availableGames,
      selectedGameId: null,
      x: contentX,
      y: bodyY,
      width: mainWidth,
      variant: "lobby",
      language: view.language,
      onSelect: (gameId) => this.client?.selectGame(gameId)
    });

    const onKickPlayer = view.canKick
      ? (playerId: string) => this.client?.kickPlayer(playerId)
      : undefined;

    if (stacked) {
      const playerHeight = Math.max(
        200,
        96 + view.players.length * (view.players.length > 6 ? 34 : 40)
      );
      const playerY = gridBottom + 18;
      const infoY = playerY + playerHeight + 18;
      const infoHeight = Math.max(170, this.scale.height - (infoY + this.scrollY) - 28);

      renderPlayerPanel(this, {
        x: contentX,
        y: playerY,
        width: contentWidth,
        height: playerHeight,
        players: view.players,
        showsPlayerChoice: false,
        title: text.lobbyPlayersTitle,
        language: view.language,
        onKickPlayer
      });
      renderInfoPanel(this, {
        x: contentX,
        y: infoY,
        width: contentWidth,
        height: infoHeight,
        title: text.quickStartTitle,
        lines: text.quickStartLines,
        language: view.language,
        error: view.error
      });

      if (this.updateScrollBounds(infoY + infoHeight + this.scrollY)) {
        return;
      }

      renderSceneHeader(this, headerOptions);
      renderScrollBar(this, this.scrollY, this.maxScroll);
      return;
    }

    const sidebarX = contentX + mainWidth + SIDEBAR_GAP;
    const availableHeight = Math.max(260, this.scale.height - headerBottom - 32);
    const playerHeight = Math.min(
      Math.max(240, 96 + view.players.length * 44),
      Math.max(240, availableHeight - 178)
    );
    const infoHeight = Math.max(160, availableHeight - playerHeight - 18);

    renderPlayerPanel(this, {
      x: sidebarX,
      y: bodyY,
      width: sidebarWidth,
      height: playerHeight,
      players: view.players,
      showsPlayerChoice: false,
      title: text.lobbyPlayersTitle,
      language: view.language,
      onKickPlayer
    });
    renderInfoPanel(this, {
      x: sidebarX,
      y: bodyY + playerHeight + 18,
      width: sidebarWidth,
      height: infoHeight,
      title: text.quickStartTitle,
      lines: text.quickStartLines,
      language: view.language,
      error: view.error
    });

    const contentBottom = Math.max(
      gridBottom + this.scrollY,
      bodyY + playerHeight + 18 + infoHeight + this.scrollY
    );

    if (this.updateScrollBounds(contentBottom)) {
      return;
    }

    renderSceneHeader(this, headerOptions);
    renderScrollBar(this, this.scrollY, this.maxScroll);
  }
}
