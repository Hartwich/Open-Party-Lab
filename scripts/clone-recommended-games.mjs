#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const recommendedGames = [
  {
    id: "magic-arena",
    repo: "https://github.com/Hartwich/magic-arena.git",
    path: "local-games/magic-arena"
  },
  {
    id: "magic-duell",
    repo: "https://github.com/Hartwich/magic-duell.git",
    path: "local-games/magic-duell"
  },
  {
    id: "arena-survivor",
    repo: "https://github.com/Hartwich/arena-survivor.git",
    path: "local-games/arena-survivor"
  },
  {
    id: "minions-td",
    repo: "https://github.com/Hartwich/minions-td.git",
    path: "local-games/minions-td"
  },
  {
    id: "zeichnen-und-erraten",
    repo: "https://github.com/Hartwich/zeichnen-und-erraten.git",
    path: "local-games/zeichnen-und-erraten"
  },
  {
    id: "schaetzorama",
    repo: "https://github.com/Hartwich/schaetzorama.git",
    path: "local-games/schaetzorama"
  },
  {
    id: "chaos-kommando",
    repo: "https://github.com/Hartwich/chaos-kommando.git",
    path: "local-games/chaos-kommando"
  },
  {
    id: "word-tiles",
    repo: "https://github.com/Hartwich/word-tiles.git",
    path: "local-games/word-tiles"
  },
  {
    id: "drift-racer",
    repo: "https://github.com/Hartwich/drift-racer.git",
    path: "local-games/drift-racer"
  }
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  await mkdir(join(rootDir, "local-games"), { recursive: true });

  for (const game of recommendedGames) {
    const target = join(rootDir, game.path);

    if (existsSync(target)) {
      console.log(`Skipping ${game.id}: ${game.path} already exists.`);
      continue;
    }

    console.log(`Cloning ${game.id} into ${game.path}...`);
    run("git", ["clone", game.repo, game.path]);
  }

  console.log("Recommended games are available locally.");
  console.log("Next step: npm run games:sync-local");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
