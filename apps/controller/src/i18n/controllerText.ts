import {
  defaultLanguage,
  normalizeLanguage,
  type PublicGamePhase,
  type SupportedLanguage
} from "@open-party-lab/protocol";

const languagePreferenceKey = "open-party-lab.controller-language";

export function readStoredControllerLanguage(): SupportedLanguage {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return defaultLanguage;
  }

  return normalizeLanguage(window.localStorage.getItem(languagePreferenceKey));
}

export function writeStoredControllerLanguage(language: SupportedLanguage): void {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }

  window.localStorage.setItem(languagePreferenceKey, language);
}

export interface ControllerText {
  joinTitle: string;
  joinSubtitle: string;
  roomCode: string;
  name: string;
  joinRoom: string;
  connectingController: string;
  serverConnected: string;
  serverNotConnected: string;
  reconnectTitle: string;
  reconnectSubtitle: string;
  continueSession: string;
  discardLocalSession: string;
  room: string;
  notFoundTitle: string;
  notFoundSubtitle: string;
  notFoundBody: string;
  controllerTitle: string;
  preparingGameView: string;
  unsupportedGame: string;
  phase: string;
  unknown: string;
  logout: string;
  fullscreen: string;
  exitFullscreen: string;
  fullscreenHint: string;
  exitFullscreenHint: string;
  score: string;
  lobbySelected: (gameName: string) => string;
  lobbyWaitingHost: string;
  leaveRoom: string;
  ready: string;
  notReady: string;
  chooseCharacterFirst: string;
  characterChooseTitle: string;
  characterChooseDescription: string;
  yourCharacter: string;
  select: string;
  chosenBy: (names: string) => string;
  stillFree: string;
  players: string;
  minRequired: (minPlayers: number) => string;
  needsMorePlayers: string;
  readyCount: string;
  character: string;
  noCharacter: string;
  connectedReady: string;
  connectedWaiting: string;
  nextRound: string;
  nextRoundDescription: (readyCount: number, playerCount: number) => string;
  readyForNextRound: string;
  readyForNextRoundQuestion: string;
  waitForPlayers: (readyCount: number, playerCount: number) => string;
  formatPhase: (phase: PublicGamePhase | string | undefined) => string;
}

const controllerText = {
  de: {
    joinTitle: "Beitreten",
    joinSubtitle: "Verbinde dein Handy mit dem Raum auf dem grossen Bildschirm.",
    roomCode: "Raumcode",
    name: "Name",
    joinRoom: "Dem Raum beitreten",
    connectingController: "Verbinde Controller mit Server ...",
    serverConnected: "Server verbunden.",
    serverNotConnected: "Noch keine Serververbindung.",
    reconnectTitle: "Session fortsetzen",
    reconnectSubtitle: "Es liegt noch eine gespeicherte Controller-Session auf diesem Geraet vor.",
    continueSession: "Session fortsetzen",
    discardLocalSession: "Lokale Session verwerfen",
    room: "Raum",
    notFoundTitle: "Seite nicht gefunden",
    notFoundSubtitle: "Die Controller-Ansicht konnte nicht aufgebaut werden.",
    notFoundBody: "Bitte lade die Seite neu oder tritt dem Raum erneut bei.",
    controllerTitle: "Controller",
    preparingGameView: "Die Spielansicht wird vorbereitet.",
    unsupportedGame: "Der Host hat noch kein unterstuetztes Spiel gestartet.",
    phase: "Phase",
    unknown: "unbekannt",
    logout: "Ausloggen",
    fullscreen: "Vollbild",
    exitFullscreen: "Vollbild beenden",
    fullscreenHint: "Klick oder F startet den Vollbildmodus",
    exitFullscreenHint: "Esc oder F beendet den Vollbildmodus",
    score: "Score",
    lobbySelected: (gameName: string) => `Ausgewaehlt: ${gameName}`,
    lobbyWaitingHost: "Der Host waehlt gleich ein Spiel.",
    leaveRoom: "Raum verlassen",
    ready: "Bereit",
    notReady: "Nicht bereit",
    chooseCharacterFirst: "Erst Charakter waehlen",
    characterChooseTitle: "Charakter waehlen",
    characterChooseDescription: "Bitte zuerst einen Charakter fuer den Run auswaehlen. Danach kannst du dich bereit setzen.",
    yourCharacter: "Dein Charakter",
    select: "Auswaehlen",
    chosenBy: (names: string) => `Gewaehlt von ${names}`,
    stillFree: "Noch frei",
    players: "Spieler",
    minRequired: (minPlayers: number) => `mindestens ${minPlayers} noetig`,
    needsMorePlayers: "Fuer dieses Spiel braucht ihr noch mehr Spieler.",
    readyCount: "Bereit",
    character: "Charakter",
    noCharacter: "Kein Charakter",
    connectedReady: "bereit",
    connectedWaiting: "wartet",
    nextRound: "Naechste Runde",
    nextRoundDescription: (readyCount: number, playerCount: number) =>
      `Naechste Runde startet bei ${readyCount}/${playerCount} bereit.`,
    readyForNextRound: "Bereit fuer die naechste Runde",
    readyForNextRoundQuestion: "Bereit fuer die naechste Runde?",
    waitForPlayers: (readyCount: number, playerCount: number) =>
      `Warte auf alle Spieler. ${readyCount}/${playerCount} bereit.`,
    formatPhase: (phase: PublicGamePhase | string | undefined) => {
      switch (phase) {
        case "round_intro":
          return "Intro";
        case "countdown":
          return "Countdown";
        case "playing":
          return "Spielen";
        case "locked":
          return "Gesperrt";
        case "result":
          return "Ergebnis";
        case "scoreboard":
          return "Scoreboard";
        case "finished":
          return "Fertig";
        default:
          return "Warten";
      }
    }
  },
  en: {
    joinTitle: "Join",
    joinSubtitle: "Connect your phone to the room on the big screen.",
    roomCode: "Room code",
    name: "Name",
    joinRoom: "Join room",
    connectingController: "Connecting controller to server ...",
    serverConnected: "Server connected.",
    serverNotConnected: "No server connection yet.",
    reconnectTitle: "Resume Session",
    reconnectSubtitle: "This device still has a saved controller session.",
    continueSession: "Resume session",
    discardLocalSession: "Discard local session",
    room: "Room",
    notFoundTitle: "Page not found",
    notFoundSubtitle: "The controller view could not be created.",
    notFoundBody: "Reload the page or join the room again.",
    controllerTitle: "Controller",
    preparingGameView: "Preparing the game view.",
    unsupportedGame: "The host has not started a supported game yet.",
    phase: "Phase",
    unknown: "unknown",
    logout: "Log out",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    fullscreenHint: "Click or press F to enter fullscreen",
    exitFullscreenHint: "Esc or F exits fullscreen",
    score: "Score",
    lobbySelected: (gameName: string) => `Selected: ${gameName}`,
    lobbyWaitingHost: "The host is about to pick a game.",
    leaveRoom: "Leave room",
    ready: "Ready",
    notReady: "Not ready",
    chooseCharacterFirst: "Choose character first",
    characterChooseTitle: "Choose Character",
    characterChooseDescription: "Choose a character for the run first. Then you can ready up.",
    yourCharacter: "Your character",
    select: "Select",
    chosenBy: (names: string) => `Chosen by ${names}`,
    stillFree: "Still free",
    players: "Players",
    minRequired: (minPlayers: number) => `at least ${minPlayers} required`,
    needsMorePlayers: "This game needs more players.",
    readyCount: "Ready",
    character: "Character",
    noCharacter: "No character",
    connectedReady: "ready",
    connectedWaiting: "waiting",
    nextRound: "Next Round",
    nextRoundDescription: (readyCount: number, playerCount: number) =>
      `Next round starts at ${readyCount}/${playerCount} ready.`,
    readyForNextRound: "Ready for the next round",
    readyForNextRoundQuestion: "Ready for the next round?",
    waitForPlayers: (readyCount: number, playerCount: number) =>
      `Waiting for all players. ${readyCount}/${playerCount} ready.`,
    formatPhase: (phase: PublicGamePhase | string | undefined) => {
      switch (phase) {
        case "round_intro":
          return "Intro";
        case "countdown":
          return "Countdown";
        case "playing":
          return "Playing";
        case "locked":
          return "Locked";
        case "result":
          return "Result";
        case "scoreboard":
          return "Scoreboard";
        case "finished":
          return "Finished";
        default:
          return "Waiting";
      }
    }
  }
} satisfies Record<SupportedLanguage, ControllerText>;

export function getControllerText(language: SupportedLanguage | null | undefined): ControllerText {
  return controllerText[normalizeLanguage(language)];
}
