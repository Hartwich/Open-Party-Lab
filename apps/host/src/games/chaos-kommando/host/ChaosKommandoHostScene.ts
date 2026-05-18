import Phaser from "phaser";
import type { ChaosKommandoState } from "@open-party-lab/protocol";
import type { HostSocketClient } from "../../../app/hostSocketClient.js";
import { hostTheme } from "../../../ui/theme/theme.js";
import { ChaosKommandoAudioRig } from "./ChaosKommandoAudio.js";
import {
  chaosKommandoTextureKeys,
  createChaosKommandoRenderState,
  destroyChaosKommandoRenderState,
  ensureChaosKommandoAnimations,
  renderChaosKommandoFrame,
  renderChaosKommandoIdleFrame,
  snapChaosKommandoCamera,
  type ChaosKommandoRenderState
} from "./ChaosKommandoRenderer.js";
import {
  chaosKommandoCarryWeaponAssetPaths,
  chaosKommandoGearAssetPaths,
  marshmallowSheetPaths
} from "./ChaosKommandoVisualConfig.js";

export class ChaosKommandoHostScene extends Phaser.Scene {
  private unsubscribe?: () => void;
  private renderState?: ChaosKommandoRenderState;
  private latestGameState: ChaosKommandoState | null = null;
  private audioRig = new ChaosKommandoAudioRig();
  private headerText?: Phaser.GameObjects.Text;
  private infoText?: Phaser.GameObjects.Text;

  constructor() {
    super("ChaosKommandoHostScene");
  }

  preload(): void {
    this.load.spritesheet(
      chaosKommandoTextureKeys.mercenaries.sprinter,
      marshmallowSheetPaths.cleanB,
      {
        frameWidth: 418,
        frameHeight: 418
      }
    );
    this.load.spritesheet(
      chaosKommandoTextureKeys.mercenaries.grenadier,
      marshmallowSheetPaths.cleanA,
      {
        frameWidth: 418,
        frameHeight: 418
      }
    );
    this.load.spritesheet(
      chaosKommandoTextureKeys.mercenaries["chaos-schuetze"],
      marshmallowSheetPaths.cleanA,
      {
        frameWidth: 418,
        frameHeight: 418
      }
    );
    this.load.svg(
      chaosKommandoTextureKeys.pack,
      chaosKommandoGearAssetPaths.backpack
    );
    this.load.svg(
      chaosKommandoTextureKeys.helmet,
      chaosKommandoGearAssetPaths.helmet
    );
    for (const [weaponId, textureKey] of Object.entries(chaosKommandoTextureKeys.weapons)) {
      this.load.svg(
        textureKey,
        chaosKommandoCarryWeaponAssetPaths[weaponId as keyof typeof chaosKommandoCarryWeaponAssetPaths]
      );
    }
    this.load.svg(
      chaosKommandoTextureKeys.gravestone,
      "/chaos-kommando/environment/gravestone.svg"
    );
  }

  create(): void {
    const client = this.registry.get("hostClient") as HostSocketClient;

    this.cameras.main.setBackgroundColor("#04111f");
    ensureChaosKommandoAnimations(this);
    this.renderState = createChaosKommandoRenderState(this);
    this.headerText = this.add
      .text(34, 24, "", {
        fontFamily: hostTheme.titleFont,
        fontSize: "34px",
        color: "#f8fafc"
      })
      .setDepth(40)
      .setScrollFactor(0);
    this.infoText = this.add
      .text(34, 72, "", {
        fontFamily: hostTheme.bodyFont,
        fontSize: "19px",
        color: "#dbeafe",
        wordWrap: { width: Math.max(320, this.scale.width - 68) },
        lineSpacing: 5
      })
      .setDepth(40)
      .setScrollFactor(0);

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

    this.unsubscribe = client.subscribe((state) => {
      const previousGameState = this.latestGameState;
      this.latestGameState = (state.game?.state ?? null) as ChaosKommandoState | null;

      if (this.latestGameState && this.renderState) {
        snapChaosKommandoCamera(this, this.renderState, this.latestGameState);
      }

      this.audioRig.syncState(previousGameState, this.latestGameState);
      this.syncOverlay();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.unsubscribe?.();
      this.unsubscribe = undefined;
      if (this.renderState) {
        destroyChaosKommandoRenderState(this.renderState);
        this.renderState = undefined;
      }
      this.audioRig.destroy();
      this.headerText?.destroy();
      this.headerText = undefined;
      this.infoText?.destroy();
      this.infoText = undefined;
    });
  }

  update(time: number): void {
    if (!this.renderState) {
      return;
    }

    if (this.latestGameState) {
      renderChaosKommandoFrame(this, this.renderState, this.latestGameState, time);
      this.audioRig.updateChargeLoop(this.latestGameState);
    } else {
      renderChaosKommandoIdleFrame(this, this.renderState, time);
      this.audioRig.updateChargeLoop(null);
    }

    this.syncOverlay();
  }

  private handleResize(): void {
    this.infoText?.setWordWrapWidth(Math.max(320, this.scale.width - 68), true);

    if (this.latestGameState && this.renderState) {
      snapChaosKommandoCamera(this, this.renderState, this.latestGameState);
    }
  }

  private syncOverlay(): void {
    if (!this.headerText || !this.infoText) {
      return;
    }

    const gameState = this.latestGameState;

    if (!gameState) {
      this.headerText.setText("Chaos-Kommando");
      this.infoText.setText("");
      return;
    }

    const currentPlayer = gameState.players.find((player) => player.playerId === gameState.turn.currentPlayerId);
    const turnSeconds = Math.max(0, Math.ceil((gameState.turn.turnEndsAt - Date.now()) / 1000));
    const headline = gameState.winnerName
      ? gameState.winnerName
      : currentPlayer
        ? currentPlayer.name
        : "Chaos-Kommando";

    this.headerText.setText(headline);
    this.infoText.setText(`${turnSeconds}s`);
  }
}
