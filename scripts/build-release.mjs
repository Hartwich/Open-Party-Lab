#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const outputRoot = path.resolve(projectRoot, process.argv[2] ?? "artifacts/Open-Party-Lab-windows-x64");
const appRoot = path.join(outputRoot, "app");
const knownGames = JSON.parse(await readFile(path.join(projectRoot, "config", "known-games.json"), "utf8"));
const platformPackages = ["game-core", "protocol", "ui-kit", "utils"];

function run(command, args, cwd = projectRoot) {
  if (process.platform === "win32" && command === "npm") {
    return run("cmd.exe", ["/d", "/s", "/c", ["npm", ...args].join(" ")], cwd);
  }

  const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function copyRuntimePackage(sourceRoot, targetRoot, dependencyNames = []) {
  const manifest = JSON.parse(await readFile(path.join(sourceRoot, "package.json"), "utf8"));
  const dependencies = Object.fromEntries(dependencyNames.map((name) => [name, "0.1.0"]));
  const runtimeManifest = {
    name: manifest.name,
    version: manifest.version,
    private: true,
    type: "module",
    main: manifest.main,
    exports: manifest.exports,
    dependencies
  };

  await mkdir(targetRoot, { recursive: true });
  await cp(path.join(sourceRoot, "dist"), path.join(targetRoot, "dist"), { recursive: true });
  await writeFile(path.join(targetRoot, "package.json"), JSON.stringify(runtimeManifest, null, 2) + "\n");
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(appRoot, { recursive: true });

await cp(path.join(projectRoot, "apps", "server", "dist"), path.join(appRoot, "server"), { recursive: true });
await cp(path.join(projectRoot, "apps", "host", "dist"), path.join(appRoot, "web", "host"), { recursive: true });
await cp(path.join(projectRoot, "apps", "controller", "dist"), path.join(appRoot, "web", "controller"), { recursive: true });

for (const packageName of platformPackages) {
  const dependencies = packageName === "protocol" ? ["@open-party-lab/game-core"] : [];
  await copyRuntimePackage(
    path.join(projectRoot, "packages", packageName),
    path.join(appRoot, "packages", packageName),
    dependencies
  );
}

const dependencies = {
  "@open-party-lab/game-core": "file:packages/game-core",
  "@open-party-lab/protocol": "file:packages/protocol",
  "@open-party-lab/ui-kit": "file:packages/ui-kit",
  "@open-party-lab/utils": "file:packages/utils",
  "socket.io": "^4.8.1"
};

for (const game of knownGames) {
  const sourceRoot = path.join(projectRoot, game.defaultLocalPath);
  const targetRoot = path.join(appRoot, "packages", "games", game.id);
  await copyRuntimePackage(sourceRoot, targetRoot, ["@open-party-lab/game-core"]);
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
  "install", "--omit=dev", "--ignore-scripts", "--no-audit", "--no-fund"
], appRoot);

await mkdir(path.join(outputRoot, "runtime"), { recursive: true });
await cp(process.execPath, path.join(outputRoot, "runtime", process.platform === "win32" ? "node.exe" : "node"));
await cp(path.join(projectRoot, "LICENSE"), path.join(outputRoot, "LICENSE.txt"));
await cp(path.join(projectRoot, "NOTICE.md"), path.join(outputRoot, "NOTICE.md"));
await cp(path.join(projectRoot, "docs", "release-build.md"), path.join(outputRoot, "README.md"));

if (process.platform === "win32") {
  const launcherSource = path.join(projectRoot, "scripts", "release", "Launcher.cs");
  const launcherTarget = path.join(outputRoot, "Open-Party-Lab.exe");
  const command = `Add-Type -Path '${launcherSource.replaceAll("'", "''")}' -ReferencedAssemblies System.Windows.Forms -OutputAssembly '${launcherTarget.replaceAll("'", "''")}' -OutputType WindowsApplication`;
  run("powershell.exe", ["-NoProfile", "-Command", command]);
}

console.log(`Portable release assembled at ${outputRoot}`);
