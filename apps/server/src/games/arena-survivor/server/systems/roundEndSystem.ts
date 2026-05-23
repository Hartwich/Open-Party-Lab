import { transitionRoundState } from "@open-party-lab/game-core";
import { arenaSurvivorConfig } from "../arenaSurvivorConfig.js";
import {
  countAlivePlayers,
  createEmptyShopState,
  type ArenaSurvivorRuntimeState
} from "../arenaSurvivorState.js";
import { createArenaSurvivorShopsForPlayers } from "../loadout/arenaSurvivorLoadout.js";

function resolveHarvestingReward(harvesting: number, waveNumber: number): number {
  if (harvesting <= 0) {
    return 0;
  }

  return Math.floor(harvesting * (1 + Math.max(0, waveNumber - 1) * 0.03));
}

export function resolveRoundEndSystem(
  state: ArenaSurvivorRuntimeState,
  now: number
): ArenaSurvivorRuntimeState {
  if (state.phase !== "playing") {
    return state;
  }

  const alivePlayers = countAlivePlayers(state.players);
  const timerExpired = state.remainingMs <= 0 || state.elapsedMs >= arenaSurvivorConfig.roundDurationMs;
  const teamDefeated = alivePlayers === 0;

  if (!teamDefeated && !timerExpired) {
    return state;
  }

  const survived = timerExpired && alivePlayers > 0;
  const en = state.language === "en";
  const title = survived
    ? en ? `Wave ${state.waveNumber} cleared` : `Welle ${state.waveNumber} geschafft`
    : en ? `Run ended in wave ${state.waveNumber}` : `Run beendet in Welle ${state.waveNumber}`;
  const playersWithHarvesting = survived
    ? state.players.map((player) => {
      const harvestingReward = resolveHarvestingReward(player.stats.harvesting, state.waveNumber);

      if (harvestingReward <= 0) {
        return player;
      }

      return {
        ...player,
        materials: player.materials + harvestingReward,
        runStats: {
          ...player.runStats,
          materialsCollected: player.runStats.materialsCollected + harvestingReward
        }
      };
    })
    : state.players;
  const shopRoll = survived
    ? createArenaSurvivorShopsForPlayers(playersWithHarvesting, state.waveNumber, state.seed, state.language)
    : { shopsByPlayerId: new Map<string, typeof state.players[number]["shop"]>(), seed: state.seed };
  const nextPlayers = playersWithHarvesting.map((player) => ({
    ...player,
    shop: shopRoll.shopsByPlayerId.get(player.playerId) ?? {
      ...createEmptyShopState()
    },
    runSummary: {
      ...player.runSummary,
      wavesCleared: player.runSummary.wavesCleared + (survived ? 1 : 0),
      totalKills: player.runSummary.totalKills + player.runStats.kills,
      totalMaterialsCollected: player.runSummary.totalMaterialsCollected + player.runStats.materialsCollected,
      totalSurvivedMs: player.runSummary.totalSurvivedMs + player.runStats.survivedMs,
      totalShotsFired: player.runSummary.totalShotsFired + player.runStats.shotsFired,
      totalHitsLanded: player.runSummary.totalHitsLanded + player.runStats.hitsLanded,
      totalDamageTaken: player.runSummary.totalDamageTaken + player.runStats.damageTaken
    }
  }));

  return transitionRoundState(
    {
      ...state,
      seed: shopRoll.seed,
      remainingMs: 0,
      players: nextPlayers,
      result: {
        outcome: survived ? "survived" : "defeated",
        reason: survived ? "time_limit" : "player_dead",
        title
      },
      debugInfo: {
        enemySpawnCooldownMs: Math.max(0, state.nextEnemySpawnAtMs - state.elapsedMs),
        enemyCount: state.enemies.length,
        pickupCount: state.pickups.length,
        projectileCount: state.projectiles.length,
        alivePlayerCount: alivePlayers
      }
    },
    "locked",
    now,
    {
      durationMs: arenaSurvivorConfig.lockedMs,
      message: title
    }
  );
}
