import Phaser from "phaser";
import {
  minionsTdSetupConfig,
  type MinionsTdLobbyState,
  type MinionsTdMapState,
  type PlayerSnapshot,
  type SupportedLanguage
} from "@open-party-lab/protocol";
import type { HostSocketClient } from "../app/hostSocketClient.js";
import {
  drawArcadeBackdrop,
  getSceneContentFrame,
  getVisualAccent,
  measureSceneHeaderBottom,
  renderInfoPanel,
  renderPlayerStrip,
  renderSceneHeader
} from "./gameSelectionUi.js";
import { clampScroll, measureMaxScroll, renderScrollBar } from "./sceneScroll.js";

const panelFill = 0x08111f;
const panelEdge = 0x1e293b;

interface MinionsTdSetupText {
  headerTitle: string;
  headerSubtitle: string;
  playerStatusTitle: string;
  setupPendingTitle: string;
  setupPendingLines: string[];
  mapsTitle: string;
  mapsHint: string;
  slotsMeta: (slots: number, cols: number, rows: number) => string;
  unknownMap: string;
  mapStats: (buildSlots: number, pathCells: number) => string;
  startingLives: string;
  startingGold: string;
  startRound: string;
  startRoundHint: string;
  rangeLabel: (min: number, max: number, step: number) => string;
}

const setupText = {
  de: {
    headerTitle: "MinionsTD Setup",
    headerSubtitle:
      "Map, Leben und Startgeld festlegen. SPACE oder Start beginnt die Runde, ESC zeigt die Spielauswahl.",
    playerStatusTitle: "Spielerstatus",
    setupPendingTitle: "Setup wird vorbereitet",
    setupPendingLines: [
      "Sobald MinionsTD aktiv ist, erscheinen hier Karten- und Startoptionen.",
      "Danach startet die Runde erst mit dem grossen Start-Button."
    ],
    mapsTitle: "Karten",
    mapsHint: "Ohne Scrollen: Klick auf eine Karte und rechts die Details pruefen.",
    slotsMeta: (slots, cols, rows) => `${slots} Slots | ${cols}x${rows}`,
    unknownMap: "Unbekannt",
    mapStats: (buildSlots, pathCells) => `${buildSlots} Bauplaetze | ${pathCells} Pfadfelder`,
    startingLives: "Startleben",
    startingGold: "Startgeld",
    startRound: "Runde starten",
    startRoundHint: "Mit aktueller Map und den aktuellen Startwerten",
    rangeLabel: (min, max, step) => `${min} bis ${max} in ${step}-Schritten`
  },
  en: {
    headerTitle: "Minions TD Setup",
    headerSubtitle:
      "Set map, lives, and starting gold. SPACE or Start begins the round, ESC opens game selection.",
    playerStatusTitle: "Player Status",
    setupPendingTitle: "Preparing setup",
    setupPendingLines: [
      "Once Minions TD is active, map and start options appear here.",
      "After that, the round starts only with the large Start button."
    ],
    mapsTitle: "Maps",
    mapsHint: "No scrolling needed: click a map and check its details on the right.",
    slotsMeta: (slots, cols, rows) => `${slots} slots | ${cols}x${rows}`,
    unknownMap: "Unknown",
    mapStats: (buildSlots, pathCells) => `${buildSlots} build slots | ${pathCells} path cells`,
    startingLives: "Starting Lives",
    startingGold: "Starting Gold",
    startRound: "Start round",
    startRoundHint: "With the current map and current starting values",
    rangeLabel: (min, max, step) => `${min} to ${max} in steps of ${step}`
  }
} satisfies Record<SupportedLanguage, MinionsTdSetupText>;

export class MinionsTdSetupScene extends Phaser.Scene {
  private unsubscribe?: () => void;
  private client?: HostSocketClient;
  private scrollY = 0;
  private maxScroll = 0;
  private readonly handleResize = () => this.renderFromState();
  private readonly handleWheel = (
    _pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ) => {
    if (this.maxScroll <= 0) {
      return;
    }

    this.scrollY = clampScroll(this.scrollY + deltaY, this.maxScroll);
    this.renderFromState();
  };

  constructor() {
    super("MinionsTdSetupScene");
  }

  create(): void {
    const client = this.registry.get("hostClient") as HostSocketClient;
    const handleStartRound = () => client.startRound();
    const handleBackToCatalog = () => client.returnToGameSelection();

    this.client = client;
    this.input.keyboard?.on("keydown-SPACE", handleStartRound);
    this.input.keyboard?.on("keydown-ESC", handleBackToCatalog);
    this.input.on("wheel", this.handleWheel);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize);

    this.unsubscribe = client.subscribe(() => {
      this.renderFromState();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
      this.client = undefined;
      this.input.keyboard?.off("keydown-SPACE", handleStartRound);
      this.input.keyboard?.off("keydown-ESC", handleBackToCatalog);
      this.input.off("wheel", this.handleWheel);
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize);
    });
  }

  private renderFromState(): void {
    const state = this.client?.getState();

    if (!state) {
      return;
    }

    this.render(
      state.room?.minionsTdLobby,
      state.room?.players ?? [],
      state.error,
      state.room?.code ?? "----",
      state.room?.language ?? state.preferredLanguage
    );
  }

  private updateScrollBounds(contentBottom: number): boolean {
    this.maxScroll = measureMaxScroll(this, contentBottom);
    const nextScrollY = clampScroll(this.scrollY, this.maxScroll);

    if (nextScrollY === this.scrollY) {
      return false;
    }

    this.scrollY = nextScrollY;
    this.renderFromState();
    return true;
  }

  private render(
    lobby: MinionsTdLobbyState | undefined,
    players: PlayerSnapshot[],
    error: string | null,
    roomCode: string,
    language: SupportedLanguage
  ): void {
    this.children.removeAll(true);
    drawArcadeBackdrop(this);
    const text = setupText[language];

    const accent = getVisualAccent("minions-td");
    const { x: contentX, width: contentWidth } = getSceneContentFrame(this);
    const headerOptions = {
      title: text.headerTitle,
      subtitle: text.headerSubtitle,
      roomCode,
      language
    };
    const headerBottom = measureSceneHeaderBottom(this, headerOptions);
    const bodyY = headerBottom - this.scrollY;
    const stripBottom = renderPlayerStrip(this, {
      x: contentX,
      y: bodyY,
      width: contentWidth,
      players,
      selectedGameId: "minions-td",
      title: text.playerStatusTitle,
      language
    });
    const lowerY = stripBottom + 16;

    if (!lobby) {
      const infoHeight = Math.max(180, this.scale.height - (lowerY + this.scrollY) - 24);
      renderInfoPanel(this, {
        x: contentX,
        y: lowerY,
        width: contentWidth,
        height: infoHeight,
        title: text.setupPendingTitle,
        lines: text.setupPendingLines,
        accent,
        error,
        language
      });
      if (this.updateScrollBounds(lowerY + infoHeight + this.scrollY)) {
        return;
      }

      renderSceneHeader(this, headerOptions);
      renderScrollBar(this, this.scrollY, this.maxScroll);
      return;
    }

    const stacked = contentWidth < 1_080;
    const gap = 24;
    const listWidth = stacked ? contentWidth : Math.min(440, Math.max(360, Math.floor(contentWidth * 0.37)));
    const detailWidth = stacked ? contentWidth : contentWidth - listWidth - gap;
    const selectedMap =
      lobby.maps.find((entry) => entry.id === lobby.selectedMapId) ?? lobby.maps[0];

    const listHeight = this.renderMapList(lobby, contentX, lowerY, listWidth, accent, text);
    const detailX = stacked ? contentX : contentX + listWidth + gap;
    const detailY = stacked ? lowerY + listHeight + 18 : lowerY;
    const detailHeight = Math.max(600, this.scale.height - (detailY + this.scrollY) - 24);

    this.renderSetupPanel(
      selectedMap,
      lobby,
      detailX,
      detailY,
      detailWidth,
      detailHeight,
      accent,
      error,
      text
    );

    const contentBottom = Math.max(lowerY + listHeight + this.scrollY, detailY + detailHeight + this.scrollY);

    if (this.updateScrollBounds(contentBottom)) {
      return;
    }

    renderSceneHeader(this, headerOptions);
    renderScrollBar(this, this.scrollY, this.maxScroll);
  }

  private renderMapList(
    lobby: MinionsTdLobbyState,
    x: number,
    y: number,
    width: number,
    accent: number,
    text: MinionsTdSetupText
  ): number {
    const panel = this.add
      .rectangle(x, y, width, 394, panelFill, 0.96)
      .setOrigin(0)
      .setStrokeStyle(1, panelEdge, 0.92);
    panel.setDisplaySize(width, 394);

    this.add.text(x + 18, y + 18, text.mapsTitle, {
      fontFamily: "\"Space Grotesk\", sans-serif",
      fontSize: "26px",
      color: "#f8fafc"
    });
    this.add.text(x + 18, y + 50, text.mapsHint, {
      fontFamily: "\"Nunito Sans\", sans-serif",
      fontSize: "14px",
      color: "#94a3b8"
    });

    const columns = width >= 390 ? 2 : 1;
    const gap = 10;
    const top = y + 86;
    const buttonHeight = 54;
    const buttonWidth = Math.floor((width - 36 - gap * (columns - 1)) / columns);

    lobby.maps.forEach((map, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const buttonX = x + 18 + column * (buttonWidth + gap);
      const buttonY = top + row * (buttonHeight + gap);
      this.renderMapButton(
        map,
        map.id === lobby.selectedMapId,
        buttonX,
        buttonY,
        buttonWidth,
        buttonHeight,
        accent,
        text
      );
    });

    return 394;
  }

  private renderMapButton(
    map: MinionsTdMapState,
    selected: boolean,
    x: number,
    y: number,
    width: number,
    height: number,
    accent: number,
    text: MinionsTdSetupText
  ): void {
    const fillColor = selected ? 0x0c1f1b : 0x0f172a;
    const borderColor = selected ? accent : 0xffffff;
    const background = this.add
      .rectangle(x, y, width, height, fillColor, 0.98)
      .setOrigin(0)
      .setStrokeStyle(selected ? 2 : 1, borderColor, selected ? 0.88 : 0.14);
    this.add.text(x + 12, y + 10, map.name, {
      fontFamily: "\"Space Grotesk\", sans-serif",
      fontSize: "18px",
      color: "#f8fafc"
    });
    this.add.text(x + 12, y + 31, text.slotsMeta(map.buildSlots.length, map.cols, map.rows), {
      fontFamily: "\"Nunito Sans\", sans-serif",
      fontSize: "12px",
      color: selected ? "#bbf7d0" : "#94a3b8"
    });

    const zone = this.add.zone(x, y, width, height).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on("pointerdown", () => {
      this.client?.sendGameHostAction("minions-td", {
        type: "configure-lobby",
        mapId: map.id
      });
    });
    zone.on("pointerover", () => {
      if (!selected) {
        background.setFillStyle(0x132033, 0.98);
        background.setStrokeStyle(2, accent, 0.62);
      }
    });
    zone.on("pointerout", () => {
      if (!selected) {
        background.setFillStyle(fillColor, 0.98);
        background.setStrokeStyle(1, borderColor, 0.14);
      }
    });
  }

  private renderSetupPanel(
    selectedMap: MinionsTdMapState | undefined,
    lobby: MinionsTdLobbyState,
    x: number,
    y: number,
    width: number,
    height: number,
    accent: number,
    error: string | null,
    text: MinionsTdSetupText
  ): void {
    const panel = this.add
      .rectangle(x, y, width, height, panelFill, 0.96)
      .setOrigin(0)
      .setStrokeStyle(1, panelEdge, 0.92);
    panel.setDisplaySize(width, height);

    const selectedName = selectedMap?.name ?? text.unknownMap;
    this.add.text(x + 20, y + 18, selectedName, {
      fontFamily: "\"Space Grotesk\", sans-serif",
      fontSize: "30px",
      color: "#f8fafc"
    });
    this.add.text(x + 20, y + 54, text.mapStats(selectedMap?.buildSlots.length ?? 0, selectedMap?.pathCells.length ?? 0), {
      fontFamily: "\"Nunito Sans\", sans-serif",
      fontSize: "15px",
      color: "#bbf7d0"
    });

    if (selectedMap) {
      const preview = this.add.graphics();
      this.drawMapPreview(preview, selectedMap, x + 20, y + 88, width - 40, 200);
    }

    const controlsY = y + 308;
    this.renderValueStepper(
      text.startingLives,
      lobby.startingLives,
      minionsTdSetupConfig.startingLives.min,
      minionsTdSetupConfig.startingLives.max,
      minionsTdSetupConfig.startingLives.step,
      x + 20,
      controlsY,
      width - 40,
      accent,
      text,
      (value) => {
        this.client?.sendGameHostAction("minions-td", {
          type: "configure-lobby",
          startingLives: value
        });
      }
    );
    this.renderValueStepper(
      text.startingGold,
      lobby.startingGold,
      minionsTdSetupConfig.startingGold.min,
      minionsTdSetupConfig.startingGold.max,
      minionsTdSetupConfig.startingGold.step,
      x + 20,
      controlsY + 94,
      width - 40,
      accent,
      text,
      (value) => {
        this.client?.sendGameHostAction("minions-td", {
          type: "configure-lobby",
          startingGold: value
        });
      }
    );

    const startButtonY = controlsY + 198;
    const startHeight = 66;
    const startButton = this.add
      .rectangle(x + 20, startButtonY, width - 40, startHeight, accent, 0.96)
      .setOrigin(0)
      .setStrokeStyle(2, 0xf8fafc, 0.18);
    this.add.text(x + width / 2, startButtonY + 22, text.startRound, {
      fontFamily: "\"Space Grotesk\", sans-serif",
      fontSize: "26px",
      color: "#032217"
    }).setOrigin(0.5, 0);
    this.add.text(x + width / 2, startButtonY + 46, text.startRoundHint, {
      fontFamily: "\"Nunito Sans\", sans-serif",
      fontSize: "13px",
      color: "#064e3b"
    }).setOrigin(0.5, 0);
    const startZone = this.add
      .zone(x + 20, startButtonY, width - 40, startHeight)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });
    startZone.on("pointerdown", () => {
      this.client?.startRound();
    });
    startZone.on("pointerover", () => {
      startButton.setFillStyle(0x34d399, 0.98);
    });
    startZone.on("pointerout", () => {
      startButton.setFillStyle(accent, 0.96);
    });

    if (error) {
      this.add.text(x + 20, startButtonY + startHeight + 14, error, {
        fontFamily: "\"Nunito Sans\", sans-serif",
        fontSize: "14px",
        color: "#fda4af",
        wordWrap: { width: width - 40 }
      });
    }
  }

  private renderValueStepper(
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    x: number,
    y: number,
    width: number,
    accent: number,
    text: MinionsTdSetupText,
    onChange: (nextValue: number) => void
  ): void {
    this.add.text(x, y, label, {
      fontFamily: "\"Space Grotesk\", sans-serif",
      fontSize: "22px",
      color: "#f8fafc"
    });
    this.add.text(x, y + 28, text.rangeLabel(min, max, step), {
      fontFamily: "\"Nunito Sans\", sans-serif",
      fontSize: "13px",
      color: "#94a3b8"
    });

    const controlY = y + 50;
    const buttonSize = 42;
    this.renderSmallButton(x, controlY, buttonSize, buttonSize, "-", accent, value > min, () => {
      onChange(Math.max(min, value - step));
    });
    const valueCardX = x + buttonSize + 12;
    const valueCardWidth = Math.max(120, width - buttonSize * 2 - 24);
    this.add
      .rectangle(valueCardX, controlY, valueCardWidth, buttonSize, 0x0f172a, 0.98)
      .setOrigin(0)
      .setStrokeStyle(1, panelEdge, 0.88);
    this.add.text(valueCardX + valueCardWidth / 2, controlY + buttonSize / 2, `${value}`, {
      fontFamily: "\"Space Grotesk\", sans-serif",
      fontSize: "24px",
      color: "#f8fafc"
    }).setOrigin(0.5);
    this.renderSmallButton(x + width - buttonSize, controlY, buttonSize, buttonSize, "+", accent, value < max, () => {
      onChange(Math.min(max, value + step));
    });
  }

  private renderSmallButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    accent: number,
    enabled: boolean,
    onClick: () => void
  ): void {
    const fillColor = enabled ? 0x14302d : 0x0f172a;
    const borderAlpha = enabled ? 0.72 : 0.14;
    const background = this.add
      .rectangle(x, y, width, height, fillColor, 0.96)
      .setOrigin(0)
      .setStrokeStyle(1, enabled ? accent : 0xffffff, borderAlpha);
    this.add.text(x + width / 2, y + height / 2, label, {
      fontFamily: "\"Space Grotesk\", sans-serif",
      fontSize: "28px",
      color: enabled ? "#f8fafc" : "#64748b"
    }).setOrigin(0.5);

    if (!enabled) {
      return;
    }

    const zone = this.add.zone(x, y, width, height).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on("pointerdown", onClick);
    zone.on("pointerover", () => {
      background.setFillStyle(0x1b433b, 0.98);
      background.setStrokeStyle(2, accent, 0.86);
    });
    zone.on("pointerout", () => {
      background.setFillStyle(fillColor, 0.96);
      background.setStrokeStyle(1, accent, borderAlpha);
    });
  }

  private drawMapPreview(
    graphics: Phaser.GameObjects.Graphics,
    map: MinionsTdMapState,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    graphics.fillStyle(0x020617, 0.92);
    graphics.fillRoundedRect(x, y, width, height, 16);
    graphics.lineStyle(1, 0x334155, 0.72);
    graphics.strokeRoundedRect(x, y, width, height, 16);

    const cellSize = Math.min((width - 20) / Math.max(1, map.cols), (height - 20) / Math.max(1, map.rows));
    const gridWidth = map.cols * cellSize;
    const gridHeight = map.rows * cellSize;
    const offsetX = x + (width - gridWidth) / 2;
    const offsetY = y + (height - gridHeight) / 2;

    for (let col = 0; col < map.cols; col += 1) {
      for (let row = 0; row < map.rows; row += 1) {
        graphics.lineStyle(1, 0x1e293b, 0.64);
        graphics.strokeRect(offsetX + col * cellSize, offsetY + row * cellSize, cellSize, cellSize);
      }
    }

    for (const cell of map.pathCells) {
      graphics.fillStyle(0x22c55e, 0.84);
      graphics.fillRect(
        offsetX + cell.col * cellSize + 1,
        offsetY + cell.row * cellSize + 1,
        Math.max(2, cellSize - 2),
        Math.max(2, cellSize - 2)
      );
    }

    for (const slot of map.buildSlots) {
      graphics.lineStyle(2, 0xf8fafc, 0.84);
      graphics.strokeRoundedRect(
        offsetX + slot.col * cellSize + 2,
        offsetY + slot.row * cellSize + 2,
        Math.max(3, cellSize - 4),
        Math.max(3, cellSize - 4),
        4
      );
    }
  }
}
