import {
  createBaseRoundState,
  roundPhaseDurations,
  transitionRoundState,
  type ScoreEntry,
  type SupportedLanguage,
  type ServerGame
} from "@open-party-lab/game-core";
import { pantomimeManifest } from "../manifest.js";
import type { PantomimeInput, PantomimeState } from "./pantomimeState.js";

const pantomimeRoundDurationMs = 60_000;

const pantomimeTerms = [
  { de: "Flugzeug", en: "Airplane" },
  { de: "Zahnarzt", en: "Dentist" },
  { de: "Kaktus", en: "Cactus" },
  { de: "Einhorn", en: "Unicorn" },
  { de: "Kaffeemaschine", en: "Coffee machine" },
  { de: "Taucher", en: "Diver" },
  { de: "Ritter", en: "Knight" },
  { de: "Achterbahn", en: "Roller coaster" },
  { de: "Koch", en: "Chef" },
  { de: "Gitarrist", en: "Guitarist" },
  { de: "Schneemann", en: "Snowman" },
  { de: "Gespenst", en: "Ghost" }
] as const;

const pantomimeText = {
  de: {
    preparing: "Pantomime wird vorbereitet.",
    unknown: "Unbekannt",
    fallbackPlayer: "Ein Spieler",
    actor: (name: string) => `${name} stellt einen Begriff pantomimisch dar.`,
    timeUp: (term: string) => `Zeit vorbei. Der Begriff war: ${term}`
  },
  en: {
    preparing: "Charades is getting ready.",
    unknown: "Unknown",
    fallbackPlayer: "A player",
    actor: (name: string) => `${name} acts out a secret term.`,
    timeUp: (term: string) => `Time is up. The term was: ${term}`
  }
} satisfies Record<SupportedLanguage, {
  preparing: string;
  unknown: string;
  fallbackPlayer: string;
  actor: (name: string) => string;
  timeUp: (term: string) => string;
}>;

function pickTerm(seed: number, language: SupportedLanguage): string {
  const index = Math.floor(seed % pantomimeTerms.length);
  const term = pantomimeTerms[index] ?? pantomimeTerms[0];
  return term[language];
}

function pickActorIndex(seed: number, playerCount: number): number {
  if (playerCount <= 0) {
    return 0;
  }

  return Math.floor(seed % playerCount);
}

function buildPantomimeScore(state: PantomimeState): ScoreEntry[] {
  return state.actorPlayerId
    ? [{ playerId: state.actorPlayerId, delta: 1, reason: "Pantomime erfolgreich praesentiert" }]
    : [];
}

export const pantomimeServerGame: ServerGame<PantomimeState, PantomimeInput> = {
  manifest: pantomimeManifest,
  createInitialState(context) {
    const text = pantomimeText[context.language];

    return {
      ...createBaseRoundState("round_intro", context.now, {
        durationMs: roundPhaseDurations.roundIntroMs,
        message: text.preparing
      }),
      finishAt: null,
      actorPlayerId: undefined,
      actorName: undefined,
      secretTerm: undefined
    };
  },
  startRound(state, context) {
    const actorIndex = pickActorIndex(context.now, context.players.length);
    const actor = context.players[actorIndex];
    const secretTerm = pickTerm(context.now + context.roundNumber, context.language);
    const text = pantomimeText[context.language];

    return transitionRoundState(
      {
        ...state,
        actorPlayerId: actor?.id,
        actorName: actor?.name ?? text.unknown,
        secretTerm,
        finishAt: context.now + pantomimeRoundDurationMs
      },
      "playing",
      context.now,
      {
        startedAt: context.now,
        message: text.actor(actor?.name ?? text.fallbackPlayer)
      }
    );
  },
  handleInput(state) {
    return state;
  },
  tick(state, _deltaMs, context) {
    if (state.phase !== "playing" || state.finishAt === null || context.now < state.finishAt) {
      return state;
    }

    return transitionRoundState(state, "locked", context.now, {
      durationMs: roundPhaseDurations.lockedMs,
      message: pantomimeText[context.language].timeUp(state.secretTerm ?? "?")
    });
  },
  isRoundFinished(state) {
    return state.phase === "locked";
  },
  buildScore(state) {
    return buildPantomimeScore(state);
  }
};
