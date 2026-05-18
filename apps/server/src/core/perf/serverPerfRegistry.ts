import {
  PerfTracker,
  clonePerfTelemetrySnapshot,
  type PerfTelemetrySampleInput,
  type PerfTelemetrySnapshot
} from "@open-party-lab/game-core";

class ServerPerfRegistry {
  private readonly trackers = new Map<string, PerfTracker>();
  private readonly snapshots = new Map<string, PerfTelemetrySnapshot>();

  sample(
    ownerKey: string,
    sourceId: string,
    input: PerfTelemetrySampleInput
  ): PerfTelemetrySnapshot {
    return this.resolveTracker(ownerKey, sourceId).sample(input);
  }

  flush(ownerKey: string, sourceId: string): PerfTelemetrySnapshot {
    return this.resolveTracker(ownerKey, sourceId).flush();
  }

  clear(ownerKey?: string): void {
    if (ownerKey) {
      this.trackers.get(ownerKey)?.clear();
      this.trackers.delete(ownerKey);
      this.snapshots.delete(ownerKey);
      return;
    }

    for (const tracker of this.trackers.values()) {
      tracker.clear();
    }

    this.trackers.clear();
    this.snapshots.clear();
  }

  listSnapshots(): PerfTelemetrySnapshot[] {
    return Array.from(this.snapshots.values())
      .map((snapshot) => clonePerfTelemetrySnapshot(snapshot))
      .filter((snapshot): snapshot is PerfTelemetrySnapshot => snapshot !== null)
      .sort((left, right) => left.ownerKey.localeCompare(right.ownerKey));
  }

  private resolveTracker(ownerKey: string, sourceId: string): PerfTracker {
    const existing = this.trackers.get(ownerKey);

    if (existing) {
      return existing;
    }

    const tracker = new PerfTracker({
      sourceKind: "server",
      ownerKey,
      sourceId,
      publishEveryMs: 200,
      onPublish: (snapshot) => {
        const cloned = clonePerfTelemetrySnapshot(snapshot);

        if (cloned) {
          this.snapshots.set(ownerKey, cloned);
        }
      }
    });

    this.trackers.set(ownerKey, tracker);
    return tracker;
  }
}

export const serverPerfRegistry = new ServerPerfRegistry();
