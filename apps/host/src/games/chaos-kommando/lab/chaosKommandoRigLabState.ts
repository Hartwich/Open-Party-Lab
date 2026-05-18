import type { ChaosKommandoWeaponId } from "@open-party-lab/protocol";
import {
  chaosKommandoBodyAnchorOptions,
  chaosKommandoRigPreset,
  cloneChaosKommandoRigPreset,
  resolveChaosKommandoFrameRig,
  resolveChaosKommandoRigFamilyForBodySheet,
  serializeChaosKommandoRigPreset,
  type ChaosKommandoBodyAnchorId,
  type ChaosKommandoBodyFrameRig,
  type ChaosKommandoBodySheetId,
  type ChaosKommandoGearAttachmentProfile,
  type ChaosKommandoGearId,
  type ChaosKommandoPoint,
  type ChaosKommandoRigFamilyId,
  type ChaosKommandoRigPreset,
  type ChaosKommandoWeaponAttachmentProfile
} from "../host/ChaosKommandoVisualConfig.js";

export const rigWalkCycleFrames = [0, 1, 2, 5, 8, 7, 6, 3] as const;

export const rigBodyTextureKeys = {
  "clean-a": "chaos-kommando-rig-clean-a",
  "clean-b": "chaos-kommando-rig-clean-b",
  "raw-a": "chaos-kommando-rig-raw-a",
  "raw-b": "chaos-kommando-rig-raw-b"
} as const;

export const rigWeaponTextureKeys = {
  "kicher-bazooka": "chaos-kommando-rig-weapon-kicher-bazooka",
  "enten-granate": "chaos-kommando-rig-weapon-enten-granate",
  "plunder-pistole": "chaos-kommando-rig-weapon-plunder-pistole",
  "regenbogen-rakete": "chaos-kommando-rig-weapon-regenbogen-rakete",
  "splitter-granate": "chaos-kommando-rig-weapon-splitter-granate",
  "konfetti-schrot": "chaos-kommando-rig-weapon-konfetti-schrot",
  "bohrer-rakete": "chaos-kommando-rig-weapon-bohrer-rakete",
  "gummi-huhn": "chaos-kommando-rig-weapon-gummi-huhn",
  "seifenblasen-bombe": "chaos-kommando-rig-weapon-seifenblasen-bombe",
  "keks-moerser": "chaos-kommando-rig-weapon-keks-moerser"
} as const;

export const rigGearTextureKeys = {
  helmet: "chaos-kommando-rig-helmet",
  backpack: "chaos-kommando-rig-backpack"
} as const;

export type RigBodySheetId = keyof typeof rigBodyTextureKeys;
export type RigWeaponId = keyof typeof rigWeaponTextureKeys;
export type RigDirection = "left" | "right";
export type RigPose = "idle" | "walk" | "jump-rise" | "jump-fall";
export type RigBackgroundMode = "checker" | "midnight" | "paper" | "chroma";
export type RigAttachmentMode = "single" | "dual";

export interface ChaosKommandoRigLabState {
  bodySheetId: RigBodySheetId;
  pose: RigPose;
  playing: boolean;
  direction: RigDirection;
  backgroundMode: RigBackgroundMode;
  showGuides: boolean;
  showBounds: boolean;
  frameLock: boolean;
  inspectionFrame: number;
  activeFrame: number;
  walkCycleIndex: number;
  walkFps: number;
  previewZoom: number;
  bodyScale: number;
  weaponId: RigWeaponId;
  selectedBodyAnchorId: ChaosKommandoBodyAnchorId;
  preset: ChaosKommandoRigPreset;
}

export const rigBodySheetOptions: Array<{ value: RigBodySheetId; label: string }> = [
  { value: "clean-a", label: "Clean A" },
  { value: "clean-b", label: "Clean B" },
  { value: "raw-a", label: "Raw A" },
  { value: "raw-b", label: "Raw B" }
];

export const rigPoseOptions: Array<{ value: RigPose; label: string }> = [
  { value: "idle", label: "Idle" },
  { value: "walk", label: "Walk" },
  { value: "jump-rise", label: "Jump Up" },
  { value: "jump-fall", label: "Jump Down" }
];

export const rigBackgroundOptions: Array<{ value: RigBackgroundMode; label: string }> = [
  { value: "checker", label: "Checker" },
  { value: "midnight", label: "Midnight" },
  { value: "paper", label: "Paper" },
  { value: "chroma", label: "Chroma" }
];

export const rigWeaponOptions: Array<{ value: RigWeaponId; label: string }> = [
  { value: "plunder-pistole", label: "Plunder-Pistole" },
  { value: "kicher-bazooka", label: "Kicher-Bazooka" },
  { value: "enten-granate", label: "Enten-Granate" },
  { value: "regenbogen-rakete", label: "Regenbogen-Rakete" },
  { value: "splitter-granate", label: "Splitter-Granate" },
  { value: "konfetti-schrot", label: "Konfetti-Schrot" },
  { value: "bohrer-rakete", label: "Bohrer-Rakete" },
  { value: "gummi-huhn", label: "Gummi-Huhn" },
  { value: "seifenblasen-bombe", label: "Seifenblasen-Bombe" },
  { value: "keks-moerser", label: "Keks-Moerser" }
];

export const rigBodyAnchorOptions = chaosKommandoBodyAnchorOptions;

export const rigAttachmentModeOptions: Array<{ value: RigAttachmentMode; label: string }> = [
  { value: "single", label: "Einhaendig" },
  { value: "dual", label: "Zweihaendig" }
];

export function createDefaultChaosKommandoRigLabState(): ChaosKommandoRigLabState {
  return {
    bodySheetId: "clean-a",
    pose: "walk",
    playing: true,
    direction: "right",
    backgroundMode: "checker",
    showGuides: true,
    showBounds: false,
    frameLock: false,
    inspectionFrame: 4,
    activeFrame: 4,
    walkCycleIndex: 0,
    walkFps: 7,
    previewZoom: 1,
    bodyScale: 0.72,
    weaponId: "plunder-pistole",
    selectedBodyAnchorId: "handPrimary",
    preset: cloneChaosKommandoRigPreset(chaosKommandoRigPreset)
  };
}

type RigLabListener = (state: ChaosKommandoRigLabState) => void;

export class ChaosKommandoRigLabStore {
  private state = createDefaultChaosKommandoRigLabState();
  private listeners = new Set<RigLabListener>();

  getState(): ChaosKommandoRigLabState {
    return this.state;
  }

  subscribe(listener: RigLabListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  patch(patch: Partial<Omit<ChaosKommandoRigLabState, "preset">>): void {
    this.state = {
      ...this.state,
      ...patch
    };
    this.emit();
  }

  patchCurrentFrame(patch: Partial<Pick<ChaosKommandoBodyFrameRig, "offsetX" | "offsetY">>): void {
    const familyId = resolveRigLabCurrentFamilyId(this.state);
    const frameIndex = this.state.activeFrame;
    const currentFrame = resolveRigLabCurrentFrameRig(this.state);

    this.replaceFrame(familyId, frameIndex, {
      ...currentFrame,
      ...patch
    });
  }

  patchCurrentFrameAnchor(anchorId: ChaosKommandoBodyAnchorId, patch: Partial<ChaosKommandoPoint>): void {
    const familyId = resolveRigLabCurrentFamilyId(this.state);
    const frameIndex = this.state.activeFrame;
    const currentFrame = resolveRigLabCurrentFrameRig(this.state);

    this.replaceFrame(familyId, frameIndex, {
      ...currentFrame,
      anchors: {
        ...currentFrame.anchors,
        [anchorId]: {
          ...currentFrame.anchors[anchorId],
          ...patch
        }
      }
    });
  }

  patchWeaponProfile(
    weaponId: RigWeaponId,
    patch: Partial<ChaosKommandoWeaponAttachmentProfile>
  ): void {
    const currentProfile = this.state.preset.weapons[weaponId];
    this.state = {
      ...this.state,
      preset: {
        ...this.state.preset,
        weapons: {
          ...this.state.preset.weapons,
          [weaponId]: {
            ...currentProfile,
            ...patch
          } as ChaosKommandoWeaponAttachmentProfile
        }
      }
    };
    this.emit();
  }

  patchWeaponPoint(
    weaponId: RigWeaponId,
    pointKey: "itemAnchor" | "primaryItemAnchor" | "secondaryItemAnchor",
    patch: Partial<ChaosKommandoPoint>
  ): void {
    const currentProfile = this.state.preset.weapons[weaponId];

    if (pointKey === "itemAnchor" && currentProfile.mode === "single") {
      this.patchWeaponProfile(weaponId, {
        itemAnchor: {
          ...currentProfile.itemAnchor,
          ...patch
        }
      });
      return;
    }

    if (pointKey === "primaryItemAnchor" && currentProfile.mode === "dual") {
      this.patchWeaponProfile(weaponId, {
        primaryItemAnchor: {
          ...currentProfile.primaryItemAnchor,
          ...patch
        }
      });
      return;
    }

    if (pointKey === "secondaryItemAnchor" && currentProfile.mode === "dual") {
      this.patchWeaponProfile(weaponId, {
        secondaryItemAnchor: {
          ...currentProfile.secondaryItemAnchor,
          ...patch
        }
      });
    }
  }

  setWeaponMode(weaponId: RigWeaponId, mode: RigAttachmentMode): void {
    const currentProfile = this.state.preset.weapons[weaponId];

    if (currentProfile.mode === mode) {
      return;
    }

    const nextProfile =
      mode === "single"
        ? {
            visible: currentProfile.visible,
            mode,
            bodyAnchor: currentProfile.mode === "dual" ? currentProfile.primaryBodyAnchor : currentProfile.bodyAnchor,
            itemAnchor: currentProfile.mode === "dual" ? currentProfile.primaryItemAnchor : currentProfile.itemAnchor,
            offsetX: currentProfile.offsetX,
            offsetY: currentProfile.offsetY,
            scale: currentProfile.scale,
            rotationDeg: currentProfile.rotationDeg,
            alpha: currentProfile.alpha
          }
        : {
            visible: currentProfile.visible,
            mode,
            primaryBodyAnchor:
              currentProfile.mode === "dual" ? currentProfile.primaryBodyAnchor : currentProfile.bodyAnchor,
            secondaryBodyAnchor:
              currentProfile.mode === "dual" ? currentProfile.secondaryBodyAnchor : "handSecondary",
            primaryItemAnchor:
              currentProfile.mode === "dual"
                ? currentProfile.primaryItemAnchor
                : currentProfile.itemAnchor,
            secondaryItemAnchor:
              currentProfile.mode === "dual"
                ? currentProfile.secondaryItemAnchor
                : { x: Math.min(0.98, currentProfile.itemAnchor.x + 0.22), y: currentProfile.itemAnchor.y - 0.02 },
            offsetX: currentProfile.offsetX,
            offsetY: currentProfile.offsetY,
            scale: currentProfile.scale,
            rotationDeg: currentProfile.rotationDeg,
            alpha: currentProfile.alpha
          };

    this.patchWeaponProfile(weaponId, nextProfile);
  }

  patchGearProfile(
    gearId: ChaosKommandoGearId,
    patch: Partial<ChaosKommandoGearAttachmentProfile>
  ): void {
    const currentProfile = this.state.preset.gears[gearId];
    this.state = {
      ...this.state,
      preset: {
        ...this.state.preset,
        gears: {
          ...this.state.preset.gears,
          [gearId]: {
            ...currentProfile,
            ...patch
          }
        }
      }
    };
    this.emit();
  }

  patchGearPoint(gearId: ChaosKommandoGearId, patch: Partial<ChaosKommandoPoint>): void {
    const currentProfile = this.state.preset.gears[gearId];
    this.patchGearProfile(gearId, {
      itemAnchor: {
        ...currentProfile.itemAnchor,
        ...patch
      }
    });
  }

  stepFrame(direction: -1 | 1): void {
    const frame = wrapFrameIndex(this.state.inspectionFrame + direction);
    this.patch({
      frameLock: true,
      playing: false,
      inspectionFrame: frame,
      activeFrame: frame
    });
  }

  exportPreset(): string {
    return serializeChaosKommandoRigPreset(this.state.preset);
  }

  private replaceFrame(
    familyId: ChaosKommandoRigFamilyId,
    frameIndex: number,
    frameRig: ChaosKommandoBodyFrameRig
  ): void {
    this.state = {
      ...this.state,
      preset: {
        ...this.state.preset,
        families: {
          ...this.state.preset.families,
          [familyId]: {
            ...this.state.preset.families[familyId],
            [frameIndex]: frameRig
          }
        }
      }
    };
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export function wrapFrameIndex(value: number): number {
  return ((value % 9) + 9) % 9;
}

export function resolvePoseFrame(pose: RigPose): number {
  switch (pose) {
    case "idle":
      return 4;
    case "jump-rise":
      return 1;
    case "jump-fall":
      return 7;
    case "walk":
    default:
      return rigWalkCycleFrames[0];
  }
}

export function resolveRigLabCurrentFamilyId(state: ChaosKommandoRigLabState): ChaosKommandoRigFamilyId {
  return resolveChaosKommandoRigFamilyForBodySheet(state.bodySheetId as ChaosKommandoBodySheetId);
}

export function resolveRigLabCurrentFrameRig(state: ChaosKommandoRigLabState): ChaosKommandoBodyFrameRig {
  return resolveChaosKommandoFrameRig(state.preset, resolveRigLabCurrentFamilyId(state), state.activeFrame);
}

export function resolveRigLabCurrentWeaponProfile(
  state: ChaosKommandoRigLabState
): ChaosKommandoWeaponAttachmentProfile {
  return state.preset.weapons[state.weaponId as ChaosKommandoWeaponId];
}

export function resolveRigLabGearProfile(
  state: ChaosKommandoRigLabState,
  gearId: ChaosKommandoGearId
): ChaosKommandoGearAttachmentProfile {
  return state.preset.gears[gearId];
}
