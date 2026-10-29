import assert from "node:assert/strict";
import { test } from "node:test";
import { localizeGameManifest } from "../../packages/game-core/dist/index.js";

// A new game unknown to the platform must localize solely from its public manifest.
const manifest = {
  id: "external-test-game",
  displayName: "Base name",
  description: "Base description",
  lobbySetup: {
    title: "Base setup",
    fields: [{ id: "mode", kind: "select", label: "Base mode", options: [], defaultValue: "a" }]
  },
  translations: {
    de: { displayName: "Spiel", description: "Beschreibung" },
    en: {
      displayName: "Game", description: "Description",
      lobbySetup: { title: "Setup", fields: { mode: { label: "Mode" } } }
    }
  }
};

test("unknown game uses package-provided catalog and setup copy without mutating its manifest", () => {
  const before = structuredClone(manifest);
  const translated = localizeGameManifest(JSON.parse(JSON.stringify(manifest)), "en");
  assert.equal(translated.displayName, "Game");
  assert.equal(translated.description, "Description");
  assert.equal(translated.lobbySetup.title, "Setup");
  assert.equal(translated.lobbySetup.fields[0].label, "Mode");
  assert.equal(translated.lobbySetup.fields[0].defaultValue, "a");
  localizeGameManifest(manifest, "en");
  assert.deepEqual(manifest, before);
});

test("missing requested language falls back to German package copy", () => {
  const translated = localizeGameManifest({ ...manifest, translations: { de: manifest.translations.de } }, "en");
  assert.equal(translated.displayName, "Spiel");
  assert.equal(translated.lobbySetup.title, "Base setup");
});

test("legacy or untranslated game keeps its own base manifest", () => {
  const { translations, ...legacy } = manifest;
  assert.equal(localizeGameManifest(legacy, "en"), legacy);
  assert.equal(localizeGameManifest({ ...legacy, translations: {} }, "en").displayName, "Base name");
});

test("nested setup copy preserves option IDs, rules, constraints and confirmation actions", () => {
  const source = {
    ...manifest,
    lobbySetup: {
      title: "Einrichten", description: "Beschreibung",
      confirmation: { settingKey: "confirmed", actionType: "confirm", label: "Bestätigen", description: "Prüfen" },
      fields: [
        { id: "mode", kind: "select", label: "Modus", group: "Regeln", settingKey: "modeKey", actionKey: "modeAction", defaultValue: "a",
          options: [{ id: "a", label: "Zufall", description: "Zufällig wählen", rules: { en: [{ title: "Rules", lines: ["Keep these rules."] }] } }, { id: "b", label: "Classic" }] },
        { id: "time", kind: "number", label: "Zeit", min: 10, max: 90, step: 10, defaultValue: 30 },
        { id: "enabled", kind: "toggle", label: "Aktiv", onValue: "on", offValue: "off", defaultValue: "off" }
      ]
    },
    translations: { en: {
      ...manifest.translations.en,
      lobbySetup: {
        title: "Set up", description: "Description",
        confirmation: { label: "Confirm", description: "Review" },
        fields: {
          mode: { label: "Mode", group: "Rules", options: { a: { label: "Random", description: "Choose randomly" } } },
          time: { label: "Time" }, enabled: { label: "Enabled" }
        }
      }
    } }
  };
  const before = structuredClone(source);
  const actual = localizeGameManifest(source, "en");
  assert.equal(actual.lobbySetup.description, "Description");
  assert.deepEqual(actual.lobbySetup.confirmation, { settingKey: "confirmed", actionType: "confirm", label: "Confirm", description: "Review" });
  assert.equal(actual.lobbySetup.fields[0].group, "Rules");
  assert.equal(actual.lobbySetup.fields[0].options[0].label, "Random");
  assert.equal(actual.lobbySetup.fields[0].options[0].description, "Choose randomly");
  assert.deepEqual(actual.lobbySetup.fields[0].options[0].rules, source.lobbySetup.fields[0].options[0].rules);
  assert.equal(actual.lobbySetup.fields[0].options[1].label, "Classic");
  assert.equal(actual.lobbySetup.fields[0].settingKey, "modeKey");
  assert.equal(actual.lobbySetup.fields[0].actionKey, "modeAction");
  assert.equal(actual.lobbySetup.fields[1].max, 90);
  assert.equal(actual.lobbySetup.fields[2].onValue, "on");
  assert.deepEqual(source, before);
});

test("player selection and catalog appearance localize without altering selection or artwork", () => {
  for (const kind of ["choice", "multi-select"]) {
    const source = {
      ...manifest,
      playerSetup: { kind, title: "Auswahl", description: "Wähle", selectionKey: "hero", minSelections: 1, maxSelections: 2,
        readyBlockedLabel: "Erst wählen", options: [{ id: "hero-1", name: "Figur", title: "Die Mutige", archetype: "Magierin", description: "Beschreibung", portraitPath: "/test/hero.webp" }] },
      visual: { accent: "#fff", icon: "sword", eyebrow: "Abenteuer" },
      translations: { en: { ...manifest.translations.en,
        playerSetup: { title: "Selection", description: "Choose", readyBlockedLabel: "Choose first", options: { "hero-1": { name: "Hero", title: "The Brave", archetype: "Mage", description: "Description" } } },
        visual: { eyebrow: "Adventure" }
      } }
    };
    const before = structuredClone(source);
    const actual = localizeGameManifest(source, "en");
    assert.equal(actual.playerSetup.title, "Selection");
    assert.equal(actual.playerSetup.options[0].name, "Hero");
    assert.equal(actual.playerSetup.options[0].archetype, "Mage");
    assert.equal(actual.playerSetup.options[0].portraitPath, "/test/hero.webp");
    assert.equal(actual.playerSetup.options[0].id, "hero-1");
    assert.equal(actual.playerSetup.selectionKey, "hero");
    if (kind === "multi-select") assert.equal(actual.playerSetup.readyBlockedLabel, "Choose first");
    assert.deepEqual(actual.visual, { accent: "#fff", icon: "sword", eyebrow: "Adventure" });
    assert.deepEqual(source, before);
  }
});
