import { createId } from "../../../../core/ids/createId.js";
import type { ArenaSurvivorPickupKind } from "@open-party-lab/protocol";
import {
  arenaSurvivorMaterialPickupDefinition,
  arenaSurvivorPickupDefinitionsById
} from "../definitions/pickupDefinitions.js";
import type { ArenaSurvivorRuntimePickupState } from "../arenaSurvivorState.js";

export interface PickupSpawnPoint {
  x: number;
  y: number;
  now: number;
  kind?: ArenaSurvivorPickupKind;
  value?: number;
}

export function createArenaSurvivorPickup(
  spawnPoint: PickupSpawnPoint
): ArenaSurvivorRuntimePickupState {
  const pickupDefinition =
    arenaSurvivorPickupDefinitionsById[spawnPoint.kind ?? arenaSurvivorMaterialPickupDefinition.id] ??
    arenaSurvivorMaterialPickupDefinition;

  return {
    id: createId("pickup"),
    definitionId: pickupDefinition.id,
    kind: pickupDefinition.kind,
    x: spawnPoint.x,
    y: spawnPoint.y,
    radius: pickupDefinition.radius,
    value: spawnPoint.value ?? pickupDefinition.value,
    ageMs: 0,
    lifetimeMs: pickupDefinition.lifetimeMs,
    spawnedAtMs: spawnPoint.now,
    targetPlayerId: null
  };
}
