import Phaser from "phaser";
import { hostTheme } from "../../../ui/theme/theme.js";
import { ChaosKommandoRigLabScene } from "./ChaosKommandoRigLabScene.js";
import { mountChaosKommandoRigLabOverlay } from "./ChaosKommandoRigLabOverlay.js";
import { ChaosKommandoRigLabStore } from "./chaosKommandoRigLabState.js";

export function bootstrapChaosKommandoRigLab(): Phaser.Game {
  const store = new ChaosKommandoRigLabStore();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "app",
    width: 1280,
    height: 720,
    backgroundColor: hostTheme.background,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [new ChaosKommandoRigLabScene(store)]
  });

  const cleanupOverlay = mountChaosKommandoRigLabOverlay(store);

  game.events.once(Phaser.Core.Events.DESTROY, () => {
    cleanupOverlay();
  });

  return game;
}
