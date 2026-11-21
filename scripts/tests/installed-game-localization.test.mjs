import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { localizeGameManifest } from "../../packages/game-core/dist/index.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const games = JSON.parse(readFileSync(path.join(root, "config/known-games.json"), "utf8"));
const requireAllLocales = process.env.OPEN_PARTY_LAB_REQUIRE_ALL_LOCALES === "1";

for (const game of games) {
  const installed = existsSync(path.join(root, "node_modules", game.package));
  test(`${game.id}: public manifest supplies localized setup copy`, { skip: !installed && !requireAllLocales }, async () => {
    const exports = await import(`${game.package}/manifest`);
    const manifest = Object.values(exports).find((value) => value?.id === game.id);
    assert.ok(manifest, "Manifest must be available through the package export");
    for (const language of ["de", "en"]) {
      assert.ok(manifest.translations?.[language]?.displayName?.trim(), `${language} display name`);
      assert.ok(manifest.translations?.[language]?.description?.trim(), `${language} description`);
    }
    for (const language of ["en", "es", "fr", "pt-BR"]) {
      const copy = manifest.translations[language];
      if (!copy && language !== "en" && !requireAllLocales) continue;
      assert.ok(copy?.displayName?.trim(), `${language} display name`);
      assert.ok(copy.description?.trim(), `${language} description`);
      assertSetupCopy(manifest, copy, language);
    }
  });
}

function assertSetupCopy(manifest, copy, language) {
  const localized = localizeGameManifest(manifest, language);
  const expectCopy = (source, translated, key, context) => {
    if (typeof source?.[key] === "string" && source[key].trim()) {
      assert.ok(typeof translated?.[key] === "string" && translated[key].trim(), `${language}: ${context}.${key} needs explicit copy`);
    }
  };
  if (manifest.lobbySetup) {
    for (const key of ["title", "description"]) expectCopy(manifest.lobbySetup, copy.lobbySetup, key, "lobbySetup");
    for (const key of ["label", "description"]) expectCopy(manifest.lobbySetup.confirmation, copy.lobbySetup?.confirmation, key, "confirmation");
    for (const field of manifest.lobbySetup.fields) {
      const translated = copy.lobbySetup?.fields?.[field.id];
      for (const key of ["label", "description", "group"]) expectCopy(field, translated, key, field.id);
      for (const option of field.kind === "select" ? field.options : []) {
        for (const key of ["label", "description"]) expectCopy(option, translated?.options?.[option.id], key, `${field.id}.${option.id}`);
      }
    }
    for (const [fieldId, fieldText] of Object.entries(copy.lobbySetup?.fields ?? {})) {
      const field = manifest.lobbySetup.fields.find((entry) => entry.id === fieldId);
      assert.ok(field, `Translation refers to missing field ${fieldId}`);
      for (const optionId of Object.keys(fieldText.options ?? {})) {
        assert.ok(field.kind === "select" && field.options.some((option) => option.id === optionId), `Translation refers to missing option ${fieldId}.${optionId}`);
      }
    }
  }
  if (manifest.playerSetup) {
    for (const key of ["title", "description", "readyBlockedLabel"]) expectCopy(manifest.playerSetup, copy.playerSetup, key, "playerSetup");
    for (const option of manifest.playerSetup.options) {
      for (const key of ["name", "title", "archetype", "description"]) expectCopy(option, copy.playerSetup?.options?.[option.id], key, option.id);
    }
    assert.deepEqual(localized.playerSetup.options.map((option) => option.id), manifest.playerSetup.options.map((option) => option.id));
  }
  assert.equal(localized.id, manifest.id);
  assert.equal(localized.minPlayers, manifest.minPlayers);
  assert.equal(localized.maxPlayers, manifest.maxPlayers);
  assert.equal(localized.controllerLayout, manifest.controllerLayout);
}
