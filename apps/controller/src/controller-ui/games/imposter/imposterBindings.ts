import type { PlayerInput } from "@open-party-lab/game-core";

export interface SubmitImposterClueInput extends PlayerInput {
  type: "submit_clue";
  clue: string;
}

export interface VoteImposterInput extends PlayerInput {
  type: "vote_player";
  suspectPlayerId: string;
}

export interface GuessImposterWordInput extends PlayerInput {
  type: "guess_word";
  guessWord: string;
}

export function createImposterClueInput(playerId: string, clue: string): SubmitImposterClueInput {
  return {
    type: "submit_clue",
    playerId,
    clue,
    sentAt: Date.now()
  };
}

export function createImposterVoteInput(playerId: string, suspectPlayerId: string): VoteImposterInput {
  return {
    type: "vote_player",
    playerId,
    suspectPlayerId,
    sentAt: Date.now()
  };
}

export function createImposterGuessInput(playerId: string, guessWord: string): GuessImposterWordInput {
  return {
    type: "guess_word",
    playerId,
    guessWord,
    sentAt: Date.now()
  };
}
