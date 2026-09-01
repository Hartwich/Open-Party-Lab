import Phaser from "phaser";
import { HOST_THEME_REGISTRY_KEY } from "@open-party-lab/game-core";
import { hostTheme, partyTheme } from "../ui/theme/theme.js";
import { mountDebugOverlay } from "./debugOverlay.js";
import { mountHudOverlay } from "./hudOverlay.js";
import { mountFullscreenOverlay } from "./fullscreenOverlay.js";
import { mountScreenWakeLock } from "./screenWakeLock.js";
import { mountBackgroundMusic } from "./backgroundMusic.js";
import { createHostRouter } from "./router.js";
import { HostSocketClient, type HostAppState } from "./hostSocketClient.js";
import { mountJoinOverlay } from "./joinOverlay.js";
import { mountHostControlOverlay } from "./hostControlOverlay.js";
import {
  applyHostFps,
  createHostFpsConfig,
  mountHostControlsOverlay,
  readHostFpsPreference
} from "./hostControlsOverlay.js";
import { BootScene } from "../scenes/BootScene.js";
import { mountHostShell } from "../shell/hostShell.js";
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
  if (import.meta.env.PROD || window.location.port === "3000") {
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

export function bootstrapHostApp(requestedRoomCode: string | null = null): Phaser.Game {
  const serverUrl = import.meta.env.VITE_SERVER_URL ?? resolveDefaultServerUrl();
  const hostClient = new HostSocketClient(serverUrl, requestedRoomCode);
  const preferredFps = readHostFpsPreference();
  const fpsConfig = createHostFpsConfig(preferredFps);

  const game = new Phaser.Game({
    // Canvas keeps SVG-backed game art reliable across Chromium/WebGL driver combinations.
    type: Phaser.CANVAS,
    parent: "app",
    width: 1280,
    height: 720,
    backgroundColor: hostTheme.background,
    fps: fpsConfig,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      // Fractional canvas dimensions make the browser resample the whole frame.
      // Rounding them away removes a layer of softness that no per-object
      // setting can undo.
      autoRound: true
    },
    scene: [BootScene, ...externalHostScenes]
  });

  applyHostFps(game, preferredFps);
  game.registry.set("hostClient", hostClient);
  // Games paint with the same tokens as the platform. The object is mutated in
  // place on a theme switch, so one registry entry is enough for the lifetime
  // of the app.
  game.registry.set(HOST_THEME_REGISTRY_KEY, partyTheme);
  // The canvas clear colour is set once at construction, so it has to be
  // refreshed whenever the room switches theme.
  hostClient.subscribe(() => {
    if (hostClient.consumeThemeChange()) {
      game.scene.getScenes(true).forEach((scene) => scene.scene.restart());
      game.canvas.style.background = hostTheme.background;
    }
  });
  createHostRouter(game, hostClient);
  mountHostShell(hostClient);
  mountJoinOverlay(hostClient);
  mountHudOverlay(hostClient);
  mountDebugOverlay(game, hostClient);
  mountHostControlsOverlay(game, hostClient);
  mountHostControlOverlay(hostClient);
  mountFullscreenOverlay(hostClient);
  mountScreenWakeLock();
  mountBackgroundMusic(hostClient);
  exposeHostAutomationBridge(hostClient);
  hostClient.connect();

  return game;
}
