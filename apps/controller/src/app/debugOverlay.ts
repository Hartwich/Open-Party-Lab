import {
  clonePerfTelemetrySnapshot,
  type PerfLogPayload,
  type PerfLogSample,
  type PerfTelemetrySnapshot,
  type PerfTelemetryValue
} from "@open-party-lab/game-core";
import type { ControllerSocketClient, ControllerAppState } from "./controllerSocketClient.js";
import { readControllerPerfTelemetry } from "./perfTelemetry.js";

const debugPreferenceKey = "open-party-lab.controller-debug-overlay";

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readDebugPreference(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const query = new URLSearchParams(window.location.search);

  if (query.get("debug") === "1") {
    return true;
  }

  if (!hasLocalStorage()) {
    return false;
  }

  return window.localStorage.getItem(debugPreferenceKey) === "1";
}

function writeDebugPreference(enabled: boolean): void {
  if (!hasLocalStorage()) {
    return;
  }

  window.localStorage.setItem(debugPreferenceKey, enabled ? "1" : "0");
}

function formatMetricMs(metric: PerfTelemetrySnapshot["timings"][string]): string {
  return `${metric.lastMs.toFixed(2)} / ${metric.avgMs.toFixed(2)} / ${metric.maxMs.toFixed(2)} ms`;
}

function formatRecordLine(
  label: string,
  source: Record<string, PerfTelemetryValue> | Record<string, number> | Record<string, boolean>,
  preferredKeys: string[] = [],
  maxItems = 6
): string | null {
  const seen = new Set<string>();
  const parts: string[] = [];

  const pushEntry = (key: string, value: unknown) => {
    if (value === undefined || seen.has(key)) {
      return;
    }

    seen.add(key);
    parts.push(`${key} ${String(value)}`);
  };

  for (const key of preferredKeys) {
    pushEntry(key, source[key]);
  }

  for (const key of Object.keys(source).sort()) {
    if (parts.length >= maxItems) {
      break;
    }

    pushEntry(key, source[key]);
  }

  return parts.length > 0 ? `${label.padEnd(8, " ").slice(0, 8)} ${parts.join(" | ")}` : null;
}

function resolveRouteKey(state: ControllerAppState): string {
  if (!state.room || !state.player) {
    return state.hasStoredSession ? "reconnect" : "join";
  }

  if (state.room.selectedGameId && state.room.currentRound) {
    return "controller";
  }

  return "lobby";
}

export function mountControllerDebugOverlay(client: ControllerSocketClient): () => void {
  const initialEnabled = readDebugPreference();

  if (!initialEnabled) {
    return () => undefined;
  }

  let enabled: boolean = initialEnabled;
  let destroyed = false;
  let lastRenderAt = 0;
  let lastFrameAt = 0;
  let smoothedFrameMs = 0;
  let smoothedFps = 0;
  let recording = false;
  let saving = false;
  let recordingStartedAt = 0;
  let lastRecordedAt = 0;
  let statusMessage = enabled ? "Debug aktiv" : "Aktiviere mit ?debug=1";
  let recordedSamples: PerfLogSample[] = [];

  const overlay = document.createElement("aside");
  overlay.style.position = "fixed";
  overlay.style.right = "14px";
  overlay.style.bottom = "14px";
  overlay.style.zIndex = "58";
  overlay.style.maxWidth = "min(320px, calc(100vw - 24px))";
  overlay.style.pointerEvents = "none";
  overlay.style.display = enabled ? "block" : "none";

  const card = document.createElement("div");
  card.style.display = "grid";
  card.style.gap = "8px";
  card.style.padding = "12px 14px";
  card.style.borderRadius = "16px";
  card.style.border = "1px solid rgba(148, 163, 184, 0.18)";
  card.style.background = "rgba(2, 6, 23, 0.84)";
  card.style.backdropFilter = "blur(10px)";
  card.style.boxShadow = "0 18px 36px rgba(2, 6, 23, 0.35)";
  card.style.color = "#e2e8f0";
  card.style.fontFamily = "\"IBM Plex Mono\", \"Consolas\", monospace";
  card.style.pointerEvents = "auto";
  overlay.appendChild(card);

  const header = document.createElement("strong");
  header.textContent = "Debug";
  header.style.fontSize = "13px";
  header.style.letterSpacing = "0.08em";
  card.appendChild(header);

  const controls = document.createElement("div");
  controls.style.display = "flex";
  controls.style.gap = "8px";
  controls.style.flexWrap = "wrap";
  card.appendChild(controls);

  const recordButton = document.createElement("button");
  recordButton.type = "button";
  recordButton.style.padding = "6px 10px";
  recordButton.style.borderRadius = "10px";
  recordButton.style.border = "1px solid rgba(248, 113, 113, 0.28)";
  recordButton.style.background = "rgba(127, 29, 29, 0.55)";
  recordButton.style.color = "#fecaca";
  recordButton.style.font = "inherit";
  recordButton.style.cursor = "pointer";
  controls.appendChild(recordButton);

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.style.padding = "6px 10px";
  saveButton.style.borderRadius = "10px";
  saveButton.style.border = "1px solid rgba(56, 189, 248, 0.28)";
  saveButton.style.background = "rgba(8, 47, 73, 0.65)";
  saveButton.style.color = "#bae6fd";
  saveButton.style.font = "inherit";
  saveButton.style.cursor = "pointer";
  controls.appendChild(saveButton);

  const status = document.createElement("div");
  status.style.fontSize = "11px";
  status.style.lineHeight = "1.35";
  status.style.color = "#93c5fd";
  card.appendChild(status);

  const body = document.createElement("pre");
  body.style.margin = "0";
  body.style.whiteSpace = "pre-wrap";
  body.style.fontSize = "12px";
  body.style.lineHeight = "1.45";
  body.style.color = "#cbd5e1";
  card.appendChild(body);

  document.body.appendChild(overlay);

  function updateVisibility(): void {
    overlay.style.display = enabled ? "block" : "none";
  }

  function updateControls(): void {
    recordButton.textContent = recording ? "Stop" : "Record";
    recordButton.disabled = saving;
    saveButton.textContent = saving ? "Speichern..." : "Log sichern";
    saveButton.disabled = saving || recordedSamples.length === 0;
    recordButton.style.opacity = saving ? "0.55" : "1";
    saveButton.style.opacity = saveButton.disabled ? "0.55" : "1";

    if (recording) {
      const durationMs = Math.max(0, performance.now() - recordingStartedAt);
      status.textContent = `Aufnahme laeuft | ${recordedSamples.length} Samples | ${(durationMs / 1000).toFixed(1)} s`;
      return;
    }

    status.textContent = statusMessage;
  }

  async function saveRecording(): Promise<void> {
    if (saving || recordedSamples.length === 0) {
      return;
    }

    saving = true;
    statusMessage = "Speichere Log...";
    updateControls();

    const state = client.getState();
    const perfMetrics = readControllerPerfTelemetry();
    const nowMs = Date.now();
    const payload: PerfLogPayload = {
      capturedAt: new Date(nowMs).toISOString(),
      capturedAtMs: nowMs,
      sourceKind: "controller",
      source: "controller-debug-overlay",
      roomCode: state.room?.code ?? null,
      gameId: state.room?.selectedGameId ?? null,
      routeKey: resolveRouteKey(state),
      mapId: typeof perfMetrics?.tags.mapId === "string" ? perfMetrics.tags.mapId : null,
      renderer: "React",
      userAgent: navigator.userAgent,
      meta: {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      },
      sampleCount: recordedSamples.length,
      durationMs:
        recordedSamples.length > 0
          ? recordedSamples[recordedSamples.length - 1]?.elapsedMs ?? 0
          : 0,
      samples: recordedSamples
    };
    const result = await client.savePerfLog(payload);

    saving = false;

    if (result.ok) {
      statusMessage = `Gespeichert: ${result.file ?? "Temp/perf-logs"}`;
      recordedSamples = [];
      recording = false;
      recordingStartedAt = 0;
      lastRecordedAt = 0;
    } else {
      statusMessage = `Fehler: ${result.error ?? "Log konnte nicht gespeichert werden."}`;
    }

    updateControls();
    render();
  }

  function render(): void {
    if (!enabled) {
      return;
    }

    const state = client.getState();
    const perfMetrics = readControllerPerfTelemetry();
    const routeKey = resolveRouteKey(state);
    const gameName =
      state.room?.availableGames.find((entry) => entry.id === state.room?.selectedGameId)?.displayName ??
      state.room?.selectedGameId ??
      "-";

    const lines = [
      `FPS      ${smoothedFps.toFixed(1)}`,
      `Frame    ${smoothedFrameMs.toFixed(1)} ms`,
      `Route    ${routeKey}`,
      `Raum     ${state.room?.code ?? "-"}`,
      `Phase    ${state.game?.phase ?? state.room?.lifecycle ?? "-"}`,
      `Spiel    ${gameName}`,
      `Spieler  ${state.room?.players.length ?? 0}`,
      `Socket   ${state.connected ? "online" : "offline"}`
    ];

    const now = performance.now();
    if (recording && now - lastRecordedAt >= 200) {
      recordedSamples.push({
        capturedAtMs: Date.now(),
        elapsedMs: now - recordingStartedAt,
        fps: smoothedFps,
        frameTimeMs: smoothedFrameMs,
        phase: state.game?.phase ?? null,
        perfMetrics: clonePerfTelemetrySnapshot(perfMetrics),
        info: {
          routeKey,
          roomCode: state.room?.code ?? null,
          gameId: state.room?.selectedGameId ?? null
        }
      });
      lastRecordedAt = now;
      updateControls();
    }

    if (perfMetrics) {
      lines.push("", `Perf ${perfMetrics.sourceId}`);
      lines.push(`Updates  ${perfMetrics.updatesPerSec.toFixed(1)} / s | Samples ${perfMetrics.sampleCount}`);

      for (const [key, metric] of Object.entries(perfMetrics.timings)) {
        lines.push(`${key.padEnd(8, " ").slice(0, 8)} ${formatMetricMs(metric)}`);
      }

      const tagLine = formatRecordLine("Tags", perfMetrics.tags, ["gameId", "mapId", "phase", "layout"]);
      const counterLine = formatRecordLine(
        "Counts",
        perfMetrics.counters,
        ["players", "buildSlots", "pathCells", "ownedTowers", "towerTypes", "enemyTypes"]
      );
      const flagLine = formatRecordLine("Flags", perfMetrics.flags);

      if (tagLine) {
        lines.push(tagLine);
      }

      if (counterLine) {
        lines.push(counterLine);
      }

      if (flagLine) {
        lines.push(flagLine);
      }
    }

    lines.push("", "Controller-Debug per ?debug=1");
    body.textContent = lines.join("\n");
  }

  function scheduleLoop(): void {
    if (destroyed) {
      return;
    }

    const now = performance.now();

    if (lastFrameAt > 0) {
      const delta = now - lastFrameAt;
      smoothedFrameMs = smoothedFrameMs > 0 ? smoothedFrameMs * 0.8 + delta * 0.2 : delta;
      smoothedFps = smoothedFrameMs > 0 ? 1000 / smoothedFrameMs : 0;
    }

    lastFrameAt = now;

    if (now - lastRenderAt >= 200) {
      render();
      lastRenderAt = now;
    }

    window.requestAnimationFrame(scheduleLoop);
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.repeat || event.key.toLowerCase() !== "d") {
      return;
    }

    const target = event.target as HTMLElement | null;
    const tagName = target?.tagName;
    const isFormField =
      tagName === "INPUT" ||
      tagName === "TEXTAREA" ||
      tagName === "SELECT" ||
      target?.isContentEditable === true;

    if (isFormField) {
      return;
    }

    enabled = !enabled;
    writeDebugPreference(enabled);
    statusMessage = enabled ? "Debug aktiv" : "Debug verborgen";
    updateVisibility();
    updateControls();
    render();
  }

  recordButton.addEventListener("click", () => {
    if (saving) {
      return;
    }

    if (recording) {
      recording = false;
      statusMessage = `${recordedSamples.length} Samples bereit.`;
      updateControls();
      return;
    }

    recordedSamples = [];
    recording = true;
    recordingStartedAt = performance.now();
    lastRecordedAt = 0;
    statusMessage = "Aufnahme gestartet.";
    updateControls();
    render();
  });

  saveButton.addEventListener("click", () => {
    void saveRecording();
  });

  const unsubscribe = client.subscribe(() => {
    render();
  });

  window.addEventListener("keydown", handleKeydown);
  updateVisibility();
  updateControls();
  render();
  window.requestAnimationFrame(scheduleLoop);

  return () => {
    destroyed = true;
    unsubscribe();
    window.removeEventListener("keydown", handleKeydown);
    overlay.remove();
  };
}
