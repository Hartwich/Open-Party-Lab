import { arenaSurvivorConfig } from "../arenaSurvivorConfig.js";
import type { ArenaSurvivorPickupDefinition } from "@open-party-lab/protocol";

export const arenaSurvivorMaterialPickupDefinition = {
  id: "material",
  displayName: "Material",
  kind: "material",
  radius: arenaSurvivorConfig.pickupItemRadius,
  value: arenaSurvivorConfig.pickupValueBase,
  lifetimeMs: arenaSurvivorConfig.pickupLifetimeMs
} as const satisfies ArenaSurvivorPickupDefinition;

export const arenaSurvivorHealthPickupDefinition = {
  id: "health",
  displayName: "Heilkreuz",
  kind: "health",
  radius: arenaSurvivorConfig.healthPickupRadius,
  value: arenaSurvivorConfig.healthPickupHealAmount,
  lifetimeMs: arenaSurvivorConfig.pickupLifetimeMs
} as const satisfies ArenaSurvivorPickupDefinition;

export const arenaSurvivorPickupDefinitions = [
  arenaSurvivorMaterialPickupDefinition,
  arenaSurvivorHealthPickupDefinition
] as const;

export const arenaSurvivorPickupDefinitionsById = Object.fromEntries(
  arenaSurvivorPickupDefinitions.map((pickup) => [pickup.id, pickup])
) satisfies Record<string, ArenaSurvivorPickupDefinition>;
