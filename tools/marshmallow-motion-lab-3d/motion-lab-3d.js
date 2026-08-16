import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* -------------------------------------------------------------------------- */
/* Konstanten                                                                  */
/* -------------------------------------------------------------------------- */

const TAU = Math.PI * 2;
const FRAME_COUNT = 16;
const THROW_HOLD_FRAME = 6;
const THROW_RELEASE_END_FRAME = 10;
const SETTINGS_KEY = "party-platform.marshmallow-3d.v1";
const PRESET_ENDPOINT = "/api/presets";
const TEXTURE_PATH = "./assets/textures";

/** Sliderbereich 0..100 wird linear auf diese Weltwerte abgebildet. */
const RANGES = {
  bodyRadius: [0.3, 1.1],
  bodyHeight: [0.4, 1.8],
  roundness: [0, 1],
  bodyLift: [0, 0.6],
  warp: [0, 1],
  footGap: [0, 0.8],
  footSize: [0.6, 1.6],
  legMotion: [0, 1],
  armHeight: [0, 1],
  armGap: [0, 1],
  armSize: [0.6, 1.6],
  toast: [0, 1],
  roastTop: [0, 1],
  roastBottom: [0, 1],
  roastEdge: [0, 1]
};

const SLIDER_KEYS = Object.keys(RANGES);

const ACCESSORIES = ["none", "helmet", "headband", "goggles"];
const ACCESSORY_LABELS = { none: "keins", helmet: "Helm", headband: "Stirnband", goggles: "Schutzbrille" };

const DEFAULT_PROFILES = {
  wide: {
    bodyRadius: 0.62, bodyHeight: 0.86, roundness: 0.3, bodyLift: 0.3, warp: 0.55,
    footGap: 0.42, footSize: 1.05, legMotion: 0.5, armHeight: 0.42, armGap: 0.58,
    armSize: 1.05, toast: 0.18, roastTop: 0.28, roastBottom: 0.45, roastEdge: 0.45,
    actionHand: "right", accessory: "none"
  },
  square: {
    bodyRadius: 0.55, bodyHeight: 1.05, roundness: 0.35, bodyLift: 0.3, warp: 0.55,
    footGap: 0.36, footSize: 1, legMotion: 0.6, armHeight: 0.5, armGap: 0.5,
    armSize: 1, toast: 0.18, roastTop: 0.3, roastBottom: 0.45, roastEdge: 0.45,
    actionHand: "right", accessory: "none"
  },
  tall: {
    bodyRadius: 0.46, bodyHeight: 1.34, roundness: 0.28, bodyLift: 0.34, warp: 0.55,
    footGap: 0.3, footSize: 0.92, legMotion: 0.6, armHeight: 0.58, armGap: 0.42,
    armSize: 0.95, toast: 0.18, roastTop: 0.32, roastBottom: 0.4, roastEdge: 0.5,
    actionHand: "right", accessory: "none"
  }
};

const CAMERA_PRESETS = {
  front: { theta: 0, phi: 1.42, distance: 4.4 },
  "three-quarter": { theta: 0.72, phi: 1.24, distance: 4.6 },
  side: { theta: Math.PI / 2, phi: 1.42, distance: 4.4 },
  top: { theta: 0.5, phi: 0.42, distance: 5.2 }
};

const STATE_ORDER = [
  "idle", "walk", "walkBack", "strafe", "jump", "longJump",
  "joy", "throw", "grenade", "shoot", "handgun"
];

/** Zustaende mit Hold/Release-Ablauf. */
const HOLD_STATES = new Set(["throw", "grenade"]);
/** Zustaende, in denen ein Klick auf die Buehne einen Rueckstoss ausloest. */
const SHOOT_STATES = new Set(["shoot", "handgun"]);
/** Welche Waffe in welchem Zustand sichtbar ist. */
const STATE_WEAPON = { grenade: "grenade", handgun: "handgun", shoot: "blaster" };

/* -------------------------------------------------------------------------- */
/* Hilfsfunktionen                                                             */
/* -------------------------------------------------------------------------- */

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => k * k * (3 - 2 * k);
const easeOut = (k) => 1 - (1 - k) * (1 - k);

function sliderToValue(key, slider) {
  const [minimum, maximum] = RANGES[key];
  return minimum + (clamp(Number(slider), 0, 100) / 100) * (maximum - minimum);
}

function valueToSlider(key, value) {
  const [minimum, maximum] = RANGES[key];
  if (maximum === minimum) return 0;
  return Math.round(clamp((Number(value) - minimum) / (maximum - minimum), 0, 1) * 100);
}

function shortestAngle(from, to) {
  let delta = (to - from) % TAU;
  if (delta > Math.PI) delta -= TAU;
  if (delta < -Math.PI) delta += TAU;
  return delta;
}

/* -------------------------------------------------------------------------- */
/* DOM                                                                         */
/* -------------------------------------------------------------------------- */

const dom = {
  viewport: document.querySelector("#viewport"),
  loadStatus: document.querySelector("#loadStatus"),
  statusDot: document.querySelector(".status-dot"),
  playPause: document.querySelector("#playPause"),
  timeline: document.querySelector("#timeline"),
  speed: document.querySelector("#speed"),
  speedValue: document.querySelector("#speedValue"),
  texture: document.querySelector("#texture"),
  ghosts: document.querySelector("#ghosts"),
  guides: document.querySelector("#guides"),
  shadows: document.querySelector("#shadows"),
  limbs: document.querySelector("#limbs"),
  autoTurn: document.querySelector("#autoTurn"),
  holdThrow: document.querySelector("#holdThrow"),
  actionStatus: document.querySelector("#actionStatus"),
  saveSettings: document.querySelector("#saveSettings"),
  exportSettings: document.querySelector("#exportSettings"),
  saveStatus: document.querySelector("#saveStatus"),
  frameReadout: document.querySelector("#frameReadout"),
  facingReadout: document.querySelector("#facingReadout"),
  heightReadout: document.querySelector("#heightReadout"),
  weaponReadout: document.querySelector("#weaponReadout"),
  accessoryReadout: document.querySelector("#accessoryReadout")
};

const sliderInputs = {};
const sliderOutputs = {};
for (const key of SLIDER_KEYS) {
  sliderInputs[key] = document.querySelector(`#${key}`);
  sliderOutputs[key] = document.querySelector(`#${key}Value`);
}

/* -------------------------------------------------------------------------- */
/* Zustand                                                                     */
/* -------------------------------------------------------------------------- */

const state = {
  animation: "idle",
  bodyVariant: "square",
  playing: true,
  frame: 0,
  fps: 16,
  facing: 0,
  targetFacing: 0,
  throwPhase: "auto",
  shotProgress: -1,
  aimPoint: new THREE.Vector3(0, 1, 3),
  aimPitch: -0.5,
  ready: false
};

const profiles = {
  wide: { ...DEFAULT_PROFILES.wide },
  square: { ...DEFAULT_PROFILES.square },
  tall: { ...DEFAULT_PROFILES.tall }
};

const profile = () => profiles[state.bodyVariant];

/* -------------------------------------------------------------------------- */
/* Texturen                                                                    */
/* -------------------------------------------------------------------------- */

const textureLoader = new THREE.TextureLoader();
let texturesReady = false;
let texturesFailed = false;

function loadTexture(file, isColor) {
  const texture = textureLoader.load(
    `${TEXTURE_PATH}/${file}`,
    () => { texturesReady = true; },
    undefined,
    () => { texturesFailed = true; }
  );
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  if (isColor) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const sourceTextures = {
  map: loadTexture("marshmallow-albedo.png", true),
  normalMap: loadTexture("marshmallow-normal.png", false),
  roughnessMap: loadTexture("marshmallow-roughness.png", false)
};

/** Fleckenmaske der Röstkante. Sie wird auch ohne aktive Textur verwendet. */
const roastMaskTexture = loadTexture("marshmallow-roast.png", false);

/** Jedes Material braucht eigene Kachelwerte, teilt sich aber das Bild im Speicher. */
function cloneTextureSet() {
  const clone = {};
  for (const [key, texture] of Object.entries(sourceTextures)) {
    const copy = texture.clone();
    copy.needsUpdate = true;
    clone[key] = copy;
  }
  return clone;
}

function setTextureRepeat(set, u, v) {
  for (const texture of Object.values(set)) texture.repeat.set(u, v);
}

/* -------------------------------------------------------------------------- */
/* Marshmallow-Geometrie                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Einheitsprofil eines Marshmallows: Zylinder mit abgerundeten Kanten.
 * Radius 1, Halbhöhe 1. `roundness` 0 = fast scharfe Kante, 1 = Kapsel.
 */
function marshmallowProfile(roundness) {
  const corner = clamp(0.08 + roundness * 0.9, 0.05, 0.995);
  const arcSteps = 8;
  const sideSteps = 5;
  const inner = Math.max(0.0005, 1 - corner);
  const points = [new THREE.Vector2(0, -1), new THREE.Vector2(inner, -1)];

  for (let index = 1; index <= arcSteps; index += 1) {
    const angle = -Math.PI / 2 + (Math.PI / 2) * (index / arcSteps);
    points.push(new THREE.Vector2(inner + corner * Math.cos(angle), -1 + corner + corner * Math.sin(angle)));
  }
  for (let index = 1; index < sideSteps; index += 1) {
    points.push(new THREE.Vector2(1, -1 + corner + (2 - 2 * corner) * (index / sideSteps)));
  }
  for (let index = 0; index <= arcSteps; index += 1) {
    const angle = (Math.PI / 2) * (index / arcSteps);
    points.push(new THREE.Vector2(inner + corner * Math.cos(angle), 1 - corner + corner * Math.sin(angle)));
  }
  points.push(new THREE.Vector2(0, 1));
  return points;
}

function buildBodyGeometry(roundness) {
  const geometry = new THREE.LatheGeometry(marshmallowProfile(roundness), 44);
  geometry.userData.base = Float32Array.from(geometry.attributes.position.array);
  return geometry;
}

/**
 * Verformt einen Punkt des Einheitskörpers in den Weltraum des Körpers.
 * Der Ursprung liegt in der Mitte der Körperunterseite, +Z zeigt nach vorne.
 */
function deformPoint(bx, by, bz, pose, activeProfile, out) {
  const radius = activeProfile.bodyRadius;
  const half = activeProfile.bodyHeight * 0.5;
  const u = clamp((by + 1) * 0.5, 0, 1);
  const stretch = 1 + pose.squash;
  const lateral = 1 / Math.sqrt(Math.max(0.25, stretch));
  const bulge = 1 + Math.max(0, -pose.squash) * 0.55 * Math.sin(Math.PI * u);

  let x = bx * radius * lateral * bulge;
  let z = bz * radius * lateral * bulge;
  const y = (by + 1) * half * stretch;

  const lean = pose.bend * u * u * half * 1.6;
  x += pose.bendX * lean;
  z += pose.bendZ * lean;

  const twist = pose.twist * (u - 0.3);
  const cos = Math.cos(twist);
  const sin = Math.sin(twist);
  return out.set(x * cos - z * sin, y, x * sin + z * cos);
}

/* -------------------------------------------------------------------------- */
/* Waffen                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Alle Waffenmodelle zeigen entlang +Z. Sie sind bewusst grob gehalten und
 * bestehen nur aus Grundkoerpern, damit sie ohne externe Assets auskommen.
 */
function createWeaponModels() {
  const crust = new THREE.MeshStandardMaterial({ color: "#8a5734", roughness: 0.62, metalness: 0.12 });
  const metal = new THREE.MeshStandardMaterial({ color: "#4b443a", roughness: 0.42, metalness: 0.55 });
  const accent = new THREE.MeshStandardMaterial({ color: "#e2a45f", roughness: 0.48, metalness: 0.2 });
  const sugar = new THREE.MeshStandardMaterial({ color: "#f2e3c6", roughness: 0.9, metalness: 0 });

  const part = (geometry, material, position, rotation) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position[0], position[1], position[2]);
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    mesh.castShadow = true;
    return mesh;
  };

  // Marshmallow-Granate: gerösteter Klumpen mit Bügel und Ring.
  const grenade = new THREE.Group();
  const grenadeBody = part(new THREE.SphereGeometry(0.075, 20, 14), sugar, [0, 0, 0]);
  grenadeBody.scale.set(1, 1.16, 1);
  grenade.add(grenadeBody);
  grenade.add(part(new THREE.TorusGeometry(0.066, 0.013, 8, 24), crust, [0, 0, 0], [Math.PI / 2, 0, 0]));
  grenade.add(part(new THREE.CylinderGeometry(0.028, 0.032, 0.03, 12), metal, [0, 0.09, 0]));
  grenade.add(part(new THREE.BoxGeometry(0.014, 0.085, 0.013), metal, [0.052, 0.035, 0], [0, 0, 0.16]));
  grenade.add(part(new THREE.TorusGeometry(0.022, 0.006, 8, 16), accent, [-0.03, 0.105, 0], [Math.PI / 2, 0, 0]));

  // Einhändige Handfeuerwaffe.
  const handgun = new THREE.Group();
  handgun.add(part(new THREE.BoxGeometry(0.046, 0.056, 0.2), metal, [0, 0.01, 0.05]));
  handgun.add(part(new THREE.BoxGeometry(0.05, 0.014, 0.1), accent, [0, 0.042, 0.06]));
  handgun.add(part(new THREE.CylinderGeometry(0.015, 0.015, 0.06, 12), metal, [0, 0.005, 0.17], [Math.PI / 2, 0, 0]));
  handgun.add(part(new THREE.BoxGeometry(0.042, 0.115, 0.052), crust, [0, -0.075, -0.028], [-0.26, 0, 0]));
  handgun.add(part(new THREE.TorusGeometry(0.026, 0.007, 8, 16), metal, [0, -0.036, 0.012], [0, Math.PI / 2, 0]));

  // Zweihand-Blaster mit zwei getrennten Griffpunkten.
  const blaster = new THREE.Group();
  blaster.add(part(new THREE.BoxGeometry(0.072, 0.092, 0.34), metal, [0, 0.01, 0.02]));
  blaster.add(part(new THREE.BoxGeometry(0.078, 0.016, 0.16), accent, [0, 0.058, 0.04]));
  blaster.add(part(new THREE.CylinderGeometry(0.023, 0.027, 0.16, 14), metal, [0, 0.005, 0.26], [Math.PI / 2, 0, 0]));
  blaster.add(part(new THREE.ConeGeometry(0.042, 0.06, 14), accent, [0, 0.005, 0.36], [Math.PI / 2, 0, 0]));
  blaster.add(part(new THREE.BoxGeometry(0.052, 0.072, 0.12), crust, [0, -0.005, -0.2]));
  blaster.add(part(new THREE.BoxGeometry(0.036, 0.092, 0.042), crust, [0, -0.082, 0.12], [-0.12, 0, 0]));
  blaster.add(part(new THREE.BoxGeometry(0.042, 0.1, 0.046), crust, [0, -0.085, -0.06], [-0.22, 0, 0]));
  blaster.add(part(new THREE.CylinderGeometry(0.029, 0.029, 0.075, 12), accent, [0, 0.062, -0.03], [0, 0, Math.PI / 2]));

  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(1, 12, 8),
    new THREE.MeshBasicMaterial({ color: "#ffd9a0", transparent: true, opacity: 0.9 })
  );
  flash.visible = false;

  return { grenade, handgun, blaster, flash, materials: [crust, metal, accent, sugar] };
}

/* -------------------------------------------------------------------------- */
/* Accessoires                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Alle Accessoires werden mit Einheitsradius 1 in der XZ-Ebene gebaut und zur
 * Laufzeit auf den tatsaechlichen, bereits verformten Koerperradius skaliert.
 * Dadurch sitzen sie bei jeder Koerperform und in jeder Stauchung richtig.
 */
function createAccessoryModels() {
  const shell = new THREE.MeshStandardMaterial({ color: "#6d4a2e", roughness: 0.55, metalness: 0.18 });
  const trim = new THREE.MeshStandardMaterial({ color: "#e2a45f", roughness: 0.45, metalness: 0.25 });
  const strap = new THREE.MeshStandardMaterial({ color: "#3b332a", roughness: 0.8, metalness: 0.05 });
  const cloth = new THREE.MeshStandardMaterial({ color: "#c2452f", roughness: 0.88, metalness: 0 });
  const glass = new THREE.MeshStandardMaterial({
    color: "#8fd0e0", roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.55
  });

  const part = (geometry, material, position, rotation, scale) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position[0], position[1], position[2]);
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    return mesh;
  };

  // Helm: Kuppel, Krempe, Kinnriemen und ein kleiner Kamm.
  const helmet = new THREE.Group();
  const dome = part(
    new THREE.SphereGeometry(1, 26, 16, 0, TAU, 0, Math.PI * 0.52), shell, [0, 0, 0]
  );
  helmet.add(dome);
  helmet.add(part(new THREE.TorusGeometry(1.02, 0.09, 8, 30), trim, [0, 0.02, 0], [Math.PI / 2, 0, 0]));
  helmet.add(part(new THREE.TorusGeometry(1.0, 0.045, 6, 28), strap, [0, -0.16, 0], [Math.PI / 2, 0, 0]));
  helmet.add(part(new THREE.BoxGeometry(0.12, 0.3, 1.5), trim, [0, 0.62, 0]));
  helmet.userData.dome = dome;

  // Stirnband: umlaufendes Band mit Knoten und zwei flatternden Enden.
  const headband = new THREE.Group();
  headband.add(part(new THREE.TorusGeometry(1.01, 0.12, 10, 32), cloth, [0, 0, 0], [Math.PI / 2, 0, 0]));
  headband.add(part(new THREE.SphereGeometry(0.19, 12, 10), cloth, [0, 0.02, -1.02]));
  headband.add(part(new THREE.BoxGeometry(0.09, 0.5, 0.05), cloth, [0.14, -0.24, -1.06], [0.5, 0, 0.22]));
  headband.add(part(new THREE.BoxGeometry(0.09, 0.62, 0.05), cloth, [-0.15, -0.3, -1.05], [0.62, 0, -0.18]));

  // Schutzbrille: zwei Ringe mit Glas plus umlaufendes Halteband.
  const goggles = new THREE.Group();
  const lenses = [];
  for (let index = 0; index < 2; index += 1) {
    const lens = new THREE.Group();
    lens.add(part(new THREE.TorusGeometry(1, 0.22, 10, 24), strap, [0, 0, 0]));
    lens.add(part(new THREE.CircleGeometry(1, 24), glass, [0, 0, 0.02]));
    goggles.add(lens);
    lenses.push(lens);
  }
  const goggleStrap = part(new THREE.TorusGeometry(1, 0.075, 8, 30), strap, [0, 0, 0], [Math.PI / 2, 0, 0]);
  goggles.add(goggleStrap);
  goggles.userData.lenses = lenses;
  goggles.userData.strap = goggleStrap;

  return { helmet, headband, goggles };
}

/* -------------------------------------------------------------------------- */
/* Rig                                                                         */
/* -------------------------------------------------------------------------- */

const TOAST_TEXTURED = new THREE.Color("#fffcf6");
const TOAST_PLAIN = new THREE.Color("#fbf1de");
const TOAST_DARK = new THREE.Color("#a5622b");

function createRig(options = {}) {
  const ghost = Boolean(options.ghost);
  const opacity = options.opacity ?? 1;

  const bodyTextures = cloneTextureSet();
  const limbTextures = cloneTextureSet();
  setTextureRepeat(limbTextures, 2, 1);

  const skinMaterial = new THREE.MeshStandardMaterial({
    color: TOAST_PLAIN.clone(),
    roughness: 0.94,
    metalness: 0,
    // Marshmallows sind leicht durchscheinend; ein Hauch Eigenleuchten
    // verhindert, dass die Schattenseite tot wirkt.
    emissive: new THREE.Color("#41301f"),
    emissiveIntensity: 0.1,
    transparent: ghost,
    opacity,
    depthWrite: !ghost
  });

  // Haende und Fuesse sind eigene Materialien statt Klone: onBeforeCompile
  // wird von Material.clone() nicht uebernommen, und die Roestung soll hier
  // ohnehin nur als einfacher Farbton ankommen.
  const handMaterial = new THREE.MeshStandardMaterial({
    color: TOAST_PLAIN.clone(), roughness: 0.94, metalness: 0,
    emissive: new THREE.Color("#41301f"), emissiveIntensity: 0.1,
    transparent: ghost, opacity, depthWrite: !ghost
  });
  const footMaterial = handMaterial.clone();

  // Röstung: ein Höhenverlauf über den Körper, dessen Kante von der
  // Fleckenmaske lokal verschoben wird. Dadurch franst der Übergang
  // unregelmäßig aus, statt als sauberer Ring um den Körper zu laufen.
  const roastUniforms = {
    uRoastMask: { value: roastMaskTexture },
    uRoastRepeat: { value: new THREE.Vector2(1, 1) },
    uBodyTop: { value: 1 },
    uRoastTop: { value: 0 },
    uRoastBottom: { value: 0 },
    uRoastEdge: { value: 0.45 },
    uRoastColor: { value: new THREE.Color("#bd7833") },
    uCharColor: { value: new THREE.Color("#3a2211") }
  };

  skinMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, roastUniforms);

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uBodyTop;
        uniform vec2 uRoastRepeat;
        varying float vRoastHeight;
        varying vec2 vRoastUv;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vRoastHeight = transformed.y / max(uBodyTop, 0.0001);
        vRoastUv = uv * uRoastRepeat;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform sampler2D uRoastMask;
        uniform float uRoastTop;
        uniform float uRoastBottom;
        uniform float uRoastEdge;
        uniform vec3 uRoastColor;
        uniform vec3 uCharColor;
        varying float vRoastHeight;
        varying vec2 vRoastUv;`
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        {
          float blotch = texture2D(uRoastMask, vRoastUv).r;
          // uRoastEdge 0 = weicher Verlauf, 1 = harte Kante.
          float edge = mix(0.30, 0.02, uRoastEdge);
          float height = clamp(vRoastHeight, 0.0, 1.0) + (blotch - 0.5) * edge * 1.8;

          // Die Grenze muss ueber das Koerperende hinauslaufen, sonst bliebe bei
          // Regler 1.0 ein Rest ungeroestet: die Kante ist "edge" breit und die
          // Maske verschiebt sie um bis zu 0.9 * edge. "span" deckt beides ab.
          float span = 1.0 + edge * 2.0;

          float topLine = 1.0 - uRoastTop * span;
          float topFactor = smoothstep(topLine - edge, topLine + edge, height)
                          * smoothstep(0.0, 0.05, uRoastTop);

          float bottomLine = uRoastBottom * span;
          float bottomFactor = (1.0 - smoothstep(bottomLine - edge, bottomLine + edge, height))
                             * smoothstep(0.0, 0.05, uRoastBottom);

          // Wenig Roestung = goldbraun, viel Roestung = verkohlt.
          vec3 topTint = mix(uRoastColor, uCharColor, smoothstep(0.5, 1.0, uRoastTop));
          vec3 bottomTint = mix(uRoastColor, uCharColor, smoothstep(0.5, 1.0, uRoastBottom));

          diffuseColor.rgb = mix(diffuseColor.rgb, topTint,
            clamp(topFactor * (0.4 + 0.6 * uRoastTop), 0.0, 1.0));
          diffuseColor.rgb = mix(diffuseColor.rgb, bottomTint,
            clamp(bottomFactor * (0.4 + 0.6 * uRoastBottom), 0.0, 1.0));
        }`
      );
  };
  // Ohne eigenen Cache-Key wuerde three das Programm mit anderen
  // MeshStandardMaterials teilen und die Injektion verwerfen.
  skinMaterial.customProgramCacheKey = () => "marshmallow-roast";
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#fdfaf3"), roughness: 0.35, transparent: ghost, opacity, depthWrite: !ghost
  });
  const pupilMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#231a12"), roughness: 0.4, transparent: ghost, opacity, depthWrite: !ghost
  });

  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  let bodyGeometry = buildBodyGeometry(0.35);
  const bodyMesh = new THREE.Mesh(bodyGeometry, skinMaterial);
  bodyMesh.castShadow = !ghost;
  bodyMesh.receiveShadow = !ghost;
  bodyGroup.add(bodyMesh);

  const sphere = new THREE.SphereGeometry(1, 24, 18);

  function makeBlob(material) {
    const mesh = new THREE.Mesh(sphere, material);
    mesh.castShadow = !ghost;
    mesh.receiveShadow = !ghost;
    return mesh;
  }

  const hands = [makeBlob(handMaterial), makeBlob(handMaterial)];
  const feet = [makeBlob(footMaterial), makeBlob(footMaterial)];
  for (const hand of hands) bodyGroup.add(hand);
  for (const foot of feet) root.add(foot);

  const faceGroup = new THREE.Group();
  bodyGroup.add(faceGroup);

  const eyes = [];
  for (let index = 0; index < 2; index += 1) {
    const eyeGroup = new THREE.Group();
    const white = new THREE.Mesh(sphere, eyeMaterial);
    const pupil = new THREE.Mesh(sphere, pupilMaterial);
    eyeGroup.add(white);
    eyeGroup.add(pupil);
    faceGroup.add(eyeGroup);
    eyes.push({ group: eyeGroup, white, pupil });
  }

  const mouth = new THREE.Mesh(sphere, pupilMaterial);
  faceGroup.add(mouth);

  // Waffen haengen in derselben Gruppe wie die Haende und teilen deren Raum.
  const weapons = ghost ? null : createWeaponModels();
  if (weapons) {
    for (const name of ["grenade", "handgun", "blaster"]) {
      weapons[name].visible = false;
      bodyGroup.add(weapons[name]);
    }
    bodyGroup.add(weapons.flash);
  }

  // Accessoires haengen wie Haende und Gesicht in der Koerpergruppe.
  const accessories = createAccessoryModels();
  for (const model of Object.values(accessories)) {
    model.visible = false;
    bodyGroup.add(model);
  }
  let accessoryName = "none";

  const scratch = new THREE.Vector3();
  const eyeAnchors = [
    { x: Math.sin(0.42), y: 0.34, z: Math.cos(0.42) },
    { x: -Math.sin(0.42), y: 0.34, z: Math.cos(0.42) }
  ];
  const mouthAnchor = { x: 0, y: -0.06, z: 1 };
  const handPositions = [new THREE.Vector3(), new THREE.Vector3()];
  const eyePositions = [new THREE.Vector3(), new THREE.Vector3()];

  const UP = new THREE.Vector3(0, 1, 0);
  const FORWARD = new THREE.Vector3(0, 0, 1);
  const axisPoint = new THREE.Vector3();
  const rimPoint = new THREE.Vector3();
  const upperPoint = new THREE.Vector3();
  const upDirection = new THREE.Vector3();
  const outward = new THREE.Vector3();
  const alignQuaternion = new THREE.Quaternion();

  /** Tatsaechlicher Radius des verformten Koerpers auf Einheitshoehe `unitY`. */
  function deformedRadius(unitY, pose, activeProfile) {
    deformPoint(0, unitY, 0, pose, activeProfile, axisPoint);
    deformPoint(1, unitY, 0, pose, activeProfile, rimPoint);
    return Math.max(0.01, axisPoint.distanceTo(rimPoint));
  }

  /**
   * Ausrichtung an der verformten Koerperachse. Weil Beugung und Torsion nur
   * in den Vertices stecken, muss die Aufwaertsrichtung aus zwei Punkten der
   * Achse zurueckgerechnet werden - sonst wuerde der Helm gerade stehen,
   * waehrend sich der Koerper neigt.
   */
  function alignToBodyAxis(unitY, pose, activeProfile, target) {
    deformPoint(0, unitY, 0, pose, activeProfile, axisPoint);
    deformPoint(0, Math.min(1, unitY + 0.3), 0, pose, activeProfile, upperPoint);
    upDirection.copy(upperPoint).sub(axisPoint);
    if (upDirection.lengthSq() < 1e-8) upDirection.copy(UP);
    upDirection.normalize();
    target.position.copy(axisPoint);
    target.quaternion.setFromUnitVectors(UP, upDirection);
  }

  function rebuildBody(roundness) {
    const next = buildBodyGeometry(roundness);
    bodyMesh.geometry = next;
    bodyGeometry.dispose();
    bodyGeometry = next;
  }

  /** Wendet eine Pose auf das Rig an. `aimLocal` ist die Blickrichtung im Körperraum. */
  function apply(pose, activeProfile, aimLocal) {
    const positions = bodyGeometry.attributes.position;
    const base = bodyGeometry.userData.base;
    for (let index = 0; index < positions.count; index += 1) {
      const offset = index * 3;
      deformPoint(base[offset], base[offset + 1], base[offset + 2], pose, activeProfile, scratch);
      positions.setXYZ(index, scratch.x, scratch.y, scratch.z);
    }
    positions.needsUpdate = true;
    bodyGeometry.computeVertexNormals();
    bodyGeometry.computeBoundingSphere();

    // Kachelung an die Koerpergroesse koppeln, damit das Zuckerkorn bei jeder
    // Koerperform gleich gross bleibt.
    const repeatU = Math.max(1, Math.round(activeProfile.bodyRadius * 6));
    const repeatV = Math.max(1, Math.round(activeProfile.bodyHeight * 2.4));
    setTextureRepeat(bodyTextures, repeatU, repeatV);
    // Die Roestflecken laufen gröber als das Zuckerkorn, sonst wird die Kante
    // zu kleinteilig und wirkt wie Rauschen statt wie Flammenzungen.
    roastUniforms.uRoastRepeat.value.set(Math.max(1, repeatU * 0.5), Math.max(1, repeatV * 0.5));
    // Bezugshoehe fuer den Roestverlauf ist die aktuell gestauchte Koerperhoehe,
    // damit die Roestkante beim Stauchen am Koerper klebt statt zu wandern.
    roastUniforms.uBodyTop.value = activeProfile.bodyHeight * (1 + pose.squash);

    bodyGroup.position.set(pose.bodyX, activeProfile.bodyLift + pose.bodyY, pose.bodyZ);

    const handRadius = 0.15 * activeProfile.armSize;
    const shoulderU = lerp(0.25, 0.95, activeProfile.armHeight);
    const armSpread = 1 + activeProfile.armGap * 0.85;

    for (let index = 0; index < 2; index += 1) {
      const side = index === 0 ? 1 : -1;
      deformPoint(side * armSpread, shoulderU * 2 - 1, 0.28, pose, activeProfile, scratch);
      const hand = hands[index];
      const offset = pose.hands[index];
      hand.position.set(scratch.x + offset.x, scratch.y + offset.y, scratch.z + offset.z);
      hand.scale.setScalar(handRadius);
      hand.scale.y *= 0.94;
      handPositions[index].copy(hand.position);
    }

    const footRadius = 0.17 * activeProfile.footSize;
    for (let index = 0; index < 2; index += 1) {
      const side = index === 0 ? 1 : -1;
      const offset = pose.feet[index];
      const foot = feet[index];
      foot.position.set(
        side * activeProfile.footGap * 0.5 + offset.x + pose.bodyX * 0.25,
        footRadius * 0.72 + offset.y,
        offset.z
      );
      foot.scale.set(footRadius * 0.94, footRadius * 0.72, footRadius * 1.35);
      foot.rotation.set(offset.rx, 0, 0);
    }

    const eyeRadius = clamp(activeProfile.bodyRadius * 0.24, 0.06, 0.2);
    for (let index = 0; index < 2; index += 1) {
      const anchor = eyeAnchors[index];
      deformPoint(anchor.x, anchor.y, anchor.z, pose, activeProfile, scratch);
      outward.set(scratch.x, 0, scratch.z);
      if (outward.lengthSq() > 1e-6) outward.normalize().multiplyScalar(eyeRadius * 0.42);
      const eye = eyes[index];
      eye.group.position.set(scratch.x + outward.x, scratch.y, scratch.z + outward.z);
      eyePositions[index].copy(eye.group.position);
      eye.white.scale.set(eyeRadius, eyeRadius * 1.05, eyeRadius * 0.72);
      eye.pupil.scale.setScalar(eyeRadius * 0.46);
      eye.pupil.position.set(
        clamp(aimLocal.x, -1, 1) * eyeRadius * 0.34,
        clamp(aimLocal.y, -1, 1) * eyeRadius * 0.34,
        eyeRadius * 0.52
      );
    }

    deformPoint(mouthAnchor.x, mouthAnchor.y, mouthAnchor.z, pose, activeProfile, scratch);
    mouth.position.set(scratch.x, scratch.y, scratch.z + eyeRadius * 0.1);
    mouth.scale.set(eyeRadius * 0.52, eyeRadius * 0.4, eyeRadius * 0.3);

    updateAccessory(pose, activeProfile, eyeRadius);
  }

  /** Setzt das aktive Accessoire auf den bereits verformten Körper. */
  function updateAccessory(pose, activeProfile, eyeRadius) {
    if (accessoryName === "helmet") {
      const helmet = accessories.helmet;
      // Sitzhöhe des Helmrandes und Radius genau dort.
      const brimY = 0.55;
      const radius = deformedRadius(brimY, pose, activeProfile);
      alignToBodyAxis(brimY, pose, activeProfile, helmet);
      helmet.scale.setScalar(radius);
      // Die Kuppel wird so gestreckt, dass sie den Scheitel gerade überdeckt.
      // Der Clamp ist reiner Schutz gegen entartete Werte: über den ganzen
      // Reglerbereich liegt das Verhältnis zwischen 0.05 (breit und flach)
      // und 2.13 (schmal und hoch), bei den Standardprofilen bei 0.21 bis 1.03.
      deformPoint(0, 1, 0, pose, activeProfile, scratch);
      const rise = Math.max(0.01, scratch.distanceTo(helmet.position));
      helmet.userData.dome.scale.set(1.08, clamp((rise / radius) * 1.12, 0.12, 2.4), 1.08);
      return;
    }

    if (accessoryName === "headband") {
      const bandY = 0.46;
      const radius = deformedRadius(bandY, pose, activeProfile);
      alignToBodyAxis(bandY, pose, activeProfile, accessories.headband);
      accessories.headband.scale.setScalar(radius);
      return;
    }

    if (accessoryName === "goggles") {
      const goggles = accessories.goggles;
      goggles.position.set(0, 0, 0);
      goggles.quaternion.identity();
      goggles.scale.setScalar(1);

      const lensRadius = eyeRadius * 1.24;
      for (let index = 0; index < 2; index += 1) {
        const lens = goggles.userData.lenses[index];
        lens.position.copy(eyePositions[index]);
        lens.scale.setScalar(lensRadius);
        // Ringe schauen entlang der radialen Richtung nach außen.
        outward.set(eyePositions[index].x, 0, eyePositions[index].z);
        if (outward.lengthSq() < 1e-8) outward.copy(FORWARD);
        outward.normalize();
        lens.quaternion.setFromUnitVectors(FORWARD, outward);
        lens.position.addScaledVector(outward, lensRadius * 0.16);
      }

      const strapY = eyeAnchors[0].y;
      const radius = deformedRadius(strapY, pose, activeProfile);
      alignToBodyAxis(strapY, pose, activeProfile, goggles.userData.strap);
      goggles.userData.strap.scale.setScalar(radius * 1.01);
    }
  }

  function setAccessory(name) {
    accessoryName = ACCESSORIES.includes(name) ? name : "none";
    for (const [key, model] of Object.entries(accessories)) {
      model.visible = key === accessoryName;
    }
  }

  /**
   * Setzt Waffe, Ausrichtung und Mündungsblitz.
   * Einhandwaffen sitzen in der Aktionshand, die Zweihandwaffe genau
   * zwischen beiden Händen - wie im 2D-Lab aus dem Mittelwert der Handpunkte.
   */
  function applyWeapon(name, activeProfile, actionIndex, pitch, flashStrength) {
    if (!weapons) return;
    for (const key of ["grenade", "handgun", "blaster"]) weapons[key].visible = key === name;
    weapons.flash.visible = false;
    if (!name) return;

    const model = weapons[name];
    const scale = clamp(activeProfile.armSize * (0.8 + activeProfile.bodyRadius * 0.35), 0.5, 2);
    model.scale.setScalar(scale);
    model.rotation.set(pitch, 0, 0);

    if (name === "blaster") {
      model.position.copy(handPositions[0]).add(handPositions[1]).multiplyScalar(0.5);
    } else {
      model.position.copy(handPositions[actionIndex]);
    }

    if (flashStrength > 0 && name !== "grenade") {
      const reach = name === "blaster" ? 0.42 : 0.22;
      weapons.flash.visible = true;
      weapons.flash.position.set(
        model.position.x,
        model.position.y + Math.sin(pitch) * -reach * scale,
        model.position.z + Math.cos(pitch) * reach * scale
      );
      weapons.flash.scale.setScalar(0.05 * scale * flashStrength);
      weapons.flash.material.opacity = 0.9 * flashStrength;
    }
  }

  /**
   * `toast` ist die gleichmäßige Grundröstung des ganzen Körpers,
   * `roastTop` und `roastBottom` die lokal begrenzte Röstung an den Enden.
   */
  function setRoast(activeProfile, textured) {
    const base = textured ? TOAST_TEXTURED : TOAST_PLAIN;
    const color = base.clone().lerp(TOAST_DARK, clamp(activeProfile.toast, 0, 1));
    skinMaterial.color.copy(color);
    handMaterial.color.copy(color).multiplyScalar(0.96);

    roastUniforms.uRoastTop.value = clamp(activeProfile.roastTop, 0, 1);
    roastUniforms.uRoastBottom.value = clamp(activeProfile.roastBottom, 0, 1);
    roastUniforms.uRoastEdge.value = clamp(activeProfile.roastEdge, 0, 1);

    // Die Füße stehen unten und sollen die untere Röstung mittragen,
    // sonst wirken sie bei dunklem Körperfuß wie fremde Objekte.
    const bottom = clamp(activeProfile.roastBottom, 0, 1);
    const footTint = roastUniforms.uRoastColor.value.clone()
      .lerp(roastUniforms.uCharColor.value, clamp((bottom - 0.5) * 2, 0, 1));
    footMaterial.color.copy(color).lerp(footTint, bottom * 0.7);
  }

  function setTextured(enabled) {
    for (const [material, set] of [[skinMaterial, bodyTextures], [handMaterial, limbTextures], [footMaterial, limbTextures]]) {
      material.map = enabled ? set.map : null;
      material.normalMap = enabled ? set.normalMap : null;
      material.roughnessMap = enabled ? set.roughnessMap : null;
      material.normalScale.set(0.7, 0.7);
      material.needsUpdate = true;
    }
  }

  function setLimbsVisible(visible) {
    for (const hand of hands) hand.visible = visible;
    for (const foot of feet) foot.visible = visible;
  }

  function setShadows(enabled) {
    bodyMesh.castShadow = enabled && !ghost;
    for (const hand of hands) hand.castShadow = enabled && !ghost;
    for (const foot of feet) foot.castShadow = enabled && !ghost;
  }

  return {
    root, apply, applyWeapon, rebuildBody, setRoast, setAccessory,
    setTextured, setLimbsVisible, setShadows
  };
}

/* -------------------------------------------------------------------------- */
/* Posen                                                                       */
/* -------------------------------------------------------------------------- */

function createPose() {
  return {
    squash: 0, bend: 0, bendX: 0, bendZ: 1, twist: 0,
    bodyX: 0, bodyY: 0, bodyZ: 0,
    hands: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }],
    feet: [{ x: 0, y: 0, z: 0, rx: 0 }, { x: 0, y: 0, z: 0, rx: 0 }]
  };
}

function resetPose(pose) {
  pose.squash = 0; pose.bend = 0; pose.bendX = 0; pose.bendZ = 1; pose.twist = 0;
  pose.bodyX = 0; pose.bodyY = 0; pose.bodyZ = 0;
  for (let index = 0; index < 2; index += 1) {
    pose.hands[index].x = 0; pose.hands[index].y = 0; pose.hands[index].z = 0;
    pose.feet[index].x = 0; pose.feet[index].y = 0; pose.feet[index].z = 0; pose.feet[index].rx = 0;
  }
}

function poseIdle(pose, t, activeProfile) {
  const warp = activeProfile.warp;
  const angle = t * TAU;
  pose.squash = Math.sin(angle) * 0.075 * warp;
  pose.bodyY = Math.sin(angle) * -0.018;
  pose.bend = Math.sin(angle + 1.2) * 0.05 * warp;
  pose.twist = Math.sin(angle * 0.5) * 0.06;
  for (let index = 0; index < 2; index += 1) {
    const side = index === 0 ? 1 : -1;
    pose.hands[index].y = Math.sin(angle + 0.7) * 0.04;
    pose.hands[index].x = side * Math.sin(angle + 0.7) * 0.012;
    pose.feet[index].y = Math.max(0, Math.sin(angle + side * 0.4) * 0.012);
  }
}

/** Schrittzyklus. `direction` +1 laeuft vorwaerts, -1 rueckwaerts. */
function poseWalk(pose, t, activeProfile, direction) {
  const warp = activeProfile.warp;
  const motion = 0.25 + activeProfile.legMotion * 0.85;
  const angle = t * TAU;

  pose.bodyY = -Math.abs(Math.cos(angle)) * 0.055 * motion;
  pose.bodyX = Math.sin(angle) * 0.05 * motion;
  pose.squash = -Math.cos(2 * angle) * 0.09 * warp;
  // Rueckwaerts lehnt sich die Figur zurueck statt nach vorne.
  pose.bend = (0.14 + Math.sin(2 * angle) * 0.04) * direction;
  pose.twist = Math.sin(angle) * 0.16 * motion * direction;

  for (let index = 0; index < 2; index += 1) {
    const side = index === 0 ? 1 : -1;
    const footPhase = angle + (index === 0 ? 0 : Math.PI);
    const swing = Math.sin(footPhase);
    const lift = Math.max(0, swing);
    pose.feet[index].z = swing * 0.34 * motion * direction;
    pose.feet[index].y = lift * 0.2 * motion;
    pose.feet[index].x = -side * lift * 0.02;
    pose.feet[index].rx = -swing * 0.4 * motion * direction;

    const handPhase = angle + (index === 0 ? Math.PI : 0);
    pose.hands[index].z = Math.sin(handPhase) * 0.24 * motion * direction;
    pose.hands[index].y = -Math.abs(Math.sin(handPhase)) * 0.05 * motion;
    pose.hands[index].x = side * Math.abs(Math.sin(handPhase)) * 0.03;
  }
}

/** Seitwaerts-Schritt: die Fuesse wandern auf der X-Achse statt auf Z. */
function poseStrafe(pose, t, activeProfile) {
  const warp = activeProfile.warp;
  const motion = 0.25 + activeProfile.legMotion * 0.85;
  const angle = t * TAU;

  pose.bodyY = -Math.abs(Math.cos(angle)) * 0.05 * motion;
  pose.bodyX = Math.sin(angle) * 0.07 * motion;
  pose.squash = -Math.cos(2 * angle) * 0.08 * warp;
  // Seitliche Neigung statt Vorbeugen.
  pose.bendX = 1;
  pose.bendZ = 0;
  pose.bend = Math.sin(angle) * 0.16 * motion;
  pose.twist = Math.sin(angle) * 0.07;

  for (let index = 0; index < 2; index += 1) {
    const side = index === 0 ? 1 : -1;
    const footPhase = angle + (index === 0 ? 0 : Math.PI);
    const swing = Math.sin(footPhase);
    pose.feet[index].x = swing * 0.26 * motion;
    pose.feet[index].y = Math.max(0, swing) * 0.16 * motion;
    pose.feet[index].z = -side * Math.abs(swing) * 0.03;
    pose.feet[index].rx = 0;

    pose.hands[index].x = -swing * 0.12 * motion;
    pose.hands[index].y = -Math.abs(swing) * 0.04 * motion;
    pose.hands[index].z = Math.abs(swing) * 0.05 * motion;
  }
}

/**
 * Sprungablauf in fuenf Abschnitten. Jeder Abschnitt beginnt exakt beim
 * Endwert des vorherigen, damit keine Spruenge in Stauchung oder Hoehe entstehen.
 * `flat` senkt den Bogen ab und schaltet die horizontale Bewegung zu (Weitsprung).
 */
function poseJumpLike(pose, t, activeProfile, flat) {
  const warp = 0.45 + activeProfile.warp * 0.55;
  const motion = 0.4 + activeProfile.legMotion * 0.6;
  const height = flat ? 0.52 : 0.92;
  const forward = flat ? 0.85 : 0;

  let squash = 0;
  let bodyY = 0;
  let bodyZ = 0;
  let tuck = 0;
  let handY = 0;
  let handZ = 0;
  let bend = 0;
  let reachOut = 0;

  if (t < 0.2) {
    const k = ease(t / 0.2);
    squash = -0.3 * k; bodyY = -0.24 * k; handY = -0.12 * k; handZ = -0.14 * k;
    bend = 0.12 * k; bodyZ = -0.08 * forward * k;
  } else if (t < 0.32) {
    const k = easeOut((t - 0.2) / 0.12);
    squash = -0.3 + 0.64 * k; bodyY = -0.24 + 0.62 * k; handY = -0.12 + 0.58 * k;
    handZ = -0.14 + 0.2 * k; bend = 0.12 - 0.16 * k;
    bodyZ = lerp(-0.08 * forward, 0.1 * forward, k);
  } else if (t < 0.72) {
    const k = (t - 0.32) / 0.4;
    const arc = Math.sin(Math.PI * k);
    bodyY = 0.38 + arc * height;
    // Streckung beim Absprung und beim schnellen Fall, neutral im Scheitelpunkt.
    squash = 0.34 * Math.abs(Math.cos(Math.PI * k));
    handY = 0.46 + arc * 0.1; handZ = 0.06; tuck = arc * 0.3;
    bend = flat ? 0.1 : -0.04;
    bodyZ = lerp(0.1 * forward, forward, k);
    reachOut = flat ? ease(clamp((k - 0.55) / 0.45, 0, 1)) : 0;
  } else if (t < 0.86) {
    const k = ease((t - 0.72) / 0.14);
    bodyY = lerp(0.38, -0.26, k);
    squash = lerp(0.34, -0.38, k);
    handY = lerp(0.46, -0.12, k);
    handZ = lerp(0.06, -0.1, k);
    bend = lerp(flat ? 0.1 : -0.04, 0.16, k);
    bodyZ = forward;
    reachOut = flat ? 1 - k * 0.6 : 0;
  } else {
    const k = ease((t - 0.86) / 0.14);
    bodyY = -0.26 * (1 - k);
    squash = -0.38 * (1 - k) * (1 - k);
    handY = -0.12 * (1 - k);
    handZ = -0.1 * (1 - k);
    bend = 0.16 * (1 - k);
    // Der Weitsprung gleitet in der Erholung zum Ursprung zurueck, damit der
    // 16-Frame-Zyklus geschlossen bleibt.
    bodyZ = forward * (1 - k);
    reachOut = flat ? 0.4 * (1 - k) : 0;
  }

  pose.squash = squash * warp;
  pose.bodyY = bodyY;
  pose.bodyZ = bodyZ;
  pose.bend = bend;

  for (let index = 0; index < 2; index += 1) {
    const side = index === 0 ? 1 : -1;
    pose.hands[index].y = handY;
    pose.hands[index].z = handZ - reachOut * 0.1;
    pose.hands[index].x = side * handY * 0.12;
    pose.feet[index].y = Math.max(0, bodyY * 0.92 + tuck * motion);
    pose.feet[index].z = side * 0.03 + tuck * 0.22 + reachOut * 0.3 * motion;
    pose.feet[index].rx = -tuck * 0.9;
  }
}

/** Freude: zwei Hopser pro Zyklus mit erhobenen Haenden. */
function poseJoy(pose, t, activeProfile) {
  const warp = 0.5 + activeProfile.warp * 0.5;
  const motion = 0.4 + activeProfile.legMotion * 0.6;
  const angle = t * TAU;
  // Zwei Hopser: der Betrag der Sinuswelle liefert zwei Bögen pro Zyklus.
  const hop = Math.abs(Math.sin(angle));
  const airborne = Math.sin(angle * 2 - Math.PI / 2);

  pose.bodyY = hop * 0.26;
  pose.squash = (hop * 0.3 - 0.14) * warp;
  pose.twist = Math.sin(angle * 2) * 0.16;
  pose.bend = -0.06 - hop * 0.05;
  pose.bodyX = Math.sin(angle * 2) * 0.03;

  for (let index = 0; index < 2; index += 1) {
    const side = index === 0 ? 1 : -1;
    pose.hands[index].y = 0.42 + hop * 0.22;
    pose.hands[index].x = side * (0.1 + hop * 0.08);
    pose.hands[index].z = -0.04 + Math.sin(angle * 2 + side) * 0.05;
    pose.feet[index].y = Math.max(0, hop * 0.24 * motion - 0.02);
    pose.feet[index].z = side * Math.sin(angle * 2) * 0.05 * motion;
    pose.feet[index].rx = -airborne * 0.25 * motion;
  }
}

/**
 * Wurfablauf. `deep` schaltet auf den Granatenwurf um: weiter hinten ausholen,
 * kuerzerer Vorwaertshub und eine eigene, weiche Nachschwingphase.
 */
function poseThrowLike(pose, t, activeProfile, actionIndex, deep) {
  const warp = activeProfile.warp;
  const windDepth = deep ? 1.25 : 1;
  const punch = deep ? 0.45 : 0.85;
  let reach = 0;
  let lift = 0;

  if (t < 0.375) {
    const k = ease(t / 0.375);
    reach = -windDepth * k;
    lift = 0.45 * k;
  } else if (t < 0.625) {
    const k = easeOut((t - 0.375) / 0.25);
    reach = lerp(-windDepth, punch, k);
    lift = lerp(0.45, -0.13, k);
  } else {
    const k = ease((t - 0.625) / 0.375);
    reach = punch * (1 - k);
    lift = -0.13 * (1 - k);
  }

  const other = actionIndex === 0 ? 1 : 0;
  const actionSide = actionIndex === 0 ? 1 : -1;

  pose.twist = -reach * 0.45 * actionSide;
  pose.bend = reach * 0.3;
  pose.squash = -Math.abs(reach) * 0.09 * warp;
  pose.bodyY = -Math.abs(reach) * 0.035;
  pose.bodyZ = reach * 0.04;

  pose.hands[actionIndex].z = reach * 0.58;
  pose.hands[actionIndex].y = lift * 0.6;
  pose.hands[actionIndex].x = actionSide * -reach * 0.14;
  pose.hands[other].z = -reach * 0.16;
  pose.hands[other].y = lift * 0.14;
  pose.hands[other].x = -actionSide * reach * 0.06;

  pose.feet[actionIndex].z = -reach * 0.14;
  pose.feet[other].z = reach * 0.12;
  pose.feet[actionIndex].y = Math.max(0, -reach * 0.03);
}

/**
 * Zielen mit Waffe. `twoHand` fuehrt beide Haende zusammen nach vorne,
 * sonst zielt nur die Aktionshand. `recoil` 0..1 treibt den Rueckstoss.
 */
function poseAim(pose, t, activeProfile, actionIndex, twoHand, recoil) {
  const warp = activeProfile.warp;
  const angle = t * TAU;
  const breath = Math.sin(angle) * 0.012;
  const kick = recoil > 0 ? Math.sin(recoil * Math.PI) : 0;

  pose.squash = breath * 1.6 * warp - kick * 0.06;
  pose.bodyY = breath * -0.4;
  // Der Rueckstoss schiebt den Koerper entgegen der Blickrichtung.
  pose.bodyZ = -kick * 0.09;
  pose.bend = 0.08 - kick * 0.14;

  const other = actionIndex === 0 ? 1 : 0;
  const actionSide = actionIndex === 0 ? 1 : -1;

  const aimHand = pose.hands[actionIndex];
  aimHand.z = 0.4 + breath - kick * 0.16;
  aimHand.y = 0.12 + breath + kick * 0.1;
  aimHand.x = actionSide * -0.1;

  const freeHand = pose.hands[other];
  if (twoHand) {
    // Zweite Hand stuetzt weiter vorne am Lauf.
    freeHand.z = 0.26 + breath - kick * 0.1;
    freeHand.y = 0.12 + breath + kick * 0.05;
    freeHand.x = actionSide * 0.04;
    pose.twist = actionSide * 0.1;
  } else {
    freeHand.z = -0.06;
    freeHand.y = -0.04 + breath;
    freeHand.x = -actionSide * 0.06;
    pose.twist = actionSide * 0.22;
  }

  pose.feet[actionIndex].z = -0.1 - kick * 0.05;
  pose.feet[other].z = 0.1;
  pose.feet[other].y = Math.max(0, kick * 0.02);
}

function buildPose(pose, animation, t, activeProfile, actionIndex, recoil = 0) {
  resetPose(pose);
  switch (animation) {
    case "walk": poseWalk(pose, t, activeProfile, 1); break;
    case "walkBack": poseWalk(pose, t, activeProfile, -1); break;
    case "strafe": poseStrafe(pose, t, activeProfile); break;
    case "jump": poseJumpLike(pose, t, activeProfile, false); break;
    case "longJump": poseJumpLike(pose, t, activeProfile, true); break;
    case "joy": poseJoy(pose, t, activeProfile); break;
    case "throw": poseThrowLike(pose, t, activeProfile, actionIndex, false); break;
    case "grenade": poseThrowLike(pose, t, activeProfile, actionIndex, true); break;
    case "shoot": poseAim(pose, t, activeProfile, actionIndex, true, recoil); break;
    case "handgun": poseAim(pose, t, activeProfile, actionIndex, false, recoil); break;
    default: poseIdle(pose, t, activeProfile);
  }
  return pose;
}

/* -------------------------------------------------------------------------- */
/* Szene                                                                       */
/* -------------------------------------------------------------------------- */

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
} catch (error) {
  dom.viewport.innerHTML = '<p class="stage-error">WebGL steht in diesem Browser nicht zur Verfügung.</p>';
  dom.loadStatus.textContent = "WebGL fehlt";
  throw error;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
dom.viewport.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#101211");
scene.fog = new THREE.Fog("#101211", 9, 22);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(3, 2.4, 3.6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.6;
controls.maxDistance = 12;
controls.maxPolarAngle = Math.PI * 0.495;
controls.target.set(0, 0.8, 0);

const hemisphere = new THREE.HemisphereLight("#cfd8e4", "#2a2118", 0.65);
scene.add(hemisphere);

const keyLight = new THREE.DirectionalLight("#fff0d6", 2.1);
keyLight.position.set(3.4, 5.2, 3.2);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 16;
keyLight.shadow.camera.left = -4;
keyLight.shadow.camera.right = 4;
keyLight.shadow.camera.top = 4;
keyLight.shadow.camera.bottom = -4;
keyLight.shadow.bias = -0.0012;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight("#e2a45f", 0.85);
rimLight.position.set(-3.6, 2.2, -3.4);
scene.add(rimLight);

const fillLight = new THREE.PointLight("#8fb4d6", 12, 14, 2);
fillLight.position.set(-2, 1.4, 3);
scene.add(fillLight);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(9, 64),
  new THREE.MeshStandardMaterial({ color: "#1a1c1a", roughness: 1, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(14, 28, "#4a4136", "#2a2b28");
grid.position.y = 0.002;
grid.material.transparent = true;
grid.material.opacity = 0.55;
scene.add(grid);

const aimMarker = new THREE.Mesh(
  new THREE.RingGeometry(0.11, 0.15, 32),
  new THREE.MeshBasicMaterial({ color: "#d7a45e", transparent: true, opacity: 0.65, side: THREE.DoubleSide })
);
aimMarker.rotation.x = -Math.PI / 2;
aimMarker.position.y = 0.004;
scene.add(aimMarker);

const rig = createRig();
scene.add(rig.root);

const ghostRigs = [
  createRig({ ghost: true, opacity: 0.16 }),
  createRig({ ghost: true, opacity: 0.16 })
];
for (const ghost of ghostRigs) {
  ghost.root.visible = false;
  scene.add(ghost.root);
}

const allRigs = [rig, ...ghostRigs];

const pose = createPose();
const ghostPoses = [createPose(), createPose()];
const aimLocal = new THREE.Vector2(0, 0);

/* -------------------------------------------------------------------------- */
/* Zielen und Schuss                                                           */
/* -------------------------------------------------------------------------- */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hitPoint = new THREE.Vector3();
let pointerDragging = false;
let pointerDownAt = 0;
const pointerDownPosition = { x: 0, y: 0 };

function updateAimFromEvent(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  if (!raycaster.ray.intersectPlane(groundPlane, hitPoint)) return;
  if (hitPoint.lengthSq() < 0.04) return;
  state.aimPoint.copy(hitPoint);
}

renderer.domElement.addEventListener("pointerdown", (event) => {
  pointerDragging = true;
  pointerDownAt = performance.now();
  pointerDownPosition.x = event.clientX;
  pointerDownPosition.y = event.clientY;
});

window.addEventListener("pointerup", (event) => {
  if (!pointerDragging) return;
  pointerDragging = false;
  // Ein kurzer Klick ohne nennenswerte Bewegung ist ein Schuss, alles
  // andere war eine Kamerafahrt.
  const moved = Math.hypot(event.clientX - pointerDownPosition.x, event.clientY - pointerDownPosition.y);
  if (moved < 5 && performance.now() - pointerDownAt < 350 && SHOOT_STATES.has(state.animation)) {
    updateAimFromEvent(event);
    state.shotProgress = 0;
  }
});

renderer.domElement.addEventListener("pointermove", (event) => {
  if (pointerDragging) return;
  updateAimFromEvent(event);
});

/* -------------------------------------------------------------------------- */
/* Resize                                                                      */
/* -------------------------------------------------------------------------- */

function resize() {
  const width = dom.viewport.clientWidth || 1;
  const height = dom.viewport.clientHeight || 1;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

if (typeof ResizeObserver === "function") {
  new ResizeObserver(resize).observe(dom.viewport);
} else {
  window.addEventListener("resize", resize);
}
resize();

/* -------------------------------------------------------------------------- */
/* Kamera-Presets                                                              */
/* -------------------------------------------------------------------------- */

function applyCameraPreset(name) {
  const preset = CAMERA_PRESETS[name] ?? CAMERA_PRESETS["three-quarter"];
  const active = profile();
  const focus = active.bodyLift + active.bodyHeight * 0.55;
  controls.target.set(0, focus, 0);
  const radius = preset.distance * lerp(0.85, 1.2, clamp(active.bodyHeight / 1.8, 0, 1));
  camera.position.set(
    Math.sin(preset.theta) * Math.sin(preset.phi) * radius,
    focus + Math.cos(preset.phi) * radius,
    Math.cos(preset.theta) * Math.sin(preset.phi) * radius
  );
  controls.update();
}

/* -------------------------------------------------------------------------- */
/* UI                                                                          */
/* -------------------------------------------------------------------------- */

const PERCENT_KEYS = new Set([
  "roundness", "warp", "legMotion", "toast", "armHeight", "footSize", "armSize",
  "roastTop", "roastBottom", "roastEdge"
]);

function formatSliderOutput(key, value) {
  return PERCENT_KEYS.has(key) ? `${Math.round(value * 100)}%` : value.toFixed(2);
}

function syncSlidersFromProfile() {
  const active = profile();
  for (const key of SLIDER_KEYS) {
    const input = sliderInputs[key];
    if (!input) continue;
    input.value = String(valueToSlider(key, active[key]));
    if (sliderOutputs[key]) sliderOutputs[key].textContent = formatSliderOutput(key, active[key]);
  }
  for (const button of document.querySelectorAll(".hand-button")) {
    button.classList.toggle("is-active", button.dataset.hand === active.actionHand);
  }
  for (const button of document.querySelectorAll(".body-button")) {
    button.classList.toggle("is-active", button.dataset.body === state.bodyVariant);
  }
  for (const button of document.querySelectorAll(".accessory-button")) {
    button.classList.toggle("is-active", button.dataset.accessory === active.accessory);
  }
  for (const target of allRigs) {
    target.rebuildBody(active.roundness);
    target.setRoast(active, dom.texture.checked);
    target.setAccessory(active.accessory);
  }
}

for (const key of SLIDER_KEYS) {
  const input = sliderInputs[key];
  if (!input) continue;
  input.addEventListener("input", () => {
    const active = profile();
    active[key] = sliderToValue(key, input.value);
    if (sliderOutputs[key]) sliderOutputs[key].textContent = formatSliderOutput(key, active[key]);
    if (key === "roundness") {
      for (const target of allRigs) target.rebuildBody(active.roundness);
    }
    if (key === "toast" || key === "roastTop" || key === "roastBottom" || key === "roastEdge") {
      for (const target of allRigs) target.setRoast(active, dom.texture.checked);
    }
    dom.saveStatus.textContent = "Geändert – noch nicht gespeichert";
  });
}

dom.speed.addEventListener("input", () => {
  state.fps = Number(dom.speed.value);
  dom.speedValue.textContent = `${state.fps} fps`;
});

for (const button of document.querySelectorAll(".state-button")) {
  button.addEventListener("click", () => setAnimation(button.dataset.state));
}

for (const button of document.querySelectorAll(".body-button")) {
  button.addEventListener("click", () => {
    state.bodyVariant = button.dataset.body;
    syncSlidersFromProfile();
    dom.saveStatus.textContent = `Profil ${button.textContent} geladen`;
  });
}

for (const button of document.querySelectorAll(".camera-button")) {
  button.addEventListener("click", () => {
    for (const other of document.querySelectorAll(".camera-button")) {
      other.classList.toggle("is-active", other === button);
    }
    applyCameraPreset(button.dataset.camera);
  });
}

for (const button of document.querySelectorAll(".hand-button")) {
  button.addEventListener("click", () => {
    profile().actionHand = button.dataset.hand === "left" ? "left" : "right";
    for (const other of document.querySelectorAll(".hand-button")) {
      other.classList.toggle("is-active", other === button);
    }
  });
}

dom.playPause.addEventListener("click", () => setPlaying(!state.playing));

dom.timeline.addEventListener("input", () => {
  state.frame = Number(dom.timeline.value);
  setPlaying(false);
});

dom.texture.addEventListener("change", () => {
  const active = profile();
  for (const target of allRigs) {
    target.setTextured(dom.texture.checked);
    target.setRoast(active, dom.texture.checked);
  }
});

for (const button of document.querySelectorAll(".accessory-button")) {
  button.addEventListener("click", () => {
    const active = profile();
    active.accessory = ACCESSORIES.includes(button.dataset.accessory) ? button.dataset.accessory : "none";
    for (const other of document.querySelectorAll(".accessory-button")) {
      other.classList.toggle("is-active", other === button);
    }
    for (const target of allRigs) target.setAccessory(active.accessory);
    dom.saveStatus.textContent = "Geändert – noch nicht gespeichert";
  });
}

dom.ghosts.addEventListener("change", () => {
  for (const ghost of ghostRigs) ghost.root.visible = dom.ghosts.checked;
});

dom.guides.addEventListener("change", () => {
  grid.visible = dom.guides.checked;
  aimMarker.visible = dom.guides.checked;
});

// Nur die castShadow-Flags der Meshes umschalten: renderer.shadowMap.enabled oder
// light.castShadow zur Laufzeit zu aendern erzwingt eine Shader-Neuuebersetzung.
dom.shadows.addEventListener("change", () => {
  rig.setShadows(dom.shadows.checked);
});

dom.limbs.addEventListener("change", () => {
  for (const target of allRigs) target.setLimbsVisible(dom.limbs.checked);
});

dom.holdThrow.addEventListener("pointerdown", () => {
  if (!HOLD_STATES.has(state.animation)) return;
  state.throwPhase = "hold";
  state.frame = THROW_HOLD_FRAME;
  setPlaying(true);
  dom.actionStatus.textContent = "Ausholen gehalten";
});

const releaseThrow = () => {
  if (state.throwPhase !== "hold") return;
  state.throwPhase = "release";
  dom.actionStatus.textContent = "Release läuft";
};
dom.holdThrow.addEventListener("pointerup", releaseThrow);
dom.holdThrow.addEventListener("pointerleave", releaseThrow);

window.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement && event.target.type === "range" && event.key !== " ") return;
  if (event.key === " ") {
    event.preventDefault();
    setPlaying(!state.playing);
    return;
  }
  if (event.key === "ArrowRight") {
    setPlaying(false);
    state.frame = (state.frame + 1) % FRAME_COUNT;
    return;
  }
  if (event.key === "ArrowLeft") {
    setPlaying(false);
    state.frame = (state.frame + FRAME_COUNT - 1) % FRAME_COUNT;
    return;
  }
  if (event.key.toLowerCase() === "r") {
    applyCameraPreset(document.querySelector(".camera-button.is-active")?.dataset.camera ?? "three-quarter");
    return;
  }
  const index = Number(event.key) - 1;
  if (Number.isInteger(index) && index >= 0 && index < 9 && index < STATE_ORDER.length) {
    setAnimation(STATE_ORDER[index]);
  }
});

function setAnimation(name) {
  if (!STATE_ORDER.includes(name)) return;
  state.animation = name;
  state.throwPhase = "auto";
  state.shotProgress = -1;
  document.body.dataset.animation = name;
  for (const button of document.querySelectorAll(".state-button")) {
    button.classList.toggle("is-active", button.dataset.state === name);
  }
  dom.actionStatus.textContent = HOLD_STATES.has(name) ? "Bereit zum Ausholen" : "Bereit";
}

function setPlaying(playing) {
  state.playing = playing;
  dom.playPause.textContent = playing ? "Pause" : "Play";
  dom.playPause.setAttribute("aria-label", playing ? "Animation pausieren" : "Animation abspielen");
}

/* -------------------------------------------------------------------------- */
/* Presets                                                                     */
/* -------------------------------------------------------------------------- */

function sanitizeIncoming(variant, value) {
  const merged = { ...DEFAULT_PROFILES[variant] };
  if (value && typeof value === "object") {
    for (const key of SLIDER_KEYS) {
      const number = Number(value[key]);
      if (Number.isFinite(number)) merged[key] = clamp(number, RANGES[key][0], RANGES[key][1]);
    }
    merged.actionHand = value.actionHand === "left" ? "left" : "right";
    // Aeltere Presets kennen `accessory` noch nicht; dann bleibt der Standard stehen.
    if (ACCESSORIES.includes(value.accessory)) merged.accessory = value.accessory;
  }
  return merged;
}

function loadLocalProfiles() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    for (const variant of ["wide", "square", "tall"]) {
      profiles[variant] = sanitizeIncoming(variant, parsed?.profiles?.[variant]);
    }
    return true;
  } catch {
    return false;
  }
}

function storeLocalProfiles() {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ profiles }));
  } catch {
    /* localStorage kann gesperrt sein */
  }
}

async function loadProjectPresets() {
  try {
    const response = await fetch(PRESET_ENDPOINT, { cache: "no-store" });
    if (!response.ok) return false;
    const payload = await response.json();
    for (const variant of ["wide", "square", "tall"]) {
      profiles[variant] = sanitizeIncoming(variant, payload?.profiles?.[variant]);
    }
    return true;
  } catch {
    return false;
  }
}

async function writeProjectPresets(payload, label) {
  try {
    const response = await fetch(PRESET_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    dom.saveStatus.textContent = response.ok ? `${label} → ${result.path}` : `Fehler: ${result.error}`;
  } catch {
    dom.saveStatus.textContent = `${label} nur lokal gespeichert (kein Server)`;
  }
}

dom.saveSettings.addEventListener("click", async () => {
  storeLocalProfiles();
  await writeProjectPresets({ profiles: { [state.bodyVariant]: profile() } }, "Profil gespeichert");
});

dom.exportSettings.addEventListener("click", async () => {
  storeLocalProfiles();
  await writeProjectPresets({ profiles }, "Alle Profile geschrieben");
});

/* -------------------------------------------------------------------------- */
/* Schleife                                                                    */
/* -------------------------------------------------------------------------- */

const SHOT_DURATION = 0.22;
let lastTime = performance.now();
let frameAccumulator = 0;

function advanceFrame() {
  if (HOLD_STATES.has(state.animation) && state.throwPhase === "hold" && state.frame >= THROW_HOLD_FRAME) {
    state.frame = THROW_HOLD_FRAME;
    return;
  }
  state.frame = (state.frame + 1) % FRAME_COUNT;
  if (HOLD_STATES.has(state.animation) && state.throwPhase === "release" && state.frame >= THROW_RELEASE_END_FRAME) {
    state.throwPhase = "auto";
    dom.actionStatus.textContent = "Bereit zum Ausholen";
  }
}

function updateFacing(delta) {
  const dx = state.aimPoint.x;
  const dz = state.aimPoint.z;
  if (dom.autoTurn.checked && (dx * dx + dz * dz) > 0.01) {
    state.targetFacing = Math.atan2(dx, dz);
  }
  const step = clamp(delta * 7.5, 0, 1);
  state.facing += shortestAngle(state.facing, state.targetFacing) * step;
}

function applyRig(target, targetPose, frameValue, recoil) {
  const active = profile();
  const t = (frameValue % FRAME_COUNT) / FRAME_COUNT;
  const actionIndex = active.actionHand === "left" ? 0 : 1;
  buildPose(targetPose, state.animation, t, active, actionIndex, recoil);
  target.apply(targetPose, active, aimLocal);
  return actionIndex;
}

function render(now) {
  const delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  if (state.playing) {
    frameAccumulator += delta * state.fps;
    while (frameAccumulator >= 1) {
      frameAccumulator -= 1;
      advanceFrame();
    }
  }
  dom.timeline.value = String(state.frame);

  if (state.shotProgress >= 0) {
    state.shotProgress += delta / SHOT_DURATION;
    if (state.shotProgress >= 1) state.shotProgress = -1;
  }
  const recoil = state.shotProgress >= 0 ? state.shotProgress : 0;

  updateFacing(delta);
  for (const target of allRigs) target.root.rotation.y = state.facing;

  const active = profile();
  // Ziel in den Koerperraum drehen (Rotation um -facing). Solange der Koerper der
  // Drehung nachlaeuft, zeigen die Pupillen bereits zum Ziel und fuehren die Wendung an.
  const cosFacing = Math.cos(state.facing);
  const sinFacing = Math.sin(state.facing);
  const localX = state.aimPoint.x * cosFacing - state.aimPoint.z * sinFacing;
  const groundDistance = Math.hypot(state.aimPoint.x, state.aimPoint.z);
  const eyeHeight = active.bodyLift + active.bodyHeight * 0.82;
  // Nahes Ziel = Blick nach unten, entferntes Ziel = Blick waagerecht.
  state.aimPitch = Math.atan2(-eyeHeight, Math.max(0.25, groundDistance));
  aimLocal.set(
    clamp(localX / Math.max(0.3, groundDistance), -1, 1),
    clamp((state.aimPitch + 0.55) * 2, -1, 1)
  );

  aimMarker.position.x = state.aimPoint.x;
  aimMarker.position.z = state.aimPoint.z;

  const actionIndex = applyRig(rig, pose, state.frame, recoil);
  const weapon = STATE_WEAPON[state.animation] ?? null;
  // Der Blitz erscheint nur im ersten Drittel des Rueckstosses.
  const flash = recoil > 0 ? Math.max(0, 1 - recoil * 3) : 0;
  rig.applyWeapon(weapon, active, actionIndex, state.aimPitch, flash);

  if (dom.ghosts.checked) {
    applyRig(ghostRigs[0], ghostPoses[0], (state.frame + FRAME_COUNT - 2) % FRAME_COUNT, recoil);
    applyRig(ghostRigs[1], ghostPoses[1], (state.frame + 2) % FRAME_COUNT, recoil);
  }

  dom.frameReadout.textContent = `${String(state.frame + 1).padStart(2, "0")} / ${FRAME_COUNT}`;
  dom.facingReadout.textContent = `${Math.round((state.facing * 180) / Math.PI)}°`;
  dom.heightReadout.textContent = `${(active.bodyLift + active.bodyHeight).toFixed(2)} u`;
  dom.weaponReadout.textContent = weapon
    ? { grenade: "Granate", handgun: "Pistole", blaster: "Blaster 2H" }[weapon]
    : "keine";
  dom.accessoryReadout.textContent = ACCESSORY_LABELS[active.accessory] ?? "keins";

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

/* -------------------------------------------------------------------------- */
/* Start                                                                       */
/* -------------------------------------------------------------------------- */

async function boot() {
  const fromProject = await loadProjectPresets();
  const fromLocal = fromProject ? false : loadLocalProfiles();

  for (const target of allRigs) target.setTextured(dom.texture.checked);
  syncSlidersFromProfile();
  applyCameraPreset("three-quarter");
  for (const target of allRigs) target.setLimbsVisible(dom.limbs.checked);
  state.fps = Number(dom.speed.value);
  state.ready = true;

  const source = fromProject ? "Projektpresets" : fromLocal ? "Lokale Presets" : "Standardprofile";
  dom.loadStatus.textContent = `${source} geladen`;
  dom.statusDot.style.background = "#8ecf9b";

  // Texturen laden asynchron nach; ein Fehlschlag darf das Rig nicht blockieren.
  window.setTimeout(() => {
    if (texturesFailed) {
      dom.loadStatus.textContent = `${source} · Texturen fehlen, prepare_textures.py ausführen`;
      dom.statusDot.style.background = "#d7a45e";
    } else if (texturesReady) {
      dom.loadStatus.textContent = `${source} · Texturen bereit`;
    }
  }, 1200);

  requestAnimationFrame(render);
}

boot();
