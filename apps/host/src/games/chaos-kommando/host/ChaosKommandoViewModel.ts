import Phaser from "phaser";
import type {
  ChaosKommandoMercenaryRole,
  ChaosKommandoMercenaryState,
  ChaosKommandoPlayerState,
  ChaosKommandoState,
  ChaosKommandoWeaponDefinition,
  ChaosKommandoWeaponId
} from "@open-party-lab/protocol";

export interface ChaosKommandoSelection {
  player: ChaosKommandoPlayerState | null;
  mercenary: ChaosKommandoMercenaryState | null;
  weapon: ChaosKommandoWeaponDefinition | null;
}

export interface ChaosKommandoPoint {
  x: number;
  y: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function toColorNumber(color: string | undefined, fallback = 0xffffff): number {
  if (!color) {
    return fallback;
  }

  const parsed = Phaser.Display.Color.HexStringToColor(color);
  return parsed.color || fallback;
}

export function hashString(input: string): number {
  let hash = 2_166_136_261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
}

export function resolveHealthRatio(hp: number, maxHp: number): number {
  if (maxHp <= 0) {
    return 0;
  }

  return clamp(hp / maxHp, 0, 1);
}

export function collectMercenaries(state: ChaosKommandoState): ChaosKommandoMercenaryState[] {
  return state.players.flatMap((player) => player.mercenaries);
}

export function collectAliveMercenaries(state: ChaosKommandoState): ChaosKommandoMercenaryState[] {
  return collectMercenaries(state).filter((mercenary) => mercenary.alive);
}

export function findPlayer(
  state: ChaosKommandoState,
  playerId: string
): ChaosKommandoPlayerState | null {
  return state.players.find((player) => player.playerId === playerId) ?? null;
}

export function findMercenary(
  state: ChaosKommandoState,
  mercenaryId: string
): ChaosKommandoMercenaryState | null {
  for (const player of state.players) {
    const mercenary = player.mercenaries.find((entry) => entry.id === mercenaryId);

    if (mercenary) {
      return mercenary;
    }
  }

  return null;
}

export function findWeapon(
  state: ChaosKommandoState,
  weaponId: ChaosKommandoWeaponId
): ChaosKommandoWeaponDefinition | null {
  return state.weapons.find((weapon) => weapon.id === weaponId) ?? null;
}

export function resolveSelection(state: ChaosKommandoState): ChaosKommandoSelection {
  return {
    player: findPlayer(state, state.turn.currentPlayerId),
    mercenary: findMercenary(state, state.turn.activeMercenaryId),
    weapon: findWeapon(state, state.turn.currentWeaponId)
  };
}

export function resolveDisplayMercenaryRadius(mercenary: ChaosKommandoMercenaryState): number {
  return Math.max(mercenary.radius, 25);
}

export function resolveChargeRatio(state: ChaosKommandoState): number {
  return clamp(state.turn.chargeRatio, 0, 1);
}

export function resolveCrosshairPoint(state: ChaosKommandoState): ChaosKommandoPoint | null {
  const mercenary = findMercenary(state, state.turn.activeMercenaryId);

  if (!mercenary) {
    return null;
  }

  const distance = Math.max(42, state.turn.crosshairDistance || 126);
  const fallbackX = mercenary.x + Math.cos(mercenary.aimAngleRad) * distance;
  const fallbackY = mercenary.y + Math.sin(mercenary.aimAngleRad) * distance;
  const crosshairX = Number.isFinite(state.turn.crosshairX) ? state.turn.crosshairX : fallbackX;
  const crosshairY = Number.isFinite(state.turn.crosshairY) ? state.turn.crosshairY : fallbackY;

  return {
    x: clamp(crosshairX, 0, state.terrain.width),
    y: clamp(crosshairY, 0, state.terrain.height)
  };
}

export function resolveTurnRemainingMs(state: ChaosKommandoState, nowMs: number): number {
  return Math.max(0, state.turn.turnEndsAt - nowMs);
}

export function formatRole(role: ChaosKommandoMercenaryRole): string {
  switch (role) {
    case "sprinter":
      return "Sprinter";
    case "grenadier":
      return "Grenadier";
    case "chaos-schuetze":
      return "Chaos-Schuetze";
    default:
      return role;
  }
}

export function formatShortWeaponName(
  weapon: ChaosKommandoWeaponDefinition | null,
  fallbackId?: ChaosKommandoWeaponId
): string {
  if (weapon) {
    return weapon.displayName;
  }

  switch (fallbackId) {
    case "kicher-bazooka":
      return "Kicher-Bazooka";
    case "enten-granate":
      return "Enten-Granate";
    case "plunder-pistole":
      return "Plunder-Pistole";
    case "regenbogen-rakete":
      return "Regenbogen-Rakete";
    default:
      return "Waffe";
  }
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function buildRosterSignature(state: ChaosKommandoState): string {
  return state.players
    .map((player) =>
      [
        player.playerId,
        player.aliveMercenaryCount,
        player.eliminated ? 1 : 0,
        ...player.mercenaries.map((mercenary) =>
          [
            mercenary.id,
            mercenary.hp,
            mercenary.alive ? 1 : 0,
            mercenary.x.toFixed(1),
            mercenary.y.toFixed(1),
            mercenary.ammo[state.turn.currentWeaponId] ?? 0
          ].join(":")
        )
      ].join("|")
    )
    .join("||");
}

export function buildActionLogSignature(state: ChaosKommandoState): string {
  return state.actionLog.join("||");
}
