import { existsSync } from "node:fs";
import {
  cp,
  lstat,
  mkdir,
  readdir,
  readFile,
  rm,
  symlink,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const knownGamesPath = path.join(projectRoot, "config", "known-games.json");
const scopeDir = path.join(projectRoot, "node_modules", "@open-party-lab");
const publicAssetTargets = [
  {
    sourceSubdir: ["public", "host"],
    targetDir: path.join(projectRoot, "apps", "host", "public")
  },
  {
    sourceSubdir: ["public", "controller"],
    targetDir: path.join(projectRoot, "apps", "controller", "public")
  }
];

const generatedFiles = {
  server: path.join(projectRoot, "apps", "server", "src", "game-engine", ".generated", "externalGames.ts"),
  host: path.join(projectRoot, "apps", "host", "src", "games", ".generated", "externalGames.ts"),
  controller: path.join(projectRoot, "apps", "controller", "src", "controller-ui", "games", ".generated", "externalGames.ts")
};

function toIdentifier(gameId) {
  return gameId.replace(/-([a-z0-9])/g, (_match, char) => char.toUpperCase()).replace(/[^a-zA-Z0-9_$]/g, "");
}

async function readKnownGames() {
  const content = await readFile(knownGamesPath, "utf8");
  return JSON.parse(content);
}

function resolveLocalPath(game) {
  const candidatePaths = [
    game.defaultLocalPath,
    ...(game.alternateLocalPaths ?? [])
  ].map((localPath) => path.resolve(projectRoot, localPath));

  return candidatePaths.find((candidatePath) => existsSync(candidatePath)) ?? candidatePaths[0];
}

function resolveDisplayPaths(game) {
  return [
    game.defaultLocalPath,
    ...(game.alternateLocalPaths ?? [])
  ].map((localPath) => path.resolve(projectRoot, localPath));
}

function resolvePackageLinkPath(game) {
  const [_scope, name] = game.package.split("/");
  return path.join(scopeDir, name);
}

async function pathExists(targetPath) {
  try {
    await lstat(targetPath);
    return true;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

async function removePackageLink(game) {
  const linkPath = resolvePackageLinkPath(game);

  if (existsSync(linkPath) || await pathExists(linkPath)) {
    await rm(linkPath, { recursive: true, force: true });
  }
}

async function ensurePackageLink(game, localPath) {
  await mkdir(scopeDir, { recursive: true });
  await removePackageLink(game);
  await symlink(localPath, resolvePackageLinkPath(game), process.platform === "win32" ? "junction" : "dir");
}

async function removePublicAssets(game) {
  for (const target of publicAssetTargets) {
    await rm(path.join(target.targetDir, game.id), { recursive: true, force: true });
  }
}

async function syncPublicAssets(game, localPath) {
  await removePublicAssets(game);

  for (const target of publicAssetTargets) {
    const sourceRoot = path.join(localPath, ...target.sourceSubdir);

    if (!existsSync(sourceRoot)) {
      continue;
    }

    const entries = await readdir(sourceRoot, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() && !entry.isFile()) {
        continue;
      }

      const sourcePath = path.join(sourceRoot, entry.name);
      const targetPath = path.join(target.targetDir, entry.name);
      await rm(targetPath, { recursive: true, force: true });
      await mkdir(path.dirname(targetPath), { recursive: true });
      await cp(sourcePath, targetPath, { recursive: true, force: true });
    }
  }
}

function run(command, args, cwd) {
  if (process.platform === "win32" && command === "npm") {
    return spawnSync("cmd.exe", ["/d", "/s", "/c", ["npm", ...args].join(" ")], {
      cwd,
      stdio: "inherit",
      shell: false
    });
  }

  return spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: false
  });
}

function packageDistExists(localPath) {
  return existsSync(path.join(localPath, "dist", "server", "index.js")) &&
    existsSync(path.join(localPath, "dist", "host", "index.js")) &&
    existsSync(path.join(localPath, "dist", "controller", "index.js"));
}

async function ensurePlatformDependencyLinks(localPath) {
  const localScopeDir = path.join(localPath, "node_modules", "@open-party-lab");
  const platformPackages = ["game-core", "protocol", "ui-kit", "utils"];

  await mkdir(localScopeDir, { recursive: true });

  for (const packageName of platformPackages) {
    const sourcePath = path.join(projectRoot, "packages", packageName);
    const targetPath = path.join(localScopeDir, packageName);

    if (existsSync(targetPath)) {
      await rm(targetPath, { recursive: true, force: true });
    }

    await symlink(sourcePath, targetPath, process.platform === "win32" ? "junction" : "dir");
  }
}

async function prepareGamePackage(game, localPath) {
  if (!existsSync(path.join(localPath, "package.json"))) {
    console.warn(`[games] ${game.id}: package.json missing, skipping.`);
    return false;
  }

  if (!existsSync(path.join(localPath, "node_modules"))) {
    console.log(`[games] ${game.id}: installing dependencies.`);
    const install = run("npm", ["install"], localPath);

    if (install.status !== 0) {
      console.warn(`[games] ${game.id}: npm install failed, skipping.`);
      return false;
    }
  }

  await ensurePlatformDependencyLinks(localPath);

  console.log(`[games] ${game.id}: building package.`);
  const build = run("npm", ["run", "build"], localPath);

  if (build.status !== 0 || !packageDistExists(localPath)) {
    console.warn(`[games] ${game.id}: build failed, skipping.`);
    return false;
  }

  return true;
}

async function writeGeneratedFiles(linkedGames) {
  const serverImports = [];
  const serverEntries = [];
  const hostImports = [];
  const hostEntries = [];
  const controllerImports = [];
  const controllerEntries = [];

  for (const game of linkedGames) {
    const ident = toIdentifier(game.id);
    serverImports.push(`import { serverGame as ${ident}ServerGame } from "${game.package}/server";`);
    serverEntries.push(`  { manifest: ${ident}ServerGame.manifest, serverGame: ${ident}ServerGame }`);

    hostImports.push(`import { hostGame as ${ident}HostGame } from "${game.package}/host";`);
    hostEntries.push(`  ${ident}HostGame as ExternalHostGameRegistration`);

    controllerImports.push(`import { controllerGame as ${ident}ControllerGame } from "${game.package}/controller";`);
    controllerEntries.push(`  ${ident}ControllerGame as ControllerGameRegistration`);
  }

  const serverContent = `${serverImports.join("\n")}${serverImports.length ? "\n" : ""}import type { ServerGameEntry } from "../gameRegistry.js";

export const externalServerGameEntries: ServerGameEntry[] = [
${serverEntries.join(",\n")}
];
`;

  const hostContent = `import type Phaser from "phaser";
${hostImports.join("\n")}${hostImports.length ? "\n" : ""}
export interface ExternalHostGameRegistration {
  id: string;
  displayName: string;
  sceneKey: string;
  scene: Phaser.Types.Scenes.SceneType;
}

export const externalHostGames: ExternalHostGameRegistration[] = [
${hostEntries.join(",\n")}
];

export const externalHostGameRegistry: Record<string, { id: string; displayName: string; sceneKey: string }> = Object.fromEntries(
  externalHostGames.map((game) => [
    game.id,
    {
      id: game.id,
      displayName: game.displayName,
      sceneKey: game.sceneKey
    }
  ])
);

export const externalHostScenes: Phaser.Types.Scenes.SceneType[] = externalHostGames.map((game) => game.scene);
`;

  const controllerContent = `${controllerImports.join("\n")}${controllerImports.length ? "\n" : ""}import type { ControllerGameRegistration } from "../registry.js";

export const externalControllerGameRegistrations: ControllerGameRegistration[] = [
${controllerEntries.join(",\n")}
];
`;

  for (const filePath of Object.values(generatedFiles)) {
    await mkdir(path.dirname(filePath), { recursive: true });
  }

  await writeFile(generatedFiles.server, serverContent, "utf8");
  await writeFile(generatedFiles.host, hostContent, "utf8");
  await writeFile(generatedFiles.controller, controllerContent, "utf8");
}

async function listGames() {
  const knownGames = await readKnownGames();

  for (const game of knownGames) {
    const localPath = resolveLocalPath(game);
    const displayPaths = resolveDisplayPaths(game);
    const linkPath = resolvePackageLinkPath(game);
    const localExists = await pathExists(localPath);
    const linked = existsSync(linkPath);
    const status = localExists ? (linked ? "linked" : "not installed") : "missing";

    console.log(`${game.id}: ${status}`);
    console.log(`  repo: ${game.repo}`);
    console.log(`  local: ${displayPaths[0]}`);

    if (displayPaths.length > 1) {
      console.log(`  alternates: ${displayPaths.slice(1).join(", ")}`);
    }

    if (!localExists) {
      console.log(`  clone: git clone ${game.repo} ${displayPaths[0]}`);
    }
  }
}

async function syncLocalGames() {
  const knownGames = await readKnownGames();
  const linkedGames = [];

  for (const game of knownGames) {
    const localPath = resolveLocalPath(game);

    if (!existsSync(localPath)) {
      await removePackageLink(game);
      await removePublicAssets(game);
      console.log(`[games] ${game.id}: missing, skipped.`);
      continue;
    }

    const prepared = await prepareGamePackage(game, localPath);

    if (!prepared) {
      await removePackageLink(game);
      await removePublicAssets(game);
      continue;
    }

    await syncPublicAssets(game, localPath);
    await ensurePackageLink(game, localPath);
    linkedGames.push(game);
    console.log(`[games] ${game.id}: linked.`);
  }

  await writeGeneratedFiles(linkedGames);
}

async function clearLocalGames() {
  const knownGames = await readKnownGames();

  for (const game of knownGames) {
    await removePackageLink(game);
    await removePublicAssets(game);
  }

  await writeGeneratedFiles([]);
  console.log("[games] local game links cleared.");
}

async function ensureGeneratedFiles() {
  const missingGeneratedFile = Object.values(generatedFiles).some((filePath) => !existsSync(filePath));

  if (missingGeneratedFile) {
    await writeGeneratedFiles([]);
  }
}

const command = process.argv[2] ?? "list";

if (command === "list") {
  await listGames();
} else if (command === "sync-local") {
  await syncLocalGames();
} else if (command === "clear-local") {
  await clearLocalGames();
} else if (command === "ensure-generated") {
  await ensureGeneratedFiles();
} else {
  console.error(`Unknown command "${command}". Expected list, sync-local, clear-local, or ensure-generated.`);
  process.exitCode = 1;
}
