import { getGameManifest } from "@open-party-lab/game-core";

const manifest = getGameManifest("light-trails");

if (!manifest) {
  throw new Error("Light Trails manifest missing from shared game catalog.");
}

export const lightTrailsManifest = manifest;
