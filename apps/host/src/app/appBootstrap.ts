import Phaser from "phaser";
import { hostTheme } from "../ui/theme/theme.js";
import { mountDebugOverlay } from "./debugOverlay.js";
import { mountHudOverlay } from "./hudOverlay.js";
import { mountFullscreenOverlay } from "./fullscreenOverlay.js";
import { mountScreenWakeLock } from "./screenWakeLock.js";
import { mountBackgroundMusic } from "./backgroundMusic.js";
import { createHostRouter } from "./router.js";
import { HostSocketClient } from "./hostSocketClient.js";
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
import { ChaosKommandoHostScene } from "../games/chaos-kommando/host/ChaosKommandoHostScene.js";
import { externalHostScenes } from "../games/.generated/externalGames.js";

export function bootstrapHostApp(): Phaser.Game {
  const serverUrl = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3000";
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
      ChaosKommandoHostScene,
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
  hostClient.connect();

  return game;
}
