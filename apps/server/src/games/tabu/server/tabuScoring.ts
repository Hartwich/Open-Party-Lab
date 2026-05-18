import type { ScoreEntry } from "@open-party-lab/game-core";
import type { TabuMode, TabuTeamId } from "@open-party-lab/protocol";

interface BuildTabuScoreEntriesParams {
  mode: TabuMode;
  solvedByPlayerId: Record<string, number>;
  solvedByTeamId: Record<TabuTeamId, number>;
  teamMembersByTeamId: Record<TabuTeamId, string[]>;
}

export function buildTabuScoreEntries(params: BuildTabuScoreEntriesParams): ScoreEntry[] {
  if (params.mode === "team") {
    return (["team1", "team2"] as const).flatMap((teamId) => {
      const score = params.solvedByTeamId[teamId] ?? 0;

      if (score <= 0) {
        return [];
      }

      return (params.teamMembersByTeamId[teamId] ?? []).map((playerId) => ({
        playerId,
        delta: score,
        reason: `Tabu Team ${teamId === "team1" ? 1 : 2}`
      }));
    });
  }

  return Object.entries(params.solvedByPlayerId)
    .filter(([, solved]) => solved > 0)
    .map(([playerId, solved]) => ({
      playerId,
      delta: solved,
      reason: "Tabu korrekt geraten"
    }));
}
