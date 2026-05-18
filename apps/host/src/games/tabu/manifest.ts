import { getGameManifest } from "@open-party-lab/game-core";

const manifest = getGameManifest("tabu");

if (!manifest) {
  throw new Error("Tabu manifest missing from shared game catalog.");
}

export const tabuHostManifest = {
  ...manifest,
  sceneKey: manifest.hostView
} as const;
