import {
  createBaseRoundState,
  roundPhaseDurations,
  type ScoreEntry,
  type SupportedLanguage,
  type ServerGame
} from "@open-party-lab/game-core";
import { pickOne, shuffle } from "@open-party-lab/utils";
import { imposterManifest } from "../manifest.js";
import type { ImposterInput, ImposterState } from "./imposterState.js";

interface SecretWordPack {
  category: string;
  word: string;
  clueSuggestions: string[];
}

interface ImposterPublicState {
  stage: string;
  category: string;
  clueOrder: string[];
  currentTurnIndex: number;
  currentTurnPlayerId?: string;
  clueTurnsTotal: number;
  voteCounts: Array<{ playerId: string; playerName: string; votes: number }>;
  voteResultPlayerId?: string;
  imposterRevealName?: string;
  secretWord?: string;
  imposterGuess?: string;
  imposterWon: boolean;
  resolvedReason?: string;
  message?: string;
}

interface ImposterControllerState {
  stage: string;
  role: "imposter" | "crew";
  roleLabel: string;
  category: string;
  secretWord?: string;
  currentTurnPlayerId?: string;
  clueTurnsCompleted: number;
  clueTurnsTotal: number;
  votesByPlayer: Record<string, string>;
  hasVoted: boolean;
  voteOptions: Array<{ id: string; disabled: boolean }>;
  imposterGuessOptions: string[];
  voteResultPlayerId?: string;
  imposterGuess?: string;
  imposterWon: boolean;
  resolvedReason?: string;
}

const imposterText = {
  de: {
    rolesPreparing: "Rollen werden verteilt ...",
    cluesRunning: "Hinweisphase laeuft.",
    cluesDone: "Hinweise abgeschlossen. Jetzt wird abgestimmt.",
    nextFallback: "Naechster",
    nextTurn: "Naechster Zug.",
    nextPlayer: (name: string) => `${name} ist dran.`,
    votingProgress: (voted: number, total: number) => `Abstimmung laeuft (${voted}/${total}).`,
    noVotesMessage: "Keine Stimmen abgegeben.",
    noVotesReason: "Niemand hat abgestimmt. Der Imposter entkommt.",
    wrongSuspectMessage: "Falscher Verdacht - Imposter gewinnt.",
    wrongSuspectReason: "Die Gruppe hat die falsche Person verdaechtigt.",
    imposterFound: "Imposter entdeckt! Letzte Chance: Wort erraten.",
    imposterGuessWinReason: "Imposter wurde entdeckt, hat aber das geheime Wort korrekt erraten.",
    imposterGuessLoseReason: "Imposter wurde entdeckt und lag beim Wort falsch.",
    imposterGuessWinMessage: "Imposter erratet das Wort und stiehlt den Sieg.",
    imposterGuessLoseMessage: "Crew entlarvt den Imposter erfolgreich.",
    roleImposter: "Du bist der Imposter",
    roleCrew: "Du bist Crew",
    unknown: "Unbekannt"
  },
  en: {
    rolesPreparing: "Roles are being assigned ...",
    cluesRunning: "Clue phase is running.",
    cluesDone: "Clues are complete. Vote now.",
    nextFallback: "Next player",
    nextTurn: "Next turn.",
    nextPlayer: (name: string) => `${name} is up.`,
    votingProgress: (voted: number, total: number) => `Voting in progress (${voted}/${total}).`,
    noVotesMessage: "No votes were cast.",
    noVotesReason: "Nobody voted. The Imposter escapes.",
    wrongSuspectMessage: "Wrong suspect - Imposter wins.",
    wrongSuspectReason: "The group suspected the wrong person.",
    imposterFound: "Imposter found! Last chance: guess the word.",
    imposterGuessWinReason: "The Imposter was found, but guessed the secret word correctly.",
    imposterGuessLoseReason: "The Imposter was found and guessed the word wrong.",
    imposterGuessWinMessage: "The Imposter guesses the word and steals the win.",
    imposterGuessLoseMessage: "The crew exposes the Imposter successfully.",
    roleImposter: "You are the Imposter",
    roleCrew: "You are Crew",
    unknown: "Unknown"
  }
} satisfies Record<SupportedLanguage, {
  rolesPreparing: string;
  cluesRunning: string;
  cluesDone: string;
  nextFallback: string;
  nextTurn: string;
  nextPlayer: (name: string) => string;
  votingProgress: (voted: number, total: number) => string;
  noVotesMessage: string;
  noVotesReason: string;
  wrongSuspectMessage: string;
  wrongSuspectReason: string;
  imposterFound: string;
  imposterGuessWinReason: string;
  imposterGuessLoseReason: string;
  imposterGuessWinMessage: string;
  imposterGuessLoseMessage: string;
  roleImposter: string;
  roleCrew: string;
  unknown: string;
}>;

const imposterCategoryLabels: Record<SupportedLanguage, Record<string, string>> = {
  de: {
    Essen: "Essen",
    Objekt: "Objekt",
    Ort: "Ort",
    Tier: "Tier",
    Alltag: "Alltag",
    Sport: "Sport",
    Beruf: "Beruf",
    Technik: "Technik",
    Natur: "Natur",
    Kultur: "Kultur"
  },
  en: {
    Essen: "Food",
    Objekt: "Object",
    Ort: "Place",
    Tier: "Animal",
    Alltag: "Everyday life",
    Sport: "Sports",
    Beruf: "Job",
    Technik: "Technology",
    Natur: "Nature",
    Kultur: "Culture"
  }
};

function localizeImposterCategory(category: string, language: SupportedLanguage): string {
  return imposterCategoryLabels[language][category] ?? category;
}

function buildCategoryClues(category: string): string[] {
  switch (category) {
    case "Essen":
      return ["geschmack", "kueche", "zutat", "hunger", "gericht", "portion"];
    case "Objekt":
      return ["material", "nutzen", "haushalt", "alltag", "form", "gebrauch"];
    case "Ort":
      return ["reise", "menschen", "karte", "besuch", "weg", "umgebung"];
    case "Tier":
      return ["natur", "bewegung", "geraeusch", "lebewesen", "instinkt", "art"];
    case "Alltag":
      return ["taeglich", "routine", "praktisch", "haushalt", "zeit", "gewohnheit"];
    case "Sport":
      return ["team", "wettkampf", "training", "punkte", "bewegung", "regel"];
    case "Beruf":
      return ["arbeit", "aufgabe", "berufung", "tag", "kompetenz", "einsatz"];
    case "Technik":
      return ["digital", "geraet", "funktion", "innovation", "akku", "display"];
    case "Natur":
      return ["draussen", "klima", "landschaft", "jahreszeit", "element", "umwelt"];
    case "Kultur":
      return ["kunst", "geschichte", "tradition", "szene", "publikum", "werk"];
    default:
      return ["begriff", "naheliegend", "bekannt", "alltag", "typisch", "idee"];
  }
}

const EXTRA_SECRET_WORD_ENTRIES: Array<Pick<SecretWordPack, "category" | "word">> = [
  { category: "Essen", word: "Burger" },
  { category: "Essen", word: "Sushi" },
  { category: "Essen", word: "Nudeln" },
  { category: "Essen", word: "Salat" },
  { category: "Essen", word: "Lasagne" },
  { category: "Essen", word: "Taco" },
  { category: "Essen", word: "Risotto" },
  { category: "Essen", word: "Donut" },
  { category: "Essen", word: "Pfannkuchen" },
  { category: "Essen", word: "Croissant" },
  { category: "Essen", word: "Bratwurst" },
  { category: "Essen", word: "Kuerbissuppe" },
  { category: "Essen", word: "Kartoffelgratin" },
  { category: "Essen", word: "Muesli" },
  { category: "Essen", word: "Kaesekuchen" },
  { category: "Essen", word: "Brezel" },
  { category: "Essen", word: "Sandwich" },
  { category: "Essen", word: "Eiscreme" },
  { category: "Essen", word: "Omelett" },
  { category: "Essen", word: "Guacamole" },
  { category: "Objekt", word: "Schluessel" },
  { category: "Objekt", word: "Rucksack" },
  { category: "Objekt", word: "Wasserflasche" },
  { category: "Objekt", word: "Stuhl" },
  { category: "Objekt", word: "Lampe" },
  { category: "Objekt", word: "Kopfkissen" },
  { category: "Objekt", word: "Fernbedienung" },
  { category: "Objekt", word: "Rasierapparat" },
  { category: "Objekt", word: "Koffer" },
  { category: "Objekt", word: "Brille" },
  { category: "Objekt", word: "Thermoskanne" },
  { category: "Objekt", word: "Notizbuch" },
  { category: "Objekt", word: "Hammer" },
  { category: "Objekt", word: "Schraubenzieher" },
  { category: "Objekt", word: "Teekanne" },
  { category: "Objekt", word: "Besen" },
  { category: "Objekt", word: "Mikrofon" },
  { category: "Objekt", word: "Kamera" },
  { category: "Objekt", word: "Schachbrett" },
  { category: "Objekt", word: "Taschenrechner" },
  { category: "Ort", word: "Bibliothek" },
  { category: "Ort", word: "Krankenhaus" },
  { category: "Ort", word: "Schule" },
  { category: "Ort", word: "Universitaet" },
  { category: "Ort", word: "Bahnhof" },
  { category: "Ort", word: "Supermarkt" },
  { category: "Ort", word: "Baeckerei" },
  { category: "Ort", word: "Museum" },
  { category: "Ort", word: "Stadion" },
  { category: "Ort", word: "Campingplatz" },
  { category: "Ort", word: "Leuchtturm" },
  { category: "Ort", word: "Burg" },
  { category: "Ort", word: "Zoo" },
  { category: "Ort", word: "Aquarium" },
  { category: "Ort", word: "Kino" },
  { category: "Ort", word: "Theater" },
  { category: "Ort", word: "Schwimmbad" },
  { category: "Ort", word: "Rathaus" },
  { category: "Ort", word: "Marktplatz" },
  { category: "Ort", word: "Parkhaus" },
  { category: "Tier", word: "Giraffe" },
  { category: "Tier", word: "Krokodil" },
  { category: "Tier", word: "Delfin" },
  { category: "Tier", word: "Eule" },
  { category: "Tier", word: "Fuchs" },
  { category: "Tier", word: "Eichhoernchen" },
  { category: "Tier", word: "Kaenguru" },
  { category: "Tier", word: "Faultier" },
  { category: "Tier", word: "Schmetterling" },
  { category: "Tier", word: "Biber" },
  { category: "Tier", word: "Marder" },
  { category: "Tier", word: "Igel" },
  { category: "Tier", word: "Seepferdchen" },
  { category: "Tier", word: "Tintenfisch" },
  { category: "Tier", word: "Walross" },
  { category: "Tier", word: "Lama" },
  { category: "Tier", word: "Pfau" },
  { category: "Tier", word: "Otter" },
  { category: "Tier", word: "Chamäleon" },
  { category: "Tier", word: "Koala" },
  { category: "Alltag", word: "Wecker" },
  { category: "Alltag", word: "Dusche" },
  { category: "Alltag", word: "Fruehstueck" },
  { category: "Alltag", word: "Arbeitsweg" },
  { category: "Alltag", word: "Wochenende" },
  { category: "Alltag", word: "Einkaufsliste" },
  { category: "Alltag", word: "Haushaltsplan" },
  { category: "Alltag", word: "Kaffeepause" },
  { category: "Alltag", word: "Wasserkocher" },
  { category: "Alltag", word: "Abendessen" },
  { category: "Alltag", word: "Waeschekorb" },
  { category: "Alltag", word: "Spuelmaschine" },
  { category: "Alltag", word: "Fensterputzen" },
  { category: "Alltag", word: "Muellsortierung" },
  { category: "Alltag", word: "ToDoListe" },
  { category: "Alltag", word: "Terminkalender" },
  { category: "Alltag", word: "Notizzettel" },
  { category: "Alltag", word: "Mittagspause" },
  { category: "Alltag", word: "Pendelzeit" },
  { category: "Alltag", word: "Schlafroutine" },
  { category: "Sport", word: "Basketball" },
  { category: "Sport", word: "Tennis" },
  { category: "Sport", word: "Volleyball" },
  { category: "Sport", word: "Handball" },
  { category: "Sport", word: "Radsport" },
  { category: "Sport", word: "Schwimmen" },
  { category: "Sport", word: "Klettern" },
  { category: "Sport", word: "Skateboard" },
  { category: "Sport", word: "Surfen" },
  { category: "Sport", word: "Snowboard" },
  { category: "Sport", word: "Golf" },
  { category: "Sport", word: "Judo" },
  { category: "Sport", word: "Boxen" },
  { category: "Sport", word: "Eishockey" },
  { category: "Sport", word: "Badminton" },
  { category: "Sport", word: "Bogenschiessen" },
  { category: "Sport", word: "Triathlon" },
  { category: "Sport", word: "Sprint" },
  { category: "Sport", word: "Yoga" },
  { category: "Sport", word: "Pilates" },
  { category: "Beruf", word: "Lehrkraft" },
  { category: "Beruf", word: "Pilot" },
  { category: "Beruf", word: "Arzt" },
  { category: "Beruf", word: "Architekt" },
  { category: "Beruf", word: "Anwaeltin" },
  { category: "Beruf", word: "Journalist" },
  { category: "Beruf", word: "Programmierer" },
  { category: "Beruf", word: "Designer" },
  { category: "Beruf", word: "Koch" },
  { category: "Beruf", word: "Polizist" },
  { category: "Beruf", word: "Sanitaeter" },
  { category: "Beruf", word: "Mechaniker" },
  { category: "Beruf", word: "Elektriker" },
  { category: "Beruf", word: "Friseur" },
  { category: "Beruf", word: "Fotograf" },
  { category: "Beruf", word: "Landwirt" },
  { category: "Beruf", word: "Psychologe" },
  { category: "Beruf", word: "Apotheker" },
  { category: "Beruf", word: "Buchhalter" },
  { category: "Beruf", word: "Uebersetzer" },
  { category: "Technik", word: "Laptop" },
  { category: "Technik", word: "Tablet" },
  { category: "Technik", word: "Router" },
  { category: "Technik", word: "Drohne" },
  { category: "Technik", word: "BluetoothBox" },
  { category: "Technik", word: "Smartwatch" },
  { category: "Technik", word: "3DDrucker" },
  { category: "Technik", word: "Konsole" },
  { category: "Technik", word: "Joystick" },
  { category: "Technik", word: "Kopfhörer" },
  { category: "Technik", word: "Projektor" },
  { category: "Technik", word: "USBStick" },
  { category: "Technik", word: "Powerbank" },
  { category: "Technik", word: "EReader" },
  { category: "Technik", word: "Scanner" },
  { category: "Technik", word: "Maus" },
  { category: "Technik", word: "Tastatur" },
  { category: "Technik", word: "Mikrochips" },
  { category: "Technik", word: "Solarpanel" },
  { category: "Technik", word: "VRBrille" },
  { category: "Natur", word: "Wasserfall" },
  { category: "Natur", word: "Vulkan" },
  { category: "Natur", word: "Gletscher" },
  { category: "Natur", word: "Regenbogen" },
  { category: "Natur", word: "Gewitter" },
  { category: "Natur", word: "Wuestenduene" },
  { category: "Natur", word: "Korallenriff" },
  { category: "Natur", word: "Baumkrone" },
  { category: "Natur", word: "Moos" },
  { category: "Natur", word: "Lavendel" },
  { category: "Natur", word: "Sonnenaufgang" },
  { category: "Natur", word: "Nordlicht" },
  { category: "Natur", word: "Tropfsteinhoehle" },
  { category: "Natur", word: "Klippe" },
  { category: "Natur", word: "Gezeiten" },
  { category: "Natur", word: "Sandstrand" },
  { category: "Natur", word: "Birkenwald" },
  { category: "Natur", word: "Seegras" },
  { category: "Natur", word: "Steinbock" },
  { category: "Natur", word: "Ahornblatt" },
  { category: "Kultur", word: "Oper" },
  { category: "Kultur", word: "Ballett" },
  { category: "Kultur", word: "Roman" },
  { category: "Kultur", word: "Poesie" },
  { category: "Kultur", word: "Graffiti" },
  { category: "Kultur", word: "Skulptur" },
  { category: "Kultur", word: "Jazz" },
  { category: "Kultur", word: "HipHop" },
  { category: "Kultur", word: "Folklore" },
  { category: "Kultur", word: "Festival" },
  { category: "Kultur", word: "Kostuem" },
  { category: "Kultur", word: "Kulisse" },
  { category: "Kultur", word: "Kinofilm" },
  { category: "Kultur", word: "Fotografie" },
  { category: "Kultur", word: "Keramik" },
  { category: "Kultur", word: "Aquarell" },
  { category: "Kultur", word: "Mosaik" },
  { category: "Kultur", word: "Symphonie" },
  { category: "Kultur", word: "Mythologie" },
  { category: "Kultur", word: "Mittelaltermarkt" }
];

const HINT_ROUNDS = 2;

const SECRET_WORD_PACKS: SecretWordPack[] = [
  { category: "Essen", word: "Pizza", clueSuggestions: ["ofen", "kaese", "teig", "italien", "party", "stuecke"] },
  { category: "Objekt", word: "Regenschirm", clueSuggestions: ["regen", "griff", "faltbar", "wetter", "schutz", "wind"] },
  { category: "Ort", word: "Flughafen", clueSuggestions: ["terminal", "koffer", "sicherheitskontrolle", "startbahn", "reise", "gate"] },
  { category: "Tier", word: "Pinguin", clueSuggestions: ["eis", "watscheln", "suedpol", "schwarzweiss", "kolonie", "fisch"] },
  { category: "Alltag", word: "Toothbrush", clueSuggestions: ["morgen", "bad", "paste", "zaehne", "borsten", "hygiene"] },
  { category: "Sport", word: "Fussball", clueSuggestions: ["tor", "rasen", "elfmeter", "pass", "liga", "fans"] },
  { category: "Beruf", word: "Feuerwehr", clueSuggestions: ["einsatz", "sirene", "schlauch", "helm", "rettung", "leiter"] },
  { category: "Technik", word: "Smartphone", clueSuggestions: ["app", "touch", "akku", "kamera", "chat", "mobil"] },
  ...EXTRA_SECRET_WORD_ENTRIES.map((entry) => ({
    category: entry.category,
    word: entry.word,
    clueSuggestions: buildCategoryClues(entry.category)
  }))
];

function countVotes(votesByPlayer: Record<string, string>): Array<[string, number]> {
  const tally = new Map<string, number>();

  for (const votedPlayerId of Object.values(votesByPlayer)) {
    tally.set(votedPlayerId, (tally.get(votedPlayerId) ?? 0) + 1);
  }

  return [...tally.entries()].sort((left, right) => right[1] - left[1]);
}

function buildGuessOptions(secretWord: string): string[] {
  const distractors = shuffle(
    SECRET_WORD_PACKS.map((entry) => entry.word).filter((word) => word !== secretWord)
  ).slice(0, 3);
  return shuffle([secretWord, ...distractors]);
}

function getCurrentTurnPlayerId(clueOrder: string[], currentTurnIndex: number): string | undefined {
  if (clueOrder.length === 0) {
    return undefined;
  }

  return clueOrder[currentTurnIndex % clueOrder.length];
}

function getClueTurnsTotal(clueOrder: string[]): number {
  return clueOrder.length * HINT_ROUNDS;
}

function resolveVoteResult(state: ImposterState, now: number, language: SupportedLanguage): ImposterState {
  const voteCounts = countVotes(state.votesByPlayer);
  const topSuspect = voteCounts[0]?.[0];
  const text = imposterText[language];

  if (!topSuspect) {
    return {
      ...state,
      stage: "resolved",
      imposterWon: true,
      resolvedReason: text.noVotesReason,
      updatedAt: now,
      message: text.noVotesMessage
    };
  }

  if (topSuspect !== state.imposterPlayerId) {
    return {
      ...state,
      stage: "resolved",
      voteResultPlayerId: topSuspect,
      imposterWon: true,
      resolvedReason: text.wrongSuspectReason,
      updatedAt: now,
      message: text.wrongSuspectMessage
    };
  }

  return {
    ...state,
    stage: "imposter_guess",
    voteResultPlayerId: topSuspect,
    imposterGuessOptions: buildGuessOptions(state.secretWord),
    updatedAt: now,
    message: text.imposterFound
  };
}

function resolveImposterGuess(
  state: ImposterState,
  guessWord: string,
  now: number,
  language: SupportedLanguage
): ImposterState {
  const imposterWon = guessWord === state.secretWord;
  const text = imposterText[language];

  return {
    ...state,
    stage: "resolved",
    imposterGuess: guessWord,
    imposterWon,
    resolvedReason: imposterWon
      ? text.imposterGuessWinReason
      : text.imposterGuessLoseReason,
    updatedAt: now,
    message: imposterWon ? text.imposterGuessWinMessage : text.imposterGuessLoseMessage
  };
}

function buildControllerStateForPlayer(
  state: ImposterState,
  language: SupportedLanguage,
  playerId: string
): ImposterControllerState {
  const text = imposterText[language];
  const hasVoted = state.votesByPlayer[playerId] !== undefined;
  const role: ImposterControllerState["role"] =
    playerId === state.imposterPlayerId ? "imposter" : "crew";
  const currentTurnPlayerId =
    state.stage === "clues" ? getCurrentTurnPlayerId(state.clueOrder, state.currentTurnIndex) : undefined;
  const clueTurnsTotal = getClueTurnsTotal(state.clueOrder);
  const clueTurnsCompleted = Math.min(state.currentTurnIndex, clueTurnsTotal);

  return {
    stage: state.stage,
    role,
    roleLabel: playerId === state.imposterPlayerId ? text.roleImposter : text.roleCrew,
    category: localizeImposterCategory(state.category, language),
    secretWord: playerId === state.imposterPlayerId && state.stage !== "resolved" ? state.secretWord : undefined,
    currentTurnPlayerId,
    clueTurnsCompleted,
    clueTurnsTotal,
    votesByPlayer: state.votesByPlayer,
    hasVoted,
    voteOptions: state.stage === "voting"
      ? state.clueOrder
          .filter((id) => id !== playerId)
          .map((id) => ({ id, disabled: hasVoted }))
      : [],
    imposterGuessOptions: state.stage === "imposter_guess" && playerId === state.imposterPlayerId
      ? state.imposterGuessOptions
      : [],
    voteResultPlayerId: state.voteResultPlayerId,
    imposterGuess: state.imposterGuess,
    imposterWon: state.imposterWon,
    resolvedReason: state.resolvedReason
  };
}

function buildScore(state: ImposterState): ScoreEntry[] {
  if (state.imposterWon) {
    return [{ playerId: state.imposterPlayerId, delta: 2, reason: "Imposter victory" }];
  }

  return state.clueOrder
    .filter((playerId) => playerId !== state.imposterPlayerId)
    .map((playerId) => ({ playerId, delta: 1, reason: "Imposter entlarvt" }));
}

export const imposterServerGame: ServerGame<
  ImposterState,
  ImposterInput,
  ImposterPublicState | ImposterControllerState
> = {
  manifest: imposterManifest,
  createInitialState(context) {
    const selectedPack = pickOne(SECRET_WORD_PACKS);
    const imposterPlayerId = pickOne(context.players).id;
    const clueOrder = shuffle(context.players.map((player) => player.id));
    const text = imposterText[context.language];

    return {
      ...createBaseRoundState("round_intro", context.now, {
        durationMs: roundPhaseDurations.roundIntroMs,
        message: text.rolesPreparing
      }),
      stage: "clues",
      secretWord: selectedPack.word,
      category: selectedPack.category,
      imposterPlayerId,
      clueOrder,
      currentTurnIndex: 0,
      votesByPlayer: {},
      imposterGuessOptions: [],
      imposterWon: false
    };
  },
  startRound(state, context) {
    const text = imposterText[context.language];

    return {
      ...state,
      phase: "playing",
      startedAt: context.now,
      phaseStartedAt: context.now,
      phaseEndsAt: null,
      updatedAt: context.now,
      message: text.cluesRunning
    };
  },
  handleInput(state, input, context) {
    if (state.phase !== "playing") {
      return state;
    }

    if (state.stage === "clues" && input.type === "submit_clue") {
      const currentTurnPlayerId = getCurrentTurnPlayerId(state.clueOrder, state.currentTurnIndex);

      if (input.playerId !== currentTurnPlayerId) {
        return state;
      }

      const clueTurnsTotal = getClueTurnsTotal(state.clueOrder);
      const nextTurnIndex = state.currentTurnIndex + 1;

      if (nextTurnIndex >= clueTurnsTotal) {
        return {
          ...state,
          stage: "voting",
          currentTurnIndex: nextTurnIndex,
          updatedAt: context.now,
          message: imposterText[context.language].cluesDone
        };
      }

      const nextTurnPlayerId = getCurrentTurnPlayerId(state.clueOrder, nextTurnIndex);
      const nextState: ImposterState = {
        ...state,
        currentTurnIndex: nextTurnIndex,
        updatedAt: context.now,
        message: nextTurnPlayerId
          ? imposterText[context.language].nextPlayer(
              context.players.find((player) => player.id === nextTurnPlayerId)?.name ??
                imposterText[context.language].nextFallback
            )
          : imposterText[context.language].nextTurn
      };

      return nextState;
    }

    if (state.stage === "voting" && input.type === "vote_player") {
      if (state.votesByPlayer[input.playerId] || input.suspectPlayerId === input.playerId) {
        return state;
      }

      const nextState: ImposterState = {
        ...state,
        votesByPlayer: {
          ...state.votesByPlayer,
          [input.playerId]: input.suspectPlayerId
        },
        updatedAt: context.now
      };

      if (Object.keys(nextState.votesByPlayer).length >= state.clueOrder.length) {
        return resolveVoteResult(nextState, context.now, context.language);
      }

      return {
        ...nextState,
        message: imposterText[context.language].votingProgress(
          Object.keys(nextState.votesByPlayer).length,
          state.clueOrder.length
        )
      };
    }

    if (
      state.stage === "imposter_guess" &&
      input.type === "guess_word" &&
      input.playerId === state.imposterPlayerId
    ) {
      return resolveImposterGuess(state, input.guessWord, context.now, context.language);
    }

    return state;
  },
  isRoundFinished(state) {
    return state.stage === "resolved";
  },
  buildScore(state) {
    return buildScore(state);
  },
  toPublicState(state, context) {
    const voteCounts = countVotes(state.votesByPlayer);
    const playerNames = Object.fromEntries(context.players.map((player) => [player.id, player.name]));
    const currentTurnPlayerId =
      state.stage === "clues" ? getCurrentTurnPlayerId(state.clueOrder, state.currentTurnIndex) : undefined;
    const clueTurnsTotal = getClueTurnsTotal(state.clueOrder);

    return {
      stage: state.stage,
      category: localizeImposterCategory(state.category, context.language),
      clueOrder: state.clueOrder,
      currentTurnIndex: state.currentTurnIndex,
      currentTurnPlayerId,
      clueTurnsTotal,
      voteCounts: voteCounts.map(([playerId, votes]) => ({
        playerId,
        playerName: playerNames[playerId] ?? imposterText[context.language].unknown,
        votes
      })),
      voteResultPlayerId: state.voteResultPlayerId,
      imposterRevealName:
        state.stage === "resolved" || state.stage === "imposter_guess"
          ? playerNames[state.imposterPlayerId] ?? imposterText[context.language].unknown
          : undefined,
      secretWord: state.stage === "resolved" ? state.secretWord : undefined,
      imposterGuess: state.imposterGuess,
      imposterWon: state.imposterWon,
      resolvedReason: state.resolvedReason,
      message: state.message
    };
  },
  toControllerStateForPlayer(state, context, playerId) {
    return buildControllerStateForPlayer(state, context.language, playerId);
  }
};
