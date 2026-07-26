#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const games = JSON.parse(await readFile(path.join(projectRoot, "config", "known-games.json"), "utf8"));
const localGamesRoot = path.join(projectRoot, "local-games");
const freshClone = process.argv.includes("--fresh");
await mkdir(localGamesRoot, { recursive: true });

for (const game of games) {
  const target = path.join(projectRoot, game.defaultLocalPath);

  if (freshClone) {
    const relativeTarget = path.relative(localGamesRoot, target);

    if (relativeTarget.startsWith("..") || path.isAbsolute(relativeTarget)) {
      throw new Error(`Refusing to refresh game outside local-games: ${game.defaultLocalPath}`);
    }

    await rm(target, { recursive: true, force: true });
  }

  if (existsSync(target)) {
    console.log(`Skipping ${game.id}: ${game.defaultLocalPath} already exists.`);
    continue;
  }

  const result = spawnSync("git", ["clone", "--depth", "1", game.repo, game.defaultLocalPath], {
    cwd: projectRoot,
    stdio: "inherit",
    shell: false
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`All ${games.length} known games are available locally${freshClone ? " from fresh clones" : ""}.`);
