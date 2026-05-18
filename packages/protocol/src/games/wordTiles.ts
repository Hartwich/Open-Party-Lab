import type { PlayerInput } from "@open-party-lab/game-core";

export type WordTilesBonusType =
  | "normal"
  | "double_letter"
  | "triple_letter"
  | "double_word"
  | "triple_word"
  | "center";

export interface WordTilesPlacedTileState {
  tileId: string;
  letter: string;
  score: number;
  playerId: string;
  isBlank?: boolean;
}

export interface WordTilesBoardCellState {
  x: number;
  y: number;
  bonus: WordTilesBonusType;
  tile: WordTilesPlacedTileState | null;
  recent?: boolean;
}

export interface WordTilesRackTileState {
  id: string;
  letter: string;
  score: number;
  isBlank?: boolean;
}

export interface WordTilesPlayerPublicState {
  playerId: string;
  name: string;
  color: string;
  score: number;
  rackCount: number;
  connected: boolean;
}

export interface WordTilesPlacementState {
  x: number;
  y: number;
  tileId: string;
  letter: string;
  score: number;
  isBlank?: boolean;
}

export interface WordTilesWordScoreState {
  word: string;
  score: number;
  cells: Array<{ x: number; y: number }>;
}

export interface WordTilesMoveSummaryState {
  playerId: string;
  playerName: string;
  score: number;
  words: WordTilesWordScoreState[];
  placements: WordTilesPlacementState[];
  bingo: boolean;
  reason?: string;
}

export interface WordTilesPublicState {
  boardSize: number;
  board: WordTilesBoardCellState[];
  players: WordTilesPlayerPublicState[];
  activePlayerId: string | null;
  activePlayerName: string | null;
  moveNumber: number;
  bagCount: number;
  consecutivePasses: number;
  gameOver: boolean;
  winnerPlayerId?: string;
  winnerName?: string;
  lastMove?: WordTilesMoveSummaryState;
  lastError?: string;
  tileValues: Record<string, number>;
}

export interface WordTilesControllerState extends WordTilesPublicState {
  rack: WordTilesRackTileState[];
  canAct: boolean;
}

export interface WordTilesPlayInput extends PlayerInput {
  type: "word-tiles:play";
  placements: WordTilesPlacementState[];
}

export interface WordTilesPassInput extends PlayerInput {
  type: "word-tiles:pass";
}

export interface WordTilesExchangeInput extends PlayerInput {
  type: "word-tiles:exchange";
  tileIds: string[];
}

export type WordTilesInput = WordTilesPlayInput | WordTilesPassInput | WordTilesExchangeInput;
