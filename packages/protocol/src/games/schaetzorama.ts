import type { BaseRoundState, PlayerInput } from "@open-party-lab/game-core";

export type SchaetzoramaCategoryId = "number" | "percent" | "rank" | "assign";

export type SchaetzoramaAnswerKind = "number" | "rank" | "assign";

export type SchaetzoramaAssignmentZone = "left" | "right" | "both";

export interface SchaetzoramaSource {
  label: string;
  url: string;
}

export interface SchaetzoramaBaseQuestion {
  id: string;
  categoryId: SchaetzoramaCategoryId;
  title: string;
  prompt: string;
  shortLabel: string;
  source: SchaetzoramaSource;
}

export interface SchaetzoramaNumberQuestion extends SchaetzoramaBaseQuestion {
  kind: "number" | "percent";
  min: number;
  max: number;
  answer: number;
  unitLabel?: string;
}

export interface SchaetzoramaRankItem {
  id: string;
  label: string;
}

export interface SchaetzoramaRankQuestion extends SchaetzoramaBaseQuestion {
  kind: "rank";
  directionLabel: string;
  items: SchaetzoramaRankItem[];
  answerOrder: string[];
}

export interface SchaetzoramaAssignQuestion extends SchaetzoramaBaseQuestion {
  kind: "assign";
  leftLabel: string;
  rightLabel: string;
  terms: SchaetzoramaRankItem[];
  answers: Record<string, SchaetzoramaAssignmentZone>;
}

export type SchaetzoramaQuestion =
  | SchaetzoramaNumberQuestion
  | SchaetzoramaRankQuestion
  | SchaetzoramaAssignQuestion;

export type SchaetzoramaPublicQuestion =
  | Omit<SchaetzoramaNumberQuestion, "answer">
  | Omit<SchaetzoramaRankQuestion, "answerOrder">
  | Omit<SchaetzoramaAssignQuestion, "answers">;

export type SchaetzoramaAnswer =
  | {
      kind: "number";
      value: number;
    }
  | {
      kind: "rank";
      order: string[];
    }
  | {
      kind: "assign";
      assignments: Record<string, SchaetzoramaAssignmentZone>;
    };

export type SchaetzoramaAnswerSet = Partial<Record<SchaetzoramaCategoryId, SchaetzoramaAnswer>>;

export type SchaetzoramaJokerKind = "copy";

export interface SchaetzoramaJokerInventory {
  copy: number;
}

export interface SchaetzoramaJokerSelection {
  kind: SchaetzoramaJokerKind;
  categoryId: SchaetzoramaCategoryId;
  targetPlayerId?: string;
}

export type SchaetzoramaJokerPreview = SchaetzoramaJokerSelection;

export interface SchaetzoramaSubmittedAnswerSet {
  answers: SchaetzoramaAnswerSet;
  submittedAt: number;
}

export type SchaetzoramaStage = "answering" | "joker" | "revealed";

export interface SchaetzoramaRoundContent<TQuestion = SchaetzoramaQuestion> {
  roundIndex: number;
  roundLabel: string;
  questions: Record<SchaetzoramaCategoryId, TQuestion>;
}

export interface SchaetzoramaPlayerRoundResult {
  playerId: string;
  name: string;
  color: string;
  answers: SchaetzoramaAnswerSet;
  joker: SchaetzoramaJokerSelection | null;
  categoryScores: Record<SchaetzoramaCategoryId, number>;
  baseCategoryScores: Record<SchaetzoramaCategoryId, number>;
  total: number;
}

export interface SchaetzoramaStanding {
  playerId: string;
  name: string;
  color: string;
  score: number;
  projectedScore: number;
  roundScore: number;
}

export interface SchaetzoramaState extends BaseRoundState {
  stage: SchaetzoramaStage;
  roundContent: SchaetzoramaRoundContent;
  answersByPlayerId: Record<string, SchaetzoramaSubmittedAnswerSet>;
  jokerPreviewByPlayerId: Record<string, SchaetzoramaJokerPreview>;
  jokerByPlayerId: Record<string, SchaetzoramaJokerSelection | null>;
  jokerInventoryByPlayerId: Record<string, SchaetzoramaJokerInventory>;
  answerEndsAt: number | null;
  jokerEndsAt: number | null;
  revealedAt: number | null;
  results: SchaetzoramaPlayerRoundResult[];
}

export interface SchaetzoramaPlayerProgress {
  playerId: string;
  name: string;
  color: string;
  answered: boolean;
  jokerReady: boolean;
}

export interface SchaetzoramaPublicState {
  stage: SchaetzoramaStage;
  roundContent: SchaetzoramaRoundContent<SchaetzoramaPublicQuestion>;
  progress: SchaetzoramaPlayerProgress[];
  answerEndsAt: number | null;
  jokerEndsAt: number | null;
  revealedAt: number | null;
  solutions: SchaetzoramaAnswerSet;
  results: SchaetzoramaPlayerRoundResult[];
  standings: SchaetzoramaStanding[];
}

export interface SchaetzoramaControllerState extends SchaetzoramaPublicState {
  playerId: string;
  ownAnswers: SchaetzoramaAnswerSet;
  ownJokerPreview: SchaetzoramaJokerPreview | null | undefined;
  ownJoker: SchaetzoramaJokerSelection | null | undefined;
  ownInventory: SchaetzoramaJokerInventory;
  canSubmitAnswers: boolean;
  canSubmitJoker: boolean;
  copyTargets: Array<{
    playerId: string;
    name: string;
    answers?: SchaetzoramaAnswerSet;
  }>;
}

export type SchaetzoramaInput =
  | (PlayerInput & {
      type: "submit_answers";
      answers: SchaetzoramaAnswerSet;
    })
  | (PlayerInput & {
      type: "preview_joker";
      joker: SchaetzoramaJokerPreview;
    })
  | (PlayerInput & {
      type: "choose_joker";
      joker: SchaetzoramaJokerSelection | null;
    });
