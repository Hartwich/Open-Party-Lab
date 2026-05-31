import type { ControllerLayoutKey } from "@open-party-lab/game-core";
import type { ControllerAppState } from "../../app/controllerSocketClient.js";
import { buildLightTrailsControllerModel } from "./light-trails/LightTrailsController.js";
import { buildArenaSurvivorControllerModel } from "./arena-survivor/ArenaSurvivorController.js";
import { buildChaosKommandoControllerModel } from "./chaos-kommando/ChaosKommandoController.js";
import { buildMinionsTdControllerModel } from "./minions-td/MinionsTdController.js";
import { buildImposterControllerModel } from "./imposter/ImposterController.js";
import { createTabuCorrectInput } from "./tabu/tabuBindings.js";
import {
  createDrawingClearInput,
  createDrawingEndInput,
  createDrawingMoveInput,
  createDrawingStartInput,
  createDrawingSetColorInput,
  createGuessSubmitInput
} from "./zeichnen-und-erraten/zeichnenUndErratenBindings.js";
import { buildDriftRacerControllerModel } from "./drift-racer/DriftRacerController.js";
import { buildSchaetzoramaControllerModel } from "./schaetzorama/SchaetzoramaController.js";
import { buildWordTilesControllerModel } from "./word-tiles/WordTilesController.js";
import type {
  ControllerLayoutModel,
  ChoiceLayoutModel,
  DrawingGuessLayoutModel,
  ReadyLayoutModel,
  SingleButtonLayoutModel
} from "../layouts/models.js";
import type { TabuControllerState } from "@open-party-lab/protocol";
import { getControllerText } from "../../i18n/controllerText.js";
import { externalControllerGameRegistrations } from "./.generated/externalGames.js";

export interface ControllerGameRenderContext {
  state: ControllerAppState;
  onInput: (input: unknown) => void;
  onSetReady?: (isReady: boolean) => void;
}

export interface ControllerGameRegistration {
  id: string;
  layoutKey: ControllerLayoutKey;
  buildLayout(context: ControllerGameRenderContext): ControllerLayoutModel;
}

function buildAutoReadyModel(
  context: ControllerGameRenderContext,
  label?: string
): ReadyLayoutModel | undefined {
  const { state, onSetReady } = context;
  const text = getControllerText(state.room?.language ?? state.preferredLanguage);
  const gameId = state.room?.selectedGameId;
  const selectedGame = gameId ? state.room?.availableGames.find((entry) => entry.id === gameId) : undefined;

  if (
    !selectedGame ||
    selectedGame.roundCompletionMode !== "wait_for_ready" ||
    state.game?.phase !== "finished" ||
    !state.room ||
    !state.player ||
    !onSetReady
  ) {
    return undefined;
  }

  const playerId = state.player.id;
  const currentPlayerReady = Boolean(
    state.room.players.find((player) => player.id === playerId)?.isReady ?? state.player.isReady
  );
  const readyCount = state.room.players.filter((player) => player.isReady).length;
  const playerCount = state.room.players.length;

  return {
    currentPlayerReady,
    readyCount,
    playerCount,
    label: label ?? text.ready,
    description: text.nextRoundDescription(readyCount, playerCount),
    language: state.room.language,
    onToggleReady: () => onSetReady(!currentPlayerReady)
  };
}

function withAutoReady<T extends { ready?: ReadyLayoutModel }>(
  model: T,
  context: ControllerGameRenderContext,
  label?: string
): T {
  if (model.ready) {
    return model;
  }

  const ready = buildAutoReadyModel(context, label);

  if (!ready) {
    return model;
  }

  return {
    ...model,
    ready
  };
}

const internalControllerGameRegistry: Record<string, ControllerGameRegistration> = {
  "drift-racer": {
    id: "drift-racer",
    layoutKey: "racing_controls",
    buildLayout(context) {
      return buildDriftRacerControllerModel(context);
    }
  },
  "arena-survivor": {
    id: "arena-survivor",
    layoutKey: "virtual_joystick",
    buildLayout(context) {
      return buildArenaSurvivorControllerModel(context);
    }
  },
  "chaos-kommando": {
    id: "chaos-kommando",
    layoutKey: "chaos_kommando_controls",
    buildLayout(context) {
      return withAutoReady(
        buildChaosKommandoControllerModel(context),
        context,
        context.state.room?.language === "en" ? "Next Match" : "Naechstes Match"
      );
    }
  },
  "minions-td": {
    id: "minions-td",
    layoutKey: "tower_defense",
    buildLayout(context) {
      return buildMinionsTdControllerModel(context);
    }
  },
  "light-trails": {
    id: "light-trails",
    layoutKey: "left_right_hold",
    buildLayout(context) {
      return buildLightTrailsControllerModel(context);
    }
  },
  tabu: {
    id: "tabu",
    layoutKey: "choice",
    buildLayout(context) {
      const { state, onInput } = context;
      const text = getControllerText(state.room?.language ?? state.preferredLanguage);
      const en = state.room?.language === "en";
      const playerId = state.player?.id ?? "";
      const tabuState = (state.game?.state ?? {}) as TabuControllerState;
      const playerNames = new Map((state.room?.players ?? []).map((player) => [player.id, player.name]));
      const currentTurnPlayerId = tabuState.currentTurnPlayerId;
      const currentTurnPlayerName = currentTurnPlayerId
        ? playerNames.get(currentTurnPlayerId) ?? currentTurnPlayerId
        : undefined;
      const currentTurnTeamId =
        tabuState.currentTurnTeamId ?? (currentTurnPlayerId ? tabuState.teamByPlayerId[currentTurnPlayerId] : undefined);
      const currentTurnTeamLabel =
        currentTurnTeamId === "team1" ? "Team 1" : currentTurnTeamId === "team2" ? "Team 2" : undefined;
      const solved = tabuState.solvedTerms ?? 0;
      const target = tabuState.targetTerms ?? 10;
      const isExplainer = tabuState.currentTurnPlayerId === playerId;
      const currentTerm = isExplainer ? tabuState.currentCardTerm ?? (en ? "Waiting for the first term" : "Warte auf den Startbegriff") : undefined;
      const remainingSeconds =
        tabuState.turnRemainingMs !== null ? Math.max(0, Math.ceil(tabuState.turnRemainingMs / 1000)) : null;
      const choices: ChoiceLayoutModel["choices"] = [];

      if (isExplainer && tabuState.mode === "duel") {
        for (const otherPlayer of state.room?.players ?? []) {
          if (otherPlayer.id === playerId) {
            continue;
          }

          choices.push({
            id: `tabu:duel:${otherPlayer.id}`,
            label: otherPlayer.name,
            description: en ? "Guessed the word" : "Hat das Wort erraten",
            disabled: state.game?.phase !== "playing",
            onSelect: () => onInput(createTabuCorrectInput(playerId, otherPlayer.id))
          });
        }
      }

      if (isExplainer && tabuState.mode === "team") {
        choices.push({
          id: "tabu:team:solved",
          label: en ? "Solved" : "Geloest",
          description: en ? "Your team guessed the word" : "Euer Team hat das Wort geschafft",
          disabled: state.game?.phase !== "playing",
          onSelect: () => onInput(createTabuCorrectInput(playerId))
        });
      }

      const model: ChoiceLayoutModel = {
        kind: "choice",
        title: "Tabu",
        subtitle:
          tabuState.mode === "team"
            ? `${tabuState.currentModeLabel} | ${currentTurnTeamLabel ?? "Team"}: ${currentTurnPlayerName ?? text.unknown}`
            : `${tabuState.currentModeLabel} | ${en ? "Explainer" : "Erklaerer"}: ${currentTurnPlayerName ?? text.unknown}`,
        helperText: isExplainer
          ? tabuState.mode === "team"
            ? currentTerm
              ? `${currentTerm}\n${en ? "Tap Solved once your team guessed the word." : "Tippe auf Geloest, wenn euer Team das Wort geschafft hat."}`
              : en ? "Tap Solved once your team guessed the word." : "Tippe auf Geloest, wenn euer Team das Wort geschafft hat."
            : currentTerm
              ? `${en ? "Word" : "Wort"}: ${currentTerm}\n${en ? "Choose the player who guessed the word." : "Waehle den Spieler, der das Wort erraten hat."}`
              : en ? "Choose the player who guessed the word." : "Waehle den Spieler, der das Wort erraten hat."
          : currentTurnPlayerName
            ? `${en ? "Waiting for" : "Warte auf"} ${currentTurnPlayerName}.`
            : en ? "Waiting for the explaining player." : "Warte auf die erklaerende Person.",
        disabled: state.game?.phase !== "playing" || !isExplainer,
        choices,
        stats: [
          {
            label: en ? "Progress" : "Fortschritt",
            value: `${solved}/${target}`
          },
          {
            label: en ? "Cards left" : "Karten uebrig",
            value: `${tabuState.remainingCards ?? 0}`
          },
          {
            label: en ? "Mode" : "Modus",
            value: tabuState.currentModeLabel
          },
          {
            label: en ? "Time" : "Zeit",
            value: remainingSeconds !== null ? `${remainingSeconds}s` : "-"
          },
          {
            label: en ? "Role" : "Rolle",
            value: isExplainer ? (en ? "Explainer" : "Erklaerer") : (en ? "Viewer" : "Zuschauer")
          },
          {
            label: "Team",
            value: currentTurnTeamLabel ?? "-"
          }
        ],
      };
      return withAutoReady(model, context);
    }
  },
  imposter: {
    id: "imposter",
    layoutKey: "choice",
    buildLayout(context) {
      return withAutoReady(buildImposterControllerModel(context), context);
    }
  },
  "zeichnen-und-erraten": {
    id: "zeichnen-und-erraten",
    layoutKey: "drawing_guess",
    buildLayout(context) {
      const { state, onInput } = context;
      const text = getControllerText(state.room?.language ?? state.preferredLanguage);
      const en = state.room?.language === "en";
      const playerId = state.player?.id ?? "";
      const drawState = (state.game?.state ?? {}) as {
        isDrawer?: boolean;
        maskedWord?: string;
        secretWord?: string;
        currentColor?: string;
        availableColors?: string[];
        strokes?: Array<{ id: string; color: string; points: Array<{ x: number; y: number }> }>;
        guesses?: Array<{ playerName: string; guess: string; correct: boolean }>;
        winnerName?: string;
      };

      const model: DrawingGuessLayoutModel = {
        kind: "drawing_guess",
        title: state.room?.availableGames.find((game) => game.id === "zeichnen-und-erraten")?.displayName ?? (en ? "Draw & Guess" : "Zeichnen & Erraten"),
        subtitle: text.formatPhase(state.game?.phase),
        helperText: state.game?.message ?? (en ? "One player draws while the others guess." : "Ein Spieler zeichnet, die anderen raten."),
        language: state.room?.language,
        disabled: state.game?.phase !== "playing",
        guessResetKey: `${state.game?.roundNumber ?? 0}:${state.game?.phase ?? "idle"}:${drawState.maskedWord ?? ""}`,
        isDrawer: Boolean(drawState.isDrawer),
        wordMask: drawState.maskedWord ?? "_ _ _",
        secretWord: drawState.secretWord,
        currentColor: drawState.currentColor,
        availableColors: drawState.availableColors,
        strokes: (drawState.strokes ?? []).map((stroke) => ({
          ...stroke,
          color: stroke.color ?? "#f8fafc"
        })),
        guessFeed: drawState.guesses ?? [],
        winnerName: drawState.winnerName,
        onDrawStart: (x, y) => onInput(createDrawingStartInput(playerId, x, y)),
        onDrawMove: (x, y) => onInput(createDrawingMoveInput(playerId, x, y)),
        onDrawEnd: () => onInput(createDrawingEndInput(playerId)),
        onClearDrawing: () => onInput(createDrawingClearInput(playerId)),
        onSelectColor: (color) => onInput(createDrawingSetColorInput(playerId, color)),
        onSubmitGuess: (guess) => onInput(createGuessSubmitInput(playerId, guess))
      };
      return withAutoReady(model, context);
    }
  },
  schaetzorama: {
    id: "schaetzorama",
    layoutKey: "schaetzorama",
    buildLayout(context) {
      return withAutoReady(buildSchaetzoramaControllerModel(context), context);
    }
  },
  "word-tiles": {
    id: "word-tiles",
    layoutKey: "word_tiles_board",
    buildLayout(context) {
      return withAutoReady(
        buildWordTilesControllerModel(context),
        context,
        context.state.room?.language === "en" ? "Next Word Tiles Round" : "Naechste Word-Tiles-Runde"
      );
    }
  }
};

export const controllerGameRegistry: Record<string, ControllerGameRegistration> = {
  ...internalControllerGameRegistry,
  ...Object.fromEntries(externalControllerGameRegistrations.map((registration) => [registration.id, registration]))
};
