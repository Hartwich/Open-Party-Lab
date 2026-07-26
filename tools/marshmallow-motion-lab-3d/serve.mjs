import { createReadStream, existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./", import.meta.url));
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const presetPath = join(root, "presets", "marshmallow-3d-presets.json");
const port = Number(process.env.PORT ?? 4179);

const vendorRoutes = [
  { prefix: "/vendor/three/", target: join(repoRoot, "node_modules", "three", "build") },
  { prefix: "/vendor/three-addons/", target: join(repoRoot, "node_modules", "three", "examples", "jsm") }
];

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

const profileBounds = {
  bodyRadius: [0.3, 1.1],
  bodyHeight: [0.4, 1.8],
  roundness: [0, 1],
  warp: [0, 1],
  footGap: [0, 1],
  footSize: [0.6, 1.6],
  legMotion: [0, 1],
  armHeight: [0, 1],
  armGap: [0, 1],
  armSize: [0.6, 1.6],
  bodyLift: [0, 1],
  toast: [0, 1]
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
  const profile = { bodyVariant: variant };
  for (const [key, [minimum, maximum]] of Object.entries(profileBounds)) {
    const number = Number(value[key]);
    if (!Number.isFinite(number)) throw new Error(`${variant}.${key}: keine Zahl`);
    profile[key] = Math.max(minimum, Math.min(maximum, Number(number.toFixed(4))));
  }
  profile.actionHand = value.actionHand === "left" ? "left" : "right";
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

function resolveVendor(pathname) {
  for (const route of vendorRoutes) {
    if (!pathname.startsWith(route.prefix)) continue;
    const absolute = normalize(join(route.target, pathname.slice(route.prefix.length)));
    if (!absolute.startsWith(route.target)) return null;
    return absolute;
  }
  return null;
}

function serveFile(response, absolutePath) {
  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(absolutePath)] ?? "application/octet-stream",
    "Cache-Control": "no-store"
  });
  createReadStream(absolutePath).pipe(response);
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
          path: "tools/marshmallow-motion-lab-3d/presets/marshmallow-3d-presets.json"
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

  const vendorPath = resolveVendor(pathname);
  if (vendorPath) {
    if (!existsSync(vendorPath) || !statSync(vendorPath).isFile()) {
      response.writeHead(404).end("three.js nicht gefunden - bitte im Plattform-Root 'npm install' ausfuehren");
      return;
    }
    serveFile(response, vendorPath);
    return;
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/u, "");
  const absolutePath = normalize(join(root, relativePath));
  if (!absolutePath.startsWith(root) || !existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }
  serveFile(response, absolutePath);
}).listen(port, "127.0.0.1", () => {
  const threeBuild = join(repoRoot, "node_modules", "three", "build", "three.module.js");
  if (!existsSync(threeBuild)) {
    console.warn("Warnung: node_modules/three fehlt. Im Plattform-Root bitte 'npm install' ausfuehren.");
  }
  console.log(`Marshmallow Motion Lab 3D: http://127.0.0.1:${port}`);
});
