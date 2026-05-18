export type PerfTelemetrySourceKind = "host" | "controller" | "server";

export type PerfTelemetryValue = string | number | boolean | null;

export interface PerfTelemetryMetric {
  lastMs: number;
  avgMs: number;
  maxMs: number;
}

export interface PerfTelemetrySnapshot {
  sourceKind: PerfTelemetrySourceKind;
  ownerKey: string;
  sourceId: string;
  updatedAtMs: number;
  sampleCount: number;
  updatesPerSec: number;
  timings: Record<string, PerfTelemetryMetric>;
  counters: Record<string, number>;
  tags: Record<string, PerfTelemetryValue>;
  flags: Record<string, boolean>;
}

export interface PerfTelemetrySampleInput {
  sourceId?: string;
  timingsMs?: Record<string, number | undefined>;
  counters?: Record<string, number | undefined>;
  tags?: Record<string, PerfTelemetryValue | undefined>;
  flags?: Record<string, boolean | undefined>;
}

export interface PerfTrackerOptions {
  sourceKind: PerfTelemetrySourceKind;
  ownerKey: string;
  sourceId?: string;
  publishEveryMs?: number;
  smoothingFactor?: number;
  now?: () => number;
  onPublish?: (snapshot: PerfTelemetrySnapshot) => void;
}

export interface PerfLogSample {
  capturedAtMs: number;
  elapsedMs: number;
  fps?: number | null;
  frameTimeMs?: number | null;
  phase?: string | null;
  perfMetrics?: PerfTelemetrySnapshot | null;
  info?: Record<string, PerfTelemetryValue>;
}

export interface PerfLogPayload {
  capturedAt: string;
  capturedAtMs: number;
  sourceKind: PerfTelemetrySourceKind;
  source: string;
  roomCode: string | null;
  gameId: string | null;
  sceneKey?: string | null;
  routeKey?: string | null;
  mapId?: string | null;
  renderer?: string | null;
  userAgent?: string | null;
  meta?: Record<string, PerfTelemetryValue>;
  sampleCount: number;
  durationMs: number;
  samples: PerfLogSample[];
  serverSnapshots?: PerfTelemetrySnapshot[];
}

interface MutablePerfTelemetrySnapshot extends PerfTelemetrySnapshot {
  timings: Record<string, PerfTelemetryMetric>;
  counters: Record<string, number>;
  tags: Record<string, PerfTelemetryValue>;
  flags: Record<string, boolean>;
}

function defaultNow(): number {
  const candidate = (globalThis as { performance?: { now?: () => number } }).performance;
  return typeof candidate?.now === "function" ? candidate.now() : Date.now();
}

function smoothMetric(previous: number, next: number, smoothingFactor: number): number {
  if (!Number.isFinite(previous) || previous <= 0) {
    return next;
  }

  return previous * (1 - smoothingFactor) + next * smoothingFactor;
}

function createSnapshot(
  sourceKind: PerfTelemetrySourceKind,
  ownerKey: string,
  sourceId: string
): MutablePerfTelemetrySnapshot {
  return {
    sourceKind,
    ownerKey,
    sourceId,
    updatedAtMs: 0,
    sampleCount: 0,
    updatesPerSec: 0,
    timings: {},
    counters: {},
    tags: {},
    flags: {}
  };
}

export class PerfTracker {
  private readonly nowProvider: () => number;
  private readonly publishEveryMs: number;
  private readonly smoothingFactor: number;
  private readonly onPublish?: (snapshot: PerfTelemetrySnapshot) => void;
  private lastSampleAt = 0;
  private lastPublishAt = 0;
  private readonly snapshot: MutablePerfTelemetrySnapshot;

  constructor(options: PerfTrackerOptions) {
    this.nowProvider = options.now ?? defaultNow;
    this.publishEveryMs = Math.max(0, options.publishEveryMs ?? 120);
    this.smoothingFactor = Math.min(0.95, Math.max(0.01, options.smoothingFactor ?? 0.2));
    this.onPublish = options.onPublish;
    this.snapshot = createSnapshot(
      options.sourceKind,
      options.ownerKey,
      options.sourceId ?? options.ownerKey
    );
  }

  sample(input: PerfTelemetrySampleInput): PerfTelemetrySnapshot {
    const now = this.nowProvider();

    if (this.lastSampleAt > 0) {
      const updatesPerSec = 1000 / Math.max(1, now - this.lastSampleAt);
      this.snapshot.updatesPerSec = smoothMetric(
        this.snapshot.updatesPerSec,
        updatesPerSec,
        this.smoothingFactor
      );
    }

    this.lastSampleAt = now;
    this.snapshot.sampleCount += 1;

    if (input.sourceId) {
      this.snapshot.sourceId = input.sourceId;
    }

    for (const [key, value] of Object.entries(input.timingsMs ?? {})) {
      if (value === undefined || !Number.isFinite(value)) {
        continue;
      }

      const previous = this.snapshot.timings[key];
      this.snapshot.timings[key] = {
        lastMs: value,
        avgMs: smoothMetric(previous?.avgMs ?? 0, value, this.smoothingFactor),
        maxMs: Math.max(previous?.maxMs ?? 0, value)
      };
    }

    for (const [key, value] of Object.entries(input.counters ?? {})) {
      if (value === undefined || !Number.isFinite(value)) {
        continue;
      }

      this.snapshot.counters[key] = value;
    }

    for (const [key, value] of Object.entries(input.tags ?? {})) {
      if (value !== undefined) {
        this.snapshot.tags[key] = value;
      }
    }

    for (const [key, value] of Object.entries(input.flags ?? {})) {
      if (value !== undefined) {
        this.snapshot.flags[key] = value;
      }
    }

    if (this.publishEveryMs === 0 || now - this.lastPublishAt >= this.publishEveryMs) {
      this.publish(now);
    }

    return this.snapshot;
  }

  flush(): PerfTelemetrySnapshot {
    this.publish(this.nowProvider());
    return this.snapshot;
  }

  clear(): void {
    const nextSnapshot = createSnapshot(
      this.snapshot.sourceKind,
      this.snapshot.ownerKey,
      this.snapshot.sourceId
    );
    this.lastSampleAt = 0;
    this.lastPublishAt = 0;
    this.snapshot.updatedAtMs = nextSnapshot.updatedAtMs;
    this.snapshot.sampleCount = nextSnapshot.sampleCount;
    this.snapshot.updatesPerSec = nextSnapshot.updatesPerSec;
    this.snapshot.timings = nextSnapshot.timings;
    this.snapshot.counters = nextSnapshot.counters;
    this.snapshot.tags = nextSnapshot.tags;
    this.snapshot.flags = nextSnapshot.flags;
  }

  private publish(now: number): void {
    this.lastPublishAt = now;
    this.snapshot.updatedAtMs = Date.now();
    this.onPublish?.(this.snapshot);
  }
}

export function clonePerfTelemetrySnapshot(
  snapshot: PerfTelemetrySnapshot | null | undefined
): PerfTelemetrySnapshot | null {
  if (!snapshot) {
    return null;
  }

  return {
    sourceKind: snapshot.sourceKind,
    ownerKey: snapshot.ownerKey,
    sourceId: snapshot.sourceId,
    updatedAtMs: snapshot.updatedAtMs,
    sampleCount: snapshot.sampleCount,
    updatesPerSec: snapshot.updatesPerSec,
    timings: Object.fromEntries(
      Object.entries(snapshot.timings).map(([key, value]) => [key, { ...value }])
    ),
    counters: { ...snapshot.counters },
    tags: { ...snapshot.tags },
    flags: { ...snapshot.flags }
  };
}
