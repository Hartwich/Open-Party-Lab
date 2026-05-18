import type { ScoreEntry } from "../scoring/ScoreEntry.js";
import type { BaseRoundState } from "../state/BaseRoundState.js";
import type { SupportedLanguage } from "../i18n/language.js";
import type { GameManifest } from "./GameManifest.js";
import type { PlayerInput } from "./PlayerInput.js";

export interface GamePlayerSummary {
  id: string;
  name: string;
  color: string;
  score: number;
  isReady: boolean;
  connected: boolean;
  selectedCharacterId?: string | null;
}

export interface PreviousRoundContext {
  gameId: string;
  roundNumber: number;
  phase: BaseRoundState["phase"];
  state: unknown;
  updatedAt: number;
}

export interface ServerGameContext {
  roomCode: string;
  roundNumber: number;
  players: GamePlayerSummary[];
  now: number;
  deltaMs: number;
  language: SupportedLanguage;
  selectedGame: GameManifest;
  previousRound: PreviousRoundContext | null;
  roomSettings: Readonly<Record<string, unknown>>;
}

export interface GameHostActionResult<TState extends BaseRoundState = BaseRoundState> {
  state?: TState;
  roomSettings?: Record<string, unknown>;
}

export interface ServerGame<
  TState extends BaseRoundState = BaseRoundState,
  TInput extends PlayerInput = PlayerInput,
  TPublicState = TState
> {
  manifest: GameManifest;
  createInitialState(context: ServerGameContext): TState;
  startRound(state: TState, context: ServerGameContext): TState;
  handleHostAction?(
    state: TState | null,
    action: unknown,
    context: ServerGameContext
  ): GameHostActionResult<TState> | null;
  handleInput(state: TState, input: TInput, context: ServerGameContext): TState;
  tick?(state: TState, deltaMs: number, context: ServerGameContext): TState;
  isRoundFinished(state: TState, context: ServerGameContext): boolean;
  buildScore(state: TState, context: ServerGameContext): ScoreEntry[];
  toPublicState?(state: TState, context: ServerGameContext): TPublicState;
  toControllerState?(state: TState, context: ServerGameContext): TPublicState;
  toControllerStateForPlayer?(
    state: TState,
    context: ServerGameContext,
    playerId: string
  ): TPublicState;
}
