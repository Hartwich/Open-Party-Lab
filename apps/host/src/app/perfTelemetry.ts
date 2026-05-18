import Phaser from "phaser";
import {
  PerfTracker,
  clonePerfTelemetrySnapshot,
  type PerfTelemetrySampleInput,
  type PerfTelemetrySnapshot
} from "@open-party-lab/game-core";

export const hostPerfTelemetryRegistryKey = "hostPerfTelemetry";

export type HostPerfTelemetrySnapshot = PerfTelemetrySnapshot;
export type HostPerfTelemetrySampleInput = PerfTelemetrySampleInput;

type HostPerfTelemetryStore = Map<string, HostPerfTelemetrySnapshot>;

function readStore(game: Phaser.Game): HostPerfTelemetryStore {
  return (game.registry.get(hostPerfTelemetryRegistryKey) as HostPerfTelemetryStore | undefined) ?? new Map();
}

export class HostPerfTracker {
  private readonly tracker: PerfTracker;

  constructor(
    private readonly game: Phaser.Game,
    private readonly sceneKey: string,
    sourceId = sceneKey
  ) {
    this.tracker = new PerfTracker({
      sourceKind: "host",
      ownerKey: sceneKey,
      sourceId,
      publishEveryMs: 120,
      onPublish: (snapshot) => {
        const cloned = clonePerfTelemetrySnapshot(snapshot);

        if (!cloned) {
          return;
        }

        const nextStore = new Map(readStore(this.game));
        nextStore.set(this.sceneKey, cloned);
        this.game.registry.set(hostPerfTelemetryRegistryKey, nextStore);
      }
    });
  }

  sample(input: HostPerfTelemetrySampleInput): HostPerfTelemetrySnapshot {
    return this.tracker.sample(input);
  }

  clear(): void {
    this.tracker.clear();
    const nextStore = new Map(readStore(this.game));
    nextStore.delete(this.sceneKey);
    this.game.registry.set(hostPerfTelemetryRegistryKey, nextStore);
  }
}

export function readHostPerfTelemetry(
  game: Phaser.Game,
  ownerKey?: string
): HostPerfTelemetrySnapshot | null {
  const store = readStore(game);

  if (ownerKey) {
    return store.get(ownerKey) ?? null;
  }

  let latest: HostPerfTelemetrySnapshot | null = null;

  for (const snapshot of store.values()) {
    if (!latest || snapshot.updatedAtMs > latest.updatedAtMs) {
      latest = snapshot;
    }
  }

  return latest;
}

export function listHostPerfTelemetry(game: Phaser.Game): HostPerfTelemetrySnapshot[] {
  return Array.from(readStore(game).values());
}
