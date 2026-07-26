import type { BaseRoundState, PlayerInput } from "@open-party-lab/game-core";

export interface BuzzwortCard {
  id: string;
  term: string;
  /** Begriffe, die der Erklaerer nicht sagen darf. */
  forbidden: string[];
  category: string;
  difficulty: 1 | 2 | 3;
}

export type BuzzwortMode = "duel" | "team";

export type BuzzwortTeamId = "team1" | "team2";

/** Ablauf innerhalb eines Zugs. */
export type BuzzwortTurnPhase = "preview" | "active" | "handover";

/** Rolle eines Spielers im aktuellen Zug. */
export type BuzzwortRole = "explainer" | "watcher" | "guesser" | "bench";

export type BuzzwortEventKind = "solved" | "skipped" | "buzz" | "turn_start" | "turn_end";

export interface BuzzwortEvent {
  id: string;
  kind: BuzzwortEventKind;
  at: number;
  term?: string;
  actorName?: string;
  targetName?: string;
  teamId?: BuzzwortTeamId;
  points?: number;
}

export type BuzzwortInputType = "buzzwort_correct" | "buzzwort_skip" | "buzzwort_violation";

export interface BuzzwortInput extends PlayerInput {
  type: BuzzwortInputType;
  pressedAt: number;
  /** Nur im Freien Modus: Wer hat den Begriff erraten? */
  guessedPlayerId?: string;
}

export type BuzzwortHostActionType = "set_mode" | "set_watcher" | "set_turn_duration";

export interface BuzzwortHostAction {
  type: BuzzwortHostActionType;
  mode?: BuzzwortMode;
  watcherEnabled?: boolean;
  turnDurationMs?: number;
}

export interface BuzzwortState extends BaseRoundState {
  mode: BuzzwortMode;
  watcherEnabled: boolean;

  turnPhase: BuzzwortTurnPhase;
  turnPhaseEndsAt: number | null;
  turnDurationMs: number;
  turnEndsAt: number | null;

  turnIndex: number;
  totalTurns: number;
  roundComplete: boolean;

  turnSolved: number;
  turnSkipsUsed: number;
  turnViolations: number;
  maxSkipsPerTurn: number;

  currentTurnPlayerId?: string;
  currentTurnTeamId?: BuzzwortTeamId;
  currentWatcherPlayerId?: string;

  scoreByPlayerId: Record<string, number>;
  scoreByTeamId: Record<BuzzwortTeamId, number>;
  teamByPlayerId: Record<string, BuzzwortTeamId>;
  teamMembersByTeamId: Record<BuzzwortTeamId, string[]>;

  turnOrderPlayerIds: string[];
  teamTurnCursor: Record<BuzzwortTeamId, number>;
  watcherCursor: number;

  cardQueue: BuzzwortCard[];
  currentCard?: BuzzwortCard;
  remainingCards: number;

  solvedTerms: number;
  lastSolvedTerm?: string;
  lastSolverName?: string;
  lastTurnSummary?: string;
  events: BuzzwortEvent[];
}

export interface BuzzwortScoreRow {
  id: string;
  playerId?: string;
  teamId?: BuzzwortTeamId;
  score: number;
  isSelf?: boolean;
  isActive?: boolean;
}

/**
 * Sicht auf den Spielzustand. Das Kartenfeld ist nur fuer Erklaerer und
 * Waechter gefuellt, alle anderen (inklusive Host-Screen) bekommen es nicht.
 */
export interface BuzzwortControllerState {
  mode: BuzzwortMode;
  modeLabel: string;
  watcherEnabled: boolean;

  turnPhase: BuzzwortTurnPhase;
  turnPhaseRemainingMs: number | null;
  turnDurationMs: number;
  turnEndsAt: number | null;
  turnRemainingMs: number | null;

  turnIndex: number;
  totalTurns: number;

  role: BuzzwortRole;
  roleLabel: string;
  isExplainer: boolean;
  isWatcher: boolean;

  card?: {
    term: string;
    forbidden: string[];
    category: string;
    difficulty: 1 | 2 | 3;
  };

  turnSolved: number;
  skipsLeft: number;
  turnViolations: number;

  currentTurnPlayerId?: string;
  currentTurnTeamId?: BuzzwortTeamId;
  currentWatcherPlayerId?: string;
  activeTeamLabel?: string;
  myTeamId?: BuzzwortTeamId;

  scoreByPlayerId: Record<string, number>;
  scoreByTeamId: Record<BuzzwortTeamId, number>;
  teamByPlayerId: Record<string, BuzzwortTeamId>;
  teamMembersByTeamId: Record<BuzzwortTeamId, string[]>;

  guessTargetPlayerIds: string[];
  remainingCards: number;
  solvedTerms: number;
  lastSolvedTerm?: string;
  lastSolverName?: string;
  lastTurnSummary?: string;
  events: BuzzwortEvent[];
}
