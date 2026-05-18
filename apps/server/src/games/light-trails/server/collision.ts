import type { LightTrailsCollisionReason } from "@open-party-lab/protocol";
import type { TrailGridMetrics } from "./trailGrid.js";

export interface MovementProposal {
  playerId: string;
  nextX: number;
  nextY: number;
  nextAngleRad: number;
  pathCellIds: number[];
}

export interface CollisionEvaluation {
  byPlayerId: Record<string, LightTrailsCollisionReason>;
}

export function collidesWithArena(
  x: number,
  y: number,
  metrics: TrailGridMetrics
): boolean {
  return (
    x < 0 ||
    y < 0 ||
    x >= metrics.columns * metrics.cellSize ||
    y >= metrics.rows * metrics.cellSize
  );
}

export function evaluateCollisions(
  proposals: MovementProposal[],
  occupiedCells: Record<number, string>
): CollisionEvaluation {
  const byPlayerId: Record<string, LightTrailsCollisionReason> = {};
  const contendersByCell = new Map<number, string[]>();

  for (const proposal of proposals) {
    for (const cellId of proposal.pathCellIds) {
      const contenders = contendersByCell.get(cellId) ?? [];
      contenders.push(proposal.playerId);
      contendersByCell.set(cellId, contenders);
    }
  }

  for (const contenders of contendersByCell.values()) {
    if (contenders.length <= 1) {
      continue;
    }

    for (const playerId of contenders) {
      byPlayerId[playerId] = "head_clash";
    }
  }

  for (const proposal of proposals) {
    if (byPlayerId[proposal.playerId]) {
      continue;
    }

    const collidesWithTrail = proposal.pathCellIds.some((cellId) => occupiedCells[cellId] !== undefined);

    if (collidesWithTrail) {
      byPlayerId[proposal.playerId] = "trail";
    }
  }

  return { byPlayerId };
}
