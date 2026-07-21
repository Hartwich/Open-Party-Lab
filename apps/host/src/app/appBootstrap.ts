import Phaser from "phaser";
import { hostTheme } from "../ui/theme/theme.js";
import { mountDebugOverlay } from "./debugOverlay.js";
import { mountHudOverlay } from "./hudOverlay.js";
import { mountFullscreenOverlay } from "./fullscreenOverlay.js";
import { mountScreenWakeLock } from "./screenWakeLock.js";
import { mountBackgroundMusic } from "./backgroundMusic.js";
import { createHostRouter } from "./router.js";
import { HostSocketClient, type HostAppState } from "./hostSocketClient.js";
import { mountJoinOverlay } from "./joinOverlay.js";
import {
  applyHostFps,
  createHostFpsConfig,
  mountHostControlsOverlay,
  readHostFpsPreference
} from "./hostControlsOverlay.js";
import { BootScene } from "../scenes/BootScene.js";
import { LobbyScene } from "../scenes/LobbyScene.js";
import { GameSelectScene } from "../scenes/GameSelectScene.js";
import { RoundIntroScene } from "../scenes/RoundIntroScene.js";
import { ScoreboardScene } from "../scenes/ScoreboardScene.js";
import { externalHostScenes } from "../games/.generated/externalGames.js";

interface HostAutomationBridge {
  getState: () => HostAppState;
  kickPlayer: (playerId: string) => void;
  returnToGameSelection: () => void;
  selectGame: (gameId: string) => void;
  sendGameHostAction: (gameId: string, action: unknown) => void;
  startRound: () => void;
}

declare global {
  interface Window {
    __openPartyLabHost?: HostAutomationBridge;
  }
}

function exposeHostAutomationBridge(hostClient: HostSocketClient): void {
  if (!import.meta.env.DEV) {
    return;
  }

  window.__openPartyLabHost = {
    getState: () => hostClient.getState(),
    kickPlayer: (playerId) => hostClient.kickPlayer(playerId),
    returnToGameSelection: () => hostClient.returnToGameSelection(),
    selectGame: (gameId) => hostClient.selectGame(gameId),
    sendGameHostAction: (gameId, action) => hostClient.sendGameHostAction(gameId, action),
    startRound: () => hostClient.startRound()
  };
}

function resolveDefaultServerUrl(): string {
  if (window.location.port === "3000") {
    return window.location.origin;
  }

  const hostname = window.location.hostname;

  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return "http://localhost:3000";
  }

  const host = hostname.includes(":") ? `[${hostname}]` : hostname;
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  return `${protocol}//${host}:3000`;
}

export function bootstrapHostApp(): Phaser.Game {
  const serverUrl = import.meta.env.VITE_SERVER_URL ?? resolveDefaultServerUrl();
  const hostClient = new HostSocketClient(serverUrl);
  const preferredFps = readHostFpsPreference();
  const fpsConfig = createHostFpsConfig(preferredFps);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "app",
    width: 1280,
    height: 720,
    backgroundColor: hostTheme.background,
    fps: fpsConfig,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
      BootScene,
      LobbyScene,
      GameSelectScene,
      RoundIntroScene,
      ScoreboardScene,
      ...externalHostScenes
    ]
  });

  applyHostFps(game, preferredFps);
  game.registry.set("hostClient", hostClient);
  createHostRouter(game, hostClient);
  mountJoinOverlay(hostClient);
  mountHudOverlay(hostClient);
  mountDebugOverlay(game, hostClient);
  mountHostControlsOverlay(game, hostClient);
  mountFullscreenOverlay(hostClient);
  mountScreenWakeLock();
  mountBackgroundMusic(hostClient);
  exposeHostAutomationBridge(hostClient);
  hostClient.connect();

  return game;
}
