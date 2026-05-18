import type { LightTrailsConfig } from "./lightTrailsConfig.js";

export interface TrailGridMetrics {
  columns: number;
  rows: number;
  cellSize: number;
}

export function createTrailGridMetrics(config: LightTrailsConfig): TrailGridMetrics {
  return {
    columns: Math.ceil(config.arenaWidth / config.gridCellSize),
    rows: Math.ceil(config.arenaHeight / config.gridCellSize),
    cellSize: config.gridCellSize
  };
}

export function pointToCellId(
  x: number,
  y: number,
  metrics: TrailGridMetrics
): number | null {
  if (x < 0 || y < 0) {
    return null;
  }

  const column = Math.floor(x / metrics.cellSize);
  const row = Math.floor(y / metrics.cellSize);

  if (column < 0 || column >= metrics.columns || row < 0 || row >= metrics.rows) {
    return null;
  }

  return row * metrics.columns + column;
}

export function cellIdToPoint(
  cellId: number,
  metrics: TrailGridMetrics
): { x: number; y: number } {
  const row = Math.floor(cellId / metrics.columns);
  const column = cellId % metrics.columns;

  return {
    x: column * metrics.cellSize,
    y: row * metrics.cellSize
  };
}

export function sampleTrailCellIds(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  metrics: TrailGridMetrics
): number[] {
  const distance = Math.hypot(toX - fromX, toY - fromY);
  const steps = Math.max(1, Math.ceil(distance / Math.max(1, metrics.cellSize * 0.45)));
  const visited = new Set<number>();
  const sampledIds: number[] = [];

  for (let step = 0; step <= steps; step += 1) {
    const progress = step / steps;
    const x = fromX + (toX - fromX) * progress;
    const y = fromY + (toY - fromY) * progress;
    const cellId = pointToCellId(x, y, metrics);

    if (cellId === null || visited.has(cellId)) {
      continue;
    }

    visited.add(cellId);
    sampledIds.push(cellId);
  }

  return sampledIds;
}
