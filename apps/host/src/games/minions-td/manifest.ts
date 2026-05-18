import { getGameManifest } from "@open-party-lab/game-core";

const manifest = getGameManifest("minions-td");

if (!manifest) {
  throw new Error("MinionsTD manifest missing from shared game catalog.");
}

export const minionsTdHostManifest = {
  id: manifest.id,
  displayName: manifest.displayName,
  sceneKey: "MinionsTdHostScene"
} as const;
