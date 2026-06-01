import type { GameManifest } from "../types/GameManifest.js";
import { defaultLanguage, normalizeLanguage, type SupportedLanguage } from "../i18n/language.js";
import { gameTextById } from "./i18n/gameTexts.js";

export const gameCatalog = [
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
