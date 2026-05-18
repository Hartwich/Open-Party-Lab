import type {
  ChaosKommandoAttachmentMode,
  ChaosKommandoBodyAnchorId,
  ChaosKommandoBodyFrameRig,
  ChaosKommandoDualAnchorAttachment,
  ChaosKommandoPoint,
  ChaosKommandoSingleAnchorAttachment,
  ChaosKommandoWeaponAttachmentProfile
} from "./ChaosKommandoVisualConfig.js";

export interface ChaosKommandoAttachmentTransform {
  visible: boolean;
  x: number;
  y: number;
  rotationRad: number;
  scaleX: number;
  scaleY: number;
  originX: number;
  originY: number;
  alpha: number;
  primaryGuide: ChaosKommandoPoint;
  secondaryGuide?: ChaosKommandoPoint;
  mode: ChaosKommandoAttachmentMode;
}

interface BodyContext {
  bodyX: number;
  bodyY: number;
  bodyScale: number;
  direction: "left" | "right";
  frameRig: ChaosKommandoBodyFrameRig;
}

interface ResolveAttachmentTransformOptions extends BodyContext {
  profile: ChaosKommandoSingleAnchorAttachment | ChaosKommandoDualAnchorAttachment;
  textureWidth: number;
  textureHeight: number;
  baseRotationRad?: number;
  mirrorWithDirection?: boolean;
  alphaMultiplier?: number;
}

function degToRad(value: number): number {
  return (value * Math.PI) / 180;
}

function mirrorX(value: number, direction: "left" | "right"): number {
  return direction === "left" ? -value : value;
}

export function resolveBodySpritePosition({
  bodyX,
  bodyY,
  bodyScale,
  direction,
  frameRig
}: BodyContext): ChaosKommandoPoint {
  return {
    x: bodyX + mirrorX(frameRig.offsetX, direction) * bodyScale,
    y: bodyY + frameRig.offsetY * bodyScale
  };
}

export function resolveBodyAnchorWorldPoint({
  bodyX,
  bodyY,
  bodyScale,
  direction,
  frameRig,
  anchorId
}: BodyContext & { anchorId: ChaosKommandoBodyAnchorId }): ChaosKommandoPoint {
  const anchor = frameRig.anchors[anchorId];
  return {
    x: bodyX + mirrorX(anchor.x, direction) * bodyScale,
    y: bodyY + anchor.y * bodyScale
  };
}

function resolveSingleAttachmentTransform(
  options: ResolveAttachmentTransformOptions & {
    profile: ChaosKommandoSingleAnchorAttachment;
  }
): ChaosKommandoAttachmentTransform {
  const {
    bodyX,
    bodyY,
    bodyScale,
    direction,
    frameRig,
    profile,
    baseRotationRad,
    mirrorWithDirection = true,
    alphaMultiplier = 1
  } = options;
  const anchor = resolveBodyAnchorWorldPoint({
    bodyX,
    bodyY,
    bodyScale,
    direction,
    frameRig,
    anchorId: profile.bodyAnchor
  });

  return {
    visible: profile.visible,
    x: anchor.x + mirrorX(profile.offsetX, direction) * bodyScale,
    y: anchor.y + profile.offsetY * bodyScale,
    rotationRad: (baseRotationRad ?? 0) + degToRad(profile.rotationDeg),
    scaleX: bodyScale * profile.scale * (mirrorWithDirection && direction === "left" ? -1 : 1),
    scaleY: bodyScale * profile.scale,
    originX: profile.itemAnchor.x,
    originY: profile.itemAnchor.y,
    alpha: profile.alpha * alphaMultiplier,
    primaryGuide: anchor,
    mode: profile.mode
  };
}

function resolveDualAttachmentTransform(
  options: ResolveAttachmentTransformOptions & {
    profile: ChaosKommandoDualAnchorAttachment;
  }
): ChaosKommandoAttachmentTransform {
  const {
    bodyX,
    bodyY,
    bodyScale,
    direction,
    frameRig,
    profile,
    textureWidth,
    textureHeight,
    baseRotationRad,
    mirrorWithDirection = true,
    alphaMultiplier = 1
  } = options;
  const primary = resolveBodyAnchorWorldPoint({
    bodyX,
    bodyY,
    bodyScale,
    direction,
    frameRig,
    anchorId: profile.primaryBodyAnchor
  });
  const secondary = resolveBodyAnchorWorldPoint({
    bodyX,
    bodyY,
    bodyScale,
    direction,
    frameRig,
    anchorId: profile.secondaryBodyAnchor
  });

  if (typeof baseRotationRad === "number") {
    return {
      visible: profile.visible,
      x: primary.x + mirrorX(profile.offsetX, direction) * bodyScale,
      y: primary.y + profile.offsetY * bodyScale,
      rotationRad: baseRotationRad + degToRad(profile.rotationDeg),
      scaleX: bodyScale * profile.scale * (mirrorWithDirection && direction === "left" ? -1 : 1),
      scaleY: bodyScale * profile.scale,
      originX: profile.primaryItemAnchor.x,
      originY: profile.primaryItemAnchor.y,
      alpha: profile.alpha * alphaMultiplier,
      primaryGuide: primary,
      secondaryGuide: secondary,
      mode: profile.mode
    };
  }

  const itemVectorX = (profile.secondaryItemAnchor.x - profile.primaryItemAnchor.x) * Math.max(1, textureWidth);
  const itemVectorY = (profile.secondaryItemAnchor.y - profile.primaryItemAnchor.y) * Math.max(1, textureHeight);
  const bodyVectorX = secondary.x - primary.x;
  const bodyVectorY = secondary.y - primary.y;
  const itemAngle = Math.atan2(itemVectorY, itemVectorX);
  const bodyAngle = Math.atan2(bodyVectorY, bodyVectorX);

  return {
    visible: profile.visible,
    x: primary.x + mirrorX(profile.offsetX, direction) * bodyScale,
    y: primary.y + profile.offsetY * bodyScale,
    rotationRad: bodyAngle - itemAngle + degToRad(profile.rotationDeg),
    scaleX: bodyScale * profile.scale,
    scaleY: bodyScale * profile.scale,
    originX: profile.primaryItemAnchor.x,
    originY: profile.primaryItemAnchor.y,
    alpha: profile.alpha * alphaMultiplier,
    primaryGuide: primary,
    secondaryGuide: secondary,
    mode: profile.mode
  };
}

export function resolveAttachmentTransform(
  options: ResolveAttachmentTransformOptions
): ChaosKommandoAttachmentTransform {
  return options.profile.mode === "single"
    ? resolveSingleAttachmentTransform(options as ResolveAttachmentTransformOptions & {
        profile: ChaosKommandoSingleAnchorAttachment;
      })
    : resolveDualAttachmentTransform(options as ResolveAttachmentTransformOptions & {
        profile: ChaosKommandoDualAnchorAttachment;
      });
}

export function isDualWeaponProfile(
  profile: ChaosKommandoWeaponAttachmentProfile
): profile is ChaosKommandoDualAnchorAttachment {
  return profile.mode === "dual";
}
