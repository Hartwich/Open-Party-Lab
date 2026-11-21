import type { SupportedLanguage } from "@open-party-lab/protocol";

const copy = {
  "de": {
    over: "Runde vorbei",
    winner: "Sieger",
    shared: "Die Auswertung steht auf dem großen Bildschirm.",
    noCards: "Keine Karten mehr.",
    play: "Legen",
    rotate: "Halte dein Handy quer.",
    cancel: "Abbrechen",
  },
  "en": {
    over: "Round over",
    winner: "Winner",
    shared: "The result is on the shared screen.",
    noCards: "No cards left.",
    play: "Play",
    rotate: "Turn your phone sideways.",
    cancel: "Cancel",
  },
  "es": {
    over: "Ronda terminada",
    winner: "Ganador",
    shared: "El resultado está en la pantalla grande.",
    noCards: "No quedan cartas.",
    play: "Jugar",
    rotate: "Gira el celular en horizontal.",
    cancel: "Cancelar",
  },
  "fr": {
    over: "Manche terminée",
    winner: "Victoire",
    shared: "Le résultat est sur le grand écran.",
    noCards: "Il ne reste plus de cartes.",
    play: "Jouer",
    rotate: "Tourne ton téléphone à l’horizontale.",
    cancel: "Annuler",
  },
  "pt-BR": {
    over: "Rodada encerrada",
    winner: "Vitória",
    shared: "O resultado está na tela grande.",
    noCards: "Não restam cartas.",
    play: "Jogar",
    rotate: "Vire o celular na horizontal.",
    cancel: "Cancelar",
  },
};

export type CardHandText = typeof copy.de;

export function getCardHandText(language: SupportedLanguage = "de"): CardHandText {
  return copy[language];
}
