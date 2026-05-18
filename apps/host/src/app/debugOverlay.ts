import Phaser from "phaser";
import {
  clonePerfTelemetrySnapshot,
  type PerfLogPayload,
  type PerfLogSample,
  type PerfTelemetrySnapshot
} from "@open-party-lab/game-core";
import type { HostSocketClient } from "./hostSocketClient.js";
import { listHostPerfTelemetry } from "./perfTelemetry.js";
import {
  applyStyles,
  createChromeCard,
  hostChrome,
  trapChromePointerEvents
} from "../ui/chrome/hostChrome.js";

const debugPreferenceKey = "open-party-lab.host-debug-overlay";

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

function detectRenderer(game: Phaser.Game): string {
  if (game.renderer instanceof Phaser.Renderer.Canvas.CanvasRenderer) {
    return "Canvas";
  }

  if (game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
    return "WebGL";
  }

  return "Unbekannt";
}

function resolvePreferredPerfSnapshot(
  game: Phaser.Game,
  gameId: string | null | undefined,
  currentSceneKey: string | null | undefined
): PerfTelemetrySnapshot | null {
  const snapshots = listHostPerfTelemetry(game);
  const preferredByScene =
    (currentSceneKey ? snapshots.find((snapshot) => snapshot.ownerKey === currentSceneKey) : null) ?? null;

  if (preferredByScene?.tags.mapId) {
    return preferredByScene;
  }

  const matchingGameSnapshots = snapshots
    .filter((snapshot) => snapshot.tags.gameId === gameId)
    .sort((left, right) => right.updatedAtMs - left.updatedAtMs);

  return matchingGameSnapshots[0] ?? preferredByScene ?? null;
}

export function mountDebugOverlay(game: Phaser.Game, client: HostSocketClient): () => void {
  let enabled = readDebugPreference();
  let destroyed = false;
  let lastRenderAt = 0;
  let recording = false;
  let saving = false;
  let recordingStartedAt = 0;
  let lastRecordedAt = 0;
  let statusMessage = "Bereit";
  let recordedSamples: PerfLogSample[] = [];
  let measuredFps = 0;
  const stepTimestampsMs: number[] = [];

  const overlay = document.createElement("aside");
  trapChromePointerEvents(overlay);
  applyStyles(overlay, {
    position: "fixed",
    left: hostChrome.offset.edge,
    bottom: hostChrome.offset.edge,
    zIndex: hostChrome.zIndex.debug,
    maxWidth: "min(340px, calc(100vw - 24px))",
    pointerEvents: "none",
    display: enabled ? "block" : "none"
  });

  const card = createChromeCard("dark");
  card.style.gap = "8px";
  card.style.padding = "12px 14px";
  card.style.background = "rgba(15, 23, 42, 0.96)";
  card.style.boxShadow = "0 12px 28px rgba(2, 6, 23, 0.26)";
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
  body.style.fontSize = "16px";
  body.style.fontWeight = "700";
  body.style.lineHeight = "1.45";
  body.style.color = "#cbd5e1";
  card.appendChild(body);

  document.body.appendChild(overlay);

  function resolveMeasuredFps(nowMs: number): number {
    while (stepTimestampsMs.length > 0 && nowMs - stepTimestampsMs[0] > 1_000) {
      stepTimestampsMs.shift();
    }

    if (stepTimestampsMs.length < 2) {
      return stepTimestampsMs.length === 1 && nowMs - stepTimestampsMs[0] <= 250 ? measuredFps : 0;
    }

    const first = stepTimestampsMs[0] ?? nowMs;
    const last = stepTimestampsMs[stepTimestampsMs.length - 1] ?? nowMs;
    const spanMs = Math.max(1, last - first);

    return ((stepTimestampsMs.length - 1) * 1000) / spanMs;
  }

  function handlePostStep(): void {
    const nowMs = performance.now();
    stepTimestampsMs.push(nowMs);
    measuredFps = resolveMeasuredFps(nowMs);
  }

  game.events.on(Phaser.Core.Events.POST_STEP, handlePostStep);

  function updateVisibility(): void {
    overlay.style.display = enabled ? "block" : "none";
  }

  function shouldRenderOverlay(): boolean {
    return enabled || recording || saving;
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
    const currentScene = game.scene.getScenes(true)[0];
    const perfMetrics = resolvePreferredPerfSnapshot(
      game,
      state.room?.selectedGameId ?? null,
      currentScene?.scene.key ?? null
    );
    const nowMs = Date.now();
    const payload: PerfLogPayload = {
      capturedAt: new Date(nowMs).toISOString(),
      capturedAtMs: nowMs,
      sourceKind: "host",
      source: "host-debug-overlay",
      roomCode: state.room?.code ?? null,
      gameId: state.room?.selectedGameId ?? null,
      sceneKey: perfMetrics?.ownerKey ?? currentScene?.scene.key ?? null,
      mapId: typeof perfMetrics?.tags.mapId === "string" ? perfMetrics.tags.mapId : null,
      renderer: detectRenderer(game),
      userAgent: navigator.userAgent,
      meta: {
        currentSceneKey: currentScene?.scene.key ?? null,
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
    if (!shouldRenderOverlay()) {
      return;
    }

    measuredFps = resolveMeasuredFps(performance.now());
    body.textContent = `FPS ${measuredFps.toFixed(1)}`;

    if (!recording) {
      return;
    }

    const state = client.getState();
    const currentScene = game.scene.getScenes(true)[0];
    const gameState = state.game;
    const perfMetrics = resolvePreferredPerfSnapshot(
      game,
      state.room?.selectedGameId ?? null,
      currentScene?.scene.key ?? null
    );
    const now = performance.now();

    if (now - lastRecordedAt >= 200) {
      recordedSamples.push({
        capturedAtMs: Date.now(),
        elapsedMs: now - recordingStartedAt,
        fps: measuredFps,
        frameTimeMs: game.loop.delta,
        phase: gameState?.phase ?? null,
        perfMetrics: clonePerfTelemetrySnapshot(perfMetrics),
        info: {
          sceneKey: currentScene?.scene.key ?? null,
          roomCode: state.room?.code ?? null,
          gameId: state.room?.selectedGameId ?? null
        }
      });
      lastRecordedAt = now;
      updateControls();
    }
  }

  function scheduleLoop(): void {
    if (destroyed) {
      return;
    }

    const now = performance.now();

    if (shouldRenderOverlay() && now - lastRenderAt >= 200) {
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
    updateVisibility();
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

  window.addEventListener("keydown", handleKeydown);
  updateVisibility();
  updateControls();
  if (shouldRenderOverlay()) {
    render();
  }
  window.requestAnimationFrame(scheduleLoop);

  return () => {
    destroyed = true;
    game.events.off(Phaser.Core.Events.POST_STEP, handlePostStep);
    window.removeEventListener("keydown", handleKeydown);
    overlay.remove();
  };
}
