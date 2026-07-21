import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { WebSocket } from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const defaultCdpPort = 9222;

const recommendedGames = [
  {
    name: "Magic Arena",
    path: "local-games/magic-arena/docs/screenshots/host.png"
  },
  {
    name: "Magic Duell",
    path: "local-games/magic-duell/docs/screenshots/host.png"
  },
  {
    name: "Arena Survivor",
    path: "local-games/arena-survivor/docs/screenshots/host.png"
  },
  {
    name: "MinionsTD",
    path: "local-games/minions-td/docs/screenshots/host.png"
  },
  {
    name: "Draw & Guess",
    path: "local-games/zeichnen-und-erraten/docs/screenshots/host.png"
  },
  {
    name: "Schaetzorama",
    path: "local-games/schaetzorama/docs/screenshots/host.png"
  },
  {
    name: "Chaos-Kommando",
    path: "local-games/chaos-kommando/docs/screenshots/host.png"
  },
  {
    name: "Word Tiles",
    path: "local-games/word-tiles/docs/screenshots/host.png"
  },
  {
    name: "Drift Racer",
    path: "local-games/drift-racer/docs/screenshots/host.png"
  }
];

function parseArgs(argv) {
  const args = {
    cdpPort: defaultCdpPort,
    hostUrl: "http://127.0.0.1:5173/",
    outputDir: path.join(projectRoot, "docs", "screenshots"),
    launchBrowser: true
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }

    if (arg === "--cdp-port" && next) {
      args.cdpPort = Number.parseInt(next, 10);
      index += 1;
      continue;
    }

    if (arg === "--host-url" && next) {
      args.hostUrl = next;
      index += 1;
      continue;
    }

    if (arg === "--output-dir" && next) {
      args.outputDir = path.resolve(next);
      index += 1;
      continue;
    }

    if (arg === "--no-launch-browser") {
      args.launchBrowser = false;
      continue;
    }

    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  if (!Number.isInteger(args.cdpPort) || args.cdpPort <= 0) {
    throw new Error("--cdp-port must be a positive integer.");
  }

  return args;
}

function printHelp() {
  console.log(`Capture README screenshots for Open Party Lab.

Usage:
  npm run screenshots:readme
  npm run screenshots:readme -- --host-url http://127.0.0.1:5173/

Requirements:
  - Start the host dev app first, usually with npm run dev:host or npm run dev:all.
  - Optional local recommended game repos should already be synced if you want them in the collage.
  - The script uses Chromium/Edge through the Chrome DevTools Protocol.

Outputs:
  docs/screenshots/host-game-selection-en.png
  docs/screenshots/recommended-games-collage.png`);
}

function requestJson(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const request = http.request(url, { method }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error(`${url}: ${body}`));
        }
      });
    });
    request.on("error", reject);
    request.end();
  });
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function isCdpAvailable(cdpOrigin) {
  try {
    await requestJson(`${cdpOrigin}/json/version`);
    return true;
  } catch {
    return false;
  }
}

function findChromiumExecutable() {
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) {
    return process.env.CHROMIUM_PATH;
  }

  const candidates = process.platform === "win32"
    ? [
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
      ]
    : process.platform === "darwin"
      ? [
          "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Chromium.app/Contents/MacOS/Chromium"
        ]
      : [
          "/usr/bin/google-chrome",
          "/usr/bin/google-chrome-stable",
          "/usr/bin/microsoft-edge",
          "/usr/bin/microsoft-edge-stable",
          "/usr/bin/chromium",
          "/usr/bin/chromium-browser"
        ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

async function ensureBrowser(cdpOrigin, cdpPort, launchBrowser) {
  if (await isCdpAvailable(cdpOrigin)) {
    return null;
  }

  if (!launchBrowser) {
    throw new Error(`No browser is listening at ${cdpOrigin}. Start Chromium/Edge with --remote-debugging-port=${cdpPort}.`);
  }

  const executable = findChromiumExecutable();
  if (!executable) {
    throw new Error("Could not find Edge, Chrome, or Chromium. Set CHROMIUM_PATH or start a CDP browser manually.");
  }

  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "open-party-lab-readme-browser-"));
  const child = spawn(executable, [
    "--headless=new",
    "--disable-gpu",
    `--remote-debugging-port=${cdpPort}`,
    "--remote-allow-origins=*",
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank"
  ], {
    stdio: "ignore",
    detached: false
  });

  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await isCdpAvailable(cdpOrigin)) {
      return child;
    }
    await wait(250);
  }

  child.kill();
  throw new Error("Browser process started, but CDP did not become available.");
}

async function newTarget(cdpOrigin, url) {
  return requestJson(`${cdpOrigin}/json/new?${encodeURIComponent(url)}`, "PUT");
}

class Page {
  constructor(target) {
    this.ws = new WebSocket(target.webSocketDebuggerUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.errors = [];
    this.ws.on("message", (raw) => {
      const message = JSON.parse(raw.toString());
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) {
          reject(new Error(message.error.message));
        } else {
          resolve(message.result ?? {});
        }
        return;
      }

      if (message.method === "Log.entryAdded" && ["error", "warning"].includes(message.params.entry.level)) {
        this.errors.push(`${message.params.entry.level}: ${message.params.entry.text}`);
      }
    });
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.once("open", resolve);
      this.ws.once("error", reject);
    });
    await this.send("Page.enable");
    await this.send("Runtime.enable");
    await this.send("Log.enable").catch(() => {});
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`${method} timed out`));
        }
      }, 15_000);
    });
  }

  async eval(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text ?? "Evaluation failed");
    }
    return result.result?.value;
  }

  async waitFor(expression, timeoutMs = 15_000) {
    const end = Date.now() + timeoutMs;
    let last;

    while (Date.now() < end) {
      try {
        last = await this.eval(expression);
        if (last) {
          return last;
        }
      } catch (error) {
        last = error.message;
      }
      await wait(150);
    }

    throw new Error(`waitFor timed out: ${expression}; last=${last}`);
  }

  async setViewport(width, height) {
    await this.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false
    });
    await this.send("Emulation.setVisibleSize", { width, height }).catch(() => {});
  }

  async screenshot(filePath) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const result = await this.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false
    });
    await fs.writeFile(filePath, Buffer.from(result.data, "base64"));
  }

  close() {
    this.ws.close();
  }
}

async function captureHostSelection(cdpOrigin, args) {
  const target = await newTarget(cdpOrigin, "about:blank");
  const page = new Page(target);
  await page.open();
  await page.setViewport(1440, 900);
  await page.send("Page.navigate", { url: args.hostUrl });
  await page.waitFor("document.readyState === 'complete' || document.readyState === 'interactive'", 20_000);
  await page.eval("localStorage.setItem('open-party-lab.host-language', 'en')");
  await page.send("Page.reload", { ignoreCache: true });
  await page.waitFor("Boolean(window.__openPartyLabHost)", 20_000);
  await page.waitFor("Boolean(window.__openPartyLabHost.getState().room)", 20_000);
  await page.eval("window.__openPartyLabHost.returnToGameSelection()");
  await page.waitFor("window.__openPartyLabHost.getState().room?.language === 'en'", 20_000);
  await page.eval(`(() => {
    const hideButton = Array.from(document.querySelectorAll('button')).find((button) => button.innerText.trim() === 'Hide');
    hideButton?.click();
    return true;
  })()`);
  await wait(1200);

  const outputPath = path.join(args.outputDir, "host-game-selection-en.png");
  await page.screenshot(outputPath);
  const gameNames = await page.eval("window.__openPartyLabHost.getState().room?.availableGames?.map((game) => game.displayName) ?? []");
  const errors = page.errors;
  page.close();

  return { outputPath, gameNames, errors };
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function createCollageHtml() {
  const available = [];

  for (const game of recommendedGames) {
    const imagePath = path.join(projectRoot, game.path);
    if (!existsSync(imagePath)) {
      continue;
    }

    available.push({
      name: game.name,
      url: pathToFileURL(imagePath).href
    });
  }

  if (available.length === 0) {
    throw new Error("No recommended game screenshots found. Clone/sync local recommended games first.");
  }

  const cards = available.map((game) => `
    <article class="card">
      <img src="${game.url}" alt="${escapeHtml(game.name)} screenshot" />
      <div class="label">${escapeHtml(game.name)}</div>
    </article>
  `).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      width: 1400px;
      height: 1028px;
      overflow: hidden;
      background: #06111f;
      color: #f8fafc;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    body {
      padding: 34px;
      background:
        radial-gradient(circle at 18% 12%, rgba(56, 189, 248, 0.28), transparent 30%),
        radial-gradient(circle at 86% 78%, rgba(245, 158, 11, 0.22), transparent 34%),
        #06111f;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 20px;
      margin-bottom: 22px;
    }
    h1 {
      margin: 0;
      font-size: 44px;
      font-weight: 760;
      letter-spacing: 0;
    }
    p {
      margin: 8px 0 0;
      color: #cbd5e1;
      font-size: 20px;
    }
    .badge {
      border: 1px solid rgba(148, 163, 184, 0.35);
      background: rgba(15, 23, 42, 0.72);
      border-radius: 999px;
      color: #bae6fd;
      font-size: 18px;
      font-weight: 700;
      padding: 10px 16px;
      white-space: nowrap;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
    }
    .card {
      position: relative;
      height: 250px;
      overflow: hidden;
      border: 1px solid rgba(148, 163, 184, 0.28);
      background: rgba(15, 23, 42, 0.85);
      box-shadow: 0 18px 50px rgba(2, 6, 23, 0.48);
    }
    .card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .label {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 44px 16px 14px;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0;
      background: linear-gradient(to top, rgba(2, 6, 23, 0.92), rgba(2, 6, 23, 0));
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.75);
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Recommended Games</h1>
      <p>Playable alpha and beta games loaded from optional local repos.</p>
    </div>
    <div class="badge">Open Party Lab</div>
  </header>
  <main class="grid">
    ${cards}
  </main>
</body>
</html>`;
}

async function captureCollage(cdpOrigin, args) {
  const html = await createCollageHtml();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "open-party-lab-collage-"));
  const htmlPath = path.join(tempDir, "collage.html");
  await fs.writeFile(htmlPath, html, "utf8");

  const target = await newTarget(cdpOrigin, pathToFileURL(htmlPath).href);
  const page = new Page(target);
  await page.open();
  await page.setViewport(1400, 1028);
  await page.waitFor("document.images.length > 0 && Array.from(document.images).every((image) => image.complete)", 20_000);
  await wait(500);

  const outputPath = path.join(args.outputDir, "recommended-games-collage.png");
  await page.screenshot(outputPath);
  const errors = page.errors;
  page.close();

  return { outputPath, errors };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const cdpOrigin = `http://127.0.0.1:${args.cdpPort}`;
  const browserProcess = await ensureBrowser(cdpOrigin, args.cdpPort, args.launchBrowser);

  try {
    await fs.mkdir(args.outputDir, { recursive: true });
    const hostSelection = await captureHostSelection(cdpOrigin, args);
    const collage = await captureCollage(cdpOrigin, args);

    console.log(JSON.stringify({
      ok: true,
      hostSelection,
      collage
    }, null, 2));
  } finally {
    if (browserProcess) {
      browserProcess.kill();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
