import { getGameManifest } from "@open-party-lab/game-core";

const manifest = getGameManifest("arena-survivor");

if (!manifest) {
  throw new Error("Arena Survivor manifest missing from shared game catalog.");
}

export const arenaSurvivorManifest = manifest;
