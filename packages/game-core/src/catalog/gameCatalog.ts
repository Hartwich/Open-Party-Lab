import type { GameManifest } from "../types/GameManifest.js";
import { defaultLanguage, normalizeLanguage, type SupportedLanguage } from "../i18n/language.js";
import { gameTextById } from "./i18n/gameTexts.js";

export const gameCatalog = [
  {
    id: "drift-racer",
    displayName: "Drift Racer",
    description: "Arcade-Rennen mit Drittperson-Splitscreen, engen Drifts und Boost-Duellen.",
    minPlayers: 1,
    maxPlayers: 4,
    hostView: "DriftRacerHostScene",
    controllerView: "drift-racer",
    controllerLayout: "racing_controls",
    supportsTeams: false,
    estimatedRoundDurationMs: 180_000,
    phaseDurations: {
      roundIntroMs: 1_400,
      countdownMs: 2_000,
      lockedMs: 2_200,
      resultMs: 4_000,
      scoreboardMs: 4_000
    }
  },
  {
    id: "chaos-kommando",
    displayName: "Chaos-Kommando",
    description: "Rundenbasierte Cartoon-Artillerie mit Mini-Soeldnern, irren Waffen und fiesen Cratern.",
    minPlayers: 2,
    maxPlayers: 4,
    hostView: "ChaosKommandoHostScene",
    controllerView: "chaos-kommando",
    controllerLayout: "chaos_kommando_controls",
    supportsTeams: false,
    estimatedRoundDurationMs: 180_000,
    roundCompletionMode: "wait_for_ready",
    phaseDurations: {
      roundIntroMs: 1_800,
      countdownMs: 2_200,
      resultMs: 5_200,
      scoreboardMs: 5_000
    }
  },
  {
    id: "zeichnen-und-erraten",
    displayName: "Zeichnen & Erraten",
    description: "Eine Person zeichnet auf dem Handy, alle anderen raten das Wort.",
    minPlayers: 2,
    maxPlayers: 20,
    hostView: "ZeichnenUndErratenHostScene",
    controllerView: "zeichnen-und-erraten",
    controllerLayout: "drawing_guess",
    supportsTeams: false,
    estimatedRoundDurationMs: 95_000,
    roundCompletionMode: "wait_for_ready",
    phaseDurations: {
      roundIntroMs: 1_500,
      countdownMs: 2_000,
      resultMs: 4_000,
      scoreboardMs: 4_000
    }
  },
  {
    id: "word-tiles",
    displayName: "Word Tiles",
    description: "Lege Woerter auf ein gemeinsames Brett und nutze Premiumfelder geschickt.",
    minPlayers: 2,
    maxPlayers: 4,
    hostView: "WordTilesHostScene",
    controllerView: "word-tiles",
    controllerLayout: "word_tiles_board",
    supportsTeams: false,
    estimatedRoundDurationMs: 1_200_000,
    roundCompletionMode: "wait_for_ready",
    phaseDurations: {
      roundIntroMs: 1_500,
      countdownMs: 1_000,
      lockedMs: 3_000,
      resultMs: 5_000,
      scoreboardMs: 5_000
    }
  },
  {
    id: "arena-survivor",
    displayName: "Arena Survivor",
    description: "Ueberlebe in der Arena gegen immer neue Gegner.",
    minPlayers: 1,
    maxPlayers: 4,
    hostView: "ArenaSurvivorHostScene",
    controllerView: "arena-survivor",
    controllerLayout: "virtual_joystick",
    supportsTeams: false,
    estimatedRoundDurationMs: 45_000,
    roundCompletionMode: "wait_for_ready",
    phaseDurations: {
      roundIntroMs: 1_500,
      countdownMs: 2_000,
      resultMs: 4_000,
      scoreboardMs: 4_000
    }
  },
  {
    id: "minions-td",
    displayName: "MinionsTD",
    description: "Baue Tower, schicke Minions weiter und halte deine Lane laenger als die anderen.",
    minPlayers: 2,
    maxPlayers: 4,
    hostView: "MinionsTdHostScene",
    controllerView: "minions-td",
    controllerLayout: "tower_defense",
    supportsTeams: false,
    estimatedRoundDurationMs: 180_000,
    phaseDurations: {
      roundIntroMs: 1_800,
      countdownMs: 2_200,
      resultMs: 4_500,
      scoreboardMs: 4_500
    }
  },
  {
    id: "light-trails",
    displayName: "Light Trails",
    description: "Lenke deine Spur durch die Arena und ueberlebe am laengsten.",
    minPlayers: 1,
    maxPlayers: 8,
    hostView: "LightTrailsHostScene",
    controllerView: "light-trails",
    controllerLayout: "left_right_hold",
    supportsTeams: false,
    estimatedRoundDurationMs: 40_000,
    roundCompletionMode: "wait_for_ready",
    phaseDurations: {
      roundIntroMs: 1_500,
      countdownMs: 2_400,
      resultMs: 3_500,
      scoreboardMs: 4_000
    }
  }
] as const satisfies readonly GameManifest[];

export function listGameCatalog(): GameManifest[] {
  return [...gameCatalog];
}

export function getGameManifest(gameId: string): GameManifest | undefined {
  return gameCatalog.find((entry) => entry.id === gameId);
}

export function localizeGameManifest(
  manifest: GameManifest,
  language: SupportedLanguage = defaultLanguage
): GameManifest {
  const text = gameTextById[manifest.id]?.[normalizeLanguage(language)] ?? gameTextById[manifest.id]?.[defaultLanguage];

  if (!text) {
    return manifest;
  }

  return {
    ...manifest,
    displayName: text.displayName,
    description: text.description
  };
}

export function listLocalizedGameCatalog(
  language: SupportedLanguage = defaultLanguage
): GameManifest[] {
  return gameCatalog.map((entry) => localizeGameManifest(entry, language));
}
