import { arenaSurvivorConfig } from "../arenaSurvivorConfig.js";
import { distanceSquared } from "../arenaSurvivorState.js";
import type {
  ArenaSurvivorRuntimePickupState,
  ArenaSurvivorRuntimePlayerState,
  ArenaSurvivorRuntimeState
} from "../arenaSurvivorState.js";

function awardPickupToPlayer(
  players: ArenaSurvivorRuntimePlayerState[],
  playerIndex: number,
  pickup: ArenaSurvivorRuntimePickupState
): void {
  const player = players[playerIndex];

  if (pickup.kind === "material") {
    players[playerIndex] = {
      ...player,
      materials: player.materials + pickup.value,
      runStats: {
        ...player.runStats,
        materialsCollected: player.runStats.materialsCollected + pickup.value
      }
    };
    return;
  }

  players[playerIndex] = {
    ...player,
    hp: Math.min(player.maxHp, player.hp + pickup.value)
  };
}

function findHealthPickupCollector(
  players: ArenaSurvivorRuntimePlayerState[],
  pickup: ArenaSurvivorRuntimePickupState
): number {
  return players.findIndex((player) => {
    if (!player.alive) {
      return false;
    }

    const hitDistance = player.radius + pickup.radius;
    return distanceSquared(player.x, player.y, pickup.x, pickup.y) <= hitDistance * hitDistance;
  });
}

function findMaterialMagnetTarget(
  players: ArenaSurvivorRuntimePlayerState[],
  pickup: ArenaSurvivorRuntimePickupState
): number {
  let bestIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < players.length; index += 1) {
    const player = players[index];

    if (!player.alive) {
      continue;
    }

    const magnetDistance = player.stats.pickupRadius + pickup.radius;
    const pickupDistance = distanceSquared(player.x, player.y, pickup.x, pickup.y);

    if (pickupDistance > magnetDistance * magnetDistance || pickupDistance >= bestDistance) {
      continue;
    }

    bestIndex = index;
    bestDistance = pickupDistance;
  }

  return bestIndex;
}

function resolvePickupTravelSpeed(distance: number): number {
  return Math.min(
    arenaSurvivorConfig.pickupMagnetMaxSpeed,
    arenaSurvivorConfig.pickupMagnetBaseSpeed +
      distance * arenaSurvivorConfig.pickupMagnetDistanceFactor
  );
}

function moveMaterialPickupTowardPlayer(
  pickup: ArenaSurvivorRuntimePickupState,
  player: ArenaSurvivorRuntimePlayerState,
  deltaSeconds: number
): ArenaSurvivorRuntimePickupState {
  const deltaX = player.x - pickup.x;
  const deltaY = player.y - pickup.y;
  const distance = Math.hypot(deltaX, deltaY);

  if (distance <= 0.001) {
    return {
      ...pickup,
      targetPlayerId: player.playerId
    };
  }

  const moveDistance = Math.min(distance, resolvePickupTravelSpeed(distance) * deltaSeconds);
  const directionX = deltaX / distance;
  const directionY = deltaY / distance;

  return {
    ...pickup,
    x: pickup.x + directionX * moveDistance,
    y: pickup.y + directionY * moveDistance,
    targetPlayerId: player.playerId
  };
}

export function applyPickupSystem(
  state: ArenaSurvivorRuntimeState,
  deltaMs: number
): ArenaSurvivorRuntimeState {
  if (state.phase !== "playing") {
    return state;
  }

  const deltaSeconds = Math.max(0.001, deltaMs / 1000);
  const nextPlayers = [...state.players];
  const nextPickups: ArenaSurvivorRuntimePickupState[] = [];

  for (const pickup of state.pickups) {
    const nextAgeMs = pickup.ageMs + deltaMs;

    if (nextAgeMs >= pickup.lifetimeMs) {
      continue;
    }

    const agedPickup: ArenaSurvivorRuntimePickupState = {
      ...pickup,
      ageMs: nextAgeMs
    };

    if (pickup.kind === "health") {
      const collectorIndex = findHealthPickupCollector(nextPlayers, agedPickup);

      if (collectorIndex >= 0) {
        awardPickupToPlayer(nextPlayers, collectorIndex, agedPickup);
        continue;
      }

      nextPickups.push({
        ...agedPickup,
        targetPlayerId: null
      });
      continue;
    }

    let targetPlayerIndex =
      pickup.targetPlayerId === null
        ? -1
        : nextPlayers.findIndex(
          (player) => player.playerId === pickup.targetPlayerId && player.alive
        );

    if (targetPlayerIndex === -1) {
      targetPlayerIndex = findMaterialMagnetTarget(nextPlayers, agedPickup);
    }

    if (targetPlayerIndex === -1) {
      nextPickups.push({
        ...agedPickup,
        targetPlayerId: null
      });
      continue;
    }

    const targetPlayer = nextPlayers[targetPlayerIndex];
    const collectDistance = targetPlayer.radius + agedPickup.radius;
    const collectDistanceSquared = collectDistance * collectDistance;

    if (
      distanceSquared(targetPlayer.x, targetPlayer.y, agedPickup.x, agedPickup.y) <=
      collectDistanceSquared
    ) {
      awardPickupToPlayer(nextPlayers, targetPlayerIndex, agedPickup);
      continue;
    }

    const movedPickup = moveMaterialPickupTowardPlayer(agedPickup, targetPlayer, deltaSeconds);

    if (
      distanceSquared(targetPlayer.x, targetPlayer.y, movedPickup.x, movedPickup.y) <=
      collectDistanceSquared
    ) {
      awardPickupToPlayer(nextPlayers, targetPlayerIndex, movedPickup);
      continue;
    }

    nextPickups.push(movedPickup);
  }

  return {
    ...state,
    players: nextPlayers,
    pickups: nextPickups
  };
}
