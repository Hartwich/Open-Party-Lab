#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { cp, lstat, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const outputRoot = path.resolve(projectRoot, process.argv[2] ?? "artifacts/Open-Party-Lab-windows-x64");
const appRoot = path.join(outputRoot, "app");
const knownGames = JSON.parse(await readFile(path.join(projectRoot, "config", "known-games.json"), "utf8"));
const platformPackages = ["game-core", "protocol", "ui-kit", "utils"];
const artifactsRoot = path.join(projectRoot, "artifacts");
const relativeOutput = path.relative(artifactsRoot, outputRoot);
if (process.platform !== "win32" || process.arch !== "x64") {
  throw new Error("release:windows requires Windows x64 and an x64 Node.js runtime.");
}
if (!relativeOutput || relativeOutput.startsWith("..") || path.isAbsolute(relativeOutput)) {
  throw new Error("The release output must be a subdirectory of artifacts/.");
}
for (let directory = outputRoot; directory !== projectRoot; directory = path.dirname(directory)) {
  if (existsSync(directory) && (await lstat(directory)).isSymbolicLink()) {
    throw new Error(`Refusing to replace release output through a link: ${directory}`);
  }
}
const gameSources = knownGames.map((game) => {
  const sourceRoot = [game.defaultLocalPath, ...(game.alternateLocalPaths ?? [])]
    .map((directory) => path.resolve(projectRoot, directory))
    .find((directory) => existsSync(path.join(directory, "package.json")));
  if (!sourceRoot) throw new Error(`Missing game ${game.id}. Run npm run games:clone-all first.`);
  return { ...game, sourceRoot };
});

function run(command, args, cwd = projectRoot) {
  if (process.platform === "win32" && command === "npm") {
    return run("cmd.exe", ["/d", "/s", "/c", ["npm", ...args].join(" ")], cwd);
  }

  const result = spawnSync(command, args, {
    cwd, stdio: "inherit", shell: false,
    env: { ...process.env, OPEN_PARTY_LAB_RELEASE_BUILD: "1", VITE_OPEN_PARTY_LAB_HOSTED: "0" }
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function copyRuntimePackage(sourceRoot, targetRoot) {
  const manifest = JSON.parse(await readFile(path.join(sourceRoot, "package.json"), "utf8"));
  const runtimeManifest = {
    name: manifest.name,
    version: manifest.version,
    private: true,
    type: "module",
    main: manifest.main,
    exports: manifest.exports,
    license: manifest.license,
    dependencies: manifest.dependencies
  };

  await mkdir(targetRoot, { recursive: true });
  await cp(path.join(sourceRoot, "dist"), path.join(targetRoot, "dist"), { recursive: true });
  await writeFile(path.join(targetRoot, "package.json"), JSON.stringify(runtimeManifest, null, 2) + "\n");
  for (const file of ["LICENSE", "LICENSE.md", "LICENSE.txt", "NOTICE", "NOTICE.md"]) {
    if (existsSync(path.join(sourceRoot, file))) await cp(path.join(sourceRoot, file), path.join(targetRoot, file));
  }
}

// Include notices for browser libraries too: their code is compiled into the web assets.
async function copyDependencyLicenses(dependencyRoot, noticeRoot) {
  for (const entry of await readdir(dependencyRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const source = path.join(dependencyRoot, entry.name);
    const target = path.join(noticeRoot, entry.name);
    if (entry.name.startsWith("@")) {
      await copyDependencyLicenses(source, target);
      continue;
    }
    for (const file of await readdir(source)) {
      if (/^(licen[cs]e|notice|copying)(?:$|[.-])/i.test(file)) {
        await mkdir(target, { recursive: true });
        await cp(path.join(source, file), path.join(target, file), { recursive: true });
      }
    }
    if (existsSync(path.join(source, "node_modules"))) {
      await copyDependencyLicenses(path.join(source, "node_modules"), path.join(target, "node_modules"));
    }
  }
}

// Always rebuild with /controller/ as the controller base, even after a dev or hosted build.
run("npm", ["run", "build"]);
for (const registry of [
  "apps/server/src/game-engine/.generated/externalGames.ts",
  "apps/host/src/games/.generated/externalGames.ts",
  "apps/controller/src/controller-ui/games/.generated/externalGames.ts"
]) {
  const source = await readFile(path.join(projectRoot, registry), "utf8");
  for (const game of knownGames) {
    if (!source.includes(`from "${game.package}/`)) {
      throw new Error(`${game.id} was skipped during the build (${registry}). Release aborted.`);
    }
  }
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(appRoot, { recursive: true });

await cp(path.join(projectRoot, "apps", "server", "dist"), path.join(appRoot, "server"), { recursive: true });
await cp(path.join(projectRoot, "apps", "host", "dist"), path.join(appRoot, "web", "host"), { recursive: true });
await cp(path.join(projectRoot, "apps", "controller", "dist"), path.join(appRoot, "web", "controller"), { recursive: true });

for (const packageName of platformPackages) {
  await copyRuntimePackage(
    path.join(projectRoot, "packages", packageName),
    path.join(appRoot, "packages", packageName)
  );
}

const dependencies = {
  "@open-party-lab/game-core": "file:packages/game-core",
  "@open-party-lab/protocol": "file:packages/protocol",
  "@open-party-lab/ui-kit": "file:packages/ui-kit",
  "@open-party-lab/utils": "file:packages/utils",
  "socket.io": JSON.parse(await readFile(path.join(projectRoot, "node_modules/socket.io/package.json"), "utf8")).version
};

for (const game of gameSources) {
  const sourceRoot = game.sourceRoot;
  const targetRoot = path.join(appRoot, "packages", "games", game.id);
  await copyRuntimePackage(sourceRoot, targetRoot);
  dependencies[game.package] = `file:packages/games/${game.id}`;
}

await writeFile(path.join(appRoot, "package.json"), JSON.stringify({
  name: "open-party-lab-portable",
  version: "0.1.0",
  private: true,
  type: "module",
  dependencies
}, null, 2) + "\n");

run("npm", [
  "install", "--omit=dev", "--ignore-scripts", "--install-links", "--no-audit", "--no-fund"
], appRoot);

for (const dependencyName of Object.keys(dependencies).filter((name) => name.startsWith("@open-party-lab/"))) {
  const installedPackageRoot = path.join(appRoot, "node_modules", ...dependencyName.split("/"));
  const installedPackageStat = await lstat(installedPackageRoot);
  if (installedPackageStat.isSymbolicLink()) {
    throw new Error(`Portable dependency ${dependencyName} is still linked instead of copied.`);
  }
  await readFile(path.join(installedPackageRoot, "package.json"), "utf8");
}

await mkdir(path.join(outputRoot, "runtime"), { recursive: true });
await cp(process.execPath, path.join(outputRoot, "runtime", process.platform === "win32" ? "node.exe" : "node"));
await cp(path.join(projectRoot, "LICENSE"), path.join(outputRoot, "LICENSE.txt"));
await cp(path.join(projectRoot, "NOTICE.md"), path.join(outputRoot, "NOTICE.md"));
await copyDependencyLicenses(path.join(projectRoot, "node_modules"), path.join(outputRoot, "licenses", "npm"));
await cp(path.join(projectRoot, "docs", "release-build.md"), path.join(outputRoot, "README.md"));
const nodeLicense = await fetch(`https://raw.githubusercontent.com/nodejs/node/${process.version}/LICENSE`);
if (!nodeLicense.ok) throw new Error(`Could not include Node.js license: HTTP ${nodeLicense.status}`);
await writeFile(path.join(outputRoot, "runtime", "LICENSE.txt"), await nodeLicense.text());
await writeFile(path.join(outputRoot, "release.json"), JSON.stringify({
  version: JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8")).version,
  builtAt: new Date().toISOString(),
  platform: "win32", arch: "x64", node: process.version,
  games: knownGames.map((game) => game.id)
}, null, 2) + "\n");

if (process.platform === "win32") {
  const launcherSource = path.join(projectRoot, "scripts", "release", "Launcher.cs");
  const launcherTarget = path.join(outputRoot, "Open-Party-Lab.exe");
  const command = `$ErrorActionPreference = 'Stop'; Add-Type -Path '${launcherSource.replaceAll("'", "''")}' -ReferencedAssemblies System.Windows.Forms,System.Drawing -OutputAssembly '${launcherTarget.replaceAll("'", "''")}' -OutputType WindowsApplication`;
  run("powershell.exe", ["-NoProfile", "-Command", command]);
}

run(process.execPath, [path.join(scriptDir, "release", "smoke-portable.mjs"), outputRoot]);
const zipPath = `${outputRoot}.zip`;
await rm(zipPath, { force: true });
const quotePs = (value) => `'${value.replaceAll("'", "''")}'`;
run("powershell.exe", ["-NoProfile", "-Command",
  `$ErrorActionPreference = 'Stop'; Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory(${quotePs(outputRoot)}, ${quotePs(zipPath)})`
]);
const hash = createHash("sha256");
for await (const chunk of createReadStream(zipPath)) hash.update(chunk);
await writeFile(`${zipPath}.sha256`, `${hash.digest("hex")}  ${path.basename(zipPath)}\n`);
console.log(`Portable release ready: ${zipPath}`);
