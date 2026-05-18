import { getGameManifest } from "@open-party-lab/game-core";

const manifest = getGameManifest("air-hockey");

if (!manifest) {
  throw new Error("Air Hockey manifest missing from shared game catalog.");
}

export const airHockeyHostManifest = {
  ...manifest,
  phaseDurations: {
    roundIntroMs: 0,
    countdownMs: 0
  },
  roundCompletionMode: "wait_for_ready",
  sceneKey: manifest.hostView
} as const;
