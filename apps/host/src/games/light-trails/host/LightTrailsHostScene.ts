import Phaser from "phaser";
import type { LightTrailsState } from "@open-party-lab/protocol";
import type { HostSocketClient } from "../../../app/hostSocketClient.js";
import { hostTheme } from "../../../ui/theme/theme.js";
import {
  drawLightTrailsArena,
  drawLightTrailsHeads,
  drawLightTrailsTrailSegmentsToTexture,
  resolveLightTrailsRenderMeta
} from "./LightTrailsRenderer.js";

export class LightTrailsHostScene extends Phaser.Scene {
  private unsubscribe?: () => void;
  private arenaGraphics?: Phaser.GameObjects.Graphics;
  private trailTexture?: Phaser.GameObjects.RenderTexture;
  private trailBrush?: Phaser.GameObjects.Graphics;
  private headGraphics?: Phaser.GameObjects.Graphics;
  private detailsText?: Phaser.GameObjects.Text;
  private lastRoundNumber: number | null = null;
  private lastTick = -1;
  private lastViewportKey = "";
  private readonly drawnSegmentsByPlayerId = new Map<string, number>();

  constructor() {
    super("LightTrailsHostScene");
  }

  create(): void {
    const client = this.registry.get("hostClient") as HostSocketClient;

    this.cameras.main.setBackgroundColor("#020617");
    this.arenaGraphics = this.add.graphics();
    this.trailTexture = this.add.renderTexture(0, 0, this.scale.width, this.scale.height).setOrigin(0, 0);
    this.trailBrush = this.make.graphics({}, false);
    this.headGraphics = this.add.graphics();
    this.detailsText = this.add.text(24, this.scale.height - 22, "", {
      fontFamily: hostTheme.bodyFont,
      fontSize: "18px",
      color: hostTheme.muted
    });
    this.detailsText.setOrigin(0, 1);

    this.unsubscribe = client.subscribe((state) => {
      const gameState = (state.game?.state ?? null) as LightTrailsState | null;
      const en = state.room?.language === "en";

      if (
        !this.arenaGraphics ||
        !this.trailTexture ||
        !this.trailBrush ||
        !this.headGraphics ||
        !this.detailsText ||
        !gameState
      ) {
        return;
      }

      const viewportKey = `${this.scale.width}x${this.scale.height}:${gameState.arenaWidth}x${gameState.arenaHeight}`;
      const shouldResetTrails =
        this.lastRoundNumber !== state.game?.roundNumber ||
        this.lastTick > gameState.tick ||
        this.lastViewportKey !== viewportKey;
      const renderMeta = resolveLightTrailsRenderMeta(this, gameState);

      if (shouldResetTrails) {
        drawLightTrailsArena(this, this.arenaGraphics, gameState, renderMeta);
        this.trailTexture.resize(this.scale.width, this.scale.height);
        this.trailTexture.clear();
        this.drawnSegmentsByPlayerId.clear();
        this.lastViewportKey = viewportKey;
        this.lastRoundNumber = state.game?.roundNumber ?? null;
      }

      drawLightTrailsTrailSegmentsToTexture(
        this,
        this.trailTexture,
        this.trailBrush,
        gameState,
        this.drawnSegmentsByPlayerId,
        renderMeta
      );
      drawLightTrailsHeads(this, this.headGraphics, gameState, renderMeta);

      for (const player of Object.values(gameState.players)) {
        this.drawnSegmentsByPlayerId.set(player.playerId, player.trailSegments.length);
      }
      this.lastTick = gameState.tick;

      const totalPlayers = Math.max(0, Object.keys(gameState.players).length);
      const alivePlayers = gameState.alivePlayerIds.length;

      this.detailsText.setPosition(24, this.scale.height - 22);
      this.detailsText.setText(`${alivePlayers}/${totalPlayers} ${en ? "players" : "Spieler"}`);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
      this.arenaGraphics?.destroy();
      this.arenaGraphics = undefined;
      this.trailBrush?.destroy();
      this.trailBrush = undefined;
      this.trailTexture?.destroy();
      this.trailTexture = undefined;
      this.headGraphics?.destroy();
      this.headGraphics = undefined;
      this.detailsText?.destroy();
      this.detailsText = undefined;
      this.drawnSegmentsByPlayerId.clear();
      this.lastRoundNumber = null;
      this.lastTick = -1;
      this.lastViewportKey = "";
    });
  }
}
