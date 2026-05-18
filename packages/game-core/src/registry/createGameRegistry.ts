import type { GameManifest } from "../types/GameManifest.js";

export function createGameRegistry<TEntry extends { manifest: GameManifest }>(
  entries: readonly TEntry[]
): Map<string, TEntry> {
  return new Map(entries.map((entry) => [entry.manifest.id, entry]));
}
