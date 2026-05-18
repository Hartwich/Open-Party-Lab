import type { SchaetzoramaControllerState, SchaetzoramaJokerSelection } from "@open-party-lab/protocol";
import type { SchaetzoramaLayoutModel } from "../../layouts/models.js";
import type { ControllerGameRenderContext } from "../registry.js";
import { createSchaetzoramaJokerInput, createSchaetzoramaPreviewInput, createSchaetzoramaSubmitInput } from "./schaetzoramaBindings.js";

const germanCategoryLabels = {
  number: "Zahl",
  percent: "Prozent",
  rank: "Ranking",
  assign: "Zuordnung"
} as const;

const englishCategoryLabels = {
  number: "Number",
  percent: "Percent",
  rank: "Ranking",
  assign: "Assign"
} as const;

export function buildSchaetzoramaControllerModel({
  state,
  onInput
}: ControllerGameRenderContext): SchaetzoramaLayoutModel {
  const language = state.room?.language ?? state.preferredLanguage;
  const en = language === "en";
  const playerId = state.player?.id ?? "";
  const guessState = (state.game?.state ?? null) as SchaetzoramaControllerState | null;
  const phase = state.game?.phase ?? "round_intro";
  const stage = guessState?.stage ?? "answering";
  const answered = Boolean(guessState?.ownAnswers && Object.keys(guessState.ownAnswers).length > 0);
  const waitingCount = guessState?.progress.filter((entry) => !entry.answered).length ?? 0;

  return {
    kind: "schaetzorama",
    title: "Schaetzorama",
    subtitle:
      stage === "revealed"
        ? en ? "Results" : "Auswertung"
        : stage === "joker"
          ? en ? "Copy time" : "Abschreiben"
          : answered
            ? en ? "Locked in" : "Eingeloggt"
            : en ? "Set all sliders" : "Alle Regler einstellen",
    helperText:
      stage === "revealed"
        ? en ? "The truth is out. Ready up when everyone is done watching." : "Die Wahrheit ist draussen. Gleich darfst du wieder bereit druecken."
        : stage === "joker"
          ? guessState?.canSubmitJoker
            ? en ? "Choose one player and one task, compare both answers, then decide." : "Waehle Person und Aufgabe, vergleiche beide Antworten und entscheide dann."
            : en ? "Copy choice locked. Waiting for the others." : "Abschreiben entschieden. Warte auf die anderen."
          : answered
            ? en ? `Your panel is locked. Waiting for ${waitingCount}.` : `Dein Pult ist verriegelt. Warte noch auf ${waitingCount}.`
            : en ? "Estimate, sort, assign. Copying opens after everyone locks in." : "Schaetzen, sortieren, zuordnen. Abschreiben oeffnet nach dem Einloggen.",
    disabled: phase !== "playing",
    stage,
    resetKey: `${state.game?.roundNumber ?? 0}:${stage}:${guessState?.roundContent.roundIndex ?? 0}`,
    roundContent: guessState?.roundContent,
    ownAnswers: guessState?.ownAnswers ?? {},
    ownJokerPreview: guessState?.ownJokerPreview,
    ownJoker: guessState?.ownJoker,
    ownInventory: guessState?.ownInventory ?? { copy: 0 },
    copyTargets: guessState?.copyTargets ?? [],
    progress: guessState?.progress ?? [],
    answerEndsAt: guessState?.answerEndsAt ?? null,
    jokerEndsAt: guessState?.jokerEndsAt ?? null,
    solutions: guessState?.solutions ?? {},
    results: guessState?.results ?? [],
    standings: guessState?.standings ?? [],
    categoryLabels: en ? englishCategoryLabels : germanCategoryLabels,
    language,
    canSubmitAnswers: Boolean(guessState?.canSubmitAnswers),
    canSubmitJoker: Boolean(guessState?.canSubmitJoker),
    onSubmitAnswers: (answers) => onInput(createSchaetzoramaSubmitInput(playerId, answers)),
    onPreviewJoker: (joker: SchaetzoramaJokerSelection) => onInput(createSchaetzoramaPreviewInput(playerId, joker)),
    onChooseJoker: (joker: SchaetzoramaJokerSelection | null) => onInput(createSchaetzoramaJokerInput(playerId, joker))
  };
}
