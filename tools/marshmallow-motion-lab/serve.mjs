import { createReadStream, existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./", import.meta.url));
const presetPath = join(root, "presets", "marshmallow-rig-presets.json");
const port = Number(process.env.PORT ?? 4178);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png"
};

const profileBounds = {
  warp: [0, 1],
  limbGap: [0, 1],
  torsoHeight: [0, 1],
  legSize: [0.7, 1.4],
  legMotion: [0, 1],
  armHeight: [0, 1],
  armGap: [0, 1],
  armSize: [0.7, 1.4],
  twoHandOffset: [0, 140],
  helmetHeight: [0, 1],
  helmetScale: [0.5, 1.5],
  headbandHeight: [0, 1],
  headbandScale: [0.5, 1.5]
};

const profileDefaults = {
  warp: 0.55, limbGap: 0.7, torsoHeight: 0.66, legSize: 1, legMotion: 0.6,
  armHeight: 0.5, armGap: 0.5, armSize: 1, twoHandOffset: 42,
  helmetHeight: 0.37, helmetScale: 0.8, headbandHeight: 0.73, headbandScale: 1
};

function sendJson(response, status, value) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(`${JSON.stringify(value, null, 2)}\n`);
}

function sanitizeProfile(variant, value) {
  if (!value || typeof value !== "object") throw new Error(`${variant}: Profil fehlt`);
  const profile = { torsoVariant: variant };
  for (const [key, [minimum, maximum]] of Object.entries(profileBounds)) {
    const number = Number(value[key] ?? profileDefaults[key]);
    if (!Number.isFinite(number)) throw new Error(`${variant}.${key}: keine Zahl`);
    profile[key] = Math.max(minimum, Math.min(maximum, number));
  }
  profile.actionHand = value.actionHand === "left" ? "left" : "right";
  profile.headgear = ["helmet", "headband"].includes(value.headgear) ? value.headgear : "none";
  return profile;
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 64_000) reject(new Error("Payload zu groß"));
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Ungültiges JSON"));
      }
    });
    request.on("error", reject);
  });
}

createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? "/", `http://${request.headers.host}`).pathname);
  if (pathname === "/api/presets") {
    if (request.method === "GET") {
      sendJson(response, 200, JSON.parse(readFileSync(presetPath, "utf8")));
      return;
    }
    if (request.method === "POST") {
      try {
        const payload = await readJsonBody(request);
        const stored = JSON.parse(readFileSync(presetPath, "utf8"));
        const incoming = payload?.profiles;
        if (!incoming || typeof incoming !== "object") throw new Error("profiles fehlt");
        for (const variant of ["wide", "square", "tall"]) {
          if (incoming[variant]) stored.profiles[variant] = sanitizeProfile(variant, incoming[variant]);
        }
        stored.updatedAt = new Date().toISOString();
        writeFileSync(presetPath, `${JSON.stringify(stored, null, 2)}\n`, "utf8");
        sendJson(response, 200, {
          ok: true,
          path: "tools/marshmallow-motion-lab/presets/marshmallow-rig-presets.json"
        });
      } catch (error) {
        sendJson(response, 400, {
          error: error instanceof Error ? error.message : "Speichern fehlgeschlagen"
        });
      }
      return;
    }
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/u, "");
  const absolutePath = normalize(join(root, relativePath));
  if (!absolutePath.startsWith(root) || !existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(absolutePath)] ?? "application/octet-stream",
    "Cache-Control": "no-store"
  });
  createReadStream(absolutePath).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Marshmallow Motion Lab: http://127.0.0.1:${port}`);
});
