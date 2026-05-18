import Phaser from "phaser";
import {
  ARENA_SURVIVOR_MAX_WEAPON_SLOTS,
  resolveArenaSurvivorWeaponSlotTransform,
  type ArenaSurvivorState,
  type ArenaSurvivorWeaponCategory
} from "@open-party-lab/protocol";
import {
  resolveArenaSurvivorEnemySpriteKey,
  resolveArenaSurvivorPlayerSpriteKey,
  resolveArenaSurvivorWeaponCarrySpriteKey
} from "./arenaSurvivorAssets.js";
import { arenaSurvivorVisualConfig } from "./arenaSurvivorVisualConfig.js";

function toColor(color: string): number {
  return Phaser.Display.Color.HexStringToColor(color).color;
}

function resolveWeaponColor(category: ArenaSurvivorWeaponCategory): number {
  switch (category) {
    case "magic":
      return 0xa855f7;
    case "melee":
      return 0xf97316;
    case "ranged":
    default:
      return 0x38bdf8;
  }
}

function resolveProjectileAngle(vx: number, vy: number): number {
  return Math.atan2(vy, vx);
}

function resolvePlayerDisplayRadius(radius: number): number {
  return radius * arenaSurvivorVisualConfig.player.diameterScale;
}

function resolveEnemyDisplayRadius(radius: number): number {
  return radius * arenaSurvivorVisualConfig.enemy.diameterScale;
}

function hashSeed(input: string): number {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function resolvePhaseOffset(seedKey: string): number {
  return (hashSeed(seedKey) % 360) * (Math.PI / 180);
}

function resolvePlayerBobOffset(playerId: string, elapsedMs: number): number {
  const phase = resolvePhaseOffset(playerId);
  return (
    Math.sin(elapsedMs / arenaSurvivorVisualConfig.player.bobSpeedMs + phase) *
    arenaSurvivorVisualConfig.player.bobAmplitude
  );
}

function resolvePlayerPulseScale(playerId: string, elapsedMs: number): number {
  const phase = (hashSeed(playerId) % 360) * (Math.PI / 180);
  return 1 + Math.sin(elapsedMs / arenaSurvivorVisualConfig.player.pulseSpeedMs + phase) *
    arenaSurvivorVisualConfig.player.pulseAmplitude;
}

function resolveEnemyPulseScale(enemyId: string, elapsedMs: number): number {
  const phase = resolvePhaseOffset(enemyId);
  const speedOffset =
    ((hashSeed(`${enemyId}:speed`) % 1000) / 1000 - 0.5) * 2 * arenaSurvivorVisualConfig.enemy.pulseSpeedVarianceMs;
  const pulseSpeedMs = Math.max(180, arenaSurvivorVisualConfig.enemy.pulseSpeedMs + speedOffset);

  return 1 + Math.sin(elapsedMs / pulseSpeedMs + phase) * arenaSurvivorVisualConfig.enemy.pulseAmplitude;
}

function resolvePlayerVisualPosition(
  player: ArenaSurvivorState["players"][number],
  elapsedMs: number
): { x: number; y: number; bobOffset: number; pulseScale: number } {
  const bobOffset = resolvePlayerBobOffset(player.playerId, elapsedMs);
  const pulseScale = resolvePlayerPulseScale(player.playerId, elapsedMs);

  return {
    x: player.x,
    y: player.y - bobOffset,
    bobOffset,
    pulseScale
  };
}

function resolveWeaponAimAngle(
  player: ArenaSurvivorState["players"][number],
  state: ArenaSurvivorState,
  originX: number,
  originY: number,
  fallbackAngle: number
): number {
  const livingEnemies = state.enemies.filter((enemy) => enemy.alive);

  if (livingEnemies.length > 0) {
    const closestEnemy = livingEnemies.reduce((closest, enemy) => {
      const closestDistance = Phaser.Math.Distance.Squared(
        originX,
        originY,
        closest.x,
        closest.y
      );
      const nextDistance = Phaser.Math.Distance.Squared(
        originX,
        originY,
        enemy.x,
        enemy.y
      );

      return nextDistance < closestDistance ? enemy : closest;
    });

    return Math.atan2(closestEnemy.y - originY, closestEnemy.x - originX);
  }

  if (Math.hypot(player.vx, player.vy) > 8) {
    return Math.atan2(player.vy, player.vx);
  }

  return fallbackAngle;
}

function resolveMeleeLungeProgress(
  lastFiredAt: number | null | undefined,
  elapsedMs: number
): number {
  if (lastFiredAt === null || lastFiredAt === undefined) {
    return 0;
  }

  const durationMs = arenaSurvivorVisualConfig.weaponSlots.meleeLungeDurationMs;
  const elapsedSinceAttack = elapsedMs - lastFiredAt;

  if (elapsedSinceAttack < 0 || elapsedSinceAttack > durationMs) {
    return 0;
  }

  const peakDurationMs = durationMs * arenaSurvivorVisualConfig.weaponSlots.meleeLungePeakRatio;

  if (elapsedSinceAttack <= peakDurationMs) {
    return elapsedSinceAttack / Math.max(1, peakDurationMs);
  }

  return Math.max(
    0,
    1 - (elapsedSinceAttack - peakDurationMs) / Math.max(1, durationMs - peakDurationMs)
  );
}

function resolveWeaponPose(
  player: ArenaSurvivorState["players"][number],
  state: ArenaSurvivorState,
  slotIndex: number,
  orbitDistance: number,
  playerPosition: { x: number; y: number }
): { x: number; y: number; aimAngle: number } {
  const equippedWeapon = player.loadout.weapons[slotIndex];
  const weaponState = player.weaponRuntimeStates[slotIndex];
  const slotTransform = resolveArenaSurvivorWeaponSlotTransform(slotIndex, orbitDistance);
  const baseX = playerPosition.x + slotTransform.offsetX;
  const baseY = playerPosition.y + slotTransform.offsetY;
  const meleeLungeProgress =
    equippedWeapon?.category === "melee"
      ? resolveMeleeLungeProgress(weaponState?.lastFiredAt, state.elapsedMs)
      : 0;
  const defaultMeleeReachDistance = Math.max(
    arenaSurvivorVisualConfig.weaponSlots.meleeLungeMinDistance,
    player.radius * arenaSurvivorVisualConfig.weaponSlots.meleeLungeDistanceMultiplier
  );
  const isActiveMeleeSwing =
    equippedWeapon?.category === "melee" &&
    meleeLungeProgress > 0.01 &&
    weaponState?.lastAimAngleRad !== null &&
    weaponState?.lastAimAngleRad !== undefined;
  const meleeAimAngle = weaponState?.lastAimAngleRad ?? slotTransform.angleRad;
  const aimAngle =
    equippedWeapon?.category === "melee"
      ? isActiveMeleeSwing
        ? meleeAimAngle
        : slotTransform.angleRad
      : resolveWeaponAimAngle(player, state, baseX, baseY, slotTransform.angleRad);
  const meleeLungeDistance =
    equippedWeapon?.category === "melee"
      ? (weaponState?.lastAttackReachDistance ?? defaultMeleeReachDistance) * meleeLungeProgress
      : 0;

  return {
    x: baseX + Math.cos(aimAngle) * meleeLungeDistance,
    y: baseY + Math.sin(aimAngle) * meleeLungeDistance,
    aimAngle
  };
}

function drawProjectileDiamond(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  fillColor: number
): void {
  graphics.fillStyle(fillColor, 0.96);
  graphics.fillPoints(
    [
      new Phaser.Geom.Point(x, y - radius),
      new Phaser.Geom.Point(x + radius, y),
      new Phaser.Geom.Point(x, y + radius),
      new Phaser.Geom.Point(x - radius, y)
    ],
    true
  );
}

function drawProjectileTriangle(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  angleRad: number,
  fillColor: number
): void {
  const tipLength = radius * 1.65;
  const wingLength = radius * 0.9;
  const tip = new Phaser.Geom.Point(
    x + Math.cos(angleRad) * tipLength,
    y + Math.sin(angleRad) * tipLength
  );
  const left = new Phaser.Geom.Point(
    x + Math.cos(angleRad + Math.PI * 0.72) * wingLength,
    y + Math.sin(angleRad + Math.PI * 0.72) * wingLength
  );
  const right = new Phaser.Geom.Point(
    x + Math.cos(angleRad - Math.PI * 0.72) * wingLength,
    y + Math.sin(angleRad - Math.PI * 0.72) * wingLength
  );

  graphics.fillStyle(fillColor, 0.96);
  graphics.fillPoints([tip, left, right], true);
}

function drawProjectileBolt(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  angleRad: number,
  fillColor: number
): void {
  const length = radius * 3.6;
  const tailX = x - Math.cos(angleRad) * length * 0.55;
  const tailY = y - Math.sin(angleRad) * length * 0.55;
  const headX = x + Math.cos(angleRad) * length * 0.55;
  const headY = y + Math.sin(angleRad) * length * 0.55;

  graphics.lineStyle(Math.max(2, radius * 0.95), fillColor, 0.98);
  graphics.lineBetween(tailX, tailY, headX, headY);
  graphics.fillStyle(0xffffff, 0.75);
  graphics.fillCircle(headX, headY, Math.max(1.4, radius * 0.45));
}

function drawArenaSurvivorProjectile(
  graphics: Phaser.GameObjects.Graphics,
  projectile: ArenaSurvivorState["projectiles"][number],
  x: number,
  y: number,
  radius: number
): void {
  const angleRad = resolveProjectileAngle(projectile.vx, projectile.vy);

  switch (projectile.definitionId) {
    case "hunter-arrow":
      drawProjectileTriangle(graphics, x, y, radius, angleRad, 0xf59e0b);
      graphics.lineStyle(Math.max(1, radius * 0.4), 0xfef3c7, 0.88);
      graphics.lineBetween(
        x - Math.cos(angleRad) * radius * 1.25,
        y - Math.sin(angleRad) * radius * 1.25,
        x + Math.cos(angleRad) * radius * 0.25,
        y + Math.sin(angleRad) * radius * 0.25
      );
      return;
    case "smg-pellet":
      drawProjectileBolt(graphics, x, y, Math.max(2.2, radius * 0.7), angleRad, 0xe2e8f0);
      return;
    case "ember-orb":
    case "ember-bolt":
      graphics.fillStyle(0xfb923c, 0.2);
      graphics.fillCircle(x, y, radius * 2.2);
      graphics.fillStyle(0xf97316, 0.97);
      graphics.fillCircle(x, y, radius * 1.15);
      graphics.fillStyle(0xfef3c7, 0.78);
      graphics.fillCircle(x, y, Math.max(1.4, radius * 0.45));
      return;
    case "frost-shard":
      graphics.lineStyle(Math.max(1, radius * 0.28), 0xe0f2fe, 0.85);
      drawProjectileDiamond(graphics, x, y, radius * 1.05, 0x67e8f9);
      graphics.strokePoints(
        [
          new Phaser.Geom.Point(x, y - radius * 1.05),
          new Phaser.Geom.Point(x + radius * 1.05, y),
          new Phaser.Geom.Point(x, y + radius * 1.05),
          new Phaser.Geom.Point(x - radius * 1.05, y)
        ],
        true
      );
      return;
    case "spark-bolt":
      drawProjectileBolt(graphics, x, y, radius, angleRad, 0x38bdf8);
      return;
    case "toxic-spore":
      graphics.fillStyle(0x22c55e, 0.18);
      graphics.fillCircle(x, y, radius * 2.25);
      graphics.fillStyle(0x4ade80, 0.94);
      graphics.fillCircle(x, y, radius * 1.2);
      graphics.lineStyle(Math.max(1, radius * 0.35), 0xbbf7d0, 0.78);
      graphics.strokeCircle(x, y, radius * 1.45);
      return;
    case "crimson-orb":
      graphics.fillStyle(0x7f1d1d, 0.18);
      graphics.fillCircle(x, y, radius * 2.5);
      graphics.fillStyle(0xef4444, 0.96);
      graphics.fillCircle(x, y, radius * 1.2);
      graphics.lineStyle(Math.max(1, radius * 0.3), 0xfda4af, 0.82);
      graphics.strokeCircle(x, y, radius * 1.55);
      graphics.fillStyle(0xffedd5, 0.82);
      graphics.fillCircle(x, y, Math.max(1.6, radius * 0.38));
      return;
    case "pistol-round":
      graphics.fillStyle(0xfbbf24, 0.96);
      graphics.fillCircle(x, y, radius);
      graphics.fillStyle(0xfffbeb, 0.75);
      graphics.fillCircle(x, y, Math.max(1.2, radius * 0.42));
      return;
    default:
      graphics.fillStyle(projectile.ownerKind === "enemy" ? 0xfb7185 : 0xfbbf24, 0.95);
      graphics.fillCircle(x, y, Math.max(2.5, radius));
  }
}

function drawSpawnIndicator(
  graphics: Phaser.GameObjects.Graphics,
  indicator: ArenaSurvivorState["spawnIndicators"][number],
  elapsedMs: number
): void {
  const warningDurationMs = Math.max(1, indicator.spawnAtMs - indicator.createdAtMs);
  const remainingMs = Math.max(0, indicator.spawnAtMs - elapsedMs);
  const progress = Phaser.Math.Clamp(1 - remainingMs / warningDurationMs, 0, 1);
  const pulse = 0.82 + Math.sin((elapsedMs - indicator.createdAtMs) / 70) * 0.18;
  const crossRadius = (16 + progress * 10) * 0.75;
  const ringRadius = crossRadius * (1.05 + pulse * 0.2);
  const alpha = 0.34 + progress * 0.36;

  graphics.fillStyle(0x7f1d1d, 0.12 + progress * 0.1);
  graphics.fillCircle(indicator.x, indicator.y, ringRadius * 1.1);
  graphics.lineStyle(2.5, 0xfca5a5, alpha * 0.9);
  graphics.strokeCircle(indicator.x, indicator.y, ringRadius);
  graphics.lineStyle(4, 0xef4444, 0.74 + progress * 0.22);
  graphics.lineBetween(
    indicator.x - crossRadius,
    indicator.y - crossRadius,
    indicator.x + crossRadius,
    indicator.y + crossRadius
  );
  graphics.lineBetween(
    indicator.x + crossRadius,
    indicator.y - crossRadius,
    indicator.x - crossRadius,
    indicator.y + crossRadius
  );
}

function drawMaterialPickup(
  graphics: Phaser.GameObjects.Graphics,
  pickup: ArenaSurvivorState["pickups"][number]
): void {
  const radius = Math.max(5.5, pickup.radius * 0.9);
  const pulse = 0.86 + Math.sin(pickup.ageMs / 160) * 0.12;
  const coreRadius = radius * pulse;

  graphics.fillStyle(0xf59e0b, 0.14);
  graphics.fillCircle(pickup.x, pickup.y, radius * 1.65);
  graphics.lineStyle(2, 0xfcd34d, 0.9);
  graphics.strokeCircle(pickup.x, pickup.y, radius * 1.1);
  graphics.fillStyle(0xfbbf24, 0.96);
  graphics.fillPoints(
    [
      new Phaser.Geom.Point(pickup.x, pickup.y - coreRadius),
      new Phaser.Geom.Point(pickup.x + coreRadius * 0.72, pickup.y),
      new Phaser.Geom.Point(pickup.x, pickup.y + coreRadius),
      new Phaser.Geom.Point(pickup.x - coreRadius * 0.72, pickup.y)
    ],
    true
  );
  graphics.fillStyle(0xfffbeb, 0.7);
  graphics.fillCircle(pickup.x, pickup.y, Math.max(1.3, coreRadius * 0.22));
}

function drawHealthPickup(
  graphics: Phaser.GameObjects.Graphics,
  pickup: ArenaSurvivorState["pickups"][number]
): void {
  const radius = Math.max(6, pickup.radius);
  const pulse = 0.9 + Math.sin(pickup.ageMs / 145) * 0.1;
  const arm = radius * pulse;
  const thickness = Math.max(3, radius * 0.46);

  graphics.fillStyle(0x14532d, 0.16);
  graphics.fillCircle(pickup.x, pickup.y, radius * 1.75);
  graphics.lineStyle(2, 0x86efac, 0.92);
  graphics.strokeCircle(pickup.x, pickup.y, radius * 1.12);
  graphics.lineStyle(thickness, 0x22c55e, 0.98);
  graphics.lineBetween(pickup.x - arm, pickup.y, pickup.x + arm, pickup.y);
  graphics.lineBetween(pickup.x, pickup.y - arm, pickup.x, pickup.y + arm);
  graphics.fillStyle(0xdcfce7, 0.78);
  graphics.fillCircle(pickup.x, pickup.y, Math.max(1.5, radius * 0.22));
}

export interface ArenaSurvivorRenderMeta {
  centerX: number;
  centerY: number;
  zoom: number;
  worldViewWidth: number;
  worldViewHeight: number;
  arenaWidth: number;
  arenaHeight: number;
  left: number;
  top: number;
}

export interface ArenaSurvivorSpriteLayer {
  playerSprites: Map<string, Phaser.GameObjects.Image>;
  enemySprites: Map<string, Phaser.GameObjects.Image>;
  weaponSprites: Map<string, Phaser.GameObjects.Image>;
}

export function resolveArenaSurvivorRenderMeta(
  scene: Phaser.Scene,
  state: ArenaSurvivorState
): ArenaSurvivorRenderMeta {
  const alivePlayers = state.players.filter((player) => player.alive);
  const cameraPadding = Math.max(
    arenaSurvivorVisualConfig.cameraPadding.min,
    Math.round(
      Math.min(state.arenaWidth, state.arenaHeight) * arenaSurvivorVisualConfig.cameraPadding.ratio
    )
  );
  const arenaFitZoom = Math.max(
    scene.scale.width / state.arenaWidth,
    scene.scale.height / state.arenaHeight
  );
  const minZoom = Math.max(arenaSurvivorVisualConfig.cameraPadding.minZoom, arenaFitZoom);
  const maxZoom = Math.max(arenaSurvivorVisualConfig.cameraPadding.maxZoom, minZoom);
  let centerX = state.arenaWidth / 2;
  let centerY = state.arenaHeight / 2;
  let zoom = 1;

  if (alivePlayers.length === 1) {
    const player = alivePlayers[0];
    centerX = player.x;
    centerY = player.y;
    zoom = maxZoom;
  } else if (alivePlayers.length > 1) {
    const minX = Math.min(...alivePlayers.map((player) => player.x));
    const maxX = Math.max(...alivePlayers.map((player) => player.x));
    const minY = Math.min(...alivePlayers.map((player) => player.y));
    const maxY = Math.max(...alivePlayers.map((player) => player.y));
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    const paddedWidth = width + cameraPadding * 2;
    const paddedHeight = height + cameraPadding * 2;
    centerX = (minX + maxX) / 2;
    centerY = (minY + maxY) / 2;
    zoom = Math.min(scene.scale.width / paddedWidth, scene.scale.height / paddedHeight, maxZoom);
  }

  zoom = Phaser.Math.Clamp(zoom, minZoom, maxZoom);

  const worldViewWidth = scene.scale.width / zoom;
  const worldViewHeight = scene.scale.height / zoom;
  const halfWidth = worldViewWidth / 2;
  const halfHeight = worldViewHeight / 2;

  centerX = Phaser.Math.Clamp(centerX, halfWidth, Math.max(halfWidth, state.arenaWidth - halfWidth));
  centerY = Phaser.Math.Clamp(centerY, halfHeight, Math.max(halfHeight, state.arenaHeight - halfHeight));

  return {
    centerX,
    centerY,
    zoom,
    worldViewWidth,
    worldViewHeight,
    arenaWidth: state.arenaWidth,
    arenaHeight: state.arenaHeight,
    left: centerX - halfWidth,
    top: centerY - halfHeight
  };
}

export function applyArenaSurvivorCamera(
  scene: Phaser.Scene,
  meta: ArenaSurvivorRenderMeta
): void {
  const camera = scene.cameras.main;

  camera.setBounds(0, 0, meta.arenaWidth, meta.arenaHeight);
  camera.setZoom(meta.zoom);
  camera.centerOn(meta.centerX, meta.centerY);
}

export function createArenaSurvivorSpriteLayer(): ArenaSurvivorSpriteLayer {
  return {
    playerSprites: new Map(),
    enemySprites: new Map(),
    weaponSprites: new Map()
  };
}

export function drawArenaSurvivorBackground(
  scene: Phaser.Scene,
  graphics: Phaser.GameObjects.Graphics,
  state: ArenaSurvivorState,
  meta: ArenaSurvivorRenderMeta = resolveArenaSurvivorRenderMeta(scene, state)
): void {
  void scene;
  void state;
  graphics.clear();
  graphics.lineStyle(3, 0xe3c59d, 0.12);
  graphics.strokeRoundedRect(0, 0, meta.arenaWidth, meta.arenaHeight, 18);
}

export function drawArenaSurvivorEntities(
  scene: Phaser.Scene,
  graphics: Phaser.GameObjects.Graphics,
  state: ArenaSurvivorState,
  meta: ArenaSurvivorRenderMeta = resolveArenaSurvivorRenderMeta(scene, state)
): void {
  void meta;
  graphics.clear();

  for (const projectile of state.projectiles) {
    if (!projectile.alive) {
      continue;
    }

    drawArenaSurvivorProjectile(
      graphics,
      projectile,
      projectile.x,
      projectile.y,
      Math.max(2.5, projectile.radius)
    );
  }

  for (const indicator of state.spawnIndicators) {
    drawSpawnIndicator(graphics, indicator, state.elapsedMs);
  }

  for (const pickup of state.pickups) {
    if (pickup.kind === "health") {
      drawHealthPickup(graphics, pickup);
      continue;
    }

    drawMaterialPickup(graphics, pickup);
  }

  for (const player of state.players) {
    const playerPosition = resolvePlayerVisualPosition(player, state.elapsedMs);
    const playerX = playerPosition.x;
    const playerY = playerPosition.y;
    const playerRadius = Math.max(10, player.radius);
    const playerDisplayRadius = resolvePlayerDisplayRadius(playerRadius) * playerPosition.pulseScale;
    const slotDistance = Math.max(
      arenaSurvivorVisualConfig.weaponSlots.minOrbitDistance,
      player.radius * arenaSurvivorVisualConfig.weaponSlots.orbitMultiplier
    );
    const occupiedSlots = player.loadout.weapons;

    for (let slotIndex = 0; slotIndex < ARENA_SURVIVOR_MAX_WEAPON_SLOTS; slotIndex += 1) {
      const equippedWeapon = occupiedSlots[slotIndex];

      if (equippedWeapon && !resolveArenaSurvivorWeaponCarrySpriteKey(equippedWeapon.weaponId)) {
        const weaponPose = resolveWeaponPose(player, state, slotIndex, slotDistance, {
          x: playerX,
          y: playerY
        });
        graphics.fillStyle(resolveWeaponColor(equippedWeapon.category), 0.95);
        graphics.fillTriangle(
          weaponPose.x + Math.cos(weaponPose.aimAngle) * 8,
          weaponPose.y + Math.sin(weaponPose.aimAngle) * 8,
          weaponPose.x + Math.cos(weaponPose.aimAngle + 2.4) * 5,
          weaponPose.y + Math.sin(weaponPose.aimAngle + 2.4) * 5,
          weaponPose.x + Math.cos(weaponPose.aimAngle - 2.4) * 5,
          weaponPose.y + Math.sin(weaponPose.aimAngle - 2.4) * 5
        );
      }
    }

    if (!scene.textures.exists(resolveArenaSurvivorPlayerSpriteKey(player.character.id))) {
      const playerColor = player.alive ? toColor(player.color) : toColor("#64748b");

      graphics.fillStyle(0x020617, 0.35);
      graphics.fillEllipse(playerX, playerY + playerDisplayRadius * 0.92, playerDisplayRadius * 1.45, playerDisplayRadius * 0.46);
      graphics.fillStyle(playerColor, player.alive ? 1 : 0.45);
      graphics.fillCircle(playerX, playerY, playerDisplayRadius);
      graphics.lineStyle(3, 0xe2e8f0, player.alive ? 0.9 : 0.4);
      graphics.strokeCircle(playerX, playerY, playerDisplayRadius);
    }
  }

  for (const enemy of state.enemies) {
    if (!enemy.alive) {
      continue;
    }

    const spriteKey = resolveArenaSurvivorEnemySpriteKey(enemy.definitionId);
    if (spriteKey && scene.textures.exists(spriteKey)) {
      continue;
    }

    const enemyColor = enemy.role === "shooter" ? 0xfb7185 : enemy.role === "brute" ? 0xf97316 : 0xf59e0b;
    const px = enemy.x;
    const py = enemy.y;
    const radius = Math.max(8, enemy.radius);
    const displayRadius = resolveEnemyDisplayRadius(radius) * resolveEnemyPulseScale(enemy.id, state.elapsedMs);
    const hpRatio = enemy.maxHp > 0 ? Math.max(0, Math.min(1, enemy.hp / enemy.maxHp)) : 0;

    graphics.fillStyle(enemyColor, 0.8);
    graphics.fillCircle(px, py, displayRadius);
    graphics.lineStyle(2, 0x1f2937, 0.8);
    graphics.strokeCircle(px, py, displayRadius);
    graphics.lineStyle(Math.max(2, displayRadius * 0.12), 0xfef3c7, 0.9 * hpRatio);
    graphics.strokeCircle(px, py, displayRadius + 4);
  }
}

export function syncArenaSurvivorSpriteLayer(
  scene: Phaser.Scene,
  layer: ArenaSurvivorSpriteLayer,
  state: ArenaSurvivorState,
  meta: ArenaSurvivorRenderMeta = resolveArenaSurvivorRenderMeta(scene, state)
): void {
  void meta;
  const activePlayerIds = new Set(state.players.map((player) => player.playerId));

  for (const player of state.players) {
    const spriteKey = resolveArenaSurvivorPlayerSpriteKey(player.character.id);
    let playerSprite = layer.playerSprites.get(player.playerId);
    const playerPosition = resolvePlayerVisualPosition(player, state.elapsedMs);

    if (!scene.textures.exists(spriteKey)) {
      if (playerSprite) {
        playerSprite.setVisible(false);
      }
      continue;
    }

    if (!playerSprite) {
      playerSprite = scene.add.image(0, 0, spriteKey);
      playerSprite.setDepth(10);
      playerSprite.setOrigin(0.5);
      layer.playerSprites.set(player.playerId, playerSprite);
    } else if (playerSprite.texture.key !== spriteKey) {
      playerSprite.setTexture(spriteKey);
    }

    playerSprite.setVisible(player.alive);
    playerSprite.setPosition(playerPosition.x, playerPosition.y);
    const displaySize = resolvePlayerDisplayRadius(player.radius) * 2 * playerPosition.pulseScale;
    playerSprite.setDisplaySize(displaySize, displaySize);
    playerSprite.setRotation(0);
    playerSprite.setAlpha(player.alive ? 1 : 0.42);
  }

  for (const [playerId, playerSprite] of layer.playerSprites) {
    if (!activePlayerIds.has(playerId)) {
      playerSprite.destroy();
      layer.playerSprites.delete(playerId);
    }
  }

  const activeEnemyIds = new Set(state.enemies.filter((enemy) => enemy.alive).map((enemy) => enemy.id));
  const activeWeaponKeys = new Set<string>();

  for (const enemy of state.enemies) {
    if (!enemy.alive) {
      continue;
    }

    const spriteKey = resolveArenaSurvivorEnemySpriteKey(enemy.definitionId);

    if (!spriteKey || !scene.textures.exists(spriteKey)) {
      continue;
    }

    let enemySprite = layer.enemySprites.get(enemy.id);

    if (!enemySprite) {
      enemySprite = scene.add.image(0, 0, spriteKey);
      enemySprite.setDepth(9);
      enemySprite.setOrigin(0.5);
      layer.enemySprites.set(enemy.id, enemySprite);
    } else if (enemySprite.texture.key !== spriteKey) {
      enemySprite.setTexture(spriteKey);
    }

    const displaySize = resolveEnemyDisplayRadius(enemy.radius) * 2 * resolveEnemyPulseScale(enemy.id, state.elapsedMs);

    enemySprite.setVisible(true);
    enemySprite.setPosition(enemy.x, enemy.y);
    enemySprite.setDisplaySize(displaySize, displaySize);
    enemySprite.setAlpha(0.92);
  }

  for (const player of state.players) {
    const playerPosition = resolvePlayerVisualPosition(player, state.elapsedMs);
    const orbitDistance = Math.max(
      arenaSurvivorVisualConfig.weaponSlots.minOrbitDistance,
      player.radius * arenaSurvivorVisualConfig.weaponSlots.orbitMultiplier
    );

    for (let slotIndex = 0; slotIndex < ARENA_SURVIVOR_MAX_WEAPON_SLOTS; slotIndex += 1) {
      const equippedWeapon = player.loadout.weapons[slotIndex];
      const spriteId = `${player.playerId}:${slotIndex}`;
      const weaponSprite = layer.weaponSprites.get(spriteId);

      if (!equippedWeapon) {
        if (weaponSprite) {
          weaponSprite.destroy();
          layer.weaponSprites.delete(spriteId);
        }
        continue;
      }

      const spriteKey = resolveArenaSurvivorWeaponCarrySpriteKey(equippedWeapon.weaponId);

      if (!spriteKey || !scene.textures.exists(spriteKey)) {
        if (weaponSprite) {
          weaponSprite.destroy();
          layer.weaponSprites.delete(spriteId);
        }
        continue;
      }

      const displaySize = Math.max(
        arenaSurvivorVisualConfig.weaponSlots.minSpriteDisplaySize,
        player.radius * arenaSurvivorVisualConfig.weaponSlots.spriteDisplaySizeMultiplier
      );
      const weaponPose = resolveWeaponPose(player, state, slotIndex, orbitDistance, playerPosition);
      let nextWeaponSprite = weaponSprite;

      if (!nextWeaponSprite) {
        nextWeaponSprite = scene.add.image(0, 0, spriteKey);
        nextWeaponSprite.setDepth(11);
        nextWeaponSprite.setOrigin(0.5);
        layer.weaponSprites.set(spriteId, nextWeaponSprite);
      } else if (nextWeaponSprite.texture.key !== spriteKey) {
        nextWeaponSprite.setTexture(spriteKey);
      }

      nextWeaponSprite.setVisible(player.alive);
      nextWeaponSprite.setPosition(weaponPose.x, weaponPose.y);
      nextWeaponSprite.setDisplaySize(displaySize, displaySize);
      nextWeaponSprite.setRotation(weaponPose.aimAngle + Math.PI / 2);
      nextWeaponSprite.setAlpha(player.alive ? 0.98 : 0.38);
      activeWeaponKeys.add(spriteId);
    }
  }

  for (const [enemyId, enemySprite] of layer.enemySprites) {
    if (!activeEnemyIds.has(enemyId)) {
      enemySprite.destroy();
      layer.enemySprites.delete(enemyId);
    }
  }

  for (const [weaponId, weaponSprite] of layer.weaponSprites) {
    if (!activeWeaponKeys.has(weaponId)) {
      weaponSprite.destroy();
      layer.weaponSprites.delete(weaponId);
    }
  }
}
