import type { LocalizedGameTextMap } from "../../i18n/text.js";
import { lightTrailsText } from "./games/lightTrails.js";
import { airHockeyText } from "./games/airHockey.js";
import { arenaSurvivorText } from "./games/arenaSurvivor.js";
import { imposterText } from "./games/imposter.js";
import { pantomimeText } from "./games/pantomime.js";
import { tabuText } from "./games/tabu.js";
import { zeichnenUndErratenText } from "./games/zeichnenUndErraten.js";
import { driftRacerText } from "./games/driftRacer.js";
import { schaetzoramaText } from "./games/schaetzorama.js";
import { wordTilesText } from "./games/wordTiles.js";

const gameTextCatalog = {
  "zeichnen-und-erraten": zeichnenUndErratenText,
  "arena-survivor": arenaSurvivorText,
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
