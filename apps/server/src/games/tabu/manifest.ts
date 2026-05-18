import { getGameManifest } from "@open-party-lab/game-core";

const manifest = getGameManifest("tabu");

if (!manifest) {
  throw new Error("Tabu manifest missing from shared game catalog.");
}

export const tabuManifest = manifest;
