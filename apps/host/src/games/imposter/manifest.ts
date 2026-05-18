import { getGameManifest } from "@open-party-lab/game-core";

const manifest = getGameManifest("imposter");

if (!manifest) {
  throw new Error("Imposter manifest missing from shared game catalog.");
}

export const imposterHostManifest = {
  ...manifest,
  sceneKey: manifest.hostView
} as const;
