import { Profiler, useEffect, useMemo, useRef } from "react";
import { ControllerPerfTracker } from "../app/perfTelemetry.js";
import type { ControllerAppState } from "../app/controllerSocketClient.js";
import { controllerGameRegistry } from "../controller-ui/games/registry.js";
import { ReadyPanel } from "../controller-ui/common/ReadyPanel.js";
import { ControllerFrame } from "../controller-ui/layout/ControllerFrame.js";
import { ControllerLayoutRenderer } from "../controller-ui/layouts/ControllerLayoutRenderer.js";
import type { ControllerLayoutModel, ReadyLayoutModel } from "../controller-ui/layouts/models.js";
import { getControllerText } from "../i18n/controllerText.js";
import { useOrientationHint } from "../hooks/useOrientationHint.js";

interface ControllerPageProps {
  state: ControllerAppState;
  onLeaveRoom: () => void;
  onInput: (input: unknown) => void;
  onSetReady: (isReady: boolean) => void;
}

function resolveControllerPerfCounters(
  state: ControllerAppState,
  model: ControllerLayoutModel
): Record<string, number> {
  const baseCounters = {
    players: state.room?.players.length ?? 0
  };

  switch (model.kind) {
    case "tower_defense":
      return {
        ...baseCounters,
        buildSlots: model.map.buildSlots.length,
        pathCells: model.map.pathCells.length,
        ownedTowers: model.map.buildSlots.filter((slot) => slot.tower).length,
        towerTypes: model.towerCatalog.length,
        enemyTypes: model.enemyCatalog.length
      };
    case "shop":
      return {
        ...baseCounters,
        offers: model.offers.length,
        loadoutWeapons: model.loadout?.weapons.length ?? 0,
        loadoutItems: model.loadout?.items.length ?? 0
      };
    case "tap_mash":
      return {
        ...baseCounters,
        rows: model.rows.length,
        progressCurrent: model.progress.current,
        progressMax: model.progress.max
      };
    default:
      return baseCounters;
  }
}

function resolveAutoReadyFallback(
  state: ControllerAppState,
  onSetReady: (isReady: boolean) => void,
  model: ControllerLayoutModel,
  text: ReturnType<typeof getControllerText>
): ReadyLayoutModel | undefined {
  const gameId = state.room?.selectedGameId;
  const selectedGame = gameId
    ? state.room?.availableGames.find((entry) => entry.id === gameId)
    : undefined;

  if (
    !state.room ||
    !state.player ||
    !selectedGame ||
    selectedGame.roundCompletionMode !== "wait_for_ready" ||
    state.game?.phase !== "finished"
  ) {
    return undefined;
  }

  if ("ready" in model && model.ready) {
    return undefined;
  }

  const currentPlayerReady = Boolean(
    state.room.players.find((player) => player.id === state.player?.id)?.isReady ?? state.player.isReady
  );
  const readyCount = state.room.players.filter((player) => player.isReady).length;
  const playerCount = state.room.players.length;

  return {
    currentPlayerReady,
    readyCount,
    playerCount,
    label: text.nextRound,
    description: text.nextRoundDescription(readyCount, playerCount),
    language: state.room.language,
    onToggleReady: () => onSetReady(!currentPlayerReady)
  };
}

export function ControllerPage({ state, onLeaveRoom, onInput, onSetReady }: ControllerPageProps) {
  const orientation = useOrientationHint();
  const text = getControllerText(state.room?.language ?? state.preferredLanguage);
  const gameId = state.room?.selectedGameId;
  const game = state.game;
  const gameRegistration = gameId ? controllerGameRegistry[gameId] : undefined;
  const selectedGame =
    state.room?.availableGames.find((entry) => entry.id === gameId);
  const gameName =
    selectedGame?.displayName ?? gameId ?? "Controller";
  const perfTrackerRef = useRef<ControllerPerfTracker | null>(null);

  if (!perfTrackerRef.current) {
    perfTrackerRef.current = new ControllerPerfTracker("controller-page", "controller-page");
  }

  useEffect(() => {
    return () => {
      perfTrackerRef.current?.clear();
      perfTrackerRef.current = null;
    };
  }, []);

  const layoutResult = useMemo(() => {
    if (!state.player || !state.room || !gameId || !gameRegistration) {
      return null;
    }

    const buildStart = performance.now();
    const model = gameRegistration.buildLayout({
      state,
      onInput,
      onSetReady
    });

    return {
      model,
      buildMs: performance.now() - buildStart
    };
  }, [gameId, gameRegistration, onInput, onSetReady, state]);

  if (!state.player || !state.room || !gameId || !gameRegistration || !layoutResult) {
    return (
      <ControllerFrame title={text.controllerTitle} subtitle={text.preparingGameView}>
        <p style={{ margin: 0 }}>{text.unsupportedGame}</p>
      </ControllerFrame>
    );
  }

  const layoutModel = layoutResult.model;
  const perfCounters = resolveControllerPerfCounters(state, layoutModel);
  const fallbackReady = resolveAutoReadyFallback(state, onSetReady, layoutModel, text);
  const gamepadChrome = gameId === "drift-racer";
  const denseBoardChrome = gameId === "word-tiles";
  const minimalChrome = denseBoardChrome || gamepadChrome;

  return (
    <ControllerFrame
      title={minimalChrome ? "" : gameName}
      subtitle={minimalChrome ? undefined : `${text.phase}: ${text.formatPhase(game?.phase ?? text.unknown)} | ${orientation}`}
      wide={gamepadChrome || denseBoardChrome}
      footer={
        minimalChrome ? undefined :
        <div style={{ display: "grid", gap: 10 }}>
          <button type="button" onClick={onLeaveRoom} style={secondaryButtonStyle}>
            {text.logout}
          </button>
          <div style={{ display: "grid", gap: 8 }}>
            <small style={{ color: "var(--text-muted)" }}>{text.room} {state.room.code}</small>
            <small style={{ color: "var(--text-muted)" }}>
              {text.score}: {state.scoreboard?.entries.find((entry) => entry.playerId === state.player?.id)?.total ?? state.player.score}
            </small>
          </div>
        </div>
      }
    >
      <Profiler
        id={`controller:${gameId}`}
        onRender={(_id, phase, actualDuration, baseDuration) => {
          perfTrackerRef.current?.sample({
            sourceId: `${gameId}:${layoutModel.kind}`,
            timingsMs: {
              buildModel: layoutResult.buildMs,
              reactCommit: actualDuration,
              reactBase: baseDuration
            },
            counters: perfCounters,
            tags: {
              gameId,
              layout: layoutModel.kind,
              phase: game?.phase ?? null,
              roomCode: state.room?.code ?? null,
              mapId: layoutModel.kind === "tower_defense" ? layoutModel.map.id : null
            },
            flags: {
              mount: phase === "mount",
              disabled: layoutModel.disabled
            }
          });
          }}
        >
        {fallbackReady ? <ReadyPanel ready={fallbackReady} /> : null}
        <ControllerLayoutRenderer model={layoutModel} />
      </Profiler>
    </ControllerFrame>
  );
}

const secondaryButtonStyle = {
  border: "1px solid rgba(248, 113, 113, 0.45)",
  borderRadius: "var(--radius-md)",
  background: "rgba(127, 29, 29, 0.18)",
  color: "var(--text-main)",
  padding: "14px 18px",
  fontWeight: 700
} as const;
