import type { DriftRacerDriveInput } from "@open-party-lab/protocol";

export interface DriftRacerControllerControls {
  steering: number;
  throttle: boolean;
  brake: boolean;
  drift: boolean;
  boost: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function createDriftRacerDriveInput(
  playerId: string,
  controls: DriftRacerControllerControls
): DriftRacerDriveInput {
  return {
    type: "drive",
    playerId,
    steering: clamp(controls.steering, -1, 1),
    throttle: controls.throttle,
    brake: controls.brake,
    drift: controls.drift,
    boost: controls.boost,
    sentAt: Date.now()
  };
}
