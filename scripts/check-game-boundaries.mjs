import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const games = JSON.parse(readFileSync(path.join(root, "config/known-games.json"), "utf8"));
const assetRoots = games.flatMap(({ id }) => [
  `apps/host/public/${id}/`,
  `apps/controller/public/${id}/`
]);
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" }).split("\0");
const violations = tracked.filter((file) => assetRoots.some((prefix) => file.startsWith(prefix)))
  .map((file) => `Generated game asset is tracked: ${file}`);

const catalogRoot = path.join(root, "packages/game-core/src/catalog/i18n");
if (existsSync(path.join(catalogRoot, "gameTexts.ts")) || existsSync(path.join(catalogRoot, "games")) &&
    readdirSync(path.join(catalogRoot, "games")).length > 0) {
  violations.push("Game catalog translations belong in game manifests, not game-core/src/catalog/i18n.");
}

function checkCoreImports(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) checkCoreImports(file);
    else if (entry.name.endsWith(".ts") && /["']@open-party-lab\/game-[^"']+["']/.test(readFileSync(file, "utf8"))) {
      violations.push(`game-core must not import optional game packages: ${path.relative(root, file)}`);
    }
  }
}
checkCoreImports(path.join(root, "packages/game-core/src"));

if (violations.length) {
  console.error(violations.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Game boundaries: no tracked generated game assets or game-core game imports/catalogs.");
}
