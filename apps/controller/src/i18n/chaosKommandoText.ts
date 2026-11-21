import type { SupportedLanguage } from "@open-party-lab/protocol";

const copy = {
  "de": {
    arsenal: "WAFFEN",
    controls: "STEUERUNG",
    move: "LAUFEN / SEIL",
    hop: "SPRUNG",
    backflip: "SALTO",
    aim: "ZIELEN",
    release: "HAKEN LOESEN",
    hook: "HAKEN",
    pull: "HOCHZIEHEN (HALTEN)",
    fuse: "Zuender",
    endTurn: "ZUG BEENDEN",
  },
  "en": {
    arsenal: "ARSENAL",
    controls: "CONTROLS",
    move: "WALK / ROPE",
    hop: "HOP",
    backflip: "BACKFLIP",
    aim: "AIM",
    release: "RELEASE HOOK",
    hook: "HOOK",
    pull: "PULL UP (HOLD)",
    fuse: "Fuse",
    endTurn: "END TURN",
  },
  "es": {
    arsenal: "ARSENAL",
    controls: "CONTROLES",
    move: "CAMINAR / CUERDA",
    hop: "SALTO",
    backflip: "SALTO HACIA ATRÁS",
    aim: "APUNTAR",
    release: "SOLTAR GANCHO",
    hook: "GANCHO",
    pull: "SUBIR (MANTÉN)",
    fuse: "Mecha",
    endTurn: "TERMINAR TURNO",
  },
  "fr": {
    arsenal: "ARSENAL",
    controls: "COMMANDES",
    move: "MARCHER / CORDE",
    hop: "SAUT",
    backflip: "SALTO ARRIÈRE",
    aim: "VISER",
    release: "LÂCHER LE GRAPPIN",
    hook: "GRAPPIN",
    pull: "MONTER (MAINTIENS)",
    fuse: "Mèche",
    endTurn: "FIN DU TOUR",
  },
  "pt-BR": {
    arsenal: "ARSENAL",
    controls: "CONTROLES",
    move: "ANDAR / CORDA",
    hop: "PULAR",
    backflip: "SALTO PARA TRÁS",
    aim: "MIRAR",
    release: "SOLTAR GANCHO",
    hook: "GANCHO",
    pull: "SUBIR (SEGURE)",
    fuse: "Pavio",
    endTurn: "ENCERRAR TURNO",
  },
};

export type ChaosKommandoText = typeof copy.de;

export function getChaosKommandoText(language: SupportedLanguage = "de"): ChaosKommandoText {
  return copy[language];
}
