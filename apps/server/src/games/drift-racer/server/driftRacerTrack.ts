import type { DriftRacerTrackPoint } from "@open-party-lab/protocol";

export interface DriftRacerTrackSample {
  x: number;
  y: number;
  distance: number;
  angleRad: number;
  normalX: number;
  normalY: number;
}

export interface DriftRacerTrackProjection extends DriftRacerTrackSample {
  signedLateralDistance: number;
  lateralDistance: number;
}

interface TrackSegment {
  startIndex: number;
  endIndex: number;
  startDistance: number;
  length: number;
  tangentX: number;
  tangentY: number;
  normalX: number;
  normalY: number;
}

export const driftRacerTrackConfig = {
  worldWidth: 3_000,
  worldHeight: 2_160,
  trackWidth: 360,
  lapsToWin: 3,
  maxRaceMs: 180_000,
  carRadius: 34
} as const;

const pointCount = 144;
const centerX = driftRacerTrackConfig.worldWidth / 2;
const centerY = driftRacerTrackConfig.worldHeight / 2;

function createCenterPoint(index: number): { x: number; y: number } {
  const t = (index / pointCount) * Math.PI * 2;
  return {
    x: centerX + Math.cos(t) * 930 + Math.sin(t * 2) * 180,
    y: centerY + Math.sin(t) * 610 + Math.cos(t * 3) * 76
  };
}

function createTrack(): {
  points: DriftRacerTrackPoint[];
  segments: TrackSegment[];
  length: number;
} {
  const rawPoints = Array.from({ length: pointCount }, (_, index) => createCenterPoint(index));
  const lengths = rawPoints.map((point, index) => {
    const next = rawPoints[(index + 1) % rawPoints.length];
    return Math.hypot(next.x - point.x, next.y - point.y);
  });
  let accumulatedDistance = 0;
  const points = rawPoints.map((point, index) => {
    const trackPoint = {
      ...point,
      distance: accumulatedDistance
    };
    accumulatedDistance += lengths[index];
    return trackPoint;
  });
  const length = accumulatedDistance;
  const segments = points.map((point, index) => {
    const nextIndex = (index + 1) % points.length;
    const next = points[nextIndex];
    const segmentLength = lengths[index] || 1;
    const tangentX = (next.x - point.x) / segmentLength;
    const tangentY = (next.y - point.y) / segmentLength;

    return {
      startIndex: index,
      endIndex: nextIndex,
      startDistance: point.distance,
      length: segmentLength,
      tangentX,
      tangentY,
      normalX: -tangentY,
      normalY: tangentX
    };
  });

  return {
    points,
    segments,
    length
  };
}

export const driftRacerTrack = createTrack();

export function wrapTrackDistance(distance: number): number {
  const wrapped = distance % driftRacerTrack.length;
  return wrapped >= 0 ? wrapped : wrapped + driftRacerTrack.length;
}

export function sampleDriftRacerTrack(distance: number): DriftRacerTrackSample {
  const wrappedDistance = wrapTrackDistance(distance);
  const segment =
    driftRacerTrack.segments.find(
      (entry) => wrappedDistance >= entry.startDistance && wrappedDistance <= entry.startDistance + entry.length
    ) ?? driftRacerTrack.segments[driftRacerTrack.segments.length - 1];
  const start = driftRacerTrack.points[segment.startIndex];
  const t = Math.max(0, Math.min(1, (wrappedDistance - segment.startDistance) / segment.length));

  return {
    x: start.x + segment.tangentX * segment.length * t,
    y: start.y + segment.tangentY * segment.length * t,
    distance: wrappedDistance,
    angleRad: Math.atan2(segment.tangentY, segment.tangentX),
    normalX: segment.normalX,
    normalY: segment.normalY
  };
}

export function projectPointToDriftRacerTrack(x: number, y: number): DriftRacerTrackProjection {
  let bestProjection: DriftRacerTrackProjection | null = null;
  let bestDistanceSq = Number.POSITIVE_INFINITY;

  for (const segment of driftRacerTrack.segments) {
    const start = driftRacerTrack.points[segment.startIndex];
    const dx = x - start.x;
    const dy = y - start.y;
    const t = Math.max(0, Math.min(1, (dx * segment.tangentX + dy * segment.tangentY) / segment.length));
    const projectedX = start.x + segment.tangentX * segment.length * t;
    const projectedY = start.y + segment.tangentY * segment.length * t;
    const offsetX = x - projectedX;
    const offsetY = y - projectedY;
    const distanceSq = offsetX * offsetX + offsetY * offsetY;

    if (distanceSq >= bestDistanceSq) {
      continue;
    }

    const signedLateralDistance = offsetX * segment.normalX + offsetY * segment.normalY;
    bestDistanceSq = distanceSq;
    bestProjection = {
      x: projectedX,
      y: projectedY,
      distance: wrapTrackDistance(segment.startDistance + segment.length * t),
      angleRad: Math.atan2(segment.tangentY, segment.tangentX),
      normalX: segment.normalX,
      normalY: segment.normalY,
      signedLateralDistance,
      lateralDistance: Math.abs(signedLateralDistance)
    };
  }

  if (!bestProjection) {
    const fallback = sampleDriftRacerTrack(0);
    return {
      ...fallback,
      signedLateralDistance: 0,
      lateralDistance: 0
    };
  }

  return bestProjection;
}
