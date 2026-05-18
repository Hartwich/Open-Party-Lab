import { getGameManifest } from "@open-party-lab/game-core";

const manifest = getGameManifest("zeichnen-und-erraten");

if (!manifest) {
  throw new Error("Zeichnen & Erraten manifest missing from shared game catalog.");
}

export const zeichnenUndErratenHostManifest = {
  ...manifest,
  sceneKey: manifest.hostView
} as const;
