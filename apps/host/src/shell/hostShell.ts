import QRCode from "qrcode";
import {
  canManagePlayerRoster,
  hasActiveRound,
  type PlayerSnapshot,
  type SupportedLanguage
} from "@open-party-lab/protocol";
import {
  applyThemeVariables,
  normalizeThemeName,
  themes,
  type ThemeName
} from "@open-party-lab/ui-kit";
import type { HostAppState, HostSocketClient } from "../app/hostSocketClient.js";
import { resolveHostSurface } from "../app/hostSurface.js";
import { requiresReadyAutoStart } from "../app/roundStartPolicy.js";
import { getHostText } from "../i18n/hostText.js";
import { installShellStyles } from "./shellStyles.js";
import {
  isCatalogExpanded,
  renderCatalog,
  renderOpenGame,
  setCatalogExpanded
} from "./shellCatalog.js";
import { renderRoomCard, renderRoster, type RailOptions } from "./shellRail.js";
import { renderUiIcon } from "./gameGlyphs.js";
import { escapeHtml } from "./escapeHtml.js";

/** Signal other chrome reads to avoid duplicating what the shell already shows. */
export const SHELL_ACTIVE_ATTRIBUTE = "data-opl-shell";

/** Event the dock fires so the settings panel can open without a direct import. */
export const OPEN_HOST_CONTROLS_EVENT = "opl:open-host-controls";

/** Same idea for full screen, which the floating overlay owns. */
export const TOGGLE_FULLSCREEN_EVENT = "opl:toggle-fullscreen";

interface SectionSignatures {
  head: string;
  catalog: string;
  room: string;
  roster: string;
  action: string;
}

const emptySignatures: SectionSignatures = {
  head: "",
  catalog: "",
  room: "",
  roster: "",
  action: ""
};

function describePlayer(player: PlayerSnapshot): string {
  return [
    player.id,
    player.name,
    player.color,
    player.isReady ? "1" : "0",
    player.connected ? "1" : "0",
    player.selectedCharacterName ?? ""
  ].join(":");
}

function toRailOptions(state: HostAppState, qrDataUrl: string | null): RailOptions {
  const room = state.room;

  return {
    roomCode: room?.code ?? "----",
    joinUrl: room?.joinUrl ?? "",
    qrDataUrl,
    players: room?.players ?? [],
    language: room?.language ?? state.preferredLanguage,
    canKick: canManagePlayerRoster(room),
    hostControlHolderId: room?.hostControl.holderPlayerId ?? null,
    hostControlRequestId: room?.hostControl.pendingRequest?.playerId ?? null
  };
}

/**
 * Whether the round can be started from here right now.
 *
 * Games that start themselves once everyone is ready get a disabled button with
 * the ready count as its label, so the screen still says what it is waiting for
 * without a paragraph of explanation.
 */
function resolveAction(
  state: HostAppState,
  language: SupportedLanguage
): { label: string; icon: string; enabled: boolean; note: string | null } {
  const text = getHostText(language);
  const room = state.room;
  const players = room?.players ?? [];
  const selected = room?.availableGames.find((game) => game.id === room.selectedGameId);

  if (hasActiveRound(room)) {
    return { label: text.shellRoundRunning, icon: "play", enabled: false, note: null };
  }

  if (!selected) {
    return {
      label: text.shellStartRound,
      icon: "play",
      enabled: false,
      note: text.noActiveGameSelectLine
    };
  }

  const missing = selected.minPlayers - players.length;

  if (missing > 0) {
    return {
      label: text.shellStartRound,
      icon: "play",
      enabled: false,
      note: text.shellNeedsPlayers(missing)
    };
  }

  if (requiresReadyAutoStart(selected)) {
    const ready = players.filter((player) => player.isReady).length;

    return {
      label: text.shellReadyCount(ready, players.length),
      icon: "check",
      enabled: false,
      note: text.autoReadyLine
    };
  }

  return { label: text.shellStartRound, icon: "play", enabled: true, note: null };
}

export function mountHostShell(client: HostSocketClient): () => void {
  installShellStyles();

  const root = document.createElement("div");
  root.className = "opl-shell";
  root.hidden = true;
  root.innerHTML = `
    <nav class="opl-dock" aria-label="Host">
      <span class="opl-brand">OPL</span>
      <span class="opl-dock-rule"></span>
      <button type="button" class="opl-dock-button" data-action="show-catalog" aria-pressed="true"
              data-dock="catalog">${renderUiIcon("catalog", 21)}</button>
      <span class="opl-dock-spacer"></span>
      <button type="button" class="opl-dock-button" data-action="toggle-fullscreen"
              data-dock="fullscreen">${renderUiIcon("fullscreen", 21)}</button>
      <button type="button" class="opl-dock-button" data-action="toggle-theme"
              data-dock="theme">${renderUiIcon("theme", 21)}</button>
      <button type="button" class="opl-dock-button" data-action="open-settings"
              data-dock="settings">${renderUiIcon("settings", 21)}</button>
    </nav>
    <main class="opl-main">
      <p class="opl-kicker" data-section="kicker"></p>
      <h1 class="opl-title" data-section="title"></h1>
      <div class="opl-board">
        <div data-section="open"></div>
        <div class="opl-catalog" data-section="catalog"></div>
      </div>
    </main>
    <aside class="opl-rail">
      <div data-section="room"></div>
      <p class="opl-rail-label" data-section="roster-label"></p>
      <div class="opl-roster" data-section="roster"></div>
      <button type="button" class="opl-start" data-action="start-round" data-section="start"></button>
      <p class="opl-note" data-section="note"></p>
    </aside>
  `;
  document.body.appendChild(root);

  const query = <T extends HTMLElement>(section: string): T =>
    root.querySelector<T>(`[data-section="${section}"]`) as T;

  const nodes = {
    kicker: query("kicker"),
    title: query("title"),
    open: query("open"),
    catalog: query("catalog"),
    room: query("room"),
    rosterLabel: query("roster-label"),
    roster: query("roster"),
    start: query<HTMLButtonElement>("start"),
    note: query("note")
  };
  const dockButtons = {
    catalog: root.querySelector<HTMLButtonElement>('[data-dock="catalog"]') as HTMLButtonElement,
    fullscreen: root.querySelector<HTMLButtonElement>('[data-dock="fullscreen"]') as HTMLButtonElement,
    theme: root.querySelector<HTMLButtonElement>('[data-dock="theme"]') as HTMLButtonElement,
    settings: root.querySelector<HTMLButtonElement>('[data-dock="settings"]') as HTMLButtonElement
  };

  function syncDockLabels(text: ReturnType<typeof getHostText>, theme: ThemeName): void {
    const labels = {
      catalog: text.shellBackToCatalog,
      fullscreen: document.fullscreenElement ? text.exitFullscreen : text.fullscreen,
      theme: `${text.themeLabel}: ${theme === "dark" ? text.themeLight : text.themeDark}`,
      settings: text.shellSetupKicker
    };

    for (const [key, label] of Object.entries(labels) as Array<[keyof typeof dockButtons, string]>) {
      dockButtons[key].setAttribute("aria-label", label);
      dockButtons[key].title = label;
    }
  }

  let signatures = { ...emptySignatures };
  let appliedTheme: string | null = null;
  let qrDataUrl: string | null = null;
  let qrSourceUrl: string | null = null;
  let visible = false;
  let destroyed = false;

  /**
   * The QR bitmap is regenerated only when the join URL changes.
   *
   * A state update arrives several times a second; re-encoding a QR code that
   * often would be pure waste.
   *
   * The code deliberately does not follow the theme. An inverted QR — light
   * modules on a dark field — is rejected by a good share of phone scanners,
   * and a code nobody can scan defeats the point of putting it on the wall. It
   * keeps the warm paper palette in both themes and sits on its own light plate.
   */
  function ensureQrCode(joinUrl: string): void {
    if (!joinUrl || joinUrl === qrSourceUrl) {
      return;
    }

    qrSourceUrl = joinUrl;
    void QRCode.toDataURL(joinUrl, {
      margin: 1,
      width: 264,
      errorCorrectionLevel: "M",
      color: {
        dark: themes.light.color.text,
        light: themes.light.color.surfaceRaised
      }
    })
      .then((dataUrl) => {
        if (destroyed) {
          return;
        }

        qrDataUrl = dataUrl;
        signatures.room = "";
        render(client.getState());
      })
      .catch(() => {
        qrSourceUrl = null;
      });
  }

  function render(state: HostAppState): void {
    const room = state.room;

    if (!room) {
      return;
    }

    const language = room.language ?? state.preferredLanguage;
    const text = getHostText(language);
    const theme = normalizeThemeName(room.theme);

    syncDockLabels(text, theme);

    if (theme !== appliedTheme) {
      applyThemeVariables(root, theme);
      appliedTheme = theme;
    }

    const selected = room.availableGames.find((game) => game.id === room.selectedGameId);
    const rail = toRailOptions(state, qrDataUrl);
    const action = resolveAction(state, language);
    const locked = hasActiveRound(room);

    ensureQrCode(room.joinUrl);

    const headSignature = `${language}:${selected?.displayName ?? ""}`;

    if (headSignature !== signatures.head) {
      signatures.head = headSignature;
      nodes.kicker.textContent = selected ? text.shellSetupKicker : text.shellKicker;
      nodes.title.textContent = selected ? selected.displayName : text.shellTitle;
    }

    const catalogSignature = [
      language,
      room.selectedGameId ?? "",
      locked ? "1" : "0",
      isCatalogExpanded() ? "1" : "0",
      room.availableGames.map((game) => game.id).join(","),
      JSON.stringify(room.selectedGameSettings ?? {})
    ].join("|");

    if (catalogSignature !== signatures.catalog) {
      signatures.catalog = catalogSignature;
      nodes.open.innerHTML = renderOpenGame(
        selected,
        room.selectedGameSettings ?? {},
        language,
        locked
      );
      nodes.catalog.innerHTML = renderCatalog({
        games: room.availableGames,
        selectedGameId: room.selectedGameId,
        settings: room.selectedGameSettings ?? {},
        language,
        locked
      });
    }

    const roomSignature = `${room.code}|${qrDataUrl ? "1" : "0"}|${language}`;

    if (roomSignature !== signatures.room) {
      signatures.room = roomSignature;
      nodes.room.innerHTML = renderRoomCard(rail);
    }

    const rosterSignature = [
      language,
      rail.canKick ? "1" : "0",
      rail.hostControlHolderId ?? "",
      rail.hostControlRequestId ?? "",
      room.players.map(describePlayer).join(";")
    ].join("|");

    if (rosterSignature !== signatures.roster) {
      signatures.roster = rosterSignature;
      nodes.rosterLabel.innerHTML = `<span>${escapeHtml(text.players)}</span><span>${
        room.players.length
      }</span>`;
      nodes.roster.innerHTML = renderRoster(rail);
    }

    const actionSignature = `${action.label}|${action.enabled ? "1" : "0"}|${
      action.note ?? ""
    }|${state.error ?? ""}`;

    if (actionSignature !== signatures.action) {
      signatures.action = actionSignature;
      nodes.start.innerHTML = `${renderUiIcon(action.icon as "play", 18)}<span>${escapeHtml(
        action.label
      )}</span>`;
      nodes.start.disabled = !action.enabled;

      const note = state.error ?? action.note;
      nodes.note.textContent = note ?? "";
      nodes.note.classList.toggle("is-error", Boolean(state.error));
      nodes.note.style.display = note ? "block" : "none";
    }
  }

  function setVisible(next: boolean): void {
    if (next === visible) {
      return;
    }

    visible = next;
    root.hidden = !next;
    document.documentElement.setAttribute(SHELL_ACTIVE_ATTRIBUTE, next ? "on" : "off");

    if (!next) {
      // Force a full repaint on the way back in: the room may have changed
      // language, theme or catalog while a game held the screen.
      signatures = { ...emptySignatures };
      appliedTheme = null;
      setCatalogExpanded(false);
    }
  }

  root.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const trigger = target?.closest<HTMLElement>("[data-action]");

    if (!trigger) {
      return;
    }

    const state = client.getState();
    const gameId = state.room?.selectedGameId ?? null;

    switch (trigger.dataset.action) {
      case "select-game": {
        const id = trigger.dataset.gameId;
        if (id) {
          client.selectGame(id);
        }
        break;
      }
      case "expand-catalog":
        setCatalogExpanded(true);
        signatures.catalog = "";
        render(state);
        break;
      case "back":
        client.returnToGameSelection();
        break;
      case "start-round":
        client.startRound();
        break;
      case "kick": {
        const playerId = trigger.dataset.playerId;
        if (playerId) {
          client.kickPlayer(playerId);
        }
        break;
      }
      case "setup-select":
      case "setup-number": {
        const actionKey = trigger.dataset.actionKey;
        const raw = trigger.dataset.value;
        if (gameId && actionKey && raw !== undefined) {
          const value = trigger.dataset.action === "setup-number" ? Number(raw) : raw;
          client.sendGameHostAction(gameId, { type: "configure-lobby", [actionKey]: value });
        }
        break;
      }
      case "setup-confirm": {
        const actionType = trigger.dataset.actionType;
        if (gameId && actionType) {
          client.sendGameHostAction(gameId, { type: actionType });
        }
        break;
      }
      case "show-catalog":
        client.returnToGameSelection();
        break;
      case "toggle-theme":
        client.setTheme(normalizeThemeName(state.room?.theme) === "dark" ? "light" : "dark");
        break;
      case "open-settings":
        window.dispatchEvent(new CustomEvent(OPEN_HOST_CONTROLS_EVENT));
        break;
      case "toggle-fullscreen":
        window.dispatchEvent(new CustomEvent(TOGGLE_FULLSCREEN_EVENT));
        break;
      default:
        break;
    }
  });

  /**
   * Keyboard shortcuts, previously bound to the Phaser scenes.
   *
   * They are ignored while the shell is hidden so a game keeps its own keys,
   * and while a text field has focus so typing never starts a round.
   */
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (!visible || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const active = document.activeElement;

    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      client.startRound();
      return;
    }

    const digit = /^Digit([1-9])$/.exec(event.code);

    if (digit) {
      const game = client.getState().room?.availableGames[Number(digit[1]) - 1];

      if (game) {
        client.selectGame(game.id);
      }
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  const handleFullscreenChange = (): void => {
    if (visible) {
      render(client.getState());
    }
  };
  document.addEventListener("fullscreenchange", handleFullscreenChange);

  const unsubscribe = client.subscribe((state) => {
    if (destroyed) {
      return;
    }

    setVisible(shouldShowShell(state));

    if (visible) {
      render(state);
    }
  });

  return () => {
    destroyed = true;
    unsubscribe();
    window.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("fullscreenchange", handleFullscreenChange);
    document.documentElement.removeAttribute(SHELL_ACTIVE_ATTRIBUTE);
    root.remove();
  };
}

/**
 * The shell owns the screen whenever no game does.
 *
 * This deliberately defers to the same resolver the router uses instead of
 * asking "is a round running": a finished round still belongs to the game,
 * which is showing its own result screen.
 */
export function shouldShowShell(state: HostAppState): boolean {
  return resolveHostSurface(state).kind === "shell";
}
