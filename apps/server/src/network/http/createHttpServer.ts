import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type Server as HttpServer, type ServerResponse } from "node:http";
import { join } from "node:path";
import type { PerfLogPayload } from "@open-party-lab/game-core";
import type { AppEnv } from "../../core/config/env.js";
import { serverPerfRegistry } from "../../core/perf/serverPerfRegistry.js";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type"
} as const;

function writeJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown
): void {
  response.writeHead(statusCode, {
    ...corsHeaders,
    "content-type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;

    if (totalBytes > 2_000_000) {
      throw new Error("payload_too_large");
    }

    chunks.push(buffer);
  }

  const body = Buffer.concat(chunks).toString("utf-8");
  return body.length > 0 ? JSON.parse(body) : {};
}

function sanitizeFilePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "unknown";
}

async function handlePerfLogRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  try {
    const payload = (await readJsonBody(request)) as PerfLogPayload;
    const sourceKind =
      payload.sourceKind === "host" || payload.sourceKind === "controller" || payload.sourceKind === "server"
        ? payload.sourceKind
        : "host";
    const scope = sanitizeFilePart(
      typeof payload.sceneKey === "string"
        ? payload.sceneKey
        : typeof payload.routeKey === "string"
          ? payload.routeKey
          : sourceKind
    );
    const gameId = sanitizeFilePart(typeof payload.gameId === "string" ? payload.gameId : "unknown-game");
    const mapId = sanitizeFilePart(typeof payload.mapId === "string" ? payload.mapId : "unknown-map");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const directory = join(process.cwd(), "Temp", "perf-logs");
    const fileName = `${stamp}-${sourceKind}-${gameId}-${scope}-${mapId}-${randomUUID().slice(0, 8)}.json`;
    const filePath = join(directory, fileName);
    const enrichedPayload: PerfLogPayload = {
      ...payload,
      sourceKind,
      serverSnapshots: serverPerfRegistry.listSnapshots()
    };

    await mkdir(directory, { recursive: true });
    await writeFile(filePath, JSON.stringify(enrichedPayload, null, 2), "utf-8");

    writeJson(response, 201, {
      ok: true,
      file: `Temp/perf-logs/${fileName}`
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      writeJson(response, 400, { ok: false, error: "Ungueltiges JSON." });
      return;
    }

    if (error instanceof Error && error.message === "payload_too_large") {
      writeJson(response, 413, { ok: false, error: "Log-Datei ist zu gross." });
      return;
    }

    writeJson(response, 500, { ok: false, error: "Perf-Log konnte nicht gespeichert werden." });
  }
}

export function createHttpServer(env: AppEnv): HttpServer {
  return createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");

    if (request.method === "OPTIONS") {
      response.writeHead(204, corsHeaders);
      response.end();
      return;
    }

    if (url.pathname === "/debug/perf-log" && request.method === "POST") {
      void handlePerfLogRequest(request, response);
      return;
    }

    if (url.pathname === "/debug/perf-state" && request.method === "GET") {
      writeJson(response, 200, {
        ok: true,
        snapshots: serverPerfRegistry.listSnapshots()
      });
      return;
    }

    if (url.pathname === "/health") {
      writeJson(response, 200, { status: "ok", port: env.port });
      return;
    }

    writeJson(response, 200, {
      name: "open-party-lab-server",
      status: "running",
      controllerOrigin: env.publicControllerOrigin
    });
  });
}
