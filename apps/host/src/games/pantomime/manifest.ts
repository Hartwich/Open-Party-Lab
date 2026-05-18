import { getGameManifest } from "@open-party-lab/game-core";

const manifest = getGameManifest("pantomime");

if (!manifest) {
  throw new Error("Pantomime manifest missing from shared game catalog.");
}

export const pantomimeHostManifest = {
  ...manifest,
  sceneKey: manifest.hostView
} as const;
