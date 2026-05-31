import { minionsTdHostManifest } from "./minions-td/manifest.js";
import { lightTrailsHostManifest } from "./light-trails/manifest.js";
import { arenaSurvivorHostManifest } from "./arena-survivor/manifest.js";
import { chaosKommandoHostManifest } from "./chaos-kommando/manifest.js";
import { zeichnenUndErratenHostManifest } from "./zeichnen-und-erraten/manifest.js";
import { driftRacerHostManifest } from "./drift-racer/manifest.js";
import { wordTilesHostManifest } from "./word-tiles/manifest.js";
import { externalHostGameRegistry } from "./.generated/externalGames.js";

export const hostGameRegistry: Record<
  string,
  { id: string; displayName: string; sceneKey: string }
> = {
  [driftRacerHostManifest.id]: driftRacerHostManifest,
  [minionsTdHostManifest.id]: minionsTdHostManifest,
  [arenaSurvivorHostManifest.id]: arenaSurvivorHostManifest,
  [chaosKommandoHostManifest.id]: chaosKommandoHostManifest,
  [lightTrailsHostManifest.id]: lightTrailsHostManifest,
  [zeichnenUndErratenHostManifest.id]: zeichnenUndErratenHostManifest,
  [wordTilesHostManifest.id]: wordTilesHostManifest,
  ...externalHostGameRegistry
};
