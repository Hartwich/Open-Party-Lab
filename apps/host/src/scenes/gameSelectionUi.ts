import Phaser from "phaser";
import type { AvailableGameDto, PlayerSnapshot, SupportedLanguage } from "@open-party-lab/protocol";
import { hostTheme } from "../ui/theme/theme.js";
import { getGameVisual } from "../games/gameVisuals.js";
import { getHostText } from "../i18n/hostText.js";

type GameCardVariant = "lobby" | "compact";

interface SceneHeaderOptions {
  title: string;
  subtitle: string;
  roomCode: string;
  joinUrl?: string;
  language?: SupportedLanguage;
}

interface GameCardGridOptions {
  games: AvailableGameDto[];
  selectedGameId: string | null;
  x: number;
  y: number;
  width: number;
  variant: GameCardVariant;
  language?: SupportedLanguage;
  onSelect?: (gameId: string) => void;
}

interface PlayerPanelOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  players: PlayerSnapshot[];
  selectedGameId: string | null;
  title: string;
  language?: SupportedLanguage;
}

interface PlayerStripOptions {
  x: number;
  y: number;
  width: number;
  players: PlayerSnapshot[];
  selectedGameId: string | null;
  title: string;
  language?: SupportedLanguage;
}

interface InfoPanelOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  lines: string[];
  accent?: number;
  error?: string | null;
  language?: SupportedLanguage;
}

interface SelectedGamePanelOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  game: AvailableGameDto;
  playersCount: number;
  language?: SupportedLanguage;
}

export interface SceneContentFrame {
  x: number;
  width: number;
}

function trimMiddle(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  const visibleChars = Math.max(8, maxLength - 3);
  const left = Math.ceil(visibleChars / 2);
  const right = Math.floor(visibleChars / 2);
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

function fitTextToHeight(
  textObject: Phaser.GameObjects.Text,
  fullText: string,
  maxHeight: number
): void {
  if (textObject.height <= maxHeight) {
    return;
  }

  const words = fullText.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return;
  }

  for (let wordCount = words.length - 1; wordCount > 0; wordCount -= 1) {
    textObject.setText(`${words.slice(0, wordCount).join(" ")}...`);

    if (textObject.height <= maxHeight) {
      return;
    }
  }

  textObject.setText(`${words[0]}...`);
}

function parseColor(input: string | null | undefined, fallback: number): number {
  if (!input) {
    return fallback;
  }

  const normalized = input.startsWith("#") ? input.slice(1) : input;
  const parsed = Number.parseInt(normalized, 16);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function drawStar(
  graphics: Phaser.GameObjects.Graphics,
  centerX: number,
  centerY: number,
  outerRadius: number,
  innerRadius: number,
  points: number
): void {
  graphics.beginPath();

  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + (Math.PI * index) / points;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    if (index === 0) {
      graphics.moveTo(x, y);
    } else {
      graphics.lineTo(x, y);
    }
  }

  graphics.closePath();
}

function drawLightningBolt(
  graphics: Phaser.GameObjects.Graphics,
  startX: number,
  startY: number,
  width: number,
  height: number
): void {
  graphics.beginPath();
  graphics.moveTo(startX + width * 0.48, startY);
  graphics.lineTo(startX + width * 0.18, startY + height * 0.52);
  graphics.lineTo(startX + width * 0.42, startY + height * 0.52);
  graphics.lineTo(startX + width * 0.2, startY + height);
  graphics.lineTo(startX + width * 0.82, startY + height * 0.36);
  graphics.lineTo(startX + width * 0.56, startY + height * 0.36);
  graphics.closePath();
}

function drawSparkBurst(
  graphics: Phaser.GameObjects.Graphics,
  centerX: number,
  centerY: number,
  radius: number
): void {
  graphics.lineBetween(centerX - radius, centerY, centerX + radius, centerY);
  graphics.lineBetween(centerX, centerY - radius, centerX, centerY + radius);
  graphics.lineBetween(
    centerX - radius * 0.72,
    centerY - radius * 0.72,
    centerX + radius * 0.72,
    centerY + radius * 0.72
  );
  graphics.lineBetween(
    centerX - radius * 0.72,
    centerY + radius * 0.72,
    centerX + radius * 0.72,
    centerY - radius * 0.72
  );
}

function drawGameIcon(
  graphics: Phaser.GameObjects.Graphics,
  gameId: string,
  size: number,
  accent: number,
  accentSoft: number
): void {
  const lineWidth = Math.max(2, size * 0.065);
  const secondaryLine = Math.max(1, size * 0.04);
  const center = size / 2;

  graphics.clear();
  graphics.fillStyle(accentSoft, 0.96);
  graphics.lineStyle(lineWidth, accent, 1);

  switch (gameId) {
    case "chaos-kommando": {
      graphics.fillRoundedRect(size * 0.14, size * 0.58, size * 0.38, size * 0.18, size * 0.04);
      graphics.strokeRoundedRect(size * 0.14, size * 0.58, size * 0.38, size * 0.18, size * 0.04);
      graphics.fillCircle(size * 0.25, size * 0.8, size * 0.07);
      graphics.fillCircle(size * 0.44, size * 0.8, size * 0.07);
      graphics.beginPath();
      graphics.moveTo(size * 0.48, size * 0.57);
      graphics.lineTo(size * 0.76, size * 0.34);
      graphics.lineTo(size * 0.82, size * 0.42);
      graphics.lineTo(size * 0.54, size * 0.64);
      graphics.closePath();
      graphics.fillPath();
      graphics.strokePath();
      graphics.lineStyle(secondaryLine, accent, 0.58);
      graphics.lineBetween(size * 0.3, size * 0.44, size * 0.42, size * 0.32);
      graphics.lineBetween(size * 0.5, size * 0.27, size * 0.64, size * 0.22);
      graphics.lineBetween(size * 0.72, size * 0.22, size * 0.82, size * 0.28);
      graphics.lineStyle(lineWidth, accent, 1);
      drawSparkBurst(graphics, size * 0.84, size * 0.25, size * 0.07);
      break;
    }
    case "zeichnen-und-erraten": {
      graphics.strokeRoundedRect(size * 0.14, size * 0.16, size * 0.54, size * 0.46, size * 0.06);
      graphics.lineStyle(secondaryLine, accent, 0.55);
      graphics.lineBetween(size * 0.22, size * 0.3, size * 0.54, size * 0.3);
      graphics.lineBetween(size * 0.22, size * 0.43, size * 0.44, size * 0.43);
      graphics.lineStyle(lineWidth, accent, 1);
      graphics.beginPath();
      graphics.moveTo(size * 0.44, size * 0.78);
      graphics.lineTo(size * 0.74, size * 0.36);
      graphics.lineTo(size * 0.85, size * 0.44);
      graphics.lineTo(size * 0.54, size * 0.86);
      graphics.closePath();
      graphics.fillPath();
      graphics.strokePath();
      graphics.lineStyle(secondaryLine, 0x020617, 0.48);
      graphics.lineBetween(size * 0.72, size * 0.42, size * 0.79, size * 0.47);
      graphics.lineStyle(lineWidth, accent, 1);
      graphics.fillCircle(size * 0.28, size * 0.74, size * 0.05);
      graphics.lineBetween(size * 0.34, size * 0.7, size * 0.4, size * 0.64);
      break;
    }
    case "arena-survivor": {
      graphics.strokeCircle(center, center, size * 0.28);
      graphics.lineBetween(center, size * 0.08, center, size * 0.22);
      graphics.lineBetween(center, size * 0.78, center, size * 0.92);
      graphics.lineBetween(size * 0.08, center, size * 0.22, center);
      graphics.lineBetween(size * 0.78, center, size * 0.92, center);
      drawStar(graphics, center, center, size * 0.14, size * 0.07, 4);
      graphics.fillPath();
      graphics.strokePath();
      break;
    }
    case "minions-td": {
      graphics.beginPath();
      graphics.moveTo(size * 0.12, size * 0.84);
      graphics.lineTo(size * 0.36, size * 0.62);
      graphics.lineTo(size * 0.56, size * 0.74);
      graphics.lineTo(size * 0.88, size * 0.24);
      graphics.strokePath();

      graphics.fillRoundedRect(size * 0.18, size * 0.24, size * 0.3, size * 0.4, size * 0.06);
      graphics.strokeRoundedRect(size * 0.18, size * 0.24, size * 0.3, size * 0.4, size * 0.06);
      graphics.fillRect(size * 0.2, size * 0.16, size * 0.06, size * 0.08);
      graphics.fillRect(size * 0.3, size * 0.12, size * 0.06, size * 0.12);
      graphics.fillRect(size * 0.4, size * 0.16, size * 0.06, size * 0.08);
      break;
    }
    case "imposter": {
      graphics.fillRoundedRect(size * 0.26, size * 0.2, size * 0.48, size * 0.58, size * 0.18);
      graphics.strokeRoundedRect(size * 0.26, size * 0.2, size * 0.48, size * 0.58, size * 0.18);
      graphics.fillStyle(0x08111f, 0.86);
      graphics.fillRoundedRect(size * 0.34, size * 0.38, size * 0.32, size * 0.15, size * 0.07);
      graphics.lineStyle(secondaryLine, accent, 0.76);
      graphics.strokeRoundedRect(size * 0.34, size * 0.38, size * 0.32, size * 0.15, size * 0.07);
      graphics.lineStyle(lineWidth, accent, 1);
      graphics.fillStyle(accentSoft, 0.96);
      graphics.fillCircle(size * 0.5, size * 0.46, size * 0.035);
      graphics.beginPath();
      graphics.moveTo(size * 0.28, size * 0.68);
      graphics.lineTo(size * 0.12, size * 0.82);
      graphics.lineTo(size * 0.28, size * 0.82);
      graphics.closePath();
      graphics.fillPath();
      graphics.strokePath();
      break;
    }
    case "tabu": {
      graphics.fillRoundedRect(size * 0.2, size * 0.22, size * 0.54, size * 0.42, size * 0.06);
      graphics.strokeRoundedRect(size * 0.2, size * 0.22, size * 0.54, size * 0.42, size * 0.06);
      graphics.lineStyle(secondaryLine, accent, 0.72);
      graphics.lineBetween(size * 0.3, size * 0.36, size * 0.62, size * 0.36);
      graphics.lineBetween(size * 0.3, size * 0.48, size * 0.58, size * 0.48);
      graphics.lineBetween(size * 0.3, size * 0.6, size * 0.5, size * 0.6);
      graphics.lineStyle(lineWidth, accent, 1);
      graphics.strokeCircle(size * 0.68, size * 0.68, size * 0.18);
      graphics.lineBetween(size * 0.56, size * 0.8, size * 0.8, size * 0.56);
      break;
    }
    case "pantomime": {
      graphics.fillStyle(accentSoft, 0.18);
      graphics.beginPath();
      graphics.moveTo(center, size * 0.12);
      graphics.lineTo(size * 0.18, size * 0.88);
      graphics.lineTo(size * 0.82, size * 0.88);
      graphics.closePath();
      graphics.fillPath();
      graphics.fillStyle(accentSoft, 0.96);
      graphics.strokeCircle(center, size * 0.34, size * 0.1);
      graphics.lineBetween(center, size * 0.44, center, size * 0.64);
      graphics.lineBetween(center, size * 0.5, size * 0.28, size * 0.6);
      graphics.lineBetween(center, size * 0.5, size * 0.72, size * 0.6);
      graphics.lineBetween(center, size * 0.64, size * 0.34, size * 0.82);
      graphics.lineBetween(center, size * 0.64, size * 0.66, size * 0.82);
      graphics.fillCircle(size * 0.28, size * 0.6, size * 0.045);
      graphics.fillCircle(size * 0.72, size * 0.6, size * 0.045);
      break;
    }
    case "tap-race": {
      graphics.fillRoundedRect(size * 0.4, size * 0.12, size * 0.18, size * 0.38, size * 0.08);
      graphics.strokeRoundedRect(size * 0.4, size * 0.12, size * 0.18, size * 0.38, size * 0.08);
      graphics.fillCircle(center, size * 0.68, size * 0.16);
      graphics.strokeCircle(center, size * 0.68, size * 0.16);
      graphics.lineStyle(secondaryLine, accent, 0.78);
      graphics.strokeCircle(center, size * 0.68, size * 0.24);
      graphics.lineStyle(lineWidth, accent, 1);
      graphics.lineBetween(size * 0.18, size * 0.24, size * 0.3, size * 0.24);
      graphics.lineBetween(size * 0.7, size * 0.24, size * 0.82, size * 0.24);
      break;
    }
    case "air-hockey": {
      graphics.strokeRoundedRect(size * 0.12, size * 0.16, size * 0.76, size * 0.68, size * 0.08);
      graphics.lineStyle(secondaryLine, accent, 0.54);
      graphics.lineBetween(center, size * 0.16, center, size * 0.84);
      graphics.strokeCircle(center, center, size * 0.15);
      graphics.lineStyle(lineWidth, accent, 1);
      graphics.fillCircle(size * 0.3, center, size * 0.13);
      graphics.strokeCircle(size * 0.3, center, size * 0.13);
      graphics.fillCircle(size * 0.7, center, size * 0.13);
      graphics.strokeCircle(size * 0.7, center, size * 0.13);
      graphics.fillStyle(0x08111f, 0.88);
      graphics.fillCircle(center, size * 0.28, size * 0.065);
      graphics.lineStyle(secondaryLine, accentSoft, 0.82);
      graphics.strokeCircle(center, size * 0.28, size * 0.065);
      break;
    }
    case "light-trails": {
      graphics.beginPath();
      graphics.moveTo(size * 0.14, size * 0.78);
      graphics.lineTo(size * 0.28, size * 0.38);
      graphics.lineTo(size * 0.5, size * 0.34);
      graphics.lineTo(size * 0.72, size * 0.5);
      graphics.lineTo(size * 0.74, size * 0.86);
      graphics.strokePath();
      graphics.fillCircle(size * 0.14, size * 0.78, size * 0.06);
      graphics.fillCircle(size * 0.74, size * 0.86, size * 0.07);
      break;
    }
    default: {
      graphics.strokeCircle(center, center, size * 0.32);
      drawStar(graphics, center, center, size * 0.18, size * 0.09, 4);
      graphics.fillPath();
      graphics.strokePath();
    }
  }
}

function getColumns(width: number, variant: GameCardVariant, gameCount: number): number {
  if (variant === "compact") {
    if (width >= 1_160 && gameCount <= 8) {
      return gameCount;
    }

    if (width >= 760) {
      return 4;
    }

    return 2;
  }

  if (width >= 760) {
    return 4;
  }

  if (width >= 520) {
    return 2;
  }

  return 1;
}

function drawPill(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  fillColor: number,
  textColor: string = hostTheme.text
): Phaser.GameObjects.Container {
  const paddingX = 12;
  const paddingY = 7;
  const text = scene.add.text(0, 0, label, {
    fontFamily: hostTheme.bodyFont,
    fontSize: "14px",
    color: textColor
  });
  const width = text.width + paddingX * 2;
  const height = text.height + paddingY * 2;
  const background = scene.add
    .rectangle(0, 0, width, height, fillColor, 0.96)
    .setOrigin(0)
    .setStrokeStyle(1, 0xffffff, 0.08);
  text.setPosition(paddingX, paddingY - 1);
  return scene.add.container(x, y, [background, text]);
}

function renderGameCard(
  scene: Phaser.Scene,
  game: AvailableGameDto,
  selected: boolean,
  x: number,
  y: number,
  width: number,
  height: number,
  variant: GameCardVariant,
  index: number,
  language: SupportedLanguage | undefined,
  onSelect?: (gameId: string) => void
): void {
  const text = getHostText(language);
  const visual = getGameVisual(game.id);
  const container = scene.add.container(x, y);
  const shadow = scene.add.rectangle(6, 10, width, height, 0x020617, 0.34).setOrigin(0);
  const glow = scene.add
    .ellipse(width - 40, variant === "compact" ? 34 : 42, 92, 92, visual.accent, selected ? 0.2 : 0.1)
    .setBlendMode(Phaser.BlendModes.ADD);
  const background = scene.add
    .rectangle(0, 0, width, height, visual.surface, selected ? 0.97 : 0.9)
    .setOrigin(0)
    .setStrokeStyle(selected ? 3 : 1, selected ? visual.accent : 0xffffff, selected ? 1 : 0.08);
  const accentBar = scene.add.rectangle(0, 0, width, 8, visual.accent, 1).setOrigin(0);
  const iconPlateSize = variant === "compact" ? 56 : 72;
  const iconPlate = scene.add
    .rectangle(18, 18, iconPlateSize, iconPlateSize, 0x08111f, 0.92)
    .setOrigin(0)
    .setStrokeStyle(1, 0xffffff, 0.1);
  const icon = scene.add.graphics().setPosition(26, 26);
  drawGameIcon(icon, game.id, iconPlateSize - 16, visual.accent, visual.accentSoft);

  container.add([shadow, glow, background, accentBar, iconPlate, icon]);

  if (variant === "compact") {
    const title = scene.add.text(92, 36, game.displayName, {
      fontFamily: hostTheme.titleFont,
      fontSize: "20px",
      color: hostTheme.text,
      wordWrap: { width: width - 152 }
    });
    fitTextToHeight(title, game.displayName, 42);
    const metaY = Math.min(80, title.y + title.height + 5);
    container.add(title);
    container.add(
      scene.add.text(92, metaY, text.playerRange(game.minPlayers, game.maxPlayers), {
        fontFamily: hostTheme.bodyFont,
        fontSize: "14px",
        color: "#cbd5e1"
      })
    );
  } else {
    const title = scene.add.text(18, 104, game.displayName, {
      fontFamily: hostTheme.titleFont,
      fontSize: "26px",
      color: hostTheme.text,
      wordWrap: { width: width - 36 }
    });
    fitTextToHeight(title, game.displayName, 64);
    container.add(title);
  }

  const shortcut = drawPill(scene, width - 54, variant === "compact" ? 14 : 18, `${index + 1}`, 0x0f172a);
  container.add(shortcut);

  if (selected) {
    const badge = drawPill(scene, 18, height - 36, text.selected, visual.accent, "#08111f");
    container.add(badge);
  } else if (variant === "lobby") {
    const meta = drawPill(
      scene,
      18,
      height - 36,
      text.playerRange(game.minPlayers, game.maxPlayers),
      0x0b1220
    );
    container.add(meta);
  }

  const clickZone = scene.add.zone(x, y, width, height).setOrigin(0);

  if (onSelect) {
    clickZone.setInteractive({ useHandCursor: true });
    clickZone.on("pointerdown", () => onSelect(game.id));
    clickZone.on("pointerover", () => {
      container.y = y - 6;
      shadow.setAlpha(0.48);
      background.setFillStyle(visual.surfaceHover, 0.98);
      background.setStrokeStyle(2, visual.accent, 0.82);
      glow.setAlpha(selected ? 0.28 : 0.2);
    });
    clickZone.on("pointerout", () => {
      container.y = y;
      shadow.setAlpha(0.34);
      background.setFillStyle(visual.surface, selected ? 0.97 : 0.9);
      background.setStrokeStyle(selected ? 3 : 1, selected ? visual.accent : 0xffffff, selected ? 1 : 0.08);
      glow.setAlpha(selected ? 0.2 : 0.1);
    });
  }

  if (selected) {
    scene.tweens.add({
      targets: glow,
      alpha: { from: 0.16, to: 0.28 },
      duration: 1_100,
      yoyo: true,
      repeat: -1
    });
  }
}

export function drawArcadeBackdrop(scene: Phaser.Scene): void {
  const width = scene.scale.width;
  const height = scene.scale.height;

  scene.cameras.main.setBackgroundColor("#030712");

  const background = scene.add.graphics();
  background.fillStyle(0x030712, 1);
  background.fillRect(0, 0, width, height);
  background.fillStyle(0x071124, 1);
  background.fillCircle(width * 0.16, height * 0.18, Math.max(width * 0.16, 140));
  background.fillStyle(0x111827, 0.96);
  background.fillCircle(width * 0.88, height * 0.14, Math.max(width * 0.1, 92));
  background.fillStyle(0x08111f, 1);
  background.fillCircle(width * 0.74, height * 0.82, Math.max(width * 0.24, 220));

  const grid = Math.max(56, Math.floor(width / 18));
  background.lineStyle(1, 0x1e293b, 0.3);

  for (let x = grid; x < width; x += grid) {
    background.lineBetween(x, 0, x, height);
  }

  for (let y = grid; y < height; y += grid) {
    background.lineBetween(0, y, width, y);
  }
}

export function getSceneContentFrame(scene: Phaser.Scene): SceneContentFrame {
  const x = 40;
  const rightSafeArea = scene.scale.width >= 840 ? 120 : 40;

  return {
    x,
    width: Math.max(scene.scale.width - x - rightSafeArea, 260)
  };
}

function getSceneHeaderMetrics(
  scene: Phaser.Scene,
  { subtitle, joinUrl }: Pick<SceneHeaderOptions, "subtitle" | "joinUrl">
): { x: number; y: number; width: number; height: number; narrow: boolean; bottom: number } {
  const { x, width } = getSceneContentFrame(scene);
  const y = 28;
  const narrow = width < 860;
  const hasSubtitle = subtitle.trim().length > 0;
  const height = joinUrl ? (narrow ? (hasSubtitle ? 226 : 196) : 126) : narrow ? (hasSubtitle ? 160 : 126) : 108;

  return {
    x,
    y,
    width,
    height,
    narrow,
    bottom: y + height + 22
  };
}

export function measureSceneHeaderBottom(scene: Phaser.Scene, options: SceneHeaderOptions): number {
  return getSceneHeaderMetrics(scene, options).bottom;
}

export function renderSceneHeader(
  scene: Phaser.Scene,
  { title, subtitle, roomCode, joinUrl, language }: SceneHeaderOptions
): number {
  const text = getHostText(language);
  const { x, y, width, height: headerHeight, narrow, bottom } = getSceneHeaderMetrics(scene, { subtitle, joinUrl });
  const panel = scene.add
    .rectangle(x, y, width, headerHeight, 0x08111f, 0.9)
    .setOrigin(0)
    .setStrokeStyle(1, 0xffffff, 0.08);

  void panel;

  scene.add.text(x + 24, y + 18, title, {
    fontFamily: hostTheme.titleFont,
    fontSize: narrow ? "32px" : "44px",
    color: hostTheme.text,
    wordWrap: { width: narrow ? width - 48 : width - 300 }
  });
  scene.add.text(x + 24, y + (narrow ? 62 : 68), subtitle, {
    fontFamily: hostTheme.bodyFont,
    fontSize: narrow ? "16px" : "18px",
    color: "#cbd5e1",
    lineSpacing: 4,
    wordWrap: { width: narrow ? width - 48 : width - 320 }
  }).setVisible(subtitle.trim().length > 0);

  const codeCardWidth = narrow ? width - 48 : 214;
  const codeCardX = narrow ? x + 24 : x + width - codeCardWidth - 20;
  const hasSubtitle = subtitle.trim().length > 0;
  const codeCardY = narrow ? y + (joinUrl ? (hasSubtitle ? 118 : 88) : hasSubtitle ? 96 : 72) : y + 18;
  scene.add
    .rectangle(codeCardX, codeCardY, codeCardWidth, 70, 0x0b1320, 0.96)
    .setOrigin(0)
    .setStrokeStyle(1, 0xffffff, 0.08);
  scene.add.text(codeCardX + 14, codeCardY + 10, text.roomCode, {
    fontFamily: hostTheme.monoFont,
    fontSize: "12px",
    color: "#93c5fd"
  });
  scene.add.text(codeCardX + 14, codeCardY + 28, roomCode, {
    fontFamily: hostTheme.titleFont,
    fontSize: "28px",
    color: hostTheme.text
  });

  if (joinUrl) {
    scene.add.text(x + 24, y + headerHeight - 30, `${text.join}: ${trimMiddle(joinUrl, narrow ? 56 : 88)}`, {
      fontFamily: hostTheme.bodyFont,
      fontSize: "14px",
    color: "#7dd3fc"
    });
  }

  const blocker = scene.add.zone(x, y, width, headerHeight).setOrigin(0).setInteractive();
  blocker.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event?: Phaser.Types.Input.EventData) => {
    event?.stopPropagation();
  });

  return bottom;
}

export function renderGameCardGrid(scene: Phaser.Scene, options: GameCardGridOptions): number {
  const { games, selectedGameId, x, y, width, variant, language, onSelect } = options;
  const gap = variant === "compact" ? 12 : 18;
  const columns = getColumns(width, variant, games.length);
  const cardHeight = variant === "compact" ? 106 : 178;
  const cardWidth = Math.floor((width - gap * (columns - 1)) / columns);

  games.forEach((game, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const cardX = x + column * (cardWidth + gap);
    const cardY = y + row * (cardHeight + gap);
    renderGameCard(
      scene,
      game,
      selectedGameId === game.id,
      cardX,
      cardY,
      cardWidth,
      cardHeight,
      variant,
      index,
      language,
      onSelect
    );
  });

  const rows = Math.ceil(games.length / columns);
  return y + rows * cardHeight + Math.max(0, rows - 1) * gap;
}

export function renderPlayerPanel(scene: Phaser.Scene, options: PlayerPanelOptions): void {
  const { x, y, width, height, players, selectedGameId, title, language } = options;
  const text = getHostText(language);
  const panel = scene.add
    .rectangle(x, y, width, height, 0x08111f, 0.9)
    .setOrigin(0)
    .setStrokeStyle(1, 0xffffff, 0.08);

  void panel;

  scene.add.text(x + 18, y + 16, title, {
    fontFamily: hostTheme.titleFont,
    fontSize: "26px",
    color: hostTheme.text
  });
  scene.add.text(x + 18, y + 46, `${players.length} ${text.connectedShort}`, {
    fontFamily: hostTheme.bodyFont,
    fontSize: "14px",
    color: "#94a3b8"
  });

  if (players.length === 0) {
    scene.add.text(x + 18, y + 88, text.noPlayersJoined, {
      fontFamily: hostTheme.bodyFont,
      fontSize: "18px",
      color: "#cbd5e1",
      wordWrap: { width: width - 36 }
    });
    return;
  }

  const arenaMode = selectedGameId === "arena-survivor";
  const preferredRowHeight = arenaMode ? 48 : 42;
  const availableRowsHeight = Math.max(42, height - 88);
  const rowHeight = Math.max(30, Math.min(preferredRowHeight, Math.floor(availableRowsHeight / players.length)));
  const visiblePlayers = rowHeight <= 31 ? players.slice(0, Math.max(1, Math.floor(availableRowsHeight / 30) - 1)) : players;
  const hiddenPlayers = players.length - visiblePlayers.length;
  const rowWidth = width - 36;

  visiblePlayers.forEach((player, index) => {
    const rowY = y + 80 + index * rowHeight;
    const playerColor = parseColor(player.color, 0x38bdf8);
    const readyColor = player.isReady ? 0x10b981 : player.connected ? 0xf59e0b : 0x64748b;
    const statusLabel = player.isReady
      ? text.ready
      : player.connected
        ? text.waiting
        : player.presence === "reconnecting"
          ? text.reconnecting
          : "offline";

    scene.add
      .rectangle(x + 18, rowY, rowWidth, rowHeight - 8, 0x0b1320, 0.96)
      .setOrigin(0)
      .setStrokeStyle(1, 0xffffff, 0.06);
    scene.add.circle(x + 34, rowY + (rowHeight - 8) / 2, 6, playerColor, 1);
    scene.add.text(x + 48, rowY + 7, player.name, {
      fontFamily: hostTheme.bodyFont,
      fontSize: arenaMode ? "17px" : "18px",
      color: hostTheme.text
    });

    if (arenaMode) {
      scene.add.text(x + 48, rowY + 24, player.selectedCharacterName ?? text.characterSelecting, {
        fontFamily: hostTheme.bodyFont,
        fontSize: "12px",
        color: "#94a3b8"
      });
    }

    const status = drawPill(
      scene,
      x + rowWidth - 88,
      rowY + 6,
      statusLabel,
      readyColor,
      readyColor === 0x10b981 ? "#06251c" : "#08111f"
    );
    void status;
  });

  if (hiddenPlayers > 0) {
    scene.add.text(x + 18, y + height - 28, text.morePlayers(hiddenPlayers), {
      fontFamily: hostTheme.bodyFont,
      fontSize: "14px",
      color: "#94a3b8"
    });
  }
}

export function renderPlayerStrip(scene: Phaser.Scene, options: PlayerStripOptions): number {
  const { x, y, width, players, selectedGameId, title, language } = options;
  const text = getHostText(language);
  const arenaMode = selectedGameId === "arena-survivor";
  const chipGap = 10;
  const chipHeight = arenaMode ? 38 : 32;
  const maxX = x + width - 18;
  let cursorX = x + 18;
  let cursorY = y + 44;
  const chipLayouts = players.map((player) => {
    const statusLabel = player.isReady ? text.ready : player.connected ? text.waiting : "offline";
    const detail = arenaMode ? ` | ${player.selectedCharacterName ?? text.characterSelecting}` : "";
    const label = `${player.name} ${statusLabel}${detail}`;
    const chipWidth = Math.min(Math.max(138, width - 36), Math.max(138, 72 + label.length * (arenaMode ? 5.2 : 6)));

    if (cursorX + chipWidth > maxX) {
      cursorX = x + 18;
      cursorY += chipHeight + chipGap;
    }

    const layout = { player, label, x: cursorX, y: cursorY, width: chipWidth };
    cursorX += chipWidth + chipGap;
    return layout;
  });
  const panelHeight = players.length === 0 ? 76 : Math.max(76, cursorY + chipHeight + 8 - y);

  scene.add
    .rectangle(x, y, width, panelHeight, 0x08111f, 0.9)
    .setOrigin(0)
    .setStrokeStyle(1, 0xffffff, 0.08);
  scene.add.text(x + 18, y + 14, title, {
    fontFamily: hostTheme.titleFont,
    fontSize: "24px",
    color: hostTheme.text
  });

  if (players.length === 0) {
    scene.add.text(x + 18, y + 42, text.noPlayersJoined, {
      fontFamily: hostTheme.bodyFont,
      fontSize: "16px",
      color: "#cbd5e1"
    });
    return y + panelHeight;
  }

  chipLayouts.forEach(({ player, label, x: chipX, y: chipY, width: chipWidth }) => {
    const fillColor = player.isReady ? 0x08362a : player.connected ? 0x2b1f0a : 0x0f172a;
    const playerColor = parseColor(player.color, 0x38bdf8);
    scene.add
      .rectangle(chipX, chipY, chipWidth, chipHeight, fillColor, 0.96)
      .setOrigin(0)
      .setStrokeStyle(1, playerColor, 0.42);
    scene.add.circle(chipX + 16, chipY + chipHeight / 2, 5, playerColor, 1);
    scene.add.text(chipX + 28, chipY + 8, trimMiddle(label, arenaMode ? 40 : 28), {
      fontFamily: hostTheme.bodyFont,
      fontSize: arenaMode ? "14px" : "15px",
      color: hostTheme.text
    });
  });

  return y + panelHeight;
}

export function renderSelectedGamePanel(
  scene: Phaser.Scene,
  { x, y, width, height, game, playersCount, language }: SelectedGamePanelOptions
): void {
  const text = getHostText(language);
  const visual = getGameVisual(game.id);
  scene.add
    .rectangle(x, y, width, height, visual.surface, 0.96)
    .setOrigin(0)
    .setStrokeStyle(2, visual.accent, 0.42);
  scene.add
    .ellipse(x + width - 72, y + 66, 132, 132, visual.accent, 0.12)
    .setBlendMode(Phaser.BlendModes.ADD);

  const iconPlateSize = 108;
  scene.add
    .rectangle(x + 24, y + 24, iconPlateSize, iconPlateSize, 0x08111f, 0.96)
    .setOrigin(0)
    .setStrokeStyle(1, 0xffffff, 0.08);
  const icon = scene.add.graphics().setPosition(x + 40, y + 40);
  drawGameIcon(icon, game.id, iconPlateSize - 32, visual.accent, visual.accentSoft);

  scene.add.text(x + 152, y + 28, visual.eyebrow.toUpperCase(), {
    fontFamily: hostTheme.monoFont,
    fontSize: "12px",
    color: "#cbd5e1"
  });
  const title = scene.add.text(x + 152, y + 48, game.displayName, {
    fontFamily: hostTheme.titleFont,
    fontSize: "34px",
    color: hostTheme.text,
    wordWrap: { width: width - 176 }
  });
  const description = scene.add.text(x + 152, title.y + title.height + 8, game.description, {
    fontFamily: hostTheme.bodyFont,
    fontSize: "17px",
    color: "#dbeafe",
    lineSpacing: 4,
    wordWrap: { width: width - 176 }
  });
  fitTextToHeight(description, game.description, Math.max(36, height - description.y - 62));

  const pillsY = y + height - 52;
  drawPill(scene, x + 24, pillsY, text.playerRange(game.minPlayers, game.maxPlayers), 0x08111f);
  drawPill(scene, x + 194, pillsY, `${text.lobby}: ${playersCount}`, 0x08111f);
}

export function renderInfoPanel(scene: Phaser.Scene, options: InfoPanelOptions): void {
  const { x, y, width, height, title, lines, accent = 0x38bdf8, error, language } = options;
  const text = getHostText(language);
  scene.add
    .rectangle(x, y, width, height, 0x08111f, 0.9)
    .setOrigin(0)
    .setStrokeStyle(1, accent, 0.24);
  scene.add.rectangle(x, y, width, 8, accent, 1).setOrigin(0);
  const titleText = scene.add.text(x + 18, y + 20, title, {
    fontFamily: hostTheme.titleFont,
    fontSize: "24px",
    color: hostTheme.text,
    wordWrap: { width: width - 36 }
  });
  fitTextToHeight(titleText, title, Math.max(28, height - 46));

  const contentLines = error ? [...lines, "", `${text.errorLabel}: ${error}`] : lines;
  const contentY = Math.min(y + height - 24, titleText.y + titleText.height + 16);
  const contentText = scene.add.text(x + 18, contentY, contentLines.join("\n"), {
    fontFamily: hostTheme.bodyFont,
    fontSize: "17px",
    color: error ? "#fde68a" : "#dbeafe",
    lineSpacing: 8,
    wordWrap: { width: width - 36 }
  });
  fitTextToHeight(contentText, contentLines.join("\n"), Math.max(24, y + height - contentY - 16));
}

export { getVisualAccent } from "../games/gameVisuals.js";
