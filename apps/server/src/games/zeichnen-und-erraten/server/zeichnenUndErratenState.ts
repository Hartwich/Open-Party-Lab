import type { BaseRoundState, PlayerInput } from "@open-party-lab/game-core";
import type { ZeichnenUndErratenWordCategory } from "@open-party-lab/protocol";

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  color: string;
  points: DrawingPoint[];
}

export interface GuessEntry {
  playerId: string;
  playerName: string;
  guess: string;
  at: number;
  correct: boolean;
}

export interface DrawStartInput extends PlayerInput {
  type: "draw:start";
  x: number;
  y: number;
}

export interface DrawMoveInput extends PlayerInput {
  type: "draw:move";
  x: number;
  y: number;
}

export interface DrawEndInput extends PlayerInput {
  type: "draw:end";
}

export interface DrawClearInput extends PlayerInput {
  type: "draw:clear";
}

export interface DrawSetColorInput extends PlayerInput {
  type: "draw:set-color";
  color: string;
}

export interface GuessSubmitInput extends PlayerInput {
  type: "guess:submit";
  guess: string;
}

export type ZeichnenUndErratenInput =
  | DrawStartInput
  | DrawMoveInput
  | DrawEndInput
  | DrawClearInput
  | DrawSetColorInput
  | GuessSubmitInput;

export const drawingColorPalette = [
  "#f8fafc",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#a855f7",
  "#ec4899"
] as const;

export interface ZeichnenUndErratenState extends BaseRoundState {
  drawerPlayerId: string;
  drawerName: string;
  secretWord: string;
  wordCategory: ZeichnenUndErratenWordCategory;
  maskedWord: string;
  finishAt: number | null;
  currentColor: string;
  availableColors: readonly string[];
  strokes: DrawingStroke[];
  activeStrokeId: string | null;
  guesses: GuessEntry[];
  winnerPlayerId?: string;
  winnerName?: string;
}

export interface ZeichnenUndErratenPublicState {
  drawerPlayerId: string;
  drawerName: string;
  wordCategory: ZeichnenUndErratenWordCategory;
  maskedWord: string;
  finishAt: number | null;
  currentColor: string;
  availableColors: readonly string[];
  strokes: DrawingStroke[];
  guesses: GuessEntry[];
  winnerPlayerId?: string;
  winnerName?: string;
  revealedWord?: string;
}

export interface ZeichnenUndErratenControllerState extends ZeichnenUndErratenPublicState {
  isDrawer: boolean;
  secretWord?: string;
}
