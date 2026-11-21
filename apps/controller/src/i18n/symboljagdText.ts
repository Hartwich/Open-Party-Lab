import type { SupportedLanguage } from "@open-party-lab/protocol";

const copy = {
  "de": {
    complete: "Alle Karten abgelegt!",
    winner: "Gewonnen hat",
    over: "Runde vorbei",
    time: "Deine Zeit",
    card: "Deine Symbolkarte",
    picture: "Symbol",
    waiting: "Warte auf die nächste Karte …",
  },
  "en": {
    complete: "All cards completed!",
    winner: "Winner",
    over: "Round over",
    time: "Your time",
    card: "Your picture card",
    picture: "Picture",
    waiting: "Waiting for the next card…",
  },
  "es": {
    complete: "¡Completaste todas las cartas!",
    winner: "Ganador",
    over: "Ronda terminada",
    time: "Tu tiempo",
    card: "Tu carta de símbolos",
    picture: "Símbolo",
    waiting: "Esperando la siguiente carta…",
  },
  "fr": {
    complete: "Toutes les cartes sont terminées !",
    winner: "Victoire",
    over: "Manche terminée",
    time: "Ton temps",
    card: "Ta carte de symboles",
    picture: "Symbole",
    waiting: "En attente de la carte suivante…",
  },
  "pt-BR": {
    complete: "Você completou todas as cartas!",
    winner: "Vitória",
    over: "Rodada encerrada",
    time: "Seu tempo",
    card: "Sua carta de símbolos",
    picture: "Símbolo",
    waiting: "Aguardando a próxima carta…",
  },
};

export type SymboljagdText = typeof copy.de;

export function getSymboljagdText(language: SupportedLanguage = "de"): SymboljagdText {
  return copy[language];
}
