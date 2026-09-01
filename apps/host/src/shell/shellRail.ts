import type { PlayerSnapshot, SupportedLanguage } from "@open-party-lab/protocol";
import { getHostText } from "../i18n/hostText.js";
import { renderUiIcon } from "./gameGlyphs.js";
import { escapeHtml } from "./escapeHtml.js";

export interface RailOptions {
  roomCode: string;
  joinUrl: string;
  qrDataUrl: string | null;
  players: readonly PlayerSnapshot[];
  language: SupportedLanguage;
  canKick: boolean;
  /** Player currently driving the room from a phone, if any. */
  hostControlHolderId: string | null;
  /** Player waiting for the screen to answer a takeover request. */
  hostControlRequestId: string | null;
}

/** Two letters is enough to tell four people apart and needs no avatar assets. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Readable ink for an avatar.
 *
 * Player colours are chosen by the room, not by the theme, so neither theme's
 * `on-accent` is guaranteed to sit on them. Relative luminance decides instead.
 */
function avatarInk(color: string): string {
  const hex = color.replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((character) => character + character)
          .join("")
      : hex;
  const value = Number.parseInt(full, 16);

  if (!Number.isFinite(value) || full.length !== 6) {
    return "#ffffff";
  }

  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
    const ratio = channel / 255;
    return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];

  return luminance > 0.45 ? "#1d1d1b" : "#ffffff";
}

/**
 * One roster row.
 *
 * Status is carried by marks rather than words: a crown for whoever holds the
 * controls, a phone for a pending takeover, a tick for ready. The kick control
 * only materialises on hover, so the resting list stays calm.
 */
function renderPlayer(player: PlayerSnapshot, options: RailOptions): string {
  const text = getHostText(options.language);
  const badges: string[] = [];

  if (player.id === options.hostControlHolderId) {
    badges.push(`<span class="opl-badge opl-badge-crown" title="${escapeHtml(
      text.hostControlDelegatedTitle
    )}">${renderUiIcon("crown", 16)}</span>`);
  }

  if (player.id === options.hostControlRequestId) {
    badges.push(`<span class="opl-badge opl-badge-phone" title="${escapeHtml(
      text.hostControlRequestTitle
    )}">${renderUiIcon("phone", 16)}</span>`);
  }

  if (player.isReady) {
    badges.push(`<span class="opl-badge opl-badge-ready" title="${escapeHtml(
      text.ready
    )}">${renderUiIcon("check", 16, 2.1)}</span>`);
  }

  const kick = options.canKick
    ? `<button type="button" class="opl-kick" data-action="kick" data-player-id="${escapeHtml(
        player.id
      )}" aria-label="${escapeHtml(text.kickPlayer(player.name))}">${renderUiIcon("kick", 17)}</button>`
    : "";

  const subline = player.selectedCharacterName
    ? `<span class="opl-field-hint" style="display:block;font-size:11px">${escapeHtml(
        player.selectedCharacterName
      )}</span>`
    : "";

  return `
    <div class="opl-player${player.connected ? "" : " is-offline"}">
      <span class="opl-avatar" style="background:${escapeHtml(player.color)};color:${avatarInk(
        player.color
      )}">${escapeHtml(initials(player.name))}</span>
      <span class="opl-player-name">${escapeHtml(player.name)}${subline}</span>
      ${badges.join("")}
      ${kick}
    </div>
  `;
}

export function renderRoomCard(options: RailOptions): string {
  const text = getHostText(options.language);
  const qr = options.qrDataUrl
    ? `<img class="opl-qr" src="${options.qrDataUrl}" alt="${escapeHtml(text.scanQr)}" />`
    : "";

  return `
    <div class="opl-room-card">
      <p class="opl-room-label">${escapeHtml(text.roomPrefix)}</p>
      <p class="opl-room-code">${escapeHtml(options.roomCode)}</p>
      ${qr}
    </div>
  `;
}

export function renderRoster(options: RailOptions): string {
  const text = getHostText(options.language);

  if (options.players.length === 0) {
    return `<div class="opl-roster-empty">${escapeHtml(text.shellRosterEmpty)}</div>`;
  }

  return options.players.map((player) => renderPlayer(player, options)).join("");
}
