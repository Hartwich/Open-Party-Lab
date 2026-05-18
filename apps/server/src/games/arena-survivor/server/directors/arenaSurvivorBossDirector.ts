export interface ArenaSurvivorBossWaveDefinition {
  waveNumber: number;
  definitionId: string;
}

const arenaSurvivorBossWaves: readonly ArenaSurvivorBossWaveDefinition[] = [
  {
    waveNumber: 10,
    definitionId: "scrap-goliath"
  },
  {
    waveNumber: 20,
    definitionId: "crimson-overlord"
  }
];

export function resolveArenaSurvivorBossWave(
  waveNumber: number
): ArenaSurvivorBossWaveDefinition | null {
  return arenaSurvivorBossWaves.find((entry) => entry.waveNumber === waveNumber) ?? null;
}
