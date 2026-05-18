import { getGameManifest } from "@open-party-lab/game-core";

const manifest = getGameManifest("chaos-kommando");

if (!manifest) {
  throw new Error("Chaos-Kommando manifest missing from shared game catalog.");
}

export const chaosKommandoHostManifest = {
  id: manifest.id,
  displayName: manifest.displayName,
  sceneKey: manifest.hostView
} as const;
