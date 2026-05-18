import {
  createBaseRoundState,
  roundPhaseDurations,
  transitionRoundState,
  type ServerGame,
  type ServerGameContext
} from "@open-party-lab/game-core";
import { shuffle } from "@open-party-lab/utils";
import type {
  TabuControllerState,
  TabuHostAction,
  TabuInput,
  TabuMode,
  TabuState,
  TabuTeamId
} from "@open-party-lab/protocol";
import { tabuManifest } from "../manifest.js";
import { buildTabuScoreEntries } from "./tabuScoring.js";
import { tabuCards } from "./content/tabuCards.js";

const DEFAULT_TARGET_TERMS = 10;
const DUEL_TURN_DURATION_MS = 15_000;
const TEAM_TURN_DURATION_MS = 30_000;
const TABU_MODE_ROOM_SETTING_KEY = "tabu_mode";

type PlayerSummary = ServerGameContext["players"][number];

function resolveMode(roomSettings: Readonly<Record<string, unknown>>): TabuMode {
  return roomSettings[TABU_MODE_ROOM_SETTING_KEY] === "team" ? "team" : "duel";
}

function resolveModeLabel(mode: TabuMode, en = false): string {
  return mode === "team" ? (en ? "Team Mode" : "Teammodus") : en ? "Free-for-all" : "Jeder gegen jeden";
}

function resolveTeamLabel(teamId: TabuTeamId): string {
  return teamId === "team1" ? "Team 1" : "Team 2";
}

function getPlayerName(players: readonly PlayerSummary[], playerId?: string): string {
  if (!playerId) {
    return "Unbekannt";
  }

  return players.find((player) => player.id === playerId)?.name ?? "Unbekannt";
}

function buildTurnOrder(players: readonly PlayerSummary[]): string[] {
  return players.map((player) => player.id);
}

function resolveNextPlayerId(playerOrder: readonly string[], currentPlayerId?: string): string | undefined {
  if (playerOrder.length === 0) {
    return undefined;
  }

  if (!currentPlayerId) {
    return playerOrder[0];
  }

  const currentIndex = playerOrder.indexOf(currentPlayerId);

  if (currentIndex === -1) {
    return playerOrder[0];
  }

  return playerOrder[(currentIndex + 1) % playerOrder.length];
}

function buildTeamAssignments(players: readonly PlayerSummary[]): {
  teamByPlayerId: Record<string, TabuTeamId>;
  teamMembersByTeamId: Record<TabuTeamId, string[]>;
} {
  const teamMembersByTeamId: Record<TabuTeamId, string[]> = {
    team1: [],
    team2: []
  };
  const teamByPlayerId: Record<string, TabuTeamId> = {};

  players.forEach((player, index) => {
    const teamId: TabuTeamId = index % 2 === 0 ? "team1" : "team2";
    teamByPlayerId[player.id] = teamId;
    teamMembersByTeamId[teamId].push(player.id);
  });

  return { teamByPlayerId, teamMembersByTeamId };
}

function resolveTeamExplainerId(
  teamMembersByTeamId: Record<TabuTeamId, string[]>,
  teamId: TabuTeamId,
  nextTeamExplainerIndexByTeamId: Record<TabuTeamId, number>,
  players: readonly PlayerSummary[]
): string | undefined {
  const orderedMembers = teamMembersByTeamId[teamId].filter((playerId) =>
    players.some((player) => player.id === playerId)
  );

  if (orderedMembers.length === 0) {
    return players[0]?.id;
  }

  const nextIndex = nextTeamExplainerIndexByTeamId[teamId] ?? 0;
  return orderedMembers[nextIndex % orderedMembers.length];
}

function resolveCurrentTurnTeamId(state: TabuState): TabuTeamId | undefined {
  if (state.currentTurnTeamId) {
    return state.currentTurnTeamId;
  }

  if (!state.currentTurnPlayerId) {
    return undefined;
  }

  return state.teamByPlayerId[state.currentTurnPlayerId];
}

function resolveTurnRemainingMs(state: TabuState, now: number): number | null {
  if (state.turnEndsAt === null) {
    return null;
  }

  return Math.max(0, state.turnEndsAt - now);
}

function buildCommonControllerState(
  state: TabuState,
  context: ServerGameContext,
  playerId: string
): TabuControllerState {
  const currentTurnTeamId = resolveCurrentTurnTeamId(state);
  const isExplainer = state.currentTurnPlayerId === playerId;
  const activeTeamPlayerIds = currentTurnTeamId ? state.teamMembersByTeamId[currentTurnTeamId] ?? [] : [];
  const turnRemainingMs = resolveTurnRemainingMs(state, context.now);

  return {
    mode: state.mode,
    solvedTerms: state.solvedTerms,
    targetTerms: state.targetTerms,
    lastSolverPlayerId: state.lastSolverPlayerId,
    lastSolverName: state.lastSolverName,
    lastSolvedTerm: state.lastSolvedTerm,
    solvedByPlayerId: state.solvedByPlayerId,
    solvedByTeamId: state.solvedByTeamId,
    teamByPlayerId: state.teamByPlayerId,
    currentTurnPlayerId: state.currentTurnPlayerId,
    currentTurnTeamId,
    isExplainer,
    currentCardTerm: isExplainer && state.currentCard ? state.currentCard.term : undefined,
    turnDurationMs: state.turnDurationMs,
    turnEndsAt: state.turnEndsAt,
    turnRemainingMs,
    turnIndex: state.turnIndex,
    guesserPlayerIds:
      state.mode === "duel" && isExplainer
        ? context.players
            .map((player) => player.id)
            .filter((candidate) => candidate !== playerId)
        : [],
    activeTeamPlayerIds,
    activeTeamLabel: currentTurnTeamId ? resolveTeamLabel(currentTurnTeamId) : undefined,
    currentModeLabel: resolveModeLabel(state.mode, context.language === "en"),
    teamScoresByTeamId: state.solvedByTeamId,
    remainingCards: state.remainingCards
  };
}

function buildPublicState(state: TabuState, now: number, en = false): TabuControllerState {
  return {
    mode: state.mode,
    solvedTerms: state.solvedTerms,
    targetTerms: state.targetTerms,
    lastSolverPlayerId: state.lastSolverPlayerId,
    lastSolverName: state.lastSolverName,
    lastSolvedTerm: state.lastSolvedTerm,
    solvedByPlayerId: state.solvedByPlayerId,
    solvedByTeamId: state.solvedByTeamId,
    teamByPlayerId: state.teamByPlayerId,
    currentTurnPlayerId: state.currentTurnPlayerId,
    currentTurnTeamId: state.currentTurnTeamId,
    isExplainer: false,
    currentCardTerm: undefined,
    turnDurationMs: state.turnDurationMs,
    turnEndsAt: state.turnEndsAt,
    turnRemainingMs: resolveTurnRemainingMs(state, now),
    turnIndex: state.turnIndex,
    guesserPlayerIds: [],
    activeTeamPlayerIds: [],
    activeTeamLabel: state.currentTurnTeamId ? resolveTeamLabel(state.currentTurnTeamId) : undefined,
    currentModeLabel: resolveModeLabel(state.mode, en),
    teamScoresByTeamId: state.solvedByTeamId,
    remainingCards: state.remainingCards
  };
}

function createNextTurnState(
  state: TabuState,
  context: ServerGameContext,
  nextCardQueue: typeof state.cardQueue,
  nextCard: typeof state.currentCard | undefined,
  options: {
    solved?: boolean;
    solvedPlayerId?: string;
    solvedPlayerName?: string;
    solvedTeamId?: TabuTeamId;
    advanceTeamTurn?: boolean;
    timeout?: boolean;
  }
): TabuState {
  const mode = state.mode;
  const currentTurnTeamId = resolveCurrentTurnTeamId(state);
  const teamMode = mode === "team";
  const hasNextCard = Boolean(nextCard);
  const currentTurnDurationMs = teamMode ? TEAM_TURN_DURATION_MS : DUEL_TURN_DURATION_MS;
  const turnAdvanced = teamMode ? options.advanceTeamTurn || options.timeout || !options.solved : true;
  const en = context.language === "en";
  const fallbackPlayer = en ? "A player" : "Ein Spieler";
  const fallbackTerm = en ? "a term" : "einen Begriff";
  const noCardsMessage = en ? "No Taboo cards available." : "Keine Tabu-Karten mehr verfuegbar.";
  let currentTurnPlayerId = state.currentTurnPlayerId;
  let currentTurnTeamIdNext = currentTurnTeamId;
  let nextTeamExplainerIndexByTeamId = { ...state.nextTeamExplainerIndexByTeamId };
  let nextDuelExplainerIndex = state.nextDuelExplainerIndex;

  if (teamMode) {
    if (options.advanceTeamTurn || options.timeout || !options.solved) {
      const nextTeamId: TabuTeamId = currentTurnTeamId === "team1" ? "team2" : "team1";
      currentTurnTeamIdNext = nextTeamId;
      currentTurnPlayerId = resolveTeamExplainerId(
        state.teamMembersByTeamId,
        nextTeamId,
        nextTeamExplainerIndexByTeamId,
        context.players
      );
      nextTeamExplainerIndexByTeamId = {
        ...nextTeamExplainerIndexByTeamId,
        [nextTeamId]: (nextTeamExplainerIndexByTeamId[nextTeamId] ?? 0) + 1
      };
    }
  } else {
    currentTurnPlayerId = resolveNextPlayerId(
      state.turnOrderPlayerIds,
      currentTurnPlayerId ?? state.turnOrderPlayerIds[0]
    );
    currentTurnTeamIdNext = undefined;
    nextDuelExplainerIndex += 1;
  }

  const nextState: TabuState = {
    ...state,
    solvedTerms: options.solved ? state.solvedTerms + 1 : state.solvedTerms,
    lastSolverPlayerId: options.solved ? options.solvedPlayerId : state.lastSolverPlayerId,
    lastSolverName: options.solved ? options.solvedPlayerName : state.lastSolverName,
    lastSolvedTerm: options.solved ? state.currentCard?.term : state.lastSolvedTerm,
    solvedByPlayerId:
      options.solved && options.solvedPlayerId
        ? {
            ...state.solvedByPlayerId,
            [options.solvedPlayerId]: (state.solvedByPlayerId[options.solvedPlayerId] ?? 0) + 1
          }
        : state.solvedByPlayerId,
    solvedByTeamId:
      options.solved && options.solvedTeamId
        ? {
            ...state.solvedByTeamId,
            [options.solvedTeamId]: (state.solvedByTeamId[options.solvedTeamId] ?? 0) + 1
          }
        : state.solvedByTeamId,
    currentTurnPlayerId,
    currentTurnTeamId: currentTurnTeamIdNext,
    turnDurationMs: turnAdvanced ? currentTurnDurationMs : state.turnDurationMs,
    turnEndsAt: hasNextCard ? (turnAdvanced ? context.now + currentTurnDurationMs : state.turnEndsAt) : null,
    turnIndex: turnAdvanced ? state.turnIndex + 1 : state.turnIndex,
    cardQueue: nextCardQueue,
    currentCard: nextCard,
    remainingCards: Math.max(nextCardQueue.length - 1, 0),
    nextTeamExplainerIndexByTeamId,
    nextDuelExplainerIndex
  };

  if (teamMode && options.solved && options.solvedTeamId) {
    nextState.message = en
      ? `${options.solvedPlayerName ?? fallbackPlayer} solved a term for ${resolveTeamLabel(options.solvedTeamId)}. More terms can follow in the same turn.`
      : `${options.solvedPlayerName ?? fallbackPlayer} hat einen Begriff fuer ${resolveTeamLabel(options.solvedTeamId)} geloest. Weitere Begriffe koennen im selben Zug folgen.`;
    return nextState;
  }

  if (teamMode && (options.timeout || options.advanceTeamTurn)) {
    nextState.message = hasNextCard
      ? en
        ? `${resolveTeamLabel(currentTurnTeamIdNext ?? "team1")} is now up with ${getPlayerName(context.players, currentTurnPlayerId)}.`
        : `${resolveTeamLabel(currentTurnTeamIdNext ?? "team1")} ist jetzt mit ${getPlayerName(context.players, currentTurnPlayerId)} dran.`
      : noCardsMessage;
    return nextState;
  }

  if (!teamMode && options.solved) {
    nextState.message = hasNextCard
      ? en
        ? `${options.solvedPlayerName ?? fallbackPlayer} solved "${state.currentCard?.term ?? fallbackTerm}". Next explainer: ${getPlayerName(context.players, currentTurnPlayerId)}.`
        : `${options.solvedPlayerName ?? fallbackPlayer} hat "${state.currentCard?.term ?? fallbackTerm}" geloest. Naechster Erklaerer: ${getPlayerName(context.players, currentTurnPlayerId)}.`
      : en
        ? `${options.solvedPlayerName ?? fallbackPlayer} solved the last term.`
        : `${options.solvedPlayerName ?? fallbackPlayer} hat den letzten Begriff geloest.`;
    return nextState;
  }

  if (!teamMode && options.timeout) {
    nextState.message = hasNextCard
      ? en
        ? `${getPlayerName(context.players, currentTurnPlayerId)} explains next.`
        : `${getPlayerName(context.players, currentTurnPlayerId)} erklaert als Naechstes.`
      : noCardsMessage;
    return nextState;
  }

  nextState.message = hasNextCard
    ? en ? `${resolveModeLabel(mode, true)} continues.` : `${resolveModeLabel(mode)} laeuft weiter.`
    : noCardsMessage;
  return nextState;
}

function advanceOnSolve(state: TabuState, input: TabuInput, context: ServerGameContext): TabuState {
  const remainingQueue = state.cardQueue.slice(1);
  const nextCard = remainingQueue[0];

  if (state.mode === "team") {
    const activeTeamId = resolveCurrentTurnTeamId(state);

    if (!activeTeamId || state.currentTurnPlayerId !== input.playerId) {
      return state;
    }

    const playerName = getPlayerName(context.players, input.playerId);
    return createNextTurnState(state, context, remainingQueue, nextCard, {
      solved: true,
      solvedPlayerId: input.playerId,
      solvedPlayerName: playerName,
      solvedTeamId: activeTeamId,
      advanceTeamTurn: false
    });
  }

  if (state.currentTurnPlayerId !== input.playerId) {
    return state;
  }

  if (!input.guessedPlayerId || input.guessedPlayerId === input.playerId) {
    return state;
  }

  const guessedPlayer = context.players.find((player) => player.id === input.guessedPlayerId);

  if (!guessedPlayer) {
    return state;
  }

  return createNextTurnState(state, context, remainingQueue, nextCard, {
    solved: true,
    solvedPlayerId: guessedPlayer.id,
    solvedPlayerName: guessedPlayer.name
  });
}

function advanceOnTimeout(state: TabuState, context: ServerGameContext): TabuState {
  const remainingQueue = state.cardQueue.slice(1);
  const nextCard = remainingQueue[0];

  if (state.mode === "team") {
    return createNextTurnState(state, context, remainingQueue, nextCard, {
      timeout: true,
      advanceTeamTurn: true
    });
  }

  return createNextTurnState(state, context, remainingQueue, nextCard, {
    timeout: true
  });
}

function resolveInitialTeamTurn(
  state: TabuState,
  context: ServerGameContext
): Pick<TabuState, "currentTurnPlayerId" | "currentTurnTeamId" | "nextTeamExplainerIndexByTeamId"> {
  const nextTeamExplainerIndexByTeamId = { ...state.nextTeamExplainerIndexByTeamId };
  const currentTurnTeamId: TabuTeamId = "team1";
  const currentTurnPlayerId = resolveTeamExplainerId(
    state.teamMembersByTeamId,
    currentTurnTeamId,
    nextTeamExplainerIndexByTeamId,
    context.players
  );

  nextTeamExplainerIndexByTeamId.team1 = (nextTeamExplainerIndexByTeamId.team1 ?? 0) + 1;

  return {
    currentTurnPlayerId,
    currentTurnTeamId,
    nextTeamExplainerIndexByTeamId
  };
}

function resolveInitialDuelTurn(
  state: TabuState,
  context: ServerGameContext
): Pick<TabuState, "currentTurnPlayerId" | "currentTurnTeamId" | "nextDuelExplainerIndex"> {
  const nextDuelExplainerIndex = state.nextDuelExplainerIndex;
  const currentTurnPlayerId =
    state.turnOrderPlayerIds.length > 0
      ? state.turnOrderPlayerIds[nextDuelExplainerIndex % state.turnOrderPlayerIds.length]
      : context.players[0]?.id;

  return {
    currentTurnPlayerId,
    currentTurnTeamId: undefined,
    nextDuelExplainerIndex: nextDuelExplainerIndex + 1
  };
}

export const tabuServerGame: ServerGame<TabuState, TabuInput, TabuControllerState> = {
  manifest: tabuManifest,
  createInitialState(context) {
    const mode = resolveMode(context.roomSettings);

    return {
      ...createBaseRoundState("round_intro", context.now, {
        durationMs: roundPhaseDurations.roundIntroMs,
        message: context.language === "en" ? "Preparing Taboo." : "Tabu wird vorbereitet."
      }),
      mode,
      solvedTerms: 0,
      targetTerms: DEFAULT_TARGET_TERMS,
      lastSolverPlayerId: undefined,
      lastSolverName: undefined,
      lastSolvedTerm: undefined,
      solvedByPlayerId: {},
      solvedByTeamId: {
        team1: 0,
        team2: 0
      },
      teamByPlayerId: {},
      teamMembersByTeamId: {
        team1: [],
        team2: []
      },
      nextTeamExplainerIndexByTeamId: {
        team1: 0,
        team2: 0
      },
      turnOrderPlayerIds: [],
      nextDuelExplainerIndex: 0,
      currentTurnPlayerId: undefined,
      currentTurnTeamId: undefined,
      turnDurationMs: mode === "team" ? TEAM_TURN_DURATION_MS : DUEL_TURN_DURATION_MS,
      turnEndsAt: null,
      turnIndex: 0,
      cardQueue: [],
      currentCard: undefined,
      remainingCards: 0
    };
  },
  handleHostAction(_state, action, _context) {
    const hostAction = action as Partial<TabuHostAction> | null;

    if (hostAction?.type !== "set_mode" || (hostAction.mode !== "duel" && hostAction.mode !== "team")) {
      return {};
    }

    return {
      roomSettings: {
        [TABU_MODE_ROOM_SETTING_KEY]: hostAction.mode
      }
    };
  },
  startRound(state, context) {
    const mode = resolveMode(context.roomSettings);
    const cardQueue = shuffle(tabuCards);
    const targetTerms = Math.min(DEFAULT_TARGET_TERMS, cardQueue.length);
    const teamAssignments = buildTeamAssignments(context.players);
    const turnOrderPlayerIds = buildTurnOrder(context.players);
    let currentTurnPlayerId: string | undefined;
    let currentTurnTeamId: TabuTeamId | undefined;
    let nextTeamExplainerIndexByTeamId: Record<TabuTeamId, number>;
    let nextDuelExplainerIndex: number;

    if (mode === "team") {
      const teamState = resolveInitialTeamTurn(
        {
          ...state,
          mode,
          solvedByTeamId: {
            team1: 0,
            team2: 0
          },
          teamByPlayerId: teamAssignments.teamByPlayerId,
          teamMembersByTeamId: teamAssignments.teamMembersByTeamId,
          nextTeamExplainerIndexByTeamId: {
            team1: 0,
            team2: 0
          },
          turnOrderPlayerIds,
          nextDuelExplainerIndex: 0
        },
        context
      );
      currentTurnPlayerId = teamState.currentTurnPlayerId;
      currentTurnTeamId = teamState.currentTurnTeamId;
      nextTeamExplainerIndexByTeamId = teamState.nextTeamExplainerIndexByTeamId;
      nextDuelExplainerIndex = 0;
    } else {
      const duelState = resolveInitialDuelTurn(
        {
          ...state,
          mode,
          teamByPlayerId: {},
          teamMembersByTeamId: {
            team1: [],
            team2: []
          },
          nextTeamExplainerIndexByTeamId: {
            team1: 0,
            team2: 0
          },
          turnOrderPlayerIds,
          nextDuelExplainerIndex: state.nextDuelExplainerIndex
        },
        context
      );
      currentTurnPlayerId = duelState.currentTurnPlayerId;
      currentTurnTeamId = duelState.currentTurnTeamId;
      nextTeamExplainerIndexByTeamId = {
        team1: 0,
        team2: 0
      };
      nextDuelExplainerIndex = duelState.nextDuelExplainerIndex;
    }
    const currentCard = cardQueue[0];
    const turnDurationMs = mode === "team" ? TEAM_TURN_DURATION_MS : DUEL_TURN_DURATION_MS;
    const en = context.language === "en";
    const startMessage = currentCard
      ? mode === "team"
        ? en
          ? `Taboo in ${resolveModeLabel(mode, true)}. ${resolveTeamLabel("team1")} starts with ${getPlayerName(context.players, currentTurnPlayerId)}.`
          : `Tabu im ${resolveModeLabel(mode)}. ${resolveTeamLabel("team1")} beginnt mit ${getPlayerName(context.players, currentTurnPlayerId)}.`
        : en
          ? `Taboo in ${resolveModeLabel(mode, true)}. ${getPlayerName(context.players, currentTurnPlayerId)} starts.`
          : `Tabu im ${resolveModeLabel(mode)}. ${getPlayerName(context.players, currentTurnPlayerId)} beginnt.`
      : en ? "No Taboo cards available." : "Keine Tabu-Karten verfuegbar.";

    return transitionRoundState(
      {
        ...state,
        mode,
        solvedTerms: 0,
        targetTerms,
        lastSolverPlayerId: undefined,
        lastSolverName: undefined,
        lastSolvedTerm: undefined,
        solvedByPlayerId: {},
        solvedByTeamId: {
          team1: 0,
          team2: 0
        },
        teamByPlayerId: teamAssignments.teamByPlayerId,
        teamMembersByTeamId: teamAssignments.teamMembersByTeamId,
        nextTeamExplainerIndexByTeamId,
        turnOrderPlayerIds,
        nextDuelExplainerIndex,
        currentTurnPlayerId,
        currentTurnTeamId,
        turnDurationMs,
        turnEndsAt: currentCard ? context.now + turnDurationMs : null,
        turnIndex: 0,
        cardQueue,
        currentCard,
        remainingCards: Math.max(cardQueue.length - 1, 0),
        message: startMessage
      },
      "playing",
      context.now,
      {
        startedAt: context.now,
        message: startMessage
      }
    );
  },
  handleInput(state, input, context) {
    if (state.phase !== "playing" || !state.currentCard) {
      return state;
    }

    if (input.type !== "tabu_correct") {
      return state;
    }

    return advanceOnSolve(state, input, context);
  },
  tick(state, _deltaMs, context) {
    if (state.phase !== "playing" || !state.currentCard || state.turnEndsAt === null) {
      return state;
    }

    if (context.now < state.turnEndsAt) {
      return state;
    }

    return advanceOnTimeout(state, context);
  },
  isRoundFinished(state) {
    return state.phase === "playing" && (state.solvedTerms >= state.targetTerms || !state.currentCard);
  },
  buildScore(state) {
    return buildTabuScoreEntries({
      mode: state.mode,
      solvedByPlayerId: state.solvedByPlayerId,
      solvedByTeamId: state.solvedByTeamId,
      teamMembersByTeamId: state.teamMembersByTeamId
    });
  },
  toPublicState(state, context) {
    return buildPublicState(state, context.now, context.language === "en");
  },
  toControllerStateForPlayer(state, context, playerId) {
    return buildCommonControllerState(state, context, playerId);
  }
};
