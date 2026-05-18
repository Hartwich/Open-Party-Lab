import type {
  MinionsTdBuildInput,
  MinionsTdEnemyCatalogEntry,
  MinionsTdSellInput,
  MinionsTdSendInput,
  MinionsTdUpgradeInput
} from "@open-party-lab/protocol";

export function createMinionsTdBuildInput(
  playerId: string,
  slotId: string,
  towerTypeId: string
): MinionsTdBuildInput {
  return {
    type: "build",
    playerId,
    slotId,
    towerTypeId,
    sentAt: Date.now()
  };
}

export function createMinionsTdUpgradeInput(playerId: string, slotId: string): MinionsTdUpgradeInput {
  return {
    type: "upgrade",
    playerId,
    slotId,
    sentAt: Date.now()
  };
}

export function createMinionsTdSellInput(playerId: string, slotId: string): MinionsTdSellInput {
  return {
    type: "sell",
    playerId,
    slotId,
    sentAt: Date.now()
  };
}

export function createMinionsTdSendInput(
  playerId: string,
  enemyTypeId: string
): MinionsTdSendInput {
  return {
    type: "send",
    playerId,
    enemyTypeId,
    sentAt: Date.now()
  };
}

export function sortMinionsTdEnemiesByPressure(
  enemies: readonly MinionsTdEnemyCatalogEntry[]
): MinionsTdEnemyCatalogEntry[] {
  return [...enemies].sort((left, right) => {
    const costDelta = left.sendCost - right.sendCost;
    if (costDelta !== 0) {
      return costDelta;
    }

    const incomeDelta = left.incomeBonus - right.incomeBonus;
    if (incomeDelta !== 0) {
      return incomeDelta;
    }

    return left.displayName.localeCompare(right.displayName);
  });
}
