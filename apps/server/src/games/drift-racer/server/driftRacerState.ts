import type { BaseRoundState } from "@open-party-lab/game-core";
import type {
  DriftRacerControlState,
  DriftRacerRacerState,
  DriftRacerState
} from "@open-party-lab/protocol";

export interface DriftRacerRuntimeRacerState extends DriftRacerRacerState {
  controls: DriftRacerControlState;
  previousLapProgress: number;
  lastInputAt: number;
  finishOrder: number | null;
}

export interface DriftRacerRuntimeState
  extends BaseRoundState,
    Omit<DriftRacerState, "racers"> {
  racers: DriftRacerRuntimeRacerState[];
  nextFinishOrder: number;
}
