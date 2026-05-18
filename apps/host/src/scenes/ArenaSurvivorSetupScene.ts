import Phaser from "phaser";
import {
  arenaSurvivorSetupConfig,
  resolveArenaSurvivorDifficultyTier,
  type ArenaSurvivorLobbyState,
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

interface ArenaSurvivorSetupText {
  headerTitle: string;
  headerSubtitle: string;
  playerStripTitle: string;
  setupPendingTitle: string;
  setupPendingLines: string[];
  runStatusTitle: string;
  difficulty: string;
  setupConfirmed: (confirmed: boolean) => string;
  ready: (readyPlayers: number, playerCount: number) => string;
  missingCharacters: (names: string[]) => string;
  allCharactersSelected: string;
  notReady: (names: string[]) => string;
  allPlayersReady: string;
  defaultDifficultyHint: string;
  autoStartHint: string;
  spawnInterval: string;
  spawnIntervalHelper: string;
  enemyHp: string;
  enemyHpHelper: string;
  setupConfirmedButton: string;
  releaseRunButton: string;
  startWhenReady: string;
  releaseBeforeReady: string;
  rangeLabel: (min: number, max: number, step: number) => string;
  difficultyTiers: Record<number, { label: string; description: string }>;
}

const setupText = {
  de: {
    headerTitle: "Arena Survivor Setup",
    headerSubtitle:
      "Pruefe die Teamaufstellung, waehle eine Schwierigkeit von 1 bis 5 und gib den Run dann frei. SPACE bestaetigt, ESC geht zur Spielauswahl.",
    playerStripTitle: "Mitspieler und Charaktere",
    setupPendingTitle: "Setup wird vorbereitet",
    setupPendingLines: [
      "Sobald Arena Survivor ausgewaehlt ist, erscheinen hier Schwierigkeit und Startfreigabe.",
      "Die Runde startet danach automatisch, sobald alle Spieler bereit sind."
    ],
    runStatusTitle: "Run-Status",
    difficulty: "Schwierigkeit",
    setupConfirmed: (confirmed) => `Setup bestaetigt: ${confirmed ? "Ja" : "Nein"}`,
    ready: (readyPlayers, playerCount) => `Bereit: ${readyPlayers}/${playerCount}`,
    missingCharacters: (names) => `Charakter fehlt noch bei: ${names.join(", ")}`,
    allCharactersSelected: "Alle Charaktere sind gewaehlt.",
    notReady: (names) => `Noch nicht bereit: ${names.join(", ")}`,
    allPlayersReady: "Alle Spieler sind bereit.",
    defaultDifficultyHint: "Stufe 3 entspricht dem bisherigen Standard.",
    autoStartHint: "Eine bestaetigte Lobby startet automatisch, sobald alle bereit sind.",
    spawnInterval: "Spawn-Intervall",
    spawnIntervalHelper: "Hoeher bedeutet mehr Zeit zwischen Gegner-Spawns.",
    enemyHp: "Gegner-Leben",
    enemyHpHelper: "Skaliert das Leben aller Gegner inklusive Bossen.",
    setupConfirmedButton: "Setup bestaetigt",
    releaseRunButton: "Run freigeben",
    startWhenReady: "Startet automatisch, sobald alle Spieler bereit bleiben.",
    releaseBeforeReady: "Freigeben geht jetzt schon, startet aber erst mit voller Bereitschaft.",
    rangeLabel: (min, max, step) => `${min} bis ${max} in ${step}-Schritten`,
    difficultyTiers: {
      1: { label: "Sanft", description: "Deutlich entspanntere Spawns und weichere Gegner." },
      2: { label: "Locker", description: "Etwas mehr Luft, ohne die Runde komplett zahm zu machen." },
      3: { label: "Standard", description: "Der bisherige Arena-Survivor-Standard." },
      4: { label: "Hart", description: "Schnellere Wellen mit merklich zaeheren Gegnern." },
      5: { label: "Chaos", description: "Sehr dichter Druck und deutlich robustere Gegner." }
    }
  },
  en: {
    headerTitle: "Arena Survivor Setup",
    headerSubtitle:
      "Review the team, choose a difficulty from 1 to 5, then release the run. SPACE confirms, ESC returns to game selection.",
    playerStripTitle: "Players and Characters",
    setupPendingTitle: "Preparing setup",
    setupPendingLines: [
      "Once Arena Survivor is selected, difficulty and release controls appear here.",
      "After that, the round starts automatically once all players are ready."
    ],
    runStatusTitle: "Run Status",
    difficulty: "Difficulty",
    setupConfirmed: (confirmed) => `Setup confirmed: ${confirmed ? "Yes" : "No"}`,
    ready: (readyPlayers, playerCount) => `Ready: ${readyPlayers}/${playerCount}`,
    missingCharacters: (names) => `Still missing a character: ${names.join(", ")}`,
    allCharactersSelected: "All characters are selected.",
    notReady: (names) => `Not ready yet: ${names.join(", ")}`,
    allPlayersReady: "All players are ready.",
    defaultDifficultyHint: "Level 3 matches the previous default.",
    autoStartHint: "A confirmed lobby starts automatically once everyone is ready.",
    spawnInterval: "Spawn Interval",
    spawnIntervalHelper: "Higher means more time between enemy spawns.",
    enemyHp: "Enemy Health",
    enemyHpHelper: "Scales the health of all enemies, including bosses.",
    setupConfirmedButton: "Setup confirmed",
    releaseRunButton: "Release run",
    startWhenReady: "Starts automatically while all players stay ready.",
    releaseBeforeReady: "You can release now, but the run waits for full readiness.",
    rangeLabel: (min, max, step) => `${min} to ${max} in steps of ${step}`,
    difficultyTiers: {
      1: { label: "Gentle", description: "Much calmer spawns and softer enemies." },
      2: { label: "Relaxed", description: "A little more breathing room without making the run tame." },
      3: { label: "Standard", description: "The previous Arena Survivor default." },
      4: { label: "Hard", description: "Faster waves with noticeably tougher enemies." },
      5: { label: "Chaos", description: "Very dense pressure and much sturdier enemies." }
    }
  }
} satisfies Record<SupportedLanguage, ArenaSurvivorSetupText>;

function findPlayersWithoutCharacter(players: PlayerSnapshot[]): string[] {
  return players
    .filter((player) => !player.selectedCharacterId)
    .map((player) => player.name);
}

function findPlayersNotReady(players: PlayerSnapshot[]): string[] {
  return players
    .filter((player) => !player.isReady)
    .map((player) => player.name);
}

export class ArenaSurvivorSetupScene extends Phaser.Scene {
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
    super("ArenaSurvivorSetupScene");
  }

  create(): void {
    const client = this.registry.get("hostClient") as HostSocketClient;
    const handleConfirm = () => {
      client.sendGameHostAction("arena-survivor", {
        type: "confirm-lobby"
      });
    };
    const handleBackToCatalog = () => client.returnToGameSelection();

    this.client = client;
    this.input.keyboard?.on("keydown-SPACE", handleConfirm);
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
      this.input.keyboard?.off("keydown-SPACE", handleConfirm);
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
      state.room?.arenaSurvivorLobby,
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
    lobby: ArenaSurvivorLobbyState | undefined,
    players: PlayerSnapshot[],
    error: string | null,
    roomCode: string,
    language: SupportedLanguage
  ): void {
    this.children.removeAll(true);
    drawArcadeBackdrop(this);
    const text = setupText[language];

    const accent = getVisualAccent("arena-survivor");
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
      selectedGameId: "arena-survivor",
      title: text.playerStripTitle,
      language
    });
    const lowerY = stripBottom + 18;

    if (!lobby) {
      const infoHeight = Math.max(220, this.scale.height - (lowerY + this.scrollY) - 24);
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

    const stacked = contentWidth < 1_020;
    const gap = 22;
    const setupWidth = stacked ? contentWidth : Math.max(420, Math.floor(contentWidth * 0.58));
    const sideWidth = stacked ? contentWidth : contentWidth - setupWidth - gap;
    const sideX = stacked ? contentX : contentX + setupWidth + gap;
    const sideY = stacked ? lowerY + 392 + 18 : lowerY;
    const infoHeight = Math.max(250, this.scale.height - (sideY + this.scrollY) - 24);

    this.renderSetupPanel(
      lobby,
      players,
      contentX,
      lowerY,
      setupWidth,
      392,
      accent,
      error,
      text
    );

    renderInfoPanel(this, {
      x: sideX,
      y: stacked ? lowerY + 392 + 18 : lowerY,
      width: sideWidth,
      height: infoHeight,
      title: text.runStatusTitle,
      lines: this.buildStatusLines(lobby, players, text),
      accent,
      error,
      language
    });

    const contentBottom = Math.max(lowerY + 392 + this.scrollY, sideY + infoHeight + this.scrollY);

    if (this.updateScrollBounds(contentBottom)) {
      return;
    }

    renderSceneHeader(this, headerOptions);
    renderScrollBar(this, this.scrollY, this.maxScroll);
  }

  private buildStatusLines(
    lobby: ArenaSurvivorLobbyState,
    players: PlayerSnapshot[],
    text: ArenaSurvivorSetupText
  ): string[] {
    const readyPlayers = players.filter((player) => player.isReady).length;
    const missingCharacters = findPlayersWithoutCharacter(players);
    const unreadyPlayers = findPlayersNotReady(players);
    const difficultyTier = resolveArenaSurvivorDifficultyTier(lobby.difficulty);
    const localizedTier = text.difficultyTiers[difficultyTier.level] ?? difficultyTier;

    return [
      `${text.difficulty} ${difficultyTier.level}: ${localizedTier.label}`,
      text.setupConfirmed(lobby.setupConfirmed),
      text.ready(readyPlayers, players.length),
      missingCharacters.length > 0
        ? text.missingCharacters(missingCharacters)
        : text.allCharactersSelected,
      unreadyPlayers.length > 0
        ? text.notReady(unreadyPlayers)
        : text.allPlayersReady,
      text.defaultDifficultyHint,
      text.autoStartHint
    ];
  }

  private renderSetupPanel(
    lobby: ArenaSurvivorLobbyState,
    players: PlayerSnapshot[],
    x: number,
    y: number,
    width: number,
    height: number,
    accent: number,
    error: string | null,
    text: ArenaSurvivorSetupText
  ): void {
    const panel = this.add
      .rectangle(x, y, width, height, panelFill, 0.96)
      .setOrigin(0)
      .setStrokeStyle(1, panelEdge, 0.92);
    panel.setDisplaySize(width, height);

    const difficultyTier = resolveArenaSurvivorDifficultyTier(lobby.difficulty);
    const localizedTier = text.difficultyTiers[difficultyTier.level] ?? difficultyTier;

    this.add.text(x + 20, y + 18, `${text.difficulty} ${difficultyTier.level}: ${localizedTier.label}`, {
      fontFamily: "\"Space Grotesk\", sans-serif",
      fontSize: "30px",
      color: "#f8fafc"
    });
    this.add.text(x + 20, y + 56, localizedTier.description, {
      fontFamily: "\"Nunito Sans\", sans-serif",
      fontSize: "15px",
      color: "#cbd5e1",
      wordWrap: { width: width - 40 }
    });

    this.renderValueStepper(
      text.difficulty,
      lobby.difficulty,
      arenaSurvivorSetupConfig.difficulty.min,
      arenaSurvivorSetupConfig.difficulty.max,
      arenaSurvivorSetupConfig.difficulty.step,
      x + 20,
      y + 118,
      width - 40,
      accent,
      text,
      (value) => {
        this.client?.sendGameHostAction("arena-survivor", {
          type: "configure-lobby",
          difficulty: value
        });
      }
    );

    const statCardY = y + 214;
    const cardGap = 14;
    const cardWidth = Math.max(140, Math.floor((width - 40 - cardGap) / 2));
    this.renderMetricCard(
      x + 20,
      statCardY,
      cardWidth,
      text.spawnInterval,
      `${Math.round(difficultyTier.spawnIntervalMultiplier * 100)}%`,
      text.spawnIntervalHelper
    );
    this.renderMetricCard(
      x + 20 + cardWidth + cardGap,
      statCardY,
      cardWidth,
      text.enemyHp,
      `${Math.round(difficultyTier.enemyHpMultiplier * 100)}%`,
      text.enemyHpHelper
    );

    const canStart =
      findPlayersWithoutCharacter(players).length === 0 && findPlayersNotReady(players).length === 0;
    const startButtonY = y + height - 92;
    const startHeight = 66;
    const buttonFill = lobby.setupConfirmed ? 0x34d399 : accent;
    const startButton = this.add
      .rectangle(x + 20, startButtonY, width - 40, startHeight, buttonFill, 0.96)
      .setOrigin(0)
      .setStrokeStyle(2, 0xf8fafc, 0.18);
    this.add.text(
      x + width / 2,
      startButtonY + 18,
      lobby.setupConfirmed ? text.setupConfirmedButton : text.releaseRunButton,
      {
        fontFamily: "\"Space Grotesk\", sans-serif",
        fontSize: "26px",
        color: "#032217"
      }
    ).setOrigin(0.5, 0);
    this.add.text(
      x + width / 2,
      startButtonY + 46,
      canStart ? text.startWhenReady : text.releaseBeforeReady,
      {
        fontFamily: "\"Nunito Sans\", sans-serif",
        fontSize: "13px",
        color: "#064e3b"
      }
    ).setOrigin(0.5, 0);
    const startZone = this.add
      .zone(x + 20, startButtonY, width - 40, startHeight)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });
    startZone.on("pointerdown", () => {
      this.client?.sendGameHostAction("arena-survivor", {
        type: "confirm-lobby"
      });
    });
    startZone.on("pointerover", () => {
      startButton.setFillStyle(0x34d399, 0.98);
    });
    startZone.on("pointerout", () => {
      startButton.setFillStyle(buttonFill, 0.96);
    });

    if (error) {
      this.add.text(x + 20, startButtonY - 38, error, {
        fontFamily: "\"Nunito Sans\", sans-serif",
        fontSize: "14px",
        color: "#fda4af",
        wordWrap: { width: width - 40 }
      });
    }
  }

  private renderMetricCard(
    x: number,
    y: number,
    width: number,
    label: string,
    value: string,
    helper: string
  ): void {
    this.add
      .rectangle(x, y, width, 86, 0x0f172a, 0.98)
      .setOrigin(0)
      .setStrokeStyle(1, panelEdge, 0.88);
    this.add.text(x + 14, y + 12, label, {
      fontFamily: "\"Nunito Sans\", sans-serif",
      fontSize: "13px",
      color: "#94a3b8"
    });
    this.add.text(x + 14, y + 30, value, {
      fontFamily: "\"Space Grotesk\", sans-serif",
      fontSize: "28px",
      color: "#f8fafc"
    });
    this.add.text(x + 14, y + 58, helper, {
      fontFamily: "\"Nunito Sans\", sans-serif",
      fontSize: "12px",
      color: "#cbd5e1",
      wordWrap: { width: width - 28 }
    });
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
    text: ArenaSurvivorSetupText,
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
    this.renderSmallButton(
      x + width - buttonSize,
      controlY,
      buttonSize,
      buttonSize,
      "+",
      accent,
      value < max,
      () => {
        onChange(Math.min(max, value + step));
      }
    );
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
    const fillColor = enabled ? 0x2d140d : 0x0f172a;
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

    const zone = this.add
      .zone(x, y, width, height)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });
    zone.on("pointerdown", onClick);
    zone.on("pointerover", () => {
      background.setFillStyle(0x3b1d13, 0.98);
      background.setStrokeStyle(2, accent, 0.86);
    });
    zone.on("pointerout", () => {
      background.setFillStyle(fillColor, 0.96);
      background.setStrokeStyle(1, accent, borderAlpha);
    });
  }
}
