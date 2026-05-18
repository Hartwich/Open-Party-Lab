import {
  ChaosKommandoRigLabStore,
  resolveRigLabCurrentFrameRig,
  resolveRigLabCurrentWeaponProfile,
  resolveRigLabGearProfile,
  rigAttachmentModeOptions,
  rigBackgroundOptions,
  rigBodyAnchorOptions,
  rigBodySheetOptions,
  rigPoseOptions,
  rigWeaponOptions,
  type ChaosKommandoRigLabState,
  type RigAttachmentMode,
  type RigBackgroundMode,
  type RigBodySheetId,
  type RigPose,
  type RigWeaponId
} from "./chaosKommandoRigLabState.js";

const styleElementId = "chaos-kommando-rig-lab-style";
const overlayRootId = "chaos-kommando-rig-lab";

type SliderConfig = {
  min: number;
  max: number;
  step: number;
  valueFormatter?: (value: number) => string;
};

type SliderBinding = {
  input: HTMLInputElement;
  value: HTMLElement;
  sync: (value: number) => void;
};

export function mountChaosKommandoRigLabOverlay(store: ChaosKommandoRigLabStore): () => void {
  ensureOverlayStyles();
  document.getElementById(overlayRootId)?.remove();

  const root = document.createElement("aside");
  root.id = overlayRootId;
  root.className = "chaos-rig-lab";
  root.innerHTML = `
    <div class="chaos-rig-lab__card">
      <div class="chaos-rig-lab__header">
        <div>
          <p class="chaos-rig-lab__eyebrow">Rig / Export</p>
          <h1>Chaos-Kommando Rig Lab</h1>
        </div>
        <div class="chaos-rig-lab__badge">?lab=chaos-kommando-rig</div>
      </div>
      <p class="chaos-rig-lab__copy">
        Pro Frame definierst du hier den Body-Offset, Kopf, Ruecken und beide Haende.
        Helm, Rucksack und jede Waffe bekommen eigene Item-Anker und koennen ein- oder
        zweihaendig getragen werden.
      </p>
      <details open>
        <summary>Preview</summary>
        <div class="chaos-rig-lab__grid">
          <label class="chaos-rig-lab__field">
            <span>Body Sheet</span>
            <select data-control="bodySheetId"></select>
          </label>
          <label class="chaos-rig-lab__field">
            <span>Pose</span>
            <select data-control="pose"></select>
          </label>
          <label class="chaos-rig-lab__field">
            <span>Waffe</span>
            <select data-control="weaponId"></select>
          </label>
          <label class="chaos-rig-lab__field">
            <span>Hintergrund</span>
            <select data-control="backgroundMode"></select>
          </label>
        </div>
        <div class="chaos-rig-lab__row">
          <button type="button" data-action="flip-left">Links</button>
          <button type="button" data-action="flip-right">Rechts</button>
          <button type="button" data-action="play-toggle">Play</button>
          <button type="button" data-action="step-back">Frame -</button>
          <button type="button" data-action="step-forward">Frame +</button>
        </div>
        <label class="chaos-rig-lab__toggle">
          <input type="checkbox" data-control="frameLock" />
          <span>Frame Lock</span>
        </label>
        <div data-slider="inspectionFrame"></div>
        <div data-slider="walkFps"></div>
      </details>
      <details open>
        <summary>Display</summary>
        <div data-slider="previewZoom"></div>
        <div data-slider="bodyScale"></div>
        <label class="chaos-rig-lab__toggle">
          <input type="checkbox" data-control="showGuides" />
          <span>Guides anzeigen</span>
        </label>
        <label class="chaos-rig-lab__toggle">
          <input type="checkbox" data-control="showBounds" />
          <span>Frame-Bounds anzeigen</span>
        </label>
        <div class="chaos-rig-lab__row chaos-rig-lab__row--export">
          <button type="button" data-action="export-preset">Export TS</button>
          <div class="chaos-rig-lab__export-status" data-export-status>Bereit</div>
        </div>
      </details>
      <details open>
        <summary>Frame / Body</summary>
        <div class="chaos-rig-lab__grid">
          <label class="chaos-rig-lab__field">
            <span>Aktiver Anker</span>
            <select data-control="selectedBodyAnchorId"></select>
          </label>
          <div class="chaos-rig-lab__field">
            <span>Aktive Familie</span>
            <div class="chaos-rig-lab__readout" data-readout="familyId"></div>
          </div>
        </div>
        <div data-slider="frameOffsetX"></div>
        <div data-slider="frameOffsetY"></div>
        <div data-slider="frameAnchorX"></div>
        <div data-slider="frameAnchorY"></div>
      </details>
      <details open>
        <summary>Waffe</summary>
        <label class="chaos-rig-lab__toggle">
          <input type="checkbox" data-weapon-control="visible" />
          <span>Sichtbar</span>
        </label>
        <div class="chaos-rig-lab__grid">
          <label class="chaos-rig-lab__field">
            <span>Tragen</span>
            <select data-weapon-select="mode"></select>
          </label>
          <label class="chaos-rig-lab__field">
            <span>Primaerer Body-Anker</span>
            <select data-weapon-select="primaryBodyAnchor"></select>
          </label>
          <label class="chaos-rig-lab__field">
            <span>Sekundaerer Body-Anker</span>
            <select data-weapon-select="secondaryBodyAnchor"></select>
          </label>
          <div class="chaos-rig-lab__field">
            <span>Modus</span>
            <div class="chaos-rig-lab__readout" data-readout="weaponMode"></div>
          </div>
        </div>
        <div data-slider="weaponPrimaryItemX"></div>
        <div data-slider="weaponPrimaryItemY"></div>
        <div data-slider="weaponSecondaryItemX"></div>
        <div data-slider="weaponSecondaryItemY"></div>
        <div data-slider="weaponOffsetX"></div>
        <div data-slider="weaponOffsetY"></div>
        <div data-slider="weaponScale"></div>
        <div data-slider="weaponRotation"></div>
        <div data-slider="weaponAlpha"></div>
      </details>
      <details open>
        <summary>Helm</summary>
        <label class="chaos-rig-lab__toggle">
          <input type="checkbox" data-gear-control="helmet.visible" />
          <span>Sichtbar</span>
        </label>
        <div class="chaos-rig-lab__grid">
          <label class="chaos-rig-lab__field">
            <span>Body-Anker</span>
            <select data-gear-select="helmet.bodyAnchor"></select>
          </label>
        </div>
        <div data-slider="helmetItemX"></div>
        <div data-slider="helmetItemY"></div>
        <div data-slider="helmetOffsetX"></div>
        <div data-slider="helmetOffsetY"></div>
        <div data-slider="helmetScale"></div>
        <div data-slider="helmetRotation"></div>
        <div data-slider="helmetAlpha"></div>
      </details>
      <details open>
        <summary>Rucksack</summary>
        <label class="chaos-rig-lab__toggle">
          <input type="checkbox" data-gear-control="backpack.visible" />
          <span>Sichtbar</span>
        </label>
        <div class="chaos-rig-lab__grid">
          <label class="chaos-rig-lab__field">
            <span>Body-Anker</span>
            <select data-gear-select="backpack.bodyAnchor"></select>
          </label>
        </div>
        <div data-slider="backpackItemX"></div>
        <div data-slider="backpackItemY"></div>
        <div data-slider="backpackOffsetX"></div>
        <div data-slider="backpackOffsetY"></div>
        <div data-slider="backpackScale"></div>
        <div data-slider="backpackRotation"></div>
        <div data-slider="backpackAlpha"></div>
      </details>
    </div>
  `;

  document.body.appendChild(root);

  bindSelect(root, "bodySheetId", rigBodySheetOptions, (value) => {
    store.patch({ bodySheetId: value as RigBodySheetId });
  });
  bindSelect(root, "pose", rigPoseOptions, (value) => {
    store.patch({ pose: value as RigPose });
  });
  bindSelect(root, "weaponId", rigWeaponOptions, (value) => {
    store.patch({ weaponId: value as RigWeaponId });
  });
  bindSelect(root, "backgroundMode", rigBackgroundOptions, (value) => {
    store.patch({ backgroundMode: value as RigBackgroundMode });
  });
  bindSelect(root, "selectedBodyAnchorId", rigBodyAnchorOptions, (value) => {
    store.patch({ selectedBodyAnchorId: value as ChaosKommandoRigLabState["selectedBodyAnchorId"] });
  });

  bindSelectByAttribute(root, "[data-weapon-select='mode']", rigAttachmentModeOptions, (value) => {
    const state = store.getState();
    store.setWeaponMode(state.weaponId, value as RigAttachmentMode);
  });
  bindSelectByAttribute(root, "[data-weapon-select='primaryBodyAnchor']", rigBodyAnchorOptions, (value) => {
    const state = store.getState();
    const profile = resolveRigLabCurrentWeaponProfile(state);
    store.patchWeaponProfile(
      state.weaponId,
      profile.mode === "single"
        ? { bodyAnchor: value as ChaosKommandoRigLabState["selectedBodyAnchorId"] }
        : { primaryBodyAnchor: value as ChaosKommandoRigLabState["selectedBodyAnchorId"] }
    );
  });
  bindSelectByAttribute(root, "[data-weapon-select='secondaryBodyAnchor']", rigBodyAnchorOptions, (value) => {
    const state = store.getState();
    const profile = resolveRigLabCurrentWeaponProfile(state);
    if (profile.mode === "dual") {
      store.patchWeaponProfile(state.weaponId, {
        secondaryBodyAnchor: value as ChaosKommandoRigLabState["selectedBodyAnchorId"]
      });
    }
  });
  bindSelectByAttribute(root, "[data-gear-select='helmet.bodyAnchor']", rigBodyAnchorOptions, (value) => {
    store.patchGearProfile("helmet", {
      bodyAnchor: value as ChaosKommandoRigLabState["selectedBodyAnchorId"]
    });
  });
  bindSelectByAttribute(root, "[data-gear-select='backpack.bodyAnchor']", rigBodyAnchorOptions, (value) => {
    store.patchGearProfile("backpack", {
      bodyAnchor: value as ChaosKommandoRigLabState["selectedBodyAnchorId"]
    });
  });

  bindCheckbox(root, "frameLock", (checked) => store.patch({ frameLock: checked, playing: !checked }));
  bindCheckbox(root, "showGuides", (checked) => store.patch({ showGuides: checked }));
  bindCheckbox(root, "showBounds", (checked) => store.patch({ showBounds: checked }));
  bindCheckboxByAttribute(root, "[data-weapon-control='visible']", (checked) => {
    const state = store.getState();
    store.patchWeaponProfile(state.weaponId, { visible: checked });
  });
  bindCheckboxByAttribute(root, "[data-gear-control='helmet.visible']", (checked) => {
    store.patchGearProfile("helmet", { visible: checked });
  });
  bindCheckboxByAttribute(root, "[data-gear-control='backpack.visible']", (checked) => {
    store.patchGearProfile("backpack", { visible: checked });
  });

  const sliders: Record<string, SliderBinding> = {
    inspectionFrame: createSliderBinding(root, "inspectionFrame", "Frame", { min: 0, max: 8, step: 1 }, (value) =>
      store.patch({ inspectionFrame: value, activeFrame: value, frameLock: true, playing: false })
    ),
    walkFps: createSliderBinding(root, "walkFps", "Walk FPS", { min: 2, max: 14, step: 1 }, (value) =>
      store.patch({ walkFps: value })
    ),
    previewZoom: createSliderBinding(root, "previewZoom", "Preview Zoom", { min: 0.6, max: 1.5, step: 0.01 }, (value) =>
      store.patch({ previewZoom: value })
    ),
    bodyScale: createSliderBinding(root, "bodyScale", "Body Scale", { min: 0.45, max: 1.2, step: 0.01 }, (value) =>
      store.patch({ bodyScale: value })
    ),
    frameOffsetX: createSliderBinding(root, "frameOffsetX", "Frame X", { min: -48, max: 48, step: 1 }, (value) =>
      store.patchCurrentFrame({ offsetX: value })
    ),
    frameOffsetY: createSliderBinding(root, "frameOffsetY", "Frame Y", { min: -48, max: 48, step: 1 }, (value) =>
      store.patchCurrentFrame({ offsetY: value })
    ),
    frameAnchorX: createSliderBinding(root, "frameAnchorX", "Anker X", { min: -160, max: 160, step: 1 }, (value) => {
      const state = store.getState();
      store.patchCurrentFrameAnchor(state.selectedBodyAnchorId, { x: value });
    }),
    frameAnchorY: createSliderBinding(root, "frameAnchorY", "Anker Y", { min: -180, max: 180, step: 1 }, (value) => {
      const state = store.getState();
      store.patchCurrentFrameAnchor(state.selectedBodyAnchorId, { y: value });
    }),
    weaponPrimaryItemX: createSliderBinding(
      root,
      "weaponPrimaryItemX",
      "Item A X",
      { min: 0, max: 1, step: 0.01 },
      (value) => {
        const state = store.getState();
        const profile = resolveRigLabCurrentWeaponProfile(state);
        store.patchWeaponPoint(state.weaponId, profile.mode === "single" ? "itemAnchor" : "primaryItemAnchor", { x: value });
      }
    ),
    weaponPrimaryItemY: createSliderBinding(
      root,
      "weaponPrimaryItemY",
      "Item A Y",
      { min: 0, max: 1, step: 0.01 },
      (value) => {
        const state = store.getState();
        const profile = resolveRigLabCurrentWeaponProfile(state);
        store.patchWeaponPoint(state.weaponId, profile.mode === "single" ? "itemAnchor" : "primaryItemAnchor", { y: value });
      }
    ),
    weaponSecondaryItemX: createSliderBinding(
      root,
      "weaponSecondaryItemX",
      "Item B X",
      { min: 0, max: 1, step: 0.01 },
      (value) => {
        const state = store.getState();
        store.patchWeaponPoint(state.weaponId, "secondaryItemAnchor", { x: value });
      }
    ),
    weaponSecondaryItemY: createSliderBinding(
      root,
      "weaponSecondaryItemY",
      "Item B Y",
      { min: 0, max: 1, step: 0.01 },
      (value) => {
        const state = store.getState();
        store.patchWeaponPoint(state.weaponId, "secondaryItemAnchor", { y: value });
      }
    ),
    weaponOffsetX: createSliderBinding(root, "weaponOffsetX", "Offset X", { min: -80, max: 80, step: 1 }, (value) => {
      const state = store.getState();
      store.patchWeaponProfile(state.weaponId, { offsetX: value });
    }),
    weaponOffsetY: createSliderBinding(root, "weaponOffsetY", "Offset Y", { min: -80, max: 80, step: 1 }, (value) => {
      const state = store.getState();
      store.patchWeaponProfile(state.weaponId, { offsetY: value });
    }),
    weaponScale: createSliderBinding(root, "weaponScale", "Scale", { min: 0.2, max: 1.8, step: 0.01 }, (value) => {
      const state = store.getState();
      store.patchWeaponProfile(state.weaponId, { scale: value });
    }),
    weaponRotation: createSliderBinding(
      root,
      "weaponRotation",
      "Rotation",
      { min: -90, max: 90, step: 0.5, valueFormatter: formatDegrees },
      (value) => {
        const state = store.getState();
        store.patchWeaponProfile(state.weaponId, { rotationDeg: value });
      }
    ),
    weaponAlpha: createSliderBinding(
      root,
      "weaponAlpha",
      "Opacity",
      { min: 0, max: 1, step: 0.01, valueFormatter: formatPercent },
      (value) => {
        const state = store.getState();
        store.patchWeaponProfile(state.weaponId, { alpha: value });
      }
    ),
    helmetItemX: createSliderBinding(root, "helmetItemX", "Item X", { min: 0, max: 1, step: 0.01 }, (value) => {
      store.patchGearPoint("helmet", { x: value });
    }),
    helmetItemY: createSliderBinding(root, "helmetItemY", "Item Y", { min: 0, max: 1, step: 0.01 }, (value) => {
      store.patchGearPoint("helmet", { y: value });
    }),
    helmetOffsetX: createSliderBinding(root, "helmetOffsetX", "Offset X", { min: -80, max: 80, step: 1 }, (value) => {
      store.patchGearProfile("helmet", { offsetX: value });
    }),
    helmetOffsetY: createSliderBinding(root, "helmetOffsetY", "Offset Y", { min: -80, max: 80, step: 1 }, (value) => {
      store.patchGearProfile("helmet", { offsetY: value });
    }),
    helmetScale: createSliderBinding(root, "helmetScale", "Scale", { min: 0.2, max: 1.6, step: 0.01 }, (value) => {
      store.patchGearProfile("helmet", { scale: value });
    }),
    helmetRotation: createSliderBinding(
      root,
      "helmetRotation",
      "Rotation",
      { min: -90, max: 90, step: 0.5, valueFormatter: formatDegrees },
      (value) => {
        store.patchGearProfile("helmet", { rotationDeg: value });
      }
    ),
    helmetAlpha: createSliderBinding(
      root,
      "helmetAlpha",
      "Opacity",
      { min: 0, max: 1, step: 0.01, valueFormatter: formatPercent },
      (value) => {
        store.patchGearProfile("helmet", { alpha: value });
      }
    ),
    backpackItemX: createSliderBinding(root, "backpackItemX", "Item X", { min: 0, max: 1, step: 0.01 }, (value) => {
      store.patchGearPoint("backpack", { x: value });
    }),
    backpackItemY: createSliderBinding(root, "backpackItemY", "Item Y", { min: 0, max: 1, step: 0.01 }, (value) => {
      store.patchGearPoint("backpack", { y: value });
    }),
    backpackOffsetX: createSliderBinding(root, "backpackOffsetX", "Offset X", { min: -80, max: 80, step: 1 }, (value) => {
      store.patchGearProfile("backpack", { offsetX: value });
    }),
    backpackOffsetY: createSliderBinding(root, "backpackOffsetY", "Offset Y", { min: -80, max: 80, step: 1 }, (value) => {
      store.patchGearProfile("backpack", { offsetY: value });
    }),
    backpackScale: createSliderBinding(root, "backpackScale", "Scale", { min: 0.2, max: 1.6, step: 0.01 }, (value) => {
      store.patchGearProfile("backpack", { scale: value });
    }),
    backpackRotation: createSliderBinding(
      root,
      "backpackRotation",
      "Rotation",
      { min: -90, max: 90, step: 0.5, valueFormatter: formatDegrees },
      (value) => {
        store.patchGearProfile("backpack", { rotationDeg: value });
      }
    ),
    backpackAlpha: createSliderBinding(
      root,
      "backpackAlpha",
      "Opacity",
      { min: 0, max: 1, step: 0.01, valueFormatter: formatPercent },
      (value) => {
        store.patchGearProfile("backpack", { alpha: value });
      }
    )
  };

  root.querySelector<HTMLButtonElement>("[data-action='flip-left']")?.addEventListener("click", () => {
    store.patch({ direction: "left" });
  });
  root.querySelector<HTMLButtonElement>("[data-action='flip-right']")?.addEventListener("click", () => {
    store.patch({ direction: "right" });
  });
  root.querySelector<HTMLButtonElement>("[data-action='play-toggle']")?.addEventListener("click", () => {
    const state = store.getState();
    store.patch({ playing: !state.playing, frameLock: false });
  });
  root.querySelector<HTMLButtonElement>("[data-action='step-back']")?.addEventListener("click", () => {
    store.stepFrame(-1);
  });
  root.querySelector<HTMLButtonElement>("[data-action='step-forward']")?.addEventListener("click", () => {
    store.stepFrame(1);
  });

  const exportStatus = root.querySelector<HTMLElement>("[data-export-status]");
  root.querySelector<HTMLButtonElement>("[data-action='export-preset']")?.addEventListener("click", async () => {
    const content = store.exportPreset();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
        setExportStatus(exportStatus, "Preset kopiert");
        return;
      }
    } catch {
      // ignore and fall back to download
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "chaos-kommando-rig-preset.ts";
    link.click();
    URL.revokeObjectURL(url);
    setExportStatus(exportStatus, "Preset heruntergeladen");
  });

  const unsubscribe = store.subscribe((state) => {
    syncUi(root, state, sliders);
  });

  return () => {
    unsubscribe();
    root.remove();
  };
}

function bindSelect(
  root: HTMLElement,
  controlName: string,
  options: Array<{ value: string; label: string }>,
  onChange: (value: string) => void
): void {
  bindSelectByAttribute(root, `[data-control='${controlName}']`, options, onChange);
}

function bindSelectByAttribute(
  root: HTMLElement,
  selector: string,
  options: Array<{ value: string; label: string }>,
  onChange: (value: string) => void
): void {
  const select = root.querySelector<HTMLSelectElement>(selector);

  if (!select) {
    return;
  }

  select.replaceChildren(
    ...options.map((option) => {
      const element = document.createElement("option");
      element.value = option.value;
      element.textContent = option.label;
      return element;
    })
  );
  select.addEventListener("change", () => onChange(select.value));
}

function bindCheckbox(
  root: HTMLElement,
  controlName: string,
  onChange: (checked: boolean) => void
): void {
  bindCheckboxByAttribute(root, `[data-control='${controlName}']`, onChange);
}

function bindCheckboxByAttribute(
  root: HTMLElement,
  selector: string,
  onChange: (checked: boolean) => void
): void {
  const input = root.querySelector<HTMLInputElement>(selector);

  if (!input) {
    return;
  }

  input.addEventListener("change", () => onChange(input.checked));
}

function createSliderBinding(
  root: HTMLElement,
  key: string,
  label: string,
  config: SliderConfig,
  onChange: (value: number) => void
): SliderBinding {
  const mountPoint = root.querySelector<HTMLElement>(`[data-slider='${key}']`);

  if (!mountPoint) {
    throw new Error(`Missing slider mount point for ${key}`);
  }

  const field = document.createElement("label");
  field.className = "chaos-rig-lab__slider";
  const title = document.createElement("div");
  title.className = "chaos-rig-lab__slider-head";
  const titleLabel = document.createElement("span");
  titleLabel.textContent = label;
  const valueLabel = document.createElement("span");
  valueLabel.className = "chaos-rig-lab__slider-value";
  title.append(titleLabel, valueLabel);

  const input = document.createElement("input");
  input.type = "range";
  input.min = String(config.min);
  input.max = String(config.max);
  input.step = String(config.step);
  input.addEventListener("input", () => {
    onChange(Number(input.value));
  });

  field.append(title, input);
  mountPoint.replaceChildren(field);

  return {
    input,
    value: valueLabel,
    sync(value) {
      input.value = String(value);
      valueLabel.textContent = config.valueFormatter ? config.valueFormatter(value) : formatNumber(value);
    }
  };
}

function syncUi(root: HTMLElement, state: ChaosKommandoRigLabState, sliders: Record<string, SliderBinding>): void {
  const frameRig = resolveRigLabCurrentFrameRig(state);
  const currentAnchor = frameRig.anchors[state.selectedBodyAnchorId];
  const weaponProfile = resolveRigLabCurrentWeaponProfile(state);
  const helmetProfile = resolveRigLabGearProfile(state, "helmet");
  const backpackProfile = resolveRigLabGearProfile(state, "backpack");

  syncSelect(root, "bodySheetId", state.bodySheetId);
  syncSelect(root, "pose", state.pose);
  syncSelect(root, "weaponId", state.weaponId);
  syncSelect(root, "backgroundMode", state.backgroundMode);
  syncSelect(root, "selectedBodyAnchorId", state.selectedBodyAnchorId);
  syncCheckbox(root, "frameLock", state.frameLock);
  syncCheckbox(root, "showGuides", state.showGuides);
  syncCheckbox(root, "showBounds", state.showBounds);
  syncCheckboxBySelector(root, "[data-weapon-control='visible']", weaponProfile.visible);
  syncCheckboxBySelector(root, "[data-gear-control='helmet.visible']", helmetProfile.visible);
  syncCheckboxBySelector(root, "[data-gear-control='backpack.visible']", backpackProfile.visible);

  sliders.inspectionFrame.sync(state.inspectionFrame);
  sliders.walkFps.sync(state.walkFps);
  sliders.previewZoom.sync(state.previewZoom);
  sliders.bodyScale.sync(state.bodyScale);
  sliders.frameOffsetX.sync(frameRig.offsetX);
  sliders.frameOffsetY.sync(frameRig.offsetY);
  sliders.frameAnchorX.sync(currentAnchor.x);
  sliders.frameAnchorY.sync(currentAnchor.y);

  const weaponPrimaryBodyAnchor =
    weaponProfile.mode === "single" ? weaponProfile.bodyAnchor : weaponProfile.primaryBodyAnchor;
  const weaponPrimaryItemAnchor =
    weaponProfile.mode === "single" ? weaponProfile.itemAnchor : weaponProfile.primaryItemAnchor;

  syncSelectBySelector(root, "[data-weapon-select='mode']", weaponProfile.mode);
  syncSelectBySelector(root, "[data-weapon-select='primaryBodyAnchor']", weaponPrimaryBodyAnchor);
  syncSelectBySelector(
    root,
    "[data-weapon-select='secondaryBodyAnchor']",
    weaponProfile.mode === "dual" ? weaponProfile.secondaryBodyAnchor : "handSecondary"
  );
  sliders.weaponPrimaryItemX.sync(weaponPrimaryItemAnchor.x);
  sliders.weaponPrimaryItemY.sync(weaponPrimaryItemAnchor.y);
  sliders.weaponSecondaryItemX.sync(
    weaponProfile.mode === "dual" ? weaponProfile.secondaryItemAnchor.x : weaponPrimaryItemAnchor.x
  );
  sliders.weaponSecondaryItemY.sync(
    weaponProfile.mode === "dual" ? weaponProfile.secondaryItemAnchor.y : weaponPrimaryItemAnchor.y
  );
  sliders.weaponOffsetX.sync(weaponProfile.offsetX);
  sliders.weaponOffsetY.sync(weaponProfile.offsetY);
  sliders.weaponScale.sync(weaponProfile.scale);
  sliders.weaponRotation.sync(weaponProfile.rotationDeg);
  sliders.weaponAlpha.sync(weaponProfile.alpha);

  const secondaryWeaponControls = [
    root.querySelector<HTMLSelectElement>("[data-weapon-select='secondaryBodyAnchor']"),
    sliders.weaponSecondaryItemX.input,
    sliders.weaponSecondaryItemY.input
  ];

  secondaryWeaponControls.forEach((control) => {
    if (!control) {
      return;
    }
    control.disabled = weaponProfile.mode !== "dual";
  });

  syncReadout(root, "familyId", state.bodySheetId.endsWith("b") ? "B" : "A");
  syncReadout(root, "weaponMode", weaponProfile.mode === "dual" ? "Zweihaendig" : "Einhaendig");

  syncSelectBySelector(root, "[data-gear-select='helmet.bodyAnchor']", helmetProfile.bodyAnchor);
  syncSelectBySelector(root, "[data-gear-select='backpack.bodyAnchor']", backpackProfile.bodyAnchor);
  sliders.helmetItemX.sync(helmetProfile.itemAnchor.x);
  sliders.helmetItemY.sync(helmetProfile.itemAnchor.y);
  sliders.helmetOffsetX.sync(helmetProfile.offsetX);
  sliders.helmetOffsetY.sync(helmetProfile.offsetY);
  sliders.helmetScale.sync(helmetProfile.scale);
  sliders.helmetRotation.sync(helmetProfile.rotationDeg);
  sliders.helmetAlpha.sync(helmetProfile.alpha);
  sliders.backpackItemX.sync(backpackProfile.itemAnchor.x);
  sliders.backpackItemY.sync(backpackProfile.itemAnchor.y);
  sliders.backpackOffsetX.sync(backpackProfile.offsetX);
  sliders.backpackOffsetY.sync(backpackProfile.offsetY);
  sliders.backpackScale.sync(backpackProfile.scale);
  sliders.backpackRotation.sync(backpackProfile.rotationDeg);
  sliders.backpackAlpha.sync(backpackProfile.alpha);

  const playToggleButton = root.querySelector<HTMLButtonElement>("[data-action='play-toggle']");
  if (playToggleButton) {
    playToggleButton.textContent = state.playing && !state.frameLock ? "Pause" : "Play";
  }

  updateDirectionButton(root, "flip-left", state.direction === "left");
  updateDirectionButton(root, "flip-right", state.direction === "right");
}

function setExportStatus(element: HTMLElement | null, value: string): void {
  if (!element) {
    return;
  }
  element.textContent = value;
}

function updateDirectionButton(root: HTMLElement, action: string, active: boolean): void {
  const button = root.querySelector<HTMLButtonElement>(`[data-action='${action}']`);
  if (!button) {
    return;
  }
  button.dataset.active = active ? "true" : "false";
}

function syncSelect(root: HTMLElement, controlName: string, value: string): void {
  syncSelectBySelector(root, `[data-control='${controlName}']`, value);
}

function syncSelectBySelector(root: HTMLElement, selector: string, value: string): void {
  const select = root.querySelector<HTMLSelectElement>(selector);
  if (select) {
    select.value = value;
  }
}

function syncCheckbox(root: HTMLElement, controlName: string, checked: boolean): void {
  syncCheckboxBySelector(root, `[data-control='${controlName}']`, checked);
}

function syncCheckboxBySelector(root: HTMLElement, selector: string, checked: boolean): void {
  const input = root.querySelector<HTMLInputElement>(selector);
  if (input) {
    input.checked = checked;
  }
}

function syncReadout(root: HTMLElement, key: string, value: string): void {
  const element = root.querySelector<HTMLElement>(`[data-readout='${key}']`);
  if (element) {
    element.textContent = value;
  }
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(2);
}

function formatDegrees(value: number): string {
  return `${formatNumber(value)}deg`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function ensureOverlayStyles(): void {
  if (document.getElementById(styleElementId)) {
    return;
  }

  const style = document.createElement("style");
  style.id = styleElementId;
  style.textContent = `
    .chaos-rig-lab {
      position: fixed;
      top: 16px;
      right: 16px;
      bottom: 16px;
      width: min(396px, calc(100vw - 24px));
      pointer-events: none;
      z-index: 50;
      font-family: var(--font-body, Inter, sans-serif);
      color: #e2e8f0;
    }

    .chaos-rig-lab__card {
      height: 100%;
      overflow: auto;
      pointer-events: auto;
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 24px;
      background:
        linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.92));
      backdrop-filter: blur(18px);
      box-shadow: 0 22px 80px rgba(2, 6, 23, 0.44);
      padding: 18px;
    }

    .chaos-rig-lab__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }

    .chaos-rig-lab__eyebrow {
      margin: 0 0 4px;
      color: #38bdf8;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .chaos-rig-lab h1 {
      margin: 0;
      font-size: 26px;
      line-height: 1.05;
      font-family: var(--font-display, Impact, sans-serif);
    }

    .chaos-rig-lab__badge {
      flex-shrink: 0;
      border-radius: 999px;
      padding: 7px 10px;
      background: rgba(15, 118, 110, 0.16);
      color: #99f6e4;
      font-size: 11px;
      font-family: var(--font-mono, ui-monospace, monospace);
    }

    .chaos-rig-lab__copy {
      margin: 0 0 14px;
      color: #cbd5e1;
      font-size: 13px;
      line-height: 1.45;
    }

    .chaos-rig-lab details {
      margin-top: 12px;
      border: 1px solid rgba(148, 163, 184, 0.14);
      border-radius: 18px;
      background: rgba(15, 23, 42, 0.62);
      padding: 12px;
    }

    .chaos-rig-lab summary {
      cursor: pointer;
      color: #f8fafc;
      font-weight: 700;
      list-style: none;
    }

    .chaos-rig-lab summary::-webkit-details-marker {
      display: none;
    }

    .chaos-rig-lab__grid {
      margin-top: 12px;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .chaos-rig-lab__field {
      display: grid;
      gap: 6px;
      font-size: 12px;
      color: #cbd5e1;
    }

    .chaos-rig-lab__readout {
      min-height: 42px;
      display: flex;
      align-items: center;
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 12px;
      background: rgba(30, 41, 59, 0.92);
      color: #f8fafc;
      padding: 10px 12px;
      font: inherit;
    }

    .chaos-rig-lab__field select,
    .chaos-rig-lab button,
    .chaos-rig-lab input[type="range"] {
      width: 100%;
    }

    .chaos-rig-lab__field select,
    .chaos-rig-lab button {
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 12px;
      background: rgba(30, 41, 59, 0.92);
      color: #f8fafc;
      padding: 10px 12px;
      font: inherit;
    }

    .chaos-rig-lab__row {
      margin-top: 12px;
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 8px;
    }

    .chaos-rig-lab__row--export {
      grid-template-columns: minmax(0, 1fr) minmax(112px, auto);
      align-items: stretch;
    }

    .chaos-rig-lab__export-status {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      background: rgba(15, 118, 110, 0.16);
      color: #99f6e4;
      font-size: 12px;
    }

    .chaos-rig-lab button {
      cursor: pointer;
      transition: transform 140ms ease, border-color 140ms ease, background 140ms ease;
    }

    .chaos-rig-lab button:hover {
      transform: translateY(-1px);
      border-color: rgba(56, 189, 248, 0.42);
      background: rgba(37, 99, 235, 0.26);
    }

    .chaos-rig-lab button[data-active="true"] {
      border-color: rgba(125, 211, 252, 0.66);
      background: rgba(8, 47, 73, 0.92);
      color: #bae6fd;
    }

    .chaos-rig-lab__toggle {
      margin-top: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: #e2e8f0;
    }

    .chaos-rig-lab__slider {
      margin-top: 12px;
      display: grid;
      gap: 8px;
    }

    .chaos-rig-lab__slider-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-size: 12px;
      color: #cbd5e1;
    }

    .chaos-rig-lab__slider-value {
      color: #f8fafc;
      font-family: var(--font-mono, ui-monospace, monospace);
    }

    .chaos-rig-lab input[type="range"] {
      accent-color: #38bdf8;
    }

    .chaos-rig-lab select:disabled,
    .chaos-rig-lab input:disabled,
    .chaos-rig-lab button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    @media (max-width: 960px) {
      .chaos-rig-lab {
        left: 12px;
        right: 12px;
        width: auto;
      }

      .chaos-rig-lab__row {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .chaos-rig-lab__row--export {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(style);
}
