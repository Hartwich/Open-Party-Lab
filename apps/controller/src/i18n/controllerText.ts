import {
  defaultLanguage,
  normalizeLanguage,
  type PublicGamePhase,
  type SupportedLanguage
} from "@open-party-lab/protocol";

// v2 key: the club runs English by default, so phones that stored the old
// German default start fresh on English. The DE/EN toggle still works.
const languagePreferenceKey = "open-party-lab.controller-language-v2";

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
  hostControlTitle: string;
  hostControlTake: string;
  hostControlPending: string;
  hostControlPendingCountdown: (seconds: number) => string;
  hostControlHeldByOther: (name: string) => string;
  hostControlHandoverTitle: string;
  hostControlHandoverBody: (name: string) => string;
  hostControlHandoverKeep: string;
  hostControlHandoverGive: string;
  hostControlHandoverCountdown: (seconds: number) => string;
  hostMenuOpen: string;
  hostMenuTitle: string;
  hostMenuPausedNote: string;
  hostMenuResume: string;
  hostMenuToMainMenu: string;
  hostControlActive: string;
  hostControlRelease: string;
  themeLabel: string;
  themeLight: string;
  themeDark: string;
  languageLabel: string;
  hostControlChooseGame: string;
  hostControlStartRound: string;
  hostControlBackToMenu: string;
  hostControlRoster: string;
  hostControlKick: (name: string) => string;
  hostControlRoundRunning: string;
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
  fullscreenHelp: string;
  fullscreenInstallTitle: string;
  fullscreenInstallBody: string;
  fullscreenUnavailable: string;
  fullscreenFailed: string;
  fullscreenHelpClose: string;
  score: string;
  lobbySelected: (gameName: string) => string;
  lobbyWaitingHost: string;
  leaveRoom: string;
  ready: string;
  notReady: string;
  chooseCharacterFirst: string;
  chooseSetupFirst: string;
  setup: string;
  setupChooseTitle: string;
  selectionCount: (selected: number, min: number, max: number) => string;
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
  en: {
    hostControlTitle: "Host controls",
    hostControlTake: "Take host control",
    hostControlPending: "Request sent.",
    hostControlPendingCountdown: (seconds: number) =>
      `Taking over in ${seconds}s unless someone objects.`,
    hostControlHeldByOther: (name: string) => `${name} is driving the host.`,
    hostControlHandoverTitle: "Hand the controls over?",
    hostControlHandoverBody: (name: string) => `${name} wants to take over.`,
    hostControlHandoverKeep: "Keep",
    hostControlHandoverGive: "Hand over",
    hostControlHandoverCountdown: (seconds: number) =>
      `Without an answer they get them in ${seconds}s.`,
    hostMenuOpen: "Host menu",
    hostMenuTitle: "Host menu",
    hostMenuPausedNote: "The round is held while this menu is open.",
    hostMenuResume: "Resume",
    hostMenuToMainMenu: "Back to main menu",
    hostControlActive: "You are driving the host.",
    hostControlRelease: "Hand control back",
    themeLabel: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    languageLabel: "Language",
    hostControlChooseGame: "Choose a game",
    hostControlStartRound: "Start round",
    hostControlBackToMenu: "Back to menu",
    hostControlRoster: "Players in the room",
    hostControlKick: (name: string) => `Remove ${name}`,
    hostControlRoundRunning: "Locked while a round is running.",
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
    fullscreenHelp: "Fullscreen help",
    fullscreenInstallTitle: "Play without browser toolbars",
    fullscreenInstallBody: "This browser cannot switch the controller to fullscreen with a button. Open this page in Safari and choose Share → Add to Home Screen. If shown, enable Open as Web App.\n\nThen launch the controller from the new icon. Rejoin the room there if needed.",
    fullscreenUnavailable: "This browser does not support fullscreen for the controller. You can keep playing here or use another browser.",
    fullscreenFailed: "The browser refused to switch fullscreen mode. Close this message and try again. You can also keep playing without fullscreen.",
    fullscreenHelpClose: "Got it",
    score: "Score",
    lobbySelected: (gameName: string) => `Selected: ${gameName}`,
    lobbyWaitingHost: "The host is about to pick a game.",
    leaveRoom: "Leave room",
    ready: "Ready",
    notReady: "Not ready",
    chooseCharacterFirst: "Choose character first",
    chooseSetupFirst: "Choose setup first",
    setup: "Setup",
    setupChooseTitle: "Choose Setup",
    selectionCount: (selected: number, min: number, max: number) =>
      `${selected}/${max} selected, at least ${min}`,
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
