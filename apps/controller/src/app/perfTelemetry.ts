import {
  PerfTracker,
  clonePerfTelemetrySnapshot,
  type PerfTelemetrySampleInput,
  type PerfTelemetrySnapshot
} from "@open-party-lab/game-core";

const controllerPerfSnapshots = new Map<string, PerfTelemetrySnapshot>();

export type ControllerPerfTelemetrySnapshot = PerfTelemetrySnapshot;
export type ControllerPerfTelemetrySampleInput = PerfTelemetrySampleInput;

export class ControllerPerfTracker {
  private readonly tracker: PerfTracker;

  constructor(
    private readonly ownerKey: string,
    sourceId = ownerKey
  ) {
    this.tracker = new PerfTracker({
      sourceKind: "controller",
      ownerKey,
      sourceId,
      publishEveryMs: 120,
      onPublish: (snapshot) => {
        const cloned = clonePerfTelemetrySnapshot(snapshot);

        if (cloned) {
          controllerPerfSnapshots.set(ownerKey, cloned);
        }
      }
    });
  }

  sample(input: ControllerPerfTelemetrySampleInput): ControllerPerfTelemetrySnapshot {
    return this.tracker.sample(input);
  }

  clear(): void {
    this.tracker.clear();
    controllerPerfSnapshots.delete(this.ownerKey);
  }
}

export function readControllerPerfTelemetry(
  ownerKey?: string
): ControllerPerfTelemetrySnapshot | null {
  if (ownerKey) {
    return controllerPerfSnapshots.get(ownerKey) ?? null;
  }

  let latest: ControllerPerfTelemetrySnapshot | null = null;

  for (const snapshot of controllerPerfSnapshots.values()) {
    if (!latest || snapshot.updatedAtMs > latest.updatedAtMs) {
      latest = snapshot;
    }
  }

  return latest;
}
