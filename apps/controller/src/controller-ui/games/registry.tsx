import type { ControllerLayoutKey } from "@open-party-lab/game-core";
import type { ControllerAppState } from "../../app/controllerSocketClient.js";
import type {
  ControllerLayoutModel,
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

function withAutoReady(
  model: ControllerLayoutModel,
  context: ControllerGameRenderContext,
  label?: string
): ControllerLayoutModel {
  if ("ready" in model && model.ready) {
    return model;
  }

  const ready = buildAutoReadyModel(context, label);

  if (!ready) {
    return model;
  }

  return {
    ...model,
    ready
  } as ControllerLayoutModel;
}

export const controllerGameRegistry: Record<string, ControllerGameRegistration> = {
  ...Object.fromEntries(
    externalControllerGameRegistrations.map((registration) => [
      registration.id,
      {
        ...registration,
        buildLayout(context: ControllerGameRenderContext) {
          return withAutoReady(registration.buildLayout(context), context);
        }
      }
    ])
  )
};
