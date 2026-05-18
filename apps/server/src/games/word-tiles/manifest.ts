import { getGameManifest } from "@open-party-lab/game-core";

const manifest = getGameManifest("word-tiles");

if (!manifest) {
  throw new Error("Word Tiles manifest missing from shared game catalog.");
}

export const wordTilesManifest = manifest;
