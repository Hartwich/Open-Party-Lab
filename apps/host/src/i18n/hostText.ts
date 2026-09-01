import {
  defaultLanguage,
  normalizeLanguage,
  type RoomLifecycle,
  type SupportedLanguage
} from "@open-party-lab/protocol";

const languagePreferenceKey = "open-party-lab.host-language";

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
  shellKicker: string;
  shellTitle: string;
  shellSetupKicker: string;
  shellMoreGames: (count: number) => string;
  shellStartRound: string;
  shellRoundRunning: string;
  shellBackToCatalog: string;
  shellRosterEmpty: string;
  shellNeedsPlayers: (missing: number) => string;
  shellReadyCount: (ready: number, total: number) => string;
}

const hostText = {
  de: {
    shellKicker: "Spiel waehlen",
    shellTitle: "Was spielen wir?",
    shellSetupKicker: "Einstellungen",
    shellMoreGames: (count: number) => `${count} weitere`,
    shellStartRound: "Runde starten",
    shellRoundRunning: "Runde laeuft",
    shellBackToCatalog: "Zur Auswahl",
    shellRosterEmpty: "Noch niemand da. Code scannen zum Beitreten.",
    shellNeedsPlayers: (missing: number) =>
      missing === 1 ? "Es fehlt noch 1 Spieler." : `Es fehlen noch ${missing} Spieler.`,
    shellReadyCount: (ready: number, total: number) => `${ready} von ${total} bereit`,
    hostControlRequestTitle: "Steuerung uebernehmen?",
    hostControlRequestBody: (name: string) => `${name} moechte den Host steuern.`,
    hostControlRequestHint: "Spielauswahl, Rundenstart und Spielerverwaltung wandern aufs Handy.",
    hostControlAllow: "Erlauben",
    hostControlDeny: "Ablehnen",
    hostControlDelegatedTitle: "Handy steuert",
    hostControlDelegatedBody: (name: string) => `${name} steuert den Host.`,
    hostControlReclaim: "Zurueckholen",
    languageLabel: "Sprache",
    themeLabel: "Design",
    themeLight: "Hell",
    themeDark: "Dunkel",
    phoneController: "Handy-Controller",
    showPhoneController: "Handy-Controller anzeigen",
    hide: "Verstecken",
    fullscreen: "Vollbild",
    exitFullscreen: "Vollbild beenden",
    fpsLabel: "FPS",
    hostControlsTitle: "Host-Steuerung",
    hostControlsSubtitle: "FPS, Sprache, Spieler",
    close: "Schliessen",
    noGame: "Kein Spiel",
    connected: "Verbunden",
    waitingForRoom: "Warte auf Raum",
    offline: "Offline",
    connectionMissing: "Verbindung fehlt",
    players: "Spieler",
    playerRange: (min: number, max: number) => `${min}-${max} Spieler`,
    selected: "Ausgewaehlt",
    lobby: "Lobby",
    connectedShort: "verbunden",
    noPlayersJoined: "Noch keine Spieler beigetreten.",
    noPlayersConnected: "Noch keine Spieler verbunden.",
    roomListPending: "Sobald ein Raum da ist, erscheint die Liste hier.",
    moderationAllowed: "Spieler koennen im Lobby- oder Zwischenrunden-Zustand entfernt werden.",
    moderationLocked: "Waehrend einer aktiven Runde ist Kicken gesperrt.",
    ready: "bereit",
    waiting: "wartet",
    reconnecting: "verbindet neu",
    notReady: "nicht bereit",
    kick: "Kicken",
    kickPlayer: (name: string) => `Spieler ${name} kicken`,
    roomCode: "RAUMCODE",
    join: "Join",
    lobbyTitle: "Party Lobby",
    lobbyPlayersTitle: "Spieler in der Lobby",
    quickStartTitle: "Schnellstart",
    quickStartLines: [
      "Klick oder Zahlentaste waehlt ein Spiel.",
      "Start danach automatisch oder mit SPACE."
    ],
    gameSelectionFallback: "Spielauswahl",
    gameSelectRoundActiveSubtitle:
      "Die Spieluebersicht ist offen. Solange eine Runde laeuft, bleiben Auswahl und Start gesperrt.",
    gameSelectAutoReadySubtitle:
      "Spiel per Maus oder Zahlentaste wechseln. Ready-basierte Runden starten automatisch.",
    gameSelectClassicSubtitle:
      "Spiel per Maus oder Zahlentaste wechseln. Standard-Runden starten mit SPACE.",
    playerStatusTitle: "Spielerstatus",
    noActiveGameTitle: "Noch kein Spiel aktiv",
    noActiveGameSelectLine: "Waehle oben eine Spielkarte aus.",
    noActiveGameRoundActiveLine:
      "Die aktuelle Runde laeuft noch. Nach dem Ende kannst du hier wieder ein neues Spiel waehlen.",
    noActiveGameStartLine:
      "Danach startet die Runde je nach Spiel automatisch ueber Bereitschaft oder klassisch mit SPACE.",
    playersConnected: (count: number, max: number) => `Spieler verbunden: ${count}/${max}`,
    activeRoundLockedLine:
      "Aktive Runde laeuft gerade. Die Auswahl bleibt sichtbar, ist aber bis zum Rundenende gesperrt.",
    setupChoicePendingLine: "Alle Spieler muessen zuerst ihre Auswahl treffen.",
    autoReadyLine: "Alle Spieler muessen am Handy bereit sein.",
    spaceStartLine: "SPACE startet die Runde, sobald genug Spieler verbunden sind.",
    setupControlsLine: "Dieses Spiel hat Setup-Optionen, die direkt hier gesetzt werden.",
    afterRoundSwitchLine: "Nach dem Rundenende kannst du hier wieder frei umschalten.",
    autoStartsWhenReadyLine: "Sobald alle wieder bereit sind, startet die Runde automatisch.",
    readyVisibleLine: "Bereitschaft und Startstatus bleiben hier sichtbar.",
    setupFollowsTitle: "Setup folgt",
    readyToStartTitle: "Startbereit",
    backToMenu: "Zum Hauptmenue",
    backToMenuShort: "Menue",
    gameLobbySubtitle: "Stellt die Runde ein und startet gemeinsam.",
    gameLobbySetupTitle: "Rundeneinstellungen",
    characterSelecting: "Charakter waehlt noch",
    morePlayers: (count: number) => `+${count} weitere Spieler`,
    errorLabel: "Fehler",
    roomPrefix: "Raum",
    hostCreatingRoom: "Raum wird erstellt ...",
    hostConnecting: "Verbinde Host mit Server ...",
    scanQr: "QR scannen oder Link am Handy oeffnen",
    hostPageHint: "Am Handy immer den angezeigten Controller-Link oder QR-Code verwenden.",
    serverOnline: "Server online",
    serverOffline: "Server offline",
    readyNextTitle: "Bereit fuer die naechste Runde",
    lifecycle: (phase: RoomLifecycle | string) => phase
  },
  en: {
    shellKicker: "Choose a game",
    shellTitle: "What are we playing?",
    shellSetupKicker: "Settings",
    shellMoreGames: (count: number) => `${count} more`,
    shellStartRound: "Start round",
    shellRoundRunning: "Round running",
    shellBackToCatalog: "Back to games",
    shellRosterEmpty: "Nobody here yet. Scan the code to join.",
    shellNeedsPlayers: (missing: number) =>
      missing === 1 ? "1 more player needed." : `${missing} more players needed.`,
    shellReadyCount: (ready: number, total: number) => `${ready} of ${total} ready`,
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
    hostControlsTitle: "Host Controls",
    hostControlsSubtitle: "FPS, language, players",
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
