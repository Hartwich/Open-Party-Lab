import Phaser from "phaser";
import {
  canManagePlayerRoster,
  hasActiveRound,
  type AvailableGameDto,
  type PlayerSnapshot,
  type SupportedLanguage
} from "@open-party-lab/protocol";
import { bindGameSelectionHotkeys } from "../app/gameHotkeys.js";
import type { HostAppState, HostSocketClient } from "../app/hostSocketClient.js";
import { requiresReadyAutoStart } from "../app/roundStartPolicy.js";
import { getHostText } from "../i18n/hostText.js";
import type { GameHostChromeOptions } from "@open-party-lab/game-core";
import { getVisualAccent } from "../games/gameVisuals.js";
import { getSelectedGameChrome } from "../games/selectedGame.js";
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
  renderPlayerStrip,
  renderSceneHeader,
  renderScrollBar,
  renderSelectedGamePanel,
  resetSceneDisplay,
  sceneBreakpoint,
  type SceneHeaderOptions,
  type SceneRenderScheduler
} from "../ui/scene/index.js";
import { renderBackToMenuButton } from "./gameSelect/backToMenuButton.js";
import {
  hasLobbySetup,
  measureLobbySetupHeight,
  renderLobbySetupControls
} from "./gameSelect/lobbySetupControls.js";
import {
  hasPlayerSetupRoster,
  measurePlayerSetupRosterHeight,
  queuePlayerSetupTextures,
  renderPlayerSetupRoster
} from "./gameSelect/playerSetupLobby.js";
import { describeGameSelectState } from "./sceneSignature.js";

const COLUMN_GAP = 22;
const SETUP_GAP = 20;

/** Everything the scene draws, resolved once per render. */
interface GameSelectViewModel {
  selectedGame: AvailableGameDto | undefined;
  players: PlayerSnapshot[];
  availableGames: AvailableGameDto[];
  error: string | null;
  roomCode: string;
  roundActive: boolean;
  language: SupportedLanguage;
  settings: Record<string, string | number | boolean>;
  canKick: boolean;
  /** Chrome preferences of the selected game, merged with platform defaults. */
  chrome: Required<GameHostChromeOptions>;
}

function toViewModel(state: HostAppState): GameSelectViewModel {
  return {
    selectedGame: state.room?.availableGames.find((game) => game.id === state.room?.selectedGameId),
    players: state.room?.players ?? [],
    availableGames: state.room?.availableGames ?? [],
    error: state.error,
    roomCode: state.room?.code ?? "----",
    roundActive: hasActiveRound(state.room),
    language: state.room?.language ?? state.preferredLanguage,
    settings: state.room?.selectedGameSettings ?? {},
    canKick: canManagePlayerRoster(state.room),
    chrome: getSelectedGameChrome(state)
  };
}

export class GameSelectScene extends Phaser.Scene {
  private unsubscribe?: () => void;
  private unbindHotkeys?: () => void;
  private client?: HostSocketClient;
  private scheduler?: SceneRenderScheduler;
  private scrollY = 0;
  private maxScroll = 0;
  private readonly requestedSetupTextures = new Set<string>();

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
    super("GameSelectScene");
  }

  create(): void {
    const client = this.registry.get("hostClient") as HostSocketClient;
    const handleStartRound = () => client.startRound();

    this.client = client;
    this.scheduler = createSceneRenderScheduler(this, {
      signature: () => describeGameSelectState(client.getState(), this.scrollY, this.scale),
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

    const view = toViewModel(state);
    resetSceneDisplay(this);

    drawArcadeBackdrop(this);

    if (view.selectedGame && hasPlayerSetupRoster(view.selectedGame)) {
      this.renderSetupLobby(view, view.selectedGame);
      return;
    }

    if (view.selectedGame && hasLobbySetup(view.selectedGame)) {
      this.renderGameLobby(view, view.selectedGame);
      return;
    }

    this.renderCatalog(view);
  }

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

  private finishRender(headerOptions: SceneHeaderOptions, contentBottom: number): void {
    if (this.updateScrollBounds(contentBottom)) {
      return;
    }

    renderSceneHeader(this, headerOptions);
    renderScrollBar(this, this.scrollY, this.maxScroll);
  }

  private kickHandler(view: GameSelectViewModel): ((playerId: string) => void) | undefined {
    return view.canKick ? (playerId: string) => this.client?.kickPlayer(playerId) : undefined;
  }

  private sendHostAction = (gameId: string, action: unknown): void => {
    this.client?.sendGameHostAction(gameId, action);
  };

  private goBackToMenu = (): void => {
    this.client?.returnToGameSelection();
  };

  /**
   * Catalog view: the game grid with the player roster alongside it.
   *
   * On wide screens the roster is a right-hand sidebar with kick buttons; when
   * the window is too narrow for a sidebar it falls back to the compact chip
   * strip underneath the grid.
   */
  private renderCatalog(view: GameSelectViewModel): void {
    const text = getHostText(view.language);
    const autoStartsWithReady = requiresReadyAutoStart(view.selectedGame);
    const { x: contentX, width: contentWidth } = getSceneContentFrame(this);
    const headerOptions: SceneHeaderOptions = {
      title: view.selectedGame?.displayName ?? text.gameSelectionFallback,
      subtitle: view.roundActive
        ? text.gameSelectRoundActiveSubtitle
        : autoStartsWithReady
          ? text.gameSelectAutoReadySubtitle
          : text.gameSelectClassicSubtitle,
      roomCode: view.roomCode,
      showRoomCode: view.chrome.roomCode,
      language: view.language
    };
    const headerBottom = measureSceneHeaderBottom(this, headerOptions);
    const bodyY = headerBottom - this.scrollY;
    const sidebarVisible = contentWidth >= sceneBreakpoint.stackedSidebar;
    const sidebarWidth = sidebarVisible
      ? Math.min(340, Math.max(300, Math.floor(contentWidth * 0.26)))
      : 0;
    const mainWidth = sidebarVisible ? contentWidth - sidebarWidth - COLUMN_GAP : contentWidth;

    const pickerBottom = renderGameCardGrid(this, {
      games: view.availableGames,
      selectedGameId: view.selectedGame?.id ?? null,
      x: contentX,
      y: bodyY,
      width: mainWidth,
      variant: "compact",
      language: view.language,
      onSelect: view.roundActive ? undefined : (gameId) => this.client?.selectGame(gameId)
    });

    let rosterBottom = pickerBottom;

    if (sidebarVisible) {
      const availableHeight = Math.max(260, this.scale.height - headerBottom - 32);
      const rosterHeight = Math.min(
        Math.max(240, 96 + view.players.length * 44),
        Math.max(240, availableHeight)
      );

      renderPlayerPanel(this, {
        x: contentX + mainWidth + COLUMN_GAP,
        y: bodyY,
        width: sidebarWidth,
        height: rosterHeight,
        players: view.players,
        showsPlayerChoice: hasPlayerSetupRoster(view.selectedGame),
        title: text.playerStatusTitle,
        language: view.language,
        onKickPlayer: this.kickHandler(view)
      });
      rosterBottom = Math.max(pickerBottom, bodyY + rosterHeight);
    } else {
      rosterBottom = renderPlayerStrip(this, {
        x: contentX,
        y: pickerBottom + 14,
        width: contentWidth,
        players: view.players,
        showsPlayerChoice: hasPlayerSetupRoster(view.selectedGame),
        title: text.playerStatusTitle,
        language: view.language
      });
    }

    const lowerY = rosterBottom + 16;

    if (!view.selectedGame) {
      const infoHeight = Math.max(150, this.scale.height - (lowerY + this.scrollY) - 28);

      renderInfoPanel(this, {
        x: contentX,
        y: lowerY,
        width: mainWidth,
        height: infoHeight,
        title: text.noActiveGameTitle,
        lines: [
          text.noActiveGameSelectLine,
          view.roundActive ? text.noActiveGameRoundActiveLine : text.noActiveGameStartLine
        ],
        language: view.language,
        error: view.error
      });
      this.finishRender(headerOptions, lowerY + infoHeight + this.scrollY);
      return;
    }

    const selectedGame = view.selectedGame;
    const stacked = mainWidth < sceneBreakpoint.stackedGameSelect;
    const sideWidth = stacked
      ? mainWidth
      : Math.min(360, Math.max(300, Math.floor(mainWidth * 0.34)));
    const heroWidth = stacked ? mainWidth : mainWidth - sideWidth - COLUMN_GAP;
    const heroHeight = stacked ? 220 : 240;
    const setupVisible = hasLobbySetup(selectedGame);
    const setupHeight = setupVisible ? measureLobbySetupHeight(selectedGame, heroWidth) : 0;
    const heroBlockHeight = heroHeight + (setupVisible ? 12 + setupHeight : 0);

    renderSelectedGamePanel(this, {
      x: contentX,
      y: lowerY,
      width: heroWidth,
      height: heroHeight,
      game: selectedGame,
      playersCount: view.players.length,
      language: view.language
    });

    if (setupVisible) {
      renderLobbySetupControls(this, {
        x: contentX,
        y: lowerY + heroHeight + 12,
        width: heroWidth,
        height: setupHeight,
        game: selectedGame,
        settings: view.settings,
        disabled: view.roundActive,
        language: view.language,
        onHostAction: this.sendHostAction
      });
    }

    const infoX = stacked ? contentX : contentX + heroWidth + COLUMN_GAP;
    const infoY = stacked ? lowerY + heroBlockHeight + 18 : lowerY;
    const infoHeight = stacked
      ? Math.max(170, this.scale.height - (infoY + this.scrollY) - 24)
      : heroBlockHeight;

    renderInfoPanel(this, {
      x: infoX,
      y: infoY,
      width: sideWidth,
      height: infoHeight,
      title: setupVisible ? text.setupFollowsTitle : text.readyToStartTitle,
      lines: this.buildGuidanceLines(view, selectedGame, setupVisible, autoStartsWithReady),
      accent: getVisualAccent(selectedGame),
      language: view.language,
      error: view.error
    });

    this.finishRender(
      headerOptions,
      Math.max(
        pickerBottom + this.scrollY,
        rosterBottom + this.scrollY,
        lowerY + heroBlockHeight + this.scrollY,
        infoY + infoHeight + this.scrollY
      )
    );
  }

  private buildGuidanceLines(
    view: GameSelectViewModel,
    game: AvailableGameDto,
    setupVisible: boolean,
    autoStartsWithReady: boolean
  ): string[] {
    const text = getHostText(view.language);
    const startLine = view.roundActive
      ? text.activeRoundLockedLine
      : autoStartsWithReady
        ? text.autoReadyLine
        : text.spaceStartLine;
    const followUpLine = setupVisible
      ? (game.lobbySetup?.description ?? text.setupControlsLine)
      : view.roundActive
        ? text.afterRoundSwitchLine
        : autoStartsWithReady
          ? text.autoStartsWhenReadyLine
          : text.readyVisibleLine;

    return [text.playersConnected(view.players.length, game.maxPlayers), startLine, followUpLine];
  }

  /**
   * Focused lobby for games that bring their own setup fields: no catalog on
   * top, just the game, its roster and its settings.
   */
  private renderGameLobby(view: GameSelectViewModel, game: AvailableGameDto): void {
    const text = getHostText(view.language);
    const autoStartsWithReady = requiresReadyAutoStart(game);
    const { x: contentX, width: contentWidth } = getSceneContentFrame(this);
    const headerOptions: SceneHeaderOptions = {
      title: game.displayName,
      subtitle: view.roundActive
        ? text.gameSelectRoundActiveSubtitle
        : (game.lobbySetup?.description ?? text.gameLobbySubtitle),
      roomCode: view.roomCode,
      showRoomCode: view.chrome.roomCode,
      language: view.language
    };
    const headerBottom = measureSceneHeaderBottom(this, headerOptions);
    const bodyY = headerBottom - this.scrollY;

    const backBottom = renderBackToMenuButton(this, {
      x: contentX,
      y: bodyY,
      width: contentWidth,
      language: view.language,
      onBack: this.goBackToMenu
    });

    const stacked = contentWidth < sceneBreakpoint.stackedGameSelect;
    const sideWidth = stacked
      ? contentWidth
      : Math.min(380, Math.max(300, Math.floor(contentWidth * 0.34)));
    const mainWidth = stacked ? contentWidth : contentWidth - sideWidth - COLUMN_GAP;
    const rosterHeight = Math.max(200, 96 + view.players.length * 42);

    renderPlayerPanel(this, {
      x: contentX,
      y: backBottom + 12,
      width: contentWidth,
      height: rosterHeight,
      players: view.players,
      showsPlayerChoice: hasPlayerSetupRoster(game),
      title: text.playerStatusTitle,
      language: view.language,
      onKickPlayer: this.kickHandler(view)
    });

    const lowerY = backBottom + 12 + rosterHeight + 16;
    const heroHeight = stacked ? 210 : 236;
    const setupHeight = measureLobbySetupHeight(game, mainWidth);

    renderSelectedGamePanel(this, {
      x: contentX,
      y: lowerY,
      width: mainWidth,
      height: heroHeight,
      game,
      playersCount: view.players.length,
      language: view.language
    });
    renderLobbySetupControls(this, {
      x: contentX,
      y: lowerY + heroHeight + 12,
      width: mainWidth,
      height: setupHeight,
      game,
      settings: view.settings,
      disabled: view.roundActive,
      language: view.language,
      onHostAction: this.sendHostAction
    });

    const mainBlockHeight = heroHeight + 12 + setupHeight;
    const infoX = stacked ? contentX : contentX + mainWidth + COLUMN_GAP;
    const infoY = stacked ? lowerY + mainBlockHeight + 18 : lowerY;
    const infoHeight = stacked
      ? Math.max(170, this.scale.height - (infoY + this.scrollY) - 24)
      : mainBlockHeight;

    renderInfoPanel(this, {
      x: infoX,
      y: infoY,
      width: sideWidth,
      height: infoHeight,
      title: text.gameLobbySetupTitle,
      lines: [
        text.playersConnected(view.players.length, game.maxPlayers),
        view.roundActive
          ? text.activeRoundLockedLine
          : autoStartsWithReady
            ? text.autoReadyLine
            : text.spaceStartLine,
        game.lobbySetup?.description ?? text.setupControlsLine
      ],
      accent: getVisualAccent(game),
      language: view.language,
      error: view.error
    });

    this.finishRender(
      headerOptions,
      Math.max(lowerY + mainBlockHeight, infoY + infoHeight) + this.scrollY
    );
  }

  /**
   * Setup lobby for games whose players pick something before the round: the
   * roster on the left, the game's own settings panel on the right.
   */
  private renderSetupLobby(view: GameSelectViewModel, game: AvailableGameDto): void {
    const text = getHostText(view.language);
    const autoStartsWithReady = requiresReadyAutoStart(game);

    queuePlayerSetupTextures(this, game, view.settings, this.requestedSetupTextures, () =>
      this.scheduler?.requestForced()
    );

    const { x: contentX, width: contentWidth } = getSceneContentFrame(this);
    const headerOptions: SceneHeaderOptions = {
      title: game.displayName,
      subtitle: view.roundActive
        ? text.gameSelectRoundActiveSubtitle
        : (game.playerSetup?.description ?? game.lobbySetup?.description ?? text.gameLobbySubtitle),
      roomCode: view.roomCode,
      showRoomCode: view.chrome.roomCode,
      language: view.language
    };
    const headerBottom = measureSceneHeaderBottom(this, headerOptions);
    const bodyY = headerBottom - this.scrollY;
    const stacked = contentWidth < sceneBreakpoint.stackedSetupLobby;
    const setupWidth = stacked
      ? contentWidth
      : Math.min(390, Math.max(330, Math.floor(contentWidth * 0.34)));
    const rosterWidth = stacked ? contentWidth : contentWidth - setupWidth - SETUP_GAP;
    const rosterHeight = measurePlayerSetupRosterHeight(rosterWidth, view.players.length);

    const rosterBottom = renderPlayerSetupRoster(this, {
      x: contentX,
      y: bodyY,
      width: rosterWidth,
      height: rosterHeight,
      game,
      players: view.players,
      settings: view.settings,
      language: view.language,
      onBack: this.goBackToMenu
    });

    const setupX = stacked ? contentX : contentX + rosterWidth + SETUP_GAP;
    const setupY = stacked ? rosterBottom + 18 : bodyY;
    const setupVisible = hasLobbySetup(game);
    const setupHeight = setupVisible ? measureLobbySetupHeight(game, setupWidth) : 0;

    if (setupVisible) {
      renderLobbySetupControls(this, {
        x: setupX,
        y: setupY,
        width: setupWidth,
        height: setupHeight,
        game,
        settings: view.settings,
        disabled: view.roundActive,
        language: view.language,
        onHostAction: this.sendHostAction
      });
    }

    const chosenCount = view.players.filter(
      (player) => player.selectedCharacterId !== null
    ).length;
    const infoY = setupY + setupHeight + (setupVisible ? 16 : 0);
    const infoHeight = 132;

    renderInfoPanel(this, {
      x: setupX,
      y: infoY,
      width: setupWidth,
      height: infoHeight,
      title: setupVisible ? text.setupFollowsTitle : text.readyToStartTitle,
      lines: [
        text.playersConnected(view.players.length, game.maxPlayers),
        chosenCount < view.players.length
          ? text.setupChoicePendingLine
          : view.roundActive
            ? text.activeRoundLockedLine
            : autoStartsWithReady
              ? text.autoReadyLine
              : text.spaceStartLine
      ],
      accent: getVisualAccent(game),
      language: view.language,
      error: view.error
    });

    this.finishRender(
      headerOptions,
      Math.max(rosterBottom, setupY + setupHeight, infoY + infoHeight) + this.scrollY
    );
  }
}
