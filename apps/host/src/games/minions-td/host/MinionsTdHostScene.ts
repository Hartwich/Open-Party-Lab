import Phaser from "phaser";
import type { MinionsTdState, SupportedLanguage } from "@open-party-lab/protocol";
import type { HostSocketClient } from "../../../app/hostSocketClient.js";
import { HostPerfTracker } from "../../../app/perfTelemetry.js";
import { hostTheme } from "../../../ui/theme/theme.js";
import {
  buildMinionsTdPanelFooter,
  buildMinionsTdPanelHeader,
  createMinionsTdStaticLayer,
  createMinionsTdSpriteLayer,
  destroyMinionsTdStaticLayer,
  destroyMinionsTdSpriteLayer,
  drawMinionsTdDynamicState,
  drawMinionsTdEnemyHealthBars,
  emptyMinionsTdStaticLayerMetrics,
  type MinionsTdPanelLayout,
  type MinionsTdStaticLayer,
  type MinionsTdStaticLayerMetrics,
  hideMinionsTdStaticLayer,
  hideMinionsTdSpriteLayer,
  resolveMinionsTdPanelLayout,
  syncMinionsTdStaticLayer,
  syncMinionsTdSpriteLayer
} from "./MinionsTdRenderer.js";
import { loadMinionsTdAssets } from "./minionsTdAssets.js";

const minionsTdTextRefreshMs = 200;

export class MinionsTdHostScene extends Phaser.Scene {
  private unsubscribe?: () => void;
  private staticLayer?: MinionsTdStaticLayer;
  private dynamicGraphics?: Phaser.GameObjects.Graphics;
  private enemyHudGraphics?: Phaser.GameObjects.Graphics;
  private titleText?: Phaser.GameObjects.Text;
  private subtitleText?: Phaser.GameObjects.Text;
  private panelHeaderTexts: Phaser.GameObjects.Text[] = [];
  private panelFooterTexts: Phaser.GameObjects.Text[] = [];
  private spriteLayer = createMinionsTdSpriteLayer();
  private lastStaticKey: string | null = null;
  private lastLayout: MinionsTdPanelLayout | null = null;
  private lastRenderStamp: string | null = null;
  private lastStaticMetrics: MinionsTdStaticLayerMetrics = emptyMinionsTdStaticLayerMetrics;
  private lastTextRefreshAtMs = 0;
  private perfTracker?: HostPerfTracker;
  private staticRedrawCount = 0;

  constructor() {
    super("MinionsTdHostScene");
  }

  preload(): void {
    loadMinionsTdAssets(this);
  }

  create(): void {
    const client = this.registry.get("hostClient") as HostSocketClient;

    this.cameras.main.setBackgroundColor("#020617");
    this.perfTracker = new HostPerfTracker(this.game, this.scene.key, "minions-td");
    this.staticLayer = createMinionsTdStaticLayer(this);
    this.dynamicGraphics = this.add.graphics();
    this.dynamicGraphics.setDepth(2);
    this.enemyHudGraphics = this.add.graphics();
    this.enemyHudGraphics.setDepth(6);
    this.titleText = this.add.text(12, 10, "MinionsTD", {
      fontFamily: hostTheme.titleFont,
      fontSize: "28px",
      color: hostTheme.text
    });
    this.titleText.setDepth(10);
    this.subtitleText = this.add.text(
      12,
      36,
      client.getState().preferredLanguage === "en" ? "Waiting for an active round" : "Warte auf eine laufende Runde",
      {
      fontFamily: hostTheme.bodyFont,
      fontSize: "15px",
      color: hostTheme.muted
      }
    );
    this.subtitleText.setDepth(10);

    this.panelHeaderTexts = Array.from({ length: 4 }, () =>
      this.add.text(0, 0, "", {
        fontFamily: hostTheme.titleFont,
        fontSize: "16px",
        color: hostTheme.text,
        align: "left"
      }).setDepth(10)
    );
    this.panelFooterTexts = Array.from({ length: 4 }, () =>
      this.add.text(0, 0, "", {
        fontFamily: hostTheme.bodyFont,
        fontSize: "13px",
        color: hostTheme.muted,
        align: "left",
        wordWrap: { width: 260 }
      }).setDepth(10)
    );

    this.unsubscribe = client.subscribe((state) => {
      const renderStamp = [
        state.room?.code ?? "----",
        state.room?.lifecycle ?? "unknown",
        state.room?.currentRound?.roundNumber ?? 0,
        state.game?.gameId ?? "none",
        state.game?.roundNumber ?? 0,
        state.game?.phase ?? "none",
        state.game?.updatedAt ?? "none"
      ].join("|");

      if (renderStamp === this.lastRenderStamp) {
        return;
      }

      this.lastRenderStamp = renderStamp;
      this.renderState(
        state.game?.state ? (state.game.state as MinionsTdState) : null,
        state.room?.code ?? "----",
        state.game?.phase,
        state.room?.language
      );
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
      if (this.staticLayer) {
        destroyMinionsTdStaticLayer(this.staticLayer);
        this.staticLayer = undefined;
      }
      this.dynamicGraphics?.destroy();
      this.dynamicGraphics = undefined;
      this.enemyHudGraphics?.destroy();
      this.enemyHudGraphics = undefined;
      this.titleText?.destroy();
      this.titleText = undefined;
      this.subtitleText?.destroy();
      this.subtitleText = undefined;
      for (const text of this.panelHeaderTexts) {
        text.destroy();
      }
      for (const text of this.panelFooterTexts) {
        text.destroy();
      }
      this.panelHeaderTexts = [];
      this.panelFooterTexts = [];
      destroyMinionsTdSpriteLayer(this.spriteLayer);
      this.lastStaticKey = null;
      this.lastLayout = null;
      this.lastRenderStamp = null;
      this.lastStaticMetrics = emptyMinionsTdStaticLayerMetrics;
      this.lastTextRefreshAtMs = 0;
      this.staticRedrawCount = 0;
      this.perfTracker?.clear();
      this.perfTracker = undefined;
    });
  }

  private setTextIfChanged(target: Phaser.GameObjects.Text, value: string): void {
    if (target.text !== value) {
      target.setText(value);
    }
  }

  private setPositionIfChanged(target: Phaser.GameObjects.Text, x: number, y: number): void {
    if (target.x !== x || target.y !== y) {
      target.setPosition(x, y);
    }
  }

  private buildStaticKey(state: MinionsTdState): string {
    return [
      this.scale.width,
      this.scale.height,
      state.map.id,
      ...state.players.slice(0, 4).map((player) =>
        player ? `${player.playerId}:${player.color}:${player.alive ? 1 : 0}` : "empty"
      )
    ].join("|");
  }

  private syncPanelTextLayout(layout: MinionsTdPanelLayout, state: MinionsTdState): void {
    for (let index = 0; index < 4; index += 1) {
      const player = state.players[index] ?? null;
      const panelRect = layout.panelRects[index];
      const header = this.panelHeaderTexts[index];
      const footer = this.panelFooterTexts[index];

      this.setPositionIfChanged(header, panelRect.x + 12, panelRect.y + 10);
      this.setPositionIfChanged(footer, panelRect.x + 12, panelRect.y + panelRect.height - 30);
      header.setColor(player?.alive ? player.color : hostTheme.text);
      footer.setAlpha(player ? 1 : 0.75);
      footer.setWordWrapWidth(panelRect.width - 24);
    }
  }

  private refreshTexts(state: MinionsTdState, roomCode: string, phase: string | undefined, language?: SupportedLanguage): void {
    const en = language === "en";
    this.setTextIfChanged(this.titleText!, `MinionsTD | ${en ? "Room" : "Raum"} ${roomCode}`);
    this.setTextIfChanged(
      this.subtitleText!,
      `Phase ${phase ?? state.result.outcome} | ${en ? "Players" : "Spieler"} ${state.players.filter((player) => player.alive).length}/${state.players.length} | ` +
        `${en ? "Endless match" : "Endloses Match"} | ${en ? "Runtime" : "Laufzeit"} ${Math.floor(state.elapsedMs / 1000)}s`
    );

    for (let index = 0; index < 4; index += 1) {
      const player = state.players[index] ?? null;
      const header = this.panelHeaderTexts[index];
      const footer = this.panelFooterTexts[index];

      this.setTextIfChanged(header, buildMinionsTdPanelHeader(player, index, language));
      this.setTextIfChanged(footer, buildMinionsTdPanelFooter(player, language));
    }
  }

  private renderState(state: MinionsTdState | null, roomCode: string, phase?: string, language?: SupportedLanguage): void {
    if (!this.staticLayer || !this.dynamicGraphics || !this.enemyHudGraphics || !this.titleText || !this.subtitleText) {
      return;
    }

    if (!state) {
      hideMinionsTdStaticLayer(this.staticLayer);
      this.dynamicGraphics.clear();
      this.enemyHudGraphics.clear();
      hideMinionsTdSpriteLayer(this.spriteLayer);
      this.lastStaticKey = null;
      this.lastLayout = null;
      this.lastStaticMetrics = emptyMinionsTdStaticLayerMetrics;
      this.lastTextRefreshAtMs = 0;
      this.staticRedrawCount = 0;
      this.perfTracker?.clear();
      this.setTextIfChanged(this.titleText, "MinionsTD");
      const en = language === "en";
      this.setTextIfChanged(
        this.subtitleText,
        `${en ? "Room" : "Raum"} ${roomCode} | Phase ${phase ?? "unknown"} | ${en ? "Waiting for game data" : "Warte auf Spieldaten"}`
      );
      for (const text of this.panelHeaderTexts) {
        this.setTextIfChanged(text, "");
      }
      for (const text of this.panelFooterTexts) {
        this.setTextIfChanged(text, "");
      }
      return;
    }

    const frameStart = performance.now();
    const staticKey = this.buildStaticKey(state);
    let staticMs = 0;
    let staticVectorMs = 0;
    let staticStampMs = 0;
    let layoutMs = 0;
    let staticRedraw = false;
    let staticMetrics = this.lastStaticMetrics;
    let layout = this.lastLayout;

    if (!layout || staticKey !== this.lastStaticKey) {
      const staticStart = performance.now();
      const staticResult = syncMinionsTdStaticLayer(this, this.staticLayer, state);
      staticMs = performance.now() - staticStart;
      staticVectorMs = staticResult.metrics.vectorRasterMs;
      staticStampMs = staticResult.metrics.tileStampMs;
      layoutMs = staticResult.metrics.layoutMs;
      staticMetrics = staticResult.metrics;
      staticRedraw = true;
      layout = staticResult.layout;
      this.lastStaticKey = staticKey;
      this.lastLayout = layout;
      this.lastStaticMetrics = staticMetrics;
      this.staticRedrawCount += 1;
      this.syncPanelTextLayout(layout, state);
    }

    layout ??= resolveMinionsTdPanelLayout(this, state);

    const dynamicStart = performance.now();
    drawMinionsTdDynamicState(this.dynamicGraphics, this, state, layout);
    drawMinionsTdEnemyHealthBars(this.enemyHudGraphics, state, layout);
    const dynamicMs = performance.now() - dynamicStart;

    const spriteStart = performance.now();
    syncMinionsTdSpriteLayer(this, this.spriteLayer, state, layout);
    const spriteMs = performance.now() - spriteStart;

    const textStart = performance.now();
    if (staticRedraw || frameStart - this.lastTextRefreshAtMs >= minionsTdTextRefreshMs) {
      this.refreshTexts(state, roomCode, phase, language);
      this.lastTextRefreshAtMs = frameStart;
    }
    const textMs = performance.now() - textStart;
    const totalMs = performance.now() - frameStart;

    const totals = state.players.reduce(
      (accumulator, player) => {
        accumulator.towers += player.towers.length;
        accumulator.enemies += player.enemies.length;
        accumulator.projectiles += player.projectiles.length;
        return accumulator;
      },
      {
        towers: 0,
        enemies: 0,
        projectiles: 0
      }
    );

    this.perfTracker?.sample({
      sourceId: "minions-td",
      timingsMs: {
        total: totalMs,
        layout: layoutMs,
        static: staticMs,
        staticVector: staticVectorMs,
        staticStamp: staticStampMs,
        dynamic: dynamicMs,
        sprites: spriteMs,
        text: textMs
      },
      counters: {
        buildSlots: state.map.buildSlots.length,
        pathCells: state.map.pathCells.length,
        players: state.players.length,
        towers: totals.towers,
        enemies: totals.enemies,
        projectiles: totals.projectiles,
        staticPanelTextures: staticMetrics.panelTextureCount,
        pathStampCount: staticMetrics.pathStampCount,
        buildSlotStampCount: staticMetrics.buildSlotStampCount,
        gridLineCount: staticMetrics.gridLineCount,
        staticTexturePixels: staticMetrics.staticTexturePixels,
        cellSizePx: Math.round(staticMetrics.cellSizePx),
        staticTextureBuildCount: staticMetrics.textureBuildCount,
        staticRedrawCount: this.staticRedrawCount
      },
      tags: {
        mapId: state.map.id,
        gameId: "minions-td",
        staticLayer: "render-texture"
      },
      flags: {
        staticRedraw
      }
    });
  }
}
