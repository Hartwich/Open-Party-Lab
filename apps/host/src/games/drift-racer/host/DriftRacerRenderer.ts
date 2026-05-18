import Phaser from "phaser";
import type {
  DriftRacerRacerState,
  DriftRacerState,
  DriftRacerTrackPoint
} from "@open-party-lab/protocol";

interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TrackSegment {
  startIndex: number;
  length: number;
  startDistance: number;
  tangentX: number;
  tangentY: number;
  normalX: number;
  normalY: number;
}

interface TrackMetrics {
  points: DriftRacerTrackPoint[];
  segments: TrackSegment[];
  length: number;
}

interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
  scale: number;
}

interface RoadSample {
  left: ProjectedPoint;
  right: ProjectedPoint;
  center: ProjectedPoint;
  index: number;
}

export interface DriftRacerHudInstruction {
  key: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  align?: "left" | "center" | "right";
  originX?: number;
  originY?: number;
}

function toColor(color: string): number {
  return Phaser.Display.Color.HexStringToColor(color).color;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function resolveViewports(width: number, height: number, count: number): Viewport[] {
  const gap = 6;

  if (count <= 1) {
    return [{ x: 0, y: 0, width, height }];
  }

  if (count === 2) {
    const paneHeight = (height - gap) / 2;
    return [
      { x: 0, y: 0, width, height: paneHeight },
      { x: 0, y: paneHeight + gap, width, height: paneHeight }
    ];
  }

  const paneWidth = (width - gap) / 2;
  const paneHeight = (height - gap) / 2;
  return [
    { x: 0, y: 0, width: paneWidth, height: paneHeight },
    { x: paneWidth + gap, y: 0, width: paneWidth, height: paneHeight },
    { x: 0, y: paneHeight + gap, width: paneWidth, height: paneHeight },
    { x: paneWidth + gap, y: paneHeight + gap, width: paneWidth, height: paneHeight }
  ].slice(0, count);
}

function createTrackMetrics(state: DriftRacerState): TrackMetrics {
  const points = state.track;
  const segments = points.map((point, index) => {
    const next = points[(index + 1) % points.length];
    const rawLength = Math.hypot(next.x - point.x, next.y - point.y);
    const length = rawLength || 1;
    const tangentX = (next.x - point.x) / length;
    const tangentY = (next.y - point.y) / length;

    return {
      startIndex: index,
      length,
      startDistance: point.distance,
      tangentX,
      tangentY,
      normalX: -tangentY,
      normalY: tangentX
    };
  });

  return {
    points,
    segments,
    length: state.trackLength
  };
}

function wrapDistance(distance: number, trackLength: number): number {
  const wrapped = distance % trackLength;
  return wrapped >= 0 ? wrapped : wrapped + trackLength;
}

function sampleTrack(metrics: TrackMetrics, distance: number) {
  const wrappedDistance = wrapDistance(distance, metrics.length);
  const segment =
    metrics.segments.find(
      (entry) => wrappedDistance >= entry.startDistance && wrappedDistance <= entry.startDistance + entry.length
    ) ?? metrics.segments[metrics.segments.length - 1];
  const start = metrics.points[segment.startIndex];
  const t = clamp((wrappedDistance - segment.startDistance) / segment.length, 0, 1);

  return {
    x: start.x + segment.tangentX * segment.length * t,
    y: start.y + segment.tangentY * segment.length * t,
    distance: wrappedDistance,
    angleRad: Math.atan2(segment.tangentY, segment.tangentX),
    normalX: segment.normalX,
    normalY: segment.normalY
  };
}

function projectPoint(
  viewport: Viewport,
  racer: DriftRacerRacerState,
  x: number,
  y: number
): ProjectedPoint | null {
  const forwardX = Math.cos(racer.angleRad);
  const forwardY = Math.sin(racer.angleRad);
  const rightX = -forwardY;
  const rightY = forwardX;
  const dx = x - racer.x;
  const dy = y - racer.y;
  const z = dx * forwardX + dy * forwardY;

  if (z < 35) {
    return null;
  }

  const lateral = dx * rightX + dy * rightY;
  const focal = viewport.width * 0.86;
  const horizon = viewport.y + viewport.height * 0.36;
  const scale = focal / z;
  const projectedX = viewport.x + viewport.width / 2 + lateral * scale;
  const projectedY = horizon + (viewport.height * 78) / z;

  return {
    x: clamp(projectedX, viewport.x - 90, viewport.x + viewport.width + 90),
    y: clamp(projectedY, viewport.y + viewport.height * 0.34, viewport.y + viewport.height + 80),
    z,
    scale
  };
}

function drawViewportBackground(graphics: Phaser.GameObjects.Graphics, viewport: Viewport): void {
  graphics.fillStyle(0x79c7eb, 1);
  graphics.fillRect(viewport.x, viewport.y, viewport.width, viewport.height * 0.36);
  graphics.fillStyle(0xbddcf0, 1);
  graphics.fillRect(viewport.x, viewport.y + viewport.height * 0.18, viewport.width, viewport.height * 0.18);
  graphics.fillStyle(0x2f7d46, 1);
  graphics.fillRect(viewport.x, viewport.y + viewport.height * 0.36, viewport.width, viewport.height * 0.64);
  graphics.fillStyle(0x24693a, 1);
  graphics.fillRect(viewport.x, viewport.y + viewport.height * 0.58, viewport.width, viewport.height * 0.42);

  graphics.lineStyle(1, 0x19502f, 0.35);
  for (let line = 0; line < 5; line += 1) {
    const y = viewport.y + viewport.height * (0.5 + line * 0.1);
    graphics.lineBetween(viewport.x, y, viewport.x + viewport.width, y + line * 5);
  }
}

function drawRoadPolygon(
  graphics: Phaser.GameObjects.Graphics,
  leftNear: ProjectedPoint,
  rightNear: ProjectedPoint,
  rightFar: ProjectedPoint,
  leftFar: ProjectedPoint,
  color: number,
  alpha = 1
): void {
  graphics.fillStyle(color, alpha);
  graphics.beginPath();
  graphics.moveTo(leftNear.x, leftNear.y);
  graphics.lineTo(rightNear.x, rightNear.y);
  graphics.lineTo(rightFar.x, rightFar.y);
  graphics.lineTo(leftFar.x, leftFar.y);
  graphics.closePath();
  graphics.fillPath();
}

function drawRoad(
  metrics: TrackMetrics,
  graphics: Phaser.GameObjects.Graphics,
  viewport: Viewport,
  state: DriftRacerState,
  racer: DriftRacerRacerState
): void {
  const samples: RoadSample[] = [];
  const startDistance = racer.lapProgress + 45;
  const maxAhead = Math.min(2_750, state.trackLength * 0.62);
  const step = 72;

  for (let distanceAhead = maxAhead; distanceAhead >= 45; distanceAhead -= step) {
    const sample = sampleTrack(metrics, startDistance + distanceAhead);
    const roadHalfWidth = state.trackWidth * 0.55;
    const leftPoint = {
      x: sample.x + sample.normalX * roadHalfWidth,
      y: sample.y + sample.normalY * roadHalfWidth
    };
    const rightPoint = {
      x: sample.x - sample.normalX * roadHalfWidth,
      y: sample.y - sample.normalY * roadHalfWidth
    };
    const left = projectPoint(viewport, racer, leftPoint.x, leftPoint.y);
    const right = projectPoint(viewport, racer, rightPoint.x, rightPoint.y);
    const center = projectPoint(viewport, racer, sample.x, sample.y);

    if (left && right && center) {
      samples.push({
        left,
        right,
        center,
        index: Math.floor(distanceAhead / step)
      });
    }
  }

  for (let index = 0; index < samples.length - 1; index += 1) {
    const far = samples[index];
    const near = samples[index + 1];
    const stripe = near.index % 2 === 0;

    drawRoadPolygon(
      graphics,
      near.left,
      near.right,
      far.right,
      far.left,
      stripe ? 0x3f4652 : 0x353b46,
      1
    );

    graphics.lineStyle(Math.max(2, near.center.scale * 7), stripe ? 0xf8fafc : 0xef4444, 0.82);
    graphics.lineBetween(near.left.x, near.left.y, far.left.x, far.left.y);
    graphics.lineBetween(near.right.x, near.right.y, far.right.x, far.right.y);

    if (near.index % 3 === 0) {
      graphics.lineStyle(Math.max(1, near.center.scale * 3.4), 0xf8fafc, 0.28);
      graphics.lineBetween(near.center.x, near.center.y, far.center.x, far.center.y);
    }
  }
}

function drawRivalCars(
  graphics: Phaser.GameObjects.Graphics,
  viewport: Viewport,
  activeRacer: DriftRacerRacerState,
  racers: DriftRacerRacerState[]
): void {
  for (const racer of racers) {
    if (racer.playerId === activeRacer.playerId) {
      continue;
    }

    const projected = projectPoint(viewport, activeRacer, racer.x, racer.y);

    if (!projected || projected.z > 2_400) {
      continue;
    }

    const carWidth = clamp(projected.scale * 95, 16, viewport.width * 0.18);
    const carHeight = carWidth * 0.72;
    const x = projected.x;
    const y = projected.y - carHeight * 0.55;

    graphics.fillStyle(0x020617, 0.28);
    graphics.fillEllipse(x, y + carHeight * 0.62, carWidth * 1.15, carHeight * 0.34);
    graphics.fillStyle(toColor(racer.color), racer.finished ? 0.46 : 0.96);
    graphics.fillRoundedRect(x - carWidth / 2, y - carHeight / 2, carWidth, carHeight, Math.max(4, carWidth * 0.1));
    graphics.fillStyle(0xe0f2fe, 0.88);
    graphics.fillRoundedRect(x - carWidth * 0.25, y - carHeight * 0.48, carWidth * 0.5, carHeight * 0.28, Math.max(2, carWidth * 0.06));
    graphics.fillStyle(0x0f172a, 0.9);
    graphics.fillRect(x - carWidth * 0.58, y + carHeight * 0.12, carWidth * 0.14, carHeight * 0.25);
    graphics.fillRect(x + carWidth * 0.44, y + carHeight * 0.12, carWidth * 0.14, carHeight * 0.25);
  }
}

function drawLocalCar(
  graphics: Phaser.GameObjects.Graphics,
  viewport: Viewport,
  racer: DriftRacerRacerState
): void {
  const carWidth = clamp(viewport.width * 0.16, 72, 126);
  const carHeight = carWidth * 0.9;
  const x = viewport.x + viewport.width / 2;
  const y = viewport.y + viewport.height * 0.82;
  const lean = racer.steerInput * carWidth * 0.16;

  if (racer.boostActive) {
    graphics.fillStyle(0xf97316, 0.74);
    graphics.fillTriangle(
      x - carWidth * 0.2,
      y + carHeight * 0.5,
      x,
      y + carHeight * 0.92,
      x + carWidth * 0.2,
      y + carHeight * 0.5
    );
  }

  if (racer.drifting) {
    graphics.fillStyle(0xe2e8f0, 0.28);
    graphics.fillEllipse(x - carWidth * 0.5, y + carHeight * 0.36, carWidth * 0.5, carHeight * 0.2);
    graphics.fillEllipse(x + carWidth * 0.5, y + carHeight * 0.36, carWidth * 0.5, carHeight * 0.2);
  }

  graphics.fillStyle(0x020617, 0.35);
  graphics.fillEllipse(x, y + carHeight * 0.34, carWidth * 1.14, carHeight * 0.3);
  graphics.fillStyle(0x111827, 1);
  graphics.fillRect(x - carWidth * 0.58 + lean, y - carHeight * 0.08, carWidth * 0.2, carHeight * 0.56);
  graphics.fillRect(x + carWidth * 0.38 + lean, y - carHeight * 0.08, carWidth * 0.2, carHeight * 0.56);
  graphics.fillStyle(toColor(racer.color), 1);
  graphics.fillRoundedRect(
    x - carWidth * 0.42 + lean,
    y - carHeight * 0.58,
    carWidth * 0.84,
    carHeight * 0.96,
    carWidth * 0.12
  );
  graphics.fillStyle(0xe0f2fe, 0.92);
  graphics.fillRoundedRect(
    x - carWidth * 0.23 + lean * 0.6,
    y - carHeight * 0.45,
    carWidth * 0.46,
    carHeight * 0.23,
    carWidth * 0.06
  );
  graphics.fillStyle(0xf8fafc, 0.5);
  graphics.fillRect(x - carWidth * 0.26 + lean, y - carHeight * 0.02, carWidth * 0.52, carHeight * 0.08);
}

function drawMiniMap(
  metrics: TrackMetrics,
  graphics: Phaser.GameObjects.Graphics,
  viewport: Viewport,
  state: DriftRacerState
): void {
  const width = clamp(viewport.width * 0.18, 84, 132);
  const height = width * 0.7;
  const x = viewport.x + viewport.width - width - 14;
  const y = viewport.y + 14;
  const padding = 9;
  const mapScale = Math.min(
    (width - padding * 2) / state.worldWidth,
    (height - padding * 2) / state.worldHeight
  );
  const offsetX = x + width / 2 - (state.worldWidth * mapScale) / 2;
  const offsetY = y + height / 2 - (state.worldHeight * mapScale) / 2;

  graphics.fillStyle(0x020617, 0.46);
  graphics.fillRoundedRect(x, y, width, height, 8);
  graphics.lineStyle(2, 0xe2e8f0, 0.18);
  graphics.beginPath();
  metrics.points.forEach((point, index) => {
    const px = offsetX + point.x * mapScale;
    const py = offsetY + point.y * mapScale;
    if (index === 0) {
      graphics.moveTo(px, py);
    } else {
      graphics.lineTo(px, py);
    }
  });
  graphics.closePath();
  graphics.strokePath();

  for (const racer of state.racers) {
    graphics.fillStyle(toColor(racer.color), racer.finished ? 0.45 : 1);
    graphics.fillCircle(offsetX + racer.x * mapScale, offsetY + racer.y * mapScale, racer.rank === 1 ? 4 : 3);
  }
}

function drawHud(
  viewport: Viewport,
  state: DriftRacerState,
  racer: DriftRacerRacerState,
  en: boolean,
  hud: DriftRacerHudInstruction[]
): void {
  const lap = Math.min(state.lapsToWin, racer.finished ? state.lapsToWin : racer.lap + 1);
  const speed = Math.round(Math.abs(racer.speed) * 0.18);
  const left = viewport.x + 16;
  const top = viewport.y + 13;

  hud.push(
    {
      key: `${racer.playerId}:name`,
      text: racer.name,
      x: left,
      y: top,
      fontSize: viewport.height < 260 ? 16 : 20,
      color: racer.color
    },
    {
      key: `${racer.playerId}:status`,
      text: `${en ? "Place" : "Platz"} ${racer.rank}  ${en ? "Lap" : "Runde"} ${lap}/${state.lapsToWin}`,
      x: left,
      y: top + (viewport.height < 260 ? 22 : 28),
      fontSize: viewport.height < 260 ? 13 : 16,
      color: "#e2e8f0"
    },
    {
      key: `${racer.playerId}:speed`,
      text: `${speed}`,
      x: viewport.x + viewport.width - 20,
      y: viewport.y + viewport.height - 30,
      fontSize: viewport.height < 260 ? 20 : 26,
      color: "#f8fafc",
      align: "right",
      originX: 1
    }
  );

  if (racer.finished) {
    hud.push({
      key: `${racer.playerId}:finish`,
      text: en ? "FINISH" : "ZIEL",
      x: viewport.x + viewport.width / 2,
      y: viewport.y + viewport.height * 0.24,
      fontSize: viewport.height < 260 ? 24 : 34,
      color: "#f8fafc",
      align: "center",
      originX: 0.5
    });
  }
}

export function drawDriftRacerScene(
  scene: Phaser.Scene,
  graphics: Phaser.GameObjects.Graphics,
  state: DriftRacerState,
  en: boolean
): DriftRacerHudInstruction[] {
  const hud: DriftRacerHudInstruction[] = [];
  const viewports = resolveViewports(scene.scale.width, scene.scale.height, state.racers.length);
  const metrics = createTrackMetrics(state);

  graphics.clear();
  graphics.fillStyle(0x020617, 1);
  graphics.fillRect(0, 0, scene.scale.width, scene.scale.height);

  state.racers.forEach((racer, index) => {
    const viewport = viewports[index];

    if (!viewport) {
      return;
    }

    drawViewportBackground(graphics, viewport);
    drawRoad(metrics, graphics, viewport, state, racer);
    drawRivalCars(graphics, viewport, racer, state.racers);
    drawLocalCar(graphics, viewport, racer);
    drawMiniMap(metrics, graphics, viewport, state);
    drawHud(viewport, state, racer, en, hud);

    graphics.lineStyle(3, 0x020617, 1);
    graphics.strokeRect(viewport.x, viewport.y, viewport.width, viewport.height);
  });

  return hud;
}
