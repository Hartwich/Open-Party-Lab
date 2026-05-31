import type { LocalizedGameTextMap } from "../../i18n/text.js";
import { lightTrailsText } from "./games/lightTrails.js";
import { airHockeyText } from "./games/airHockey.js";
import { arenaSurvivorText } from "./games/arenaSurvivor.js";
import { chaosKommandoText } from "./games/chaosKommando.js";
import { imposterText } from "./games/imposter.js";
import { minionsTdText } from "./games/minionsTd.js";
import { pantomimeText } from "./games/pantomime.js";
import { tabuText } from "./games/tabu.js";
import { zeichnenUndErratenText } from "./games/zeichnenUndErraten.js";
import { driftRacerText } from "./games/driftRacer.js";
import { schaetzoramaText } from "./games/schaetzorama.js";
import { wordTilesText } from "./games/wordTiles.js";

const gameTextCatalog = {
  "chaos-kommando": chaosKommandoText,
  "zeichnen-und-erraten": zeichnenUndErratenText,
  "arena-survivor": arenaSurvivorText,
  "minions-td": minionsTdText,
  imposter: imposterText,
  tabu: tabuText,
  pantomime: pantomimeText,
  "drift-racer": driftRacerText,
  "air-hockey": airHockeyText,
  schaetzorama: schaetzoramaText,
  "word-tiles": wordTilesText,
  "light-trails": lightTrailsText
} as const satisfies Record<string, LocalizedGameTextMap>;

export const gameTextById: Record<string, LocalizedGameTextMap> = gameTextCatalog;
