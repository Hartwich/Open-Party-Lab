import { getGameManifest } from "@open-party-lab/game-core";

const manifest = getGameManifest("tap-race");

if (!manifest) {
  throw new Error("Tap Race manifest missing from shared game catalog.");
}

export const tapRaceHostManifest = {
  ...manifest,
  sceneKey: manifest.hostView
} as const;
