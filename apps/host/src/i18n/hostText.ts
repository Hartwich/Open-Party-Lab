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
  arenaNeedsCharacterLine: string;
  autoReadyLine: string;
  spaceStartLine: string;
  minionsSetupLine: string;
  arenaContinuesLine: string;
  arenaReadyLine: string;
  afterRoundSwitchLine: string;
  autoStartsWhenReadyLine: string;
  readyVisibleLine: string;
  setupFollowsTitle: string;
  readyToStartTitle: string;
  characterSelecting: string;
  morePlayers: (count: number) => string;
  errorLabel: string;
  roundFallbackTitle: string;
  roundFallbackMessage: string;
  roomPrefix: string;
  hostCreatingRoom: string;
  hostConnecting: string;
  scanQr: string;
  hostPageHint: string;
  serverOnline: string;
  serverOffline: string;
  scoreTotal: string;
  noPoints: string;
  roundEndTitle: string;
  readyNextTitle: string;
  scoreboardTitle: string;
  gameCompleted: (gameName: string) => string;
  roundCompleted: string;
  nextAutoHint: string;
  nextSpaceHint: string;
  lifecycle: (phase: RoomLifecycle | string) => string;
}

const hostText = {
  de: {
    languageLabel: "Sprache",
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
    arenaNeedsCharacterLine: "Alle Spieler brauchen fuer Arena Survivor zuerst eine Charakterwahl.",
    autoReadyLine: "Alle Spieler muessen am Handy bereit sein.",
    spaceStartLine: "SPACE startet die Runde, sobald genug Spieler verbunden sind.",
    minionsSetupLine: "MinionsTD nutzt ein Setup fuer Map, Leben und Startgeld.",
    arenaContinuesLine: "Arena Survivor laeuft weiter, auch wenn der Host ins Hauptmenue wechselt.",
    arenaReadyLine: "Nach der Charakterwahl startet die Runde ueber Bereitschaft.",
    afterRoundSwitchLine: "Nach dem Rundenende kannst du hier wieder frei umschalten.",
    autoStartsWhenReadyLine: "Sobald alle wieder bereit sind, startet die Runde automatisch.",
    readyVisibleLine: "Bereitschaft und Startstatus bleiben hier sichtbar.",
    setupFollowsTitle: "Setup folgt",
    readyToStartTitle: "Startbereit",
    characterSelecting: "Charakter waehlt noch",
    morePlayers: (count: number) => `+${count} weitere Spieler`,
    errorLabel: "Fehler",
    roundFallbackTitle: "Runde",
    roundFallbackMessage: "Gleich geht es los.",
    roomPrefix: "Raum",
    hostCreatingRoom: "Raum wird erstellt ...",
    hostConnecting: "Verbinde Host mit Server ...",
    scanQr: "QR scannen oder Link am Handy oeffnen",
    hostPageHint: "Wenn am Handy die Host-Seite erscheint, stattdessen den QR-Code oder Port 5174 nutzen.",
    serverOnline: "Server online",
    serverOffline: "Server offline",
    scoreTotal: "Gesamt",
    noPoints: "Noch keine Punkte.",
    roundEndTitle: "Rundenende",
    readyNextTitle: "Bereit fuer die naechste Runde",
    scoreboardTitle: "Scoreboard",
    gameCompleted: (gameName: string) => `${gameName} abgeschlossen.`,
    roundCompleted: "Runde abgeschlossen.",
    nextAutoHint: "Naechste Runde startet automatisch, sobald alle wieder bereit sind.",
    nextSpaceHint: "Leertaste = Naechste Runde",
    lifecycle: (phase: RoomLifecycle | string) => phase
  },
  en: {
    languageLabel: "Language",
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
    arenaNeedsCharacterLine: "All players need to choose an Arena Survivor character first.",
    autoReadyLine: "All players need to be ready on their phones.",
    spaceStartLine: "SPACE starts the round once enough players are connected.",
    minionsSetupLine: "Minions TD uses setup for map, lives, and starting gold.",
    arenaContinuesLine: "Arena Survivor keeps running when the host opens the main menu.",
    arenaReadyLine: "After character selection, the round starts through readiness.",
    afterRoundSwitchLine: "After the round ends, you can switch freely again.",
    autoStartsWhenReadyLine: "As soon as everyone is ready again, the round starts automatically.",
    readyVisibleLine: "Readiness and start status stay visible here.",
    setupFollowsTitle: "Setup Next",
    readyToStartTitle: "Ready to Start",
    characterSelecting: "Choosing character",
    morePlayers: (count: number) => `+${count} more players`,
    errorLabel: "Error",
    roundFallbackTitle: "Round",
    roundFallbackMessage: "Starting soon.",
    roomPrefix: "Room",
    hostCreatingRoom: "Creating room ...",
    hostConnecting: "Connecting host to server ...",
    scanQr: "Scan QR code or open the link on your phone",
    hostPageHint: "If the host page opens on the phone, use the QR code or port 5174 instead.",
    serverOnline: "Server online",
    serverOffline: "Server offline",
    scoreTotal: "Total",
    noPoints: "No points yet.",
    roundEndTitle: "Round End",
    readyNextTitle: "Ready for the next round",
    scoreboardTitle: "Scoreboard",
    gameCompleted: (gameName: string) => `${gameName} complete.`,
    roundCompleted: "Round complete.",
    nextAutoHint: "The next round starts automatically once everyone is ready again.",
    nextSpaceHint: "Space = Next round",
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
