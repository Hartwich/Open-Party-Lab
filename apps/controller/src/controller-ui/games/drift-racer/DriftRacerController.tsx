import type { DriftRacerState } from "@open-party-lab/protocol";
import type { RacingControlsLayoutModel } from "../../layouts/models.js";
import type { ControllerGameRenderContext } from "../registry.js";
import {
  createDriftRacerDriveInput,
  type DriftRacerControllerControls
} from "./driftRacerBindings.js";

export function buildDriftRacerControllerModel(
  context: ControllerGameRenderContext
): RacingControlsLayoutModel {
  const playerId = context.state.player?.id ?? "";
  const gameState = (context.state.game?.state ?? null) as DriftRacerState | null;
  const racer = gameState?.racers.find((entry) => entry.playerId === playerId);
  const disabled = context.state.game?.phase !== "playing" || racer?.finished === true;

  return {
    kind: "racing_controls",
    disabled,
    accentColor: racer?.color ?? context.state.player?.color ?? "#22d3ee",
    resetKey: `${context.state.game?.roundNumber ?? 0}:${context.state.game?.phase ?? "idle"}:${racer?.finished ? "done" : "run"}`,
    onControlsChange: (controls: DriftRacerControllerControls) => {
      if (!playerId) {
        return;
      }

      context.onInput(createDriftRacerDriveInput(playerId, controls));
    }
  };
}
