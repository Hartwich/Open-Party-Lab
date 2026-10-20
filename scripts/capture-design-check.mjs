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
const cdpPort = 9233;
const cdpOrigin = `http://127.0.0.1:${cdpPort}`;
const outDir = path.join(projectRoot, "docs", "screenshots", "design-check");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function requestJson(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const request = http.request(url, { method }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => (body += chunk));
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

async function isCdpAvailable() {
  try {
    await requestJson(`${cdpOrigin}/json/version`);
    return true;
  } catch {
    return false;
  }
}

function findChrome() {
  const candidates = [
    process.env.CHROMIUM_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
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
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result ?? {});
        return;
      }
      if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
        this.errors.push(message.params.entry.text);
      }
      if (message.method === "Runtime.exceptionThrown") {
        this.errors.push(message.params.exceptionDetails?.text ?? "exception");
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
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
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
        if (last) return last;
      } catch (error) {
        last = error.message;
      }
      await wait(150);
    }
    throw new Error(`waitFor timed out: ${expression}; last=${last}`);
  }

  async setViewport(width, height, mobile = false) {
    await this.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
      screenWidth: width,
      screenHeight: height
    });
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

async function newTarget(url) {
  return requestJson(`${cdpOrigin}/json/new?${encodeURIComponent(url)}`, "PUT");
}

async function main() {
  let child = null;
  if (!(await isCdpAvailable())) {
    const executable = findChrome();
    if (!executable) throw new Error("No Chrome/Edge found.");
    const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "design-check-"));
    child = spawn(executable, [
      "--headless=new",
      "--disable-gpu",
      `--remote-debugging-port=${cdpPort}`,
      "--remote-allow-origins=*",
      `--user-data-dir=${userDataDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "about:blank"
    ], { stdio: "ignore" });
    for (let attempt = 0; attempt < 40; attempt += 1) {
      if (await isCdpAvailable()) break;
      await wait(250);
    }
  }

  const controllerUrl = "http://127.0.0.1:5174/";
  const viewports = [
    { name: "phone", width: 390, height: 844, mobile: true },
    { name: "small-phone", width: 360, height: 640, mobile: true },
    { name: "pc", width: 1440, height: 900, mobile: false }
  ];

  for (const vp of viewports) {
    // Capture the loading/boot screen fresh (before boot completes).
    const targetBoot = await newTarget(controllerUrl);
    const pageBoot = new Page(targetBoot);
    await pageBoot.open();
    await pageBoot.setViewport(vp.width, vp.height, vp.mobile);
    await pageBoot.send("Page.navigate", { url: controllerUrl });
    await pageBoot.waitFor("document.readyState === 'complete'", 20_000);
    await pageBoot.waitFor("Boolean(document.querySelector('.hxh-loading'))", 20_000);
    await wait(400);
    await pageBoot.screenshot(path.join(outDir, `controller-loading-${vp.name}.png`));
    const loadingMetrics = await pageBoot.eval(`(() => {
      const card = document.querySelector('.hxh-loading .hxh-card');
      const doc = document.documentElement;
      return {
        overflowY: doc.scrollHeight > doc.clientHeight,
        scrollH: doc.scrollHeight,
        clientH: doc.clientHeight,
        cardH: card ? Math.round(card.getBoundingClientRect().height) : null,
        cardTop: card ? Math.round(card.getBoundingClientRect().top) : null,
        cardBottom: card ? Math.round(card.getBoundingClientRect().bottom) : null
      };
    })()`);
    console.log(`[${vp.name}] loading: ${JSON.stringify(loadingMetrics)}`);
    if (pageBoot.errors.length) console.log(`[${vp.name}] loading errors:`, pageBoot.errors);
    pageBoot.close();
    await wait(300);

    const target = await newTarget(controllerUrl);
    const page = new Page(target);
    await page.open();
    await page.setViewport(vp.width, vp.height, vp.mobile);
    await page.send("Page.navigate", { url: controllerUrl });
    await page.waitFor("document.readyState === 'complete'", 20_000);
    await page.waitFor("Boolean(document.querySelector('.hxh-entry, .hxh-loading'))", 20_000);
    await wait(2500);
    const out = path.join(outDir, `controller-join-${vp.name}.png`);
    await page.screenshot(out);
    const metrics = await page.eval(`(() => {
      const doc = document.documentElement;
      const content = document.querySelector('.hxh-content');
      const entry = document.querySelector('.hxh-entry');
      const contentChildren = content ? Array.from(content.children).map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return { cls: el.className || el.tagName, h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom), mt: cs.marginTop, mb: cs.marginBottom };
      }) : null;
      const card = document.querySelector('.hxh-entry .hxh-card');
      const avatarGrid = document.querySelector('.hxh-avatar-grid');
      return {
        scrollHeight: doc.scrollHeight,
        clientHeight: doc.clientHeight,
        overflowY: doc.scrollHeight > doc.clientHeight,
        entryHeight: entry ? entry.getBoundingClientRect().height : null,
        cardHeight: card ? card.getBoundingClientRect().height : null,
        cardTop: card ? card.getBoundingClientRect().top : null,
        cardBottom: card ? card.getBoundingClientRect().bottom : null,
        loadingPresent: Boolean(document.querySelector('.hxh-loading')),
        cardKids: card ? Array.from(card.children).filter((el) => !el.className?.toString().includes('hxh-corner')).map((el) => {
          const r = el.getBoundingClientRect();
          return { cls: (el.className || el.tagName).toString().slice(0, 28), h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom) };
        }) : null,
        avatarGridH: avatarGrid ? Math.round(avatarGrid.getBoundingClientRect().height) : null,
        contentHeight: content ? content.getBoundingClientRect().height : null,
        contentChildren,
        entryScrollH: entry ? entry.scrollHeight : null
      };
    })()`);
    console.log(`[${vp.name}] ${JSON.stringify(metrics)}`);
    if (page.errors.length) console.log(`[${vp.name}] errors:`, page.errors);
    await page.close();
    await wait(300);
  }

  if (child) child.kill();
  console.log("done ->", outDir);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
