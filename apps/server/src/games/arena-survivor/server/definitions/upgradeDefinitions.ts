export interface ArenaSurvivorUpgradeDefinition {
  id: string;
  displayName: string;
  description: string;
}

export const arenaSurvivorUpgradeDefinitions = [] as const satisfies readonly ArenaSurvivorUpgradeDefinition[];

// TODO: Spaeter koennen hier passive Items, Waffenmodifikatoren und Level-Ups angelegt werden.
