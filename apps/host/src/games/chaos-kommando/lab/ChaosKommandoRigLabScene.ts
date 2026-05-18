import Phaser from "phaser";
import { hostTheme } from "../../../ui/theme/theme.js";
import {
  chaosKommandoBaseFrameSize,
  chaosKommandoCarryWeaponAssetPaths,
  chaosKommandoGearAssetPaths,
  marshmallowSheetPaths,
  type ChaosKommandoBodyAnchorId,
  type ChaosKommandoGearId
} from "../host/ChaosKommandoVisualConfig.js";
import {
  resolveAttachmentTransform,
  resolveBodyAnchorWorldPoint,
  resolveBodySpritePosition
} from "../host/ChaosKommandoRigMath.js";
import {
  ChaosKommandoRigLabStore,
  resolvePoseFrame,
  resolveRigLabCurrentFrameRig,
  resolveRigLabCurrentWeaponProfile,
  resolveRigLabGearProfile,
  rigBodyTextureKeys,
  rigGearTextureKeys,
  rigWalkCycleFrames,
  rigWeaponTextureKeys,
  type ChaosKommandoRigLabState,
  type RigBackgroundMode,
  type RigWeaponId
} from "./chaosKommandoRigLabState.js";

const checkerTextureKey = "chaos-kommando-rig-checker";
const bodyOriginX = 0.5;
const bodyOriginY = 0.72;
const anchorColors: Record<ChaosKommandoBodyAnchorId, number> = {
  head: 0xf97316,
  back: 0x22c55e,
  handPrimary: 0xeab308,
  handSecondary: 0x38bdf8
};

interface RigNodes {
  backgroundFill: Phaser.GameObjects.Rectangle;
  checkerboard: Phaser.GameObjects.TileSprite;
  groundGlow: Phaser.GameObjects.Graphics;
  shadow: Phaser.GameObjects.Ellipse;
  root: Phaser.GameObjects.Container;
  backpack: Phaser.GameObjects.Image;
  body: Phaser.GameObjects.Sprite;
  weapon: Phaser.GameObjects.Image;
  helmet: Phaser.GameObjects.Image;
  guides: Phaser.GameObjects.Graphics;
  statusText: Phaser.GameObjects.Text;
}

export class ChaosKommandoRigLabScene extends Phaser.Scene {
  private readonly store: ChaosKommandoRigLabStore;
  private unsubscribe?: () => void;
  private nodes?: RigNodes;
  private walkAccumulatorMs = 0;

  constructor(store: ChaosKommandoRigLabStore) {
    super("ChaosKommandoRigLabScene");
    this.store = store;
  }

  preload(): void {
    this.load.spritesheet(rigBodyTextureKeys["clean-a"], marshmallowSheetPaths.cleanA, {
      frameWidth: chaosKommandoBaseFrameSize,
      frameHeight: chaosKommandoBaseFrameSize
    });
    this.load.spritesheet(rigBodyTextureKeys["clean-b"], marshmallowSheetPaths.cleanB, {
      frameWidth: chaosKommandoBaseFrameSize,
      frameHeight: chaosKommandoBaseFrameSize
    });
    this.load.spritesheet(rigBodyTextureKeys["raw-a"], marshmallowSheetPaths.rawA, {
      frameWidth: chaosKommandoBaseFrameSize,
      frameHeight: chaosKommandoBaseFrameSize
    });
    this.load.spritesheet(rigBodyTextureKeys["raw-b"], marshmallowSheetPaths.rawB, {
      frameWidth: chaosKommandoBaseFrameSize,
      frameHeight: chaosKommandoBaseFrameSize
    });

    this.load.svg(rigGearTextureKeys.helmet, chaosKommandoGearAssetPaths.helmet);
    this.load.svg(rigGearTextureKeys.backpack, chaosKommandoGearAssetPaths.backpack);

    for (const [weaponId, textureKey] of Object.entries(rigWeaponTextureKeys) as Array<[RigWeaponId, string]>) {
      this.load.svg(textureKey, chaosKommandoCarryWeaponAssetPaths[weaponId]);
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#020617");
    this.ensureCheckerboardTexture();

    const backgroundFill = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x0f172a)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-40);
    const checkerboard = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, checkerTextureKey)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-35);
    const groundGlow = this.add.graphics().setDepth(-12).setScrollFactor(0);
    const shadow = this.add
      .ellipse(0, 0, 252, 44, 0x020617, 0.18)
      .setDepth(2)
      .setScrollFactor(0);

    const root = this.add.container(this.scale.width / 2, this.scale.height / 2 + 42);
    root.setDepth(12);

    const backpack = this.add.image(0, 0, rigGearTextureKeys.backpack).setDepth(1);
    const body = this.add
      .sprite(0, 0, rigBodyTextureKeys["clean-a"], 4)
      .setDepth(4)
      .setOrigin(bodyOriginX, bodyOriginY);
    const weapon = this.add.image(0, 0, rigWeaponTextureKeys["plunder-pistole"]).setDepth(5);
    const helmet = this.add.image(0, 0, rigGearTextureKeys.helmet).setDepth(7);
    const guides = this.add.graphics().setDepth(8);

    root.add([backpack, body, weapon, helmet, guides]);

    const statusText = this.add
      .text(18, 18, "", {
        fontFamily: hostTheme.monoFont,
        fontSize: "14px",
        color: "#e2e8f0",
        backgroundColor: "rgba(2, 6, 23, 0.72)"
      })
      .setDepth(30)
      .setScrollFactor(0)
      .setPadding(10, 8, 10, 8);

    this.nodes = {
      backgroundFill,
      checkerboard,
      groundGlow,
      shadow,
      root,
      backpack,
      body,
      weapon,
      helmet,
      guides,
      statusText
    };

    this.handleResize();
    this.unsubscribe = this.store.subscribe((state) => {
      this.syncScene(state);
    });

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.registerKeyboardShortcuts();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.unsubscribe?.();
      this.unsubscribe = undefined;
    });
  }

  update(_time: number, deltaMs: number): void {
    const state = this.store.getState();

    if (!state.frameLock && state.pose === "walk" && state.playing) {
      const frameDurationMs = 1000 / Math.max(1, state.walkFps);
      this.walkAccumulatorMs += deltaMs;

      if (this.walkAccumulatorMs >= frameDurationMs) {
        this.walkAccumulatorMs %= frameDurationMs;
        const walkCycleIndex = (state.walkCycleIndex + 1) % rigWalkCycleFrames.length;
        this.store.patch({
          walkCycleIndex,
          activeFrame: rigWalkCycleFrames[walkCycleIndex]
        });
      }
      return;
    }

    this.walkAccumulatorMs = 0;
    const targetFrame = state.frameLock
      ? state.inspectionFrame
      : state.pose === "walk"
        ? rigWalkCycleFrames[state.walkCycleIndex]
        : resolvePoseFrame(state.pose);

    if (targetFrame !== state.activeFrame) {
      this.store.patch({ activeFrame: targetFrame });
    }
  }

  private ensureCheckerboardTexture(): void {
    if (this.textures.exists(checkerTextureKey)) {
      return;
    }

    const texture = this.textures.createCanvas(checkerTextureKey, 48, 48);

    if (!texture) {
      return;
    }

    const context = texture.getContext();
    context.fillStyle = "#cbd5e1";
    context.fillRect(0, 0, 48, 48);
    context.fillStyle = "#f8fafc";
    context.fillRect(0, 0, 24, 24);
    context.fillRect(24, 24, 24, 24);
    texture.refresh();
  }

  private handleResize(): void {
    if (!this.nodes) {
      return;
    }

    const { width, height } = this.scale;
    const stageWidth = width > 1180 ? width - 410 : width;
    const centerX = width > 1180 ? Math.max(280, stageWidth * 0.52) : width * 0.5;
    const centerY = height * 0.58;

    this.nodes.backgroundFill.setSize(width, height);
    this.nodes.checkerboard.setSize(width, height);
    this.nodes.root.setPosition(centerX, centerY);
    this.nodes.shadow.setPosition(centerX, centerY + 162);
    this.drawGroundGlow(width, height);
  }

  private drawGroundGlow(width: number, height: number): void {
    if (!this.nodes) {
      return;
    }

    const graphics = this.nodes.groundGlow;
    graphics.clear();
    graphics.fillGradientStyle(0x1d4ed8, 0x1d4ed8, 0x082f49, 0x082f49, 0.18, 0.18, 0.02, 0.02);
    graphics.fillRect(0, height - 220, width, 220);
    graphics.fillStyle(0xffffff, 0.16);
    graphics.fillRoundedRect(44, height - 120, Math.max(180, width - 88), 4, 2);
  }

  private syncScene(state: ChaosKommandoRigLabState): void {
    if (!this.nodes) {
      return;
    }

    this.syncBackground(state.backgroundMode);
    this.syncRig(state);
    this.syncStatus(state);
  }

  private syncBackground(mode: RigBackgroundMode): void {
    if (!this.nodes) {
      return;
    }

    const backgroundModes: Record<RigBackgroundMode, { fill: number; alpha: number; checkerAlpha: number }> = {
      checker: { fill: 0xe2e8f0, alpha: 1, checkerAlpha: 0.88 },
      midnight: { fill: 0x020617, alpha: 1, checkerAlpha: 0.1 },
      paper: { fill: 0xfffbeb, alpha: 1, checkerAlpha: 0.14 },
      chroma: { fill: 0x14b8a6, alpha: 1, checkerAlpha: 0.18 }
    };

    const config = backgroundModes[mode];
    this.nodes.backgroundFill.setFillStyle(config.fill, config.alpha);
    this.nodes.checkerboard.setAlpha(config.checkerAlpha);
  }

  private syncRig(state: ChaosKommandoRigLabState): void {
    if (!this.nodes) {
      return;
    }

    const frameRig = resolveRigLabCurrentFrameRig(state);
    const bodyPosition = resolveBodySpritePosition({
      bodyX: 0,
      bodyY: 0,
      bodyScale: state.bodyScale,
      direction: state.direction,
      frameRig
    });

    this.nodes.root.setScale(state.previewZoom, state.previewZoom);
    this.nodes.body
      .setTexture(rigBodyTextureKeys[state.bodySheetId], state.activeFrame)
      .setPosition(bodyPosition.x, bodyPosition.y)
      .setScale(state.bodyScale)
      .setFlipX(state.direction === "left");

    this.syncGearNode("backpack", state, bodyPosition.x, bodyPosition.y, frameRig);
    this.syncGearNode("helmet", state, bodyPosition.x, bodyPosition.y, frameRig);
    this.syncWeaponNode(state, bodyPosition.x, bodyPosition.y, frameRig);
    this.drawGuides(state, bodyPosition.x, bodyPosition.y, frameRig);
  }

  private syncGearNode(
    gearId: ChaosKommandoGearId,
    state: ChaosKommandoRigLabState,
    bodyX: number,
    bodyY: number,
    frameRig: ReturnType<typeof resolveRigLabCurrentFrameRig>
  ): void {
    if (!this.nodes) {
      return;
    }

    const node = gearId === "helmet" ? this.nodes.helmet : this.nodes.backpack;
    const profile = resolveRigLabGearProfile(state, gearId);
    const size = resolveTextureFrameSize(node);
    const transform = resolveAttachmentTransform({
      bodyX,
      bodyY,
      bodyScale: state.bodyScale,
      direction: state.direction,
      frameRig,
      profile,
      textureWidth: size.width,
      textureHeight: size.height,
      mirrorWithDirection: true
    });

    applyAttachmentTransform(node, transform);
  }

  private syncWeaponNode(
    state: ChaosKommandoRigLabState,
    bodyX: number,
    bodyY: number,
    frameRig: ReturnType<typeof resolveRigLabCurrentFrameRig>
  ): void {
    if (!this.nodes) {
      return;
    }

    this.nodes.weapon.setTexture(rigWeaponTextureKeys[state.weaponId]);
    const profile = resolveRigLabCurrentWeaponProfile(state);
    const size = resolveTextureFrameSize(this.nodes.weapon);
    const transform = resolveAttachmentTransform({
      bodyX,
      bodyY,
      bodyScale: state.bodyScale,
      direction: state.direction,
      frameRig,
      profile,
      textureWidth: size.width,
      textureHeight: size.height,
      mirrorWithDirection: profile.mode === "single"
    });

    applyAttachmentTransform(this.nodes.weapon, transform);
  }

  private drawGuides(
    state: ChaosKommandoRigLabState,
    bodyX: number,
    bodyY: number,
    frameRig: ReturnType<typeof resolveRigLabCurrentFrameRig>
  ): void {
    if (!this.nodes) {
      return;
    }

    const guides = this.nodes.guides;
    guides.clear();

    if (!state.showGuides && !state.showBounds) {
      return;
    }

    if (state.showBounds) {
      const frameWidth = chaosKommandoBaseFrameSize * state.bodyScale;
      const frameHeight = chaosKommandoBaseFrameSize * state.bodyScale;
      const left = bodyX - frameWidth * bodyOriginX;
      const top = bodyY - frameHeight * bodyOriginY;

      guides.lineStyle(2, 0x38bdf8, 0.7);
      guides.strokeRect(left, top, frameWidth, frameHeight);
      guides.lineStyle(1, 0x38bdf8, 0.35);
      guides.strokeCircle(bodyX, bodyY, 108 * state.bodyScale);
    }

    if (state.showGuides) {
      for (const [anchorId, color] of Object.entries(anchorColors) as Array<[ChaosKommandoBodyAnchorId, number]>) {
        const anchorPoint = resolveBodyAnchorWorldPoint({
          bodyX,
          bodyY,
          bodyScale: state.bodyScale,
          direction: state.direction,
          frameRig,
          anchorId
        });
        guides.lineStyle(anchorId === state.selectedBodyAnchorId ? 3 : 2, color, 0.92);
        guides.strokeCircle(anchorPoint.x, anchorPoint.y, anchorId === state.selectedBodyAnchorId ? 9 : 6);
      }

      guides.lineStyle(1, 0x94a3b8, 0.42);
      guides.lineBetween(-156, 0, 156, 0);
      guides.lineBetween(0, -156, 0, 156);
    }
  }

  private syncStatus(state: ChaosKommandoRigLabState): void {
    if (!this.nodes) {
      return;
    }

    const mode = state.frameLock ? "frame-lock" : state.pose;
    const weaponProfile = resolveRigLabCurrentWeaponProfile(state);
    this.nodes.statusText.setText(
      [
        "Chaos-Kommando Rig Lab",
        `frame ${state.activeFrame} | ${mode} | ${state.direction}`,
        `${state.weaponId} | ${weaponProfile.mode} | ${state.bodySheetId}`,
        `anchor ${state.selectedBodyAnchorId}`
      ].join("\n")
    );
  }

  private registerKeyboardShortcuts(): void {
    const keyboard = this.input.keyboard;

    if (!keyboard) {
      return;
    }

    keyboard.on("keydown-SPACE", () => {
      const state = this.store.getState();
      this.store.patch({ playing: !state.playing, frameLock: false });
    });
    keyboard.on("keydown-LEFT", () => {
      this.store.stepFrame(-1);
    });
    keyboard.on("keydown-RIGHT", () => {
      this.store.stepFrame(1);
    });
    keyboard.on("keydown-F", () => {
      const state = this.store.getState();
      this.store.patch({ direction: state.direction === "left" ? "right" : "left" });
    });
    keyboard.on("keydown-H", () => {
      const state = this.store.getState();
      const profile = resolveRigLabGearProfile(state, "helmet");
      this.store.patchGearProfile("helmet", { visible: !profile.visible });
    });
    keyboard.on("keydown-B", () => {
      const state = this.store.getState();
      const profile = resolveRigLabGearProfile(state, "backpack");
      this.store.patchGearProfile("backpack", { visible: !profile.visible });
    });
    keyboard.on("keydown-G", () => {
      const state = this.store.getState();
      this.store.patch({ showGuides: !state.showGuides });
    });
  }
}

function resolveTextureFrameSize(node: Phaser.GameObjects.Image): { width: number; height: number } {
  return {
    width: node.frame?.realWidth ?? 1,
    height: node.frame?.realHeight ?? 1
  };
}

function applyAttachmentTransform(
  node: Phaser.GameObjects.Image,
  transform: ReturnType<typeof resolveAttachmentTransform>
): void {
  node
    .setVisible(transform.visible)
    .setPosition(transform.x, transform.y)
    .setOrigin(transform.originX, transform.originY)
    .setRotation(transform.rotationRad)
    .setScale(transform.scaleX, transform.scaleY)
    .setAlpha(transform.alpha);
}
