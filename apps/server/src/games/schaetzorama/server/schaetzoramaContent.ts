import type { SchaetzoramaRoundContent } from "@open-party-lab/protocol";

export const schaetzoramaRounds: SchaetzoramaRoundContent[] = [
  {
    roundIndex: 1,
    roundLabel: "Europa-Pult",
    questions: {
      number: {
        id: "de-bundeslaender",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 50",
        shortLabel: "Zahl",
        prompt: "In wie viele Bundeslaender ist Deutschland gegliedert?",
        min: 1,
        max: 50,
        answer: 16,
        source: {
          label: "Destatis",
          url: "https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Glossar/bundeslaender.html"
        }
      },
      percent: {
        id: "de-waldanteil",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent der Flaeche Deutschlands sind ungefaehr Wald?",
        min: 0,
        max: 100,
        answer: 32,
        unitLabel: "%",
        source: {
          label: "BMEL",
          url: "https://www.bmel.de/EN/topics/forests/forests-in-germany/forests-in-germany_node.html"
        }
      },
      rank: {
        id: "area-canada-china-brazil",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne diese Laender nach Gesamtflaeche, groesstes zuerst.",
        directionLabel: "groesstes zuerst",
        items: [
          { id: "brazil", label: "Brasilien" },
          { id: "canada", label: "Kanada" },
          { id: "china", label: "China" }
        ],
        answerOrder: ["canada", "china", "brazil"],
        source: {
          label: "CIA World Factbook",
          url: "https://www.cia.gov/the-world-factbook/about/archives/2025/field/area/country-comparison/"
        }
      },
      assign: {
        id: "eu-nato-overlap",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Staaten zu: EU-Mitglied, NATO-Mitglied oder beides.",
        leftLabel: "EU",
        rightLabel: "NATO",
        terms: [
          { id: "germany", label: "Deutschland" },
          { id: "norway", label: "Norwegen" },
          { id: "ireland", label: "Irland" },
          { id: "poland", label: "Polen" },
          { id: "austria", label: "Oesterreich" }
        ],
        answers: {
          germany: "both",
          norway: "right",
          ireland: "left",
          poland: "both",
          austria: "left"
        },
        source: {
          label: "EU / NATO",
          url: "https://european-union.europa.eu/principles-countries-history/facts-and-figures-european-union_en"
        }
      }
    }
  },
  {
    roundIndex: 2,
    roundLabel: "Weltraum-Mixer",
    questions: {
      number: {
        id: "solar-system-planets",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 50",
        shortLabel: "Zahl",
        prompt: "Wie viele Planeten hat unser Sonnensystem nach heutiger Einteilung?",
        min: 1,
        max: 50,
        answer: 8,
        source: {
          label: "NASA",
          url: "https://science.nasa.gov/solar-system/planets/"
        }
      },
      percent: {
        id: "earth-water-surface",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent der Erdoberflaeche sind von Wasser bedeckt?",
        min: 0,
        max: 100,
        answer: 71,
        unitLabel: "%",
        source: {
          label: "USGS",
          url: "https://www.usgs.gov/water-science-school/science/how-much-water-there-earth"
        }
      },
      rank: {
        id: "planet-diameter-jse",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne nach Durchmesser, groesster zuerst.",
        directionLabel: "groesster zuerst",
        items: [
          { id: "earth", label: "Erde" },
          { id: "jupiter", label: "Jupiter" },
          { id: "saturn", label: "Saturn" }
        ],
        answerOrder: ["jupiter", "saturn", "earth"],
        source: {
          label: "NASA Planetary Fact Sheet",
          url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/index.html"
        }
      },
      assign: {
        id: "inner-outer-planets",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne zu: innere/terrestrische Planeten oder aeussere Riesenplaneten.",
        leftLabel: "Innen",
        rightLabel: "Aussen",
        terms: [
          { id: "mercury", label: "Merkur" },
          { id: "venus", label: "Venus" },
          { id: "mars", label: "Mars" },
          { id: "jupiter", label: "Jupiter" },
          { id: "neptune", label: "Neptun" }
        ],
        answers: {
          mercury: "left",
          venus: "left",
          mars: "left",
          jupiter: "right",
          neptune: "right"
        },
        source: {
          label: "NASA",
          url: "https://science.nasa.gov/solar-system/planets/"
        }
      }
    }
  },
  {
    roundIndex: 3,
    roundLabel: "Koerper-Knopfbrett",
    questions: {
      number: {
        id: "adult-teeth",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 50",
        shortLabel: "Zahl",
        prompt: "Wie viele bleibende Zaehne hat ein vollstaendiges Erwachsenengebiss inklusive Weisheitszaehnen?",
        min: 1,
        max: 50,
        answer: 32,
        source: {
          label: "Merck Manual",
          url: "https://www.merckmanuals.com/home/multimedia/image/identifying-the-permanent-adult-teeth"
        }
      },
      percent: {
        id: "human-body-water",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent eines erwachsenen menschlichen Koerpers bestehen ungefaehr aus Wasser?",
        min: 0,
        max: 100,
        answer: 60,
        unitLabel: "%",
        source: {
          label: "USGS",
          url: "https://www.usgs.gov/special-topics/water-science-school/science/water-you-water-and-human-body"
        }
      },
      rank: {
        id: "body-elements",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne diese Elemente nach ihrem Anteil im menschlichen Koerper, groesster zuerst.",
        directionLabel: "groesster Anteil zuerst",
        items: [
          { id: "carbon", label: "Kohlenstoff" },
          { id: "oxygen", label: "Sauerstoff" },
          { id: "hydrogen", label: "Wasserstoff" }
        ],
        answerOrder: ["oxygen", "carbon", "hydrogen"],
        source: {
          label: "OpenStax",
          url: "https://openstax.org/books/anatomy-and-physiology-2e/pages/2-1-elements-and-atoms-the-building-blocks-of-matter"
        }
      },
      assign: {
        id: "vitamins-solubility",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne Vitamine zu: fettloeslich oder wasserloeslich.",
        leftLabel: "Fett",
        rightLabel: "Wasser",
        terms: [
          { id: "vit-a", label: "Vitamin A" },
          { id: "vit-c", label: "Vitamin C" },
          { id: "vit-d", label: "Vitamin D" },
          { id: "vit-k", label: "Vitamin K" },
          { id: "vit-b12", label: "Vitamin B12" }
        ],
        answers: {
          "vit-a": "left",
          "vit-c": "right",
          "vit-d": "left",
          "vit-k": "left",
          "vit-b12": "right"
        },
        source: {
          label: "Merck Manual",
          url: "https://www.merckmanuals.com/home/disorders-of-nutrition/vitamins/overview-of-vitamins"
        }
      }
    }
  },
  {
    roundIndex: 4,
    roundLabel: "Labor-Lautstaerke",
    questions: {
      number: {
        id: "si-base-units-count",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 50",
        shortLabel: "Zahl",
        prompt: "Wie viele SI-Basiseinheiten gibt es?",
        min: 1,
        max: 50,
        answer: 7,
        source: {
          label: "BIPM",
          url: "https://www.bipm.org/en/measurement-units/si-base-units"
        }
      },
      percent: {
        id: "dry-air-oxygen",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie hoch ist der Sauerstoffanteil trockener Luft ungefaehr?",
        min: 0,
        max: 100,
        answer: 21,
        unitLabel: "%",
        source: {
          label: "NOAA",
          url: "https://prod-01-alb-www-noaa.woc.noaa.gov/jetstream/atmosphere"
        }
      },
      rank: {
        id: "si-prefixes",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne SI-Praefixe nach Groesse, klein nach gross.",
        directionLabel: "klein nach gross",
        items: [
          { id: "mega", label: "Mega" },
          { id: "kilo", label: "Kilo" },
          { id: "giga", label: "Giga" }
        ],
        answerOrder: ["kilo", "mega", "giga"],
        source: {
          label: "BIPM",
          url: "https://www.bipm.org/en/measurement-units/si-prefixes"
        }
      },
      assign: {
        id: "si-base-or-other",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne zu: SI-Basiseinheit oder andere Einheit.",
        leftLabel: "SI-Basis",
        rightLabel: "Andere",
        terms: [
          { id: "meter", label: "Meter" },
          { id: "second", label: "Sekunde" },
          { id: "kelvin", label: "Kelvin" },
          { id: "liter", label: "Liter" },
          { id: "hour", label: "Stunde" }
        ],
        answers: {
          meter: "left",
          second: "left",
          kelvin: "left",
          liter: "right",
          hour: "right"
        },
        source: {
          label: "BIPM / NIST",
          url: "https://www.bipm.org/en/measurement-units/si-base-units"
        }
      }
    }
  },
  {
    roundIndex: 5,
    roundLabel: "Spielabend-Finale",
    questions: {
      number: {
        id: "olympic-rings",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 50",
        shortLabel: "Zahl",
        prompt: "Wie viele ineinander verschlungene Ringe hat das olympische Symbol?",
        min: 1,
        max: 50,
        answer: 5,
        source: {
          label: "IOC",
          url: "https://olympics.com/ioc/olympic-rings"
        }
      },
      percent: {
        id: "chess-light-squares",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent der Felder eines Schachbretts sind helle Felder?",
        min: 0,
        max: 100,
        answer: 50,
        unitLabel: "%",
        source: {
          label: "FIDE",
          url: "https://rcc.fide.com/article2/"
        }
      },
      rank: {
        id: "olympics-chronology",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne diese modernen Olympischen Sommerspiele chronologisch, frueh nach spaet.",
        directionLabel: "frueh nach spaet",
        items: [
          { id: "st-louis", label: "St. Louis" },
          { id: "athens", label: "Athen" },
          { id: "paris", label: "Paris" }
        ],
        answerOrder: ["athens", "paris", "st-louis"],
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/sports/Olympic-Games/History-of-the-modern-Summer-Games"
        }
      },
      assign: {
        id: "summer-winter-sports",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne olympische Sportarten zu: Sommer oder Winter.",
        leftLabel: "Sommer",
        rightLabel: "Winter",
        terms: [
          { id: "athletics", label: "Leichtathletik" },
          { id: "swimming", label: "Schwimmen" },
          { id: "alpine-skiing", label: "Ski Alpin" },
          { id: "ice-hockey", label: "Eishockey" },
          { id: "snowboard", label: "Snowboard" }
        ],
        answers: {
          athletics: "left",
          swimming: "left",
          "alpine-skiing": "right",
          "ice-hockey": "right",
          snowboard: "right"
        },
        source: {
          label: "Olympics",
          url: "https://olympics.com/en/sports/"
        }
      }
    }
  }
];

export interface SchaetzoramaEnglishQuestionText {
  title?: string;
  shortLabel?: string;
  prompt?: string;
  directionLabel?: string;
  leftLabel?: string;
  rightLabel?: string;
  itemLabels?: Record<string, string>;
  termLabels?: Record<string, string>;
}

export const schaetzoramaEnglishTextByQuestionId: Record<string, SchaetzoramaEnglishQuestionText> = {
  "de-bundeslaender": {
    title: "From 1 to 50",
    shortLabel: "Number",
    prompt: "How many federal states does Germany have?"
  },
  "de-waldanteil": {
    title: "Pie Slice",
    shortLabel: "Percent",
    prompt: "About what percentage of Germany's land area is forest?"
  },
  "area-canada-china-brazil": {
    title: "In Relation",
    shortLabel: "Ranking",
    prompt: "Rank these countries by total area, largest first.",
    directionLabel: "largest first",
    itemLabels: {
      brazil: "Brazil",
      canada: "Canada",
      china: "China"
    }
  },
  "eu-nato-overlap": {
    title: "Overlap",
    shortLabel: "Assign",
    prompt: "Assign the countries: EU member, NATO member, or both.",
    leftLabel: "EU",
    rightLabel: "NATO",
    termLabels: {
      germany: "Germany",
      norway: "Norway",
      ireland: "Ireland",
      poland: "Poland",
      austria: "Austria"
    }
  },
  "solar-system-planets": {
    title: "From 1 to 50",
    shortLabel: "Number",
    prompt: "How many planets are in our solar system under the current classification?"
  },
  "earth-water-surface": {
    title: "Pie Slice",
    shortLabel: "Percent",
    prompt: "What percentage of Earth's surface is covered by water?"
  },
  "planet-diameter-jse": {
    title: "In Relation",
    shortLabel: "Ranking",
    prompt: "Rank by diameter, largest first.",
    directionLabel: "largest first",
    itemLabels: {
      earth: "Earth",
      jupiter: "Jupiter",
      saturn: "Saturn"
    }
  },
  "inner-outer-planets": {
    title: "Overlap",
    shortLabel: "Assign",
    prompt: "Assign the planets: inner terrestrial planets or outer giant planets.",
    leftLabel: "Inner",
    rightLabel: "Outer",
    termLabels: {
      mercury: "Mercury",
      venus: "Venus",
      mars: "Mars",
      jupiter: "Jupiter",
      neptune: "Neptune"
    }
  },
  "adult-teeth": {
    title: "From 1 to 50",
    shortLabel: "Number",
    prompt: "How many permanent teeth does a complete adult set have, including wisdom teeth?"
  },
  "human-body-water": {
    title: "Pie Slice",
    shortLabel: "Percent",
    prompt: "About what percentage of an adult human body is water?"
  },
  "body-elements": {
    title: "In Relation",
    shortLabel: "Ranking",
    prompt: "Rank these elements by their share in the human body, largest first.",
    directionLabel: "largest share first",
    itemLabels: {
      carbon: "Carbon",
      oxygen: "Oxygen",
      hydrogen: "Hydrogen"
    }
  },
  "vitamins-solubility": {
    title: "Overlap",
    shortLabel: "Assign",
    prompt: "Assign the vitamins: fat-soluble or water-soluble.",
    leftLabel: "Fat",
    rightLabel: "Water",
    termLabels: {
      "vit-a": "Vitamin A",
      "vit-c": "Vitamin C",
      "vit-d": "Vitamin D",
      "vit-k": "Vitamin K",
      "vit-b12": "Vitamin B12"
    }
  },
  "si-base-units-count": {
    title: "From 1 to 50",
    shortLabel: "Number",
    prompt: "How many SI base units are there?"
  },
  "dry-air-oxygen": {
    title: "Pie Slice",
    shortLabel: "Percent",
    prompt: "About what percentage of dry air is oxygen?"
  },
  "si-prefixes": {
    title: "In Relation",
    shortLabel: "Ranking",
    prompt: "Rank the SI prefixes by size, small to large.",
    directionLabel: "small to large",
    itemLabels: {
      mega: "Mega",
      kilo: "Kilo",
      giga: "Giga"
    }
  },
  "si-base-or-other": {
    title: "Overlap",
    shortLabel: "Assign",
    prompt: "Assign the units: SI base unit or another unit.",
    leftLabel: "SI base",
    rightLabel: "Other",
    termLabels: {
      meter: "Metre",
      second: "Second",
      kelvin: "Kelvin",
      liter: "Litre",
      hour: "Hour"
    }
  },
  "olympic-rings": {
    title: "From 1 to 50",
    shortLabel: "Number",
    prompt: "How many interlaced rings are in the Olympic symbol?"
  },
  "chess-light-squares": {
    title: "Pie Slice",
    shortLabel: "Percent",
    prompt: "What percentage of squares on a chessboard are light squares?"
  },
  "olympics-chronology": {
    title: "In Relation",
    shortLabel: "Ranking",
    prompt: "Put these modern Summer Olympic Games in chronological order, early to late.",
    directionLabel: "early to late",
    itemLabels: {
      "st-louis": "St. Louis",
      athens: "Athens",
      paris: "Paris"
    }
  },
  "summer-winter-sports": {
    title: "Overlap",
    shortLabel: "Assign",
    prompt: "Assign the Olympic sports: Summer or Winter.",
    leftLabel: "Summer",
    rightLabel: "Winter",
    termLabels: {
      athletics: "Athletics",
      swimming: "Swimming",
      "alpine-skiing": "Alpine skiing",
      "ice-hockey": "Ice hockey",
      snowboard: "Snowboard"
    }
  }
};
