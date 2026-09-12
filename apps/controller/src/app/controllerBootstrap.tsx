import { startTransition, useEffect, useState } from "react";
import { hasHostControl } from "@open-party-lab/protocol";
import { ControllerPage } from "../pages/ControllerPage.js";
import { HostGameMenu } from "../controller-ui/common/HostGameMenu.js";
import { JoinPage } from "../pages/JoinPage.js";
import { LobbyPage } from "../pages/LobbyPage.js";
import { NotFoundPage } from "../pages/NotFoundPage.js";
import { ReconnectPage } from "../pages/ReconnectPage.js";
import { SafeAreaLayout } from "../controller-ui/layout/SafeAreaLayout.js";
import { useWakeHint } from "../hooks/useWakeHint.js";
import { mountControllerDebugOverlay } from "./debugOverlay.js";
import { readPrefilledRoomCode } from "./deviceSession.js";
import { mountControllerFullscreenOverlay } from "./fullscreenOverlay.js";
import { ControllerSocketClient, type ControllerAppState } from "./controllerSocketClient.js";

function resolveDefaultServerUrl(): string {
  if (import.meta.env.PROD || window.location.port === "3000") {
    return window.location.origin;
  }

  const hostname = window.location.hostname;

  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return "http://localhost:3000";
  }

  const host = hostname.includes(":") ? `[${hostname}]` : hostname;
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  return `${protocol}//${host}:3000`;
}

const controllerClient = new ControllerSocketClient(import.meta.env.VITE_SERVER_URL ?? resolveDefaultServerUrl());

function resolvePage(state: ControllerAppState): "join" | "reconnect" | "lobby" | "controller" | "missing" {
  if (!state.room || !state.player) {
    return state.hasStoredSession ? "reconnect" : "join";
  }

  if (state.room.selectedGameId && state.room.currentRound) {
    return "controller";
  }

  return "lobby";
}

export function ControllerApp() {
  const [state, setState] = useState(controllerClient.getState());

  useWakeHint(Boolean(state.room));

  useEffect(() => {
    controllerClient.connect();

    return controllerClient.subscribe((nextState) => {
      startTransition(() => {
        setState(nextState);
      });
    });
  }, []);

  useEffect(() => {
    return mountControllerDebugOverlay(controllerClient);
  }, []);

  useEffect(() => {
    return mountControllerFullscreenOverlay();
  }, []);

  const page = resolvePage(state);

  return (
    <SafeAreaLayout>
      {page === "join" ? (
        <JoinPage
          defaultRoomCode={readPrefilledRoomCode()}
          connected={state.connected}
          error={state.error}
          language={state.room?.language ?? state.preferredLanguage}
          onJoin={(roomCode, playerName) => controllerClient.joinRoom(roomCode, playerName)}
        />
      ) : null}

      {page === "reconnect" ? (
        <ReconnectPage
          connected={state.connected}
          storedSession={state.storedSession}
          error={state.error}
          language={state.room?.language ?? state.preferredLanguage}
          onReconnect={() => controllerClient.resumeSession()}
          onReset={() => controllerClient.clearStoredSession({ rotateDeviceId: true, disconnect: true })}
        />
      ) : null}

      {page === "lobby" ? (
        <LobbyPage
          room={state.room}
          player={state.player}
          error={state.error}
          onLeaveRoom={() => controllerClient.leaveRoom()}
          onSetReady={(isReady) => controllerClient.setReady(isReady)}
          onSetPlayerSetup={(selectionKey, value) => controllerClient.setPlayerSetup(selectionKey, value)}
          onRequestHostControl={() => controllerClient.requestHostControl()}
          onReleaseHostControl={() => controllerClient.releaseHostControl()}
          onResolveHostControl={(playerId, grant) =>
            controllerClient.resolveHostControl(playerId, grant)
          }
          onSelectGame={(gameId) => controllerClient.selectGame(gameId)}
          onHostAction={(gameId, action) => controllerClient.sendGameHostAction(gameId, action)}
          onStartRound={() => controllerClient.startRound()}
          onBackToMenu={() => controllerClient.returnToGameSelection()}
          onKickPlayer={(playerId) => controllerClient.kickPlayer(playerId)}
        />
      ) : null}

      {page === "controller" ? (
        <>
          <ControllerPage
            state={state}
            onLeaveRoom={() => controllerClient.leaveRoom()}
            onInput={(input) => controllerClient.sendInput(input)}
            onSetReady={(isReady) => controllerClient.setReady(isReady)}
          />
          {/* Only the phone driving the room gets this, and only while a round
              is running — it is the host's menu, not a player's. */}
          {state.room && hasHostControl(state.room.hostControl, state.player?.id) ? (
            <HostGameMenu
              room={state.room}
              onSetPaused={(paused) => controllerClient.setRoundPaused(paused)}
              onSetTheme={(theme) => controllerClient.setTheme(theme)}
              onSetLanguage={(language) => controllerClient.setRoomLanguage(language)}
              onBackToMenu={() => controllerClient.returnToGameSelection()}
              onReleaseControl={() => controllerClient.releaseHostControl()}
            />
          ) : null}
        </>
      ) : null}

      {page === "missing" ? <NotFoundPage language={state.room?.language ?? state.preferredLanguage} /> : null}
    </SafeAreaLayout>
  );
}
