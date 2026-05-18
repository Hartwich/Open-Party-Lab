import type { VirtualJoystickLayoutModel } from "../../layouts/models.js";
import type { ControllerGameRenderContext } from "../registry.js";
import { createAirHockeyMoveInput } from "./airHockeyBindings.js";

type AirHockeyState = {
  scoresByPlayer?: Record<string, number>;
  leftPlayerId?: string;
  rightPlayerId?: string;
  serveDirection?: "left" | "right";
  serveCountdownEndsAt?: number | null;
  message?: string;
};

export function buildAirHockeyControllerModel(
  context: ControllerGameRenderContext
): VirtualJoystickLayoutModel {
  const en = context.state.room?.language === "en";
  const playerId = context.state.player?.id ?? "";
  const gameState = (context.state.game?.state ?? {}) as AirHockeyState;
  const ownScore = gameState.scoresByPlayer?.[playerId] ?? 0;
  const opponentId =
    playerId === gameState.leftPlayerId ? gameState.rightPlayerId : gameState.leftPlayerId;
  const opponentScore = opponentId ? gameState.scoresByPlayer?.[opponentId] ?? 0 : 0;
  const sideLabel =
    playerId === gameState.leftPlayerId
      ? en
        ? "Defend the left goal"
        : "Linkes Tor verteidigen"
      : en
        ? "Defend the right goal"
        : "Rechtes Tor verteidigen";
  const countdownActive = gameState.serveCountdownEndsAt !== null && gameState.serveCountdownEndsAt !== undefined;
  const serveSide = gameState.serveDirection === "right" ? (en ? "right" : "rechts") : en ? "left" : "links";
  const countdownLabel = countdownActive ? (en ? `Serve to the ${serveSide}` : `Anstoss nach ${serveSide}`) : sideLabel;

  return {
    kind: "virtual_joystick",
    title: "Air Hockey",
    subtitle: context.state.game?.phase === "playing" ? countdownLabel : en ? "Get ready" : "Bereit machen",
    helperText:
      context.state.game?.message ??
      gameState.message ??
      (en
        ? "Guard your goal line and counter quickly."
        : "Halte die linke oder rechte Linie sauber und kontere schnell."),
    disabled: context.state.game?.phase !== "playing",
    centerLabel: "MOVE",
    resetKey: `${context.state.game?.roundNumber ?? 0}:${context.state.game?.phase ?? "idle"}`,
    stats: [
      {
        label: "Score",
        value: `${ownScore}:${opponentScore}`,
        highlighted: true
      }
    ],
    onMoveChange: (moveX, moveY) => {
      if (!playerId) {
        return;
      }

      context.onInput(createAirHockeyMoveInput(playerId, moveX, moveY));
    }
  };
}
