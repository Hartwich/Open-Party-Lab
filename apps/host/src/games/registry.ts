import { minionsTdHostManifest } from "./minions-td/manifest.js";
import { lightTrailsHostManifest } from "./light-trails/manifest.js";
import { arenaSurvivorHostManifest } from "./arena-survivor/manifest.js";
import { chaosKommandoHostManifest } from "./chaos-kommando/manifest.js";
import { pantomimeHostManifest } from "./pantomime/manifest.js";
import { tapRaceHostManifest } from "./tap-race/manifest.js";
import { imposterHostManifest } from "./imposter/manifest.js";
import { tabuHostManifest } from "./tabu/manifest.js";
import { zeichnenUndErratenHostManifest } from "./zeichnen-und-erraten/manifest.js";
import { airHockeyHostManifest } from "./air-hockey/manifest.js";
import { driftRacerHostManifest } from "./drift-racer/manifest.js";
import { schaetzoramaHostManifest } from "./schaetzorama/manifest.js";
import { wordTilesHostManifest } from "./word-tiles/manifest.js";

export const hostGameRegistry: Record<
  string,
  { id: string; displayName: string; sceneKey: string }
> = {
  [driftRacerHostManifest.id]: driftRacerHostManifest,
  [minionsTdHostManifest.id]: minionsTdHostManifest,
  [arenaSurvivorHostManifest.id]: arenaSurvivorHostManifest,
  [chaosKommandoHostManifest.id]: chaosKommandoHostManifest,
  [lightTrailsHostManifest.id]: lightTrailsHostManifest,
  [pantomimeHostManifest.id]: pantomimeHostManifest,
  [tapRaceHostManifest.id]: tapRaceHostManifest,
  [imposterHostManifest.id]: imposterHostManifest,
  [tabuHostManifest.id]: tabuHostManifest,
  [zeichnenUndErratenHostManifest.id]: zeichnenUndErratenHostManifest,
  [schaetzoramaHostManifest.id]: schaetzoramaHostManifest,
  [wordTilesHostManifest.id]: wordTilesHostManifest,
  [airHockeyHostManifest.id]: airHockeyHostManifest
};
