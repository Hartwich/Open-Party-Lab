#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(projectRoot, "artifacts", "hosted");
const webRoot = path.join(outputRoot, "web");

function runNpm(args) {
  const command = process.platform === "win32" ? "cmd.exe" : "npm";
  const commandArgs = process.platform === "win32"
    ? ["/d", "/s", "/c", ["npm", ...args].join(" ")]
    : args;
  const result = spawnSync(command, commandArgs, {
    cwd: projectRoot,
    env: {
      ...process.env,
      OPEN_PARTY_LAB_RELEASE_BUILD: "1"
    },
    stdio: "inherit",
    shell: false
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

runNpm(["run", "build"]);

await rm(outputRoot, { recursive: true, force: true });
await mkdir(webRoot, { recursive: true });
await cp(path.join(projectRoot, "apps", "host", "dist"), path.join(webRoot, "host"), { recursive: true });
await cp(path.join(projectRoot, "apps", "controller", "dist"), path.join(webRoot, "controller"), { recursive: true });

console.log(`Hosted web assets assembled at ${webRoot}`);
