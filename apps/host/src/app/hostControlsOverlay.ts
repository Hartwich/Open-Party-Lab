import Phaser from "phaser";
import {
  canManagePlayerRoster,
  getRoomPhase,
  languageLabels,
  supportedLanguages,
  type SupportedLanguage
} from "@open-party-lab/protocol";
import type { HostAppState, HostSocketClient } from "./hostSocketClient.js";
import { getHostText } from "../i18n/hostText.js";
import { hostTheme } from "../ui/theme/theme.js";
import {
  applyStyles,
  createChromeCard,
  createChromeIconButton,
  createChromeSection,
  createChromeTextButton,
  hostChrome,
  setChromeIconButtonState,
  trapChromePointerEvents
} from "../ui/chrome/hostChrome.js";

const fpsPreferenceKey = "open-party-lab.host-fps";
const openPreferenceKey = "open-party-lab.host-controls-open";
const allowedFpsValues = [30, 60] as const;

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStoredNumber(key: string, fallback: number): number {
  if (!hasLocalStorage()) {
    return fallback;
  }

  const value = Number(window.localStorage.getItem(key));
  return Number.isFinite(value) ? value : fallback;
}

function writeStoredNumber(key: string, value: number): void {
  if (!hasLocalStorage()) {
    return;
  }

  window.localStorage.setItem(key, String(value));
}

function readStoredBoolean(key: string, fallback: boolean): boolean {
  if (!hasLocalStorage()) {
    return fallback;
  }

  const value = window.localStorage.getItem(key);
  if (value === null) {
    return fallback;
  }

  return value === "1";
}

function writeStoredBoolean(key: string, value: boolean): void {
  if (!hasLocalStorage()) {
    return;
  }

  window.localStorage.setItem(key, value ? "1" : "0");
}

function normalizeFps(value: number): 30 | 60 {
  return value >= 60 ? 60 : 30;
}

export function readHostFpsPreference(): 30 | 60 {
  return normalizeFps(readStoredNumber(fpsPreferenceKey, 30));
}

function resolveHostFpsLoopMode(fps: 30 | 60): {
  fpsLimit: number;
  targetFps: number;
  hasFpsLimit: boolean;
  limitRateMs: number;
  targetDeltaMs: number;
  smoothStep: boolean;
} {
  if (fps === 60) {
    return {
      fpsLimit: 0,
      targetFps: 60,
      hasFpsLimit: false,
      limitRateMs: 0,
      targetDeltaMs: 1000 / 60,
      smoothStep: true
    };
  }

  return {
    fpsLimit: 30,
    targetFps: 30,
    hasFpsLimit: true,
    limitRateMs: 1000 / 30,
    targetDeltaMs: 1000 / 30,
    smoothStep: false
  };
}

export function createHostFpsConfig(fps: 30 | 60): {
  target: number;
  limit: number;
  min: number;
  smoothStep: boolean;
  forceSetTimeOut: boolean;
} {
  const mode = resolveHostFpsLoopMode(fps);

  return {
    target: mode.targetFps,
    limit: mode.fpsLimit,
    min: 20,
    smoothStep: mode.smoothStep,
    forceSetTimeOut: false
  };
}

export function applyHostFps(game: Phaser.Game, fps: 30 | 60): void {
  const mode = resolveHostFpsLoopMode(fps);
  const timeStep = game.loop as unknown as {
    fpsLimit: number;
    targetFps: number;
    hasFpsLimit: boolean;
    _limitRate: number;
    _target: number;
    smoothStep: boolean;
    running?: boolean;
    resetDelta?: () => void;
    sleep?: () => void;
    wake?: (seamless?: boolean) => void;
  };

  timeStep.fpsLimit = mode.fpsLimit;
  timeStep.targetFps = mode.targetFps;
  timeStep.hasFpsLimit = mode.hasFpsLimit;
  timeStep._limitRate = mode.limitRateMs;
  timeStep._target = mode.targetDeltaMs;
  timeStep.smoothStep = mode.smoothStep;
  timeStep.resetDelta?.();

  if (timeStep.running) {
    timeStep.sleep?.();
    timeStep.wake?.(true);
  }
}

export function mountHostControlsOverlay(
  game: Phaser.Game,
  client: HostSocketClient
): () => void {
  let destroyed = false;
  let isOpen = readStoredBoolean(openPreferenceKey, false);
  let currentFps = readHostFpsPreference();
  let currentState: HostAppState = client.getState();

  const overlay = document.createElement("aside");
  trapChromePointerEvents(overlay);
  applyStyles(overlay, {
    position: "fixed",
    right: hostChrome.offset.edge,
    bottom: hostChrome.offset.dockBottom,
    zIndex: hostChrome.zIndex.controls,
    pointerEvents: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "12px"
  });

  const gearIcon = `
    <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9.7 4.2 12 2.9l2.3 1.3.7 2.1 2.2.5 1.3 2.3-1.5 1.7.1 2.4 1.4 1.8-1.3 2.3-2.2.5-.7 2.1L12 21.1l-2.3-1.3-.7-2.1-2.2-.5-1.3-2.3 1.4-1.8.1-2.4-1.5-1.7 1.3-2.3 2.2-.5.7-2.1Z" />
      <circle cx="12" cy="12" r="3.35" />
      <path d="M12 8.65v1.2M15.35 12h-1.2M12 15.35v-1.2M8.65 12h1.2" opacity="0.78" />
    </svg>
  `;
  const toggleButton = createChromeIconButton("Host-Steuerung", gearIcon);
  toggleButton.style.pointerEvents = "auto";
  overlay.appendChild(toggleButton);

  const card = createChromeCard("dark");
  applyStyles(card, {
    pointerEvents: "auto",
    display: isOpen ? "grid" : "none",
    width: "min(396px, calc(100vw - 24px))",
    maxHeight: "calc(100vh - 32px)",
    overflowY: "auto"
  });
  overlay.insertBefore(card, toggleButton);

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "start";
  header.style.justifyContent = "space-between";
  header.style.gap = "12px";
  card.appendChild(header);

  const titleBlock = document.createElement("div");
  titleBlock.style.display = "grid";
  titleBlock.style.gap = "4px";
  header.appendChild(titleBlock);

  const title = document.createElement("strong");
  title.textContent = "Host-Steuerung";
  title.style.fontFamily = hostTheme.titleFont;
  title.style.fontSize = "20px";
  title.style.letterSpacing = "0.02em";
  titleBlock.appendChild(title);

  const subtitle = document.createElement("div");
  subtitle.style.fontSize = "12px";
  subtitle.style.color = hostTheme.muted;
  subtitle.textContent = "FPS, Spieler und Schnellzugriff";
  titleBlock.appendChild(subtitle);

  const closeButton = createChromeTextButton("Schliessen");
  header.appendChild(closeButton);

  const meta = document.createElement("div");
  meta.style.display = "grid";
  meta.style.gridTemplateColumns = "1fr auto";
  meta.style.gap = "10px";
  card.appendChild(meta);

  const roomBadge = createChromeSection("dark");
  roomBadge.style.padding = "10px 12px";
  roomBadge.style.fontFamily = hostTheme.monoFont;
  roomBadge.style.fontSize = "26px";
  roomBadge.style.fontWeight = "800";
  roomBadge.style.letterSpacing = "0.14em";
  roomBadge.style.textAlign = "center";
  meta.appendChild(roomBadge);

  const connectionBadge = createChromeSection("dark");
  connectionBadge.style.display = "grid";
  connectionBadge.style.alignContent = "center";
  connectionBadge.style.justifyItems = "end";
  connectionBadge.style.padding = "10px 12px";
  connectionBadge.style.fontSize = "12px";
  connectionBadge.style.color = hostTheme.muted;
  connectionBadge.style.textAlign = "right";
  connectionBadge.style.whiteSpace = "pre-line";
  meta.appendChild(connectionBadge);

  const fpsSection = document.createElement("section");
  fpsSection.style.display = "grid";
  fpsSection.style.gap = "8px";
  card.appendChild(fpsSection);

  const fpsLabel = document.createElement("div");
  fpsLabel.textContent = "FPS";
  fpsLabel.style.fontSize = "12px";
  fpsLabel.style.letterSpacing = "0.12em";
  fpsLabel.style.textTransform = "uppercase";
  fpsLabel.style.color = hostTheme.muted;
  fpsSection.appendChild(fpsLabel);

  const fpsButtons = document.createElement("div");
  fpsButtons.style.display = "grid";
  fpsButtons.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
  fpsButtons.style.gap = "8px";
  fpsSection.appendChild(fpsButtons);

  const fpsButtonMap = new Map<30 | 60, HTMLButtonElement>();

  for (const fps of allowedFpsValues) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${fps}`;
    button.style.padding = "14px 12px";
    button.style.borderRadius = "16px";
    button.style.border = "1px solid rgba(148, 163, 184, 0.16)";
    button.style.background = "rgba(30, 41, 59, 0.72)";
    button.style.color = hostTheme.text;
    button.style.fontFamily = hostTheme.titleFont;
    button.style.fontSize = "18px";
    button.style.fontWeight = "800";
    button.style.letterSpacing = "0.06em";
    button.style.cursor = "pointer";
    button.style.minHeight = "52px";
    fpsButtons.appendChild(button);
    fpsButtonMap.set(fps, button);

    button.addEventListener("click", () => {
      if (currentFps === fps) {
        return;
      }

      currentFps = fps;
      writeStoredNumber(fpsPreferenceKey, fps);
      applyHostFps(game, fps);
      syncView();
    });
  }

  const languageSection = document.createElement("section");
  languageSection.style.display = "grid";
  languageSection.style.gap = "8px";
  card.appendChild(languageSection);

  const languageLabel = document.createElement("div");
  languageLabel.style.fontSize = "12px";
  languageLabel.style.letterSpacing = "0.12em";
  languageLabel.style.textTransform = "uppercase";
  languageLabel.style.color = hostTheme.muted;
  languageSection.appendChild(languageLabel);

  const languageButtons = document.createElement("div");
  languageButtons.style.display = "grid";
  languageButtons.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
  languageButtons.style.gap = "8px";
  languageSection.appendChild(languageButtons);

  const languageButtonMap = new Map<SupportedLanguage, HTMLButtonElement>();

  for (const language of supportedLanguages) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = languageLabels[language];
    button.style.padding = "13px 12px";
    button.style.borderRadius = "14px";
    button.style.border = "1px solid rgba(148, 163, 184, 0.16)";
    button.style.background = "rgba(30, 41, 59, 0.72)";
    button.style.color = hostTheme.text;
    button.style.fontFamily = hostTheme.titleFont;
    button.style.fontSize = "16px";
    button.style.fontWeight = "800";
    button.style.cursor = "pointer";
    button.style.minHeight = "48px";
    languageButtons.appendChild(button);
    languageButtonMap.set(language, button);

    button.addEventListener("click", () => {
      client.setLanguage(language);
    });
  }

  const playersSection = document.createElement("section");
  playersSection.style.display = "grid";
  playersSection.style.gap = "8px";
  card.appendChild(playersSection);

  const playersHeader = document.createElement("div");
  playersHeader.style.display = "flex";
  playersHeader.style.alignItems = "center";
  playersHeader.style.justifyContent = "space-between";
  playersHeader.style.gap = "12px";
  playersSection.appendChild(playersHeader);

  const playersLabel = document.createElement("div");
  playersLabel.textContent = "Spieler";
  playersLabel.style.fontSize = "12px";
  playersLabel.style.letterSpacing = "0.12em";
  playersLabel.style.textTransform = "uppercase";
  playersLabel.style.color = hostTheme.muted;
  playersHeader.appendChild(playersLabel);

  const playersCount = document.createElement("div");
  playersCount.style.fontSize = "12px";
  playersCount.style.color = hostTheme.muted;
  playersHeader.appendChild(playersCount);

  const playersList = document.createElement("div");
  playersList.style.display = "grid";
  playersList.style.gap = "8px";
  playersSection.appendChild(playersList);

  const moderationHint = document.createElement("div");
  moderationHint.style.fontSize = "12px";
  moderationHint.style.color = hostTheme.muted;
  moderationHint.style.lineHeight = "1.4";
  playersSection.appendChild(moderationHint);

  function syncOpenState(label: string): void {
    card.style.display = isOpen ? "grid" : "none";
    setChromeIconButtonState(toggleButton, { active: isOpen, label });
  }

  function resolveLanguage(): SupportedLanguage {
    return currentState.room?.language ?? currentState.preferredLanguage;
  }

  function renderRoomMeta(): void {
    const text = getHostText(resolveLanguage());
    const room = currentState.room;
    const selectedGameId = room?.selectedGameId ?? null;
    const gameName =
      selectedGameId
        ? room?.availableGames.find((gameEntry) => gameEntry.id === selectedGameId)?.displayName ??
          text.noGame
        : text.noGame;
    const connectedPlayers = (room?.players ?? []).filter((player) => player.connected).length;
    const totalPlayers = room?.players.length ?? 0;
    const lifecycle = getRoomPhase(room) ?? "lobby";

    roomBadge.textContent = room?.code ?? "----";
    roomBadge.style.opacity = room ? "1" : "0.65";
    connectionBadge.textContent = room
      ? `${gameName}\n${connectedPlayers}/${totalPlayers} ${text.players.toLowerCase()} | ${text.lifecycle(lifecycle)}`
      : currentState.connected
        ? `${text.connected}\n${text.waitingForRoom}`
        : `${text.offline}\n${text.connectionMissing}`;
  }

  function renderPlayers(): void {
    const text = getHostText(resolveLanguage());
    const room = currentState.room;
    const players = room?.players ?? [];
    const connectedPlayers = players.filter((player) => player.connected).length;
    const canModeratePlayers = canManagePlayerRoster(room);

    playersCount.textContent = `${connectedPlayers}/${players.length}`;
    playersList.replaceChildren();
    moderationHint.textContent = canModeratePlayers
      ? text.moderationAllowed
      : text.moderationLocked;

    if (players.length === 0) {
      const empty = document.createElement("div");
      empty.textContent = room ? text.noPlayersConnected : text.roomListPending;
      empty.style.padding = "12px";
      empty.style.borderRadius = hostChrome.radius.control;
      empty.style.background = "rgba(8, 15, 30, 0.58)";
      empty.style.border = "1px solid rgba(148, 163, 184, 0.12)";
      empty.style.color = hostTheme.muted;
      empty.style.fontSize = "13px";
      empty.style.lineHeight = "1.4";
      playersList.appendChild(empty);
      return;
    }

    for (const player of players) {
      const row = document.createElement("div");
      row.style.display = "grid";
      row.style.gridTemplateColumns = "minmax(0, 1fr) auto";
      row.style.gap = "10px";
      row.style.alignItems = "center";
      row.style.padding = "10px 12px";
      row.style.borderRadius = hostChrome.radius.control;
      row.style.background = "rgba(8, 15, 30, 0.62)";
      row.style.border = "1px solid rgba(148, 163, 184, 0.12)";

      const details = document.createElement("div");
      details.style.display = "grid";
      details.style.gap = "4px";
      row.appendChild(details);

      const name = document.createElement("div");
      name.textContent = player.name;
      name.style.fontSize = "16px";
      name.style.fontWeight = "700";
      name.style.lineHeight = "1.2";
      details.appendChild(name);

      const status = document.createElement("div");
      status.textContent = `${player.connected ? "online" : player.presence} | ${player.isReady ? text.ready : text.notReady}`;
      status.style.fontSize = "12px";
      status.style.color = hostTheme.muted;
      details.appendChild(status);

      const kickButton = document.createElement("button");
      kickButton.type = "button";
      kickButton.textContent = text.kick;
      kickButton.title = text.kickPlayer(player.name);
      kickButton.style.padding = "10px 12px";
      kickButton.style.borderRadius = "12px";
      kickButton.style.border = "1px solid rgba(248, 113, 113, 0.24)";
      kickButton.style.background = "rgba(127, 29, 29, 0.78)";
      kickButton.style.color = "#fecaca";
      kickButton.style.fontFamily = hostTheme.bodyFont;
      kickButton.style.fontSize = "13px";
      kickButton.style.fontWeight = "700";
      kickButton.style.cursor = canModeratePlayers ? "pointer" : "not-allowed";
      kickButton.style.minWidth = "96px";
      kickButton.style.minHeight = "40px";
      kickButton.disabled = !canModeratePlayers;
      kickButton.style.opacity = canModeratePlayers ? "1" : "0.52";
      row.appendChild(kickButton);

      kickButton.addEventListener("click", () => {
        if (!canModeratePlayers) {
          return;
        }

        client.kickPlayer(player.id);
      });

      playersList.appendChild(row);
    }
  }

  function syncView(): void {
    const text = getHostText(resolveLanguage());
    syncOpenState(text.hostControlsTitle);
    title.textContent = text.hostControlsTitle;
    subtitle.textContent = text.hostControlsSubtitle;
    closeButton.textContent = text.close;
    fpsLabel.textContent = text.fpsLabel;
    languageLabel.textContent = text.languageLabel;
    playersLabel.textContent = text.players;
    renderRoomMeta();
    renderPlayers();

    for (const [fps, button] of fpsButtonMap) {
      const active = fps === currentFps;
      button.style.background = active ? "rgba(8, 47, 73, 0.88)" : "rgba(30, 41, 59, 0.72)";
      button.style.borderColor = active ? "rgba(56, 189, 248, 0.42)" : "rgba(148, 163, 184, 0.16)";
      button.style.boxShadow = active ? "0 0 0 1px rgba(56, 189, 248, 0.18) inset" : "none";
      button.style.color = active ? "#e0f2fe" : hostTheme.text;
    }

    const currentLanguage = resolveLanguage();
    for (const [language, button] of languageButtonMap) {
      const active = language === currentLanguage;
      button.style.background = active ? "rgba(8, 47, 73, 0.88)" : "rgba(30, 41, 59, 0.72)";
      button.style.borderColor = active ? "rgba(56, 189, 248, 0.42)" : "rgba(148, 163, 184, 0.16)";
      button.style.boxShadow = active ? "0 0 0 1px rgba(56, 189, 248, 0.18) inset" : "none";
      button.style.color = active ? "#e0f2fe" : hostTheme.text;
    }
  }

  toggleButton.addEventListener("click", () => {
    isOpen = !isOpen;
    writeStoredBoolean(openPreferenceKey, isOpen);
    syncView();
  });

  closeButton.addEventListener("click", () => {
    isOpen = false;
    writeStoredBoolean(openPreferenceKey, isOpen);
    syncView();
  });

  document.body.appendChild(overlay);
  applyHostFps(game, currentFps);

  const unsubscribe = client.subscribe((state) => {
    currentState = state;
    if (destroyed) {
      return;
    }

    syncView();
  });

  syncView();

  return () => {
    destroyed = true;
    unsubscribe();
    overlay.remove();
  };
}
