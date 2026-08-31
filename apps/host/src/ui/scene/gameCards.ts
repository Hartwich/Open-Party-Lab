import Phaser from "phaser";
import type { AvailableGameDto, SupportedLanguage } from "@open-party-lab/protocol";
import { getHostText } from "../../i18n/hostText.js";
import { getGameVisual } from "../../games/gameVisuals.js";
import { hostTheme } from "../theme/theme.js";
import { sceneAlpha, sceneColor } from "../theme/sceneColors.js";
import { drawGameIcon } from "./gameIcons.js";
import { drawPill } from "./pill.js";
import { addSceneText } from "./sceneText.js";
import { fitTextToBox } from "./textFitting.js";

export type GameCardVariant = "lobby" | "compact";

export interface GameCardGridOptions {
  games: AvailableGameDto[];
  selectedGameId: string | null;
  x: number;
  y: number;
  width: number;
  variant: GameCardVariant;
  language?: SupportedLanguage;
  onSelect?: (gameId: string) => void;
}

const cardMetrics = {
  lobby: { gap: 18, minWidth: 176, height: 178 },
  compact: { gap: 12, minWidth: 236, height: 106 }
} as const;

function getColumns(width: number, variant: GameCardVariant, gameCount: number): number {
  const { gap, minWidth } = cardMetrics[variant];
  const limitToStableCardWidth = (columns: number): number => {
    const maxColumns = Math.max(1, Math.floor((width + gap) / (minWidth + gap)));
    return Math.max(1, Math.min(columns, gameCount, maxColumns));
  };

  if (variant === "compact") {
    if (width >= 1_160 && gameCount <= 8) {
      return limitToStableCardWidth(gameCount);
    }

    return limitToStableCardWidth(width >= 760 ? 4 : 2);
  }

  if (width >= 760) {
    return limitToStableCardWidth(4);
  }

  return limitToStableCardWidth(width >= 520 ? 2 : 1);
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
  const visual = getGameVisual(game);
  const container = scene.add.container(x, y);
  const shadow = scene.add
    .rectangle(4, 7, width, height, sceneColor.ink, sceneAlpha.shadow)
    .setOrigin(0);
  const glow = scene.add.ellipse(
    width - 40,
    variant === "compact" ? 34 : 42,
    92,
    92,
    visual.accent,
    selected ? 0.14 : 0.06
  );
  const background = scene.add
    .rectangle(0, 0, width, height, visual.surface, 1)
    .setOrigin(0)
    .setStrokeStyle(selected ? 2 : 1, selected ? visual.accent : sceneColor.line, 1);
  const accentBar = scene.add.rectangle(0, 0, width, selected ? 6 : 4, visual.accent, 1).setOrigin(0);
  const iconPlateSize = variant === "compact" ? 56 : 72;
  const iconPlate = scene.add
    .rectangle(18, 18, iconPlateSize, iconPlateSize, visual.accentSoft, 1)
    .setOrigin(0)
    .setStrokeStyle(1, visual.accent, 0.34);
  const icon = scene.add.graphics().setPosition(26, 26);

  drawGameIcon(icon, iconPlateSize - 16, visual.accent, visual.accentSoft);
  container.add([shadow, glow, background, accentBar, iconPlate, icon]);

  if (variant === "compact") {
    const titleMaxWidth = Math.max(42, width - 152);
    const title = addSceneText(scene, 92, 36, game.displayName, {
      fontFamily: hostTheme.titleFont,
      fontSize: "20px",
      color: hostTheme.text,
      wordWrap: { width: titleMaxWidth, useAdvancedWrap: true }
    });
    container.add(title);
    fitTextToBox(title, game.displayName, titleMaxWidth, 42);

    if (!selected) {
      const metaText = text.playerRange(game.minPlayers, game.maxPlayers);
      const metaMaxWidth = Math.max(42, width - 108);
      const metaY = Math.min(80, title.y + title.height + 5);
      const meta = addSceneText(scene, 92, metaY, metaText, {
        fontFamily: hostTheme.bodyFont,
        fontSize: "14px",
        color: hostTheme.muted,
        wordWrap: { width: metaMaxWidth, useAdvancedWrap: true }
      });
      fitTextToBox(meta, metaText, metaMaxWidth, 18);
      container.add(meta);
    }
  } else {
    const titleMaxWidth = Math.max(42, width - 36);
    const titleMaxHeight = Math.max(24, height - 148);
    const title = addSceneText(scene, 18, 104, game.displayName, {
      fontFamily: hostTheme.titleFont,
      fontSize: "26px",
      color: hostTheme.text,
      wordWrap: { width: titleMaxWidth, useAdvancedWrap: true }
    });
    container.add(title);
    fitTextToBox(title, game.displayName, titleMaxWidth, titleMaxHeight);
  }

  container.add(
    drawPill(
      scene,
      width - 54,
      variant === "compact" ? 14 : 18,
      `${index + 1}`,
      sceneColor.panelMuted,
      hostTheme.muted
    )
  );

  if (selected) {
    container.add(drawPill(scene, 18, height - 36, text.selected, visual.accent, visual.onAccent));
  } else if (variant === "lobby") {
    container.add(
      drawPill(
        scene,
        18,
        height - 36,
        text.playerRange(game.minPlayers, game.maxPlayers),
        sceneColor.panelMuted,
        hostTheme.muted
      )
    );
  }

  if (!onSelect) {
    return;
  }

  const clickZone = scene.add.zone(x, y, width, height).setOrigin(0);
  clickZone.setInteractive({ useHandCursor: true });
  clickZone.on("pointerdown", () => onSelect(game.id));
  clickZone.on("pointerover", () => {
    container.y = y - 4;
    shadow.setAlpha(0.16);
    background.setFillStyle(visual.surfaceHover, 1);
    background.setStrokeStyle(2, visual.accent, 1);
    glow.setAlpha(selected ? 0.2 : 0.12);
  });
  clickZone.on("pointerout", () => {
    container.y = y;
    shadow.setAlpha(sceneAlpha.shadow);
    background.setFillStyle(visual.surface, 1);
    background.setStrokeStyle(selected ? 2 : 1, selected ? visual.accent : sceneColor.line, 1);
    glow.setAlpha(selected ? 0.14 : 0.06);
  });

  if (selected) {
    scene.tweens.add({
      targets: glow,
      alpha: { from: 0.1, to: 0.2 },
      duration: 1_100,
      yoyo: true,
      repeat: -1
    });
  }
}

/** Renders the catalog grid and returns the y coordinate just below it. */
export function renderGameCardGrid(scene: Phaser.Scene, options: GameCardGridOptions): number {
  const { games, selectedGameId, x, y, width, variant, language, onSelect } = options;
  const { gap, height: cardHeight } = cardMetrics[variant];
  const columns = getColumns(width, variant, games.length);
  const cardWidth = Math.floor((width - gap * (columns - 1)) / columns);

  games.forEach((game, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    renderGameCard(
      scene,
      game,
      selectedGameId === game.id,
      x + column * (cardWidth + gap),
      y + row * (cardHeight + gap),
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
