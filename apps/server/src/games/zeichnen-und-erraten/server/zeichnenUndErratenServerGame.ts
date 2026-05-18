import {
  createBaseRoundState,
  roundPhaseDurations,
  transitionRoundState,
  type ScoreEntry,
  type ServerGame,
  type ServerGameContext,
  type SupportedLanguage
} from "@open-party-lab/game-core";
import type { ZeichnenUndErratenWordCategory } from "@open-party-lab/protocol";
import { zeichnenUndErratenManifest } from "../manifest.js";
import {
  isZeichnenUndErratenWordCategory,
  resolveZeichnenUndErratenWordCategory,
  zeichnenUndErratenRoomSettingKeys
} from "./zeichnenUndErratenConfig.js";
import type {
  DrawingPoint,
  GuessEntry,
  ZeichnenUndErratenControllerState,
  ZeichnenUndErratenInput,
  ZeichnenUndErratenPublicState,
  ZeichnenUndErratenState
} from "./zeichnenUndErratenState.js";
import { drawingColorPalette } from "./zeichnenUndErratenState.js";

const roundDurationMs = 90_000;
const maxGuessFeedEntries = 10;

const zeichnenUndErratenText = {
  de: {
    drawerFallback: "Zeichner",
    playerFallback: "Spieler",
    ready: (name: string) => `${name} zeichnet gleich. Bereit zum Raten?`,
    drawingNow: (name: string) => `${name} zeichnet jetzt.`,
    cleared: (name: string) => `${name} hat die Zeichnung geloescht.`,
    guessedCorrectly: (name: string, word: string) => `${name} hat "${word}" erraten!`,
    guessed: (name: string, guess: string) => `${name} hat geraten: ${guess}`,
    timeUp: (word: string) => `Zeit abgelaufen. Das Wort war "${word}".`
  },
  en: {
    drawerFallback: "Drawer",
    playerFallback: "Player",
    ready: (name: string) => `${name} will draw next. Ready to guess?`,
    drawingNow: (name: string) => `${name} is drawing now.`,
    cleared: (name: string) => `${name} cleared the drawing.`,
    guessedCorrectly: (name: string, word: string) => `${name} guessed "${word}"!`,
    guessed: (name: string, guess: string) => `${name} guessed: ${guess}`,
    timeUp: (word: string) => `Time is up. The word was "${word}".`
  }
} satisfies Record<
  SupportedLanguage,
  {
    drawerFallback: string;
    playerFallback: string;
    ready: (name: string) => string;
    drawingNow: (name: string) => string;
    cleared: (name: string) => string;
    guessedCorrectly: (name: string, word: string) => string;
    guessed: (name: string, guess: string) => string;
    timeUp: (word: string) => string;
  }
>;

const standardWordPool = [
  "Kaktus",
  "Fahrrad",
  "Rakete",
  "Schloss",
  "Wolke",
  "Ananas",
  "Dinosaurier",
  "Regenschirm",
  "Pinguin",
  "Leuchtturm",
  "Trompete",
  "Vulkan",
  "Apfel",
  "Banane",
  "Kirsche",
  "Erdbeere",
  "Birne",
  "Zitrone",
  "Orange",
  "Traube",
  "Wassermelone",
  "Kiwi",
  "Pfirsich",
  "Mango",
  "Kokosnuss",
  "Avocado",
  "Karotte",
  "Tomate",
  "Gurke",
  "Paprika",
  "Pilz",
  "Brokkoli",
  "Kartoffel",
  "Zwiebel",
  "Knoblauch",
  "Mais",
  "Brot",
  "Kaese",
  "Pizza",
  "Hamburger",
  "Pommes",
  "Spaghetti",
  "Suppe",
  "Kuchen",
  "Eis",
  "Keks",
  "Tasse",
  "Loeffel",
  "Gabel",
  "Messer",
  "Teller",
  "Topf",
  "Pfanne",
  "Kuehlschrank",
  "Toaster",
  "Mixer",
  "Backofen",
  "Lampe",
  "Sofa",
  "Stuhl",
  "Tisch",
  "Bett",
  "Kissen",
  "Decke",
  "Schrank",
  "Spiegel",
  "Fenster",
  "Tuer",
  "Teppich",
  "Uhr",
  "Vase",
  "Kerze",
  "Schluessel",
  "Rucksack",
  "Koffer",
  "Brille",
  "Hut",
  "Schuh",
  "Jacke",
  "Hose",
  "Kleid",
  "Handschuh",
  "Schal",
  "Fahne",
  "Ball",
  "Drachen",
  "Schaukel",
  "Rutsche",
  "Zelt",
  "Luftballon",
  "Geschenk",
  "Krone",
  "Roboter",
  "Pirat",
  "Ritter",
  "Prinzessin",
  "Zauberer",
  "Hexe",
  "Drache",
  "Einhorn",
  "Monster",
  "Geist",
  "Skelett",
  "Vampir",
  "Werwolf",
  "Alien",
  "Astronaut",
  "Planet",
  "Stern",
  "Mond",
  "Sonne",
  "Saturn",
  "Komet",
  "Meteorit",
  "Ufo",
  "Feuerwehr",
  "Polizei",
  "Krankenwagen",
  "Traktor",
  "Motorrad",
  "Bus",
  "Zug",
  "Flugzeug",
  "Hubschrauber",
  "Boot",
  "U-Boot",
  "Segelboot",
  "Lastwagen",
  "Taxi",
  "Ampel",
  "Strasse",
  "Bruecke",
  "Tunnel",
  "Berg",
  "Fluss",
  "See",
  "Meer",
  "Insel",
  "Palme",
  "Wald",
  "Baum",
  "Blume",
  "Rose",
  "Sonnenblume",
  "Klee",
  "Pilzhaus",
  "Vogel",
  "Eule",
  "Ente",
  "Huhn",
  "Hahn",
  "Pferd",
  "Kuh",
  "Schaf",
  "Schwein",
  "Ziege",
  "Hund",
  "Katze",
  "Maus",
  "Hase",
  "Fuchs",
  "Baer",
  "Loewe",
  "Tiger",
  "Elefant",
  "Giraffe",
  "Zebra",
  "Affe",
  "Gorilla",
  "Panda",
  "Koala",
  "Kaenguru",
  "Pinguinkueken",
  "Wal",
  "Hai",
  "Delfin",
  "Krake",
  "Schildkroete",
  "Seepferdchen",
  "Fisch",
  "Qualle",
  "Biene",
  "Schmetterling",
  "Marienkaefer",
  "Ameise",
  "Spinne",
  "Schnecke",
  "Regenbogen",
  "Blitz",
  "Schnee",
  "Schneemann",
  "Schlitten",
  "Skateboard",
  "Inlineskates",
  "Gitarre",
  "Klavier",
  "Geige",
  "Floete",
  "Mikrofon",
  "Kamera",
  "Fernseher",
  "Laptop",
  "Tablet",
  "Handy",
  "Kopfhoerer",
  "Joystick",
  "Buch",
  "Heft",
  "Stift",
  "Radiergummi",
  "Lineal",
  "Schere"
] as const;

const adultWordPool = [
  "Cocktail",
  "Bierkrug",
  "Weinflasche",
  "Whiskyglas",
  "Sektflasche",
  "Champagner",
  "Nachtclub",
  "Diskokugel",
  "Afterparty",
  "Barkeeper",
  "Karaoke-Bar",
  "Casino",
  "Poker",
  "Roulette",
  "Zigarette",
  "Shisha",
  "Katerfruehstueck",
  "Junggesellenabschied",
  "Limousine",
  "Clubstempel",
  "High Heels",
  "Lippenstift",
  "Parfuem",
  "Tattoo",
  "Piercing",
  "Dessous",
  "BH",
  "Tanga",
  "Kondom",
  "Handschellen",
  "Peitsche",
  "Massageoel",
  "Whirlpool",
  "Sauna",
  "Hotelzimmer",
  "Doppelbett",
  "Rosenblaetter",
  "Liebesbrief",
  "Blind Date",
  "Flirt",
  "Verlobungsring",
  "Hochzeitsnacht",
  "Schaumbad",
  "Schlafmaske",
  "Poledance",
  "Striptease",
  "Kamasutra",
  "Lederjacke",
  "Lackschuh",
  "Mitternachtskuss",
  "Sektglas",
  "Tanzflaeche",
  "VIP-Band",
  "Badehose",
  "Bikini",
  "Liebesschloss",
  "Candle-Light-Dinner",
  "Herzchenboxer",
  "Partybus",
  "Liebesnest",
  "Vorspiel",
  "Orgasmus",
  "Sexstellung",
  "Missionarsstellung",
  "Reiterstellung",
  "Doggy Style",
  "Neunundsechzig",
  "Zungenkuss",
  "Liebesbiss",
  "Bettgefluester",
  "Dirty Talk",
  "Sexting",
  "Gleitgel",
  "Dildo",
  "Vibrator",
  "Sexspielzeug",
  "Lustkugel",
  "Sexshop",
  "Swingerclub",
  "Safer Sex",
  "Kondompackung",
  "Reizwaesche",
  "Strapse",
  "Latexoutfit",
  "Augenbinde",
  "Liebesschaukel",
  "Lapdance",
  "Burlesque",
  "Fetisch",
  "BDSM",
  "Erotikroman",
  "Nacktbaden",
  "Oben Ohne",
  "Kussmund",
  "Rollenspiel",
  "Liebeswuerfel",
  "Lustschloss",
  "Stripclub",
  "Private Dance",
  "Bodypaint"
] as const;

const wordPoolByCategory = {
  standard: standardWordPool,
  adult: adultWordPool
} as const satisfies Record<ZeichnenUndErratenWordCategory, readonly string[]>;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function isDrawingColor(value: string): boolean {
  return drawingColorPalette.includes(value as (typeof drawingColorPalette)[number]);
}

function normalizeGuess(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("de-DE")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function hashStringToSeed(value: string): number {
  let hash = 2_166_136_261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return (hash >>> 0) || 1;
}

function nextRandomValue(seed: number): number {
  const nextSeed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
  return nextSeed / 4_294_967_296;
}

function selectDrawerPlayerId(roundNumber: number, playerIds: string[]): string {
  const safeIndex = Math.max(0, (roundNumber - 1) % playerIds.length);
  return playerIds[safeIndex] ?? playerIds[0] ?? "";
}

function getPreviousSecretWord(context: ServerGameContext): string | undefined {
  if (context.previousRound?.gameId !== zeichnenUndErratenManifest.id) {
    return undefined;
  }

  const previousState = context.previousRound.state as Partial<ZeichnenUndErratenState>;
  return typeof previousState.secretWord === "string" ? previousState.secretWord : undefined;
}

function pickWord(context: ServerGameContext, category: ZeichnenUndErratenWordCategory): string {
  const pool = wordPoolByCategory[category] ?? standardWordPool;
  const previousWord = getPreviousSecretWord(context);
  const seed = hashStringToSeed(`${context.roomCode}:${context.roundNumber}:${context.now}:${category}`);
  const index = Math.floor(nextRandomValue(seed) * pool.length);
  const selected = pool[index] ?? pool[0] ?? "Sonne";

  if (selected === previousWord && pool.length > 1) {
    return pool[(index + 1) % pool.length] ?? "Sonne";
  }

  return selected;
}

function createMaskedWord(word: string): string {
  return word
    .split("")
    .map((char) => (char.trim() ? "_" : " "))
    .join(" ");
}

function shouldRevealWord(state: ZeichnenUndErratenState): boolean {
  return (
    state.phase === "locked" ||
    state.phase === "result" ||
    state.phase === "scoreboard" ||
    state.phase === "finished"
  );
}

function buildScore(state: ZeichnenUndErratenState): ScoreEntry[] {
  if (!state.winnerPlayerId) {
    return [];
  }

  const entries: ScoreEntry[] = [
    {
      playerId: state.winnerPlayerId,
      delta: 1,
      reason: "Wort korrekt geraten"
    }
  ];

  if (state.drawerPlayerId !== state.winnerPlayerId) {
    entries.push({
      playerId: state.drawerPlayerId,
      delta: 1,
      reason: "Wort erfolgreich gezeichnet"
    });
  }

  return entries;
}

function toPublicState(state: ZeichnenUndErratenState): ZeichnenUndErratenPublicState {
  return {
    drawerPlayerId: state.drawerPlayerId,
    drawerName: state.drawerName,
    wordCategory: state.wordCategory,
    maskedWord: state.maskedWord,
    finishAt: state.finishAt,
    currentColor: state.currentColor,
    availableColors: state.availableColors,
    strokes: state.strokes,
    guesses: state.guesses,
    winnerPlayerId: state.winnerPlayerId,
    winnerName: state.winnerName,
    revealedWord: shouldRevealWord(state) ? state.secretWord : undefined
  };
}

function toControllerStateForPlayer(
  state: ZeichnenUndErratenState,
  playerId: string
): ZeichnenUndErratenControllerState {
  const isDrawer = state.drawerPlayerId === playerId;

  return {
    ...toPublicState(state),
    isDrawer,
    secretWord: isDrawer ? state.secretWord : undefined
  };
}

export const zeichnenUndErratenServerGame: ServerGame<
  ZeichnenUndErratenState,
  ZeichnenUndErratenInput,
  ZeichnenUndErratenPublicState | ZeichnenUndErratenControllerState
> = {
  manifest: zeichnenUndErratenManifest,
  createInitialState(context) {
    const text = zeichnenUndErratenText[context.language];
    const drawerPlayerId = selectDrawerPlayerId(
      context.roundNumber,
      context.players.map((player) => player.id)
    );
    const drawerName =
      context.players.find((player) => player.id === drawerPlayerId)?.name ?? text.drawerFallback;
    const wordCategory = resolveZeichnenUndErratenWordCategory(context.roomSettings);
    const secretWord = pickWord(context, wordCategory);

    return {
      ...createBaseRoundState("round_intro", context.now, {
        durationMs: roundPhaseDurations.roundIntroMs,
        message: text.ready(drawerName)
      }),
      drawerPlayerId,
      drawerName,
      secretWord,
      wordCategory,
      maskedWord: createMaskedWord(secretWord),
      finishAt: null,
      currentColor: drawingColorPalette[0] ?? "#f8fafc",
      availableColors: drawingColorPalette,
      strokes: [],
      activeStrokeId: null,
      guesses: []
    };
  },
  startRound(state, context) {
    const text = zeichnenUndErratenText[context.language];

    return transitionRoundState(
      {
        ...state,
        finishAt: context.now + roundDurationMs,
        currentColor: drawingColorPalette[0] ?? "#f8fafc",
        strokes: [],
        activeStrokeId: null,
        guesses: [],
        winnerPlayerId: undefined,
        winnerName: undefined
      },
      "playing",
      context.now,
      {
        startedAt: context.now,
        message: text.drawingNow(state.drawerName)
      }
    );
  },
  handleHostAction(_state, action) {
    if (!action || typeof action !== "object") {
      return null;
    }

    const typedAction = action as { type?: unknown; category?: unknown };

    if (typedAction.type !== "configure-lobby" || !isZeichnenUndErratenWordCategory(typedAction.category)) {
      return null;
    }

    return {
      roomSettings: {
        [zeichnenUndErratenRoomSettingKeys.wordCategory]: typedAction.category
      }
    };
  },
  handleInput(state, input, context) {
    if (state.phase !== "playing") {
      return state;
    }

    if (input.playerId === state.drawerPlayerId) {
      if (input.type === "draw:clear") {
        return {
          ...state,
          strokes: [],
          activeStrokeId: null,
          updatedAt: context.now,
          message: zeichnenUndErratenText[context.language].cleared(state.drawerName)
        };
      }

      if (input.type === "draw:set-color") {
        if (!isDrawingColor(input.color)) {
          return state;
        }

        return {
          ...state,
          currentColor: input.color,
          updatedAt: context.now
        };
      }

      if (input.type === "draw:start") {
        const point: DrawingPoint = { x: clamp01(input.x), y: clamp01(input.y) };
        const strokeId = `stroke-${context.now}-${state.strokes.length + 1}`;

        return {
          ...state,
          activeStrokeId: strokeId,
          strokes: [...state.strokes, { id: strokeId, color: state.currentColor, points: [point] }],
          updatedAt: context.now
        };
      }

      if (input.type === "draw:move") {
        if (!state.activeStrokeId || state.strokes.length === 0) {
          return state;
        }

        const point: DrawingPoint = { x: clamp01(input.x), y: clamp01(input.y) };
        const strokes = [...state.strokes];
        const lastStroke = strokes[strokes.length - 1];

        if (!lastStroke || lastStroke.id !== state.activeStrokeId) {
          return state;
        }

        strokes[strokes.length - 1] = {
          ...lastStroke,
          points: [...lastStroke.points, point]
        };

        return {
          ...state,
          strokes,
          updatedAt: context.now
        };
      }

      if (input.type === "draw:end") {
        return {
          ...state,
          activeStrokeId: null,
          updatedAt: context.now
        };
      }

      return state;
    }

    if (input.type !== "guess:submit") {
      return state;
    }

    const guess = input.guess.trim();

    if (!guess) {
      return state;
    }

    const playerName =
      context.players.find((player) => player.id === input.playerId)?.name ??
      zeichnenUndErratenText[context.language].playerFallback;
    const isCorrect = normalizeGuess(guess) === normalizeGuess(state.secretWord);
    const feedEntry: GuessEntry = {
      playerId: input.playerId,
      playerName,
      guess,
      at: context.now,
      correct: isCorrect
    };
    const guesses = [...state.guesses, feedEntry].slice(-maxGuessFeedEntries);

    if (isCorrect) {
      return transitionRoundState(
        {
          ...state,
          guesses,
          winnerPlayerId: input.playerId,
          winnerName: playerName
        },
        "locked",
        context.now,
        {
          durationMs: roundPhaseDurations.lockedMs,
          message: zeichnenUndErratenText[context.language].guessedCorrectly(playerName, state.secretWord)
        }
      );
    }

    return {
      ...state,
      guesses,
      updatedAt: context.now,
      message: zeichnenUndErratenText[context.language].guessed(playerName, guess)
    };
  },
  tick(state, _deltaMs, context) {
    if (state.phase !== "playing" || state.finishAt === null || context.now < state.finishAt) {
      return state;
    }

    return transitionRoundState(state, "locked", context.now, {
      durationMs: roundPhaseDurations.lockedMs,
      message: zeichnenUndErratenText[context.language].timeUp(state.secretWord)
    });
  },
  isRoundFinished(state) {
    return state.phase === "locked";
  },
  buildScore(state) {
    return buildScore(state);
  },
  toPublicState(state) {
    return toPublicState(state);
  },
  toControllerStateForPlayer(state, _context, playerId) {
    return toControllerStateForPlayer(state, playerId);
  }
};
