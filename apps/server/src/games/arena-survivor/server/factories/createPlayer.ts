import type { GamePlayerSummary } from "@open-party-lab/game-core";
import type { ArenaSurvivorLoadoutState } from "@open-party-lab/protocol";
import type {
  ArenaSurvivorPlayerCarryState,
  ArenaSurvivorRuntimePlayerState
} from "../arenaSurvivorState.js";
import { arenaSurvivorPlayerDefinition } from "../definitions/playerDefinitions.js";
import {
  createArenaSurvivorStarterLoadout,
  createArenaSurvivorWeaponRuntimeStates,
  resolveArenaSurvivorCharacter,
  resolveArenaSurvivorPlayerStats
} from "../loadout/arenaSurvivorLoadout.js";
import {
  cloneLoadout,
  createEmptyRunSummary,
  cloneRunSummary,
  createEmptyRunStats,
  createEmptyShopState
} from "../arenaSurvivorState.js";

export interface ArenaSurvivorSpawnPoint {
  x: number;
  y: number;
  facingAngleRad?: number;
}

export function createArenaSurvivorPlayer(
  player: GamePlayerSummary,
  spawnPoint: ArenaSurvivorSpawnPoint,
  now: number,
  carry?: ArenaSurvivorPlayerCarryState,
  loadout: ArenaSurvivorLoadoutState = carry?.loadout ?? createArenaSurvivorStarterLoadout(carry?.characterId),
  characterId?: string,
  playerIndex = 0
): ArenaSurvivorRuntimePlayerState {
  const character = resolveArenaSurvivorCharacter(characterId ?? carry?.characterId, playerIndex);
  const playerStats = resolveArenaSurvivorPlayerStats(loadout, character.id);

  return {
    playerId: player.id,
    name: player.name,
    color: player.color,
    character,
    x: spawnPoint.x,
    y: spawnPoint.y,
    vx: 0,
    vy: 0,
    radius: arenaSurvivorPlayerDefinition.radius,
    moveSpeed: playerStats.moveSpeed,
    hp: playerStats.maxHp,
    maxHp: playerStats.maxHp,
    alive: true,
    facingAngleRad: spawnPoint.facingAngleRad ?? -Math.PI / 2,
    invulnerableUntilMs: now + 600,
    weaponRuntimeStates: createArenaSurvivorWeaponRuntimeStates(loadout),
    stats: playerStats,
    materials: carry?.materials ?? 0,
    loadout: cloneLoadout(loadout),
    shop: createEmptyShopState(),
    runStats: createEmptyRunStats(),
    runSummary: cloneRunSummary(carry?.runSummary ?? createEmptyRunSummary()),
    moveInputX: 0,
    moveInputY: 0
  };
}
