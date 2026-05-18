import { getGameManifest } from "@open-party-lab/game-core";

const manifest = getGameManifest("drift-racer");

if (!manifest) {
  throw new Error("Drift Racer manifest missing from shared game catalog.");
}

export const driftRacerManifest = manifest;
