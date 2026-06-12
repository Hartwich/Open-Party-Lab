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

export interface WordTilesPendingMoveState {
  id: string;
  playerId: string;
  playerName: string;
  score: number;
  words: WordTilesWordScoreState[];
  placements: WordTilesPlacementState[];
  bingo: boolean;
  createdAt: number;
  acceptedByPlayerIds: string[];
  acceptedByNames: string[];
  requiredAcceptancePlayerIds: string[];
  challengedByPlayerId?: string;
  challengedByName?: string;
  challengedAt?: number;
}

export interface WordTilesActiveTurnState {
  playerId: string;
  playerName: string;
  score: number;
  words: WordTilesWordScoreState[];
  placements: WordTilesPlacementState[];
  acceptedMoveCount: number;
  placedTileCount: number;
  bingoEligible: boolean;
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
  pendingMove?: WordTilesPendingMoveState;
  activeTurn?: WordTilesActiveTurnState;
  lastError?: string;
  tileValues: Record<string, number>;
}

export interface WordTilesControllerState extends WordTilesPublicState {
  rack: WordTilesRackTileState[];
  canAct: boolean;
  canAcceptPendingMove: boolean;
  canChallenge: boolean;
  canResolvePendingMove: boolean;
  canRecallPendingMove: boolean;
  canFinishTurn: boolean;
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

export interface WordTilesChallengeInput extends PlayerInput {
  type: "word-tiles:challenge";
  pendingMoveId: string;
}

export interface WordTilesAcceptInput extends PlayerInput {
  type: "word-tiles:accept";
  pendingMoveId: string;
}

export interface WordTilesConfirmInput extends PlayerInput {
  type: "word-tiles:confirm";
  pendingMoveId: string;
}

export interface WordTilesRecallInput extends PlayerInput {
  type: "word-tiles:recall";
  pendingMoveId: string;
}

export interface WordTilesFinishTurnInput extends PlayerInput {
  type: "word-tiles:finish";
}

export type WordTilesInput =
  | WordTilesPlayInput
  | WordTilesPassInput
  | WordTilesExchangeInput
  | WordTilesChallengeInput
  | WordTilesAcceptInput
  | WordTilesConfirmInput
  | WordTilesRecallInput
  | WordTilesFinishTurnInput;
