import type { LocalizedGameTextMap } from "../../../i18n/text.js";

const setupFieldsDe = {
  ruleset: {
    label: "Regelwerk",
    options: {
      "mau-mau": {
        label: "Mau-Mau",
        description: "Sieben zieht zwei, Acht setzt aus, Neun dreht um, Bube wuenscht sich eine Farbe."
      },
      schwimmen: {
        label: "Schwimmen (31)",
        description: "Drei Karten, drei offene Tischkarten, tauschen und klopfen. Drei Leben pro Person."
      },
      stichwette: {
        label: "Stichwette",
        description: "Stiche ansagen und genau treffen. Eigenes Blatt mit Kronen und Federn, steigende Kartenzahl je Runde."
      },
      zahlenreihe: {
        label: "Zahlenreihe",
        description: "Vier Farbreihen von 1 bis 20, jede eroeffnet mit der Elf. Eigenes Zahlenblatt."
      },
      luegen: {
        label: "Luegen",
        description: "Verdeckt ablegen und den geforderten Wert ansagen. Wer anzweifelt und daneben liegt, nimmt den Stapel."
      },
      "schwarzer-peter": {
        label: "Schwarzer Peter",
        description: "Paare ablegen und beim Nachbarn ziehen. Wer die Karte ohne Partner behaelt, verliert."
      },
      fischen: {
        label: "Fischen",
        description: "Mitspieler nach einem Wert fragen und Quartette sammeln. Familientauglich."
      },
      herzeln: {
        label: "Herzeln",
        description: "Stiche vermeiden: Jedes Herz zaehlt einen Strafpunkt, die Pik-Dame dreizehn."
      },
      doppelkopf: {
        label: "Doppelkopf",
        description: "Fuer vier Personen: Karo, Damen, Buben und Herz-Zehn sind Trumpf, die Kreuz-Damen bilden Re."
      },
      romme: {
        label: "Rommee",
        description: "Saetze und Folgen sammeln, ab 40 Augen auslegen, anlegen und mit Jokern die Hand leeren."
      },
      symboljagd: {
        label: "Symboljagd",
        description: "Finde das gemeinsame Bildsymbol zwischen deiner Karte und der Mitte. Allein ohne KI spielst du gegen die Zeit. Ein falscher Tipp sperrt dich kurz."
      },
      "free-play": {
        label: "Freies Spiel",
        description: "Offener Tisch ohne Regeln: jede Karte darf abgelegt werden."
      }
    }
  },
  symboljagdSymbolsPerCard: {
    label: "Symbole pro Karte",
    description: "Mehr Motive machen die Uebereinstimmung schwieriger. Die Kartensaetze bleiben mathematisch eindeutig.",
    options: {
      8: { label: "8 Symbole · Standard", description: "57 Motive und 57 Karten." },
      9: { label: "9 Symbole · Anspruchsvoll", description: "73 Motive und 73 Karten." },
      10: { label: "10 Symbole · Profi", description: "91 Motive und 91 Karten." }
    }
  },
  symboljagdDealMode: {
    label: "Kartenpensum",
    options: {
      all: { label: "Alle Karten", description: "Den ganzen Kartensatz wie bisher verteilen." },
      fixed: { label: "Feste Anzahl pro Person", description: "Alle spielen bis zur gleichen Zielanzahl. Alte Karten werden wieder untergemischt." }
    }
  },
  symboljagdCardTarget: {
    label: "Karten pro Person",
    description: "Zielanzahl bei festem Kartenpensum; bei Alle Karten gilt der ganze Kartensatz."
  },
  deck: {
    label: "Kartendeck",
    description: "Blatt fuer dieses Regelwerk.",
    options: {
      "french-52": { label: "Franzoesisch (52)", description: "Pik, Herz, Karo, Kreuz von 2 bis Ass." },
      "french-54": { label: "Franzoesisch + Joker (54)", description: "Wie oben, dazu zwei Joker." },
      "skat-32": { label: "Deutsches Blatt (32)", description: "Eichel, Gruen, Herz, Schellen von 7 bis Ass." },
      "party-40": { label: "Party-Deck (40)", description: "Frei definiertes Beispieldeck mit eigenen Symbolen." },
      "french-104": { label: "Doppeldeck (108)", description: "Zwei franzoesische Blaetter und vier Joker." }
    }
  },
  handSize: {
    label: "Handkarten",
    description: "Karten pro Spieler beim Austeilen."
  },
  dimUnplayable: {
    label: "Unspielbare Karten ausgrauen",
    description: "Hebt passende Karten auf dem Handy hervor. Ausgeschaltet bleiben alle Karten normal sichtbar; die Spielregeln gelten weiterhin."
  },
  mauStackSevens: {
    label: "Siebenen stapeln",
    description: "Eine Sieben gibt die aufgelaufenen Strafkarten an den Naechsten weiter.",
    group: "Mau-Mau-Hausregeln"
  },
  mauSkipEights: {
    label: "Acht setzt aus",
    description: "Nach einer Acht wird der naechste Spieler uebersprungen.",
    group: "Mau-Mau-Hausregeln"
  },
  mauReverseNines: {
    label: "Neun dreht die Richtung",
    description: "Nach einer Neun wechselt die Spielrichtung. Zu zweit setzt der andere Spieler aus.",
    group: "Mau-Mau-Hausregeln"
  },
  mauJackOnJack: {
    label: "Bube auf Bube",
    description: "Buben und Joker duerfen auch auf andere Buben oder Joker gelegt werden.",
    group: "Mau-Mau-Hausregeln"
  },
  mauPlayDrawn: {
    label: "Gezogene Karte sofort legen",
    description: "Beim normalen Ziehen darf die gezogene Karte sofort gelegt werden. Fuer Strafkarten gilt die separate Option.",
    group: "Mau-Mau-Hausregeln"
  },
  mauPlayPenaltyDrawn: {
    label: "Nach Strafziehen sofort legen",
    description: "Nach +2, +4 usw. darf eine passende Karte aus den gerade gezogenen Strafkarten gelegt werden. Alte Handkarten bleiben gesperrt.",
    group: "Mau-Mau-Hausregeln"
  },
  handSort: {
    label: "Handkarten sortieren",
    description: "Ordnet das Blatt auf dem Handy nach Trumpf und Farben statt in der Reihenfolge des Austeilens."
  },
  botCount: {
    label: "KI-Spieler",
    description: "Virtuelle Mitspieler, die der Tisch selbst steuert. Sie fuellen bis zu sechs Plaetze auf und spielen nach demselben Regelwerk. Fehlt einem Regelwerk die Mindestbesetzung, fuellt der Tisch von selbst auf."
  },
  dokoNines: {
    label: "Ohne Neunen (40 Karten)",
    description: "Karo-Koenig wird kleinster Trumpf, die Runden werden kuerzer.",
    group: "Doppelkopf-Hausregeln"
  },
  dokoSecondDulle: {
    label: "Zweite Dulle sticht",
    description: "Fallen beide Herz-Zehnen in einen Stich, gewinnt die zweite.",
    group: "Doppelkopf-Hausregeln"
  },
  dokoDoppelkopf: {
    label: "Doppelkopf (40+ Augen)",
    description: "Sonderpunkt fuer einen Stich mit 40 oder mehr Augen.",
    group: "Doppelkopf-Hausregeln"
  },
  dokoFox: {
    label: "Fuchs gefangen",
    description: "Sonderpunkt fuer ein gestochenes Karo-Ass der Gegenpartei.",
    group: "Doppelkopf-Hausregeln"
  },
  dokoCharlie: {
    label: "Karlchen im letzten",
    description: "Sonderpunkt fuer den Kreuz-Buben im letzten Stich.",
    group: "Doppelkopf-Hausregeln"
  },
  dokoFoxEnd: {
    label: "Fuchs am End",
    description: "Sonderpunkt fuer ein Karo-Ass im letzten Stich.",
    group: "Doppelkopf-Hausregeln"
  },
  dokoPigs: {
    label: "Schweinchen",
    description: "Beide Karo-Asse auf einer Hand werden die hoechsten Truempfe.",
    group: "Doppelkopf-Hausregeln"
  },
  dokoAgainstOld: {
    label: "Gegen die Alten",
    description: "Sonderpunkt, wenn Kontra gewinnt.",
    group: "Doppelkopf-Hausregeln"
  },
  dokoBock: {
    label: "Bockrunde",
    description: "Nach verlorenem Re oder schwarzer Partei zaehlt die Folgerunde doppelt.",
    group: "Doppelkopf-Hausregeln"
  },
  dokoForced: {
    label: "Pflichtansage ab 35 Augen",
    description: "Der Gewinner des ersten Stichs legt seine Partei offen.",
    group: "Doppelkopf-Hausregeln"
  },
  doppelkopfScoring: {
    label: "Augen erst am Ende zaehlen",
    description: "Waehrend der Runde keine Zahlen - abgerechnet wird zum Schluss.",
    group: "Doppelkopf-Hausregeln"
  },
  cardStyle: {
    label: "Kartenbild",
    options: {
      classic: { label: "Klassisch", description: "Weisses Blatt mit Serifen, Ecken und Pips." },
      modern: { label: "Modern", description: "Farbiges Feld, grosse Ziffer, weit lesbar." },
      clear: { label: "Klar", description: "Sehr reduziert: riesige Zahl, kleines Zeichen." }
    }
  }
} as const;

const setupFieldsEn = {
  ruleset: {
    label: "Ruleset",
    options: {
      "mau-mau": {
        label: "Mau Mau",
        description: "Seven draws two, eight skips, nine reverses, jack wishes a suit."
      },
      schwimmen: {
        label: "Thirty-one (31)",
        description: "Three cards, three open table cards, swap and knock. Three lives each."
      },
      stichwette: {
        label: "Trick Bets",
        description: "Bid tricks and hit them exactly. Own deck with crowns and feathers, rising card counts per round."
      },
      zahlenreihe: {
        label: "Number Rows",
        description: "Four color rows from 1 to 20, each opened with the eleven. Own number deck."
      },
      luegen: {
        label: "Cheat",
        description: "Play face-down and announce the required rank. Wrong doubters pick up the pile."
      },
      "schwarzer-peter": {
        label: "Old Maid",
        description: "Discard pairs and draw from your neighbor. Whoever keeps the odd card loses."
      },
      fischen: {
        label: "Go Fish",
        description: "Ask players for a rank and collect sets of four. Family-friendly."
      },
      herzeln: {
        label: "Hearts",
        description: "Avoid tricks: every heart counts one penalty point, the queen of spades thirteen."
      },
      doppelkopf: {
        label: "Doppelkopf",
        description: "For four players: diamonds, queens, jacks and the ten of hearts are trump, the queens of clubs form Re."
      },
      romme: {
        label: "Rummy",
        description: "Collect sets and runs, meld from 40 points, extend melds and empty your hand with jokers."
      },
      symboljagd: {
        label: "Symbol Hunt",
        description: "Find the shared picture symbol between your card and the center. Solo without AI means racing the clock. A wrong tap locks you briefly."
      },
      "free-play": {
        label: "Free Play",
        description: "Open table without rules: any card may be played."
      }
    }
  },
  symboljagdSymbolsPerCard: {
    label: "Symbols per card",
    description: "More motifs make matches harder. The decks stay mathematically exact.",
    options: {
      8: { label: "8 symbols · Standard", description: "57 motifs and 57 cards." },
      9: { label: "9 symbols · Advanced", description: "73 motifs and 73 cards." },
      10: { label: "10 symbols · Pro", description: "91 motifs and 91 cards." }
    }
  },
  symboljagdDealMode: {
    label: "Card quota",
    options: {
      all: { label: "All cards", description: "Deal the whole deck as before." },
      fixed: { label: "Fixed quota per player", description: "Everyone plays to the same target count. Old cards are reshuffled." }
    }
  },
  symboljagdCardTarget: {
    label: "Cards per player",
    description: "Target count for fixed quotas; with All cards the whole deck counts."
  },
  deck: {
    label: "Card deck",
    description: "Deck for this ruleset.",
    options: {
      "french-52": { label: "French (52)", description: "Spades, hearts, diamonds, clubs from 2 to ace." },
      "french-54": { label: "French + jokers (54)", description: "As above, plus two jokers." },
      "skat-32": { label: "German deck (32)", description: "Acorns, leaves, hearts, bells from 7 to ace." },
      "party-40": { label: "Party deck (40)", description: "Freely defined example deck with custom symbols." },
      "french-104": { label: "Double deck (108)", description: "Two French decks and four jokers." }
    }
  },
  handSize: {
    label: "Hand cards",
    description: "Cards per player when dealing."
  },
  dimUnplayable: {
    label: "Dim unplayable cards",
    description: "Highlights matching cards on the phone. When off, all cards stay fully visible; the rules still apply."
  },
  mauStackSevens: {
    label: "Stack sevens",
    description: "A seven passes the accumulated penalty cards to the next player.",
    group: "Mau Mau house rules"
  },
  mauSkipEights: {
    label: "Eight skips",
    description: "After an eight, the next player is skipped.",
    group: "Mau Mau house rules"
  },
  mauReverseNines: {
    label: "Nine reverses",
    description: "After a nine, the direction changes. With two players the other player sits out.",
    group: "Mau Mau house rules"
  },
  mauJackOnJack: {
    label: "Jack on jack",
    description: "Jacks and jokers may also be played on other jacks or jokers.",
    group: "Mau Mau house rules"
  },
  mauPlayDrawn: {
    label: "Play drawn card immediately",
    description: "On a normal draw, the drawn card may be played at once. Penalty cards use the separate option.",
    group: "Mau Mau house rules"
  },
  mauPlayPenaltyDrawn: {
    label: "Play right after penalty draw",
    description: "After +2, +4 etc. one matching card from the freshly drawn penalty cards may be played. Old hand cards stay locked.",
    group: "Mau Mau house rules"
  },
  handSort: {
    label: "Sort hand cards",
    description: "Orders the phone hand by trump and suits instead of deal order."
  },
  botCount: {
    label: "AI players",
    description: "Virtual players controlled by the table. They fill up to six seats and play by the same rules. If a ruleset lacks minimum players, the table fills up by itself."
  },
  dokoNines: {
    label: "Without nines (40 cards)",
    description: "King of diamonds becomes the smallest trump, rounds get shorter.",
    group: "Doppelkopf house rules"
  },
  dokoSecondDulle: {
    label: "Second Dulle wins",
    description: "If both tens of hearts land in one trick, the second wins.",
    group: "Doppelkopf house rules"
  },
  dokoDoppelkopf: {
    label: "Doppelkopf (40+ points)",
    description: "Bonus point for a trick with 40 or more points.",
    group: "Doppelkopf house rules"
  },
  dokoFox: {
    label: "Caught fox",
    description: "Bonus point for a captured diamond ace of the opposing party.",
    group: "Doppelkopf house rules"
  },
  dokoCharlie: {
    label: "Karlchen in the last",
    description: "Bonus point for the jack of clubs in the last trick.",
    group: "Doppelkopf house rules"
  },
  dokoFoxEnd: {
    label: "Fox at the end",
    description: "Bonus point for a diamond ace in the last trick.",
    group: "Doppelkopf house rules"
  },
  dokoPigs: {
    label: "Piggies",
    description: "Both diamond aces in one hand become the highest trumps.",
    group: "Doppelkopf house rules"
  },
  dokoAgainstOld: {
    label: "Against the Old Ones",
    description: "Bonus point when Kontra wins.",
    group: "Doppelkopf house rules"
  },
  dokoBock: {
    label: "Bock round",
    description: "After a lost Re or a black game, the next round counts double.",
    group: "Doppelkopf house rules"
  },
  dokoForced: {
    label: "Mandatory call from 35 points",
    description: "The winner of the first trick reveals their party.",
    group: "Doppelkopf house rules"
  },
  doppelkopfScoring: {
    label: "Count points only at the end",
    description: "No numbers during the round - scoring happens at the end.",
    group: "Doppelkopf house rules"
  },
  cardStyle: {
    label: "Card design",
    options: {
      classic: { label: "Classic", description: "White deck with serifs, corners and pips." },
      modern: { label: "Modern", description: "Colored field, large digit, readable from afar." },
      clear: { label: "Clear", description: "Very minimal: huge number, small symbol." }
    }
  }
} as const;

export const cardTableText: LocalizedGameTextMap = {
  de: {
    displayName: "Kartentisch",
    description: "Gemeinsamer Spieltisch fuer zwoelf Kartenspiele: Mau-Mau, Schwimmen, Stichwette, Zahlenreihe, Luegen, Schwarzer Peter, Fischen, Herzeln, Doppelkopf, Rommee, Symboljagd und freies Spiel - wahlweise mit KI-Mitspielern.",
    lobbySetup: {
      title: "Kartentisch Setup",
      description: "Regelwerk, Deck und Handkarten waehlen. Je nach Regelwerk spielen bis zu 6 Personen mit, bei Symboljagd bis zu 16 und bei Doppelkopf bis zu 4.",
      fields: setupFieldsDe
    }
  },
  en: {
    displayName: "Card Table",
    description: "Shared card table for twelve card games: Mau Mau, Thirty-one, Trick Bets, Number Rows, Cheat, Old Maid, Go Fish, Hearts, Doppelkopf, Rummy, Symbol Hunt and free play - optionally with AI players.",
    lobbySetup: {
      title: "Card Table Setup",
      description: "Choose the ruleset, deck and hand cards. Depending on the ruleset up to 6 people play, up to 16 in Symbol Hunt and up to 4 in Doppelkopf.",
      fields: setupFieldsEn
    }
  },
  ar: {
    displayName: "طاولة الأوراق",
    description: "طاولة أوراق مشتركة لاثني عشر لعبة: ماو ماو، الواحد والثلاثون، رهانات الأوراق، صفوف الأرقام، الاحتيال، العجوز العذراء، اطلب السماء، القلوب، دوبلكوبف، الرامي، صيد الرموز ولعب حر — مع إمكانية إضافة لاعبين افتراضيين.",
    lobbySetup: {
      title: "إعداد طاولة الأوراق",
      description: "اختر قواعد اللعب والمجموعة والأوراق. بحسب القواعد يلعب حتى 6 أشخاص، وحتى 16 في صيد الرموز، وحتى 4 في دوبلكوبف.",
      fields: setupFieldsEn
    }
  }
};
