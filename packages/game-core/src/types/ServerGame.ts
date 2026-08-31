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
  setupSelections?: Readonly<Record<string, string | string[]>>;
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

  /**
   * Whether a finished round should flow straight into the next one.
   *
   * Only games with a persistent run (survive-and-continue, campaign, best-of)
   * implement this. Returning false actively *blocks* the next round, so a game
   * that simply wants the normal "everyone readies up again" flow must leave
   * this out rather than returning false.
   */
  shouldContinueRun?(state: TState, context: ServerGameContext): boolean;

  /**
   * Builds an incremental host patch relative to the last public state the host
   * received, or null when a full state must be sent instead.
   *
   * Games with large per-tick state implement this to cut bandwidth. The
   * platform used to compute one game's delta itself, which required the
   * broadcaster to know that game's state shape; it now only carries the
   * previous snapshot and hands it back.
   */
  buildHostPatch?(
    state: TPublicState,
    previousState: TPublicState | null,
    context: ServerGameContext
  ): unknown | null;
}
