import type { PlayerInput } from "@open-party-lab/game-core";

export interface DriftRacerDriveInput extends PlayerInput {
  type: "drive";
  steering: number;
  throttle: boolean;
  brake: boolean;
  drift: boolean;
  boost: boolean;
  fire: boolean;
}

export type DriftRacerInput = DriftRacerDriveInput;

export interface DriftRacerPoint {
  x: number;
  y: number;
}

export interface DriftRacerTrackPoint extends DriftRacerPoint {
  distance: number;
}

export interface DriftRacerControlState {
  steering: number;
  throttle: boolean;
  brake: boolean;
  drift: boolean;
  boost: boolean;
  fire: boolean;
}

export interface DriftRacerRacerState {
  playerId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  angleRad: number;
  speed: number;
  lap: number;
  lapProgress: number;
  totalProgress: number;
  rank: number;
  finished: boolean;
  finishMs: number | null;
  offTrack: boolean;
  drifting: boolean;
  boostFuel: number;
  boostActive: boolean;
  steerInput: number;
}

export interface DriftRacerState {
  worldWidth: number;
  worldHeight: number;
  trackWidth: number;
  trackLength: number;
  lapsToWin: number;
  maxRaceMs: number;
  elapsedMs: number;
  tick: number;
  winnerPlayerId?: string;
  winnerName?: string;
  isTimedOut: boolean;
  track: DriftRacerTrackPoint[];
  racers: DriftRacerRacerState[];
}
