import type { LocalizedGameTextMap } from "../../../i18n/text.js";

export const chaosKommandoText = {
  de: {
    displayName: "Chaos-Kommando",
    description: "Marshmallow-Runden-Artillerie: geroestete Kommandos, sechs Teams, Inselarenen, Minen, Kisten und komplett zerstoerbares Terrain mit Tunneln."
  },
  en: {
    displayName: "Chaos Commando",
    description: "Marshmallow turn-based artillery: roasted squads, six teams, island arenas, mines, crates and fully destructible terrain with tunnels."
  }
} as const satisfies LocalizedGameTextMap;
