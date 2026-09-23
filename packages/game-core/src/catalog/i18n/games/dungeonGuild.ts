import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const dungeonGuildText = {
  de: {
    displayName: "Dungeon-Gilde",
    description: "Öffnet Türen, sammelt Ausrüstung und schließt wacklige Bündnisse. Wer zuerst Stufe 10 erreicht, gewinnt."
  },
  en: {
    displayName: "Dungeon Guild",
    description: "Open doors, collect equipment and form uneasy alliances. The first player to reach level 10 wins."
  }
} as const satisfies LocalizedGameTextMap;
