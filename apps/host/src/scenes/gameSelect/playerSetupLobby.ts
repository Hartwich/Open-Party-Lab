import Phaser from "phaser";
import type { AvailableGameDto, PlayerSnapshot, SupportedLanguage } from "@open-party-lab/protocol";
import { getHostText } from "../../i18n/hostText.js";
import { getVisualAccent } from "../../games/gameVisuals.js";
import { hostTheme } from "../../ui/theme/theme.js";
import { sceneAlpha, sceneColor } from "../../ui/theme/sceneColors.js";
import { addSceneText, blockPointerInput, parseColor } from "../../ui/scene/index.js";
import { measureBackToMenuButtonWidth, renderBackToMenuButton } from "./backToMenuButton.js";

/**
 * Roster view for games whose players pick something before the round starts.
 *
 * This used to be a hard-coded Arena Survivor screen, complete with a table of
 * that game's four background images. It is now driven entirely by the game's
 * `playerSetup` definition: portraits, per-setting artwork and the character
 * names all come from the manifest, so any game with a chooser gets the same
 * screen without touching the platform.
 */

type PlayerSetupOption = NonNullable<AvailableGameDto["playerSetup"]>["options"][number];

/** True when this game wants the roster view rather than the plain hero panel. */
export function hasPlayerSetupRoster(game: AvailableGameDto | undefined): boolean {
  return (game?.playerSetup?.options.length ?? 0) > 0;
}

function findOption(
  game: AvailableGameDto,
  optionId: string | null | undefined
): PlayerSetupOption | undefined {
  return optionId ? game.playerSetup?.options.find((entry) => entry.id === optionId) : undefined;
}

/** Portrait for an option, honouring a per-setting override if the game has one. */
function resolvePortraitPath(
  option: PlayerSetupOption,
  settings: Record<string, string | number | boolean>
): string | undefined {
  const mapping = option.portraitPathBySetting;

  if (!mapping) {
    return option.portraitPath;
  }

  const value = settings[mapping.settingKey];
  const themed = value === undefined ? undefined : mapping.values[String(value)];
  return themed ?? option.portraitPath;
}

function portraitTextureKey(gameId: string, optionId: string, path: string): string {
  return `setup-portrait:${gameId}:${optionId}:${path}`;
}

/**
 * Queues portrait textures for the current settings.
 *
 * `requested` is owned by the scene so a re-render does not re-queue what is
 * already in flight; `onLoaded` triggers one more render once they arrive.
 */
export function queuePlayerSetupTextures(
  scene: Phaser.Scene,
  game: AvailableGameDto,
  settings: Record<string, string | number | boolean>,
  requested: Set<string>,
  onLoaded: () => void
): void {
  let queued = false;

  for (const option of game.playerSetup?.options ?? []) {
    const path = resolvePortraitPath(option, settings);

    if (!path) {
      continue;
    }

    const key = portraitTextureKey(game.id, option.id, path);

    if (scene.textures.exists(key) || requested.has(key)) {
      continue;
    }

    requested.add(key);
    queued = true;

    if (path.endsWith(".svg")) {
      scene.load.svg(key, path);
    } else {
      scene.load.image(key, path);
    }
  }

  if (!queued) {
    return;
  }

  scene.load.once(Phaser.Loader.Events.COMPLETE, onLoaded);

  if (!scene.load.isLoading()) {
    scene.load.start();
  }
}

export interface PlayerSetupRosterOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  game: AvailableGameDto;
  players: PlayerSnapshot[];
  settings: Record<string, string | number | boolean>;
  language: SupportedLanguage;
  onBack: () => void;
}

function rosterColumns(width: number, playerCount: number): number {
  return width < 620 || playerCount === 1 ? 1 : 2;
}

/** Height the roster needs for a given player count. */
export function measurePlayerSetupRosterHeight(width: number, playerCount: number): number {
  const rows = Math.max(1, Math.ceil(playerCount / rosterColumns(width, playerCount)));
  return 68 + rows * 128 + Math.max(0, rows - 1) * 12;
}

/** Returns the y coordinate just below the panel. */
export function renderPlayerSetupRoster(
  scene: Phaser.Scene,
  options: PlayerSetupRosterOptions
): number {
  const { x, y, width, height, game, players, settings, language, onBack } = options;
  const text = getHostText(language);
  const title = game.playerSetup?.title ?? text.playerStatusTitle;

  scene.add
    .rectangle(x, y, width, height, sceneColor.panel, sceneAlpha.panel)
    .setOrigin(0)
    .setStrokeStyle(2, getVisualAccent(game), 0.45);
  blockPointerInput(scene, x, y, width, height);

  addSceneText(scene, x + 20, y + 16, title, {
    fontFamily: hostTheme.titleFont,
    fontSize: "26px",
    color: hostTheme.text
  });

  renderBackToMenuButton(scene, {
    x: x + width - measureBackToMenuButtonWidth(width) - 16,
    y: y + 14,
    width,
    language,
    onBack
  });

  if (players.length === 0) {
    addSceneText(scene, x + 20, y + 70, text.noPlayersJoined, {
      fontFamily: hostTheme.bodyFont,
      fontSize: "18px",
      color: hostTheme.muted,
      wordWrap: { width: width - 40 }
    });
    return y + height;
  }

  const columns = rosterColumns(width, players.length);
  const cardGap = 12;
  const cardWidth = Math.floor((width - 40 - cardGap * (columns - 1)) / columns);
  const rows = Math.ceil(players.length / columns);
  const availableHeight = height - 68 - Math.max(0, rows - 1) * cardGap;
  const cardHeight = Math.max(112, Math.floor(availableHeight / rows));

  players.forEach((player, index) => {
    const cardX = x + 20 + (index % columns) * (cardWidth + cardGap);
    const cardY = y + 56 + Math.floor(index / columns) * (cardHeight + cardGap);
    const option = findOption(game, player.selectedCharacterId);
    const playerColor = parseColor(player.color, sceneColor.accent);
    const accent = option ? playerColor : sceneColor.warning;

    scene.add
      .rectangle(
        cardX,
        cardY,
        cardWidth,
        cardHeight,
        option ? sceneColor.panel : sceneColor.panelMuted,
        1
      )
      .setOrigin(0)
      .setStrokeStyle(option ? 2 : 1, accent, option ? 0.8 : 0.5);

    const portraitSize = Math.min(cardHeight - 20, 112);
    const portraitX = cardX + 10;
    const portraitY = cardY + (cardHeight - portraitSize) / 2;

    scene.add
      .rectangle(portraitX, portraitY, portraitSize, portraitSize, sceneColor.backgroundDeep, 1)
      .setOrigin(0)
      .setStrokeStyle(1, accent, 0.4);

    const portraitPath = option ? resolvePortraitPath(option, settings) : undefined;
    const textureKey = option && portraitPath
      ? portraitTextureKey(game.id, option.id, portraitPath)
      : null;

    if (textureKey && scene.textures.exists(textureKey)) {
      scene.add
        .image(portraitX + portraitSize / 2, portraitY + portraitSize / 2, textureKey)
        .setDisplaySize(portraitSize - 8, portraitSize - 8);
    } else if (!option) {
      addSceneText(scene, portraitX + portraitSize / 2, portraitY + portraitSize / 2, "?", {
        fontFamily: hostTheme.titleFont,
        fontSize: `${Math.round(portraitSize * 0.5)}px`,
        color: hostTheme.warning
      }).setOrigin(0.5);
    }

    const copyX = portraitX + portraitSize + 14;
    const copyWidth = Math.max(70, cardX + cardWidth - copyX - 12);

    addSceneText(scene, copyX, cardY + 18, player.name, {
      fontFamily: hostTheme.titleFont,
      fontSize: "21px",
      color: hostTheme.text,
      wordWrap: { width: copyWidth }
    });
    addSceneText(scene, copyX, cardY + 50, option?.name ?? text.characterSelecting, {
      fontFamily: hostTheme.bodyFont,
      fontSize: "14px",
      color: option ? hostTheme.textSoft : hostTheme.warning,
      wordWrap: { width: copyWidth }
    });
    addSceneText(
      scene,
      copyX,
      cardY + cardHeight - 28,
      player.isReady ? text.ready : text.waiting,
      {
        fontFamily: hostTheme.monoFont,
        fontSize: "12px",
        color: player.isReady ? hostTheme.success : hostTheme.muted
      }
    );
  });

  return y + height;
}
