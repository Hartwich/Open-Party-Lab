import type { ChaosKommandoMercenaryState, ChaosKommandoWeaponId } from "@open-party-lab/protocol";
import { chaosKommandoGeneratedRigPreset } from "./ChaosKommandoRigPreset.generated.js";

export const marshmallowSheetPaths = {
  rawA: "/chaos-kommando/characters/marshmallow-walk-a.png",
  rawB: "/chaos-kommando/characters/marshmallow-walk-b.png",
  cleanA: "/chaos-kommando/characters/marshmallow-walk-a-clean.png",
  cleanB: "/chaos-kommando/characters/marshmallow-walk-b-clean.png"
} as const;

export const chaosKommandoGearAssetPaths = {
  helmet: "/chaos-kommando/characters/gear/marshmallow-helmet.svg",
  backpack: "/chaos-kommando/characters/gear/marshmallow-backpack.svg"
} as const;

export const chaosKommandoCarryWeaponAssetPaths: Record<ChaosKommandoWeaponId, string> = {
  "kicher-bazooka": "/chaos-kommando/weapons/carry/kicher-bazooka-carry.svg",
  "enten-granate": "/chaos-kommando/weapons/carry/enten-granate-carry.svg",
  "plunder-pistole": "/chaos-kommando/weapons/carry/plunder-pistole-carry.svg",
  "regenbogen-rakete": "/chaos-kommando/weapons/carry/regenbogen-rakete-carry.svg",
  "splitter-granate": "/chaos-kommando/weapons/carry/splitter-granate-carry.svg",
  "konfetti-schrot": "/chaos-kommando/weapons/carry/konfetti-schrot-carry.svg",
  "bohrer-rakete": "/chaos-kommando/weapons/carry/bohrer-rakete-carry.svg",
  "gummi-huhn": "/chaos-kommando/weapons/carry/gummi-huhn-carry.svg",
  "seifenblasen-bombe": "/chaos-kommando/weapons/carry/seifenblasen-bombe-carry.svg",
  "keks-moerser": "/chaos-kommando/weapons/carry/keks-moerser-carry.svg"
};

export const mercenaryAnimationKeys = {
  sprinter: "chaos-kommando-marshmallow-sprinter-walk",
  grenadier: "chaos-kommando-marshmallow-grenadier-walk",
  "chaos-schuetze": "chaos-kommando-marshmallow-schuetze-walk"
} as const;

export const mercenaryWalkFrames = [0, 1, 2, 5, 8, 7, 6, 3] as const;
export const mercenaryIdleFrame = 4;
export const mercenaryJumpRiseFrame = 1;
export const mercenaryJumpFallFrame = 7;
export const chaosKommandoBaseFrameSize = 418;

export type ChaosKommandoRigFamilyId = "a" | "b";
export type ChaosKommandoBodyAnchorId = "head" | "back" | "handPrimary" | "handSecondary";
export type ChaosKommandoGearId = "helmet" | "backpack";
export type ChaosKommandoAttachmentMode = "single" | "dual";
export type ChaosKommandoBodySheetId = "clean-a" | "clean-b" | "raw-a" | "raw-b";

export interface ChaosKommandoPoint {
  x: number;
  y: number;
}

export interface ChaosKommandoBodyFrameRig {
  offsetX: number;
  offsetY: number;
  anchors: Record<ChaosKommandoBodyAnchorId, ChaosKommandoPoint>;
}

export interface ChaosKommandoSingleAnchorAttachment {
  visible: boolean;
  mode: "single";
  bodyAnchor: ChaosKommandoBodyAnchorId;
  itemAnchor: ChaosKommandoPoint;
  offsetX: number;
  offsetY: number;
  scale: number;
  rotationDeg: number;
  alpha: number;
}

export interface ChaosKommandoDualAnchorAttachment {
  visible: boolean;
  mode: "dual";
  primaryBodyAnchor: ChaosKommandoBodyAnchorId;
  secondaryBodyAnchor: ChaosKommandoBodyAnchorId;
  primaryItemAnchor: ChaosKommandoPoint;
  secondaryItemAnchor: ChaosKommandoPoint;
  offsetX: number;
  offsetY: number;
  scale: number;
  rotationDeg: number;
  alpha: number;
}

export type ChaosKommandoWeaponAttachmentProfile =
  | ChaosKommandoSingleAnchorAttachment
  | ChaosKommandoDualAnchorAttachment;

export type ChaosKommandoGearAttachmentProfile = ChaosKommandoSingleAnchorAttachment;

export interface ChaosKommandoRigPreset {
  families: Record<ChaosKommandoRigFamilyId, Record<number, ChaosKommandoBodyFrameRig>>;
  gears: Record<ChaosKommandoGearId, ChaosKommandoGearAttachmentProfile>;
  weapons: Record<ChaosKommandoWeaponId, ChaosKommandoWeaponAttachmentProfile>;
}

export const chaosKommandoBodyAnchorOptions: Array<{
  value: ChaosKommandoBodyAnchorId;
  label: string;
}> = [
  { value: "head", label: "Kopf" },
  { value: "back", label: "Ruecken" },
  { value: "handPrimary", label: "Hand A" },
  { value: "handSecondary", label: "Hand B" }
];

function frame(
  offsetX: number,
  offsetY: number,
  anchors: Record<ChaosKommandoBodyAnchorId, ChaosKommandoPoint>
): ChaosKommandoBodyFrameRig {
  return {
    offsetX,
    offsetY,
    anchors
  };
}

function single(
  bodyAnchor: ChaosKommandoBodyAnchorId,
  itemAnchor: ChaosKommandoPoint,
  offsetX: number,
  offsetY: number,
  scale: number,
  rotationDeg: number,
  alpha = 1
): ChaosKommandoSingleAnchorAttachment {
  return {
    visible: true,
    mode: "single",
    bodyAnchor,
    itemAnchor,
    offsetX,
    offsetY,
    scale,
    rotationDeg,
    alpha
  };
}

function dual(
  primaryBodyAnchor: ChaosKommandoBodyAnchorId,
  secondaryBodyAnchor: ChaosKommandoBodyAnchorId,
  primaryItemAnchor: ChaosKommandoPoint,
  secondaryItemAnchor: ChaosKommandoPoint,
  offsetX: number,
  offsetY: number,
  scale: number,
  rotationDeg: number,
  alpha = 1
): ChaosKommandoDualAnchorAttachment {
  return {
    visible: true,
    mode: "dual",
    primaryBodyAnchor,
    secondaryBodyAnchor,
    primaryItemAnchor,
    secondaryItemAnchor,
    offsetX,
    offsetY,
    scale,
    rotationDeg,
    alpha
  };
}

const familyAFrames: Record<number, ChaosKommandoBodyFrameRig> = {
  0: frame(0, 4, {
    head: { x: 4, y: -124 },
    back: { x: -54, y: -8 },
    handPrimary: { x: 74, y: -24 },
    handSecondary: { x: 38, y: -22 }
  }),
  1: frame(2, -2, {
    head: { x: 4, y: -128 },
    back: { x: -56, y: -10 },
    handPrimary: { x: 78, y: -34 },
    handSecondary: { x: 40, y: -32 }
  }),
  2: frame(4, -10, {
    head: { x: 6, y: -132 },
    back: { x: -52, y: -12 },
    handPrimary: { x: 76, y: -42 },
    handSecondary: { x: 42, y: -38 }
  }),
  3: frame(0, 2, {
    head: { x: 4, y: -126 },
    back: { x: -54, y: -9 },
    handPrimary: { x: 70, y: -28 },
    handSecondary: { x: 36, y: -26 }
  }),
  4: frame(0, 0, {
    head: { x: 2, y: -126 },
    back: { x: -56, y: -8 },
    handPrimary: { x: 72, y: -26 },
    handSecondary: { x: 36, y: -24 }
  }),
  5: frame(-2, -6, {
    head: { x: 0, y: -130 },
    back: { x: -58, y: -10 },
    handPrimary: { x: 66, y: -34 },
    handSecondary: { x: 32, y: -32 }
  }),
  6: frame(-4, -10, {
    head: { x: -2, y: -132 },
    back: { x: -60, y: -12 },
    handPrimary: { x: 66, y: -42 },
    handSecondary: { x: 34, y: -38 }
  }),
  7: frame(-2, -2, {
    head: { x: 0, y: -128 },
    back: { x: -58, y: -10 },
    handPrimary: { x: 68, y: -30 },
    handSecondary: { x: 32, y: -28 }
  }),
  8: frame(0, 6, {
    head: { x: 2, y: -122 },
    back: { x: -56, y: -6 },
    handPrimary: { x: 72, y: -20 },
    handSecondary: { x: 36, y: -18 }
  })
};

const familyBFrames: Record<number, ChaosKommandoBodyFrameRig> = {
  0: frame(0, 6, {
    head: { x: 2, y: -122 },
    back: { x: -50, y: -4 },
    handPrimary: { x: 72, y: -22 },
    handSecondary: { x: 38, y: -20 }
  }),
  1: frame(2, 0, {
    head: { x: 4, y: -126 },
    back: { x: -52, y: -7 },
    handPrimary: { x: 76, y: -30 },
    handSecondary: { x: 40, y: -28 }
  }),
  2: frame(4, -8, {
    head: { x: 6, y: -130 },
    back: { x: -50, y: -10 },
    handPrimary: { x: 78, y: -38 },
    handSecondary: { x: 42, y: -34 }
  }),
  3: frame(1, 3, {
    head: { x: 4, y: -124 },
    back: { x: -52, y: -6 },
    handPrimary: { x: 72, y: -24 },
    handSecondary: { x: 36, y: -22 }
  }),
  4: frame(0, 1, {
    head: { x: 2, y: -124 },
    back: { x: -54, y: -6 },
    handPrimary: { x: 72, y: -24 },
    handSecondary: { x: 36, y: -22 }
  }),
  5: frame(-1, -3, {
    head: { x: 0, y: -128 },
    back: { x: -56, y: -8 },
    handPrimary: { x: 66, y: -30 },
    handSecondary: { x: 32, y: -28 }
  }),
  6: frame(-3, -8, {
    head: { x: -2, y: -130 },
    back: { x: -58, y: -10 },
    handPrimary: { x: 66, y: -38 },
    handSecondary: { x: 34, y: -34 }
  }),
  7: frame(-2, -1, {
    head: { x: -1, y: -126 },
    back: { x: -56, y: -7 },
    handPrimary: { x: 68, y: -28 },
    handSecondary: { x: 32, y: -26 }
  }),
  8: frame(0, 8, {
    head: { x: 2, y: -120 },
    back: { x: -54, y: -2 },
    handPrimary: { x: 72, y: -18 },
    handSecondary: { x: 36, y: -16 }
  })
};

const fallbackChaosKommandoRigPreset: ChaosKommandoRigPreset = {
  families: {
    a: familyAFrames,
    b: familyBFrames
  },
  gears: {
    helmet: single("head", { x: 0.5, y: 0.82 }, 0, 8, 0.7, -2),
    backpack: single("back", { x: 0.62, y: 0.5 }, -2, 2, 0.56, -4)
  },
  weapons: {
    "plunder-pistole": single("handPrimary", { x: 0.18, y: 0.62 }, 2, 0, 0.88, -2),
    "enten-granate": single("handPrimary", { x: 0.5, y: 0.56 }, 6, 2, 0.72, -12),
    "splitter-granate": single("handPrimary", { x: 0.48, y: 0.56 }, 6, 2, 0.7, -10),
    "konfetti-schrot": dual(
      "handSecondary",
      "handPrimary",
      { x: 0.16, y: 0.62 },
      { x: 0.58, y: 0.54 },
      -2,
      0,
      0.86,
      -5
    ),
    "bohrer-rakete": dual(
      "handSecondary",
      "handPrimary",
      { x: 0.2, y: 0.62 },
      { x: 0.58, y: 0.52 },
      -3,
      0,
      0.94,
      0
    ),
    "gummi-huhn": single("handPrimary", { x: 0.36, y: 0.6 }, 6, 3, 0.84, -8),
    "seifenblasen-bombe": single("handPrimary", { x: 0.5, y: 0.52 }, 8, 1, 0.7, -4, 0.88),
    "keks-moerser": dual(
      "handSecondary",
      "handPrimary",
      { x: 0.18, y: 0.68 },
      { x: 0.58, y: 0.54 },
      -2,
      1,
      0.92,
      -10
    ),
    "regenbogen-rakete": dual(
      "handSecondary",
      "handPrimary",
      { x: 0.2, y: 0.64 },
      { x: 0.55, y: 0.5 },
      -2,
      0,
      0.9,
      -6
    ),
    "kicher-bazooka": dual(
      "handSecondary",
      "handPrimary",
      { x: 0.18, y: 0.64 },
      { x: 0.55, y: 0.54 },
      -3,
      0,
      1.08,
      2
    )
  }
};

export const chaosKommandoRigPreset: ChaosKommandoRigPreset = chaosKommandoGeneratedRigPreset;

export const chaosKommandoRoleRigFamily: Record<ChaosKommandoMercenaryState["role"], ChaosKommandoRigFamilyId> = {
  sprinter: "b",
  grenadier: "a",
  "chaos-schuetze": "a"
};

export function cloneChaosKommandoRigPreset(
  preset: ChaosKommandoRigPreset = chaosKommandoRigPreset
): ChaosKommandoRigPreset {
  return JSON.parse(JSON.stringify(preset)) as ChaosKommandoRigPreset;
}

export function resolveChaosKommandoRigFamilyForRole(
  role: ChaosKommandoMercenaryState["role"]
): ChaosKommandoRigFamilyId {
  return chaosKommandoRoleRigFamily[role];
}

export function resolveChaosKommandoRigFamilyForBodySheet(
  bodySheetId: ChaosKommandoBodySheetId
): ChaosKommandoRigFamilyId {
  return bodySheetId.endsWith("b") ? "b" : "a";
}

export function resolveChaosKommandoFrameRig(
  preset: ChaosKommandoRigPreset,
  familyId: ChaosKommandoRigFamilyId,
  frameIndex: number
): ChaosKommandoBodyFrameRig {
  return (
    preset.families[familyId][frameIndex] ??
    preset.families[familyId][mercenaryIdleFrame] ??
    preset.families.a[mercenaryIdleFrame]
  );
}

export function serializeChaosKommandoRigPreset(preset: ChaosKommandoRigPreset): string {
  return [
    "export const chaosKommandoRigPreset = ",
    JSON.stringify(preset, null, 2),
    " as const satisfies ChaosKommandoRigPreset;\n"
  ].join("");
}

function degToRad(value: number): number {
  return (value * Math.PI) / 180;
}

export const gearVisuals = {
  helmet: {
    offsetX: 0.02,
    offsetY: -0.7,
    scale: 0.74,
    rotation: degToRad(-2)
  },
  backpack: {
    offsetX: -0.52,
    offsetY: -0.08,
    scale: 0.56,
    rotation: degToRad(-4)
  }
} as const;

export const weaponVisuals = {
  "kicher-bazooka": {
    sizeMultiplier: 2.22,
    offsetX: 0.44,
    offsetY: 0.22,
    originX: 0.2,
    originY: 0.6,
    rotationOffset: degToRad(4)
  },
  "enten-granate": {
    sizeMultiplier: 1.5,
    offsetX: 0.36,
    offsetY: 0.22,
    originX: 0.5,
    originY: 0.56,
    rotationOffset: degToRad(-12)
  },
  "plunder-pistole": {
    sizeMultiplier: 1.84,
    offsetX: 0.42,
    offsetY: 0.2,
    originX: 0.2,
    originY: 0.62,
    rotationOffset: degToRad(-2)
  },
  "splitter-granate": {
    sizeMultiplier: 1.48,
    offsetX: 0.36,
    offsetY: 0.22,
    originX: 0.48,
    originY: 0.56,
    rotationOffset: degToRad(-10)
  },
  "konfetti-schrot": {
    sizeMultiplier: 1.78,
    offsetX: 0.42,
    offsetY: 0.2,
    originX: 0.18,
    originY: 0.62,
    rotationOffset: degToRad(-5)
  },
  "bohrer-rakete": {
    sizeMultiplier: 1.92,
    offsetX: 0.44,
    offsetY: 0.18,
    originX: 0.22,
    originY: 0.62,
    rotationOffset: degToRad(0)
  },
  "gummi-huhn": {
    sizeMultiplier: 1.62,
    offsetX: 0.36,
    offsetY: 0.22,
    originX: 0.36,
    originY: 0.6,
    rotationOffset: degToRad(-8)
  },
  "seifenblasen-bombe": {
    sizeMultiplier: 1.42,
    offsetX: 0.36,
    offsetY: 0.18,
    originX: 0.5,
    originY: 0.52,
    rotationOffset: degToRad(-4)
  },
  "keks-moerser": {
    sizeMultiplier: 1.86,
    offsetX: 0.42,
    offsetY: 0.2,
    originX: 0.18,
    originY: 0.68,
    rotationOffset: degToRad(-10)
  },
  "regenbogen-rakete": {
    sizeMultiplier: 1.84,
    offsetX: 0.44,
    offsetY: 0.18,
    originX: 0.46,
    originY: 0.68,
    rotationOffset: degToRad(-18)
  }
} as const;
