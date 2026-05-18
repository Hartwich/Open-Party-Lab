import type { PlayerInput } from "@open-party-lab/game-core";

export type ChaosKommandoWeaponId =
  | "kicher-bazooka"
  | "enten-granate"
  | "plunder-pistole"
  | "regenbogen-rakete"
  | "splitter-granate"
  | "konfetti-schrot"
  | "bohrer-rakete"
  | "gummi-huhn"
  | "seifenblasen-bombe"
  | "keks-moerser";

export type ChaosKommandoMercenaryRole =
  | "sprinter"
  | "grenadier"
  | "chaos-schuetze";

export type ChaosKommandoWeaponFireMode = "charged" | "instant";
export type ChaosKommandoExplosionSourceId = ChaosKommandoWeaponId | "abschieds-bumm";

export interface ChaosKommandoMoveInput extends PlayerInput {
  type: "move";
  moveX: number;
  moveY: number;
}

export interface ChaosKommandoAimInput extends PlayerInput {
  type: "aim";
  aimX: number;
  aimY: number;
}

export interface ChaosKommandoJumpInput extends PlayerInput {
  type: "jump";
}

export interface ChaosKommandoSelectMercenaryInput extends PlayerInput {
  type: "select-mercenary";
  mercenaryId: string;
}

export interface ChaosKommandoSelectWeaponInput extends PlayerInput {
  type: "select-weapon";
  weaponId: ChaosKommandoWeaponId;
}

export interface ChaosKommandoFireStartInput extends PlayerInput {
  type: "fire:start";
}

export interface ChaosKommandoFireReleaseInput extends PlayerInput {
  type: "fire:release";
}

export type ChaosKommandoInput =
  | ChaosKommandoMoveInput
  | ChaosKommandoAimInput
  | ChaosKommandoJumpInput
  | ChaosKommandoSelectMercenaryInput
  | ChaosKommandoSelectWeaponInput
  | ChaosKommandoFireStartInput
  | ChaosKommandoFireReleaseInput;

export interface ChaosKommandoWeaponDefinition {
  id: ChaosKommandoWeaponId;
  displayName: string;
  description: string;
  iconPath: string;
  accentColor: string;
  fireMode: ChaosKommandoWeaponFireMode;
  damage: number;
  blastRadius: number;
  projectileSpeed: number;
  gravityScale: number;
  fuseMs: number | null;
  craterDepth: number;
}

export interface ChaosKommandoMercenaryState {
  id: string;
  name: string;
  role: ChaosKommandoMercenaryRole;
  playerId: string;
  playerName: string;
  teamColor: string;
  accentColor: string;
  spritePath: string;
  portraitPath: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  grounded: boolean;
  facing: "left" | "right";
  aimAngleRad: number;
  ammo: Record<ChaosKommandoWeaponId, number>;
}

export interface ChaosKommandoPlayerState {
  playerId: string;
  name: string;
  color: string;
  mercenaries: ChaosKommandoMercenaryState[];
  aliveMercenaryCount: number;
  eliminated: boolean;
}

export interface ChaosKommandoProjectileState {
  id: string;
  weaponId: ChaosKommandoWeaponId;
  ownerPlayerId: string;
  ownerMercenaryId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  ageMs: number;
  fuseMs: number | null;
  armed: boolean;
}

export interface ChaosKommandoExplosionState {
  id: string;
  sourceWeaponId: ChaosKommandoExplosionSourceId;
  x: number;
  y: number;
  radius: number;
  color: string;
  createdAt: number;
}

export interface ChaosKommandoGravestoneState {
  id: string;
  mercenaryId: string;
  playerId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  grounded: boolean;
}

export interface ChaosKommandoTurnState {
  turnNumber: number;
  currentPlayerId: string;
  activeMercenaryId: string;
  currentWeaponId: ChaosKommandoWeaponId;
  turnEndsAt: number;
  hasFired: boolean;
  resolvingShot: boolean;
  chargeStartedAt: number | null;
  chargeRatio: number;
  settleEndsAt: number | null;
  crosshairX: number;
  crosshairY: number;
  crosshairDistance: number;
}

export interface ChaosKommandoTerrainState {
  mapId: string;
  mapName: string;
  width: number;
  height: number;
  waterlineY: number;
  sampleSpacing: number;
  samples: number[];
}

export interface ChaosKommandoWindState {
  strength: number;
  direction: -1 | 1;
  label: string;
}

export interface ChaosKommandoState {
  terrain: ChaosKommandoTerrainState;
  players: ChaosKommandoPlayerState[];
  turn: ChaosKommandoTurnState;
  weapons: ChaosKommandoWeaponDefinition[];
  projectiles: ChaosKommandoProjectileState[];
  explosions: ChaosKommandoExplosionState[];
  gravestones: ChaosKommandoGravestoneState[];
  wind: ChaosKommandoWindState;
  winnerPlayerId?: string;
  winnerName?: string;
  isDraw: boolean;
  cameraFocusX: number;
  cameraFocusY: number;
  actionLog: string[];
}
