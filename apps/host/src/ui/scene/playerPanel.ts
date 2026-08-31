import Phaser from "phaser";
import type { PlayerSnapshot, SupportedLanguage } from "@open-party-lab/protocol";
import { getHostText } from "../../i18n/hostText.js";
import { hostTheme } from "../theme/theme.js";
import { sceneAlpha, sceneColor } from "../theme/sceneColors.js";
import { drawPill } from "./pill.js";
import { blockPointerInput } from "./pointerBlocker.js";
import { addSceneText } from "./sceneText.js";
import { parseColor, trimMiddle } from "./textFitting.js";

export interface PlayerPanelOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  players: PlayerSnapshot[];
  /**
   * Set when the selected game lets players choose something before the round.
   * Rows then show the chosen option under the name.
   */
  showsPlayerChoice?: boolean;
  title: string;
  language?: SupportedLanguage;
  /** Omit to hide the kick buttons (e.g. while a round is running). */
  onKickPlayer?: (playerId: string) => void;
}

export interface PlayerStripOptions {
  x: number;
  y: number;
  width: number;
  players: PlayerSnapshot[];
  showsPlayerChoice?: boolean;
  title: string;
  language?: SupportedLanguage;
}

const KICK_BUTTON_SIZE = 28;
const ROW_INSET = 18;

function resolveStatus(
  player: PlayerSnapshot,
  text: ReturnType<typeof getHostText>
): { label: string; color: number } {
  if (player.isReady) {
    return { label: text.ready, color: sceneColor.success };
  }

  if (player.connected) {
    return { label: text.waiting, color: sceneColor.warning };
  }

  return {
    label: player.presence === "reconnecting" ? text.reconnecting : "offline",
    color: sceneColor.muted
  };
}

function renderKickButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  player: PlayerSnapshot,
  text: ReturnType<typeof getHostText>,
  onKick: (playerId: string) => void
): void {
  const background = scene.add
    .rectangle(x, y, KICK_BUTTON_SIZE, KICK_BUTTON_SIZE, sceneColor.dangerSoft, 1)
    .setOrigin(0)
    .setStrokeStyle(1, sceneColor.danger, 0.45);

  addSceneText(scene, x + KICK_BUTTON_SIZE / 2, y + KICK_BUTTON_SIZE / 2, "×", {
    fontFamily: hostTheme.bodyFont,
    fontSize: "19px",
    color: hostTheme.danger
  }).setOrigin(0.5);

  const zone = scene.add
    .zone(x, y, KICK_BUTTON_SIZE, KICK_BUTTON_SIZE)
    .setOrigin(0)
    .setInteractive({ useHandCursor: true });

  zone.setName(`kick-${player.id}`);
  zone.on("pointerover", () => background.setFillStyle(sceneColor.danger, 1));
  zone.on("pointerout", () => background.setFillStyle(sceneColor.dangerSoft, 1));
  zone.on(
    "pointerdown",
    (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event?: Phaser.Types.Input.EventData
    ) => {
      event?.stopPropagation();
      onKick(player.id);
    }
  );

  // Kept for parity with the aria-labels on the DOM chrome.
  zone.setData("label", text.kickPlayer(player.name));
}

/**
 * Vertical player list used as the sidebar of the lobby and the game select
 * screen. When `onKickPlayer` is supplied each row gets a remove button.
 */
export function renderPlayerPanel(scene: Phaser.Scene, options: PlayerPanelOptions): void {
  const { x, y, width, height, players, showsPlayerChoice, title, language, onKickPlayer } = options;
  const text = getHostText(language);

  scene.add
    .rectangle(x, y, width, height, sceneColor.panel, sceneAlpha.panel)
    .setOrigin(0)
    .setStrokeStyle(1, sceneColor.line, 1);
  blockPointerInput(scene, x, y, width, height);

  addSceneText(scene, x + ROW_INSET, y + 16, title, {
    fontFamily: hostTheme.titleFont,
    fontSize: "26px",
    color: hostTheme.text
  });
  addSceneText(scene, x + ROW_INSET, y + 46, `${players.length} ${text.connectedShort}`, {
    fontFamily: hostTheme.bodyFont,
    fontSize: "14px",
    color: hostTheme.muted
  });

  if (players.length === 0) {
    addSceneText(scene, x + ROW_INSET, y + 88, text.noPlayersJoined, {
      fontFamily: hostTheme.bodyFont,
      fontSize: "18px",
      color: hostTheme.muted,
      wordWrap: { width: width - ROW_INSET * 2 }
    });
    return;
  }

  const showsChoice = showsPlayerChoice === true;
  const preferredRowHeight = showsChoice ? 48 : 42;
  const availableRowsHeight = Math.max(42, height - 88);
  const rowHeight = Math.max(
    30,
    Math.min(preferredRowHeight, Math.floor(availableRowsHeight / players.length))
  );
  const visiblePlayers =
    rowHeight <= 31
      ? players.slice(0, Math.max(1, Math.floor(availableRowsHeight / 30) - 1))
      : players;
  const hiddenPlayers = players.length - visiblePlayers.length;
  const rowWidth = width - ROW_INSET * 2;
  const rowRight = x + ROW_INSET + rowWidth;

  visiblePlayers.forEach((player, index) => {
    const rowY = y + 80 + index * rowHeight;
    const rowInnerHeight = rowHeight - 8;
    const playerColor = parseColor(player.color, sceneColor.accent);
    const status = resolveStatus(player, text);

    scene.add
      .rectangle(x + ROW_INSET, rowY, rowWidth, rowInnerHeight, sceneColor.panelMuted, 1)
      .setOrigin(0)
      .setStrokeStyle(1, sceneColor.line, 0.8);
    scene.add.circle(x + ROW_INSET + 16, rowY + rowInnerHeight / 2, 6, playerColor, 1);

    const kickVisible = Boolean(onKickPlayer);
    const kickX = rowRight - 10 - KICK_BUTTON_SIZE;
    const statusRight = kickVisible ? kickX - 10 : rowRight - 10;
    const nameMaxWidth = Math.max(40, statusRight - (x + ROW_INSET + 30) - 84);

    addSceneText(scene, x + ROW_INSET + 30, rowY + 7, trimMiddle(player.name, 22), {
      fontFamily: hostTheme.bodyFont,
      fontSize: showsChoice ? "17px" : "18px",
      color: hostTheme.text,
      wordWrap: { width: nameMaxWidth }
    });

    if (showsChoice) {
      addSceneText(
        scene,
        x + ROW_INSET + 30,
        rowY + 24,
        player.selectedCharacterName ?? text.characterSelecting,
        {
          fontFamily: hostTheme.bodyFont,
          fontSize: "12px",
          color: hostTheme.muted
        }
      );
    }

    drawPill(scene, statusRight - 78, rowY + 6, status.label, status.color, hostTheme.onAccent);

    if (onKickPlayer) {
      renderKickButton(
        scene,
        kickX,
        rowY + (rowInnerHeight - KICK_BUTTON_SIZE) / 2,
        player,
        text,
        onKickPlayer
      );
    }
  });

  if (hiddenPlayers > 0) {
    addSceneText(scene, x + ROW_INSET, y + height - 28, text.morePlayers(hiddenPlayers), {
      fontFamily: hostTheme.bodyFont,
      fontSize: "14px",
      color: hostTheme.muted
    });
  }
}

/** Compact horizontal player chips, used when there is no room for a sidebar. */
export function renderPlayerStrip(scene: Phaser.Scene, options: PlayerStripOptions): number {
  const { x, y, width, players, showsPlayerChoice, title, language } = options;
  const text = getHostText(language);
  const showsChoice = showsPlayerChoice === true;
  const chipGap = 10;
  const chipHeight = showsChoice ? 38 : 32;
  const maxX = x + width - ROW_INSET;
  let cursorX = x + ROW_INSET;
  let cursorY = y + 44;

  const chipLayouts = players.map((player) => {
    const statusLabel = player.isReady ? text.ready : player.connected ? text.waiting : "offline";
    const detail = showsChoice ? ` | ${player.selectedCharacterName ?? text.characterSelecting}` : "";
    const label = `${player.name} ${statusLabel}${detail}`;
    const chipWidth = Math.min(
      Math.max(138, width - 36),
      Math.max(138, 72 + label.length * (showsChoice ? 5.2 : 6))
    );

    if (cursorX + chipWidth > maxX) {
      cursorX = x + ROW_INSET;
      cursorY += chipHeight + chipGap;
    }

    const layout = { player, label, x: cursorX, y: cursorY, width: chipWidth };
    cursorX += chipWidth + chipGap;
    return layout;
  });

  const panelHeight =
    players.length === 0 ? 76 : Math.max(76, cursorY + chipHeight + 8 - y);

  scene.add
    .rectangle(x, y, width, panelHeight, sceneColor.panel, sceneAlpha.panel)
    .setOrigin(0)
    .setStrokeStyle(1, sceneColor.line, 1);
  blockPointerInput(scene, x, y, width, panelHeight);

  addSceneText(scene, x + ROW_INSET, y + 14, title, {
    fontFamily: hostTheme.titleFont,
    fontSize: "24px",
    color: hostTheme.text
  });

  if (players.length === 0) {
    addSceneText(scene, x + ROW_INSET, y + 42, text.noPlayersJoined, {
      fontFamily: hostTheme.bodyFont,
      fontSize: "16px",
      color: hostTheme.muted
    });
    return y + panelHeight;
  }

  chipLayouts.forEach(({ player, label, x: chipX, y: chipY, width: chipWidth }) => {
    const fillColor = player.isReady
      ? sceneColor.successSoft
      : player.connected
        ? sceneColor.warningSoft
        : sceneColor.panelMuted;
    const playerColor = parseColor(player.color, sceneColor.accent);

    scene.add
      .rectangle(chipX, chipY, chipWidth, chipHeight, fillColor, 1)
      .setOrigin(0)
      .setStrokeStyle(1, playerColor, 0.55);
    scene.add.circle(chipX + 16, chipY + chipHeight / 2, 5, playerColor, 1);
    addSceneText(scene, chipX + 28, chipY + 8, trimMiddle(label, showsChoice ? 40 : 28), {
      fontFamily: hostTheme.bodyFont,
      fontSize: showsChoice ? "14px" : "15px",
      color: hostTheme.text
    });
  });

  return y + panelHeight;
}
