export interface LightTrailsConfig {
  arenaWidth: number;
  arenaHeight: number;
  tickRate: number;
  moveSpeed: number;
  turnSpeedRadPerSecond: number;
  gridCellSize: number;
  trailThickness: number;
  gapEnabled: boolean;
  gapIntervalMinTicks: number;
  gapIntervalMaxTicks: number;
  gapLengthTicks: number;
  roundIntroMs: number;
  countdownMs: number;
  resultScreenMs: number;
  scoreboardScreenMs: number;
  lockedMs: number;
  maxPlayingMs: number;
  spawnRadiusFactor: number;
}

export const lightTrailsConfig: LightTrailsConfig = {
  arenaWidth: 960,
  arenaHeight: 540,
  tickRate: 60,
  moveSpeed: 180,
  turnSpeedRadPerSecond: 3.8,
  gridCellSize: 4,
  trailThickness: 5,
  gapEnabled: true,
  gapIntervalMinTicks: 32,
  gapIntervalMaxTicks: 60,
  gapLengthTicks: 5,
  roundIntroMs: 1_500,
  countdownMs: 2_400,
  resultScreenMs: 3_500,
  scoreboardScreenMs: 4_000,
  lockedMs: 1_000,
  maxPlayingMs: 45_000,
  spawnRadiusFactor: 0.29
};

// TODO: Fuer spaetere Powerups oder Arenavarianten hier mehrere Profile hinterlegen.
