import type { SchaetzoramaAnswerSet, SchaetzoramaInput, SchaetzoramaJokerSelection } from "@open-party-lab/protocol";

export function createSchaetzoramaSubmitInput(
  playerId: string,
  answers: SchaetzoramaAnswerSet
): SchaetzoramaInput {
  return {
    type: "submit_answers",
    playerId,
    answers,
    sentAt: Date.now()
  };
}

export function createSchaetzoramaJokerInput(
  playerId: string,
  joker: SchaetzoramaJokerSelection | null
): SchaetzoramaInput {
  return {
    type: "choose_joker",
    playerId,
    joker,
    sentAt: Date.now()
  };
}

export function createSchaetzoramaPreviewInput(
  playerId: string,
  joker: SchaetzoramaJokerSelection
): SchaetzoramaInput {
  return {
    type: "preview_joker",
    playerId,
    joker,
    sentAt: Date.now()
  };
}
