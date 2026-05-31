import type { ControllerLayoutKey } from "@open-party-lab/game-core";
import type { ControllerAppState } from "../../app/controllerSocketClient.js";
import { buildArenaSurvivorControllerModel } from "./arena-survivor/ArenaSurvivorController.js";
import { buildChaosKommandoControllerModel } from "./chaos-kommando/ChaosKommandoController.js";
import { buildMinionsTdControllerModel } from "./minions-td/MinionsTdController.js";
import {
  createDrawingClearInput,
  createDrawingEndInput,
  createDrawingMoveInput,
  createDrawingStartInput,
  createDrawingSetColorInput,
  createGuessSubmitInput
} from "./zeichnen-und-erraten/zeichnenUndErratenBindings.js";
import { buildDriftRacerControllerModel } from "./drift-racer/DriftRacerController.js";
import { buildWordTilesControllerModel } from "./word-tiles/WordTilesController.js";
import type {
  ControllerLayoutModel,
  DrawingGuessLayoutModel,
  ReadyLayoutModel
} from "../layouts/models.js";
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
