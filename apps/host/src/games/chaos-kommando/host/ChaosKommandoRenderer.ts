import Phaser from "phaser";
import type {
  ChaosKommandoMercenaryState,
  ChaosKommandoState,
  ChaosKommandoWeaponId
} from "@open-party-lab/protocol";
import {
  clamp,
  findWeapon,
  hashString,
  resolveChargeRatio,
  resolveCrosshairPoint,
  resolveDisplayMercenaryRadius,
  resolveHealthRatio,
  resolveSelection,
  toColorNumber
} from "./ChaosKommandoViewModel.js";
import {
  chaosKommandoBaseFrameSize,
  chaosKommandoRigPreset,
  mercenaryAnimationKeys,
  mercenaryIdleFrame,
  mercenaryJumpFallFrame,
  mercenaryJumpRiseFrame,
  mercenaryWalkFrames,
  resolveChaosKommandoFrameRig,
  resolveChaosKommandoRigFamilyForRole
} from "./ChaosKommandoVisualConfig.js";
import {
  resolveAttachmentTransform,
  resolveBodySpritePosition
} from "./ChaosKommandoRigMath.js";

const idleWorld = {
  width: 1_680,
  height: 900,
  waterlineY: 792,
  sampleSpacing: 8,
  samples: Array.from({ length: 211 }, (_, index) => {
    const x = index * 8;
    const ridge = Math.sin(x / 140) * 54 + Math.cos(x / 56) * 18 + Math.sin(x / 310) * 32;
    return clamp(552 + ridge, 455, 720);
  })
};

const mercenaryTextureKeys = {
  sprinter: "chaos-kommando-marshmallow-sprinter",
  grenadier: "chaos-kommando-marshmallow-grenadier",
  "chaos-schuetze": "chaos-kommando-marshmallow-gunner"
} as const;

const weaponTextureKeys: Record<ChaosKommandoWeaponId, string> = {
  "kicher-bazooka": "chaos-kommando-weapon-kicher-bazooka",
  "enten-granate": "chaos-kommando-weapon-enten-granate",
  "plunder-pistole": "chaos-kommando-weapon-plunder-pistole",
  "regenbogen-rakete": "chaos-kommando-weapon-regenbogen-rakete",
  "splitter-granate": "chaos-kommando-weapon-splitter-granate",
  "konfetti-schrot": "chaos-kommando-weapon-konfetti-schrot",
  "bohrer-rakete": "chaos-kommando-weapon-bohrer-rakete",
  "gummi-huhn": "chaos-kommando-weapon-gummi-huhn",
  "seifenblasen-bombe": "chaos-kommando-weapon-seifenblasen-bombe",
  "keks-moerser": "chaos-kommando-weapon-keks-moerser"
} as const;

const gearTextureKeys = {
  helmet: "chaos-kommando-marshmallow-helmet",
  backpack: "chaos-kommando-marshmallow-pack"
} as const;

const bodyOriginX = 0.5;
const bodyOriginY = 0.72;

export const chaosKommandoTextureKeys = {
  mercenaries: mercenaryTextureKeys,
  weapons: weaponTextureKeys,
  weaponCarry: weaponTextureKeys,
  helmet: gearTextureKeys.helmet,
  pack: gearTextureKeys.backpack,
  gear: gearTextureKeys,
  gravestone: "chaos-kommando-gravestone"
} as const;

interface MercenarySpritePair {
  backpack: Phaser.GameObjects.Image;
  mercenary: Phaser.GameObjects.Sprite;
  weapon: Phaser.GameObjects.Image;
  helmet: Phaser.GameObjects.Image;
  gravestone: Phaser.GameObjects.Image;
}

export interface ChaosKommandoRenderState {
  skyGraphics: Phaser.GameObjects.Graphics;
  terrainGraphics: Phaser.GameObjects.Graphics;
  waterGraphics: Phaser.GameObjects.Graphics;
  actorGraphics: Phaser.GameObjects.Graphics;
  effectsGraphics: Phaser.GameObjects.Graphics;
  spriteLayer: Phaser.GameObjects.Layer;
  mercenarySprites: Map<string, MercenarySpritePair>;
  explosionSeenAtMs: Map<string, number>;
  activeMercenaryLabel: Phaser.GameObjects.Text;
  cameraCenterX: number;
  cameraCenterY: number;
  cameraZoom: number;
}

interface CameraTarget {
  centerX: number;
  centerY: number;
  zoom: number;
}

interface TerrainTheme {
  skyTop: number;
  skyMid: number;
  skyGlow: number;
  hillNear: number;
  hillFar: number;
  terrainBody: number;
  terrainMid: number;
  terrainDeep: number;
  grass: number;
  grassHighlight: number;
}

export function ensureChaosKommandoAnimations(scene: Phaser.Scene): void {
  const animationEntries = Object.entries(mercenaryAnimationKeys) as Array<
    [keyof typeof mercenaryAnimationKeys, string]
  >;

  for (const [role, animationKey] of animationEntries) {
    if (scene.anims.exists(animationKey)) {
      continue;
    }

    scene.anims.create({
      key: animationKey,
      frames: scene.anims.generateFrameNumbers(mercenaryTextureKeys[role], {
        frames: [...mercenaryWalkFrames]
      }),
      frameRate: 11,
      repeat: -1
    });
  }
}

export function createChaosKommandoRenderState(scene: Phaser.Scene): ChaosKommandoRenderState {
  const skyGraphics = scene.add.graphics();
  skyGraphics.setDepth(-60);
  const terrainGraphics = scene.add.graphics();
  terrainGraphics.setDepth(-10);
  const waterGraphics = scene.add.graphics();
  waterGraphics.setDepth(-4);
  const actorGraphics = scene.add.graphics();
  actorGraphics.setDepth(22);
  const effectsGraphics = scene.add.graphics();
  effectsGraphics.setDepth(11);
  const spriteLayer = scene.add.layer();
  spriteLayer.setDepth(8);
  const activeMercenaryLabel = scene.add
    .text(0, 0, "", {
      fontFamily: "var(--font-display, sans-serif)",
      fontSize: "16px",
      color: "#f8fafc",
      backgroundColor: "rgba(2, 6, 23, 0.82)",
      stroke: "#020617",
      strokeThickness: 3
    })
    .setDepth(26)
    .setOrigin(0.5, 1)
    .setPadding(10, 6, 10, 6)
    .setVisible(false);

  return {
    skyGraphics,
    terrainGraphics,
    waterGraphics,
    actorGraphics,
    effectsGraphics,
    spriteLayer,
    mercenarySprites: new Map(),
    explosionSeenAtMs: new Map(),
    activeMercenaryLabel,
    cameraCenterX: idleWorld.width / 2,
    cameraCenterY: idleWorld.height / 2,
    cameraZoom: 0.92
  };
}

export function destroyChaosKommandoRenderState(renderState: ChaosKommandoRenderState): void {
  renderState.skyGraphics.destroy();
  renderState.terrainGraphics.destroy();
  renderState.waterGraphics.destroy();
  renderState.actorGraphics.destroy();
  renderState.effectsGraphics.destroy();
  for (const spritePair of renderState.mercenarySprites.values()) {
    spritePair.backpack.destroy();
    spritePair.mercenary.destroy();
    spritePair.weapon.destroy();
    spritePair.helmet.destroy();
    spritePair.gravestone.destroy();
  }
  renderState.mercenarySprites.clear();
  renderState.explosionSeenAtMs.clear();
  renderState.spriteLayer.destroy();
  renderState.activeMercenaryLabel.destroy();
}

export function snapChaosKommandoCamera(
  scene: Phaser.Scene,
  renderState: ChaosKommandoRenderState,
  state: ChaosKommandoState
): void {
  const target = resolveCameraTarget(scene, state);
  renderState.cameraCenterX = target.centerX;
  renderState.cameraCenterY = target.centerY;
  renderState.cameraZoom = target.zoom;
  applyCamera(scene, renderState, state.terrain.width, state.terrain.height);
}

export function renderChaosKommandoIdleFrame(
  scene: Phaser.Scene,
  renderState: ChaosKommandoRenderState,
  timeMs: number
): void {
  renderState.cameraCenterX = Phaser.Math.Linear(renderState.cameraCenterX, idleWorld.width / 2, 0.08);
  renderState.cameraCenterY = Phaser.Math.Linear(renderState.cameraCenterY, idleWorld.height / 2 - 60, 0.08);
  renderState.cameraZoom = Phaser.Math.Linear(
    renderState.cameraZoom,
    Math.min(scene.scale.width / idleWorld.width, scene.scale.height / idleWorld.height) * 0.95,
    0.08
  );
  applyCamera(scene, renderState, idleWorld.width, idleWorld.height);
  drawSky(renderState.skyGraphics, idleWorld.width, idleWorld.height, idleWorld.waterlineY, timeMs, 1, 1, "klapperkueste");
  drawTerrain(
    renderState.terrainGraphics,
    idleWorld.width,
    idleWorld.height,
    idleWorld.samples,
    idleWorld.sampleSpacing,
    "klapperkueste"
  );
  drawWater(
    renderState.waterGraphics,
    idleWorld.width,
    idleWorld.height,
    idleWorld.waterlineY,
    timeMs,
    0.55,
    1
  );
  renderState.effectsGraphics.clear();
  renderState.actorGraphics.clear();
  syncIdleSprites(renderState);
  renderState.activeMercenaryLabel.setVisible(false);
}

export function renderChaosKommandoFrame(
  scene: Phaser.Scene,
  renderState: ChaosKommandoRenderState,
  state: ChaosKommandoState,
  nowMs: number
): void {
  const target = resolveCameraTarget(scene, state);
  renderState.cameraCenterX = Phaser.Math.Linear(renderState.cameraCenterX, target.centerX, 0.14);
  renderState.cameraCenterY = Phaser.Math.Linear(renderState.cameraCenterY, target.centerY, 0.12);
  renderState.cameraZoom = Phaser.Math.Linear(renderState.cameraZoom, target.zoom, 0.12);
  applyCamera(scene, renderState, state.terrain.width, state.terrain.height);

  drawSky(
    renderState.skyGraphics,
    state.terrain.width,
    state.terrain.height,
    state.terrain.waterlineY,
    nowMs,
    state.wind.strength,
    state.wind.direction,
    state.terrain.mapId
  );
  drawTerrain(
    renderState.terrainGraphics,
    state.terrain.width,
    state.terrain.height,
    state.terrain.samples,
    state.terrain.sampleSpacing,
    state.terrain.mapId
  );
  drawWater(
    renderState.waterGraphics,
    state.terrain.width,
    state.terrain.height,
    state.terrain.waterlineY,
    nowMs,
    state.wind.strength,
    state.wind.direction
  );
  syncMercenarySprites(renderState, state, nowMs);
  drawEffects(renderState.effectsGraphics, state, nowMs, renderState.explosionSeenAtMs);
  drawActors(renderState.actorGraphics, state, nowMs);
  syncActiveMercenaryLabel(renderState.activeMercenaryLabel, state);
}

function applyCamera(
  scene: Phaser.Scene,
  renderState: ChaosKommandoRenderState,
  worldWidth: number,
  worldHeight: number
): void {
  const camera = scene.cameras.main;
  const worldViewWidth = scene.scale.width / Math.max(0.01, renderState.cameraZoom);
  const worldViewHeight = scene.scale.height / Math.max(0.01, renderState.cameraZoom);
  const halfWidth = worldViewWidth / 2;
  const halfHeight = worldViewHeight / 2;
  const centerX = clamp(renderState.cameraCenterX, halfWidth, Math.max(halfWidth, worldWidth - halfWidth));
  const centerY = clamp(renderState.cameraCenterY, halfHeight, Math.max(halfHeight, worldHeight - halfHeight));

  renderState.cameraCenterX = centerX;
  renderState.cameraCenterY = centerY;

  camera.setBounds(0, 0, worldWidth, worldHeight);
  camera.setZoom(renderState.cameraZoom);
  camera.centerOn(centerX, centerY);
}

function resolveCameraTarget(scene: Phaser.Scene, state: ChaosKommandoState): CameraTarget {
  const targetSelection = resolveSelection(state);
  const activeMercenary = targetSelection.mercenary;
  const activeCrosshair =
    !state.turn.hasFired || state.turn.chargeRatio > 0
      ? resolveCrosshairPoint(state)
      : null;
  const focusCandidates = [
    ...(activeMercenary ? [{ x: activeMercenary.x, y: activeMercenary.y - 10 }] : []),
    ...state.projectiles.map((projectile) => ({ x: projectile.x, y: projectile.y })),
    ...state.explosions.map((explosion) => ({ x: explosion.x, y: explosion.y })),
    ...(activeCrosshair ? [activeCrosshair] : []),
    { x: state.cameraFocusX, y: state.cameraFocusY }
  ];

  let minX = state.cameraFocusX;
  let maxX = state.cameraFocusX;
  let minY = state.cameraFocusY;
  let maxY = state.cameraFocusY;

  for (const point of focusCandidates) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  const actionWidth = clamp(maxX - minX + 420, 560, Math.min(1_380, state.terrain.width));
  const actionHeight = clamp(maxY - minY + 330, 430, Math.min(960, state.terrain.height));
  const minZoom = Math.min(scene.scale.width / state.terrain.width, scene.scale.height / state.terrain.height) * 0.82;
  const desiredZoom = Math.min(scene.scale.width / actionWidth, scene.scale.height / actionHeight, 1.14);
  const zoom = clamp(desiredZoom, Math.max(0.68, minZoom), 1.14);
  const aimBiasedX =
    activeMercenary && activeCrosshair
      ? Phaser.Math.Linear(activeMercenary.x, activeCrosshair.x, state.projectiles.length > 0 ? 0.12 : 0.22)
      : activeMercenary?.x ?? state.cameraFocusX;
  const aimBiasedY =
    activeMercenary && activeCrosshair
      ? Phaser.Math.Linear(activeMercenary.y - 42, activeCrosshair.y, state.projectiles.length > 0 ? 0.08 : 0.16)
      : (activeMercenary?.y ?? state.cameraFocusY) - 32;
  const centerX = activeMercenary
    ? Phaser.Math.Linear(state.cameraFocusX, aimBiasedX, state.projectiles.length > 0 ? 0.24 : 0.42)
    : state.cameraFocusX;
  const centerY = activeMercenary
    ? Phaser.Math.Linear(state.cameraFocusY - 24, aimBiasedY, state.projectiles.length > 0 ? 0.18 : 0.32)
    : state.cameraFocusY - 32;

  return {
    centerX,
    centerY,
    zoom
  };
}

function syncIdleSprites(renderState: ChaosKommandoRenderState): void {
  for (const spritePair of renderState.mercenarySprites.values()) {
    spritePair.backpack.setVisible(false);
    spritePair.mercenary.setVisible(false);
    spritePair.weapon.setVisible(false);
    spritePair.helmet.setVisible(false);
    spritePair.gravestone.setVisible(false);
  }
}

function syncMercenarySprites(
  renderState: ChaosKommandoRenderState,
  state: ChaosKommandoState,
  _nowMs: number
): void {
  const knownIds = new Set<string>();
  const gravestoneByMercenaryId = new Map(state.gravestones.map((gravestone) => [gravestone.mercenaryId, gravestone]));

  for (const player of state.players) {
    for (const mercenary of player.mercenaries) {
      knownIds.add(mercenary.id);

      let spritePair = renderState.mercenarySprites.get(mercenary.id);

      if (!spritePair) {
        const backpackSprite = renderState.spriteLayer.scene.add
          .image(mercenary.x, mercenary.y, chaosKommandoTextureKeys.pack)
          .setDepth(8);
        const mercenarySprite = renderState.spriteLayer.scene.add
          .sprite(mercenary.x, mercenary.y, mercenaryTextureKeys[mercenary.role], 4)
          .setOrigin(0.5, 0.72)
          .setDepth(9);
        const weaponSprite = renderState.spriteLayer.scene.add
          .image(mercenary.x, mercenary.y, chaosKommandoTextureKeys.weapons["plunder-pistole"])
          .setDepth(9.4);
        const helmetSprite = renderState.spriteLayer.scene.add
          .image(mercenary.x, mercenary.y, chaosKommandoTextureKeys.helmet)
          .setDepth(9.8);
        const gravestoneSprite = renderState.spriteLayer.scene.add
          .image(mercenary.x, mercenary.y, chaosKommandoTextureKeys.gravestone)
          .setDepth(10)
          .setVisible(false);
        renderState.spriteLayer.add([backpackSprite, mercenarySprite, weaponSprite, helmetSprite, gravestoneSprite]);
        spritePair = {
          backpack: backpackSprite,
          mercenary: mercenarySprite,
          weapon: weaponSprite,
          helmet: helmetSprite,
          gravestone: gravestoneSprite
        };
        renderState.mercenarySprites.set(mercenary.id, spritePair);
      }

      const gravestone = gravestoneByMercenaryId.get(mercenary.id);
      const displayRadius = resolveDisplayMercenaryRadius(mercenary);
      const displaySize = displayRadius * 3.42;
      const scale = displaySize / chaosKommandoBaseFrameSize;
      const alpha = mercenary.alive ? 1 : 0.58;
      const showMercenary = mercenary.alive || !gravestone;
      const heldWeaponId = resolveHeldWeaponId(state, mercenary);

      syncMercenaryAnimation(spritePair.mercenary, mercenary);
      const frameIndex = resolveMercenaryFrameIndex(spritePair.mercenary);
      const frameRig = resolveChaosKommandoFrameRig(
        chaosKommandoRigPreset,
        resolveChaosKommandoRigFamilyForRole(mercenary.role),
        frameIndex
      );
      const bodyPosition = resolveBodySpritePosition({
        bodyX: mercenary.x,
        bodyY: mercenary.y + displayRadius * (mercenary.alive ? 0.1 : 0.3),
        bodyScale: scale,
        direction: mercenary.facing,
        frameRig
      });

      spritePair.mercenary
        .setVisible(showMercenary)
        .setPosition(bodyPosition.x, bodyPosition.y)
        .setScale(scale)
        .setOrigin(bodyOriginX, bodyOriginY)
        .setFlipX(mercenary.facing === "left")
        .setAngle(0)
        .setAlpha(alpha)
        .clearTint();

      syncGearSprite(
        spritePair.backpack,
        chaosKommandoRigPreset.gears.backpack,
        showMercenary,
        alpha,
        bodyPosition.x,
        bodyPosition.y,
        scale,
        mercenary,
        frameRig
      );

      syncHeldWeaponSprite(
        spritePair.weapon,
        mercenary,
        heldWeaponId,
        showMercenary,
        alpha,
        bodyPosition.x,
        bodyPosition.y,
        scale,
        frameRig,
        state
      );

      syncGearSprite(
        spritePair.helmet,
        chaosKommandoRigPreset.gears.helmet,
        showMercenary,
        alpha,
        bodyPosition.x,
        bodyPosition.y,
        scale,
        mercenary,
        frameRig
      );

      spritePair.gravestone
        .setVisible(Boolean(gravestone))
        .setPosition(
          gravestone?.x ?? mercenary.x,
          gravestone?.y ?? mercenary.y + mercenary.radius * 1.34
        )
        .setDisplaySize((gravestone?.radius ?? displayRadius) * 2.5, (gravestone?.radius ?? displayRadius) * 2.5)
        .setAngle(gravestone && !gravestone.grounded ? clamp(gravestone.vx * 0.08, -16, 16) : 0)
        .setAlpha(0.96);
    }
  }

  for (const [mercenaryId, spritePair] of renderState.mercenarySprites.entries()) {
    if (knownIds.has(mercenaryId)) {
      continue;
    }

    spritePair.backpack.destroy();
    spritePair.mercenary.destroy();
    spritePair.weapon.destroy();
    spritePair.helmet.destroy();
    spritePair.gravestone.destroy();
    renderState.mercenarySprites.delete(mercenaryId);
  }
}

function resolveHeldWeaponId(
  state: ChaosKommandoState,
  mercenary: ChaosKommandoMercenaryState
): ChaosKommandoWeaponId {
  if (mercenary.id === state.turn.activeMercenaryId && mercenary.playerId === state.turn.currentPlayerId) {
    return state.turn.currentWeaponId;
  }

  switch (mercenary.role) {
    case "grenadier":
      return "enten-granate";
    case "chaos-schuetze":
      return "kicher-bazooka";
    case "sprinter":
    default:
      return "plunder-pistole";
  }
}

function syncMercenaryAnimation(
  sprite: Phaser.GameObjects.Sprite,
  mercenary: ChaosKommandoMercenaryState
): void {
  if (!mercenary.alive) {
    if (sprite.anims.isPlaying) {
      sprite.stop();
    }
    sprite.setFrame(mercenaryIdleFrame);
    return;
  }

  const animationKey = mercenaryAnimationKeys[mercenary.role];
  const isWalking = mercenary.grounded && Math.abs(mercenary.vx) > 18;

  if (isWalking) {
    if (sprite.anims.currentAnim?.key !== animationKey || !sprite.anims.isPlaying) {
      sprite.play(animationKey, true);
    }
    sprite.anims.timeScale = clamp(Math.abs(mercenary.vx) / 96, 0.85, 1.45);
    return;
  }

  if (sprite.anims.isPlaying) {
    sprite.stop();
  }

  sprite.setFrame(
    mercenary.grounded
      ? mercenaryIdleFrame
      : mercenary.vy < 0
        ? mercenaryJumpRiseFrame
        : mercenaryJumpFallFrame
  );
}

function syncHeldWeaponSprite(
  sprite: Phaser.GameObjects.Image,
  mercenary: ChaosKommandoMercenaryState,
  weaponId: ChaosKommandoWeaponId,
  visible: boolean,
  alpha: number,
  bodyX: number,
  bodyY: number,
  bodyScale: number,
  frameRig: ReturnType<typeof resolveChaosKommandoFrameRig>,
  state: ChaosKommandoState
): void {
  const profile = chaosKommandoRigPreset.weapons[weaponId];
  const isAimDrivenWeapon =
    mercenary.id === state.turn.activeMercenaryId &&
    mercenary.playerId === state.turn.currentPlayerId &&
    mercenary.alive;

  sprite.setTexture(chaosKommandoTextureKeys.weapons[weaponId]);

  const transform = resolveAttachmentTransform({
    bodyX,
    bodyY,
    bodyScale,
    direction: mercenary.facing,
    frameRig,
    profile,
    textureWidth: sprite.frame?.realWidth ?? 1,
    textureHeight: sprite.frame?.realHeight ?? 1,
    baseRotationRad: isAimDrivenWeapon ? mercenary.aimAngleRad : undefined,
    mirrorWithDirection: isAimDrivenWeapon || profile.mode === "single",
    alphaMultiplier: alpha
  });

  applyAttachmentTransform(sprite, {
    ...transform,
    visible: visible && transform.visible
  });
}

function syncGearSprite(
  sprite: Phaser.GameObjects.Image,
  profile: (typeof chaosKommandoRigPreset.gears)[keyof typeof chaosKommandoRigPreset.gears],
  visible: boolean,
  alpha: number,
  bodyX: number,
  bodyY: number,
  bodyScale: number,
  mercenary: ChaosKommandoMercenaryState,
  frameRig: ReturnType<typeof resolveChaosKommandoFrameRig>
): void {
  const transform = resolveAttachmentTransform({
    bodyX,
    bodyY,
    bodyScale,
    direction: mercenary.facing,
    frameRig,
    profile,
    textureWidth: sprite.frame?.realWidth ?? 1,
    textureHeight: sprite.frame?.realHeight ?? 1,
    mirrorWithDirection: true,
    alphaMultiplier: alpha
  });

  applyAttachmentTransform(sprite, {
    ...transform,
    visible: visible && transform.visible
  });
}

function applyAttachmentTransform(
  sprite: Phaser.GameObjects.Image,
  transform: ReturnType<typeof resolveAttachmentTransform>
): void {
  sprite
    .setVisible(transform.visible)
    .setOrigin(transform.originX, transform.originY)
    .setPosition(transform.x, transform.y)
    .setRotation(transform.rotationRad)
    .setScale(transform.scaleX, transform.scaleY)
    .setAlpha(transform.alpha);
}

function resolveMercenaryFrameIndex(sprite: Phaser.GameObjects.Sprite): number {
  const rawFrame = sprite.frame?.name ?? mercenaryIdleFrame;
  const parsedFrame =
    typeof rawFrame === "number" ? rawFrame : Number.parseInt(String(rawFrame), 10);
  return Number.isFinite(parsedFrame) ? parsedFrame : mercenaryIdleFrame;
}

function resolveTerrainTheme(mapId?: string): TerrainTheme {
  switch (mapId) {
    case "klapperkueste":
      return {
        skyTop: 0x8fd6ff,
        skyMid: 0xffd6a8,
        skyGlow: 0xfff0d1,
        hillNear: 0x7890a3,
        hillFar: 0xa1b6c5,
        terrainBody: 0x8c5d33,
        terrainMid: 0x6e4725,
        terrainDeep: 0x4d301a,
        grass: 0x8bcf52,
        grassHighlight: 0xeaf9b8
      };
    case "seeschlund":
      return {
        skyTop: 0x7dc9f6,
        skyMid: 0xffc18c,
        skyGlow: 0xffefcb,
        hillNear: 0x607a89,
        hillFar: 0x91adbf,
        terrainBody: 0x7b4f32,
        terrainMid: 0x5f3e24,
        terrainDeep: 0x3e2616,
        grass: 0x7fc550,
        grassHighlight: 0xe8f7af
      };
    default:
      return {
        skyTop: 0x88d0ff,
        skyMid: 0xffcf99,
        skyGlow: 0xfff0d1,
        hillNear: 0x738a98,
        hillFar: 0xa0b6c5,
        terrainBody: 0x845833,
        terrainMid: 0x684425,
        terrainDeep: 0x482f1a,
        grass: 0x87c959,
        grassHighlight: 0xeaf9b8
      };
  }
}

function drawSky(
  graphics: Phaser.GameObjects.Graphics,
  worldWidth: number,
  worldHeight: number,
  waterlineY: number,
  timeMs: number,
  windStrength: number,
  windDirection: -1 | 1,
  mapId?: string
): void {
  const theme = resolveTerrainTheme(mapId);
  graphics.clear();
  graphics.fillStyle(theme.skyTop, 1);
  graphics.fillRect(0, 0, worldWidth, worldHeight);

  graphics.fillStyle(theme.skyMid, 0.72);
  graphics.fillRect(0, 0, worldWidth, waterlineY * 0.58);
  graphics.fillStyle(theme.skyGlow, 0.3);
  graphics.fillRect(0, 0, worldWidth, waterlineY * 0.28);

  graphics.fillStyle(theme.skyGlow, 0.28);
  graphics.fillCircle(worldWidth * 0.78, 126, 96);
  graphics.fillStyle(0xffffff, 0.16);
  graphics.fillCircle(worldWidth * 0.78, 126, 144);

  drawHillBand(graphics, worldWidth, worldHeight, 424, 86, theme.hillFar, 0.76, 188, 0.00092);
  drawHillBand(graphics, worldWidth, worldHeight, 540, 128, theme.hillNear, 0.84, 108, 0.00114);
  drawCoastDecor(graphics, worldWidth, waterlineY, mapId);
  drawClouds(graphics, worldWidth, timeMs, windStrength, windDirection);
}

function drawHillBand(
  graphics: Phaser.GameObjects.Graphics,
  worldWidth: number,
  worldHeight: number,
  baseY: number,
  amplitude: number,
  color: number,
  alpha: number,
  wavelength: number,
  seedScale: number
): void {
  graphics.fillStyle(color, alpha);
  graphics.beginPath();
  graphics.moveTo(0, worldHeight);

  for (let x = 0; x <= worldWidth; x += 18) {
    const y =
      baseY +
      Math.sin(x / wavelength) * amplitude +
      Math.cos(x * seedScale) * amplitude * 0.32;
    graphics.lineTo(x, y);
  }

  graphics.lineTo(worldWidth, worldHeight);
  graphics.closePath();
  graphics.fillPath();
}

function drawClouds(
  graphics: Phaser.GameObjects.Graphics,
  worldWidth: number,
  timeMs: number,
  windStrength: number,
  windDirection: -1 | 1
): void {
  for (let index = 0; index < 7; index += 1) {
    const seed = hashString(`cloud:${index}`);
    const speed = (14 + (seed % 9) + windStrength * 24) * windDirection;
    const drift = ((timeMs / 1000) * speed + (seed % 300)) % (worldWidth + 360);
    const baseX = windDirection > 0 ? drift - 180 : worldWidth + 180 - drift;
    const baseY = 90 + index * 42 + (seed % 11);
    const width = 70 + (seed % 55);
    const height = 22 + (seed % 13);

    graphics.fillStyle(0xf8fafc, 0.05);
    graphics.fillEllipse(baseX, baseY, width, height);
    graphics.fillEllipse(baseX + width * 0.22, baseY - 9, width * 0.72, height * 0.78);
    graphics.fillEllipse(baseX - width * 0.18, baseY - 7, width * 0.65, height * 0.7);
  }
}

function drawCoastDecor(
  graphics: Phaser.GameObjects.Graphics,
  worldWidth: number,
  waterlineY: number,
  mapId?: string
): void {
  graphics.fillStyle(0x1f3346, 0.28);
  graphics.fillEllipse(worldWidth * 0.18, waterlineY - 104, 240, 54);
  graphics.fillEllipse(worldWidth * 0.78, waterlineY - 90, 320, 60);

  if (mapId === "klapperkueste") {
    graphics.fillStyle(0x486476, 0.62);
    graphics.fillRect(worldWidth * 0.12, waterlineY - 198, 10, 88);
    graphics.fillTriangle(
      worldWidth * 0.125,
      waterlineY - 234,
      worldWidth * 0.17,
      waterlineY - 188,
      worldWidth * 0.125,
      waterlineY - 166
    );
    graphics.fillStyle(0x2b4053, 0.54);
    graphics.beginPath();
    graphics.moveTo(worldWidth * 0.83, waterlineY - 150);
    graphics.lineTo(worldWidth * 0.89, waterlineY - 136);
    graphics.lineTo(worldWidth * 0.87, waterlineY - 116);
    graphics.lineTo(worldWidth * 0.8, waterlineY - 124);
    graphics.closePath();
    graphics.fillPath();
  }
}

function drawTerrain(
  graphics: Phaser.GameObjects.Graphics,
  worldWidth: number,
  worldHeight: number,
  samples: number[],
  sampleSpacing: number,
  mapId?: string
): void {
  const theme = resolveTerrainTheme(mapId);
  graphics.clear();
  graphics.fillStyle(theme.terrainBody, 1);
  graphics.beginPath();
  graphics.moveTo(0, worldHeight);
  for (let index = 0; index < samples.length; index += 1) {
    graphics.lineTo(index * sampleSpacing, samples[index] ?? worldHeight);
  }
  graphics.lineTo(worldWidth, worldHeight);
  graphics.closePath();
  graphics.fillPath();

  drawTerrainStrata(graphics, samples, sampleSpacing, 44, theme.terrainMid, 0.34);
  drawTerrainStrata(graphics, samples, sampleSpacing, 106, theme.terrainDeep, 0.22);
  drawTerrainStrata(graphics, samples, sampleSpacing, 184, theme.terrainDeep, 0.14);

  graphics.lineStyle(8, theme.grass, 0.96);
  traceTerrainLine(graphics, samples, sampleSpacing, 0);
  graphics.lineStyle(3, theme.grassHighlight, 0.54);
  traceTerrainLine(graphics, samples, sampleSpacing, -4);
  drawTerrainDecor(graphics, samples, sampleSpacing, mapId, theme);
}

function drawTerrainStrata(
  graphics: Phaser.GameObjects.Graphics,
  samples: number[],
  sampleSpacing: number,
  offset: number,
  color: number,
  alpha: number
): void {
  graphics.lineStyle(3, color, alpha);
  traceTerrainLine(graphics, samples, sampleSpacing, offset);
}

function traceTerrainLine(
  graphics: Phaser.GameObjects.Graphics,
  samples: number[],
  sampleSpacing: number,
  offsetY: number
): void {
  graphics.beginPath();
  graphics.moveTo(0, (samples[0] ?? 0) + offsetY);
  for (let index = 1; index < samples.length; index += 1) {
    graphics.lineTo(index * sampleSpacing, (samples[index] ?? 0) + offsetY);
  }
  graphics.strokePath();
}

function drawTerrainDecor(
  graphics: Phaser.GameObjects.Graphics,
  samples: number[],
  sampleSpacing: number,
  mapId: string | undefined,
  theme: TerrainTheme
): void {
  const propXs =
    mapId === "klapperkueste"
      ? [180, 392, 614, 908, 1342, 1644, 2016]
      : [250, 580, 930, 1290, 1670, 2050];

  for (const propX of propXs) {
    const scaled = clamp(propX / sampleSpacing, 0, samples.length - 1);
    const left = Math.floor(scaled);
    const groundY = samples[left] ?? samples[samples.length - 1] ?? 0;
    const seed = hashString(`${mapId ?? "map"}:${propX}`);

    graphics.lineStyle(4, 0x3b2a18, 0.45);
    graphics.lineBetween(propX, groundY - 3, propX, groundY - 26);
    graphics.lineStyle(3, theme.grass, 0.78);
    graphics.lineBetween(propX, groundY - 14, propX - 8, groundY - 24);
    graphics.lineBetween(propX, groundY - 18, propX + 9, groundY - 28);

    graphics.fillStyle(seed % 2 === 0 ? 0x6b7280 : 0x475569, 0.42);
    graphics.fillEllipse(propX + 20 + (seed % 19), groundY + 8, 28 + (seed % 11), 12 + (seed % 7));
    graphics.fillStyle(0xfef3c7, 0.5);
    graphics.fillCircle(propX - 18 - (seed % 9), groundY + 5, 3 + (seed % 4));
  }

  const signXs = mapId === "seeschlund" ? [520, 1510] : [720, 1830];
  for (const signX of signXs) {
    const scaled = clamp(signX / sampleSpacing, 0, samples.length - 1);
    const groundY = samples[Math.floor(scaled)] ?? samples[samples.length - 1] ?? 0;

    graphics.lineStyle(5, 0x4a2f1b, 0.74);
    graphics.lineBetween(signX, groundY - 2, signX, groundY - 54);
    graphics.fillStyle(0x8b5a2b, 0.82);
    graphics.fillRoundedRect(signX - 34, groundY - 72, 68, 24, 6);
    graphics.lineStyle(2, 0xfff4cc, 0.38);
    graphics.lineBetween(signX - 24, groundY - 60, signX + 24, groundY - 60);
  }

  for (let index = 0; index < samples.length; index += 34) {
    const x = index * sampleSpacing;
    const y = (samples[index] ?? 0) + 18 + ((index * 17) % 46);

    graphics.fillStyle(index % 3 === 0 ? theme.terrainDeep : theme.terrainMid, 0.14);
    graphics.fillCircle(x + ((index * 11) % 42), y, 3 + (index % 5));
  }
}

function drawWater(
  graphics: Phaser.GameObjects.Graphics,
  worldWidth: number,
  worldHeight: number,
  waterlineY: number,
  timeMs: number,
  windStrength: number,
  windDirection: -1 | 1
): void {
  graphics.clear();
  const phase = (timeMs / 1000) * (0.8 + windStrength) * windDirection;
  const amplitude = 8 + windStrength * 6;

  graphics.fillStyle(0x082942, 0.88);
  graphics.beginPath();
  graphics.moveTo(0, worldHeight);
  for (let x = 0; x <= worldWidth; x += 24) {
    const y = waterlineY + Math.sin(x / 48 + phase) * amplitude + Math.cos(x / 120 + phase * 0.8) * 2;
    graphics.lineTo(x, y);
  }
  graphics.lineTo(worldWidth, worldHeight);
  graphics.closePath();
  graphics.fillPath();

  graphics.lineStyle(4, 0x7dd3fc, 0.55);
  graphics.beginPath();
  graphics.moveTo(0, waterlineY);
  for (let x = 0; x <= worldWidth; x += 24) {
    const y = waterlineY + Math.sin(x / 48 + phase) * amplitude + Math.cos(x / 120 + phase * 0.8) * 2;
    graphics.lineTo(x, y);
  }
  graphics.strokePath();

  graphics.fillStyle(0xbfe9ff, 0.06);
  graphics.fillRect(0, waterlineY + 8, worldWidth, Math.max(0, worldHeight - waterlineY - 8));
}

function drawEffects(
  graphics: Phaser.GameObjects.Graphics,
  state: ChaosKommandoState,
  nowMs: number,
  explosionSeenAtMs: Map<string, number>
): void {
  graphics.clear();
  drawWindStreaks(graphics, state, nowMs);

  for (const projectile of state.projectiles) {
    drawProjectile(graphics, state, projectile);
  }

  const liveExplosionIds = new Set(state.explosions.map((explosion) => explosion.id));
  for (const explosionId of [...explosionSeenAtMs.keys()]) {
    if (!liveExplosionIds.has(explosionId)) {
      explosionSeenAtMs.delete(explosionId);
    }
  }

  for (const explosion of state.explosions) {
    if (!explosionSeenAtMs.has(explosion.id)) {
      explosionSeenAtMs.set(explosion.id, nowMs);
    }

    drawExplosionBurst(graphics, explosion, Math.max(0, nowMs - (explosionSeenAtMs.get(explosion.id) ?? nowMs)));
  }
}

function drawExplosionBurst(
  graphics: Phaser.GameObjects.Graphics,
  explosion: ChaosKommandoState["explosions"][number],
  ageMs: number
): void {
  const progress = clamp(ageMs / 980, 0, 1);
  const fade = 1 - progress;
  const color = toColorNumber(explosion.color, 0xf59e0b);
  const shockRadius = explosion.radius * (0.22 + progress * 1.04);
  const coreRadius = explosion.radius * (0.16 + fade * 0.24);
  const seed = hashString(explosion.id);

  graphics.fillStyle(color, 0.09 + fade * 0.18);
  graphics.fillCircle(explosion.x, explosion.y, shockRadius);
  graphics.lineStyle(5, color, 0.18 + fade * 0.46);
  graphics.strokeCircle(explosion.x, explosion.y, shockRadius);
  graphics.lineStyle(2, 0xfff7d6, 0.12 + fade * 0.24);
  graphics.strokeCircle(explosion.x, explosion.y, shockRadius * 0.68);

  for (let index = 0; index < 14; index += 1) {
    const angle = (Math.PI * 2 * index) / 14 + (seed % 37) * 0.01;
    const lengthJitter = 0.72 + ((seed >> (index % 8)) & 7) * 0.045;
    const innerRadius = explosion.radius * (0.12 + progress * 0.16);
    const outerRadius = explosion.radius * (0.38 + progress * 0.78) * lengthJitter;
    const startX = explosion.x + Math.cos(angle) * innerRadius;
    const startY = explosion.y + Math.sin(angle) * innerRadius;
    const endX = explosion.x + Math.cos(angle) * outerRadius;
    const endY = explosion.y + Math.sin(angle) * outerRadius;

    graphics.lineStyle(2 + fade * 4, index % 3 === 0 ? 0xfff7d6 : color, 0.1 + fade * 0.42);
    graphics.lineBetween(startX, startY, endX, endY);
  }

  for (let index = 0; index < 7; index += 1) {
    const angle = (Math.PI * 2 * index) / 7 + progress * 0.9;
    const distance = explosion.radius * (0.2 + progress * (0.42 + index * 0.03));
    const puffRadius = explosion.radius * (0.07 + fade * 0.08) * (1 + (index % 2) * 0.3);

    graphics.fillStyle(index % 2 === 0 ? 0x1f2937 : 0x334155, 0.08 + fade * 0.16);
    graphics.fillCircle(
      explosion.x + Math.cos(angle) * distance,
      explosion.y + Math.sin(angle) * distance * 0.72,
      puffRadius
    );
  }

  graphics.fillStyle(color, 0.18 + fade * 0.34);
  graphics.fillCircle(explosion.x, explosion.y, coreRadius * 1.36);
  graphics.fillStyle(0xfff7d6, 0.28 + fade * 0.52);
  graphics.fillCircle(explosion.x, explosion.y, coreRadius);
}

function drawWindStreaks(
  graphics: Phaser.GameObjects.Graphics,
  state: ChaosKommandoState,
  nowMs: number
): void {
  const laneCount = 8;
  const swing = 90 + state.wind.strength * 80;
  const length = 52 + state.wind.strength * 58;

  graphics.lineStyle(2, 0xe0f2fe, 0.14 + state.wind.strength * 0.1);
  for (let index = 0; index < laneCount; index += 1) {
    const seed = hashString(`wind:${index}`);
    const speed = (42 + (seed % 17) + state.wind.strength * 80) * state.wind.direction;
    const cycle = state.terrain.width + swing * 2;
    const drift = ((nowMs / 1000) * speed + (seed % 500)) % cycle;
    const baseX = state.wind.direction > 0 ? drift - swing : state.terrain.width + swing - drift;
    const y = 118 + index * 52 + (seed % 20);
    const x2 = baseX + length * state.wind.direction;

    graphics.lineBetween(baseX, y, x2, y - 6);
    graphics.lineStyle(1, 0xf8fafc, 0.1 + state.wind.strength * 0.07);
    graphics.lineBetween(baseX - 12 * state.wind.direction, y + 10, x2 - 12 * state.wind.direction, y + 4);
    graphics.lineStyle(2, 0xe0f2fe, 0.14 + state.wind.strength * 0.1);
  }
}

function drawProjectile(
  graphics: Phaser.GameObjects.Graphics,
  state: ChaosKommandoState,
  projectile: ChaosKommandoState["projectiles"][number]
): void {
  const angle = Math.atan2(projectile.vy, projectile.vx);
  const color = toColorNumber(findWeapon(state, projectile.weaponId)?.accentColor, 0xf8fafc);
  const tailX = projectile.x - Math.cos(angle) * Math.max(20, projectile.radius * 2.6);
  const tailY = projectile.y - Math.sin(angle) * Math.max(20, projectile.radius * 2.6);

  if (projectile.weaponId === "plunder-pistole") {
    graphics.lineStyle(Math.max(2, projectile.radius * 0.8), color, 0.74);
    graphics.lineBetween(tailX, tailY, projectile.x, projectile.y);
    graphics.fillStyle(0xfff7d6, 0.95);
    graphics.fillCircle(projectile.x, projectile.y, Math.max(3, projectile.radius * 0.66));
    return;
  }

  if (projectile.weaponId === "enten-granate") {
    graphics.fillStyle(0xffd34d, 0.96);
    graphics.fillEllipse(projectile.x, projectile.y, projectile.radius * 2.3, projectile.radius * 1.8);
    graphics.fillStyle(0xf97316, 0.88);
    graphics.fillTriangle(
      projectile.x + projectile.radius * 0.78,
      projectile.y,
      projectile.x + projectile.radius * 1.5,
      projectile.y - projectile.radius * 0.28,
      projectile.x + projectile.radius * 1.5,
      projectile.y + projectile.radius * 0.28
    );
    graphics.fillStyle(0x111827, 0.92);
    graphics.fillCircle(projectile.x - projectile.radius * 0.42, projectile.y - projectile.radius * 0.18, Math.max(2, projectile.radius * 0.18));
    graphics.lineStyle(2, 0xfff6c8, 0.45);
    graphics.lineBetween(tailX, tailY, projectile.x - Math.cos(angle) * projectile.radius * 0.65, projectile.y - Math.sin(angle) * projectile.radius * 0.65);
    return;
  }

  if (projectile.weaponId === "splitter-granate") {
    graphics.lineStyle(3, 0xfff7d6, 0.42);
    graphics.lineBetween(tailX, tailY, projectile.x, projectile.y);
    graphics.fillStyle(0xfb923c, 0.96);
    graphics.fillCircle(projectile.x, projectile.y, projectile.radius * 1.05);
    graphics.lineStyle(2, 0x7c2d12, 0.84);
    graphics.strokeCircle(projectile.x, projectile.y, projectile.radius * 1.05);
    for (let index = 0; index < 8; index += 1) {
      const spikeAngle = (Math.PI * 2 * index) / 8;
      graphics.lineBetween(
        projectile.x + Math.cos(spikeAngle) * projectile.radius * 0.65,
        projectile.y + Math.sin(spikeAngle) * projectile.radius * 0.65,
        projectile.x + Math.cos(spikeAngle) * projectile.radius * 1.42,
        projectile.y + Math.sin(spikeAngle) * projectile.radius * 1.42
      );
    }
    graphics.fillStyle(0xfef3c7, 0.9);
    graphics.fillCircle(projectile.x - projectile.radius * 0.32, projectile.y - projectile.radius * 0.28, projectile.radius * 0.22);
    return;
  }

  if (projectile.weaponId === "konfetti-schrot") {
    const colors = [0xf0abfc, 0x67e8f9, 0xfde047, 0xfb7185];
    graphics.lineStyle(2, color, 0.45);
    graphics.lineBetween(tailX, tailY, projectile.x, projectile.y);
    for (let index = 0; index < 4; index += 1) {
      const offsetAngle = angle + Math.PI / 2;
      const offset = (index - 1.5) * projectile.radius * 0.42;
      graphics.fillStyle(colors[index] ?? color, 0.92);
      graphics.fillRect(
        projectile.x + Math.cos(offsetAngle) * offset - 2,
        projectile.y + Math.sin(offsetAngle) * offset - 2,
        4,
        4
      );
    }
    return;
  }

  if (projectile.weaponId === "gummi-huhn") {
    graphics.lineStyle(3, 0xfff7d6, 0.36);
    graphics.lineBetween(tailX, tailY, projectile.x, projectile.y);
    graphics.fillStyle(0xfde047, 0.96);
    graphics.fillEllipse(projectile.x, projectile.y, projectile.radius * 2.5, projectile.radius * 1.35);
    graphics.fillStyle(0xef4444, 0.95);
    graphics.fillCircle(projectile.x - Math.cos(angle) * projectile.radius * 0.6, projectile.y - Math.sin(angle) * projectile.radius * 0.6, projectile.radius * 0.34);
    graphics.fillStyle(0xfb923c, 0.96);
    graphics.fillTriangle(
      projectile.x + Math.cos(angle) * projectile.radius * 1.2,
      projectile.y + Math.sin(angle) * projectile.radius * 1.2,
      projectile.x + Math.cos(angle + 0.55) * projectile.radius * 0.78,
      projectile.y + Math.sin(angle + 0.55) * projectile.radius * 0.78,
      projectile.x + Math.cos(angle - 0.55) * projectile.radius * 0.78,
      projectile.y + Math.sin(angle - 0.55) * projectile.radius * 0.78
    );
    return;
  }

  if (projectile.weaponId === "seifenblasen-bombe") {
    graphics.lineStyle(2, 0x67e8f9, 0.26);
    graphics.lineBetween(tailX, tailY, projectile.x, projectile.y);
    graphics.fillStyle(0x67e8f9, 0.22);
    graphics.fillCircle(projectile.x, projectile.y, projectile.radius * 1.4);
    graphics.lineStyle(3, 0xe0faff, 0.62);
    graphics.strokeCircle(projectile.x, projectile.y, projectile.radius * 1.35);
    graphics.fillStyle(0xffffff, 0.48);
    graphics.fillCircle(projectile.x - projectile.radius * 0.38, projectile.y - projectile.radius * 0.42, projectile.radius * 0.26);
    graphics.fillStyle(0x67e8f9, 0.14);
    graphics.fillCircle(tailX, tailY, projectile.radius * 0.72);
    return;
  }

  if (projectile.weaponId === "bohrer-rakete") {
    graphics.lineStyle(4, color, 0.32);
    graphics.lineBetween(tailX, tailY, projectile.x, projectile.y);
    const drillTipX = projectile.x + Math.cos(angle) * projectile.radius * 1.85;
    const drillTipY = projectile.y + Math.sin(angle) * projectile.radius * 1.85;
    const drillBackX = projectile.x + Math.cos(angle) * projectile.radius * 0.35;
    const drillBackY = projectile.y + Math.sin(angle) * projectile.radius * 0.35;
    const drillWingX = Math.cos(angle + Math.PI / 2) * projectile.radius * 0.9;
    const drillWingY = Math.sin(angle + Math.PI / 2) * projectile.radius * 0.9;
    graphics.fillStyle(0xb6f34b, 0.96);
    graphics.fillTriangle(drillTipX, drillTipY, drillBackX + drillWingX, drillBackY + drillWingY, drillBackX - drillWingX, drillBackY - drillWingY);
    graphics.lineStyle(2, 0x365314, 0.8);
    graphics.lineBetween(drillTipX, drillTipY, drillBackX + drillWingX * 0.6, drillBackY + drillWingY * 0.6);
    graphics.lineBetween(drillTipX, drillTipY, drillBackX - drillWingX * 0.6, drillBackY - drillWingY * 0.6);
    graphics.fillStyle(0x334155, 0.92);
    graphics.fillCircle(projectile.x - Math.cos(angle) * projectile.radius * 0.7, projectile.y - Math.sin(angle) * projectile.radius * 0.7, projectile.radius * 0.72);
    return;
  }

  if (projectile.weaponId === "keks-moerser") {
    graphics.lineStyle(4, 0xd97706, 0.34);
    graphics.lineBetween(tailX, tailY, projectile.x, projectile.y);
    graphics.fillStyle(0xd97706, 0.96);
    graphics.fillCircle(projectile.x, projectile.y, projectile.radius * 1.05);
    graphics.fillStyle(0x7c2d12, 0.8);
    graphics.fillCircle(projectile.x - projectile.radius * 0.36, projectile.y - projectile.radius * 0.18, projectile.radius * 0.18);
    graphics.fillCircle(projectile.x + projectile.radius * 0.28, projectile.y + projectile.radius * 0.22, projectile.radius * 0.15);
    graphics.fillCircle(projectile.x + projectile.radius * 0.18, projectile.y - projectile.radius * 0.38, projectile.radius * 0.13);
    graphics.lineStyle(2, 0xffedd5, 0.62);
    graphics.strokeCircle(projectile.x, projectile.y, projectile.radius * 1.05);
    return;
  }

  if (projectile.weaponId === "regenbogen-rakete") {
    drawRainbowTrail(graphics, tailX, tailY, projectile.x, projectile.y, angle);
  } else {
    graphics.lineStyle(4, color, 0.38);
    graphics.lineBetween(tailX, tailY, projectile.x, projectile.y);
  }

  const noseX = projectile.x + Math.cos(angle) * projectile.radius * 1.6;
  const noseY = projectile.y + Math.sin(angle) * projectile.radius * 1.6;
  const rearX = projectile.x - Math.cos(angle) * projectile.radius * 1.2;
  const rearY = projectile.y - Math.sin(angle) * projectile.radius * 1.2;
  const wingX = Math.cos(angle + Math.PI / 2) * projectile.radius * 0.85;
  const wingY = Math.sin(angle + Math.PI / 2) * projectile.radius * 0.85;

  graphics.fillStyle(color, 0.96);
  graphics.fillTriangle(noseX, noseY, rearX + wingX, rearY + wingY, rearX - wingX, rearY - wingY);
  graphics.lineStyle(2, 0xfff6d7, 0.72);
  graphics.strokeTriangle(noseX, noseY, rearX + wingX, rearY + wingY, rearX - wingX, rearY - wingY);
  graphics.fillStyle(0xfff1bf, 0.56);
  graphics.fillCircle(rearX, rearY, Math.max(4, projectile.radius * 0.48));
}

function drawRainbowTrail(
  graphics: Phaser.GameObjects.Graphics,
  tailX: number,
  tailY: number,
  headX: number,
  headY: number,
  angle: number
): void {
  const perpendicularX = Math.cos(angle + Math.PI / 2);
  const perpendicularY = Math.sin(angle + Math.PI / 2);
  const bands = [
    { color: 0xfb7185, offset: -6 },
    { color: 0xfacc15, offset: 0 },
    { color: 0x38bdf8, offset: 6 }
  ];

  for (const band of bands) {
    graphics.lineStyle(3, band.color, 0.48);
    graphics.lineBetween(
      tailX + perpendicularX * band.offset,
      tailY + perpendicularY * band.offset,
      headX + perpendicularX * band.offset,
      headY + perpendicularY * band.offset
    );
  }
}

function drawActors(
  graphics: Phaser.GameObjects.Graphics,
  state: ChaosKommandoState,
  nowMs: number
): void {
  graphics.clear();
  const selection = resolveSelection(state);
  const gravestoneMercenaryIds = new Set(state.gravestones.map((gravestone) => gravestone.mercenaryId));

  if (selection.mercenary && selection.weapon && (!state.turn.hasFired || state.turn.chargeRatio > 0)) {
    drawAimGuide(graphics, state, selection.mercenary, selection.weapon);
  }

  for (const player of state.players) {
    for (const mercenary of player.mercenaries) {
      if (!mercenary.alive && gravestoneMercenaryIds.has(mercenary.id)) {
        continue;
      }

      drawMercenaryOverlay(graphics, mercenary, selection.mercenary?.id === mercenary.id, nowMs);
    }
  }
}

function drawMercenaryOverlay(
  graphics: Phaser.GameObjects.Graphics,
  mercenary: ChaosKommandoMercenaryState,
  isActive: boolean,
  _nowMs: number
): void {
  if (!mercenary.alive) {
    return;
  }

  const radius = resolveDisplayMercenaryRadius(mercenary) * 1.22;
  const x = mercenary.x;
  const y = mercenary.y + radius * 0.14;
  const teamColor = toColorNumber(mercenary.teamColor, 0x38bdf8);
  const hpRatio = resolveHealthRatio(mercenary.hp, mercenary.maxHp);
  const barWidth = radius * 2.4;
  const barX = x - barWidth / 2;
  const barY = y - radius * 1.88;

  graphics.fillStyle(0x020617, 0.82);
  graphics.fillRoundedRect(barX - 1, barY - 1, barWidth + 2, 10, 5);
  graphics.fillStyle(0x0f172a, 0.96);
  graphics.fillRoundedRect(barX, barY, barWidth, 8, 4);
  graphics.fillStyle(hpRatio > 0.5 ? 0x22c55e : hpRatio > 0.25 ? 0xf59e0b : 0xef4444, 1);
  graphics.fillRoundedRect(barX, barY, hpRatio > 0 ? Math.max(6, barWidth * hpRatio) : 0, 8, 4);

  if (isActive) {
    drawActiveArrow(graphics, x, y - radius * 2.2, teamColor);
  }
}

function drawActiveArrow(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  color: number
): void {
  graphics.fillStyle(color, 0.96);
  graphics.fillTriangle(x - 12, y - 8, x + 12, y - 8, x, y + 12);
  graphics.lineStyle(2, 0xf8fafc, 0.85);
  graphics.strokeTriangle(x - 12, y - 8, x + 12, y - 8, x, y + 12);
  graphics.lineStyle(3, color, 0.42);
  graphics.lineBetween(x, y + 12, x, y + 30);
}

function drawAimGuide(
  graphics: Phaser.GameObjects.Graphics,
  state: ChaosKommandoState,
  mercenary: ChaosKommandoMercenaryState,
  weapon: NonNullable<ReturnType<typeof findWeapon>>
): void {
  const color = toColorNumber(weapon.accentColor, 0xfbbf24);
  const displayRadius = resolveDisplayMercenaryRadius(mercenary) * 1.24;
  const startX = mercenary.x + Math.cos(mercenary.aimAngleRad) * displayRadius * 0.96;
  const startY = mercenary.y + displayRadius * 0.16 + Math.sin(mercenary.aimAngleRad) * displayRadius * 0.78;
  const crosshair = resolveCrosshairPoint(state);

  if (!crosshair) {
    return;
  }

  const crosshairX = crosshair.x;
  const crosshairY = crosshair.y;
  const totalDistance = Math.hypot(crosshairX - startX, crosshairY - startY);
  const directionX = totalDistance > 0.001 ? (crosshairX - startX) / totalDistance : Math.cos(mercenary.aimAngleRad);
  const directionY = totalDistance > 0.001 ? (crosshairY - startY) / totalDistance : Math.sin(mercenary.aimAngleRad);
  const chargeRatio = weapon.fireMode === "charged" ? resolveChargeRatio(state) : 1;
  const beamRatio = weapon.fireMode === "charged" ? Math.max(0.12, chargeRatio) : 1;
  const beamX = Phaser.Math.Linear(startX, crosshairX, beamRatio);
  const beamY = Phaser.Math.Linear(startY, crosshairY, beamRatio);
  const dashLength = 22;
  const dashGap = 16;

  graphics.lineStyle(2, color, weapon.fireMode === "charged" ? 0.26 : 0.48);
  for (let travelled = 0; travelled < totalDistance; travelled += dashLength + dashGap) {
    const fromDistance = travelled;
    const toDistance = Math.min(totalDistance, travelled + dashLength);
    graphics.lineBetween(
      startX + directionX * fromDistance,
      startY + directionY * fromDistance,
      startX + directionX * toDistance,
      startY + directionY * toDistance
    );
  }

  if (weapon.fireMode === "charged") {
    graphics.lineStyle(7, color, 0.12 + chargeRatio * 0.34);
    graphics.lineBetween(startX, startY, beamX, beamY);
    graphics.lineStyle(3, 0xfff7d6, 0.18 + chargeRatio * 0.5);
    graphics.lineBetween(startX, startY, beamX, beamY);
    const orbCount = Math.max(2, Math.round(4 + chargeRatio * 8));

    for (let orbIndex = 0; orbIndex <= orbCount; orbIndex += 1) {
      const orbRatio = (orbIndex / orbCount) * beamRatio;
      const orbX = Phaser.Math.Linear(startX, crosshairX, orbRatio);
      const orbY = Phaser.Math.Linear(startY, crosshairY, orbRatio);
      const orbRadius = 3 + chargeRatio * 5 * (0.45 + orbIndex / Math.max(1, orbCount));

      graphics.fillStyle(color, 0.1 + chargeRatio * 0.18);
      graphics.fillCircle(orbX, orbY, orbRadius);
      graphics.fillStyle(0xfff7d6, 0.08 + chargeRatio * 0.12);
      graphics.fillCircle(orbX, orbY, orbRadius * 0.45);
    }

    graphics.fillStyle(color, 0.2 + chargeRatio * 0.36);
    graphics.fillCircle(beamX, beamY, 7 + chargeRatio * 8);
  } else {
    graphics.lineStyle(3, color, 0.7);
    graphics.lineBetween(startX, startY, crosshairX, crosshairY);
    graphics.lineStyle(1, 0xfff7d6, 0.52);
    graphics.lineBetween(startX, startY, crosshairX, crosshairY);
  }

  const crosshairRadius = weapon.fireMode === "charged" ? 11 + chargeRatio * 6 : 12;
  const tickLength = crosshairRadius * 0.72;
  graphics.lineStyle(3, color, 0.9);
  graphics.lineBetween(crosshairX - crosshairRadius, crosshairY, crosshairX - tickLength, crosshairY);
  graphics.lineBetween(crosshairX + tickLength, crosshairY, crosshairX + crosshairRadius, crosshairY);
  graphics.lineBetween(crosshairX, crosshairY - crosshairRadius, crosshairX, crosshairY - tickLength);
  graphics.lineBetween(crosshairX, crosshairY + tickLength, crosshairX, crosshairY + crosshairRadius);
  graphics.lineStyle(2, 0xfff7d6, 0.62);
  graphics.strokeCircle(crosshairX, crosshairY, crosshairRadius * 0.56);

  if (weapon.fireMode === "charged") {
    graphics.lineStyle(4, color, 0.42);
    graphics.beginPath();
    graphics.arc(
      crosshairX,
      crosshairY,
      crosshairRadius + 7,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * chargeRatio,
      false
    );
    graphics.strokePath();
  }
}

function syncActiveMercenaryLabel(
  label: Phaser.GameObjects.Text,
  _state: ChaosKommandoState
): void {
  label.setVisible(false);
}
