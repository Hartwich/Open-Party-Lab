import type { LightTrailsTurnDirection } from "@open-party-lab/protocol";

export function createLightTrailsInput(
  playerId: string,
  direction: LightTrailsTurnDirection,
  active: boolean
) {
  return {
    type: "turn" as const,
    playerId,
    direction,
    active,
    sentAt: Date.now()
  };
}
