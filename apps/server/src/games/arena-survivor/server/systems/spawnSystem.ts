import { createId } from "../../../../core/ids/createId.js";
import { arenaSurvivorConfig } from "../arenaSurvivorConfig.js";
import { createArenaSurvivorEnemy } from "../factories/createEnemy.js";
import type { ArenaSurvivorRuntimeSpawnIndicatorState, ArenaSurvivorRuntimeState } from "../arenaSurvivorState.js";
import { createSeededRandom, distanceSquared } from "../arenaSurvivorState.js";
import { resolveArenaSurvivorDifficulty } from "../difficulty/arenaSurvivorDifficulty.js";
import { arenaSurvivorEnemyDefinitionsById } from "../definitions/enemyDefinitions.js";
import { resolveArenaSurvivorBossWave } from "../directors/arenaSurvivorBossDirector.js";
import {
  pickArenaSurvivorEnemyDefinition,
  resolveArenaSurvivorSpawnBurst
} from "../directors/arenaSurvivorSpawnDirector.js";

function resolveSpawnTarget(state: ArenaSurvivorRuntimeState): { x: number; y: number } {
  const alivePlayers = state.players.filter((player) => player.alive);

  if (alivePlayers.length === 0) {
    return {
      x: state.arenaWidth / 2,
      y: state.arenaHeight / 2
    };
  }

  const total = alivePlayers.reduce(
    (sum, player) => ({
      x: sum.x + player.x,
      y: sum.y + player.y
    }),
    { x: 0, y: 0 }
  );

  return {
    x: total.x / alivePlayers.length,
    y: total.y / alivePlayers.length
  };
}

function createEdgeSpawnPoint(
  state: ArenaSurvivorRuntimeState,
  seed: number,
  forcedSide?: 0 | 1 | 2 | 3
): {
  x: number;
  y: number;
  seed: number;
} {
  const sideRoll = forcedSide === undefined ? createSeededRandom(seed) : null;
  const offsetRoll = createSeededRandom(sideRoll?.seed ?? seed);
  const side = forcedSide ?? Math.floor((sideRoll?.value ?? 0) * 4);
  const margin = arenaSurvivorConfig.enemySpawnMargin;
  const width = state.arenaWidth;
  const height = state.arenaHeight;

  switch (side) {
    case 0:
      return {
        x: margin,
        y: margin + offsetRoll.value * (height - margin * 2),
        seed: offsetRoll.seed
      };
    case 1:
      return {
        x: width - margin,
        y: margin + offsetRoll.value * (height - margin * 2),
        seed: offsetRoll.seed
      };
    case 2:
      return {
        x: margin + offsetRoll.value * (width - margin * 2),
        y: margin,
        seed: offsetRoll.seed
      };
    default:
      return {
        x: margin + offsetRoll.value * (width - margin * 2),
        y: height - margin,
        seed: offsetRoll.seed
      };
  }
}

function resolveClosestPlayerDistanceSquared(
  state: ArenaSurvivorRuntimeState,
  x: number,
  y: number
): number {
  const alivePlayers = state.players.filter((player) => player.alive);

  if (alivePlayers.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return alivePlayers.reduce((closestDistance, player) => {
    const distanceToPlayer = distanceSquared(player.x, player.y, x, y);
    return Math.min(closestDistance, distanceToPlayer);
  }, Number.POSITIVE_INFINITY);
}

function createSafeSpawnPoint(
  state: ArenaSurvivorRuntimeState,
  seed: number,
  forcedSide?: 0 | 1 | 2 | 3
): { x: number; y: number; seed: number } {
  const forbiddenDistance = arenaSurvivorConfig.enemySpawnForbiddenRadius;
  const forbiddenDistanceSquared = forbiddenDistance * forbiddenDistance;
  let nextSeed = seed;
  let bestCandidate: { x: number; y: number; closestPlayerDistanceSquared: number } | null = null;

  for (let attempt = 0; attempt < arenaSurvivorConfig.enemySpawnPointAttemptCount; attempt += 1) {
    const candidate = createEdgeSpawnPoint(state, nextSeed, forcedSide);
    nextSeed = candidate.seed;
    const closestPlayerDistanceSquared = resolveClosestPlayerDistanceSquared(
      state,
      candidate.x,
      candidate.y
    );

    if (
      !bestCandidate ||
      closestPlayerDistanceSquared > bestCandidate.closestPlayerDistanceSquared
    ) {
      bestCandidate = {
        x: candidate.x,
        y: candidate.y,
        closestPlayerDistanceSquared
      };
    }

    if (closestPlayerDistanceSquared >= forbiddenDistanceSquared) {
      return {
        x: candidate.x,
        y: candidate.y,
        seed: nextSeed
      };
    }
  }

  return {
    x: bestCandidate?.x ?? state.arenaWidth / 2,
    y: bestCandidate?.y ?? arenaSurvivorConfig.enemySpawnMargin,
    seed: nextSeed
  };
}

function createSpawnIndicator(
  definitionId: string,
  x: number,
  y: number,
  spawnAtMs: number,
  overrides?: {
    moveSpeed?: number;
    maxHp?: number;
    contactDamage?: number;
  }
): ArenaSurvivorRuntimeSpawnIndicatorState {
  return {
    id: createId("spawn"),
    definitionId,
    x,
    y,
    createdAtMs: Math.max(0, spawnAtMs - arenaSurvivorConfig.enemySpawnWarningLeadMs),
    spawnAtMs,
    moveSpeed: overrides?.moveSpeed,
    maxHp: overrides?.maxHp,
    contactDamage: overrides?.contactDamage
  };
}

function spawnDueIndicators(state: ArenaSurvivorRuntimeState): ArenaSurvivorRuntimeState {
  const dueIndicators = state.spawnIndicators.filter(
    (indicator) => indicator.spawnAtMs <= state.elapsedMs
  );

  if (dueIndicators.length === 0) {
    return state;
  }

  const remainingIndicators = state.spawnIndicators.filter(
    (indicator) => indicator.spawnAtMs > state.elapsedMs
  );
  const spawnedEnemies = [...state.enemies];

  for (const indicator of dueIndicators) {
    spawnedEnemies.push(
      createArenaSurvivorEnemy(
        indicator.definitionId,
        { x: indicator.x, y: indicator.y },
        resolveSpawnTarget(state),
        indicator.spawnAtMs,
        {
          moveSpeed: indicator.moveSpeed,
          maxHp: indicator.maxHp,
          contactDamage: indicator.contactDamage
        }
      )
    );
  }

  return {
    ...state,
    enemies: spawnedEnemies,
    spawnIndicators: remainingIndicators
  };
}

function scheduleBossSpawnIndicator(
  state: ArenaSurvivorRuntimeState,
  spawnAtMs: number,
  definitionId: string,
  difficulty: ReturnType<typeof resolveArenaSurvivorDifficulty>
): { indicator: ArenaSurvivorRuntimeSpawnIndicatorState; seed: number } {
  const bossSpawnPoint = createSafeSpawnPoint(state, state.seed, 2);
  const definition = arenaSurvivorEnemyDefinitionsById[definitionId];

  return {
    indicator: createSpawnIndicator(
      definitionId,
      bossSpawnPoint.x,
      bossSpawnPoint.y,
      spawnAtMs,
      {
        maxHp: definition
          ? Math.max(1, Math.round(definition.maxHp * difficulty.enemyHpMultiplier))
          : undefined
      }
    ),
    seed: bossSpawnPoint.seed
  };
}

function scheduleRegularSpawnIndicator(
  state: ArenaSurvivorRuntimeState,
  spawnAtMs: number,
  seed: number,
  difficulty: ReturnType<typeof resolveArenaSurvivorDifficulty>
): { indicator: ArenaSurvivorRuntimeSpawnIndicatorState; seed: number } {
  const spawnPoint = createSafeSpawnPoint(state, seed);
  const enemyPick = pickArenaSurvivorEnemyDefinition(state.waveNumber, spawnPoint.seed);
  const roundsSinceUnlock = Math.max(0, state.difficultyLevel - enemyPick.definition.minWave);
  const hpMultiplier = Math.pow(
    arenaSurvivorConfig.difficultyEnemyHpMultiplierPerRound,
    roundsSinceUnlock
  ) * difficulty.enemyHpMultiplier;

  return {
    indicator: createSpawnIndicator(enemyPick.definition.id, spawnPoint.x, spawnPoint.y, spawnAtMs, {
      moveSpeed: Math.max(
        40,
        enemyPick.definition.moveSpeed +
          Math.max(0, state.difficultyLevel - enemyPick.definition.minWave) *
            arenaSurvivorConfig.difficultyEnemyWaveSpeedBonus
      ),
      maxHp: Math.max(1, Math.round(enemyPick.definition.maxHp * hpMultiplier)),
      contactDamage:
        enemyPick.definition.contactDamage +
        Math.floor(
          Math.max(0, state.difficultyLevel - enemyPick.definition.minWave) /
            arenaSurvivorConfig.difficultyEnemyContactDamageIncreaseEveryRounds
        )
    }),
    seed: enemyPick.seed
  };
}

export function applySpawnSystem(state: ArenaSurvivorRuntimeState): ArenaSurvivorRuntimeState {
  if (state.phase !== "playing") {
    return state;
  }

  const difficulty = resolveArenaSurvivorDifficulty(
    state.waveNumber,
    state.players.length,
    state.difficultyTier
  );
  const spawnBurst = resolveArenaSurvivorSpawnBurst(state.waveNumber);
  const bossWave = resolveArenaSurvivorBossWave(state.waveNumber);
  let nextState = spawnDueIndicators(state);

  if (
    bossWave &&
    !nextState.spawnedBossDefinitionIds.includes(bossWave.definitionId) &&
    nextState.enemies.length + nextState.spawnIndicators.length < difficulty.maxEnemiesOnScreen &&
    nextState.elapsedMs + arenaSurvivorConfig.enemySpawnWarningLeadMs >= nextState.nextEnemySpawnAtMs
  ) {
    const bossIndicator = scheduleBossSpawnIndicator(
      nextState,
      nextState.nextEnemySpawnAtMs,
      bossWave.definitionId,
      difficulty
    );

    nextState = {
      ...nextState,
      seed: bossIndicator.seed,
      spawnIndicators: [...nextState.spawnIndicators, bossIndicator.indicator],
      spawnedBossDefinitionIds: [...nextState.spawnedBossDefinitionIds, bossWave.definitionId],
      nextEnemySpawnAtMs: nextState.nextEnemySpawnAtMs + difficulty.enemySpawnIntervalMs
    };
  }

  while (
    nextState.elapsedMs + arenaSurvivorConfig.enemySpawnWarningLeadMs >= nextState.nextEnemySpawnAtMs &&
    nextState.enemies.length + nextState.spawnIndicators.length < difficulty.maxEnemiesOnScreen
  ) {
    const spawnCount = Math.min(
      spawnBurst,
      difficulty.maxEnemiesOnScreen - (nextState.enemies.length + nextState.spawnIndicators.length)
    );
    let nextSeed = nextState.seed;
    const scheduledIndicators = [...nextState.spawnIndicators];

    for (let index = 0; index < spawnCount; index += 1) {
      const scheduledIndicator = scheduleRegularSpawnIndicator(
        nextState,
        nextState.nextEnemySpawnAtMs,
        nextSeed,
        difficulty
      );
      nextSeed = scheduledIndicator.seed;
      scheduledIndicators.push(scheduledIndicator.indicator);
    }

    nextState = {
      ...nextState,
      seed: nextSeed,
      nextEnemySpawnAtMs: nextState.nextEnemySpawnAtMs + difficulty.enemySpawnIntervalMs,
      spawnIndicators: scheduledIndicators
    };
  }

  return nextState;
}
