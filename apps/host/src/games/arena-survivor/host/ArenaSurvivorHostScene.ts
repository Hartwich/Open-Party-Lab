import Phaser from "phaser";
import type { ArenaSurvivorState } from "@open-party-lab/protocol";
import type { HostSocketClient } from "../../../app/hostSocketClient.js";
import {
  createArenaSurvivorSpriteLayer,
  applyArenaSurvivorCamera,
  drawArenaSurvivorBackground,
  drawArenaSurvivorEntities,
  resolveArenaSurvivorRenderMeta,
  syncArenaSurvivorSpriteLayer
} from "./ArenaSurvivorRenderer.js";
import { createArenaHud } from "../hud/ArenaHud.js";
import { loadArenaSurvivorAssets, resolveArenaSurvivorBackgroundKey } from "./arenaSurvivorAssets.js";

export class ArenaSurvivorHostScene extends Phaser.Scene {
  private unsubscribe?: () => void;
  private arenaBackground?: Phaser.GameObjects.Image;
  private arenaGraphics?: Phaser.GameObjects.Graphics;
  private entityGraphics?: Phaser.GameObjects.Graphics;
  private hud?: ReturnType<typeof createArenaHud>;
  private spriteLayer = createArenaSurvivorSpriteLayer();
  private lastRoundNumber: number | null = null;
  private lastViewportKey = "";

  constructor() {
    super("ArenaSurvivorHostScene");
  }

  preload(): void {
    loadArenaSurvivorAssets(this);
  }

  create(): void {
    const client = this.registry.get("hostClient") as HostSocketClient;

    this.cameras.main.setBackgroundColor("#020617");
    this.arenaBackground = this.add.image(0, 0, resolveArenaSurvivorBackgroundKey()).setOrigin(0, 0);
    this.arenaBackground.setDepth(-50);
    this.arenaBackground.setVisible(false);
    this.arenaGraphics = this.add.graphics();
    this.entityGraphics = this.add.graphics();
    this.hud = createArenaHud();

    this.unsubscribe = client.subscribe((state) => {
      const gameState = (state.game?.state ?? null) as ArenaSurvivorState | null;

      if (!this.arenaGraphics || !this.entityGraphics || !this.hud) {
        return;
      }

      if (!gameState) {
        this.arenaBackground?.setVisible(false);
        this.arenaGraphics.clear();
        this.entityGraphics.clear();
        for (const playerSprite of this.spriteLayer.playerSprites.values()) {
          playerSprite.setVisible(false);
        }
        for (const enemySprite of this.spriteLayer.enemySprites.values()) {
          enemySprite.setVisible(false);
        }
        for (const weaponSprite of this.spriteLayer.weaponSprites.values()) {
          weaponSprite.setVisible(false);
        }
        this.lastRoundNumber = null;
        this.lastViewportKey = "";
        this.hud.update(null, state.room);
        return;
      }

      const viewportKey = `${gameState.arenaWidth}x${gameState.arenaHeight}`;
      const shouldResetArena =
        this.lastRoundNumber !== state.game?.roundNumber || this.lastViewportKey !== viewportKey;
      const meta = resolveArenaSurvivorRenderMeta(this, gameState);

      if (this.arenaBackground) {
        this.arenaBackground.setVisible(true);
        this.arenaBackground.setPosition(0, 0);
        this.arenaBackground.setDisplaySize(gameState.arenaWidth, gameState.arenaHeight);
      }
      applyArenaSurvivorCamera(this, meta);

      if (shouldResetArena) {
        drawArenaSurvivorBackground(this, this.arenaGraphics, gameState, meta);
        this.lastRoundNumber = state.game?.roundNumber ?? null;
        this.lastViewportKey = viewportKey;
      }

      drawArenaSurvivorEntities(this, this.entityGraphics, gameState, meta);
      syncArenaSurvivorSpriteLayer(this, this.spriteLayer, gameState, meta);
      this.hud.update(gameState, state.room);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
      this.arenaBackground?.destroy();
      this.arenaBackground = undefined;
      this.arenaGraphics?.destroy();
      this.arenaGraphics = undefined;
      this.entityGraphics?.destroy();
      this.entityGraphics = undefined;
      for (const enemySprite of this.spriteLayer.enemySprites.values()) {
        enemySprite.destroy();
      }
      this.spriteLayer.enemySprites.clear();
      for (const playerSprite of this.spriteLayer.playerSprites.values()) {
        playerSprite.destroy();
      }
      this.spriteLayer.playerSprites.clear();
      for (const weaponSprite of this.spriteLayer.weaponSprites.values()) {
        weaponSprite.destroy();
      }
      this.spriteLayer.weaponSprites.clear();
      this.hud?.destroy();
      this.hud = undefined;
      this.lastRoundNumber = null;
      this.lastViewportKey = "";
    });
  }
}
