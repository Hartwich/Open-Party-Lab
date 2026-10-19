import {
  defaultLanguage,
  normalizeLanguage,
  type RoomLifecycle,
  type SupportedLanguage
} from "@open-party-lab/protocol";

// v2 key: the club runs English by default, so browsers that stored the old
// English default start fresh. No DE/EN toggle — English only.
const languagePreferenceKey = "open-party-lab.host-language-v2";

export function readStoredHostLanguage(): SupportedLanguage {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return defaultLanguage;
  }

  return normalizeLanguage(window.localStorage.getItem(languagePreferenceKey));
}

export function writeStoredHostLanguage(language: SupportedLanguage): void {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }

  window.localStorage.setItem(languagePreferenceKey, language);
}

export interface HostText {
  languageLabel: string;
  themeLabel: string;
  themeLight: string;
  themeDark: string;
  phoneController: string;
  showPhoneController: string;
  hide: string;
  fullscreen: string;
  exitFullscreen: string;
  fpsLabel: string;
  musicVolumeLabel: string;
  soundEffectsVolumeLabel: string;
  hostControlsTitle: string;
  hostControlsSubtitle: string;
  close: string;
  noGame: string;
  connected: string;
  waitingForRoom: string;
  offline: string;
  connectionMissing: string;
  players: string;
  playerRange: (min: number, max: number) => string;
  selected: string;
  lobby: string;
  connectedShort: string;
  noPlayersJoined: string;
  noPlayersConnected: string;
  roomListPending: string;
  moderationAllowed: string;
  moderationLocked: string;
  ready: string;
  waiting: string;
  reconnecting: string;
  notReady: string;
  kick: string;
  kickPlayer: (name: string) => string;
  roomCode: string;
  join: string;
  lobbyTitle: string;
  lobbyPlayersTitle: string;
  quickStartTitle: string;
  quickStartLines: string[];
  gameSelectionFallback: string;
  gameSelectRoundActiveSubtitle: string;
  gameSelectAutoReadySubtitle: string;
  gameSelectClassicSubtitle: string;
  playerStatusTitle: string;
  noActiveGameTitle: string;
  noActiveGameSelectLine: string;
  noActiveGameRoundActiveLine: string;
  noActiveGameStartLine: string;
  playersConnected: (count: number, max: number) => string;
  activeRoundLockedLine: string;
  setupChoicePendingLine: string;
  autoReadyLine: string;
  spaceStartLine: string;
  setupControlsLine: string;
  afterRoundSwitchLine: string;
  autoStartsWhenReadyLine: string;
  readyVisibleLine: string;
  setupFollowsTitle: string;
  readyToStartTitle: string;
  backToMenu: string;
  backToMenuShort: string;
  gameLobbySubtitle: string;
  gameLobbySetupTitle: string;
  characterSelecting: string;
  morePlayers: (count: number) => string;
  errorLabel: string;
  roomPrefix: string;
  hostCreatingRoom: string;
  hostConnecting: string;
  scanQr: string;
  hostPageHint: string;
  serverOnline: string;
  serverOffline: string;
  readyNextTitle: string;
  lifecycle: (phase: RoomLifecycle | string) => string;
  hostControlRequestTitle: string;
  hostControlRequestBody: (name: string) => string;
  hostControlRequestHint: string;
  hostControlAllow: string;
  hostControlDeny: string;
  hostControlDelegatedTitle: string;
  hostControlDelegatedBody: (name: string) => string;
  hostControlReclaim: string;
  roundPausedTitle: string;
  roundPausedByPlayer: (name: string) => string;
  roundPausedByScreen: string;
  roundPausedHint: string;
  shellKicker: string;
  shellTitle: string;
  shellSetupKicker: string;
  shellStartRound: string;
  shellRoundRunning: string;
  shellBackToCatalog: string;
  shellRosterEmpty: string;
  shellNeedsPlayers: (missing: number) => string;
  shellReadyCount: (ready: number, total: number) => string;
  roomExpiryTitle: string;
  roomExpiryBody: (minutes: number) => string;
  roomExpiryExtend: string;
  roomExpiryExtending: string;
  roomExpiryExtended: string;
  roomExpiryCountdown: (time: string) => string;
}

const hostText = {
  de: {
  en: {
    shellKicker: "Choose a game",
    shellTitle: "What are we playing?",
    shellSetupKicker: "Settings",
    shellStartRound: "Start round",
    shellRoundRunning: "Round running",
    shellBackToCatalog: "Back to games",
    shellRosterEmpty: "Nobody here yet. Scan the code to join.",
    shellNeedsPlayers: (missing: number) =>
      missing === 1 ? "1 more player needed." : `${missing} more players needed.`,
    shellReadyCount: (ready: number, total: number) => `${ready} of ${total} ready`,
    roomExpiryTitle: "Room expiring soon",
    roomExpiryBody: (minutes: number) => `This room will close in about ${minutes} minutes.`,
    roomExpiryExtend: "Extend by 1 hour",
    roomExpiryExtending: "Extending...",
    roomExpiryExtended: "Room extended by one hour.",
    roomExpiryCountdown: (time: string) => `This room will close in ${time}.`,
    roundPausedTitle: "Round paused",
    roundPausedByPlayer: (name: string) => `${name} opened the host menu.`,
    roundPausedByScreen: "The host menu is open.",
    roundPausedHint: "Play resumes when the menu is closed.",
    hostControlRequestTitle: "Hand over control?",
    hostControlRequestBody: (name: string) => `${name} wants to drive the host.`,
    hostControlRequestHint: "Game selection, round start and the roster move to the phone.",
    hostControlAllow: "Allow",
    hostControlDeny: "Decline",
    hostControlDelegatedTitle: "Phone in control",
    hostControlDelegatedBody: (name: string) => `${name} is driving the host.`,
    hostControlReclaim: "Take back",
    languageLabel: "Language",
    themeLabel: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    phoneController: "Phone Controller",
    showPhoneController: "Show phone controller",
    hide: "Hide",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    fpsLabel: "FPS",
    musicVolumeLabel: "Music",
    soundEffectsVolumeLabel: "Sound effects",
    hostControlsTitle: "Host Controls",
    hostControlsSubtitle: "Audio, video, language, players",
    close: "Close",
    noGame: "No game",
    connected: "Connected",
    waitingForRoom: "Waiting for room",
    offline: "Offline",
    connectionMissing: "Connection missing",
    players: "Players",
    playerRange: (min: number, max: number) => `${min}-${max} players`,
    selected: "Selected",
    lobby: "Lobby",
    connectedShort: "connected",
    noPlayersJoined: "No players have joined yet.",
    noPlayersConnected: "No players connected yet.",
    roomListPending: "The player list appears here once a room exists.",
    moderationAllowed: "Players can be removed in the lobby or between rounds.",
    moderationLocked: "Kicking is locked during an active round.",
    ready: "ready",
    waiting: "waiting",
    reconnecting: "reconnecting",
    notReady: "not ready",
    kick: "Kick",
    kickPlayer: (name: string) => `Kick player ${name}`,
    roomCode: "ROOM CODE",
    join: "Join",
    lobbyTitle: "Party Lobby",
    lobbyPlayersTitle: "Players in Lobby",
    quickStartTitle: "Quick Start",
    quickStartLines: [
      "Click or press a number key to pick a game.",
      "Then start automatically or with SPACE."
    ],
    gameSelectionFallback: "Game Selection",
    gameSelectRoundActiveSubtitle:
      "The game overview is open. While a round is running, selection and start stay locked.",
    gameSelectAutoReadySubtitle:
      "Switch games with the mouse or number keys. Ready-based rounds start automatically.",
    gameSelectClassicSubtitle:
      "Switch games with the mouse or number keys. Standard rounds start with SPACE.",
    playerStatusTitle: "Player Status",
    noActiveGameTitle: "No active game",
    noActiveGameSelectLine: "Select a game card above.",
    noActiveGameRoundActiveLine:
      "The current round is still running. Once it ends, you can choose a new game here.",
    noActiveGameStartLine:
      "After that, the round starts either through readiness or classically with SPACE.",
    playersConnected: (count: number, max: number) => `Players connected: ${count}/${max}`,
    activeRoundLockedLine:
      "An active round is running. The selection stays visible, but it is locked until the round ends.",
    setupChoicePendingLine: "All players need to make their selection first.",
    autoReadyLine: "All players need to be ready on their phones.",
    spaceStartLine: "SPACE starts the round once enough players are connected.",
    setupControlsLine: "This game has setup options that can be configured here.",
    afterRoundSwitchLine: "After the round ends, you can switch freely again.",
    autoStartsWhenReadyLine: "As soon as everyone is ready again, the round starts automatically.",
    readyVisibleLine: "Readiness and start status stay visible here.",
    setupFollowsTitle: "Setup Next",
    readyToStartTitle: "Ready to Start",
    backToMenu: "Back to menu",
    backToMenuShort: "Menu",
    gameLobbySubtitle: "Configure the round and start together.",
    gameLobbySetupTitle: "Round setup",
    characterSelecting: "Choosing character",
    morePlayers: (count: number) => `+${count} more players`,
    errorLabel: "Error",
    roomPrefix: "Room",
    hostCreatingRoom: "Creating room ...",
    hostConnecting: "Connecting host to server ...",
    scanQr: "Scan QR code or open the link on your phone",
    hostPageHint: "Always use the displayed controller link or QR code on the phone.",
    serverOnline: "Server online",
    serverOffline: "Server offline",
    readyNextTitle: "Ready for the next round",
    lifecycle: (phase: RoomLifecycle | string) => {
      switch (phase) {
        case "lobby":
          return "lobby";
        case "game_selected":
          return "game selected";
        case "round_intro":
          return "intro";
        case "countdown":
          return "countdown";
        case "playing":
          return "playing";
        case "locked":
          return "locked";
        case "result":
          return "result";
        case "scoreboard":
          return "scoreboard";
        case "finished":
          return "finished";
        default:
          return phase;
      }
    }
  }
} satisfies Record<SupportedLanguage, HostText>;

export function getHostText(language: SupportedLanguage | null | undefined): HostText {
  return hostText[normalizeLanguage(language)];
}
