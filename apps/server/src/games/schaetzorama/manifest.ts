import { getGameManifest } from "@open-party-lab/game-core";

const manifest = getGameManifest("schaetzorama");

if (!manifest) {
  throw new Error("Schaetzorama manifest missing from shared game catalog.");
}

export const schaetzoramaManifest = manifest;
