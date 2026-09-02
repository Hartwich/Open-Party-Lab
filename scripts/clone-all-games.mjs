#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const games = JSON.parse(await readFile(path.join(projectRoot, "config", "known-games.json"), "utf8"));
const localGamesRoot = path.join(projectRoot, "local-games");
const freshClone = process.argv.includes("--fresh");
await mkdir(localGamesRoot, { recursive: true });

function githubArchiveUrl(repository) {
  const match = repository.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (!match) return null;
  return `https://codeload.github.com/${match[1]}/${match[2]}/tar.gz/refs/heads/main`;
}

async function downloadGithubArchive(game, target) {
  const archiveUrl = githubArchiveUrl(game.repo);
  if (!archiveUrl) return false;

  const temporaryRoot = await mkdtemp(path.join(localGamesRoot, ".archive-"));
  const archivePath = path.join(temporaryRoot, `${game.id}.tar.gz`);

  try {
    console.log(`Downloading ${game.id} from its public GitHub archive...`);
    const response = await fetch(archiveUrl);
    if (!response.ok) {
      throw new Error(`GitHub archive request failed with ${response.status} ${response.statusText}`);
    }

    await writeFile(archivePath, Buffer.from(await response.arrayBuffer()));
    const extractResult = spawnSync("tar", ["-xzf", archivePath, "-C", temporaryRoot], {
      cwd: projectRoot,
      stdio: "inherit",
      shell: false
    });
    if (extractResult.error) throw extractResult.error;
    if (extractResult.status !== 0) {
      throw new Error(`Could not extract the GitHub archive for ${game.id}.`);
    }

    const extractedDirectory = (await readdir(temporaryRoot, { withFileTypes: true })).find(
      (entry) => entry.isDirectory()
    );
    if (!extractedDirectory) {
      throw new Error(`The GitHub archive for ${game.id} did not contain a directory.`);
    }

    await rename(path.join(temporaryRoot, extractedDirectory.name), target);
    return true;
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

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

  if (process.env.RENDER === "true" && (await downloadGithubArchive(game, target))) {
    continue;
  }

  const result = spawnSync("git", ["clone", "--depth", "1", game.repo, game.defaultLocalPath], {
    cwd: projectRoot,
    stdio: "inherit",
    shell: false
  });

  if (result.error) throw result.error;
  if (result.status !== 0 && !(await downloadGithubArchive(game, target))) {
    process.exit(result.status ?? 1);
  }
}

console.log(`All ${games.length} known games are available locally${freshClone ? " from fresh clones" : ""}.`);
