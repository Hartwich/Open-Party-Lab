import type {
  ArenaSurvivorMoveInput,
  ArenaSurvivorShopBuyInput,
  ArenaSurvivorShopCombineInput,
  ArenaSurvivorShopSellInput,
  ArenaSurvivorShopRerollInput
} from "@open-party-lab/protocol";

function normalizeMove(moveX: number, moveY: number): { moveX: number; moveY: number } {
  const magnitude = Math.hypot(moveX, moveY);

  if (magnitude <= 1 || magnitude === 0) {
    return { moveX, moveY };
  }

  return {
    moveX: moveX / magnitude,
    moveY: moveY / magnitude
  };
}

export function createArenaSurvivorMoveInput(
  playerId: string,
  moveX: number,
  moveY: number
): ArenaSurvivorMoveInput {
  const normalized = normalizeMove(moveX, moveY);

  return {
    type: "move",
    playerId,
    moveX: normalized.moveX,
    moveY: normalized.moveY,
    sentAt: Date.now()
  };
}

export function createArenaSurvivorShopInput(
  playerId: string,
  offerId: string
): ArenaSurvivorShopBuyInput {
  return {
    type: "shop:buy",
    playerId,
    offerId,
    sentAt: Date.now()
  };
}

export function createArenaSurvivorShopRerollInput(
  playerId: string
): ArenaSurvivorShopRerollInput {
  return {
    type: "shop:reroll",
    playerId,
    sentAt: Date.now()
  };
}

export function createArenaSurvivorShopSellInput(
  playerId: string,
  weaponInstanceId: string
): ArenaSurvivorShopSellInput {
  return {
    type: "shop:sell",
    playerId,
    weaponInstanceId,
    sentAt: Date.now()
  };
}

export function createArenaSurvivorShopCombineInput(
  playerId: string,
  weaponInstanceId: string
): ArenaSurvivorShopCombineInput {
  return {
    type: "shop:combine",
    playerId,
    weaponInstanceId,
    sentAt: Date.now()
  };
}
