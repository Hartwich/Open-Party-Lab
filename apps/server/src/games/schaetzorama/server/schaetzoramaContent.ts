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
    ,
  {
    roundIndex: 6,
    roundLabel: "Natur-Kompass",
    questions: {
      number: {
        id: "spider-legs",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 50",
        shortLabel: "Zahl",
        prompt: "Wie viele Beine hat eine Spinne?",
        min: 1,
        max: 50,
        answer: 8,
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/animal/spider-arachnid"
        }
      },
      percent: {
        id: "dry-air-nitrogen",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie hoch ist der Stickstoffanteil trockener Luft ungefaehr?",
        min: 0,
        max: 100,
        answer: 78,
        unitLabel: "%",
        source: {
          label: "NOAA",
          url: "https://prod-01-alb-www-noaa.woc.noaa.gov/jetstream/atmosphere"
        }
      },
      rank: {
        id: "animal-running-speed",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne diese Tiere nach typischer maximaler Laufgeschwindigkeit, schnellstes zuerst.",
        directionLabel: "schnellstes zuerst",
        items: [
          { id: "cheetah", label: "Gepard" },
          { id: "ostrich", label: "Strauss" },
          { id: "elephant", label: "Elefant" }
        ],
        answerOrder: ["cheetah", "ostrich", "elephant"],
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/list/fastest-animals-on-earth"
        }
      },
      assign: {
        id: "mammal-or-reptile",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Tiere zu: Saeugetier oder Reptil.",
        leftLabel: "Saeugetier",
        rightLabel: "Reptil",
        terms: [
          { id: "dolphin", label: "Delfin" },
          { id: "bat", label: "Fledermaus" },
          { id: "whale", label: "Wal" },
          { id: "crocodile", label: "Krokodil" },
          { id: "snake", label: "Schlange" }
        ],
        answers: {
          dolphin: "left",
          bat: "left",
          whale: "left",
          crocodile: "right",
          snake: "right"
        },
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/animal/mammal"
        }
      }
    }
  },
  {
    roundIndex: 7,
    roundLabel: "Musik-Deck",
    questions: {
      number: {
        id: "standard-guitar-strings",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 50",
        shortLabel: "Zahl",
        prompt: "Wie viele Saiten hat eine Standardgitarre normalerweise?",
        min: 1,
        max: 50,
        answer: 6,
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/art/guitar"
        }
      },
      percent: {
        id: "piano-black-keys-octave",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent der 12 Halbtone einer Oktave entsprechen den schwarzen Klaviertasten?",
        min: 0,
        max: 100,
        answer: 42,
        unitLabel: "%",
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/art/piano"
        }
      },
      rank: {
        id: "note-values-long-short",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Notenwerte nach Laenge, laengster zuerst.",
        directionLabel: "laengster zuerst",
        items: [
          { id: "quarter", label: "Viertelnote" },
          { id: "whole", label: "Ganze Note" },
          { id: "half", label: "Halbe Note" }
        ],
        answerOrder: ["whole", "half", "quarter"],
        source: {
          label: "Open Music Theory",
          url: "https://viva.pressbooks.pub/openmusictheory/"
        }
      },
      assign: {
        id: "string-or-wind-instruments",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Instrumente zu: Saiteninstrument oder Blasinstrument.",
        leftLabel: "Saiten",
        rightLabel: "Blas",
        terms: [
          { id: "violin", label: "Violine" },
          { id: "guitar", label: "Gitarre" },
          { id: "harp", label: "Harfe" },
          { id: "trumpet", label: "Trompete" },
          { id: "flute", label: "Floete" }
        ],
        answers: {
          violin: "left",
          guitar: "left",
          harp: "left",
          trumpet: "right",
          flute: "right"
        },
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/art/musical-instrument"
        }
      }
    }
  },
  {
    roundIndex: 8,
    roundLabel: "Pixel-Pult",
    questions: {
      number: {
        id: "bits-in-byte",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 50",
        shortLabel: "Zahl",
        prompt: "Wie viele Bits hat ein Byte?",
        min: 1,
        max: 50,
        answer: 8,
        source: {
          label: "NIST",
          url: "https://www.nist.gov/pml/owm/metric-si-prefixes"
        }
      },
      percent: {
        id: "half-byte-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent eines Bytes sind 4 Bits?",
        min: 0,
        max: 100,
        answer: 50,
        unitLabel: "%",
        source: {
          label: "NIST",
          url: "https://www.nist.gov/pml/owm/metric-si-prefixes"
        }
      },
      rank: {
        id: "data-units-small-large",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Dateneinheiten nach Groesse, klein nach gross.",
        directionLabel: "klein nach gross",
        items: [
          { id: "gb", label: "Gigabyte" },
          { id: "mb", label: "Megabyte" },
          { id: "tb", label: "Terabyte" }
        ],
        answerOrder: ["mb", "gb", "tb"],
        source: {
          label: "NIST",
          url: "https://www.nist.gov/pml/owm/metric-si-prefixes"
        }
      },
      assign: {
        id: "input-output-devices",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Geraete zu: Eingabegeraet oder Ausgabegeraet.",
        leftLabel: "Eingabe",
        rightLabel: "Ausgabe",
        terms: [
          { id: "keyboard", label: "Tastatur" },
          { id: "mouse", label: "Maus" },
          { id: "scanner", label: "Scanner" },
          { id: "monitor", label: "Monitor" },
          { id: "printer", label: "Drucker" }
        ],
        answers: {
          keyboard: "left",
          mouse: "left",
          scanner: "left",
          monitor: "right",
          printer: "right"
        },
        source: {
          label: "Encyclopaedia Britannica",
          url: "https://www.britannica.com/technology/computer"
        }
      }
    }
  },
  {
    roundIndex: 9,
    roundLabel: "Kuechen-Quiz",
    questions: {
      number: {
        id: "dozen-count",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 50",
        shortLabel: "Zahl",
        prompt: "Wie viele Stueck sind ein Dutzend?",
        min: 1,
        max: 50,
        answer: 12,
        source: {
          label: "Merriam-Webster",
          url: "https://www.merriam-webster.com/dictionary/dozen"
        }
      },
      percent: {
        id: "cucumber-water-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent Wasser enthaelt eine Gurke ungefaehr?",
        min: 0,
        max: 100,
        answer: 95,
        unitLabel: "%",
        source: {
          label: "USDA FoodData Central",
          url: "https://fdc.nal.usda.gov/"
        }
      },
      rank: {
        id: "food-ph-acidic-basic",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne nach typischem pH-Wert, sauer nach weniger sauer.",
        directionLabel: "sauer nach weniger sauer",
        items: [
          { id: "lemon", label: "Zitronensaft" },
          { id: "coffee", label: "Kaffee" },
          { id: "milk", label: "Milch" }
        ],
        answerOrder: ["lemon", "coffee", "milk"],
        source: {
          label: "Clemson Cooperative Extension",
          url: "https://hgic.clemson.edu/factsheet/canning-foods-the-ph-factor/"
        }
      },
      assign: {
        id: "grain-or-legume",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Lebensmittel zu: Getreide oder Huelsenfrucht.",
        leftLabel: "Getreide",
        rightLabel: "Huelse",
        terms: [
          { id: "rice", label: "Reis" },
          { id: "wheat", label: "Weizen" },
          { id: "oats", label: "Hafer" },
          { id: "lentil", label: "Linse" },
          { id: "chickpea", label: "Kichererbse" }
        ],
        answers: {
          rice: "left",
          wheat: "left",
          oats: "left",
          lentil: "right",
          chickpea: "right"
        },
        source: {
          label: "FAO",
          url: "https://www.fao.org/pulses-2016/news/news-detail/en/c/337107/"
        }
      }
    }
  },
  {
    roundIndex: 10,
    roundLabel: "Zeitmaschine",
    questions: {
      number: {
        id: "weeks-in-year",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 100",
        shortLabel: "Zahl",
        prompt: "Wie viele Wochen hat ein Jahr ungefaehr?",
        min: 1,
        max: 100,
        answer: 52,
        source: {
          label: "Time and Date",
          url: "https://www.timeanddate.com/date/week-numbers.html"
        }
      },
      percent: {
        id: "quarter-century-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent eines Jahrhunderts sind 25 Jahre?",
        min: 0,
        max: 100,
        answer: 25,
        unitLabel: "%",
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/science/century-time"
        }
      },
      rank: {
        id: "buildings-old-new",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne diese Bauwerke nach Entstehung, aeltestes zuerst.",
        directionLabel: "aeltestes zuerst",
        items: [
          { id: "giza", label: "Pyramiden von Gizeh" },
          { id: "colosseum", label: "Kolosseum" },
          { id: "eiffel", label: "Eiffelturm" }
        ],
        answerOrder: ["giza", "colosseum", "eiffel"],
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/list/7-of-the-worlds-most-remarkable-ancient-structures"
        }
      },
      assign: {
        id: "greek-or-roman-gods",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Gottheiten zu: griechisch oder roemisch.",
        leftLabel: "Griechisch",
        rightLabel: "Roemisch",
        terms: [
          { id: "zeus", label: "Zeus" },
          { id: "athena", label: "Athena" },
          { id: "aphrodite", label: "Aphrodite" },
          { id: "jupiter", label: "Jupiter" },
          { id: "mars", label: "Mars" }
        ],
        answers: {
          zeus: "left",
          athena: "left",
          aphrodite: "left",
          jupiter: "right",
          mars: "right"
        },
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/topic/Greek-mythology"
        }
      }
    }
  },
  {
    roundIndex: 11,
    roundLabel: "Sportplatz",
    questions: {
      number: {
        id: "football-team-players",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 50",
        shortLabel: "Zahl",
        prompt: "Wie viele Spieler stehen bei einer Fussballmannschaft normalerweise gleichzeitig auf dem Feld?",
        min: 1,
        max: 50,
        answer: 11,
        source: {
          label: "IFAB Laws of the Game",
          url: "https://www.theifab.com/laws/latest/the-players/"
        }
      },
      percent: {
        id: "half-marathon-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent eines Marathons sind ein Halbmarathon?",
        min: 0,
        max: 100,
        answer: 50,
        unitLabel: "%",
        source: {
          label: "World Athletics",
          url: "https://worldathletics.org/disciplines/road-running/marathon"
        }
      },
      rank: {
        id: "ball-diameter-large-small",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Baelle nach typischem Durchmesser, groesster zuerst.",
        directionLabel: "groesster zuerst",
        items: [
          { id: "basketball", label: "Basketball" },
          { id: "football", label: "Fussball" },
          { id: "tennis", label: "Tennisball" }
        ],
        answerOrder: ["basketball", "football", "tennis"],
        source: {
          label: "FIBA / IFAB / ITF",
          url: "https://www.fiba.basketball/documents"
        }
      },
      assign: {
        id: "board-or-card-games",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Spiele zu: Brettspiel oder Kartenspiel.",
        leftLabel: "Brett",
        rightLabel: "Karten",
        terms: [
          { id: "chess", label: "Schach" },
          { id: "monopoly", label: "Monopoly" },
          { id: "go", label: "Go" },
          { id: "poker", label: "Poker" },
          { id: "skat", label: "Skat" }
        ],
        answers: {
          chess: "left",
          monopoly: "left",
          go: "left",
          poker: "right",
          skat: "right"
        },
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/topic/game-recreation"
        }
      }
    }
  },
  {
    roundIndex: 12,
    roundLabel: "Chemie-Labor",
    questions: {
      number: {
        id: "carbon-atomic-number",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 50",
        shortLabel: "Zahl",
        prompt: "Welche Ordnungszahl hat Kohlenstoff?",
        min: 1,
        max: 50,
        answer: 6,
        source: {
          label: "Royal Society of Chemistry",
          url: "https://www.rsc.org/periodic-table/element/6/carbon"
        }
      },
      percent: {
        id: "h2o-hydrogen-atom-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent der Atome in H2O sind Wasserstoffatome?",
        min: 0,
        max: 100,
        answer: 67,
        unitLabel: "%",
        source: {
          label: "Royal Society of Chemistry",
          url: "https://www.rsc.org/periodic-table/compound/962/water"
        }
      },
      rank: {
        id: "ph-acid-neutral-basic",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne nach typischem pH-Wert, sauer nach basisch.",
        directionLabel: "sauer nach basisch",
        items: [
          { id: "vinegar", label: "Essig" },
          { id: "water", label: "Reines Wasser" },
          { id: "ammonia", label: "Ammoniakloesung" }
        ],
        answerOrder: ["vinegar", "water", "ammonia"],
        source: {
          label: "USGS",
          url: "https://www.usgs.gov/special-topics/water-science-school/science/ph-and-water"
        }
      },
      assign: {
        id: "element-or-compound",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne zu: chemisches Element oder chemische Verbindung.",
        leftLabel: "Element",
        rightLabel: "Verbindung",
        terms: [
          { id: "oxygen", label: "Sauerstoff" },
          { id: "carbon", label: "Kohlenstoff" },
          { id: "water", label: "Wasser" },
          { id: "co2", label: "Kohlenstoffdioxid" },
          { id: "salt", label: "Natriumchlorid" }
        ],
        answers: {
          oxygen: "left",
          carbon: "left",
          water: "right",
          co2: "right",
          salt: "right"
        },
        source: {
          label: "OpenStax Chemistry",
          url: "https://openstax.org/books/chemistry-2e/pages/2-1-early-ideas-in-atomic-theory"
        }
      }
    }
  },
  {
    roundIndex: 13,
    roundLabel: "Geo-Globus",
    questions: {
      number: {
        id: "continents-count",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 50",
        shortLabel: "Zahl",
        prompt: "Wie viele Kontinente werden im haeufig verwendeten Modell gezaehlt?",
        min: 1,
        max: 50,
        answer: 7,
        source: {
          label: "National Geographic",
          url: "https://education.nationalgeographic.org/resource/Continent/"
        }
      },
      percent: {
        id: "earth-water-saltwater-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent des Wassers auf der Erde sind Salzwasser?",
        min: 0,
        max: 100,
        answer: 97,
        unitLabel: "%",
        source: {
          label: "USGS",
          url: "https://www.usgs.gov/water-science-school/science/how-much-water-there-earth"
        }
      },
      rank: {
        id: "mountains-height-high-low",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Berge nach Hoehe, hoechster zuerst.",
        directionLabel: "hoechster zuerst",
        items: [
          { id: "everest", label: "Mount Everest" },
          { id: "kilimanjaro", label: "Kilimandscharo" },
          { id: "zugspitze", label: "Zugspitze" }
        ],
        answerOrder: ["everest", "kilimanjaro", "zugspitze"],
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/place/Mount-Everest"
        }
      },
      assign: {
        id: "europe-or-asia-cities",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Staedte zu: Europa oder Asien.",
        leftLabel: "Europa",
        rightLabel: "Asien",
        terms: [
          { id: "berlin", label: "Berlin" },
          { id: "paris", label: "Paris" },
          { id: "oslo", label: "Oslo" },
          { id: "tokyo", label: "Tokio" },
          { id: "seoul", label: "Seoul" }
        ],
        answers: {
          berlin: "left",
          paris: "left",
          oslo: "left",
          tokyo: "right",
          seoul: "right"
        },
        source: {
          label: "CIA World Factbook",
          url: "https://www.cia.gov/the-world-factbook/"
        }
      }
    }
  },
  {
    roundIndex: 14,
    roundLabel: "Mathe-Mixer",
    questions: {
      number: {
        id: "cube-faces",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 50",
        shortLabel: "Zahl",
        prompt: "Wie viele Flaechen hat ein Wuerfel?",
        min: 1,
        max: 50,
        answer: 6,
        source: {
          label: "MathWorld",
          url: "https://mathworld.wolfram.com/Cube.html"
        }
      },
      percent: {
        id: "right-angle-circle-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent eines Vollkreises entsprechen 90 Grad?",
        min: 0,
        max: 100,
        answer: 25,
        unitLabel: "%",
        source: {
          label: "MathWorld",
          url: "https://mathworld.wolfram.com/Degree.html"
        }
      },
      rank: {
        id: "polygons-corners-small-large",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Vielecke nach Anzahl der Ecken, klein nach gross.",
        directionLabel: "klein nach gross",
        items: [
          { id: "octagon", label: "Achteck" },
          { id: "triangle", label: "Dreieck" },
          { id: "pentagon", label: "Fuenfeck" }
        ],
        answerOrder: ["triangle", "pentagon", "octagon"],
        source: {
          label: "MathWorld",
          url: "https://mathworld.wolfram.com/Polygon.html"
        }
      },
      assign: {
        id: "prime-or-composite",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Zahlen zu: Primzahl oder zusammengesetzte Zahl.",
        leftLabel: "Prim",
        rightLabel: "Zusammengesetzt",
        terms: [
          { id: "two", label: "2" },
          { id: "three", label: "3" },
          { id: "four", label: "4" },
          { id: "nine", label: "9" },
          { id: "fifteen", label: "15" }
        ],
        answers: {
          two: "left",
          three: "left",
          four: "right",
          nine: "right",
          fifteen: "right"
        },
        source: {
          label: "MathWorld",
          url: "https://mathworld.wolfram.com/PrimeNumber.html"
        }
      }
    }
  }  ,
  {
    roundIndex: 15,
    roundLabel: "Kosmos-Kabinett",
    questions: {
      number: {
        id: "iau-constellations-count",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 120",
        shortLabel: "Zahl",
        prompt: "Wie viele offiziell anerkannte Sternbilder gibt es nach der IAU?",
        min: 1,
        max: 120,
        answer: 88,
        source: {
          label: "IAU",
          url: "https://www.iau.org/public/themes/constellations/"
        }
      },
      percent: {
        id: "visible-moon-surface-from-earth",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent der Mondoberflaeche koennen wir von der Erde aus insgesamt ungefaehr sehen?",
        min: 0,
        max: 100,
        answer: 59,
        unitLabel: "%",
        source: {
          label: "NASA",
          url: "https://science.nasa.gov/moon/"
        }
      },
      rank: {
        id: "planet-density-rank",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Planeten nach mittlerer Dichte, hoechste zuerst.",
        directionLabel: "hoechste Dichte zuerst",
        items: [
          { id: "earth", label: "Erde" },
          { id: "mercury", label: "Merkur" },
          { id: "venus", label: "Venus" }
        ],
        answerOrder: ["earth", "mercury", "venus"],
        source: {
          label: "NASA Planetary Fact Sheet",
          url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/index.html"
        }
      },
      assign: {
        id: "galilean-moons-inner-outer",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Galileischen Monde zu: innere oder aeussere Umlaufbahn.",
        leftLabel: "Innen",
        rightLabel: "Aussen",
        terms: [
          { id: "io", label: "Io" },
          { id: "europa", label: "Europa" },
          { id: "ganymede", label: "Ganymed" },
          { id: "callisto", label: "Kallisto" },
          { id: "titan", label: "Titan" }
        ],
        answers: {
          io: "left",
          europa: "left",
          ganymede: "right",
          callisto: "right",
          titan: "right"
        },
        source: {
          label: "NASA",
          url: "https://science.nasa.gov/jupiter/moons/"
        }
      }
    }
  },
  {
    roundIndex: 16,
    roundLabel: "Elemente-Examen",
    questions: {
      number: {
        id: "single-letter-element-symbols",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 30",
        shortLabel: "Zahl",
        prompt: "Wie viele chemische Elemente haben ein einbuchstabiges Elementsymbol?",
        min: 1,
        max: 30,
        answer: 14,
        source: {
          label: "Royal Society of Chemistry",
          url: "https://www.rsc.org/periodic-table"
        }
      },
      percent: {
        id: "earth-crust-oxygen-mass",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent der Masse der Erdkruste bestehen ungefaehr aus Sauerstoff?",
        min: 0,
        max: 100,
        answer: 47,
        unitLabel: "%",
        source: {
          label: "OpenStax Chemistry",
          url: "https://openstax.org/books/chemistry-2e/pages/18-1-periodicity"
        }
      },
      rank: {
        id: "metal-melting-points",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Metalle nach Schmelzpunkt, hoechster zuerst.",
        directionLabel: "hoechster Schmelzpunkt zuerst",
        items: [
          { id: "tungsten", label: "Wolfram" },
          { id: "iron", label: "Eisen" },
          { id: "aluminium", label: "Aluminium" }
        ],
        answerOrder: ["tungsten", "iron", "aluminium"],
        source: {
          label: "Royal Society of Chemistry",
          url: "https://www.rsc.org/periodic-table"
        }
      },
      assign: {
        id: "dna-rna-bases",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Basen zu: DNA, RNA oder beides.",
        leftLabel: "DNA",
        rightLabel: "RNA",
        terms: [
          { id: "adenine", label: "Adenin" },
          { id: "guanine", label: "Guanin" },
          { id: "cytosine", label: "Cytosin" },
          { id: "thymine", label: "Thymin" },
          { id: "uracil", label: "Uracil" }
        ],
        answers: {
          adenine: "both",
          guanine: "both",
          cytosine: "both",
          thymine: "left",
          uracil: "right"
        },
        source: {
          label: "Nature Education",
          url: "https://www.nature.com/scitable/definition/nucleotide-256/"
        }
      }
    }
  },
  {
    roundIndex: 17,
    roundLabel: "Geschichts-Geraet",
    questions: {
      number: {
        id: "roman-emperor-augustus-reign-years",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 100",
        shortLabel: "Zahl",
        prompt: "Wie viele Jahre regierte Augustus als erster roemischer Kaiser ungefaehr?",
        min: 1,
        max: 100,
        answer: 41,
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/biography/Augustus-Roman-emperor"
        }
      },
      percent: {
        id: "quarter-millennium-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent eines Jahrtausends sind 250 Jahre?",
        min: 0,
        max: 100,
        answer: 25,
        unitLabel: "%",
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/science/millennium"
        }
      },
      rank: {
        id: "historical-events-chronology",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Ereignisse chronologisch, frueh nach spaet.",
        directionLabel: "frueh nach spaet",
        items: [
          { id: "magna-carta", label: "Magna Carta" },
          { id: "constantinople", label: "Fall Konstantinopels" },
          { id: "reformation", label: "Luthers Thesen" }
        ],
        answerOrder: ["magna-carta", "constantinople", "reformation"],
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/event/Magna-Carta"
        }
      },
      assign: {
        id: "ancient-civilizations-rivers",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Begriffe zu: Aegypten/Nil oder Mesopotamien/Euphrat-Tigris.",
        leftLabel: "Nil",
        rightLabel: "Mesopotamien",
        terms: [
          { id: "pyramids", label: "Pyramiden von Gizeh" },
          { id: "pharaoh", label: "Pharao" },
          { id: "hieroglyphs", label: "Hieroglyphen" },
          { id: "babylon", label: "Babylon" },
          { id: "hammurabi", label: "Hammurabi" }
        ],
        answers: {
          pyramids: "left",
          pharaoh: "left",
          hieroglyphs: "left",
          babylon: "right",
          hammurabi: "right"
        },
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/place/Mesopotamia-historical-region-Asia"
        }
      }
    }
  },
  {
    roundIndex: 18,
    roundLabel: "Mathe-Master",
    questions: {
      number: {
        id: "platonic-solids-count",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 20",
        shortLabel: "Zahl",
        prompt: "Wie viele platonische Koerper gibt es?",
        min: 1,
        max: 20,
        answer: 5,
        source: {
          label: "MathWorld",
          url: "https://mathworld.wolfram.com/PlatonicSolid.html"
        }
      },
      percent: {
        id: "normal-distribution-one-sigma",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent einer Normalverteilung liegen ungefaehr innerhalb von plus/minus einer Standardabweichung?",
        min: 0,
        max: 100,
        answer: 68,
        unitLabel: "%",
        source: {
          label: "NIST",
          url: "https://www.itl.nist.gov/div898/handbook/eda/section3/eda3661.htm"
        }
      },
      rank: {
        id: "growth-functions-rank",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Funktionen nach Wachstum fuer grosse x, langsam nach schnell.",
        directionLabel: "langsam nach schnell",
        items: [
          { id: "log", label: "log(x)" },
          { id: "quadratic", label: "x^2" },
          { id: "exponential", label: "2^x" }
        ],
        answerOrder: ["log", "quadratic", "exponential"],
        source: {
          label: "OpenStax Calculus",
          url: "https://openstax.org/books/calculus-volume-1/pages/6-8-exponential-growth-and-decay"
        }
      },
      assign: {
        id: "prime-composite-hard",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Zahlen zu: Primzahl oder zusammengesetzt.",
        leftLabel: "Prim",
        rightLabel: "Zusammengesetzt",
        terms: [
          { id: "twenty-nine", label: "29" },
          { id: "thirty-one", label: "31" },
          { id: "forty-nine", label: "49" },
          { id: "fifty-one", label: "51" },
          { id: "ninety-seven", label: "97" }
        ],
        answers: {
          "twenty-nine": "left",
          "thirty-one": "left",
          "forty-nine": "right",
          "fifty-one": "right",
          "ninety-seven": "left"
        },
        source: {
          label: "MathWorld",
          url: "https://mathworld.wolfram.com/PrimeNumber.html"
        }
      }
    }
  },
  {
    roundIndex: 19,
    roundLabel: "Code-Kammer",
    questions: {
      number: {
        id: "ipv4-address-bits",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 100",
        shortLabel: "Zahl",
        prompt: "Wie viele Bits hat eine IPv4-Adresse?",
        min: 1,
        max: 100,
        answer: 32,
        source: {
          label: "RFC 791",
          url: "https://www.rfc-editor.org/rfc/rfc791"
        }
      },
      percent: {
        id: "byte-nibble-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent eines Bytes sind ein Nibble?",
        min: 0,
        max: 100,
        answer: 50,
        unitLabel: "%",
        source: {
          label: "NIST",
          url: "https://csrc.nist.gov/glossary/term/nibble"
        }
      },
      rank: {
        id: "algorithm-complexity-rank",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Laufzeitklassen fuer grosse n, schnell nach langsam.",
        directionLabel: "schnell nach langsam",
        items: [
          { id: "linear", label: "O(n)" },
          { id: "loglinear", label: "O(n log n)" },
          { id: "quadratic", label: "O(n^2)" }
        ],
        answerOrder: ["linear", "loglinear", "quadratic"],
        source: {
          label: "OpenDSA",
          url: "https://opendsa-server.cs.vt.edu/ODSA/Books/CS3/html/AnalProgram.html"
        }
      },
      assign: {
        id: "static-dynamic-languages",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Programmiersprachen grob zu: statisch typisiert oder dynamisch typisiert.",
        leftLabel: "Statisch",
        rightLabel: "Dynamisch",
        terms: [
          { id: "typescript", label: "TypeScript" },
          { id: "csharp", label: "C#" },
          { id: "java", label: "Java" },
          { id: "python", label: "Python" },
          { id: "javascript", label: "JavaScript" }
        ],
        answers: {
          typescript: "left",
          csharp: "left",
          java: "left",
          python: "right",
          javascript: "right"
        },
        source: {
          label: "MDN / TypeScript",
          url: "https://www.typescriptlang.org/docs/"
        }
      }
    }
  },
  {
    roundIndex: 20,
    roundLabel: "Sprach-Salon",
    questions: {
      number: {
        id: "un-official-languages",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 20",
        shortLabel: "Zahl",
        prompt: "Wie viele Amtssprachen haben die Vereinten Nationen?",
        min: 1,
        max: 20,
        answer: 6,
        source: {
          label: "United Nations",
          url: "https://www.un.org/en/our-work/official-languages"
        }
      },
      percent: {
        id: "english-vowels-alphabet-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent der 26 Buchstaben des englischen Alphabets sind klassische Vokale A, E, I, O, U?",
        min: 0,
        max: 100,
        answer: 19,
        unitLabel: "%",
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/topic/alphabet-writing"
        }
      },
      rank: {
        id: "writing-systems-age",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Schriftsysteme nach historischer Entstehung, aeltestes zuerst.",
        directionLabel: "aeltestes zuerst",
        items: [
          { id: "cuneiform", label: "Keilschrift" },
          { id: "greek", label: "Griechisches Alphabet" },
          { id: "latin", label: "Lateinisches Alphabet" }
        ],
        answerOrder: ["cuneiform", "greek", "latin"],
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/topic/cuneiform"
        }
      },
      assign: {
        id: "language-families-europe",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Sprachen zu: germanisch oder romanisch.",
        leftLabel: "Germanisch",
        rightLabel: "Romanisch",
        terms: [
          { id: "german", label: "Deutsch" },
          { id: "english", label: "Englisch" },
          { id: "dutch", label: "Niederlaendisch" },
          { id: "french", label: "Franzoesisch" },
          { id: "spanish", label: "Spanisch" }
        ],
        answers: {
          german: "left",
          english: "left",
          dutch: "left",
          french: "right",
          spanish: "right"
        },
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/topic/Indo-European-languages"
        }
      }
    }
  },
  {
    roundIndex: 21,
    roundLabel: "Erdzeit-Archiv",
    questions: {
      number: {
        id: "geological-periods-phanerozoic",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 20",
        shortLabel: "Zahl",
        prompt: "Wie viele geologische Perioden umfasst das Phanerozoikum normalerweise?",
        min: 1,
        max: 20,
        answer: 12,
        source: {
          label: "International Commission on Stratigraphy",
          url: "https://stratigraphy.org/chart"
        }
      },
      percent: {
        id: "earth-age-cretaceous-start-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Die Kreidezeit begann vor etwa 145 Mio. Jahren. Wie viel Prozent des Erdalters von ca. 4,54 Mrd. Jahren sind das?",
        min: 0,
        max: 100,
        answer: 3,
        unitLabel: "%",
        source: {
          label: "ICS / USGS",
          url: "https://stratigraphy.org/chart"
        }
      },
      rank: {
        id: "geological-periods-old-young",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die geologischen Perioden chronologisch, alt nach jung.",
        directionLabel: "alt nach jung",
        items: [
          { id: "cambrian", label: "Kambrium" },
          { id: "jurassic", label: "Jura" },
          { id: "quaternary", label: "Quartaer" }
        ],
        answerOrder: ["cambrian", "jurassic", "quaternary"],
        source: {
          label: "International Commission on Stratigraphy",
          url: "https://stratigraphy.org/chart"
        }
      },
      assign: {
        id: "paleozoic-mesozoic-periods",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Perioden zu: Palaeozoikum oder Mesozoikum.",
        leftLabel: "Palaeozoikum",
        rightLabel: "Mesozoikum",
        terms: [
          { id: "cambrian", label: "Kambrium" },
          { id: "devonian", label: "Devon" },
          { id: "permian", label: "Perm" },
          { id: "triassic", label: "Trias" },
          { id: "cretaceous", label: "Kreide" }
        ],
        answers: {
          cambrian: "left",
          devonian: "left",
          permian: "left",
          triassic: "right",
          cretaceous: "right"
        },
        source: {
          label: "International Commission on Stratigraphy",
          url: "https://stratigraphy.org/chart"
        }
      }
    }
  },
  {
    roundIndex: 22,
    roundLabel: "Kultur-Knobler",
    questions: {
      number: {
        id: "shakespeare-sonnets-count",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 200",
        shortLabel: "Zahl",
        prompt: "Wie viele Sonette von William Shakespeare sind bekannt?",
        min: 1,
        max: 200,
        answer: 154,
        source: {
          label: "Folger Shakespeare Library",
          url: "https://www.folger.edu/explore/shakespeares-works/shakespeares-sonnets/"
        }
      },
      percent: {
        id: "golden-ratio-inverse-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Der Kehrwert des Goldenen Schnitts entspricht ungefaehr wie viel Prozent?",
        min: 0,
        max: 100,
        answer: 62,
        unitLabel: "%",
        source: {
          label: "MathWorld",
          url: "https://mathworld.wolfram.com/GoldenRatio.html"
        }
      },
      rank: {
        id: "classical-composers-chronology",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Komponisten nach Geburtsjahr, frueh nach spaet.",
        directionLabel: "frueh nach spaet",
        items: [
          { id: "bach", label: "J. S. Bach" },
          { id: "mozart", label: "Mozart" },
          { id: "beethoven", label: "Beethoven" }
        ],
        answerOrder: ["bach", "mozart", "beethoven"],
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/biography/Johann-Sebastian-Bach"
        }
      },
      assign: {
        id: "art-periods-modern-or-older",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Kunstrichtungen grob zu: vor 1900 oder ab 1900.",
        leftLabel: "Vor 1900",
        rightLabel: "Ab 1900",
        terms: [
          { id: "renaissance", label: "Renaissance" },
          { id: "baroque", label: "Barock" },
          { id: "impressionism", label: "Impressionismus" },
          { id: "cubism", label: "Kubismus" },
          { id: "surrealism", label: "Surrealismus" }
        ],
        answers: {
          renaissance: "left",
          baroque: "left",
          impressionism: "left",
          cubism: "right",
          surrealism: "right"
        },
        source: {
          label: "MoMA / Britannica",
          url: "https://www.moma.org/learn/moma_learning/themes/cubism/"
        }
      }
    }
  }  ,
  {
    roundIndex: 23,
    roundLabel: "Bar-Lexikon",
    questions: {
      number: {
        id: "playing-cards-standard-deck",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 100",
        shortLabel: "Zahl",
        prompt: "Wie viele Karten hat ein franzoesisches Standardkartenspiel ohne Joker?",
        min: 1,
        max: 100,
        answer: 52,
        source: {
          label: "Bicycle Cards",
          url: "https://bicyclecards.com/how-to-play/basics"
        }
      },
      percent: {
        id: "vodka-eu-minimum-abv",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Welchen Mindestalkoholgehalt muss Wodka in der EU ungefaehr haben?",
        min: 0,
        max: 100,
        answer: 38,
        unitLabel: "%",
        source: {
          label: "EU Spirit Drinks Regulation",
          url: "https://eur-lex.europa.eu/eli/reg/2019/787/oj"
        }
      },
      rank: {
        id: "drinks-abv-rank-hard",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Getraenke nach typischem Alkoholgehalt, hoch nach niedrig.",
        directionLabel: "hoch nach niedrig",
        items: [
          { id: "vodka", label: "Wodka" },
          { id: "wine", label: "Wein" },
          { id: "beer", label: "Bier" }
        ],
        answerOrder: ["vodka", "wine", "beer"],
        source: {
          label: "BZgA",
          url: "https://www.kenn-dein-limit.de/alkohol/alkoholwissen/alkoholgehalt/"
        }
      },
      assign: {
        id: "fermented-or-distilled-drinks",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Getraenke zu: vergoren oder destilliert.",
        leftLabel: "Vergoren",
        rightLabel: "Destilliert",
        terms: [
          { id: "beer", label: "Bier" },
          { id: "wine", label: "Wein" },
          { id: "cider", label: "Cider" },
          { id: "vodka", label: "Wodka" },
          { id: "rum", label: "Rum" }
        ],
        answers: {
          beer: "left",
          wine: "left",
          cider: "left",
          vodka: "right",
          rum: "right"
        },
        source: {
          label: "EU Spirit Drinks Regulation",
          url: "https://eur-lex.europa.eu/eli/reg/2019/787/oj"
        }
      }
    }
  },
  {
    roundIndex: 24,
    roundLabel: "Casino-Couch",
    questions: {
      number: {
        id: "european-roulette-fields",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 50",
        shortLabel: "Zahl",
        prompt: "Wie viele Zahlenfelder hat ein europaeisches Roulette-Rad inklusive Null?",
        min: 1,
        max: 50,
        answer: 37,
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/topic/roulette-gambling-game"
        }
      },
      percent: {
        id: "european-roulette-red-chance",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie hoch ist beim europaeischen Roulette die Chance auf Rot ungefaehr?",
        min: 0,
        max: 100,
        answer: 49,
        unitLabel: "%",
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/topic/roulette-gambling-game"
        }
      },
      rank: {
        id: "poker-hand-rank-hard",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Pokerhaende nach Staerke, stark nach schwach.",
        directionLabel: "stark nach schwach",
        items: [
          { id: "flush", label: "Flush" },
          { id: "straight", label: "Straight" },
          { id: "full-house", label: "Full House" }
        ],
        answerOrder: ["full-house", "flush", "straight"],
        source: {
          label: "World Series of Poker",
          url: "https://www.wsop.com/poker-hands/"
        }
      },
      assign: {
        id: "casino-card-or-not",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Casinospiele zu: Kartenspiel oder kein Kartenspiel.",
        leftLabel: "Karten",
        rightLabel: "Keine Karten",
        terms: [
          { id: "poker", label: "Poker" },
          { id: "blackjack", label: "Blackjack" },
          { id: "baccarat", label: "Baccarat" },
          { id: "roulette", label: "Roulette" },
          { id: "craps", label: "Craps" }
        ],
        answers: {
          poker: "left",
          blackjack: "left",
          baccarat: "left",
          roulette: "right",
          craps: "right"
        },
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/topic/gambling"
        }
      }
    }
  },
  {
    roundIndex: 25,
    roundLabel: "Verhuetungs-Wissen",
    questions: {
      number: {
        id: "human-gamete-chromosomes",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 50",
        shortLabel: "Zahl",
        prompt: "Wie viele Chromosomen enthaelt eine menschliche Ei- oder Samenzelle normalerweise?",
        min: 1,
        max: 50,
        answer: 23,
        source: {
          label: "National Human Genome Research Institute",
          url: "https://www.genome.gov/genetics-glossary/Chromosome"
        }
      },
      percent: {
        id: "condom-perfect-use-effectiveness",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie wirksam ist ein Kondom bei perfekter Anwendung ungefaehr?",
        min: 0,
        max: 100,
        answer: 98,
        unitLabel: "%",
        source: {
          label: "NHS",
          url: "https://www.nhs.uk/contraception/"
        }
      },
      rank: {
        id: "contraception-duration-rank-knowledge",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Verhuetungsmethoden nach typischer Wirkdauer, lang nach kurz.",
        directionLabel: "lang nach kurz",
        items: [
          { id: "copper-iud", label: "Kupferspirale" },
          { id: "implant", label: "Hormonimplantat" },
          { id: "condom", label: "Kondom" }
        ],
        answerOrder: ["copper-iud", "implant", "condom"],
        source: {
          label: "NHS",
          url: "https://www.nhs.uk/contraception/"
        }
      },
      assign: {
        id: "contraception-barrier-hormonal-hard",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Verhuetungsmethoden zu: Barriere oder hormonell.",
        leftLabel: "Barriere",
        rightLabel: "Hormonell",
        terms: [
          { id: "condom", label: "Kondom" },
          { id: "diaphragm", label: "Diaphragma" },
          { id: "pill", label: "Pille" },
          { id: "hormonal-ring", label: "Hormonring" },
          { id: "hormonal-implant", label: "Hormonimplantat" }
        ],
        answers: {
          condom: "left",
          diaphragm: "left",
          pill: "right",
          "hormonal-ring": "right",
          "hormonal-implant": "right"
        },
        source: {
          label: "NHS",
          url: "https://www.nhs.uk/contraception/"
        }
      }
    }
  },
  {
    roundIndex: 26,
    roundLabel: "STI-Steckbrief",
    questions: {
      number: {
        id: "hpv-types-count",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 300",
        shortLabel: "Zahl",
        prompt: "Wie viele humane Papillomvirus-Typen sind ungefaehr bekannt?",
        min: 1,
        max: 300,
        answer: 200,
        source: {
          label: "CDC",
          url: "https://www.cdc.gov/hpv/about/index.html"
        }
      },
      percent: {
        id: "cervical-cancer-hpv-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent der Gebaermutterhalskrebsfaelle werden weltweit ungefaehr durch HPV verursacht?",
        min: 0,
        max: 100,
        answer: 95,
        unitLabel: "%",
        source: {
          label: "WHO",
          url: "https://www.who.int/news-room/fact-sheets/detail/human-papilloma-virus-and-cancer"
        }
      },
      rank: {
        id: "sti-pathogen-size-rank",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Erreger grob nach Groesse, klein nach gross.",
        directionLabel: "klein nach gross",
        items: [
          { id: "hiv", label: "HIV" },
          { id: "chlamydia", label: "Chlamydien" },
          { id: "pubic-louse", label: "Filzlaus" }
        ],
        answerOrder: ["hiv", "chlamydia", "pubic-louse"],
        source: {
          label: "CDC",
          url: "https://www.cdc.gov/sti/about/index.html"
        }
      },
      assign: {
        id: "sti-virus-or-bacteria",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Erreger/Krankheiten zu: viral oder bakteriell.",
        leftLabel: "Viral",
        rightLabel: "Bakteriell",
        terms: [
          { id: "hiv", label: "HIV" },
          { id: "hpv", label: "HPV" },
          { id: "herpes", label: "Herpes" },
          { id: "chlamydia", label: "Chlamydien" },
          { id: "gonorrhea", label: "Gonorrhoe" }
        ],
        answers: {
          hiv: "left",
          hpv: "left",
          herpes: "left",
          chlamydia: "right",
          gonorrhea: "right"
        },
        source: {
          label: "CDC",
          url: "https://www.cdc.gov/sti/about/index.html"
        }
      }
    }
  },
  {
    roundIndex: 27,
    roundLabel: "FSK-Filmrolle",
    questions: {
      number: {
        id: "fsk-age-ratings-count",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 20",
        shortLabel: "Zahl",
        prompt: "Wie viele klassische FSK-Altersfreigaben mit Altersstufe gibt es?",
        min: 1,
        max: 20,
        answer: 5,
        source: {
          label: "FSK",
          url: "https://www.fsk.de/"
        }
      },
      percent: {
        id: "rottentomatoes-fresh-threshold",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Ab welchem Tomatometer-Wert gilt ein Film bei Rotten Tomatoes normalerweise als Fresh?",
        min: 0,
        max: 100,
        answer: 60,
        unitLabel: "%",
        source: {
          label: "Rotten Tomatoes",
          url: "https://www.rottentomatoes.com/about"
        }
      },
      rank: {
        id: "adult-themed-films-chronology",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Filme nach Erstveroeffentlichung, alt nach neu.",
        directionLabel: "alt nach neu",
        items: [
          { id: "basic-instinct", label: "Basic Instinct" },
          { id: "eyes-wide-shut", label: "Eyes Wide Shut" },
          { id: "fifty-shades", label: "Fifty Shades of Grey" }
        ],
        answerOrder: ["basic-instinct", "eyes-wide-shut", "fifty-shades"],
        source: {
          label: "IMDb",
          url: "https://www.imdb.com/"
        }
      },
      assign: {
        id: "movie-directors-tarantino-nolan-hard",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Filme zu: Quentin Tarantino oder Christopher Nolan.",
        leftLabel: "Tarantino",
        rightLabel: "Nolan",
        terms: [
          { id: "pulp-fiction", label: "Pulp Fiction" },
          { id: "kill-bill", label: "Kill Bill" },
          { id: "django", label: "Django Unchained" },
          { id: "inception", label: "Inception" },
          { id: "oppenheimer", label: "Oppenheimer" }
        ],
        answers: {
          "pulp-fiction": "left",
          "kill-bill": "left",
          django: "left",
          inception: "right",
          oppenheimer: "right"
        },
        source: {
          label: "IMDb",
          url: "https://www.imdb.com/"
        }
      }
    }
  },
  {
    roundIndex: 28,
    roundLabel: "Spirituosenkunde",
    questions: {
      number: {
        id: "cognac-xo-minimum-age",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 30",
        shortLabel: "Zahl",
        prompt: "Wie viele Jahre muss der juengste Brand in Cognac XO mindestens im Fass gereift sein?",
        min: 1,
        max: 30,
        answer: 10,
        source: {
          label: "Bureau National Interprofessionnel du Cognac",
          url: "https://www.cognac.fr/en/cognac/how-to-drink-cognac/age-designations/"
        }
      },
      percent: {
        id: "gin-eu-minimum-abv",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Welchen Mindestalkoholgehalt muss Gin in der EU ungefaehr haben?",
        min: 0,
        max: 100,
        answer: 38,
        unitLabel: "%",
        source: {
          label: "EU Spirit Drinks Regulation",
          url: "https://eur-lex.europa.eu/eli/reg/2019/787/oj"
        }
      },
      rank: {
        id: "cognac-age-designations",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Cognac-Altersbezeichnungen nach Mindestalter, alt nach jung.",
        directionLabel: "alt nach jung",
        items: [
          { id: "vs", label: "VS" },
          { id: "vsop", label: "VSOP" },
          { id: "xo", label: "XO" }
        ],
        answerOrder: ["xo", "vsop", "vs"],
        source: {
          label: "Bureau National Interprofessionnel du Cognac",
          url: "https://www.cognac.fr/en/cognac/how-to-drink-cognac/age-designations/"
        }
      },
      assign: {
        id: "spirit-origin-france-italy",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Getraenke/Begriffe grob ihrem Ursprungsland zu: Frankreich oder Italien.",
        leftLabel: "Frankreich",
        rightLabel: "Italien",
        terms: [
          { id: "cognac", label: "Cognac" },
          { id: "calvados", label: "Calvados" },
          { id: "champagne", label: "Champagne" },
          { id: "prosecco", label: "Prosecco" },
          { id: "grappa", label: "Grappa" }
        ],
        answers: {
          cognac: "left",
          calvados: "left",
          champagne: "left",
          prosecco: "right",
          grappa: "right"
        },
        source: {
          label: "EU Geographical Indications",
          url: "https://agriculture.ec.europa.eu/farming/geographical-indications-and-quality-schemes_en"
        }
      }
    }
  },
  {
    roundIndex: 29,
    roundLabel: "Erotik-Kultur",
    questions: {
      number: {
        id: "kamasutra-books-count",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 20",
        shortLabel: "Zahl",
        prompt: "Aus wie vielen Buechern besteht das klassische Kamasutra traditionell?",
        min: 1,
        max: 20,
        answer: 7,
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/topic/Kama-sutra"
        }
      },
      percent: {
        id: "kinsey-scale-heterosexual-end",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Welcher Prozentwert entspricht auf einer vereinfachten 0-bis-100-Skala dem ausschliesslich heterosexuellen Ende der Kinsey-Skala?",
        min: 0,
        max: 100,
        answer: 0,
        unitLabel: "%",
        source: {
          label: "Kinsey Institute",
          url: "https://kinseyinstitute.org/research/publications/kinsey-scale.php"
        }
      },
      rank: {
        id: "erotic-literature-chronology",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Werke grob chronologisch, alt nach neu.",
        directionLabel: "alt nach neu",
        items: [
          { id: "kamasutra", label: "Kamasutra" },
          { id: "decameron", label: "Decameron" },
          { id: "lady-chatterley", label: "Lady Chatterley's Lover" }
        ],
        answerOrder: ["kamasutra", "decameron", "lady-chatterley"],
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/topic/Kama-sutra"
        }
      },
      assign: {
        id: "erotic-literature-authors",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Autorinnen und Autoren zu: historisch vor 1900 oder ab 1900.",
        leftLabel: "Vor 1900",
        rightLabel: "Ab 1900",
        terms: [
          { id: "boccaccio", label: "Giovanni Boccaccio" },
          { id: "sade", label: "Marquis de Sade" },
          { id: "casanova", label: "Giacomo Casanova" },
          { id: "dh-lawrence", label: "D. H. Lawrence" },
          { id: "anais-nin", label: "Anais Nin" }
        ],
        answers: {
          boccaccio: "left",
          sade: "left",
          casanova: "left",
          "dh-lawrence": "right",
          "anais-nin": "right"
        },
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/"
        }
      }
    }
  },
  {
    roundIndex: 30,
    roundLabel: "Bier-und-Wein-Probe",
    questions: {
      number: {
        id: "reinheitsgebot-year",
        categoryId: "number",
        kind: "number",
        title: "Jahreszahl",
        shortLabel: "Zahl",
        prompt: "In welchem Jahr wurde das bayerische Reinheitsgebot erlassen?",
        min: 1000,
        max: 2026,
        answer: 1516,
        source: {
          label: "Deutscher Brauer-Bund",
          url: "https://brauer-bund.de/reinheitsgebot/"
        }
      },
      percent: {
        id: "port-wine-typical-abv",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Volumenprozent Alkohol hat Portwein typischerweise ungefaehr?",
        min: 0,
        max: 100,
        answer: 20,
        unitLabel: "%",
        source: {
          label: "Instituto dos Vinhos do Douro e do Porto",
          url: "https://www.ivdp.pt/"
        }
      },
      rank: {
        id: "wine-beer-abv-rank",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne nach typischem Alkoholgehalt, hoch nach niedrig.",
        directionLabel: "hoch nach niedrig",
        items: [
          { id: "port", label: "Portwein" },
          { id: "sparkling-wine", label: "Sekt" },
          { id: "pils", label: "Pils" }
        ],
        answerOrder: ["port", "sparkling-wine", "pils"],
        source: {
          label: "BZgA",
          url: "https://www.kenn-dein-limit.de/alkohol/alkoholwissen/alkoholgehalt/"
        }
      },
      assign: {
        id: "wine-regions-france-italy",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Weinregionen zu: Frankreich oder Italien.",
        leftLabel: "Frankreich",
        rightLabel: "Italien",
        terms: [
          { id: "bordeaux", label: "Bordeaux" },
          { id: "burgundy", label: "Burgund" },
          { id: "champagne", label: "Champagne" },
          { id: "tuscany", label: "Toskana" },
          { id: "piedmont", label: "Piemont" }
        ],
        answers: {
          bordeaux: "left",
          burgundy: "left",
          champagne: "left",
          tuscany: "right",
          piedmont: "right"
        },
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/topic/wine"
        }
      }
    }
  }  ,
  {
    roundIndex: 31,
    roundLabel: "Erde-Extrem",
    questions: {
      number: {
        id: "un-member-states-count",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 250",
        shortLabel: "Zahl",
        prompt: "Wie viele Mitgliedstaaten haben die Vereinten Nationen?",
        min: 1,
        max: 250,
        answer: 193,
        source: {
          label: "United Nations",
          url: "https://www.un.org/en/about-us/member-states"
        }
      },
      percent: {
        id: "earth-land-surface-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent der Erdoberflaeche sind ungefaehr Landflaeche?",
        min: 0,
        max: 100,
        answer: 29,
        unitLabel: "%",
        source: {
          label: "NOAA",
          url: "https://www.noaa.gov/education/resource-collections/ocean-coasts/ocean-floor-features"
        }
      },
      rank: {
        id: "oceans-area-rank",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Ozeane nach Flaeche, groesster zuerst.",
        directionLabel: "groesster zuerst",
        items: [
          { id: "pacific", label: "Pazifik" },
          { id: "atlantic", label: "Atlantik" },
          { id: "indian", label: "Indischer Ozean" }
        ],
        answerOrder: ["pacific", "atlantic", "indian"],
        source: {
          label: "NOAA",
          url: "https://www.noaa.gov/education/resource-collections/ocean-coasts/ocean-floor-features"
        }
      },
      assign: {
        id: "tectonic-plate-or-mountain",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne zu: tektonische Platte oder Gebirge.",
        leftLabel: "Platte",
        rightLabel: "Gebirge",
        terms: [
          { id: "pacific-plate", label: "Pazifische Platte" },
          { id: "eurasian-plate", label: "Eurasische Platte" },
          { id: "nazca-plate", label: "Nazca-Platte" },
          { id: "andes", label: "Anden" },
          { id: "alps", label: "Alpen" }
        ],
        answers: {
          "pacific-plate": "left",
          "eurasian-plate": "left",
          "nazca-plate": "left",
          andes: "right",
          alps: "right"
        },
        source: {
          label: "USGS",
          url: "https://www.usgs.gov/programs/earthquake-hazards/tectonic-plates"
        }
      }
    }
  },
  {
    roundIndex: 32,
    roundLabel: "Wasser-Wissen",
    questions: {
      number: {
        id: "great-lakes-count",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 20",
        shortLabel: "Zahl",
        prompt: "Wie viele Great Lakes gibt es in Nordamerika?",
        min: 1,
        max: 20,
        answer: 5,
        source: {
          label: "NOAA",
          url: "https://oceanservice.noaa.gov/facts/greatlakes.html"
        }
      },
      percent: {
        id: "freshwater-ice-glaciers-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent des Suesswassers der Erde sind ungefaehr in Eis und Gletschern gebunden?",
        min: 0,
        max: 100,
        answer: 69,
        unitLabel: "%",
        source: {
          label: "USGS",
          url: "https://www.usgs.gov/special-topics/water-science-school/science/how-much-water-there-earth"
        }
      },
      rank: {
        id: "lakes-area-rank",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Seen nach Flaeche, groesster zuerst.",
        directionLabel: "groesster zuerst",
        items: [
          { id: "caspian", label: "Kaspisches Meer" },
          { id: "superior", label: "Lake Superior" },
          { id: "victoria", label: "Victoriasee" }
        ],
        answerOrder: ["caspian", "superior", "victoria"],
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/list/9-of-the-worlds-deepest-lakes"
        }
      },
      assign: {
        id: "freshwater-or-saltwater-bodies",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Gewaesser zu: Suesswasser oder Salzwasser.",
        leftLabel: "Suesswasser",
        rightLabel: "Salzwasser",
        terms: [
          { id: "baikal", label: "Baikalsee" },
          { id: "superior", label: "Lake Superior" },
          { id: "victoria", label: "Victoriasee" },
          { id: "dead-sea", label: "Totes Meer" },
          { id: "great-salt-lake", label: "Great Salt Lake" }
        ],
        answers: {
          baikal: "left",
          superior: "left",
          victoria: "left",
          "dead-sea": "right",
          "great-salt-lake": "right"
        },
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/place/Great-Salt-Lake"
        }
      }
    }
  },
  {
    roundIndex: 33,
    roundLabel: "Bio-Baukasten",
    questions: {
      number: {
        id: "human-body-cell-chromosomes",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 100",
        shortLabel: "Zahl",
        prompt: "Wie viele Chromosomen hat eine normale menschliche Koerperzelle?",
        min: 1,
        max: 100,
        answer: 46,
        source: {
          label: "National Human Genome Research Institute",
          url: "https://www.genome.gov/genetics-glossary/Chromosome"
        }
      },
      percent: {
        id: "blood-plasma-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent des menschlichen Blutes bestehen ungefaehr aus Plasma?",
        min: 0,
        max: 100,
        answer: 55,
        unitLabel: "%",
        source: {
          label: "American Society of Hematology",
          url: "https://www.hematology.org/education/patients/blood-basics"
        }
      },
      rank: {
        id: "taxonomy-broad-to-narrow",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die taxonomischen Rangstufen von allgemein nach spezifisch.",
        directionLabel: "allgemein nach spezifisch",
        items: [
          { id: "class", label: "Klasse" },
          { id: "order", label: "Ordnung" },
          { id: "family", label: "Familie" }
        ],
        answerOrder: ["class", "order", "family"],
        source: {
          label: "NCBI Taxonomy",
          url: "https://www.ncbi.nlm.nih.gov/taxonomy"
        }
      },
      assign: {
        id: "plant-or-animal",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Lebewesen zu: Pflanze oder Tier.",
        leftLabel: "Pflanze",
        rightLabel: "Tier",
        terms: [
          { id: "oak", label: "Eiche" },
          { id: "moss", label: "Moos" },
          { id: "fern", label: "Farn" },
          { id: "coral", label: "Koralle" },
          { id: "octopus", label: "Oktopus" }
        ],
        answers: {
          oak: "left",
          moss: "left",
          fern: "left",
          coral: "right",
          octopus: "right"
        },
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/science/plant"
        }
      }
    }
  },
  {
    roundIndex: 34,
    roundLabel: "Technik-Zeitreise",
    questions: {
      number: {
        id: "transistor-invention-year",
        categoryId: "number",
        kind: "number",
        title: "Jahreszahl",
        shortLabel: "Zahl",
        prompt: "In welchem Jahr wurde der erste funktionierende Transistor bei Bell Labs demonstriert?",
        min: 1800,
        max: 2026,
        answer: 1947,
        source: {
          label: "Nobel Prize",
          url: "https://www.nobelprize.org/prizes/physics/1956/summary/"
        }
      },
      percent: {
        id: "earth-crust-silicon-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent der Erdkruste bestehen ungefaehr aus Silizium?",
        min: 0,
        max: 100,
        answer: 28,
        unitLabel: "%",
        source: {
          label: "Royal Society of Chemistry",
          url: "https://www.rsc.org/periodic-table/element/14/silicon"
        }
      },
      rank: {
        id: "storage-media-chronology",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Speichermedien nach ihrer Einfuehrung, alt nach neu.",
        directionLabel: "alt nach neu",
        items: [
          { id: "magnetic-tape", label: "Magnetband" },
          { id: "floppy", label: "Diskette" },
          { id: "cd-rom", label: "CD-ROM" }
        ],
        answerOrder: ["magnetic-tape", "floppy", "cd-rom"],
        source: {
          label: "Computer History Museum",
          url: "https://www.computerhistory.org/timeline/memory-storage/"
        }
      },
      assign: {
        id: "si-prefix-larger-smaller",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne SI-Praefixe zu: groesser als 1 oder kleiner als 1.",
        leftLabel: "> 1",
        rightLabel: "< 1",
        terms: [
          { id: "kilo", label: "Kilo" },
          { id: "mega", label: "Mega" },
          { id: "giga", label: "Giga" },
          { id: "milli", label: "Milli" },
          { id: "micro", label: "Mikro" }
        ],
        answers: {
          kilo: "left",
          mega: "left",
          giga: "left",
          milli: "right",
          micro: "right"
        },
        source: {
          label: "BIPM",
          url: "https://www.bipm.org/en/measurement-units/si-prefixes"
        }
      }
    }
  },
  {
    roundIndex: 35,
    roundLabel: "Medizin-Mensch",
    questions: {
      number: {
        id: "adult-human-bones",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 300",
        shortLabel: "Zahl",
        prompt: "Wie viele Knochen hat ein erwachsener Mensch normalerweise?",
        min: 1,
        max: 300,
        answer: 206,
        source: {
          label: "Cleveland Clinic",
          url: "https://my.clevelandclinic.org/health/body/22818-skeletal-system"
        }
      },
      percent: {
        id: "brain-water-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent des menschlichen Gehirns bestehen ungefaehr aus Wasser?",
        min: 0,
        max: 100,
        answer: 73,
        unitLabel: "%",
        source: {
          label: "USGS",
          url: "https://www.usgs.gov/special-topics/water-science-school/science/water-you-water-and-human-body"
        }
      },
      rank: {
        id: "human-organs-mass-rank",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Organe nach ungefaehrer Masse, schwerstes zuerst.",
        directionLabel: "schwerstes zuerst",
        items: [
          { id: "skin", label: "Haut" },
          { id: "liver", label: "Leber" },
          { id: "brain", label: "Gehirn" }
        ],
        answerOrder: ["skin", "liver", "brain"],
        source: {
          label: "OpenStax Anatomy and Physiology",
          url: "https://openstax.org/books/anatomy-and-physiology-2e/pages/1-introduction"
        }
      },
      assign: {
        id: "endocrine-or-exocrine-glands",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Druesen zu: endokrin oder exokrin.",
        leftLabel: "Endokrin",
        rightLabel: "Exokrin",
        terms: [
          { id: "thyroid", label: "Schilddruese" },
          { id: "pituitary", label: "Hypophyse" },
          { id: "adrenal", label: "Nebenniere" },
          { id: "sweat", label: "Schweissdruese" },
          { id: "salivary", label: "Speicheldruese" }
        ],
        answers: {
          thyroid: "left",
          pituitary: "left",
          adrenal: "left",
          sweat: "right",
          salivary: "right"
        },
        source: {
          label: "OpenStax Anatomy and Physiology",
          url: "https://openstax.org/books/anatomy-and-physiology-2e/pages/17-introduction"
        }
      }
    }
  },
  {
    roundIndex: 36,
    roundLabel: "Sprache-und-Schrift",
    questions: {
      number: {
        id: "greek-alphabet-letters",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 50",
        shortLabel: "Zahl",
        prompt: "Wie viele Buchstaben hat das griechische Alphabet?",
        min: 1,
        max: 50,
        answer: 24,
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/topic/Greek-alphabet"
        }
      },
      percent: {
        id: "world-languages-endangered-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent der weltweit gesprochenen Sprachen gelten ungefaehr als bedroht?",
        min: 0,
        max: 100,
        answer: 40,
        unitLabel: "%",
        source: {
          label: "UNESCO",
          url: "https://www.unesco.org/en/languages"
        }
      },
      rank: {
        id: "writing-systems-chronology",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Schriftsysteme grob chronologisch, alt nach jung.",
        directionLabel: "alt nach jung",
        items: [
          { id: "cuneiform", label: "Keilschrift" },
          { id: "greek", label: "Griechisches Alphabet" },
          { id: "latin", label: "Lateinisches Alphabet" }
        ],
        answerOrder: ["cuneiform", "greek", "latin"],
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/topic/cuneiform"
        }
      },
      assign: {
        id: "indo-european-or-uralic",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Sprachen zu: indogermanisch oder uralisch.",
        leftLabel: "Indogermanisch",
        rightLabel: "Uralisch",
        terms: [
          { id: "german", label: "Deutsch" },
          { id: "english", label: "Englisch" },
          { id: "spanish", label: "Spanisch" },
          { id: "finnish", label: "Finnisch" },
          { id: "hungarian", label: "Ungarisch" }
        ],
        answers: {
          german: "left",
          english: "left",
          spanish: "left",
          finnish: "right",
          hungarian: "right"
        },
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/topic/Indo-European-languages"
        }
      }
    }
  },
  {
    roundIndex: 37,
    roundLabel: "Nahrung-und-Natur",
    questions: {
      number: {
        id: "essential-amino-acids-adults",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 30",
        shortLabel: "Zahl",
        prompt: "Wie viele Aminosaeuren gelten fuer Erwachsene als essentiell?",
        min: 1,
        max: 30,
        answer: 9,
        source: {
          label: "NIH",
          url: "https://ods.od.nih.gov/factsheets/Protein-HealthProfessional/"
        }
      },
      percent: {
        id: "cow-milk-water-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent von Kuhmilch bestehen ungefaehr aus Wasser?",
        min: 0,
        max: 100,
        answer: 87,
        unitLabel: "%",
        source: {
          label: "USDA FoodData Central",
          url: "https://fdc.nal.usda.gov/"
        }
      },
      rank: {
        id: "foods-caffeine-rank",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne nach typischem Koffeingehalt pro Portion, hoch nach niedrig.",
        directionLabel: "hoch nach niedrig",
        items: [
          { id: "coffee", label: "Filterkaffee" },
          { id: "black-tea", label: "Schwarzer Tee" },
          { id: "cola", label: "Cola" }
        ],
        answerOrder: ["coffee", "black-tea", "cola"],
        source: {
          label: "Mayo Clinic",
          url: "https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/caffeine/art-20049372"
        }
      },
      assign: {
        id: "grain-or-legume-hard",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Lebensmittel zu: Getreide oder Huelsenfrucht.",
        leftLabel: "Getreide",
        rightLabel: "Huelse",
        terms: [
          { id: "barley", label: "Gerste" },
          { id: "rye", label: "Roggen" },
          { id: "millet", label: "Hirse" },
          { id: "lentil", label: "Linse" },
          { id: "soybean", label: "Sojabohne" }
        ],
        answers: {
          barley: "left",
          rye: "left",
          millet: "left",
          lentil: "right",
          soybean: "right"
        },
        source: {
          label: "FAO",
          url: "https://www.fao.org/pulses-2016/news/news-detail/en/c/337107/"
        }
      }
    }
  },
  {
    roundIndex: 38,
    roundLabel: "Musik-Museum",
    questions: {
      number: {
        id: "standard-piano-keys",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 120",
        shortLabel: "Zahl",
        prompt: "Wie viele Tasten hat ein modernes Standardklavier normalerweise?",
        min: 1,
        max: 120,
        answer: 88,
        source: {
          label: "Yamaha",
          url: "https://www.yamaha.com/en/musical_instrument_guide/piano/mechanism/"
        }
      },
      percent: {
        id: "vinyl-lp-speed-approx",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Mit wie viel Umdrehungen pro Minute laeuft eine klassische Langspielplatte ungefaehr?",
        min: 0,
        max: 100,
        answer: 33,
        unitLabel: "rpm",
        source: {
          label: "Library of Congress",
          url: "https://www.loc.gov/preservation/care/record.html"
        }
      },
      rank: {
        id: "composers-birth-chronology",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Komponisten nach Geburtsjahr, frueh nach spaet.",
        directionLabel: "frueh nach spaet",
        items: [
          { id: "bach", label: "J. S. Bach" },
          { id: "mozart", label: "Mozart" },
          { id: "beethoven", label: "Beethoven" }
        ],
        answerOrder: ["bach", "mozart", "beethoven"],
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/biography/Johann-Sebastian-Bach"
        }
      },
      assign: {
        id: "woodwind-or-brass",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Instrumente zu: Holzblasinstrument oder Blechblasinstrument.",
        leftLabel: "Holz",
        rightLabel: "Blech",
        terms: [
          { id: "clarinet", label: "Klarinette" },
          { id: "oboe", label: "Oboe" },
          { id: "bassoon", label: "Fagott" },
          { id: "trumpet", label: "Trompete" },
          { id: "trombone", label: "Posaune" }
        ],
        answers: {
          clarinet: "left",
          oboe: "left",
          bassoon: "left",
          trumpet: "right",
          trombone: "right"
        },
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/art/musical-instrument"
        }
      }
    }
  },
  {
    roundIndex: 39,
    roundLabel: "Architektur-Atlas",
    questions: {
      number: {
        id: "burj-khalifa-floors",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 250",
        shortLabel: "Zahl",
        prompt: "Wie viele nutzbare Stockwerke hat der Burj Khalifa ungefaehr?",
        min: 1,
        max: 250,
        answer: 163,
        source: {
          label: "Burj Khalifa",
          url: "https://www.burjkhalifa.ae/en/the-tower/facts-figures/"
        }
      },
      percent: {
        id: "concrete-cement-percent-approx",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie hoch ist der Zementanteil in Normalbeton grob ungefaehr?",
        min: 0,
        max: 100,
        answer: 15,
        unitLabel: "%",
        source: {
          label: "Portland Cement Association",
          url: "https://www.cement.org/cement-concrete/how-concrete-is-made"
        }
      },
      rank: {
        id: "famous-buildings-height-rank",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne die Bauwerke nach Hoehe, hoechstes zuerst.",
        directionLabel: "hoechstes zuerst",
        items: [
          { id: "burj-khalifa", label: "Burj Khalifa" },
          { id: "eiffel", label: "Eiffelturm" },
          { id: "empire-state", label: "Empire State Building" }
        ],
        answerOrder: ["burj-khalifa", "empire-state", "eiffel"],
        source: {
          label: "Council on Tall Buildings and Urban Habitat",
          url: "https://www.ctbuh.org/"
        }
      },
      assign: {
        id: "architecture-styles-periods",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne Baustile grob zu: vor 1800 oder nach 1800 entstanden.",
        leftLabel: "Vor 1800",
        rightLabel: "Nach 1800",
        terms: [
          { id: "romanesque", label: "Romanik" },
          { id: "gothic", label: "Gotik" },
          { id: "baroque", label: "Barock" },
          { id: "bauhaus", label: "Bauhaus" },
          { id: "brutalism", label: "Brutalismus" }
        ],
        answers: {
          romanesque: "left",
          gothic: "left",
          baroque: "left",
          bauhaus: "right",
          brutalism: "right"
        },
        source: {
          label: "Britannica",
          url: "https://www.britannica.com/art/Western-architecture"
        }
      }
    }
  },
  {
    roundIndex: 40,
    roundLabel: "Nobel-und-Wissen",
    questions: {
      number: {
        id: "original-nobel-prize-categories",
        categoryId: "number",
        kind: "number",
        title: "Von 1 bis 20",
        shortLabel: "Zahl",
        prompt: "Wie viele Nobelpreis-Kategorien wurden nach Alfred Nobels Testament urspruenglich vorgesehen?",
        min: 1,
        max: 20,
        answer: 5,
        source: {
          label: "Nobel Prize",
          url: "https://www.nobelprize.org/alfred-nobel/alfred-nobels-will/"
        }
      },
      percent: {
        id: "sun-hydrogen-mass-percent",
        categoryId: "percent",
        kind: "percent",
        title: "Tortenstueck",
        shortLabel: "Prozent",
        prompt: "Wie viel Prozent der Sonnenmasse bestehen ungefaehr aus Wasserstoff?",
        min: 0,
        max: 100,
        answer: 74,
        unitLabel: "%",
        source: {
          label: "NASA",
          url: "https://science.nasa.gov/sun/facts/"
        }
      },
      rank: {
        id: "nobel-categories-first-awarded",
        categoryId: "rank",
        kind: "rank",
        title: "In Relation",
        shortLabel: "Ranking",
        prompt: "Ordne diese Nobelpreis-Kategorien nach dem Jahr ihrer ersten Vergabe, frueh nach spaet.",
        directionLabel: "frueh nach spaet",
        items: [
          { id: "physics", label: "Physik" },
          { id: "literature", label: "Literatur" },
          { id: "economics", label: "Wirtschaftswissenschaften" }
        ],
        answerOrder: ["physics", "literature", "economics"],
        source: {
          label: "Nobel Prize",
          url: "https://www.nobelprize.org/prizes/facts/nobel-prize-facts/"
        }
      },
      assign: {
        id: "nobel-original-or-later",
        categoryId: "assign",
        kind: "assign",
        title: "Schnittmenge",
        shortLabel: "Zuordnung",
        prompt: "Ordne die Nobelpreis-Kategorien zu: urspruenglich nach Nobels Testament oder spaeter hinzugefuegt.",
        leftLabel: "Urspruenglich",
        rightLabel: "Spaeter",
        terms: [
          { id: "physics", label: "Physik" },
          { id: "chemistry", label: "Chemie" },
          { id: "medicine", label: "Medizin" },
          { id: "peace", label: "Frieden" },
          { id: "economics", label: "Wirtschaft" }
        ],
        answers: {
          physics: "left",
          chemistry: "left",
          medicine: "left",
          peace: "left",
          economics: "right"
        },
        source: {
          label: "Nobel Prize",
          url: "https://www.nobelprize.org/prizes/facts/nobel-prize-facts/"
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
