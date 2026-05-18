import type { BaseRoundState, PlayerInput } from "@open-party-lab/game-core";

export interface TabuCard {
  id: string;
  term: string;
}

export type TabuMode = "duel" | "team";

export type TabuTeamId = "team1" | "team2";

export interface TabuInput extends PlayerInput {
  type: "tabu_correct";
  pressedAt: number;
  guessedPlayerId?: string;
}

export interface TabuHostAction {
  type: "set_mode";
  mode: TabuMode;
}

export interface TabuState extends BaseRoundState {
  mode: TabuMode;
  solvedTerms: number;
  targetTerms: number;
  lastSolverPlayerId?: string;
  lastSolverName?: string;
  lastSolvedTerm?: string;
  solvedByPlayerId: Record<string, number>;
  solvedByTeamId: Record<TabuTeamId, number>;
  teamByPlayerId: Record<string, TabuTeamId>;
  teamMembersByTeamId: Record<TabuTeamId, string[]>;
  nextTeamExplainerIndexByTeamId: Record<TabuTeamId, number>;
  turnOrderPlayerIds: string[];
  nextDuelExplainerIndex: number;
  currentTurnPlayerId?: string;
  currentTurnTeamId?: TabuTeamId;
  turnDurationMs: number;
  turnEndsAt: number | null;
  turnIndex: number;
  cardQueue: TabuCard[];
  currentCard?: TabuCard;
  remainingCards: number;
}

export interface TabuControllerState {
  mode: TabuMode;
  solvedTerms: number;
  targetTerms: number;
  lastSolverPlayerId?: string;
  lastSolverName?: string;
  lastSolvedTerm?: string;
  solvedByPlayerId: Record<string, number>;
  solvedByTeamId: Record<TabuTeamId, number>;
  teamByPlayerId: Record<string, TabuTeamId>;
  currentTurnPlayerId?: string;
  currentTurnTeamId?: TabuTeamId;
  isExplainer: boolean;
  currentCardTerm?: string;
  turnDurationMs: number;
  turnEndsAt: number | null;
  turnRemainingMs: number | null;
  turnIndex: number;
  guesserPlayerIds: string[];
  activeTeamPlayerIds: string[];
  activeTeamLabel?: string;
  currentModeLabel: string;
  teamScoresByTeamId: Record<TabuTeamId, number>;
  remainingCards: number;
}
